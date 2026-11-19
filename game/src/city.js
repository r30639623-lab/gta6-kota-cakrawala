// city.js — Kota Cakrawala: kota pesisir fiktif yang dibangun prosedural.
// Grid jalan, gedung dengan jendela menyala, lampu jalan, pohon palem,
// pantai + laut di timur, pelabuhan di selatan, bengkel Bu Sari, langit
// gradient + awan. Semua tekstur digambar di canvas — tanpa aset luar.
// Waktu dalam game: 'day' (siang cerah) atau 'dusk' (senja, lampu menyala).
import * as THREE from 'three';

/** RNG deterministik (mulberry32): seed sama -> kota sama, shot bisa diulang. */
export function createRandom(seed) {
  let a = seed | 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CITY = {
  roadStep: 60,      // jarak antar sumbu jalan
  roadHalf: 7,       // setengah lebar aspal
  gridHalf: 300,     // jalan terjauh dari pusat
  landHalf: 330,     // tepi daratan kota
  beachX: 330,       // pantai mulai di x ini
  seaX: 425,         // laut mulai di x ini
  harborZ: 330,      // pelabuhan mulai di z ini
  waterZ: 400,       // laut selatan mulai di z ini
};

// Posisi penting di kota (dipakai misi + spawn).
export const PLACES = {
  workshop: new THREE.Vector3(-270, 0, 270),   // bengkel Bu Sari (barat daya)
  harbor: new THREE.Vector3(150, 0, 360),      // dermaga pelabuhan (selatan)
  plaza: new THREE.Vector3(30, 0, -30),         // alun-alun tengah kota
  beach: new THREE.Vector3(370, 0, 0),          // pantai timur
  spawn: new THREE.Vector3(-240, 0, 240),       // spawn awal Raka (dekat bengkel)
  tower: new THREE.Vector3(210, 0, -210),       // Menara Cakrawala (timur laut)
  market: new THREE.Vector3(-150, 0, 150),      // Pasar Cakrawala (barat tengah)
  hospital: new THREE.Vector3(210, 0, 210),     // Rumah Sakit Cakrawala (tenggara)
  garage: new THREE.Vector3(-258, 0, 258),      // pintu garasi bengkel Bu Sari
};

/** Gambar tekstur tanah kota: trotoar, aspal, marka jalan, zebra cross. */
function makeGroundTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  const world = CITY.landHalf * 2 + 160; // -410..410 dipetakan ke canvas
  const toPx = (v) => ((v + world / 2) / world) * S;
  // Trotoar / tanah dasar.
  g.fillStyle = '#b8a88f';
  g.fillRect(0, 0, S, S);
  // Rumput taman di beberapa blok.
  g.fillStyle = '#7fae62';
  // Jalan: aspal gelap.
  const roads = [];
  for (let v = -CITY.gridHalf; v <= CITY.gridHalf; v += CITY.roadStep) roads.push(v);
  g.fillStyle = '#4a4d56';
  for (const v of roads) {
    g.fillRect(0, toPx(v - CITY.roadHalf), S, toPx(v + CITY.roadHalf) - toPx(v - CITY.roadHalf));
    g.fillRect(toPx(v - CITY.roadHalf), 0, toPx(v + CITY.roadHalf) - toPx(v - CITY.roadHalf), S);
  }
  // Marka tengah kuning putus-putus.
  g.fillStyle = '#e8c33a';
  for (const v of roads) {
    for (let u = -CITY.gridHalf; u <= CITY.gridHalf; u += 16) {
      g.fillRect(toPx(u), toPx(v) - 2, toPx(u + 8) - toPx(u), 4);
      g.fillRect(toPx(v) - 2, toPx(u), 4, toPx(u + 8) - toPx(u));
    }
  }
  // Zebra cross di tiap persimpangan.
  g.fillStyle = '#e8e8e8';
  for (const a of roads) for (const b of roads) {
    for (let k = -2; k <= 2; k++) {
      g.fillRect(toPx(a + k * 3 - 1), toPx(b - CITY.roadHalf - 1), 2.4, 5);
      g.fillRect(toPx(a + k * 3 - 1), toPx(b + CITY.roadHalf - 4), 2.4, 5);
      g.fillRect(toPx(a - CITY.roadHalf - 1), toPx(b + k * 3 - 1), 5, 2.4);
      g.fillRect(toPx(a + CITY.roadHalf - 4), toPx(b + k * 3 - 1), 5, 2.4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Tekstur fasad gedung: warna dasar + grid jendela; versi emissive-nya jendela menyala. */
function makeBuildingTextures(baseColor, litRatio) {
  const W = 128, H = 256;
  const map = document.createElement('canvas');
  map.width = W; map.height = H;
  const emi = document.createElement('canvas');
  emi.width = W; emi.height = H;
  const gm = map.getContext('2d');
  const ge = emi.getContext('2d');
  gm.fillStyle = baseColor;
  gm.fillRect(0, 0, W, H);
  ge.fillStyle = '#000000';
  ge.fillRect(0, 0, W, H);
  // Sedikit variasi warna per lantai.
  gm.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 0; y < H; y += 32) gm.fillRect(0, y, W, 2);
  const cols = 4, rows = 10;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = 10 + col * 30, y = 12 + r * 24;
      const lit = Math.random() < litRatio;
      gm.fillStyle = lit ? '#ffd98a' : '#2c3a4a';
      gm.fillRect(x, y, 18, 14);
      if (lit) {
        ge.fillStyle = '#ffca66';
        ge.fillRect(x, y, 18, 14);
      }
    }
  }
  const mapTex = new THREE.CanvasTexture(map);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  mapTex.wrapS = mapTex.wrapT = THREE.RepeatWrapping;
  const emiTex = new THREE.CanvasTexture(emi);
  emiTex.wrapS = emiTex.wrapT = THREE.RepeatWrapping;
  return { mapTex, emiTex };
}

const FACADE_COLORS = ['#c98f6b', '#8fa8bf', '#b7a06a', '#9a8fae', '#7fb0a0', '#c47a6d', '#a8b8c8', '#d9b380'];

function makePalm(rng) {
  const palm = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6b4a });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f9e4d, side: THREE.DoubleSide });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 5.5, 6), trunkMat);
  trunk.position.y = 2.75;
  trunk.rotation.z = (rng() - 0.5) * 0.15;
  palm.add(trunk);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.4, 4), leafMat);
    leaf.position.y = 5.6;
    leaf.rotation.z = Math.PI / 2.6;
    leaf.rotation.y = (i / 6) * Math.PI * 2;
    leaf.translateY(1.2);
    palm.add(leaf);
  }
  return palm;
}

