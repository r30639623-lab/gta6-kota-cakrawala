// traffic.js — AI traffic (18 cars) and pedestrians (30) wandering the city.
// AI cars cruise along road lanes and wrap around the map edges; walkers
// stroll the sidewalks and turn at intersections.
import * as THREE from 'three';
import { makeCarMesh, PAINTS } from './vehicles.js';

const ROADS = [-270, -210, -150, -90, -30, 30, 90, 150, 210, 270];

function randRange(a, b) { return a + Math.random() * (b - a); }

export function createTraffic(scene) {
  const cars = [];
  for (let i = 0; i < 18; i++) {
    const axis = i % 2 === 0 ? 'x' : 'z';
    const lane = ROADS[Math.floor(Math.random() * ROADS.length)];
    const dir = Math.random() < 0.5 ? 1 : -1;
    const color = PAINTS[Math.floor(Math.random() * PAINTS.length)].color;
    const mesh = makeCarMesh(color, Math.random() < 0.25 ? 'pickup' : 'sport');
    const pos = axis === 'x'
      ? new THREE.Vector3(randRange(-290, 290), 0, lane + (dir > 0 ? 2.8 : -2.8))
      : new THREE.Vector3(lane + (dir > 0 ? -2.8 : 2.8), 0, randRange(-290, 290));
    mesh.position.copy(pos);
    scene.add(mesh);
    cars.push({
      mesh,
      pos: mesh.position,
      axis,
      lane,
      dir,
      speed: randRange(7, 13),
      heading: axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI),
    });
    mesh.rotation.y = cars[cars.length - 1].heading;
  }

  const peds = [];
  const shirtColors = [0xd95f5f, 0x5f8fd9, 0x5fd97a, 0xe8c95f, 0xb05fd9, 0xe8e8e8, 0x333333];
  for (let i = 0; i < 30; i++) {
    const g = new THREE.Group();
    const shirt = new THREE.MeshStandardMaterial({
      color: shirtColors[i % shirtColors.length], roughness: 0.9,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.05, 8), shirt);
    body.position.y = 0.95;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8),
      new THREE.MeshStandardMaterial({ color: [0xe8b98a, 0xc98a5a, 0x8a5a3a][i % 3], roughness: 0.8 }));
    head.position.y = 1.72;
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 1 }));
    legs.position.y = 0.25;
    g.add(body, head, legs);
    const x = randRange(-280, 280);
    const z = randRange(-280, 300);
    g.position.set(x, 0, z);
    scene.add(g);
    peds.push({
      mesh: g,
      pos: g.position,
      heading: randRange(0, Math.PI * 2),
      speed: randRange(0.9, 1.8),
      turnTimer: randRange(2, 7),
      down: false,
      downTimer: 0,
    });
  }

  return {
    cars,
    peds,
    update(dt, playerPos, onPedHit) {
      for (const c of cars) {
        const step = c.speed * c.dir * dt;
        if (c.axis === 'x') {
          c.pos.x += step;
          if (c.pos.x > 295) c.pos.x = -295;
          if (c.pos.x < -295) c.pos.x = 295;
        } else {
          c.pos.z += step;
          if (c.pos.z > 295) c.pos.z = -295;
          if (c.pos.z < -295) c.pos.z = 295;
        }
        c.mesh.rotation.y = c.heading;
        const wheels = c.mesh.userData.wheels || [];
        for (const w of wheels) w.rotation.x += (c.speed * dt) / 0.38;
      }
      for (const p of peds) {
        if (p.down) {
          p.downTimer -= dt;
          if (p.downTimer <= 0) {
            p.down = false;
            p.mesh.rotation.x = 0;
            p.mesh.position.y = 0;
          }
          continue;
        }
        p.turnTimer -= dt;
        if (p.turnTimer <= 0) {
          p.turnTimer = randRange(3, 9);
          p.heading += randRange(-1.2, 1.2);
        }
        p.pos.x += Math.sin(p.heading) * p.speed * dt;
        p.pos.z += Math.cos(p.heading) * p.speed * dt;
        if (p.pos.x > 295) p.pos.x = 295;
        if (p.pos.x < -295) p.pos.x = -295;
        if (p.pos.z > 305) p.pos.z = 305;
        if (p.pos.z < -295) p.pos.z = -295;
        p.mesh.rotation.y = p.heading;
        // Bob while walking.
        p.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.006 + p.heading * 7)) * 0.06;
        // Run over by the player's car?
        if (playerPos && p.pos.distanceTo(playerPos) < 2.2) {
          p.down = true;
          p.downTimer = 6;
          p.mesh.rotation.x = -Math.PI / 2;
          p.mesh.position.y = 0.3;
          if (onPedHit) onPedHit(p);
        }
      }
    },
  };
}
