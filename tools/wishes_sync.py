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

New wishes become GitHub issues by themselves: the workflow "Wishes to issues" in
elija-7580/Publit files them with its own token (spam rules there: 24 h old, 2 votes, 5 per run).
Each such issue carries a marker <!-- publit-wish:<id> -->; this script finds those issues
(label "wish" in WISH_ISSUE_REPO, read only) and writes the link to wuensche/links.json.

wuensche/roadmap.json lists GitHub issues with the label "roadmap" (in ROADMAP_REPOS) that no wish
links to, with the same status rules (open = later). The features page shows them on its board.
Optional labels "area:plan|go|map|tix|dev|com" and "ios"/"android"/"watch"; German short texts
come from wuensche/overrides.json, keyed by "owner/repo#123".

Run: python3 tools/wishes_sync.py   (GH_TOKEN optional, raises the API rate limit)
"""
import json, os, re, sys, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = os.environ.get("WISHES_API", "https://publit.eu/api/wishes?sort=new")
TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
WISH_ISSUE_REPO = os.environ.get("WISH_ISSUE_REPO") or "elija-7580/Publit"
ROADMAP_REPOS = (os.environ.get("ROADMAP_REPOS") or "elija-7580/Publit,elija-7580/Publit-Android").split(",")
AREAS = {"plan", "go", "map", "tix", "dev", "com"}
MARKER = re.compile(r"<!-- publit-wish:(\d+) -->")
ISSUE = re.compile(r"github\.com/([\w.-]+/[\w.-]+)/issues/(\d+)|\b([\w.-]+/[\w.-]+)#(\d+)\b")


def get(url, auth=True):
    h = {"Accept": "application/vnd.github+json", "User-Agent": "publit-wishes-sync"}
    if auth and TOKEN and "api.github.com" in url:
        h["Authorization"] = f"Bearer {TOKEN}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=30) as r:
        return json.load(r)


def all_pages(url, auth=True):
    out, page = [], 1
    while True:
        batch = get(f"{url}{'&' if '?' in url else '?'}per_page=100&page={page}", auth)
        out += batch
        if len(batch) < 100 or page >= 20:
            return out
        page += 1


def ref_text(repo, n):
    return f"{repo}#{n}"


def marker_links(issues):
    """{wish id: issue number} from the markers of issues filed by "Wishes to issues"."""
    out = {}
    for i in sorted(issues, key=lambda i: i["number"]):
        m = MARKER.search(i.get("body") or "")
        if m and "pull_request" not in i:
            out.setdefault(int(m.group(1)), i["number"])
    return out


def link_filed_issues(wishes, links):
    """Adds issues filed for wishes to links. Returns how many were added."""
    try:
        url = f"https://api.github.com/repos/{WISH_ISSUE_REPO}/issues?labels=wish&state=all"
        found = marker_links(all_pages(url))
        if not found and TOKEN:
            # The Actions token of this repository may list no issues of another repository;
            # the wish issues are public, so ask once more without it.
            found = marker_links(all_pages(url, auth=False))
    except urllib.error.HTTPError as e:
        print(f"Could not read the wish issues of {WISH_ISSUE_REPO}: {e}", file=sys.stderr)
        return 0
    print(f"{WISH_ISSUE_REPO}: {len(found)} wish issue(s) with a marker", file=sys.stderr)
    ids = {w["id"] for w in wishes}
    n = 0
    for wid, num in found.items():
        if wid in ids and not links.get(str(wid)):
            links[str(wid)] = [ref_text(WISH_ISSUE_REPO, num)]
            n += 1
    return n


def own_repos():
    """Repositories whose issues may set a wish's status: the wish and roadmap repositories."""
    return {r.strip().lower() for r in [WISH_ISSUE_REPO, *ROADMAP_REPOS] if r.strip()}


def refs(text):
    """Issue references in a text. Wish text is written by anyone, so only issues of the own
    repositories count: an issue elsewhere must not set the status or put its link on the board."""
    own = own_repos()
    for m in ISSUE.finditer(text or ""):
        repo = (m.group(1) or m.group(3)).lower()
        if repo in own:
            yield repo, int(m.group(2) or m.group(4))


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
    if link_filed_issues(wishes, links):
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
