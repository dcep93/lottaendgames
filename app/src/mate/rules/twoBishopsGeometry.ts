import type { Square } from 'chess.js'
import {
  allSquares,
  edgeDistance,
  findPiece,
  getChess,
  kingDistance,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'

export function centerDistance(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  return (
    Math.min(Math.abs(file - 3), Math.abs(file - 4)) +
    Math.min(Math.abs(rank - 3), Math.abs(rank - 4))
  )
}

export function getWhiteBishopSquares(fen: string): Square[] {
  return getChess(fen)
    .board()
    .flat()
    .filter((piece) => piece?.color === 'w' && piece.type === 'b')
    .map((piece) => piece!.square)
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

function isBlackForcedToRemainOnEdge(fen: string): boolean {
  const chess = getChess(fen)
  if (chess.turn() !== 'b') return false
  const blackKing = findPiece(fen, 'b', 'k')
  const whiteKing = findPiece(fen, 'w', 'k')
  if (
    !blackKing ||
    !whiteKing ||
    getWhiteBishopSquares(fen).length !== 2 ||
    edgeDistance(blackKing.square) !== 0
  ) {
    return false
  }
  if (!areKingsAtPhaseTwoDistance(whiteKing.square, blackKing.square)) {
    return false
  }
  const blackMoves = chess
    .moves({ verbose: true })
    .filter((move) => move.from === blackKing.square)
  return (
    blackMoves.length > 0 &&
    blackMoves.every((move) => edgeDistance(move.to) === 0)
  )
}

export function isTwoBishopsPhaseTwoPosition(fen: string): boolean {
  const chess = getChess(fen)
  if (chess.turn() === 'b') return isBlackForcedToRemainOnEdge(fen)

  return chess.moves({ verbose: true }).some((move) => {
    const afterMove = getChess(fen)
    afterMove.move(move)
    return isBlackForcedToRemainOnEdge(afterMove.fen())
  })
}

export function getTwoBishopsPhaseLabel(fen: string): string {
  if (getWhiteBishopSquares(fen).length < 2) return '0/2'
  return isTwoBishopsPhaseTwoPosition(fen) ? '2/2' : '1/2'
}
