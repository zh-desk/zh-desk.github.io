/* How a contributor's pieces ran: views over each piece's first two days, drawn over ZH's typical post. Shared by the
   contributor dashboard (/contributors/, each profile) and the author desk (/write/, Stats: a contributor's own pieces).

   Dan, Oct. 23, 2026: "a graph of contributor post performance vs. average posts ... Maybe an average line and then their
   last 5-10 articles overlaid?"; then "Can we go back more than 10 posts? Up to all posts? Maybe can have filters for # of
   posts, or past X months, or all time"; and "let Josh see this too on his own contributor page. But not vs. other
   contributors when we roll that out." So this draws one contributor's own pieces only; a comparison across contributors
   belongs on the editors' dashboard alone.

   Each piece is a thin line (its hour-by-hour counts, with the 1 to 48-hour counts after the last of them), their typical
   piece is the median at each hour once three pieces or more are drawn, and ZH's typical post (dashed) sits in the
   middle half of ZH posts. Adjust for time slot scales each piece to a typical hour and weekday (its views times ZH's
   typical two-day views over what its slot expects), the measure behind Against its time slot. The desk counts views
   hour by hour from Oct. 20, 2026: earlier pieces aren't drawn, and the chart says how many. */
(function () {
  'use strict';
  var MS = [1, 3, 6, 12, 24, 48], CURVE_MIN = 20;
  var RANGES = [['n5', 'Last 5 pieces'], ['n10', 'Last 10 pieces'], ['n25', 'Last 25 pieces'], ['d30', 'Past 30 days'], ['d90', 'Past 3 months'], ['all', 'All time']];
  var W = 640, H = 250, L = 48, R = 12, T = 10, B = 26;
  var CSS = '.perf { border: 1px solid var(--rule); border-radius: 8px; padding: 10px 12px 8px; margin: 0 0 14px; background: var(--paper); position: relative; }' +
    '.perf .phead { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 4px; }' +
    '.perf .phead h3 { margin: 0; font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); flex: 1; min-width: 200px; }' +
    '.perf select { font: inherit; font-size: .8rem; padding: 3px 6px; border: 1px solid var(--rule); border-radius: 6px; background: var(--panel); color: var(--ink); width: auto; }' +
    '.perf label.pslot { font-size: .78rem; color: var(--muted); display: inline-flex; gap: 5px; align-items: center; margin: 0; font-weight: 400; }' +
    '.perf label.pslot input { width: auto; margin: 0; }' +
    '.perf svg { display: block; width: 100%; height: auto; overflow: visible; }' +
    '.perf .pl { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-opacity: .38; stroke-linejoin: round; stroke-linecap: round; }' +
    '.perf.many .pl { stroke-opacity: .2; stroke-width: 1.25; }' +
    '.perf.few .pl { stroke-opacity: .9; stroke-width: 2.25; }' +
    '.perf .pl.on, .perf.many .pl.on { stroke-width: 2.5; stroke-opacity: 1; }' +
    '.perf.hi .pl:not(.on), .perf.hi .pmed { stroke-opacity: .12; }' +
    '.perf .pdot { fill: var(--accent); fill-opacity: .55; stroke: var(--paper); stroke-width: 2; }' +
    '.perf .pdot.on { fill-opacity: 1; }' +
    '.perf.hi .pdot:not(.on) { fill-opacity: .15; }' +
    '.perf .pmed { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }' +
    '.perf .ptyp { fill: none; stroke: var(--muted); stroke-width: 1.5; stroke-dasharray: 5 4; }' +
    '.perf .pband { fill: var(--muted); fill-opacity: .14; stroke: none; }' +
    '.perf .pxh { stroke: var(--muted); stroke-width: 1; stroke-opacity: .5; }' +
    '.perf .legend { font-size: .74rem; color: var(--muted); display: flex; gap: 14px; flex-wrap: wrap; margin-top: 2px; }' +
    '.perf .legend i { display: inline-block; width: 16px; height: 3px; vertical-align: middle; margin-right: 5px; border-radius: 2px; }' +
    '.perf .ptip { position: absolute; pointer-events: none; background: var(--panel); border: 1px solid var(--rule); border-radius: 6px; padding: 6px 9px; font-size: .78rem; box-shadow: 0 4px 14px rgba(0,0,0,.14); max-width: 300px; z-index: 2; color: var(--ink); }' +
    '.perf .ptip b { display: block; font-weight: 700; margin-bottom: 2px; }' +
    '.perf .ptip .muted { color: var(--muted); }' +
    '.perf .pnote { font-size: .76rem; color: var(--muted); margin: 4px 0 0; }' +
    '@media (max-width: 760px) { .perf svg text { font-size: 21px; } .perf .phead h3 { min-width: 0; flex-basis: 100%; } }';
  function css() {
    if (document.getElementById('perf-css')) { return; }
    var st = document.createElement('style'); st.id = 'perf-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(n) { return n == null ? '-' : Math.round(n).toLocaleString('en-US'); }
  function kf(n) { if (n == null) { return '-'; } n = Math.round(n); return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n); }
  function xf(x) { return x == null ? '-' : (x >= 10 ? Math.round(x) : x.toFixed(1)) + '×'; }
  function med(a) { a = a.filter(function (x) { return x != null; }).sort(function (x, y) { return x - y; }); return a.length ? (a[Math.floor((a.length - 1) / 2)] + a[Math.ceil((a.length - 1) / 2)]) / 2 : null; }
  function keep(k, v) { try { if (v === undefined) { return localStorage.getItem('desk.' + k); } localStorage.setItem('desk.' + k, v); } catch (e) { /* this device only */ } return null; }

  // a piece's [hours, views] in its first two days
  function pts(x, slot, base) {
    var cv = (x.curve || []).filter(function (q) { return q[0] >= 0 && q[0] <= 48.5 && q[1] != null; }).map(function (q) { return [q[0], q[1]]; });
    var last = cv.length >= 2 ? cv[cv.length - 1][0] : -1, out = cv.length >= 2 ? cv : [];
    MS.forEach(function (m) { if (x['m' + m] != null && m > last + 0.25) { out.push([m, x['m' + m]]); } });   // the 48-hour count lands just after the last snapshot
    out.sort(function (a, b) { return a[0] - b[0]; });
    if (out.length && out[0][0] <= 1.5 && out[0][0] > 0) { out.unshift([0, 0]); }   // followed from the start: it began at nothing
    var f = slot && base && base.med48 && x.exp48 ? base.med48 / x.exp48 : 1;
    return out.map(function (q) { return [q[0], q[1] * f]; });
  }
  // views at h hours, along straight lines between counts; null outside what was counted
  function at(p, h) {
    if (p.length < 2 || h < p[0][0] || h > p[p.length - 1][0]) { return null; }
    for (var i = 1; i < p.length; i++) {
      if (h <= p[i][0]) { var a = p[i - 1], b = p[i], t = b[0] > a[0] ? (h - a[0]) / (b[0] - a[0]) : 1; return a[1] + t * (b[1] - a[1]); }
    }
    return null;
  }
  // the median of a set of pieces' lines at each milestone (two pieces or more counted there)
  function curve(list) {
    return [[0, 0]].concat(MS.map(function (m) { var v = list.map(function (p) { return at(p.pts, m); }).filter(function (x) { return x != null; }); return v.length >= 2 ? [m, med(v)] : null; }).filter(Boolean));
  }
  // ZH's typical post and its middle half, at the milestones counted from enough posts
  function typical(base) {
    var cv = (base && base.curve) || {}, lo = 0, hi = 0, typ = [[0, 0]], band = [[0, 0, 0]];
    MS.forEach(function (m) {
      var q = cv[m]; if (!q || q.n < CURVE_MIN || q.p50 == null) { return; }
      typ.push([m, q.p50]); lo = Math.max(lo, q.p25); hi = Math.max(hi, q.p75, lo); band.push([m, lo, hi]);   // views only grow
    });
    return { typ: typ.length > 2 ? typ : [], band: band.length > 2 ? band : [] };
  }
  function range(o) { var r = o.range || keep('cd-perf') || 'n10'; return RANGES.some(function (x) { return x[0] === r; }) ? r : 'n10'; }
  function rangeName(r) { return RANGES.filter(function (x) { return x[0] === r; })[0][1]; }
  function data(o) {
    var r = range(o), now = Date.now() / 1000;
    var live = (o.arts || []).filter(function (a) { return a.status === 'live' && a.stats; }).sort(function (a, b) { return (b.stats.pub_ts || 0) - (a.stats.pub_ts || 0); });
    if (r.charAt(0) === 'n') { live = live.slice(0, +r.slice(1)); }
    else if (r.charAt(0) === 'd') { live = live.filter(function (a) { return (a.stats.pub_ts || 0) >= now - +r.slice(1) * 86400; }); }
    var all = live.map(function (a) { return { a: a, title: a.stats.title || (a.zh && a.zh.title) || a.title || 'Untitled', pts: pts(a.stats, o.slot, o.base) }; });
    var drawn = all.filter(function (p) { return p.pts.length >= 2; });
    // a piece from before the hour-by-hour counts: a dot at two days, from its first count after that (ZH posts add well
    // under 1% to their two-day views after day two), else its views now once it's two days old
    var dots = all.filter(function (p) { return p.pts.length < 2; }).map(function (p) {
      var x = p.a.stats, c = (x.curve || []).filter(function (q) { return q[0] >= 48 && q[0] <= 240 && q[1] != null; })[0];
      var v = x.m48 != null ? x.m48 : c ? c[1] : (x.views != null && (x.pub_ts || 0) < now - 48 * 3600 ? x.views : null);
      var f = o.slot && o.base && o.base.med48 && x.exp48 ? o.base.med48 / x.exp48 : 1;
      return v == null ? null : { a: p.a, title: p.title, v: v * f };
    }).filter(Boolean);
    return { range: r, live: live, drawn: drawn, dots: dots, med: drawn.length >= 3 ? curve(drawn) : [], zh: typical(o.base) };
  }
  function X(h) { return L + (W - L - R) * h / 48; }
  function scale(d) {   // round gridlines (10K, 20K, 25K, 50K ...) up past the highest line
    var top = 10; d.drawn.forEach(function (p) { p.pts.forEach(function (q) { top = Math.max(top, q[1]); }); }); d.dots.forEach(function (p) { top = Math.max(top, p.v); }); d.zh.band.forEach(function (q) { top = Math.max(top, q[2]); });
    var mag = Math.pow(10, Math.floor(Math.log(top / 5) / Math.LN10)), step = [1, 2, 2.5, 5, 10, 20].map(function (f) { return f * mag; }).filter(function (x) { return Math.ceil(top / x) <= 5; })[0];
    var ymax = Math.ceil(top / step) * step, ticks = []; for (var v = 0; v <= ymax + step / 2; v += step) { ticks.push(v); }
    return { ticks: ticks, Y: function (v) { return T + (H - T - B) * (1 - v / ymax); } };
  }
  // o: { arts, base, whose: "Ally's" or "your", their: "their" or "your", range, slot }
  function html(o) {
    var d = data(o), n = d.live.length, their = o.their || 'their';
    var head = '<div class="phead"><h3>How ' + esc(o.whose || 'their') + ' pieces ran: views, first two days</h3>' +
      '<select data-prange aria-label="Which pieces">' + RANGES.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === d.range ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
      '<label class="pslot" title="Each piece scaled to a typical slot: its views times ZH\'s typical two-day views over what its publish hour and weekday expect"><input type="checkbox" data-pslot' + (o.slot ? ' checked' : '') + '> Adjust for time slot</label></div>';
    if (!d.drawn.length && !d.dots.length) {
      return head + '<p class="pnote">' + (n ? 'None of the ' + n + ' live piece' + (n === 1 ? '' : 's') + ' in ' + rangeName(d.range).toLowerCase() + ' can be drawn yet: the desk counts ZeroHedge views hour by hour from Oct. 20, 2026, and ' + (n === 1 ? 'it' : 'they') + ' ran before that, or only minutes ago.' :
        'Nothing live on ZeroHedge in ' + rangeName(d.range).toLowerCase() + '.') + '</p>';
    }
    var sc = scale(d), Y = sc.Y;
    var line = function (arr) { return arr.map(function (q, i) { return (i ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join(' '); };
    var sv = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Views over the first two days: ' + d.drawn.length + ' pieces against ZH\'s typical post. The table below has every number.">';
    sc.ticks.forEach(function (v) { sv += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="var(--rule)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + kf(v) + '</text>'; });
    [0, 6, 12, 24, 36, 48].forEach(function (t) { sv += '<text x="' + X(t).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + (t ? t + 'h' : '0') + '</text>'; });
    if (d.zh.band.length) { sv += '<path class="pband" d="' + d.zh.band.map(function (q, i) { return (i ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[2]).toFixed(1); }).join(' ') + ' ' + d.zh.band.slice().reverse().map(function (q) { return 'L' + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join(' ') + ' Z"/>'; }
    if (d.zh.typ.length) { sv += '<path class="ptyp" d="' + line(d.zh.typ) + '"/>'; }
    d.drawn.forEach(function (p, k) { sv += '<path class="pl" data-k="' + k + '" data-id="' + esc(p.a.id) + '" d="' + line(p.pts) + '"/>'; });
    if (d.med.length > 2) { sv += '<path class="pmed" d="' + line(d.med) + '"/>'; }
    d.dots.forEach(function (p, k) { sv += '<circle class="pdot" data-k="d' + k + '" data-id="' + esc(p.a.id) + '" cx="' + X(48).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="4.5"/>'; });
    sv += '<line class="pxh" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '" visibility="hidden"/><rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" fill="transparent"/></svg>';
    var left = n - d.drawn.length - d.dots.length, lines = d.drawn.length, dl = d.dots.length;
    return head + sv + '<div class="legend">' + (lines ? '<span><i style="background:var(--accent);opacity:.45"></i>' + (lines === 1 ? (their === 'your' ? 'Your piece' : 'Their piece') : 'Each of ' + lines + ' pieces') + '</span>' : '') +
      (d.med.length > 2 ? '<span><i style="background:var(--accent);height:4px"></i>' + (their === 'your' ? 'Your' : 'Their') + ' typical piece</span>' : '') +
      (dl ? '<span><i style="width:9px;height:9px;border-radius:50%;background:var(--accent);opacity:.55;box-shadow:0 0 0 2px var(--paper)"></i>Earlier piece' + (dl === 1 ? '' : 's') + ': views by two days</span>' : '') +
      (d.zh.typ.length ? '<span><i style="background:repeating-linear-gradient(90deg,var(--muted) 0 5px,transparent 5px 9px)"></i>ZH\'s typical post</span>' : '') +
      (d.zh.band.length ? '<span><i style="background:var(--muted);opacity:.25;height:8px"></i>Middle half of ZH posts</span>' : '') + '</div>' +
      '<p class="pnote">' + rangeName(d.range) + ': ' + n + ' live piece' + (n === 1 ? '' : 's') + (dl ? ', ' + lines + ' as lines and ' + dl + ' as dots' : '') + '. ' +
      (o.slot ? 'Adjusted for time slot: each piece scaled as if it ran at a typical hour and weekday. ' : '') + 'Hover a line or dot, or a row in the table, for the piece.' +
      (dl ? ' The desk counts views hour by hour from Oct. 20, 2026, so earlier pieces are a dot at two days (ZH posts add well under 1% after that).' : '') +
      (left > 0 ? ' ' + left + ' too new to show.' : '') +
      (d.zh.typ.length ? '' : ' ZH\'s typical curve shows once enough posts have been followed from the minute they ran.') + '</p>';
  }
  // box: the element holding html(o); rows: table rows whose rowId(tr) is a piece's id (hovering one lights its line)
  function bind(box, o, rows, rowId) {
    css();
    var d = null, Y = null, tip = null;
    var hiOn = function (k) { box.classList.toggle('hi', k != null); box.querySelectorAll('.pl, .pdot').forEach(function (l) { l.classList.toggle('on', String(l.dataset.k) === String(k)); }); };
    var hide = function () { hiOn(null); if (tip) { tip.remove(); tip = null; } var xh = box.querySelector('.pxh'); if (xh) { xh.setAttribute('visibility', 'hidden'); } };
    var draw = function (fresh) {
      if (fresh) { box.innerHTML = html(o); tip = null; }
      d = data(o); Y = scale(d).Y;
      box.classList.toggle('many', d.drawn.length > 12); box.classList.toggle('few', d.drawn.length <= 2);   // one or two lines: full strength
      var svg = box.querySelector('svg'); if (!svg) { return; }
      svg.addEventListener('mousemove', function (ev) {
        var r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) * W / r.width, sy = (ev.clientY - r.top) * H / r.height;
        var h = Math.max(0, Math.min(48, (sx - L) * 48 / (W - L - R))), best = null;
        d.drawn.forEach(function (p, k) { var v = at(p.pts, h); if (v == null) { return; } var dy = Math.abs(Y(v) - sy); if (dy <= 26 && (!best || dy < best.dy)) { best = { k: k, p: p, v: v, dy: dy, h: h }; } });
        if (sx >= X(46)) { d.dots.forEach(function (p, k) { var dy = Math.abs(Y(p.v) - sy); if (dy <= 12 && (!best || best.dot || dy < best.dy)) { best = { k: 'd' + k, p: p, v: p.v, dy: dy, dot: true }; } }); }
        var xh = svg.querySelector('.pxh'); xh.setAttribute('x1', X(h).toFixed(1)); xh.setAttribute('x2', X(h).toFixed(1)); xh.setAttribute('visibility', 'visible');
        if (!best) { hiOn(null); if (tip) { tip.remove(); tip = null; } return; }
        hiOn(best.k);
        if (best.dot) { h = 48; }
        var typ = at(d.zh.typ, h), when = best.dot ? 'about two days (counted later)' : h < 1 ? Math.round(h * 60) + ' min' : (h < 10 ? h.toFixed(1).replace(/\.0$/, '') : Math.round(h)) + ' hr';
        if (!tip) { tip = document.createElement('div'); tip.className = 'ptip'; box.appendChild(tip); }
        tip.innerHTML = '<b>' + esc(best.p.title) + '</b>' + nf(best.v) + ' views at ' + when + (o.slot ? ' (slot-adjusted)' : '') +
          (typ ? '<br><span class="muted">ZH\'s typical post then: ' + nf(typ) + ' (this piece ' + xf(best.v / typ) + ')</span>' : '') +
          (best.p.a.stats.views != null ? '<br><span class="muted">' + nf(best.p.a.stats.views) + ' views now</span>' : '');
        var br = box.getBoundingClientRect(), x = ev.clientX - br.left + 14, y = ev.clientY - br.top + 14;
        if (x + 300 > br.width) { x = Math.max(4, ev.clientX - br.left - 314); }
        tip.style.left = x + 'px'; tip.style.top = y + 'px';
      });
      svg.addEventListener('mouseleave', hide);
    };
    draw(false);
    (rows || []).forEach(function (tr) {
      var id = rowId(tr);
      tr.addEventListener('mouseenter', function () { var k = null; d.drawn.forEach(function (p, i) { if (p.a.id === id) { k = i; } }); d.dots.forEach(function (p, i) { if (p.a.id === id) { k = 'd' + i; } }); if (k != null) { hiOn(k); } });
      tr.addEventListener('mouseleave', function () { hiOn(null); });
    });
    box.addEventListener('change', function (ev) {
      if (ev.target.matches('[data-prange]')) { o.range = ev.target.value; keep('cd-perf', o.range); draw(true); }
      else if (ev.target.matches('[data-pslot]')) { o.slot = ev.target.checked; draw(true); }
    });
  }
  css();
  window.ZHPerf = { html: html, bind: bind, data: data, curve: curve, ranges: RANGES };
})();
