/* 殴られ屋 — 10か所の背景。相手は (0,0,0) に立ち、こちらは +Z 側から見る */
import { THREE, G, add, grp, sign, patPlane, mat } from './kit.js';
const PI = Math.PI;
function tools(g) {
  return {
    B: function (c, p, s, r, o) { return add(g, G.box, c, p, s, r, o); },
    C: function (c, p, s, r, o) { return add(g, G.cyl, c, p, s, r, o); },
    S: function (c, p, s, r, o) { return add(g, G.sph, c, p, s, r, o); },
    K: function (c, p, s, r, o) { return add(g, G.cone, c, p, s, r, o); },
    floor: function (draw, rep) { return patPlane(g, 40, 40, rep || [40, 40], draw, [0, 0, -8], [-PI / 2, 0, 0]); }
  };
}
function vtext(s) { return s.split('').join('\n'); }
function rnd(i) { const x = Math.sin(i * 127.1 + 3.3) * 43758.5453; return x - Math.floor(x); }

const S = {};

/* 1. ラーメン屋 */
S.shokudo = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#b98c5e'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#e9d6b0'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64); });
  t.B(0xf3e6c8, [0, 2, -4.2], [16, 4.4, 0.1]); t.B(0x7a4a26, [0, 0.5, -4.1], [16, 1, 0.12]);
  t.B(0x8a5a2e, [0, 0.52, -2.5], [9, 1.04, 0.6]); t.B(0xb5793d, [0, 1.06, -2.45], [9.1, 0.06, 0.75]);
  [-2.9, -2.1, -1.3, 1.3, 2.1, 2.9].forEach(function (x) { t.C(0x555555, [x, 0.3, -1.85], [0.03, 0.6, 0.03]); t.C(0xc62828, [x, 0.62, -1.85], [0.19, 0.07, 0.19]); });
  [-1.7, 1.2, 2.4].forEach(function (x, i) { t.C(0xffffff, [x, 1.15, -2.4], [0.17, 0.12, 0.17]); t.C(i == 1 ? 0xd8a24a : 0xe8c37a, [x, 1.2, -2.4], [0.15, 0.03, 0.15]); t.S(0xff8a80, [x + 0.05, 1.23, -2.4], [0.05, 0.015, 0.05]); });
  t.C(0xb0bec5, [-0.9, 1.32, -3.5], [0.28, 0.45, 0.28]); t.C(0xb0bec5, [0.9, 1.26, -3.5], [0.22, 0.34, 0.22]); t.B(0x9e9e9e, [0, 0.55, -3.5], [5, 1.1, 0.7]);
  for (let i = 0; i < 7; i++) t.B(i % 2 ? 0xc62828 : 0xb71c1c, [-1.8 + i * 0.6, 2.42, -2.2], [0.56, 0.5, 0.02]);
  t.C(0x5a3a1a, [0, 2.7, -2.2], [0.025, 4.6, 0.025], [0, 0, PI / 2]);
  sign(g, 'ら ー め ん', { w: 2.2, h: 0.34, bg: '#b71c1c', fg: '#fff', p: [0, 2.42, -2.18] });
  ['しょうゆ', 'みそ', 'とんこつ', 'ギョーザ', 'チャーハン', 'ビール'].forEach(function (m, i) { sign(g, vtext(m), { w: 0.24, h: 0.9, bg: '#fff8e1', fg: i == 3 ? '#c62828' : '#222', p: [-2.3 + i * 0.5 + (i > 2 ? 2.1 : 0), 3.25, -4.12] }); });
  for (const s of [-1, 1]) { t.S(0xff5a3a, [s * 1.45, 2.45, -1.2], [0.2, 0.26, 0.2], null, { glow: 0xcc2200 }); t.B(0x222222, [s * 1.45, 2.74, -1.2], [0.14, 0.04, 0.14]); t.B(0x222222, [s * 1.45, 2.17, -1.2], [0.14, 0.04, 0.14]); }
  const steam = []; for (let i = 0; i < 5; i++) steam.push(t.S(0xffffff, [-0.9 + rnd(i) * 0.2, 1.7, -3.5], 0.1, null, { a: 0.35 }));
  return { bnd: { zMin: -1.3, xMax: 1.0 }, bg: 0xf3e6c8, fog: [0xf3e6c8, 8, 30], hemi: [0xfff4e0, 0x8a6a4a, 1.25], sun: [0xfff0d8, 1.4, [1, 3, 3]],
    update: function (T) { steam.forEach(function (s, i) { const k = (T * 0.4 + i * 0.2) % 1; s.position.y = 1.6 + k * 1.0; s.scale.setScalar(0.08 + k * 0.14); s.material.opacity = 0.35 * (1 - k); }); } };
};

