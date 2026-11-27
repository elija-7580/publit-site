// SPDX-License-Identifier: LicenseRef-AllRightsReserved
// SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
if (location.search.includes("shot")) document.documentElement.classList.add("shot");
(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains("shot");
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Language ---------- */
const EN = {
  ctaIphone: 'Download on the App Store', wTitle: 'On your wrist.', wText: 'The Apple Watch app shows departures nearby and guides you through the trip: which line, how long, where to get off. A tap on your wrist reminds you to get off.', wa: 'Departures nearby, without the iPhone in your hand', wb: 'Live trip with changes and platforms', wc: 'Tickets with their code right on the watch', wishTitle: 'What should come next?', wishText: 'Suggest a feature or vote for what others asked for. No sign-up.', wishLink: 'See all wishes →',
navSupport: 'Support', donTitle: 'A community project.', donText: 'Publit has no ads and no tracking. From €1.50 a month you help pay for servers and development – every feature stays free for everyone.', donLink: 'Support Publit ♥', navApp: 'The app', navFeat: 'Features', navCov: 'Coverage', navWishes: 'Wishes', navCities: 'For cities', footPrivacy: 'Privacy', footSources: 'Data sources', footPress: 'Press', footData: 'Timetable data: Transitous and open data sources',   platforms:'iOS uses Apple Maps; Android uses MapLibre. Android is available as an APK and remains in development. Screenshots show the iPhone and the Pixel 8 Pro.', androidDownload:'Download Android APK',
  navApp:'The app', navEurope:'Europe', navWhy:'Why', navAll:'All features', navCities:'For cities', footCities:'For cities and transit operators', light:'Light', dark:'Dark',
  film1:'Board', film2:'On the way', film3:'Get off', filmBanner:'Next stop: Marienplatz', filmBannerSub:'Get off now · U6 towards Klinikum Großhadern', allFeatures:'See all features →',
  kicker:'For iPhone and Android. Made in EU. Open source.',
  heroTitle:'One app.<br>Every ticket.<br>All of Europe.',
  heroLead:'Publit finds your connection across Europe and guides you until you get off. Next comes the ticket: buy it where you plan, instead of installing a different app in every city.',
  status:'In the app today: departures, routes, live trips and your tickets in one place. Ticket sales start step by step with the first transit operators.',
  st1n:'2,500', st2n:'1,400', st4n:'120,000', st1:'people use Publit', st2:'downloads in a single day', st3n:'No. 19', st3:'at times in the transport charts', st4:'views on Reddit, with lots of positive feedback',
  visTitle:'One app for local and long-distance transport across Europe.', visText:'In Vienna you need one app, in Munich the next, and a third for the train to Venice. We are changing that: in Publit you find the connection and buy the operator’s ticket right with it. Publit sells on behalf of the transit operators, the ticket comes from them.',
  vs1:'Find the route', vs1t:'Public transport and rail across Europe, with live times.', vs2:'Buy the ticket', vs2t:'The right ticket right on the connection, without a second app and without a new account at every operator.', vs3:'Get on', vs3t:'The code is ready in Publit, and Publit guides you until you get off.',
  visStatus:'Where we are today: routes, live trips and storing your own tickets work. Buying in the app starts gradually, one operator at a time.',
  f5c:'Soon: buy tickets right in Publit',
  futTitle:'Where the journey goes.', futText:'Publit should become more than a timetable. This is the direction for the coming years, step by step and together with the transit operators.',
  fu1:'One trip, one checkout', fu1t:'Vienna to Venice by train, vaporetto and bus: every ticket in one checkout, even when three operators run the trip.',
  fu2:'What you have counts', fu2t:'Does your Klimaticket or Deutschlandticket already cover it? Then Publit only suggests what is still missing on the route.',
  fu3:'Arrive and ride', fu3t:'New city, no local app: buy the day pass in Publit and hop on the next tram.',
  fu4:'One counter for many operators', fu4t:'Even small transit operators sell to riders from all over Europe, in their language, without building an app of their own.',
  futStatus:'This is the direction, not where things stand today. What the app already does is listed below under the features.',
  teamTitle:'Who builds Publit.', teamText:'Publit is made in Vienna. Elija Friedrich-Ulrich builds the app as an independent project, for iPhone, Apple Watch and Android. What comes next is decided together with the community, through the wish list on this site.',
  teamQuote:'“In Vienna you need one app, in Munich the next, and a third for the train to Venice. I want one to be enough.”', teamCite:'Elija Friedrich-Ulrich, founder', teamMore:'More about Elija →', teamPress:'Press and photos →', teamCredit:'Photos: Christoph Grossberger, Gross Digital',
  parTitle:'For transit operators.', parText:'Publit sells your tickets as an agent, right on the route, to riders from all over Europe. You stay the provider and set fares and prices. Publit earns a commission per ticket sold. That way you reach people who would never have installed your own app, like commuters from the neighbouring country or visitors on a city trip.', parMail:'Write to us', parData:'Open data for cities →',
  ctaPrimary:'View on GitHub', ctaSecondary:'See the features ↓',
  fact1:'Made in EU', fact2:'No account', fact3:'Opt-in stats', fact4:'Open data',
  tabNearby:'Nearby', tabPlan:'Plan', tabRoute:'Route', tabLive:'On the way',
  f1Title:'What leaves next?', f1Text:'Open Publit and see the next departures around you: line, direction, platform and the minutes until it leaves. Live times and delays right beside them.',
  f1a:'Tap a station, route there with one tap', f1b:'Filter by metro, tram, bus, ferry', f1c:'When the stop is far, the walking time is shown', f1d:'Find cafés, pharmacies or supermarkets nearby on the map',
  f2Title:'Every route on one timeline.', f2Text:'Publit puts every connection on the same time axis, so you see at a glance which one arrives first, where you change and where it gets tight.',
  f2a:'Tight changes are marked', f2b:'Find the last connection of the night', f2c:'Walking, cycling and driving to compare',
  f3Title:'Know when to leave.', f3Text:'Every route says at the top when to leave and when you arrive. Below are the map and every step in the colours of the lines, with platforms, stops and delays.',
  f3a:'Reminders to leave and to get off', f3b:'Add to calendar or share as a link', f3c:'Attach tickets to the trip',
  f4Title:'From here until you get off.', f4Text:'On the way, Publit shows in large type which line you are on, how long is left and where to get off. Delays and platform changes appear at once, on the lock screen and in the Dynamic Island too.',
  f4a:'The whole trip at a glance', f4at:'One map with every remaining leg and the live times of each one.',
  f4b:'New connection from here', f4bt:'Missed a connection or took a wrong turn? One tap and Publit finds the best way from where you are now.',
  f4c:'Reminder to get off', f4ct:'Just before your stop Publit lets you know, with a spoken announcement if you like, so you don’t miss it.',
  f5Title:'Your ticket is already there.', f5Text:'Add tickets from a PDF, a photo or a screenshot. Publit reads the details on your iPhone and uploads nothing. When your ticket is checked, the code is ready.',
  f5a:'Klimaticket, Deutschlandticket, single tickets', f5b:'The code bright and big for ticket checks',
  darkTitle:'Easy to read at midnight, too.',
  euTitle:'Public transport.<br>All over Europe.', euText:'For your commute and for cities you don’t know yet. Publit uses open timetable data from Transitous, from the Munich U-Bahn to the vaporetto in Venice.', euLink:'Coverage on the map ↓',
  whyTitle:'How Publit is built.',
  w1:'Made in EU', w1t:'Built in Europe, for Europe. Timetables from open European sources, without a detour through big platforms.', w2:'Private', w2t:'No account, no tracking, no analytics SDKs. Your places, trips and tickets stay on your iPhone.',
  w3:'Independent', w3t:'Built by an <a href="https://friedrich-ulrich.com/" rel="author">indie developer</a>, not a corporation. No ads, no data trading, no interest in keeping you in the app.', w4:'Open data', w4t:'Publit uses open timetables (GTFS) and live data (GTFS-RT) via Transitous. All the code is open on GitHub.',
  w5:'Simple', w5t:'Open it and go. What matters is shown big, everything else is one tap away.', w6:'Smart routing', w6t:'Publit rates every change: how safe is it, how long do you wait and walk? The route that feels shortest wins.',
  endTitle:'Last stop. Everybody off, please.', endText:'Get Publit for free and plan your next trip. The ticket is coming soon.',
  footData:'Timetable data: Transitous and open data sources',
  footDev:'developed by <a href="https://friedrich-ulrich.com/" rel="author">Elija Friedrich-Ulrich</a>',
  covTitle:'What Publit knows where.', covText:'Publit works wherever Transitous has open timetables. The map shows where that is today: green with realtime, grey with timetables only. It updates itself every week. Tap a country for details.',
  covAria:'Map of Transitous coverage worldwide', covMore:'Detailed map of all countries and regions →',
  footPrivacy:'Privacy',
  footVienna:'Vienna transit app', footEurope:'Transit across Europe', footTickets:'KlimaTicket & Deutschlandticket',
  faqTitle:"Frequently asked questions.", faq0q:"What is Publit?", faq0a:"Publit is a free, open-source app for local and long-distance public transport across Europe, for iPhone, Apple Watch and Android. It shows departures nearby, plans routes by bus, tram, metro and train across borders and guides you until you get off.", faq1q:"Is Publit free?", faq1a:"Yes. Publit is free, with no ads and no account. If you like, you can support the project voluntarily from €1.50 a month; every feature stays free for everyone.", faq2q:"Which countries does Publit work in?", faq2a:"Wherever open timetable data exists: Publit uses Transitous, with more than 1,000 sources in 49 countries and a focus on Europe. The same app works in Vienna, Munich, Milan or Copenhagen.", faq3q:"Can I buy tickets in Publit?", faq3a:"Not yet. Publit plans to sell tickets on behalf of transport operators right on the route it found; this starts step by step. You can already store and show your own tickets, such as the KlimaTicket or Deutschlandticket.", faq4q:"Is Publit available for Android and the Apple Watch?", faq4a:"Publit is on the App Store for iPhone (iOS 17 and later) and Apple Watch. The Android app is available as a download on GitHub and is in a closed test for Google Play.", faq5q:"Where do the timetable and real-time data come from?", faq5a:"From Transitous, an open, volunteer-run routing service. On top of that come live data from individual operators such as Wiener Linien, ÖBB or search.ch.", faq6q:"Does Publit collect data about me?", faq6a:"No. Publit has no account, no tracking and no analytics SDKs. Your places, trips and tickets stay on your device.", faq7q:"Who builds Publit?", faq7a:"Elija Friedrich-Ulrich in Vienna, as an independent project. The code is open on GitHub (AGPL-3.0), and the community collects wishes in public on publit.eu.",
  supTitle:'Questions? Write to us.', supText:'A bug in the app, a missing line or an idea: send an email to support. A real person reads every message.', supAlt:'For detailed bug reports you can also open an <a href="https://github.com/elija-7580/Publit/issues">issue on GitHub</a>.', footSupport:'Support'
};
// texts of the refined site (2026-11-27); they win over the older ones above
Object.assign(EN, {
 "navFeat": "Features",
 "navRoute": "Route planner",
 "navCov": "Coverage",
 "navWishes": "Wishes",
 "navBiz": "For business",
 "navGet": "Get the app",
 "navCities": "For cities",
 "navSupport": "Support Publit",
 "navPress": "Press",
 "navHome": "Home",
 "footClaim": "One app for local and long-distance public transport across Europe. Made in Vienna, open source.",
 "fProd": "Product",
 "fBiz": "Business",
 "fMore": "More",
 "fProj": "Project",
 "footOps": "Transit operators",
 "footContact": "Contact",
 "footAndroid": "Android",
 "footVienna": "Vienna transit app",
 "footEurope": "Transit across Europe",
 "footTickets": "KlimaTicket & Deutschlandticket",
 "footSources": "Data sources",
 "footPrivacy": "Privacy",
 "footPress": "Press",
 "footData": "Timetable data: Transitous and open data sources",
 "footDev": "built by <a href=\"https://friedrich-ulrich.com/\" rel=\"author\">Elija Friedrich-Ulrich</a>",
 "kicker": "For iPhone, Apple Watch and Android",
 "heroTitle": "One app for local and long-distance transport across Europe.",
 "heroLead": "Publit plans your trip by bus, tram, metro and train across borders and guides you until you get off. Free, with no account and no ads.",
 "androidDownload": "Get the Android app (APK)",
 "androidTest": "Android test on Google Play",
 "fact3": "No ads",
 "fact4": "Open source",
 "heroBiz": "Do you represent a transit operator or a transport association?",
 "heroBizLink": "How we work together →",
 "pbFrom": "From",
 "pbTo": "To",
 "pbGo": "Find connections",
 "pbFromPh": "Vienna Central Station",
 "pbToPh": "Munich",
 "pbNote": "The route planner runs right in your browser, on the same open timetable data as the app.",
 "st4": "views on Reddit, without paid ads",
 "d1k": "For riders",
 "d1t": "Departures, routes and live guidance in one app.",
 "d1x": "From the tram around the corner to the night train: Publit shows what is running and tells you when to get off.",
 "d1l": "See the features →",
 "d2k": "For transit operators and associations",
 "d2t": "Your tickets, right where the trip is planned.",
 "d2x": "Publit sells your ticket as your agent, right on the connection, to riders from all over Europe. Fares and prices stay yours. We are looking for pilot partners.",
 "d2l": "More for business →",
 "visKick": "The idea",
 "visTitle": "Route and ticket in one place.",
 "covKick": "Coverage",
 "covTitle": "Where Publit runs.",
 "covText": "Publit works wherever Transitous has open timetables, from the Munich U-Bahn to the vaporetto in Venice. The map shows where that is today: green with realtime, grey with timetables only. It updates itself every week. Tap a country for details.",
 "parKick": "For transit operators, transport associations, rail and bus companies",
 "parTitle": "Your tickets, right where the trip is planned.",
 "parText": "Publit sells your ticket as your agent, right on the planned connection, to riders from all over Europe. You stay the provider and set fares and prices, and riders pay the normal fare. Publit earns a commission per ticket sold.",
 "pg1": "Reach new riders",
 "pg1t": "Commuters from the neighbouring country, visitors on a city trip: people who would never have installed your own app.",
 "pg2": "No project on your side",
 "pg2t": "No licence fee and no app development for you. The first step is a link into your existing ticket shop.",
 "pg3": "Step by step",
 "pg3t": "Buying in the app is in development and starts with pilot partners: a transport association for local tickets, a rail or bus company for long distance.",
 "parMore": "See how we work together",
 "parMail": "Arrange a call",
 "parData": "Open data for cities",
 "w2t": "No account, no tracking, no analytics SDKs. Your places, trips and tickets stay on your device.",
 "w3t": "Founded and built by <a href=\"https://friedrich-ulrich.com/\" rel=\"author\">Elija Friedrich-Ulrich</a> in Vienna, not by a corporation. No ads, no data trading.",
 "teamText": "Publit is made in Vienna. Elija Friedrich-Ulrich founded Publit and builds the apps for iPhone, Apple Watch and Android. What comes next is decided together with the community, through the wish list on this site.",
 "teamMore": "More about Elija",
 "teamPress": "Press and photos",
 "wishLink": "See all wishes",
 "donLink": "Support Publit",
 "donText": "Publit has no ads and no tracking. From €1.50 a month you help pay for servers and development. Every feature stays free for everyone.",
 "supTitle": "Questions about the app?",
 "bizTitle": "For business and press.",
 "bizText": "Would you like to sell tickets through Publit, make your timetable data visible or write about Publit? Here you will find the right information and a direct contact.",
 "endTitle": "Get Publit for free.",
 "endText": "For iPhone and Apple Watch on the App Store, for Android as a download. No account, no ads."
});
const DE = {};
$$('[data-t]').forEach(e => DE[e.dataset.t] = e.textContent);
$$('[data-t-html]').forEach(e => DE[e.dataset.tHtml] = e.innerHTML);
$$('[data-ph]').forEach(e => DE[e.dataset.ph] = e.placeholder);
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en');
const langBtn = $('.lang');
function applyLang() {
  const d = lang === 'de' ? DE : EN;
  document.documentElement.lang = lang;
  $$('[data-t]').forEach(e => { if (d[e.dataset.t]) e.textContent = d[e.dataset.t]; });
  $$('[data-t-html]').forEach(e => { if (d[e.dataset.tHtml]) e.innerHTML = d[e.dataset.tHtml]; });
  $$('[data-ph]').forEach(e => { if (d[e.dataset.ph]) e.placeholder = d[e.dataset.ph]; });
  langBtn.textContent = lang === 'de' ? 'EN' : 'DE';
  // Android screens exist per language: web-x-android.webp (de) and web-x-android-en.webp
  $$('img[data-lang-src]').forEach(i => { const a = i.hasAttribute('src') ? 'src' : 'data-src', s = i.getAttribute(a).replace(/-en\.webp$/, '.webp'); i.setAttribute(a, lang === 'en' ? s.replace(/\.webp$/, '-en.webp') : s); });
  // the route planner and the business page open in the same language
  $$('.planbar').forEach(f => { let h = $('input[name=lang]', f); if (lang === 'en' && !h) { h = document.createElement('input'); h.type = 'hidden'; h.name = 'lang'; h.value = 'en'; f.appendChild(h); } else if (lang !== 'en' && h) h.remove(); });
  if (window.renderWishTop) renderWishTop();
}
langBtn.addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('lang', lang); applyLang(); });

