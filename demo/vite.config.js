import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  root: 'demo',
  base: command === 'serve' ? '/' : '/bg-curve-remover/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}));
