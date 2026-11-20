// audio.js — Efek suara prosedural WebAudio (tanpa file audio).
// Semua method aman dipanggil sebelum AudioContext dibuat (no-op).
export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenTimer = null;
  let sirenOn = false;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
      } catch { return false; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return !!ctx;
  }

  function blip(freq, dur, type, vol, when = 0) {
    if (!ensure()) return;
    try {
      const t = ctx.currentTime + when;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch { /* abaikan */ }
  }

  function noiseBurst(dur, vol) {
    if (!ensure()) return;
    try {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = vol || 0.2;
      src.connect(g).connect(ctx.destination);
      src.start();
    } catch { /* abaikan */ }
  }

  return {
    ensure,
    cash() { blip(880, 0.12, 'sine', 0.15); blip(1320, 0.18, 'sine', 0.15, 0.09); blip(1760, 0.22, 'sine', 0.12, 0.18); },
    crash() { noiseBurst(0.25, 0.3); blip(90, 0.2, 'square', 0.12); },
    fail() { blip(220, 0.25, 'sawtooth', 0.12); blip(165, 0.35, 'sawtooth', 0.12, 0.2); },
    success() { blip(523, 0.14, 'triangle', 0.15); blip(659, 0.14, 'triangle', 0.15, 0.12); blip(784, 0.28, 'triangle', 0.16, 0.24); },
    horn() { blip(370, 0.18, 'square', 0.1); blip(466, 0.18, 'square', 0.08); },
    shot() { noiseBurst(0.08, 0.25); blip(140, 0.08, 'square', 0.12); },
    punch() { noiseBurst(0.1, 0.2); blip(120, 0.1, 'sine', 0.15); },
    click() { blip(600, 0.05, 'square', 0.07); },
    engineStart() {
      if (!ensure()) return;
      try {
        if (engineOsc) return;
        engineOsc = ctx.createOscillator();
        engineGain = ctx.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 55;
        engineGain.gain.value = 0.0;
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 420;
        engineOsc.connect(filt).connect(engineGain).connect(ctx.destination);
        engineOsc.start();
      } catch { /* abaikan */ }
    },
    engine(speedNorm, driving) {
      if (!engineOsc || !engineGain) return;
      try {
        const target = driving ? 0.03 + speedNorm * 0.05 : 0.0;
        engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
        engineOsc.frequency.setTargetAtTime(55 + speedNorm * 160, ctx.currentTime, 0.1);
      } catch { /* abaikan */ }
    },
    engineStop() {
      if (engineOsc) { try { engineOsc.stop(); } catch { /* abaikan */ } engineOsc = null; engineGain = null; }
    },
    siren(on) {
      if (on === sirenOn) return;
      sirenOn = on;
      if (sirenTimer) { clearInterval(sirenTimer); sirenTimer = null; }
      if (!on) return;
      let high = false;
      sirenTimer = setInterval(() => {
        if (!sirenOn) return;
        high = !high;
        blip(high ? 880 : 660, 0.35, 'sine', 0.05);
      }, 380);
    },
  };
}
