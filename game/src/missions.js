// missions.js — Cerita & 3 misi berurutan Kota Cakrawala.
// Raka, kurir yang terlilit utang, bekerja untuk Bu Sari (pemilik bengkel).
// M1 antar paket ke pelabuhan (timer), M2 kabur dari polisi setelah ambil
// "paket panas" (wanted 3), M3 balapan kembali ke bengkel. Hadiah uang +
// bintang per misi, progres tersimpan lewat save.js.
import * as THREE from 'three';
import { PLACES } from './city.js';

export const MISSIONS = [
  {
    id: 'm1',
    title: 'Misi 1 — Paket Bu Sari',
    giver: 'Bu Sari',
    brief: 'Antar paket ini ke dermaga pelabuhan sebelum kapal berangkat. Jangan sampai telat, Raka!',
    target: PLACES.harbor,
    targetName: 'Dermaga Pelabuhan',
    timeLimit: 100,
    reward: 150,
  },
  {
    id: 'm2',
    title: 'Misi 2 — Paket Panas',
    giver: 'Bu Sari',
    brief: 'Paketnya... bermasalah. Polisi sudah mengepung pelabuhan! Ambil paketnya lalu kabur ke bengkel. Jangan sampai ketangkap!',
    target: PLACES.workshop,
    targetName: 'Bengkel Bu Sari',
    timeLimit: 75,
    reward: 250,
    wantedOnStart: 3,
  },
  {
    id: 'm3',
    title: 'Misi 3 — Balapan Pulang',
    giver: 'Bu Sari',
    brief: 'Utangmu lunas kalau menang balapan ini! Lewati 3 checkpoint lalu finis di bengkel. Polisi ikut mengejar — gas pol, Raka!',
    target: PLACES.workshop,
    targetName: 'Bengkel Bu Sari',
    timeLimit: 90,
    reward: 400,
    wantedOnStart: 2,
    checkpoints: [
      new THREE.Vector3(240, 0, -240),
      new THREE.Vector3(-240, 0, -240),
      new THREE.Vector3(240, 0, 240),
    ],
  },
];

export class MissionSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = null; // { def, timeLeft, checkpointIndex, startPos }
    this.nextIndex = 0; // misi berikutnya yang bisa dimulai
    this.onComplete = null; // (def, stars, secondsLeft)
    this.onFail = null; // (def, reason)
    this.onStart = null; // (def)
    this.marker = this._buildMarker();
    this.marker.visible = false;
    scene.add(this.marker);
    this.beacon = this._buildBeacon();
    this.beacon.visible = false;
    scene.add(this.beacon);
  }

  _buildMarker() {
    // Penanda tujuan di minimap & HUD: dipakai lewat posisi, bukan mesh.
    return new THREE.Group();
  }

  _buildBeacon() {
    // Pilar cahaya kuning + cincin berdenyut di titik tujuan.
    const group = new THREE.Group();
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 60, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
    );
    pillar.position.y = 30;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.4, 4.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.3;
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 2.6, 4),
      new THREE.MeshBasicMaterial({ color: 0xffc21a }),
    );
    arrow.rotation.x = Math.PI;
    arrow.position.y = 14;
    group.add(pillar, ring, arrow);
    group.userData = { ring, arrow };
    return group;
  }

  /** Misi berikutnya yang belum selesai (null kalau semua sudah). */
  nextMission() {
    return this.nextIndex < MISSIONS.length ? MISSIONS[this.nextIndex] : null;
  }

  start(index = this.nextIndex) {
    const def = MISSIONS[index];
    if (!def) return null;
    this.active = {
      def,
      timeLeft: def.timeLimit,
      checkpointIndex: 0,
      elapsed: 0,
    };
    this._placeBeacon(this.currentTarget());
    if (this.onStart) this.onStart(def);
    return def;
  }

  currentTarget() {
    if (!this.active) return null;
    const def = this.active.def;
    if (def.checkpoints && this.active.checkpointIndex < def.checkpoints.length) {
      return def.checkpoints[this.active.checkpointIndex];
    }
    return def.target;
  }

  currentTargetName() {
    if (!this.active) return '';
    const def = this.active.def;
    if (def.checkpoints && this.active.checkpointIndex < def.checkpoints.length) {
      return `Checkpoint ${this.active.checkpointIndex + 1}/${def.checkpoints.length}`;
    }
    return def.targetName;
  }

  _placeBeacon(pos) {
    this.beacon.position.set(pos.x, 0, pos.z);
    this.beacon.visible = true;
  }

  /** Dipanggil tiap frame; kembalikan 'complete' | 'fail' | null. */
  update(dt, playerPos, elapsed) {
    if (!this.active) return null;
    const a = this.active;
    a.timeLeft -= dt;
    a.elapsed += dt;
    // Animasi beacon: cincin berdenyut, panah naik-turun.
    const t = elapsed;
    const ring = this.beacon.userData.ring;
    const arrow = this.beacon.userData.arrow;
    const s = 1 + Math.sin(t * 4) * 0.18;
    ring.scale.set(s, s, 1);
    arrow.position.y = 14 + Math.sin(t * 3) * 1.6;

    const target = this.currentTarget();
    if (target && playerPos.distanceTo(target) < 9) {
      if (a.def.checkpoints && a.checkpointIndex < a.def.checkpoints.length) {
        a.checkpointIndex++;
        if (a.checkpointIndex < a.def.checkpoints.length) {
          this._placeBeacon(this.currentTarget());
          return 'checkpoint';
        }
        // Checkpoint terakhir dilewati: target akhir = bengkel.
        this._placeBeacon(a.def.target);
        return 'checkpoint';
      }
      return this._complete();
    }
    if (a.timeLeft <= 0) {
      const def = a.def;
      this.active = null;
      this.beacon.visible = false;
      if (this.onFail) this.onFail(def, 'Waktu habis!');
      return 'fail';
    }
    return null;
  }

  _complete() {
    const a = this.active;
    const def = a.def;
    // Bintang: 3 kalau sisa waktu > 40%, 2 kalau > 15%, sisanya 1.
    const frac = a.timeLeft / def.timeLimit;
    const stars = frac > 0.4 ? 3 : frac > 0.15 ? 2 : 1;
    this.active = null;
    this.beacon.visible = false;
    this.nextIndex = Math.max(this.nextIndex, MISSIONS.indexOf(def) + 1);
    if (this.onComplete) this.onComplete(def, stars, a.timeLeft);
    return 'complete';
  }

  abort() {
    this.active = null;
    this.beacon.visible = false;
  }

  /** Label tujuan aktif untuk HUD/minimap (null kalau tidak ada misi). */
  get activeTarget() { return this.currentTarget(); }
}
