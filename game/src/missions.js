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
    quote: 'Bu Sari: "Paket ini isinya suku cadang langka. Hati-hati di jalan, jangan ugal-ugalan!"',
    type: 'delivery',
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
    quote: 'Bu Sari: "Jangan tanya isi paketnya. Ambil, lalu lari. Kalau ketangkap, aku tidak kenal kamu!"',
    type: 'escape',
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
    quote: 'Bu Sari: "Menang balapan ini, utangmu lunas. Kalah... ya kerja lembur sebulan!"',
    type: 'race',
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
  {
    id: 'm4',
    title: 'Misi 4 — Kejar-Kejaran Tengah Malam',
    giver: 'Bu Sari',
    brief: 'Paket ini harus sampai ke menara sebelum tengah malam — dan polisi sudah mengendus! Wanted 4 bintang, ada helikopter di atasmu. Jangan berhenti, Raka!',
    quote: 'Bu Sari: "Helikopter sudah naik, nak. Jangan panik — belok tajam di persimpangan, mereka bingung sendiri!"',
    type: 'escape',
    target: PLACES.tower,
    targetName: 'Menara Cakrawala',
    timeLimit: 110,
    reward: 500,
    wantedOnStart: 4,
    checkpoints: [
      new THREE.Vector3(0, 0, 240),
      new THREE.Vector3(180, 0, 60),
    ],
  },
  {
    id: 'm5',
    title: 'Misi 5 — Pasar Pagi Bu Sari',
    giver: 'Bu Sari',
    brief: 'Sayur & suku cadang buat pasar pagi harus sampai sebelum jam 8! Antar ke Pasar Cakrawala lewat alun-alun. Pelan-pelan di keramaian, jangan nabrak dagangan!',
    quote: 'Bu Sari: "Pedagang pasar sudah menunggu. Kalau telat, mereka beli ke bengkel sebelah — jangan sampai!"',
    type: 'delivery',
    target: PLACES.market,
    targetName: 'Pasar Cakrawala',
    timeLimit: 100,
    reward: 350,
    checkpoints: [
      new THREE.Vector3(30, 0, -30),
    ],
  },
  {
    id: 'm6',
    title: 'Misi 6 — Balapan Menara',
    giver: 'Bu Sari',
    brief: 'Anak-anak bengkel sebelah menantangmu balapan keliling kota! Lewati 3 checkpoint lalu finis di Menara Cakrawala. Hadiahnya besar — jangan malu-maluin bengkel kita!',
    quote: 'Bu Sari: "Mereka bilang Kancil GT cuma mobil sayur. Buktikan mereka salah, Raka!"',
    type: 'race',
    target: PLACES.tower,
    targetName: 'Menara Cakrawala',
    timeLimit: 120,
    reward: 600,
    wantedOnStart: 2,
    checkpoints: [
      new THREE.Vector3(-240, 0, 0),
      new THREE.Vector3(0, 0, -240),
      new THREE.Vector3(240, 0, 120),
    ],
  },
  {
    id: 'm7',
    title: 'Misi 7 — Penyelamatan di Pantai',
    giver: 'Bu Sari',
    brief: 'Teman lama Bu Sari mogok di pantai timur! Jemput dia di pantai, lalu antar ke pelabuhan sebelum kapalnya berangkat. Waktu mepet — bawa Kancil GT-mu!',
    quote: 'Bu Sari: "Dia nelayan tua yang dulu menolongku. Jangan biarkan dia ketinggalan kapal, Raka."',
    type: 'rescue',
    target: PLACES.harbor,
    targetName: 'Dermaga Pelabuhan',
    timeLimit: 115,
    reward: 550,
    checkpoints: [
      new THREE.Vector3(370, 0, 0),
    ],
  },
  {
    id: 'm8',
    title: 'Misi 8 — Final: Utang Lunas',
    giver: 'Bu Sari',
    brief: 'INI DIA, RAKA! Balapan terakhir keliling seluruh Kota Cakrawala: 4 checkpoint, polisi di mana-mana, finis di bengkel. Menang = utangmu LUNAS dan bengkel ini jadi milikmu separuh!',
    quote: 'Bu Sari: "Delapan misi, satu kota, satu utang. Selesaikan ini dan kau bukan lagi kurirku — kau partnerku."',
    type: 'finale',
    target: PLACES.workshop,
    targetName: 'Bengkel Bu Sari',
    timeLimit: 150,
    reward: 1000,
    wantedOnStart: 3,
    checkpoints: [
      new THREE.Vector3(240, 0, -240),
      new THREE.Vector3(-240, 0, -240),
      new THREE.Vector3(370, 0, 0),
      new THREE.Vector3(150, 0, 360),
    ],
  },
];

/** Total hadiah semua misi & jumlah misi (untuk menu & HUD tracker). */
export const TOTAL_MISSIONS = MISSIONS.length;
export const TOTAL_REWARD = MISSIONS.reduce((a, m) => a + m.reward, 0);
export const TOTAL_STARS = MISSIONS.length * 3;

/** Label tipe misi untuk tracker HUD. */
export const MISSION_TYPE_LABEL = {
  delivery: '📦 Antar',
  escape: '🚨 Kabur',
  race: '🏁 Balapan',
  rescue: '🛟 Selamatkan',
  finale: '👑 Final',
};

export function missionTypeLabel(def) {
  return MISSION_TYPE_LABEL[def.type || 'delivery'] || '📦 Misi';
}

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

  /** Daftar misi untuk tracker HUD: judul, tipe, reward, status selesai. */
  missionList(doneMap) {
    return MISSIONS.map((def, i) => ({
      index: i,
      id: def.id,
      title: def.title,
      typeLabel: missionTypeLabel(def),
      reward: def.reward,
      done: !!(doneMap && doneMap[def.id]),
      current: i === this.nextIndex && !this.active,
      active: !!(this.active && this.active.def.id === def.id),
    }));
  }

  /** Misi yang sedang aktif + checkpoint ke berapa (untuk tracker). */
  get activeProgress() {
    if (!this.active) return null;
    const def = this.active.def;
    const total = (def.checkpoints ? def.checkpoints.length : 0) + 1;
    const done = def.checkpoints ? this.active.checkpointIndex : 0;
    return { def, checkpointDone: done, checkpointTotal: total, timeLeft: this.active.timeLeft };
  }

  /** Label tujuan aktif untuk HUD/minimap (null kalau tidak ada misi). */
  get activeTarget() { return this.currentTarget(); }
}
