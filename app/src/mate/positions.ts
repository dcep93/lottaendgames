import {
  MATE_CATALOG,
  TWO_KNIGHTS_PAWN_POSITIONS,
  type MateCatalogEntry,
} from './catalog'
import {
  allSquares,
  boardFenFromPlacements,
  collectionIndex,
  getChess,
  getEndgamePieces,
  getSquareTransform,
  randomTransformFen,
  transformFen,
  validateMatePosition,
  whiteBishopsAreOppositeColored,
  type EndgamePiece,
  type EndgamePiecePlacement,
} from './chess'
import type {
  TwoKnightsPawnManifest,
  TwoKnightsPawnSource,
} from './twoKnightsPawnData'
import type { MateId, MateMode } from './types'

const MAX_STANDARD_ATTEMPTS = 1000

export function generateMatePosition(
  mateId: MateId,
  mode: MateMode,
  random: () => number = Math.random,
): string {
  if (mateId === 'two-knights-pawn') {
    return generateTwoKnightsPawnPosition(mode, random)
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

function sourceCollection(
  manifest: TwoKnightsPawnManifest,
  mode: MateMode,
): readonly TwoKnightsPawnSource[] {
  return mode === 'standard' ? manifest.standard : manifest.train
}

export function assertTwoKnightsPawnPositionManifest(
  manifest: TwoKnightsPawnManifest,
): void {
  const transformedPositions = new Set<string>()
  for (const [mode, sources] of [
    ['standard', manifest.standard],
    ['train', manifest.train],
  ] as const) {
    for (const [sourceIndex, source] of sources.entries()) {
      const sourceValidation = validateMatePosition(
        'two-knights-pawn',
        source.fen,
      )
      if (!sourceValidation.ok) {
        throw new Error(
          `${mode}[${sourceIndex}]: ${sourceValidation.reason}`,
        )
      }
      for (const transformName of source.transformNames) {
        const fen = transformFen(source.fen, getSquareTransform(transformName))
        const validation = validateMatePosition('two-knights-pawn', fen)
        if (!validation.ok) {
          throw new Error(
            `${mode}[${sourceIndex}] via ${transformName}: ${validation.reason}`,
          )
        }
        const canonicalFen = getChess(fen).fen()
        if (transformedPositions.has(canonicalFen)) {
          throw new Error(
            `${mode}[${sourceIndex}] via ${transformName}: duplicate transformed position`,
          )
        }
        transformedPositions.add(canonicalFen)
      }
    }
  }
}

assertTwoKnightsPawnPositionManifest(TWO_KNIGHTS_PAWN_POSITIONS)

const supportedTwoKnightsPawnStarts = Object.freeze({
  standard: new Set(
    TWO_KNIGHTS_PAWN_POSITIONS.standard.flatMap((source) =>
      source.transformNames.map((name) =>
        getChess(transformFen(source.fen, getSquareTransform(name))).fen(),
      ),
    ),
  ),
  train: new Set(
    TWO_KNIGHTS_PAWN_POSITIONS.train.flatMap((source) =>
      source.transformNames.map((name) =>
        getChess(transformFen(source.fen, getSquareTransform(name))).fen(),
      ),
    ),
  ),
})

export function isSupportedTwoKnightsPawnStart(
  fen: string,
  mode?: MateMode,
): boolean {
  let canonicalFen: string
  try {
    canonicalFen = getChess(fen).fen()
  } catch {
    return false
  }
  return mode === undefined
    ? supportedTwoKnightsPawnStarts.standard.has(canonicalFen) ||
        supportedTwoKnightsPawnStarts.train.has(canonicalFen)
    : supportedTwoKnightsPawnStarts[mode].has(canonicalFen)
}

function generateTwoKnightsPawnPosition(
  mode: MateMode,
  random: () => number,
): string {
  const sources = sourceCollection(TWO_KNIGHTS_PAWN_POSITIONS, mode)
  const source = sources[collectionIndex(sources.length, random())]!
  const transformName =
    source.transformNames[
      collectionIndex(source.transformNames.length, random())
    ]!
  return transformFen(source.fen, getSquareTransform(transformName))
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
