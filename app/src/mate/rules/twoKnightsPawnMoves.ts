import { Chess, type Move } from 'chess.js'

export const TWO_KNIGHTS_PAWN_START_FEN = 'k7/8/8/8/3KN2p/7N/8/8 w - - 0 1'
export const TWO_KNIGHTS_PAWN_SLOTS = 4 * 64 * 2016 * 64 * 2
const index = (square: string) => square.charCodeAt(0) - 97 + 8 * (Number(square[1]) - 1)

/** Board identity only: counters do not affect this custom game's value. */
export function twoKnightsPawnPositionId(fen: string): number | undefined {
  try {
    const chess = new Chess(fen)
    if (fen.split(/\s+/)[2] !== '-' || fen.split(/\s+/)[3] !== '-') return undefined
    const pieces = chess.board().flat().filter(p => p !== null)
    if (pieces.length !== 5) return undefined
    const wk = pieces.find(p => p.color === 'w' && p.type === 'k')
    const bk = pieces.find(p => p.color === 'b' && p.type === 'k')
    const knights = pieces.filter(p => p.color === 'w' && p.type === 'n').map(p => index(p.square)).sort((a, b) => a - b)
    const extra = pieces.find(p => p.color === 'b' && p.type !== 'k')
    if (!wk || !bk || knights.length !== 2 || !extra) return undefined
    const layer = extra.type === 'q' && extra.square === 'h1' ? 0
      : extra.type === 'p' && /^h[234]$/.test(extra.square) ? Number(extra.square[1]) - 1 : -1
    if (layer < 0) return undefined
    const [a, b] = knights as [number, number]
    const pair = a * (127 - a) / 2 + b - a - 1
    return ((((layer * 64 + index(wk.square)) * 2016 + pair) * 64 + index(bk.square)) * 2 + (chess.turn() === 'b' ? 1 : 0))
  } catch { return undefined }
}

export function isTwoKnightsPawnPermittedMove(move: Move): boolean {
  return move.captured === undefined && move.piece !== 'q' &&
    (move.promotion === undefined || move.promotion === 'q')
}

/** chess.js supplies ordinary attacks/check restrictions, then custom prohibitions apply. */
export function getTwoKnightsPawnPermittedMoves(fen: string): Move[] {
  if (twoKnightsPawnPositionId(fen) === undefined) return []
  return new Chess(fen).moves({ verbose: true }).filter(isTwoKnightsPawnPermittedMove)
}

export type TwoKnightsPawnBoardOutcome = 'checkmate' | 'white-checkmate' | 'stalemate' | 'unsupported'
export function getTwoKnightsPawnBoardOutcome(fen: string): TwoKnightsPawnBoardOutcome | null {
  if (twoKnightsPawnPositionId(fen) === undefined) return 'unsupported'
  const chess = new Chess(fen)
  if (getTwoKnightsPawnPermittedMoves(fen).length > 0) return null
  return chess.isCheck() ? chess.turn() === 'b' ? 'checkmate' : 'white-checkmate' : 'stalemate'
}
