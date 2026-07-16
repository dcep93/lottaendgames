import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  getSquareTransform,
  transformFen,
  transformSquare,
} from '../chess'
import {
  getIdealKnightAndBishopWhiteMoves,
  getKnightAndBishopOpponentCandidates,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopLookupEntryResultFen,
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopZone5,
  getKnightAndBishopZoneXKnightDriftTarget,
  getKnightAndBishopZoneXSetup,
  getMateRuleSet,
  isKnightAndBishopLookupPhasePosition,
  isKnightAndBishopMatingNetWhiteTurnPosition,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopWhiteMoveForcesZone5,
  knightAndBishopWhiteMoveReachesLookupPath,
  knightAndBishopWhiteRules,
  scoreKnightAndBishopWhiteMove,
  wManeuverSetupDistance,
} from './index'
import {
  BISHOP_KNIGHT_LOOKUP_ENTRIES,
  BISHOP_KNIGHT_PREPARE_STARTS,
} from './bishopKnightData'

test('bishop-and-knight source data is an exact immutable snapshot', () => {
  assert.equal(BISHOP_KNIGHT_LOOKUP_ENTRIES.length, 119)
  assert.equal(
    new Set(BISHOP_KNIGHT_LOOKUP_ENTRIES.map(({ key }) => key)).size,
    119,
  )
  assert.deepEqual(BISHOP_KNIGHT_LOOKUP_ENTRIES[0], {
    key: '8/8/5KNk/5B2/8/8/8/8 w',
    from: 'f5',
    to: 'g4',
  })
  assert.deepEqual(BISHOP_KNIGHT_LOOKUP_ENTRIES.at(-1), {
    key: '6k1/2B5/6K1/5N2/8/8/8/8 w',
    from: 'c7',
    to: 'd6',
  })
  assert.equal(Object.isFrozen(BISHOP_KNIGHT_LOOKUP_ENTRIES), true)
  assert.equal(
    BISHOP_KNIGHT_LOOKUP_ENTRIES.every((entry) => Object.isFrozen(entry)),
    true,
  )
  assert.deepEqual(BISHOP_KNIGHT_PREPARE_STARTS, [
    '8/4k3/4B3/4K3/1N6/8/8/8 w - - 0 1',
    '8/4k3/4B3/4K3/8/2N5/8/8 w - - 0 1',
    '8/4k3/4B3/4K3/8/1N6/8/8 w - - 0 1',
    '8/4k3/4B3/4K3/8/6N1/8/8 w - - 0 1',
    '8/4k3/4B3/4K3/8/7N/8/8 w - - 0 1',
  ])
  assert.equal(Object.isFrozen(BISHOP_KNIGHT_PREPARE_STARTS), true)
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify(BISHOP_KNIGHT_LOOKUP_ENTRIES))
      .digest('hex'),
    '34f1c870084d4da936d45077daa896c9d06e256e4b4493c7ed4f98e72a6a32ad',
  )
})

test('lookup entries are legal and all square transforms round trip', () => {
  for (const entry of BISHOP_KNIGHT_LOOKUP_ENTRIES) {
    const [board, turn] = entry.key.split(' ')
    const chess = getChess(`${board} ${turn} - - 0 1`)
    assert.ok(chess.move({ from: entry.from, to: entry.to }), entry.key)

    for (const transform of SQUARE_TRANSFORMS) {
      const inverse = getSquareTransform(transform.inverseName)
      assert.equal(
        transformSquare(transformSquare(entry.from, transform), inverse),
        entry.from,
      )
      assert.equal(
        transformSquare(transformSquare(entry.to, transform), inverse),
        entry.to,
      )
    }
  }
  for (const fen of BISHOP_KNIGHT_PREPARE_STARTS) {
    assert.doesNotThrow(() => getChess(fen))
    assert.equal(getChess(fen).turn(), 'w')
    assert.ok(getChess(fen).moves().length > 0)
  }
})

