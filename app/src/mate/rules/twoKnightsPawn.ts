import { knightCaptureNote, knightCaptureReplay } from './twoKnightsPawnNotes'
import { getChess } from '../chess'
import { twoKnightsPawnEntry, twoKnightsPawnTableReady } from './twoKnightsPawnTable'
import { getTwoKnightsPawnPermittedMoves, getTwoKnightsPawnBoardOutcome, twoKnightsPawnMoveKey } from './twoKnightsPawnMoves'
import type { MateRuleSet, OrderedRule, ScoredMove } from './types'
export { getTwoKnightsPawnBoardOutcome, getTwoKnightsPawnPermittedMoves } from './twoKnightsPawnMoves'
export type TwoKnightsPawnTerminalOutcome = 'checkmate' | 'white-checkmate' | 'stalemate' | 'unsupported'
export type TwoKnightsPawnWhiteMoveScore = { penalty: number }
export type TwoKnightsPawnBlackMoveScore = { remainingPlies: number }
export const twoKnightsPawnWhiteRules: readonly OrderedRule<TwoKnightsPawnWhiteMoveScore>[] = [{
  id: 'tablebase', shortLabel: 'Tablebase',
  helpText: 'Choose a shortest forced mate in the custom-rule tablebase; ties use a stable move order.',
  compare: (a, b) => a.penalty - b.penalty,
}]
function successors(fen: string) {
  return getTwoKnightsPawnPermittedMoves(fen).map(move => ({
    san: move.san,
    key: twoKnightsPawnMoveKey(fen, move),
    entry: twoKnightsPawnEntry(move.after),
  }))
}
export function getIdealTwoKnightsPawnWhiteMoves(fen: string): string[] {
  const entry = twoKnightsPawnEntry(fen)
  if (getChess(fen).turn() !== 'w' || entry?.status !== 'win') return []
  const rows = successors(fen)
  if (rows.some(row => !row.entry)) return []
  const best = rows.filter(row => row.entry?.status === 'win' && row.entry.plies + 1 === entry.plies)
    .sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0)[0]
  return best ? [best.san] : []
}
export function scoreTwoKnightsPawnWhiteCandidates(fen: string, moves: readonly string[] = getTwoKnightsPawnPermittedMoves(fen).map(m => m.san)): readonly ScoredMove<TwoKnightsPawnWhiteMoveScore>[] {
  const selected = getIdealTwoKnightsPawnWhiteMoves(fen)[0]
  // Legal manual moves remain available even when there is no recommendation.
  if (!selected) return []
  return moves.map(san => ({ san, score: { penalty: san === selected ? 0 : 1 } }))
}
export function scoreTwoKnightsPawnWhiteMove(fen: string, san: string): TwoKnightsPawnWhiteMoveScore {
  if (!getTwoKnightsPawnPermittedMoves(fen).some(m => m.san === san)) throw new Error(`Prohibited two-knights move: ${san}`)
  return { penalty: getIdealTwoKnightsPawnWhiteMoves(fen).includes(san) ? 0 : 1 }
}
export const compareTwoKnightsPawnWhiteScores = (a: TwoKnightsPawnWhiteMoveScore, b: TwoKnightsPawnWhiteMoveScore) => a.penalty - b.penalty
export function scoreTwoKnightsPawnBlackMove(fen: string, san: string): TwoKnightsPawnBlackMoveScore {
  const row = successors(fen).find(row => row.san === san)
  if (!row) throw new Error(`Prohibited two-knights move: ${san}`)
  if (!row.entry) throw new Error('Successor is outside tablebase coverage')
  return { remainingPlies: row.entry.status === 'win' ? row.entry.plies : 65534 }
}
export const compareTwoKnightsPawnBlackScores = (a: TwoKnightsPawnBlackMoveScore, b: TwoKnightsPawnBlackMoveScore) => b.remainingPlies - a.remainingPlies
export function getIdealTwoKnightsPawnBlackMoves(fen: string): string[] {
  const entry = twoKnightsPawnEntry(fen)
  if (getChess(fen).turn() !== 'b' || !entry) return []
  const rows = successors(fen)
  if (rows.some(row => !row.entry)) return []
  return rows.filter(row => entry.status === 'no-forced-mate'
    ? row.entry?.status === 'no-forced-mate'
    : row.entry?.status === 'win' && row.entry.plies + 1 === entry.plies).map(row => row.san)
}
export function getTwoKnightsPawnTerminalOutcome(fen: string): TwoKnightsPawnTerminalOutcome | null {
  // Coverage is consulted only after loading; no-forced-mate is not terminal.
  if (twoKnightsPawnTableReady() && !twoKnightsPawnEntry(fen)) return 'unsupported'
  return getTwoKnightsPawnBoardOutcome(fen)
}
export function getTwoKnightsPawnStatus(fen: string): string {
  if (!twoKnightsPawnTableReady()) return 'Tablebase · Loading'
  const entry = twoKnightsPawnEntry(fen)
  return !entry ? 'Tablebase · Unsupported position'
    : entry.status === 'no-forced-mate' ? 'Tablebase · No forced mate'
    : `Tablebase · DTM ${entry.plies} ${entry.plies === 1 ? 'ply' : 'plies'}`
}
export const twoKnightsPawnRuleSet: MateRuleSet<TwoKnightsPawnWhiteMoveScore> = {
  id: 'two-knights-pawn', phase: getTwoKnightsPawnStatus,
  scoreWhite: scoreTwoKnightsPawnWhiteMove,
  scoreWhiteCandidates: scoreTwoKnightsPawnWhiteCandidates,
  whiteRules: twoKnightsPawnWhiteRules,
  whiteMoves: fen => getChess(fen).turn() === 'w' ? getTwoKnightsPawnPermittedMoves(fen).map(m => m.san) : [],
  blackCandidates: fen => ({
    moves: getChess(fen).turn() === 'b' ? getTwoKnightsPawnPermittedMoves(fen).map(m => m.san) : [],
    idealMoves: getIdealTwoKnightsPawnBlackMoves(fen),
  }),
  help: {
    title: 'Custom-rule tablebase',
    whiteIntro: 'White chooses one deterministic shortest forced mate. DTM counts plies, including both sides’ moves. You can play any permitted move and evaluate the resulting position.',
    blackIntro: 'Black chooses every reply tying for the longest forced mate. With no forced White mate, replies that deny mate are preferred.',
    blackPriorities: ['Deny a forced White mate when possible; otherwise maximize the remaining plies to mate.'],
    notes: [
      knightCaptureNote,
      'Captures are prohibited for both sides. Both White knights are free to move.',
      'The edge pawn promotes only to a queen on its file (h1 or a1). That queen never moves or captures, but its normal attacks still restrict White’s king.',
      'The fifty-move rule is ignored. Checkmate and stalemate use only permitted moves.',
      'No forced mate is a tablebase result, and manual play remains available. Unsupported positions are outside the positions covered by the tablebase, including file reflections.',
      'This is a custom-rule tablebase, not an ordinary-chess Syzygy tablebase.',
    ], noteLinks: [{ noteIndex: 0, label: 'Replay the excluded knight-capture finish on Lichess', href: knightCaptureReplay }], noteBoards: [],
  },
}
