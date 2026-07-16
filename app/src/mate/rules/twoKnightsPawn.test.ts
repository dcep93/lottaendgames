import assert from 'node:assert/strict'
import test from 'node:test'
import {
  TWO_KNIGHTS_PAWN_POSITIONS,
} from '../catalog'
import {
  getChess,
  getSquareTransform,
  positionKey,
  transformFen,
} from '../chess'
import { TWO_KNIGHTS_PAWN_CONSTRUCTION } from '../twoKnightsPawnConstruction'
import {
  getMateRuleSet,
  getTwoKnightsPawnBlackKingRegion,
  getTwoKnightsPawnTerminalOutcome,
  scoreTwoKnightsPawnWhiteCandidates,
  scoreTwoKnightsPawnWhiteMove,
  twoKnightsPawnWhiteRules,
} from './index'

const WHITE_RULE_IDS = [
  'mate',
  'no stalemate',
  'knights safe',
  'stop pawn promotion',
  'blockade pawn',
  'follow verified construction',
  'confine black king',
  'reduce black mobility',
  'bring white king closer',
] as const

test('Two Knights vs Pawn exposes the exact explicit ordered priorities', () => {
  const ruleSet = getMateRuleSet('two-knights-pawn')

  assert.deepEqual(
    twoKnightsPawnWhiteRules.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    WHITE_RULE_IDS,
  )
  assert.deepEqual(
    ruleSet.help.blackPriorities,
    [
      'Promote the pawn immediately when possible.',
      "Take a knight if White leaves one loose.",
      'Move toward an unprotected knight.',
      'Keep the king near the center and preserve actual legal king mobility.',
      'When the earlier resistance priorities tie, advance the pawn as far as legally possible.',
      "Stay away from White's king and coordinated knights.",
    ],
  )
  assert.match(ruleSet.help.notes[0] ?? '', /Syzygy/i)
  assert.match(ruleSet.help.notes[0] ?? '', /offline/i)
})

