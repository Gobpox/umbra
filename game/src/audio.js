// UMBRA audio: everything synthesized in WebAudio — a slow modal pad that
// follows the chapter, footsteps, the sizzle of burning, crystal chimes, the
// wraith's low hum, and the small ceremonies of draft and dawn.

export function createAudio() {
  let ctx = null, master, musicGain, sfxGain, padNodes = [], humOsc = null, humGain = null;
  let musicVol = 0.7, sfxVol = 0.9, stepClock = 0;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = musicVol * 0.5; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(master);
      return true;
    } catch { return false; }
  }
  function tone(freq, dur, { type = 'sine', vol = 0.2, attack = 0.01, curve = 2.2, slide = 0, dest = null } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur * curve / 2.2);
    o.connect(g); g.connect(dest ?? sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, { vol = 0.15, freq = 1200, q = 0.8 } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = Math.max(1, (dur * ctx.sampleRate) | 0);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t);
  }
  // Chapter pads: two detuned triangles + a fifth, very slow attack.
  function setChapter(idx) {
    if (!ctx) return;
    for (const n of padNodes) { try { n.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2); n.o.stop(ctx.currentTime + 1.4); } catch {} }
    padNodes = [];
    const roots = [146.83, 174.61, 130.81, 110.0]; // D3 F3 C3 A2
    const root = roots[idx] ?? 146.83;
    for (const [mult, vol] of [[1, 0.055], [1.5, 0.03], [2.02, 0.018]]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = root * mult; o.detune.value = Math.random() * 8 - 4;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2.5);
      o.connect(g); g.connect(musicGain); o.start();
      padNodes.push({ o, g });
    }
  }
  function setHum(on) {
    if (!ctx) return;
    if (on && !humOsc) {
      humOsc = ctx.createOscillator(); humGain = ctx.createGain();
      humOsc.type = 'sawtooth'; humOsc.frequency.value = 55;
      humGain.gain.value = 0.0;
      humGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 1.5);
      humOsc.connect(humGain); humGain.connect(musicGain); humOsc.start();
    } else if (!on && humOsc) {
      const o = humOsc, g = humGain; humOsc = null;
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      setTimeout(() => { try { o.stop(); } catch {} }, 900);
    }
  }
  return {
    unlock() { return ensure(); },
    setVolumes(m, s) { musicVol = m; sfxVol = s; if (musicGain) musicGain.gain.value = m * 0.5; if (sfxGain) sfxGain.gain.value = s; },
    setChapter, setHum,
    step(running) { const now = performance.now(); if (now - stepClock < (running ? 210 : 300)) return; stepClock = now; noise(0.05, { vol: 0.05, freq: 500 + Math.random() * 300 }); },
    burn() { noise(0.16, { vol: 0.10, freq: 2600, q: 2 }); },
    hurt() { tone(180, 0.25, { type: 'sawtooth', vol: 0.12, slide: -90 }); },
    die() { tone(320, 0.7, { type: 'triangle', vol: 0.2, slide: -260 }); noise(0.5, { vol: 0.08, freq: 700 }); },
    crystal() { tone(1318, 0.3, { vol: 0.12 }); setTimeout(() => tone(1760, 0.4, { vol: 0.1 }), 60); },
    gate() { for (const [i, f] of [523, 659, 784, 1046].entries()) setTimeout(() => tone(f, 0.5, { type: 'triangle', vol: 0.14 }), i * 90); },
    draft() { tone(392, 0.4, { type: 'triangle', vol: 0.1 }); setTimeout(() => tone(587, 0.5, { type: 'triangle', vol: 0.1 }), 110); },
    pick() { tone(784, 0.3, { vol: 0.12 }); setTimeout(() => tone(1174, 0.45, { vol: 0.1 }), 70); },
    synergy() { for (const [i, f] of [440, 554, 659, 880].entries()) setTimeout(() => tone(f, 0.6, { vol: 0.1 }), i * 70); },
    dawn() { for (const [i, f] of [392, 523, 659, 784, 1046, 1318].entries()) setTimeout(() => tone(f, 0.9, { type: 'triangle', vol: 0.12 }), i * 130); },
    click() { tone(660, 0.08, { vol: 0.06 }); },
    error() { tone(140, 0.18, { type: 'square', vol: 0.05 }); },
  };
}
