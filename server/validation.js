/**
 * Validación de los datos que llegan del cliente. El servidor nunca confía
 * en lo que envía el navegador.
 */
export const LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 16,
  scoreMax: 100_000,
  levelMax: 1_000,
  durationMax: 1000 * 60 * 60 * 6, // 6 horas
  // Velocidad máxima razonable de captura (cuadros por segundo) para filtrar trampas obvias.
  maxGemsPerSecond: 4,
});

const NAME_RE = /^[\p{L}\p{N} _.-]+$/u;

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

/** Devuelve { value } si es válido o { error } con un mensaje. */
export function validateScore(body) {
  if (!body || typeof body !== 'object') return { error: 'Cuerpo inválido' };

  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
    return { error: `El nombre debe tener entre ${LIMITS.nameMin} y ${LIMITS.nameMax} caracteres` };
  }
  if (!NAME_RE.test(name)) return { error: 'El nombre contiene caracteres no permitidos' };

  const { score, level, durationMs } = body;
  if (!isInt(score, 0, LIMITS.scoreMax)) return { error: 'Puntaje inválido' };
  if (!isInt(level, 1, LIMITS.levelMax)) return { error: 'Nivel inválido' };
  if (!isInt(durationMs, 0, LIMITS.durationMax)) return { error: 'Duración inválida' };

  if (score > 0 && score / Math.max(durationMs / 1000, 0.001) > LIMITS.maxGemsPerSecond) {
    return { error: 'Puntaje no plausible' };
  }

  return { value: { name, score, level, durationMs } };
}

export function parseLimit(raw, fallback = 10, max = 50) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}
