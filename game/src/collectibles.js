// collectibles.js — 20 "Relik Cakrawala": octahedron emas melayang &
// berputar di titik tetap kota (4 Menara, 4 Pasar, 4 Pelabuhan,
// 4 Pantai, 4 Bengkel/RS). Diambil dalam radius 3,5 m: +$50,
// +5 reputasi distrik setempat, bunyi cash. Semua 20 = bonus $500.

import * as THREE from 'three';

export const RELICS = [
  { id: 'r1', name: 'Relik Menara I', x: 18, z: -44, district: 'pusat' },
  { id: 'r2', name: 'Relik Menara II', x: -22, z: -52, district: 'pusat' },
  { id: 'r3', name: 'Relik Menara III', x: 30, z: -8, district: 'pusat' },
  { id: 'r4', name: 'Relik Menara IV', x: -34, z: -6, district: 'pusat' },
  { id: 'r5', name: 'Relik Pasar I', x: -142, z: 44, district: 'pasar' },
  { id: 'r6', name: 'Relik Pasar II', x: -98, z: 78, district: 'pasar' },
  { id: 'r7', name: 'Relik Pasar III', x: -128, z: 92, district: 'pasar' },
  { id: 'r8', name: 'Relik Pasar IV', x: -104, z: 34, district: 'pasar' },
  { id: 'r9', name: 'Relik Pelabuhan I', x: 226, z: 322, district: 'pelabuhan' },
  { id: 'r10', name: 'Relik Pelabuhan II', x: 268, z: 348, district: 'pelabuhan' },
  { id: 'r11', name: 'Relik Pelabuhan III', x: 240, z: 372, district: 'pelabuhan' },
  { id: 'r12', name: 'Relik Pelabuhan IV', x: 288, z: 316, district: 'pelabuhan' },
  { id: 'r13', name: 'Relik Pantai I', x: -30, z: 312, district: 'pantai' },
  { id: 'r14', name: 'Relik Pantai II', x: 26, z: 326, district: 'pantai' },
  { id: 'r15', name: 'Relik Pantai III', x: -60, z: 330, district: 'pantai' },
  { id: 'r16', name: 'Relik Pantai IV', x: 58, z: 308, district: 'pantai' },
  { id: 'r17', name: 'Relik Bengkel I', x: -206, z: 232, district: 'bengkel' },
  { id: 'r18', name: 'Relik Bengkel II', x: -244, z: 272, district: 'bengkel' },
  { id: 'r19', name: 'Relik RS I', x: 104, z: -104, district: 'bengkel' },
  { id: 'r20', name: 'Relik RS II', x: 140, z: -140, district: 'bengkel' },
];

export function createCollectibles(scene, save, audio, onEvent) {
  const geo = new THREE.OctahedronGeometry(1.1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd23f,
    emissive: 0xaa7700,
    emissiveIntensity: 0.9,
    metalness: 0.8,
    roughness: 0.25,
  });
  const meshes = new Map();
  for (const r of RELICS) {
    if (save.relicsFound.includes(r.id)) continue;
    const m = new THREE.Mesh(geo, mat);
    m.position.set(r.x, 2.2, r.z);
    scene.add(m);
    meshes.set(r.id, m);
  }
  let t = 0;
  return {
    get found() {
      return [...save.relicsFound];
    },
    get count() {
      return save.relicsFound.length;
    },
    get total() {
      return RELICS.length;
    },
    update(dt, playerPos, districtAt) {
      t += dt;
      for (const [id, m] of meshes) {
        m.rotation.y += dt * 1.8;
        m.position.y = 2.2 + Math.sin(t * 2 + id.charCodeAt(1)) * 0.45;
      }
      for (const r of RELICS) {
        if (save.relicsFound.includes(r.id)) continue;
        if (Math.hypot(playerPos.x - r.x, playerPos.z - r.z) < 3.5) {
          save.relicsFound.push(r.id);
          const m = meshes.get(r.id);
          if (m) {
            scene.remove(m);
            meshes.delete(r.id);
          }
          if (audio) audio.cash();
          if (onEvent) onEvent({ type: 'relic', relic: r, district: districtAt(r.x, r.z) });
          if (save.relicsFound.length === RELICS.length && onEvent) {
            onEvent({ type: 'allRelics' });
          }
        }
      }
    },
  };
}
