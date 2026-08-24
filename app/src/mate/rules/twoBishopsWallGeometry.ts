import type { Square } from 'chess.js'
import {
  allSquares,
  edgeDistance,
  findPiece,
  getChess,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squareCoordinates,
  squareFromCoordinates,
  withFenTurn,
} from '../chess'
import { getWhiteBishopSquares } from './twoBishopsPieces'

type DiagonalAxis = 'difference' | 'sum'

export type BishopWallDiagonal = {
  readonly axis: DiagonalAxis
  readonly index: number
}

type WallControl = {
  readonly bishop: Square
  readonly diagonal: BishopWallDiagonal
  readonly screenedByWhiteKing: boolean
  readonly square: Square
}

export type TwoBishopsWall = {
  readonly areaSquares: readonly Square[]
  readonly corner: Square
  readonly cornerDiagonalDistance: number
  readonly escapeSquare: Square
  readonly fartherDiagonal: BishopWallDiagonal
  readonly nearerDiagonal: BishopWallDiagonal
  readonly wallSquares: readonly [Square, Square]
  readonly wallBishops: readonly [Square, Square]
}

const CORNERS: readonly Square[] = ['a1', 'a8', 'h1', 'h8']
const RULE_N_MINIMUM_CORNER_MANHATTAN_DISTANCE = 4
export const TWO_BISHOPS_PHASE_TWO_MINIMUM_DIAGONAL_DISTANCE = 4

function diagonalValue(square: Square, axis: DiagonalAxis): number {
  const { file, rank } = squareCoordinates(square)
  return axis === 'sum' ? file + rank : file - rank
}

function diagonalKey(diagonal: BishopWallDiagonal): string {
  return `${diagonal.axis}:${diagonal.index}`
}

function diagonalDistanceFromCorner(
  corner: Square,
  diagonal: BishopWallDiagonal,
): number {
  return Math.abs(diagonalValue(corner, diagonal.axis) - diagonal.index)
}

function closestSquaresOnDiagonal(
  square: Square,
  diagonal: BishopWallDiagonal,
): readonly Square[] {
  const candidates = allSquares().filter(
    (candidate) =>
      diagonalValue(candidate, diagonal.axis) === diagonal.index,
  )
  const minimumDistance = Math.min(
    ...candidates.map((candidate) => kingDistance(candidate, square)),
  )
  return candidates.filter(
    (candidate) => kingDistance(candidate, square) === minimumDistance,
  )
}

function cornerArea(
  corner: Square,
  diagonal: BishopWallDiagonal,
): readonly Square[] {
  const cornerOffset =
    diagonalValue(corner, diagonal.axis) - diagonal.index
  if (cornerOffset === 0) return []
  const side = Math.sign(cornerOffset)
  return allSquares().filter(
    (square) =>
      side * (diagonalValue(square, diagonal.axis) - diagonal.index) > 0,
  )
}

function bishopControls(
  fen: string,
  bishop: Square,
  target: Square,
): readonly WallControl[] {
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  if (bishop === target) {
    return [
      {
        bishop,
        diagonal: {
          axis: 'difference',
          index: source.file - source.rank,
        },
        screenedByWhiteKing: false,
        square: target,
      },
      {
        bishop,
        diagonal: { axis: 'sum', index: source.file + source.rank },
        screenedByWhiteKing: false,
        square: target,
      },
    ]
  }
  const fileDistance = Math.abs(source.file - destination.file)
  const rankDistance = Math.abs(source.rank - destination.rank)
  if (fileDistance === 0 || fileDistance !== rankDistance) return []

  const diagonal: BishopWallDiagonal =
    source.file - destination.file === source.rank - destination.rank
      ? { axis: 'difference', index: source.file - source.rank }
      : { axis: 'sum', index: source.file + source.rank }
  const fileStep = Math.sign(destination.file - source.file)
  const rankStep = Math.sign(destination.rank - source.rank)
  const chess = getChess(fen)
  let file = source.file + fileStep
  let rank = source.rank + rankStep
  let screenedByWhiteKing = false
  while (file !== destination.file || rank !== destination.rank) {
    const square = squareFromCoordinates(file, rank)
    if (square === null) return []
    const blocker = chess.get(square)
    if (blocker !== undefined) {
      if (
        blocker.color === 'w' &&
        blocker.type === 'k' &&
        !screenedByWhiteKing
      ) {
        screenedByWhiteKing = true
      } else {
        return []
      }
    }
    file += fileStep
    rank += rankStep
  }
  return [{ bishop, diagonal, screenedByWhiteKing, square: target }]
}

