// missions.js — 12 misi Bu Sari dalam 3 babak (total hadiah $6.850).
// Tiap misi: target landmark + timer + reward + efek Wanted. Beacon
// kuning (pilar + cincin) menandai target di dunia & minimap.

import * as THREE from 'three';

export const MISSIONS = [
  { id: 'm1', act: 1, name: 'Antar Paket Bu Sari', reward: 150, time: 150, target: 'pasar', wanted: 0, night: false },
  { id: 'm2', act: 1, name: 'Kabur Paket Panas', reward: 250, time: 180, target: 'menara', wanted: 2, night: false },
  { id: 'm3', act: 1, name: 'Balapan Pulang', reward: 400, time: 120, target: 'bengkel', wanted: 0, night: false },
  { id: 'm4', act: 1, name: 'Kejar-Kejaran Tengah Malam', reward: 500, time: 200, target: 'dermaga', wanted: 3, night: true },
  { id: 'm5', act: 2, name: 'Antar Pasar Pagi Bu Sari', reward: 350, time: 150, target: 'pasar', wanted: 0, night: false },
  { id: 'm6', act: 2, name: 'Balapan Menara', reward: 600, time: 130, target: 'menara', wanted: 0, night: false },
  { id: 'm7', act: 2, name: 'Penyelamatan di Pantai', reward: 550, time: 170, target: 'pantai', wanted: 0, night: false },
  { id: 'm8', act: 2, name: 'Utang Setengah Lunas', reward: 750, time: 220, target: 'dermaga', wanted: 3, night: false },
  { id: 'm9', act: 3, name: 'Kurir Fajar', reward: 650, time: 160, target: 'pasar', wanted: 0, night: false },
  { id: 'm10', act: 3, name: 'Balapan Terakhir Menara', reward: 800, time: 140, target: 'menara', wanted: 0, night: false },
  { id: 'm11', act: 3, name: 'Penyelamatan Dermaga', reward: 700, time: 180, target: 'dermaga', wanted: 4, night: false },
  { id: 'm12', act: 3, name: 'Final: Legenda Cakrawala', reward: 1200, time: 260, target: 'bengkel', wanted: 0, night: false },
];

export const ACT_NAMES = {
  1: 'Babak 1 — Awal di Cakrawala',
  2: 'Babak 2 — Utang & Jalanan',
  3: 'Babak 3 — Legenda Cakrawala',
};

export function createMissions(scene, landmarks, save, audio, onEvent) {
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xffd23f,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 90, 18, 1, true), beaconMat);
  beacon.visible = false;
  scene.add(beacon);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5, 0.35, 8, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  let active = null;
  let timer = 0;
  let nextIndex = save.missionsDone.length;
  let beaconT = 0;

  function defs() {
    return MISSIONS;
  }
  function targetPosition() {
    if (!active) return null;
    const lm = landmarks[active.def.target];
    return lm ? { x: lm.x, z: lm.z } : null;
  }
  function actOf(id) {
    return MISSIONS.find((m) => m.id === id)?.act ?? 1;
  }
  function currentAct() {
    if (nextIndex >= 12) return 3;
    return MISSIONS[nextIndex].act;
  }

  function startById(id) {
    const def = MISSIONS.find((m) => m.id === id);
    if (!def) return false;
    if (save.missionsDone.includes(id)) return false;
    active = { def };
    timer = def.time;
    const tp = targetPosition();
    if (tp) {
      beacon.position.set(tp.x, 45, tp.z);
      beacon.visible = true;
      ring.position.set(tp.x, 0.4, tp.z);
      ring.visible = true;
    }
    if (def.wanted > 0 && onEvent) onEvent({ type: 'wanted', wanted: def.wanted });
    if (def.night && onEvent) onEvent({ type: 'night' });
    if (onEvent) onEvent({ type: 'start', def });
    return true;
  }

  function startNext() {
    if (nextIndex >= MISSIONS.length) return false;
    return startById(MISSIONS[nextIndex].id);
  }

  function clearBeacon() {
    beacon.visible = false;
    ring.visible = false;
  }

  function update(dt, playerPos) {
    beaconT += dt;
    if (beacon.visible) {
      beacon.rotation.y += dt * 0.6;
      beacon.material.opacity = 0.2 + Math.sin(beaconT * 3) * 0.08;
      ring.scale.setScalar(1 + Math.sin(beaconT * 2.5) * 0.12);
    }
    if (!active) return;
    timer -= dt;
    const tp = targetPosition();
    if (tp && Math.hypot(playerPos.x - tp.x, playerPos.z - tp.z) < 9) {
      const def = active.def;
      active = null;
      clearBeacon();
      if (!save.missionsDone.includes(def.id)) save.missionsDone.push(def.id);
      nextIndex = save.missionsDone.length;
      if (onEvent) onEvent({ type: 'complete', def });
      const newAct = currentAct();
      if (def.id === 'm4' && onEvent) onEvent({ type: 'act', act: 2 });
      if (def.id === 'm8' && onEvent) onEvent({ type: 'act', act: 3 });
      if (def.id === 'm12' && onEvent) onEvent({ type: 'legend' });
      void newAct;
      return;
    }
    if (timer <= 0) {
      const def = active.def;
      active = null;
      clearBeacon();
      if (audio) audio.fail();
      if (onEvent) onEvent({ type: 'fail', def });
    }
  }

  return {
    defs,
    get active() {
      return active;
    },
    get timer() {
      return Math.max(0, timer);
    },
    get nextIndex() {
      return nextIndex;
    },
    currentAct,
    next: startNext,
    startNext,
    startById,
    update,
    targetPosition,
    actOf,
  };
}
