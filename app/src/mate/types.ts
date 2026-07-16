export type MateId =
  | 'queen'
  | 'rook'
  | 'two-bishops'
  | 'bishop-knight'
  | 'two-knights-pawn'

export type MateMode = 'standard' | 'train'

export type MateRouteSelection = {
  mateId: MateId | null
  mateMode: MateMode | null
  sharedFen: string | null
}