function blackKingDestinations(fen: string): ReadonlySet<Square> {
  return new Set(
    getChess(withFenTurn(fen, 'b'))
      .moves({ verbose: true })
      .filter((move) => move.piece === 'k')
      .map((move) => move.to),
  )
}

function blackCanExploitKingScreen(
  fen: string,
  bishop: Square,
  diagonal: BishopWallDiagonal,
  legalBlackDestinations: ReadonlySet<Square>,
): boolean {
  return [...legalBlackDestinations].some((destination) =>
    bishopControls(fen, bishop, destination).some(
      (control) =>
        control.diagonal.axis === diagonal.axis &&
        control.diagonal.index === diagonal.index &&
        control.screenedByWhiteKing,
    ),
  )
}

function bishopDiagonal(
  bishop: Square,
  axis: DiagonalAxis,
): BishopWallDiagonal {
  return { axis, index: diagonalValue(bishop, axis) }
}

export function getTwoBishopsWalls(fen: string): readonly TwoBishopsWall[] {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (blackKing === undefined || bishops.length !== 2) {
    return []
  }

  const legalBlackDestinations = blackKingDestinations(fen)
  const walls = new Map<string, TwoBishopsWall>()
  for (const axis of ['difference', 'sum'] as const) {
    const firstDiagonal = bishopDiagonal(bishops[0], axis)
    const secondDiagonal = bishopDiagonal(bishops[1], axis)
    if (Math.abs(firstDiagonal.index - secondDiagonal.index) !== 1) {
      continue
    }
    for (const corner of CORNERS) {
      const firstDistance = diagonalDistanceFromCorner(corner, firstDiagonal)
      const secondDistance = diagonalDistanceFromCorner(corner, secondDiagonal)
      const [nearerBishop, nearerDiagonal, fartherBishop, fartherDiagonal] =
        firstDistance < secondDistance
          ? [bishops[0], firstDiagonal, bishops[1], secondDiagonal]
          : [bishops[1], secondDiagonal, bishops[0], firstDiagonal]
      const areaSquares = cornerArea(corner, nearerDiagonal)
      if (!areaSquares.includes(blackKing)) continue

      for (const nearerSquare of closestSquaresOnDiagonal(
        blackKing,
        nearerDiagonal,
      )) {
        const nearer = bishopControls(fen, nearerBishop, nearerSquare).find(
          ({ diagonal }) =>
            diagonal.axis === nearerDiagonal.axis &&
            diagonal.index === nearerDiagonal.index,
        )
        if (
          nearer === undefined ||
          blackCanExploitKingScreen(
            fen,
            nearerBishop,
            nearerDiagonal,
            legalBlackDestinations,
          )
        ) {
          continue
        }

        for (const fartherSquare of closestSquaresOnDiagonal(
          blackKing,
          fartherDiagonal,
        )) {
          const farther = bishopControls(
            fen,
            fartherBishop,
            fartherSquare,
          ).find(
            ({ diagonal }) =>
              diagonal.axis === fartherDiagonal.axis &&
              diagonal.index === fartherDiagonal.index,
          )
          if (farther === undefined) continue
          if (
            blackCanExploitKingScreen(
              fen,
              fartherBishop,
              fartherDiagonal,
              legalBlackDestinations,
            )
          ) {
            continue
          }

          const wall: TwoBishopsWall = {
            areaSquares,
            corner,
            cornerDiagonalDistance: Math.min(
              firstDistance,
              secondDistance,
            ),
            escapeSquare: farther.square,
            fartherDiagonal,
            nearerDiagonal,
            wallSquares: [nearer.square, farther.square],
            wallBishops: [nearer.bishop, farther.bishop],
          }
          const key = [
            corner,
            diagonalKey(nearer.diagonal),
            diagonalKey(farther.diagonal),
            ...wall.wallSquares.slice().sort(),
          ].join('|')
          walls.set(key, wall)
        }
      }
    }
  }
  return [...walls.values()]
}

export function getSmallestTwoBishopsWallArea(
  fen: string,
  minimumArea = 4,
): number | null {
  const areas = getTwoBishopsWalls(fen)
    .map((wall) => wall.areaSquares.length)
    .filter((area) => area >= minimumArea)
  return areas.length === 0 ? null : Math.min(...areas)
}

