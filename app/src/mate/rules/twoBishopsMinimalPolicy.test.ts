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
  'rule b1',
  'rule b2',
  'rule b3',
  'rule c03',
  'rule c05',
  'rule c07',
  'rule c7.5',
  'rule c08',
  'rule c08.5',
  'rule c9',
  'rule c10',
  'rule c11',
  'rule c12',
  'rule c15',
  'rule d7',
  'rule d9',
  'rule d12',
  'rule d16',
  'rule d20',
  'rule d25',
]

test('Two Bishops uses only the active two-phase policy', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.equal(twoBishopsRuleSet.phase('8/8/8/8/8/8/8/K6k w - - 0 1'), '1/2')
  assert.deepEqual(twoBishopsRuleSet.help.notes, [
      "Phase 2: Place one bishop on a long diagonal and the other on an adjacent diagonal. Both kings must be on the long diagonal's wider side, and White's king must take fewer king steps to reach the center than Black's king.",
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
        'With the Phase 2 cage aimed at h1, White Kf5 and Black Kh4, play Kf4.',
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
    twoBishopsWhiteRules.find(({ id }) => id === 'rule a')?.helpText,
    'Prefer phase 2 with a consistent target corner.',
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

test('rule b3 is an ordinary priority after rule a', () => {
  const ids = twoBishopsWhiteRules.map(({ id }) => id)
  assert.equal(ids.indexOf('rule b3'), ids.indexOf('rule a') + 3)
  assert.equal(twoBishopsRuleSet.whiteMoveOverride, undefined)
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

test('rule a prefers entering phase 2 after White moves', () => {
  const fen = '8/8/8/6K1/8/8/B3k3/B7 w - - 0 1'
  const enters = scoreTwoBishopsWhiteMove(fen, 'Kf5')
  const remains = scoreTwoBishopsWhiteMove(fen, 'Kh5')
  assert.equal(enters.ruleAPenalty, 0)
  assert.equal(remains.ruleAPenalty, 1)
  assert.equal(
    twoBishopsRuleSet.phase('8/8/8/5K2/8/8/B3k3/B7 b - - 11 6'),
    '2/2',
  )
})

test('rule a rejects switching the Phase 2 target corner', () => {
  const fen = '8/8/8/3BB3/4K3/8/3k4/8 w - - 6 4'
  const switchesCorner = scoreTwoBishopsWhiteMove(fen, 'Kd4')
  const keepsCorner = scoreTwoBishopsWhiteMove(fen, 'Kf4')

  assert.equal(switchesCorner.isPhaseTwoPosition, true)
  assert.equal(keepsCorner.isPhaseTwoPosition, true)
  assert.equal(switchesCorner.ruleAPenalty, 1)
  assert.equal(keepsCorner.ruleAPenalty, 0)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Kd4'))
})

test('Phase 2 measures center proximity in king steps', () => {
  const beforeKf3 = '8/8/4B3/4B1k1/4K3/8/8/8 w - - 16 9'
  const afterKf3 = '8/8/4B3/4B1k1/8/5K2/8/8 b - - 17 9'

  assert.equal(twoBishopsRuleSet.phase(afterKf3), '2/2')
  assert.equal(scoreTwoBishopsWhiteMove(beforeKf3, 'Kf3').ruleAPenalty, 0)
})

test('rule b1 prefers Bf6 with White Kh6 and Black Kg4 or Kh4 in the h1 cage', () => {
  for (const blackKing of ['6k1', '7k']) {
    const fen = `8/8/7K/4B3/${blackKing}/8/8/1B6 w - - 0 1`
    const preferred = scoreTwoBishopsWhiteMove(fen, 'Bf6')
    const waiting = scoreTwoBishopsWhiteMove(fen, 'Bc2')

    assert.equal(preferred.ruleB1Applies, true)
    assert.equal(preferred.ruleB1Penalty, 0)
    assert.equal(waiting.ruleB1Applies, true)
    assert.equal(waiting.ruleB1Penalty, 1)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [
      blackKing === '6k1' ? 'Bf6' : 'Bf6+',
    ])
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

test('rule c15 uniquely breaks a rule c11 tie', () => {
  const fen = '8/8/3K4/8/8/5B2/5B1k/8 w - - 12 7'
  const ke5 = scoreTwoBishopsWhiteMove(fen, 'Ke5')
  const ke6 = scoreTwoBishopsWhiteMove(fen, 'Ke6')

  assert.equal(ke5.ruleC11Penalty, 0)
  assert.equal(ke6.ruleC11Penalty, 0)
  assert.equal(ke5.ruleC15Middle16Distance, 0)
  assert.equal(ke6.ruleC15Middle16Distance, 0)
  assert.ok(ke5.ruleC15BlackKingDistance < ke6.ruleC15BlackKingDistance)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Ke5'])
})

test("rule d16 prefers the center, then proximity to Black's king", () => {
  const fen = '8/8/4k3/8/5K2/5BB1/8/8 w - - 6 4'
  const central = scoreTwoBishopsWhiteMove(fen, 'Ke4')
  const farther = scoreTwoBishopsWhiteMove(fen, 'Kg4')

  assert.equal(central.ruleD10Applies, true)
  assert.equal(farther.ruleD10Applies, true)
  assert.ok(central.ruleD10Penalty < farther.ruleD10Penalty)

  const tieFen = 'k7/8/8/8/4K3/8/8/1BB5 w - - 0 1'
  const closerToBlack = scoreTwoBishopsWhiteMove(tieFen, 'Kd5')
  const fartherFromBlack = scoreTwoBishopsWhiteMove(tieFen, 'Ke5')
  assert.equal(closerToBlack.ruleD10Penalty, fartherFromBlack.ruleD10Penalty)
  assert.ok(
    closerToBlack.ruleD10BlackKingDistance <
      fartherFromBlack.ruleD10BlackKingDistance,
  )
})

test('rule d7 prefers at least one bishop on a long diagonal', () => {
  const fen = '8/8/8/8/1B3K2/8/2B5/7k w - - 0 1'
  const keepsLongDiagonal = scoreTwoBishopsWhiteMove(fen, 'Be4')
  const leavesLongDiagonals = scoreTwoBishopsWhiteMove(fen, 'Bd3')

  assert.equal(keepsLongDiagonal.ruleD7Applies, true)
  assert.equal(keepsLongDiagonal.ruleD7Penalty, 0)
  assert.equal(leavesLongDiagonals.ruleD7Penalty, 1)
})

test('inactive Phase 2 stops do not prevent rule d7 from preserving a long diagonal', () => {
  const fen = '8/8/8/3k1K2/3B4/3B4/8/8 w - - 6 4'
  const abandonsLongDiagonal = scoreTwoBishopsWhiteMove(fen, 'Bb6')
  const keepsLongDiagonal = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(isTwoBishopsPhaseTwoPosition(fen), false)
  assert.equal(abandonsLongDiagonal.ruleD7Penalty, 1)
  assert.equal(keepsLongDiagonal.ruleD7Penalty, 0)
  assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes('Bb6'))
})

test('rule d9 prefers the farther edge-two bishop when no long diagonal is controlled', () => {
  const fen = '8/8/3BB3/8/4K3/8/8/4k3 w - - 0 1'
  const farther = scoreTwoBishopsWhiteMove(fen, 'Bc8')
  const nearer = scoreTwoBishopsWhiteMove(fen, 'Bf8')

  assert.equal(farther.ruleD9Applies, true)
  assert.equal(farther.ruleD9ShapePenalty, 0)
  assert.equal(nearer.ruleD9ShapePenalty, 0)
  assert.ok(
    farther.ruleD9BlackKingDistance > nearer.ruleD9BlackKingDistance,
  )
})

test('rule d20 scores Bc5 for controlling the central Black-side square', () => {
  const fen = '8/8/4k3/8/4K3/5B2/8/6B1 w - - 8 5'
  const bc5 = scoreTwoBishopsWhiteMove(fen, 'Bc5')

  assert.equal(bc5.ruleD20Applies, true)
  assert.equal(bc5.ruleD20Penalty, 0)
})

test("rule d12 prefers White's king off a controlled long diagonal", () => {
  const fen = '1B6/8/8/4K1k1/8/8/6B1/8 w - - 8 5'
  const staysClear = scoreTwoBishopsWhiteMove(fen, 'Ba7')
  const screensLongDiagonal = scoreTwoBishopsWhiteMove(fen, 'Ke4')

  assert.equal(staysClear.ruleD18Applies, true)
  assert.equal(staysClear.ruleD18Penalty, 0)
  assert.equal(screensLongDiagonal.ruleD18Penalty, 1)
})

test('rule d12 is inactive when both long diagonals are controlled', () => {
  const fen = '8/3k4/8/3B4/3BK3/8/8/8 w - - 4 3'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Be5').ruleD18Applies, false)
})

test('rule d25 scores the resulting long-diagonal bishop beside the central king', () => {
  const fen = '6B1/8/3k4/8/4K3/8/1B6/8 w - - 10 6'
  const bd4 = scoreTwoBishopsWhiteMove(fen, 'Bd4')
  const bh7 = scoreTwoBishopsWhiteMove(fen, 'Bh7')

  assert.equal(bd4.ruleD25Applies, true)
  assert.equal(bd4.ruleD25Penalty, 0)
  assert.equal(bh7.ruleD25Penalty, 1)
})

test('rule d25 does not require moving an already-adjacent long-diagonal bishop', () => {
  const fen = '8/8/8/8/1B1KB1k1/8/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bd5').ruleD25Penalty, 0)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kd3').ruleD25Penalty, 0)
})

test('rule c10 is ordered before the later rule c12', () => {
  assert.ok(
    twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule c10') <
      twoBishopsWhiteRules.findIndex(({ id }) => id === 'rule c12'),
  )
})

test('rule c12 treats the loaded b2 position as Black on track', () => {
  const fen = '8/8/8/3BBK2/7k/8/8/8 w - - 0 1'

  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7').ruleC12Applies, true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bf7').ruleC12Penalty, 0)
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

test('rule c12 does not invent a retreat square off the king track', () => {
  const fen = '8/8/4BB2/7k/8/4K3/8/8 w - - 18 10'
  const bg7 = scoreTwoBishopsWhiteMove(fen, 'Bg7')

  assert.equal(bg7.ruleC12Applies, false)
})

test('rule c11 prefers moves whose every Black reply stays on the edge', () => {
  const fen = '8/1B6/8/5K2/7k/4B3/8/8 w - - 10 6'
  const forcesEdge = scoreTwoBishopsWhiteMove(fen, 'Bf2+')
  const allowsKg3 = scoreTwoBishopsWhiteMove(fen, 'Bg2')

  assert.equal(forcesEdge.ruleC11Applies, true)
  assert.equal(forcesEdge.ruleC11Penalty, 0)
  assert.equal(allowsKg3.ruleC11Applies, true)
  assert.equal(allowsKg3.ruleC11Penalty, 1)
  assert.equal(getIdealTwoBishopsWhiteMoves(fen).includes('Bg2'), false)
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

test('rule c08 takes opposition when the double retreat square is controlled', () => {
  const fen = '6B1/6B1/8/5K2/7k/8/8/8 w - - 0 1'
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Kf4')
  const avoidsOpposition = scoreTwoBishopsWhiteMove(fen, 'Be5')

  assert.equal(takesOpposition.ruleC08Applies, true)
  assert.equal(takesOpposition.ruleC08Penalty, 0)
  assert.equal(avoidsOpposition.ruleC08Applies, true)
  assert.equal(avoidsOpposition.ruleC08Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf4'])
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

test('rule c9 controls the flank square when Black is one ahead on track', () => {
  const fen = '6B1/6B1/8/8/5K2/7k/8/8 w - - 0 1'
  const controlsG2 = scoreTwoBishopsWhiteMove(fen, 'Bd5')
  const missesG2 = scoreTwoBishopsWhiteMove(fen, 'Kf3')

  assert.equal(controlsG2.ruleC9Applies, true)
  assert.equal(controlsG2.ruleC9Penalty, 0)
  assert.equal(missesG2.ruleC9Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bd5'])
})

test('rule c9 lets later rules refine existing flank control to Be6', () => {
  const fen = '8/5B2/8/8/3B4/5K2/7k/8 w - - 22 12'

  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Be6'])
})

test('rule c7.5 checks with Black one behind track and four squares from the corner', () => {
  const fen = '1B6/8/8/3B4/8/3K4/8/4k3 w - - 4 3'
  const checks = scoreTwoBishopsWhiteMove(fen, 'Bg3+')
  const takesOpposition = scoreTwoBishopsWhiteMove(fen, 'Ke3')

  assert.equal(checks.ruleC075Applies, true)
  assert.equal(checks.ruleC075Penalty, 0)
  assert.equal(takesOpposition.ruleC075Applies, true)
  assert.equal(takesOpposition.ruleC075Penalty, 1)
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg3+'])
})
