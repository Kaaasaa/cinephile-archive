/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          primary: '#0B0C0E',
          secondary: '#121418',
          elevated: '#181B21',
          overlay: '#1F232B',
        },
        champagne: {
          DEFAULT: '#D4B475',
          muted: '#A88E58',
          subtle: 'rgba(212, 180, 117, 0.14)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Noto Serif SC"', '"Songti SC"', 'Georgia', 'serif'],
        sans: ['Inter', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
