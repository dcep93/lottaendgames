import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  findPiece,
  getChess,
  kingDistance,
  transformSquare,
} from '../chess'
import { getWhiteBishopSquares } from './twoBishopsGeometry'

type CornerCageOrientation = {
  readonly corner: Square
  readonly blackSquares: ReadonlySet<Square>
  readonly cageDiagonal: ReadonlySet<Square>
  readonly kingTargets: ReadonlySet<Square>
}

export type RuleACornerCageEvaluation = {
  readonly applies: boolean
  readonly penaltiesBySan: ReadonlyMap<string, number>
}

const CANONICAL_CAGE_DIAGONAL = [
  'c8',
  'd7',
  'e6',
  'f5',
  'g4',
  'h3',
] as const satisfies readonly Square[]

function getCornerCageOrientations(
  blackKing: Square,
): readonly CornerCageOrientation[] {
  const orientations = new Map<string, CornerCageOrientation>()
  for (const transform of SQUARE_TRANSFORMS) {
    const corner = transformSquare('h1', transform)
    const edgeSquare = transformSquare('h2', transform)
    const blackSquares = new Set([corner, edgeSquare])
    if (!blackSquares.has(blackKing)) continue

    const cageDiagonal = new Set(
      CANONICAL_CAGE_DIAGONAL.map((square) =>
        transformSquare(square, transform),
      ),
    )
    const kingTargets = new Set([
      transformSquare('f2', transform),
      transformSquare('g3', transform),
    ])
    const key = `${corner}:${[...cageDiagonal].sort().join(',')}`
    orientations.set(key, {
      corner,
      blackSquares,
      cageDiagonal,
      kingTargets,
    })
  }
  return [...orientations.values()]
}

function orientationProgress(
  orientation: CornerCageOrientation,
  whiteKing: Square,
  bishops: readonly Square[],
): 0 | 1 | 2 {
  if (!orientation.kingTargets.has(whiteKing)) return 0
  return bishops.some((bishop) => orientation.cageDiagonal.has(bishop))
    ? 2
    : 1
}

function maximumProgress(
  orientations: readonly CornerCageOrientation[],
  whiteKing: Square,
  bishops: readonly Square[],
): 0 | 1 | 2 {
  return Math.max(
    0,
    ...orientations.map((orientation) =>
      orientationProgress(orientation, whiteKing, bishops),
    ),
  ) as 0 | 1 | 2
}

function distanceToKingTarget(
  orientations: readonly CornerCageOrientation[],
  whiteKing: Square,
): number {
  return Math.min(
    ...orientations.flatMap((orientation) =>
      [...orientation.kingTargets].map((target) =>
        kingDistance(whiteKing, target),
      ),
    ),
  )
}

export function getForcedMateInTwoMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  if (chess.turn() !== 'w') return []

  return chess
    .moves({ verbose: true })
    .filter((move) => {
      const afterWhite = getChess(fen)
      afterWhite.move(move)
      if (afterWhite.isCheckmate()) return true

      const replies = afterWhite.moves({ verbose: true })
      return (
        replies.length > 0 &&
        replies.every((reply) => {
          const afterBlack = getChess(afterWhite.fen())
          afterBlack.move(reply)
          return afterBlack.moves({ verbose: true }).some((mate) => {
            const result = getChess(afterBlack.fen())
            result.move(mate)
            return result.isCheckmate()
          })
        })
      )
    })
    .map((move) => move.san)
}

function waitingMoveReachesMateInTwo(fen: string): boolean {
  const black = getChess(fen)
  const replies = black.moves({ verbose: true })
  return (
    replies.length > 0 &&
    replies.every((reply) => {
      const afterBlack = getChess(fen)
      afterBlack.move(reply)
      return getForcedMateInTwoMoves(afterBlack.fen()).length > 0
    })
  )
}

export function evaluateRuleACornerCage(
  fen: string,
): RuleACornerCageEvaluation {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  if (blackKing === undefined || whiteKing === undefined) {
    return { applies: false, penaltiesBySan: new Map() }
  }

  const orientations = getCornerCageOrientations(blackKing)
  if (orientations.length === 0) {
    return { applies: false, penaltiesBySan: new Map() }
  }

  const bishops = getWhiteBishopSquares(fen)
  const currentProgress = maximumProgress(
    orientations,
    whiteKing,
    bishops,
  )
  const mateInTwoMoves =
    currentProgress === 2 ? new Set(getForcedMateInTwoMoves(fen)) : new Set()
  const penaltiesBySan = new Map<string, number>()

  for (const move of getChess(fen).moves({ verbose: true })) {
    const result = getChess(fen)
    result.move(move)
    const resultWhiteKing =
      move.piece === 'k' ? move.to : whiteKing
    const resultBishops = getWhiteBishopSquares(result.fen())
    const resultProgress = maximumProgress(
      orientations,
      resultWhiteKing,
      resultBishops,
    )

    let penalty: number
    if (currentProgress === 0) {
      penalty =
        move.piece !== 'k'
          ? 100 + distanceToKingTarget(orientations, resultWhiteKing)
          : resultProgress >= 1
            ? 0
            : 10 + distanceToKingTarget(orientations, resultWhiteKing)
    } else if (currentProgress === 1) {
      penalty =
        move.piece === 'b' && resultProgress === 2
          ? 0
          : resultProgress === 1
            ? move.piece === 'b'
              ? 10
              : 20
            : 100
    } else if (mateInTwoMoves.size > 0) {
      penalty = mateInTwoMoves.has(move.san) ? 0 : 100
    } else {
      const isWaitingMove =
        move.piece === 'b' &&
        resultProgress === 2 &&
        !result.isCheck() &&
        !result.isCheckmate() &&
        !result.isStalemate()
      penalty = !isWaitingMove
        ? 100 + (2 - resultProgress) * 100
        : waitingMoveReachesMateInTwo(result.fen())
          ? 0
          : 1
    }
    penaltiesBySan.set(move.san, penalty)
  }

  return { applies: true, penaltiesBySan }
}
