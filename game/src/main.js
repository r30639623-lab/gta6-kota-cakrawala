// main.js — Kota Cakrawala: open-world crime 3D (three.js).
// Boot, game loop, kamera third-person, jalan kaki + masuk/curi mobil,
// mengemudi, interaksi Bu Sari, wanted, misi, HUD, layar menu/pause.
// Semua sistem di src/ lain dirakit di sini. ?shot=<nama>&seed=N men-stage
// adegan screenshot (lihat shots.js).
import * as THREE from 'three';
import { createCity, CITY, PLACES, createRandom } from './city.js';
import { makeCar, driveCar, DustParticles } from './vehicles.js';
import { TrafficSystem } from './traffic.js';
import { PoliceSystem } from './police.js';
import { MissionSystem, MISSIONS } from './missions.js';
import { Hud } from './hud.js';
import { GameAudio } from './audio.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { loadSave, storeSave, recordMissionComplete } from './save.js';
import { applyShot } from './shots.js';

const BOUNDS = 420; // batas gerak pemain (daratan + pantai)

export class Game {
  constructor() {
    const params = new URLSearchParams(location.search);
    this.seed = Number(params.get('seed') || 1);
    this.shotName = params.get('shot');
    this.rng = createRandom(this.seed);

    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(-220, 40, 280);

    this.input = new Input(this.canvas);
    this.audio = new GameAudio();
    this.save = loadSave();
    this.hud = new Hud();
    this.hudEl = document.getElementById('hud');

    // --- Dunia ---
    this.city = createCity(this.scene, this.seed);
    this.traffic = new TrafficSystem(this.scene, this.seed + 7, 14, 22);
    this.police = new PoliceSystem(this.scene);
    this.missions = new MissionSystem(this.scene);
    this.dust = new DustParticles(this.scene);
    this.player = new Player(this.scene);
    this.player.spawn(PLACES.spawn, Math.PI * 0.75);

    // Bu Sari: NPC pemberi misi di depan bengkel.
    this.buSari = this._makeBuSari();
    this.buSari.position.set(PLACES.workshop.x - 6, 0, PLACES.workshop.z - 14);
    this.scene.add(this.buSari);

    // --- Mobil ---
    this.parkedCars = []; // mobil yang bisa dimasuki/dicuri
    this._spawnParkedCars();
    this.driving = false;
    this.currentCar = null; // { car, state: {pos, heading, speed}, owned }
    this.carState = { pos: new THREE.Vector3(), heading: 0, speed: 0 };

    // --- Kamera ---
    this.camYaw = Math.PI * 0.75;
    this.camPitch = 0.32;
    this.camDist = 9;

    // --- Status ---
    this.mode = 'menu'; // menu | playing | paused
    this.elapsed = 0;
    this.lastCrimeAt = -99;
    this.policeRamCooldown = 0;
    this.missionBanner = null;

    this._wireOverlays();
    this._wireMissions();
    this.police.onWantedChange = (level) => {
      this.hud.setWanted(level);
      if (level > 0) this.audio.wantedUp();
    };

    window.addEventListener('resize', () => this._onResize());
    this._onResize();
  }

