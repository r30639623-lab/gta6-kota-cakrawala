// player.js — Raka on foot: WASD movement, a simple stylised figure,
// and the camera-follow target. spawn() is also the playtest hook.
import * as THREE from 'three';

export function createPlayer(scene) {
  const g = new THREE.Group();
  const jacket = new THREE.MeshStandardMaterial({ color: 0x2a6db0, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 1.05, 10), jacket);
  body.position.y = 0.98;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: 0.8 }));
  head.position.y = 1.78;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9a520, roughness: 0.7 }));
  cap.position.y = 2.02;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 1 }));
  legs.position.y = 0.28;
  const armMat = jacket;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), armMat);
  armL.position.set(-0.46, 1.05, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), armMat);
  armR.position.set(0.46, 1.05, 0);
  g.add(body, head, cap, legs, armL, armR);
  g.position.set(-248, 0, 244);
  scene.add(g);

  const player = {
    mesh: g,
    pos: g.position,
    heading: 0,
    speed: 0,
    spawn(v, heading) {
      g.position.set(v.x, 0, v.z);
      if (typeof heading === 'number') {
        player.heading = heading;
        g.rotation.y = heading;
      }
    },
    update(dt, input, cameraYaw) {
      let fx = 0;
      let fz = 0;
      if (input.isDown('KeyW') || input.isDown('ArrowUp')) fz -= 1;
      if (input.isDown('KeyS') || input.isDown('ArrowDown')) fz += 1;
      if (input.isDown('KeyA') || input.isDown('ArrowLeft')) fx -= 1;
      if (input.isDown('KeyD') || input.isDown('ArrowRight')) fx += 1;
      const moving = fx !== 0 || fz !== 0;
      const walkSpeed = input.isDown('ShiftLeft') ? 7.5 : 4.6;
      if (moving) {
        const len = Math.hypot(fx, fz);
        fx /= len;
        fz /= len;
        // Movement relative to the camera yaw.
        const sin = Math.sin(cameraYaw);
        const cos = Math.cos(cameraYaw);
        const wx = (fx * cos - fz * sin);
        const wz = (fx * sin + fz * cos);
        g.position.x += wx * walkSpeed * dt;
        g.position.z += wz * walkSpeed * dt;
        player.heading = Math.atan2(wx, wz);
        g.rotation.y = player.heading;
        player.speed = walkSpeed;
        // Walk bob.
        g.position.y = Math.abs(Math.sin(performance.now() * 0.012)) * 0.07;
        armL.rotation.x = Math.sin(performance.now() * 0.012) * 0.6;
        armR.rotation.x = -Math.sin(performance.now() * 0.012) * 0.6;
      } else {
        player.speed = 0;
        g.position.y = 0;
        armL.rotation.x = 0;
        armR.rotation.x = 0;
      }
      // Keep Raka inside the map.
      g.position.x = THREE.MathUtils.clamp(g.position.x, -310, 310);
      g.position.z = THREE.MathUtils.clamp(g.position.z, -310, 345);
    },
  };
  return player;
}
