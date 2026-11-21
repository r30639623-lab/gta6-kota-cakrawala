// vehicles.js — 12 mobil original Kota Cakrawala + mesh & pengemudi.
// Mobil dibuat dari kotak + silinder (low-poly); cat 8 warna; upgrade
// Turbo (+30% top speed), Lapis Baja, Nitro (boost Shift). Taksi punya
// papan kuning di atap; sport/supercar punya spoiler.

import * as THREE from 'three';

export const CARS = [
  { id: 'kancil', name: 'Kancil GT', type: 'sport', color: 0xd21f2b, top: 38, price: 0, need: 0 },
  { id: 'badak', name: 'Badak Pickup', type: 'pickup', color: 0x2e8b57, top: 34, price: 400, need: 0 },
  { id: 'sanca', name: 'Sanca Sedan', type: 'sedan', color: 0x2471a3, top: 36, price: 600, need: 0 },
  { id: 'elang', name: 'Elang Coupe', type: 'sport', color: 0xffd23f, top: 42, price: 900, need: 0 },
  { id: 'banteng', name: 'Banteng Van', type: 'van', color: 0xe67e22, top: 30, price: 500, need: 0 },
  { id: 'komodo', name: 'Komodo S', type: 'sport', color: 0x7b5ea7, top: 44, price: 1200, need: 0 },
  { id: 'kijang', name: 'Kijang Klasik', type: 'klasik', color: 0xe8e8e2, top: 32, price: 350, need: 0 },
  { id: 'macan', name: 'Macan Muscle', type: 'muscle', color: 0x1a1a1a, top: 40, price: 1000, need: 0 },
  { id: 'cendrawasih', name: 'Cendrawasih Convertible', type: 'convertible', color: 0xff7fa8, top: 39, price: 800, need: 0 },
  { id: 'taksi', name: 'Taksi Cakrawala', type: 'taksi', color: 0xffc400, top: 35, price: 450, need: 0 },
  { id: 'singa', name: 'Singa Muscle', type: 'muscle', color: 0xb03a2e, top: 41, price: 1100, need: 0 },
  { id: 'garuda', name: 'Garuda Supercar', type: 'supercar', color: 0xd4af37, top: 48, price: 2500, need: 8 },
];

export const PAINTS = [
  { name: 'Merah', color: 0xd21f2b },
  { name: 'Biru', color: 0x2471a3 },
  { name: 'Kuning', color: 0xffd23f },
  { name: 'Hijau', color: 0x2e8b57 },
  { name: 'Ungu', color: 0x7b5ea7 },
  { name: 'Hitam', color: 0x1a1a1a },
  { name: 'Putih', color: 0xe8e8e2 },
  { name: 'Pink', color: 0xff7fa8 },
];

export function carDef(id) {
  return CARS.find((c) => c.id === id) ?? CARS[0];
}

const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10);
const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
const tailMat = new THREE.MeshBasicMaterial({ color: 0xcc2222 });

export function makeCarMesh(def, paintIndex = 0) {
  const color = PAINTS[paintIndex]?.color ?? def.color;
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const isVan = def.type === 'van';
  const isPickup = def.type === 'pickup';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.72, isVan ? 5.2 : 4.4), bodyMat);
  body.position.y = 0.62;
  body.castShadow = true;
  g.add(body);
  if (!isPickup) {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.62, isVan ? 3.4 : 2.2), glassMat);
    cabin.position.set(0, 1.28, -0.2);
    cabin.castShadow = true;
    g.add(cabin);
  } else {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), bodyMat);
    bed.position.set(0, 1.1, -1.1);
    g.add(bed);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 1.4), glassMat);
    cab.position.set(0, 1.28, 1.1);
    g.add(cab);
  }
  if (def.type === 'sport' || def.type === 'supercar') {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.5), bodyMat);
    spoiler.position.set(0, 1.05, -2.1);
    g.add(spoiler);
  }
  if (def.type === 'taksi') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    sign.position.set(0, 1.75, 0.4);
    g.add(sign);
  }
  for (const [x, z] of [[-0.95, 1.5], [0.95, 1.5], [-0.95, -1.5], [0.95, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.42, z);
    w.castShadow = true;
    g.add(w);
  }
  for (const x of [-0.6, 0.6]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.1), lightMat);
    h.position.set(x, 0.72, 2.22);
    g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.1), tailMat);
    t.position.set(x, 0.72, -2.22);
    g.add(t);
  }
  g.userData.bodyMat = bodyMat;
  return g;
}

