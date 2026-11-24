/**
 * Acceso a datos de puntajes. Todas las consultas usan sentencias
 * preparadas (protección contra inyección SQL).
 *
 * El ranking muestra el MEJOR puntaje de cada jugador; a igualdad de
 * puntos gana quien lo logró en menos tiempo.
 */
export function createScoresRepository(db) {
  const upsertPlayer = db.prepare(
    `INSERT INTO players (name) VALUES (?)
     ON CONFLICT(name) DO UPDATE SET name = name
     RETURNING id`,
  );
  const insertScore = db.prepare(
    'INSERT INTO scores (player_id, score, level, duration_ms) VALUES (?, ?, ?, ?)',
  );

  // Mejor partida por jugador (ROW_NUMBER sobre cada jugador).
  const bestPerPlayer = `
    SELECT p.name, s.score, s.level, s.duration_ms AS durationMs, s.created_at AS createdAt,
           ROW_NUMBER() OVER (PARTITION BY s.player_id ORDER BY s.score DESC, s.duration_ms ASC, s.id ASC) AS rn
    FROM scores s JOIN players p ON p.id = s.player_id`;

  const topStmt = db.prepare(`
    SELECT name, score, level, durationMs, createdAt FROM (${bestPerPlayer})
    WHERE rn = 1
    ORDER BY score DESC, durationMs ASC
    LIMIT ?`);

  const rankStmt = db.prepare(`
    WITH best AS (SELECT name, score, durationMs FROM (${bestPerPlayer}) WHERE rn = 1)
    SELECT
      (SELECT COUNT(*) + 1 FROM best b2
        WHERE b2.score > b.score OR (b2.score = b.score AND b2.durationMs < b.durationMs)) AS rank,
      b.score AS best
    FROM best b WHERE b.name = ? COLLATE NOCASE`);

  const statsStmt = db.prepare(`
    SELECT COUNT(*) AS games, COALESCE(MAX(s.score), 0) AS best, COALESCE(SUM(s.score), 0) AS total,
           COALESCE(MAX(s.level), 0) AS maxLevel
    FROM scores s JOIN players p ON p.id = s.player_id
    WHERE p.name = ? COLLATE NOCASE`);

  return {
    /** Registra una partida y devuelve la posición del jugador. */
    save({ name, score, level, durationMs }) {
      db.exec('BEGIN');
      try {
        const { id } = upsertPlayer.get(name);
        insertScore.run(id, score, level, durationMs);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      return this.rankOf(name);
    },

    top(limit = 10) {
      return topStmt.all(limit).map((r) => ({ ...r }));
    },

    rankOf(name) {
      const row = rankStmt.get(name);
      return row ? { rank: row.rank, best: row.best } : { rank: null, best: 0 };
    },

    playerStats(name) {
      return { ...statsStmt.get(name) };
    },
  };
}
