# 殴られ屋(repo roguepink/nagurare)

ノブさんの依頼(2026-11-16): 「殴られ屋」(お金をもらって殴られる、よけるのがうまい人)をイメージした、
**1分間で何回殴れるかのスッキリ系 3D ゲーム**。勝ち抜きではない。楽しさより **気持ちよさ** を重視。
- 相手は10人。最初から全員えらべる。相手は **よけるだけで、攻撃してこない**
- こちらはタップで殴る。画面の下からグローブが飛び出す
- 10人それぞれ 背景・速さ・よけ方・ダウンの仕方が違う。ふざけたキャラもいる
- ボスは 野菜カット工場のおばさん(帽子・マスクで目しか見えない。その目がとにかく嫌)。嫌味を言う

公開リポジトリ。**写真・映画素材・個人情報・API キーは置かない。** 実在の人・会社の名前は使わない(全員 作り話)。

## 作り(ビルドなし)
- `index.html`(画面の枠・CSS)+ `js/game.js`(本体)`js/chars.js`(10人)`js/stages.js`(背景10か所)`js/kit.js`(形の道具)`js/sfx.js`(音)
- ES modules を **相対パスで** 読む(importmap は使わない = 古い iPhone で真っ白になるため)
- three.js r186 は `vendor/three/`(npm 公式の箱 three@0.186.1 の build/ そのまま。buhin-check で全部 ○ を確認ずみ。入れかえたら必ずもう一度チェック)
- 画像・音のファイルは使わない。顔は canvas に描いて頭の球に貼る。音は WebAudio
- js を足したら `sw.js` の FILES に足して VERSION を上げる

## 確認
```
source ~/.local/venvs/ryokoshi/bin/activate
python3 tools/playtest.py --hash "play&c=10&auto" --first 4 --out _check/x     # 1場面
python3 tools/sheet.py --hash "auto&t=15" --wait 16.2 --scale 0.4              # 10人ぶんを並べる + 当たった数
python3 tools/sheet.py --hash "down" --wait 1.45 --frames 0.25,0.75,1.25,1.75,2.25,2.9 --scale 0.5 --only 1,2,3,4,5   # ダウンのコマ送り
```
アドレスの印: `play`(すぐ始める)`c=1..10`(相手)`auto`(自動で殴る。人の反応の遅れ 0.22 秒つき)`t=秒` `down`(すぐダウン)。
`window.__g` に状態が入っている。**撮った絵は必ず目で見る。音は出さない(--mute-audio)。**

## キャラを足す・直すとき(js/chars.js)
- `ai`: quick(体の速さ)p(よける確率)react(気づくまで)hold / cd / moves(duck slip back step jump spin warp)stun / sway・bob・hop・step(ふだんの動き)
- 人が殴ると、ねらいが 0.2 秒ほど遅れる。**当てにくさは「ふだんの動きの速さ(sway・bob)」がいちばん効く**
- `down(R, k, fx, st)`: k = 0→1。`R.ov` に 位置・回転を書く。`fx.text / say / shake / snd / burst / count`
- `par` = 「ゲンコツ級」と「鉄拳級」の境目の発数(結果の称号に使う)

## 公開
- `main` が GitHub Pages(https://roguepink.github.io/nagurare/)。**`main` に入れる = 公開**。長い直しは別の枝で
