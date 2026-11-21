// hud.js — HUD Kota Cakrawala: uang, nyawa, armor, Wanted, kecepatan,
// jam, radio, tracker 12 misi, counter relik, distrik, minimap 2D
// berlabel + kompas (waypoint, target job/balapan, polisi merah saat
// Mata Elang aktif), banner, prompt konteks, HUD balapan, dan layar
// menu/pause.

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
  const raceEl = el('hud-race');
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
    mapCtx.fillStyle = '#1e6f8e';
    mapCtx.fillRect(0, toMap(0, 300)[1], W, H - toMap(0, 300)[1]);
    mapCtx.fillStyle = '#d9c28a';
    mapCtx.fillRect(0, toMap(0, 290)[1], W, toMap(0, 300)[1] - toMap(0, 290)[1]);
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
    mapCtx.fillStyle = '#2ee6ff';
    mapCtx.font = 'bold 10px sans-serif';
    for (const g of snap.garages || []) {
      const [mx, my] = toMap(g.x, g.z);
      mapCtx.fillText('G', mx, my + 3);
    }
    if (snap.relicDots) {
      mapCtx.fillStyle = '#ffd23f';
      for (const [x, z] of snap.relicDots) {
        const [mx, my] = toMap(x, z);
        mapCtx.fillRect(mx - 1, my - 1, 2, 2);
      }
    }
    const ringTarget = (t, color) => {
      if (!t) return;
      const [mx, my] = toMap(t.x, t.z);
      mapCtx.strokeStyle = color;
      mapCtx.lineWidth = 2;
      mapCtx.beginPath();
      mapCtx.arc(mx, my, 7 + Math.sin(performance.now() / 300) * 2, 0, Math.PI * 2);
      mapCtx.stroke();
    };
    ringTarget(snap.missionTarget, '#ffd23f');
    ringTarget(snap.jobTarget, '#2ee6ff');
    ringTarget(snap.raceTarget, '#ff9f43');
    // Polisi: biru biasa, merah menyala saat Mata Elang aktif.
    mapCtx.fillStyle = snap.reveal ? '#ff2222' : '#4488ff';
    for (const c of snap.policeCars || []) {
      const [mx, my] = toMap(c.x, c.z);
      mapCtx.beginPath();
      mapCtx.arc(mx, my, snap.reveal ? 3.5 : 2.5, 0, Math.PI * 2);
      mapCtx.fill();
    }
    if (snap.heli) {
      const [mx, my] = toMap(snap.heli.x, snap.heli.z);
      mapCtx.fillStyle = '#ff4444';
      mapCtx.font = 'bold 11px sans-serif';
      mapCtx.fillText('H', mx, my + 4);
    }
    // Waypoint (garis kuning putus-putus + titik).
    if (snap.waypoint) {
      const [px, py] = toMap(snap.playerPos.x, snap.playerPos.z);
      const [wx, wy] = toMap(snap.waypoint.x, snap.waypoint.z);
      mapCtx.strokeStyle = '#ffd23f';
      mapCtx.lineWidth = 1.5;
      mapCtx.setLineDash([4, 3]);
      mapCtx.beginPath();
      mapCtx.moveTo(px, py);
      mapCtx.lineTo(wx, wy);
      mapCtx.stroke();
      mapCtx.setLineDash([]);
      mapCtx.fillStyle = '#ffd23f';
      mapCtx.beginPath();
      mapCtx.arc(wx, wy, 3, 0, Math.PI * 2);
      mapCtx.fill();
    }
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
      let html = '';
      for (const m of MISSIONS) {
        const done = snap.missionsDone.includes(m.id);
        const active = snap.activeMissionId === m.id;
        const mark = done ? '✓' : active ? '►' : '○';
        html += `<div class="tracker-row${active ? ' active' : ''}${done ? ' done' : ''}">${mark} ${m.name} — $${m.reward}</div>`;
      }
      if (snap.activeJob) {
        html += `<div class="tracker-row active">◆ ${snap.activeJob.name} — $${snap.activeJob.reward}</div>`;
      }
      trackerEl.innerHTML = html;
      drawMinimap(snap);
    },
    updateMissionBanner(active, timer) {
      const banner = el('hud-mission');
      if (!banner) return;
      if (!active) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      banner.textContent = `${active.def.name} — ${fmtTime(timer)}`;
    },
    updateRace(active, timer) {
      if (!active) {
        raceEl.style.display = 'none';
        return;
      }
      raceEl.style.display = 'block';
      if (active.kind === 'race') {
        raceEl.textContent = `🏁 ${active.def.name} — CP ${active.cpIndex}/${active.def.checkpoints.length} — ${fmtTime(timer)}`;
      } else {
        raceEl.textContent = `◆ ${active.def.name} — ${fmtTime(timer)}`;
      }
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
