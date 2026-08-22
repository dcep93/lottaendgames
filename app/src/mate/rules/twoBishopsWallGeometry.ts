import type { Square } from 'chess.js'
import {
  allSquares,
  findPiece,
  getChess,
  kingDistance,
  squareCoordinates,
  squareFromCoordinates,
  withFenTurn,
} from '../chess'
import { getWhiteBishopSquares } from './twoBishopsGeometry'

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
  readonly escapeSquare: Square
  readonly fartherDiagonal: BishopWallDiagonal
  readonly nearerDiagonal: BishopWallDiagonal
  readonly wallSquares: readonly [Square, Square]
  readonly wallBishops: readonly [Square, Square]
}

const CORNERS: readonly Square[] = ['a1', 'a8', 'h1', 'h8']

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

function kingDistanceToDiagonal(
  square: Square,
  diagonal: BishopWallDiagonal,
): number {
  return Math.min(
    ...allSquares()
      .filter(
        (square) => diagonalValue(square, diagonal.axis) === diagonal.index,
      )
      .map((candidate) => kingDistance(candidate, square)),
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

function bishopControl(
  fen: string,
  bishop: Square,
  target: Square,
): WallControl | null {
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  const fileDistance = Math.abs(source.file - destination.file)
  const rankDistance = Math.abs(source.rank - destination.rank)
  if (fileDistance === 0 || fileDistance !== rankDistance) return null

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
    if (square === null) return null
    const blocker = chess.get(square)
    if (blocker !== undefined) {
      if (
        blocker.color === 'w' &&
        blocker.type === 'k' &&
        !screenedByWhiteKing
      ) {
        screenedByWhiteKing = true
      } else {
        return null
      }
    }
    file += fileStep
    rank += rankStep
  }
  return { bishop, diagonal, screenedByWhiteKing, square: target }
}

function blackKingDestinations(fen: string): ReadonlySet<Square> {
  return new Set(
    getChess(withFenTurn(fen, 'b'))
      .moves({ verbose: true })
      .filter((move) => move.piece === 'k')
      .map((move) => move.to),
  )
}

function adjacentSquares(square: Square): readonly Square[] {
  const { file, rank } = squareCoordinates(square)
  const result: Square[] = []
  for (let fileOffset = -1; fileOffset <= 1; fileOffset += 1) {
    for (let rankOffset = -1; rankOffset <= 1; rankOffset += 1) {
      if (fileOffset === 0 && rankOffset === 0) continue
      const adjacent = squareFromCoordinates(
        file + fileOffset,
        rank + rankOffset,
      )
      if (adjacent !== null) result.push(adjacent)
    }
  }
  return result
}

export function getTwoBishopsWalls(fen: string): readonly TwoBishopsWall[] {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (blackKing === undefined || bishops.length !== 2) {
    return []
  }

  const legalBlackDestinations = blackKingDestinations(fen)
  const adjacent = adjacentSquares(blackKing)
  const adjacentSet = new Set(adjacent)
  const walls = new Map<string, TwoBishopsWall>()
  for (const firstSquare of adjacent) {
    for (const secondSquare of adjacentSquares(firstSquare)) {
      if (secondSquare === blackKing) continue
      for (const [firstBishop, secondBishop] of [
        [bishops[0], bishops[1]],
        [bishops[1], bishops[0]],
      ] as const) {
        const first = bishopControl(fen, firstBishop, firstSquare)
        const second = bishopControl(fen, secondBishop, secondSquare)
        if (first === null || second === null) continue
        if (
          first.diagonal.axis !== second.diagonal.axis ||
          Math.abs(first.diagonal.index - second.diagonal.index) !== 1
        ) {
          continue
        }
        for (const corner of CORNERS) {
          const firstDistance = diagonalDistanceFromCorner(
            corner,
            first.diagonal,
          )
          const secondDistance = diagonalDistanceFromCorner(
            corner,
            second.diagonal,
          )
          const nearerChoices: readonly [WallControl, WallControl][] =
            firstDistance < secondDistance
              ? [[first, second]]
              : secondDistance < firstDistance
                ? [[second, first]]
                : [
                    [first, second],
                    [second, first],
                  ]
          for (const [nearer, farther] of nearerChoices) {
            if (!adjacentSet.has(nearer.square)) continue
            if (
              kingDistance(farther.square, blackKing) !==
              kingDistanceToDiagonal(blackKing, farther.diagonal)
            ) {
              continue
            }
            if (nearer.screenedByWhiteKing) continue
            const areaSquares = cornerArea(corner, nearer.diagonal)
            if (!areaSquares.includes(blackKing)) {
              continue
            }
            if (
              farther.screenedByWhiteKing &&
              legalBlackDestinations.has(farther.square)
            ) {
              continue
            }
            const wall: TwoBishopsWall = {
              areaSquares,
              corner,
              escapeSquare: farther.square,
              fartherDiagonal: farther.diagonal,
              nearerDiagonal: nearer.diagonal,
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
  const startingWalls = getTwoBishopsWalls(fen).filter(
    (wall) => kingDistance(whiteKing, wall.escapeSquare) <= 1,
  )
  if (startingWalls.length === 0) return []

  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (
        move.piece !== 'b' ||
        !startingWalls.some((wall) => wall.wallBishops.includes(move.from))
      ) {
        return false
      }
      const checked = getChess(fen)
      checked.move(move.san)
      if (!checked.isCheck() || checked.isCheckmate()) return false
      const replies = checked.moves({ verbose: true })
      if (replies.length === 0) return false

      return startingWalls.some((startingWall) => {
        let commonBoundaryKeys: Set<string> | undefined
        for (const reply of replies) {
          const result = getChess(checked.fen())
          result.move(reply.san)
          const tighter = getTwoBishopsWalls(result.fen()).filter(
            (wall) =>
              wall.corner === startingWall.corner &&
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

export function countDistantTwoBishops(fen: string): number {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  if (blackKing === undefined) return 0
  return getWhiteBishopSquares(fen).filter(
    (bishop) => kingDistance(bishop, blackKing) >= 3,
  ).length
}
