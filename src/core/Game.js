import { CONFIG } from '../config.js';
import { Bubble } from '../entities/Bubble.js';
import { Gem } from '../entities/Gem.js';
import { Enemy, ENEMY_TYPES } from '../entities/Enemy.js';
import { ParticleSystem } from '../entities/ParticleSystem.js';
import { circlesOverlap, circleSquareOverlap, findSafePosition, levelValue } from './math.js';

export const STATES = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DYING: 'dying',
  OVER: 'over',
});

/**
 * Lógica pura del juego (modelo + reglas). No sabe nada del DOM ni de cómo
 * se dibuja: comunica lo que ocurre a través del EventBus.
 *
 * Eventos emitidos:
 *  - state      { state }
 *  - score      { score }
 *  - lives      { lives, delta }
 *  - level      { level }
 *  - collect    { x, y, score }
 *  - hit        { x, y, lives }
 *  - firstMove  {}
 *  - gameover   { score, level, durationMs }
 */
export class Game {
  constructor(bus) {
    this.bus = bus;
    this.world = { width: 900, height: 600 };
    this.particles = new ParticleSystem();
    this.state = STATES.MENU;
    this.time = 0;
    this.#resetRun();
  }

  // ---------------------------------------------------------------- ciclo de vida

  /** Inicia una partida nueva. */
  start(playerName) {
    this.playerName = playerName;
    this.#resetRun();
    this.particles.clear();
    this.#spawnLevel();
    this.#setState(STATES.PLAYING);
    this.bus.emit('score', { score: this.score });
    this.bus.emit('lives', { lives: this.lives, delta: 0 });
    this.bus.emit('level', { level: this.level });
  }

  togglePause() {
    if (this.state === STATES.PLAYING) this.#setState(STATES.PAUSED);
    else if (this.state === STATES.PAUSED) this.#setState(STATES.PLAYING);
  }

  pause() {
    if (this.state === STATES.PLAYING) this.#setState(STATES.PAUSED);
  }

  quitToMenu() {
    this.particles.clear();
    this.gems = [];
    this.enemies = [];
    this.#setState(STATES.MENU);
  }

  setDirection(dir) {
    if (this.state !== STATES.PLAYING) return;
    const first = !this.bubble.started;
    this.bubble.setDirection(dir);
    if (first) this.bus.emit('firstMove', {});
  }

  /**
   * El tablero cambió de tamaño (rotación del celular, ventana, etc.).
   * Se reubican los objetos proporcionalmente para que nada quede afuera.
   */
  resize(width, height) {
    const sx = width / this.world.width;
    const sy = height / this.world.height;
    const scale = (o) => {
      o.x *= sx;
      o.y *= sy;
    };
    scale(this.bubble);
    this.gems.forEach(scale);
    this.enemies.forEach(scale);
    this.particles.items.forEach(scale);
    this.world = { width, height };
  }

  // ---------------------------------------------------------------- simulación

  update(dt) {
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 2.2);

    if (this.state === STATES.PAUSED || this.state === STATES.MENU) return;

    this.particles.update(dt);
    if (this.state === STATES.OVER) return;

    const { world, bubble } = this;
    const alive = this.state === STATES.PLAYING;

    if (alive) {
      this.elapsed += dt;
      const speed = levelValue(CONFIG.bubble.speed, CONFIG.bubble.speedPerLevel, this.level, CONFIG.bubble.speed * 1.5);
      bubble.update(dt, world, speed);
      this.trailTimer -= dt;
      if (bubble.moving && this.trailTimer <= 0) {
        this.particles.trail(bubble.x, bubble.y, bubble.radius);
        this.trailTimer = 0.07;
      }
    }

    for (const gem of this.gems) gem.update(dt, world);
    for (const enemy of this.enemies) enemy.update(dt, world, alive ? bubble : null);

    if (alive) {
      this.#checkGems();
      this.#checkEnemies();
      if (this.gems.length === 0 && this.state === STATES.PLAYING) this.#nextLevel();
    }

    if (this.banner) {
      this.banner.timer -= dt;
      if (this.banner.timer <= 0) this.banner = null;
    }

