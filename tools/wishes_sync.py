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
Run: python3 tools/wishes_sync.py   (GH_TOKEN optional, raises the API rate limit)
"""
import json, os, re, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = os.environ.get("WISHES_API", "https://publit.eu/api/wishes?sort=new")
TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
ISSUE = re.compile(r"github\.com/([\w.-]+/[\w.-]+)/issues/(\d+)|\b([\w.-]+/[\w.-]+)#(\d+)\b")


def get(url):
    h = {"Accept": "application/vnd.github+json", "User-Agent": "publit-wishes-sync"}
    if TOKEN and "api.github.com" in url:
        h["Authorization"] = f"Bearer {TOKEN}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=30) as r:
        return json.load(r)


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


def main():
    links = json.loads((ROOT / "wuensche/links.json").read_text())
    overrides = json.loads((ROOT / "wuensche/overrides.json").read_text())
    wishes = get(API)["wishes"]
    cache, out = {}, {}
    for w in wishes:
        rs = set(refs(w.get("body"))) | set(refs(" ".join(links.get(str(w["id"]), []))))
        for r in rs:
            if r not in cache:
                cache[r] = issue_state(*r)
        st = combine([cache[r] for r in rs])
        entry = dict(overrides.get(str(w["id"]), {}))
        if st != "open":
            entry["status"] = st
        if entry:
            out[str(w["id"])] = entry
    text = json.dumps(dict(sorted(out.items(), key=lambda kv: int(kv[0]))), indent=2, ensure_ascii=False) + "\n"
    path = ROOT / "wuensche/status.json"
    changed = not path.exists() or path.read_text() != text
    path.write_text(text)
    print(text, "changed" if changed else "unchanged", file=sys.stderr)


if __name__ == "__main__":
    main()
