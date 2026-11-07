"""Auntie Gaik Lean reel builder: renders overlay PNGs (reel-overlay.html?part=N) then assembles the cut with ffmpeg.
    python samples/tools/reel.py            # full build
    python samples/tools/reel.py --overlays # overlays only
    python samples/tools/reel.py --noov     # reuse overlay PNGs
"""
import os, subprocess, sys, shutil
sys.path.insert(0, os.path.dirname(__file__))
import render
from PIL import Image, ImageDraw, ImageFont

ROOT = render.ROOT
SRC = os.path.join(ROOT, "_src", "showcase-media")
OUT = os.path.join(render.EXP, "reel")
TMP = os.path.join(OUT, "_work")
NAME = "01-auntiegaik-reel-auntie-s-table"
FPS = 30
CW, CH = 1620, 2880  # 9:16 slice at 2880 high

# pan = slice-left position as fraction of the available range; zoom = push-in; foc = zoom focus
SEGS = [
    dict(k="s1", src="assets/img/restaurant-exterior-2-lg.webp", still=True, d=3.4, pan=(0.31, 0.53), zoom=(1.0, 1.06), foc=(.5, .5), ov=1, ti=0.5, to=3.0),
    dict(k="s2", src="assets/img/chef-0047-lg.webp", still=True, d=4.0, pan=(0.5, 0.5), zoom=(1.0, 1.08), foc=(.5, .45), ov=2, ti=0.5, to=3.7),
    dict(k="s3", src="_src/showcase-media/menu-4.mp4", ss=0.0, d=4.1, pan=(0.62, 0.62), zoom=(1.0, 1.0), foc=(.5, .5), ov=3, ti=0.55, to=3.8),
    dict(k="s4", src="_src/showcase-media/menu-5.mp4", ss=0.4, d=2.3, pan=(0.55, 0.55), zoom=(1.0, 1.08), foc=(.5, .5), ov=None),
    dict(k="s5", src="_src/showcase-media/menu-6.mp4", ss=0.2, d=2.3, pan=(0.04, 0.04), zoom=(1.0, 1.08), foc=(.2, .5), ov=None),
    dict(k="s6", src="_src/showcase-media/gen-8.mp4", ss=0.2, d=3.9, pan=(0.12, 0.26), zoom=(1.0, 1.06), foc=(.5, .5), ov=4, ti=0.5, to=3.6),
]
END_D = 4.2
XF = [0.45, 0.45, 0.45, 0.25, 0.45, 0.5]  # transition into the next segment (s1->s2 ... s6->end)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(" ".join(cmd)); print(r.stderr[-1500:]); raise SystemExit(1)


def probe_wh(path):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    w, h = o.split(",")
    return int(w), int(h)


def overlays():
    os.makedirs(TMP, exist_ok=True)
    httpd, proc, prof, cdp = render.launch()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        for p in range(1, 7):
            im, fit = render.shoot(cdp, base, f"/samples/art/reel-overlay.html?part={p}", 1080, 1920, dsf=(2 if p == 6 else 1), transparent=(p != 6))
            im.save(os.path.join(TMP, f"ov{p}.png"))
            print("overlay", p, im.size, "issues:", fit.get("issues"), "fonts:", fit.get("fonts"), "broken:", fit.get("broken"))
    finally:
        render.close(httpd, proc, prof)


