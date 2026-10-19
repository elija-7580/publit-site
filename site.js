if (location.search.includes("shot")) document.documentElement.classList.add("shot");
(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains("shot");
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Language ---------- */
const EN = {
  navApp:'The app', navEurope:'Europe', navWhy:'Why', navAll:'All features', navCities:'For cities', footCities:'For cities and transit operators', light:'Light', dark:'Dark',
  film1:'Board', film2:'On the way', film3:'Get off', filmBanner:'Next stop: Marienplatz', filmBannerSub:'Get off now · U6 towards Klinikum Großhadern', allFeatures:'See all features →',
  kicker:'For iPhone · Made in EU · Open source',
  heroTitle:'Your way.<br>At a glance.',
  heroLead:'Publit shows what leaves near you, plans routes across Europe and guides you until you get off. It is free, with no ads and no account.',
  ctaPrimary:'View on GitHub', ctaSecondary:'See the features ↓',
  fact1:'Made in EU', fact2:'No account', fact3:'No tracking', fact4:'Open data',
  tabNearby:'Nearby', tabPlan:'Plan', tabRoute:'Route', tabLive:'On the way',
  f1Title:'What leaves next?', f1Text:'Open Publit and see the next departures around you: line, direction, platform and the minutes until it leaves. Live times and delays right beside them.',
  f1a:'Tap a station, route there with one tap', f1b:'Filter by metro, tram, bus, ferry', f1c:'When the stop is far, the walking time is shown', f1d:'Find cafés, pharmacies or supermarkets nearby on the map',
  f2Title:'Every route on one timeline.', f2Text:'Publit puts every connection on the same time axis, so you see at a glance which one arrives first, where you change and where it gets tight.',
  f2a:'Tight changes are marked', f2b:'Compare all routes on one map', f2c:'Walking, cycling and driving to compare',
  f3Title:'Know when to leave.', f3Text:'Every route says at the top when to leave and when you arrive. Below are the map and every step in the colours of the lines, with platforms, stops and delays.',
  f3a:'Reminders to leave and to get off', f3b:'Add to calendar or share as a link', f3c:'Attach tickets to the trip',
  f4Title:'From here until you get off.', f4Text:'On the way, Publit shows in large type which line you are on, how long is left and where to get off. Delays and platform changes appear at once, on the lock screen and in the Dynamic Island too.',
  f4a:'The whole trip at a glance', f4at:'One map with every remaining leg and the live times of each one.',
  f4b:'New connection from here', f4bt:'Missed a connection or took a wrong turn? One tap and Publit finds the best way from where you are now.',
  f4c:'Reminder to get off', f4ct:'Just before your stop Publit lets you know, with a spoken announcement if you like, so you don’t miss it.',
  f5Title:'Your ticket is already there.', f5Text:'Add tickets from a PDF, a photo or a screenshot. Publit reads the details on your iPhone and uploads nothing. At the gate the code is ready.',
  f5a:'Klimaticket, Deutschlandticket, single tickets', f5b:'The code bright and big at the gate',
  darkTitle:'Easy to read at midnight, too.',
  euTitle:'Public transport.<br>All over Europe.', euText:'For your commute and for cities you don’t know yet. Publit uses open timetable data from Transitous, from the Munich U-Bahn to the vaporetto in Venice.', euLink:'Coverage on the map ↓',
  whyTitle:'How Publit is built.',
  w1:'Made in EU', w1t:'Built in Europe, for Europe. Timetables from open European sources, without a detour through big platforms.', w2:'Private', w2t:'No account, no tracking, no analytics SDKs. Your places, trips and tickets stay on your iPhone.',
  w3:'Independent', w3t:'Built by an indie developer, not a corporation. No ads, no data trading, no interest in keeping you in the app.', w4:'Open data', w4t:'Publit uses open timetables (GTFS) and live data (GTFS-RT) via Transitous. All the code is open on GitHub.',
  w5:'Simple', w5t:'Open it and go. What matters is shown big, everything else is one tap away.', w6:'Smart routing', w6t:'Publit rates every change: how safe is it, how long do you wait and walk? The route that feels shortest wins.',
  endTitle:'Last stop. Everybody off, please.', endText:'Publit is still in development and coming to the App Store soon. Until then you can look at the code, try the app and send feedback.',
  footData:'Timetable data: Transitous and open data sources',
  covTitle:'What Publit knows where.', covText:'Every dot is a city we tested: green with live times, grey with timetables only, yellow with live times Publit fetches from the operators itself. Tap a dot for details.',
  covNote:'Samples from 14 October 2026, from open data (Transitous). All information without guarantee.', covAria:'Map of coverage in Europe',
  footPrivacy:'Privacy'
};
const DE = {};
$$('[data-t]').forEach(e => DE[e.dataset.t] = e.textContent);
$$('[data-t-html]').forEach(e => DE[e.dataset.tHtml] = e.innerHTML);
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en');
const langBtn = $('.lang');
function applyLang() {
  const d = lang === 'de' ? DE : EN;
  document.documentElement.lang = lang;
  $$('[data-t]').forEach(e => { if (d[e.dataset.t]) e.textContent = d[e.dataset.t]; });
  $$('[data-t-html]').forEach(e => { if (d[e.dataset.tHtml]) e.innerHTML = d[e.dataset.tHtml]; });
  langBtn.textContent = lang === 'de' ? 'EN' : 'DE';
  buildStops();
}
langBtn.addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('lang', lang); applyLang(); });

