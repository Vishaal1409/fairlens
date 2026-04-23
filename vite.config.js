import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: "/fairlens/",   // 🔥 ADD THIS LINE

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },

  plugins: [
    react(),
    tailwindcss(),
  ],
})