import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/rpc': 'http://localhost:3000',
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
