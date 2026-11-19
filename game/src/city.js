// city.js — builds procedural Kota Cakrawala: ~100 buildings with lit
// windows, a road grid, palms, beach + sea, harbor, and the landmarks
// (Menara Cakrawala, Pasar, Rumah Sakit, bengkel Bu Sari).
import * as THREE from 'three';

const ROADS = [-270, -210, -150, -90, -30, 30, 90, 150, 210, 270];
const PALETTE = [0x8a7f74, 0x9c8f7a, 0x7a8a99, 0xb0a08a, 0x6f7f6a, 0xa88f8f, 0x8f9aa8, 0xc2b49a];

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function windowTexture(rand, litRatio) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#20242c';
  g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 122; y += 12) {
    for (let x = 6; x < 58; x += 10) {
      const lit = rand() < litRatio;
      g.fillStyle = lit ? (rand() < 0.7 ? '#ffd98a' : '#9fd8ff') : '#2c3442';
      g.fillRect(x, y, 6, 8);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roadTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#23262d';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#c8cdd4';
  g.fillRect(60, 8, 8, 40);
  g.fillRect(60, 80, 8, 40);
  g.fillStyle = '#e8e4d8';
  g.fillRect(0, 0, 128, 4);
  g.fillRect(0, 124, 128, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildCity(scene) {
  const rand = mulberry(20261119);
  const colliders = [];
  const group = new THREE.Group();
  group.name = 'city';
  scene.add(group);

  const sun = new THREE.DirectionalLight(0xfff2d8, 1.25);
  sun.position.set(180, 260, 120);
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x3a4a3a, 0.85);
  scene.add(hemi);
  const nightLamp = new THREE.PointLight(0xffc37a, 0, 260);
  nightLamp.position.set(0, 60, 0);
  scene.add(nightLamp);

  // Ground + sea + beach.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(760, 760),
    new THREE.MeshStandardMaterial({ color: 0x4d5a4a, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.1, 0);
  group.add(ground);

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(760, 46),
    new THREE.MeshStandardMaterial({ color: 0xd9c28f, roughness: 1 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0.02, 323);
  group.add(sand);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(760, 420),
    new THREE.MeshStandardMaterial({ color: 0x1e6f9e, roughness: 0.25, metalness: 0.35 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.0, 556);
  group.add(sea);

  // Roads: one plane per grid line, both directions, dashed texture.
  const rTex = roadTexture();
  const roadMat = new THREE.MeshStandardMaterial({ map: rTex, roughness: 0.95 });
  for (const c of ROADS) {
    const along = new THREE.Mesh(new THREE.PlaneGeometry(620, 11), roadMat);
    along.rotation.x = -Math.PI / 2;
    along.position.set(0, 0.05, c);
    rTex.repeat.set(10, 1);
    group.add(along);
    const across = new THREE.Mesh(new THREE.PlaneGeometry(11, 620), roadMat.clone());
    across.material.map = rTex.clone();
    across.material.map.repeat.set(1, 10);
    across.material.map.needsUpdate = true;
    across.rotation.x = -Math.PI / 2;
    across.position.set(c, 0.05, 0);
    group.add(across);
  }

  // Buildings: one or two per block between roads.
  const winTexes = [windowTexture(rand, 0.35), windowTexture(rand, 0.55), windowTexture(rand, 0.2)];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const blockCenters = [];
  for (let i = 0; i < ROADS.length - 1; i++) {
    blockCenters.push((ROADS[i] + ROADS[i + 1]) / 2);
  }
  let built = 0;
  const landmarkBlocks = new Set(['-180,-180', '180,-180', '180,180', '-240,240']);
  for (const bx of blockCenters) {
    for (const bz of blockCenters) {
      if (landmarkBlocks.has(`${bx},${bz}`)) continue;
      const count = rand() < 0.45 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const w = 16 + rand() * 18;
        const d = 16 + rand() * 18;
        const h = 8 + rand() * rand() * 34;
        const ox = k === 0 ? -8 : 10;
        const oz = k === 0 ? -6 : 8;
        const mat = new THREE.MeshStandardMaterial({
          color: PALETTE[Math.floor(rand() * PALETTE.length)],
          roughness: 0.9,
          map: winTexes[Math.floor(rand() * winTexes.length)],
          emissive: 0xffc978,
          emissiveMap: winTexes[Math.floor(rand() * winTexes.length)],
          emissiveIntensity: 0.25,
        });
        const b = new THREE.Mesh(boxGeo, mat);
        b.scale.set(w, h, d);
        b.position.set(bx + ox, h / 2, bz + oz);
        group.add(b);
        colliders.push({ x: bx + ox, z: bz + oz, hx: w / 2 + 1, hz: d / 2 + 1 });
        built++;
        // Neon sign strip on some roofs.
        if (rand() < 0.3) {
          const neon = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.7, 0.7, 0.7),
            new THREE.MeshStandardMaterial({
              color: 0x111111,
              emissive: [0xff2e88, 0x22d3ee, 0xa3e635, 0xffb020][Math.floor(rand() * 4)],
              emissiveIntensity: 1.6,
            }),
          );
          neon.position.set(bx + ox, h + 0.4, bz + oz);
          group.add(neon);
        }
      }
    }
  }

  // Landmarks.
  function landmarkBox(x, z, w, h, d, color, label, labelColor) {
    const m = new THREE.Mesh(
      boxGeo,
      new THREE.MeshStandardMaterial({ color, roughness: 0.85, emissive: 0x000000 }),
    );
    m.scale.set(w, h, d);
    m.position.set(x, h / 2, z);
    group.add(m);
    colliders.push({ x, z, hx: w / 2 + 1, hz: d / 2 + 1 });
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(Math.min(w * 0.9, 30), 3, 1),
      new THREE.MeshStandardMaterial({ color: 0x111111, emissive: labelColor, emissiveIntensity: 1.4 }),
    );
    sign.position.set(x, h + 2, z + d / 2 + 0.6);
    group.add(sign);
    return new THREE.Vector3(x, 0, z);
  }

  const menara = landmarkBox(-180, -180, 26, 86, 26, 0x5a6b7d, 'MENARA', 0x22d3ee);
  // Menara spire.
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 3, 16, 8),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, emissive: 0xff2e88, emissiveIntensity: 0.8 }));
  spire.position.set(-180, 94, -180);
  group.add(spire);
  const pasar = landmarkBox(180, -180, 40, 12, 30, 0xc98f3d, 'PASAR', 0xffb020);
  const rs = landmarkBox(180, 180, 34, 20, 26, 0xe8e8e8, 'RS', 0x34d399);
  // Red cross on the hospital roof.
  const crossMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0xcc2222, emissiveIntensity: 0.7 });
  const crossA = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 3), crossMat);
  crossA.position.set(180, 21, 180);
  const crossB = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 10), crossMat);
  crossB.position.set(180, 21, 180);
  group.add(crossA, crossB);

  // Bengkel Bu Sari (workshop) — low building with orange roof.
  const bengkel = new THREE.Group();
  const bBase = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.9 }));
  bBase.scale.set(26, 9, 18);
  bBase.position.y = 4.5;
  bengkel.add(bBase);
  const bRoof = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0xd96a1e, roughness: 0.7 }));
  bRoof.scale.set(28, 1.2, 20);
  bRoof.position.y = 9.4;
  bengkel.add(bRoof);
  const bSign = new THREE.Mesh(new THREE.BoxGeometry(20, 2.4, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffb020, emissiveIntensity: 1.5 }));
  bSign.position.set(0, 8, 9.6);
  bengkel.add(bSign);
  bengkel.position.set(-222, 0, 252);
  group.add(bengkel);
  colliders.push({ x: -222, z: 252, hx: 14, hz: 10 });

  // Bu Sari herself — simple stylised figure with a headscarf.
  const buSari = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 1.7, 10),
    new THREE.MeshStandardMaterial({ color: 0x7a3fa0, roughness: 0.9 }));
  dress.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: 0.8 }));
  head.position.y = 2.05;
  const scarf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
    new THREE.MeshStandardMaterial({ color: 0xd96a1e, roughness: 0.9 }));
  scarf.position.y = 2.12;
  buSari.add(dress, head, scarf);
  buSari.position.set(-248, 0, 232);
  group.add(buSari);

  // Harbor: pier, containers, crane, ship at the south-east beach.
  const pier = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x6b5a44, roughness: 1 }));
  pier.scale.set(14, 2, 60);
  pier.position.set(250, 1, 360);
  group.add(pier);
  const contColors = [0xc23b2e, 0x2e7fc2, 0x3da55a, 0xd9a520];
  for (let i = 0; i < 10; i++) {
    const cont = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: contColors[i % 4], roughness: 0.8 }));
    cont.scale.set(6, 2.6, 2.6);
    cont.position.set(210 + (i % 5) * 8, 1.3 + Math.floor(i / 5) * 2.7, 312 + (i % 2) * 4);
    cont.rotation.y = (rand() - 0.5) * 0.2;
    group.add(cont);
  }
  // Crane.
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xd9a520, roughness: 0.6 });
  const craneLeg = new THREE.Mesh(boxGeo, craneMat);
  craneLeg.scale.set(3, 26, 3);
  craneLeg.position.set(268, 13, 330);
  const craneArm = new THREE.Mesh(boxGeo, craneMat);
  craneArm.scale.set(3, 2.5, 42);
  craneArm.position.set(268, 26, 348);
  group.add(craneLeg, craneArm);
  // Ship hull in the sea.
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x2e4a6b, roughness: 0.7 }));
  hull.scale.set(18, 6, 60);
  hull.position.y = 2;
  const deck = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.8 }));
  deck.scale.set(12, 5, 20);
  deck.position.set(0, 6, -16);
  ship.add(hull, deck);
  ship.position.set(190, 0, 430);
  group.add(ship);

  // Palms along the beach and scattered in parks.
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 6, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f8f4a, roughness: 1 });
  const leafGeo = new THREE.ConeGeometry(1.6, 4.5, 5);
  function palm(x, z) {
    const p = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    p.add(trunk);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 1.2, 6.4, Math.sin(a) * 1.2);
      leaf.rotation.z = Math.cos(a) * 1.1;
      leaf.rotation.x = -Math.sin(a) * 1.1;
      p.add(leaf);
    }
    p.position.set(x, 0, z);
    group.add(p);
  }
  for (let x = -280; x <= 280; x += 40) palm(x + (rand() - 0.5) * 10, 306 + rand() * 8);
  for (let i = 0; i < 16; i++) palm(-270 + rand() * 540, -270 + rand() * 540);

  // Streetlights along a few roads.
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333a44, roughness: 0.6, metalness: 0.5 });
  const bulbGeo = new THREE.SphereGeometry(0.35, 8, 6);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffdf8a, emissiveIntensity: 1.2 });
  for (const rx of [-210, -90, 30, 150, 270]) {
    for (let z = -270; z <= 270; z += 60) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(rx + 6, 3.5, z);
      group.add(pole);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(rx + 6, 7.1, z);
      group.add(bulb);
    }
  }

  // Clouds: flat white blobs high up.
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 14; i++) {
    const cl = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(6 + rand() * 7, 8, 6), cloudMat);
      puff.scale.y = 0.45;
      puff.position.set(j * 8 - 8, rand() * 2, (rand() - 0.5) * 6);
      cl.add(puff);
    }
    cl.position.set(-320 + rand() * 640, 110 + rand() * 40, -320 + rand() * 640);
    group.add(cl);
  }

  // Zebra crossings at a few intersections.
  const zebraMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.9 });
  for (const [zx, zz] of [[-30, -30], [30, 90], [150, 30], [-150, 150]]) {
    for (let i = -2; i <= 2; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 9), zebraMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(zx + i * 2.2, 0.07, zz);
      group.add(stripe);
    }
  }

  return {
    group,
    colliders,
    buildingsBuilt: built,
    sun,
    hemi,
    nightLamp,
    landmarks: {
      menara,
      pasar,
      rs,
      bengkel: new THREE.Vector3(-222, 0, 252),
      pantai: new THREE.Vector3(0, 0, 318),
      dermaga: new THREE.Vector3(250, 0, 360),
    },
    buSari,
    setTimeOfDay(name) {
      if (name === 'sunset') {
        scene.background = new THREE.Color(0xff8f4d);
        scene.fog = new THREE.Fog(0xff8f4d, 120, 620);
        sun.intensity = 0.75;
        sun.color.set(0xffb37a);
        hemi.intensity = 0.5;
        nightLamp.intensity = 0;
      } else if (name === 'night') {
        scene.background = new THREE.Color(0x0a1030);
        scene.fog = new THREE.Fog(0x0a1030, 100, 520);
        sun.intensity = 0.18;
        sun.color.set(0x8fa8ff);
        hemi.intensity = 0.25;
        nightLamp.intensity = 1.4;
      } else {
        scene.background = new THREE.Color(0x87b5e0);
        scene.fog = new THREE.Fog(0x87b5e0, 160, 700);
        sun.intensity = 1.25;
        sun.color.set(0xfff2d8);
        hemi.intensity = 0.85;
        nightLamp.intensity = 0;
      }
    },
  };
}
