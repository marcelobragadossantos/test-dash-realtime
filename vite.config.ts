import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Backend Express (server.js)
        changeOrigin: true,
        secure: false,
        // Se o backend não esperar o prefixo /api, descomente a linha abaixo:
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
