# Juego de la Burbuja

Juego de navegador en el que controlas una burbuja que debe atrapar los cuadros negros que flotan por el tablero mientras esquiva los cuadros rojos. Funciona en computadores (teclado) y en celulares (gestos y pad táctil), en vertical y en horizontal.

Autores originales: Michael Fabian Rojas Sabogal y Laura Viviana Gomez Urueña (2021).
Versión 2.0: reestructuración completa del proyecto manteniendo la idea original.

---

## Cómo se juega

1. Al abrir el juego se pide tu nombre (entre 2 y 16 caracteres).
2. La burbuja aparece quieta en el centro del tablero. Al elegir una dirección empieza a moverse y ya no se detiene: tu trabajo es guiarla.
3. Cada cuadro negro que toques suma 1 punto y hace crecer un poco la burbuja.
4. Cada cuadro rojo que te toque te quita una vida. Empiezas con 3 vidas; después de un golpe tienes 2 segundos de invulnerabilidad (la burbuja parpadea).
5. Cada 20 puntos ganas una vida extra (máximo 5).
6. Cuando atrapas todos los cuadros negros pasas al siguiente nivel: aparecen más cuadros negros, más enemigos y todo va más rápido. Desde el nivel 3 aparecen los "cazadores" (cuadros naranjas con cuernos) que persiguen a la burbuja.
7. Si la burbuja sale por un borde aparece por el lado contrario.
8. Al perder todas las vidas se guarda tu puntaje y ves tu puesto en el ranking.

### Controles

| Acción             | Computador                     | Celular                                         |
|--------------------|--------------------------------|-------------------------------------------------|
| Cambiar dirección  | Flechas o W A S D              | Deslizar el dedo sobre el tablero o pad táctil  |
| Pausar / continuar | P o Esc, o el botón de pausa   | Botón de pausa                                  |
| Sonido             | Botón de sonido                | Botón de sonido                                 |

El juego se pausa solo si cambias de pestaña o minimizas la aplicación.

---

## Requisitos

- Node.js 22.13 o superior (se usa el módulo nativo `node:sqlite`, por eso no hay que compilar nada).
- npm 10 o superior.

## Instalación y uso

```bash
npm install          # instala dependencias
npm run dev          # modo desarrollo: http://localhost:5173 (recarga en caliente + API)
npm test             # ejecuta las pruebas automáticas
npm run build        # genera la versión optimizada en dist/
npm start            # sirve dist/ + API en http://localhost:5173
```

Variables de entorno opcionales para `npm start` / `npm run dev`:

| Variable  | Valor por defecto    | Descripción                          |
|-----------|----------------------|--------------------------------------|
| `PORT`    | `5173`               | Puerto del servidor                  |
| `HOST`    | `0.0.0.0`            | Interfaz de red (permite probar desde el celular en la misma red Wi-Fi) |
| `DB_FILE` | `data/burbuja.db`    | Ruta del archivo SQLite              |

Para probar en el celular: ejecuta `npm run dev`, busca la IP local del computador (por ejemplo `192.168.1.20`) y abre `http://192.168.1.20:5173` desde el navegador del teléfono.

### Publicar como sitio estático (GitHub Pages u otro hosting)

`npm run build` genera la carpeta `dist/` con rutas relativas, así que se puede subir tal cual a GitHub Pages, Netlify, Vercel o cualquier hosting estático. Sin servidor, el juego detecta que la API no está disponible y guarda los puntajes en el `localStorage` del navegador (el ranking queda local a ese dispositivo). Con `npm start` el ranking es compartido y se guarda en SQLite.

---

## Tecnologías

| Pieza              | Tecnología                         | Para qué                                                       |
|--------------------|------------------------------------|----------------------------------------------------------------|
| Juego              | JavaScript (módulos ES) + Canvas 2D| Motor, física, colisiones y dibujo de personajes               |
| Interfaz           | HTML + CSS moderno                 | Pantallas, HUD, diseño responsivo, animaciones                 |
| Empaquetado        | Vite                               | Servidor de desarrollo con recarga en caliente y build optimizado |
| Tipografía         | Fredoka (@fontsource, incluida en el build, sin depender de Google Fonts) | Estilo redondeado y amigable |
| Servidor           | Node.js + Express 5                | API REST de puntajes y servir el juego                         |
| Base de datos      | SQLite (`node:sqlite` nativo)      | Jugadores y partidas                                           |
| Pruebas            | `node:test` (incluido en Node)     | Pruebas de reglas del juego, matemáticas y API                 |
| Sonido             | Web Audio API                      | Efectos sintetizados, sin archivos de audio                    |

