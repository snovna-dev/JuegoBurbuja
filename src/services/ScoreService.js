import { CONFIG } from '../config.js';
import { storage } from './storage.js';

/**
 * Servicio de puntajes.
 *
 * Usa la API del servidor (SQLite) cuando está disponible. Si el juego se
 * publica como sitio estático (por ejemplo GitHub Pages) o el servidor no
 * responde, guarda los puntajes en localStorage. La UI no necesita saber
 * cuál de los dos se está usando.
 */
const API = `${import.meta.env.BASE_URL}api`.replace(/\/{2,}/g, '/');
const LOCAL_KEY = 'scores';
const TIMEOUT_MS = 3500;

async function request(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (!res.ok || !isJson) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export class ScoreService {
  /** 'remote' | 'local' — se resuelve en el primer uso. */
  mode = null;

  async #resolveMode() {
    if (this.mode) return this.mode;
    try {
      await request('/health');
      this.mode = 'remote';
    } catch {
      this.mode = 'local';
    }
    return this.mode;
  }

  async top(limit = CONFIG.leaderboardSize) {
    if ((await this.#resolveMode()) === 'remote') {
      try {
        const data = await request(`/scores?limit=${limit}`);
        return data.scores;
      } catch {
        this.mode = 'local';
      }
    }
    return localTop(limit);
  }

  /** Guarda una partida y devuelve { rank, best, scores }. */
  async save(entry) {
    const clean = {
      name: String(entry.name).trim().slice(0, CONFIG.playerNameMaxLength),
      score: Math.max(0, Math.floor(entry.score)),
      level: Math.max(1, Math.floor(entry.level)),
      durationMs: Math.max(0, Math.floor(entry.durationMs)),
    };

    if ((await this.#resolveMode()) === 'remote') {
      try {
        return await request('/scores', { method: 'POST', body: JSON.stringify(clean) });
      } catch {
        this.mode = 'local';
      }
    }
    return localSave(clean);
  }
}

// --------------------------------------------------------- respaldo local

function localAll() {
  const list = storage.get(LOCAL_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Mejor puntaje por jugador, igual que el ranking del servidor. */
function localTop(limit) {
  const best = new Map();
  for (const s of localAll()) {
    const key = s.name.toLowerCase();
    const prev = best.get(key);
    if (!prev || s.score > prev.score || (s.score === prev.score && s.durationMs < prev.durationMs)) best.set(key, s);
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs)
    .slice(0, limit);
}

function localSave(entry) {
  const list = localAll();
  list.push({ ...entry, createdAt: new Date().toISOString() });
  // Se conservan sólo las 200 partidas más altas para no crecer sin límite.
  list.sort((a, b) => b.score - a.score);
  storage.set(LOCAL_KEY, list.slice(0, 200));

  const ranking = localTop(Number.MAX_SAFE_INTEGER);
  const rank = ranking.findIndex((s) => s.name.toLowerCase() === entry.name.toLowerCase()) + 1;
  const best = ranking[rank - 1]?.score ?? entry.score;
  return { rank, best, scores: ranking.slice(0, CONFIG.leaderboardSize) };
}
