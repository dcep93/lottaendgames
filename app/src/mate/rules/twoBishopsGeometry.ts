import type { Square } from 'chess.js'
import {
  allSquares,
  findPiece,
  getChess,
  kingDistance,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'
import { getWhiteBishopSquares } from './twoBishopsPieces'

export { getWhiteBishopSquares } from './twoBishopsPieces'

export function centerDistance(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  return (
    Math.min(Math.abs(file - 3), Math.abs(file - 4)) +
    Math.min(Math.abs(rank - 3), Math.abs(rank - 4))
  )
}

export function squaredEuclideanDistanceToUnoccupiedCenter(
  square: Square,
  bishops: readonly Square[],
): number {
  const occupied = new Set(bishops)
  return Math.min(
    ...(['d4', 'e4', 'd5', 'e5'] as const)
      .filter((centerSquare) => !occupied.has(centerSquare))
      .map((centerSquare) => squaredEuclideanDistance(square, centerSquare)),
  )
}

function squaredEuclideanDistance(first: Square, second: Square): number {
  const source = squareCoordinates(first)
  const target = squareCoordinates(second)
  return (source.file - target.file) ** 2 + (source.rank - target.rank) ** 2
}

function phaseTwoCenterSquare(
  axis: 'difference' | 'sum',
  direction: -1 | 1,
): Square {
  return axis === 'difference'
    ? direction > 0
      ? 'e4'
      : 'd5'
    : direction > 0
      ? 'e5'
      : 'd4'
}

export function bishopDestinationCanBeAttackedOnNextMove(
  fen: string,
  san: string,
  destination: Square,
): boolean {
  const result = getChess(fen)
  result.move(san)
  return result.moves({ verbose: true }).some(
    (reply) =>
      reply.piece === 'k' &&
      kingDistance(reply.to, destination) <= 1,
  )
}

export type ProximateBishopWall = {
  readonly moatAxis: 'file' | 'rank'
  readonly moatIndex: number
}

export function getProximateBishopWall(
  bishops: readonly Square[],
  blackKing: Square,
): ProximateBishopWall | null {
  if (bishops.length !== 2) return null
  const first = squareCoordinates(bishops[0])
  const second = squareCoordinates(bishops[1])
  const black = squareCoordinates(blackKing)

  if (first.file === second.file && Math.abs(first.rank - second.rank) === 1) {
    const wallFile = first.file
    const minimumRank = Math.min(first.rank, second.rank)
    const maximumRank = Math.max(first.rank, second.rank)
    const sideDistance = black.file - wallFile
    const absoluteSideDistance = Math.abs(sideDistance)
    const alignedWithWall =
      absoluteSideDistance === 2 &&
      black.rank >= minimumRank &&
      black.rank <= maximumRank
    const alignedWithExtendedWall =
      absoluteSideDistance === 3 &&
      black.rank >= minimumRank - 1 &&
      black.rank <= maximumRank + 1
    return alignedWithWall || alignedWithExtendedWall
      ? {
          moatAxis: 'file',
          moatIndex: wallFile + Math.sign(sideDistance),
        }
      : null
  }

  if (first.rank === second.rank && Math.abs(first.file - second.file) === 1) {
    const wallRank = first.rank
    const minimumFile = Math.min(first.file, second.file)
    const maximumFile = Math.max(first.file, second.file)
    const sideDistance = black.rank - wallRank
    const absoluteSideDistance = Math.abs(sideDistance)
    const alignedWithWall =
      absoluteSideDistance === 2 &&
      black.file >= minimumFile &&
      black.file <= maximumFile
    const alignedWithExtendedWall =
      absoluteSideDistance === 3 &&
      black.file >= minimumFile - 1 &&
      black.file <= maximumFile + 1
    return alignedWithWall || alignedWithExtendedWall
      ? {
          moatAxis: 'rank',
          moatIndex: wallRank + Math.sign(sideDistance),
        }
      : null
  }

  return null
}

function bishopControlsSquareWithoutBlackBlocker(
  fen: string,
  bishop: Square,
  target: Square,
): boolean {
  if (bishop === target) return true
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  if (
    Math.abs(source.file - destination.file) !==
    Math.abs(source.rank - destination.rank)
  ) {
    return false
  }
  const fileStep = Math.sign(destination.file - source.file)
  const rankStep = Math.sign(destination.rank - source.rank)
  const chess = getChess(fen)
  let file = source.file + fileStep
  let rank = source.rank + rankStep
  while (file !== destination.file || rank !== destination.rank) {
    const square = squareFromCoordinates(file, rank)
    if (!square) return false
    const blocker = chess.get(square)
    if (blocker?.color === 'w' && blocker.type === 'b') return false
    file += fileStep
    rank += rankStep
  }
  return true
}

/** Number of mutually reachable bishop-safe squares available to Black's king. */
export function getBlackKingReachableArea(fen: string): number {
  const chess = getChess(fen)
  const blackKing = findPiece(fen, 'b', 'k')
  const bishops = getWhiteBishopSquares(fen)
  if (!blackKing || bishops.length !== 2) return 64

  const safeSquares = new Set(
    allSquares().filter((square) => {
      const occupant = chess.get(square)
      return (
        !(occupant?.color === 'w' && occupant.type === 'b') &&
        bishops.every(
          (bishop) =>
            !bishopControlsSquareWithoutBlackBlocker(fen, bishop, square),
        )
      )
    }),
  )
  const seeds = safeSquares.has(blackKing.square)
    ? [blackKing.square]
    : chess
        .moves({ verbose: true })
        .filter((move) => move.piece === 'k' && safeSquares.has(move.to))
        .map((move) => move.to)
  let largestArea = 0
  for (const seed of seeds) {
    const reached = new Set<Square>([seed])
    const pending: Square[] = [seed]
    while (pending.length > 0) {
      const square = pending.pop()!
      const { file, rank } = squareCoordinates(square)
      for (let fileOffset = -1; fileOffset <= 1; fileOffset += 1) {
        for (let rankOffset = -1; rankOffset <= 1; rankOffset += 1) {
          if (fileOffset === 0 && rankOffset === 0) continue
          const neighbor = squareFromCoordinates(
            file + fileOffset,
            rank + rankOffset,
          )
          if (
            neighbor &&
            safeSquares.has(neighbor) &&
            !reached.has(neighbor)
          ) {
            reached.add(neighbor)
            pending.push(neighbor)
          }
        }
      }
    }
    largestArea = Math.max(largestArea, reached.size)
  }
  return largestArea
}

export function whiteBishopsAreAdjacent(fen: string): boolean {
  const bishops = getWhiteBishopSquares(fen)
  return bishops.length === 2 && kingDistance(bishops[0], bishops[1]) === 1
}

export function whiteKingMasksBishop(fen: string): boolean {
  const chess = getChess(fen)
  for (const bishop of getWhiteBishopSquares(fen)) {
    const source = squareCoordinates(bishop)
    for (const [fileStep, rankStep] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ] as const) {
      let file = source.file + fileStep
      let rank = source.rank + rankStep
      while (true) {
        const square = squareFromCoordinates(file, rank)
        if (!square) break
        const occupant = chess.get(square)
        if (occupant) {
          if (occupant.color === 'w' && occupant.type === 'k') return true
          break
        }
        file += fileStep
        rank += rankStep
      }
    }
  }
  return false
}