No se usan imágenes: todos los personajes, efectos y el fondo se dibujan con código (gradientes, curvas y halos), lo que mantiene el juego liviano (≈ 12 KB de JavaScript comprimido) y nítido en cualquier resolución.

---

## Estructura del proyecto

```
├── index.html               Página principal: HUD, tablero, pantallas y pad táctil
├── vite.config.js           Configuración de Vite (rutas relativas para hosting estático)
├── package.json             Dependencias y scripts
├── public/                  Archivos copiados tal cual (ícono, manifest para instalar como app)
├── src/
│   ├── main.js              Punto de entrada: crea los módulos y los conecta
│   ├── config.js            Todos los valores ajustables del juego (velocidades, vidas, niveles…)
│   ├── core/
│   │   ├── Game.js          Reglas del juego y máquina de estados (menú, jugando, pausa, fin)
│   │   ├── GameLoop.js      Ciclo de juego con paso de tiempo fijo
│   │   ├── Input.js         Teclado, gestos táctiles y pad direccional
│   │   ├── EventBus.js      Comunicación por eventos entre módulos
│   │   └── math.js          Colisiones, aleatorios y utilidades puras
│   ├── entities/
│   │   ├── Bubble.js        La burbuja del jugador
│   │   ├── Gem.js           Cuadro negro (objetivo)
│   │   ├── Enemy.js         Cuadro rojo (enemigo) y cazador
│   │   ├── ParticleSystem.js Partículas con reciclaje de objetos
│   │   └── physics.js       Rebote contra las paredes
│   ├── render/
│   │   ├── Renderer.js      Canvas responsivo, escala y densidad de píxeles
│   │   ├── painters.js      Dibujo de cada personaje y de las partículas
│   │   ├── Background.js    Fondo animado del tablero
│   │   └── sprites.js       Halos pre-renderizados (rendimiento)
│   ├── audio/Sound.js       Efectos de sonido
│   ├── services/
│   │   ├── ScoreService.js  Puntajes: API del servidor o localStorage como respaldo
│   │   └── storage.js       Acceso seguro a localStorage
│   ├── ui/UI.js             Pantallas, HUD, ranking y validación del nombre
│   └── styles/main.css      Estilos y diseño responsivo
├── server/
│   ├── index.js             Arranque: Vite en desarrollo, dist/ en producción
│   ├── app.js               Rutas de la API REST
│   ├── db.js                Conexión a SQLite y migraciones
│   ├── scoresRepository.js  Consultas SQL (sentencias preparadas)
│   └── validation.js        Validación de los datos recibidos
├── tests/                   Pruebas automáticas
├── data/                    Archivo SQLite (se crea al iniciar el servidor; no se versiona)
└── legacy/v1/               Versión original del juego (2021), como referencia
```

---

## Cómo está armado

### Separación por responsabilidades

El código original mezclaba reglas, dibujo y DOM en variables globales. Ahora cada parte tiene una sola responsabilidad:

```
Input ──► Game (reglas) ──eventos──► UI · Sound · ScoreService
              ▲
GameLoop ─────┴──► Renderer ──► painters (personajes)
```

- **Game** contiene el estado y las reglas (puntaje, vidas, niveles, colisiones). No toca el DOM ni el canvas, por eso se puede probar con `node --test`.
- **Game** avisa lo que pasa mediante el **EventBus** (`score`, `lives`, `hit`, `level`, `gameover`…). La interfaz, el sonido y el guardado de puntajes escuchan esos eventos sin que el juego los conozca.
- **Renderer** sólo lee el estado y dibuja. Los **painters** contienen el arte de cada personaje: cambiar el estilo visual no afecta las reglas.

### Ciclo de juego con paso fijo

La versión anterior movía los objetos "un poco en cada frame", así que en una pantalla de 144 Hz el juego iba más del doble de rápido que en una de 60 Hz. `GameLoop` acumula el tiempo real y avanza la simulación en pasos fijos de 1/120 s; el dibujo ocurre una vez por frame. Resultado: misma velocidad en cualquier dispositivo y colisiones estables. Si la pestaña estuvo inactiva no intenta "recuperar" el tiempo perdido.

### Unidades de mundo y diseño responsivo

Todas las medidas del juego están en "unidades de mundo": el lado corto del tablero mide 600 unidades (440 como mínimo en pantallas pequeñas, para que los personajes no se vean diminutos). El `Renderer` calcula cuántos píxeles equivale una unidad según el tamaño del contenedor y la densidad de píxeles de la pantalla (limitada a 2× para cuidar el rendimiento en celulares). Al rotar el teléfono o cambiar el tamaño de la ventana los objetos se reubican proporcionalmente.

