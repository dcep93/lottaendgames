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
  blackCanTakeWhiteBishops,
  blackCanWalkUpToWhiteBishop,
  centerDistance,
  getBlackKingReachableArea,
  getCurrentEdgeCorners,
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  whiteBishopsAreAdjacent,
} from './twoBishopsGeometry'
import {
  getPhaseTwoCornerSupportDistance,
  phaseTwoBishopCornerDistance,
  phaseTwoForceOpponentCornerPenalty,
  phaseTwoStayPhaseTwoPenalty,
  getTwoBishopsMatingSupportDistance,
} from './twoBishopsPhaseTwo'

export type TwoBishopsWaitingMove = {
  readonly from: Square
  readonly to: Square
}

export type TwoBishopsLineWaitingMoveTargets = {
  readonly from: Square
  readonly to: readonly Square[]
}

export type TwoBishopsWaitingMoveContext = {
  readonly adjacentWallMoves: readonly TwoBishopsWaitingMove[]
  readonly knightDistanceMoves: readonly TwoBishopsWaitingMove[]
  readonly phaseOneOppositionMoves: readonly TwoBishopsWaitingMove[]
  readonly lineTargets: TwoBishopsLineWaitingMoveTargets | null
  readonly supportedCornerMoves: readonly TwoBishopsWaitingMove[]
}

export function getTwoBishopsPhaseOneOppositionWaitingMoves(
  fen: string,
): TwoBishopsWaitingMove[] {
  if (isTwoBishopsPhaseTwoPosition(fen)) return []
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (
    !whiteKing ||
    !blackKing ||
    kingDistance(whiteKing.square, blackKing.square) !== 2
  ) {
    return []
  }
  const whiteKingCoordinates = squareCoordinates(whiteKing.square)
  const blackKingCoordinates = squareCoordinates(blackKing.square)
  const bishopMoveTowardBlack = (move: {
    readonly from: Square
    readonly to: Square
  }): boolean => {
    const start = squareCoordinates(move.from)
    const target = squareCoordinates(move.to)
    const currentFileDistance = Math.abs(
      start.file - blackKingCoordinates.file,
    )
    const currentRankDistance = Math.abs(
      start.rank - blackKingCoordinates.rank,
    )
    const resultFileDistance = Math.abs(
      target.file - blackKingCoordinates.file,
    )
    const resultRankDistance = Math.abs(
      target.rank - blackKingCoordinates.rank,
    )
    return (
      resultFileDistance <= currentFileDistance &&
      resultRankDistance <= currentRankDistance &&
      (resultFileDistance < currentFileDistance ||
        resultRankDistance < currentRankDistance)
    )
  }
  const phaseEstablishingMoves =
    edgeDistance(blackKing.square) === 0
      ? getChess(fen).moves({ verbose: true }).filter((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      return (
        !afterWhite.isStalemate() &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
        phaseTwoStayPhaseTwoPenalty(fen, afterWhite.fen()) === 0
      )
    })
      : []
  if (
    phaseEstablishingMoves.some(
      (move) =>
        move.piece === 'k' || kingDistance(move.from, move.to) === 1,
    )
  ) {
    return []
  }
  const currentArea = getBlackKingReachableArea(fen)
  const safeQuietBishopMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      return (
        !afterWhite.isCheck() &&
        !afterWhite.isStalemate() &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen())
      )
    })
  if (phaseEstablishingMoves.length > 0) {
    const bishops = getWhiteBishopSquares(fen)
    if (bishops.length === 2 && kingDistance(bishops[0], bishops[1]) > 1) {
      const farthestKingDistance = Math.max(
        ...bishops.map((bishop) =>
          kingDistance(bishop, whiteKing.square),
        ),
      )
      const distantBishops = bishops.filter(
        (bishop) =>
          kingDistance(bishop, whiteKing.square) === farthestKingDistance,
      )
      const startingBishopDistance = kingDistance(bishops[0], bishops[1])
      const stepMoves = safeQuietBishopMoves.filter((move) => {
        if (
          !distantBishops.includes(move.from) ||
          kingDistance(move.from, move.to) !== 1
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        const resultBishops = getWhiteBishopSquares(afterWhite.fen())
        return (
          resultBishops.length === 2 &&
          kingDistance(resultBishops[0], resultBishops[1]) <
            startingBishopDistance
        )
      })
      if (stepMoves.length > 0) {
        const directionalMoves = stepMoves.filter(bishopMoveTowardBlack)
        return (directionalMoves.length > 0
          ? directionalMoves
          : stepMoves
        ).map(({ from, to }) => ({ from, to }))
      }
    }
  }
  const kingsNearSameEdge =
    ((whiteKingCoordinates.file === 0 || whiteKingCoordinates.file === 7) &&
      Math.abs(whiteKingCoordinates.file - blackKingCoordinates.file) === 1) ||
    ((whiteKingCoordinates.rank === 0 || whiteKingCoordinates.rank === 7) &&
      Math.abs(whiteKingCoordinates.rank - blackKingCoordinates.rank) === 1)
  if (kingsAreAKnightMoveApart(fen) && kingsNearSameEdge) {
    const safeCloserKingMoveExists = getChess(fen)
      .moves({ verbose: true })
      .some((move) => {
        if (move.piece !== 'k') return false
        const target = squareCoordinates(move.to)
        const currentFileDistance = Math.abs(
          whiteKingCoordinates.file - blackKingCoordinates.file,
        )
        const currentRankDistance = Math.abs(
          whiteKingCoordinates.rank - blackKingCoordinates.rank,
        )
        const fileDistance = Math.abs(
          target.file - blackKingCoordinates.file,
        )
        const rankDistance = Math.abs(
          target.rank - blackKingCoordinates.rank,
        )
        if (
          fileDistance > currentFileDistance ||
          rankDistance > currentRankDistance ||
          (fileDistance === currentFileDistance &&
            rankDistance === currentRankDistance)
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
      })
    if (safeCloserKingMoveExists) return []
    const matingSetupMoves = safeQuietBishopMoves.filter(
      (move) => kingDistance(move.to, whiteKing.square) === 1,
    )
    if (matingSetupMoves.length > 0) {
      return matingSetupMoves.map(({ from, to }) => ({ from, to }))
    }
  }
  if (
    edgeDistance(blackKing.square) === 0 &&
    edgeDistance(whiteKing.square) > 0 &&
    kingsAreAKnightMoveApart(fen)
  ) {
    const currentCenterDistance = centerDistance(whiteKing.square)
    const safeCenterwardKingMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (
          move.piece !== 'k' ||
          centerDistance(move.to) >= currentCenterDistance
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
      })
    if (safeCenterwardKingMoves.length > 0) {
      const bestCenterDistance = Math.min(
        ...safeCenterwardKingMoves.map((move) => centerDistance(move.to)),
      )
      return safeCenterwardKingMoves
        .filter((move) => centerDistance(move.to) === bestCenterDistance)
        .map(({ from, to }) => ({ from, to }))
    }
  }
  const protectedEdgeForcingMoves = safeQuietBishopMoves.filter((move) => {
    if (
      kingDistance(move.to, whiteKing.square) !== 1 ||
      kingDistance(move.to, blackKing.square) !== 1
    ) {
      return false
    }
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    const replies = afterWhite.moves()
    return (
      replies.length > 0 &&
      replies.every((san) => {
        const afterBlack = getChess(afterWhite.fen())
        afterBlack.move(san)
        const resultBlackKing = findPiece(afterBlack.fen(), 'b', 'k')
        return Boolean(
          resultBlackKing && edgeDistance(resultBlackKing.square) === 0,
        )
      })
    )
  })
  if (protectedEdgeForcingMoves.length > 0) {
    const directionalMoves = protectedEdgeForcingMoves.filter(
      bishopMoveTowardBlack,
    )
    const candidates =
      directionalMoves.length > 0
        ? directionalMoves
        : protectedEdgeForcingMoves
    const replyCount = (san: string): number => {
      const afterWhite = getChess(fen)
      afterWhite.move(san)
      return afterWhite.moves().length
    }
    const fewestReplies = Math.min(
      ...candidates.map((move) => replyCount(move.san)),
    )
    return candidates
      .filter((move) => replyCount(move.san) === fewestReplies)
      .map(({ from, to }) => ({ from, to }))
  }
  const edgeForcingMoves = safeQuietBishopMoves.filter((move) => {
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    const replies = afterWhite.moves()
    return (
      replies.length > 0 &&
      replies.every((san) => {
        const afterBlack = getChess(afterWhite.fen())
        afterBlack.move(san)
        const resultBlackKing = findPiece(afterBlack.fen(), 'b', 'k')
        return Boolean(
          resultBlackKing && edgeDistance(resultBlackKing.square) === 0,
        )
      })
    )
  })
  if (edgeForcingMoves.length > 0) {
    const directionalMoves = edgeForcingMoves.filter(
      bishopMoveTowardBlack,
    )
    const candidates =
      directionalMoves.length > 0 ? directionalMoves : edgeForcingMoves
    const replyCount = (san: string): number => {
      const afterWhite = getChess(fen)
      afterWhite.move(san)
      return afterWhite.moves().length
    }
    const fewestReplies = Math.min(
      ...candidates.map((move) => replyCount(move.san)),
    )
    return candidates
      .filter((move) => replyCount(move.san) === fewestReplies)
      .map(({ from, to }) => ({ from, to }))
  }
  const resultingArea = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    return getBlackKingReachableArea(afterWhite.fen())
  }
  if (
    hasDirectKingOpposition(whiteKing.square, blackKing.square)
  ) {
    const tighteningMoves = safeQuietBishopMoves.filter(
      (move) => resultingArea(move.san) < currentArea,
    )
    if (tighteningMoves.length > 0) {
      const smallestArea = Math.min(
        ...tighteningMoves.map((move) => resultingArea(move.san)),
      )
      return tighteningMoves
        .filter((move) => resultingArea(move.san) === smallestArea)
        .map(({ from, to }) => ({ from, to }))
    }
    const kingColor = squareColor(whiteKing.square)
    const quietInteriorMoves = safeQuietBishopMoves.filter(
      (move) =>
        squareColor(move.from) === kingColor && edgeDistance(move.to) > 0,
    )
    if (quietInteriorMoves.length > 0) {
      const longestMove = Math.max(
        ...quietInteriorMoves.map((move) =>
          kingDistance(move.from, move.to),
        ),
      )
      return quietInteriorMoves
        .filter(
          (move) => kingDistance(move.from, move.to) === longestMove,
        )
        .map(({ from, to }) => ({ from, to }))
    }
  }
  const bestArea = Math.min(
    currentArea,
    ...safeQuietBishopMoves.map((move) => resultingArea(move.san)),
  )
  const waitingMoves = safeQuietBishopMoves.filter(
    (move) => resultingArea(move.san) === bestArea,
  )
  if (waitingMoves.length === 0) return []
  const bishopMovesTowardBlack = waitingMoves.filter(
    bishopMoveTowardBlack,
  )
  const directionalWaitingMoves =
    bishopMovesTowardBlack.length > 0
      ? bishopMovesTowardBlack
      : waitingMoves
  const kingsAreTwoDiagonalSquaresApart =
    Math.abs(whiteKingCoordinates.file - blackKingCoordinates.file) === 2 &&
    Math.abs(whiteKingCoordinates.rank - blackKingCoordinates.rank) === 2
  const bishopDistanceFromWhiteKing = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    const resultWhiteKing = findPiece(afterWhite.fen(), 'w', 'k')
    if (!resultWhiteKing) return 99
    return getWhiteBishopSquares(afterWhite.fen()).reduce(
      (distance, bishop) =>
        distance + kingDistance(bishop, resultWhiteKing.square),
      0,
    )
  }
  const wallMoves = (() => {
    if (!kingsAreTwoDiagonalSquaresApart) return directionalWaitingMoves
    const nearestWallDistance = Math.min(
      ...directionalWaitingMoves.map((move) =>
        bishopDistanceFromWhiteKing(move.san),
      ),
    )
    return directionalWaitingMoves.filter(
      (move) =>
        bishopDistanceFromWhiteKing(move.san) === nearestWallDistance,
    )
  })()
  const nearestReplyDistanceFromWhiteKing = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    const resultWhiteKing = findPiece(afterWhite.fen(), 'w', 'k')
    if (!resultWhiteKing) return -1
    return Math.min(
      ...afterWhite.moves().map((reply) => {
        const afterBlack = getChess(afterWhite.fen())
        afterBlack.move(reply)
        const resultBlackKing = findPiece(afterBlack.fen(), 'b', 'k')
        return resultBlackKing
          ? kingDistance(resultWhiteKing.square, resultBlackKing.square)
          : -1
      }),
    )
  }
  const farthestReplyDistance = Math.max(
    ...wallMoves.map((move) =>
      nearestReplyDistanceFromWhiteKing(move.san),
    ),
  )
  const distancingMoves = wallMoves.filter(
    (move) =>
      nearestReplyDistanceFromWhiteKing(move.san) ===
      farthestReplyDistance,
  )
  const bishopDistance = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    const bishops = getWhiteBishopSquares(afterWhite.fen())
    return bishops.length === 2
      ? kingDistance(bishops[0], bishops[1])
      : 99
  }
  const closestDistance = Math.min(
    ...distancingMoves.map((move) => bishopDistance(move.san)),
  )
  const closestMoves = distancingMoves.filter(
    (move) => bishopDistance(move.san) === closestDistance,
  )
  const edgeCount = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    return getWhiteBishopSquares(afterWhite.fen()).filter(
      (square) => edgeDistance(square) === 0,
    ).length
  }
  const fewestEdgeBishops = Math.min(
    ...closestMoves.map((move) => edgeCount(move.san)),
  )
  return closestMoves
    .filter((move) => edgeCount(move.san) === fewestEdgeBishops)
    .map(({ from, to }) => ({ from, to }))
}

