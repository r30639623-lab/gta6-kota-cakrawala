// missions.js — 12 misi Bu Sari dalam 3 babak. Total hadiah $6.850
// (+$500 bonus legenda setelah m12).
import * as THREE from 'three';

export const MISSIONS = [
  { id: 'm1', act: 1, name: 'Antar Paket Bu Sari', target: 'pasar', reward: 150, time: 150, wanted: 0 },
  { id: 'm2', act: 1, name: 'Kabur Paket Panas', target: 'menara', reward: 250, time: 180, wanted: 2 },
  { id: 'm3', act: 1, name: 'Balapan Pulang', target: 'bengkel', reward: 400, time: 120, wanted: 0 },
  { id: 'm4', act: 1, name: 'Kejar-Kejaran Tengah Malam', target: 'dermaga', reward: 500, time: 200, wanted: 3, forceNight: true },
  { id: 'm5', act: 2, name: 'Antar Pasar Pagi Bu Sari', target: 'pasar', reward: 350, time: 150, wanted: 0 },
  { id: 'm6', act: 2, name: 'Balapan Menara', target: 'menara', reward: 600, time: 130, wanted: 0 },
  { id: 'm7', act: 2, name: 'Penyelamatan di Pantai', target: 'pantai', reward: 550, time: 170, wanted: 0 },
  { id: 'm8', act: 2, name: 'Utang Setengah Lunas', target: 'dermaga', reward: 750, time: 220, wanted: 3 },
  { id: 'm9', act: 3, name: 'Kurir Fajar', target: 'pasar', reward: 650, time: 160, wanted: 0 },
  { id: 'm10', act: 3, name: 'Balapan Terakhir Menara', target: 'menara', reward: 800, time: 140, wanted: 0 },
  { id: 'm11', act: 3, name: 'Penyelamatan Dermaga', target: 'dermaga', reward: 700, time: 180, wanted: 4 },
  { id: 'm12', act: 3, name: 'Final: Legenda Cakrawala', target: 'bengkel', reward: 1200, time: 260, wanted: 0 },
];

export const ACT_NAMES = {
  1: 'Babak 1 — Awal di Cakrawala',
  2: 'Babak 2 — Utang & Jalanan',
  3: 'Babak 3 — Legenda Cakrawala',
};

export function actOf(id) {
  const def = MISSIONS.find((m) => m.id === id);
  return def ? def.act : 1;
}

export function createMissions(scene, landmarks, save, audio, onEvent) {
  // Beacon: pilar kuning + cincin di target misi aktif.
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffd23d, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 55, 20, 1, true), beaconMat);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23d, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.6, 28), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.25;
  beacon.visible = false;
  ring.visible = false;
  scene.add(beacon);
  scene.add(ring);

  let active = null;
  let timer = 0;

  function currentAct() {
    const done = save.missionsDone.length;
    if (done >= 8) return 3;
    if (done >= 4) return 2;
    return 1;
  }

  function next() {
    for (const m of MISSIONS) {
      if (!save.missionsDone.includes(m.id)) return m;
    }
    return null;
  }

  function targetPosition() {
    if (!active) return null;
    const lm = landmarks[active.def.target];
    return lm ? new THREE.Vector3(lm.x, 0, lm.z) : null;
  }

  function startById(id) {
    const def = MISSIONS.find((m) => m.id === id);
    if (!def) return false;
    if (save.missionsDone.includes(id)) return false;
    const act = currentAct();
    if (def.act > act) return false;
    active = { def };
    timer = def.time;
    const lm = landmarks[def.target];
    if (lm) {
      beacon.position.set(lm.x, 27.5, lm.z);
      ring.position.set(lm.x, 0.25, lm.z);
      beacon.visible = true;
      ring.visible = true;
    }
    if (onEvent) onEvent('start', def);
    return true;
  }

  function startNext() {
    const n = next();
    if (!n) return false;
    return startById(n.id);
  }

  function finish() {
    const def = active.def;
    active = null;
    beacon.visible = false;
    ring.visible = false;
    if (onEvent) onEvent('done', def);
  }

  function fail() {
    const def = active.def;
    active = null;
    beacon.visible = false;
    ring.visible = false;
    if (onEvent) onEvent('fail', def);
  }

  return {
    defs: MISSIONS,
    get active() { return active; },
    get timer() { return timer; },
    next,
    startNext,
    startById,
    currentAct,
    targetPosition,
    actOf,
    update(dt, playerPos, t) {
      if (beacon.visible) {
        beacon.rotation.y = t * 0.8;
        beaconMat.opacity = 0.35 + Math.sin(t * 3) * 0.12;
        const s = 1 + Math.sin(t * 3) * 0.12;
        ring.scale.setScalar(s);
      }
      if (!active) return;
      timer -= dt;
      if (timer <= 0) { timer = 0; fail(); return; }
      const tp = targetPosition();
      if (tp && playerPos) {
        const d = Math.hypot(playerPos.x - tp.x, playerPos.z - tp.z);
        if (d < 7) finish();
      }
    },
  };
}
