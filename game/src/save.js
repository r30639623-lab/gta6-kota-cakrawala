// save.js — Simpan & muat progres pemain (uang, bintang misi) di localStorage.
// Kota Cakrawala — seluruh kode di file ini ditulis untuk entri make.fun gta6-01.
// Round 2: 8 misi (m1–m8), upgrade garasi, stasiun radio, dan statistik kota.
const SAVE_KEY = 'kota-cakrawala-save-v1';

export const MISSION_IDS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];

export const DEFAULT_SAVE = {
  money: 0,
  missionsDone: { m1: false, m2: false, m3: false, m4: false, m5: false, m6: false, m7: false, m8: false },
  missionStars: { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0 },
  bestTimes: { m1: null, m2: null, m3: null, m4: null, m5: null, m6: null, m7: null, m8: null },
  totalDeliveries: 0,
  upgrades: { engine: 0, armour: 0, nitro: false, paint: 0 },
  radioStation: 0,
  stats: { distanceDriven: 0, crimes: 0, carsStolen: 0, deaths: 0, heliEscapes: 0 },
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...parsed,
      missionsDone: { ...DEFAULT_SAVE.missionsDone, ...(parsed.missionsDone || {}) },
      missionStars: { ...DEFAULT_SAVE.missionStars, ...(parsed.missionStars || {}) },
      bestTimes: { ...DEFAULT_SAVE.bestTimes, ...(parsed.bestTimes || {}) },
      upgrades: { ...DEFAULT_SAVE.upgrades, ...(parsed.upgrades || {}) },
      stats: { ...DEFAULT_SAVE.stats, ...(parsed.stats || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Penyimpanan penuh / diblokir: progres sesi tetap jalan, hanya tidak tersimpan.
  }
}

/** Catat misi selesai: tambah uang, simpan bintang terbaik + waktu terbaik. */
export function recordMissionComplete(save, missionId, reward, stars, secondsLeft) {
  save.money += reward;
  save.missionsDone[missionId] = true;
  save.missionStars[missionId] = Math.max(save.missionStars[missionId] || 0, stars);
  const elapsed = secondsLeft;
  if (save.bestTimes[missionId] == null || elapsed > save.bestTimes[missionId]) {
    save.bestTimes[missionId] = elapsed;
  }
  save.totalDeliveries += 1;
  storeSave(save);
  return save;
}

export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* abaikan */ }
  return structuredClone(DEFAULT_SAVE);
}

/** Tambah statistik kota (jarak, kejahatan, mobil dicuri, kematian). */
export function recordStat(save, key, amount = 1) {
  if (!save.stats) save.stats = structuredClone(DEFAULT_SAVE.stats);
  save.stats[key] = (save.stats[key] || 0) + amount;
  storeSave(save);
  return save;
}

/** Total bintang dari 8 misi (maks 24) — untuk menu & tracker HUD. */
export function totalStars(save) {
  return Object.values(save.missionStars || {}).reduce((a, b) => a + (b || 0), 0);
}

/** Jumlah misi selesai (maks 8). */
export function missionsDoneCount(save) {
  return Object.values(save.missionsDone || {}).filter(Boolean).length;
}