/* 2. コンビニ前(夜) */
S.konbini = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#2a2d36'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#343844'; for (let i = 0; i < 40; i++) x.fillRect(rnd(i) * 128, rnd(i + 50) * 128, 3, 3); }, [20, 20]);
  t.B(0xdfe3e8, [0, 1.9, -5], [12, 3.8, 0.3]);
  t.B(0xeaf7ff, [0, 1.45, -4.82], [7.5, 2.3, 0.05], null, { basic: 1 });
  t.B(0xff8f00, [0, 3.25, -4.8], [12, 0.26, 0.1], null, { basic: 1 }); t.B(0x8e24aa, [0, 3.0, -4.8], [12, 0.2, 0.1], null, { basic: 1 }); t.B(0xffffff, [0, 3.5, -4.8], [12, 0.24, 0.1], null, { basic: 1 });
  sign(g, 'ナグマート', { w: 2.6, h: 0.5, bg: '#ffffff', fg: '#8e24aa', p: [0, 3.52, -4.7], glow: 1 });
  for (let i = 0; i < 4; i++) { t.B(0x90a4ae, [-3 + i * 2, 1.2, -5.4], [1.5, 1.7, 0.4]); for (let j = 0; j < 12; j++) t.B([0xff7043, 0xffca28, 0x66bb6a, 0x42a5f5, 0xec407a][(i + j) % 5], [-3.6 + i * 2 + (j % 6) * 0.24, 0.8 + Math.floor(j / 6) * 0.55, -5.15], [0.18, 0.3, 0.1], null, { basic: 1 }); }
  [-1.2, 1.2].forEach(function (x) { t.B(0x455a64, [x, 1.45, -4.78], [0.06, 2.3, 0.06]); });
  // 自販機
  t.B(0xc62828, [2.0, 0.95, -2.9], [0.8, 1.9, 0.6]); t.B(0xfff3e0, [2.0, 1.3, -2.59], [0.66, 0.9, 0.02], null, { basic: 1 });
  for (let i = 0; i < 8; i++) t.C([0x29b6f6, 0xffa726, 0x66bb6a, 0xef5350][i % 4], [1.76 + (i % 4) * 0.16, 1.15 + Math.floor(i / 4) * 0.36, -2.57], [0.05, 0.2, 0.05], null, { basic: 1 });
  // 街灯・ごみ箱
  t.C(0x607d8b, [-1.9, 1.9, -2.6], [0.05, 3.8, 0.05]); t.B(0x607d8b, [-1.6, 3.75, -2.6], [0.7, 0.06, 0.12]); const lamp = t.S(0xfff6c8, [-1.35, 3.68, -2.6], [0.16, 0.07, 0.1], null, { basic: 1 });
  t.K(0xfff6c8, [-1.35, 1.85, -2.6], [1.0, 3.6, 1.0], null, { basic: 1, a: 0.06 });
  [-0.4, 0.2].forEach(function (d, i) { t.B(i ? 0x1565c0 : 0x2e7d32, [-2.9 + d * 1.6, 0.45, -4.4], [0.5, 0.9, 0.45]); });
  for (let i = 0; i < 50; i++) t.S(0xffffff, [(rnd(i) - 0.5) * 30, 5 + rnd(i + 9) * 8, -14], 0.04, null, { basic: 1 });
  t.B(0x161a2a, [-6, 3, -9], [4, 8, 3]); t.B(0x161a2a, [6.5, 4, -10], [5, 10, 3]);
  for (let i = 0; i < 12; i++) t.B(0xffe082, [5 + (i % 3) * 1.0, 2 + Math.floor(i / 3) * 1.4, -8.4], [0.5, 0.6, 0.05], null, { basic: 1 });
  return { bnd: { zMin: -2.2, xMax: 1.3 }, bg: 0x0a1030, fog: [0x0a1030, 12, 40], hemi: [0x8fa8ff, 0x20242e, 0.9], sun: [0xeaf4ff, 1.5, [0, 2.5, 2]],
    update: function (T) { lamp.material.color.setScalar(Math.sin(T * 31) > 0.96 ? 0.5 : 1); } };
};

