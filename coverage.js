/* Coverage map: where Publit has timetables and live times (docs/COVERAGE.md, checked 14 Oct 2026).
   Own SVG map: Natural Earth 50m borders in Mercator (assets/europe.svg), no external tiles or scripts. */
(() => {
const el = document.getElementById('covmap');
if (!el) return;
// Same projection as assets/europe.svg
const K = 0.6156614753256583, SX = 22.87703162651752, Y1 = 1.81486224426954, S = K * SX;
const px = lon => (lon + SX) * S;
const py = lat => (Y1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))) * S * 180 / Math.PI;
// k: n = no data, p = part of the network, t = timetable only, x = live through Publit's own sources, l = live
const C = [
 ['Athens',37.98,23.73,'n','Feeds listed, no stops loaded','Feeds gelistet, aber keine Haltestellen geladen'],
 ['Valletta',35.90,14.51,'n','No feed (Malta)','Kein Feed (Malta)'],
 ['Minsk',53.90,27.56,'n','No feed','Kein Feed'],
 ['Moscow',55.75,37.62,'n','No feed (not tested)','Kein Feed (nicht getestet)'],
 ['Istanbul',41.01,28.98,'p','IETT buses only; no metro, trams, ferries','Nur IETT-Busse; keine Metro, Trams, Fähren'],
 ['Kyiv',50.45,30.52,'p','City buses only; no metro, trams','Nur Stadtbusse; keine Metro, Trams'],
 ['Pristina',42.66,21.17,'p','Trains only; no city buses','Nur Züge; keine Stadtbusse'],
 ['Gothenburg',57.71,11.97,'t'],['Copenhagen',55.68,12.57,'t'],['Lisbon',38.72,-9.14,'t','Only CP trains live','Nur CP-Züge live'],
 ['Porto',41.15,-8.61,'t','Only CP trains live','Nur CP-Züge live'],['Barcelona',41.39,2.17,'t','Only Rodalies live','Nur Rodalies live'],
 ['Valencia',39.47,-0.38,'t'],['Seville',37.39,-5.98,'t'],['Brussels',50.85,4.35,'t','Only SNCB trains live','Nur SNCB-Züge live'],
 ['Marseille',43.30,5.37,'t'],['Milan',45.46,9.19,'t','Only Trenitalia live','Nur Trenitalia live'],['Naples',40.85,14.27,'t','Only Trenitalia live','Nur Trenitalia live'],
 ['Luxembourg',49.61,6.13,'t'],['Bratislava',48.15,17.11,'t'],['Brno',49.20,16.61,'t','Only trains live','Nur Züge live'],
 ['Tallinn',59.44,24.75,'t','Only Elron trains live','Nur Elron-Züge live'],['Manchester',53.48,-2.24,'t','Only trains live','Nur Züge live'],
 ['Belgrade',44.79,20.45,'t'],['Sarajevo',43.86,18.41,'t'],['Podgorica',42.44,19.26,'t'],['Tirana',41.33,19.82,'t'],
 ['Thessaloniki',40.64,22.94,'t'],['Lviv',49.84,24.03,'t'],['Ankara',39.93,32.86,'t'],['Nicosia',35.19,33.38,'t'],
 ['Monaco',43.74,7.42,'t'],['Andorra la Vella',42.51,1.52,'t'],
 ['Vienna',48.21,16.37,'x','Live via Wiener Linien open data and ÖBB','Live über Wiener Linien Open Data und ÖBB'],
 ['Salzburg',47.81,13.04,'x','Live via ÖBB','Live über ÖBB'],['Innsbruck',47.27,11.40,'x','Live via ÖBB','Live über ÖBB'],
 ['Linz',48.31,14.29,'x','Live via ÖBB','Live über ÖBB'],['Venice',45.44,12.33,'x','Live via ACTV (vaporetti, buses)','Live über ACTV (Vaporetti, Busse)'],
 ['Stockholm',59.33,18.07,'x','Live via SL','Live über SL'],
 ['Berlin',52.52,13.40,'l'],['Hamburg',53.55,9.99,'l'],['Munich',48.14,11.58,'l'],['Zürich',47.38,8.54,'l'],['Geneva',46.20,6.14,'l'],
 ['Graz',47.07,15.44,'l'],['Paris',48.86,2.35,'l'],['Lyon',45.76,4.84,'l'],['London',51.51,-0.13,'l','Plus TfL line status','Dazu TfL-Linienstatus'],
 ['Dublin',53.35,-6.26,'l'],['Madrid',40.42,-3.70,'l','Cercanías','Cercanías'],['Rome',41.90,12.50,'l'],['Amsterdam',52.37,4.90,'l','Partly','Teilweise'],
 ['Rotterdam',51.92,4.48,'l','Partly','Teilweise'],['Antwerp',51.22,4.40,'l'],['Oslo',59.91,10.75,'l'],['Helsinki',60.17,24.94,'l'],
 ['Riga',56.95,24.11,'l'],['Vilnius',54.69,25.28,'l'],['Warsaw',52.23,21.01,'l'],['Kraków',50.06,19.94,'l'],['Prague',50.08,14.44,'l'],
 ['Budapest',47.50,19.04,'l'],['Ljubljana',46.06,14.51,'l'],['Zagreb',45.81,15.98,'l'],['Skopje',41.99,21.43,'l'],['Sofia',42.70,23.32,'l'],
 ['Bucharest',44.43,26.10,'l'],['Chișinău',47.01,28.86,'l','Partly','Teilweise'],['Tbilisi',41.72,44.79,'l','Partly','Teilweise'],['Reykjavík',64.15,-21.94,'l']
];
const LABEL = {
  en: {n:'No timetable data', p:'Part of the network', t:'Timetable only', x:'Live via Publit', l:'Timetable and live'},
  de: {n:'Keine Fahrplandaten', p:'Nur Teile des Netzes', t:'Nur Fahrplan', x:'Live über Publit', l:'Fahrplan und live'}
};
const STYLE = {
  n: {r:6, stroke:'#9c9ca1', w:2, fill:'#ffffff'},
  p: {r:6, stroke:'#b25000', w:2, fill:'#ffffff'},
  t: {r:6, stroke:'#111111', w:1.5, fill:'#9c9ca1'},
  x: {r:7, stroke:'#111111', w:2, fill:'#ffc531'},
  l: {r:6.5, stroke:'#ffffff', w:1.5, fill:'#1b7a33'}
};
const lang = () => document.documentElement.lang === 'de' ? 'de' : 'en';
function legend() {
  const box = document.getElementById('covlegend');
  if (!box) return;
  const L = LABEL[lang()];
  box.innerHTML = Object.keys(STYLE).map(k => {
    const s = STYLE[k];
    const n = C.filter(c => c[3] === k).length;
    return `<li><i style="background:${s.fill};border-color:${s.stroke === '#ffffff' ? s.fill : s.stroke}"></i>${L[k]} <span>${n}</span></li>`;
  }).join('');
}
legend();
new MutationObserver(legend).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});

