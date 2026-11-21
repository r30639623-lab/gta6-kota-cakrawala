// city.js — Kota Cakrawala: kota pesisir prosedural (three.js).
// Round 7: pencahayaan & bayangan diperbaiki (matahari berbayang PCF,
// jendela menyala saat senja/malam, lampu jalan + neon, langit gradien,
// kabut, laut, awan bergerak), gedung lebih bervariasi, marka jalan jelas.
// Layout deterministik dari seed supaya screenshot stabil.

import * as THREE from 'three';
import { DISTRICTS } from './districts.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LANDMARKS = {
  menara: { x: 0, z: -30, name: 'Menara Cakrawala' },
  pasar: { x: -120, z: 60, name: 'Pasar Cakrawala' },
  rs: { x: 120, z: -120, name: 'Rumah Sakit' },
  bengkel: { x: -222, z: 252, name: 'Bengkel Bu Sari' },
  pantai: { x: 0, z: 318, name: 'Pantai Cakrawala' },
  dermaga: { x: 250, z: 360, name: 'Dermaga' },
};

const GARAGE_SPOTS = [
  { id: 'g1', name: 'Garasi Bengkel', x: -196, z: 268 },
  { id: 'g2', name: 'Garasi Pelabuhan', x: 214, z: 330 },
  { id: 'g3', name: 'Garasi Menara', x: 34, z: -62 },
];

function facadeTextures(rng) {
  // 4 varian fasad: canvas warna + canvas emissive (jendela menyala saja).
  const variants = [];
  const bases = ['#5a6b7d', '#6d5a4e', '#4e5d6b', '#7d6a5a'];
  for (let v = 0; v < 4; v++) {
    const map = document.createElement('canvas');
    map.width = 128;
    map.height = 256;
    const g = map.getContext('2d');
    g.fillStyle = bases[v];
    g.fillRect(0, 0, 128, 256);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 128, 3);
    const em = document.createElement('canvas');
    em.width = 128;
    em.height = 256;
    const e = em.getContext('2d');
    e.fillStyle = '#000';
    e.fillRect(0, 0, 128, 256);
    for (let y = 14; y < 250; y += 30) {
      for (let x = 12; x < 120; x += 26) {
        const lit = rng() < 0.45;
        g.fillStyle = lit ? '#ffd98a' : '#1d2733';
        g.fillRect(x, y, 16, 18);
        if (lit) {
          e.fillStyle = rng() < 0.8 ? '#ffc46b' : '#9fd8ff';
          e.fillRect(x, y, 16, 18);
        }
      }
    }
    const mapTex = new THREE.CanvasTexture(map);
    const emTex = new THREE.CanvasTexture(em);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    variants.push({ map: mapTex, emissive: emTex });
  }
  return variants;
}

