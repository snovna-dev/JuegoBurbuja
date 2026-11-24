/**
 * Entrada unificada: teclado (flechas / WASD), gestos de deslizar (swipe)
 * y pad direccional en pantalla. Todo se traduce a una sola acción:
 * "cambiar de dirección", igual que en el juego original, donde la burbuja
 * sigue avanzando en la última dirección elegida.
 */
export const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

const KEY_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

const SWIPE_THRESHOLD = 22; // px

export class Input {
  #cleanups = [];

  /**
   * @param {object} opts
   * @param {HTMLElement} opts.surface  Elemento que recibe los gestos.
   * @param {HTMLElement} [opts.dpad]   Contenedor con botones [data-dir].
   * @param {(dir:{x:number,y:number}, name:string)=>void} opts.onDirection
   * @param {()=>void} opts.onPause
   */
  constructor({ surface, dpad, onDirection, onPause }) {
    this.onDirection = onDirection;
    this.onPause = onPause;
    this.enabled = false;

    this.#listen(window, 'keydown', this.#onKey);
    this.#bindSwipe(surface);
    if (dpad) this.#bindDpad(dpad);
  }

  destroy() {
    this.#cleanups.forEach((fn) => fn());
    this.#cleanups = [];
  }

  #listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.#cleanups.push(() => target.removeEventListener(type, handler, options));
  }

  #emit(name) {
    if (!this.enabled) return;
    this.onDirection(DIRECTIONS[name], name);
  }

  #onKey = (e) => {
    // No interceptar mientras se escribe en un campo de texto.
    if (e.target instanceof HTMLInputElement) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (key === 'p' || key === 'Escape') {
      e.preventDefault();
      this.onPause();
      return;
    }
    const dir = KEY_MAP[key];
    if (dir) {
      e.preventDefault(); // evita que las flechas hagan scroll
      this.#emit(dir);
    }
  };

  #bindSwipe(surface) {
    let origin = null;

    const toDirection = (dx, dy) =>
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

    this.#listen(surface, 'pointerdown', (e) => {
      if (e.pointerType === 'mouse') return; // con mouse se usa el teclado
      // No capturar toques sobre botones o campos (romperían el "click").
      if (!this.enabled || e.target.closest('button, input, a, .screen')) return;
      origin = { x: e.clientX, y: e.clientY, id: e.pointerId };
      surface.setPointerCapture?.(e.pointerId);
    });

    // Permite cambiar de dirección varias veces sin levantar el dedo.
    this.#listen(surface, 'pointermove', (e) => {
      if (!origin || e.pointerId !== origin.id) return;
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      if (Math.hypot(dx, dy) >= SWIPE_THRESHOLD) {
        this.#emit(toDirection(dx, dy));
        origin.x = e.clientX;
        origin.y = e.clientY;
      }
    });

    const end = (e) => {
      if (origin && e.pointerId === origin.id) origin = null;
    };
    this.#listen(surface, 'pointerup', end);
    this.#listen(surface, 'pointercancel', end);
  }

  #bindDpad(dpad) {
    this.#listen(dpad, 'pointerdown', (e) => {
      const btn = e.target.closest('[data-dir]');
      if (!btn) return;
      e.preventDefault();
      btn.classList.add('is-pressed');
      this.#emit(btn.dataset.dir);
      navigator.vibrate?.(8);
    });
    const release = (e) => e.target.closest?.('[data-dir]')?.classList.remove('is-pressed');
    this.#listen(dpad, 'pointerup', release);
    this.#listen(dpad, 'pointerleave', release, true);
    this.#listen(dpad, 'pointercancel', release);
    this.#listen(dpad, 'contextmenu', (e) => e.preventDefault());
  }
}