test('construction routes are immutable, exact, and explained by their first displayed rule', () => {
  const ruleSet = getMateRuleSet('two-knights-pawn')
  assert.equal(Object.isFrozen(TWO_KNIGHTS_PAWN_CONSTRUCTION), true)
  assert.equal(Object.isFrozen(TWO_KNIGHTS_PAWN_CONSTRUCTION.routes), true)
  assert.equal(
    Object.isFrozen(TWO_KNIGHTS_PAWN_CONSTRUCTION.routes[0]?.plies),
    true,
  )
  assert.equal(
    TWO_KNIGHTS_PAWN_CONSTRUCTION.metadata.policySha256,
    'da5f501265694930614958521f693a1d9e683b216f716f937ca2dcb443a6100d',
  )
  assert.deepEqual(
    {
      provider:
        TWO_KNIGHTS_PAWN_CONSTRUCTION.metadata.whiteEdgeAuditProvider,
      requiredWdl:
        TWO_KNIGHTS_PAWN_CONSTRUCTION.metadata.whiteEdgeRequiredWdl,
      verifiedOn:
        TWO_KNIGHTS_PAWN_CONSTRUCTION.metadata.whiteEdgeAuditVerifiedOn,
    },
    {
      provider: 'Lichess tablebase API',
      requiredWdl: 2,
      verifiedOn: '2026-07-16',
    },
  )

  const expectedStandardLines = {
    identity:
      'Nc3 Kd7 Nge2 Kd6 Kd2 Ke5 Ke3 a5 Na4 Kd5 Kd3 Kc6 Kc4 Kd6 Nd4 Kd7 Kd5 Kc7 Ke6 Kb7 Kd5 Ka6 Kc6 Ka7 Nb5+ Ka6 Nc5#',
    mirrorFile:
      'Nf3 Ke7 Nbd2 Ke6 Ke2 Kd5 Kd3 h5 Nh4 Ke5 Ke3 Kf6 Kf4 Ke6 Ne4 Ke7 Ke5 Kf7 Kd6 Kg7 Ke5 Kh6 Kf6 Kh7 Ng5+ Kh6 Nf5#',
  } as const

  for (const route of TWO_KNIGHTS_PAWN_CONSTRUCTION.routes) {
    const source = TWO_KNIGHTS_PAWN_POSITIONS[route.mode][route.sourceIndex]!
    const chess = getChess(
      transformFen(source.fen, getSquareTransform(route.transformName)),
    )
    const seen = new Set([positionKey(chess.fen())])
    if (route.mode === 'standard') {
      assert.equal(
        route.plies.map(({ san }) => san).join(' '),
        expectedStandardLines[route.transformName],
      )
    }
    for (const ply of route.plies) {
      if (chess.turn() === 'w') {
        assert.deepEqual(ruleSet.idealWhiteMoves(chess.fen()), [ply.san])
        assert.ok(ruleSet.currentWhiteHint(chess.fen())?.id)
        const incorrect = chess.moves().find((san) => san !== ply.san)
        if (incorrect) {
          const reason = ruleSet.explainWhiteMove(chess.fen(), incorrect)?.id
          assert.ok(reason)
          assert.ok(
            WHITE_RULE_IDS.indexOf(reason as (typeof WHITE_RULE_IDS)[number]) <=
              WHITE_RULE_IDS.indexOf(
                'follow verified construction',
              ),
            `${route.mode} ${route.transformName}: ${incorrect} was explained by late rule ${reason}`,
          )
        }
      } else {
        assert.deepEqual(ruleSet.blackCandidates(chess.fen()).idealMoves, [ply.san])
      }
      assert.ok(chess.move(ply.san))
      const key = positionKey(chess.fen())
      assert.equal(seen.has(key), false)
      seen.add(key)
    }
    assert.equal(chess.turn(), 'b')
    assert.equal(chess.isCheckmate(), true)
  }

  const standard = TWO_KNIGHTS_PAWN_POSITIONS.standard[0]!.fen
  assert.deepEqual(ruleSet.idealWhiteMoves(standard), ['Nc3'])
  assert.equal(
    ruleSet.currentWhiteHint(standard)?.id,
    'follow verified construction',
  )
  assert.equal(
    ruleSet.explainWhiteMove(standard, 'Nd2')?.id,
    'follow verified construction',
  )
  const mirror = transformFen(standard, getSquareTransform('mirrorFile'))
  assert.deepEqual(ruleSet.idealWhiteMoves(mirror), ['Nf3'])

  const earlyKingMove = getChess(standard)
  for (const san of ['Nc3', 'Kd7', 'Nge2', 'Kd6']) earlyKingMove.move(san)
  assert.deepEqual(ruleSet.idealWhiteMoves(earlyKingMove.fen()), ['Kd2'])
  assert.equal(
    ruleSet.explainWhiteMove(earlyKingMove.fen(), 'Nd5')?.id,
    'knights safe',
  )
  assert.equal(
    ruleSet.currentWhiteHint(earlyKingMove.fen())?.id,
    'follow verified construction',
  )

  const midRoute = getChess(standard)
  for (const san of [
    'Nc3',
    'Kd7',
    'Nge2',
    'Kd6',
    'Kd2',
    'Ke5',
    'Ke3',
    'a5',
    'Na4',
    'Kd5',
  ]) {
    midRoute.move(san)
  }
  assert.deepEqual(ruleSet.idealWhiteMoves(midRoute.fen()), ['Kd3'])
  assert.equal(
    ruleSet.currentWhiteHint(midRoute.fen())?.id,
    'follow verified construction',
  )

  const train = TWO_KNIGHTS_PAWN_POSITIONS.train[0]!.fen
  assert.deepEqual(ruleSet.idealWhiteMoves(train), ['Nf7#'])
  assert.equal(ruleSet.currentWhiteHint(train)?.id, 'mate')

  const constructionRule = ruleSet.whiteRuleDescriptions.find(
    ({ id }) => id === 'follow verified construction',
  )
  assert.match(constructionRule?.helpText ?? '', /27-ply Standard/i)
  assert.match(constructionRule?.helpText ?? '', /unconditional win/i)
  assert.match(constructionRule?.helpText ?? '', /inactive off/i)

  const offRoute = getChess(standard)
  offRoute.move('Nd2')
  offRoute.move(ruleSet.blackCandidates(offRoute.fen()).idealMoves[0]!)
  assert.notEqual(
    ruleSet.currentWhiteHint(offRoute.fen())?.id,
    'follow verified construction',
  )
})

