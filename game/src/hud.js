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
    // Panel baru round 2: nyawa, lapis baja, jam, radio, tracker misi.
    this.healthFill = document.getElementById('hud-health-fill');
    this.armourFill = document.getElementById('hud-armour-fill');
    this.armourRow = document.getElementById('hud-armour-row');
    this.healthText = document.getElementById('hud-health-text');
    this.clockEl = document.getElementById('hud-clock');
    this.radioEl = document.getElementById('hud-radio');
    this.trackerEl = document.getElementById('hud-tracker');
    this.lastHealth = -1;
    this.lastArmour = -1;
    this.lastClock = '';
    this.lastRadio = '';
    this.lastTracker = '';
  }

  /** Bar nyawa (hijau) & lapis baja (biru) Raka. */
  setHealth(health, armour) {
    const h = Math.max(0, Math.round(health));
    const a = Math.max(0, Math.round(armour));
    if (h !== this.lastHealth) {
      this.lastHealth = h;
      this.healthFill.style.width = `${h}%`;
      this.healthFill.classList.toggle('low', h <= 30);
      this.healthText.textContent = `♥ ${h}`;
    }
    if (a !== this.lastArmour) {
      this.lastArmour = a;
      this.armourFill.style.width = `${a}%`;
      if (this.armourRow) this.armourRow.style.display = a > 0 ? 'flex' : 'none';
    }
  }

  /** Jam dalam game (format 24 jam, mis. 14:35). */
  setClock(hours) {
    const h = Math.floor(hours) % 24;
    const m = Math.floor((hours % 1) * 60);
    const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (label !== this.lastClock) {
      this.lastClock = label;
      this.clockEl.textContent = `🕐 ${label}`;
      this.clockEl.classList.toggle('night', h >= 18 || h < 6);
    }
  }

  /** Tampilan radio: nama stasiun + lagu, atau "Radio mati (R)". */
  setRadio(label, on) {
    const text = on ? `♪ ${label}` : '♪ Radio mati — tekan R';
    if (text !== this.lastRadio) {
      this.lastRadio = text;
      this.radioEl.textContent = text;
      this.radioEl.classList.toggle('off', !on);
    }
  }

  /** Tracker misi: daftar 8 misi dengan status ✓ / ▶ / ○. */
  setTracker(list) {
    if (!list || !this.trackerEl) return;
    const html = list.map((m) => {
      const mark = m.done ? '✓' : m.active ? '▶' : m.current ? '○' : '·';
      const cls = m.done ? 'done' : m.active ? 'active' : m.current ? 'current' : '';
      return `<div class="tracker-row ${cls}"><span class="tracker-mark">${mark}</span> ${m.typeLabel} ${m.title.replace(/^Misi \d+ — /, '')} <span class="tracker-reward">$${m.reward}</span></div>`;
    }).join('');
    if (html !== this.lastTracker) {
      this.lastTracker = html;
      this.trackerEl.innerHTML = `<div class="tracker-head">📋 MISI BU SARI (${list.filter((m) => m.done).length}/8)</div>${html}`;
    }
  }

  /** Kilat merah saat Raka kena damage (umpan balik combat). */
  flashDamage() {
    this.healthFill.parentElement.classList.add('hit');
    setTimeout(() => this.healthFill.parentElement.classList.remove('hit'), 180);
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
    // Landmark round 2: Menara (cyan), Pasar (hijau), RS (putih + palang).
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(toMap(210) - 4, toMap(-210) - 4, 8, 8);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(toMap(-150) - 5, toMap(150) - 5, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(toMap(210) - 4, toMap(210) - 4, 8, 8);
    ctx.fillStyle = '#ff2a2a';
    ctx.fillRect(toMap(210) - 1, toMap(210) - 3, 2, 6);
    ctx.fillRect(toMap(210) - 3, toMap(210) - 1, 6, 2);
    // Label distrik di minimap (kecil, abu terang).
    ctx.fillStyle = 'rgba(230,238,248,0.75)';
    ctx.font = '9px sans-serif';
    ctx.fillText('MENARA', toMap(210) - 16, toMap(-210) - 8);
    ctx.fillText('PASAR', toMap(-150) - 12, toMap(150) + 16);
    ctx.fillText('RS', toMap(210) + 7, toMap(210) + 3);
    ctx.fillText('PANTAI', toMap(360) - 14, toMap(0) - 6);
    // Kompas: utara di atas.
    ctx.fillStyle = '#ffd75e';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('N ↑', S - 22, 14);
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
    // Helikopter polisi (biru, huruf H) — wanted 4–5.
    if (state.heli) {
      ctx.fillStyle = '#3a86ff';
      ctx.beginPath();
      ctx.arc(toMap(state.heli.pos.x), toMap(state.heli.pos.z), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('H', toMap(state.heli.pos.x) - 3, toMap(state.heli.pos.z) + 3);
    }
    // Roadblock polisi (kotak merah bergaris).
    if (state.roadblocks) {
      ctx.strokeStyle = '#ff2a2a';
      ctx.lineWidth = 2;
      for (const rb of state.roadblocks) {
        ctx.strokeRect(toMap(rb.pos.x) - 6, toMap(rb.pos.z) - 6, 12, 12);
        ctx.fillStyle = '#ff2a2a';
        ctx.fillRect(toMap(rb.pos.x) - 2, toMap(rb.pos.z) - 2, 4, 4);
      }
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
