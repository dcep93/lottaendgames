import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  findPiece,
  getChess,
  squareCoordinates,
  squareFromCoordinates,
  transformSquare,
} from '../chess'
import { getWhiteBishopSquares } from './twoBishopsGeometry'

export type RuleAADiagonalEscapeEvaluation = {
  readonly applies: boolean
  readonly penaltiesBySan: ReadonlyMap<string, number>
}

const CANONICAL_TARGET_DIAGONAL = [
  'a6',
  'b5',
  'c4',
  'd3',
  'e2',
  'f1',
] as const satisfies readonly Square[]

function bishopControlsSquare(
  fen: string,
  bishop: Square,
  target: Square,
): boolean {
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  if (
    bishop === target ||
    Math.abs(source.file - destination.file) !==
      Math.abs(source.rank - destination.rank)
  ) {
    return false
  }

  const chess = getChess(fen)
  const fileStep = Math.sign(destination.file - source.file)
  const rankStep = Math.sign(destination.rank - source.rank)
  let file = source.file + fileStep
  let rank = source.rank + rankStep
  while (file !== destination.file || rank !== destination.rank) {
    const square = squareFromCoordinates(file, rank)
    if (square === null || chess.get(square) !== undefined) return false
    file += fileStep
    rank += rankStep
  }
  return true
}

export function evaluateRuleAADiagonalEscape(
  fen: string,
): RuleAADiagonalEscapeEvaluation {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (blackKing === undefined || whiteKing === undefined || bishops.length !== 2) {
    return { applies: false, penaltiesBySan: new Map() }
  }

  const targetDiagonals: ReadonlySet<Square>[] = []
  for (const transform of SQUARE_TRANSFORMS) {
    if (blackKing !== transformSquare('g1', transform)) continue
    if (whiteKing !== transformSquare('h3', transform)) continue

    const escapeSquare = transformSquare('f2', transform)
    if (!bishops.some((bishop) => bishopControlsSquare(fen, bishop, escapeSquare))) {
      continue
    }

    const targetDiagonal = new Set(
      CANONICAL_TARGET_DIAGONAL.map((square) =>
        transformSquare(square, transform),
      ),
    )
    if (bishops.some((bishop) => targetDiagonal.has(bishop))) continue
    targetDiagonals.push(targetDiagonal)
  }

  if (targetDiagonals.length === 0) {
    return { applies: false, penaltiesBySan: new Map() }
  }

  return {
    applies: true,
    penaltiesBySan: new Map(
      getChess(fen).moves({ verbose: true }).map((move) => [
        move.san,
        move.piece === 'b' &&
        targetDiagonals.some((diagonal) => diagonal.has(move.to))
          ? 0
          : 1,
      ]),
    ),
  }
}
