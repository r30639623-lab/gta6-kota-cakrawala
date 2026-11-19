// player.js — Raka jalan kaki: karakter low-poly, gerak relatif kamera,
// lari (Shift), dan combat sederhana — pukulan (F) yang menjatuhkan
// pejalan kaki di depan. Tabrakan dengan gedung dicegah via collider kota.
import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.group = new THREE.Group();
    // Raka: jaket oranye khas kurir, celana gelap, topi.
    const jacket = new THREE.MeshLambertMaterial({ color: 0xe67e22 });
    const skin = new THREE.MeshLambertMaterial({ color: 0xe8b98a });
    const pants = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const cap = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.36), jacket);
    this.body.position.y = 1.1;
    this.body.castShadow = true;
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skin);
    this.head.position.y = 1.72;
    this.head.castShadow = true;
    this.hat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), cap);
    this.hat.position.y = 1.95;
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.24), pants);
    this.legL.position.set(0, 0.35, 0.15);
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.66, 0.2), jacket);
    this.armL.position.set(0, 1.12, 0.42);
    this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.66, 0.2), jacket);
    this.armR.position.set(0, 1.12, -0.42);
    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.24), pants);
    this.legR.position.set(0, 0.35, -0.15);
    this.group.add(this.body, this.head, this.hat, this.legL, this.legR, this.armL, this.armR);
    scene.add(this.group);

    this.pos = new THREE.Vector3();
    this.heading = 0; // arah hadap (radian, 0 = +z)
    this.walkPhase = 0;
    this.moving = false;
    this.punchTimer = 0; // animasi pukulan sedang jalan
    this.punchCooldown = 0;
    // Round 2 — nyawa & lapis baja: polisi yang menabrak mengurangi nyawa.
    this.health = 100;
    this.armour = 0; // 0–100, dari garasi (lapis baja) atau pickup
    this.dead = false;
    this.regenTimer = 0;
    this.onDeath = null; // () — main.js: respawn di rumah sakit
    this.onDamage = null; // (amount) — HUD flash
  }

  /** Terima damage: lapis baja menyerap dulu, sisanya ke nyawa. */
  damage(amount, armourFactor = 1) {
    if (this.dead) return 0;
    const reduced = amount * armourFactor;
    let rest = reduced;
    if (this.armour > 0) {
      const absorbed = Math.min(this.armour, rest);
      this.armour -= absorbed;
      rest -= absorbed;
    }
    this.health = Math.max(0, this.health - rest);
    this.regenTimer = 0;
    if (this.onDamage) this.onDamage(rest);
    if (this.health <= 0) {
      this.dead = true;
      if (this.onDeath) this.onDeath();
    }
    return rest;
  }

  /** Pulihkan nyawa (rumah sakit / misi selesai) & isi lapis baja. */
  heal(amount) {
    this.health = Math.min(100, this.health + amount);
    if (this.health > 0) this.dead = false;
  }

  addArmour(amount) {
    this.armour = Math.min(100, this.armour + amount);
  }

  /** Regen pelan saat lama tidak kena damage (10 dtk tenang = +2/dtk). */
  _regen(dt) {
    if (this.dead || this.health >= 100) return;
    this.regenTimer += dt;
    if (this.regenTimer > 10) this.health = Math.min(100, this.health + dt * 2);
  }

  spawn(pos, heading = 0) {
    this.pos.copy(pos);
    this.heading = heading;
    this.group.position.copy(pos);
    this.group.rotation.y = heading;
  }

  /** Gerak jalan kaki. cameraYaw = arah kamera (radian). */
  update(dt, input, cameraYaw, colliders, bounds) {
    this._regen(dt);
    if (this.dead) return; // menunggu respawn dari main.js
    const fwd = input.moveAxis();
    const strafe = input.strafeAxis();
    const running = input.down('ShiftLeft') || input.down('ShiftRight');
    const speed = running ? 9.5 : 5.5;
    this.moving = fwd !== 0 || strafe !== 0;

    if (this.punchCooldown > 0) this.punchCooldown -= dt;
    if (this.punchTimer > 0) this.punchTimer -= dt;

    if (this.moving) {
      // Arah gerak relatif kamera: W = menjauhi kamera.
      const sin = Math.sin(cameraYaw);
      const cos = Math.cos(cameraYaw);
      let mx = sin * fwd + cos * strafe;
      let mz = cos * fwd - sin * strafe;
      const len = Math.hypot(mx, mz) || 1;
      mx /= len; mz /= len;
      const nx = this.pos.x + mx * speed * dt;
      const nz = this.pos.z + mz * speed * dt;
      // Tabrakan gedung: tahan di luar kotak collider.
      let blocked = false;
      for (const c of colliders) {
        if (nx > c.minX - 0.5 && nx < c.maxX + 0.5 && nz > c.minZ - 0.5 && nz < c.maxZ + 0.5) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        this.pos.x = THREE.MathUtils.clamp(nx, -bounds, bounds);
        this.pos.z = THREE.MathUtils.clamp(nz, -bounds, bounds);
      }
      // Hadap ke arah gerak (putar halus).
      const targetHeading = Math.atan2(mx, mz);
      let diff = targetHeading - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += THREE.MathUtils.clamp(diff, -10 * dt, 10 * dt);
      this.walkPhase += dt * speed * 1.6;
    }

    // Animasi jalan: ayunan kaki & tangan; pukulan: tangan kanan ke depan.
    const swing = this.moving ? Math.sin(this.walkPhase) * 0.55 : 0;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    if (this.punchTimer > 0) {
      this.armR.rotation.x = -1.5; // tinju ke depan
      this.armL.rotation.x = 0.4;
    } else {
      this.armL.rotation.x = -swing * 0.7;
      this.armR.rotation.x = swing * 0.7;
    }
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
  }

  /** Mulai pukulan; true kalau pukulan dilepas (tidak cooldown). */
  punch() {
    if (this.punchCooldown > 0) return false;
    this.punchTimer = 0.28;
    this.punchCooldown = 0.45;
    return true;
  }

  hide() { this.group.visible = false; }
  show() { this.group.visible = true; }

  /** Respawn di rumah sakit setelah mati: nyawa penuh, wanted hilang. */
  respawn(pos, heading = 0) {
    this.health = 100;
    this.armour = 0;
    this.dead = false;
    this.regenTimer = 0;
    this.spawn(pos, heading);
    this.show();
  }
}