export function createPlayerCar(scene, def, paintIndex, save) {
  let mesh = makeCarMesh(def, paintIndex);
  scene.add(mesh);
  const pos = new THREE.Vector3(-250, 0, 240);
  let heading = 0;
  let speed = 0;
  return {
    def,
    get mesh() {
      return mesh;
    },
    get pos() {
      return pos;
    },
    get heading() {
      return heading;
    },
    get speed() {
      return speed;
    },
    setSpeed(v) {
      speed = v;
    },
    teleport(x, z, h = 0) {
      pos.set(x, 0, z);
      heading = h;
      mesh.position.copy(pos);
      mesh.rotation.y = heading;
    },
    repaint(paintIdx) {
      mesh.userData.bodyMat.color.setHex(PAINTS[paintIdx]?.color ?? def.color);
    },
    swapDef(newDef) {
      def = newDef;
      const nm = makeCarMesh(newDef, save.paint);
      nm.position.copy(mesh.position);
      nm.rotation.copy(mesh.rotation);
      scene.remove(mesh);
      scene.add(nm);
      mesh = nm;
    },
    update(dt, input, colliders, onCollide) {
      const top = def.top * (save.upgrades?.turbo ? 1.3 : 1);
      const accel = 16;
      const brake = 26;
      const drag = 2.2;
      let nitro = false;
      if (input.isDown('KeyW') || input.isDown('ArrowUp')) speed += accel * dt;
      if (input.isDown('KeyS') || input.isDown('ArrowDown')) speed -= brake * dt;
      if (input.isDown('Space')) speed *= Math.max(0, 1 - 3.2 * dt);
      if (input.isDown('ShiftLeft') && save.upgrades?.nitro && speed > 1) {
        speed += 14 * dt;
        nitro = true;
      }
      speed -= speed * drag * dt * 0.35;
      speed = Math.max(-10, Math.min(top * (nitro ? 1.25 : 1), speed));
      const steer = (input.isDown('KeyA') ? 1 : 0) - (input.isDown('KeyD') ? 1 : 0);
      const dir = speed >= 0 ? 1 : -1;
      heading += steer * 1.9 * dt * dir * Math.min(1, Math.abs(speed) / 8 + 0.25);
      const nx = pos.x + Math.sin(heading) * speed * dt;
      const nz = pos.z + Math.cos(heading) * speed * dt;
      const hit = resolveCircle(nx, nz, 1.6, colliders);
      pos.x = hit.x;
      pos.z = hit.z;
      if (hit.hit && Math.abs(speed) > 6 && onCollide) onCollide(Math.abs(speed));
      if (hit.hit) speed *= 0.55;
      pos.x = Math.max(-308, Math.min(343, pos.x));
      pos.z = Math.max(-308, Math.min(343, pos.z));
      mesh.position.copy(pos);
      mesh.rotation.y = heading;
      return nitro;
    },
  };
}

export function resolveCircle(x, z, r, colliders) {
  let hit = false;
  for (const c of colliders) {
    const cx = Math.max(c.x - c.hx, Math.min(x, c.x + c.hx));
    const cz = Math.max(c.z - c.hz, Math.min(z, c.z + c.hz));
    const dx = x - cx;
    const dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      hit = true;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        z = cz + (dz / d) * r;
      } else {
        x = c.x + c.hx + r;
      }
    }
  }
  return { x, z, hit };
}