function whiteBishopIsProtectedByKing(fen: string, square: Square): boolean {
  const whiteKing = findPiece(fen, 'w', 'k')
  return Boolean(whiteKing && kingDistance(whiteKing.square, square) <= 1)
}

export function distanceToNearestUnprotectedWhiteBishop(fen: string): number {
  const blackKing = findPiece(fen, 'b', 'k')
  if (!blackKing) return 99
  const unprotectedBishops = getWhiteBishopSquares(fen).filter(
    (square) => !whiteBishopIsProtectedByKing(fen, square),
  )
  if (unprotectedBishops.length === 0) return 99
  return Math.min(
    ...unprotectedBishops.map((square) =>
      kingDistance(blackKing.square, square),
    ),
  )
}

export function areKingsAtPhaseTwoDistance(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  return kingDistance(whiteKing, blackKing) === 2
}

export function isWhiteKingInsideInnerBishopDiagonal(fen: string): boolean {
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (whiteKing === undefined || blackKing === undefined) return false

  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  return bishops.some((cornerBishop, cornerIndex) => {
    const corner = squareCoordinates(cornerBishop)
    const axes: readonly ('difference' | 'sum')[] = [
      ...(corner.file === corner.rank ? ['difference' as const] : []),
      ...(corner.file + corner.rank === 7 ? ['sum' as const] : []),
    ]

    return axes.some((axis) => {
      const blackSide =
        axis === 'difference'
          ? black.file - black.rank
          : black.file + black.rank - 7
      if (Math.abs(blackSide) <= 1) return false
      const direction = Math.sign(blackSide)
      const hasInnerBishop = bishops.some((innerBishop, innerIndex) => {
        if (innerIndex === cornerIndex) return false
        const inner = squareCoordinates(innerBishop)
        const innerIndexOnAxis =
          axis === 'difference'
            ? inner.file - inner.rank
            : inner.file + inner.rank - 7
        return innerIndexOnAxis === direction
      })
      if (!hasInnerBishop) return false
      const whiteSide =
        axis === 'difference'
          ? white.file - white.rank
          : white.file + white.rank - 7
      return whiteSide * direction > 1
    })
  })
}

