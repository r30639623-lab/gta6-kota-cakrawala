// shots.js — Adegan screenshot ?shot=<nama>&seed=1 untuk juri make.fun.
// Setiap shot men-stage keadaan game yang nyata (bukan gambar palsu):
// cover = senja + kejar-kejaran polisi wanted 3, drive = siang mengemudi di
// jalan ramai, mission = jalan kaki di pelabuhan dengan misi aktif,
// menu = layar awal dengan progres. Kamera diposisikan sinematik.
import * as THREE from 'three';

/** Tempatkan pemain di dalam mobil tertentu lalu set kamera kejar. */
function putPlayerInCar(game, carEntry, heading) {
  game._enterCar(carEntry);
  game.carState.heading = heading;
  game.carState.speed = 14;
  game.currentCar.car.position.copy(game.carState.pos);
  game.currentCar.car.rotation.y = heading;
  game.camYaw = heading;
  game.camPitch = 0.22;
}

export function applyShot(game, name) {
  // Semua shot dimulai dari layar permainan (tanpa menu), HUD menyala.
  game.menuEl.classList.add('hidden');
  game.mode = 'playing';
  game.hud.setMoney(game.save.money);

  if (name === 'cover') {
    // SENJA: kejar-kejaran polisi, wanted 3 bintang, lampu kota menyala.
    game.city.setTimeOfDay('dusk');
    game.save.money = 400;
    const kancil = game.parkedCars.find((p) => p.owned);
    kancil.pos.set(-60, 0, 0);
    kancil.heading = Math.PI / 2;
    putPlayerInCar(game, kancil, Math.PI / 2);
    game.carState.pos.set(-60, 0, 0);
    // Misi 2 sungguhan (wanted 3 + polisi mengejar), bukan sekadar teks HUD.
    game.missions.nextIndex = 1;
    game.missions.start(1);
    game.missions.active.timeLeft = 52;
    game.police.police.forEach((p, i) => {
      // Polisi di depan & samping mobil pemain — kejar-kejaran terlihat
      // dari kamera kejar di belakang mobil.
      const offsets = [[20, 5], [28, -6], [13, 10]];
      p.pos.set(-60 + offsets[i][0], 0, offsets[i][1]);
      p.heading = Math.PI / 2;
      p.speed = 16;
    });
    game.camPitch = 0.26;
  } else if (name === 'drive') {
    // SIANG: mengemudi di jalan ramai + lalu lintas + pejalan kaki.
    game.city.setTimeOfDay('day');
    game.save.money = 150;
    const kancil = game.parkedCars.find((p) => p.owned);
    kancil.pos.set(0, 0, -120);
    kancil.heading = 0;
    putPlayerInCar(game, kancil, 0);
    game.carState.pos.set(0, 0, -120);
    // Misi 1 sungguhan aktif supaya objektif + beacon pelabuhan terlihat.
    game.missions.nextIndex = 0;
    game.missions.start(0);
    game.missions.active.timeLeft = 78;
    // Lalu lintas di depan mobil pemain (jalan x=0, searah) + satu lawan arah.
    const ahead = [
      { z: -88, lane: 3.4, heading: 0 },
      { z: -58, lane: 3.4, heading: 0 },
      { z: -28, lane: -3.4, heading: Math.PI },
    ];
    game.traffic.cars.slice(0, 3).forEach((c, i) => {
      c.axis = 'z';
      c.line = 0;
      c.lane = ahead[i].lane;
      c.heading = ahead[i].heading;
      c.dir = ahead[i].heading === 0 ? 1 : -1;
      c.pos.set(0 + ahead[i].lane, 0, ahead[i].z);
      c.speed = 9;
      c.car.userData.speed = 9;
    });
    game.camPitch = 0.38;
  } else if (name === 'mission') {
    // PELABUHAN: Raka jalan kaki di atas dermaga menghadap beacon misi di
    // ujung dermaga — kontainer + crane + kapal di belakangnya.
    game.city.setTimeOfDay('day');
    game.save.money = 0;
    game.player.spawn(new THREE.Vector3(108, 0, 330), 0.93);
    game.camYaw = 0.93;
    game.camPitch = 0.32;
    game.missions.nextIndex = 0;
    game.missions.start(0);
    game.missions.active.timeLeft = 82;
    game.hud.setObjective('Misi 1 — Paket Bu Sari: antar paket ke Dermaga Pelabuhan', 82);
  } else if (name === 'menu') {
    // LAYAR AWAL: menu + progres + uang, kota siang di belakang.
    game.city.setTimeOfDay('day');
    game.save.money = 400;
    game.save.missionsDone = { m1: true, m2: false, m3: false };
    game.save.missionStars = { m1: 2, m2: 0, m3: 0 };
    game._refreshMenuProgress();
    game.mode = 'menu';
    game.menuEl.classList.remove('hidden');
    // Kamera orbit rendah supaya kota & pantai terlihat dari menu.
    game.elapsed = 12;
  } else {
    game.city.setTimeOfDay('day');
  }

  // Biarkan dunia "bernapas" sebentar sebelum screenshot: lalu lintas &
  // pejalan kaki bergerak ke posisi natural, kamera settle.
  for (let i = 0; i < 90; i++) {
    game.traffic.update(1 / 60, game.driving ? game.carState.pos : game.player.pos);
    game.city.update(1 / 60, i / 60);
  }
  game.hud.setMoney(game.save.money);
  // Sembunyikan toast misi supaya tidak menutupi tengah layar di screenshot
  // (objektif misi tetap terlihat di panel kiri atas).
  game.hud.toastTimer = 0;
  game.hud.toastEl.style.opacity = '0';
  window.__shotReady = true;
}