// ref eb8825712d52
/* ---------- Header: a hairline once the page has moved ---------- */
const top = $('.top');
const onScroll = () => top.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- Reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
  { rootMargin: '0px 0px -6% 0px', threshold: .08 });
$$('.reveal').forEach(e => io.observe(e));

/* ---------- Hero: the screens take turns ---------- */
const cycle = $('[data-cycle]'), shots = $$('.slide', cycle), tabs = $$('.cycle-tabs button');
let ci = 0, timer;
const CYCLE = 5000;
document.documentElement.style.setProperty('--cycle', CYCLE + 'ms');
function show(i) {
  ci = (i + shots.length) % shots.length;
  shots.forEach((s, k) => s.classList.toggle('on', k === ci));
  tabs.forEach((t, k) => { t.classList.remove('on'); if (k === ci) { void t.offsetWidth; t.classList.add('on'); } });
}
function play() { clearInterval(timer); if (!reduce) timer = setInterval(() => show(ci + 1), CYCLE); }
tabs.forEach(t => t.addEventListener('click', () => { show(+t.dataset.i); play(); }));
play();
document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : play());

/* ---------- Screens: light or dark, one switch for all phones ---------- */
// dark screenshots are only downloaded once someone sees dark screens
const darkOn = on => { document.body.classList.toggle('screens-dark', on); if (on) $$('img.dark[data-src]').forEach(i => { i.src = i.dataset.src; i.removeAttribute('data-src'); }); };
$$('.theme').forEach(b => b.addEventListener('click', () => darkOn(!document.body.classList.contains('screens-dark'))));
// screens follow the system appearance until someone picks one
const dm = matchMedia('(prefers-color-scheme: dark)'), syncScreens = () => darkOn(dm.matches);
syncScreens(); dm.addEventListener('change', syncScreens);

