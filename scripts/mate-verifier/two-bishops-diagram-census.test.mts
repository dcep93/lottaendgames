import assert from 'node:assert/strict'
import test from 'node:test'
import { collectPolicyGraphObservations } from './two-bishops-diagram-census.mts'
import type {
  MateVerificationAdapter,
  MateVerificationExpansion,
  MateVerificationRoot,
} from './types.mts'

const graph: Readonly<Record<string, readonly string[]>> = {
  a: ['b', 'c'],
  b: ['a', 'd'],
  c: ['b'],
  d: [],
}

const adapter: MateVerificationAdapter<string> = {
  key: (state) => state,
  render: (state) => state,
  expand: (state): MateVerificationExpansion<string> => ({
    blackReplies: graph[state]!.length,
    branches: graph[state]!.map((next) => ({
      kind: 'continue',
      moves: ['white', 'black'],
      next,
      resetsHalfmoveClock: [false, false],
      states: [state, next],
    })),
    whiteChoices: graph[state]!.length > 0 ? 1 : 0,
  }),
}

function root(state: string): MateVerificationRoot<string> {
  return { fen: state, halfmoveClock: 0, source: state, state }
}

test('policy census counts children when a repeated parent stops recursion', () => {
  const census = collectPolicyGraphObservations(
    [root('a'), root('b')],
    adapter,
  )
  assert.equal(census.roots, 2)
  assert.equal(census.expandedPositions, 4)
  assert.deepEqual(
    Object.fromEntries(
      [...census.positions].map(([key, value]) => [
        key,
        value.observations,
      ]),
    ),
    {
      a: 4,
      b: 4,
      c: 2,
      d: 3,
    },
  )
})

test('policy census honors its deterministic root limit', () => {
  const census = collectPolicyGraphObservations(
    [root('a'), root('b')],
    adapter,
    { maxRoots: 1 },
  )
  assert.equal(census.roots, 1)
  assert.equal(census.expandedPositions, 4)
})
