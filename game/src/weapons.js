// weapons.js — Roda senjata radial Kota Cakrawala (tahan Q / Tab):
// 1 Tinju (tanpa amunisi), 2 Pistol, 3 SMG (lebih cepat), 4 Senapan
// (damage besar, jarak menengah). Serang dengan F / klik kiri.
// Amunisi diisi ulang di garasi ($50).

import * as THREE from 'three';

export const WEAPONS = [
  { id: 'fist', name: 'Tinju', damage: 15, rate: 0.45, ammo: null, range: 2.4 },
  { id: 'pistol', name: 'Pistol', damage: 34, rate: 0.35, ammo: 'pistol', range: 26 },
  { id: 'smg', name: 'SMG', damage: 18, rate: 0.09, ammo: 'smg', range: 22 },
  { id: 'shotgun', name: 'Senapan', damage: 60, rate: 0.7, ammo: 'shotgun', range: 16 },
];

export function createWeapons(scene, camera, save, audio, onHeat) {
  let current = 0;
  let cooldown = 0;
  let wheelOpen = false;
  const tracerMat = new THREE.LineBasicMaterial({ color: 0xffe97a, transparent: true, opacity: 0.9 });
  const tracerGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const tracer = new THREE.Line(tracerGeo, tracerMat);
  tracer.visible = false;
  scene.add(tracer);
  let tracerT = 0;

  function muzzleWorld(out) {
    out.copy(camera.position);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    out.addScaledVector(dir, 1.2);
    out.y -= 0.25;
    return out;
  }

  return {
    get current() {
      return WEAPONS[current];
    },
    get wheelOpen() {
      return wheelOpen;
    },
    setWheel(open) {
      wheelOpen = open;
      const el = document.getElementById('weapon-wheel');
      if (el) el.style.display = open ? 'flex' : 'none';
    },
    select(i) {
      if (i >= 0 && i < WEAPONS.length) {
        current = i;
        const segs = document.querySelectorAll('#weapon-wheel .wheel-seg');
        segs.forEach((s, idx) => s.classList.toggle('active', idx === i));
      }
    },
    attack(playerPos, heading, targets) {
      if (cooldown > 0) return false;
      const w = WEAPONS[current];
      cooldown = w.rate;
      if (w.ammo) {
        if ((save.ammo[w.ammo] ?? 0) <= 0) {
          if (audio) audio.click();
          return false;
        }
        save.ammo[w.ammo]--;
        if (audio) audio.shoot();
        const from = muzzleWorld(new THREE.Vector3());
        const dir = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
        const to = from.clone().addScaledVector(dir, w.range);
        tracerGeo.setFromPoints([from, to]);
        tracer.visible = true;
        tracerT = 0.07;
      } else {
        if (audio) audio.click();
      }
      let best = null;
      let bestD = w.range;
      const fx = Math.sin(heading);
      const fz = Math.cos(heading);
      for (const t of targets) {
        const dx = t.x - playerPos.x;
        const dz = t.z - playerPos.z;
        const d = Math.hypot(dx, dz);
        if (d > w.range || d < 0.01) continue;
        const dot = (dx * fx + dz * fz) / d;
        if (dot < 0.9) continue;
        if (d < bestD) {
          best = t;
          bestD = d;
        }
      }
      if (best) {
        if (best.onHit) best.onHit(w.damage);
        if (onHeat) onHeat(best.kind === 'police' ? 8 : 5);
        return true;
      }
      return false;
    },
    update(dt) {
      cooldown = Math.max(0, cooldown - dt);
      if (tracer.visible) {
        tracerT -= dt;
        if (tracerT <= 0) tracer.visible = false;
      }
    },
  };
}
