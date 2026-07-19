import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { getChess, materialMatchesMate, positionKey } from '../chess'
import { generateMatePosition } from '../positions'
import {
  compareQueenBlackScores,
  compareQueenWhiteScores,
  compareRookBlackScores,
  compareRookWhiteScores,
  getEndgameReturnToPositionMoves,
  getMateRuleSet,
  getQueenCageKingApproachDistance,
  getQueenTwoSquareCage,
  queenRuleSet,
  queenWhiteRules,
  rookRuleSet,
  rookWhiteRules,
  scoreQueenBlackMove,
  scoreQueenWhiteMove,
  scoreRookBlackMove,
  scoreRookWhiteMove,
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
    idealMoves: ['Qd6'],
    hint: 'queen box size',
    phase: '1/2',
  },
  {
    fen: '7k/8/8/6Q1/8/5K2/8/8 w - - 0 1',
    idealMoves: ['Kf4'],
    hint: 'king to cage',
    phase: '2/2',
  },
  {
    fen: '8/8/8/6K1/8/4Q3/6k1/8 w - - 6 4',
    idealMoves: ['Kg4'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/4K3/2Q5/8/1k6/8/8 w - - 2 2',
    idealMoves: ['Kd5'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '7k/4Q3/4K3/8/8/8/8/8 w - - 18 10',
    idealMoves: ['Kf6'],
    hint: 'king to cage',
    phase: '2/2',
  },
  {
    fen: '8/8/K7/8/3k4/Q7/8/8 w - - 0 1',
    idealMoves: ['Qf3'],
    hint: 'queen box size',
    phase: '1/2',
  },
  {
    fen: '8/8/3K4/8/8/4k3/7Q/8 w - - 0 1',
    idealMoves: ['Qc2'],
    hint: 'queen box size',
    phase: '1/2',
  },
  {
    fen: '8/8/5k2/3Q4/6K1/8/8/8 w - - 6 4',
    idealMoves: ['Kf4'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/7k/5Q2/5K2/8/8/8/8 w - - 20 11',
    idealMoves: ['Qg5'],
    hint: 'corner cage',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/8/K7/2Q5/k7 w - - 0 1',
    idealMoves: ['Qb2#'],
    hint: 'white pieces off edge',
    phase: '2/2',
  },
  {
    fen: '6k1/4Q3/8/8/8/5K2/8/8 w - - 0 1',
    idealMoves: ['Kg4'],
    hint: 'king to cage',
    phase: '2/2',
  },
  {
    fen: 'k7/8/8/1Q6/2K5/8/8/8 w - - 6 4',
    idealMoves: ['Kc5'],
    hint: 'king to cage',
    phase: '2/2',
  },
  {
    fen: '7k/8/8/6Q1/5K2/8/8/8 w - - 6 4',
    idealMoves: ['Kf5'],
    hint: 'king to cage',
    phase: '2/2',
  },
  {
    fen: '4K2k/4Q3/8/8/8/8/8/8 w - - 10 6',
    idealMoves: ['Kd7'],
    hint: 'king to cage',
    phase: '1/2',
  },
  {
    fen: '8/8/4k3/8/8/3Q4/1K6/8 w - - 0 1',
    idealMoves: ['Qd4'],
    hint: 'queen knight move',
    phase: '2/2',
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
    idealMoves: ['Rf8'],
    hint: 'establish box',
    phase: '1/2',
  },
  {
    fen: '8/2k5/8/8/7R/3K4/8/8 w - - 2 2',
    idealMoves: ['Rh6'],
    hint: 'establish box',
    phase: '2/2',
  },
  {
    fen: '1R3K2/8/8/8/8/8/8/7k w - - 0 1',
    idealMoves: ['Rb2'],
    hint: 'establish box',
    phase: '1/2',
  },
  {
    fen: '5R2/8/8/8/8/8/4k1K1/8 w - - 6 4',
    idealMoves: ['Re8+'],
    hint: 'forcing check',
    phase: '2/2',
  },
  {
    fen: '6k1/8/8/8/8/2R5/8/2K5 w - - 0 1',
    idealMoves: ['Rc7'],
    hint: 'establish box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/4R3/3k4/8/4K3 w - - 0 1',
    idealMoves: ['Re2'],
    hint: 'establish box',
    phase: '1/2',
  },
  {
    fen: '8/8/8/8/R7/K7/8/k7 w - - 0 1',
    idealMoves: ['Rh4'],
    hint: 'maximize black distance',
    phase: '1/2',
  },
  {
    fen: '8/8/8/8/4K3/7R/3k4/8 w - - 14 8',
    idealMoves: ['Rg3', 'Ra3'],
    hint: 'rook waiting distance',
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

const QUEEN_ENDGAME_LINE_FIXTURES = [
  {
    startingFen: '8/5k2/8/4Q3/8/8/8/7K w - - 0 1',
    seed: 73888,
    expectedLine: [
      ['Kg2'],
      ['Kg6'],
      ['Qf4'],
      ['Kg7'],
      ['Qf5'],
      ['Kg8', 'Kh8', 'Kh6'],
      ['Qg5'],
      ['Kh7'],
      ['Kf3'],
      ['Kh8'],
      ['Kf4'],
      ['Kh7'],
      ['Kf5'],
      ['Kh8'],
      ['Kf6'],
      ['Kh7'],
      ['Qg7#'],
    ],
  },
  {
    startingFen: '8/4Q3/8/3K4/8/8/3k4/8 w - - 0 1',
    seed: 73926,
    expectedLine: [
      ['Qe4'],
      ['Kc3'],
      ['Kc5'],
      ['Kd2', 'Kb2', 'Kb3'],
      ['Qf3'],
      ['Kc2'],
      ['Qe3'],
      ['Kb2'],
      ['Qd3'],
      ['Kc1', 'Ka1', 'Ka2'],
      ['Qd2'],
      ['Kb1'],
      ['Kb4'],
      ['Ka1'],
      ['Kb3'],
      ['Kb1'],
      ['Qb2#'],
    ],
  },
  {
    startingFen: '1K6/5k2/8/8/8/8/8/6Q1 w - - 0 1',
    seed: 73964,
    expectedLine: [
      ['Qg5'],
      ['Ke6'],
      ['Kc7'],
      ['Kf7'],
      ['Qe5'],
      ['Kg6'],
      ['Qf4'],
      ['Kg7'],
      ['Qf5'],
      ['Kg8', 'Kh8', 'Kh6'],
      ['Qg4'],
      ['Kh7'],
      ['Qg5'],
      ['Kh8'],
      ['Kd7'],
      ['Kh7'],
      ['Ke7'],
      ['Kh8'],
      ['Kf7'],
      ['Kh7'],
      ['Qg7#'],
    ],
  },
  {
    startingFen: '8/8/1Q6/6K1/4k3/8/8/8 w - - 0 1',
    seed: 74002,
    expectedLine: [
      ['Qd6', 'Qc5'],
      ['Kf3', 'Kd3'],
      ['Qe5'],
      ['Kc4'],
      ['Qd6'],
      ['Kc3'],
      ['Qd5'],
      ['Kb4', 'Kc2', 'Kb2'],
      ['Qd3', 'Qc4'],
      ['Kc1', 'Ka1', 'Ka2'],
      ['Qc3'],
      ['Kb1'],
      ['Qd2'],
      ['Ka1'],
      ['Kf4'],
      ['Kb1'],
      ['Ke3'],
      ['Ka1'],
      ['Kd3'],
      ['Kb1'],
      ['Kc3'],
      ['Ka1'],
      ['Qb2#'],
    ],
  },
  {
    startingFen: '8/3K4/7Q/4k3/8/8/8/8 w - - 0 1',
    seed: 74040,
    expectedLine: [
      ['Qc6'],
      ['Kd4'],
      ['Qe6'],
      ['Kc5', 'Kd3', 'Kc3'],
      ['Qe5'],
      ['Kc4'],
      ['Qd6'],
      ['Kc3'],
      ['Qd5'],
      ['Kb4', 'Kc2', 'Kb2'],
      ['Qc6'],
      ['Kb3'],
      ['Qc5'],
      ['Kb2'],
      ['Qc4'],
      ['Ka3', 'Kb1', 'Ka1'],
      ['Qb5'],
      ['Ka2'],
      ['Qb4'],
      ['Ka1'],
      ['Kc6'],
      ['Ka2'],
      ['Kc5'],
      ['Ka1'],
      ['Kc4'],
      ['Ka2'],
      ['Kc3'],
      ['Ka1'],
      ['Qb2#'],
    ],
  },
  {
    startingFen: '8/5k2/8/8/2K5/8/Q7/8 w - - 0 1',
    seed: 74078,
    expectedLine: [
      ['Qe2'],
      ['Kf6'],
      ['Qe4'],
      ['Kf7', 'Kg7', 'Kg5'],
      ['Qf3'],
      ['Kg6'],
      ['Qf4'],
      ['Kg7'],
      ['Qf5'],
      ['Kg8', 'Kh8', 'Kh6'],
      ['Qf6'],
      ['Kh7'],
      ['Qg5'],
      ['Kh8'],
      ['Kd5'],
      ['Kh7'],
      ['Ke6'],
      ['Kh8'],
      ['Kf7'],
      ['Kh7'],
      ['Qg7#'],
    ],
  },
  {
    startingFen: 'Q6K/5k2/8/8/8/8/8/8 w - - 0 1',
    seed: 74116,
    expectedLine: [
      ['Qc6'],
      ['Ke7'],
      ['Kg7'],
      ['Kd8'],
      ['Qb7'],
      ['Ke8'],
      ['Qf7+'],
      ['Kd8'],
      ['Kf6'],
      ['Kc8'],
      ['Qe7'],
      ['Kb8'],
      ['Qd7'],
      ['Ka8'],
      ['Ke6'],
      ['Kb8'],
      ['Kd6'],
      ['Ka8'],
      ['Kc6'],
      ['Kb8'],
      ['Qb7#'],
    ],
  },
  {
    startingFen: '8/5k2/1Q6/8/8/5K2/8/8 w - - 0 1',
    seed: 74154,
    expectedLine: [
      ['Qd6'],
      ['Kg7'],
      ['Qe6'],
      ['Kf8', 'Kh8', 'Kh7'],
      ['Qe7'],
      ['Kg8'],
      ['Kg4'],
      ['Kh8'],
      ['Kg5'],
      ['Kg8'],
      ['Kg6'],
      ['Kh8'],
      ['Qg7#'],
    ],
  },
] as const

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function consumeSourceShuffle(
  random: () => number,
  moveCount: number,
): void {
  // chess420 shuffled candidates before scoring. The port is deterministic,
  // so parity replay consumes those historical RNG draws only in this test.
  for (let index = moveCount - 1; index > 0; index -= 1) {
    random()
  }
}

function boardTurnKey(fen: string): string {
  return fen.split(' ').slice(0, 2).join(' ')
}

function getRookReplayOutcome(
  chess: ReturnType<typeof getChess>,
): 'lostPiece' | 'mate' | 'stalemate' | null {
  if (!materialMatchesMate('rook', chess.fen())) {
    return 'lostPiece'
  }
  if (chess.isCheckmate()) {
    return 'mate'
  }
  if (chess.isStalemate()) {
    return 'stalemate'
  }
  return null
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves are still tied after a priority, they all remain best moves."

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
      'king to cage',
      'white pieces off edge',
      'queen knight move',
      'queen box size',
      'king closer',
      'shorter queen move',
    ],
  )
  assert.deepEqual(
    rookWhiteRules.map(({ id }) => id),
    [
      'mate',
      'rook safe',
      'no stalemate',
      'establish box',
      'forcing check',
      'rook waiting move',
      'rook waiting distance',
      'maximize black distance',
      'king closer',
      'maximize black distance',
    ],
  )
  assert.deepEqual(
    queenWhiteRules.map(({ shortLabel }) => shortLabel),
    [
      'mate',
      'pieces safe',
      'no stalemate',
      'corner cage',
      'White king toward cage',
      'white pieces off edge',
      'queen a knight move from Black king',
      'queen box size',
      'White king closer',
      'shorter queen move',
    ],
  )
  assert.deepEqual(
    rookWhiteRules.map(({ shortLabel }) => shortLabel),
    [
      'mate',
      'pieces safe',
      'no stalemate',
      'establish box',
      'forcing check',
      'rook waiting move',
      'rook waiting distance',
      'keep Black far from rook',
      'White king closer',
      'keep Black far from rook',
    ],
  )
  assert.equal(
    queenWhiteRules.find(({ id }) => id === 'king closer')?.helpText,
    "Bring White's king closer to Black's king without walking between the queen and Black's king.",
  )
  assert.equal(
    rookWhiteRules.find(({ id }) => id === 'king closer')?.helpText,
    "Bring White's king closer to Black's king without entering the rook's lines.",
  )
  assert.equal(
    rookWhiteRules.find(({ id }) => id === 'rook waiting distance')
      ?.helpText,
    "When a rook waiting move is required and the earlier priorities tie, place the rook as far as possible from Black's king.",
  )
  assert.equal(
    rookWhiteRules.find(({ id }) => id === 'establish box')?.helpText,
    "Put the rook on the row or file between the kings and closest to Black's king when not already.",
  )
  assert.equal(queenRuleSet.help.title, 'How best moves are chosen')
  assert.equal(queenRuleSet.help.whiteIntro, WHITE_INTRO)
  assert.equal(queenRuleSet.help.blackIntro, BLACK_INTRO)
  assert.deepEqual(queenRuleSet.help.blackPriorities, [
    'Return to the previous full position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Head toward the center, where Black has the most room to resist.',
  ])
  assert.deepEqual(rookRuleSet.help.blackPriorities, [
    'Return to the previous full position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    "Move toward the rook's cut line when that weakens White's box.",
    "Approach a diagonally protected rook when White's king and rook are awkwardly placed.",
    "Avoid walking into direct opposition when it makes White's job easier.",
    'Get as close to the rook as possible.',
  ])
  assert.deepEqual(queenRuleSet.help.notes, [])
  assert.deepEqual(queenRuleSet.help.noteBoards, [])
  assert.deepEqual(rookRuleSet.help.notes, [])
  assert.deepEqual(rookRuleSet.help.noteBoards, [])

  const registeredQueen = getMateRuleSet('queen')
  const registeredRook = getMateRuleSet('rook')
  assert.deepEqual(registeredQueen.help, queenRuleSet.help)
  assert.deepEqual(registeredRook.help, rookRuleSet.help)
  assert.deepEqual(
    registeredQueen.whiteRuleDescriptions.map(({ id }) => id),
    queenWhiteRules.map(({ id }) => id),
  )
  assert.deepEqual(
    registeredRook.whiteRuleDescriptions.map(({ id }) => id),
    [
      'mate',
      'rook safe',
      'no stalemate',
      'establish box',
      'forcing check',
      'rook waiting move',
      'rook waiting distance',
      'king closer',
      'maximize black distance',
    ],
  )
  assert.equal(
    registeredRook.whiteRuleDescriptions.filter(
      ({ id }) => id === 'maximize black distance',
    ).length,
    1,
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
  assert.equal(queen.explainWhiteMove(incorrectFen, 'Qa6+')?.id, 'white pieces off edge')
  assert.equal(queen.explainWhiteMove(incorrectFen, 'Qd4')?.id, 'queen knight move')
})

test('queen white score fields and compound comparisons match literals', () => {
  const edgeFen = '8/8/8/8/8/8/1K1k4/7Q w - - 0 1'
  const offEdge = scoreQueenWhiteMove(edgeFen, 'Qd5')
  const edgeKnight = scoreQueenWhiteMove(edgeFen, 'Qf1')
  assert.deepEqual(offEdge, {
    matePenalty: 1,
    queenCapturePenalty: 0,
    stalematePenalty: 0,
    cagePenalty: 1,
    whitePieceEdgePenalty: 0,
    queenKnightMovePenalty: 1,
    queenBoxArea: 32,
    cageKingApproach: 0,
    kingMiddleDistance: 4,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 2,
    queenMoveDistance: 8,
  })
  assert.deepEqual(edgeKnight, {
    matePenalty: 1,
    queenCapturePenalty: 0,
    stalematePenalty: 0,
    cagePenalty: 1,
    whitePieceEdgePenalty: 1,
    queenKnightMovePenalty: 0,
    queenBoxArea: 35,
    cageKingApproach: 0,
    kingMiddleDistance: 4,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 2,
    queenMoveDistance: 2,
  })
  assert.equal(compareQueenWhiteScores(offEdge, edgeKnight), -1)

  const boxFen = '8/8/8/8/4k3/8/8/3QK3 w - - 0 1'
  const smallerBox = scoreQueenWhiteMove(boxFen, 'Qd6')
  const largerBox = scoreQueenWhiteMove(boxFen, 'Qd2')
  assert.deepEqual(smallerBox, {
    matePenalty: 1,
    queenCapturePenalty: 0,
    stalematePenalty: 0,
    cagePenalty: 1,
    whitePieceEdgePenalty: 1,
    queenKnightMovePenalty: 0,
    queenBoxArea: 20,
    cageKingApproach: 0,
    kingMiddleDistance: 3,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 3,
    queenMoveDistance: 5,
  })
  assert.deepEqual(largerBox, {
    matePenalty: 1,
    queenCapturePenalty: 0,
    stalematePenalty: 0,
    cagePenalty: 1,
    whitePieceEdgePenalty: 1,
    queenKnightMovePenalty: 0,
    queenBoxArea: 24,
    cageKingApproach: 0,
    kingMiddleDistance: 3,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 3,
    queenMoveDistance: 1,
  })
  assert.equal(compareQueenWhiteScores(smallerBox, largerBox), -4)
})

test('shorter queen move compares only scores from queen moves', () => {
  const queenScore = scoreQueenWhiteMove(
    '8/8/8/8/4k3/8/8/3QK3 w - - 0 1',
    'Qd6',
  )
  const kingScore = { ...queenScore, queenMoveDistance: null }
  const shorterQueenScore = { ...queenScore, queenMoveDistance: 2 }
  const shorterMoveRule = queenWhiteRules.find(
    ({ id }) => id === 'shorter queen move',
  )

  assert.equal(shorterMoveRule?.applies?.(kingScore), false)
  assert.equal(shorterMoveRule?.applies?.(queenScore), true)
  assert.equal(compareQueenWhiteScores(kingScore, queenScore), 0)
  assert.equal(compareQueenWhiteScores(shorterQueenScore, queenScore), -3)
})

test('queen cage, safety, stalemate, and exact finishing line match literals', () => {
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
    const whiteKing = cageChess
      .board()
      .flat()
      .find((piece) => piece?.color === 'w' && piece.type === 'k')
    const whiteQueen = cageChess
      .board()
      .flat()
      .find((piece) => piece?.color === 'w' && piece.type === 'q')
    assert.equal(move.piece, 'k')
    assert.ok(whiteKing && whiteQueen)
    assert.equal(
      getQueenCageKingApproachDistance(
        whiteKing.square,
        whiteQueen.square,
        'h8',
      ),
      2,
    )
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

  const chess = getChess('8/8/8/8/8/3K4/3Q4/1k6 w - - 34 18')
  assert.deepEqual(getMateRuleSet('queen').idealWhiteMoves(chess.fen()), ['Kc3'])
  chess.move('Kc3')
  assert.deepEqual(getMateRuleSet('queen').blackCandidates(chess.fen()), {
    moves: ['Ka1'],
    idealMoves: ['Ka1'],
  })
  chess.move('Ka1')
  assert.deepEqual(getMateRuleSet('queen').idealWhiteMoves(chess.fen()), ['Qb2#'])
  chess.move('Qb2#')
  assert.equal(chess.isCheckmate(), true)
})

test('queen replays all eight chess420 golden mating lines', () => {
  const queen = getMateRuleSet('queen')
  let totalPlies = 0

  for (const fixture of QUEEN_ENDGAME_LINE_FIXTURES) {
    const chess = getChess(fixture.startingFen)
    const random = seededRandom(fixture.seed)

    for (const [ply, expectedMoves] of fixture.expectedLine.entries()) {
      assert.equal(chess.isCheckmate(), false, fixture.startingFen)
      const actualMoves =
        chess.turn() === 'w'
          ? queen.idealWhiteMoves(chess.fen())
          : queen.blackCandidates(chess.fen()).idealMoves
      const context = `${fixture.startingFen}; ply ${ply + 1}`

      assert.deepEqual(actualMoves, expectedMoves, context)
      const chosen =
        expectedMoves[Math.floor(random() * expectedMoves.length)]!
      assert.ok(chess.move(chosen), context)
      totalPlies += 1
    }

    assert.equal(chess.isCheckmate(), true, fixture.startingFen)
  }

  assert.equal(totalPlies, 162)
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

test('rook facade matches every focused literal white fixture', () => {
  const rook = getMateRuleSet('rook')

  for (const fixture of ROOK_WHITE_FIXTURES) {
    assert.deepEqual(rook.idealWhiteMoves(fixture.fen), fixture.idealMoves)
    assert.equal(rook.currentWhiteHint(fixture.fen)?.id, fixture.hint)
    assert.equal(rook.phase(fixture.fen), fixture.phase)
  }
})

test('rook white score fields preserve establish-box and post-box priorities', () => {
  const boxFen = '8/2k5/8/8/7R/3K4/8/8 w - - 2 2'
  const established = scoreRookWhiteMove(boxFen, 'Rh6')
  const missed = scoreRookWhiteMove(boxFen, 'Rh5')
  assert.deepEqual(established, {
    matePenalty: 1,
    rookCapturePenalty: 0,
    stalematePenalty: 0,
    rookBoxEstablishedPenalty: 0,
    rookBoxAxisSwitchPenalty: 0,
    rookBoxSize: 2,
    forcingCheckPenalty: 1,
    rookPhaseTwoWaitingPenalty: 0,
    rookPhaseTwoWaitingDistanceScore: 0,
    rookBoxPreservedPenalty: 0,
    rookPreservedBoxSize: 0,
    rookBlackDistanceScore: -6,
    kingRookLinePenalty: 0,
    kingDistance: 5,
  })
  assert.deepEqual(missed, {
    matePenalty: 1,
    rookCapturePenalty: 0,
    stalematePenalty: 0,
    rookBoxEstablishedPenalty: 1,
    rookBoxAxisSwitchPenalty: 0,
    rookBoxSize: 0,
    forcingCheckPenalty: 1,
    rookPhaseTwoWaitingPenalty: 0,
    rookPhaseTwoWaitingDistanceScore: 0,
    rookBoxPreservedPenalty: 0,
    rookPreservedBoxSize: 0,
    rookBlackDistanceScore: -7,
    kingRookLinePenalty: 0,
    kingDistance: 5,
  })
  assert.equal(compareRookWhiteScores(established, missed), -1)

  const waitingFen = '8/8/8/8/4K3/7R/3k4/8 w - - 14 8'
  const near = scoreRookWhiteMove(waitingFen, 'Rg3')
  const far = scoreRookWhiteMove(waitingFen, 'Ra3')
  assert.deepEqual(near, {
    matePenalty: 1,
    rookCapturePenalty: 0,
    stalematePenalty: 0,
    rookBoxEstablishedPenalty: 0,
    rookBoxAxisSwitchPenalty: 0,
    rookBoxSize: 0,
    forcingCheckPenalty: 1,
    rookPhaseTwoWaitingPenalty: 0,
    rookPhaseTwoWaitingDistanceScore: -3,
    rookBoxPreservedPenalty: 0,
    rookPreservedBoxSize: 2,
    rookBlackDistanceScore: -4,
    kingRookLinePenalty: 0,
    kingDistance: 3,
  })
  assert.deepEqual(far, near)
  assert.equal(compareRookWhiteScores(near, far), 0)

  const loopMove18Fen = '8/8/8/3K4/8/k7/8/2R5 w - - 34 18'
  const loopRc4 = scoreRookWhiteMove(loopMove18Fen, 'Rc4')
  const loopRb1 = scoreRookWhiteMove(loopMove18Fen, 'Rb1')
  assert.equal(loopRc4.rookBoxSize, 3)
  assert.equal(loopRb1.rookBoxSize, 1)
  assert.ok(compareRookWhiteScores(loopRb1, loopRc4) < 0)
  const rook = getMateRuleSet('rook')
  assert.deepEqual(rook.idealWhiteMoves(loopMove18Fen), ['Rb1'])
  assert.equal(
    rook.explainWhiteMove(loopMove18Fen, 'Rc4')?.id,
    'establish box',
  )

  const minimalLoopFen = '5k2/4R3/3K4/8/8/8/8/8 w - - 2 2'
  const minimalLoopRe1 = scoreRookWhiteMove(minimalLoopFen, 'Re1')
  const minimalLoopRa7 = scoreRookWhiteMove(minimalLoopFen, 'Ra7')
  const minimalLoopRb7 = scoreRookWhiteMove(minimalLoopFen, 'Rb7')
  assert.equal(minimalLoopRe1.rookBoxPreservedPenalty, 1)
  assert.equal(minimalLoopRe1.rookPreservedBoxSize, 3)
  assert.equal(minimalLoopRa7.rookBoxPreservedPenalty, 0)
  assert.equal(minimalLoopRa7.rookPreservedBoxSize, 1)
  assert.equal(minimalLoopRb7.rookBoxPreservedPenalty, 0)
  assert.equal(minimalLoopRb7.rookPreservedBoxSize, 1)
  assert.ok(compareRookWhiteScores(minimalLoopRa7, minimalLoopRe1) < 0)
  assert.ok(compareRookWhiteScores(minimalLoopRa7, minimalLoopRb7) < 0)
  assert.deepEqual(rook.idealWhiteMoves(minimalLoopFen), ['Ra7'])
  assert.equal(
    rook.explainWhiteMove(minimalLoopFen, 'Re1')?.id,
    'maximize black distance',
  )

  const perpendicularCycleFen = '8/8/6k1/8/R7/4K3/8/8 w - - 2 2'
  const perpendicularRa5 = scoreRookWhiteMove(perpendicularCycleFen, 'Ra5')
  const perpendicularRf4 = scoreRookWhiteMove(perpendicularCycleFen, 'Rf4')
  assert.equal(perpendicularRa5.rookBoxAxisSwitchPenalty, 0)
  assert.equal(perpendicularRa5.rookBoxSize, 3)
  assert.equal(perpendicularRf4.rookBoxAxisSwitchPenalty, 1)
  assert.equal(perpendicularRf4.rookBoxSize, 2)
  assert.ok(compareRookWhiteScores(perpendicularRf4, perpendicularRa5) < 0)
  assert.deepEqual(rook.idealWhiteMoves(perpendicularCycleFen), ['Rf4'])
  assert.equal(
    rook.explainWhiteMove(perpendicularCycleFen, 'Ra5')?.id,
    'establish box',
  )

  const loopingReplyFen = '7K/2R5/8/k7/8/8/8/8 w - - 2 2'
  const loopingReplyRb7 = scoreRookWhiteMove(loopingReplyFen, 'Rb7')
  const loopingReplyRc6 = scoreRookWhiteMove(loopingReplyFen, 'Rc6')
  assert.equal(loopingReplyRb7.rookBoxAxisSwitchPenalty, 1)
  assert.equal(loopingReplyRb7.rookBoxSize, 1)
  assert.equal(loopingReplyRc6.rookBoxAxisSwitchPenalty, 0)
  assert.equal(loopingReplyRc6.rookBoxSize, 5)
  assert.ok(compareRookWhiteScores(loopingReplyRb7, loopingReplyRc6) < 0)
  assert.deepEqual(rook.idealWhiteMoves(loopingReplyFen), ['Rb7'])
  assert.equal(
    rook.explainWhiteMove(loopingReplyFen, 'Rc6')?.id,
    'establish box',
  )

  const lostBoxFen = '7k/R7/4K3/8/8/8/8/8 w - - 6 4'
  const lostBoxKf6 = scoreRookWhiteMove(lostBoxFen, 'Kf6')
  const lostBoxKf7 = scoreRookWhiteMove(lostBoxFen, 'Kf7')
  assert.equal(lostBoxKf6.rookBoxPreservedPenalty, 0)
  assert.equal(lostBoxKf6.rookPreservedBoxSize, 1)
  assert.equal(lostBoxKf6.kingRookLinePenalty, 0)
  assert.equal(lostBoxKf7.rookBoxPreservedPenalty, 1)
  assert.equal(lostBoxKf7.rookPreservedBoxSize, 0)
  assert.ok(compareRookWhiteScores(lostBoxKf6, lostBoxKf7) < 0)
  assert.deepEqual(rook.idealWhiteMoves(lostBoxFen), ['Kf6'])
  assert.equal(
    rook.explainWhiteMove(lostBoxFen, 'Kf7')?.id,
    'maximize black distance',
  )

  const cutSwitchCycleFen = '1k6/8/2R5/2K5/8/8/8/8 w - - 0 1'
  const cutSwitchKd5 = scoreRookWhiteMove(cutSwitchCycleFen, 'Kd5')
  const cutSwitchKd6 = scoreRookWhiteMove(cutSwitchCycleFen, 'Kd6')
  assert.equal(cutSwitchKd5.kingRookLinePenalty, 0)
  assert.equal(cutSwitchKd5.kingDistance, 5)
  assert.equal(cutSwitchKd6.kingRookLinePenalty, 1)
  assert.equal(cutSwitchKd6.kingDistance, 4)
  assert.ok(compareRookWhiteScores(cutSwitchKd5, cutSwitchKd6) < 0)
  assert.deepEqual(rook.idealWhiteMoves(cutSwitchCycleFen), ['Kd5'])
  assert.equal(
    rook.explainWhiteMove(cutSwitchCycleFen, 'Kd6')?.id,
    'king closer',
  )

  const perpendicularCycleStartFen = '8/8/8/7k/5R2/4K3/8/8 w - - 0 1'
  const perpendicularCycleKf3 = scoreRookWhiteMove(
    perpendicularCycleStartFen,
    'Kf3',
  )
  const perpendicularCycleRa4 = scoreRookWhiteMove(
    perpendicularCycleStartFen,
    'Ra4',
  )
  assert.equal(perpendicularCycleKf3.kingRookLinePenalty, 0)
  assert.equal(perpendicularCycleKf3.kingDistance, 4)
  assert.equal(perpendicularCycleRa4.kingRookLinePenalty, 0)
  assert.equal(perpendicularCycleRa4.kingDistance, 5)
  assert.ok(
    compareRookWhiteScores(perpendicularCycleKf3, perpendicularCycleRa4) < 0,
  )
  assert.deepEqual(rook.idealWhiteMoves(perpendicularCycleStartFen), ['Kf3'])
  assert.equal(
    rook.explainWhiteMove(perpendicularCycleStartFen, 'Ra4')?.id,
    'king closer',
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

  const rook = getMateRuleSet('rook')
  for (const fixture of ROOK_BLACK_FIXTURES) {
    assert.deepEqual(rook.blackCandidates(fixture.fen), {
      moves: fixture.moves,
      idealMoves: fixture.idealMoves,
    })
  }
})

test('rook mates all 50 source-seeded Standard starts within 220 plies', () => {
  const random = seededRandom(42050)
  const rook = getMateRuleSet('rook')
  const starts: string[] = []
  const lines: string[] = []
  let totalPlies = 0
  let maxPlies = 0

  for (let game = 0; game < 50; game += 1) {
    const startingFen = generateMatePosition('rook', 'standard', random)
    const chess = getChess(startingFen)
    const seen = new Set([boardTurnKey(chess.fen())])
    const moves: string[] = []
    let lastWhiteTurnFen: string | undefined
    let blackReturnTargetFen: string | undefined
    let outcome: 'lostPiece' | 'mate' | 'stalemate' | 'loop' | 'noMove' | 'limit' =
      'limit'
    starts.push(startingFen)

    for (let ply = 0; ply < 220; ply += 1) {
      const terminalBeforeMove = getRookReplayOutcome(chess)
      if (terminalBeforeMove !== null) {
        outcome = terminalBeforeMove
        break
      }

      let choices: readonly string[]
      if (chess.turn() === 'w') {
        consumeSourceShuffle(random, rook.whiteMoves(chess.fen()).length)
        choices = rook.idealWhiteMoves(chess.fen())
      } else {
        const candidates = rook.blackCandidates(
          chess.fen(),
          blackReturnTargetFen,
        )
        const returnMoves = getEndgameReturnToPositionMoves(
          chess.fen(),
          blackReturnTargetFen,
          candidates.moves,
        )
        if (returnMoves.length === 0) {
          consumeSourceShuffle(random, candidates.moves.length)
        }
        choices = candidates.idealMoves
      }

      const san = choices[Math.floor(random() * choices.length)]
      if (san === undefined) {
        outcome = 'noMove'
        break
      }
      if (chess.turn() === 'w') {
        blackReturnTargetFen = lastWhiteTurnFen
        lastWhiteTurnFen = chess.fen()
      } else {
        blackReturnTargetFen = undefined
      }
      moves.push(san)
      assert.ok(
        chess.move(san),
        `game ${game + 1}; start ${startingFen}; moves ${moves.join(' ')}`,
      )

      const terminalAfterMove = getRookReplayOutcome(chess)
      if (terminalAfterMove !== null) {
        outcome = terminalAfterMove
        break
      }
      const key = boardTurnKey(chess.fen())
      if (seen.has(key)) {
        outcome = 'loop'
        break
      }
      seen.add(key)
    }

    const context =
      `game ${game + 1}; outcome ${outcome}; start ${startingFen}; ` +
      `final ${chess.fen()}; moves ${moves.join(' ')}`
    assert.equal(outcome, 'mate', context)
    lines.push(moves.join(' '))
    totalPlies += moves.length
    maxPlies = Math.max(maxPlies, moves.length)
  }

  assert.equal(totalPlies, 2168)
  assert.equal(maxPlies, 107)
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify({ starts, lines }))
      .digest('hex'),
    'fa59764af2a9b0bc0883152bb8d04b814c136ef5b58cd7062b6d8172c767343d',
  )
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
    getMateRuleSet('queen').phase('8/2k5/8/8/7Q/3K4/8/8 w - - 2 2'),
    '2/2',
  )
  assert.equal(
    getMateRuleSet('queen').phase('8/2k5/8/8/7Q/3K4/8/8 b - - 2 2'),
    '1/2',
  )
})

test('representative hardcoded line starts keep first ideal choices', () => {
  const fixtures = [
    {
      id: 'rook' as const,
      fen: '8/5k2/8/5K2/8/8/8/6R1 w - - 0 1',
      white: ['Rg6'],
      blackFen: '8/5k2/6R1/5K2/8/8/8/8 b - - 1 1',
      black: ['Ke7'],
    },
    {
      id: 'queen' as const,
      fen: '8/5k2/8/4Q3/8/8/8/7K w - - 0 1',
      white: ['Kg2'],
      blackFen: '8/5k2/8/4Q3/8/8/6K1/8 b - - 1 1',
      black: ['Kg6'],
    },
  ]

  for (const fixture of fixtures) {
    const ruleSet = getMateRuleSet(fixture.id)
    assert.deepEqual(ruleSet.idealWhiteMoves(fixture.fen), fixture.white)
    assert.deepEqual(
      ruleSet.blackCandidates(fixture.blackFen).idealMoves,
      fixture.black,
    )
  }
})

test('returning to the previous full position supersedes major black rules', () => {
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
