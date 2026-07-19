import type { PieceSymbol, Square } from 'chess.js'
import {
  allSquares,
  boardFenFromPlacements,
  edgeDistance,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  isKnightMove,
  isStrictlyBetween,
  kingDistance,
  manhattanDistance,
  sideToMoveCanCapturePiece,
  squareCoordinates,
  squareFromCoordinates,
  withFenTurn,
} from '../chess'

export type MajorPieceType = 'q' | 'r'
export type RookAxis = 'rank' | 'file'

export type RookCut = {
  readonly axis: RookAxis
  readonly size: number
  readonly closest: boolean
}

export type RookBox = {
  readonly cuts: readonly RookCut[]
  readonly strongestCuts: readonly RookCut[]
  readonly size: number | null
}

type PieceSquare = {
  readonly square: Square
}

const ROOK_AXES: readonly RookAxis[] = Object.freeze(['rank', 'file'])
const EMPTY_ROOK_CUTS: readonly RookCut[] = Object.freeze([])
const EMPTY_ROOK_BOX: RookBox = Object.freeze({
  cuts: EMPTY_ROOK_CUTS,
  strongestCuts: EMPTY_ROOK_CUTS,
  size: null,
})

export type QueenTwoSquareCage = {
  readonly corner: Square
  readonly pair: readonly [Square, Square]
}

export function isMajorPieceBetweenKings(
  majorPiece: PieceSquare,
  whiteKing: PieceSquare,
  blackKing: PieceSquare,
): boolean {
  const major = squareCoordinates(majorPiece.square)
  const white = squareCoordinates(whiteKing.square)
  const black = squareCoordinates(blackKing.square)
  return (
    isStrictlyBetween(major.rank, white.rank, black.rank) ||
    isStrictlyBetween(major.file, white.file, black.file)
  )
}

export function isQueenRankOrFileChannelBetween(
  square: PieceSquare,
  firstBoundary: PieceSquare,
  secondBoundary: PieceSquare,
): boolean {
  const target = squareCoordinates(square.square)
  const first = squareCoordinates(firstBoundary.square)
  const second = squareCoordinates(secondBoundary.square)
  return (
    isStrictlyBetween(target.rank, first.rank, second.rank) ||
    isStrictlyBetween(target.file, first.file, second.file)
  )
}

export function getMajorEndgamePhase(
  fen: string,
  pieceType: MajorPieceType,
): number {
  const majorPiece = findPiece(fen, 'w', pieceType)
  if (!majorPiece) {
    return 0
  }
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (!whiteKing || !blackKing) {
    return 1
  }
  const isPhaseTwo =
    pieceType === 'q'
      ? isQueenRankOrFileChannelBetween(majorPiece, whiteKing, blackKing)
      : isMajorPieceBetweenKings(majorPiece, whiteKing, blackKing)
  return isPhaseTwo ? 2 : 1
}

export function getMajorEndgamePhaseLabel(
  fen: string,
  pieceType: MajorPieceType,
): string {
  const phase = getMajorEndgamePhase(fen, pieceType)
  const visiblePhase = getChess(fen).turn() === 'w' ? phase : Math.min(phase, 1)
  return `${visiblePhase}/2`
}

export function blackCanTakeWhiteMajorPiece(
  fen: string,
  pieceType: MajorPieceType,
): boolean {
  return sideToMoveCanCapturePiece(fen, 'w', pieceType)
}

export function getQueenBoxArea(
  whiteQueenSquare: Square,
  blackKingSquare: Square,
): number {
  const queen = squareCoordinates(whiteQueenSquare)
  const black = squareCoordinates(blackKingSquare)
  const width =
    queen.file === black.file
      ? 8
      : black.file > queen.file
        ? 7 - queen.file
        : queen.file
  const height =
    queen.rank === black.rank
      ? 8
      : black.rank > queen.rank
        ? 7 - queen.rank
        : queen.rank
  return width * height
}

export function getQueenMoveDistance(
  beforeQueenSquare: Square | undefined,
  afterQueenSquare: Square | undefined,
  piece: PieceSymbol | undefined,
): number | null {
  if (piece === 'q' && beforeQueenSquare && afterQueenSquare) {
    return kingDistance(beforeQueenSquare, afterQueenSquare)
  }
  return null
}

export function compareQueenMoveDistances(
  first: number | null,
  second: number | null,
): number {
  if (first === null || second === null) {
    return 0
  }
  return first - second
}

function queenCagePairs(): readonly QueenTwoSquareCage[] {
  return (['a1', 'a8', 'h1', 'h8'] as const).flatMap((corner) => {
    const coords = squareCoordinates(corner)
    return [
      squareFromCoordinates(coords.file + 1, coords.rank),
      squareFromCoordinates(coords.file - 1, coords.rank),
      squareFromCoordinates(coords.file, coords.rank + 1),
      squareFromCoordinates(coords.file, coords.rank - 1),
    ]
      .filter((square): square is Square => square !== null)
      .map((edgeSquare) => ({
        corner,
        pair: [corner, edgeSquare] as const,
      }))
  })
}

function withBlackKingOnSquare(
  fen: string,
  square: Square,
  turn: 'w' | 'b',
): string | null {
  const placements = getEndgamePiecePlacements(fen)
  const occupant = placements.find((piece) => piece.square === square)
  if (occupant && !(occupant.color === 'b' && occupant.type === 'k')) {
    return null
  }

  const candidatePlacements = placements.filter(
    (piece) =>
      piece.square !== square && !(piece.color === 'b' && piece.type === 'k'),
  )
  candidatePlacements.push({
    color: 'b',
    type: 'k',
    isPawn: false,
    square,
  })
  const candidateFen = `${boardFenFromPlacements(candidatePlacements)} ${turn} - - 0 1`
  try {
    getChess(candidateFen)
  } catch {
    return null
  }
  return candidateFen
}

