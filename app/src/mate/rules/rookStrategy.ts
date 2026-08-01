import type { Square } from 'chess.js'
import {
  findPiece,
  getChess,
  hasDirectKingOpposition,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squareCoordinates,
} from '../chess'
import {
  blackCanTakeWhiteMajorPiece,
  getRookBoxFromFen,
} from './majorPieceGeometry'
import type { RookBox } from './majorPieceGeometry'
import type { OrderedRule, ScoredMove } from './types'

export type RookStrategyScore = {
  readonly matePenalty: number
  readonly rookCapturePenalty: number
  readonly stalematePenalty: number
  readonly keepBoxPenalty: number
  readonly rookBoxBlackDistanceScore: number
  readonly resultHasBox: boolean
  readonly noBoxRookMovePenalty: number
  readonly noBoxRookBlackDistanceScore: number
  readonly waitingMoveApplies: boolean
  readonly waitingMovePenalty: number
  readonly waitingMoveBlackDistanceScore: number
  readonly shrinkBoxPenalty: number
  readonly shrinkBoxRoom: number
  readonly kingOppositionPenalty: number
  readonly kingProximityPriority: number
  readonly kingDistance: number
  readonly kingManhattanDistance: number
}

const ROOK_BOX_HELP =
  'Create, keep, and shrink Black’s box against the board edge. Move an attacked rook as far away as the box allows. If no box is possible, move the rook as far from Black as possible.'
const WAITING_MOVE_HELP =
  "When the kings are a knight's move apart, or every box shrink hangs the rook, keep the box and move the rook, as far from Black as possible, but closer to White's king, but not touching White's king."
const KING_CLOSER_HELP =
  "Move White's king closer to Black's king, preferably without taking opposition."

export const rookStrategyRules: readonly OrderedRule<RookStrategyScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    helpText: '',
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'rook safe',
    shortLabel: 'pieces safe',
    helpText: '',
    compare: (first, second) =>
      first.rookCapturePenalty - second.rookCapturePenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'rook box',
    shortLabel: 'rook box',
    helpText: ROOK_BOX_HELP,
    subpriorities: [
      {
        compare: (first, second) =>
          first.keepBoxPenalty - second.keepBoxPenalty,
      },
      {
        compare: (first, second) =>
          first.shrinkBoxPenalty - second.shrinkBoxPenalty ||
          first.shrinkBoxRoom - second.shrinkBoxRoom,
      },
      {
        compare: (first, second) =>
          first.rookBoxBlackDistanceScore -
          second.rookBoxBlackDistanceScore,
      },
      {
        when: (scores) =>
          scores.every(({ resultHasBox }) => !resultHasBox),
        compare: (first, second) =>
          first.noBoxRookMovePenalty - second.noBoxRookMovePenalty ||
          first.noBoxRookBlackDistanceScore -
            second.noBoxRookBlackDistanceScore,
      },
    ],
  },
  {
    id: 'waiting move',
    shortLabel: 'waiting move',
    helpText: WAITING_MOVE_HELP,
    applies: (score) => score.waitingMoveApplies,
    compare: (first, second) =>
      first.waitingMovePenalty - second.waitingMovePenalty ||
      first.waitingMoveBlackDistanceScore -
        second.waitingMoveBlackDistanceScore,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText: KING_CLOSER_HELP,
    compare: (first, second) =>
      first.kingProximityPriority - second.kingProximityPriority ||
      first.kingOppositionPenalty - second.kingOppositionPenalty ||
      first.kingDistance - second.kingDistance ||
      first.kingManhattanDistance - second.kingManhattanDistance,
  },
]

export function scoreRookStrategyMove(
  fen: string,
  san: string,
): RookStrategyScore {
  return scoreRookStrategyMoveWithContext(
    fen,
    san,
    positionNeedsRookWaitingMove(fen),
  )
}

export function scoreRookStrategyCandidates(
  fen: string,
  moves: readonly string[],
): readonly ScoredMove<RookStrategyScore>[] {
  const needsWaitingMove = positionNeedsRookWaitingMove(fen)
  return moves.map((san) => ({
    san,
    score: scoreRookStrategyMoveWithContext(
      fen,
      san,
      needsWaitingMove,
    ),
  }))
}

