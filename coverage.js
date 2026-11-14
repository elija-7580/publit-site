/* Coverage map on the start page: where Transitous has timetables and live data, worldwide.
   Everything comes from abdeckung/data/home.json, rebuilt every week from all Transitous sources
   (tools/coverage/build.py). A country or region that Transitous adds shows up by itself; nothing here lists places.
   Own SVG in the projection of the detailed map (abdeckung/), no external tiles or scripts. */
(() => {
const el = document.getElementById('covmap');
if (!el) return;
const K = 0.6156614753256583, SX = 22.87703162651752, Y1 = 1.81486224426954, S = K * SX;
const px = lon => (lon + SX) * S;
const py = lat => (Y1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) * S * 180 / Math.PI;
const CATS = ['l2', 'l1', 't', 'v', 'n'];
const LABEL = {
  en: {l2: 'Timetable and realtime', l1: 'Timetable, realtime in part', t: 'Timetable only', v: 'Only scattered', n: 'No data',
    x: 'City with extra live times from Publit', p: 'City with services missing', stops: n => `${n} stops`, world: 'World', europe: 'Europe',
    note: d => `Data as of ${d}, updated every week from all Transitous sources. All information without guarantee.`, aria: 'Map of Transitous coverage worldwide'},
  de: {l2: 'Fahrplan und Echtzeit', l1: 'Fahrplan, Echtzeit teilweise', t: 'Nur Fahrplan', v: 'Nur vereinzelt', n: 'Keine Daten',
    x: 'Stadt mit zusätzlichen Live-Zeiten von Publit', p: 'Stadt, in der Verkehrsmittel fehlen', stops: n => `${n} Haltestellen`, world: 'Welt', europe: 'Europa',
    note: d => `Stand der Daten: ${d}, jede Woche neu berechnet aus allen Quellen von Transitous. Alle Angaben ohne Gewähr.`, aria: 'Karte der Abdeckung von Transitous weltweit'}
};
const DOT = {x: ['#ffc531', '#111111'], p: ['#ffffff', '#b25000']};
const lang = () => document.documentElement.lang === 'de' ? 'de' : 'en';
const nf = n => n.toLocaleString(lang() === 'de' ? 'de-DE' : 'en-GB');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('shot');
// Fixed frame for the "Europe" button; the world frame follows the data.
const EUROPE = [px(-11), py(71), px(42), py(34.5)];
const LIMIT = [-Infinity, py(75), Infinity, py(-48)];

let D = null, frames = {}, frame = 'world', svg, tip, sel = null;

function boxOf(list) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  list.forEach(c => { const r = c[6]; b[0] = Math.min(b[0], r[0]); b[1] = Math.min(b[1], r[1]); b[2] = Math.max(b[2], r[2]); b[3] = Math.max(b[3], r[3]); });
  return [b[0], Math.max(b[1], LIMIT[1]), b[2], Math.min(b[3], LIMIT[3])];
}
function viewBox(b) {
  const w = b[2] - b[0], h = b[3] - b[1], pad = w * .03;
  return [b[0] - pad, b[1] - pad, w + 2 * pad, h + 2 * pad];
}
function legend() {
  const box = document.getElementById('covlegend');
  if (!box || !D) return;
  const L = LABEL[lang()];
  const count = k => D.countries.filter(c => (c[3] || 'n') === k).length;
  box.innerHTML = CATS.map(k => `<li><i class="k-${k}"></i>${L[k]} <span>${count(k)}</span></li>`).join('')
    + ['x', 'p'].filter(k => D.cities.some(c => c[3] === k)).map(k => `<li><i style="background:${DOT[k][0]};border-color:${DOT[k][1]}"></i>${L[k]} <span>${D.cities.filter(c => c[3] === k).length}</span></li>`).join('')
    + `<li class="covframe"><button type="button" data-f="world" aria-pressed="${frame === 'world'}">${L.world}</button><button type="button" data-f="europe" aria-pressed="${frame === 'europe'}">${L.europe}</button></li>`;
  const note = document.querySelector('.covnote');
  if (note && D.date) note.textContent = L.note(new Date(D.date).toLocaleDateString(lang() === 'de' ? 'de-DE' : 'en-GB', {day: 'numeric', month: 'long', year: 'numeric'}));
  el.setAttribute('aria-label', L.aria);
}
function dots() {
  // Dot size in map units for about 6 px on screen.
  const vb = svg.viewBox.baseVal, u = vb.width / Math.max(200, el.clientWidth || 700);
  svg.querySelector('#covdots').innerHTML = D.cities.map((c, i) => {
    const s = DOT[c[3]]; if (!s) return '';
    const x = px(c[2]).toFixed(1), y = py(c[1]).toFixed(1);
    return `<g class="pt" data-i="${i}"><circle cx="${x}" cy="${y}" r="${(13 * u).toFixed(1)}" fill="transparent"/><circle cx="${x}" cy="${y}" r="${(5.5 * u).toFixed(1)}" fill="${s[0]}" stroke="${s[1]}" stroke-width="${(2 * u).toFixed(2)}"/></g>`;
  }).join('');
}
function setFrame(f) {
  frame = f;
  svg.setAttribute('viewBox', frames[f].join(' '));
  dots(); legend(); hideTip();
}
function showTip(html, target) {
  tip.innerHTML = html;
  const r = el.getBoundingClientRect(), d = target.getBoundingClientRect();
  const x = Math.max(90, Math.min(r.width - 90, d.left + d.width / 2 - r.left));
  const y = Math.max(40, Math.min(r.height - 10, d.top + Math.min(d.height, 40) / 2 - r.top));
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
  tip.classList.add('show');
}
function hideTip() { tip?.classList.remove('show'); sel?.classList.remove('sel'); sel = null; }
function pick(t) {
  const L = LABEL[lang()];
  const g = t.closest('.pt');
  if (g) {
    const c = D.cities[+g.dataset.i], note = lang() === 'de' ? c[5] : c[4];
    showTip(`<b>${esc(c[0])}</b><span><i style="background:${DOT[c[3]][0]};border-color:${DOT[c[3]][1]}"></i>${L[c[3]]}</span>${note ? `<small>${esc(note)}</small>` : ''}`, g.lastChild);
    return true;
  }
  const p = t.closest('path[data-i]');
  if (p) {
    const c = D.countries[+p.dataset.i], k = c[3] || 'n';
    sel?.classList.remove('sel'); sel = p; p.classList.add('sel');
    showTip(`<b>${esc(lang() === 'de' ? c[2] : c[1])}</b><span><i class="k-${k}"></i>${L[k]}</span>${c[4] ? `<small>${L.stops(nf(c[4]))}</small>` : ''}`, p);
    return true;
  }
  return false;
}

fetch('abdeckung/data/home.json').then(r => r.json()).then(d => {
  D = d;
  const NS = 'http://www.w3.org/2000/svg';
  const withData = D.countries.filter(c => c[3] && c[3] !== 'n' && c[3] !== 'v');
  frames.world = viewBox(boxOf(withData.length ? withData : D.countries));
  frames.europe = viewBox(EUROPE);
  el.innerHTML = `<svg xmlns="${NS}" preserveAspectRatio="xMidYMid meet"><g id="covland">${D.countries.map((c, i) =>
    `<path data-i="${i}" class="k-${c[3] || 'n'}" d="${c[5]}"/>`).join('')}</g><g id="covdots"></g></svg><div class="covtip" role="status"></div>`;
  svg = el.querySelector('svg'); tip = el.querySelector('.covtip');
  setFrame('world');
  svg.addEventListener('pointerover', e => { if (e.pointerType === 'mouse' && !pick(e.target)) hideTip(); });
  svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hideTip(); });
  svg.addEventListener('click', e => { if (!pick(e.target)) hideTip(); });
  document.getElementById('covlegend')?.addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (b) setFrame(b.dataset.f); });
  new ResizeObserver(() => dots()).observe(el);
  new MutationObserver(legend).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  if (reduce || !('IntersectionObserver' in window)) el.classList.add('on');
  else {
    const io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) { io.disconnect(); el.classList.add('on'); } }, {threshold: .2});
    io.observe(el);
  }
}).catch(() => { el.hidden = true; });
})();