function squaresAreContiguousRankOrFileLine(
  squares: readonly Square[],
): boolean {
  if (squares.length < 2) return false
  const coordinates = squares.map(squareCoordinates)
  const files = new Set(coordinates.map(({ file }) => file))
  const ranks = new Set(coordinates.map(({ rank }) => rank))
  if (files.size !== 1 && ranks.size !== 1) return false
  const values =
    files.size === 1
      ? coordinates.map(({ rank }) => rank)
      : coordinates.map(({ file }) => file)
  return (
    new Set(values).size === squares.length &&
    Math.max(...values) - Math.min(...values) === squares.length - 1
  )
}

function getCornerSupportSquares(corner: Square): Square[] {
  const { file, rank } = squareCoordinates(corner)
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
  ).filter((square): square is Square => square !== null)
}

function bishopsBlockingNearestCornerSupport(
  fen: string,
  corner: Square,
): Square[] {
  const whiteKing = findPiece(fen, 'w', 'k')
  if (!whiteKing) return []
  const supportSquares = getCornerSupportSquares(corner)
  const nearestDistance = Math.min(
    ...supportSquares.map((square) =>
      kingDistance(whiteKing.square, square),
    ),
  )
  const nearestSquares = supportSquares.filter(
    (square) => kingDistance(whiteKing.square, square) === nearestDistance,
  )
  const chess = getChess(fen)
  const usableSupportExists = nearestSquares.some((square) => {
    if (square === whiteKing.square) return true
    if (chess.get(square) || !isLegalMove(fen, whiteKing.square, square)) {
      return false
    }
    const afterWhite = getChess(fen)
    afterWhite.move({ from: whiteKing.square, to: square })
    return !afterWhite.isStalemate()
  })
  if (usableSupportExists) return []
  return supportSquares.filter((square) => {
    const piece = chess.get(square)
    return piece?.color === 'w' && piece.type === 'b'
  })
}

function isLegalMove(fen: string, from: Square, to: Square): boolean {
  try {
    return getChess(fen).move({ from, to }) !== null
  } catch {
    return false
  }
}

function kingsAreAKnightMoveApart(fen: string): boolean {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (!whiteKing || !blackKing) return false
  const white = squareCoordinates(whiteKing.square)
  const black = squareCoordinates(blackKing.square)
  const distances = [
    Math.abs(white.file - black.file),
    Math.abs(white.rank - black.rank),
  ].sort((first, second) => first - second)
  return distances[0] === 1 && distances[1] === 2
}

function hasPerpendicularEdgeOpposition(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  if (!hasDirectKingOpposition(whiteKing, blackKing)) return false
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  return black.rank === 0 || black.rank === 7
    ? white.file === black.file
    : white.rank === black.rank
}

