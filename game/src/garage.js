// garage.js — Garasi Bu Sari: upgrade mobil Raka dengan uang hasil misi.
// Buka dengan tombol G di depan pintu garasi bengkel (saat jalan kaki).
// Upgrade tersimpan di save (save.js) dan diterapkan ke mobil yang dikendarai:
// mesin (kecepatan puncak), lapis baja (tahan tabrakan), nitro (boost Shift),
// dan cat baru untuk Kancil GT. Harga naik per level — nabung dulu, Raka!
export const GARAGE_POS = { x: -258, z: 258 }; // depan pintu garasi bengkel

export const UPGRADES = {
  engine: {
    name: 'Mesin Turbo',
    icon: '🔧',
    desc: 'Kecepatan puncak +4 tiap level',
    costs: [300, 600, 1000],
    max: 3,
  },
  armour: {
    name: 'Lapis Baja',
    icon: '🛡',
    desc: 'Mobil tahan tabrakan, Raka lebih aman',
    costs: [200, 400, 700],
    max: 3,
  },
  nitro: {
    name: 'Nitro Boost',
    icon: '💨',
    desc: 'Tahan Shift saat mengemudi = boost kecepatan',
    costs: [500],
    max: 1,
  },
};

export const PAINTS = [
  { name: 'Oranye Kancil', color: 0xe67e22, cost: 0 },
  { name: 'Biru Laut', color: 0x2471a3, cost: 100 },
  { name: 'Hijau Palem', color: 0x1e8449, cost: 100 },
  { name: 'Merah Senja', color: 0xc0392b, cost: 100 },
  { name: 'Ungu Neon', color: 0x7d3c98, cost: 150 },
  { name: 'Kuning Taksi', color: 0xd4ac0d, cost: 150 },
  { name: 'Hitam Malam', color: 0x1a1a1e, cost: 200 },
  { name: 'Putih Pantai', color: 0xecf0f1, cost: 200 },
];

export function defaultUpgrades() {
  return { engine: 0, armour: 0, nitro: false, paint: 0 };
}

export class Garage {
  constructor(save, audio) {
    this.save = save;
    this.audio = audio;
    this.open = false;
    this.onMoneyChange = null; // () — HUD refresh uang
    this.onApply = null; // (upgrades) — terapkan ke mobil aktif
    if (!this.save.upgrades) this.save.upgrades = defaultUpgrades();
  }

  get upgrades() { return this.save.upgrades; }

  /** Bonus kecepatan puncak dari level mesin (dipakai vehicles.js). */
  get topSpeedBonus() { return this.upgrades.engine * 4; }
  /** Nitro aktif kalau sudah dibeli. */
  get hasNitro() { return !!this.upgrades.nitro; }
  /** Pengurang damage dari lapis baja: 15% per level. */
  get armourFactor() { return Math.max(0.25, 1 - this.upgrades.armour * 0.15); }
  get paintColor() { return PAINTS[this.upgrades.paint].color; }

  costOf(kind) {
    const def = UPGRADES[kind];
    if (!def) return null;
    const level = this.upgrades[kind];
    if (typeof level === 'boolean') return level ? null : def.costs[0];
    if (level >= def.max) return null;
    return def.costs[level];
  }

  levelLabel(kind) {
    const level = this.upgrades[kind];
    if (typeof level === 'boolean') return level ? 'DIPASANG ✓' : 'Belum dibeli';
    return `Level ${level}/${UPGRADES[kind].max}`;
  }

  canAfford(kind) {
    const cost = this.costOf(kind);
    return cost != null && this.save.money >= cost;
  }

  /** Beli upgrade; kembalikan { ok, message }. */
  buy(kind) {
    const def = UPGRADES[kind];
    if (!def) return { ok: false, message: 'Upgrade tidak dikenal.' };
    const cost = this.costOf(kind);
    if (cost == null) return { ok: false, message: `${def.name} sudah maksimal!` };
    if (this.save.money < cost) {
      return { ok: false, message: `Uang kurang! ${def.name} butuh $${cost}, kamu punya $${this.save.money}. Selesaikan misi dulu.` };
    }
    this.save.money -= cost;
    if (typeof this.upgrades[kind] === 'boolean') this.upgrades[kind] = true;
    else this.upgrades[kind] += 1;
    if (this.audio) this.audio.upgrade();
    if (this.onMoneyChange) this.onMoneyChange();
    if (this.onApply) this.onApply(this.upgrades);
    return { ok: true, message: `${def.icon} ${def.name} dibeli! ${this.levelLabel(kind)} — sisa uang $${this.save.money}.` };
  }

  /** Beli cat baru; kembalikan { ok, message }. */
  buyPaint(index) {
    const paint = PAINTS[index];
    if (!paint) return { ok: false, message: 'Warna tidak dikenal.' };
    if (index === this.upgrades.paint) return { ok: false, message: `Mobilmu sudah warna ${paint.name}.` };
    if (this.save.money < paint.cost) {
      return { ok: false, message: `Uang kurang! Cat ${paint.name} butuh $${paint.cost}.` };
    }
    this.save.money -= paint.cost;
    this.upgrades.paint = index;
    if (this.audio) this.audio.upgrade();
    if (this.onMoneyChange) this.onMoneyChange();
    if (this.onApply) this.onApply(this.upgrades);
    return { ok: true, message: `🎨 Kancil GT dicat ${paint.name}! Sisa uang $${this.save.money}.` };
  }

  /** Terapkan tuning ke mobil yang sedang dikendarai (dipakai main.js). */
  applyToCar(car) {
    if (!car || !car.userData) return;
    car.userData.tuning = {
      topSpeedBonus: this.topSpeedBonus,
      nitro: this.hasNitro,
      armourFactor: this.armourFactor,
    };
  }

  /** Ringkasan garasi untuk panel HUD (daftar upgrade + harga). */
  summaryLines() {
    const lines = [];
    for (const kind of Object.keys(UPGRADES)) {
      const def = UPGRADES[kind];
      const cost = this.costOf(kind);
      lines.push({
        kind,
        text: `${def.icon} ${def.name} — ${this.levelLabel(kind)}${cost != null ? ` • $${cost}` : ' • MAX'}`,
        affordable: this.canAfford(kind),
        maxed: cost == null,
      });
    }
    PAINTS.forEach((p, i) => {
      lines.push({
        kind: `paint:${i}`,
        text: `🎨 Cat: ${p.name}${i === this.upgrades.paint ? ' (dipakai ✓)' : ` • $${p.cost}`}`,
        affordable: this.save.money >= p.cost,
        maxed: i === this.upgrades.paint,
      });
    });
    return lines;
  }
}
