// police.js — Sistem wanted (bintang 1–5) + mobil polisi Kota Cakrawala.
// Wanted naik saat menabrak pejalan kaki, menabrak mobil polisi, atau
// memukul orang. Polisi mengejar & menabrak mobil pemain; kalau pemain
// lama tidak berbuat onar dan jauh dari polisi, wanted turun perlahan.
import * as THREE from 'three';
import { CITY } from './city.js';
import { makeCar, animateCar } from './vehicles.js';

const MAX_WANTED = 5;
const HELI_MIN_WANTED = 4; // helikopter polisi naik saat wanted 4–5
const ROADBLOCK_MIN_WANTED = 3; // roadblock muncul saat wanted 3+
const ROADBLOCK_COOLDOWN = 18; // detik antar roadblock baru

/** Bangun helikopter polisi low-poly: bodi, ekor, rotor utama + rotor ekor. */
function makeHeli() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x232830 });
  const glassMat = new THREE.MeshPhongMaterial({ color: 0x1a2836, shininess: 90 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 5.2), bodyMat);
  body.position.y = 0;
  body.castShadow = true;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.6), glassMat);
  nose.position.set(0, -0.1, 3.0);
  group.add(nose);
  // Garis putih + lampu merah-biru di badan supaya heli terlihat di langit senja.
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 0.4, 5.3),
    new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }),
  );
  stripe.position.set(0, 0.3, 0);
  group.add(stripe);
  const beaconR = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2222 }),
  );
  beaconR.position.set(0.9, 1.0, 1.2);
  group.add(beaconR);
  const beaconB = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x2266ff }),
  );
  beaconB.position.set(-0.9, 1.0, 1.2);
  group.add(beaconB);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 5.0), bodyMat);
  tail.position.set(0, 0.3, -4.6);
  group.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.0), bodyMat);
  fin.position.set(0, 1.0, -6.8);
  group.add(fin);
  // Skid (kaki pendaratan).
  for (const x of [-1.4, 1.4]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 4.4), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    skid.position.set(x, -1.1, 0.4);
    group.add(skid);
  }
  // Rotor utama (2 bilah panjang) + rotor ekor.
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const rotor = new THREE.Group();
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 0.5), rotorMat);
  rotor.add(blade1);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 11), rotorMat);
  rotor.add(blade2);
  rotor.position.y = 1.2;
  group.add(rotor);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.4), rotorMat);
  tailRotor.position.set(0.5, 0.6, -6.8);
  group.add(tailRotor);
  // Lampu sorot bawah (cone transparan) + titik cahaya.
  const spot = new THREE.Mesh(
    new THREE.ConeGeometry(5, 18, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }),
  );
  spot.position.y = -9.5;
  spot.rotation.x = Math.PI; // kerucut mengarah ke bawah
  group.add(spot);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8 }),
  );
  lamp.position.y = -1.2;
  group.add(lamp);
  group.userData = { rotor, tailRotor, spot };
  return group;
}

/** Bangun satu roadblock: 2 mobil polisi parkir melintang + barier oranye. */
function makeRoadblock(scene) {
  const group = new THREE.Group();
  const cars = [];
  for (const x of [-4.5, 4.5]) {
    const car = makeCar('police', 0x232830);
    car.position.set(x, 0, 0);
    car.rotation.y = Math.PI / 2; // melintang jalan
    group.add(car);
    cars.push(car);
  }
  const barrierMat = new THREE.MeshLambertMaterial({ color: 0xff6a00 });
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (const x of [-9, 0, 9]) {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.0, 0.5), barrierMat);
    barrier.position.set(x, 0.7, 0);
    barrier.castShadow = true;
    group.add(barrier);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 0.52), stripeMat);
    stripe.position.set(x, 0.85, 0);
    group.add(stripe);
    for (const legX of [-1.8, 1.8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.5), barrierMat);
      leg.position.set(x + legX, 0.35, 0);
      group.add(leg);
    }
  }
  scene.add(group);
  return { group, cars, pos: new THREE.Vector3(), heading: 0, life: 40 };
}

export class PoliceSystem {
  constructor(scene) {
    this.scene = scene;
    this.wanted = 0;
    this.calmTimer = 0; // waktu sejak kejahatan terakhir
    this.police = []; // { car, pos, heading, speed, stuckTimer }
    this.onWantedChange = null; // callback(level) — untuk suara & HUD
    this.heli = null; // { group, pos, angle } — helikopter polisi (wanted 4–5)
    this.roadblocks = []; // roadblock aktif (wanted 3+)
    this.roadblockTimer = 0;
    this.heliRotorSpeed = 0;
  }

  setWanted(level, silent = false) {
    const clamped = THREE.MathUtils.clamp(Math.round(level), 0, MAX_WANTED);
    if (clamped !== this.wanted) {
      this.wanted = clamped;
      this.calmTimer = 0;
      if (!silent && this.onWantedChange) this.onWantedChange(this.wanted);
      this._syncPoliceCount();
    }
  }

