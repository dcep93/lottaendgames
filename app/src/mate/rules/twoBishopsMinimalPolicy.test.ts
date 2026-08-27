import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess } from '../chess'
import { MATE_CATALOG } from '../catalog'
import {
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
  'rule e',
  'rule b1',
  'rule b2',
  'rule b3',
  'rule b5',
  'rule b6',
  'rule c01',
  'rule c03',
  'rule c05',
  'rule c07',
  'rule c07.5',
  'rule c08',
  'rule c08.5',
  'rule c09',
  'rule c10',
  'rule c12',
  'rule c14',
  'rule c15',
  'rule c20',
  'rule f4',
  'rule f5',
  'rule g1',
  'rule g2',
  'rule g5',
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
      id: 'bishop-rule-b1',
      title: 'rule b1',
      caption:
        'With the Phase 2 cage aimed at h1, White Kh6 and Black Kg4 or Kh4, play Bf6.',
      pieces: [
        { square: 'h6', piece: 'K' },
        { square: 'g4', piece: 'k' },
        { square: 'e5', piece: 'B' },
        { square: 'b1', piece: 'B' },
      ],
      highlights: [
        { square: 'h1', kind: 'pink' },
        { square: 'f6', kind: 'key' },
      ],
      arrows: [{ from: 'e5', to: 'f6' }],
    },
    {
      id: 'bishop-rule-b2',
      title: 'rule b2',
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
      id: 'bishop-rule-b3',
      title: 'rule b3',
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
      id: 'bishop-rule-b5',
      title: 'rule b5',
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
      id: 'bishop-rule-b6',
      title: 'rule b6',
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
      id: 'bishop-rule-c03',
      title: 'rule c03',
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
    twoBishopsWhiteRules.find(({ id }) => id === 'rule e')?.helpText,
    'Prefer moves after which every Black reply is Phase 2 with a consistent target corner.',
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

test('rule c01 keeps the king off the long diagonal wall in Phase 2', () => {
  const fen = '8/8/8/8/2KB4/8/k1B5/8 w - - 0 1'
  const occupiesWall = scoreTwoBishopsWhiteMove(fen, 'Kc3')
  const staysClear = scoreTwoBishopsWhiteMove(fen, 'Kc5')

  assert.equal(occupiesWall.ruleC01Applies, true)
  assert.equal(occupiesWall.ruleC01Penalty, 1)
  assert.equal(staysClear.ruleC01Penalty, 0)
})

test("rule c01 allows the king on the target square's long diagonal", () => {
  const fen = '8/8/8/8/2KB4/8/k1B5/8 w - - 0 1'
  const walksOnTargetDiagonal = scoreTwoBishopsWhiteMove(fen, 'Kd5')

  assert.equal(walksOnTargetDiagonal.ruleC01Applies, true)
  assert.equal(walksOnTargetDiagonal.ruleC01Penalty, 0)
})

test('rule e follows rule a and precedes the b, c, and f rules', () => {
  const ids = twoBishopsWhiteRules.map(({ id }) => id)
  assert.equal(ids.indexOf('rule e'), ids.indexOf('rule a') + 1)
  assert.equal(ids.indexOf('rule b1'), ids.indexOf('rule e') + 1)
  assert.equal(ids.indexOf('rule b3'), ids.indexOf('rule b1') + 2)
  assert.equal(ids.includes('rule b4'), false)
  assert.equal(ids.indexOf('rule b5'), ids.indexOf('rule b1') + 3)
  assert.equal(ids.indexOf('rule b6'), ids.indexOf('rule b1') + 4)
  assert.equal(ids.indexOf('rule f4'), ids.indexOf('rule c20') + 1)
  assert.equal(ids.indexOf('rule f5'), ids.indexOf('rule f4') + 1)
  assert.equal(ids.indexOf('rule g1'), ids.indexOf('rule f5') + 1)
  assert.equal(ids.indexOf('rule g2'), ids.indexOf('rule g1') + 1)
  assert.equal(ids.indexOf('rule g5'), ids.indexOf('rule g2') + 1)
  assert.equal(twoBishopsRuleSet.whiteMoveOverride, undefined)
})

test('rule g2 prefers White king proximity to an unoccupied center square', () => {
  const fen = '8/8/8/2k1B3/4BK2/8/8/8 w - - 0 1'
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Ke3')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kf5')

  assert.equal(nearer.ruleG2CenterDistance, 2)
  assert.equal(farther.ruleG2CenterDistance, 4)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ke3'])
})

