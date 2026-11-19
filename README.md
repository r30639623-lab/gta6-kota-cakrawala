# Kota Cakrawala — Open-World Crime 3D

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Kota Cakrawala** adalah game open-world crime 3D orisinal (three.js, berjalan offline dari file statis) untuk bounty make.fun `gta6-01` — "Make GTA 6". Kota pesisir fiktif yang cerah, bukan GTA dan bukan Rockstar: semua nama, karakter, kendaraan, dan peta dibuat sendiri.

**Cerita:** Raka, kurir muda yang terlilit utang, bekerja untuk **Bu Sari**, pemilik bengkel di sudut kota. Antar paket, kabur dari polisi, menangkan balapan — dan lunasi utangmu sebelum kota ini menelanmu.

## Yang ada di dalam game

- **Kota 3D prosedural** — grid jalan + trotoar + marka & zebra cross, ~100 gedung bervariasi dengan jendela menyala saat senja, lampu jalan, pohon palem, taman, pantai + laut, dan pelabuhan (dermaga, kontainer, crane, kapal kargo).
- **Jalan kaki & mengemudi** — third-person, kamera kejar yang halus. Masuk mobil sendiri (**Kancil GT**) atau **curi mobil** warga / lalu lintas (tombol E).
- **Lalu lintas hidup** — 14 mobil AI mengikuti jalan (belok di persimpangan, mengerem kalau terhalang) dan 22 pejalan kaki AI di trotoar.
- **Wanted level ★1–5 + polisi** — wanted naik saat menabrak / memukul orang atau menabrak mobil polisi; mobil polisi mengejar dan menabrak; wanted turun perlahan kalau lama tidak berbuat onar.
- **3 misi berurutan dari Bu Sari** — (1) antar paket ke pelabuhan sebelum waktu habis, (2) kabur dari polisi setelah mengambil "paket panas" (wanted 3), (3) balapan melewati 3 checkpoint kembali ke bengkel. Hadiah uang + bintang 1–3 per misi, progres tersimpan (localStorage).
- **Combat sederhana** — pukul (F) saat jalan kaki, tabrakan mobil.
- **HUD profesional** — uang, wanted (bintang), kecepatan, objektif misi + timer, minimap 2D (jalan, pemain, polisi, lalu lintas, penanda misi), layar awal / pause / hasil misi.
- **Suara prosedural (WebAudio)** — mesin, sirene polisi, pickup, pukulan, tabrakan, jingle misi. Tanpa file audio luar.
- **Waktu dalam game** — siang cerah untuk gameplay, senja untuk cover shot (jendela + lampu kota menyala).
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
| Shift | Lari |
| Spasi | Rem tangan (drift) |
| Esc / P | Pause |
| M | Bisu |

## Struktur source

```
game/
  index.html            # halaman + HUD + layar menu/pause/hasil
  vendor/three.module.min.js   # three.js r160 (vendored, minified)
  src/
    main.js             # boot, game loop, kamera, masuk/curi mobil
    city.js             # kota prosedural, langit, senja/siang
    vehicles.js         # pabrik mobil + fisika arcade + debu drift
    traffic.js          # mobil & pejalan kaki AI
    police.js           # wanted level + pengejaran polisi
    missions.js         # cerita + 3 misi + beacon tujuan
    player.js           # Raka jalan kaki + pukulan
    hud.js              # HUD + minimap 2D
    audio.js            # suara prosedural WebAudio
    input.js            # keyboard + mouse
    save.js             # progres di localStorage
    shots.js            # adegan screenshot ?shot=
```

## Screenshot

`1-cover.jpg` — senja, kejar-kejaran polisi, wanted ★★★. `2-drive.jpg` — siang, mengemudi di jalan ramai. `3-mission.jpg` — jalan kaki di pelabuhan, misi antar paket aktif. `4-menu.jpg` — layar awal + progres.

---

<sub>Entered on [make.fun](https://make.fun/?ref=clever-lark-80&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