function bishopSquaresOnCornerEdgeClosestToWhiteKing(
  phaseFen: string,
  positionFen: string,
  corner: Square,
): Square[] | null {
  const whiteKing = findPiece(positionFen, 'w', 'k')
  if (
    !whiteKing ||
    getPhaseTwoCornerSupportDistance(phaseFen, positionFen) !== 0
  ) {
    return null
  }
  const king = squareCoordinates(whiteKing.square)
  const target = squareCoordinates(corner)
  const fileDistance = Math.abs(king.file - target.file)
  const rankDistance = Math.abs(king.rank - target.rank)
  const closestEdge = fileDistance < rankDistance ? 'file' : 'rank'
  return getWhiteBishopSquares(positionFen).filter((bishop) => {
    const square = squareCoordinates(bishop)
    return closestEdge === 'file'
      ? square.file === target.file
      : square.rank === target.rank
  })
}

function distanceFromNearerCornerEdge(
  square: Square,
  corner: Square,
): number {
  const position = squareCoordinates(square)
  const target = squareCoordinates(corner)
  return Math.min(
    Math.abs(position.file - target.file),
    Math.abs(position.rank - target.rank),
  )
}

function keepsPhaseTwoAfterEveryBlackReply(
  fen: string,
  from: Square,
  to: Square,
): boolean {
  const afterWhite = getChess(fen)
  if (afterWhite.move({ from, to }) === null) return false
  const blackMoves = afterWhite.moves()
  if (blackMoves.length === 0) return false
  return blackMoves.every((san) => {
    const afterBlack = getChess(afterWhite.fen())
    afterBlack.move(san)
    return isTwoBishopsPhaseTwoPosition(afterBlack.fen())
  })
}

function hasSafeKingMoveTowardMatingSupport(fen: string): boolean {
  const currentDistance = getTwoBishopsMatingSupportDistance(fen, fen)
  if (currentDistance === null || currentDistance === 0) return false

  return getChess(fen).moves({ verbose: true }).some((move) => {
    if (move.piece !== 'k') return false
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    const resultDistance = getTwoBishopsMatingSupportDistance(
      fen,
      afterWhite.fen(),
    )
    return (
      resultDistance !== null &&
      resultDistance < currentDistance &&
      !afterWhite.isStalemate() &&
      !blackCanTakeWhiteBishops(afterWhite.fen()) &&
      !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
      keepsPhaseTwoAfterEveryBlackReply(fen, move.from, move.to)
    )
  })
}

export function getTwoBishopsAdjacentWallWaitingMoves(
  fen: string,
): TwoBishopsWaitingMove[] {
  if (
    !isTwoBishopsPhaseTwoPosition(fen) ||
    !whiteBishopsAreAdjacent(fen) ||
    getPhaseTwoCornerSupportDistance(fen, fen) !== null
  ) {
    return []
  }
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  const currentMatingSupportDistance =
    getTwoBishopsMatingSupportDistance(fen, fen)
  if (
    hasSafeKingMoveTowardMatingSupport(fen) &&
    !(
      whiteKing &&
      blackKing &&
      hasDirectKingOpposition(whiteKing.square, blackKing.square)
    )
  ) {
    return []
  }
  if (currentMatingSupportDistance === 0) {
    const supportWaitingMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (move.piece !== 'b') return false
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !afterWhite.isCheck() &&
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
      })
    if (supportWaitingMoves.length > 0) {
      const cornerProgress = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return phaseTwoForceOpponentCornerPenalty(fen, afterWhite.fen())
      }
      const bestProgress = Math.min(
        ...supportWaitingMoves.map((move) => cornerProgress(move.san)),
      )
      return supportWaitingMoves
        .filter((move) => cornerProgress(move.san) === bestProgress)
        .map(({ from, to }) => ({ from, to }))
    }
  }
  if (
    whiteKing &&
    blackKing &&
    hasDirectKingOpposition(whiteKing.square, blackKing.square)
  ) {
    const quietWaitingMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (move.piece !== 'b') return false
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !afterWhite.isCheck() &&
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
    })
    if (quietWaitingMoves.length > 0) {
      const cornerProgress = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return phaseTwoForceOpponentCornerPenalty(fen, afterWhite.fen())
      }
      const bestProgress = Math.min(
        ...quietWaitingMoves.map((move) => cornerProgress(move.san)),
      )
      const progressingMoves = quietWaitingMoves.filter(
        (move) => cornerProgress(move.san) === bestProgress,
      )
      const resultingArea = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return getBlackKingReachableArea(afterWhite.fen())
      }
      const smallestRoom = Math.min(
        ...progressingMoves.map((move) => resultingArea(move.san)),
      )
      const tightestMoves = progressingMoves.filter(
        (move) => resultingArea(move.san) === smallestRoom,
      )
      return tightestMoves.map(({ from, to }) => ({ from, to }))
    }
  }
  const startingEdgeBishops = getWhiteBishopSquares(fen).filter(
    (square) => edgeDistance(square) === 0,
  ).length
  const joinedMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      const resultFen = afterWhite.fen()
      return (
        !afterWhite.isCheck() &&
        whiteBishopsAreAdjacent(resultFen) &&
        getWhiteBishopSquares(resultFen).filter(
          (square) => edgeDistance(square) === 0,
        ).length <= startingEdgeBishops &&
        keepsPhaseTwoAfterEveryBlackReply(fen, move.from, move.to)
      )
    })
  if (joinedMoves.length === 0) return []
  if (whiteKing && blackKing) {
    const white = squareCoordinates(whiteKing.square)
    const black = squareCoordinates(blackKing.square)
    const currentFileDistance = Math.abs(white.file - black.file)
    const currentRankDistance = Math.abs(white.rank - black.rank)
    const blockingBishops = getWhiteBishopSquares(fen).filter((square) => {
      if (kingDistance(whiteKing.square, square) !== 1) return false
      const target = squareCoordinates(square)
      const fileDistance = Math.abs(target.file - black.file)
      const rankDistance = Math.abs(target.rank - black.rank)
      return (
        kingDistance(square, blackKing.square) > 1 &&
        fileDistance <= currentFileDistance &&
        rankDistance <= currentRankDistance &&
        (fileDistance < currentFileDistance ||
          rankDistance < currentRankDistance)
      )
    })
    const clearingMoves = joinedMoves.filter((move) =>
      blockingBishops.includes(move.from),
    )
    if (clearingMoves.length > 0) {
      return clearingMoves.map(({ from, to }) => ({ from, to }))
    }
  }
  const cornerProgress = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    return phaseTwoForceOpponentCornerPenalty(fen, afterWhite.fen())
  }
  const bestJoinedProgress = Math.min(
    ...joinedMoves.map((move) => cornerProgress(move.san)),
  )
  const safeBishopMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      return (
        !afterWhite.isStalemate() &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen())
      )
    })
  const bestAvailableProgress = Math.min(
    ...safeBishopMoves.map((move) => cornerProgress(move.san)),
  )
  if (bestAvailableProgress < bestJoinedProgress) return []
  const progressingJoinedMoves = joinedMoves.filter(
    (move) => cornerProgress(move.san) === bestJoinedProgress,
  )
  const cornerDistance = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    return phaseTwoBishopCornerDistance(fen, afterWhite.fen())
  }
  const farthestDistance = Math.max(
    ...progressingJoinedMoves.map((move) => cornerDistance(move.san)),
  )
  return progressingJoinedMoves
    .filter((move) => cornerDistance(move.san) === farthestDistance)
    .map(({ from, to }) => ({ from, to }))
}

