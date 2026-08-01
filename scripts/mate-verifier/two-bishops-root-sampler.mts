import { readFileSync, writeFileSync } from 'node:fs'
import {
  boardFenFromPlacements,
  edgeDistance,
  findPiece,
  getChess,
  hasDirectKingOpposition,
  isKnightMove,
  kingDistance,
  squareColor,
  validateMatePosition,
  type EndgamePiecePlacement,
} from '../../app/src/mate/chess.ts'
import { getMateRuleSet } from '../../app/src/mate/rules/index.ts'
import {
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  whiteBishopsAreAdjacent,
} from '../../app/src/mate/rules/twoBishopsGeometry.ts'
import { isViableTwoBishopsStart } from '../../app/src/mate/positions.ts'
import {
  canonicalVerifierPositionKey,
  normalizeVerifierState,
  type ProductionMateVerificationState,
} from './production.mts'
import type { MateVerificationRoot } from './types.mts'

type Square = EndgamePiecePlacement['square']

export type TwoBishopsRootSample = {
  readonly candidateRoots: number
  readonly corpusRoots: number
  readonly sampledRoots: number
  readonly roots: readonly MateVerificationRoot<ProductionMateVerificationState>[]
  readonly seed: number
  readonly strata: Readonly<Record<string, number>>
}

export type TwoBishopsCorpusMerge = {
  readonly added: number
  readonly roots: readonly string[]
}

type Candidate = {
  readonly root: MateVerificationRoot<ProductionMateVerificationState>
  readonly stratum: string
}

const ALL_SQUARES = Array.from({ length: 64 }, (_, index) => {
  const file = String.fromCharCode('a'.charCodeAt(0) + (index % 8))
  const rank = Math.floor(index / 8) + 1
  return `${file}${rank}` as Square
})

const CORNERS: readonly Square[] = ['a1', 'a8', 'h1', 'h8']
const DEFAULT_CORPUS_URL = new URL(
  './two-bishops-adversarial-roots.json',
  import.meta.url,
)
const FULL_STRATUM_CACHE = new Map<string, string>()

export function sampleTwoBishopsRoots(
  count: number,
  seed: number,
  corpusFens: readonly string[] = readAdversarialTwoBishopsRoots(),
): TwoBishopsRootSample {
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new Error('Two Bishops sample count must be a positive integer')
  }
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new Error('Two Bishops sample seed must be a uint32')
  }

  const random = mulberry32(seed)
  const seen = new Set<string>()
  const selected: Candidate[] = []
  let corpusRoots = 0
  for (const fen of corpusFens) {
    const candidate = candidateFromFen(fen, 'adversarial corpus', true)
    if (!candidate) continue
    const key = canonicalVerifierPositionKey('two-bishops', candidate.root.state)
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(candidate)
    corpusRoots += 1
  }

  let candidateRoots = 0
  let sampledRoots = 0
  const maximumAttempts = Math.max(10_000, count * 2_000)
  for (
    let attempts = 0;
    attempts < maximumAttempts && sampledRoots < count;
    attempts += 1
  ) {
    const fen = randomTwoBishopsFen(random)
    const candidate = candidateFromFen(
      fen,
      `sample seed ${seed}`,
      false,
    )
    if (!candidate) continue
    candidateRoots += 1
    const key = canonicalVerifierPositionKey('two-bishops', candidate.root.state)
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(candidate)
    sampledRoots += 1
  }
  if (sampledRoots < count) {
    throw new Error(
      `Only generated ${sampledRoots} unique legal candidates for a ${count}-root sample`,
    )
  }

  return finishSample(
    selected.map(({ root }) => ({
      root,
      stratum: fullStratum(root.state),
    })),
    seed,
    candidateRoots,
    corpusRoots,
    sampledRoots,
  )
}

export function readAdversarialTwoBishopsRoots(): readonly string[] {
  const parsed: unknown = JSON.parse(readFileSync(DEFAULT_CORPUS_URL, 'utf8'))
  if (
    !Array.isArray(parsed) ||
    parsed.some((value) => typeof value !== 'string')
  ) {
    throw new Error('Two Bishops adversarial corpus must be a JSON string array')
  }
  return parsed
}

export function mergeAdversarialTwoBishopsRoots(
  discoveredFens: readonly string[],
  corpusFens: readonly string[] = readAdversarialTwoBishopsRoots(),
): TwoBishopsCorpusMerge {
  const seen = new Set<string>()
  const roots: string[] = []
  const add = (fen: string): void => {
    const candidate = candidateFromFen(fen, 'adversarial corpus', true)
    if (!candidate) return
    const key = canonicalVerifierPositionKey('two-bishops', candidate.root.state)
    if (seen.has(key)) return
    seen.add(key)
    roots.push(candidate.root.state)
  }
  for (const fen of corpusFens) add(fen)
  const originalRoots = roots.length
  for (const fen of discoveredFens) add(fen)
  return {
    added: roots.length - originalRoots,
    roots,
  }
}

