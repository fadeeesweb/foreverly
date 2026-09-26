import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// base './' keeps every asset path relative so the build works on
// https://USERNAME.github.io/Foreverly/ as well as on a custom domain.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        surprise: resolve(__dirname, 'surprise.html')
      }
    }
  }
});
