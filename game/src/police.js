// police.js — wanted stars, police pursuit cars, roadblocks (wanted 3+)
// and the police helicopter (wanted 4–5, low orbit + searchlight).
import * as THREE from 'three';
import { makeCarMesh } from './vehicles.js';

function policeCarMesh() {
  const g = makeCarMesh(0x1a2a44, 'sport');
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.14, 4.32),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  stripe.position.y = 0.86;
  g.add(stripe);
  const barMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff2222, emissiveIntensity: 1.8 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.3), barMat);
  bar.position.set(0, 1.62, -0.15);
  g.add(bar);
  g.userData.lightBar = bar;
  return g;
}

function buildHelicopter() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.4, metalness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 6.5), bodyMat);
  g.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.15, metalness: 0.6 }));
  nose.scale.set(1, 0.8, 1);
  nose.position.set(0, -0.2, 3.4);
  g.add(nose);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 6), bodyMat);
  tail.position.set(0, 0.4, -6);
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 1.6), bodyMat);
  fin.position.set(0, 1.2, -8.6);
  g.add(fin);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }));
  rotor.position.y = 1.5;
  g.add(rotor);
  const rotor2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 14),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }));
  rotor2.position.y = 1.5;
  g.add(rotor2);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.24, 0.5, 6.54),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25 }));
  stripe.position.y = -0.4;
  g.add(stripe);
  const label = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffcc00, emissiveIntensity: 1.2 }));
  label.position.set(0, 0.3, 3.28);
  g.add(label);
  // Searchlight cone pointing down.
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(7, 26, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
  );
  cone.position.y = -14;
  cone.rotation.x = Math.PI;
  g.add(cone);
  const spot = new THREE.PointLight(0xfff2b0, 2.2, 70);
  spot.position.y = -4;
  g.add(spot);
  g.userData.rotors = [rotor, rotor2];
  return g;
}

export function createPolice(scene, audio) {
  const heli = buildHelicopter();
  heli.visible = false;
  scene.add(heli);
  const cars = [];
  const roadblocks = new THREE.Group();
  roadblocks.visible = false;
  scene.add(roadblocks);
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xd96a1e, roughness: 0.7 });
  const barrierGeo = new THREE.BoxGeometry(4.5, 1.1, 0.5);
  for (let i = -1; i <= 1; i++) {
    const b = new THREE.Mesh(barrierGeo, barrierMat);
    b.position.set(i * 5, 0.55, 0);
    roadblocks.add(b);
  }
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 });
  for (let i = -1; i <= 1; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 0.52), stripeMat);
    s.position.set(i * 5, 0.55, 0);
    roadblocks.add(s);
  }

  const state = {
    wanted: 0,
    heat: 0, // decays toward 0; wanted follows it
    chaseTimer: 0,
    roadblockTimer: 0,
  };
  let heliLocked = false; // when true, staging owns the heli position

  function spawnChaser(x, z) {
    if (cars.length >= 4) return;
    const mesh = policeCarMesh();
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    cars.push({ mesh, pos: mesh.position, heading: 0, speed: 0 });
  }

  return {
    state,
    cars,
    heli,
    roadblocks,
    get wanted() { return state.wanted; },
    setWanted(n) {
      state.wanted = Math.max(0, Math.min(5, Math.round(n)));
      state.heat = state.wanted;
      if (state.wanted >= 1 && cars.length === 0) {
        spawnChaser(40, 40);
        spawnChaser(-60, 120);
      }
      heli.visible = state.wanted >= 4;
      roadblocks.visible = state.wanted >= 3;
    },
    addHeat(n) {
      state.heat = Math.min(5, state.heat + n);
      state.wanted = Math.max(state.wanted, Math.round(state.heat));
      if (state.wanted >= 1 && cars.length === 0) spawnChaser(40, 40);
      heli.visible = state.wanted >= 4;
      roadblocks.visible = state.wanted >= 3;
    },
    update(dt, targetPos, targetSpeed, onRam) {
      // Wanted slowly cools off when the player behaves.
      if (state.wanted > 0) {
        state.heat -= dt * 0.03;
        if (state.heat <= 0) {
          state.heat = 0;
          state.wanted = 0;
          heli.visible = false;
          roadblocks.visible = false;
        } else {
          state.wanted = Math.max(1, Math.round(state.heat));
          heli.visible = state.wanted >= 4;
          roadblocks.visible = state.wanted >= 3;
        }
      }
      // Chase cars steer toward the player and ram.
      for (const c of cars) {
        if (state.wanted === 0) {
          c.speed = Math.max(0, c.speed - 20 * dt);
        } else {
          const dx = targetPos.x - c.pos.x;
          const dz = targetPos.z - c.pos.z;
          const dist = Math.hypot(dx, dz) || 1;
          const wantHeading = Math.atan2(dx, dz);
          let dh = wantHeading - c.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          c.heading += THREE.MathUtils.clamp(dh, -2.2 * dt, 2.2 * dt);
          const maxChase = 16 + state.wanted * 3.2;
          c.speed = Math.min(maxChase, c.speed + 14 * dt);
          if (dist < 3.2) {
            c.speed *= 0.4;
            if (onRam && Math.abs(targetSpeed) > 2) onRam(dist);
          }
        }
        c.pos.x += Math.sin(c.heading) * c.speed * dt;
        c.pos.z += Math.cos(c.heading) * c.speed * dt;
        c.mesh.rotation.y = c.heading;
        const bar = c.mesh.userData.lightBar;
        if (bar) {
          bar.material.emissive.setHex(Math.floor(performance.now() / 260) % 2 === 0 ? 0xff2222 : 0x2244ff);
        }
      }
      // Roadblock sits on the road ahead of the player.
      if (roadblocks.visible) {
        state.roadblockTimer -= dt;
        if (state.roadblockTimer <= 0) {
          state.roadblockTimer = 9;
          roadblocks.position.set(
            THREE.MathUtils.clamp(targetPos.x + 40, -280, 280),
            0,
            THREE.MathUtils.clamp(targetPos.z - 10, -280, 280),
          );
          roadblocks.rotation.y = Math.random() * Math.PI;
        }
      }
      // Helicopter: low orbit, spotlight on the player, rotors spinning.
      // When staging locks it (cover shot), only the rotors spin.
      if (heli.visible) {
        if (!heliLocked) {
          const t = performance.now() * 0.00012;
          const r = 34;
          heli.position.set(
            targetPos.x + Math.cos(t) * r,
            26 + Math.sin(t * 2.3) * 3,
            targetPos.z + Math.sin(t) * r,
          );
          heli.lookAt(targetPos.x, 0, targetPos.z);
        }
        for (const rotor of heli.userData.rotors) rotor.rotation.y += dt * 22;
      }
    },
    // Used by the cover screenshot: park the heli big and close to the camera.
    lockHeli(v) { heliLocked = !!v; },
    placeHeliForShot(x, y, z, lookAt, scale) {
      heli.visible = true;
      heli.scale.setScalar(scale || 1);
      heli.position.set(x, y, z);
      if (lookAt) heli.lookAt(lookAt.x, lookAt.y, lookAt.z);
    },
    resetHeliScale() { heli.scale.setScalar(1); },
  };
}
