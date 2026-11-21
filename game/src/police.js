// police.js — Polisi & Wanted ★1-5 Kota Cakrawala.
// Eskalasi: ★1 satu mobil kejar; ★2 dua mobil; ★3 + roadblock;
// ★4 + helikopter (orbit rendah, sorot, BESAR); ★5 empat mobil +
// helikopter + roadblock sering + mobil polisi lebih cepat.
// Heat naik karena onar, turun perlahan saat pemain tenang.

import * as THREE from 'three';

function makePoliceCarMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.72, 4.4),
    new THREE.MeshLambertMaterial({ color: 0xf0f0f0 })
  );
  body.position.y = 0.62;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.6, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x1a2a3a })
  );
  cabin.position.set(0, 1.26, -0.2);
  g.add(cabin);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.02, 0.24, 4.42),
    new THREE.MeshLambertMaterial({ color: 0x1a3a8a })
  );
  stripe.position.y = 0.62;
  g.add(stripe);
  const barRed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  barRed.position.set(-0.45, 1.66, -0.2);
  g.add(barRed);
  const barBlue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), new THREE.MeshBasicMaterial({ color: 0x2266ff }));
  barBlue.position.set(0.45, 1.66, -0.2);
  g.add(barBlue);
  g.userData.barRed = barRed;
  g.userData.barBlue = barBlue;
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  for (const [x, z] of [[-0.95, 1.5], [0.95, 1.5], [-0.95, -1.5], [0.95, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.42, z);
    g.add(w);
  }
  return g;
}

function makeHeliMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.6, 5.2),
    new THREE.MeshLambertMaterial({ color: 0x2244aa })
  );
  body.castShadow = true;
  g.add(body);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.0, 1.6),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ff })
  );
  glass.position.set(0, 0.2, 2.0);
  g.add(glass);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 0.7), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  rotor.position.y = 1.15;
  g.add(rotor);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 4.4), new THREE.MeshLambertMaterial({ color: 0x2244aa }));
  tail.position.set(0, 0.3, -4.2);
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.2), new THREE.MeshLambertMaterial({ color: 0x2244aa }));
  fin.position.set(0, 0.9, -6.0);
  g.add(fin);
  // Sorot: kerucut cahaya tembus pandang ke bawah.
  const coneGeo = new THREE.ConeGeometry(7, 26, 16, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff6c8,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = -13;
  cone.rotation.x = Math.PI;
  g.add(cone);
  g.userData.rotor = rotor;
  g.userData.cone = cone;
  return g;
}

function makeRoadblockMesh() {
  const g = new THREE.Group();
  for (let i = -1; i <= 1; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.9, 0.5),
      new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0xff5522 : 0xffffff })
    );
    bar.position.set(i * 2.4, 0.9, 0);
    bar.castShadow = true;
    g.add(bar);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    leg.position.set(i * 2.4, 0.25, 0);
    g.add(leg);
  }
  return g;
}

