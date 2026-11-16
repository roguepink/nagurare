/* 殴られ屋 — 10人の殴られ屋 + ひみつの部屋(見た目・顔・動き方・ダウンの仕方・セリフ・顔のはれ方)
   みんな「嫌なやつ」。殴るほど顔が変形する(lv 0〜6)。 */
import { THREE, G, add, grp, mat, canvasTex, sign, ease, seg, clamp } from './kit.js';

const PI = Math.PI;
const INK = '#2a1c14';

/* ================= 顔の絵(頭の球に貼る。512x256、まん中が正面) ================= */
function drawEye(x, f, px, ey, s, expr) {
  const rx = f.erx || 17, ry = f.ery || 12;
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (expr === 'hit') {   // ><
    x.strokeStyle = f.hitInk || INK; x.lineWidth = 6; x.beginPath();
    x.moveTo(px + s * 14, ey - 12); x.lineTo(px - s * 9, ey); x.lineTo(px + s * 14, ey + 12); x.stroke(); return;
  }
  if (expr === 'dizzy') {  // ぐるぐる
    x.strokeStyle = f.hitInk || INK; x.lineWidth = 3.5; x.beginPath();
    for (let a = 0; a < 15; a += 0.3) { const r = 1 + a * 1.05, X = px + Math.cos(a) * r, Y = ey + Math.sin(a) * r; if (a === 0) x.moveTo(X, Y); else x.lineTo(X, Y); }
    x.stroke(); return;
  }
  if (expr === 'beg') {    // うるうる(ゆるして の目)
    x.fillStyle = '#fff'; x.beginPath(); x.arc(px, ey + 2, 21, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#2a1a3a'; x.beginPath(); x.arc(px, ey + 4, 15, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(px - 6, ey - 3, 6, 0, 7); x.fill(); x.beginPath(); x.arc(px + 6, ey + 9, 3.5, 0, 7); x.fill(); x.beginPath(); x.arc(px - 7, ey + 11, 2, 0, 7); x.fill();
    x.fillStyle = 'rgba(110,200,255,.9)'; x.beginPath(); x.ellipse(px, ey + 21, 17, 6, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(px + s * 12, ey + 32, 5, 8, 0, 0, 7); x.fill(); return;
  }
  if (f.wink === s) { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(px - 15, ey - 2); x.quadraticCurveTo(px, ey + 7, px + 15, ey - 4); x.stroke(); return; }
  if (expr === 'smug' && f.smugEye === 'arc') {   // 笑って細くなる いやな目
    if (f.shadow) { x.fillStyle = f.shadow; x.beginPath(); x.ellipse(px, ey - 5, rx + 6, ry + 6, 0, 0, 7); x.fill(); }
    x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.arc(px, ey + 10, 17, 1.13 * PI, 1.87 * PI); x.stroke(); return;
  }
  if (f.shadow) { x.fillStyle = f.shadow; x.beginPath(); x.ellipse(px, ey - 5, rx + 6, ry + 7, 0, 0, 7); x.fill(); }
  x.save(); x.beginPath(); x.ellipse(px, ey, rx, ry, 0, 0, 7); x.clip();
  x.fillStyle = f.white || '#fff'; x.fillRect(px - rx, ey - ry, rx * 2, ry * 2);
  if (f.blood) { x.strokeStyle = 'rgba(220,40,40,.7)'; x.lineWidth = 1.5; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(px + s * rx, ey - 6 + i * 4); x.lineTo(px + s * (rx - 9), ey - 3 + i * 2); x.stroke(); } }
  const lk = f.look || [0, 0], pr = f.pupil || 7, lx = px + lk[0], ly = ey + lk[1];
  x.fillStyle = f.iris || '#3a2414'; x.beginPath(); x.arc(lx, ly, pr, 0, 7); x.fill();
  x.fillStyle = '#000'; x.beginPath(); x.arc(lx, ly, pr * 0.52, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(lx - pr * 0.35, ly - pr * 0.4, pr * 0.3, 0, 7); x.fill();
  const lid = (f.lid || 0) + (expr === 'smug' ? 0.14 : 0), sl = f.slant || 0;
  if (lid > 0) {   // まぶた。内側が低い = いじわる
    const xi = px - s * (rx + 2), xo = px + s * (rx + 2), yi = ey - ry + ry * 2 * lid + sl * 7, yo = ey - ry + ry * 2 * lid - sl * 7;
    x.fillStyle = f.lidCol || f.skin; x.beginPath(); x.moveTo(xi, ey - ry - 4); x.lineTo(xo, ey - ry - 4); x.lineTo(xo, yo); x.lineTo(xi, yi); x.closePath(); x.fill();
    x.strokeStyle = INK; x.lineWidth = f.lash ? 5 : 3.5; x.beginPath(); x.moveTo(xo, yo); x.lineTo(xi, yi); x.stroke();
  }
  x.restore();
  x.strokeStyle = INK; x.lineWidth = 2.5; x.beginPath(); x.ellipse(px, ey, rx, ry, 0, 0, 7); x.stroke();
  if (f.lash) { x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(px + s * (rx - 3 + i * 2), ey - ry * 0.55 + i * 4); x.lineTo(px + s * (rx + 8), ey - ry * 0.9 + i * 6); x.stroke(); } }
  if (f.bags) { x.strokeStyle = 'rgba(90,40,50,.55)'; x.lineWidth = 2.5; x.beginPath(); x.arc(px, ey + 4, rx + 3, 0.2 * PI, 0.8 * PI); x.stroke(); }
}
function drawMouth(x, type, cx, my, f, lv) {
  x.strokeStyle = f.lipCol || '#4a1c18'; x.lineWidth = f.lipCol ? 6 : 4.5; x.lineCap = 'round'; x.lineJoin = 'round';
  const gap = function (gx, gy, w, h) { if (lv >= 3) { x.fillStyle = '#3a0c0c'; x.fillRect(gx, gy, w, h); } };
  x.beginPath();
  switch (type) {
    case 'flat': x.moveTo(cx - 15, my); x.lineTo(cx + 15, my); x.stroke(); break;
    case 'frown': x.arc(cx, my + 22, 24, 1.2 * PI, 1.8 * PI); x.stroke(); x.beginPath(); x.moveTo(cx - 24, my + 6); x.lineTo(cx - 28, my + 12); x.moveTo(cx + 24, my + 6); x.lineTo(cx + 28, my + 12); x.stroke(); break;
    case 'smirk': x.moveTo(cx - 17, my + 3); x.quadraticCurveTo(cx + 4, my + 9, cx + 24, my - 10); x.stroke(); break;
    case 'sneer':
      x.moveTo(cx - 20, my + 4); x.quadraticCurveTo(cx, my + 7, cx + 25, my - 12); x.lineTo(cx + 23, my + 3); x.quadraticCurveTo(cx + 4, my + 15, cx - 20, my + 4); x.closePath();
      x.fillStyle = '#fff'; x.fill(); x.stroke(); x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + 2 + i * 7, my + 2 - i * 3); x.lineTo(cx + 2 + i * 7, my + 11 - i * 3); x.stroke(); } gap(cx + 10, my - 3, 6, 9); break;
    case 'grin': case 'gold': case 'fang':
      x.moveTo(cx - 28, my - 8); x.quadraticCurveTo(cx, my + 2, cx + 28, my - 8); x.quadraticCurveTo(cx, my + 32, cx - 28, my - 8); x.closePath();
      x.fillStyle = '#fff'; x.fill(); x.stroke();
      if (type === 'fang') { x.fillStyle = '#5a1414'; x.beginPath(); x.moveTo(cx - 22, my + 1); for (let i = 0; i < 8; i++) x.lineTo(cx - 19 + i * 5.5, my + (i % 2 ? 0 : 9)); x.lineTo(cx + 22, my + 1); x.quadraticCurveTo(cx, my + 24, cx - 22, my + 1); x.fill(); }
      else { x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 20, my + 5); x.lineTo(cx + 20, my + 5); for (let i = -2; i <= 2; i++) { x.moveTo(cx + i * 8, my - 4); x.lineTo(cx + i * 8, my + 13); } x.stroke(); }
      if (type === 'gold' && lv < 3) { x.fillStyle = '#f4c20d'; x.fillRect(cx + 1, my - 3, 7, 8); }
      gap(type === 'gold' ? cx + 1 : cx - 15, my - 4, 7, 9); break;
    case 'shout':
      x.fillStyle = '#5a1414'; x.ellipse(cx, my + 4, 19, 22, 0, 0, 7); x.fill(); x.stroke();
      x.fillStyle = '#fff'; x.fillRect(cx - 13, my - 14, 26, 7); gap(cx - 4, my - 14, 8, 7); x.fillStyle = '#ff8a8a'; x.beginPath(); x.ellipse(cx, my + 17, 11, 6, 0, 0, 7); x.fill(); break;
    case 'yell':
      x.fillStyle = '#5a1414'; x.moveTo(cx - 22, my - 10); x.lineTo(cx + 22, my - 12); x.lineTo(cx + 18, my + 16); x.lineTo(cx - 18, my + 16); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#fff'; x.fillRect(cx - 16, my - 9, 32, 6); x.fillRect(cx - 13, my + 9, 26, 5); gap(cx + 4, my - 9, 7, 6); break;
    case 'bero':
      x.moveTo(cx - 17, my + 1); x.quadraticCurveTo(cx + 4, my + 8, cx + 24, my - 9); x.stroke();
      x.fillStyle = '#ff6f8f'; x.beginPath(); x.ellipse(cx + 6, my + 13, 9, 13, 0.15, 0, 7); x.fill(); x.strokeStyle = '#4a1c18'; x.lineWidth = 3; x.stroke(); x.lineWidth = 2; x.beginPath(); x.moveTo(cx + 5, my + 6); x.lineTo(cx + 7, my + 20); x.stroke(); break;
    case 'wavy': x.moveTo(cx - 20, my); for (let i = 0; i <= 20; i++) x.lineTo(cx - 20 + i * 2, my + Math.sin(i * 0.95) * 5); x.stroke(); break;
  }
}
function vein(x, vx, vy) {   // 怒りマーク
  x.strokeStyle = '#e02020'; x.lineWidth = 4; x.lineCap = 'round';
  for (let i = 0; i < 4; i++) { x.save(); x.translate(vx, vy); x.rotate(i * PI / 2); x.beginPath(); x.arc(9, 9, 6, PI, 1.5 * PI); x.stroke(); x.restore(); }
}
function bandage(x, bx, by, r, w) { x.save(); x.translate(bx, by); x.rotate(r); x.fillStyle = '#f3dfb8'; x.fillRect(-w / 2, -6, w, 12); x.fillStyle = 'rgba(150,110,70,.6)'; for (let i = -1; i <= 1; i++) x.fillRect(i * 5 - 1, -2, 2, 2); x.restore(); }
/* 殴られた分だけ顔が変わる(下に描く分・上に描く分) */
function dmgUnder(x, f, lv, cx, ey, ex) {
  if (lv >= 6) { x.fillStyle = 'rgba(255,70,70,.16)'; x.fillRect(0, 0, 512, 256); }
  if (lv >= 2) { const g = x.createRadialGradient(cx - ex, ey, 6, cx - ex, ey, 36); g.addColorStop(0, 'rgba(80,35,125,.9)'); g.addColorStop(1, 'rgba(80,35,125,0)'); x.fillStyle = g; x.fillRect(cx - ex - 38, ey - 38, 76, 76); }
  if (lv >= 1 && !f.masked) { x.fillStyle = 'rgba(255,55,55,.6)'; x.beginPath(); x.ellipse(cx + ex + 26, ey + 40, 25, 17, 0, 0, 7); x.fill(); }
  if (lv >= 4 && !f.masked) { x.fillStyle = 'rgba(160,60,140,.5)'; x.beginPath(); x.ellipse(cx - ex - 28, ey + 44, 22, 15, 0, 0, 7); x.fill(); }
  if (lv >= 5 && !f.capped) { x.fillStyle = 'rgba(120,50,140,.45)'; x.beginPath(); x.ellipse(cx - 30, ey - 50, 20, 10, 0.2, 0, 7); x.fill(); }
}
function dmgOver(x, f, lv, cx, ey, ex, my, expr) {
  const puff = function (px, full) {
    const g = x.createRadialGradient(px, ey - 4, 3, px, ey, 28); g.addColorStop(0, '#b97aa6'); g.addColorStop(1, f.lidCol || f.skin);
    x.fillStyle = g; x.beginPath(); if (full) x.ellipse(px, ey, 26, 20, 0, 0, 7); else x.ellipse(px, ey - 9, 25, 12, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(60,20,40,.85)'; x.lineWidth = 3.5; x.lineCap = 'round'; x.beginPath();
    if (full) { x.moveTo(px - 15, ey + 6); x.quadraticCurveTo(px, ey + 12, px + 15, ey + 5); } else { x.moveTo(px - 20, ey + 1); x.quadraticCurveTo(px, ey + 5, px + 20, ey); }
    x.stroke();
  };
  if (lv >= 3) puff(cx + ex, true);
  if (lv >= 6) puff(cx - ex, true); else if (lv >= 4) puff(cx - ex, false);
  if (!f.masked) {
    if (lv >= 1) bandage(x, cx - ex - 24, ey + 44, -0.5, 34);
    if (lv >= 4) { bandage(x, cx, ey + 26, 0, 30); if (!f.noMouth && expr !== 'hit') { x.fillStyle = '#e8566a'; x.beginPath(); x.ellipse(cx + 5, my + 15, 21, 9, 0.05, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(cx - 2, my + 12, 7, 2.5, 0, 0, 7); x.fill(); } }
  }
  if (lv >= 5) { x.strokeStyle = 'rgba(90,190,255,.9)'; x.lineWidth = 5; x.lineCap = 'round'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * (ex + 8), ey + 16); x.quadraticCurveTo(cx + s * (ex + 14), ey + (f.masked ? 20 : 40), cx + s * (ex + 9), ey + (f.masked ? 24 : 62)); x.stroke(); } }
  if (lv >= 5 && !f.capped) { bandage(x, cx + 34, ey - 48, 0.7, 36); bandage(x, cx + 34, ey - 48, -0.7, 36); }
}
function faceTex(f, expr, lv, k) {
  k = k || 1;
  return canvasTex(512 * k, 256 * k, function (x) {
    x.scale(k, k);
    const cx = 256, ey = f.ey || 114, ex = f.ex || 36, my = f.my || 178;
    x.fillStyle = f.skin; x.fillRect(0, 0, 512, 256);
    if (f.custom) { f.custom(x, expr, cx, ey, lv); return; }
    dmgUnder(x, f, lv, cx, ey, ex);
    if (f.under) f.under(x, expr, cx, ey, lv);
    if (expr === 'hit' || expr === 'dizzy' || expr === 'beg') { x.fillStyle = 'rgba(255,80,80,.45)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * (ex + 24), ey + 36, 20, 12, 0, 0, 7); x.fill(); } }
    for (const s of [-1, 1]) drawEye(x, f, cx + s * ex, ey, s, expr);
    if (!f.noBrow) {
      const a = expr === 'hit' || expr === 'beg' ? -0.9 : expr === 'dizzy' ? -0.5 : (f.brow || 0), by = ey - (f.browY || 25) - (expr === 'beg' ? 6 : 0);
      x.strokeStyle = f.browCol || INK; x.lineWidth = f.browW || 6; x.lineCap = 'round';
      for (const s of [-1, 1]) { const px = cx + s * ex, up = (expr === 'smug' && s === 1) ? -7 : 0;
        x.beginPath(); x.moveTo(px - s * 15, by + a * 8 + up); x.lineTo(px + s * 18, by - a * 5 + up); x.stroke(); }
    }
    if (f.vein && expr !== 'hit' && expr !== 'dizzy' && expr !== 'beg') vein(x, cx + 64, ey - 50);
    if (!f.noNose) { x.strokeStyle = 'rgba(110,55,35,.6)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, ey + 27, 5.5, 0.1 * PI, 0.9 * PI); x.stroke(); }
    if (!f.noMouth) drawMouth(x, expr === 'hit' ? 'shout' : expr === 'dizzy' || expr === 'beg' ? 'wavy' : expr === 'smug' ? (f.smugMouth || 'bero') : (f.mouth || 'sneer'), cx, my, f, lv);
    if (f.over) f.over(x, expr, cx, ey, lv);
    dmgOver(x, f, lv, cx, ey, ex, my, expr);
  });
}

/* ================= 体を組み立てる ================= */
export const ARMS = {
  guard: { ux: -0.95, uz: 0.22, fx: -2.0, fz: 0.1 },
  down: { ux: 0.05, uz: 0.14, fx: -0.2, fz: 0 },
  hips: { ux: 0.3, uz: 0.85, fx: -0.35, fz: -1.85 },
  cross: { ux: -0.62, uz: 0.02, fx: -1.5, fz: -1.2 },
  phone: { ux: -0.75, uz: 0.1, fx: -1.45, fz: -0.25 },
  hair: { ux: -1.5, uz: 0.5, fx: -2.3, fz: -0.3 },
  offer: { ux: -0.8, uz: 0.1, fx: -0.9, fz: -0.1 },
  loose: { ux: -0.5, uz: 0.55, fx: -1.15, fz: 0 },
  nin: { ux: -0.55, uz: -0.12, fx: -1.8, fz: -0.5 }
};
const EXPRS = ['idle', 'hit', 'dizzy', 'smug', 'beg'];

export function buildChar(def) {
  const R = { def: def, tex: {}, acc: {}, arms: [], legs: [], lv: 0, curExpr: 'idle' };
  const o = def.out, w = def.w, bel = def.belly || 0;
  const L = R.L = 0.78 * def.h, T = R.T = 0.56 * def.h, hr = R.hr = 0.165 * (def.headS || 1);
  R.root = grp(null); R.body = grp(R.root); R.hips = grp(R.body, 0, L, 0);
  const skin = def.face.skin;
  for (const s of [-1, 1]) {
    const lg = grp(R.body, s * 0.105 * w, L, 0), lw = 0.078 * (def.legW || 1);
    add(lg, G.cyl, o.leg, [0, -L / 2, 0], [lw, L, lw]);
    if (o.boot) add(lg, G.cyl, o.shoe, [0, -L + 0.17, 0], [lw + 0.012, 0.34, lw + 0.012]);
    if (o.shorts) add(lg, G.cyl, o.shorts, [0, -0.13, 0], [lw + 0.022, 0.3, lw + 0.022]);
    add(lg, G.sph, o.shoe, [0, -L + 0.05, 0.05], [0.085 * (def.legW || 1), 0.055, 0.15]);
    R.legs.push(lg);
  }
  R.torso = add(R.hips, G.sph, o.top, [0, T * 0.5, 0], [0.235 * w, T * 0.62, 0.16 * w * (1 + 0.2 * bel)]);
  if (bel) R.belly = add(R.hips, G.sph, o.belly || o.top, [0, T * 0.3, 0.06 * bel], [0.25 * w, T * 0.47, 0.2 * w]);
  add(R.hips, G.sph, o.shorts || o.leg, [0, 0.02, 0], [0.205 * w, 0.15, 0.155 * w * (1 + 0.15 * bel)]);
  add(R.hips, G.cyl, skin, [0, T + 0.02, 0], [0.055, 0.12, 0.055]);
  R.head = grp(R.hips, 0, T + 0.05, 0);
  R.hc = grp(R.head, 0, hr * 0.95, 0);
  EXPRS.forEach(function (e) { R.tex[e] = faceTex(def.face, e, 0, def.hires); });
  R.faceMat = new THREE.MeshLambertMaterial({ map: R.tex.idle });
  R.headMesh = new THREE.Mesh(G.head, R.faceMat); R.headMesh.scale.set(hr, hr * 1.07, hr); R.hc.add(R.headMesh);
  if (!def.noEars) for (const s of [-1, 1]) add(R.hc, G.sph, skin, [s * hr * 0.98, -hr * 0.05, 0], [hr * 0.12, hr * 0.22, hr * 0.16]);
  for (const s of [-1, 1]) {
    const aw = 0.055 * (def.armW || 1);
    const sh = grp(R.hips, s * (0.225 * w + 0.03), T * 0.84, 0);
    add(sh, G.sph, o.sleeve || o.top, [0, 0, 0], aw * 1.25);
    add(sh, G.cyl, o.sleeve || o.top, [0, -0.135, 0], [aw, 0.27, aw]);
    const el = grp(sh, 0, -0.27, 0);
    add(el, G.sph, o.fore || o.sleeve || o.top, [0, 0, 0], aw * 1.02);
    add(el, G.cyl, o.fore || o.sleeve || o.top, [0, -0.125, 0], [aw * 0.92, 0.25, aw * 0.92]);
    const hand = add(el, G.sph, o.hand || skin, [0, -0.285, 0], (o.handR || 0.066));
    R.arms.push({ sh: sh, el: el, hand: hand, s: s });
  }
  // はれる所(ほっぺ・まぶた・たんこぶ)。はじめは見えない
  const cheekCol = def.cheekCol || new THREE.Color(skin).lerp(new THREE.Color(0xff5a5a), 0.45).getHex();
  R.cheeks = [-1, 1].map(function (s) { const m = add(R.hc, G.sph, cheekCol, [s * hr * 0.58, -hr * 0.34, hr * 0.6], 0.001); m.visible = false; return m; });
  R.lids = [-1, 1].map(function (s) { const m = add(R.hc, G.sph, def.lidCol3 || 0xb97aa6, [s * hr * 0.4, hr * 0.13, hr * 0.86], 0.001); m.visible = false; return m; });
  R.bumps = [];
  [[-0.45, 0.92, 0.3], [0.5, 0.85, 0.1], [0.05, 1.02, -0.15], [-0.45, 1.36, 0.3]].forEach(function (p, i) {
    const b = grp(R.hc, p[0] * hr, p[1] * hr, p[2] * hr), k = i === 3 ? 0.62 : 1; b.scale.setScalar(0.001); b.visible = false;
    add(b, G.sph, 0xff7b6b, [0, 0, 0], [hr * 0.3 * k, hr * 0.36 * k, hr * 0.3 * k]);
    add(b, G.box, 0xfff6e0, [0, hr * 0.3 * k, 0], [hr * 0.36 * k, hr * 0.03, hr * 0.1 * k]); add(b, G.box, 0xfff6e0, [0, hr * 0.3 * k, 0], [hr * 0.1 * k, hr * 0.03, hr * 0.36 * k]);
    R.bumps.push(b);
  });
  R.tower = [];
  R.swT = [0, 0, 0, 0, 0, 0, 0, 0]; R.swC = [0, 0, 0, 0, 0, 0, 0, 0];   // 右ほお・左ほお・右まぶた・左まぶた・こぶ1〜4
  def.dress(R, { T: T, L: L, hr: hr, w: w, skin: skin });
  R.root.traverse(function (m) { if (m.isMesh) m.frustumCulled = false; });
  return R;
}
/* 顔のはれ具合を変える(lv 0〜6)。say = 上がった瞬間(お知らせを出す) */
export const DMG_TEXT = ['', 'ほっぺ まっか!', '青タン できた!', '目が はれた!', 'たんこぶ 2つめ!', 'ボッコボコ!', '顔面 ほうかい!!'];
export function setDamage(R, lv, fx, say) {
  R.lv = lv;
  EXPRS.forEach(function (e) { const old = R.tex[e]; R.tex[e] = faceTex(R.def.face, e, lv, R.def.hires); old.dispose(); });
  R.faceMat.map = R.tex[R.curExpr] || R.tex.idle;
  R.swT = [lv >= 1 ? 0.2 + 0.05 * lv : 0, lv >= 2 ? 0.14 + 0.05 * lv : 0, lv >= 3 ? 0.27 : 0, lv >= 6 ? 0.27 : lv >= 4 ? 0.16 : 0, lv >= 2 ? 1 : 0, lv >= 4 ? 1 : 0, lv >= 5 ? 1 : 0, lv >= 6 ? 1 : 0];
  if (R.def.face.masked) { R.swT[0] *= 0.6; R.swT[1] *= 0.6; }
  if (lv === 0) { R.tower.forEach(function (m) { R.hc.remove(m); }); R.tower = []; }
  let t = DMG_TEXT[lv];
  if (R.def.dmg) { const r = R.def.dmg(R, lv, fx, say); if (r) t = r; }
  if (say && fx && t) fx.dmg(t, lv);
}
/* たんこぶの塔を1段のばす(ひみつの部屋用) */
export function growTower(R) {
  const hr = R.hr, n = R.tower.length; if (n >= 7) return false;
  const k = 0.55 * Math.pow(0.9, n), y = hr * (1.36 + 0.26 + n * 0.24);
  const g = grp(R.hc, -0.45 * hr + Math.sin(n * 1.7) * hr * 0.05, y, 0.3 * hr);
  add(g, G.sph, n % 2 ? 0xff9a8a : 0xff7b6b, [0, 0, 0], [hr * 0.3 * k, hr * 0.34 * k, hr * 0.3 * k]);
  g.traverse(function (m) { m.frustumCulled = false; }); g.scale.setScalar(0.01); g.userData.k = 0; R.tower.push(g); return true;
}
export function animSwell(R, dt) {
  const hr = R.hr;
  for (let i = 0; i < 8; i++) {
    const c = R.swC[i], t = R.swT[i]; if (c === t) continue;
    const n = Math.abs(t - c) < 0.004 ? t : c + (t - c) * Math.min(1, dt * 9); R.swC[i] = n;
    const pop = 1 + Math.max(0, t - n) * 1.5;
    if (i < 2) { const m = R.cheeks[i === 0 ? 1 : 0]; m.visible = n > 0.01; m.scale.set(hr * n * pop, hr * n * 0.85 * pop, hr * n * 0.8 * pop); }
    else if (i < 4) { const m = R.lids[i === 2 ? 1 : 0]; m.visible = n > 0.01; m.scale.set(hr * n * 1.15, hr * n * 0.85, hr * n * 0.6); }
    else { const b = R.bumps[i - 4]; b.visible = n > 0.01; b.scale.setScalar(Math.max(0.001, n * pop)); }
  }
  for (let i = 0; i < R.tower.length; i++) { const g = R.tower[i]; if (g.userData.k < 1) { g.userData.k = Math.min(1, g.userData.k + dt * 5); g.scale.setScalar(ease.out(g.userData.k) * (1 + Math.sin(g.userData.k * PI) * 0.7)); } }
}
export function disposeChar(R) {
  Object.keys(R.tex).forEach(function (k) { R.tex[k].dispose(); });
  R.faceMat.dispose();
  R.root.traverse(function (o) { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.userData.tex) { o.userData.tex.dispose(); o.material.dispose(); } });
  if (R.root.parent) R.root.parent.remove(R.root);
}
function hairCap(R, color, theta, tilt, sc, parent) {
  const g = new THREE.SphereGeometry(R.hr * (sc || 1.06), 22, 10, 0, PI * 2, 0, theta);
  const m = new THREE.Mesh(g, mat(color, { ds: 1 })); m.rotation.x = tilt || 0; m.scale.y = 1.07; (parent || R.hc).add(m); return m;
}
function once(st, key, cond, fn) { if (cond && !st[key]) { st[key] = 1; fn(); } }

/* ボス(工場のおばさん)の服。ひみつの部屋でも使う */
function bossDress(R, K) {
  const perm = grp(R.hc); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, r = i % 2 ? 0.62 : 0.3; add(perm, G.sph, 0x7a4d86, [Math.cos(a) * K.hr * r, K.hr * (0.78 + (i % 2 ? -0.12 : 0.1)), Math.sin(a) * K.hr * r - K.hr * 0.1], K.hr * 0.3); }
  const cap = grp(R.hc); R.acc.cap = cap; R.capTilt = 0;
  const cg = new THREE.SphereGeometry(K.hr * 1.1, 22, 10, 0, PI * 2, 0, 0.5 * PI), cm = new THREE.Mesh(cg, mat(0xffffff, { ds: 1 })); cm.rotation.x = -0.5; cm.scale.set(1.04, 1.22, 1.06); cap.add(cm);
  add(cap, G.tor, 0x8fc7e8, [0, K.hr * 0.3, -K.hr * 0.1], [K.hr * 1.1, K.hr * 1.14, K.hr * 0.5], [PI / 2 - 0.5, 0, 0]);
  add(R.hips, G.box, 0xa9d8ee, [0, K.T * 0.26, 0.2 * K.w + 0.04], [0.36 * K.w, K.T * 0.95, 0.015], [-0.06, 0, 0]);
  add(R.hips, G.box, 0xa9d8ee, [0, K.T * 0.8, 0.165 * K.w], [0.2 * K.w, 0.2, 0.015], [-0.3, 0, 0]);
  sign(R.hips, 'リーダー', { w: 0.14, h: 0.05, bg: '#e53935', fg: '#fff', p: [0.1, K.T * 0.82, 0.172 * K.w + 0.01], r: [-0.3, 0, 0] });
  if (R.def.room) {   // ひみつの部屋は 立体の鼻・ゆれるイヤリングつき
    const nm = new THREE.MeshLambertMaterial({ color: 0xe0a888 }); R.acc.noseMat = nm;
    R.acc.nose = new THREE.Mesh(G.sph, nm); R.acc.nose.position.set(0, -K.hr * 0.1, K.hr * 0.97); R.acc.nose.scale.set(K.hr * 0.15, K.hr * 0.17, K.hr * 0.17); R.hc.add(R.acc.nose);
    R.acc.dangle = [];
    for (const s of [-1, 1]) { const e = grp(R.hc, s * K.hr * 1.03, -K.hr * 0.28, 0); add(e, G.tor, 0xf4c20d, [0, -K.hr * 0.16, 0], [K.hr * 0.13, K.hr * 0.13, K.hr * 0.13], [0, PI / 2, 0]); add(e, G.sph, 0xff5a8a, [0, -K.hr * 0.34, 0], K.hr * 0.05); R.acc.dangle.push(e); }
  }
}
function bossDmg(R, lv, fx, say) { R.capTilt = lv * 0.1; R.acc.cap.rotation.z = R.capTilt; R.acc.cap.position.x = lv * R.hr * 0.05;
  if (R.def.room) { const k = 1 + lv * 0.13, hr = R.hr; R.acc.nose.scale.set(hr * 0.15 * k, hr * 0.17 * k, hr * 0.17 * k); R.acc.noseMat.color.set(lv >= 3 ? 0xe86a6a : lv >= 1 ? 0xe89a88 : 0xe0a888); R.acc.cap.visible = lv < 5;
    if (say && lv === 5 && fx) fx.burst('star', 10, [0, 1.7, 0.3]); if (lv === 1) return 'はなが まっか!'; if (lv === 5) return 'ぼうしが ふっとんだ!'; } return lv === 2 ? 'マスカラが 流れた!' : lv === 4 ? (R.def.room ? 'くちびる たらこ!' : 'マスクが ずり落ちた!') : lv === 3 ? '帽子が ゆがんだ!' : ''; }
