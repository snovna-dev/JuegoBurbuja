import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express from 'express';
import { openDatabase } from './db.js';
import { createApp } from './app.js';

/**
 * Servidor del juego.
 *  - Desarrollo (`npm run dev`): monta Vite como middleware → recarga en
 *    caliente del cliente y API en el mismo puerto.
 *  - Producción (`npm start`): sirve la carpeta `dist/` ya compilada.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const port = Number(process.env.PORT) || 5173;
const host = process.env.HOST || '0.0.0.0';
const dbFile = process.env.DB_FILE || join(root, 'data', 'burbuja.db');

const db = openDatabase(dbFile);
const app = createApp({ db });

if (isDev) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) {
    console.error('No existe la carpeta dist/. Ejecuta primero: npm run build');
    process.exit(1);
  }
  app.use(express.static(dist, { maxAge: '7d', index: false, setHeaders: noCacheForHtml }));
  app.get('/{*splat}', (_req, res) => res.sendFile(join(dist, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }));
}

const server = app.listen(port, host, () => {
  console.log(`\n  Burbuja ${isDev ? '(desarrollo)' : '(producción)'} → http://localhost:${port}`);
  console.log(`  Base de datos: ${dbFile}\n`);
});

function noCacheForHtml(res, path) {
  if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
}

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
