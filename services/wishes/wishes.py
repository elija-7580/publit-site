#!/usr/bin/env python3
"""Publit feature requests ("Wünsche") with voting, no login.

A tiny HTTP service (Python standard library + SQLite) that Caddy proxies at /api/wishes.

  GET  /api/wishes?sort=top|new           list of visible wishes
  POST /api/wishes                         {"title", "body", "lang", "website"}  (website = honeypot, must be empty)
  POST /api/wishes/<id>/vote               {"voter"}  toggles the vote of this voter
  GET  /api/wishes/health

Privacy: no accounts, no cookies. The browser sends a random voter id it keeps in localStorage.
IP addresses are never stored: they are hashed with a salt that changes every day and lives only in
memory, and only to limit how often one address can post or vote.

Admin (on the server):
  wishes.py serve [--port 8787] [--db /var/lib/publit-wishes/wishes.db]
  wishes.py list | hide <id> | show <id> | status <id> <open|planned|doing|done> | delete <id>
"""
import argparse, hashlib, json, os, re, secrets, sqlite3, sys, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB = os.environ.get("WISHES_DB", "/var/lib/publit-wishes/wishes.db")
STATUSES = ("open", "planned", "doing", "done")
LIMITS = {"post": (3, 3600), "vote": (60, 3600)}     # per hashed address: count per seconds
MAX_BODY = 4000

SCHEMA = """
create table if not exists wishes(
  id integer primary key, title text not null, body text not null default '', lang text not null default 'de',
  status text not null default 'open', hidden integer not null default 0, created integer not null);
create table if not exists votes(
  wish integer not null references wishes(id) on delete cascade, voter text not null, created integer not null,
  primary key(wish, voter));
"""

_lock = threading.Lock()
_hits = {}
_salt = {"day": None, "salt": b""}


def db(path=None):
    c = sqlite3.connect(path or DB, timeout=10)
    c.row_factory = sqlite3.Row
    c.execute("pragma foreign_keys=on")
    c.executescript(SCHEMA)
    return c


def addr_key(ip):
    day = time.strftime("%Y-%m-%d", time.gmtime())
    if _salt["day"] != day:
        _salt.update(day=day, salt=secrets.token_bytes(16))
        _hits.clear()
    return hashlib.sha256(_salt["salt"] + ip.encode()).hexdigest()[:20]


def allowed(kind, key):
    n, window = LIMITS[kind]
    now = time.time()
    with _lock:
        h = [t for t in _hits.get((kind, key), []) if now - t < window]
        if len(h) >= n:
            _hits[(kind, key)] = h
            return False
        h.append(now)
        _hits[(kind, key)] = h
        return True


def clean(s, n):
    s = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", "", str(s or "")).strip()
    return re.sub(r"[ \t]+", " ", s)[:n]


def listing(c, sort, voter):
    order = "votes desc, w.created desc" if sort != "new" else "w.created desc"
    rows = c.execute(f"""select w.id, w.title, w.body, w.lang, w.status, w.created,
        (select count(*) from votes v where v.wish = w.id) as votes,
        exists(select 1 from votes v where v.wish = w.id and v.voter = ?) as mine
        from wishes w where w.hidden = 0 order by {order} limit 500""", (voter or "",)).fetchall()
    return [dict(r) | {"mine": bool(r["mine"])} for r in rows]


