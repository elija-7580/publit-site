// SPDX-License-Identifier: LicenseRef-AllRightsReserved
// SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
// Route planner in the browser. Stop search and connections come from a MOTIS 2 API (Transitous by default,
// https://transitous.org/api/); set window.PUBLIT_ROUTER to use another MOTIS server.
(() => {
const API = (window.PUBLIT_ROUTER || 'https://api.transitous.org').replace(/\/$/, '');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const qs = new URLSearchParams(location.search);

/* ---------- Language ---------- */
const TXT = {
  de: {
    title: 'Routenplaner für Öffis und Bahn in Europa | Publit',
    h1: 'Routenplaner für Öffis und Bahn in ganz Europa.', sub: 'Verbindungen mit Bus, Bim, U-Bahn und Zug über Ländergrenzen hinweg, mit Live-Zeiten, wo Betriebe sie veröffentlichen. Kostenlos und ohne Anmeldung.',
    from: 'Von', to: 'Nach', fromPh: 'Haltestelle, Ort oder Adresse', toPh: 'Haltestelle, Ort oder Adresse', here: 'Mein Standort', swap: 'Start und Ziel tauschen',
    now: 'Jetzt', dep: 'Abfahrt', arr: 'Ankunft', go: 'Verbindung suchen',
    note: 'Die Suche geht direkt von deinem Browser an <a href="https://transitous.org/" rel="noopener">Transitous</a>. Publit speichert sie nicht. <a href="https://transitous.org/sources/" rel="noopener">Datenquellen</a> · <a href="../privacy/">Datenschutz</a>',
    emptyT: 'Wohin soll es gehen?', emptyX: 'Gib Start und Ziel ein oder probier ein Beispiel:',
    results: 'Verbindungen', earlier: 'Früher', later: 'Später',
    transfers: n => n === 0 ? 'direkt' : n === 1 ? '1 Umstieg' : n + ' Umstiege', walk: 'Fußweg', min: 'min', h: 'h',
    plat: 'Steig', dir: 'Richtung', stops: n => n === 1 ? '1 Halt' : n + ' Halte', ontime: 'pünktlich', live: 'Live', cancelled: 'Fällt aus',
    noneT: 'Keine Verbindung gefunden.', noneX: 'Probier eine andere Zeit oder eine größere Haltestelle in der Nähe. Nicht überall gibt es offene Fahrplandaten.',
    errT: 'Die Suche hat nicht geklappt.', errX: 'Der Routing-Dienst ist gerade nicht erreichbar. Bitte versuch es in ein paar Sekunden noch einmal.',
    pickT: 'Ort nicht gefunden.', pickX: s => `Zu „${s}“ gibt es keinen Treffer. Bitte wähl einen Vorschlag aus der Liste.`,
    geoErr: 'Standort nicht verfügbar. Bitte gib den Start von Hand ein.',
    open: 'In Publit öffnen', share: 'Link teilen', copied: 'Link kopiert', map: 'Karte anzeigen', arrive: 'Ankunft',
    appT: 'Unterwegs begleitet dich die App.', appX: 'Publit zeigt Verspätungen live, erinnert dich ans Aussteigen und findet einen neuen Anschluss, wenn einer platzt.', appB: 'App laden',
    i1: 'Nah- und Fernverkehr in einer Suche', i1x: 'Straßenbahn, Regionalzug und Nachtzug stehen in derselben Verbindung, auch wenn mehrere Betriebe fahren.',
    i2: 'Über Ländergrenzen hinweg', i2x: 'Der Routenplaner nutzt offene Fahrpläne aus ganz Europa. Wo es sie gibt, zeigt die Abdeckungskarte.',
    i3: 'Ohne Konto, ohne Werbung', i3x: 'Keine Anmeldung, keine Werbung. Die Suche wird nicht gespeichert.',
    infoT: 'Ein Routenplaner, der nicht an der Grenze endet.', cov: 'Abdeckung ansehen', biz: 'Für Verkehrsunternehmen',
    types: { STOP: 'Haltestelle', ADDRESS: 'Adresse', PLACE: 'Ort' },
  },
  en: {
    title: 'Route planner for public transport and rail in Europe | Publit',
    h1: 'Route planner for public transport and rail across Europe.', sub: 'Connections by bus, tram, metro and train across borders, with live times where operators publish them. Free, no sign-up.',
    from: 'From', to: 'To', fromPh: 'Stop, place or address', toPh: 'Stop, place or address', here: 'My location', swap: 'Swap origin and destination',
    now: 'Now', dep: 'Depart', arr: 'Arrive', go: 'Find connections',
    note: 'Your search goes straight from your browser to <a href="https://transitous.org/" rel="noopener">Transitous</a>. Publit does not store it. <a href="https://transitous.org/sources/" rel="noopener">Data sources</a> · <a href="../privacy/">Privacy</a>',
    emptyT: 'Where to?', emptyX: 'Enter origin and destination or try an example:',
    results: 'Connections', earlier: 'Earlier', later: 'Later',
    transfers: n => n === 0 ? 'direct' : n === 1 ? '1 change' : n + ' changes', walk: 'Walk', min: 'min', h: 'h',
    plat: 'Platform', dir: 'towards', stops: n => n === 1 ? '1 stop' : n + ' stops', ontime: 'on time', live: 'Live', cancelled: 'Cancelled',
    noneT: 'No connection found.', noneX: 'Try another time or a bigger stop nearby. Open timetable data is not available everywhere.',
    errT: 'The search did not work.', errX: 'The routing service cannot be reached right now. Please try again in a few seconds.',
    pickT: 'Place not found.', pickX: s => `No match for “${s}”. Please pick a suggestion from the list.`,
    geoErr: 'Location not available. Please type your origin.',
    open: 'Open in Publit', share: 'Share link', copied: 'Link copied', map: 'Show map', arrive: 'Arrival',
    appT: 'On the way, the app guides you.', appX: 'Publit shows delays live, reminds you to get off and finds a new connection when one breaks.', appB: 'Get the app',
    i1: 'Local and long distance in one search', i1x: 'Tram, regional train and night train appear in the same connection, even when several operators run it.',
    i2: 'Across borders', i2x: 'The route planner uses open timetables from all over Europe. The coverage map shows where they exist.',
    i3: 'No account, no ads', i3x: 'No sign-up, no advertising. Your search is not stored.',
    infoT: 'A route planner that does not stop at the border.', cov: 'See the coverage', biz: 'For transit operators',
    types: { STOP: 'Stop', ADDRESS: 'Address', PLACE: 'Place' },
  },
};
let lang = qs.get('lang') || localStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en');
if (lang !== 'de') lang = 'en';
let L = TXT[lang];
const NAV_EN = window.PUBLIT_NAV_EN || {}, NAV_DE = {};
$$('[data-t]').forEach(e => NAV_DE[e.dataset.t] = e.textContent);
$$('[data-t-html]').forEach(e => NAV_DE[e.dataset.tHtml] = e.innerHTML);
function applyLang() {
  L = TXT[lang];
  document.documentElement.lang = lang;
  document.title = L.title;
  $$('[data-t]').forEach(e => { const v = lang === 'de' ? NAV_DE[e.dataset.t] : NAV_EN[e.dataset.t]; if (v) e.textContent = v; });
  $$('[data-t-html]').forEach(e => { const v = lang === 'de' ? NAV_DE[e.dataset.tHtml] : NAV_EN[e.dataset.tHtml]; if (v) e.innerHTML = v; });
  $$('[data-l]').forEach(e => { const v = L[e.dataset.l]; if (typeof v === 'string') e.textContent = v; });
  $$('[data-l-html]').forEach(e => { e.innerHTML = L[e.dataset.lHtml]; });
  $$('[data-l-ph]').forEach(e => { e.placeholder = L[e.dataset.lPh]; });
  $$('[data-l-aria]').forEach(e => { e.setAttribute('aria-label', L[e.dataset.lAria]); e.title = L[e.dataset.lAria]; });
  $('.lang').textContent = lang === 'de' ? 'EN' : 'DE';
  if (last) render(); else if (!busy) showEmpty();
}
$('.lang').addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; localStorage.setItem('lang', lang); applyLang(); });
const top = $('.top');
addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 8), { passive: true });

