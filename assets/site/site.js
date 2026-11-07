/* Auntie Gaik Lean's Old School Eatery - homepage v2 "Open the blue doors".
   Everything is in its finished state in the HTML/CSS; this file adds motion on top.
   ?static=1 and prefers-reduced-motion: no intro, no Lenis, no pinning, no scroll-linked motion. */
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
    var r = svg.getBoundingClientRect(), w = Math.max(320, Math.round(r.width)), h = Math.max(320, Math.round(r.height));
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
    if (!f.uses.length) return null;
    G.set(f.uses, { strokeDasharray: 1, strokeDashoffset: 1 });
    return G.to(f.uses, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut', delay: delay || 0,
      stagger: function (i) { return f.dist[i] * spread; } });
  }

  /* ---------------- Lenis ---------------- */
  var lenis = null;
  if (MOTION && W.Lenis) {
    lenis = new W.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  if (ST) ST.config({ ignoreMobileResize: true });

  /* ---------------- header, anchors, tingkat progress ---------------- */
  var hdr = q('#hdr'), heroEl = q('#top'), starEl = q('#star');
  function paintHeader() {
    hdr.classList.toggle('solid', starEl.getBoundingClientRect().top <= hdr.offsetHeight + 1 && !root.classList.contains('menu-on'));
  }
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
      nav: q('.nav a[href="#' + ids[0] + '"]') };
  });
  var barEl = q('.bar span'), ticking = false;
  function paintProgress() {
    ticking = false;
    paintHeader();
    var y = W.pageYOffset, vh = W.innerHeight, line = y + vh * 0.55;
    tiers.forEach(function (t) {
      var top = docTop(t.a), bot = docTop(t.b) + outer(t.b).offsetHeight;
      var p = clamp((line - top) / Math.max(1, bot - top), 0, 1);
      t.el.style.setProperty('--p', p.toFixed(3));
      var on = p > 0 && p < 1;
      t.el.classList.toggle('on', on);
      if (on) t.el.setAttribute('aria-current', 'true'); else t.el.removeAttribute('aria-current');
      if (t.nav) t.nav.classList.toggle('on', on);
    });
    var max = d.documentElement.scrollHeight - vh;
    if (barEl) barEl.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paintProgress); } }
  W.addEventListener('scroll', onScroll, { passive: true });
  W.addEventListener('resize', onScroll);
  paintProgress();

  /* ---------------- mobile menu ---------------- */
  var menu = q('#menu'), mBtn = q('#menuBtn'), menuTiles = null;
  function setMenu(open) {
    if (open === !menu.hidden) return;
    mBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      menu.hidden = false;
      root.classList.add('menu-on');
      hdr.classList.add('menu-open');
      hdr.classList.remove('solid');
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
      paintHeader();
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

  /* ---------------- hero film: crossfading loop of four clips ---------------- */
  var CLIPS = [['menu-4', '50% 55%'], ['menu-2', '40% 75%'], ['menu-6', '22% 60%'], ['menu-5', '55% 50%']];
  var VB = 'assets/video/clips/';
  var hv = qa('.hv'), cur = 0, prepped = false, fading = false, heroVis = true;
  var userPaused = REDUCE, filmBtn = q('#filmBtn'), heroFilm = q('.hero-film');
  var hold = MOTION && root.classList.contains('intro-on'); // film waits behind the doors
  function playV(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function setClip(v, i) {
    v.poster = VB + CLIPS[i][0] + '.webp';
    v.style.objectPosition = CLIPS[i][1];
    v.setAttribute('data-i', i);
    v.src = VB + CLIPS[i][0] + '.mp4';
  }
  function swap() {
    var a = hv[cur], b = hv[1 - cur];
    if (!b.getAttribute('src')) { a.currentTime = 0; playV(a); return; }
    fading = true;
    b.currentTime = 0; playV(b);
    b.classList.add('is-on'); a.classList.remove('is-on');
    cur = 1 - cur;
    setTimeout(function () { a.pause(); fading = false; prepped = false; }, 1300);
  }
  function syncFilm() {
    var v = hv[cur];
    if (userPaused || hold || !heroVis || SHOT) v.pause(); else playV(v);
    filmBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    q('.fb-t', filmBtn).textContent = userPaused ? 'Play film' : 'Pause film';
    heroFilm.setAttribute('data-cursor', userPaused ? 'Play' : 'Pause');
  }
  if (!SHOT) {
    hv[0].preload = 'auto';
    setClip(hv[0], 0);
    hv.forEach(function (v) {
      v.addEventListener('timeupdate', function () {
        if (v !== hv[cur] || !v.duration) return;
        if (!prepped && v.currentTime > v.duration - 2.6) {
          prepped = true;
          var o = hv[1 - cur];
          o.preload = 'auto';
          setClip(o, (+v.getAttribute('data-i') + 1) % CLIPS.length);
          o.load();
        }
        if (!fading && v.currentTime > v.duration - 1.05) swap();
      });
      v.addEventListener('ended', function () { if (v === hv[cur] && !fading) swap(); });
    });
    filmBtn.addEventListener('click', function () { userPaused = !userPaused; syncFilm(); });
    heroFilm.addEventListener('click', function () { userPaused = !userPaused; syncFilm(); });
    if ('IntersectionObserver' in W) {
      new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; syncFilm(); }, { threshold: 0.02 }).observe(heroEl);
    }
    syncFilm();
  }

  /* ---------------- room film: all-intra scrub file on desktop, plain loop on phones ---------------- */
  var rv = q('.rm-v'), roomScrub = false, vt = 0, seeking = false, roomVis = false;
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
      roomVis = es[0].isIntersecting;
      if (roomScrub) return;
      if (roomVis && !REDUCE) playV(rv); else rv.pause();
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
    function to(nx, dur) {
      nx = clamp(nx, min, 0);
      if (tween) tween.kill();
      if (G && dur !== 0 && !REDUCE) {
        var o = { v: x };
        tween = G.to(o, { v: nx, duration: dur == null ? 0.9 : dur, ease: 'power3.out', onUpdate: function () { x = o.v; render(); } });
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
      if (left < pl - 1 || right > vw - pl + 1) to(offs[i], instant ? 0 : 0.8);
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
        vp.classList.add('drag');
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
    W.addEventListener('load', measure);
    measure();
    api.measure = measure; api.show = show; api.btns = btns;
    api.setCurrent = function (i) { btns.forEach(function (b, k) { b.tabIndex = k === i ? 0 : -1; }); };
    return api;
  })();

  /* ---------------- dish sheet / photo viewer (GSAP Flip) ---------------- */
  var sheet = q('#sheet'), sPh = q('.sheet-ph', sheet), sImg = q('img', sPh), sBg = q('.sheet-bg', sheet);
  var sName = q('.sheet-name', sheet), sKind = q('.sheet-kind', sheet), sSub = q('.sheet-sub', sheet), sCount = q('.sheet-count', sheet);
  var sClose = q('.sheet-close', sheet), sPrev = q('.sheet-prev', sheet), sNext = q('.sheet-next', sheet);
  var groups = { dish: qa('.card-btn'), room: qa('.g-btn') }, open = null;
  function sheetBits() { return qa('.sheet-txt > *, .sheet-ui, .sheet-close', sheet); }
  function phOf(b) { return q('.card-ph, .g-ph', b); }
  function fill(g, i) {
    var b = groups[g][i], im = q('img', b), want = b.getAttribute('data-lg');
    sheet.classList.toggle('is-room', g === 'room');
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
    var vis = r.bottom > 0 && r.top < W.innerHeight && r.right > 0 && r.left < W.innerWidth;
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

  /* ---------------- footer tiles ---------------- */
  var ftrTiles = tileField(q('.ftr-tiles'));

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

  function heroIn() {
    var h1 = q('#hero-h'), sp = splitEl(h1, true), tl = G.timeline();
    if (sp) tl.from(sp.chars, { yPercent: 118, duration: 1.15, ease: 'expo.out', stagger: 0.022, onComplete: function () { sp.revert(); } }, 0);
    tl.fromTo(qa('.h-rv'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.4);
    return tl;
  }

  /* ---- intro: the blue doors ---- */
  function runIntro() {
    var intro = q('#intro'), skip = q('#introSkip');
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
    G.set(uses, { strokeDasharray: 1, strokeDashoffset: 1 });
    tl.to(uses, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out', stagger: function (i) { return dist[i] * 0.55; } }, 0)
      .from(qa('.panel, .stile', intro), { scaleY: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04 }, 0.12)
      .fromTo(logos, { y: 26 }, { y: 0, duration: 1, ease: 'power3.out' }, 0.32)
      .to(m, { v: 100, duration: 0.95, ease: 'power2.out', onUpdate: function () { maskAt(m.v); } }, 0.32)
      .addLabel('open', 1.45)
      .to(L, { rotationY: 84, duration: 1.05, ease: 'power3.inOut' }, 'open')
      .to(R, { rotationY: -84, duration: 1.05, ease: 'power3.inOut' }, 'open')
      .to([L, R], { '--shade': 0.65, duration: 1.05, ease: 'power2.in' }, 'open')
      .to([L, R], { opacity: 0, duration: 0.3 }, 'open+=0.78')
      .fromTo('.film-clip', { scale: 1.14 }, { scale: 1, duration: 1.1, ease: 'power3.out' }, 'open-=0.05')
      .to([hdr, q('#tk')], { opacity: 1, duration: 0.6 }, 'open+=0.5')
      .add(function () { fontsP.then(heroIn); }, 'open+=0.2')
      .add(function () { hold = false; syncFilm(); }, 'open-=0.15');
    skip.addEventListener('click', function () { tl.progress(1); });
    function finish() {
      if (hold) { hold = false; syncFilm(); }
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      if (skip.parentNode) skip.parentNode.removeChild(skip);
      root.classList.remove('intro-on', 'menu-on');
      G.set([hdr, q('#tk')], { clearProps: 'opacity' });
      G.set('.film-clip', { clearProps: 'transform' });
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
    var lastT = null;
    W.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      dX(e.clientX); dY(e.clientY); rX(e.clientX); rY(e.clientY);
      root.classList.remove('cur-off');
      var t = e.target.closest ? e.target.closest('[data-cursor], a, button') : null;
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
      W.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        if (!r.width) return;
        var ox = G.getProperty(b, 'x'), oy = G.getProperty(b, 'y');
        var L = r.left - ox, T = r.top - oy, R = L + r.width, B = T + r.height;
        var ex = Math.max(L - e.clientX, 0, e.clientX - R), ey = Math.max(T - e.clientY, 0, e.clientY - B);
        if (Math.hypot(ex, ey) < 60) { mx((e.clientX - (L + R) / 2) * 0.32); my((e.clientY - (T + B) / 2) * 0.32); }
        else { mx(0); my(0); }
      }, { passive: true });
    });

    qa('.card').forEach(function (c) {
      var inn = q('.card-in', c);
      var tx = G.quickTo(inn, 'rotationX', { duration: 0.7, ease: 'power3' }), ty = G.quickTo(inn, 'rotationY', { duration: 0.7, ease: 'power3' });
      c.addEventListener('pointermove', function (e) {
        if (rail.dragging || e.pointerType !== 'mouse') return;
        var r = c.getBoundingClientRect();
        ty(((e.clientX - r.left) / r.width - 0.5) * 14);
        tx(-((e.clientY - r.top) / r.height - 0.5) * 10);
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
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(track);
    ST.create({ trigger: starEl, start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
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

  /* ---- scroll scenes (after fonts, so line breaks are final) ---- */
  fontsP.then(function () {
    var mm = G.matchMedia();
    mm.add({ desk: '(min-width: 900px)', phone: '(max-width: 599px)', any: 'all' }, function (ctx) {
      var desk = ctx.conditions.desk, phone = ctx.conditions.phone;
      if (desk) root.classList.add('pin');
      rail.measure();

      /* hero: film folds into an arched shophouse window */
      var film = q('.film-clip'), zoom = q('.film-zoom'), aLine = q('.arch-line'), aCap = q('.arch-cap'), geo = {};
      function measureHero() {
        var hb = heroEl.getBoundingClientRect(), fw = heroFilm.offsetWidth, fh = heroFilm.offsetHeight;
        var fl = heroFilm.offsetLeft, ft = heroFilm.offsetTop, vw = heroEl.clientWidth, vh = heroEl.clientHeight;
        var aw, ah, ay;
        if (desk) { aw = Math.min(vw * 0.31, 480); ah = Math.min(vh * 0.68, aw * 1.55); ay = Math.max(vh * 0.5 - ah * 0.5 + 6, 96); }
        else { aw = fw * 0.82; ah = fh * 0.9; ay = ft + fh * 0.06; }
        geo = { L: (fw - aw) / 2, R: (fw - aw) / 2, T: ay - ft, B: fh - (ay - ft) - ah, r: aw / 2,
          shift: desk ? vw / 2 - (fl + fw / 2) : 0 };
        G.set(aLine, { left: vw / 2 - aw / 2 - 14, top: ay - 14, width: aw + 28, height: ah + 28, borderRadius: (aw / 2 + 14) + 'px ' + (aw / 2 + 14) + 'px 0 0' });
        G.set(aCap, { top: ay + ah + 34 });
        hb = null;
      }
      measureHero();
      ST.addEventListener('refreshInit', measureHero);
      var p = { v: 0 };
      function arch() {
        var v = p.v, g = geo;
        film.style.clipPath = v <= 0 ? '' : 'inset(' + (g.T * v).toFixed(1) + 'px ' + (g.R * v).toFixed(1) + 'px ' + (g.B * v).toFixed(1) + 'px ' + (g.L * v).toFixed(1) +
          'px round ' + (g.r * v).toFixed(1) + 'px ' + (g.r * v).toFixed(1) + 'px 0px 0px)';
      }
      var htl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: heroEl, start: 'top top', end: desk ? '+=95%' : 'bottom top', pin: desk, scrub: 0.8, invalidateOnRefresh: true } });
      htl.to(p, { v: 1, duration: 1, ease: 'power2.inOut', onUpdate: arch }, 0)
        .to(zoom, { scale: 1.14, duration: 1 }, 0);
      if (desk) {
        htl.to(heroFilm, { x: function () { return geo.shift; }, duration: 1, ease: 'power2.inOut' }, 0)
          .to('.film-shade', { opacity: 0, duration: 0.45 }, 0)
          .to('.hero-in', { y: function () { return -W.innerHeight * 0.16; }, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
          .to(['.cue', '#filmBtn'], { opacity: 0, duration: 0.2 }, 0)
          .fromTo(aLine, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }, 0.74)
          .fromTo(aCap, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.8)
          .to({}, { duration: 0.18 });
      }

      /* Auntie's story: pinned horizontal track */
      var track = q('.story-track'), spin = q('.story-pin'), chs = qa('.ch:not(.ch-0)');
      if (desk) {
        var dist = function () { return Math.max(0, track.scrollWidth - W.innerWidth); };
        var tw = G.to(track, { x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: { trigger: spin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true } });
        G.fromTo('.thread-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: spin, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 0.8, invalidateOnRefresh: true } });
        chs.forEach(function (ch) {
          G.fromTo(q('.num-f', ch), { clipPath: 'inset(100% -20% -20% -20%)' }, { clipPath: 'inset(-20% -20% -20% -20%)', ease: 'none',
            scrollTrigger: { trigger: ch, containerAnimation: tw, start: 'left 78%', end: 'left 30%', scrub: true } });
          G.from(q('.num-o', ch), { opacity: 0, yPercent: 14, ease: 'none',
            scrollTrigger: { trigger: ch, containerAnimation: tw, start: 'left 100%', end: 'left 70%', scrub: true } });
          G.from(q('.ch-txt', ch), { opacity: 0, x: 60, ease: 'none',
            scrollTrigger: { trigger: ch, containerAnimation: tw, start: 'left 92%', end: 'left 58%', scrub: true } });
          G.fromTo(q('.ch-px', ch), { xPercent: -7 }, { xPercent: 7, ease: 'none',
            scrollTrigger: { trigger: ch, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        });
      } else {
        chs.forEach(function (ch) {
          G.fromTo(q('.num-f', ch), { clipPath: 'inset(100% -20% -20% -20%)' }, { clipPath: 'inset(-20% -20% -20% -20%)', ease: 'none',
            scrollTrigger: { trigger: ch, start: 'top 86%', end: 'top 36%', scrub: true } });
          G.from([q('.ch-txt', ch), q('.ch-ph', ch)], { opacity: 0, y: 40, duration: 1, ease: 'power3.out', stagger: 0.1,
            scrollTrigger: { trigger: ch, start: 'top 82%', once: true } });
        });
        if (phone) G.fromTo('.thread-fill', { scaleY: 0 }, { scaleY: 1, ease: 'none',
          scrollTrigger: { trigger: track, start: 'top 60%', end: 'bottom 60%', scrub: true } });
      }

      /* the rempah: scattered bowls assemble into a tile grid */
      var bowls = qa('.bowl'), seed = 11;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      var sc = bowls.map(function () {
        return { x: (rnd() - 0.5) * (desk ? 1.25 : 0.9), y: rnd() * (desk ? 0.55 : 0.45), r: (rnd() - 0.5) * 56, s: 0.62 + rnd() * 0.7 };
      });
      var rTitle = q('#rempah-h'), rSplit = SPLIT ? new SPLIT(rTitle, { type: 'words,chars' }) : null;
      var rtl = G.timeline({ scrollTrigger: desk
        ? { trigger: '.rp-pin', start: 'top top', end: '+=140%', pin: true, scrub: 1, invalidateOnRefresh: true }
        : { trigger: '.bowls', start: 'top 95%', end: 'center 52%', scrub: 0.8, invalidateOnRefresh: true } });
      rtl.from(bowls, {
        x: function (i) { return sc[i].x * W.innerWidth; }, y: function (i) { return sc[i].y * W.innerHeight; },
        rotation: function (i) { return sc[i].r; }, scale: function (i) { return sc[i].s; },
        duration: 1, ease: 'power3.out', stagger: { each: 0.03, from: 'random' } }, 0);
      if (rSplit) rtl.from(rSplit.chars, { opacity: 0, yPercent: 50, duration: 0.3, ease: 'power2.out', stagger: 0.014 }, desk ? 0.06 : 0);
      if (desk) rtl.to({}, { duration: 0.25 });

      /* the room: scroll-scrubbed film */
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
        if (el.id === 'hero-h') return;
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

      /* table cards rise in */
      G.from('.card', { y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: '#rail', start: 'top 85%', once: true } });

      /* room gallery parallax */
      qa('.g').forEach(function (g) {
        G.fromTo(q('.g-px', g), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: true } });
        G.from(g, { opacity: 0, y: 50, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 90%', once: true } });
      });

      /* people: horizontal clip-path wipes */
      qa('.pp-in').forEach(function (el, i) {
        var o = { trigger: el, start: 'top 82%', once: true };
        G.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', delay: i === 2 ? 0.18 : 0, scrollTrigger: o });
        G.from(q('img', el), { scale: 1.2, duration: 1.9, ease: 'expo.out', delay: i === 2 ? 0.18 : 0, scrollTrigger: o });
      });

      /* visit: slow push-in on the shophouse */
      G.fromTo('.vs-in img', { scale: 1.02 }, { scale: 1.16, ease: 'none', scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'bottom top', scrub: true } });
      G.from('.vcard', { y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.vcard', start: 'top 88%', once: true } });

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
        film.style.clipPath = '';
        if (rSplit) rSplit.revert();
      };
    });
    ST.refresh();
    paintProgress();
    root.classList.add('ready');
  });
})();
