// traffic.js — Lalu lintas Kota Cakrawala: 18 mobil AI di jalan grid
// dan 30 pejalan kaki di trotoar. Mobil AI mengikuti jalur jalan,
// berhenti di persimpangan secara acak, pejalan kaki berbelok acak.

import * as THREE from 'three';
import { makeCarMesh, CARS } from './vehicles.js';

const STREETS = [-280, -200, -120, -40, 40, 120, 200, 280];

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export function createTraffic(scene, colliders, seed = 2) {
  let s = seed * 2654435761 >>> 0;
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const cars = [];
  const palette = [0xc0c0c0, 0x808080, 0x8a2be2, 0x20b2aa, 0xff8c00, 0x4682b4];
  for (let i = 0; i < 18; i++) {
    const def = pick(CARS, rng);
    const mesh = makeCarMesh(def, Math.floor(rng() * 8));
    mesh.traverse((o) => {
      if (o.isMesh) o.castShadow = false;
    });
    // Cat ulang bodi dengan warna lalu lintas acak.
    mesh.userData.bodyMat.color.setHex(pick(palette, rng));
    scene.add(mesh);
    const horizontal = rng() < 0.5;
    const street = pick(STREETS, rng);
    const along = -300 + rng() * 600;
    const lane = (rng() < 0.5 ? 3.5 : -3.5);
    const car = {
      mesh,
      horizontal,
      street,
      along,
      lane,
      speed: 7 + rng() * 6,
      dir: rng() < 0.5 ? 1 : -1,
      pause: 0,
    };
    cars.push(car);
  }

  const peds = [];
  const pedColors = [0xe84a5f, 0x2ec4b6, 0xffbf69, 0x7b5ea7, 0x4a6b8a, 0xd8d8d8];
  for (let i = 0; i < 30; i++) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: pick(pedColors, rng) });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.35), mat);
    body.position.y = 1.1;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8b98a }));
    head.position.y = 1.85;
    g.add(head);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    legs.position.y = 0.35;
    g.add(legs);
    scene.add(g);
    peds.push({
      mesh: g,
      x: (rng() - 0.5) * 560,
      z: (rng() - 0.5) * 560,
      heading: rng() * Math.PI * 2,
      speed: 1 + rng() * 1.2,
      turnIn: 2 + rng() * 4,
    });
  }

  function update(dt, playerPos) {
    for (const c of cars) {
      if (c.pause > 0) {
        c.pause -= dt;
      } else {
        c.along += c.speed * c.dir * dt;
        if (c.along > 310) c.along = -310;
        if (c.along < -310) c.along = 310;
        // Berhenti sejenak di persimpangan secara acak.
        if (Math.abs(c.along % 80) < 2 && rng() < 0.004) c.pause = 1 + rng() * 2;
      }
      const x = c.horizontal ? c.along : c.street + c.lane;
      const z = c.horizontal ? c.street + c.lane : c.along;
      c.mesh.position.set(x, 0, z);
      c.mesh.rotation.y = c.horizontal ? (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : c.dir > 0 ? 0 : Math.PI;
    }
    for (const p of peds) {
      p.turnIn -= dt;
      if (p.turnIn <= 0) {
        p.heading += (rng() - 0.5) * 1.6;
        p.turnIn = 2 + rng() * 4;
      }
      p.x += Math.sin(p.heading) * p.speed * dt;
      p.z += Math.cos(p.heading) * p.speed * dt;
      if (p.x < -300 || p.x > 330 || p.z < -300 || p.z > 335) p.heading += Math.PI;
      p.x = Math.max(-305, Math.min(340, p.x));
      p.z = Math.max(-305, Math.min(340, p.z));
      p.mesh.position.set(p.x, 0, p.z);
      p.mesh.rotation.y = p.heading;
    }
  }

  // Mobil AI terdekat dari sebuah titik (untuk curi mobil / tabrakan).
  function nearestCar(x, z, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const c of cars) {
      const d = Math.hypot(c.mesh.position.x - x, c.mesh.position.z - z);
      if (d < bestD) {
        best = c;
        bestD = d;
      }
    }
    return best;
  }

  function nearestPed(x, z, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const p of peds) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  return { cars, peds, update, nearestCar, nearestPed, scatterPeds };

  // Pindahkan pejalan kaki di sekitar (x,z) ke pantai (untuk staging).
  function scatterPeds(x, z, r) {
    for (const p of peds) {
      if (Math.hypot(p.x - x, p.z - z) < r) {
        p.x = -280 + Math.random() * 560;
        p.z = 318 + Math.random() * 12;
      }
    }
  }
}
