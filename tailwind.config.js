/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#6b2fbf",
        "primary-container": "#d6baff",
        "on-primary": "#ffffff",
        "on-primary-container": "#21005d",
        secondary: "#625b71",
        "secondary-container": "#e8def8",
        tertiary: "#7d5260",
        "on-tertiary": "#ffffff",
        error: "#ba1a1a",
        surface: "#121315",
        "surface-container": "#1f2021",
        "surface-container-low": "#1b1c1d",
        "surface-container-high": "#2a2b2c",
        "surface-container-highest": "#38393a",
        "surface-container-lowest": "#0e0f10",
        "surface-bright": "#3a3a3a",
        "on-surface": "#e3e2e3",
        "on-surface-variant": "#cac4d0",
        "outline-variant": "#49454f",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Berkeley Mono", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
