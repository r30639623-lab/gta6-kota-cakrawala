# Kota Cakrawala

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/c/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/rank.svg)](https://make.fun/c/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/r30639623-lab/gta6-kota-cakrawala/reward.svg)](https://make.fun/c/gta6-01)

**Kota Cakrawala** adalah game open-world crime 3D original untuk bounty
make.fun **gta6-01** — dibangun dengan three.js, jalan offline dari file
statis, tanpa request network. Semua nama, kota, karakter, dan kendaraan
buatan sendiri (bukan GTA Rockstar).

Kamu bermain sebagai **Raka**, anak kota yang baru pulang ke Kota Cakrawala,
kota fiktif pesisir Indonesia. **Bu Sari**, pemilik bengkel di ujung kota,
menawarinya kerjaan — antar paket, balapan, sampai penyelamatan di dermaga.
Sementara itu polisi mengawasi: curi mobil, tabrak orang, atau serang
polisi, dan level Wanted naik sampai ★★★★★.

## Fitur Round 6 (baru)

- **12 misi Bu Sari dalam 3 babak** — total hadiah **$6.850** (+$500 bonus
  legenda setelah misi final). Babak 1 "Awal di Cakrawala" (m1–m4), Babak 2
  "Utang & Jalanan" (m5–m8), Babak 3 "Legenda Cakrawala" (m9–m12, final
  $1.200). Tiap misi punya target landmark, timer, dan beacon kuning.
- **20 Relik Cakrawala** — kolektibel emas melayang di 5 area kota
  (Menara, Pasar, Pelabuhan, Pantai, Bengkel). Tiap relik +$50 dan +5
  reputasi distrik. Kumpulkan semua 20 = bonus $500.
- **10 mobil unlockable + 3 garasi** — Kancil GT, Kijang Klasik, Badak
  Pickup, Banteng Van, Sanca Sedan, Cendrawasih Convertible, Elang Coupe,
  Macan Muscle, Komodo S, sampai Garuda Supercar (48 m/s, butuh 8 misi).
  Garasi Bengkel, Pelabuhan, dan Menara. Panel garasi (G): beli/pilih
  mobil, upgrade Mesin Turbo / Lapis Baja / Nitro, 8 warna cat, isi
  amunisi.
- **Reputasi 5 distrik** — Pusat, Pasar, Pelabuhan, Pantai, Bengkel.
  Reputasi naik kalau selesaikan misi atau ambil relik di distrik itu,
  turun kalau berbuat onar. **Rep ≥ 70 = diskon 20%** harga garasi/mobil
  di distrik itu; **rep ≤ 25 = Wanted naik 2x lebih cepat** di sana.
- **Wanted ★1–5 diperkuat** — ★1: 1 mobil kejar; ★2: 2 mobil; ★3:
  + roadblock; ★4: + helikopter polisi (orbit rendah + lampu sorot);
  ★5: 4 mobil kejar + helikopter + roadblock lebih sering + polisi
  lebih cepat (hingga ~30 m/s). Decay paling lambat di ★5.

## Fitur inti

- Kota prosedural ~100 gedung berjendela menyala, grid jalan + marka +
  zebra cross, lampu jalan, pohon palem, pantai + laut, pelabuhan
  (dermaga, kontainer, crane, kapal), Menara Cakrawala (86 m),
  Pasar Cakrawala, Rumah Sakit (titik respawn), bengkel Bu Sari.
- Siang / senja / malam neon mengikuti jam game.
- 18 mobil AI + 30 pejalan kaki AI di jalanan.
- Mengemudi arcade + chase camera; curi mobil AI (E); masuk/keluar mobil (E).
- Roda senjata (Q / Tab): Tinju, Pistol, SMG — amunisi diisi di garasi.
- Radio 3 stasiun musik prosedural WebAudio (R ganti stasiun) + efek suara
  prosedural (mesin, sirene, tabrakan, cash).
- HUD kaya: uang, nyawa, armor, Wanted ★, kecepatan, jam game, radio,
  tracker 12 misi, counter relik ◆ X/20, baris distrik, minimap 2D
  berlabel + kompas.
- Save otomatis di localStorage (`kota-cakrawala-save-v4`): uang, progres
  12 misi, relik, reputasi distrik, mobil dimiliki/aktif, upgrade, cat,
  amunisi.

## Cara main

1. Jalankan `node serve.ts` lalu buka http://localhost:8080
2. Klik **MULAI**.
3. Dekati Bu Sari (tanda ▼ kuning di dekat bengkel) dan tekan **E** untuk
   memulai misi. Ikuti beacon kuning ke target sebelum timer habis.
4. Kumpulkan relik emas (◆), beli mobil di garasi (G), jaga reputasi
   distrik, dan jangan sampai Wanted mencapai ★★★★★.

## Kontrol

| Tombol | Aksi |
|---|---|
| WASD / panah | Jalan kaki / mengemudi |
| E | Masuk/keluar mobil, bicara Bu Sari, curi mobil AI |
| F / klik kiri | Pukul / tembak |
| Q (tahan) / Tab | Roda senjata (1 Tinju, 2 Pistol, 3 SMG) |
| G | Panel garasi |
| R | Ganti stasiun radio |
| H | Klakson |
| Spasi | Rem tangan |
| Shift | Nitro (kalau sudah dibeli) |
| Esc | Pause |

## Teknologi

- three.js r160 (vendored di `game/vendor/three.module.min.js`)
- Node 22 stdlib-only untuk `main.ts` (dossier) dan `serve.ts`
- Tanpa build step, tanpa network request saat bermain

## Lisensi

MIT — lihat `LICENSE`.
