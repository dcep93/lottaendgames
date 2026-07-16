import { MATE_CATALOG, type MateCatalogEntry } from './catalog'
import {
  allSquares,
  boardFenFromPlacements,
  collectionIndex,
  getEndgamePieces,
  randomTransformFen,
  validateMatePosition,
  whiteBishopsAreOppositeColored,
  type EndgamePiece,
  type EndgamePiecePlacement,
} from './chess'
import type { MateId, MateMode } from './types'

const MAX_STANDARD_ATTEMPTS = 1000

export function generateMatePosition(
  mateId: MateId,
  mode: MateMode,
  random: () => number = Math.random,
): string {
  if (mateId === 'two-knights-pawn') {
    throw new Error('Two Knights vs Pawn generation is not registered')
  }

  const entry = getCatalogEntry(mateId)
  if (mode === 'train') {
    const seed =
      entry.trainSeeds[collectionIndex(entry.trainSeeds.length, random())]
    return randomTransformFen(seed, random)
  }

  const pieces = getEndgamePieces(entry.standardFallbackFen)
  for (let attempt = 0; attempt < MAX_STANDARD_ATTEMPTS; attempt += 1) {
    const fen = generateStandardAttempt(mateId, pieces, random)
    if (fen !== null) return fen
  }
  return entry.standardFallbackFen
}

function generateStandardAttempt(
  mateId: MateId,
  pieces: readonly EndgamePiece[],
  random: () => number,
): string | null {
  const availableSquares = allSquares()
  const placements: EndgamePiecePlacement[] = []

  for (const piece of pieces) {
    const candidates = availableSquares.filter(
      (square) => !piece.isPawn || (square[1] !== '1' && square[1] !== '8'),
    )
    if (candidates.length === 0) return null
    const square = candidates[collectionIndex(candidates.length, random())]
    availableSquares.splice(availableSquares.indexOf(square), 1)
    placements.push({ ...piece, square })
  }

  if (
    mateId === 'two-bishops' &&
    !whiteBishopsAreOppositeColored(placements)
  ) {
    return null
  }

  const fen = `${boardFenFromPlacements(placements)} w - - 0 1`
  return validateMatePosition(mateId, fen).ok ? fen : null
}

function getCatalogEntry(mateId: MateId): MateCatalogEntry {
  const entry = MATE_CATALOG.find((candidate) => candidate.id === mateId)
  if (entry === undefined) {
    throw new Error(`Unknown mate set: ${mateId}`)
  }
  return entry
}
