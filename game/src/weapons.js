// weapons.js — Roda senjata radial (Q / Tab) + combat.
// 1 Tinju, 2 Pistol (amunisi), 3 SMG (amunisi, lebih cepat).
// Serang dengan F atau klik kiri. Menyerang polisi/pejalan kaki
// menaikkan Wanted & menurunkan reputasi distrik setempat.
import * as THREE from 'three';

export const WEAPONS = [
  { id: 'fist', name: 'Tinju', range: 2.6, damage: 15, rate: 0.45, ammo: null },
  { id: 'pistol', name: 'Pistol', range: 42, damage: 34, rate: 0.35, ammo: 'pistol' },
  { id: 'smg', name: 'SMG', range: 36, damage: 20, rate: 0.11, ammo: 'smg' },
];

export function createWeapons(scene, camera, save, audio, onHeat) {
  const wheel = document.getElementById('weapon-wheel');
  const segs = [...wheel.querySelectorAll('.wheel-seg')];
  let selected = save.weapon || 0;
  let wheelOpen = false;
  let cooldown = 0;
  let tracer = null;

  function refreshWheel() {
    segs.forEach((s, i) => s.classList.toggle('sel', i === selected));
    const a1 = document.getElementById('wheel-ammo1');
    const a2 = document.getElementById('wheel-ammo2');
    if (a1) a1.textContent = `${save.ammo.pistol} peluru`;
    if (a2) a2.textContent = `${save.ammo.smg} peluru`;
  }

  function showTracer(from, to) {
    if (tracer) { scene.remove(tracer); tracer = null; }
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    tracer = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a0 }));
    scene.add(tracer);
    setTimeout(() => { if (tracer) { scene.remove(tracer); tracer = null; } }, 90);
  }

  // Cari target terdekat di depan arah kamera dalam jangkauan.
  function findTarget(origin, dir, range, candidates) {
    let best = null;
    let bestD = range;
    for (const c of candidates) {
      const to = new THREE.Vector3(c.pos.x - origin.x, 0, c.pos.z - origin.z);
      const d = to.length();
      if (d > range || d < 0.5) continue;
      to.normalize();
      if (to.dot(dir) < 0.55) continue;
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  return {
    get selected() { return selected; },
    get weapon() { return WEAPONS[selected]; },
    get isOpen() { return wheelOpen; },
    select(i) { selected = Math.max(0, Math.min(2, i)); save.weapon = selected; refreshWheel(); },
    openWheel() { wheelOpen = true; wheel.classList.add('on'); refreshWheel(); },
    closeWheel() { wheelOpen = false; wheel.classList.remove('on'); },
    pickFromMouse(mx, my) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = mx - cx;
      const dy = my - cy;
      if (Math.hypot(dx, dy) < 30) return;
      if (dx < -40) this.select(0);
      else if (dy < -30) this.select(1);
      else if (dy > 30) this.select(2);
    },
    update(dt) { cooldown -= dt; },
    // origin: posisi pemain/mobil, dir: arah hadap. candidates: {pos, kind, onHit}.
    attack(origin, dir, candidates) {
      if (cooldown > 0) return null;
      const w = WEAPONS[selected];
      if (w.ammo && save.ammo[w.ammo] <= 0) {
        if (audio) audio.click();
        return 'no-ammo';
      }
      cooldown = w.rate;
      if (w.ammo) save.ammo[w.ammo]--;
      if (w.id === 'fist') { if (audio) audio.punch(); }
      else if (audio) audio.shot();
      const target = findTarget(origin, dir, w.range, candidates || []);
      if (target) {
        if (w.id !== 'fist') {
          showTracer(new THREE.Vector3(origin.x, 1.4, origin.z),
            new THREE.Vector3(target.pos.x, 1.2, target.pos.z));
        }
        if (target.onHit) target.onHit(w.damage);
        if (onHeat) onHeat(target.kind === 'police' ? 1 : 1, target);
        return target;
      }
      if (w.id !== 'fist') {
        const end = new THREE.Vector3(origin.x, 1.4, origin.z).addScaledVector(dir, w.range);
        showTracer(new THREE.Vector3(origin.x, 1.4, origin.z), end);
      }
      return null;
    },
  };
}
