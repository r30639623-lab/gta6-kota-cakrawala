// police.js — Wanted ★1–5, mobil patroli kejar, roadblock, helikopter.
// ★1: 1 mobil kejar • ★2: 2 • ★3: + roadblock • ★4: + helikopter
// ★5: 4 mobil + heli + roadblock lebih sering + polisi lebih cepat (~30 m/s).
import * as THREE from 'three';
import { makeCarMesh } from './vehicles.js';

export function createPolice(scene, audio) {
  const policeDef = { id: 'polisi', name: 'Patroli', kind: 'Sedan', color: 0xffffff, topSpeed: 30, price: 0 };
  const cars = [];
  for (let i = 0; i < 4; i++) {
    const { group } = makeCarMesh(policeDef, 0xf2f2f2, { police: true });
    group.visible = false;
    scene.add(group);
    cars.push({
      mesh: group,
      pos: new THREE.Vector3(0, 0, 0),
      heading: 0,
      speed: 0,
      active: false,
      ramCooldown: 0,
    });
  }

  // Helikopter polisi — BESAR (bodi ~9 m + rotor 11 m) supaya jelas di cover.
  const heli = new THREE.Group();
  const heliBodyMat = new THREE.MeshStandardMaterial({ color: 0xe8ecf2, metalness: 0.4, roughness: 0.4 });
  const heliBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 8.5), heliBodyMat);
  heli.add(heliBody);
  const heliStripe = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.7, 8.6),
    new THREE.MeshStandardMaterial({ color: 0x2266ff, emissive: 0x1144cc, emissiveIntensity: 0.5 }));
  heliStripe.position.y = -0.4;
  heli.add(heliStripe);
  const heliGlass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.7, roughness: 0.15 }));
  heliGlass.position.set(0, 0.4, -3.2);
  heli.add(heliGlass);
  const heliTail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 6.5), heliBodyMat);
  heliTail.position.set(0, 0.6, 7);
  heli.add(heliTail);
  const heliFin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 1.6), heliBodyMat);
  heliFin.position.set(0, 1.8, 9.8);
  heli.add(heliFin);
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const rotor = new THREE.Group();
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.18, 0.7), rotorMat);
  rotor.add(blade1);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 11), rotorMat);
  rotor.add(blade2);
  rotor.position.y = 1.8;
  heli.add(rotor);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 0.5), rotorMat);
  tailRotor.position.set(0.8, 1.8, 9.8);
  heli.add(tailRotor);
  const spotMat = new THREE.MeshStandardMaterial({ color: 0xfff6c9, emissive: 0xffe9a0, emissiveIntensity: 2.2 });
  const spot = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), spotMat);
  spot.position.set(0, -1.5, -2.5);
  heli.add(spot);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(4.5, 26, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.set(0, -14.5, -2.5);
  beam.rotation.x = Math.PI;
  heli.add(beam);
  const skids = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222 }));
  skids.position.y = -1.8;
  heli.add(skids);
  heli.visible = false;
  heli.scale.setScalar(1.6);
  scene.add(heli);

  // Roadblock: 2 mobil polisi + barikade oranye.
  const roadblocks = [];
  for (let i = 0; i < 2; i++) {
    const rb = new THREE.Group();
    const { group: pc } = makeCarMesh(policeDef, 0xf2f2f2, { police: true });
    pc.position.set(-4, 0, 0);
    rb.add(pc);
    const { group: pc2 } = makeCarMesh(policeDef, 0xf2f2f2, { police: true });
    pc2.position.set(4, 0, 0);
    pc2.rotation.y = Math.PI;
    rb.add(pc2);
    for (const bx of [-8, 0, 8]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xff7f2a, emissive: 0xcc5500, emissiveIntensity: 0.5 }));
      bar.position.set(bx, 0.55, 3);
      rb.add(bar);
    }
    rb.visible = false;
    scene.add(rb);
    roadblocks.push({ group: rb, active: false, timer: 0 });
  }

  let wanted = 0;
  let heat = 0;
  let heliLocked = false;
  let heliScaleBase = 1.6;
  let roadblockTimer = 0;
  let decayTimer = 0;

  function setWanted(n) {
    wanted = Math.max(0, Math.min(5, Math.round(n)));
    heat = wanted;
    if (audio) audio.siren(wanted > 0);
  }

  function addHeat(n, multiplier = 1) {
    if (wanted >= 5) return;
    heat += n * (multiplier || 1);
    const nw = Math.min(5, Math.floor(heat));
    if (nw !== wanted) {
      wanted = nw;
      if (audio) audio.siren(wanted > 0);
    }
  }

  return {
    cars,
    heli,
    roadblocks,
    get wanted() { return wanted; },
    get state() { return { wanted, heat }; },
    setWanted,
    addHeat,
    lockHeli(v) { heliLocked = !!v; },
    placeHeliForShot(x, y, z, lookAt, scale) {
      heliLocked = true;
      heli.visible = true;
      heli.position.set(x, y, z);
      if (scale) { heli.scale.setScalar(scale); heliScaleBase = scale; }
      if (lookAt) heli.lookAt(lookAt.x, lookAt.y, lookAt.z);
    },
    resetHeliScale() { heli.scale.setScalar(1.6); heliScaleBase = 1.6; },
    reset() {
      wanted = 0;
      heat = 0;
      for (const c of cars) { c.active = false; c.mesh.visible = false; }
      heli.visible = false;
      heliLocked = false;
      for (const rb of roadblocks) { rb.active = false; rb.group.visible = false; }
      if (audio) audio.siren(false);
    },
    update(dt, targetPos, targetSpeed, onRam) {
      // Decay: makin tinggi wanted, makin lambat turun.
      decayTimer += dt;
      if (decayTimer > 1 && wanted > 0) {
        decayTimer = 0;
        const rate = wanted === 5 ? 0.04 : wanted === 4 ? 0.07 : wanted === 3 ? 0.12 : wanted === 2 ? 0.2 : 0.3;
        heat -= rate;
        if (heat < wanted - 0.99 && heat < wanted) {
          const nw = Math.max(0, Math.floor(heat));
          if (nw < wanted) { wanted = nw; if (audio) audio.siren(wanted > 0); }
        }
        if (heat <= 0) { heat = 0; wanted = 0; if (audio) audio.siren(false); }
      }

      const chaseCount = wanted === 0 ? 0 : wanted >= 5 ? 4 : wanted >= 2 ? 2 : 1;
      const policeTop = wanted >= 5 ? 30 : wanted >= 4 ? 27 : wanted >= 3 ? 24 : 21;
      for (let i = 0; i < cars.length; i++) {
        const c = cars[i];
        if (i < chaseCount) {
          if (!c.active) {
            c.active = true;
            const ang = (i / 4) * Math.PI * 2 + 0.5;
            c.pos.set(targetPos.x + Math.sin(ang) * 55, 0, targetPos.z + Math.cos(ang) * 55);
            c.speed = 10;
          }
          c.mesh.visible = true;
          const dx = targetPos.x - c.pos.x;
          const dz = targetPos.z - c.pos.z;
          const dist = Math.hypot(dx, dz) || 1;
          const wantHeading = Math.atan2(dx, dz);
          let dh = wantHeading - c.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          c.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
          const desired = Math.min(policeTop, 12 + dist * 0.35);
          c.speed += (desired - c.speed) * Math.min(1, dt * 1.2);
          c.pos.x += Math.sin(c.heading) * c.speed * dt;
          c.pos.z += Math.cos(c.heading) * c.speed * dt;
          c.mesh.position.copy(c.pos);
          c.mesh.rotation.y = c.heading;
          c.ramCooldown -= dt;
          if (dist < 3.4 && c.ramCooldown <= 0) {
            c.ramCooldown = 1.2;
            c.speed *= 0.5;
            if (onRam) onRam(c);
          }
        } else if (c.active) {
          c.active = false;
          c.mesh.visible = false;
        }
      }

      // Helikopter di ★4–5 (atau saat dikunci untuk foto).
      const heliWanted = wanted >= 4;
      if (heliWanted && !heliLocked) {
        heli.visible = true;
        const t = performance.now() * 0.00012;
        const hx = targetPos.x + Math.sin(t) * 20;
        const hz = targetPos.z + Math.cos(t) * 20;
        heli.position.set(hx, 24 + Math.sin(t * 2.3) * 1.5, hz);
        heli.lookAt(targetPos.x, 0, targetPos.z);
      } else if (!heliLocked) {
        heli.visible = false;
      }
      if (heli.visible) {
        rotor.rotation.y += dt * 14;
        tailRotor.rotation.x += dt * 20;
      }

      // Roadblock di ★3–5, muncul berkala di depan pemain.
      roadblockTimer -= dt;
      const wantRb = wanted >= 3;
      if (wantRb && roadblockTimer <= 0) {
        roadblockTimer = wanted >= 5 ? 9 : 14;
        const rb = roadblocks.find((r) => !r.active) || roadblocks[0];
        const fx = Math.sin(0); // arah hadap pemain: letakkan 45 m di depan arah gerak
        const aheadX = targetPos.x + (targetSpeed > 1 ? Math.sin(0) * 0 : 0);
        rb.group.position.set(targetPos.x + 30, 0, targetPos.z - 40);
        rb.group.visible = true;
        rb.active = true;
        rb.timer = 10;
      }
      for (const rb of roadblocks) {
        if (!rb.active) continue;
        rb.timer -= dt;
        if (rb.timer <= 0) { rb.active = false; rb.group.visible = false; }
      }
    },
  };
}
