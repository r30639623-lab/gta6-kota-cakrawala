// audio.js — all sound in Kota Cakrawala is procedural WebAudio:
// engine hum, sirens, crashes, gunshots and radio music. No audio files.
export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let sirenTimer = 0;
  let sirenHigh = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      engineOsc.connect(lp).connect(engineGain).connect(ctx.destination);
      engineOsc.start();
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'triangle';
      sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain).connect(ctx.destination);
      sirenOsc.start();
    } catch (err) {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0) {
    if (!ensure()) return;
    try {
      const t0 = ctx.currentTime + when;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol || 0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (err) { /* audio is best-effort */ }
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
    } catch (err) { /* ignore */ }
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    engine(speedNorm, driving) {
      if (!ensure()) return;
      try {
        const target = driving ? 0.05 + speedNorm * 0.09 : 0.0;
        engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
        engineOsc.frequency.setTargetAtTime(52 + speedNorm * 165, ctx.currentTime, 0.1);
      } catch (err) { /* ignore */ }
    },
    siren(on, dt) {
      if (!ensure()) return;
      try {
        sirenGain.gain.setTargetAtTime(on ? 0.035 : 0, ctx.currentTime, 0.1);
        if (on) {
          sirenTimer += dt;
          if (sirenTimer > 0.45) {
            sirenTimer = 0;
            sirenHigh = !sirenHigh;
            sirenOsc.frequency.setTargetAtTime(sirenHigh ? 950 : 660, ctx.currentTime, 0.05);
          }
        }
      } catch (err) { /* ignore */ }
    },
    beep() { tone(880, 0.12, 'sine', 0.12); tone(1320, 0.1, 'sine', 0.08, 0.1); },
    cash() { tone(1046, 0.1, 'triangle', 0.14); tone(1318, 0.12, 'triangle', 0.14, 0.09); tone(1568, 0.2, 'triangle', 0.14, 0.18); },
    crash(hard) { noiseBurst(hard ? 0.35 : 0.15, hard ? 0.35 : 0.15); tone(70, 0.25, 'sine', 0.25); },
    punch() { noiseBurst(0.08, 0.2); },
    gunshot(big) { noiseBurst(big ? 0.22 : 0.12, big ? 0.3 : 0.22); tone(big ? 140 : 190, 0.1, 'square', 0.12); },
    horn() { tone(370, 0.35, 'square', 0.07); tone(466, 0.35, 'square', 0.05); },
    click() { tone(1200, 0.05, 'square', 0.06); },
    missionStart() { tone(523, 0.15, 'triangle', 0.14); tone(659, 0.15, 'triangle', 0.14, 0.12); tone(784, 0.3, 'triangle', 0.14, 0.24); },
    fail() { tone(392, 0.2, 'sawtooth', 0.1); tone(311, 0.35, 'sawtooth', 0.1, 0.18); },
    note(freq, dur, type, vol, when) { tone(freq, dur, type, vol, when); },
  };
}
