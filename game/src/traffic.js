// traffic.js — Lalu lintas & pejalan kaki AI Kota Cakrawala.
// Mobil AI mengikuti grid jalan (belok acak di persimpangan, melambat kalau
// ada mobil di depan). Pejalan kaki berjalan di trotoar, berbelok di
// persimpangan, dan jatuh kalau dipukul/ditabrak.
import * as THREE from 'three';
import { CITY } from './city.js';
import { makeCar, animateCar } from './vehicles.js';

const ROADS = [];
for (let v = -CITY.gridHalf; v <= CITY.gridHalf; v += CITY.roadStep) ROADS.push(v);

function randomRoad(rng) { return ROADS[Math.floor(rng() * ROADS.length)]; }

/** Satu mobil lalu lintas: posisi, arah sumbu jalan, kecepatan. */
class TrafficCar {
  constructor(scene, rng) {
    // Ragam kendaraan kota: sedan, pickup, taksi kuning, van pasar.
    const roll = rng();
    const kind = roll < 0.18 ? 'taxi' : roll < 0.32 ? 'van' : roll < 0.52 ? 'pickup' : 'sedan';
    const color = kind === 'taxi' ? 0xd4ac0d : undefined;
    this.car = makeCar(kind, color);
    this.car.userData.speed = 0;
    this.kind = kind;
    this.axis = rng() < 0.5 ? 'x' : 'z'; // jalan yang dilalui
    this.line = randomRoad(rng);
    this.dir = rng() < 0.5 ? 1 : -1;
    this.lane = (rng() < 0.5 ? -3.4 : 3.4);
    this.speed = 8 + rng() * 6;
    this.targetSpeed = this.speed;
    const along = (Math.floor(rng() * 11) * 60 - 300);
    this.pos = new THREE.Vector3(
      this.axis === 'x' ? along : this.line + this.lane,
      0,
      this.axis === 'x' ? this.line + this.lane : along,
    );
    this.heading = this.axis === 'x'
      ? (this.dir > 0 ? Math.PI / 2 : -Math.PI / 2)
      : (this.dir > 0 ? 0 : Math.PI);
    scene.add(this.car);
  }

  update(dt, others, playerPos) {
    // Melambat kalau ada mobil lain / pemain di depan (jarak < 10).
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    let blocked = false;
    const ahead = (p) => {
      const dx = p.x - this.pos.x;
      const dz = p.z - this.pos.z;
      const along = dx * fx + dz * fz;
      const side = Math.abs(dx * fz - dz * fx);
      return along > 0 && along < 11 && side < 3;
    };
    for (const o of others) if (o !== this && ahead(o.pos)) { blocked = true; break; }
    if (!blocked && playerPos && ahead(playerPos)) blocked = true;
    this.targetSpeed = blocked ? 0 : this.speed;
    const cur = this.car.userData.speed;
    const next = cur + (this.targetSpeed - cur) * Math.min(1, dt * 2);
    this.car.userData.speed = next;
    this.pos.x += fx * next * dt;
    this.pos.z += fz * next * dt;

    // Di persimpangan: kadang belok kiri/kanan ke jalan lain.
    const coord = this.axis === 'x' ? this.pos.x : this.pos.z;
    const nearLine = ROADS.some((r) => Math.abs(coord - r) < 0.6);
    if (nearLine && Math.random() < dt * 0.25) {
      this._turn();
    }
    // Keluar kota: balik arah di ujung jalan.
    const limit = CITY.gridHalf + 10;
    if (Math.abs(this.pos.x) > limit || Math.abs(this.pos.z) > limit) {
      this.dir *= -1;
      this.heading += Math.PI;
    }
    this.car.position.copy(this.pos);
    this.car.rotation.y = this.heading;
    animateCar(this.car, dt, false);
  }

