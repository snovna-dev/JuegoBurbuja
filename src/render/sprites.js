/**
 * Sprites pre-renderizados. Los "resplandores" (glow) se dibujan una sola
 * vez en un canvas fuera de pantalla y luego se copian con drawImage, que
 * es mucho más barato que usar shadowBlur en cada frame (clave en móviles).
 */
const cache = new Map();
const GLOW_SIZE = 128;

function createCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Halo radial suave del color indicado (formato "r,g,b"). */
export function glowSprite(rgb) {
  const key = `glow:${rgb}`;
  if (cache.has(key)) return cache.get(key);

  const c = createCanvas(GLOW_SIZE, GLOW_SIZE);
  const ctx = c.getContext('2d');
  const r = GLOW_SIZE / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${rgb},0.55)`);
  g.addColorStop(0.35, `rgba(${rgb},0.22)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  cache.set(key, c);
  return c;
}

/** Dibuja un halo centrado en (x, y) con el radio dado. */
export function drawGlow(ctx, rgb, x, y, radius, alpha = 1) {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * alpha;
  ctx.drawImage(glowSprite(rgb), x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = prev;
}

export { createCanvas };
