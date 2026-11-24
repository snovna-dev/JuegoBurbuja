import { TAU, randRange } from '../core/math.js';

/**
 * Sistema de partículas sencillo con reciclaje de objetos (pool) para no
 * generar basura en cada frame. Soporta puntos, anillos, fragmentos y textos.
 */
const MAX_PARTICLES = 400;

export class ParticleSystem {
  constructor() {
    this.items = [];
    this.pool = [];
  }

  #spawn(props) {
    if (this.items.length >= MAX_PARTICLES) return;
    const p = this.pool.pop() ?? {};
    p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
    p.life = 1; p.maxLife = 1; p.size = 2; p.drag = 0;
    p.rotation = 0; p.spin = 0; p.color = '#fff'; p.text = '';
    p.kind = 'dot';
    Object.assign(p, props);
    p.maxLife = p.life;
    this.items.push(p);
  }

  /** Explosión al atrapar un cuadro negro. */
  collect(x, y) {
    this.#spawn({ kind: 'ring', x, y, size: 8, life: 0.45, color: '#7df9ff' });
    for (let i = 0; i < 14; i++) {
      const a = randRange(0, TAU);
      const s = randRange(60, 190);
      this.#spawn({
        kind: i % 3 === 0 ? 'shard' : 'dot',
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        size: randRange(2, 4.5),
        life: randRange(0.4, 0.8),
        drag: 3,
        spin: randRange(-8, 8),
        color: i % 2 ? '#a78bfa' : '#7df9ff',
      });
    }
    this.#spawn({ kind: 'text', x, y: y - 14, vy: -45, life: 0.8, text: '+1', size: 20, color: '#e0fbff' });
  }

  /** Golpe de un enemigo. */
  hit(x, y) {
    this.#spawn({ kind: 'ring', x, y, size: 14, life: 0.55, color: '#ff4d6d' });
    for (let i = 0; i < 22; i++) {
      const a = randRange(0, TAU);
      const s = randRange(80, 260);
      this.#spawn({
        kind: 'shard',
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        size: randRange(2.5, 5),
        life: randRange(0.5, 0.9),
        drag: 2.5,
        spin: randRange(-10, 10),
        color: i % 2 ? '#ff4d6d' : '#ffb3c1',
      });
    }
    this.#spawn({ kind: 'text', x, y: y - 20, vy: -40, life: 1, text: '-1 ♥', size: 22, color: '#ff8fa3' });
  }

  /** Burbujitas que se desprenden al moverse. */
  trail(x, y, radius) {
    this.#spawn({
      kind: 'bubble',
      x: x + randRange(-radius, radius) * 0.5,
      y: y + randRange(-radius, radius) * 0.5,
      vx: randRange(-10, 10),
      vy: randRange(-30, -10),
      size: randRange(1.5, 3.5),
      life: randRange(0.6, 1.2),
      color: 'rgba(200,245,255,0.8)',
    });
  }

  /** Mensaje grande y flotante (vida extra, etc.). */
  label(x, y, text, color) {
    this.#spawn({ kind: 'text', x, y, vy: -30, life: 1.4, text, size: 24, color });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.items[i] = this.items[this.items.length - 1];
        this.items.pop();
        this.pool.push(p);
        continue;
      }
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
    }
  }

  clear() {
    this.pool.push(...this.items);
    this.items.length = 0;
  }
}
