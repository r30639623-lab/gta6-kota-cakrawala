// vehicles.js — Mobil low-poly Kota Cakrawala + fisika mengemudi arcade.
// Model fiktif: "Kancil GT" (sport), "Badak Pickup" (pickup), mobil warga,
// dan mobil polisi. Setiap mobil: bodi, kabin kaca, 4 roda, lampu depan /
// belakang (lampu rem menyala saat mengerem), dan efek debu saat drift.
import * as THREE from 'three';

/** Warna cat mobil warga yang bermacam-macam. */
const PAINTS = [0xc0392b, 0x2471a3, 0x1e8449, 0xd4ac0d, 0x7d3c98, 0xe67e22, 0xecf0f1, 0x2c3e50, 0x16a085, 0xb03a2e];

function makeWheel() {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12),
    new THREE.MeshLambertMaterial({ color: 0x16181c }),
  );
  tire.rotation.z = Math.PI / 2;
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.34, 8),
    new THREE.MeshLambertMaterial({ color: 0xb8bec6 }),
  );
  hub.rotation.z = Math.PI / 2;
  wheel.add(tire, hub);
  return wheel;
}

/**
 * Bangun satu mobil. kind: 'sport' | 'pickup' | 'sedan' | 'police' | 'taxi' | 'van'.
 * Mengembalikan Group dengan userData { wheels, brakeLights, headlights, length, width }.
 */
export function makeCar(kind = 'sedan', color = null) {
  const car = new THREE.Group();
  const paint = color ?? PAINTS[Math.floor(Math.random() * PAINTS.length)];
  const bodyMat = new THREE.MeshLambertMaterial({ color: paint });
  const glassMat = new THREE.MeshPhongMaterial({ color: 0x1a2836, shininess: 90, specular: 0x88aacc });
  const isPickup = kind === 'pickup';
  const isPolice = kind === 'police';
  const isTaxi = kind === 'taxi';
  const isVan = kind === 'van';
  // Mobil menghadap +Z lokal: panjang di sumbu Z, lebar di sumbu X.
  // (rotation.y = heading lalu cocok dengan arah gerak (sin h, cos h).)
  const bodyLen = kind === 'sport' ? 4.4 : isPickup ? 5.0 : isVan ? 5.4 : 4.2;
  const bodyWid = isVan ? 2.2 : 2.0;
  const bodyH = kind === 'sport' ? 0.62 : isVan ? 1.15 : 0.78;

  // Bodi utama.
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyWid, bodyH, bodyLen), bodyMat);
  body.position.y = 0.62;
  body.castShadow = true;
  car.add(body);
  // Kap mesin / hidung (depan, +Z).
  const hood = new THREE.Mesh(new THREE.BoxGeometry(bodyWid - 0.12, 0.32, 1.1), bodyMat);
  hood.position.set(0, 0.62 + bodyH / 2 + 0.08, bodyLen / 2 - 0.45);
  hood.castShadow = true;
  car.add(hood);

  if (isPickup) {
    // Bak terbuka dengan dinding bak (belakang, -Z).
    const bedWall = new THREE.Mesh(new THREE.BoxGeometry(bodyWid - 0.1, 0.5, 1.5), bodyMat);
    bedWall.position.set(0, 1.15, -bodyLen / 2 + 0.85);
    car.add(bedWall);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(bodyWid - 0.16, 0.72, 1.5), glassMat);
    cab.position.set(0, 1.28, 0.55);
    cab.castShadow = true;
    car.add(cab);
  } else if (isVan) {
    // Van: kabin tinggi menyatu dengan bodi (angkutan pasar / travel).
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyWid - 0.2, 0.9, bodyLen - 1.2), glassMat);
    cabin.position.set(0, 1.5, -0.2);
    cabin.castShadow = true;
    car.add(cabin);
  } else {
    // Kabin kaca.
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyWid - 0.28, 0.66, 2.1), glassMat);
    cabin.position.set(0, 1.24, -0.25);
    cabin.castShadow = true;
    car.add(cabin);
    if (kind === 'sport') {
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.28), bodyMat);
      spoiler.position.set(0, 1.28, -bodyLen / 2 + 0.1);
      car.add(spoiler);
    }
  }

  // Roda (depan bisa belok, semua berputar). Sumbu roda = sumbu X (lebar).
  const wheels = [];
  const wheelZ = [bodyLen / 2 - 0.85, -bodyLen / 2 + 0.85];
  const wheelX = [bodyWid / 2 - 0.05, -bodyWid / 2 + 0.05];
  for (const wz of wheelZ) {
    for (const wx of wheelX) {
      const w = makeWheel();
      w.position.set(wx, 0.42, wz);
      car.add(w);
      wheels.push({ mesh: w, front: wz > 0, steer: 0 });
    }
  }

  // Lampu depan (putih, +Z) & belakang (merah, menyala saat rem, -Z).
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c8 });
  const brakeMat = new THREE.MeshBasicMaterial({ color: 0x550000 });
  for (const wx of [-0.6, 0.6]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.08), headMat);
    h.position.set(wx, 0.72, bodyLen / 2 + 0.02);
    car.add(h);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.08), brakeMat);
    b.position.set(wx, 0.72, -bodyLen / 2 - 0.02);
    car.add(b);
  }

  // Taksi Cakrawala: papan "TAKSI" kuning di atap + garis hitam.
  if (isTaxi) {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.28, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xffe600 }),
    );
    sign.position.set(0, 1.72, -0.25);
    car.add(sign);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWid + 0.02, 0.1, bodyLen * 0.5),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    );
    stripe.position.set(0, 0.95, -0.2);
    car.add(stripe);
  }

  // Mobil polisi: bodi hitam-putih + light bar merah-biru di atap.
  if (isPolice) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(bodyWid + 0.02, 0.06, bodyLen * 0.55), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }));
    stripe.position.set(0, 1.02, -0.2);
    car.add(stripe);
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.5), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    barBase.position.set(0, 1.66, -0.25);
    car.add(barBase);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.34), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    red.position.set(0.28, 1.76, -0.25);
    car.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.34), new THREE.MeshBasicMaterial({ color: 0x2266ff }));
    blue.position.set(-0.28, 1.76, -0.25);
    car.add(blue);
    car.userData.lightBar = { red, blue };
  }

  car.userData = {
    ...car.userData,
    kind,
    wheels,
    brakeMat,
    length: bodyLen,
    width: bodyWid,
    speed: 0,
    steer: 0,
    // Tuning garasi (diisi Garage.applyToCar): bonus kecepatan, nitro, armor.
    tuning: { topSpeedBonus: 0, nitro: false, armourFactor: 1 },
  };
  return car;
}

