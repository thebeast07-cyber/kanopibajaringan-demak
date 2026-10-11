import type { Config } from "tailwindcss";

// Palet "Rumah teduh" dari DESIGN.md: 2 warna inti + 1 aksen.
// kertas = latar, hutan = teks & permukaan gelap, amber = HANYA harga dan tombol WhatsApp.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kertas: {
          DEFAULT: '#FAF8F5', // latar halaman
          dalam: '#F3EFE9',   // latar yang agak masuk ke dalam
          garis: '#E5DFD5',   // garis pemisah
        },
        hutan: {
          DEFAULT: '#1B3B2B', // teks judul, header, footer
          muda: '#2F5C45',    // hover
          tua: '#122A1E',     // permukaan paling gelap
          kabut: '#C9DCD1',   // teks di atas permukaan hutan
        },
        tinta: {
          DEFAULT: '#1C1917', // teks badan
          lembut: '#5A5651',  // teks sekunder
          samar: '#6B655E',   // teks tersier. 5.2:1 di atas kertas; #857F78 cuma 3.7:1
          batas: '#857F78',   // garis kolom isian. Bukan teks: cukup lolos batas 3:1 non-teks
        },
        // Aksen. Dipakai di angka harga dan tombol WhatsApp. Tidak di tempat lain.
        //
        // Tiga nilai karena satu oranye tidak bisa lolos kontras di semua tempat:
        //   DEFAULT  angka harga ukuran besar di atas kertas (3.8:1, lolos batas teks besar)
        //   gelap    latar tombol dengan teks putih (6.9:1) dan teks kecil di atas kertas
        //   terang   di atas permukaan hutan; DEFAULT cuma 3.2:1 di sana
        amber: {
          DEFAULT: '#D97706',
          gelap: '#8A4A04',
          tua: '#6E3B03',     // hover tombol
          terang: '#F59E0B',
        },
      },
      fontFamily: {
        // Fraunges: lengkungannya hangat, bikin judul nggak kerasa korporat.
        heading: ['var(--font-heading)', 'Fraunces', 'Georgia', 'serif'],
        // Figtree: netral dan enak dibaca di HP.
        sans: ['var(--font-sans)', 'Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
