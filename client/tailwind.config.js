import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  theme: {
    extend: {
      colors: {
        shell: 'var(--bg-shell)',
        surface: 'var(--bg-elevated)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        sans: ['Manrope', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk"', 'Manrope', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        shell: 'var(--radius-xl)',
        panel: 'var(--radius-lg)',
        pill: '999px',
      },
      boxShadow: {
        glass: 'var(--shadow-panel)',
        'glass-strong': 'var(--shadow-panel-strong)',
        soft: 'var(--shadow-soft)',
      },
      backdropBlur: {
        glass: 'var(--blur-strong)',
        soft: 'var(--blur-soft)',
      },
    },
  },
  plugins: [],
}
