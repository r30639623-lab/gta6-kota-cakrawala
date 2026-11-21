// districts.js — 5 distrik Kota Cakrawala dan reputasinya (0-100, awal 50).
// Reputasi naik saat misi/reliK diselesaikan di distrik itu, turun saat
// pemain berbuat onar di sana. Efek: rep >= 70 = diskon 20% di garasi
// distrik itu; rep <= 25 = Wanted naik 2x lebih cepat di distrik itu.

export const DISTRICTS = [
  { id: 'pusat', name: 'Pusat', cx: 0, cz: -30, r: 150 },
  { id: 'pasar', name: 'Pasar', cx: -120, cz: 60, r: 115 },
  { id: 'pelabuhan', name: 'Pelabuhan', cx: 250, cz: 360, r: 135 },
  { id: 'pantai', name: 'Pantai', cx: 0, cz: 318, r: 125 },
  { id: 'bengkel', name: 'Bengkel', cx: -222, cz: 252, r: 125 },
];

export function createDistricts(save) {
  const repOf = (id) => {
    const v = save.rep?.[id];
    return typeof v === 'number' ? Math.max(0, Math.min(100, v)) : 50;
  };
  return {
    rep(id) {
      return repOf(id);
    },
    addRep(id, n) {
      if (!save.rep) save.rep = {};
      save.rep[id] = Math.max(0, Math.min(100, repOf(id) + n));
      return save.rep[id];
    },
    // Distrik dari posisi dunia: yang terdekat dalam radiusnya, else 'pusat'.
    at(x, z) {
      let best = null;
      let bestD = Infinity;
      for (const d of DISTRICTS) {
        const dx = x - d.cx;
        const dz = z - d.cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < d.r && dist < bestD) {
          best = d.id;
          bestD = dist;
        }
      }
      return best ?? 'pusat';
    },
    list() {
      return DISTRICTS.map((d) => ({ ...d, rep: repOf(d.id) }));
    },
    nameOf(id) {
      return DISTRICTS.find((d) => d.id === id)?.name ?? 'Pusat';
    },
  };
}
