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
  lead: 'Publit gets timetables and realtime through Transitous. This map shows how well every country and region is covered, measured by the real stops from all sources. Zoom in or tap a country to see its states and regions.',
  hint: 'Scroll or pinch to zoom, drag to move, tap for details.', cellsT: 'Show stop grid (about 3 km)', tableT: 'All countries', methT: 'How the map is measured',
  meth1: 'For every European source in Transitous we read the stops from the processed GTFS file and place each stop in a country and region by its coordinates. Cross-border sources therefore count where their stops really are.',
  meth2: 'Area means: share of grid cells (about 3 × 3 km) in the area that contain at least one stop. Realtime means: share of stops whose source has a realtime feed in Transitous (GTFS-RT or SIRI). That does not mean every trip is live, only that live data is provided.',
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

/* ---------- map setup ---------- */
const svg = $('#m'), wrap = $('.cov-map'), tip = $('#tip'), panel = $('#panel');
svg.innerHTML = '<g id="gw" transform="scale(.1)"></g><g id="gr" transform="scale(.01)"></g><g id="gc" class="cells"></g><g id="gp"></g>';
const gw = $('#gw', svg), gr = $('#gr', svg), gc = $('#gc', svg), gp = $('#gp', svg);
let D = null, byIso = {}, cache = {}, cur = {iso: null, region: null}, view = {x: 0, y: 170, w: 1000, h: 790}, anim = null;

function size() { const r = wrap.getBoundingClientRect(); return {W: r.width || 1, H: r.height || 1}; }
function apply() {
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  const k = view.w / size().W; // units per pixel
  gp.querySelectorAll('circle').forEach(c => c.setAttribute('r', (c.dataset.big ? 6 : 4.5) * k));
}
function fitBox(b, pad = .08) {
  const {W, H} = size(); let w = b[2] - b[0], h = b[3] - b[1];
  w *= 1 + pad * 2; h *= 1 + pad * 2;
  const a = W / H; if (w / h > a) h = w / a; else w = h * a;
  const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  return {x: cx - w / 2, y: cy - h / 2, w, h};
}
function animateTo(t, ms = 750) {
  cancelAnimationFrame(anim);
  if (reduce) { view = t; apply(); return; }
  const f = {...view}, t0 = performance.now();
  // zoom in log space so it feels even
  const step = now => {
    let u = Math.min(1, (now - t0) / ms); u = 1 - Math.pow(1 - u, 3);
    const w = Math.exp(Math.log(f.w) + (Math.log(t.w) - Math.log(f.w)) * u), h = w * t.h / t.w;
    const cx = f.x + f.w / 2 + ((t.x + t.w / 2) - (f.x + f.w / 2)) * u, cy = f.y + f.h / 2 + ((t.y + t.h / 2) - (f.y + f.h / 2)) * u;
    view = {x: cx - w / 2, y: cy - h / 2, w, h}; apply();
    if (u < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
function zoomAt(f, cx, cy) { // f < 1 zooms in; cx, cy in svg units
  const w = Math.min(1600, Math.max(3, view.w * f)); f = w / view.w;
  view = {x: cx - (cx - view.x) * f, y: cy - (cy - view.y) * f, w, h: view.h * f}; apply();
}
function toUnits(ev) { const r = svg.getBoundingClientRect(); return {x: view.x + (ev.clientX - r.left) / r.width * view.w, y: view.y + (ev.clientY - r.top) / r.height * view.h}; }

/* pan, wheel and pinch */
const ptrs = new Map(); let moved = 0, pinch = null, last = null;
svg.addEventListener('wheel', e => { e.preventDefault(); cancelAnimationFrame(anim); const p = toUnits(e); zoomAt(Math.exp(e.deltaY * (e.ctrlKey ? .01 : .0022)), p.x, p.y); }, {passive: false});
svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY}); moved = 0; cancelAnimationFrame(anim); if (ptrs.size === 2) pinch = null; last = {x: e.clientX, y: e.clientY}; });
svg.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) { hover(e); return; }
  const r = svg.getBoundingClientRect(), k = view.w / r.width, prev = ptrs.get(e.pointerId);
  ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (ptrs.size === 1) {
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y; moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 4) { svg.classList.add('drag'); view.x -= dx * k; view.y -= dy * k; apply(); tip.classList.remove('show'); }
  } else if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = {clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2};
    if (pinch) { const u = toUnits(m), pu = toUnits(pinch.m); view.x -= u.x - pu.x; view.y -= u.y - pu.y; const p = toUnits(m); zoomAt(pinch.d / d, p.x, p.y); }
    pinch = {d, m}; moved = 99;
  }
});
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) setTimeout(() => svg.classList.remove('drag'), 0); };
svg.addEventListener('pointerup', e => { const wasClick = moved < 6 && ptrs.size === 1; up(e); if (wasClick) click(e); });
svg.addEventListener('pointercancel', up);
svg.addEventListener('pointerleave', () => tip.classList.remove('show'));
svg.addEventListener('dblclick', e => { e.preventDefault(); const p = toUnits(e); cancelAnimationFrame(anim); zoomAt(.5, p.x, p.y); });
$('#zin').onclick = () => { const c = {x: view.x + view.w / 2, y: view.y + view.h / 2}; const t = {...view}; const f = .55; animateTo({x: c.x - t.w * f / 2, y: c.y - t.h * f / 2, w: t.w * f, h: t.h * f}, 350); };
$('#zout').onclick = () => { const c = {x: view.x + view.w / 2, y: view.y + view.h / 2}; const f = 1.8; animateTo({x: c.x - view.w * f / 2, y: c.y - view.h * f / 2, w: view.w * f, h: view.h * f}, 350); };
$('#zhome').onclick = () => go(null);
addEventListener('keydown', e => { if (e.key === 'Escape') go(cur.region ? cur.iso : null); });
addEventListener('resize', () => { const t = cur.region ? regionOf(cur.iso, cur.region)?.b : cur.iso ? byIso[cur.iso].b : EUROPE; if (t) { view = fitBox(t); apply(); } });
const EUROPE = [px(-11), py(71), px(42), py(34.5)];

