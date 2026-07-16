import type { Square } from 'chess.js'
import {
  getChess,
  squareColor,
  squareCoords,
  squareFromCoords,
} from '../chess'

export type KnightAndBishopZone5 = {
  readonly zoneSquares: readonly [Square, Square]
  readonly escapeSquare: Square | 'offboard'
  readonly targetKingSquare: Square
  readonly stableKnightSquare: Square
}

export type KnightAndBishopZoneXSetup = {
  readonly bishopSquare: Square
  readonly blackAnchorSquares: readonly Square[]
  readonly stableKnightSquares: readonly Square[]
}

export function centerDistance(square: Square): number {
  const coords = squareCoords(square)
  return (
    Math.min(Math.abs(coords.file - 3), Math.abs(coords.file - 4)) +
    Math.min(Math.abs(coords.rank - 3), Math.abs(coords.rank - 4))
  )
}

export function isMiddle16Square(square: Square): boolean {
  const { file, rank } = squareCoords(square)
  return file >= 2 && file <= 5 && rank >= 2 && rank <= 5
}

function distanceToRange(value: number, minimum: number, maximum: number) {
  if (value < minimum) return minimum - value
  if (value > maximum) return value - maximum
  return 0
}

export function middle16Distance(square: Square): number {
  const { file, rank } = squareCoords(square)
  return distanceToRange(file, 2, 5) + distanceToRange(rank, 2, 5)
}

export function sameSquareColor(first: Square, second: Square): boolean {
  return squareColor(first) === squareColor(second)
}

export function sameDiagonal(first: Square, second: Square): boolean {
  const a = squareCoords(first)
  const b = squareCoords(second)
  return Math.abs(a.file - b.file) === Math.abs(a.rank - b.rank)
}

export function bishopControlsOrOccupiesSquare(
  fen: string,
  bishop: Square,
  target: Square,
): boolean {
  if (bishop === target) return true
  if (!sameDiagonal(bishop, target)) return false
  const bishopCoords = squareCoords(bishop)
  const targetCoords = squareCoords(target)
  const fileStep = Math.sign(targetCoords.file - bishopCoords.file)
  const rankStep = Math.sign(targetCoords.rank - bishopCoords.rank)
  let file = bishopCoords.file + fileStep
  let rank = bishopCoords.rank + rankStep
  const chess = getChess(fen)
  while (file !== targetCoords.file || rank !== targetCoords.rank) {
    const square = squareFromCoords(file, rank)
    if (!square || chess.get(square)) return false
    file += fileStep
    rank += rankStep
  }
  return true
}

export function getSquareInFrontOfWhiteKingBetweenKings(
  whiteKing: Square,
  blackKing: Square,
): Square | null {
  return getSquaresInFrontOfWhiteKingBetweenKings(whiteKing, blackKing)[0] ?? null
}

export function getSquaresInFrontOfWhiteKingBetweenKings(
  whiteKing: Square,
  blackKing: Square,
): Square[] {
  const whiteCoords = squareCoords(whiteKing)
  const blackCoords = squareCoords(blackKing)
  const fileDistance = blackCoords.file - whiteCoords.file
  const rankDistance = blackCoords.rank - whiteCoords.rank
  const absoluteFileDistance = Math.abs(fileDistance)
  const absoluteRankDistance = Math.abs(rankDistance)
  if (Math.max(absoluteFileDistance, absoluteRankDistance) < 2) return []

  if (absoluteFileDistance > absoluteRankDistance) {
    return [
      squareFromCoords(
        whiteCoords.file + Math.sign(fileDistance),
        whiteCoords.rank,
      ),
    ].filter((square): square is Square => Boolean(square))
  }
  if (absoluteRankDistance > absoluteFileDistance) {
    return [
      squareFromCoords(
        whiteCoords.file,
        whiteCoords.rank + Math.sign(rankDistance),
      ),
    ].filter((square): square is Square => Boolean(square))
  }
  return [
    squareFromCoords(
      whiteCoords.file + Math.sign(fileDistance),
      whiteCoords.rank,
    ),
    squareFromCoords(
      whiteCoords.file,
      whiteCoords.rank + Math.sign(rankDistance),
    ),
  ].filter((square): square is Square => Boolean(square))
}