// Draw: map, then dots from west to east; live ones on top.
const NS = 'http://www.w3.org/2000/svg';
const order = {n: 0, p: 1, t: 2, x: 3, l: 4};
const minLon = Math.min(...C.map(c => c[2])), maxLon = Math.max(...C.map(c => c[2]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('shot');
let dots = '';
[...C].sort((a, b) => order[a[3]] - order[b[3]]).forEach(c => {
  const s = STYLE[c[3]], x = px(c[2]).toFixed(1), y = py(c[1]).toFixed(1);
  const delay = reduce ? 0 : ((c[2] - minLon) / (maxLon - minLon) * 1.8).toFixed(2);
  const i = C.indexOf(c);
  dots += `<g class="pt" data-i="${i}" style="transition-delay:${delay}s">` +
    (c[3] === 'l' && !reduce ? `<circle class="ring" cx="${x}" cy="${y}" r="${s.r}" style="animation-delay:${(+delay + 0.6 + (i % 7) * .3).toFixed(2)}s"/>` : '') +
    `<circle cx="${x}" cy="${y}" r="${s.r + 7}" fill="transparent"/>` +
    `<circle cx="${x}" cy="${y}" r="${s.r}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.w}"/></g>`;
});
el.innerHTML = `<svg viewBox="0 170 1000 790" xmlns="${NS}"><image href="assets/europe.svg" x="0" y="170" width="1000" height="790"/>${dots}</svg><div class="covtip" role="status"></div>`;
const svg = el.querySelector('svg'), tip = el.querySelector('.covtip');
let sel = null;
function showTip(g) {
  const c = C[+g.dataset.i], l = lang(), s = STYLE[c[3]];
  const note = l === 'de' ? (c[5] || '') : (c[4] || '');
  tip.innerHTML = `<b>${c[0]}</b><span><i style="background:${s.fill};border-color:${s.stroke === '#ffffff' ? s.fill : s.stroke}"></i>${LABEL[l][c[3]]}</span>${note ? '<small>' + note + '</small>' : ''}`;
  const r = el.getBoundingClientRect(), d = g.lastChild.getBoundingClientRect();
  let x = d.left + d.width / 2 - r.left;
  x = Math.max(90, Math.min(r.width - 90, x));
  tip.style.left = x + 'px'; tip.style.top = (d.top - r.top) + 'px';
  tip.classList.add('show');
  if (sel) sel.classList.remove('sel');
  sel = g; g.classList.add('sel');
}
function hideTip() { tip.classList.remove('show'); if (sel) sel.classList.remove('sel'); sel = null; }
svg.addEventListener('pointerover', e => { const g = e.target.closest('.pt'); if (g) showTip(g); });
svg.addEventListener('pointerout', e => { const g = e.target.closest('.pt'); if (g && !g.contains(e.relatedTarget) && e.pointerType === 'mouse') hideTip(); });
svg.addEventListener('click', e => { const g = e.target.closest('.pt'); g ? showTip(g) : hideTip(); });
el.setAttribute('aria-label', lang() === 'de' ? 'Karte der Abdeckung in Europa' : 'Map of coverage in Europe');

if (reduce || !('IntersectionObserver' in window)) el.classList.add('on');
else {
  const io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) { io.disconnect(); el.classList.add('on'); } }, {threshold: .3});
  io.observe(el);
}
})();
