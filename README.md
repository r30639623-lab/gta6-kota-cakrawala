# Kota Cakrawala

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Game open-world kriminal 3D yang dibuat untuk bounty [gta6-01 di make.fun](https://make.fun/bounty/gta6-01).

## Tentang game ini

Kota Cakrawala adalah kota fiktif di tepi laut yang hidup siang dan malam.
Jalanannya ramai, polisinya galak, dan setiap sudutnya menyimpan peluang —
atau masalah. Semua nama, tempat, karakter, dan kendaraan di game ini
adalah karya orisinal; game ini bukan bagian dari seri GTA Rockstar dan
tidak memakai aset Rockstar apa pun.

Game berjalan sepenuhnya offline di browser, dibangun dengan three.js r160,
tanpa permintaan jaringan sama sekali. Kota, lalu lintas, dan suaranya
dibangkitkan secara prosedural dari kode.

## Cerita

Raka baru saja kembali ke Kota Cakrawala dengan kantong kosong dan satu
utang besar. Satu-satunya orang yang masih mau menolongnya adalah
Bu Sari, pemilik bengkel di pinggir kota. Bu Sari bersedia menghapus
utang Raka — dengan satu syarat: Raka harus menyelesaikan delapan
pekerjaan untuknya, dari mengantar paket sampai balapan tengah malam
dan penyelamatan di pantai.

Selesaikan kedelapan misi itu, kumpulkan hadiahnya, dan lunasi utangmu.
Tapi hati-hati: semakin berani aksimu, semakin tinggi bintang buronanmu,
dan polisi Kota Cakrawala tidak kenal ampun.

## Fitur

- **Kota prosedural 3D** — sekitar 100 gedung dengan jendela menyala,
  jaringan jalan lengkap dengan marka dan zebra cross, lampu jalan,
  pohon palem, pantai dan laut, pelabuhan dengan dermaga, kontainer,
  crane, dan kapal, plus landmark: Menara Cakrawala (86 m),
  Pasar Cakrawala, bengkel Bu Sari, dan Rumah Sakit.
- **Siklus siang dan malam** — langit gradien dengan awan, mode siang,
  senja, dan malam neon.
- **8 misi Bu Sari** — masing-masing dengan tujuan, batas waktu, dan
  hadiah uang. Total hadiah seluruh misi: $3.950.
- **Kendaraan** — kendarai Kancil GT dan Badak Pickup, atau curi mobil
  lain yang melintas di jalan. Mengemudi arcade dengan kamera kejar.
- **Lalu lintas hidup** — 18 mobil AI dan 30 pejalan kaki AI yang
  bergerak di jalanan kota.
- **Polisi dan wanted ★1–5** — polisi mengejar dan menabrak mobilmu,
  roadblock menghadang mulai wanted 3, dan helikopter polisi
  mengorbit dengan lampu sorot mulai wanted 4. Tabrakan merusak
  mobil; kalau mobilmu hancur, kamu respawn di Rumah Sakit dan
  dikenai denda $50.
- **HUD lengkap** — uang, bar nyawa dan bar lapis baja, bintang
  wanted, kecepatan (km/h), jam dalam game, stasiun radio yang sedang
  diputar, tracker 8 misi, minimap 2D berlabel (Menara, Pasar, Pantai,
  Rumah Sakit) dengan kompas, banner tujuan misi dan timer, serta
  prompt konteks.
- **Radio** — 3 stasiun musik prosedural berbasis WebAudio.
- **Garasi dan upgrade** — Mesin Turbo, Lapis Baja, Nitro, dan 8 warna
  cat untuk mobilmu.
- **Weapon wheel** — tahan Q (atau tekan Tab) untuk membuka roda senjata
  radial, lalu pilih dengan mouse atau tombol angka 1–3: 1 Tinju,
  2 Pistol, 3 SMG. Amunisi bisa diisi ulang di garasi.
- **Suara prosedural** — mesin, sirene, radio, dan efek suara lainnya
  dibuat dengan WebAudio, tanpa file audio eksternal.
- **Save otomatis** — uang, progres misi, dan upgrade garasi tersimpan
  di localStorage. Ada layar start, pause, dan menu.

### Daftar misi

| # | Misi | Hadiah |
|---|------|--------|
| 1 | Antar Paket Bu Sari | $150 |
| 2 | Kabur Paket Panas | $250 |
| 3 | Balapan Balapan Pulang | $400 |
| 4 | Kabur Kejar-Kejaran Tengah Malam | $500 |
| 5 | Antar Pasar Pagi Bu Sari | $350 |
| 6 | Balapan Balapan Menara | $600 |
| 7 | Selamatkan Penyelamatan di Pantai | $550 |
| 8 | Final: Utang Lunas | $1.000 |

## Cara main

Butuh Node.js. Dari folder root repo:

```bash
node serve.ts
```

Lalu buka di browser:

```
http://localhost:8080
```

Tidak perlu build dan tidak perlu koneksi internet — semua file
disajikan secara lokal dari folder `game/`.

## Kontrol

| Tombol | Aksi |
|--------|------|
| W A S D | Jalan / mengemudi |
| E | Masuk / keluar mobil |
| Spasi | Rem tangan |
| F | Pukul / serang |
| Q (tahan) / Tab | Buka weapon wheel |
| 1 / 2 / 3 | Pilih senjata (Tinju / Pistol / SMG) |
| Klik kiri | Serang dengan senjata terpilih |
| R | Ganti stasiun radio |
| G | Buka garasi / upgrade |
| H | Klakson |
| Esc | Pause / menu |

## Struktur kode

Semua kode game ada di `game/src/`, satu file satu tanggung jawab:

- `main.js` — bootstrap, game loop, dan mode (menu / main / pause)
- `city.js` — membangun kota: gedung, jalan, pantai, pelabuhan, landmark
- `player.js` — karakter jalan kaki dan kamera
- `vehicles.js` — definisi dan spawn mobil pemain dan AI
- `traffic.js` — AI lalu lintas dan pejalan kaki
- `police.js` — sistem wanted, kejar-kejaran, roadblock, helikopter
- `missions.js` — 8 misi Bu Sari: definisi, logika, timer, dan reward
- `hud.js` — semua elemen HUD, minimap, kompas, dan tracker misi
- `radio.js` — 3 stasiun musik prosedural
- `garage.js` — upgrade dan cat mobil
- `weapons.js` — weapon wheel dan combat
- `audio.js` — efek suara prosedural (mesin, sirene, tabrakan)
- `input.js` — keyboard dan mouse
- `save.js` — simpan dan muat dari localStorage
- `shots.js` — staging untuk screenshot (membaca `location.search`)

`game/index.html` memuat three.js dari `game/vendor/` lewat import map
dan menjalankan `./src/main.js` sebagai module. Folder `game/vendor/`
berisi three.js r160 dan helper make.fun — jangan diubah.

## Lisensi

MIT — lihat file `LICENSE` untuk detail lengkap.
