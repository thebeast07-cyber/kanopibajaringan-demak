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

## Statistik pengunjung (Vercel Web Analytics)

Website sudah mengirim data ke Vercel Web Analytics. Kunjungan ke `/admin` tidak dihitung.

1. Di Vercel, buka project, menu **Analytics**, lalu **Enable**. Setelah itu redeploy.
2. Yang kelihatan: jumlah pengunjung, halaman, asal pengunjung (referrer), negara, dan perangkat.
3. Event funnel yang dikirim website:
   - `isi_ukuran`: pengunjung mengubah ukuran di kalkulator (sekali per kunjungan), dengan nama layanan.
   - `klik_whatsapp`: pengunjung menekan tombol WhatsApp, dengan `sumber` (tombol mana) dan nama layanan.
     Nilai `sumber`: `navbar`, `menu-hp`, `hero`, `kalkulator`, `kartu-tanya-harga`, `kartu-bahan-lain`,
     `daftar-tanya-harga`, `ajakan-bawah`, `footer`.

   Event custom kemungkinan baru bisa dilihat di paket berbayar Vercel; cek di tab Analytics.

### Link berlabel supaya asal pengunjung kebaca

Dari aplikasi Instagram, Facebook, atau WhatsApp, asal pengunjung sering tidak terkirim dan tercatat
sebagai "langsung". Pakai link berlabel di tiap tempat promosi:

| Dipasang di | Link |
|---|---|
| Bio Instagram | `https://<domain>/?utm_source=instagram&utm_medium=bio` |
| Profil Google Maps / Google Bisnis | `https://<domain>/?utm_source=google-maps&utm_medium=profil` |
| Status atau broadcast WhatsApp | `https://<domain>/?utm_source=whatsapp&utm_medium=status` |
| Halaman Facebook | `https://<domain>/?utm_source=facebook&utm_medium=halaman` |
| Iklan (kalau ada) | `https://<domain>/?utm_source=<platform>&utm_medium=iklan&utm_campaign=<nama-iklan>` |