  addWanted(amount) { this.setWanted(this.wanted + amount); }

  /** Jumlah polisi aktif = level wanted (maks 5). */
  _syncPoliceCount() {
    while (this.police.length < this.wanted) this._spawnPolice();
    while (this.police.length > this.wanted) {
      const p = this.police.pop();
      this.scene.remove(p.car);
    }
  }

  _spawnPolice() {
    const car = makeCar('police', 0x232830);
    const p = { car, pos: new THREE.Vector3(), heading: 0, speed: 0, stuckTimer: 0 };
    this.police.push(p);
    this.scene.add(car);
    return p;
  }

  /** Tempatkan polisi di jalan dekat pemain (dipakai saat spawn & shot). */
  placeNear(p, targetPos, dist = 45) {
    const roads = [];
    for (let v = -CITY.gridHalf; v <= CITY.gridHalf; v += CITY.roadStep) roads.push(v);
    const nearestX = roads.reduce((a, b) => (Math.abs(b - targetPos.x) < Math.abs(a - targetPos.x) ? b : a));
    const nearestZ = roads.reduce((a, b) => (Math.abs(b - targetPos.z) < Math.abs(a - targetPos.z) ? b : a));
    const onXRoad = Math.random() < 0.5;
    const offset = (Math.random() < 0.5 ? -1 : 1) * dist;
    if (onXRoad) {
      p.pos.set(THREE.MathUtils.clamp(targetPos.x + offset, -300, 300), 0, nearestZ);
      p.heading = offset > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      p.pos.set(nearestX, 0, THREE.MathUtils.clamp(targetPos.z + offset, -300, 300));
      p.heading = offset > 0 ? Math.PI : 0;
    }
    p.speed = 10;
    p.car.position.copy(p.pos);
    p.car.rotation.y = p.heading;
  }

  /** Helikopter muncul saat wanted >= 4, hilang saat wanted turun. */
  _syncHeli(targetPos) {
    if (this.wanted >= HELI_MIN_WANTED && !this.heli) {
      const group = makeHeli();
      group.position.set(targetPos.x + 30, 42, targetPos.z - 20);
      this.scene.add(group);
      this.heli = { group, pos: group.position.clone(), angle: 0 };
      this.heliRotorSpeed = 0;
    } else if (this.wanted < HELI_MIN_WANTED && this.heli) {
      this.scene.remove(this.heli.group);
      this.heli = null;
    }
  }

  /** Roadblock: barikade polisi di jalan di depan arah gerak pemain. */
  _syncRoadblocks(dt, targetPos, targetHeading) {
    this.roadblockTimer -= dt;
    // Bersihkan roadblock yang kedaluwarsa / sudah tidak wanted.
    for (let i = this.roadblocks.length - 1; i >= 0; i--) {
      const rb = this.roadblocks[i];
      rb.life -= dt;
      if (rb.life <= 0 || this.wanted < ROADBLOCK_MIN_WANTED) {
        this.scene.remove(rb.group);
        this.roadblocks.splice(i, 1);
      }
    }
    if (this.wanted < ROADBLOCK_MIN_WANTED) return;
    if (this.roadblockTimer > 0 || this.roadblocks.length >= 2) return;
    // Tempatkan 70 m di depan pemain, di jalan yang sedang dilalui,
    // melintang jalan (barier menutup arah gerak pemain).
    const roads = [];
    for (let v = -CITY.gridHalf; v <= CITY.gridHalf; v += CITY.roadStep) roads.push(v);
    const aheadX = targetPos.x + Math.sin(targetHeading) * 70;
    const aheadZ = targetPos.z + Math.cos(targetHeading) * 70;
    const nearestX = roads.reduce((a, b) => (Math.abs(b - aheadX) < Math.abs(a - aheadX) ? b : a));
    const nearestZ = roads.reduce((a, b) => (Math.abs(b - aheadZ) < Math.abs(a - aheadZ) ? b : a));
    const alongX = Math.abs(Math.sin(targetHeading)) > Math.abs(Math.cos(targetHeading));
    const rb = makeRoadblock(this.scene);
    if (alongX) {
      rb.pos.set(THREE.MathUtils.clamp(aheadX, -300, 300), 0, nearestZ);
      rb.heading = Math.PI / 2;
    } else {
      rb.pos.set(nearestX, 0, THREE.MathUtils.clamp(aheadZ, -300, 300));
      rb.heading = 0;
    }
    rb.group.position.copy(rb.pos);
    rb.group.rotation.y = rb.heading;
    this.roadblocks.push(rb);
    this.roadblockTimer = ROADBLOCK_COOLDOWN;
  }

