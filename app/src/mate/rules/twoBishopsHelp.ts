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
    "Outer wall a2–g8; target d5.",
  pieces: [
    { square: 'c5', piece: 'K' },
    { square: 'e4', piece: 'k' },
    { square: 'b3', piece: 'B' },
    { square: 'b2', piece: 'B' },
  ],
  highlights: [{ square: 'd5', kind: 'key' }],
  arrows: [
    { from: 'b3', to: 'c2' },
  ],
} as const

const RULE_R5_5_FORCE_CORNER_NOTE_BOARD = {
  id: 'two-bishops-rule-r5-5-force-corner',
  title: 'rule r5.5 — Force Black toward the corner',
  caption: 'Bg5 forces Kh2 toward h1.',
  pieces: [
    { square: 'f3', piece: 'K' },
    { square: 'h3', piece: 'k' },
    { square: 'c1', piece: 'B' },
    { square: 'g6', piece: 'B' },
  ],
  highlights: [],
  arrows: [{ from: 'c1', to: 'g5' }],
} as const

const RULE_R9_OPPOSITION_NOTE_BOARD = {
  id: 'two-bishops-rule-r9-opposition',
  title: 'rule r9 — Take opposition on the outer wall',
  caption:
    "Ke7 takes opposition on outer wall a3–f8; inner wall a2–g8.",
  pieces: [
    { square: 'd7', piece: 'K' },
    { square: 'g7', piece: 'k' },
    { square: 'a2', piece: 'B' },
    { square: 'a3', piece: 'B' },
  ],
  highlights: [
    { square: 'a3', kind: 'wall' },
    { square: 'b4', kind: 'wall' },
    { square: 'c5', kind: 'wall' },
    { square: 'd6', kind: 'wall' },
    { square: 'e7', kind: 'wall' },
    { square: 'f8', kind: 'wall' },
  ],
  arrows: [{ from: 'd7', to: 'e7' }],
} as const

const PHASE_TWO_NOTE_BOARD = {
  id: 'two-bishops-phase-two',
  title: 'Phase 2',
  caption:
    'Black may occupy any square from h1 to h4.',
  pieces: [
    { square: 'f2', piece: 'K' },
    { square: 'h4', piece: 'k' },
    { square: 'e3', piece: 'B' },
    { square: 'e2', piece: 'B' },
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
  noteBoards: [TARGET_SQUARE_NOTE_BOARD, PHASE_TWO_NOTE_BOARD, RULE_R9_OPPOSITION_NOTE_BOARD, RULE_R5_5_FORCE_CORNER_NOTE_BOARD],
}
