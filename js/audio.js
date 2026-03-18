// js/audio.js
// Web Audio API sound effects. Pure synthesis — no audio files needed.

let _ctx = null;
let muted = false;

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function toggleMute() {
  muted = !muted;
  document.getElementById('mute-btn').textContent = muted ? '🔇 SFX' : '🔊 SFX';
}

function tone(freq, type, vol, dur, t0 = 0) {
  if (muted) return;
  try {
    const a = ctx(), n = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.connect(g);
    g.connect(a.destination);
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, n + t0);
    g.gain.linearRampToValueAtTime(vol, n + t0 + .005);
    g.gain.exponentialRampToValueAtTime(.0001, n + t0 + dur);
    o.start(n + t0);
    o.stop(n + t0 + dur + .05);
  } catch (e) {}
}

function noise(vol, dur, t0 = 0, freq = 600) {
  if (muted) return;
  try {
    const a = ctx(), n = a.currentTime;
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * (dur + .05)), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    const g = a.createGain();
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1;
    src.buffer = buf;
    src.connect(f);
    f.connect(g);
    g.connect(a.destination);
    g.gain.setValueAtTime(vol, n + t0);
    g.gain.exponentialRampToValueAtTime(.0001, n + t0 + dur);
    src.start(n + t0);
    src.stop(n + t0 + dur + .06);
  } catch (e) {}
}

const SFX = {
  correct() { tone(1100, 'sine', .06, .055); },
  error()   { tone(160, 'sawtooth', .15, .1); noise(.06, .08, 0, 300); },
  coin()    { tone(1046, 'sine', .18, .06); tone(1318, 'sine', .16, .07, .07); tone(1568, 'sine', .22, .15, .14); },
  item()    { tone(440, 'square', .13, .05); tone(660, 'square', .15, .08, .07); tone(880, 'square', .18, .12, .15); },
  boost()   { [300,380,480,600,750].forEach((f,i) => tone(f, 'sine', .14, .1, i*.05)); },
  star()    { [523,659,784,1047,784,1047,1318].forEach((f,i) => tone(f, 'square', .12, .1, i*.07)); },
  hit()     { tone(220, 'sawtooth', .22, .06); noise(.18, .22, 0, 500); tone(110, 'sawtooth', .16, .2, .07); },
  slow()    { [440,370,300,230].forEach((f,i) => tone(f, 'sawtooth', .14, .1, i*.06)); },
  beep(hi)  { tone(hi ? 880 : 440, 'square', .2, .18); },
  go()      { [523,659,784,1047].forEach((f,i) => tone(f, 'square', .2, .12, i*.09)); },
  finish()  { [523,523,523,523,415,466,523,784].forEach((f,i) => tone(f, 'square', .2, .15, i*.12)); },
  winner()  { [784,784,784,659,784,880,988,1047].forEach((f,i) => tone(f, 'sine', .22, .18, i*.1)); },
  select()  { tone(660, 'square', .15, .08); tone(880, 'square', .14, .1, .09); },
};
