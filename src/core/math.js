/** Utilidades matemáticas puras (sin dependencias del DOM, fáciles de probar). */

export const TAU = Math.PI * 2;

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

export const lerp = (a, b, t) => a + (b - a) * t;

/** Número aleatorio real en [min, max). */
export const randRange = (min, max, rng = Math.random) => min + rng() * (max - min);

/** Entero aleatorio en [min, max]. */
export const randInt = (min, max, rng = Math.random) => Math.floor(randRange(min, max + 1, rng));

export const randSign = (rng = Math.random) => (rng() < 0.5 ? -1 : 1);

export const distanceSq = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

/** Colisión círculo-círculo. Cada objeto expone { x, y, radius }. */
export function circlesOverlap(a, b) {
  const r = a.radius + b.radius;
  return distanceSq(a.x, a.y, b.x, b.y) < r * r;
}

/**
 * Colisión círculo vs. rectángulo alineado a los ejes (centro cx, cy y
 * medio-lado half). Más precisa que tratar los cuadrados como círculos.
 */
export function circleSquareOverlap(circle, cx, cy, half) {
  const nx = clamp(circle.x, cx - half, cx + half);
  const ny = clamp(circle.y, cy - half, cy + half);
  return distanceSq(circle.x, circle.y, nx, ny) < circle.radius * circle.radius;
}

/** Vector con ángulo aleatorio y magnitud en [minSpeed, maxSpeed]. */
export function randomVelocity(minSpeed, maxSpeed, rng = Math.random) {
  const angle = randRange(0, TAU, rng);
  const speed = randRange(minSpeed, maxSpeed, rng);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

/** Busca una posición dentro del mundo lejos de un punto dado. */
export function findSafePosition(width, height, margin, avoid, minDistance, rng = Math.random, tries = 40) {
  let best = null;
  let bestDist = -1;
  for (let i = 0; i < tries; i++) {
    const x = randRange(margin, width - margin, rng);
    const y = randRange(margin, height - margin, rng);
    const d = avoid ? distanceSq(x, y, avoid.x, avoid.y) : Infinity;
    if (d >= minDistance * minDistance) return { x, y };
    if (d > bestDist) {
      bestDist = d;
      best = { x, y };
    }
  }
  return best;
}

/** Envuelve un valor en [0, max) — usado para que la burbuja cruce los bordes. */
export function wrap(value, max) {
  if (value < 0) return value + max;
  if (value >= max) return value - max;
  return value;
}

/** Escala progresiva por nivel con un tope. */
export const levelValue = (base, perLevel, level, max = Infinity) =>
  Math.min(max, base + perLevel * (level - 1));
