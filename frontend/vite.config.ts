import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // Ensure root is set to the directory containing index.html
  build: {
    outDir: 'dist', // Default output directory
    assetsDir: 'assets', //Assets subdirectory
  },
});