import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * Conexión a SQLite usando el módulo nativo de Node (`node:sqlite`,
 * Node >= 22.13). No requiere compilar dependencias nativas.
 *
 * El esquema se crea/actualiza con migraciones numeradas: para cambiar la
 * base de datos en el futuro basta con agregar un elemento al arreglo.
 */
const MIGRATIONS = [
  // 1 — esquema inicial
  `
  CREATE TABLE players (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE scores (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    score        INTEGER NOT NULL CHECK (score >= 0),
    level        INTEGER NOT NULL CHECK (level >= 1),
    duration_ms  INTEGER NOT NULL CHECK (duration_ms >= 0),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_scores_player ON scores(player_id);
  CREATE INDEX idx_scores_rank   ON scores(score DESC, duration_ms ASC);
  `,
];

export function openDatabase(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  migrate(db);
  return db;
}

function migrate(db) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get();
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
