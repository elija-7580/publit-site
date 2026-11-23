#!/usr/bin/env python3
"""Writes wuensche/status.json from GitHub, so the wish board never needs manual updates.

Each wish is linked to GitHub issues: issue URLs in the wish text, plus wuensche/links.json
({"<wish id>": ["elija-7580/Publit#88", ...]}). Status per wish, from its linked issues:

  done     every linked issue has the label "released" (shipped in a store build)
  doing    any issue is closed as completed (built, waiting for the release),
           has the label "in progress", or has an open pull request referencing it
  planned  any issue has the label "planned"
  open     everything else (and wishes without a linked issue)

Wording fixes (title/body) come from wuensche/overrides.json and are kept as they are.
status.json also lists each wish's issues ("issues"), so the pages can link to them.

New wishes become GitHub issues by themselves (only with WISHES_ISSUE_TOKEN, a token that may
write issues in WISHES_ISSUE_REPO; it stays in GitHub Actions, the wish server never sees it).
To keep spam out of the tracker a wish is filed only when it has no issue yet, is still "open",
is at least WISHES_ISSUE_MIN_HOURS old (default 24, time to hide it on the server) and has at
least WISHES_ISSUE_MIN_VOTES votes (default 2: the author's own plus one more); at most
WISHES_ISSUE_MAX_PER_RUN (default 5) per run. The new issue is written to wuensche/links.json.
A hidden marker in the issue (<!-- publit-wish:<id> -->) keeps a wish from being filed twice.

wuensche/roadmap.json lists GitHub issues with the label "roadmap" (in ROADMAP_REPOS) that no wish
links to, with the same status rules (open = later). The features page shows them on its board.
Optional labels "area:plan|go|map|tix|dev|com" and "ios"/"android"/"watch"; German short texts
come from wuensche/overrides.json, keyed by "owner/repo#123".

Run: python3 tools/wishes_sync.py   (GH_TOKEN optional, raises the API rate limit)
"""
import json, os, re, sys, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = os.environ.get("WISHES_API", "https://publit.eu/api/wishes?sort=new")
TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
ISSUE_TOKEN = os.environ.get("WISHES_ISSUE_TOKEN")
ISSUE_REPO = os.environ.get("WISHES_ISSUE_REPO") or "elija-7580/Publit"
MIN_HOURS = float(os.environ.get("WISHES_ISSUE_MIN_HOURS") or 24)
MIN_VOTES = int(os.environ.get("WISHES_ISSUE_MIN_VOTES") or 2)
MAX_PER_RUN = int(os.environ.get("WISHES_ISSUE_MAX_PER_RUN") or 5)
ROADMAP_REPOS = (os.environ.get("ROADMAP_REPOS") or "elija-7580/Publit,elija-7580/Publit-Android").split(",")
AREAS = {"plan", "go", "map", "tix", "dev", "com"}
MARKER = re.compile(r"<!-- publit-wish:(\d+) -->")
ISSUE = re.compile(r"github\.com/([\w.-]+/[\w.-]+)/issues/(\d+)|\b([\w.-]+/[\w.-]+)#(\d+)\b")