def seg_cmd(s):
    d, N = s["d"], round(s["d"] * FPS)
    path = os.path.join(ROOT, s["src"])
    sw, sh = probe_wh(path)
    W2 = round(sw * 2880 / sh) // 2 * 2
    rng = W2 - CW
    f0, f1 = s["pan"]
    xe = f"({f0}+({f1}-{f0})*t/{d})*{rng}"
    z0, z1 = s["zoom"]
    fx, fy = s["foc"]
    vf = (f"[0:v]fps={FPS},scale={W2}:2880:flags=lanczos,crop={CW}:2880:'{xe}':0,setsar=1,"
          f"zoompan=z='{z0}+({z1}-{z0})*on/{N}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d=1:s=1080x1920:fps={FPS},format=yuva420p[v]")
    if s.get("still"):
        cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", str(d + 0.2), "-i", path]
    else:
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(s["ss"]), "-t", str(d + 0.2), "-i", path]
    if s.get("ov"):
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(d), "-i", os.path.join(TMP, f"ov{s['ov']}.png")]
        ti, to = s["ti"], s["to"]
        vf += (f";[1:v]format=yuva420p,fade=in:st={ti}:d=0.7:alpha=1,fade=out:st={to}:d=0.4:alpha=1[o];"
               f"[v][o]overlay=x=0:y='34*pow(1-min(1,max(0,(t-{ti})/0.8)),2)':format=auto,format=yuv420p[out]")
    else:
        vf += ";[v]format=yuv420p[out]"
    out = os.path.join(TMP, s["k"] + ".mp4")
    cmd += ["-filter_complex", vf, "-map", "[out]", "-t", str(d), "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), out]
    return cmd, out


def end_cmd():
    N = round(END_D * FPS)
    out = os.path.join(TMP, "end.mp4")
    vf = (f"[0:v]scale=2160:3840,zoompan=z='1.0+0.07*on/{N}':x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.45':d=1:s=1080x1920:fps={FPS},setsar=1,format=yuva420p[v];"
          f"[1:v]format=yuva420p,fade=in:st=0.5:d=0.8:alpha=1[o];"
          f"[v][o]overlay=x=0:y='30*pow(1-min(1,max(0,(t-0.5)/0.9)),2)':format=auto,format=yuv420p[out]")
    cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", str(END_D), "-i", os.path.join(TMP, "ov6.png"),
           "-loop", "1", "-framerate", str(FPS), "-t", str(END_D), "-i", os.path.join(TMP, "ov5.png"),
           "-filter_complex", vf, "-map", "[out]", "-t", str(END_D), "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), out]
    return cmd, out


def assemble(files, durs):
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for f in files:
        cmd += ["-i", f]
    parts, last, acc = [], "[0:v]", 0.0
    for i in range(1, len(files)):
        acc += durs[i - 1] - XF[i - 1]
        parts.append(f"{last}[{i}:v]xfade=transition=fade:duration={XF[i-1]}:offset={acc:.3f}[x{i}]")
        last = f"[x{i}]"
        durs[i] = durs[i]  # offsets use cumulative (dur - xf)
    total = sum(durs) - sum(XF[:len(files) - 1])
    master = os.path.join(OUT, NAME + ".mp4")
    cmd += ["-filter_complex", ";".join(parts), "-map", last, "-an", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p",
            "-r", str(FPS), "-movflags", "+faststart", "-t", f"{total:.3f}", master]
    run(cmd)
    web = os.path.join(OUT, NAME + "-web.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-i", master, "-an", "-vf", "scale=720:1280:flags=lanczos", "-c:v", "libx264", "-crf", "28", "-maxrate", "1.4M", "-bufsize", "2.8M",
         "-preset", "slow", "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart", web])
    return master, total


def contact(master, total):
    fr = os.path.join(TMP, "cs"); shutil.rmtree(fr, ignore_errors=True); os.makedirs(fr)
    ims = []
    for t in range(0, int(total) + 1, 2):
        p = os.path.join(fr, f"{t:02d}.png")
        run(["ffmpeg", "-v", "error", "-y", "-ss", str(min(t, total - 0.1)), "-i", master, "-frames:v", "1", "-vf", "scale=360:640", p])
        im = Image.open(p).convert("RGB"); d = ImageDraw.Draw(im)
        try: f = ImageFont.truetype("arial.ttf", 26)
        except Exception: f = None
        d.rectangle([0, 0, 92, 36], fill=(0, 0, 0)); d.text((8, 4), f"{t:02d}.0 s", fill=(255, 255, 255), font=f)
        ims.append(im)
    cols = 6; rows = (len(ims) + cols - 1) // cols
    sh = Image.new("RGB", (cols * 364 + 4, rows * 644 + 4), (30, 30, 30))
    for i, im in enumerate(ims):
        sh.paste(im, (4 + (i % cols) * 364, 4 + (i // cols) * 644))
    sh.save(os.path.join(OUT, "contact-sheet.png"))


def main():
    os.makedirs(OUT, exist_ok=True)
    if "--noov" not in sys.argv:
        overlays()
    if "--overlays" in sys.argv:
        return
    files, durs = [], []
    for s in SEGS:
        c, o = seg_cmd(s); run(c); files.append(o); durs.append(s["d"])
    c, o = end_cmd(); run(c); files.append(o); durs.append(END_D)
    master, total = assemble(files, durs)
    contact(master, total)
    print("built", master, f"{total:.2f}s")


if __name__ == "__main__":
    main()
