export type MateVerificationFailureKind =
  | 'cycle'
  | 'fifty-move'
  | 'illegal-white-move'
  | 'lost-material'
  | 'lost-knight'
  | 'no-legal-black-move'
  | 'pawn-promoted'
  | 'rule-gap'
  | 'stalemate'
  | 'unsupported'
  | 'white-checkmated'

export type MateVerificationBranch<State> =
  | {
      readonly kind: 'continue'
      readonly moves: readonly string[]
      readonly next: State
      readonly resetsHalfmoveClock: readonly boolean[]
      readonly states: readonly State[]
    }
  | {
      readonly kind: 'mate'
      readonly moves: readonly string[]
      readonly resetsHalfmoveClock: readonly boolean[]
      readonly states: readonly State[]
    }
  | {
      readonly kind: 'failure'
      readonly failureKind: Exclude<MateVerificationFailureKind, 'cycle'>
      readonly message: string
      readonly moves: readonly string[]
      readonly resetsHalfmoveClock: readonly boolean[]
      readonly states: readonly State[]
    }

export type MateVerificationExpansion<State> = {
  readonly blackReplies: number
  readonly branches: readonly MateVerificationBranch<State>[]
  readonly whiteChoices: number
}

export type MateVerificationAdapter<State> = {
  readonly expand: (state: State) => MateVerificationExpansion<State>
  readonly key: (state: State) => string
  readonly render: (state: State) => string
}

export type MateVerificationRoot<State> = {
  readonly fen: string
  readonly halfmoveClock: number
  readonly source: string
  readonly state: State
}

export type MateVerificationStats = {
  blackReplies: number
  maximumMatePlies: number
  provenRoots: number
  uniquePositions: number
  whiteChoices: number
}

export type MateVerificationFailure = {
  readonly cycleStartPly?: number
  readonly finalFen: string
  readonly kind: MateVerificationFailureKind
  readonly message: string
  readonly moves: readonly string[]
  readonly source: string
  readonly startingFen: string
}

export type MateVerificationResult =
  | {
      readonly status: 'verified'
      readonly stats: MateVerificationStats
    }
  | {
      readonly failure: MateVerificationFailure
      readonly status: 'failed'
      readonly stats: MateVerificationStats
    }
  | {
      readonly message: string
      readonly status: 'incomplete'
      readonly stats: MateVerificationStats
    }

export type MateVerificationOptions = {
  readonly maxNodes?: number
  readonly maxRoots?: number
  readonly onProgress?: (stats: Readonly<MateVerificationStats>) => void
  readonly progressEvery?: number
}
