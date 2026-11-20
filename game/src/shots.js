// shots.js — Staging 4 screenshot (?shot=cover|drive|mission|menu&seed=1).
// Membaca location.search, mengatur kamera/posisi/waktu/wanted per shot,
// lalu set window.__shotReady = true saat scene siap difoto.
import * as THREE from 'three';
import { RELICS } from './collectibles.js';

export function setupShots(game) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return;

  const { city, player, car, police, missions, hud, save, districts } = game;

  function ready(delay = 900) {
    setTimeout(() => { window.__shotReady = true; }, delay);
  }

  function showHud() {
    document.getElementById('hud').classList.add('on');
    document.getElementById('menu-overlay').classList.add('off');
    document.getElementById('pause-overlay').classList.remove('on');
  }

  if (shot === 'cover') {
    // Kejar-kejaran polisi saat senja, wanted ★★★★, heli BESAR, roadblock.
    game.mode = 'main';
    game.setGameTime(18, 12);
    city.setTimeOfDay('senja');
    showHud();
    save.money = 2350;
    car.pos.set(0, 0, 10);
    car.heading = Math.PI;
    car.speed = 12;
    game.driving = true;
    player.mesh.visible = false;
    missions.startById('m2');
    police.setWanted(4);
    // Heli BESAR di frame: kiri atas, putih-biru kontras langit senja.
    police.placeHeliForShot(-17, 21, -16, new THREE.Vector3(0, 2, 0), 2.5);
    // Roadblock di depan mobil.
    const rb = police.roadblocks[0];
    rb.group.position.set(0, 0, -42);
    rb.group.rotation.y = 0;
    rb.group.visible = true;
    rb.active = true;
    rb.timer = 60;
    // Dua mobil polisi mengejar dari samping-belakang mobil.
    const pc0 = police.cars[0];
    pc0.active = true;
    pc0.mesh.visible = true;
    pc0.pos.set(-8, 0, 2);
    pc0.heading = Math.PI;
    const pc1 = police.cars[1];
    pc1.active = true;
    pc1.mesh.visible = true;
    pc1.pos.set(9, 0, -2);
    pc1.heading = Math.PI;
    // Kamera sinematik: rendah di belakang mobil, heli di atas frame.
    game.lockCamera(new THREE.Vector3(9, 6.5, 30), new THREE.Vector3(-1, 4, -30));
    hud.showBanner('★ KEJAR-KEJARAN POLISI ★', 30);
    ready(1100);
    return;
  }

  if (shot === 'drive') {
    // Jalan siang yang ramai di jalan utama.
    game.mode = 'main';
    game.setGameTime(10, 30);
    city.setTimeOfDay('siang');
    showHud();
    car.pos.set(80, 0, 60);
    car.heading = 0;
    car.speed = 9;
    game.driving = true;
    player.mesh.visible = false;
    ready(900);
    return;
  }

  if (shot === 'mission') {
    // Raka di dermaga, beacon misi babak 2 + satu relik emas di frame.
    game.mode = 'main';
    game.setGameTime(17, 40);
    city.setTimeOfDay('senja');
    showHud();
    if (!save.missionsDone.includes('m1')) save.missionsDone = ['m1', 'm2', 'm3', 'm4'];
    missions.startById('m8');
    // Raka di jalan depan kamera (ruang terbuka, tanpa pohon di depannya).
    player.spawn(new THREE.Vector3(216, 0, 320), Math.PI * 0.7);
    game.driving = false;
    const relic = RELICS.find((r) => r.id === 'r9');
    // Kamera mundur + tinggi: Raka utuh di frame bawah, beacon di tengah.
    game.lockCamera(new THREE.Vector3(188, 20, 288), new THREE.Vector3(246, 2, 356));
    hud.showBanner('Misi: Utang Setengah Lunas — ke Dermaga!', 30);
    ready(1100);
    return;
  }

  if (shot === 'menu') {
    // Layar start + progres (12 misi, relik, reputasi distrik).
    game.mode = 'menu';
    if (save.missionsDone.length < 5) save.missionsDone = ['m1', 'm2', 'm3', 'm4', 'm5'];
    if (save.relicsFound.length < 7) save.relicsFound = ['r1', 'r2', 'r5', 'r9', 'r13', 'r17', 'r18'];
    save.money = 1850;
    document.getElementById('menu-overlay').classList.remove('off');
    document.getElementById('hud').classList.remove('on');
    ready(700);
    return;
  }

  ready(800);
}
