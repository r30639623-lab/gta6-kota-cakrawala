// weapons.js — weapon wheel + combat. Hold Q (or press Tab) to open the
// radial wheel; pick with mouse or keys 1–3. Attack with F or left click.
// Fist, Pistol (ammo) and SMG (ammo, faster). Ammo refills at the garage.
import * as THREE from 'three';

export const WEAPONS = [
  { id: 'fist', name: 'Tinju', key: '1', range: 3.2, damage: 12, rate: 0.45, ammo: Infinity },
  { id: 'pistol', name: 'Pistol', key: '2', range: 42, damage: 34, rate: 0.4, ammoKey: 'pistol' },
  { id: 'smg', name: 'SMG', key: '3', range: 36, damage: 18, rate: 0.11, ammoKey: 'smg' },
];

export function createWeapons(scene, camera, save, audio, onCrime) {
  let selected = 0;
  let wheelOpen = false;
  let cooldown = 0;
  const tracers = [];

  function ammoCount(w) {
    return w.ammoKey ? save.ammo[w.ammoKey] : Infinity;
  }

  function tracer(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe98a, transparent: true, opacity: 0.95 }));
    scene.add(line);
    tracers.push({ line, life: 0.12 });
  }

  function shoot(origin, dir, traffic, police) {
    const w = WEAPONS[selected];
    if (w.ammoKey) {
      if (save.ammo[w.ammoKey] <= 0) {
        audio.click();
        return false;
      }
      save.ammo[w.ammoKey] -= 1;
    }
    audio.gunshot(w.id === 'smg');
    const end = origin.clone().add(dir.clone().multiplyScalar(w.range));
    tracer(origin, end);
    // Hit the nearest pedestrian / police car roughly in front.
    let best = null;
    let bestD = w.range;
    const candidates = [];
    for (const p of traffic.peds) if (!p.down) candidates.push({ pos: p.pos, hit: () => { p.down = true; p.downTimer = 8; p.mesh.rotation.x = -Math.PI / 2; p.mesh.position.y = 0.3; } });
    for (const c of police.cars) candidates.push({ pos: c.pos, hit: () => { c.speed = 0; } });
    for (const c of candidates) {
      const to = c.pos.clone().sub(origin);
      const d = to.length();
      if (d > w.range || d < 0.5) continue;
      const ang = to.normalize().angleTo(dir);
      if (ang < 0.16 && d < bestD) { bestD = d; best = c; }
    }
    if (best) {
      best.hit();
      if (onCrime) onCrime(1);
      const hitEnd = origin.clone().add(dir.clone().multiplyScalar(bestD));
      tracer(origin, hitEnd);
    }
    return true;
  }

  return {
    get selected() { return selected; },
    get wheelOpen() { return wheelOpen; },
    get weaponName() { return WEAPONS[selected].name; },
    ammoText() {
      const w = WEAPONS[selected];
      return w.ammoKey ? `${save.ammo[w.ammoKey]}` : '∞';
    },
    setWheel(open) { wheelOpen = open; },
    select(i) {
      if (i >= 0 && i < WEAPONS.length) {
        selected = i;
        audio.click();
      }
    },
    attack(origin, dir, traffic, police, isDriving) {
      if (cooldown > 0) return;
      const w = WEAPONS[selected];
      cooldown = w.rate;
      if (w.id === 'fist') {
        audio.punch();
        // Melee: knock down a nearby pedestrian.
        for (const p of traffic.peds) {
          if (!p.down && p.pos.distanceTo(origin) < w.range) {
            p.down = true;
            p.downTimer = 8;
            p.mesh.rotation.x = -Math.PI / 2;
            p.mesh.position.y = 0.3;
            if (onCrime) onCrime(1);
            break;
          }
        }
      } else {
        shoot(origin, dir, traffic, police);
      }
    },
    update(dt) {
      cooldown = Math.max(0, cooldown - dt);
      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        tracers[i].line.material.opacity = Math.max(0, tracers[i].life / 0.12);
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].line);
          tracers[i].line.geometry.dispose();
          tracers.splice(i, 1);
        }
      }
    },
  };
}