export function getRuleNPreferredMoves(fen: string): readonly string[] {
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  if (whiteKing === undefined) return []
  const controlledStartingWalls = getTwoBishopsWalls(fen).filter(
    (wall) => kingDistance(whiteKing, wall.escapeSquare) <= 1,
  )
  const smallestStartingArea = Math.min(
    ...controlledStartingWalls.map((wall) => wall.areaSquares.length),
  )
  const startingWalls = controlledStartingWalls.filter(
    (wall) => wall.areaSquares.length === smallestStartingArea,
  )
  if (startingWalls.length === 0) return []

  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'b') return false
      const checked = getChess(fen)
      checked.move(move.san)
      if (!checked.isCheck() || checked.isCheckmate()) return false
      const replies = checked.moves({ verbose: true })
      if (replies.length === 0) return false

      return startingWalls.some((startingWall) => {
        if (
          !startingWall.wallBishops.includes(move.from) ||
          manhattanDistance(move.to, startingWall.corner) <
            RULE_N_MINIMUM_CORNER_MANHATTAN_DISTANCE
        ) {
          return false
        }
        let commonBoundaryKeys: Set<string> | undefined
        for (const reply of replies) {
          const result = getChess(checked.fen())
          result.move(reply.san)
          const tighter = getTwoBishopsWalls(result.fen()).filter(
            (wall) =>
              wall.corner === startingWall.corner &&
              wall.nearerDiagonal.axis ===
                startingWall.nearerDiagonal.axis &&
              wall.areaSquares.length < startingWall.areaSquares.length,
          )
          if (tighter.length === 0) return false
          const keys = new Set(
            tighter.map((wall) => diagonalKey(wall.nearerDiagonal)),
          )
          commonBoundaryKeys =
            commonBoundaryKeys === undefined
              ? keys
              : new Set(
                  [...commonBoundaryKeys].filter((key) => keys.has(key)),
                )
          if (commonBoundaryKeys.size === 0) return false
        }
        return (commonBoundaryKeys?.size ?? 0) > 0
      })
    })
    .map((move) => move.san)
}

function squaresAreInOpposition(
  first: Square,
  second: Square,
): boolean {
  const firstCoordinates = squareCoordinates(first)
  const secondCoordinates = squareCoordinates(second)
  const fileDistance = Math.abs(
    firstCoordinates.file - secondCoordinates.file,
  )
  const rankDistance = Math.abs(
    firstCoordinates.rank - secondCoordinates.rank,
  )
  return (
    (fileDistance === 0 && rankDistance === 2) ||
    (rankDistance === 0 && fileDistance === 2)
  )
}

export function getRuleWYPreferredMoves(fen: string): readonly string[] {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  if (blackKing === undefined || edgeDistance(blackKing) !== 0) return []

  const qualifyingWalls = getTwoBishopsWalls(fen).flatMap((wall) =>
    wall.wallBishops
      .filter(
        (bishop) =>
          isKnightMove(bishop, wall.corner) &&
          squaresAreInOpposition(bishop, blackKing),
      )
      .map((bishop) => ({ bishop, wall })),
  )
  if (qualifyingWalls.length === 0) return []

  const preferred = new Set<string>()
  for (const move of getChess(fen).moves({ verbose: true })) {
    if (
      move.piece !== 'b' ||
      !squaresAreInOpposition(move.to, blackKing)
    ) {
      continue
    }
    const result = getChess(fen)
    result.move(move.san)
    if (result.isCheck() || result.isCheckmate() || result.isStalemate()) {
      continue
    }
    const resultWalls = getTwoBishopsWalls(result.fen())
    if (
      qualifyingWalls.some(
        ({ bishop, wall }) =>
          move.from === bishop &&
          move.to !== bishop &&
          resultWalls.some(
            (resultWall) =>
              resultWall.corner === wall.corner &&
              resultWall.wallBishops.includes(move.to),
          ),
      )
    ) {
      preferred.add(move.san)
    }
  }
  return [...preferred]
}

export function countDistantTwoBishops(fen: string): number {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  if (blackKing === undefined) return 0
  return getWhiteBishopSquares(fen).filter(
    (bishop) => kingDistance(bishop, blackKing) >= 3,
  ).length
}
