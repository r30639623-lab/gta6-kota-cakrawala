// audio.js — Semua efek suara Kota Cakrawala dibuat prosedural
// dengan WebAudio (oscillator + noise): mesin, sirene, tabrakan, cash,
// gagal, menang, tembakan, klakson, blip HP, denting ability kru.
// Tanpa file suara sama sekali. Semua panggilan aman jadi no-op kalau
// AudioContext belum diizinkan (headless / sebelum interaksi).

export function createAudio() {
  let ctx = null;
  let master = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenTimer = null;
  let sirenOn = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null) {
    if (!ensure() || ctx.state === 'suspended') return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + dur + 0.02);
    } catch {
      // abaikan
    }
  }

  function burst(dur, vol = 0.25, cutoff = 400) {
    if (!ensure() || ctx.state === 'suspended') return;
    try {
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(filter);
      filter.connect(g);
      g.connect(master);
      src.start();
    } catch {
      // abaikan
    }
  }

  return {
    resume() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    engine(level01) {
      if (!ensure() || ctx.state === 'suspended') return;
      try {
        if (!engineOsc) {
          engineOsc = ctx.createOscillator();
          engineOsc.type = 'sawtooth';
          engineGain = ctx.createGain();
          engineGain.gain.value = 0;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 900;
          engineOsc.connect(filter);
          filter.connect(engineGain);
          engineGain.connect(master);
          engineOsc.start();
        }
        engineOsc.frequency.setTargetAtTime(55 + level01 * 165, ctx.currentTime, 0.08);
        engineGain.gain.setTargetAtTime(0.02 + level01 * 0.05, ctx.currentTime, 0.1);
      } catch {
        // abaikan
      }
    },
    engineOff() {
      if (engineGain && ctx) engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    },
    siren(on) {
      if (on === sirenOn) return;
      sirenOn = on;
      if (!on) {
        if (sirenTimer) clearInterval(sirenTimer);
        sirenTimer = null;
        return;
      }
      if (!ensure()) return;
      let high = true;
      sirenTimer = setInterval(() => {
        tone(high ? 880 : 660, 0.32, 'triangle', 0.05);
        high = !high;
      }, 340);
    },
    crash() {
      burst(0.25, 0.4, 900);
      tone(70, 0.2, 'square', 0.15, 40);
    },
    cash() {
      tone(1320, 0.09, 'sine', 0.16);
      setTimeout(() => tone(1760, 0.14, 'sine', 0.16), 90);
    },
    fail() {
      tone(220, 0.35, 'sawtooth', 0.12, 110);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.14), i * 110));
    },
    shoot() {
      burst(0.08, 0.3, 2400);
    },
    horn() {
      tone(370, 0.28, 'square', 0.1);
      tone(466, 0.28, 'square', 0.08);
    },
    click() {
      tone(900, 0.05, 'square', 0.08);
    },
    blip() {
      tone(1100, 0.07, 'sine', 0.12);
      setTimeout(() => tone(1400, 0.09, 'sine', 0.12), 70);
    },
    chime() {
      [880, 1174, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.12), i * 80));
    },
  };
}
