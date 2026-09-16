/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: 'var(--bg-space)',
        'glass-nav': 'var(--glass-nav)',
        'glass-window': 'var(--glass-window)',
        'glass-card': 'var(--glass-card)',
        'glass-elevated': 'var(--glass-elevated)',
        'accent-indigo': 'var(--accent-indigo)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-emerald': 'var(--accent-emerald)',
        'accent-amber': 'var(--accent-amber)',
        'accent-rose': 'var(--accent-rose)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        dim: 'var(--text-dim)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        window: 'var(--radius-window)',
        card: 'var(--radius-card)',
        node: 'var(--radius-node)',
        btn: 'var(--radius-btn)',
      }
    },
  },
  plugins: [],
}
