# SPDX-License-Identifier: LicenseRef-AllRightsReserved
# SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
"""Builds partner/index.html (page for transit operators), German and English from one table.

Run: python3 tools/partner.py && python3 tools/chrome.py
"""
import json, sys
from pathlib import Path
sys.path.insert(0, 'tools')
import chrome
URL = "https://publit.eu/partner/"
TITLE = "Publit für Verkehrsunternehmen und Verbünde: Tickets europaweit vermitteln"
TITLE_EN = "Publit for transit operators and associations: sell tickets across Europe"
DESC = "Publit vermittelt Tickets von Verkehrsunternehmen, Verbünden, Bahn- und Busgesellschaften direkt an der geplanten Verbindung. Provision pro Ticket, keine Lizenzgebühr. Pilotpartner gesucht."
# (key, German, English)
T = [
 ("kick", "Für Verkehrsunternehmen, Verbünde, Bahn- und Busgesellschaften", "For transit operators, transport associations, rail and bus companies"),
 ("h1", "Ihre Tickets dort, wo die Reise geplant wird.", "Your tickets, right where the trip is planned."),
 ("lead", "Publit ist eine App für Nah- und Fernverkehr in ganz Europa. Fahrgäste planen darin ihre ganze Reise, von der Straßenbahn bis zum Nachtzug. Wir vermitteln Ihr Ticket direkt an dieser Verbindung. Sie bleiben Anbieter, Tarife und Preise bleiben Ihre.", "Publit is one app for local and long-distance public transport across Europe. Riders plan their whole trip in it, from the tram to the night train. We sell your ticket as your agent, right on that connection. You stay the provider, and fares and prices stay yours."),
 ("cta1", "Gespräch vereinbaren", "Arrange a call"),
 ("cta2", "So läuft ein Pilot", "How a pilot works"),
 ("status", "Offen gesagt: Der Ticketkauf in der App ist noch nicht live. Routenplanung, Live-Begleitung und Ticket-Ablage sind es. Für den Verkauf suchen wir jetzt Pilotpartner.", "To be clear: buying tickets in the app is not live yet. Journey planning, live guidance and ticket storage are. For sales we are now looking for pilot partners."),
 ("n1", "Menschen nutzen Publit", "people use Publit"), ("n2", "Downloads an einem einzigen Tag", "downloads in a single day"),
 ("n3", "zeitweise in den Verkehrs-Charts im App Store Österreich", "at times in the Austrian App Store travel charts"), ("n4", "Sprachen in der App", "languages in the app"),
 ("n3n", "Platz 19", "No. 19"),
 ("pT", "Eine Reise, fünf Ticketshops.", "One trip, five ticket shops."),
 ("pX", "Wer heute von Wien zum Flughafen München fährt, braucht drei Apps: eine für die Stadt, eine für den Zug, eine für die andere Stadt. Jede mit eigenem Konto und eigener Zahlung. Viele Reisende geben auf oder nehmen das Auto. Und für Sie heißt das: Der Gast aus Lyon findet Ihre Tageskarte nie.", "Getting from Vienna to Munich Airport takes three apps today: one for the city, one for the train, one for the other city. Each with its own account and its own payment. Many travellers give up or take the car. And for you it means: the visitor from Lyon never finds your day ticket."),
 ("oT", "Was Publit Ihnen bietet.", "What Publit offers you."),
 ("o1", "Vertrieb als Vermittler", "Sales as your agent"), ("o1x", "Publit verkauft Ihr Ticket in Ihrem Namen. Sie bleiben Vertragspartner des Fahrgasts und bestimmen Tarif und Preis. Der Fahrgast zahlt den normalen Preis, ohne Aufschlag.", "Publit sells your ticket in your name. You remain the rider's contract partner and set fare and price. Riders pay the normal price, with nothing on top."),
 ("o2", "Provision statt Lizenz", "Commission, not a licence"), ("o2x", "Publit erhält eine Provision pro verkauftem Ticket. Eine Lizenzgebühr gibt es nicht: Wir verdienen nur, wenn Sie verkaufen.", "Publit earns a commission per ticket sold. There is no licence fee: we only earn when you sell."),
 ("o3", "Reichweite über die Grenze", "Reach across borders"), ("o3x", "Publit läuft in 15 Sprachen und überall, wo es offene Fahrplandaten gibt. So erreichen Sie Pendler aus dem Nachbarland und Gäste auf Städtereise, die Ihre eigene App nie geladen hätten.", "Publit runs in 15 languages and wherever open timetable data exists. You reach commuters from the neighbouring country and city-trip visitors who would never have installed your own app."),
 ("o4", "Kein Integrationsprojekt", "No integration project"), ("o4x", "Wir bauen auf dem auf, was Sie haben: zuerst ein Link in Ihren bestehenden Ticketshop, später Ihre Vertriebsschnittstelle. Eine eigene App-Entwicklung brauchen Sie dafür nicht.", "We build on what you already have: first a link into your existing ticket shop, later your sales interface. You do not need to develop an app for it."),
 ("o5", "Datenschutz ohne Wenn und Aber", "Privacy without exceptions"), ("o5x", "Kein Konto, kein Tracking, keine Werbung. Die App sammelt keine Bewegungsprofile. Entwickelt und betrieben in der EU.", "No account, no tracking, no ads. The app builds no movement profiles. Built and run in the EU."),
 ("o6", "Offen und prüfbar", "Open and auditable"), ("o6x", "Der Code der Apps liegt offen auf GitHub (AGPL-3.0). Sie können nachlesen, was die App tut, bevor Sie mit uns arbeiten.", "The apps' code is open on GitHub (AGPL-3.0). You can read what the app does before you work with us."),
 ("sT", "In drei Schritten zum Pilot.", "Three steps to a pilot."),
 ("sX", "Wir beginnen klein und messbar. Jeder Schritt funktioniert für sich, keiner verpflichtet zum nächsten.", "We start small and measurable. Each step works on its own, and none commits you to the next."),
 ("s1", "Link in Ihren Ticketshop", "Link into your ticket shop"), ("s1x", "Publit zeigt an Ihrer Verbindung einen Verweis auf Ihren Shop, wo möglich mit vorausgefüllter Strecke. Technisch ist das heute schon möglich.", "Publit shows a link to your shop on your connection, pre-filled with the route where possible. Technically this is possible today."), ("s1s", "Heute möglich", "Possible today"),
 ("s2", "Pilot: Einzel- und Tageskarten", "Pilot: single and day tickets"), ("s2x", "Kauf direkt in Publit, zuerst im Nahverkehr in Österreich. Gemeinsam legen wir Sortiment, Abrechnung und Kontrolle fest.", "Purchase right in Publit, starting with local transport in Austria. Together we define the range, settlement and inspection."), ("s2s", "In Arbeit", "In development"),
 ("s3", "Fernverkehr in Europa", "Long distance across Europe"), ("s3x", "Bahn- und Bustickets über bestehende Vertriebsschnittstellen, damit die ganze Reise ein Einkauf wird.", "Rail and bus tickets through existing distribution interfaces, so the whole trip becomes one purchase."), ("s3s", "Geplant", "Planned"),
 ("wT", "Für wen das passt.", "Who this is for."),
 ("w1", "Verkehrsverbünde und städtische Betriebe", "Transport associations and city operators"), ("w1x", "Einzel- und Tageskarten für Gäste, die Ihre Stadt nicht kennen und Ihre App nicht haben.", "Single and day tickets for visitors who do not know your city and do not have your app."),
 ("w2", "Bahn- und Busgesellschaften", "Rail and bus companies"), ("w2x", "Ein weiterer Vertriebskanal mit Fahrgästen, die ihre Reise von Tür zu Tür planen, samt Nahverkehr am Ziel.", "Another sales channel with riders who plan door to door, including local transport at the destination."),
 ("w3", "Städte und Tourismus", "Cities and tourism"), ("w3x", "Ihre Gäste kommen aus ganz Europa. Publit führt sie in ihrer Sprache vom Flughafen bis zum Hotel.", "Your visitors come from all over Europe. Publit guides them in their language from the airport to the hotel."),
 ("w4", "Unternehmen", "Companies"), ("w4x", "Mitarbeitende und Besucher finden den Weg zu Ihrem Standort mit Öffis, ohne Konto und ohne Schulung.", "Employees and visitors find their way to your site by public transport, with no account and no training."),
 ("tT", "Was heute geht und was noch nicht.", "What works today and what does not yet."),
 ("t1", "Routenplanung in Europa", "Journey planning across Europe"), ("t1x", "Live. Nah- und Fernverkehr in einer Verbindung, über Ländergrenzen hinweg, mit Echtzeit, wo Betriebe sie veröffentlichen.", "Live. Local and long-distance transport in one connection, across borders, with real time where operators publish it."),
 ("t2", "Live-Begleitung", "Live guidance"), ("t2x", "Live. Vom Losgehen bis zum Aussteigen, auf iPhone, Apple Watch und Android.", "Live. From leaving until getting off, on iPhone, Apple Watch and Android."),
 ("t3", "Eigene Tickets ablegen", "Storing your own tickets"), ("t3x", "Live. KlimaTicket, Deutschlandticket und andere Tickets mit Code für die Kontrolle.", "Live. KlimaTicket, Deutschlandticket and other tickets with their code for inspection."),
 ("t4", "Verweis in Ticketshops", "Links into ticket shops"), ("t4x", "Technisch fertig, wird mit Partnern freigeschaltet.", "Technically ready, switched on with partners."),
 ("t5", "Ticketkauf in der App", "Buying tickets in the app"), ("t5x", "Noch nicht live. Startet mit den ersten Pilotpartnern.", "Not live yet. Starts with the first pilot partners."),
 ("dT", "Ihre Fahrpläne in Publit, kostenlos.", "Your timetables in Publit, free of charge."),
 ("dX", "Unabhängig vom Ticketverkauf: Wenn Sie Fahrplan und Echtzeit als offene Daten bereitstellen, sehen Ihre Fahrgäste in Publit Verspätungen und Ausfälle. Ohne Vertrag und ohne Kosten.", "Independent of ticket sales: if you publish your timetable and real-time data as open data, your riders see delays and cancellations in Publit. No contract and no cost."),
 ("dL", "Anleitung für offene Daten", "Guide to open data"), ("dM", "Abdeckung ansehen", "See the coverage"),
 ("fT", "Häufige Fragen von Verkehrsunternehmen.", "Questions operators often ask."),
 ("q0", "Was kostet die Zusammenarbeit?", "What does working with Publit cost?"), ("a0", "Eine Provision pro verkauftem Ticket, keine Lizenzgebühr. Die Höhe der Provision vereinbaren wir gemeinsam im Pilot.", "A commission per ticket sold, no licence fee. We agree the commission rate together in the pilot."),
 ("q1", "Wer ist Vertragspartner des Fahrgasts?", "Who is the rider's contract partner?"), ("a1", "Sie. Publit tritt als Vermittler auf. Tarif, Preis und Beförderungsbedingungen bleiben Ihre.", "You are. Publit acts as an agent. Fare, price and conditions of carriage stay yours."),
 ("q2", "Kann man in Publit schon Tickets kaufen?", "Can riders already buy tickets in Publit?"), ("a2", "Noch nicht. Der Kauf in der App ist in Arbeit und startet mit Pilotpartnern. Ein Verweis in Ihren bestehenden Ticketshop ist schon heute möglich.", "Not yet. Buying in the app is in development and starts with pilot partners. A link into your existing ticket shop is already possible."),
 ("q3", "Welche technische Anbindung brauchen Sie?", "What technical connection do you need?"), ("a3", "Für den ersten Schritt nur die Adresse Ihres Ticketshops. Für den Kauf in der App klären wir im Pilot gemeinsam, welche Vertriebsschnittstelle passt.", "For the first step only the address of your ticket shop. For buying in the app we work out together in the pilot which sales interface fits."),
 ("q4", "Welche Daten erhält Publit über unsere Fahrgäste?", "What data does Publit get about our riders?"), ("a4", "So wenig wie möglich. Die App hat kein Konto und kein Tracking. Für einen Kauf werden nur die Daten verarbeitet, die für Ticket und Zahlung nötig sind.", "As little as possible. The app has no account and no tracking. For a purchase only the data needed for the ticket and the payment is processed."),
 ("q5", "Wer steht hinter Publit?", "Who is behind Publit?"), ("a5", "Elija Friedrich-Ulrich hat Publit in Wien gegründet und entwickelt die Apps. Publit wird als Einzelunternehmen geführt.", "Elija Friedrich-Ulrich founded Publit in Vienna and builds the apps. Publit is run as a sole proprietorship."),
 ("cT", "Sprechen wir über einen Pilot.", "Let's talk about a pilot."),
 ("cX", "Wir suchen einen Verkehrsverbund für Nahverkehrstickets und eine Bahn- oder Busgesellschaft für den Fernverkehr. 20 Minuten reichen für ein erstes Gespräch.", "We are looking for one transport association for local tickets and one rail or bus company for long distance. Twenty minutes are enough for a first conversation."),
 ("cW", "Elija Friedrich-Ulrich, Gründer", "Elija Friedrich-Ulrich, founder"),
 ("cB", "E-Mail schreiben", "Send an e-mail"), ("cP", "Anrufen", "Call"), ("cPress", "Presse und Zahlen", "Press and numbers"),
 ("home", "Startseite", "Home"), ("crumb", "Für Unternehmen", "For business"),
]
D = {k: de for k, de, _ in T}
EN = {k: en for k, _, en in T}
def t(k, tag="span", cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<{tag}{c} data-t="{k}">{D[k]}</{tag}>'
faq_n = 6
ld = {"@context": "https://schema.org", "@graph": [
 {"@type": "WebPage", "@id": URL + "#webpage", "url": URL, "name": TITLE, "description": DESC, "inLanguage": "de",
  "isPartOf": {"@id": "https://publit.eu/#website"}, "about": {"@id": URL + "#service"}, "breadcrumb": {"@id": URL + "#breadcrumb"}},
 {"@type": "BreadcrumbList", "@id": URL + "#breadcrumb", "itemListElement": [
  {"@type": "ListItem", "position": 1, "name": "Publit", "item": "https://publit.eu/"},
  {"@type": "ListItem", "position": 2, "name": "Für Unternehmen", "item": URL}]},
 {"@type": "Service", "@id": URL + "#service", "name": "Ticketvertrieb über Publit", "serviceType": "Vermittlung von Tickets des öffentlichen Verkehrs",
  "description": DESC, "provider": {"@id": "https://publit.eu/#organization"}, "areaServed": "Europe",
  "audience": {"@type": "BusinessAudience", "audienceType": "Verkehrsunternehmen, Verkehrsverbünde, Bahn- und Busgesellschaften"}},
 {"@type": "Organization", "@id": "https://publit.eu/#organization", "name": "Publit", "url": "https://publit.eu/", "email": "support@publit.eu", "telephone": "+436767359197"},
 {"@type": "FAQPage", "@id": URL + "#faq", "inLanguage": "de", "mainEntity": [
  {"@type": "Question", "name": D[f"q{i}"], "acceptedAnswer": {"@type": "Answer", "text": D[f"a{i}"]}} for i in range(faq_n)]},
]}
card = lambda k: f'<article class="card"><h3 data-t="{k}">{D[k]}</h3><p data-t="{k}x">{D[k+"x"]}</p></article>'
MAIL = "mailto:support@publit.eu?subject=Pilot%20mit%20Publit"
html = f'''<!-- SPDX-License-Identifier: LicenseRef-AllRightsReserved -->
<!-- SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich -->
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="author" content="Elija Friedrich-Ulrich">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TITLE}</title>
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f5f5f3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)">
<link rel="icon" href="../assets/publit.svg">
<link rel="stylesheet" href="../site.css?v=0000000">
<meta name="description" content="{DESC}">
<link rel="canonical" href="{URL}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Publit">
<meta property="og:locale" content="de_AT">
<meta property="og:url" content="{URL}">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="https://publit.eu/assets/publit-social.png">
<meta property="og:image:alt" content="Publit: Eine App für Nah- und Fernverkehr in ganz Europa">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{TITLE}">
<meta name="twitter:description" content="{DESC}">
<meta name="twitter:image" content="https://publit.eu/assets/publit-social.png">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<header class="top"></header>
<main>
<section class="fpage">
  <nav class="crumbs" aria-label="Brotkrumen"><a href="../" data-t="home">Startseite</a> › {t("crumb")}</nav>
  <div class="b2b-hero">
    <div>
      <p class="kicker"><span class="dot"></span>{t("kick")}</p>
      {t("h1", "h1")}
      {t("lead", "p", "lead")}
      <div class="cta">
        <a class="key key-ink" href="{MAIL}" data-t="cta1">{D["cta1"]}</a>
        <a class="key" href="#pilot" data-t="cta2">{D["cta2"]}</a>
      </div>
      {t("status", "p", "status")}
    </div>
    <figure class="photo"><img src="../assets/team/tischaufsteller-800.webp" srcset="../assets/team/tischaufsteller-800.webp 800w, ../assets/team/tischaufsteller-1600.webp 1600w" sizes="(max-width:900px) 92vw, 420px" alt="Publit-Aufsteller für Verkehrsunternehmen: Pilotpartner gesucht" width="800" height="1000"></figure>
  </div>

  <div class="stats" style="padding:56px 0 0">
    <ul>
      <li><b>2.500</b>{t("n1")}</li>
      <li><b>1.400</b>{t("n2")}</li>
      <li><b data-t="n3n">Platz 19</b>{t("n3")}</li>
      <li><b>15</b>{t("n4")}</li>
    </ul>
  </div>

  <div class="b2b-sec">
    {t("pT", "h2")}
    {t("pX", "p")}
  </div>

  <div class="b2b-sec" id="angebot">
    {t("oT", "h2")}
    <div class="cards">
      {card("o1")}
      {card("o2")}
      {card("o3")}
      {card("o4")}
      {card("o5")}
      {card("o6")}
    </div>
  </div>

  <div class="b2b-sec" id="pilot">
    {t("sT", "h2")}
    {t("sX", "p")}
    <ol class="phase">
      <li><b data-t="s1">{D["s1"]}</b><span data-t="s1x">{D["s1x"]}</span><em class="now" data-t="s1s">{D["s1s"]}</em></li>
      <li><b data-t="s2">{D["s2"]}</b><span data-t="s2x">{D["s2x"]}</span><em data-t="s2s">{D["s2s"]}</em></li>
      <li><b data-t="s3">{D["s3"]}</b><span data-t="s3x">{D["s3x"]}</span><em data-t="s3s">{D["s3s"]}</em></li>
    </ol>
  </div>

  <div class="b2b-sec">
    {t("wT", "h2")}
    <div class="cards b2b-two">
      {card("w1")}
      {card("w2")}
      {card("w3")}
      {card("w4")}
    </div>
  </div>

  <div class="b2b-sec">
    {t("tT", "h2")}
    <table class="tbl">
      <tbody>
        {"".join(f'<tr><th scope="row" data-t="t{i}">{D[f"t{i}"]}</th><td data-t="t{i}x">{D[f"t{i}x"]}</td></tr>' for i in range(1, 6))}
      </tbody>
    </table>
  </div>

  <div class="b2b-sec">
    {t("dT", "h2")}
    {t("dX", "p")}
    <div class="cta"><a class="key" href="../staedte/" data-t="dL">{D["dL"]}</a><a class="key" href="../abdeckung/" data-t="dM">{D["dM"]}</a></div>
  </div>

  <div class="b2b-sec" id="faq">
    {t("fT", "h2")}
    <div class="faq">
      {"".join(f'<details><summary data-t="q{i}">{D[f"q{i}"]}</summary><p data-t="a{i}">{D[f"a{i}"]}</p></details>' for i in range(faq_n))}
    </div>
  </div>

  <div class="contact-card" id="kontakt">
    <img src="../assets/team/elija-portrait-800.webp" alt="Elija Friedrich-Ulrich" width="800" height="1000" loading="lazy">
    <div>
      {t("cT", "h2")}
      {t("cX", "p")}
      <p class="who"><b data-t="cW">{D["cW"]}</b><br><a href="{MAIL}">support@publit.eu</a> · <a href="tel:+436767359197">+43 676 7359197</a></p>
      <div class="cta" style="margin-top:22px">
        <a class="key key-dot" href="{MAIL}" data-t="cB">{D["cB"]}</a>
        <a class="key" href="tel:+436767359197" data-t="cP">{D["cP"]}</a>
        <a class="key" href="../presse/" data-t="cPress">{D["cPress"]}</a>
      </div>
    </div>
  </div>
</section>
</main>
<footer class="foot"></footer>
<script>
(() => {{
const EN = {json.dumps(EN, ensure_ascii=False)};
const els = () => [...document.querySelectorAll('[data-t]')], htmls = () => [...document.querySelectorAll('[data-t-html]')];
const DE = {{}}, DEH = {{}}; els().forEach(e => DE[e.dataset.t] = e.textContent); htmls().forEach(e => DEH[e.dataset.tHtml] = e.innerHTML);
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en');
const btn = document.querySelector('.lang');
function apply() {{
  const d = lang === 'de' ? DE : EN;
  document.documentElement.lang = lang;
  els().forEach(e => {{ if (d[e.dataset.t]) e.textContent = d[e.dataset.t]; }});
  htmls().forEach(e => {{ const v = lang === 'de' ? DEH[e.dataset.tHtml] : EN[e.dataset.tHtml]; if (v) e.innerHTML = v; }});
  document.title = lang === 'de' ? {json.dumps(TITLE, ensure_ascii=False)} : {json.dumps(TITLE_EN, ensure_ascii=False)};
  btn.textContent = lang === 'de' ? 'EN' : 'DE';
}}
btn.addEventListener('click', () => {{ lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('lang', lang); apply(); }});
const top = document.querySelector('.top');
addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 8), {{passive: true}});
apply();
}})();
</script>
<script src="/analytics-consent.js" defer></script>
</body>
</html>
'''
Path('partner/index.html').write_text(html)
