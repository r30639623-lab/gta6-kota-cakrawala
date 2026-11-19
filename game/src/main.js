// main.js — bootstrap + game loop for Kota Cakrawala.
// Wires city, player, vehicles, traffic, police, missions, HUD, radio,
// garage, weapons, audio, input and save into one playable open world.
import * as THREE from 'three';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { loadSave, writeSave } from './save.js';
import { buildCity } from './city.js';
import { createPlayerCar } from './vehicles.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createMissions } from './missions.js';
import { createHud } from './hud.js';
import { createRadio } from './radio.js';
import { createGarage } from './garage.js';
import { createWeapons, WEAPONS } from './weapons.js';
import { createPlayer } from './player.js';
import { applyShot } from './shots.js';

const save = loadSave();
const input = createInput();
const audio = createAudio();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
document.getElementById('game-root').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5e0);
scene.fog = new THREE.Fog(0x87b5e0, 160, 700);
const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(0, 90, 220);

const city = buildCity(scene);
const landmarks = city.landmarks;
const player = createPlayer(scene);
let currentCar = createPlayerCar(scene, save.paint);
const traffic = createTraffic(scene);
const police = createPolice(scene, audio);
const hud = createHud(document, save);
const radio = createRadio(audio);
const garage = createGarage(document, save, currentCar, audio, () => writeSave(save));
const weapons = createWeapons(scene, camera, save, audio, (n) => police.addHeat(n));

let mode = 'menu'; // menu | play | pause
let driving = false;
let health = 100;
let armor = save.upgrades.armor ? 100 : 0;
let clockMin = 600; // 10:00
let timeName = 'day';
let cameraYaw = 0;
let cameraLocked = false;
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
let nitroTimer = 0;
let nitroCooldown = 0;
let saveTimer = 0;
let shake = 0;
let crashCooldown = 0;
let lastTrackerId = undefined;

const missions = createMissions(scene, landmarks, save, audio, (kind, data) => {
  if (kind === 'banner') hud.showBanner(data, 5);
  if (kind === 'wanted') police.setWanted(Math.max(police.wanted, data));
  if (kind === 'night') setTimeOfDay('night');
  if (kind === 'complete') {
    writeSave(save);
    hud.renderTracker(null);
  }
});

function setTimeOfDay(name) {
  timeName = name;
  city.setTimeOfDay(name);
}