test('bishop-and-knight rules are registered', () => {
  const ruleSet = getMateRuleSet('bishop-knight')
  assert.equal(ruleSet.id, 'bishop-knight')
  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    [
      'mate',
      'no stalemate',
      'minors safe',
      'enter mating net',
      'key square pattern',
      'prepare zone x',
      'force zone x',
      'bring king closer',
      'bishop front',
      'knight closer center',
    ],
  )
  assert.deepEqual(
    ruleSet.help.noteBoards.map(({ id }) => id),
    ['zone-x', 'key-square'],
  )
  assert.deepEqual(ruleSet.help.noteBoards[0], {
    id: 'zone-x',
    title: 'Zone X',
    caption: '',
    layout: { files: 14, ranks: 8, fileOffset: 3 },
    pieces: [
      { square: 'f8', piece: 'k' },
      { square: 'e5', piece: 'K' },
      { square: 'e6', piece: 'B' },
      { square: 'c6', piece: 'N' },
    ],
    highlights: [
      { square: 'e8', kind: 'zone' },
      { square: 'f8', kind: 'zone' },
      { square: 'c6', kind: 'key' },
      { square: 'e6', kind: 'key' },
      { square: 'g7', kind: 'escape' },
    ],
    arrows: [{ from: 'e5', to: 'f6' }],
  })
  assert.equal(Object.isFrozen(ruleSet.help.noteBoards[0]?.pieces), true)
  assert.deepEqual(ruleSet.help.blackPriorities, [
    'Return to the previous full position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Move toward unprotected minor pieces.',
    'Run toward the center when possible.',
    'Keep as many legal replies as possible.',
    "Stay away from White's king.",
    "Resist being driven toward the bishop's mating corner.",
  ])
  assert.deepEqual(
    knightAndBishopWhiteRules.map(({ id }) => id),
    [
      'mate',
      'enter mating net',
      'no stalemate',
      'minors safe',
      'enter mating net',
      'key square pattern',
      'prepare zone x',
      'force zone x',
      'prepare zone x',
      'bring king closer',
      'bring king closer',
      'knight closer center',
      'bishop front',
      'knight closer center',
      'knight closer center',
    ],
  )
  const driftGate = knightAndBishopWhiteRules[8]?.stopWhenBest
  const driftScore = scoreKnightAndBishopWhiteMove(
    '8/8/8/3N4/8/1BK5/8/1k6 w - - 6 4',
    'Nb4',
  )
  assert.equal(driftGate?.(driftScore), true)
  assert.equal(driftGate?.({ ...driftScore, zoneXDriftScore: 99 }), false)
})

test('all lookup moves survive every symmetry without transformed collisions', () => {
  const movesByPosition = new Map<string, Set<string>>()
  const resultKeys = new Set<string>()
  let transformedCases = 0

  for (const entry of BISHOP_KNIGHT_LOOKUP_ENTRIES) {
    const [board, turn] = entry.key.split(' ')
    const canonicalFen = `${board} ${turn} - - 0 1`
    const resultFen = getKnightAndBishopLookupEntryResultFen(entry)
    for (const transform of SQUARE_TRANSFORMS) {
      const inverse = getSquareTransform(transform.inverseName)
      const fen = transformFen(canonicalFen, inverse)
      const from = transformSquare(entry.from, inverse)
      const to = transformSquare(entry.to, inverse)
      const chess = getChess(fen)
      const move = chess.move({ from, to })
      assert.ok(move, `${entry.key} via ${transform.name}`)
      assert.ok(
        getKnightAndBishopLookupWhiteMoves(fen).includes(move.san),
        `${entry.key} via ${transform.name}: ${move.san}`,
      )
      assert.equal(getKnightAndBishopPhaseLabel(fen), '2/2')
      const key = fen.split(' ').slice(0, 2).join(' ')
      const moves = movesByPosition.get(key) ?? new Set<string>()
      moves.add(move.san)
      movesByPosition.set(key, moves)
      resultKeys.add(
        transformFen(resultFen, transform).split(' ').slice(0, 2).join(' '),
      )
      transformedCases += 1
    }
  }

  assert.equal(transformedCases, 952)
  assert.equal(movesByPosition.size, 928)
  assert.equal(resultKeys.size, 656)
  assert.deepEqual(
    [...movesByPosition.entries()]
      .filter(([, moves]) => moves.size > 1)
      .map(([fen, moves]) => [fen, [...moves].sort()]),
    [],
  )
})

