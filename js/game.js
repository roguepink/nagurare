/* 殴られ屋 — ゲーム本体(画面の流れ・殴る・よける・ダウン・気持ちよさの演出) */
import { THREE, G, add, grp, canvasTex, dispose, clamp, lerp, ease } from './kit.js';
import { CHARS, buildChar, disposeChar } from './chars.js';
import { buildStage } from './stages.js';
import { SFX } from './sfx.js';

const $ = function (id) { return document.getElementById(id); };
const PI = Math.PI;
const rand = function (a, b) { return a + Math.random() * (b - a); };
const pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
const HASH = location.hash || '';
const AUTO = /auto/.test(HASH), autoQ = [], AUTO_LAG = (function () { const m = /lag=(\d+)/.exec(HASH); return m ? +m[1] / 1000 : 0.22; })();
const CFG = { TIME: 60, T_OUT: 0.085, T_BACK: 0.13, REACH: -0.6, BEST_KEY: 'nagurare-best-v1', HEAD_PT: 7, BODY_PT: 4 };
const WORDS = { head: ['バキッ!', 'ゴッ!', 'パァン!', 'ドゴッ!', 'ベチン!', 'ガツン!', 'バチーン!'], body: ['ボスッ', 'ドスッ', 'ボコッ', 'ズン', 'ドムッ', 'ボフッ'] };
const CARD_BG = { shokudo: 0xf6d9a8, konbini: 0x26346e, washitsu: 0xcfd79a, office: 0xb9c7d6, yuenchi: 0x8fd3f6, neon: 0x3a1a5a, chikurin: 0xa9d39a, shiro: 0x1a2550, ring: 0x2a3f7a, kojo: 0xd9eef2 };

function fail() { $('select').classList.add('hidden'); $('nogl').classList.remove('hidden'); window.__booted = true; }

