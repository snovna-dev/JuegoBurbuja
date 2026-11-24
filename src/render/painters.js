import { TAU, clamp } from '../core/math.js';
import { ENEMY_TYPES } from '../entities/Enemy.js';
import { drawGlow } from './sprites.js';

/**
 * "Pintores" de personajes: todo el arte del juego es vectorial y se genera
 * con Canvas 2D (gradientes, curvas y halos), sin imágenes externas.
 * Separar el dibujo de la lógica permite cambiar el estilo visual sin tocar
 * las reglas del juego.
 */

const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ======================================================================
// Burbuja (jugador)
// ======================================================================

export function drawBubble(ctx, b, time, offsetX = 0, offsetY = 0) {
  // Parpadeo mientras es invulnerable tras un golpe.
  if (b.invulnerable > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.35;

  const r = b.radius;
  const x = b.x + offsetX;
  const y = b.y + offsetY;

  // Efecto gelatina: respira suavemente y "rebota" al comer o recibir daño.
  const wobble = Math.sin(b.phase * 4) * 0.025 + Math.sin(b.phase * 26) * 0.09 * b.squash;
  const sx = 1 + wobble;
  const sy = 1 - wobble;

  drawGlow(ctx, '90,220,255', x, y, r * 2.3, 0.85);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);

  // Cuerpo translúcido.
  const body = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  body.addColorStop(0, 'rgba(255,255,255,0.10)');
  body.addColorStop(0.65, 'rgba(110,210,255,0.16)');
  body.addColorStop(0.9, 'rgba(150,235,255,0.42)');
  body.addColorStop(1, 'rgba(235,252,255,0.75)');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();

  // Borde iridiscente (como una pompa de jabón real) que gira lentamente.
  ctx.lineWidth = Math.max(1.6, r * 0.09);
  if (ctx.createConicGradient) {
    const rim = ctx.createConicGradient(b.phase * 0.8, 0, 0);
    rim.addColorStop(0, 'rgba(255,120,220,0.85)');
    rim.addColorStop(0.25, 'rgba(120,240,255,0.85)');
    rim.addColorStop(0.5, 'rgba(255,240,140,0.75)');
    rim.addColorStop(0.75, 'rgba(170,140,255,0.85)');
    rim.addColorStop(1, 'rgba(255,120,220,0.85)');
    ctx.strokeStyle = rim;
  } else {
    ctx.strokeStyle = 'rgba(160,235,255,0.85)';
  }
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, TAU);
  ctx.stroke();

  // Brillos.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.42, -r * 0.45, r * 0.22, r * 0.12, -0.7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(-r * 0.12, -r * 0.66, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0.25 * Math.PI, 0.55 * Math.PI);
  ctx.stroke();

  // Cara: ojos que miran hacia donde se mueve.
  const lookX = b.look.x * r * 0.16;
  const lookY = b.look.y * r * 0.14;
  const blink = (b.phase % 3.6) < 0.12 ? 0.15 : 1;
  const hurt = b.invulnerable > 1.2;
  const eyeR = r * 0.13;

  ctx.fillStyle = '#0b2a4a';
  for (const side of [-1, 1]) {
    const ex = side * r * 0.27 + lookX;
    const ey = -r * 0.05 + lookY;
    if (hurt) {
      // Ojos en "x" cuando acaba de recibir daño.
      ctx.strokeStyle = '#0b2a4a';
      ctx.lineWidth = r * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - eyeR, ey - eyeR);
      ctx.lineTo(ex + eyeR, ey + eyeR);
      ctx.moveTo(ex + eyeR, ey - eyeR);
      ctx.lineTo(ex - eyeR, ey + eyeR);
      ctx.stroke();
      continue;
    }
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeR, eyeR * 1.25 * blink, 0, 0, TAU);
    ctx.fill();
    if (blink === 1) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex - eyeR * 0.35, ey - eyeR * 0.45, eyeR * 0.38, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#0b2a4a';
    }
  }

  // Mejillas y boca.
  ctx.fillStyle = 'rgba(255,140,190,0.35)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * r * 0.46 + lookX * 0.6, r * 0.18 + lookY * 0.6, r * 0.1, r * 0.06, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#0b2a4a';
  ctx.lineWidth = Math.max(1.2, r * 0.055);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (hurt) {
    ctx.arc(lookX, r * 0.3 + lookY, r * 0.1, 0, TAU);
  } else {
    ctx.arc(lookX, r * 0.12 + lookY, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();

  ctx.restore();
  ctx.globalAlpha = 1;
}

// ======================================================================
// Cuadro negro (objetivo)
// ======================================================================

export function drawGem(ctx, g, time) {
  const appear = easeOutBack(clamp(g.appear, 0, 1));
  const pulse = 0.5 + 0.5 * Math.sin(g.phase * 3);
  const s = g.size * appear;
  const h = s / 2;

  drawGlow(ctx, '150,110,255', g.x, g.y, g.size * (1.5 + pulse * 0.4), 0.9);

  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.rotation);

  // Cuerpo de obsidiana.
  const body = ctx.createLinearGradient(-h, -h, h, h);
  body.addColorStop(0, '#3b3357');
  body.addColorStop(0.45, '#14111f');
  body.addColorStop(1, '#040308');
  ctx.fillStyle = body;
  roundedRect(ctx, -h, -h, s, s, s * 0.18);
  ctx.fill();

  // Borde neón.
  const edge = ctx.createLinearGradient(-h, -h, h, h);
  edge.addColorStop(0, '#7df9ff');
  edge.addColorStop(1, '#a78bfa');
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.65 + pulse * 0.35;
  roundedRect(ctx, -h, -h, s, s, s * 0.18);
  ctx.stroke();

  // Faceta interior y brillo.
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  roundedRect(ctx, -h * 0.5, -h * 0.5, h, h, s * 0.08);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(-h * 0.8, -h * 0.8);
  ctx.lineTo(h * 0.1, -h * 0.8);
  ctx.lineTo(-h * 0.8, h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Destello ocasional.
  const sparkle = Math.max(0, Math.sin(g.phase * 1.7 + time) - 0.92) * 12;
  if (sparkle > 0) {
    ctx.save();
    ctx.translate(g.x + h * 0.6, g.y - h * 0.6);
    ctx.fillStyle = `rgba(230,250,255,${sparkle})`;
    const k = g.size * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, -k);
    ctx.quadraticCurveTo(0, 0, k, 0);
    ctx.quadraticCurveTo(0, 0, 0, k);
    ctx.quadraticCurveTo(0, 0, -k, 0);
    ctx.quadraticCurveTo(0, 0, 0, -k);
    ctx.fill();
    ctx.restore();
  }
}

