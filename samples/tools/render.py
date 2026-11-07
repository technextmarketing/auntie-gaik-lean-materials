"""Auntie Gaik Lean's sample pack exporter.

Renders artboards in samples/art/ through headless Chrome (DevTools protocol) at 2x and writes properly
named PNG exports + 600px WebP previews, and prints a text-fit / glyph-clip report.

    python samples/tools/render.py                    # every artboard that exists
    python samples/tools/render.py post-01 ad1-feed   # only these stems

Self-contained: own static server (repo root) on a free port + its own Chrome on a free port 9750-9799;
the temporary profile is deleted at the end. Several copies can run in parallel.
"""
import base64, functools, http.server, io, json, os, shutil, socket, socketserver, subprocess, sys, tempfile, threading, time, urllib.request

import websocket
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART = os.path.join(ROOT, "samples", "art")
EXP = os.path.join(ROOT, "samples", "exports")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DSF = 2

# stem (artboard file without .html) -> (export path relative to exports/, css width, css height)
JOBS = {
    "post-01": ("posts/01-auntiegaik-post-meet-auntie.png", 1080, 1440),
    "post-02": ("posts/02-auntiegaik-post-curry-kapitan.png", 1080, 1440),
    "post-03": ("posts/03-auntiegaik-post-find-the-blue-doors.png", 1080, 1440),
    "ad1-feed": ("ads/ad1-auntiegaik-meta-michelin-nyonya-4x5.png", 1080, 1350),
    "ad1-story": ("ads/ad1-auntiegaik-meta-michelin-nyonya-9x16.png", 1080, 1920),
    "ad2-feed": ("ads/ad2-auntiegaik-meta-penang-weekend-4x5.png", 1080, 1350),
    "ad2-story": ("ads/ad2-auntiegaik-meta-penang-weekend-9x16.png", 1080, 1920),
}

FIT_JS = r"""
(() => {
  const W = %d, H = %d, out = [];
  const root = document.querySelector('.ab') || document.body;
  const R0 = root.getBoundingClientRect();
  const clips = el => { const a = []; for (let p = el.parentElement; p && p !== root.parentElement; p = p.parentElement) {
      const c = getComputedStyle(p); if (c.overflow !== 'visible' || c.clipPath !== 'none' || c.maskImage !== 'none' && c.maskImage) a.push(p); } return a; };
  let tiny = 0;
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('[data-bleed]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const name = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '');
    const txt = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (parseFloat(cs.fontSize) < 20) { out.push({el: name, text: txt, issue: 'font under 20px', size: cs.fontSize}); }
    const range = document.createRange(); range.selectNodeContents(el);
    const tr = range.getBoundingClientRect();
    if (tr.left < R0.left - 1 || tr.right > R0.left + W + 1 || tr.top < R0.top - 1 || tr.bottom > R0.top + H + 1)
      out.push({el: name, text: txt, issue: 'text outside canvas', rect: [tr.left|0, tr.top|0, tr.right|0, tr.bottom|0]});
    if ((cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2))
      out.push({el: name, text: txt, issue: 'clipped in own box'});
    // glyph clip: ink box vs every clipping ancestor
    for (const p of clips(el)) {
      const pr = p.getBoundingClientRect();
      if (tr.left < pr.left - 1 || tr.right > pr.right + 1 || tr.top < pr.top - 1 || tr.bottom > pr.bottom + 1) {
        out.push({el: name, text: txt, issue: 'glyphs cut by ancestor', by: p.tagName.toLowerCase() + '.' + (p.className || '')}); break; }
    }
  }
  const fonts = ['80px "Bodoni Moda"', 'italic 80px "Bodoni Moda"', '500 24px Jost'].map(f => document.fonts.check(f));
  const broken = [...document.images].filter(i => i.complete && !i.naturalWidth && i.getAttribute('src')).map(i => i.getAttribute('src'));
  return {issues: out, fonts, broken};
})()
"""

READY_JS = r"""
(async () => {
  try { await Promise.all(['80px "Bodoni Moda"', 'italic 80px "Bodoni Moda"', '500 24px Jost', '400 24px Jost'].map(f => document.fonts.load(f))); } catch (e) {}
  await document.fonts.ready;
  const imgs = [...document.images];
  await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  for (let k = 0; k < 40 && window.ARTBOARD_READY === false; k++) await new Promise(r => setTimeout(r, 100));
  return true;
})()
"""


