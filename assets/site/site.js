/* Auntie Gaik Lean's Old School Eatery - homepage v3 "Open the blue doors".
   Everything is in its finished state in the HTML/CSS; this file adds behaviour and motion on top.
   ?static=1 and prefers-reduced-motion: no intro, no Lenis, no pinning, no scroll-linked motion.
   Smoothness rules: transforms/opacity only, offsets cached (no layout reads in the scroll loop),
   will-change only while a pinned scene is active, videos paused off-screen. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window;
  W.AG_READY = true;
  var q = function (s, c) { return (c || d).querySelector(s); };
  var qa = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var STATIC = root.classList.contains('static');
  var SHOT = root.classList.contains('shot');
  var REDUCE = false;
  try { REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var G = W.gsap, ST = W.ScrollTrigger, SPLIT = W.SplitText, FLIP = W.Flip;
  var MOTION = !STATIC && !!(G && ST);
  var FINE = false;
  try { FINE = matchMedia('(pointer: fine)').matches; } catch (e) {}
  if (!MOTION) root.classList.remove('motion', 'intro-on');
  if (G) G.registerPlugin.apply(G, [ST, SPLIT, FLIP].filter(Boolean));
  if (SHOT) {
    qa('img[loading=lazy]').forEach(function (i) { i.loading = 'eager'; });
    root.style.setProperty('--vu', (W.innerHeight / 100) + 'px');
  }
  function onLoad(fn) { if (d.readyState === 'complete') setTimeout(fn, 0); else W.addEventListener('load', fn); }

  /* ---------------- live open status (Asia/Kuala_Lumpur) ---------------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var OPEN = { 0: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
  var L0 = 720, L1 = 870, D0 = 1080, D1 = 1290; // 12:00 14:30 18:00 21:30
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var fmt = null;
  try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch (e) {}
  function myt(date) {
    if (fmt) {
      var p = {};
      fmt.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
      return { dow: WD[p.weekday], min: (+p.hour % 24) * 60 + +p.minute };
    }
    var u = new Date(date.getTime() + 8 * 3600e3); // MYT is UTC+8, no DST
    return { dow: u.getUTCDay(), min: u.getUTCHours() * 60 + u.getUTCMinutes() };
  }
  function nextOpen(dow) {
    for (var k = 1; k <= 7; k++) { var n = (dow + k) % 7; if (OPEN[n]) return k === 1 ? 'tomorrow' : DAYS[n]; }
  }
  function status(date) {
    var t = myt(date || new Date()), w = t.dow, m = t.min;
    if (!OPEN[w]) return { s: 'closed', dow: w, text: 'Closed today · opens ' + nextOpen(w) + ' 12pm' };
    if (m < L0) return { s: 'soon', dow: w, text: 'Opens at 12pm today' };
    if (m < L1) return { s: 'open', dow: w, text: 'Open now · lunch until 2.30pm' };
    if (m < D0) return { s: 'soon', dow: w, text: 'Opens at 6pm today' };
    if (m < D1) return { s: 'open', dow: w, text: 'Open now · dinner until 9.30pm' };
    return { s: 'closed', dow: w, text: 'Closed now · opens ' + nextOpen(w) + ' 12pm' };
  }
  W.agStatus = function (date) { return status(date).text; };
  function paintStatus() {
    var st = status(new Date());
    qa('[data-status]').forEach(function (el) {
      el.setAttribute('data-state', st.s);
      var t = q('.pill-txt', el); if (t) t.textContent = st.text;
    });
    qa('.hours tr').forEach(function (tr) {
      var on = +tr.getAttribute('data-day') === st.dow, th = q('th', tr), tag = q('.today-tag', th);
      tr.classList.toggle('today', on);
      if (on && !tag) { tag = d.createElement('span'); tag.className = 'today-tag'; tag.textContent = 'Today'; th.appendChild(tag); }
      else if (!on && tag) tag.parentNode.removeChild(tag);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------------- Peranakan tile fields (SVG, strokes draw with dashoffset) ---------------- */
  var TILE = [
    'M0 26A26 26 0 0 0 26 0M94 0A26 26 0 0 0 120 26M120 94A26 26 0 0 0 94 120M26 120A26 26 0 0 0 0 94',
    'M0 14A14 14 0 0 0 14 0M106 0A14 14 0 0 0 120 14M120 106A14 14 0 0 0 106 120M14 120A14 14 0 0 0 0 106',
    'M60 30C72 30 76 44 66 52C74 44 90 48 90 60C90 72 74 76 66 68C76 76 72 90 60 90C48 90 44 76 54 68C46 76 30 72 30 60C30 48 46 44 54 52C44 44 48 30 60 30Z',
    'M67 60A7 7 0 1 1 53 60A7 7 0 1 1 67 60Z',
    'M60 4L64 14L60 22L56 14ZM116 60L106 64L98 60L106 56ZM60 116L56 106L60 98L64 106ZM4 60L14 56L22 60L14 64Z'
  ];
  var tid = 0;
  function tileField(svg) {
    if (!svg) return { uses: [], dist: [] };
    var size = +svg.getAttribute('data-tile') || 120, k = size / 120, id = 'agt' + (++tid);
    var r = svg.getBoundingClientRect(), w = Math.max(240, Math.round(r.width)), h = Math.max(240, Math.round(r.height));
    var x0 = w / 2 - size / 2, y0 = h / 2 - size / 2;
    x0 -= Math.ceil(x0 / size) * size; y0 -= Math.ceil(y0 / size) * size;
    var html = '<defs><g id="' + id + '" transform="scale(' + k + ')">' +
      TILE.map(function (p) { return '<path d="' + p + '" pathLength="1"/>'; }).join('') + '</g></defs>';
    var dist = [], cx = w / 2, cy = h / 2, max = Math.hypot(w / 2, h / 2) || 1;
    for (var y = y0; y < h; y += size) for (var x = x0; x < w; x += size) {
      html += '<use href="#' + id + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"/>';
      dist.push(Math.hypot(x + size / 2 - cx, y + size / 2 - cy) / max);
    }
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.stroke = svg.getAttribute('data-stroke') || '#c9a14a';
    svg.innerHTML = html;
    return { uses: qa('use', svg), dist: dist };
  }
  function drawTiles(f, dur, delay, spread) {
    if (!f.uses.length || !G) return null;
    G.set(f.uses, { strokeDasharray: 1, strokeDashoffset: 1 });
    return G.to(f.uses, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut', delay: delay || 0,
      stagger: function (i) { return f.dist[i] * spread; } });
  }

  /* ---------------- Lenis (tuned: lerp .09, driven by the GSAP ticker) ---------------- */
  var lenis = null;
  if (MOTION && W.Lenis) {
    lenis = new W.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, autoRaf: false });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  if (ST) ST.config({ ignoreMobileResize: true });
  W.agLenis = lenis;

  /* ---------------- header, anchors, tingkat progress (offsets cached) ---------------- */
  var hdr = q('#hdr'), heroEl = q('#top'), abar = q('#abar');
  function outer(el) { var p = el.parentElement; return p && p.classList.contains('pin-spacer') ? p : el; }
  function docTop(el) { return outer(el).getBoundingClientRect().top + W.pageYOffset; }
  function scrollToEl(t) {
    var y = t === heroEl ? 0 : docTop(t);
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else W.scrollTo({ top: y, behavior: STATIC ? 'auto' : 'smooth' });
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var t = d.getElementById(id.slice(1));
    if (!t) return;
    e.preventDefault();
    scrollToEl(t);
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });

  var tiers = qa('.tk-t').map(function (t) {
    var ids = t.getAttribute('data-for').split(' ');
    return { el: t, a: d.getElementById(ids[0]), b: d.getElementById(ids[ids.length - 1]),
      nav: q('.nav a[href="#' + ids[0] + '"]'), top: 0, bot: 1, p: -1 };
  });
  var navExtra = qa('.nav a[href^="#"]').filter(function (a) { return !tiers.some(function (t) { return t.nav === a; }); }).map(function (a) {
    var el = d.getElementById(a.getAttribute('href').slice(1));
    return { a: a, el: el, top: 0, bot: 1 };
  });
  var OFF = { star: 0, abarFrom: 0, abarTo: 1e9, max: 1, hdrH: 76 };
  function cacheOffsets() {
    var sy = W.pageYOffset;
    tiers.forEach(function (t) {
      t.top = outer(t.a).getBoundingClientRect().top + sy;
      var ob = outer(t.b);
      t.bot = ob.getBoundingClientRect().top + sy + ob.offsetHeight;
    });
    navExtra.forEach(function (n) { if (!n.el) return; var o = outer(n.el); n.top = o.getBoundingClientRect().top + sy; n.bot = n.top + o.offsetHeight; });
    OFF.star = docTop(q('#star'));
    OFF.hdrH = hdr.offsetHeight;
    OFF.abarFrom = docTop(heroEl) + outer(heroEl).offsetHeight * 0.7;
    OFF.abarTo = docTop(q('#reserve'));
    OFF.max = root.scrollHeight - W.innerHeight;
    paintProgress();
  }
  var barEl = q('.bar span'), ticking = false, lastSolid = null, lastAb = null;
  function paintProgress() {
    ticking = false;
    var y = W.pageYOffset, vh = W.innerHeight, line = y + vh * 0.55;
    var solid = y + OFF.hdrH + 1 >= OFF.star && !root.classList.contains('menu-on');
    if (solid !== lastSolid) { hdr.classList.toggle('solid', solid); lastSolid = solid; }
    tiers.forEach(function (t) {
      var p = clamp((line - t.top) / Math.max(1, t.bot - t.top), 0, 1);
      if (Math.abs(p - t.p) < 0.002) return;
      t.p = p;
      t.el.style.setProperty('--p', p.toFixed(3));
      var on = p > 0 && p < 1;
      t.el.classList.toggle('on', on);
      if (on) t.el.setAttribute('aria-current', 'true'); else t.el.removeAttribute('aria-current');
      if (t.nav) t.nav.classList.toggle('on', on);
    });
    navExtra.forEach(function (n) { n.a.classList.toggle('on', line > n.top && line < n.bot); });
    if (barEl) barEl.style.transform = 'scaleX(' + (OFF.max > 0 ? clamp(y / OFF.max, 0, 1) : 0).toFixed(4) + ')';
    var ab = y > OFF.abarFrom && y + vh < OFF.abarTo + vh * 0.35;
    if (ab !== lastAb && abar) { abar.classList.toggle('on', ab); lastAb = ab; }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paintProgress); } }
  W.addEventListener('scroll', onScroll, { passive: true });
  var rzT = 0;
  W.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(cacheOffsets, 120); });
  cacheOffsets();
  onLoad(cacheOffsets);

  /* ---------------- mobile menu ---------------- */
  var menu = q('#menu'), mBtn = q('#menuBtn'), menuTiles = null;
  function setMenu(open) {
    if (open === !menu.hidden) return;
    mBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      menu.hidden = false;
      root.classList.add('menu-on');
      hdr.classList.add('menu-open');
      hdr.classList.remove('solid'); lastSolid = null;
      if (lenis) lenis.stop();
      if (!menuTiles) menuTiles = tileField(q('.menu-tiles'));
      if (MOTION) {
        drawTiles(menuTiles, 0.9, 0, 0.5);
        G.fromTo(qa('.menu-nav a'), { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.08 });
        G.fromTo('.menu-foot', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.35 });
      }
      setTimeout(function () { var a = q('.menu-nav a'); if (a) a.focus({ preventScroll: true }); }, 60);
    } else {
      menu.hidden = true;
      root.classList.remove('menu-on');
      hdr.classList.remove('menu-open');
      if (lenis) lenis.start();
      lastSolid = null; paintProgress();
    }
  }
  mBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  menu.addEventListener('keydown', function (e) { if (e.key === 'Tab') trap(e, [mBtn].concat(qa('a,button', menu))); });
  mBtn.addEventListener('keydown', function (e) { if (e.key === 'Tab' && !menu.hidden) trap(e, [mBtn].concat(qa('a,button', menu))); });
  W.addEventListener('resize', function () { if (W.innerWidth >= 1024 && !menu.hidden) setMenu(false); });
  function trap(e, list) {
    list = list.filter(function (el) { return !el.disabled && el.getClientRects().length; });
    if (!list.length) return;
    e.preventDefault();
    var i = list.indexOf(d.activeElement), n = list.length;
    list[i < 0 ? 0 : (i + (e.shiftKey ? n - 1 : 1)) % n].focus();
  }

  /* ---------------- hero film: 1920 clips in a framed window, crossfading loop ---------------- */
  var CL = W.AG_CLIPS || ['menu-4'];
  var hv = qa('.hv'), cur = 0, prepped = false, fading = false, heroVis = true, filmOn = false;
  var userPaused = REDUCE, filmBtn = q('#filmBtn'), hw = q('.hw'), hwFilm = q('.hw-film');
  var progI = q('.hw-prog i'), countB = q('.hw-count b');
  var hold = MOTION && root.classList.contains('intro-on'); // film waits behind the doors
  var HI = false; // 1920 files for large windows, 1280 clips for phones/tablets
  function srcOf(i) { return HI ? 'assets/video/hero-' + CL[i] + '.mp4' : 'assets/video/clips/' + CL[i] + '.mp4'; }
  function playV(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function setClip(v, i) {
    v.classList.remove('ready');
    v.setAttribute('data-i', i);
    v.src = srcOf(i);
  }
  function swap() {
    var a = hv[cur], b = hv[1 - cur];
    if (!b.getAttribute('src')) { a.currentTime = 0; playV(a); return; }
    fading = true;
    b.currentTime = 0; playV(b);
    b.classList.add('is-on', 'top'); a.classList.remove('top');
    cur = 1 - cur;
    if (countB) countB.textContent = pad(+b.getAttribute('data-i') + 1);
    setTimeout(function () { a.pause(); a.classList.remove('is-on'); fading = false; prepped = false; }, 1300);
  }
  function syncFilm() {
    var v = hv[cur];
    if (filmOn) { if (userPaused || hold || !heroVis) v.pause(); else playV(v); }
    filmBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    q('.fb-t', filmBtn).textContent = userPaused ? 'Play film' : 'Pause film';
    hw.setAttribute('data-cursor', userPaused ? 'Play' : 'Pause');
  }
  function startFilm() {
    if (filmOn) return;
    filmOn = true;
    HI = hwFilm.getBoundingClientRect().width * (W.devicePixelRatio || 1) > 1000;
    hv[0].preload = 'auto';
    setClip(hv[0], 0);
    hv[0].classList.add('top');
    syncFilm();
  }
  if (!SHOT) {
    hv.forEach(function (v) {
      v.addEventListener('loadeddata', function () { v.classList.add('ready'); });
      v.addEventListener('timeupdate', function () {
        if (v !== hv[cur] || !v.duration) return;
        if (progI) progI.style.transform = 'scaleX(' + (v.currentTime / v.duration).toFixed(3) + ')';
        if (!prepped && v.currentTime > v.duration - 2.6) {
          prepped = true;
          var o = hv[1 - cur];
          o.preload = 'auto';
          setClip(o, (+v.getAttribute('data-i') + 1) % CL.length);
          o.load();
        }
        if (!fading && v.currentTime > v.duration - 1.05) swap();
      });
      v.addEventListener('ended', function () { if (v === hv[cur] && !fading) swap(); });
    });
    filmBtn.addEventListener('click', function () { userPaused = !userPaused; syncFilm(); });
    hw.addEventListener('click', function () { userPaused = !userPaused; syncFilm(); });
    if ('IntersectionObserver' in W) {
      new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; syncFilm(); }, { threshold: 0.02 }).observe(hw);
    }
    onLoad(startFilm); // poster + page first, then the film
    syncFilm();
  }

  /* ---------------- room film: all-intra scrub file on desktop, plain loop on phones ---------------- */
  var rv = q('.rm-v'), roomScrub = false, vt = 0, seeking = false;
  function loadRoom() {
    if (SHOT || STATIC || rv.getAttribute('src')) return;
    if (roomScrub) { rv.preload = 'auto'; rv.src = 'assets/video/scrub-room.mp4'; }
    else { rv.loop = true; rv.preload = 'auto'; rv.src = 'assets/video/clips/gen-10.mp4'; }
    rv.load();
  }
  function seek() { if (!rv.duration) return; seeking = true; rv.currentTime = vt; }
  function scrubTo(p) {
    vt = p * ((rv.duration || 5.04) - 0.05);
    if (!seeking) seek();
  }
  rv.addEventListener('seeked', function () { seeking = false; if (Math.abs(rv.currentTime - vt) > 0.03) seek(); });
  rv.addEventListener('loadedmetadata', function () { if (roomScrub) seek(); });
  if ('IntersectionObserver' in W && !SHOT && !STATIC) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) loadRoom();
    }, { rootMargin: '150% 0px' }).observe(q('#room'));
    new IntersectionObserver(function (es) {
      if (roomScrub) return;
      if (es[0].isIntersecting && !REDUCE) playV(rv); else rv.pause();
    }, { threshold: 0.1 }).observe(rv);
  }

  /* ---------------- plate rail (drag + wheel + keys, inertia, snap) ---------------- */
  var rail = (function () {
    var vp = q('#rail'), tr = q('.rail-track', vp), btns = qa('.card-btn', tr), thumb = q('.rail-prog span');
    var bp = q('#railPrev'), bn = q('#railNext');
    var x = 0, min = 0, offs = [], pw = 0, down = false, dragging = false, sx = 0, x0 = 0, samples = [], justDragged = false, tween = null, wt = 0;
    var api = { dragging: false };
    function padL() { return parseFloat(getComputedStyle(tr).paddingLeft) || 0; }
    function render() {
      tr.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      var p = min ? clamp(x / min, 0, 1) : 0;
      thumb.style.transform = 'translate3d(' + ((pw - thumb.offsetWidth) * p).toFixed(1) + 'px,0,0)';
      bp.disabled = x >= -1;
      bn.disabled = x <= min + 1;
    }
    function measure() {
      var vw = vp.clientWidth, sw = tr.scrollWidth, pl = padL();
      min = Math.min(0, vw - sw);
      offs = btns.map(function (b) { return clamp(-(b.parentElement.offsetLeft - pl), min, 0); });
      pw = thumb.parentElement.clientWidth;
      thumb.style.width = Math.max(40, pw * Math.min(1, vw / sw)).toFixed(1) + 'px';
      x = clamp(x, min, 0);
      render();
    }
    function wc(on) { tr.style.willChange = on ? 'transform' : ''; }
    function to(nx, dur) {
      nx = clamp(nx, min, 0);
      if (tween) tween.kill();
      if (G && dur !== 0 && !REDUCE) {
        var o = { v: x };
        wc(true);
        tween = G.to(o, { v: nx, duration: dur == null ? 0.9 : dur, ease: 'power3.out', onUpdate: function () { x = o.v; render(); }, onComplete: function () { wc(false); } });
      } else { x = nx; render(); }
    }
    function nearest(nx) {
      var bi = 0, bd = 1e9;
      offs.forEach(function (o, i) { var dd = Math.abs(o - nx); if (dd < bd) { bd = dd; bi = i; } });
      return bi;
    }
    function show(i, instant) {
      var c = btns[i].parentElement, vw = vp.clientWidth, pl = padL();
      var left = c.offsetLeft + x, right = left + c.offsetWidth;
      if (left < pl - 1 || right > vw - 24) to(offs[i], instant ? 0 : 0.8);
    }
    function focusCard(i) {
      i = clamp(i, 0, btns.length - 1);
      btns.forEach(function (b, k) { b.tabIndex = k === i ? 0 : -1; });
      btns[i].focus({ preventScroll: true });
      show(i);
    }
    vp.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      down = true; dragging = false; justDragged = false; sx = e.clientX; x0 = x;
      samples = [[performance.now(), x]];
      if (tween) tween.kill();
    });
    vp.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = api.dragging = true;
        if (tween) tween.kill();
        vp.classList.add('drag'); wc(true);
        try { vp.setPointerCapture(e.pointerId); } catch (er) {}
      }
      if (!dragging) return;
      var nx = x0 + dx;
      if (nx > 0) nx *= 0.35;
      if (nx < min) nx = min + (nx - min) * 0.35;
      x = nx; render();
      samples.push([performance.now(), x]);
      if (samples.length > 6) samples.shift();
    });
    function up() {
      if (!down) return;
      down = false;
      if (!dragging) return;
      dragging = api.dragging = false;
      vp.classList.remove('drag');
      justDragged = true;
      var a = samples[0], b = samples[samples.length - 1], v = (b[1] - a[1]) / Math.max(16, b[0] - a[0]);
      to(offs[nearest(x + v * 280)], 1);
    }
    vp.addEventListener('pointerup', up);
    vp.addEventListener('pointercancel', up);
    vp.addEventListener('click', function (e) { if (justDragged) { e.preventDefault(); e.stopPropagation(); justDragged = false; } }, true);
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });
    vp.addEventListener('wheel', function (e) {
      var dx = e.deltaX;
      if (e.shiftKey && !dx) dx = e.deltaY;
      if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return;
      if ((dx < 0 && x >= 0) || (dx > 0 && x <= min)) return;
      e.preventDefault(); e.stopPropagation();
      if (tween) tween.kill();
      x = clamp(x - dx, min, 0); render();
      clearTimeout(wt);
      wt = setTimeout(function () { to(offs[nearest(x)], 0.6); }, 160);
    }, { passive: false });
    btns.forEach(function (b, i) {
      b.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); focusCard(i + 1); }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); focusCard(i - 1); }
        else if (k === 'Home') { e.preventDefault(); focusCard(0); }
        else if (k === 'End') { e.preventDefault(); focusCard(btns.length - 1); }
      });
      b.addEventListener('focus', function () {
        btns.forEach(function (o, k) { o.tabIndex = k === i ? 0 : -1; });
        var kb = true; try { kb = b.matches(':focus-visible'); } catch (e) {}
        if (kb && !down) show(i);
      });
    });
    bp.addEventListener('click', function () { to(offs[Math.max(0, nearest(x) - 1)]); });
    bn.addEventListener('click', function () {
      var i = nearest(x);
      while (i < offs.length - 1 && offs[i] >= x - 2) i++;
      to(offs[i]);
    });
    W.addEventListener('resize', measure);
    onLoad(measure);
    measure();
    api.measure = measure; api.show = show; api.btns = btns;
    api.setCurrent = function (i) { btns.forEach(function (b, k) { b.tabIndex = k === i ? 0 : -1; }); };
    return api;
  })();

  /* ---------------- photo viewer (GSAP Flip): dishes, room, kitchen ---------------- */
  var sheet = q('#sheet'), sPh = q('.sheet-ph', sheet), sImg = q('img', sPh), sBg = q('.sheet-bg', sheet);
  var sName = q('.sheet-name', sheet), sKind = q('.sheet-kind', sheet), sSub = q('.sheet-sub', sheet), sCount = q('.sheet-count', sheet);
  var sClose = q('.sheet-close', sheet), sPrev = q('.sheet-prev', sheet), sNext = q('.sheet-next', sheet);
  var groups = { dish: qa('.card-btn'), room: qa('.g-btn'), kitchen: qa('.ki-btn') }, open = null;
  function sheetBits() { return qa('.sheet-txt > *, .sheet-ui, .sheet-close', sheet); }
  function phOf(b) { return q('.card-ph, .g-ph, .ki-ph', b); }
  function fill(g, i) {
    var b = groups[g][i], im = q('img', b), want = b.getAttribute('data-lg');
    sheet.classList.toggle('is-room', g !== 'dish');
    sheet.classList.toggle('is-tall', g === 'kitchen');
    sImg.src = im.currentSrc || im.src;
    sImg.alt = im.alt;
    var big = new Image();
    big.onload = function () { if (open && open.g === g && open.i === i) sImg.src = want; };
    big.src = want;
    sKind.textContent = b.getAttribute('data-kind');
    sName.textContent = b.getAttribute('data-name');
    sSub.textContent = b.getAttribute('data-sub') || '';
    sCount.textContent = pad(i + 1) + ' / ' + pad(groups[g].length);
  }
  function openSheet(g, i) {
    var b = groups[g][i], src = phOf(b), state = null;
    open = { g: g, i: i };
    fill(g, i);
    if (MOTION && FLIP) {
      var ci = q('.card-in', b); if (ci) G.set(ci, { rotationX: 0, rotationY: 0 });
      src.setAttribute('data-flip-id', 'ph'); sPh.setAttribute('data-flip-id', 'ph');
      state = FLIP.getState(src);
    }
    sheet.hidden = false;
    root.classList.add('sheet-open');
    if (lenis) lenis.stop();
    if (state) {
      FLIP.from(state, { targets: sPh, duration: 0.95, ease: 'power3.inOut', absolute: true, zIndex: 3 });
      G.fromTo(sBg, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power2.out' });
      G.fromTo(sheetBits(), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.45 });
    }
    sClose.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!open) return;
    var g = open.g, i = open.i, b = groups[g][i], dst = phOf(b);
    function done() {
      sheet.hidden = true;
      if (G) G.set([sPh, sBg].concat(sheetBits()), { clearProps: 'all' });
      root.classList.remove('sheet-open');
      if (lenis) lenis.start();
      open = null;
      if (g === 'dish') rail.setCurrent(i);
      b.focus({ preventScroll: true });
    }
    if (g === 'dish') rail.show(i, true);
    var r = dst.getBoundingClientRect();
    var vis = r.width > 0 && r.bottom > 0 && r.top < W.innerHeight && r.right > 0 && r.left < W.innerWidth;
    if (MOTION && FLIP && vis) {
      G.to(sheetBits(), { opacity: 0, duration: 0.2 });
      G.to(sBg, { opacity: 0, duration: 0.55, delay: 0.2 });
      FLIP.fit(sPh, dst, { duration: 0.75, ease: 'power3.inOut', absolute: true, scale: false, onComplete: done });
    } else if (MOTION) {
      G.to([sPh, sBg].concat(sheetBits()), { opacity: 0, duration: 0.3, onComplete: done });
    } else done();
  }
  function step(dir) {
    if (!open) return;
    var n = groups[open.g].length, i = (open.i + dir + n) % n, g = open.g;
    open.i = i;
    if (MOTION) {
      var els = [sImg].concat(qa('.sheet-txt > *', sheet));
      G.timeline().to(els, { opacity: 0, duration: 0.18 })
        .add(function () { fill(g, i); })
        .fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.04 });
    } else fill(g, i);
  }
  Object.keys(groups).forEach(function (g) {
    groups[g].forEach(function (b, i) { b.addEventListener('click', function () { openSheet(g, i); }); });
  });
  sClose.addEventListener('click', closeSheet);
  sBg.addEventListener('click', closeSheet);
  sPrev.addEventListener('click', function () { step(-1); });
  sNext.addEventListener('click', function () { step(1); });
  sheet.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'Tab') trap(e, [sClose, sPrev, sNext]);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (open) { e.preventDefault(); closeSheet(); }
    else if (!menu.hidden) { setMenu(false); mBtn.focus(); }
  });

  /* ---------------- copy address ---------------- */
  var copyBtn = q('#copyBtn');
  copyBtn.addEventListener('click', function () {
    var t = copyBtn.getAttribute('data-copy'), msg = q('#copyMsg');
    function ok() {
      copyBtn.textContent = 'Address copied';
      msg.textContent = 'Address copied to the clipboard';
      setTimeout(function () { copyBtn.textContent = 'Copy address'; msg.textContent = ''; }, 2400);
    }
    function legacy() {
      var ta = d.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      d.body.appendChild(ta); ta.select();
      try { d.execCommand('copy'); ok(); } catch (e) {}
      d.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, legacy);
    else legacy();
  });

  /* ---------------- social strip: drift only while on screen ---------------- */
  var soc = q('#social'), socTrack = q('.soc-track');
  function socSpeed() { if (socTrack) socTrack.style.setProperty('--drift', Math.max(30, socTrack.scrollWidth / 2 / 42).toFixed(1) + 's'); }
  if (soc && 'IntersectionObserver' in W) {
    new IntersectionObserver(function (es) { soc.classList.toggle('on', es[0].isIntersecting); }, { rootMargin: '100px 0px' }).observe(soc);
    onLoad(socSpeed);
  }

  /* ---------------- tile fields ---------------- */
  var ftrTiles = tileField(q('.ftr-tiles'));
  var heroTiles = tileField(q('.hw-tiles'));

  if (!MOTION) { root.classList.add('ready'); return; }

  /* =====================================================================
     MOTION ONLY below this line
     ===================================================================== */
  var fontsP = Promise.race([
    d.fonts && d.fonts.load ? Promise.all(['500 40px "Bodoni Moda"', 'italic 400 40px "Bodoni Moda"', '400 16px Jost', '500 12px Jost']
      .map(function (f) { return d.fonts.load(f); })).then(function () { return d.fonts.ready; }) : Promise.resolve(),
    new Promise(function (r) { setTimeout(r, 3000); })
  ]).catch(function () {});

  function splitEl(el, chars) {
    if (!el) return null;
    if (!SPLIT) { el.style.visibility = 'visible'; return null; }
    var s = new SPLIT(el, { type: chars ? 'lines,words,chars' : 'lines,words', mask: 'lines', linesClass: 'ln' });
    (s.masks || []).forEach(function (m) { m.style.padding = '.14em .12em'; m.style.margin = '-.14em -.12em'; });
    el.style.visibility = 'visible';
    return s;
  }

  var heroInDone = false;
  function heroIn() {
    if (heroInDone) return; heroInDone = true;
    var h1 = q('#hero-h'), lines = qa('.hl', h1), tl = G.timeline();
    lines.forEach(function (l) { l.classList.add('mask'); });
    var sp = SPLIT ? new SPLIT(qa('.hl-i', h1), { type: 'chars' }) : null;
    h1.style.visibility = 'visible';
    if (sp) tl.from(sp.chars, { yPercent: 120, duration: 1.15, ease: 'expo.out', stagger: 0.024 }, 0);
    else tl.from(qa('.hl-i', h1), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0);
    tl.add(function () { if (sp) sp.revert(); lines.forEach(function (l) { l.classList.remove('mask'); }); }, 1.9);
    tl.fromTo(qa('.h-rv'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.07 }, 0.35);
    if (heroTiles.uses.length) tl.add(function () { drawTiles(heroTiles, 1.6, 0, 0.8); }, 0.2);
    return tl;
  }

  /* ---- intro: the blue doors ---- */
  function runIntro() {
    var intro = q('#intro'), skip = q('#introSkip');
    if (heroTiles.uses.length) G.set(heroTiles.uses, { strokeDasharray: 1, strokeDashoffset: 1 });
    if (!root.classList.contains('intro-on')) {
      if (intro) intro.parentNode.removeChild(intro);
      if (skip) skip.parentNode.removeChild(skip);
      fontsP.then(heroIn);
      return;
    }
    try { sessionStorage.setItem('ag-intro', '1'); } catch (e) {}
    var L = q('.leaf-l', intro), R = q('.leaf-r', intro);
    R.innerHTML = L.innerHTML;
    var fl = tileField(q('.tiles', L)), fr = tileField(q('.tiles', R));
    var uses = fl.uses.concat(fr.uses), dist = fl.dist.concat(fr.dist);
    root.classList.add('menu-on');
    if (lenis) lenis.stop();
    skip.hidden = false;
    var logos = qa('.intro-logo', intro);
    logos.forEach(function (l) {
      l.style.webkitMaskImage = l.style.maskImage = 'linear-gradient(0deg,#000 42%,transparent 58%)';
      l.style.webkitMaskSize = l.style.maskSize = '100% 300%';
    });
    function maskAt(v) { logos.forEach(function (l) { l.style.webkitMaskPosition = l.style.maskPosition = '0 ' + v + '%'; }); }
    maskAt(0);
    var m = { v: 0 };
    var tl = G.timeline({ onComplete: finish });
    tl.from(qa('.panel, .stile', intro), { scaleY: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04 }, 0.12)
      .fromTo(logos, { y: 26 }, { y: 0, duration: 1, ease: 'power3.out' }, 0.32)
      .to(m, { v: 100, duration: 0.95, ease: 'power2.out', onUpdate: function () { maskAt(m.v); } }, 0.32)
      .addLabel('open', 1.45)
      .to(L, { rotationY: 84, duration: 1.05, ease: 'power3.inOut' }, 'open')
      .to(R, { rotationY: -84, duration: 1.05, ease: 'power3.inOut' }, 'open')
      .to([L, R], { '--shade': 0.65, duration: 1.05, ease: 'power2.in' }, 'open')
      .to([L, R], { opacity: 0, duration: 0.3 }, 'open+=0.78')
      .fromTo(hw, { scale: 0.94 }, { scale: 1, duration: 1.1, ease: 'power3.out', clearProps: 'transform' }, 'open-=0.05')
      .to([hdr, q('#tk')], { opacity: 1, duration: 0.6 }, 'open+=0.5')
      .add(function () { fontsP.then(heroIn); }, 'open+=0.15')
      .add(function () { hold = false; syncFilm(); }, 'open-=0.15');
    skip.addEventListener('click', function () { tl.progress(1); });
    function finish() {
      if (hold) { hold = false; syncFilm(); }
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      if (skip.parentNode) skip.parentNode.removeChild(skip);
      root.classList.remove('intro-on', 'menu-on');
      G.set([hdr, q('#tk')], { clearProps: 'opacity' });
      if (lenis) lenis.start();
      ST.refresh();
    }
  }
  runIntro();

  /* ---- cursor + magnetic buttons + card tilt (fine pointers) ---- */
  if (FINE) {
    root.classList.add('cur', 'cur-off');
    var cr = q('.cur-r'), cdot = q('.cur-d'), cw = q('.cur-word');
    var dX = G.quickTo(cdot, 'x', { duration: 0.08, ease: 'power3' }), dY = G.quickTo(cdot, 'y', { duration: 0.08, ease: 'power3' });
    var rX = G.quickTo(cr, 'x', { duration: 0.5, ease: 'power3' }), rY = G.quickTo(cr, 'y', { duration: 0.5, ease: 'power3' });
    var lastT = null, curIdle = 0;
    W.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY);
      root.classList.remove('cur-off');
      clearTimeout(curIdle); curIdle = setTimeout(function () { root.classList.add('cur-off'); }, 2200);
      var t = e.target.closest ? e.target.closest('[data-cursor], a, button, summary') : null;
      if (t === lastT && !(t && t.hasAttribute('data-cursor'))) return;
      lastT = t;
      var word = t && t.getAttribute('data-cursor');
      cr.classList.toggle('big', !!word);
      cr.classList.toggle('hov', !!t && !word);
      if (word) cw.textContent = word;
    }, { passive: true });
    d.addEventListener('mouseleave', function () { root.classList.add('cur-off'); });
    d.addEventListener('mouseenter', function () { root.classList.remove('cur-off'); });

    qa('.magnet').forEach(function (b) {
      var mx = G.quickTo(b, 'x', { duration: 0.6, ease: 'power3' }), my = G.quickTo(b, 'y', { duration: 0.6, ease: 'power3' });
      var near = false;
      W.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        if (!r.width) return;
        var ox = G.getProperty(b, 'x'), oy = G.getProperty(b, 'y');
        var L = r.left - ox, T = r.top - oy, R = L + r.width, B = T + r.height;
        var ex = Math.max(L - e.clientX, 0, e.clientX - R), ey = Math.max(T - e.clientY, 0, e.clientY - B);
        if (Math.hypot(ex, ey) < 60) { near = true; mx((e.clientX - (L + R) / 2) * 0.32); my((e.clientY - (T + B) / 2) * 0.32); }
        else if (near) { near = false; mx(0); my(0); }
      }, { passive: true });
    });

    qa('.card').forEach(function (c) {
      var inn = q('.card-in', c);
      var tx = G.quickTo(inn, 'rotationX', { duration: 0.7, ease: 'power3' }), ty = G.quickTo(inn, 'rotationY', { duration: 0.7, ease: 'power3' });
      c.addEventListener('pointermove', function (e) {
        if (rail.dragging || e.pointerType !== 'mouse') return;
        var r = c.getBoundingClientRect();
        ty(((e.clientX - r.left) / r.width - 0.5) * 12);
        tx(-((e.clientY - r.top) / r.height - 0.5) * 9);
      });
      c.addEventListener('pointerleave', function () { tx(0); ty(0); });
    });
  }

  /* ---- marquee: speed and direction follow scroll velocity ---- */
  (function () {
    var track = q('.mq-track'), set = q('.mq-set', track);
    var c1 = set.cloneNode(true), c2 = set.cloneNode(true);
    c1.setAttribute('aria-hidden', 'true'); c2.setAttribute('aria-hidden', 'true');
    track.appendChild(c1); track.appendChild(c2);
    var x = 0, dir = -1, boost = 0, vis = false, w = set.offsetWidth;
    W.addEventListener('resize', function () { w = set.offsetWidth; });
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting; track.style.willChange = vis ? 'transform' : '';
    }).observe(track);
    ST.create({ trigger: '#star', start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
      var v = s.getVelocity();
      if (Math.abs(v) > 10) dir = v > 0 ? -1 : 1;
      boost = Math.max(boost, Math.min(Math.abs(v) / 90, 22));
    } });
    G.ticker.add(function (t, dt) {
      if (!vis || !w) return;
      boost *= 0.94;
      x += dir * (0.55 + boost) * (dt / 16.67);
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    });
  })();

  function willOn(els) { return function (s) { els.forEach(function (el) { if (el) el.style.willChange = s.isActive ? 'transform' : ''; }); }; }

  /* ---- scroll scenes (after fonts, so line breaks are final) ---- */
  fontsP.then(function () {
    var mm = G.matchMedia();
    mm.add({ desk: '(min-width: 900px)', wide: '(min-width: 1100px) and (min-height: 600px)', phone: '(max-width: 599px)', any: 'all' }, function (ctx) {
      var desk = ctx.conditions.desk, wide = ctx.conditions.wide, phone = ctx.conditions.phone;
      if (desk) root.classList.add('pin');
      rail.measure();

      /* hero: walk up to the window. The text steps aside and the framed film moves to the centre and grows
         (transform only, so the 1920 film stays sharp and is never cropped further). */
      var aCap = q('.arch-cap'), geo = { dx: 0, dy: 0, s: 1, cap: 0 };
      function measureHero() {
        var st = q('.hero-stage'), vw = heroEl.clientWidth, vh = W.innerHeight, hh = hdr.offsetHeight;
        var x = hw.offsetLeft + st.offsetLeft, y = hw.offsetTop + st.offsetTop, w = hw.offsetWidth, h = hw.offsetHeight;
        var dpr = W.devicePixelRatio || 1;
        var s = Math.min((vh - hh - 150) / h, (vw * 0.82) / w, (1920 * 1.12) / (w * dpr));
        s = Math.max(1, s);
        var cy = hh + (vh - hh - 60) / 2;
        geo = { dx: vw / 2 - (x + w / 2), dy: cy - (y + h / 2), s: s, cap: cy + h * s / 2 + 34 };
        G.set(aCap, { top: geo.cap });
      }
      if (wide) {
        measureHero();
        ST.addEventListener('refreshInit', measureHero);
        var htl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: heroEl, start: 'top top', end: '+=85%', pin: true, scrub: 0.6,
          invalidateOnRefresh: true, onToggle: willOn([hw]) } });
        htl.to('.hero-txt', { y: function () { return -W.innerHeight * 0.14; }, opacity: 0, duration: 0.42, ease: 'power2.in' }, 0)
          .to(hw, { x: function () { return geo.dx; }, y: function () { return geo.dy; }, scale: function () { return geo.s; }, duration: 1, ease: 'power2.inOut' }, 0)
          .fromTo(['.plaque', '.hw-bar'], { opacity: 1, y: 0 }, { opacity: 0, y: 24, duration: 0.24, immediateRender: false }, 0)
          .to('.hero-foot', { opacity: 0, duration: 0.15 }, 0)
          .fromTo(aCap, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.18, immediateRender: false }, 0.82)
          .to({}, { duration: 0.16 });
      } else {
        G.to(hw, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: 0.6 } });
      }

      /* Auntie's story: pinned horizontal track */
      var track = q('.story-track'), spin = q('.story-pin'), chs = qa('.ch:not(.ch-0)');
      if (desk) {
        var dist = function () { return Math.max(0, track.scrollWidth - W.innerWidth); };
        var tw = G.to(track, { x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: { trigger: spin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.7, invalidateOnRefresh: true, onToggle: willOn([track]) } });
        G.fromTo('.thread-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: spin, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.7, invalidateOnRefresh: true } });
        chs.forEach(function (ch) {
          var nf = q('.num-f', ch);
          var st = { trigger: ch, containerAnimation: tw, start: 'left 78%', end: 'left 30%', scrub: true };
          G.fromTo(nf, { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger: st });
          G.fromTo(nf.firstChild, { yPercent: -100 }, { yPercent: 0, ease: 'none', scrollTrigger: st });
          G.from(q('.num-o', ch), { opacity: 0, yPercent: 14, ease: 'none',
            scrollTrigger: { trigger: ch, containerAnimation: tw, start: 'left 100%', end: 'left 70%', scrub: true } });
          G.from(q('.ch-txt', ch), { opacity: 0, x: 60, ease: 'none',
            scrollTrigger: { trigger: ch, containerAnimation: tw, start: 'left 92%', end: 'left 58%', scrub: true } });
          G.fromTo(q('.ch-px', ch), { xPercent: -7 }, { xPercent: 7, ease: 'none',
            scrollTrigger: { trigger: ch, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        });
      } else {
        chs.forEach(function (ch) {
          var nf = q('.num-f', ch), st = { trigger: ch, start: 'top 86%', end: 'top 36%', scrub: true };
          G.fromTo(nf, { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger: st });
          G.fromTo(nf.firstChild, { yPercent: -100 }, { yPercent: 0, ease: 'none', scrollTrigger: st });
          G.from([q('.ch-txt', ch), q('.ch-ph', ch)], { opacity: 0, y: 40, duration: 1, ease: 'power3.out', stagger: 0.1,
            scrollTrigger: { trigger: ch, start: 'top 82%', once: true } });
        });
        if (phone) G.fromTo('.thread-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none',
          scrollTrigger: { trigger: track, start: 'top 60%', end: 'bottom 60%', scrub: true } });
      }

      /* table cards rise in */
      G.from('.card', { y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: '#rail', start: 'top 85%', once: true } });

      /* signature: extreme close-up that pulls back to the whole bowl */
      G.fromTo('.sig-px img', { scale: 1.42 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.sig-ph', start: 'top 95%', end: 'center 45%', scrub: 0.7 } });
      G.fromTo('.sig-frame', { x: -26, y: -26 }, { x: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.sig-ph', start: 'top bottom', end: 'bottom 40%', scrub: 0.7 } });
      if (desk) G.from('.pk', { opacity: 0, y: 34, duration: 1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.picks-list', start: 'top 85%', once: true } });

      /* the rempah: scattered bowls assemble into a tile grid */
      var bowls = qa('.bowl'), seed = 11;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      var sc = bowls.map(function () {
        return { x: (rnd() - 0.5) * (desk ? 1.25 : 0.9), y: rnd() * (desk ? 0.55 : 0.45), r: (rnd() - 0.5) * 56, s: 0.62 + rnd() * 0.7 };
      });
      var rTitle = q('#rempah-h'), rSplit = SPLIT ? new SPLIT(rTitle, { type: 'words,chars' }) : null;
      var rtl = G.timeline({ scrollTrigger: desk
        ? { trigger: '.rp-pin', start: 'top top', end: '+=140%', pin: true, scrub: 0.8, invalidateOnRefresh: true, onToggle: willOn(bowls) }
        : { trigger: '.bowls', start: 'top 95%', end: 'center 52%', scrub: 0.8, invalidateOnRefresh: true } });
      rtl.from(bowls, {
        x: function (i) { return sc[i].x * W.innerWidth; }, y: function (i) { return sc[i].y * W.innerHeight; },
        rotation: function (i) { return sc[i].r; }, scale: function (i) { return sc[i].s; },
        duration: 1, ease: 'power3.out', stagger: { each: 0.03, from: 'random' } }, 0);
      if (rSplit) rtl.from(rSplit.chars, { opacity: 0, yPercent: 50, duration: 0.3, ease: 'power2.out', stagger: 0.014 }, desk ? 0.06 : 0);
      if (desk) rtl.to({}, { duration: 0.25 });

      /* values: the arched window follows the row you are reading */
      var vals = qa('.val'), vms = qa('.vm'), vCount = q('.vals-count b');
      if (desk) {
        q('.vals').classList.add('live');
        vals.forEach(function (row, i) {
          ST.create({ trigger: row, start: 'top 58%', end: 'bottom 58%', onToggle: function (s) {
            if (!s.isActive) return;
            vals.forEach(function (r, k) { r.classList.toggle('on', k === i); });
            vms.forEach(function (m, k) { m.classList.toggle('on', k === i); });
            if (vCount) vCount.textContent = pad(i + 1);
          } });
        });
        vals[0].classList.add('on');
      }

      /* the room: scroll-scrubbed film inside a 16:10 window (no extra crop) */
      var lines = qa('.rm-lines li');
      roomScrub = desk;
      if (desk) {
        rv.loop = false;
        var mtl = G.timeline({ scrollTrigger: { trigger: '.rm-pin', start: 'top top', end: '+=200%', pin: true, scrub: true,
          onUpdate: function (s) { scrubTo(s.progress); } } });
        mtl.from(lines[0], { opacity: 0, y: 30, duration: 0.1 }, 0.06)
          .from(lines[1], { opacity: 0, y: 30, duration: 0.1 }, 0.38)
          .from(lines[2], { opacity: 0, y: 30, duration: 0.1 }, 0.7)
          .to({}, { duration: 0.2 }, 0.8);
      } else {
        G.from(lines, { opacity: 0, y: 30, duration: 0.9, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.rm-lines', start: 'top 88%', once: true } });
      }

      /* headings: lines + words rise through padded line masks */
      qa('[data-split]').forEach(function (el) {
        var s = splitEl(el, false);
        if (!s) return;
        G.from(s.words, { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.04,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onComplete: function () { s.revert(); } });
      });
      qa('.rv').forEach(function (el) {
        G.from(el, { y: 28, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });

      /* star: editions light one by one */
      var eds = qa('.eds li');
      ST.create({ trigger: '.eds', start: 'top 88%', end: 'top 48%',
        onUpdate: function (s) { eds.forEach(function (li, i) { li.classList.toggle('lit', s.progress >= (i + 1) / 4.6); }); },
        onLeave: function () { eds.forEach(function (li) { li.classList.add('lit'); }); } });

      /* room gallery parallax */
      qa('.g').forEach(function (g) {
        G.fromTo(q('.g-px', g), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: true } });
        G.from(g, { opacity: 0, y: 50, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 90%', once: true } });
      });

      /* celebrations: three photos at three depths */
      if (!phone) {
        var etl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.ev-media', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
        etl.fromTo('.ev-b', { y: -30 }, { y: 30 }, 0).fromTo('.ev-a', { y: 50 }, { y: -50 }, 0)
          .fromTo('.ev-c', { y: 120 }, { y: -90 }, 0).fromTo('.ev-arch', { y: -60 }, { y: 50 }, 0);
      }

      /* people + team: a porcelain curtain draws back (transform only) */
      qa('.curtain').forEach(function (c, i) {
        var el = c.parentNode, o = { trigger: el, start: 'top 84%', once: true }, dl = (i % 4) * 0.08;
        G.fromTo(c, { scaleX: 1 }, { scaleX: 0, duration: 1.4, ease: 'expo.inOut', delay: dl, scrollTrigger: o });
        G.fromTo(q('img', el), { scale: 1.18 }, { scale: 1, duration: 1.9, ease: 'expo.out', delay: dl, scrollTrigger: o });
      });

      /* from the kitchen: masonry columns drift at different speeds */
      if (!phone) {
        var kis = qa('.ki'), SPD = [-1, 0.7, -0.45, 1, -0.75, 0.35];
        var spd = function (el) { var w = el.offsetWidth || 1; return SPD[Math.round(el.offsetLeft / (w + 14)) % SPD.length]; };
        var amp = function () { return Math.min(70, W.innerHeight * 0.07); };
        var ktl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.kit-grid', start: 'top bottom', end: 'bottom top', scrub: 0.7, invalidateOnRefresh: true } });
        kis.forEach(function (el) {
          ktl.fromTo(el, { y: function () { return -amp() * spd(el); } }, { y: function () { return amp() * spd(el); } }, 0);
        });
      }
      ST.batch('.ki-ph', { start: 'top 94%', once: true, onEnter: function (b) {
        G.fromTo(b, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out', stagger: 0.05, overwrite: true });
      } });

      /* visit: slow push-in on the shopfront */
      G.fromTo('.vs-in img', { scale: 1.02 }, { scale: 1.14, ease: 'none', scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'bottom top', scrub: true } });
      G.from('.vcard', { y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.vcard', start: 'top 88%', once: true } });
      G.from('.rsv-ph', { y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.rsv-ph', start: 'top 88%', once: true } });

      /* footer: tile pattern draws in */
      if (ftrTiles.uses.length) {
        G.set(ftrTiles.uses, { strokeDasharray: 1, strokeDashoffset: 1 });
        ST.create({ trigger: '.ftr', start: 'top 80%', once: true, onEnter: function () { drawTiles(ftrTiles, 1.4, 0, 0.9); } });
      }
      G.from('.ftr-logo', { y: 40, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.ftr', start: 'top 80%', once: true } });

      ST.sort();
      return function () {
        root.classList.remove('pin');
        ST.removeEventListener('refreshInit', measureHero);
        q('.vals').classList.remove('live');
        if (rSplit) rSplit.revert();
      };
    });
    ST.addEventListener('refresh', cacheOffsets);
    ST.refresh();
    var rfT = 0;
    onLoad(function () { clearTimeout(rfT); rfT = setTimeout(function () { ST.refresh(); }, 120); });
    root.classList.add('ready');
  });
})();
