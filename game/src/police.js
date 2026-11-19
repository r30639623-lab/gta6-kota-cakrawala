// police.js — Sistem wanted (bintang 1–5) + mobil polisi Kota Cakrawala.
// Wanted naik saat menabrak pejalan kaki, menabrak mobil polisi, atau
// memukul orang. Polisi mengejar & menabrak mobil pemain; kalau pemain
// lama tidak berbuat onar dan jauh dari polisi, wanted turun perlahan.
import * as THREE from 'three';
import { CITY } from './city.js';
import { makeCar, animateCar } from './vehicles.js';

const MAX_WANTED = 5;

export class PoliceSystem {
  constructor(scene) {
    this.scene = scene;
    this.wanted = 0;
    this.calmTimer = 0; // waktu sejak kejahatan terakhir
    this.police = []; // { car, pos, heading, speed, stuckTimer }
    this.onWantedChange = null; // callback(level) — untuk suara & HUD
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

  /** Kejar pemain: belok ke arah target, tabrak kalau sudah dekat. */
  update(dt, targetPos, targetSpeed, colliders, onRam) {
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
    this.wanted = 0;
    this.calmTimer = 0;
  }
}
