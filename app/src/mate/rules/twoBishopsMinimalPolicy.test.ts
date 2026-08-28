import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess } from '../chess'
import { MATE_CATALOG } from '../catalog'
import {
  analyzeTwoBishopsWhiteSelection,
  getIdealTwoBishopsWhiteMoves,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsWhiteMove,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './twoBishops'

const ACTIVE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'rule a',
  'rule b',
  'rule c',
  'rule d',
  'rule e',
  'rule f',
  'rule g',
  'rule h',
  'rule i',
  'rule j',
  'rule k',
  'rule l',
  'rule m',
  'rule n',
  'rule o',
  'rule p',
  'rule q',
  'rule r',
  'rule s',
  'rule t',
  'rule u',
  'rule v',
  'rule w',
  'rule x',
  'rule y',
]

test('Two Bishops uses only the active two-phase policy', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.equal(twoBishopsRuleSet.phase('8/8/8/8/8/8/8/K6k w - - 0 1'), '1/2')
  assert.deepEqual(twoBishopsRuleSet.help.notes, [
      "Phase 2: Place one bishop on a long diagonal and the other on an adjacent diagonal. Both kings must be on the long diagonal's wider side. White's king must be no further by Euclidean distance to the middle square nearest the target corner: d4 for a1, d5 for a8, e4 for h1, or e5 for h8.",
    'Retreat square: the square adjacent to Black in the direction opposite its caged corner.',
  ])
  assert.deepEqual(twoBishopsRuleSet.help.noteBoards, [
    {
      id: 'bishop-rule-c',
      title: 'rule c',
      caption:
        'With the Phase 2 cage aimed at h1, White Kf5, Black Kh4, one bishop on e5, and the other anywhere from a2 through g8, play Kf4.',
      pieces: [
        { square: 'f5', piece: 'K' },
        { square: 'h4', piece: 'k' },
        { square: 'd5', piece: 'B' },
        { square: 'e5', piece: 'B' },
      ],
      highlights: [
        { square: 'h1', kind: 'pink' },
        { square: 'f4', kind: 'key' },
      ],
      arrows: [{ from: 'f5', to: 'f4' }],
    },
    {
      id: 'bishop-rule-d',
      title: 'rule d',
      caption:
        'With White Kf4, Black Kd7, and bishops on e4 and e5, play Bd5.',
      pieces: [
        { square: 'f4', piece: 'K' },
        { square: 'd7', piece: 'k' },
        { square: 'e4', piece: 'B' },
        { square: 'e5', piece: 'B' },
      ],
      highlights: [{ square: 'd5', kind: 'key' }],
      arrows: [{ from: 'e4', to: 'd5' }],
    },
    {
      id: 'bishop-rule-e',
      title: 'rule e',
      caption:
        'With White Kd4, Black Kc2, and bishops on c3 and d5, play Ba2.',
      pieces: [
        { square: 'd4', piece: 'K' },
        { square: 'c2', piece: 'k' },
        { square: 'c3', piece: 'B' },
        { square: 'd5', piece: 'B' },
      ],
      highlights: [{ square: 'a2', kind: 'key' }],
      arrows: [{ from: 'd5', to: 'a2' }],
    },
    {
      id: 'bishop-rule-f',
      title: 'rule f',
      caption:
        'With White Kd5, Black Kf4, and bishops on d4 and e4, play Bc5.',
      pieces: [
        { square: 'd5', piece: 'K' },
        { square: 'f4', piece: 'k' },
        { square: 'd4', piece: 'B' },
        { square: 'e4', piece: 'B' },
      ],
      highlights: [{ square: 'c5', kind: 'key' }],
      arrows: [{ from: 'd4', to: 'c5' }],
    },
    {
      id: 'bishop-rule-g',
      title: 'rule g',
      caption:
        'With White Kh5, Black Kf5, and bishops on d4 and d5, play Bc3.',
      pieces: [
        { square: 'h5', piece: 'K' },
        { square: 'f5', piece: 'k' },
        { square: 'd4', piece: 'B' },
        { square: 'd5', piece: 'B' },
      ],
      highlights: [{ square: 'c3', kind: 'key' }],
      arrows: [{ from: 'd4', to: 'c3' }],
    },
    {
      id: 'bishop-rule-i',
      title: 'rule i',
      caption:
        'The retreat square is adjacent to Black in the direction away from its caged corner. Here h3 is the retreat square; White controls it and the kings are in opposition, so White checks.',
      pieces: [
        { square: 'f2', piece: 'K' },
        { square: 'h2', piece: 'k' },
        { square: 'e6', piece: 'B' },
        { square: 'h8', piece: 'B' },
      ],
      highlights: [
        { square: 'h1', kind: 'pink' },
        { square: 'h3', kind: 'key' },
      ],
      arrows: [{ from: 'e6', to: 'h3' }],
    },
  ])
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule b')?.helpText,
    'Prefer moves after which every Black reply is Phase 2 with a consistent target corner.',
  )
})

