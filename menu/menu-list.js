/* The phone menu: a designed list built from data.js (window.AG_MENU). No prices. */
(() => {
  const M = window.AG_MENU, CH = M.chapters;
  const root = document.getElementById('lvRoot');
  if (!M || !root) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]static=1/.test(location.search);
  const LABEL = { small: 'Small plates', curries: 'Curries & mains', 'soup-veg': 'Soup & vegetables', rice: 'Rice', desserts: 'Desserts', drinks: 'Drinks' };
  const SPARK = '<svg class="sp" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 5 2 8 7 10-5 2-6.4 5-7 10-.6-5-2-8-7-10 5-2 6.4-5 7-10z"/></svg>';
  const WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1.2-3.6A7.8 7.8 0 1 1 8.6 18.6z"/><path d="M9.2 9.3c.3 2.4 2.6 4.8 5.3 5.4"/></svg>';
  const TEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h3.5l1.6 4-2.2 1.4a11 11 0 0 0 5.2 5.2l1.4-2.2 4 1.6V18a1.5 1.5 0 0 1-1.5 1.5A14.5 14.5 0 0 1 3.5 6 1.5 1.5 0 0 1 5 4.5z"/></svg>';
  const waUrl = 'https://wa.me/' + M.wa;

  const pic = d => {
    const p = d.photo;
    if (p) return `<span class="dish__pic"><img src="${esc(p.src)}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" decoding="async" style="object-position:${esc(p.pos || '50% 50%')}"></span>`;
    const ini = (d.name.match(/[A-Za-z]/) || ['·'])[0].toUpperCase();
    return `<span class="dish__pic dish__pic--ph" role="img" aria-label="Photo to come"><span class="ph__ini" aria-hidden="true">${ini}</span><span class="ph__tag" aria-hidden="true">Photo to come</span></span>`;
  };
  const dish = d => `<li class="dish${d.pick ? ' is-pick' : ''}">${pic(d)}
      <div class="dish__txt">
        <h3 class="dish__n disp">${esc(d.name)}</h3>
        ${d.local || d.zh ? `<p class="dish__l">${esc(d.local || '')}${d.zh ? ` <span class="zh">${d.zh}</span>` : ''}</p>` : ''}
        <p class="dish__d">${esc(d.desc)}</p>
        ${d.pick ? `<p class="dish__m">${SPARK}<span>MICHELIN inspectors</span></p>` : ''}
      </div></li>`;

  root.innerHTML = `
    <header class="lv-head">
      <p class="lbl lv-head__eyebrow">Auntie Gaik Lean's</p>
      <h2 class="disp lv-head__t" id="lvTitle">The <i>menu</i></h2>
      <p class="lv-head__star">${SPARK}<span>One MICHELIN Star · 2023–2026</span></p>
      <p class="lv-head__note">${esc(M.note)}</p>
      <p class="lv-head__key">${SPARK}<span>Written about by the MICHELIN Guide inspectors</span></p>
    </header>
    <nav class="lv-tabs" id="lvTabs" aria-label="Menu chapters"><div class="lv-tabs__in">${CH.map(c => `<a href="#ch-${c.id}" data-id="${c.id}">${esc(LABEL[c.id] || c.short)}</a>`).join('')}</div></nav>
    <div class="lv-body">${CH.map(c => `<section class="lv-ch" id="ch-${c.id}" aria-labelledby="h-${c.id}">
        <header class="lv-ch__h"><p class="lbl lv-ch__n">${String(c.n).padStart(2, '0')} · ${c.dishes.length} ${c.dishes.length === 1 ? 'dish' : 'dishes'}</p>
        <h2 class="disp lv-ch__t" id="h-${c.id}">${esc(c.title)}</h2><p class="lv-ch__line">${esc(c.line)}</p></header>
        <ul class="dishes">${c.dishes.map(dish).join('')}</ul></section>`).join('')}</div>
    <footer class="lv-foot" id="lvVisit">
      <p class="lbl lv-foot__eyebrow">Visit</p>
      <h2 class="disp lv-foot__t">Come and <i>eat</i></h2>
      <dl class="lv-foot__facts">
        <div><dt class="lbl">Hours</dt><dd>Wed–Sun<br>Lunch 12pm–2.30pm<br>Dinner 6pm–9.30pm<br>Closed Mon and Tue</dd></div>
        <div><dt class="lbl">Address</dt><dd>${esc(M.address.replace(' (Bishop Street)', ''))}</dd></div>
      </dl>
      <a class="btn btn-gold lv-foot__book" href="${esc(M.book)}" target="_blank" rel="noopener">Book a table</a>
      <div class="lv-foot__row"><a class="btn btn-line" href="${esc(M.tel)}">${TEL}Call</a><a class="btn btn-line" href="${waUrl}" target="_blank" rel="noopener">${WA}WhatsApp</a></div>
      <p class="lv-foot__fine">${esc(M.note)}</p>
    </footer>
    <div class="lv-dock" role="group" aria-label="Book or contact">
      <a class="btn btn-gold" href="${esc(M.book)}" target="_blank" rel="noopener">Book a table</a>
      <a class="btn btn-dock" href="${esc(M.tel)}" aria-label="Call ${esc(M.phone)}">${TEL}<span>Call</span></a>
      <a class="btn btn-dock" href="${waUrl}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(M.phone)}">${WA}<span>WhatsApp</span></a>
    </div>`;

  /* chapter bar: jump + highlight the chapter in view */
  const tabsEl = document.getElementById('lvTabs'), links = [...tabsEl.querySelectorAll('a')], secs = CH.map(c => document.getElementById('ch-' + c.id));
  const off = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barH')) || 72) + tabsEl.offsetHeight + 8;
  let cur = -1, tick = 0;
  function mark(i) {
    if (i === cur) return; cur = i;
    links.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    const a = links[i], box = tabsEl.firstElementChild;
    if (a) box.scrollTo({ left: a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
  }
  function onScroll() {
    tick = 0;
    if (document.getElementById('view-list').hidden) return;
    const y = off() + 4; let k = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= y) k = i; });
    mark(k);
  }
  addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(onScroll); }, { passive: true });
  tabsEl.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return; e.preventDefault();
    const s = document.getElementById('ch-' + a.dataset.id);
    scrollTo({ top: s.getBoundingClientRect().top + scrollY - off() + 2, behavior: RM ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#ch-' + a.dataset.id);
  });
  const tabsBox = tabsEl.firstElementChild;
  function fades() { tabsEl.classList.toggle('is-scrolled', tabsBox.scrollLeft > 6); tabsEl.classList.toggle('is-end', tabsBox.scrollLeft + tabsBox.clientWidth >= tabsBox.scrollWidth - 6); }
  tabsBox.addEventListener('scroll', fades, { passive: true }); addEventListener('resize', fades); fades();
  window.AGList = { sync() { cur = -1; onScroll(); } };
  mark(0);
})();
