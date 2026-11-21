// dispatch.js — Panel dispatch polisi Kota Cakrawala (round 8 rebuild).
// Muncul di HUD kiri saat Wanted ≥ 1: unit polisi bernama + peran +
// jarak live dari pemain (diambil dari police.units()), baris udara
// "AIR UNIT DEPLOYED" saat helikopter aktif, dan penanda
// "MATA ELANG AKTIF" saat ability Bima berjalan. Saat Mata Elang aktif,
// semua baris merah menyala.
//  - PATROLI-07 Penghadang, PATROLI-12 Penjepit, PATROLI-21 Pengejar,
//    PATROLI-33 Penembak, ELANG-1 Penembak, HELI-1 Udara.

export function createDispatch(police) {
  const panel = document.getElementById('dispatch-panel');

  return {
    render(wanted, reveal) {
      if (!panel) return;
      if (wanted <= 0) {
        panel.style.display = 'none';
        return;
      }
      panel.style.display = 'block';
      const units = police.units();
      let html = '<h4>DISPATCH POLISI</h4>';
      for (const u of units) {
        html += `<div class="dispatch-row${reveal ? ' near' : ''}"><span>${u.name} · ${u.role}</span><span>${u.dist}m</span></div>`;
      }
      const heliUp = units.some((u) => u.name === 'HELI-1');
      if (heliUp) html += '<div class="dispatch-air">▲ AIR UNIT DEPLOYED</div>';
      if (reveal) html += '<div class="dispatch-row near"><span>◉ MATA ELANG AKTIF</span><span>20 dtk</span></div>';
      panel.innerHTML = html;
    },
  };
}