function getCornerForcingBishopWaitingMoves(
  fen: string,
  blackKing: Square,
): TwoBishopsWaitingMove[] {
  const adjacentCorners = getCurrentEdgeCorners(blackKing).filter(
    (corner) => kingDistance(blackKing, corner) === 1,
  )
  if (adjacentCorners.length === 0) return []
  const forcingMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      const replies = afterWhite.moves()
      return (
        replies.length > 0 &&
        replies.every((san) => {
          const afterBlack = getChess(afterWhite.fen())
          afterBlack.move(san)
          const resultBlackKing = findPiece(afterBlack.fen(), 'b', 'k')
          return Boolean(
            resultBlackKing &&
              adjacentCorners.includes(resultBlackKing.square),
          )
        })
      )
    })
  if (forcingMoves.length === 0) return []
  const checkingMoves = forcingMoves.filter((move) => {
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    return afterWhite.isCheck()
  })
  if (checkingMoves.length > 0) {
    return checkingMoves.map(({ from, to }) => ({ from, to }))
  }
  const whiteKing = findPiece(fen, 'w', 'k')
  const supportedCorners = whiteKing
    ? adjacentCorners.filter((corner) =>
        getCornerSupportSquares(corner).includes(whiteKing.square),
      )
    : []
  if (supportedCorners.length > 0) {
    const closestCornerDistance = Math.min(
      ...forcingMoves.map((move) =>
        Math.min(
          ...supportedCorners.map((corner) =>
            kingDistance(move.to, corner),
          ),
        ),
      ),
    )
    return forcingMoves
      .filter(
        (move) =>
          Math.min(
            ...supportedCorners.map((corner) =>
              kingDistance(move.to, corner),
            ),
          ) === closestCornerDistance,
      )
      .map(({ from, to }) => ({ from, to }))
  }
  const bishopDistance = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    const bishops = getWhiteBishopSquares(afterWhite.fen())
    return bishops.length === 2
      ? kingDistance(bishops[0], bishops[1])
      : 99
  }
  const bestBishopDistance = Math.min(
    ...forcingMoves.map((move) => bishopDistance(move.san)),
  )
  return forcingMoves
    .filter((move) => bishopDistance(move.san) === bestBishopDistance)
    .map(({ from, to }) => ({ from, to }))
}

function getEdgeProgressBishopWaitingMoves(
  fen: string,
): TwoBishopsWaitingMove[] {
  const blackKing = findPiece(fen, 'b', 'k')
  const whiteKing = findPiece(fen, 'w', 'k')
  if (!blackKing || !whiteKing) return []
  const edgeCorners = getCurrentEdgeCorners(blackKing.square)
  if (edgeCorners.length === 0) return []
  const nearestWhiteCornerDistance = Math.min(
    ...edgeCorners.map((corner) =>
      kingDistance(whiteKing.square, corner),
    ),
  )
  const targetCorners = edgeCorners.filter(
    (corner) =>
      kingDistance(whiteKing.square, corner) ===
      nearestWhiteCornerDistance,
  )
  const startingCornerDistance = Math.min(
    ...targetCorners.map((corner) =>
      kingDistance(blackKing.square, corner),
    ),
  )
  const forcingMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      const replies = afterWhite.moves()
      return (
        !afterWhite.isStalemate() &&
        replies.length > 0 &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
        replies.every((san) => {
          const afterBlack = getChess(afterWhite.fen())
          afterBlack.move(san)
          const resultBlackKing = findPiece(afterBlack.fen(), 'b', 'k')
          return Boolean(
            resultBlackKing &&
              Math.min(
                ...targetCorners.map((corner) =>
                  kingDistance(resultBlackKing.square, corner),
                ),
              ) < startingCornerDistance,
          )
        })
      )
    })
  if (forcingMoves.length === 0) return []
  const checkingMoves = forcingMoves.filter((move) => {
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    return afterWhite.isCheck()
  })
  const candidates = checkingMoves.length > 0 ? checkingMoves : forcingMoves
  const resultingArea = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    return getBlackKingReachableArea(afterWhite.fen())
  }
  const smallestArea = Math.min(
    ...candidates.map((move) => resultingArea(move.san)),
  )
  return candidates
    .filter((move) => resultingArea(move.san) === smallestArea)
    .map(({ from, to }) => ({ from, to }))
}

function getSafeKingMovesTowardNearbyCornerSupport(
  fen: string,
): TwoBishopsWaitingMove[] {
  const blackKing = findPiece(fen, 'b', 'k')
  const whiteKing = findPiece(fen, 'w', 'k')
  if (!blackKing || !whiteKing) return []
  const nearbyCorners = getCurrentEdgeCorners(blackKing.square).filter(
    (corner) => kingDistance(blackKing.square, corner) <= 1,
  )
  if (nearbyCorners.length !== 1) return []
  const targetCorner = nearbyCorners[0]
  const supportSquares = getCornerSupportSquares(targetCorner)
  const currentDistance = Math.min(
    ...supportSquares.map((square) =>
      kingDistance(whiteKing.square, square),
    ),
  )
  const safeMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (
        move.piece !== 'k' ||
        Math.min(
          ...supportSquares.map((square) =>
            kingDistance(move.to, square),
          ),
        ) >= currentDistance
      ) {
        return false
      }
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      const replies = afterWhite.moves()
      return (
        !afterWhite.isStalemate() &&
        replies.length > 0 &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen())
      )
    })
  const phasePreservingMoves = safeMoves.filter((move) => {
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    return afterWhite.moves().every((san) => {
      const afterBlack = getChess(afterWhite.fen())
      afterBlack.move(san)
      return isTwoBishopsPhaseTwoPosition(afterBlack.fen())
    })
  })
  const candidates =
    phasePreservingMoves.length > 0 ? phasePreservingMoves : safeMoves
  if (candidates.length === 0) return []
  const farthestFromEdge = Math.max(
    ...candidates.map((move) => edgeDistance(move.to)),
  )
  return candidates
    .filter((move) => edgeDistance(move.to) === farthestFromEdge)
    .map(({ from, to }) => ({ from, to }))
}

function getSafeKingProgressPreservingPhaseTwoMoves(
  fen: string,
  requirePhaseTwo = true,
): TwoBishopsWaitingMove[] {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (!whiteKing || !blackKing) return []
  const white = squareCoordinates(whiteKing.square)
  const black = squareCoordinates(blackKing.square)
  const currentFileDistance = Math.abs(white.file - black.file)
  const currentRankDistance = Math.abs(white.rank - black.rank)
  return getChess(fen).moves({ verbose: true }).filter((move) => {
    if (move.piece !== 'k') return false
    const target = squareCoordinates(move.to)
    const fileDistance = Math.abs(target.file - black.file)
    const rankDistance = Math.abs(target.rank - black.rank)
    if (
      fileDistance > currentFileDistance ||
      rankDistance > currentRankDistance ||
      (fileDistance === currentFileDistance &&
        rankDistance === currentRankDistance)
    ) {
      return false
    }
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    const replies = afterWhite.moves()
    return (
      !afterWhite.isStalemate() &&
      replies.length > 0 &&
      !blackCanTakeWhiteBishops(afterWhite.fen()) &&
      !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
      (!requirePhaseTwo ||
        replies.every((san) => {
          const afterBlack = getChess(afterWhite.fen())
          afterBlack.move(san)
          return isTwoBishopsPhaseTwoPosition(afterBlack.fen())
        }))
    )
  }).map(({ from, to }) => ({ from, to }))
}

function hasSafeKingProgressPreservingPhaseTwo(fen: string): boolean {
  return getSafeKingProgressPreservingPhaseTwoMoves(fen).length > 0
}

