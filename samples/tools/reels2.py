"""Reel-02 The rempah, reel-03 Round tables, 6s ad bumper (called from stories.py --reels)."""
import os, shutil, json
import render
from stories import run, dur_of, contact, poster, RL, SRC, ROOT, FPS, WORK
TMP = os.path.join(WORK, "reels")
CW, CH = 1620, 2880
NIGHT = "0x0c1433"


def probe_wh(path):
    import subprocess
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    w, h = o.split(",")
    return int(w), int(h)


def overlays():
    os.makedirs(TMP, exist_ok=True)
    httpd, proc, prof, cdp = render.launch()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    try:
        for p in ["r2t1", "r2t2", "r2t3", "r2t4", "r3t1", "r3t2", "r3t3", "r3t4", "a1", "e2", "e3", "ea"]:
            end = p.startswith("e")
            im, fit = render.shoot(cdp, base, f"/samples/art/reel2-overlay.html?part={p}", 1080, 1920, dsf=(2 if end else 1), transparent=not end)
            im.save(os.path.join(TMP, f"ov-{p}.png"))
            print("overlay", p, im.size, "issues:", fit.get("issues"), "broken:", fit.get("broken"))
    finally:
        render.close(httpd, proc, prof)


def ovpart(vf, ov_input_idx, ti, to, d, y0=34):
    return (f";[{ov_input_idx}:v]format=yuva420p,fade=in:st={ti}:d=0.6:alpha=1,fade=out:st={to}:d=0.4:alpha=1[o];"
            f"[v][o]overlay=x=0:y='{y0}*pow(1-min(1,max(0,(t-{ti})/0.8)),2)':format=auto,format=yuv420p[out]")


def finish(cmd, vf, out, d):
    out = out
    cmd += ["-filter_complex", vf, "-map", "[out]", "-t", str(d), "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), out]
    run(cmd); return out


def clip_seg(k, src, ss, d, pan, zoom, foc, ov=None, ti=0.4, to=None):
    path = os.path.join(ROOT, src)
    sw, sh = probe_wh(path)
    W2 = round(sw * 2880 / sh) // 2 * 2
    rng = W2 - CW
    f0, f1 = pan; z0, z1 = zoom; fx, fy = foc; N = round(d * FPS)
    xe = f"({f0}+({f1}-{f0})*t/{d})*{rng}"
    vf = (f"[0:v]fps={FPS},scale={W2}:2880:flags=lanczos,crop={CW}:2880:'{xe}':0,setsar=1,"
          f"zoompan=z='{z0}+({z1}-{z0})*on/{N}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d=1:s=1080x1920:fps={FPS},format=yuva420p[v]")
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", str(d + 0.2), "-i", path]
    if ov:
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(d), "-i", os.path.join(TMP, f"ov-{ov}.png")]
        vf += ovpart(vf, 1, ti, to or d - 0.4, d)
    else:
        vf += ";[v]format=yuv420p[out]"
    return finish(cmd, vf, os.path.join(TMP, k + ".mp4"), d)


def still_seg(k, img, d, z, foc=(.5, .6), ov=None, ti=0.4, to=None):
    N = round(d * FPS); z0, z1 = z; fx, fy = foc
    vf = (f"[0:v]scale=2400:3600:flags=lanczos,crop=2025:3600:187:0,setsar=1,"
          f"zoompan=z='{z0}+({z1}-{z0})*on/{N}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d=1:s=1080x1920:fps={FPS},format=yuva420p[v]")
    cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", str(d + 0.2), "-i", os.path.join(ROOT, img)]
    if ov:
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", str(d), "-i", os.path.join(TMP, f"ov-{ov}.png")]
        vf += ovpart(vf, 1, ti, to or d - 0.4, d)
    else:
        vf += ";[v]format=yuv420p[out]"
    return finish(cmd, vf, os.path.join(TMP, k + ".mp4"), d)


