import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev: chuyển tiếp /api -> faucet server (npm run faucet).
    // Khi deploy Vercel, /api chạy bằng serverless function nên không cần proxy.
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
