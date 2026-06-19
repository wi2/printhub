import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { serveGeneratedAssets } from './vite.serve-generated';

export default defineConfig({
  plugins: [react(), serveGeneratedAssets(__dirname)],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
