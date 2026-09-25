import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0284C7',
          600: '#0369A1',
          700: '#035388',
          900: '#0F172A',
        },
        accent: {
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        slate: {
          850: '#1E293B',
          950: '#020617',
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Work Sans', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Figtree', 'system-ui', 'sans-serif'],
      },

    },
  },
  plugins: [],
};

export default config;
