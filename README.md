# Kota Cakrawala

![make.fun](https://make.fun/badge/gta6-01.svg)
![Rank](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/rank.svg)
![Reward](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/reward.svg)

Game open-world crime original di kota pesisir fiktif Indonesia, dibuat untuk [make.fun GTA 6 bounty](https://make.fun/bounty/gta6-01). Semua nama, karakter, kendaraan, dan cerita buatan sendiri — bukan GTA Rockstar.

## Cerita

Raka, pemuda baru di Kota Cakrawala, bekerja untuk Bu Sari di bengkelnya. Dari antar paket sampai jadi legenda jalanan: 12 misi dalam 3 babak, utang yang harus dilunasi, kru bengkel yang membantunya, dan polisi yang makin galak di setiap babak.

## Fitur (Round 8 — rebuild)

- **Siang cerah yang ramai**: siklus siang–senja–malam, matahari terik di pantai, palem di tepi jalan, gedung warna-warni, 28 mobil AI + 64 pejalan kaki — jalanan terasa hidup sejak 30 detik pertama.
- **Kru Bu Sari (3 orang) + ability aktif**: Yoga si Montir (Z — Perbaiki Cepat, +60 baja), Lia si Supir (X — Ganti Plat, Wanted turun 2), Bima si Pengintai (C — Mata Elang, tandai polisi di minimap 20 detik). Cooldown tampil di HUD.
- **Panel dispatch polisi**: unit bernama + peran + jarak live (PATROLI-07 Penghadang, ELANG-1 Penembak, HELI-1 Udara) — kejar-kejaran terasa hidup, bukan sekadar bintang.
- **HP in-game (tombol P)**: Peta besar + waypoint (klik untuk menandai tujuan), daftar Job sampingan, Bank (uang & total penghasilan), dan Pesan dari Bu Sari & kru.
- **Side job + balapan jalanan**: 3 job antar (Pasar, Dermaga, Menara) + "Piala Pantai Cakrawala", balapan 5 checkpoint dengan timer dan hadiah $500.
- **Dialog misi berwajah**: portrait Bu Sari, Raka, dan kru digambar di kanvas saat misi dimulai dan selesai — cerita terasa punya wajah.
- **Kota 3D prosedural** (three.js, offline, tanpa network): ~100 gedung berjendela menyala, Menara Cakrawala 86 m, Pasar, Rumah Sakit, Pelabuhan dengan crane & kapal, pantai & laut, payung pantai, 3 garasi.
- **12 misi Bu Sari dalam 3 babak** (total hadiah $6.850): Babak 1 "Awal di Cakrawala", Babak 2 "Utang & Jalanan", Babak 3 "Legenda Cakrawala" (final + bonus $500).
- **20 Relik Cakrawala**: kolektibel emas melayang di 5 area kota, +$50 & +5 reputasi tiap relik; semua 20 = bonus $500.
- **12 mobil original + 3 garasi**: Kancil GT sampai Garuda Supercar (butuh 8 misi), ditambah Taksi Cakrawala & Singa Muscle; upgrade Turbo/Lapis Baja/Nitro, 8 warna cat, isi ulang amunisi.
- **Reputasi 5 distrik** (Pusat, Pasar, Pelabuhan, Pantai, Bengkel): naik saat misi/relik selesai di distrik itu, turun saat berbuat onar. Rep ≥ 70 = diskon 20% di garasi distrik itu; rep ≤ 25 = Wanted naik 2x lebih cepat di distrik itu.
- **Wanted ★1–5**: mobil polisi mengejar, roadblock di ★3, helikopter polisi dengan sorot di ★4, dan di ★5 empat mobil + helikopter + roadblock lebih sering + polisi lebih cepat. Heat turun perlahan saat pemain tenang.
- **Combat**: roda senjata radial (Tinju, Pistol, SMG, Senapan), amunisi, serangan ke pejalan kaki/polisi menaikkan Wanted.
- **Lalu lintas hidup**: mobil bisa dicuri (Wanted +1), klakson, nitro, rem tangan.
- **Radio prosedural**: 4 stasiun WebAudio (Cakrawala FM, Senja 88, Dangdut Pantai, Keroncong Senja), suara mesin/sirene/tabrak/cash prosedural.
- **HUD lengkap**: uang, nyawa, baja, Wanted, kecepatan, jam, radio, tracker 12 misi, counter relik, distrik saat ini, minimap 2D berlabel + kompas, panel dispatch, bar kru.
- **Save/load** localStorage (key `kota-cakrawala-save-v4`): uang, misi, relik, reputasi, mobil, upgrade, cat, amunisi, job sampingan, rekor balapan.

## Cara main

Jalankan `node serve.ts` lalu buka http://localhost:8080 — atau buka `game/index.html` lewat server statis apa pun. Semua file lokal, tanpa internet.

| Kontrol | Aksi |
|---|---|
| WASD / panah | Jalan / mengemudi |
| E | Masuk/keluar mobil, bicara Bu Sari, curi mobil AI |
| F / klik kiri | Pukul / tembak |
| Q (tahan) / Tab | Roda senjata, 1-4 pilih senjata |
| Z / X / C | Ability kru: Montir / Supir / Pengintai |
| P | HP (Peta, Job, Bank, Pesan) |
| G | Garasi (beli mobil, upgrade, cat, amunisi) |
| R | Ganti stasiun radio |
| H | Klakson |
| Shift | Nitro (bila terpasang) |
| Spasi | Rem tangan |
| Esc | Jeda |

## Teknologi

three.js r160 (vendored di `game/vendor/`), Node 22 stdlib-only untuk `main.ts` & `serve.ts`. Tidak ada build step, tidak ada aset luar.
