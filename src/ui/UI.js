import { CONFIG } from '../config.js';

const $ = (id) => document.getElementById(id);

const HEART_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.7 4.5c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.7 0 5.8 3.7 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';

export const formatTime = (ms) => {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * Capa de interfaz (DOM). Sólo muestra información; no contiene reglas del
 * juego. Recibe callbacks para las acciones del usuario.
 */
export class UI {
  constructor({ isTouch }) {
    this.isTouch = isTouch;
    this.el = {
      hud: $('hud'),
      name: $('hud-name'),
      lives: $('hud-lives'),
      level: $('hud-level'),
      score: $('hud-score'),
      soundBtn: $('btn-sound'),
      pauseBtn: $('btn-pause'),
      banner: $('banner'),
      bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'),
      hint: $('hint'),
      dpad: $('dpad'),
      screens: {
        start: $('screen-start'),
        pause: $('screen-pause'),
        over: $('screen-over'),
      },
      form: $('form-start'),
      input: $('player-name'),
      nameError: $('name-error'),
      boardStart: $('leaderboard-start'),
      boardOver: $('leaderboard-over'),
      storageNote: $('storage-note'),
      controlsHelp: $('controls-help'),
      over: {
        score: $('over-score'),
        level: $('over-level'),
        time: $('over-time'),
        rank: $('over-rank'),
        record: $('over-record'),
      },
    };

    this.el.controlsHelp.innerHTML = isTouch
      ? 'Desliza el dedo sobre el tablero o usa el pad para cambiar de dirección.'
      : 'Muévete con <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> o <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>. Pausa con <kbd>P</kbd>.';
    document.documentElement.classList.toggle('is-touch', isTouch);
  }

  // ------------------------------------------------------------ pantallas

  showScreen(name) {
    for (const [key, el] of Object.entries(this.el.screens)) el.hidden = key !== name;
    const inGame = name === null || name === 'pause';
    this.el.hud.hidden = !(inGame || name === 'over');
    this.el.dpad.hidden = !(this.isTouch && name === null);
    if (name === 'start') {
      requestAnimationFrame(() => {
        if (!this.isTouch) this.el.input.focus();
      });
    }
    if (name === 'pause') $('btn-resume').focus();
    if (name === 'over') $('btn-again').focus({ preventScroll: true });
  }

  /** Conecta los botones de la UI con las acciones del juego. */
  bind(actions) {
    this.el.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.el.input.value.trim().replace(/\s+/g, ' ');
      const error = validateName(name);
      this.el.nameError.textContent = error ?? '';
      this.el.input.setAttribute('aria-invalid', String(Boolean(error)));
      if (!error) actions.start(name);
    });
    this.el.input.addEventListener('input', () => {
      this.el.nameError.textContent = '';
    });
    this.el.pauseBtn.addEventListener('click', actions.pause);
    this.el.soundBtn.addEventListener('click', actions.toggleSound);
    $('btn-resume').addEventListener('click', actions.pause);
    $('btn-quit').addEventListener('click', actions.quit);
    $('btn-again').addEventListener('click', actions.again);
    $('btn-change').addEventListener('click', actions.quit);
  }

  setPlayerName(name) {
    this.el.input.value = name ?? '';
    this.el.name.textContent = name ?? '';
  }

  // ------------------------------------------------------------ HUD

  setScore(score) {
    this.el.score.textContent = score;
    bump(this.el.score.parentElement);
  }

  setLevel(level) {
    this.el.level.textContent = level;
    bump(this.el.level.parentElement);
  }

  setLives(lives, delta = 0) {
    const max = Math.max(CONFIG.lives.start, lives);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < max; i++) {
      const span = document.createElement('span');
      span.className = `heart${i < lives ? '' : ' heart--empty'}`;
      if (delta < 0 && i === lives) span.classList.add('heart--lost');
      if (delta > 0 && i === lives - 1) span.classList.add('heart--gained');
      span.innerHTML = HEART_SVG;
      frag.appendChild(span);
    }
    this.el.lives.replaceChildren(frag);
    this.el.lives.setAttribute('aria-label', `${lives} vidas`);
    if (delta < 0) bump(this.el.lives, 'shake');
  }

  setMuted(muted) {
    this.el.soundBtn.classList.toggle('is-muted', muted);
    this.el.soundBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
  }

  showBanner(title, sub) {
    const { banner, bannerTitle, bannerSub } = this.el;
    bannerTitle.textContent = title;
    bannerSub.textContent = sub ?? '';
    banner.classList.remove('is-visible');
    void banner.offsetWidth; // reinicia la animación CSS
    banner.classList.add('is-visible');
  }

  showHint(show) {
    this.el.hint.textContent = this.isTouch ? 'Desliza o usa el pad para empezar' : 'Presiona una flecha para empezar';
    this.el.hint.hidden = !show;
  }

  // ------------------------------------------------------------ puntajes

  renderLeaderboard(target, scores, highlightName) {
    const el = target === 'over' ? this.el.boardOver : this.el.boardStart;
    if (!scores) {
      el.innerHTML = '<li class="leaderboard__empty">Cargando…</li>';
      return;
    }
    if (scores.length === 0) {
      el.innerHTML = '<li class="leaderboard__empty">Aún no hay puntajes. ¡Sé el primero!</li>';
      return;
    }
    const frag = document.createDocumentFragment();
    scores.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'leaderboard__row';
      if (highlightName && s.name.toLowerCase() === highlightName.toLowerCase()) li.classList.add('is-me');
      const pos = document.createElement('span');
      pos.className = `leaderboard__pos pos-${i + 1}`;
      pos.textContent = i + 1;
      const name = document.createElement('span');
      name.className = 'leaderboard__name';
      name.textContent = s.name; // textContent: evita inyección de HTML
      const level = document.createElement('span');
      level.className = 'leaderboard__level';
      level.textContent = `Nv ${s.level}`;
      const score = document.createElement('span');
      score.className = 'leaderboard__score';
      score.textContent = s.score;
      li.append(pos, name, level, score);
      frag.appendChild(li);
    });
    el.replaceChildren(frag);
  }

  setStorageMode(mode) {
    this.el.storageNote.textContent =
      mode === 'remote' ? 'Puntajes guardados en el servidor (SQLite).' : 'Modo sin servidor: los puntajes se guardan en este navegador.';
  }

  showGameOver(result) {
    const o = this.el.over;
    o.score.textContent = result.score;
    o.level.textContent = result.level;
    o.time.textContent = formatTime(result.durationMs);
    o.rank.textContent = '…';
    o.record.hidden = true;
    this.renderLeaderboard('over', null);
    this.showScreen('over');
  }

  showGameOverResult({ rank, scores }, { isRecord, name }) {
    this.el.over.rank.textContent = rank ? `#${rank}` : '—';
    this.el.over.record.hidden = !isRecord;
    this.renderLeaderboard('over', scores, name);
  }
}

export function validateName(name) {
  if (!name) return 'Escribe tu nombre para empezar.';
  if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
  if (name.length > CONFIG.playerNameMaxLength) return `Máximo ${CONFIG.playerNameMaxLength} caracteres.`;
  if (!/^[\p{L}\p{N} _.-]+$/u.test(name)) return 'Usa sólo letras, números, espacios, "-", "_" o ".".';
  return null;
}

function bump(el, cls = 'bump') {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
