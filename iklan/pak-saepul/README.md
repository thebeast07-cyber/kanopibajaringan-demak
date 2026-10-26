# Iklan animasi: Pak Saepul takut harga nambah

Bahan video iklan Meta Ads 60 detik (1080×1920, gaya karakter A). Folder ini terpisah dari website dan tidak ikut di-build.

## Isi

| Folder / file | Isi |
|---|---|
| `naskah/naskah-cerita-1.html` | Naskah final (salinan halaman yang bisa diedit di claude.ai) |
| `karakter/` | Lembar pilihan gaya karakter A/B/C dan generatornya |
| `suara/asli/` | File asli dari ElevenLabs, satu file per tokoh (Maliq = Pak Saepul, Putri Maharani = Bu Darti, Galih Yogi = Anak, Wibowo = Tukang) |
| `suara/klip/01.wav`–`09.wav` | Dialog yang sudah dipotong per adegan |
| `suara/timeline.json` | Waktu tiap adegan, waktu per kata (buat teks), dan amplop suara (buat gerak mulut) |
| `animasi/animasi.html` | Semua gambar dan gerakan adegan, digambar sebagai SVG per frame |
| `siapkan_timeline.py` | Bikin ulang `timeline.json` dari klip + naskah (butuh faster-whisper) |
| `buat_trek_suara.py` | Gabung klip + suara hujan jadi `animasi/trek-suara.wav` |

## Render ulang

Jalankan dari folder `iklan/pak-saepul`. Butuh Node + Playwright (Chromium), Python 3, ffmpeg dengan libx264.

```
python3 buat_trek_suara.py
node animasi/render.js
ffmpeg -framerate 30 -i animasi/frame/%05d.jpg -i animasi/trek-suara.wav \
  -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest \
  -movflags +faststart animasi/kanopi-pak-saepul.mp4
```

Cek beberapa frame tanpa render penuh: `node animasi/cuplik.js 3.0 20.0 53.5` (angka = detik).