test('prepare fixtures retain their singular source rules and explanations', () => {
  const fixtures = [
    ['8/4k3/4B3/4K3/1N6/8/8/8 w - - 0 1', 'Nc6+', 'force zone x'],
    ['4k3/8/2N1B3/4K3/8/8/8/8 w - - 0 1', 'Kf6', 'force zone x'],
    ['4k3/8/4B3/4K3/3N4/8/8/8 w - - 0 1', 'Nc6', 'force zone x'],
    ['4k3/8/2N1BK2/8/8/8/8/8 w - - 0 1', 'Kf5', 'force zone x'],
    ['4k3/8/3KB3/8/5N2/8/8/8 w - - 0 1', 'Ng6', 'force zone x'],
    ['4k3/8/4BK2/4N3/8/8/8/8 w - - 0 1', 'Nf7', 'key square pattern'],
    ['8/8/4B2k/5K2/5N2/8/8/8 w - - 0 1', 'Kf6', 'key square pattern'],
    ['3k4/8/3KB1N1/8/8/8/8/8 w - - 0 1', 'Ne5', 'key square pattern'],
    ['8/7k/4BK2/8/5N2/8/8/8 w - - 0 1', 'Ng6', 'key square pattern'],
    ['8/5K2/4B2k/8/5N2/8/8/8 w - - 0 1', 'Kf6', 'key square pattern'],
  ] as const
  const ruleSet = getMateRuleSet('bishop-knight')

  for (const [fen, san, reason] of fixtures) {
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], fen)
    assert.equal(ruleSet.explainWhiteMove(fen, san)?.id, reason, fen)
    assert.equal(ruleSet.currentWhiteHint(fen)?.id, reason, fen)
  }
})

test('phase handoff requires a forced lookup path on the white turn', () => {
  const handoffFen = '6k1/8/5KB1/6N1/8/8/8/8 w - - 0 1'
  assert.equal(getKnightAndBishopPhaseLabel(handoffFen), '2/2')
  assert.equal(isKnightAndBishopMatingNetWhiteTurnPosition(handoffFen), true)
  assert.equal(
    scoreKnightAndBishopWhiteMove(handoffFen, 'Nf7').phaseTwoEntryScore,
    0,
  )
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(handoffFen), ['Nf7'])
  const handedOff = getChess(handoffFen)
  handedOff.move('Nf7')
  assert.equal(isKnightAndBishopLookupPhasePosition(handedOff.fen()), true)
  assert.equal(getKnightAndBishopPhaseLabel(handedOff.fen()), '1/2')

  const falseEntryFen = '8/6k1/3BK3/8/3N4/8/8/8 w - - 118 60'
  const falseEntry = getChess(falseEntryFen)
  falseEntry.move('Nf5+')
  assert.equal(isKnightAndBishopLookupPhasePosition(falseEntry.fen()), false)
  assert.equal(
    knightAndBishopWhiteMoveReachesLookupPath(falseEntryFen, 'Nf5+'),
    false,
  )
  assert.equal(
    scoreKnightAndBishopWhiteMove(falseEntryFen, 'Nf5+').phaseTwoEntryScore,
    1,
  )
  assert.notDeepEqual(getIdealKnightAndBishopWhiteMoves(falseEntryFen), [
    'Nf5+',
  ])
})