export function getTwoBishopsKnightDistanceWaitingMoves(
  fen: string,
): TwoBishopsWaitingMove[] {
  if (
    !isTwoBishopsPhaseTwoPosition(fen) ||
    !kingsAreAKnightMoveApart(fen)
  ) {
    return []
  }
  const startingBishops = getWhiteBishopSquares(fen)
  const blackKing = findPiece(fen, 'b', 'k')
  const whiteKing = findPiece(fen, 'w', 'k')
  if (
    blackKing &&
    whiteKing &&
    startingBishops.length === 2 &&
    edgeDistance(blackKing.square) === 0
  ) {
    const black = squareCoordinates(blackKing.square)
    const white = squareCoordinates(whiteKing.square)
    const bishopCoordinates = startingBishops.map(squareCoordinates)
    const useFiles = black.rank === 0 || black.rank === 7
    const blackAxis = useFiles ? black.file : black.rank
    const whiteAxis = useFiles ? white.file : white.rank
    const bishopAxis =
      bishopCoordinates.reduce(
        (total, square) => total + (useFiles ? square.file : square.rank),
        0,
      ) / bishopCoordinates.length
    const blackBetweenWhiteAndBishops =
      (blackAxis - whiteAxis) * (blackAxis - bishopAxis) < 0
    if (blackBetweenWhiteAndBishops) {
      const supportedOppositionMoves = getChess(fen)
        .moves({ verbose: true })
        .filter((move) => {
          if (move.piece !== 'k') return false
          const afterWhite = getChess(fen)
          afterWhite.move(move.san)
          const resultWhiteKing = findPiece(afterWhite.fen(), 'w', 'k')
          const resultBlackKing = findPiece(afterWhite.fen(), 'b', 'k')
          const resultBishops = getWhiteBishopSquares(afterWhite.fen())
          return Boolean(
            resultWhiteKing &&
              resultBlackKing &&
              resultBishops.length === 2 &&
              hasPerpendicularEdgeOpposition(
                resultWhiteKing.square,
                resultBlackKing.square,
              ) &&
              resultBishops.every(
                (bishop) =>
                  kingDistance(resultWhiteKing.square, bishop) <= 1,
              ) &&
              !afterWhite.isStalemate() &&
              !blackCanTakeWhiteBishops(afterWhite.fen()) &&
              !blackCanWalkUpToWhiteBishop(afterWhite.fen()),
          )
        })
      if (supportedOppositionMoves.length > 0) {
        return supportedOppositionMoves.map(({ from, to }) => ({ from, to }))
      }
      const checkingMoves = getChess(fen)
        .moves({ verbose: true })
        .filter((move) => {
          if (move.piece !== 'b') return false
          const afterWhite = getChess(fen)
          afterWhite.move(move.san)
          return (
            afterWhite.isCheck() &&
            !afterWhite.isStalemate() &&
            !blackCanTakeWhiteBishops(afterWhite.fen()) &&
            !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
            keepsPhaseTwoAfterEveryBlackReply(fen, move.from, move.to)
          )
        })
      if (checkingMoves.length > 0) {
        const fewestReplies = Math.min(
          ...checkingMoves.map((move) => {
            const afterWhite = getChess(fen)
            afterWhite.move(move.san)
            return afterWhite.moves().length
          }),
        )
        return checkingMoves
          .filter((move) => {
            const afterWhite = getChess(fen)
            afterWhite.move(move.san)
            return afterWhite.moves().length === fewestReplies
          })
          .map(({ from, to }) => ({ from, to }))
      }
      const setupMoves = getChess(fen)
        .moves({ verbose: true })
        .filter((move) => {
          if (
            move.piece !== 'b' ||
            kingDistance(move.to, whiteKing.square) !== 1
          ) {
            return false
          }
          const afterWhite = getChess(fen)
          afterWhite.move(move.san)
          return (
            !afterWhite.isCheck() &&
            !afterWhite.isStalemate() &&
            !blackCanTakeWhiteBishops(afterWhite.fen()) &&
            !blackCanWalkUpToWhiteBishop(afterWhite.fen())
          )
        })
      if (setupMoves.length > 0) {
        const cornerProgress = (san: string): number => {
          const afterWhite = getChess(fen)
          afterWhite.move(san)
          return phaseTwoForceOpponentCornerPenalty(fen, afterWhite.fen())
        }
        const bestProgress = Math.min(
          ...setupMoves.map((move) => cornerProgress(move.san)),
        )
        return setupMoves
          .filter((move) => cornerProgress(move.san) === bestProgress)
          .map(({ from, to }) => ({ from, to }))
      }
    }
    const whiteOnBishopSide =
      (whiteAxis - blackAxis) * (bishopAxis - blackAxis) > 0
    const whiteDirection = Math.sign(whiteAxis - blackAxis)
    const bishopsBehindWhite = bishopCoordinates.every((square) => {
      const axis = useFiles ? square.file : square.rank
      return (axis - whiteAxis) * whiteDirection >= 0
    })
    if (whiteOnBishopSide && bishopsBehindWhite) {
      const whiteSupportsBothBishops = startingBishops.every(
        (bishop) => kingDistance(whiteKing.square, bishop) <= 1,
      )
      if (!whiteSupportsBothBishops) {
        const oppositionMoves = getChess(fen)
          .moves({ verbose: true })
          .filter((move) => {
            if (move.piece !== 'k') return false
            const afterWhite = getChess(fen)
            afterWhite.move(move.san)
            const resultWhiteKing = findPiece(afterWhite.fen(), 'w', 'k')
            const resultBlackKing = findPiece(afterWhite.fen(), 'b', 'k')
            return Boolean(
              resultWhiteKing &&
                resultBlackKing &&
                hasPerpendicularEdgeOpposition(
                  resultWhiteKing.square,
                  resultBlackKing.square,
                ) &&
                !afterWhite.isStalemate() &&
                !blackCanTakeWhiteBishops(afterWhite.fen()) &&
                !blackCanWalkUpToWhiteBishop(afterWhite.fen()),
            )
          })
        if (oppositionMoves.length > 0) {
          return oppositionMoves.map(({ from, to }) => ({ from, to }))
        }
      }
      if (whiteSupportsBothBishops) {
        const bishopTempoMoves = getChess(fen)
          .moves({ verbose: true })
          .filter((move) => {
            if (
              move.piece !== 'b' ||
              kingDistance(move.to, whiteKing.square) !== 1
            ) {
              return false
            }
            const from = squareCoordinates(move.from)
            const to = squareCoordinates(move.to)
            const fromAxis = useFiles ? from.file : from.rank
            const toAxis = useFiles ? to.file : to.rank
            if (
              Math.abs(toAxis - blackAxis) >=
              Math.abs(fromAxis - blackAxis)
            ) {
              return false
            }
            const afterWhite = getChess(fen)
            afterWhite.move(move.san)
            return (
              !afterWhite.isCheck() &&
              !afterWhite.isStalemate() &&
              !blackCanTakeWhiteBishops(afterWhite.fen()) &&
              !blackCanWalkUpToWhiteBishop(afterWhite.fen())
            )
          })
        if (bishopTempoMoves.length > 0) {
          return bishopTempoMoves.map(({ from, to }) => ({ from, to }))
        }
      }
      const kingSideMoves = getChess(fen)
        .moves({ verbose: true })
        .filter((move) => {
          if (move.piece !== 'k') return false
          const target = squareCoordinates(move.to)
          const targetAxis = useFiles ? target.file : target.rank
          if ((targetAxis - blackAxis) * (bishopAxis - blackAxis) <= 0) {
            return false
          }
          const afterWhite = getChess(fen)
          afterWhite.move(move.san)
          const resultWhiteKing = findPiece(afterWhite.fen(), 'w', 'k')
          const resultBishops = getWhiteBishopSquares(afterWhite.fen())
          return Boolean(
            resultWhiteKing &&
              resultBishops.length === 2 &&
              resultBishops.every(
                (bishop) =>
                  kingDistance(resultWhiteKing.square, bishop) <= 1,
              ) &&
              !afterWhite.isStalemate() &&
              !blackCanTakeWhiteBishops(afterWhite.fen()) &&
              !blackCanWalkUpToWhiteBishop(afterWhite.fen()),
          )
        })
      if (kingSideMoves.length > 0) {
        return kingSideMoves.map(({ from, to }) => ({ from, to }))
      }
    }
  }
  if (
    blackKing &&
    Math.min(
      ...getCurrentEdgeCorners(blackKing.square).map((corner) =>
        kingDistance(blackKing.square, corner),
      ),
    ) > 1 &&
    hasSafeKingMoveTowardMatingSupport(fen)
  ) {
    return []
  }
  if (
    !whiteBishopsAreAdjacent(fen) &&
    hasSafeKingMoveTowardMatingSupport(fen)
  ) {
    return []
  }
  if (
    whiteBishopsAreAdjacent(fen) &&
    hasSafeKingProgressPreservingPhaseTwo(fen)
  ) {
    return []
  }
  const phaseKeepingWaitingMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      return (
        !afterWhite.isCheck() &&
        !afterWhite.isStalemate() &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
        getBlackKingReachableArea(afterWhite.fen()) <=
          getBlackKingReachableArea(fen) &&
        keepsPhaseTwoAfterEveryBlackReply(fen, move.from, move.to)
      )
    })
  if (phaseKeepingWaitingMoves.length > 0) {
    const longestDistance = Math.max(
      ...phaseKeepingWaitingMoves.map((move) =>
        kingDistance(move.from, move.to),
      ),
    )
    const longestMoves = phaseKeepingWaitingMoves.filter(
      (move) => kingDistance(move.from, move.to) === longestDistance,
    )
    const replyCount = (san: string): number => {
      const afterWhite = getChess(fen)
      afterWhite.move(san)
      return afterWhite.moves().length
    }
    const fewestReplies = Math.min(
      ...longestMoves.map((move) => replyCount(move.san)),
    )
    const forcingMoves = longestMoves.filter(
      (move) => replyCount(move.san) === fewestReplies,
    )
    return forcingMoves.map(({ from, to }) => ({ from, to }))
  }
  if (whiteBishopsAreAdjacent(fen)) {
    const whiteKing = findPiece(fen, 'w', 'k')
    const kingColor = whiteKing ? squareColor(whiteKing.square) : null
    const longWaitingMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (
          move.piece !== 'b' ||
          kingColor === null ||
          squareColor(move.from) !== kingColor
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !afterWhite.isCheck() &&
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
    })
    if (longWaitingMoves.length > 0) {
      const replyCount = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return afterWhite.moves().length
      }
      const fewestReplies = Math.min(
        ...longWaitingMoves.map((move) => replyCount(move.san)),
      )
      const forcingMoves = longWaitingMoves.filter(
        (move) => replyCount(move.san) === fewestReplies,
      )
      const longestDistance = Math.max(
        ...forcingMoves.map((move) =>
          kingDistance(move.from, move.to),
        ),
      )
      const longestMoves = forcingMoves.filter(
        (move) => kingDistance(move.from, move.to) === longestDistance,
      )
      return longestMoves
        .map(({ from, to }) => ({ from, to }))
    }
  }
  const edgeProgressMoves = getEdgeProgressBishopWaitingMoves(fen)
  if (edgeProgressMoves.length > 0) return edgeProgressMoves
  if (whiteBishopsAreAdjacent(fen)) {
    const centerwardMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (
          move.piece !== 'b' ||
          kingDistance(move.from, move.to) !== 1 ||
          centerDistance(move.to) >= centerDistance(move.from)
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
      })
    if (centerwardMoves.length > 0) {
      const quietMoves = centerwardMoves.filter((move) => {
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return !afterWhite.isCheck()
      })
      const candidates = quietMoves.length > 0 ? quietMoves : centerwardMoves
      const resultingArea = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return getBlackKingReachableArea(afterWhite.fen())
      }
      const smallestArea = Math.min(
        ...candidates.map((move) => resultingArea(move.san)),
      )
      return candidates
        .filter((move) => resultingArea(move.san) === smallestArea)
        .map(({ from, to }) => ({ from, to }))
    }
  }
  if (getPhaseTwoCornerSupportDistance(fen, fen) !== null) return []

  if (startingBishops.length !== 2) return []
  const startingDistance = kingDistance(
    startingBishops[0],
    startingBishops[1],
  )
  if (whiteKing && startingDistance > 1) {
    const farthestKingDistance = Math.max(
      ...startingBishops.map((bishop) =>
        kingDistance(bishop, whiteKing.square),
      ),
    )
    const distantBishops = startingBishops.filter(
      (bishop) =>
        kingDistance(bishop, whiteKing.square) === farthestKingDistance,
    )
    const stepMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (
          move.piece !== 'b' ||
          !distantBishops.includes(move.from) ||
          kingDistance(move.from, move.to) !== 1
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        const bishops = getWhiteBishopSquares(afterWhite.fen())
        return (
          bishops.length === 2 &&
          kingDistance(bishops[0], bishops[1]) < startingDistance &&
          !afterWhite.isCheck() &&
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
      })
    if (stepMoves.length > 0) {
      const resultingArea = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return getBlackKingReachableArea(afterWhite.fen())
      }
      const smallestRoom = Math.min(
        ...stepMoves.map((move) => resultingArea(move.san)),
      )
      return stepMoves
        .filter((move) => resultingArea(move.san) === smallestRoom)
        .map(({ from, to }) => ({ from, to }))
    }
  }
  const closerMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      if (afterWhite.isCheck()) return false
      const bishops = getWhiteBishopSquares(afterWhite.fen())
      return (
        bishops.length === 2 &&
        kingDistance(bishops[0], bishops[1]) < startingDistance
      )
    })
  if (closerMoves.length === 0) return []
  const bestDistance = Math.min(
    ...closerMoves.map((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      const bishops = getWhiteBishopSquares(afterWhite.fen())
      return kingDistance(bishops[0], bishops[1])
    }),
  )
  const closestMoves = closerMoves
    .filter((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      const bishops = getWhiteBishopSquares(afterWhite.fen())
      return kingDistance(bishops[0], bishops[1]) === bestDistance
    })
  const resultingArea = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    return getBlackKingReachableArea(afterWhite.fen())
  }
  const smallestArea = Math.min(
    ...closestMoves.map((move) => resultingArea(move.san)),
  )
  const tightestMoves = closestMoves.filter(
    (move) => resultingArea(move.san) === smallestArea,
  )
  const edgeBishopCount = (san: string): number => {
    const afterWhite = getChess(fen)
    afterWhite.move(san)
    return getWhiteBishopSquares(afterWhite.fen()).filter(
      (square) => edgeDistance(square) === 0,
    ).length
  }
  const bestEdgeBishopCount = Math.min(
    ...tightestMoves.map((move) => edgeBishopCount(move.san)),
  )
  return tightestMoves
    .filter(
      (move) => edgeBishopCount(move.san) === bestEdgeBishopCount,
    )
    .map(({ from, to }) => ({ from, to }))
}