test('Two Bishops selection reports the rule that filters every rejected move', () => {
  const fen = '8/7B/4k3/8/8/8/5B2/1K6 w - - 0 1'
  const analysis = analyzeTwoBishopsWhiteSelection(fen)
  const legalMoves = getChess(fen).moves()

  assert.deepEqual(
    analysis.idealWhiteMoves,
    getIdealTwoBishopsWhiteMoves(fen),
  )
  assert.deepEqual(Object.keys(analysis.ruleFilterCounts), ACTIVE_RULE_IDS)
  assert.equal(
    Object.values(analysis.ruleFilterCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    legalMoves.length - analysis.idealWhiteMoves.length,
  )
})

test('mate, bishop safety, and stalemate remain mandatory', () => {
  const mateFen = '8/3B4/8/8/5B2/8/5K2/7k w - - 4 3'
  for (const san of getIdealTwoBishopsWhiteMoves(mateFen)) {
    const chess = getChess(mateFen)
    chess.move(san)
    assert.equal(chess.isCheckmate(), true, san)
  }

  const safetyFen = '5Bk1/3B4/5K2/8/8/8/8/8 w - - 0 1'
  assert.equal(getIdealTwoBishopsWhiteMoves(safetyFen).includes('Be6+'), false)
  assert.equal(
    scoreTwoBishopsWhiteMove(safetyFen, 'Be6+').bishopSafetyPenalty,
    1,
  )

  const stalemateFen = '8/8/8/1B6/8/8/2K5/k1B5 w - - 0 1'
  assert.equal(getIdealTwoBishopsWhiteMoves(stalemateFen).includes('Bc4'), false)
  assert.equal(
    scoreTwoBishopsWhiteMove(stalemateFen, 'Bc4').stalematePenalty,
    1,
  )
})

test("rule a prefers White's king not on the edge", () => {
  const fen = '1k6/3K4/8/8/3B4/3B4/8/8 w - - 0 1'
  const staysOnEdge = scoreTwoBishopsWhiteMove(fen, 'Kd8')
  const leavesEdge = scoreTwoBishopsWhiteMove(fen, 'Kc6')

  assert.equal(staysOnEdge.ruleAPenalty, 1)
  assert.equal(leavesEdge.ruleAPenalty, 0)
  assert.equal(
    twoBishopsWhiteRules.find(({ id }) => id === 'rule a')?.helpText,
    "Prefer White's king not on the edge.",
  )
})

test('rule h keeps the king off the long diagonal wall in Phase 2', () => {
  const fen = '8/8/8/8/2KB4/8/k1B5/8 w - - 0 1'
  const occupiesWall = scoreTwoBishopsWhiteMove(fen, 'Kc3')
  const staysClear = scoreTwoBishopsWhiteMove(fen, 'Kc5')

  assert.equal(occupiesWall.ruleHApplies, true)
  assert.equal(occupiesWall.ruleHPenalty, 1)
  assert.equal(staysClear.ruleHPenalty, 0)
})

test("rule h allows the king on the target square's long diagonal", () => {
  const fen = '8/8/8/8/2KB4/8/k1B5/8 w - - 0 1'
  const walksOnTargetDiagonal = scoreTwoBishopsWhiteMove(fen, 'Kd5')

  assert.equal(walksOnTargetDiagonal.ruleHApplies, true)
  assert.equal(walksOnTargetDiagonal.ruleHPenalty, 0)
})

test('technique rules are lettered a through y in priority order', () => {
  const expected = Array.from(
    { length: 25 },
    (_, index) => `rule ${String.fromCharCode('a'.charCodeAt(0) + index)}`,
  )

  assert.deepEqual(
    twoBishopsWhiteRules.slice(3).map(({ id }) => id),
    expected,
  )
  assert.equal(twoBishopsRuleSet.whiteMoveOverride, undefined)
})

test('rule w prefers White king proximity to an unoccupied center square', () => {
  const fen = '8/8/8/2k1B3/4BK2/8/8/8 w - - 0 1'
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Ke3')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kf5')

  assert.equal(nearer.ruleWCenterDistance, 2)
  assert.equal(farther.ruleWCenterDistance, 4)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ke3'])
})