function queenCagePairIsStable(
  fen: string,
  pair: readonly [Square, Square],
): boolean {
  return pair.every((blackKingSquare) => {
    const pairFen = withBlackKingOnSquare(fen, blackKingSquare, 'b')
    if (pairFen === null) {
      return false
    }
    const moves = getChess(pairFen).moves()
    return (
      moves.length > 0 &&
      moves.every((san) => {
        const nextChess = getChess(pairFen)
        nextChess.move(san)
        const nextBlackKing = findPiece(nextChess.fen(), 'b', 'k')
        return nextBlackKing !== undefined && pair.includes(nextBlackKing.square)
      })
    )
  })
}

export function getQueenTwoSquareCage(
  fen: string,
  turnOverride?: 'w' | 'b',
): QueenTwoSquareCage | null {
  const cageFen = turnOverride ? withFenTurn(fen, turnOverride) : fen
  let moves: string[]
  try {
    moves = getChess(cageFen).moves()
  } catch {
    return null
  }
  const blackKing = findPiece(cageFen, 'b', 'k')
  if (!blackKing || moves.length === 0) {
    return null
  }

  for (const cage of queenCagePairs()) {
    if (
      cage.pair.includes(blackKing.square) &&
      queenCagePairIsStable(cageFen, cage.pair)
    ) {
      return cage
    }
  }
  return null
}

function queenCageKingTargetSquares(
  whiteQueenSquare: Square,
  corner: Square,
): readonly Square[] {
  return allSquares().filter(
    (square) =>
      isKnightMove(square, corner) &&
      isKnightMove(square, whiteQueenSquare),
  )
}

export function getQueenCageKingApproachDistance(
  whiteKingSquare: Square,
  whiteQueenSquare: Square,
  corner: Square,
): number | null {
  const distances = queenCageKingTargetSquares(
    whiteQueenSquare,
    corner,
  ).map((square) => kingDistance(whiteKingSquare, square))
  return distances.length === 0 ? null : Math.min(...distances)
}

export function getQueenCageKingApproachManhattanDistance(
  whiteKingSquare: Square,
  whiteQueenSquare: Square,
  corner: Square,
): number | null {
  const distances = queenCageKingTargetSquares(
    whiteQueenSquare,
    corner,
  ).map((square) => manhattanDistance(whiteKingSquare, square))
  return distances.length === 0 ? null : Math.min(...distances)
}

export function getRookCuts(
  whiteRook: PieceSquare,
  whiteKing: PieceSquare,
  blackKing: PieceSquare,
): readonly RookCut[] {
  const rook = squareCoordinates(whiteRook.square)
  const white = squareCoordinates(whiteKing.square)
  const black = squareCoordinates(blackKing.square)
  return Object.freeze(
    ROOK_AXES.flatMap((axis) => {
      if (!isStrictlyBetween(rook[axis], white[axis], black[axis])) {
        return []
      }
      return [
        Object.freeze({
          axis,
          size: getRookOneDimensionalBoxSize(
            whiteRook.square,
            blackKing.square,
            axis,
          ),
          closest:
            rook[axis] ===
            black[axis] + Math.sign(white[axis] - black[axis]),
        }),
      ]
    }),
  )
}

export function getRookBox(
  whiteRook: PieceSquare,
  whiteKing: PieceSquare,
  blackKing: PieceSquare,
): RookBox {
  const cuts = getRookCuts(whiteRook, whiteKing, blackKing)
  if (cuts.length === 0) {
    return EMPTY_ROOK_BOX
  }
  const size = Math.min(...cuts.map((cut) => cut.size))
  const strongestCuts = Object.freeze(
    cuts.filter((cut) => cut.size === size),
  )
  return Object.freeze({ cuts, strongestCuts, size })
}

export function getRookBoxFromFen(fen: string): RookBox {
  const whiteRook = findPiece(fen, 'w', 'r')
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (!whiteRook || !whiteKing || !blackKing) {
    return EMPTY_ROOK_BOX
  }
  return getRookBox(whiteRook, whiteKing, blackKing)
}

function getRookOneDimensionalBoxSize(
  whiteRookSquare: Square,
  blackKingSquare: Square,
  axis: RookAxis,
): number {
  const rook = squareCoordinates(whiteRookSquare)
  const black = squareCoordinates(blackKingSquare)
  if (axis === 'rank') {
    return black.rank > rook.rank ? 7 - rook.rank : rook.rank
  }
  return black.file > rook.file ? 7 - rook.file : rook.file
}

export function getAxisDistance(
  firstSquare: Square,
  secondSquare: Square,
  axis: RookAxis,
): number {
  const first = squareCoordinates(firstSquare)
  const second = squareCoordinates(secondSquare)
  return Math.abs(first[axis] - second[axis])
}

export function blackMustMoveAwayFromWhiteKing(fen: string): boolean {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  if (!whiteKing || !blackKing) {
    return false
  }
  const currentDistance = kingDistance(whiteKing.square, blackKing.square)
  const moves = getChess(fen).moves()
  return (
    moves.length > 0 &&
    moves.every((san) => {
      const nextChess = getChess(fen)
      nextChess.move(san)
      const nextBlackKing = findPiece(nextChess.fen(), 'b', 'k')
      return (
        nextBlackKing !== undefined &&
        kingDistance(whiteKing.square, nextBlackKing.square) > currentDistance
      )
    })
  )
}

export { edgeDistance }
