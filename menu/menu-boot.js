/* Auntie Gaik Lean's menu: one view per screen.
   Wider than 900px: the flipbook (book.css + book.js). 900px and narrower: the photo list (menu-list.css + menu-list.js).
   Only the chosen view's files are downloaded; crossing the breakpoint swaps views without a reload. */
(() => {
  const mq = matchMedia('(min-width: 901px)');
  const bookEl = document.getElementById('view-book'), listEl = document.getElementById('view-list');
  const loaded = {};
  const css = href => new Promise(res => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = res; document.head.appendChild(l); });
  const js = src => new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = res; document.body.appendChild(s); });

  async function apply() {
    const desk = mq.matches;
    if (desk) {
      listEl.hidden = true;
      document.documentElement.classList.remove('is-phone');
      if (!loaded.book) { loaded.book = css('book.css?v=1').then(() => { bookEl.hidden = false; return js('book.js?v=1'); }); await loaded.book; }
      else { await loaded.book; bookEl.hidden = false; if (window.AGBook) window.AGBook.show(); }
    } else {
      bookEl.hidden = true;
      document.documentElement.classList.add('is-phone');
      if (!loaded.list) { loaded.list = css('menu-list.css?v=1').then(() => js('menu-list.js?v=1')).then(() => { listEl.hidden = false; }); await loaded.list; }
      else { await loaded.list; listEl.hidden = false; if (window.AGList) window.AGList.sync(); }
    }
  }
  (mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply));
  apply();
})();
