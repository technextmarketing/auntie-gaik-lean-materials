/* agQR: renders <div data-qr="URL" data-fg="#111629" data-bg="#fff"> as crisp SVG (needs qrcode.min.js first) */
(function () {
  function run() {
    document.querySelectorAll('[data-qr]').forEach(function (el) {
      var q = qrcode(0, 'M'); q.addData(el.getAttribute('data-qr')); q.make();
      var n = q.getModuleCount(), m = 2, fg = el.getAttribute('data-fg') || '#111629', bg = el.getAttribute('data-bg') || '#ffffff', d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ',' + (r + m) + 'h1v1h-1z';
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 2 * m) + ' ' + (n + 2 * m) + '" width="100%" height="100%" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="' + bg + '"/><path d="' + d + '" fill="' + fg + '"/></svg>';
    });
  }
  if (document.readyState !== 'loading') run(); else document.addEventListener('DOMContentLoaded', run);
})();
