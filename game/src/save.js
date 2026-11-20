// save.js — Save/load localStorage, key v4 (round 6).
export const SAVE_KEY = 'kota-cakrawala-save-v4';

export function defaultSave() {
  return {
    money: 500,
    health: 100,
    armor: 0,
    missionsDone: [],
    relicsFound: [],
    rep: { pusat: 50, pasar: 50, pelabuhan: 50, pantai: 50, bengkel: 50 },
    ownedCars: ['kancil'],
    activeCarId: 'kancil',
    paintIndex: 0,
    upgrades: { turbo: false, armorUp: false, nitro: false },
    ammo: { pistol: 60, smg: 90 },
    weapon: 0,
    radioStation: 0,
    allRelicsBonus: false,
    legendBonus: false,
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const base = defaultSave();
    const merged = { ...base, ...parsed };
    merged.rep = { ...base.rep, ...(parsed.rep || {}) };
    merged.upgrades = { ...base.upgrades, ...(parsed.upgrades || {}) };
    merged.ammo = { ...base.ammo, ...(parsed.ammo || {}) };
    if (!Array.isArray(merged.missionsDone)) merged.missionsDone = [];
    if (!Array.isArray(merged.relicsFound)) merged.relicsFound = [];
    if (!Array.isArray(merged.ownedCars) || merged.ownedCars.length === 0) merged.ownedCars = ['kancil'];
    return merged;
  } catch {
    return defaultSave();
  }
}

export function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch { /* storage penuh / privat: abaikan */ }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* abaikan */ }
}
