# Kota Cakrawala — Open-World Crime Game

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Entri untuk [Make GTA 6 di make.fun](https://make.fun/bounty/gta6-01).

Game open-world crime 3D original yang dibuat dari nol dengan three.js: kota
pantai prosedural bernama **Kota Cakrawala**, dimainkan offline di browser
dari file statis, tanpa network request.

## Cerita

Raka, pemuda kota pantai, bekerja untuk **Bu Sari** — pemilik bengkel di
ujung kota. Delapan misi membawanya dari antar paket sampai pelunasan utang
terakhir, sambil kabur dari polisi yang mengejar dengan mobil, roadblock,
dan helikopter.

## Fitur

- **Kota prosedural**: ~100 gedung berjendela menyala, grid jalan + zebra
  cross, lampu jalan, pohon palem, pantai + laut, pelabuhan (dermaga,
  kontainer, crane, kapal), Menara Cakrawala (86 m), Pasar Cakrawala,
  Rumah Sakit (respawn), dan bengkel Bu Sari.
- **Siang / senja / malam neon** dengan jam dalam game yang berjalan.
- **Kendaraan**: Kancil GT dan Badak Pickup; curi mobil apa pun di jalan
  (tombol E). 18 mobil AI + 30 pejalan kaki.
- **Polisi & wanted ★1–5**: mobil patroli mengejar dan menabrak, roadblock
  di wanted 3+, helikopter polisi dengan lampu sorot di wanted 4–5.
- **8 misi Bu Sari** (total $3.950): antar paket, kabur dari kejaran,
  balapan, penyelamatan pantai, sampai final "Utang Lunas".
- **Combat + weapon wheel**: tahan Q (atau Tab) untuk roda senjata radial —
  Tinju, Pistol, SMG. Serang dengan F atau klik kiri.
- **HUD lengkap**: uang, bar nyawa + armor, wanted, kecepatan, jam, radio,
  tracker 8 misi, minimap 2D berlabel + kompas, banner misi, prompt konteks.
- **Radio**: 3 stasiun musik prosedural WebAudio (tombol R).
- **Garasi** (tombol G): Mesin Turbo, Lapis Baja, Nitro, 8 warna cat,
  isi ulang amunisi.
- **Suara prosedural**: mesin, sirene, klakson, tembakan, tabrakan.
- **Save/load** localStorage (uang, progres misi, upgrade, cat, amunisi)
  dan layar start / pause.

## Cara main

```sh
node serve.ts
# buka http://localhost:8080
```

Klik **MULAI MAIN**, temui Bu Sari di bengkel (tanda oranye), tekan E untuk
mengambil misi, lalu ikuti beacon kuning di peta.

## Kontrol

| Tombol | Aksi |
| --- | --- |
| WASD / panah | Jalan kaki / mengemudi |
| E | Masuk / keluar mobil, curi mobil, bicara Bu Sari |
| Spasi | Rem tangan |
| Shift | Lari (jalan kaki) / Nitro (mobil, jika dibeli) |
| F / klik kiri | Pukul / tembak |
| Q (tahan) / Tab | Roda senjata (pilih 1–3 atau klik) |
| R | Ganti stasiun radio |
| G | Garasi / upgrade |
| H | Klakson |
| Esc | Jeda / lanjut |

## Struktur kode

- `game/src/main.js` — bootstrap, game loop, mode menu/main/pause
- `game/src/city.js` — bangun kota prosedural + landmark
- `game/src/player.js` — Raka jalan kaki + kamera
- `game/src/vehicles.js` — definisi + mobil pemain
- `game/src/traffic.js` — AI lalu lintas + pejalan kaki
- `game/src/police.js` — wanted, kejar-kejaran, roadblock, helikopter
- `game/src/missions.js` — 8 misi Bu Sari
- `game/src/hud.js` — HUD, minimap, kompas, tracker misi
- `game/src/radio.js` — 3 stasiun musik prosedural
- `game/src/garage.js` — upgrade + cat
- `game/src/weapons.js` — weapon wheel + combat
- `game/src/audio.js` — efek suara prosedural
- `game/src/input.js` — keyboard / mouse
- `game/src/save.js` — localStorage
- `game/src/shots.js` — staging screenshot

## Lisensi

MIT — lihat `LICENSE`.
