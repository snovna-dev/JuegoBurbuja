import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circleSquareOverlap, circlesOverlap, findSafePosition, levelValue, wrap } from '../src/core/math.js';

test('circlesOverlap detecta contacto', () => {
  assert.equal(circlesOverlap({ x: 0, y: 0, radius: 10 }, { x: 15, y: 0, radius: 6 }), true);
  assert.equal(circlesOverlap({ x: 0, y: 0, radius: 10 }, { x: 17, y: 0, radius: 6 }), false);
});

test('circleSquareOverlap usa la esquina más cercana', () => {
  const c = { x: 0, y: 0, radius: 10 };
  assert.equal(circleSquareOverlap(c, 15, 0, 6), true); // borde a 9
  assert.equal(circleSquareOverlap(c, 14, 14, 6), false); // esquina a ~11.3
  assert.equal(circleSquareOverlap(c, 12, 12, 6), true); // esquina a ~8.5
});

test('wrap hace aparecer la burbuja del otro lado', () => {
  assert.equal(wrap(-5, 100), 95);
  assert.equal(wrap(105, 100), 5);
  assert.equal(wrap(50, 100), 50);
});

test('levelValue escala por nivel con tope', () => {
  assert.equal(levelValue(2, 1, 1, 10), 2);
  assert.equal(levelValue(2, 1, 5, 10), 6);
  assert.equal(levelValue(2, 1, 50, 10), 10);
});

test('findSafePosition respeta la distancia mínima', () => {
  const avoid = { x: 300, y: 300 };
  for (let i = 0; i < 100; i++) {
    const p = findSafePosition(900, 600, 20, avoid, 150);
    assert.ok(Math.hypot(p.x - avoid.x, p.y - avoid.y) >= 150);
    assert.ok(p.x >= 20 && p.x <= 880 && p.y >= 20 && p.y <= 580);
  }
});
