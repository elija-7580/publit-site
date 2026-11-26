// SPDX-License-Identifier: LicenseRef-AllRightsReserved
// SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich
// Interne Grafikseite: zeichnet alle Grafiken als SVG aus data.json (plus ein paar feste Planzahlen unten).
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var W = 600;
  var nf = new Intl.NumberFormat('de-DE');
  function fmt(v, d) { return d == null ? nf.format(v) : new Intl.NumberFormat('de-DE', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function svg(h) { var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 ' + W + ' ' + h); s.setAttribute('role', 'img'); return s; }
  function el(p, tag, a, txt) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; p.appendChild(e); return e; }
  function cut(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function nice(m) { if (m <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  function ticks(max, n) { var st = nice(max / (n || 4)), t = [0]; while (t[t.length - 1] < max - st * 0.001) t.push(+(t[t.length - 1] + st).toFixed(6)); return t; }
  var SLOT = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
  // Bar with 4px rounded data end, square at the baseline (horizontal: left edge flat).
  function hbarPath(x, y, w, h) { var r = Math.min(4, w / 2, h / 2); if (w <= 0) return ''; return 'M' + x + ' ' + y + 'h' + (w - r) + 'q' + r + ' 0 ' + r + ' ' + r + 'v' + (h - 2 * r) + 'q0 ' + r + ' ' + (-r) + ' ' + r + 'h' + (r - w) + 'z'; }
  function vbarPath(x, y, w, h) { var r = Math.min(4, w / 2, h / 2); if (h <= 0) return ''; return 'M' + x + ' ' + (y + h) + 'v' + (r - h) + 'q0 ' + (-r) + ' ' + r + ' ' + (-r) + 'h' + (w - 2 * r) + 'q' + r + ' 0 ' + r + ' ' + r + 'v' + (h - r) + 'z'; }

  // ---------- tooltip ----------
  var tip = document.getElementById('tip');
  function showTip(e) { var t = e.target.closest('[data-tip]'); if (!t) { tip.style.opacity = 0; return; } tip.textContent = t.getAttribute('data-tip'); tip.style.opacity = 1; var x = e.clientX + 14, y = e.clientY + 14, r = tip.getBoundingClientRect(); if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 10; if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 10; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  document.addEventListener('mousemove', showTip);
  document.addEventListener('touchstart', function (e) { showTip(e.touches[0] ? { target: e.target, clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } : e); }, { passive: true });

  function legend(items) { return '<div class="legend">' + items.map(function (it) { return '<span><i style="background:' + it[1] + '"></i>' + esc(it[0]) + '</span>'; }).join('') + '</div>'; }

  // ---------- horizontal bars ----------
  // rows: [label, value, colorKey?]; o: {unit, dec, colors:{key:color}, max, lab}
  function hbars(rows, o) {
    o = o || {};
    var lab = o.lab || 168, rh = 22, gap = 6, top = 22, h = top + rows.length * (rh + gap) + 4;
    var s = svg(h), max = o.max || Math.max.apply(null, rows.map(function (r) { return r[1]; })), tk = ticks(max, 4), M = o.max || tk[tk.length - 1];
    var x0 = lab + 8, plot = W - x0 - 64;
    tk.forEach(function (t) { if (t > M) return; var x = x0 + plot * t / M; el(s, 'line', { x1: x, x2: x, y1: top - 4, y2: h - 4, 'class': 'gl' }); el(s, 'text', { x: x, y: 12, 'text-anchor': 'middle' }, fmt(t) + (o.unit === '%' ? ' %' : '')); });
    rows.forEach(function (r, i) {
      var y = top + i * (rh + gap), w = Math.max(r[1] > 0 ? 2 : 0, plot * r[1] / M), c = (o.colors && o.colors[r[2]]) || 'var(--s1)';
      var tipT = r[0] + ': ' + fmt(r[1], o.dec) + (o.unit ? ' ' + o.unit : '') + (r[2] && o.colors ? '\n' + r[2] : '') + (o.extra ? o.extra(r) : '');
      el(s, 'text', { x: lab, y: y + rh / 2 + 4, 'text-anchor': 'end', 'class': 'l' }, cut(r[0], o.cut || 26));
      el(s, 'rect', { x: 0, y: y - gap / 2, width: W, height: rh + gap, 'class': 'hit', 'data-tip': tipT });
      el(s, 'path', { d: hbarPath(x0, y, w, rh), fill: c, 'class': 'hov', 'data-tip': tipT });
      el(s, 'text', { x: x0 + w + 6, y: y + rh / 2 + 4, 'class': 'v' }, o.vfmt ? o.vfmt(r[1]) : fmt(r[1], o.dec) + (o.unit === '%' ? ' %' : ''));
    });
    return s;
  }
  // ---------- stacked horizontal bars ----------
  function hstack(cats, series, o) {
    o = o || {};
    var lab = o.lab || 120, rh = 22, gap = 8, top = 22, h = top + cats.length * (rh + gap) + 4;
    var s = svg(h), tot = cats.map(function (_, i) { return series.reduce(function (a, se) { return a + se[1][i]; }, 0); });
    var max = o.pct ? 100 : Math.max.apply(null, tot), tk = ticks(max, 4), M = o.pct ? 100 : tk[tk.length - 1], x0 = lab + 8, plot = W - x0 - 50;
    tk.forEach(function (t) { if (t > M) return; var x = x0 + plot * t / M; el(s, 'line', { x1: x, x2: x, y1: top - 4, y2: h - 4, 'class': 'gl' }); el(s, 'text', { x: x, y: 12, 'text-anchor': 'middle' }, fmt(t) + (o.pct ? ' %' : '')); });
    cats.forEach(function (c, i) {
      var y = top + i * (rh + gap), x = x0;
      el(s, 'text', { x: lab, y: y + rh / 2 + 4, 'text-anchor': 'end', 'class': 'l' }, cut(c, 20));
      series.forEach(function (se, j) {
        var v = se[1][i], w = plot * (o.pct ? (tot[i] ? v / tot[i] * 100 : 0) : v) / M; if (w <= 0) return;
        var last = series.slice(j + 1).every(function (q) { return !q[1][i]; });
        var t = c + ' · ' + se[0] + ': ' + fmt(v) + (o.pct ? ' (' + fmt(Math.round(v / tot[i] * 100)) + ' %)' : '');
        var ww = Math.max(1, w - (last ? 0 : 2));
        el(s, 'path', { d: last ? hbarPath(x, y, ww, rh) : 'M' + x + ' ' + y + 'h' + ww + 'v' + rh + 'h' + (-ww) + 'z', fill: SLOT[j], 'class': 'hov', 'data-tip': t });
        x += w;
      });
      if (!o.pct) el(s, 'text', { x: x + 6, y: y + rh / 2 + 4, 'class': 'v' }, fmt(tot[i]));
    });
    return s;
  }
  // ---------- vertical columns (stacked or grouped) ----------
  function columns(cats, series, o) {
    o = o || {};
    var h = 250, top = 14, bot = 34, left = 40, plot = W - left - 8, ph = h - top - bot, s = svg(h);
    var vals = cats.map(function (_, i) { return o.grouped ? Math.max.apply(null, series.map(function (se) { return se[1][i]; })) : series.reduce(function (a, se) { return a + se[1][i]; }, 0); });
    var tk = ticks(Math.max.apply(null, vals), 4), M = tk[tk.length - 1], bw = plot / cats.length;
    tk.forEach(function (t) { var y = top + ph - ph * t / M; el(s, 'line', { x1: left, x2: W, y1: y, y2: y, 'class': t ? 'gl' : 'ax' }); el(s, 'text', { x: left - 6, y: y + 4, 'text-anchor': 'end' }, fmt(t)); });
    var every = Math.ceil(cats.length / 9);
    cats.forEach(function (c, i) {
      var x = left + i * bw, inner = bw * 0.7, xs = x + (bw - inner) / 2, yb = top + ph;
      if (i % every === 0) el(s, 'text', { x: x + bw / 2, y: h - bot + 16, 'text-anchor': 'middle' }, o.label ? o.label(c) : c);
      if (o.grouped) {
        var gw = (inner - 2 * (series.length - 1)) / series.length;
        series.forEach(function (se, j) { var v = se[1][i], hh = ph * v / M; el(s, 'path', { d: vbarPath(xs + j * (gw + 2), yb - hh, gw, hh), fill: SLOT[j], 'class': 'hov', 'data-tip': (o.label ? o.label(c, 1) : c) + ' · ' + se[0] + ': ' + fmt(v) }); });
      } else {
        var y = yb;
        series.forEach(function (se, j) {
          var v = se[1][i], hh = ph * v / M; if (hh <= 0) return;
          var last = series.slice(j + 1).every(function (q) { return !q[1][i]; }), hv = Math.max(1, hh - (last ? 0 : 2));
          el(s, 'path', { d: last ? vbarPath(xs, y - hh, inner, hv) : 'M' + xs + ' ' + (y - hv) + 'h' + inner + 'v' + hv + 'h' + (-inner) + 'z', fill: SLOT[j], 'class': 'hov', 'data-tip': (o.label ? o.label(c, 1) : c) + ' · ' + se[0] + ': ' + fmt(v) });
          y -= hh;
        });
        el(s, 'rect', { x: x, y: top, width: bw, height: ph, 'class': 'hit', 'data-tip': (o.label ? o.label(c, 1) : c) + '\n' + series.map(function (se) { return se[0] + ': ' + fmt(se[1][i]); }).join('\n') + '\nGesamt: ' + fmt(vals[i]) });
      }
    });
    return s;
  }
  // ---------- line chart over dates ----------
  var DAY = 864e5;
  function dshort(d, long) { var p = d.split('-'); return +p[2] + '.' + +p[1] + '.' + (long ? p[0] : ''); }
  function lines(series, o) {
    o = o || {};
    var h = 250, top = 14, bot = 34, left = 44, right = o.right || 96, plot = W - left - right, ph = h - top - bot, s = svg(h);
    var all = []; series.forEach(function (se) { se[1].forEach(function (p) { all.push(p); }); });
    var t0 = Math.min.apply(null, all.map(function (p) { return Date.parse(p[0]); })), t1 = Math.max.apply(null, all.map(function (p) { return Date.parse(p[0]); }));
    if (o.end) t1 = Math.max(t1, Date.parse(o.end));
    var tk = ticks(Math.max.apply(null, all.map(function (p) { return p[1]; })), 4), M = tk[tk.length - 1];
    function X(d) { return left + plot * (Date.parse(d) - t0) / Math.max(DAY, t1 - t0); }
    function Y(v) { return top + ph - ph * v / M; }
    tk.forEach(function (t) { el(s, 'line', { x1: left, x2: left + plot, y1: Y(t), y2: Y(t), 'class': t ? 'gl' : 'ax' }); el(s, 'text', { x: left - 6, y: Y(t) + 4, 'text-anchor': 'end' }, fmt(t)); });
    var span = (t1 - t0) / DAY, step = span > 40 ? 14 : span > 20 ? 7 : span > 8 ? 3 : 1;
    for (var t = t0; t <= t1 + 1; t += step * DAY) { var d = new Date(t).toISOString().slice(0, 10); el(s, 'text', { x: X(d), y: h - bot + 16, 'text-anchor': 'middle' }, dshort(d)); }
    var labels = [];
    series.forEach(function (se, j) {
      var pts = se[1], d = '';
      pts.forEach(function (p, i) { var x = X(p[0]), y = Y(p[1]); if (!i) d = 'M' + x + ' ' + y; else d += (o.step ? 'H' + x + 'V' + y : 'L' + x + ' ' + y); });
      if (o.end) d += 'H' + X(o.end);
      el(s, 'path', { d: d, fill: 'none', stroke: SLOT[j], 'stroke-width': 2, 'stroke-linejoin': 'round' });
      pts.forEach(function (p) { el(s, 'circle', { cx: X(p[0]), cy: Y(p[1]), r: 9, 'class': 'hit', 'data-tip': (series.length > 1 ? se[0] + '\n' : '') + dshort(p[0], 1) + ': ' + fmt(p[1]) + (o.unit ? ' ' + o.unit : '') }); });
      var lp = pts[pts.length - 1];
      el(s, 'circle', { cx: o.end ? X(o.end) : X(lp[0]), cy: Y(lp[1]), r: 4, fill: SLOT[j], stroke: 'var(--surface)', 'stroke-width': 2 });
      labels.push({ y: Y(lp[1]) + 4, t: (series.length > 1 ? se[0] + ' ' : '') + fmt(lp[1]), x: (o.end ? X(o.end) : X(lp[0])) + 8 });
    });
    labels.sort(function (a, b) { return a.y - b.y; }); for (var i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
    labels.forEach(function (l) { el(s, 'text', { x: l.x, y: l.y, 'class': 'v' }, l.t); });
    return s;
  }
  // ---------- scatter ----------
  function scatter(rows, o) {
    var h = 350, top = 26, bot = 40, left = 44, right = 14, plot = W - left - right, ph = h - top - bot, s = svg(h);
    function X(v) { return left + plot * v / 100; } function Y(v) { return top + ph - ph * v / 100; }
    [0, 25, 50, 75, 100].forEach(function (t) { el(s, 'line', { x1: left, x2: left + plot, y1: Y(t), y2: Y(t), 'class': t ? 'gl' : 'ax' }); el(s, 'text', { x: left - 6, y: Y(t) + 4, 'text-anchor': 'end' }, t + ' %'); el(s, 'line', { x1: X(t), x2: X(t), y1: top, y2: top + ph, 'class': t ? 'gl' : 'ax' }); el(s, 'text', { x: X(t), y: top + ph + 16, 'text-anchor': 'middle' }, t + ' %'); });
    el(s, 'text', { x: left + plot / 2, y: h - 4, 'text-anchor': 'middle' }, o.xl);
    var mx = Math.max.apply(null, rows.map(function (r) { return r[3]; }));
    rows.forEach(function (r) {
      var rad = 4 + 10 * Math.sqrt(r[3] / mx);
      el(s, 'circle', { cx: X(r[1]), cy: Y(r[2]), r: rad, fill: 'var(--s1)', 'fill-opacity': .55, stroke: 'var(--surface)', 'stroke-width': 2, 'data-tip': r[0] + '\nFläche mit Halten: ' + fmt(r[1], 1) + ' %\nLive-Anteil: ' + fmt(r[2], 1) + ' %\nHaltestellen: ' + fmt(r[3]) });
      if (o.show.indexOf(r[0]) >= 0) { var right = r[1] > 70; el(s, 'text', { x: X(r[1]) + (right ? -rad - 3 : rad + 3), y: Y(r[2]) + (r[2] > 97 ? 16 + rad / 2 : 4), 'text-anchor': right ? 'end' : 'start', 'class': 'l' }, r[0].replace('Vereinigtes Königreich', 'UK')); }
    });
    el(s, 'text', { x: left - 6, y: 10, 'text-anchor': 'end' }, '↑ ' + o.yl);
    return s;
  }
  // ---------- heatmap weekday x hour ----------
  function heat(cells) {
    var days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], left = 28, top = 6, cw = (W - left) / 24, ch = 26, h = top + 7 * ch + 22, s = svg(h);
    var mx = Math.max.apply(null, cells.map(function (c) { return c[2]; }));
    cells.forEach(function (c) {
      var v = c[2], k = v ? Math.min(7, 1 + Math.floor(6.999 * Math.sqrt(v / mx))) : 0;
      el(s, 'rect', { x: left + c[1] * cw + 1, y: top + c[0] * ch + 1, width: cw - 2, height: ch - 2, rx: 3, fill: 'var(--q' + k + ')', 'data-tip': days[c[0]] + ', ' + c[1] + '–' + (c[1] + 1) + ' Uhr: ' + fmt(v) + ' Commits' });
    });
    days.forEach(function (d, i) { el(s, 'text', { x: left - 6, y: top + i * ch + ch / 2 + 4, 'text-anchor': 'end' }, d); });
    for (var hr = 0; hr < 24; hr += 3) el(s, 'text', { x: left + hr * cw + cw / 2, y: h - 6, 'text-anchor': 'middle' }, hr + ' h');
    return s;
  }
  function table(head, rows) {
    return '<details><summary>Tabelle</summary><div class="tw"><table><thead><tr>' + head.map(function (x, i) { return '<th' + (i ? ' class="n"' : '') + '>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (x, i) { return '<td' + (i && typeof x === 'number' ? ' class="n"' : '') + '>' + esc(typeof x === 'number' ? fmt(x) : x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
  }
  function wk(d, long) { return long ? 'Woche ab ' + dshort(d, 1) : dshort(d); }
  function seriesTable(cats, series, first, lab) { return table([first].concat(series.map(function (s) { return s[0]; })), cats.map(function (c, i) { return [lab ? lab(c) : c].concat(series.map(function (s) { return s[1][i]; })); })); }

  // ---------- fixed plan figures (not in data.json) ----------
  var MARKET = { rows: [['Städtischer ÖV-Sektor (UITP), Umsatz/Jahr', 130], ['Bahn-Ticketumsatz Europa/Jahr', 55], ['Provisionstopf Bahn (55 Mrd. × 4,5 %)', 2.5]], src: 'Publit-Pitchdeck (24.11.2026), Folie „Market“: UITP, IRG-Rail 14. Marktbericht 2026, Trainline FY25; „130+“ als 130 gezeichnet' };
  var REV = { rows: [10000, 25000, 50000, 100000, 250000, 500000, 1000000].map(function (n) { return [fmt(n) + ' Fahrgäste', n * 20 * 15 * 0.04 / 1e6]; }), src: 'Planannahmen aus dem Pitchdeck: 20 Tickets pro Person und Jahr, 15 € pro Ticket, 4 % Provision. Keine Ist-Zahlen, Ticketkauf ist noch nicht live.' };
  var FUND = { rows: [['Wirtschaftsagentur Wien Innovation', 135000, '45 % von max. 300.000 € Projekt (rechnerisch)', '31.12.2026'], ['aws Preseed Innovative Solutions', 89000, '80 %', 'laufend, Periode bis 31.12.2026'], ['netidee', 60000, 'Open Source, Einzelpersonen ok', 'Call 22 noch offen'], ['NLnet (Restack)', 50000, '100 %', '3.1.2027, 12:00 CET']], src: 'Förder-Recherche vom 23.11.2026 (Projekt-Memory „funding“). Nichts eingereicht, Beträge sind Höchstwerte.' };

  var STAT = { 'Erledigt': 'var(--s3)', 'In Arbeit': 'var(--s1)', 'Geplant': 'var(--s4)', 'Offen': 'var(--s2)' };

  function sections(D) {
    var cov = D.stops.src;
    return [
      ['abdeckung', 'Abdeckung', 'Was Publit über Transitous an Fahrplänen und Echtzeit bekommt. Europa = 48 Länder inkl. UK, Schweiz, Türkei, Ukraine und Balkan. Stand der Daten: ' + dshort(D.date, 1) + '.', [
        { t: 'Haltestellen je Land (Top 25)', w: 'Insgesamt ' + fmt(D.stops.total) + ' Halte in ' + D.stops.n + ' europäischen Ländern. Zeigt, wo das Netz dicht ist und wo Routing gut funktionieren sollte.', s: cov,
          c: function () { return hbars(D.stops.rows, {}); }, tb: function () { return table(['Land', 'Haltestellen'], D.stops.rows); } },
        { t: 'Anteil der Halte mit Echtzeit je Land', w: 'Länder mit mindestens 1.000 Halten. Österreich liegt niedrig, weil Wien und die ÖBB-Live-Daten direkt in der App kommen und hier nicht mitzählen.', s: cov,
          c: function () { return hbars(D.live.rows, { unit: '%', max: 100, dec: 1 }); }, tb: function () { return table(['Land', 'Live-Anteil %'], D.live.rows); } },
        { t: 'Länder nach Abdeckungsstufe: Europa und Welt', w: 'Gleiche Stufen wie auf publit.eu/abdeckung. Europa ist fast überall live, außerhalb gibt es meist nur Fahrpläne oder einzelne Netze.', s: cov, lg: [['Live ≥ 50 %', SLOT[0]], ['Teilweise live', SLOT[1]], ['Nur Fahrplan', SLOT[2]], ['Vereinzelt', SLOT[3]]],
          c: function () { var cs = D.cats.series; return hstack(cs.map(function (x) { return x[0]; }), cs[0][1].map(function (_, j) { return [cs[0][1][j][0], cs.map(function (x) { return x[1][j][1]; })]; }), { lab: 130 }); },
          tb: function () { return table(['Stufe'].concat(D.cats.series.map(function (x) { return x[0]; })), D.cats.series[0][1].map(function (r, j) { return [r[0]].concat(D.cats.series.map(function (x) { return x[1][j][1]; })); })); } },
        { t: 'Flächenabdeckung gegen Echtzeit-Anteil', w: 'Je weiter rechts oben, desto besser. Punktgröße = Zahl der Halte. Links oben: gute Echtzeit, aber Lücken in der Fläche (z. B. Norwegen). Unten: Fahrplan ohne Live (Spanien, Schweden).', s: cov,
          c: function () { return scatter(D.scatter.rows, { xl: 'Fläche des Landes mit Haltestellen in der Nähe', yl: 'Live-Anteil', show: ['Deutschland', 'Frankreich', 'Italien', 'Spanien', 'Österreich', 'Polen', 'Norwegen', 'Schweden'] }); }, tb: function () { return table(['Land', 'Fläche %', 'Live %', 'Halte'], D.scatter.rows); } },
        { t: 'Datenfeeds je Land (Top 20)', w: D.feeds.total + ' Feeds in Europa. Viele Feeds heißt viele kleine Quellen, die einzeln ausfallen können; wenige große Feeds (DE, UK) sind robuster.', s: cov,
          c: function () { return hbars(D.feeds.rows, {}); }, tb: function () { return table(['Land', 'Feeds'], D.feeds.rows); } },
        { t: 'Feeds mit und ohne Echtzeit (Top 15 Länder nach Feeds)', w: 'Wo es viele Feeds ohne Echtzeit gibt, lohnt sich die Suche nach GTFS-RT-Quellen für Transitous am meisten.', s: cov, lg: [['mit Echtzeit', SLOT[0]], ['nur Fahrplan', SLOT[1]]],
          c: function () { return hstack(D.rt.cats, D.rt.series, {}); }, tb: function () { return seriesTable(D.rt.cats, D.rt.series, 'Land'); } },
        { t: 'Größte Feeds nach Haltestellen', w: 'Von diesen 15 Quellen hängt ein großer Teil der Abdeckung ab. Fällt eine aus, fehlen ganze Länder.', s: cov, lg: [['mit Echtzeit', SLOT[0]], ['ohne Echtzeit', SLOT[1]]],
          c: function () { return hbars(D.bigfeeds.rows.map(function (r) { return [r[0], r[1], r[2] ? 'mit Echtzeit' : 'ohne Echtzeit']; }), { colors: { 'mit Echtzeit': SLOT[0], 'ohne Echtzeit': SLOT[1] }, lab: 200, cut: 32 }); },
          tb: function () { return table(['Feed', 'Halte', 'Echtzeit'], D.bigfeeds.rows.map(function (r) { return [r[0], r[1], r[2] ? 'ja' : 'nein']; })); } },
        { t: 'Verkehrsunternehmen in den Daten je Land (Top 20)', w: fmt(D.ops.total) + ' Betreiber in Europa. Das ist die Liste möglicher Partner für Ticketverkauf und Datenkooperationen.', s: cov,
          c: function () { return hbars(D.ops.rows, {}); }, tb: function () { return table(['Land', 'Betreiber'], D.ops.rows); } },
        { t: 'Lizenzen der europäischen Feeds', w: 'Viele Feeds haben keine Lizenzangabe. Für kommerzielle Nutzung (Ticketverkauf) muss das je Quelle geklärt werden.', s: cov,
          c: function () { return hbars(D.lic.rows, { lab: 130 }); }, tb: function () { return table(['Lizenz', 'Feeds'], D.lic.rows); } },
        { t: 'Wie frisch sind die Fahrpläne?', w: 'Alter des letzten Updates je Feed am Stichtag. Feeds älter als 6 Monate sind Kandidaten für veraltete Abfahrten.', s: cov,
          c: function () { return columns(D.age.rows.map(function (r) { return r[0]; }), [['Feeds', D.age.rows.map(function (r) { return r[1]; })]], {}); }, tb: function () { return table(['Alter', 'Feeds'], D.age.rows); } },
        { t: 'Wer veröffentlicht die meisten Feeds?', w: 'Herausgeber mit vielen Feeds. Gute erste Ansprechpartner, wenn Daten fehlen oder falsch sind.', s: cov,
          c: function () { return hbars(D.pub.rows, { lab: 200, cut: 32 }); }, tb: function () { return table(['Herausgeber', 'Feeds'], D.pub.rows); } },
        { t: 'Österreich: Echtzeit über Transitous je Bundesland', w: 'Nur die Steiermark ist über Transitous weitgehend live, Vorarlberg teilweise. Wien (Wiener Linien) und ÖBB holt die App selbst, das fehlt hier. Für die anderen Länder wären offene Live-Daten der Verbünde der größte Hebel.', s: cov,
          c: function () { return hbars(D.reg_at.rows, { unit: '%', max: 100, dec: 1, extra: function (r) { return '\n' + fmt(r[2]) + ' Halte'; } }); }, tb: function () { return table(['Bundesland', 'Live %', 'Halte'], D.reg_at.rows); } },
        { t: 'Deutschland: Echtzeit je Bundesland', w: 'Deutschland ist über DELFI fast überall live. Gut als Vorzeige-Markt.', s: cov,
          c: function () { return hbars(D.reg_de.rows.map(function (r) { return [r[0].replace('Freie Hansestadt ', '').replace('Freie und Hansestadt ', '').replace('Freistaat ', ''), r[1], r[2]]; }), { unit: '%', max: 100, dec: 1, extra: function (r) { return '\n' + fmt(r[2]) + ' Halte'; } }); }, tb: function () { return table(['Bundesland', 'Live %', 'Halte'], D.reg_de.rows); } }
      ]],
      ['routing', 'Routing', 'Echte Abfrage an die Routing-Engine, die auch die App nutzt.', [
        { t: 'Schnellste Verbindung ab Wien Hbf', w: 'Abfahrt ab Freitag, 27.11.2026, 08:00. Farbe zeigt die Umstiege der schnellsten Verbindung. Gut für Pitch und Marketing („Wien → Budapest in 2 h 41“).', s: D.routes.src, lg: [['direkt', SLOT[0]], ['1 Umstieg', SLOT[1]], ['2 Umstiege', SLOT[2]]],
          c: function () { var r = D.routes.rows.filter(function (x) { return x.min; }).sort(function (a, b) { return a.min - b.min; }); return hbars(r.map(function (x) { return [x.city, x.min / 60, x.transfers === 0 ? 'direkt' : x.transfers + (x.transfers === 1 ? ' Umstieg' : ' Umstiege'), x]; }), { dec: 1, unit: 'h', vfmt: function (v) { var m = Math.round(v * 60); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); }, colors: { 'direkt': SLOT[0], '1 Umstieg': SLOT[1], '2 Umstiege': SLOT[2] }, lab: 90, extra: function (q) { var x = q[3], d = new Date(x.dep); return '\n' + Math.floor(x.min / 60) + ' h ' + x.min % 60 + ' min, ab ' + d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Vienna' }); } }); },
          tb: function () { return table(['Ziel', 'Minuten', 'Umstiege', 'Abfahrt'], D.routes.rows.filter(function (x) { return x.min; }).map(function (x) { return [x.city, x.min, x.transfers, new Date(x.dep).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Vienna' })]; })); } }
      ]],
      ['community', 'Community', 'Die Wunschliste in der App und auf publit.eu.', [
        { t: 'Die 15 meistgewünschten Funktionen', w: 'Nach Stimmen. Farbe = Status. Die vier Top-Wünsche sind erledigt; „Tickets in der App kaufen“ ist der größte offene.', s: D.wtop.src, lg: Object.keys(STAT).map(function (k) { return [k, STAT[k]]; }),
          c: function () { return hbars(D.wtop.rows, { colors: STAT, lab: 230, cut: 38 }); }, tb: function () { return table(['Wunsch', 'Stimmen', 'Status'], D.wtop.rows); } },
        { t: 'Stimmen nach Status', w: 'Wie viele Stimmen schon in erledigten Wünschen stecken. Gut für „Ihr wünscht, wir bauen“-Kommunikation.', s: D.wstatus.src, lg: [['Stimmen', SLOT[0]], ['Wünsche', SLOT[1]]],
          c: function () { var r = D.wstatus.rows; return columns(r.map(function (x) { return x[0]; }), [['Stimmen', r.map(function (x) { return x[2]; })], ['Wünsche', r.map(function (x) { return x[1]; })]], { grouped: true }); }, tb: function () { return table(['Status', 'Wünsche', 'Stimmen'], D.wstatus.rows); } },
        { t: 'Stimmen nach Bereich', w: 'Wo die Community den größten Bedarf sieht. Planen & Routen führt klar.', s: D.warea.src,
          c: function () { return hbars(D.warea.rows, { lab: 150, extra: function (r) { return '\n' + r[2] + ' Wünsche'; } }); }, tb: function () { return table(['Bereich', 'Stimmen', 'Wünsche'], D.warea.rows); } },
        { t: 'Wünsche insgesamt über die Zeit', w: 'Vom 13. bis 21.11. kamen fast alle Wünsche dazu, seitdem wächst die Liste kaum.', s: D.wtime.src,
          c: function () { return lines([['Wünsche', D.wtime.rows]], { step: true, end: '2026-11-26' }); }, tb: function () { return table(['Tag', 'Wünsche gesamt'], D.wtime.rows.map(function (r) { return [dshort(r[0], 1), r[1]]; })); } },
        { t: 'Sprache der Wünsche', w: 'Drei Viertel der Wünsche und 86 % der Stimmen sind englisch: Die Community ist international.', s: D.wlang.src, lg: [['Wünsche', SLOT[0]], ['Stimmen', SLOT[1]]],
          c: function () { return hstack(['Wünsche', 'Stimmen'], [['Englisch', [D.wlang.rows[0][1], D.wlang.votes[0][1]]], ['Deutsch', [D.wlang.rows[1][1], D.wlang.votes[1][1]]]], { pct: true, lab: 80 }); }, tb: function () { return table(['Sprache', 'Wünsche', 'Stimmen'], D.wlang.rows.map(function (r, i) { return [r[0], r[1], D.wlang.votes[i][1]]; })); } }
      ]],
      ['entwicklung', 'Entwicklung', 'Tempo und Arbeitsweise in den drei Repos (iOS, Android, Website).', [
        { t: 'Commits pro Woche je Repo', w: 'Zeigt Sprints: iOS-Start Mitte Oktober, Android Ende Oktober, alle drei parallel seit Mitte November.', s: D.commits.src, lg: [['iOS', SLOT[0]], ['Android', SLOT[1]], ['Website', SLOT[2]]],
          c: function () { return columns(D.commits.cats, D.commits.series, { label: wk }); }, tb: function () { return seriesTable(D.commits.cats, D.commits.series, 'Woche ab', function (c) { return dshort(c, 1); }); } },
        { t: 'iOS-Buildnummer über die Zeit', w: 'Build 107 in sieben Wochen. Flache Stellen sind Wochen ohne neue TestFlight-Builds.', s: D.builds.src,
          c: function () { return lines([['Build', D.builds.rows]], { step: true, end: '2026-11-26' }); }, tb: function () { return table(['Tag', 'Build'], D.builds.rows.map(function (r) { return [dshort(r[0], 1), r[1]]; })); } },
        { t: 'Gemergte Pull Requests pro Woche', w: 'Letzte Woche so viele wie nie: 87 PRs über alle drei Repos.', s: D.prs.src, lg: [['iOS', SLOT[0]], ['Android', SLOT[1]], ['Website', SLOT[2]]],
          c: function () { return columns(D.prs.cats, D.prs.series, { label: wk }); }, tb: function () { return seriesTable(D.prs.cats, D.prs.series, 'Woche ab', function (c) { return dshort(c, 1); }); } },
        { t: 'Wie schnell wird ein PR gemergt?', w: 'Zeit von „erstellt“ bis „gemergt“, ' + D.prlead.n + ' PRs. Drei Viertel sind in unter einer Stunde drin.', s: D.prlead.src,
          c: function () { return columns(D.prlead.rows.map(function (r) { return r[0]; }), [['PRs', D.prlead.rows.map(function (r) { return r[1]; })]], {}); }, tb: function () { return table(['Dauer', 'PRs'], D.prlead.rows); } },
        { t: 'iOS-Issues: eröffnet und geschlossen pro Woche', w: 'Seit Issues genutzt werden (November). Aktuell ' + D.issues.open + ' offen.', s: D.issues.src, lg: [['eröffnet', SLOT[0]], ['geschlossen', SLOT[1]]],
          c: function () { return columns(D.issues.cats, D.issues.series, { grouped: true, label: wk }); }, tb: function () { return seriesTable(D.issues.cats, D.issues.series, 'Woche ab', function (c) { return dshort(c, 1); }); } },
        { t: 'iOS-Issues nach Label', w: '„needs-elija“ ist der Stapel, der auf dich wartet: alle offen.', s: D.labels.src, lg: [['offen', SLOT[0]], ['geschlossen', SLOT[1]]],
          c: function () { return hstack(D.labels.cats, D.labels.series, { lab: 100 }); }, tb: function () { return seriesTable(D.labels.cats, D.labels.series, 'Label'); } },
        { t: 'Wann wird gearbeitet? (Commits nach Wochentag und Uhrzeit)', w: 'Alle drei Repos, Wiener Zeit. Dunkler = mehr Commits. Hilft beim Planen von Releases und Pausen.', s: D.heat.src,
          c: function () { return heat(D.heat.cells); }, tb: function () { var d = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']; return table(['Tag', 'Commits'], d.map(function (x, i) { return [x, D.heat.cells.filter(function (c) { return c[0] === i; }).reduce(function (a, c) { return a + c[2]; }, 0)]; })); } },
        { t: 'Codezeilen je Plattform und Sprache', w: 'Ohne Daten-Dateien. iOS ist die größte Codebasis, Android (Kotlin) holt auf.', s: D.loc.src, lg: [['Swift', SLOT[0]], ['Kotlin', SLOT[1]], ['Python', SLOT[2]], ['HTML/JS/CSS', SLOT[3]]],
          c: function () { var keep = D.loc.series.slice(0, 3), rest = D.loc.series.slice(3); var other = ['HTML/JS/CSS', D.loc.cats.map(function (_, i) { return rest.reduce(function (a, s) { return a + s[1][i]; }, 0); })]; return hstack(D.loc.cats, keep.concat([other]), { lab: 70 }); },
          tb: function () { return seriesTable(D.loc.cats, D.loc.series, 'Repo'); } }
      ]],
      ['geschaeft', 'Markt & Förderung', 'Planzahlen aus Pitchdeck und Förder-Recherche. Keine Ist-Umsätze.', [
        { t: 'Marktgröße Europa (Mrd. € pro Jahr)', w: 'Der Provisionstopf allein bei Bahntickets liegt bei rund 2,5 Mrd. € im Jahr.', s: MARKET.src,
          c: function () { return hbars(MARKET.rows, { dec: 1, unit: 'Mrd. €', lab: 250, cut: 46 }); }, tb: function () { return table(['Kennzahl', 'Mrd. €'], MARKET.rows); } },
        { t: 'Provisionsumsatz nach Zahl der Ticketkäufer (Mio. € pro Jahr)', w: 'Jede kaufende Person bringt in der Planrechnung 12 € im Jahr. 100.000 Käufer = 1,2 Mio. €.', s: REV.src,
          c: function () { return hbars(REV.rows, { dec: 2, unit: 'Mio. €', lab: 140 }); }, tb: function () { return table(['Käufer', 'Mio. €/Jahr'], REV.rows); } },
        { t: 'Förderprogramme: Höchstbetrag und Frist', w: 'Was realistisch ist und bis wann. Die Wiener Frist (31.12.) und NLnet (3.1.) liegen direkt hintereinander.', s: FUND.src,
          c: function () { return hbars(FUND.rows.map(function (r) { return [r[0], r[1], r[2], r[3]]; }), { lab: 230, cut: 36, unit: '€', extra: function (r) { return '\n' + r[2] + '\nFrist: ' + r[3]; } }); }, tb: function () { return table(['Programm', 'max. €', 'Quote/Hinweis', 'Frist'], FUND.rows); } }
      ]]
    ];
  }

  fetch('data.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (D) {
    var main = document.getElementById('main'), n = 0, html = '';
    var secs = sections(D);
    main.innerHTML = '';
    secs.forEach(function (sec) {
      var s = document.createElement('section'); s.id = sec[0];
      s.innerHTML = '<h2>' + esc(sec[1]) + '</h2><p>' + esc(sec[2]) + '</p><div class="grid"></div>';
      var g = s.querySelector('.grid');
      sec[3].forEach(function (ch) {
        n++;
        var c = document.createElement('article'); c.className = 'card'; c.id = 'g' + n;
        c.innerHTML = '<span class="no">' + n + '</span><h3>' + esc(ch.t) + '</h3><p class="why">' + esc(ch.w) + '</p>' + (ch.lg ? legend(ch.lg) : '');
        try { var sv = ch.c(); sv.setAttribute('aria-label', ch.t); c.appendChild(sv); } catch (e) { c.insertAdjacentHTML('beforeend', '<p>Grafik konnte nicht gezeichnet werden.</p>'); console.error(ch.t, e); }
        c.insertAdjacentHTML('beforeend', '<div class="src">Quelle: ' + esc(ch.s) + '</div>' + ch.tb());
        g.appendChild(c);
      });
      main.appendChild(s);
    });
  }).catch(function (e) { document.getElementById('main').innerHTML = '<p>Daten konnten nicht geladen werden.</p>'; console.error(e); });
})();