export function getTwoBishopsSupportedCornerWaitingMoves(
  fen: string,
): TwoBishopsWaitingMove[] {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return []
  const blackKing = findPiece(fen, 'b', 'k')
  if (!blackKing) return []
  const safeKingSupportMoves = getSafeKingMovesTowardNearbyCornerSupport(fen)
  const cornerForcingMoves = getCornerForcingBishopWaitingMoves(
    fen,
    blackKing.square,
  )
  const nearbyCorners = getCurrentEdgeCorners(blackKing.square).filter(
    (corner) => kingDistance(blackKing.square, corner) <= 1,
  )
  const targetCorner = nearbyCorners.length === 1 ? nearbyCorners[0] : null
  const bishops = getWhiteBishopSquares(fen)
  const bishopsReadyForCorner = Boolean(
    targetCorner &&
      bishops.length === 2 &&
      kingDistance(bishops[0], bishops[1]) <= 3 &&
      bishops.every(
        (bishop) => kingDistance(bishop, targetCorner) <= 4,
      ),
  )
  const blockingBishops = targetCorner
    ? bishopsBlockingNearestCornerSupport(fen, targetCorner)
    : []
  if (
    cornerForcingMoves.length > 0 &&
    blockingBishops.length === 0 &&
    bishopsReadyForCorner
  ) {
    return cornerForcingMoves
  }
  if (
    safeKingSupportMoves.length > 0 &&
    bishops.length === 2 &&
    !whiteBishopsAreAdjacent(fen) &&
    kingDistance(bishops[0], bishops[1]) <= 3
  ) {
    return safeKingSupportMoves
  }
  if (
    safeKingSupportMoves.length > 0 &&
    kingsAreAKnightMoveApart(fen)
  ) {
    const quietBishopMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (move.piece !== 'b') return false
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !afterWhite.isCheck() &&
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen())
        )
      })
    if (quietBishopMoves.length > 0) {
      const replyCount = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return afterWhite.moves().length
      }
      const fewestReplies = Math.min(
        ...quietBishopMoves.map((move) => replyCount(move.san)),
      )
      const forcingMoves = quietBishopMoves.filter(
        (move) => replyCount(move.san) === fewestReplies,
      )
      const cornerMoves = targetCorner
        ? (() => {
            const closestCornerDistance = Math.min(
              ...forcingMoves.map((move) =>
                kingDistance(move.to, targetCorner),
              ),
            )
            return forcingMoves.filter(
              (move) =>
                kingDistance(move.to, targetCorner) ===
                closestCornerDistance,
            )
          })()
        : forcingMoves
      const resultingRoom = (san: string): number => {
        const afterWhite = getChess(fen)
        afterWhite.move(san)
        return getBlackKingReachableArea(afterWhite.fen())
      }
      const smallestRoom = Math.min(
        ...cornerMoves.map((move) => resultingRoom(move.san)),
      )
      return cornerMoves
        .filter((move) => resultingRoom(move.san) === smallestRoom)
        .map(({ from, to }) => ({ from, to }))
    }
  }
  if (safeKingSupportMoves.length > 0) return safeKingSupportMoves
  if (
    blockingBishops.length === 0 &&
    getPhaseTwoCornerSupportDistance(fen, fen) !== 0
  ) {
    const kingProgressMoves =
      getSafeKingProgressPreservingPhaseTwoMoves(fen, false)
    if (kingProgressMoves.length > 0) return kingProgressMoves
  }
  if (!targetCorner || !bishopsReadyForCorner) return []
  const cornerCageMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b' && move.piece !== 'k') return false
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      const replies = afterWhite.moves()
      return (
        !afterWhite.isStalemate() &&
        replies.length > 0 &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
        replies.every((san) => {
          const afterBlack = getChess(afterWhite.fen())
          afterBlack.move(san)
          const resultBlackKing = findPiece(afterBlack.fen(), 'b', 'k')
          return Boolean(
            resultBlackKing &&
              kingDistance(resultBlackKing.square, targetCorner) <= 1,
          )
        })
      )
    })
  const quietCornerCageMoves = cornerCageMoves.filter((move) => {
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    return !afterWhite.isCheck()
  })

  if (blockingBishops.length > 0) {
    if (blackKing.square === targetCorner) {
      const cornerColorWaitingMoves = getChess(fen)
        .moves({ verbose: true })
        .filter((move) => {
          if (
            move.piece !== 'b' ||
            blockingBishops.includes(move.from) ||
            squareColor(move.from) !== squareColor(targetCorner)
          ) {
            return false
          }
          const afterWhite = getChess(fen)
          afterWhite.move(move.san)
          return (
            !afterWhite.isCheck() &&
            !afterWhite.isStalemate() &&
            !blackCanTakeWhiteBishops(afterWhite.fen()) &&
            !blackCanWalkUpToWhiteBishop(afterWhite.fen())
          )
        })
      if (cornerColorWaitingMoves.length > 0) {
        const farthestFromCorner = Math.max(
          ...cornerColorWaitingMoves.map((move) =>
            kingDistance(move.to, targetCorner),
          ),
        )
        return cornerColorWaitingMoves
          .filter(
            (move) =>
              kingDistance(move.to, targetCorner) === farthestFromCorner,
          )
          .map(({ from, to }) => ({ from, to }))
      }
    }
    const supportingBishopMoves = getChess(fen)
      .moves({ verbose: true })
      .filter((move) => {
        if (
          blackKing.square === targetCorner ||
          move.piece !== 'b' ||
          blockingBishops.includes(move.from) ||
          kingDistance(move.from, move.to) !== 1
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        return (
          !afterWhite.isCheck() &&
          !afterWhite.isStalemate() &&
          !blackCanTakeWhiteBishops(afterWhite.fen()) &&
          !blackCanWalkUpToWhiteBishop(afterWhite.fen()) &&
          whiteBishopsAreAdjacent(afterWhite.fen()) &&
          keepsPhaseTwoAfterEveryBlackReply(fen, move.from, move.to)
        )
      })
    if (supportingBishopMoves.length > 0) {
      const smallestRoom = Math.min(
        ...supportingBishopMoves.map((move) => {
          const afterWhite = getChess(fen)
          afterWhite.move(move.san)
          return getBlackKingReachableArea(afterWhite.fen())
        }),
      )
      return supportingBishopMoves
        .filter((move) => {
          const afterWhite = getChess(fen)
          afterWhite.move(move.san)
          return getBlackKingReachableArea(afterWhite.fen()) === smallestRoom
        })
        .map(({ from, to }) => ({ from, to }))
    }
    const cageClearingMoves = cornerCageMoves
      .filter(
        (move) =>
          move.piece === 'b' && blockingBishops.includes(move.from),
      )
    const clearingMoves =
      cageClearingMoves.length > 0
        ? cageClearingMoves
        : getChess(fen)
            .moves({ verbose: true })
            .filter((move) => {
              if (
                move.piece !== 'b' ||
                !blockingBishops.includes(move.from)
              ) {
                return false
              }
              const afterWhite = getChess(fen)
              afterWhite.move(move.san)
              return (
                !afterWhite.isStalemate() &&
                !blackCanTakeWhiteBishops(afterWhite.fen()) &&
                !blackCanWalkUpToWhiteBishop(afterWhite.fen())
              )
            })
    const quietClearingMoves = clearingMoves.filter((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      return !afterWhite.isCheck()
    })
    const candidates =
      quietClearingMoves.length > 0 ? quietClearingMoves : clearingMoves
    if (candidates.length === 0) return []
    const farthestFromEdge = Math.max(
      ...candidates.map((move) => edgeDistance(move.to)),
    )
    const interiorCandidates = candidates.filter(
      (move) => edgeDistance(move.to) === farthestFromEdge,
    )
    const bestEdgeDistance = Math.max(
      ...interiorCandidates.map((move) =>
        distanceFromNearerCornerEdge(move.to, targetCorner),
      ),
    )
    return interiorCandidates
      .filter(
        (move) =>
          distanceFromNearerCornerEdge(move.to, targetCorner) ===
          bestEdgeDistance,
      )
      .map(({ from, to }) => ({ from, to }))
  }

  const startingEdgeBishops = bishopSquaresOnCornerEdgeClosestToWhiteKing(
    fen,
    fen,
    targetCorner,
  )

  if (startingEdgeBishops && startingEdgeBishops.length > 0) {
    const farthestFromCorner = Math.max(
      ...startingEdgeBishops.map((square) =>
        kingDistance(square, targetCorner),
      ),
    )
    return cornerCageMoves
      .filter((move) => {
        if (
          !startingEdgeBishops.includes(move.from) ||
          kingDistance(move.from, targetCorner) !== farthestFromCorner
        ) {
          return false
        }
        const afterWhite = getChess(fen)
        afterWhite.move(move.san)
        const resultingEdgeBishops =
          bishopSquaresOnCornerEdgeClosestToWhiteKing(
            fen,
            afterWhite.fen(),
            targetCorner,
          )
        return (
          resultingEdgeBishops !== null &&
          resultingEdgeBishops.length < startingEdgeBishops.length
        )
      })
      .map(({ from, to }) => ({ from, to }))
  }

  const joiningMoves = quietCornerCageMoves.filter((move) => {
    if (
      startingEdgeBishops === null ||
      move.piece !== 'b' ||
      whiteBishopsAreAdjacent(fen)
    ) {
      return false
    }
    const afterWhite = getChess(fen)
    afterWhite.move(move.san)
    return whiteBishopsAreAdjacent(afterWhite.fen())
  })
  if (joiningMoves.length > 0) {
    return joiningMoves.map(({ from, to }) => ({ from, to }))
  }
  if (whiteBishopsAreAdjacent(fen)) {
    const hasQuietCenterwardMove =
      getTwoBishopsKnightDistanceWaitingMoves(fen).some(({ from, to }) => {
        const afterWhite = getChess(fen)
        afterWhite.move({ from, to })
        return !afterWhite.isCheck()
      })
  if (hasQuietCenterwardMove) return []
  }
  const cornerColorMoves = quietCornerCageMoves.filter(
    (move) =>
      move.piece === 'b' &&
      squareColor(move.from) === squareColor(targetCorner),
  )
  if (cornerColorMoves.length === 0) return []
  const whiteKing = findPiece(fen, 'w', 'k')
  const supportDistance = whiteKing
    ? Math.min(
        ...getCornerSupportSquares(targetCorner).map((square) =>
          kingDistance(whiteKing.square, square),
        ),
      )
    : 99
  const cornerCandidates = (() => {
    if (supportDistance <= 1) return cornerColorMoves
    const replyCount = (san: string): number => {
      const afterWhite = getChess(fen)
      afterWhite.move(san)
      return afterWhite.moves().length
    }
    const fewestReplies = Math.min(
      ...cornerColorMoves.map((move) => replyCount(move.san)),
    )
    return cornerColorMoves.filter(
      (move) => replyCount(move.san) === fewestReplies,
    )
  })()
  const nonAdjacentCandidates = whiteKing
    ? cornerCandidates.filter(
        (move) => kingDistance(move.to, whiteKing.square) > 1,
      )
    : cornerCandidates
  const spacingCandidates =
    nonAdjacentCandidates.length > 0
      ? nonAdjacentCandidates
      : cornerCandidates
  const nearestKingDistance = whiteKing
    ? Math.min(
        ...spacingCandidates.map((move) =>
          kingDistance(move.to, whiteKing.square),
        ),
      )
    : 99
  const kingSideCandidates = whiteKing
    ? spacingCandidates.filter(
        (move) =>
          kingDistance(move.to, whiteKing.square) ===
          nearestKingDistance,
      )
    : spacingCandidates
  const bestCornerDistance = Math.min(
    ...kingSideCandidates.map((move) =>
      kingDistance(move.to, targetCorner),
    ),
  )
  return kingSideCandidates
    .filter(
      (move) =>
        kingDistance(move.to, targetCorner) === bestCornerDistance,
    )
    .map(({ from, to }) => ({ from, to }))
}