test('rule g1 aligns the king with two central bishops', () => {
  const fen = '8/8/8/3BK3/1k1B4/8/8/8 w - - 0 1'

  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kd6'])
})

test("rule g2 uses proximity to Black's king after center proximity", () => {
  const fen = 'k7/4K3/8/8/8/8/8/B6B w - - 0 1'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Kd6')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Ke6')

  assert.equal(closer.ruleG2CenterDistance, 1)
  assert.equal(farther.ruleG2CenterDistance, 1)
  assert.ok(
    closer.ruleG2BlackKingDistance < farther.ruleG2BlackKingDistance,
  )
})

test('rule f5 is inactive in Phase 2 while rule g5 remains active', () => {
  const score = scoreTwoBishopsWhiteMove(
    '8/2k4B/4K3/8/3B4/8/8/8 w - - 2 2',
    'Ke7',
  )

  assert.equal(score.ruleF5Applies, false)
  assert.equal(score.ruleG5Applies, true)
})

test('c08.5 applies when Black is on the target side of the a8 king moat', () => {
  const fen = '8/2k4B/4K3/8/3B4/8/8/8 w - - 2 2'
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke7')

  assert.equal(takesOpposition.ruleC08Applies, false)
  assert.equal(takesOpposition.ruleC085Applies, true)
  assert.equal(takesOpposition.ruleC085Penalty, 0)
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

test('rule e does not reward entering Phase 2 when Black can leave it', () => {
  const fen = '8/8/8/6K1/8/8/B3k3/B7 w - - 0 1'
  const enters = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  const remains = scoreTwoBishopsWhiteMove(fen, 'Kh5')
  assert.equal(enters.isPhaseTwoPosition, true)
  assert.equal(enters.ruleEPenalty, 1)
  assert.equal(remains.ruleEPenalty, 1)
  assert.equal(
    twoBishopsRuleSet.phase('8/8/8/5K2/8/8/B3k3/B7 b - - 11 6'),
    '2/2',
  )
})

test('rule e rejects switching the target corner but accepts a preserved cage', () => {
  const fen = '8/8/8/3BB3/4K3/8/3k4/8 w - - 6 4'
  const switchesCorner = scoreTwoBishopsWhiteMove(fen, 'Kd4')
  const keepsCorner = scoreTwoBishopsWhiteMove(fen, 'Kf4')

  assert.equal(switchesCorner.isPhaseTwoPosition, true)
  assert.equal(keepsCorner.isPhaseTwoPosition, true)
  assert.equal(switchesCorner.ruleEPenalty, 1)
  assert.equal(keepsCorner.ruleEPenalty, 0)
})

test('rule e rejects a move when any Black reply exits Phase 2', () => {
  const fen = '8/3k4/8/8/5K2/8/7B/7B w - - 2 2'
  const bg1 = scoreTwoBishopsWhiteMove(fen, 'Bg1')

  assert.equal(bg1.isPhaseTwoPosition, true)
  assert.equal(bg1.ruleEPenalty, 1)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Bg1'))
})

test('rule e accepts Kf3 when it and every Black reply enter Phase 2', () => {
  const fen = '8/8/8/3B1k2/3B4/4K3/8/8 w - - 0 1'
  const kf3 = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(kf3.isPhaseTwoPosition, true)
  assert.equal(kf3.ruleEPenalty, 0)
})

test('Phase 2 measures center proximity by Euclidean distance', () => {
  const beforeKf3 = '8/8/4B3/4B1k1/4K3/8/8/8 w - - 16 9'
  const afterKf3 = '8/8/4B3/4B1k1/8/5K2/8/8 b - - 17 9'

  assert.equal(twoBishopsRuleSet.phase(afterKf3), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(beforeKf3, 'Kf3').ruleEPenalty, 0)
})

test('Phase 2 allows White to be equally close to the target middle square', () => {
  const fen = '8/3K4/8/1k6/3BB3/8/8/8 w - - 2 2'

  assert.equal(twoBishopsRuleSet.phase(fen), '2/2')
})

test('Bd5 enters Phase 2 using e4 for the h1 target corner', () => {
  const fen = '8/8/8/5k2/3BB3/4K3/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd5').isPhaseTwoPosition, true)
})

