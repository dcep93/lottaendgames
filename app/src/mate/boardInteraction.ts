import type { CSSProperties } from 'react'
import type { Square } from 'chess.js'
import { getChess } from './chess'

export const MATE_MOVE_ANIMATION_MS = 100
export const MATE_REPLY_ANIMATION_MS = MATE_MOVE_ANIMATION_MS

export type LegalTarget = {
  readonly isCapture: boolean
}

type TryMateBoardMoveOptions = {
  readonly fen: string
  readonly sourceSquare: string
  readonly targetSquare: string | null
  readonly disabled: boolean
  readonly onMove: (san: string) => void
}

type ResolveMateBoardMoveOptions = Omit<TryMateBoardMoveOptions, 'onMove'>

export type ResolvedMateBoardMove = {
  readonly fen: string
  readonly san: string
}

const SQUARE_PATTERN = /^[a-h][1-8]$/

export function tryMateBoardMove({
  fen,
  sourceSquare,
  targetSquare,
  disabled,
  onMove,
}: TryMateBoardMoveOptions): boolean {
  const move = resolveMateBoardMove({
    disabled,
    fen,
    sourceSquare,
    targetSquare,
  })
  if (move === null) return false
  onMove(move.san)
  return true
}

export function resolveMateBoardMove({
  fen,
  sourceSquare,
  targetSquare,
  disabled,
}: ResolveMateBoardMoveOptions): ResolvedMateBoardMove | null {
  if (
    disabled ||
    targetSquare === null ||
    sourceSquare === targetSquare ||
    !SQUARE_PATTERN.test(sourceSquare) ||
    !SQUARE_PATTERN.test(targetSquare)
  ) {
    return null
  }

  try {
    const chess = getChess(fen)
    const source = sourceSquare as Square
    const target = targetSquare as Square
    if (chess.get(source)?.color !== chess.turn()) {
      return null
    }
    const move = chess.move({ from: source, to: target })
    if (move === null) return null
    return { fen: chess.fen(), san: move.san }
  } catch {
    return null
  }
}

export function getMateBoardSquareStyles(
  lastMove: readonly [Square, Square] | null,
  selectedSquare: Square | null,
  legalTargets: ReadonlyMap<Square, LegalTarget>,
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {}

  if (lastMove !== null) {
    const lastMoveStyle = {
      background: 'var(--leg-mate-board-last-move, rgba(205, 170, 72, 0.5))',
    }
    styles[lastMove[0]] = lastMoveStyle
    styles[lastMove[1]] = lastMoveStyle
  }

  if (selectedSquare !== null) {
    styles[selectedSquare] = {
      ...styles[selectedSquare],
      background: 'var(--leg-mate-board-selected, rgba(255, 159, 176, 0.46))',
    }
  }

  legalTargets.forEach(({ isCapture }, square) => {
    const existingBackground = styles[square]?.background
    styles[square] = isCapture
      ? {
          ...styles[square],
          borderRadius: '50%',
          boxShadow: 'inset 0 0 0 0.34rem rgba(20, 15, 12, 0.32)',
        }
      : {
          ...styles[square],
          background: [
            'radial-gradient(circle, rgba(20, 15, 12, 0.34) 0 18%, transparent 19%)',
            existingBackground,
          ].filter(Boolean).join(', '),
        }
  })

  return styles
}

export function canSelectSideToMovePiece(
  fen: string,
  square: string,
  disabled: boolean,
): boolean {
  if (disabled || !SQUARE_PATTERN.test(square)) return false
  try {
    const chess = getChess(fen)
    return chess.get(square as Square)?.color === chess.turn()
  } catch {
    return false
  }
}

export function getLegalTargets(
  fen: string,
  square: Square | null,
  disabled: boolean,
): ReadonlyMap<Square, LegalTarget> {
  const targets = new Map<Square, LegalTarget>()
  if (
    square === null ||
    !canSelectSideToMovePiece(fen, square, disabled)
  ) {
    return targets
  }

  try {
    const chess = getChess(fen)
    for (const move of chess.moves({ square, verbose: true })) {
      targets.set(move.to, { isCapture: move.captured !== undefined })
    }
  } catch {
    return targets
  }
  return targets
}