def free_port(lo=0, hi=0):
    for p in (range(lo, hi + 1) if lo else [0]):
        s = socket.socket()
        try:
            s.bind(("127.0.0.1", p)); port = s.getsockname()[1]; s.close(); return port
        except OSError:
            s.close()
    raise RuntimeError("no free port")


def start_server():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", free_port()), functools.partial(Quiet, directory=ROOT))
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


class Cdp:
    def __init__(self, port):
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
                page = [t for t in tabs if t["type"] == "page"][0]; break
            except Exception:
                time.sleep(0.2)
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=120, suppress_origin=True)
        self.n = 0

    def __call__(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == self.n:
                if "error" in m:
                    raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})

    def eval(self, expr, wait=True):
        return self("Runtime.evaluate", expression=expr, awaitPromise=wait, returnByValue=True).get("result", {}).get("value")


def launch():
    httpd = start_server()
    port = free_port(9750, 9799)
    prof = tempfile.mkdtemp(prefix="ag-render-")
    proc = subprocess.Popen([CHROME, "--headless=new", f"--user-data-dir={prof}", f"--remote-debugging-port={port}", "--hide-scrollbars",
                             "--force-color-profile=srgb", "--window-size=1080,1920", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    cdp = Cdp(port); cdp("Page.enable"); cdp("Runtime.enable")
    return httpd, proc, prof, cdp


def close(httpd, proc, prof):
    try:
        proc.kill()
    except Exception:
        pass
    time.sleep(0.6); shutil.rmtree(prof, ignore_errors=True); httpd.shutdown()


def shoot(cdp, base, url, w, h, dsf=DSF, still=False, transparent=False):
    cdp("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=dsf, mobile=False)
    if transparent:
        cdp("Emulation.setDefaultBackgroundColorOverride", color={"r": 0, "g": 0, "b": 0, "a": 0})
    else:
        cdp("Emulation.setDefaultBackgroundColorOverride")
    cdp("Page.navigate", url=base + url + (("&" if "?" in url else "?") + "still=1" if still else ""))
    time.sleep(0.5)
    for _ in range(80):
        if cdp.eval("document.readyState") == "complete":
            break
        time.sleep(0.15)
    cdp.eval(READY_JS); time.sleep(1.2 if still else 0.5)
    fit = cdp.eval(FIT_JS % (w, h))
    shot = cdp("Page.captureScreenshot", format="png", captureBeyondViewport=False, clip={"x": 0, "y": 0, "width": w, "height": h, "scale": 1})
    return Image.open(io.BytesIO(base64.b64decode(shot["data"]))), fit


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    stems = [s for s in JOBS if (not only or s in only) and os.path.exists(os.path.join(ART, s + ".html"))]
    httpd, proc, prof, cdp = launch()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    report = []
    try:
        for s in stems:
            rel, w, h = JOBS[s]
            im, fit = shoot(cdp, base, f"/samples/art/{s}.html", w, h, still=True)
            out = os.path.join(EXP, rel); os.makedirs(os.path.dirname(out), exist_ok=True)
            im.convert("RGB").save(out, optimize=True)
            web = os.path.join(EXP, "web", os.path.basename(rel)[:-4] + ".webp"); os.makedirs(os.path.dirname(web), exist_ok=True)
            p = im.convert("RGB"); p.resize((720, round(p.size[1] * 720 / p.size[0])), Image.LANCZOS).save(web, quality=86, method=5)
            ok = not fit.get("issues") and all(fit.get("fonts", [1])) and not fit.get("broken")
            print(f"{'OK ' if ok else 'FIX'} {s:<10} -> {rel}  {im.size[0]}x{im.size[1]}  issues={len(fit.get('issues', []))} fonts={fit.get('fonts')} broken={fit.get('broken')}")
            for iss in fit.get("issues", [])[:10]:
                print("      ", iss)
            report.append({"stem": s, "file": rel, **fit})
    finally:
        close(httpd, proc, prof)
    with open(os.path.join(EXP, "fit-report.json" if not only else "fit-report-partial.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1)


if __name__ == "__main__":
    main()
