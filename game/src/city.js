// city.js — Kota Cakrawala prosedural: ~100 gedung, jalan, pantai,
// pelabuhan, Menara Cakrawala, pasar, RS, bengkel Bu Sari, 3 garasi.
import * as THREE from 'three';
import { districtAtPoint } from './districts.js';

export const LANDMARKS = {
  menara: { x: 0, z: -30, label: 'Menara' },
  pasar: { x: -120, z: 60, label: 'Pasar' },
  rs: { x: 120, z: -120, label: 'Rumah Sakit' },
  bengkel: { x: -222, z: 252, label: 'Bengkel' },
  pantai: { x: 0, z: 318, label: 'Pantai' },
  dermaga: { x: 250, z: 360, label: 'Dermaga' },
};

const GARAGE_SPOTS = [
  { id: 'bengkel', name: 'Garasi Bengkel Bu Sari', x: -240, z: 268 },
  { id: 'pelabuhan', name: 'Garasi Pelabuhan', x: 222, z: 338 },
  { id: 'menara', name: 'Garasi Menara', x: 34, z: -52 },
];

function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function buildCity(scene) {
  const group = new THREE.Group();
  const colliders = [];
  const rand = seededRand(20261120);

  // --- Langit: gradien besar + awan ---
  const skyGeo = new THREE.SphereGeometry(900, 24, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x87b5e0, side: THREE.BackSide, fog: false });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  group.add(sky);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(18 + rand() * 22, 10, 8), cloudMat);
    c.position.set(-500 + rand() * 1000, 120 + rand() * 60, -500 + rand() * 1000);
    c.scale.y = 0.35;
    group.add(c);
    clouds.push(c);
  }

  // --- Tanah kota + pantai + laut ---
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700),
    new THREE.MeshStandardMaterial({ color: 0x3d5a3a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(15, 0, 15);
  ground.receiveShadow = true;
  group.add(ground);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(700, 70),
    new THREE.MeshStandardMaterial({ color: 0xe8d49a, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(15, 0.05, 330);
  group.add(sand);

  const sea = new THREE.Mesh(new THREE.PlaneGeometry(760, 220),
    new THREE.MeshStandardMaterial({ color: 0x1e6f9e, roughness: 0.25, metalness: 0.35 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(15, 0.02, 470);
  group.add(sea);

  // --- Jalan: grid + marka + zebra ---
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.95 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf5d76e, roughness: 0.8 });
  const crossMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 });
  const roads = [];
  for (let i = -3; i <= 4; i++) {
    roads.push({ x: i * 80, z: 15, w: 12, l: 660, vertical: true });
    roads.push({ x: 15, z: i * 80 - 30, w: 660, l: 12, vertical: false });
  }
  for (const r of roads) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.vertical ? r.w : r.w, r.vertical ? r.l : r.l), roadMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(r.x, 0.08, r.z);
    m.receiveShadow = true;
    group.add(m);
  }
  // Marka tengah putus-putus
  for (let gx = -240; gx <= 320; gx += 80) {
    for (let gz = -280; gz <= 320; gz += 16) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 5), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(gx, 0.1, gz);
      group.add(dash);
    }
  }
  for (let gz = -240; gz <= 280; gz += 80) {
    for (let gx = -280; gx <= 320; gx += 16) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.5), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(gx, 0.1, gz);
      group.add(dash);
    }
  }
  // Zebra cross di pusat
  for (let i = -3; i <= 3; i++) {
    const z1 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 9), crossMat);
    z1.rotation.x = -Math.PI / 2;
    z1.position.set(i * 2.2, 0.11, -18);
    group.add(z1);
    const z2 = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4), crossMat);
    z2.rotation.x = -Math.PI / 2;
    z2.position.set(12, 0.11, -30 + i * 2.2);
    group.add(z2);
  }

  // --- Gedung ~100, dengan jendela menyala ---
  const winGeo = new THREE.BoxGeometry(2.2, 1.6, 0.15);
  const winMatDay = new THREE.MeshStandardMaterial({ color: 0x2a4a66, roughness: 0.3, metalness: 0.4 });
  const winMatNight = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb84d, emissiveIntensity: 1.4 });
  const windowMats = [];
  const palette = [0x8a7f72, 0x9c8f7a, 0x6f7f8f, 0xb09a7a, 0x7a8a7a, 0xa08a90, 0x8f8578, 0x746a5e];
  let buildingCount = 0;
  const blockCenters = [];
  for (let bx = -280; bx <= 280; bx += 80) {
    for (let bz = -280; bz <= 240; bz += 80) {
      if (Math.abs(bx) < 45 && Math.abs(bz + 30) < 45) continue; // alun-alun menara
      if (Math.abs(bx + 120) < 45 && Math.abs(bz - 60) < 45) continue; // pasar
      if (Math.abs(bx + 222) < 45 && Math.abs(bz - 252) < 45) continue; // bengkel
      blockCenters.push([bx, bz]);
    }
  }
  for (const [bx, bz] of blockCenters) {
    const n = 2 + Math.floor(rand() * 2); // 2-3 gedung per blok
    for (let k = 0; k < n; k++) {
      const ox = (rand() - 0.5) * 44;
      const oz = (rand() - 0.5) * 44;
      const w = 14 + rand() * 12;
      const d = 14 + rand() * 12;
      const h = 8 + rand() * rand() * 42;
      const x = bx + ox;
      const z = bz + oz;
      if (x < -300 || x > 330 || z < -300 || z > 300) continue;
      const mat = new THREE.MeshStandardMaterial({ color: palette[Math.floor(rand() * palette.length)], roughness: 0.85 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(x, h / 2, z);
      b.castShadow = true;
      b.receiveShadow = true;
      group.add(b);
      colliders.push({ x, z, hx: w / 2 + 0.4, hz: d / 2 + 0.4 });
      // Jendela di sisi depan
      const floors = Math.max(1, Math.floor(h / 4));
      for (let f = 0; f < floors; f++) {
        for (let cI = -1; cI <= 1; cI++) {
          const win = new THREE.Mesh(winGeo, winMatNight);
          win.position.set(x + cI * (w / 3.4), 3 + f * 4, z - d / 2 - 0.1);
          group.add(win);
          windowMats.push(win.material);
          const win2 = new THREE.Mesh(winGeo, winMatNight);
          win2.position.set(x + cI * (w / 3.4), 3 + f * 4, z + d / 2 + 0.1);
          win2.rotation.y = Math.PI;
          group.add(win2);
        }
      }
      buildingCount++;
    }
  }

  // --- Menara Cakrawala (86 m) ---
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x3a4a6b, metalness: 0.6, roughness: 0.35 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(9, 13, 86, 12), towerMat);
  tower.position.set(0, 43, -30);
  tower.castShadow = true;
  group.add(tower);
  const towerTop = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd23d, emissive: 0xff9d00, emissiveIntensity: 1.6 }));
  towerTop.position.set(0, 88, -30);
  group.add(towerTop);
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 30, 8),
    new THREE.MeshBasicMaterial({ color: 0xff5577, transparent: true, opacity: 0.5 }));
  beacon.position.set(0, 100, -30);
  group.add(beacon);
  colliders.push({ x: 0, z: -30, hx: 14, hz: 14 });

  // --- Pasar Cakrawala ---
  const marketBase = new THREE.Mesh(new THREE.BoxGeometry(46, 6, 30),
    new THREE.MeshStandardMaterial({ color: 0xc96a2e, roughness: 0.8 }));
  marketBase.position.set(-120, 3, 60);
  marketBase.castShadow = true;
  group.add(marketBase);
  colliders.push({ x: -120, z: 60, hx: 24, hz: 16 });
  const marketRoof = new THREE.Mesh(new THREE.ConeGeometry(30, 8, 4),
    new THREE.MeshStandardMaterial({ color: 0x7a2e1e, roughness: 0.7 }));
  marketRoof.position.set(-120, 10, 60);
  marketRoof.rotation.y = Math.PI / 4;
  group.add(marketRoof);
  for (let i = 0; i < 6; i++) {
    const stall = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 4),
      new THREE.MeshStandardMaterial({ color: [0xe84d4d, 0x4da6e8, 0x7ed957, 0xffd23d, 0xff8ac2, 0x9b59d0][i], roughness: 0.8 }));
    stall.position.set(-138 + i * 7.5, 1.2, 82);
    group.add(stall);
    colliders.push({ x: -138 + i * 7.5, z: 82, hx: 3.2, hz: 2.2 });
  }

  // --- Rumah Sakit (respawn) ---
  const hospital = new THREE.Mesh(new THREE.BoxGeometry(40, 22, 26),
    new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.7 }));
  hospital.position.set(120, 11, -120);
  hospital.castShadow = true;
  group.add(hospital);
  colliders.push({ x: 120, z: -120, hx: 21, hz: 14 });
  const cross = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 1),
    new THREE.MeshStandardMaterial({ color: 0xd7263d, emissive: 0xaa0000, emissiveIntensity: 0.8 }));
  cross.position.set(120, 18, -132.5);
  group.add(cross);
  const cross2 = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 1),
    new THREE.MeshStandardMaterial({ color: 0xd7263d, emissive: 0xaa0000, emissiveIntensity: 0.8 }));
  cross2.position.set(120, 18, -132.5);
  group.add(cross2);

  // --- Bengkel Bu Sari ---
  const workshop = new THREE.Mesh(new THREE.BoxGeometry(30, 9, 20),
    new THREE.MeshStandardMaterial({ color: 0x2e6f8e, roughness: 0.7 }));
  workshop.position.set(-222, 4.5, 252);
  workshop.castShadow = true;
  group.add(workshop);
  colliders.push({ x: -222, z: 252, hx: 16, hz: 11 });
  const wsRoof = new THREE.Mesh(new THREE.BoxGeometry(32, 1, 22),
    new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.6 }));
  wsRoof.position.set(-222, 9.5, 252);
  group.add(wsRoof);
  const wsSign = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffd23d, emissiveIntensity: 0.9 }));
  wsSign.position.set(-222, 8, 241.5);
  group.add(wsSign);

  // --- 3 Garasi ---
  const garages = [];
  for (const spot of GARAGE_SPOTS) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 14),
      new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 }));
    box.position.y = 3.5;
    box.castShadow = true;
    g.add(box);
    const door = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 }));
    door.position.set(0, 2.5, -7.1);
    g.add(door);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(14, 2.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x7dff9b, emissiveIntensity: 1.0 }));
    sign.position.set(0, 6.2, -7.2);
    g.add(sign);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xdddddd }));
    pole.position.set(10, 6, -9);
    g.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x7dff9b, emissive: 0x2e8b57, emissiveIntensity: 0.7 }));
    flag.position.set(12.2, 10.5, -9);
    g.add(flag);
    g.position.set(spot.x, 0, spot.z);
    group.add(g);
    colliders.push({ x: spot.x, z: spot.z, hx: 9.5, hz: 7.5 });
    garages.push({ ...spot, group: g });
  }

  // --- Pelabuhan: dermaga, kontainer, crane, kapal ---
  const pier = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 40),
    new THREE.MeshStandardMaterial({ color: 0x6b5a44, roughness: 0.9 }));
  pier.position.set(250, 1, 360);
  group.add(pier);
  colliders.push({ x: 250, z: 360, hx: 31, hz: 21 });
  const containerColors = [0xd7263d, 0x2a6fd6, 0x2e8b57, 0xffd23d, 0xff7f2a];
  for (let i = 0; i < 10; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 3.4),
      new THREE.MeshStandardMaterial({ color: containerColors[i % 5], roughness: 0.7 }));
    c.position.set(215 + (i % 5) * 14, 3.5 + Math.floor(i / 5) * 3.2, 330 + (i % 2) * 8);
    c.castShadow = true;
    group.add(c);
    colliders.push({ x: c.position.x, z: c.position.z, hx: 6.2, hz: 1.9 });
  }
  const craneBase = new THREE.Mesh(new THREE.BoxGeometry(8, 30, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.6 }));
  craneBase.position.set(280, 15, 340);
  group.add(craneBase);
  colliders.push({ x: 280, z: 340, hx: 4.5, hz: 4.5 });
  const craneArm = new THREE.Mesh(new THREE.BoxGeometry(46, 2.5, 2.5),
    new THREE.MeshStandardMaterial({ color: 0xffd23d, roughness: 0.6 }));
  craneArm.position.set(262, 30, 340);
  group.add(craneArm);
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(26, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.6 }));
  hull.position.y = 2;
  ship.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6 }));
  deck.position.set(-8, 7, 0);
  ship.add(deck);
  ship.position.set(290, 0, 420);
  group.add(ship);

  // --- Pantai: payung + kursi ---
  for (let i = 0; i < 7; i++) {
    const ux = -90 + i * 30;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x8a6a3a }));
    pole.position.set(ux, 2, 322);
    group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: [0xe84d4d, 0xffd23d, 0x4da6e8][i % 3], roughness: 0.7 }));
    top.position.set(ux, 4.6, 322);
    group.add(top);
  }

  // --- Lampu jalan + palem ---
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  const lampLightMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffdf80, emissiveIntensity: 1.8 });
  const lampLights = [];
  for (let gx = -240; gx <= 320; gx += 80) {
    for (let gz = -240; gz <= 280; gz += 80) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 7, 6), lampMat);
      pole.position.set(gx + 7, 3.5, gz + 7);
      group.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), lampLightMat);
      bulb.position.set(gx + 7, 7.1, gz + 7);
      group.add(bulb);
      lampLights.push(bulb);
    }
  }
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5a34, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.9 });
  for (let i = 0; i < 46; i++) {
    const px = -280 + rand() * 600;
    const pz = 300 + rand() * 30;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 7, 6), trunkMat);
    trunk.position.set(px, 3.5, pz);
    group.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(3, 3.4, 7), leafMat);
    leaves.position.set(px, 8.2, pz);
    group.add(leaves);
  }
  for (let i = 0; i < 20; i++) {
    const px = -280 + rand() * 600;
    const pz = -290 + rand() * 560;
    if (Math.abs(px % 80) < 10 || Math.abs((pz + 30) % 80) < 10) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 6, 6), trunkMat);
    trunk.position.set(px, 3, pz);
    group.add(trunk);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 6), leafMat);
    leaves.position.set(px, 7, pz);
    group.add(leaves);
  }

  // --- Bu Sari (NPC pemberi misi) ---
  const buSari = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 10),
    new THREE.MeshStandardMaterial({ color: 0xb03a5b, roughness: 0.8 }));
  dress.position.y = 1.3;
  buSari.add(dress);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8b88a, roughness: 0.7 }));
  head.position.y = 3.0;
  buSari.add(head);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }));
  bun.position.set(0, 3.45, -0.2);
  buSari.add(bun);
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 4),
    new THREE.MeshStandardMaterial({ color: 0xffd23d, emissive: 0xffb800, emissiveIntensity: 1.5 }));
  marker.position.y = 4.4;
  marker.rotation.x = Math.PI;
  buSari.add(marker);
  buSari.position.set(-248, 0, 232);
  buSari.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(buSari);

  scene.add(group);

  // --- Pencahayaan siang/senja/malam ---
  const sun = new THREE.DirectionalLight(0xfff2d0, 2.4);
  sun.position.set(180, 260, 120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -360;
  sun.shadow.camera.right = 360;
  sun.shadow.camera.top = 360;
  sun.shadow.camera.bottom = -360;
  sun.shadow.camera.far = 900;
  scene.add(sun);
  const ambient = new THREE.AmbientLight(0xbfd4ff, 0.85);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x3a2f22, 0.7);
  scene.add(hemi);

  let timeOfDay = 'siang';
  function setTimeOfDay(name) {
    timeOfDay = name;
    if (name === 'senja') {
      skyMat.color.setHex(0xe88a4a);
      sun.color.setHex(0xff9a3d);
      sun.intensity = 1.7;
      sun.position.set(-220, 90, 160);
      ambient.intensity = 0.5;
      hemi.intensity = 0.45;
      for (const w of windowMats) { w.emissive.setHex(0xffb84d); w.emissiveIntensity = 1.6; }
    } else if (name === 'malam') {
      skyMat.color.setHex(0x0b1030);
      sun.color.setHex(0x8aa0ff);
      sun.intensity = 0.35;
      sun.position.set(60, 200, -120);
      ambient.intensity = 0.32;
      hemi.intensity = 0.3;
      for (const w of windowMats) { w.emissive.setHex(0xffc95e); w.emissiveIntensity = 2.0; }
    } else {
      skyMat.color.setHex(0x87b5e0);
      sun.color.setHex(0xfff2d0);
      sun.intensity = 2.4;
      sun.position.set(180, 260, 120);
      ambient.intensity = 0.85;
      hemi.intensity = 0.7;
      for (const w of windowMats) { w.emissive.setHex(0x000000); w.emissiveIntensity = 0; }
    }
  }
  setTimeOfDay('siang');

  return {
    group,
    colliders,
    landmarks: LANDMARKS,
    buSari,
    garages,
    buildingCount,
    setTimeOfDay,
    get timeOfDay() { return timeOfDay; },
    districtAt(x, z) { return districtAtPoint(x, z); },
    update(dt, t) {
      for (const c of clouds) {
        c.position.x += dt * 1.5;
        if (c.position.x > 560) c.position.x = -560;
      }
      marker.rotation.y = t * 2;
      marker.position.y = 4.4 + Math.sin(t * 2.5) * 0.25;
      beacon.material.opacity = 0.35 + Math.sin(t * 3) * 0.15;
    },
  };
}
