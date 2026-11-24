/**
 * Configuración central del juego.
 *
 * Todas las medidas están en "unidades de mundo": el lado más corto del
 * tablero siempre mide WORLD_SHORT_SIDE unidades, sin importar el tamaño
 * real de la pantalla. Así el juego se siente igual en un celular y en un
 * monitor grande, y el renderizador sólo se encarga de escalar.
 */
export const WORLD_SHORT_SIDE = 600;
/**
 * En pantallas pequeñas (celulares) el mundo se reduce hasta este mínimo
 * para que los personajes no se vean diminutos.
 */
export const MIN_WORLD_SHORT_SIDE = 440;

export const CONFIG = Object.freeze({
  /** Paso fijo de simulación (segundos). 120 Hz da colisiones estables. */
  fixedStep: 1 / 120,
  /** Límite de pasos por frame para evitar la "espiral de la muerte". */
  maxStepsPerFrame: 10,
  /** Límite de devicePixelRatio (rendimiento en móviles). */
  maxPixelRatio: 2,

  bubble: {
    radius: 24,
    /** Crecimiento por cada cuadro negro atrapado dentro del nivel. */
    growthPerGem: 1.4,
    maxGrowth: 18,
    speed: 210,
    speedPerLevel: 6,
    /** Qué tan rápido la velocidad real alcanza la dirección pedida (1/s). */
    steering: 10,
    invulnerableTime: 2,
  },

  gem: {
    size: 18,
    minSpeed: 40,
    maxSpeed: 95,
    baseCount: 6,
    countPerLevel: 2,
    maxCount: 22,
  },

  enemy: {
    size: 28,
    baseSpeed: 75,
    speedPerLevel: 11,
    baseCount: 2,
    countPerLevel: 1,
    maxCount: 10,
    /** Desde este nivel aparecen enemigos "cazadores" que persiguen. */
    hunterFromLevel: 3,
    /** Fracción de enemigos que son cazadores (cuando aplica). */
    hunterRatio: 0.35,
    hunterTurnRate: 1.6,
    /** Tiempo en que el enemigo aparece y todavía no hace daño. */
    spawnGrace: 1,
  },

  lives: {
    start: 3,
    max: 5,
    /** Cada cuántos puntos se gana una vida extra. */
    bonusEvery: 20,
  },

  /** Distancia mínima entre la burbuja y cualquier objeto recién creado. */
  safeSpawnDistance: 150,
  levelBannerTime: 1.6,

  leaderboardSize: 10,
  playerNameMaxLength: 16,
});