test('rule b1 scores Bf6 with White Kh6 and Black Kg4 or Kh4 in the h1 cage', () => {
  for (const blackKing of ['6k1', '7k']) {
    const fen = `8/8/7K/4B3/${blackKing}/8/8/1B6 w - - 0 1`
    const preferred = scoreTwoBishopsWhiteMove(fen, 'Bf6')
    const waiting = scoreTwoBishopsWhiteMove(fen, 'Bc2')

    assert.equal(preferred.ruleB1Applies, true)
    assert.equal(preferred.ruleB1Penalty, 0)
    assert.equal(waiting.ruleB1Applies, true)
    assert.equal(waiting.ruleB1Penalty, 1)
  }
})

test('rule b2 prefers Kf4 with White Kf5 and Black Kh4 in the h1 cage', () => {
  const fen = '8/8/8/3BBK2/7k/8/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const waiting = scoreTwoBishopsWhiteMove(fen, 'Bf7')

  assert.equal(preferred.ruleB2Applies, true)
  assert.equal(preferred.ruleB2Penalty, 0)
  assert.equal(waiting.ruleB2Applies, true)
  assert.equal(waiting.ruleB2Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('rule b2 requires the complete diagram position', () => {
  const fen = '8/8/8/3B1K2/3B3k/8/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf4').ruleB2Applies, false)
})

test('rule b3 prefers Bd5 in the complete diagram position', () => {
  const fen = '8/3k4/8/4B3/4BK2/8/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Bd5')
  const temporaryPhaseTwo = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(preferred.ruleB3Applies, true)
  assert.equal(preferred.ruleB3Penalty, 0)
  assert.equal(temporaryPhaseTwo.ruleB3Applies, true)
  assert.equal(temporaryPhaseTwo.ruleB3Penalty, 1)
})