/* ---------- Header ---------- */
const top = $('.top');

/* ---------- Reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
  { rootMargin: '0px 0px -8% 0px', threshold: .12 });
$$('.reveal').forEach(e => io.observe(e));

/* ---------- Hero: the screens take turns ---------- */
const cycle = $('[data-cycle]'), shots = $$('.slide', cycle), tabs = $$('.cycle-tabs button');
let ci = 0, timer;
const CYCLE = 3600;
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
$$('.theme').forEach(b => b.addEventListener('click', () => document.body.classList.toggle('screens-dark')));

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

/* ---------- Cities light up one after another ---------- */
const cities = $$('.cities span');
let cityI = 0;
if (!reduce) setInterval(() => {
  cities.forEach(c => c.classList.remove('lit'));
  cities[cityI % cities.length].classList.add('lit');
  cities[(cityI + 5) % cities.length].classList.add('lit');
  cityI++;
}, 1100);

/* ---------- Ticker: steady drift, scroll gives it a push and its direction ---------- */
const rows = $$('.ticker-row').map(row => {
  const track = $('.ticker-track', row);
  track.innerHTML += track.innerHTML; // two copies: seamless loop
  return { track, base: +row.dataset.speed, x: 0, w: 0 };
});
function measure() { rows.forEach(r => r.w = r.track.scrollWidth / 2); }

