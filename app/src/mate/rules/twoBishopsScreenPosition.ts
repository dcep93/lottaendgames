import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  findPiece,
  getChess,
  transformSquare,
} from '../chess'
import { getWhiteBishopSquares } from './twoBishopsGeometry'

export type RuleBScreenPositionEvaluation = {
  readonly applies: boolean
  readonly penaltiesBySan: ReadonlyMap<string, number>
}

const CANONICAL_FLEXIBLE_BISHOP_DIAGONAL = [
  'd1',
  'e2',
  'f3',
  'g4',
  'h5',
] as const satisfies readonly Square[]

export function evaluateRuleBScreenPosition(
  fen: string,
): RuleBScreenPositionEvaluation {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (blackKing === undefined || whiteKing === undefined || bishops.length !== 2) {
    return { applies: false, penaltiesBySan: new Map() }
  }

  const matchingTargets = new Set<Square>()
  for (const transform of SQUARE_TRANSFORMS) {
    if (blackKing !== transformSquare('f1', transform)) continue
    if (whiteKing !== transformSquare('g3', transform)) continue

    const screeningBishop = transformSquare('h4', transform)
    const flexibleDiagonal = new Set(
      CANONICAL_FLEXIBLE_BISHOP_DIAGONAL.map((square) =>
        transformSquare(square, transform),
      ),
    )
    if (!bishops.includes(screeningBishop)) continue
    if (!bishops.some((bishop) => flexibleDiagonal.has(bishop))) continue

    matchingTargets.add(transformSquare('h3', transform))
  }

  if (matchingTargets.size === 0) {
    return { applies: false, penaltiesBySan: new Map() }
  }

  return {
    applies: true,
    penaltiesBySan: new Map(
      getChess(fen).moves({ verbose: true }).map((move) => [
        move.san,
        move.piece === 'k' && matchingTargets.has(move.to) ? 0 : 1,
      ]),
    ),
  }
}