/** Putar roda sesuai kecepatan & belok; lampu rem menyala saat mengerem. */
export function animateCar(car, dt, braking) {
  const u = car.userData;
  const spin = (u.speed / 0.42) * dt;
  for (const w of u.wheels) {
    w.mesh.children[0].rotation.x += spin;
    w.mesh.children[1].rotation.x += spin;
    w.mesh.rotation.y = w.front ? u.steer * 0.5 : 0;
  }
  u.brakeMat.color.set(braking ? 0xff2a1a : 0x550000);
  if (u.lightBar) {
    const phase = Math.floor(performance.now() / 260) % 2 === 0;
    u.lightBar.red.material.color.set(phase ? 0xff2222 : 0x881111);
    u.lightBar.blue.material.color.set(phase ? 0x1133aa : 0x2266ff);
  }
}

/**
 * Fisika mobil arcade: akselerasi, rem, belok yang melemah di kecepatan
 * tinggi, gesekan, dan tabrakan sederhana dengan kotak collider kota.
 * state: { pos: Vector3, heading, speed }. Mengembalikan info tabrakan.
 */
export function driveCar(car, state, input, dt, colliders, bounds) {
  const u = car.userData;
  const throttle = input.moveAxis(); // W/S
  const steerInput = input.strafeAxis(); // A/D
  const handbrake = input.down('Space');

  const maxSpeedBase = u.kind === 'sport' ? 42 : u.kind === 'police' ? 40 : u.kind === 'van' ? 30 : 34;
  const tuning = u.tuning || { topSpeedBonus: 0, nitro: false, armourFactor: 1 };
  // Nitro: tahan Shift saat mengemudi = +9 kecepatan puncak (kalau dibeli di garasi).
  const nitroBoost = tuning.nitro && (input.down('ShiftLeft') || input.down('ShiftRight')) ? 9 : 0;
  const maxSpeed = maxSpeedBase + tuning.topSpeedBonus + nitroBoost;
  const maxReverse = 12;
  if (throttle > 0) state.speed += 20 * dt * (1 - Math.max(0, state.speed) / maxSpeed);
  if (throttle < 0) {
    if (state.speed > 0.5) state.speed -= 34 * dt; // rem
    else state.speed -= 10 * dt; // mundur
  }
  if (handbrake) state.speed *= Math.max(0, 1 - 3.2 * dt);
  // Gesekan & batas kecepatan.
  state.speed -= state.speed * 0.35 * dt;
  state.speed = THREE.MathUtils.clamp(state.speed, -maxReverse, maxSpeed);
  if (Math.abs(state.speed) < 0.05 && throttle === 0) state.speed = 0;

  // Belok: makin cepat makin kecil sudutnya; mundur membalik arah belok.
  const steerTarget = steerInput * 0.55 * (1 - Math.min(1, Math.abs(state.speed) / maxSpeed) * 0.55);
  u.steer += (steerTarget - u.steer) * Math.min(1, dt * 8);
  const dirSign = state.speed >= 0 ? 1 : -1;
  state.heading -= u.steer * (Math.abs(state.speed) / 4.2) * dirSign * dt;

  // Maju.
  const nx = state.pos.x + Math.sin(state.heading) * state.speed * dt;
  const nz = state.pos.z + Math.cos(state.heading) * state.speed * dt;

  // Tabrakan dengan gedung: dorong keluar & kurangi kecepatan.
  // (panjang mobil di sumbu Z, lebar di sumbu X.)
  let crashed = false;
  const halfL = u.length / 2 + 0.3;
  const halfW = u.width / 2 + 0.3;
  for (const c of colliders) {
    if (nx + halfW > c.minX && nx - halfW < c.maxX && nz + halfL > c.minZ && nz - halfL < c.maxZ) {
      // Dorong ke sisi terdekat.
      const pushL = (nx + halfW) - c.minX;
      const pushR = c.maxX - (nx - halfW);
      const pushT = (nz + halfL) - c.minZ;
      const pushB = c.maxZ - (nz - halfL);
      const min = Math.min(pushL, pushR, pushT, pushB);
      crashed = true;
      state.speed *= 0.4;
      break;
    }
  }
  if (!crashed) {
    state.pos.x = THREE.MathUtils.clamp(nx, -bounds, bounds);
    state.pos.z = THREE.MathUtils.clamp(nz, -bounds, bounds);
  } else {
    state.pos.x = THREE.MathUtils.clamp(state.pos.x, -bounds, bounds);
    state.pos.z = THREE.MathUtils.clamp(state.pos.z, -bounds, bounds);
  }

  car.position.copy(state.pos);
  car.rotation.y = state.heading;
  u.speed = state.speed;
  const drifting = handbrake && Math.abs(state.speed) > 12 && Math.abs(u.steer) > 0.25;
  animateCar(car, dt, throttle < 0 || handbrake);
  return { crashed, drifting, speedKmh: Math.abs(state.speed) * 3.6 };
}

