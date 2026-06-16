import { defineConfig } from 'vite';
import { resolve } from 'path';

// Admin portal — single-page app. Root is admin-ui/.
export default defineConfig({
  root: resolve(__dirname, 'admin-ui'),
  appType: 'spa',
  server: { port: 5174, fs: { allow: [resolve(__dirname)] } },
  preview: { port: 5174 },
  build: {
    target: 'es2022',
    outDir: resolve(__dirname, 'dist-admin'),
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, 'admin-ui/index.html') }
    }
  }
});
