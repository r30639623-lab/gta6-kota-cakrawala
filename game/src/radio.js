// radio.js — 3 stasiun musik prosedural WebAudio.
export const STATIONS = [
  { name: 'Radio Cakrawala FM', desc: 'Dangdut koplo', scale: [0, 3, 5, 7, 10], base: 220, bpm: 132 },
  { name: 'Pantai Chill 88.4', desc: 'Reggae santai', scale: [0, 2, 4, 7, 9], base: 196, bpm: 76 },
  { name: 'Menara Rock 101.1', desc: 'Rock kota', scale: [0, 2, 3, 7, 8], base: 146, bpm: 120 },
];

export function createRadio(audio) {
  let station = 0;
  let timer = null;
  let step = 0;
  let ctx = null;
  let gainNode = null;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      gainNode = ctx.createGain();
      gainNode.gain.value = 0.05;
      gainNode.connect(ctx.destination);
    } catch { return null; }
    return ctx;
  }

  function noteFreq(st, degree) {
    const scale = st.scale;
    const oct = Math.floor(degree / scale.length);
    const idx = ((degree % scale.length) + scale.length) % scale.length;
    return st.base * Math.pow(2, oct + scale[idx] / 12);
  }

  function playStep() {
    const c = ensureCtx();
    if (!c || !gainNode) return;
    const st = STATIONS[station];
    const beat = 60 / st.bpm / 2;
    try {
      if (c.state === 'suspended') c.resume().catch(() => {});
      const mel = [0, 2, 1, 3, 4, 2, 0, 4];
      const degree = mel[step % mel.length] + (step % 16 >= 12 ? 5 : 0);
      const o = c.createOscillator();
      o.type = station === 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = noteFreq(st, degree);
      const g = c.createGain();
      g.gain.setValueAtTime(0.5, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + beat * 0.9);
      o.connect(g).connect(gainNode);
      o.start();
      o.stop(c.currentTime + beat);
      if (step % 2 === 0) {
        const b = c.createOscillator();
        b.type = 'sine';
        b.frequency.value = st.base / 2;
        const bg = c.createGain();
        bg.gain.setValueAtTime(0.6, c.currentTime);
        bg.gain.exponentialRampToValueAtTime(0.01, c.currentTime + beat);
        b.connect(bg).connect(gainNode);
        b.start();
        b.stop(c.currentTime + beat);
      }
    } catch { /* abaikan */ }
    step++;
  }

  function start() {
    ensureCtx();
    if (timer) return;
    const st = STATIONS[station];
    timer = setInterval(playStep, (60 / st.bpm / 2) * 1000);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  return {
    get station() { return station; },
    get name() { return STATIONS[station].name; },
    next() {
      station = (station + 1) % STATIONS.length;
      stop();
      start();
      return STATIONS[station].name;
    },
    setStation(i) { station = i % STATIONS.length; stop(); start(); },
    start,
    stop,
  };
}
