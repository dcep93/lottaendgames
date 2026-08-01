import type { Square } from 'chess.js'
import {
  boardFenFromPlacements,
  edgeDistance,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  isStrictlyBetween,
  kingDistance,
  sideToMoveCanCapturePiece,
  squareCoordinates,
  squareFromCoordinates,
  withFenTurn,
} from '../chess'

export type MajorPieceType = 'q' | 'r'
export type RookAxis = 'rank' | 'file'
export type RookEdge = 'north' | 'east' | 'south' | 'west'

export type RookCut = {
  readonly axis: RookAxis
  readonly edge: RookEdge
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

export type QueenBoxDimensions = {
  readonly shorterSide: number
  readonly longerSide: number
}

export type QueenBoxAxisSides = {
  readonly fileSide: number
  readonly rankSide: number
}

export type QueenBoxCorner = 'a1' | 'a8' | 'h1' | 'h8'

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

export function isQueenTighterChannelBetween(
  square: PieceSquare,
  queenBoundary: PieceSquare,
  blackBoundary: PieceSquare,
): boolean {
  const target = squareCoordinates(square.square)
  const queen = squareCoordinates(queenBoundary.square)
  const black = squareCoordinates(blackBoundary.square)
  const { fileSide, rankSide } = getQueenBoxAxisSides(
    queenBoundary.square,
    blackBoundary.square,
  )
  return (
    (rankSide <= fileSide &&
      isStrictlyBetween(target.rank, queen.rank, black.rank)) ||
    (fileSide <= rankSide &&
      isStrictlyBetween(target.file, queen.file, black.file))
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
      ? getQueenTwoSquareCage(fen) !== null
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

export function getQueenBoxDimensions(
  whiteQueenSquare: Square,
  blackKingSquare: Square,
): QueenBoxDimensions {
  const { fileSide, rankSide } = getQueenBoxAxisSides(
    whiteQueenSquare,
    blackKingSquare,
  )
  return Object.freeze({
    shorterSide: Math.min(fileSide, rankSide),
    longerSide: Math.max(fileSide, rankSide),
  })
}

export function getQueenBoxSquares(
  whiteQueenSquare: Square,
  blackKingSquare: Square,
): readonly Square[] {
  const queen = squareCoordinates(whiteQueenSquare)
  const black = squareCoordinates(blackKingSquare)
  const axisRange = (queenCoordinate: number, blackCoordinate: number) =>
    queenCoordinate === blackCoordinate
      ? Array.from({ length: 8 }, (_, coordinate) => coordinate)
      : blackCoordinate < queenCoordinate
        ? Array.from({ length: queenCoordinate }, (_, coordinate) => coordinate)
        : Array.from(
            { length: 7 - queenCoordinate },
            (_, index) => queenCoordinate + index + 1,
          )
  const files = axisRange(queen.file, black.file)
  const ranks = axisRange(queen.rank, black.rank)

  return Object.freeze(
    ranks.flatMap((rank) =>
      files.map((file) => {
        const square = squareFromCoordinates(file, rank)
        if (square === null) {
          throw new Error('Queen box generated an invalid square')
        }
        return square
      }),
    ),
  )
}

export function isSquareInClosedQueenBox(
  square: Square,
  whiteQueenSquare: Square,
  blackKingSquare: Square,
): boolean {
  const target = squareCoordinates(square)
  const queen = squareCoordinates(whiteQueenSquare)
  const black = squareCoordinates(blackKingSquare)
  const isOnCornerSide = (
    targetCoordinate: number,
    queenCoordinate: number,
    blackCoordinate: number,
  ) =>
    queenCoordinate === blackCoordinate ||
    (blackCoordinate < queenCoordinate
      ? targetCoordinate <= queenCoordinate
      : targetCoordinate >= queenCoordinate)

  return (
    isOnCornerSide(target.file, queen.file, black.file) &&
    isOnCornerSide(target.rank, queen.rank, black.rank)
  )
}

export function getQueenBoxSafeSquareCount(fen: string): number {
  const whiteQueen = findPiece(fen, 'w', 'q')
  const blackKing = findPiece(fen, 'b', 'k')
  if (!whiteQueen || !blackKing) return 0

  const chess = getChess(fen)
  chess.remove(blackKing.square)
  return getQueenBoxSquares(whiteQueen.square, blackKing.square).filter(
    (square) =>
      chess.get(square) === undefined && !chess.isAttacked(square, 'w'),
  ).length
}

export function getQueenBoxAxisSides(
  whiteQueenSquare: Square,
  blackKingSquare: Square,
): QueenBoxAxisSides {
  const queen = squareCoordinates(whiteQueenSquare)
  const black = squareCoordinates(blackKingSquare)
  const fileSide =
    queen.file === black.file
      ? 8
      : black.file > queen.file
        ? 7 - queen.file
        : queen.file
  const rankSide =
    queen.rank === black.rank
      ? 8
      : black.rank > queen.rank
        ? 7 - queen.rank
        : queen.rank
  return Object.freeze({
    fileSide,
    rankSide,
  })
}

export function getQueenBoxCorners(
  whiteQueenSquare: Square,
  blackKingSquare: Square,
): readonly QueenBoxCorner[] {
  const queen = squareCoordinates(whiteQueenSquare)
  const black = squareCoordinates(blackKingSquare)
  const files: readonly ('a' | 'h')[] =
    queen.file === black.file
      ? ['a', 'h']
      : black.file < queen.file
        ? ['a']
        : ['h']
  const ranks: readonly ('1' | '8')[] =
    queen.rank === black.rank
      ? ['1', '8']
      : black.rank < queen.rank
        ? ['1']
        : ['8']

  return Object.freeze(
    files.flatMap((file) =>
      ranks.map((rank) => `${file}${rank}` as QueenBoxCorner),
    ),
  )
}

export function isQueenSameCornerBoxShrink(
  currentQueenSquare: Square,
  resultQueenSquare: Square,
  blackKingSquare: Square,
): boolean {
  const currentCorners = getQueenBoxCorners(
    currentQueenSquare,
    blackKingSquare,
  )
  const resultCorners = getQueenBoxCorners(resultQueenSquare, blackKingSquare)
  const keepsCorner = resultCorners.some((corner) =>
    currentCorners.includes(corner),
  )
  if (!keepsCorner) return false

  const current = getQueenBoxDimensions(
    currentQueenSquare,
    blackKingSquare,
  )
  const result = getQueenBoxDimensions(resultQueenSquare, blackKingSquare)
  return (
    result.shorterSide < current.shorterSide ||
    (result.shorterSide === current.shorterSide &&
      result.longerSide < current.longerSide)
  )
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

function queenEdgeSegmentsContaining(
  square: Square,
): readonly (readonly Square[])[] {
  const edges = [
    Array.from({ length: 8 }, (_, file) =>
      squareFromCoordinates(file, 0),
    ),
    Array.from({ length: 8 }, (_, file) =>
      squareFromCoordinates(file, 7),
    ),
    Array.from({ length: 8 }, (_, rank) =>
      squareFromCoordinates(0, rank),
    ),
    Array.from({ length: 8 }, (_, rank) =>
      squareFromCoordinates(7, rank),
    ),
  ].map((edge) =>
    edge.filter((candidate): candidate is Square => candidate !== null),
  )

  return edges.flatMap((edge) => {
    const squareIndex = edge.indexOf(square)
    if (squareIndex === -1) {
      return []
    }
    const segments: Square[][] = []
    for (let start = 0; start <= squareIndex; start += 1) {
      for (let end = squareIndex + 1; end <= edge.length; end += 1) {
        if (start === 0 || end === edge.length) {
          segments.push(edge.slice(start, end))
        }
      }
    }
    return segments
  })
}

function queenEdgeSegmentIsStable(
  fen: string,
  segment: readonly Square[],
): boolean {
  return segment.every((blackKingSquare) => {
    const segmentFen = withBlackKingOnSquare(fen, blackKingSquare, 'b')
    if (segmentFen === null) {
      return false
    }
    const moves = getChess(segmentFen).moves({ verbose: true })
    return (
      moves.length > 0 &&
      moves.every(
        (move) =>
          move.piece === 'k' &&
          move.captured !== 'q' &&
          segment.includes(move.to),
      )
    )
  })
}

export function getQueenEdgeCageSize(
  fen: string,
  turnOverride?: 'w' | 'b',
): number | null {
  const cageFen = turnOverride ? withFenTurn(fen, turnOverride) : fen
  let moves: string[]
  try {
    moves = getChess(cageFen).moves()
  } catch {
    return null
  }
  const blackKing = findPiece(cageFen, 'b', 'k')
  if (!blackKing || moves.length === 0 || edgeDistance(blackKing.square) !== 0) {
    return null
  }

  return (
    [...queenEdgeSegmentsContaining(blackKing.square)]
      .sort((first, second) => first.length - second.length)
      .find((segment) => queenEdgeSegmentIsStable(cageFen, segment))
      ?.length ?? null
  )
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
      if (
        rook[axis] === 0 ||
        rook[axis] === 7 ||
        !isBetweenBlackAndWhiteWall(rook[axis], white[axis], black[axis])
      ) {
        return []
      }
      return [
        Object.freeze({
          axis,
          edge: getRookCutEdge(
            whiteRook.square,
            blackKing.square,
            axis,
          ),
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

function getRookCutEdge(
  whiteRookSquare: Square,
  blackKingSquare: Square,
  axis: RookAxis,
): RookEdge {
  const rook = squareCoordinates(whiteRookSquare)
  const black = squareCoordinates(blackKingSquare)
  if (axis === 'rank') {
    return black.rank > rook.rank ? 'north' : 'south'
  }
  return black.file > rook.file ? 'east' : 'west'
}

function isBetweenBlackAndWhiteWall(
  rook: number,
  white: number,
  black: number,
): boolean {
  return isStrictlyBetween(rook, white, black)
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