/* 3. 和室 */
S.washitsu = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#b9c486'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#a9b476'; for (let i = 0; i < 128; i += 4) { x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } x.fillStyle = '#2f4a2a'; x.fillRect(0, 0, 128, 5); x.fillRect(0, 0, 5, 128); }, [10, 20]);
  patPlane(g, 7.2, 2.6, [6, 1], function (x) { x.fillStyle = '#fbf7ea'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#7a5230'; x.lineWidth = 3; for (let i = 0; i <= 128; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); } for (let j = 0; j <= 128; j += 21.3) { x.beginPath(); x.moveTo(0, j); x.lineTo(128, j); x.stroke(); } x.lineWidth = 9; x.strokeRect(0, 0, 128, 128); }, [-1.2, 1.3, -4], null, true);
  t.B(0x6a4526, [0, 2.75, -3.95], [16, 0.3, 0.14]); t.B(0xd9c9a3, [0, 3.4, -4], [16, 1.1, 0.1]);
  t.B(0xcdbb92, [4.2, 1.5, -4], [3.6, 3, 0.1]); t.B(0x6a4526, [2.42, 1.5, -3.9], [0.16, 3, 0.2]); t.B(0x4a3320, [4.2, 0.12, -3.6], [3.4, 0.24, 0.9]);
  sign(g, vtext('根性'), { w: 0.55, h: 1.6, bg: '#fffdf2', fg: '#111', border: '#7a5230', p: [3.5, 1.7, -3.93] });
  t.C(0x5d4037, [4.6, 0.36, -3.55], [0.16, 0.2, 0.16]); t.C(0x6d4c41, [4.6, 0.66, -3.55], [0.03, 0.5, 0.03], [0, 0, 0.3]); [[0, 0], [0.18, 0.1], [-0.14, 0.14]].forEach(function (p) { t.S(0x2e7d32, [4.55 + p[0], 0.9 + p[1], -3.55], [0.2, 0.09, 0.16]); });
  // ちゃぶ台
  t.C(0x7a4a26, [-1.55, 0.36, -1.5], [0.62, 0.05, 0.62]); [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(function (p) { t.C(0x6a4020, [-1.55 + p[0], 0.17, -1.5 + p[1]], [0.03, 0.34, 0.03]); });
  t.C(0x37474f, [-1.7, 0.44, -1.4], [0.05, 0.09, 0.05]); t.C(0x8d6e63, [-1.3, 0.42, -1.6], [0.16, 0.05, 0.16]); [[0, 0], [0.09, 0.02], [-0.04, 0.09]].forEach(function (p) { t.S(0xff9800, [-1.3 + p[0], 0.48, -1.6 + p[1]], 0.05); });
  t.B(0x6a3fa0, [-1.55, 0.05, -0.75], [0.55, 0.09, 0.55]); t.B(0x6a3fa0, [1.5, 0.05, -1.7], [0.55, 0.09, 0.55], [0, 0.4, 0]);
  // 古いテレビ
  t.B(0x4a3320, [1.75, 0.3, -3.3], [0.9, 0.6, 0.5]); t.B(0x3e2c1c, [1.75, 0.9, -3.3], [0.75, 0.6, 0.5]); t.B(0x9fb7a6, [1.72, 0.92, -3.04], [0.5, 0.4, 0.02], null, { basic: 1 });
  t.B(0x6a4526, [0, 3.9, -1], [16, 0.12, 0.2]);
  return { bnd: { zMin: -2.4, xMax: 0.95 }, bg: 0xd9c9a3, fog: [0xd9c9a3, 9, 30], hemi: [0xfff8e6, 0x8a7a55, 1.2], sun: [0xfff3da, 1.3, [-1, 3, 3]] };
};

/* 4. オフィス */
S.office = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#6f7b8a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#66717f'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64); }, [30, 30]);
  t.B(0xe9edf1, [0, 1.75, -9.5], [22, 3.5, 0.1]);
  patPlane(g, 14, 1.9, [7, 1], function (x) { x.fillStyle = '#9ad1f5'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#7fb3d9'; x.fillRect(20, 60, 30, 68); x.fillRect(70, 30, 36, 98); x.fillStyle = 'rgba(255,255,255,.75)'; for (let j = 0; j < 128; j += 10) x.fillRect(0, j, 128, 5); x.fillStyle = '#cfd8dc'; x.fillRect(0, 0, 6, 128); }, [0, 2.0, -9.4], null, true);
  for (let i = -2; i <= 2; i++) t.B(0xffffff, [i * 2.2, 3.44, -3], [1.3, 0.04, 0.3], null, { basic: 1 });
  t.B(0xf4f6f8, [0, 3.5, -5], [22, 0.06, 12]);
  for (let r = 0; r < 4; r++) for (const s of [-1, 1]) {
    const x = s * (1.75 + (r % 2) * 0.0), z = -1.6 - r * 1.9;
    t.B(0xcfd4da, [x, 0.72, z], [1.5, 0.05, 0.8]); t.B(0xaab2bb, [x - s * 0.7, 0.36, z], [0.05, 0.72, 0.75]); t.B(0xaab2bb, [x + s * 0.7, 0.36, z], [0.05, 0.72, 0.75]);
    t.B(0x222831, [x, 1.05, z - 0.2], [0.55, 0.36, 0.04]); t.B(r % 2 ? 0x8fd3ff : 0xc5f0c0, [x, 1.05, z - 0.177], [0.5, 0.31, 0.01], null, { basic: 1 }); t.B(0x222831, [x, 0.82, z - 0.2], [0.08, 0.14, 0.06]);
    t.B(0xffffff, [x + 0.45, 0.78, z + 0.1], [0.22, 0.06 + rnd(r + s) * 0.2, 0.3]); t.B(0x37474f, [x, 0.5, z + 0.75], [0.48, 0.08, 0.48]); t.B(0x37474f, [x, 0.85, z + 0.98], [0.48, 0.6, 0.06]); t.C(0x555555, [x, 0.24, z + 0.75], [0.03, 0.48, 0.03]);
  }
  sign(g, '今月の目標\n売上200%', { w: 1.5, h: 0.8, bg: '#ffffff', fg: '#c62828', border: '#90a4ae', p: [0, 2.2, -9.3] });
  sign(g, '残業は\n気合い', { w: 0.7, h: 0.7, bg: '#fff59d', fg: '#333', p: [2.2, 2.1, -9.3] });
  t.C(0xffffff, [-2.2, 2.6, -9.35], [0.26, 0.03, 0.26], [PI / 2, 0, 0]); t.B(0x222222, [-2.2, 2.68, -9.3], [0.02, 0.18, 0.01]); t.B(0x222222, [-2.13, 2.6, -9.3], [0.14, 0.02, 0.01]);
  t.B(0xdfe3e6, [-3.6, 0.6, -8.6], [0.9, 1.2, 0.8]); t.C(0x8d6e63, [3.6, 0.25, -8.6], [0.22, 0.5, 0.22]); t.S(0x388e3c, [3.6, 1.05, -8.6], [0.45, 0.7, 0.45]);
  return { bnd: { zMin: -5.5, xMax: 0.72 }, bg: 0xe9edf1, fog: [0xe9edf1, 12, 40], hemi: [0xffffff, 0x8a94a0, 1.3], sun: [0xffffff, 1.2, [0, 3, 3]] };
};

/* 5. 遊園地 */
S.yuenchi = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#f2d9b8'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#f7c6c6'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64); }, [24, 24]);
  const wheel = grp(g, 0, 5.3, -13);
  add(wheel, G.tor, 0xff5a8a, [0, 0, 0], [4.2, 4.2, 0.6]); add(wheel, G.cyl, 0xffffff, [0, 0, 0], [0.4, 0.5, 0.4], [PI / 2, 0, 0]);
  const gond = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; add(wheel, G.box, 0xffffff, [Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0], [4.2, 0.06, 0.06], [0, 0, a]);
    gond.push(add(wheel, G.box, [0xffca28, 0x42a5f5, 0x66bb6a, 0xef5350, 0xab47bc][i % 5], [Math.cos(a) * 4.2, Math.sin(a) * 4.2, 0], [0.75, 0.7, 0.5])); }
  for (const s of [-1, 1]) t.B(0x90a4ae, [s * 1.6, 2.6, -13], [0.2, 5.6, 0.2], [0, 0, s * 0.3]);
  for (const s of [-1, 1]) { const x = s * 3.0, z = -5; t.C(s < 0 ? 0xffffff : 0xfff3c4, [x, 1.0, z], [1.3, 2.0, 1.3]); t.K(s < 0 ? 0xe53935 : 0x1e88e5, [x, 2.7, z], [1.6, 1.4, 1.6]); t.S(0xffca28, [x, 3.5, z], 0.12);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; t.B(s < 0 ? 0xe53935 : 0x1e88e5, [x + Math.cos(a) * 1.31, 1.0, z + Math.sin(a) * 1.31], [0.5, 2.0, 0.03], [0, -a + PI / 2, 0]); } }
  const bal = [];
  [[-1.5, -2.4], [1.55, -2.0], [1.9, -2.3], [-1.9, -2.7]].forEach(function (p, i) { t.C(0xffffff, [p[0], 1.0, p[1]], [0.006, 2.0, 0.006]); bal.push(t.S([0xef5350, 0xffca28, 0x42a5f5, 0xab47bc][i], [p[0], 2.2, p[1]], [0.24, 0.3, 0.24])); });
  for (let i = 0; i < 17; i++) t.K([0xef5350, 0xffca28, 0x42a5f5, 0x66bb6a][i % 4], [-4 + i * 0.5, 3.25 - Math.sin(i / 16 * PI) * 0.35, -3.2], [0.14, 0.26, 0.02], [PI, 0, 0]);
  for (let i = 0; i < 7; i++) { const c = grp(g, -9 + i * 3.2 + rnd(i) * 2, 7 + rnd(i + 3) * 3, -20); for (let j = 0; j < 3; j++) add(c, G.sph, 0xffffff, [j * 0.8 - 0.8, rnd(i * 3 + j) * 0.3, 0], [0.9, 0.5, 0.5], null, { basic: 1 }); }
  // メリーゴーラウンドの柵
  for (let i = -6; i <= 6; i++) t.C(0xffffff, [i * 0.7, 0.45, -7.5], [0.03, 0.9, 0.03]); t.B(0xff8fb0, [0, 0.9, -7.5], [9, 0.06, 0.06]);
  return { bnd: { zMin: -3.2, xMax: 1.25 }, bg: 0x7ec8f0, fog: [0xbfe6fa, 18, 60], hemi: [0xffffff, 0xf2d9b8, 1.35], sun: [0xfff6dc, 1.6, [2, 4, 3]],
    update: function (T) { wheel.rotation.z = T * 0.12; gond.forEach(function (b) { b.rotation.z = -wheel.rotation.z; }); bal.forEach(function (b, i) { b.position.y = 2.2 + Math.sin(T * 1.3 + i) * 0.06; }); } };
};

