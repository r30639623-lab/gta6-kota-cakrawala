// districts.js — 5 distrik Kota Cakrawala + reputasi (round 6).
// Efek: rep >= 70 -> diskon 20% harga garasi/mobil di distrik itu;
// rep <= 25 -> Wanted naik 2x lebih cepat di distrik itu.
export const DISTRICTS = [
  { id: 'pusat', name: 'Pusat', cx: 0, cz: -30, r: 130 },
  { id: 'pasar', name: 'Pasar', cx: -120, cz: 60, r: 120 },
  { id: 'pelabuhan', name: 'Pelabuhan', cx: 250, cz: 360, r: 130 },
  { id: 'pantai', name: 'Pantai', cx: 0, cz: 318, r: 120 },
  { id: 'bengkel', name: 'Bengkel', cx: -222, cz: 252, r: 130 },
];

export function districtAtPoint(x, z) {
  let best = DISTRICTS[0];
  let bestD = Infinity;
  for (const d of DISTRICTS) {
    const dx = x - d.cx;
    const dz = z - d.cz;
    const dist = Math.hypot(dx, dz);
    if (dist < d.r) return d.id;
    if (dist < bestD) { bestD = dist; best = d; }
  }
  return best.id;
}

export function districtName(id) {
  const d = DISTRICTS.find((v) => v.id === id);
  return d ? d.name : 'Pusat';
}

export function createDistricts(save) {
  return {
    rep(id) { return Math.max(0, Math.min(100, save.rep[id] ?? 50)); },
    addRep(id, n) {
      save.rep[id] = Math.max(0, Math.min(100, (save.rep[id] ?? 50) + n));
    },
    at(x, z) { return districtAtPoint(x, z); },
    list() {
      return DISTRICTS.map((d) => ({ id: d.id, name: d.name, rep: this.rep(d.id) }));
    },
    discountAt(x, z) {
      return this.rep(this.at(x, z)) >= 70 ? 0.2 : 0;
    },
    heatMultiplierAt(x, z) {
      return this.rep(this.at(x, z)) <= 25 ? 2 : 1;
    },
  };
}
