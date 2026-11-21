// garage.js — Panel garasi Kota Cakrawala (tombol G di mana saja):
// daftar 10 mobil (beli/pilih), upgrade Turbo/Lapis Baja/Nitro,
// 8 warna cat, isi ulang amunisi $50, daftar 3 garasi.
// Diskon 20% bila reputasi distrik saat ini >= 70.

import { CARS, PAINTS, carDef } from './vehicles.js';

const UPGRADES = [
  { id: 'turbo', name: 'Mesin Turbo', desc: '+30% top speed', price: 400 },
  { id: 'armor', name: 'Lapis Baja', desc: 'Mobil lebih tahan tabrakan', price: 350 },
  { id: 'nitro', name: 'Nitro', desc: 'Boost dengan Shift', price: 300 },
];

export function createGarage(save, districts, api) {
  const panel = document.getElementById('garage-panel');
  const listEl = document.getElementById('garage-list');
  const paintsEl = document.getElementById('garage-paints');
  const moneyEl = document.getElementById('garage-money');
  let open = false;

  function discount() {
    const d = api.currentDistrict ? api.currentDistrict() : 'pusat';
    return districts.rep(d) >= 70 ? 0.8 : 1;
  }
  function priceOf(base) {
    return Math.round(base * discount());
  }

  function render() {
    const disc = discount();
    moneyEl.textContent = `$${save.money}${disc < 1 ? ' — DISKON 20% (reputasi distrik tinggi!)' : ''}`;
    listEl.innerHTML = '';
    const done = save.missionsDone.length;
    for (const car of CARS) {
      const owned = save.ownedCars.includes(car.id);
      const active = save.activeCarId === car.id;
      const locked = car.need > 0 && done < car.need;
      const row = document.createElement('div');
      row.className = 'garage-row' + (active ? ' active' : '');
      const label = document.createElement('span');
      label.textContent = `${car.name} — ${car.type} — ${car.top} m/s`;
      row.appendChild(label);
      const btn = document.createElement('button');
      if (active) {
        btn.textContent = 'AKTIF';
        btn.disabled = true;
      } else if (owned) {
        btn.textContent = 'Pilih';
        btn.onclick = () => {
          save.activeCarId = car.id;
          if (api.onCarChanged) api.onCarChanged(car.id);
          render();
        };
      } else if (locked) {
        btn.textContent = `Butuh ${car.need} misi`;
        btn.disabled = true;
      } else {
        const p = priceOf(car.price);
        btn.textContent = `Beli $${p}`;
        btn.disabled = save.money < p;
        btn.onclick = () => {
          if (save.money < p) return;
          save.money -= p;
          save.ownedCars.push(car.id);
          save.activeCarId = car.id;
          if (api.onCarChanged) api.onCarChanged(car.id);
          if (api.onSave) api.onSave();
          render();
        };
      }
      row.appendChild(btn);
      listEl.appendChild(row);
    }
    // Upgrade.
    const upTitle = document.createElement('div');
    upTitle.className = 'garage-sub';
    upTitle.textContent = '— Upgrade —';
    listEl.appendChild(upTitle);
    for (const up of UPGRADES) {
      const row = document.createElement('div');
      row.className = 'garage-row';
      const label = document.createElement('span');
      label.textContent = `${up.name} — ${up.desc}`;
      row.appendChild(label);
      const btn = document.createElement('button');
      if (save.upgrades[up.id]) {
        btn.textContent = 'Terpasang';
        btn.disabled = true;
      } else {
        const p = priceOf(up.price);
        btn.textContent = `Beli $${p}`;
        btn.disabled = save.money < p;
        btn.onclick = () => {
          if (save.money < p) return;
          save.money -= p;
          save.upgrades[up.id] = true;
          if (api.onSave) api.onSave();
          render();
        };
      }
      row.appendChild(btn);
      listEl.appendChild(row);
    }
    // Amunisi.
    const ammoRow = document.createElement('div');
    ammoRow.className = 'garage-row';
    const ammoLabel = document.createElement('span');
    ammoLabel.textContent = `Amunisi — Pistol ${save.ammo.pistol} • SMG ${save.ammo.smg}`;
    ammoRow.appendChild(ammoLabel);
    const ammoBtn = document.createElement('button');
    ammoBtn.textContent = 'Isi ulang $50';
    ammoBtn.disabled = save.money < 50;
    ammoBtn.onclick = () => {
      if (save.money < 50) return;
      save.money -= 50;
      save.ammo.pistol = 48;
      save.ammo.smg = 180;
      if (api.onSave) api.onSave();
      render();
    };
    ammoRow.appendChild(ammoBtn);
    listEl.appendChild(ammoRow);
    // Cat.
    paintsEl.innerHTML = '';
    PAINTS.forEach((p, i) => {
      const sw = document.createElement('button');
      sw.className = 'paint-swatch' + (save.paint === i ? ' active' : '');
      sw.style.background = `#${p.color.toString(16).padStart(6, '0')}`;
      sw.title = p.name;
      sw.onclick = () => {
        save.paint = i;
        if (api.onPaint) api.onPaint(i);
        if (api.onSave) api.onSave();
        render();
      };
      paintsEl.appendChild(sw);
    });
  }

  return {
    get isOpen() {
      return open;
    },
    open() {
      open = true;
      render();
      panel.style.display = 'block';
    },
    close() {
      open = false;
      panel.style.display = 'none';
      if (api.onSave) api.onSave();
    },
    render,
  };
}
