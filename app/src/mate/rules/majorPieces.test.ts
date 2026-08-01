import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  getChess,
  positionKey,
  SQUARE_TRANSFORMS,
  transformFen,
} from '../chess'
import {
  compareQueenBlackScores,
  compareQueenWhiteScores,
  compareRookBlackScores,
  compareRookWhiteScores,
  getMateRuleSet,
  getQueenTwoSquareCage,
  getRookBoxFromFen,
  queenRuleSet,
  queenWhiteRules,
  rookRuleSet,
  rookWhiteRules,
  scoreQueenBlackMove,
  scoreQueenWhiteMove,
  scoreRookBlackMove,
  scoreRookWhiteMove,
  selectIdealMoves,
} from './index'

type WhiteFixture = {
  readonly fen: string
  readonly idealMoves: readonly string[]
  readonly hint: string
  readonly phase: '1/2' | '2/2'
}

const QUEEN_WHITE_FIXTURES: readonly WhiteFixture[] = [
  {
    fen: '7k/5K2/8/8/8/8/8/1Q6 w - - 0 1',
    idealMoves: ['Qh1#'],
    hint: 'mate',
    phase: '1/2',
  },
  {
    fen: '8/8/8/8/4k3/8/8/3QK3 w - - 0 1',
    idealMoves: ['Qd2'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '7k/8/8/6Q1/8/5K2/8/8 w - - 0 1',
    idealMoves: ['Kg4'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/8/6K1/8/4Q3/6k1/8 w - - 6 4',
    idealMoves: ['Kg4'],
    hint: 'king closer',
    phase: '1/2',
  },
  {
    fen: '8/8/4K3/2Q5/8/1k6/8/8 w - - 2 2',
    idealMoves: ['Kd5'],
    hint: 'king closer',
    phase: '1/2',
  },
  {
    fen: '7k/4Q3/4K3/8/8/8/8/8 w - - 18 10',
    idealMoves: ['Kf6'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/K7/8/3k4/Q7/8/8 w - - 0 1',
    idealMoves: ['Qb3'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '8/8/3K4/8/8/4k3/7Q/8 w - - 0 1',
    idealMoves: ['Qh4'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '8/8/3K4/5Q2/8/4k3/8/8 w - - 14 8',
    idealMoves: ['Qg4'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '5Q2/8/8/8/1K6/8/2k5/8 w - - 0 1',
    idealMoves: ['Qf3'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '8/8/5k2/3Q4/6K1/8/8/8 w - - 6 4',
    idealMoves: ['Kf4'],
    hint: 'king closer',
    phase: '1/2',
  },
  {
    fen: '8/7k/5Q2/5K2/8/8/8/8 w - - 20 11',
    idealMoves: ['Qg5'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '8/8/8/8/8/K7/2Q5/k7 w - - 0 1',
    idealMoves: ['Qa2#'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '6k1/4Q3/8/8/8/5K2/8/8 w - - 0 1',
    idealMoves: ['Kg4'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: 'k7/8/8/1Q6/2K5/8/8/8 w - - 6 4',
    idealMoves: ['Kc5'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '7k/8/8/6Q1/5K2/8/8/8 w - - 6 4',
    idealMoves: ['Kf5'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '4K2k/4Q3/8/8/8/8/8/8 w - - 10 6',
    idealMoves: ['Kd7'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/4k3/8/8/3Q4/1K6/8 w - - 0 1',
    idealMoves: ['Qb5'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '6KQ/8/3k4/8/8/8/8/8 w - - 0 1',
    idealMoves: ['Qf6+'],
    hint: 'corner cage',
    phase: '1/2',
  },
  {
    fen: '8/8/8/1Q6/1K6/8/1k6/8 w - - 0 1',
    idealMoves: ['Qd3'],
    hint: 'corner cage',
    phase: '1/2',
  },
]

const ROOK_WHITE_FIXTURES: readonly WhiteFixture[] = [
  {
    fen: '7k/5K2/8/8/8/8/8/R7 w - - 0 1',
    idealMoves: ['Rh1#'],
    hint: 'mate',
    phase: '1/2',
  },
  {
    fen: '2R5/8/8/8/6K1/4k3/8/8 w - - 0 1',
    idealMoves: ['Rd8'],
    hint: 'bring king',
    phase: '1/2',
  },
  {
    fen: '8/2k5/8/8/7R/3K4/8/8 w - - 2 2',
    idealMoves: ['Rd4'],
    hint: 'build box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/8/8/2k4K/7R w - - 0 1',
    idealMoves: ['Kg2'],
    hint: 'bring king',
    phase: '1/2',
  },
  {
    fen: '1R3K2/8/8/8/8/8/8/7k w - - 0 1',
    idealMoves: ['Kg7'],
    hint: 'bring king',
    phase: '1/2',
  },
  {
    fen: '5R2/8/8/8/8/8/4k1K1/8 w - - 6 4',
    idealMoves: ['Rf3'],
    hint: 'build box',
    phase: '2/2',
  },
  {
    fen: '6k1/8/8/8/8/2R5/8/2K5 w - - 0 1',
    idealMoves: ['Rc7'],
    hint: 'build box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/4R3/3k4/8/4K3 w - - 0 1',
    idealMoves: ['Rg4', 'Ra4'],
    hint: 'bring king',
    phase: '1/2',
  },
  {
    fen: '8/8/8/8/R7/K7/8/k7 w - - 0 1',
    idealMoves: ['Rh4'],
    hint: 'bring king',
    phase: '1/2',
  },
  {
    fen: '8/8/8/8/4K3/7R/3k4/8 w - - 14 8',
    idealMoves: ['Rg3'],
    hint: 'rook waiting move',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/8/5K1k/6R1/8 w - - 10 6',
    idealMoves: ['Ra2'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/K7/7R/k7/8 w - - 0 1',
    idealMoves: ['Rc3'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/2k5/R7/1K6/8/8/8/8 w - - 2 2',
    idealMoves: ['Kc5'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/2k5/1R6/2K5/8 w - - 4 3',
    idealMoves: ['Rd3'],
    hint: 'build box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/4k3/R7/3K4/8/8 w - - 30 16',
    idealMoves: ['Rd4'],
    hint: 'build box',
    phase: '2/2',
  },
  {
    fen: '8/8/4k3/R7/3K4/8/8/8 w - - 46 24',
    idealMoves: ['Rb5'],
    hint: 'rook waiting move',
    phase: '2/2',
  },
  {
    fen: '8/8/2k5/R7/1K6/8/8/8 w - - 50 26',
    idealMoves: ['Kc4'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/8/3k4/1K6/8/8/8/2R5 w - - 6 4',
    idealMoves: ['Rc5'],
    hint: 'build box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/1K6/3k4/8/8/2R5 w - - 6 4',
    idealMoves: ['Re1'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/1K6/3k4/8/8/8/8/2R5 w - - 10 6',
    idealMoves: ['Re1'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/5k2/7R/6K1/8/8/8/8 w - - 2 2',
    idealMoves: ['Kf5'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/7k/1R6/5K2/8/8/8/8 w - - 4 3',
    idealMoves: ['Rg6'],
    hint: 'build box',
    phase: '2/2',
  },
  {
    fen: '7k/8/R7/6K1/8/8/8/8 w - - 0 1',
    idealMoves: ['Kg6'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/8/k7/2R5/4K3/8/8/8 w - - 2 2',
    idealMoves: ['Kd5'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '6k1/8/7R/5K2/8/8/8/8 w - - 0 1',
    idealMoves: ['Kf6'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/2K5/2R5/8/1k6 w - - 0 1',
    idealMoves: ['Kb3'],
    hint: 'bring king',
    phase: '2/2',
  },
  {
    fen: '7k/R7/5K2/8/8/8/8/8 w - - 2 2',
    idealMoves: ['Kg6'],
    hint: 'bring king',
    phase: '2/2',
  },
]

const QUEEN_BLACK_FIXTURES = [
  {
    fen: '8/8/8/8/3kQ3/8/8/4K3 b - - 0 1',
    moves: ['Kc5', 'Kxe4', 'Kc3'],
    idealMoves: ['Kxe4'],
  },
  {
    fen: '8/8/8/8/3k4/8/8/3QK3 b - - 0 1',
    moves: ['Kc5', 'Ke5', 'Ke4', 'Ke3', 'Kc3', 'Kc4'],
    idealMoves: ['Ke5', 'Ke4'],
  },
  {
    fen: '8/5k2/3Q4/8/8/8/8/5K2 b - - 3 2',
    moves: ['Ke8', 'Kg8', 'Kg7'],
    idealMoves: ['Kg7'],
  },
] as const

const ROOK_BLACK_FIXTURES = [
  {
    fen: '8/8/8/8/3kR3/8/8/4K3 b - - 0 1',
    moves: ['Kc5', 'Kd5', 'Kxe4', 'Kd3', 'Kc3'],
    idealMoves: ['Kxe4'],
  },
  {
    fen: '8/8/8/8/3k4/8/5K2/4R3 b - - 5 3',
    moves: ['Kc5', 'Kd5', 'Kd3', 'Kc3', 'Kc4'],
    idealMoves: ['Kd3'],
  },
  {
    fen: '3k4/8/4R3/8/2K5/8/8/8 b - - 11 6',
    moves: ['Kd7', 'Kc7', 'Kc8'],
    idealMoves: ['Kd7'],
  },
  {
    fen: '8/4k3/R7/2K5/8/8/8/8 b - - 13 7',
    moves: ['Kd8', 'Ke8', 'Kf8', 'Kf7', 'Kd7'],
    idealMoves: ['Kd7'],
  },
  {
    fen: '8/8/4k3/8/3R4/4K3/8/8 b - - 0 1',
    moves: ['Ke7', 'Kf7', 'Kf6', 'Kf5', 'Ke5'],
    idealMoves: ['Ke5'],
  },
  {
    fen: '8/8/4k3/8/2R5/4K3/8/8 b - - 0 1',
    moves: ['Kd7', 'Ke7', 'Kf7', 'Kf6', 'Kf5', 'Ke5', 'Kd5', 'Kd6'],
    idealMoves: ['Kd5'],
  },
  {
    fen: '8/8/8/8/8/3k4/5R2/4K3 b - - 0 1',
    moves: ['Kc4', 'Kd4', 'Ke4', 'Ke3', 'Kc3'],
    idealMoves: ['Ke3'],
  },
] as const

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. Moves tied at one priority remain candidates for the next priority."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

test('queen and rook preserve evaluator order with universal priority labels', () => {
  assert.deepEqual(
    queenWhiteRules.map(({ id }) => id),
    [
      'mate',
      'queen safe',
      'no stalemate',
      'corner cage',
      'queen knight move',
      'king closer',
    ],
  )
  assert.deepEqual(
    rookWhiteRules.map(({ id }) => id),
    [
      'mate',
      'rook safe',
      'no stalemate',
      'rook box',
      'waiting move',
      'king closer',
    ],
  )
  assert.deepEqual(
    queenWhiteRules.map(({ shortLabel }) => shortLabel),
    [
      'mate',
      'pieces safe',
      'no stalemate',
      'corner cage',
      "knight's move away",
      'king closer',
    ],
  )
  assert.deepEqual(
    rookWhiteRules.map(({ shortLabel }) => shortLabel),
    [
      'mate',
      'pieces safe',
      'no stalemate',
      'rook box',
      'waiting move',
      'king closer',
    ],
  )
  assert.deepEqual(
    queenWhiteRules.slice(3).map(({ id, shortLabel, helpText }) => ({
      id,
      shortLabel,
      helpText,
    })),
    [
      {
        id: 'corner cage',
        shortLabel: 'corner cage',
        helpText:
          'Move the queen to shrink Black’s box toward a fixed corner. Keep White’s king outside and leave Black at least two safe squares.',
      },
      {
        id: 'queen knight move',
        shortLabel: "knight's move away",
        helpText:
          "Keep the queen a knight's move from Black without moving onto the edge, preferring shorter moves.",
      },
      {
        id: 'king closer',
        shortLabel: 'king closer',
        helpText:
          "Move White's king closer to Black without crossing the tighter side of the queen's box or moving onto the edge.",
      },
    ],
  )
  assert.equal(
    queenWhiteRules.find(({ id }) => id === 'king closer')?.helpText,
    "Move White's king closer to Black without crossing the tighter side of the queen's box or moving onto the edge.",
  )
  assert.equal(
    rookWhiteRules.some(({ id }) => id === 'finish guarantee'),
    false,
  )
  assert.equal(
    rookWhiteRules.every(
      ({ shortLabel }) => shortLabel === shortLabel.toLowerCase(),
    ),
    true,
  )
  assert.deepEqual(
    rookWhiteRules
      .slice(3)
      .map(({ shortLabel, helpText }) => ({
        shortLabel,
        helpText,
      })),
    [
      {
        shortLabel: 'rook box',
        helpText:
          'Create, keep, and shrink Black’s box against the board edge. Move an attacked rook as far away as the box allows. If no box is possible, move the rook as far from Black as possible.',
      },
      {
        shortLabel: 'waiting move',
        helpText:
          "When the kings are a knight's move apart, or every box shrink hangs the rook, keep the box and move the rook, as far from Black as possible, but closer to White's king, but not touching White's king.",
      },
      {
        shortLabel: 'king closer',
        helpText:
          "Move White's king closer to Black's king, preferably without taking opposition.",
      },
    ],
  )
  assert.equal(queenRuleSet.help.title, 'How best moves are chosen')
  assert.equal(queenRuleSet.help.whiteIntro, WHITE_INTRO)
  assert.equal(queenRuleSet.help.blackIntro, BLACK_INTRO)
  assert.equal(rookRuleSet.help.blackIntro, BLACK_INTRO)
  assert.deepEqual(queenRuleSet.help.blackPriorities, [
    'Return to the previous board position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Move toward the center.',
  ])
  assert.deepEqual(rookRuleSet.help.blackPriorities, [
    'Return to the previous board position when possible.',
    "Take a piece if White isn't looking.",
    'Move toward the nearest box wall.',
    'If the rook is diagonally beside White’s king, move toward it.',
    'Avoid giving White opposition.',
    'Move toward the rook.',
  ])
  assert.deepEqual(queenRuleSet.help.notes, [])
  assert.deepEqual(
    queenRuleSet.help.noteBoards.map(({ id }) => id),
    ['queen-phase-two-corner-cage'],
  )
  assert.deepEqual(rookRuleSet.help.notes, [])
  assert.deepEqual(
    rookRuleSet.help.noteBoards.map(({ id }) => id),
    ['rook-phase-two-box'],
  )

  const registeredQueen = getMateRuleSet('queen')
  const registeredRook = getMateRuleSet('rook')
  assert.deepEqual(registeredQueen.help, queenRuleSet.help)
  assert.deepEqual(registeredRook.help, rookRuleSet.help)
  assert.deepEqual(
    registeredQueen.whiteRuleDescriptions.map(({ id }) => id),
    [
      'mate',
      'queen safe',
      'no stalemate',
      'corner cage',
      'queen knight move',
      'king closer',
    ],
  )
  assert.deepEqual(
    registeredRook.whiteRuleDescriptions.map(({ id }) => id),
    [
      'mate',
      'rook safe',
      'no stalemate',
      'rook box',
      'waiting move',
      'king closer',
    ],
  )
})

test('queen facade matches every focused literal white fixture', () => {
  const queen = getMateRuleSet('queen')

  for (const fixture of QUEEN_WHITE_FIXTURES) {
    assert.deepEqual(queen.idealWhiteMoves(fixture.fen), fixture.idealMoves)
    assert.equal(queen.currentWhiteHint(fixture.fen)?.id, fixture.hint)
    assert.equal(queen.phase(fixture.fen), fixture.phase)
  }

  const incorrectFen = '8/8/4k3/8/8/3Q4/1K6/8 w - - 0 1'
  assert.equal(
    queen.explainWhiteMove(incorrectFen, 'Qa6+')?.id,
    'corner cage',
  )
  assert.equal(
    queen.explainWhiteMove(incorrectFen, 'Qd4')?.id,
    'corner cage',
  )
})

test('queen white score fields and compound comparisons match literals', () => {
  const edgeFen = '8/8/8/8/8/8/1K1k4/7Q w - - 0 1'
  const offEdge = scoreQueenWhiteMove(edgeFen, 'Qf3')
  const edgeKnight = scoreQueenWhiteMove(edgeFen, 'Qf1')
  assert.equal(offEdge.queenPlacementPenalty, 0)
  assert.equal(edgeKnight.queenPlacementPenalty, 1)
  assert.equal(offEdge.cageMovePenalty, 1)
  assert.equal(edgeKnight.cageMovePenalty, 0)
  assert.ok(compareQueenWhiteScores(edgeKnight, offEdge) < 0)

  const boxFen = '8/8/8/8/4k3/8/8/3QK3 w - - 0 1'
  const longerMove = scoreQueenWhiteMove(boxFen, 'Qd6')
  const shorterMove = scoreQueenWhiteMove(boxFen, 'Qd2')
  assert.equal(longerMove.queenPlacementPenalty, 0)
  assert.equal(shorterMove.queenPlacementPenalty, 0)
  assert.equal(longerMove.cageWhiteKingPenalty, 1)
  assert.equal(shorterMove.cageWhiteKingPenalty, 0)
  assert.ok(longerMove.cageLongerSide < shorterMove.cageLongerSide)
  assert.ok(compareQueenWhiteScores(shorterMove, longerMove) < 0)
})

test('queen cage is measured from the Queen to Black’s corner everywhere', () => {
  const fen = '5Q2/8/8/8/1K6/8/2k5/8 w - - 0 1'
  const shrink = scoreQueenWhiteMove(fen, 'Qf3')
  const unchanged = scoreQueenWhiteMove(fen, 'Kc4')
  const oneSquareMate = scoreQueenWhiteMove(
    '8/8/8/8/8/K7/2Q5/k7 w - - 0 1',
    'Qb2#',
  )

  assert.equal(shrink.cageMinimumSafeSquaresPenalty, 0)
  assert.equal(unchanged.cageMinimumSafeSquaresPenalty, 0)
  assert.equal(oneSquareMate.cageMinimumSafeSquaresPenalty, 1)
  assert.equal(oneSquareMate.matePenalty, 0)
  assert.deepEqual(
    {
      shorterSide: shrink.cageShorterSide,
      longerSide: shrink.cageLongerSide,
    },
    { shorterSide: 2, longerSide: 5 },
  )
  assert.deepEqual(
    {
      shorterSide: unchanged.cageShorterSide,
      longerSide: unchanged.cageLongerSide,
    },
    { shorterSide: 5, longerSide: 7 },
  )
  assert.ok(compareQueenWhiteScores(shrink, unchanged) < 0)
  assert.deepEqual(getMateRuleSet('queen').idealWhiteMoves(fen), ['Qf3'])
  assert.equal(
    getMateRuleSet('queen').currentWhiteHint(fen)?.id,
    'corner cage',
  )
  assert.deepEqual(
    getMateRuleSet('queen').idealWhiteMoves(
      '8/8/8/8/8/K7/2Q5/k7 w - - 0 1',
    ),
    ['Qa2#'],
  )
})

test('queen corner cage rejects switching target corners to get a smaller box', () => {
  const fen = '8/8/8/8/K2k4/8/2Q5/8 w - - 0 1'
  const switchesCorner = scoreQueenWhiteMove(fen, 'Qc6')
  const keepsCorner = scoreQueenWhiteMove(fen, 'Kb4')

  assert.equal(switchesCorner.cageMovePenalty, 1)
  assert.equal(keepsCorner.cageMovePenalty, 0)
  assert.ok(compareQueenWhiteScores(keepsCorner, switchesCorner) < 0)
  assert.deepEqual(getMateRuleSet('queen').idealWhiteMoves(fen), ['Kb4'])
  assert.equal(
    getMateRuleSet('queen').explainWhiteMove(fen, 'Qc6')?.id,
    'corner cage',
  )
})

test('queen corner cage accepts a narrower same-corner box when its longer side grows', () => {
  const fen = '3k4/8/2Q5/2K5/8/8/8/8 w - - 0 1'
  const narrowsToEdge = scoreQueenWhiteMove(fen, 'Qb7')
  const preservesBox = scoreQueenWhiteMove(fen, 'Kb6')

  assert.equal(narrowsToEdge.cageMovePenalty, 0)
  assert.equal(narrowsToEdge.cageShorterSide, 1)
  assert.equal(narrowsToEdge.cageLongerSide, 6)
  assert.equal(preservesBox.cageShorterSide, 2)
  assert.equal(preservesBox.cageLongerSide, 5)
  assert.ok(compareQueenWhiteScores(narrowsToEdge, preservesBox) < 0)
  assert.deepEqual(getMateRuleSet('queen').idealWhiteMoves(fen), ['Qb7'])
  assert.equal(
    getMateRuleSet('queen').currentWhiteHint(fen)?.id,
    'corner cage',
  )
})

test("queen corner cage does not enclose White's king", () => {
  const fen = '6KQ/8/3k4/8/8/8/8/8 w - - 0 1'
  const enclosed = scoreQueenWhiteMove(fen, 'Qh5')
  const outside = scoreQueenWhiteMove(fen, 'Qf6+')

  assert.equal(enclosed.cageWhiteKingPenalty, 1)
  assert.equal(outside.cageWhiteKingPenalty, 0)
  assert.ok(compareQueenWhiteScores(outside, enclosed) < 0)
  assert.deepEqual(getMateRuleSet('queen').idealWhiteMoves(fen), ['Qf6+'])
  assert.equal(
    getMateRuleSet('queen').explainWhiteMove(fen, 'Qh5')?.id,
    'corner cage',
  )

  const formerCycleFen = '8/8/8/8/1KQ5/8/8/k7 w - - 2 2'
  const wallEnclosesKing = scoreQueenWhiteMove(formerCycleFen, 'Qb5')
  const leavesKingOutside = scoreQueenWhiteMove(formerCycleFen, 'Qe2')
  assert.equal(wallEnclosesKing.cageWhiteKingPenalty, 1)
  assert.equal(leavesKingOutside.cageWhiteKingPenalty, 0)
  assert.deepEqual(
    getMateRuleSet('queen').idealWhiteMoves(formerCycleFen),
    ['Qe2'],
  )
  assert.equal(
    getMateRuleSet('queen').explainWhiteMove(formerCycleFen, 'Qb5')?.id,
    'corner cage',
  )
})

test('queen policy prefers shorter Queen moves within the placement rule', () => {
  const fen = '8/8/8/8/4k3/8/8/3QK3 w - - 0 1'
  const longer = scoreQueenWhiteMove(fen, 'Qd6')
  const shorter = scoreQueenWhiteMove(fen, 'Qd2')
  const nonPlacementShorter = scoreQueenWhiteMove(fen, 'Qd3')
  const nonPlacementLonger = scoreQueenWhiteMove(fen, 'Qd5')

  assert.equal(longer.queenMoveDistance, 5)
  assert.equal(shorter.queenMoveDistance, 1)
  const placementRule = queenWhiteRules.find(
    ({ id }) => id === 'queen knight move',
  )!
  assert.deepEqual(
    selectIdealMoves(
      [
        { san: 'Qd6', score: longer },
        { san: 'Qd2', score: shorter },
      ],
      [placementRule],
    ),
    ['Qd2'],
  )
  assert.equal(nonPlacementShorter.queenPlacementPenalty, 1)
  assert.equal(nonPlacementLonger.queenPlacementPenalty, 1)
  assert.deepEqual(
    selectIdealMoves(
      [
        { san: 'Qd3', score: nonPlacementShorter },
        { san: 'Qd5', score: nonPlacementLonger },
      ],
      [placementRule],
    ),
    ['Qd3', 'Qd5'],
  )

  const mixedFen = '8/8/8/8/4k3/8/3Q4/4K3 w - - 0 1'
  const onlyQueenMove = scoreQueenWhiteMove(mixedFen, 'Qd6')
  const kingMove = scoreQueenWhiteMove(mixedFen, 'Kf2')
  assert.equal(onlyQueenMove.queenPlacementPenalty, 0)
  assert.equal(kingMove.queenPlacementPenalty, 0)
  assert.deepEqual(
    selectIdealMoves(
      [
        { san: 'Qd6', score: onlyQueenMove },
        { san: 'Kf2', score: kingMove },
      ],
      [placementRule],
    ),
    ['Qd6', 'Kf2'],
  )
  assert.equal(
    queenWhiteRules.some(({ id }) => id === 'shorter queen move'),
    false,
  )
})

test('queen king proximity uses king moves then row-plus-file distance', () => {
  const fen = '8/8/8/4k3/8/8/8/1K5Q w - - 0 1'
  const fartherByRowAndFile = scoreQueenWhiteMove(fen, 'Kb2')
  const closerByRowAndFile = scoreQueenWhiteMove(fen, 'Kc2')

  assert.equal(fartherByRowAndFile.kingDistance, 3)
  assert.equal(closerByRowAndFile.kingDistance, 3)
  assert.equal(fartherByRowAndFile.kingManhattanDistance, 6)
  assert.equal(closerByRowAndFile.kingManhattanDistance, 5)
  assert.equal(
    compareQueenWhiteScores(closerByRowAndFile, fartherByRowAndFile),
    -1,
  )
})

test('queen king proximity allows the wider rank channel in a 3-by-1 box', () => {
  const fen = '8/k7/8/1QK5/8/8/8/8 w - - 2 2'
  const awayFromSupport = scoreQueenWhiteMove(fen, 'Kb4')
  const towardSupport = scoreQueenWhiteMove(fen, 'Kc6')

  assert.equal(awayFromSupport.whiteKingBetweenPiecesPenalty, 0)
  assert.equal(towardSupport.whiteKingBetweenPiecesPenalty, 0)
  assert.equal(towardSupport.kingDistance, 2)
  assert.equal(awayFromSupport.kingDistance, 3)
  const kingRule = queenWhiteRules.find(({ id }) => id === 'king closer')!
  assert.deepEqual(
    selectIdealMoves(
      [
        { san: 'Kb4', score: awayFromSupport },
        { san: 'Kc6', score: towardSupport },
      ],
      [kingRule],
    ),
    ['Kc6'],
  )
})

test('queen cage, safety, and stalemate match literals', () => {
  assert.deepEqual(
    getQueenTwoSquareCage(
      '6k1/4Q3/8/8/8/5K2/8/8 w - - 0 1',
      'b',
    ),
    { corner: 'h8', pair: ['h8', 'g8'] },
  )
  assert.equal(
    getQueenTwoSquareCage('1k6/2QK4/8/8/8/8/8/8 b - - 3 2'),
    null,
  )

  const cageFen = '6k1/4Q3/8/8/8/5K2/8/8 w - - 0 1'
  for (const san of getMateRuleSet('queen').idealWhiteMoves(cageFen)) {
    const cageChess = getChess(cageFen)
    const move = cageChess.move(san)
    assert.equal(move.piece, 'k')
  }

  for (const fen of [
    '8/8/8/8/4k3/8/8/3QK3 w - - 0 1',
    '8/8/8/8/8/K7/2Q5/k7 w - - 0 1',
  ]) {
    for (const san of getMateRuleSet('queen').idealWhiteMoves(fen)) {
      const chess = getChess(fen)
      chess.move(san)
      assert.equal(chess.isStalemate(), false)
      assert.equal(
        chess
          .moves({ verbose: true })
          .some((move) => move.captured === 'q'),
        false,
      )
    }
  }

})

test('queen same-corner cage and safe-square minimum break former cycles', () => {
  const queen = getMateRuleSet('queen')
  const edgeCycleFen = '8/7k/5Q2/5K2/8/8/8/8 w - - 20 11'
  assert.deepEqual(queen.idealWhiteMoves(edgeCycleFen), ['Qg5'])
  assert.equal(queen.idealWhiteMoves(edgeCycleFen).includes('Qg6+'), false)

  const cornerCycleFen = '8/k7/8/1QK5/8/8/8/8 w - - 0 1'
  const rejectedCheck = scoreQueenWhiteMove(cornerCycleFen, 'Qb6+')
  assert.equal(rejectedCheck.cageSafeSquareCount, 1)
  assert.equal(rejectedCheck.cageMinimumSafeSquaresPenalty, 1)
  assert.deepEqual(queen.idealWhiteMoves(cornerCycleFen), ['Kc6'])
  assert.equal(queen.explainWhiteMove(cornerCycleFen, 'Qb6+')?.id, 'corner cage')
})

test('queen advances by the displayed geometric rules', () => {
  const queen = getMateRuleSet('queen')
  const bringKingFen = '8/8/8/8/1k6/8/2Q5/K7 w - - 0 1'
  const shrinkFen = '2k5/8/1Q6/3K4/8/8/8/8 w - - 2 2'

  assert.deepEqual(queen.idealWhiteMoves(bringKingFen), ['Kb1'])
  assert.deepEqual(queen.idealWhiteMoves(shrinkFen), ['Qa7'])
  assert.equal(
    queen.explainWhiteMove(shrinkFen, 'Qa7')?.id,
    'corner cage',
  )
})

test('queen production cage uses rectangle dimensions, not edge-only segments', () => {
  const source = readFileSync(
    new URL('./majorPieces.ts', import.meta.url),
    'utf8',
  )
  const queenSource = source.slice(
    source.indexOf('export function scoreQueenWhiteMove'),
    source.indexOf('export const queenWhiteRules'),
  )

  assert.match(queenSource, /getQueenBoxDimensions/)
  assert.doesNotMatch(queenSource, /getQueenEdgeCageSize|edgeCageSize/)
})

test('queen black scoring and literal defensive choices retain legal order', () => {
  const fen = '8/8/8/8/3k4/8/8/3QK3 b - - 0 1'
  const side = scoreQueenBlackMove(fen, 'Kc5')
  const center = scoreQueenBlackMove(fen, 'Ke5')
  assert.deepEqual(side, { captureQueenPenalty: 1, centerDistance: 1 })
  assert.deepEqual(center, { captureQueenPenalty: 1, centerDistance: 0 })
  assert.equal(compareQueenBlackScores(center, side), -1)

  const queen = getMateRuleSet('queen')
  for (const fixture of QUEEN_BLACK_FIXTURES) {
    assert.deepEqual(queen.blackCandidates(fixture.fen), {
      moves: fixture.moves,
      idealMoves: fixture.idealMoves,
    })
  }
})

test('rook board strategy selects and explains representative stages', () => {
  const rook = getMateRuleSet('rook')
  const fixtures = [
    {
      fen: '7k/5K2/8/8/8/8/8/R7 w - - 0 1',
      moves: ['Rh1#'],
      hint: 'mate',
    },
    {
      fen: '8/8/8/8/8/2K5/2R5/1k6 w - - 36 19',
      moves: ['Rh2'],
      hint: 'waiting move',
    },
    {
      fen: '8/5R2/8/4K3/8/7k/8/8 w - - 0 1',
      moves: ['Rg7'],
      hint: 'rook box',
    },
    {
      fen: '8/8/8/6K1/6R1/7k/8/8 w - - 2 2',
      moves: ['Ra4'],
      hint: 'waiting move',
    },
    {
      fen: '8/8/8/6K1/R7/8/7k/8 w - - 4 3',
      moves: ['Ra3'],
      hint: 'rook box',
    },
    {
      fen: '8/R4K1k/8/8/8/8/8/8 w - - 2 2',
      moves: ['Ra1'],
      hint: 'rook box',
    },
    {
      fen: '8/8/k7/2R5/4K3/8/8/8 w - - 2 2',
      moves: ['Rc1'],
      hint: 'waiting move',
    },
  ] as const

  for (const fixture of fixtures) {
    assert.deepEqual(rook.idealWhiteMoves(fixture.fen), fixture.moves)
    assert.equal(rook.currentWhiteHint(fixture.fen)?.id, fixture.hint)
  }
})

test('rook priorities are individually visible board comparisons', () => {
  const waitingFen = '8/8/8/8/8/2K5/2R5/1k6 w - - 36 19'
  const waiting = scoreRookWhiteMove(waitingFen, 'Rh2')
  const shorterWait = scoreRookWhiteMove(waitingFen, 'Re2')
  const earlyFinish = scoreRookWhiteMove(waitingFen, 'Kb3')
  const unsafeRetainedBox = scoreRookWhiteMove(waitingFen, 'Rc1+')
  assert.equal(waiting.keepBoxPenalty, 0)
  assert.equal(earlyFinish.keepBoxPenalty, 0)
  assert.equal(unsafeRetainedBox.keepBoxPenalty, 1)
  assert.equal(unsafeRetainedBox.rookCapturePenalty, 1)
  assert.equal(waiting.waitingMovePenalty, 0)
  assert.equal(shorterWait.waitingMovePenalty, 0)
  assert.ok(
    waiting.waitingMoveBlackDistanceScore <
      shorterWait.waitingMoveBlackDistanceScore,
  )
  assert.ok(
    earlyFinish.waitingMovePenalty > waiting.waitingMovePenalty,
  )
  assert.ok(compareRookWhiteScores(waiting, earlyFinish) < 0)

  const adjacentWaitFen =
    '8/8/8/8/8/k7/3R4/1K6 w - - 0 1'
  const adjacentWait = scoreRookWhiteMove(adjacentWaitFen, 'Rc2')
  assert.equal(adjacentWait.waitingMoveApplies, true)
  assert.equal(adjacentWait.waitingMovePenalty, 1)

  const farthestSquareFen =
    'R7/8/8/8/8/5K2/7k/8 w - - 2 2'
  const stepsBackInward = scoreRookWhiteMove(
    farthestSquareFen,
    'Ra7',
  )
  assert.equal(stepsBackInward.waitingMovePenalty, 0)

  const anyWallWaitFen = '8/8/8/6K1/6R1/7k/8/8 w - - 2 2'
  const farthestAnyWallWait = scoreRookWhiteMove(anyWallWaitFen, 'Ra4')
  const formerLoopMove = scoreRookWhiteMove(anyWallWaitFen, 'Rg1')
  assert.equal(farthestAnyWallWait.keepBoxPenalty, 0)
  assert.equal(farthestAnyWallWait.waitingMovePenalty, 0)
  assert.equal(formerLoopMove.keepBoxPenalty, 1)
  assert.equal(formerLoopMove.waitingMovePenalty, 1)
  assert.ok(
    compareRookWhiteScores(farthestAnyWallWait, formerLoopMove) < 0,
  )

  const strictShrinkFen = '8/8/8/6K1/R7/8/7k/8 w - - 4 3'
  const strictShrink = scoreRookWhiteMove(strictShrinkFen, 'Ra3')
  const sharedKingFile = scoreRookWhiteMove(strictShrinkFen, 'Rg4')
  assert.equal(strictShrink.shrinkBoxPenalty, 0)
  assert.equal(strictShrink.shrinkBoxRoom, 2)
  assert.equal(sharedKingFile.shrinkBoxPenalty, 1)
  assert.ok(compareRookWhiteScores(strictShrink, sharedKingFile) < 0)

  const squeezeFen = '8/5R2/8/4K3/8/7k/8/8 w - - 0 1'
  const squeeze = scoreRookWhiteMove(squeezeFen, 'Rg7')
  assert.equal(squeeze.shrinkBoxPenalty, 0)
  assert.equal(squeeze.shrinkBoxRoom, 1)

  const defendedAttackedRookFen =
    '8/6k1/7R/6K1/8/8/8/8 w - - 0 1'
  const farthestAttackedRookMove = scoreRookWhiteMove(
    defendedAttackedRookFen,
    'Ra6',
  )
  const nearestAttackedRookMove = scoreRookWhiteMove(
    defendedAttackedRookFen,
    'Rg6+',
  )
  assert.ok(
    farthestAttackedRookMove.rookBoxBlackDistanceScore <
      nearestAttackedRookMove.rookBoxBlackDistanceScore,
  )
  assert.deepEqual(
    getMateRuleSet('rook').idealWhiteMoves(defendedAttackedRookFen),
    ['Ra6'],
  )

  const dualWallFen = '8/7k/6R1/5K2/8/8/8/8 w - - 2 2'
  const keepsSmallestBox = scoreRookWhiteMove(dualWallFen, 'Rg1')
  const keepsOnlyLargerBox = scoreRookWhiteMove(dualWallFen, 'Ra6')
  assert.equal(keepsSmallestBox.keepBoxPenalty, 0)
  assert.equal(keepsOnlyLargerBox.keepBoxPenalty, 1)
  assert.deepEqual(
    getMateRuleSet('rook').idealWhiteMoves(dualWallFen),
    ['Rg1'],
  )

  const checkingSqueezeFen = '8/5k2/R7/5K2/8/8/8/8 w - - 2 2'
  const checkingSqueeze = scoreRookWhiteMove(checkingSqueezeFen, 'Ra7+')
  const staticWall = scoreRookWhiteMove(checkingSqueezeFen, 'Rb6')
  assert.equal(checkingSqueeze.keepBoxPenalty, 0)
  assert.equal(checkingSqueeze.shrinkBoxPenalty, 0)
  assert.equal(checkingSqueeze.shrinkBoxRoom, 1)
  assert.equal(staticWall.keepBoxPenalty, 0)
  assert.equal(staticWall.shrinkBoxPenalty, 1)
  assert.deepEqual(
    getMateRuleSet('rook').idealWhiteMoves(checkingSqueezeFen),
    ['Ra7+'],
  )
  const afterSqueeze = getChess(checkingSqueezeFen)
  afterSqueeze.move('Ra7+')
  assert.deepEqual(afterSqueeze.moves(), ['Ke8', 'Kf8', 'Kg8'])
  for (const blackSan of afterSqueeze.moves()) {
    const reply = getChess(afterSqueeze.fen())
    reply.move(blackSan)
    assert.equal(getRookBoxFromFen(reply.fen()).size, 1)
  }

  const differentEdgeFen =
    '8/2k5/8/4K3/8/8/8/3R4 w - - 14 8'
  const keepsWestWall = scoreRookWhiteMove(differentEdgeFen, 'Ke6')
  const addsNorthWall = scoreRookWhiteMove(differentEdgeFen, 'Rd6')
  assert.equal(keepsWestWall.keepBoxPenalty, 0)
  assert.equal(keepsWestWall.shrinkBoxPenalty, 1)
  assert.equal(addsNorthWall.keepBoxPenalty, 0)
  assert.equal(addsNorthWall.shrinkBoxPenalty, 1)
  assert.deepEqual(
    getMateRuleSet('rook').idealWhiteMoves(differentEdgeFen),
    ['Ke6'],
  )
  assert.equal(
    getMateRuleSet('rook').currentWhiteHint(differentEdgeFen)?.id,
    'king closer',
  )

  const safeShrinkFen = '3k4/8/7R/2K5/8/8/8/8 w - - 0 1'
  const safeShrink = scoreRookWhiteMove(safeShrinkFen, 'Rh7')
  const concealedVetoMove = scoreRookWhiteMove(safeShrinkFen, 'Kd5')
  assert.equal(safeShrink.keepBoxPenalty, 0)
  assert.equal(safeShrink.shrinkBoxPenalty, 0)
  assert.equal(safeShrink.shrinkBoxRoom, 1)
  assert.equal(concealedVetoMove.shrinkBoxPenalty, 1)
  assert.deepEqual(
    getMateRuleSet('rook').idealWhiteMoves(safeShrinkFen),
    ['Rh7'],
  )
  assert.equal(safeShrink.waitingMoveApplies, false)

  const hangingShrinkFen = '1k6/8/R7/2K5/8/8/8/8 w - - 0 1'
  const hangingShrink = scoreRookWhiteMove(hangingShrinkFen, 'Ra7')
  const hangingShrinkWait = scoreRookWhiteMove(hangingShrinkFen, 'Rh6')
  assert.equal(hangingShrink.rookCapturePenalty, 1)
  assert.equal(hangingShrink.shrinkBoxRoom, 1)
  assert.equal(hangingShrinkWait.waitingMoveApplies, true)
  assert.deepEqual(
    getMateRuleSet('rook').idealWhiteMoves(hangingShrinkFen),
    ['Rh6'],
  )
  assert.equal(
    getMateRuleSet('rook').currentWhiteHint(hangingShrinkFen)?.id,
    'waiting move',
  )

  const priorHangingShrinkFen =
    '6k1/8/7R/5K2/8/8/8/8 w - - 0 1'
  assert.equal(
    scoreRookWhiteMove(priorHangingShrinkFen, 'Ra6')
      .waitingMoveApplies,
    true,
  )
  assert.deepEqual(
    getMateRuleSet('rook').idealWhiteMoves(priorHangingShrinkFen),
    ['Ra6'],
  )

  const noBoxFen = '8/R4K1k/8/8/8/8/8/8 w - - 2 2'
  const farthestNoBoxMove = scoreRookWhiteMove(noBoxFen, 'Ra1')
  const nearerNoBoxMove = scoreRookWhiteMove(noBoxFen, 'Ra6')
  const edgeNoBoxMove = scoreRookWhiteMove(noBoxFen, 'Ra8')
  assert.equal(farthestNoBoxMove.resultHasBox, false)
  assert.equal(nearerNoBoxMove.resultHasBox, false)
  assert.equal(edgeNoBoxMove.resultHasBox, false)
  assert.equal(farthestNoBoxMove.noBoxRookMovePenalty, 0)
  assert.ok(
    farthestNoBoxMove.noBoxRookBlackDistanceScore <
      nearerNoBoxMove.noBoxRookBlackDistanceScore,
  )
  assert.ok(
    farthestNoBoxMove.noBoxRookBlackDistanceScore <
      edgeNoBoxMove.noBoxRookBlackDistanceScore,
  )
  assert.ok(
    compareRookWhiteScores(farthestNoBoxMove, edgeNoBoxMove) < 0,
  )

  const sameWallFen = '8/8/2k5/R7/K7/8/8/8 w - - 4 3'
  assert.equal(
    scoreRookWhiteMove(sameWallFen, 'Rb5').shrinkBoxPenalty,
    1,
  )

  const ontoWallFen = '8/8/8/4k3/7R/6K1/8/8 w - - 14 8'
  const ontoWall = scoreRookWhiteMove(ontoWallFen, 'Kg4')
  assert.equal(ontoWall.keepBoxPenalty, 1)
  assert.equal(ontoWall.kingProximityPriority, 0)

  const approachFen = '8/8/k7/2R5/4K3/8/8/8 w - - 2 2'
  const diagonal = scoreRookWhiteMove(approachFen, 'Kd5')
  const straight = scoreRookWhiteMove(approachFen, 'Ke5')
  assert.equal(diagonal.kingProximityPriority, 0)
  assert.equal(straight.kingProximityPriority, 0)
  assert.ok(diagonal.kingDistance < straight.kingDistance)
  assert.ok(compareRookWhiteScores(diagonal, straight) < 0)

  const avoidOppositionFen =
    '8/8/8/4k3/8/8/3K4/R7 w - - 0 1'
  const avoidsOpposition = scoreRookWhiteMove(
    avoidOppositionFen,
    'Kd3',
  )
  const takesOpposition = scoreRookWhiteMove(
    avoidOppositionFen,
    'Ke3',
  )
  assert.equal(avoidsOpposition.kingOppositionPenalty, 0)
  assert.equal(takesOpposition.kingOppositionPenalty, 1)
  assert.equal(
    takesOpposition.kingProximityPriority,
    avoidsOpposition.kingProximityPriority,
  )
  assert.ok(
    compareRookWhiteScores(avoidsOpposition, takesOpposition) < 0,
  )

  const formerEdgePace = scoreRookWhiteMove(
    '8/8/8/8/k1K4R/8/8/8 w - - 0 1',
    'Kc5+',
  )
  assert.equal(formerEdgePace.kingProximityPriority, 2)
  assert.equal('kingEdgeDistanceScore' in formerEdgePace, false)

  const sameBoardDifferentClock =
    '8/5R2/8/4K3/8/7k/8/8 w - - 98 50'
  assert.deepEqual(
    scoreRookWhiteMove(squeezeFen, 'Rg7'),
    scoreRookWhiteMove(sameBoardDifferentClock, 'Rg7'),
  )
})

test('rook checking squeeze takes priority over a waiting move', () => {
  const rook = getMateRuleSet('rook')
  const fen = '5k2/3K4/4R3/8/8/8/8/8 w - - 6 4'

  assert.deepEqual(rook.idealWhiteMoves(fen), ['Rf6+'])
  assert.equal(rook.currentWhiteHint(fen)?.id, 'rook box')
  assert.equal(
    'forceProgressPenalty' in scoreRookWhiteMove(fen, 'Rf6+'),
    false,
  )
})

test('rook best-move reasons all come from the displayed board rules', () => {
  const rook = getMateRuleSet('rook')
  const registeredIds = new Set(
    rook.whiteRuleDescriptions.map(({ id }) => id),
  )

  for (const fen of ROOK_WHITE_FIXTURES.slice(0, 8).map(({ fen }) => fen)) {
    for (const san of getChess(fen).moves()) {
      const reason = rook.explainWhiteMove(fen, san)
      assert.ok(
        reason === undefined || registeredIds.has(reason.id),
        `${fen}; ${san}`,
      )
    }
  }
})

test('rook recommendations preserve D4 symmetry', () => {
  const rook = getMateRuleSet('rook')
  for (const { fen } of ROOK_WHITE_FIXTURES) {
    const baseResults = rook.idealWhiteMoves(fen).map((san) => {
      const result = getChess(fen)
      result.move(san)
      return result.fen()
    })

    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const expected = baseResults
        .map((resultFen) =>
          positionKey(transformFen(resultFen, transform)),
        )
        .sort()
      const actual = rook
        .idealWhiteMoves(transformedFen)
        .map((san) => {
          const result = getChess(transformedFen)
          result.move(san)
          return positionKey(result.fen())
        })
        .sort()
      assert.deepEqual(actual, expected, `${fen}; ${transform.name}`)
    }
  }
})

test('rook production scoring has no box-size literal or rank-first helper', () => {
  const source = readFileSync(
    new URL('./majorPieces.ts', import.meta.url),
    'utf8',
  )
  const strategySource = readFileSync(
    new URL('./rookStrategy.ts', import.meta.url),
    'utf8',
  )
  const geometrySource = readFileSync(
    new URL('./majorPieceGeometry.ts', import.meta.url),
    'utf8',
  )
  const rookSource = source.slice(
    source.indexOf('export function scoreRookWhiteMove'),
    source.indexOf('export function scoreQueenBlackMove'),
  )

  assert.doesNotMatch(
    rookSource,
    /\b(?:beforeBox|resultBox)\.size\s*(?:===|!==|<=|>=|<|>)\s*\d+\b/,
  )
  assert.doesNotMatch(
    rookSource,
    /get(?:ClosestRookBoxAxis|RookCutAxis|RookEstablishedBoxAxis|RookOneDimensionalBoxSize)/,
  )
  assert.doesNotMatch(
    `${rookSource}\n${geometrySource}`,
    /(?:\b\w*box\w*\.size|\bboxSize)\s*(?:===|!==|<=|>=|<|>)\s*2\b/i,
  )
  assert.doesNotMatch(`${rookSource}\n${geometrySource}`, /\bsize[- ]2\b/i)
  assert.doesNotMatch(
    strategySource,
    /finish guarantee|proofProgress|mateRank|majorPieceMateProgress|lookupMajorPieceMateProgress|completionGuard|presentationRole\s*:\s*['"]internal|halfmove|fullmove|history|rookExposed|rookHome|rookSafe|isRookHomeMove|movedToDifferentEdge/i,
  )
})

test('rook avoids unsafe material and stalemate in literal source positions', () => {
  for (const fen of [
    '8/8/8/8/4R3/3k4/8/4K3 w - - 0 1',
    '8/8/8/8/R7/K7/8/k7 w - - 0 1',
  ]) {
    for (const san of getMateRuleSet('rook').idealWhiteMoves(fen)) {
      const chess = getChess(fen)
      chess.move(san)
      assert.equal(chess.isStalemate(), false)
      assert.equal(
        chess
          .moves({ verbose: true })
          .some((move) => move.captured === 'r'),
        false,
      )
    }
  }
})

test('rook black scoring and literal defensive choices retain legal order', () => {
  const fen = '8/8/8/8/8/3k4/5R2/4K3 b - - 0 1'
  const side = scoreRookBlackMove(fen, 'Kc4')
  const approach = scoreRookBlackMove(fen, 'Ke3')
  assert.deepEqual(side, {
    captureRookPenalty: 1,
    cutLineDistance: 2,
    diagonalAdjacentRookDistance: 5,
    rookOppositionPenalty: 0,
    rookDistance: 5,
  })
  assert.deepEqual(approach, {
    captureRookPenalty: 1,
    cutLineDistance: 1,
    diagonalAdjacentRookDistance: 2,
    rookOppositionPenalty: 0,
    rookDistance: 2,
  })
  assert.equal(compareRookBlackScores(approach, side), -1)

  const dualAxisFen = '8/8/8/8/8/7k/4R3/3K4 b - - 6 4'
  assert.equal(scoreRookBlackMove(dualAxisFen, 'Kg3').cutLineDistance, 2)
  assert.equal(scoreRookBlackMove(dualAxisFen, 'Kh4').cutLineDistance, 3)

  const rook = getMateRuleSet('rook')
  for (const fixture of ROOK_BLACK_FIXTURES) {
    assert.deepEqual(rook.blackCandidates(fixture.fen), {
      moves: fixture.moves,
      idealMoves: fixture.idealMoves,
    })
  }
})

test('rook waiting move does not recreate the former adjacent-rook cycle', () => {
  const rook = getMateRuleSet('rook')
  const startingFen = '6R1/5K1k/8/8/8/8/8/8 w - - 0 1'
  const chess = getChess(startingFen)
  chess.move('Rg7+')
  chess.move('Kh6')

  assert.deepEqual(rook.idealWhiteMoves(chess.fen()), ['Kf6'])
  assert.equal(rook.currentWhiteHint(chess.fen())?.id, 'king closer')
  assert.equal(rook.idealWhiteMoves(chess.fen()).includes('Rg8'), false)
})

test('major phases are visible only on White turns', () => {
  assert.equal(
    getMateRuleSet('rook').phase('8/2k5/8/8/7R/3K4/8/8 w - - 2 2'),
    '2/2',
  )
  assert.equal(
    getMateRuleSet('rook').phase('8/2k5/8/8/7R/3K4/8/8 b - - 2 2'),
    '1/2',
  )
  assert.equal(
    getMateRuleSet('queen').phase('k7/3Q4/K7/8/8/8/8/8 w - - 2 2'),
    '2/2',
  )
  assert.equal(
    getMateRuleSet('queen').phase('k7/3Q4/K7/8/8/8/8/8 b - - 2 2'),
    '1/2',
  )
  assert.equal(
    getMateRuleSet('queen').phase('8/2k5/8/8/7Q/3K4/8/8 w - - 2 2'),
    '1/2',
  )
})

test('returning to the previous board position supersedes major black rules', () => {
  const fixtures = [
    {
      id: 'rook' as const,
      previous: '8/8/8/4k3/8/3K4/8/7R w - - 48 25',
      fen: '8/8/8/8/5k2/3K4/8/7R b - - 51 26',
      moves: ['Ke5', 'Kf5', 'Kg5', 'Kg4', 'Kg3', 'Kf3'],
    },
    {
      id: 'queen' as const,
      previous: '8/8/8/4k3/8/3K4/8/7Q w - - 48 25',
      fen: '8/8/8/8/5k2/3K4/8/7Q b - - 51 26',
      moves: ['Ke5', 'Kf5', 'Kg5', 'Kg4', 'Kg3'],
    },
  ]

  for (const fixture of fixtures) {
    assert.deepEqual(
      getMateRuleSet(fixture.id).blackCandidates(
        fixture.fen,
        fixture.previous,
      ),
      { moves: fixture.moves, idealMoves: ['Ke5'] },
    )
  }

  assert.equal(
    positionKey('8/8/8/4k3/8/3K4/8/7Q w - - 48 25'),
    positionKey('8/8/8/4k3/8/3K4/8/7Q w - - 52 27'),
  )
  assert.notEqual(
    positionKey('8/8/8/4k3/8/3K4/8/7Q w KQ - 48 25'),
    positionKey('8/8/8/4k3/8/3K4/8/7Q w - - 48 25'),
  )
  assert.notEqual(
    positionKey('8/8/8/4k3/8/3K4/8/7Q w - e3 48 25'),
    positionKey('8/8/8/4k3/8/3K4/8/7Q w - - 48 25'),
  )
})

test('major black facades return empty candidates with no legal moves', () => {
  assert.deepEqual(
    getMateRuleSet('queen').blackCandidates(
      '8/8/8/8/8/2K5/1Q6/k7 b - - 37 19',
    ),
    { moves: [], idealMoves: [] },
  )
  assert.deepEqual(
    getMateRuleSet('rook').blackCandidates(
      '7k/5K2/8/8/8/8/8/7R b - - 1 1',
    ),
    { moves: [], idealMoves: [] },
  )
})