def window_seg(k, img, d, win, scale_to, crop, z, ov, foc=(.5, .5)):
    """photo plays in a window (x,y,w,h) under a transparent-hole overlay."""
    x, y, w, h = win; N = round(d * FPS); z0, z1 = z; fx, fy = foc
    sw_, sh_ = scale_to; cw_, ch_, cx, cy = crop
    vf = (f"[0:v]scale={sw_}:{sh_}:flags=lanczos,crop={cw_}:{ch_}:{cx}:{cy},setsar=1,"
          f"zoompan=z='{z0}+({z1}-{z0})*on/{N}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d=1:s={w}x{h}:fps={FPS},"
          f"pad=1080:1920:{x}:{y}:color={NIGHT},format=yuva420p[v];[1:v]format=yuva420p[o];[v][o]overlay=x=0:y=0:format=auto,format=yuv420p[out]")
    cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", str(d + 0.2), "-i", os.path.join(ROOT, img),
           "-loop", "1", "-framerate", str(FPS), "-t", str(d), "-i", os.path.join(TMP, f"ov-{ov}.png")]
    return finish(cmd, vf, os.path.join(TMP, k + ".mp4"), d)


def end_seg(k, ov, d):
    N = round(d * FPS)
    vf = f"[0:v]scale=2160:3840,zoompan=z='1.0+0.05*on/{N}':x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.45':d=1:s=1080x1920:fps={FPS},setsar=1,format=yuv420p[out]"
    cmd = ["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", str(d), "-i", os.path.join(TMP, f"ov-{ov}.png")]
    return finish(cmd, vf, os.path.join(TMP, k + ".mp4"), d)


def cuts_seg(k, imgs, each, ov, ti, to):
    parts = []
    N = round(each * FPS)
    for i, im in enumerate(imgs):
        z0, z1 = (1.0, 1.14) if i % 2 == 0 else (1.14, 1.0)
        out = os.path.join(TMP, f"{k}-{i:02d}.mp4")
        vf = (f"[0:v]scale=2400:3600:flags=lanczos,crop=2025:3600:187:0,setsar=1,"
              f"zoompan=z='{z0}+({z1}-{z0})*on/{N}':x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.0':d=1:s=1080x1920:fps={FPS},format=yuv420p[out]")
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", str(each), "-i", os.path.join(ROOT, im), "-filter_complex", vf, "-map", "[out]",
             "-t", str(each), "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), out])
        parts.append(out)
    lst = os.path.join(TMP, f"{k}.txt")
    open(lst, "w").write("".join(f"file '{p.replace(chr(92), '/')}'\n" for p in parts))
    cat = os.path.join(TMP, f"{k}-cat.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", cat])
    d = each * len(imgs)
    vf = f"[0:v]format=yuva420p[v]" + ovpart("", 1, ti, to, d)
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", cat, "-loop", "1", "-framerate", str(FPS), "-t", str(d), "-i", os.path.join(TMP, f"ov-{ov}.png")]
    return finish(cmd, vf, os.path.join(TMP, k + ".mp4"), d)


def assemble(name, files, durs, xf, outdir=RL):
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for f in files:
        cmd += ["-i", f]
    parts, last, acc = [], "[0:v]", 0.0
    for i in range(1, len(files)):
        acc += durs[i - 1] - xf[i - 1]
        parts.append(f"{last}[{i}:v]xfade=transition=fade:duration={xf[i-1]}:offset={acc:.3f}[x{i}]")
        last = f"[x{i}]"
    total = sum(durs) - sum(xf[:len(files) - 1])
    master = os.path.join(outdir, name + ".mp4")
    run(cmd + ["-filter_complex", ";".join(parts), "-map", last, "-an", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p",
               "-r", str(FPS), "-movflags", "+faststart", "-t", f"{total:.3f}", master])
    web = os.path.join(outdir, name + "-web.mp4")
    run(["ffmpeg", "-v", "error", "-y", "-i", master, "-an", "-vf", "scale=720:1280:flags=lanczos", "-c:v", "libx264", "-crf", "27", "-maxrate", "1.6M", "-bufsize", "3.2M",
         "-preset", "slow", "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart", web])
    return master, total


