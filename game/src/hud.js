// hud.js — every HUD element: money, health + armor bars, wanted stars,
// speed, game clock, radio station, 8-mission tracker, minimap with
// labels, compass, mission banner and the contextual prompt.
import { MISSIONS } from './missions.js';

export function createHud(doc, save) {
  const $ = (id) => doc.getElementById(id);
  const els = {
    money: $('hud-money'),
    health: $('hud-health-fill'),
    armor: $('hud-armor-fill'),
    stars: $('hud-stars'),
    speed: $('hud-speed'),
    clock: $('hud-clock'),
    radio: $('hud-radio'),
    tracker: $('hud-tracker-list'),
    banner: $('hud-banner'),
    prompt: $('hud-prompt'),
    minimap: $('hud-minimap'),
    compass: $('hud-compass'),
    wheel: $('weapon-wheel'),
    garage: $('garage-panel'),
    garageMoney: $('garage-money'),
  };
  const mapCtx = els.minimap ? els.minimap.getContext('2d') : null;
  let bannerTimer = 0;

  function renderTracker(activeId) {
    if (!els.tracker) return;
    els.tracker.innerHTML = '';
    for (const m of MISSIONS) {
      const done = save.missionsDone.includes(m.id);
      const row = doc.createElement('div');
      row.className = 'tracker-row' + (done ? ' done' : '') + (m.id === activeId ? ' active' : '');
      row.textContent = `${done ? '✓' : (m.id === activeId ? '►' : '○')} ${m.name} — $${m.reward}`;
      els.tracker.appendChild(row);
    }
  }

  function drawMinimap(playerPos, heading, cars, policeCars, heli, missionTarget, landmarks) {
    if (!mapCtx) return;
    const W = 190;
    const H = 190;
    mapCtx.clearRect(0, 0, W, H);
    mapCtx.fillStyle = 'rgba(12, 20, 14, 0.82)';
    mapCtx.fillRect(0, 0, W, H);
    const toMap = (x, z) => [((x + 320) / 640) * W, ((z + 320) / 640) * H];
    // Sea + beach.
    mapCtx.fillStyle = '#1e6f9e';
    mapCtx.fillRect(0, ((320 + 320) / 640) * H, W, H - ((320 + 320) / 640) * H);
    mapCtx.fillStyle = '#d9c28f';
    mapCtx.fillRect(0, ((300 + 320) / 640) * H, W, 6);
    // Roads.
    mapCtx.strokeStyle = '#5a6270';
    mapCtx.lineWidth = 2;
    for (const c of [-270, -210, -150, -90, -30, 30, 90, 150, 210, 270]) {
      const [ax] = toMap(c, 0);
      const [, az] = toMap(0, c);
      mapCtx.beginPath(); mapCtx.moveTo(ax, 0); mapCtx.lineTo(ax, H); mapCtx.stroke();
      mapCtx.beginPath(); mapCtx.moveTo(0, az); mapCtx.lineTo(W, az); mapCtx.stroke();
    }
    // Landmark labels.
    mapCtx.font = 'bold 9px sans-serif';
    mapCtx.fillStyle = '#ffd23e';
    for (const [key, label] of [['menara', 'Menara'], ['pasar', 'Pasar'], ['rs', 'RS'], ['pantai', 'Pantai'], ['dermaga', 'Dermaga']]) {
      const p = landmarks[key];
      if (!p) continue;
      const [mx, my] = toMap(p.x, p.z);
      mapCtx.fillText(label, mx + 4, my - 4);
      mapCtx.fillStyle = '#ff5a5a';
      mapCtx.fillRect(mx - 2, my - 2, 4, 4);
      mapCtx.fillStyle = '#ffd23e';
    }
    // Mission beacon.
    if (missionTarget) {
      const [mx, my] = toMap(missionTarget.x, missionTarget.z);
      mapCtx.fillStyle = '#ffd23e';
      mapCtx.beginPath();
      mapCtx.arc(mx, my, 6 + Math.sin(performance.now() * 0.005) * 2, 0, Math.PI * 2);
      mapCtx.fill();
    }
    // Police + heli.
    mapCtx.fillStyle = '#3aa0ff';
    for (const c of policeCars) {
      const [mx, my] = toMap(c.pos.x, c.pos.z);
      mapCtx.fillRect(mx - 2, my - 2, 4, 4);
    }
    if (heli && heli.visible) {
      const [mx, my] = toMap(heli.position.x, heli.position.z);
      mapCtx.fillStyle = '#ff2222';
      mapCtx.beginPath();
      mapCtx.arc(mx, my, 5, 0, Math.PI * 2);
      mapCtx.fill();
    }
    // Traffic dots.
    mapCtx.fillStyle = '#e8e8e8';
    for (const c of cars) {
      const [mx, my] = toMap(c.pos.x, c.pos.z);
      mapCtx.fillRect(mx - 1, my - 1, 2, 2);
    }
    // Player arrow.
    const [px, py] = toMap(playerPos.x, playerPos.z);
    mapCtx.save();
    mapCtx.translate(px, py);
    mapCtx.rotate(Math.atan2(Math.sin(heading), Math.cos(heading)) + Math.PI / 2);
    mapCtx.fillStyle = '#22ff66';
    mapCtx.beginPath();
    mapCtx.moveTo(0, -7);
    mapCtx.lineTo(5, 6);
    mapCtx.lineTo(-5, 6);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();
  }

  return {
    renderTracker,
    setPrompt(text) {
      if (els.prompt && els.prompt.textContent !== text) els.prompt.textContent = text;
    },
    showBanner(text, seconds = 4) {
      if (!els.banner) return;
      els.banner.textContent = text;
      els.banner.style.opacity = '1';
      bannerTimer = seconds;
    },
    update(dt, snap) {
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0 && els.banner) els.banner.style.opacity = '0';
      }
      if (els.money) els.money.textContent = `$${snap.money}`;
      if (els.health) els.health.style.width = `${Math.max(0, snap.health)}%`;
      if (els.armor) els.armor.style.width = `${Math.max(0, snap.armor)}%`;
      if (els.stars) {
        els.stars.textContent = '★'.repeat(snap.wanted) + '☆'.repeat(Math.max(0, 5 - snap.wanted));
        els.stars.style.color = snap.wanted > 0 ? '#ff4444' : '#888888';
      }
      if (els.speed) els.speed.textContent = `${Math.round(Math.abs(snap.speedKmh))} km/h`;
      if (els.clock) els.clock.textContent = snap.clockText;
      if (els.radio) els.radio.textContent = `♪ ${snap.radioStation}`;
      if (els.compass) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const deg = ((snap.headingDeg % 360) + 360) % 360;
        els.compass.textContent = `◀ ${dirs[Math.round(deg / 45) % 8]} ${Math.round(deg)}° ▶`;
      }
      drawMinimap(snap.playerPos, snap.heading, snap.trafficCars, snap.policeCars, snap.heli, snap.missionTarget, snap.landmarks);
    },
    showWheel(show) { if (els.wheel) els.wheel.style.display = show ? 'flex' : 'none'; },
    markWheel(selected) {
      if (!els.wheel) return;
      for (const seg of els.wheel.querySelectorAll('.wheel-seg')) {
        seg.classList.toggle('selected', Number(seg.dataset.idx) === selected);
      }
    },
    showGarage(show, money) {
      if (els.garage) els.garage.style.display = show ? 'block' : 'none';
      if (show && els.garageMoney) els.garageMoney.textContent = `$${money}`;
    },
    setGarageMoney(money) { if (els.garageMoney) els.garageMoney.textContent = `$${money}`; },
  };
}