test('Zone X geometry, establishment, drift, and forcing match source fixtures', () => {
  assert.deepEqual(
    getKnightAndBishopZone5(
      '4k3/8/2N1B3/4K3/8/8/8/8 w - - 36 19',
    ),
    {
      zoneSquares: ['e8', 'f8'],
      escapeSquare: 'g7',
      targetKingSquare: 'f6',
      stableKnightSquare: 'c6',
    },
  )
  assert.deepEqual(
    getKnightAndBishopZone5(
      '1k6/8/1BKN4/8/8/8/8/8 w - - 16 9',
    ),
    {
      zoneSquares: ['b8', 'c8'],
      escapeSquare: 'd7',
      targetKingSquare: 'c6',
      stableKnightSquare: 'd6',
    },
  )

  const establishFen = '8/8/4B3/7k/4NK2/8/8/8 w - - 22 12'
  const established = getChess(establishFen)
  established.move('Bf5')
  assert.deepEqual(getKnightAndBishopZoneXSetup(established.fen()), {
    bishopSquare: 'f5',
    blackAnchorSquares: ['g5', 'h4', 'h5', 'h6'],
    stableKnightSquares: ['f3', 'f7'],
  })
  assert.equal(
    scoreKnightAndBishopWhiteMove(establishFen, 'Bf5').zoneXPrepareScore,
    0,
  )
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(establishFen), ['Bf5'])

  const driftFen = '8/8/8/3N4/8/1BK5/8/1k6 w - - 6 4'
  assert.equal(getKnightAndBishopZoneXKnightDriftTarget(driftFen), 'd3')
  assert.equal(
    scoreKnightAndBishopWhiteMove(driftFen, 'Nb4').zoneXPrepareScore,
    1,
  )
  assert.equal(
    scoreKnightAndBishopWhiteMove(driftFen, 'Nf4').zoneXPrepareScore,
    1,
  )
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(driftFen), ['Nb4'])

  const forceFen = '3k4/8/3BKN2/8/8/8/8/8 w - - 60 31'
  assert.equal(knightAndBishopWhiteMoveForcesZone5(forceFen, 'Kd5'), true)
  assert.equal(knightAndBishopWhiteMoveForcesZone5(forceFen, 'Ke5'), false)
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(forceFen), ['Kd5'])
})

test('king, bishop-front, and knight priorities retain literal source scores', () => {
  const kingFen = '8/8/8/3NK3/2k5/2B5/8/8 w - - 72 37'
  assert.equal(
    scoreKnightAndBishopWhiteMove(kingFen, 'Ke4')
      .kingCloserOppositeBishopScore,
    4,
  )
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(kingFen), ['Ke4'])

  const bishopFrontFen = '8/8/3K4/8/8/2N3kB/8/8 w - - 8 5'
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopFrontFen, 'Be6').bishopInFrontScore,
    0,
  )
  assert.equal(
    scoreKnightAndBishopWhiteMove(bishopFrontFen, 'Bf5').bishopInFrontScore,
    1,
  )
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(bishopFrontFen), ['Be6'])

  const knightFen = '8/8/4N3/4k3/6KB/8/8/8 w - - 8 5'
  assert.equal(
    scoreKnightAndBishopWhiteMove(knightFen, 'Nf4')
      .knightWhiteKingDistance,
    1,
  )
  assert.equal(
    scoreKnightAndBishopWhiteMove(knightFen, 'Nc5')
      .knightWhiteKingDistance,
    4,
  )
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(knightFen), ['Nf4'])

  const middle16Fen = '8/8/8/8/8/K7/N7/k2B4 w - - 12 7'
  assert.equal(
    scoreKnightAndBishopWhiteMove(middle16Fen, 'Kb3')
      .kingCloserOppositeBishopScore,
    51,
  )
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(middle16Fen), ['Kb3'])
  assert.equal(
    getMateRuleSet('bishop-knight').currentWhiteHint(middle16Fen)?.id,
    'key square pattern',
  )
})

test('wrong moves explain the first rule that prefers a better move', () => {
  const fen = '8/4k3/4B3/4K3/1N6/8/8/8 w - - 0 1'
  const ruleSet = getMateRuleSet('bishop-knight')
  assert.deepEqual(ruleSet.idealWhiteMoves(fen), ['Nc6+'])
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bd7')?.id, 'minors safe')
  assert.equal(ruleSet.currentWhiteHint(fen)?.id, 'force zone x')
})