/* ---------- Helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Quotes are added here, so the page source holds no quoted template link that Google would crawl as a URL (404).
const attr = s => '"' + esc(s) + '"';
const hm = (iso, tz) => new Intl.DateTimeFormat(lang === 'de' ? 'de-AT' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz || undefined }).format(new Date(iso));
const dayOf = (iso, tz) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz || undefined }).format(new Date(iso));
const dur = s => { const m = Math.round(s / 60); return m < 60 ? `${m} ${L.min}` : `${Math.floor(m / 60)} ${L.h} ${String(m % 60).padStart(2, '0')} ${L.min}`; };
const delayMin = (real, sched) => real && sched ? Math.round((new Date(real) - new Date(sched)) / 60000) : 0;
const delayTag = (d, rt) => d > 0 ? `<small class="rp-late">+${d}</small>` : rt ? `<small class="rp-ok">${L.ontime}</small>` : '';
const isWalk = l => l.mode === 'WALK';
const ICON = {
  STOP: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3.5" width="12" height="14" rx="3"/><path d="M6 11.5h12M9 20.5l1.5-3M15 20.5l-1.5-3"/><circle cx="9.5" cy="14.5" r=".6" fill="currentColor"/><circle cx="14.5" cy="14.5" r=".6" fill="currentColor"/></svg>',
  PLACE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.500 15.400 12 21 12 21z"/><circle cx="12" cy="10.500" r="2.300"/></svg>',
  WALK: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4.500" r="1.600"/><path d="M9.500 21l2-6-2.500-2.500 1-5 3 3 3.500 1.500M14 21l-1.500-4.500M7 11.500l3-4"/></svg>',
};

/* ---------- Stop search ---------- */
const cache = new Map();
async function geocode(text, signal) {
  const key = lang + '|' + text.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const r = await fetch(`${API}/api/v1/geocode?text=${encodeURIComponent(text.trim())}&language=${lang}`, { signal });
  if (!r.ok) throw new Error('geocode ' + r.status);
  const list = (await r.json()).slice(0, 8).map(p => {
    const areas = p.areas || [], city = areas.find(a => a.default) || areas.find(a => a.adminLevel === 8) || areas.find(a => a.adminLevel === 4);
    const country = areas.find(a => a.adminLevel === 2);
    const where = [city && city.name !== p.name ? city.name : '', country ? country.name : (p.country || '')].filter(Boolean).join(', ');
    const street = p.type === 'ADDRESS' && p.houseNumber ? ` ${p.houseNumber}` : '';
    return { name: p.name + street, id: p.type === 'STOP' ? p.id : '', lat: p.lat, lon: p.lon, type: p.type, where };
  });
  cache.set(key, list);
  return list;
}
const place = { from: null, to: null };
function field(which) {
  const input = $(`#rp-${which}`), box = $(`#rp-${which}-sugg`);
  let ctl, timer, items = [], sel = -1;
  const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); sel = -1; };
  const pick = p => { place[which] = p; input.value = p.name; close(); if (which === 'from' && !$('#rp-to').value) $('#rp-to').focus(); };
  const draw = () => {
    box.innerHTML = items.map((p, i) => `<li role="option" id="rp-${which}-o${i}" aria-selected="${i === sel}">${p.type === 'STOP' ? ICON.STOP : ICON.PLACE}<div><b>${esc(p.name)}</b><small>${esc([L.types[p.type] || '', p.where].filter(Boolean).join(' · '))}</small></div></li>`).join('');
    box.hidden = !items.length; input.setAttribute('aria-expanded', String(!!items.length));
    if (sel >= 0) input.setAttribute('aria-activedescendant', `rp-${which}-o${sel}`); else input.removeAttribute('aria-activedescendant');
  };
  input.addEventListener('input', () => {
    place[which] = null; clearTimeout(timer); if (ctl) ctl.abort();
    const text = input.value.trim();
    if (text.length < 2) { items = []; close(); return; }
    timer = setTimeout(async () => {
      ctl = new AbortController();
      try { items = await geocode(text, ctl.signal); sel = -1; if (document.activeElement === input) draw(); } catch (e) { /* aborted or offline: keep typing */ }
    }, 280);
  });
  input.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; draw(); }
    else if (e.key === 'Enter' && items.length) { e.preventDefault(); pick(items[Math.max(0, sel)]); }
    else if (e.key === 'Escape') close();
  });
  // pointerdown instead of click: the choice is made before the input loses focus
  box.addEventListener('pointerdown', e => { const li = e.target.closest('li'); if (!li) return; e.preventDefault(); pick(items[[...box.children].indexOf(li)]); });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('focus', () => { if (items.length && !place[which]) draw(); });
  return { set: p => { place[which] = p; input.value = p ? p.name : ''; items = []; close(); } };
}
const F = { from: field('from'), to: field('to') };
$('.rp-swap').addEventListener('click', () => { const a = place.from, b = place.to, av = $('#rp-from').value, bv = $('#rp-to').value; F.from.set(b); F.to.set(a); if (!b) $('#rp-from').value = bv; if (!a) $('#rp-to').value = av; });
$('.rp-here').addEventListener('click', () => {
  if (!navigator.geolocation) return message(L.pickT, L.geoErr);
  navigator.geolocation.getCurrentPosition(
    p => F.from.set({ name: L.here, id: '', lat: +p.coords.latitude.toFixed(5), lon: +p.coords.longitude.toFixed(5), type: 'PLACE', here: true }),
    () => message(L.pickT, L.geoErr), { timeout: 8000, maximumAge: 60000 });
});

