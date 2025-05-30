import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // target: 'http://localhost:8000', // Uncomment for local development
        target: 'http://host.docker.internal:8000', // Use this for Docker setup
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