test('forced lookup re-entry holes remain in the mating net', () => {
  const cases = [
    ['2k5/3N3B/4K3/8/8/8/8/8 w - - 54 28', 'Be4'],
    ['2k5/3N3B/3K4/8/8/8/8/8 w - - 56 29', 'Nc5'],
    ['2k5/3N4/4K3/8/8/3B4/8/8 w - - 56 29', 'Be4'],
    ['2k5/3N4/4K3/8/4B3/8/8/8 w - - 56 29', 'Kd6'],
    ['2k5/3N4/4K3/3B4/8/8/8/8 w - - 58 30', 'Kd6'],
    ['8/k2N4/3K4/8/8/3B4/8/8 w - - 58 30', 'Kc7'],
    ['2k5/3N4/3K4/3B4/8/8/8/8 w - - 60 31', 'Be4'],
    ['2k5/3N4/3K4/8/2B5/8/8/8 w - - 60 31', 'Bd5'],
    ['3k4/8/3K4/2N2B2/8/8/8/8 w - - 64 33', 'Bg6'],
    ['8/k7/2K5/2N5/2B5/8/8/8 w - - 64 33', 'Nd7'],
    ['1k6/8/2K5/2N5/2B5/8/8/8 w - - 64 33', 'Be6'],
    ['1k6/8/2K1B3/2N5/8/8/8/8 w - - 66 34', 'Kb6'],
    ['k7/8/2K5/2N2B2/8/8/8/8 w - - 66 34', 'Be6'],
    ['8/2kN4/4K3/8/2B5/8/8/8 w - - 58 30', 'Bd5'],
    ['k7/3N4/3K4/8/2B5/8/8/8 w - - 60 31', 'Kc7'],
    ['k7/3B4/2K5/2N5/8/8/8/8 w - - 68 35', 'Kb6'],
  ] as const

  for (const [fen, san] of cases) {
    assert.ok(getKnightAndBishopLookupWhiteMoves(fen).includes(san), fen)
    const chess = getChess(fen)
    chess.move(san)
    const candidates = getKnightAndBishopOpponentCandidates(chess.fen())
    assert.deepEqual(candidates.idealMoves, candidates.moves, chess.fen())
  }
})

test('canonical Train lookup line preserves White choices and Black resistance', () => {
  const line = [
    'Nf7+',
    'Kg8',
    'Bg6',
    'Kf8',
    'Bh7',
    'Ke8',
    'Ne5',
    'Kf8',
    'Nd7+',
    'Ke8',
    'Ke6',
    'Kd8',
    'Kd6',
    'Ke8',
    'Bg6+',
    'Kd8',
    'Nc5',
    'Kc8',
    'Bf7',
    'Kd8',
    'Nb7+',
    'Kc8',
    'Kc6',
    'Kb8',
    'Kb6',
    'Kc8',
    'Be6+',
    'Kb8',
    'Nc5',
    'Ka8',
    'Bd7',
    'Kb8',
    'Na6+',
    'Ka8',
    'Bc6#',
  ] as const
  const chess = getChess('7k/8/5K2/6N1/4B3/8/8/8 w - - 42 22')

  for (const san of line) {
    if (chess.turn() === 'w') {
      assert.ok(
        getIdealKnightAndBishopWhiteMoves(chess.fen()).includes(san),
        `${san} from ${chess.fen()}`,
      )
      assert.equal(getKnightAndBishopPhaseLabel(chess.fen()), '2/2')
    } else {
      assert.ok(
        getKnightAndBishopOpponentCandidates(chess.fen()).idealMoves.includes(
          san,
        ),
        `${san} from ${chess.fen()}`,
      )
      assert.equal(getKnightAndBishopPhaseLabel(chess.fen()), '1/2')
    }
    chess.move(san)
  }
  assert.equal(chess.isCheckmate(), true)
})

