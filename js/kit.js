/* 殴られ屋 — 立体を作るための小さな道具(形・色・看板の字) */
import * as THREE from '../vendor/three/three.module.js';
export { THREE };

const mats = {};
export function mat(color, opt) {
  if (color && color.isMaterial) return color;
  const key = color + '|' + (opt ? JSON.stringify(opt) : '');
  if (!mats[key]) mats[key] = opt && opt.basic
    ? new THREE.MeshBasicMaterial({ color: color, transparent: !!opt.a, opacity: opt.a || 1, side: opt.ds ? THREE.DoubleSide : THREE.FrontSide })
    : new THREE.MeshLambertMaterial({ color: color, emissive: (opt && opt.glow) || 0x000000, transparent: !!(opt && opt.a), opacity: (opt && opt.a) || 1,
      side: opt && opt.ds ? THREE.DoubleSide : THREE.FrontSide });
  return mats[key];
}

export const G = {
  sph: new THREE.SphereGeometry(1, 22, 16),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: new THREE.ConeGeometry(1, 1, 16),
  tor: new THREE.TorusGeometry(1, 0.22, 8, 20),
  plane: new THREE.PlaneGeometry(1, 1),
  circ: new THREE.CircleGeometry(1, 24),
  head: new THREE.SphereGeometry(1, 32, 24).rotateY(-Math.PI / 2)   // 顔の絵のまん中が 正面(+Z)に来る
};
Object.keys(G).forEach(function (k) { G[k].userData.shared = true; });

/* 形を1つ足す。add(親, 形, 色, [x,y,z], [sx,sy,sz], [rx,ry,rz]) */
export function add(parent, geo, color, p, s, r, opt) {
  const m = new THREE.Mesh(geo, mat(color, opt));
  if (p) m.position.set(p[0], p[1], p[2]);
  if (s) { if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(s[0], s[1], s[2]); }
  if (r) m.rotation.set(r[0], r[1], r[2]);
  parent.add(m);
  return m;
}
export function grp(parent, x, y, z) {
  const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g;
}

export const JF = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Meiryo","Noto Sans JP",system-ui,sans-serif';

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
/* 字の看板。sign(親, '字', {w,h(メートル), bg, fg, p, r, glow}) */
export function sign(parent, text, o) {
  o = o || {};
  const W = o.w || 1, H = o.h || 0.4, px = 256, py = Math.max(32, Math.round(px * H / W));
  const lines = String(text).split('\n');
  const t = canvasTex(px, py, function (x) {
    x.fillStyle = o.bg || '#fff'; x.fillRect(0, 0, px, py);
    if (o.border) { x.strokeStyle = o.border; x.lineWidth = 8; x.strokeRect(4, 4, px - 8, py - 8); }
    x.fillStyle = o.fg || '#111'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = Math.min(py / lines.length * 0.72, px / Math.max.apply(null, lines.map(function (l) { return l.length; })) * 0.92);
    x.font = '900 ' + fs + 'px ' + JF;
    lines.forEach(function (l, i) { x.fillText(l, px / 2, py * (i + 0.5) / lines.length + fs * 0.04); });
  });
  const m = new THREE.Mesh(G.plane, o.glow
    ? new THREE.MeshBasicMaterial({ map: t })
    : new THREE.MeshLambertMaterial({ map: t }));
  m.scale.set(W, H, 1);
  if (o.p) m.position.set(o.p[0], o.p[1], o.p[2]);
  if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
  m.userData.tex = t;
  parent.add(m);
  return m;
}
/* 模様つきの板(床・壁) */
export function patPlane(parent, w, h, rep, draw, p, r, basic) {
  const t = canvasTex(128, 128, draw);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  const m = new THREE.Mesh(G.plane, basic ? new THREE.MeshBasicMaterial({ map: t }) : new THREE.MeshLambertMaterial({ map: t }));
  m.scale.set(w, h, 1);
  if (p) m.position.set(p[0], p[1], p[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  m.userData.tex = t;
  parent.add(m);
  return m;
}
/* 片づけ(その場で作った形と絵だけ捨てる。共通の形は残す) */
export function dispose(obj) {
  obj.traverse(function (o) {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    if (o.userData && o.userData.tex) { o.userData.tex.dispose(); if (o.material && o.material.dispose) o.material.dispose(); }
    if (o.isSprite && o.material) o.material.dispose();
  });
  if (obj.parent) obj.parent.remove(obj);
}
export const clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
export const lerp = function (a, b, t) { return a + (b - a) * t; };
export const ease = {
  out: function (t) { return 1 - (1 - t) * (1 - t); },
  out3: function (t) { return 1 - Math.pow(1 - t, 3); },
  in2: function (t) { return t * t; },
  io: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  bounce: function (t) { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; }
};
/* k が a〜b の間を 0〜1 に */
export function seg(k, a, b) { return clamp((k - a) / (b - a), 0, 1); }
