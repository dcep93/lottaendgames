import assert from 'node:assert/strict'
import test from 'node:test'
import { deriveMatePolicyRanks } from './policy-ranks.mts'
import type {
  MateVerificationAdapter,
  MateVerificationExpansion,
  MateVerificationRoot,
} from './types.mts'

function root(state: string): MateVerificationRoot<string> {
  return {
    fen: state,
    halfmoveClock: 0,
    source: 'test',
    state,
  }
}

function adapter(
  expansions: Readonly<Record<string, MateVerificationExpansion<string>>>,
): MateVerificationAdapter<string> {
  return {
    expand: (state) => {
      const expansion = expansions[state]
      if (expansion === undefined) throw new Error(`Missing state ${state}`)
      return expansion
    },
    key: (state) => state,
    render: (state) => state,
  }
}

test('policy ranks take the longest tied-White and legal-Black path', () => {
  const result = deriveMatePolicyRanks(
    [root('A'), root('B')],
    adapter({
      A: {
        blackReplies: 1,
        branches: [
          {
            kind: 'mate',
            moves: ['W1#'],
            resetsHalfmoveClock: [false],
            states: ['X'],
          },
          {
            kind: 'continue',
            moves: ['W2', 'B2'],
            next: 'B',
            resetsHalfmoveClock: [false, false],
            states: ['Y', 'B'],
          },
        ],
        whiteChoices: 2,
      },
      B: {
        blackReplies: 0,
        branches: [
          {
            kind: 'mate',
            moves: ['Wb#'],
            resetsHalfmoveClock: [false],
            states: ['Z'],
          },
        ],
        whiteChoices: 1,
      },
    }),
  )

  assert.equal(result.status, 'ranked')
  if (result.status !== 'ranked') return
  assert.deepEqual(Object.fromEntries(result.whiteRanks), { A: 3, B: 1 })
  assert.deepEqual(Object.fromEntries(result.blackRanks), { X: 0, Y: 2, Z: 0 })
  assert.equal(result.maximumWhiteRank, 3)
  assert.equal(result.maximumBlackRank, 2)
  assert.equal(result.provenRoots, 2)
})

test('policy ranks reject a selected structural cycle', () => {
  const result = deriveMatePolicyRanks(
    [root('A')],
    adapter({
      A: {
        blackReplies: 1,
        branches: [
          {
            kind: 'continue',
            moves: ['W', 'B'],
            next: 'A',
            resetsHalfmoveClock: [false, false],
            states: ['after-W', 'A'],
          },
        ],
        whiteChoices: 1,
      },
    }),
  )

  assert.equal(result.status, 'failed')
  if (result.status !== 'failed') return
  assert.equal(result.failure.kind, 'cycle')
  assert.deepEqual(result.failure.moves, ['W', 'B'])
})

test('policy ranks reject terminal failures and rule gaps', () => {
  const failure = deriveMatePolicyRanks(
    [root('A')],
    adapter({
      A: {
        blackReplies: 1,
        branches: [
          {
            failureKind: 'stalemate',
            kind: 'failure',
            message: 'stalemate branch',
            moves: ['W'],
            resetsHalfmoveClock: [false],
            states: ['draw'],
          },
        ],
        whiteChoices: 1,
      },
    }),
  )
  assert.equal(failure.status, 'failed')
  if (failure.status === 'failed') {
    assert.equal(failure.failure.kind, 'stalemate')
  }

  const gap = deriveMatePolicyRanks(
    [root('gap')],
    adapter({
      gap: { blackReplies: 0, branches: [], whiteChoices: 0 },
    }),
  )
  assert.equal(gap.status, 'failed')
  if (gap.status === 'failed') assert.equal(gap.failure.kind, 'rule-gap')
})
