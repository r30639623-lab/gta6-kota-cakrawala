// player.js — Raka jalan kaki + kamera orang ketiga.
import * as THREE from 'three';
import { collideCircle } from './vehicles.js';

export function createPlayer(scene, colliders) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a6fd6, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8b88a, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.85 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.5), bodyMat);
  torso.position.y = 1.35;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), skinMat);
  head.position.y = 2.2;
  group.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd7263d, roughness: 0.7 }));
  cap.position.y = 2.48;
  group.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.9, 0.36), pantsMat);
  legL.position.set(-0.22, 0.45, 0);
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.22;
  group.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.3), bodyMat);
  armL.position.set(-0.58, 1.35, 0);
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.58;
  group.add(armR);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(group);

  const player = {
    mesh: group,
    pos: new THREE.Vector3(-252, 0, 246),
    heading: 0,
    walkPhase: 0,
    spawn(v, heading) {
      player.pos.set(v.x, 0, v.z);
      if (heading !== undefined) player.heading = heading;
      group.position.copy(player.pos);
      group.rotation.y = player.heading;
    },
    update(dt, input, driving) {
      if (driving) {
        group.visible = false;
        return;
      }
      group.visible = true;
      const fwd = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
      const strafe = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const speed = 6.5;
      let mx = 0;
      let mz = 0;
      if (fwd !== 0 || strafe !== 0) {
        const sin = Math.sin(player.heading);
        const cos = Math.cos(player.heading);
        // Kamera di belakang pemain: W menjauhi kamera.
        mx = (sin * fwd + cos * strafe) * speed;
        mz = (cos * fwd - sin * strafe) * speed;
        player.heading = Math.atan2(mx, mz);
      }
      const nx = player.pos.x + mx * dt;
      const nz = player.pos.z + mz * dt;
      if (!collideCircle(nx, nz, 0.7, colliders)) {
        player.pos.x = nx;
        player.pos.z = nz;
      }
      player.pos.x = Math.max(-308, Math.min(343, player.pos.x));
      player.pos.z = Math.max(-308, Math.min(343, player.pos.z));
      const moving = Math.abs(mx) + Math.abs(mz) > 0.1;
      if (moving) player.walkPhase += dt * 11;
      const swing = moving ? Math.sin(player.walkPhase) * 0.55 : 0;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      armR.rotation.x = swing * 0.8;
      group.position.copy(player.pos);
      group.rotation.y = player.heading;
    },
  };
  group.position.copy(player.pos);
  return player;
}
