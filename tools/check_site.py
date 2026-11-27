import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


class HomepageAssets(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("img", "script"):
            url = attrs.get("src", "")
        elif tag == "link" and attrs.get("rel") == "stylesheet":
            url = attrs.get("href", "")
        else:
            return
        path = urlsplit(url)
        if path.path and not path.scheme and not path.netloc:
            if not Path(path.path.lstrip("/")).is_file():
                raise SystemExit(f"Missing homepage asset: {url}")


HomepageAssets().feed(Path("index.html").read_text())
for source in Path("abdeckung/data").glob("*.json"):
    json.loads(source.read_text())

# Every page must load site.css/site.js with ?v=<first 7 of sha1(site.css + site.js)>, so browsers
# never pair new HTML with an old cached stylesheet (that broke the mobile menu once).
import hashlib, re
version = hashlib.sha1(Path("site.css").read_bytes() + Path("site.js").read_bytes()).hexdigest()[:7]
for page in Path(".").glob("**/index.html"):
    for ref in re.findall(r'(?:href|src)="[./]*(site\.(?:css|js)[^"]*)"', page.read_text()):
        if ref.split("?v=")[-1] != version:
            raise SystemExit(f"{page}: {ref} should be ?v={version} (update the version after changing site.css or site.js)")

# SEO / AI search: every indexable page has title, description, a self-canonical, valid JSON-LD and is in
# the sitemap; sitemap and llms.txt only point at pages that exist; landing pages match their JSON source.
import subprocess, sys
sitemap = set(re.findall(r"<loc>https://publit\.eu/([^<]*)</loc>", Path("sitemap.xml").read_text()))
for page in Path(".").glob("**/index.html"):
    if any(part in ("services", "node_modules") or part.startswith(".") for part in page.parts):
        continue
    text = page.read_text()
    if re.search(r'<meta name="robots" content="[^"]*noindex', text):
        continue
    path = "" if page.parent == Path(".") else page.parent.as_posix() + "/"
    for pattern, what in ((r"<title>[^<]{10,}</title>", "a <title>"),
                          (r'<meta name="description" content="[^"]{50,}">', "a meta description (50+ chars)"),
                          (rf'<link rel="canonical" href="https://publit\.eu/{re.escape(path)}">', "a self-canonical"),
                          (r'<script type="application/ld\+json">', "JSON-LD")):
        if not re.search(pattern, text):
            raise SystemExit(f"{page}: missing {what}")
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
        json.loads(block)
    if path not in sitemap:
        raise SystemExit(f"{page}: indexable page missing from sitemap.xml")
for path in sitemap:
    if not Path(path or ".", "index.html").is_file():
        raise SystemExit(f"sitemap.xml lists https://publit.eu/{path}, which does not exist")
for path in re.findall(r"https://publit\.eu/([a-z0-9/.-]*[a-z0-9/])", Path("llms.txt").read_text()):
    if not (Path(path).is_file() or Path(path.rstrip("/"), "index.html").is_file()):
        raise SystemExit(f"llms.txt links https://publit.eu/{path}, which does not exist")
subprocess.run([sys.executable, "tools/landing.py", "--check"], check=True)
# one header and footer everywhere, and the planner script with its own version
subprocess.run([sys.executable, "tools/chrome.py", "--check"], check=True)