/* 6. ネオン街 */
S.neon = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#1a1226'; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(255,60,160,.16)'; x.fillRect(20, 0, 26, 128); x.fillStyle = 'rgba(60,200,255,.14)'; x.fillRect(80, 0, 30, 128); }, [6, 6]);
  const neon = [];
  const defs = [['CLUB\n王子', '#ff3d9a', -2.2, 2.6, -4, 1.3, 0.9], ['BAR', '#35d0ff', 2.3, 3.3, -4.5, 1.1, 0.5], ['カラオケ', '#ffe14a', 2.2, 2.2, -3.6, 1.3, 0.42], ['ラーメン', '#ff6a3a', -2.6, 1.5, -5.5, 1.0, 0.36],
    ['酒', '#7dff8a', 0, 4.4, -9, 0.9, 0.9], ['24H', '#ffffff', -1.4, 4.0, -7, 0.8, 0.4], ['ホスト\n募集中', '#c08bff', 1.3, 4.3, -6.5, 0.9, 0.7]];
  defs.forEach(function (d) { neon.push(sign(g, d[0], { w: d[5], h: d[6], bg: '#140a20', fg: d[1], border: d[1], p: [d[2], d[3], d[4]], glow: 1 })); });
  for (const s of [-1, 1]) { t.B(0x1c1430, [s * 4.2, 4, -5], [3.4, 8, 6]); t.B(0x231a3a, [s * 3.4, 3, -10], [3, 6, 4]);
    for (let i = 0; i < 10; i++) t.B([0xffe082, 0xff80ab, 0x80d8ff][i % 3], [s * 2.49, 1.2 + (i % 5) * 1.2, -3 - Math.floor(i / 5) * 2.2], [0.03, 0.5, 0.7], null, { basic: 1 }); }
  t.B(0x120c1e, [0, 5, -13], [14, 10, 1]);
  for (let i = 0; i < 14; i++) t.S([0xff3d9a, 0x35d0ff, 0xffe14a][i % 3], [-2.4 + i * 0.37, 3.75 - Math.sin(i / 13 * PI) * 0.4, -2.6], 0.05, null, { basic: 1 });
  t.C(0x333333, [-2.4, 1.9, -2.6], [0.03, 3.8, 0.03]); t.C(0x333333, [2.4, 1.9, -2.6], [0.03, 3.8, 0.03]);
  // 花輪(祝)
  t.C(0xffffff, [1.75, 0.8, -2.2], [0.02, 1.6, 0.02]); t.C(0xff80ab, [1.75, 1.75, -2.2], [0.42, 0.08, 0.42], [PI / 2, 0, 0]); t.C(0xffffff, [1.75, 1.75, -2.17], [0.26, 0.08, 0.26], [PI / 2, 0, 0]);
  sign(g, '祝', { w: 0.3, h: 0.3, bg: '#ffffff', fg: '#d81b60', p: [1.75, 1.75, -2.12] });
  return { bnd: { zMin: -3.2, xMax: 1.4 }, bg: 0x0b0618, fog: [0x1a0b2e, 9, 34], hemi: [0xff8fd0, 0x2a1840, 1.05], sun: [0xbfe8ff, 1.5, [-1, 3, 3]],
    update: function (T) { neon.forEach(function (n, i) { n.material.color.setScalar(Math.sin(T * (7 + i * 3) + i) > 0.93 ? 0.35 : 1); }); } };
};