export function createCity(scene, seed = 1) {
  const rng = createRandom(seed);
  const colliders = []; // {minX,maxX,minZ,maxZ} — gedung, kontainer, crane
  const buildingMaterials = [];
  const neonMats = []; // material neon — digelapkan siang, menyala senja/malam
  const clouds = [];
  let lampHeadMat = null;
  let seaMesh = null;

  // --- Langit: kubah gradient + matahari (shader sederhana) ---
  const skyUniforms = {
    topColor: { value: new THREE.Color(0x2f7fd0) },
    horizonColor: { value: new THREE.Color(0xbfd9ee) },
    sunDir: { value: new THREE.Vector3(0.5, 0.75, 0.35).normalize() },
    sunColor: { value: new THREE.Color(0xfff2c0) },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1400, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vDir; uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 sunDir; uniform vec3 sunColor;
        void main(){ float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(horizonColor, topColor, pow(h, 0.6));
        float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
        col += sunColor * pow(s, 220.0) * 1.4 + sunColor * pow(s, 8.0) * 0.18;
        gl_FragColor = vec4(col, 1.0); }`,
    }),
  );
  scene.add(sky);

  // --- Pencahayaan ---
  const sun = new THREE.DirectionalLight(0xfff1d0, 2.6);
  sun.position.set(220, 320, 140);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -420; sun.shadow.camera.right = 420;
  sun.shadow.camera.top = 420; sun.shadow.camera.bottom = -420;
  sun.shadow.camera.far = 1200;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(sun.target);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.9);
  scene.add(hemi);
  scene.fog = new THREE.Fog(0xc4d8ea, 500, 1300);

  // --- Tanah kota (tekstur jalan) ---
  const groundSize = CITY.landHalf * 2 + 160;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(groundSize, groundSize),
    new THREE.MeshLambertMaterial({ map: makeGroundTexture() }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- Pantai (pasir) + laut ---
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(95, 860),
    new THREE.MeshLambertMaterial({ color: 0xe8d29a }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(CITY.beachX + 47, 0.05, 0);
  sand.receiveShadow = true;
  scene.add(sand);

  const seaGeo = new THREE.PlaneGeometry(700, 1400);
  seaMesh = new THREE.Mesh(seaGeo, new THREE.MeshPhongMaterial({
    color: 0x1e7fb8, shininess: 120, specular: 0x99ccff, transparent: true, opacity: 0.94,
  }));
  seaMesh.rotation.x = -Math.PI / 2;
  seaMesh.position.set(CITY.seaX + 350, -0.4, 0);
  scene.add(seaMesh);
  // Laut selatan (di balik pelabuhan).
  const seaSouth = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 500),
    seaMesh.material,
  );
  seaSouth.rotation.x = -Math.PI / 2;
  seaSouth.position.set(0, -0.4, CITY.waterZ + 250);
  scene.add(seaSouth);

  // --- Gedung-gedung ---
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0); // alas di y=0
  const textures = FACADE_COLORS.map((c) => makeBuildingTextures(c, 0.45));
  const parkBlocks = new Set(['30,-30', '-90,90', '150,-150']);
  const civicBlocks = new Set(['210,-210', '-150,150', '210,210']); // menara, pasar, rumah sakit
  const blockCenters = [];
  for (let bx = -270; bx <= 270; bx += 60) {
    for (let bz = -270; bz <= 270; bz += 60) blockCenters.push([bx, bz]);
  }
  for (const [bx, bz] of blockCenters) {
    const key = `${bx},${bz}`;
    if (key === '-270,270') continue; // blok bengkel Bu Sari
    if (civicBlocks.has(key)) continue; // blok civic: menara / pasar / rumah sakit (dibangun di bawah)
    if (parkBlocks.has(key)) {
      // Taman: rumput + palem.
      const lawn = new THREE.Mesh(
        new THREE.PlaneGeometry(38, 38),
        new THREE.MeshLambertMaterial({ color: 0x6fae56 }),
      );
      lawn.rotation.x = -Math.PI / 2;
      lawn.position.set(bx, 0.08, bz);
      lawn.receiveShadow = true;
      scene.add(lawn);
      for (let i = 0; i < 5; i++) {
        const palm = makePalm(rng);
        palm.position.set(bx + (rng() - 0.5) * 28, 0, bz + (rng() - 0.5) * 28);
        scene.add(palm);
      }
      continue;
    }
    const distCenter = Math.hypot(bx, bz);
    const tall = distCenter < 130;
    const count = rng() < 0.45 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const w = 14 + rng() * 12;
      const d = 14 + rng() * 12;
      const h = distCenter < 70 ? 44 + rng() * 40 : tall ? 26 + rng() * 44 : 10 + rng() * 20;
      const ox = count === 2 ? (i === 0 ? -9 : 9) : 0;
      const oz = count === 2 ? (i === 0 ? -9 : 9) : 0;
      const tex = textures[Math.floor(rng() * textures.length)];
      const mat = new THREE.MeshLambertMaterial({
        map: tex.mapTex.clone(),
        emissiveMap: tex.emiTex.clone(),
        emissive: new THREE.Color(0xffb84d),
        emissiveIntensity: 0.0,
      });
      mat.map.repeat.set(Math.max(1, Math.round(w / 12)), Math.max(1, Math.round(h / 22)));
      mat.emissiveMap.repeat.copy(mat.map.repeat);
      mat.map.needsUpdate = true;
      mat.emissiveMap.needsUpdate = true;
      buildingMaterials.push(mat);
      const b = new THREE.Mesh(boxGeo, mat);
      b.scale.set(w, h, d);
      b.position.set(bx + ox, 0, bz + oz);
      b.rotation.y = rng() < 0.5 ? 0 : Math.PI / 2;
      b.castShadow = true;
      b.receiveShadow = true;
      scene.add(b);
      const hw = (b.rotation.y === 0 ? w : d) / 2;
      const hd = (b.rotation.y === 0 ? d : w) / 2;
      colliders.push({
        minX: b.position.x - hw, maxX: b.position.x + hw,
        minZ: b.position.z - hd, maxZ: b.position.z + hd,
      });
      // Variasi atap: kotak AC, antena, dan papan neon warna-warni.
      const topY = h;
      if (rng() < 0.45) {
        const ac = new THREE.Mesh(
          new THREE.BoxGeometry(3, 1.4, 2.4),
          new THREE.MeshLambertMaterial({ color: 0x8a929c }),
        );
        ac.position.set(b.position.x + (rng() - 0.5) * w * 0.4, topY + 0.7, b.position.z + (rng() - 0.5) * d * 0.4);
        ac.castShadow = true;
        scene.add(ac);
      }
      if (rng() < 0.22) {
        const antenna = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.2, 7 + rng() * 6, 5),
          new THREE.MeshLambertMaterial({ color: 0x555c66 }),
        );
        antenna.position.set(b.position.x, topY + 4, b.position.z);
        scene.add(antenna);
        const tip = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 6, 5),
          new THREE.MeshBasicMaterial({ color: 0xff3344 }),
        );
        tip.position.set(b.position.x, topY + 7.5, b.position.z);
        scene.add(tip);
        neonMats.push(tip.material);
      }
      if (rng() < 0.3 && h > 18) {
        // Papan neon vertikal di fasad gedung tinggi (menyala saat senja/malam).
        const neonColors = [0xff2e88, 0x00e5ff, 0xffe600, 0x7cff4d, 0xff7a00];
        const neonMat = new THREE.MeshBasicMaterial({ color: neonColors[Math.floor(rng() * neonColors.length)] });
        neonMats.push(neonMat);
        const neon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6 + rng() * 6, 0.5), neonMat);
        neon.position.set(b.position.x + hw + 0.4, topY * 0.55, b.position.z);
        scene.add(neon);
        const neon2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 1.2), neonMat);
        neon2.position.set(b.position.x, topY * 0.55, b.position.z + hd + 0.4);
        scene.add(neon2);
      }
    }
  }

  // --- Bengkel Bu Sari: bangunan rendah khas + papan nama oranye ---
  const workshopMat = new THREE.MeshLambertMaterial({ color: 0xd86a2a });
  const workshop = new THREE.Mesh(boxGeo, workshopMat);
  workshop.scale.set(30, 9, 20);
  workshop.position.set(PLACES.workshop.x, 0, PLACES.workshop.z);
  workshop.castShadow = true;
  workshop.receiveShadow = true;
  scene.add(workshop);
  colliders.push({
    minX: PLACES.workshop.x - 15, maxX: PLACES.workshop.x + 15,
    minZ: PLACES.workshop.z - 10, maxZ: PLACES.workshop.z + 10,
  });
  // Papan nama bengkel (kotak emissive oranye di atas atap).
  const signMat = new THREE.MeshBasicMaterial({ color: 0xff8c1a });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(16, 2.4, 0.6), signMat);
  sign.position.set(PLACES.workshop.x, 10.2, PLACES.workshop.z - 10.2);
  scene.add(sign);
  // Pintu garasi gelap.
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 6),
    new THREE.MeshLambertMaterial({ color: 0x2a2d33 }),
  );
  door.position.set(PLACES.workshop.x - 6, 3, PLACES.workshop.z - 10.05);
  door.rotation.y = Math.PI;
  scene.add(door);

  // --- Menara Cakrawala: landmark tertinggi kota (misi 4, 6, 8) ---
  const towerMat = new THREE.MeshLambertMaterial({ color: 0x5d6d7e });
  const tower = new THREE.Mesh(boxGeo, towerMat);
  tower.scale.set(22, 86, 22);
  tower.position.set(PLACES.tower.x, 0, PLACES.tower.z);
  tower.castShadow = true;
  tower.receiveShadow = true;
  scene.add(tower);
  colliders.push({ minX: PLACES.tower.x - 11, maxX: PLACES.tower.x + 11, minZ: PLACES.tower.z - 11, maxZ: PLACES.tower.z + 11 });
  const towerTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 3, 12, 8),
    new THREE.MeshLambertMaterial({ color: 0x2c3e50 }),
  );
  towerTop.position.set(PLACES.tower.x, 92, PLACES.tower.z);
  scene.add(towerTop);
  const towerBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff3344 }),
  );
  towerBeacon.position.set(PLACES.tower.x, 99, PLACES.tower.z);
  scene.add(towerBeacon);
  neonMats.push(towerBeacon.material);
  // Cincin neon di badan menara (menyala saat senja/malam).
  for (const ringY of [30, 52, 74]) {
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    neonMats.push(ringMat);
    const ring = new THREE.Mesh(new THREE.BoxGeometry(23.2, 1.0, 23.2), ringMat);
    ring.position.set(PLACES.tower.x, ringY, PLACES.tower.z);
    scene.add(ring);
  }

  // --- Pasar Cakrawala: deretan kios warna-warni + tenda (misi 5) ---
  const stallColors = [0xe74c3c, 0xf39c12, 0x27ae60, 0x8e44ad, 0x2980b9];
  for (let i = 0; i < 8; i++) {
    const sx = PLACES.market.x - 18 + (i % 4) * 12;
    const sz = PLACES.market.z - 12 + Math.floor(i / 4) * 22;
    const stall = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ color: stallColors[i % stallColors.length] }),
    );
    stall.scale.set(7, 3.2, 5);
    stall.position.set(sx, 0, sz);
    stall.castShadow = true;
    scene.add(stall);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(5.2, 2.6, 4),
      new THREE.MeshLambertMaterial({ color: 0xf5f0e1 }),
    );
    roof.position.set(sx, 4.4, sz);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);
    colliders.push({ minX: sx - 3.5, maxX: sx + 3.5, minZ: sz - 2.5, maxZ: sz + 2.5 });
  }

  // --- Rumah Sakit Cakrawala: gedung putih + palang merah (titik respawn) ---
  const hospital = new THREE.Mesh(
    boxGeo,
    new THREE.MeshLambertMaterial({ color: 0xf2f4f6 }),
  );
  hospital.scale.set(30, 20, 18);
  hospital.position.set(PLACES.hospital.x, 0, PLACES.hospital.z);
  hospital.castShadow = true;
  hospital.receiveShadow = true;
  scene.add(hospital);
  colliders.push({ minX: PLACES.hospital.x - 15, maxX: PLACES.hospital.x + 15, minZ: PLACES.hospital.z - 9, maxZ: PLACES.hospital.z + 9 });
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  neonMats.push(crossMat);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6, 0.6), crossMat);
  crossV.position.set(PLACES.hospital.x, 23, PLACES.hospital.z - 9.4);
  scene.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 0.6), crossMat);
  crossH.position.set(PLACES.hospital.x, 23, PLACES.hospital.z - 9.4);
  scene.add(crossH);

  // --- Pelabuhan: dermaga beton, kontainer warna-warni, crane, kapal ---
  // Dermaga beton rendah (permukaan hampir rata dengan tanah supaya Raka
  // bisa berjalan di atasnya tanpa tenggelam).
  const pier = new THREE.Mesh(
    new THREE.BoxGeometry(220, 1.0, 46),
    new THREE.MeshLambertMaterial({ color: 0x9a938a }),
  );
  pier.position.set(60, -0.35, 356);
  pier.receiveShadow = true;
  scene.add(pier);
  const containerColors = [0xc0392b, 0x2471a3, 0x1e8449, 0xd4ac0d, 0x7d3c98];
  for (let i = 0; i < 14; i++) {
    const cont = new THREE.Mesh(
      boxGeo,
      new THREE.MeshLambertMaterial({ color: containerColors[i % containerColors.length] }),
    );
    // Deret pertama di ujung barat dermaga, deret kedua di dekat titik misi.
    let cx, cz;
    if (i < 10) {
      cx = -30 + (i % 5) * 22;
      cz = 342 + Math.floor(i / 5) * 16;
    } else {
      cx = 80 + (i - 10) * 22;
      cz = 344;
    }
    const stacked = i % 3 === 0;
    const contH = stacked ? 10 : 5;
    cont.scale.set(12, contH, 6);
    cont.position.set(cx, 0.15 + contH / 2, cz);
    cont.castShadow = true;
    scene.add(cont);
    colliders.push({ minX: cx - 6, maxX: cx + 6, minZ: cz - 3, maxZ: cz + 3 });
  }
  // Crane pelabuhan (tiang + lengan).
  const craneMat = new THREE.MeshLambertMaterial({ color: 0xe8b93a });
  for (const cx of [-60, 40, 140]) {
    const mast = new THREE.Mesh(new THREE.BoxGeometry(3, 34, 3), craneMat);
    mast.position.set(cx, 17, 372);
    mast.castShadow = true;
    scene.add(mast);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 2), craneMat);
    arm.position.set(cx + 8, 32, 372);
    scene.add(arm);
    colliders.push({ minX: cx - 2, maxX: cx + 2, minZ: 370, maxZ: 374 });
  }
  // Kapal kargo sederhana di laut selatan.
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0x37474f }));
  hull.scale.set(46, 7, 12);
  hull.position.y = 1;
  ship.add(hull);
  const shipBox = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xc0392b }));
  shipBox.scale.set(20, 8, 10);
  shipBox.position.set(-6, 8, 0);
  ship.add(shipBox);
  ship.position.set(180, -0.5, 430);
  scene.add(ship);

  // --- Lampu jalan (instanced: tiang + kepala lampu) ---
  const lampPositions = [];
  for (let v = -300; v <= 300; v += 60) {
    for (const u of [-300, -180, -60, 60, 180, 300]) {
      lampPositions.push([v + 9, u + 9]);
      lampPositions.push([v - 9, u - 9]);
    }
  }
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7, 6);
  poleGeo.translate(0, 3.5, 0);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x2f3338 });
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampPositions.length);
  const headGeo = new THREE.SphereGeometry(0.45, 8, 6);
  headGeo.scale(1.4, 0.6, 0.8);
  lampHeadMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
  const heads = new THREE.InstancedMesh(headGeo, lampHeadMat, lampPositions.length);
  const m4 = new THREE.Matrix4();
  lampPositions.forEach(([x, z], i) => {
    m4.makeTranslation(x, 0, z);
    poles.setMatrixAt(i, m4);
    m4.makeTranslation(x, 7.1, z);
    heads.setMatrixAt(i, m4);
  });
  poles.castShadow = false;
  scene.add(poles);
  scene.add(heads);

  // --- Pohon palem di tepi jalan & pantai ---
  for (let i = 0; i < 70; i++) {
    const alongRoad = rng() < 0.6;
    let x, z;
    if (alongRoad) {
      const v = Math.floor(rng() * 11) * 60 - 300;
      const u = (Math.floor(rng() * 11) * 60 - 300) + (rng() < 0.5 ? -11 : 11);
      if (rng() < 0.5) { x = v; z = u; } else { x = u; z = v; }
    } else {
      x = CITY.beachX + 8 + rng() * 60;
      z = (rng() - 0.5) * 640;
    }
    const palm = makePalm(rng);
    palm.position.set(x, 0, z);
    palm.scale.setScalar(0.8 + rng() * 0.5);
    scene.add(palm);
  }

  // --- Awan: gumpalan bola putih yang melayang pelan ---
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(rng() * 3);
    for (let p = 0; p < puffs; p++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(9 + rng() * 9, 8, 6), cloudMat);
      s.position.set((p - puffs / 2) * 11 + rng() * 4, rng() * 3, rng() * 6);
      s.scale.y = 0.45;
      cloud.add(s);
    }
    cloud.position.set((rng() - 0.5) * 1100, 150 + rng() * 70, (rng() - 0.5) * 1100);
    cloud.userData.speed = 1 + rng() * 2;
    scene.add(cloud);
    clouds.push(cloud);
  }

  // --- Waktu dalam game: siang cerah vs senja vs malam neon ---
  function setTimeOfDay(mode) {
    // Neon: siang redup, senja/malam menyala penuh.
    const neonOn = mode !== 'day';
    for (const m of neonMats) m.color.multiplyScalar(1); // warna dasar tetap
    if (mode === 'night') {
      // Malam neon: langit gelap berbintang, lampu & jendela menyala terang.
      sun.position.set(-180, 260, 120);
      sun.color.set(0x8fa8ff);
      sun.intensity = 1.3;
      hemi.intensity = 0.62;
      hemi.color.set(0x3a4a7a);
      skyUniforms.topColor.value.set(0x0a0f2a);
      skyUniforms.horizonColor.value.set(0x2a1e4a);
      skyUniforms.sunDir.value.set(-0.5, 0.7, 0.3).normalize();
      skyUniforms.sunColor.value.set(0xdde6ff);
      scene.fog.color.set(0x141a33);
      scene.fog.near = 280;
      scene.fog.far = 950;
      for (const m of buildingMaterials) m.emissiveIntensity = 1.6;
      lampHeadMat.color.set(0xffe9a8);
    } else if (mode === 'dusk') {
      // Senja: matahari rendah & jingga, langit ungu-jingga, lampu menyala.
      sun.position.set(-320, 90, 180);
      sun.color.set(0xff9a4d);
      sun.intensity = 1.9;
      hemi.intensity = 0.65;
      hemi.color.set(0x8a7fd0);
      skyUniforms.topColor.value.set(0x2c2a5e);
      skyUniforms.horizonColor.value.set(0xff7e3d);
      skyUniforms.sunDir.value.set(-0.8, 0.22, 0.45).normalize();
      skyUniforms.sunColor.value.set(0xffb36b);
      scene.fog.color.set(0x7a5a78);
      scene.fog.near = 320;
      scene.fog.far = 1000;
      for (const m of buildingMaterials) m.emissiveIntensity = 1.0;
      lampHeadMat.color.set(0xffe9a8);
    } else {
      // Siang cerah.
      sun.position.set(220, 320, 140);
      sun.color.set(0xfff1d0);
      sun.intensity = 2.6;
      hemi.intensity = 0.9;
      hemi.color.set(0xbfd9ff);
      skyUniforms.topColor.value.set(0x2f7fd0);
      skyUniforms.horizonColor.value.set(0xbfd9ee);
      skyUniforms.sunDir.value.set(0.5, 0.75, 0.35).normalize();
      skyUniforms.sunColor.value.set(0xfff2c0);
      scene.fog.color.set(0xc4d8ea);
      scene.fog.near = 500;
      scene.fog.far = 1300;
      for (const m of buildingMaterials) m.emissiveIntensity = 0.0;
      lampHeadMat.color.set(0x555555);
    }
    // Neon menyala hanya saat senja/malam (siang: redup jadi abu).
    for (const m of neonMats) {
      if (m.userData.baseColor === undefined) m.userData.baseColor = m.color.clone();
      if (neonOn) m.color.copy(m.userData.baseColor);
      else m.color.copy(m.userData.baseColor).multiplyScalar(0.45);
    }
  }

  function update(dt, t) {
    for (const cloud of clouds) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 700) cloud.position.x = -700;
    }
    if (seaMesh) seaMesh.position.y = -0.4 + Math.sin(t * 0.7) * 0.15;
  }

  return { colliders, setTimeOfDay, update, buildingMaterials };
}
