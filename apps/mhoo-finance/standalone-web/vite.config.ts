import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: here,
  resolve: {
    alias: { src: fileURLToPath(new URL('../src', import.meta.url)) },
  },
  build: {
    outDir: fileURLToPath(new URL('../../../standalone/dist', import.meta.url)),
    emptyOutDir: true,
  },
});
