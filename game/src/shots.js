// shots.js — Staging 4 screenshot Kota Cakrawala (round 7, seed 2).
// Membaca ?shot=cover|drive|mission|menu&seed=2 dari URL, menata
// dunia (waktu, posisi, Wanted, helikopter, misi), lalu memberi tahu
// main.js kamera tetap yang dipakai dan kapan scene siap difoto.

export function parseShot() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') || null,
    seed: Number(q.get('seed') || '2') || 2,
  };
}

// Menata dunia untuk satu shot. ctx disediakan main.js:
// { city, player, car, police, missions, save, setClock(h), start() }.
// Mengembalikan { camPos:[x,y,z], camLook:[x,y,z] } untuk kamera tetap,
// atau null bila shot memakai kamera kejar biasa.
export function stageShot(ctx, name) {
  const { city, player, car, police, missions } = ctx;
  if (name === 'cover') {
    // Kejar-kejaran polisi saat senja di jalan Pasar: Wanted 4,
    // helikopter BESAR di frame dengan sorot, roadblock di depan,
    // beacon misi & aula Pasar di latar, HUD penuh. Menara sengaja
    // di luar frame supaya tidak mendominasi; roadblock ditaruh di
    // jalan kosong sebelum area kios supaya tidak tertutup.
    city.setTimeOfDay('dusk');
    ctx.setClock(18.2);
    ctx.start();
    car.teleport(-120, 160, Math.PI);
    car.setSpeed(16);
    police.setWanted(4);
    police.placeRoadblock(-120, 132, 0);
    // Helikopter RATA (level) & utuh di frame: y 12 supaya badannya
    // di atas atap gedung cokelat dan berlatar langit senja (kontras),
    // z 132 (lebih dekat ke kamera) + skala 1.5 supaya besar & jelas
    // terbaca sebagai helikopter. Profil samping tiga-perempat
    // (hidung sedikit menghadap kamera, kaca kokpit terlihat).
    // Jangan pakai lookAt ke bawah — itu yang bikin badan miring tajam
    // & ekor terpotong tepi atas.
    police.placeHeliForShot(-116, 12, 132, { x: -120, y: 2, z: 138 }, 1.5);
    police.heli.rotation.set(0, Math.PI / 2 - 0.3, 0);
    missions.startById('m1');
    // Biarkan polisi mengejar & mendekat sebelum difoto; pejalan kaki
    // di sekitar mobil dipindah supaya tidak menghalangi frame.
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
      camPos: [-108, 8, 164],
      camLook: [-120, 1, 134],
    };
  }
  if (name === 'drive') {
    // Jalan siang yang ramai: mengemudi di jalan utama Pusat.
    city.setTimeOfDay('day');
    ctx.setClock(10.5);
    ctx.start();
    car.teleport(40, 120, 0);
    car.setSpeed(20);
    police.setWanted(0);
    return null; // kamera kejar biasa
  }
  if (name === 'mission') {
    // Raka di dermaga: beacon misi Babak 2 + satu relik emas di frame,
    // kapal & laut di latar. Kamera di selatan kontainer supaya tidak
    // terhalang crane; Raka menghadap kamera.
    city.setTimeOfDay('dusk');
    ctx.setClock(17.6);
    ctx.start();
    missions.startById('m8');
    player.spawn({ x: 244, y: 0, z: 346 }, -2.47);
    police.setWanted(0);
    return {
      camPos: [236, 4, 336],
      camLook: [250, 3, 362],
    };
  }
  if (name === 'menu') {
    // Layar start di depan skyline senja + Menara Cakrawala.
    city.setTimeOfDay('dusk');
    ctx.setClock(18.0);
    return {
      camPos: [120, 55, 190],
      camLook: [0, 25, -30],
    };
  }
  return null;
}
