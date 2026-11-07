"""Auntie Gaik Lean stories (animated MP4s from HTML timelines) + reels + ad bumper.
    python samples/tools/stories.py --stories   # story MP4s (01, 03, 05) + posters + contact sheets
    python samples/tools/stories.py --reels     # reel-02, reel-03, ad bumper
"""
import base64, os, shutil, subprocess, sys, json
sys.path.insert(0, os.path.dirname(__file__))
import render
from PIL import Image, ImageDraw, ImageFont

ROOT = render.ROOT
SRC = os.path.join(ROOT, "_src", "showcase-media")
ST = os.path.join(render.EXP, "stories")
RL = os.path.join(render.EXP, "reels")
FPS = 30
WORK = os.path.join(os.environ.get("TEMP", "."), "ag-stories-work")


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(" ".join(cmd)); print(r.stderr[-1500:]); raise SystemExit(1)


def dur_of(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip())


def contact(video, out_png, step=1.0, cols=6):
    total = dur_of(video)
    fr = os.path.join(WORK, "cs"); shutil.rmtree(fr, ignore_errors=True); os.makedirs(fr)
    ims = []; t = 0.0
    while t < total - 0.05:
        p = os.path.join(fr, f"{int(t*100):05d}.png")
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-vf", "scale=270:480", p])
        im = Image.open(p).convert("RGB"); d = ImageDraw.Draw(im)
        try: f = ImageFont.truetype("arial.ttf", 22)
        except Exception: f = None
        d.rectangle([0, 0, 70, 28], fill=(0, 0, 0)); d.text((6, 3), f"{t:.1f}s", fill=(255, 255, 255), font=f)
        ims.append(im); t += step
    rows = (len(ims) + cols - 1) // cols
    sh = Image.new("RGB", (cols * 274 + 4, rows * 484 + 4), (30, 30, 30))
    for i, im in enumerate(ims):
        sh.paste(im, (4 + (i % cols) * 274, 4 + (i // cols) * 484))
    sh.save(out_png)


def poster(video, out_jpg, t):
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video, "-frames:v", "1", "-q:v", "3", out_jpg])


# ---------------------------------------------------------------- stories
STORIES = [("story-01", "01-auntiegaik-story-poll", 7.0), ("story-03", "03-auntiegaik-story-in-the-kitchen", 7.0), ("story-05", "05-auntiegaik-story-four-years-running", 8.0)]
SNAME = {"story-01": "story-01-auntiegaik-poll", "story-03": "story-03-auntiegaik-in-the-kitchen", "story-05": "story-05-auntiegaik-four-years-running"}


def stories():
    os.makedirs(WORK, exist_ok=True)
    httpd, proc, prof, cdp = render.launch()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        for stem, _, d in STORIES:
            fd = os.path.join(WORK, stem); shutil.rmtree(fd, ignore_errors=True); os.makedirs(fd)
            render.shoot(cdp, base, f"/samples/art/{stem}.html?t=0", 1080, 1920, dsf=1)
            n = round(d * FPS)
            for i in range(n):
                cdp.eval(f"setT({i / FPS})", wait=False)
                shot = cdp("Page.captureScreenshot", format="png", clip={"x": 0, "y": 0, "width": 1080, "height": 1920, "scale": 1})
                open(os.path.join(fd, f"{i:04d}.png"), "wb").write(base64.b64decode(shot["data"]))
            out = os.path.join(ST, SNAME[stem] + ".mp4")
            run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(fd, "%04d.png"), "-an", "-c:v", "libx264", "-crf", "20", "-preset", "slow",
                 "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart", out])
            poster(out, os.path.join(ST, SNAME[stem] + "-poster.jpg"), d - 0.2)
            contact(out, os.path.join(ST, SNAME[stem] + "-contact-sheet.png"), 1.0)
            print("built", out, dur_of(out))
    finally:
        render.close(httpd, proc, prof)


if __name__ == "__main__":
    if "--stories" in sys.argv: stories()
    if "--reels" in sys.argv:
        import reels2; reels2.main()
