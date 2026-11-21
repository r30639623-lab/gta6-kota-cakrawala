// main.js — Kota Cakrawala: bootstrap & game loop.
// Menghubungkan kota, pemain, mobil, lalu lintas, polisi, misi, relik,
// distrik, HUD, garasi, senjata, radio, save — plus round 8: kru
// Bu Sari + ability, panel dispatch polisi, HP in-game, side job +
// balapan jalanan, dialog misi berwajah. Satu loop, tiga mode
// (menu / main / pause), kamera kejar yang halus, staging screenshot.

import * as THREE from 'three';
import { buildCity } from './city.js';
import { createPlayer } from './player.js';
import { createPlayerCar, carDef, resolveCircle } from './vehicles.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createMissions, MISSIONS, ACT_NAMES } from './missions.js';
import { createCollectibles, RELICS } from './collectibles.js';
import { createDistricts } from './districts.js';
import { createHud } from './hud.js';
import { createRadio } from './radio.js';
import { createGarage } from './garage.js';
import { createWeapons } from './weapons.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { loadSave, storeSave, wipeSave } from './save.js';
import { parseShot, stageShot } from './shots.js';
import { createSideJobs, RACE } from './sidejobs.js';
import { createCrew } from './crew.js';
import { createDispatch } from './dispatch.js';
import { createPhone } from './phone.js';
import { createDialogue } from './dialogue.js';

const save = loadSave();
const input = createInput();
const audio = createAudio();
const radio = createRadio();
const districts = createDistricts(save);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('game-root').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1600);

const shot = parseShot();
const city = buildCity(scene, shot.seed);
const player = createPlayer(scene);
const car = createPlayerCar(scene, carDef(save.activeCarId), save.paint, save);
const traffic = createTraffic(scene, city.colliders, shot.seed);
const police = createPolice(scene, audio);
const hud = createHud();
const dialogue = createDialogue();
const weapons = createWeapons(scene, camera, save, audio, (n) => {
  police.addHeat(n, districts.rep(districts.at(player.pos.x, player.pos.z)) <= 25);
});
const garage = createGarage(save, districts, {
  currentDistrict: () => districts.at(player.pos.x, player.pos.z),
  onCarChanged: (id) => {
    car.swapDef(carDef(id));
    car.repaint(save.paint);
  },
  onPaint: (i) => car.repaint(i),
  onSave: () => storeSave(save),
});

let mode = 'menu';
let driving = false;
let gameHour = 10.5; // Round 8: mulai siang cerah — kesan pertama ramai & terang.
let shotCam = null;
let shotReadyAt = 0;
let saveTimer = 0;
let health = save.health ?? 100;
let armor = save.armor ?? 0;
let waypoint = null;
let lastSnap = null;
let camPos = new THREE.Vector3(-250, 8, 260);
let camLook = new THREE.Vector3(-250, 2, 238);
let camHeading = 0;