/* 7. 竹林 */
S.chikurin = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#7d8f55'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 60; i++) { x.fillStyle = i % 2 ? '#6d7f48' : '#94a366'; x.fillRect(rnd(i) * 128, rnd(i + 80) * 128, 8, 5); } }, [14, 14]);
  const bam = [];
  for (let i = 0; i < 46; i++) {
    const s = i % 2 ? 1 : -1, x = s * (1.05 + rnd(i) * 6.5), z = -0.6 - rnd(i + 20) * 12, r = 0.045 + rnd(i + 40) * 0.035, c = [0x5c9a3c, 0x6fae48, 0x4c8532][i % 3];
    const b = grp(g, x, 0, z); add(b, G.cyl, c, [0, 4, 0], [r, 8, r]);
    for (let k = 1; k < 9; k++) add(b, G.cyl, 0x3f6f2a, [0, k * 0.9, 0], [r * 1.12, 0.025, r * 1.12]);
    for (let k = 0; k < 3; k++) add(b, G.cone, 0x7cbf52, [(rnd(i * 3 + k) - 0.5) * 0.9, 5.0 + k * 0.8, (rnd(i * 5 + k) - 0.5) * 0.6], [0.5, 0.9, 0.3], [0, 0, (rnd(i + k) - 0.5) * 1.6]);
    bam.push(b);
  }
  // 鳥居と石灯ろう
  for (const s of [-1, 1]) t.C(0xd32f2f, [s * 1.3, 1.6, -7.5], [0.11, 3.2, 0.11]); t.B(0xd32f2f, [0, 3.25, -7.5], [3.6, 0.2, 0.26]); t.B(0x222222, [0, 3.42, -7.5], [3.9, 0.12, 0.32]); t.B(0xd32f2f, [0, 2.7, -7.5], [3.0, 0.14, 0.16]);
  t.C(0x9e9e9e, [1.45, 0.4, -2.3], [0.09, 0.8, 0.09]); t.B(0x9e9e9e, [1.45, 0.95, -2.3], [0.3, 0.26, 0.3]); t.B(0xffe082, [1.45, 0.95, -2.14], [0.16, 0.14, 0.02], null, { basic: 1 }); t.K(0x8a8a8a, [1.45, 1.22, -2.3], [0.3, 0.26, 0.3]); t.B(0x8a8a8a, [1.45, 0.05, -2.3], [0.34, 0.1, 0.34]);
  [[-1.4, -1.9, 0.3], [-1.75, -2.3, 0.2], [2.2, -3.4, 0.4]].forEach(function (p) { t.S(0x8d8d85, [p[0], p[2] * 0.5, p[1]], [p[2] * 1.3, p[2], p[2]]); });
  for (let i = 0; i < 6; i++) t.S(0xffffff, [(rnd(i) - 0.5) * 12, 0.6 + rnd(i + 5), -5 - rnd(i + 2) * 6], [3, 0.5, 1], null, { basic: 1, a: 0.22 });
  return { bnd: { zMin: -4.5, xMax: 0.8 }, bg: 0xcfe8c8, fog: [0xcfe8c8, 5, 20], hemi: [0xf4ffe8, 0x5a6a3a, 1.3], sun: [0xfffbe0, 1.3, [1, 4, 2]],
    update: function (T) { bam.forEach(function (b, i) { b.rotation.z = Math.sin(T * 0.8 + i) * 0.025; }); } };
};

