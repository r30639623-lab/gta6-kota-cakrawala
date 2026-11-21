# Kota Cakrawala

![make.fun](https://make.fun/badge/gta6-01.svg)
![Rank](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/rank.svg)
![Reward](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/reward.svg)

Game open-world crime original di kota pesisir fiktif Indonesia, dibuat untuk [make.fun GTA 6 bounty](https://make.fun/bounty/gta6-01). Semua nama, karakter, kendaraan, dan cerita buatan sendiri — bukan GTA Rockstar.

## Cerita

Raka, pemuda baru di Kota Cakrawala, bekerja untuk Bu Sari di bengkelnya. Dari antar paket sampai jadi legenda jalanan: 12 misi dalam 3 babak, utang yang harus dilunasi, dan polisi yang makin galak di setiap babak.

## Fitur (Round 7)

- **Kota 3D prosedural** (three.js, offline, tanpa network): ~100 gedung berjendela menyala, Menara Cakrawala 86 m, Pasar, Rumah Sakit, Pelabuhan dengan crane & kapal, pantai & laut, 3 garasi.
- **Poles visual round 7**: bayangan matahari PCF yang halus, langit gradien senja/malam, jendela menyala saat gelap, lampu jalan, neon, kabut, awan bergerak — dan staging cover yang lebih dramatis.
- **12 misi Bu Sari dalam 3 babak** (total hadiah $6.850): Babak 1 "Awal di Cakrawala", Babak 2 "Utang & Jalanan", Babak 3 "Legenda Cakrawala" (final + bonus $500).
- **20 Relik Cakrawala**: kolektibel emas melayang di 5 area kota, +$50 & +5 reputasi tiap relik; semua 20 = bonus $500.
- **10 mobil original + 3 garasi**: Kancil GT sampai Garuda Supercar (butuh 8 misi), upgrade Turbo/Lapis Baja/Nitro, 8 warna cat, isi ulang amunisi.
- **Reputasi 5 distrik** (Pusat, Pasar, Pelabuhan, Pantai, Bengkel): naik saat misi/reliK selesai di distrik itu, turun saat berbuat onar. Rep ≥ 70 = diskon 20% di garasi distrik itu; rep ≤ 25 = Wanted naik 2x lebih cepat di distrik itu.
- **Wanted ★1–5**: mobil polisi mengejar, roadblock di ★3, helikopter polisi dengan sorot di ★4, dan di ★5 empat mobil + helikopter + roadblock lebih sering + polisi lebih cepat. Heat turun perlahan saat pemain tenang.
- **Combat**: roda senjata radial (Tinju, Pistol, SMG), amunisi, serangan ke pejalan kaki/polisi menaikkan Wanted.
- **Lalu lintas hidup**: 18 mobil AI + 30 pejalan kaki, mobil bisa dicuri (Wanted +1).
- **Radio prosedural**: 3 stasiun WebAudio (Cakrawala FM, Senja 88, Dangdut Pantai), suara mesin/sirene/tabrak/cash prosedural.
- **HUD lengkap**: uang, nyawa, baja, Wanted, kecepatan, jam, radio, tracker 12 misi, counter relik, distrik saat ini, minimap 2D berlabel + kompas.
- **Save/load** localStorage (key `kota-cakrawala-save-v4`): uang, misi, relik, reputasi, mobil, upgrade, cat, amunisi.

## Cara main

Jalankan `node serve.ts` lalu buka http://localhost:8080 — atau buka `game/index.html` lewat server statis apa pun. Semua file lokal, tanpa internet.

| Kontrol | Aksi |
|---|---|
| WASD / panah | Jalan / mengemudi |
| E | Masuk/keluar mobil, bicara Bu Sari, curi mobil AI |
| F / klik kiri | Pukul / tembak |
| Q (tahan) / Tab | Roda senjata, 1-3 pilih senjata |
| G | Garasi (beli mobil, upgrade, cat, amunisi) |
| R | Ganti stasiun radio |
| H | Klakson |
| Shift | Nitro (bila terpasang) |
| Spasi | Rem tangan |
| Esc | Jeda |

## Teknologi

three.js r160 (vendored di `game/vendor/`), Node 22 stdlib-only untuk `main.ts` & `serve.ts`. Tidak ada build step, tidak ada aset luar.
