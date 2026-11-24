import { storage } from '../services/storage.js';

/**
 * Efectos de sonido sintetizados con Web Audio API: no se descarga ningún
 * archivo de audio. El contexto se crea en el primer gesto del usuario
 * (requisito de los navegadores móviles).
 */
export class Sound {
  #ctx = null;
  #master = null;

  constructor() {
    this.muted = storage.get('muted', false);
  }

  /** Debe llamarse desde un evento de usuario (click / tap). */
  unlock() {
    if (this.#ctx) {
      if (this.#ctx.state === 'suspended') this.#ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.#ctx = new AC();
    this.#master = this.#ctx.createGain();
    this.#master.gain.value = this.muted ? 0 : 0.35;
    this.#master.connect(this.#ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    storage.set('muted', this.muted);
    if (this.#master) this.#master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  #tone({ freq, to = freq, duration = 0.12, type = 'sine', gain = 0.5, delay = 0 }) {
    const ctx = this.#ctx;
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(this.#master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  collect(combo = 0) {
    const base = 520 + Math.min(combo, 12) * 30;
    this.#tone({ freq: base, to: base * 2, duration: 0.12, type: 'triangle', gain: 0.4 });
  }

  hit() {
    this.#tone({ freq: 220, to: 60, duration: 0.35, type: 'sawtooth', gain: 0.35 });
    this.#tone({ freq: 140, to: 40, duration: 0.3, type: 'square', gain: 0.15, delay: 0.02 });
  }

  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => this.#tone({ freq: f, duration: 0.16, type: 'triangle', gain: 0.35, delay: i * 0.08 }));
  }

  extraLife() {
    [784, 988, 1319].forEach((f, i) => this.#tone({ freq: f, duration: 0.12, type: 'sine', gain: 0.3, delay: i * 0.06 }));
  }

  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => this.#tone({ freq: f, to: f * 0.97, duration: 0.25, type: 'triangle', gain: 0.35, delay: i * 0.16 }));
  }

  click() {
    this.#tone({ freq: 880, to: 660, duration: 0.05, type: 'sine', gain: 0.2 });
  }
}
