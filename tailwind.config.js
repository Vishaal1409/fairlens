/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy `jscolors-*` names kept so existing components keep rendering,
        // but every value has been re-tuned to the Obsidian Observatory palette.
        jscolors: {
          void: '#05060A',
          deep: '#0A0C12',
          surface: '#10131C',
          elevated: '#161A26',
          rim: '#252B3B',
          'accent-violet': '#5BC0EB', // cerulean primary (name kept for back-compat)
          'accent-teal':   '#9AD3FF', // soft sky
          'accent-amber':  '#E8D5A8', // warm editorial cream
          'accent-red':    '#FF6E6E', // signal red
          'accent-green':  '#6EE7C4', // aurora teal
          'text-primary':  '#E8EAF0',
          'text-secondary':'#8B93A8',
          'text-muted':    '#555B6E',
        },
        // Semantic tokens — new work should use these.
        obs: {
          void:     '#05060A',
          abyss:    '#0A0C12',
          graphite: '#10131C',
          ink:      '#161A26',
          fog:      '#252B3B',
          cerulean: '#5BC0EB',
          lumen:    '#E8D5A8',
          aurora:   '#6EE7C4',
          signal:   '#FF6E6E',
          text:     '#E8EAF0',
          dim:      '#8B93A8',
          ghost:    '#555B6E',
        },
      },
      fontFamily: {
        // Editorial display serif for headlines; precise grotesk for body; mono for data/coordinates.
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        sans:    ['"Geist"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        'glass-edge': 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)',
        'glass-bloom': '0 24px 80px -24px rgba(91, 192, 235, 0.18), 0 8px 40px -16px rgba(0,0,0,0.8)',
      },
      backdropBlur: {
        heavy: '28px',
      },
    },
  },
  plugins: [],
}