/* ---------- Live trip film: board, ride, get off ---------- */
const film = $('.film');
if (film) {
  const slides = $$('.slide', film), steps = $$('.film-steps li', film), minEl = $('.island .min', film);
  const SCENE = 3400, mins = [8, 5, 1];
  film.style.setProperty('--scene', SCENE + 'ms');
  let fi = 0, ft, tick;
  const scene = i => {
    fi = i % 3;
    slides.forEach((s, k) => s.classList.toggle('on', k === fi));
    steps.forEach((t, k) => { t.classList.remove('on'); if (k === fi) { void t.offsetWidth; t.classList.add('on'); } });
    film.classList.add('on');
    film.classList.toggle('out', fi === 2);
    clearInterval(tick);
    let m = mins[fi]; minEl.textContent = m + ' min';
    if (fi < 2 && !reduce) tick = setInterval(() => { if (m > mins[fi + 1] + 1) { m--; minEl.textContent = m + ' min'; } }, SCENE / 4);
  };
  const playFilm = () => { clearInterval(ft); if (!reduce) ft = setInterval(() => scene(fi + 1), SCENE); };
  steps.forEach((t, k) => t.addEventListener('click', () => { scene(k); playFilm(); }));
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { scene(fi); playFilm(); } else { clearInterval(ft); clearInterval(tick); }
  }), { threshold: .4 }).observe(film);
  if (reduce) scene(0);
}

applyLang();
})();

/* ---------- Wishes: the three most wanted (publit.eu/api/wishes) ---------- */
(() => {
  const ol = document.getElementById('wishtop'); if (!ol) return;
  let top = [];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  window.renderWishTop = () => {
    if (!top.length) { ol.hidden = true; return; }
    const de = document.documentElement.lang === 'de', one = de ? 'Stimme' : 'vote', many = de ? 'Stimmen' : 'votes';
    ol.innerHTML = top.map(w => `<li><b>${w.votes}</b><span>${esc(w.title)}</span><i>${w.votes === 1 ? one : many}</i></li>`).join('');
    ol.hidden = false;
  };
  fetch('/api/wishes?sort=top', {cache: 'no-store'}).then(r => r.ok ? r.json() : null)
    .then(d => { if (d) { top = d.wishes.slice(0, 3); renderWishTop(); } }).catch(() => {});
})();
