import type { MateId } from '../types'

export type ScoredMove<Score> = {
  readonly san: string
  readonly score: Score
}

export type OrderedRule<Score> = {
  readonly id: string
  readonly shortLabel: string
  readonly helpText: string
  /**
   * Defines a deterministic total preorder for this priority. A negative finite
   * result prefers left, zero ties them, and a positive finite result prefers
   * right. Implementations must never return NaN or an infinite value.
   */
  readonly compare: (left: Score, right: Score) => number
}

export type RuleDescription = {
  readonly id: string
  readonly shortLabel: string
  readonly helpText: string
}

export type OpponentCandidates = {
  readonly moves: readonly string[]
  readonly idealMoves: readonly string[]
}

export type RuleNoteBoardLayout = {
  readonly files: number
  readonly ranks: number
  readonly fileOffset: number
}

export type RuleNoteBoardPiece = {
  readonly square: string
  readonly piece:
    | 'K'
    | 'Q'
    | 'R'
    | 'B'
    | 'N'
    | 'P'
    | 'k'
    | 'q'
    | 'r'
    | 'b'
    | 'n'
    | 'p'
}

export type RuleNoteBoardHighlight = {
  readonly square: string
  readonly kind: 'zone' | 'escape' | 'key' | 'red'
}

export type RuleNoteBoardArrow = {
  readonly from: string
  readonly to: string
}

export type RuleNoteBoard = {
  readonly id: string
  readonly title: string
  readonly caption: string
  readonly layout?: RuleNoteBoardLayout
  readonly pieces: readonly RuleNoteBoardPiece[]
  readonly highlights: readonly RuleNoteBoardHighlight[]
  readonly arrows?: readonly RuleNoteBoardArrow[]
}

export type RuleHelp = {
  readonly title: string
  readonly whiteIntro: string
  readonly blackIntro: string
  readonly blackPriorities: readonly string[]
  readonly notes: readonly string[]
  readonly noteBoards: readonly RuleNoteBoard[]
}

export type RegisteredMateRuleSet = {
  readonly id: MateId
  readonly phase: (fen: string) => string
  readonly whiteMoves: (fen: string) => readonly string[]
  readonly blackCandidates: (
    fen: string,
    previousTurnFen?: string,
  ) => OpponentCandidates
  readonly help: RuleHelp
  readonly whiteRuleDescriptions: readonly RuleDescription[]
  readonly idealWhiteMoves: (fen: string) => readonly string[]
  readonly explainWhiteMove: (
    fen: string,
    san?: string,
  ) => RuleDescription | undefined
  readonly currentWhiteHint: (fen: string) => RuleDescription | undefined
}

export type MateRuleSet<Score> = {
  readonly id: MateId
  readonly phase: (fen: string) => string
  readonly scoreWhite: (fen: string, san: string) => Score
  readonly whiteRules: readonly OrderedRule<Score>[]
  readonly whiteMoves: (fen: string) => readonly string[]
  readonly blackCandidates: (
    fen: string,
    previousTurnFen?: string,
  ) => OpponentCandidates
  readonly help: RuleHelp
}
