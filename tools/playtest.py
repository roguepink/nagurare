#!/usr/bin/env python3
"""ゲームを Mac の Chrome(画面なし・音なし)で開いて、写真とエラーを集める。
  source ~/.local/venvs/ryokoshi/bin/activate
  python3 tools/playtest.py [--hash "play&c=1&auto"] [--secs 6] [--shots 3] [--size 390x844] [--out _check/pt] [--eval "JS"] [--before "JS"]
  アドレスの印: play(すぐ始める) c=1..10(相手) auto(自動で殴る) t=秒(制限時間) down(すぐダウン)
  ※ 音は出ない(--mute-audio)。Mac の画面もつけない(headless)。"""
import argparse, functools, http.server, socketserver, threading, time, json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hash", default="noinstall"); ap.add_argument("--secs", type=float, default=4); ap.add_argument("--shots", type=int, default=1)
    ap.add_argument("--size", default="390x844"); ap.add_argument("--out", default="_check/pt"); ap.add_argument("--eval", default=""); ap.add_argument("--before", default="")
    ap.add_argument("--first", type=float, default=2.0)
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    out = ROOT / a.out; out.parent.mkdir(parents=True, exist_ok=True)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT))) as srv:
        port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
        w, h = (int(x) for x in a.size.split("x"))
        with sync_playwright() as p:
            br = p.chromium.launch(executable_path=CHROME, headless=True, args=["--mute-audio", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
            ctx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, has_touch=True, is_mobile=True)
            page = ctx.new_page(); errors = []
            page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
            page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))
            page.goto(f"http://127.0.0.1:{port}/index.html#{a.hash}")
            time.sleep(a.first)
            if a.before: print("before:", page.evaluate(a.before))
            for i in range(a.shots):
                if i: time.sleep(a.secs / max(1, a.shots - 1))
                page.screenshot(path=f"{out}-{i+1}.png"); print("撮った:", f"{a.out}-{i+1}.png")
            try:
                print("状態:", json.dumps(page.evaluate("(()=>{const S=__g.S;return {state:S.state,hits:S.hits,downs:S.downs,maxCombo:S.maxCombo,time:+S.time.toFixed(1),gauge:+S.gauge.toFixed(0)}})()"), ensure_ascii=False))
            except Exception as e: print("状態が読めない:", e)
            if a.eval: print("eval:", page.evaluate(a.eval))
            br.close()
        srv.shutdown()
    print("エラー:", "なし" if not errors else ""); [print("  ", e[:300]) for e in errors[:15]]

if __name__ == "__main__":
    main()