function main() {
  const canvas = $('gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { fail(); return; }
  if (!renderer.getContext()) { fail(); return; }
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 90);
  scene.add(camera);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 1.2), sun = new THREE.DirectionalLight(0xffffff, 1.3);
  scene.add(hemi); scene.add(sun);
  const shadow = new THREE.Mesh(G.circ, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  shadow.rotation.x = -PI / 2; scene.add(shadow);

  let HXMAX = 0.5, LOOKY = 1.17, W = 1, H = 1, XMAX = 0.4, camBase = new THREE.Vector3(0, 1.42, 2.9), baseFov = 60;
  const restPos = [new THREE.Vector3(), new THREE.Vector3()], shoulder = [new THREE.Vector3(), new THREE.Vector3()];

  /* ---------- 状態 ---------- */
  const S = { state: 'select', ci: -1, R: null, stage: null, stageId: '', ai: null, time: CFG.TIME, hits: 0, combo: 0, comboT: 0, maxCombo: 0, downs: 0, gauge: 0, lastHit: 9,
    hitstop: 0, slow: 0, shake: 0, fovKick: 0, flash: 0, T: 0, readyT: 0, finT: 0, prev: '', plays: 0, headScr: [0, 0, 40], sayT: 0, autoT: 0, heads: 0 };
  let best = {};
  try { best = JSON.parse(localStorage.getItem(CFG.BEST_KEY) || '{}') || {}; } catch (e) {}
  const portraits = [];

  /* ---------- 粒と当たりの光 ---------- */
  function ptex(kind) {
    return canvasTex(64, 64, function (x) {
      x.translate(32, 32);
      const soft = function (c) { const g = x.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-32, -32, 64, 64); };
      const star = function (n, r1, r2, c) { x.fillStyle = c; x.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * PI / n - PI / 2, r = i % 2 ? r2 : r1; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); };
      if (kind === 'sweat') { x.fillStyle = '#8fdcff'; x.beginPath(); x.moveTo(0, -24); x.quadraticCurveTo(20, 6, 0, 22); x.quadraticCurveTo(-20, 6, 0, -24); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(-5, 6, 4, 0, 7); x.fill(); }
      else if (kind === 'star') { star(5, 28, 12, '#ffe14a'); x.strokeStyle = '#17102b'; x.lineWidth = 3; x.stroke(); }
      else if (kind === 'dust') soft('rgba(214,196,170,.95)');
      else if (kind === 'smoke') soft('rgba(255,255,255,.95)');
      else if (kind === 'petal') { x.fillStyle = '#ff6fa5'; x.beginPath(); x.ellipse(0, 0, 22, 12, 0.5, 0, 7); x.fill(); }
      else if (kind === 'leaf') { x.fillStyle = '#8bc34a'; x.beginPath(); x.ellipse(0, 0, 26, 15, 0.4, 0, 7); x.fill(); x.strokeStyle = '#558b2f'; x.lineWidth = 3; x.beginPath(); x.moveTo(-20, -8); x.lineTo(20, 8); x.stroke(); }
      else if (kind === 'paper') { x.fillStyle = '#fff'; x.fillRect(-18, -24, 36, 48); x.fillStyle = '#9aa'; for (let i = 0; i < 5; i++) x.fillRect(-12, -16 + i * 8, 24, 2); }
      else if (kind === 'soul') { x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.arc(0, -4, 20, PI, 0); x.lineTo(20, 22); x.lineTo(10, 14); x.lineTo(0, 24); x.lineTo(-10, 14); x.lineTo(-20, 22); x.closePath(); x.fill(); x.fillStyle = '#334'; x.fillRect(-10, -8, 5, 8); x.fillRect(5, -8, 5, 8); }
      else if (kind === 'twinkle') { star(4, 30, 5, '#fffbe0'); }
      else if (kind === 'impact') { star(9, 31, 13, '#ffffff'); star(9, 22, 9, '#ffe14a'); }
    });
  }
  const PT = {}; ['sweat', 'star', 'dust', 'smoke', 'petal', 'leaf', 'paper', 'soul', 'twinkle', 'impact'].forEach(function (k) { PT[k] = ptex(k); });
  const parts = [];
  for (let i = 0; i < 80; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.star, transparent: true, depthWrite: false })); sp.visible = false; sp.renderOrder = 5; scene.add(sp); parts.push({ sp: sp, life: 0, max: 1, v: new THREE.Vector3(), g: 0, size: 0.1, grow: 0, spin: 0 }); }
  function spawn(kind, x, y, z, vx, vy, vz, life, size, g, grow, spin) {
    let p = null; for (let i = 0; i < parts.length; i++) if (parts[i].life <= 0) { p = parts[i]; break; }
    if (!p) return;
    p.sp.material.map = PT[kind]; p.sp.material.opacity = 1; p.sp.material.rotation = Math.random() * 6; p.sp.position.set(x, y, z); p.sp.visible = true;
    p.v.set(vx, vy, vz); p.life = p.max = life; p.size = size; p.g = g || 0; p.grow = grow || 0; p.spin = spin || 0; p.sp.scale.setScalar(size);
  }
  function burst(kind, n, o) {
    const x = o[0] + (S.R ? S.R.body.position.x * (Math.abs(o[2]) < 1.5 ? 1 : 0) : 0), y = o[1], z = o[2];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * PI * 2, r = Math.random();
      if (kind === 'dust' || kind === 'smoke') spawn(kind, x + Math.cos(a) * 0.2, y + r * 0.3, z + Math.sin(a) * 0.2, Math.cos(a) * 1.3 * r, 0.3 + r * 0.6, Math.sin(a) * 0.6, 0.55 + r * 0.3, kind === 'smoke' ? 0.34 : 0.3, 0, 1.3, 0);
      else if (kind === 'star') spawn(kind, x, y, z, Math.cos(a) * 2.4, 1.5 + r * 2.5, Math.sin(a) * 1.2, 0.75, 0.17, -7, 0, 6);
      else if (kind === 'sweat') spawn(kind, x, y, z, Math.cos(a) * 1.8, 1.2 + r * 2.4, 0.5 + r, 0.45, 0.085, -9, 0, 0);
      else if (kind === 'soul') spawn(kind, x, y, z, 0, 0.75, 0, 1.7, 0.42, 0, 0, 0);
      else if (kind === 'twinkle') spawn(kind, x, y, z, 0, 0, 0, 0.55, 0.1, 0, 2.6, 3);
      else spawn(kind, x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.4, z, Math.cos(a) * 1.6, 1.2 + r * 2.6, Math.sin(a) * 1.0, 1.5 + r * 0.5, kind === 'paper' ? 0.19 : 0.13, -3.2, 0, (Math.random() - 0.5) * 12);
    }
  }
  function updateParts(dt) {
    for (let i = 0; i < parts.length; i++) { const p = parts[i]; if (p.life <= 0) continue;
      p.life -= dt; if (p.life <= 0) { p.sp.visible = false; continue; }
      p.v.y += p.g * dt; p.sp.position.addScaledVector(p.v, dt); if (p.sp.position.y < 0.03 && p.g) { p.sp.position.y = 0.03; p.v.set(0, 0, 0); }
      const k = p.life / p.max; p.sp.material.opacity = Math.min(1, k * 2.2); p.sp.material.rotation += p.spin * dt; p.sp.scale.setScalar(p.size * (1 + p.grow * (1 - k))); }
  }
  const impacts = [];
  for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.impact, transparent: true, depthTest: false, depthWrite: false })); sp.visible = false; sp.renderOrder = 9; scene.add(sp); impacts.push({ sp: sp, t: 1 }); }
  function impactFx(v, big) { let m = impacts[0]; for (let i = 1; i < impacts.length; i++) if (impacts[i].t > m.t) m = impacts[i]; m.t = 0; m.big = big ? 1.5 : 1; m.sp.position.copy(v); m.sp.material.rotation = Math.random() * 6; m.sp.visible = true; }

  /* ---------- 画面の字(バキッ!・ふきだし・大きな字) ---------- */
  const pops = $('pops');
  function pop(text, cls, x, y) {
    while (pops.childElementCount > 11) pops.removeChild(pops.firstChild);
    const d = document.createElement('div'); d.className = 'pop ' + cls; d.textContent = text;
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.setProperty('--r', (Math.random() * 30 - 15) + 'deg');
    d.addEventListener('animationend', function () { if (d.parentNode) d.parentNode.removeChild(d); });
    pops.appendChild(d);
  }
  const bigEl = $('big'), bubble = $('bubble');
  function big(text, cls) { bigEl.className = 'stroke'; bigEl.textContent = text; void bigEl.offsetWidth; bigEl.className = 'stroke go ' + (cls || ''); }
  function say(text, sec) { if (S.state !== 'play' && S.state !== 'ready') return; bubble.textContent = text; bubble.className = 'on' + (S.R && S.R.def.boss ? ' boss' : ''); S.sayT = sec || 1.5; }
  function vib(p) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) {} }
  const FX = {
    shake: function (a) { S.shake = Math.max(S.shake, a); },
    snd: function (n) { if (SFX[n]) SFX[n](); },
    text: function (t) { pop(t, 'head', W / 2 + rand(-20, 20), H * 0.44 + rand(-14, 14)); },
    count: function (n) { big(String(n), 'yel'); },
    say: function (t) { say(t, 1.7); },
    burst: burst
  };

  /* ---------- グローブ(画面の下から飛び出す自分の手) ---------- */
  const gl = [];
  for (const s of [-1, 1]) {
    const g = grp(camera);
    add(g, G.sph, 0xe21f26, [0, 0, 0], [0.078, 0.088, 0.1]);
    add(g, G.sph, 0xc5161d, [-s * 0.066, -0.015, -0.02], [0.036, 0.048, 0.06]);
    add(g, G.sph, 0xff6b6b, [s * 0.025, 0.05, -0.06], [0.03, 0.02, 0.04]);
    add(g, G.cyl, 0xffffff, [0, 0, 0.11], [0.062, 0.08, 0.062], [PI / 2, 0, 0]);
    add(g, G.cyl, 0xe21f26, [0, 0, 0.17], [0.058, 0.04, 0.058], [PI / 2, 0, 0]);
    add(g, G.cyl, 0xf0c29a, [0, 0, 1.39], [0.034, 2.4, 0.04], [PI / 2, 0, 0]);
    g.traverse(function (m) { if (m.isMesh) m.frustumCulled = false; });
    gl.push({ g: g, s: s, t: -1, done: true, sx: 0, sy: 0, tgt: new THREE.Vector3(), world: new THREE.Vector3(), pos: new THREE.Vector3() });
  }
  const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), FWD = new THREE.Vector3(0, 0, -1);
  function updateGloves(dt) {
    for (let i = 0; i < 2; i++) { const g = gl[i]; let f = 0;
      if (g.t >= 0) {
        g.t += dt;
        if (!g.done && g.t >= CFG.T_OUT) { g.done = true; impact(g); }
        if (g.t < CFG.T_OUT) f = ease.out(g.t / CFG.T_OUT);
        else { const k = (g.t - CFG.T_OUT) / CFG.T_BACK; if (k >= 1) { g.t = -1; f = 0; } else f = 1 - ease.io(k); }
      }
      _v.copy(restPos[i]); _v.y += Math.sin(S.T * 2.6 + i * 2) * 0.008;
      g.pos.copy(_v).lerp(g.tgt, f);
      g.g.position.copy(g.pos);
      _v2.copy(g.pos).sub(shoulder[i]).normalize(); _q.setFromUnitVectors(FWD, _v2); g.g.quaternion.copy(_q);
      g.g.scale.setScalar(1 + f * 0.45);
    }
  }
  function toScreen(v) { _p.copy(v).project(camera); return [(_p.x * 0.5 + 0.5) * W, (-_p.y * 0.5 + 0.5) * H]; }
  function scrR(v, r) { const a = toScreen(v); _v2.copy(v); _v2.x += r; const b = toScreen(_v2); return [a[0], a[1], Math.abs(b[0] - a[0])]; }

  /* 当たる場所(顔・胸・腹)を画面の上の丸で返す */
  function volumes() {
    const R = S.R, out = [];
    if (!R || !R.body.visible) return out;
    R.hc.getWorldPosition(_v); if (_v.z > CFG.REACH && _v.z < 1.6) { const a = scrR(_v, R.hr * 1.12); out.push({ kind: 'head', x: a[0], y: a[1], r: a[2], tol: 12 }); }
    const w = R.def.w, bl = 1 + 0.15 * (R.def.belly || 0);
    _v.set(0, R.T * 0.55, 0); R.hips.localToWorld(_v); if (_v.z > CFG.REACH && _v.z < 1.6) { const a = scrR(_v, 0.25 * w * bl); out.push({ kind: 'body', x: a[0], y: a[1], r: a[2], tol: 6 }); }
    _v.set(0, R.T * 0.14, 0); R.hips.localToWorld(_v); if (_v.z > CFG.REACH && _v.z < 1.6) { const a = scrR(_v, 0.23 * w * bl); out.push({ kind: 'body', x: a[0], y: a[1], r: a[2], tol: 6 }); }
    return out;
  }

  function punch(sx, sy) {
    if (S.state !== 'play' || !S.R) return;
    let i = sx < W / 2 ? 0 : 1;
    if (gl[i].t >= 0) { if (gl[1 - i].t < 0) i = 1 - i; else i = gl[0].t > gl[1].t ? 0 : 1; }
    const g = gl[i];
    if (g.t >= 0 && !g.done) { g.done = true; impact(g); }
    // タップした所へ まっすぐ飛ばす(相手の手前の面まで)
    _p.set(sx / W * 2 - 1, -(sy / H * 2 - 1), 0.5).unproject(camera);
    camera.getWorldPosition(_v); _p.sub(_v).normalize();
    const pz = clamp(S.R.body.position.z, -0.2, 0.3) + 0.2, k = (pz - _v.z) / _p.z;
    g.world.copy(_v).addScaledVector(_p, k);
    g.tgt.copy(g.world); camera.worldToLocal(g.tgt);
    g.t = 0; g.done = false; g.sx = sx; g.sy = sy;
    SFX.whoosh();
    // 相手が気づいて よける
    const A = S.ai, ai = S.R.def.ai;
    if (A.mode === 'idle' && A.stun <= 0 && A.cd <= 0 && !A.dodge && !A.pend && ai.moves.length && Math.random() < ai.p) A.pend = { t: rand(ai.react[0], ai.react[1]), x: g.world.x };
  }
  function impact(g) {
    if (S.state !== 'play') return;
    const vs = volumes(); let hit = null;
    for (let i = 0; i < vs.length; i++) { const v = vs[i]; if (Math.hypot(g.sx - v.x, g.sy - v.y) < v.r + v.tol) { hit = v; break; } }
    if (hit) onHit(hit.kind, g); else onMiss(g);
  }
  function onHit(kind, g) {
    const R = S.R, A = S.ai, d = R.def, head = kind === 'head', side = g.s;
    S.hits++; S.combo++; S.comboT = 1.25; S.lastHit = 0; if (S.combo > S.maxCombo) S.maxCombo = S.combo; if (head) S.heads++;
    S.hitstop = head ? 0.042 : 0.026; S.shake = Math.max(S.shake, head ? 0.75 : 0.45); S.fovKick = Math.min(5, S.fovKick + (head ? 2.2 : 1.2)); if (head) S.flash = 0.16;
    A.hitT = 0.24; A.stun = Math.max(A.stun, d.ai.stun); A.smug = 0;
    if (head) { R.hs.vx -= 10; R.hs.vz += -side * rand(4, 8); R.flail = Math.max(R.flail, 0.55); } else { R.bs.vx += 5.5; R.hs.vx += 4; }
    R.bs.vz -= head ? 1.6 : 2.4; R.wob = Math.min(2, R.wob + (head ? 0.5 : 1));
    impactFx(g.world, head); burst(head ? 'sweat' : 'star', head ? 4 : 2, [g.world.x - R.body.position.x, g.world.y, g.world.z]);
    pop(pick(WORDS[kind]), kind, g.sx + rand(-26, 26), g.sy + rand(-30, 6));
    SFX.punch(head, S.combo); if (Math.random() < 0.3) SFX.grunt(d.voice);
    vib(head ? 22 : 12);
    if (A.mode !== 'down') {
      S.gauge += head ? CFG.HEAD_PT : CFG.BODY_PT;
      if (Math.random() < 0.07) say(pick(d.ouch), 0.9);
      if (S.gauge >= d.tough) startDown();
    } else { R.ovKick = 1; }
    const th = [20, 60, 120]; for (let i = 0; i < 3; i++) if (S.heads === th[i]) { R.bumps[i].visible = true; R.bumps[i].userData.k = 0.01; SFX.pop(); }
    const hEl = $('hits'); hEl.firstChild.nodeValue = String(S.hits); hEl.classList.remove('bump'); void hEl.offsetWidth; hEl.classList.add('bump');
    const cEl = $('combo');
    if (S.combo >= 3) { cEl.innerHTML = '<b>' + S.combo + '</b> コンボ'; cEl.className = 'stroke on'; if (S.combo % 5 === 0) { void cEl.offsetWidth; cEl.className = 'stroke on bump'; } }
    if ([10, 20, 30, 50, 75, 100, 150, 200, 300].indexOf(S.combo) >= 0) { big(S.combo + ' コンボ!', 'yel'); SFX.combo(S.combo / 10); }
  }
  function onMiss(g) {
    const A = S.ai;
    S.combo = 0; $('combo').className = 'stroke';
    const dodged = !!A.dodge || A.hidden;
    pop(dodged ? pick(['ひらり', 'スカッ', 'ひょい', 'するり']) : 'スカッ', 'miss', g.sx, g.sy);
    SFX.miss();
    if (dodged) { A.smug = 0.8; if (Math.random() < 0.28 && S.sayT <= 0) say(pick(S.R.def.lines), 1.3); }
  }

  /* ---------- 相手の動き ---------- */
  function resetFoe() {
    const R = S.R;
    R.P = { x: 0, crouch: 0, lean: 0, bend: 0, z: 0, twist: 0, jump: 0 };
    R.ov = {}; R.hs = { x: 0, z: 0, vx: 0, vz: 0 }; R.bs = { x: 0, vx: 0, z: 0, vz: 0 }; R.wob = 0; R.flail = 0; R.ovKick = 0;
    R.bumps.forEach(function (b) { b.visible = false; b.scale.setScalar(0.001); b.userData.k = 0; });
    S.ai = { t: Math.random() * 10, stepX: 0, stepT: 1, dodge: null, cd: 0, stun: 0, pend: null, hidden: false, tauntT: rand(1.2, 2.5), smug: 0, hitT: 0, mode: 'idle', downT: 0, st: null, expr: '' };
    endDownClean();
  }
  function endDownClean() {
    const R = S.R; if (!R) return;
    if (R.acc.inner) R.acc.inner.visible = false; if (R.acc.log) R.acc.log.visible = false;
    if (R.acc.cap) { R.acc.cap.position.set(0, 0, 0); R.acc.cap.rotation.set(0, 0, 0); }
  }
  function startDown() {
    const A = S.ai; A.mode = 'down'; A.downT = 0; A.st = {}; A.dodge = null; A.pend = null; A.hidden = false; S.R.P.twist = 0;
    S.downs++; S.gauge = 0; S.slow = 0.5; S.shake = 1.6; S.flash = 0.3; S.fovKick = 6;
    SFX.down(); big('ダウン!!', 'red'); vib([30, 40, 70]);
  }
  function startDodge(pend) {
    const R = S.R, ai = R.def.ai, A = S.ai, P = R.P, type = pick(ai.moves);
    R.hc.getWorldPosition(_v);
    const D = A.dodge = { type: type, t: 0, dur: ai.hold * (type === 'jump' ? 1.6 : type === 'warp' ? 1.5 : type === 'spin' ? 1.3 : 1), dir: pend.x >= _v.x ? -1 : 1 };
    A.cd = ai.cd + D.dur;
    if (type === 'step' || type === 'spin' || type === 'warp') { const side = P.x > 0 ? -1 : 1; A.stepX = side * XMAX * rand(0.55, 1); D.dir = side; A.stepT = rand(0.8, 1.6); }
    if (type === 'warp') { burst('smoke', 8, [0, 1.0, 0.1]); SFX.poof(); A.hidden = true; P.x = A.stepX; }
    else SFX.dodge();
  }
  const OV0 = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, c: 0, arms: 0, kick: 0, crouch: 0, bend: 0, headUp: 0, headRy: 0, headRz: 0, hide: false, expr: null };
  const TG = { x: 0, crouch: 0, lean: 0, bend: 0, z: 0, twist: 0, jump: 0 };
  function updateFoe(dt) {
    const R = S.R, d = R.def, ai = d.ai, A = S.ai, P = R.P, ov = R.ov, T = TG, playing = S.state === 'play';
    const t = (A.t += dt);
    for (const k in OV0) ov[k] = OV0[k];
    T.x = T.crouch = T.lean = T.bend = T.z = T.jump = 0;
    A.cd -= dt; A.stun -= dt; A.smug -= dt; A.hitT -= dt;
    if (A.mode === 'down') {
      A.downT += dt; const k = A.downT / d.downT;
      if (k >= 1) { A.mode = 'idle'; A.stun = 0.25; A.tauntT = rand(1.5, 3); endDownClean(); } else d.down(R, k, FX, A.st);
    } else {
      if (ai.step) { A.stepT -= dt; if (A.stepT <= 0 && !A.dodge) { A.stepX = rand(-1, 1) * XMAX * ai.step[0]; A.stepT = rand(ai.step[1], ai.step[2]); } }
      const sw = Math.sin(t * ai.sway[1]);
      T.x = A.stepX + ai.sway[0] * sw; T.lean = -sw * ai.sway[0] * 0.6;
      if (ai.bob) T.crouch = ai.bob[0] * (0.5 + 0.5 * Math.sin(t * ai.bob[1]));
      if (ai.hop) T.jump = ai.hop[0] * Math.abs(Math.sin(t * ai.hop[1]));
      if (ai.drunk) { T.lean += Math.sin(t * 1.3) * 0.16; T.bend = Math.sin(t * 0.9) * 0.14; }
      if (playing && A.pend) { A.pend.t -= dt; if (A.pend.t <= 0) { const p = A.pend; A.pend = null; if (A.stun <= 0) startDodge(p); } }
      if (A.dodge) {
        const D = A.dodge; D.t += dt; const k = D.t / D.dur;
        if (k >= 1) { A.dodge = null; if (A.hidden) { A.hidden = false; burst('smoke', 6, [0, 1.0, 0.1]); } P.twist = 0; }
        else if (D.type === 'duck') { T.crouch = 0.3; T.bend = 1.0; }
        else if (D.type === 'slip') { T.lean += -D.dir * 0.36; T.x += D.dir * 0.07; }
        else if (D.type === 'back') { T.z = -1.0; T.bend = -0.35; }
        else if (D.type === 'step') { T.lean += -D.dir * 0.15; }
        else if (D.type === 'jump') { T.jump = Math.sin(k * PI) * 1.1; }
        else if (D.type === 'spin') { P.twist = ease.io(k) * PI * 2; T.lean += -D.dir * 0.2; }
        else if (D.type === 'warp') { if (k > 0.7 && A.hidden) { A.hidden = false; burst('smoke', 8, [0, 1.0, 0.1]); } }
      }
      if (playing) { A.tauntT -= dt; if (A.tauntT <= 0) { if (S.sayT <= 0 && A.stun <= 0) { say(pick(d.lines)); A.smug = 1.3; } A.tauntT = ai.nag ? rand(2.2, 3.8) : rand(3.5, 6.5); } }
    }
    T.x = clamp(T.x, -XMAX, XMAX);
    { const hx = T.x - Math.sin(T.lean) * 1.4; T.x -= hx - clamp(hx, -HXMAX, HXMAX); }   // 頭が画面の外に出ないように
    const q = 1 - Math.exp(-ai.quick * (A.dodge ? 1.6 : 1) * (A.stun > 0 ? 0.4 : 1) * dt);
    P.x += (T.x - P.x) * q; P.crouch += (T.crouch - P.crouch) * q; P.lean += (T.lean - P.lean) * q; P.bend += (T.bend - P.bend) * q; P.z += (T.z - P.z) * q; P.jump = T.jump;
    // ばね(頭・体のゆれ)
    const hs = R.hs, bs = R.bs;
    hs.vx += (-260 * hs.x - 13 * hs.vx) * dt; hs.x += hs.vx * dt; hs.vz += (-260 * hs.z - 13 * hs.vz) * dt; hs.z += hs.vz * dt;
    bs.vx += (-200 * bs.x - 16 * bs.vx) * dt; bs.x += bs.vx * dt; bs.vz += (-130 * bs.z - 13 * bs.vz) * dt; bs.z += bs.vz * dt;
    hs.x = clamp(hs.x, -1.1, 0.9); hs.z = clamp(hs.z, -0.9, 0.9); bs.x = clamp(bs.x, -0.4, 0.7); bs.z = clamp(bs.z, -0.5, 0.2);
    R.wob *= Math.exp(-5 * dt); R.flail *= Math.exp(-5 * dt); R.ovKick *= Math.exp(-6 * dt);
    // 体に当てはめる
    R.body.visible = !(ov.hide || A.hidden);
    let x = P.x + ov.x, y = P.jump + ov.y, z = P.z + ov.z + bs.z;
    const rx = ov.rx, rz = P.lean + ov.rz;
    if (ov.c) { y += ov.c * (1 - Math.cos(rx)) + ov.c * (1 - Math.cos(ov.rz)); z += -ov.c * Math.sin(rx); x += ov.c * Math.sin(ov.rz); }
    if (R.ovKick > 0.01) { x += Math.sin(t * 70) * 0.03 * R.ovKick; }
    R.body.position.set(x, y, z); R.body.rotation.set(rx, P.twist + ov.ry, rz);
    const cr = clamp(P.crouch + ov.crouch, 0, R.L * 0.6);
    R.hips.position.y = R.L - cr; R.hips.rotation.set(P.bend + ov.bend + bs.x, 0, 0);
    const ws = Math.sin(t * 40) * 0.07 * R.wob * (d.jig || 1); R.hips.scale.set(1 + ws, 1 - ws * 0.8, 1 + ws);
    for (let i = 0; i < 2; i++) { const lg = R.legs[i]; lg.position.y = R.L - cr; lg.scale.y = (R.L - cr) / R.L; lg.rotation.x = ov.kick ? Math.sin(t * 30 + i * PI) * 0.75 * ov.kick : 0; }
    R.head.position.y = R.T + 0.05 + ov.headUp; R.head.rotation.set(hs.x + Math.sin(t * 1.7) * 0.03, ov.headRy, hs.z + ov.headRz);
    const fl = Math.max(ov.arms, R.flail), talk = (d.ai.nag && S.sayT > 0 && A.mode === 'idle') ? 1 : 0;
    for (let i = 0; i < 2; i++) { const a = R.arms[i], p = d.arms[i];
      let ux = lerp(p.ux, -2.5, fl * 0.85) + Math.sin(t * 28 + i * 2) * 0.5 * fl, uz = p.uz + fl * 0.7, fx = lerp(p.fx, -0.3, fl), fz = p.fz * (1 - fl);
      if (talk && i === 1) { ux = -1.25; uz = 0.15; fx = -1.2 + Math.sin(t * 16) * 0.35; fz = 0; }
      a.sh.rotation.set(ux, 0, a.s * uz); a.el.rotation.set(fx, 0, a.s * fz); }
    for (let i = 0; i < 3; i++) { const b = R.bumps[i]; if (b.visible && b.userData.k < 1) { b.userData.k = Math.min(1, b.userData.k + dt * 5); b.scale.setScalar(ease.out(b.userData.k) * (1 + Math.sin(b.userData.k * PI) * 0.6)); } }
    shadow.position.set(x, 0.012, clamp(z, -9, 1)); const ss = 0.42 * d.w / (1 + y * 0.7); shadow.scale.set(ss, ss * 0.6, 1); shadow.visible = R.body.visible && y < 5;
    // 顔
    const ex = A.mode === 'down' ? (ov.expr || 'dizzy') : A.hitT > 0 ? 'hit' : (S.gauge > d.tough * 0.86 && playing) ? 'dizzy' : A.smug > 0 ? 'smug' : 'idle';
    if (ex !== A.expr) { A.expr = ex; R.faceMat.map = R.tex[ex]; }
    // ふきだしの位置
    R.hc.getWorldPosition(_v); const hsr = scrR(_v, R.hr); S.headScr[0] = hsr[0]; S.headScr[1] = hsr[1]; S.headScr[2] = hsr[2];
  }

  /* ---------- 相手と背景を用意する ---------- */
  function loadChar(i) {
    if (S.ci === i && S.R) { resetFoe(); return; }
    if (S.R) disposeChar(S.R);
    const d = CHARS[i]; S.ci = i; S.R = buildChar(d); scene.add(S.R.root);
    if (S.stageId !== d.stage) {
      if (S.stage) dispose(S.stage.group);
      const st = S.stage = buildStage(d.stage); S.stageId = d.stage; scene.add(st.group);
      scene.background = new THREE.Color(st.bg); scene.fog = new THREE.Fog(st.fog[0], st.fog[1], st.fog[2]);
      hemi.color.set(st.hemi[0]); hemi.groundColor.set(st.hemi[1]); hemi.intensity = st.hemi[2];
      sun.color.set(st.sun[0]); sun.intensity = st.sun[1]; sun.position.set(st.sun[2][0], st.sun[2][1], st.sun[2][2]);
    }
    resetFoe();
  }
  function makePortraits() {
    const ps = new THREE.Scene(), pc = new THREE.PerspectiveCamera(30, 1.2, 0.1, 20);
    ps.add(new THREE.HemisphereLight(0xffffff, 0x8a8a9a, 1.35)); const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(1, 2, 3); ps.add(dl);
    renderer.setPixelRatio(1); renderer.setSize(264, 220, false);
    CHARS.forEach(function (d, i) {
      const R = buildChar(d); ps.add(R.root); ps.background = new THREE.Color(CARD_BG[d.stage] || 0x888888);
      R.hips.position.y = R.L; R.arms.forEach(function (a, k) { const p = d.arms[k]; a.sh.rotation.set(p.ux, 0, a.s * p.uz); a.el.rotation.set(p.fx, 0, a.s * p.fz); });
      if (d.boss) R.faceMat.map = R.tex.idle;
      const hy = R.L + R.T + 0.05 + R.hr * 0.95, dist = R.hr * 6.4 + 0.75;
      pc.position.set(0.12, hy + 0.02, dist); pc.lookAt(0, hy - R.hr * 0.5, 0); R.root.rotation.y = -0.18;
      renderer.render(ps, pc);
      try { portraits[i] = canvas.toDataURL('image/jpeg', 0.85); } catch (e) { portraits[i] = ''; }
      disposeChar(R);
    });
  }
  function buildGrid() {
    const grid = $('grid'); grid.innerHTML = '';
    CHARS.forEach(function (d, i) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'card' + (d.boss ? ' boss' : '');
      let stars = ''; for (let k = 0; k < 5; k++) stars += k < d.speed ? '★' : '<i>★</i>';
      const bst = best[d.id] ? '最高 ' + best[d.id] + '発' : 'まだ殴ってない';
      const txt = '<div class="nm">' + d.name + '</div><div class="kt">' + d.blurb + '</div><div class="row"><span class="spd">すばやさ ' + stars + '</span></div><div class="row"><span class="best">' + bst + '</span></div>';
      b.innerHTML = '<img alt="" src="' + (portraits[i] || '') + '">' + (d.boss ? '<span class="tag">BOSS</span><div class="txt">' + txt + '</div>' : '<span class="num">' + (i + 1) + '</span>' + txt);
      b.addEventListener('click', function (ev) { b.blur(); SFX.unlock(); SFX.tap(); goFull(ev); startGame(i); });
      grid.appendChild(b);
    });
  }
  function goFull(ev) {
    if (!(ev && ev.isTrusted)) return;
    try { const el = document.documentElement, fs = el.requestFullscreen || el.webkitRequestFullscreen; if (fs && !document.fullscreenElement && /Android/i.test(navigator.userAgent)) { const pr = fs.call(el); if (pr && pr.catch) pr.catch(function () {}); } } catch (e) {}
  }

  /* ---------- 画面の流れ ---------- */
  function show(id, on) { $(id).classList.toggle('hidden', !on); }
  function startGame(i) {
    loadChar(i);
    const d = CHARS[i];
    S.time = CFG.TIME; S.hits = 0; S.combo = 0; S.maxCombo = 0; S.downs = 0; S.gauge = 0; S.heads = 0; S.slow = 0; S.hitstop = 0; S.lastHit = 9;
    const tm = /[#&]t=(\d+)/.exec(HASH); if (tm) S.time = +tm[1];
    $('hits').firstChild.nodeValue = '0'; $('combo').className = 'stroke'; $('foeName').textContent = d.name;
    show('select', false); show('result', false); show('pause', false); show('hud', true); show('ready', true);
    $('readyWho').textContent = 'VS ' + d.name; $('readyTxt').textContent = 'READY…';
    S.state = 'ready'; S.readyT = 0; gl[0].t = gl[1].t = -1;
    say(d.lines[0], 1.2);
    SFX.bgm(true, [55, 62, 49, 58, 65, 52, 46, 61, 55, 44][i]);
  }
  function finish() {
    S.state = 'finish'; S.finT = 1.7; big('そこまで!', 'red'); SFX.bell(3); SFX.bgm(false); bubble.className = ''; vib([60, 50, 60, 50, 120]);
  }
  function showResult() {
    const d = S.R.def, r = S.hits / d.par;
    const isNew = S.hits > (best[d.id] || 0);
    if (isNew) { best[d.id] = S.hits; try { localStorage.setItem(CFG.BEST_KEY, JSON.stringify(best)); } catch (e) {} }
    $('resHits').firstChild.nodeValue = String(S.hits);
    $('resRank').textContent = r < 0.35 ? 'なでなで級' : r < 0.7 ? 'ビンタ級' : r < 1 ? 'ゲンコツ級' : r < 1.4 ? '鉄拳級' : '鬼神級';
    $('resStats').innerHTML = 'ダウンさせた回数 ' + S.downs + '回 / 最大 ' + S.maxCombo + 'コンボ<br>' + d.name + ' の最高 ' + (best[d.id] || 0) + '発';
    show('resNew', isNew && S.hits > 0); $('resFace').src = portraits[S.ci] || ''; $('resByeTxt').textContent = '「' + d.bye + '」';
    show('hud', false); show('result', true); S.state = 'result'; S.plays++;
    if (isNew) SFX.cheer();
  }
  function toSelect() {
    S.state = 'select'; SFX.bgm(false); bubble.className = '';
    show('hud', false); show('result', false); show('pause', false); show('ready', false); show('hint', false); show('select', true);
    buildGrid(); if (S.R) resetFoe();
  }
  function pause(on) {
    if (on && (S.state === 'play' || S.state === 'ready')) { S.prev = S.state; S.state = 'pause'; show('pause', true); SFX.bgm(false); }
    else if (!on && S.state === 'pause') { S.state = S.prev; show('pause', false); SFX.bgm(true); }
  }
  $('btnPause').addEventListener('click', function () { this.blur(); pause(true); });
  $('btnResume').addEventListener('click', function () { this.blur(); SFX.unlock(); pause(false); });
  $('btnQuit').addEventListener('click', function () { this.blur(); toSelect(); });
  $('btnAgain').addEventListener('click', function (ev) { this.blur(); SFX.unlock(); SFX.tap(); goFull(ev); startGame(S.ci); });
  $('btnBack').addEventListener('click', function () { this.blur(); SFX.tap(); toSelect(); });
  const muteBtn = $('btnMute'); muteBtn.textContent = SFX.muted ? '🔇' : '🔊';
  muteBtn.addEventListener('click', function () { this.blur(); SFX.unlock(); SFX.setMute(!SFX.muted); muteBtn.textContent = SFX.muted ? '🔇' : '🔊'; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(true); });

  let lastPtr = [0, 0];
  canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); SFX.unlock(); lastPtr = [e.clientX, e.clientY]; punch(e.clientX, e.clientY); });
  canvas.addEventListener('pointermove', function (e) { lastPtr = [e.clientX, e.clientY]; });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.key === 'Escape' || e.key === 'p') { pause(S.state !== 'pause'); return; }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'f' || e.key === 'j' || e.key === 'z' || e.key === 'x') { if (S.state === 'play') { e.preventDefault(); SFX.unlock(); punch(lastPtr[0] || S.headScr[0], lastPtr[1] || S.headScr[1]); } }
  });

  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
    const asp = W / H; camera.aspect = asp;
    baseFov = asp < 1 ? 60 : 48; camBase.set(0, asp < 1 ? 1.42 : 1.25, asp < 1 ? 2.6 : 2.9); LOOKY = asp < 1 ? 1.17 : 1.0;
    camera.fov = baseFov; camera.updateProjectionMatrix(); camera.position.copy(camBase); camera.lookAt(0, LOOKY, 0);
    const halfH = Math.tan(baseFov * PI / 360), halfW = halfH * camBase.z * asp;
    XMAX = clamp(halfW - 0.4, 0.2, 0.75); HXMAX = Math.max(0.3, halfW - 0.2);
    const dz = 0.85, hh = halfH * dz, hw = hh * asp;
    for (let i = 0; i < 2; i++) { const s = i ? 1 : -1; restPos[i].set(s * Math.min(hw * 0.7, 0.36), -hh * 1.0, -dz); shoulder[i].set(s * Math.min(hw * 1.15, 0.6), -hh * 1.7 - 0.3, 0.3); }
  }
  addEventListener('resize', resize); addEventListener('orientationchange', function () { setTimeout(resize, 200); });

  /* ---------- 毎フレーム ---------- */
  let last = 0, hudT = -1, hudG = -1;
  function frame(now) {
    requestAnimationFrame(frame);
    try {
      const rdt = Math.min((now - last) / 1000, 0.05); last = now;
      if (S.state === 'pause') { renderer.render(scene, camera); return; }
      let ts = 1;
      if (S.slow > 0) { S.slow -= rdt; ts = 0.3; }
      if (S.state === 'finish') { ts = 0.25; S.finT -= rdt; if (S.finT <= 0) showResult(); }
      let dt = rdt * ts;
      if (S.hitstop > 0) { S.hitstop -= rdt; dt = 0; }
      S.T += dt;
      if (S.state === 'ready') { S.readyT += rdt; if (S.readyT > 0.8 && $('readyTxt').textContent !== 'FIGHT!') { $('readyTxt').textContent = 'FIGHT!'; SFX.bell(1); } if (S.readyT > 1.25) { S.state = 'play'; show('ready', false); if (S.plays === 0 && !AUTO) { show('hint', true); setTimeout(function () { show('hint', false); }, 2600); } if (/down/.test(HASH)) S.gauge = 9999, startDown(); } }
      if (S.state === 'play') {
        const pt = S.time; S.time -= rdt; S.comboT -= dt; S.lastHit += dt;
        if (S.comboT <= 0 && S.combo) { S.combo = 0; $('combo').className = 'stroke'; }
        if (S.lastHit > 2 && S.gauge > 0 && S.ai.mode !== 'down') S.gauge = Math.max(0, S.gauge - 14 * dt);
        if (S.time <= 5 && Math.ceil(S.time) !== Math.ceil(pt) && S.time > 0) SFX.beep(false);
        if (AUTO) { S.autoT -= dt; if (S.autoT <= 0) { S.autoT = 0.11; const vs = volumes(); if (vs.length) { const v = vs[Math.random() < 0.7 ? 0 : vs.length - 1]; autoQ.push([S.T + AUTO_LAG, v.x + rand(-18, 18), v.y + rand(-18, 18)]); } } while (autoQ.length && autoQ[0][0] <= S.T) { const a = autoQ.shift(); punch(a[1], a[2]); } }
        if (S.time <= 0) { S.time = 0; finish(); }
      }
      if (S.R) { if (dt > 0.02) { updateFoe(dt / 2); updateFoe(dt / 2); } else if (dt > 0) updateFoe(dt); }
      if (dt > 0) { updateGloves(dt); updateParts(dt); }
      if (S.stage && S.stage.update) S.stage.update(S.T, dt);
      for (let i = 0; i < impacts.length; i++) { const m = impacts[i]; if (!m.sp.visible) continue; m.t += rdt / 0.17; if (m.t >= 1) { m.sp.visible = false; continue; } m.sp.scale.setScalar((0.22 + ease.out(m.t) * 0.5) * m.big); m.sp.material.opacity = 1 - m.t * m.t; }
      // カメラ(ゆれ・寄り)
      S.shake *= Math.exp(-10 * rdt); S.fovKick *= Math.exp(-9 * rdt);
      camera.position.set(camBase.x + (Math.random() - 0.5) * S.shake * 0.07, camBase.y + (Math.random() - 0.5) * S.shake * 0.07 + Math.sin(S.T * 1.1) * 0.006, camBase.z);
      camera.fov = baseFov - S.fovKick; camera.updateProjectionMatrix(); camera.lookAt(0, LOOKY, 0);
      if (S.flash > 0.005) { S.flash *= Math.exp(-14 * rdt); $('flash').style.opacity = S.flash.toFixed(3); } else if (S.flash) { S.flash = 0; $('flash').style.opacity = '0'; }
      // 表示
      if (S.state === 'play' || S.state === 'finish' || S.state === 'ready') {
        const tq = Math.ceil(S.time); if (tq !== hudT) { hudT = tq; $('timeNum').textContent = String(tq); $('timeWrap').classList.toggle('hot', S.time <= 10); }
        $('timeBar').style.transform = 'scaleX(' + (S.time / CFG.TIME).toFixed(4) + ')';
        const gq = Math.round(clamp(S.gauge / S.R.def.tough, 0, 1) * 100); if (gq !== hudG) { hudG = gq; $('gauge').style.transform = 'scaleX(' + (S.ai.mode === 'down' ? 1 : gq / 100) + ')'; $('gaugeWrap').classList.toggle('full', gq > 85 || S.ai.mode === 'down'); }
      }
      if (S.sayT > 0) { S.sayT -= rdt; if (S.sayT <= 0) bubble.className = ''; else { bubble.style.left = clamp(S.headScr[0], 90, W - 90) + 'px'; bubble.style.top = Math.max(150, S.headScr[1] - S.headScr[2] * 1.5 - 16) + 'px'; } }
      renderer.render(scene, camera);
    } catch (e) { console.error(e); }
  }

  /* ---------- はじまり ---------- */
  makePortraits();
  resize();
  buildGrid();
  loadChar(Math.floor(Math.random() * CHARS.length));
  window.__booted = true;
  window.__g = { S: S, CHARS: CHARS, start: startGame, down: function () { S.gauge = 9999; startDown(); }, volumes: volumes, punch: punch, result: showResult };
  requestAnimationFrame(function (t) { last = t; frame(t); });
  if (/play/.test(HASH)) { const m = /[#&]c=(\d+)/.exec(HASH); startGame(m ? clamp(+m[1] - 1, 0, CHARS.length - 1) : 0); }
}
main();
