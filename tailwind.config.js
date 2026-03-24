/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Segoe UI Variable'", "'Segoe UI'", 'system-ui', 'sans-serif'],
        display: ["'Segoe UI Variable'", "'Segoe UI'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      animation: {
        'slide-in':     'slideIn 0.25s ease-out',
        'fade-in':      'fadeIn 0.2s ease-out',
        'scale-in':     'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'spin-slow':    'spin 1.5s linear infinite',
      },
      keyframes: {
        slideIn:  { '0%': { transform: 'translateX(-16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        fadeIn:   { '0%': { opacity: '0' },   '100%': { opacity: '1' } },
        scaleIn:  { '0%': { transform: 'scale(0.92)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-dark':'0 1px 3px rgba(0,0,0,0.3),  0 4px 16px rgba(0,0,0,0.2)',
        modal:      '0 8px 40px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [],
}
