import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: here,
  // Served by the mhoo-finance Worker at mhoo.dev/00/finance/ (APP-CONTRACT.md).
  base: '/00/finance/',
  resolve: {
    alias: { src: fileURLToPath(new URL('../src', import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL('../../../standalone/dist/00/finance', import.meta.url)),
    emptyOutDir: true,
  },
});