/* ---------- The track: from the kicker dot through every heading down to the last button ---------- */
const NS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(NS, 'svg'); svg.classList.add('track'); svg.setAttribute('aria-hidden', 'true');
svg.innerHTML = '<defs><clipPath id="trackDark"></clipPath></defs><path class="rest"/><path class="done"/><path class="done-dark" clip-path="url(#trackDark)"/><g class="sts"></g>';
document.body.appendChild(svg);
const tdot = document.createElement('div'); tdot.className = 'tdot'; document.body.appendChild(tdot);
const [pRest, pDone, pDoneDark] = $$('path', svg), stG = $('.sts', svg), clip = $('#trackDark', svg);
let track = null;
function docXY(el) { let x = 0, y = 0; for (let e = el; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return { x, y }; }
function roundPath(v, r) {
  let d = `M${v[0][0]} ${v[0][1]}`;
  for (let i = 1; i < v.length - 1; i++) {
    const [ax, ay] = v[i - 1], [x, y] = v[i], [bx, by] = v[i + 1];
    const la = Math.hypot(ax - x, ay - y), lb = Math.hypot(bx - x, by - y), rr = Math.min(r, la / 2, lb / 2);
    if (rr < .5) { d += ` L${x} ${y}`; continue; }
    d += ` L${(x + (ax - x) / la * rr).toFixed(1)} ${(y + (ay - y) / la * rr).toFixed(1)} Q${x} ${y} ${(x + (bx - x) / lb * rr).toFixed(1)} ${(y + (by - y) / lb * rr).toFixed(1)}`;
  }
  const l = v[v.length - 1]; return d + ` L${l[0]} ${l[1]}`;
}
function buildTrack() {
  const mob = innerWidth < 900, G = mob ? 13 : 30;
  const els = $$('[data-station]');
  const st = els.map(el => {
    const p = docXY(el), r = el.getBoundingClientRect();
    if (el.dataset.station === 'start') return { x: p.x + r.width / 2, y: p.y + r.height / 2, el, kind: 'start' };
    if (el.dataset.station === 'end') return { x: p.x - (mob ? 22 : 34), y: p.y + el.offsetHeight / 2, el, kind: 'end' };
    const rg = document.createRange(); rg.selectNodeContents(el);
    const tl = rg.getClientRects()[0] || r;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    return { x: Math.round(p.x + (tl.left - r.left) - G), y: Math.round(p.y + fs * .52), el, kind: 'h', sec: el.closest('section') };
  });
  if (st.length < 2) return;
  const v = [[st[0].x, st[0].y]];
  let cx = Math.min(st[0].x, st[1].x);
  if (cx !== st[0].x) v.push([cx, st[0].y]);
  for (let i = 1; i < st.length; i++) {
    const S = st[i], last = v[v.length - 1];
    if (S.kind === 'end') { v.push([cx, S.y]); v.push([S.x, S.y]); continue; }
    if (Math.abs(S.x - cx) > 2) {
      const top = docXY(S.sec).y, yc = Math.max(last[1] + 30, top + Math.min(60, (S.y - top) * .4));
      v.push([cx, yc]); v.push([S.x, yc]);
    }
    v.push([S.x, S.y]); cx = S.x;
  }
  const d = roundPath(v, mob ? 18 : 30);
  [pRest, pDone, pDoneDark].forEach(p => p.setAttribute('d', d));
  const H = document.documentElement.scrollHeight, W = document.documentElement.clientWidth;
  svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const len = pRest.getTotalLength();
  const samples = []; for (let l = 0; l <= len; l += 3) { const q = pRest.getPointAtLength(l); samples.push([l, q.x, q.y]); }
  st.forEach(S => { let best = 0, bd = 1e9; for (const [l, x, y] of samples) { const dd = (x - S.x) ** 2 + (y - S.y) ** 2; if (dd < bd) { bd = dd; best = l; } } S.len = best; });
  st[0].len = 0; st[st.length - 1].len = len;
  const max = Math.max(1, H - innerHeight);
  let prev = 0;
  st.forEach((S, i) => { S.at = i === 0 ? 0 : i === st.length - 1 ? max : Math.max(prev + 1, Math.min(max - 1, S.y - innerHeight * .42)); prev = S.at; });
  const darks = $$('.ticker,.dark-strip').map(e => { const p = docXY(e); return { y: p.y, h: e.offsetHeight }; });
  clip.innerHTML = darks.map(r => `<rect x="0" y="${r.y}" width="${W}" height="${r.h}"/>`).join('');
  const inDark = y => darks.some(r => y >= r.y && y <= r.y + r.h);
  stG.innerHTML = st.slice(1).map(S => `<circle class="st${S.kind === 'end' ? ' end' : ''}${inDark(S.y) ? ' dk' : ''}" cx="${S.x}" cy="${S.y}" r="6"/>`).join('');
  track = { st, len, inDark, circles: [null, ...stG.children] };
}
let trackT; const queueTrack = () => { clearTimeout(trackT); trackT = setTimeout(buildTrack, 120); };
new ResizeObserver(queueTrack).observe(document.body);
function buildStops() { queueTrack(); }

/* ---------- One frame loop for everything that moves ---------- */
let lastY = scrollY, vel = 0, dir = 1, dotP = 0, lastT = performance.now();
function frame(t) {
  const dt = Math.min(64, t - lastT) / 1000; lastT = t;
  const y = scrollY, dy = y - lastY; lastY = y;
  vel += (dy / Math.max(dt, .001) - vel) * .12;
  if (Math.abs(dy) > .5) dir = dy > 0 ? 1 : -1;
  top.classList.toggle('scrolled', y > 10);

  // ticker
  if (!reduce) {
    const push = Math.min(14, Math.abs(vel) / 120);
    rows.forEach(r => {
      if (!r.w) return;
      r.x -= r.base * dir * (60 + push * 60) * dt;
      r.x = ((r.x % r.w) - r.w) % r.w;
      r.track.style.transform = `translate3d(${r.x}px,0,0)`;
    });
  }

  // track: the dot travels from station to station
  if (track) {
    const st = track.st;
    let i = 0; while (i < st.length - 2 && y >= st[i + 1].at) i++;
    const A = st[i], B = st[i + 1];
    const k = Math.min(1, Math.max(0, (y - A.at) / Math.max(1, B.at - A.at)));
    const target = A.len + (B.len - A.len) * k;
    dotP += (target - dotP) * (reduce ? 1 : Math.min(1, dt * 8));
    const q = pRest.getPointAtLength(dotP);
    tdot.style.transform = `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0)`;
    tdot.classList.toggle('dk', track.inDark(q.y));
    pDone.style.strokeDasharray = pDoneDark.style.strokeDasharray = `${dotP.toFixed(1)} ${track.len + 10}`;
    for (let j = 1; j < st.length; j++) track.circles[j].classList.toggle('passed', st[j].len <= dotP + 2);
  }

  // feature phones lean in as they arrive
  if (!reduce) for (const ph of tilt) {
    const r = ph.getBoundingClientRect(), c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    if (Math.abs(c) < 1.2) ph.style.transform = `translateY(${(c * 40).toFixed(1)}px) rotateX(${(c * 8).toFixed(2)}deg)`;
  }
  requestAnimationFrame(frame);
}
const tilt = $$('.feature-shot .phone');


addEventListener('resize', () => { measure(); buildTrack(); });
addEventListener('load', () => { measure(); buildTrack(); });
buildTrack();
applyLang(); measure();
requestAnimationFrame(frame);
})();
