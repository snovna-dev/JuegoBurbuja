import express from 'express';
import { createScoresRepository } from './scoresRepository.js';
import { parseLimit, validateScore } from './validation.js';

/**
 * Crea la aplicación Express con la API REST de puntajes.
 * Se separa de index.js para poder probarla sin levantar un puerto.
 *
 *   GET  /api/health                 → estado del servicio
 *   GET  /api/scores?limit=10        → ranking (mejor puntaje por jugador)
 *   POST /api/scores                 → registra una partida
 *   GET  /api/players/:name/stats    → estadísticas de un jugador
 */
export function createApp({ db, rateLimit = { windowMs: 60_000, max: 20 } } = {}) {
  const repo = createScoresRepository(db);
  const app = express();
  app.disable('x-powered-by');

  const api = express.Router();
  api.use(express.json({ limit: '2kb' }));

  api.get('/health', (_req, res) => {
    res.json({ ok: true, storage: 'sqlite' });
  });

  api.get('/scores', (req, res) => {
    res.json({ scores: repo.top(parseLimit(req.query.limit)) });
  });

  api.post('/scores', limitRequests(rateLimit), (req, res) => {
    const { value, error } = validateScore(req.body);
    if (error) return res.status(400).json({ error });
    const { rank, best } = repo.save(value);
    res.status(201).json({ rank, best, scores: repo.top(10) });
  });

  api.get('/players/:name/stats', (req, res) => {
    res.json(repo.playerStats(String(req.params.name).slice(0, 32)));
  });

  api.use((_req, res) => res.status(404).json({ error: 'No encontrado' }));

  // Errores (JSON malformado, etc.)
  // eslint-disable-next-line no-unused-vars
  api.use((err, _req, res, _next) => {
    const status = err.status ?? err.statusCode ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Error interno' : 'Solicitud inválida' });
  });

  app.use('/api', api);
  return app;
}

/** Limitador de peticiones en memoria por IP (suficiente para un solo proceso). */
function limitRequests({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      if (hits.size > 5000) hits.clear();
      return next();
    }
    entry.count += 1;
    if (entry.count > max) return res.status(429).json({ error: 'Demasiadas solicitudes, intenta más tarde' });
    next();
  };
}