/* ---------- hover + click ---------- */
function hover(e) {
  const t = e.target, r = wrap.getBoundingClientRect();
  let html = '';
  if (t.classList.contains('c')) { const c = byIso[t.dataset.iso]; html = `<b>${esc(c[lang])}</b><span>${T().cat[c.cat]}</span>`; }
  else if (t.classList.contains('r')) { const R = regionOf(cur.iso, t.dataset.id); html = `<b>${esc(R[lang])}</b><span>${T().cat[R.cat]} · ${T().stopsIn(nf(R.stops))}</span>`; }
  else if (t.closest('.pt')) { const p = D.publit[+t.closest('.pt').dataset.i]; html = `<b>${esc(p[0])}</b><span>${T().tcat[p[3]]}${p[4] ? ' · ' + esc(lang === 'de' ? p[5] || p[4] : p[4]) : ''}</span>`; }
  if (!html || e.pointerType === 'touch') { tip.classList.remove('show'); return; }
  tip.innerHTML = html; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.classList.add('show');
}
function click(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY) || e.target;
  if (el.closest && el.closest('.pt')) { const p = D.publit[+el.closest('.pt').dataset.i]; showCity(p); return; }
  if (el.classList.contains('r')) { go(cur.iso, el.dataset.id); return; }
  if (el.classList.contains('c')) { go(el.dataset.iso); return; }
}

