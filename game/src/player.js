// player.js — Raka berjalan kaki: model low-poly, gerak WASD relatif
// kamera, tabrakan lingkaran vs gedung, pukul (F) sebagai serangan dekat.

import * as THREE from 'three';
import { resolveCircle } from './vehicles.js';

export function createPlayer(scene) {
  const group = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: 0xe8b98a });
  const shirt = new THREE.MeshLambertMaterial({ color: 0x2ec4b6 });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2c3550 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.45), shirt);
  body.position.y = 1.35;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), skin);
  head.position.y = 2.2;
  head.castShadow = true;
  group.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.16, 10), new THREE.MeshLambertMaterial({ color: 0xd21f2b }));
  cap.position.y = 2.46;
  group.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.36), pants);
  legL.position.set(-0.22, 0.43, 0);
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.22;
  group.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.3), shirt);
  armL.position.set(-0.58, 1.35, 0);
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.58;
  group.add(armR);
  scene.add(group);

  const pos = new THREE.Vector3(-250, 0, 238);
  let heading = 0;
  let walkPhase = 0;
  let moving = false;

  return {
    mesh: group,
    get pos() {
      return pos;
    },
    get heading() {
      return heading;
    },
    get moving() {
      return moving;
    },
    spawn(p, h = 0) {
      pos.copy(p);
      pos.y = 0;
      heading = h;
      group.position.copy(pos);
      group.rotation.y = heading;
    },
    punch() {
      armR.rotation.x = -1.4;
      setTimeout(() => {
        armR.rotation.x = 0;
      }, 180);
    },
    update(dt, input, camHeading, colliders) {
      const axes = input.moveAxes();
      moving = axes.f !== 0 || axes.s !== 0;
      if (moving) {
        const speed = 6.5;
        const sin = Math.sin(camHeading);
        const cos = Math.cos(camHeading);
        const dx = (sin * axes.f + cos * axes.s) * speed * dt;
        const dz = (cos * axes.f - sin * axes.s) * speed * dt;
        const hit = resolveCircle(pos.x + dx, pos.z + dz, 0.7, colliders);
        pos.x = hit.x;
        pos.z = hit.z;
        pos.x = Math.max(-308, Math.min(343, pos.x));
        pos.z = Math.max(-308, Math.min(343, pos.z));
        heading = Math.atan2(dx, dz);
        walkPhase += dt * 11;
        legL.rotation.x = Math.sin(walkPhase) * 0.6;
        legR.rotation.x = -Math.sin(walkPhase) * 0.6;
        armL.rotation.x = -Math.sin(walkPhase) * 0.5;
        if (armR.rotation.x === 0) armR.rotation.x = Math.sin(walkPhase) * 0.5;
      } else {
        legL.rotation.x = 0;
        legR.rotation.x = 0;
        armL.rotation.x = 0;
      }
      group.position.copy(pos);
      group.rotation.y = heading;
    },
  };
}
