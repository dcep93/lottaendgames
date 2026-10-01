import { getChess, getEndgamePiecePlacements } from '../chess'
import { compareScoresByRules, selectIdealMoves } from './selection'
import { twoKnightsPawnEntry } from './twoKnightsPawnTable'
import { knightCaptureNote, knightCaptureReplay } from './twoKnightsPawnNotes'
import type { MateRuleSet, OrderedRule, ScoredMove } from './types'

export type TwoKnightsPawnTerminalOutcome =
  | 'checkmate'
  | 'stalemate'
  | 'lost-knight'
  | 'pawn-promoted'
  | 'fifty-move'
  | 'unsupported'
export type TwoKnightsPawnWhiteMoveScore = { stage: number; penalty: number }
export type TwoKnightsPawnBlackMoveScore = { remainingPlies: number }
export const twoKnightsPawnWhiteRules: readonly OrderedRule<TwoKnightsPawnWhiteMoveScore>[] =
  [
    ['r1', 'Deliver checkmate.'],
    ['r2', 'Lock the king.'],
    ['r3', 'Blockade the pawn.'],
  ].map(([id, helpText], i) => ({
    id: id!,
    shortLabel: `rule ${id}`,
    helpText: helpText!,
    applies: (score) => score.stage === i + 1,
    compare: (a, b) => a.penalty - b.penalty,
  }))

export function scoreTwoKnightsPawnWhiteCandidates(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): readonly ScoredMove<TwoKnightsPawnWhiteMoveScore>[] {
  const entry = twoKnightsPawnEntry(fen)
  const chess = getChess(fen)
  const selected =
    entry &&
    chess
      .moves({ verbose: true })
      .find((m) => m.from === entry.from && m.to === entry.to)?.san
  return moves.map((san) => ({
    san,
    score: { stage: entry?.stage ?? 0, penalty: san === selected ? 0 : 1 },
  }))
}
export function scoreTwoKnightsPawnWhiteMove(
  fen: string,
  san: string,
): TwoKnightsPawnWhiteMoveScore {
  const row = scoreTwoKnightsPawnWhiteCandidates(fen).find((m) => m.san === san)
  if (!row) throw new Error(`Illegal h-pawn move: ${san}`)
  return row.score
}
export const compareTwoKnightsPawnWhiteScores = (
  a: TwoKnightsPawnWhiteMoveScore,
  b: TwoKnightsPawnWhiteMoveScore,
) => compareScoresByRules(a, b, twoKnightsPawnWhiteRules)
export function getIdealTwoKnightsPawnWhiteMoves(fen: string): string[] {
  if (getChess(fen).turn() !== 'w' || !twoKnightsPawnEntry(fen)) return []
  return [
    ...selectIdealMoves(
      scoreTwoKnightsPawnWhiteCandidates(fen),
      twoKnightsPawnWhiteRules,
    ),
  ]
}
export function scoreTwoKnightsPawnBlackMove(
  fen: string,
  san: string,
): TwoKnightsPawnBlackMoveScore {
  const chess = getChess(fen)
  chess.move(san)
  return {
    remainingPlies: chess.isCheckmate()
      ? 0
      : (twoKnightsPawnEntry(chess.fen())?.plies ?? 10000),
  }
}
export const compareTwoKnightsPawnBlackScores = (
  a: TwoKnightsPawnBlackMoveScore,
  b: TwoKnightsPawnBlackMoveScore,
) => b.remainingPlies - a.remainingPlies
export function getIdealTwoKnightsPawnBlackMoves(fen: string): string[] {
  const chess = getChess(fen)
  if (chess.turn() !== 'b') return []
  const rows = chess
    .moves()
    .map((san) => ({ san, score: scoreTwoKnightsPawnBlackMove(fen, san) }))
  const maximum = Math.max(...rows.map((r) => r.score.remainingPlies))
  return rows
    .filter((r) => r.score.remainingPlies === maximum)
    .map((r) => r.san)
}
// Board outcomes are independent of the asynchronously loaded recommendation table.
// Shared replays are parsed before that table is available.
export function getTwoKnightsPawnBoardOutcome(
  fen: string,
): TwoKnightsPawnTerminalOutcome | null {
  const chess = getChess(fen)
  if (chess.isCheckmate())
    return chess.turn() === 'b' ? 'checkmate' : 'unsupported'
  const pieces = getEndgamePiecePlacements(fen)
  if (pieces.filter((p) => p.color === 'w' && p.type === 'n').length !== 2)
    return 'lost-knight'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDrawByFiftyMoves()) return 'fifty-move'
  return null
}
export function getTwoKnightsPawnTerminalOutcome(
  fen: string,
): TwoKnightsPawnTerminalOutcome | null {
  return getTwoKnightsPawnBoardOutcome(fen) ??
    (twoKnightsPawnEntry(fen) ? null : 'unsupported')
}
export const twoKnightsPawnRuleSet: MateRuleSet<TwoKnightsPawnWhiteMoveScore> =
  {
    id: 'two-knights-pawn',
    phase: (fen) => {
      const s = twoKnightsPawnEntry(fen)?.stage
      return s ? `${4 - s}/3` : '0/3'
    },
    scoreWhite: scoreTwoKnightsPawnWhiteMove,
    scoreWhiteCandidates: scoreTwoKnightsPawnWhiteCandidates,
    whiteRules: twoKnightsPawnWhiteRules,
    whiteMoves: (fen) =>
      getChess(fen).turn() === 'w' && twoKnightsPawnEntry(fen)
        ? getChess(fen).moves()
        : [],
    blackCandidates: (fen) => ({
      moves: getChess(fen).turn() === 'b' ? getChess(fen).moves() : [],
      idealMoves: getIdealTwoKnightsPawnBlackMoves(fen),
    }),
    help: {
      title: 'How best moves are chosen',
      whiteIntro:
        'Follow the certified stages: blockade the h-pawn, lock the king, then deliver mate. Each stage minimizes the worst-case number of White moves to its target.',
      blackIntro:
        'Black chooses the longest continuation against the selected White policy.',
      blackPriorities: [
        'Maximize the remaining moves to mate; the proof covers every legal Black reply.',
      ],
      notes: [
        knightCaptureNote,
        'Only a Black h-pawn is supported. A knight must remain in front of the pawn throughout r2. A temporary blockade that Black can dislodge does not qualify.',
        'The locking formation confines Black to a 3×3 corner cage using the White king and guarding knight. r1 consists only of certified finishing continuations reachable from locked, blockaded formations. Entering the net from outside remains an r2 move.',
        'r1 may allow promotion on h1 only when White has immediate checkmate against every promotion choice. Knight captures and pawn captures remain outside this method.',
        'The lookup ignores the fifty-move clock when optimizing. Clock failures are audited separately; the live game still reports the fifty-move draw. Uncertified means no route under this method, not necessarily a theoretical draw.',
        'The former back-rank standard start is not certified with knight captures excluded. Standard and training starts are selected from the certified table instead.',
      ],
      noteLinks: [
        {
          noteIndex: 0,
          label: 'Replay the excluded knight-capture finish on Lichess',
          href: knightCaptureReplay,
        },
      ],
      noteBoards: [],
    },
  }