export function getTwoBishopsPhaseTwoWaitingMoveTargets(
  fen: string,
): TwoBishopsLineWaitingMoveTargets | null {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return null
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  const bishops = getWhiteBishopSquares(fen)
  if (
    !whiteKing ||
    !blackKing ||
    bishops.length !== 2 ||
    !squaresAreContiguousRankOrFileLine([whiteKing.square, ...bishops])
  ) {
    return null
  }
  const white = squareCoordinates(whiteKing.square)
  const black = squareCoordinates(blackKing.square)
  if (
    Math.abs(white.file - black.file) !== 2 ||
    Math.abs(white.rank - black.rank) !== 2
  ) {
    return null
  }
  const waitingBishop = bishops.find(
    (bishop) => squareColor(bishop) !== squareColor(whiteKing.square),
  )
  if (!waitingBishop) return null
  const targets = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (
        move.from !== waitingBishop ||
        kingDistance(move.from, move.to) !== 1
      ) {
        return false
      }
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      return (
        !afterWhite.isCheck() &&
        !afterWhite.isStalemate() &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen())
      )
    })
  if (targets.length === 0) return null
  const closestToKing = Math.min(
    ...targets.map((move) => kingDistance(move.to, whiteKing.square)),
  )
  const kingwardTargets = targets.filter(
    (move) => kingDistance(move.to, whiteKing.square) === closestToKing,
  )
  const closestToCenter = Math.min(
    ...kingwardTargets.map((move) => centerDistance(move.to)),
  )
  return {
    from: waitingBishop,
    to: kingwardTargets
      .filter((move) => centerDistance(move.to) === closestToCenter)
      .map((move) => move.to),
  }
}

