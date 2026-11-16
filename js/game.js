/* 殴られ屋 — ゲーム本体(画面の流れ・殴る・動き回る・よける・ダウン・顔のはれ・必殺・ひみつの部屋) */
import { THREE, G, add, grp, canvasTex, dispose, clamp, lerp, ease } from './kit.js';
import { CHARS, buildChar, disposeChar, setDamage, animSwell, setBumps, setSwell, BUMP_MAX } from './chars.js';
import { buildStage } from './stages.js';
import { SFX } from './sfx.js';

const $ = function (id) { return document.getElementById(id); };
const PI = Math.PI;
const rand = function (a, b) { return a + Math.random() * (b - a); };
const pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
const HASH = location.hash || '';
const AUTO = /auto/.test(HASH), autoQ = [], AUTO_LAG = (function () { const m = /lag=(\d+)/.exec(HASH); return m ? +m[1] / 1000 : 0.22; })();
const CFG = { TIME: 60, T_OUT: 0.085, T_BACK: 0.13, BEST_KEY: 'nagurare-best-v1', CLEAR_KEY: 'nagurare-clear-v1', WARN_KEY: 'nagurare-warned-v1', HEAD_PT: 7, BODY_PT: 4, DMG: [5, 13, 24, 38, 56, 78] };
const WORDS = { head: ['バキッ!', 'ゴッ!', 'パァン!', 'ドゴッ!', 'ベチン!', 'ガツン!', 'バチーン!', 'メキッ!'], body: ['ボスッ', 'ドスッ', 'ボコッ', 'ズン', 'ドムッ', 'ボフッ'], crit: ['会心!!', 'クリーンヒット!!', 'どまんなか!!', 'ジャストミート!!'] };
const SP_NAMES = ['怒りのドドドラッシュ', 'スッキリ大噴火パンチ', '日ごろのうらみ百連発', 'ごほうびメガトンラッシュ', 'ストレス全部のせ連打'];
const CARD_BG = { shokudo: 0xc9a06a, konbini: 0x26346e, washitsu: 0xa9b27a, office: 0x8a9aae, yuenchi: 0x6aa9cc, neon: 0x3a1a5a, chikurin: 0x7fae72, shiro: 0x1a2550, ring: 0x2a3f7a, kojo: 0xa9c9cf, room: 0x5a1a4a };
const ROOM_I = CHARS.length - 1;

