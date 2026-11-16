#!/usr/bin/env python3
"""全員の顔を大きく切り出して並べる。 python3 tools/faces.py --lv 0,3,6 [--out _check/faces]"""
import argparse, functools, socketserver, threading, time, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playtest import NoCache, ROOT, CHROME
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--lv", default="0,3,6"); ap.add_argument("--out", default="_check/faces"); ap.add_argument("--only", default="")
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    from PIL import Image
    ids = [int(x) for x in a.only.split(",")] if a.only else list(range(1, 11)); lvs = [int(x) for x in a.lv.split(",")]; C = 300; errs = []
    sheet = Image.new("RGB", (C * len(ids), C * len(lvs)), "#222")
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT))) as srv:
        port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
        with sync_playwright() as p:
            br = p.chromium.launch(executable_path=CHROME, headless=True, args=["--mute-audio", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
            for ci, c in enumerate(ids):
                ctx = br.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3, has_touch=True, is_mobile=True); page = ctx.new_page()
                page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type == "error" and "404" not in m.text else None); page.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
                page.goto(f"http://127.0.0.1:{port}/index.html#play&c={c}&t=99"); time.sleep(2.0)
                for li, lv in enumerate(lvs):
                    page.evaluate(f"(()=>{{const g=__g,S=g.S;g.lv({lv});S.ai.tauntT=99;S.ai.smug=0;S.sayT=0.01;S.ai.mvDef=null;S.ai.mv={{name:'close',t:0,dur:99,p:{{}}}};S.ai.hitT=0;}})()"); time.sleep(1.3)
                    hs = page.evaluate("__g.S.headScr"); f = ROOT / f"{a.out}-tmp.png"; f.parent.mkdir(exist_ok=True); page.screenshot(path=str(f))
                    im = Image.open(f).convert("RGB"); r = hs[2] * 1.75 * 3; x, y = hs[0] * 3, hs[1] * 3 - hs[2] * 0.5
                    sheet.paste(im.crop((int(x - r), int(y - r), int(x + r), int(y + r))).resize((C, C)), (ci * C, li * C))
                ctx.close()
            br.close()
        srv.shutdown()
    sheet.save(ROOT / f"{a.out}.png"); print("並べた:", f"{a.out}.png", sheet.size); print("エラー:", errs[:8] or "なし")
if __name__ == "__main__": main()
