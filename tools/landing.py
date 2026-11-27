# SPDX-License-Identifier: LicenseRef-AllRightsReserved
# SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
"""Builds the search landing pages (e.g. /oeffi-app-wien/) from tools/landing_pages.json.

Each page answers one search intent with its own title, description, H1, sections and a visible FAQ,
plus matching JSON-LD (WebPage, BreadcrumbList, FAQPage). German is the indexed language; English
comes from the same data and is switched in the browser like on the other pages.

Also writes llms-full.txt (English): llms.txt plus the home page FAQ and the full text of every landing page.

Run: python3 tools/landing.py   (writes <slug>/index.html for every page and llms-full.txt)
     python3 tools/landing.py --check   (fails if a generated page is out of date)
"""
import hashlib
import html
import json
import sys
from pathlib import Path

import chrome

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://publit.eu/"
APP_STORE = "https://apps.apple.com/app/id6824481988"

NAV_EN = {**chrome.EN, "ios": "Download on the App Store", "android": "Android test",
          "faqT": "Frequently asked questions", "moreT": "More about Publit", "home": "Home"}


def esc(s):
    return html.escape(s, quote=True)


def asset_version():
    return hashlib.sha1((ROOT / "site.css").read_bytes() + (ROOT / "site.js").read_bytes()).hexdigest()[:7]


def jsonld(p):
    url = BASE + p["slug"] + "/"
    graph = [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": p["title"], "description": p["description"],
         "inLanguage": "de", "isPartOf": {"@id": BASE + "#website"}, "about": {"@id": BASE + "#app"},
         "breadcrumb": {"@id": url + "#breadcrumb"}, "author": {"@id": "https://friedrich-ulrich.com/#person"}},
        {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Publit", "item": BASE},
            {"@type": "ListItem", "position": 2, "name": p["crumb"], "item": url}]},
        {"@type": "FAQPage", "@id": url + "#faq", "inLanguage": "de", "mainEntity": [
            {"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}}
            for q in p["faq"]]},
        {"@type": "MobileApplication", "@id": BASE + "#app", "name": "Publit", "url": BASE,
         "applicationCategory": "TravelApplication", "operatingSystem": "iOS, watchOS, Android",
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}, "installUrl": APP_STORE},
        {"@type": "Person", "@id": "https://friedrich-ulrich.com/#person", "name": "Elija Samuel Friedrich-Ulrich",
         "url": "https://friedrich-ulrich.com/", "sameAs": ["https://github.com/elija-7580"]},
    ]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def render(p, version):
    url = BASE + p["slug"] + "/"
    en = dict(NAV_EN)
    body = []
    body.append(f'<p class="kicker"><span class="dot"></span><span data-t="kick">{esc(p["kicker"])}</span></p>')
    en["kick"] = p["kicker_en"]
    body.append(f'<h1 data-t="h1">{esc(p["h1"])}</h1>')
    en["h1"] = p["h1_en"]
    body.append(f'<p class="lead" data-t="lead">{esc(p["lead"])}</p>')
    en["lead"] = p["lead_en"]
    body.append('<div class="cta">\n    <a class="key key-ink" href="' + APP_STORE + '" data-t="ios">Im App Store laden</a>\n'
                '    <a class="key" href="../android/" data-t="android">Android-Test</a>\n  </div>')
    for si, s in enumerate(p["sections"]):
        k = f"s{si}"
        en[k] = s["h_en"]
        cards = []
        for ci, c in enumerate(s["cards"]):
            ck = f"{k}c{ci}"
            en[ck], en[ck + "x"] = c["t_en"], c["x_en"]
            cards.append(f'      <div class="card"><h3 data-t="{ck}">{esc(c["t"])}</h3><p data-t="{ck}x">{esc(c["x"])}</p></div>')
        note = ""
        if s.get("note"):
            en[k + "n"] = s["note_en"]
            note = f'\n    <p class="sup-note" data-t="{k}n">{esc(s["note"])}</p>'
        body.append(f'<div class="sup-block">\n    <h2 data-t="{k}">{esc(s["h"])}</h2>\n'
                    f'    <div class="sup-steps">\n' + "\n".join(cards) + f'\n    </div>{note}\n  </div>')
    faq = []
    for qi, q in enumerate(p["faq"]):
        en[f"q{qi}"], en[f"a{qi}"] = q["q_en"], q["a_en"]
        faq.append(f'      <details><summary data-t="q{qi}">{esc(q["q"])}</summary><p data-t="a{qi}">{esc(q["a"])}</p></details>')
    body.append('<div class="sup-block" id="faq">\n    <h2 data-t="faqT">Häufige Fragen</h2>\n    <div class="faq">\n'
                + "\n".join(faq) + '\n    </div>\n  </div>')
    links = []
    for li, l in enumerate(p["links"]):
        en[f"l{li}"] = l["t_en"]
        links.append(f'    <a class="key" href="{esc(l["href"])}" data-t="l{li}">{esc(l["t"])}</a>')
    body.append('<div class="sup-block">\n    <h2 data-t="moreT">Mehr über Publit</h2>\n    <div class="cta">\n'
                + "\n".join(links) + '\n    </div>\n  </div>')
    main = "\n  ".join(body)
    title, desc = esc(p["title"]), esc(p["description"])
    return f'''<!-- SPDX-License-Identifier: LicenseRef-AllRightsReserved -->
<!-- SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich -->
<!-- Generated by tools/landing.py from tools/landing_pages.json. Edit the JSON, then run the script. -->
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="author" content="Elija Friedrich-Ulrich">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-itunes-app" content="app-id=6824481988">
<title>{title}</title>
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f4f4f2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)">
<link rel="icon" href="../assets/publit.svg">
<link rel="stylesheet" href="../site.css?v={version}">
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Publit">
<meta property="og:locale" content="de_AT">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://publit.eu/assets/publit-social.png">
<meta property="og:image:alt" content="Publit: Route und Ticket für ganz Europa">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://publit.eu/assets/publit-social.png">
<script type="application/ld+json">{jsonld(p)}</script>
</head>
<body>
{chrome.header("../", p["slug"] + "/")}
<main>
<section class="fpage sup-page">
  <nav class="crumbs" aria-label="Brotkrumen"><a href="../" data-t="home">Startseite</a> › <span>{esc(p["crumb"])}</span></nav>
  {main}
</section>
</main>
{chrome.footer("../")}
<script>
(() => {{
const EN = {json.dumps(en, ensure_ascii=False)};
const els = () => [...document.querySelectorAll('[data-t]')], htmls = () => [...document.querySelectorAll('[data-t-html]')];
const DE = {{}}, DEH = {{}}; els().forEach(e => DE[e.dataset.t] = e.textContent); htmls().forEach(e => DEH[e.dataset.tHtml] = e.innerHTML);
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en');
const btn = document.querySelector('.lang');
function apply() {{
  const d = lang === 'de' ? DE : EN;
  document.documentElement.lang = lang;
  els().forEach(e => {{ if (d[e.dataset.t]) e.textContent = d[e.dataset.t]; }});
  htmls().forEach(e => {{ const v = lang === 'de' ? DEH[e.dataset.tHtml] : EN[e.dataset.tHtml]; if (v) e.innerHTML = v; }});
  document.title = lang === 'de' ? {json.dumps(p["title"], ensure_ascii=False)} : {json.dumps(p["title_en"], ensure_ascii=False)};
  btn.textContent = lang === 'de' ? 'EN' : 'DE';
}}
btn.addEventListener('click', () => {{ lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('lang', lang); apply(); }});
const top = document.querySelector('.top');
addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 10), {{passive: true}});
apply();
}})();
</script>
<script src="/analytics-consent.js" defer></script>
</body>
</html>
'''