function scoreRookStrategyMoveWithContext(
  fen: string,
  san: string,
  needsWaitingMove: boolean,
): RookStrategyScore {
  const beforeRook = findPiece(fen, 'w', 'r')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeBox = getRookBoxFromFen(fen)
  const beforeRookAttacked = Boolean(
    beforeRook &&
      beforeBlackKing &&
      kingDistance(beforeBlackKing.square, beforeRook.square) === 1,
  )
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const whiteRook = findPiece(resultFen, 'w', 'r')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  const resultBox = getRookBoxFromFen(resultFen)
  const rookIsSafe = !blackCanTakeWhiteMajorPiece(resultFen, 'r')
  const blackReplies = chess.isCheck() ? chess.moves() : []
  const checkingSqueezeReplyRooms =
    move.piece === 'r' &&
    beforeBox.size !== null &&
    rookIsSafe &&
    blackReplies.length > 0
      ? blackReplies.map((blackSan) => {
          const reply = getChess(resultFen)
          reply.move(blackSan)
          return getSameEdgeShrinkRoom(
            beforeBox,
            getRookBoxFromFen(reply.fen()),
          )
        })
      : []
  const forcedCheckingSqueezeRoom =
    checkingSqueezeReplyRooms.length > 0 &&
    checkingSqueezeReplyRooms.every(
      (room): room is number => room !== null,
    )
      ? Math.max(...checkingSqueezeReplyRooms)
      : null
  const directShrinkRoom =
    move.piece === 'r'
      ? getSameEdgeShrinkRoom(beforeBox, resultBox)
      : null
  const shrinkRoom = forcedCheckingSqueezeRoom ?? directShrinkRoom
  const preservesStrongestWall = retainsStrongestEdge(
    beforeBox,
    resultBox,
  )
  const createsBox = beforeBox.size === null && resultBox.size !== null
  const shrinksExistingBox =
    beforeBox.size !== null && shrinkRoom !== null
  const keepsExistingBox =
    beforeBox.size === null || shrinksExistingBox || preservesStrongestWall
  const satisfiesBoxRule =
    beforeBox.size === null ? createsBox : keepsExistingBox
  const resultHasBox =
    forcedCheckingSqueezeRoom !== null || resultBox.size !== null
  const baseWaitingMove = Boolean(
    needsWaitingMove &&
      move.piece === 'r' &&
      move.captured === undefined &&
      !chess.isCheck() &&
      rookIsSafe &&
      keepsExistingBox &&
      beforeRook &&
      beforeBlackKing &&
      whiteRook &&
      whiteKing &&
      blackKing &&
      kingDistance(whiteRook.square, whiteKing.square) > 1 &&
      kingDistance(whiteRook.square, whiteKing.square) <
        kingDistance(whiteRook.square, blackKing.square),
  )
  const waitingMovePriority = !needsWaitingMove
    ? 0
    : baseWaitingMove
      ? 0
      : 1
  const waitingMoveBlackDistanceScore =
    baseWaitingMove && whiteRook && blackKing
      ? -(
          kingDistance(whiteRook.square, blackKing.square) * 16 +
          manhattanDistance(whiteRook.square, blackKing.square)
        )
      : 0
  const noBoxRookMove = Boolean(
    move.piece === 'r' && whiteRook && blackKing,
  )
  const noBoxRookBlackDistanceScore =
    noBoxRookMove && whiteRook && blackKing
      ? -(
          kingDistance(whiteRook.square, blackKing.square) * 16 +
          manhattanDistance(whiteRook.square, blackKing.square)
        )
      : 0
  const kingGetsCloser = Boolean(
    move.piece === 'k' &&
      beforeWhiteKing &&
      beforeBlackKing &&
      whiteKing &&
      blackKing &&
      movesKingCloserWithoutAxisRegression(
        beforeWhiteKing.square,
        whiteKing.square,
        blackKing.square,
      ),
  )
  return {
    matePenalty: chess.isCheckmate() ? 0 : 1,
    rookCapturePenalty: rookIsSafe ? 0 : 1,
    stalematePenalty: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    keepBoxPenalty: satisfiesBoxRule ? 0 : 1,
    rookBoxBlackDistanceScore:
      beforeBox.size !== null &&
      beforeRookAttacked &&
      !needsWaitingMove &&
      move.piece === 'r' &&
      rookIsSafe &&
      keepsExistingBox &&
      whiteRook &&
      blackKing
        ? -(
            kingDistance(whiteRook.square, blackKing.square) * 16 +
            manhattanDistance(whiteRook.square, blackKing.square)
          )
        : 0,
    resultHasBox,
    noBoxRookMovePenalty: noBoxRookMove ? 0 : 1,
    noBoxRookBlackDistanceScore,
    waitingMoveApplies: needsWaitingMove,
    waitingMovePenalty: waitingMovePriority,
    waitingMoveBlackDistanceScore,
    shrinkBoxPenalty: shrinksExistingBox ? 0 : 1,
    shrinkBoxRoom: shrinkRoom ?? 15,
    kingOppositionPenalty:
      move.piece === 'k' &&
      whiteKing &&
      blackKing &&
      hasDirectKingOpposition(whiteKing.square, blackKing.square)
        ? 1
        : 0,
    kingProximityPriority:
      move.piece !== 'k' ? 1 : kingGetsCloser ? 0 : 2,
    kingDistance:
      whiteKing && blackKing
        ? kingDistance(whiteKing.square, blackKing.square)
        : 8,
    kingManhattanDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : 16,
  }
}

