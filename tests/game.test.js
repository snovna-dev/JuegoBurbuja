import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { EventBus } from '../src/core/EventBus.js';
import { Game, STATES } from '../src/core/Game.js';

function setup() {
  const bus = new EventBus();
  const events = [];
  for (const type of ['score', 'lives', 'level', 'hit', 'gameover', 'state']) {
    bus.on(type, (p) => events.push({ type, ...p }));
  }
  const game = new Game(bus);
  game.start('Tester');
  return { game, events };
}

/** Coloca un enemigo activo exactamente sobre la burbuja. */
function putEnemyOnBubble(game) {
  const enemy = game.enemies[0];
  enemy.spawnTimer = 0;
  enemy.x = game.bubble.x;
  enemy.y = game.bubble.y;
  enemy.vx = 0;
  enemy.vy = 0;
  return enemy;
}

test('la partida inicia con 3 vidas y la burbuja quieta', () => {
  const { game } = setup();
  assert.equal(game.state, STATES.PLAYING);
  assert.equal(game.lives, CONFIG.lives.start);
  assert.equal(game.bubble.moving, false);
  assert.ok(game.gems.length > 0);
  assert.ok(game.enemies.length > 0);
});

test('tocar un cuadro negro suma un punto y hace crecer la burbuja', () => {
  const { game, events } = setup();
  const gem = game.gems[0];
  gem.appear = 1;
  gem.x = game.bubble.x;
  gem.y = game.bubble.y;
  const before = game.gems.length;
  game.update(CONFIG.fixedStep);
  assert.equal(game.score, 1);
  assert.equal(game.gems.length, before - 1);
  assert.ok(game.bubble.growth > 0);
  assert.ok(events.some((e) => e.type === 'score' && e.score === 1));
});

test('un cuadro rojo quita una vida y da invulnerabilidad temporal', () => {
  const { game, events } = setup();
  putEnemyOnBubble(game);
  game.update(CONFIG.fixedStep);
  assert.equal(game.lives, CONFIG.lives.start - 1);
  assert.ok(game.bubble.invulnerable > 0);
  assert.ok(events.some((e) => e.type === 'hit'));

  // Mientras es invulnerable no pierde más vidas.
  putEnemyOnBubble(game);
  game.update(CONFIG.fixedStep);
  assert.equal(game.lives, CONFIG.lives.start - 1);
});

test('los enemigos recién aparecidos no hacen daño', () => {
  const { game } = setup();
  const enemy = putEnemyOnBubble(game);
  enemy.spawnTimer = 0.5;
  game.update(CONFIG.fixedStep);
  assert.equal(game.lives, CONFIG.lives.start);
});

test('al perder todas las vidas termina el juego', () => {
  const { game, events } = setup();
  for (let i = 0; i < CONFIG.lives.start; i++) {
    game.bubble.invulnerable = 0;
    putEnemyOnBubble(game);
    game.update(CONFIG.fixedStep);
  }
  assert.equal(game.lives, 0);
  assert.equal(game.state, STATES.DYING);
  for (let t = 0; t < 2; t += CONFIG.fixedStep) game.update(CONFIG.fixedStep);
  assert.equal(game.state, STATES.OVER);
  const over = events.find((e) => e.type === 'gameover');
  assert.equal(over.name, 'Tester');
  assert.equal(over.level, 1);
});

test('al atrapar todos los cuadros sube de nivel con más enemigos', () => {
  const { game } = setup();
  const enemiesBefore = game.enemies.length;
  game.gems = [];
  game.update(CONFIG.fixedStep);
  assert.equal(game.level, 2);
  assert.ok(game.enemies.length > enemiesBefore);
  assert.equal(game.bubble.growth, 0);
});

test('cada N puntos se gana una vida extra', () => {
  const { game } = setup();
  game.lives = 2;
  game.score = CONFIG.lives.bonusEvery - 1;
  const gem = game.gems[0];
  gem.appear = 1;
  gem.x = game.bubble.x;
  gem.y = game.bubble.y;
  game.update(CONFIG.fixedStep);
  assert.equal(game.lives, 3);
});

test('resize reubica los objetos proporcionalmente', () => {
  const { game } = setup();
  game.bubble.x = 450;
  game.bubble.y = 300;
  game.resize(450, 300);
  assert.equal(game.bubble.x, 225);
  assert.equal(game.bubble.y, 150);
});
