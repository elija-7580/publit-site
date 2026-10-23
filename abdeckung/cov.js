/* Coverage of Transitous: zoomable map, countries -> regions, real stop grid. Data: data/*.json (built from Transitous GTFS stops). */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const K = 0.6156614753256583, SX = 22.87703162651752, Y1 = 1.81486224426954, S = K * SX;
const px = lon => (lon + SX) * S;
const py = lat => (Y1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) * S * 180 / Math.PI;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- language ---------- */
const EN = {navHome: 'Home', navAll: 'All features', navCities: 'For cities', kick: 'Coverage of Transitous', title: 'Where Transitous runs.',
  lead: 'The map shows the whole world. Transitous coverage data is available for Europe, measured from real stops across its sources. Zoom in or tap a European country to see its states and regions.',
  hint: 'Pinch to zoom or rotate, drag to move, tap for details.', cellsT: 'Show stop grid (about 3 km)', tableT: 'All countries', methT: 'How the map is measured',
  meth1: 'For every European source in Transitous we read the stops from the processed GTFS file and place each stop in a country and region by its coordinates. Cross-border sources therefore count where their stops really are.',
  meth2: 'Area means: share of grid cells (about 3 × 3 km) in the area that contain at least one stop. When you zoom in, the map shows every single stop instead (to about 100 m) and a radius of about 300 m walking. Realtime means: share of stops whose source has a realtime feed in Transitous (GTFS-RT or SIRI). That does not mean every trip is live, only that live data is provided.',
  meth3: 'The yellow, green and grey dots are cities Publit tested itself. Borders: Natural Earth. No guarantee for any information.',
  footData: 'Timetables: Transitous and open data sources', footPrivacy: 'Privacy'};
const els = $$('[data-t]'), DE = {}; els.forEach(e => DE[e.dataset.t] = e.textContent);
let lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en');
const L = {
  de: {europe: 'Europa', cat: {l2: 'Fahrplan und Echtzeit', l1: 'Fahrplan, Echtzeit teilweise', t: 'Nur Fahrplan', v: 'Nur vereinzelt', n: 'Keine Daten'},
    cellL: 'Haltestellen mit Echtzeit-Quelle', cellT: 'Haltestellen nur mit Fahrplan', tested: 'Von Publit getestet',
    sources: 'Quellen', rtSources: 'mit Echtzeit', stops: 'Haltestellen', area: 'Fläche mit Haltestellen', live: 'Haltestellen mit Echtzeit-Quelle',
    regions: 'Regionen', srcList: 'Quellen in diesem Gebiet', more: n => `Alle ${n} anzeigen`, less: 'Weniger anzeigen', rt: 'Echtzeit', ops: 'Betreiber',
    country: 'Land', status: 'Status', date: d => `Stand der Daten: ${d}. Berechnet aus allen europäischen Quellen von Transitous.`,
    europeDesc: (n, s, r) => `${n} Länder mit Daten, ${s} Haltestellen aus ${r} Quellen. Tippe auf ein Land für Bundesländer, Regionen und alle Quellen.`,
    stopsIn: n => `${n} Haltestellen hier`, cityNote: 'Getestete Städte', noData: 'Transitous hat hier keine Haltestellen.',
    nation: (f, p) => `Eine Quelle deckt fast alles ab: ${f} (${p} % der Haltestellen).`,
    big: (f, p) => `Größte Quelle: ${f} mit ${p} % der Haltestellen.`,
    sum: (nm, k, srcs, rts) => `${nm}: ${srcs} ${srcs === 1 ? 'Quelle' : 'Quellen'} bei Transitous, ${rts ? rts + ' davon mit Echtzeit' : 'keine mit Echtzeit'}.`,
    area_: a => a >= .85 ? 'Fast überall gibt es Haltestellen in den Daten.' : a >= .5 ? 'In den meisten Gegenden gibt es Haltestellen in den Daten.' : a >= .2 ? 'Gut abgedeckt sind vor allem Städte und Hauptachsen.' : 'Nur einzelne Städte oder Linien sind in den Daten.',
    live_: l => l >= .9 ? 'Für fast alle Haltestellen gibt es eine Echtzeit-Quelle.' : l >= .5 ? 'Die meisten Haltestellen haben eine Echtzeit-Quelle.' : l >= .05 ? 'Echtzeit gibt es nur für einen Teil der Netze.' : 'Echtzeit gibt es hier bisher nicht.',
    tcat: {l: 'live', x: 'live über Publit', t: 'nur Fahrplan', p: 'teilweise', n: 'keine Daten'}, sel: 'Ausgewählt', back: 'Zurück'},
  en: {europe: 'Europe', cat: {l2: 'Timetable and realtime', l1: 'Timetable, realtime in part', t: 'Timetable only', v: 'Only scattered', n: 'No data'},
    cellL: 'Stops with a realtime source', cellT: 'Stops with timetable only', tested: 'Tested by Publit',
    sources: 'Sources', rtSources: 'with realtime', stops: 'Stops', area: 'Area with stops', live: 'Stops with a realtime source',
    regions: 'Regions', srcList: 'Sources in this area', more: n => `Show all ${n}`, less: 'Show less', rt: 'Realtime', ops: 'Operators',
    country: 'Country', status: 'Status', date: d => `Data as of ${d}. Computed from all European sources in Transitous.`,
    europeDesc: (n, s, r) => `${n} countries with data, ${s} stops from ${r} sources. Tap a country for its states, regions and all sources.`,
    stopsIn: n => `${n} stops here`, cityNote: 'Tested cities', noData: 'Transitous has no stops here.',
    nation: (f, p) => `One source covers almost everything: ${f} (${p} % of stops).`,
    big: (f, p) => `Largest source: ${f} with ${p} % of stops.`,
    sum: (nm, k, srcs, rts) => `${nm}: ${srcs} ${srcs === 1 ? 'source' : 'sources'} in Transitous, ${rts ? rts + ' of them with realtime' : 'none with realtime'}.`,
    area_: a => a >= .85 ? 'There are stops in the data almost everywhere.' : a >= .5 ? 'Most areas have stops in the data.' : a >= .2 ? 'Mainly cities and main corridors are covered.' : 'Only single cities or lines are in the data.',
    live_: l => l >= .9 ? 'Almost every stop has a realtime source.' : l >= .5 ? 'Most stops have a realtime source.' : l >= .05 ? 'Realtime exists for some networks only.' : 'No realtime here yet.',
    tcat: {l: 'live', x: 'live via Publit', t: 'timetable only', p: 'partly', n: 'no data'}, sel: 'Selected', back: 'Back'}
};
const T = () => L[lang];
const nf = n => n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB');
const pc = x => Math.round(x * 100);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const CATS = ['l2', 'l1', 't', 'v', 'n'];
const TSTYLE = {n: ['#ffffff', '#9c9ca1'], p: ['#ffffff', '#b25000'], t: ['#9c9ca1', '#111111'], x: ['#ffc531', '#111111'], l: ['#1b7a33', '#ffffff']};

