# SPDX-License-Identifier: LicenseRef-AllRightsReserved
# SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
"""Builds the search landing pages (e.g. /oeffi-app-wien/) from tools/landing_pages.json.

Each page answers one search intent with its own title, description, H1, sections and a visible FAQ,
plus matching JSON-LD (WebPage, BreadcrumbList, FAQPage). German is the indexed language; English
comes from the same data and is switched in the browser like on the other pages.

Also writes llms-full.txt: llms.txt plus the home page FAQ and the full text of every landing page.

Run: python3 tools/landing.py   (writes <slug>/index.html for every page and llms-full.txt)
     python3 tools/landing.py --check   (fails if a generated page is out of date)
"""
import hashlib
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://publit.eu/"
APP_STORE = "https://apps.apple.com/app/id6824481988"

NAV_EN = {"navSupport": "Support", "navApp": "The app", "navFeat": "Features", "navCov": "Coverage",
          "navWishes": "Wishes", "navCities": "For cities", "footPrivacy": "Privacy", "footSources": "Data sources",
          "footPress": "Press", "footData": "Timetable data: Transitous and open data sources",
          "footDev": "built by <a href=\"https://friedrich-ulrich.com/\" rel=\"author\">Elija Friedrich-Ulrich</a>",
          "ios": "Download on the App Store", "android": "Android test", "faqT": "Frequently asked questions",
          "moreT": "More about Publit", "home": "Home"}


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
<header class="top">
  <a class="brand" href="../" aria-label="Publit">
    <svg viewBox="0 0 1024 1024" width="30" height="30"><g transform="translate(-38 -18)"><path d="M400 790 V420 a150 150 0 1 1 150 150 H400" fill="none" stroke="currentColor" stroke-width="96" stroke-linecap="round" stroke-linejoin="round"/><circle cx="550" cy="420" r="58" fill="#ffc531"/></g></svg>
    <span>publit</span>
  </a>
  <nav>
    <a href="../#nearby" data-t="navApp">Die App</a>
    <a href="../features/" data-t="navFeat">Funktionen</a>
    <a href="../abdeckung/" data-t="navCov">Abdeckung</a>
    <a href="../wuensche/" data-t="navWishes">Wünsche</a>
    <a href="../staedte/" data-t="navCities">Für Städte</a>
    <a class="nav-sup" href="../unterstuetzen/" data-t="navSupport">Unterstützen</a>
    <button class="lang" type="button" aria-label="Sprache / Language">EN</button>
    <a class="gh" href="https://github.com/elija-7580/Publit" aria-label="GitHub">GitHub</a>
      <details class="mnav"><summary aria-label="Menü / Menu"><svg class="bars" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="x" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></summary>
      <div class="mnav-sheet" onclick="if(event.target.closest('a'))this.parentNode.open=false">
        <a href="../#nearby" data-t="navApp">Die App</a>
        <a href="../features/" data-t="navFeat">Funktionen</a>
        <a href="../abdeckung/" data-t="navCov">Abdeckung</a>
        <a href="../wuensche/" data-t="navWishes">Wünsche</a>
        <a href="../staedte/" data-t="navCities">Für Städte</a>
        <a href="https://github.com/elija-7580/Publit">GitHub</a>
        <a class="mnav-cta" href="../unterstuetzen/"><span aria-hidden="true">♥</span> <span data-t="navSupport">Unterstützen</span></a>
      </div>
    </details>
  </nav>
</header>
<main>
<section class="fpage sup-page">
  <nav class="crumbs" aria-label="Brotkrumen"><a href="../" data-t="home">Startseite</a> › <span>{esc(p["crumb"])}</span></nav>
  {main}
</section>
</main>
<footer class="foot">
  <span class="foot-dev">© 2026 Publit · <span data-t-html="footDev">entwickelt von <a href="https://friedrich-ulrich.com/" rel="author">Elija Friedrich-Ulrich</a></span></span>
  <span data-t="footData">Fahrplandaten: Transitous und offene Datenquellen</span>
  <nav class="foot-nav">
    <a href="../features/" data-t="navFeat">Funktionen</a>
    <a href="../abdeckung/" data-t="navCov">Abdeckung</a>
    <a href="../wuensche/" data-t="navWishes">Wünsche</a>
    <a href="../staedte/" data-t="navCities">Für Städte</a>
    <a href="../unterstuetzen/" data-t="navSupport">Unterstützen</a>
    <a href="../privacy/" data-t="footPrivacy">Datenschutz</a>
    <a href="https://transitous.org/sources/" data-t="footSources">Datenquellen</a>
    <a href="../presse/" data-t="footPress">Presse</a>
    <a href="https://github.com/elija-7580/Publit">GitHub iOS</a>
    <a href="https://github.com/elija-7580/Publit-Android">GitHub Android</a>
  </nav>
</footer>
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
    import re
    out = [(ROOT / "llms.txt").read_text().rstrip(), "", "# Häufige Fragen (Startseite)", ""]
    home = (ROOT / "index.html").read_text()
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', home, re.S):
        for node in json.loads(block).get("@graph", []):
            if node.get("@type") == "FAQPage":
                for q in node["mainEntity"]:
                    out += [f"## {q['name']}", q["acceptedAnswer"]["text"], ""]
    for p in pages:
        out += [f"# {p['h1']} ({BASE}{p['slug']}/)", "", p["lead"], ""]
        for s in p["sections"]:
            out += [f"## {s['h']}"] + [f"- {c['t']}: {c['x']}" for c in s["cards"]]
            if s.get("note"):
                out.append(s["note"])
            out.append("")
        out.append("## Häufige Fragen")
        for q in p["faq"]:
            out += [f"### {q['q']}", q["a"], ""]
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
