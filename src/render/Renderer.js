import { CONFIG, MIN_WORLD_SHORT_SIDE, WORLD_SHORT_SIDE } from '../config.js';
import { STATES } from '../core/Game.js';
import { Background } from './Background.js';
import { drawBubble, drawEnemy, drawGem, drawParticles } from './painters.js';

const FONT = '"Fredoka", system-ui, sans-serif';

/**
 * Renderizador Canvas 2D.
 *  - Ajusta el canvas al contenedor (responsivo) y a la densidad de píxeles.
 *  - Convierte unidades de mundo a píxeles: el lado corto = 600 unidades.
 */
export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.game = game;
    this.background = new Background();
    this.unit = 1;
    this.dpr = 1;

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas.parentElement);
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio);
    const shortPx = Math.min(cssW, cssH);
    const worldShort = Math.min(WORLD_SHORT_SIDE, Math.max(MIN_WORLD_SHORT_SIDE, shortPx));
    this.unit = shortPx / worldShort;

    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;

    const worldW = cssW / this.unit;
    const worldH = cssH / this.unit;
    this.game.resize(worldW, worldH);
    this.background.resize(worldW, worldH, this.unit * this.dpr);
  }

  render(dt) {
    const { ctx, game } = this;
    const { world, time } = game;
    const scale = this.unit * this.dpr;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Sacudida de cámara al recibir daño.
    if (game.shake > 0) {
      const k = game.shake * game.shake * 9;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }

    const animate = game.state !== STATES.PAUSED;
    this.background.draw(ctx, time, animate ? dt : 0);

    if (game.state === STATES.MENU) return;

    for (const gem of game.gems) drawGem(ctx, gem, time);
    for (const enemy of game.enemies) drawEnemy(ctx, enemy, time);

    if (game.state === STATES.PLAYING || game.state === STATES.PAUSED) {
      this.#drawBubbleWrapped(game.bubble, world, time);
    }

    drawParticles(ctx, game.particles, FONT);

    // Destello rojo en los bordes al recibir daño.
    if (game.flash > 0) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const g = ctx.createRadialGradient(world.width / 2, world.height / 2, Math.min(world.width, world.height) * 0.3, world.width / 2, world.height / 2, Math.max(world.width, world.height) * 0.7);
      g.addColorStop(0, 'rgba(255,40,80,0)');
      g.addColorStop(1, `rgba(255,40,80,${game.flash * 0.45})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, world.width, world.height);
    }
  }

  /** Dibuja la burbuja y su "fantasma" cuando cruza un borde. */
  #drawBubbleWrapped(bubble, world, time) {
    const { ctx } = this;
    const r = bubble.radius * 1.2;
    const xs = [0];
    const ys = [0];
    if (bubble.x < r) xs.push(world.width);
    if (bubble.x > world.width - r) xs.push(-world.width);
    if (bubble.y < r) ys.push(world.height);
    if (bubble.y > world.height - r) ys.push(-world.height);
    for (const ox of xs) for (const oy of ys) drawBubble(ctx, bubble, time, ox, oy);
  }

  destroy() {
    this.observer.disconnect();
  }
}