test('rule b2 accepts every partner-bishop square from a2 through g8', () => {
  const partnerSquares = ['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const

  for (const square of partnerSquares) {
    const chess = getChess('8/8/8/4BK2/7k/8/8/8 w - - 0 1')
    chess.put({ color: 'w', type: 'b' }, square)
    const fen = chess.fen()
    const preferred = scoreTwoBishopsWhiteMove(fen, 'Kf4')

    assert.equal(preferred.ruleB2Applies, true, square)
    assert.equal(preferred.ruleB2Penalty, 0, square)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'], square)
  }
})

test('rule b5 prefers Ba2 in the complete diagram position', () => {
  const fen = '8/8/8/3B4/3K4/2B5/2k5/8 w - - 2 2'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Ba2')
  const loopMove = scoreTwoBishopsWhiteMove(fen, 'Ba1')

  assert.equal(preferred.ruleB5Applies, true)
  assert.equal(preferred.ruleB5Penalty, 0)
  assert.equal(loopMove.ruleB5Applies, true)
  assert.equal(loopMove.ruleB5Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ba2'])
})

test('rule b6 prefers Bc5 in the complete diagram position', () => {
  const fen = '8/8/8/3K4/3BBk2/8/8/8 w - - 0 1'
  const preferred = scoreTwoBishopsWhiteMove(fen, 'Bc5')
  const loopMove = scoreTwoBishopsWhiteMove(fen, 'Be5+')

  assert.equal(preferred.ruleB6Applies, true)
  assert.equal(preferred.ruleB6Penalty, 0)
  assert.equal(loopMove.ruleB6Applies, true)
  assert.equal(loopMove.ruleB6Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bc5'])
})

test('rule c10 takes opposition when the edge square away from the caged corner is uncontrolled', () => {
  const fen = '6B1/6B1/8/8/7k/5K2/8/8 w - - 4 3'
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const staysOutOfOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf2')

  assert.equal(takesOpposition.ruleC10Applies, true)
  assert.equal(takesOpposition.ruleC10Penalty, 0)
  assert.equal(staysOutOfOpposition.ruleC10Applies, true)
  assert.equal(staysOutOfOpposition.ruleC10Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('retreat rules are inactive when the Phase 2 kings are not tracked', () => {
  const fen = '8/8/4B3/4B3/8/4K3/8/7k w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bc4')

  assert.equal(score.ruleC03Applies, false)
  assert.equal(score.ruleC05Applies, false)
  assert.equal(score.ruleC07DoubleRetreatPenalty, 1)
  assert.equal(score.ruleC10Applies, false)
  assert.equal(score.ruleC12Applies, false)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf3'])
})

test('retreat rules reject Black on the wrong side of the king moat', () => {
  const fen = '8/7B/2K5/4B3/1k6/8/8/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Kb6')

  assert.equal(score.ruleC03Applies, false)
  assert.equal(score.ruleC08Applies, false)
  assert.equal(score.ruleC085Applies, false)
  assert.equal(score.ruleC12Applies, false)
})

test('double retreat stays on the tracked rank', () => {
  const fen = '8/8/4BB2/8/4K3/8/5k2/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf4').ruleC08Applies, false)
})

test("rule c15 prefers the middle 16, then proximity to Black's king", () => {
  const fen = '8/5B2/8/4BK2/8/7k/8/8 w - - 22 12'
  const closer = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Ke4')
  const outside = scoreTwoBishopsWhiteMove(fen, 'Kg5')

  assert.equal(closer.ruleC15Applies, true)
  assert.equal(closer.ruleC15Middle16Distance, 0)
  assert.equal(farther.ruleC15Middle16Distance, 0)
  assert.ok(
    closer.ruleC15BlackKingDistance < farther.ruleC15BlackKingDistance,
  )
  assert.equal(outside.ruleC15Middle16Distance, 1)
})

test('rule c15 uniquely selects the closer central king move', () => {
  const fen = '8/8/3K4/8/8/5B2/5B1k/8 w - - 12 7'
  const ke5 = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  const ke6 = scoreTwoBishopsWhiteMove(fen, 'Ke6')

  assert.equal(ke5.ruleC15Middle16Distance, 0)
  assert.equal(ke6.ruleC15Middle16Distance, 0)
  assert.ok(ke5.ruleC15BlackKingDistance < ke6.ruleC15BlackKingDistance)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ke5'])
})

test('rule c20 measures track along the target corner edges', () => {
  const fen = '8/8/8/4B3/8/1B3K2/3k4/8 w - - 0 1'
  const falsePerpendicularTrack = scoreTwoBishopsWhiteMove(fen, 'Bb2')
  const kingMove = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(falsePerpendicularTrack.ruleC20Applies, true)
  assert.equal(falsePerpendicularTrack.ruleC20Penalty, 1)
  assert.equal(kingMove.ruleC20Applies, true)
  assert.equal(kingMove.ruleC20Penalty, 1)
})

test('rule c20 rejects replies that move too far off track after c12', () => {
  const fen = '8/8/8/4B3/8/3K4/B7/2k5 w - - 2 2'
  const leavesTrack = scoreTwoBishopsWhiteMove(fen, 'Ke4')
  const keepsTrack = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(leavesTrack.ruleC12Penalty, 0)
  assert.equal(leavesTrack.ruleC20Penalty, 1)
  assert.equal(keepsTrack.ruleC12Penalty, 0)
  assert.equal(keepsTrack.ruleC20Penalty, 0)
})

test('rule f5 prefers more bishops on longer diagonals, then in the center', () => {
  const longDiagonalFen = '8/8/8/8/1B3K2/8/2B5/7k w - - 0 1'
  const keepsLongDiagonal = scoreTwoBishopsWhiteMove(longDiagonalFen, 'Be4')
  const leavesLongDiagonals = scoreTwoBishopsWhiteMove(longDiagonalFen, 'Bd3')

  assert.equal(keepsLongDiagonal.ruleF5Applies, true)
  assert.ok(
    keepsLongDiagonal.ruleF5DiagonalLengthPenalty <
      leavesLongDiagonals.ruleF5DiagonalLengthPenalty,
  )

  const centerFen = '7k/8/8/8/2B1B3/5K2/8/8 w - - 0 1'
  const central = scoreTwoBishopsWhiteMove(centerFen, 'Bed5')
  const edge = scoreTwoBishopsWhiteMove(centerFen, 'Ba8')

  assert.equal(
    central.ruleF5DiagonalLengthPenalty,
    edge.ruleF5DiagonalLengthPenalty,
  )
  assert.ok(central.ruleF5CenterPenalty < edge.ruleF5CenterPenalty)
})

test('rule f4 prefers unscreening both bishops to at least three legal moves', () => {
  const fen = 'k7/8/8/8/8/8/6K1/B6B w - - 0 1'
  const unscreens = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  const screens = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(unscreens.ruleF4Penalty, 0)
  assert.equal(screens.ruleF4Penalty, 1)
})

test('rule f5 uniquely selects Bd3 by total diagonal length', () => {
  const fen = '8/8/B1k2K2/4B3/8/8/8/8 w - - 0 1'

  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bd3'])
})

test("rule g5 maximizes the nearer bishop's distance from Black's king", () => {
  const fen = '7K/8/8/8/8/2BB4/k7/8 w - - 0 1'
  const farther = scoreTwoBishopsWhiteMove(fen, 'Bf6')
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Bb2')

  assert.equal(farther.ruleG5Applies, true)
  assert.equal(nearer.ruleG5Applies, true)
  assert.equal(farther.ruleG5NearerDistance, 10)
  assert.equal(farther.ruleG5FartherDistance, 41)
  assert.equal(nearer.ruleG5NearerDistance, 1)
  assert.equal(nearer.ruleG5FartherDistance, 10)
})

test('rule g5 uses the farther bishop to break an equal-nearer tie', () => {
  const fen = '7K/8/3B4/3B4/3k4/8/8/8 w - - 0 1'
  const bF3 = scoreTwoBishopsWhiteMove(fen, 'Bf3')
  const bA8 = scoreTwoBishopsWhiteMove(fen, 'Ba8')

  assert.equal(bF3.ruleG5NearerDistance, 4)
  assert.equal(bA8.ruleG5NearerDistance, 4)
  assert.equal(bF3.ruleG5FartherDistance, 5)
  assert.equal(bA8.ruleG5FartherDistance, 25)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ba8', 'Bh1'])
})

test('rule g2 precedes g5 in the supplied position', () => {
  const fen = '8/8/2K5/8/1k1B4/3B4/8/8 w - - 2 2'

  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kd5'])
})

test('rule c10 is ordered before the later rule c12', () => {
  assert.ok(
    twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule c10') <
      twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule c12'),
  )
})

test('rule c14 is ordered after c12 and before c15', () => {
  const ids = twoBishopsWhiteRules.map(({ id }) => id)

  assert.equal(ids.indexOf('rule c14'), ids.indexOf('rule c12') + 1)
  assert.equal(ids.indexOf('rule c15'), ids.indexOf('rule c14') + 1)
})

test('rule c14 prefers opposition when the retreat square is controlled', () => {
  const fen = '7B/8/4B3/8/8/8/5K1k/8 w - - 2 2'
  const keepsOpposition = scoreTwoBishopsWhiteMove(fen, 'Be5+')
  const leavesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(keepsOpposition.ruleC14Applies, true)
  assert.equal(keepsOpposition.ruleC14Penalty, 0)
  assert.equal(leavesOpposition.ruleC14Applies, true)
  assert.equal(leavesOpposition.ruleC14Penalty, 1)
})

test('rule c12 does not apply when Black is one ahead on track', () => {
  const fen = '8/8/8/3BBK2/7k/8/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7').ruleC12Applies, false)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('rule c12 controls the retreat square when Black is on track', () => {
  const fen = '8/8/4B3/4B3/4K3/8/4k3/8 w - - 4 3'
  const controlsD2 = scoreTwoBishopsWhiteMove(fen, 'Bc3')
  const missesD2 = scoreTwoBishopsWhiteMove(fen, 'Bd4')

  assert.equal(controlsD2.ruleC12Applies, true)
  assert.equal(controlsD2.ruleC12Penalty, 0)
  assert.equal(missesD2.ruleC12Applies, true)
  assert.equal(missesD2.ruleC12Penalty, 1)
})

test('rule c12 applies when Black is one behind track', () => {
  const fen = '6B1/6B1/8/7k/5K2/8/8/8 w - - 2 2'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7+').ruleC12Applies, true)
})

test('rule c12 evaluates the retreat square after the bishop wall switches', () => {
  const fen = '8/8/7k/3B1K2/3B4/8/8/8 w - - 0 1'
  const controlsH7 = scoreTwoBishopsWhiteMove(fen, 'Bg8')
  const missesH7 = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(controlsH7.ruleC12Applies, true)
  assert.equal(controlsH7.ruleC12Penalty, 0)
  assert.equal(missesH7.ruleC12Applies, true)
  assert.equal(missesH7.ruleC12Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg8'])
})

test('rule c12 does not let a king move redefine the retreat track', () => {
  const fen = '8/5B2/7k/5K2/3B4/8/8/8 w - - 0 1'
  const controlsH7 = scoreTwoBishopsWhiteMove(fen, 'Bg8')
  const changesTheKingTrack = scoreTwoBishopsWhiteMove(fen, 'Kg4')

  assert.equal(controlsH7.ruleC12Penalty, 0)
  assert.equal(changesTheKingTrack.ruleC12Penalty, 1)
})

test('rule c12 does not invent a retreat square off the king track', () => {
  const fen = '8/8/4BB2/7k/8/4K3/8/8 w - - 18 10'
  const bg7 = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(bg7.ruleC12Applies, false)
})

test('rule c05 controls the edge square beyond Black away from the caged corner', () => {
  const fen = '8/8/8/8/5K1k/5B2/8/6B1 w - - 2 2'
  const controlsH3 = scoreTwoBishopsWhiteMove(fen, 'Bg2')
  const leavesH3Uncontrolled = scoreTwoBishopsWhiteMove(fen, 'Bh1')

  assert.equal(controlsH3.ruleC05Applies, true)
  assert.equal(controlsH3.ruleC05Penalty, 0)
  assert.equal(leavesH3Uncontrolled.ruleC05Applies, true)
  assert.equal(leavesH3Uncontrolled.ruleC05Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg2'])
})

test('rule c03 checks when opposition is set and the retreat square is controlled', () => {
  const fen = '7B/8/4B3/8/8/8/5K1k/8 w - - 2 2'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Be5+')
  const waits = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(checks.ruleC03Applies, true)
  assert.equal(checks.ruleC03Penalty, 0)
  assert.equal(waits.ruleC03Applies, true)
  assert.equal(waits.ruleC03Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Be5+'])
})

test('rule c03 checks from opposition away from the board edge', () => {
  const fen = '8/8/4BB2/8/8/4K1k1/8/8 w - - 0 1'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Be5+')
  const leavesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(checks.ruleC03Applies, true)
  assert.equal(checks.ruleC03Penalty, 0)
  assert.equal(leavesOpposition.ruleC03Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Be5+'])
})

test('rule c03 checks when Black is one behind track and the retreat square is controlled', () => {
  const fen = '6B1/6B1/8/7k/5K2/8/8/8 w - - 2 2'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Bf7+')
  const waits = scoreTwoBishopsWhiteMove(fen, 'Be6')

  assert.equal(checks.ruleC03Applies, true)
  assert.equal(checks.ruleC03Penalty, 0)
  assert.equal(waits.ruleC03Applies, true)
  assert.equal(waits.ruleC03Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bf7+'])
})

test('rule c03 lets a one-behind check establish retreat-square control', () => {
  const fen = '8/8/8/8/5K2/1BB5/4k3/8 w - - 6 4'
  const checksAndControls = scoreTwoBishopsWhiteMove(fen, 'Bc4+')
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(checksAndControls.ruleC03Applies, true)
  assert.equal(checksAndControls.ruleC03Penalty, 0)
  assert.equal(takesOpposition.ruleC03Applies, true)
  assert.equal(takesOpposition.ruleC03Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bc4+'])
})

test('rule c05 controls the actual retreat square when both edge corners are caged', () => {
  const fen = '8/8/8/3BB3/8/5K2/8/5k2 w - - 0 1'
  const controlsE1 = scoreTwoBishopsWhiteMove(fen, 'Bc3')
  const checksBlack = scoreTwoBishopsWhiteMove(fen, 'Bc4+')

  assert.equal(controlsE1.ruleC05Applies, true)
  assert.equal(controlsE1.ruleC05Penalty, 0)
  assert.equal(checksBlack.ruleC05Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bc3'])
})

test("rule c07 keeps White a knight's move from Black in the corner", () => {
  const fen = '8/6B1/4B3/8/8/8/5K2/7k w - - 0 1'
  const preservesKnightSquare = scoreTwoBishopsWhiteMove(fen, 'Bg8')
  const leavesKnightSquare = scoreTwoBishopsWhiteMove(fen, 'Kf1')

  assert.equal(preservesKnightSquare.ruleC07Applies, true)
  assert.equal(preservesKnightSquare.ruleC07Penalty, 0)
  assert.equal(leavesKnightSquare.ruleC07Applies, true)
  assert.equal(leavesKnightSquare.ruleC07Penalty, 1)
  assert.equal(getIdealTwoBishopsWhiteMoves(fen).includes('Kf1'), false)
})

test('rule c07 then preserves control of the double retreat square', () => {
  const fen = '8/8/4BB2/8/8/8/5K2/7k w - - 12 7'
  const losesH3 = scoreTwoBishopsWhiteMove(fen, 'Bf7')
  const keepsH3 = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(losesH3.ruleC07Penalty, 0)
  assert.equal(keepsH3.ruleC07Penalty, 0)
  assert.equal(losesH3.ruleC07DoubleRetreatPenalty, 1)
  assert.equal(keepsH3.ruleC07DoubleRetreatPenalty, 0)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Bf7'))
})

test('rule c07 evaluates the double retreat square after the king moves', () => {
  const fen = '8/8/8/8/2B5/2B3K1/8/7k w - - 10 6'
  const switchesTrackAndLosesH3 = scoreTwoBishopsWhiteMove(fen, 'Kf2')
  const keepsTheCurrentTrackControlled = scoreTwoBishopsWhiteMove(fen, 'Bb2')

  assert.equal(switchesTrackAndLosesH3.ruleC07Applies, true)
  assert.equal(switchesTrackAndLosesH3.ruleC07DoubleRetreatPenalty, 1)
  assert.equal(keepsTheCurrentTrackControlled.ruleC07DoubleRetreatPenalty, 0)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Kf2'))
})

test('rule c08 takes opposition when Black is even and the double retreat square is controlled', () => {
  const fen = '8/8/8/4B3/4K3/1B6/4k3/8 w - - 0 1'
  const keepsOpposition = scoreTwoBishopsWhiteMove(fen, 'Bd4')
  const leavesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf4')

  assert.equal(keepsOpposition.ruleC08Applies, true)
  assert.equal(keepsOpposition.ruleC08Penalty, 0)
  assert.equal(leavesOpposition.ruleC08Applies, true)
  assert.equal(leavesOpposition.ruleC08Penalty, 1)
})

test('rule c08.5 takes opposition when Black is one ahead of track and the double retreat square is controlled', () => {
  const fen = '6B1/6B1/8/5K2/7k/8/8/8 w - - 0 1'
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const avoidsOpposition = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(takesOpposition.ruleC085Applies, true)
  assert.equal(takesOpposition.ruleC085Penalty, 0)
  assert.equal(avoidsOpposition.ruleC085Applies, true)
  assert.equal(avoidsOpposition.ruleC085Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
})

test('rule c08.5 does not apply without control of the double retreat square', () => {
  const fen = '7B/5B2/8/5K2/7k/8/8/8 w - - 0 1'
  const score = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(score.ruleC08Applies, false)
  assert.equal(score.ruleC085Applies, false)
})

test('rule c09 controls the flank square when Black is one ahead on track', () => {
  const fen = '6B1/6B1/8/8/5K2/7k/8/8 w - - 0 1'
  const controlsG2 = scoreTwoBishopsWhiteMove(fen, 'Bd5')
  const missesG2 = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(controlsG2.ruleC09Applies, true)
  assert.equal(controlsG2.ruleC09Penalty, 0)
  assert.equal(missesG2.ruleC09Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bd5'])
})

test('rule c09 recognizes the flank square when both cage edges are reachable', () => {
  const fen = '8/5B2/5B2/8/8/4K3/6k1/8 w - - 0 1'
  const controlsF1 = scoreTwoBishopsWhiteMove(fen, 'Bc4')

  assert.equal(controlsF1.ruleC09Applies, true)
  assert.equal(controlsF1.ruleC09Penalty, 0)
  assert.ok(getIdealTwoBishopsWhiteMoves(fen).includes('Bc4'))
})

test('rule c09 applies only in Phase 2', () => {
  const fen = '8/8/8/8/1B3K2/8/2B5/7k w - - 0 1'

  assert.equal(isTwoBishopsPhaseTwoPosition(fen), false)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be4').ruleC09Applies, false)
})

test('rule c09 prefers retreat-square control after flank-square control', () => {
  const fen = '8/5B2/8/8/3B4/5K2/7k/8 w - - 22 12'
  const controlsBoth = scoreTwoBishopsWhiteMove(fen, 'Be6')
  const controlsOnlyFlank = scoreTwoBishopsWhiteMove(fen, 'Bd5')

  assert.equal(controlsBoth.ruleC09Penalty, 0)
  assert.equal(controlsOnlyFlank.ruleC09Penalty, 0)
  assert.equal(controlsBoth.ruleC09RetreatPenalty, 0)
  assert.equal(controlsOnlyFlank.ruleC09RetreatPenalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Be6'])
})

test('rule c07.5 checks with Black one behind track and four squares from the corner', () => {
  const fen = '1B6/8/8/3B4/8/3K4/8/4k3 w - - 4 3'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Bg3+')
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke3')

  assert.equal(checks.ruleC075Applies, true)
  assert.equal(checks.ruleC075Penalty, 0)
  assert.equal(takesOpposition.ruleC075Applies, true)
  assert.equal(takesOpposition.ruleC075Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg3+'])
})
