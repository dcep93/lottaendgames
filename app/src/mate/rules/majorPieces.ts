import {
  edgeDistance,
  findPiece,
  getChess,
  hasDirectKingOpposition,
  isDiagonalKingMove,
  isKnightMove,
  kingDistance,
  kingWalkCenterDistance,
  manhattanDistance,
  positionKey,
} from '../chess'
import {
  blackCanTakeWhiteMajorPiece,
  getAxisDistance,
  getMajorEndgamePhase,
  getMajorEndgamePhaseLabel,
  getQueenBoxDimensions,
  getQueenTwoSquareCage,
  getRookBox,
  isQueenTighterChannelBetween,
} from './majorPieceGeometry'
import { compareScoresByRules, selectIdealMoves } from './selection'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
} from './types'
import {
  rookStrategyRules,
  scoreRookStrategyMove,
  type RookStrategyScore,
} from './rookStrategy'

export type QueenWhiteMoveScore = {
  readonly matePenalty: number
  readonly queenCapturePenalty: number
  readonly stalematePenalty: number
  readonly cagePenalty: number
  readonly whitePieceEdgePenalty: number
  readonly queenKnightMovePenalty: number
  readonly queenBoxShorterSide: number
  readonly queenBoxLongerSide: number
  readonly whiteKingBetweenPiecesPenalty: number
  readonly kingDistance: number | null
  readonly kingManhattanDistance: number | null
}

export type QueenBlackMoveScore = {
  readonly captureQueenPenalty: number
  readonly centerDistance: number
}

export type RookBlackMoveScore = {
  readonly captureRookPenalty: number
  readonly cutLineDistance: number
  readonly diagonalAdjacentRookDistance: number
  readonly rookOppositionPenalty: number
  readonly rookDistance: number
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. Moves tied at one priority remain candidates for the next priority."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

const RETURN_POSITION_PRIORITY =
  'Return to the previous board position when a legal reply can recreate it.'
const CAPTURE_LOOSE_PIECE_PRIORITY = "Take a piece if White isn't looking."
const QUEEN_CORNER_CAGE_HELP =
  'Keep Black confined to two squares near a corner.'
const QUEEN_OFF_EDGE_HELP = "Keep White's pieces off edge squares."
const QUEEN_KNIGHT_MOVE_HELP =
  "Keep the queen a knight's move from Black's king."
const QUEEN_BOX_SIZE_HELP =
  "Shrink the box's shorter side before its longer side."
const QUEEN_KING_CLOSER_HELP =
  "Move White's king closer without crossing the tighter side of the queen's box."
const queenHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    RETURN_POSITION_PRIORITY,
    CAPTURE_LOOSE_PIECE_PRIORITY,
    'Move toward the center, where Black has the most room to resist.',
  ],
  notes: [],
  noteBoards: [],
}

const rookHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    RETURN_POSITION_PRIORITY,
    CAPTURE_LOOSE_PIECE_PRIORITY,
    'Move toward the nearest box wall.',
    "If the rook is diagonally beside White's king, chase it.",
    'Avoid giving White opposition.',
    'Move toward the rook.',
  ],
  notes: [
    'The method: box Black in, force opposition, shrink the box, and repeat.',
    "Phase 2 begins when the rook's rank or file is between the kings, boxing Black onto one side.",
  ],
  noteBoards: [
    {
      id: 'rook-phase-two-box',
      title: 'phase 2 box',
      caption:
        "The kings are in opposition, and the rook's file boxes Black onto the highlighted side.",
      layout: { files: 6, ranks: 6, fileOffset: 0 },
      pieces: [
        { square: 'b3', piece: 'K' },
        { square: 'c1', piece: 'R' },
        { square: 'd3', piece: 'k' },
      ],
      highlights: [
        'd1',
        'e1',
        'f1',
        'd2',
        'e2',
        'f2',
        'd3',
        'e3',
        'f3',
        'd4',
        'e4',
        'f4',
        'd5',
        'e5',
        'f5',
        'd6',
        'e6',
        'f6',
      ].map((square) => ({ square, kind: 'box' as const })),
    },
  ],
}

function selectBestMoves<Score>(
  moves: readonly string[],
  scoreMove: (san: string) => Score,
  compareScores: (first: Score, second: Score) => number,
): string[] {
  const firstMove = moves[0]
  if (firstMove === undefined) {
    return []
  }
  const scoredMoves = moves.map((san) => ({ san, score: scoreMove(san) }))
  let bestScore = scoredMoves[0].score
  for (const candidate of scoredMoves.slice(1)) {
    if (compareScores(candidate.score, bestScore) < 0) {
      bestScore = candidate.score
    }
  }
  return scoredMoves
    .filter((candidate) => compareScores(candidate.score, bestScore) === 0)
    .map(({ san }) => san)
}

