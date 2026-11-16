#!/usr/bin/env python3
"""10人ぶんの場面を撮って、1枚に並べる。 python3 tools/sheet.py [--hash "auto"] [--wait 2.2] [--out _check/sheet] [--before JS] [--only 1,2]"""
import argparse, functools, http.server, socketserver, threading, time, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playtest import NoCache, ROOT, CHROME
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--hash", default=""); ap.add_argument("--wait", type=float, default=2.2); ap.add_argument("--out", default="_check/sheet"); ap.add_argument("--before", default=""); ap.add_argument("--only", default=""); ap.add_argument("--size", default="390x844"); ap.add_argument("--after", type=float, default=0); ap.add_argument("--frames", default=""); ap.add_argument("--scale", type=float, default=1)
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    from PIL import Image
    ids = [int(x) for x in a.only.split(",")] if a.only else list(range(1, 11))
    w, h = (int(x) for x in a.size.split("x")); shots = []; errs = []; stats = []
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT))) as srv:
        port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
        with sync_playwright() as p:
            br = p.chromium.launch(executable_path=CHROME, headless=True, args=["--mute-audio", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
            for c in ids:
                ctx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, has_touch=True, is_mobile=True); page = ctx.new_page()
                page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type == "error" and "404" not in m.text else None); page.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
                page.goto(f"http://127.0.0.1:{port}/index.html#play&c={c}&{a.hash}"); time.sleep(a.wait)
                if a.before: page.evaluate(a.before)
                if a.after: time.sleep(a.after)
                if a.frames:
                    t0 = time.time()
                    for k, ft in enumerate(float(x) for x in a.frames.split(",")):
                        time.sleep(max(0, ft - (time.time() - t0))); f = ROOT / f"{a.out}-c{c}-{k}.png"; f.parent.mkdir(exist_ok=True); page.screenshot(path=str(f)); shots.append(f)
                else:
                    f = ROOT / f"{a.out}-c{c}.png"; f.parent.mkdir(exist_ok=True); page.screenshot(path=str(f)); shots.append(f)
                stats.append((c, page.evaluate("[__g.S.hits, __g.S.downs, +__g.S.time.toFixed(0)]"))); ctx.close()
            br.close()
        srv.shutdown()
    ims = [Image.open(f) for f in shots]; n = len(ims); cols = len(a.frames.split(",")) if a.frames else min(5, n);
    if a.scale != 1: ims = [im.resize((int(w * a.scale), int(h * a.scale))) for im in ims]; w = int(w * a.scale); h = int(h * a.scale)
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * h), "#222")
    for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sheet.save(ROOT / f"{a.out}.png"); print("並べた:", f"{a.out}.png", sheet.size); print("数字(相手, [発, ダウン, 残り秒]):", stats); print("エラー:", errs[:8] or "なし")
if __name__ == "__main__": main()
