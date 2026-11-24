/**
 * Punto de entrada: crea los módulos y los conecta entre sí.
 *
 *   Input ──► Game (reglas) ──eventos──► UI / Sound / ScoreService
 *                 ▲
 *   GameLoop ─────┴──► Renderer (canvas)
 */
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './styles/main.css';

import { CONFIG } from './config.js';
import { EventBus } from './core/EventBus.js';
import { Game, STATES } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';
import { Input } from './core/Input.js';
import { Renderer } from './render/Renderer.js';
import { Sound } from './audio/Sound.js';
import { ScoreService } from './services/ScoreService.js';
import { storage } from './services/storage.js';
import { UI } from './ui/UI.js';

const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

const bus = new EventBus();
const game = new Game(bus);
const ui = new UI({ isTouch });
const sound = new Sound();
const scores = new ScoreService();
const renderer = new Renderer(document.getElementById('canvas'), game);

const input = new Input({
  surface: document.getElementById('board'),
  dpad: document.getElementById('dpad'),
  onDirection: (dir) => game.setDirection(dir),
  onPause: () => game.togglePause(),
});

const loop = new GameLoop({
  step: CONFIG.fixedStep,
  maxSteps: CONFIG.maxStepsPerFrame,
  update: (dt) => game.update(dt),
  render: (dt) => renderer.render(dt),
});

// ------------------------------------------------------------ acciones

function startGame(name) {
  sound.unlock();
  sound.click();
  storage.set('lastPlayer', name);
  ui.setPlayerName(name);
  game.start(name);
}

ui.bind({
  start: startGame,
  again: () => startGame(game.playerName),
  pause: () => {
    sound.click();
    game.togglePause();
  },
  quit: () => {
    game.quitToMenu();
    refreshLeaderboard();
  },
  toggleSound: () => {
    sound.unlock();
    ui.setMuted(sound.toggleMute());
  },
});

async function refreshLeaderboard() {
  ui.renderLeaderboard('start', null);
  const top = await scores.top();
  ui.renderLeaderboard('start', top, storage.get('lastPlayer'));
  ui.setStorageMode(scores.mode);
}

// ------------------------------------------------------------ eventos del juego

bus.on('state', ({ state }) => {
  input.enabled = state === STATES.PLAYING;
  document.body.dataset.state = state;
  switch (state) {
    case STATES.MENU:
      ui.showScreen('start');
      break;
    case STATES.PLAYING:
      ui.showScreen(null);
      ui.showHint(!game.bubble.started);
      break;
    case STATES.PAUSED:
      ui.showScreen('pause');
      break;
    case STATES.DYING:
      ui.showHint(false);
      break;
    default:
      break;
  }
});

bus.on('firstMove', () => ui.showHint(false));
bus.on('score', ({ score }) => ui.setScore(score));
bus.on('collect', ({ score }) => sound.collect(score % 10));

bus.on('lives', ({ lives, delta }) => {
  ui.setLives(lives, delta);
  if (delta > 0) sound.extraLife();
});

bus.on('hit', () => {
  sound.hit();
  navigator.vibrate?.(90);
});

bus.on('level', ({ level }) => {
  ui.setLevel(level);
  if (game.banner) ui.showBanner(game.banner.text, game.banner.sub);
  if (level > 1) sound.levelUp();
});

bus.on('gameover', async (result) => {
  sound.gameOver();
  navigator.vibrate?.([60, 40, 120]);
  ui.showGameOver(result);

  const bestKey = `best:${result.name.toLowerCase()}`;
  const previousBest = storage.get(bestKey, 0);
  const isRecord = result.score > previousBest;
  if (isRecord) storage.set(bestKey, result.score);

  try {
    const saved = await scores.save(result);
    ui.showGameOverResult(saved, { isRecord: isRecord && result.score > 0, name: result.name });
  } catch (err) {
    console.error('No se pudo guardar el puntaje', err);
    ui.showGameOverResult({ rank: null, scores: [] }, { isRecord, name: result.name });
  }
});

// Pausa automática si el usuario cambia de pestaña o minimiza la app.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pause();
});
window.addEventListener('blur', () => game.pause());

// ------------------------------------------------------------ arranque

ui.setPlayerName(storage.get('lastPlayer', ''));
ui.setMuted(sound.muted);
ui.setLives(CONFIG.lives.start);
ui.showScreen('start');
refreshLeaderboard();
loop.start();

// Útil para depurar desde la consola del navegador.
if (import.meta.env.DEV) window.__burbuja = { game, renderer, scores };