// ======================================================================
// Cuadro rojo (enemigo)
// ======================================================================

const ENEMY_PALETTES = {
  [ENEMY_TYPES.WANDERER]: { glow: '255,60,90', top: '#ff6b81', mid: '#e5173f', bottom: '#7a0a24', outline: '#4a0414' },
  [ENEMY_TYPES.HUNTER]: { glow: '255,110,40', top: '#ffb14a', mid: '#ff4d1f', bottom: '#8a1406', outline: '#4d0a02' },
};

export function drawEnemy(ctx, e, time) {
  const pal = ENEMY_PALETTES[e.type];
  const spawning = e.harmless;
  const spawnT = spawning ? 1 - e.spawnTimer : 1;
  const breathe = 1 + Math.sin(e.phase * 5) * 0.04;
  const s = e.size * breathe * (spawning ? easeOutBack(clamp(spawnT, 0, 1)) : 1);
  const h = s / 2;

  // Aviso de aparición: anillo punteado que gira.
  if (spawning) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(time * 3);
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = `rgba(${pal.glow},${0.4 + 0.4 * Math.sin(time * 18)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.size * 0.95, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(time * 14));
  }

  drawGlow(ctx, pal.glow, e.x, e.y, e.size * 1.6, 0.9);

  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.tilt);

  // Cuernos para los cazadores.
  if (e.type === ENEMY_TYPES.HUNTER) {
    ctx.fillStyle = '#ffe2b8';
    ctx.strokeStyle = pal.outline;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * h * 0.95, -h * 0.5);
      ctx.quadraticCurveTo(side * h * 1.3, -h * 1.0, side * h * 1.15, -h * 1.45);
      ctx.quadraticCurveTo(side * h * 0.75, -h * 1.05, side * h * 0.35, -h * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Cuerpo.
  const body = ctx.createLinearGradient(0, -h, 0, h);
  body.addColorStop(0, pal.top);
  body.addColorStop(0.5, pal.mid);
  body.addColorStop(1, pal.bottom);
  ctx.fillStyle = body;
  roundedRect(ctx, -h, -h, s, s, s * 0.24);
  ctx.fill();
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Brillo superior.
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  roundedRect(ctx, -h * 0.72, -h * 0.82, s * 0.5, s * 0.16, s * 0.08);
  ctx.fill();

  // Cejas enojadas.
  const lx = e.look.x * h * 0.18;
  const ly = e.look.y * h * 0.14;
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-h * 0.62 + lx, -h * 0.42 + ly);
  ctx.lineTo(-h * 0.12 + lx, -h * 0.2 + ly);
  ctx.moveTo(h * 0.62 + lx, -h * 0.42 + ly);
  ctx.lineTo(h * 0.12 + lx, -h * 0.2 + ly);
  ctx.stroke();

  // Ojos que siguen a la burbuja.
  for (const side of [-1, 1]) {
    const ex = side * h * 0.36 + lx;
    const ey = h * 0.02 + ly;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, h * 0.2, h * 0.17, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0006';
    ctx.beginPath();
    ctx.arc(ex + e.look.x * h * 0.07, ey + e.look.y * h * 0.06, h * 0.09, 0, TAU);
    ctx.fill();
  }

  // Boca en zigzag.
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = Math.max(1.5, s * 0.06);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const my = h * 0.48 + ly * 0.5;
  const teeth = 4;
  for (let i = 0; i <= teeth; i++) {
    const tx = -h * 0.4 + (h * 0.8 * i) / teeth + lx * 0.5;
    const ty = my + (i % 2 ? -h * 0.1 : h * 0.06);
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  }
  ctx.stroke();

  // Destello blanco al golpear.
  if (e.hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${e.hitFlash * 0.7})`;
    roundedRect(ctx, -h, -h, s, s, s * 0.24);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

// ======================================================================
// Partículas
// ======================================================================

export function drawParticles(ctx, particles, fontFamily) {
  for (const p of particles.items) {
    const t = p.life / p.maxLife; // 1 → 0
    ctx.globalAlpha = t;
    switch (p.kind) {
      case 'ring': {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * t;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + (1 - t) * 46, 0, TAU);
        ctx.stroke();
        break;
      }
      case 'shard': {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        break;
      }
      case 'bubble': {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.stroke();
        break;
      }
      case 'text': {
        ctx.fillStyle = p.color;
        ctx.font = `700 ${p.size}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, p.x, p.y);
        break;
      }
      default: {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.5, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}
