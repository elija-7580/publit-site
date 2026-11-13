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
