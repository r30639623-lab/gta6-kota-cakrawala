// garage.js — Panel garasi: beli/pilih 10 mobil, upgrade, 8 warna cat,
// isi amunisi, daftar 3 garasi. Harga didiskon 20% kalau rep distrik >= 70.
import { CARS, PAINTS, carById } from './vehicles.js';

export function createGarage(save, districts, onApply) {
  const panel = document.getElementById('garage-panel');
  const listEl = document.getElementById('garage-list');
  const paintsEl = document.getElementById('garage-paints');
  const moneyEl = document.getElementById('garage-money');
  const discountEl = document.getElementById('garage-discount');

  let open = false;
  let playerPos = { x: 0, z: 0 };

  function discount() {
    return districts.discountAt(playerPos.x, playerPos.z);
  }

  function price(p) {
    return Math.round(p * (1 - discount()));
  }

  function render() {
    moneyEl.textContent = `$${save.money} • Mobil aktif: ${carById(save.activeCarId).name}`;
    const d = discount();
    const dName = districts.at ? districts.list().find((v) => v.id === districts.at(playerPos.x, playerPos.z)) : null;
    discountEl.textContent = d > 0
      ? `Diskon 20% aktif di distrik ${dName ? dName.name : ''} (reputasi ≥ 70)!`
      : `Reputasi distrik ${dName ? dName.name : ''}: ${dName ? dName.rep : 50} — capai 70 untuk diskon 20% harga garasi/mobil.`;
    listEl.innerHTML = '';
    for (const car of CARS) {
      const owned = save.ownedCars.includes(car.id);
      const active = save.activeCarId === car.id;
      const locked = !owned && save.missionsDone.length < car.needMissions;
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `${car.name} — ${car.kind} • ${car.topSpeed} m/s${car.needMissions ? ` • butuh ${car.needMissions} misi` : ''}`;
      const btn = document.createElement('button');
      if (active) {
        btn.textContent = '✓ Aktif';
        btn.disabled = true;
      } else if (owned) {
        btn.textContent = 'Pilih';
        btn.onclick = () => { save.activeCarId = car.id; onApply('select', car); render(); };
      } else if (locked) {
        btn.textContent = `Terkunci (${car.needMissions} misi)`;
        btn.disabled = true;
      } else {
        btn.textContent = `Beli $${price(car.price)}`;
        btn.onclick = () => {
          const p = price(car.price);
          if (save.money < p) return;
          save.money -= p;
          save.ownedCars.push(car.id);
          save.activeCarId = car.id;
          onApply('buy', car);
          render();
        };
      }
      li.appendChild(label);
      li.appendChild(btn);
      listEl.appendChild(li);
    }
    paintsEl.innerHTML = '';
    PAINTS.forEach((p, i) => {
      const dot = document.createElement('div');
      dot.className = 'paint-dot' + (save.paintIndex === i ? ' sel' : '');
      dot.title = p.name;
      dot.style.background = `#${p.color.toString(16).padStart(6, '0')}`;
      dot.onclick = () => { save.paintIndex = i; onApply('paint', i); render(); };
      paintsEl.appendChild(dot);
    });
  }

  function bindButton(id, fn) {
    const el = document.getElementById(id);
    if (el) el.onclick = fn;
  }
  bindButton('btn-turbo', () => {
    if (save.upgrades.turbo) return;
    const p = price(400);
    if (save.money < p) return;
    save.money -= p; save.upgrades.turbo = true; onApply('upgrade', 'turbo'); render();
  });
  bindButton('btn-armor-up', () => {
    if (save.upgrades.armorUp) return;
    const p = price(350);
    if (save.money < p) return;
    save.money -= p; save.upgrades.armorUp = true; onApply('upgrade', 'armorUp'); render();
  });
  bindButton('btn-nitro', () => {
    if (save.upgrades.nitro) return;
    const p = price(300);
    if (save.money < p) return;
    save.money -= p; save.upgrades.nitro = true; onApply('upgrade', 'nitro'); render();
  });
  bindButton('btn-ammo', () => {
    if (save.money < 50) return;
    save.money -= 50;
    save.ammo.pistol = Math.min(200, save.ammo.pistol + 60);
    save.ammo.smg = Math.min(300, save.ammo.smg + 90);
    onApply('ammo', null);
    render();
  });

  return {
    get isOpen() { return open; },
    openAt(pos) {
      playerPos = { x: pos.x, z: pos.z };
      open = true;
      panel.classList.add('on');
      render();
    },
    close() {
      open = false;
      panel.classList.remove('on');
    },
    toggle(pos) {
      if (open) this.close();
      else this.openAt(pos);
    },
    render,
  };
}
