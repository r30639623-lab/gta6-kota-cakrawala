// vehicles.js — 10 mobil original Kota Cakrawala + cat + mesh mobil.
import * as THREE from 'three';

export const CARS = [
  { id: 'kancil', name: 'Kancil GT', kind: 'Sport', color: 0xd7263d, topSpeed: 38, price: 0, needMissions: 0 },
  { id: 'kijang', name: 'Kijang Klasik', kind: 'Klasik', color: 0xf2f2f2, topSpeed: 32, price: 350, needMissions: 0 },
  { id: 'badak', name: 'Badak Pickup', kind: 'Pickup', color: 0x2e8b57, topSpeed: 34, price: 400, needMissions: 0 },
  { id: 'banteng', name: 'Banteng Van', kind: 'Van', color: 0xff7f2a, topSpeed: 30, price: 500, needMissions: 0 },
  { id: 'sanca', name: 'Sanca Sedan', kind: 'Sedan', color: 0x2a6fd6, topSpeed: 36, price: 600, needMissions: 0 },
  { id: 'cendrawasih', name: 'Cendrawasih Convertible', kind: 'Convertible', color: 0xff7fb0, topSpeed: 39, price: 800, needMissions: 0 },
  { id: 'elang', name: 'Elang Coupe', kind: 'Sport', color: 0xffd23d, topSpeed: 42, price: 900, needMissions: 0 },
  { id: 'macan', name: 'Macan Muscle', kind: 'Muscle', color: 0x1a1a1a, topSpeed: 40, price: 1000, needMissions: 0 },
  { id: 'komodo', name: 'Komodo S', kind: 'Sport', color: 0x7b2ff7, topSpeed: 44, price: 1200, needMissions: 0 },
  { id: 'garuda', name: 'Garuda Supercar', kind: 'Supercar', color: 0xd4af37, topSpeed: 48, price: 2500, needMissions: 8 },
];

export const PAINTS = [
  { name: 'Merah', color: 0xd7263d },
  { name: 'Biru', color: 0x2a6fd6 },
  { name: 'Kuning', color: 0xffd23d },
  { name: 'Hijau', color: 0x2e8b57 },
  { name: 'Ungu', color: 0x7b2ff7 },
  { name: 'Putih', color: 0xf2f2f2 },
  { name: 'Hitam', color: 0x1a1a1a },
  { name: 'Emas', color: 0xd4af37 },
];

export function carById(id) {
  return CARS.find((c) => c.id === id) || CARS[0];
}

// Mesh mobil arcade: bodi + kabin + 4 roda + lampu. Panjang ~4.4 m.
export function makeCarMesh(def, paintColor, opts = {}) {
  const group = new THREE.Group();
  const bodyColor = paintColor !== undefined ? paintColor : def.color;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.55, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0e2233, metalness: 0.7, roughness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.62, 4.4), bodyMat);
  body.position.y = 0.55;
  group.add(body);

  const cabinH = def.kind === 'Van' ? 0.95 : 0.55;
  const cabinL = def.kind === 'Van' ? 3.4 : def.kind === 'Pickup' ? 1.6 : 2.2;
  const cabinZ = def.kind === 'Pickup' ? -0.9 : def.kind === 'Van' ? 0.2 : -0.2;
  if (def.kind !== 'Convertible') {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, cabinH, cabinL), glassMat);
    cabin.position.set(0, 1.05, cabinZ);
    group.add(cabin);
  }
  if (def.kind === 'Pickup') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 1.8), darkMat);
    bed.position.set(0, 0.95, 1.1);
    group.add(bed);
  }

  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 });
  const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 10);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.36, wz);
    group.add(wheel);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(wx, 0.36, wz);
    group.add(hub);
  }

  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6c9, emissive: 0xffedb0, emissiveIntensity: 0.9 });
  for (const sx of [-0.65, 0.65]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.08), lightMat);
    lamp.position.set(sx, 0.62, -2.22);
    group.add(lamp);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xaa0000, emissive: 0xdd0000, emissiveIntensity: 0.7 }));
    tail.position.set(sx, 0.62, 2.22);
    group.add(tail);
  }

  if (opts.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2266ff, emissive: 0x3366ff, emissiveIntensity: 1.2 }));
    bar.position.set(0, 1.42, -0.2);
    group.add(bar);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.14, 4.42),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    stripe.position.y = 0.62;
    group.add(stripe);
  }

  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group, bodyMat };
}

// Mobil pemain: objek { mesh, pos, heading, speed, def, update, setPaint }.
export function createPlayerCar(scene, paintIndex, carDef, upgrades) {
  const paint = PAINTS[paintIndex % PAINTS.length];
  const { group, bodyMat } = makeCarMesh(carDef, paint.color);
  scene.add(group);
  const car = {
    mesh: group,
    bodyMat,
    pos: new THREE.Vector3(-252, 0, 240),
    heading: Math.PI * 0.75,
    speed: 0,
    def: carDef,
    steer: 0,
    setPaint(i) {
      const p = PAINTS[i % PAINTS.length];
      bodyMat.color.setHex(p.color);
    },
    setDef(def) {
      car.def = def;
      bodyMat.color.setHex(PAINTS[paintIndex % PAINTS.length].color);
    },
    topSpeed() {
      let t = car.def.topSpeed;
      if (upgrades && upgrades.turbo) t *= 1.3;
      return t;
    },
    update(dt, input, colliders) {
      const top = car.topSpeed();
      const accel = input.forward ? 16 : input.back ? -11 : 0;
      car.speed += accel * dt;
      if (!input.forward && !input.back) car.speed *= Math.max(0, 1 - 1.4 * dt);
      if (input.handbrake) car.speed *= Math.max(0, 1 - 4 * dt);
      let maxF = top;
      if (input.nitro && upgrades && upgrades.nitro) maxF = top * 1.45;
      if (car.speed > maxF) car.speed = maxF;
      if (car.speed < -9) car.speed = -9;
      const steerTarget = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      car.steer += (steerTarget - car.steer) * Math.min(1, dt * 8);
      const turnRate = car.steer * 1.7 * Math.min(1, Math.abs(car.speed) / 8) * (car.speed >= 0 ? 1 : -1);
      car.heading += turnRate * dt;
      const nx = car.pos.x + Math.sin(car.heading) * car.speed * dt;
      const nz = car.pos.z + Math.cos(car.heading) * car.speed * dt;
      const hit = collideCircle(nx, nz, 1.6, colliders);
      if (!hit) {
        car.pos.x = nx;
        car.pos.z = nz;
      } else {
        car.speed *= 0.4;
      }
      car.pos.x = Math.max(-308, Math.min(343, car.pos.x));
      car.pos.z = Math.max(-308, Math.min(343, car.pos.z));
      group.position.copy(car.pos);
      group.rotation.y = car.heading;
      const tilt = -car.steer * 0.04 * Math.min(1, Math.abs(car.speed) / 10);
      group.rotation.z = tilt;
    },
  };
  group.position.copy(car.pos);
  group.rotation.y = car.heading;
  return car;
}

// Tabrakan lingkaran vs kotak collider {x, z, hx, hz}. true = bertabrakan.
export function collideCircle(x, z, r, colliders) {
  for (const c of colliders) {
    const dx = Math.max(Math.abs(x - c.x) - c.hx, 0);
    const dz = Math.max(Math.abs(z - c.z) - c.hz, 0);
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}
