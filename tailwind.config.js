/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jscolors: {
          void: '#07070F',
          deep: '#0D0D1A',
          surface: '#13131F',
          elevated: '#1A1A2E',
          rim: '#252540',
          'accent-violet': '#7C6FF7',
          'accent-teal': '#3DDBD9',
          'accent-amber': '#F5A623',
          'accent-red': '#FF4757',
          'accent-green': '#2ECC71',
          'text-primary': '#F0EFFF',
          'text-secondary': '#9B9BC0',
          'text-muted': '#5A5A7A',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}