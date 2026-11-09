
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import https from 'node:https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,

    proxy: {
      '/api': {
        target: 'https://localhost:44387',
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
      },

      '/hubs': {
        target: 'https://localhost:44387',
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
        ws: true,
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
