// collectibles.js — 20 Relik Cakrawala (BARU round 6).
// 4 Menara/pusat, 4 Pasar, 4 Pelabuhan, 4 Pantai, 4 Bengkel/RS.
// Diambil dalam radius 3,5 m: +$50, +5 rep distrik, bunyi cash.
import * as THREE from 'three';

export const RELICS = [
  { id: 'r1', name: 'Relik Menara I', x: 18, z: -48, district: 'pusat' },
  { id: 'r2', name: 'Relik Menara II', x: -22, z: -14, district: 'pusat' },
  { id: 'r3', name: 'Relik Alun-Alun', x: 40, z: -60, district: 'pusat' },
  { id: 'r4', name: 'Relik Menara IV', x: -38, z: -58, district: 'pusat' },
  { id: 'r5', name: 'Relik Pasar I', x: -104, z: 78, district: 'pasar' },
  { id: 'r6', name: 'Relik Pasar II', x: -140, z: 42, district: 'pasar' },
  { id: 'r7', name: 'Relik Pasar III', x: -96, z: 40, district: 'pasar' },
  { id: 'r8', name: 'Relik Pasar IV', x: -152, z: 84, district: 'pasar' },
  { id: 'r9', name: 'Relik Dermaga I', x: 232, z: 344, district: 'pelabuhan' },
  { id: 'r10', name: 'Relik Dermaga II', x: 268, z: 372, district: 'pelabuhan' },
  { id: 'r11', name: 'Relik Kontainer', x: 214, z: 326, district: 'pelabuhan' },
  { id: 'r12', name: 'Relik Crane', x: 282, z: 322, district: 'pelabuhan' },
  { id: 'r13', name: 'Relik Pantai I', x: -60, z: 322, district: 'pantai' },
  { id: 'r14', name: 'Relik Pantai II', x: 30, z: 326, district: 'pantai' },
  { id: 'r15', name: 'Relik Pantai III', x: 90, z: 320, district: 'pantai' },
  { id: 'r16', name: 'Relik Pantai IV', x: -12, z: 330, district: 'pantai' },
  { id: 'r17', name: 'Relik Bengkel I', x: -200, z: 236, district: 'bengkel' },
  { id: 'r18', name: 'Relik Bengkel II', x: -246, z: 276, district: 'bengkel' },
  { id: 'r19', name: 'Relik RS', x: 104, z: -96, district: 'bengkel' },
  { id: 'r20', name: 'Relik Perumahan', x: -180, z: 210, district: 'bengkel' },
];

export function createCollectibles(scene, save, audio, onEvent) {
  const meshes = new Map();
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd23d, emissive: 0xcc8800, emissiveIntensity: 1.2, metalness: 0.9, roughness: 0.2 });
  const geo = new THREE.OctahedronGeometry(0.9);
  for (const r of RELICS) {
    const m = new THREE.Mesh(geo, goldMat);
    m.position.set(r.x, 1.6, r.z);
    m.castShadow = true;
    const glow = new THREE.PointLight(0xffd23d, 6, 9);
    glow.position.set(r.x, 2, r.z);
    scene.add(glow);
    const holder = new THREE.Group();
    holder.add(m);
    holder.add(glow);
    scene.add(holder);
    const taken = save.relicsFound.includes(r.id);
    holder.visible = !taken;
    meshes.set(r.id, { holder, mesh: m, baseY: 1.6, phase: Math.random() * 6 });
  }

  return {
    get found() { return [...save.relicsFound]; },
    get count() { return save.relicsFound.length; },
    get total() { return RELICS.length; },
    update(dt, playerPos, districtAtFn, t) {
      for (const r of RELICS) {
        const entry = meshes.get(r.id);
        if (!entry) continue;
        if (save.relicsFound.includes(r.id)) {
          entry.holder.visible = false;
          continue;
        }
        entry.mesh.rotation.y = t * 1.6 + entry.phase;
        entry.mesh.position.y = entry.baseY + Math.sin(t * 2 + entry.phase) * 0.35;
        if (playerPos) {
          const d = Math.hypot(playerPos.x - r.x, playerPos.z - r.z);
          if (d < 3.5) {
            save.relicsFound.push(r.id);
            entry.holder.visible = false;
            if (audio) audio.cash();
            if (onEvent) onEvent('relic', r);
          }
        }
      }
    },
  };
}