/** Sistem partikel debu sederhana untuk drift & tabrakan. */
export class DustParticles {
  constructor(scene, max = 120) {
    this.max = max;
    this.points = [];
    const geo = new THREE.SphereGeometry(0.28, 6, 5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xd8cdb8, transparent: true, opacity: 0.7 });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.vel = [];
    this.life = new Float32Array(max);
    this.head = 0;
    for (let i = 0; i < max; i++) {
      this.points.push(new THREE.Vector3(0, -10, 0));
      this.vel.push(new THREE.Vector3());
    }
    this.m4 = new THREE.Matrix4();
  }

  spawn(pos, count = 3) {
    for (let n = 0; n < count; n++) {
      const i = this.head;
      this.head = (this.head + 1) % this.max;
      this.points[i].set(pos.x + (Math.random() - 0.5), 0.4 + Math.random() * 0.5, pos.z + (Math.random() - 0.5));
      this.vel[i].set((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2);
      this.life[i] = 0.7 + Math.random() * 0.4;
    }
  }

  update(dt) {
    let alive = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      this.points[i].addScaledVector(this.vel[i], dt);
      this.vel[i].y *= 0.98;
      this.m4.makeTranslation(this.points[i].x, this.points[i].y, this.points[i].z);
      const s = Math.max(0.01, this.life[i]);
      this.m4.scale(new THREE.Vector3(s, s, s));
      this.mesh.setMatrixAt(alive, this.m4);
      alive++;
    }
    this.mesh.count = alive;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