def get(url, token=None, method="GET", data=None):
    h = {"Accept": "application/vnd.github+json", "User-Agent": "publit-wishes-sync"}
    token = token or TOKEN
    if token and "api.github.com" in url:
        h["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def all_pages(url, token=None):
    out, page = [], 1
    while True:
        batch = get(f"{url}{'&' if '?' in url else '?'}per_page=100&page={page}", token)
        out += batch
        if len(batch) < 100 or page >= 20:
            return out
        page += 1


def ref_text(repo, n):
    return f"{repo}#{n}"


def defang(text):
    """Wish text is written by anyone: no @mentions and no #123 cross-references in the tracker."""
    text = re.sub(r"@(?=\w)", "@\u200b", text or "")
    return re.sub(r"(?<![\w/])#(?=\d)", "#\u200b", text)


def issue_body(w):
    quoted = "\n".join("> " + line if line else ">" for line in defang(w.get("body") or "").splitlines()) or "> (no details)"
    return (f"{quoted}\n\n"
            f"Wish #{w['id']} from the [Publit wish list](https://publit.eu/wuensche/) "
            f"({w.get('lang', 'en')}, {w['votes']} votes when filed). Filed automatically; "
            f"the wish's status on publit.eu follows this issue (labels `planned`, `in progress`, `released`).\n\n"
            f"<!-- publit-wish:{w['id']} -->\n")


def to_file(wishes, linked, now=None):
    """Wishes that should get an issue now (oldest first), see the module docstring."""
    now = now or time.time()
    c = [w for w in wishes if w["id"] not in linked and w.get("status", "open") == "open"
         and now - w.get("created", now) >= MIN_HOURS * 3600 and w.get("votes", 0) >= MIN_VOTES]
    return sorted(c, key=lambda w: w["id"])[:MAX_PER_RUN]


def file_issues(wishes, links):
    """Creates issues for new wishes and records them in links. Returns how many were linked."""
    if not ISSUE_TOKEN:
        print("WISHES_ISSUE_TOKEN not set: no issues filed", file=sys.stderr)
        return 0
    linked = {int(k) for k, v in links.items() if v}
    linked |= {w["id"] for w in wishes if any(refs(w.get("body")))}
    api = f"https://api.github.com/repos/{ISSUE_REPO}"
    # Issues filed earlier (also if links.json was not saved then): find them by their marker.
    known = {}
    try:
        for i in all_pages(f"{api}/issues?labels=wish&state=all", ISSUE_TOKEN):
            m = MARKER.search(i.get("body") or "")
            if m:
                known.setdefault(int(m.group(1)), i["number"])
    except urllib.error.HTTPError as e:
        print(f"Could not list issues in {ISSUE_REPO}: {e}", file=sys.stderr)
        return 0
    n = 0
    for wid, num in known.items():
        if wid not in linked and any(w["id"] == wid for w in wishes):
            links[str(wid)] = [ref_text(ISSUE_REPO, num)]; linked.add(wid); n += 1
    try:
        get(f"{api}/labels", ISSUE_TOKEN, "POST", {"name": "wish", "color": "ffc531", "description": "From the wish list on publit.eu"})
    except urllib.error.HTTPError:
        pass                                  # 422: the label is already there
    for w in to_file(wishes, linked):
        title = defang(" ".join(w["title"].split()))[:200]
        try:
            i = get(f"{api}/issues", ISSUE_TOKEN, "POST", {"title": title, "body": issue_body(w), "labels": ["wish"]})
        except urllib.error.HTTPError as e:
            print(f"Could not file wish {w['id']}: {e}", file=sys.stderr)
            break
        links[str(w["id"])] = [ref_text(ISSUE_REPO, i["number"])]
        print(f"Wish {w['id']} -> {i['html_url']}", file=sys.stderr)
        n += 1
    return n


def refs(text):
    for m in ISSUE.finditer(text or ""):
        yield (m.group(1) or m.group(3)).lower(), int(m.group(2) or m.group(4))


def issue_state(repo, n):
    i = get(f"https://api.github.com/repos/{repo}/issues/{n}")
    labels = {l["name"].lower() for l in i.get("labels", [])}
    if "released" in labels:
        return "done"
    if i["state"] == "closed":
        return "doing" if i.get("state_reason") == "completed" else None
    if "in progress" in labels:
        return "doing"
    for e in get(f"https://api.github.com/repos/{repo}/issues/{n}/timeline?per_page=100"):
        src = (e.get("source") or {}).get("issue") or {}
        if e.get("event") == "cross-referenced" and src.get("pull_request") and src.get("state") == "open":
            return "doing"
    return "planned" if "planned" in labels else "open"


def combine(states):
    states = [s for s in states if s]
    if not states:
        return "open"
    if all(s == "done" for s in states):
        return "done"
    if "doing" in states or "done" in states:   # partly shipped counts as still being built
        return "doing"
    return "planned" if "planned" in states else "open"


def roadmap(cache, overrides, linked_refs):
    """GitHub issues labelled "roadmap" that no wish covers, for the features page."""
    out = []
    for repo in ROADMAP_REPOS:
        repo = repo.strip()
        if not repo:
            continue
        try:
            issues = all_pages(f"https://api.github.com/repos/{repo}/issues?labels=roadmap&state=all")
        except urllib.error.HTTPError as e:
            print(f"Could not read the roadmap of {repo}: {e}", file=sys.stderr)
            continue
        for i in issues:
            if i.get("pull_request"):
                continue
            r = (repo.lower(), i["number"])
            if r in linked_refs:
                continue
            if r not in cache:
                cache[r] = issue_state(*r)
            if cache[r] is None:                # closed as not planned
                continue
            labels = {l["name"].lower() for l in i.get("labels", [])}
            area = next((l.split(":", 1)[1].strip() for l in labels if l.startswith("area:") and l.split(":", 1)[1].strip() in AREAS), "")
            platforms = "".join(p for p, names in (("i", {"ios", "iphone"}), ("A", {"android"}), ("W", {"watch", "wear os"})) if labels & names)
            if not platforms:
                platforms = "A" if "android" in repo.lower() else "iA"
            o = overrides.get(ref_text(repo, i["number"]), {}).get("short", {})
            out.append({"ref": ref_text(repo, i["number"]), "url": i["html_url"], "status": cache[r],
                        "area": o.get("area") or area or "com", "platforms": platforms,
                        "de": o.get("de") or i["title"], "en": o.get("en") or i["title"],
                        "deX": o.get("deX", ""), "enX": o.get("enX", "")})
    return sorted(out, key=lambda x: x["ref"])


def write(name, data):
    text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    path = ROOT / "wuensche" / name
    changed = not path.exists() or path.read_text() != text
    path.write_text(text)
    print(f"{name}: {'changed' if changed else 'unchanged'}", file=sys.stderr)


def main():
    links = json.loads((ROOT / "wuensche/links.json").read_text())
    overrides = json.loads((ROOT / "wuensche/overrides.json").read_text())
    wishes = get(API)["wishes"]
    if file_issues(wishes, links):
        write("links.json", dict(sorted(links.items(), key=lambda kv: int(kv[0]))))
    cache, out, linked_refs = {}, {}, set()
    for w in wishes:
        rs = set(refs(w.get("body"))) | set(refs(" ".join(links.get(str(w["id"]), []))))
        linked_refs |= rs
        for r in rs:
            if r not in cache:
                cache[r] = issue_state(*r)
        st = combine([cache[r] for r in rs])
        entry = dict(overrides.get(str(w["id"]), {}))
        if st != "open":
            entry["status"] = st
        if rs:
            entry["issues"] = [f"https://github.com/{repo}/issues/{n}" for repo, n in sorted(rs)]
        if entry:
            out[str(w["id"])] = entry
    write("status.json", dict(sorted(out.items(), key=lambda kv: int(kv[0]))))
    write("roadmap.json", roadmap(cache, overrides, linked_refs))


if __name__ == "__main__":
    main()