test('rule v aligns the king with two central bishops', () => {
  const fen = '8/8/8/3BK3/1k1B4/8/8/8 w - - 0 1'

  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kd6'])
})

test("rule w uses proximity to Black's king after center proximity", () => {
  const fen = 'k7/4K3/8/8/8/8/8/B6B w - - 0 1'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Kd6')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Ke6')

  assert.equal(closer.ruleWCenterDistance, 1)
  assert.equal(farther.ruleWCenterDistance, 1)
  assert.ok(
    closer.ruleWBlackKingDistance < farther.ruleWBlackKingDistance,
  )
})

test('rule u is inactive in Phase 2 while rule y remains active', () => {
  const score = scoreTwoBishopsWhiteMove(
    '8/2k4B/4K3/8/3B4/8/8/8 w - - 2 2',
    'Ke7',
  )

  assert.equal(score.ruleUApplies, false)
  assert.equal(score.ruleYApplies, true)
})

test('rule m applies when Black is on the target side of the a8 king moat', () => {
  const fen = '8/2k4B/4K3/8/3B4/8/8/8 w - - 2 2'
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke7')

  assert.equal(takesOpposition.ruleMApplies, true)
  assert.equal(takesOpposition.ruleMPenalty, 0)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kd5'])
})

test('Phase 2 uses the wider side of the long diagonal and center tests', () => {
  assert.equal(
    twoBishopsRuleSet.phase('8/8/8/8/4K3/8/B3k3/B7 w - - 10 6'),
    '2/2',
  )
  assert.equal(
    twoBishopsRuleSet.phase('8/8/5B1K/8/6k1/8/8/1B6 w - - 0 1'),
    '1/2',
  )
  assert.equal(
    twoBishopsRuleSet.phase('8/8/8/8/3B1K1k/8/8/1B6 w - - 2 2'),
    '1/2',
  )
  assert.equal(
    twoBishopsRuleSet.phase('8/8/8/8/2K5/8/B3k3/B7 w - - 2 2'),
    '1/2',
  )
})

test('Training Wheels starts from the canonical Phase 2 position', () => {
  const entry = MATE_CATALOG.find(({ id }) => id === 'two-bishops')
  assert.deepEqual(entry?.trainSeeds, [
    '8/8/8/8/4K3/8/B3k3/B7 w - - 10 6',
  ])
})

test('rule b does not reward entering Phase 2 when Black can leave it', () => {
  const fen = '8/8/8/6K1/8/8/B3k3/B7 w - - 0 1'
  const enters = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  const remains = scoreTwoBishopsWhiteMove(fen, 'Kh5')
  assert.equal(enters.isPhaseTwoPosition, true)
  assert.equal(enters.ruleBPenalty, 1)
  assert.equal(remains.ruleBPenalty, 1)
  assert.equal(
    twoBishopsRuleSet.phase('8/8/8/5K2/8/8/B3k3/B7 b - - 11 6'),
    '2/2',
  )
})

test('rule b rejects switching the target corner but accepts a preserved cage', () => {
  const fen = '8/8/8/3BB3/4K3/8/3k4/8 w - - 6 4'
  const switchesCorner = scoreTwoBishopsWhiteMove(fen, 'Kd4')
  const keepsCorner = scoreTwoBishopsWhiteMove(fen, 'Kf4')

  assert.equal(switchesCorner.isPhaseTwoPosition, true)
  assert.equal(keepsCorner.isPhaseTwoPosition, true)
  assert.equal(switchesCorner.ruleBPenalty, 1)
  assert.equal(keepsCorner.ruleBPenalty, 0)
})

test('rule b rejects a move when any Black reply exits Phase 2', () => {
  const fen = '8/3k4/8/8/5K2/8/7B/7B w - - 2 2'
  const bg1 = scoreTwoBishopsWhiteMove(fen, 'Bg1')

  assert.equal(bg1.isPhaseTwoPosition, true)
  assert.equal(bg1.ruleBPenalty, 1)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Bg1'))
})

test('rule b accepts Kf3 when it and every Black reply enter Phase 2', () => {
  const fen = '8/8/8/3B1k2/3B4/4K3/8/8 w - - 0 1'
  const kf3 = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(kf3.isPhaseTwoPosition, true)
  assert.equal(kf3.ruleBPenalty, 0)
})