export function getTwoBishopsWaitingMoveContext(
  fen: string,
): TwoBishopsWaitingMoveContext {
  const adjacentWallMoves = getTwoBishopsAdjacentWallWaitingMoves(fen)
  const knightDistanceMoves = getTwoBishopsKnightDistanceWaitingMoves(fen)
  const supportedOppositionMoves = knightDistanceMoves.filter(
    (move) => getChess(fen).get(move.from)?.type === 'k',
  )
  const phaseTwoMoves =
    supportedOppositionMoves.length > 0
      ? supportedOppositionMoves
      : [...adjacentWallMoves, ...knightDistanceMoves]
  const preferredPhaseTwoMoves = (() => {
    if (adjacentWallMoves.length === 0 || knightDistanceMoves.length === 0) {
      return phaseTwoMoves
    }
    const resultFen = (move: TwoBishopsWaitingMove): string => {
      const afterWhite = getChess(fen)
      afterWhite.move(move)
      return afterWhite.fen()
    }
    const smallestPhasePenalty = Math.min(
      ...phaseTwoMoves.map((move) =>
        phaseTwoStayPhaseTwoPenalty(fen, resultFen(move)),
      ),
    )
    const phaseMoves = phaseTwoMoves.filter(
      (move) =>
        phaseTwoStayPhaseTwoPenalty(fen, resultFen(move)) ===
        smallestPhasePenalty,
    )
    const bestCornerProgress = Math.min(
      ...phaseMoves.map((move) =>
        phaseTwoForceOpponentCornerPenalty(fen, resultFen(move)),
      ),
    )
    const cornerMoves = phaseMoves.filter(
      (move) =>
        phaseTwoForceOpponentCornerPenalty(fen, resultFen(move)) ===
        bestCornerProgress,
    )
    const smallestRoom = Math.min(
      ...cornerMoves.map((move) =>
        getBlackKingReachableArea(resultFen(move)),
      ),
    )
    return cornerMoves.filter(
      (move) => getBlackKingReachableArea(resultFen(move)) === smallestRoom,
    )
  })()
  const preferredMovesAllCheck =
    preferredPhaseTwoMoves.length > 0 &&
    preferredPhaseTwoMoves.every((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move)
      return afterWhite.isCheck()
    })
  const safeQuietAlternativeExists = getChess(fen)
    .moves({ verbose: true })
    .some((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      return (
        !afterWhite.isCheck() &&
        !afterWhite.isStalemate() &&
        !blackCanTakeWhiteBishops(afterWhite.fen()) &&
        !blackCanWalkUpToWhiteBishop(afterWhite.fen())
      )
    })
  const usablePhaseTwoMoves =
    preferredMovesAllCheck &&
    safeQuietAlternativeExists &&
    knightDistanceMoves.length === 0
      ? []
      : preferredPhaseTwoMoves
  const rawSupportedCornerMoves =
    getTwoBishopsSupportedCornerWaitingMoves(fen)
  const supportedCornerHasCheck = rawSupportedCornerMoves.some((move) => {
    const afterWhite = getChess(fen)
    afterWhite.move(move)
    return afterWhite.isCheck()
  })
  const supportedCornerHasBishopMove = rawSupportedCornerMoves.some(
    (move) => getChess(fen).get(move.from)?.type === 'b',
  )
  const knightDistanceHasCheck = knightDistanceMoves.some((move) => {
    const afterWhite = getChess(fen)
    afterWhite.move(move)
    return afterWhite.isCheck()
  })
  const knightDistanceTakesOpposition = knightDistanceMoves.some((move) => {
    if (getChess(fen).get(move.from)?.type !== 'k') return false
    const afterWhite = getChess(fen)
    afterWhite.move(move)
    const whiteKing = findPiece(afterWhite.fen(), 'w', 'k')
    const blackKing = findPiece(afterWhite.fen(), 'b', 'k')
    return Boolean(
      whiteKing &&
        blackKing &&
        hasPerpendicularEdgeOpposition(
          whiteKing.square,
          blackKing.square,
        ),
    )
  })
  const startingBlackKing = findPiece(fen, 'b', 'k')
  const blackIsInCorner = (() => {
    if (!startingBlackKing) return false
    const square = squareCoordinates(startingBlackKing.square)
    return (
      (square.file === 0 || square.file === 7) &&
      (square.rank === 0 || square.rank === 7)
    )
  })()
  const supportedCornerMoves =
    knightDistanceMoves.length > 0 &&
    !supportedCornerHasCheck &&
    ((!blackIsInCorner && knightDistanceTakesOpposition) ||
      knightDistanceHasCheck ||
      !supportedCornerHasBishopMove)
      ? []
      : rawSupportedCornerMoves
  return {
    adjacentWallMoves: usablePhaseTwoMoves,
    knightDistanceMoves: [],
    phaseOneOppositionMoves: [
      ...getTwoBishopsPhaseOneOppositionWaitingMoves(fen),
    ],
    lineTargets: getTwoBishopsPhaseTwoWaitingMoveTargets(fen),
    supportedCornerMoves,
  }
}

export function twoBishopsPhaseTwoWaitingMovePenalty(
  from: Square,
  to: Square,
  context: TwoBishopsWaitingMoveContext,
): number {
  const targets = context.lineTargets
  if (context.phaseOneOppositionMoves.length > 0) {
    return context.phaseOneOppositionMoves.some(
      (target) => target.from === from && target.to === to,
    )
      ? 0
      : 1
  }
  if (context.supportedCornerMoves.length > 0) {
    return context.supportedCornerMoves.some(
      (target) => target.from === from && target.to === to,
    )
      ? 0
      : 1
  }
  if (targets) {
    return targets.from === from && targets.to.includes(to) ? 0 : 1
  }
  if (context.knightDistanceMoves.length > 0) {
    return context.knightDistanceMoves.some(
      (target) => target.from === from && target.to === to,
    )
      ? 0
      : 1
  }
  if (context.adjacentWallMoves.length > 0) {
    return context.adjacentWallMoves.some(
      (target) => target.from === from && target.to === to,
    )
      ? 0
      : 1
  }
  return 0
}
