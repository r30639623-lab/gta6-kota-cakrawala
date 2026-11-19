// save.js — Simpan & muat progres pemain (uang, bintang misi) di localStorage.
// Kota Cakrawala — seluruh kode di file ini ditulis untuk entri make.fun gta6-01.
const SAVE_KEY = 'kota-cakrawala-save-v1';

export const DEFAULT_SAVE = {
  money: 0,
  missionsDone: { m1: false, m2: false, m3: false },
  missionStars: { m1: 0, m2: 0, m3: 0 },
  bestTimes: { m1: null, m2: null, m3: null },
  totalDeliveries: 0,
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
