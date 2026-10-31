import json, os, subprocess, sys, tempfile, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8799


def call(method, path, body=None, ip="198.51.100.1"):
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", "X-Forwarded-For": ip})
    try:
        r = urllib.request.urlopen(req); return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def main():
    d = tempfile.mkdtemp()
    p = subprocess.Popen([sys.executable, os.path.join(HERE, "wishes.py"), "--db", os.path.join(d, "w.db"), "serve", "--port", str(PORT)])
    try:
        time.sleep(0.8)
        V = "voter_abcdefghijklmnop"
        assert call("GET", "/api/wishes/health") == (200, {"ok": True})
        assert call("POST", "/api/wishes", {"title": "kurz"})[0] == 422
        s, r = call("POST", "/api/wishes", {"title": "CarPlay-Unterstützung", "voter": V}); assert s == 201
        wid = r["id"]
        assert call("POST", "/api/wishes", {"title": "carplay-unterstützung"})[0] == 409
        assert call("POST", "/api/wishes", {"title": "Bot bot bot bot", "website": "x"})[0] == 201
        assert call("POST", "/api/wishes", {"title": "Link http://x.example"})[0] == 422
        s, r = call("GET", f"/api/wishes?voter={V}")
        assert [w["title"] for w in r["wishes"]] == ["CarPlay-Unterstützung"] and r["wishes"][0]["votes"] == 1 and r["wishes"][0]["mine"]
        assert call("POST", f"/api/wishes/{wid}/vote", {"voter": V})[1]["votes"] == 0
        assert call("POST", f"/api/wishes/{wid}/vote", {"voter": "short"})[0] == 422
        assert call("POST", "/api/wishes/999/vote", {"voter": V})[0] == 404
        for t in ("Zweiter Wunsch hier", "Dritter Wunsch hier"):
            assert call("POST", "/api/wishes", {"title": t}, ip="198.51.100.2")[0] == 201
        call("POST", "/api/wishes", {"title": "Vierter Wunsch hier"}, ip="198.51.100.2")
        assert call("POST", "/api/wishes", {"title": "Fünfter Wunsch hier"}, ip="198.51.100.2")[0] == 429
        print("ok")
    finally:
        p.terminate()


if __name__ == "__main__":
    main()
