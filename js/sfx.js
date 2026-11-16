/* 殴られ屋 — 音(ファイルは使わず、その場で作る)。最初のタップのあとに鳴りはじめる */
let ac = null, master = null, noiseBuf = null, muted = false, bgmTimer = null, bgmStep = 0, bgmNext = 0, bgmRoot = 55, bgmOn = false;
try { muted = localStorage.getItem('nagurare-mute') === '1'; } catch (e) {}

function init() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.9;
    const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; return false; }
  return true;
}
function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
function osc(type, f0, f1, dur, vol, t, dest) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, 0.004, vol, dur); o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(ftype, f0, f1, q, dur, vol, t) {
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = ftype; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.003, vol, dur); s.connect(f); f.connect(g); g.connect(master);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

export const SFX = {
  unlock: function () { return init(); },
  get muted() { return muted; },
  setMute: function (m) { muted = m; try { localStorage.setItem('nagurare-mute', m ? '1' : '0'); } catch (e) {} if (master) master.gain.value = m ? 0 : 0.9; },
  /* 殴った音。head = 顔、combo が上がるほど 少し高く・強く */
  punch: function (head, combo) {
    if (!ac || muted) return; const t = ac.currentTime, up = 1 + Math.min(combo || 0, 40) * 0.006, r = 0.92 + Math.random() * 0.16;
    osc('sine', (head ? 170 : 130) * r, 42, 0.16, 0.95, t);
    noise('bandpass', (head ? 2100 : 950) * up * r, (head ? 900 : 400), 0.9, head ? 0.09 : 0.12, head ? 0.85 : 0.7, t);
    noise('highpass', 3500, 3500, 0.5, 0.025, 0.35, t);
    if (head) osc('triangle', 520 * up, 180, 0.07, 0.22, t);
  },
  whoosh: function () { if (!ac || muted) return; noise('bandpass', 500, 2600, 1.4, 0.14, 0.22, ac.currentTime); },
  miss: function () { if (!ac || muted) return; const t = ac.currentTime; noise('bandpass', 1800, 500, 2, 0.16, 0.16, t); },
  /* うめき声ふう。pitch = 声の高さ(Hz) */
  grunt: function (pitch) {
    if (!ac || muted) return; const t = ac.currentTime, f = ac.createBiquadFilter(), p = pitch * (0.9 + Math.random() * 0.25);
    f.type = 'bandpass'; f.frequency.value = 700 + Math.random() * 500; f.Q.value = 2.5; f.connect(master);
    osc('sawtooth', p * 1.25, p * 0.7, 0.17, 0.5, t, f);
  },
  dodge: function () { if (!ac || muted) return; noise('bandpass', 2400, 900, 3, 0.08, 0.1, ac.currentTime); },
  bell: function (n) {
    if (!ac || muted) return; n = n || 1;
    for (let i = 0; i < n; i++) { const t = ac.currentTime + i * 0.28; [523, 1046, 1568, 2093 * 1.01].forEach(function (f, k) { osc('sine', f, f, 1.1, 0.34 / (k + 1), t); }); noise('highpass', 5000, 5000, 1, 0.05, 0.2, t); }
  },
  down: function () {
    if (!ac || muted) return; const t = ac.currentTime;
    osc('sine', 220, 30, 0.6, 1, t); noise('lowpass', 2400, 200, 0.7, 0.7, 0.8, t);
    [392, 523, 659, 784].forEach(function (f, i) { osc('square', f, f, 0.12, 0.16, t + 0.08 + i * 0.07); });
  },
  thud: function () { if (!ac || muted) return; const t = ac.currentTime; osc('sine', 110, 35, 0.3, 0.9, t); noise('lowpass', 600, 120, 0.7, 0.25, 0.6, t); },
  pop: function () { if (!ac || muted) return; osc('sine', 300, 900, 0.09, 0.35, ac.currentTime); },
  boing: function () { if (!ac || muted) return; const t = ac.currentTime; osc('sine', 160, 480, 0.12, 0.4, t); osc('sine', 480, 200, 0.2, 0.3, t + 0.1); },
  twinkle: function () { if (!ac || muted) return; const t = ac.currentTime; [1568, 2093, 2637, 3136].forEach(function (f, i) { osc('sine', f, f, 0.25, 0.18, t + i * 0.06); }); },
  poof: function () { if (!ac || muted) return; noise('lowpass', 1800, 300, 0.7, 0.3, 0.45, ac.currentTime); },
  beep: function (hi) { if (!ac || muted) return; osc('square', hi ? 1320 : 880, hi ? 1320 : 880, hi ? 0.4 : 0.12, 0.2, ac.currentTime); },
  combo: function (n) { if (!ac || muted) return; const t = ac.currentTime, f = 440 * Math.pow(2, Math.min(n, 12) / 12); osc('triangle', f, f * 1.5, 0.14, 0.3, t); osc('triangle', f * 1.5, f * 2, 0.16, 0.25, t + 0.07); },
  cheer: function () { if (!ac || muted) return; noise('bandpass', 900, 1500, 0.6, 1.4, 0.3, ac.currentTime); },
  tap: function () { if (!ac || muted) return; osc('sine', 660, 990, 0.07, 0.25, ac.currentTime); },
  /* うしろで鳴る 太鼓とベース(気分を上げる)。root = 低い音の高さ */
  bgm: function (on, root) {
    if (!ac) return;
    bgmOn = on; if (root) bgmRoot = root;
    if (on && !bgmTimer) { bgmStep = 0; bgmNext = ac.currentTime + 0.05; bgmTimer = setInterval(bgmTick, 30); }
    if (!on && bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  }
};
const BASS = [0, 0, 12, 0, 3, 0, 12, 3, 5, 5, 12, 5, 7, 7, 10, 7];
function bgmTick() {
  if (!ac || !bgmOn) return;
  const sp = 60 / 152 / 4;
  while (bgmNext < ac.currentTime + 0.12) {
    const s = bgmStep % 16, t = bgmNext;
    if (!muted) {
      if (s % 4 === 0 || s === 10) { osc('sine', 130, 40, 0.16, 0.5, t); }
      if (s === 4 || s === 12) noise('bandpass', 1700, 1700, 0.8, 0.11, 0.2, t);
      if (s % 2 === 1) noise('highpass', 7000, 7000, 1, 0.03, 0.07, t);
      const f = bgmRoot * Math.pow(2, BASS[(bgmStep >> 0) % 16] / 12);
      if (s % 2 === 0) osc('sawtooth', f, f, sp * 1.6, 0.085, t);
    }
    bgmStep++; bgmNext += sp;
  }
}
