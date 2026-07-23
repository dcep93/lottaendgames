import type { MateId } from '../types'

export type ScoredMove<Score> = {
  readonly san: string
  readonly score: Score
}

type RuleSubpriorityBase<Score> = {
  /**
   * Enables this subpriority once for the current immutable survivor group.
   * The predicate must depend only on the group members, not their order.
   */
  readonly when?: (scores: readonly Score[]) => boolean
}

export type RuleSubpriority<Score> = RuleSubpriorityBase<Score> &
  (
    | {
        /** Defines a deterministic finite total preorder. */
        readonly compare: (left: Score, right: Score) => number
        readonly rank?: never
      }
    | {
        readonly compare?: never
        /**
         * Assigns one finite rank per score in the same order. The lowest rank
         * survives. This pure callback is evaluated once per survivor group.
         */
        readonly rank: (scores: readonly Score[]) => readonly number[]
      }
  )

export type OrderedRule<Score> = {
  readonly id: string
  readonly shortLabel: string
  readonly helpText: string
  /** Marks a correctness filter that should not be presented as a technique to memorize. */
  readonly presentationRole?: 'guard'
  /** Places a deduplicated rule in the visible guide without reordering its evaluator stage. */
  readonly guideOrder?: number
  /**
   * Limits this priority to the scores for which its comparison is meaningful.
   * A non-applicable candidate remains untouched while applicable candidates
   * are filtered. Omitting this function makes the rule apply to every score.
   */
  readonly applies?: (score: Score) => boolean
  /**
   * Stops later priorities from breaking a best-score tie when every survivor
   * satisfies this predicate. Use this for a decisive result such as mate.
   */
  readonly stopWhenBest?: (score: Score) => boolean
  /**
   * Defines a deterministic finite total preorder within the applicable domain.
   * A negative finite result prefers left, zero ties them, and a positive finite
   * result prefers right. Implementations must never return NaN or infinity.
   */
  readonly compare?: (left: Score, right: Score) => number
  /**
   * Keeps conditional comparisons inside one visible evaluator priority.
   * Exactly one of `compare` or a non-empty `subpriorities` array is required.
   */
  readonly subpriorities?: readonly RuleSubpriority<Score>[]
}

export type RuleDescription = {
  readonly id: string
  readonly shortLabel: string
  readonly helpText: string
  readonly presentationRole?: 'guard'
}

export type WhiteMoveOverrideSelection =
  | { readonly active: false }
  | { readonly active: true; readonly moves: readonly string[] }

export type WhiteMoveOverride = {
  readonly description: RuleDescription
  readonly guideOrder?: number
  /**
   * Selects a decisive ordered subset of the supplied legal SANs. An active
   * selection must be non-empty, unique, and contain only supplied moves.
   */
  readonly select: (
    fen: string,
    legalMoves: readonly string[],
  ) => WhiteMoveOverrideSelection
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
  /**
   * Optionally prepares and scores the full legal-move batch. This keeps
   * expensive, position-only context pure while avoiding repeated work.
   */
  readonly scoreWhiteCandidates?: (
    fen: string,
    moves: readonly string[],
  ) => readonly ScoredMove<Score>[]
  readonly whiteMoveOverride?: WhiteMoveOverride
  readonly whiteRules: readonly OrderedRule<Score>[]
  readonly whiteMoves: (fen: string) => readonly string[]
  readonly blackCandidates: (
    fen: string,
    previousTurnFen?: string,
  ) => OpponentCandidates
  readonly help: RuleHelp
}
