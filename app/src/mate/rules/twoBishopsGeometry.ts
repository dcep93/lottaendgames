import type { Square } from 'chess.js'
import {
  edgeDistance,
  findPiece,
  getChess,
  kingDistance,
  squareCoordinates,
  squareFromCoordinates,
  withFenTurn,
} from '../chess'

const CORNERS = ['a1', 'a8', 'h1', 'h8'] as const

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

export function blackCanTakeWhiteBishops(fen: string): boolean {
  const chess = getChess(fen)
  if (chess.turn() !== 'b') return false
  const currentCount = getWhiteBishopSquares(fen).length
  return chess.moves().some((san) => {
    const nextChess = getChess(fen)
    nextChess.move(san)
    return getWhiteBishopSquares(nextChess.fen()).length < currentCount
  })
}

export function blackCanWalkUpToWhiteBishop(fen: string): boolean {
  const chess = getChess(fen)
  if (chess.turn() !== 'b') return false
  return chess.moves().some((san) => {
    const nextChess = getChess(fen)
    const move = nextChess.move(san)
    if (move.captured === 'b') return false
    const blackKing = findPiece(nextChess.fen(), 'b', 'k')
    return Boolean(
      blackKing &&
        getWhiteBishopSquares(nextChess.fen()).some(
          (square) => kingDistance(blackKing.square, square) <= 1,
        ),
    )
  })
}

export function getWhiteBishopDistanceToSquare(
  fen: string,
  target: Square,
): number {
  return getWhiteBishopSquares(fen).reduce(
    (distance, square) => distance + kingDistance(square, target),
    0,
  )
}

export function getWhiteKingDistanceToBishops(
  fen: string,
  whiteKing: Square,
): number {
  return getWhiteBishopSquares(fen).reduce(
    (distance, square) => distance + kingDistance(whiteKing, square),
    0,
  )
}

function squareScreensSquareFromSource(
  source: Square,
  screen: Square,
  target: Square,
): boolean {
  return (
    screen !== source &&
    screen !== target &&
    kingDistance(source, screen) + kingDistance(screen, target) ===
      kingDistance(source, target)
  )
}

