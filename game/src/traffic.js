// traffic.js — 18 mobil AI + 30 pejalan kaki AI di jalanan kota.
import * as THREE from 'three';
import { makeCarMesh } from './vehicles.js';

const AI_COLORS = [0xd7263d, 0x2a6fd6, 0xffd23d, 0x2e8b57, 0xf2f2f2, 0xff7f2a, 0x7b2ff7, 0x1a1a1a, 0x4da6e8, 0x7ed957];

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createTraffic(scene, colliders) {
  const rand = mulberry(777);
  const cars = [];
  const carDefs = AI_COLORS.map((c) => ({ id: 'ai', name: 'Mobil', kind: 'Sedan', color: c, topSpeed: 14, price: 0 }));

  for (let i = 0; i < 18; i++) {
    const def = carDefs[i % carDefs.length];
    const { group } = makeCarMesh(def, def.color);
    scene.add(group);
    const vertical = i % 2 === 0;
    const lane = -240 + Math.floor(rand() * 8) * 80 + (rand() > 0.5 ? 3 : -3);
    const along = -280 + rand() * 600;
    const dir = rand() > 0.5 ? 1 : -1;
    cars.push({
      mesh: group,
      def,
      vertical,
      lane,
      along,
      dir,
      speed: 7 + rand() * 6,
      heading: vertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2),
      pos: new THREE.Vector3(vertical ? lane : along, 0, vertical ? along : lane),
    });
  }

  const peds = [];
  const pedPalette = [0xe84d4d, 0x4da6e8, 0x7ed957, 0xffd23d, 0xff8ac2, 0x9b59d0, 0x2e8b57, 0x8a6a3a];
  for (let i = 0; i < 30; i++) {
    const g = new THREE.Group();
    const shirt = new THREE.MeshStandardMaterial({ color: pedPalette[i % pedPalette.length], roughness: 0.85 });
    const skin = new THREE.MeshStandardMaterial({ color: [0xe8b88a, 0xc98a5a, 0x8a5a3a][i % 3], roughness: 0.75 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.42), shirt);
    torso.position.y = 1.2;
    g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), skin);
    head.position.y = 1.95;
    g.add(head);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.9 }));
    legs.position.y = 0.4;
    g.add(legs);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const x = -280 + rand() * 600;
    const z = -280 + rand() * 560;
    g.position.set(x, 0, z);
    scene.add(g);
    peds.push({
      mesh: g,
      pos: new THREE.Vector3(x, 0, z),
      heading: rand() * Math.PI * 2,
      speed: 1.2 + rand() * 1.2,
      turnTimer: 2 + rand() * 4,
      phase: rand() * 6,
    });
  }

  return {
    cars,
    peds,
    update(dt, t) {
      for (const c of cars) {
        c.along += c.dir * c.speed * dt;
        if (c.along > 330) { c.along = -300; c.lane = -240 + Math.floor(rand() * 8) * 80 + (rand() > 0.5 ? 3 : -3); }
        if (c.along < -300) { c.along = 330; c.lane = -240 + Math.floor(rand() * 8) * 80 + (rand() > 0.5 ? 3 : -3); }
        if (c.vertical) { c.pos.set(c.lane, 0, c.along); c.heading = c.dir > 0 ? 0 : Math.PI; }
        else { c.pos.set(c.along, 0, c.lane); c.heading = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
        c.mesh.position.copy(c.pos);
        c.mesh.rotation.y = c.heading;
      }
      for (const p of peds) {
        p.turnTimer -= dt;
        if (p.turnTimer <= 0) {
          p.heading += (rand() - 0.5) * 2.4;
          p.turnTimer = 2 + rand() * 4;
        }
        const nx = p.pos.x + Math.sin(p.heading) * p.speed * dt;
        const nz = p.pos.z + Math.cos(p.heading) * p.speed * dt;
        if (nx < -300 || nx > 335 || nz < -300 || nz > 335) {
          p.heading += Math.PI;
        } else {
          p.pos.x = nx;
          p.pos.z = nz;
        }
        p.phase += dt * 6;
        p.mesh.position.copy(p.pos);
        p.mesh.position.y = Math.abs(Math.sin(p.phase)) * 0.06;
        p.mesh.rotation.y = p.heading;
      }
    },
  };
}