La interfaz usa CSS Grid:

- Computador: HUD arriba y tablero ocupando el resto de la pantalla.
- Celular vertical: HUD compacto, tablero y pad direccional debajo.
- Celular horizontal: el pad pasa a la derecha del tablero.

Se respetan las zonas seguras de pantallas con muesca (`env(safe-area-inset-*)`), se usa `100dvh` para que la barra del navegador móvil no tape el juego y se desactivan el zoom y el desplazamiento accidental sobre el tablero.

### Personajes

- **Burbuja (jugador):** cuerpo translúcido con borde iridiscente que gira como una pompa de jabón, brillos, ojos que miran hacia donde se mueve, parpadeo, efecto gelatina al comer o recibir daño y ojos en "x" tras un golpe. Al cruzar un borde se dibuja también del otro lado para que la transición sea continua.
- **Cuadro negro (objetivo):** obsidiana con borde neón cian/violeta que pulsa, faceta interior y destellos ocasionales. Aparece con una animación de rebote.
- **Cuadro rojo (enemigo):** cubo rojo con cejas enojadas, ojos que siguen a la burbuja y boca en zigzag. Al aparecer muestra un anillo de aviso y durante 1 segundo no hace daño, para evitar golpes injustos.
- **Cazador:** variante naranja con cuernos que gira lentamente hacia la burbuja.

Los halos de luz se pre-renderizan una vez en canvas fuera de pantalla y se reutilizan, en lugar de usar `shadowBlur` en cada frame, que es costoso en móviles.

### Reglas y dificultad

Todos los números del juego están en `src/config.js`: vidas iniciales, tiempo de invulnerabilidad, velocidad de la burbuja, cantidad de cuadros y enemigos por nivel, desde qué nivel aparecen los cazadores, cada cuántos puntos se gana una vida, etc. Ajustar la dificultad no requiere tocar la lógica. La progresión por nivel usa `base + incremento × (nivel − 1)` con un tope para que el juego siga siendo jugable.

Colisiones:

- Burbuja con cuadro negro: círculo contra círculo.
- Burbuja con cuadro rojo: círculo contra cuadrado (punto más cercano del cuadrado), con una caja de colisión un poco más pequeña que el dibujo para que se sienta justo.

### Puntajes y base de datos

La API REST (`server/app.js`):

| Método | Ruta                          | Descripción                                    |
|--------|-------------------------------|------------------------------------------------|
| GET    | `/api/health`                 | Estado del servicio                            |
| GET    | `/api/scores?limit=10`        | Ranking: mejor partida de cada jugador         |
| POST   | `/api/scores`                 | Registra una partida `{ name, score, level, durationMs }` y devuelve el puesto |
| GET    | `/api/players/:name/stats`    | Partidas jugadas, mejor puntaje, total y nivel máximo |

Base de datos SQLite con dos tablas:

- `players`: `id`, `name` (único, sin distinguir mayúsculas), `created_at`.
- `scores`: `id`, `player_id`, `score`, `level`, `duration_ms`, `created_at`, con índices para el ranking.

El esquema se crea con migraciones numeradas en `server/db.js` (usando `PRAGMA user_version`): para cambiar la base de datos se agrega una migración nueva al arreglo. En el ranking, a igualdad de puntos gana quien lo logró en menos tiempo.

Seguridad básica: todas las consultas usan sentencias preparadas, el servidor valida nombre, puntaje, nivel y duración (y descarta puntajes imposibles para el tiempo jugado), limita el tamaño del cuerpo de las peticiones y la cantidad de envíos por IP, y la interfaz muestra los nombres con `textContent` para evitar inyección de HTML.

### Pruebas

`npm test` ejecuta pruebas con el runner nativo de Node:

- `tests/math.test.js`: colisiones, envoltura de bordes y posiciones seguras.
- `tests/game.test.js`: sumar puntos, crecer, perder vidas, invulnerabilidad, enemigos que aparecen sin hacer daño, fin del juego, subir de nivel, vida extra y redimensionado.
- `tests/api.test.js`: guardar y consultar puntajes, ranking por jugador, desempates, validaciones y JSON malformado.

---

## Ideas para seguir creciendo

- Nuevos tipos de enemigos o poderes: crear una clase en `src/entities/`, su dibujo en `src/render/painters.js` y agregarla en `Game.#spawnLevel`.
- Nuevas reglas: escuchar o emitir eventos en el `EventBus` sin modificar los demás módulos.
- Ranking por semana o por nivel: nueva consulta en `server/scoresRepository.js` y una ruta en `server/app.js`.
- Convertirlo en app instalable sin conexión agregando un service worker (ya incluye el `manifest`).
