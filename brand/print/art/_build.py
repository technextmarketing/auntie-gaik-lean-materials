"""Render brand/exports PNGs and brand/print PDFs (+ previews). python _build.py [png|pdf] [stems...]"""
import os, sys, base64, time
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "samples", "tools"))
import render
from PIL import Image
import pymupdf

EXP = os.path.join(ROOT, "brand", "exports"); PRN = os.path.join(ROOT, "brand", "print"); PRE = os.path.join(PRN, "previews")
PNG = {"avatar-instagram": ("avatar-instagram-1080.png", 1080, 1080, False), "avatar-round": ("avatar-round-1080.png", 1080, 1080, True),
 "facebook-cover": ("facebook-cover-1640x624.png", 1640, 624, False), "facebook-cover-room": ("facebook-cover-room-1640x624.png", 1640, 624, False),
 "gbp-cover": ("gbp-cover-2048x1152.png", 2048, 1152, False), "ig-story": ("ig-story-template-1080x1920.png", 1080, 1920, False),
 "og-image": ("og-image-1200x630.png", 1200, 630, False), "email-header": ("email-header-1200x400.png", 1200, 400, False),
 "xhs-cover": ("xhs-cover-template-1242x1660.png", 1242, 1660, False),
 "pattern-cobalt": ("pattern-cobalt-2000.png", 2000, 2000, False), "pattern-gold": ("pattern-gold-2000.png", 2000, 2000, False)}
# stem: (pdf, page w mm, page h mm incl. bleed, bleed mm)
PDF = {"business-card": ("business-card.pdf", 91, 61, 3), "gift-voucher": ("gift-voucher.pdf", 216, 105, 3), "table-tent": ("table-tent.pdf", 111, 154, 3),
 "menu-card-a5": ("menu-card-a5.pdf", 154, 216, 3), "booking-card": ("booking-card.pdf", 96, 56, 3), "window-decal": ("window-decal.pdf", 600, 400, 0)}
SAFE_JS = r"""(()=>{const mm=96/25.4,B=%f*mm,S=%f*mm,out=[];
document.querySelectorAll('.pg').forEach((pg,i)=>{const R=pg.getBoundingClientRect();
 const w=document.createTreeWalker(pg,NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){if(!n.textContent.trim())continue;const el=n.parentElement;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
  const r=document.createRange();r.selectNodeContents(n);const b=r.getBoundingClientRect();if(!b.width)continue;
  const l=b.left-R.left,t=b.top-R.top,rr=R.right-b.right,bb=R.bottom-b.bottom;
  if(Math.min(l,t,rr,bb)<S-0.5)out.push({page:i+1,text:n.textContent.trim().slice(0,30),l:(l/mm).toFixed(1),t:(t/mm).toFixed(1),r:(rr/mm).toFixed(1),b:(bb/mm).toFixed(1)});}
});return out;})()"""

def main():
    args = sys.argv[1:]; mode = [a for a in args if a in ("png", "pdf")]; only = [a for a in args if a not in ("png", "pdf")]
    httpd, proc, prof, cdp = render.launch(); base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        if not mode or "png" in mode:
            for s, (f, w, h, tr) in PNG.items():
                if only and s not in only: continue
                im, fit = render.shoot(cdp, base, f"/brand/print/art/{s}.html", w, h, dsf=1, still=True, transparent=tr)
                im.save(os.path.join(EXP, f), optimize=True)
                print(s, f, im.size, "issues:", [i for i in fit["issues"] if i["issue"] != "font under 20px"][:5], "fonts", fit["fonts"], "broken", fit["broken"])
        if not mode or "pdf" in mode:
            for s, (f, w, h, b) in PDF.items():
                if only and s not in only: continue
                cdp("Emulation.setDeviceMetricsOverride", width=round(w * 96 / 25.4), height=round(h * 96 / 25.4), deviceScaleFactor=1, mobile=False)
                cdp("Page.navigate", url=base + f"/brand/print/art/{s}.html"); time.sleep(0.8)
                for _ in range(80):
                    if cdp.eval("document.readyState") == "complete": break
                    time.sleep(0.15)
                cdp.eval(render.READY_JS); time.sleep(0.8)
                unsafe = cdp.eval(SAFE_JS % (b, b + 5)) if b else cdp.eval(SAFE_JS % (0, 15))
                r = cdp("Page.printToPDF", printBackground=True, paperWidth=w / 25.4, paperHeight=h / 25.4, marginTop=0, marginBottom=0, marginLeft=0, marginRight=0, preferCSSPageSize=True)
                out = os.path.join(PRN, f); open(out, "wb").write(base64.b64decode(r["data"]))
                d = pymupdf.open(out); mmpt = 72 / 25.4
                for p in d:
                    p.set_mediabox(pymupdf.Rect(0, 0, w * mmpt, h * mmpt)); p.set_cropbox(p.mediabox)
                    if b: p.set_trimbox(pymupdf.Rect(b * mmpt, b * mmpt, (w - b) * mmpt, (h - b) * mmpt)); p.set_bleedbox(p.mediabox)
                tmp = out + ".tmp"; d.save(tmp, deflate=True); d.close(); os.replace(tmp, out)
                d = pymupdf.open(out); p = d[0]
                clip = p.trimbox if b else p.rect
                z = 1200 / clip.width; pm = p.get_pixmap(matrix=pymupdf.Matrix(z, z), clip=clip); pm.save(os.path.join(PRE, s + ".png"))
                print(s, f, "pages", len(d), "page mm %.1fx%.1f" % (p.rect.width / mmpt, p.rect.height / mmpt), "trim mm %.1fx%.1f" % (clip.width / mmpt, clip.height / mmpt), "unsafe:", unsafe)
    finally:
        render.close(httpd, proc, prof)
main()
