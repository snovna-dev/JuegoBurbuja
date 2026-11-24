import { TAU, randRange } from '../core/math.js';
import { createCanvas } from './sprites.js';

/**
 * Fondo del tablero: océano profundo con rayos de luz, una cuadrícula de
 * puntos muy sutil y burbujas decorativas que suben. La parte estática se
 * pre-renderiza al cambiar de tamaño; sólo lo animado se dibuja cada frame.
 */
export class Background {
  constructor() {
    this.layer = null;
    this.width = 0;
    this.height = 0;
    this.motes = [];
  }

  resize(width, height, pixelScale) {
    this.width = width;
    this.height = height;

    const w = Math.max(1, Math.round(width * pixelScale));
    const h = Math.max(1, Math.round(height * pixelScale));
    const c = createCanvas(w, h);
    const ctx = c.getContext('2d');
    ctx.scale(pixelScale, pixelScale);

    const base = ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, '#0d3b66');
    base.addColorStop(0.55, '#0a2547');
    base.addColorStop(1, '#06132b');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    // Cuadrícula de puntos.
    ctx.fillStyle = 'rgba(150,220,255,0.07)';
    const gap = 32;
    for (let y = gap / 2; y < height; y += gap) {
      for (let x = gap / 2; x < width; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, TAU);
        ctx.fill();
      }
    }

    // Viñeta.
    const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(2,6,20,0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    this.layer = c;

    const count = Math.round((width * height) / 9000);
    this.motes = Array.from({ length: count }, () => this.#newMote(true));
  }

  #newMote(anywhere) {
    return {
      x: randRange(0, this.width),
      y: anywhere ? randRange(0, this.height) : this.height + 10,
      r: randRange(1, 4),
      speed: randRange(8, 26),
      sway: randRange(0, TAU),
      alpha: randRange(0.08, 0.3),
    };
  }

  draw(ctx, time, dt) {
    if (this.layer) ctx.drawImage(this.layer, 0, 0, this.width, this.height);

    // Rayos de luz que se mueven lentamente.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const cx = this.width * (0.15 + i * 0.25) + Math.sin(time * 0.15 + i * 1.7) * 60;
      const w = 70 + 30 * Math.sin(time * 0.3 + i);
      const g = ctx.createLinearGradient(0, 0, 0, this.height);
      g.addColorStop(0, `rgba(120,210,255,${0.07 + 0.03 * Math.sin(time * 0.5 + i)})`);
      g.addColorStop(1, 'rgba(120,210,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.3, 0);
      ctx.lineTo(cx + w * 0.3, 0);
      ctx.lineTo(cx + w * 1.4, this.height);
      ctx.lineTo(cx - w * 0.4, this.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Burbujas decorativas.
    ctx.lineWidth = 1;
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i];
      m.y -= m.speed * dt;
      m.sway += dt;
      if (m.y < -10) this.motes[i] = this.#newMote(false);
      ctx.strokeStyle = `rgba(190,240,255,${m.alpha})`;
      ctx.beginPath();
      ctx.arc(m.x + Math.sin(m.sway) * 6, m.y, m.r, 0, TAU);
      ctx.stroke();
    }
  }
}
