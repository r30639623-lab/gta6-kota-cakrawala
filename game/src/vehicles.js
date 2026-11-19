// vehicles.js — car meshes and the player's cars (Kancil GT, Badak Pickup).
// A car is a simple stylised box-body build: body, cabin, wheels, lights.
import * as THREE from 'three';

export const PAINTS = [
  { name: 'Merah', color: 0xc22a2a },
  { name: 'Biru', color: 0x2456c2 },
  { name: 'Kuning', color: 0xe8b400 },
  { name: 'Hijau', color: 0x2a8f4a },
  { name: 'Ungu', color: 0x7a3fa0 },
  { name: 'Putih', color: 0xe8e8e8 },
  { name: 'Hitam', color: 0x1c1e22 },
  { name: 'Oranye', color: 0xe06a10 },
];

export function makeCarMesh(color, kind) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.55 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: 0.15, metalness: 0.7 });
  const isPickup = kind === 'pickup';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, isPickup ? 4.6 : 4.3), bodyMat);
  body.position.y = 0.62;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.6, isPickup ? 1.7 : 2.1), glassMat);
  cabin.position.set(0, 1.2, isPickup ? 0.55 : -0.15);
  g.add(cabin);
  if (isPickup) {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 1.9),
      new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.9 }));
    bed.position.set(0, 0.95, -1.2);
    g.add(bed);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9 });
  const wheels = [];
  for (const [wx, wz] of [[-1.0, 1.45], [1.0, 1.45], [-1.0, -1.45], [1.0, -1.45]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.38, wz);
    g.add(w);
    wheels.push(w);
  }
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffe9a0, emissiveIntensity: 0.9 });
  for (const sx of [-0.7, 0.7]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.1), lightMat);
    lamp.position.set(sx, 0.72, 2.16);
    g.add(lamp);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x881111, emissive: 0xcc2222, emissiveIntensity: 0.8 }));
    tail.position.set(sx, 0.72, -2.16);
    g.add(tail);
  }
  g.userData.wheels = wheels;
  return g;
}

// The player's own car state: position, heading, speed, damage.
export function createPlayerCar(scene, paintIndex) {
  const paint = PAINTS[paintIndex % PAINTS.length];
  const mesh = makeCarMesh(paint.color, 'sport');
  mesh.position.set(-252, 0, 240);
  mesh.rotation.y = Math.PI / 2;
  scene.add(mesh);
  const car = {
    mesh,
    pos: mesh.position,
    heading: Math.PI / 2,
    speed: 0,
    damage: 0,
    kind: 'sport',
    name: 'Kancil GT',
    paintIndex: paintIndex % PAINTS.length,
    setPaint(i) {
      this.paintIndex = i % PAINTS.length;
      const c = PAINTS[this.paintIndex].color;
      this.mesh.traverse((o) => {
        if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.position.y === 0.62) {
          o.material = new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.55 });
        }
      });
    },
  };
  return car;
}