export function getWhiteKingBishopScreeningPenalty(fen: string): number {
  const blackKing = findPiece(fen, 'b', 'k')
  const whiteKing = findPiece(fen, 'w', 'k')
  if (!blackKing || !whiteKing) return 0
  return getWhiteBishopSquares(fen).reduce(
    (screening, bishop) =>
      screening +
      (squareScreensSquareFromSource(
        blackKing.square,
        whiteKing.square,
        bishop,
      )
        ? 1
        : 0),
    0,
  )
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

export function isCorner(square: Square): boolean {
  return CORNERS.includes(square as (typeof CORNERS)[number])
}

export function closestCorner(square: Square): Square {
  return [...CORNERS].sort(
    (first, second) =>
      kingDistance(square, first) - kingDistance(square, second),
  )[0]
}

export function getCurrentEdgeCorners(square: Square): Square[] {
  const { file, rank } = squareCoordinates(square)
  const corners: Square[] = []
  if (file === 0) corners.push('a1', 'a8')
  if (file === 7) corners.push('h1', 'h8')
  if (rank === 0) corners.push('a1', 'h1')
  if (rank === 7) corners.push('a8', 'h8')
  return [...new Set(corners)]
}

export function sharesAnyEdge(first: Square, second: Square): boolean {
  const a = squareCoordinates(first)
  const b = squareCoordinates(second)
  return (
    (a.file === 0 && b.file === 0) ||
    (a.file === 7 && b.file === 7) ||
    (a.rank === 0 && b.rank === 0) ||
    (a.rank === 7 && b.rank === 7)
  )
}

function sameDiagonal(first: Square, second: Square): boolean {
  const a = squareCoordinates(first)
  const b = squareCoordinates(second)
  return Math.abs(a.file - b.file) === Math.abs(a.rank - b.rank)
}

export function bishopControlsOrOccupiesSquare(
  fen: string,
  bishop: Square,
  target: Square,
): boolean {
  if (bishop === target) return true
  if (!sameDiagonal(bishop, target)) return false
  const bishopCoordinates = squareCoordinates(bishop)
  const targetCoordinates = squareCoordinates(target)
  const fileStep = Math.sign(targetCoordinates.file - bishopCoordinates.file)
  const rankStep = Math.sign(targetCoordinates.rank - bishopCoordinates.rank)
  let file = bishopCoordinates.file + fileStep
  let rank = bishopCoordinates.rank + rankStep
  const chess = getChess(fen)
  while (file !== targetCoordinates.file || rank !== targetCoordinates.rank) {
    const square = squareFromCoordinates(file, rank)
    if (!square || chess.get(square)) return false
    file += fileStep
    rank += rankStep
  }
  return true
}

export function getBlackKingFrontSquares(blackKing: Square): Square[] {
  const { file, rank } = squareCoordinates(blackKing)
  if (rank === 0 && file === 0) return ['a2', 'b1', 'b2']
  if (rank === 0 && file === 7) return ['h2', 'g1', 'g2']
  if (rank === 7 && file === 0) return ['a7', 'b8', 'b7']
  if (rank === 7 && file === 7) return ['h7', 'g8', 'g7']
  const candidates: Array<Square | null> = []
  if (rank === 0) {
    candidates.push(
      squareFromCoordinates(file - 1, rank + 1),
      squareFromCoordinates(file, rank + 1),
      squareFromCoordinates(file + 1, rank + 1),
    )
  } else if (rank === 7) {
    candidates.push(
      squareFromCoordinates(file - 1, rank - 1),
      squareFromCoordinates(file, rank - 1),
      squareFromCoordinates(file + 1, rank - 1),
    )
  } else if (file === 0) {
    candidates.push(
      squareFromCoordinates(file + 1, rank - 1),
      squareFromCoordinates(file + 1, rank),
      squareFromCoordinates(file + 1, rank + 1),
    )
  } else if (file === 7) {
    candidates.push(
      squareFromCoordinates(file - 1, rank - 1),
      squareFromCoordinates(file - 1, rank),
      squareFromCoordinates(file - 1, rank + 1),
    )
  }
  return candidates.filter((square): square is Square => square !== null)
}

function isDiagonalEdgeWalkPhaseTwo(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
): boolean {
  const black = squareCoordinates(blackKing)
  const white = squareCoordinates(whiteKing)
  if (
    Math.abs(black.file - white.file) !== 2 ||
    Math.abs(black.rank - white.rank) !== 2
  ) {
    return false
  }
  const moves = getChess(withFenTurn(fen, 'b')).moves({ verbose: true })
  if (moves.length === 0) return false
  return moves.every((move) => {
    if (move.from !== blackKing || edgeDistance(move.to) !== 0) return false
    const target = squareCoordinates(move.to)
    const movesTowardWhiteOnFileEdge =
      (black.file === 0 || black.file === 7) &&
      target.file === black.file &&
      Math.abs(target.rank - white.rank) <
        Math.abs(black.rank - white.rank)
    const movesTowardWhiteOnRankEdge =
      (black.rank === 0 || black.rank === 7) &&
      target.rank === black.rank &&
      Math.abs(target.file - white.file) <
        Math.abs(black.file - white.file)
    return movesTowardWhiteOnFileEdge || movesTowardWhiteOnRankEdge
  })
}

export function isTwoBishopsPhaseTwoPosition(fen: string): boolean {
  if (getChess(fen).turn() !== 'w') return false
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
  const controlledFrontSquares = getBlackKingFrontSquares(
    blackKing.square,
  ).filter((square) => kingDistance(whiteKing.square, square) === 1)
  return (
    controlledFrontSquares.length >= 2 ||
    isDiagonalEdgeWalkPhaseTwo(fen, blackKing.square, whiteKing.square)
  )
}

export function getTwoBishopsPhaseLabel(fen: string): string {
  if (getWhiteBishopSquares(fen).length < 2) return '0/2'
  return isTwoBishopsPhaseTwoPosition(fen) ? '2/2' : '1/2'
}