/* ---------- extra strings ---------- */
Object.assign(L.de, {areaS: 'Fläche', liveS: 'Echtzeit', search: 'Land, Region oder Stadt suchen', none: 'Nichts gefunden', city: 'Stadt', regionW: 'Region',
  zoomMore: 'Zoomen für einzelne Haltestellen', stopsMode: 'Einzelne Haltestellen', loading: 'Lädt Haltestellen …',
  dotL: 'Haltestelle mit Echtzeit-Quelle', dotT: 'Haltestelle nur mit Fahrplan', walk: 'Etwa 300 m um eine Haltestelle',
  quick: (s, r, n) => `${s} Quellen · ${r} mit Echtzeit · ${n} Haltestellen`, back: 'Zurück', zin: 'Hineinzoomen', zout: 'Herauszoomen', home: 'Ganze Welt', grab: 'Details ein- oder ausklappen'});
Object.assign(L.en, {areaS: 'Area', liveS: 'Realtime', search: 'Search country, region or city', none: 'Nothing found', city: 'City', regionW: 'Region',
  zoomMore: 'Zoom in for single stops', stopsMode: 'Single stops', loading: 'Loading stops …',
  dotL: 'Stop with a realtime source', dotT: 'Stop with timetable only', walk: 'About 300 m around a stop',
  quick: (s, r, n) => `${s} sources · ${r} with realtime · ${n} stops`, back: 'Back', zin: 'Zoom in', zout: 'Zoom out', home: 'Whole world', grab: 'Expand or collapse details'});
L.de.cellsT = 'Haltestellen zeigen'; L.en.cellsT = 'Show stops';
EN.cellsT = 'Show stops';

/* ---------- map setup ---------- */
const svg = $('#m'), wrap = $('#map'), tip = $('#tip'), panel = $('#panel'), pbody = $('#pbody'), cv = $('#cv'), ctx = cv.getContext('2d');
svg.innerHTML = '<g id="world" transform="scale(.1)"></g><g id="gw" transform="scale(.1)"></g><g id="gr" transform="scale(.01)"></g><g id="gh"></g>';
const world = $('#world', svg), gw = $('#gw', svg), gr = $('#gr', svg), gh = $('#gh', svg);
const mobile = matchMedia('(max-width:1320px)');
let D = null, byIso = {}, cache = {}, cur = {iso: null, region: null}, view = {x: 0, y: 170, w: 1000, h: 790}, mapBounds = null, anim = null, showStops = true, rotation = 0;
let W = 1, H = 1, DPR = 1;
const WORLD = [px(-180), py(85), px(180), py(-85)];
const unLat = y => (Math.atan(Math.exp(Y1 - y * Math.PI / (180 * S))) - Math.PI / 4) * 360 / Math.PI;
const unLon = x => x / S - SX;

