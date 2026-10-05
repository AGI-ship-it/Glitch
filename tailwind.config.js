/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // From the Glitch Sports brand deck.
        ink: '#0d0d10',
        'ink-soft': '#3d3d45',
        // Darkened from #75737d so secondary text passes AA on the wash background too.
        muted: '#6e6c76',
        line: '#e8e6ec',
        'line-strong': '#c7c4d0',
        wash: '#f6f5f9',
        'wash-strong': '#e2dfe9',
        brand: {
          yellow: '#f5d400',
          // Not in the deck: the one colour that has to mean "done" and nothing
          // else, so it is kept away from the brand's own magenta and yellow.
          green: '#1f8a4c',
          // Deepened from the deck's #e5199b so white-on-magenta and
          // magenta-on-white both clear WCAG AA (5.0:1 vs white).
          magenta: '#d1148c',
          // The original deck magenta — for dark surfaces only, where the
          // brighter value is the one that passes (4.6:1 vs ink).
          'magenta-bright': '#e5199b',
          indigo: '#2e2ed6',
          violet: '#7b2ff7',
        },
        // Semnox prototype — values live as CSS variables in src/semnox/semnox.css.
        sx: {
          bg: 'var(--sx-color-bg)',
          surface: 'var(--sx-color-surface)',
          raised: 'var(--sx-color-surface-raised)',
          border: 'var(--sx-color-border)',
          'border-strong': 'var(--sx-color-border-strong)',
          text: 'var(--sx-color-text)',
          muted: 'var(--sx-color-text-muted)',
          'light-muted': 'var(--sx-color-light-muted)',
          'light-disabled': 'var(--sx-color-light-disabled)',
          'light-cell': 'var(--sx-color-light-cell)',
          'light-line': 'var(--sx-color-light-line)',
          'cta-tint': 'var(--sx-color-cta-tint)',
          'cta-strong': 'var(--sx-color-cta-strong)',
          glass: 'var(--sx-color-glass)',
          widget: 'var(--sx-color-widget)',
          'widget-media': 'var(--sx-color-widget-media)',
          'widget-inset': 'var(--sx-color-widget-inset)',
          'widget-line': 'var(--sx-color-widget-line)',
          'widget-muted': 'var(--sx-color-widget-muted)',
          hot: 'var(--sx-color-hot)',
          badge: 'var(--sx-color-badge)',
          'glass-strong': 'var(--sx-color-glass-strong)',
          'glass-border': 'var(--sx-color-glass-border)',
          cta: 'var(--sx-color-cta)',
          'cta-dark': 'var(--sx-color-cta-on-dark)',
          highlight: 'var(--sx-color-highlight)',
          ink: 'var(--sx-color-ink)',
          gap: 'var(--sx-color-gap)',
          'gap-text': 'var(--sx-color-gap-text)',
        },
      },
      spacing: {
        'sx-xs': 'var(--sx-space-xs)',
        'sx-sm': 'var(--sx-space-sm)',
        'sx-md': 'var(--sx-space-md)',
        'sx-lg': 'var(--sx-space-lg)',
        'sx-xl': 'var(--sx-space-xl)',
        'sx-2xl': 'var(--sx-space-2xl)',
        'sx-touch': 'var(--sx-touch)',
      },
      borderRadius: {
        'sx-cell': 'var(--sx-radius-cell)',
        'sx-field': 'var(--sx-radius-field)',
        'sx-image': 'var(--sx-radius-image)',
        'sx-panel': 'var(--sx-radius-panel)',
        'sx-card': 'var(--sx-radius-card)',
        'sx-widget-media': 'var(--sx-radius-widget-media)',
        'sx-inset': 'var(--sx-radius-inset)',
        'sx-pill': 'var(--sx-radius-pill)',
      },
      fontSize: {
        'sx-display-xl': 'var(--sx-text-display-xl)',
        'sx-display-lg': 'var(--sx-text-display-lg)',
        'sx-h3': 'var(--sx-text-h3)',
        'sx-body-lg': 'var(--sx-text-body-lg)',
        'sx-body-md': 'var(--sx-text-body-md)',
        'sx-body-sm': 'var(--sx-text-body-sm)',
        'sx-caption': 'var(--sx-text-caption)',
      },
      fontFamily: {
        sans: ['Gantari', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        shell: '1200px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,29,28,0.03), 0 12px 32px -20px rgba(31,29,28,0.14)',
        pop: '0 24px 60px -24px rgba(31,29,28,0.22)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 24px 60px -28px rgba(31,29,28,0.5)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'draw-tick': {
          from: { 'stroke-dashoffset': '48' },
          to: { 'stroke-dashoffset': '0' },
        },
        'ring-out': {
          from: { opacity: '0.55', transform: 'scale(0.8)' },
          to: { opacity: '0', transform: 'scale(1.6)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(26px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'dot-fill': {
          from: { width: '0%' },
          to: { width: '100%' },
        },
        // Half the track, because the hours list is rendered twice — see HoursTicker.
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 240ms ease-out both',
        'pop-in': 'pop-in 420ms cubic-bezier(0.34, 1.4, 0.64, 1) both',
        'draw-tick': 'draw-tick 420ms 200ms ease-out both',
        'ring-out': 'ring-out 1.4s ease-out infinite',
        'slide-in': 'slide-in 460ms cubic-bezier(0.22, 1, 0.36, 1) both',
        // Matches ROTATE_MS in components/Campaign.tsx.
        'dot-fill': 'dot-fill 7000ms linear both',
        ticker: 'ticker 22s linear infinite',
      },
    },
  },
  plugins: [],
}