/* ---------- When ---------- */
const modeSel = $('#rp-mode'), dateIn = $('#rp-date'), timeIn = $('#rp-time');
const pad = n => String(n).padStart(2, '0');
function setNow() { const d = new Date(); dateIn.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; timeIn.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
setNow();
const syncWhen = () => { const now = modeSel.value === 'now'; dateIn.disabled = timeIn.disabled = now; if (now) setNow(); };
modeSel.addEventListener('change', syncWhen); syncWhen();
[dateIn, timeIn].forEach(i => i.addEventListener('change', () => { if (modeSel.value === 'now') modeSel.value = 'dep'; }));

/* ---------- Search ---------- */
const out = $('#rp-out');
let last = null, busy = false, searchCtl;
function message(t, x) { last = null; out.innerHTML = `<div class="rp-msg" role="status"><b>${esc(t)}</b>${esc(x)}</div>`; }
const EXAMPLES = [['Wien Hauptbahnhof', 'München Hauptbahnhof'], ['Wien Stephansplatz', 'Flughafen Wien'], ['Berlin Hauptbahnhof', 'Praha hl.n.'], ['Zürich HB', 'Milano Centrale']];
function showEmpty() {
  out.innerHTML = `<div class="rp-empty"><b>${L.emptyT}</b>${L.emptyX}<div class="rp-ex">${EXAMPLES.map((e, i) => `<button type="button" data-ex="${i}">${esc(e[0])} → ${esc(e[1])}</button>`).join('')}</div></div>`;
}
out.addEventListener('click', e => {
  const ex = e.target.closest('[data-ex]');
  if (ex) { const [a, b] = EXAMPLES[+ex.dataset.ex]; place.from = place.to = null; $('#rp-from').value = a; $('#rp-to').value = b; search(); return; }
  const more = e.target.closest('[data-page]'); if (more) { search(more.dataset.page); return; }
  const share = e.target.closest('[data-share]'); if (share) { shareLink(share); return; }
  const map = e.target.closest('[data-map]'); if (map) { showMap(map); }
});
async function resolve(which) {
  if (place[which]) return place[which];
  const text = $(`#rp-${which}`).value.trim();
  if (!text) { $(`#rp-${which}`).focus(); return null; }
  const list = await geocode(text);
  if (!list.length) { message(L.pickT, L.pickX(text)); return null; }
  F[which].set(list[0]);
  return list[0];
}
const ref = p => p.id || `${p.lat},${p.lon}`;
async function search(cursor) {
  if (searchCtl) searchCtl.abort();
  searchCtl = new AbortController();
  busy = true;
  if (!cursor) out.innerHTML = '<div class="rp-list" aria-busy="true"><div class="rp-skel"></div><div class="rp-skel"></div><div class="rp-skel"></div></div>';
  try {
    const from = await resolve('from'); if (!from) { busy = false; if (!$('.rp-msg', out)) showEmpty(); return; }
    const to = await resolve('to'); if (!to) { busy = false; if (!$('.rp-msg', out)) showEmpty(); return; }
    if (modeSel.value === 'now') setNow();
    const when = new Date(`${dateIn.value}T${timeIn.value || '00:00'}`);
    const p = new URLSearchParams({ fromPlace: ref(from), toPlace: ref(to), time: (isNaN(when) ? new Date() : when).toISOString(), numItineraries: '5' });
    if (modeSel.value === 'arr') p.set('arriveBy', 'true');
    if (cursor) p.set('pageCursor', cursor);
    const r = await fetch(`${API}/api/v5/plan?${p}`, { signal: searchCtl.signal });
    if (!r.ok) throw new Error('plan ' + r.status);
    const d = await r.json();
    const its = (d.itineraries || []).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    last = { from, to, its, prev: d.previousPageCursor, next: d.nextPageCursor };
    busy = false;
    render();
    // a link that brings this search back
    const u = new URLSearchParams({ from: from.here ? '' : from.name, to: to.name });
    if (from.here) u.delete('from');
    if (qs.get('lang')) u.set('lang', lang);
    history.replaceState(null, '', '?' + u);
    if (!cursor && innerWidth < 1000) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    if (e.name === 'AbortError') return;
    busy = false; message(L.errT, L.errX);
  }
}
$('#rp-form').addEventListener('submit', e => { e.preventDefault(); search(); });

/* ---------- Results ---------- */
function chip(l) {
  if (isWalk(l)) return `<span class="rp-chip walk">${ICON.WALK}${Math.max(1, Math.round(l.duration / 60))}</span>`;
  const bg = l.routeColor ? `#${l.routeColor}` : '', fg = l.routeTextColor ? `#${l.routeTextColor}` : (bg ? '#fff' : '');
  return `<span class="rp-chip"${bg ? ` style="background:${esc(bg)};color:${esc(fg)}"` : ''}>${esc(l.displayName || l.routeShortName || l.mode)}</span>`;
}
function step(l, isLast) {
  const tz = l.from.tz, dep = delayMin(l.startTime, l.scheduledStartTime);
  const color = !isWalk(l) && l.routeColor ? ` style="--lc:#${esc(l.routeColor)}"` : '';
  const track = l.from.track ? `<span class="rp-plat">${L.plat} ${esc(l.from.track)}</span>` : '';
  let line;
  if (isWalk(l)) line = `<div class="rp-line">${L.walk}, ${dur(l.duration)}${l.distance ? ` · ${l.distance < 1000 ? Math.round(l.distance / 10) * 10 + ' m' : (l.distance / 1000).toFixed(1).replace('.', lang === 'de' ? ',' : '.') + ' km'}` : ''}</div>`;
  else {
    const inter = l.intermediateStops || [];
    const stops = inter.length ? `<details class="rp-stops"><summary>${L.stops(inter.length + 1)} · ${dur(l.duration)}</summary><ol>${inter.map(s => `<li><span>${hm(s.arrival || s.departure, s.tz)}</span>${esc(s.name)}</li>`).join('')}</ol></details>` : `<div class="rp-stops">${dur(l.duration)}</div>`;
    line = `<div class="rp-line">${chip(l)}<span>${l.headsign ? `${L.dir} ${esc(l.headsign)}` : ''}${l.agencyName ? ` · ${esc(l.agencyName)}` : ''}</span></div>${l.cancelled ? `<div class="rp-alert">${L.cancelled}</div>` : ''}${stops}`;
  }
  let html = `<li class="rp-step${isWalk(l) ? ' walk' : ''}"${color}><time>${hm(l.startTime, tz)}${delayTag(dep, l.realTime)}</time><span class="rp-rail"></span><div><b>${esc(nameOf(l.from, true))}${track}</b>${line}</div></li>`;
  if (isLast) {
    const arr = delayMin(l.endTime, l.scheduledEndTime), tr = l.to.track ? `<span class="rp-plat">${L.plat} ${esc(l.to.track)}</span>` : '';
    html += `<li class="rp-step end"${color}><time>${hm(l.endTime, l.to.tz)}${delayTag(arr, l.realTime)}</time><span class="rp-rail"></span><div><b>${esc(nameOf(l.to, false))}${tr}</b></div></li>`;
  }
  return html;
}
const nameOf = (p, start) => p.name === 'START' ? last.from.name : p.name === 'END' ? last.to.name : p.name;
function render() {
  if (!last) return;
  const { from, to, its } = last;
  if (!its.length) { out.innerHTML = `<div class="rp-msg" role="status"><b>${L.noneT}</b>${L.noneX}</div>${pager()}`; return; }
  const day0 = dayOf(new Date().toISOString());
  const items = its.map((it, i) => {
    // short walks at both ends are part of the stop, not worth a chip
    const legs = it.legs.filter(l => !(isWalk(l) && l.duration < 120));
    const first = it.legs[0], lastLeg = it.legs[it.legs.length - 1];
    const tz1 = first.from.tz, tz2 = lastLeg.to.tz;
    const rt = it.legs.some(l => l.realTime), dDep = delayMin(first.startTime, first.scheduledStartTime);
    const date = dayOf(it.startTime, tz1) !== day0 ? new Intl.DateTimeFormat(lang === 'de' ? 'de-AT' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz1 }).format(new Date(it.startTime)) + ' · ' : '';
    const ops = [...new Set(it.legs.filter(l => !isWalk(l) && l.agencyName).map(l => l.agencyName))];
    const deep = `../open/#route?${new URLSearchParams({ f: from.name, t: to.name, fl: `${from.lat},${from.lon}`, tl: `${to.lat},${to.lon}`, d: String(Math.round(new Date(it.startTime) / 1000)) })}`;
    return `<li><details class="rp-it"${i === 0 && its.length === 1 ? ' open' : ''}><summary>
      <span class="rp-times">${hm(it.startTime, tz1)} – ${hm(it.endTime, tz2)}${delayTag(dDep, rt)}</span>
      <span class="rp-dur">${dur(it.duration)}<small>${L.transfers(it.transfers)}</small></span>
      <span class="rp-legs">${legs.map(chip).join('<span class="rp-sep">›</span>')}</span>
      <span class="rp-meta">${date}${esc(ops.slice(0, 3).join(', '))}${ops.length > 3 ? ' …' : ''}</span>
    </summary><div class="rp-detail">
      <ol class="rp-steps">${it.legs.map((l, k) => step(l, k === it.legs.length - 1)).join('')}</ol>
      <div class="rp-map" data-i="${i}" hidden></div>
      <div class="rp-actions"><a class="key key-ink" href=${attr(deep)}>${L.open}</a><button class="key" type="button" data-map="${i}">${L.map}</button><button class="key" type="button" data-share>${L.share}</button></div>
    </div></details></li>`;
  }).join('');
  out.innerHTML = `<div class="rp-head"><b>${esc(from.name)} → ${esc(to.name)}</b><span>${L.results}</span></div><ol class="rp-list">${items}</ol>${pager()}
    <div class="rp-app"><div><b>${L.appT}</b><span>${L.appX}</span></div><a class="key" href="../#laden">${L.appB}</a></div>`;
}
const pager = () => last && (last.prev || last.next) ? `<div class="rp-more">${last.prev ? `<button class="key" type="button" data-page="${esc(last.prev)}">← ${L.earlier}</button>` : ''}${last.next ? `<button class="key" type="button" data-page="${esc(last.next)}">${L.later} →</button>` : ''}</div>` : '';
async function shareLink(btn) {
  const url = location.href, title = `${last.from.name} → ${last.to.name}`;
  try {
    if (navigator.share) await navigator.share({ title, url });
    else { await navigator.clipboard.writeText(url); const t = btn.textContent; btn.textContent = L.copied; setTimeout(() => { btn.textContent = t; }, 1600); }
  } catch (e) { /* closed share sheet */ }
}

