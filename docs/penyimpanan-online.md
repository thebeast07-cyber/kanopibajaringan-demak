# Penyimpanan online dan login admin

Harga, bahan, dan foto yang diisi pemilik di `/admin` disimpan di Vercel Blob, lalu dibaca
halaman depan. Tanpa Blob, admin tetap bisa dibuka tapi tidak bisa menyimpan.

## Cara kerja

- **Data admin** (harga, bahan, draf, riwayat) jadi satu berkas JSON di Blob. Alamatnya
  diturunkan dari `ADMIN_SESSION_SECRET`, jadi tidak bisa ditebak dari luar.
- **Foto layanan** disimpan di Blob di folder `foto/<id-layanan>/`. Sebelum diunggah, foto
  dikecilkan di browser (sisi terpanjang 1600 px, WebP), karena Vercel menolak kiriman di atas
  4,5 MB.
- **Halaman depan** dibangun ulang tiap admin menyimpan, jadi pelanggan langsung dapat data baru.
- **Dua perangkat** (mis. HP dan laptop) yang mengedit bersamaan: yang menyimpan belakangan dengan
  data basi ditolak dan diminta muat ulang, bukan diam-diam menimpa.
- **Login**: satu kata sandi (`ADMIN_PASSWORD`). Sesi berlaku 30 hari. Mengganti
  `ADMIN_SESSION_SECRET` mengeluarkan semua sesi, tapi juga memindah alamat data, jadi jangan
  diganti setelah dipakai.

## Pasang di Vercel

1. Buka project `landingpagekanopi` di Vercel, menu **Storage**, buat store baru jenis **Blob**,
   lalu sambungkan ke project ini. Vercel otomatis menambah `BLOB_READ_WRITE_TOKEN`.
2. Di **Settings > Environment Variables**, tambah:
   - `ADMIN_PASSWORD`: kata sandi admin.
   - `ADMIN_SESSION_SECRET`: string acak panjang. Isi nilai **berbeda** untuk Production dan
     Preview, supaya coba-coba di Preview tidak menyentuh data asli.
3. **Redeploy** supaya variabel baru terbaca.
4. Buka `/admin`, masuk, isi satu layanan, lalu cek halaman depan dari HP lain.

## Di laptop

Salin `.env.example` jadi `.env.local`, isi `ADMIN_PASSWORD` dan `ADMIN_SESSION_SECRET`,
kosongkan `BLOB_READ_WRITE_TOKEN`. Data tersimpan di folder `.data/` (tidak ikut di-commit).
