import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el build funciona en la raíz de un dominio, en una
  // subcarpeta o en GitHub Pages sin cambiar nada.
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
  },
});