/* ---------- rendering ---------- */
function regionOf(iso, id) { return cache[iso] && cache[iso].regions.find(r => r.id === id); }
function drawEurope() {
  gw.innerHTML = D.countries.map(c => c.eu
    ? `<path class="c k-${c.cat}" data-iso="${c.iso}" d="${c.d}"/>`
    : `<path class="bg" d="${c.d}"/>`).join('');
  gp.innerHTML = D.publit.map((p, i) => { const s = TSTYLE[p[3]]; return `<g class="pt" data-i="${i}"><circle cx="${px(p[2]).toFixed(2)}" cy="${py(p[1]).toFixed(2)}" r="3" fill="${s[0]}" stroke="${s[1]}"/></g>`; }).join('');
}
function cellsPath(str, dx, dy) {
  if (!str) return '';
  const g = .1, out = [];
  for (const c of str.split(';')) {
    const [i, j] = c.split(',').map(Number), lo = i * dx, la = j * dy;
    const x0 = px(lo + dx * g / 2), x1 = px(lo + dx * (1 - g / 2)), y0 = py(la + dy * (1 - g / 2)), y1 = py(la + dy * g / 2);
    out.push(`M${x0.toFixed(2)} ${y0.toFixed(2)}H${x1.toFixed(2)}V${y1.toFixed(2)}H${x0.toFixed(2)}z`);
  }
  return out.join('');
}
async function load(iso) {
  if (!cache[iso]) {
    const r = await fetch(`data/${iso}.json`); cache[iso] = await r.json();
    const c = cache[iso]; c.pathL = cellsPath(c.cl, c.dx, c.dy); c.pathT = cellsPath(c.cs, c.dx, c.dy);
  }
  return cache[iso];
}
async function go(iso, region = null, push = true) {
  tip.classList.remove('show');
  cur = {iso, region};
  $$('.c.on', gw).forEach(e => e.classList.remove('on'));
  if (!iso) {
    svg.classList.remove('focus'); gr.innerHTML = ''; gc.classList.remove('show');
    animateTo(fitBox(EUROPE, .02)); renderPanel(); crumbs();
    if (push) history.replaceState(null, '', location.pathname + location.search);
    return;
  }
  const c = byIso[iso]; if (!c) return;
  svg.classList.add('focus'); $(`.c[data-iso="${iso}"]`, gw)?.classList.add('on');
  if (!region) animateTo(fitBox(c.b));
  renderPanel(); crumbs();
  const data = await load(iso);
  if (cur.iso !== iso) return;
  if (gr.dataset.iso !== iso) {
    gr.dataset.iso = iso;
    gr.innerHTML = data.regions.map(R => `<path class="r k-${R.cat}" data-id="${esc(R.id)}" d="${R.d}"/>`).join('');
    gc.innerHTML = `<path class="cell-t" d="${data.pathT}"/><path class="cell-l" d="${data.pathL}"/>`;
  }
  gc.classList.add('show');
  $$('.r', gr).forEach(p => p.classList.toggle('on', p.dataset.id === region));
  if (region) { const R = regionOf(iso, region); if (R) animateTo(fitBox(R.b, .12)); }
  renderPanel(); crumbs();
  if (push) history.replaceState(null, '', '#' + iso + (region ? '/' + encodeURIComponent(region) : ''));
}
function crumbs() {
  const c = cur.iso && byIso[cur.iso], R = cur.region && regionOf(cur.iso, cur.region);
  const parts = [[T().europe, () => go(null)]];
  if (c) parts.push([c[lang], () => go(cur.iso)]);
  if (R) parts.push([R[lang], () => {}]);
  const n = $('#crumbs'); n.innerHTML = '';
  parts.forEach(([t, f]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = f; n.appendChild(b); });
}

