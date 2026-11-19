// garage.js — Bu Sari's garage: engine turbo, armor plating, nitro boost
// and 8 paint colours, plus ammo refills. Prices in dollars.
import { PAINTS } from './vehicles.js';

export const UPGRADES = [
  { id: 'turbo', name: 'Mesin Turbo', desc: '+30% kecepatan top', price: 400 },
  { id: 'armor', name: 'Lapis Baja', desc: 'Mobil tahan tabrakan', price: 350 },
  { id: 'nitro', name: 'Nitro', desc: 'Boost dengan Shift', price: 300 },
];

export function createGarage(doc, save, car, audio, onMoney) {
  const panel = doc.getElementById('garage-panel');
  const list = doc.getElementById('garage-list');
  const paintsEl = doc.getElementById('garage-paints');
  let open = false;

  function render() {
    if (!list || !paintsEl) return;
    list.innerHTML = '';
    for (const u of UPGRADES) {
      const owned = !!save.upgrades[u.id];
      const row = doc.createElement('div');
      row.className = 'garage-row';
      const label = doc.createElement('span');
      label.textContent = `${u.name} — ${u.desc} ${owned ? '(DIMILIKI)' : `$${u.price}`}`;
      const btn = doc.createElement('button');
      btn.textContent = owned ? 'OK ✓' : 'BELI';
      btn.disabled = owned;
      btn.addEventListener('click', () => {
        if (owned) return;
        if (save.money < u.price) {
          audio.fail();
          return;
        }
        save.money -= u.price;
        save.upgrades[u.id] = true;
        audio.cash();
        onMoney();
        render();
      });
      row.appendChild(label);
      row.appendChild(btn);
      list.appendChild(row);
    }
    // Ammo refill row.
    const ammoRow = doc.createElement('div');
    ammoRow.className = 'garage-row';
    const ammoLabel = doc.createElement('span');
    ammoLabel.textContent = `Isi Ulang Amunisi — Pistol ${save.ammo.pistol} • SMG ${save.ammo.smg} — $50`;
    const ammoBtn = doc.createElement('button');
    ammoBtn.textContent = 'BELI';
    ammoBtn.addEventListener('click', () => {
      if (save.money < 50) { audio.fail(); return; }
      save.money -= 50;
      save.ammo.pistol += 48;
      save.ammo.smg += 120;
      audio.cash();
      onMoney();
      render();
    });
    ammoRow.appendChild(ammoLabel);
    ammoRow.appendChild(ammoBtn);
    list.appendChild(ammoRow);

    paintsEl.innerHTML = '';
    PAINTS.forEach((p, i) => {
      const sw = doc.createElement('button');
      sw.className = 'paint-swatch' + (save.paint === i ? ' selected' : '');
      sw.style.background = `#${p.color.toString(16).padStart(6, '0')}`;
      sw.title = p.name;
      sw.addEventListener('click', () => {
        save.paint = i;
        car.setPaint(i);
        audio.click();
        render();
      });
      paintsEl.appendChild(sw);
    });
  }

  return {
    get isOpen() { return open; },
    open() { open = true; render(); },
    close() { open = false; },
    toggle() { open = !open; if (open) render(); return open; },
  };
}