function applyTimeOfDay() {
  if (gameHour >= 17 && gameHour < 19) city.setTimeOfDay('dusk');
  else if (gameHour >= 19 || gameHour < 6) city.setTimeOfDay('night');
  else city.setTimeOfDay('day');
}
function clockText() {
  const h = Math.floor(gameHour) % 24;
  const m = Math.floor((gameHour % 1) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function damage(amount) {
  let rest = amount;
  if (armor > 0) {
    const absorbed = Math.min(armor, rest);
    armor -= absorbed;
    rest -= absorbed;
  }
  if (save.upgrades.armor) rest *= 0.5;
  health -= rest;
  save.health = Math.max(0, health);
  save.armor = Math.max(0, armor);
  if (health <= 0) busted();
}

function busted() {
  save.busted = (save.busted || 0) + 1;
  save.money = Math.max(0, save.money - 50);
  health = 100;
  armor = 0;
  save.health = 100;
  save.armor = 0;
  police.setWanted(0);
  driving = false;
  player.spawn(new THREE.Vector3(120, 0, -100), 0);
  car.teleport(118, -96, 0);
  car.setSpeed(0);
  hud.showBanner('Tertangkap! Denda $50 — respawn di Rumah Sakit.', 3200);
  storeSave(save);
}

function missionEvents(ev) {
  const targetDistrict = (def) => {
    const lm = city.landmarks[def.target];
    return lm ? districts.at(lm.x, lm.z) : 'pusat';
  };
  if (ev.type === 'complete') {
    save.money += ev.def.reward;
    save.totalEarned += ev.def.reward;
    districts.addRep(targetDistrict(ev.def), 5);
    audio.win();
    hud.showBanner(`Misi selesai: ${ev.def.name} +$${ev.def.reward}!`);
    dialogue.show('Bu Sari', ev.def.done);
    phone.addMessage('Bu Sari', `Misi "${ev.def.name}" selesai! +$${ev.def.reward}. Kamu makin dekat jadi legenda.`);
    storeSave(save);
  } else if (ev.type === 'fail') {
    hud.showBanner(`Misi gagal: ${ev.def.name} — bicara lagi ke Bu Sari.`);
  } else if (ev.type === 'act') {
    hud.showBanner(ev.act === 2 ? 'BABAK 2 DIMULAI — Utang & Jalanan' : 'BABAK TERAKHIR DIMULAI — Legenda Cakrawala', 3600);
    audio.win();
  } else if (ev.type === 'legend') {
    save.money += 500;
    save.totalEarned += 500;
    hud.showBanner('Kamu legenda Cakrawala! Bonus $500!', 4200);
    audio.win();
    storeSave(save);
  } else if (ev.type === 'relic') {
    save.money += 50;
    save.totalEarned += 50;
    districts.addRep(ev.district, 5);
    hud.showBanner(`Relik ${save.relicsFound.length}/20! +$50`);
    storeSave(save);
  } else if (ev.type === 'allRelics') {
    save.money += 500;
    hud.showBanner('Semua 20 Relik ditemukan! Bonus $500!', 4200);
    storeSave(save);
  } else if (ev.type === 'wanted') {
    police.setWanted(Math.max(police.wanted, ev.wanted));
  } else if (ev.type === 'night') {
    gameHour = 21;
    applyTimeOfDay();
  } else if (ev.type === 'start') {
    hud.showBanner(`Misi: ${ev.def.name} — menuju ${city.landmarks[ev.def.target].name}`);
    dialogue.show('Bu Sari', ev.def.line);
  }
}

function sideJobEvents(ev) {
  if (ev.type === 'jobStart') {
    hud.showBanner(`Side job: ${ev.def.name} — menuju ${city.landmarks[ev.def.to].name} (${ev.def.time} dtk)`, 3000);
    audio.blip();
  } else if (ev.type === 'jobComplete') {
    save.money += ev.def.reward;
    save.totalEarned += ev.def.reward;
    districts.addRep(districts.at(city.landmarks[ev.def.to].x, city.landmarks[ev.def.to].z), 3);
    audio.win();
    hud.showBanner(`Side job selesai: ${ev.def.name} +$${ev.def.reward}!`);
    phone.addMessage('Bu Sari', `Side job "${ev.def.name}" beres! +$${ev.def.reward}. Pelanggan puas.`);
    storeSave(save);
  } else if (ev.type === 'jobFail') {
    audio.fail();
    hud.showBanner(`Side job gagal: ${ev.def.name} — ${ev.reason || 'coba lagi lewat HP.'}`);
  } else if (ev.type === 'raceStart') {
    hud.showBanner(`🏁 ${ev.def.name} dimulai! Lewati 5 checkpoint sebelum waktu habis!`, 3200);
    audio.blip();
  } else if (ev.type === 'raceCheckpoint') {
    audio.cash();
    hud.showBanner(`Checkpoint ${ev.index}/${ev.def.checkpoints.length}!`, 1600);
  } else if (ev.type === 'raceComplete') {
    save.money += ev.def.reward;
    save.totalEarned += ev.def.reward;
    audio.win();
    hud.showBanner(`🏁 MENANG! ${ev.def.name} +$${ev.def.reward}${ev.best ? ' — REKOR BARU!' : ''} (${Math.floor(ev.time)} dtk)`, 4200);
    phone.addMessage('Lia (Supir)', `Gila, Raka! Kamu menang ${ev.def.name} dalam ${Math.floor(ev.time)} detik. Aku yang supir aja kalah cepet.`);
    storeSave(save);
  } else if (ev.type === 'raceFail') {
    audio.fail();
    hud.showBanner(`Balapan gagal: ${ev.def.name} — ${ev.reason || 'coba lagi lewat HP.'}`);
  }
}

const missions = createMissions(scene, city.landmarks, save, audio, missionEvents);
const collectibles = createCollectibles(scene, save, audio, missionEvents);
const sideJobs = createSideJobs(scene, city.landmarks, save, audio, sideJobEvents);
const crew = createCrew(save, audio, {
  addArmor: (n) => {
    armor = Math.min(100, armor + n);
    save.armor = armor;
    hud.showBanner(`Yoga: Perbaiki Cepat! Baja +${n}.`);
  },
  reduceWanted: (n) => {
    const before = police.wanted;
    police.reduceWanted(n);
    hud.showBanner(`Lia: Ganti Plat! Wanted ${before}★ → ${police.wanted}★.`);
  },
});
const dispatch = createDispatch(police);
const phone = createPhone(save, {
  getWaypoint: () => waypoint,
  getSnapshot: () => lastSnap,
  setWaypoint: (w) => {
    waypoint = w;
  },
  sideJobActive: () => sideJobs.active !== null,
  startJob: (id) => sideJobs.startJob(id),
  startRace: () => sideJobs.startRace(),
  onWaypoint: () => {},
});

function startGame() {
  if (mode === 'main') return;
  mode = 'main';
  hud.hideMenu();
  audio.resume();
  radio.start();
  hud.setPrompt('WASD jalan • E masuk mobil / bicara • G garasi • Q senjata • R radio • P HP • Z/X/C kru');
  crew.render();
  if (!save.introSeen && !shot.shot) {
    save.introSeen = true;
    storeSave(save);
    dialogue.show('Bu Sari', 'Raka! Akhirnya sampai juga. Bicara sama aku di depan bengkel buat mulai misi pertama. Kru bengkel — Yoga, Lia, Bima — siap membantumu.');
  }
  // Bersihkan antrean input: klik tombol MULAI sendiri tidak boleh
  // langsung menutup dialog intro (MouseLeft-nya masih di antrean).
  input.endFrame();
}

function togglePause() {
  if (mode === 'main') {
    mode = 'pause';
    hud.showPause(true);
  } else if (mode === 'pause') {
    mode = 'main';
    hud.showPause(false);
  }
}

document.getElementById('btn-start').addEventListener('click', () => {
  audio.resume();
  startGame();
});
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-restart').addEventListener('click', () => {
  wipeSave();
  window.location.reload();
});
document.getElementById('btn-close-garage').addEventListener('click', () => garage.close());