test('candidate batch caching is complete, immutable, and keeps requested order', () => {
  const fen = '4k3/p7/8/8/8/8/8/1N2K1N1 w - - 17 9'
  const legalMoves = getChess(fen).moves()
  const subset = scoreTwoKnightsPawnWhiteCandidates(fen, [legalMoves[0]!])
  assert.equal(Object.isFrozen(subset), true)
  assert.equal(Object.isFrozen(subset[0]), true)
  assert.equal(Object.isFrozen(subset[0]?.score), true)
  assert.deepEqual(subset.map(({ san }) => san), [legalMoves[0]])
  assert.deepEqual(getMateRuleSet('two-knights-pawn').idealWhiteMoves(fen), [
    'Nc3',
  ])

  const reversed = scoreTwoKnightsPawnWhiteCandidates(
    fen,
    [...legalMoves].reverse(),
  )
  assert.deepEqual(
    reversed.map(({ san }) => san),
    [...legalMoves].reverse(),
  )
})

test('every audited source and transform has legal rule choices, explanations, and resistance', () => {
  const ruleSet = getMateRuleSet('two-knights-pawn')

  for (const [mode, sources] of [
    ['standard', TWO_KNIGHTS_PAWN_POSITIONS.standard],
    ['train', TWO_KNIGHTS_PAWN_POSITIONS.train],
  ] as const) {
    for (const source of sources) {
      for (const transformName of source.transformNames) {
        const fen = transformFen(
          source.fen,
          getSquareTransform(transformName),
        )
        const chess = getChess(fen)
        const legalMoves = chess.moves()
        const idealMoves = ruleSet.idealWhiteMoves(fen)
        const context = `${mode} ${transformName}`

        assert.ok(idealMoves.length > 0, context)
        assert.equal(
          idealMoves.every((san) => legalMoves.includes(san)),
          true,
          context,
        )
        const sampledIncorrect = legalMoves.find(
          (san) => !idealMoves.includes(san),
        )
        assert.ok(sampledIncorrect, context)
        assert.ok(
          ruleSet.explainWhiteMove(fen, sampledIncorrect)?.id,
          context,
        )
        assert.ok(ruleSet.currentWhiteHint(fen)?.id, context)

        assert.ok(chess.move(idealMoves[0]!), context)
        const black = ruleSet.blackCandidates(chess.fen())
        assert.equal(
          black.idealMoves.every((san) => black.moves.includes(san)),
          true,
          context,
        )
        if (!chess.isCheckmate()) assert.ok(black.idealMoves.length > 0, context)
      }
    }
  }
})

test('Two Knights vs Pawn recognizes all material-specific terminal outcomes', () => {
  const train = getChess(TWO_KNIGHTS_PAWN_POSITIONS.train[0]!.fen)
  assert.ok(train.move('Nf7#'))
  assert.equal(getTwoKnightsPawnTerminalOutcome(train.fen()), 'checkmate')
  assert.equal(
    getTwoKnightsPawnTerminalOutcome(
      '5N1k/5K2/8/8/8/8/p7/N7 b - - 0 1',
    ),
    'stalemate',
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome(
      '4k3/p7/8/8/8/8/8/4K1N1 w - - 0 1',
    ),
    'lost-knight',
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome(
      '4k3/8/8/8/8/8/8/qN2K1N1 w - - 0 2',
    ),
    'pawn-promoted',
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome(
      '4k3/8/8/8/8/8/8/1N2K1N1 w - - 0 2',
    ),
    'unsupported',
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome(
      '4k3/p7/8/8/8/8/8/1N2K1N1 w - - 100 51',
    ),
    'fifty-move',
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome(
      '8/8/8/8/8/7N/1qk5/K5N1 w - - 0 1',
    ),
    'pawn-promoted',
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome(
      TWO_KNIGHTS_PAWN_POSITIONS.standard[0]!.fen,
    ),
    null,
  )
  const offRoute = getChess(TWO_KNIGHTS_PAWN_POSITIONS.standard[0]!.fen)
  assert.ok(offRoute.move('Nd2'))
  assert.equal(getTwoKnightsPawnTerminalOutcome(offRoute.fen()), 'unsupported')
})