function clockText() {
  const h = Math.floor(clockMin / 60) % 24;
  const m = Math.floor(clockMin % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function setMode(next) {
  mode = next;
  const modeEl = document.getElementById('menu-overlay');
  modeEl.style.display = next === 'menu' ? 'flex' : 'none';
  if (next === 'menu') {
    const done = save.missionsDone.length;
    const prog = document.getElementById('menu-progress');
    if (prog) prog.textContent = done > 0 ? `Progres: ${done}/8 misi selesai • Uang $${save.money}` : 'Misi baru: 0/8 selesai — temui Bu Sari!';
  }
  document.getElementById('pause-overlay').style.display = next === 'pause' ? 'flex' : 'none';
  document.getElementById('hud').style.display = next === 'menu' ? 'none' : 'block';
  if (next === 'play') {
    audio.unlock();
    radio.start();
  }
}

function nearestAiCar(maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const c of traffic.cars) {
    const d = c.pos.distanceTo(player.pos);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

function stealCar(aiCar) {
  const idx = traffic.cars.indexOf(aiCar);
  if (idx >= 0) traffic.cars.splice(idx, 1);
  // Raka takes over: the player's car jumps to the stolen car's spot
  // and colour, the AI car leaves the scene.
  const stolenColor = aiCar.mesh.children[0] ? aiCar.mesh.children[0].material.color : null;
  scene.remove(aiCar.mesh);
  currentCar.mesh.position.copy(aiCar.pos);
  currentCar.heading = aiCar.heading;
  currentCar.mesh.rotation.y = aiCar.heading;
  currentCar.speed = 0;
  currentCar.name = 'Mobil Curian';
  if (stolenColor) {
    currentCar.mesh.traverse((o) => {
      if (o.isMesh && o.position.y === 0.62) o.material.color.copy(stolenColor);
    });
  }
  driving = true;
  police.addHeat(1);
  hud.showBanner('MOBIL DICURI! Polisi mengejarmu — Wanted naik!', 4);
  audio.horn();
}

function enterCar() {
  driving = true;
  currentCar.speed = 0;
  audio.beep();
}

function exitCar() {
  driving = false;
  const side = new THREE.Vector3(Math.cos(currentCar.heading), 0, -Math.sin(currentCar.heading));
  player.spawn(
    new THREE.Vector3(
      currentCar.pos.x + side.x * 3,
      0,
      currentCar.pos.z + side.z * 3,
    ),
    currentCar.heading,
  );
  currentCar.speed = 0;
}

function respawnAtHospital() {
  health = 100;
  armor = save.upgrades.armor ? 100 : 0;
  save.money = Math.max(0, save.money - 50);
  police.setWanted(0);
  if (driving) exitCar();
  player.spawn(new THREE.Vector3(landmarks.rs.x + 6, 0, landmarks.rs.z + 20), 0);
  currentCar.mesh.position.set(landmarks.rs.x - 8, 0, landmarks.rs.z + 24);
  currentCar.heading = 0;
  currentCar.mesh.rotation.y = 0;
  currentCar.damage = 0;
  hud.showBanner('Kamu pingsan! Dibawa ke Rumah Sakit — denda $50.', 5);
  writeSave(save);
}

function interact() {
  if (driving) { exitCar(); return; }
  const dCar = currentCar.pos.distanceTo(player.pos);
  if (dCar < 4.5) { enterCar(); return; }
  const ai = nearestAiCar(4.5);
  if (ai) { stealCar(ai); return; }
  const dSari = city.buSari.position.distanceTo(player.pos);
  if (dSari < 7) {
    if (missions.active) {
      hud.showBanner(`MISI BERJALAN: ${missions.active.name} — ${missions.active.desc}`, 4);
    } else {
      const def = missions.startNext();
      if (def) {
        hud.showBanner(`MISI BARU: ${def.name} — ${def.desc} (hadiah $${def.reward})`, 5);
        hud.renderTracker(def.id);
      } else {
        hud.showBanner('Bu Sari: Semua misi selesai, Raka! Kamu legenda Cakrawala!', 5);
      }
    }
    audio.beep();
    return;
  }
  hud.showBanner('Tidak ada yang bisa dilakukan di sini.', 2);
}

function collideBuildings(pos, radius) {
  for (const b of city.colliders) {
    const dx = pos.x - b.x;
    const dz = pos.z - b.z;
    const px = b.hx + radius - Math.abs(dx);
    const pz = b.hz + radius - Math.abs(dz);
    if (px > 0 && pz > 0) {
      if (px < pz) pos.x = b.x + Math.sign(dx || 1) * (b.hx + radius);
      else pos.z = b.z + Math.sign(dz || 1) * (b.hz + radius);
      return true;
    }
  }
  return false;
}

function updateDriving(dt) {
  const car = currentCar;
  const turbo = save.upgrades.turbo ? 1.3 : 1;
  let topSpeed = 38 * turbo;
  if (nitroTimer > 0) {
    nitroTimer -= dt;
    topSpeed *= 1.45;
  }
  nitroCooldown = Math.max(0, nitroCooldown - dt);
  const accel = 13 * turbo;
  if (input.isDown('KeyW') || input.isDown('ArrowUp')) car.speed += accel * dt;
  if (input.isDown('KeyS') || input.isDown('ArrowDown')) {
    car.speed -= car.speed > 0.5 ? 22 * dt : 9 * dt;
  }
  if (input.isDown('Space')) car.speed -= Math.sign(car.speed) * 30 * dt;
  if (save.upgrades.nitro && input.isDown('ShiftLeft') && nitroCooldown <= 0 && car.speed > 5) {
    nitroTimer = 2.5;
    nitroCooldown = 8;
    audio.beep();
  }
  // Drag + clamp.
  car.speed -= car.speed * 0.55 * dt;
  car.speed = THREE.MathUtils.clamp(car.speed, -11, topSpeed);
  if (Math.abs(car.speed) < 0.05 && !input.isDown('KeyW')) car.speed = 0;
  // Steering scales with speed.
  let steer = 0;
  if (input.isDown('KeyA') || input.isDown('ArrowLeft')) steer += 1;
  if (input.isDown('KeyD') || input.isDown('ArrowRight')) steer -= 1;
  const steerRate = 1.9 * Math.min(1, Math.abs(car.speed) / 9);
  car.heading += steer * steerRate * Math.sign(car.speed) * dt;
  const fx = Math.sin(car.heading);
  const fz = Math.cos(car.heading);
  car.pos.x += fx * car.speed * dt;
  car.pos.z += fz * car.speed * dt;
  car.pos.x = THREE.MathUtils.clamp(car.pos.x, -310, 345);
  car.pos.z = THREE.MathUtils.clamp(car.pos.z, -310, 345);
  if (collideBuildings(car.pos, 2.3)) {
    if (Math.abs(car.speed) > 9 && crashCooldown <= 0) {
      crashCooldown = 0.6;
      audio.crash(true);
      car.damage += 9;
      if (armor > 0) armor = Math.max(0, armor - 6);
      else health = Math.max(0, health - 5);
      shake = 0.35;
      car.speed *= 0.5;
    } else if (Math.abs(car.speed) > 3 && crashCooldown <= 0) {
      crashCooldown = 0.6;
      audio.crash(false);
    }
    // No hard speed cut on a gentle scrape: the car slides along the wall.
  }
  car.mesh.rotation.y = car.heading;
  const wheels = car.mesh.userData.wheels || [];
  for (const w of wheels) w.rotation.x += (car.speed * dt) / 0.38;
  // Body lean.
  car.mesh.rotation.z = THREE.MathUtils.clamp(-steer * Math.abs(car.speed) * 0.004, -0.06, 0.06);
  cameraYaw = car.heading;
  audio.engine(Math.abs(car.speed) / topSpeed, true);
}

function updateCamera(dt) {
  if (cameraLocked) {
    camera.position.lerp(camPos, 1 - Math.pow(0.001, dt));
    camera.lookAt(camLook);
    return;
  }
  if (mode === 'menu') {
    const t = performance.now() * 0.00004;
    camera.position.set(Math.cos(t) * 250, 130, Math.sin(t) * 250);
    camera.lookAt(0, 10, 40);
    return;
  }
  const target = driving ? currentCar.pos : player.pos;
  const heading = driving ? currentCar.heading : player.heading;
  const dist = driving ? 12.5 : 7.5;
  const height = driving ? 5 : 3.4;
  const fx = Math.sin(heading);
  const fz = Math.cos(heading);
  const want = new THREE.Vector3(target.x - fx * dist, height, target.z - fz * dist);
  camera.position.lerp(want, 1 - Math.pow(0.0001, dt));
  camera.lookAt(target.x + fx * 6, 1.6, target.z + fz * 6);
  if (shake > 0) {
    shake -= dt;
    camera.position.x += (Math.random() - 0.5) * shake * 0.6;
    camera.position.y += (Math.random() - 0.5) * shake * 0.6;
  }
}

function promptText() {
  if (driving) return 'E — Keluar mobil • Spasi — Rem tangan • Q — Roda Senjata • R — Radio • G — Garasi';
  if (currentCar.pos.distanceTo(player.pos) < 4.5) return `E — Masuk ${currentCar.name}`;
  if (nearestAiCar(4.5)) return 'E — Curi mobil';
  if (city.buSari.position.distanceTo(player.pos) < 7) return 'E — Bicara Bu Sari (misi)';
  if (weapons.wheelOpen) return 'Pilih senjata: klik / tombol 1-3 • F — Serang';
  return 'WASD — Jalan • E — Interaksi • Q — Roda Senjata • R — Radio • G — Garasi';
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, clock.getDelta());
  if (mode === 'play') {
    clockMin += dt * 2;
    crashCooldown = Math.max(0, crashCooldown - dt);
    if (clockMin >= 1440) clockMin -= 1440;
    const hour = Math.floor(clockMin / 60);
    const wantTime = hour >= 17 && hour < 19 ? 'sunset' : (hour >= 19 || hour < 6 ? 'night' : 'day');
    if (wantTime !== timeName && !cameraLocked) setTimeOfDay(wantTime);

    // Pause toggle.
    if (input.wasPressed('Escape')) { setMode('pause'); input.consume('Escape'); }
    // Radio.
    if (input.wasPressed('KeyR')) {
      radio.next();
      hud.showBanner(`RADIO: ${radio.name}`, 2);
      audio.click();
    }
    // Garage.
    if (input.wasPressed('KeyG')) {
      const open = garage.toggle();
      hud.showGarage(open, save.money);
      audio.click();
    }
    // Weapon wheel: hold Q, or toggle with Tab.
    if (input.isDown('KeyQ') || input.wasPressed('Tab')) {
      if (!weapons.wheelOpen) { weapons.setWheel(true); hud.showWheel(true); }
    } else if (weapons.wheelOpen && !input.isDown('KeyQ')) {
      weapons.setWheel(false);
      hud.showWheel(false);
    }
    if (weapons.wheelOpen) {
      if (input.wasPressed('Digit1')) weapons.select(0);
      if (input.wasPressed('Digit2')) weapons.select(1);
      if (input.wasPressed('Digit3')) weapons.select(2);
      hud.markWheel(weapons.selected);
    }
    // Attack (not while the garage panel or weapon wheel is open).
    if ((input.wasPressed('KeyF') || (input.mouse.clicked && !weapons.wheelOpen && !garage.isOpen)) && mode === 'play') {
      const origin = driving
        ? currentCar.pos.clone().add(new THREE.Vector3(0, 1.5, 0))
        : player.pos.clone().add(new THREE.Vector3(0, 1.5, 0));
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      weapons.attack(origin, dir, traffic, police, driving);
    }
    // Interact.
    if (input.wasPressed('KeyE')) interact();
    // Horn.
    if (input.wasPressed('KeyH') && driving) audio.horn();

    if (!garage.isOpen) {
      if (driving) updateDriving(dt);
      else player.update(dt, input, cameraYaw);
    }
    // Raka sits inside the car while driving — hide the on-foot figure.
    player.mesh.visible = !driving;
    const focusPos = driving ? currentCar.pos : player.pos;
    traffic.update(dt, driving ? currentCar.pos : null, () => {
      police.addHeat(1);
      audio.crash(true);
      hud.showBanner('Kamu menabrak pejalan kaki! Wanted naik!', 3);
    });
    missions.update(dt, focusPos);
    police.update(dt, focusPos, driving ? currentCar.speed : player.speed, () => {
      audio.crash(true);
      shake = 0.4;
      if (armor > 0) armor = Math.max(0, armor - 8);
      else health = Math.max(0, health - 6);
      currentCar.damage += 6;
      currentCar.speed *= 0.55;
    });
    weapons.update(dt);
    radio.update(dt);
    audio.siren(police.wanted > 0, dt);
    if (health <= 0) respawnAtHospital();

    saveTimer += dt;
    if (saveTimer > 10) { saveTimer = 0; writeSave(save); }

    hud.update(dt, {
      money: save.money,
      health,
      armor,
      wanted: police.wanted,
      speedKmh: driving ? currentCar.speed * 3.6 : 0,
      clockText: clockText(),
      radioStation: radio.name,
      headingDeg: THREE.MathUtils.radToDeg(cameraYaw),
      playerPos: focusPos,
      heading: driving ? currentCar.heading : player.heading,
      trafficCars: traffic.cars,
      policeCars: police.cars,
      heli: police.heli,
      missionTarget: missions.targetPosition(),
      landmarks,
    });
    hud.setPrompt(promptText());
    const trackerId = missions.active ? missions.active.id : null;
    if (trackerId !== lastTrackerId) {
      lastTrackerId = trackerId;
      hud.renderTracker(trackerId);
    }
  } else if (mode === 'pause') {
    if (input.wasPressed('Escape')) setMode('play');
    audio.engine(0, false);
    audio.siren(false, dt);
  }
  updateCamera(dt);
  renderer.render(scene, camera);
  input.endFrame();
}

// --- Wiring for shots.js + the debug interface ---
const W = {
  scene,
  camera,
  save,
  city,
  landmarks,
  player,
  traffic,
  police,
  missions,
  hud,
  radio,
  garage,
  weapons,
  buSari: city.buSari,
  setMode,
  setTimeOfDay,
  lockCamera(pos, lookAt) {
    cameraLocked = true;
    camPos.copy(pos);
    camLook.copy(lookAt);
  },
};
Object.defineProperty(W, 'car', { get() { return currentCar; } });
Object.defineProperty(W, 'driving', {
  get() { return driving; },
  set(v) { driving = v; },
});

const clock = new THREE.Clock();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('btn-start').addEventListener('click', () => {
  audio.unlock();
  setMode('play');
  hud.renderTracker(null);
  hud.showBanner('Selamat datang di KOTA CAKRAWALA! Temui Bu Sari di bengkel.', 5);
});
document.getElementById('btn-resume').addEventListener('click', () => setMode('play'));
document.getElementById('btn-restart').addEventListener('click', () => {
  const fresh = loadSave();
  save.money = fresh.money;
  setMode('play');
});
document.getElementById('btn-close-garage').addEventListener('click', () => {
  garage.close();
  hud.showGarage(false, save.money);
});
document.querySelectorAll('.wheel-seg').forEach((seg) => {
  seg.addEventListener('click', () => {
    weapons.select(Number(seg.dataset.idx));
    hud.markWheel(weapons.selected);
  });
});

// Debug interface used by the playtest + screenshot tools.
window.__game = {
  get mode() { return mode; },
  get driving() { return driving; },
  get carState() {
    return {
      get pos() { return currentCar.pos; },
      get speed() { return currentCar.speed; },
    };
  },
  player,
  get police() { return { wanted: police.wanted }; },
  get missions() {
    return { active: missions.active ? { def: missions.active } : null };
  },
  save,
  buSari: city.buSari,
};

hud.renderTracker(null);
setMode('menu');
tick();
window.__gameReady = true;

// Screenshot staging (only when ?shot= is present).
if (new URLSearchParams(window.location.search).has('shot')) {
  applyShot(W);
}
