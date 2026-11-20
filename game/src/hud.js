// hud.js — HUD kaya: uang, nyawa, armor, Wanted, kecepatan, jam,
// radio, tracker 12 misi, counter relik, distrik, minimap + kompas.
import { MISSIONS, ACT_NAMES } from './missions.js';

const WORLD = { minX: -310, maxX: 345, minZ: -310, maxZ: 345 };

function toMap(x, z, size) {
  const px = ((x - WORLD.minX) / (WORLD.maxX - WORLD.minX)) * size;
  const pz = ((z - WORLD.minZ) / (WORLD.maxZ - WORLD.minZ)) * size;
  return [px, pz];
}

export function createHud() {
  const el = (id) => document.getElementById(id);
  const moneyEl = el('hud-money');
  const healthFill = el('hud-health-fill');
  const healthNum = el('hud-health-num');
  const armorFill = el('hud-armor-fill');
  const starsEl = el('hud-stars');
  const speedEl = el('hud-speed');
  const clockEl = el('hud-clock');
  const radioEl = el('hud-radio');
  const relicsEl = el('hud-relics');
  const districtEl = el('hud-district');
  const trackerEl = el('hud-tracker-list');
  const actEl = el('hud-act-name');
  const bannerEl = el('hud-banner');
  const missionBarEl = el('hud-missionbar');
  const promptEl = el('hud-prompt');
  const compassEl = el('hud-compass');
  const mapCanvas = el('hud-minimap');
  const mapCtx = mapCanvas.getContext('2d');
  const menuProgress = el('menu-progress');
  const menuRep = el('menu-rep');

  let bannerTimer = 0;

  function showBanner(text, seconds = 3.5) {
    bannerEl.textContent = text;
    bannerEl.style.display = 'block';
    bannerTimer = seconds;
  }

  function drawMinimap(snap) {
    const S = 190;
    mapCtx.clearRect(0, 0, S, S);
    mapCtx.fillStyle = '#16283d';
    mapCtx.fillRect(0, 0, S, S);
    // Laut & pantai (selatan)
    mapCtx.fillStyle = '#1e6f9e';
    const [, seaY] = toMap(0, 345, S);
    mapCtx.fillRect(0, toMap(0, 300, S)[1], S, S);
    mapCtx.fillStyle = '#e8d49a';
    mapCtx.fillRect(0, toMap(0, 295, S)[1], S, 6);
    // Jalan grid
    mapCtx.strokeStyle = '#3a4552';
    mapCtx.lineWidth = 4;
    for (let gx = -240; gx <= 320; gx += 80) {
      const [px] = toMap(gx, 0, S);
      mapCtx.beginPath(); mapCtx.moveTo(px, 0); mapCtx.lineTo(px, S); mapCtx.stroke();
    }
    for (let gz = -240; gz <= 280; gz += 80) {
      const [, pz] = toMap(0, gz, S);
      mapCtx.beginPath(); mapCtx.moveTo(0, pz); mapCtx.lineTo(S, pz); mapCtx.stroke();
    }
    // Label distrik
    mapCtx.font = 'bold 10px Arial';
    mapCtx.fillStyle = 'rgba(255,255,255,0.55)';
    const districtLabels = [
      ['Pusat', 0, -30], ['Pasar', -120, 60], ['Pelabuhan', 250, 360],
      ['Pantai', 0, 318], ['Bengkel', -222, 252],
    ];
    for (const [name, x, z] of districtLabels) {
      const [px, pz] = toMap(x, z, S);
      mapCtx.fillText(name, px - 14, pz - 12);
    }
    // Landmark
    const marks = [
      ['▲ Menara', snap.landmarks.menara, '#ffd23d'],
      ['■ Pasar', snap.landmarks.pasar, '#ff8ac2'],
      ['✚ RS', snap.landmarks.rs, '#ffffff'],
      ['⚒ Bengkel', snap.landmarks.bengkel, '#7dff9b'],
      ['⚓ Dermaga', snap.landmarks.dermaga, '#7fb0ff'],
    ];
    mapCtx.font = '10px Arial';
    for (const [label, lm, color] of marks) {
      const [px, pz] = toMap(lm.x, lm.z, S);
      mapCtx.fillStyle = color;
      mapCtx.beginPath(); mapCtx.arc(px, pz, 4, 0, Math.PI * 2); mapCtx.fill();
      mapCtx.fillText(label, px + 6, pz + 3);
    }
    // Garasi (G)
    if (snap.garages) {
      for (const g of snap.garages) {
        const [px, pz] = toMap(g.x, g.z, S);
        mapCtx.fillStyle = '#7dff9b';
        mapCtx.font = 'bold 11px Arial';
        mapCtx.fillText('G', px - 3, pz + 4);
      }
    }
    // Relik yang belum diambil
    if (snap.relicPositions) {
      mapCtx.fillStyle = '#ffd23d';
      for (const r of snap.relicPositions) {
        const [px, pz] = toMap(r.x, r.z, S);
        mapCtx.beginPath(); mapCtx.arc(px, pz, 1.8, 0, Math.PI * 2); mapCtx.fill();
      }
    }
    // Target misi
    if (snap.missionTarget) {
      const [px, pz] = toMap(snap.missionTarget.x, snap.missionTarget.z, S);
      mapCtx.strokeStyle = '#ffd23d';
      mapCtx.lineWidth = 2;
      mapCtx.beginPath(); mapCtx.arc(px, pz, 8, 0, Math.PI * 2); mapCtx.stroke();
      mapCtx.fillStyle = '#ffd23d';
      mapCtx.beginPath(); mapCtx.arc(px, pz, 3, 0, Math.PI * 2); mapCtx.fill();
    }
    // Mobil lalu lintas (abu-abu), polisi (biru), heli (merah)
    if (snap.trafficCars) {
      mapCtx.fillStyle = '#9aa5b1';
      for (const c of snap.trafficCars) {
        const [px, pz] = toMap(c.pos.x, c.pos.z, S);
        mapCtx.fillRect(px - 1.5, pz - 1.5, 3, 3);
      }
    }
    if (snap.policeCars) {
      mapCtx.fillStyle = '#3d7bff';
      for (const c of snap.policeCars) {
        if (!c.active) continue;
        const [px, pz] = toMap(c.pos.x, c.pos.z, S);
        mapCtx.beginPath(); mapCtx.arc(px, pz, 3.5, 0, Math.PI * 2); mapCtx.fill();
      }
    }
    if (snap.heli && snap.heli.visible) {
      const [px, pz] = toMap(snap.heli.position.x, snap.heli.position.z, S);
      mapCtx.fillStyle = '#ff3b30';
      mapCtx.font = 'bold 12px Arial';
      mapCtx.fillText('H', px - 4, pz + 4);
    }
    // Pemain (panah kuning)
    if (snap.playerPos) {
      const [px, pz] = toMap(snap.playerPos.x, snap.playerPos.z, S);
      mapCtx.save();
      mapCtx.translate(px, pz);
      mapCtx.rotate(Math.PI - (snap.heading || 0));
      mapCtx.fillStyle = '#ffd23d';
      mapCtx.beginPath();
      mapCtx.moveTo(0, -7); mapCtx.lineTo(5, 5); mapCtx.lineTo(-5, 5); mapCtx.closePath();
      mapCtx.fill();
      mapCtx.restore();
    }
  }

  return {
    showBanner,
    update(dt, snap) {
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0) bannerEl.style.display = 'none';
      }
      moneyEl.textContent = `$${snap.money}`;
      healthFill.style.width = `${Math.max(0, snap.health)}%`;
      healthNum.textContent = `${Math.round(snap.health)}`;
      armorFill.style.width = `${Math.max(0, snap.armor)}%`;
      const filled = '★'.repeat(snap.wanted) + '☆'.repeat(5 - snap.wanted);
      starsEl.textContent = filled;
      starsEl.classList.toggle('hot', snap.wanted > 0);
      speedEl.innerHTML = `${Math.round(snap.speedKmh)} <small>km/h</small>`;
      clockEl.textContent = `🕔 ${snap.clockText}`;
      radioEl.textContent = `📻 ${snap.radioStation}`;
      relicsEl.textContent = `◆ Relik ${snap.relicsFound}/${snap.relicsTotal}`;
      districtEl.textContent = `Distrik: ${snap.districtName} ★ ${snap.districtRep}`;
      const act = snap.currentAct || 1;
      actEl.textContent = ACT_NAMES[act] || ACT_NAMES[1];
      // Tracker 12 misi
      let html = '';
      for (const m of MISSIONS) {
        const done = snap.missionsDone.includes(m.id);
        const active = snap.missionActiveId === m.id;
        const mark = done ? '✓' : active ? '►' : '○';
        const cls = done ? 'done' : active ? 'active' : '';
        html += `<li class="${cls}">${mark} ${m.name} — $${m.reward}</li>`;
      }
      trackerEl.innerHTML = html;
      if (snap.missionActive) {
        missionBarEl.style.display = 'block';
        missionBarEl.textContent = `🎯 ${snap.missionActive.def.name} — ${Math.ceil(snap.missionTimer)} dtk • $${snap.missionActive.def.reward}`;
      } else {
        missionBarEl.style.display = 'none';
      }
      if (snap.prompt) {
        promptEl.style.display = 'block';
        promptEl.textContent = snap.prompt;
      } else {
        promptEl.style.display = 'none';
      }
      const deg = ((snap.headingDeg || 0) % 360 + 360) % 360;
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const dirName = dirs[Math.round(deg / 45) % 8];
      compassEl.textContent = `${dirName} ↑ ${String(Math.round(deg)).padStart(3, '0')}°`;
      drawMinimap(snap);
      // Menu
      menuProgress.textContent = `${snap.missionsDone.length}/12 misi • Babak ${act} • Relik ${snap.relicsFound}/${snap.relicsTotal} • $${snap.money}`;
      if (snap.districtList) {
        let repHtml = '';
        for (const d of snap.districtList) {
          repHtml += `<div class="rrow"><span>${d.name}</span><div class="bar"><div style="width:${d.rep}%"></div></div><b>${d.rep}</b></div>`;
        }
        menuRep.innerHTML = repHtml;
      }
    },
  };
}