export function createPolice(scene, audio) {
  const cars = [];
  const roadblocks = [];
  const heli = makeHeliMesh();
  heli.visible = false;
  scene.add(heli);
  let wanted = 0;
  let heat = 0;
  let heliLocked = false;
  let heliScale = 1;
  let carsLocked = false;
  let flashT = 0;
  let roadblockT = 0;
  let chaseT = 0;
  let lastTX = null;
  let lastTZ = null;
  let targetHeading = 0;

  const state = {
    get wanted() {
      return wanted;
    },
    get heat() {
      return heat;
    },
  };

  function wantedFromHeat() {
    if (heat < 12) return 0;
    if (heat < 30) return 1;
    if (heat < 50) return 2;
    if (heat < 66) return 3;
    if (heat < 86) return 4;
    return 5;
  }

  function ensureCars(n, targetPos) {
    while (cars.length < n) {
      const mesh = makePoliceCarMesh();
      scene.add(mesh);
      const a = Math.random() * Math.PI * 2;
      cars.push({
        mesh,
        pos: new THREE.Vector3(targetPos.x + Math.sin(a) * 45, 0, targetPos.z + Math.cos(a) * 45),
        heading: 0,
        speed: 0,
      });
    }
    while (cars.length > n) {
      const c = cars.pop();
      scene.remove(c.mesh);
    }
  }

  function ensureRoadblock(n, targetPos, targetHeading) {
    while (roadblocks.length < n) {
      const mesh = makeRoadblockMesh();
      scene.add(mesh);
      const ahead = 26;
      const x = targetPos.x + Math.sin(targetHeading) * ahead;
      const z = targetPos.z + Math.cos(targetHeading) * ahead;
      // Pagar melintang jalan: sumbu panjangnya tegak lurus arah gerak.
      roadblocks.push({ mesh, pos: new THREE.Vector3(x, 0, z), heading: targetHeading + Math.PI });
    }
    while (roadblocks.length > n) {
      const r = roadblocks.pop();
      scene.remove(r.mesh);
    }
  }

  return {
    cars,
    heli,
    roadblocks,
    state,
    get wanted() {
      return wanted;
    },
    setWanted(n) {
      wanted = Math.max(0, Math.min(5, n));
      heat = [0, 15, 32, 52, 72, 90][wanted];
    },
    addHeat(n, districtRepLow = false) {
      heat = Math.min(100, heat + n * (districtRepLow ? 2 : 1));
      wanted = wantedFromHeat();
    },
    lockHeli(v) {
      heliLocked = v;
    },
    // Taruh roadblock di koordinat yang diminta (untuk staging shot).
    placeRoadblock(x, z, heading) {
      const mesh = makeRoadblockMesh();
      scene.add(mesh);
      roadblocks.push({ mesh, pos: new THREE.Vector3(x, 0, z), heading });
    },
    // Taruh mobil kejar di posisi yang diminta & kunci supaya tidak
    // mengejar lagi (untuk staging shot — formasi rapi, tidak bertumpuk).
    placeCarsForShot(list) {
      list.forEach((p, i) => {
        const c = cars[i];
        if (!c) return;
        c.pos.set(p.x, 0, p.z);
        c.heading = p.heading;
        c.speed = 0;
        c.mesh.position.copy(c.pos);
        c.mesh.rotation.y = p.heading;
      });
      carsLocked = true;
    },
    lockCars(v) {
      carsLocked = v;
    },
    placeHeliForShot(x, y, z, lookAt, scale = 1) {
      heli.visible = true;
      heli.position.set(x, y, z);
      heli.lookAt(lookAt.x, lookAt.y, lookAt.z);
      heli.scale.setScalar(scale);
      heliScale = scale;
      heliLocked = true;
    },
    resetHeliScale() {
      heli.scale.setScalar(1);
      heliScale = 1;
      heliLocked = false;
    },
    update(dt, targetPos, targetSpeed, onRam) {
      // Arah gerak target (untuk menaruh roadblock di depannya).
      if (lastTX !== null) {
        const mdx = targetPos.x - lastTX;
        const mdz = targetPos.z - lastTZ;
        if (Math.hypot(mdx, mdz) > 0.4) targetHeading = Math.atan2(mdx, mdz);
      }
      lastTX = targetPos.x;
      lastTZ = targetPos.z;
      // Heat turun perlahan saat tenang; makin lambat di Wanted tinggi.
      if (wanted > 0) {
        const decay = wanted >= 5 ? 0.35 : wanted >= 3 ? 0.6 : 1.6;
        heat = Math.max(0, heat - decay * dt);
        const w2 = wantedFromHeat();
        if (w2 !== wanted) wanted = w2;
      }
      const wantCars = wanted === 0 ? 0 : wanted === 1 ? 1 : wanted === 2 ? 2 : wanted === 5 ? 4 : 3;
      ensureCars(wantCars, targetPos);
      const wantBlocks = wanted >= 3 ? (wanted >= 5 ? 2 : 1) : 0;
      roadblockT -= dt;
      if (wantBlocks > 0 && roadblockT <= 0) {
        ensureRoadblock(wantBlocks, targetPos, targetHeading);
        roadblockT = wanted >= 5 ? 6 : 11;
      } else if (wantBlocks === 0) {
        ensureRoadblock(0, targetPos, 0);
      }
      const heliWant = wanted >= 4;
      if (heliWant && !heli.visible) heli.visible = true;
      if (!heliWant && !heliLocked) heli.visible = false;

      flashT += dt;
      const flash = Math.sin(flashT * 14) > 0;
      for (const c of cars) {
        c.mesh.userData.barRed.material.color.setHex(flash ? 0xff2222 : 0x551111);
        c.mesh.userData.barBlue.material.color.setHex(flash ? 0x1133aa : 0x2266ff);
        if (carsLocked) continue; // staging shot: formasi tetap, lampu tetap berkedip
        const dx = targetPos.x - c.pos.x;
        const dz = targetPos.z - c.pos.z;
        const dist = Math.hypot(dx, dz) || 1;
        const wantHeading = Math.atan2(dx, dz);
        let dh = wantHeading - c.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        c.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
        const top = wanted >= 5 ? 30 : 24;
        const targetSpeedMs = dist > 60 ? top : Math.max(10, targetSpeed + 4);
        c.speed += (targetSpeedMs - c.speed) * Math.min(1, dt * 1.4);
        c.pos.x += Math.sin(c.heading) * c.speed * dt;
        c.pos.z += Math.cos(c.heading) * c.speed * dt;
        c.mesh.position.copy(c.pos);
        c.mesh.rotation.y = c.heading;
        if (dist < 3.2) {
          chaseT -= dt;
          if (chaseT <= 0) {
            chaseT = 0.8;
            if (onRam) onRam(Math.abs(c.speed));
          }
          c.speed *= 0.4;
          c.pos.x -= Math.sin(c.heading) * 1.5;
          c.pos.z -= Math.cos(c.heading) * 1.5;
        }
      }
      for (const r of roadblocks) {
        r.mesh.position.copy(r.pos);
        r.mesh.rotation.y = r.heading;
      }
      if (heli.visible) {
        heli.userData.rotor.rotation.y += dt * 22;
        if (!heliLocked) {
          const t = performance.now() / 1000;
          const hx = targetPos.x + Math.sin(t * 0.5) * 26;
          const hz = targetPos.z + Math.cos(t * 0.5) * 26;
          heli.position.set(hx, 26, hz);
          heli.lookAt(targetPos.x, 0, targetPos.z);
          heli.scale.setScalar(1);
        }
        if (audio && wanted >= 4) audio.siren(true);
        else if (audio) audio.siren(false);
      } else if (audio) {
        audio.siren(false);
      }
    },
  };
}
