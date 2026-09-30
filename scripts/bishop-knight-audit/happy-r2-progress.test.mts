import assert from 'node:assert/strict';
import test from 'node:test';
import {happyR2Progress, type RouteMove} from './happy-r2-progress.mts';

const step = (next: number[], kind = 'r2'): RouteMove => ({next, kind, mate: false});
const mate: RouteMove = {next: [], kind: 'r1', mate: true};

test('shorter completed r2 route wins regardless of insertion order; a cyclic repair cannot win', () => {
  const graph = [[step([1]), step([2]), step([0])], [mate], [step([1])]];
  assert.deepEqual(happyR2Progress(graph, 3, new Set()), [3, 1, 3]);
  graph[0]!.reverse();
  assert.deepEqual(happyR2Progress(graph, 3, new Set()), [3, 1, 3]);
});

test('all Black replies must finish; an unexpanded frontier is unresolved', () => {
  const graph = [[step([1, 3]), step([2])], [mate], [step([1])]];
  assert.deepEqual(happyR2Progress(graph, 4, new Set()), [5, 1, 3, Infinity]);
});

test('r1 and lower-rule ties remain universal, never quietly optimized as r2', () => {
  const graph = [[mate, step([0], 'r1')], [mate, step([1], 'other')], [step([0]), step([1])]];
  assert.deepEqual(happyR2Progress(graph, 3, new Set([0])), [Infinity, Infinity, Infinity]);
});
