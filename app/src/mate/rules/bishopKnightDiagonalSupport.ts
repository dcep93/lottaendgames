import type { Square } from 'chess.js'

// Support was reset on 2026-09-24. Only declarations made after this reset
// belong here; geometry and historical declarations do not imply support.
const declaredSupport = new Map<string, {size: number; knight: number}>()

type SupportedDiagonalEvaluation = {
  size: number; knight: number;
  sevenFlushColorPenalty?: number; sevenFlushDistance?: number;
  sevenBishopPenalty?: number; sevenKingTargetDistance?: number; sevenKingTieDistance?: number;
}

export function evaluateKnightAndBishopSupportedDiagonal(fen: string, _blackDestinations?: readonly Square[]): SupportedDiagonalEvaluation {
  if (fen.split(' ')[1] !== 'b') throw new Error('Diagonal support must be evaluated after White moves, with Black to move')
  return {...(declaredSupport.get(fen.split(' ')[0]!) ?? {size: 99, knight: 99})}
}

export function knightAndBishopSupportedDiagonal(fen: string, blackDestinations?: readonly Square[]): {size: number; knight: number} {
  return evaluateKnightAndBishopSupportedDiagonal(fen, blackDestinations)
}

// No r2.5 placement preferences survive the reset.
export function knightAndBishopThreeKingPlacementPenalty(_fen: string): number { return 0 }
export function knightAndBishopFiveBishopPenalty(_fen: string): number { return 0 }
export function knightAndBishopFiveKingTargetDistance(_fen: string): number { return 0 }
export function knightAndBishopShouldCheckThreeDiagonal(_fen: string): boolean { return false }