  /** Update helikopter: mengorbit di atas pemain, rotor berputar, sorot menyala. */
  _updateHeli(dt, targetPos) {
    if (!this.heli) return;
    const h = this.heli;
    h.angle += dt * 0.3; // orbit pelan supaya tetap di depan pemain saat screenshot
    const radius = 42;
    const tx = targetPos.x + Math.sin(h.angle) * radius;
    const tz = targetPos.z + Math.cos(h.angle) * radius;
    h.pos.x += (tx - h.pos.x) * Math.min(1, dt * 1.2);
    h.pos.z += (tz - h.pos.z) * Math.min(1, dt * 1.2);
    h.pos.y = 13 + Math.sin(h.angle * 2) * 1.5; // rendah: masuk frame kamera kejar
    h.group.position.copy(h.pos);
    h.group.rotation.y = Math.atan2(targetPos.x - h.pos.x, targetPos.z - h.pos.z);
    // Rotor makin cepat sampai kecepatan penuh.
    this.heliRotorSpeed = Math.min(22, this.heliRotorSpeed + dt * 6);
    h.group.userData.rotor.rotation.y += this.heliRotorSpeed * dt;
    h.group.userData.tailRotor.rotation.z += this.heliRotorSpeed * 1.6 * dt;
    // Lampu sorot berdenyut pelan.
    h.group.userData.spot.material.opacity = 0.11 + Math.sin(h.angle * 4) * 0.04;
  }

  /** Tempatkan helikopter tepat di atas pemain (untuk screenshot cover). */
  placeHeliAbove(targetPos) {
    this._syncHeli(targetPos);
    if (this.heli) {
      this.heli.pos.set(targetPos.x + 18, 40, targetPos.z - 14);
      this.heli.group.position.copy(this.heli.pos);
      this.heliRotorSpeed = 22;
    }
  }

  /** Roadblock dipaksa muncul di depan pemain (untuk screenshot cover). */
  forceRoadblockAhead(targetPos, heading) {
    if (this.roadblocks.length === 0 && this.wanted >= ROADBLOCK_MIN_WANTED) {
      this.roadblockTimer = 0;
      this._syncRoadblocks(0, targetPos, heading);
      this.roadblockTimer = ROADBLOCK_COOLDOWN;
    }
  }

  /** Kejar pemain: belok ke arah target, tabrak kalau sudah dekat. */
  update(dt, targetPos, targetSpeed, colliders, onRam, targetHeading = 0) {
    this._syncHeli(targetPos);
    this._updateHeli(dt, targetPos);
    this._syncRoadblocks(dt, targetPos, targetHeading);
    if (this.wanted === 0) {
      this.calmTimer += dt;
      return;
    }
    // Wanted turun 1 bintang tiap 25 detik tenang (dan polisi menjauh).
    this.calmTimer += dt;
    if (this.calmTimer > 25) {
      this.setWanted(this.wanted - 1);
      this.calmTimer = 0;
    }

    for (const p of this.police) {
      const dx = targetPos.x - p.pos.x;
      const dz = targetPos.z - p.pos.z;
      const dist = Math.hypot(dx, dz);
      const desired = Math.atan2(dx, dz);
      // Belok ke arah pemain (dibatasi laju belok).
      let diff = desired - p.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.heading += THREE.MathUtils.clamp(diff, -1.9 * dt, 1.9 * dt);

      // Kejar lebih cepat dari target, tapi tidak mustahil dikejar balik.
      const chaseSpeed = 26 + this.wanted * 1.5;
      p.speed += (chaseSpeed - p.speed) * Math.min(1, dt * 0.8);
      if (dist < 3.2) {
        // Menabrak: dorong pemain (callback di main.js) & polisi melambat.
        p.speed *= 0.55;
        if (onRam) onRam(p);
      }
      const nx = p.pos.x + Math.sin(p.heading) * p.speed * dt;
      const nz = p.pos.z + Math.cos(p.heading) * p.speed * dt;
      // Polisi tidak menembus gedung: kalau terhalang, belok acak.
      let blocked = false;
      for (const c of colliders) {
        if (nx > c.minX - 2 && nx < c.maxX + 2 && nz > c.minZ - 2 && nz < c.maxZ + 2) { blocked = true; break; }
      }
      if (blocked) {
        p.heading += (Math.random() < 0.5 ? 1 : -1) * 1.2;
        p.speed *= 0.7;
      } else {
        p.pos.x = THREE.MathUtils.clamp(nx, -330, 330);
        p.pos.z = THREE.MathUtils.clamp(nz, -330, 330);
      }
      p.car.position.copy(p.pos);
      p.car.rotation.y = p.heading;
      p.car.userData.speed = p.speed;
      animateCar(p.car, dt, false);
    }
  }

  /** Jarak polisi terdekat ke pemain (untuk HUD / logika sembunyi). */
  nearestDistance(targetPos) {
    let best = Infinity;
    for (const p of this.police) best = Math.min(best, p.pos.distanceTo(targetPos));
    return best;
  }

  clear() {
    for (const p of this.police) this.scene.remove(p.car);
    this.police.length = 0;
    for (const rb of this.roadblocks) this.scene.remove(rb.group);
    this.roadblocks.length = 0;
    if (this.heli) this.scene.remove(this.heli.group);
    this.heli = null;
    this.wanted = 0;
    this.calmTimer = 0;
    this.roadblockTimer = 0;
  }
}
