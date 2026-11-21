// shots.js — Staging 4 screenshot Kota Cakrawala (round 8 rebuild, seed 4).
// Membaca ?shot=cover|drive|mission|menu&seed=4 dari URL, menata
// dunia (waktu, posisi, Wanted, helikopter, misi), lalu memberi tahu
// main.js kamera tetap yang dipakai dan kapan scene siap difoto.

export function parseShot() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') || null,
    seed: Number(q.get('seed') || '4') || 4,
  };
}

// Menata dunia untuk satu shot. ctx disediakan main.js:
// { city, player, car, police, missions, traffic, dialogue, save,
//   setClock(h), start() }.
// Mengembalikan { camPos:[x,y,z], camLook:[x,y,z] } untuk kamera tetap,
// atau null bila shot memakai kamera kejar biasa.
export function stageShot(ctx, name) {
  const { city, player, car, police, missions, traffic, dialogue } = ctx;
  if (name === 'cover') {
    // Kejar-kejaran polisi saat senja di jalan Pasar: Wanted 4,
    // helikopter BESAR di frame dengan sorot, roadblock di depan,
    // beacon misi & aula Pasar di latar, 2 mobil lalu lintas di frame,
    // HUD penuh. Menara sengaja di luar frame supaya tidak mendominasi.
    city.setTimeOfDay('dusk');
    ctx.setClock(18.2);
    ctx.start();
    car.teleport(-120, 160, Math.PI);
    car.setSpeed(16);
    police.setWanted(4);
    police.placeRoadblock(-120, 132, 0);
    // Helikopter lebih rendah & lebih kecil supaya rotor (11 m, paling
    // lebar) utuh di frame: y 10, skala 1.25, kamera sedikit mundur
    // supaya badan + rotor + sorot semua terbaca.
    police.placeHeliForShot(-130, 13, 126, { x: -120, y: 2, z: 138 }, 1.4);
    police.heli.rotation.set(0, Math.PI / 2 - 0.3, 0);
    missions.startById('m1');
    // Dua mobil lalu lintas parkir di jalan (speed 0) supaya frame ramai.
    if (traffic.cars[0]) {
      traffic.cars[0].horizontal = true;
      traffic.cars[0].street = 120;
      traffic.cars[0].along = -100;
      traffic.cars[0].lane = 3.5;
      traffic.cars[0].speed = 0;
    }
    if (traffic.cars[1]) {
      traffic.cars[1].horizontal = true;
      traffic.cars[1].street = 120;
      traffic.cars[1].along = -140;
      traffic.cars[1].lane = -3.5;
      traffic.cars[1].speed = 0;
    }
    ctx.traffic.scatterPeds(-120, 140, 35);
    for (let i = 0; i < 30; i++) police.update(0.1, car.pos, 16, null);
    police.setWanted(4);
    // Pisahkan mobil polisi jadi formasi rapi & kunci: dua di belakang
    // mobil pemain (kiri/kanan), satu memotong di depan — semua sejajar
    // menghadap utara, tidak bertumpuk, tidak miring.
    police.placeCarsForShot([
      { x: -127, z: 152, heading: Math.PI },
      { x: -113, z: 150, heading: Math.PI },
      { x: -120, z: 141, heading: Math.PI },
    ]);
    return {
      camPos: [-104, 8, 170],
      camLook: [-121, 4, 132],
    };
  }
  if (name === 'drive') {
    // Jalan siang cerah yang ramai: mengemudi di jalan utama Pusat
    // menuju Pantai — palem, gedung warna-warni, lalu lintas padat.
    // Staging: 3 mobil lalu lintas di jalan yang sama di depan pemain
    // + 4 pejalan kaki di trotoar, supaya jalanan terlihat hidup.
    city.setTimeOfDay('day');
    ctx.setClock(10.5);
    ctx.start();
    car.teleport(40, 120, 0);
    car.setSpeed(20);
    police.setWanted(0);
    const driveCars = [
      { horizontal: false, street: 40, along: 155, lane: 3.5, dir: 1, speed: 6 },
      { horizontal: false, street: 40, along: 190, lane: -3.5, dir: -1, speed: 6 },
      { horizontal: true, street: 200, along: 60, lane: 3.5, dir: 1, speed: 6 },
    ];
    driveCars.forEach((cfg, i) => {
      const c = traffic.cars[i];
      if (!c) return;
      Object.assign(c, cfg);
      c.pause = 0;
    });
    const drivePeds = [[32, 160], [48, 190], [34, 230], [48, 260], [30, 300], [50, 320]];
    traffic.peds.slice(0, 6).forEach((p, i) => {
      p.x = drivePeds[i][0];
      p.z = drivePeds[i][1];
    });
    return null; // kamera kejar biasa
  }
  if (name === 'mission') {
    // SIANG CERAH di Dermaga: kamera dari PANTAI di selatan, menghadap
    // utara — pasir di depan, Raka + beacon misi Babak 2 + 2 mobil polisi
    // di tengah, kapal & laut di latar, crane di tepi kiri-kanan (bukan
    // menutupi frame). Dialog berwajah Bu Sari terbuka di bawah layar.
    city.setTimeOfDay('day');
    ctx.setClock(10.0);
    ctx.start();
    missions.startById('m8');
    // Raka di (246,348): 12,6 m dari target (250,360) — di luar radius
    // selesai 9 m, jadi misi tidak langsung selesai sendiri saat staging.
    player.spawn({ x: 246, y: 0, z: 348 }, 3.07);
    police.setWanted(2);
    for (let i = 0; i < 30; i++) police.update(0.1, player.pos, 0, null);
    police.setWanted(2);
    // Satu update lagi SETELAH setWanted: heat sempat turun selama 30
    // iterasi tadi dan wanted turun ke 1, sehingga satu mobil ter-pop;
    // update ini membuat ulang mobil kedua sebelum diformasi.
    police.update(0.1, player.pos, 0, null);
    police.placeCarsForShot([
      { x: 238, z: 358, heading: 2.2 },
      { x: 262, z: 358, heading: -2.6 },
    ]);
    const missionPeds = [[236, 340], [264, 342], [228, 372]];
    traffic.peds.slice(0, 3).forEach((p, i) => {
      p.x = missionPeds[i][0];
      p.z = missionPeds[i][1];
    });
    const def = missions.active ? missions.active.def : null;
    if (def && dialogue) dialogue.show('Bu Sari', def.line, 12000);
    return {
      camPos: [244, 4, 330],
      camLook: [250, 2, 368],
    };
  }
  if (name === 'menu') {
    // Layar start di depan skyline SIANG CERAH + Menara Cakrawala.
    city.setTimeOfDay('day');
    ctx.setClock(10.0);
    return {
      camPos: [120, 55, 190],
      camLook: [0, 25, -30],
    };
  }
  return null;
}