function fail() { $('select').classList.add('hidden'); $('nogl').classList.remove('hidden'); window.__booted = true; }
function shuffled(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)), t = b[i]; b[i] = b[j]; b[j] = t; } return b; }

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

  let W = 1, H = 1, ASP = 0.5, TANH = 0.577, HXPAD = 0.2, LOOKY = 1.17, baseFov = 60, BND = { zMin: -2, xMax: 1 };
  const camBase = new THREE.Vector3(0, 1.42, 2.9), camKick = { x: 0, vx: 0 };
  const restPos = [new THREE.Vector3(), new THREE.Vector3()], shoulder = [new THREE.Vector3(), new THREE.Vector3()];
  let restScale = 1, hitScale = 1.45;

  /* ---------- 状態 ---------- */
  const S = { state: 'select', ci: -1, R: null, stage: null, stageId: '', ai: null, room: false, time: CFG.TIME, hits: 0, combo: 0, comboT: 0, maxCombo: 0, downs: 0, gauge: 0, lastHit: 9,
    hitstop: 0, slow: 0, shake: 0, fovKick: 0, flash: 0, T: 0, readyT: 0, finT: 0, prev: '', plays: 0, headScr: [0, 0, 40], sayT: 0, bub: [0, 0], autoT: 0, heads: 0, bodies: 0,
    cmtN: 12, sp: null, spCD: 0, spCount: 0, towerAt: 0, pend: -1 };
  let best = {}, cleared = {}, warned = false;
  try { best = JSON.parse(localStorage.getItem(CFG.BEST_KEY) || '{}') || {}; cleared = JSON.parse(localStorage.getItem(CFG.CLEAR_KEY) || '{}') || {}; warned = localStorage.getItem(CFG.WARN_KEY) === '1'; } catch (e) {}
  if (/unlock/.test(HASH)) CHARS.forEach(function (d) { cleared[d.id] = 1; });
  const portraits = [];
  function clearCount() { let n = 0; for (let i = 0; i < ROOM_I; i++) if (cleared[CHARS[i].id]) n++; return n; }

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
      else if (kind === 'gold') { star(9, 31, 13, '#fff6b0'); star(9, 24, 10, '#ff9a1a'); }
      else if (kind === 'tooth') { x.fillStyle = '#fff'; x.strokeStyle = '#17102b'; x.lineWidth = 3; x.beginPath(); x.moveTo(-14, -18); x.lineTo(14, -18); x.lineTo(14, 2); x.lineTo(8, 20); x.lineTo(2, 4); x.lineTo(-4, 20); x.lineTo(-14, 2); x.closePath(); x.fill(); x.stroke(); }
      else if (kind === 'heart') { x.fillStyle = '#ff7ab0'; x.beginPath(); x.moveTo(0, 22); x.bezierCurveTo(-34, -4, -16, -30, 0, -10); x.bezierCurveTo(16, -30, 34, -4, 0, 22); x.fill(); }
    });
  }
  const PT = {}; ['sweat', 'star', 'dust', 'smoke', 'petal', 'leaf', 'paper', 'soul', 'twinkle', 'impact', 'gold', 'tooth', 'heart'].forEach(function (k) { PT[k] = ptex(k); });
  const parts = [];
  for (let i = 0; i < 90; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.star, transparent: true, depthWrite: false })); sp.visible = false; sp.renderOrder = 5; scene.add(sp); parts.push({ sp: sp, life: 0, max: 1, v: new THREE.Vector3(), g: 0, size: 0.1, grow: 0, spin: 0 }); }
  function spawn(kind, x, y, z, vx, vy, vz, life, size, g, grow, spin) {
    let p = null; for (let i = 0; i < parts.length; i++) if (parts[i].life <= 0) { p = parts[i]; break; }
    if (!p) return;
    p.sp.material.map = PT[kind]; p.sp.material.opacity = 1; p.sp.material.rotation = Math.random() * 6; p.sp.position.set(x, y, z); p.sp.visible = true;
    p.v.set(vx, vy, vz); p.life = p.max = life; p.size = size; p.g = g || 0; p.grow = grow || 0; p.spin = spin || 0; p.sp.scale.setScalar(size);
  }
  /* burst(種類, 数, [x,y,z])。x は相手の立ち位置からの ずれ、z は奥行き(相手が奥にいれば一緒に奥へ) */
  function burst(kind, n, o, abs) {
    const bp = S.R ? S.R.body.position : null, near = !abs && bp && Math.abs(o[2]) < 1.6, k = S.room ? 0.4 : 1;
    const x = o[0] + (near ? bp.x : 0), y = o[1], z = o[2] + (near ? clamp(bp.z, -8, 1) : 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * PI * 2, r = Math.random();
      if (kind === 'dust' || kind === 'smoke') spawn(kind, x + Math.cos(a) * 0.2, y + r * 0.3, z + Math.sin(a) * 0.2, Math.cos(a) * 1.3 * r, 0.3 + r * 0.6, Math.sin(a) * 0.6, 0.55 + r * 0.3, kind === 'smoke' ? 0.34 : 0.3, 0, 1.3, 0);
      else if (kind === 'star' || kind === 'tooth' || kind === 'heart') spawn(kind, x, y, z, Math.cos(a) * 2.4 * k, (1.5 + r * 2.5) * k, Math.sin(a) * 1.2 * k + (kind === 'tooth' ? 1 : 0), 0.8, (kind === 'tooth' ? 0.13 : 0.17) * k, -7 * k, 0, 8);
      else if (kind === 'sweat') spawn(kind, x, y, z, Math.cos(a) * 1.8 * k, (1.2 + r * 2.4) * k, (0.5 + r) * k, 0.45, 0.085 * k, -9 * k, 0, 0);
      else if (kind === 'soul') spawn(kind, x, y, z, 0, 0.75, 0, 1.7, 0.42, 0, 0, 0);
      else if (kind === 'twinkle') spawn(kind, x, y, z, 0, 0, 0, 0.55, 0.1 * k, 0, 2.6, 3);
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
  for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.impact, transparent: true, depthTest: false, depthWrite: false })); sp.visible = false; sp.renderOrder = 9; scene.add(sp); impacts.push({ sp: sp, t: 1, big: 1 }); }
  function impactFx(v, big, gold) { let m = impacts[0]; for (let i = 1; i < impacts.length; i++) if (impacts[i].t > m.t) m = impacts[i]; m.t = 0; m.big = big; m.sp.material.map = gold ? PT.gold : PT.impact; m.sp.position.copy(v); m.sp.material.rotation = Math.random() * 6; m.sp.visible = true; }
  // 頭のまわりを回る星(ふらふらのとき。頭のうしろも通る = 立体)
  const orbit = [];
  for (let i = 0; i < 5; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.star, transparent: true, depthWrite: false })); sp.visible = false; scene.add(sp); orbit.push(sp); }

  /* ---------- 画面の字(バキッ!・ふきだし・大きな字) ---------- */
  const pops = $('pops');
  function pop(text, cls, x, y) {
    while (pops.childElementCount > 11) pops.removeChild(pops.firstChild);
    const d = document.createElement('div'); d.className = 'pop ' + cls; d.textContent = text;
    d.style.left = clamp(x, 60, W - 60) + 'px'; d.style.top = y + 'px'; d.style.setProperty('--r', (Math.random() * 30 - 15) + 'deg');
    d.addEventListener('animationend', function () { if (d.parentNode) d.parentNode.removeChild(d); });
    pops.appendChild(d);
  }
  const bigEl = $('big'), bubble = $('bubble'), sukiEl = $('suki'), spEl = $('sp'), linesEl = $('lines');
  function big(text, cls) { bigEl.className = 'stroke'; bigEl.textContent = text; void bigEl.offsetWidth; bigEl.className = 'stroke go ' + (cls || ''); }
  /* ふきだし。顔にかぶらない所に出す(ふだんは下。顔が下に来たら上へよける)。だれのセリフか 名前の札つき */
  function placeBubble() {
    const lowY = H * (S.room ? 0.93 : 0.84), topY = H * 0.38, bh = S.bubH || 90, r = S.headScr[2], ht = S.headScr[1] - r * 1.35, hb = S.headScr[1] + r * 1.3;
    if (!S.room) {
      const hitLow = hb > lowY - bh - 12 && ht < lowY, hitTop = ht < topY + 12 && hb > topY - bh;
      if (S.bubLow && hitLow && !hitTop) S.bubLow = false; else if (!S.bubLow && hitTop && !hitLow) S.bubLow = true;
    } else S.bubLow = true;
    bubble.classList.toggle('low', S.bubLow && !S.room);
    bubble.style.left = (W / 2) + 'px'; bubble.style.top = (S.bubLow ? lowY : topY) + 'px';
  }
  function say(text, kind, sec) {
    if (S.state !== 'play' && S.state !== 'ready') return;
    const d = S.R.def, who = d.room || d.boss ? 'イヤミ田さん' : d.name.split(' ').pop();
    bubble.textContent = ''; const tag = document.createElement('i'); tag.textContent = who; bubble.appendChild(tag); bubble.appendChild(document.createTextNode(text));
    bubble.className = 'on ' + (kind || 'taunt'); S.sayT = sec || 1.9; S.bubLow = true; S.bubH = bubble.offsetHeight + 24;
    placeBubble(); void bubble.offsetWidth; bubble.classList.add('in');
  }
  function vib(p) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) {} }
  const FX = {
    shake: function (a) { S.shake = Math.max(S.shake, a); },
    snd: function (n) { if (SFX[n]) SFX[n](); },
    text: function (t) { pop(t, 'head', W / 2 + rand(-20, 20), H * 0.44 + rand(-14, 14)); },
    count: function (n) { big(String(n), 'yel'); },
    say: function (t) { say(t, 'ouch', 1.8); },
    dmg: function (t, lv) { pop(t, 'dmg', W / 2, H * (S.room ? 0.3 : 0.36)); SFX.pop(); S.hitstop = Math.max(S.hitstop, 0.07); S.flash = Math.max(S.flash, 0.12); if (S.R) { S.R.hc.getWorldPosition(_v); burst('star', 5 + lv, [_v.x, _v.y, _v.z + 0.1], true); } },
    burst: burst
  };
  function nextLine(kind) { const A = S.ai, d = S.R.def; if (!A.bag[kind] || !A.bag[kind].length) A.bag[kind] = shuffled(d[kind]); return A.bag[kind].pop(); }

  /* ---------- グローブ(画面の下から飛び出す自分の手) ---------- */
  const gl = [], gloveMat = new THREE.MeshLambertMaterial({ color: 0xe21f26 }), gloveMat2 = new THREE.MeshLambertMaterial({ color: 0xc5161d });
  for (const s of [-1, 1]) {
    const g = grp(camera);
    add(g, G.sph, gloveMat, [0, 0, 0], [0.078, 0.088, 0.1]);
    add(g, G.sph, gloveMat2, [-s * 0.066, -0.015, -0.02], [0.036, 0.048, 0.06]);
    add(g, G.sph, 0xff8a8a, [s * 0.025, 0.05, -0.06], [0.03, 0.02, 0.04]);
    add(g, G.cyl, 0xffffff, [0, 0, 0.11], [0.062, 0.08, 0.062], [PI / 2, 0, 0]);
    add(g, G.cyl, gloveMat, [0, 0, 0.17], [0.058, 0.04, 0.058], [PI / 2, 0, 0]);
    add(g, G.cyl, 0xf0c29a, [0, 0, 4.2], [0.034, 8, 0.04], [PI / 2, 0, 0]);
    g.traverse(function (m) { if (m.isMesh) m.frustumCulled = false; });
    gl.push({ g: g, s: s, t: -1, done: true, sx: 0, sy: 0, tgt: new THREE.Vector3(), world: new THREE.Vector3(), pos: new THREE.Vector3(), far: 1 });
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
      _v.copy(restPos[i]); _v.y += Math.sin(S.T * 2.6 + i * 2) * 0.008 * restScale;
      g.pos.copy(_v).lerp(g.tgt, f);
      g.g.position.copy(g.pos);
      _v2.copy(g.pos).sub(shoulder[i]).normalize(); _q.setFromUnitVectors(FWD, _v2); g.g.quaternion.copy(_q);
      g.g.scale.setScalar(lerp(restScale, hitScale * g.far, f));
    }
  }
  function toScreen(v) { _p.copy(v).project(camera); return [(_p.x * 0.5 + 0.5) * W, (-_p.y * 0.5 + 0.5) * H]; }
  function scrR(v, r) { const a = toScreen(v); _v2.copy(v); _v2.x += r; const b = toScreen(_v2); return [a[0], a[1], Math.abs(b[0] - a[0])]; }

  /* 当たる場所(顔・胸・腹)を画面の上の丸で返す */
  function volumes() {
    const R = S.R, out = [];
    if (!R || !R.body.visible) return out;
    R.hc.getWorldPosition(_v); if (_v.z > -7.5 && _v.z < 1.9) { const a = scrR(_v, R.hr * 1.12); out.push({ kind: 'head', x: a[0], y: a[1], r: a[2], tol: 12 }); }
    const w = R.def.w, bl = 1 + 0.15 * (R.def.belly || 0);
    _v.set(0, R.T * 0.55, 0); R.hips.localToWorld(_v); if (_v.z > -7.5 && _v.z < 1.9) { const a = scrR(_v, 0.25 * w * bl); out.push({ kind: 'body', x: a[0], y: a[1], r: a[2], tol: 6 }); }
    _v.set(0, R.T * 0.14, 0); R.hips.localToWorld(_v); if (_v.z > -7.5 && _v.z < 1.9) { const a = scrR(_v, 0.23 * w * bl); out.push({ kind: 'body', x: a[0], y: a[1], r: a[2], tol: 6 }); }
    return out;
  }
  function launch(i, sx, sy, pz) {
    const g = gl[i];
    _p.set(sx / W * 2 - 1, -(sy / H * 2 - 1), 0.5).unproject(camera);
    camera.getWorldPosition(_v); _p.sub(_v).normalize();
    const k = (pz - _v.z) / _p.z;
    g.world.copy(_v).addScaledVector(_p, k);
    g.tgt.copy(g.world); camera.worldToLocal(g.tgt);
    g.far = S.room ? 1 : Math.sqrt(Math.max(1, k / 2.4));
    g.t = 0; g.done = false; g.sx = sx; g.sy = sy;
    return g;
  }
  function punch(sx, sy) {
    if (S.state !== 'play' || !S.R) return;
    if (S.sp) { if (S.sp.t > 0.9 && S.sp.t < S.sp.end) spHit(); return; }
    let i = sx < W / 2 ? 0 : 1;
    if (gl[i].t >= 0) { if (gl[1 - i].t < 0) i = 1 - i; else i = gl[0].t > gl[1].t ? 0 : 1; }
    if (gl[i].t >= 0 && !gl[i].done) { gl[i].done = true; impact(gl[i]); }
    const pz = S.room ? S.R.hr + 0.02 : clamp(S.R.body.position.z, -7, 0.9) + 0.2;
    const g = launch(i, sx, sy, pz);
    SFX.whoosh();
    // 相手が気づいて よける
    const A = S.ai, ai = S.R.def.ai;
    if (A.mode === 'idle' && A.stun <= 0 && A.cd <= 0 && !A.dodge && !A.pend && !A.hidden && ai.moves.length && Math.random() < ai.p) A.pend = { t: rand(ai.react[0], ai.react[1]), x: g.world.x };
  }
  function impact(g) {
    if (S.state !== 'play' || S.sp) return;
    if (S.room) { onHit('head', g); return; }
    const vs = volumes(); let hit = null;
    for (let i = 0; i < vs.length; i++) { const v = vs[i]; if (Math.hypot(g.sx - v.x, g.sy - v.y) < v.r + v.tol) { hit = v; break; } }
    if (hit) onHit(hit.kind, g); else onMiss(g);
  }
  /* 顔の変わり方。p = 0〜1(その1分で殴れそうな数に対して、いま何割か)。たたき始めは変わらず、最後にやっと限界 */
  const LV_AT = [0.12, 0.27, 0.43, 0.6, 0.77, 0.94];
  function applyProg(p, say) {
    const R = S.R; S.prog = p;
    let lv = 0; for (let i = 0; i < 6; i++) if (p >= LV_AT[i]) lv = i + 1;
    if (lv !== R.lv) setDamage(R, lv, FX, say && lv > R.lv);
    setSwell(R, p);
    let nb = p < 0.12 ? 0 : Math.min(12, 1 + Math.floor((p - 0.12) / 0.88 * 11.99)); if (S.room && p > 1) nb = Math.min(BUMP_MAX, 12 + Math.floor((p - 1) / 0.06));
    const had = R.bumpG.length;
    if (nb !== had) { setBumps(R, nb); if (say && nb > had) { const t = R.lastTier; pop(t <= 1 ? 'たんこぶ!' : t === 2 ? 'たんこぶの上に たんこぶ!' : 'たんこぶ ' + t + 'だん!', 'bump', S.headScr[0], Math.max(H * 0.16, S.headScr[1] - S.headScr[2] * (S.room ? 0.9 : 1.5))); SFX.pop(); R.sq = Math.min(1.4, R.sq + 0.6); } }
  }
  function addDamage(head) {
    if (head) S.heads++; else S.bodies++;
    const el = S.time0 - S.time; let F = S.R.def.full || 200;
    if (el > 8) F = clamp(S.hits / el * S.time0, F * 0.5, F * 1.7);   // その人の殴る速さに合わせる
    applyProg(Math.max(S.prog, S.hits / F), true);
  }
  function onHit(kind, g, special) {
    const R = S.R, A = S.ai, d = R.def, head = kind === 'head';
    const crit = head && !special && Math.random() < (S.room ? 0.07 : 0.12);
    S.hits++; S.combo++; S.comboT = 1.25; S.lastHit = 0; if (S.combo > S.maxCombo) S.maxCombo = S.combo;
    S.hitstop = Math.max(S.hitstop, crit ? 0.1 : head ? 0.042 : 0.026); S.shake = Math.max(S.shake, crit ? 1.5 : head ? 0.8 : 0.45); S.fovKick = Math.min(6, S.fovKick + (crit ? 4 : head ? 2.4 : 1.2));
    if (head) { S.flash = Math.max(S.flash, crit ? 0.4 : 0.17); linesEl.classList.remove('go'); void linesEl.offsetWidth; linesEl.classList.add('go'); }
    A.hitT = crit ? 0.5 : 0.24; A.stun = Math.max(A.stun, d.ai.stun * (crit ? 2.5 : 1)); A.smug = 0;
    // どこを殴ったかで、頭が立体的に動く(左をたたけば右へ回る・あごなら上へ)
    const dx = clamp((g.sx - S.headScr[0]) / Math.max(8, S.headScr[2]), -1.2, 1.2), dy = clamp((g.sy - S.headScr[1]) / Math.max(8, S.headScr[2]), -1.2, 1.2), pw = (S.room ? 1.25 : 1) * (crit ? 1.6 : 1);
    if (head) {
      R.hs.vy += (-dx * 11 - g.s * 3) * pw; R.hs.vz += dx * 5 * pw; camKick.vx += -dx * 0.5 * pw;
      if (dy > 0.45) { R.hs.vx -= 15 * pw; R.bs.vy += 2.2 * pw; } else if (dy < -0.5) { R.hs.vx += 7 * pw; R.sq = Math.min(1.4, R.sq + 0.9); } else R.hs.vx -= 10 * pw;
      R.sq = Math.min(1.4, R.sq + 0.75 * pw); R.flail = Math.max(R.flail, 0.55);
      if (crit) { R.hspin += (dx >= 0 ? -1 : 1) * PI * 2; S.slow = Math.max(S.slow, 0.22); }
    } else { R.bs.vx += 5.5; R.hs.vx += 4; R.hs.vy += -dx * 3; }
    R.bs.vz -= head ? 1.6 : 2.4; R.wob = Math.min(2, R.wob + (head ? 0.5 : 1));
    impactFx(g.world, (head ? 1.5 : 1) * (crit ? 1.7 : 1) * (S.room ? 0.3 : g.far), special || crit);
    burst(head ? 'sweat' : 'star', head ? 4 : 2, [g.world.x, g.world.y, g.world.z], true);
    if (crit) { burst('tooth', 2, [g.world.x, g.world.y, g.world.z], true); burst('star', 6, [g.world.x, g.world.y, g.world.z], true); pop(pick(WORDS.crit), 'crit', g.sx, g.sy - 46); SFX.combo(8); }
    if (S.room && S.hits % 9 === 0) burst('heart', 2, [g.world.x, g.world.y, g.world.z], true);
    pop(pick(WORDS[kind]), kind + (special ? ' gold' : ''), g.sx + rand(-26, 26), g.sy + rand(-30, 6));
    SFX.punch(head, S.combo); if (Math.random() < 0.3) SFX.grunt(d.voice);
    vib(crit ? [30, 20, 40] : head ? 22 : 12);
    addDamage(head);
    if (A.mode !== 'down' && !special && !S.room) {
      S.gauge += head ? CFG.HEAD_PT : CFG.BODY_PT;
      // スキが光っている間に 顔へ当てると 必殺(たまにしか出ない)
      if (head && A.open && A.open.ok && S.combo >= 6 && S.spCD <= 0) { startSpecial(); return; }
      if (S.gauge >= d.tough) startDown();
    } else if (A.mode === 'down') R.ovKick = 1;
    // セリフ(何発か殴るごとに1回・毎回ちがう)
    if (!special && A.mode !== 'down' && --S.cmtN <= 0 && S.sayT <= 0.3) { S.cmtN = S.room ? 8 + Math.floor(Math.random() * 5) : 11 + Math.floor(Math.random() * 7); say(nextLine('ouch'), S.room ? 'cute' : 'ouch'); }
    const hEl = $('hits'); hEl.firstChild.nodeValue = String(S.hits); hEl.classList.remove('bump'); void hEl.offsetWidth; hEl.classList.add('bump');
    const cEl = $('combo');
    if (S.combo >= 3) { cEl.innerHTML = '<b>' + S.combo + '</b><span>コンボ</span>'; cEl.className = 'stroke on c' + Math.min(4, Math.floor(S.combo / 15)); cEl.style.fontSize = (1 + Math.min(S.combo, 60) / 200).toFixed(2) + 'em'; void cEl.offsetWidth; cEl.classList.add('bump'); }
    if ([10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500].indexOf(S.combo) >= 0) { big(S.combo + ' コンボ!', 'yel'); SFX.combo(S.combo / 10); }
  }
  function onMiss(g) {
    const A = S.ai;
    S.combo = 0; $('combo').className = 'stroke';
    const dodged = !!A.dodge || A.hidden;
    pop(dodged ? pick(['ひらり', 'スカッ', 'ひょい', 'するり']) : 'スカッ', 'miss', g.sx, g.sy);
    SFX.miss();
    if (dodged) A.smug = 0.8;
  }

  /* ---------- 必殺(スキが光った一瞬に顔へ当てたときだけ) ---------- */
  function startSpecial() {
    const A = S.ai;
    S.sp = { t: 0, end: 3.0, fin: 3.5, next: 0.95, name: pick(SP_NAMES), done: false }; S.spCD = 26; S.spCount++;
    A.open = null; A.dodge = null; A.pend = null; A.hidden = false; sukiEl.className = '';
    spEl.className = 'on'; $('spName').textContent = S.sp.name; $('spSub').textContent = '連打しろ!!';
    gloveMat.color.set(0xffc21a); gloveMat2.color.set(0xff8a00);
    S.flash = 0.6; S.shake = 2; SFX.down(); SFX.twinkle(); vib([40, 30, 40, 30, 80]); bubble.className = ''; S.sayT = 0;
  }
  function spHit() {
    const sp = S.sp, R = S.R; if (!sp) return;
    const i = sp.hand = sp.hand ? 0 : 1, sx = S.headScr[0] + rand(-0.5, 0.5) * S.headScr[2], sy = S.headScr[1] + rand(-0.4, 0.5) * S.headScr[2];
    const g = launch(i, sx, sy, clamp(R.body.position.z, -7, 0.9) + 0.2); g.done = true; g.t = CFG.T_OUT * 0.6;
    onHit('head', g, true);
  }
  function updateSpecial(rdt) {
    const sp = S.sp; sp.t += rdt;
    if (sp.t > 0.9 && sp.t < sp.end) { while (sp.next <= sp.t) { sp.next += 0.1; spHit(); } }
    if (sp.t >= sp.end && !sp.wind) { sp.wind = true; $('spSub').textContent = 'とどめ!!'; S.slow = 0.5; }
    if (sp.t >= sp.fin && !sp.done) {
      sp.done = true; spEl.className = ''; gloveMat.color.set(0xe21f26); gloveMat2.color.set(0xc5161d);
      S.hits += 10; $('hits').firstChild.nodeValue = String(S.hits); S.flash = 0.9; S.shake = 3; S.fovKick = 6;
      big('ドッカーン!! +10', 'yel'); SFX.thud(); SFX.cheer(); vib([80, 40, 120]);
      S.R.hc.getWorldPosition(_v); burst('star', 16, [_v.x, _v.y, _v.z + 0.2], true); burst('tooth', 3, [_v.x, _v.y, _v.z + 0.2], true); impactFx(_v, 3, true);
      S.sp = null; if (S.ai.mode !== 'down') startDown();
    }
  }

  /* ---------- 相手の動き ---------- */
  function xLim(z) { return Math.min(BND.xMax, Math.max(0.12, TANH * ASP * (camBase.z - z) - 0.34)); }
  function resetFoe() {
    const R = S.R, d = R.def;
    R.P = { x: 0, crouch: 0, lean: 0, bend: 0, z: d.ai.home || 0, twist: 0, jump: 0 };
    R.ov = {}; R.hs = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }; R.bs = { x: 0, vx: 0, z: 0, vz: 0, y: 0, vy: 0 }; R.wob = 0; R.flail = 0; R.ovKick = 0; R.sq = 0; R.hspin = 0; R.walk = 0; R.spd = 0;
    S.prog = 0; if (R.lv !== 0) setDamage(R, 0, null, false); else R.lidT = [0, 0];
    setSwell(R, 0); setBumps(R, 0); R.swC = [0, 0, 0, 0]; R.puffC = 0; R.cheeks.forEach(function (m) { m.visible = false; }); R.lids.forEach(function (m) { m.visible = false; });
    S.ai = { t: Math.random() * 10, dodge: null, cd: 0, stun: 0, pend: null, hidden: false, unhide: 0, tauntT: rand(2.5, 4), smug: 0, hitT: 0, mode: 'idle', downT: 0, st: null, expr: '', mv: null, mvDef: null, spin: 0, sx: 0, open: null, bag: {} };
    pickMode(true);
    endDownClean();
  }
  function endDownClean() {
    const R = S.R; if (!R) return;
    if (R.acc.inner) R.acc.inner.visible = false; if (R.acc.log) R.acc.log.visible = false;
    if (R.acc.cap) { R.acc.cap.position.set((R.lv || 0) * R.hr * 0.05, 0, 0); R.acc.cap.rotation.set(0, 0, R.capTilt || 0); }
  }
  function startDown() {
    const A = S.ai, d = S.R.def; A.mode = 'down'; A.downT = 0; A.st = {}; A.dodge = null; A.pend = null; A.hidden = false; A.open = null; sukiEl.className = ''; S.R.P.twist = 0; A.spin = 0;
    S.downs++; S.gauge = 0; S.slow = Math.max(S.slow, 0.5); S.shake = Math.max(S.shake, 1.6); S.flash = Math.max(S.flash, 0.3); S.fovKick = 6;
    const firstBoss = d.id === 'boss' && !cleared.boss;
    if (!cleared[d.id]) { cleared[d.id] = 1; try { localStorage.setItem(CFG.CLEAR_KEY, JSON.stringify(cleared)); } catch (e) {} }
    SFX.down(); big(firstBoss ? 'ダウン!! ひみつの箱が ひらいた♡' : 'ダウン!!', 'red'); if (firstBoss) SFX.twinkle(); vib([30, 40, 70]);
  }
  function smokeAt(x, z) { burst('smoke', 7, [x, 1.0, z + 0.1], true); }
  function doWarp(x, z) {
    const A = S.ai, P = S.R.P;
    smokeAt(P.x, P.z); SFX.poof(); A.hidden = true; A.unhide = 0.17; P.x = x; P.z = z; P.jump = 0;
    if (A.mv) { A.mv.tx = x; A.mv.tz = z; A.mv.x0 = x; A.mv.z0 = z; }
  }
  function randSpot(far) { const z = rand(BND.zMin, 0.1), x = rand(-1, 1) * xLim(z); return [x, z]; }
  function pickMode(first) {
    const A = S.ai, R = S.R, ai = R.def.ai, ms = ai.modes; let tot = 0, c = ms[0];
    for (let i = 0; i < ms.length; i++) if (ms.length === 1 || ms[i] !== A.mvDef) tot += ms[i][1];
    let r = Math.random() * tot;
    for (let i = 0; i < ms.length; i++) { if (ms.length > 1 && ms[i] === A.mvDef) continue; r -= ms[i][1]; if (r <= 0) { c = ms[i]; break; } }
    if (first) c = ms[0];
    const prev = A.mv ? A.mv.name : '';
    A.mvDef = c; A.mv = { name: c[0], t: 0, dur: rand(c[2], c[3]), p: c[4] || {}, next: first ? 0.6 : 0, x0: R.P.x, z0: clamp(R.P.z, BND.zMin, 0.2), tx: R.P.x, tz: clamp(R.P.z, BND.zMin, 0.2), ph: Math.random() * 6, j: null };
    if (prev === 'eight') { R.P.twist = 0; A.spin = 0; }
    if (prev === 'peek' && !first) doWarp(0, ai.home);
    if (c[0] === 'peek') doWarp(0, -3.1);
    if (c[0] === 'close' && S.state === 'play' && S.sayT <= 0) taunt();
  }
  function taunt() {
    const A = S.ai, d = S.R.def;
    say(nextLine('lines'), 'taunt'); A.smug = 1.7; A.tauntT = d.ai.nag ? rand(3.5, 5.5) : rand(5.5, 8.5);
    // しゃべっている間は「スキ」。たまにだけ 必殺のチャンスになる
    if (!S.room && S.spCD <= 0 && S.time < CFG.TIME - 6 && S.time > 5 && Math.random() < (d.boss ? 0.2 : 0.11)) { A.open = { t: 1.25, ok: true }; sukiEl.className = 'on'; SFX.twinkle(); }
  }
  function startDodge(pend) {
    const R = S.R, ai = R.def.ai, A = S.ai, P = R.P, type = pick(ai.moves);
    R.hc.getWorldPosition(_v);
    const D = A.dodge = { type: type, t: 0, dur: ai.hold * (type === 'jump' ? 1.6 : type === 'spin' ? 1.3 : 1), dir: pend.x >= _v.x ? -1 : 1 };
    A.cd = ai.cd + D.dur;
    if (type === 'step' || type === 'spin') { const xl = xLim(P.z), side = P.x > 0 ? -1 : 1; D.dir = side; A.sx = side * Math.min(0.55, xl * 0.9); }
    if (type === 'warp') { const s = randSpot(); doWarp(s[0], s[1]); D.dur = 0.2; } else SFX.dodge();
  }
  const OV0 = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, c: 0, arms: 0, kick: 0, crouch: 0, bend: 0, headUp: 0, headRy: 0, headRz: 0, hide: false, expr: null };
  const TG = { x: 0, crouch: 0, lean: 0, bend: 0, z: 0, jump: 0 };
  /* ふだんの動き。キャラごとに modes がちがう(画面いっぱい・奥や手前へ) */
  function motion(dt, T) {
    const A = S.ai, R = S.R, ai = R.def.ai, P = R.P, M = A.mv, p = M.p, home = ai.home || 0, t = A.t;
    M.t += dt; let direct = false, qm = 1;
    const XL = xLim(home);
    switch (M.name) {
      case 'stand': T.x = clamp(M.x0, -XL, XL) + (p.sway || 0) * Math.sin(t * 1.3); T.z = M.z0; T.crouch = (p.bob || 0) * (0.5 + 0.5 * Math.sin(t * 2.2)); T.lean = -(p.sway || 0) * 0.6 * Math.sin(t * 1.3); break;
      case 'stroll': T.x = p.ax * XL * Math.sin(p.f * t); T.z = home + p.az * Math.sin(p.f * 0.63 * t + 1); T.crouch = 0.03 * (0.5 + 0.5 * Math.sin(t * 9)); break;
      case 'eight': T.x = XL * 0.85 * Math.sin(p.f * t); T.z = home + 0.6 * Math.sin(2 * p.f * t); A.spin += dt * 7; P.twist = A.spin; break;
      case 'dash': M.next -= dt; if (M.next <= 0) { const s = randSpot(); M.tx = s[0]; M.tz = s[1]; M.next = rand(p.every[0], p.every[1]); SFX.dodge(); } T.x = M.tx; T.z = M.tz; qm = 1.4; break;
      case 'hop':
        direct = true;
        if (!M.j) { M.next -= dt; T.crouch = 0.14; if (M.next <= 0) { const s = randSpot(); M.j = { t: 0, d: rand(0.36, 0.52), x0: P.x, z0: P.z, x1: s[0], z1: s[1], h: rand(p.h[0], p.h[1]) }; } }
        else { const j = M.j; j.t += dt; const k = Math.min(1, j.t / j.d); P.x = lerp(j.x0, j.x1, k); P.z = lerp(j.z0, j.z1, k); T.jump = j.h * Math.sin(k * PI); if (k >= 1) { M.j = null; M.next = rand(p.every[0], p.every[1]); R.wob = Math.min(2, R.wob + 0.5); } }
        T.x = P.x; T.z = P.z; break;
      case 'weave': T.x = XL * 0.6 * Math.sin(0.8 * t + M.ph); T.z = home + 0.5 * Math.sin(1.1 * t); T.lean = p.a * Math.sin(p.f * t); T.crouch = p.cz * (0.5 + 0.5 * Math.cos(2 * p.f * t)); qm = 1.3; break;
      case 'drunk': { const u = t * (p.sp || 1); T.x = XL * (0.6 * Math.sin(1.1 * u) + 0.35 * Math.sin(2.3 * u + 1)); T.z = home + 0.8 * Math.sin(0.7 * u + M.ph); T.lean = 0.3 * Math.sin(1.7 * u); T.bend = -0.2 + 0.3 * Math.sin(1.3 * u); T.crouch = 0.1 + 0.1 * Math.sin(2.1 * u); break; }
      case 'duckwalk': T.crouch = 0.33; T.bend = 0.45; T.x = XL * Math.sin(p.f * t); T.z = home + 0.35; break;
      case 'warp': M.next -= dt; if (M.next <= 0 && !A.hidden) { let s = randSpot(); if (p.spots && Math.random() < 0.3) s = Math.random() < 0.5 ? [0, -3.1] : [rand(-0.2, 0.2), 0.35]; doWarp(s[0], s[1]); M.next = rand(p.every[0], p.every[1]); } T.x = M.tx; T.z = M.tz; break;
      case 'close': T.x = 0; T.z = 0.8; T.bend = 0.3; T.crouch = 0.04; break;
      case 'peek': direct = true; P.x = 0; P.z = -3.1; T.x = 0; T.z = -3.1; T.crouch = Math.sin(t * 5.5) > -0.2 ? 0.02 : 0.42; T.bend = 0.2; break;
    }
    if (M.name !== 'close' && M.name !== 'peek') { T.z = clamp(T.z, BND.zMin, 0.2); const xl = xLim(T.z); T.x = clamp(T.x, -xl, xl); }
    if (M.t >= M.dur && !M.j && !A.hidden) pickMode(false);
    A.direct = direct; return qm;
  }
  function updateFoe(dt) {
    const R = S.R, d = R.def, ai = d.ai, A = S.ai, P = R.P, ov = R.ov, T = TG, playing = S.state === 'play' && !S.sp;
    const t = (A.t += dt);
    for (const k in OV0) ov[k] = OV0[k];
    T.x = P.x; T.z = P.z; T.crouch = T.lean = T.bend = T.jump = 0;
    A.cd -= dt; A.stun -= dt; A.smug -= dt; A.hitT -= dt;
    let qm = 1;
    if (A.unhide > 0) { A.unhide -= dt; if (A.unhide <= 0) { A.hidden = false; smokeAt(P.x, P.z); } }
    if (A.mode === 'down') {
      A.downT += dt; const k = A.downT / d.downT;
      T.x = clamp(P.x, -0.3, 0.3); T.z = clamp(P.z, -0.3, 0);
      if (k >= 1) { A.mode = 'idle'; A.stun = 0.25; A.tauntT = rand(2, 3.5); endDownClean(); pickMode(false); } else d.down(R, k, FX, A.st);
    } else if (S.sp) {
      T.crouch = 0.05; A.stun = 0.3; ov.arms = 0.8;
    } else {
      if (A.stun <= 0 || A.direct) qm = motion(dt, T);
      A.sx *= Math.exp(-3 * dt); T.x += A.sx;
      if (playing && A.pend) { A.pend.t -= dt; if (A.pend.t <= 0) { const p = A.pend; A.pend = null; if (A.stun <= 0 && !A.hidden) startDodge(p); } }
      if (A.dodge) {
        const D = A.dodge; D.t += dt; const k = D.t / D.dur; qm = Math.max(qm, 1.7);
        if (k >= 1) { if (D.type === 'spin' && A.mv.name !== 'eight') P.twist = 0; A.dodge = null; if (A.open == null && !S.room && S.spCD <= 0 && S.time < CFG.TIME - 6 && Math.random() < 0.035) { A.open = { t: 0.7, ok: true }; sukiEl.className = 'on'; SFX.twinkle(); } }
        else if (D.type === 'duck') { T.crouch = 0.32; T.bend = 1.0; }
        else if (D.type === 'slip') { T.lean += -D.dir * 0.38; T.x += D.dir * 0.09; }
        else if (D.type === 'back') { T.z -= 1.1; T.bend = -0.35; }
        else if (D.type === 'step') { T.lean += -D.dir * 0.15; }
        else if (D.type === 'jump') { T.jump = Math.max(T.jump, Math.sin(k * PI) * 1.1); }
        else if (D.type === 'spin') { if (A.mv.name !== 'eight') P.twist = ease.io(k) * PI * 2; T.lean += -D.dir * 0.2; }
      }
      if (playing) { A.tauntT -= dt; if (A.tauntT <= 0) { if (S.sayT <= 0 && A.stun <= 0 && !A.hidden) taunt(); else A.tauntT = 1; } }
      if (A.open) { A.open.t -= dt; if (A.open.t <= 0) { A.open = null; sukiEl.className = ''; } }
    }
    // 頭が画面の外に出ないように
    { const hw = TANH * ASP * (camBase.z - T.z) - HXPAD, hx = T.x - Math.sin(T.lean) * 1.4; T.x -= hx - clamp(hx, -hw, hw); }
    const q = 1 - Math.exp(-ai.quick * qm * (A.stun > 0 ? 0.4 : 1) * dt), px = P.x, pz = P.z;
    if (!A.direct || A.mode === 'down' || S.sp) { P.x += (T.x - P.x) * q; P.z += (T.z - P.z) * q; }
    P.crouch += (T.crouch - P.crouch) * q; P.lean += (T.lean - P.lean) * q; P.bend += (T.bend - P.bend) * q; P.jump = T.jump;
    const spd = dt > 0 ? Math.hypot(P.x - px, P.z - pz) / dt : 0; R.spd += (Math.min(spd, 4) - R.spd) * Math.min(1, dt * 10); R.walk += R.spd * dt * 9;
    // ばね(頭・体のゆれ)
    const hs = R.hs, bs = R.bs;
    hs.vx += (-260 * hs.x - 13 * hs.vx) * dt; hs.x += hs.vx * dt; hs.vz += (-260 * hs.z - 13 * hs.vz) * dt; hs.z += hs.vz * dt; hs.vy += (-200 * hs.y - 11 * hs.vy) * dt; hs.y += hs.vy * dt;
    bs.vx += (-200 * bs.x - 16 * bs.vx) * dt; bs.x += bs.vx * dt; bs.vz += (-130 * bs.z - 13 * bs.vz) * dt; bs.z += bs.vz * dt; bs.vy += (-160 * bs.y - 14 * bs.vy) * dt; bs.y += bs.vy * dt;
    hs.x = clamp(hs.x, -1.1, 0.9); hs.z = clamp(hs.z, -0.9, 0.9); hs.y = clamp(hs.y, -1.3, 1.3); bs.x = clamp(bs.x, -0.4, 0.7); bs.z = clamp(bs.z, -0.5, 0.2); bs.y = clamp(bs.y, -0.1, 0.4);
    R.wob *= Math.exp(-5 * dt); R.flail *= Math.exp(-5 * dt); R.ovKick *= Math.exp(-6 * dt); R.sq *= Math.exp(-13 * dt); R.hspin *= Math.exp(-7 * dt);
    // 体に当てはめる
    R.body.visible = !(ov.hide || A.hidden);
    let x = P.x + ov.x, y = P.jump + ov.y + Math.max(0, bs.y), z = P.z + ov.z + bs.z;
    const rx = ov.rx, rz = P.lean + ov.rz;
    if (ov.c) { y += ov.c * (1 - Math.cos(rx)) + ov.c * (1 - Math.cos(ov.rz)); z += -ov.c * Math.sin(rx); x += ov.c * Math.sin(ov.rz); }
    if (R.ovKick > 0.01) x += Math.sin(t * 70) * 0.03 * R.ovKick;
    R.body.position.set(x, y, z); R.body.rotation.set(rx, P.twist + ov.ry + clamp((P.x - px) / Math.max(dt, 0.001) * 0.12, -0.5, 0.5) * (A.mode === 'idle' ? 1 : 0), rz);
    const cr = clamp(P.crouch + ov.crouch, 0, R.L * 0.6);
    R.hips.position.y = R.L - cr; R.hips.rotation.set(P.bend + ov.bend + bs.x, 0, 0);
    const ws = Math.sin(t * 40) * 0.07 * R.wob * (d.jig || 1); R.hips.scale.set(1 + ws, 1 - ws * 0.8, 1 + ws);
    const wk = P.jump > 0.05 ? 0 : Math.min(0.6, R.spd * 0.45);
    for (let i = 0; i < 2; i++) { const lg = R.legs[i]; lg.position.y = R.L - cr; lg.scale.y = (R.L - cr) / R.L; lg.rotation.x = ov.kick ? Math.sin(t * 30 + i * PI) * 0.75 * ov.kick : Math.sin(R.walk + i * PI) * wk + (P.jump > 0.05 ? (i ? -0.5 : 0.4) : 0); }
    R.head.position.y = R.T + 0.05 + ov.headUp; R.head.rotation.set(hs.x + Math.sin(t * 1.7) * 0.03 - 0.06, ov.headRy + hs.y + R.hspin, hs.z + ov.headRz);
    const sq = R.sq * Math.cos(t * 55) * 0.5 + R.sq * 0.5; const pf = R.puffC || 0; R.hc.scale.set((1 + 0.2 * sq) * (1 + 0.1 * pf), 1 - 0.17 * sq, (1 + 0.08 * sq) * (1 + 0.05 * pf));
    const fl = Math.max(ov.arms, R.flail), talk = (d.ai.nag && S.sayT > 0 && A.mode === 'idle' && !S.room) ? 1 : 0;
    for (let i = 0; i < 2; i++) { const a = R.arms[i], p = d.arms[i];
      let ux = lerp(p.ux, -2.5, fl * 0.85) + Math.sin(t * 28 + i * 2) * 0.5 * fl, uz = p.uz + fl * 0.7, fx = lerp(p.fx, -0.3, fl), fz = p.fz * (1 - fl);
      if (talk && i === 1) { ux = -1.25; uz = 0.15; fx = -1.2 + Math.sin(t * 16) * 0.35; fz = 0; }
      a.sh.rotation.set(ux, 0, a.s * uz); a.el.rotation.set(fx, 0, a.s * fz); }
    if (R.acc.dangle) for (let i = 0; i < R.acc.dangle.length; i++) R.acc.dangle[i].rotation.z = clamp(-hs.y * 1.6 - hs.z * 2 + Math.sin(t * 9 + i) * R.sq * 0.5, -1.4, 1.4);
    animSwell(R, dt);
    shadow.position.set(x, 0.012, clamp(z, -9, 1)); const ss = 0.42 * d.w / (1 + y * 0.7); shadow.scale.set(ss, ss * 0.6, 1); shadow.visible = R.body.visible && y < 5 && !S.room;
    // 顔
    const woozy = (S.gauge > d.tough * 0.86 && playing) || (S.sp && S.sp.t > 0.9);
    let ex = A.mode === 'down' ? (ov.expr || 'dizzy') : A.hitT > 0 ? 'hit' : woozy ? 'dizzy' : (S.room && R.lv >= 4) ? 'beg' : A.smug > 0 ? 'smug' : 'idle';
    if (ex !== A.expr) { A.expr = ex; R.curExpr = ex; R.faceMat.map = R.tex[ex]; }
    // ふきだし・星の輪の位置
    R.hc.getWorldPosition(_v); const hsr = scrR(_v, R.hr); S.headScr[0] = hsr[0]; S.headScr[1] = hsr[1]; S.headScr[2] = hsr[2];
    const ring = R.body.visible && (woozy || R.lv >= 5 || A.mode === 'down') && _v.y < 4;
    for (let i = 0; i < 5; i++) { const sp = orbit[i]; sp.visible = ring; if (!ring) continue; const a = S.T * 4 + i * PI * 0.4, rr = R.hr * 1.35; sp.position.set(_v.x + Math.cos(a) * rr, _v.y + R.hr * 1.15 + Math.sin(a * 2) * 0.02, _v.z + Math.sin(a) * rr); sp.scale.setScalar(R.hr * 0.5); }
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
    BND = S.stage.bnd || { zMin: -2, xMax: 1 };
    S.room = !!d.room; resize();
    resetFoe();
  }
  function makePortraits() {
    const ps = new THREE.Scene(), pc = new THREE.PerspectiveCamera(30, 1.2, 0.1, 20);
    ps.add(new THREE.HemisphereLight(0xffffff, 0x8a8a9a, 1.35)); const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(1, 2, 3); ps.add(dl);
    renderer.setPixelRatio(1); renderer.setSize(264, 220, false);
    CHARS.forEach(function (d, i) {
      const R = buildChar(d); ps.add(R.root); ps.background = new THREE.Color(CARD_BG[d.stage] || 0x888888);
      R.hips.position.y = R.L; R.arms.forEach(function (a, k) { const p = d.arms[k]; a.sh.rotation.set(p.ux, 0, a.s * p.uz); a.el.rotation.set(p.fx, 0, a.s * p.fz); });
      const hy = R.L + R.T + 0.05 + R.hr * 0.95, dist = R.hr * (d.room ? 4.6 : 6.4) + 0.75;
      pc.position.set(0.12, hy + 0.02, dist); pc.lookAt(0, hy - R.hr * (d.room ? 0.1 : 0.5), 0); R.root.rotation.y = -0.18; R.head.rotation.x = -0.06;
      renderer.render(ps, pc);
      try { portraits[i] = canvas.toDataURL('image/jpeg', 0.85); } catch (e) { portraits[i] = ''; }
      disposeChar(R);
    });
  }
  function buildGrid() {
    const grid = $('grid'); grid.innerHTML = '';
    CHARS.forEach(function (d, i) {
      if (d.room) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'card' + (d.boss ? ' boss' : '');
      let stars = ''; for (let k = 0; k < 5; k++) stars += k < d.speed ? '★' : '<i>★</i>';
      const bst = best[d.id] ? '最高 ' + best[d.id] + '発' : 'まだ殴ってない';
      const txt = '<div class="nm">' + d.name + '</div>' + (d.id === 'boss' && !cleared.boss ? '<div class="key">🔑 ダウンさせると「ひみつの箱」がひらく</div>' : '') + '<div class="cr"><b>罪状</b>' + d.crime + '</div><div class="kt">' + d.blurb + '</div><div class="row"><span class="spd">すばやさ ' + stars + '</span><span class="best">' + bst + '</span></div>';
      b.innerHTML = '<img alt="" src="' + (portraits[i] || '') + '">' + (cleared[d.id] ? '<span class="done">ダウン済</span>' : '') + (d.boss ? '<span class="tag">BOSS</span><div class="txt">' + txt + '</div>' : '<span class="num">' + (i + 1) + '</span>' + txt);
      b.addEventListener('click', function (ev) { b.blur(); SFX.unlock(); SFX.tap(); goFull(ev); tryStart(i); });
      grid.appendChild(b);
    });
    // ひみつの箱(全員を1回ずつダウンさせた人だけ)
    const open = !!cleared.boss, s = document.createElement('button'); s.type = 'button'; s.className = 'card secret' + (open ? ' open' : '');
    if (open) s.innerHTML = '<img alt="" src="' + (portraits[ROOM_I] || '') + '"><div class="txt"><div class="nm">♡ 殴りたい放題の部屋 ♡</div><div class="kt">画面いっぱいの あの顔を、ただ連打するだけ。ごほうびの部屋だよ。</div><div class="row"><span class="best">' + (best.room ? '最高 ' + best.room + '発' : 'さあ、どうぞ!') + '</span></div></div>';
    else s.innerHTML = '<div class="q">？？？</div><div class="txt"><div class="nm">ひみつの箱</div><div class="kt">ボスの「工場の女帝 イヤミ田さん」を 1回ダウンさせた人だけが、たどりつける おへや だよ ♡</div><div class="row"><span class="best">ボスを たくさん殴って ダウンさせてね</span></div></div>';
    s.addEventListener('click', function (ev) { s.blur(); SFX.unlock(); if (open) { SFX.tap(); goFull(ev); tryStart(ROOM_I); } else { SFX.miss(); s.classList.remove('no'); void s.offsetWidth; s.classList.add('no'); } });
    grid.appendChild(s);
  }
  function goFull(ev) {
    if (!(ev && ev.isTrusted)) return;
    try { const el = document.documentElement, fs = el.requestFullscreen || el.webkitRequestFullscreen; if (fs && !document.fullscreenElement && /Android/i.test(navigator.userAgent)) { const pr = fs.call(el); if (pr && pr.catch) pr.catch(function () {}); } } catch (e) {}
  }

  /* ---------- 画面の流れ ---------- */
  function show(id, on) { $(id).classList.toggle('hidden', !on); }
  function tryStart(i) {   // いちばん最初の1回だけ、おやくそくを出す
    if (warned) { startGame(i); return; }
    S.pend = i; show('warn', true);
  }
  $('btnWarn').addEventListener('click', function () { this.blur(); SFX.unlock(); SFX.tap(); warned = true; try { localStorage.setItem(CFG.WARN_KEY, '1'); } catch (e) {} show('warn', false); if (S.pend >= 0) startGame(S.pend); S.pend = -1; });
  function startGame(i) {
    loadChar(i);
    const d = CHARS[i];
    S.time = CFG.TIME; S.hits = 0; S.combo = 0; S.maxCombo = 0; S.downs = 0; S.gauge = 0; S.heads = 0; S.bodies = 0; S.slow = 0; S.hitstop = 0; S.lastHit = 9; S.sp = null; S.spCD = 8; S.spCount = 0; S.prog = 0; S.time0 = CFG.TIME;
    S.cmtN = S.room ? 6 : 10; spEl.className = ''; sukiEl.className = ''; gloveMat.color.set(0xe21f26); gloveMat2.color.set(0xc5161d);
    const tm = /[#&]t=(\d+)/.exec(HASH); if (tm) S.time = +tm[1]; S.time0 = S.time;
    const lm = /[#&]lv=(\d)/.exec(HASH); if (lm && +lm[1]) applyProg(LV_AT[+lm[1] - 1] + 0.01, false);
    $('hits').firstChild.nodeValue = '0'; $('combo').className = 'stroke'; $('foeName').textContent = d.room ? 'なぐりたい放題' : d.name; show('gaugeWrap', !d.room);
    show('select', false); show('result', false); show('pause', false); show('warn', false); show('hud', true); show('ready', true);
    $('readyWho').textContent = d.room ? '♡ ごほうびの部屋 ♡' : 'VS ' + d.name; $('readyTxt').textContent = 'READY…';
    S.state = 'ready'; S.readyT = 0; gl[0].t = gl[1].t = -1;
    say(d.lines[0], 'taunt', 1.3);
    SFX.bgm(true, [55, 62, 49, 58, 65, 52, 46, 61, 55, 44, 65][i]);
  }
  function finish() {
    S.state = 'finish'; S.finT = 1.7; big('そこまで!', 'red'); SFX.bell(3); SFX.bgm(false); bubble.className = ''; sukiEl.className = ''; S.ai.open = null; vib([60, 50, 60, 50, 120]);
  }
  function showResult() {
    const d = S.R.def, r = S.hits / d.par;
    const isNew = S.hits > (best[d.id] || 0);
    if (isNew) { best[d.id] = S.hits; try { localStorage.setItem(CFG.BEST_KEY, JSON.stringify(best)); } catch (e) {} }
    $('resHits').firstChild.nodeValue = String(S.hits);
    $('resRank').textContent = d.room ? (r < 0.5 ? 'ちょっとスッキリ' : r < 1 ? 'だいぶスッキリ' : r < 1.3 ? '超スッキリ!' : 'スッキリの神!!') : (r < 0.35 ? 'なでなで級' : r < 0.7 ? 'ビンタ級' : r < 1 ? 'ゲンコツ級' : r < 1.4 ? '鉄拳級' : '鬼神級');
    $('resStats').innerHTML = (d.room ? '' : 'ダウンさせた回数 ' + S.downs + '回 / ') + 'たんこぶ ' + S.R.bumpG.length + 'こ' + ' / 最大 ' + S.maxCombo + 'コンボ' + (S.spCount ? ' / 必殺 ' + S.spCount + '回' : '') + '<br>最高 ' + (best[d.id] || 0) + '発';
    show('resNew', isNew && S.hits > 0); $('resFace').src = portraits[S.ci] || ''; $('resByeTxt').textContent = '「' + d.bye + '」';
    $('resUnlock').textContent = d.room ? '' : cleared.boss ? '♡ ひみつの箱が ひらいているよ(ボスの下を見てね)♡' : d.id === 'boss' ? 'おしい! ボスを1回ダウンさせると、ひみつの箱が ひらくよ' : 'ボスのイヤミ田さんを ダウンさせると、ひみつの箱が ひらくよ';
    show('hud', false); show('result', true); S.state = 'result'; S.plays++;
    if (isNew) SFX.cheer();
  }
  function toSelect() {
    S.state = 'select'; SFX.bgm(false); bubble.className = ''; sukiEl.className = ''; spEl.className = ''; S.sp = null;
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
    ASP = W / H; camera.aspect = ASP;
    baseFov = ASP < 1 ? 60 : 48; TANH = Math.tan(baseFov * PI / 360);
    let dz = 0.85;
    if (S.room && S.R) {   // ひみつの部屋: 顔が画面いっぱい
      const R = S.R, hy = R.L + R.T + 0.05 + R.hr * 0.95, dW = R.hr * 2.3 / 0.99 / (2 * TANH * ASP), dH = R.hr * 2.5 / 0.62 / (2 * TANH);
      camBase.set(0, hy + R.hr * 0.12, Math.max(dW, dH)); LOOKY = hy + R.hr * 0.12; dz = 0.3; restScale = 0.34; hitScale = 0.55;
    } else { camBase.set(0, ASP < 1 ? 1.42 : 1.25, ASP < 1 ? 3.0 : 3.1); LOOKY = ASP < 1 ? 1.17 : 1.0; restScale = 1; hitScale = 1.45; }
    camera.fov = baseFov; camera.updateProjectionMatrix(); camera.position.copy(camBase); camera.lookAt(0, LOOKY, 0);
    const hh = TANH * dz, hw = hh * ASP;
    for (let i = 0; i < 2; i++) { const s = i ? 1 : -1; restPos[i].set(s * Math.min(hw * 0.7, 0.36), -hh * 1.0, -dz); shoulder[i].set(s * Math.min(hw * 1.15, 0.6), -hh * 1.7 - 0.3 * restScale, 0.3 * restScale); }
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
      if (S.sp) { updateSpecial(rdt); if (S.sp && S.sp.t < 0.9) ts = 0.04; }
      let dt = rdt * ts;
      if (S.hitstop > 0) { S.hitstop -= rdt; dt = 0; }
      S.T += dt;
      if (S.state === 'ready') { S.readyT += rdt; if (S.readyT > 0.8 && $('readyTxt').textContent !== 'FIGHT!') { $('readyTxt').textContent = S.room ? 'なぐれ〜!' : 'FIGHT!'; SFX.bell(1); } if (S.readyT > 1.25) { S.state = 'play'; show('ready', false); if (S.plays === 0 && !AUTO) { $('hint').textContent = S.room ? 'どこでもいいから 連打!' : '相手をタップして殴れ!'; show('hint', true); setTimeout(function () { show('hint', false); }, 2600); } if (/down/.test(HASH)) { S.gauge = 9999; startDown(); } if (/[#&]sp/.test(HASH)) startSpecial(); } }
      if (S.state === 'play') {
        const pt = S.time; if (!S.sp) S.time -= rdt; S.comboT -= dt; S.lastHit += dt; S.spCD -= rdt;
        if (S.comboT <= 0 && S.combo) { S.combo = 0; $('combo').className = 'stroke'; }
        if (S.lastHit > 2 && S.gauge > 0 && S.ai.mode !== 'down') S.gauge = Math.max(0, S.gauge - 14 * dt);
        if (S.time <= 5 && Math.ceil(S.time) !== Math.ceil(pt) && S.time > 0) SFX.beep(false);
        if (AUTO) { S.autoT -= dt; if (S.autoT <= 0) { S.autoT = 0.11; const vs = volumes(); if (vs.length) { const v = vs[Math.random() < 0.7 ? 0 : vs.length - 1]; autoQ.push([S.T + AUTO_LAG, v.x + rand(-18, 18), v.y + rand(-18, 18)]); } } while (autoQ.length && autoQ[0][0] <= S.T) { const a = autoQ.shift(); punch(a[1], a[2]); } }
        if (S.time <= 0) { S.time = 0; if (S.sp) { spEl.className = ''; S.sp = null; } finish(); }
      }
      if (S.R) { if (dt > 0.02) { updateFoe(dt / 2); updateFoe(dt / 2); } else if (dt > 0) updateFoe(dt); }
      if (dt > 0) { updateGloves(dt); updateParts(dt); }
      if (S.stage && S.stage.update) S.stage.update(S.T, dt);
      for (let i = 0; i < impacts.length; i++) { const m = impacts[i]; if (!m.sp.visible) continue; m.t += rdt / 0.17; if (m.t >= 1) { m.sp.visible = false; continue; } m.sp.scale.setScalar((0.22 + ease.out(m.t) * 0.5) * m.big); m.sp.material.opacity = 1 - m.t * m.t; }
      // カメラ(ゆれ・寄り・相手を少し目で追う = 立体感)
      S.shake *= Math.exp(-10 * rdt); S.fovKick *= Math.exp(-9 * rdt);
      camKick.vx += (-90 * camKick.x - 12 * camKick.vx) * rdt; camKick.x = clamp(camKick.x + camKick.vx * rdt, -0.3, 0.3);
      const sk = S.room ? 0.35 : 1, fx = S.R && !S.room ? clamp(S.R.body.position.x, -1.5, 1.5) : 0;
      camera.position.set(camBase.x + (Math.random() - 0.5) * S.shake * 0.07 * sk + camKick.x * sk + (S.room ? Math.sin(S.T * 0.7) * 0.035 : fx * 0.1), camBase.y + (Math.random() - 0.5) * S.shake * 0.07 * sk + Math.sin(S.T * 1.1) * 0.006, camBase.z);
      camera.fov = baseFov - S.fovKick * (S.room ? 0.6 : 1); camera.updateProjectionMatrix(); camera.lookAt(fx * 0.22, LOOKY, 0);
      if (S.flash > 0.005) { S.flash *= Math.exp(-14 * rdt); $('flash').style.opacity = S.flash.toFixed(3); } else if (S.flash) { S.flash = 0; $('flash').style.opacity = '0'; }
      // 表示
      if (S.state === 'play' || S.state === 'finish' || S.state === 'ready') {
        const tq = Math.ceil(S.time); if (tq !== hudT) { hudT = tq; $('timeNum').textContent = String(tq); $('timeWrap').classList.toggle('hot', S.time <= 10); }
        $('timeBar').style.transform = 'scaleX(' + (S.time / CFG.TIME).toFixed(4) + ')';
        const gq = Math.round(clamp(S.gauge / S.R.def.tough, 0, 1) * 100) + (S.ai.mode === 'down' ? 200 : 0); if (gq !== hudG) { hudG = gq; $('gauge').style.transform = 'scaleX(' + (gq >= 200 ? 1 : gq / 100) + ')'; $('gaugeWrap').classList.toggle('full', gq > 85); }
      }
      if (S.sayT > 0) { S.sayT -= rdt; if (S.sayT <= 0) bubble.className = '';
        else placeBubble(); }
      if (S.ai && S.ai.open) { sukiEl.style.left = clamp(S.headScr[0], 80, W - 80) + 'px'; sukiEl.style.top = Math.max(H * 0.2, S.headScr[1] - S.headScr[2] * 1.2) + 'px'; }
      renderer.render(scene, camera);
    } catch (e) { console.error(e); }
  }

  /* ---------- はじまり ---------- */
  makePortraits();
  resize();
  buildGrid();
  loadChar(Math.floor(Math.random() * ROOM_I));
  window.__booted = true;
  window.__g = { S: S, CHARS: CHARS, start: startGame, down: function () { S.gauge = 9999; startDown(); }, special: startSpecial, lv: function (n) { applyProg(n ? LV_AT[n - 1] + 0.01 : 0, true); }, prog: function (p) { applyProg(p, true); }, volumes: volumes, punch: punch, result: showResult };
  requestAnimationFrame(function (t) { last = t; frame(t); });
  if (/play/.test(HASH)) { const m = /[#&]c=(\d+)/.exec(HASH); warned = true; startGame(m ? clamp(+m[1] - 1, 0, CHARS.length - 1) : 0); }
}
main();
