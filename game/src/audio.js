// audio.js — Semua suara Kota Cakrawala dibuat prosedural dengan WebAudio.
// Tanpa file audio luar: mesin, sirene polisi, pickup, pukulan, tabrakan,
// klik menu, dan jingle misi selesai. AudioContext dibuat saat interaksi
// pertama (kebijakan autoplay browser), M untuk bisu.
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenOn = false;
    this.sirenTimer = 0;
  }

  /** Dipanggil sekali setelah gesture pertama pengguna. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this._startEngineLoop();
    this._startSirenLoop();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  _startEngineLoop() {
    const ctx = this.ctx;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 700;
    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 60;
    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = 'square';
    this.engineOsc2.frequency.value = 30;
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    this.engineOsc.connect(this.engineFilter);
    this.engineOsc2.connect(g2);
    g2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc.start();
    this.engineOsc2.start();
  }

  /** speed 0..1, on = apakah pemain sedang mengemudi. */
  setEngine(speed, on) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const target = on ? 0.05 + speed * 0.11 : 0;
    this.engineGain.gain.setTargetAtTime(target, t, 0.1);
    const freq = 55 + speed * 165;
    this.engineOsc.frequency.setTargetAtTime(freq, t, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(freq * 0.5, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(500 + speed * 1600, t, 0.1);
  }

  _startSirenLoop() {
    const ctx = this.ctx;
    this.sirenGain = ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenOsc = ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.value = 750;
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.master);
    this.sirenOsc.start();
  }

  /** Sirene berbunyi saat wanted > 0; dipanggil tiap frame. */
  updateSiren(dt, wanted) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (wanted > 0) {
      this.sirenTimer += dt;
      // Dua nada bergantian ala sirene polisi (wail lambat).
      const phase = Math.floor(this.sirenTimer * 1.6) % 2;
      this.sirenOsc.frequency.setTargetAtTime(phase === 0 ? 720 : 980, t, 0.05);
      this.sirenGain.gain.setTargetAtTime(0.045, t, 0.2);
    } else {
      this.sirenGain.gain.setTargetAtTime(0, t, 0.2);
    }
  }

  _blip(freq, dur, type = 'sine', vol = 0.2, when = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  _noise(dur, vol, filterFreq, when = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  click() { this._blip(880, 0.07, 'sine', 0.15); }
  pickup() {
    this._blip(660, 0.09, 'sine', 0.22);
    this._blip(990, 0.12, 'sine', 0.22, 0.09);
  }
  punch() { this._noise(0.12, 0.35, 500); this._blip(120, 0.12, 'sine', 0.3); }
  crash(intensity = 1) { this._noise(0.25, 0.3 * intensity, 900); this._blip(70, 0.2, 'sine', 0.3); }
  door() { this._blip(300, 0.06, 'triangle', 0.18); this._blip(220, 0.08, 'triangle', 0.15, 0.06); }
  missionStart() {
    this._blip(523, 0.1, 'square', 0.12);
    this._blip(659, 0.1, 'square', 0.12, 0.1);
    this._blip(784, 0.16, 'square', 0.12, 0.2);
  }
  missionComplete() {
    [523, 659, 784, 1047].forEach((f, i) => this._blip(f, 0.18, 'triangle', 0.2, i * 0.11));
  }
  missionFail() {
    [392, 330, 262].forEach((f, i) => this._blip(f, 0.2, 'sawtooth', 0.12, i * 0.13));
  }
  wantedUp() { this._blip(1100, 0.08, 'square', 0.12); this._blip(1400, 0.12, 'square', 0.12, 0.08); }
}
