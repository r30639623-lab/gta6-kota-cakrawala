// hud.js — HUD Kota Cakrawala: uang, nyawa, armor, Wanted, kecepatan,
// jam, radio, tracker 12 misi, counter relik, distrik, minimap 2D
// berlabel + kompas, banner, prompt konteks, dan layar menu/pause.

import { MISSIONS, ACT_NAMES } from './missions.js';

export function createHud() {
  const el = (id) => document.getElementById(id);
  const moneyEl = el('hud-money');
  const healthFill = el('hud-health-fill');
  const armorFill = el('hud-armor-fill');
  const starsEl = el('hud-stars');
  const speedEl = el('hud-speed');
  const clockEl = el('hud-clock');
  const radioEl = el('hud-radio');
  const trackerEl = el('hud-tracker-list');
  const bannerEl = el('hud-banner');
  const promptEl = el('hud-prompt');
  const relicsEl = el('hud-relics');
  const districtEl = el('hud-district');
  const compassEl = el('hud-compass');
  const minimap = el('hud-minimap');
  const mapCtx = minimap.getContext('2d');
  const menuOverlay = el('menu-overlay');
  const menuProgress = el('menu-progress');
  const menuRep = el('menu-rep');
  let bannerTimer = null;

  function stars(n) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < n ? '★' : '☆';
    return s;
  }

  function showBanner(text, ms = 2600) {
    bannerEl.textContent = text;
    bannerEl.style.opacity = '1';
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      bannerEl.style.opacity = '0';
    }, ms);
  }

  function setPrompt(text) {
    promptEl.textContent = text || '';
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function drawMinimap(snap) {
    const W = 190;
    const H = 190;
    const scale = W / 680;
    const toMap = (x, z) => [95 + x * scale, 95 + z * scale];
    mapCtx.fillStyle = 'rgba(10,16,10,0.82)';
    mapCtx.fillRect(0, 0, W, H);
    // Laut & pantai.
    mapCtx.fillStyle = '#1e6f8e';
    mapCtx.fillRect(0, toMap(0, 300)[1], W, H - toMap(0, 300)[1]);
    mapCtx.fillStyle = '#d9c28a';
    mapCtx.fillRect(0, toMap(0, 290)[1], W, toMap(0, 300)[1] - toMap(0, 290)[1]);
    // Jalan.
    mapCtx.strokeStyle = '#5a6068';
    mapCtx.lineWidth = 3;
    for (const s of [-280, -200, -120, -40, 40, 120, 200, 280]) {
      const [x1] = toMap(s, 0);
      mapCtx.beginPath();
      mapCtx.moveTo(x1, 0);
      mapCtx.lineTo(x1, H);
      mapCtx.stroke();
      const [, y1] = toMap(0, s);
      mapCtx.beginPath();
      mapCtx.moveTo(0, y1);
      mapCtx.lineTo(W, y1);
      mapCtx.stroke();
    }
    // Label distrik.
    mapCtx.fillStyle = 'rgba(255,255,255,0.55)';
    mapCtx.font = '9px sans-serif';
    mapCtx.textAlign = 'center';
    for (const [name, x, z] of [
      ['Pusat', 0, -30],
      ['Pasar', -120, 60],
      ['Pelabuhan', 250, 330],
      ['Pantai', 0, 318],
      ['Bengkel', -222, 252],
    ]) {
      const [mx, my] = toMap(x, z);
      mapCtx.fillText(name, mx, my - 8);
    }
    // Landmark.
    const drawDot = (x, z, color, r = 3) => {
      const [mx, my] = toMap(x, z);
      mapCtx.fillStyle = color;
      mapCtx.beginPath();
      mapCtx.arc(mx, my, r, 0, Math.PI * 2);
      mapCtx.fill();
    };
    drawDot(0, -30, '#ffd23f', 4); // Menara
    drawDot(-120, 60, '#ff7fa8'); // Pasar
    drawDot(120, -120, '#ffffff'); // RS
    drawDot(-222, 252, '#2ec4b6'); // Bengkel
    drawDot(250, 360, '#ff9e57'); // Dermaga
    // Garasi (G).
    mapCtx.fillStyle = '#2ee6ff';
    mapCtx.font = 'bold 10px sans-serif';
    for (const g of snap.garages || []) {
      const [mx, my] = toMap(g.x, g.z);
      mapCtx.fillText('G', mx, my + 3);
    }
    // Relik yang belum diambil (titik emas kecil).
    if (snap.relicDots) {
      mapCtx.fillStyle = '#ffd23f';
      for (const [x, z] of snap.relicDots) {
        const [mx, my] = toMap(x, z);
        mapCtx.fillRect(mx - 1, my - 1, 2, 2);
      }
    }
    // Target misi (cincin kuning berdenyut).
    if (snap.missionTarget) {
      const [mx, my] = toMap(snap.missionTarget.x, snap.missionTarget.z);
      mapCtx.strokeStyle = '#ffd23f';
      mapCtx.lineWidth = 2;
      mapCtx.beginPath();
      mapCtx.arc(mx, my, 7 + Math.sin(performance.now() / 300) * 2, 0, Math.PI * 2);
      mapCtx.stroke();
    }
    // Polisi (titik biru) & helikopter (B).
    mapCtx.fillStyle = '#4488ff';
    for (const c of snap.policeCars || []) {
      const [mx, my] = toMap(c.x, c.z);
      mapCtx.beginPath();
      mapCtx.arc(mx, my, 2.5, 0, Math.PI * 2);
      mapCtx.fill();
    }
    if (snap.heli) {
      const [mx, my] = toMap(snap.heli.x, snap.heli.z);
      mapCtx.fillStyle = '#ff4444';
      mapCtx.font = 'bold 11px sans-serif';
      mapCtx.fillText('H', mx, my + 4);
    }
    // Pemain (panah putih).
    const [px, py] = toMap(snap.playerPos.x, snap.playerPos.z);
    mapCtx.save();
    mapCtx.translate(px, py);
    mapCtx.rotate(snap.heading);
    mapCtx.fillStyle = '#ffffff';
    mapCtx.beginPath();
    mapCtx.moveTo(0, -6);
    mapCtx.lineTo(4.5, 5);
    mapCtx.lineTo(-4.5, 5);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();
    // Batas pandang minimap.
    mapCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    mapCtx.lineWidth = 1;
    mapCtx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  function compass(deg) {
    const dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
    const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
    return dirs[idx];
  }

  return {
    showBanner,
    setPrompt,
    update(dt, snap) {
      moneyEl.textContent = `$${snap.money}`;
      healthFill.style.width = `${Math.max(0, Math.min(100, snap.health))}%`;
      armorFill.style.width = `${Math.max(0, Math.min(100, snap.armor))}%`;
      starsEl.textContent = stars(snap.wanted);
      starsEl.style.color = snap.wanted > 0 ? '#ff4444' : '#dddddd';
      speedEl.textContent = `${Math.round(snap.speedKmh)} km/h`;
      clockEl.textContent = snap.clockText;
      radioEl.textContent = `♪ ${snap.radioStation}`;
      relicsEl.textContent = `◆ Relik ${snap.relicsFound}/${snap.relicsTotal}`;
      districtEl.textContent = `Distrik: ${snap.districtName} ★ ${snap.districtRep}`;
      compassEl.textContent = compass(snap.headingDeg);
      // Tracker 12 misi.
      let html = '';
      for (const m of MISSIONS) {
        const done = snap.missionsDone.includes(m.id);
        const active = snap.activeMissionId === m.id;
        const mark = done ? '✓' : active ? '►' : '○';
        html += `<div class="tracker-row${active ? ' active' : ''}${done ? ' done' : ''}">${mark} ${m.name} — $${m.reward}</div>`;
      }
      trackerEl.innerHTML = html;
      drawMinimap(snap);
    },
    updateMissionBanner(active, timer) {
      if (!active) return;
      const banner = el('hud-mission');
      if (banner) banner.textContent = `${active.def.name} — ${fmtTime(timer)}`;
    },
    showMenu(save, districts, act) {
      menuOverlay.style.display = 'flex';
      menuProgress.textContent =
        `${save.missionsDone.length}/12 misi • ${ACT_NAMES[act]} • ◆ Relik ${save.relicsFound.length}/20 • $${save.money}`;
      let repHtml = '';
      for (const d of districts.list()) {
        repHtml += `<div class="rep-row"><span>${d.name}</span><div class="rep-bar"><div class="rep-fill" style="width:${d.rep}%"></div></div><span>${d.rep}</span></div>`;
      }
      menuRep.innerHTML = repHtml;
    },
    hideMenu() {
      menuOverlay.style.display = 'none';
    },
    showPause(show) {
      el('pause-overlay').style.display = show ? 'flex' : 'none';
    },
  };
}
