import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';

let server;
let base;

before(async () => {
  const db = openDatabase(':memory:');
  const app = createApp({ db, rateLimit: { windowMs: 60_000, max: 1000 } });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const post = (body) =>
  fetch(`${base}/scores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health responde ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, storage: 'sqlite' });
});

test('guarda puntajes y devuelve el ranking con el mejor por jugador', async () => {
  let res = await post({ name: 'Ana', score: 5, level: 1, durationMs: 20_000 });
  assert.equal(res.status, 201);
  res = await post({ name: 'ana', score: 12, level: 2, durationMs: 40_000 }); // mismo jugador (sin distinguir mayúsculas)
  res = await post({ name: 'Luis', score: 8, level: 2, durationMs: 30_000 });
  const data = await res.json();
  assert.equal(data.rank, 2);

  const top = await (await fetch(`${base}/scores?limit=5`)).json();
  assert.deepEqual(
    top.scores.map((s) => [s.name, s.score]),
    [
      ['Ana', 12],
      ['Luis', 8],
    ],
  );
});

test('empate: gana quien lo logró en menos tiempo', async () => {
  await post({ name: 'Rapido', score: 8, level: 2, durationMs: 10_000 });
  const top = await (await fetch(`${base}/scores`)).json();
  const names = top.scores.map((s) => s.name);
  assert.ok(names.indexOf('Rapido') < names.indexOf('Luis'));
});

test('rechaza datos inválidos', async () => {
  const cases = [
    { name: 'A', score: 1, level: 1, durationMs: 1000 },
    { name: '<script>', score: 1, level: 1, durationMs: 1000 },
    { name: 'Pepe', score: -1, level: 1, durationMs: 1000 },
    { name: 'Pepe', score: 1.5, level: 1, durationMs: 1000 },
    { name: 'Pepe', score: 1000, level: 1, durationMs: 1000 }, // no plausible
    { name: 'Pepe', score: 1, level: 0, durationMs: 1000 },
  ];
  for (const body of cases) {
    const res = await post(body);
    assert.equal(res.status, 400, JSON.stringify(body));
  }
});

test('JSON malformado devuelve 400', async () => {
  const res = await fetch(`${base}/scores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
  assert.equal(res.status, 400);
});

test('estadísticas por jugador', async () => {
  const stats = await (await fetch(`${base}/players/ANA/stats`)).json();
  assert.equal(stats.games, 2);
  assert.equal(stats.best, 12);
  assert.equal(stats.total, 17);
});
