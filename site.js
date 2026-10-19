if (location.search.includes("shot")) document.documentElement.classList.add("shot");
(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains("shot");
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Language ---------- */
const EN = {
  navApp:'The app', navEurope:'Europe', navWhy:'Why', navAll:'All features', allFeatures:'See all features →',
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
const cycle = $('[data-cycle]'), shots = $$('img', cycle), tabs = $$('.cycle-tabs button');
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

/* ---------- Feature phones: light, then night ---------- */
const swaps = $$('[data-theme-swap]');
const swapIO = new IntersectionObserver(es => es.forEach(e => {
  clearInterval(e.target._t);
  if (e.isIntersecting && !reduce) e.target._t = setInterval(() => e.target.classList.toggle('night'), 3200);
}), { threshold: .5 });
swaps.forEach(p => { swapIO.observe(p); p.addEventListener('click', () => p.classList.toggle('night')); });

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

/* ---------- The line ---------- */
const line = $('.line'), done = $('.line-done'), dot = $('.line-dot'), label = $('.line-label'), stopsEl = $('.line-stops');
let stops = [], railH = 0;
function buildStops() {
  railH = line.clientHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  stops = $$('[data-stop]').map(s => {
    const name = lang === 'en' ? (s.dataset.stopEn || s.dataset.stop) : s.dataset.stop;
    const at = Math.min(1, Math.max(0, (s.offsetTop - innerHeight * .35) / max));
    return { name, at };
  });
  stopsEl.innerHTML = stops.map(s => `<li style="top:${(s.at * railH).toFixed(1)}px"></li>`).join('');
}

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

  // line: the dot glides after the scroll position
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const p = Math.min(1, Math.max(0, y / max));
  dotP += (p - dotP) * (reduce ? 1 : Math.min(1, dt * 7));
  const py = dotP * railH;
  dot.style.transform = `translate3d(0,${py.toFixed(1)}px,0)`;
  done.style.height = py.toFixed(1) + 'px';
  flyKicker(y, py);
  let cur = 0;
  stops.forEach((s, i) => { if (dotP >= s.at - .002) cur = i; });
  const lis = stopsEl.children;
  for (let i = 0; i < lis.length; i++) {
    lis[i].classList.toggle('passed', i < cur);
    lis[i].classList.toggle('here', i === cur);
  }
  const moving = Math.abs(vel) > 40;
  const next = stops[Math.min(stops.length - 1, cur + (dir > 0 ? 1 : 0))];
  const nearStop = stops[cur] && Math.abs(dotP - stops[cur].at) < .012;
  const text = moving && next && next !== stops[cur] ? (lang === 'de' ? 'Nächster Halt: ' : 'Next stop: ') + next.name : (stops[cur] ? stops[cur].name : '');
  if (label.textContent !== text) label.textContent = text;
  line.classList.toggle('moving', moving);
  line.classList.toggle('near', !!nearStop);
  const under = document.elementFromPoint(line.getBoundingClientRect().left + 12, line.getBoundingClientRect().top + py);
  document.body.classList.toggle('on-dark', !!(under && under.closest('.ticker,.dark-strip')));

  // feature phones lean in as they arrive
  if (!reduce) for (const ph of tilt) {
    const r = ph.getBoundingClientRect(), c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    if (Math.abs(c) < 1.2) ph.style.transform = `translateY(${(c * 40).toFixed(1)}px) rotateX(${(c * 8).toFixed(2)}deg)`;
  }
  requestAnimationFrame(frame);
}
const tilt = $$('.feature-shot .phone');

/* ---------- The kicker dot flies onto the line, then the line dot takes over ---------- */
const kdot = $('.kicker .dot');
let kOrigin = null;
function measureKicker() {
  if (!kdot) return;
  const t = kdot.style.transform; kdot.style.transform = 'none';
  const r = kdot.getBoundingClientRect();
  kOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY };
  kdot.style.transform = t;
}
function flyKicker(y, py) {
  if (!kdot || !kOrigin) return;
  const D = Math.max(160, innerHeight * .32);
  const p = reduce ? (y > 4 ? 1 : 0) : Math.min(1, Math.max(0, y / D));
  if (p >= 1) { kdot.classList.add('gone'); dot.classList.remove('wait'); kdot.style.transform = 'none'; return; }
  kdot.classList.remove('gone'); dot.classList.add('wait');
  const lr = line.getBoundingClientRect(), dr = dot.offsetWidth;
  const tx = lr.left + dot.offsetLeft + dr / 2, ty = lr.top + py;
  const cx = kOrigin.x, cy = kOrigin.y - y;
  const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const arc = Math.sin(p * Math.PI) * -40;
  const sc = 1 + (dr / 10 - 1) * e;
  kdot.style.transform = `translate3d(${((tx - cx) * e).toFixed(1)}px,${((ty - cy) * e + arc).toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
}

addEventListener('resize', () => { measure(); buildStops(); measureKicker(); });
addEventListener('load', () => { measure(); buildStops(); measureKicker(); });
measureKicker(); setTimeout(measureKicker, 1300);
applyLang(); measure();
requestAnimationFrame(frame);
})();