/* 8. 城の屋根(夜) */
S.shiro = function (g) {
  const t = tools(g);
  patPlane(g, 40, 14, [50, 14], function (x) { x.fillStyle = '#39424e'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#2b323c'; x.fillRect(0, 100, 128, 28); x.fillStyle = '#4a5562'; x.beginPath(); x.ellipse(64, 60, 60, 46, 0, 0, 7); x.fill(); }, [0, 0, -4], [-PI / 2, 0, 0]);
  t.B(0x1b2029, [0, -0.35, -11], [40, 0.7, 0.5]);
  add(g, G.circ, 0xfff2b0, [1.7, 5.2, -22], 3.0, null, { basic: 1 }); add(g, G.circ, 0xfff8d8, [1.7, 5.2, -22.1], 3.5, null, { basic: 1, a: 0.25 });
  const c = grp(g, -3.2, -2, -17);
  [[5, 3.4, 0], [3.9, 2.6, 3.4], [2.8, 2.2, 6]].forEach(function (d, i) { add(c, G.box, 0xdfe6ee, [0, d[2] + d[1] / 2, 0], [d[0], d[1], d[0] * 0.7]); const r = add(c, G.cone, 0x1e2a44, [0, d[2] + d[1] + 0.35, 0], [d[0] * 0.85, 0.9, d[0] * 0.65]); r.rotation.y = PI / 4;
    for (let k = 0; k < 3; k++) add(c, G.box, 0xffe082, [-d[0] * 0.25 + k * d[0] * 0.25, d[2] + d[1] * 0.5, d[0] * 0.351], [0.3, 0.45, 0.02], null, { basic: 1 }); });
  for (const s of [-1, 1]) { const f = grp(g, s * 1.75, 0.1, -1.6); add(f, G.sph, 0xf4c20d, [0, 0.3, 0], [0.16, 0.34, 0.26], [0.5, 0, 0]); add(f, G.cone, 0xf4c20d, [0, 0.72, -0.16], [0.14, 0.4, 0.07], [-0.5, 0, 0]); add(f, G.sph, 0xf4c20d, [0, 0.12, 0.14], 0.14); add(f, G.box, 0x39424e, [0, 0, 0], [0.4, 0.14, 0.5]); }
  t.B(0x2b323c, [0, 0.09, -2.4], [9, 0.18, 0.3]);
  for (let i = 0; i < 90; i++) t.S(0xffffff, [(rnd(i) - 0.5) * 44, 1 + rnd(i + 9) * 16, -24], 0.05 + rnd(i + 2) * 0.05, null, { basic: 1 });
  const cl = []; for (let i = 0; i < 4; i++) cl.push(t.S(0x39466a, [-8 + i * 5, 3.4 + rnd(i) * 3, -20], [3.5, 0.4, 1], null, { basic: 1, a: 0.7 }));
  for (let i = 0; i < 9; i++) t.B(0x101622, [-12 + i * 3 + rnd(i), -0.8 + rnd(i + 4) * 0.8, -14], [2.2, 1.6, 2]);
  return { bnd: { zMin: -1.9, xMax: 1.4 }, bg: 0x0a0f2a, fog: [0x0a0f2a, 16, 60], hemi: [0x9fb4ff, 0x1c2233, 1.0], sun: [0xdfe8ff, 1.5, [1, 3, 3]],
    update: function (T) { cl.forEach(function (m, i) { m.position.x = ((T * 0.25 + i * 6) % 24) - 12; }); } };
};

/* 9. ボクシングのリング */
S.ring = function (g) {
  const t = tools(g);
  patPlane(g, 7, 7, [1, 1], function (x) { x.fillStyle = '#4f8fd6'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, 26, 0, 7); x.stroke(); x.strokeRect(6, 6, 116, 116); }, [0, 0, -0.5], [-PI / 2, 0, 0]);
  t.B(0x1c2a55, [0, -0.5, -0.5], [7.4, 0.98, 7.4]); t.B(0x0c0c14, [0, -1, -6], [60, 0.1, 40]);
  [[-3.4, -3.9, 0xd32f2f], [3.4, -3.9, 0x1e63d0], [-3.4, 2.9, 0xffffff], [3.4, 2.9, 0xffffff]].forEach(function (p) { t.C(0xcfd8dc, [p[0], 0.8, p[1]], [0.07, 1.6, 0.07]); t.B(p[2], [p[0] * 0.97, 1.0, p[1] * 0.985 + 0.03], [0.24, 0.9, 0.24]); });
  const ropes = [];
  [0.55, 0.95, 1.35].forEach(function (y, i) { const c = [0xd32f2f, 0xffffff, 0x1e63d0][i];
    ropes.push(t.C(c, [0, y, -3.9], [0.028, 6.8, 0.028], [0, 0, PI / 2])); t.C(c, [-3.4, y, -0.5], [0.028, 6.8, 0.028], [PI / 2, 0, 0]); t.C(c, [3.4, y, -0.5], [0.028, 6.8, 0.028], [PI / 2, 0, 0]); });
  patPlane(g, 60, 9, [30, 4], function (x) { x.fillStyle = '#12121c'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { x.fillStyle = ['#3a3a4a', '#4a3a3a', '#3a4a40', '#55506a'][i % 4]; x.beginPath(); x.arc(rnd(i) * 128, rnd(i + 30) * 128, 9, 0, 7); x.fill(); } }, [0, 2.5, -11], null, true);
  for (const s of [-1, 0, 1]) { t.B(0x222222, [s * 3, 6.4, -5], [0.5, 0.3, 0.5]); t.K(0xfff6d0, [s * 2.2, 3.3, -3.5], [1.6, 6.4, 1.6], [0, 0, s * 0.2], { basic: 1, a: 0.05 }); t.S(0xffffff, [s * 3, 6.2, -5], 0.2, null, { basic: 1 }); }
  sign(g, '殴られ屋\n1分1000円', { w: 2.6, h: 1.0, bg: '#111', fg: '#ffd54f', border: '#ffd54f', p: [0, 4.3, -6], glow: 1 });
  t.B(0x5d4037, [-2.6, 0.25, -3.3], [0.34, 0.5, 0.34]); t.C(0x90a4ae, [2.7, 0.2, -3.3], [0.17, 0.4, 0.17]);
  return { bnd: { zMin: -3.2, xMax: 2.6 }, bg: 0x0c0c14, fog: [0x0c0c14, 12, 40], hemi: [0xffffff, 0x2a3a66, 1.1], sun: [0xfff8e8, 1.9, [0, 5, 2]],
    update: function (T) { ropes[0].position.z = -3.9 + Math.sin(T * 3) * 0.01; } };
};

/* 10. 野菜カット工場 */
S.kojo = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#9cc9a8'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 2; x.strokeRect(0, 0, 128, 128); }, [16, 16]);
  patPlane(g, 22, 4.2, [22, 5], function (x) { x.fillStyle = '#f7fbfc'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#c9d9de'; x.lineWidth = 5; x.strokeRect(0, 0, 128, 128); }, [0, 2.1, -6.2]);
  t.B(0x7fb3c8, [0, 0.5, -6.15], [22, 1.0, 0.06]); t.B(0xeef4f6, [0, 4.2, -3], [22, 0.06, 8]);
  for (let i = -1; i <= 1; i++) { t.B(0xffffff, [i * 2.6, 4.1, -2.4], [1.6, 0.05, 0.3], null, { basic: 1 }); }
  // ベルトコンベア(左右)と流れる野菜
  const veg = [];
  for (const s of [-1, 1]) {
    const x = s * 1.85; t.B(0x37474f, [x, 0.86, -3], [0.75, 0.06, 6.4]); t.B(0xb0bec5, [x - 0.4, 0.84, -3], [0.05, 0.14, 6.4]); t.B(0xb0bec5, [x + 0.4, 0.84, -3], [0.05, 0.14, 6.4]);
    for (let k = 0; k < 4; k++) { t.B(0x90a4ae, [x - 0.34, 0.42, -0.3 - k * 1.8], [0.06, 0.84, 0.06]); t.B(0x90a4ae, [x + 0.34, 0.42, -0.3 - k * 1.8], [0.06, 0.84, 0.06]); }
    for (let i = 0; i < 7; i++) { const v = grp(g, x + (rnd(i * 2 + s) - 0.5) * 0.3, 0.9, 0), kind = (i + (s > 0 ? 1 : 0)) % 3;
      if (kind === 0) { add(v, G.sph, 0x9ccc65, [0, 0.14, 0], [0.17, 0.15, 0.17]); add(v, G.sph, 0xc5e1a5, [0.02, 0.2, 0.03], [0.12, 0.09, 0.12]); }
      else if (kind === 1) { add(v, G.cone, 0xff8f00, [0, 0.05, 0], [0.05, 0.34, 0.05], [PI / 2, 0, 0.3]); add(v, G.cone, 0x43a047, [0, 0.05, -0.2], [0.04, 0.1, 0.04], [-PI / 2, 0, 0]); }
      else { add(v, G.cyl, 0xfafafa, [0, 0.07, 0], [0.065, 0.42, 0.065], [PI / 2, 0, 0.2]); add(v, G.cone, 0x66bb6a, [0, 0.07, -0.27], [0.06, 0.14, 0.06], [-PI / 2, 0, 0]); }
      v.userData.o = i / 7 + (s > 0 ? 0.07 : 0); v.userData.s = s; veg.push(v); }
    // カット機
    t.B(0xcfd8dc, [x, 1.45, -4.6], [0.95, 1.1, 0.9]); t.B(0x78909c, [x, 1.0, -4.12], [0.6, 0.22, 0.05]); t.S(s < 0 ? 0xef5350 : 0x66bb6a, [x + 0.3, 1.8, -4.14], 0.05, null, { basic: 1 });
  }
  // まん中うしろ: キャベツの大きな青いカゴ(ボスがつっこむ)
  t.B(0x1e88e5, [0, 0.36, -2.25], [1.25, 0.72, 0.9]); t.B(0x1565c0, [0, 0.74, -2.25], [1.33, 0.07, 0.98]);
  for (let i = 0; i < 9; i++) t.S(i % 3 ? 0x9ccc65 : 0xaed581, [-0.42 + (i % 3) * 0.42 + rnd(i) * 0.06, 0.78 + (i > 5 ? 0.12 : 0), -2.52 + Math.floor(i / 3) * 0.26], [0.2, 0.17, 0.2]);
  t.B(0xffd54f, [-0.95, 0.2, -2.9], [0.6, 0.4, 0.45]); t.B(0xffd54f, [-0.95, 0.62, -2.9], [0.6, 0.4, 0.45]); t.B(0xef6c00, [1.0, 0.2, -3.0], [0.6, 0.4, 0.45]);
  sign(g, '衛生第一', { w: 1.7, h: 0.42, bg: '#2e7d32', fg: '#fff', p: [0, 3.3, -6.12] });
  sign(g, '私語厳禁', { w: 1.0, h: 0.3, bg: '#fff', fg: '#c62828', border: '#c62828', p: [-2.3, 2.5, -6.12] });
  sign(g, '手洗い\nヨシ!', { w: 0.7, h: 0.7, bg: '#fff59d', fg: '#1b5e20', p: [2.3, 2.5, -6.12] });
  sign(g, 'ムダ口より\n手を動かせ', { w: 1.2, h: 0.5, bg: '#ffffff', fg: '#333', border: '#90a4ae', p: [0, 2.55, -6.12] });
  // ビニールのれんの出入り口
  t.B(0x455a64, [-4.2, 1.2, -6.1], [1.6, 2.4, 0.08]); for (let i = 0; i < 8; i++) t.B(0xc8f0ff, [-4.85 + i * 0.19, 1.15, -6.02], [0.17, 2.2, 0.01], null, { a: 0.45 });
  t.C(0xffffff, [4.0, 3.0, -6.12], [0.3, 0.03, 0.3], [PI / 2, 0, 0]); t.B(0x222222, [4.0, 3.1, -6.08], [0.02, 0.2, 0.01]); t.B(0x222222, [4.08, 3.0, -6.08], [0.16, 0.02, 0.01]);
  return { bnd: { zMin: -1.45, xMax: 1.3 }, bg: 0xeef6f8, fog: [0xeef6f8, 10, 34], hemi: [0xffffff, 0x9cc9a8, 1.4], sun: [0xffffff, 1.15, [0, 4, 3]],
    update: function (T) { veg.forEach(function (v) { const k = (v.userData.o + T * 0.09) % 1; v.position.z = -4.3 + k * 4.7; v.position.y = 0.9 + Math.abs(Math.sin(T * 9 + v.userData.o * 40)) * 0.006; }); } };
};

/* ひみつの部屋(殴りたい放題)。顔が画面いっぱいなので、うしろは ごほうびらしく きらきらに */
S.room = function (g) {
  const t = tools(g);
  t.floor(function (x) { x.fillStyle = '#3a1140'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#4a1a55'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64); }, [30, 30]);
  t.B(0x2a0c36, [0, 3, -3.2], [14, 8, 0.2]);
  sign(g, '殴りたい放題', { w: 3.4, h: 0.7, bg: '#2a0c36', fg: '#ff7ad1', border: '#ff7ad1', p: [0, 2.75, -3.05], glow: 1 });
  for (const s of [-1, 1]) { t.K(0xfff0a0, [s * 1.3, 2.4, -1.4], [1.1, 4.4, 1.1], [0, 0, s * 0.35], { basic: 1, a: 0.07 }); t.S(0xffffff, [s * 2.0, 4.4, -1.4], 0.16, null, { basic: 1 }); }
  const hearts = [];
  for (let i = 0; i < 26; i++) { const c = [0xff7ad1, 0xffe14a, 0x7ad0ff, 0xb388ff][i % 4], m = add(g, G.sph, c, [(rnd(i) - 0.5) * 5, rnd(i + 7) * 4, -0.8 - rnd(i + 3) * 2.2], 0.03 + rnd(i + 5) * 0.05, null, { basic: 1 }); m.userData.o = rnd(i + 11); hearts.push(m); }
  for (let i = 0; i < 9; i++) t.B([0xff7ad1, 0xffe14a, 0x7ad0ff][i % 3], [-2 + i * 0.5, 3.4 - Math.sin(i / 8 * PI) * 0.3, -3.0], [0.2, 0.26, 0.02], [0, 0, 0.3], { basic: 1 });
  return { bnd: { zMin: 0, xMax: 0 }, bg: 0x2a0c36, fog: [0x2a0c36, 6, 20], hemi: [0xffffff, 0x8a5a8a, 1.3], sun: [0xfff4e8, 1.5, [0.6, 1.2, 3]],
    update: function (T) { hearts.forEach(function (m, i) { m.position.y = ((m.userData.o * 4 + T * (0.25 + (i % 5) * 0.06)) % 4.2); m.position.x += Math.sin(T * 1.3 + i) * 0.0015; }); } };
};

export function buildStage(id) {
  const g = new THREE.Group();
  const spec = (S[id] || S.ring)(g);
  spec.group = g;
  g.traverse(function (m) { if (m.isMesh) m.matrixAutoUpdate = true; });
  return spec;
}
