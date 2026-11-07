/* Auntie's Tingkat - the interactive menu of Auntie Gaik Lean's Old School Eatery.
   Three ways in: the tingkat (lift a tier -> it opens into a spread of dish cards -> dish sheet),
   "Set the table" (lazy susan, suggestion counter, WhatsApp list) and List & search.
   GSAP 3 + Flip (vendored). ?static=1 and prefers-reduced-motion make every move instant. */
(() => {
  'use strict';
  const M = window.AG_MENU;
  const G = window.gsap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const QS = new URLSearchParams(location.search);
  const STATIC = QS.has('static') && QS.get('static') !== '0';
  const RM = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.classList.add('js');
  if (STATIC) root.classList.add('is-static');
  if (RM) root.classList.add('is-rm');
  if (!M || !G) { const l = $('#view-list'); if (l) l.hidden = false; return; }
  const FLIP = window.Flip;
  if (FLIP) G.registerPlugin(FLIP);
  if (RM) G.globalTimeline.timeScale(1000);

  /* ---------------------------------------------------------------- data */
  const CH = M.chapters, N = CH.length;
  const DISH = {};
  CH.forEach((c, ci) => c.dishes.forEach((d, di) => { DISH[d.id] = { d, c, ci, di }; }));
  const ALL = Object.keys(DISH);
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const plural = (n, a, b) => n === 1 ? a : b;
  const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.6 4.6 1.9 6.9 6 9-4.1 2.1-5.4 4.4-6 9-.6-4.6-1.9-6.9-6-9 4.1-2.1 5.4-4.4 6-9z"/></svg>';
  const CHECK = '<svg class="chip__ck" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const XS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const live = $('#live');
  let liveT = 0;
  const say = msg => { clearTimeout(liveT); live.textContent = ''; liveT = setTimeout(() => { live.textContent = msg; }, 60); };

  /* Enamel palette per tier (brand tokens only; rose/jade appear only as tiny flower accents). */
  const PAL = [
    { g: '--sky', p: '--cobalt', b: '--gold', dark: false },
    { g: '--cobalt', p: '--gold-hi', b: '--gold', dark: true },
    { g: '--porcelain-2', p: '--cobalt', b: '--gold', dark: false },
    { g: '--indigo', p: '--gold', b: '--gold', dark: true },
    { g: '--cobalt-hi', p: '--porcelain', b: '--gold-hi', dark: true },
    { g: '--porcelain', p: '--cobalt-hi', b: '--gold', dark: false }
  ];
  const F = n => `fill:var(${n})`;
  const S = (n, w) => `fill:none;stroke:var(${n});stroke-width:${w}`;

  /* ---------------------------------------------------------------- SVG art */
  function flower(cx, cy, r, sx) {
    let s = `<g transform="translate(${cx} ${cy}) scale(${sx} 1)">`;
    s += `<ellipse rx="${r * 1.28}" ry="${r}" style="${F('--porcelain')};stroke:var(--gold);stroke-width:1.6"/>`;
    s += `<ellipse rx="${r * 1.07}" ry="${r * .8}" style="${S('--cobalt', .8)};opacity:.45"/>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cy="${-r * .36}" rx="${r * .2}" ry="${r * .33}" transform="rotate(${i * 72})" style="${F('--rose')};opacity:.88"/>`;
    s += `<circle r="${r * .15}" style="${F('--gold')}"/>`;
    s += `<path d="M${r * .52} ${r * .16}q${r * .32} ${-r * .2} ${r * .58} ${r * .1}q${-r * .3} ${r * .22} ${-r * .58} ${-r * .1}z" style="${F('--jade')}"/>`;
    s += `<path d="M${-r * .52} ${r * .16}q${-r * .32} ${-r * .2} ${-r * .58} ${r * .1}q${r * .3} ${r * .22} ${r * .58} ${-r * .1}z" style="${F('--jade')}"/>`;
    return s + '</g>';
  }
  const ycur = (x, base) => base + 22 * Math.sqrt(Math.max(0, 1 - ((x - 200) / 200) ** 2));
  const BODY = 'M0 22V96A200 22 0 0 0 400 96V22A200 22 0 0 1 0 22Z';
  function shadeDefs(id) {
    return `<linearGradient id="sh${id}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#0c1433" stop-opacity=".62"/><stop offset=".12" stop-color="#0c1433" stop-opacity=".16"/>
      <stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".39" stop-color="#fff" stop-opacity=".28"/>
      <stop offset=".47" stop-color="#fff" stop-opacity="0"/><stop offset=".76" stop-color="#0c1433" stop-opacity=".12"/>
      <stop offset="1" stop-color="#0c1433" stop-opacity=".68"/></linearGradient>
      <linearGradient id="sv${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0c1433" stop-opacity="0"/><stop offset="1" stop-color="#0c1433" stop-opacity=".28"/></linearGradient>
      <linearGradient id="br${id}" x1="0" x2="1"><stop offset="0" style="stop-color:var(--gold-lo)"/><stop offset=".45" style="stop-color:var(--gold-hi)"/><stop offset="1" style="stop-color:var(--gold-lo)"/></linearGradient>`;
  }
  function patDef(id, P, i) {
    const motif = i % 2
      ? `<path d="M11 6.5 13.6 11 11 15.5 8.4 11Z" style="${F(P.p)}"/><circle cx="0" cy="0" r="1.3" style="${F(P.p)}"/><circle cx="22" cy="22" r="1.3" style="${F(P.p)}"/>`
      : `<circle cx="11" cy="11" r="2" style="${F(P.p)}"/><path d="M0 11h4M18 11h4M11 0v4M11 18v4" style="${S(P.p, 1)}"/>`;
    return `<pattern id="pt${id}" width="22" height="22" patternUnits="userSpaceOnUse">${motif}</pattern>`;
  }
  function tierSVG(i) {
    const P = PAL[i], id = 't' + i;
    let s = `<svg viewBox="-30 0 460 124" aria-hidden="true" focusable="false"><defs>${shadeDefs(id)}${patDef(id, P, i)}
      <radialGradient id="in${id}" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#1b2a66"/><stop offset="1" stop-color="#050a1f"/></radialGradient>
      <clipPath id="cl${id}"><path d="${BODY}"/></clipPath></defs>`;
    // lugs the carrier rails pass through
    s += `<rect x="-25" y="50" width="27" height="22" rx="4" style="fill:url(#br${id})"/><rect x="398" y="50" width="27" height="22" rx="4" style="fill:url(#br${id})"/>`;
    // opening (seen when the tier above is lifted)
    s += `<ellipse cx="200" cy="22" rx="199" ry="21" style="fill:url(#in${id})"/>`;
    s += `<path d="M2 22A198 21 0 0 1 398 22" style="${S('--gold', 2.2)}"/>`;
    // body
    s += `<path d="${BODY}" style="${F(P.g)}"/>`;
    s += `<g clip-path="url(#cl${id})"><rect x="0" y="0" width="400" height="124" style="fill:url(#pt${id});opacity:${P.dark ? .38 : .3}"/>`;
    s += `<path d="M0 34A200 22 0 0 0 400 34" style="${S(P.b, 2.6)}"/><path d="M0 39A200 22 0 0 0 400 39" style="${S(P.b, .9)}"/>`;
    s += `<path d="M0 82A200 22 0 0 0 400 82" style="${S(P.b, .9)}"/><path d="M0 87A200 22 0 0 0 400 87" style="${S(P.b, 2.6)}"/>`;
    [[200, 1], [96, .74], [304, .74], [14, .26], [386, .26]].forEach(([x, sx]) => { s += flower(x, ycur(x, 39.5), 15.5, sx); });
    [148, 252].forEach(x => { const y = ycur(x, 39.5); s += `<path d="M${x} ${y - 7}l5 7-5 7-5-7z" style="${F(P.b)}"/>`; });
    s += `<rect x="0" y="0" width="400" height="124" style="fill:url(#sh${id})"/><rect x="0" y="40" width="400" height="84" style="fill:url(#sv${id})"/></g>`;
    s += `<path d="M0 22A200 22 0 0 0 400 22" style="${S('--gold-hi', 2.6)}"/>`;
    return s + '</svg>';
  }
  function lidSVG() {
    const id = 'lid', P = { g: '--cobalt', p: '--gold-hi', b: '--gold' };
    const LID = 'M0 128V112C0 70 96 46 200 46C304 46 400 70 400 112V128A200 22 0 0 1 0 128Z';
    let s = `<svg viewBox="-30 0 460 150" aria-hidden="true" focusable="false"><defs>${shadeDefs(id)}${patDef(id, P, 1)}<clipPath id="cl${id}"><path d="${LID}"/></clipPath></defs>`;
    s += `<path d="${LID}" style="${F('--cobalt')}"/>`;
    s += `<g clip-path="url(#cl${id})"><rect x="0" y="40" width="400" height="120" style="fill:url(#pt${id});opacity:.34"/>`;
    s += `<path d="M0 113A200 22 0 0 0 400 113" style="${S('--gold', 2.6)}"/><path d="M0 108A200 22 0 0 0 400 108" style="${S('--gold', .9)}"/>`;
    s += `<path d="M40 74C90 56 150 52 200 52C250 52 310 56 360 74" style="${S('--gold', 1.2)};opacity:.8"/>`;
    s += flower(200, 82, 15, 1.25) + flower(96, 88, 12, .8) + flower(304, 88, 12, .8);
    s += `<rect x="0" y="0" width="400" height="150" style="fill:url(#sh${id})"/></g>`;
    s += `<ellipse cx="200" cy="48" rx="36" ry="7" style="fill:url(#br${id})"/>`;
    s += `<path d="M182 48C182 33 188 24 200 24C212 24 218 33 218 48Z" style="fill:url(#br${id})"/>`;
    s += `<ellipse cx="200" cy="24" rx="7" ry="3" style="${F('--gold-hi')}"/>`;
    return s + '</svg>';
  }
  function frameSVG() {
    const id = 'fr';
    let s = `<svg viewBox="-30 -200 460 690" aria-hidden="true" focusable="false"><defs>${shadeDefs(id)}</defs>`;
    s += `<path d="M-14 450V-158Q-14 -184 12 -184H388Q414 -184 414 -158V450" style="fill:none;stroke:url(#br${id});stroke-width:8;stroke-linecap:round;stroke-linejoin:round"/>`;
    s += `<rect x="146" y="-196" width="108" height="24" rx="12" style="${F('--night')};stroke:var(--gold);stroke-width:2"/>`;
    s += `<rect x="138" y="-192" width="10" height="16" rx="3" style="fill:url(#br${id})"/><rect x="252" y="-192" width="10" height="16" rx="3" style="fill:url(#br${id})"/>`;
    s += `<rect x="-22" y="440" width="16" height="14" rx="3" style="fill:url(#br${id})"/><rect x="406" y="440" width="16" height="14" rx="3" style="fill:url(#br${id})"/>`;
    return s + '</svg>';
  }
  function ghostSVG() {
    return `<svg viewBox="-30 0 460 124" aria-hidden="true" focusable="false"><path d="${BODY}" style="fill:rgba(201,161,74,.05);stroke:var(--gold-hi);stroke-width:1.6;stroke-dasharray:7 7"/></svg>`;
  }

  /* typographic plate: a blue-and-white porcelain plate with the dish monogram and its name around the rim */
  let uidN = 0;
  function plateG(d, c, idx, text) {
    const u = 'p' + (++uidN);
    let s = `<circle r="77" style="${F('--porcelain')}"/><circle r="72" style="${S('--cobalt', 9)}"/>`;
    for (let k = 0; k < 30; k++) s += `<path d="M0 -76.2 2.4 -72 0 -67.8 -2.4 -72Z" transform="rotate(${k * 12})" style="${F('--porcelain')}"/>`;
    s += `<circle r="63.5" style="${S('--gold', 1.3)}"/><circle r="62" style="${F('--porcelain')}"/><circle r="40" style="${S('--cobalt', .6)};opacity:.35"/>`;
    if (text) {
      const top = (d.local || d.name).toUpperCase();
      const bot = `${c.short} · ${pad2(c.n)}.${pad2(idx + 1)}`.toUpperCase();
      const fs1 = Math.min(9.2, 112 / (top.length * .7)), fs2 = Math.min(7.4, 74 / (bot.length * .7));
      s += `<path id="${u}a" d="M-50 0A50 50 0 0 1 50 0" fill="none"/><path id="${u}b" d="M-55 0A55 55 0 0 0 55 0" fill="none"/>`;
      s += `<text class="pl-arc" style="${F('--cobalt')};font-size:${fs1.toFixed(2)}px"><textPath href="#${u}a" startOffset="50%" text-anchor="middle" textLength="112" lengthAdjust="spacing">${esc(top)}</textPath></text>`;
      s += `<text class="pl-arc" style="fill:var(--gold-lo);font-size:${fs2.toFixed(2)}px"><textPath href="#${u}b" startOffset="50%" text-anchor="middle" textLength="74" lengthAdjust="spacing">${esc(bot)}</textPath></text>`;
    }
    s += `<text class="pl-mono" y="17" text-anchor="middle" style="${F('--cobalt')};font-size:50px">${esc(d.name.charAt(0))}</text>`;
    s += `<path d="M0 26l3 4-3 4-3-4z" style="${F('--gold')}"/>`;
    return s;
  }
  function plateCard(d, c, idx) {
    const P = PAL[c.n - 1], u = 'q' + (++uidN);
    const tile = P.dark ? '../assets/pattern/tile-gold.svg' : '../assets/pattern/tile-cobalt.svg';
    return `<svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><pattern id="${u}" width="44" height="44" patternUnits="userSpaceOnUse" x="12" y="18"><image href="${tile}" width="44" height="44"/></pattern>
      <radialGradient id="${u}g" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#0c1433" stop-opacity=".25"/></radialGradient></defs>
      <rect width="200" height="250" style="${F(P.g)}"/><rect width="200" height="250" style="fill:url(#${u});opacity:${P.dark ? .55 : .3}"/><rect width="200" height="250" style="fill:url(#${u}g)"/>
      <ellipse cx="100" cy="226" rx="74" ry="9" style="fill:#0c1433;opacity:.25"/>
      <g transform="translate(100 140)">${plateG(d, c, idx, true)}</g></svg>`;
  }
  function plateDisc(d, c, idx) {
    return `<svg viewBox="-80 -80 160 160" aria-hidden="true" focusable="false">${plateG(d, c, idx, false)}</svg>`;
  }
  function visual(id, kind) {
    const { d, c, di } = DISH[id];
    if (d.photo) {
      const src = kind === 'sheet' ? d.photo.lg : d.photo.src;
      const alt = kind === 'sheet' ? esc(d.photo.alt) : '';
      return `<img src="${src}" alt="${alt}" width="${d.photo.w}" height="${d.photo.h}" style="object-position:${d.photo.pos}" decoding="async" draggable="false">`;
    }
    return kind === 'disc' ? plateDisc(d, c, di) : plateCard(d, c, di);
  }

  /* ---------------------------------------------------------------- state */
  const state = { mode: 'tingkat', open: -1, busy: false, sheet: null };
  const T = { guests: 4, ids: [], rot: 0 };
  try {
    const sv = JSON.parse(localStorage.getItem('ag-menu-table') || 'null');
    if (sv && Array.isArray(sv.ids)) { T.ids = sv.ids.filter(id => DISH[id]); T.guests = Math.min(12, Math.max(1, sv.guests | 0 || 4)); }
  } catch (e) { /* storage blocked: start empty */ }
  const save = () => { try { localStorage.setItem('ag-menu-table', JSON.stringify({ ids: T.ids, guests: T.guests })); } catch (e) { /* ignore */ } };

  /* ================================================================ 1. THE TINGKAT */
  const stage = $('#stage'), tk = $('#tk'), tkBox = $('#tkBox'), arch = $('#arch'), floorEl = $('.floor'), bg = $('.stage__bg');
  const callouts = $('#callouts'), intro = $('#intro');
  const spread = $('#spread'), tray = $('#tray'), spreadIn = $('#spreadIn'), rail = $('#rail'), railList = $('#railList');
  const tiers = [], cos = [];
  const shadow = document.createElement('div'); shadow.className = 'tk__shadow'; tk.appendChild(shadow);
  for (let i = N - 1; i >= 0; i--) {
    const t = document.createElement('div');
    t.className = 'tier'; t.dataset.i = i; t.style.zIndex = 10 + (N - i) * 2;
    t.innerHTML = tierSVG(i) + '<span class="tier__hit"></span>';
    tk.appendChild(t); tiers[i] = t;
  }
  const lid = document.createElement('div'); lid.className = 'tk__lid'; lid.style.zIndex = 40; lid.innerHTML = lidSVG(); tk.appendChild(lid);
  const frame = document.createElement('div'); frame.className = 'tk__frame'; frame.style.zIndex = 42; frame.innerHTML = frameSVG(); tk.appendChild(frame);
  const ghost = document.createElement('div'); ghost.className = 'tk__ghost'; ghost.style.zIndex = 9; ghost.innerHTML = ghostSVG(); tk.appendChild(ghost);
  const steam = document.createElement('div'); steam.className = 'tk__steam'; steam.style.zIndex = 8;
  steam.innerHTML = '<svg viewBox="0 0 460 200" aria-hidden="true"><path d="M200 190C186 160 214 140 200 110S214 60 200 30"/><path d="M232 190C220 166 244 148 232 124S244 84 234 58"/><path d="M168 190C156 168 180 150 168 128S178 92 170 70"/></svg>';
  tk.appendChild(steam);

  CH.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="co" data-i="${i}" aria-controls="spread" aria-expanded="false">
      <span class="co__n" aria-hidden="true">${pad2(c.n)}</span><span class="co__tx"><span class="co__t"><span class="s-long">${esc(c.title)}</span><span class="s-short">${esc(c.short)}</span></span>
      <span class="co__c">${c.dishes.length} ${plural(c.dishes.length, 'dish', 'dishes')}</span></span>
      <span class="sr-only">Lift tier ${c.n} of ${N}: ${esc(c.title)}, ${c.dishes.length} dishes</span></button>`;
    callouts.appendChild(li); cos[i] = li.firstElementChild;
  });
  $$('.co__n, .co__tx', callouts).forEach(el => el.setAttribute('aria-hidden', 'true'));

  // geometry, all in px except the *U values (tier units, scaled by s)
  const geo = { cx: 0, y0: 0, s: 1, upK: -1, upU: 0, frameYU: 0, frameOp: 1, outK: -1, outYU: 0, outSc: 1, outOp: 1, ghostOp: 0, hk: -1, hv: 0,
    dy: [0, 0, 0, 0, 0, 0, 0, 0], al: [1, 1, 1, 1, 1, 1, 1, 1] };
  const H_UNITS = 700;
  const coBox = () => { let w = 0; cos.forEach(b => { w = Math.max(w, b.offsetWidth); }); return w; };
  function target() {
    const sr = stage.getBoundingClientRect(), br = tkBox.getBoundingClientRect();
    const b = { x: br.left - sr.left, y: br.top - sr.top, w: br.width, h: br.height };
    const mobile = innerWidth < 900, cw = coBox();
    let s, cx;
    const sh = (b.h - (mobile ? 12 : 56)) / H_UNITS;
    if (mobile) {
      s = Math.max(.3, Math.min(sh, (b.w - 32 - 10 - cw) / 444, .62));
      cx = b.x + 16 + 222 * s + Math.max(0, (b.w - 32 - 10 - cw - 444 * s) * .3);
    } else if (state.open >= 0) {
      s = Math.max(.3, Math.min(sh, (b.w - 10 - cw - 8) / 444, .72));
      cx = b.x + 222 * s + 4;
    } else {
      s = Math.max(.4, Math.min(sh, (b.w - 40 - 12 - cw) / 444, 1.32));
      const gw = 444 * s + 12 + cw;
      cx = b.x + (b.w - gw) / 2 + 222 * s;
    }
    const y0 = b.y + (b.h - H_UNITS * s) / 2 + 205 * s;
    return { s, cx, y0 };
  }
  const coH = [];
  function render() {
    const { s, cx, y0 } = geo, L = cx - 230 * s;
    const lift = i => (geo.upK >= 0 && i < geo.upK ? -geo.upU * s : 0) + (geo.hk >= 0 && i <= geo.hk ? -geo.hv : 0);
    for (let i = 0; i < N; i++) {
      let y = y0 + i * 74 * s + lift(i) + geo.dy[i], x = L, sc = s, op = geo.al[i];
      if (i === geo.outK) { y += geo.outYU * s; sc = s * geo.outSc; x = cx - 230 * sc; op *= geo.outOp; }
      tiers[i].style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${sc.toFixed(4)})`;
      tiers[i].style.opacity = op;
      const cy = y0 + i * 74 * s + lift(i) + geo.dy[i] + 81 * s;
      cos[i].style.transform = `translate3d(${(cx + 224 * s + 4).toFixed(1)}px,${(cy - (coH[i] || 40) / 2).toFixed(1)}px,0)`;
    }
    const lidLift = (geo.upK >= 0 ? -geo.upU * s : 0) + (geo.hk >= 0 ? -geo.hv : 0);
    lid.style.transform = `translate3d(${L}px,${y0 - 106 * s + lidLift + geo.dy[6]}px,0) scale(${s})`;
    lid.style.opacity = geo.al[6];
    frame.style.transform = `translate3d(${L}px,${y0 - 200 * s + geo.frameYU * s + (geo.hk >= 0 ? -geo.hv : 0) + geo.dy[7]}px,0) scale(${s})`;
    frame.style.opacity = geo.frameOp * geo.al[7];
    shadow.style.transform = `translate3d(${cx - 250 * s}px,${y0 + 452 * s}px,0) scale(${(500 * s / 460).toFixed(4)},${s})`;
    if (geo.upK >= 0) {
      ghost.style.transform = `translate3d(${L}px,${y0 + geo.upK * 74 * s}px,0) scale(${s})`;
      steam.style.transform = `translate3d(${L}px,${y0 + geo.upK * 74 * s - 168 * s - geo.upU * s * .3}px,0) scale(${s})`;
    } else {
      steam.style.transform = `translate3d(${L}px,${y0 - 106 * s - 186 * s + lidLift}px,0) scale(${s})`;
    }
    ghost.style.opacity = geo.ghostOp;
    const aw = 460 * s * 1.46, ah = 745 * s;
    arch.style.width = aw + 'px'; arch.style.height = ah + 'px';
    arch.style.transform = `translate3d(${cx - aw / 2}px,${y0 - 262 * s}px,0)`;
    floorEl.style.top = (y0 + 468 * s) + 'px';
    bg.style.setProperty('--cx', cx + 'px');
  }
  function measureCo() { cos.forEach((b, i) => { coH[i] = b.offsetHeight; }); }
  function fit(dur) {
    if (state.mode !== 'tingkat') return;
    measureCo();
    const t = target();
    if (!dur) { Object.assign(geo, t); render(); return null; }
    return G.to(geo, { ...t, duration: dur, ease: 'power3.inOut', onUpdate: render });
  }

  // hover = start to lift that tier (and everything above it)
  let hoverTw = null;
  function hot(i, on) {
    if (state.busy || state.open >= 0 && innerWidth >= 900 && false) return;
    tiers.forEach((t, k) => t.classList.toggle('is-hot', on && k === i));
    cos.forEach((b, k) => b.classList.toggle('is-hot', on && k === i));
    if (state.open >= 0) return;
    if (hoverTw) hoverTw.kill();
    if (on) { geo.hk = i; hoverTw = G.to(geo, { hv: 9, duration: .35, ease: 'power2.out', onUpdate: render }); }
    else hoverTw = G.to(geo, { hv: 0, duration: .3, ease: 'power2.out', onUpdate: render, onComplete: () => { geo.hk = -1; render(); } });
  }
  tiers.forEach((t, i) => {
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hot(i, true); });
    t.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hot(i, false); });
    // click or drag a tier upwards / sideways to lift it off the stack
    t.addEventListener('pointerdown', e => {
      if (state.busy) return;
      const x0 = e.clientX, y0p = e.clientY; let moved = false;
      t.setPointerCapture(e.pointerId);
      if (hoverTw) hoverTw.kill();
      geo.hk = i;
      const mv = ev => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0p;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        if (state.open < 0) { geo.hv = Math.max(0, Math.min(70, -dy * .6 + Math.abs(dx) * .15)); render(); }
      };
      const up = ev => {
        t.removeEventListener('pointermove', mv); t.removeEventListener('pointerup', up); t.removeEventListener('pointercancel', up);
        const dx = ev.clientX - x0, dy = ev.clientY - y0p;
        if (!moved || -dy > 34 || Math.abs(dx) > 60) { openTier(i, { from: 'pointer' }); }
        else if (state.open < 0) G.to(geo, { hv: 0, duration: .5, ease: 'back.out(2.2)', onUpdate: render, onComplete: () => { geo.hk = -1; } });
      };
      t.addEventListener('pointermove', mv); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up);
    });
  });
  cos.forEach((b, i) => {
    b.addEventListener('click', () => openTier(i));
    b.addEventListener('pointerenter', () => hot(i, true));
    b.addEventListener('pointerleave', () => hot(i, false));
    b.addEventListener('focus', () => hot(i, true));
    b.addEventListener('blur', () => hot(i, false));
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); cos[(i + (e.key === 'ArrowDown' ? 1 : N - 1)) % N].focus(); }
    });
  });

  // spread content
  const spTitle = $('#spTitle'), spNo = $('#spNo'), spLine = $('#spLine'), spCount = $('#spCount'), spTiers = $('#spTiers');
  spTiers.innerHTML = CH.map((c, i) => `<button type="button" data-i="${i}" aria-label="Tier ${c.n}: ${esc(c.title)}">${pad2(c.n)}</button>`).join('');
  spTiers.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openTier(+b.dataset.i); });
  function buildSpread(k) {
    const c = CH[k], P = PAL[k];
    spread.style.setProperty('--tray', `var(${P.g})`);
    spread.style.setProperty('--tray-pat', `url("../assets/pattern/${P.dark ? 'tile-gold' : 'tile-cobalt'}.svg")`);
    spNo.textContent = `Tier ${pad2(c.n)} of ${pad2(N)}`;
    spTitle.textContent = c.title;
    spLine.textContent = c.line;
    spCount.textContent = `${c.dishes.length} ${plural(c.dishes.length, 'dish', 'dishes')}`;
    $$('button', spTiers).forEach((b, i) => b.setAttribute('aria-current', i === k ? 'true' : 'false'));
    $('#tierPrev').disabled = k === 0; $('#tierNext').disabled = k === N - 1;
    railList.innerHTML = c.dishes.map((d, i) => `<li class="card${T.ids.includes(d.id) ? ' is-placed' : ''}" data-id="${d.id}">
      <button type="button" class="card__b" data-id="${d.id}"><span class="card__frame">${visual(d.id, 'card')}</span>
      <span class="card__meta"><span class="card__no">${pad2(c.n)}.${pad2(i + 1)}</span><span class="card__name">${esc(d.name)}</span>
      <span class="card__local">${esc(d.local)}</span>${d.pick ? `<span class="card__pick">${SPARK}Inspectors' pick</span>` : ''}
      <span class="card__onTable">On your table</span></span></button></li>`).join('');
    rail.scrollLeft = 0;
    cos.forEach((b, i) => { b.classList.toggle('is-on', i === k); b.setAttribute('aria-expanded', i === k ? 'true' : 'false'); });
    railArrows();
  }
  const hitOf = k => tiers[k].querySelector('.tier__hit');

  function openTier(k, opts = {}) {
    if (k < 0 || k >= N) return;
    if (state.mode !== 'tingkat') setMode('tingkat', { instant: true });
    if (state.busy) return;
    if (state.open === k) { spTitle.focus({ preventScroll: true }); return; }
    if (state.open >= 0) { closeTier({ swap: k }); return; }
    state.busy = true; state.open = k;
    hot(k, false); if (hoverTw) hoverTw.kill(); geo.hv = 0; geo.hk = -1;
    buildSpread(k);
    const desktop = innerWidth >= 900;
    geo.upK = k; geo.outK = k;
    const tl = G.timeline({ onComplete: () => { state.busy = false; if (!opts.noFocus) spTitle.focus({ preventScroll: true }); } });
    tl.to(geo, { upU: 66, frameYU: -64, frameOp: .25, outYU: 16, outSc: 1.05, duration: opts.fast ? .3 : .5, ease: 'power2.out', onUpdate: render });
    if (desktop && !opts.keep) tl.to(intro, { autoAlpha: 0, x: -30, duration: .3, ease: 'power2.in' }, 0);
    tl.add(() => {
      stage.classList.add('is-open');
      spread.hidden = false;
      G.set([spreadIn], { autoAlpha: 0 });
      G.set(tray, { clearProps: 'transform' });
      if (desktop) fit(opts.keep ? 0 : .8);
      // the tier becomes the tray (Flip): tray starts exactly on the lifted tier and grows into the spread
      let vars = null;
      if (FLIP) { try { vars = FLIP.fit(tray, hitOf(k), { scale: true, getVars: true }); } catch (e) { vars = null; } }
      const t2 = G.timeline();
      t2.to(geo, { outOp: 0, duration: .18, onUpdate: render }, .05);
      if (vars) t2.fromTo(tray, { ...vars, transformOrigin: '0 0' }, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: .8, ease: 'power3.inOut' }, 0);
      else t2.fromTo(tray, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 }, 0);
      t2.to(geo, { ghostOp: 1, duration: .4, onUpdate: render }, .4);
      t2.fromTo(spreadIn, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out' }, .62);
      t2.fromTo($$('.card', railList), { autoAlpha: 0, y: 46, rotation: (i) => (i % 2 ? 2.5 : -2.5) }, { autoAlpha: 1, y: 0, rotation: 0, duration: .6, ease: 'power3.out', stagger: .06 }, .7);
      tl.add(t2);
    });
    history.replaceState(null, '', '#tier-' + CH[k].id);
  }
  function closeTier(opts = {}) {
    const k = state.open;
    if (k < 0 || state.busy) return;
    state.busy = true;
    if (state.sheet) closeDish(true);
    const desktop = innerWidth >= 900, swap = opts.swap != null;
    const tl = G.timeline({ onComplete: () => {
      spread.hidden = true; G.set(tray, { clearProps: 'transform' });
      cos[k].setAttribute('aria-expanded', 'false');
      state.busy = false;
      if (swap) openTier(opts.swap, { keep: true, fast: true });
      else if (!opts.noFocus) cos[k].focus({ preventScroll: true });
    } });
    tl.to(spreadIn, { autoAlpha: 0, y: 12, duration: .22, ease: 'power2.in' });
    tl.add(() => {
      let vars = null;
      if (FLIP) { try { vars = FLIP.fit(tray, hitOf(k), { scale: true, getVars: true }); } catch (e) { vars = null; } }
      const t2 = G.timeline();
      if (vars) t2.to(tray, { ...vars, duration: swap ? .45 : .6, ease: 'power3.inOut' });
      else t2.to(tray, { autoAlpha: 0, duration: .3 });
      t2.to(geo, { outOp: 1, ghostOp: 0, duration: .16, onUpdate: render }, '-=.12');
      t2.set(tray, { autoAlpha: 0 });
      tl.add(t2);
    });
    tl.add(() => {
      G.set(tray, { autoAlpha: 1 });
      if (!swap) {
        stage.classList.remove('is-open');
        cos.forEach(b => b.classList.remove('is-on'));
        if (desktop) { fit(.75); G.fromTo(intro, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: .5, delay: .35, ease: 'power2.out' }); }
      }
    });
    tl.to(geo, { upU: 0, frameYU: 0, frameOp: 1, outYU: 0, outSc: 1, duration: swap ? .3 : .55, ease: 'back.out(1.4)', onUpdate: render }, swap ? '>' : '>.15');
    tl.add(() => { geo.upK = -1; geo.outK = -1; render(); });
    if (!swap) history.replaceState(null, '', '#tingkat');
    state.open = -1;
  }
  $('#spClose').addEventListener('click', () => closeTier());
  $('#tierPrev').addEventListener('click', () => { if (state.open > 0) openTier(state.open - 1); });
  $('#tierNext').addEventListener('click', () => { if (state.open >= 0 && state.open < N - 1) openTier(state.open + 1); });
  $$('[data-open-tier]').forEach(b => b.addEventListener('click', () => openTier(+b.dataset.openTier)));

  // rail: drag, wheel, arrows, keyboard
  let railDrag = null, railMoved = false;
  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    railDrag = { x: e.clientX, sl: rail.scrollLeft }; railMoved = false;
  });
  addEventListener('pointermove', e => {
    if (!railDrag) return;
    const dx = e.clientX - railDrag.x;
    if (Math.abs(dx) > 5) { railMoved = true; rail.classList.add('is-drag'); }
    if (railMoved) rail.scrollLeft = railDrag.sl - dx;
  });
  addEventListener('pointerup', () => { if (railDrag) { railDrag = null; rail.classList.remove('is-drag'); } });
  rail.addEventListener('click', e => { if (railMoved) { e.preventDefault(); e.stopPropagation(); railMoved = false; } }, true);
  rail.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && rail.scrollWidth > rail.clientWidth) { rail.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });
  function railArrows() {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    $('#railPrev').disabled = rail.scrollLeft <= 2;
    $('#railNext').disabled = rail.scrollLeft >= max;
  }
  rail.addEventListener('scroll', railArrows, { passive: true });
  const railStep = dir => { const c = $('.card', railList); const w = c ? c.offsetWidth + 28 : 300; rail.scrollBy({ left: dir * w * 2, behavior: RM ? 'auto' : 'smooth' }); };
  $('#railPrev').addEventListener('click', () => railStep(-1));
  $('#railNext').addEventListener('click', () => railStep(1));
  railList.addEventListener('click', e => { const b = e.target.closest('.card__b'); if (b) openDish(b.dataset.id, b.querySelector('.card__frame')); });
  railList.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const bs = $$('.card__b', railList), i = bs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const n = bs[Math.max(0, Math.min(bs.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))];
    n.focus({ preventScroll: true }); n.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: RM ? 'auto' : 'smooth' });
  });

  // entrance: the tingkat is stacked tier by tier, bottom first, then the lid, then the carrier clicks in
  function entrance() {
    if (RM) return;
    const order = [5, 4, 3, 2, 1, 0, 6, 7];
    order.forEach(i => { geo.dy[i] = -window.innerHeight * .9; geo.al[i] = 0; });
    render();
    const tl = G.timeline({ delay: .2 });
    order.forEach((i, n) => {
      const o = { v: geo.dy[i], a: 0 };
      tl.to(o, { v: 0, a: 1, duration: i === 7 ? .5 : .62, ease: i === 7 ? 'power2.out' : 'back.out(1.15)', onUpdate: () => { geo.dy[i] = o.v; geo.al[i] = Math.min(1, o.a * 1.6); render(); } }, n * .09);
    });
    tl.from($$('li', callouts), { autoAlpha: 0, x: -14, duration: .5, stagger: .05, ease: 'power2.out' }, '-=.3');
    G.from($$('.intro > *'), { autoAlpha: 0, y: 22, duration: .8, stagger: .07, ease: 'power3.out', delay: .1 });
  }
  function steamLoop() {
    if (RM) return;
    $$('path', steam).forEach((p, i) => {
      G.timeline({ repeat: -1, delay: i * .9 })
        .fromTo(p, { y: 24, opacity: 0 }, { y: -4, opacity: .75, duration: 1.4, ease: 'sine.out' })
        .to(p, { y: -36, opacity: 0, duration: 1.4, ease: 'sine.in' });
    });
  }

  /* ================================================================ DISH SHEET */
  const sheet = $('#sheet'), panel = $('#sheetPanel'), shVis = $('#shVis'), shTxt = $('#shTxt'), shPlace = $('#shPlace');
  const shBg = document.createElement('div'); shBg.className = 'sheet__bg';
  panel.insertBefore(shBg, panel.firstChild);
  let lastFocus = null, sheetFrom = null;
  function fillSheet(id) {
    const { d, c, di } = DISH[id];
    state.sheet = id;
    $('#shCh').textContent = `${pad2(c.n)} · ${c.title}`;
    $('#shName').textContent = d.name;
    $('#shLocal').innerHTML = `<span>${esc(d.local)}</span>${d.zh ? `<span class="zh" lang="zh-Hans">${esc(d.zh)}</span>` : ''}`;
    $('#shDesc').textContent = d.desc;
    $('#shPick').hidden = !d.pick;
    shVis.innerHTML = visual(id, 'sheet');
    $('#shPos').textContent = `${di + 1} / ${c.dishes.length}`;
    $('#shPrev').disabled = di === 0; $('#shNext').disabled = di === c.dishes.length - 1;
    syncPlaceBtn();
  }
  function syncPlaceBtn() {
    if (!state.sheet) return;
    const on = T.ids.includes(state.sheet);
    shPlace.setAttribute('aria-pressed', on ? 'true' : 'false');
    shPlace.textContent = on ? 'On your table · remove' : 'Place on the table';
  }
  function openDish(id, fromEl) {
    if (!DISH[id]) return;
    lastFocus = document.activeElement;
    sheetFrom = fromEl || null;
    fillSheet(id);
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    G.set([shVis, shTxt, shBg, '.sheet__scrim', '.sheet__x'], { clearProps: 'transform,opacity,visibility,width,height,x,y' });
    const W0 = shVis.offsetWidth, H0 = shVis.offsetHeight;
    const tl = G.timeline();
    tl.fromTo('.sheet__scrim', { autoAlpha: 0 }, { autoAlpha: 1, duration: .35 }, 0);
    tl.fromTo(shBg, { autoAlpha: 0, scale: .97 }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'power2.out' }, .12);
    let vars = null;
    if (FLIP && fromEl && fromEl.isConnected && fromEl.getBoundingClientRect().width) {
      try { vars = FLIP.fit(shVis, fromEl, { scale: false, getVars: true }); } catch (e) { vars = null; }
    }
    if (vars) {
      if (fromEl.closest('.card')) tl.to(fromEl, { rotationY: 90, duration: .22, ease: 'power2.in' }, 0).set(fromEl, { autoAlpha: 0, rotationY: 0 }, .22);
      tl.fromTo(shVis, { ...vars }, { x: 0, y: 0, width: W0, height: H0, duration: .7, ease: 'power3.inOut', clearProps: 'width,height,x,y,transform' }, 0);
    } else tl.fromTo(shVis, { autoAlpha: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .45 }, .1);
    tl.fromTo(shTxt.children, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .5, stagger: .04, ease: 'power2.out' }, .35);
    tl.fromTo('.sheet__x', { autoAlpha: 0 }, { autoAlpha: 1, duration: .3 }, .4);
    $('#shName').focus({ preventScroll: true });
    say(`${DISH[id].d.name}. ${DISH[id].d.desc}`);
    if (state.mode === 'tingkat') history.replaceState(null, '', '#dish-' + id);
  }
  function closeDish(instant) {
    if (!state.sheet) return;
    const id = state.sheet; state.sheet = null;
    const from = sheetFrom && sheetFrom.isConnected ? sheetFrom : null;
    const done = () => {
      sheet.hidden = true; document.body.style.overflow = '';
      G.set([shVis, shTxt.children, shBg], { clearProps: 'transform,opacity,visibility,width,height,x,y' });
      if (from) G.set(from, { autoAlpha: 1, rotationY: 0 });
      if (from && from.closest('.card') && !instant) G.fromTo(from, { rotationY: -90 }, { rotationY: 0, duration: .35, ease: 'power2.out' });
      if (!instant && lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
      if (state.mode === 'tingkat' && state.open >= 0) history.replaceState(null, '', '#tier-' + CH[state.open].id);
    };
    if (instant || RM) { done(); return; }
    const tl = G.timeline({ onComplete: done });
    tl.to([shTxt.children, '.sheet__x'], { autoAlpha: 0, duration: .18 }, 0);
    let vars = null;
    if (FLIP && from && DISH[id].c === (DISH[from.closest('[data-id]') ? from.closest('[data-id]').dataset.id : id] || {}).c) {
      G.set(from, { autoAlpha: 0 });
      try { vars = FLIP.fit(shVis, from, { scale: false, getVars: true }); } catch (e) { vars = null; }
    }
    if (vars) tl.to(shVis, { ...vars, duration: .55, ease: 'power3.inOut' }, .08);
    else tl.to(shVis, { autoAlpha: 0, duration: .25 }, 0);
    tl.to(shBg, { autoAlpha: 0, scale: .98, duration: .3 }, .12);
    tl.to('.sheet__scrim', { autoAlpha: 0, duration: .3 }, .25);
  }
  function stepDish(dir) {
    if (!state.sheet) return;
    const { c, di } = DISH[state.sheet];
    const n = di + dir;
    if (n < 0 || n >= c.dishes.length) return;
    const id = c.dishes[n].id;
    // keep the card under the sheet in sync so closing flies back to the right card
    if (sheetFrom && sheetFrom.closest('.card')) { G.set(sheetFrom, { autoAlpha: 1 }); }
    const card = railList.querySelector(`.card[data-id="${id}"] .card__frame`);
    if (card && state.open === DISH[id].ci) { sheetFrom = card; G.set(card, { autoAlpha: 0 }); card.closest('.card').scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
    else sheetFrom = null;
    G.timeline()
      .to([shVis, shTxt.children], { autoAlpha: 0, x: -dir * 18, duration: .16, ease: 'power1.in' })
      .add(() => { fillSheet(id); })
      .fromTo([shVis, shTxt.children], { autoAlpha: 0, x: dir * 18 }, { autoAlpha: 1, x: 0, duration: .3, ease: 'power2.out', stagger: .02 });
    say(`${DISH[id].d.name}. ${DISH[id].d.desc}`);
    if (state.mode === 'tingkat') history.replaceState(null, '', '#dish-' + id);
  }
  sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDish(); });
  $('#shPrev').addEventListener('click', () => stepDish(-1));
  $('#shNext').addEventListener('click', () => stepDish(1));
  shPlace.addEventListener('click', () => { if (state.sheet) toggleDish(state.sheet, shVis); });
  sheet.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const f = $$('button:not([disabled]), a[href], [tabindex="0"]', panel).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ================================================================ 2. SET THE TABLE */
  const ttTable = $('#ttTable'), ttSusan = $('#ttSusan'), ttRot = $('#ttRot'), ttPlates = $('#ttPlates'), ttSettings = $('#ttSettings');
  const plateEls = {}, labEls = {}, ttLabels = $('#ttLabels');
  let tableBuilt = false, pickTab = 1;
  const isDrink = id => !!DISH[id].c.drinks;
  const sug = g => g <= 2 ? [g, g + 1] : g <= 6 ? [g, g + 1] : [g - 1, g];

  function buildTable() {
    tableBuilt = true;
    $('#pickTabs').innerHTML = CH.map((c, i) => `<button type="button" class="ptab" role="tab" id="ptab-${i}" aria-selected="${i === pickTab}" aria-controls="pickChips" tabindex="${i === pickTab ? 0 : -1}"><b>${pad2(c.n)}</b>${esc(c.short)}</button>`).join('');
    renderChips();
    layoutSeats(false);
    layoutPlates(false);
  }
  function renderChips() {
    const c = CH[pickTab];
    const ul = $('#pickChips');
    ul.setAttribute('aria-labelledby', 'ptab-' + pickTab);
    ul.innerHTML = c.dishes.map(d => `<li><button type="button" class="chip" data-id="${d.id}" aria-pressed="${T.ids.includes(d.id)}"><span class="chip__th">${visual(d.id, 'disc')}</span><span>${esc(d.name)}</span>${CHECK}</button></li>`).join('');
  }
  $('#pickTabs').addEventListener('click', e => { const b = e.target.closest('.ptab'); if (!b) return; selectTab(+b.id.split('-')[1]); });
  $('#pickTabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault(); selectTab((pickTab + (e.key === 'ArrowRight' ? 1 : N - 1)) % N); $('#ptab-' + pickTab).focus();
  });
  function selectTab(i) {
    pickTab = i;
    $$('.ptab').forEach((b, k) => { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
    renderChips();
    G.from($$('.chip'), { autoAlpha: 0, y: 8, duration: .3, stagger: .025, ease: 'power2.out' });
  }
  $('#pickChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) toggleDish(b.dataset.id, b.querySelector('.chip__th')); });

  function layoutSeats(animate) {
    const D = ttTable.offsetWidth, r = D / 2 * .87, g = T.guests;
    const have = $$('.seat', ttSettings);
    for (let i = have.length; i < g; i++) {
      const s = document.createElement('div'); s.className = 'seat';
      s.innerHTML = `<div class="seat__in" style="transform:translateY(${-r}px)"><span class="seat__plate"></span><span class="seat__sticks"></span></div>`;
      ttSettings.appendChild(s);
      G.set(s, { rotation: (i / g) * 360 });
      if (animate) G.from(s.firstElementChild, { autoAlpha: 0, scale: .4, duration: .45, ease: 'back.out(2)' });
    }
    const seats = $$('.seat', ttSettings);
    seats.forEach((s, i) => {
      s.firstElementChild.style.transform = `translateY(${-r}px)`;
      if (i >= g) { G.to(s.firstElementChild, { autoAlpha: 0, scale: .4, duration: animate ? .3 : 0, onComplete: () => s.remove() }); return; }
      G.to(s, { rotation: (i / g) * 360 + 180 / g, duration: animate ? .6 : 0, ease: 'power3.out' });
    });
  }
  function discHTML(id) { return `<span class="plate__disc">${visual(id, 'disc')}</span>`; }
  function ensurePlate(id) {
    if (plateEls[id]) return plateEls[id];
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'plate'; b.dataset.id = id;
    b.setAttribute('aria-label', `${DISH[id].d.name}, on the table. Open the dish`);
    b.innerHTML = discHTML(id);
    const lb = document.createElement('span'); lb.className = 'plate__lbl'; lb.setAttribute('aria-hidden', 'true'); lb.textContent = DISH[id].d.name;
    ttLabels.appendChild(lb); labEls[id] = lb;
    ttPlates.appendChild(b); plateEls[id] = b;
    return b;
  }
  function plateGeom(n) {
    const R = ttSusan.offsetWidth / 2;
    const ring = n <= 1 ? 0 : R * (n <= 3 ? .44 : n <= 6 ? .53 : .6);
    const ps = n <= 1 ? R * .64 : Math.min(R * .56, (2 * Math.PI * ring / n) * .86);
    return { R, ring, ps };
  }
  function layoutPlates(animate, fresh) {
    const ids = T.ids, n = ids.length, { ring, ps } = plateGeom(n);
    Object.keys(plateEls).forEach(id => {
      if (!ids.includes(id)) {
        const el = plateEls[id], lb = labEls[id]; delete plateEls[id]; delete labEls[id];
        G.to(lb, { autoAlpha: 0, duration: animate ? .2 : 0, onComplete: () => lb.remove() });
        G.to(el, { autoAlpha: 0, scale: .5, duration: animate ? .35 : 0, ease: 'power2.in', onComplete: () => el.remove() });
      }
    });
    ttLabels.classList.toggle('is-crowded', n > 9);
    ids.forEach((id, i) => {
      const el = ensurePlate(id), a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = ring * Math.cos(a), y = ring * Math.sin(a);
      el.style.setProperty('--ps', ps.toFixed(1) + 'px'); el.dataset.ps = ps;
      if (animate && id !== fresh) G.to(el, { x, y, duration: .65, ease: 'power3.out', onUpdate: applyRot });
      else G.set(el, { x, y });
    });
    $('#ttEmpty').classList.toggle('is-gone', n > 0);
    applyRot();
  }
  function applyRot() {
    ttRot.style.transform = `rotate(${T.rot.toFixed(2)}deg)`;
    const R = ttSusan.offsetWidth / 2, th = T.rot * Math.PI / 180, co = Math.cos(th), si = Math.sin(th);
    Object.keys(plateEls).forEach(id => {
      const el = plateEls[id], lb = labEls[id]; if (!lb) return;
      const ps = +el.dataset.ps || 100, x = +G.getProperty(el, 'x') || 0, y = +G.getProperty(el, 'y') || 0;
      const rx = x * co - y * si, ry = x * si + y * co;
      lb.style.transform = `translate(${(R + rx).toFixed(1)}px, ${(R + ry + ps / 2 + 8).toFixed(1)}px) translate(-50%, 0)`;
    });
  }
  function nudge(deg) { G.to(T, { rot: T.rot + deg, duration: .9, ease: 'back.out(1.6)', onUpdate: applyRot }); }

  function flyIn(id, fromEl) {
    const el = plateEls[id];
    if (!el || RM || !fromEl || !fromEl.isConnected || $('#view-table').hidden) return;
    const fr = fromEl.getBoundingClientRect(), pr = el.getBoundingClientRect();
    if (!fr.width || !pr.width) return;
    el.style.visibility = 'hidden'; if (labEls[id]) labEls[id].style.visibility = 'hidden';
    const fly = document.createElement('div');
    fly.className = 'flyer'; fly.innerHTML = discHTML(id);
    fly.style.width = pr.width + 'px'; fly.style.height = pr.height + 'px';
    document.body.appendChild(fly);
    const sx = fr.width / pr.width;
    const A = { x: fr.left + fr.width / 2 - pr.width / 2, y: fr.top + fr.height / 2 - pr.height / 2 };
    const B = { x: pr.left, y: pr.top };
    const C = { x: (A.x + B.x) / 2, y: Math.min(A.y, B.y) - 150 };
    let endRot = ((T.rot % 360) + 540) % 360 - 180;
    const o = { t: 0 };
    G.set(fly, { x: A.x, y: A.y, scale: sx });
    G.to(o, { t: 1, duration: .85, ease: 'power2.inOut', onUpdate: () => {
      const t = o.t, u = 1 - t;
      G.set(fly, { x: u * u * A.x + 2 * u * t * C.x + t * t * B.x, y: u * u * A.y + 2 * u * t * C.y + t * t * B.y, scale: sx + (1 - sx) * t, rotation: endRot * t });
    }, onComplete: () => {
      fly.remove(); el.style.visibility = '';
      if (labEls[id]) labEls[id].style.visibility = '';
      G.fromTo(el.firstElementChild, { scale: 1.14 }, { scale: 1, duration: .55, ease: 'back.out(3)' });
      nudge(10);
    } });
  }
  function toggleDish(id, fromEl) { T.ids.includes(id) ? removeDish(id) : addDish(id, fromEl); }
  function addDish(id, fromEl) {
    if (T.ids.includes(id)) return;
    T.ids.push(id); save();
    if (tableBuilt && !$('#view-table').hidden) { layoutPlates(true, id); flyIn(id, fromEl); }
    else if (tableBuilt) layoutPlates(false);
    syncAll();
    const n = T.ids.filter(x => !isDrink(x)).length;
    say(`${DISH[id].d.name} is on your table. ${n} ${plural(n, 'dish', 'dishes')} for ${T.guests}.`);
  }
  function removeDish(id) {
    T.ids = T.ids.filter(x => x !== id); save();
    if (tableBuilt) layoutPlates(!$('#view-table').hidden);
    syncAll();
    say(`${DISH[id].d.name} taken off the table.`);
  }
  function waText() {
    const food = T.ids.filter(id => !isDrink(id)), drinks = T.ids.filter(isDrink);
    let t = `Hello Auntie Gaik Lean's, we are a table of ${T.guests} and are thinking of ordering:\n`;
    food.forEach(id => { t += `- ${DISH[id].d.name}\n`; });
    if (drinks.length) t += `Drinks: ${drinks.map(id => DISH[id].d.name).join(', ')}\n`;
    t += `\nCould you let us know what is on today's menu? Thank you.`;
    return t;
  }
  function syncAll() {
    const g = T.guests, food = T.ids.filter(id => !isDrink(id)), drinks = T.ids.filter(isDrink), n = food.length, [lo, hi] = sug(g);
    $('#gNum').textContent = g;
    $('#gMinus').disabled = g <= 1; $('#gPlus').disabled = g >= 12;
    $('#cNum').textContent = n; $('#cWord').textContent = plural(n, 'dish', 'dishes');
    $('#cDrinks').textContent = drinks.length ? ` · ${drinks.length} ${plural(drinks.length, 'drink', 'drinks')}` : '';
    $('#suggest').textContent = `Our suggestion: for ${g} ${plural(g, 'person', 'people')}, about ${lo}–${hi} dishes plus rice.`;
    let st;
    if (!n) st = 'Start with a curry and a vegetable, then build from there.';
    else if (n < lo) st = `${lo - n === 1 ? 'One more dish' : (lo - n) + ' more dishes'} would suit ${g}.`;
    else if (n <= hi) st = `That looks like a good spread for ${g}.`;
    else st = `A generous table for ${g}. The team can help you size the portions.`;
    $('#status').textContent = st;
    const dots = Math.max(hi, n);
    $('#meter').innerHTML = Array.from({ length: dots }, (_, i) => `<i class="${i < n ? (i >= hi ? 'is-over' : 'is-on') : 'is-sug'}"></i>`).join('');
    $('#ttMini').innerHTML = `${n} ${plural(n, 'dish', 'dishes')} · suggested ${lo}–${hi}<br>for ${g} ${plural(g, 'guest', 'guests')}`;
    const list = $('#ttList');
    list.innerHTML = T.ids.length ? T.ids.map(id => `<li><button type="button" data-id="${id}" aria-label="Take ${esc(DISH[id].d.name)} off the table">${esc(DISH[id].d.name)}${XS}</button></li>`).join('')
      : '<li class="is-empty">Nothing yet. Tap a dish below.</li>';
    const wa = $('#waLink');
    wa.href = `https://wa.me/${M.wa}?text=${encodeURIComponent(waText())}`;
    wa.setAttribute('aria-disabled', T.ids.length ? 'false' : 'true');
    if (!T.ids.length) wa.setAttribute('tabindex', '-1'); else wa.removeAttribute('tabindex');
    $$('.chip').forEach(b => b.setAttribute('aria-pressed', T.ids.includes(b.dataset.id) ? 'true' : 'false'));
    $$('.lv__add').forEach(b => { const on = T.ids.includes(b.dataset.id); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.lastElementChild.textContent = on ? 'On your table' : 'Add to table'; });
    $$('.card', railList).forEach(c => c.classList.toggle('is-placed', T.ids.includes(c.dataset.id)));
    ttSusan.setAttribute('aria-label', `The lazy susan with ${T.ids.length} ${plural(T.ids.length, 'dish', 'dishes')}. Arrow keys turn it.`);
    syncPlaceBtn();
  }
  $('#ttList').addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (b) removeDish(b.dataset.id); });
  $('#gMinus').addEventListener('click', () => setGuests(T.guests - 1));
  $('#gPlus').addEventListener('click', () => setGuests(T.guests + 1));
  function setGuests(g) {
    T.guests = Math.max(1, Math.min(12, g)); save();
    if (tableBuilt) layoutSeats(!$('#view-table').hidden);
    syncAll();
  }
  $('#ttClear').addEventListener('click', () => { if (!T.ids.length) return; T.ids = []; save(); layoutPlates(true); syncAll(); say('The table is clear.'); });
  $('#ttSpin').addEventListener('click', () => G.to(T, { rot: T.rot + 360 + 40 + Math.random() * 80, duration: 2.4, ease: 'power3.out', onUpdate: applyRot }));
  // drag to spin the lazy susan (with a little momentum); a tap on a plate opens the dish
  let spin = null;
  ttSusan.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const r = ttSusan.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ang = ev => Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
    G.killTweensOf(T);
    spin = { a0: ang(e), r0: T.rot, last: ang(e), t: performance.now(), v: 0, moved: 0, ang, plate: e.target.closest('.plate') };
    ttSusan.setPointerCapture(e.pointerId);
  });
  ttSusan.addEventListener('pointermove', e => {
    if (!spin) return;
    const a = spin.ang(e);
    let d = a - spin.last; if (d > 180) d -= 360; if (d < -180) d += 360;
    const now = performance.now(), dt = Math.max(1, now - spin.t);
    spin.v = spin.v * .6 + (d / dt) * 1000 * .4; spin.last = a; spin.t = now; spin.moved += Math.abs(d);
    if (spin.moved > 3) { ttSusan.classList.add('is-drag'); T.rot += d; applyRot(); }
  });
  const spinEnd = () => {
    if (!spin) return;
    const s = spin; spin = null; ttSusan.classList.remove('is-drag');
    if (s.moved <= 3) { if (s.plate) openDish(s.plate.dataset.id, s.plate.querySelector('.plate__disc')); return; }
    if (Math.abs(s.v) > 30) G.to(T, { rot: T.rot + s.v * .45, duration: 1.4, ease: 'power3.out', onUpdate: applyRot });
  };
  ttSusan.addEventListener('pointerup', spinEnd);
  ttSusan.addEventListener('pointercancel', spinEnd);
  ttSusan.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); G.to(T, { rot: T.rot + (e.key === 'ArrowRight' ? 30 : -30), duration: .5, ease: 'power2.out', onUpdate: applyRot }); }
  });
  ttPlates.addEventListener('keydown', e => {
    const p = e.target.closest('.plate');
    if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); openDish(p.dataset.id, p.querySelector('.plate__disc')); }
  });

  /* ================================================================ 3. LIST & SEARCH */
  let listBuilt = false;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and');
  function buildList() {
    listBuilt = true;
    $('#lvJump').innerHTML = CH.map(c => `<a href="#lv-${c.id}" data-jump="${c.id}">${pad2(c.n)} ${esc(c.short)}</a>`).join('');
    $('#lvBody').innerHTML = CH.map(c => `<section class="lv__sec" id="lv-${c.id}" aria-labelledby="lvh-${c.id}">
      <div class="lv__h"><b aria-hidden="true">${pad2(c.n)}</b><h3 id="lvh-${c.id}">${esc(c.title)}</h3><p>${esc(c.line)}</p></div>
      <ul class="lv__ul">${c.dishes.map(d => `<li class="lv__li" data-id="${d.id}">
        <div class="lv__th">${visual(d.id, 'disc')}</div>
        <div><p class="lv__nm"><button type="button" data-sheet="${d.id}" data-t="name">${esc(d.name)}</button></p>
        <p class="lv__lc"><i data-t="local">${esc(d.local)}</i>${d.zh ? `<span class="zh" lang="zh-Hans">${esc(d.zh)}</span>` : ''}</p>
        <p class="lv__ds" data-t="desc">${esc(d.desc)}</p>${d.pick ? `<p class="lv__pick">${SPARK}Written about by the MICHELIN Guide inspectors</p>` : ''}</div>
        <button type="button" class="lv__add" data-id="${d.id}" aria-pressed="false" aria-label="${esc(d.name)}: add to or remove from your table">${PLUS}<span>Add to table</span></button></li>`).join('')}</ul></section>`).join('')
      + '<p class="lv__none" id="lvNone" hidden>Nothing by that name today. The menu changes with the market, so do ask the team.</p>';
    syncAll();
    search('');
  }
  function hl(text, toks) {
    let h = esc(text);
    toks.forEach(t => {
      if (!t) return;
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      h = h.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, txt) => tag || txt.replace(re, '<mark>$1</mark>'));
    });
    return h;
  }
  function search(q) {
    const toks = norm(q).split(/\s+/).filter(Boolean);
    let shown = 0;
    CH.forEach(c => {
      let any = 0;
      c.dishes.forEach(d => {
        const hay = norm([d.name, d.local, d.zh, d.desc, c.title, c.short, d.pick ? 'michelin inspectors pick' : ''].join(' '));
        const ok = toks.every(t => hay.includes(t));
        const li = $(`.lv__li[data-id="${d.id}"]`);
        li.hidden = !ok;
        if (ok) {
          any++; shown++;
          const raw = q.trim().split(/\s+/).filter(Boolean);
          li.querySelector('[data-t="name"]').innerHTML = hl(d.name, raw);
          li.querySelector('[data-t="local"]').innerHTML = hl(d.local, raw);
          li.querySelector('[data-t="desc"]').innerHTML = hl(d.desc, raw);
        }
      });
      $('#lv-' + c.id).hidden = !any;
    });
    $('#lvNone').hidden = shown > 0;
    $('#lvCount').textContent = toks.length ? `${shown} of ${ALL.length} dishes match “${q.trim()}”` : `${ALL.length} dishes in six tiers`;
  }
  $('#q').addEventListener('input', e => search(e.target.value));
  $('#lvBody').addEventListener('click', e => {
    const s = e.target.closest('[data-sheet]'); if (s) { openDish(s.dataset.sheet, s.closest('.lv__li').querySelector('.lv__th')); return; }
    const a = e.target.closest('.lv__add'); if (a) toggleDish(a.dataset.id);
  });
  $('#lvJump').addEventListener('click', e => {
    const a = e.target.closest('[data-jump]'); if (!a) return;
    e.preventDefault();
    const sec = $('#lv-' + a.dataset.jump);
    if (sec && !sec.hidden) { sec.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); sec.querySelector('h3').setAttribute('tabindex', '-1'); sec.querySelector('h3').focus({ preventScroll: true }); }
  });

  /* ================================================================ MODES */
  const views = { tingkat: $('#view-tingkat'), table: $('#view-table'), list: $('#view-list') };
  function onShow(m) {
    if (m === 'tingkat') fit(0);
    if (m === 'table') { if (!tableBuilt) buildTable(); else { layoutSeats(false); layoutPlates(false); } }
    if (m === 'list' && !listBuilt) buildList();
  }
  function setMode(m, opts = {}) {
    if (!views[m]) return;
    if (state.sheet) closeDish(true);
    $$('.modes__b').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'));
    if (state.mode === m) { onShow(m); return; }
    const from = views[state.mode], to = views[m];
    state.mode = m;
    if (m !== 'tingkat' && state.open >= 0) { // put the tier back silently
      const k = state.open; state.open = -1; state.busy = false; spread.hidden = true; stage.classList.remove('is-open');
      Object.assign(geo, { upK: -1, upU: 0, frameYU: 0, frameOp: 1, outK: -1, outYU: 0, outSc: 1, outOp: 1, ghostOp: 0 });
      cos[k].classList.remove('is-on'); G.set(intro, { clearProps: 'all' });
    }
    const swap = () => {
      from.hidden = true; to.hidden = false;
      G.set(from, { clearProps: 'opacity,visibility,transform' });
      window.scrollTo(0, 0);
      onShow(m);
      if (!opts.instant) G.fromTo(to, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out', clearProps: 'opacity,visibility,transform' });
      if (opts.focus) opts.focus();
    };
    if (opts.instant || RM) swap(); else G.to(from, { autoAlpha: 0, duration: .22, ease: 'power1.in', onComplete: swap });
    if (!opts.keepHash) history.replaceState(null, '', '#' + m);
  }
  $$('.modes__b').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $$('[data-mode-go]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.modeGo)));
  $('#btnSearch').addEventListener('click', () => setMode('list', { focus: () => $('#q').focus() }));

  // keyboard map
  addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
    if (state.sheet) {
      if (e.key === 'Escape') { e.preventDefault(); closeDish(); }
      else if (!typing && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); stepDish(e.key === 'ArrowRight' ? 1 : -1); }
      return;
    }
    if (e.key === 'Escape') { if (state.open >= 0) { e.preventDefault(); closeTier(); } else if (typing && e.target.id === 'q') { e.target.value = ''; search(''); } return; }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); setMode('list', { focus: () => $('#q').focus() }); return; }
    if (state.mode === 'tingkat' && /^[1-6]$/.test(e.key)) { e.preventDefault(); openTier(+e.key - 1); }
  });

  let rz = 0;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (state.mode === 'tingkat') fit(0);
      if (state.mode === 'table' && tableBuilt) { layoutSeats(false); layoutPlates(false); }
    }, 80);
  });

  // top-bar WhatsApp: a plain hello, URL-encoded
  $('#barWa').href = `https://wa.me/${M.wa}?text=${encodeURIComponent("Hello Auntie Gaik Lean's, I would like to ask about a table.")}`;

  /* ---------------------------------------------------------------- boot */
  syncAll();
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  function route(first) {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'table' || h === 'list') { setMode(h, { instant: true, keepHash: true }); return; }
    if (h.startsWith('tier-')) { const k = CH.findIndex(c => c.id === h.slice(5) || String(c.n) === h.slice(5)); if (k >= 0) { openTier(k, { noFocus: first }); return; } }
    if (h.startsWith('dish-') && DISH[h.slice(5)]) {
      const id = h.slice(5), k = DISH[id].ci;
      openTier(k, { noFocus: true });
      const wait = () => { if (state.busy) return setTimeout(wait, 60); openDish(id, railList.querySelector(`.card[data-id="${id}"] .card__frame`)); };
      setTimeout(wait, 60);
    }
  }
  fontsReady.then(() => {
    fit(0);
    const deep = /^#(tier-|dish-|table|list)/.test(location.hash);
    if (!deep) entrance();
    steamLoop();
    route(true);
    window.MENU_READY = true;
  });
  fit(0);

  // a small API for tests and for links from the website
  window.AGMenu = { openTier, closeTier, openDish, closeDish, setMode, setGuests, toggleDish,
    place: ids => ids.forEach(id => { if (!T.ids.includes(id)) addDish(id); }),
    clear: () => { T.ids = []; save(); if (tableBuilt) layoutPlates(false); syncAll(); },
    state, table: T, waText };
})();
