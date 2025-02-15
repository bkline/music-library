// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/library/dist/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{src: 'static/help.html', dest: 'assets'}]
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