/* ---------- panel ---------- */
const catChip = k => `<span class="chip"><i style="background:var(--c-${k})"></i>${T().cat[k]}</span>`;
function kpis(a) {
  const rts = a.feeds.filter(([fi]) => D.feeds[fi].rt).length;
  return `<div class="kpis"><div><b>${nf(a.feeds.length)}</b><span>${T().sources}</span></div><div><b>${nf(rts)}</b><span>${T().rtSources}</span></div>
    <div><b>${nf(a.stops)}</b><span>${T().stops}</span></div><div><b>${pc(a.area)} %</b><span>${T().area}</span></div></div>
    <div class="bar t"><small><span>${T().area}</span><span>${pc(a.area)} %</span></small><div><i style="width:${pc(a.area)}%"></i></div></div>
    <div class="bar"><small><span>${T().live}</span><span>${pc(a.live)} %</span></small><div><i style="width:${pc(a.live)}%"></i></div></div>`;
}
function describe(name, a) {
  if (!a.stops) return `<p class="desc">${T().noData}</p>`;
  const rts = a.feeds.filter(([fi]) => D.feeds[fi].rt).length, tot = a.feeds.reduce((s, [, n]) => s + n, 0) || 1;
  const top = a.feeds[0], share = top ? top[1] / tot : 0;
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
function renderPanel() {
  let h = '';
  if (!cur.iso) {
    const cs = D.countries.filter(c => c.eu && c.stops), st = cs.reduce((s, c) => s + c.stops, 0);
    h = `<p class="sub">Transitous</p><h2>${T().europe}</h2><p class="desc">${esc(T().europeDesc(cs.length, nf(st), nf(D.feeds.length)))}</p>
      <h3>${T().country}</h3><ul class="rlist">${D.countries.filter(c => c.eu).sort((a, b) => b.stops - a.stops).map(c => `<li data-iso="${c.iso}"><i style="background:var(--c-${c.cat})"></i>${esc(c[lang])}<span>${nf(c.stops)}</span></li>`).join('')}</ul>`;
  } else {
    const c = byIso[cur.iso], data = cache[cur.iso], R = cur.region && data && regionOf(cur.iso, cur.region);
    if (R) {
      h = `<p class="sub">${esc(c[lang])}</p><h2>${esc(R[lang])}</h2>${catChip(R.cat)}${kpis(R)}${describe(R[lang], R)}${feedList(R)}${citiesIn(p => inBox(R.b, p))}`;
    } else {
      h = `<p class="sub">${T().country}</p><h2>${esc(c[lang])}</h2>${catChip(c.cat)}${kpis(c)}${describe(c[lang], c)}`;
      if (data) h += `<h3>${T().regions}</h3><ul class="rlist">${[...data.regions].sort((a, b) => b.stops - a.stops).map(r => `<li data-id="${esc(r.id)}"><i style="background:var(--c-${r.cat})"></i>${esc(r[lang])}<span>${nf(r.stops)} · ${pc(r.live)} %</span></li>`).join('')}</ul>`;
      h += feedList(c) + citiesIn(p => inBox(c.b, p) && (!data || true));
    }
  }
  panel.innerHTML = h; panel.scrollTop = 0;
}
panel.addEventListener('click', e => {
  const li = e.target.closest('li[data-iso]'), lr = e.target.closest('li[data-id]'), more = e.target.closest('.more');
  if (li) go(li.dataset.iso); else if (lr) go(cur.iso, lr.dataset.id);
  else if (more) { const r = $('.rest', panel); r.hidden = !r.hidden; more.textContent = r.hidden ? T().more(more.dataset.n) : T().less; }
});
function showCity(p) {
  const r = wrap.getBoundingClientRect(), s = svg.getBoundingClientRect();
  tip.innerHTML = `<b>${esc(p[0])}</b><span>${T().tcat[p[3]]}${p[4] ? ' · ' + esc(lang === 'de' ? p[5] || p[4] : p[4]) : ''}</span>`;
  tip.style.left = ((px(p[2]) - view.x) / view.w * s.width) + 'px'; tip.style.top = ((py(p[1]) - view.y) / view.h * s.height) + 'px'; tip.classList.add('show');
}

/* ---------- legend + table ---------- */
function legend() {
  $('#legend').innerHTML = CATS.map(k => `<li><i style="background:var(--c-${k})"></i>${T().cat[k]}</li>`).join('')
    + `<li><i class="sq" style="background:var(--c-cell-l)"></i>${T().cellL}</li><li><i class="sq" style="background:var(--c-cell-t)"></i>${T().cellT}</li>`
    + `<li><i class="ci" style="background:#ffc531;border-color:#111"></i>${T().tested}</li>`;
}
let sortK = 'stops', sortUp = false;
function table() {
  const cols = [['name', T().country], ['cat', T().status], ['feeds', T().sources], ['rts', T().rtSources], ['stops', T().stops], ['area', T().area], ['live', T().live]];
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
$('#cells').addEventListener('change', e => svg.classList.toggle('cellson', e.target.checked));

/* ---------- language toggle ---------- */
const btn = $('.lang');
function applyLang() {
  const d = lang === 'de' ? DE : EN;
  document.documentElement.lang = lang;
  els.forEach(e => { if (d[e.dataset.t]) e.textContent = d[e.dataset.t]; });
  document.title = 'Publit · ' + (lang === 'de' ? 'Abdeckung von Transitous' : 'Coverage of Transitous');
  btn.textContent = lang === 'de' ? 'EN' : 'DE';
  if (D) { legend(); table(); renderPanel(); crumbs(); $('#date').textContent = T().date(new Date(D.date).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', {day: 'numeric', month: 'long', year: 'numeric'})); }
}
btn.addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('lang', lang); applyLang(); });
const top = $('.top'); addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 10), {passive: true});

/* ---------- start ---------- */
fetch('data/europe.json').then(r => r.json()).then(d => {
  D = d; D.countries.forEach(c => byIso[c.iso] = c);
  drawEurope(); svg.classList.add('cellson');
  view = fitBox(EUROPE, .02); apply(); applyLang();
  const [h, r] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (h && byIso[h]?.eu) go(h, r || null, false);
});
applyLang();
})();
