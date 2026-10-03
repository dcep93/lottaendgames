import type {RuleHelp} from './types'
import {BLACK_CAPTURE_PRIORITY, BLACK_RETURN_PRIORITY} from './blackPriorities'

const WHITE_INTRO =
  'White follows the ordered priorities below. The first priority that separates legal moves decides the recommendation.'
const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is trying to resist the mate, and looks for the most stubborn legal reply.'

const TARGET_SQUARE_NOTE_BOARD = {
  id: 'two-bishops-target-square',
  title: 'Target square',
  caption:
    "Outer wall b1–h7; target e4.",
  pieces: [
    { square: 'e3', piece: 'K' },
    { square: 'd5', piece: 'k' },
    { square: 'c2', piece: 'B' },
    { square: 'b2', piece: 'B' },
  ],
  highlights: [{ square: 'e4', kind: 'key' }],
  arrows: [
    { from: 'c2', to: 'b3' },
  ],
} as const

const RULE_R5_5_FORCE_CORNER_NOTE_BOARD = {
  id: 'two-bishops-rule-r5-5-force-corner',
  title: 'Corner push',
  caption: 'Be7 forces Kb8 toward a8.',
  pieces: [
    { square: 'c6', piece: 'K' },
    { square: 'c8', piece: 'k' },
    { square: 'a3', piece: 'B' },
    { square: 'f7', piece: 'B' },
  ],
  highlights: [],
  arrows: [{ from: 'a3', to: 'e7' }],
} as const

const RULE_R9_OPPOSITION_NOTE_BOARD = {
  id: 'two-bishops-rule-r9-opposition',
  title: 'Opposition',
  caption:
    "Kg5 takes opposition on outer wall c1–h6; inner wall b1–h7.",
  pieces: [
    { square: 'g4', piece: 'K' },
    { square: 'g7', piece: 'k' },
    { square: 'b1', piece: 'B' },
    { square: 'c1', piece: 'B' },
  ],
  highlights: [
    { square: 'c1', kind: 'key' },
    { square: 'd2', kind: 'key' },
    { square: 'e3', kind: 'key' },
    { square: 'f4', kind: 'key' },
    { square: 'g5', kind: 'key' },
    { square: 'h6', kind: 'key' },
  ],
  arrows: [{ from: 'g4', to: 'g5' }],
} as const

const PHASE_TWO_NOTE_BOARD = {
  id: 'two-bishops-phase-two',
  title: 'Phase 2',
  caption:
    'Black may occupy any square from a8 to d8.',
  pieces: [
    { square: 'b6', piece: 'K' },
    { square: 'd8', piece: 'k' },
    { square: 'c5', piece: 'B' },
    { square: 'b5', piece: 'B' },
  ],
  highlights: [],
} as const

export const twoBishopsHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    BLACK_CAPTURE_PRIORITY,
    BLACK_RETURN_PRIORITY,
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ],
  notes: [
    "Target squares: take the outer-wall squares closest to Black's king by king steps, then exclude bishop-occupied and screened squares. If White's king is on the outer wall, it must be no farther from the target than Black.",
  ],
  noteBoards: [RULE_R9_OPPOSITION_NOTE_BOARD, TARGET_SQUARE_NOTE_BOARD, RULE_R5_5_FORCE_CORNER_NOTE_BOARD, PHASE_TWO_NOTE_BOARD],
}
