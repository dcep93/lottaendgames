export const TWO_BISHOPS_TRAINING_START_FEN =
  '8/8/8/8/4K3/8/B3k3/B7 w - - 10 6'

/** @deprecated Retained for legacy diagrams that are no longer displayed. */
export const TWO_BISHOPS_PHASE_TWO_START_FEN =
  '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1'

export const TWO_BISHOPS_PHASE_TWO_CANONICAL_MOVES = [
  'Bh4',
  'Kh3',
  'Bf6',
  'Kh2',
  'Kf2',
  'Kh3',
  'Be2',
  'Kh2',
  'Bg4',
  'Kh1',
  'Be7',
  'Kh2',
  'Bd6+',
  'Kh1',
  'Bf3#',
] as const

export const TWO_BISHOPS_TRAINING_FENS = [
  TWO_BISHOPS_TRAINING_START_FEN,
] as const

/** @deprecated Use TWO_BISHOPS_TRAINING_FENS. */
export const TWO_BISHOPS_PHASE_TWO_TRAINING_FENS =
  TWO_BISHOPS_TRAINING_FENS
