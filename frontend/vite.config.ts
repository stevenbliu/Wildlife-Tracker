import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        // target: 'http://localhost:8000', // Uncomment for local dev without Docker
        target: 'http://host.docker.internal:8000', // Works from Docker container to host
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
