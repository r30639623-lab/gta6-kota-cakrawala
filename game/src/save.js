// save.js — Simpan/muat progres Kota Cakrawala di localStorage.
// Key v4 (round 6): uang, nyawa, armor, misi, relik, reputasi distrik,
// mobil yang dimiliki/aktif, upgrade garasi, cat, amunisi.

export const SAVE_KEY = 'kota-cakrawala-save-v4';

export function defaultSave() {
  return {
    money: 250,
    health: 100,
    armor: 0,
    missionsDone: [],
    relicsFound: [],
    rep: { pusat: 50, pasar: 50, pelabuhan: 50, pantai: 50, bengkel: 50 },
    ownedCars: ['kancil'],
    activeCarId: 'kancil',
    upgrades: { turbo: false, armor: false, nitro: false },
    paint: 0,
    ammo: { pistol: 24, smg: 90 },
    totalEarned: 0,
    busted: 0,
  };
}

export function loadSave() {
  const fresh = defaultSave();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return fresh;
    const out = { ...fresh, ...data };
    out.rep = { ...fresh.rep, ...(data.rep || {}) };
    out.upgrades = { ...fresh.upgrades, ...(data.upgrades || {}) };
    out.ammo = { ...fresh.ammo, ...(data.ammo || {}) };
    out.missionsDone = Array.isArray(data.missionsDone) ? data.missionsDone : [];
    out.relicsFound = Array.isArray(data.relicsFound) ? data.relicsFound : [];
    out.ownedCars = Array.isArray(data.ownedCars) && data.ownedCars.length ? data.ownedCars : ['kancil'];
    return out;
  } catch {
    return fresh;
  }
}

export function storeSave(save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Penyimpanan penuh/diblokir: game tetap jalan tanpa save.
  }
}

export function wipeSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // abaikan
  }
}
