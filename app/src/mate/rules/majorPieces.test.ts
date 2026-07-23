import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  getChess,
  materialMatchesMate,
  positionKey,
  SQUARE_TRANSFORMS,
  transformFen,
} from '../chess'
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
  isQueenRankOrFileChannelBetween,
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
    fen: '8/8/3K4/5Q2/8/4k3/8/8 w - - 14 8',
    idealMoves: ['Qg4'],
    hint: 'queen box size',
    phase: '2/2',
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
    idealMoves: ['Rd8'],
    hint: 'maximize black distance',
    phase: '1/2',
  },
  {
    fen: '8/2k5/8/8/7R/3K4/8/8 w - - 2 2',
    idealMoves: ['Rd4'],
    hint: 'establish box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/8/8/2k4K/7R w - - 0 1',
    idealMoves: ['Kg2'],
    hint: 'king closer',
    phase: '1/2',
  },
  {
    fen: '1R3K2/8/8/8/8/8/8/7k w - - 0 1',
    idealMoves: ['Kg7'],
    hint: 'king closer',
    phase: '1/2',
  },
  {
    fen: '5R2/8/8/8/8/8/4k1K1/8 w - - 6 4',
    idealMoves: ['Rf3'],
    hint: 'establish box',
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
    idealMoves: ['Rg4', 'Ra4'],
    hint: 'maximize black distance',
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
    idealMoves: ['Rg3'],
    hint: 'rook waiting move',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/8/5K1k/6R1/8 w - - 10 6',
    idealMoves: ['Ra2'],
    hint: 'maximize black distance',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/K7/7R/k7/8 w - - 0 1',
    idealMoves: ['Rc3'],
    hint: 'maximize black distance',
    phase: '2/2',
  },
  {
    fen: '8/2k5/R7/1K6/8/8/8/8 w - - 2 2',
    idealMoves: ['Kc5'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/2k5/1R6/2K5/8 w - - 4 3',
    idealMoves: ['Rd3'],
    hint: 'establish box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/4k3/R7/3K4/8/8 w - - 30 16',
    idealMoves: ['Rd4'],
    hint: 'establish box',
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
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/3k4/1K6/8/8/8/2R5 w - - 6 4',
    idealMoves: ['Rc5'],
    hint: 'establish box',
    phase: '2/2',
  },
  {
    fen: '8/8/8/1K6/3k4/8/8/2R5 w - - 6 4',
    idealMoves: ['Re1'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/1K6/3k4/8/8/8/8/2R5 w - - 10 6',
    idealMoves: ['Re1'],
    hint: 'maximize black distance',
    phase: '2/2',
  },
  {
    fen: '8/5k2/7R/6K1/8/8/8/8 w - - 2 2',
    idealMoves: ['Kf5'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/7k/1R6/5K2/8/8/8/8 w - - 4 3',
    idealMoves: ['Rg6'],
    hint: 'establish box',
    phase: '2/2',
  },
  {
    fen: '7k/8/R7/6K1/8/8/8/8 w - - 0 1',
    idealMoves: ['Kg6'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/k7/2R5/4K3/8/8/8 w - - 2 2',
    idealMoves: ['Kd5'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '6k1/8/7R/5K2/8/8/8/8 w - - 0 1',
    idealMoves: ['Kf6'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '8/8/8/8/2K5/2R5/8/1k6 w - - 0 1',
    idealMoves: ['Kb3'],
    hint: 'king closer',
    phase: '2/2',
  },
  {
    fen: '7k/R7/5K2/8/8/8/8/8 w - - 2 2',
    idealMoves: ['Kg6'],
    hint: 'king closer',
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
      ['Qc5'],
      ['Kf3', 'Kd3'],
      ['Qb4'],
      ['Ke3'],
      ['Qc4'],
      ['Kf3'],
      ['Qd4'],
      ['Kg3', 'Kg2', 'Ke2'],
      ['Qc3'],
      ['Kf2'],
      ['Qd3'],
      ['Kg2'],
      ['Qe3'],
      ['Kh2', 'Kh1', 'Kf1'],
      ['Qf3'],
      ['Kg1'],
      ['Qe2'],
      ['Kh1'],
      ['Kg4'],
      ['Kg1'],
      ['Kg3'],
      ['Kh1'],
      ['Qg2#'],
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
      'finish guarantee',
      'forcing check',
      'establish box',
      'rook waiting move',
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
      'two-square corner cage',
      'white king toward cage support',
      'white pieces off edge',
      'queen a knight move from black',
      'queen box size',
      'white king closer',
      'shorter queen move',
    ],
  )
  assert.deepEqual(
    rookWhiteRules.map(({ shortLabel }) => shortLabel),
    [
      'mate',
      'pieces safe',
      'no stalemate',
      'finish guarantee',
      'push with check',
      'establish box',
      'waiting move',
      'king closer',
      'rook farther',
    ],
  )
  assert.equal(rookWhiteRules[3]?.presentationRole, 'guard')
  assert.deepEqual(
    queenWhiteRules.slice(3).map(({ id, helpText }) => ({ id, helpText })),
    [
      {
        id: 'corner cage',
        helpText:
          'Build or preserve a corner-plus-adjacent-edge cage from which every legal Black reply remains in those two squares.',
      },
      {
        id: 'king to cage',
        helpText:
          "With a two-square corner cage, move White's king toward a mating-support square a knight's move from both the Queen and corner.",
      },
      {
        id: 'white pieces off edge',
        helpText: 'Minimize the number of White pieces on edge squares.',
      },
      {
        id: 'queen knight move',
        helpText: "Keep or place the Queen a knight's move from Black's king.",
      },
      {
        id: 'queen box size',
        helpText:
          "Minimize the shorter side of the board-edge rectangle bounded by the Queen's rank and file containing Black's king, then minimize its longer side.",
      },
      {
        id: 'king closer',
        helpText:
          "Minimize the resulting king-move distance to Black without entering the Queen's rank/file channel between the Queen and Black's king.",
      },
      {
        id: 'shorter queen move',
        helpText:
          'Among otherwise tied Queen moves, prefer fewer squares traversed.',
      },
    ],
  )
  assert.equal(
    queenWhiteRules.find(({ id }) => id === 'king closer')?.helpText,
    "Minimize the resulting king-move distance to Black without entering the Queen's rank/file channel between the Queen and Black's king.",
  )
  assert.deepEqual(
    rookWhiteRules.slice(3).map(({ id, helpText }) => ({ id, helpText })),
    [
      {
        id: 'finish guarantee',
        helpText:
          'The app filters out moves that could loop or draw by the fifty-move rule. You do not need to calculate this.',
      },
      {
        id: 'forcing check',
        helpText:
          "Check when every reply pushes Black farther from White's king.",
      },
      {
        id: 'establish box',
        helpText:
          'Use the Rook to make a phase 2 box. When Black is on the edge, shrink it.',
      },
      {
        id: 'rook waiting move',
        helpText:
          "When the kings are a knight's move apart, keep the box with a Rook move. Prefer White's king between Black's king and the Rook, without placing the Rook beside White's king.",
      },
      {
        id: 'king closer',
        helpText: "Move White's king closer to Black's king.",
      },
      {
        id: 'maximize black distance',
        helpText: "Keep the Rook farther from Black's king.",
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
    'Head toward the center, where Black has the most room to resist.',
  ])
  assert.deepEqual(rookRuleSet.help.blackPriorities, [
    'Return to the previous board position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Move toward the nearest box wall.',
    "If the Rook is diagonally beside White's king, chase it.",
    'Avoid giving White opposition.',
    'Move toward the Rook.',
  ])
  assert.deepEqual(queenRuleSet.help.notes, [
    "Phase 2 means the Queen's rank or file is strictly between the two kings on that axis.",
  ])
  assert.deepEqual(queenRuleSet.help.noteBoards, [])
  assert.deepEqual(rookRuleSet.help.notes, [
    "Phase 2 means the Rook's rank or file is strictly between the two kings on that axis.",
  ])
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
      'finish guarantee',
      'forcing check',
      'establish box',
      'rook waiting move',
      'king closer',
      'maximize black distance',
    ],
  )
  assert.equal(
    registeredRook.whiteRuleDescriptions[3]?.presentationRole,
    'guard',
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
    queenBoxShorterSide: 4,
    queenBoxLongerSide: 8,
    cageKingApproachPriority: 0,
    cageKingApproachDistance: null,
    cageKingApproachManhattanDistance: null,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 2,
    kingManhattanDistance: 2,
    queenMoveDistance: 4,
  })
  assert.deepEqual(edgeKnight, {
    matePenalty: 1,
    queenCapturePenalty: 0,
    stalematePenalty: 0,
    cagePenalty: 1,
    whitePieceEdgePenalty: 1,
    queenKnightMovePenalty: 0,
    queenBoxShorterSide: 5,
    queenBoxLongerSide: 7,
    cageKingApproachPriority: 0,
    cageKingApproachDistance: null,
    cageKingApproachManhattanDistance: null,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 2,
    kingManhattanDistance: 2,
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
    queenBoxShorterSide: 4,
    queenBoxLongerSide: 5,
    cageKingApproachPriority: 0,
    cageKingApproachDistance: null,
    cageKingApproachManhattanDistance: null,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 3,
    kingManhattanDistance: 3,
    queenMoveDistance: 5,
  })
  assert.deepEqual(largerBox, {
    matePenalty: 1,
    queenCapturePenalty: 0,
    stalematePenalty: 0,
    cagePenalty: 1,
    whitePieceEdgePenalty: 1,
    queenKnightMovePenalty: 0,
    queenBoxShorterSide: 4,
    queenBoxLongerSide: 6,
    cageKingApproachPriority: 0,
    cageKingApproachDistance: null,
    cageKingApproachManhattanDistance: null,
    whiteKingBetweenPiecesPenalty: 0,
    kingDistance: 3,
    kingManhattanDistance: 3,
    queenMoveDistance: 1,
  })
  assert.equal(compareQueenWhiteScores(smallerBox, largerBox), -1)
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

  const moveLengthFen = '8/8/8/7k/3Q4/8/8/K7 w - - 0 1'
  assert.equal(scoreQueenWhiteMove(moveLengthFen, 'Qd7').queenMoveDistance, 3)
  assert.equal(scoreQueenWhiteMove(moveLengthFen, 'Qf6').queenMoveDistance, 2)
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

test('queen channel geometry names the rank-or-file projection used by phase', () => {
  assert.equal(
    isQueenRankOrFileChannelBetween(
      { square: 'c2' },
      { square: 'h1' },
      { square: 'e5' },
    ),
    true,
  )
  assert.equal(
    isQueenRankOrFileChannelBetween(
      { square: 'a1' },
      { square: 'h1' },
      { square: 'e5' },
    ),
    false,
  )
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
  const cageApproach = scoreQueenWhiteMove(cageFen, 'Kg4')
  assert.equal(cageApproach.cageKingApproachPriority, 0)
  assert.equal(cageApproach.cageKingApproachDistance, 2)
  assert.equal(cageApproach.cageKingApproachManhattanDistance, 2)
  assert.equal(
    getQueenCageKingApproachDistance('g6', 'a3', 'h8'),
    null,
  )
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

test('queen replays all eight curated golden mating lines', () => {
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

test('rook waiting ranks preferred, fallback, and invalid moves', () => {
  const rook = getMateRuleSet('rook')
  const waitingFen = '8/8/8/8/8/8/KR6/2k5 w - - 0 1'
  assert.equal(scoreRookWhiteMove(waitingFen, 'Rb8').rookWaitingPenalty, 0)
  assert.equal(scoreRookWhiteMove(waitingFen, 'Ka3').rookWaitingPenalty, 2)

  const noBetweenFen = '8/5k2/7R/6K1/8/8/8/8 w - - 2 2'
  const waitingRook = scoreRookWhiteMove(noBetweenFen, 'Ra6')
  const progressingKing = scoreRookWhiteMove(noBetweenFen, 'Kf5')
  assert.equal(waitingRook.rookWaitingPenalty, 1)
  assert.equal(progressingKing.rookWaitingPenalty, 2)
  assert.equal(waitingRook.proofProgressPenalty, 1)
  assert.equal(progressingKing.proofProgressPenalty, 0)
  assert.deepEqual(rook.idealWhiteMoves(noBetweenFen), ['Kf5'])
  assert.equal(
    rook.explainWhiteMove(noBetweenFen, 'Ra6')?.id,
    'finish guarantee',
  )

  const phaseFen = '8/7k/1R6/5K2/8/8/8/8 w - - 4 3'
  const adjacentRook = scoreRookWhiteMove(phaseFen, 'Rg6')
  const closerKing = scoreRookWhiteMove(phaseFen, 'Kg5')
  assert.equal(adjacentRook.rookCapturePenalty, 0)
  assert.equal(adjacentRook.rookEstablishBoxPenalty, 0)
  assert.equal(adjacentRook.rookPhaseTwoBoxSize, 1)
  assert.equal(closerKing.rookEstablishBoxPenalty, 0)
  assert.equal(closerKing.rookPhaseTwoBoxSize, 2)
  assert.ok(compareRookWhiteScores(adjacentRook, closerKing) < 0)
})

test('rook establish-box scoring shrinks the box on the finishing edge', () => {
  const rook = getMateRuleSet('rook')
  const fen = '8/7k/1R6/5K2/8/8/8/8 w - - 4 3'
  const smallerAdjacent = scoreRookWhiteMove(fen, 'Rg6')
  const largerSafe = scoreRookWhiteMove(fen, 'Ra6')
  const kingMove = scoreRookWhiteMove(fen, 'Kg5')

  assert.equal(smallerAdjacent.rookEstablishBoxPenalty, 0)
  assert.equal(smallerAdjacent.rookPhaseTwoBoxSize, 1)
  assert.equal(largerSafe.rookEstablishBoxPenalty, 0)
  assert.equal(largerSafe.rookPhaseTwoBoxSize, 2)
  assert.equal(kingMove.rookEstablishBoxPenalty, 0)
  assert.equal(kingMove.rookPhaseTwoBoxSize, 2)
  assert.equal(rook.explainWhiteMove(fen, 'Rg6')?.id, 'establish box')
  assert.deepEqual(rook.idealWhiteMoves(fen), ['Rg6'])

  const shrinkFen = '7k/8/R7/6K1/8/8/8/8 w - - 0 1'
  const shrinkingRook = scoreRookWhiteMove(shrinkFen, 'Ra7')
  const progressingKing = scoreRookWhiteMove(shrinkFen, 'Kg6')
  assert.equal(shrinkingRook.rookPhaseTwoBoxSize, 1)
  assert.equal(shrinkingRook.rookFinishBoxSize, 1)
  assert.equal(shrinkingRook.proofProgressPenalty, 1)
  assert.equal(progressingKing.proofProgressPenalty, 0)
  assert.equal(
    rook.explainWhiteMove(shrinkFen, 'Ra7')?.id,
    'finish guarantee',
  )
  assert.deepEqual(rook.idealWhiteMoves(shrinkFen), ['Kg6'])

  const kingApproachFen = '8/8/k7/2R5/4K3/8/8/8 w - - 2 2'
  const kingApproach = scoreRookWhiteMove(kingApproachFen, 'Kd5')
  assert.equal(kingApproach.rookEstablishBoxPenalty, 0)
  assert.equal(kingApproach.rookPhaseTwoBoxSize, 2)
  assert.deepEqual(rook.idealWhiteMoves(kingApproachFen), ['Kd5'])
  assert.equal(
    rook.explainWhiteMove(kingApproachFen, 'Rc1')?.id,
    'finish guarantee',
  )
})

test('rook waiting does not activate for an unsafe box shrink alone', () => {
  const rook = getMateRuleSet('rook')
  const fen = '6k1/8/7R/5K2/8/8/8/8 w - - 0 1'

  assert.equal(scoreRookWhiteMove(fen, 'Ra6').rookWaitingPenalty, 0)
  assert.equal(scoreRookWhiteMove(fen, 'Kg5').rookWaitingPenalty, 0)
  assert.equal(scoreRookWhiteMove(fen, 'Ra6').proofProgressPenalty, 1)
  assert.equal(scoreRookWhiteMove(fen, 'Kf6').proofProgressPenalty, 0)
  assert.deepEqual(rook.idealWhiteMoves(fen), ['Kf6'])
  assert.equal(rook.explainWhiteMove(fen, 'Ra6')?.id, 'finish guarantee')

  const safeShrinkFen = '7k/8/R7/6K1/8/8/8/8 w - - 0 1'
  assert.equal(scoreRookWhiteMove(safeShrinkFen, 'Ra7').rookCapturePenalty, 0)
  assert.equal(scoreRookWhiteMove(safeShrinkFen, 'Kh5').rookWaitingPenalty, 0)
})

test('rook rejects forcing checks that give back forced-mate progress', () => {
  const rook = getMateRuleSet('rook')
  for (const [fen, check, tempo] of [
    ['8/5k2/R7/5K2/8/8/8/8 w - - 0 1', 'Ra7+', 'Re6'],
    ['8/6k1/R7/6K1/8/8/8/8 w - - 0 1', 'Ra7+', 'Rf6'],
  ] as const) {
    assert.equal(scoreRookWhiteMove(fen, check).forcingCheckPenalty, 0)
    assert.equal(scoreRookWhiteMove(fen, tempo).rookWaitingPenalty, 0)
    assert.equal(scoreRookWhiteMove(fen, check).proofProgressPenalty, 1)
    assert.equal(scoreRookWhiteMove(fen, tempo).proofProgressPenalty, 0)
    assert.deepEqual(rook.idealWhiteMoves(fen), [tempo])
    assert.equal(rook.explainWhiteMove(fen, check)?.id, 'finish guarantee')
  }

  const afterTempo = '8/7k/5R2/6K1/8/8/8/8 w - - 2 2'
  assert.deepEqual(rook.idealWhiteMoves(afterTempo), ['Rf7+'])
  assert.equal(rook.currentWhiteHint(afterTempo)?.id, 'forcing check')

  const finishFen = '8/8/8/8/6R1/5K1k/8/8 w - - 18 10'
  assert.deepEqual(rook.idealWhiteMoves(finishFen), ['Ra4'])
  assert.equal(rook.currentWhiteHint(finishFen)?.id, 'maximize black distance')

  const edgeFen = '5k2/6R1/5K2/8/8/8/8/8 w - - 4 3'
  assert.deepEqual(rook.idealWhiteMoves(edgeFen), ['Rg1'])
  assert.equal(rook.currentWhiteHint(edgeFen)?.id, 'maximize black distance')
})

test('rook best moves are explained only by registered human rules', () => {
  const rook = getMateRuleSet('rook')
  const registeredIds = new Set(rook.whiteRuleDescriptions.map(({ id }) => id))
  const fens = [
    ...ROOK_WHITE_FIXTURES.map(({ fen }) => fen),
    '2R5/1k6/8/3K4/8/8/8/8 w - - 8 5',
  ]

  for (const fen of fens) {
    for (const san of getChess(fen).moves()) {
      const reason = rook.explainWhiteMove(fen, san)
      assert.ok(reason === undefined || registeredIds.has(reason.id), `${fen}; ${san}`)
    }
  }

  const rc1Fen = '2R5/1k6/8/3K4/8/8/8/8 w - - 8 5'
  assert.deepEqual(rook.idealWhiteMoves(rc1Fen), ['Rc5'])
  assert.equal(
    rook.explainWhiteMove(rc1Fen, 'Rc1')?.id,
    'finish guarantee',
  )
})

test('rook waiting geometry remains literal behind the proof gate', () => {
  const rook = getMateRuleSet('rook')
  const cases = [
    {
      fen: '8/8/3k4/1K6/8/8/8/2R5 w - - 6 4',
      preferred: 'Rc2',
      rejected: 'Rc8',
      ideal: 'Rc5',
    },
    {
      fen: '8/8/8/1K6/3k4/8/8/2R5 w - - 6 4',
      preferred: 'Rc8',
      rejected: 'Rc2',
      ideal: 'Re1',
    },
  ] as const

  for (const { fen, preferred, rejected, ideal } of cases) {
    assert.equal(scoreRookWhiteMove(fen, preferred).rookWaitingPenalty, 0)
    assert.equal(scoreRookWhiteMove(fen, rejected).rookWaitingPenalty, 1)
    assert.equal(scoreRookWhiteMove(fen, preferred).proofProgressPenalty, 1)
    assert.equal(scoreRookWhiteMove(fen, ideal).proofProgressPenalty, 0)
    assert.deepEqual(rook.idealWhiteMoves(fen), [ideal])
    assert.equal(rook.explainWhiteMove(fen, preferred)?.id, 'finish guarantee')

    const expected = getChess(fen)
    expected.move(ideal)
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const transformedIdeal = rook.idealWhiteMoves(transformedFen)
      assert.equal(transformedIdeal.length, 1, `${fen}; ${transform.name}`)
      const transformedResult = getChess(transformedFen)
      transformedResult.move(transformedIdeal[0]!)
      assert.equal(
        positionKey(transformedResult.fen()),
        positionKey(transformFen(expected.fen(), transform)),
        `${fen}; ${transform.name}`,
      )
    }
  }

  const adjacentFen = '8/1K6/3k4/8/8/8/8/2R5 w - - 10 6'
  assert.equal(scoreRookWhiteMove(adjacentFen, 'Rc7').rookWaitingPenalty, 2)
  assert.equal(scoreRookWhiteMove(adjacentFen, 'Rc7').rookEstablishBoxPenalty, 0)
  assert.equal(scoreRookWhiteMove(adjacentFen, 'Rc8').rookWaitingPenalty, 2)
  assert.equal(scoreRookWhiteMove(adjacentFen, 'Rc8').rookEstablishBoxPenalty, 0)
  assert.equal(scoreRookWhiteMove(adjacentFen, 'Rc2').rookWaitingPenalty, 1)
  assert.equal(scoreRookWhiteMove(adjacentFen, 'Rc2').proofProgressPenalty, 1)
  assert.deepEqual(rook.idealWhiteMoves(adjacentFen), ['Re1'])
})

test('rook recommendations preserve D4 symmetry', () => {
  const rook = getMateRuleSet('rook')
  for (const { fen, idealMoves } of ROOK_WHITE_FIXTURES) {
    if (idealMoves.length !== 1) continue
    const san = idealMoves[0]!
    const expected = getChess(fen)
    expected.move(san)
    for (const transform of SQUARE_TRANSFORMS) {
      const transformedFen = transformFen(fen, transform)
      const transformedIdeal = rook.idealWhiteMoves(transformedFen)
      assert.equal(transformedIdeal.length, 1, `${fen}; ${transform.name}`)
      const transformedResult = getChess(transformedFen)
      transformedResult.move(transformedIdeal[0]!)
      assert.equal(
        positionKey(transformedResult.fen()),
        positionKey(transformFen(expected.fen(), transform)),
        `${fen}; ${transform.name}`,
      )
    }
  }
})

test('rook king proximity requires componentwise axis progress', () => {
  const rook = getMateRuleSet('rook')
  const fen = '8/8/8/8/2K5/2R5/8/1k6 w - - 0 1'
  const regressingKing = scoreRookWhiteMove(fen, 'Kd3')
  const productiveKing = scoreRookWhiteMove(fen, 'Kb4')
  const progressingKing = scoreRookWhiteMove(fen, 'Kb3')
  const neutralRook = scoreRookWhiteMove(fen, 'Rh3')

  assert.equal(regressingKing.kingApproachPriority, 2)
  assert.equal(regressingKing.kingDistance, 2)
  assert.equal(regressingKing.kingManhattanDistance, 4)
  assert.equal(productiveKing.kingApproachPriority, 0)
  assert.equal(productiveKing.kingDistance, 3)
  assert.equal(productiveKing.kingManhattanDistance, 3)
  assert.equal(neutralRook.kingApproachPriority, 1)
  assert.ok(compareRookWhiteScores(productiveKing, neutralRook) < 0)
  assert.ok(compareRookWhiteScores(neutralRook, regressingKing) < 0)
  assert.equal(productiveKing.proofProgressPenalty, 1)
  assert.equal(progressingKing.proofProgressPenalty, 0)
  assert.deepEqual(rook.idealWhiteMoves(fen), ['Kb3'])
  assert.equal(rook.explainWhiteMove(fen, 'Kd3')?.id, 'finish guarantee')

  const sourceFen = '7k/R7/5K2/8/8/8/8/8 w - - 2 2'
  assert.equal(scoreRookWhiteMove(sourceFen, 'Kg6').kingApproachPriority, 0)
  assert.deepEqual(rook.idealWhiteMoves(sourceFen), ['Kg6'])

  const validApproachFen = '8/8/k7/2R5/4K3/8/8/8 w - - 2 2'
  assert.equal(
    scoreRookWhiteMove(validApproachFen, 'Kd5').kingApproachPriority,
    0,
  )
})

test('rook production scoring has no box-size literal or rank-first helper', () => {
  const source = readFileSync(
    new URL('./majorPieces.ts', import.meta.url),
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

  assert.equal(totalPlies, 746)
  assert.equal(maxPlies, 25)
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify({ starts, lines }))
      .digest('hex'),
    'ca12a0eaf60b59c64c082ec69911ff98442016cb131d657ff7c19e938a0c6f82',
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
      white: ['Re1'],
      blackFen: '8/5k2/8/5K2/8/8/8/4R3 b - - 1 1',
      black: ['Kf8', 'Kg7'],
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
