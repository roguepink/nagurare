#!/usr/bin/env python3
"""音ボタン・一時停止ボタンが、連打の最中(ほかの指が画面にふれたまま)でも効くかを確かめる。 python3 tools/btn_test.py"""
import functools, socketserver, threading, time, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playtest import NoCache, ROOT, CHROME
from playwright.sync_api import sync_playwright
def main():
    socketserver.TCPServer.allow_reuse_address = True; ok = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT))) as srv:
        port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
        with sync_playwright() as p:
            br = p.chromium.launch(executable_path=CHROME, headless=True, args=["--mute-audio"])
            ctx = br.new_context(**p.devices["Pixel 7"]); page = ctx.new_page(); cdp = ctx.new_cdp_session(page)
            page.goto(f"http://127.0.0.1:{port}/index.html#play&c=1&t=99"); time.sleep(2.6)
            def touch(kind, pts): cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": [{"x": x, "y": y, "id": i} for (x, y, i) in pts]})
            def center(bid): b = page.locator("#" + bid).bounding_box(); return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
            for bid, read, want in (("btnMute", "document.getElementById('btnMute').textContent", "🔇"), ("btnPause", "__g.S.state", "pause")):
                x, y = center(bid)
                touch("touchStart", [(200, 500, 0)]); time.sleep(0.05)                 # 1本目の指は画面にふれたまま
                touch("touchStart", [(200, 500, 0), (x, y, 1)]); time.sleep(0.05)      # 2本目の指でボタン
                touch("touchEnd", [(200, 500, 0)]); time.sleep(0.05); touch("touchEnd", []); time.sleep(0.3)
                got = page.evaluate(read); print(("○" if got == want else "✗"), bid, "連打の最中に押す →", got); ok = ok and got == want
            br.close()
        srv.shutdown()
    sys.exit(0 if ok else 1)
if __name__ == "__main__": main()
