import type { Config } from "tailwindcss";

// Palet ikut logo 3 Putra (DESIGN.md): navy + oranye di atas kertas.
// kertas = latar, navy = teks judul & permukaan gelap, oranye = HANYA harga dan tombol WhatsApp.
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
        navy: {
          DEFAULT: '#0B2D5B', // warna logo. Teks judul, header, footer
          muda: '#16407A',    // hover
          tua: '#071E3D',     // permukaan paling gelap
          kabut: '#C5D3E8',   // teks di atas permukaan navy (9:1)
        },
        tinta: {
          DEFAULT: '#1C1917', // teks badan
          lembut: '#5A5651',  // teks sekunder
          samar: '#6B655E',   // teks tersier. 5.2:1 di atas kertas; #857F78 cuma 3.7:1
          batas: '#857F78',   // garis kolom isian. Bukan teks: cukup lolos batas 3:1 non-teks
        },
        // Aksen. Dipakai di angka harga dan tombol WhatsApp. Tidak di tempat lain.
        //
        // Oranye logo cuma 2.2:1 di atas kertas, jadi untuk teks di kertas pakai versi gelap:
        //   DEFAULT  oranye logo. Latar tombol dengan teks navy (5.8:1), teks di atas navy (5.8:1)
        //   tua      hover tombol (teks navy 4.9:1)
        //   gelap    angka harga dan teks kecil di atas kertas (5.0:1)
        oranye: {
          DEFAULT: '#FF8A3D',
          tua: '#F37A2A',
          gelap: '#B54A0B',
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