// --- Staging screenshot: mulai langsung, kamera tetap ---
if (shot.shot) {
  const staging = stageShot(
    {
      city,
      player,
      car,
      police,
      missions,
      traffic,
      dialogue,
      save,
      setClock: (h) => {
        gameHour = h;
        applyTimeOfDay();
      },
      start: () => startGame(),
    },
    shot.shot
  );
  if (shot.shot === 'menu') {
    hud.showMenu(save, districts, missions.currentAct());
  }
  if (staging) {
    shotCam = {
      pos: new THREE.Vector3(...staging.camPos),
      look: new THREE.Vector3(...staging.camLook),
    };
    camera.position.copy(shotCam.pos);
    camera.lookAt(shotCam.look);
  }
  if (shot.shot === 'drive' || shot.shot === 'cover') driving = true;
  shotReadyAt = performance.now() + 2600;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Debug API untuk playtest & screenshot ---
window.__game = {
  get mode() {
    return mode;
  },
  get driving() {
    return driving;
  },
  carState: car,
  player,
  buSari: city.buSari,
  traffic,
  police: {
    get wanted() {
      return police.wanted;
    },
  },
  missions,
  sideJobs,
  crew,
  phone,
  dialogue,
  dispatch,
  save,
  collectibles: {
    get found() {
      return collectibles.found;
    },
    get total() {
      return collectibles.total;
    },
  },
  districts: {
    get current() {
      return districts.at(player.pos.x, player.pos.z);
    },
    rep: (id) => districts.rep(id),
  },
  vehicles: {
    get owned() {
      return save.ownedCars;
    },
    get active() {
      return save.activeCarId;
    },
  },
  get waypoint() {
    return waypoint;
  },
  teleportTo(x, z) {
    if (driving) car.teleport(x, z, 0);
    else player.spawn(new THREE.Vector3(x, 0, z), 0);
  },
};

// --- Loop utama ---
const clock = new THREE.Clock();
let frames = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  frames++;

  // Esc bekerja di mode apa pun: tutup HP/dialog dulu, baru jeda.
  if (input.pressed('Escape')) {
    if (phone.isOpen) phone.close();
    else if (dialogue.isOpen) dialogue.advance();
    else togglePause();
  }

  if (mode === 'main') {
    // Toggle HP & garasi di luar worldFrozen: kalau sudah terbuka,
    // tombol yang sama harus tetap bisa menutupnya.
    if (input.pressed('KeyP')) {
      if (phone.isOpen) phone.close();
      else if (!garage.isOpen) phone.open();
    }
    if (input.pressed('KeyG')) {
      if (garage.isOpen) garage.close();
      else if (!phone.isOpen) garage.open();
    }
    const worldFrozen = garage.isOpen || phone.isOpen;
    if (!worldFrozen) {
      gameHour = (gameHour + dt / 150) % 24;
      if (frames % 240 === 0) applyTimeOfDay();

      // --- Input konteks ---
      const px = driving ? car.pos.x : player.pos.x;
      const pz = driving ? car.pos.z : player.pos.z;
      if (input.pressed('KeyR')) {
        hud.setPrompt(`Radio: ${radio.next()}`);
      }
      if (input.pressed('KeyH')) audio.horn();
      // Ability kru: Z Yoga, X Lia, C Bima.
      if (input.pressed('KeyZ')) crew.use(0, performance.now() / 1000);
      if (input.pressed('KeyX')) crew.use(1, performance.now() / 1000);
      if (input.pressed('KeyC')) crew.use(2, performance.now() / 1000);
      if (input.isDown('KeyQ') || input.isDown('Tab')) {
        if (!weapons.wheelOpen) weapons.setWheel(true);
      } else if (weapons.wheelOpen) {
        weapons.setWheel(false);
      }
      if (weapons.wheelOpen) {
        if (input.pressed('Digit1')) weapons.select(0);
        if (input.pressed('Digit2')) weapons.select(1);
        if (input.pressed('Digit3')) weapons.select(2);
        if (input.pressed('Digit4')) weapons.select(3);
      }
      // Dialog: E / klik kiri lanjut dulu (bukan menyerang / beraksi).
      // Satu tekanan E tidak boleh sekaligus menutup dialog DAN memicu
      // aksi E (misal langsung mulai misi berikutnya).
      let dialogAdvanced = false;
      if (dialogue.isOpen && (input.pressed('KeyE') || input.pressed('MouseLeft'))) {
        dialogue.advance();
        dialogAdvanced = true;
      }
      if (input.pressed('KeyF') || (input.pressed('MouseLeft') && !dialogue.isOpen && !dialogAdvanced)) {
        if (!driving) {
          player.punch();
          const targets = [];
          for (const p of traffic.peds) {
            targets.push({
              x: p.x,
              z: p.z,
              kind: 'ped',
              onHit: () => {
                p.x = (Math.random() - 0.5) * 500;
                p.z = (Math.random() - 0.5) * 500;
              },
            });
          }
          for (const c of police.cars) {
            targets.push({
              x: c.pos.x,
              z: c.pos.z,
              kind: 'police',
              onHit: () => {
                c.speed *= 0.4;
              },
            });
          }
          weapons.attack(player.pos, player.heading, targets);
        }
      }
      if (input.pressed('KeyE') && !dialogue.isOpen && !dialogAdvanced) {
        if (driving) {
          driving = false;
          car.setSpeed(0);
          player.spawn(new THREE.Vector3(car.pos.x + 2.5, 0, car.pos.z + 2.5), car.heading);
          hud.setPrompt('E — Masuk mobil • E dekat Bu Sari — Bicara');
        } else {
          const nearCar = Math.hypot(car.pos.x - px, car.pos.z - pz) < 4.5;
          const nearBuSari = Math.hypot(city.buSari.position.x - px, city.buSari.position.z - pz) < 4.5;
          const aiCar = traffic.nearestCar(px, pz, 4);
          if (nearBuSari) {
            if (missions.active) {
              hud.showBanner(`Misi berjalan: ${missions.active.def.name}`);
            } else if (missions.nextIndex >= 12) {
              hud.showBanner('Semua misi selesai — kamu legenda Cakrawala!');
            } else if (missions.startNext()) {
              audio.cash();
            }
          } else if (nearCar) {
            driving = true;
            audio.engine(0.2);
            hud.setPrompt('WASD mengemudi • Spasi rem • Shift nitro • E keluar • H klakson');
          } else if (aiCar) {
            const d = districts.at(px, pz);
            police.addHeat(14, districts.rep(d) <= 25);
            districts.addRep(d, -8);
            car.teleport(aiCar.mesh.position.x, aiCar.mesh.position.z, aiCar.mesh.rotation.y);
            car.setSpeed(8);
            scene.remove(aiCar.mesh);
            traffic.cars.splice(traffic.cars.indexOf(aiCar), 1);
            driving = true;
            hud.showBanner('Mobil dicuri! Wanted naik ★', 2600);
            audio.horn();
          }
        }
      }

      // --- Update dunia ---
      const targetPos = driving ? car.pos : player.pos;
      if (driving) {
        const nitro = car.update(dt, input, city.colliders, (spd) => {
          audio.crash();
          damage(spd * 0.35);
        });
        audio.engine(Math.min(1, Math.abs(car.speed) / 40) * (nitro ? 1.15 : 1));
        const ped = traffic.nearestPed(car.pos.x, car.pos.z, 2.2);
        if (ped && Math.abs(car.speed) > 3) {
          const d = districts.at(car.pos.x, car.pos.z);
          police.addHeat(12, districts.rep(d) <= 25);
          districts.addRep(d, -8);
          ped.x = (Math.random() - 0.5) * 500;
          ped.z = (Math.random() - 0.5) * 500;
          car.setSpeed(car.speed * 0.6);
          audio.crash();
          hud.showBanner('Kamu menabrak pejalan kaki! Wanted naik ★', 2400);
        }
      } else {
        player.update(dt, input, camHeading, city.colliders);
        audio.engineOff();
      }
      traffic.update(dt, targetPos);
      police.update(dt, targetPos, driving ? Math.abs(car.speed) : 0, (spd) => {
        audio.crash();
        damage(6 + spd * 0.25);
        hud.showBanner('Ditabrak polisi!', 1800);
      });
      missions.update(dt, targetPos, dialogue.isOpen);
      sideJobs.update(dt, targetPos, driving, dialogue.isOpen);
      collectibles.update(dt, targetPos, (x, z) => districts.at(x, z));
      weapons.update(dt);
      crew.update(dt);
      dialogue.update(dt);

      // --- Kamera kejar ---
      if (!shotCam) {
        const target = driving ? car.pos : player.pos;
        const heading = driving ? car.heading : player.heading;
        camHeading = heading;
        const back = driving ? 11.5 : 7.5;
        const up = driving ? 4.6 : 3.4;
        const wantPos = new THREE.Vector3(
          target.x - Math.sin(heading) * back,
          up,
          target.z - Math.cos(heading) * back
        );
        const wantLook = new THREE.Vector3(target.x + Math.sin(heading) * 9, 1.6, target.z + Math.cos(heading) * 9);
        camPos.lerp(wantPos, Math.min(1, dt * 5));
        camLook.lerp(wantLook, Math.min(1, dt * 7));
        camera.position.copy(camPos);
        camera.lookAt(camLook);
      } else {
        camera.position.copy(shotCam.pos);
        camera.lookAt(shotCam.look);
      }

      // --- HUD ---
      const activeMission = missions.active;
      const relicDots = RELICS.filter((r) => !save.relicsFound.includes(r.id)).map((r) => [r.x, r.z]);
      const jobTarget = sideJobs.active && sideJobs.active.kind === 'job' ? sideJobs.targetPosition() : null;
      const raceTarget = sideJobs.active && sideJobs.active.kind === 'race' ? sideJobs.targetPosition() : null;
      const snap = {
        money: save.money,
        health,
        armor,
        wanted: police.wanted,
        speedKmh: driving ? Math.abs(car.speed) * 3.6 : 0,
        clockText: clockText(),
        radioStation: radio.station,
        headingDeg: ((driving ? car.heading : player.heading) * 180) / Math.PI,
        playerPos: targetPos,
        heading: driving ? car.heading : player.heading,
        trafficCars: traffic.cars.map((c) => ({ x: c.mesh.position.x, z: c.mesh.position.z })),
        policeCars: police.cars.map((c) => ({ x: c.pos.x, z: c.pos.z })),
        heli: police.heli.visible ? { x: police.heli.position.x, z: police.heli.position.z } : null,
        missionTarget: missions.targetPosition(),
        jobTarget,
        raceTarget,
        waypoint,
        reveal: crew.reveal,
        landmarks: city.landmarks,
        relicsFound: save.relicsFound.length,
        relicsTotal: RELICS.length,
        relicDots,
        districtName: districts.nameOf(districts.at(targetPos.x, targetPos.z)),
        districtRep: districts.rep(districts.at(targetPos.x, targetPos.z)),
        missionsDone: save.missionsDone,
        activeMissionId: activeMission ? activeMission.def.id : null,
        activeJob: sideJobs.active && sideJobs.active.kind === 'job' ? sideJobs.active.def : null,
        garages: city.garages,
      };
      lastSnap = snap;
      hud.update(dt, snap);
      hud.updateRace(sideJobs.active, sideJobs.timer);
      dispatch.render(police.wanted, crew.reveal);
      if (phone.isOpen) phone.drawMap(snap);
      if (activeMission) hud.updateMissionBanner(activeMission, missions.timer);

      // Prompt konteks.
      if (!driving) {
        const nearCar = Math.hypot(car.pos.x - px, car.pos.z - pz) < 4.5;
        const nearBuSari = Math.hypot(city.buSari.position.x - px, city.buSari.position.z - pz) < 4.5;
        const aiCar = traffic.nearestCar(px, pz, 4);
        if (nearBuSari) hud.setPrompt('E — Bicara dengan Bu Sari (misi)');
        else if (nearCar) hud.setPrompt('E — Masuk mobil');
        else if (aiCar) hud.setPrompt('E — Curi mobil (Wanted +1!)');
        else hud.setPrompt('WASD jalan • F pukul • G garasi • Q senjata • R radio • P HP • Z/X/C kru');
      }

      saveTimer += dt;
      if (saveTimer > 8) {
        saveTimer = 0;
        save.health = health;
        save.armor = armor;
        storeSave(save);
      }
    }
  } else if (mode === 'menu' && !shotCam) {
    // Menu: kamera melayang pelan di atas kota.
    const t = performance.now() / 1000;
    camera.position.set(Math.sin(t * 0.03) * 180, 70, 200 + Math.cos(t * 0.03) * 60);
    camera.lookAt(0, 15, -30);
    city.update(dt);
  } else if (mode === 'menu' && shotCam) {
    camera.position.copy(shotCam.pos);
    camera.lookAt(shotCam.look);
  }

  if (mode !== 'pause') city.update(dt);
  const showMap = mode === 'main' ? '' : 'none';
  document.getElementById('hud-minimap').style.display = showMap;
  document.getElementById('hud-compass').style.display = showMap;
  document.body.classList.toggle('in-menu', mode === 'menu');
  renderer.render(scene, camera);
  input.endFrame();

  if (shot.shot && !window.__shotReady && performance.now() >= shotReadyAt) {
    window.__shotReady = true;
  }
  if (frames === 5) window.__gameReady = true;
}

applyTimeOfDay();
if (!shot.shot) hud.showMenu(save, districts, missions.currentAct());
frame();
