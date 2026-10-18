/* Coverage map: where Publit has timetables and live times (docs/COVERAGE.md, checked 14 Oct 2026).
   Leaflet and the map tiles load only when the section comes into view. */
(() => {
const el = document.getElementById('covmap');
if (!el) return;
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
  n: {radius:6, color:'#9c9ca1', weight:2, fillColor:'#ffffff', fillOpacity:1},
  p: {radius:6, color:'#b25000', weight:2, fillColor:'#ffffff', fillOpacity:1},
  t: {radius:6, color:'#111111', weight:1.5, fillColor:'#9c9ca1', fillOpacity:1},
  x: {radius:7, color:'#111111', weight:2, fillColor:'#ffc531', fillOpacity:1},
  l: {radius:6, color:'#ffffff', weight:1.5, fillColor:'#1b7a33', fillOpacity:1}
};
const lang = () => document.documentElement.lang === 'de' ? 'de' : 'en';
function legend() {
  const box = document.getElementById('covlegend');
  if (!box) return;
  const L = LABEL[lang()];
  box.innerHTML = Object.keys(STYLE).map(k => {
    const s = STYLE[k];
    const n = C.filter(c => c[3] === k).length;
    return `<li><i style="background:${s.fillColor};border-color:${s.color}"></i>${L[k]} <span>${n}</span></li>`;
  }).join('');
}
legend();
new MutationObserver(() => { legend(); if (window._covRefresh) window._covRefresh(); })
  .observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});

function load() {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='; css.crossOrigin = '';
  document.head.appendChild(css);
  const js = document.createElement('script');
  js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  js.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='; js.crossOrigin = '';
  js.onload = draw;
  js.onerror = () => { el.classList.add('covmap-off'); };
  document.head.appendChild(js);
}
function draw() {
  const L = window.L;
  const map = L.map(el, {scrollWheelZoom: false, worldCopyJump: false, minZoom: 3, maxZoom: 9, zoomSnap: 0.5})
    .setView([50, 14], window.innerWidth < 700 ? 3 : 4);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a> · <a href="https://transitous.org">Transitous</a>'
  }).addTo(map);
  const markers = C.map(c => {
    const m = L.circleMarker([c[1], c[2]], STYLE[c[3]]).addTo(map);
    m._cov = c;
    return m;
  });
  const popup = c => {
    const l = lang();
    const note = l === 'de' ? (c[5] || '') : (c[4] || '');
    return `<strong>${c[0]}</strong><br>${LABEL[l][c[3]]}${note ? '<br><small>' + note + '</small>' : ''}`;
  };
  window._covRefresh = () => markers.forEach(m => m.bindPopup(popup(m._cov)));
  window._covRefresh();
  // Order: live on top, so dense areas show the best there is.
  markers.filter(m => m._cov[3] === 'l' || m._cov[3] === 'x').forEach(m => m.bringToFront());
}
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)) { io.disconnect(); load(); } }, {rootMargin: '300px'});
  io.observe(el);
} else load();
})();
