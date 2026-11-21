// sidejobs.js — Kota Cakrawala: 3 side job antar + 1 balapan jalanan.
// Job diterima lewat HP (tab Job): antar ke target sebelum timer habis.
// "Piala Pantai Cakrawala": balapan 5 checkpoint keliling pantai &
// pasar, wajib mengemudi, hadiah $500 + rekor waktu tersimpan di save.

import * as THREE from 'three';

export const SIDE_JOBS = [
  { id: 'j1', name: 'Antar Es ke Pasar', desc: 'Es batu buat pedagang Pasar', reward: 120, time: 120, from: 'bengkel', to: 'pasar' },
  { id: 'j2', name: 'Antar Ikan ke Dermaga', desc: 'Ikan segar buat kapal Dermaga', reward: 150, time: 150, from: 'pasar', to: 'dermaga' },
  { id: 'j3', name: 'Antar Surat ke Menara', desc: 'Surat penting ke Menara', reward: 100, time: 100, from: 'pantai', to: 'menara' },
];

export const RACE = {
  id: 'race1',
  name: 'Piala Pantai Cakrawala',
  reward: 500,
  time: 150,
  checkpoints: [
    { x: 120, z: 300, name: 'Pantai Timur' },
    { x: 240, z: 320, name: 'Dermaga' },
    { x: 200, z: 120, name: 'Jalan Pelabuhan' },
    { x: 40, z: 120, name: 'Jalan Pusat' },
    { x: 40, z: 280, name: 'Garis Finis' },
  ],
};

export function createSideJobs(scene, landmarks, save, audio, onEvent) {
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x2ee6ff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 90, 18, 1, true), beaconMat);
  beacon.visible = false;
  scene.add(beacon);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2ee6ff, transparent: true, opacity: 0.85 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5, 0.35, 8, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  let active = null; // { kind: 'job'|'race', def, timer, cpIndex, elapsed }
  let beaconT = 0;

  function targetPosition() {
    if (!active) return null;
    if (active.kind === 'job') {
      const lm = landmarks[active.def.to];
      return lm ? { x: lm.x, z: lm.z } : null;
    }
    const cp = RACE.checkpoints[active.cpIndex];
    return cp ? { x: cp.x, z: cp.z } : null;
  }

  function placeBeacon() {
    const tp = targetPosition();
    if (!tp) {
      beacon.visible = false;
      ring.visible = false;
      return;
    }
    beacon.position.set(tp.x, 45, tp.z);
    beacon.visible = true;
    ring.position.set(tp.x, 0.4, tp.z);
    ring.visible = true;
  }

  function startJob(id) {
    if (active) return false;
    const def = SIDE_JOBS.find((j) => j.id === id);
    if (!def) return false;
    if (save.sideJobsDone.includes(id)) return false;
    active = { kind: 'job', def, timer: def.time, cpIndex: 0, elapsed: 0 };
    placeBeacon();
    if (onEvent) onEvent({ type: 'jobStart', def });
    return true;
  }

  function startRace() {
    if (active) return false;
    active = { kind: 'race', def: RACE, timer: RACE.time, cpIndex: 0, elapsed: 0 };
    placeBeacon();
    if (onEvent) onEvent({ type: 'raceStart', def: RACE });
    return true;
  }

  function finish(ok, reason) {
    const a = active;
    active = null;
    beacon.visible = false;
    ring.visible = false;
    if (!a) return;
    if (a.kind === 'job') {
      if (ok) {
        if (!save.sideJobsDone.includes(a.def.id)) save.sideJobsDone.push(a.def.id);
        if (onEvent) onEvent({ type: 'jobComplete', def: a.def });
      } else if (onEvent) onEvent({ type: 'jobFail', def: a.def, reason });
    } else {
      if (ok) {
        const t = a.elapsed;
        const best = save.raceBest === null || t < save.raceBest;
        if (best) save.raceBest = t;
        if (onEvent) onEvent({ type: 'raceComplete', def: RACE, time: t, best });
      } else if (onEvent) onEvent({ type: 'raceFail', def: RACE, reason });
    }
  }

  function update(dt, playerPos, driving, paused = false) {
    beaconT += dt;
    if (beacon.visible) {
      beacon.rotation.y += dt * 0.6;
      beacon.material.opacity = 0.2 + Math.sin(beaconT * 3) * 0.08;
      ring.scale.setScalar(1 + Math.sin(beaconT * 2.5) * 0.12);
    }
    if (!active) return;
    // Dialog terbuka: timer dijeda, tapi sampai di target tetap dihitung.
    if (!paused) {
      active.timer -= dt;
      active.elapsed += dt;
    }
    const tp = targetPosition();
    if (!tp) return;
    if (active.kind === 'race' && !driving) {
      // Balapan wajib mengemudi: timer jalan, checkpoint tidak dihitung.
      if (active.timer <= 0) finish(false, 'Waktu habis');
      return;
    }
    if (Math.hypot(playerPos.x - tp.x, playerPos.z - tp.z) < 9) {
      if (active.kind === 'job') {
        finish(true);
      } else {
        active.cpIndex++;
        if (audio) audio.cash();
        if (onEvent) onEvent({ type: 'raceCheckpoint', def: RACE, index: active.cpIndex });
        if (active.cpIndex >= RACE.checkpoints.length) {
          finish(true);
        } else {
          placeBeacon();
        }
      }
      return;
    }
    if (active.timer <= 0) finish(false, 'Waktu habis');
  }

  return {
    get active() {
      return active;
    },
    get timer() {
      return active ? Math.max(0, active.timer) : 0;
    },
    startJob,
    startRace,
    update,
    targetPosition,
  };
}
