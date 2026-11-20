// main.js — Bootstrap Kota Cakrawala: loop game, mode, kamera,
// interaksi (E/G/F/Q/R/H), wanted, misi, relik, save, antarmuka debug.
import * as THREE from 'three';
import { buildCity } from './city.js';
import { createPlayer } from './player.js';
import { createPlayerCar, carById, CARS } from './vehicles.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createMissions, ACT_NAMES } from './missions.js';
import { createCollectibles, RELICS } from './collectibles.js';
import { createDistricts, districtName } from './districts.js';
import { createHud } from './hud.js';
import { createRadio } from './radio.js';
import { createGarage } from './garage.js';
import { createWeapons } from './weapons.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { loadSave, storeSave, clearSave } from './save.js';
import { setupShots } from './shots.js';

const save = loadSave();
const audio = createAudio();
const input = createInput();
const hud = createHud();
const districts = createDistricts(save);
const radio = createRadio(audio);

// --- Renderer / scene / kamera ---
const root = document.getElementById('game-root');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87b5e0, 220, 850);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(-260, 12, 270);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Dunia ---
const city = buildCity(scene);
const colliders = city.colliders;
const player = createPlayer(scene, colliders);
const traffic = createTraffic(scene, colliders);
const police = createPolice(scene, audio);
const missions = createMissions(scene, city.landmarks, save, audio, onMissionEvent);
const collectibles = createCollectibles(scene, save, audio, onRelicEvent);
const weapons = createWeapons(scene, camera, save, audio, onWeaponHeat);
const garage = createGarage(save, districts, onGarageApply);

// Mobil pemain (aktif dari save)
let car = createPlayerCar(scene, save.paintIndex, carById(save.activeCarId), save.upgrades);
car.pos.set(-252, 0, 240);
car.heading = Math.PI * 0.75;

// --- State game ---
let mode = 'menu';
let driving = false;
let health = save.health ?? 100;
let armor = save.armor ?? 0;
let gameMinutes = 17 * 60; // mulai senja 17:00
let timeSegment = '';
let cameraLock = null;
let wheelViaQ = false;
let prevMouseDown = false;
let saveTimer = 0;
let camPos = new THREE.Vector3(-260, 12, 270);
let camLook = new THREE.Vector3(-248, 2, 232);

function setGameTime(h, m) {
  gameMinutes = h * 60 + m;
  applyTimeSegment(true);
}

function applyTimeSegment(force) {
  const h = Math.floor(gameMinutes / 60) % 24;
  const seg = (h >= 17 && h < 19) ? 'senja' : (h >= 19 || h < 6) ? 'malam' : 'siang';
  if (force || seg !== timeSegment) {
    timeSegment = seg;
    city.setTimeOfDay(seg);
    scene.fog.color.setHex(seg === 'senja' ? 0xd98a5a : seg === 'malam' ? 0x0b1030 : 0x87b5e0);
  }
}

function lockCamera(pos, lookAt) {
  cameraLock = { pos: pos.clone(), lookAt: lookAt.clone() };
}

