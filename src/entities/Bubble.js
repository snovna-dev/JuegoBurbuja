import { CONFIG } from '../config.js';
import { lerp, wrap } from '../core/math.js';

/**
 * La burbuja del jugador. Empieza quieta y, una vez recibe una dirección,
 * no se detiene más (mecánica original). Cruza los bordes y aparece por el
 * lado contrario.
 */
export class Bubble {
  constructor(x, y) {
    const cfg = CONFIG.bubble;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dir = { x: 0, y: 0 };
    this.baseRadius = cfg.radius;
    this.growth = 0;
    this.radius = cfg.radius;
    this.invulnerable = 0;
    this.started = false;
    /** Hacia dónde miran los ojos (suavizado). */
    this.look = { x: 0, y: 0 };
    /** Deformación tipo "gelatina" al chocar o comer. */
    this.squash = 0;
    this.phase = Math.random() * 10;
  }

  get moving() {
    return this.dir.x !== 0 || this.dir.y !== 0;
  }

  setDirection(dir) {
    this.dir = { x: dir.x, y: dir.y };
    this.started = true;
  }

  grow(amount) {
    this.growth = Math.min(CONFIG.bubble.maxGrowth, this.growth + amount);
    this.squash = 1;
  }

  resetGrowth() {
    this.growth = 0;
  }

  hurt() {
    this.invulnerable = CONFIG.bubble.invulnerableTime;
    this.squash = 1.6;
  }

  update(dt, world, speed) {
    const k = Math.min(1, CONFIG.bubble.steering * dt);
    this.vx = lerp(this.vx, this.dir.x * speed, k);
    this.vy = lerp(this.vy, this.dir.y * speed, k);
    this.x = wrap(this.x + this.vx * dt, world.width);
    this.y = wrap(this.y + this.vy * dt, world.height);

    this.radius = lerp(this.radius, this.baseRadius + this.growth, Math.min(1, 6 * dt));
    this.look.x = lerp(this.look.x, this.dir.x, Math.min(1, 8 * dt));
    this.look.y = lerp(this.look.y, this.dir.y, Math.min(1, 8 * dt));
    this.squash = Math.max(0, this.squash - dt * 3);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.phase += dt;
  }
}