class Handler(BaseHTTPRequestHandler):
    server_version = "publit-wishes"

    def _ip(self):
        return (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()

    def _send(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BODY:
            return None
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return None

    def log_message(self, fmt, *args):      # no addresses in the log
        sys.stderr.write("%s %s\n" % (self.command, self.path.split("?")[0]))

    def do_GET(self):
        path, _, q = self.path.partition("?")
        if path.rstrip("/") == "/api/wishes/health":
            return self._send(200, {"ok": True})
        if path.rstrip("/") != "/api/wishes":
            return self._send(404, {"error": "not found"})
        args = dict(p.split("=", 1) for p in q.split("&") if "=" in p)
        with db() as c:
            self._send(200, {"wishes": listing(c, args.get("sort", "top"), clean(args.get("voter"), 64))})

    def do_POST(self):
        path = self.path.split("?")[0].rstrip("/")
        data = self._json()
        if data is None:
            return self._send(400, {"error": "bad request"})
        key = addr_key(self._ip())
        if path == "/api/wishes":
            if data.get("website"):                                  # honeypot: pretend it worked
                return self._send(201, {"ok": True})
            title, body = clean(data.get("title"), 120), clean(data.get("body"), 1500)
            if len(title) < 6:
                return self._send(422, {"error": "title"})
            if re.search(r"https?://", title, re.I) or len(re.findall(r"https?://", body, re.I)) > 2:
                return self._send(422, {"error": "links"})
            lang = "en" if data.get("lang") == "en" else "de"
            with db() as c:
                if c.execute("select 1 from wishes where lower(title) = lower(?)", (title,)).fetchone():
                    return self._send(409, {"error": "exists"})
                if not allowed("post", key):
                    return self._send(429, {"error": "slow down"})
                cur = c.execute("insert into wishes(title, body, lang, created) values(?,?,?,?)", (title, body, lang, int(time.time())))
                voter = clean(data.get("voter"), 64)
                if re.fullmatch(r"[A-Za-z0-9_-]{16,64}", voter or ""):
                    c.execute("insert or ignore into votes values(?,?,?)", (cur.lastrowid, voter, int(time.time())))
            return self._send(201, {"ok": True, "id": cur.lastrowid})
        m = re.fullmatch(r"/api/wishes/(\d+)/vote", path)
        if m:
            voter = clean(data.get("voter"), 64)
            if not re.fullmatch(r"[A-Za-z0-9_-]{16,64}", voter or ""):
                return self._send(422, {"error": "voter"})
            if not allowed("vote", key):
                return self._send(429, {"error": "slow down"})
            wid = int(m.group(1))
            with db() as c:
                if not c.execute("select 1 from wishes where id = ? and hidden = 0", (wid,)).fetchone():
                    return self._send(404, {"error": "not found"})
                if c.execute("delete from votes where wish = ? and voter = ?", (wid, voter)).rowcount == 0:
                    c.execute("insert into votes values(?,?,?)", (wid, voter, int(time.time())))
                    mine = True
                else:
                    mine = False
                votes = c.execute("select count(*) from votes where wish = ?", (wid,)).fetchone()[0]
            return self._send(200, {"ok": True, "votes": votes, "mine": mine})
        self._send(404, {"error": "not found"})


def main():
    global DB
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=DB)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("serve"); s.add_argument("--port", type=int, default=8787); s.add_argument("--host", default="127.0.0.1")
    sub.add_parser("list")
    for name in ("hide", "show", "delete"):
        sub.add_parser(name).add_argument("id", type=int)
    st = sub.add_parser("status"); st.add_argument("id", type=int); st.add_argument("status", choices=STATUSES)
    a = ap.parse_args()
    DB = a.db
    os.makedirs(os.path.dirname(os.path.abspath(DB)), exist_ok=True)
    if a.cmd == "serve":
        db().close()
        print(f"wishes on {a.host}:{a.port}, db {DB}", flush=True)
        ThreadingHTTPServer((a.host, a.port), Handler).serve_forever()
    with db() as c:
        if a.cmd == "list":
            for r in c.execute("select w.*, (select count(*) from votes v where v.wish=w.id) n from wishes w order by n desc"):
                print(f"{r['id']:4} {r['n']:4} {r['status']:8} {'HIDDEN ' if r['hidden'] else ''}{r['title']}")
        elif a.cmd in ("hide", "show"):
            c.execute("update wishes set hidden = ? where id = ?", (1 if a.cmd == "hide" else 0, a.id))
        elif a.cmd == "status":
            c.execute("update wishes set status = ? where id = ?", (a.status, a.id))
        elif a.cmd == "delete":
            c.execute("delete from wishes where id = ?", (a.id,))


if __name__ == "__main__":
    main()