test('Phase 2 measures center proximity by Euclidean distance', () => {
  const beforeKf3 = '8/8/4B3/4B1k1/4K3/8/8/8 w - - 16 9'
  const afterKf3 = '8/8/4B3/4B1k1/8/5K2/8/8 b - - 17 9'

  assert.equal(twoBishopsRuleSet.phase(afterKf3), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(beforeKf3, 'Kf3').ruleBPenalty, 0)
})

test('Phase 2 allows White to be equally close to the target middle square', () => {
  const fen = '8/3K4/8/1k6/3BB3/8/8/8 w - - 2 2'

  assert.equal(twoBishopsRuleSet.phase(fen), '2/2')
})

test('Bd5 enters Phase 2 using e4 for the h1 target corner', () => {
  const fen = '8/8/8/5k2/3BB3/4K3/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd5').isPhaseTwoPosition, true)
})

test('rule c prefers Kf4 with White Kf5 and Black Kh4 in the h1 cage', () => {
  const fen = '8/8/8/3BBK2/7k/8/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const waiting = scoreTwoBishopsWhiteMove(fen, 'Bf7')

  assert.equal(preferred.ruleCApplies, true)
  assert.equal(preferred.ruleCPenalty, 0)
  assert.equal(waiting.ruleCApplies, true)
  assert.equal(waiting.ruleCPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('rule c requires the complete diagram position', () => {
  const fen = '8/8/8/3B1K2/3B3k/8/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf4').ruleCApplies, false)
})

test('rule d prefers Bd5 in the complete diagram position', () => {
  const fen = '8/3k4/8/4B3/4BK2/8/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Bd5')
  const temporaryPhaseTwo = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(preferred.ruleDApplies, true)
  assert.equal(preferred.ruleDPenalty, 0)
  assert.equal(temporaryPhaseTwo.ruleDApplies, true)
  assert.equal(temporaryPhaseTwo.ruleDPenalty, 1)
})

