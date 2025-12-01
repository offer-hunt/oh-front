import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
      proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
      '/oauth2': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
      '/login/oauth2': { target: 'http://localhost:8080', changeOrigin: true, secure: false }
    },
  },
  build: {
    sourcemap: true,
  },
});