  _makeBuSari() {
    const g = new THREE.Group();
    const dress = new THREE.MeshLambertMaterial({ color: 0xd63384 });
    const skin = new THREE.MeshLambertMaterial({ color: 0xe8b98a });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 8), dress);
    body.position.y = 0.75;
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), skin);
    head.position.y = 1.7;
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    bun.position.set(0, 1.95, -0.1);
    g.add(body, head, bun);
    return g;
  }

  _spawnParkedCars() {
    // Kancil GT milik Raka di dekat bengkel + mobil warga terparkir di jalan.
    const spots = [
      { kind: 'sport', color: 0xe67e22, x: -252, z: 240, heading: Math.PI / 2, owned: true },
      { kind: 'pickup', color: 0x2471a3, x: -180, z: -232, heading: 0, owned: false },
      { kind: 'sedan', color: 0xc0392b, x: 120, z: 172, heading: Math.PI, owned: false },
      { kind: 'sedan', color: 0x1e8449, x: 232, z: -60, heading: -Math.PI / 2, owned: false },
      { kind: 'pickup', color: 0xd4ac0d, x: -60, z: 292, heading: Math.PI / 2, owned: false },
      { kind: 'sedan', color: 0x7d3c98, x: 60, z: -292, heading: 0, owned: false },
    ];
    for (const s of spots) {
      const car = makeCar(s.kind, s.color);
      car.position.set(s.x, 0, s.z);
      car.rotation.y = s.heading;
      car.userData.parked = true;
      this.scene.add(car);
      this.parkedCars.push({ car, pos: new THREE.Vector3(s.x, 0, s.z), heading: s.heading, owned: s.owned, kind: s.kind });
    }
  }

  // ---------- Overlay layar (menu / pause / misi) ----------
  _wireOverlays() {
    this.menuEl = document.getElementById('screen-menu');
    this.pauseEl = document.getElementById('screen-pause');
    this.resultEl = document.getElementById('screen-result');
    this.resultTitle = document.getElementById('result-title');
    this.resultBody = document.getElementById('result-body');
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-restart').addEventListener('click', () => this.restartToMenu());
    document.getElementById('btn-result').addEventListener('click', () => {
      this.resultEl.classList.add('hidden');
      if (this.mode === 'playing') this._resumeAfterResult();
    });
    document.getElementById('btn-mute').addEventListener('click', () => {
      this.audio.ensure();
      this.audio.setMuted(!this.audio.muted);
      document.getElementById('btn-mute').textContent = this.audio.muted ? '🔇 Suara: Mati' : '🔊 Suara: Hidup';
    });
    this._refreshMenuProgress();
  }

  _refreshMenuProgress() {
    const done = Object.values(this.save.missionsDone).filter(Boolean).length;
    document.getElementById('menu-progress').textContent =
      `Misi selesai: ${done}/3  •  Uang: $${this.save.money}  •  Bintang: ${Object.values(this.save.missionStars).reduce((a, b) => a + b, 0)}/9`;
  }

  _wireMissions() {
    this.missions.onStart = (def) => {
      this.audio.missionStart();
      if (def.wantedOnStart) this.police.setWanted(def.wantedOnStart);
      this.hud.toast(`${def.title} — ${def.brief}`, 5);
      this.hud.setObjective(`${def.title}: ${def.brief}`, def.timeLimit);
    };
    this.missions.onComplete = (def, stars, timeLeft) => {
      recordMissionComplete(this.save, def.id, def.reward, stars, timeLeft);
      this.audio.missionComplete();
      this.police.setWanted(0);
      this._refreshMenuProgress();
      this.resultTitle.textContent = 'MISI SELESAI!';
      this.resultBody.innerHTML =
        `<b>${def.title}</b><br>Hadiah: <b>$${def.reward}</b> &nbsp;•&nbsp; Bintang: ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}<br>` +
        `Sisa waktu: ${Math.ceil(timeLeft)} dtk &nbsp;•&nbsp; Total uang: <b>$${this.save.money}</b>` +
        (this.missions.nextMission() ? `<br>Misi berikutnya: <b>${this.missions.nextMission().title}</b> — temui Bu Sari di bengkel.` : '<br><b>Semua misi selesai!</b> Kota Cakrawala aman di tangan Raka. 🎉');
      this.resultEl.classList.remove('hidden');
      this.mode = 'result';
    };
    this.missions.onFail = (def, reason) => {
      this.audio.missionFail();
      this.resultTitle.textContent = 'MISI GAGAL';
      this.resultBody.innerHTML = `<b>${def.title}</b><br>${reason}<br>Coba lagi — temui Bu Sari di bengkel.`;
      this.resultEl.classList.remove('hidden');
      this.mode = 'result';
    };
  }

  _resumeAfterResult() { this.mode = 'playing'; }

  startGame() {
    this.audio.ensure();
    this.audio.click();
    this.menuEl.classList.add('hidden');
    this.mode = 'playing';
    if (!this.missions.active && this.missions.nextIndex === 0 && !this.save.missionsDone.m1) {
      this.hud.toast('Temui Bu Sari di depan bengkel (tanda oranye) — tekan E untuk bicara.', 5);
    }
    this.hud.setMoney(this.save.money);
    this.hud.setWanted(this.police.wanted);
  }

  restartToMenu() {
    this.pauseEl.classList.add('hidden');
    this.menuEl.classList.remove('hidden');
    this.mode = 'menu';
    this.missions.abort();
    this.police.clear();
    this.player.spawn(PLACES.spawn, Math.PI * 0.75);
    if (this.driving) this._exitCar(true);
    this._refreshMenuProgress();
  }

  togglePause(force) {
    if (this.mode !== 'playing' && this.mode !== 'paused') return;
    const toPause = force !== undefined ? force : this.mode === 'playing';
    this.mode = toPause ? 'paused' : 'playing';
    this.pauseEl.classList.toggle('hidden', !toPause);
  }

  // ---------- Masuk / keluar / curi mobil ----------
  _nearestParkedCar(maxDist = 4.5) {
    let best = null;
    let bestD = maxDist;
    for (const p of this.parkedCars) {
      const d = p.pos.distanceTo(this.player.pos);
      if (d < bestD) { best = p; bestD = d; }
    }
    return best;
  }

  _nearestTrafficCar(maxDist = 4.5) {
    let best = null;
    let bestD = maxDist;
    for (const c of this.traffic.cars) {
      if (c.car.userData.speed > 3) continue; // hanya mobil yang (hampir) berhenti
      const d = c.pos.distanceTo(this.player.pos);
      if (d < bestD) { best = c; bestD = d; }
    }
    return best;
  }

  _enterCar(entry) {
    // entry: { car, pos, heading, owned?, kind? } atau TrafficCar
    let car, pos, heading, owned = false, kind = 'sedan';
    if (entry.car && entry.pos) {
      car = entry.car; pos = entry.pos; heading = entry.heading; owned = !!entry.owned; kind = entry.kind || 'sedan';
      this.parkedCars = this.parkedCars.filter((p) => p !== entry);
    } else {
      // Mobil lalu lintas yang dicuri.
      car = entry.car; pos = entry.pos; heading = entry.heading; kind = entry.car.userData.kind;
      this.traffic.cars = this.traffic.cars.filter((c) => c !== entry);
      this.hud.toast('Mobil dicuri! Warga melapor — wanted naik.', 3);
      this.police.addWanted(1);
    }
    this.currentCar = { car, owned, kind };
    this.carState.pos.copy(pos);
    this.carState.heading = heading;
    this.carState.speed = 0;
    this.driving = true;
    this.player.hide();
    this.audio.door();
    this.camYaw = heading;
  }

  _exitCar(toMenu = false) {
    if (!this.currentCar) return;
    const car = this.currentCar.car;
    // Turun di sisi kiri mobil.
    const sideX = Math.cos(this.carState.heading);
    const sideZ = -Math.sin(this.carState.heading);
    this.player.spawn(
      new THREE.Vector3(this.carState.pos.x + sideX * 2.2, 0, this.carState.pos.z + sideZ * 2.2),
      this.carState.heading,
    );
    this.player.show();
    this.parkedCars.push({
      car, pos: this.carState.pos.clone(), heading: this.carState.heading,
      owned: this.currentCar.owned, kind: this.currentCar.kind,
    });
    this.currentCar = null;
    this.driving = false;
    this.audio.door();
    if (!toMenu) this.camYaw = this.player.heading;
  }

  // ---------- Update utama ----------
  update(dt) {
    this.elapsed += dt;
    this.city.update(dt, this.elapsed);
    this.hud.update(dt);
    this.audio.updateSiren(dt, this.police.wanted);

    // Bu Sari mengangguk pelan (idle).
    this.buSari.rotation.y = Math.sin(this.elapsed * 0.8) * 0.3;
    this.buSari.position.y = Math.abs(Math.sin(this.elapsed * 2)) * 0.08;

    if (this.mode === 'menu') {
      // Mode tarik: kamera mengorbit kota, lalu lintas tetap jalan.
      this.hudEl.style.display = 'none';
      this.traffic.update(dt, null);
      const a = this.elapsed * 0.05;
      this.camera.position.set(Math.sin(a) * 260, 120, Math.cos(a) * 260);
      this.camera.lookAt(0, 10, 0);
      this.input.endFrame();
      return;
    }
    if (this.mode !== 'playing') {
      // Esc/P bisa membuka DAN menutup pause (cek di sini, sebelum return,
      // supaya tombol bekerja juga saat sedang pause).
      if ((this.mode === 'paused') && (this.input.tapped('Escape') || this.input.tapped('KeyP'))) {
        this.togglePause(false);
      }
      this.input.endFrame();
      return;
    }
    this.hudEl.style.display = 'block';

    // Audio menyala setelah interaksi pertama.
    if (this.input.anyGesture) this.audio.ensure();
    if (this.input.tapped('KeyM')) {
      this.audio.ensure();
      this.audio.setMuted(!this.audio.muted);
    }
    if (this.input.tapped('Escape') || this.input.tapped('KeyP')) this.togglePause();

    // Kamera: drag mouse mengorbit.
    const mouse = this.input.consumeMouse();
    const userDraggedCamera = Math.abs(mouse.dx) > 0.5;
    this.camYaw -= mouse.dx * 0.005;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + mouse.dy * 0.003, 0.08, 0.9);

    const playerPos = this.driving ? this.carState.pos : this.player.pos;
    this.traffic.update(dt, playerPos);

    // --- Misi ---
    if (this.missions.active) {
      const result = this.missions.update(dt, playerPos, this.elapsed);
      if (result === 'checkpoint') {
        this.audio.pickup();
        this.hud.toast(`Checkpoint! Tujuan berikutnya: ${this.missions.currentTargetName()}`, 2.5);
      }
      const a = this.missions.active;
      if (a) this.hud.setObjective(`${a.def.title}: ${this.missions.currentTargetName()}`, a.timeLeft);
    } else {
      const next = this.missions.nextMission();
      this.hud.setObjective(next ? `Misi berikutnya: ${next.title} — temui Bu Sari di bengkel` : 'Semua misi selesai! Jelajahi Kota Cakrawala.', null);
    }

    // --- Interaksi E ---
    let prompt = '';
    if (!this.driving) {
      const nearBuSari = this.player.pos.distanceTo(this.buSari.position) < 4.5;
      const nearCar = this._nearestParkedCar();
      const nearTraffic = !nearCar ? this._nearestTrafficCar() : null;
      if (nearBuSari && !this.missions.active && this.missions.nextMission()) {
        prompt = 'E — Bicara dengan Bu Sari';
        if (this.input.tapped('KeyE')) this.missions.start();
      } else if (nearCar) {
        prompt = nearCar.owned ? 'E — Masuk Kancil GT' : 'E — Masuk mobil';
        if (this.input.tapped('KeyE')) this._enterCar(nearCar);
      } else if (nearTraffic) {
        prompt = 'E — Curi mobil ini';
        if (this.input.tapped('KeyE')) this._enterCar(nearTraffic);
      }
    } else if (this.input.tapped('KeyE')) {
      this._exitCar();
    }
    if (this.driving) prompt = 'E — Keluar mobil   •   Spasi — Rem tangan';

    // --- Pukulan (F) saat jalan kaki ---
    if (!this.driving && this.input.tapped('KeyF')) {
      if (this.player.punch()) {
        this.audio.punch();
        const victim = this.traffic.nearestPedInFront(this.player.pos, this.player.heading);
        if (victim) {
          victim.knockDown();
          this.police.addWanted(1);
          this.hud.toast('Kamu memukul pejalan kaki! Wanted naik.', 2.5);
        }
      }
    }

    // --- Jalan kaki / mengemudi ---
    if (this.driving && this.currentCar) {
      const res = driveCar(this.currentCar.car, this.carState, this.input, dt, this.city.colliders, BOUNDS);
      if (res.crashed) {
        this.audio.crash(Math.min(1, Math.abs(this.carState.speed) / 20 + 0.3));
        this.dust.spawn(this.carState.pos, 5);
      }
      if (res.drifting) this.dust.spawn(this.carState.pos, 2);
      this.audio.setEngine(Math.abs(this.carState.speed) / 42, true);
      this.hud.setSpeed(res.speedKmh, true);
      // Tabrak pejalan kaki saat mengemudi.
      for (const ped of this.traffic.pedsHitByCar(this.carState.pos, 2.4)) {
        ped.knockDown();
        this.police.addWanted(1);
        this.audio.crash(0.8);
        this.hud.toast('Kamu menabrak pejalan kaki! Wanted naik.', 2.5);
      }
      // Tabrak mobil polisi = wanted naik (cooldown 2 dtk).
      if (this.policeRamCooldown > 0) this.policeRamCooldown -= dt;
      for (const p of this.police.police) {
        if (p.pos.distanceTo(this.carState.pos) < 3.4 && this.policeRamCooldown <= 0) {
          this.police.addWanted(1);
          this.policeRamCooldown = 2;
          this.audio.crash(1);
        }
      }
      // Kamera kejar: di belakang mobil, mengikut arah mobil secara halus
      // (kecuali pemain sedang mengorbit manual dengan mouse).
      const targetYaw = this.carState.heading;
      let diff = targetYaw - this.camYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (!userDraggedCamera) this.camYaw += diff * Math.min(1, dt * 1.6);
    } else {
      this.player.update(dt, this.input, this.camYaw, this.city.colliders, BOUNDS);
      this.audio.setEngine(0, false);
      this.hud.setSpeed(0, false);
    }

    // --- Polisi ---
    this.police.update(dt, playerPos, this.driving ? this.carState.speed : 0, this.city.colliders, (p) => {
      // Polisi menabrak mobil pemain: dorong mobil pemain sedikit (cooldown
      // supaya tidak berdentang tiap frame saat polisi menempel).
      if (this.driving && this.policeRamCooldown <= 0) {
        this.carState.speed *= 0.85;
        this.audio.crash(0.7);
        this.dust.spawn(this.carState.pos, 4);
        this.policeRamCooldown = 0.8;
      }
    });

    this.hud.setPrompt(prompt);
    this.hud.setMoney(this.save.money);
    this.hud.setWanted(this.police.wanted);

    // --- Kamera third-person ---
    const focus = this.driving ? this.carState.pos : this.player.pos;
    const dist = this.driving ? 13 : 8.5;
    const height = this.driving ? 5.0 : 3.2;
    const cx = focus.x - Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist;
    const cz = focus.z - Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist;
    const cy = focus.y + height + Math.sin(this.camPitch) * dist * 0.6;
    const targetPos = new THREE.Vector3(cx, cy, cz);
    this.camera.position.lerp(targetPos, Math.min(1, dt * 8));
    this.camera.lookAt(focus.x, focus.y + 1.6, focus.z);

    // --- Minimap ---
    this.hud.drawMinimap({
      playerPos,
      playerHeading: this.driving ? this.carState.heading : this.player.heading,
      trafficCars: this.traffic.cars,
      police: this.police.police,
      missionTarget: this.missions.activeTarget,
      elapsed: this.elapsed,
    });

    this.dust.update(dt);
    this.input.endFrame();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  run() {
    const clock = new THREE.Clock();
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
      if (!window.__gameReady) {
        window.__gameReady = true;
        window.__game = this;
      }
    };
    loop();
  }
}

// Boot: terapkan shot (kalau ada) lalu jalan.
const game = new Game();
if (game.shotName) {
  applyShot(game, game.shotName);
} else {
  game.city.setTimeOfDay('day');
}
game.run();