  _turn() {
    const turnLeft = Math.random() < 0.5;
    // Putar 90 derajat; ganti sumbu & garis jalan.
    const newAxis = this.axis === 'x' ? 'z' : 'x';
    const crossCoord = newAxis === 'x' ? this.pos.z : this.pos.x;
    const nearest = ROADS.reduce((a, b) => (Math.abs(b - crossCoord) < Math.abs(a - crossCoord) ? b : a));
    this.axis = newAxis;
    this.line = nearest;
    this.lane = turnLeft ? -3.4 : 3.4;
    const turn = turnLeft ? -Math.PI / 2 : Math.PI / 2;
    // Arah baru tergantung arah datang & arah belok.
    this.heading = THREE.MathUtils.euclideanModulo(this.heading + turn, Math.PI * 2);
    // Selaraskan posisi ke lajur jalan baru.
    if (this.axis === 'x') {
      this.pos.z = this.line + this.lane;
      this.dir = Math.abs(this.heading - Math.PI / 2) < 0.1 ? 1 : -1;
    } else {
      this.pos.x = this.line + this.lane;
      this.dir = Math.abs(this.heading) < 0.1 ? 1 : -1;
    }
  }
}

/** Satu pejalan kaki: model low-poly sederhana, jalan di trotoar. */
class Pedestrian {
  constructor(scene, rng) {
    this.group = new THREE.Group();
    const shirtColors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xecf0f1, 0xe67e22, 0x2ecc71, 0xfd79a8, 0x00cec9];
    const skinTones = [0xe8b98a, 0xc98d5f, 0x8d5524, 0xffdbac];
    const shirt = new THREE.MeshLambertMaterial({ color: shirtColors[Math.floor(rng() * shirtColors.length)] });
    const skin = new THREE.MeshLambertMaterial({ color: skinTones[Math.floor(rng() * skinTones.length)] });
    const pantsColors = [0x2c3e50, 0x5d4037, 0x37474f, 0x6d4c41, 0x1a237e];
    const pants = new THREE.MeshLambertMaterial({ color: pantsColors[Math.floor(rng() * pantsColors.length)] });
    // Variasi warga: tinggi badan, topi, pelari (jogger), dan ibu-ibu berdaster.
    this.variant = rng() < 0.16 ? 'jogger' : rng() < 0.14 ? 'elder' : 'walker';
    const heightScale = this.variant === 'elder' ? 0.88 : 0.94 + rng() * 0.18;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), shirt);
    body.position.y = 1.05;
    body.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skin);
    head.position.y = 1.62;
    head.castShadow = true;
    // Topi / kerudung / rambut: variasi kepala warga kota.
    const headRoll = rng();
    if (headRoll < 0.22) {
      const hat = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.1, 0.42),
        new THREE.MeshLambertMaterial({ color: 0xf1c40f }),
      );
      hat.position.y = 1.84;
      this.group.add(hat);
    } else if (headRoll < 0.42) {
      const hair = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.14, 0.4),
        new THREE.MeshLambertMaterial({ color: 0x2d1a0e }),
      );
      hair.position.y = 1.82;
      this.group.add(hair);
    } else if (headRoll < 0.55) {
      const scarf = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.5, 0.42),
        new THREE.MeshLambertMaterial({ color: [0xd63384, 0x1abc9c, 0x8e44ad][Math.floor(rng() * 3)] }),
      );
      scarf.position.y = 1.62;
      this.group.add(scarf);
    }
    this.group.scale.setScalar(heightScale);
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), pants);
    this.legL.position.set(0, 0.33, 0.14);
    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), pants);
    this.legR.position.set(0, 0.33, -0.14);
    this.group.add(body, head, this.legL, this.legR);
    this.axis = rng() < 0.5 ? 'x' : 'z';
    this.line = randomRoad(rng);
    this.side = (rng() < 0.5 ? -1 : 1) * (CITY.roadHalf + 2.2);
    this.dir = rng() < 0.5 ? 1 : -1;
    const along = (Math.floor(rng() * 11) * 60 - 300);
    this.pos = new THREE.Vector3(
      this.axis === 'x' ? along : this.line + this.side,
      0,
      this.axis === 'x' ? this.line + this.side : along,
    );
    this.speed = this.variant === 'jogger' ? 2.6 + rng() * 0.8 : this.variant === 'elder' ? 0.8 + rng() * 0.3 : 1.2 + rng() * 0.9;
    this.heading = this.axis === 'x' ? (this.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (this.dir > 0 ? 0 : Math.PI);
    this.walkPhase = rng() * Math.PI * 2;
    this.down = false; // jatuh (dipukul / ditabrak)
    this.downTimer = 0;
    this.group.position.copy(this.pos);
    scene.add(this.group);
  }

  update(dt) {
    if (this.down) {
      this.downTimer -= dt;
      if (this.downTimer <= 0) {
        this.down = false;
        this.group.rotation.x = 0;
        this.group.position.y = 0;
      }
      return;
    }
    this.walkPhase += dt * this.speed * 4;
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    this.pos.x += fx * this.speed * dt;
    this.pos.z += fz * this.speed * dt;
    const coord = this.axis === 'x' ? this.pos.x : this.pos.z;
    if (ROADS.some((r) => Math.abs(coord - r) < 0.5) && Math.random() < dt * 0.3) {
      this._turn();
    }
    const limit = CITY.gridHalf + 12;
    if (Math.abs(this.pos.x) > limit || Math.abs(this.pos.z) > limit) {
      this.heading += Math.PI;
      this.dir *= -1;
    }
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    // Ayunan kaki saat berjalan.
    const swing = Math.sin(this.walkPhase) * 0.5;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
  }

  _turn() {
    const newAxis = this.axis === 'x' ? 'z' : 'x';
    const crossCoord = newAxis === 'x' ? this.pos.z : this.pos.x;
    const nearest = ROADS.reduce((a, b) => (Math.abs(b - crossCoord) < Math.abs(a - crossCoord) ? b : a));
    this.axis = newAxis;
    this.line = nearest;
    this.side = (Math.random() < 0.5 ? -1 : 1) * (CITY.roadHalf + 2.2);
    this.heading = THREE.MathUtils.euclideanModulo(this.heading + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2), Math.PI * 2);
    if (this.axis === 'x') this.pos.z = this.line + this.side;
    else this.pos.x = this.line + this.side;
  }

  knockDown() {
    if (this.down) return;
    this.down = true;
    this.downTimer = 4;
    this.group.rotation.x = -Math.PI / 2;
    this.group.position.y = 0.3;
  }
}