function positionNeedsRookWaitingMove(fen: string): boolean {
  const beforeRook = findPiece(fen, 'w', 'r')
  const beforeWhiteKing = findPiece(fen, 'w', 'k')
  const beforeBlackKing = findPiece(fen, 'b', 'k')
  const beforeBox = getRookBoxFromFen(fen)
  return Boolean(
    beforeRook &&
      beforeWhiteKing &&
      beforeBlackKing &&
      beforeBox.size !== null &&
      (isKnightMove(beforeWhiteKing.square, beforeBlackKing.square) ||
        everyDirectRookShrinkHangs(fen, beforeBox)),
  )
}

function everyDirectRookShrinkHangs(
  fen: string,
  beforeBox: RookBox,
): boolean {
  const shrinkingResults = getChess(fen)
    .moves()
    .flatMap((san) => {
      const candidate = getChess(fen)
      const move = candidate.move(san)
      if (move?.piece !== 'r') {
        return []
      }
      const resultFen = candidate.fen()
      const shrinkRoom = getSameEdgeShrinkRoom(
        beforeBox,
        getRookBoxFromFen(resultFen),
      )
      return shrinkRoom !== null
        ? [blackCanTakeWhiteMajorPiece(resultFen, 'r')]
        : []
    })

  return (
    shrinkingResults.length > 0 &&
    shrinkingResults.every((hangsRook) => hangsRook)
  )
}

function getSameEdgeShrinkRoom(
  beforeBox: RookBox,
  resultBox: RookBox,
): number | null {
  const rooms = beforeBox.strongestCuts.flatMap((beforeCut) =>
    resultBox.cuts
      .filter(
        (resultCut) =>
          resultCut.edge === beforeCut.edge &&
          resultCut.size < beforeCut.size,
      )
      .map((resultCut) => resultCut.size),
  )
  return rooms.length > 0 ? Math.min(...rooms) : null
}

function retainsStrongestEdge(
  beforeBox: RookBox,
  resultBox: RookBox,
): boolean {
  return beforeBox.strongestCuts.some((beforeCut) =>
    resultBox.cuts.some(
      (resultCut) =>
        resultCut.edge === beforeCut.edge &&
        resultCut.size === beforeCut.size,
    ),
  )
}

function movesKingCloserWithoutAxisRegression(
  beforeWhiteKingSquare: Square,
  resultWhiteKingSquare: Square,
  blackKingSquare: Square,
): boolean {
  const before = squareCoordinates(beforeWhiteKingSquare)
  const result = squareCoordinates(resultWhiteKingSquare)
  const black = squareCoordinates(blackKingSquare)
  const beforeFileDistance = Math.abs(before.file - black.file)
  const beforeRankDistance = Math.abs(before.rank - black.rank)
  const resultFileDistance = Math.abs(result.file - black.file)
  const resultRankDistance = Math.abs(result.rank - black.rank)

  return (
    resultFileDistance <= beforeFileDistance &&
    resultRankDistance <= beforeRankDistance &&
    (resultFileDistance < beforeFileDistance ||
      resultRankDistance < beforeRankDistance)
  )
}