export function scoreQueenWhiteMove(
  fen: string,
  san: string,
): QueenWhiteMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteQueen = findPiece(resultFen, 'w', 'q')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const resultCage = getQueenTwoSquareCage(resultFen)
  const queenBox =
    whiteQueen && blackKing
      ? getQueenBoxDimensions(whiteQueen.square, blackKing.square)
      : null
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    queenCapturePenalty: blackCanTakeWhiteMajorPiece(resultFen, 'q') ? 1 : 0,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    cagePenalty: resultCage ? 0 : 1,
    whitePieceEdgePenalty: [whiteQueen, whiteKing].filter(
      (piece) => piece && edgeDistance(piece.square) === 0,
    ).length,
    queenKnightMovePenalty:
      whiteQueen &&
      blackKing &&
      isKnightMove(whiteQueen.square, blackKing.square)
        ? 0
        : 1,
    queenBoxShorterSide: queenBox?.shorterSide ?? 99,
    queenBoxLongerSide: queenBox?.longerSide ?? 99,
    whiteKingBetweenPiecesPenalty:
      move.piece === 'k' &&
      whiteQueen &&
      whiteKing &&
      blackKing &&
      isQueenTighterChannelBetween(whiteKing, whiteQueen, blackKing)
        ? 1
        : 0,
    kingDistance:
      whiteKing && blackKing
        ? kingDistance(whiteKing.square, blackKing.square)
        : null,
    kingManhattanDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : null,
  }
}

export const queenWhiteRules: readonly OrderedRule<QueenWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    helpText: '',
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'queen safe',
    shortLabel: 'pieces safe',
    helpText: '',
    compare: (first, second) =>
      first.queenCapturePenalty - second.queenCapturePenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'corner cage',
    shortLabel: 'two-square corner cage',
    helpText: QUEEN_CORNER_CAGE_HELP,
    compare: (first, second) => first.cagePenalty - second.cagePenalty,
  },
  {
    id: 'white pieces off edge',
    shortLabel: 'white pieces off edge',
    helpText: QUEEN_OFF_EDGE_HELP,
    compare: (first, second) =>
      first.whitePieceEdgePenalty - second.whitePieceEdgePenalty,
  },
  {
    id: 'queen knight move',
    shortLabel: 'queen a knight move from black',
    helpText: QUEEN_KNIGHT_MOVE_HELP,
    compare: (first, second) =>
      first.queenKnightMovePenalty - second.queenKnightMovePenalty,
  },
  {
    id: 'queen box size',
    shortLabel: 'queen box size',
    helpText: QUEEN_BOX_SIZE_HELP,
    compare: (first, second) =>
      first.queenBoxShorterSide - second.queenBoxShorterSide ||
      first.queenBoxLongerSide - second.queenBoxLongerSide,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText: QUEEN_KING_CLOSER_HELP,
    applies: (score) =>
      score.kingDistance !== null && score.kingManhattanDistance !== null,
    compare: (first, second) =>
      first.whiteKingBetweenPiecesPenalty -
        second.whiteKingBetweenPiecesPenalty ||
      first.kingDistance! - second.kingDistance! ||
      first.kingManhattanDistance! - second.kingManhattanDistance!,
  },
]

export function compareQueenWhiteScores(
  first: QueenWhiteMoveScore,
  second: QueenWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, queenWhiteRules)
}

export function getIdealQueenWhiteMoves(fen: string): string[] {
  const chess = getChess(fen)
  const moves = chess.moves()
  if (chess.turn() !== 'w' || moves.length === 0) {
    return moves
  }
  return [...selectIdealMoves(
    moves.map((san) => ({ san, score: scoreQueenWhiteMove(fen, san) })),
    queenWhiteRules,
  )]
}

export type RookWhiteMoveScore = RookStrategyScore

export const rookWhiteRules = rookStrategyRules

export function scoreRookWhiteMove(
  fen: string,
  san: string,
): RookWhiteMoveScore {
  return scoreRookStrategyMove(fen, san)
}

export function compareRookWhiteScores(
  first: RookWhiteMoveScore,
  second: RookWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, rookWhiteRules)
}

export function getIdealRookWhiteMoves(fen: string): string[] {
  const chess = getChess(fen)
  const moves = chess.moves()
  if (chess.turn() !== 'w' || moves.length === 0) {
    return moves
  }
  return [...selectIdealMoves(
    moves.map((san) => ({ san, score: scoreRookWhiteMove(fen, san) })),
    rookWhiteRules,
  )]
}

export function scoreQueenBlackMove(
  fen: string,
  san: string,
): QueenBlackMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const blackKing = findPiece(chess.fen(), 'b', 'k')
  return {
    captureQueenPenalty: move.captured === 'q' ? 0 : 1,
    centerDistance: blackKing ? kingWalkCenterDistance(blackKing.square) : 99,
  }
}

export function compareQueenBlackScores(
  first: QueenBlackMoveScore,
  second: QueenBlackMoveScore,
): number {
  return (
    first.captureQueenPenalty - second.captureQueenPenalty ||
    first.centerDistance - second.centerDistance
  )
}

