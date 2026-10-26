# Iklan video 3 Putra (konteks buat Claude Code lokal)

Folder ini isinya bahan iklan video Meta Ads, bukan bagian website. Jangan ubah `src/` atau
file website lain kecuali pemilik minta. Kerja di branch `iklan-animasi`, jangan merge ke `main`.

## Cara kerja dengan pemilik
- Gaya bahasa santai ("bro", "gua/lu"), langsung ke inti: masalah, penyebab, solusi, langkah berikutnya.
- Tunjukkan contoh frame dulu sebelum render penuh. Revisi per adegan sesuai catatan pemilik.
- Pemilik generate suara sendiri di ElevenLabs, satu file per tokoh/narator, nama file tidak
  di-rename. Cocokkan file ke kalimat pakai Whisper (faster-whisper, model medium, bahasa "id"),
  potong per kalimat, ambil waktu per kata buat teks di layar dan amplop suara buat gerak mulut.

## Fakta yang boleh dipakai di iklan
- Harga borongan per m² bisa dicek di kanopibajaringandemak.my.id, sudah termasuk bahan dan pasang.
- Survei gratis. Harga pasti dikasih setelah survei.
- Boleh batal tanpa biaya kalau harga final tidak cocok.
- Contoh asli kalkulator: Kanopi Cordoba Rp450.000/m² (bahan standar atap Alderon, tiang baja
  ringan); 5 m × 4 m = Rp9.000.000. Mezanin Kamar Loft Rp1.500.000/m².
- JANGAN mengarang: klaim bahan (tahan angin, tidak berisik, SNI, garansi), lama pengerjaan,
  angka teknis, testimoni. Fakta teknis harus dari pemilik.

## Merek
- Warna: navy #0B2D5B, krem #FAF8F5, oranye #FF8A3D. Oranye HANYA untuk angka harga dan tombol WhatsApp.
- Huruf: Fraunces 600 (judul & angka), Figtree (teks).
- Logo penutup: pakai `public/brand/logo-3putra-putih.svg` asli. Animasinya meniru
  `src/components/brand/LogoLoading.tsx` + `.logo-loading` di `src/app/globals.css`: garis logo
  tergambar seperti sketsa (stroke-dashoffset 0–40% dari 3,2 dtk), lalu warna diisi (38–55%),
  baru tulisan "3 PUTRA" + tagline muncul. Jangan gambar ulang tulisan "3 PUTRA" pakai font.
- Pemilik tidak suka karakter memegang barang (tangan bulat, kelihatan menempel) dan tidak suka
  salaman yang kelihatan seperti rangkulan.

## Proyek
| Folder | Status |
|---|---|
| `pak-saepul/` | Selesai (draf 4). Animasi 2D SVG gaya karakter A, 60 dtk. Lihat README di dalamnya. |
| `bambu/` | Berikutnya. Konsep meme "Selamat, kamu bikin…", gaya 3D. Naskah di `bambu/NASKAH.md`. |

## Setup lokal (komputer pemilik)
- Fedora, GPU GTX 1080 (8 GB, Pascal; driver NVIDIA cabang 580 dari RPM Fusion).
- Blender 4.5 LTS, render mesin **Eevee** (Cycles terlalu lambat di kartu ini). Bangun scene
  lewat script Python (bpy), render headless (`blender -b -P script.py`).
- ffmpeg versi lengkap (RPM Fusion, ada libx264). Output 1080×1920, 30 fps, H.264 + AAC.
- Tekstur/model dari Poly Haven (CC0).
