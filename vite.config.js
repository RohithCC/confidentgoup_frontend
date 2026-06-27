import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /api to the backend during development so there are no CORS issues.
    // The frontend calls `/api/v1/...` and Vite forwards it to localhost:5000.
    proxy: {
      '/api': {
        target: 'https://confidentgoup-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
});
