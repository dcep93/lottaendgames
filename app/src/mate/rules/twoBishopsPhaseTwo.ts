import type { Square } from 'chess.js'
import {
  edgeDistance,
  findPiece,
  getChess,
  hasDirectKingOpposition,
  kingDistance,
  squareColor,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'
import {
  bishopControlsOrOccupiesSquare,
  closestCorner,
  getCurrentEdgeCorners,
  getWhiteBishopDistanceToSquare,
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  sharesAnyEdge,
} from './twoBishopsGeometry'

function blackKingColorBishopStayedPut(
  fen: string,
  resultFen: string,
): boolean {
  const blackKing = findPiece(fen, 'b', 'k')
  if (!blackKing) return false
  const blackKingColor = squareColor(blackKing.square)
  const resultBishops = getWhiteBishopSquares(resultFen)
  return getWhiteBishopSquares(fen)
    .filter((bishop) => squareColor(bishop) === blackKingColor)
    .some((bishop) => resultBishops.includes(bishop))
}

function getDirectOppositionSquares(square: Square): Square[] {
  const { file, rank } = squareCoordinates(square)
  return [
    squareFromCoordinates(file - 2, rank),
    squareFromCoordinates(file + 2, rank),
    squareFromCoordinates(file, rank - 2),
    squareFromCoordinates(file, rank + 2),
  ].filter((candidate): candidate is Square => candidate !== null)
}

function isOneEdgeKingMoveFromDirectOpposition(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  if (edgeDistance(blackKing) !== 0) return false
  return getDirectOppositionSquares(whiteKing).some(
    (square) =>
      edgeDistance(square) === 0 &&
      sharesAnyEdge(blackKing, square) &&
      kingDistance(blackKing, square) === 1,
  )
}

function hasOppositionPressure(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  return (
    hasDirectKingOpposition(whiteKing, blackKing) ||
    isOneEdgeKingMoveFromDirectOpposition(whiteKing, blackKing)
  )
}

function blackReplyPenalty(
  fen: string,
  resultFen: string,
  isGoodReplyResult: (nextFen: string) => boolean,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  const blackMoves = getChess(resultFen).moves()
  if (blackMoves.length === 0) return 1
  return blackMoves.every((san) => {
    const nextChess = getChess(resultFen)
    nextChess.move(san)
    return isGoodReplyResult(nextChess.fen())
  })
    ? 0
    : 1
}

export function phaseTwoForceOpponentOppositionPenalty(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  if (
    !getChess(resultFen).isCheck() &&
    !blackKingColorBishopStayedPut(fen, resultFen)
  ) {
    return 1
  }
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blackKing = findPiece(resultFen, 'b', 'k')
  if (
    whiteKing &&
    blackKing &&
    hasDirectKingOpposition(whiteKing.square, blackKing.square)
  ) {
    return 1
  }
  return blackReplyPenalty(fen, resultFen, (nextFen) => {
    const nextWhiteKing = findPiece(nextFen, 'w', 'k')
    const nextBlackKing = findPiece(nextFen, 'b', 'k')
    return Boolean(
      nextWhiteKing &&
        nextBlackKing &&
        hasOppositionPressure(nextWhiteKing.square, nextBlackKing.square),
    )
  })
}

function whiteKingOccupiesBishopControlledSquare(fen: string): boolean {
  const whiteKing = findPiece(fen, 'w', 'k')
  return Boolean(
    whiteKing &&
      getWhiteBishopSquares(fen).some((bishop) =>
        bishopControlsOrOccupiesSquare(fen, bishop, whiteKing.square),
      ),
  )
}

export function phaseTwoTakeDirectOppositionPenalty(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  const startingWhiteKing = findPiece(fen, 'w', 'k')
  const resultWhiteKing = findPiece(resultFen, 'w', 'k')
  const resultBlackKing = findPiece(resultFen, 'b', 'k')
  if (
    !startingWhiteKing ||
    !resultWhiteKing ||
    !resultBlackKing ||
    !hasDirectKingOpposition(
      resultWhiteKing.square,
      resultBlackKing.square,
    )
  ) {
    return 1
  }
  const kingMoved = startingWhiteKing.square !== resultWhiteKing.square
  return kingMoved && whiteKingOccupiesBishopControlledSquare(resultFen)
    ? 1
    : 0
}

function getEdgeSquaresTwoFromSquare(square: Square): Square[] {
  const { file, rank } = squareCoordinates(square)
  const candidates: Array<Square | null> = []
  if (file === 0 || file === 7) {
    candidates.push(
      squareFromCoordinates(file, rank - 2),
      squareFromCoordinates(file, rank + 2),
    )
  }
  if (rank === 0 || rank === 7) {
    candidates.push(
      squareFromCoordinates(file - 2, rank),
      squareFromCoordinates(file + 2, rank),
    )
  }
  return candidates.filter((candidate): candidate is Square => candidate !== null)
}

export function getPhaseTwoControlledOppositionEdgeSquares(
  fen: string,
): Square[] {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (
    !whiteKing ||
    !blackKing ||
    !hasDirectKingOpposition(whiteKing.square, blackKing.square)
  ) {
    return []
  }
  const whiteCoordinates = squareCoordinates(whiteKing.square)
  return getEdgeSquaresTwoFromSquare(blackKing.square).filter((square) => {
    const edgeCoordinates = squareCoordinates(square)
    return (
      Math.abs(edgeCoordinates.file - whiteCoordinates.file) === 2 &&
      Math.abs(edgeCoordinates.rank - whiteCoordinates.rank) === 2 &&
      getWhiteBishopSquares(fen).some((bishop) =>
        bishopControlsOrOccupiesSquare(fen, bishop, square),
      )
    )
  })
}

export function phaseTwoPushFromControlledEdgeSquarePenalty(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  const startingBlackKing = findPiece(fen, 'b', 'k')
  const controlledSquares = getPhaseTwoControlledOppositionEdgeSquares(fen)
  if (!startingBlackKing || controlledSquares.length !== 1) return 0
  const controlledSquare = controlledSquares[0]
  const startingDistance = kingDistance(
    startingBlackKing.square,
    controlledSquare,
  )
  const blackMoves = getChess(resultFen).moves()
  if (blackMoves.length === 0) return 0
  return blackMoves.every((san) => {
    const nextChess = getChess(resultFen)
    nextChess.move(san)
    const blackKing = findPiece(nextChess.fen(), 'b', 'k')
    return Boolean(
      blackKing &&
        kingDistance(blackKing.square, controlledSquare) > startingDistance,
    )
  })
    ? 0
    : 1
}

function getTargetEdgeCorners(
  resultFen: string,
  blackKing: Square,
): Square[] {
  const currentEdgeCorners = getCurrentEdgeCorners(blackKing)
  if (currentEdgeCorners.length === 0) return []
  const whiteKing = findPiece(resultFen, 'w', 'k')
  if (!whiteKing) return []
  const bestWhiteKingDistance = Math.min(
    ...currentEdgeCorners.map((corner) =>
      kingDistance(whiteKing.square, corner),
    ),
  )
  return currentEdgeCorners.filter(
    (corner) =>
      kingDistance(whiteKing.square, corner) === bestWhiteKingDistance,
  )
}

function getCurrentEdgeCornerDistance(
  startingBlackKing: Square,
  blackKing: Square,
  targetCorners: readonly Square[],
): number {
  const offCurrentEdgePenalty = sharesAnyEdge(
    startingBlackKing,
    blackKing,
  )
    ? 0
    : 8
  return (
    offCurrentEdgePenalty +
    Math.min(...targetCorners.map((corner) => kingDistance(blackKing, corner)))
  )
}

export function phaseTwoForceOpponentCornerPenalty(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  const startingBlackKing = findPiece(fen, 'b', 'k')
  if (!startingBlackKing) return 0
  const targetCorners = getTargetEdgeCorners(
    resultFen,
    startingBlackKing.square,
  )
  if (targetCorners.length === 0) return 0
  const blackMoves = getChess(resultFen).moves()
  if (blackMoves.length === 0) return 0
  return Math.max(
    ...blackMoves.map((san) => {
      const nextChess = getChess(resultFen)
      nextChess.move(san)
      const blackKing = findPiece(nextChess.fen(), 'b', 'k')
      return blackKing
        ? getCurrentEdgeCornerDistance(
            startingBlackKing.square,
            blackKing.square,
            targetCorners,
          )
        : 99
    }),
  )
}

export function phaseTwoStayPhaseTwoPenalty(
  fen: string,
  resultFen: string,
): number {
  const blackKing = findPiece(fen, 'b', 'k')
  if (
    getChess(fen).turn() !== 'w' ||
    getWhiteBishopSquares(fen).length !== 2 ||
    !blackKing ||
    edgeDistance(blackKing.square) !== 0
  ) {
    return 0
  }
  const blackMoves = getChess(resultFen).moves()
  if (blackMoves.length === 0) return 1
  return blackMoves.every((san) => {
    const nextChess = getChess(resultFen)
    nextChess.move(san)
    return isTwoBishopsPhaseTwoPosition(nextChess.fen())
  })
    ? 0
    : 1
}

export function phaseTwoCheckPenalty(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  return getChess(resultFen).isCheck() ? 0 : 1
}

export function phaseTwoBishopCornerDistance(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  const blackKing = findPiece(resultFen, 'b', 'k')
  return blackKing
    ? getWhiteBishopDistanceToSquare(
        resultFen,
        closestCorner(blackKing.square),
      )
    : 0
}
