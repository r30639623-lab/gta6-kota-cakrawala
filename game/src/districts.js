// districts.js — 5 distrik Kota Cakrawala + reputasi (0–100, awal 50).
// Reputasi naik saat misi / relik selesai di distrik itu, turun saat
// pemain berbuat onar di sana. Efek nyata di gameplay:
// rep >= 70 -> diskon 20% di garasi distrik itu;
// rep <= 25 -> Wanted naik 2x lebih cepat di distrik itu.

export const DISTRICTS = [
  { id: 'pusat', name: 'Pusat', cx: 0, cz: -30, r: 150 },
  { id: 'pasar', name: 'Pasar', cx: -120, cz: 60, r: 115 },
  { id: 'pelabuhan', name: 'Pelabuhan', cx: 250, cz: 360, r: 135 },
  { id: 'pantai', name: 'Pantai', cx: 0, cz: 318, r: 125 },
  { id: 'bengkel', name: 'Bengkel', cx: -222, cz: 252, r: 125 },
];

export function districtColor(id) {
  const palette = {
    pusat: '#2ec4b6',
    pasar: '#ffd23f',
    pelabuhan: '#2ee6ff',
    pantai: '#ff9f43',
    bengkel: '#ff6b6b',
  };
  return palette[id] || '#ffffff';
}

export function createDistricts(save) {
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const read = (id) => {
    const v = save.rep ? save.rep[id] : undefined;
    return typeof v === 'number' ? clamp(v) : 50;
  };
  return {
    rep(id) {
      return read(id);
    },
    addRep(id, delta) {
      if (!save.rep) save.rep = {};
      save.rep[id] = clamp(read(id) + delta);
      return save.rep[id];
    },
    // Distrik dari posisi dunia: yang terdekat dan masih dalam radiusnya.
    at(x, z) {
      let best = null;
      let bestD = Infinity;
      for (const d of DISTRICTS) {
        const dist = Math.hypot(x - d.cx, z - d.cz);
        if (dist < d.r && dist < bestD) {
          best = d.id;
          bestD = dist;
        }
      }
      return best ?? 'pusat';
    },
    list() {
      return DISTRICTS.map((d) => ({ ...d, rep: read(d.id) }));
    },
    nameOf(id) {
      return DISTRICTS.find((d) => d.id === id)?.name ?? 'Pusat';
    },
  };
}