def llms_full(pages):
    """English long version for LLMs: llms.txt, the home page FAQ (English strings from site.js) and every landing page."""
    import re
    out = [(ROOT / "llms.txt").read_text().rstrip(), "", "# Frequently asked questions (home page)", ""]
    js = (ROOT / "site.js").read_text()
    i = 0
    while True:
        q = re.search(rf'faq{i}q:"((?:[^"\\]|\\.)*)"', js)
        a = re.search(rf'faq{i}a:"((?:[^"\\]|\\.)*)"', js)
        if not (q and a):
            break
        out += [f"## {json.loads(chr(34) + q.group(1) + chr(34))}", json.loads(chr(34) + a.group(1) + chr(34)), ""]
        i += 1
    if i == 0:
        raise SystemExit("llms-full.txt: no English FAQ (faq0q/faq0a) found in site.js")
    for p in pages:
        out += [f"# {p['h1_en']} ({BASE}{p['slug']}/)", "", p["lead_en"], ""]
        for s in p["sections"]:
            out += [f"## {s['h_en']}"] + [f"- {c['t_en']}: {c['x_en']}" for c in s["cards"]]
            if s.get("note_en"):
                out.append(s["note_en"])
            out.append("")
        out.append("## Frequently asked questions")
        for q in p["faq"]:
            out += [f"### {q['q_en']}", q["a_en"], ""]
    return "\n".join(out).rstrip() + "\n"


def main():
    pages = json.loads((ROOT / "tools" / "landing_pages.json").read_text())
    version = asset_version()
    stale = []
    for p in pages:
        out = ROOT / p["slug"] / "index.html"
        text = render(p, version)
        if "--check" in sys.argv:
            if not out.is_file() or out.read_text() != text:
                stale.append(str(out.relative_to(ROOT)))
        else:
            out.parent.mkdir(exist_ok=True)
            out.write_text(text)
    full = llms_full(pages)
    target = ROOT / "llms-full.txt"
    if "--check" in sys.argv:
        if not target.is_file() or target.read_text() != full:
            stale.append("llms-full.txt")
    else:
        target.write_text(full)
    if stale:
        raise SystemExit("Out of date, run python3 tools/landing.py: " + ", ".join(stale))


if __name__ == "__main__":
    main()