export class TrafficSystem {
  constructor(scene, seed = 1, carCount = 14, pedCount = 22) {
    this.scene = scene;
    let s = seed | 0;
    this.rng = () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    this.cars = [];
    this.peds = [];
    for (let i = 0; i < carCount; i++) this.cars.push(new TrafficCar(scene, this.rng));
    for (let i = 0; i < pedCount; i++) this.peds.push(new Pedestrian(scene, this.rng));
  }

  update(dt, playerPos) {
    for (const c of this.cars) c.update(dt, this.cars, playerPos);
    for (const p of this.peds) p.update(dt);
  }

  /** Pejalan kaki terdekat di depan posisi & arah tertentu (untuk pukulan). */
  nearestPedInFront(pos, heading, maxDist = 2.4) {
    let best = null;
    let bestD = maxDist;
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    for (const p of this.peds) {
      if (p.down) continue;
      const dx = p.pos.x - pos.x;
      const dz = p.pos.z - pos.z;
      const along = dx * fx + dz * fz;
      const side = Math.abs(dx * fz - dz * fx);
      if (along > 0 && along < bestD && side < 1.2) {
        best = p;
        bestD = along;
      }
    }
    return best;
  }

  /** Pejalan kaki yang tertabrak mobil pemain (radius tabrakan). */
  pedsHitByCar(pos, radius = 2.2) {
    const hit = [];
    for (const p of this.peds) {
      if (p.down) continue;
      if (p.pos.distanceTo(pos) < radius) hit.push(p);
    }
    return hit;
  }

  /** Hitung kendaraan per jenis (untuk debug & HUD kota hidup). */
  countByKind() {
    const counts = { sedan: 0, pickup: 0, taxi: 0, van: 0 };
    for (const c of this.cars) counts[c.kind || 'sedan'] = (counts[c.kind || 'sedan'] || 0) + 1;
    return counts;
  }

  /** Jumlah pejalan kaki per varian (walker / jogger / elder). */
  countPedsByVariant() {
    const counts = { walker: 0, jogger: 0, elder: 0 };
    for (const p of this.peds) counts[p.variant || 'walker'] = (counts[p.variant || 'walker'] || 0) + 1;
    return counts;
  }
}