const BOSS_OUT = { top: 0xf5f9fa, leg: 0xf5f9fa, shoe: 0xffffff, belly: 0xf5f9fa, hand: 0xff8fb0, handR: 0.074, fore: 0xa9d8ee, boot: 1 };

/* ================= 10人 + ひみつの部屋 =================
   ai: quick = 体の動きの速さ / p = 殴られそうなとき よける確率 / react = 気づくまでの秒 / hold = よけている秒 / cd = 次によけられるまで
       moves = よけ方 / stun = 殴られてひるむ秒 / home = ふだんの奥行き(0 が手前、マイナスが奥)
       modes = ふだんの動き方 [名前, 出やすさ, 短い秒, 長い秒, 細かい設定](game.js の motion() を見る)
   tough = ダウンまでの がまん / par = 「鉄拳級」の発数の目安 */
export const CHARS = [
  { id: 'tencho', name: 'ぼったくり店長 ゴンゾウ', crime: '水1杯300円。お通し代3000円。', stage: 'shokudo', speed: 1, voice: 95, par: 200,
    blurb: '太っていて動けない。殴られ放題!', h: 1.0, w: 1.75, belly: 1.2, headS: 1.12, legW: 1.5, armW: 1.5, jig: 2.6,
    out: { top: 0xe9e4d4, leg: 0x2f3e63, shoe: 0x3a2a20, belly: 0xe9e4d4 },
    face: { skin: '#e3b088', eye: 'white', erx: 13, ery: 9, pupil: 5, lid: 0.45, slant: 0.7, look: [0, 2], white: '#fff6d8', brow: 0.95, browW: 9, mouth: 'gold', smugMouth: 'bero', vein: 1, ex: 34,
      under: function (x, e, cx, ey) { x.fillStyle = 'rgba(70,50,40,.28)'; for (let i = 0; i < 260; i++) x.fillRect(cx - 70 + ((i * 53) % 140), ey + 40 + ((i * 29) % 70), 2, 2); },
      over: function (x, e, cx, ey) { x.strokeStyle = 'rgba(120,60,40,.5)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, ey + 88, 48, 0.2 * PI, 0.8 * PI); x.stroke();
        for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 20, ey + 34); x.quadraticCurveTo(cx + s * 34, ey + 50, cx + s * 30, ey + 70); x.stroke(); }
        if (e === 'idle' || e === 'smug') { x.strokeStyle = '#c9a36a'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 12, ey + 66); x.lineTo(cx - 44, ey + 84); x.stroke(); } } },
    arms: [ARMS.hips, ARMS.hips],
    ai: { quick: 5, p: 0, react: [0.3, 0.4], hold: 0.3, cd: 1, moves: [], stun: 0.5, home: -0.15, modes: [['stand', 1, 9, 9, { sway: 0.05, bob: 0.02 }]] }, tough: 300,
    lines: ['お通し代 3000円な', '水?1杯300円だよ', '食ったら さっさと帰れ', '替え玉?別料金に決まってんだろ', '文句あんなら 食うな', 'スープ残したら 罰金な', '写真とるなら 撮影料もらうぞ', 'まずい?舌がバカなんだよ'],
    ouch: ['ぶへっ!チャーシュー出る!', 'お、おれの三段腹が!', 'ぼよよ〜ん!', 'やめろ、スープがこぼれる!', '腹は…腹はやめてくれぇ', 'お通し代、まけるから!', '水、タダにするからぁ!', 'ひぃ、麺がのびるぅ', '替え玉 サービスするって!', 'おれの金歯がぁ!'], bye: '…お代は けっこうです…',
    dress: function (R, K) {
      hairCap(R, 0x1d1a18, 0.36 * PI, -0.35);
      const h = grp(R.hc); R.acc.hachi = h;
      add(h, G.tor, 0xffffff, [0, K.hr * 0.42, 0], [K.hr * 0.98, K.hr * 0.98, K.hr * 0.7], [PI / 2 - 0.12, 0, 0]);
      add(h, G.sph, 0xffffff, [K.hr * 0.7, K.hr * 0.5, -K.hr * 0.75], K.hr * 0.22);
      add(R.hips, G.tor, 0xfff8e8, [0, K.T + 0.0, 0.01], [0.105, 0.105, 0.2], [PI / 2, 0, 0]);
      sign(R.hips, '麺', { w: 0.2, h: 0.2, bg: '#c8281e', fg: '#fff', p: [0, K.T * 0.42, 0.06 * 1.2 + 0.2 * K.w + 0.004] });
      add(R.hips, G.sph, 0x9a7a4a, [-0.14, K.T * 0.2, 0.2 * K.w + 0.05], [0.06, 0.04, 0.01]); add(R.hips, G.sph, 0x9a7a4a, [0.16, K.T * 0.55, 0.19 * K.w + 0.03], [0.04, 0.05, 0.01]);
    },
    dmg: function (R, lv) { const h = R.acc.hachi; h.rotation.z = lv >= 2 ? 0.28 : 0; h.position.y = lv >= 4 ? -R.hr * 0.3 : 0; h.rotation.x = lv >= 4 ? 0.25 : 0; return lv === 4 ? 'はちまき ずり落ち!' : lv === 3 ? '金歯が とんだ!' : ''; },
    downT: 3.0, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.12), b = seg(k, 0.12, 0.3), c = seg(k, 0.3, 0.76), d = seg(k, 0.76, 1);
      ov.rz = Math.sin(k * 90) * 0.12 * (1 - b); R.wob = Math.max(R.wob, 1.2 * (1 - d));
      ov.rx = -1.3 * ease.in2(b) * (1 - ease.io(d));
      once(st, 'a', k > 0.3, function () { fx.shake(1.6); fx.snd('thud'); fx.text('ドスン!!'); fx.burst('dust', 14, [0, 0.1, -0.5]); });
      if (c > 0 && d === 0) { const n = Math.floor(c * 3), ph = c * 3 - n, amp = [0.42, 0.24, 0.1][n] || 0; ov.y = Math.sin(ph * PI) * amp; ov.rz = Math.sin(c * 18) * 0.28 * (1 - c);
        once(st, 'b' + n, n > 0, function () { fx.snd('boing'); fx.text('ぼよん'); fx.shake(0.5); }); }
      if (d > 0) { ov.y = Math.sin(d * PI) * 0.25; once(st, 'e', true, function () { fx.say('ふぅ…腹へった'); }); }
      ov.arms = 1 - d;
    } },

  { id: 'wakazo', name: 'イキリ若造 レン', crime: '人を「ザコ」と呼び、動画でさらす。', stage: 'konbini', speed: 2, voice: 190, par: 170,
    blurb: 'ヘラヘラ歩き回って あおってくる。', h: 1.0, w: 0.95, headS: 1.0,
    out: { top: 0x7a3fd0, leg: 0x16161c, shoe: 0xf2f2f2 },
    face: { skin: '#f6d3b3', eye: 'white', lid: 0.45, slant: 0.6, pupil: 6, look: [0, 3], bags: 1, brow: 0.95, browW: 4, mouth: 'sneer', smugMouth: 'bero', browCol: '#8a6a20',
      over: function (x, e, cx, ey) { x.fillStyle = '#cfd8dc'; x.beginPath(); x.arc(cx + 22, ey + 74, 3.5, 0, 7); x.fill(); x.beginPath(); x.arc(cx - 58, ey - 22, 3, 0, 7); x.fill(); } },
    arms: [ARMS.down, ARMS.phone],
    ai: { quick: 9, p: 0.36, react: [0.06, 0.15], hold: 0.32, cd: 0.6, moves: ['slip', 'back'], stun: 0.34, home: -0.6,
      modes: [['stroll', 3, 4, 7, { ax: 0.85, az: 0.35, f: 1.5 }], ['stand', 1, 0.8, 1.4, { sway: 0.04, bob: 0.02 }]] }, tough: 170,
    lines: ['は?当たんねーし', 'おっそ。寝てんの?', 'それパンチ?ウケる', 'おっさん、息あがってね?', '動画とって さらしていい?', 'オレに勝てると思ってんの?', 'ざっこ', 'あー、だる'],
    ouch: ['いってぇ!親に言うぞ!', 'ちょ、顔はナシだろ!', 'スマホ割れたらどうすんだよ!', 'マジ無理マジ無理!', 'ごめんて!ごめんて!', '髪がくずれるだろ!', 'フォロワー減るぅ!', 'ママぁ!', '調子のってました!', 'いまの 切り抜くなよ!'], bye: 'す、すんませんでした…',
    dress: function (R, K) {
      const y = 0xf4d03f; hairCap(R, y, 0.4 * PI, -0.4); R.acc.spikes = [];
      [[-0.5, 0.75, 0.35, 0.5], [0, 0.95, 0.4, 0], [0.5, 0.75, 0.35, -0.5], [-0.3, 0.95, -0.1, 0.3], [0.3, 0.95, -0.1, -0.3], [0, 0.9, -0.5, 0]].forEach(function (p) {
        const g = grp(R.hc, p[0] * K.hr, p[1] * K.hr * 0.75, p[2] * K.hr); g.rotation.set(p[2] > 0.2 ? 0.5 : -0.3, 0, p[3]); g.userData.rz = p[3];
        add(g, G.cone, y, [0, K.hr * 0.3, 0], [K.hr * 0.3, K.hr * 0.75, K.hr * 0.3]); R.acc.spikes.push(g); });
      add(R.hips, G.sph, 0x6a33bd, [0, K.T * 0.95, -0.1], [0.16, 0.13, 0.1]);
      add(R.hips, G.box, 0x5a2aa8, [0, K.T * 0.3, 0.15], [0.2, 0.1, 0.03]);
      add(R.hips, G.tor, 0xf4c20d, [0, K.T * 0.86, 0.1], [0.09, 0.11, 0.1], [PI / 2 - 0.5, 0, 0]);
      const ph = grp(R.arms[1].el, 0, -0.33, 0.02); R.acc.phone = ph;
      add(ph, G.box, 0x111111, [0, 0, 0], [0.075, 0.14, 0.012]); add(ph, G.box, 0x9fe8ff, [0, 0, -0.007], [0.062, 0.12, 0.004], null, { glow: 0x66ccff });
    },
    dmg: function (R, lv) { R.acc.spikes.forEach(function (g, i) { g.scale.y = Math.max(0.3, 1 - lv * 0.13); g.rotation.z = g.userData.rz + lv * (i % 2 ? 0.14 : -0.14); }); return lv === 3 ? 'ツンツン頭が しおれた!' : ''; },
    downT: 2.6, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.45), b = seg(k, 0.45, 0.6), c = seg(k, 0.6, 0.86), d = seg(k, 0.86, 1);
      ov.ry = ease.out(a) * PI * 10; ov.rz = Math.sin(k * 40) * 0.2 * a * (1 - b); ov.arms = 1 - d;
      once(st, 's', true, function () { fx.text('くるくるくる…'); });
      ov.rx = 1.48 * ease.in2(b) * (1 - ease.out(d)); ov.z = -1.3 * ease.out(seg(k, 0, 0.45)) * (1 - ease.io(d));
      once(st, 'a', k > 0.6, function () { fx.shake(1.2); fx.snd('thud'); fx.text('ベチャッ!'); fx.burst('dust', 10, [0, 0.1, 0.2]); fx.burst('star', 6, [0, 0.4, 0.3]); });
      if (c > 0 && d === 0) ov.kick = 0.5 * Math.max(0, Math.sin(c * 20));
      if (d > 0) { ov.y = Math.sin(d * PI) * 0.3; once(st, 'e', true, function () { fx.say('…今の、ナシで'); }); }
    } },

  { id: 'oyaji', name: 'ガミガミおやじ 源さん', crime: '近所じゅうに どなり散らす。', stage: 'washitsu', speed: 2, voice: 120, par: 180,
    blurb: 'ずんずん近づいて どなり、すぐ下がる。', h: 0.93, w: 1.12, belly: 0.5, headS: 1.05,
    out: { top: 0xf2f0e6, leg: 0xcfd9de, shoe: 0x7a5230, belly: 0xc98f62, sleeve: 0xf2f0e6, fore: 0xeab98f },
    face: { skin: '#e9a888', eye: 'white', erx: 12, ery: 9, pupil: 4.5, lid: 0.32, slant: 0.9, blood: 1, brow: 1.2, browW: 9, browCol: '#8a8a8a', mouth: 'yell', smugMouth: 'sneer', vein: 1, ey: 112,
      under: function (x, e, cx, ey) { x.strokeStyle = 'rgba(120,70,45,.55)'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx - 40, ey - 46 - i * 9); x.quadraticCurveTo(cx, ey - 52 - i * 9, cx + 40, ey - 46 - i * 9); x.stroke(); }
        x.beginPath(); x.moveTo(cx - 6, ey - 26); x.lineTo(cx - 3, ey - 10); x.moveTo(cx + 6, ey - 26); x.lineTo(cx + 3, ey - 10); x.stroke(); },
      over: function (x, e, cx, ey, lv) {
        x.fillStyle = '#9a9a9a'; x.beginPath(); x.ellipse(cx, ey + 48, 28, 8, 0, 0, 7); x.fill();
        x.strokeStyle = '#333'; x.lineWidth = 4; for (const s of [-1, 1]) { if (lv >= 4 && s === 1) continue; x.beginPath(); x.arc(cx + s * 36, ey, 22, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(cx - 14, ey); x.lineTo(cx + 14, ey); x.stroke();
        for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 58, ey); x.lineTo(cx + s * 128, ey - 6); x.stroke(); }
        if (lv >= 2) { x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 50, ey - 14); x.lineTo(cx - 34, ey + 2); x.lineTo(cx - 44, ey + 16); x.moveTo(cx - 34, ey + 2); x.lineTo(cx - 20, ey - 4); x.stroke(); } } },
    arms: [ARMS.cross, ARMS.cross],
    ai: { quick: 11, p: 0.42, react: [0.05, 0.14], hold: 0.34, cd: 0.6, moves: ['duck', 'duck', 'slip'], stun: 0.3, home: -1.0,
      modes: [['stroll', 3, 4, 6, { ax: 0.35, az: 1.15, f: 1.9 }], ['close', 1, 1.1, 1.4, {}]] }, tough: 160,
    lines: ['なっとらん!', '近頃の若いもんは!', 'わしの若い頃はな!', 'あいさつがない!', 'その目つきは何じゃ!', 'ゴミの出し方が違う!', '回覧板が遅い!', '静かにせんか!'],
    ouch: ['ぐぬぬ、けしからん!', 'こ、こら!年寄りをいたわれ!', '入れ歯が とぶ!', '町内会に言いつけるぞ!', 'メ、メガネが!', '腰が!腰がぁ!', 'わしが悪かった…とは言わん!', 'ばかもーん!', '血圧が上がる!', '回覧板、早めに回すから!'], bye: '…まあ、元気があってよろしい',
    dress: function (R, K) {
      for (const s of [-1, 1]) add(R.hc, G.sph, 0x9c9c9c, [s * K.hr * 0.8, K.hr * 0.05, -K.hr * 0.3], [K.hr * 0.36, K.hr * 0.42, K.hr * 0.5]);
      add(R.hc, G.sph, 0x9c9c9c, [0, -K.hr * 0.1, -K.hr * 0.72], [K.hr * 0.7, K.hr * 0.45, K.hr * 0.4]);
      add(R.hips, G.cyl, 0xc98f62, [0, K.T * 0.24, 0.02], [0.262 * K.w, K.T * 0.4, 0.21 * K.w]);
    },
    dmg: function (R, lv) { return lv === 2 ? 'メガネに ヒビ!' : lv === 4 ? 'メガネが われた!' : ''; },
    downT: 2.9, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.16), b = seg(k, 0.16, 0.45), c = seg(k, 0.45, 0.72), d = seg(k, 0.72, 1);
      once(st, 's', true, function () { fx.text('カチーン…'); });
      ov.rz = Math.sin(k * 160) * 0.03 * (1 - b);
      ov.rx = -1.5 * ease.in2(b) * (1 - ease.io(d));
      once(st, 'a', k > 0.45, function () { fx.shake(1.5); fx.snd('thud'); fx.text('バターン!!'); fx.burst('dust', 14, [0, 0.1, -1.2]); fx.burst('soul', 1, [0, 0.4, -1.4]); });
      once(st, 'e', d > 0.1, function () { fx.text('むくっ'); fx.snd('pop'); });
      once(st, 'f', d > 0.9, function () { fx.say('…今のは 足がすべっただけじゃ'); });
    } },

  { id: 'bucho', name: 'いじわる部長', crime: '手柄は自分、ミスは部下。残業代は出さない。', stage: 'office', speed: 3, voice: 135, par: 150,
    blurb: '机の間を スッ、スッと すべるように動く。', h: 1.03, w: 1.05, belly: 0.25, headS: 1.0,
    out: { top: 0x1f2a48, leg: 0x1f2a48, shoe: 0x101010 },
    face: { skin: '#f0c9a4', eye: 'white', erx: 14, ery: 8, pupil: 4.5, lid: 0.42, slant: 0.6, look: [0, 2], brow: 0.7, mouth: 'sneer', smugMouth: 'grin', ey: 112,
      over: function (x, e, cx, ey) { x.strokeStyle = '#1a1a1a'; x.lineWidth = 4.5; for (const s of [-1, 1]) { x.strokeRect(cx + s * 36 - 23, ey - 14, 46, 28); x.beginPath(); x.moveTo(cx + s * 59, ey - 4); x.lineTo(cx + s * 128, ey - 10); x.stroke(); } x.beginPath(); x.moveTo(cx - 13, ey - 4); x.lineTo(cx + 13, ey - 4); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.35)'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 36 - 20, ey - 12); x.lineTo(cx + s * 36 - 6, ey - 12); x.lineTo(cx + s * 36 - 18, ey + 6); x.closePath(); x.fill(); }
        x.strokeStyle = 'rgba(110,55,35,.55)'; x.lineWidth = 2.5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 18, ey + 34); x.lineTo(cx + s * 30, ey + 60); x.stroke(); }
        x.fillStyle = '#3a2414'; x.beginPath(); x.arc(cx + 30, ey + 66, 3.5, 0, 7); x.fill(); } },
    arms: [ARMS.cross, ARMS.cross],
    ai: { quick: 17, p: 0.5, react: [0.04, 0.12], hold: 0.3, cd: 0.5, moves: ['step', 'step', 'slip', 'back'], stun: 0.26, home: -1.2,
      modes: [['dash', 1, 9, 9, { every: [0.55, 1.2] }]] }, tough: 160,
    lines: ['君ぃ、やる気あるの?', 'これ、今日中ね', '前にも言ったよね?', '評価、下げとくから', '有給?何それ', 'これ、私の手柄だからね', '残業代?出ないよ', '君の代わりは いくらでもいる'],
    ouch: ['き、君ぃ!クビだぞ!', 'パワハラだ!これはパワハラだ!', 'ぼ、暴力反対!', '労災おりるかな…', 'ネクタイが しまるぅ!', 'ボーナス出す!出すから!', '有給とっていいから!', '私のヅラに さわるな!', '人事に言うぞ!…私が人事だった', '定時で帰っていいから!'], bye: '…来月から 君が部長だ',
    dress: function (R, K) {
      const wig = grp(R.hc); R.acc.wig = wig;
      hairCap(R, 0x15130f, 0.43 * PI, -0.45, 1.06, wig);
      add(wig, G.sph, 0x15130f, [K.hr * 0.25, K.hr * 0.72, K.hr * 0.25], [K.hr * 0.8, K.hr * 0.36, K.hr * 0.78], [0, 0, -0.2]);
      for (let i = 0; i < 3; i++) add(R.hc, G.cyl, 0x15130f, [(i - 1) * K.hr * 0.25, K.hr * 1.05, 0], [0.004, K.hr * 0.3, 0.004], [0, 0, (i - 1) * 0.5]);
      add(R.hips, G.box, 0xffffff, [0, K.T * 0.72, 0.15 * K.w], [0.12, 0.2, 0.03], [-0.25, 0, 0]);
      R.acc.tie = add(R.hips, G.box, 0xc62828, [0, K.T * 0.6, 0.168 * K.w], [0.05, 0.3, 0.02], [-0.12, 0, 0]);
      add(R.hips, G.box, 0xc62828, [0, K.T * 0.83, 0.15 * K.w], [0.07, 0.05, 0.03]);
      sign(R.hips, '部長', { w: 0.09, h: 0.055, bg: '#ffe066', fg: '#222', p: [-0.13 * K.w, K.T * 0.66, 0.158 * K.w], r: [-0.15, -0.3, 0] });
    },
    dmg: function (R, lv, fx, say) { const w = R.acc.wig; w.visible = lv < 4; w.rotation.set(0, lv >= 2 ? 0.5 : 0, lv >= 2 ? 0.3 : 0); w.position.y = lv >= 2 ? R.hr * 0.12 : 0;
      if (say && lv === 4 && fx) fx.burst('paper', 8, [0, 1.8, 0.2]); return lv === 2 ? 'ヅラが ずれた!' : lv === 4 ? 'ヅラが とんだ!!' : ''; },
    downT: 3.1, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.34), b = seg(k, 0.34, 0.6), c = seg(k, 0.6, 0.94), d = seg(k, 0.94, 1);
      once(st, 's', true, function () { fx.text('ぶ、部長ーーっ!'); });
      const far = c > 0 ? 1 - ease.io(c) : ease.out(a);
      ov.z = -8.5 * far; ov.c = 0.9;
      if (c === 0) { ov.y = Math.sin(a * PI) * 2.0 + (b > 0 ? -0.6 : 0); ov.rx = -ease.out(a) * PI * 5 - (b > 0 ? 1.5 : 0); ov.arms = 1; }
      once(st, 'a', k > 0.34, function () { fx.shake(1.4); fx.snd('thud'); fx.text('ガッシャーン!!'); fx.burst('paper', 26, [0, 1.3, -6]); });
      if (c > 0 && d === 0) { ov.y = Math.abs(Math.sin(c * 26)) * 0.1; ov.bend = 0.35; ov.kick = 0.9; ov.arms = 0.6; ov.expr = 'hit'; once(st, 'r', true, function () { fx.text('ダダダダッ'); }); }
      once(st, 'e', d > 0, function () { fx.say('…労災、おりるかな'); });
    } },

  { id: 'ponta', name: 'やさぐれ着ぐるみ ぽん太', crime: '子どもに舌打ち。風船も写真も有料。', stage: 'yuenchi', speed: 3, voice: 240, par: 130,
    blurb: '画面じゅうを ぴょんぴょん はね回る。', h: 0.86, w: 1.55, belly: 1.0, headS: 1.85, legW: 1.5, armW: 1.4, noEars: 1, jig: 1.6, cheekCol: 0x9a5a22, lidCol3: 0x6a3a5a,
    out: { top: 0xa9631f, leg: 0xa9631f, shoe: 0x7a4315, belly: 0xf3e3c4, hand: 0x7a4315, handR: 0.085 },
    face: { skin: '#a9631f', custom: function (x, e, cx, ey, lv) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.fillStyle = '#4a2a0c'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 30, 112, 25, 30, s * 0.45, 0, 7); x.fill(); }
      x.fillStyle = '#f3e3c4'; x.beginPath(); x.ellipse(cx, 164, 48, 36, 0, 0, 7); x.fill();
      for (const s of [-1, 1]) { const px = cx + s * 30;
        if (e === 'dizzy') { x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); for (let a = 0; a < 13; a += 0.3) { const r = 1 + a, X = px + Math.cos(a) * r, Y = 112 + Math.sin(a) * r; if (!a) x.moveTo(X, Y); else x.lineTo(X, Y); } x.stroke(); }
        else if (e === 'hit' || (lv >= 2 && s === -1)) { x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.moveTo(px - 10, 102); x.lineTo(px + 10, 122); x.moveTo(px + 10, 102); x.lineTo(px - 10, 122); x.stroke(); }
        else { x.fillStyle = '#ffe14a'; x.beginPath(); x.ellipse(px, 114, 14, 11, 0, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.ellipse(px, 115, 3, 9, 0, 0, 7); x.fill();
          x.fillStyle = '#4a2a0c'; x.beginPath(); x.moveTo(px - s * 18, 96); x.lineTo(px + s * 18, 96); x.lineTo(px + s * 18, 104); x.lineTo(px - s * 18, 116); x.closePath(); x.fill();
          x.strokeStyle = '#1a0c04'; x.lineWidth = 6; x.beginPath(); x.moveTo(px - s * 18, 116); x.lineTo(px + s * 18, 102); x.stroke(); } }
      x.fillStyle = '#2a1608'; x.beginPath(); x.ellipse(cx, 146, 11, 8, 0, 0, 7); x.fill();
      x.strokeStyle = '#2a1608'; x.lineWidth = 4;
      if (e === 'hit') { x.fillStyle = '#5a1414'; x.beginPath(); x.ellipse(cx, 174, 16, 13, 0, 0, 7); x.fill(); }
      else { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx - 30, 160); x.quadraticCurveTo(cx, 170, cx + 30, 158); x.quadraticCurveTo(cx, 194, cx - 30, 160); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#5a1414'; x.beginPath(); x.moveTo(cx - 24, 167); for (let i = 0; i < 9; i++) x.lineTo(cx - 21 + i * 5.4, 167 + (i % 2 ? 0 : 9)); x.lineTo(cx + 24, 166); x.quadraticCurveTo(cx, 188, cx - 24, 167); x.fill(); }
      x.strokeStyle = '#1a0c04'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx + 54, 120); x.lineTo(cx + 70, 158); x.stroke(); for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(cx + 52 + i * 4.4, 130 + i * 9); x.lineTo(cx + 64 + i * 4.4, 126 + i * 9); x.stroke(); }
      if (e === 'smug') { x.fillStyle = '#ff6f8f'; x.beginPath(); x.ellipse(cx + 8, 186, 9, 12, 0.1, 0, 7); x.fill(); }
      if (lv >= 1) bandage(x, cx - 62, 150, -0.5, 36);
      if (lv >= 3) { x.fillStyle = '#fff'; for (const p of [[cx + 66, 150], [cx + 74, 142], [cx + 60, 160]]) { x.beginPath(); x.arc(p[0], p[1], 9, 0, 7); x.fill(); } }
      if (lv >= 5) { bandage(x, cx + 10, 70, 0.7, 40); bandage(x, cx + 10, 70, -0.7, 40); x.fillStyle = '#fff'; for (const p of [[cx - 40, 76], [cx - 48, 84]]) { x.beginPath(); x.arc(p[0], p[1], 8, 0, 7); x.fill(); } }
    } },
    arms: [ARMS.loose, ARMS.loose],
    ai: { quick: 15, p: 0.5, react: [0.035, 0.11], hold: 0.42, cd: 0.4, moves: ['jump', 'step'], stun: 0.2, home: -0.9,
      modes: [['hop', 1, 9, 9, { every: [0.05, 0.35], h: [0.45, 1.15] }]] }, tough: 190,
    lines: ['ガキは嫌いだポン', '写真は1枚500円だポン', '夢?ねぇよ そんなもん', '風船は有料だポン', 'さわるな、毛がよごれる', '並べよ、列に', '中の人など いないポン', 'チッ…時給が安いポン'],
    ouch: ['やめるポン!わたが出る!', '(い、いてぇ…)', '夢をこわすなポン!', '頭がとれるポン!', '目がとれたポン!', 'ポ、ポンッ!?', '(マジで訴えるぞ…)', 'しっぽは やめるポン!', '風船タダにするポン!', '(…転職しよ)'], bye: '(…着ぐるみ、やめます)',
    dress: function (R, K) {
      R.acc.ears = [];
      for (const s of [-1, 1]) { const e = grp(R.hc, s * K.hr * 0.72, K.hr * 0.82, 0); add(e, G.sph, 0xa9631f, [0, 0, 0], K.hr * 0.3); add(e, G.sph, 0x5a2a1a, [0, 0, K.hr * 0.12], K.hr * 0.2); R.acc.ears.push(e); }
      for (const s of [-1, 1]) add(R.hips, G.cone, 0x7a1a1a, [s * 0.07, K.T * 0.93, 0.19 * K.w], [0.06, 0.13, 0.04], [0, 0, s * PI / 2]);
      add(R.hips, G.sph, 0x5a3210, [0, 0.05, -0.2 * K.w], [0.13, 0.13, 0.2]);
      add(R.hips, G.box, 0x6a4a2a, [0.12, K.T * 0.35, 0.2 * K.w + 0.06], [0.09, 0.09, 0.01], [0, 0, 0.3]);
      const inn = grp(R.hips, 0, K.T + 0.1, 0); inn.visible = false; R.acc.inner = inn;
      const t = canvasTex(256, 128, function (x) { x.fillStyle = '#f3c9a5'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#222'; x.fillRect(100, 52, 14, 5); x.fillRect(142, 52, 14, 5);
        x.fillStyle = '#5a1414'; x.beginPath(); x.ellipse(128, 86, 9, 11, 0, 0, 7); x.fill(); x.fillStyle = '#7ad0ff'; for (const p of [[84, 40], [172, 46], [164, 20]]) { x.beginPath(); x.ellipse(p[0], p[1], 4, 7, 0, 0, 7); x.fill(); } });
      const m = new THREE.Mesh(G.head, new THREE.MeshLambertMaterial({ map: t })); m.scale.setScalar(0.105); m.userData.tex = t; inn.add(m);
      add(inn, G.box, 0xffffff, [0, 0.07, 0], [0.2, 0.035, 0.2]);
    },
    dmg: function (R, lv, fx, say) { R.acc.ears[0].visible = lv < 4; R.acc.ears[1].rotation.z = lv >= 2 ? -0.7 : 0; if (say && lv >= 3 && fx) fx.burst('smoke', 5, [0, 1.6, 0.2]);
      return lv === 2 ? '目のボタンが とれた!' : lv === 3 ? 'わたが 出てきた!' : lv === 4 ? '耳が もげた!' : ''; },
    downT: 3.3, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'idle';
      const a = seg(k, 0, 0.52), c = seg(k, 0.6, 1);
      once(st, 's', true, function () { fx.text('スポーン!!'); fx.snd('pop'); fx.burst('star', 10, [0, 1.6, 0.2]); });
      if (a < 1) { ov.headUp = Math.sin(a * PI) * 2.3 + 0.02; ov.headRy = a * PI * 6; ov.headRz = Math.sin(a * 9) * 0.6; ov.x = Math.sin(k * 44) * 0.22; ov.arms = 1; ov.kick = 0.7; R.acc.inner.visible = true;
        once(st, 'b', a > 0.25, function () { fx.say('あっ…!'); fx.text('あせあせ'); }); }
      else { R.acc.inner.visible = false; once(st, 'c', true, function () { fx.text('カポッ'); fx.snd('boing'); fx.shake(0.5); }); }
      if (c > 0) { ov.rz = Math.sin(c * PI * 2) * 0.08; once(st, 'e', c > 0.3, function () { fx.say('…見た?'); }); }
    } },

  { id: 'oji', name: 'ナルシスト王子 カズヤ', crime: '人の顔を見て 鼻で笑う。', stage: 'neon', speed: 3, voice: 170, par: 170,
    blurb: 'くるくる回りながら 8の字に動く。顔を殴ると…?', h: 1.08, w: 0.95, headS: 0.98,
    out: { top: 0xf8f8ff, leg: 0xf8f8ff, shoe: 0xeeeeee },
    face: { skin: '#f8dcc0', eye: 'white', erx: 17, ery: 13, pupil: 8, iris: '#3f7fd8', lash: 1, lid: 0.4, slant: 0.25, look: [0, 4], brow: 0.35, browW: 4, browCol: '#b8902e', mouth: 'smirk', smugMouth: 'grin',
      over: function (x, e, cx, ey, lv) { if (lv < 2 && e !== 'hit') { x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4, r = i % 2 ? 3 : 11; x.lineTo(cx + 70 + Math.cos(a) * r, ey - 40 + Math.sin(a) * r); } x.fill(); }
        if (lv >= 3) { x.strokeStyle = 'rgba(40,40,60,.75)'; x.lineWidth = 3; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 36, ey + 14); x.lineTo(cx + s * 40, ey + 44); x.stroke(); } } } },
    arms: [ARMS.hair, ARMS.offer],
    ai: { quick: 15, p: 0.6, react: [0.03, 0.1], hold: 0.34, cd: 0.34, moves: ['spin', 'slip', 'back'], stun: 0.19, home: -0.9,
      modes: [['eight', 4, 3.5, 5.5, { f: 1.5 }], ['stand', 1, 0.9, 1.3, { sway: 0.03, bob: 0.01 }]] }, tough: 150,
    lines: ['顔はやめてくれないか', '美しさは罪…', 'フッ…ブサイクの ひがみかい?', '君、ボクに夢中だね', '鏡、持ってない?', 'ボクの時間は 高いよ?', '貧乏くさいパンチだね', 'シャンパン入れてから 来なよ'],
    ouch: ['顔はダメだってば!', 'ボクの鼻がぁ!', '歯が!ボクの白い歯が!', '商売道具だぞ この顔は!', '髪型がぁ!', 'う、うつくしくない!', '指名が へっちゃう!', 'ママー!', 'ボクの顔に 傷がぁ…!', 'もうナルシストやめます!'], bye: '傷ついたボクも…う、美しい…?',
    dress: function (R, K) {
      const y = 0xf2d16b; hairCap(R, y, 0.47 * PI, -0.5);
      R.acc.bang = add(R.hc, G.sph, y, [-K.hr * 0.3, K.hr * 0.62, K.hr * 0.62], [K.hr * 0.72, K.hr * 0.3, K.hr * 0.42], [0, 0, 0.35]);
      R.acc.back = add(R.hc, G.sph, y, [0, -K.hr * 0.35, -K.hr * 0.5], [K.hr * 0.95, K.hr * 1.0, K.hr * 0.6]);
      add(R.hips, G.box, 0x8a1f45, [0, K.T * 0.7, 0.148 * K.w], [0.1, 0.24, 0.03], [-0.2, 0, 0]);
      const rose = grp(R.arms[1].el, 0, -0.3, 0.03);
      add(rose, G.cyl, 0x2e7d32, [0, -0.02, 0.1], [0.008, 0.24, 0.008], [PI / 2, 0, 0]); add(rose, G.sph, 0xe91e63, [0, -0.02, 0.23], 0.045);
    },
    dmg: function (R, lv) { const b = R.acc.bang, hr = R.hr; if (lv >= 2) { b.position.set(-hr * 0.2, hr * 1.15, hr * 0.3); b.scale.set(hr * 0.16, hr * 0.6, hr * 0.16); b.rotation.set(0, 0, 0.5); } else { b.position.set(-hr * 0.3, hr * 0.62, hr * 0.62); b.scale.set(hr * 0.72, hr * 0.3, hr * 0.42); b.rotation.set(0, 0, 0.35); }
      R.acc.back.scale.y = lv >= 4 ? hr * 0.5 : hr; return lv === 2 ? '髪が ボサボサ!' : lv === 3 ? 'マスカラが 流れた!' : ''; },
    downT: 3.1, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.5), b = seg(k, 0.5, 0.68), c = seg(k, 0.68, 0.86), d = seg(k, 0.86, 1);
      once(st, 's', true, function () { fx.say('美しく…散る…'); });
      ov.ry = ease.io(a) * PI * 4 + (d > 0 ? ease.out(d) * PI * 2 : 0); ov.crouch = 0.3 * a * (1 - d); ov.arms = a * (1 - d);
      if (a > 0 && a < 1 && Math.random() < 0.3) fx.burst('petal', 1, [0, 1.5, 0.2]);
      ov.rz = 1.45 * ease.in2(b) * (1 - ease.out(d)); ov.z = -1.5 * ease.io(a) * (1 - ease.io(d)); ov.x = 0.75 * ease.in2(b) * (1 - ease.io(d));
      once(st, 'a', k > 0.68, function () { fx.shake(1.1); fx.snd('thud'); fx.text('パタリ…'); fx.burst('petal', 22, [0, 0.6, -1.5]); });
      if (d > 0) { ov.y = Math.sin(d * PI) * 0.25; once(st, 'e', true, function () { fx.text('キラッ☆'); fx.snd('twinkle'); }); }
    } },

  { id: 'roshi', name: 'インチキ仙人', crime: 'ニセの壺を売りつけ、修行料は前払い。', stage: 'chikurin', speed: 4, voice: 150, par: 150,
    blurb: '酔っぱらいの千鳥足。のけぞって 読めない!', h: 0.88, w: 0.92, headS: 1.08,
    out: { top: 0xb3261e, leg: 0x1c1c1c, shoe: 0x111111 },
    face: { skin: '#eab08a', eye: 'white', erx: 14, ery: 10, pupil: 4, lid: 0.5, slant: 0.5, look: [3, 3], white: '#fff3c8', wink: -1, browCol: '#ffffff', browW: 9, brow: 0.5, browY: 22, mouth: 'fang', smugMouth: 'bero',
      over: function (x, e, cx, ey) { x.fillStyle = 'rgba(255,70,50,.7)'; x.beginPath(); x.arc(cx, ey + 26, 10, 0, 7); x.fill();
        x.fillStyle = 'rgba(140,90,60,.45)'; for (const p of [[cx - 60, ey - 40], [cx + 50, ey - 52], [cx + 66, ey + 20]]) { x.beginPath(); x.arc(p[0], p[1], 5, 0, 7); x.fill(); }
        x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx - 50, ey + 92); x.quadraticCurveTo(cx, ey + 82, cx + 50, ey + 92); x.lineTo(cx + 60, 256); x.lineTo(cx - 60, 256); x.closePath(); x.fill();
        x.beginPath(); x.ellipse(cx - 20, ey + 46, 20, 5, 0.35, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + 20, ey + 46, 20, 5, -0.35, 0, 7); x.fill(); } },
    arms: [ARMS.loose, ARMS.loose],
    ai: { quick: 13, p: 0.7, react: [0.03, 0.095], hold: 0.3, cd: 0.3, moves: ['back', 'duck', 'slip', 'slip'], stun: 0.2, home: -0.9,
      modes: [['drunk', 1, 9, 9, { sp: 1.5 }]] }, tough: 140,
    lines: ['ほっほっほ、修行料は前払いじゃ', 'この壺を買えば 当たるぞい', '100年早いわい', 'お代が足りんのう', '見える…おぬしの負けが', '弟子は 月謝10万じゃ', 'ひっく…酒もってこい', 'わしは仙人じゃぞ?'],
    ouch: ['ほげっ!', 'あいたた、腰が!', 'ひ、ひげを引っぱるな!', '壺、半額にするから!', '仙人パワーが 効かん!', '修行料 返すから!', 'ひっく!酔いがさめた!', 'お代いらん!いらんから!', 'わし ただのジジイじゃ!', 'インチキでした すまん!'], bye: '…壺、タダであげるぞい',
    dress: function (R, K) {
      R.acc.beard = add(R.hc, G.cone, 0xffffff, [0, -K.hr * 1.25, K.hr * 0.55], [K.hr * 0.4, K.hr * 1.5, K.hr * 0.26], [PI + 0.12, 0, 0]);
      for (const s of [-1, 1]) add(R.hc, G.sph, 0xffffff, [s * K.hr * 0.85, 0, -K.hr * 0.3], [K.hr * 0.3, K.hr * 0.4, K.hr * 0.45]);
      add(R.hips, G.cyl, 0xf4c20d, [0, K.T * 0.1, 0], [0.228 * K.w, 0.07, 0.165 * K.w]);
      for (let i = 0; i < 4; i++) add(R.hips, G.sph, 0xf4c20d, [0, K.T * (0.82 - i * 0.16), 0.158 * K.w], 0.018);
      const g = grp(R.hips, 0.24, 0.02, 0.1); add(g, G.sph, 0x9c6b30, [0, -0.1, 0], 0.075); add(g, G.sph, 0x9c6b30, [0, 0.0, 0], 0.05); add(g, G.cyl, 0xc62828, [0, 0.06, 0], [0.015, 0.05, 0.015]);
      const tsubo = grp(R.arms[0].el, 0, -0.34, 0.04); add(tsubo, G.sph, 0x3a6ea5, [0, 0, 0], [0.07, 0.085, 0.07]); add(tsubo, G.cyl, 0x3a6ea5, [0, 0.085, 0], [0.035, 0.04, 0.035]); sign(tsubo, '開運', { w: 0.08, h: 0.045, bg: '#fff', fg: '#c62828', p: [0, 0, 0.071] });
    },
    dmg: function (R, lv) { const hr = R.hr, k = Math.max(0.22, 1 - lv * 0.14); R.acc.beard.scale.y = hr * 1.5 * k; R.acc.beard.position.y = -hr * (0.5 + 0.75 * k); return lv === 2 ? 'ひげが ちぎれた!' : lv === 5 ? 'ひげが ほぼ無い!' : ''; },
    downT: 3.3, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.3), b = seg(k, 0.5, 0.68), c = seg(k, 0.68, 1);
      once(st, 's', true, function () { fx.text('ひゅーーーん'); fx.snd('whoosh'); });
      if (k < 0.5) { ov.y = ease.out(a) * 11; ov.ry = a * PI * 8; ov.arms = 1; }
      once(st, 'a', k > 0.34, function () { fx.burst('twinkle', 1, [0.25, 2.35, -1]); fx.snd('twinkle'); fx.text('キラーン☆'); });
      if (b > 0 && c === 0) { ov.y = 11 * (1 - ease.in2(b)); ov.rx = b * PI * 2; ov.c = 0.8; ov.arms = 1; }
      once(st, 'b', k > 0.68, function () { fx.shake(2.2); fx.snd('thud'); fx.text('ズドーン!!'); fx.burst('dust', 18, [0, 0.1, 0]); fx.burst('star', 8, [0, 1.5, 0.2]); });
      if (c > 0) { ov.crouch = 0.36 * (1 - ease.io(seg(c, 0.5, 1))); ov.rz = Math.sin(c * 14) * 0.12 * (1 - c); once(st, 'e', c > 0.4, function () { fx.say('ひっく…いい酔いざましじゃ'); }); }
    } },

  { id: 'kage', name: '忍者 カゲ丸', crime: '人を見下して「ザコ」と笑う。', stage: 'shiro', speed: 4, voice: 160, par: 110,
    blurb: 'ドロンと消えて 屋根のあちこちに出る。', h: 0.98, w: 0.95, headS: 1.0, noEars: 1, cheekCol: 0x1b2440,
    out: { top: 0x1b2440, leg: 0x1b2440, shoe: 0x0e1322, hand: 0x1b2440 },
    face: { skin: '#f0c9a4', eye: 'white', erx: 16, ery: 10, pupil: 5, lid: 0.36, slant: 0.9, look: [0, 2], brow: 1.1, browW: 7, noMouth: 1, noNose: 1, masked: 1, capped: 1,
      under: function (x, e, cx, ey, lv) { x.fillStyle = '#1b2440'; x.fillRect(0, 0, 512, ey - 34); x.fillRect(0, ey + 26, 512, 256); x.fillRect(0, 0, cx - 92, 256); x.fillRect(cx + 92, 0, 300, 256);
        x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(cx - 80, ey + 50 + i * 16); x.quadraticCurveTo(cx, ey + 60 + i * 16, cx + 80, ey + 50 + i * 16); x.stroke(); }
        if (lv >= 3) { x.fillStyle = '#f0c9a4'; x.beginPath(); x.moveTo(cx - 30, ey + 40); x.lineTo(cx + 34, ey + 34); x.lineTo(cx + 26, ey + 84); x.lineTo(cx - 6, ey + 74); x.lineTo(cx - 34, ey + 88); x.closePath(); x.fill();
          x.fillStyle = '#5a1414'; x.beginPath(); x.ellipse(cx, ey + 62, 16, 9, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(cx - 9, ey + 54, 8, 10); x.fillRect(cx + 1, ey + 54, 8, 10); } } },
    arms: [ARMS.nin, ARMS.nin],
    ai: { quick: 22, p: 0.75, react: [0.025, 0.085], hold: 0.26, cd: 0.22, moves: ['warp', 'duck', 'jump'], stun: 0.13, home: -0.8,
      modes: [['warp', 3, 3, 5, { every: [0.45, 0.85] }], ['dash', 2, 2, 3.5, { every: [0.22, 0.42] }]] }, tough: 130,
    lines: ['残像でござる', '遅いでござる', 'ザコでござるな', '拙者は ここでござる', '修行が足りぬ', '見えておらぬな?', 'あくびが出るでござる', 'ニンニン(笑)'],
    ouch: ['ぬぅっ!', '不覚!', 'ござっ!?', 'そ、それは拙者の本体!', '巻物が やぶれる!', '忍術が まにあわぬ!', 'ドロンさせて…!', '頭巾が ずれるでござる!', '母上ー!', 'もう残像と言わぬから!'], bye: 'おぬし…できるな…ガクッ',
    dress: function (R, K) {
      R.acc.plate = add(R.hc, G.box, 0x9aa3ad, [0, K.hr * 0.5, K.hr * 0.9], [0.11, 0.045, 0.02], [-0.5, 0, 0]);
      add(R.hips, G.tor, 0xd32f2f, [0, K.T + 0.0, 0], [0.1, 0.1, 0.22], [PI / 2, 0, 0]);
      R.acc.scarf = add(R.hips, G.box, 0xd32f2f, [0.1, K.T - 0.05, -0.22], [0.09, 0.02, 0.4], [0.4, 0.3, 0]);
      add(R.hips, G.cyl, 0x333333, [0.05, K.T * 0.6, -0.17 * K.w], [0.015, 0.75, 0.015], [0, 0, -0.7]);
      add(R.hips, G.cyl, 0xcfd8dc, [0, K.T * 0.12, 0], [0.225 * K.w, 0.06, 0.16 * K.w]);
      const lg = grp(R.root, 0, 0.16, 0); lg.visible = false; R.acc.log = lg;
      add(lg, G.cyl, 0x8d6239, [0, 0, 0], [0.16, 1.1, 0.16], [0, 0, PI / 2]); for (const s of [-1, 1]) add(lg, G.cyl, 0xd9b77e, [s * 0.552, 0, 0], [0.13, 0.005, 0.13], [0, 0, PI / 2]);
      sign(lg, 'ハズレ', { w: 0.5, h: 0.16, bg: '#fff6d8', fg: '#b71c1c', p: [0, 0.03, 0.162] });
    },
    dmg: function (R, lv) { R.acc.plate.rotation.z = lv >= 2 ? 0.45 : 0; R.acc.plate.position.x = lv >= 2 ? R.hr * 0.3 : 0; return lv === 3 ? '覆面が やぶれた!' : ''; },
    downT: 3.0, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy'; const lg = R.acc.log;
      const a = seg(k, 0, 0.4), b = seg(k, 0.4, 0.8), d = seg(k, 0.8, 1);
      once(st, 's', true, function () { fx.text('ぐるんぐるん'); });
      if (b === 0) { ov.rx = -ease.out(a) * PI * 6; ov.c = 0.85; ov.y = Math.sin(a * PI) * 1.1; ov.z = -0.7 * a; ov.arms = 1; }
      once(st, 'a', k > 0.4, function () { fx.snd('poof'); fx.burst('smoke', 7, [0, 0.8, -0.7]); fx.text('ドロン!…丸太?'); lg.visible = true; });
      if (b > 0 && d === 0) { ov.hide = true; lg.position.set(0, 0.16 + Math.abs(Math.sin(b * 9)) * 0.5 * (1 - b), -0.5); lg.rotation.x = b * 6; lg.rotation.y = Math.sin(b * 5) * 0.3;
        once(st, 'b', b > 0.12, function () { fx.snd('thud'); fx.shake(0.8); }); }
      once(st, 'c', k > 0.8, function () { fx.snd('poof'); fx.burst('smoke', 7, [0, 0.8, 0]); lg.visible = false; fx.say('…不覚でござる'); });
      if (d > 0) ov.crouch = 0.3 * (1 - d);
    } },

  { id: 'tetsu', name: '口だけチャンプ 鉄', crime: '自称・元チャンプ。客を「シロウト」とバカにする。', stage: 'ring', speed: 5, voice: 110, par: 100,
    blurb: '本職の殴られ屋。頭をふり続けて 当たらない!', h: 1.04, w: 1.12, headS: 0.98, armW: 1.25,
    out: { top: 0xf4f4f4, leg: 0xe2b48c, shoe: 0xffffff, shorts: 0x1c4fd0, sleeve: 0xe2b48c, hand: 0x1c4fd0, handR: 0.092, boot: 1 },
    face: { skin: '#e2b48c', eye: 'white', erx: 14, ery: 10, pupil: 6, lid: 0.4, slant: 0.5, look: [0, 2], brow: 0.8, browW: 9, mouth: 'sneer', smugMouth: 'bero',
      under: function (x, e, cx, ey) { x.fillStyle = 'rgba(60,40,30,.22)'; for (let i = 0; i < 220; i++) x.fillRect(cx - 62 + ((i * 37) % 124), ey + 44 + ((i * 23) % 60), 2, 2); },
      over: function (x, e, cx, ey) { x.strokeStyle = 'rgba(120,40,40,.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 56, ey - 36); x.lineTo(cx - 40, ey - 18); x.stroke(); for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx - 55 + i * 6, ey - 26 - i * 6); x.lineTo(cx - 47 + i * 6, ey - 33 - i * 6); x.stroke(); } } },
    arms: [ARMS.guard, ARMS.guard],
    ai: { quick: 30, p: 0.88, react: [0.02, 0.07], hold: 0.24, cd: 0.18, moves: ['duck', 'slip', 'back', 'step'], stun: 0.12, home: -0.5,
      modes: [['weave', 1, 9, 9, { a: 0.38, f: 10, cz: 0.2 }]] }, tough: 150,
    lines: ['1分1000円だ、まいど', '蚊でも止まったか?', 'あくびが出るぜ', '当ててみな、シロウト', '腰が入ってねぇぞ', 'オレは元チャンプだぜ?', '目ぇつぶってても よけれるぜ', '金、ムダにしたな'],
    ouch: ['ぐっ…ま、まぐれだ!', 'い、今のは わざとだ!', 'マウスピースが!', 'セコンド!タオル!', 'レフェリー!止めろ!', '返金する!返金!', '元チャンプは ウソでした!', 'ゴングまだか!?', '足にきた…', 'シロウトって言って ごめん!'], bye: '…お代は いらねぇよ…',
    dress: function (R, K) {
      const gear = grp(R.hc); R.acc.gear = gear;
      hairCap(R, 0xc62828, 0.5 * PI, -0.55, 1.1, gear);
      for (const s of [-1, 1]) add(gear, G.box, 0xc62828, [s * K.hr * 0.86, -K.hr * 0.2, K.hr * 0.22], [K.hr * 0.3, K.hr * 0.75, K.hr * 0.7]);
      add(gear, G.box, 0xc62828, [0, K.hr * 0.72, K.hr * 0.78], [K.hr * 1.3, K.hr * 0.3, K.hr * 0.3], [-0.45, 0, 0]);
      add(R.hips, G.cyl, 0xffffff, [0, 0.13, 0], [0.215 * K.w, 0.07, 0.165 * K.w]);
      for (const a of R.arms) add(a.el, G.cyl, 0xffffff, [0, -0.2, 0], [0.066, 0.06, 0.066]);
    },
    dmg: function (R, lv) { R.acc.gear.rotation.z = lv * 0.09; R.acc.gear.rotation.y = lv >= 3 ? 0.3 : 0; return lv === 2 ? 'ヘッドギアが ずれた!' : lv === 3 ? 'マウスピースが とんだ!' : ''; },
    downT: 3.3, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.3), b = seg(k, 0.3, 0.4), c = seg(k, 0.4, 0.82), d = seg(k, 0.82, 1);
      once(st, 's', true, function () { fx.text('ふらっ…ふらっ…'); });
      if (b === 0) { ov.x = Math.sin(k * 32) * 0.3; ov.rz = Math.sin(k * 26) * 0.26; ov.crouch = 0.15 * a; ov.arms = 0.7; }
      ov.rx = -1.5 * ease.in2(b) * (1 - ease.out3(d));
      once(st, 'a', k > 0.4, function () { fx.shake(1.5); fx.snd('thud'); fx.text('ダウーン!!'); fx.burst('dust', 12, [0, 0.1, -1.2]); });
      [1, 2, 3].forEach(function (n) { once(st, 'n' + n, k > 0.36 + n * 0.115, function () { fx.count(n); fx.snd('beep'); }); });
      if (d > 0) { ov.y = Math.sin(d * PI) * 0.6; once(st, 'e', true, function () { fx.say('まだまだぁ!'); fx.snd('cheer'); }); }
    } },

  { id: 'boss', name: '工場の女帝 イヤミ田さん', crime: '嫌味・告げ口・シフトの勝手な書きかえ。', stage: 'kojo', speed: 5, voice: 260, par: 95, boss: 1, cheekCol: 0xfdfefe, lidCol3: 0x8a5fa0,
    blurb: '【ボス】消える・はねる・しゃがむ。全部やる。目がいちばん嫌。', h: 0.9, w: 1.3, belly: 0.55, headS: 1.12, legW: 1.2, armW: 1.15,
    out: BOSS_OUT,
    face: { skin: '#e9bf9e', eye: 'white', erx: 19, ery: 12, pupil: 5.2, iris: '#241208', lid: 0.46, slant: 0.95, look: [-4, 4], lidCol: '#9a6fa8', shadow: 'rgba(120,70,150,.5)', lash: 1, bags: 1,
      brow: 1.15, browW: 3.5, browCol: '#3a2a2a', browY: 27, noMouth: 1, noNose: 1, smugEye: 'arc', ex: 38, ey: 110, masked: 1, capped: 1,
      under: function (x, e, cx, ey, lv) {
        const top = ey + 24 + (lv >= 4 ? 44 : lv >= 2 ? 6 : 0);
        if (lv >= 4) { x.strokeStyle = 'rgba(110,55,35,.6)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, ey + 30, 6, 0.1 * PI, 0.9 * PI); x.stroke();
          x.fillStyle = '#c2185b'; x.beginPath(); x.moveTo(cx - 20, ey + 58); x.quadraticCurveTo(cx, ey + 40, cx + 20, ey + 58); x.quadraticCurveTo(cx, ey + 52, cx - 20, ey + 58); x.fill(); x.strokeStyle = '#7a0f3a'; x.lineWidth = 3; x.stroke(); }
        x.save(); x.translate(cx, top); x.rotate(lv >= 2 ? 0.07 : 0); x.fillStyle = '#fdfefe'; x.fillRect(-256, 0, 512, 256);
        x.strokeStyle = 'rgba(120,150,170,.45)'; x.lineWidth = 2.5; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(-100, 22 + i * 22); x.quadraticCurveTo(0, 30 + i * 22, 100, 22 + i * 22); x.stroke(); }
        if (lv >= 3) { x.fillStyle = 'rgba(150,120,90,.35)'; x.beginPath(); x.ellipse(-30, 40, 18, 12, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(40, 70, 14, 9, 0, 0, 7); x.fill(); }
        x.restore();
        x.strokeStyle = 'rgba(110,55,45,.55)'; x.lineWidth = 2.5;
        for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + s * 62, ey - 4 + i * 5); x.lineTo(cx + s * 76, ey - 10 + i * 9); x.stroke(); }
        x.beginPath(); x.moveTo(cx - 5, ey - 24); x.lineTo(cx - 3, ey - 8); x.moveTo(cx + 5, ey - 24); x.lineTo(cx + 3, ey - 8); x.stroke(); },
      over: function (x, e, cx, ey, lv) { if (e === 'smug') { x.fillStyle = '#b388c8'; x.font = '900 22px sans-serif'; x.fillText('♪', cx + 72, ey - 22); }
        if (lv >= 2) { x.strokeStyle = 'rgba(40,20,50,.7)'; x.lineWidth = 3; x.lineCap = 'round'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 44, ey + 12); x.lineTo(cx + s * 47, ey + 22 + (lv >= 4 ? 30 : 0)); x.stroke(); } } } },
    arms: [ARMS.hips, ARMS.hips],
    ai: { quick: 30, p: 0.95, react: [0.012, 0.05], hold: 0.27, cd: 0.06, moves: ['step', 'duck', 'back', 'jump', 'warp'], stun: 0.05, home: -0.8, nag: 1,
      modes: [['weave', 3, 2.2, 3.4, { a: 0.4, f: 12, cz: 0.2 }], ['warp', 3, 2.2, 3.2, { every: [0.32, 0.55], spots: 1 }], ['hop', 2, 2, 3, { every: [0.02, 0.1], h: [0.5, 1.2] }],
        ['dash', 2, 1.8, 2.8, { every: [0.2, 0.38] }], ['duckwalk', 2, 1.6, 2.4, { f: 4.5 }], ['eight', 1, 2, 3, { f: 2.8 }], ['drunk', 1, 2, 3, { sp: 1.9 }], ['close', 2, 1.1, 1.4, {}], ['peek', 1, 2, 2.6, {}]] }, tough: 140,
    lines: ['あんた、遅いねぇ', 'それで本気?', '最近の人は これだから', 'あたしの若い頃はねぇ', 'へぇ〜、ふ〜ん', '向いてないんじゃない?', 'はい、やり直し', '聞こえなーい', '手ぇ止まってるよ', 'あら、まだいたの?',
      'シフト、勝手に変えといたから', 'あんたの切ったキャベツ、雑ねぇ', '若いのに 手が遅いわねぇ', 'あたしは20年やってんのよ', '休憩?あんたに休憩なんてあるの?', 'ため息つかないでくれる?', 'ほら、またまちがえた', '社員さんに 言っとくから'],
    ouch: ['キィーーッ!', 'な、なによ!', '言いつけるわよ!', 'あたしを誰だと思ってんの!', 'リーダーよ!?リーダーなのよ!?', 'ぼ、帽子が!', 'マスクが ずれる!', 'シフト、好きにしていいから!', 'キャベツ、あたしが切るから!', '嫌味いって ごめんなさいねぇ!?', 'ぎゃふん!', '休憩、行ってきていいから!'],
    bye: '…明日のシフト、代わってあげるわよ',
    dress: bossDress, dmg: bossDmg,
    downT: 3.6, down: function (R, k, fx, st) {
      const ov = R.ov, cap = R.acc.cap; ov.expr = 'dizzy';
      const a = seg(k, 0, 0.4), b = seg(k, 0.4, 0.54), c = seg(k, 0.54, 0.8), d = seg(k, 0.8, 1);
      once(st, 's', true, function () { fx.say('キィーーッ!!'); fx.text('ぐるぐるぐる'); fx.snd('pop'); });
      const cu = k < 0.8 ? ease.out(seg(k, 0, 0.15)) : 1 - ease.io(d);
      cap.position.set(0.5 * cu, 1.3 * cu + Math.sin(k * 20) * 0.05 * cu, -0.3 * cu); cap.rotation.set(k * 14 * cu, 0, k * 9 * cu);
      if (b === 0) { ov.ry = ease.out(a) * PI * 12; ov.rz = Math.sin(k * 36) * 0.22 * a; ov.arms = 1; }
      const inb = b > 0 ? (d > 0 ? 1 - ease.io(d) : ease.io(b)) : 0;
      if (inb > 0) { ov.z = -1.72 * inb; ov.rx = -2.75 * inb; ov.c = 0.8; ov.y = 0.42 * Math.sin(Math.min(1, inb) * PI * 0.5) + (d > 0 ? Math.sin(d * PI) * 0.5 : 0); ov.arms = 1; }
      once(st, 'a', k > 0.54, function () { fx.shake(2); fx.snd('thud'); fx.text('ズボッ!!'); fx.burst('leaf', 30, [0, 0.9, -1.7]); });
      if (c > 0 && d === 0) { ov.kick = 1; once(st, 'b', c > 0.25, function () { fx.text('じたばた じたばた'); fx.say('だ、だれか出しなさいよ!'); }); }
      once(st, 'e', d > 0.85, function () { fx.say('…今の、見なかったことにしなさい'); });
    } },

  /* ひみつの部屋: 画面いっぱいの顔。動かない。連打するだけ。全員を1回ずつダウンさせると入れる */
  { id: 'room', room: 1, name: '殴りたい放題の部屋', crime: 'ぜんぶ。', stage: 'room', speed: 0, voice: 280, par: 380, boss: 1, hires: 3, lidCol3: 0x8a5fa0,
    blurb: '画面いっぱいの あの顔。連打するだけ!', h: 0.9, w: 1.3, belly: 0.55, headS: 1.12, legW: 1.2, armW: 1.15,
    out: BOSS_OUT, dmgAt: [10, 30, 60, 100, 150, 210],
    face: { skin: '#e9bf9e', eye: 'white', erx: 21, ery: 13, pupil: 5, iris: '#241208', lid: 0.52, slant: 1.05, look: [0, 5], lidCol: '#8a5fa0', shadow: 'rgba(110,50,150,.6)', lash: 1, bags: 1, blood: 1,
      brow: 1.35, browW: 4, browCol: '#3a2a2a', browY: 28, ex: 40, ey: 98, my: 172, noNose: 1, mouth: 'sneer', smugMouth: 'bero', lipCol: '#b0124a', vein: 1, capped: 1,
      under: function (x, e, cx, ey) {
        x.strokeStyle = 'rgba(110,55,45,.6)'; x.lineWidth = 2.5; x.lineCap = 'round';
        for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + s * 66, ey - 4 + i * 5); x.lineTo(cx + s * 82, ey - 10 + i * 9); x.stroke(); }
          x.beginPath(); x.moveTo(cx + s * 18, ey + 34); x.quadraticCurveTo(cx + s * 36, ey + 52, cx + s * 32, ey + 84); x.stroke(); }
        x.beginPath(); x.moveTo(cx - 6, ey - 26); x.lineTo(cx - 3, ey - 8); x.moveTo(cx + 6, ey - 26); x.lineTo(cx + 3, ey - 8); x.stroke();
        x.fillStyle = '#fdfefe'; x.fillRect(0, 222, 512, 40); x.strokeStyle = 'rgba(120,150,170,.5)'; x.beginPath(); x.moveTo(cx - 90, 234); x.quadraticCurveTo(cx, 242, cx + 90, 234); x.stroke();
        x.strokeStyle = '#dfe9ee'; x.lineWidth = 4; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 86, 226); x.lineTo(cx + s * 124, ey + 30); x.stroke(); } },
      over: function (x, e, cx, ey, lv) { x.fillStyle = '#3a2414'; x.beginPath(); x.arc(cx - 34, ey + 84, 4.5, 0, 7); x.fill(); x.strokeStyle = '#3a2414'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx - 34, ey + 84); x.lineTo(cx - 42, ey + 74); x.stroke();
        if (lv >= 2) { x.strokeStyle = 'rgba(40,20,50,.7)'; x.lineWidth = 3; x.lineCap = 'round'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 46, ey + 13); x.lineTo(cx + s * 50, ey + 30 + lv * 6); x.stroke(); } } } },
    arms: [ARMS.hips, ARMS.hips],
    ai: { quick: 5, p: 0, react: [1, 1], hold: 0.3, cd: 1, moves: [], stun: 0.3, home: 0, modes: [['stand', 1, 99, 99, { sway: 0, bob: 0 }]] }, tough: 1e9,
    lines: ['殴れるもんなら 殴ってみなさいよ', 'あんたに そんな度胸あるの?', 'ふん、どうせ口だけでしょ', 'あたしは悪くないわよ'],
    ouch: ['ごめんなさい!', 'もうしません!', '許してください〜!', 'シフト、代わりますぅ!', 'おやつ あげるから!', 'キャベツの千切り、全部やります!', 'いい子になりますぅ', 'ママに言わないで!', '嫌味は 1日1回にします!', 'ゆるしてぴょん', 'はんせいしてまーす', 'あやまるから!ほんとに!', 'もう 目つき悪くしません!', 'やさしいリーダーになります!', 'ひぃ〜ん', 'ごめんちゃい',
      'お茶 いれますから!', '肩 もみますから!', 'もう告げ口しません!', 'ゆるして にゃん', '休憩 ながめにどうぞ!', 'あたしが わるうございました!', 'えーん えーん', 'おこらないでぇ'],
    bye: '…もう嫌味は言いません(たぶん)',
    dress: bossDress, dmg: bossDmg, downT: 1, down: function () {} }
];