function measure() {
  const r = wrap.getBoundingClientRect(); W = r.width || 1; H = r.height || 1; DPR = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
}
function insets() {
  if (mobile.matches) return {l: 0, t: 60, r: 0, b: (parseFloat(getComputedStyle(wrap).getPropertyValue('--peek')) || 150) + 12};
  return {l: 0, t: 60, r: panel.offsetWidth + 24, b: 0};
}
const ppu = () => W / view.w; // screen px per map unit
function apply() {
  view.h = view.w * H / W;
  if (mapBounds) {
    const [x0, y0, x1, y1] = mapBounds, padX = (x1 - x0) * .025, padY = (y1 - y0) * .025;
    const left = x0 - padX, right = x1 + padX, top = y0 - padY, bottom = y1 + padY;
    view.x = view.w >= right - left ? (left + right - view.w) / 2 : Math.max(left, Math.min(right - view.w, view.x));
    view.y = view.h >= bottom - top ? (top + bottom - view.h) / 2 : Math.max(top, Math.min(bottom - view.h, view.y));
    const fade = Math.min(96, Math.max(36, Math.min(W, H) * .08));
    const edges = [
      (x0 - view.x) * W / view.w,
      (x1 - view.x) * W / view.w,
      (y0 - view.y) * H / view.h,
      (y1 - view.y) * H / view.h
    ];
    const fades = [];
    if (edges[0] > -fade && edges[0] < W + fade) fades.push(`linear-gradient(to right,var(--c-sea),transparent) ${edges[0].toFixed(1)}px 0/${fade}px 100% no-repeat`);
    if (edges[1] > -fade && edges[1] < W + fade) fades.push(`linear-gradient(to left,var(--c-sea),transparent) ${(edges[1] - fade).toFixed(1)}px 0/${fade}px 100% no-repeat`);
    if (edges[2] > -fade && edges[2] < H + fade) fades.push(`linear-gradient(to bottom,var(--c-sea),transparent) 0 ${edges[2].toFixed(1)}px/100% ${fade}px no-repeat`);
    if (edges[3] > -fade && edges[3] < H + fade) fades.push(`linear-gradient(to top,var(--c-sea),transparent) 0 ${(edges[3] - fade).toFixed(1)}px/100% ${fade}px no-repeat`);
    wrap.style.setProperty('--map-data-fades', fades.join(',') || 'none');
  }
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  svg.style.transform = cv.style.transform = `rotate(${rotation}deg)`;
  schedule();
}
function fitBox(b, pad = .08) {
  const I = insets(), fw = Math.max(80, W - I.l - I.r), fh = Math.max(80, H - I.t - I.b);
  const bw = (b[2] - b[0]) * (1 + pad * 2), bh = (b[3] - b[1]) * (1 + pad * 2);
  const k = Math.max(bw / fw, bh / fh, 1 / 60), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  return {x: cx - (I.l + fw / 2) * k, y: cy - (I.t + fh / 2) * k, w: W * k, h: H * k};
}
function animateTo(t, ms = 800) {
  cancelAnimationFrame(anim); stopInertia();
  if (reduce) { view = t; apply(); return; }
  const f = {...view}, t0 = performance.now();
  const fc = {x: f.x + f.w / 2, y: f.y + f.h / 2}, tc = {x: t.x + t.w / 2, y: t.y + t.h / 2};
  // "fly" curve: zoom out a little while travelling far
  const dist = Math.hypot(tc.x - fc.x, tc.y - fc.y), bump = Math.min(1.6, dist / Math.max(f.w, t.w));
  const step = now => {
    let u = Math.min(1, (now - t0) / ms); const e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    const lw = Math.log(f.w) + (Math.log(t.w) - Math.log(f.w)) * e + bump * .35 * Math.sin(Math.PI * e);
    const w = Math.exp(lw), cx = fc.x + (tc.x - fc.x) * e, cy = fc.y + (tc.y - fc.y) * e;
    view = {x: cx - w / 2, y: cy - w * H / W / 2, w, h: w * H / W}; apply();
    if (u < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
const MINW = 1.1, MAXW = 8000;
function zoomAt(f, cx, cy) {
  const w = Math.min(MAXW, Math.max(MINW, view.w * f)); f = w / view.w;
  view = {x: cx - (cx - view.x) * f, y: cy - (cy - view.y) * f, w, h: view.h * f}; apply();
}
function zoomBy(f, ms = 320) {
  const I = insets(), sx = (I.l + (W - I.l - I.r) / 2) / W, sy = (I.t + (H - I.t - I.b) / 2) / H;
  const cx = view.x + view.w * sx, cy = view.y + view.h * sy, w = Math.min(MAXW, Math.max(MINW, view.w * f)), k = w / view.w;
  animateTo({x: cx - (cx - view.x) * k, y: cy - (cy - view.y) * k, w, h: view.h * k}, ms);
}
function screenDelta(dx, dy) { const a = rotation * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return {x: c * dx + s * dy, y: -s * dx + c * dy}; }
function toUnits(cx, cy) {
  const r = wrap.getBoundingClientRect(), sx = cx - r.left - W / 2, sy = cy - r.top - H / 2, p = screenDelta(sx, sy);
  return {x: view.x + (p.x + W / 2) / W * view.w, y: view.y + (p.y + H / 2) / H * view.h};
}
const toScreen = (x, y) => { const a = rotation * Math.PI / 180, sx = (x - view.x) * W / view.w - W / 2, sy = (y - view.y) * H / view.h - H / 2; return [W / 2 + sx * Math.cos(a) - sy * Math.sin(a), H / 2 + sx * Math.sin(a) + sy * Math.cos(a)]; };

/* ---------- gestures: drag with momentum, smooth wheel, pinch, double tap ---------- */
const ptrs = new Map(); let moved = 0, pinch = null, vel = {x: 0, y: 0, t: 0}, inertia = 0, lastTap = {t: 0, x: 0, y: 0};
function stopInertia() { cancelAnimationFrame(inertia); inertia = 0; }
let zp = 0, zc = null, zr = 0;
function zstep() {
  const s = zp * .3; zp -= s; zoomAt(Math.exp(s), zc.x, zc.y);
  if (Math.abs(zp) > .002) zr = requestAnimationFrame(zstep); else { zoomAt(Math.exp(zp), zc.x, zc.y); zp = 0; zr = 0; }
}
svg.addEventListener('wheel', e => {
  e.preventDefault(); cancelAnimationFrame(anim); stopInertia(); hideTip();
  const d = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
  zp += Math.max(-1, Math.min(1, d * (e.ctrlKey ? .011 : .0024))); zc = toUnits(e.clientX, e.clientY);
  if (!zr) zr = requestAnimationFrame(zstep);
}, {passive: false});
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
  moved = ptrs.size > 1 ? 99 : 0; cancelAnimationFrame(anim); stopInertia(); pinch = null; vel = {x: 0, y: 0, t: performance.now()};
  closeSearch();
});
svg.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) { hover(e); return; }
  const k = view.w / W, prev = ptrs.get(e.pointerId);
  ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (ptrs.size === 1) {
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y, delta = screenDelta(dx, dy); moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 5) {
      svg.classList.add('drag'); view.x -= delta.x * k; view.y -= delta.y * k; apply(); hideTip();
      const now = performance.now(), dt = Math.max(1, now - vel.t);
      vel = {x: .75 * (dx / dt) + .25 * vel.x, y: .75 * (dy / dt) + .25 * vel.y, t: now};
    }
  } else if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}, angle = Math.atan2(b.y - a.y, b.x - a.x);
    if (pinch) {
      let da = angle - pinch.angle; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      rotation += da * 180 / Math.PI; const u = toUnits(m.x, m.y), pu = toUnits(pinch.m.x, pinch.m.y);
      view.x -= u.x - pu.x; view.y -= u.y - pu.y; const p = toUnits(m.x, m.y); zoomAt(pinch.d / d, p.x, p.y);
    }
    pinch = {d, m, angle}; moved = 99; hideTip();
  }
});
function up(e) {
  const wasDrag = ptrs.size === 1 && moved > 5;
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
  if (!ptrs.size) setTimeout(() => svg.classList.remove('drag'), 0);
  if (wasDrag && !reduce && performance.now() - vel.t < 80 && Math.hypot(vel.x, vel.y) > .15) {
    let vx = vel.x, vy = vel.y, t0 = performance.now();
    const step = now => {
      const dt = Math.min(32, now - t0); t0 = now; const k = view.w / W;
      const delta = screenDelta(vx * dt, vy * dt); view.x -= delta.x * k; view.y -= delta.y * k; apply();
      const f = Math.pow(.994, dt); vx *= f; vy *= f;
      inertia = Math.hypot(vx, vy) > .02 ? requestAnimationFrame(step) : 0;
    };
    inertia = requestAnimationFrame(step);
  }
}
svg.addEventListener('pointerup', e => {
  const wasClick = moved < 6 && ptrs.size === 1; up(e);
  if (!wasClick) return;
  const now = performance.now();
  if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) { // double tap / click: zoom in there
    lastTap.t = 0; const p = toUnits(e.clientX, e.clientY), w = Math.max(MINW, view.w * .45), k = w / view.w;
    animateTo({x: p.x - (p.x - view.x) * k, y: p.y - (p.y - view.y) * k, w, h: view.h * k}, 380); return;
  }
  lastTap = {t: now, x: e.clientX, y: e.clientY}; click(e);
});
svg.addEventListener('pointercancel', up);
svg.addEventListener('pointerleave', () => { hideTip(); setHover(null); });
svg.addEventListener('dblclick', e => e.preventDefault());
$('#zin').onclick = () => zoomBy(.5);
$('#zout').onclick = () => zoomBy(2);
$('#zhome').onclick = () => go(null);
$('#back').onclick = () => go(cur.region ? cur.iso : null);
addEventListener('keydown', e => {
  if (e.target.matches('input')) return;
  if (e.key === 'Escape') go(cur.region ? cur.iso : null);
  else if (e.key === '+' || e.key === '=') zoomBy(.5);
  else if (e.key === '-') zoomBy(2);
});
let rsz = 0;
new ResizeObserver(() => { cancelAnimationFrame(rsz); rsz = requestAnimationFrame(() => {
  const c = {x: view.x + view.w / 2, y: view.y + view.h / 2}; measure();
  if (!D) return; view.h = view.w * H / W; view.x = c.x - view.w / 2; view.y = c.y - view.h / 2; apply();
}); }).observe(wrap);

