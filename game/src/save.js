// save.js — localStorage persistence for Kota Cakrawala.
// Saves money, finished missions, garage upgrades, paint and ammo.
const KEY = 'kota-cakrawala-save-v3';

export function defaultSave() {
  return {
    money: 250,
    missionsDone: [],
    upgrades: { turbo: false, armor: false, nitro: false },
    paint: 0,
    ammo: { pistol: 24, smg: 60 },
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw);
    const base = defaultSave();
    return {
      money: typeof data.money === 'number' ? data.money : base.money,
      missionsDone: Array.isArray(data.missionsDone) ? data.missionsDone : [],
      upgrades: { ...base.upgrades, ...(data.upgrades || {}) },
      paint: typeof data.paint === 'number' ? data.paint : 0,
      ammo: { ...base.ammo, ...(data.ammo || {}) },
    };
  } catch (err) {
    return defaultSave();
  }
}

export function writeSave(data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) { /* storage may be unavailable; game keeps running */ }
}
