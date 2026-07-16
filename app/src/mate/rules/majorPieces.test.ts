import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, positionKey } from '../chess'
import {
  compareQueenBlackScores,
  compareQueenWhiteScores,
  compareRookBlackScores,
  compareRookWhiteScores,
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
    idealMoves: ['Rf3'],
    hint: 'king closer',
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
    idealMoves: ['Rc4'],
    hint: 'establish box',
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

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves are still tied after a priority, they all remain best moves."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

test('queen and rook preserve chess420 white rule order, labels, and help', () => {
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
      'king closer',
      'maximize black distance',
    ],
  )
  assert.deepEqual(
    queenWhiteRules.map(({ shortLabel }) => shortLabel),
    [
      'mate',
      'queen safe',
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
      'rook safe',
      'no stalemate',
      'establish box',
      'forcing check',
      'rook waiting move',
      'rook waiting distance',
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
    '',
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
    rookWhiteRules.map(({ id }) => id),
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
    rookBoxSize: 0,
    forcingCheckPenalty: 1,
    rookPhaseTwoWaitingPenalty: 0,
    rookPhaseTwoWaitingDistanceScore: 0,
    rookBoxPreservedPenalty: 0,
    rookBlackDistanceScore: -6,
    kingRookLinePenalty: 0,
    kingDistance: 5,
  })
  assert.deepEqual(missed, {
    matePenalty: 1,
    rookCapturePenalty: 0,
    stalematePenalty: 0,
    rookBoxEstablishedPenalty: 1,
    rookBoxSize: 0,
    forcingCheckPenalty: 1,
    rookPhaseTwoWaitingPenalty: 0,
    rookPhaseTwoWaitingDistanceScore: 0,
    rookBoxPreservedPenalty: 0,
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
    rookBoxSize: 0,
    forcingCheckPenalty: 1,
    rookPhaseTwoWaitingPenalty: 0,
    rookPhaseTwoWaitingDistanceScore: -3,
    rookBoxPreservedPenalty: 0,
    rookBlackDistanceScore: -4,
    kingRookLinePenalty: 0,
    kingDistance: 3,
  })
  assert.deepEqual(far, near)
  assert.equal(compareRookWhiteScores(near, far), 0)
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