/* ---------- hover + click ---------- */
function tipAt(html, x, y) {
  tip.innerHTML = html; tip.classList.add('show');
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let left = x - tw / 2, top = y - th - 14;
  if (top < 64) top = y + 16;
  left = Math.max(10, Math.min(W - tw - 10, left)); top = Math.max(10, Math.min(H - th - 10, top));
  tip.style.left = left + 'px'; tip.style.top = top + 'px';
}
function hideTip() { tip.classList.remove('show'); }
function cityAt(cx, cy) {
  if (!D) return -1; const r = wrap.getBoundingClientRect(), x = cx - r.left, y = cy - r.top; let best = -1, bd = 12;
  D.publit.forEach((p, i) => { const [sx, sy] = toScreen(px(p[2]), py(p[1])); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = i; } });
  return best;
}
const cityHtml = p => `<b>${esc(p[0])}</b><span>${T().tcat[p[3]]}${p[4] ? ' · ' + esc(lang === 'de' ? p[5] || p[4] : p[4]) : ''}</span>`;
let hovEl = null;
function setHover(el) {
  if (hovEl === el) return; hovEl?.classList.remove('hov'); hovEl = el; el?.classList.add('hov');
  const old = $('.hh', gh); if (old) old.remove();
  if (el) { const p = el.cloneNode(); p.setAttribute('class', 'hh'); p.setAttribute('transform', el.classList.contains('r') ? 'scale(.01)' : 'scale(.1)'); gh.appendChild(p); }
}
function hover(e) {
  if (e.pointerType === 'touch' || !D) return;
  const r = wrap.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, ci = cityAt(e.clientX, e.clientY);
  if (ci >= 0) { setHover(null); svg.style.cursor = 'pointer'; tipAt(cityHtml(D.publit[ci]), x, y); return; }
  svg.style.cursor = '';
  const t = e.target; let html = '';
  if (t.classList.contains('c') && !(cur.iso === t.dataset.iso && gr.childElementCount)) { const c = byIso[t.dataset.iso]; html = `<b>${esc(c[lang])}</b><span>${T().cat[c.cat]}</span>`; setHover(t); }
  else if (t.classList.contains('r')) { const R = regionOf(cur.iso, t.dataset.id); html = `<b>${esc(R[lang])}</b><span>${T().cat[R.cat]} · ${T().stopsIn(nf(R.stops))}</span>`; setHover(t); }
  else setHover(null);
  if (!html) { hideTip(); return; }
  tipAt(html, x, y);
}
function click(e) {
  const ci = cityAt(e.clientX, e.clientY);
  if (ci >= 0) { const p = D.publit[ci], [sx, sy] = toScreen(px(p[2]), py(p[1])); tipAt(cityHtml(p), sx, sy); return; }
  const el = document.elementFromPoint(e.clientX, e.clientY) || e.target;
  if (el.classList.contains('r')) { go(cur.iso, el.dataset.id); return; }
  if (el.classList.contains('c')) { if (el.dataset.iso !== cur.iso || cur.region) go(el.dataset.iso); return; }
  hideTip();
}

/* ---------- vector layers ---------- */
function regionOf(iso, id) { return cache[iso] && cache[iso].regions.find(r => r.id === id); }
function drawEurope() {
  world.innerHTML = (D.world || []).filter(Boolean).map(d => `<path class="world-land" d="${d}"/>`).join('');
  gw.innerHTML = D.countries.map(c => c.eu ? `<path class="c k-${c.cat}" data-iso="${c.iso}" d="${c.d}"/>` : `<path class="bg" d="${c.d}"/>`).join('');
}
function cellsArr(str, dx, dy) {
  if (!str) return new Float32Array(0);
  const parts = str.split(';'), a = new Float32Array(parts.length * 2);
  parts.forEach((c, k) => { const q = c.indexOf(','), i = +c.slice(0, q), j = +c.slice(q + 1); a[2 * k] = px((i + .5) * dx); a[2 * k + 1] = py((j + .5) * dy); });
  return a;
}
async function load(iso) {
  if (!cache[iso]) {
    const c = await (await fetch(`data/${iso}.json`)).json(); cache[iso] = c;
    c.aL = cellsArr(c.cl, c.dx, c.dy); c.aT = cellsArr(c.cs, c.dx, c.dy); c.cellU = px(c.dx) - px(0);
  }
  return cache[iso];
}
function highlight() {
  gh.querySelectorAll('.hl').forEach(n => n.remove());
  let d = null, sc = '.1';
  if (cur.region) { const R = regionOf(cur.iso, cur.region); if (R) { d = R.d; sc = '.01'; } }
  else if (cur.iso) d = byIso[cur.iso].d;
  if (d) gh.insertAdjacentHTML('afterbegin', `<path class="hl" transform="scale(${sc})" d="${d}"/>`);
}
async function go(iso, region = null, push = true) {
  hideTip(); setHover(null); closeSearch();
  cur = {iso, region};
  $('#back').hidden = !iso;
  $$('.c.on', gw).forEach(e => e.classList.remove('on'));
  if (!iso) {
    rotation = 0;
    svg.classList.remove('focus'); gr.innerHTML = ''; gr.dataset.iso = '';
    renderPanel(); animateTo(fitBox(WORLD, .01)); highlight(); schedule();
    if (push) history.replaceState(null, '', location.pathname + location.search);
    return;
  }
  const c = byIso[iso]; if (!c) return;
  svg.classList.add('focus'); $(`.c[data-iso="${iso}"]`, gw)?.classList.add('on');
  renderPanel(); highlight();
  if (!region) animateTo(fitBox(c.b));
  const data = await load(iso);
  if (cur.iso !== iso) return;
  if (gr.dataset.iso !== iso) { gr.dataset.iso = iso; gr.innerHTML = data.regions.map(R => `<path class="r k-${R.cat}" data-id="${esc(R.id)}" d="${R.d}"/>`).join(''); }
  $$('.r', gr).forEach(p => p.classList.toggle('on', p.dataset.id === region));
  renderPanel(); highlight(); schedule();
  if (region) { const R = regionOf(iso, region); if (R) animateTo(fitBox(R.b, .1)); }
  if (push) history.replaceState(null, '', '#' + iso + (region ? '/' + encodeURIComponent(region) : ''));
}

