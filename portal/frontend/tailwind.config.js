/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6f9',
          100: '#e6eaf1',
          200: '#c9d3e1',
          300: '#9daecb',
          400: '#6b83ab',
          500: '#4a6390',
          600: '#394d73',
          700: '#2f3f5e',
          800: '#243147',
          900: '#14202e',
        },
        brand: {
          50: '#eef4fc',
          100: '#d7e5f8',
          200: '#b0caf0',
          300: '#7fa9e4',
          400: '#4f86d4',
          500: '#2f68bd',
          600: '#1d4e89',
          700: '#193f6e',
          800: '#16345a',
          900: '#122a49',
        },
        accent: {
          50: '#fdf6ec',
          100: '#f8e6c9',
          200: '#f0cb92',
          300: '#e5ad5b',
          400: '#d98a2b',
          500: '#b96f1d',
          600: '#935618',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 32, 46, 0.06), 0 8px 24px -16px rgba(20, 32, 46, 0.25)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
