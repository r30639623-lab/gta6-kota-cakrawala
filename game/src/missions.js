// missions.js — the 8 Bu Sari missions. Each has a target, a timer and a
// reward; total $3,950. A beacon pillar marks the target in the world.
import * as THREE from 'three';

export const MISSIONS = [
  { id: 'm1', name: 'Antar Paket Bu Sari', reward: 150, time: 150, target: 'pasar', desc: 'Antar paket ke Pasar Cakrawala.' },
  { id: 'm2', name: 'Kabur Paket Panas', reward: 250, time: 180, target: 'menara', desc: 'Paket panas! Kabur ke Menara, polisi mengejarmu.' },
  { id: 'm3', name: 'Balapan Pulang', reward: 400, time: 120, target: 'bengkel', desc: 'Balapan pulang ke bengkel Bu Sari.' },
  { id: 'm4', name: 'Kejar-Kejaran Tengah Malam', reward: 500, time: 200, target: 'dermaga', desc: 'Tengah malam, kabur ke dermaga pelabuhan.' },
  { id: 'm5', name: 'Antar Pasar Pagi Bu Sari', reward: 350, time: 150, target: 'pasar', desc: 'Antar belanjaan pagi ke Pasar.' },
  { id: 'm6', name: 'Balapan Menara', reward: 600, time: 130, target: 'menara', desc: 'Balapan cepat ke Menara Cakrawala.' },
  { id: 'm7', name: 'Penyelamatan di Pantai', reward: 550, time: 170, target: 'pantai', desc: 'Selamatkan teman Bu Sari di pantai.' },
  { id: 'm8', name: 'Final: Utang Lunas', reward: 1000, time: 240, target: 'bengkel', desc: 'Misi terakhir: lunasin utang di bengkel.' },
];

export function createMissions(scene, landmarks, save, audio, onEvent) {
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xffd23e, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 60, 14, 1, true), beaconMat);
  beacon.visible = false;
  scene.add(beacon);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.8 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(3, 4.4, 24), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  const state = { active: null, timer: 0 };

  function targetPos(def) {
    return landmarks[def.target] || landmarks.pasar;
  }

  function start(def) {
    state.active = def;
    state.timer = def.time;
    const p = targetPos(def);
    beacon.position.set(p.x, 30, p.z);
    beacon.visible = true;
    ring.position.set(p.x, 0.15, p.z);
    ring.visible = true;
    audio.missionStart();
    if (def.id === 'm2' || def.id === 'm4') {
      if (onEvent) onEvent('wanted', def.id === 'm2' ? 2 : 3);
    }
    if (def.id === 'm4' && onEvent) onEvent('night');
    if (onEvent) onEvent('banner', `MISI: ${def.name} — ${def.desc}`);
  }

  function complete() {
    const def = state.active;
    if (!def) return;
    save.money += def.reward;
    if (!save.missionsDone.includes(def.id)) save.missionsDone.push(def.id);
    audio.cash();
    if (onEvent) onEvent('banner', `MISI SELESAI! +$${def.reward} — ${def.name}`);
    if (onEvent) onEvent('complete', def);
    state.active = null;
    beacon.visible = false;
    ring.visible = false;
  }

  function fail(reason) {
    const def = state.active;
    if (!def) return;
    audio.fail();
    if (onEvent) onEvent('banner', `MISI GAGAL: ${reason} — ${def.name}`);
    state.active = null;
    beacon.visible = false;
    ring.visible = false;
  }

  return {
    defs: MISSIONS,
    get active() { return state.active; },
    get timer() { return state.timer; },
    next() {
      return MISSIONS.find((m) => !save.missionsDone.includes(m.id)) || null;
    },
    startNext() {
      const def = this.next();
      if (def) start(def);
      return def;
    },
    startById(id) {
      const def = MISSIONS.find((m) => m.id === id);
      if (def) start(def);
      return def;
    },
    update(dt, playerPos) {
      if (!state.active) return;
      state.timer -= dt;
      const p = targetPos(state.active);
      const d = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
      const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.15;
      beacon.scale.set(pulse, 1, pulse);
      ring.scale.setScalar(1 + Math.sin(performance.now() * 0.004) * 0.12);
      if (d < 12) complete();
      else if (state.timer <= 0) fail('Waktu habis');
    },
    targetPosition() {
      return state.active ? targetPos(state.active) : null;
    },
  };
}
