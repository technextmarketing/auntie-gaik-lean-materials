/* Auntie Gaik Lean's brand guidelines, v2 interactions. No dependencies. */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var STATIC = H.classList.contains('static');
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var CALM = STATIC || RM;
  var DESK = window.matchMedia ? matchMedia('(min-width: 1024px)') : { matches: true };

  /* ---- static / reduced motion: everything visible, images eager ---- */
  if (STATIC) $$('img').forEach(function (i) { i.loading = 'eager'; });

  /* ---- scroll reveals ---- */
  var rv = $$('.rv');
  if (CALM || !('IntersectionObserver' in window)) {
    rv.forEach(function (e) { e.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); rio.unobserve(x.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (e) { rio.observe(e); });
  }

  /* ---- toast + copy ---- */
  var tEl = $('#toast'), tTm;
  function toast(m) {
    if (!tEl) return;
    tEl.textContent = m; tEl.classList.add('on');
    clearTimeout(tTm); tTm = setTimeout(function () { tEl.classList.remove('on'); }, 1900);
  }
  function legacy(t) {
    return new Promise(function (ok, no) {
      try {
        var a = D.createElement('textarea'); a.value = t; a.setAttribute('readonly', '');
        a.style.cssText = 'position:fixed;left:-9999px;top:0'; D.body.appendChild(a); a.select();
        var r = D.execCommand('copy'); a.remove(); r ? ok() : no();
      } catch (e) { no(e); }
    });
  }
  function copy(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t).catch(function () { return legacy(t); });
    }
    return legacy(t);
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      copy(v).then(function () { toast('Copied ' + v); }, function () { toast('Press Ctrl+C to copy ' + v); });
    });
  });

  /* ---- chapter index: active chapter, bar, progress ---- */
  var rail = $('#rail'), railBtn = $('#railBtn'), scrim = $('#scrim');
  var links = $$('#railList a');
  var chs = links.map(function (a) { return $(a.getAttribute('href')); });
  var barNo = $('#barNo'), barName = $('#barName'), bmNo = $('#bmNo'), prog = $('#barProg');
  var cur = -1;
  function setActive(i) {
    if (i === cur || i < 0) return;
    cur = i;
    links.forEach(function (a, k) {
      if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    var a = links[i], no = $('b', a).textContent, nm = $('span', a).textContent;
    if (barNo) barNo.textContent = no;
    if (barName) barName.textContent = nm;
    if (bmNo) bmNo.textContent = no;
    var list = $('#railList');
    if (list && DESK.matches) {
      var top = a.parentNode.offsetTop - list.clientHeight / 2 + a.offsetHeight / 2;
      list.scrollTo ? list.scrollTo({ top: top, behavior: CALM ? 'auto' : 'smooth' }) : (list.scrollTop = top);
    }
  }
  var ticking = false;
  function onScroll() {
    ticking = false;
    var probe = innerHeight * .38, idx = 0;
    for (var i = 0; i < chs.length; i++) { if (chs[i] && chs[i].getBoundingClientRect().top <= probe) idx = i; }
    setActive(idx);
    if (prog) {
      var max = H.scrollHeight - innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0).toFixed(4) + ')';
    }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---- mobile drawer ---- */
  var lastFocus = null;
  function drawerOpen() { return rail && rail.classList.contains('open'); }
  function openDrawer() {
    if (!rail || DESK.matches) return;
    lastFocus = D.activeElement;
    rail.classList.add('open'); railBtn.setAttribute('aria-expanded', 'true');
    if (scrim) scrim.hidden = false;
    H.style.overflow = 'hidden';
    rail.setAttribute('role', 'dialog'); rail.setAttribute('aria-modal', 'true');
    var f = $('[aria-current="true"]', rail) || $('a', rail);
    setTimeout(function () { if (f) f.focus(); }, 30);
  }
  function closeDrawer(back) {
    if (!rail) return;
    rail.classList.remove('open'); railBtn.setAttribute('aria-expanded', 'false');
    if (scrim) scrim.hidden = true;
    H.style.overflow = '';
    rail.removeAttribute('role'); rail.removeAttribute('aria-modal');
    if (back !== false) (lastFocus && lastFocus.focus ? lastFocus : railBtn).focus();
  }
  if (railBtn) railBtn.addEventListener('click', function () { if (drawerOpen()) closeDrawer(); else openDrawer(); });
  if (scrim) scrim.addEventListener('click', function () { closeDrawer(); });
  links.forEach(function (a) { a.addEventListener('click', function () { if (drawerOpen()) closeDrawer(false); }); });
  D.addEventListener('keydown', function (e) {
    if (!drawerOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key === 'Tab') {
      var f = $$('a,button', rail), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!rail.contains(D.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });
  if (DESK.addEventListener) DESK.addEventListener('change', function () { if (DESK.matches && drawerOpen()) closeDrawer(false); });

  /* ---- radio-chip helper ---- */
  function radios(group, cb) {
    if (!group) return;
    var bs = $$('[role="radio"]', group);
    function pick(b, focus) {
      bs.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
      if (focus) b.focus();
      cb(b);
    }
    bs.forEach(function (b, i) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = -1;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % bs.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + bs.length) % bs.length;
        if (n > -1) { e.preventDefault(); pick(bs[n], true); }
      });
    });
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---- 02 name check ---- */
  var ncIn = $('#ncIn'), ncOut = $('#ncOut');
  var NC = [
    [/\bAGL\b/, 'Never abbreviate the name.'],
    [/\bAunty\b/i, 'It is Auntie, with ie.'],
    [/\bAunt(?:ie|y)\s+Gaik\s+Leans\b/i, 'Keep the apostrophe: Auntie Gaik Lean\u2019s.'],
    [/\bGaik\s+Lean['\u2019]?s\b/i, 'Never drop Auntie from the name.', function (m, t) { return !/Aunt(?:ie|y)\s+$/i.test(t.slice(0, m.index)); }],
    [/\bOld-School\b/i, 'No hyphen: Old School Eatery.'],
    [/\bMichelin[\s-]star(?:red)?\b/i, 'Write One MICHELIN Star, MICHELIN in capitals.', function (m) { return m[0] !== 'MICHELIN Star'; }],
    [/\bMichelin\b(?![\s-][Ss]tar)/, 'MICHELIN is always in capitals.']
  ];
  function nameCheck() {
    var t = ncIn.value, out = [];
    NC.forEach(function (r) {
      var m = t.match(r[0]);
      if (m && (!r[2] || r[2](m, t))) out.push('<li><span><b>' + esc((m[0]).trim()) + '</b> &rarr; ' + esc(r[1]) + '</span></li>');
    });
    if (!t.trim()) ncOut.innerHTML = '<li class="lbl">Type to check</li>';
    else if (!out.length) ncOut.innerHTML = '<li class="ok"><span>No name slips found. Read it aloud once before it goes out.</span></li>';
    else ncOut.innerHTML = out.join('');
  }
  if (ncIn && ncOut) { ncIn.addEventListener('input', nameCheck); nameCheck(); }

  /* ---- 04 taglines ---- */
  var tl = $('#tlStage');
  if (tl) {
    var tb = $$('.tl-btn', tl), tp = $$('.tl-pics img', tl);
    var tlSet = function (i, focus) {
      tb.forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      tp.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      if (focus) tb[i].focus();
    };
    tb.forEach(function (b, i) {
      b.addEventListener('click', function () { tlSet(i); });
      b.addEventListener('keydown', function (e) {
        var n = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tb.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tb.length) % tb.length;
        if (n > -1) { e.preventDefault(); tlSet(n, true); }
      });
    });
    tlSet(0);
  }

  /* ---- 05 logo on which ground ---- */
  var lg = $('#lgSwitch'), lgStage = $('#lgsStage'), lgV = $('#lgsV');
  if (lg && lgStage) {
    radios($('[role="radiogroup"]', lg), function (b) {
      var v = b.dataset.v, w = v === 'ok' ? 'Use' : v === 'warn' ? 'Careful' : (/^Never/.test(b.dataset.t) ? 'Never' : 'Avoid');
      lgStage.setAttribute('data-g', b.dataset.g);
      lgStage.classList.toggle('l-white', b.dataset.l === 'white');
      lgV.className = 'lgs-v' + (v === 'ok' ? '' : ' ' + v);
      lgV.innerHTML = '<b>' + w + '</b> ' + esc(b.dataset.t);
    });
  }

  /* ---- 06 contrast tester ---- */
  var ptF = $('#ptF'), ptB = $('#ptB'), ptOut = $('#ptOut'), ptR = $('#ptR');
  function lum(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return 0;
    var n = parseInt(m[1], 16), ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2];
  }
  function tok(k) { return getComputedStyle(H).getPropertyValue('--' + k).trim() || '#000000'; }
  function pairTest() {
    var f = tok(ptF.value), b = tok(ptB.value), l1 = lum(f), l2 = lum(b);
    var r = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
    var g = r >= 7 ? 'AAA, any text' : r >= 4.5 ? 'AA, body text' : r >= 3 ? 'Large display text only' : 'Fails, do not use';
    ptOut.style.color = f; ptOut.style.background = b;
    ptR.textContent = r.toFixed(1) + ' : 1 \u00b7 ' + g;
  }
  if (ptF && ptB && ptOut && ptR) {
    ptF.addEventListener('change', pairTest); ptB.addEventListener('change', pairTest);
    ptF.value = 'porcelain'; ptB.value = 'cobalt'; pairTest();
  }

  /* ---- 07 type tester ---- */
  var tt = $('#tester');
  if (tt) {
    var ttT = $('#ttText'), ttO = $('#ttOut'), ttS = $('#ttSize'), ttSO = $('#ttSizeOut');
    var apply = function () { ttO.textContent = ttT.value || '\u00a0'; };
    ttT.addEventListener('input', apply);
    ttS.addEventListener('input', function () { ttO.style.fontSize = ttS.value + 'px'; ttSO.textContent = ttS.value; });
    ttO.style.fontSize = ttS.value + 'px';
    var tg = $$('[role="radiogroup"]', tt);
    var EN = 'Nyonya cooking, the old school way.', ZH = '\u5a18\u60f9\u83dc\uff0c\u8001\u6d3e\u505a\u6cd5\u3002';
    radios(tg[0], function (b) {
      ttO.setAttribute('data-f', b.dataset.f);
      var cjk = /[\u3400-\u9fff]/.test(ttT.value);
      if (b.dataset.f === 'sc' && !cjk) { ttT.value = ZH; apply(); }
      else if (b.dataset.f !== 'sc' && ttT.value === ZH) { ttT.value = EN; apply(); }
    });
    radios(tg[1], function (b) { ttO.setAttribute('data-bg', b.dataset.bg); });
  }

  /* ---- 10 motion demos ---- */
  var demos = $$('.demo');
  function play(d) {
    var v = $('video', d);
    if (v) { try { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} return; }
    d.classList.remove('run'); void d.offsetWidth; d.classList.add('run');
  }
  demos.forEach(function (d) {
    var r = $('.replay', d);
    if (r) r.addEventListener('click', function () { play(d); });
  });
  if (!CALM && 'IntersectionObserver' in window) {
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        var d = x.target, v = $('video', d);
        if (v) {
          if (x.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
        } else if (x.isIntersecting && !d.dataset.seen) { d.dataset.seen = '1'; play(d); }
      });
    }, { threshold: .45 });
    demos.forEach(function (d) { dio.observe(d); });
  }

  /* ---- 12 icons ---- */
  var icGrid = $('#icGrid'), icc = $('.ic-ctl');
  if (icGrid && icc) {
    var cg = $$('[role="radiogroup"]', icc);
    radios(cg[0], function (b) { icGrid.setAttribute('data-ic', b.dataset.ic); });
    radios(cg[1], function (b) { icGrid.setAttribute('data-sz', b.dataset.sz); });
    $$('.ic-dl', icGrid).forEach(function (a) { a.addEventListener('click', function () { toast('Downloaded ' + (a.getAttribute('download') || 'icon.svg')); }); });
  }
  function spriteSvg() {
    var body = $$('#icSprite symbol').map(function (s) { return '<symbol id="' + s.id + '" viewBox="0 0 24 24">' + s.innerHTML + '</symbol>'; }).join('');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" fill="none" stroke="#1d3f8f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><defs>' + body + '</defs></svg>';
    return svg;
  }
  function dlAll() {
    var svg = spriteSvg();
    var u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), a = D.createElement('a');
    a.href = u; a.download = 'auntiegaik-icons.svg'; D.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
    toast('Downloaded auntiegaik-icons.svg');
  }
  var sz2 = $('#icAll2 .d-size');
  if (sz2) sz2.textContent = Math.max(1, Math.round(new Blob([spriteSvg()]).size / 1024)) + ' KB';
  ['icAll', 'icAll2'].forEach(function (id) { var b = $('#' + id); if (b) b.addEventListener('click', dlAll); });

  /* ---- 16 signage mock-ups ---- */
  var mk = $('#mkToggle'), shop = $('#shop');
  if (mk && shop) mk.addEventListener('click', function () {
    var on = mk.getAttribute('aria-pressed') !== 'true';
    mk.setAttribute('aria-pressed', on ? 'true' : 'false');
    mk.textContent = on ? 'Mock-ups on' : 'Mock-ups off';
    shop.classList.toggle('off', !on);
  });

  /* ---- 17 digital: cover chooser + safe zones ---- */
  var fb = $('#fbFrame');
  if (fb) {
    var fi = $$('.fb-imgs img', fb);
    radios($('.dg-fb [role="radiogroup"]'), function (b) { var i = +b.dataset.fb; fi.forEach(function (m, k) { m.classList.toggle('on', k === i); }); });
    var sf = $('#fbSafe');
    if (sf) sf.addEventListener('change', function () { fb.classList.toggle('safe-on', sf.checked); });
  }
})();