function skyTexture(top, mid, bottom) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildCity(scene, seed = 2) {
  const rng = mulberry32(seed * 7919 + 13);
  const group = new THREE.Group();
  group.name = 'kota';
  scene.add(group);
  const colliders = [];
  const addCollider = (x, z, hx, hz) => colliders.push({ x, z, hx, hz });

  // --- Langit: kubah gradien + awan + kabut ---
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 24, 16),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false })
  );
  sky.name = 'langit';
  group.add(sky);
  const skyDay = skyTexture('#3f8fd2', '#9fc8e8', '#e8d9b0');
  const skyDusk = skyTexture('#2c1e5e', '#c65a7a', '#ff9e57');
  const skyNight = skyTexture('#050914', '#0d1b33', '#1c2b4a');
  const clouds = [];
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, fog: false });
  for (let i = 0; i < 9; i++) {
    const cl = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(14 + rng() * 16, 8, 6), cloudMat);
      s.position.set(j * 18 - 18 + rng() * 6, rng() * 4, rng() * 8);
      s.scale.y = 0.35;
      cl.add(s);
    }
    cl.position.set((rng() - 0.5) * 700, 150 + rng() * 60, (rng() - 0.5) * 700);
    group.add(cl);
    clouds.push(cl);
  }

  // --- Cahaya: matahari berbayang + hemisphere + lampu titik landmark ---
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -360;
  sun.shadow.camera.right = 360;
  sun.shadow.camera.top = 360;
  sun.shadow.camera.bottom = -360;
  sun.shadow.camera.far = 900;
  sun.shadow.bias = -0.0006;
  group.add(sun);
  group.add(sun.target);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x3a4a3a, 0.9);
  group.add(hemi);
  const lampLights = [];
  for (const [x, z] of [[0, -30], [-120, 60], [120, -120], [-222, 252]]) {
    const pl = new THREE.PointLight(0xffb46b, 0, 90, 1.6);
    pl.position.set(x, 14, z);
    group.add(pl);
    lampLights.push(pl);
  }

  // --- Tanah: rumput kota + pasir pantai + laut ---
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x4a5d43 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(760, 760), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(760, 60),
    new THREE.MeshLambertMaterial({ color: 0xd9c28a })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0.05, 318);
  sand.receiveShadow = true;
  group.add(sand);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 220),
    new THREE.MeshLambertMaterial({ color: 0x1e6f8e, transparent: true, opacity: 0.92 })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.02, 460);
  group.add(sea);
  const seaShine = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 40),
    new THREE.MeshBasicMaterial({ color: 0x7fd4e8, transparent: true, opacity: 0.25 })
  );
  seaShine.rotation.x = -Math.PI / 2;
  seaShine.position.set(0, 0.06, 352);
  group.add(seaShine);

  // --- Jalan: aspal + marka tengah + zebra di persimpangan ---
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x2e3138 });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xd8b13a });
  const zebraMat = new THREE.MeshBasicMaterial({ color: 0xe8e8e8 });
  const streets = [-280, -200, -120, -40, 40, 120, 200, 280];
  for (const s of streets) {
    for (const [w, l, x, z, rot] of [
      [14, 700, s, 0, 0],
      [700, 14, 0, s, 0],
    ]) {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(w, l), roadMat);
      r.rotation.x = -Math.PI / 2;
      r.rotation.z = rot;
      r.position.set(x, 0.08, z);
      r.receiveShadow = true;
      group.add(r);
    }
    for (let d = -320; d <= 320; d += 16) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 5), dashMat);
      dash.position.set(s, 0.12, d);
      group.add(dash);
      const dash2 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.05, 0.6), dashMat);
      dash2.position.set(d, 0.12, s);
      group.add(dash2);
    }
    // Zebra di tiap persimpangan jalan utama.
    for (const t of streets) {
      for (let k = -2; k <= 2; k++) {
        const z1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 4.5), zebraMat);
        z1.position.set(t + k * 2.6, 0.12, s + 8.5);
        group.add(z1);
      }
    }
  }

  // --- Gedung: ~100 blok dengan fasad berjendela menyala ---
  const facades = facadeTextures(rng);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x3a3f46 });
  const blockCenters = [];
  for (const bx of [-240, -160, -80, 0, 80, 160, 240]) {
    for (const bz of [-240, -160, -80, 0, 80, 160, 240]) {
      blockCenters.push([bx, bz]);
    }
  }
  const nearLandmark = (x, z) =>
    Object.values(LANDMARKS).some((lm) => Math.hypot(x - lm.x, z - lm.z) < 55);
  const nearGarage = (x, z) => GARAGE_SPOTS.some((g) => Math.hypot(x - g.x, z - g.z) < 30);
  let buildingCount = 0;
  for (const [bx, bz] of blockCenters) {
    if (bz > 260) continue; // zona pantai
    if (bx > 200 && bz > 260) continue; // zona pelabuhan
    if (nearLandmark(bx, bz) || nearGarage(bx, bz)) continue;
    const n = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const w = 16 + rng() * 18;
      const d = 16 + rng() * 18;
      const distC = Math.hypot(bx, bz);
      const h = 8 + rng() * (distC < 90 ? 34 : 20);
      const x = bx + (rng() - 0.5) * (58 - w);
      const z = bz + (rng() - 0.5) * (58 - d);
      const v = facades[Math.floor(rng() * facades.length)];
      const mat = new THREE.MeshLambertMaterial({
        map: v.map,
        emissiveMap: v.emissive,
        emissive: new THREE.Color(0xffc46b),
        emissiveIntensity: 0,
      });
      const b = new THREE.Mesh(boxGeo, mat);
      b.scale.set(w, h, d);
      b.position.set(x, h / 2, z);
      b.castShadow = true;
      b.receiveShadow = true;
      b.userData.windowMat = mat;
      group.add(b);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.8, d + 1), roofMat);
      roof.position.set(x, h + 0.4, z);
      group.add(roof);
      // Antena kecil di sebagian gedung tinggi.
      if (h > 26 && rng() < 0.5) {
        const ant = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xcc2222 })
        );
        ant.position.set(x, h + 3.5, z);
        group.add(ant);
      }
      addCollider(x, z, w / 2, d / 2);
      buildingCount++;
    }
  }

  // --- Menara Cakrawala (86 m) + lampu suar ---
  const towerMat = new THREE.MeshLambertMaterial({ color: 0x8a94a6, emissive: 0x223344, emissiveIntensity: 0.4 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(9, 13, 86, 10), towerMat);
  tower.position.set(0, 43, -30);
  tower.castShadow = true;
  group.add(tower);
  const towerTop = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 7, 8, 10),
    new THREE.MeshLambertMaterial({ color: 0x2c3550 })
  );
  towerTop.position.set(0, 90, -30);
  group.add(towerTop);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2a3c })
  );
  beacon.position.set(0, 95.5, -30);
  group.add(beacon);
  const beaconLight = new THREE.PointLight(0xff2a3c, 0, 120, 1.5);
  beaconLight.position.set(0, 96, -30);
  group.add(beaconLight);
  addCollider(0, -30, 13, 13);

  // --- Pasar Cakrawala: aula + kios warna-warni ---
  const pasarBase = new THREE.Mesh(
    new THREE.BoxGeometry(46, 9, 30),
    new THREE.MeshLambertMaterial({ color: 0xb0703a })
  );
  pasarBase.position.set(-120, 4.5, 60);
  pasarBase.castShadow = true;
  group.add(pasarBase);
  const pasarRoof = new THREE.Mesh(
    new THREE.ConeGeometry(30, 8, 4),
    new THREE.MeshLambertMaterial({ color: 0x7a3b1e })
  );
  pasarRoof.position.set(-120, 13, 60);
  pasarRoof.rotation.y = Math.PI / 4;
  group.add(pasarRoof);
  const kioskColors = [0xe84a5f, 0x2ec4b6, 0xffbf69, 0x7b5ea7];
  for (let i = 0; i < 6; i++) {
    const k = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3.4, 5),
      new THREE.MeshLambertMaterial({ color: kioskColors[i % 4] })
    );
    k.position.set(-142 + (i % 3) * 22, 1.7, 84 + Math.floor(i / 3) * 10);
    k.castShadow = true;
    group.add(k);
    addCollider(k.position.x, k.position.z, 3, 2.5);
  }
  addCollider(-120, 60, 23, 15);

  // --- Rumah Sakit: gedung putih + helipad + palang merah ---
  const rs = new THREE.Mesh(
    new THREE.BoxGeometry(40, 18, 26),
    new THREE.MeshLambertMaterial({ color: 0xe8e8e2 })
  );
  rs.position.set(120, 9, -120);
  rs.castShadow = true;
  group.add(rs);
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xd21f2b });
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 0.6), crossMat);
  c1.position.set(120, 14, -106.5);
  group.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 0.6), crossMat);
  c2.position.set(120, 14, -106.5);
  group.add(c2);
  addCollider(120, -120, 20, 13);

  // --- Bengkel Bu Sari + papan nama ---
  const bengkel = new THREE.Mesh(
    new THREE.BoxGeometry(30, 8, 20),
    new THREE.MeshLambertMaterial({ color: 0x4a6b8a })
  );
  bengkel.position.set(-222, 4, 252);
  bengkel.castShadow = true;
  group.add(bengkel);
  const signMat = new THREE.MeshBasicMaterial({ color: 0xffd23f });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(24, 2.2, 0.5), signMat);
  sign.position.set(-222, 9.2, 241.5);
  group.add(sign);
  addCollider(-222, 252, 15, 10);
  // Bu Sari: sosok sederhana (gaun + kerudung) berdiri di depan bengkel.
  const buSari = new THREE.Group();
  const dress = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 2.6, 8),
    new THREE.MeshLambertMaterial({ color: 0x7a3b8a })
  );
  dress.position.y = 1.3;
  buSari.add(dress);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xe8b98a })
  );
  head.position.y = 3.0;
  buSari.add(head);
  const scarf = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xffd23f })
  );
  scarf.position.y = 3.15;
  scarf.scale.set(1, 0.75, 1);
  buSari.add(scarf);
  buSari.position.set(-248, 0, 232);
  buSari.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  group.add(buSari);

  // --- 3 Garasi: bangunan + papan "GARASI" ---
  const garages = [];
  for (const spot of GARAGE_SPOTS) {
    const g = new THREE.Mesh(
      new THREE.BoxGeometry(22, 7, 16),
      new THREE.MeshLambertMaterial({ color: 0x5a6b7d })
    );
    g.position.set(spot.x, 3.5, spot.z);
    g.castShadow = true;
    group.add(g);
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(16, 5, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x2e3138 })
    );
    door.position.set(spot.x, 2.5, spot.z - 8.2);
    group.add(door);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.8, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x2ec4b6 })
    );
    board.position.set(spot.x, 8, spot.z - 8.2);
    group.add(board);
    addCollider(spot.x, spot.z, 11, 8);
    garages.push({ ...spot, mesh: g });
  }

  // --- Pelabuhan: kontainer, crane, kapal ---
  const contColors = [0xc0392b, 0x2471a3, 0x229954, 0xd4ac0d];
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Mesh(
      new THREE.BoxGeometry(10, 3.4, 3.4),
      new THREE.MeshLambertMaterial({ color: contColors[i % 4] })
    );
    c.position.set(210 + (i % 4) * 13, 1.7 + Math.floor(i / 8) * 3.5, 300 + Math.floor(i / 4) * 8);
    c.castShadow = true;
    group.add(c);
    addCollider(c.position.x, c.position.z, 5, 1.7);
  }
  const craneMat = new THREE.MeshLambertMaterial({ color: 0xd8b13a });
  for (const cx of [230, 280]) {
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(2, 26, 2), craneMat);
    leg1.position.set(cx, 13, 330);
    group.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(2, 26, 2), craneMat);
    leg2.position.set(cx, 13, 346);
    group.add(leg2);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 46), craneMat);
    arm.position.set(cx, 26, 338);
    group.add(arm);
  }
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(44, 7, 12),
    new THREE.MeshLambertMaterial({ color: 0x273746 })
  );
  hull.position.y = 1.5;
  ship.add(hull);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(10, 8, 10),
    new THREE.MeshLambertMaterial({ color: 0xe8e8e2 })
  );
  cabin.position.set(-12, 8, 0);
  ship.add(cabin);
  ship.position.set(250, 0, 392);
  group.add(ship);

  // --- Pohon palem di sepanjang pantai & jalan ---
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
  const palmSpots = [];
  for (let x = -300; x <= 300; x += 60) palmSpots.push([x + 8, 296]);
  for (let i = 0; i < 14; i++) palmSpots.push([(rng() - 0.5) * 560, (rng() - 0.5) * 560]);
  for (const [x, z] of palmSpots) {
    if (nearLandmark(x, z)) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 6), trunkMat);
    trunk.position.set(x, 3.5, z);
    trunk.castShadow = true;
    group.add(trunk);
    for (let k = 0; k < 5; k++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.4, 4), leafMat);
      const a = (k / 5) * Math.PI * 2;
      leaf.position.set(x + Math.cos(a) * 1.6, 7.6, z + Math.sin(a) * 1.6);
      leaf.rotation.z = Math.cos(a) * 0.9;
      leaf.rotation.x = -Math.sin(a) * 0.9;
      group.add(leaf);
    }
  }

  // --- Lampu jalan (tiang + bola menyala) ---
  const lampPoleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  const lampBulbs = [];
  for (const s of streets) {
    for (let d = -280; d <= 280; d += 80) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7, 6), lampPoleMat);
      pole.position.set(s + 8, 3.5, d);
      group.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), lampBulbMat);
      bulb.position.set(s + 8, 7.2, d);
      group.add(bulb);
      lampBulbs.push(bulb);
    }
  }

  // --- Neon: papan menyala di Pasar & Menara (hidup saat senja/malam) ---
  const neonMat = new THREE.MeshBasicMaterial({ color: 0xff2e9a });
  const neonMat2 = new THREE.MeshBasicMaterial({ color: 0x2ee6ff });
  const neons = [];
  const n1 = new THREE.Mesh(new THREE.BoxGeometry(20, 2.4, 0.5), neonMat);
  n1.position.set(-120, 11.5, 44.6);
  group.add(n1);
  neons.push(n1);
  const n2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 16, 0.5), neonMat2);
  n2.position.set(10.5, 60, -30);
  group.add(n2);
  neons.push(n2);

  // --- Mode waktu: matahari, langit, kabut, jendela, lampu ---
  const windowMats = [];
  group.traverse((o) => {
    if (o.isMesh && o.userData.windowMat) windowMats.push(o.userData.windowMat);
  });
  let timeOfDay = 'dusk';
  function setTimeOfDay(name) {
    timeOfDay = name;
    if (name === 'day') {
      sun.color.set(0xfff2d8);
      sun.intensity = 2.2;
      sun.position.set(180, 260, 120);
      hemi.intensity = 1.1;
      sky.material.map = skyDay;
      scene.fog = new THREE.Fog(0xcfe0ea, 320, 850);
      for (const m of windowMats) m.emissiveIntensity = 0.06;
      for (const p of lampLights) p.intensity = 0;
      for (const b of lampBulbs) b.material = lampBulbMat;
      for (const n of neons) n.visible = false;
      beaconLight.intensity = 0;
      cloudMat.opacity = 0.6;
    } else if (name === 'night') {
      sun.color.set(0x8fa8ff);
      sun.intensity = 0.55;
      sun.position.set(-140, 200, -100);
      hemi.intensity = 0.35;
      sky.material.map = skyNight;
      scene.fog = new THREE.Fog(0x0a1226, 220, 700);
      for (const m of windowMats) m.emissiveIntensity = 1.5;
      for (const p of lampLights) p.intensity = 60;
      for (const n of neons) n.visible = true;
      beaconLight.intensity = 90;
      cloudMat.opacity = 0.22;
    } else {
      // senja — default Kota Cakrawala
      sun.color.set(0xff9e57);
      sun.intensity = 1.5;
      sun.position.set(-220, 130, 180);
      hemi.intensity = 0.7;
      sky.material.map = skyDusk;
      scene.fog = new THREE.Fog(0xd98a6a, 260, 800);
      for (const m of windowMats) m.emissiveIntensity = 0.9;
      for (const p of lampLights) p.intensity = 40;
      for (const n of neons) n.visible = true;
      beaconLight.intensity = 55;
      cloudMat.opacity = 0.4;
    }
    sky.material.needsUpdate = true;
  }
  setTimeOfDay('dusk');

  function districtAt(x, z) {
    let best = null;
    let bestD = Infinity;
    for (const d of DISTRICTS) {
      const dist = Math.hypot(x - d.cx, z - d.cz);
      if (dist < d.r && dist < bestD) {
        best = d.id;
        bestD = dist;
      }
    }
    return best ?? 'pusat';
  }

  let cloudT = 0;
  return {
    group,
    colliders,
    landmarks: LANDMARKS,
    buSari,
    garages,
    setTimeOfDay,
    districtAt,
    buildingCount,
    get timeOfDay() {
      return timeOfDay;
    },
    update(dt) {
      cloudT += dt;
      for (let i = 0; i < clouds.length; i++) {
        clouds[i].position.x += dt * (1.2 + i * 0.12);
        if (clouds[i].position.x > 420) clouds[i].position.x = -420;
      }
      beacon.material.color.setHex(Math.sin(cloudT * 3) > 0 ? 0xff2a3c : 0x881122);
    },
  };
}
