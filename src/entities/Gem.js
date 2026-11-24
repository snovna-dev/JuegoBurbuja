import { CONFIG } from '../config.js';
import { randomVelocity, randRange, randSign } from '../core/math.js';
import { bounceInside } from './physics.js';

/**
 * Cuadro negro: el objetivo del juego. Rebota por el tablero y la burbuja
 * debe tocarlo para sumar un punto.
 */
export class Gem {
  constructor(x, y) {
    const cfg = CONFIG.gem;
    const v = randomVelocity(cfg.minSpeed, cfg.maxSpeed);
    this.x = x;
    this.y = y;
    this.vx = v.vx;
    this.vy = v.vy;
    this.size = cfg.size;
    this.half = cfg.size / 2;
    this.rotation = randRange(0, Math.PI);
    this.spin = randRange(0.6, 1.4) * randSign();
    this.phase = Math.random() * 10;
    /** 0 → 1 mientras aparece (animación de entrada). */
    this.appear = 0;
    this.alive = true;
  }

  /** Radio aproximado para la colisión con la burbuja. */
  get radius() {
    return this.half * 1.15;
  }

  update(dt, world) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    bounceInside(this, world, this.half);
    this.rotation += this.spin * dt;
    this.phase += dt;
    this.appear = Math.min(1, this.appear + dt * 2.5);
  }
}
