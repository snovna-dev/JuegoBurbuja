/**
 * Bus de eventos mínimo. Desacopla la lógica del juego de la UI y el audio:
 * el juego "emite" lo que pasa y cada módulo decide cómo reaccionar.
 */
export class EventBus {
  #handlers = new Map();

  on(type, handler) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    this.#handlers.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    this.#handlers.get(type)?.delete(handler);
  }

  emit(type, payload) {
    this.#handlers.get(type)?.forEach((h) => h(payload));
  }
}
