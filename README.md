# Kota Cakrawala — Open-World Crime 3D

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Kota Cakrawala** adalah game open-world crime 3D orisinal (three.js, berjalan offline dari file statis) untuk bounty make.fun `gta6-01` — "Make GTA 6". Kota pesisir fiktif yang cerah, bukan GTA dan bukan Rockstar: semua nama, karakter, kendaraan, dan peta dibuat sendiri.

**Cerita:** Raka, kurir muda yang terlilit utang, bekerja untuk **Bu Sari**, pemilik bengkel di sudut kota. Antar paket, kabur dari polisi, menangkan balapan — dan lunasi utangmu sebelum kota ini menelanmu.

## Yang ada di dalam game

- **Kota 3D prosedural** — grid jalan + trotoar + marka & zebra cross, ~100 gedung bervariasi dengan jendela menyala saat senja, lampu jalan, pohon palem, taman, pantai + laut, dan pelabuhan (dermaga, kontainer, crane, kapal kargo). Round 2: **Menara Cakrawala** (landmark tertinggi, cincin neon), **Pasar Cakrawala** (8 kios warna-warni), **Rumah Sakit Cakrawala** (titik respawn), papan neon di gedung-gedung, dan mode **malam neon** (langit gelap, jendela + lampu + neon menyala).
- **Jalan kaki & mengemudi** — third-person, kamera kejar yang halus. Masuk mobil sendiri (**Kancil GT**) atau **curi mobil** warga / lalu lintas (tombol E). Nyawa + lapis baja Raka: polisi yang menabrak mengurangi nyawa; mati = respawn di rumah sakit + denda $50.
- **Lalu lintas hidup** — 18 mobil AI (sedan, pickup, **taksi kuning**, **van pasar**) mengikuti jalan (belok di persimpangan, mengerem kalau terhalang) dan 30 pejalan kaki AI di trotoar (pejalan biasa, pelari, warga tua, aneka topi & warna kulit).
- **Wanted level ★1–5 + polisi** — wanted naik saat menabrak / memukul orang atau menabrak mobil polisi; mobil polisi mengejar dan menabrak; wanted turun perlahan kalau lama tidak berbuat onar. Round 2: **helikopter polisi** (wanted 4–5, rotor + lampu sorot) dan **roadblock** polisi di depan arah gerak (wanted 3+).
- **8 misi berurutan dari Bu Sari** — (1) antar paket ke pelabuhan, (2) kabur dari polisi setelah "paket panas" (wanted 3), (3) balapan pulang, (4) kejar-kejaran tengah malam ke menara (wanted 4 + helikopter), (5) pasar pagi, (6) balapan menara, (7) penyelamatan di pantai, (8) final: balapan keliling kota, utang lunas. Tiap misi: tujuan + timer + hadiah + bintang 1–3, dialog Bu Sari, progres tersimpan (localStorage).
- **Garasi Bu Sari (G)** — beli dengan uang misi: Mesin Turbo (3 level), Lapis Baja (3 level), Nitro Boost (Shift saat mengemudi), dan 8 warna cat Kancil GT.
- **Radio (R)** — 3 stasiun musik prosedural WebAudio: CKW Dangdut 88.4, Pantai Rock 101.2, Senja Lo-Fi 95.6 — ganti stasiun, lagu berganti otomatis.
- **Combat sederhana** — pukul (F) saat jalan kaki, tabrakan mobil, klakson (H).
- **HUD kaya** — uang, wanted (bintang), kecepatan, objektif misi + timer, **tracker 8 misi**, **bar nyawa & lapis baja**, **jam dalam game**, **tampilan radio**, minimap 2D (jalan, pemain, polisi, **helikopter**, **roadblock**, landmark + label distrik, kompas), layar awal / pause / hasil misi / garasi.
- **Suara prosedural (WebAudio)** — mesin, sirene polisi, **rotor helikopter**, pickup, pukulan, tabrakan, jingle misi, denting uang, bunyi upgrade, klakson. Tanpa file audio luar.
- **Waktu dalam game** — siang cerah untuk gameplay, senja untuk cover shot (jendela + lampu kota menyala), malam neon untuk drive shot.
- **Screenshot staging** — `?shot=cover|drive|mission|menu&seed=1` men-stage adegan untuk juri (lihat `shots.json`).

## Cara main

```sh
node serve.ts        # lalu buka http://localhost:8080
```

Atau buka `game/index.html` langsung dari file statis — game berjalan offline, tanpa network request sama sekali (three.js di-vendor di `game/vendor/three.module.min.js`).

| Tombol | Aksi |
|---|---|
| W A S D | Jalan kaki / mengemudi |
| Mouse (drag) | Putar kamera |
| E | Masuk / keluar / curi mobil, bicara Bu Sari |
| F | Pukul |
| Shift | Lari / nitro (kalau dibeli di garasi) |
| Spasi | Rem tangan (drift) |
| H | Klakson (saat mengemudi) |
| R | Radio: nyalakan / ganti stasiun |
| G | Garasi Bu Sari (di depan pintu garasi) |
| Esc / P | Pause |
| M | Bisu |

## Struktur source

```
game/
  index.html            # halaman + HUD + layar menu/pause/hasil
  vendor/three.module.min.js   # three.js r160 (vendored, minified)
  src/
    main.js             # boot, game loop, kamera, masuk/curi mobil, radio+garasi
    city.js             # kota prosedural, langit, siang/senja/malam neon, landmark
    vehicles.js         # pabrik mobil (sport/pickup/sedan/polisi/taksi/van) + fisika + tuning garasi
    traffic.js          # mobil & pejalan kaki AI (ragam kendaraan & warga)
    police.js           # wanted level + pengejaran + helikopter + roadblock
    missions.js         # cerita + 8 misi + beacon tujuan + tracker
    player.js           # Raka jalan kaki + pukulan + nyawa/armour/respawn
    hud.js              # HUD kaya (nyawa, jam, radio, tracker) + minimap 2D
    audio.js            # suara prosedural WebAudio (+ rotor heli, uang, upgrade, klakson)
    radio.js            # 3 stasiun radio prosedural (dangdut / rock / lo-fi)
    garage.js           # garasi Bu Sari: upgrade mesin/baja/nitro/cat
    input.js            # keyboard + mouse (+ R/G/H)
    save.js             # progres di localStorage (8 misi, upgrade, statistik)
    shots.js            # adegan screenshot ?shot=
```

## Screenshot

`1-cover.jpg` — senja, kejar-kejaran polisi wanted ★★★★ + helikopter + roadblock. `2-drive.jpg` — malam neon, mengemudi + radio. `3-mission.jpg` — jalan kaki di Pasar Cakrawala, misi 5 aktif. `4-menu.jpg` — layar awal + progres 3/8 misi.

## Round 2 — apa yang berubah dari round 1

Misi 3 → 8 (rantai Bu Sari berlanjut sampai final "Utang Lunas"), helikopter polisi + roadblock, radio 3 stasiun, garasi upgrade, HUD kaya (nyawa/baja/jam/radio/tracker misi), mode malam neon, Menara/Pasar/Rumah Sakit, taksi & van, 30 pejalan kaki bervariasi, respawn rumah sakit. Semua tetap orisinal & offline.

---

<sub>Entered on [make.fun](https://make.fun/?ref=clever-lark-80&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
