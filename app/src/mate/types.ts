export type MateId =
  | 'queen'
  | 'rook'
  | 'two-bishops'
  | 'bishop-knight'
  | 'two-knights-pawn'

export type MateMode = 'standard' | 'train'

export type MateModuleId = MateId | 'knight-queen'

export type MateRouteSelection = {
  mateId: MateModuleId | null
  mateMode: MateMode | null
  sharedFen: string | null
  sharedError?: string
  sharedMoves?: readonly string[] | null
  sharedReplayCursor?: 0 | null
}
