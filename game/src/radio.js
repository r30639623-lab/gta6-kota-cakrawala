// radio.js — 3 procedural WebAudio radio stations. Each station is a loop
// of notes on a pentatonic-ish scale; R cycles stations.
export const STATIONS = [
  {
    name: 'Cakrawala FM',
    bpm: 112,
    notes: [262, 294, 330, 392, 440, 392, 330, 294, 262, 330, 392, 523, 440, 392, 330, 262],
    wave: 'triangle',
  },
  {
    name: 'Pantai Vibes',
    bpm: 88,
    notes: [196, 0, 247, 0, 294, 0, 247, 196, 220, 0, 262, 0, 294, 247, 220, 196],
    wave: 'sine',
  },
  {
    name: 'Neon Nights',
    bpm: 128,
    notes: [220, 220, 277, 330, 277, 220, 196, 247, 220, 330, 392, 330, 277, 247, 220, 196],
    wave: 'square',
  },
];

export function createRadio(audio) {
  let station = 0;
  let playing = false;
  let step = 0;
  let nextTime = 0;
  let bassStep = 0;

  function stepDur() { return 60 / STATIONS[station].bpm / 2; }

  return {
    get station() { return station; },
    get name() { return STATIONS[station].name; },
    get on() { return playing; },
    next() {
      station = (station + 1) % STATIONS.length;
      step = 0;
      return STATIONS[station].name;
    },
    start() { playing = true; nextTime = 0; },
    stop() { playing = false; },
    update(dt) {
      if (!playing) return;
      const st = STATIONS[station];
      nextTime -= dt;
      while (nextTime <= 0) {
        nextTime += stepDur();
        const n = st.notes[step % st.notes.length];
        if (n > 0) audio.note(n, stepDur() * 0.9, st.wave, 0.05);
        // Soft bass on the beat.
        if (bassStep % 4 === 0) audio.note(st.notes[0] / 2, stepDur() * 1.8, 'sine', 0.07);
        step++;
        bassStep++;
      }
    },
  };
}
