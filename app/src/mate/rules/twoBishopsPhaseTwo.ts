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
  whiteBishopsAreAdjacent,
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

function getKnightMoveSquares(square: Square): Square[] {
  const { file, rank } = squareCoordinates(square)
  return [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ].map(([fileOffset, rankOffset]) =>
    squareFromCoordinates(file + fileOffset, rank + rankOffset),
  ).filter((candidate): candidate is Square => candidate !== null)
}

function getCornersAheadOfWhiteKing(
  blackKing: Square,
  whiteKing: Square,
): Square[] {
  const corners = getCurrentEdgeCorners(blackKing)
  if (corners.length < 2) return corners
  const black = squareCoordinates(blackKing)
  const white = squareCoordinates(whiteKing)
  const useFiles = black.rank === 0 || black.rank === 7
  const blackAxis = useFiles ? black.file : black.rank
  const whiteAxis = useFiles ? white.file : white.rank
  if (blackAxis === whiteAxis) return corners
  const direction = Math.sign(blackAxis - whiteAxis)
  const cornerAxes = corners.map((corner) => {
    const square = squareCoordinates(corner)
    return useFiles ? square.file : square.rank
  })
  const targetAxis =
    direction > 0 ? Math.max(...cornerAxes) : Math.min(...cornerAxes)
  return corners.filter((corner) => {
    const square = squareCoordinates(corner)
    return (useFiles ? square.file : square.rank) === targetAxis
  })
}

export function getPhaseTwoCornerSupportDistance(
  fen: string,
  resultFen: string,
): number | null {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return null
  const blackKing = findPiece(fen, 'b', 'k')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  if (!blackKing || !whiteKing) return null
  const nearbyCorners = getCurrentEdgeCorners(blackKing.square).filter(
    (corner) => kingDistance(blackKing.square, corner) <= 1,
  )
  if (nearbyCorners.length !== 1) return null
  const supportSquares = getKnightMoveSquares(nearbyCorners[0])
  return Math.min(
    ...supportSquares.map((square) =>
      kingDistance(whiteKing.square, square),
    ),
  )
}

export function getTwoBishopsMatingSupportDistance(
  fen: string,
  resultFen: string,
): number | null {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return null
  if (!whiteBishopsAreAdjacent(fen)) {
    const nearbyCornerDistance = getPhaseTwoCornerSupportDistance(
      fen,
      resultFen,
    )
    if (nearbyCornerDistance !== null) return nearbyCornerDistance
    const blackKing = findPiece(fen, 'b', 'k')
    const startingWhiteKing = findPiece(fen, 'w', 'k')
    const resultWhiteKing = findPiece(resultFen, 'w', 'k')
    if (!blackKing || !startingWhiteKing || !resultWhiteKing) return null
    const supportedCorners = getCurrentEdgeCorners(blackKing.square).filter(
      (corner) =>
        getKnightMoveSquares(corner).includes(startingWhiteKing.square),
    )
    if (supportedCorners.length === 0) return null
    return Math.min(
      ...supportedCorners
        .flatMap(getKnightMoveSquares)
        .map((square) => kingDistance(resultWhiteKing.square, square)),
    )
  }
  const blackKing = findPiece(fen, 'b', 'k')
  const startingWhiteKing = findPiece(fen, 'w', 'k')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  if (!blackKing || !startingWhiteKing || !whiteKing) return null
  const edgeCorners = getCurrentEdgeCorners(blackKing.square)
  if (edgeCorners.length === 0) return null
  const nearestCornerDistance = Math.min(
    ...edgeCorners.map((corner) =>
      kingDistance(blackKing.square, corner),
    ),
  )
  const targetCorners =
    nearestCornerDistance <= 1
      ? edgeCorners.filter(
          (corner) =>
            kingDistance(blackKing.square, corner) ===
            nearestCornerDistance,
        )
      : getCornersAheadOfWhiteKing(
          blackKing.square,
          startingWhiteKing.square,
        )
  const supportSquares = targetCorners.flatMap(getKnightMoveSquares)
  if (supportSquares.includes(startingWhiteKing.square)) {
    return Math.min(
      ...supportSquares.map((square) =>
        kingDistance(whiteKing.square, square),
      ),
    )
  }
  return Math.min(
    ...supportSquares.map((square) =>
      kingDistance(whiteKing.square, square),
    ),
  )
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
  if (whiteBishopsAreAdjacent(fen)) return 0
  const startingBishops = getWhiteBishopSquares(fen)
  if (
    startingBishops.length === 2 &&
    kingDistance(startingBishops[0], startingBishops[1]) > 3
  ) {
    return 0
  }
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

export function phaseTwoTakeDirectOppositionPenalty(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  if (whiteBishopsAreAdjacent(fen)) return 0
  const startingBishops = getWhiteBishopSquares(fen)
  if (
    startingBishops.length === 2 &&
    kingDistance(startingBishops[0], startingBishops[1]) > 3
  ) {
    return 0
  }
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
  return 0
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
  fen: string,
  blackKing: Square,
): Square[] {
  const whiteKing = findPiece(fen, 'w', 'k')
  if (!whiteKing) return []
  return getCornersAheadOfWhiteKing(blackKing, whiteKing.square)
}

export function phaseTwoNewSupportBlockerPenalty(
  fen: string,
  resultFen: string,
): number {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return 0
  const blackKing = findPiece(fen, 'b', 'k')
  if (!blackKing) return 0
  const targetCorners = getTargetEdgeCorners(fen, blackKing.square)
  if (targetCorners.length === 0) return 0
  const supportSquares = new Set(targetCorners.flatMap(getKnightMoveSquares))
  const startingBlockers = getWhiteBishopSquares(fen).filter((square) =>
    supportSquares.has(square),
  ).length
  if (startingBlockers > 0) return 0
  return getWhiteBishopSquares(resultFen).some((square) =>
    supportSquares.has(square),
  )
    ? 1
    : 0
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
  const targetCorners = getTargetEdgeCorners(fen, startingBlackKing.square)
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
