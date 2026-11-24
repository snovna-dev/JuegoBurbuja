/**
 * Envoltorio seguro de localStorage: en modo incógnito o con el
 * almacenamiento bloqueado, el juego sigue funcionando sin guardar nada.
 */
const PREFIX = 'burbuja:';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* sin almacenamiento disponible */
    }
  },
};
