// crew.js — Kru bengkel Bu Sari, Kota Cakrawala (round 8 rebuild).
// Tiga anggota, masing-masing satu ability aktif + cooldown yang tampil
// di bar kru (kiri bawah HUD). Dipakai dengan Z / X / C.
//  - Yoga [Z] Perbaiki Cepat: +60 baja, cooldown 45 dtk.
//  - Lia  [X] Ganti Plat: Wanted turun 2 bintang, cooldown 60 dtk.
//  - Bima [C] Mata Elang: semua polisi merah di minimap + panel
//    dispatch selama 20 dtk, cooldown 40 dtk.
// Cooldown hanya jalan saat dunia berjalan (bukan saat HP/garasi buka).

export const CREW = [
  { id: 'yoga', name: 'Yoga', role: 'Montir', key: 'Z', ability: 'Perbaiki Cepat', desc: '+60 baja', cooldown: 45 },
  { id: 'lia', name: 'Lia', role: 'Supir', key: 'X', ability: 'Ganti Plat', desc: 'Wanted −2★', cooldown: 60 },
  { id: 'bima', name: 'Bima', role: 'Pengintai', key: 'C', ability: 'Mata Elang', desc: 'Tandai polisi 20 dtk', cooldown: 40 },
];

export function createCrew(save, audio, api) {
  const bar = document.getElementById('crew-bar');
  const members = CREW.map((c) => ({ ...c, cd: 0 }));
  let revealUntil = 0;

  function render() {
    if (!bar) return;
    let html = '';
    for (const m of members) {
      const ready = m.cd <= 0;
      const cdText = ready ? 'SIAP' : `${Math.ceil(m.cd)} dtk`;
      html += `<div class="crew-slot${ready ? ' ready' : ''}"><span class="crew-key">[${m.key}]</span> <span class="crew-name">${m.name}</span> — ${m.role}<br>${m.ability} · ${cdText}</div>`;
    }
    bar.innerHTML = html;
  }

  return {
    members,
    get reveal() {
      return performance.now() / 1000 < revealUntil;
    },
    get revealLeft() {
      return Math.max(0, revealUntil - performance.now() / 1000);
    },
    render,
    use(index, nowSec) {
      const m = members[index];
      if (!m || m.cd > 0) return false;
      m.cd = m.cooldown;
      if (m.id === 'yoga') {
        if (api.addArmor) api.addArmor(60);
        if (audio) audio.cash();
      } else if (m.id === 'lia') {
        if (api.reduceWanted) api.reduceWanted(2);
        if (audio) audio.blip();
      } else if (m.id === 'bima') {
        revealUntil = nowSec + 20;
        if (audio) audio.blip();
      }
      render();
      return true;
    },
    update(dt) {
      let changed = false;
      for (const m of members) {
        if (m.cd > 0) {
          const before = m.cd;
          m.cd = Math.max(0, m.cd - dt);
          if ((before > 0) !== (m.cd > 0)) changed = true;
        }
      }
      if (changed) render();
    },
  };
}