export function updateAdversarialTwoBishopsRoots(
  discoveredFens: readonly string[],
): TwoBishopsCorpusMerge {
  const merged = mergeAdversarialTwoBishopsRoots(discoveredFens)
  if (merged.added > 0) {
    writeFileSync(
      DEFAULT_CORPUS_URL,
      `${JSON.stringify(merged.roots, null, 2)}\n`,
      'utf8',
    )
  }
  return merged
}

function finishSample(
  selected: readonly Candidate[],
  seed: number,
  candidateRoots: number,
  corpusRoots: number,
  sampledRoots: number,
): TwoBishopsRootSample {
  const strata: Record<string, number> = {}
  for (const { stratum } of selected) {
    strata[stratum] = (strata[stratum] ?? 0) + 1
  }
  return {
    candidateRoots,
    corpusRoots,
    sampledRoots,
    roots: selected.map(({ root }) => root),
    seed,
    strata,
  }
}

function candidateFromFen(
  fen: string,
  source: string,
  includeRule: boolean,
): Candidate | undefined {
  let canonicalFen: string
  try {
    canonicalFen = getChess(fen).fen()
  } catch {
    return undefined
  }
  if (!validateMatePosition('two-bishops', canonicalFen).ok) return undefined
  if (!isViableTwoBishopsStart(canonicalFen)) return undefined
  const state = normalizeVerifierState(canonicalFen)
  return {
    root: {
      fen: canonicalFen,
      halfmoveClock: Number(canonicalFen.split(' ')[4] ?? 0),
      source,
      state,
    },
    stratum: includeRule
      ? fullStratum(state)
      : classifyTwoBishopsRoot(state),
  }
}

function classifyTwoBishopsRoot(fen: string): string {
  const blackKing = findPiece(fen, 'b', 'k')!
  const whiteKing = findPiece(fen, 'w', 'k')!
  const bishops = getWhiteBishopSquares(fen)
  const cornerDistance = Math.min(
    ...CORNERS.map((corner) => kingDistance(blackKing.square, corner)),
  )
  const attackedBishop = bishops.some(
    (bishop) => kingDistance(blackKing.square, bishop) === 1,
  )
  const opposition = hasDirectKingOpposition(
    whiteKing.square,
    blackKing.square,
  )
    ? 'direct'
    : isKnightMove(whiteKing.square, blackKing.square)
      ? 'knight'
      : 'other'
  const bishopColors = bishops.map(squareColor)
  return [
    isTwoBishopsPhaseTwoPosition(fen) ? 'phase2' : 'phase1',
    `edge${edgeDistance(blackKing.square)}`,
    `corner${Math.min(2, cornerDistance)}`,
    whiteBishopsAreAdjacent(fen) ? 'adjacent' : 'separated',
    attackedBishop ? 'attacked' : 'safe',
    opposition,
    bishopColors[0] === bishopColors[1] ? 'same-color' : 'opposite-color',
  ].join('|')
}

function fullStratum(fen: string): string {
  const key = canonicalVerifierPositionKey('two-bishops', fen)
  const cached = FULL_STRATUM_CACHE.get(key)
  if (cached) return cached
  const activeRule =
    getMateRuleSet('two-bishops').currentWhiteHint(fen)?.id ?? 'gap'
  const stratum = `${classifyTwoBishopsRoot(fen)}|rule:${activeRule}`
  FULL_STRATUM_CACHE.set(key, stratum)
  return stratum
}

function randomTwoBishopsFen(random: () => number): string {
  const indices = new Set<number>()
  while (indices.size < 4) indices.add(Math.floor(random() * 64))
  const [blackKing, whiteKing, firstBishop, secondBishop] = [...indices].map(
    (index) => ALL_SQUARES[index]!,
  )
  const placements: EndgamePiecePlacement[] = [
    { color: 'b', isPawn: false, square: blackKing!, type: 'k' },
    { color: 'w', isPawn: false, square: whiteKing!, type: 'k' },
    { color: 'w', isPawn: false, square: firstBishop!, type: 'b' },
    { color: 'w', isPawn: false, square: secondBishop!, type: 'b' },
  ]
  return `${boardFenFromPlacements(placements)} w - - 0 1`
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b_79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000
  }
}
