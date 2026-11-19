// hud.js — HUD Kota Cakrawala: uang, wanted (bintang), kecepatan, objektif
// misi + timer, prompt interaksi, dan minimap 2D (canvas): jalan, gedung,
// pantai, pemain, polisi, lalu lintas, dan penanda misi.
import { CITY } from './city.js';

export class Hud {
  constructor() {
    this.moneyEl = document.getElementById('hud-money');
    this.wantedEl = document.getElementById('hud-wanted');
    this.speedEl = document.getElementById('hud-speed');
    this.objectiveEl = document.getElementById('hud-objective');
    this.timerEl = document.getElementById('hud-timer');
    this.promptEl = document.getElementById('hud-prompt');
    this.toastEl = document.getElementById('hud-toast');
    this.minimap = document.getElementById('minimap');
    this.mapCtx = this.minimap.getContext('2d');
    this.toastTimer = 0;
    this.lastMoney = -1;
    this.lastWanted = -1;
  }

  setMoney(money) {
    if (money !== this.lastMoney) {
      this.moneyEl.textContent = `$${money}`;
      this.lastMoney = money;
    }
  }

  setWanted(level) {
    if (level === this.lastWanted) return;
    this.lastWanted = level;
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < level ? '★' : '☆';
    this.wantedEl.textContent = stars;
    this.wantedEl.classList.toggle('hot', level > 0);
  }

  setSpeed(kmh, inCar) {
    this.speedEl.style.display = inCar ? 'block' : 'none';
    if (inCar) this.speedEl.textContent = `${Math.round(kmh)} km/h`;
  }

  setObjective(text, timeLeft) {
    this.objectiveEl.textContent = text;
    if (timeLeft != null) {
      const t = Math.max(0, Math.ceil(timeLeft));
      this.timerEl.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
      this.timerEl.classList.toggle('urgent', t <= 15);
    } else {
      this.timerEl.textContent = '';
    }
  }

  setPrompt(text) {
    this.promptEl.textContent = text || '';
    this.promptEl.style.display = text ? 'block' : 'none';
  }

  toast(text, seconds = 3) {
    this.toastEl.textContent = text;
    this.toastEl.style.opacity = '1';
    this.toastTimer = seconds;
  }

  update(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastEl.style.opacity = '0';
    }
  }

  /** Gambar minimap: kota dari atas, pemain panah putih, polisi merah. */
  drawMinimap(state) {
    const ctx = this.mapCtx;
    const S = this.minimap.width;
    const world = 860; // -430..430
    const toMap = (v) => ((v + world / 2) / world) * S;
    ctx.clearRect(0, 0, S, S);
    // Latar: laut di timur & selatan, darat abu-abu.
    ctx.fillStyle = '#2f6f9f';
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#5d6b63';
    ctx.fillRect(0, 0, toMap(330), toMap(330));
    // Jalan.
    ctx.strokeStyle = '#3d3f45';
    ctx.lineWidth = 4;
    for (let v = -300; v <= 300; v += 60) {
      ctx.beginPath(); ctx.moveTo(toMap(v), toMap(-300)); ctx.lineTo(toMap(v), toMap(300)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toMap(-300), toMap(v)); ctx.lineTo(toMap(300), toMap(v)); ctx.stroke();
    }
    // Bengkel Bu Sari (oranye) & pelabuhan (kuning).
    ctx.fillStyle = '#ff8c1a';
    ctx.fillRect(toMap(-278), toMap(262), 16, 14);
    ctx.fillStyle = '#e8c33a';
    ctx.fillRect(toMap(50), toMap(340), 24, 8);
    // Lalu lintas (titik abu-abu).
    ctx.fillStyle = '#cfd6dd';
    for (const c of state.trafficCars) {
      ctx.fillRect(toMap(c.pos.x) - 1.5, toMap(c.pos.z) - 1.5, 3, 3);
    }
    // Penanda misi (kuning berdenyut).
    if (state.missionTarget) {
      const pulse = 5 + Math.sin(state.elapsed * 5) * 2;
      ctx.fillStyle = '#ffc21a';
      ctx.beginPath();
      ctx.arc(toMap(state.missionTarget.x), toMap(state.missionTarget.z), pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7a5b00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Polisi (merah).
    ctx.fillStyle = '#ff2a2a';
    for (const p of state.police) {
      ctx.beginPath();
      ctx.arc(toMap(p.pos.x), toMap(p.pos.z), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Pemain: panah putih searah hadap (peta: x = timur, y = selatan).
    const px = toMap(state.playerPos.x);
    const pz = toMap(state.playerPos.z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(Math.PI - state.playerHeading);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
