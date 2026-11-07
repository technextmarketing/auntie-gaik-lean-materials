/* Auntie Gaik Lean's - the menu as a book (flipbook).
   Built from window.AG_MENU (data.js). Desktop: a CSS-3D book of live HTML pages, one spread per chapter, drag or click to turn.
   Phones / portrait tablets: single pages that turn from the left edge. Reduced motion and ?static=1: a readable page list.
   Classic script, no dependencies. Sound is synthesised (Web Audio) and OFF by default. */
(() => {
  'use strict';
  const M = window.AG_MENU, CH = M.chapters;
  const view = document.getElementById('view-book');
  if (!M || !view) return;
  const $ = (s, r = view) => r.querySelector(s);
  const $$ = (s, r = view) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const QS = new URLSearchParams(location.search);
  const STATIC = QS.has('static') && QS.get('static') !== '0';
  const RM = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = '../assets/texture/';
  const ASSET = '../assets/site/logo-white-760.webp';
  const SPARK = '<svg class="sp" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 5 2 8 7 10-5 2-6.4 5-7 10-.6-5-2-8-7-10 5-2 6.4-5 7-10z"/></svg>';
  const pad2 = n => String(n).padStart(2, '0');
  const TABS = [{ id: 'welcome', name: 'Welcome' }, ...CH.map(c => ({ id: c.id, name: c.short })), { id: 'visit', name: 'Visit' }];
  const slugOf = i => i === 0 ? 'welcome' : i === TABS.length - 1 ? 'visit' : CH[i - 1].id;

  /* ================================================================ faces (page contents) */
  const dishBtn = d => `<li class="dh"><div class="dh__b">
      <span class="dh__n">${esc(d.name)}${d.pick ? ` <span class="dh__star" title="Written about by the MICHELIN Guide inspectors">${SPARK}</span>` : ''}</span>
      <span class="dh__l">${esc(d.local || '')}${d.zh ? ` <span class="zh">${d.zh}</span>` : ''}</span>
      <span class="dh__d">${esc(d.desc)}</span></div></li>`;

  function photoFig(d, cls) {
    const p = d.photo;
    return `<figure class="ph ${cls || ''}"><div class="ph__w"><img src="${p.lg}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" style="object-position:${p.pos}" loading="lazy" decoding="async" draggable="false"></div><figcaption>${esc(d.name)}</figcaption></figure>`;
  }

  const faces = {
    cover: () => `<div class="pg pg--cover"><div class="cv"><div class="cv__in">
        ${SPARK}<img class="cv__logo" src="${ASSET}" width="760" height="244" alt="Auntie Gaik Lean's Old School Eatery" draggable="false">
        <p class="cv__rule" aria-hidden="true"></p>
        <h2 class="cv__t disp">The <i>menu</i></h2>
        <p class="lbl cv__s">One MICHELIN Star · 2023–2026</p>
        <p class="cv__a">1 Lebuh Bishop, George Town, Penang</p>
      </div><p class="lbl cv__open"><span class="hd">Turn the cover to open</span><span class="ho">Swipe or tap to open</span></p></div></div>`,

    story: () => `<div class="pg pg--story"><div class="card">
        <p class="lbl card__l">Welcome to the table</p>
        <h2 class="disp card__t">Auntie began cooking at <i>twelve</i></h2>
        <p>Auntie Gaik Lean is a fourth-generation Nyonya cook, and self-taught. She cooked for her family from the age of twelve, and sold homemade kuih by the roadside.</p>
        <p>In 2013 her eldest son asked her to come home and run this kitchen on Bishop Street. The recipes are the family's own, and everything is made by hand, from scratch, on site.</p>
        <p>The room is 1960s: old music, vintage trinkets, Peranakan tiles and cobalt walls. The MICHELIN Guide gave it One Star in the first guide for Malaysia, and it has kept it every year since.</p>
        <p class="card__s">Nyonya food is shared. Choose a few dishes for the middle of the table, and rice.</p>
      </div></div>`,

    contents: (s) => `<div class="pg pg--contents"><div class="pgin">
        <p class="lbl kick">In this book</p>
        <h2 class="disp pt">What is on the <i>table</i></h2>
        <ol class="toc">${CH.map((c, i) => `<li><button type="button" data-tab="${i + 1}" class="toc__b"><b class="toc__n">${pad2(c.n)}</b><span class="toc__t">${esc(c.title)}</span><span class="toc__d" aria-hidden="true"></span><span class="toc__p">${s ? '' : (i * 2 + 3)}</span></button></li>`).join('')}</ol>
        <div class="band" aria-hidden="true"></div>
        <p class="note"><span class="note__d" aria-hidden="true"></span>${esc(M.note)}</p>
        <p class="fine">Tables for ten or more are welcome. Booking ahead is advised. The kitchen is pork-free.</p>
        ${s ? '' : '<p class="fol">2</p>'}
      </div></div>`,

    open: (ci, s) => {
      const c = CH[ci], ph = c.dishes.filter(d => d.photo);
      let vis;
      if (ph.length === 4) vis = `<div class="vis vis--4">${ph.map(d => photoFig(d)).join('')}</div>`;
      else if (ph.length === 3) vis = `<div class="vis vis--3">${ph.map(d => photoFig(d, 'ph--arch')).join('')}</div>`;
      else if (ph.length === 1) vis = `<div class="vis vis--1">${photoFig(ph[0], 'ph--arch')}</div>`;
      else vis = `<div class="vis vis--0"><div class="tilewin" aria-hidden="true"></div></div>`;
      return `<div class="pg pg--open"><div class="pgin">
        <p class="lbl kick">Chapter ${pad2(c.n)}</p>
        <h2 class="disp pt">${esc(c.title)}</h2>
        <p class="rule" aria-hidden="true"></p>
        <p class="lead">${esc(c.line)}</p>
        ${vis}
        ${s ? '' : `<p class="fol">${ci * 2 + 3}</p>`}
      </div></div>`;
    },

    dishes: (ci, part, parts, s) => {
      const c = CH[ci];
      const per = Math.ceil(c.dishes.length / parts), list = c.dishes.slice(part * per, (part + 1) * per);
      const n = list.length, dens = n <= 3 ? 'a' : n <= 5 ? 'b' : n <= 6 ? 'c' : 'd';
      return `<div class="pg pg--dishes" data-dens="${dens}"><div class="pgin">
        <p class="lbl kick">${pad2(c.n)} · ${esc(c.title)}${parts > 1 ? ` · ${part + 1} of ${parts}` : ''}</p>
        <ul class="dl">${list.map(dishBtn).join('')}</ul>
        ${dens === 'a' ? '<div class="band" aria-hidden="true"></div>' : ''}
        <p class="note note--s"><span class="note__d" aria-hidden="true"></span>${esc(M.note)}</p>
        ${list.some(d => d.pick) ? `<p class="key">${SPARK} Written about by the MICHELIN Guide inspectors</p>` : ''}
        ${s ? '' : `<p class="fol">${ci * 2 + 4}</p>`}
      </div></div>`;
    },

    visit: (s) => `<div class="pg pg--visit"><div class="pgin">
        <p class="lbl kick">Before you come</p>
        <h2 class="disp pt">Come to <i>Bishop Street</i></h2>
        <ul class="tips">
          <li><b>Book ahead</b><span>Booking is advised, and a deposit may be asked for. Book online, call or message the team.</span></li>
          <li><b>Groups of ten or more</b><span>The room has large tables for big family meals.</span></li>
          <li><b>Pork-free kitchen</b><span>Please tell the team about any allergies or what you do not eat.</span></li>
          <li><b>Getting here</b><span>1 Lebuh Bishop, in the heritage core of George Town. Street parking nearby.</span></li>
        </ul>
        <div class="band" aria-hidden="true"></div>
        <p class="note"><span class="note__d" aria-hidden="true"></span>${esc(M.note)}</p>
        <p class="fine"><a href="out/auntie-gaik-lean-menu.pdf" download>Download the printed menu (PDF)</a></p>
        ${s ? '' : '<p class="fol">15</p>'}
      </div></div>`,

    back: () => `<div class="pg pg--back"><div class="cv"><div class="cv__in cv__in--back">
        <img class="cv__logo" src="${ASSET}" width="760" height="244" alt="Auntie Gaik Lean's Old School Eatery" draggable="false">
        <p class="cv__rule" aria-hidden="true"></p>
        <p class="lbl cv__s">Wed–Sun</p>
        <p class="cv__h">Lunch 12pm–2.30pm<br>Dinner 6pm–9.30pm<br><span>Closed Monday and Tuesday</span></p>
        <p class="cv__a">1 Lebuh Bishop (Bishop Street)<br>George Town, 10200 Penang</p>
        <a class="bk-btn bk-btn--gold" href="${M.book}" target="_blank" rel="noopener">Book a table</a>
        <p class="cv__c"><a href="${M.tel}">${esc(M.phone)}</a><i aria-hidden="true"></i><a href="https://wa.me/${M.wa}" target="_blank" rel="noopener">WhatsApp</a></p>
      </div></div></div>`,
  };

  const FOLD = { story: 'welcome', contents: 'welcome' };
  /* the ordered list of faces. spread mode: 16 faces (2 per sheet). single: one face per page, long chapters split. */
  function faceList(single, flow) {
    const L = [];
    const add = (html, tab, cls) => L.push({ html, tab, cls: cls || '' });
    add(faces.cover(), -1, 'hard');
    add(faces.story(), 0, 'endp');
    add(faces.contents(single || flow), 0);
    CH.forEach((c, ci) => {
      add(faces.open(ci, single || flow), ci + 1);
      const parts = flow ? 1 : single ? (c.dishes.length > 6 ? 3 : c.dishes.length > 4 ? 2 : 1) : 1;
      for (let p = 0; p < parts; p++) add(faces.dishes(ci, p, parts, single || flow), ci + 1);
    });
    add(faces.visit(single || flow), TABS.length - 1);
    add(faces.back(), TABS.length - 1, 'hard');
    return L;
  }

  /* ================================================================ state + engine */
  const stage = $('#bkStage'), fit = $('#bkFit'), book = $('#bkBook'), one = $('#bkOne'), stat = $('#bkStatic');
  const btnPrev = $('#bkPrev'), btnNext = $('#bkNext'), cnt = $('#bkCount'), cap = $('#bkCap'), tabsEl = $('#bkTabs');
  const mqSingle = matchMedia('(max-width: 760px), (max-width: 1023px) and (orientation: portrait)');
  const B = { single: false, built: false, pos: 0, want: 0, max: 8, ang: [], sheets: [], faceEls: [], list: [], busy: false, drag: null, scale: 1, aEnd: -180, sound: false, shown: false };

  function buildStatic() {
    const L = faceList(false, true).filter(f => !/hard/.test(f.cls) || true);
    stat.innerHTML = `<ol class="st">${L.map((f, i) => `<li class="st__li${f.cls ? ' st__li--' + f.cls : ''}" aria-label="Page ${i + 1} of ${L.length}">${f.html.replace('class="pg ', 'class="pg pg--flow ')}</li>`).join('')}</ol>`;
    view.classList.add('is-list');
  }

  function build() {
    const single = mqSingle.matches;
    B.single = single; B.built = true; B.drag = null; B.busy = false;
    B.list = faceList(single, false);
    book.innerHTML = ''; one.innerHTML = '';
    B.sheets = []; B.faceEls = []; B.ang = [];
    if (!single) {
      B.max = 8; B.aEnd = -180;
      const nS = 9;
      for (let i = 0; i < nS; i++) {
        const el = document.createElement('div');
        el.className = 'sh' + (i === 0 ? ' sh--c0' : '') + (i === 8 ? ' sh--c8' : '');
        const f = B.list[2 * i], b = B.list[2 * i + 1];
        el.innerHTML = `<div class="sh__f ${f.cls}">${f.html}<i class="sh__s"></i></div>` + `<div class="sh__b ${b ? b.cls : 'blank'}">${b ? b.html : ''}<i class="sh__s"></i></div>`;
        book.appendChild(el);
        B.sheets.push(el); B.ang.push(0);
        B.faceEls.push([el.firstChild, el.lastChild]);
      }
      book.insertAdjacentHTML('afterbegin', '<i class="bk__floor"></i>');
      book.insertAdjacentHTML('beforeend', '<i class="bk__cast bk__cast--l"></i><i class="bk__cast bk__cast--r"></i>');
      B.floor = $('.bk__floor', book); B.castL = $('.bk__cast--l', book); B.castR = $('.bk__cast--r', book);
    } else {
      B.max = B.list.length - 1; B.aEnd = -112;
      B.list.forEach((f, i) => {
        const el = document.createElement('div');
        el.className = 'sf';
        el.innerHTML = `<div class="sh__f ${f.cls}">${f.html}<i class="sh__s"></i></div>`;
        one.appendChild(el);
        B.sheets.push(el); B.ang.push(0); B.faceEls.push([el.firstChild]);
      });
    }
    B.pos = clamp(B.pos, 0, B.max);
    if (!single && B.pos > 8) B.pos = 8;
    B.want = B.pos;
    for (let i = 0; i < B.sheets.length; i++) B.ang[i] = i < B.pos ? B.aEnd : 0;
    view.classList.toggle('is-single', single);
    sizeIt(); layout(); ui();
  }

  /* ---- drawing */
  function drawSheet(i) {
    const a = B.ang[i], el = B.sheets[i], end = B.aEnd, mid = end / 2;
    const turning = a < -0.01 && a > end + 0.01;
    if (B.single) {
      el.style.display = (i === B.pos || i === B.pos + 1 || i === B.pos - 1 || turning) && !(a <= end + .01) ? '' : 'none';
      if (i === B.pos + 1 && a === 0) el.style.display = '';
      el.style.transform = `rotateY(${a}deg)`;
      el.style.zIndex = turning ? 100 : 50 - i;
      const sh = $('.sh__s', el), t = clamp(-a / -end, 0, 1);
      sh.style.opacity = (Math.pow(t, 1.4) * .55).toFixed(3);
      sh.style.background = `linear-gradient(90deg, rgba(8,14,40,.55), rgba(8,14,40,0) 55%, rgba(255,255,255,${(t * .35).toFixed(2)}))`;
      return;
    }
    el.style.transform = `rotateY(${a}deg)`;
    el.style.zIndex = turning ? 100 : (a <= mid ? i + 1 : 60 - i);
    const f = $('.sh__s', B.faceEls[i][0]), b = $('.sh__s', B.faceEls[i][1]);
    const tf = clamp(-a / 90, 0, 1), tb = clamp((180 + a) / 90, 0, 1);   // 1 = edge-on
    f.style.opacity = (Math.pow(tf, 1.5) * .6).toFixed(3);
    b.style.opacity = (Math.pow(tb, 1.5) * .6).toFixed(3);
    f.style.background = `linear-gradient(90deg, rgba(8,14,40,.5), rgba(8,14,40,0) 60%, rgba(255,255,255,${(tf * .3).toFixed(2)}))`;
    b.style.background = `linear-gradient(270deg, rgba(8,14,40,.5), rgba(8,14,40,0) 60%, rgba(255,255,255,${(tb * .3).toFixed(2)}))`;
  }
  function drawAll() {
    for (let i = 0; i < B.sheets.length; i++) drawSheet(i);
    if (B.single) return;
    const op0 = clamp(-B.ang[0] / 180, 0, 1);
    book.style.transform = `translateX(${(-300 * (1 - op0)).toFixed(2)}px)`;
    let tp = 0; for (let i = 0; i < 9; i++) { const a = B.ang[i]; if (a < -0.01 && a > -179.99) tp = Math.max(tp, Math.sin(-a / 180 * Math.PI)); }
    B.castL.style.opacity = B.castR.style.opacity = (tp * .9).toFixed(3);
    const left = 600 - 600 * op0;
    B.floor.style.left = (left - 24) + 'px'; B.floor.style.width = (1200 - left + 48) + 'px';
    B.castL.style.display = op0 > 0 ? '' : 'none';
  }
  function layout() {   // which pages can be reached by keyboard / screen readers
    B.faceEls.forEach((pair, i) => pair.forEach((el, k) => {
      let on;
      if (B.single) on = i === B.pos;
      else on = k === 0 ? i === B.pos : i === B.pos - 1;
      el.toggleAttribute('inert', !on);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
    }));
    drawAll();
  }

  /* ---- sizing */
  function sizeIt() {
    if (view.classList.contains('is-list')) return;
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H) return;
    if (!B.single) {
      const s = Math.min((W - 28) / 1232, (H - 18) / 872);
      B.scale = s;
      fit.style.transform = `translate(-50%,-50%) scale(${s.toFixed(4)})`;
    } else {
      const w = Math.min(W - 24, 470), h = Math.min(H - 14, 860);
      one.style.width = w + 'px'; one.style.height = h + 'px';
      const k = clamp(560 / w, 1.35, 1.65);
      one.style.setProperty('--k', k.toFixed(3));
    }
  }

  /* ---- turning */
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let anim = null;
  function tick(now) {
    if (!anim) return;
    const t = clamp((now - anim.t0) / anim.dur, 0, 1);
    B.ang[anim.i] = anim.from + (anim.to - anim.from) * ease(t);
    drawAll();
    if (t < 1) requestAnimationFrame(tick); else { const d = anim.done; anim = null; d && d(); }
  }
  function tween(i, to, dur, done) {
    const from = B.ang[i];
    if (RM || Math.abs(to - from) < .5) { B.ang[i] = to; drawAll(); done && done(); return; }
    anim = { i, from, to, dur, t0: performance.now(), done };
    requestAnimationFrame(tick);
  }
  function turn(dir, quick, fromDrag) {
    if (anim && !fromDrag) return false;
    if (dir > 0 && B.pos >= B.max) return false;
    if (dir < 0 && B.pos <= 0) return false;
    const i = dir > 0 ? B.pos : B.pos - 1;
    B.busy = true;
    swish();
    const full = Math.abs((dir > 0 ? B.aEnd : 0) - B.ang[i]) / Math.abs(B.aEnd);
    tween(i, dir > 0 ? B.aEnd : 0, Math.max(260, (quick ? 520 : 900) * Math.max(.35, full)), () => {
      B.pos += dir; B.busy = false; layout(); ui(); save();
      if (B.pos !== B.want) turn(B.want > B.pos ? 1 : -1, true);
    });
    return true;
  }
  function goPos(p) { B.want = clamp(p, 0, B.max); if (!anim && B.pos !== B.want) turn(B.want > B.pos ? 1 : -1, Math.abs(B.want - B.pos) > 1); }
  function posOfTab(t) {
    if (!B.single) return t === 0 ? 1 : t === TABS.length - 1 ? 8 : t + 1;
    const i = B.list.findIndex((f, k) => f.tab === t && (t !== 0 || k === 1));
    return Math.max(0, i);
  }
  function tabOfPos() {
    if (!B.single) return B.pos === 0 ? -1 : B.pos === 1 ? 0 : B.pos === 8 ? TABS.length - 1 : B.pos - 1;
    return B.list[B.pos].tab;
  }
  const next = () => goPos(B.pos + 1), prev = () => goPos(B.pos - 1);

  /* ---- ui + hash */
  function ui() {
    const t = tabOfPos();
    btnPrev.disabled = B.pos <= 0; btnNext.disabled = B.pos >= B.max;
    let c, name;
    if (B.single) { c = `Page ${B.pos + 1} of ${B.list.length}`; }
    else c = B.pos === 0 ? 'Cover' : `Pages ${2 * B.pos - 1}–${2 * B.pos} of 16`;
    name = t < 0 ? "Auntie Gaik Lean's" : t === 0 ? 'Welcome and contents' : t === TABS.length - 1 ? 'Visit us' : CH[t - 1].title;
    cnt.textContent = c; cap.textContent = name;
    $$('.bk__tab', tabsEl).forEach((b, i) => { b.setAttribute('aria-current', i === t ? 'true' : 'false'); if (i === t && b.scrollIntoView && B.single) b.parentElement.scrollTo({ left: b.offsetLeft - 40, behavior: RM ? 'auto' : 'smooth' }); });
    view.classList.toggle('is-closed', !B.single && B.pos === 0);
    $('#bkLive').textContent = `${c}. ${name}.`;
  }
  function save() {
    if (view.hidden) return;
    const t = tabOfPos();
    try { history.replaceState(null, '', t < 0 ? '#book' : '#book-' + slugOf(t)); } catch (e) { /* ignore */ }
  }

  /* ---- sound (off by default) */
  let AC = null;
  function swish() {
    if (!B.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const len = AC.sampleRate * .42, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) { const e = Math.sin(Math.PI * Math.pow(i / len, .7)); d[i] = (Math.random() * 2 - 1) * e; }
      const src = AC.createBufferSource(); src.buffer = buf;
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.setValueAtTime(900, AC.currentTime); bp.frequency.exponentialRampToValueAtTime(3200, AC.currentTime + .38);
      const g = AC.createGain(); g.gain.value = .16;
      src.connect(bp); bp.connect(g); g.connect(AC.destination); src.start();
    } catch (e) { /* ignore */ }
  }

  /* ---- pointer: drag to turn, click the outer edge, hover peek */
  let down = null;
  const pageW = () => (B.single ? one.getBoundingClientRect().width : 600 * B.scale);
  function begin(dir) {
    if (anim) return null;
    if (dir > 0 && B.pos >= B.max) return null;
    if (dir < 0 && B.pos <= 0) return null;
    return { dir, i: dir > 0 ? B.pos : B.pos - 1 };
  }
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0 || B.busy) return;
    if (e.target.closest('a, button, input, .bk__tabs')) { down = null; return; }
    const r = (B.single ? one : book).getBoundingClientRect();
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, drag: null, moved: false, r, last: e.clientX, lt: performance.now(), v: 0 };
  });
  addEventListener('pointermove', e => {
    if (!down || e.pointerId !== down.id) { hover(e); return; }
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!down.drag) {
      if (Math.abs(dx) < 7) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) { down = null; return; }
      const dir = dx < 0 ? 1 : -1;
      const h = begin(dir); if (!h) { down = null; return; }
      down.drag = h; down.moved = true; B.drag = h; stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      view.classList.add('is-drag'); hoverClear();
    }
    const span = pageW() * (B.single ? .9 : 1.5);
    const p = clamp(down.drag.dir > 0 ? -dx / span : dx / span, 0, 1);
    B.ang[down.drag.i] = down.drag.dir > 0 ? B.aEnd * p : B.aEnd * (1 - p);
    const now = performance.now(); down.v = .8 * down.v + .2 * ((e.clientX - down.last) / Math.max(1, now - down.lt)); down.last = e.clientX; down.lt = now;
    if (!B.single) { const ty = clamp((e.clientY - down.r.top) / down.r.height - .5, -.5, .5); B.sheets[down.drag.i].style.setProperty('--tilt', (ty * -6).toFixed(2) + 'deg'); }
    drawAll();
  });
  function up(e) {
    if (!down || (e && e.pointerId !== down.id)) return;
    const d = down; down = null; view.classList.remove('is-drag');
    if (d.drag) {
      const { dir, i } = d.drag; B.drag = null;
      const p = dir > 0 ? B.ang[i] / B.aEnd : 1 - B.ang[i] / B.aEnd;
      const fling = (dir > 0 ? -d.v : d.v) > .45;
      const complete = p > .32 || fling;
      swish();
      B.busy = true;
      tween(i, complete ? (dir > 0 ? B.aEnd : 0) : (dir > 0 ? 0 : B.aEnd), 480, () => { if (complete) B.pos += dir; B.busy = false; layout(); ui(); save(); });
      return;
    }
    // a click: the cover opens; the outer edge of a page turns it
    if (performance.now() - d.t > 600) return;
    const r = d.r;
    if (!B.single) {
      const rel = (d.x - r.left) / r.width * 1200;   // 0..1200 design px
      const open = clamp(-B.ang[0] / 180, 0, 1);
      if (B.pos === 0) { if (e.target.closest('.sh')) next(); return; }
      if (rel > 600 + 600 * .78) next(); else if (rel < 600 * .22) prev();
    } else {
      const rel = (d.x - r.left) / r.width;
      if (rel > .8) next(); else if (rel < .2) prev();
      else if (B.pos === 0) next();
    }
  }
  addEventListener('pointerup', up);
  addEventListener('pointercancel', e => {
    if (!down || e.pointerId !== down.id) return;
    if (down.drag) { const { i, dir } = down.drag; B.drag = null; down = null; view.classList.remove('is-drag'); tween(i, dir > 0 ? 0 : B.aEnd, 250, () => { layout(); }); } else down = null;
  });
  /* hover peek: lift the outer corner a little so the page invites a turn */
  let peek = null, peekRaf = 0;
  function hoverClear() { if (peek) { const p = peek; peek = null; settle(p.i, p.rest); } }
  function settle(i, to) {
    if (anim || B.drag) return;
    cancelAnimationFrame(peekRaf);
    const step = () => { if (anim || B.drag) return; const a = B.ang[i]; if (Math.abs(a - to) < .15) { B.ang[i] = to; drawAll(); return; } B.ang[i] = a + (to - a) * .22; drawAll(); peekRaf = requestAnimationFrame(step); };
    step();
  }
  function hover(e) {
    if (B.single || RM || B.drag || anim || down || e.pointerType === 'touch' || view.hidden) return;
    const r = book.getBoundingClientRect(); const rel = (e.clientX - r.left) / r.width * 1200;
    const inY = e.clientY > r.top && e.clientY < r.bottom;
    let want = null;
    if (inY && B.pos < B.max && B.pos > 0 && rel > 600 + 600 * .8 && rel < 1200) want = { i: B.pos, rest: 0, to: -7 };
    else if (inY && B.pos > 0 && rel < 600 * .2 && rel > 0) want = { i: B.pos - 1, rest: -180, to: -173 };
    else if (inY && B.pos === 0 && rel > 600 + 600 * .8 && rel < 1200 + 0) want = { i: 0, rest: 0, to: -5 };
    if (want && (!peek || peek.i !== want.i)) { hoverClear(); peek = want; settle(want.i, want.to); }
    else if (!want) hoverClear();
  }
  stage.addEventListener('pointerleave', hoverClear);

  /* ---- clicks inside pages */
  view.addEventListener('click', e => {
    if (down && down.moved) return;
    const t = e.target.closest('[data-tab]');
    if (t) { goPos(posOfTab(+t.dataset.tab)); return; }
  });
  btnPrev.addEventListener('click', prev); btnNext.addEventListener('click', next);
  tabsEl.addEventListener('click', e => { const b = e.target.closest('.bk__tab'); if (b) goPos(posOfTab(+b.dataset.i)); });

  const bSnd = $('#bkSound'), bFs = $('#bkFs');
  bSnd.addEventListener('click', () => { B.sound = !B.sound; bSnd.setAttribute('aria-pressed', B.sound); bSnd.querySelector('.bk__bt').textContent = B.sound ? 'Sound on' : 'Sound off'; if (B.sound) swish(); });
  const fsOk = !!(view.requestFullscreen || view.webkitRequestFullscreen);
  if (!fsOk) bFs.hidden = true;
  bFs.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen(); else (view.requestFullscreen || view.webkitRequestFullscreen).call(view);
  });
  document.addEventListener('fullscreenchange', () => { const on = !!document.fullscreenElement; bFs.setAttribute('aria-pressed', on); bFs.querySelector('.bk__bt').textContent = on ? 'Exit full screen' : 'Full screen'; view.classList.toggle('is-fs', on); setTimeout(sizeIt, 60); });

  addEventListener('keydown', e => {
    if (view.hidden || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); goPos(0); }
    else if (k === 'End') { e.preventDefault(); goPos(B.max); }
    else if (/^[1-6]$/.test(k)) { e.preventDefault(); goPos(posOfTab(+k)); }
    else if (k === 'f' || k === 'F') { if (fsOk) bFs.click(); }
    else if (k === 's' || k === 'S') { bSnd.click(); }
  });

  /* ---- boot */
  tabsEl.innerHTML = TABS.map((t, i) => `<button type="button" class="bk__tab" data-i="${i}" aria-current="false">${i === 0 ? '' : i < TABS.length - 1 ? `<b>${pad2(i)}</b>` : ''}${esc(t.name)}</button>`).join('');
  let rzT = 0;
  function reflow() {
    clearTimeout(rzT);
    rzT = setTimeout(() => {
      if (view.classList.contains('is-list')) return;
      if (!B.built || B.single !== mqSingle.matches) { const keep = tabOfPos(); if (B.built) { B.pos = 0; } build(); if (B.built && keep > 0) { B.pos = posOfTab(keep); B.want = B.pos; for (let i = 0; i < B.sheets.length; i++) B.ang[i] = i < B.pos ? B.aEnd : 0; layout(); ui(); } } else sizeIt();
    }, 60);
  }
  addEventListener('resize', reflow);
  if (window.ResizeObserver) new ResizeObserver(() => { if (!view.hidden) reflow(); }).observe(stage);

  function init() {
    if (STATIC || RM) { buildStatic(); return; }
    build();
  }
  init();

  window.AGBook = {
    show() { if (view.classList.contains('is-list')) return; if (!B.built) build(); sizeIt(); layout(); ui(); },
    goto(slug, instant) {
      const t = TABS.findIndex(x => x.id === slug); if (t < 0 || !B.built) return;
      const p = posOfTab(t);
      if (instant) { B.pos = B.want = p; for (let i = 0; i < B.sheets.length; i++) B.ang[i] = i < p ? B.aEnd : 0; layout(); ui(); } else goPos(p);
    },
    next, prev, goPos, state: B,
  };
})();