function clockText() {
  const h = Math.floor(gameMinutes / 60) % 24;
  const m = Math.floor(gameMinutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// --- Event misi ---
function onMissionEvent(kind, def) {
  if (kind === 'start') {
    if (def.wanted) police.setWanted(def.wanted);
    if (def.forceNight) setGameTime(21, 0);
    hud.showBanner(`Misi: ${def.name} — $${def.reward} • ${def.time} dtk`);
    audio.click();
  } else if (kind === 'done') {
    save.money += def.reward;
    const dId = districts.at(city.landmarks[def.target].x, city.landmarks[def.target].z);
    districts.addRep(dId, 5);
    save.missionsDone.push(def.id);
    audio.success();
    if (def.id === 'm4') hud.showBanner('BABAK 2 DIMULAI — Utang & Jalanan!', 4);
    else if (def.id === 'm8') hud.showBanner('BABAK TERAKHIR DIMULAI — Legenda Cakrawala!', 4);
    else if (def.id === 'm12') {
      save.money += 500;
      save.legendBonus = true;
      hud.showBanner('Kamu legenda Cakrawala! Bonus $500!', 5);
    } else {
      hud.showBanner(`Misi selesai! +$${def.reward}`, 3);
    }
    storeSave(save);
  } else if (kind === 'fail') {
    audio.fail();
    hud.showBanner('Misi gagal — bicara lagi ke Bu Sari untuk mengulang.', 3.5);
  }
}

function onRelicEvent(r) {
  save.money += 50;
  districts.addRep(r.district, 5);
  const n = collectibles.count;
  if (n >= 20 && !save.allRelicsBonus) {
    save.allRelicsBonus = true;
    save.money += 500;
    hud.showBanner('SEMUA 20 RELIK! Bonus $500!', 5);
  } else {
    hud.showBanner(`Relik ${n}/20! +$50 • Rep ${districtName(r.district)} +5`, 2.5);
  }
  storeSave(save);
}

function onWeaponHeat(n, target) {
  const dId = districts.at(player.pos.x, player.pos.z);
  districts.addRep(dId, -8);
  police.addHeat(1, districts.heatMultiplierAt(player.pos.x, player.pos.z));
}

function onGarageApply(kind, data) {
  if (kind === 'select' || kind === 'buy') {
    scene.remove(car.mesh);
    car = createPlayerCar(scene, save.paintIndex, carById(save.activeCarId), save.upgrades);
    const p = driving ? car.pos : player.pos;
    car.pos.set(p.x + 3, 0, p.z + 3);
    car.heading = 0;
    hud.showBanner(`Mobil aktif: ${carById(save.activeCarId).name}`, 2.5);
  } else if (kind === 'paint') {
    car.setPaint(save.paintIndex);
  } else if (kind === 'upgrade') {
    if (data === 'armorUp') armor = 100;
    hud.showBanner('Upgrade terpasang!', 2.5);
  } else if (kind === 'ammo') {
    hud.showBanner('Amunisi diisi ulang!', 2.5);
  }
  audio.cash();
  storeSave(save);
}

// --- Interaksi ---
function nearestAiCar(maxD) {
  let best = null;
  let bestD = maxD;
  for (const c of traffic.cars) {
    const d = Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

function stealCar(aiCar) {
  const def = CARS[Math.floor(Math.random() * CARS.length)];
  scene.remove(car.mesh);
  aiCar.mesh.visible = false;
  aiCar.pos.set(0, -100, 0);
  car = createPlayerCar(scene, save.paintIndex, def, save.upgrades);
  car.pos.set(aiCar.pos.x, 0, aiCar.pos.z);
  car.heading = aiCar.heading;
  driving = true;
  police.addHeat(1, districts.heatMultiplierAt(player.pos.x, player.pos.z));
  districts.addRep(districts.at(player.pos.x, player.pos.z), -8);
  hud.showBanner('Mobil dicuri! Wanted +1', 2.5);
  audio.engineStart();
}

function enterCar() {
  driving = true;
  audio.engineStart();
}

function exitCar() {
  driving = false;
  player.spawn(new THREE.Vector3(car.pos.x + 3, 0, car.pos.z + 2), car.heading);
  audio.engineStop();
}

function respawn() {
  health = 100;
  armor = save.upgrades.armorUp ? 100 : 0;
  save.money = Math.max(0, save.money - 50);
  police.reset();
  driving = false;
  player.spawn(new THREE.Vector3(120, 0, -104), 0);
  hud.showBanner('Kamu tertangkap! Respawn di RS — denda $50', 4);
  storeSave(save);
}

function damagePlayer(amount) {
  if (armor > 0) {
    const absorbed = Math.min(armor, amount);
    armor -= absorbed;
    amount -= absorbed;
  }
  health -= amount;
  if (health <= 0) { health = 0; respawn(); }
}

// --- Kandidat target senjata ---
function weaponTargets() {
  const list = [];
  for (const p of traffic.peds) {
    if (!p.mesh.visible) continue;
    list.push({
      pos: p.pos, kind: 'ped',
      onHit: () => {
        p.mesh.visible = false;
        p.pos.set(0, -100, 0);
        police.addHeat(1, districts.heatMultiplierAt(p.pos.x, p.pos.z));
        districts.addRep(districts.at(p.pos.x, p.pos.z), -8);
        hud.showBanner('Kamu menyerang pejalan kaki! Wanted +1', 2.5);
      },
    });
  }
  for (const c of police.cars) {
    if (!c.active) continue;
    list.push({
      pos: c.pos, kind: 'police',
      onHit: () => {
        c.speed *= 0.4;
        police.addHeat(1, 1);
        hud.showBanner('Kamu menyerang polisi! Wanted +1', 2.5);
      },
    });
  }
  return list;
}

// --- Game object (antarmuka debug) ---
const game = {
  get mode() { return mode; },
  set mode(v) { mode = v; },
  get driving() { return driving; },
  set driving(v) { driving = v; },
  get carState() { return { pos: car.pos, speed: car.speed }; },
  get car() { return car; },
  player,
  police,
  missions,
  save,
  collectibles,
  districts: {
    get current() { return districts.at(player.pos.x, player.pos.z); },
    get rep() { return { ...save.rep }; },
  },
  vehicles: {
    get owned() { return [...save.ownedCars]; },
    get active() { return save.activeCarId; },
  },
  buSari: city.buSari,
  city,
  hud,
  setGameTime,
  lockCamera,
};
window.__game = game;

// --- Tombol menu ---
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-resume').addEventListener('click', () => {
  mode = 'main';
  document.getElementById('pause-overlay').classList.remove('on');
});
document.getElementById('btn-restart').addEventListener('click', () => {
  clearSave();
  location.reload();
});
document.getElementById('btn-close-garage').addEventListener('click', () => garage.close());

function startGame() {
  mode = 'main';
  document.getElementById('menu-overlay').classList.add('off');
  document.getElementById('hud').classList.add('on');
  audio.ensure();
  audio.engineStop();
  radio.start();
  hud.showBanner('Bicara dengan Bu Sari (tanda ▼ kuning) untuk misi pertama!', 4);
}

// --- Loop utama ---
const clock = new THREE.Clock();
let elapsed = 0;

function currentInput() {
  return {
    forward: input.isDown('KeyW') || input.isDown('ArrowUp'),
    back: input.isDown('KeyS') || input.isDown('ArrowDown'),
    left: input.isDown('KeyA') || input.isDown('ArrowLeft'),
    right: input.isDown('KeyD') || input.isDown('ArrowRight'),
    handbrake: input.isDown('Space'),
    nitro: input.isDown('ShiftLeft') || input.isDown('ShiftRight'),
  };
}

function handleKeys() {
  if (input.pressed('Escape')) {
    if (garage.isOpen) { garage.close(); return; }
    if (mode === 'main') {
      mode = 'pause';
      document.getElementById('pause-overlay').classList.add('on');
    } else if (mode === 'pause') {
      mode = 'main';
      document.getElementById('pause-overlay').classList.remove('on');
    }
    return;
  }
  if (mode !== 'main') return;

  if (input.pressed('KeyG')) {
    garage.toggle(driving ? car.pos : player.pos);
    return;
  }
  if (garage.isOpen) return;

  if (input.pressed('KeyR')) {
    hud.showBanner(`Radio: ${radio.next()}`, 2);
    return;
  }
  if (input.pressed('KeyH')) audio.horn();

  if (input.pressed('KeyE')) {
    const origin = driving ? car.pos : player.pos;
    const dBuSari = Math.hypot(player.pos.x - city.buSari.position.x, player.pos.z - city.buSari.position.z);
    if (driving) { exitCar(); return; }
    const dCar = Math.hypot(player.pos.x - car.pos.x, player.pos.z - car.pos.z);
    if (dCar < 6) { enterCar(); return; }
    if (dBuSari < 5) {
      if (missions.active) {
        hud.showBanner('Misi sedang berjalan — selesaikan dulu!', 2.5);
      } else if (missions.next()) {
        missions.startNext();
      } else {
        hud.showBanner('Semua 12 misi selesai — kamu legenda Cakrawala!', 3);
      }
      return;
    }
    const ai = nearestAiCar(5);
    if (ai) { stealCar(ai); return; }
  }

  // Roda senjata
  if (input.isDown('KeyQ') && !wheelViaQ) {
    wheelViaQ = true;
    weapons.openWheel();
  } else if (!input.isDown('KeyQ') && wheelViaQ) {
    wheelViaQ = false;
    weapons.closeWheel();
  }
  if (input.pressed('Tab')) {
    if (weapons.isOpen) weapons.closeWheel();
    else weapons.openWheel();
  }
  if (weapons.isOpen) {
    if (input.pressed('Digit1')) weapons.select(0);
    if (input.pressed('Digit2')) weapons.select(1);
    if (input.pressed('Digit3')) weapons.select(2);
    weapons.pickFromMouse(input.mouse.x, input.mouse.y);
  } else {
    if (input.pressed('Digit1')) weapons.select(0);
    if (input.pressed('Digit2')) weapons.select(1);
    if (input.pressed('Digit3')) weapons.select(2);
  }
  if (input.pressed('KeyF') || (input.mouse.down && !prevMouseDown)) {
    const origin = driving ? car.pos : player.pos;
    const heading = driving ? car.heading : player.heading;
    const dir = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    weapons.attack(origin, dir, weaponTargets());
  }
}

function computePrompt() {
  if (mode !== 'main' || garage.isOpen) return '';
  if (driving) return 'E — Keluar mobil';
  if (missions.active) return `Misi: ${missions.active.def.name} — ${Math.ceil(missions.timer)} dtk`;
  const dBuSari = Math.hypot(player.pos.x - city.buSari.position.x, player.pos.z - city.buSari.position.z);
  const dCar = Math.hypot(player.pos.x - car.pos.x, player.pos.z - car.pos.z);
  if (dBuSari < 5) {
    const n = missions.next();
    return n ? `E — Bicara Bu Sari (Misi: ${n.name})` : 'Bu Sari: Semua misi selesai!';
  }
  if (dCar < 6) return `E — Masuk ${carById(save.activeCarId).name}`;
  if (nearestAiCar(5)) return 'E — Curi mobil (Wanted +1)';
  return '';
}

function updateCamera(dt) {
  if (cameraLock) {
    camera.position.copy(cameraLock.pos);
    camera.lookAt(cameraLock.lookAt);
    return;
  }
  const target = driving ? car.pos : player.pos;
  const heading = driving ? car.heading : player.heading;
  const dist = driving ? 13 : 9;
  const height = driving ? 5 : 4.5;
  const fx = Math.sin(heading);
  const fz = Math.cos(heading);
  const desired = new THREE.Vector3(target.x - fx * dist, height, target.z - fz * dist);
  camPos.lerp(desired, Math.min(1, dt * 5));
  camera.position.copy(camPos);
  camLook.lerp(new THREE.Vector3(target.x + fx * 5, 1.6, target.z + fz * 5), Math.min(1, dt * 7));
  camera.lookAt(camLook);
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  handleKeys();
  prevMouseDown = input.mouse.down;

  if (mode === 'main') {
    gameMinutes += dt * 0.5; // 1 jam game per 120 dtk
    applyTimeSegment(false);
    const inp = currentInput();

    if (driving) {
      car.update(dt, inp, colliders);
      player.update(dt, inp, true);
      // Tabrak pejalan kaki saat mengemudi
      for (const p of traffic.peds) {
        if (!p.mesh.visible) continue;
        const d = Math.hypot(p.pos.x - car.pos.x, p.pos.z - car.pos.z);
        if (d < 2.2 && Math.abs(car.speed) > 3) {
          p.mesh.visible = false;
          p.pos.set(0, -100, 0);
          police.addHeat(1, districts.heatMultiplierAt(car.pos.x, car.pos.z));
          districts.addRep(districts.at(car.pos.x, car.pos.z), -8);
          audio.crash();
          damagePlayer(3);
          hud.showBanner('Kamu menabrak pejalan kaki! Wanted +1', 2.5);
        }
      }
    } else {
      player.update(dt, inp, false);
    }

    traffic.update(dt, elapsed);
    police.update(dt, driving ? car.pos : player.pos, driving ? Math.abs(car.speed) : 0, () => {
      audio.crash();
      damagePlayer(8);
    });
    missions.update(dt, driving ? car.pos : player.pos, elapsed);
    collectibles.update(dt, driving ? car.pos : player.pos, districts.at.bind(districts), elapsed);
    weapons.update(dt);
    city.update(dt, elapsed);
    audio.engine(driving ? Math.abs(car.speed) / car.topSpeed() : 0, driving);

    saveTimer += dt;
    if (saveTimer > 10) {
      saveTimer = 0;
      save.health = Math.round(health);
      save.armor = Math.round(armor);
      storeSave(save);
    }
  } else {
    traffic.update(dt * 0.3, elapsed);
    city.update(dt, elapsed);
  }

  updateCamera(dt);

  const heading = driving ? car.heading : player.heading;
  const focusPos = driving ? car.pos : player.pos;
  const snap = {
    money: save.money,
    health,
    armor,
    wanted: police.wanted,
    speedKmh: driving ? Math.abs(car.speed) * 3.6 : 0,
    clockText: clockText(),
    radioStation: radio.name,
    headingDeg: (-heading * 180) / Math.PI,
    heading,
    playerPos: driving ? car.pos : player.pos,
    trafficCars: traffic.cars,
    policeCars: police.cars,
    heli: police.heli,
    missionTarget: missions.targetPosition(),
    landmarks: city.landmarks,
    relicsFound: collectibles.count,
    relicsTotal: collectibles.total,
    relicPositions: RELICS.filter((r) => !save.relicsFound.includes(r.id)),
    districtName: districtName(districts.at(focusPos.x, focusPos.z)),
    districtRep: districts.rep(districts.at(focusPos.x, focusPos.z)),
    districtList: districts.list(),
    garages: city.garages,
    missionActive: missions.active,
    missionActiveId: missions.active ? missions.active.def.id : null,
    missionTimer: missions.timer,
    missionsDone: save.missionsDone,
    currentAct: missions.currentAct(),
    prompt: computePrompt(),
  };
  hud.update(dt, snap);
  renderer.render(scene, camera);
}

setupShots(game);
if (!new URLSearchParams(location.search).get('shot')) {
  // Mode normal: menu tampil, game siap.
  document.getElementById('menu-overlay').classList.remove('off');
}
tick();
window.__gameReady = true;