    if (this.state === STATES.DYING) {
      this.dyingTimer -= dt;
      if (this.dyingTimer <= 0) this.#finish();
    }
  }

  // ---------------------------------------------------------------- reglas

  #checkGems() {
    const { bubble } = this;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      if (gem.appear < 0.6) continue;
      if (!circlesOverlap(bubble, gem)) continue;

      this.gems.splice(i, 1);
      this.score += 1;
      bubble.grow(CONFIG.bubble.growthPerGem);
      this.particles.collect(gem.x, gem.y);
      this.bus.emit('collect', { x: gem.x, y: gem.y, score: this.score });
      this.bus.emit('score', { score: this.score });

      if (this.score % CONFIG.lives.bonusEvery === 0 && this.lives < CONFIG.lives.max) {
        this.lives += 1;
        this.particles.label(bubble.x, bubble.y - bubble.radius - 10, '+1 ♥', '#ffd6e0');
        this.bus.emit('lives', { lives: this.lives, delta: 1 });
      }
    }
  }

  #checkEnemies() {
    const { bubble } = this;
    if (bubble.invulnerable > 0) return;

    for (const enemy of this.enemies) {
      if (enemy.harmless) continue;
      // Hitbox un poco más pequeña que el dibujo: se siente más justo.
      const hitbox = { x: bubble.x, y: bubble.y, radius: bubble.radius * 0.88 };
      if (!circleSquareOverlap(hitbox, enemy.x, enemy.y, enemy.half * 0.92)) continue;

      this.lives -= 1;
      enemy.repelFrom(bubble.x, bubble.y);
      bubble.hurt();
      this.shake = 1;
      this.flash = 1;
      this.particles.hit(bubble.x, bubble.y);
      this.bus.emit('hit', { x: bubble.x, y: bubble.y, lives: this.lives });
      this.bus.emit('lives', { lives: this.lives, delta: -1 });

      if (this.lives <= 0) this.#die();
      return; // un golpe por frame
    }
  }

  #die() {
    this.particles.hit(this.bubble.x, this.bubble.y);
    this.particles.collect(this.bubble.x, this.bubble.y);
    this.dyingTimer = 1.1;
    this.#setState(STATES.DYING);
  }

  #finish() {
    this.#setState(STATES.OVER);
    this.bus.emit('gameover', {
      name: this.playerName,
      score: this.score,
      level: this.level,
      durationMs: Math.round(this.elapsed * 1000),
    });
  }

  #nextLevel() {
    this.level += 1;
    this.bubble.resetGrowth();
    this.#spawnLevel();
    this.bus.emit('level', { level: this.level });
  }

  #spawnLevel() {
    const { world, bubble, level } = this;
    const gemCfg = CONFIG.gem;
    const enemyCfg = CONFIG.enemy;

    const gemCount = levelValue(gemCfg.baseCount, gemCfg.countPerLevel, level, gemCfg.maxCount);
    const enemyCount = levelValue(enemyCfg.baseCount, enemyCfg.countPerLevel, level, enemyCfg.maxCount);
    const enemySpeed = levelValue(enemyCfg.baseSpeed, enemyCfg.speedPerLevel, level, enemyCfg.baseSpeed * 2.6);
    const hunters = level >= enemyCfg.hunterFromLevel ? Math.ceil(enemyCount * enemyCfg.hunterRatio) : 0;

    this.gems = [];
    for (let i = 0; i < gemCount; i++) {
      const p = findSafePosition(world.width, world.height, 30, bubble, CONFIG.safeSpawnDistance);
      this.gems.push(new Gem(p.x, p.y));
    }

    this.enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      const p = findSafePosition(world.width, world.height, 40, bubble, CONFIG.safeSpawnDistance * 1.4);
      const type = i < hunters ? ENEMY_TYPES.HUNTER : ENEMY_TYPES.WANDERER;
      const enemy = new Enemy(p.x, p.y, enemySpeed, type);
      // Al aparecer, nunca se dirige directo hacia la burbuja.
      if (enemy.vx * (bubble.x - p.x) + enemy.vy * (bubble.y - p.y) > 0) {
        enemy.vx = -enemy.vx;
        enemy.vy = -enemy.vy;
      }
      this.enemies.push(enemy);
    }

    this.banner = { text: `Nivel ${level}`, sub: level === 1 ? '¡Atrapa los cuadros negros!' : bannerHint(level), timer: CONFIG.levelBannerTime };
  }

  #resetRun() {
    this.score = 0;
    this.level = 1;
    this.lives = CONFIG.lives.start;
    this.elapsed = 0;
    this.flash = 0;
    this.shake = 0;
    this.trailTimer = 0;
    this.dyingTimer = 0;
    this.banner = null;
    this.bubble = new Bubble(this.world.width / 2, this.world.height / 2);
    this.gems = [];
    this.enemies = [];
  }

  #setState(state) {
    this.state = state;
    this.bus.emit('state', { state });
  }
}

function bannerHint(level) {
  if (level === CONFIG.enemy.hunterFromLevel) return '¡Cuidado: llegan los cazadores!';
  return 'Más rápido, más enemigos';
}
