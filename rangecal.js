  // ===================================================================== RangeCal: the date-range picker (Oct. 26, 2026)
  // Dan, Oct. 26: "one of those nice smooth calendar views that pops up like a hotel booking site where you click the
  // first day then the last day and it highlights the stretch of days", for contributors' time off, and "please make the
  // Dan/Tim calendar just as user friendly". One source, two copies: page/v2/rangecal.js here (page/v2/build.js puts it
  // in the desk, ahead of desk.js) and /rangecal.js on the public site (the author desk and the contributor dashboard
  // load it). Change one, copy it to the other.
  //
  //     var f = RangeCal.field(host, { from, to, min, marked: [{from, to, label}], startLabel, endLabel, onChange(from, to) });
  //     f.get() -> {from, to}   f.set(from, to)   f.clear()   f.open()   f.close()
  //
  // Days are 'YYYY-MM-DD' strings in the viewer's own calendar (no time zone to shift). The field is two halves, First
  // day and Last day; either opens the calendar (two months, one on a phone). Click the first day, then the last: the
  // stretch between fills in as the pointer moves and stays highlighted. Clicking the first day twice is a one-day
  // stretch. Arrow keys move a day or a week, Enter picks, Escape closes. Colors come from the host page's own
  // variables (--rc-accent, else --accent; --rc-bg, else --panel; and so on), so it matches light and dark.
  var RangeCal = (function () {
    var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var WK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    var CSS = [
      '.rc-wrap{position:relative;display:block;max-width:460px}',
      '.rc-field{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;border:1px solid var(--rc-rule,var(--rule,#d8dde5));border-radius:12px;background:var(--rc-bg,var(--panel,#fff));overflow:hidden;transition:box-shadow .15s,border-color .15s}',
      '.rc-field.open{border-color:var(--rc-accent,var(--accent,#b4520f));box-shadow:0 0 0 3px var(--rc-ring,rgba(180,82,15,.16))}',
      '.rc-half{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:3px;padding:9px 14px 10px;cursor:pointer;min-width:0;border-radius:10px;transition:background .15s}',
      '.rc-half:hover{background:var(--rc-hover,rgba(127,127,127,.08))}',
      '.rc-half:focus-visible{outline:2px solid var(--rc-accent,var(--accent,#b4520f));outline-offset:-2px}',
      '.rc-half.act{background:var(--rc-hover,rgba(127,127,127,.1));box-shadow:inset 0 -2px 0 var(--rc-accent,var(--accent,#b4520f))}',
      '.rc-k{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--rc-muted,var(--muted,#5d6673))}',
      '.rc-v{font-size:15px;font-weight:600;color:var(--rc-ink,var(--ink,#171b22));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.rc-v.ph{color:var(--rc-muted,var(--muted,#5d6673));font-weight:400}',
      '.rc-arrow{align-self:center;color:var(--rc-muted,var(--muted,#5d6673));font-size:15px;padding:0 2px}',
      '.rc-sum{margin:6px 2px 0;font-size:13px;color:var(--rc-muted,var(--muted,#5d6673));min-height:18px;display:flex;gap:10px;align-items:center}',
      '.rc-sum b{color:var(--rc-ink,var(--ink,#171b22));font-weight:600}',
      '.rc-sum button{all:unset;cursor:pointer;color:var(--rc-accent,var(--accent,#b4520f));font-size:13px;text-decoration:underline}',
      '.rc-pop{position:fixed;z-index:2147483000;background:var(--rc-bg,var(--panel,#fff));color:var(--rc-ink,var(--ink,#171b22));border:1px solid var(--rc-rule,var(--rule,#d8dde5));border-radius:16px;box-shadow:0 18px 50px rgba(10,14,20,.22),0 3px 10px rgba(10,14,20,.08);padding:16px 18px 12px;font-size:14px;animation:rc-pop .16s cubic-bezier(.2,.8,.2,1)}',
      '@keyframes rc-pop{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:none}}',
      '.rc-nav{position:absolute;top:13px;width:32px;height:32px;border-radius:50%;border:0;background:transparent;color:var(--rc-ink,var(--ink,#171b22));font-size:18px;line-height:32px;text-align:center;cursor:pointer;padding:0;transition:background .15s}',
      '.rc-nav:hover:not(:disabled){background:var(--rc-hover,rgba(127,127,127,.12))}',
      '.rc-nav:disabled{opacity:.25;cursor:default}',
      '.rc-nav.p{left:12px}.rc-nav.n{right:12px}',
      '.rc-months{display:flex;gap:28px}',
      '.rc-months.sl{animation:rc-sl .22s cubic-bezier(.2,.8,.2,1)}.rc-months.sr{animation:rc-sr .22s cubic-bezier(.2,.8,.2,1)}',
      '@keyframes rc-sl{from{opacity:.2;transform:translateX(18px)}to{opacity:1;transform:none}}',
      '@keyframes rc-sr{from{opacity:.2;transform:translateX(-18px)}to{opacity:1;transform:none}}',
      '.rc-mon{width:280px}',
      '.rc-mh{text-align:center;font-weight:700;font-size:15px;height:32px;line-height:32px;margin-bottom:6px}',
      '.rc-wk,.rc-days{display:grid;grid-template-columns:repeat(7,40px)}',
      '.rc-wk span{text-align:center;font-size:11px;font-weight:700;color:var(--rc-muted,var(--muted,#5d6673));padding:4px 0 6px}',
      '.rc-d{all:unset;box-sizing:border-box;position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:var(--rc-ink,var(--ink,#171b22))}',
      '.rc-d i{position:relative;z-index:1;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;transition:background .12s,color .12s,box-shadow .12s}',
      '.rc-d:hover:not(.past) i{box-shadow:inset 0 0 0 1.5px var(--rc-ink,var(--ink,#171b22))}',
      '.rc-d:focus-visible i{outline:2px solid var(--rc-accent,var(--accent,#b4520f));outline-offset:1px}',
      '.rc-d.today i{font-weight:800;text-decoration:underline;text-underline-offset:3px}',
      '.rc-d.past{cursor:default;color:var(--rc-muted,var(--muted,#5d6673));opacity:.35}',
      '.rc-d::before{content:"";position:absolute;top:2px;bottom:2px;left:0;right:0;background:transparent;transition:background .12s}',
      '.rc-d.c0::before,.rc-d.f1::before{left:2px;border-top-left-radius:18px;border-bottom-left-radius:18px}',
      '.rc-d.c6::before,.rc-d.fl::before{right:2px;border-top-right-radius:18px;border-bottom-right-radius:18px}',
      '.rc-d.a::before{left:50%;border-top-left-radius:0;border-bottom-left-radius:0}',
      '.rc-d.b::before{right:50%;border-top-right-radius:0;border-bottom-right-radius:0}',
      '.rc-d.in::before,.rc-d.a.hasb::before,.rc-d.b.hasa::before{background:var(--rc-soft,rgba(180,82,15,.17))}',
      '.rc-d.pv::before,.rc-d.a.pvb::before,.rc-d.b.pva::before{background:var(--rc-soft2,rgba(180,82,15,.10))}',
      '.rc-d.a.c6::before,.rc-d.a.fl::before,.rc-d.b.c0::before,.rc-d.b.f1::before,.rc-d.a.b::before{background:transparent}',
      '.rc-d.a i,.rc-d.b i{background:var(--rc-accent,var(--accent,#b4520f));color:var(--rc-accent-ink,var(--accent-ink,#fff));font-weight:700;box-shadow:none!important}',
      '.rc-d.mk i::after{content:"";position:absolute;bottom:4px;left:50%;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:var(--rc-mark,var(--warn,#9a5b00))}',
      '.rc-foot{display:flex;align-items:center;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid var(--rc-rule,var(--rule,#d8dde5));font-size:13px}',
      '.rc-foot .t{flex:1 1 auto;color:var(--rc-muted,var(--muted,#5d6673))}.rc-foot .t b{color:var(--rc-ink,var(--ink,#171b22))}',
      '.rc-foot .lg{display:inline-flex;align-items:center;gap:5px;margin-left:10px}.rc-foot .lg i{width:6px;height:6px;border-radius:50%;background:var(--rc-mark,var(--warn,#9a5b00))}',
      '.rc-foot button{border:0;background:transparent;color:var(--rc-ink,var(--ink,#171b22));font:inherit;font-weight:600;text-decoration:underline;cursor:pointer;padding:6px 4px}',
      '.rc-foot button.done{background:var(--rc-accent,var(--accent,#b4520f));color:var(--rc-accent-ink,var(--accent-ink,#fff));text-decoration:none;border-radius:8px;padding:8px 18px}',
      '@media (max-width:640px){.rc-pop{width:calc(100vw - 16px);box-sizing:border-box;padding:14px 10px 10px;border-radius:14px}.rc-mon{width:auto}.rc-wk,.rc-days{grid-template-columns:repeat(7,minmax(36px,1fr))}.rc-d{width:auto}}'
    ].join('\n');
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function iso(y, m, d) { var t = new Date(y, m, d, 12); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); }
    function parts(s) { var p = String(s || '').split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; }
    function valid(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) { return false; } var p = parts(s); return iso(p.y, p.m, p.d) === s; }
    function add(s, n) { var p = parts(s); return iso(p.y, p.m, p.d + n); }
    function today() { var t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); }
    function date(s) { var p = parts(s); return new Date(p.y, p.m, p.d, 12); }
    function fmt(s, long) { return date(s).toLocaleDateString('en-US', long ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' }); }
    function span(a, b) { return Math.round((date(b) - date(a)) / 864e5) + 1; }
    function range(a, b) {
      if (!a) { return ''; }
      b = b || a;
      var yr = parts(b).y !== new Date().getFullYear() || parts(a).y !== parts(b).y;
      return a === b ? fmt(a, yr) : fmt(a, yr && parts(a).y !== parts(b).y) + ' – ' + fmt(b, yr);
    }
    function days(a, b) { var n = span(a, b || a); return n + (n === 1 ? ' day' : ' days'); }
    function css(doc) {
      if (doc.getElementById('rc-css')) { return; }
      var st = doc.createElement('style'); st.id = 'rc-css'; st.textContent = CSS; (doc.head || doc.documentElement).appendChild(st);
    }
    function field(host, o) {
      o = o || {};
      var doc = host.ownerDocument || document, win = doc.defaultView || window;
      css(doc);
      var st = { from: valid(o.from) ? o.from : '', to: valid(o.to) ? o.to : '', act: 'from', edit: false, hover: '', view: null, pop: null, mo: 2 };
      var min = valid(o.min) ? o.min : today(), max = valid(o.max) ? o.max : add(min, 730);
      var wrap = doc.createElement('div'); wrap.className = 'rc-wrap';
      wrap.innerHTML = '<div class="rc-field" role="group"><button type="button" class="rc-half" data-h="from"><span class="rc-k"></span><span class="rc-v"></span></button>' +
        '<span class="rc-arrow" aria-hidden="true">→</span><button type="button" class="rc-half" data-h="to"><span class="rc-k"></span><span class="rc-v"></span></button></div><div class="rc-sum" aria-live="polite"></div>';
      host.appendChild(wrap);
      var fieldEl = wrap.firstChild, halves = fieldEl.querySelectorAll('.rc-half'), sum = wrap.lastChild;
      halves[0].querySelector('.rc-k').textContent = o.startLabel || 'First day off';
      halves[1].querySelector('.rc-k').textContent = o.endLabel || 'Last day off';
      function marked() { return (typeof o.marked === 'function' ? o.marked() : o.marked) || []; }
      function markOf(d) { var m = marked().filter(function (x) { return x && x.from <= d && (x.to || x.from) >= d; })[0]; return m || null; }
      function drawField() {
        [[halves[0], st.from], [halves[1], st.to || (st.from && st.act !== 'to' ? st.from : '')]].forEach(function (x) {
          var v = x[0].querySelector('.rc-v'); v.textContent = x[1] ? fmt(x[1]) : 'Add date'; v.classList.toggle('ph', !x[1]);
        });
        halves[0].classList.toggle('act', !!st.pop && st.act === 'from'); halves[1].classList.toggle('act', !!st.pop && st.act === 'to');
        fieldEl.classList.toggle('open', !!st.pop);
        sum.innerHTML = st.from ? '<span><b>' + days(st.from, st.to) + '</b> · ' + range(st.from, st.to) + '</span><button type="button" data-rc="clear">Clear</button>' : '';
      }
      function changed() { drawField(); if (o.onChange) { o.onChange(st.from, st.to || st.from); } }
      function months() { return st.mo; }
      function startView() { var p = parts(st.from || min); return { y: p.y, m: p.m }; }
      function canPrev() { var p = parts(min); return st.view.y * 12 + st.view.m > p.y * 12 + p.m; }
      function canNext() { var p = parts(max); return (st.view.y * 12 + st.view.m) + months() - 1 < p.y * 12 + p.m; }
      function monthHtml(y, m) {
        var first = new Date(y, m, 1, 12).getDay(), n = new Date(y, m + 1, 0, 12).getDate(), h = '';
        for (var i = 0; i < first; i++) { h += '<span></span>'; }
        for (var d = 1; d <= n; d++) {
          var s = iso(y, m, d), wd = (first + d - 1) % 7;
          h += '<button type="button" class="rc-d c' + wd + (d === 1 ? ' f1' : '') + (d === n ? ' fl' : '') + '" data-d="' + s + '" tabindex="-1" aria-label="' + fmt(s, true) + '"><i>' + d + '</i></button>';
        }
        return '<div class="rc-mon"><div class="rc-mh">' + MON[m] + ' ' + y + '</div><div class="rc-wk">' + WK.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div><div class="rc-days">' + h + '</div></div>';
      }
      function build(dir) {
        var p = st.pop; if (!p) { return; }
        var ms = '';
        for (var k = 0; k < months(); k++) { var y = st.view.y + Math.floor((st.view.m + k) / 12), m = (st.view.m + k) % 12; ms += monthHtml(y, m); }
        p.querySelector('.rc-months').outerHTML = '<div class="rc-months' + (dir > 0 ? ' sl' : dir < 0 ? ' sr' : '') + '">' + ms + '</div>';
        p.querySelector('.rc-nav.p').disabled = !canPrev(); p.querySelector('.rc-nav.n').disabled = !canNext();
        paint();
      }
      function paint() {
        var p = st.pop; if (!p) { return; }
        var a = st.from, b = st.to, hv = !b && a && st.hover && st.hover >= a ? st.hover : '', t = today();
        Array.prototype.forEach.call(p.querySelectorAll('.rc-d'), function (el) {
          var d = el.getAttribute('data-d'), off = d < min || d > max, mk = markOf(d);
          el.classList.toggle('past', off); el.disabled = off;
          el.classList.toggle('today', d === t);
          el.classList.toggle('a', !!a && d === a);
          el.classList.toggle('b', !!a && (d === b || (!b && d === hv)));
          el.classList.toggle('hasb', !!b && b > a); el.classList.toggle('pvb', !b && !!hv && hv > a);
          el.classList.toggle('hasa', !!b && b > a); el.classList.toggle('pva', !b && !!hv && hv > a);
          el.classList.toggle('in', !!a && !!b && d > a && d < b);
          el.classList.toggle('pv', !!a && !b && !!hv && d > a && d < hv);
          el.classList.toggle('mk', !!mk);
          el.title = mk ? (mk.label || 'Already marked') : '';
          el.setAttribute('aria-pressed', String(d === a || d === b));
        });
        var ft = p.querySelector('.rc-foot .t');
        ft.innerHTML = a ? (b ? '<b>' + days(a, b) + '</b> · ' + range(a, b) : 'Now pick the <b>' + esc(o.endLabel || 'last day off').toLowerCase() + '</b>' + (hv && hv !== a ? ' · ' + days(a, hv) : '')) :
          'Pick the <b>' + esc(o.startLabel || 'first day off').toLowerCase() + '</b>';
        if (marked().length) { ft.innerHTML += '<span class="lg"><i></i>already marked</span>'; }
        p.querySelector('[data-rc="clear"]').hidden = !a;
      }
      function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
      function place() {
        var p = st.pop; if (!p) { return; }
        var r = fieldEl.getBoundingClientRect(), vw = doc.documentElement.clientWidth, vh = win.innerHeight, w = p.offsetWidth, h = p.offsetHeight;
        var left = Math.max(8, Math.min(r.left, vw - w - 8)), top = r.bottom + 8;
        if (top + h > vh - 8 && r.top - h - 8 >= 8) { top = r.top - h - 8; }
        else if (top + h > vh - 8) { top = Math.max(8, vh - h - 8); }
        p.style.left = left + 'px'; p.style.top = top + 'px';
      }
      function focusDay(d) {
        var p = st.pop; if (!p) { return; }
        var el = p.querySelector('.rc-d[data-d="' + d + '"]');
        if (!el) {
          var pp = parts(d), at = pp.y * 12 + pp.m, cur = st.view.y * 12 + st.view.m, ni = at < cur ? at : at - months() + 1;
          st.view = { y: Math.floor(ni / 12), m: ni % 12 }; build(at < cur ? -1 : 1); place(); el = p.querySelector('.rc-d[data-d="' + d + '"]');
        }
        Array.prototype.forEach.call(p.querySelectorAll('.rc-d[tabindex="0"]'), function (x) { x.tabIndex = -1; });
        if (el) { el.tabIndex = 0; el.focus(); st.focus = d; }
      }
      // Click the first day, then the last. A click after a finished stretch starts a new one, unless the First day half
      // was chosen to move the start (then a day up to the last day moves it and keeps the stretch).
      function pick(d) {
        if (d < min || d > max) { return; }
        if (st.act === 'to' && st.from && d >= st.from) { st.to = d; st.act = 'from'; st.hover = ''; }
        else if (st.act === 'from' && st.edit && st.to && d <= st.to) { st.from = d; }
        else { st.from = d; st.to = ''; st.act = 'to'; }
        st.edit = false;
        paint(); changed();
      }
      function onDoc(ev) {
        if (!st.pop) { return; }
        if (st.pop.contains(ev.target) || wrap.contains(ev.target)) { return; }
        close();
      }
      function onKey(ev) {
        if (!st.pop) { return; }
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); halves[st.act === 'to' ? 1 : 0].focus(); return; }
        if (!st.pop.contains(ev.target)) { return; }
        ev.stopPropagation();   // keys pressed in the calendar are the calendar's: none reach the page's own shortcuts (the desk's A approves)
        var el = ev.target.closest && ev.target.closest('.rc-d'); if (!el) { return; }
        var mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[ev.key];
        if (mv) { ev.preventDefault(); var nd = add(el.getAttribute('data-d'), mv); if (nd >= min && nd <= max) { focusDay(nd); st.hover = nd; paint(); } }
      }
      function open(which) {
        if (which) { st.act = which === 'to' && st.from ? 'to' : 'from'; st.edit = true; }
        if (st.pop) { drawField(); paint(); return; }
        st.mo = doc.documentElement.clientWidth < 660 ? 1 : 2;
        st.view = startView();
        var p = doc.createElement('div'); p.className = 'rc-pop'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Pick the days');
        p.innerHTML = '<button type="button" class="rc-nav p" aria-label="Earlier month">‹</button><button type="button" class="rc-nav n" aria-label="Later month">›</button>' +
          '<div class="rc-months"></div><div class="rc-foot"><span class="t"></span><button type="button" data-rc="clear">Clear dates</button><button type="button" class="done" data-rc="done">Done</button></div>';
        doc.body.appendChild(p); st.pop = p;
        p.addEventListener('click', function (ev) {
          var t = ev.target.closest('button'); if (!t) { return; }
          if (t.classList.contains('rc-d')) { pick(t.getAttribute('data-d')); st.focus = t.getAttribute('data-d'); return; }
          if (t.classList.contains('p') && canPrev()) { st.view = { y: st.view.y - (st.view.m === 0 ? 1 : 0), m: (st.view.m + 11) % 12 }; build(-1); place(); return; }
          if (t.classList.contains('n') && canNext()) { st.view = { y: st.view.y + (st.view.m === 11 ? 1 : 0), m: (st.view.m + 1) % 12 }; build(1); place(); return; }
          if (t.getAttribute('data-rc') === 'clear') { st.from = ''; st.to = ''; st.act = 'from'; st.hover = ''; paint(); changed(); return; }
          if (t.getAttribute('data-rc') === 'done') { if (st.from && !st.to) { st.to = st.from; changed(); } close(); }
        });
        p.addEventListener('mouseover', function (ev) { var t = ev.target.closest('.rc-d'); var d = t && !t.disabled ? t.getAttribute('data-d') : ''; if (d !== st.hover) { st.hover = d; paint(); } });
        p.addEventListener('mouseleave', function () { if (st.hover) { st.hover = ''; paint(); } });
        build(0); place(); drawField();
        var fr = fieldEl.getBoundingClientRect(), vh0 = win.innerHeight, ph = p.offsetHeight;
        if (fr.bottom + ph + 8 > vh0 && fr.top - ph - 8 < 0 && fieldEl.scrollIntoView) { try { fieldEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { fieldEl.scrollIntoView(true); } }
        var f = p.querySelector('.rc-d[data-d="' + (st.from || (today() >= min ? today() : min)) + '"]') || p.querySelector('.rc-d:not(:disabled)');
        if (f) { f.tabIndex = 0; st.focus = f.getAttribute('data-d'); }
        setTimeout(function () { doc.addEventListener('mousedown', onDoc, true); doc.addEventListener('touchstart', onDoc, true); }, 0);
        doc.addEventListener('keydown', onKey, true);
        win.addEventListener('resize', place); win.addEventListener('scroll', place, true);
      }
      function close() {
        if (!st.pop) { return; }
        if (st.from && !st.to) { st.to = st.from; changed(); }
        st.pop.remove(); st.pop = null; st.hover = '';
        doc.removeEventListener('mousedown', onDoc, true); doc.removeEventListener('touchstart', onDoc, true); doc.removeEventListener('keydown', onKey, true);
        win.removeEventListener('resize', place); win.removeEventListener('scroll', place, true);
        drawField();
        if (o.onClose) { o.onClose(st.from, st.to); }
      }
      fieldEl.addEventListener('click', function (ev) { var h = ev.target.closest('.rc-half'); if (h) { if (st.pop && st.act === h.getAttribute('data-h')) { close(); } else { open(h.getAttribute('data-h')); } } });
      sum.addEventListener('click', function (ev) { if (ev.target.closest('[data-rc="clear"]')) { st.from = ''; st.to = ''; st.act = 'from'; close(); changed(); } });
      drawField();
      return {
        el: wrap,
        get: function () { return { from: st.from, to: st.to || st.from }; },
        set: function (a, b) { st.from = valid(a) ? a : ''; st.to = st.from && valid(b) && b >= st.from ? b : ''; st.act = 'from'; drawField(); paint(); },
        clear: function () { st.from = ''; st.to = ''; st.act = 'from'; drawField(); paint(); },
        open: function () { open(st.from ? 'to' : 'from'); },
        close: close,
        refresh: function () { drawField(); paint(); },
        destroy: function () { close(); wrap.remove(); }
      };
    }
    return { field: field, valid: valid, add: add, today: today, fmt: fmt, range: range, days: days, span: span };
  })();
  try { if (typeof window !== 'undefined' && !window.RangeCal) { window.RangeCal = RangeCal; } } catch (e) { /* the desk keeps its own */ }
