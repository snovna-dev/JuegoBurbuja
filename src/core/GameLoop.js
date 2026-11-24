/**
 * Ciclo de juego con paso fijo (fixed timestep).
 *
 * La versión anterior movía los objetos "un poco por frame", así que en una
 * pantalla de 144 Hz el juego iba más del doble de rápido que en una de 60 Hz.
 * Aquí la simulación siempre avanza en pasos de `step` segundos y el dibujo
 * ocurre una vez por frame, independiente del hardware.
 */
export class GameLoop {
  #rafId = 0;
  #last = 0;
  #accumulator = 0;

  constructor({ step, maxSteps, update, render }) {
    this.step = step;
    this.maxSteps = maxSteps;
    this.update = update;
    this.render = render;
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.#last = performance.now();
    this.#accumulator = 0;
    this.#rafId = requestAnimationFrame(this.#frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.#rafId);
  }

  #frame = (now) => {
    if (!this.running) return;
    // Si la pestaña estuvo dormida, no intentamos "recuperar" ese tiempo.
    const elapsed = Math.min((now - this.#last) / 1000, 0.25);
    this.#last = now;
    this.#accumulator += elapsed;

    let steps = 0;
    while (this.#accumulator >= this.step && steps < this.maxSteps) {
      this.update(this.step);
      this.#accumulator -= this.step;
      steps++;
    }
    if (steps === this.maxSteps) this.#accumulator = 0;

    this.render(elapsed);
    this.#rafId = requestAnimationFrame(this.#frame);
  };
}
