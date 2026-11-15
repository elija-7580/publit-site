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
