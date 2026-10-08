/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Structured, heavy, uncompromising black — the bones of New Brutalism. */
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#171717',
          muted: '#404040',
          light: '#737373',
        },
        /* Primary accent — Electric Cobalt Blue. */
        cobalt: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        /* Vibrant highlight — Mango / Lemon Yellow. */
        lemon: {
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        /* Earthy grounding — Olive Green. */
        olive: {
          100: '#ECFCCB',
          200: '#D9F99D',
          300: '#BEF264',
          400: '#A3E635',
          500: '#84CC16',
          600: '#65A30D',
          700: '#4D7C0F',
          800: '#3F6212',
        },
        /* Warm neutrals — Beige / Cream that stop the layout going monochrome. */
        beige: {
          DEFAULT: '#F5F5DC',
          light: '#FDFBF7',
          deep: '#E8E4C9',
        },
        cream: '#FDFBF7',
        danger: {
          DEFAULT: '#DC2626',
          dark: '#991B1B',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'Impact', '"Haettenschweiler"', '"Arial Black"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderWidth: {
        3: '3px',
        5: '5px',
        6: '6px',
      },
      boxShadow: {
        'brutal-xs': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-sm': '3px 3px 0px 0px rgba(0,0,0,1)',
        brutal: '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutal-lg': '6px 6px 0px 0px rgba(0,0,0,1)',
        'brutal-xl': '10px 10px 0px 0px rgba(0,0,0,1)',
        'brutal-2xl': '14px 14px 0px 0px rgba(0,0,0,1)',
        'brutal-cobalt': '4px 4px 0px 0px rgba(37,99,235,1)',
        'brutal-lemon': '4px 4px 0px 0px rgba(250,204,21,1)',
        'brutal-olive': '4px 4px 0px 0px rgba(101,163,13,1)',
        'brutal-inverse': '-4px -4px 0px 0px rgba(0,0,0,1)',
        'brutal-inset': 'inset 3px 3px 0px 0px rgba(0,0,0,1)',
        'brutal-none': '0px 0px 0px 0px rgba(0,0,0,0)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        'marquee-fast': 'marquee 22s linear infinite',
        'pop-in': 'pop-in 180ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
        'toast-in': 'toast-in 200ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
        'fade-up': 'fade-up 260ms ease-out both',
        'fade-in': 'fade-in 200ms ease-out both',
        wiggle: 'wiggle 300ms ease-in-out 2',
        blink: 'blink 1.4s ease-in-out infinite',
        float: 'float 3.5s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