/* ---------- canvas: stop dots, walking radius, place names, tested cities ---------- */
const TILE = new Set(), tiles = new Map(), A64 = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('').forEach((c, i) => A64[c.charCodeAt(0)] = i);
function decode(s, tx, ty) {
  const out = []; let prev = -1, d = 0, mul = 1;
  for (let i = 0; i < s.length; i++) {
    const v = A64[s.charCodeAt(i)];
    if (v >= 32) { d += (v - 32) * mul; mul *= 32; } else { d += v * mul; prev += d + 1; out.push(prev); d = 0; mul = 1; }
  }
  const a = new Float32Array(out.length * 2);
  out.forEach((q, k) => { const ix = q % 2000, iy = (q - ix) / 2000; a[2 * k] = px((tx * 2000 + ix) / 1000); a[2 * k + 1] = py((ty * 2000 + iy) / 1000); });
  return a;
}
function needTiles() {
  const lo0 = Math.floor(unLon(view.x) / 2), lo1 = Math.floor(unLon(view.x + view.w) / 2), la0 = Math.floor(unLat(view.y + view.h) / 2), la1 = Math.floor(unLat(view.y) / 2);
  const list = [];
  for (let x = lo0; x <= lo1; x++) for (let y = la0; y <= la1; y++) { const k = x + '_' + y; if (TILE.has(k)) list.push(k); }
  return list;
}
function getTile(k) {
  let t = tiles.get(k); if (t) return t;
  t = {ready: false}; tiles.set(k, t);
  const [tx, ty] = k.split('_').map(Number);
  fetch(`data/t/${k}.txt`).then(r => r.text()).then(s => { const [l, o] = s.split('\n'); t.L = decode(l || '', tx, ty); t.T = decode(o || '', tx, ty); t.ready = true; t.lat = ty * 2 + 1; schedule(); }).catch(() => {});
  return t;
}
let col = {};
function readColors() {
  const cs = getComputedStyle($('.covpage'));
  col = {L: cs.getPropertyValue('--c-cell-l').trim(), T: cs.getPropertyValue('--c-cell-t').trim(), sea: cs.getPropertyValue('--c-sea').trim(), ink: getComputedStyle(document.body).color};
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); schedule(); });
let raf = 0; function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
const halo = document.createElement('canvas'), hctx = halo.getContext('2d');
function dots(c, arr, color, r, x0, y0, x1, y1, k) {
  c.fillStyle = color; c.beginPath();
  const vx = view.x, vy = view.y, sq = r < 1.4;
  for (let i = 0; i < arr.length; i += 2) {
    const x = arr[i], y = arr[i + 1]; if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    const sx = (x - vx) * k, sy = (y - vy) * k;
    if (sq) c.rect(sx - r, sy - r, r * 2, r * 2); else { c.moveTo(sx + r, sy); c.arc(sx, sy, r, 0, 6.2832); }
  }
  c.fill();
}
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const STOPS_AT = 15; // px per unit where single stops replace the 3 km grid
function draw() {
  raf = 0; if (!D) return;
  const k = ppu(), m = 30 / k, x0 = view.x - m, y0 = view.y - m, x1 = view.x + view.w + m, y1 = view.y + view.h + m;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  const fineA = showStops ? smooth(STOPS_AT * .8, STOPS_AT * 1.15, k) : 0;
  const c = cur.iso && cache[cur.iso];
  svg.classList.toggle('fine', fineA > .5);
  // 1. 3 km grid of the selected country as a dot matrix
  if (showStops && c && c.aL && fineA < 1) {
    const sp = c.cellU * k, r = Math.max(.7, Math.min(2.4, sp * .34));
    ctx.globalAlpha = 1 - fineA;
    dots(ctx, c.aT, col.T, r, x0, y0, x1, y1, k); dots(ctx, c.aL, col.L, r, x0, y0, x1, y1, k);
  }
  // 2. real stops, with a soft 300 m walking radius when close
  let pending = 0;
  if (fineA > 0) {
    const list = needTiles(), r = Math.max(1, Math.min(2.6, .9 + (k - STOPS_AT) * .03));
    const ts = list.map(getTile).filter(t => t.ready); pending = list.length - ts.length;
    const latC = unLat(view.y + view.h / 2), walk = 300 * S / (111320 * Math.cos(latC * Math.PI / 180)) * k;
    if (walk > 3.5) {
      if (halo.width !== cv.width || halo.height !== cv.height) { halo.width = cv.width; halo.height = cv.height; }
      hctx.setTransform(DPR, 0, 0, DPR, 0, 0); hctx.clearRect(0, 0, W, H);
      for (const t of ts) dots(hctx, t.T, col.T, walk, x0, y0, x1, y1, k);
      for (const t of ts) dots(hctx, t.L, col.L, walk, x0, y0, x1, y1, k);
      ctx.globalAlpha = fineA * .17 * smooth(3.5, 9, walk); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(halo, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    ctx.globalAlpha = fineA;
    for (const t of ts) dots(ctx, t.T, col.T, r, x0, y0, x1, y1, k);
    for (const t of ts) dots(ctx, t.L, col.L, r, x0, y0, x1, y1, k);
  }
  ctx.globalAlpha = 1;
  // tested cities
  D.publit.forEach(p => {
    const [sx, sy] = toScreen(px(p[2]), py(p[1])); if (sx < -10 || sy < -10 || sx > W + 10 || sy > H + 10) return;
    const s = TSTYLE[p[3]], rr = k > 6 ? 5.5 : 4.5;
    ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 6.2832); ctx.fillStyle = s[0]; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = s[1]; ctx.stroke();
  });
  labels(k);
  scaleBar(k); modeChip(k, pending);
}
function labels(k) {
  const max = k < 2 ? -1 : k < 4 ? 2 : k < 8 ? 4 : k < 16 ? 6 : k < 32 ? 7 : 8;
  if (max < 0) return;
  const boxes = [];
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const p of D.places) {
    if (p[3] > max) break;
    const [sx, sy0] = toScreen(px(p[2]), py(p[1])); if (sx < -60 || sx > W + 60 || sy0 < -20 || sy0 > H + 20) continue;
    const sy = sy0 - 15, big = p[4] || p[3] <= 2;
    ctx.font = `${big ? 700 : 600} ${big ? 13 : 12}px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
    const w = ctx.measureText(p[0]).width, b = [sx - w / 2 - 4, sy - 9, sx + w / 2 + 4, sy + 9];
    if (boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
    boxes.push(b);
    ctx.lineWidth = 3.5; ctx.strokeStyle = col.sea; ctx.globalAlpha = .9; ctx.strokeText(p[0], sx, sy);
    ctx.globalAlpha = big ? .92 : .75; ctx.fillStyle = col.ink; ctx.fillText(p[0], sx, sy); ctx.globalAlpha = 1;
    if (k > 6) { ctx.beginPath(); ctx.arc(sx, sy0, 1.8, 0, 6.2832); ctx.fillStyle = col.ink; ctx.globalAlpha = .55; ctx.fill(); ctx.globalAlpha = 1; }
  }
}
const scaleEl = $('#scale'), modeEl = $('#mode');
function scaleBar(k) {
  const lat = unLat(view.y + view.h / 2), mpp = 111320 * Math.cos(lat * Math.PI / 180) / S / k, target = mpp * 90;
  const p = Math.pow(10, Math.floor(Math.log10(target))), n = target / p >= 5 ? 5 : target / p >= 2 ? 2 : 1, m = n * p;
  scaleEl.firstElementChild.style.width = Math.round(m / mpp) + 'px';
  scaleEl.lastElementChild.textContent = m >= 1000 ? nf(m / 1000) + ' km' : nf(m) + ' m';
}
function modeChip(k, pending) {
  let t = '';
  if (showStops && k >= STOPS_AT * .8) t = pending ? T().loading : T().stopsMode;
  else if (showStops && cur.iso) t = T().zoomMore;
  modeEl.innerHTML = t ? `<b></b>${t}` : ''; modeEl.classList.toggle('show', !!t);
}

/* ---------- search ---------- */
const q = $('#q'), qres = $('#qres');
const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let qi = [], qsel = 0;
function searchIndex() {
  const out = [];
  D.countries.filter(c => c.eu).forEach(c => out.push({t: c[lang], alt: c[lang === 'de' ? 'en' : 'de'], k: 'c', cat: c.cat, sub: T().country, go: () => go(c.iso)}));
  D.countries.filter(c => c.rn).forEach(c => c.rn.forEach(([id, de, en]) => out.push({t: lang === 'de' ? de : en, alt: id, k: 'r', sub: c[lang], go: () => go(c.iso, id)})));
  D.places.forEach(p => out.push({t: p[0], k: 'p', sub: T().city, rank: p[3], go: () => flyTo(p)}));
  return out;
}
function flyTo(p) {
  const x = px(p[2]), y = py(p[1]), w = W / 34, I = insets(), k = w / W;
  hideTip(); animateTo({x: x - (I.l + (W - I.l - I.r) / 2) * k, y: y - (I.t + (H - I.t - I.b) / 2) * k, w, h: H * k}, 1100);
  if (mobile.matches) panel.classList.remove('open');
}
function runSearch() {
  const s = norm(q.value.trim()); if (!s) { closeSearch(); return; }
  const idx = searchIndex(), hit = [];
  for (const it of idx) {
    const a = norm(it.t), b = it.alt ? norm(it.alt) : '';
    const sc = a.startsWith(s) || b.startsWith(s) ? 0 : a.includes(s) || b.includes(s) ? 1 : -1;
    if (sc >= 0) hit.push([sc * 10 + ({c: 0, r: 1, p: 2}[it.k]) + (it.rank || 0) * .01, it]);
  }
  hit.sort((x, y) => x[0] - y[0]); qi = hit.slice(0, 8).map(h => h[1]); qsel = 0;
  qres.innerHTML = qi.length ? qi.map((it, i) => `<li role="option" data-i="${i}" aria-selected="${i === qsel}" class="${it.k === 'p' ? 'city' : ''}"><i style="${it.cat ? `background:var(--c-${it.cat})` : ''}"></i>${esc(it.t)}<small>${esc(it.sub)}</small></li>`).join('') : `<li class="none">${T().none}</li>`;
  qres.hidden = false;
}
function closeSearch() { qres.hidden = true; }
function pick(i) { const it = qi[i]; if (!it) return; q.value = ''; closeSearch(); q.blur(); it.go(); }
q.addEventListener('input', runSearch);
q.addEventListener('focus', () => { if (q.value) runSearch(); });
q.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); qsel = (qsel + (e.key === 'ArrowDown' ? 1 : -1) + qi.length) % Math.max(1, qi.length); $$('li', qres).forEach((li, i) => li.setAttribute('aria-selected', i === qsel)); }
  else if (e.key === 'Enter') { e.preventDefault(); pick(qsel); }
  else if (e.key === 'Escape') { q.value = ''; closeSearch(); q.blur(); }
});
qres.addEventListener('pointerdown', e => { const li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
document.addEventListener('pointerdown', e => { if (!e.target.closest('.m-search')) closeSearch(); });

/* ---------- panel ---------- */
const catChip = k => `<span class="chip"><i style="background:var(--c-${k})"></i>${T().cat[k]}</span>`;
const rtsOf = a => a.feeds.filter(([fi]) => D.feeds[fi].rt).length;
function kpis(a) {
  const rts = rtsOf(a);
  return `<div class="kpis"><div><b>${nf(a.feeds.length)}</b><span>${T().sources}</span></div><div><b>${nf(rts)}</b><span>${T().rtSources}</span></div>
    <div><b>${nf(a.stops)}</b><span>${T().stops}</span></div><div><b>${pc(a.area)} %</b><span>${T().area}</span></div></div>
    <div class="bar t"><small><span>${T().area}</span><span>${pc(a.area)} %</span></small><div><i style="width:${pc(a.area)}%"></i></div></div>
    <div class="bar"><small><span>${T().live}</span><span>${pc(a.live)} %</span></small><div><i style="width:${pc(a.live)}%"></i></div></div>`;
}
function describe(name, a) {
  if (!a.stops) return `<p class="desc">${T().noData}</p>`;
  const rts = rtsOf(a), tot = a.feeds.reduce((s, [, n]) => s + n, 0) || 1, top = a.feeds[0], share = top ? top[1] / tot : 0;
  const t = [T().sum(name, 0, a.feeds.length, rts), T().area_(a.area), T().live_(a.live)];
  if (top && a.feeds.length > 1) t.push(share > .6 ? T().nation(D.feeds[top[0]].n, pc(share)) : share > .2 ? T().big(D.feeds[top[0]].n, pc(share)) : '');
  return `<p class="desc">${t.filter(Boolean).map(esc).join(' ')}</p>`;
}
function feedList(a) {
  if (!a.feeds.length) return '';
  const item = ([fi, n]) => { const f = D.feeds[fi]; const ops = f.o.filter(o => o && o !== f.n);
    return `<li><b>${esc(f.n)}${f.rt ? `<span class="rt">${T().rt}</span>` : ''}</b><small>${T().stopsIn(nf(n))}${ops.length ? ' · ' + esc(ops.slice(0, 3).join(', ')) + (f.no > 3 ? ` +${f.no - 3}` : '') : ''}${f.l ? ' · ' + esc(f.l) : ''}</small></li>`; };
  const first = a.feeds.slice(0, 8).map(item).join(''), rest = a.feeds.slice(8);
  return `<h3>${T().srcList}</h3><ul class="flist">${first}</ul>` + (rest.length ? `<ul class="flist rest" hidden style="margin-top:6px">${rest.map(item).join('')}</ul><button class="more" type="button" data-n="${a.feeds.length}">${T().more(a.feeds.length)}</button>` : '');
}
function citiesIn(test) {
  const cs = D.publit.filter(test); if (!cs.length) return '';
  return `<h3>${T().cityNote}</h3><div class="cities-t">${cs.map(p => { const s = TSTYLE[p[3]]; return `<span title="${esc(lang === 'de' ? p[5] || p[4] || '' : p[4] || '')}"><i style="background:${s[0]};border-color:${s[1] === '#ffffff' ? s[0] : s[1]}"></i>${esc(p[0])} · ${T().tcat[p[3]]}</span>`; }).join('')}</div>`;
}
const inBox = (b, p) => { const x = px(p[2]), y = py(p[1]); return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]; };
function sub(parts) { return `<p class="sub">${parts.map(([t, a], i) => (i ? '<em>›</em>' : '') + (a ? `<button type="button" data-go="${a}">${esc(t)}</button>` : `<span>${esc(t)}</span>`)).join('')}</p>`; }
function head(a) { return a.stops ? `<p class="qline">${T().quick(nf(a.feeds.length), nf(rtsOf(a)), nf(a.stops))}</p>` : ''; }
function renderPanel() {
  let h = '';
  if (!cur.iso) {
    const cs = D.countries.filter(c => c.eu && c.stops), st = cs.reduce((s, c) => s + c.stops, 0);
    h = `${sub([['Transitous']])}<h2>${T().europe}</h2><p class="qline">${esc(T().europeDesc(cs.length, nf(st), nf(D.feeds.length)))}</p>
      <h3>${T().country}</h3><ul class="rlist">${D.countries.filter(c => c.eu).sort((a, b) => b.stops - a.stops).map(c => `<li data-iso="${c.iso}"><i style="background:var(--c-${c.cat})"></i><em>${esc(c[lang])}</em><span>${nf(c.stops)}</span></li>`).join('')}</ul>`;
  } else {
    const c = byIso[cur.iso], data = cache[cur.iso], R = cur.region && data && regionOf(cur.iso, cur.region);
    if (R) h = `${sub([[T().europe, '~'], [c[lang], cur.iso]])}<h2>${esc(R[lang])}</h2>${head(R)}${catChip(R.cat)}${kpis(R)}${describe(R[lang], R)}${feedList(R)}${citiesIn(p => inBox(R.b, p))}`;
    else {
      h = `${sub([[T().europe, '~'], [T().country]])}<h2>${esc(c[lang])}</h2>${head(c)}${catChip(c.cat)}${kpis(c)}${describe(c[lang], c)}`;
      if (data) h += `<h3>${T().regions}</h3><ul class="rlist">${[...data.regions].sort((a, b) => b.stops - a.stops).map(r => `<li data-id="${esc(r.id)}"><i style="background:var(--c-${r.cat})"></i><em>${esc(r[lang])}</em><span>${nf(r.stops)} · ${pc(r.live)} %</span></li>`).join('')}</ul>`;
      h += feedList(c) + citiesIn(p => inBox(c.b, p));
    }
  }
  pbody.innerHTML = h; pbody.scrollTop = 0; setPeek();
}
function setPeek() {
  if (!mobile.matches) return;
  const last = pbody.querySelector('.qline') || pbody.querySelector('h2');
  const pr = panel.getBoundingClientRect(), lr = last.getBoundingClientRect(), off = panel.classList.contains('open') ? 0 : 0;
  const tr = new DOMMatrix(getComputedStyle(panel).transform).m42 || 0;
  const peek = Math.round(Math.max(104, Math.min(170, lr.bottom - pr.top + 14 + off)));
  wrap.style.setProperty('--peek', peek + 'px');
}
panel.addEventListener('click', e => {
  const li = e.target.closest('li[data-iso]'), lr = e.target.closest('li[data-id]'), more = e.target.closest('.more'), g = e.target.closest('[data-go]');
  const shut = () => { if (mobile.matches) panel.classList.remove('open'); };
  if (li) { shut(); go(li.dataset.iso); } else if (lr) { shut(); go(cur.iso, lr.dataset.id); }
  else if (g) go(g.dataset.go === '~' ? null : g.dataset.go);
  else if (more) { const r = $('.rest', panel); r.hidden = !r.hidden; more.textContent = r.hidden ? T().more(more.dataset.n) : T().less; }
});
function crumbs() {}

/* bottom sheet (mobile): tap or drag the handle / header */
(() => {
  const grab = $('#grab'); let sy = null, base = 0, dy = 0, t0 = 0;
  const peek = () => parseFloat(getComputedStyle(wrap).getPropertyValue('--peek')) || 150;
  const closedOff = () => panel.offsetHeight - peek();
  const start = e => {
    if (!mobile.matches) return;
    const onGrab = !!e.target.closest('.grab');
    if (!onGrab && (panel.classList.contains('open') || e.target.closest('button,li,a'))) return;
    sy = e.clientY; dy = 0; t0 = performance.now(); base = panel.classList.contains('open') ? 0 : closedOff(); panel.classList.add('dragging');
  };
  const move = e => {
    if (sy == null) return; dy = e.clientY - sy;
    if (Math.abs(dy) > 4) { e.preventDefault(); panel.style.transform = `translateY(${Math.max(0, Math.min(closedOff(), base + dy))}px)`; }
  };
  const end = () => {
    if (sy == null) return; panel.classList.remove('dragging'); panel.style.transform = '';
    const fast = Math.abs(dy) / Math.max(1, performance.now() - t0) > .4;
    if (Math.abs(dy) < 5) panel.classList.toggle('open');
    else { const open = fast ? dy < 0 : base + dy < closedOff() / 2; panel.classList.toggle('open', open); }
    if (!panel.classList.contains('open')) pbody.scrollTop = 0;
    sy = null;
  };
  panel.addEventListener('pointerdown', start); addEventListener('pointermove', move, {passive: false}); addEventListener('pointerup', end); addEventListener('pointercancel', end);
})();

/* ---------- legend + table ---------- */
function legend() {
  $('#legend').innerHTML = CATS.map(k => `<li><i style="background:var(--c-${k})"></i>${T().cat[k]}</li>`).join('')
    + `<li><i class="dt" style="background:var(--c-cell-l)"></i>${T().dotL}</li><li><i class="dt" style="background:var(--c-cell-t)"></i>${T().dotT}</li><li><i class="ha" style="background:var(--c-cell-l)"></i>${T().walk}</li>`
    + `<li><i class="ci" style="background:#ffc531;border-color:#111"></i>${T().tested}</li>`;
}
let sortK = 'stops', sortUp = false;
function table() {
  const cols = [['name', T().country], ['cat', T().status], ['feeds', T().sources], ['rts', T().rtSources], ['stops', T().stops], ['area', T().areaS], ['live', T().liveS]];
  const rows = D.countries.filter(c => c.eu).map(c => ({c, name: c[lang], cat: CATS.indexOf(c.cat), feeds: c.feeds.length, rts: c.feeds.filter(([fi]) => D.feeds[fi].rt).length, stops: c.stops, area: c.area, live: c.live}));
  rows.sort((a, b) => { const x = a[sortK], y = b[sortK]; const r = typeof x === 'string' ? x.localeCompare(y) : (x - y); return sortUp ? r : -r; });
  $('#table').innerHTML = `<thead><tr>${cols.map(([k, t]) => `<th data-k="${k}" class="${k === sortK ? 's' + (sortUp ? ' up' : '') : ''}${['feeds', 'rts', 'stops', 'area', 'live'].includes(k) ? ' num' : ''}">${t}</th>`).join('')}</tr></thead><tbody>`
    + rows.map(r => `<tr data-iso="${r.c.iso}"><td>${esc(r.name)}</td><td><i style="background:var(--c-${r.c.cat})"></i>${T().cat[r.c.cat]}</td><td class="num">${nf(r.feeds)}</td><td class="num">${nf(r.rts)}</td><td class="num">${nf(r.stops)}</td><td class="num">${pc(r.area)} %</td><td class="num">${pc(r.live)} %</td></tr>`).join('') + '</tbody>';
}
$('#table').addEventListener('click', e => {
  const th = e.target.closest('th'), tr = e.target.closest('tr[data-iso]');
  if (th) { const k = th.dataset.k; if (k === sortK) sortUp = !sortUp; else { sortK = k; sortUp = k === 'name'; } table(); }
  else if (tr) { go(tr.dataset.iso); wrap.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'}); }
});
$('#cells').addEventListener('change', e => { showStops = e.target.checked; svg.classList.toggle('cellson', showStops); schedule(); });

/* ---------- language toggle ---------- */
const btn = $('.lang');
function applyLang() {
  const d = lang === 'de' ? DE : EN;
  document.documentElement.lang = lang;
  els.forEach(e => { if (d[e.dataset.t]) e.textContent = d[e.dataset.t]; });
  document.title = 'Publit · ' + (lang === 'de' ? 'Abdeckung von Transitous' : 'Coverage of Transitous');
  btn.textContent = lang === 'de' ? 'EN' : 'DE';
  q.placeholder = T().search; q.setAttribute('aria-label', T().search);
  [['#back', 'back'], ['#zin', 'zin'], ['#zout', 'zout'], ['#zhome', 'home'], ['#grab', 'grab']].forEach(([s, k]) => $(s).setAttribute('aria-label', T()[k]));
  if (D) { legend(); table(); renderPanel(); crumbs(); $('#date').textContent = T().date(new Date(D.date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', {day: 'numeric', month: 'long', year: 'numeric'})); }
}
btn.addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('lang', lang); applyLang(); });
const top = $('.top'); addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 10), {passive: true});

/* ---------- start ---------- */
Promise.all([fetch('data/europe.json').then(r => r.json()), fetch('data/world.json?v=global-map-20261023').then(r => r.json())]).then(([d, w]) => {
  D = d; D.world = w.layers; D.countries.forEach(c => byIso[c.iso] = c);
  mapBounds = WORLD;
  (D.tiles || []).forEach(k => TILE.add(k)); D.places = D.places || [];
  measure(); readColors(); drawEurope(); svg.classList.add('cellson');
  applyLang(); view = fitBox(WORLD, .01); apply();
  const [h, r] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (h && byIso[h]?.eu) go(h, r || null, false);
});
applyLang();
})();
