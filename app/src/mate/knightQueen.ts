import type { Square } from 'chess.js'
import type { MateBoardInteraction, LegalTarget } from './boardInteraction'

export const KNIGHT_QUEEN_START: Square = 'h8'
export const KNIGHT_QUEEN_QUEEN: Square = 'd5'

const coords = (square: string) => [square.charCodeAt(0) - 97, Number(square[1]) - 1] as const

export function isKnightQueenSafe(square: string): square is Square {
  if (!/^[a-h][1-8]$/.test(square)) return false
  const [file, rank] = coords(square)
  return file !== 3 && rank !== 4 && Math.abs(file - 3) !== Math.abs(rank - 4)
}

export const KNIGHT_QUEEN_ROUTE: readonly Square[] = Object.freeze(
  Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, column) =>
      `${String.fromCharCode(97 + (row % 2 === 0 ? 7 - column : column))}${8 - row}`,
    ).filter(isKnightQueenSafe),
  ).flat(),
)

export function knightQueenMoves(square: Square): readonly Square[] {
  if (!isKnightQueenSafe(square)) return []
  const [file, rank] = coords(square)
  return KNIGHT_QUEEN_ROUTE.filter(candidate => {
    const [f, r] = coords(candidate)
    return Math.abs(f - file) * Math.abs(r - rank) === 2
  })
}

function distancesTo(target: Square): ReadonlyMap<Square, number> {
  const distances = new Map<Square, number>([[target, 0]])
  const queue = [target]
  for (let index = 0; index < queue.length; index++) {
    const square = queue[index]!
    for (const next of knightQueenMoves(square)) {
      if (distances.has(next)) continue
      distances.set(next, distances.get(square)! + 1)
      queue.push(next)
    }
  }
  return distances
}

const TARGET_DISTANCES = new Map(KNIGHT_QUEEN_ROUTE.map(square => [square, distancesTo(square)]))

export function knightQueenBestMoves(square: Square, target: Square | null): readonly Square[] {
  if (target === null || square === target) return []
  const distances = TARGET_DISTANCES.get(target)
  const distance = distances?.get(square)
  if (distance === undefined) return []
  return knightQueenMoves(square).filter(next => distances!.get(next) === distance - 1)
}

/** Rendering only: kingless exercise positions never enter the chess.js rules engine. */
export function knightQueenFen(knight: Square): string {
  const rows = Array.from({ length: 8 }, (_, row) => {
    let result = ''
    let empty = 0
    for (let file = 0; file < 8; file++) {
      const square = `${String.fromCharCode(97 + file)}${8 - row}`
      const piece = square === knight ? 'N' : square === KNIGHT_QUEEN_QUEEN ? 'q' : ''
      if (!piece) { empty++; continue }
      if (empty) result += empty
      empty = 0
      result += piece
    }
    return result + (empty || '')
  })
  return `${rows.join('/')} w - - 0 1`
}

function knightFromFen(fen: string): Square | null {
  // Accept only the fixed queen and a single safe knight.
  return KNIGHT_QUEEN_ROUTE.find(square => knightQueenFen(square) === fen) ?? null
}

export const knightQueenBoardInteraction: MateBoardInteraction = {
  canSelect: (fen, square, disabled) => !disabled && square === knightFromFen(fen),
  legalTargets: (fen, square, disabled) => {
    const targets = new Map<Square, LegalTarget>()
    if (disabled || square === null || square !== knightFromFen(fen)) return targets
    for (const next of knightQueenMoves(square)) targets.set(next, { isCapture: false })
    return targets
  },
  resolveMove: ({ fen, sourceSquare, targetSquare, disabled }) => {
    const knight = knightFromFen(fen)
    if (disabled || !knight || sourceSquare !== knight || !targetSquare
      || !knightQueenMoves(knight).includes(targetSquare as Square)) return null
    return { fen: knightQueenFen(targetSquare as Square), san: `N${targetSquare}` }
  },
}

export type KnightQueenSnapshot = {
  readonly knight: Square
  readonly nextTargetIndex: number
  readonly movedAtMs?: number
  readonly durationMs: number
}

export type KnightQueenSession = {
  readonly history: readonly KnightQueenSnapshot[]
  readonly cursor: number
  readonly startedAtMs?: number
}

export function createKnightQueenSession(): KnightQueenSession {
  return { history: [{ knight: KNIGHT_QUEEN_START, nextTargetIndex: 1, durationMs: 0 }], cursor: 0 }
}

export function knightQueenTarget(snapshot: KnightQueenSnapshot): Square | null {
  return KNIGHT_QUEEN_ROUTE[snapshot.nextTargetIndex] ?? null
}

export function playKnightQueenMove(session: KnightQueenSession, san: string, now: number): KnightQueenSession {
  const current = session.history[session.cursor]!
  const target = knightQueenTarget(current)
  const destination = /^N([a-h][1-8])$/.exec(san)?.[1] as Square | undefined
  if (!target || !destination || !knightQueenMoves(current.knight).includes(destination)) return session
  const next: KnightQueenSnapshot = {
    knight: destination,
    nextTargetIndex: current.nextTargetIndex + (destination === target ? 1 : 0),
    movedAtMs: now,
    durationMs: session.startedAtMs === undefined ? 0 : Math.max(0, now - (current.movedAtMs ?? session.startedAtMs)),
  }
  return {
    history: [...session.history.slice(0, session.cursor + 1), next],
    cursor: session.cursor + 1,
    startedAtMs: session.startedAtMs ?? now,
  }
}

export function seekKnightQueenSession(session: KnightQueenSession, offset: -1 | 1): KnightQueenSession {
  const cursor = session.cursor + offset
  return cursor < 0 || cursor >= session.history.length ? session : { ...session, cursor }
}