export function getIdealQueenBlackMoves(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  return selectBestMoves(
    moves,
    (san) => scoreQueenBlackMove(fen, san),
    compareQueenBlackScores,
  )
}

export function scoreRookBlackMove(
  fen: string,
  san: string,
): RookBlackMoveScore {
  const startingBlackKing = findPiece(fen, 'b', 'k')
  const startingWhiteRook = findPiece(fen, 'w', 'r')
  const startingWhiteKing = findPiece(fen, 'w', 'k')
  const startingRookBox =
    startingBlackKing && startingWhiteRook && startingWhiteKing
      ? getRookBox(
          startingWhiteRook,
          startingWhiteKing,
          startingBlackKing,
        )
      : null
  const whiteKingRookDiagonalAdjacent =
    startingWhiteKing && startingWhiteRook
      ? isDiagonalKingMove(startingWhiteKing.square, startingWhiteRook.square)
      : false
  const startsWithOpposition =
    startingWhiteKing && startingBlackKing
      ? hasDirectKingOpposition(
          startingWhiteKing.square,
          startingBlackKing.square,
        )
      : false
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteRook = findPiece(resultFen, 'w', 'r')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const rookDistance =
    whiteRook && blackKing
      ? manhattanDistance(blackKing.square, whiteRook.square)
      : 99
  const createsOpposition = Boolean(
    !whiteKingRookDiagonalAdjacent &&
      !startsWithOpposition &&
      whiteKing &&
      blackKing &&
      hasDirectKingOpposition(whiteKing.square, blackKing.square),
  )
  return {
    captureRookPenalty: move.captured === 'r' ? 0 : 1,
    cutLineDistance:
      startingRookBox &&
      startingRookBox.strongestCuts.length > 0 &&
      startingWhiteRook &&
      blackKing
        ? Math.min(
            ...startingRookBox.strongestCuts.map((cut) =>
              getAxisDistance(
                blackKing.square,
                startingWhiteRook.square,
                cut.axis,
              ),
            ),
          )
        : 0,
    diagonalAdjacentRookDistance: whiteKingRookDiagonalAdjacent
      ? rookDistance
      : 0,
    rookOppositionPenalty: createsOpposition ? 1 : 0,
    rookDistance,
  }
}

export function compareRookBlackScores(
  first: RookBlackMoveScore,
  second: RookBlackMoveScore,
): number {
  return (
    first.captureRookPenalty - second.captureRookPenalty ||
    first.cutLineDistance - second.cutLineDistance ||
    first.diagonalAdjacentRookDistance -
      second.diagonalAdjacentRookDistance ||
    first.rookOppositionPenalty - second.rookOppositionPenalty ||
    first.rookDistance - second.rookDistance
  )
}

export function getIdealRookBlackMoves(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  return selectBestMoves(
    moves,
    (san) => scoreRookBlackMove(fen, san),
    compareRookBlackScores,
  )
}

export function getEndgameReturnToPositionMoves(
  fen: string,
  previousTurnFen: string | undefined,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  if (!previousTurnFen) {
    return []
  }
  const previousPositionKey = positionKey(previousTurnFen)
  return moves.filter((san) => {
    const nextChess = getChess(fen)
    const move = nextChess.move(san)
    return move !== null && positionKey(nextChess.fen()) === previousPositionKey
  })
}

function getMajorBlackCandidates(
  fen: string,
  previousTurnFen: string | undefined,
  pieceType: 'q' | 'r',
): OpponentCandidates {
  const moves = getChess(fen).moves()
  if (moves.length === 0) {
    return { moves, idealMoves: [] }
  }
  const returnMoves = getEndgameReturnToPositionMoves(
    fen,
    previousTurnFen,
    moves,
  )
  if (returnMoves.length > 0) {
    return { moves, idealMoves: returnMoves }
  }
  return {
    moves,
    idealMoves:
      pieceType === 'q'
        ? getIdealQueenBlackMoves(fen, moves)
        : getIdealRookBlackMoves(fen, moves),
  }
}

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

export const queenRuleSet: MateRuleSet<QueenWhiteMoveScore> = {
  id: 'queen',
  phase: (fen) => getMajorEndgamePhaseLabel(fen, 'q'),
  scoreWhite: scoreQueenWhiteMove,
  whiteRules: queenWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: (fen, previousTurnFen) =>
    getMajorBlackCandidates(fen, previousTurnFen, 'q'),
  help: queenHelp,
}

export const rookRuleSet: MateRuleSet<RookWhiteMoveScore> = {
  id: 'rook',
  phase: (fen) => getMajorEndgamePhaseLabel(fen, 'r'),
  scoreWhite: scoreRookWhiteMove,
  whiteRules: rookWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: (fen, previousTurnFen) =>
    getMajorBlackCandidates(fen, previousTurnFen, 'r'),
  help: rookHelp,
}

export {
  getMajorEndgamePhase,
  getQueenTwoSquareCage,
}