/* ---------- Map: loaded only when someone asks for it ---------- */
function decode(str, precision) {
  const f = Math.pow(10, precision || 6), out = []; let i = 0, lat = 0, lon = 0;
  while (i < str.length) {
    for (const k of [0, 1]) { let r = 0, s = 0, b; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << s; s += 5; } while (b >= 32); const d = r & 1 ? ~(r >> 1) : r >> 1; if (k) lon += d; else lat += d; }
    out.push([lon / f, lat / f]);
  }
  return out;
}
let mapLib;
const loadMap = () => mapLib || (mapLib = new Promise((ok, fail) => {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css'; document.head.appendChild(css);
  const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js'; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
}));
async function showMap(btn) {
  const it = last.its[+btn.dataset.map], box = btn.closest('.rp-detail').querySelector('.rp-map');
  btn.remove(); box.hidden = false;
  try { await loadMap(); } catch (e) { box.hidden = true; return; }
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const map = new maplibregl.Map({ container: box, style: `https://tiles.openfreemap.org/styles/${dark ? 'dark' : 'positron'}`, attributionControl: { compact: true }, cooperativeGestures: true });
  const feats = it.legs.filter(l => l.legGeometry && l.legGeometry.points).map(l => ({ type: 'Feature', properties: { walk: isWalk(l), color: !isWalk(l) && l.routeColor ? '#' + l.routeColor : (dark ? '#f2f2f0' : '#111111') }, geometry: { type: 'LineString', coordinates: decode(l.legGeometry.points, l.legGeometry.precision) } }));
  const b = new maplibregl.LngLatBounds(); feats.forEach(f => f.geometry.coordinates.forEach(c => b.extend(c)));
  if (!b.isEmpty()) map.fitBounds(b, { padding: 36, animate: false });
  map.on('load', () => {
    map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: feats } });
    map.addLayer({ id: 'route-walk', type: 'line', source: 'route', filter: ['==', ['get', 'walk'], true], paint: { 'line-color': '#8b8b85', 'line-width': 3, 'line-dasharray': [1, 2] } });
    map.addLayer({ id: 'route', type: 'line', source: 'route', filter: ['==', ['get', 'walk'], false], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 4 } });
    const ends = [it.legs[0].from, it.legs[it.legs.length - 1].to];
    ends.forEach((p, i) => { const el = document.createElement('div'); el.style.cssText = `width:14px;height:14px;border-radius:50%;border:3px solid ${dark ? '#f2f2f0' : '#111'};background:${i ? '#ffc531' : (dark ? '#111' : '#fff')}`; new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(map); });
  });
}

/* ---------- Start: a link or the home page form may bring origin and destination ---------- */
applyLang();
const qFrom = qs.get('from'), qTo = qs.get('to');
if (qFrom) $('#rp-from').value = qFrom;
if (qTo) $('#rp-to').value = qTo;
if (qFrom && qTo) search(); else showEmpty();
})();
