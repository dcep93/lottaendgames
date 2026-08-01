import type { Square } from 'chess.js'
import {
  allSquares,
  edgeDistance,
  findPiece,
  getChess,
  kingDistance,
  squareCoordinates,
  squareFromCoordinates,
  withFenTurn,
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

function sharesAnyEdge(first: Square, second: Square): boolean {
  const a = squareCoordinates(first)
  const b = squareCoordinates(second)
  return (
    (a.file === 0 && b.file === 0) ||
    (a.file === 7 && b.file === 7) ||
    (a.rank === 0 && b.rank === 0) ||
    (a.rank === 7 && b.rank === 7)
  )
}

export function isTwoBishopsPhaseTwoPosition(fen: string): boolean {
  if (getChess(fen).turn() !== 'w') return false
  const blackKing = findPiece(fen, 'b', 'k')
  if (
    !blackKing ||
    getWhiteBishopSquares(fen).length !== 2 ||
    edgeDistance(blackKing.square) !== 0
  ) {
    return false
  }
  const blackMoves = getChess(withFenTurn(fen, 'b'))
    .moves({ verbose: true })
    .filter((move) => move.from === blackKing.square)
  const blackTrappedOnCurrentEdge =
    blackMoves.length > 0 &&
    blackMoves.every(
      (move) =>
        edgeDistance(move.to) === 0 &&
        sharesAnyEdge(blackKing.square, move.to),
    )
  const blackTrappedInCornerCage =
    blackMoves.length > 0 &&
    getBlackKingReachableArea(fen) <= 3 &&
    blackMoves.every((move) => edgeDistance(move.to) === 0)
  if (blackTrappedOnCurrentEdge || blackTrappedInCornerCage) return true

  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => move.piece === 'k')
    .some((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move.san)
      if (afterWhite.isStalemate()) return false
      const replies = afterWhite
        .moves({ verbose: true })
        .filter((reply) => reply.from === blackKing.square)
      return (
        replies.length > 0 &&
        replies.every(
          (reply) =>
            edgeDistance(reply.to) === 0 &&
            sharesAnyEdge(blackKing.square, reply.to),
        )
      )
    })
}

export function getTwoBishopsPhaseLabel(fen: string): string {
  if (getWhiteBishopSquares(fen).length < 2) return '0/2'
  return isTwoBishopsPhaseTwoPosition(fen) ? '2/2' : '1/2'
}