BOWLS = ["studio-009", "studio-016", "studio-019", "studio-023", "studio-030", "studio-032", "food-0940", "food-0942", "food-0953", "food-0955", "food-0963", "food-0966"]


def reel2():
    segs = [
        still_seg("r2a", "assets/img/studio-011-lg.webp", 2.6, (1.0, 1.06), foc=(.5, .0), ov="r2t1", ti=0.4, to=2.2),
        cuts_seg("r2b", [f"assets/img/{b}-lg.webp" for b in BOWLS], 0.5, "r2t2", 0.3, 5.5),
        clip_seg("r2c", "_src/showcase-media/menu-2.mp4", 0.2, 3.8, (0.40, 0.50), (1.0, 1.06), (.5, .5), ov="r2t3", ti=0.4, to=3.4),
        clip_seg("r2d", "_src/showcase-media/menu-6.mp4", 0.2, 3.4, (0.03, 0.10), (1.0, 1.06), (.2, .5), ov="r2t4", ti=0.4, to=3.0),
        end_seg("r2e", "e2", 3.8),
    ]
    durs = [2.6, 6.0, 3.8, 3.4, 3.8]
    return assemble("02-auntiegaik-reel-the-rempah", segs, durs, [0.3, 0.4, 0.4, 0.5])


def reel3():
    segs = [
        clip_seg("r3a", "_src/showcase-media/gen-10.mp4", 0.2, 4.0, (0.25, 0.50), (1.0, 1.05), (.5, .5), ov="r3t1", ti=0.4, to=3.6),
        window_seg("r3b", "assets/img/food-5521-lg.webp", 3.8, (90, 660, 900, 840), (1800, 2700), (1800, 1680, 0, 640), (1.0, 1.16), "r3t2", foc=(.5, .6)),
        clip_seg("r3c", "_src/showcase-media/gen-8.mp4", 0.2, 3.8, (0.05, 0.30), (1.0, 1.05), (.5, .5), ov="r3t3", ti=0.4, to=3.4),
        window_seg("r3d", "assets/img/chef-0213-lg.webp", 3.8, (0, 700, 1080, 556), (2160, 1112), (2160, 1112, 0, 0), (1.0, 1.10), "r3t4", foc=(.5, .45)),
        end_seg("r3e", "e3", 3.8),
    ]
    durs = [4.0, 3.8, 3.8, 3.8, 3.8]
    return assemble("03-auntiegaik-reel-round-tables", segs, durs, [0.4, 0.4, 0.4, 0.4])


def ad():
    segs = [
        clip_seg("ada", "_src/showcase-media/menu-4.mp4", 0.0, 3.4, (0.45, 0.55), (1.0, 1.06), (.5, .5), ov="a1", ti=0.3, to=3.0),
        end_seg("adb", "ea", 2.8),
    ]
    return assemble("ad-video-auntiegaik-meta-6s-9x16", segs, [3.4, 2.8], [0.2])


def main():
    import sys
    os.makedirs(RL, exist_ok=True); os.makedirs(TMP, exist_ok=True)
    if "--noov" not in sys.argv:
        overlays()
    meta = []
    for fn, name, title in [(reel2, "02-auntiegaik-reel-the-rempah", "Reel 02 - The rempah"), (reel3, "03-auntiegaik-reel-round-tables", "Reel 03 - Round tables"),
                            (ad, "ad-video-auntiegaik-meta-6s-9x16", "Meta ad bumper 6s 9:16")]:
        master, total = fn()
        poster(master, os.path.join(RL, name + "-poster.jpg"), min(total - 0.4, 1.4))
        contact(master, os.path.join(RL, name + "-contact-sheet.png"), 1.0 if total < 8 else 1.5)
        print("built", master, f"{total:.2f}s")
