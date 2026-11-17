#!/usr/bin/env python3
"""1分のあいだに ふきだしが何回・どんなセリフで出たかを数える。 python3 tools/talk_count.py 10 11"""
import functools, socketserver, threading, time, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from playtest import NoCache, ROOT, CHROME
from playwright.sync_api import sync_playwright
ids = [int(x) for x in sys.argv[1:]] or [10, 11]
socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT))) as srv:
    port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path=CHROME, headless=True, args=["--mute-audio"])
        for c in ids:
            page = br.new_page(viewport={"width": 390, "height": 844}); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            page.goto(f"http://127.0.0.1:{port}/index.html#play&c={c}&auto")
            page.evaluate("window.__said=[];new MutationObserver(()=>{const b=document.getElementById('bubble');if(b.classList.contains('on')){const t=b.lastChild&&b.lastChild.nodeValue;if(t&&window.__said[window.__said.length-1]!==t)window.__said.push(t)}}).observe(document.getElementById('bubble'),{childList:true,attributes:true})")
            time.sleep(63)
            said = page.evaluate("window.__said"); st = page.evaluate("[__g.S.hits,__g.S.spCount]")
            print(f"相手{c}: 1分で ふきだし {len(said)}回(ちがうセリフ {len(set(said))}種)/ 発数 {st[0]} / 必殺 {st[1]}回 / エラー {errs[:1] or 'なし'}")
            print("   ", " / ".join(said[:14]))
            page.close()
        br.close()
    srv.shutdown()