test('rule c accepts every partner-bishop square from a2 through g8', () => {
  const partnerSquares = ['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const

  for (const square of partnerSquares) {
    const chess = getChess('8/8/8/4BK2/7k/8/8/8 w - - 0 1')
    chess.put({ color: 'w', type: 'b' }, square)
    const fen = chess.fen()
    const preferred = scoreTwoBishopsWhiteMove(fen, 'Kf4')

    assert.equal(preferred.ruleCApplies, true, square)
    assert.equal(preferred.ruleCPenalty, 0, square)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'], square)
  }
})

test('rule e prefers Ba2 in the complete diagram position', () => {
  const fen = '8/8/8/3B4/3K4/2B5/2k5/8 w - - 2 2'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Ba2')
  const loopMove = scoreTwoBishopsWhiteMove(fen, 'Ba1')

  assert.equal(preferred.ruleEApplies, true)
  assert.equal(preferred.ruleEPenalty, 0)
  assert.equal(loopMove.ruleEApplies, true)
  assert.equal(loopMove.ruleEPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ba2'])
})

test('rule f prefers Bc5 in the complete diagram position', () => {
  const fen = '8/8/8/3K4/3BBk2/8/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const loopMove = scoreTwoBishopsWhiteMove(fen, 'Be5+')

  assert.equal(preferred.ruleFApplies, true)
  assert.equal(preferred.ruleFPenalty, 0)
  assert.equal(loopMove.ruleFApplies, true)
  assert.equal(loopMove.ruleFPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bc5'])
})

test('rule g prefers Bc3 in the complete diagram position', () => {
  const fen = '8/8/8/3B1k1K/3B4/8/8/8 w - - 6 4'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Bc3')
  const loopMove = scoreTwoBishopsWhiteMove(fen, 'Kh4')

  assert.equal(preferred.ruleGApplies, true)
  assert.equal(preferred.ruleGPenalty, 0)
  assert.equal(loopMove.ruleGApplies, true)
  assert.equal(loopMove.ruleGPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bc3'])
})

test('rule o takes opposition when the edge square away from the caged corner is uncontrolled', () => {
  const fen = '6B1/6B1/8/8/7k/5K2/8/8 w - - 4 3'
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const staysOutOfOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf2')

  assert.equal(takesOpposition.ruleOApplies, true)
  assert.equal(takesOpposition.ruleOPenalty, 0)
  assert.equal(staysOutOfOpposition.ruleOApplies, true)
  assert.equal(staysOutOfOpposition.ruleOPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('retreat rules are inactive when the Phase 2 kings are not tracked', () => {
  const fen = '8/8/4B3/4B3/8/4K3/8/7k w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bc4')

  assert.equal(score.ruleIApplies, false)
  assert.equal(score.ruleJApplies, false)
  assert.equal(score.ruleKDoubleRetreatPenalty, 1)
  assert.equal(score.ruleOApplies, false)
  assert.equal(score.rulePApplies, false)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf3'])
})

test('retreat rules reject Black on the wrong side of the king moat', () => {
  const fen = '8/7B/2K5/4B3/1k6/8/8/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Kb6')

  assert.equal(score.ruleIApplies, false)
  assert.equal(score.ruleMApplies, false)
  assert.equal(score.rulePApplies, false)
})

test("rule r prefers the middle 16, then proximity to Black's king", () => {
  const fen = '8/5B2/8/4BK2/8/7k/8/8 w - - 22 12'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Ke4')
  const outside = scoreTwoBishopsWhiteMove(fen, 'Kg5')

  assert.equal(closer.ruleRApplies, true)
  assert.equal(closer.ruleRMiddle16Distance, 0)
  assert.equal(farther.ruleRMiddle16Distance, 0)
  assert.ok(
    closer.ruleRBlackKingDistance < farther.ruleRBlackKingDistance,
  )
  assert.equal(outside.ruleRMiddle16Distance, 1)
})

test('rule r uniquely selects the closer central king move', () => {
  const fen = '8/8/3K4/8/8/5B2/5B1k/8 w - - 12 7'
  const ke5 = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  const ke6 = scoreTwoBishopsWhiteMove(fen, 'Ke6')

  assert.equal(ke5.ruleRMiddle16Distance, 0)
  assert.equal(ke6.ruleRMiddle16Distance, 0)
  assert.ok(ke5.ruleRBlackKingDistance < ke6.ruleRBlackKingDistance)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ke5'])
})

test('rule s measures track along the target corner edges', () => {
  const fen = '8/8/8/4B3/8/1B3K2/3k4/8 w - - 0 1'
  const falsePerpendicularTrack = scoreTwoBishopsWhiteMove(fen, 'Bb2')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(falsePerpendicularTrack.ruleSApplies, true)
  assert.equal(falsePerpendicularTrack.ruleSPenalty, 1)
  assert.equal(kingMove.ruleSApplies, true)
  assert.equal(kingMove.ruleSPenalty, 1)
})

test('rule s rejects replies that move too far off track after rule p', () => {
  const fen = '8/8/8/4B3/8/3K4/B7/2k5 w - - 2 2'
  const leavesTrack = scoreTwoBishopsWhiteMove(fen, 'Ke4')
  const keepsTrack = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(leavesTrack.rulePPenalty, 0)
  assert.equal(leavesTrack.ruleSPenalty, 1)
  assert.equal(keepsTrack.rulePPenalty, 0)
  assert.equal(keepsTrack.ruleSPenalty, 0)
})

test('rule u prefers more bishops on longer diagonals, then in the center', () => {
  const longDiagonalFen = '8/8/8/8/1B3K2/8/2B5/7k w - - 0 1'
  const keepsLongDiagonal = scoreTwoBishopsWhiteMove(longDiagonalFen, 'Be4')
  const leavesLongDiagonals = scoreTwoBishopsWhiteMove(longDiagonalFen, 'Bd3')

  assert.equal(keepsLongDiagonal.ruleUApplies, true)
  assert.ok(
    keepsLongDiagonal.ruleUDiagonalLengthPenalty <
      leavesLongDiagonals.ruleUDiagonalLengthPenalty,
  )

  const centerFen = '7k/8/8/8/2B1B3/5K2/8/8 w - - 0 1'
  const central = scoreTwoBishopsWhiteMove(centerFen, 'Bed5')
  const edge = scoreTwoBishopsWhiteMove(centerFen, 'Ba8')

  assert.equal(
    central.ruleUDiagonalLengthPenalty,
    edge.ruleUDiagonalLengthPenalty,
  )
  assert.ok(central.ruleUCenterPenalty < edge.ruleUCenterPenalty)
})

test('rule t prefers bishops to have at least four legal moves', () => {
  const fen = 'k7/8/8/8/8/8/6K1/B6B w - - 0 1'
  const unscreens = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  const screens = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(unscreens.ruleTPenalty, 0)
  assert.equal(screens.ruleTPenalty, 1)
})

test('rule t selects Ba3 when Bf3 leaves one bishop with only three moves', () => {
  const fen = '8/8/8/8/8/2K5/1B6/1k1B4 w - - 0 1'
  const freesBoth = scoreTwoBishopsWhiteMove(fen, 'Ba3')
  const leavesThree = scoreTwoBishopsWhiteMove(fen, 'Bf3')

  assert.equal(freesBoth.ruleTPenalty, 0)
  assert.equal(leavesThree.ruleTPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ba3'])
})

test('rule u uniquely selects Bd3 by total diagonal length', () => {
  const fen = '8/8/B1k2K2/4B3/8/8/8/8 w - - 0 1'

  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bd3'])
})

test("rule x aligns Black's king, a bishop, and White's king adjacently", () => {
  const fen = '8/8/8/1k1K4/3B4/8/B7/8 w - - 0 1'
  const aligned = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const unaligned = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(aligned.ruleXPenalty, 0)
  assert.equal(unaligned.ruleXPenalty, 1)
})

test("rule y maximizes the nearer bishop's distance from Black's king", () => {
  const fen = '7K/8/8/8/8/2BB4/k7/8 w - - 0 1'
  const farther = scoreTwoBishopsWhiteMove(fen, 'Bf6')
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Bb2')

  assert.equal(farther.ruleYApplies, true)
  assert.equal(nearer.ruleYApplies, true)
  assert.equal(farther.ruleYNearerDistance, 10)
  assert.equal(farther.ruleYFartherDistance, 41)
  assert.equal(nearer.ruleYNearerDistance, 1)
  assert.equal(nearer.ruleYFartherDistance, 10)
})

test('rule y uses the farther bishop to break an equal-nearer tie', () => {
  const fen = '7K/8/3B4/3B4/3k4/8/8/8 w - - 0 1'
  const bF3 = scoreTwoBishopsWhiteMove(fen, 'Bf3')
  const bA8 = scoreTwoBishopsWhiteMove(fen, 'Ba8')

  assert.equal(bF3.ruleYNearerDistance, 4)
  assert.equal(bA8.ruleYNearerDistance, 4)
  assert.equal(bF3.ruleYFartherDistance, 5)
  assert.equal(bA8.ruleYFartherDistance, 25)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ba8', 'Bh1'])
})

test('rule w precedes rule y in the supplied position', () => {
  const fen = '8/8/2K5/8/1k1B4/3B4/8/8 w - - 2 2'

  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kd5'])
})

test('rule o is ordered before the later rule p', () => {
  assert.ok(
    twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule o') <
      twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule p'),
  )
})

test('rule q is ordered after rule p and before rule r', () => {
  const ids = twoBishopsWhiteRules.map(({ id }) => id)

  assert.equal(ids.indexOf('rule q'), ids.indexOf('rule p') + 1)
  assert.equal(ids.indexOf('rule r'), ids.indexOf('rule q') + 1)
})

test('rule q prefers opposition when the retreat square is controlled', () => {
  const fen = '7B/8/4B3/8/8/8/5K1k/8 w - - 2 2'
  const keepsOpposition = scoreTwoBishopsWhiteMove(fen, 'Be5+')
  const leavesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(keepsOpposition.ruleQApplies, true)
  assert.equal(keepsOpposition.ruleQPenalty, 0)
  assert.equal(leavesOpposition.ruleQApplies, true)
  assert.equal(leavesOpposition.ruleQPenalty, 1)
})

test('rule p does not apply when Black is one ahead on track', () => {
  const fen = '8/8/8/3BBK2/7k/8/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7').rulePApplies, false)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('rule p controls the retreat square when Black is on track', () => {
  const fen = '8/8/4B3/4B3/4K3/8/4k3/8 w - - 4 3'
  const controlsD2 = scoreTwoBishopsWhiteMove(fen, 'Bc3')
  const missesD2 = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(controlsD2.rulePApplies, true)
  assert.equal(controlsD2.rulePPenalty, 0)
  assert.equal(missesD2.rulePApplies, true)
  assert.equal(missesD2.rulePPenalty, 1)
})

test('rule p applies when Black is one behind track', () => {
  const fen = '6B1/6B1/8/7k/5K2/8/8/8 w - - 2 2'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7+').rulePApplies, true)
})

test('rule p evaluates the retreat square after the bishop wall switches', () => {
  const fen = '8/8/7k/3B1K2/3B4/8/8/8 w - - 0 1'
  const controlsH7 = scoreTwoBishopsWhiteMove(fen, 'Bg8')
  const missesH7 = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(controlsH7.rulePApplies, true)
  assert.equal(controlsH7.rulePPenalty, 0)
  assert.equal(missesH7.rulePApplies, true)
  assert.equal(missesH7.rulePPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg8'])
})

test('rule p does not let a king move redefine the retreat track', () => {
  const fen = '8/5B2/7k/5K2/3B4/8/8/8 w - - 0 1'
  const controlsH7 = scoreTwoBishopsWhiteMove(fen, 'Bg8')
  const changesTheKingTrack = scoreTwoBishopsWhiteMove(fen, 'Kg4')

  assert.equal(controlsH7.rulePPenalty, 0)
  assert.equal(changesTheKingTrack.rulePPenalty, 1)
})

test('rule p does not invent a retreat square off the king track', () => {
  const fen = '8/8/4BB2/7k/8/4K3/8/8 w - - 18 10'
  const bg7 = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(bg7.rulePApplies, false)
})

test('rule j controls the edge square beyond Black away from the caged corner', () => {
  const fen = '8/8/8/8/5K1k/5B2/8/6B1 w - - 2 2'
  const controlsH3 = scoreTwoBishopsWhiteMove(fen, 'Bg2')
  const leavesH3Uncontrolled = scoreTwoBishopsWhiteMove(fen, 'Bh1')

  assert.equal(controlsH3.ruleJApplies, true)
  assert.equal(controlsH3.ruleJPenalty, 0)
  assert.equal(leavesH3Uncontrolled.ruleJApplies, true)
  assert.equal(leavesH3Uncontrolled.ruleJPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg2'])
})

test('rule i checks when opposition is set and the retreat square is controlled', () => {
  const fen = '7B/8/4B3/8/8/8/5K1k/8 w - - 2 2'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Be5+')
  const waits = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(checks.ruleIApplies, true)
  assert.equal(checks.ruleIPenalty, 0)
  assert.equal(waits.ruleIApplies, true)
  assert.equal(waits.ruleIPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Be5+'])
})

test('rule i checks from opposition away from the board edge', () => {
  const fen = '8/8/4BB2/8/8/4K1k1/8/8 w - - 0 1'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Be5+')
  const leavesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(checks.ruleIApplies, true)
  assert.equal(checks.ruleIPenalty, 0)
  assert.equal(leavesOpposition.ruleIPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Be5+'])
})

test('rule i checks when Black is one behind track and the retreat square is controlled', () => {
  const fen = '6B1/6B1/8/7k/5K2/8/8/8 w - - 2 2'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Bf7+')
  const waits = scoreTwoBishopsWhiteMove(fen, 'Be6')

  assert.equal(checks.ruleIApplies, true)
  assert.equal(checks.ruleIPenalty, 0)
  assert.equal(waits.ruleIApplies, true)
  assert.equal(waits.ruleIPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bf7+'])
})

test('rule i lets a one-behind check establish retreat-square control', () => {
  const fen = '8/8/8/8/5K2/1BB5/4k3/8 w - - 6 4'
  const checksAndControls = scoreTwoBishopsWhiteMove(fen, 'Bc4+')
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(checksAndControls.ruleIApplies, true)
  assert.equal(checksAndControls.ruleIPenalty, 0)
  assert.equal(takesOpposition.ruleIApplies, true)
  assert.equal(takesOpposition.ruleIPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bc4+'])
})

test('rule j controls the actual retreat square when both edge corners are caged', () => {
  const fen = '8/8/8/3BB3/8/5K2/8/5k2 w - - 0 1'
  const controlsE1 = scoreTwoBishopsWhiteMove(fen, 'Bc3')
  const checksBlack = scoreTwoBishopsWhiteMove(fen, 'Bc4+')

  assert.equal(controlsE1.ruleJApplies, true)
  assert.equal(controlsE1.ruleJPenalty, 0)
  assert.equal(checksBlack.ruleJPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bc3'])
})

test("rule k keeps White a knight's move from Black in the corner", () => {
  const fen = '8/6B1/4B3/8/8/8/5K2/7k w - - 0 1'
  const preservesKnightSquare = scoreTwoBishopsWhiteMove(fen, 'Bg8')
  const leavesKnightSquare = scoreTwoBishopsWhiteMove(fen, 'Kf1')

  assert.equal(preservesKnightSquare.ruleKApplies, true)
  assert.equal(preservesKnightSquare.ruleKPenalty, 0)
  assert.equal(leavesKnightSquare.ruleKApplies, true)
  assert.equal(leavesKnightSquare.ruleKPenalty, 1)
  assert.equal(getIdealTwoBishopsWhiteMoves(fen).includes('Kf1'), false)
})

test('rule k then preserves control of the double retreat square', () => {
  const fen = '8/8/4BB2/8/8/8/5K2/7k w - - 12 7'
  const losesH3 = scoreTwoBishopsWhiteMove(fen, 'Bf7')
  const keepsH3 = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(losesH3.ruleKPenalty, 0)
  assert.equal(keepsH3.ruleKPenalty, 0)
  assert.equal(losesH3.ruleKDoubleRetreatPenalty, 1)
  assert.equal(keepsH3.ruleKDoubleRetreatPenalty, 0)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Bf7'))
})

test('rule k evaluates the double retreat square after the king moves', () => {
  const fen = '8/8/8/8/2B5/2B3K1/8/7k w - - 10 6'
  const switchesTrackAndLosesH3 = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  const keepsTheCurrentTrackControlled = scoreTwoBishopsWhiteMove(fen, 'Bb2')

  assert.equal(switchesTrackAndLosesH3.ruleKApplies, true)
  assert.equal(switchesTrackAndLosesH3.ruleKDoubleRetreatPenalty, 1)
  assert.equal(keepsTheCurrentTrackControlled.ruleKDoubleRetreatPenalty, 0)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Kf2'))
})

test('rule m takes opposition when Black is one ahead of track and the double retreat square is controlled', () => {
  const fen = '6B1/6B1/8/5K2/7k/8/8/8 w - - 0 1'
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const avoidsOpposition = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(takesOpposition.ruleMApplies, true)
  assert.equal(takesOpposition.ruleMPenalty, 0)
  assert.equal(avoidsOpposition.ruleMApplies, true)
  assert.equal(avoidsOpposition.ruleMPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('rule m does not apply without control of the double retreat square', () => {
  const fen = '7B/5B2/8/5K2/7k/8/8/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(score.ruleMApplies, false)
})

test('rule n controls the flank square when Black is one ahead on track', () => {
  const fen = '6B1/6B1/8/8/5K2/7k/8/8 w - - 0 1'
  const controlsG2 = scoreTwoBishopsWhiteMove(fen, 'Bd5')
  const missesG2 = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(controlsG2.ruleNApplies, true)
  assert.equal(controlsG2.ruleNPenalty, 0)
  assert.equal(missesG2.ruleNPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bd5'])
})

test('rule n recognizes the flank square when both cage edges are reachable', () => {
  const fen = '8/5B2/5B2/8/8/4K3/6k1/8 w - - 0 1'
  const controlsF1 = scoreTwoBishopsWhiteMove(fen, 'Bc4')

  assert.equal(controlsF1.ruleNApplies, true)
  assert.equal(controlsF1.ruleNPenalty, 0)
  assert.ok(getIdealTwoBishopsWhiteMoves(fen).includes('Bc4'))
})

test('rule n applies only in Phase 2', () => {
  const fen = '8/8/8/8/1B3K2/8/2B5/7k w - - 0 1'

  assert.equal(isTwoBishopsPhaseTwoPosition(fen), false)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be4').ruleNApplies, false)
})

test('rule n prefers retreat-square control after flank-square control', () => {
  const fen = '8/5B2/8/8/3B4/5K2/7k/8 w - - 22 12'
  const controlsBoth = scoreTwoBishopsWhiteMove(fen, 'Be6')
  const controlsOnlyFlank = scoreTwoBishopsWhiteMove(fen, 'Bd5')

  assert.equal(controlsBoth.ruleNPenalty, 0)
  assert.equal(controlsOnlyFlank.ruleNPenalty, 0)
  assert.equal(controlsBoth.ruleNRetreatPenalty, 0)
  assert.equal(controlsOnlyFlank.ruleNRetreatPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Be6'])
})

test('rule l checks with Black one behind track and four squares from the corner', () => {
  const fen = '1B6/8/8/3B4/8/3K4/8/4k3 w - - 4 3'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Bg3+')
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke3')

  assert.equal(checks.ruleLApplies, true)
  assert.equal(checks.ruleLPenalty, 0)
  assert.equal(takesOpposition.ruleLApplies, true)
  assert.equal(takesOpposition.ruleLPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg3+'])
})
