import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeExhaustiveGraph, type ExhaustiveGraphNode } from './exhaustive-graph.mts'

function node(children: readonly number[] = [], matePlies = 0, failure = false): ExhaustiveGraphNode {
  return { children, matePlies, failure }
}

test('uses the longest branch in a DAG, including immediate mating branches', () => {
  const result = analyzeExhaustiveGraph([
    node([1, 2], 1),
    node([2, 3]),
    node([], 1),
    node([], 2),
  ])
  assert.deepEqual([...result.rank], [6, 4, 1, 2])
  assert.deepEqual(result.counts, {
    totalPositions: 4,
    mateTerminatingPositions: 4,
    loopLeadingPositions: 0,
    directFailureLeadingPositions: 0,
    loopAndFailureLeadingPositions: 0,
    fiftyMoveLeadingPositions: 0,
    maximumMatePlies: 6,
  })
})

test('one cyclic choice prevents a universal mate even when other choices mate', () => {
  const result = analyzeExhaustiveGraph([node([1, 2], 1), node([1], 1), node([], 1)])
  assert.deepEqual([...result.rank], [0, 0, 1])
  assert.deepEqual([...result.loopLeading], [1, 1, 0])
  assert.deepEqual([...result.failureLeading], [0, 0, 0])
  assert.equal(result.counts.loopLeadingPositions, 2)
})

test('propagates direct failures through branches that can also mate', () => {
  const result = analyzeExhaustiveGraph([node([1], 1), node([2], 1, true), node([], 1)])
  assert.deepEqual([...result.rank], [0, 0, 1])
  assert.deepEqual([...result.loopLeading], [0, 0, 0])
  assert.deepEqual([...result.failureLeading], [1, 1, 0])
  assert.equal(result.counts.directFailureLeadingPositions, 2)
})

test('counts cycle and failure reachability independently when they overlap', () => {
  const result = analyzeExhaustiveGraph([node([1, 2]), node([1]), node([], 0, true)])
  assert.deepEqual([...result.rank], [0, 0, 0])
  assert.deepEqual([...result.loopLeading], [1, 1, 0])
  assert.deepEqual([...result.failureLeading], [1, 0, 1])
  assert.equal(result.counts.loopLeadingPositions, 2)
  assert.equal(result.counts.directFailureLeadingPositions, 2)
  assert.equal(result.counts.loopAndFailureLeadingPositions, 1)
})

test('reports paths over 100 plies, while accepting mate on ply 100', () => {
  const longChain = Array.from({ length: 51 }, (_, id) => id === 50 ? node([], 1) : node([id + 1]))
  const result = analyzeExhaustiveGraph(longChain)
  assert.equal(result.rank[0], 101)
  assert.equal(result.rank[1], 99)
  assert.equal(result.counts.mateTerminatingPositions, 51)
  assert.equal(result.counts.fiftyMoveLeadingPositions, 1)
  assert.equal(result.counts.maximumMatePlies, 101)

  const boundaryChain = Array.from({ length: 50 }, (_, id) => id === 49 ? node([], 2) : node([id + 1]))
  const boundary = analyzeExhaustiveGraph(boundaryChain)
  assert.equal(boundary.rank[0], 100)
  assert.equal(boundary.counts.fiftyMoveLeadingPositions, 0)
})

test('preserves edge multiplicity without enqueueing nodes more than once', () => {
  const result = analyzeExhaustiveGraph([node([1, 1]), node([2, 2, 2]), node([], 1)])
  assert.deepEqual([...result.rank], [5, 3, 1])
  assert.equal(result.counts.mateTerminatingPositions, 3)
  assert.equal(result.counts.loopLeadingPositions, 0)

  const cyclic = analyzeExhaustiveGraph([node([1, 1]), node([0, 2, 2]), node([], 1)])
  assert.deepEqual([...cyclic.loopLeading], [1, 1, 0])
  assert.deepEqual([...cyclic.rank], [0, 0, 1])
})

