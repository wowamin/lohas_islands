import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Works both at a domain root and under GitHub Pages /lohas_islands/.
  base: './',
  plugins: [react()],
  server: { allowedHosts: ["terminal.local"] },
})
