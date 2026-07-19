import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  getSquareTransform,
  transformFen,
} from '../../app/src/mate/chess.ts'
import { getMateRuleSet } from '../../app/src/mate/rules/index.ts'
import {
  createProductionMateAdapter,
  canonicalVerifierPositionKey,
  enumerateProductionMateRoots,
  identityVerifierPositionKey,
  normalizeVerifierState,
} from './production.mts'
import { verifyMateRoots } from './search.mts'
import type {
  MateVerificationAdapter,
  MateVerificationExpansion,
  MateVerificationRoot,
} from './types.mts'

function root(
  state: string,
  halfmoveClock = 0,
): MateVerificationRoot<string> {
  return {
    fen: `${state} w - - ${halfmoveClock} 1`,
    halfmoveClock,
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

test('exact verifier accepts a checkmate-only graph', () => {
  const result = verifyMateRoots(
    [root('A')],
    adapter({
      A: {
        blackReplies: 0,
        branches: [
          {
            kind: 'mate',
            moves: ['Qa8#'],
            resetsHalfmoveClock: [false],
            states: ['mate'],
          },
        ],
        whiteChoices: 1,
      },
    }),
  )

  assert.equal(result.status, 'verified')
  assert.deepEqual(result.stats, {
    blackReplies: 0,
    maximumMatePlies: 1,
    provenRoots: 1,
    uniquePositions: 1,
    whiteChoices: 1,
  })
})

test('checkmate takes precedence at halfmove 100 while rule gaps fail', () => {
  const immediateMate = adapter({
    A: {
      blackReplies: 0,
      branches: [
        {
          kind: 'mate',
          moves: ['Qa8#'],
          resetsHalfmoveClock: [false],
          states: ['mate'],
        },
      ],
      whiteChoices: 1,
    },
  })
  assert.equal(
    verifyMateRoots([root('A', 99)], immediateMate).status,
    'verified',
  )

  const gap = verifyMateRoots(
    [root('gap')],
    adapter({
      gap: { blackReplies: 0, branches: [], whiteChoices: 0 },
    }),
  )
  assert.equal(gap.status, 'failed')
  assert.equal(gap.failure.kind, 'rule-gap')
})

test('every tied White move and legal Black reply is universal', () => {
  const result = verifyMateRoots(
    [root('A')],
    adapter({
      A: {
        blackReplies: 1,
        branches: [
          {
            kind: 'mate',
            moves: ['W1#'],
            resetsHalfmoveClock: [false],
            states: ['mate'],
          },
          {
            failureKind: 'stalemate',
            kind: 'failure',
            message: 'Black found the hidden stalemate branch',
            moves: ['W2', 'B1'],
            resetsHalfmoveClock: [false, false],
            states: ['after-W2', 'stalemate'],
          },
        ],
        whiteChoices: 2,
      },
    }),
  )

  assert.equal(result.status, 'failed')
  assert.equal(result.failure.kind, 'stalemate')
  assert.deepEqual(result.failure.moves, ['W2', 'B1'])
})

test('structural cycles omit the root prefix and start at the cycle boundary', () => {
  const result = verifyMateRoots(
    [root('P')],
    adapter({
      P: {
        blackReplies: 1,
        branches: [
          {
            kind: 'continue',
            moves: ['Wp', 'Bp'],
            next: 'A',
            resetsHalfmoveClock: [false, false],
            states: ['P-white', 'A'],
          },
        ],
        whiteChoices: 1,
      },
      A: {
        blackReplies: 1,
        branches: [
          {
            kind: 'continue',
            moves: ['Wa', 'Ba'],
            next: 'B',
            resetsHalfmoveClock: [false, false],
            states: ['A-white', 'B'],
          },
        ],
        whiteChoices: 1,
      },
      B: {
        blackReplies: 1,
        branches: [
          {
            kind: 'continue',
            moves: ['Wb', 'Bb'],
            next: 'A',
            resetsHalfmoveClock: [false, false],
            states: ['B-white', 'A'],
          },
        ],
        whiteChoices: 1,
      },
    }),
  )

  assert.equal(result.status, 'failed')
  assert.equal(result.failure.kind, 'cycle')
  assert.equal(result.failure.cycleStartPly, 0)
  assert.deepEqual(result.failure.moves, ['Wa', 'Ba', 'Wb', 'Bb'])
  assert.equal(result.failure.startingFen, 'A')
  assert.equal(result.failure.finalFen, 'A')
  assert.equal(result.failure.source, 'test')
})

test('fifty-move failures include the exact bounded witness', () => {
  const expansions: Record<string, MateVerificationExpansion<string>> = {}
  for (let index = 0; index < 50; index += 1) {
    expansions[`S${index}`] = {
      blackReplies: 1,
      branches: [
        {
          kind: 'continue',
          moves: [`W${index}`, `B${index}`],
          next: `S${index + 1}`,
          resetsHalfmoveClock: [false, false],
          states: [`S${index}-white`, `S${index + 1}`],
        },
      ],
      whiteChoices: 1,
    }
  }
  expansions.S50 = {
    blackReplies: 0,
    branches: [
      {
        kind: 'mate',
        moves: ['mate'],
        resetsHalfmoveClock: [false],
        states: ['mate'],
      },
    ],
    whiteChoices: 1,
  }

  const result = verifyMateRoots([root('S0')], adapter(expansions))
  assert.equal(result.status, 'failed')
  assert.equal(result.failure.kind, 'fifty-move')
  assert.equal(result.failure.moves.length, 100)
  assert.equal(result.failure.finalFen, 'S50')
})

test('clock resets allow an otherwise long forced mating path', () => {
  const expansions: Record<string, MateVerificationExpansion<string>> = {}
  for (let index = 0; index < 60; index += 1) {
    expansions[`S${index}`] = {
      blackReplies: 1,
      branches: [
        {
          kind: 'continue',
          moves: [`W${index}`, `p${index}`],
          next: `S${index + 1}`,
          resetsHalfmoveClock: [false, true],
          states: [`S${index}-white`, `S${index + 1}`],
        },
      ],
      whiteChoices: 1,
    }
  }
  expansions.S60 = {
    blackReplies: 0,
    branches: [
      {
        kind: 'mate',
        moves: ['mate'],
        resetsHalfmoveClock: [false],
        states: ['mate'],
      },
    ],
    whiteChoices: 1,
  }

  const result = verifyMateRoots([root('S0', 99)], adapter(expansions))
  assert.equal(result.status, 'failed')
  assert.equal(result.failure.kind, 'fifty-move')
  assert.deepEqual(result.failure.moves, ['W0'])

  const safe = verifyMateRoots([root('S0', 98)], adapter(expansions))
  assert.equal(safe.status, 'verified')
  assert.equal(safe.stats.maximumMatePlies, 121)
})

test('resource limits are incomplete and never verified', () => {
  const graph = adapter({
    A: {
      blackReplies: 1,
      branches: [
        {
          kind: 'continue',
          moves: ['W', 'B'],
          next: 'B',
          resetsHalfmoveClock: [false, false],
          states: ['A-white', 'B'],
        },
      ],
      whiteChoices: 1,
    },
    B: {
      blackReplies: 0,
      branches: [
        {
          kind: 'mate',
          moves: ['mate'],
          resetsHalfmoveClock: [false],
          states: ['mate'],
        },
      ],
      whiteChoices: 1,
    },
  })

  assert.equal(
    verifyMateRoots([root('A')], graph, { maxNodes: 1 }).status,
    'incomplete',
  )
  assert.equal(
    verifyMateRoots([root('A'), root('B')], graph, { maxRoots: 1 }).status,
    'incomplete',
  )
})

test('all pawnless rotations and reflections share one canonical key', () => {
  const fen = '7k/8/8/3K4/8/8/1R6/8 w - - 0 1'
  const keys = SQUARE_TRANSFORMS.map((transform) =>
    canonicalVerifierPositionKey('rook', transformFen(fen, transform)),
  )
  assert.equal(new Set(keys).size, 1)
})

test('identity keys preserve orientation while excluding move counters', () => {
  const fen = '7k/8/8/3K4/8/8/1R6/8 w - - 17 23'
  const rotated = transformFen(fen, getSquareTransform('rotate90'))

  assert.notEqual(
    identityVerifierPositionKey(fen),
    identityVerifierPositionKey(rotated),
  )
  assert.equal(
    identityVerifierPositionKey(fen),
    identityVerifierPositionKey(
      '7k/8/8/3K4/8/8/1R6/8 w - - 99 58',
    ),
  )
})

test('production adapter identity mode does not merge symmetric states', () => {
  const fen = '7k/8/8/3K4/8/8/1R6/8 w - - 0 1'
  const rotated = transformFen(fen, getSquareTransform('rotate90'))
  const symmetryAdapter = createProductionMateAdapter('rook')
  const identityAdapter = createProductionMateAdapter('rook', {
    stateKeyMode: 'identity',
  })

  assert.equal(symmetryAdapter.key(fen), symmetryAdapter.key(rotated))
  assert.notEqual(identityAdapter.key(fen), identityAdapter.key(rotated))
})

test('KNN pawn symmetry preserves files but not pawn direction', () => {
  const fen = '4k3/p7/8/8/8/8/8/1N2K1N1 w - - 0 1'
  const canonical = canonicalVerifierPositionKey('two-knights-pawn', fen)
  assert.equal(
    canonicalVerifierPositionKey(
      'two-knights-pawn',
      transformFen(fen, getSquareTransform('mirrorFile')),
    ),
    canonical,
  )
  assert.notEqual(
    canonicalVerifierPositionKey(
      'two-knights-pawn',
      transformFen(fen, getSquareTransform('mirrorRank')),
    ),
    canonical,
  )
})

test('symmetry cycles keep the encountered witness orientation', () => {
  const start = '7k/8/8/3K4/8/8/1R6/8 w - - 0 1'
  const rotated = transformFen(start, getSquareTransform('rotate90'))
  const result = verifyMateRoots(
    [
      {
        fen: start,
        halfmoveClock: 0,
        source: 'symmetry test',
        state: start,
      },
    ],
    {
      expand: () => ({
        blackReplies: 1,
        branches: [
          {
            kind: 'continue',
            moves: ['Ra2', 'Kh7'],
            next: rotated,
            resetsHalfmoveClock: [false, false],
            states: [start, rotated],
          },
        ],
        whiteChoices: 1,
      }),
      key: (state) => canonicalVerifierPositionKey('rook', state),
      render: (state) => state,
    },
  )

  assert.equal(result.status, 'failed')
  assert.equal(result.failure.kind, 'cycle')
  assert.equal(result.failure.cycleStartPly, 0)
  assert.equal(result.failure.finalFen, rotated)
})

test('manifest-backed KNN enumeration keeps one root per symmetry orbit', () => {
  const roots = [...enumerateProductionMateRoots('two-knights-pawn')]
  assert.equal(roots.length, 2)
  assert.equal(new Set(roots.map(({ fen }) => fen)).size, 2)
  assert.deepEqual(
    roots.map(({ source }) => source),
    [
      'standard source 1 via identity',
      'train source 1 via identity',
    ],
  )
})

test('production expansion counts every legal Black response', () => {
  const fen = '7k/8/8/8/8/8/R7/K7 w - - 0 1'
  const ruleSet = getMateRuleSet('rook')
  let expectedBlackReplies = 0
  for (const san of ruleSet.idealWhiteMoves(fen)) {
    const chess = getChess(fen)
    chess.move(san)
    if (!chess.isGameOver()) expectedBlackReplies += chess.moves().length
  }

  const expansion = createProductionMateAdapter('rook').expand(
    normalizeVerifierState(fen),
  )
  assert.equal(expansion.whiteChoices, ruleSet.idealWhiteMoves(fen).length)
  assert.equal(expansion.blackReplies, expectedBlackReplies)
})
