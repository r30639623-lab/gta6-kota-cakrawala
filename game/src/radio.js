// radio.js — Radio Kota Cakrawala: 3 stasiun musik prosedural (WebAudio).
// Tanpa file audio luar: tiap stasiun punya tempo, tangga nada, dan pola
// bass/melodi sendiri; lagu berganti otomatis tiap ~24 detik. Tombol R
// ganti stasiun saat mengemudi, tombol M tetap membisukan semuanya.
// Stasiun fiktif: "CKW Dangdut 88.4", "Pantai Rock 101.2", "Senja Lo-Fi 95.6".
// Semua nama lagu & penyiar fiktif, bukan lagu sungguhan.
export const STATIONS = [
  {
    id: 'dangdut',
    name: 'CKW Dangdut 88.4',
    dj: 'DJ Melati',
    bpm: 122,
    wave: 'square',
    root: 220.0, // A3
    scale: [0, 3, 5, 7, 10, 12, 15], // minor pentatonik
    bassSteps: [0, 0, 7, 5, 0, 0, 10, 7],
    color: '#ff5e8a',
    songs: ['Goyang Dermaga', 'Rindu di Pelabuhan', 'Kancil GT Melaju', 'Cinta Bu Sari'],
  },
  {
    id: 'rock',
    name: 'Pantai Rock 101.2',
    dj: 'DJ Ombak',
    bpm: 142,
    wave: 'sawtooth',
    root: 196.0, // G3
    scale: [0, 2, 3, 5, 7, 8, 10, 12],
    bassSteps: [0, 0, 3, 0, 5, 0, 3, 7],
    color: '#ff7a3c',
    songs: ['Gas Pol Pantai', 'Aspal Panas', 'Malam di Menara', 'Lari dari Sirene'],
  },
  {
    id: 'lofi',
    name: 'Senja Lo-Fi 95.6',
    dj: 'DJ Senja',
    bpm: 76,
    wave: 'triangle',
    root: 174.61, // F3
    scale: [0, 2, 4, 7, 9, 12, 14],
    bassSteps: [0, 7, 5, 3, 0, 7, 5, 10],
    color: '#b78cff',
    songs: ['Senja di Cakrawala', 'Kopi Pahit Bengkel', 'Hujan di Alun-Alun', 'Pulang Malam'],
  },
];

export class Radio {
  constructor(audio) {
    this.audio = audio; // GameAudio — pinjam AudioContext & master gain-nya
    this.stationIndex = 0;
    this.playing = false;
    this.nextNoteTime = 0;
    this.step = 0;
    this.songIndex = 0;
    this.songTimer = 0;
    this.radioGain = null;
    this.onStationChange = null; // (station, songTitle)
    this.onSongChange = null; // (songTitle)
  }

  get station() { return STATIONS[this.stationIndex]; }
  get songTitle() { return this.station.songs[this.songIndex % this.station.songs.length]; }
  get label() { return `${this.station.name} — ${this.songTitle}`; }

  /** Nyalakan radio (butuh AudioContext dari GameAudio). */
  start() {
    this.audio.ensure();
    if (!this.audio.ctx) return false;
    if (!this.radioGain) {
      this.radioGain = this.audio.ctx.createGain();
      this.radioGain.gain.value = 0.16;
      this.radioGain.connect(this.audio.master);
    }
    this.playing = true;
    this.nextNoteTime = this.audio.ctx.currentTime + 0.08;
    this.step = 0;
    this.songTimer = 0;
    this._notify();
    return true;
  }

  stop() {
    this.playing = false;
    if (this.radioGain) this.radioGain.gain.setTargetAtTime(0, this.audio.ctx.currentTime, 0.05);
  }

  toggle() {
    if (this.playing) { this.stop(); return false; }
    return this.start();
  }

  nextStation() {
    this.stationIndex = (this.stationIndex + 1) % STATIONS.length;
    this.songIndex = 0;
    this.songTimer = 0;
    this.step = 0;
    if (this.audio.ctx) this.nextNoteTime = this.audio.ctx.currentTime + 0.05;
    this._notify();
    return this.station;
  }

  prevStation() {
    this.stationIndex = (this.stationIndex - 1 + STATIONS.length) % STATIONS.length;
    this.songIndex = 0;
    this.songTimer = 0;
    this.step = 0;
    if (this.audio.ctx) this.nextNoteTime = this.audio.ctx.currentTime + 0.05;
    this._notify();
    return this.station;
  }

  _notify() {
    if (this.onStationChange) this.onStationChange(this.station, this.songTitle);
  }

  /** Satu nada terjadwal: osilator pendek + envelope turun. */
  _note(freq, time, dur, type, vol) {
    const ctx = this.audio.ctx;
    if (!ctx || !this.radioGain) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g);
    g.connect(this.radioGain);
    o.start(time);
    o.stop(time + dur + 0.02);
  }

  /** Ketukan drum prosedural (noise pendek) untuk stasiun rock/dangdut. */
  _hat(time, vol) {
    const ctx = this.audio.ctx;
    if (!ctx || !this.radioGain) return;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(this.radioGain);
    src.start(time);
  }

  /** Jadwalkan satu langkah 1/8 ketuk: bass + melodi + hat. */
  _scheduleStep(step, time) {
    const st = this.station;
    const eighth = 60 / st.bpm / 2;
    const semitone = (n) => st.root * Math.pow(2, n / 12);
    // Bass: pola 8 langkah, nada rendah tiap ketuk genap.
    const bassNote = st.bassSteps[step % st.bassSteps.length];
    if (step % 2 === 0) this._note(semitone(bassNote) / 2, time, eighth * 1.8, 'sine', 0.5);
    // Melodi: pseudo-acak deterministik dari nomor lagu + langkah.
    const seed = (this.songIndex * 31 + step * 7) % 97;
    if (seed % 3 !== 0) {
      const deg = st.scale[seed % st.scale.length];
      const oct = seed % 5 === 0 ? 12 : 0;
      this._note(semitone(deg + oct), time, eighth * 0.9, st.wave, 0.16);
    }
    // Hat di ketuk ganjil (rock & dangdut), lo-fi lebih jarang.
    if (st.id === 'lofi' ? step % 4 === 2 : step % 2 === 1) this._hat(time, 0.12);
  }

  /** Dipanggil tiap frame: jadwalkan nada 0,15 detik ke depan, ganti lagu. */
  update(dt) {
    if (!this.playing || !this.audio.ctx) return;
    if (this.radioGain) this.radioGain.gain.setTargetAtTime(0.16, this.audio.ctx.currentTime, 0.1);
    this.songTimer += dt;
    if (this.songTimer > 24) {
      this.songTimer = 0;
      this.songIndex = (this.songIndex + 1) % this.station.songs.length;
      if (this.onSongChange) this.onSongChange(this.songTitle);
      this._notify();
    }
    const st = this.station;
    const eighth = 60 / st.bpm / 2;
    while (this.nextNoteTime < this.audio.ctx.currentTime + 0.15) {
      this._scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += eighth;
      this.step++;
    }
  }
}