test('Black preserves return, W-maneuver, lookup, and score priorities', () => {
  const wFen = '7k/8/5K2/4N3/8/5B2/8/8 b - - 0 1'
  assert.equal(wManeuverSetupDistance(wFen), 0)
  assert.equal(isKnightAndBishopWManeuverPosition(wFen), true)
  const wCandidates = getKnightAndBishopOpponentCandidates(wFen)
  assert.deepEqual(wCandidates.moves, ['Kh7', 'Kg8'])
  assert.deepEqual(wCandidates.idealMoves, wCandidates.moves)

  const lookup = getChess('1k6/1N3B2/2K5/8/8/8/8/8 w - - 66 34')
  lookup.move('Kb6')
  const lookupCandidates = getKnightAndBishopOpponentCandidates(lookup.fen())
  assert.deepEqual(lookupCandidates.moves, ['Kc8', 'Ka8'])
  assert.deepEqual(lookupCandidates.idealMoves, lookupCandidates.moves)

  assert.deepEqual(
    getKnightAndBishopOpponentCandidates(
      '4N3/8/3B4/4K3/8/5k2/8/8 b - - 11 6',
    ).idealMoves,
    ['Ke3'],
  )

  const firstWhiteTurnFen = '8/8/8/4k3/7B/3K2N1/8/8 w - - 48 25'
  const cycle = getChess(firstWhiteTurnFen)
  cycle.move('Kc3')
  cycle.move('Kf4')
  cycle.move('Kd3')
  assert.deepEqual(
    getKnightAndBishopOpponentCandidates(cycle.fen(), firstWhiteTurnFen)
      .idealMoves,
    ['Ke5'],
  )
})

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

function playDeterministicSelfPlay(
  startFen: string,
  seed: number,
  maximumPlies = 220,
) {
  const chess = getChess(startFen)
  const random = seededRandom(seed)
  const seenBeforeMatingNet = new Set<string>()
  let phaseTwoReached = false
  let lastWhiteTurnFen: string | undefined
  let blackReturnTargetFen: string | undefined
  const moves: string[] = []

  while (!chess.isGameOver() && moves.length < maximumPlies) {
    if (
      chess.turn() === 'w' &&
      getKnightAndBishopPhaseLabel(chess.fen()) === '2/2'
    ) {
      phaseTwoReached = true
    }
    const key = chess.fen().split(' ').slice(0, 2).join(' ')
    if (!phaseTwoReached) {
      assert.equal(
        seenBeforeMatingNet.has(key),
        false,
        `pre-mating-net loop: ${moves.join(' ')}`,
      )
      seenBeforeMatingNet.add(key)
    }

    let choices: readonly string[]
    if (chess.turn() === 'w') {
      choices = getIdealKnightAndBishopWhiteMoves(chess.fen())
      blackReturnTargetFen = lastWhiteTurnFen
      lastWhiteTurnFen = chess.fen()
    } else {
      choices = getKnightAndBishopOpponentCandidates(
        chess.fen(),
        blackReturnTargetFen,
      ).idealMoves
      blackReturnTargetFen = undefined
    }
    assert.ok(choices.length > 0, chess.fen())
    const san = choices[Math.floor(random() * choices.length)]
    chess.move(san)
    moves.push(san)
  }

  return { chess, moves, phaseTwoReached }
}

test('source-verified Standard samples reach the net without pre-phase loops', () => {
  const starts = [
    '6k1/B7/8/7K/6N1/8/8/8 w - - 0 1',
    'k7/8/5K2/8/1N6/8/8/2B5 w - - 0 1',
    'k7/7K/8/8/2B5/2N5/8/8 w - - 0 1',
    'k6B/8/2N5/K7/8/8/8/8 w - - 0 1',
  ] as const

  starts.forEach((fen, startIndex) => {
    for (let tieSeed = 0; tieSeed < 4; tieSeed += 1) {
      const result = playDeterministicSelfPlay(
        fen,
        99_000 + startIndex * 100 + tieSeed,
      )
      assert.equal(result.phaseTwoReached, true, fen)
      assert.equal(result.chess.isCheckmate(), true, result.moves.join(' '))
      assert.ok(result.moves.length <= 51, result.moves.join(' '))
    }
  })
})

test('all Train symmetries mate across deterministic tied replies', () => {
  const canonical = '7k/8/5K2/6N1/4B3/8/8/8 w - - 42 22'
  SQUARE_TRANSFORMS.forEach((transform, transformIndex) => {
    const fen = transformFen(canonical, transform)
    for (let tieSeed = 0; tieSeed < 16; tieSeed += 1) {
      const result = playDeterministicSelfPlay(
        fen,
        88_000 + transformIndex * 100 + tieSeed,
      )
      assert.equal(result.chess.isCheckmate(), true, result.moves.join(' '))
      assert.ok(result.moves.length <= 39, result.moves.join(' '))
    }
  })
})