export function isTwoBishopsPhaseTwoPosition(fen: string): boolean {
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    bishops.length !== 2
  ) {
    return false
  }

  return bishops.some((longBishop, longIndex) => {
    const long = squareCoordinates(longBishop)
    const white = squareCoordinates(whiteKing)
    const black = squareCoordinates(blackKing)
    const longAxes: readonly ('difference' | 'sum')[] = [
      ...(long.file === long.rank ? ['difference' as const] : []),
      ...(long.file + long.rank === 7 ? ['sum' as const] : []),
    ]
    return longAxes.some((axis) =>
      bishops.some((adjacentBishop, adjacentIndex) => {
        if (adjacentIndex === longIndex) return false
        const adjacent = squareCoordinates(adjacentBishop)
        const adjacentDiagonal =
          axis === 'difference'
            ? adjacent.file - adjacent.rank
            : adjacent.file + adjacent.rank - 7
        const blackDiagonal =
          axis === 'difference'
            ? black.file - black.rank
            : black.file + black.rank - 7
        const whiteDiagonal =
          axis === 'difference'
            ? white.file - white.rank
            : white.file + white.rank - 7
        const direction = Math.sign(blackDiagonal) as -1 | 0 | 1
        if (
          blackDiagonal !== 0 &&
          Math.sign(whiteDiagonal) === Math.sign(blackDiagonal) &&
          adjacentDiagonal === -Math.sign(blackDiagonal)
        ) {
          const centerSquare = phaseTwoCenterSquare(
            axis,
            direction as -1 | 1,
          )
          return (
            squaredEuclideanDistance(whiteKing, centerSquare) <=
            squaredEuclideanDistance(blackKing, centerSquare)
          )
        }
        return false
      }),
    )
  })
}

export function whiteBishopsFormDoubleDiagonalWall(fen: string): boolean {
  const bishops = getWhiteBishopSquares(fen)
  if (bishops.length !== 2) return false
  const [first, second] = bishops.map(squareCoordinates)
  const firstDifference = first.file - first.rank
  const secondDifference = second.file - second.rank
  const firstSum = first.file + first.rank
  const secondSum = second.file + second.rank

  return (
    (Math.abs(firstDifference - secondDifference) === 1 &&
      (firstDifference === 0 || secondDifference === 0)) ||
    (Math.abs(firstSum - secondSum) === 1 &&
      (firstSum === 7 || secondSum === 7))
  )
}

export function bishopsOccupyAdjacentDiagonals(
  bishops: readonly Square[],
): boolean {
  if (bishops.length !== 2) return false
  const [first, second] = bishops.map(squareCoordinates)

  return (
    Math.abs(first.file - first.rank - (second.file - second.rank)) === 1 ||
    Math.abs(first.file + first.rank - (second.file + second.rank)) === 1
  )
}

export function getTwoBishopsPhaseLabel(fen: string): string {
  return isTwoBishopsPhaseTwoPosition(fen) ? '2/2' : '1/2'
}
