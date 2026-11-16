/* 殴られ屋 — 10人の殴られ屋(見た目・顔・よけ方・ダウンの仕方・セリフ) */
import { THREE, G, add, grp, mat, canvasTex, sign, ease, seg, clamp } from './kit.js';

const PI = Math.PI;

/* ================= 顔の絵(頭の球に貼る。512x256、まん中が正面) ================= */
function drawEye(x, f, px, ey, s, expr) {
  const rx = f.erx || 17, ry = f.ery || 12, ink = '#2a1c14';
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (expr === 'hit') {   // ><
    x.strokeStyle = f.hitInk || ink; x.lineWidth = 6; x.beginPath();
    x.moveTo(px + s * 14, ey - 12); x.lineTo(px - s * 9, ey); x.lineTo(px + s * 14, ey + 12); x.stroke(); return;
  }
  if (expr === 'dizzy') {  // ぐるぐる
    x.strokeStyle = f.hitInk || ink; x.lineWidth = 3.5; x.beginPath();
    for (let a = 0; a < 15; a += 0.3) { const r = 1 + a * 1.05, X = px + Math.cos(a) * r, Y = ey + Math.sin(a) * r; if (a === 0) x.moveTo(X, Y); else x.lineTo(X, Y); }
    x.stroke(); return;
  }
  if (f.eye === 'dot') {
    if (expr === 'smug') { x.strokeStyle = ink; x.lineWidth = 5; x.beginPath(); x.arc(px, ey + 6, 11, 1.15 * PI, 1.85 * PI); x.stroke(); return; }
    x.fillStyle = '#1a1210'; x.beginPath(); x.ellipse(px, ey, 6.5, 8.5, 0, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(px - 2, ey - 3, 2.3, 0, 7); x.fill(); return;
  }
  if (f.eye === 'narrow') { x.strokeStyle = ink; x.lineWidth = 4.5; x.beginPath(); x.arc(px, ey - 7, 15, 0.15 * PI, 0.85 * PI); x.stroke(); return; }
  if (expr === 'smug' && f.smugEye === 'arc') {   // 笑って細くなる いやな目
    if (f.shadow) { x.fillStyle = f.shadow; x.beginPath(); x.ellipse(px, ey - 5, rx + 6, ry + 6, 0, 0, 7); x.fill(); }
    x.strokeStyle = ink; x.lineWidth = 6; x.beginPath(); x.arc(px, ey + 10, 17, 1.13 * PI, 1.87 * PI); x.stroke(); return;
  }
  if (f.shadow) { x.fillStyle = f.shadow; x.beginPath(); x.ellipse(px, ey - 5, rx + 6, ry + 7, 0, 0, 7); x.fill(); }
  x.save(); x.beginPath(); x.ellipse(px, ey, rx, ry, 0, 0, 7); x.clip();
  x.fillStyle = '#fff'; x.fillRect(px - rx, ey - ry, rx * 2, ry * 2);
  const lk = f.look || [0, 0], pr = f.pupil || 7, lx = px + lk[0] + (expr === 'smug' ? 0 : 0), ly = ey + lk[1];
  x.fillStyle = f.iris || '#3a2414'; x.beginPath(); x.arc(lx, ly, pr, 0, 7); x.fill();
  x.fillStyle = '#000'; x.beginPath(); x.arc(lx, ly, pr * 0.52, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(lx - pr * 0.35, ly - pr * 0.4, pr * 0.3, 0, 7); x.fill();
  if (f.sparkle) { x.beginPath(); x.arc(lx + pr * 0.4, ly + pr * 0.35, pr * 0.18, 0, 7); x.fill(); }
  const lid = (f.lid || 0) + (expr === 'smug' ? 0.14 : 0), sl = f.slant || 0;
  if (lid > 0) {   // まぶた。内側が低い = いじわる
    const xi = px - s * (rx + 2), xo = px + s * (rx + 2), yi = ey - ry + ry * 2 * lid + sl * 7, yo = ey - ry + ry * 2 * lid - sl * 7;
    x.fillStyle = f.lidCol || f.skin; x.beginPath(); x.moveTo(xi, ey - ry - 4); x.lineTo(xo, ey - ry - 4); x.lineTo(xo, yo); x.lineTo(xi, yi); x.closePath(); x.fill();
    x.strokeStyle = ink; x.lineWidth = f.lash ? 5 : 3.5; x.beginPath(); x.moveTo(xo, yo); x.lineTo(xi, yi); x.stroke();
  }
  x.restore();
  x.strokeStyle = ink; x.lineWidth = 2.5; x.beginPath(); x.ellipse(px, ey, rx, ry, 0, 0, 7); x.stroke();
  if (f.lash) { x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(px + s * (rx - 3 + i * 2), ey - ry * 0.55 + i * 4); x.lineTo(px + s * (rx + 8), ey - ry * 0.9 + i * 6); x.stroke(); } }
  if (f.bags) { x.strokeStyle = 'rgba(90,40,50,.55)'; x.lineWidth = 2.5; x.beginPath(); x.arc(px, ey + 4, rx + 3, 0.2 * PI, 0.8 * PI); x.stroke(); }
}
function drawMouth(x, type, cx, my, f) {
  x.strokeStyle = '#4a1c18'; x.lineWidth = 4.5; x.lineCap = 'round';
  x.beginPath();
  switch (type) {
    case 'flat': x.moveTo(cx - 15, my); x.lineTo(cx + 15, my); x.stroke(); break;
    case 'frown': x.arc(cx, my + 20, 22, 1.22 * PI, 1.78 * PI); x.stroke(); break;
    case 'smile': x.arc(cx, my - 14, 22, 0.2 * PI, 0.8 * PI); x.stroke(); break;
    case 'smirk': x.moveTo(cx - 17, my + 3); x.quadraticCurveTo(cx + 4, my + 9, cx + 22, my - 9); x.stroke(); break;
    case 'grin':
      x.moveTo(cx - 26, my - 7); x.quadraticCurveTo(cx, my + 3, cx + 26, my - 7); x.quadraticCurveTo(cx, my + 30, cx - 26, my - 7); x.closePath();
      x.fillStyle = '#fff'; x.fill(); x.stroke(); x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 18, my + 4); x.lineTo(cx + 18, my + 4); x.stroke(); break;
    case 'shout':
      x.fillStyle = '#5a1414'; x.ellipse(cx, my + 4, 18, 21, 0, 0, 7); x.fill(); x.stroke();
      x.fillStyle = '#fff'; x.fillRect(cx - 12, my - 13, 24, 7); x.fillStyle = '#ff8a8a'; x.beginPath(); x.ellipse(cx, my + 16, 10, 6, 0, 0, 7); x.fill(); break;
    case 'wavy': x.moveTo(cx - 20, my); for (let i = 0; i <= 20; i++) x.lineTo(cx - 20 + i * 2, my + Math.sin(i * 0.95) * 5); x.stroke(); break;
    case 'o': x.fillStyle = '#5a1414'; x.ellipse(cx, my, 7, 9, 0, 0, 7); x.fill(); break;
  }
}
function faceTex(f, expr) {
  return canvasTex(512, 256, function (x) {
    const cx = 256, ey = f.ey || 114, ex = f.ex || 36, my = f.my || 178;
    x.fillStyle = f.skin; x.fillRect(0, 0, 512, 256);
    if (f.custom) { f.custom(x, expr, cx, ey); return; }
    if (f.under) f.under(x, expr, cx, ey);
    if (f.blush || expr === 'hit' || expr === 'dizzy') {
      x.fillStyle = 'rgba(255,80,80,' + (expr === 'hit' || expr === 'dizzy' ? 0.5 : 0.28) + ')';
      for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * (ex + 24), ey + 36, 20, 12, 0, 0, 7); x.fill(); }
    }
    for (const s of [-1, 1]) drawEye(x, f, cx + s * ex, ey, s, expr);
    // まゆ
    if (!f.noBrow) {
      const a = expr === 'hit' ? -0.9 : expr === 'dizzy' ? -0.5 : (f.brow || 0), by = ey - (f.browY || 25);
      x.strokeStyle = f.browCol || '#2a1c14'; x.lineWidth = f.browW || 6; x.lineCap = 'round';
      for (const s of [-1, 1]) { const px = cx + s * ex, up = (expr === 'smug' && s === 1) ? -7 : 0;
        x.beginPath(); x.moveTo(px - s * 15, by + a * 8 + up); x.lineTo(px + s * 18, by - a * 5 + up); x.stroke(); }
    }
    if (!f.noNose) { x.strokeStyle = 'rgba(110,55,35,.6)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, ey + 27, 5.5, 0.1 * PI, 0.9 * PI); x.stroke(); }
    if (!f.noMouth) {
      if (f.lips && expr !== 'hit') { x.fillStyle = f.lips; x.beginPath(); x.ellipse(cx, my, 15, 6, 0, 0, 7); x.fill(); }
      drawMouth(x, expr === 'hit' ? 'shout' : expr === 'dizzy' ? 'wavy' : expr === 'smug' ? (f.smugMouth || 'smirk') : (f.mouth || 'flat'), cx, my, f);
    }
    if (f.over) f.over(x, expr, cx, ey);
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

export function buildChar(def) {
  const R = { def: def, tex: {}, acc: {}, arms: [], legs: [] };
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
  ['idle', 'hit', 'dizzy', 'smug'].forEach(function (e) { R.tex[e] = faceTex(def.face, e); });
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
  // たんこぶ(殴られるほど増える)
  R.bumps = [];
  [[-0.45, 0.92, 0.3], [0.5, 0.85, 0.1], [0.05, 1.02, -0.1]].forEach(function (p) {
    const b = grp(R.hc, p[0] * hr, p[1] * hr, p[2] * hr); b.scale.setScalar(0.001); b.visible = false;
    add(b, G.sph, 0xff7b6b, [0, 0, 0], [hr * 0.3, hr * 0.36, hr * 0.3]);
    add(b, G.box, 0xfff6e0, [0, hr * 0.3, 0], [hr * 0.36, hr * 0.03, hr * 0.1]); add(b, G.box, 0xfff6e0, [0, hr * 0.3, 0], [hr * 0.1, hr * 0.03, hr * 0.36]);
    R.bumps.push(b);
  });
  def.dress(R, { T: T, L: L, hr: hr, w: w, skin: skin });
  R.root.traverse(function (m) { if (m.isMesh) m.frustumCulled = false; });
  return R;
}
export function disposeChar(R) {
  Object.keys(R.tex).forEach(function (k) { R.tex[k].dispose(); });
  R.faceMat.dispose();
  R.root.traverse(function (o) { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.userData.tex) { o.userData.tex.dispose(); o.material.dispose(); } });
  if (R.root.parent) R.root.parent.remove(R.root);
}
function hairCap(R, color, theta, tilt, sc, y) {
  const g = new THREE.SphereGeometry(R.hr * (sc || 1.06), 22, 10, 0, PI * 2, 0, theta);
  const m = new THREE.Mesh(g, mat(color, { ds: 1 })); m.rotation.x = tilt || 0; m.scale.y = 1.07; m.position.y = y || 0; R.hc.add(m); return m;
}
function once(st, key, cond, fn) { if (cond && !st[key]) { st[key] = 1; fn(); } }

/* ================= 10人 =================
   ai: quick = 体の動きの速さ / p = よける確率 / react = 気づくまでの秒 / hold = よけている秒 / cd = 次によけられるまで
       moves = よけ方 / stun = 殴られてひるむ秒 / sway・bob・hop・step = ふだんの動き
   tough = ダウンまでの がまん(大きいほど倒れにくい) */
export const CHARS = [
  { id: 'tencho', name: 'まんぷく店長', kata: 'ラーメン屋のおやじ', stage: 'shokudo', speed: 1, voice: 95, par: 280,
    blurb: '太っていて動けない。殴られ放題!', h: 1.0, w: 1.75, belly: 1.2, headS: 1.12, legW: 1.5, armW: 1.5, jig: 2.6,
    out: { top: 0xf6f4ee, leg: 0x2f3e63, shoe: 0x3a2a20, belly: 0xf6f4ee },
    face: { skin: '#f3c9a5', eye: 'dot', mouth: 'grin', smugMouth: 'grin', blush: 1, brow: -0.2, browW: 7, ex: 34,
      over: function (x, e, cx, ey) { x.strokeStyle = 'rgba(120,60,40,.45)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, ey + 86, 46, 0.2 * PI, 0.8 * PI); x.stroke(); } },
    arms: [ARMS.down, ARMS.down],
    ai: { quick: 5, p: 0, react: [0.3, 0.4], hold: 0.3, cd: 1, moves: [], stun: 0.5, sway: [0.03, 1.3], bob: [0.02, 2.2] }, tough: 300,
    lines: ['へい、らっしゃい!', 'どこでも殴ってくれぃ', '腹は効かんよ〜', '替え玉いるかい?', 'ごっつぁんです'], ouch: ['ぶへっ', 'おふっ', 'ぼよん'], bye: 'まいどありぃ〜!',
    dress: function (R, K) {
      hairCap(R, 0x1d1a18, 0.36 * PI, -0.35);
      add(R.hc, G.tor, 0xffffff, [0, K.hr * 0.42, 0], [K.hr * 0.98, K.hr * 0.98, K.hr * 0.7], [PI / 2 - 0.12, 0, 0]);
      add(R.hc, G.sph, 0xffffff, [K.hr * 0.7, K.hr * 0.5, -K.hr * 0.75], K.hr * 0.22);
      add(R.hips, G.tor, 0xfff8e8, [0, K.T + 0.0, 0.01], [0.105, 0.105, 0.2], [PI / 2, 0, 0]);
      sign(R.hips, '麺', { w: 0.2, h: 0.2, bg: '#c8281e', fg: '#fff', p: [0, K.T * 0.42, 0.06 * 1.2 + 0.2 * K.w + 0.004] });
    },
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

  { id: 'wakazo', name: 'イキリ若造 レン', kata: 'コンビニ前のたまり場', stage: 'konbini', speed: 2, voice: 190, par: 240,
    blurb: 'スマホ片手に ヘラヘラよける。', h: 1.0, w: 0.95, headS: 1.0,
    out: { top: 0x7a3fd0, leg: 0x16161c, shoe: 0xf2f2f2 },
    face: { skin: '#f6d3b3', eye: 'white', lid: 0.42, slant: 0.55, pupil: 6.5, look: [0, 2], brow: 0.75, mouth: 'smirk', smugMouth: 'grin', browCol: '#8a6a20' },
    arms: [ARMS.down, ARMS.phone],
    ai: { quick: 11, p: 0.36, react: [0.06, 0.15], hold: 0.32, cd: 0.6, moves: ['slip', 'back'], stun: 0.34, sway: [0.1, 2.4], bob: [0.02, 4.8], step: [0.6, 1.2, 2.4] }, tough: 170,
    lines: ['は?当たんねーし', 'おっそ', 'それ、パンチっすか?', 'ウケる〜', 'あ、ちょい待ち。通知きた'], ouch: ['いってぇ!', 'ちょ、マジ?', 'うぇっ'], bye: 'べ、別に効いてねーし…',
    dress: function (R, K) {
      const y = 0xf4d03f; hairCap(R, y, 0.4 * PI, -0.4);
      [[-0.5, 0.75, 0.35, 0.5], [0, 0.95, 0.4, 0], [0.5, 0.75, 0.35, -0.5], [-0.3, 0.95, -0.1, 0.3], [0.3, 0.95, -0.1, -0.3], [0, 0.9, -0.5, 0]].forEach(function (p) {
        add(R.hc, G.cone, y, [p[0] * K.hr, p[1] * K.hr, p[2] * K.hr], [K.hr * 0.3, K.hr * 0.75, K.hr * 0.3], [p[2] > 0.2 ? 0.5 : -0.3, 0, p[3]]); });
      add(R.hips, G.sph, 0x6a33bd, [0, K.T * 0.95, -0.1], [0.16, 0.13, 0.1]);
      add(R.hips, G.box, 0x5a2aa8, [0, K.T * 0.3, 0.15], [0.2, 0.1, 0.03]);
      const ph = grp(R.arms[1].el, 0, -0.33, 0.02); R.acc.phone = ph;
      add(ph, G.box, 0x111111, [0, 0, 0], [0.075, 0.14, 0.012]); add(ph, G.box, 0x9fe8ff, [0, 0, -0.007], [0.062, 0.12, 0.004], null, { glow: 0x66ccff });
    },
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

  { id: 'oyaji', name: '偏屈おやじ 源さん', kata: '近所のがんこ者', stage: 'washitsu', speed: 2, voice: 120, par: 250,
    blurb: 'ガミガミ言いながら しゃがんでよける。', h: 0.93, w: 1.12, belly: 0.5, headS: 1.05,
    out: { top: 0xf2f0e6, leg: 0xcfd9de, shoe: 0x7a5230, belly: 0xc98f62, sleeve: 0xf2f0e6, fore: 0xeab98f },
    face: { skin: '#eab98f', eye: 'white', erx: 12, ery: 9, pupil: 5, lid: 0.3, slant: 0.7, brow: 0.9, browW: 8, browCol: '#8a8a8a', mouth: 'frown', smugMouth: 'frown', ey: 112,
      under: function (x, e, cx, ey) { x.strokeStyle = 'rgba(120,70,45,.5)'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx - 40, ey - 46 - i * 9); x.quadraticCurveTo(cx, ey - 50 - i * 9, cx + 40, ey - 46 - i * 9); x.stroke(); } },
      over: function (x, e, cx, ey) {
        x.fillStyle = '#9a9a9a'; x.beginPath(); x.ellipse(cx, ey + 50, 26, 8, 0, 0, 7); x.fill();
        x.strokeStyle = '#333'; x.lineWidth = 4; for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * 36, ey, 22, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(cx - 14, ey); x.lineTo(cx + 14, ey); x.stroke();
        for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 58, ey); x.lineTo(cx + s * 128, ey - 6); x.stroke(); } } },
    arms: [ARMS.cross, ARMS.cross],
    ai: { quick: 12, p: 0.42, react: [0.05, 0.14], hold: 0.34, cd: 0.6, moves: ['duck', 'duck', 'slip'], stun: 0.3, sway: [0.05, 1.7], bob: [0.03, 3.4], step: [0.5, 1.5, 3] }, tough: 160,
    lines: ['なっとらん!', '近頃の若いもんは…', 'わしの若い頃はな', 'けしからん!', '挨拶がないぞ、挨拶が'], ouch: ['ぐぬっ', 'こ、こらっ', 'ぬおっ'], bye: 'ふん…まあまあじゃな',
    dress: function (R, K) {
      for (const s of [-1, 1]) add(R.hc, G.sph, 0x9c9c9c, [s * K.hr * 0.8, K.hr * 0.05, -K.hr * 0.3], [K.hr * 0.36, K.hr * 0.42, K.hr * 0.5]);
      add(R.hc, G.sph, 0x9c9c9c, [0, -K.hr * 0.1, -K.hr * 0.72], [K.hr * 0.7, K.hr * 0.45, K.hr * 0.4]);
      add(R.hips, G.cyl, 0xc98f62, [0, K.T * 0.24, 0.02], [0.262 * K.w, K.T * 0.4, 0.21 * K.w]);
    },
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

  { id: 'bucho', name: 'いじわる部長', kata: '手柄は自分、ミスは部下', stage: 'office', speed: 3, voice: 135, par: 200,
    blurb: 'ネチネチ言いながら 横へスッとよける。', h: 1.03, w: 1.05, belly: 0.25, headS: 1.0,
    out: { top: 0x1f2a48, leg: 0x1f2a48, shoe: 0x101010 },
    face: { skin: '#f0c9a4', eye: 'white', erx: 14, ery: 8, pupil: 5, lid: 0.38, slant: 0.5, look: [0, 1], brow: 0.5, mouth: 'smirk', smugMouth: 'grin', ey: 112,
      over: function (x, e, cx, ey) { x.strokeStyle = '#1a1a1a'; x.lineWidth = 4.5; for (const s of [-1, 1]) { x.strokeRect(cx + s * 36 - 23, ey - 14, 46, 28); x.beginPath(); x.moveTo(cx + s * 59, ey - 4); x.lineTo(cx + s * 128, ey - 10); x.stroke(); } x.beginPath(); x.moveTo(cx - 13, ey - 4); x.lineTo(cx + 13, ey - 4); x.stroke();
        x.strokeStyle = 'rgba(110,55,35,.5)'; x.lineWidth = 2.5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 18, ey + 34); x.lineTo(cx + s * 30, ey + 60); x.stroke(); } } },
    arms: [ARMS.cross, ARMS.cross],
    ai: { quick: 15, p: 0.5, react: [0.04, 0.12], hold: 0.3, cd: 0.5, moves: ['step', 'step', 'slip', 'back'], stun: 0.26, sway: [0.04, 1.5], bob: [0.015, 3], step: [0.8, 0.9, 2.2] }, tough: 160,
    lines: ['君ぃ、やる気あるの?', 'これ、今日中ね', '前にも言ったよね?', '評価、下げとくから', '私が若い頃は 寝ずにやったよ'], ouch: ['き、君ぃ!', 'パワハラだぞ!', 'ぐはっ'], bye: '…来月から 君が部長だ',
    dress: function (R, K) {
      hairCap(R, 0x15130f, 0.43 * PI, -0.45);
      add(R.hc, G.sph, 0x15130f, [K.hr * 0.25, K.hr * 0.72, K.hr * 0.25], [K.hr * 0.8, K.hr * 0.36, K.hr * 0.78], [0, 0, -0.2]);
      add(R.hips, G.box, 0xffffff, [0, K.T * 0.72, 0.15 * K.w], [0.12, 0.2, 0.03], [-0.25, 0, 0]);
      R.acc.tie = add(R.hips, G.box, 0xc62828, [0, K.T * 0.6, 0.168 * K.w], [0.05, 0.3, 0.02], [-0.12, 0, 0]);
      add(R.hips, G.box, 0xc62828, [0, K.T * 0.83, 0.15 * K.w], [0.07, 0.05, 0.03]);
      sign(R.hips, '部長', { w: 0.09, h: 0.055, bg: '#ffe066', fg: '#222', p: [-0.13 * K.w, K.T * 0.66, 0.158 * K.w], r: [-0.15, -0.3, 0] });
    },
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

  { id: 'ponta', name: '着ぐるみ ぽん太', kata: '遊園地の人気者(中の人はいない)', stage: 'yuenchi', speed: 2, voice: 240, par: 280,
    blurb: 'ぴょんぴょん はねる ふざけたやつ。', h: 0.86, w: 1.55, belly: 1.0, headS: 1.85, legW: 1.5, armW: 1.4, noEars: 1, jig: 1.6,
    out: { top: 0xb9702c, leg: 0xb9702c, shoe: 0x8a4d18, belly: 0xfff3dc, hand: 0x8a4d18, handR: 0.085 },
    face: { skin: '#b9702c', custom: function (x, e, cx, ey) {
      x.fillStyle = '#5a3210'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 30, 112, 24, 30, s * 0.35, 0, 7); x.fill(); }
      x.fillStyle = '#fff3dc'; x.beginPath(); x.ellipse(cx, 160, 46, 34, 0, 0, 7); x.fill();
      if (e === 'dizzy') { x.strokeStyle = '#fff'; x.lineWidth = 4; for (const s of [-1, 1]) { x.beginPath(); for (let a = 0; a < 13; a += 0.3) { const r = 1 + a, X = cx + s * 30 + Math.cos(a) * r, Y = 112 + Math.sin(a) * r; if (!a) x.moveTo(X, Y); else x.lineTo(X, Y); } x.stroke(); } }
      else for (const s of [-1, 1]) { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * 30, 112, 13, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(cx + s * 30, 114, 8, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * 30 - 3, 110, 3, 0, 7); x.fill(); }
      x.fillStyle = '#2a1608'; x.beginPath(); x.ellipse(cx, 144, 11, 8, 0, 0, 7); x.fill();
      x.strokeStyle = '#2a1608'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, 152); x.lineTo(cx, 164); x.stroke();
      x.beginPath(); x.arc(cx - 11, 162, 11, 0.05 * PI, 0.95 * PI); x.stroke(); x.beginPath(); x.arc(cx + 11, 162, 11, 0.05 * PI, 0.95 * PI); x.stroke();
      x.fillStyle = 'rgba(255,120,120,.6)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 62, 150, 13, 9, 0, 0, 7); x.fill(); } } },
    arms: [ARMS.loose, ARMS.loose],
    ai: { quick: 15, p: 0.62, react: [0.035, 0.11], hold: 0.42, cd: 0.36, moves: ['jump', 'jump', 'step'], stun: 0.2, sway: [0.2, 3.1], hop: [0.3, 6.5], step: [1, 0.6, 1.5] }, tough: 190,
    lines: ['やめるポン!', '夢をこわすなポン', '(…暑い…)', 'ぽんぽこ〜♪', '中の人など いないポン!'], ouch: ['ポンッ', 'ぐえっ(小声)', 'いたいポン'], bye: '(…時給、上げてほしい)',
    dress: function (R, K) {
      for (const s of [-1, 1]) { add(R.hc, G.sph, 0xb9702c, [s * K.hr * 0.72, K.hr * 0.82, 0], K.hr * 0.3); add(R.hc, G.sph, 0xffb6c1, [s * K.hr * 0.72, K.hr * 0.82, K.hr * 0.12], K.hr * 0.2); }
      add(R.hc, G.sph, 0x5a8f3c, [0, K.hr * 1.02, K.hr * 0.2], [K.hr * 0.3, K.hr * 0.05, K.hr * 0.22], [0.3, 0, 0]);
      for (const s of [-1, 1]) add(R.hips, G.cone, 0xe53935, [s * 0.07, K.T * 0.93, 0.19 * K.w], [0.06, 0.13, 0.04], [0, 0, s * PI / 2]);
      add(R.hips, G.sph, 0x5a3210, [0, 0.05, -0.2 * K.w], [0.13, 0.13, 0.2]);
      // 中の人(頭が取れたときだけ見える)
      const inn = grp(R.hips, 0, K.T + 0.1, 0); inn.visible = false; R.acc.inner = inn;
      const t = canvasTex(256, 128, function (x) { x.fillStyle = '#f3c9a5'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#222'; x.fillRect(100, 52, 14, 5); x.fillRect(142, 52, 14, 5);
        x.fillStyle = '#5a1414'; x.beginPath(); x.ellipse(128, 86, 9, 11, 0, 0, 7); x.fill(); x.fillStyle = '#7ad0ff'; for (const p of [[84, 40], [172, 46], [164, 20]]) { x.beginPath(); x.ellipse(p[0], p[1], 4, 7, 0, 0, 7); x.fill(); } });
      const m = new THREE.Mesh(G.head, new THREE.MeshLambertMaterial({ map: t })); m.scale.setScalar(0.105); m.userData.tex = t; inn.add(m);
      add(inn, G.box, 0xffffff, [0, 0.07, 0], [0.2, 0.035, 0.2]);
    },
    downT: 3.3, down: function (R, k, fx, st) {
      const ov = R.ov; ov.expr = 'idle';
      const a = seg(k, 0, 0.52), c = seg(k, 0.6, 1);
      once(st, 's', true, function () { fx.text('スポーン!!'); fx.snd('pop'); fx.burst('star', 10, [0, 1.6, 0.2]); });
      if (a < 1) { ov.headUp = Math.sin(a * PI) * 2.3 + 0.02; ov.headRy = a * PI * 6; ov.headRz = Math.sin(a * 9) * 0.6; ov.x = Math.sin(k * 44) * 0.22; ov.arms = 1; ov.kick = 0.7; R.acc.inner.visible = true;
        once(st, 'b', a > 0.25, function () { fx.say('あっ…!'); fx.text('あせあせ'); }); }
      else { R.acc.inner.visible = false; once(st, 'c', true, function () { fx.text('カポッ'); fx.snd('boing'); fx.shake(0.5); }); }
      if (c > 0) { ov.rz = Math.sin(c * PI * 2) * 0.08; once(st, 'e', c > 0.3, function () { fx.say('…見た?'); }); }
    } },

  { id: 'oji', name: 'ナルシスト王子 カズヤ', kata: '顔だけは守りたい', stage: 'neon', speed: 3, voice: 170, par: 210,
    blurb: 'くるっと回って 華麗によける。顔を殴ると…?', h: 1.08, w: 0.95, headS: 0.98,
    out: { top: 0xf8f8ff, leg: 0xf8f8ff, shoe: 0xeeeeee },
    face: { skin: '#f8dcc0', eye: 'white', erx: 17, ery: 15, pupil: 10, iris: '#3f7fd8', sparkle: 1, lash: 1, lid: 0.12, brow: 0.15, browW: 4, browCol: '#b8902e', mouth: 'smile', smugMouth: 'grin', lips: 'rgba(230,120,130,.5)' },
    arms: [ARMS.hair, ARMS.offer],
    ai: { quick: 18, p: 0.7, react: [0.03, 0.1], hold: 0.34, cd: 0.3, moves: ['spin', 'spin', 'slip', 'back'], stun: 0.19, sway: [0.07, 1.6], bob: [0.02, 3.2], step: [0.7, 1.1, 2.4] }, tough: 150,
    lines: ['顔はやめてくれないか', '美しさは罪…', 'フッ…', '君、ボクに夢中だね', '鏡、持ってない?'], ouch: ['顔はダメだってば!', 'うつくしく…ない!', 'ボクの顔に 傷がぁ…!'], bye: '傷ついたボクも…美しい',
    dress: function (R, K) {
      const y = 0xf2d16b; hairCap(R, y, 0.47 * PI, -0.5);
      add(R.hc, G.sph, y, [-K.hr * 0.3, K.hr * 0.62, K.hr * 0.62], [K.hr * 0.72, K.hr * 0.3, K.hr * 0.42], [0, 0, 0.35]);
      add(R.hc, G.sph, y, [0, -K.hr * 0.35, -K.hr * 0.5], [K.hr * 0.95, K.hr * 1.0, K.hr * 0.6]);
      add(R.hips, G.box, 0x8a1f45, [0, K.T * 0.7, 0.148 * K.w], [0.1, 0.24, 0.03], [-0.2, 0, 0]);
      const rose = grp(R.arms[1].el, 0, -0.3, 0.03);
      add(rose, G.cyl, 0x2e7d32, [0, -0.02, 0.1], [0.008, 0.24, 0.008], [PI / 2, 0, 0]); add(rose, G.sph, 0xe91e63, [0, -0.02, 0.23], 0.045);
    },
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

  { id: 'roshi', name: '酔拳じいさん 老師', kata: 'ふらふらなのに当たらない', stage: 'chikurin', speed: 4, voice: 150, par: 210,
    blurb: 'のけぞって よける。動きが読めない!', h: 0.88, w: 0.92, headS: 1.08,
    out: { top: 0xb3261e, leg: 0x1c1c1c, shoe: 0x111111 },
    face: { skin: '#f0c49a', eye: 'narrow', blush: 1, browCol: '#ffffff', browW: 9, brow: -0.5, browY: 22, mouth: 'smile', smugMouth: 'grin',
      over: function (x, e, cx, ey) { x.fillStyle = 'rgba(255,90,70,.55)'; x.beginPath(); x.arc(cx, ey + 26, 9, 0, 7); x.fill();
        x.fillStyle = '#fff'; x.beginPath(); x.moveTo(cx - 50, ey + 78); x.quadraticCurveTo(cx, ey + 60, cx + 50, ey + 78); x.lineTo(cx + 60, 256); x.lineTo(cx - 60, 256); x.closePath(); x.fill();
        x.beginPath(); x.ellipse(cx - 16, ey + 50, 18, 6, 0.3, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + 16, ey + 50, 18, 6, -0.3, 0, 7); x.fill(); } },
    arms: [ARMS.loose, ARMS.loose],
    ai: { quick: 21, p: 0.74, react: [0.03, 0.095], hold: 0.3, cd: 0.28, moves: ['back', 'back', 'duck', 'slip', 'slip'], stun: 0.2, sway: [0.2, 1.9], bob: [0.05, 2.7], step: [0.9, 0.7, 1.8], drunk: 1 }, tough: 140,
    lines: ['ほっほっほ', 'まだまだじゃのう', '見える、見えるぞい', 'ひっく…', '100年早いわい'], ouch: ['ほげっ', 'あいたた', 'ひっく!'], bye: '弟子にしてやっても…よいぞ',
    dress: function (R, K) {
      add(R.hc, G.cone, 0xffffff, [0, -K.hr * 1.25, K.hr * 0.55], [K.hr * 0.4, K.hr * 1.5, K.hr * 0.26], [PI + 0.12, 0, 0]);
      for (const s of [-1, 1]) add(R.hc, G.sph, 0xffffff, [s * K.hr * 0.85, 0, -K.hr * 0.3], [K.hr * 0.3, K.hr * 0.4, K.hr * 0.45]);
      add(R.hips, G.cyl, 0xf4c20d, [0, K.T * 0.1, 0], [0.228 * K.w, 0.07, 0.165 * K.w]);
      for (let i = 0; i < 4; i++) add(R.hips, G.sph, 0xf4c20d, [0, K.T * (0.82 - i * 0.16), 0.158 * K.w], 0.018);
      const g = grp(R.hips, 0.24, 0.02, 0.1); add(g, G.sph, 0x9c6b30, [0, -0.1, 0], 0.075); add(g, G.sph, 0x9c6b30, [0, 0.0, 0], 0.05); add(g, G.cyl, 0xc62828, [0, 0.06, 0], [0.015, 0.05, 0.015]);
    },
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

  { id: 'kage', name: '忍者 カゲ丸', kata: '消える・出る・また消える', stage: 'shiro', speed: 4, voice: 160, par: 200,
    blurb: 'ドロンと消えて 別の場所に出る。', h: 0.98, w: 0.95, headS: 1.0, noEars: 1,
    out: { top: 0x1b2440, leg: 0x1b2440, shoe: 0x0e1322, hand: 0x1b2440 },
    face: { skin: '#f0c9a4', eye: 'white', erx: 16, ery: 10, pupil: 6, lid: 0.3, slant: 0.75, brow: 0.9, browW: 7, noMouth: 1, noNose: 1, hitInk: '#2a1c14',
      under: function (x, e, cx, ey) { x.fillStyle = '#1b2440'; x.fillRect(0, 0, 512, ey - 34); x.fillRect(0, ey + 26, 512, 256); x.fillRect(0, 0, cx - 92, 256); x.fillRect(cx + 92, 0, 300, 256);
        x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(cx - 80, ey + 50 + i * 16); x.quadraticCurveTo(cx, ey + 60 + i * 16, cx + 80, ey + 50 + i * 16); x.stroke(); } } },
    arms: [ARMS.nin, ARMS.nin],
    ai: { quick: 24, p: 0.8, react: [0.025, 0.085], hold: 0.26, cd: 0.2, moves: ['warp', 'warp', 'duck', 'jump'], stun: 0.13, sway: [0.05, 3], bob: [0.04, 5], step: [1, 0.6, 1.5] }, tough: 130,
    lines: ['残像でござる', '遅いでござる', 'ニンニン', '拙者は ここでござる', '修行が足りぬ'], ouch: ['ぬぅっ', '不覚!', 'ござっ'], bye: 'おぬし…できるな',
    dress: function (R, K) {
      add(R.hc, G.box, 0x9aa3ad, [0, K.hr * 0.5, K.hr * 0.9], [0.11, 0.045, 0.02], [-0.5, 0, 0]);
      add(R.hips, G.tor, 0xd32f2f, [0, K.T + 0.0, 0], [0.1, 0.1, 0.22], [PI / 2, 0, 0]);
      R.acc.scarf = add(R.hips, G.box, 0xd32f2f, [0.1, K.T - 0.05, -0.22], [0.09, 0.02, 0.4], [0.4, 0.3, 0]);
      add(R.hips, G.cyl, 0x333333, [0.05, K.T * 0.6, -0.17 * K.w], [0.015, 0.75, 0.015], [0, 0, -0.7]);
      add(R.hips, G.cyl, 0xcfd8dc, [0, K.T * 0.12, 0], [0.225 * K.w, 0.06, 0.16 * K.w]);
      const lg = grp(R.root, 0, 0.16, 0); lg.visible = false; R.acc.log = lg;
      add(lg, G.cyl, 0x8d6239, [0, 0, 0], [0.16, 1.1, 0.16], [0, 0, PI / 2]); for (const s of [-1, 1]) add(lg, G.cyl, 0xd9b77e, [s * 0.552, 0, 0], [0.13, 0.005, 0.13], [0, 0, PI / 2]);
      sign(lg, 'ハズレ', { w: 0.5, h: 0.16, bg: '#fff6d8', fg: '#b71c1c', p: [0, 0.03, 0.162] });
    },
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

  { id: 'tetsu', name: '元ボクサー 鉄', kata: '本職の殴られ屋・1分1000円', stage: 'ring', speed: 5, voice: 110, par: 130,
    blurb: '本物。ウィービングで ほとんど当たらない!', h: 1.04, w: 1.12, headS: 0.98, armW: 1.25,
    out: { top: 0xf4f4f4, leg: 0xe2b48c, shoe: 0xffffff, shorts: 0x1c4fd0, sleeve: 0xe2b48c, hand: 0x1c4fd0, handR: 0.092, boot: 1 },
    face: { skin: '#e2b48c', eye: 'white', erx: 14, ery: 10, pupil: 6.5, lid: 0.22, slant: 0.35, brow: 0.6, browW: 9, mouth: 'flat', smugMouth: 'smirk',
      under: function (x, e, cx, ey) { x.fillStyle = 'rgba(60,40,30,.22)'; for (let i = 0; i < 220; i++) x.fillRect(cx - 62 + Math.random() * 124, ey + 44 + Math.random() * 60, 2, 2); },
      over: function (x, e, cx, ey) { x.fillStyle = '#f6e3c4'; x.save(); x.translate(cx + 40, ey + 32); x.rotate(-0.4); x.fillRect(-14, -5, 28, 10); x.restore(); x.strokeStyle = 'rgba(120,40,40,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 52, ey - 34); x.lineTo(cx - 40, ey - 22); x.stroke(); } },
    arms: [ARMS.guard, ARMS.guard],
    ai: { quick: 27, p: 0.82, react: [0.02, 0.075], hold: 0.24, cd: 0.26, moves: ['duck', 'slip', 'slip', 'back', 'step'], stun: 0.16, sway: [0.14, 4.2], bob: [0.1, 8.4], step: [0.9, 0.5, 1.4] }, tough: 150,
    lines: ['1分1000円だ', '当ててみな', 'いいパンチだ!', 'まだまだ!', '腰が入ってねぇぞ'], ouch: ['ぐっ', 'やるな!', 'うっ'], bye: 'いい汗かいたな。まいど!',
    dress: function (R, K) {
      hairCap(R, 0xc62828, 0.5 * PI, -0.55, 1.1);
      for (const s of [-1, 1]) add(R.hc, G.box, 0xc62828, [s * K.hr * 0.86, -K.hr * 0.2, K.hr * 0.22], [K.hr * 0.3, K.hr * 0.75, K.hr * 0.7]);
      add(R.hc, G.box, 0xc62828, [0, K.hr * 0.72, K.hr * 0.78], [K.hr * 1.3, K.hr * 0.3, K.hr * 0.3], [-0.45, 0, 0]);
      add(R.hips, G.cyl, 0xffffff, [0, 0.13, 0], [0.215 * K.w, 0.07, 0.165 * K.w]);
      for (const a of R.arms) add(a.el, G.cyl, 0xffffff, [0, -0.2, 0], [0.066, 0.06, 0.066]);
    },
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

  { id: 'boss', name: '工場の女帝 イヤミ田さん', kata: '野菜カット工場のパートリーダー', stage: 'kojo', speed: 5, voice: 260, par: 110, boss: 1,
    blurb: '【ボス】目しか見えないのに、目がいちばん嫌。', h: 0.9, w: 1.3, belly: 0.55, headS: 1.12, legW: 1.2, armW: 1.15,
    out: { top: 0xf5f9fa, leg: 0xf5f9fa, shoe: 0xffffff, belly: 0xf5f9fa, hand: 0xff8fb0, handR: 0.074, fore: 0xa9d8ee, boot: 1 },
    face: { skin: '#e9bf9e', eye: 'white', erx: 19, ery: 12, pupil: 5.2, iris: '#241208', lid: 0.46, slant: 0.95, look: [-4, 4], lidCol: '#9a6fa8', shadow: 'rgba(120,70,150,.5)', lash: 1, bags: 1,
      brow: 1.15, browW: 3.5, browCol: '#3a2a2a', browY: 27, noMouth: 1, noNose: 1, smugEye: 'arc', ex: 38, ey: 110,
      under: function (x, e, cx, ey) {
        x.fillStyle = '#fdfefe'; x.fillRect(0, ey + 24, 512, 256);
        x.strokeStyle = 'rgba(120,150,170,.45)'; x.lineWidth = 2.5; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(cx - 100, ey + 46 + i * 22); x.quadraticCurveTo(cx, ey + 54 + i * 22, cx + 100, ey + 46 + i * 22); x.stroke(); }
        x.strokeStyle = 'rgba(110,55,45,.55)'; x.lineWidth = 2.5;
        for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + s * 62, ey - 4 + i * 5); x.lineTo(cx + s * 76, ey - 10 + i * 9); x.stroke(); }
        x.beginPath(); x.moveTo(cx - 5, ey - 24); x.lineTo(cx - 3, ey - 8); x.moveTo(cx + 5, ey - 24); x.lineTo(cx + 3, ey - 8); x.stroke(); },
      over: function (x, e, cx, ey) { if (e === 'smug') { x.fillStyle = '#b388c8'; x.font = '900 22px sans-serif'; x.fillText('♪', cx + 72, ey - 22); }
        if (e === 'hit' || e === 'dizzy') { x.strokeStyle = 'rgba(120,150,170,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 14, ey + 62); x.lineTo(cx + 14, ey + 86); x.moveTo(cx + 14, ey + 62); x.lineTo(cx - 14, ey + 86); x.stroke(); } } },
    arms: [ARMS.hips, ARMS.hips],
    ai: { quick: 34, p: 0.95, react: [0.012, 0.055], hold: 0.27, cd: 0.06, moves: ['step', 'step', 'duck', 'back', 'back', 'jump', 'slip'], stun: 0.06, sway: [0.2, 4.4], bob: [0.11, 8.8], step: [1, 0.25, 0.7], nag: 1 }, tough: 140,
    lines: ['あんた、遅いねぇ', 'それで本気?', '最近の人は これだから', 'あたしの若い頃はねぇ', 'へぇ〜、ふ〜ん', '向いてないんじゃない?', 'はい、やり直し', '聞こえなーい', '手ぇ止まってるよ', 'あら、まだいたの?'],
    ouch: ['キィーッ!', 'な、なによ!', '言いつけるわよ!'], bye: '…明日のシフト、代わってあげてもいいわよ',
    dress: function (R, K) {
      const perm = grp(R.hc); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, r = i % 2 ? 0.62 : 0.3; add(perm, G.sph, 0x7a4d86, [Math.cos(a) * K.hr * r, K.hr * (0.78 + (i % 2 ? -0.12 : 0.1)), Math.sin(a) * K.hr * r - K.hr * 0.1], K.hr * 0.3); }
      const cap = grp(R.hc); R.acc.cap = cap;
      const cg = new THREE.SphereGeometry(K.hr * 1.1, 22, 10, 0, PI * 2, 0, 0.5 * PI), cm = new THREE.Mesh(cg, mat(0xffffff, { ds: 1 })); cm.rotation.x = -0.5; cm.scale.set(1.04, 1.22, 1.06); cap.add(cm);
      add(cap, G.tor, 0x8fc7e8, [0, K.hr * 0.3, -K.hr * 0.1], [K.hr * 1.1, K.hr * 1.14, K.hr * 0.5], [PI / 2 - 0.5, 0, 0]);
      add(R.hips, G.box, 0xa9d8ee, [0, K.T * 0.26, 0.2 * K.w + 0.04], [0.36 * K.w, K.T * 0.95, 0.015], [-0.06, 0, 0]);
      add(R.hips, G.box, 0xa9d8ee, [0, K.T * 0.8, 0.165 * K.w], [0.2 * K.w, 0.2, 0.015], [-0.3, 0, 0]);
      sign(R.hips, 'リーダー', { w: 0.14, h: 0.05, bg: '#e53935', fg: '#fff', p: [0.1, K.T * 0.82, 0.172 * K.w + 0.01], r: [-0.3, 0, 0] });
    },
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
    } }
];
