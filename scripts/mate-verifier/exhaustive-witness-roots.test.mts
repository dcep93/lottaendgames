import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeExhaustiveGraph, type ExhaustiveGraphNode } from './exhaustive-graph.mts'
import { selectExhaustiveFailureSuccessor, selectExhaustiveWitnessRoots } from './exhaustive-witness-roots.mts'

function node(children: readonly number[] = [], matePlies = 0, failure = false): ExhaustiveGraphNode {
  return { children, matePlies, failure }
}

test('visits shared long paths once and prefers an eligible root on the cycle', () => {
  const size = 100_000
  const nodes = Array.from({ length: size }, (_, id) => node([
    id === 0 ? 0 : id < size / 2 ? id - 1 : size / 2 - 1 + Math.floor((id - size / 2) / 2),
  ]))
  const analysis = analyzeExhaustiveGraph(nodes)
  const roots = Array.from({ length: size }, (_, id) => size - 1 - id)
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, roots), [0])
})

test('selects one eligible root per functional cycle, not every loop-leading ancestor', () => {
  const nodes = [node([1]), node([2]), node([1]), node([4]), node([5]), node([4]), node([0])]
  const analysis = analyzeExhaustiveGraph(nodes)
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [6, 3, 2, 5]), [2, 5])
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [6, 3]), [6, 3])
})

test('uses an ancestor root when a cycle contains no eligible root', () => {
  const nodes = [node([1]), node([2]), node([1]), node([0])]
  const analysis = analyzeExhaustiveGraph(nodes)
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [3, 0]), [3])
})

test('follows stored child order when a node can lead to different cycles', () => {
  const nodes = [node([2, 1]), node([1]), node([2])]
  const analysis = analyzeExhaustiveGraph(nodes)
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 0), 2)
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [0, 1, 2]), [2, 1])
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [0]), [0])
})

test('fills remaining slots with a direct failure and longest fifty-move root', () => {
  const nodes = [node([0]), node([2]), node([], 0, true),
    ...Array.from({ length: 52 }, (_, index) => index === 51 ? node([], 1) : node([index + 4])),
  ]
  const analysis = analyzeExhaustiveGraph(nodes)
  assert.equal(analysis.rank[3], 103)
  assert.equal(analysis.rank[4], 101)
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [1, 4, 0, 2, 3]), [0, 2, 3])
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [1, 4]), [1, 4])
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 1), 2)
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 2), undefined)
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 3), 4)
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 5), 6)
})

test('loop selection wins when the same node also has a direct terminal failure', () => {
  const nodes = [node([1], 0, true), node([1]), node([], 1)]
  const analysis = analyzeExhaustiveGraph(nodes)
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 0), 1)
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [0, 1, 2]), [1])
})

test('respects limits, ignores duplicate roots, and never returns more than five', () => {
  const nodes = Array.from({ length: 8 }, (_, id) => node([id]))
  const analysis = analyzeExhaustiveGraph(nodes)
  const roots = [0, 0, 1, 2, 3, 4, 5, 6, 7]
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, roots, 0), [])
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, roots, 2), [0, 1])
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, roots, 100), [0, 1, 2, 3, 4])
  assert.throws(() => selectExhaustiveWitnessRoots(nodes, analysis, roots, -1), /Invalid witness limit/)
})

test('omits mating roots and rejects invalid root IDs', () => {
  const nodes = [node([1]), node([], 1)]
  const analysis = analyzeExhaustiveGraph(nodes)
  assert.deepEqual(selectExhaustiveWitnessRoots(nodes, analysis, [0, 1]), [])
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 0), 1)
  assert.equal(selectExhaustiveFailureSuccessor(nodes, analysis, 1), undefined)
  assert.throws(() => selectExhaustiveWitnessRoots(nodes, analysis, [-1]), /Invalid witness root/)
  assert.throws(() => selectExhaustiveWitnessRoots(nodes, analysis, [2]), /Invalid witness root/)
})