test('treats an unexpanded branchless node as failure instead of certifying it', () => {
  const result = analyzeExhaustiveGraph([node([1]), node()])
  assert.deepEqual([...result.rank], [0, 0])
  assert.deepEqual([...result.failureLeading], [1, 1])
  assert.equal(result.counts.directFailureLeadingPositions, 2)
})

test('handles disconnected graphs and empty input', () => {
  const result = analyzeExhaustiveGraph([node([], 1), node([2]), node([1]), node([], 0, true)])
  assert.deepEqual([...result.rank], [1, 0, 0, 0])
  assert.deepEqual([...result.loopLeading], [0, 1, 1, 0])
  assert.deepEqual([...result.failureLeading], [0, 0, 0, 1])
  assert.equal(analyzeExhaustiveGraph([]).counts.totalPositions, 0)
})

test('rejects incomplete graph references and invalid terminal lengths', () => {
  assert.throws(() => analyzeExhaustiveGraph([node([1])]), /Invalid child/)
  assert.throws(() => analyzeExhaustiveGraph([node([-1])]), /Invalid child/)
  assert.throws(() => analyzeExhaustiveGraph([node([0.5])]), /Invalid child/)
  assert.throws(() => analyzeExhaustiveGraph([node([], -1)]), /Invalid mating branch length/)
  assert.throws(() => analyzeExhaustiveGraph([node([], 1.5)]), /Invalid mating branch length/)
})

test('matches a reachability oracle for every three-node graph and terminal-branch combination', () => {
  // All 512 directed graphs, each with all 64 combinations of mate/failure flags.
  // Floyd-Warshall is independent of the production reverse-edge elimination.
  for (let edgeBits = 0; edgeBits < 512; edgeBits += 1) {
    const children = Array.from({ length: 3 }, (_, from) =>
      [0, 1, 2].filter((to) => (edgeBits & (1 << (3 * from + to))) !== 0),
    )
    const reachable = children.map((row) => [0, 1, 2].map((to) => row.includes(to)))
    for (let via = 0; via < 3; via += 1) {
      for (let from = 0; from < 3; from += 1) {
        for (let to = 0; to < 3; to += 1) {
          reachable[from]![to] ||= reachable[from]![via]! && reachable[via]![to]!
        }
      }
    }
    const expectedLoops = [0, 1, 2].map((from) => Number(
      [0, 1, 2].some((to) => reachable[from]![to] && reachable[to]![to]),
    ))
    for (let terminalBits = 0; terminalBits < 64; terminalBits += 1) {
      const nodes = children.map((row, id) => node(
        row,
        (terminalBits >> (2 * id)) & 1,
        ((terminalBits >> (2 * id + 1)) & 1) === 1,
      ))
      const directFailures = nodes.map((entry) =>
        entry.failure || (entry.children.length === 0 && entry.matePlies === 0),
      )
      const expectedFailures = [0, 1, 2].map((from) => Number(
        [0, 1, 2].some((to) => (from === to || reachable[from]![to]) && directFailures[to]),
      ))
      function expectedRank(id: number): number {
        if (expectedLoops[id] || expectedFailures[id]) return 0
        return Math.max(nodes[id]!.matePlies, ...nodes[id]!.children.map((child) => 2 + expectedRank(child)))
      }
      const result = analyzeExhaustiveGraph(nodes)
      assert.deepEqual([...result.loopLeading], expectedLoops)
      assert.deepEqual([...result.failureLeading], expectedFailures)
      assert.deepEqual([...result.rank], [0, 1, 2].map(expectedRank))
      assert.equal(
        result.counts.mateTerminatingPositions + result.counts.loopLeadingPositions
          + result.counts.directFailureLeadingPositions - result.counts.loopAndFailureLeadingPositions,
        3,
      )
    }
  }
})
