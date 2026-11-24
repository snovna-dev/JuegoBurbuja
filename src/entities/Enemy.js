import { CONFIG } from '../config.js';
import { lerp, randomVelocity } from '../core/math.js';
import { bounceInside } from './physics.js';

export const ENEMY_TYPES = Object.freeze({
  /** Rebota en línea recta, como los cuadros rojos originales. */
  WANDERER: 'wanderer',
  /** Gira lentamente hacia la burbuja. Aparece en niveles avanzados. */
  HUNTER: 'hunter',
});

/**
 * Cuadro rojo: el enemigo. Si toca a la burbuja le quita una vida.
 */
export class Enemy {
  constructor(x, y, speed, type = ENEMY_TYPES.WANDERER) {
    const cfg = CONFIG.enemy;
    this.type = type;
    this.speed = type === ENEMY_TYPES.HUNTER ? speed * 0.8 : speed;
    const v = randomVelocity(this.speed, this.speed);
    this.x = x;
    this.y = y;
    this.vx = v.vx;
    this.vy = v.vy;
    this.size = cfg.size;
    this.half = cfg.size / 2;
    this.spawnTimer = cfg.spawnGrace;
    this.phase = Math.random() * 10;
    this.look = { x: 0, y: 0 };
    this.tilt = 0;
    /** Animación cuando golpea a la burbuja. */
    this.hitFlash = 0;
  }

  /** Mientras aparece no hace daño (evita golpes injustos). */
  get harmless() {
    return this.spawnTimer > 0;
  }

  /** Empuja al enemigo lejos de un punto (después de golpear). */
  repelFrom(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * this.speed;
    this.vy = (dy / len) * this.speed;
    this.hitFlash = 1;
  }

  update(dt, world, target) {
    if (this.type === ENEMY_TYPES.HUNTER && target && !this.harmless) {
      const current = Math.atan2(this.vy, this.vx);
      const desired = Math.atan2(target.y - this.y, target.x - this.x);
      let delta = desired - current;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta)); // normaliza a [-π, π]
      const maxTurn = CONFIG.enemy.hunterTurnRate * dt;
      const angle = current + Math.max(-maxTurn, Math.min(maxTurn, delta));
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    bounceInside(this, world, this.half);

    // Los ojos siguen a la burbuja.
    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.look.x = lerp(this.look.x, dx / len, Math.min(1, 6 * dt));
      this.look.y = lerp(this.look.y, dy / len, Math.min(1, 6 * dt));
    }
    this.tilt = lerp(this.tilt, (this.vx / this.speed) * 0.18, Math.min(1, 4 * dt));
    this.spawnTimer = Math.max(0, this.spawnTimer - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2);
    this.phase += dt;
  }
}
