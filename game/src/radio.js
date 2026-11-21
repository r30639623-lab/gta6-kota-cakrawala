// radio.js — 3 stasiun musik prosedural WebAudio untuk Kota Cakrawala:
// "Cakrawala FM" (pop ceria), "Senja 88" (lo-fi santai), "Dangdut Pantai"
// (dangdut koplo). Melodi di-sequencer dengan oscillator, tanpa file audio.

const STATIONS = [
  {
    name: 'Cakrawala FM',
    bpm: 116,
    wave: 'square',
    bass: [55, 55, 65.4, 49],
    lead: [220, 261.6, 329.6, 392, 329.6, 261.6, 220, 196],
  },
  {
    name: 'Senja 88',
    bpm: 76,
    wave: 'sine',
    bass: [65.4, 49, 55, 58.3],
    lead: [261.6, 293.7, 329.6, 293.7, 261.6, 220, 196, 220],
  },
  {
    name: 'Dangdut Pantai',
    bpm: 132,
    wave: 'triangle',
    bass: [73.4, 73.4, 87.3, 65.4],
    lead: [293.7, 329.6, 392, 440, 392, 349.2, 329.6, 293.7],
  },
];

export function createRadio() {
  let ctx = null;
  let master = null;
  let timer = null;
  let step = 0;
  let stationIndex = 0;
  let playing = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.12;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function note(freq, dur, type, vol) {
    if (!ctx || ctx.state === 'suspended') return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
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

  function tick() {
    const st = STATIONS[stationIndex];
    const beat = 60 / st.bpm / 2;
    const bar = step % 8;
    note(st.bass[Math.floor(bar / 2)], beat * 1.8, 'sine', 0.2);
    if (bar % 2 === 0) note(st.lead[bar], beat * 1.6, st.wave, 0.09);
    if (bar === 4) note(st.lead[bar] * 2, beat, st.wave, 0.05);
    step++;
    timer = setTimeout(tick, beat * 1000);
  }

  return {
    get station() {
      return STATIONS[stationIndex].name;
    },
    get stations() {
      return STATIONS.map((s) => s.name);
    },
    get playing() {
      return playing;
    },
    start() {
      if (playing) return;
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      playing = true;
      step = 0;
      tick();
    },
    stop() {
      playing = false;
      if (timer) clearTimeout(timer);
      timer = null;
    },
    next() {
      stationIndex = (stationIndex + 1) % STATIONS.length;
      step = 0;
      return STATIONS[stationIndex].name;
    },
  };
}