test('KNN cage regions block the White king square and confinement requires a live blockade', () => {
  const regionFen = '8/8/8/p7/N2k4/2N3K1/8/8 b - - 0 1'
  const region = getTwoKnightsPawnBlackKingRegion(regionFen)
  assert.equal(region.has('g3'), false)

  const confine = twoKnightsPawnWhiteRules.find(
    ({ id }) => id === 'confine black king',
  )
  assert.ok(confine?.applies)
  const farPawnScore = scoreTwoKnightsPawnWhiteMove(
    TWO_KNIGHTS_PAWN_POSITIONS.standard[0]!.fen,
    'Nc3',
  )
  assert.equal(farPawnScore.liveBlockadePenalty, 1)
  assert.equal(confine.applies(farPawnScore), false)

  const blockadedScore = scoreTwoKnightsPawnWhiteMove(
    '8/8/8/p7/N2k4/2N3K1/8/8 w - - 0 1',
    'Kg4',
  )
  assert.equal(blockadedScore.liveBlockadePenalty, 0)
  assert.equal(confine.applies(blockadedScore), true)

  const blockade = twoKnightsPawnWhiteRules.find(
    ({ id }) => id === 'blockade pawn',
  )
  assert.ok(blockade?.applies)
  const beforeBoundary = scoreTwoKnightsPawnWhiteMove(
    '8/8/p7/N7/3k4/2N3K1/8/8 w - - 0 1',
    'Kg4',
  )
  assert.equal(beforeBoundary.blockadeUrgent, false)
  assert.equal(blockade.applies(beforeBoundary), false)
  assert.equal(blockadedScore.blockadeUrgent, true)
  assert.equal(blockade.applies(blockadedScore), true)
  assert.match(blockade.helpText, /a4, b6, c5, d4, e4, f5, g6, h4/)
})

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

test('every audited KNN construction mates across 64 bounded deterministic resistance paths', () => {
  const ruleSet = getMateRuleSet('two-knights-pawn')
  const maximumPlies = 200
  const pathCount = 64
  const pathLengths: number[] = []

  for (const [modeIndex, [mode, sources]] of ([
    ['standard', TWO_KNIGHTS_PAWN_POSITIONS.standard],
    ['train', TWO_KNIGHTS_PAWN_POSITIONS.train],
  ] as const).entries()) {
    for (const [sourceIndex, source] of sources.entries()) {
      for (const [transformIndex, transformName] of source.transformNames.entries()) {
        const startingFen = transformFen(
          source.fen,
          getSquareTransform(transformName),
        )
        let expectedFirstBlackReplies: readonly string[] | undefined
        const coveredFirstBlackReplies = new Set<string>()

        for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
          const random = seededRandom(
            72_000 +
              modeIndex * 10_000 +
              sourceIndex * 1_000 +
              transformIndex * 100 +
              pathIndex,
          )
          const chess = getChess(startingFen)
          const seen = new Set([positionKey(chess.fen())])
          const line: string[] = []
          let firstWhiteTurn = true
          let firstBlackTurn = true

          while (line.length < maximumPlies) {
            const terminal = getTwoKnightsPawnTerminalOutcome(chess.fen())
            if (terminal !== null) {
              assert.equal(
                terminal,
                'checkmate',
                `${mode} ${transformName} path ${pathIndex}: ${terminal}; ${line.join(' ')}`,
              )
              break
            }

            const candidates =
              chess.turn() === 'w'
                ? ruleSet.idealWhiteMoves(chess.fen())
                : ruleSet.blackCandidates(chess.fen()).idealMoves
            assert.ok(
              candidates.length > 0,
              `${mode} ${transformName} path ${pathIndex}: no candidate; ${line.join(' ')}`,
            )

            let candidateIndex: number
            if (chess.turn() === 'w' && firstWhiteTurn) {
              candidateIndex = 0
              firstWhiteTurn = false
            } else if (chess.turn() === 'b' && firstBlackTurn) {
              expectedFirstBlackReplies ??= [...candidates]
              assert.deepEqual(candidates, expectedFirstBlackReplies)
              candidateIndex = pathIndex % candidates.length
              coveredFirstBlackReplies.add(candidates[candidateIndex]!)
              firstBlackTurn = false
            } else {
              candidateIndex = Math.floor(random() * candidates.length)
            }
            const san = candidates[candidateIndex]!
            assert.ok(chess.move(san))
            line.push(san)

            const key = positionKey(chess.fen())
            assert.equal(
              seen.has(key),
              false,
              `${mode} ${transformName} path ${pathIndex}: repeated ${key}; ${line.join(' ')}`,
            )
            seen.add(key)
          }

          assert.equal(
            chess.isCheckmate(),
            true,
            `${mode} ${transformName} path ${pathIndex}: 200-ply limit; ${line.join(' ')}`,
          )
          pathLengths.push(line.length)
        }

        assert.deepEqual(
          [...coveredFirstBlackReplies].sort(),
          [...(expectedFirstBlackReplies ?? [])].sort(),
          `${mode} ${transformName}: first Black reply coverage`,
        )
      }
    }
  }

  assert.equal(pathLengths.length, 256)
  console.log(
    `KNN self-play: ${pathLengths.length} paths, max ${Math.max(...pathLengths)} plies`,
  )
})
