// save.js — Simpan progres Kota Cakrawala di localStorage.
// Key v4 (save round 7/8 lama tetap kebawa): uang, nyawa, baja, misi
// selesai, relik, reputasi tiap distrik, mobil & upgrade, cat, amunisi,
// side job selesai, rekor balapan, total penghasilan, jumlah ketangkep.

export const SAVE_KEY = 'kota-cakrawala-save-v4';
export const SAVE_VERSION = 4;

export function defaultSave() {
  return {
    version: SAVE_VERSION,
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
    ammo: { pistol: 24, smg: 90, shotgun: 12 },
    sideJobsDone: [],
    raceBest: null,
    totalEarned: 0,
    busted: 0,
    introSeen: false,
  };
}

function sanitize(data) {
  const fresh = defaultSave();
  if (!data || typeof data !== 'object') return fresh;
  const out = { ...fresh, ...data };
  out.rep = { ...fresh.rep, ...(data.rep || {}) };
  out.upgrades = { ...fresh.upgrades, ...(data.upgrades || {}) };
  out.ammo = { ...fresh.ammo, ...(data.ammo || {}) };
  if (!Array.isArray(out.missionsDone)) out.missionsDone = [];
  if (!Array.isArray(out.relicsFound)) out.relicsFound = [];
  if (!Array.isArray(out.ownedCars) || out.ownedCars.length === 0) out.ownedCars = ['kancil'];
  if (!Array.isArray(out.sideJobsDone)) out.sideJobsDone = [];
  if (typeof out.raceBest !== 'number') out.raceBest = null;
  if (typeof out.money !== 'number' || Number.isNaN(out.money)) out.money = 250;
  if (typeof out.health !== 'number') out.health = 100;
  if (typeof out.armor !== 'number') out.armor = 0;
  if (typeof out.totalEarned !== 'number') out.totalEarned = 0;
  if (typeof out.busted !== 'number') out.busted = 0;
  return out;
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function storeSave(save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Penyimpanan diblokir/penuh: game tetap jalan tanpa save.
  }
}

export function wipeSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // abaikan
  }
}
