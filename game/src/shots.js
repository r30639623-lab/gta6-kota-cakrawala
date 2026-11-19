// shots.js — screenshot staging. Reads location.search (?shot=cover|drive|
// mission|menu&seed=1), arranges the camera, time of day, wanted level and
// mission for that shot, then sets window.__shotReady = true.
import * as THREE from 'three';

export function applyShot(W) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot') || 'cover';

  function ready() {
    setTimeout(() => { window.__shotReady = true; }, 900);
  }

  if (shot === 'menu') {
    W.setMode('menu');
    W.setTimeOfDay('day');
    ready();
    return;
  }

  W.setMode('play');
  W.hud.renderTracker(null);

  if (shot === 'cover') {
    // Sunset police chase: wanted 4 stars, helicopter BIG in frame,
    // roadblock ahead, mission 1 active, full HUD.
    W.setTimeOfDay('sunset');
    W.missions.startById('m1');
    W.police.setWanted(4);
    W.car.mesh.position.set(-33, 0, 60);
    W.car.heading = 0;
    W.car.mesh.rotation.y = 0;
    W.car.speed = 6;
    W.driving = true;
    W.player.mesh.position.set(-33, 0, 60);
    // Heli large and close, hovering over the road ahead so no building
    // can hide it, searchlight visible.
    W.police.lockHeli(true);
    W.police.placeHeliForShot(-33, 17, 88, new THREE.Vector3(-33, 4, 40), 2.1);
    // Roadblock right ahead of the car.
    W.police.state.roadblockTimer = 999;
    W.police.roadblocks.position.set(-33, 0, 80);
    W.police.roadblocks.rotation.y = 0.1;
    // Two pursuit cars flanking.
    if (W.police.cars[0]) {
      W.police.cars[0].pos.set(-38, 0, 74);
      W.police.cars[0].heading = 0;
      W.police.cars[0].mesh.rotation.y = 0;
    }
    if (W.police.cars[1]) {
      W.police.cars[1].pos.set(-28, 0, 46);
      W.police.cars[1].heading = Math.PI;
      W.police.cars[1].mesh.rotation.y = Math.PI;
    }
    W.lockCamera(new THREE.Vector3(-33, 6, 40), new THREE.Vector3(-34, 5, 92));
    W.hud.showBanner('MISI: Antar Paket Bu Sari — ke Pasar Cakrawala!', 30);
    ready();
    return;
  }

  if (shot === 'drive') {
    // Busy daytime street, chase framing.
    W.setTimeOfDay('day');
    W.car.mesh.position.set(-33, 0, 120);
    W.car.heading = 0;
    W.car.mesh.rotation.y = 0;
    W.car.speed = 0;
    W.driving = true;
    W.player.mesh.position.set(-33, 0, 120);
    // Fill the road with traffic so the street reads as busy.
    const lanes = [
      { x: -35.8, z: 142, dir: 1 }, { x: -35.8, z: 168, dir: 1 }, { x: -35.8, z: 194, dir: 1 },
      { x: -30.2, z: 150, dir: -1 }, { x: -30.2, z: 182, dir: -1 },
    ];
    lanes.forEach((L, i) => {
      const c = W.traffic.cars[i];
      if (!c) return;
      c.axis = 'z';
      c.lane = -33;
      c.dir = L.dir;
      c.heading = L.dir > 0 ? 0 : Math.PI;
      c.pos.set(L.x, 0, L.z);
      c.mesh.rotation.y = c.heading;
    });
    for (let i = 0; i < 3; i++) {
      const p = W.traffic.peds[i];
      if (!p) continue;
      p.pos.set(-40 + i * 2, 0, 132 + i * 9);
      p.heading = 0;
    }
    W.lockCamera(new THREE.Vector3(-33, 5.5, 102), new THREE.Vector3(-33, 2, 150));
    W.hud.showBanner('KOTA CAKRAWALA — jelajahi kota, curi mobil, kejar misi!', 30);
    ready();
    return;
  }

  if (shot === 'mission') {
    // Raka on foot on the beach, mission 7 beacon glowing right behind him,
    // sea and palms in the background.
    W.setTimeOfDay('day');
    W.missions.startById('m7');
    W.driving = false;
    W.player.spawn(new THREE.Vector3(12, 0, 300), Math.PI * 0.95);
    W.car.mesh.position.set(-2, 0, 296);
    W.car.heading = Math.PI / 2;
    W.car.mesh.rotation.y = Math.PI / 2;
    W.lockCamera(new THREE.Vector3(-14, 5, 282), new THREE.Vector3(8, 3, 316));
    W.hud.showBanner('MISI: Penyelamatan di Pantai — capai beacon kuning!', 30);
    ready();
    return;
  }

  ready();
}
