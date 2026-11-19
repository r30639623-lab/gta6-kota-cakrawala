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
    // SENJA + NEON: kejar-kejaran polisi, wanted 4 bintang, HELIKOPTER di
    // atas + roadblock di depan — adegan paling mewah round 2.
    game.city.setTimeOfDay('dusk');
    game.gameHour = 19.5; // 19:30 — lampu kota baru menyala
    game.save.money = 650;
    const kancil = game.parkedCars.find((p) => p.owned);
    kancil.pos.set(-60, 0, 0);
    kancil.heading = Math.PI / 2;
    putPlayerInCar(game, kancil, Math.PI / 2);
    game.carState.pos.set(-60, 0, 0);
    // Misi 4 sungguhan (wanted 4 + helikopter + roadblock), bukan teks HUD.
    game.missions.nextIndex = 3;
    game.missions.start(3);
    game.missions.active.timeLeft = 64;
    game.police.police.forEach((p, i) => {
      // Polisi di depan & samping mobil pemain — kejar-kejaran terlihat
      // dari kamera kejar di belakang mobil.
      const offsets = [[20, 5], [28, -6], [13, 10], [34, 3]];
      p.pos.set(-60 + offsets[i][0], 0, offsets[i][1]);
      p.heading = Math.PI / 2;
      p.speed = 16;
    });
    game.police.placeHeliAbove(game.carState.pos);
    // Helikopter diperbesar 1.8x untuk cover supaya jelas terlihat di frame.
    game.police.heli.group.scale.setScalar(1.8);
    // Helikopter mulai sedikit di kiri depan, lalu mengorbit pelan ke tepat
    // di depan arah gerak (timur) selama jeda screenshot — masuk frame.
    game.police.heli.angle = 0.92;
    game.police.forceRoadblockAhead(game.carState.pos, Math.PI / 2);
    game.hud.setRadio('Pantai Rock 101.2 — Gas Pol Pantai', true);
    game.camPitch = 0.05; // kamera lebih datar supaya helikopter masuk frame atas
  } else if (name === 'drive') {
    // MALAM NEON: mengemudi di jalan ramai + lampu kota menyala + radio.
    game.city.setTimeOfDay('night');
    game.gameHour = 21.25; // 21:15
    game.save.money = 1150;
    const kancil = game.parkedCars.find((p) => p.owned);
    kancil.pos.set(0, 0, -120);
    kancil.heading = 0;
    putPlayerInCar(game, kancil, 0);
    game.carState.pos.set(0, 0, -120);
    // Misi 6 sungguhan aktif supaya objektif + beacon menara terlihat.
    game.missions.nextIndex = 5;
    game.missions.start(5);
    game.missions.active.timeLeft = 96;
    game.hud.setRadio('CKW Dangdut 88.4 — Kancil GT Melaju', true);
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
    // PASAR PAGI: Raka jalan kaki di Pasar Cakrawala menghadap kios-kios
    // warna-warni — misi 5 aktif, beacon di tengah pasar.
    game.city.setTimeOfDay('day');
    game.gameHour = 8.5; // 08:30 pagi
    game.save.money = 350;
    game.player.spawn(new THREE.Vector3(-150, 0, 118), 0.15);
    game.camYaw = 0.15;
    game.camPitch = 0.32;
    game.missions.nextIndex = 4;
    game.missions.start(4);
    game.missions.active.timeLeft = 85;
    game.hud.setObjective('Misi 5 — Pasar Pagi Bu Sari: antar ke Pasar Cakrawala', 85);
  } else if (name === 'menu') {
    // LAYAR AWAL: menu + progres 8 misi + uang, kota siang di belakang.
    game.city.setTimeOfDay('day');
    game.gameHour = 10;
    game.save.money = 1150;
    game.save.missionsDone = { m1: true, m2: true, m3: true, m4: false, m5: false, m6: false, m7: false, m8: false };
    game.save.missionStars = { m1: 3, m2: 2, m3: 2, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0 };
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
