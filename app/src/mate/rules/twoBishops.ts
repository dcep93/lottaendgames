import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  edgeDistance,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squaredEuclideanDistance,
  squareColor,
  squareCoordinates,
  squareFromCoordinates,
  transformSquare,
  withFenTurn,
} from '../chess'
import { compareScoresByRules, selectIdealMoves } from './selection'
import {
  applyUniversalBlackPriorities,
  BLACK_CAPTURE_PRIORITY,
  BLACK_RETURN_PRIORITY,
} from './blackPriorities'
import {
  bishopDestinationCanBeAttackedOnNextMove,
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getTwoBishopsPhaseLabel,
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  areKingsAtPhaseTwoDistance,
} from './twoBishopsGeometry'
import { TWO_BISHOPS_DIAGRAM_POSITIONS } from './twoBishopsDiagramPositions'
import {
  countDistantTwoBishops,
  getRuleNPreferredMoves,
  getRuleWYPreferredMoves,
  getTwoBishopsWalls,
} from './twoBishopsWallGeometry'
import { getTwoBishopsPhaseTwoPatternMoves } from './twoBishopsPhaseTwoPattern'
import { evaluateRuleACornerCage } from './twoBishopsCornerCage'
import { evaluateRuleBScreenPosition } from './twoBishopsScreenPosition'
import { evaluateRuleAADiagonalEscape } from './twoBishopsDiagonalEscape'
import {
  TWO_BISHOPS_PHASE_TWO_CANONICAL_MOVES,
  TWO_BISHOPS_PHASE_TWO_START_FEN,
} from './twoBishopsPhaseTwoPatternData'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  RuleNoteBoardAnimationFrame,
  RuleNoteBoardPiece,
  ScoredMove,
} from './types'

export type TwoBishopsWhiteMoveScore = {
  readonly isPhaseTwoPosition: boolean
  readonly matePenalty: number
  readonly bishopSafetyPenalty: number
  readonly stalematePenalty: number
  readonly prepareMateApplies: boolean
  readonly prepareMatePenalty: number
  readonly ruleAAApplies: boolean
  readonly ruleAAPenalty: number
  readonly ruleAApplies: boolean
  readonly ruleAPenalty: number
  readonly ruleBApplies: boolean
  readonly ruleBPenalty: number
  readonly ruleNApplies: boolean
  readonly ruleNPenalty: number
  readonly ruleOApplies: boolean
  readonly ruleOPenalty: number
  readonly ruleWWApplies: boolean
  readonly ruleWWPenalty: number
  readonly ruleGApplies: boolean
  readonly ruleGPenalty: number
  readonly centralPiecesPenalty: number
  readonly edgeFlankApplies: boolean
  readonly edgeFlankPenalty: number
  readonly onsidesApplies: boolean
  readonly onsidesPenalty: number
  readonly bootNScootApplies: boolean
  readonly bootNScootPenalty: number
  readonly bootNScootReplyCount: number
  readonly bootNScootUniqueBest: boolean
  readonly degenerateApplies: boolean
  readonly degeneratePenalty: number
  readonly degenerateTerminal: boolean
  readonly mateInThreeApplies: boolean
  readonly mateInThreeTurns: number
  readonly phaseTwoWallApplies: boolean
  readonly phaseTwoWallPenalty: number
  readonly shepherdApplies: boolean
  readonly shepherdPenalty: number
  readonly sequesterApplies: boolean
  readonly sequesterHasTargetCorner: boolean
  readonly sequesterCornerDiagonalsTarget: boolean
  readonly sequesterTargetCornerScore: number
  readonly sequesterCurrentCornerDistance: number
  readonly sequesterMaximumCornerReplyDistance: number
  readonly sequesterTwoAwayControlPenalty: number
  readonly sequesterIsBishopMove: boolean
  readonly bishopsOnBlackEdgeCount: number
  readonly forcePhaseTwoApplies: boolean
  readonly forcePhaseTwoPenalty: number
  readonly ruleRApplies: boolean
  readonly ruleRPenalty: number
  readonly ruleSApplies: boolean
  readonly ruleSPenalty: number
  readonly ruleTApplies: boolean
  readonly ruleTPenalty: number
  readonly ruleTReplyCount: number
  readonly ruleUUApplies: boolean
  readonly ruleUUPenalty: number
  readonly ruleUApplies: boolean
  readonly ruleUPenalty: number
  readonly ruleVApplies: boolean
  readonly ruleVPenalty: number
  readonly ruleVSqueezeEdgeDistance: number
  readonly ruleWYApplies: boolean
  readonly ruleWYPenalty: number
  readonly ruleWApplies: boolean
  readonly ruleWUrgentPenalty: number
  readonly ruleWPenalty: number
  readonly ruleYApplies: boolean
  readonly ruleYPenalty: number
  readonly ruleZApplies: boolean
  readonly ruleZPenalty: number
  readonly ruleZ1Applies: boolean
  readonly ruleZ1Penalty: number
  readonly ruleZZPenalty: number
  readonly deathBoxApplies: boolean
  readonly deathBoxPenalty: number
  readonly megadethBoxApplies: boolean
  readonly megadethBoxPenalty: number
  readonly ruleZ2Applies: boolean
  readonly ruleZ2Penalty: number
  readonly kingStutterApplies: boolean
  readonly kingStutterPenalty: number
  readonly kingCloserPhaseTwoLinePenalty: number
  readonly kingCloserDistance: number
  readonly kingCloserMiddleSixteenDistance: number
  readonly centralKingPenalty: number
  readonly unscreenBishopsCount: number
  readonly unclutteredBishopsApplies: boolean
  readonly unclutteredBishopsPenalty: number
  readonly bishopDistance: number
  readonly checkPenalty: number
  readonly clutteredBishopsCount: number
}

export type TwoBishopsBlackMoveScore = {
  readonly bishopCapturePenalty: number
  readonly centerDistance: number
  readonly unprotectedBishopDistance: number
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves are still tied after a priority, they all remain best moves."

const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

const BOARD_CORNERS: readonly Square[] = ['a1', 'a8', 'h1', 'h8']
type FlankDiagonalAxis = 'difference' | 'sum'

type FlankDiagonal = {
  readonly axis: FlankDiagonalAxis
  readonly index: number
}

type FlankDiagonalPair = readonly [FlankDiagonal, FlankDiagonal]

type SqueezeGeometry = {
  readonly normalFile: -1 | 0 | 1
  readonly normalRank: -1 | 0 | 1
  readonly primaryIndex: number
  readonly secondaryIndex: number
}

type KnightSqueezeGeometry = SqueezeGeometry & {
  readonly tertiaryIndex: number
}

type RuleTGeometry = {
  readonly axis: 'file' | 'rank'
  readonly index: number
  readonly startingBlackDistance: number
}

const MATE_PREP_LIGHT_DIAGONAL: readonly Square[] = [
  'd1',
  'e2',
  'f3',
  'g4',
  'h5',
]

type RelativeTransform = (
  file: number,
  rank: number,
) => { readonly file: number; readonly rank: number }

const D4_RELATIVE_TRANSFORMS: readonly RelativeTransform[] = [
  (file, rank) => ({ file, rank }),
  (file, rank) => ({ file: -file, rank }),
  (file, rank) => ({ file, rank: -rank }),
  (file, rank) => ({ file: -file, rank: -rank }),
  (file, rank) => ({ file: rank, rank: file }),
  (file, rank) => ({ file: -rank, rank: file }),
  (file, rank) => ({ file: rank, rank: -file }),
  (file, rank) => ({ file: -rank, rank: -file }),
]

function relativeSquare(
  origin: Square,
  transform: RelativeTransform,
  file: number,
  rank: number,
): Square | null {
  const coordinates = squareCoordinates(origin)
  const transformed = transform(file, rank)
  return squareFromCoordinates(
    coordinates.file + transformed.file,
    coordinates.rank + transformed.rank,
  )
}

type DegenerateRepair = {
  readonly from?: Square
  readonly to?: Square
  readonly allowedTargets?: readonly Square[]
  readonly allowedSans?: readonly string[]
  readonly stopAfterRepair?: boolean
  readonly reasonLabel: TwoBishopsDegenerateReasonLabel
}

const TWO_BISHOPS_DEGENERATE_REASON_LABELS = {
  phaseTwoOpposition: 'degenerate — phase 2 opposition',
  mateInFour: 'degenerate — mate in 4',
  knightStepControl: 'degenerate — knight-step control',
  wallWaitingMove: 'degenerate — wall waiting move',
  cornerDiagonals: 'degenerate — corner diagonals',
  xx: 'degenerate — xx',
  kingLift: 'degenerate — king lift',
  bishopRetreat: 'degenerate — bishop retreat',
  longDiagonal: 'degenerate — long diagonal',
  edgeRepair: 'degenerate — edge repair',
  edgeUnmask: 'degenerate — unmask edge bishop',
  diagonalSetup: 'degenerate — diagonal setup',
  diagonalWaitingMove: 'degenerate — diagonal waiting move',
  freeBishop: 'degenerate — free bishop',
  waitingMove: 'degenerate — waiting move',
  middleishTargetA: 'degenerate — middleish target a',
  middleishTargetB: 'degenerate — middleish target b',
  phaseOneLoopEscape: 'degenerate — phase 1 loop escape',
  kingFlank: 'degenerate — king flank',
  kingSidestep: 'degenerate — king sidestep',
  reformWall: 'degenerate — reform wall',
  ignoreLightBishop: 'degenerate — ignore light-squared bishop',
} as const

type TwoBishopsDegenerateReasonLabel =
  (typeof TWO_BISHOPS_DEGENERATE_REASON_LABELS)[keyof typeof TWO_BISHOPS_DEGENERATE_REASON_LABELS]

export const TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER = [
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.phaseTwoOpposition,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.ignoreLightBishop,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.mateInFour,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.knightStepControl,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.wallWaitingMove,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.cornerDiagonals,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.xx,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeRepair,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeUnmask,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalSetup,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalWaitingMove,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.freeBishop,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.waitingMove,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.middleishTargetA,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.middleishTargetB,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.phaseOneLoopEscape,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingFlank,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingSidestep,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.reformWall,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingLift,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.bishopRetreat,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.longDiagonal,
] as const

function mateInEightIshAnimationFrames(
  startFen: string,
  moves: readonly string[],
): readonly RuleNoteBoardAnimationFrame[] {
  const chess = getChess(startFen)
  const frames: RuleNoteBoardAnimationFrame[] = [
    { fen: chess.fen(), lastMove: null, durationMs: 3000 },
  ]
  moves.forEach((san, index) => {
    const move = chess.move(san)
    if (move === null) {
      throw new Error(`invalid mate in 8 ish animation move ${san}`)
    }
    frames.push({
      fen: chess.fen(),
      lastMove: [move.from, move.to],
      durationMs: index === moves.length - 1 ? 1400 : 500,
    })
  })
  return frames
}

const twoBishopsHelp: RuleHelp = {
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
    "A bishop wall is two adjacent parallel diagonals, with the nearer diagonal adjacent to Black's king. White's king matters only when its screening lets Black escape.",
  ],
  noteBoards: [
    {
      id: 'bishop-mate-in-eight-ish-a',
      title: 'mate in 8 ish A',
      caption: 'Follow the main Phase 2 pattern.',
      animationFrames: mateInEightIshAnimationFrames(
        TWO_BISHOPS_PHASE_TWO_START_FEN,
        TWO_BISHOPS_PHASE_TWO_CANONICAL_MOVES,
      ),
      animationAlt:
        'Mate in 8 ish flow A, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-b',
      title: 'mate in 8 ish B',
      caption: 'Answer the immediate …Kh1 response and continue to mate.',
      animationFrames: mateInEightIshAnimationFrames(
        TWO_BISHOPS_PHASE_TWO_START_FEN,
        [
          'Kf2',
          'Kh1',
          'Kf1',
          'Kh2',
          'Bg4',
          'Kh1',
          'Bh4',
          'Kh2',
          'Kf2',
          'Kh1',
          'Bg5',
          'Kh2',
          'Bf4+',
          'Kh1',
          'Bf3#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow B immediate Kh1 response and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-c',
      title: 'mate in 8 ish C',
      caption:
        'Walk the king, wait on d8–h4, check, then mate. Equivalent waiting squares share this diagram.',
      animationFrames: mateInEightIshAnimationFrames(
        TWO_BISHOPS_PHASE_TWO_START_FEN,
        [
          'Kf2',
          'Kh3',
          'Kf1',
          'Kh2',
          'Bg4',
          'Kh1',
          'Bb4',
          'Kh2',
          'Bd6+',
          'Kh1',
          'Bf3#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow C king walk, waiting move, check, and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-d',
      title: 'mate in 8 ish D',
      caption:
        'Answer the early …Kh1 deviation with a waiting move, then rejoin the main pattern. Equivalent waiting squares share this diagram.',
      animationFrames: mateInEightIshAnimationFrames(
        TWO_BISHOPS_PHASE_TWO_START_FEN,
        [
          'Bh4',
          'Kh3',
          'Bf6',
          'Kh2',
          'Kf2',
          'Kh1',
          'Be2',
          'Kh2',
          'Bg4',
          'Kh1',
          'Be7',
          'Kh2',
          'Bd6+',
          'Kh1',
          'Bf3#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow D early Kh1 deviation and return to the main pattern, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-e',
      title: 'mate in 8 ish E',
      caption: 'Retreat the king, build the checks, then mate.',
      animationFrames: mateInEightIshAnimationFrames(
        TWO_BISHOPS_PHASE_TWO_START_FEN,
        [
          'Kf2',
          'Kh3',
          'Kf1',
          'Kh2',
          'Bg4',
          'Kh1',
          'Bh4',
          'Kh2',
          'Kf2',
          'Kh1',
          'Bf5',
          'Kh2',
          'Bg3+',
          'Kh1',
          'Be4#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow E king retreat, bishop checks, and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-f',
      title: 'mate in 8 ish F',
      caption:
        'Move 4 may also be Bd1. On move 7, wait anywhere on c8–h3 except Bh3; moves 8 and 9 are check and mate.',
      animationFrames: mateInEightIshAnimationFrames(
        '8/8/8/8/8/5K1k/8/3BB3 w - - 0 1',
        [
          'Be2',
          'Kh2',
          'Kf2',
          'Kh3',
          'Bd2',
          'Kh4',
          'Bf3',
          'Kh3',
          'Bg5',
          'Kh2',
          'Bg4',
          'Kh1',
          'Bf5',
          'Kh2',
          'Bf4+',
          'Kh1',
          'Be4#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow F with flexible waiting moves followed by check and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-g',
      title: 'mate in 8 ish G',
      caption:
        'On move 2, wait anywhere on c8–h3 except Bh3, then check and mate.',
      animationFrames: mateInEightIshAnimationFrames(
        '8/8/8/8/8/8/3BBK1k/8 w - - 4 3',
        ['Bg4', 'Kh1', 'Bf5', 'Kh2', 'Bf4+', 'Kh1', 'Be4#'],
      ),
      animationAlt:
        'Mate in 8 ish flow G with a flexible waiting move followed by check and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-h',
      title: 'mate in 8 ish H',
      caption: 'Enter G with Kf2 and Bd2, then wait, check, and mate.',
      animationFrames: mateInEightIshAnimationFrames(
        '8/8/8/8/8/5K2/4B2k/4B3 w - - 0 1',
        [
          'Kf2',
          'Kh1',
          'Bd2',
          'Kh2',
          'Bg4',
          'Kh1',
          'Bd7',
          'Kh2',
          'Bf4+',
          'Kh1',
          'Bc6#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow H entering flow G before a waiting move, check, and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-i',
      title: 'mate in 8 ish I',
      caption: 'Build Bg4 and Bc3, then check and mate.',
      animationFrames: mateInEightIshAnimationFrames(
        '8/8/8/8/8/5K2/8/3BB2k w - - 0 1',
        [
          'Kf2',
          'Kh2',
          'Bg4',
          'Kh1',
          'Bc3',
          'Kh2',
          'Be5+',
          'Kh1',
          'Bf3#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow I building Bg4 and Bc3 before check and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-j',
      title: 'mate in 8 ish J',
      caption: 'Walk, build the wall, then check and mate.',
      animationFrames: mateInEightIshAnimationFrames(
        '8/8/8/8/7B/5K2/7k/3B4 w - - 0 1',
        [
          'Kf2',
          'Kh3',
          'Bg5',
          'Kh2',
          'Bg4',
          'Kh1',
          'Be7',
          'Kh2',
          'Bd6+',
          'Kh1',
          'Bf3#',
        ],
      ),
      animationAlt:
        'Mate in 8 ish flow J building the wall before check and mate, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-mate-in-eight-ish-k',
      title: 'mate in 8 ish K',
      caption: 'Build Bg4, check with Bg3, then mate.',
      animationFrames: mateInEightIshAnimationFrames(
        '8/8/8/8/7B/5K2/7k/3B4 w - - 0 1',
        ['Kf2', 'Kh1', 'Bg4', 'Kh2', 'Bg3+', 'Kh1', 'Bf3#'],
      ),
      animationAlt:
        'Mate in 8 ish flow K building Bg4 before two checks, shown with chess pieces.',
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-rule-aa',
      title: 'rule aa',
      caption:
        'The bishop controls f2. Move the other bishop to the highlighted a6–f1 diagonal, away from White\'s king.',
      pieces: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleAA.pieces,
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleAA.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.ruleAA.arrow],
    },
    {
      id: 'bishop-rule-a',
      title: 'rule a',
      caption:
        'Pink squares are Black\'s corner-edge squares. The highlighted c8–h3 diagonal is the corner cage diagonal.',
      pieces: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleA.pieces,
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleA.highlights,
    },
    {
      id: 'bishop-rule-b',
      title: 'rule b',
      caption:
        'The flexible bishop may occupy any highlighted d1–h5 square. Move the screened king to h3, two edge squares from h1.',
      pieces: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleB.pieces,
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleB.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.ruleB.arrow],
    },
    {
      id: 'bishop-rule-n',
      title: 'rule n',
      caption:
        'White controls the pink escape square. The arrowed check shifts the wall to the highlighted tighter diagonal.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.ruleN.fen),
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleN.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.ruleN.arrow],
    },
    {
      id: 'bishop-degenerate-phase-two-opposition',
      title: 'degenerate — phase 2 opposition',
      caption: 'Take opposition with the king.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseTwoOpposition.fen,
      ),
      highlights: [],
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseTwoOpposition.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-ignore-light-bishop',
      title: 'degenerate — ignore light-squared bishop',
      caption:
        "Ignore the light-squared bishop's location. Move the dark-squared bishop to h6.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateIgnoreLightBishop.fen,
      ),
      highlights: [],
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateIgnoreLightBishop.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-mate-in-four',
      title: 'degenerate — mate in 4',
      caption: 'With a6 controlled, play Kc7.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMateInFour.fen,
      ),
      highlights:
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMateInFour.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMateInFour.arrow],
    },
    {
      id: 'bishop-degenerate-knight-step-control',
      title: 'degenerate — knight-step control',
      caption: 'With h5 uncontrolled, move the bishop to control g2.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKnightStepControl.fen,
      ),
      highlights:
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKnightStepControl.highlights,
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKnightStepControl.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-wall-waiting-move',
      title: 'degenerate — wall waiting move',
      caption: 'Keep bishop control of both highlighted squares.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWallWaitingMove.fen,
      ),
      highlights:
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWallWaitingMove.highlights,
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWallWaitingMove.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-corner-diagonals',
      title: 'degenerate — corner diagonals',
      caption:
        "Preserve one bishop's control of f8 and the other's control of d1 h5 diagonal, or tighten the h5 cutoff by controlling h6. The cutoff still identifies h8 after Black steps around the corner.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateCornerDiagonals.fen,
      ),
      highlights:
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateCornerDiagonals.highlights,
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateCornerDiagonals.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-xx',
      title: 'degenerate — xx',
      caption: 'Control h6 with the dark-squared bishop.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateXx.fen,
      ),
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateXx.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateXx.arrow],
    },
    {
      id: 'bishop-degenerate-edge-repair',
      title: 'degenerate — edge repair',
      caption: 'Re-form the bishops with the arrowed move.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeRepair.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeRepair.arrow],
    },
    {
      id: 'bishop-degenerate-edge-unmask',
      title: 'degenerate — unmask edge bishop',
      caption: "Free the edge bishop from behind White's king.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeUnmask.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateEdgeUnmask.arrow],
    },
    {
      id: 'bishop-degenerate-diagonal-setup',
      title: 'degenerate — diagonal setup',
      caption: 'Place the bishop on the highlighted diagonal.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalSetup.fen,
      ),
      highlights:
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalSetup.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalSetup.arrow],
    },
    {
      id: 'bishop-degenerate-diagonal-waiting-move',
      title: 'degenerate — diagonal waiting move',
      caption: 'Make the arrowed bishop waiting move.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalWaitingMove.fen,
      ),
      highlights: [],
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateDiagonalWaitingMove.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-free-bishop',
      title: 'degenerate — free bishop',
      caption: 'Free the bishop tucked behind White’s king.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateFreeBishop.fen,
      ),
      highlights: [],
    },
    {
      id: 'bishop-degenerate-waiting-move',
      title: 'degenerate — waiting move',
      caption:
        'Keep the opposed bishop in place and make a waiting move with the other bishop.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateWaitingMove.fen,
      ),
      highlights: [],
    },
    {
      id: 'bishop-degenerate-middleish-target-a',
      title: 'degenerate — middleish target a',
      caption: "Move White's king to middleish target A.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMiddleishTargetA.fen,
      ),
      highlights: [],
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMiddleishTargetA.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-middleish-target-b',
      title: 'degenerate — middleish target b',
      caption: "Move White's king to middleish target B.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMiddleishTargetB.fen,
      ),
      highlights: [],
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMiddleishTargetB.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-phase-one-loop-escape',
      title: 'degenerate — phase 1 loop escape',
      caption: 'Move the corner bishop along the arrow to break the king loop.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseOneLoopEscape.fen,
      ),
      highlights: [],
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degeneratePhaseOneLoopEscape.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-king-flank',
      title: 'degenerate — king flank',
      caption: "Advance White's king to the arrowed flank square.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingFlank.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingFlank.arrow],
    },
    {
      id: 'bishop-degenerate-king-sidestep',
      title: 'degenerate — king sidestep',
      caption: "Step White's king away from the offset bishop.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingSidestep.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingSidestep.arrow],
    },
    {
      id: 'bishop-degenerate-reform-wall',
      title: 'degenerate — reform wall',
      caption: 'Re-form the bishop wall with the arrowed move.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateReformWall.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateReformWall.arrow],
    },
    {
      id: 'bishop-degenerate-king-lift',
      title: 'degenerate — king lift',
      caption: "Lift White's king to the arrowed square.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingLift.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateKingLift.arrow],
    },
    {
      id: 'bishop-degenerate-bishop-retreat',
      title: 'degenerate — bishop retreat',
      caption: 'Retreat the arrowed bishop.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateBishopRetreat.fen,
      ),
      highlights: [],
      arrows: [
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateBishopRetreat.arrow,
      ],
    },
    {
      id: 'bishop-degenerate-long-diagonal',
      title: 'degenerate — long diagonal',
      caption:
        "Move the bishop to any highlighted square. Don't move it to the edge.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateLongDiagonal.fen,
      ),
      highlights:
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateLongDiagonal.highlights,
    },
    {
      id: 'bishop-mating-position',
      title: 'mating position',
      caption: "Highlighted squares are White's king mating squares.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: TWO_BISHOPS_DIAGRAM_POSITIONS.matingPosition.pieces,
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.matingPosition.highlights,
    },
    {
      id: 'bishop-shepherd',
      title: 'shepherd',
      caption:
        'With the far edge square controlled, take opposition toward the target corner.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.shepherd.fen),
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.shepherd.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.shepherd.arrow],
    },
    {
      id: 'bishop-phase-two-wall',
      title: 'phase 2 wall',
      caption:
        "The highlighted squares are the wall on the side away from White's king.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.phaseTwoWall.fen,
      ),
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.phaseTwoWall.highlights,
    },
    {
      id: 'bishop-proximate-wall',
      title: 'proximate bishop wall',
      caption:
        "Highlighted squares show where Black's king makes the bishop wall proximate.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: TWO_BISHOPS_DIAGRAM_POSITIONS.proximateWall.pieces,
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.proximateWall.highlights,
    },
    {
      id: 'bishop-edge-flank',
      title: 'edge flank',
      caption:
        "Pink squares are White's diagonal flank targets for Black's edge square.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: TWO_BISHOPS_DIAGRAM_POSITIONS.edgeFlank.pieces,
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.edgeFlank.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.edgeFlank.arrow],
    },
    {
      id: 'bishop-boot-scoot-n-block',
      title: 'boot scoot n block',
      caption: 'Boot the king, scoot to opposition, then block the escape.',
      animationSrc: '/mate/two-bishops/boot-n-scoot.gif',
      animationAlt:
        'Boot Scoot N Block progression: Bg4, Black king to c2, White king to c4, Black king to d2, then Bc5.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: [],
      highlights: [],
    },
    {
      id: 'bishop-rule-s',
      title: 'rule s',
      caption:
        'The tan diagonal is primary, the pink-outlined diagonal is secondary, and the white-outlined diagonal is tertiary.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.ruleS.fen),
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleS.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.ruleS.arrow],
    },
    {
      id: 'bishop-rule-t',
      title: 'rule t',
      caption: 'The marked f-file is the King moat.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.ruleT.fen),
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleT.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.ruleT.arrow],
    },
    {
      id: 'bishop-rule-v',
      title: 'rule v',
      caption:
        'The tan diagonals are primary. The pink-outlined diagonals are secondary.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.ruleV.fen),
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleV.highlights,
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.ruleV.arrow],
    },
    {
      id: 'bishop-rule-w',
      title: 'rule w',
      caption:
        'The marked diagonals are the flank diagonals. Pink squares show the applicable Black king locations.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleW.pieces,
      highlights: TWO_BISHOPS_DIAGRAM_POSITIONS.ruleW.highlights,
    },
    {
      id: 'bishop-king-stutter',
      title: 'king stutter',
      caption: 'Do the arrowed king stutter step.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.kingStutter.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.kingStutter.arrow],
    },
  ].filter((board) =>
    [
      'bishop-mate-in-eight-ish-a',
      'bishop-mate-in-eight-ish-b',
      'bishop-mate-in-eight-ish-c',
      'bishop-mate-in-eight-ish-d',
      'bishop-mate-in-eight-ish-e',
      'bishop-mate-in-eight-ish-f',
      'bishop-mate-in-eight-ish-g',
      'bishop-mate-in-eight-ish-h',
      'bishop-mate-in-eight-ish-i',
      'bishop-mate-in-eight-ish-j',
      'bishop-mate-in-eight-ish-k',
      'bishop-rule-aa',
      'bishop-rule-a',
      'bishop-rule-b',
      'bishop-rule-n',
    ].includes(board.id),
  ),
}

function noteBoardPieces(fen: string): readonly RuleNoteBoardPiece[] {
  return getEndgamePiecePlacements(fen).map(({ color, square, type }) => ({
    square,
    piece: (color === 'w' ? type.toUpperCase() : type) as RuleNoteBoardPiece['piece'],
  }))
}

export function getTwoBishopsMatingPositionSquares(
  corner: Square,
): readonly Square[] {
  const coordinates = squareCoordinates(corner)
  const fileStep = coordinates.file === 0 ? 1 : -1
  const rankStep = coordinates.rank === 0 ? 1 : -1
  return [
    squareFromCoordinates(
      coordinates.file + 2 * fileStep,
      coordinates.rank,
    ),
    squareFromCoordinates(
      coordinates.file + 2 * fileStep,
      coordinates.rank + rankStep,
    ),
    squareFromCoordinates(
      coordinates.file,
      coordinates.rank + 2 * rankStep,
    ),
    squareFromCoordinates(
      coordinates.file + fileStep,
      coordinates.rank + 2 * rankStep,
    ),
  ].filter((square): square is Square => square !== null)
}

function isMatingPosition(whiteKing: Square, corner: Square): boolean {
  return getTwoBishopsMatingPositionSquares(corner).includes(whiteKing)
}

type PhaseTwoWall = {
  readonly edgeSquare: Square
  readonly inwardSquare: Square
}

function getAllPhaseTwoWalls(blackKing: Square): readonly PhaseTwoWall[] {
  const black = squareCoordinates(blackKing)
  const walls: PhaseTwoWall[] = []
  const addWall = (
    along: 'file' | 'rank',
    direction: -1 | 1,
    inwardFile: number,
    inwardRank: number,
  ): void => {
    const edgeSquare = squareFromCoordinates(
      black.file + (along === 'file' ? direction : 0),
      black.rank + (along === 'rank' ? direction : 0),
    )
    if (!edgeSquare) return
    const edge = squareCoordinates(edgeSquare)
    const inwardSquare = squareFromCoordinates(
      edge.file + inwardFile,
      edge.rank + inwardRank,
    )
    if (inwardSquare) walls.push({ edgeSquare, inwardSquare })
  }

  for (const direction of [-1, 1] as const) {
    if (black.rank === 7) addWall('file', direction, 0, -1)
    if (black.rank === 0) addWall('file', direction, 0, 1)
    if (black.file === 0) addWall('rank', direction, 1, 0)
    if (black.file === 7) addWall('rank', direction, -1, 0)
  }
  return walls
}

function getPhaseTwoWalls(
  blackKing: Square,
  targetCorner: Square,
): readonly PhaseTwoWall[] {
  const black = squareCoordinates(blackKing)
  const target = squareCoordinates(targetCorner)
  return getAllPhaseTwoWalls(blackKing).filter(({ edgeSquare }) => {
    const edge = squareCoordinates(edgeSquare)
    const along = edge.file === black.file ? 'rank' : 'file'
    const blackAxis = black[along]
    const targetAxis = target[along]
    if (targetAxis === blackAxis) return true
    return (
      Math.sign(edge[along] - blackAxis) ===
      -Math.sign(targetAxis - blackAxis)
    )
  })
}

function bishopsControlPhaseTwoWall(
  fen: string,
  bishops: readonly Square[],
  wall: PhaseTwoWall,
): boolean {
  return bishops.some(
    (edgeBishop) =>
      edgeBishop !== wall.edgeSquare &&
      bishopHasClearLineToSquare(fen, edgeBishop, wall.edgeSquare) &&
      bishops.some(
        (inwardBishop) =>
          inwardBishop !== edgeBishop &&
          inwardBishop !== wall.inwardSquare &&
          bishopHasClearLineToSquare(
            fen,
            inwardBishop,
            wall.inwardSquare,
          ),
      ),
  )
}

function isOnBlackKingsEdge(square: Square, blackKing: Square): boolean {
  const candidate = squareCoordinates(square)
  const black = squareCoordinates(blackKing)
  return (
    (black.file === 0 && candidate.file === 0) ||
    (black.file === 7 && candidate.file === 7) ||
    (black.rank === 0 && candidate.rank === 0) ||
    (black.rank === 7 && candidate.rank === 7)
  )
}

function isOnPhaseTwoKingLine(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  return (
    (black.file === 0 && white.file === 2) ||
    (black.file === 7 && white.file === 5) ||
    (black.rank === 0 && white.rank === 2) ||
    (black.rank === 7 && white.rank === 5)
  )
}

function bishopsHaveValidPhaseTwoWall(
  fen: string,
  bishops: readonly Square[],
  walls: readonly PhaseTwoWall[],
  whiteKing: Square,
): boolean {
  return getControlledPhaseTwoWalls(
    fen,
    bishops,
    walls,
    whiteKing,
  ).length > 0
}

function getControlledPhaseTwoWalls(
  fen: string,
  bishops: readonly Square[],
  walls: readonly PhaseTwoWall[],
  whiteKing: Square,
): readonly PhaseTwoWall[] {
  return walls.filter(
    (wall) =>
      manhattanDistance(whiteKing, wall.edgeSquare) > 1 &&
      manhattanDistance(whiteKing, wall.inwardSquare) > 1 &&
      bishopsControlPhaseTwoWall(fen, bishops, wall),
  )
}

function getBlackEdgeCorners(blackKing: Square): readonly Square[] {
  const black = squareCoordinates(blackKing)
  if (BOARD_CORNERS.includes(blackKing)) return [blackKing]
  if (black.file === 0) return ['a1', 'a8']
  if (black.file === 7) return ['h1', 'h8']
  if (black.rank === 0) return ['a1', 'h1']
  if (black.rank === 7) return ['a8', 'h8']
  return []
}

function getResultTargetCornerSelection(
  startingFen: string,
  blackKing: Square | undefined,
  whiteKing: Square | undefined,
  bishops: readonly Square[],
): {
  readonly corners: readonly Square[]
  readonly score: number
  readonly cornerDiagonalsTarget: boolean
} {
  if (!blackKing || !whiteKing) {
    return { corners: [], score: 0, cornerDiagonalsTarget: false }
  }
  const edgeCorners = getBlackEdgeCorners(blackKing)
  if (edgeCorners.length <= 1) {
    return {
      corners: edgeCorners,
      score: 0,
      cornerDiagonalsTarget: false,
    }
  }
  const adjacentCorners = edgeCorners.filter(
    (corner) => kingDistance(blackKing, corner) === 1,
  )
  if (adjacentCorners.length > 0) {
    return {
      corners: adjacentCorners,
      score: 0,
      cornerDiagonalsTarget: false,
    }
  }

  const black = squareCoordinates(blackKing)
  const edgeAxis = black.file === 0 || black.file === 7 ? 'rank' : 'file'
  const getFixedTargetStrength = (targetCorner: Square): number => {
    const whiteAxis = squareCoordinates(whiteKing)[edgeAxis]
    const targetDirection = Math.sign(
      squareCoordinates(targetCorner)[edgeAxis] - whiteAxis,
    )
    const supportingBishops = bishops.filter(
      (bishop) =>
        Math.sign(squareCoordinates(bishop)[edgeAxis] - whiteAxis) ===
        -targetDirection,
    ).length
    return Math.max(1, supportingBishops)
  }
  const startingBishops = getWhiteBishopSquares(startingFen)
  for (const transform of SQUARE_TRANSFORMS) {
    if (whiteKing !== transformSquare('f6', transform)) {
      continue
    }
    const heldSquare = transformSquare('f8', transform)
    const cutoffSquare = transformSquare('h5', transform)
    const cutoffBishop = startingBishops.find(
      (bishop) =>
        bishop !== cutoffSquare &&
        bishopHasClearLineToSquare(startingFen, bishop, cutoffSquare),
    )
    if (
      blackKing === transformSquare('g8', transform) &&
      cutoffBishop
    ) {
      const targetCorner = transformSquare('h8', transform)
      return {
        corners: [targetCorner],
        score: getFixedTargetStrength(targetCorner),
        cornerDiagonalsTarget: true,
      }
    }
    if (blackKing !== transformSquare('h7', transform)) continue
    const heldBishop = startingBishops.find(
      (bishop) =>
        bishop !== heldSquare &&
        bishopHasClearLineToSquare(startingFen, bishop, heldSquare),
    )
    if (heldBishop && cutoffBishop && heldBishop !== cutoffBishop) {
      const targetCorner = transformSquare('h8', transform)
      return {
        corners: [targetCorner],
        score: getFixedTargetStrength(targetCorner),
        cornerDiagonalsTarget: true,
      }
    }
  }

  if (isInOpposition(whiteKing, blackKing, 1)) {
    const whiteAxis = squareCoordinates(whiteKing)[edgeAxis]
    const physicalSideCount = bishops.reduce(
      (sum, bishop) =>
        sum + Math.sign(squareCoordinates(bishop)[edgeAxis] - whiteAxis),
      0,
    )
    if (physicalSideCount !== 0) {
      const targetCoordinate =
        physicalSideCount > 0
          ? Math.min(
              ...edgeCorners.map(
                (corner) => squareCoordinates(corner)[edgeAxis],
              ),
            )
          : Math.max(
              ...edgeCorners.map(
                (corner) => squareCoordinates(corner)[edgeAxis],
              ),
            )
      return {
        corners: edgeCorners.filter(
          (corner) =>
            squareCoordinates(corner)[edgeAxis] === targetCoordinate,
        ),
        score: Math.abs(physicalSideCount),
        cornerDiagonalsTarget: false,
      }
    }
  }

  const races = edgeCorners.map((corner) => ({
    corner,
    whiteDistance: kingDistance(whiteKing, corner),
    lead:
      kingDistance(blackKing, corner) -
      kingDistance(whiteKing, corner),
  }))
  const winningRaces = races.filter(({ lead }) => lead > 0)
  if (winningRaces.length > 0) {
    const bestLead = Math.max(...winningRaces.map(({ lead }) => lead))
    return {
      corners: winningRaces
        .filter(({ lead }) => lead === bestLead)
        .map(({ corner }) => corner),
      score: bestLead,
      cornerDiagonalsTarget: false,
    }
  }

  const closestWhiteDistance = Math.min(
    ...races.map(({ whiteDistance }) => whiteDistance),
  )
  return {
    corners: races
      .filter(({ whiteDistance }) => whiteDistance === closestWhiteDistance)
      .map(({ corner }) => corner),
    score: 0,
    cornerDiagonalsTarget: false,
  }
}

function getSequesterTwoAwaySquares(
  blackKing: Square | undefined,
): readonly Square[] {
  if (!blackKing) return []
  const black = squareCoordinates(blackKing)
  const candidates: (Square | null)[] = []
  if (black.file === 0 || black.file === 7) {
    candidates.push(
      squareFromCoordinates(black.file, black.rank - 2),
      squareFromCoordinates(black.file, black.rank + 2),
    )
  }
  if (black.rank === 0 || black.rank === 7) {
    candidates.push(
      squareFromCoordinates(black.file - 2, black.rank),
      squareFromCoordinates(black.file + 2, black.rank),
    )
  }
  return candidates.filter((square): square is Square => square !== null)
}

function getShepherdMoves(
  fen: string,
  blackKing: Square | undefined,
  whiteKing: Square | undefined,
  bishops: readonly Square[],
): readonly string[] {
  if (!blackKing || !whiteKing) return []
  const twoAwaySquares = getSequesterTwoAwaySquares(blackKing)
  if (twoAwaySquares.length === 0) return []

  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (
        move.piece !== 'k' ||
        !isInOpposition(move.to, blackKing, 1)
      ) {
        return false
      }
      const targetCorners = getResultTargetCornerSelection(
        fen,
        blackKing,
        move.to,
        bishops,
      ).corners
      return targetCorners.some((targetCorner) => {
        if (
          kingDistance(move.to, targetCorner) >=
          kingDistance(whiteKing, targetCorner)
        ) {
          return false
        }
        return twoAwaySquares.some(
          (twoAwaySquare) =>
            kingDistance(twoAwaySquare, targetCorner) >
              kingDistance(blackKing, targetCorner) &&
            bishops.some(
              (bishop) =>
                bishop !== twoAwaySquare &&
                bishopHasClearLineToSquare(fen, bishop, twoAwaySquare),
            ),
        )
      })
    })
    .map(({ san }) => san)
}

function bishopHasClearLineToSquare(
  fen: string,
  bishop: Square,
  target: Square,
): boolean {
  return bishopHasClearLineToSquareOnBoard(getChess(fen), bishop, target)
}

function bishopHasClearLineToSquareOnBoard(
  chess: ReturnType<typeof getChess>,
  bishop: Square,
  target: Square,
  ignoredBlocker?: Square,
): boolean {
  if (!bishopIsAlignedWithSquare(bishop, target)) return false
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  const fileStep = Math.sign(destination.file - source.file)
  const rankStep = Math.sign(destination.rank - source.rank)
  let file = source.file + fileStep
  let rank = source.rank + rankStep
  while (file !== destination.file || rank !== destination.rank) {
    const square = squareFromCoordinates(file, rank)
    if (!square || (square !== ignoredBlocker && chess.get(square))) {
      return false
    }
    file += fileStep
    rank += rankStep
  }
  return true
}

function bishopIsAlignedWithSquare(
  bishop: Square,
  target: Square,
): boolean {
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  return (
    bishop !== target &&
    Math.abs(source.file - destination.file) ===
      Math.abs(source.rank - destination.rank)
  )
}

function getCornerDiagonalsDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    if (
      blackKing !== transformSquare('h7', transform) ||
      whiteKing !== transformSquare('f6', transform)
    ) {
      continue
    }

    const heldSquare = transformSquare('f8', transform)
    const targetSquare = transformSquare('h5', transform)
    const targetDiagonalSquares = MATE_PREP_LIGHT_DIAGONAL.map(
      (square) => transformSquare(square, transform),
    )
    const interveningEdgeSquare = transformSquare('h6', transform)
    const holdingBishop = bishops.find(
      (bishop) =>
        bishop !== heldSquare &&
        bishopHasClearLineToSquare(fen, bishop, heldSquare),
    )
    if (!holdingBishop) continue

    const allowedSans = legalMoves
      .filter((move) => {
        const after = getChess(fen)
        after.move(move.san)
        const resultFen = after.fen()
        const resultBishops = getWhiteBishopSquares(resultFen)
        const preservesBothControls = resultBishops.some(
          (heldBishop) =>
            heldBishop !== heldSquare &&
            bishopHasClearLineToSquare(
              resultFen,
              heldBishop,
              heldSquare,
            ) &&
            resultBishops.some(
              (targetBishop) =>
                targetBishop !== heldBishop &&
                targetDiagonalSquares.includes(targetBishop),
            ),
        )
        const advancesEdgeCutoff =
          !resultBishops.includes(heldSquare) &&
          resultBishops.some((bishop) =>
            bishopHasClearLineToSquare(resultFen, bishop, targetSquare),
          ) &&
          resultBishops.some((bishop) =>
            bishopHasClearLineToSquare(
              resultFen,
              bishop,
              interveningEdgeSquare,
            ),
          )
        return preservesBothControls || advancesEdgeCutoff
      })
      .map((move) => move.san)
    if (allowedSans.length > 0) {
      return {
        allowedSans,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.cornerDiagonals,
      }
    }
  }

  return null
}

function getXxDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('h8', transform)
    const expectedWhiteKing = transformSquare('f8', transform)
    const expectedLightBishop = transformSquare('f7', transform)
    const controlSquare = transformSquare('h6', transform)
    const darkBishop = bishops.find(
      (bishop) =>
        bishop !== expectedLightBishop &&
        squareColor(bishop) === squareColor(controlSquare),
    )
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishops.includes(expectedLightBishop) ||
      darkBishop === undefined
    ) {
      continue
    }

    const allowedSans = legalMoves
      .filter((move) => move.piece === 'b' && move.from === darkBishop)
      .filter((move) => {
        const after = getChess(fen)
        after.move(move.san)
        return bishopHasClearLineToSquare(
          after.fen(),
          move.to,
          controlSquare,
        )
      })
      .map((move) => move.san)
    if (allowedSans.length > 0) {
      return {
        allowedSans,
        stopAfterRepair: true,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.xx,
      }
    }
  }

  return null
}

function getWallWaitingMoveDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('h7', transform)
    const expectedWhiteKing = transformSquare('f5', transform)
    const expectedBishops = [
      transformSquare('f7', transform),
      transformSquare('f6', transform),
    ]
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !expectedBishops.every((bishop) => bishopSet.has(bishop))
    ) {
      continue
    }

    const requiredControlSquares = [
      transformSquare('g8', transform),
      transformSquare('h8', transform),
    ]
    const allowedSans = legalMoves
      .filter((move) => {
        if (move.piece !== 'b') return false
        const after = getChess(fen)
        after.move(move.san)
        const resultFen = after.fen()
        const resultBishops = getWhiteBishopSquares(resultFen)
        return requiredControlSquares.every((requiredSquare) =>
          resultBishops.some((bishop) =>
            bishopHasClearLineToSquare(
              resultFen,
              bishop,
              requiredSquare,
            ),
          ),
        )
      })
      .map((move) => move.san)
    if (allowedSans.length > 0) {
      return {
        allowedSans,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.wallWaitingMove,
      }
    }
  }

  return null
}

function getKnightStepControlDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedWhiteKing = squareCoordinates(
      transformSquare('f4', transform),
    )
    const actualWhiteKing = squareCoordinates(whiteKing)
    const fileTranslation = actualWhiteKing.file - transformedWhiteKing.file
    const rankTranslation = actualWhiteKing.rank - transformedWhiteKing.rank
    const translatePatternSquare = (square: Square): Square | null => {
      const transformed = squareCoordinates(
        transformSquare(square, transform),
      )
      return squareFromCoordinates(
        transformed.file + fileTranslation,
        transformed.rank + rankTranslation,
      )
    }
    const expectedBlackKing = translatePatternSquare('h3')
    const firstExpectedBishop = translatePatternSquare('g8')
    const secondExpectedBishop = translatePatternSquare('g7')
    const uncontrolledSquare = translatePatternSquare('h5')
    const targetSquare = translatePatternSquare('g2')
    if (
      !expectedBlackKing ||
      !firstExpectedBishop ||
      !secondExpectedBishop ||
      !uncontrolledSquare ||
      !targetSquare
    ) {
      continue
    }
    const expectedBishops = [firstExpectedBishop, secondExpectedBishop]
    if (
      blackKing !== expectedBlackKing ||
      !isKnightMove(whiteKing, blackKing) ||
      !expectedBishops.every((bishop) => bishopSet.has(bishop)) ||
      bishops.some((bishop) =>
        bishopHasClearLineToSquare(fen, bishop, uncontrolledSquare),
      )
    ) {
      continue
    }

    const allowedSans = legalMoves
      .filter((move) => {
        if (move.piece !== 'b') return false
        const after = getChess(fen)
        after.move(move.san)
        const resultFen = after.fen()
        return getWhiteBishopSquares(resultFen).some((bishop) =>
          bishopHasClearLineToSquare(resultFen, bishop, targetSquare),
        )
      })
      .map((move) => move.san)
    if (allowedSans.length > 0) {
      return {
        allowedSans,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.knightStepControl,
      }
    }
  }

  return null
}

function getMateInFourDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })
  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('a7', transform)
    const expectedWhiteKing = transformSquare('c6', transform)
    const requiredControl = transformSquare('a6', transform)
    const target = transformSquare('c7', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishops.some((bishop) =>
        bishopHasClearLineToSquare(fen, bishop, requiredControl),
      )
    ) {
      continue
    }
    const repairIsLegal = legalMoves.some(
      (move) =>
        move.piece === 'k' &&
        move.from === expectedWhiteKing &&
        move.to === target,
    )
    if (repairIsLegal) {
      return {
        from: expectedWhiteKing,
        to: target,
        stopAfterRepair: true,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.mateInFour,
      }
    }
  }
  return null
}

function getIgnoreLightBishopDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('g8', transform)
    const expectedWhiteKing = transformSquare('f6', transform)
    const darkBishop = transformSquare('g7', transform)
    const target = transformSquare('h6', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishops.includes(darkBishop)
    ) {
      continue
    }
    const repairIsLegal = legalMoves.some(
      (move) =>
        move.piece === 'b' &&
        move.from === darkBishop &&
        move.to === target,
    )
    if (repairIsLegal) {
      return {
        from: darkBishop,
        to: target,
        stopAfterRepair: true,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.ignoreLightBishop,
      }
    }
  }
  return null
}

function getPhaseTwoOppositionDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })
  const bishopSet = new Set(bishops)

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('g8', transform)
    const expectedWhiteKing = transformSquare('e6', transform)
    const expectedBishops = [
      transformSquare('b7', transform),
      transformSquare('d4', transform),
    ]
    const target = transformSquare('f6', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !expectedBishops.every((square) => bishopSet.has(square))
    ) {
      continue
    }
    const repairIsLegal = legalMoves.some(
      (move) =>
        move.piece === 'k' &&
        move.from === expectedWhiteKing &&
        move.to === target,
    )
    if (repairIsLegal) {
      return {
        from: expectedWhiteKing,
        to: target,
        stopAfterRepair: true,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.phaseTwoOpposition,
      }
    }
  }
  return null
}

function getEdgeDegenerateRepair(
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  for (const corner of BOARD_CORNERS) {
    const cornerCoordinates = squareCoordinates(corner)
    const fileInward = cornerCoordinates.file === 0 ? 1 : -1
    const rankInward = cornerCoordinates.rank === 0 ? 1 : -1
    const orientations = [
      {
        edgeFile: 0,
        edgeRank: rankInward,
        interiorFile: fileInward,
        interiorRank: 0,
      },
      {
        edgeFile: fileInward,
        edgeRank: 0,
        interiorFile: 0,
        interiorRank: rankInward,
      },
    ] as const
    for (const orientation of orientations) {
      const squareAt = (interiorSteps: number, edgeSteps: number) =>
        squareFromCoordinates(
          cornerCoordinates.file +
            interiorSteps * orientation.interiorFile +
            edgeSteps * orientation.edgeFile,
          cornerCoordinates.rank +
            interiorSteps * orientation.interiorRank +
            edgeSteps * orientation.edgeRank,
        )
      const expectedWhiteKing = squareAt(2, 1)
      const screenedBishop = squareAt(3, 0)
      const repairTarget = squareAt(4, 1)
      const controllingDiagonal = Array.from(
        { length: 5 },
        (_, edgeSteps) => squareAt(4 - edgeSteps, edgeSteps),
      ).filter((square): square is Square => square !== undefined)
      if (
        [0, 1, 2, 3].some(
          (edgeSteps) => squareAt(0, edgeSteps) === blackKing,
        ) &&
        expectedWhiteKing === whiteKing &&
        screenedBishop &&
        repairTarget &&
        bishops.includes(screenedBishop) &&
        bishops.some((bishop) => controllingDiagonal.includes(bishop))
      ) {
        return {
          from: screenedBishop,
          to: repairTarget,
          reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeRepair,
        }
      }
    }
  }
  return null
}

function getEdgeUnmaskDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })
  for (const corner of BOARD_CORNERS) {
    const cornerCoordinates = squareCoordinates(corner)
    const fileInward = cornerCoordinates.file === 0 ? 1 : -1
    const rankInward = cornerCoordinates.rank === 0 ? 1 : -1
    const orientations = [
      {
        edgeFile: 0,
        edgeRank: rankInward,
        interiorFile: fileInward,
        interiorRank: 0,
      },
      {
        edgeFile: fileInward,
        edgeRank: 0,
        interiorFile: 0,
        interiorRank: rankInward,
      },
    ] as const
    for (const orientation of orientations) {
      const squareAt = (interiorSteps: number, edgeSteps: number) =>
        squareFromCoordinates(
          cornerCoordinates.file +
            interiorSteps * orientation.interiorFile +
            edgeSteps * orientation.edgeFile,
          cornerCoordinates.rank +
            interiorSteps * orientation.interiorRank +
            edgeSteps * orientation.edgeRank,
        )
      const expectedWhiteKing = squareAt(2, 1)
      const screenedBishop = squareAt(3, 0)
      const repairTarget = squareAt(4, 1)
      const blackKingMatches = [
        squareAt(0, 0),
        squareAt(0, 1),
        squareAt(0, 2),
        squareAt(0, 3),
        squareAt(1, 3),
      ].includes(blackKing)
      if (
        expectedWhiteKing !== whiteKing ||
        !screenedBishop ||
        !repairTarget ||
        !blackKingMatches ||
        !bishops.includes(screenedBishop)
      ) {
        continue
      }
      const repairIsLegal = legalMoves.some(
        (move) =>
          move.piece === 'b' &&
          move.from === screenedBishop &&
          move.to === repairTarget,
      )
      if (repairIsLegal) {
        return {
          from: screenedBishop,
          to: repairTarget,
          reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeUnmask,
        }
      }
    }
  }
  return null
}

function getDiagonalWaitingDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })
  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('g8', transform)
    const expectedWhiteKing = transformSquare('e6', transform)
    const expectedBishops = [
      transformSquare('e8', transform),
      transformSquare('f6', transform),
    ]
    const movingBishop = transformSquare('e8', transform)
    const repairTarget = transformSquare('h5', transform)
    if (
      expectedBlackKing !== blackKing ||
      expectedWhiteKing !== whiteKing ||
      !expectedBishops.every((bishop) => bishopSet.has(bishop))
    ) {
      continue
    }
    const repairIsLegal = legalMoves.some(
      (move) =>
        move.piece === 'b' &&
        move.from === movingBishop &&
        move.to === repairTarget,
    )
    if (repairIsLegal) {
      return {
        from: movingBishop,
        to: repairTarget,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalWaitingMove,
      }
    }
  }
  return null
}

function getKingLiftDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const canonicalBlackKings: readonly Square[] = ['g1', 'h1']
  const canonicalBishopDiagonal: readonly Square[] = [
    'a5',
    'b4',
    'c3',
    'd2',
    'e1',
  ]
  const legalKingMoves = getChess(fen)
    .moves({ verbose: true })
    .filter((move) => move.piece === 'k' && move.from === whiteKing)

  for (const transform of SQUARE_TRANSFORMS) {
    if (
      !canonicalBlackKings
        .map((square) => transformSquare(square, transform))
        .includes(blackKing)
    ) {
      continue
    }
    const transformedDiagonal = canonicalBishopDiagonal.map((square) =>
      transformSquare(square, transform),
    )
    const diagonalBishop = bishops.find((bishop) =>
      transformedDiagonal.includes(bishop),
    )
    const otherBishop = bishops.find((bishop) => bishop !== diagonalBishop)
    if (
      !diagonalBishop ||
      !otherBishop ||
      squareColor(diagonalBishop) === squareColor(otherBishop)
    ) {
      continue
    }

    const target = transformSquare('g3', transform)
    if (legalKingMoves.some((move) => move.to === target)) {
      return {
        from: whiteKing,
        to: target,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingLift,
      }
    }
  }
  return null
}

function getBishopRetreatDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })
  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('h6', transform)
    const expectedWhiteKing = transformSquare('f8', transform)
    const stationaryBishop = transformSquare('f6', transform)
    const movingBishop = transformSquare('f7', transform)
    const target = transformSquare('e8', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishopSet.has(stationaryBishop) ||
      !bishopSet.has(movingBishop)
    ) {
      continue
    }
    if (
      legalMoves.some(
        (move) =>
          move.piece === 'b' &&
          move.from === movingBishop &&
          move.to === target,
      )
    ) {
      return {
        from: movingBishop,
        to: target,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.bishopRetreat,
      }
    }
  }
  return null
}

function getLongDiagonalDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })
  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKings = (
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'] as const
    ).map((square) =>
      transformSquare(square, transform),
    )
    const expectedWhiteKing = transformSquare('f3', transform)
    const movingBishop = transformSquare('f2', transform)
    const allowedTargets = (['e3', 'd4', 'c5', 'b6'] as const).map(
      (square) => transformSquare(square, transform),
    )
    if (
      !expectedBlackKings.includes(blackKing) ||
      expectedWhiteKing !== whiteKing ||
      !bishops.includes(movingBishop)
    ) {
      continue
    }
    const legalTargets = allowedTargets.filter((target) =>
      legalMoves.some(
        (move) =>
          move.piece === 'b' &&
          move.from === movingBishop &&
          move.to === target,
      ),
    )
    if (legalTargets.length > 0) {
      return {
        from: movingBishop,
        allowedTargets: legalTargets,
        stopAfterRepair: true,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.longDiagonal,
      }
    }
  }
  return null
}

function getRelativeKingSidestepDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const black = squareCoordinates(blackKing)
  const white = squareCoordinates(whiteKing)
  const fileDelta = black.file - white.file
  const rankDelta = black.rank - white.rank
  if (
    !(
      (fileDelta === 0 && Math.abs(rankDelta) === 2) ||
      (rankDelta === 0 && Math.abs(fileDelta) === 2)
    )
  ) {
    return null
  }

  const towardBlack = {
    file: Math.sign(fileDelta),
    rank: Math.sign(rankDelta),
  }
  const directlyBehind = squareFromCoordinates(
    white.file - towardBlack.file,
    white.rank - towardBlack.rank,
  )
  if (!directlyBehind || !bishops.includes(directlyBehind)) return null

  const sideDirections = [
    { file: -towardBlack.rank, rank: towardBlack.file },
    { file: towardBlack.rank, rank: -towardBlack.file },
  ]
  for (const side of sideDirections) {
    const sideBishop = squareFromCoordinates(
      white.file - towardBlack.file + side.file,
      white.rank - towardBlack.rank + side.rank,
    )
    const target = squareFromCoordinates(
      white.file - side.file,
      white.rank - side.rank,
    )
    if (
      !sideBishop ||
      !target ||
      !bishops.includes(sideBishop)
    ) {
      continue
    }
    const targetIsLegal = getChess(fen)
      .moves({ verbose: true })
      .some(
        (move) =>
          move.piece === 'k' &&
          move.from === whiteKing &&
          move.to === target,
      )
    if (targetIsLegal) {
      return {
        from: whiteKing,
        to: target,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingSidestep,
      }
    }
  }
  return null
}

function getPhaseOneLoopEscapeDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('b5', transform)
    const expectedWhiteKing = transformSquare('d4', transform)
    const movingBishop = transformSquare('a8', transform)
    const stationaryBishop = transformSquare('a7', transform)
    const target = transformSquare('f3', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishopSet.has(movingBishop) ||
      !bishopSet.has(stationaryBishop)
    ) {
      continue
    }
    const targetIsLegal = legalMoves.some(
      (move) =>
        move.piece === 'b' &&
        move.from === movingBishop &&
        move.to === target,
    )
    if (targetIsLegal) {
      return {
        from: movingBishop,
        to: target,
        reasonLabel:
          TWO_BISHOPS_DEGENERATE_REASON_LABELS.phaseOneLoopEscape,
      }
    }
  }
  return null
}

function getMiddleishTargetADegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('b5', transform)
    const expectedWhiteKing = transformSquare('e5', transform)
    const firstBishop = transformSquare('d5', transform)
    const secondBishop = transformSquare('d4', transform)
    const target = transformSquare('d6', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishopSet.has(firstBishop) ||
      !bishopSet.has(secondBishop)
    ) {
      continue
    }
    const targetIsLegal = legalMoves.some(
      (move) =>
        move.piece === 'k' &&
        move.from === whiteKing &&
        move.to === target,
    )
    if (targetIsLegal) {
      return {
        from: whiteKing,
        to: target,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.middleishTargetA,
      }
    }
  }
  return null
}

function getMiddleishTargetBDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('d3', transform)
    const expectedWhiteKing = transformSquare('d6', transform)
    const firstBishop = transformSquare('d5', transform)
    const secondBishop = transformSquare('e5', transform)
    const target = transformSquare('c5', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishopSet.has(firstBishop) ||
      !bishopSet.has(secondBishop)
    ) {
      continue
    }
    const targetIsLegal = legalMoves.some(
      (move) =>
        move.piece === 'k' &&
        move.from === whiteKing &&
        move.to === target,
    )
    if (targetIsLegal) {
      return {
        from: whiteKing,
        to: target,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.middleishTargetB,
      }
    }
  }
  return null
}

function getRelativeKingFlankDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of D4_RELATIVE_TRANSFORMS) {
    const expectedBlackKing = relativeSquare(
      whiteKing,
      transform,
      -1,
      2,
    )
    const firstBishop = relativeSquare(whiteKing, transform, 0, -1)
    const secondBishop = relativeSquare(whiteKing, transform, 1, -1)
    const target = relativeSquare(whiteKing, transform, 1, 1)
    if (
      expectedBlackKing !== blackKing ||
      !firstBishop ||
      !secondBishop ||
      !target ||
      !bishopSet.has(firstBishop) ||
      !bishopSet.has(secondBishop)
    ) {
      continue
    }
    if (
      legalMoves.some(
        (move) =>
          move.piece === 'k' &&
          move.from === whiteKing &&
          move.to === target,
      )
    ) {
      return {
        from: whiteKing,
        to: target,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingFlank,
      }
    }
  }
  return null
}

function getRelativeBishopReformDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  for (const transform of D4_RELATIVE_TRANSFORMS) {
    const expectedBlackKing = relativeSquare(
      whiteKing,
      transform,
      -2,
      -2,
    )
    const stationaryBishop = relativeSquare(
      whiteKing,
      transform,
      -1,
      1,
    )
    const movingBishop = relativeSquare(
      whiteKing,
      transform,
      -2,
      1,
    )
    const target = relativeSquare(whiteKing, transform, -1, 0)
    if (
      expectedBlackKing !== blackKing ||
      !stationaryBishop ||
      !movingBishop ||
      !target ||
      !bishopSet.has(stationaryBishop) ||
      !bishopSet.has(movingBishop)
    ) {
      continue
    }
    const targetIsLegal = getChess(fen)
      .moves({ verbose: true })
      .some(
        (move) =>
          move.piece === 'b' &&
          move.from === movingBishop &&
          move.to === target,
      )
    if (targetIsLegal) {
      return {
        from: movingBishop,
        to: target,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.reformWall,
      }
    }
  }
  return null
}

function getRelativeDiagonalSetupDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const bishopSet = new Set(bishops)
  const legalBishopMoves = getChess(fen).moves({ verbose: true })
  for (const transform of D4_RELATIVE_TRANSFORMS) {
    const expectedBlackKings = [-1, 0]
      .map((rankOffset) =>
        relativeSquare(whiteKing, transform, 2, rankOffset),
      )
      .filter((square): square is Square => square !== null)
    const stationaryBishop = relativeSquare(whiteKing, transform, -1, 1)
    const movingBishop = relativeSquare(whiteKing, transform, -3, -4)
    const target = relativeSquare(whiteKing, transform, 0, -1)
    if (
      !expectedBlackKings.includes(blackKing) ||
      !stationaryBishop ||
      !movingBishop ||
      !target ||
      !bishopSet.has(stationaryBishop) ||
      !bishopSet.has(movingBishop)
    ) {
      continue
    }
    if (
      legalBishopMoves.some(
        (move) =>
          move.piece === 'b' &&
          move.from === movingBishop &&
          move.to === target,
      )
    ) {
      return {
        from: movingBishop,
        to: target,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalSetup,
      }
    }
  }
  return null
}

function getWaitingMoveDegenerateRepair(
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  if (!BOARD_CORNERS.includes(blackKing)) return null
  const opposedBishop = bishops.find(
    (bishop) =>
      isKnightMove(whiteKing, blackKing) &&
      kingDistance(bishop, whiteKing) === 1 &&
      isInOpposition(bishop, blackKing, 1),
  )
  if (!opposedBishop) return null
  const repairBishop = bishops.find((bishop) => bishop !== opposedBishop)
  return repairBishop
    ? {
        from: repairBishop,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.waitingMove,
      }
    : null
}

function getFreeBishopDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  if (!BOARD_CORNERS.includes(blackKing)) return null
  const corner = squareCoordinates(blackKing)
  const fileStep = corner.file === 0 ? 1 : -1
  const rankStep = corner.rank === 0 ? 1 : -1
  const edgeRoutes = [
    {
      adjacent: squareFromCoordinates(corner.file + fileStep, corner.rank),
      second: squareFromCoordinates(corner.file + 2 * fileStep, corner.rank),
    },
    {
      adjacent: squareFromCoordinates(corner.file, corner.rank + rankStep),
      second: squareFromCoordinates(corner.file, corner.rank + 2 * rankStep),
    },
  ]
  const kingBlockedRoute = edgeRoutes.findIndex(
    ({ adjacent }) => adjacent && kingDistance(whiteKing, adjacent) <= 1,
  )
  if (
    kingBlockedRoute < 0 ||
    edgeRoutes.filter(
      ({ adjacent }) => adjacent && kingDistance(whiteKing, adjacent) <= 1,
    ).length !== 1
  ) {
    return null
  }

  const otherRoute = edgeRoutes[1 - kingBlockedRoute]
  if (!otherRoute?.second) return null
  const blockingBishop = bishops.find((bishop) =>
    bishopHasClearLineToSquare(fen, bishop, otherRoute.second!),
  )
  if (!blockingBishop) return null

  const freeBishop = bishops.find(
    (bishop) =>
      bishop !== blockingBishop &&
      kingDistance(bishop, whiteKing) === 1 &&
      Math.abs(
        squareCoordinates(bishop).file - squareCoordinates(whiteKing).file,
      ) === 1 &&
      kingDistance(bishop, blackKing) > kingDistance(whiteKing, blackKing),
  )
  return freeBishop
    ? {
        from: freeBishop,
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.freeBishop,
      }
    : null
}

function getDegenerateRepair(
  fen: string,
  isPhaseTwo: boolean,
): DegenerateRepair | null {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (
    !blackKing ||
    !whiteKing ||
    bishops.length !== 2
  ) {
    return null
  }

  const attempts: Record<
    TwoBishopsDegenerateReasonLabel,
    () => DegenerateRepair | null
  > = {
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.phaseTwoOpposition]: () =>
      isPhaseTwo
        ? getPhaseTwoOppositionDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.ignoreLightBishop]: () =>
      isPhaseTwo
        ? getIgnoreLightBishopDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.mateInFour]: () =>
      isPhaseTwo
        ? getMateInFourDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.knightStepControl]: () =>
      isPhaseTwo
        ? getKnightStepControlDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.wallWaitingMove]: () =>
      isPhaseTwo
        ? getWallWaitingMoveDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.cornerDiagonals]: () =>
      isPhaseTwo
        ? getCornerDiagonalsDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.xx]: () =>
      isPhaseTwo
        ? getXxDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeRepair]: () =>
      isPhaseTwo
        ? getEdgeDegenerateRepair(blackKing, whiteKing, bishops)
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeUnmask]: () =>
      getEdgeUnmaskDegenerateRepair(
        fen,
        blackKing,
        whiteKing,
        bishops,
      ),
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalSetup]: () =>
      isPhaseTwo
        ? getRelativeDiagonalSetupDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalWaitingMove]: () =>
      isPhaseTwo
        ? getDiagonalWaitingDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.freeBishop]: () =>
      isPhaseTwo
        ? getFreeBishopDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.waitingMove]: () =>
      isPhaseTwo
        ? getWaitingMoveDegenerateRepair(blackKing, whiteKing, bishops)
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.middleishTargetA]: () =>
      !isPhaseTwo
        ? getMiddleishTargetADegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.middleishTargetB]: () =>
      !isPhaseTwo
        ? getMiddleishTargetBDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.phaseOneLoopEscape]: () =>
      !isPhaseTwo
        ? getPhaseOneLoopEscapeDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingFlank]: () =>
      !isPhaseTwo
        ? getRelativeKingFlankDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingSidestep]: () =>
      !isPhaseTwo
        ? getRelativeKingSidestepDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.reformWall]: () =>
      !isPhaseTwo
        ? getRelativeBishopReformDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingLift]: () =>
      isPhaseTwo
        ? getKingLiftDegenerateRepair(fen, blackKing, whiteKing, bishops)
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.bishopRetreat]: () =>
      isPhaseTwo
        ? getBishopRetreatDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.longDiagonal]: () =>
      isPhaseTwo
        ? getLongDiagonalDegenerateRepair(
            fen,
            blackKing,
            whiteKing,
            bishops,
          )
        : null,
  }

  for (const reasonLabel of TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER) {
    const repair = attempts[reasonLabel]()
    if (repair) return repair
  }
  return null
}

function bishopCheckForcesCornerThenOtherBishopMate(
  fen: string,
  corner: Square,
): readonly string[] {
  const startingBishops = getWhiteBishopSquares(fen)
  const chess = getChess(fen)
  const checks = chess
    .moves({ verbose: true })
    .filter((move) => move.piece === 'b' && move.san.endsWith('+'))
  const forcingChecks: string[] = []
  for (const move of checks) {
    const matingBishop = startingBishops.find(
      (bishop) => bishop !== move.from,
    )
    if (matingBishop === undefined) continue
    chess.move(move.san)
    const replies = chess.moves({ verbose: true })
    if (
      replies.length === 1 &&
      replies[0]?.piece === 'k' &&
      replies[0].to === corner
    ) {
      chess.move(replies[0].san)
      const hasMate = chess
        .moves({ verbose: true })
        .some(
          (mate) =>
            mate.piece === 'b' &&
            mate.from === matingBishop &&
            mate.san.endsWith('#'),
        )
      chess.undo()
      if (hasMate) forcingChecks.push(move.san)
    }
    chess.undo()
  }
  return forcingChecks
}

function getMatePatternTurnsBySan(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): ReadonlyMap<string, 2 | 3> {
  const turnsBySan = new Map<string, 2 | 3>()
  if (!whiteKing || !blackKing) return turnsBySan
  const legalMoves = getChess(fen).moves({ verbose: true })

  if (
    BOARD_CORNERS.includes(blackKing) &&
    isMatingPosition(whiteKing, blackKing)
  ) {
    const chess = getChess(fen)
    for (const move of legalMoves) {
      if (move.san.endsWith('+') || move.san.endsWith('#')) continue
      chess.move(move.san)
      const replies = chess.moves({ verbose: true })
      const forcedEdgeReply = replies[0]
      if (
        replies.length !== 1 ||
        forcedEdgeReply?.piece !== 'k' ||
        kingDistance(forcedEdgeReply.to, blackKing) !== 1 ||
        edgeDistance(forcedEdgeReply.to) !== 0 ||
        BOARD_CORNERS.includes(forcedEdgeReply.to)
      ) {
        chess.undo()
        continue
      }
      chess.move(forcedEdgeReply.san)
      if (
        bishopCheckForcesCornerThenOtherBishopMate(
          chess.fen(),
          blackKing,
        ).length > 0
      ) {
        turnsBySan.set(move.san, 3)
      }
      chess.undo()
      chess.undo()
    }
  }

  const proximateCorners = BOARD_CORNERS.filter(
    (corner) =>
      kingDistance(blackKing, corner) === 1 &&
      edgeDistance(blackKing) === 0 &&
      isMatingPosition(whiteKing, corner),
  )
  for (const corner of proximateCorners) {
    for (const san of bishopCheckForcesCornerThenOtherBishopMate(fen, corner)) {
      turnsBySan.set(san, 2)
    }
  }
  return turnsBySan
}

type TwoBishopsWhitePositionContext = {
  readonly blackKing: Square | undefined
  readonly startingWhiteKing: Square | undefined
  readonly startingBishops: readonly Square[]
  readonly isPhaseTwo: boolean
  readonly degenerateRepair: DegenerateRepair | null
  readonly mateInThreeApplies: boolean
  readonly matePatternTurnsBySan: ReadonlyMap<string, 2 | 3>
  readonly shepherdMoves: readonly string[]
  readonly prepareMatePreferredMoves: readonly string[]
  readonly ruleAAApplies: boolean
  readonly ruleAAPenaltiesBySan: ReadonlyMap<string, number>
  readonly ruleAApplies: boolean
  readonly ruleAPenaltiesBySan: ReadonlyMap<string, number>
  readonly ruleBApplies: boolean
  readonly ruleBPenaltiesBySan: ReadonlyMap<string, number>
  readonly ruleNPreferredMoves: readonly string[]
  readonly ruleOApplies: boolean
  readonly ruleOWallAreasBySan: ReadonlyMap<string, number>
  readonly ruleWWApplies: boolean
  readonly ruleWWPenaltiesBySan: ReadonlyMap<string, number>
  readonly ruleGPreferredMoves: readonly string[]
  readonly onsidesPreferredMoves: readonly string[]
  readonly bootNScootPreferredMoves: readonly string[]
  readonly bootNScootUniqueBest: boolean
  readonly ruleRPreferredMoves: readonly string[]
  readonly ruleSPreferredMoves: readonly string[]
  readonly ruleTGeometry: RuleTGeometry | null
  readonly ruleUUPreferredMoves: readonly string[]
  readonly ruleUPreferredMoves: readonly string[]
  readonly ruleVMatchingGeometriesBySan: ReadonlyMap<
    string,
    readonly SqueezeGeometry[]
  >
  readonly ruleWYPreferredMoves: readonly string[]
  readonly ruleWApplies: boolean
  readonly ruleWUrgentSetup: boolean
  readonly ruleWUrgentDiagonal: FlankDiagonal | undefined
  readonly ruleWPenaltiesBySan: ReadonlyMap<string, number>
  readonly ruleYThreatenedBishops: readonly Square[]
  readonly deathBoxPreferredMoves: readonly string[]
  readonly preserveExistingMegadethBox: boolean
  readonly megadethBoxPreferredMoves: readonly string[]
  readonly ruleZ1PreferredMoves: readonly string[]
  readonly ruleZ2CompletedPairs: readonly FlankDiagonalPair[]
  readonly kingStutterPreferredMoves: readonly string[]
}

function getKingStutterPreferredMoves(fen: string): readonly string[] {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (
    blackKing === undefined ||
    whiteKing === undefined ||
    bishops.length !== 2 ||
    edgeDistance(blackKing) !== 0
  ) {
    return []
  }
  const bishopSet = new Set(bishops)
  const legalMoves = getChess(fen).moves({ verbose: true })
  const preferred = new Set<string>()

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedBlack = squareCoordinates(
      transformSquare('h5', transform),
    )
    const actualBlack = squareCoordinates(blackKing)
    const fileTranslation = actualBlack.file - transformedBlack.file
    const rankTranslation = actualBlack.rank - transformedBlack.rank
    const translate = (square: Square): Square | null => {
      const transformed = squareCoordinates(
        transformSquare(square, transform),
      )
      return squareFromCoordinates(
        transformed.file + fileTranslation,
        transformed.rank + rankTranslation,
      )
    }
    const expectedWhiteKing = translate('e5')
    const firstBishop = translate('f5')
    const secondBishop = translate('f6')
    const target = translate('e4')
    if (
      expectedWhiteKing === null ||
      firstBishop === null ||
      secondBishop === null ||
      target === null ||
      whiteKing !== expectedWhiteKing ||
      !bishopSet.has(firstBishop) ||
      !bishopSet.has(secondBishop)
    ) {
      continue
    }
    const move = legalMoves.find(
      (candidate) =>
        candidate.piece === 'k' &&
        candidate.from === whiteKing &&
        candidate.to === target,
    )
    if (move !== undefined) preferred.add(move.san)
  }

  return [...preferred]
}

function isDeathBoxPosition(fen: string): boolean {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (
    blackKing === undefined ||
    edgeDistance(blackKing) !== 0 ||
    bishops.length !== 2
  ) {
    return false
  }
  const closestCornerDistance = Math.min(
    ...BOARD_CORNERS.map((corner) => kingDistance(blackKing, corner)),
  )
  const closestCorners = BOARD_CORNERS.filter(
    (corner) => kingDistance(blackKing, corner) === closestCornerDistance,
  )
  return bishops.some(
    (oppositionBishop, index) =>
      isInOpposition(oppositionBishop, blackKing, 1) &&
      edgeDistance(oppositionBishop) !== 0 &&
      !closestCorners.some((corner) =>
        isKnightMove(oppositionBishop, corner),
      ) &&
      bishops.some(
        (knightBishop, otherIndex) =>
          otherIndex !== index &&
          edgeDistance(knightBishop) !== 0 &&
          isKnightMove(knightBishop, blackKing) &&
          kingDistance(oppositionBishop, knightBishop) === 1,
      ),
  )
}

function getDeathBoxPreferredMoves(fen: string): readonly string[] {
  const preserveExistingDeathBox = isDeathBoxPosition(fen)
  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => preserveExistingDeathBox || move.piece === 'b')
    .filter((move) => {
      const result = getChess(fen)
      result.move(move.san)
      return isDeathBoxPosition(result.fen())
    })
    .map((move) => move.san)
}

function getInwardEdgeAdjacentSquares(blackKing: Square): readonly Square[] {
  const { file, rank } = squareCoordinates(blackKing)
  return [
    file === 0 ? squareFromCoordinates(1, rank) : null,
    file === 7 ? squareFromCoordinates(6, rank) : null,
    rank === 0 ? squareFromCoordinates(file, 1) : null,
    rank === 7 ? squareFromCoordinates(file, 6) : null,
  ].filter((square): square is Square => square !== null)
}

function isMegadethBoxPosition(fen: string): boolean {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  if (blackKing === undefined || bishops.length !== 2) return false
  const inwardSquares = getInwardEdgeAdjacentSquares(blackKing)
  if (inwardSquares.length === 0) return false
  return bishops.some(
    (controller, controllerIndex) =>
      inwardSquares.some((inwardSquare) =>
        bishopHasClearLineToSquare(fen, controller, inwardSquare),
      ) &&
      bishops.some(
        (oppositionBishop, oppositionIndex) =>
          oppositionIndex !== controllerIndex &&
          distanceToMiddleSixteen(oppositionBishop) === 0 &&
          isInOpposition(oppositionBishop, blackKing, 1) &&
          kingDistance(controller, oppositionBishop) === 1,
      ),
  )
}

function getMegadethBoxPreferredMoves(fen: string): readonly string[] {
  const preserveExistingMegadethBox = isMegadethBoxPosition(fen)
  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => preserveExistingMegadethBox || move.piece === 'b')
    .filter((move) => {
      const result = getChess(fen)
      result.move(move.san)
      return isMegadethBoxPosition(result.fen())
    })
    .map((move) => move.san)
}

function squeezeProjection(
  square: Square,
  geometry: Pick<SqueezeGeometry, 'normalFile' | 'normalRank'>,
): number {
  const { file, rank } = squareCoordinates(square)
  return file * geometry.normalFile + rank * geometry.normalRank
}

function bishopsControlMatchedSqueezeRoles(
  bishops: readonly Square[],
  geometry: SqueezeGeometry,
  firstIndex: number,
  secondIndex: number,
): boolean {
  return bishops.some(
    (firstBishop, firstBishopIndex) =>
      squeezeProjection(firstBishop, geometry) === firstIndex &&
      bishops.some(
        (secondBishop, secondBishopIndex) =>
          secondBishopIndex !== firstBishopIndex &&
          squeezeProjection(secondBishop, geometry) === secondIndex,
      ),
  )
}

function getRuleTGeometry(
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): RuleTGeometry | null {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isKnightMove(whiteKing, blackKing)
  ) {
    return null
  }
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const axis = Math.abs(black.file - white.file) === 2 ? 'file' : 'rank'
  const index =
    axis === 'file'
      ? (white.file + black.file) / 2
      : (white.rank + black.rank) / 2
  const blackCoordinate = axis === 'file' ? black.file : black.rank
  return {
    axis,
    index,
    startingBlackDistance: Math.abs(blackCoordinate - index),
  }
}

function distanceFromKingMoat(
  square: Square,
  geometry: RuleTGeometry,
): number {
  const coordinates = squareCoordinates(square)
  const coordinate =
    geometry.axis === 'file' ? coordinates.file : coordinates.rank
  return Math.abs(coordinate - geometry.index)
}

function forcesMoatOpposition(
  whiteKing: Square,
  blackReplyKings: readonly Square[],
  geometry: RuleTGeometry,
): boolean {
  return (
    blackReplyKings.length > 0 &&
    blackReplyKings.every(
      (replyKing) =>
        isInOpposition(whiteKing, replyKing, 1) ||
        distanceFromKingMoat(replyKing, geometry) >
          geometry.startingBlackDistance,
    )
  )
}

function getSqueezeGeometries(
  whiteKing: Square,
  blackKing: Square,
): readonly SqueezeGeometry[] {
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const fileDelta = black.file - white.file
  const rankDelta = black.rank - white.rank
  const horizontalOpposition = Math.abs(fileDelta) === 2 && rankDelta === 0
  const verticalOpposition = Math.abs(rankDelta) === 2 && fileDelta === 0
  if (!horizontalOpposition && !verticalOpposition) return []

  const forwardFile = Math.sign(fileDelta) as -1 | 0 | 1
  const forwardRank = Math.sign(rankDelta) as -1 | 0 | 1
  const firstPerpendicularFile = verticalOpposition
    ? (white.file < 3.5 ? 1 : -1)
    : 0
  const firstPerpendicularRank = horizontalOpposition
    ? (white.rank < 3.5 ? 1 : -1)
    : 0
  return [1, -1].map((direction) => {
    const normalFile = (
      forwardFile + direction * firstPerpendicularFile
    ) as -1 | 0 | 1
    const normalRank = (
      forwardRank + direction * firstPerpendicularRank
    ) as -1 | 0 | 1
    const whiteProjection =
      white.file * normalFile + white.rank * normalRank
    return {
      normalFile,
      normalRank,
      primaryIndex: whiteProjection + 3,
      secondaryIndex: whiteProjection + 4,
    }
  })
}

function getOppositionMoatGeometry(
  whiteKing: Square,
  blackKing: Square,
): RuleTGeometry | null {
  if (!isInOpposition(whiteKing, blackKing, 1)) return null
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const axis = white.file === black.file ? 'rank' : 'file'
  const index =
    axis === 'file'
      ? (white.file + black.file) / 2
      : (white.rank + black.rank) / 2
  const blackCoordinate = axis === 'file' ? black.file : black.rank
  return {
    axis,
    index,
    startingBlackDistance: Math.abs(blackCoordinate - index),
  }
}

function getBishopDistanceMoatGeometries(
  whiteKing: Square,
  blackKing: Square,
): readonly RuleTGeometry[] {
  const singleMoat =
    getRuleTGeometry(whiteKing, blackKing) ??
    getOppositionMoatGeometry(whiteKing, blackKing)
  if (singleMoat !== null) return [singleMoat]

  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  if (
    Math.abs(white.file - black.file) !== 2 ||
    Math.abs(white.rank - black.rank) !== 2
  ) {
    return []
  }

  return [
    {
      axis: 'file',
      index: (white.file + black.file) / 2,
      startingBlackDistance: 1,
    },
    {
      axis: 'rank',
      index: (white.rank + black.rank) / 2,
      startingBlackDistance: 1,
    },
  ]
}

function signedWhiteSideDistanceFromMoat(
  square: Square,
  whiteKing: Square,
  moat: RuleTGeometry,
): number {
  const white = squareCoordinates(whiteKing)
  const target = squareCoordinates(square)
  const whiteCoordinate = moat.axis === 'file' ? white.file : white.rank
  const targetCoordinate = moat.axis === 'file' ? target.file : target.rank
  return (
    Math.sign(whiteCoordinate - moat.index) *
    (targetCoordinate - moat.index)
  )
}

function getRuleGPreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): readonly string[] {
  if (whiteKing === undefined || blackKing === undefined) return []
  const bishops = getWhiteBishopSquares(fen)
  if (bishops.length !== 2) return []
  const moats = getBishopDistanceMoatGeometries(whiteKing, blackKing)
  if (moats.length === 0) return []
  const legalMoves = getChess(fen).moves({ verbose: true })
  const preferred = new Set<string>()
  const blackSideBishops = bishops.filter((bishop) =>
    moats.every(
      (moat) =>
        signedWhiteSideDistanceFromMoat(bishop, whiteKing, moat) < 0,
    ),
  )
  if (blackSideBishops.length === 0) return []
  const greatestWhiteDistance = Math.max(
    ...blackSideBishops.map((bishop) => kingDistance(bishop, whiteKing)),
  )
  const selectedBishops = blackSideBishops.filter(
    (bishop) => kingDistance(bishop, whiteKing) === greatestWhiteDistance,
  )
  const black = squareCoordinates(blackKing)

  for (const moat of moats) {
    const crossings = legalMoves.filter(
      (move) => {
        if (
          move.piece !== 'b' ||
          !selectedBishops.includes(move.from) ||
          signedWhiteSideDistanceFromMoat(move.to, whiteKing, moat) <= 0
        ) {
          return false
        }
        const origin = squareCoordinates(move.from)
        const destination = squareCoordinates(move.to)
        return (
          Math.abs(destination.file - black.file) >=
            Math.abs(origin.file - black.file) &&
          Math.abs(destination.rank - black.rank) >=
            Math.abs(origin.rank - black.rank)
        )
      },
    )
    if (crossings.length === 0) continue
    const greatestMoatDistance = Math.max(
      ...crossings.map((move) => distanceFromKingMoat(move.to, moat)),
    )
    for (const move of crossings) {
      if (distanceFromKingMoat(move.to, moat) === greatestMoatDistance) {
        preferred.add(move.san)
      }
    }
  }

  return [...preferred]
}

function getRuleZFollowupTarget(
  whiteKing: Square,
  blackKing: Square,
): Square | null {
  const black = squareCoordinates(blackKing)
  for (const corner of BOARD_CORNERS) {
    if (!isKnightMove(whiteKing, corner)) continue
    const cornerCoordinates = squareCoordinates(corner)
    const fileStep = black.file - cornerCoordinates.file
    const rankStep = black.rank - cornerCoordinates.rank
    if (
      !(
        (Math.abs(fileStep) === 1 && rankStep === 0) ||
        (fileStep === 0 && Math.abs(rankStep) === 1)
      )
    ) {
      continue
    }
    return squareFromCoordinates(
      cornerCoordinates.file + fileStep * 2,
      cornerCoordinates.rank + rankStep * 2,
    )
  }
  return null
}

export function areBishopsOnWhiteSideOfOppositionMoat(
  whiteKing: Square,
  blackKing: Square,
  bishops: readonly Square[],
): boolean {
  const moat = getOppositionMoatGeometry(whiteKing, blackKing)
  return (
    moat !== null &&
    areBishopsOnWhiteSideOfMoat(whiteKing, bishops, moat)
  )
}

function isSquareOnWhiteSideOfMoat(
  square: Square,
  whiteKing: Square,
  moat: RuleTGeometry,
): boolean {
  const white = squareCoordinates(whiteKing)
  const whiteCoordinate =
    moat.axis === 'file' ? white.file : white.rank
  const coordinates = squareCoordinates(square)
  const squareCoordinate =
    moat.axis === 'file' ? coordinates.file : coordinates.rank
  return (
    Math.sign(whiteCoordinate - moat.index) *
      (squareCoordinate - moat.index) >=
    0
  )
}

function areBishopsOnWhiteSideOfMoat(
  whiteKing: Square,
  bishops: readonly Square[],
  moat: RuleTGeometry,
): boolean {
  if (bishops.length !== 2) return false
  return bishops.every((bishop) =>
    isSquareOnWhiteSideOfMoat(bishop, whiteKing, moat),
  )
}

function getOnsidesPreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): readonly string[] {
  if (whiteKing === undefined || blackKing === undefined) return []
  const startingBishops = getWhiteBishopSquares(fen)
  const startingOffsides = startingBishops.filter((bishop) =>
    isTwoBishopsSquareOffsides(bishop, whiteKing, blackKing),
  )
  const legalMoves = getChess(fen).moves({ verbose: true })
  const resultOffsidesCounts = new Map<string, number>()
  for (const move of legalMoves) {
    const result = getChess(fen)
    result.move(move.san)
    const resultWhiteKing = findPiece(result.fen(), 'w', 'k')?.square
    const resultBlackKing = findPiece(result.fen(), 'b', 'k')?.square
    const count =
      resultWhiteKing === undefined || resultBlackKing === undefined
        ? Number.POSITIVE_INFINITY
        : getWhiteBishopSquares(result.fen()).filter((bishop) =>
            isTwoBishopsSquareOffsides(
              bishop,
              resultWhiteKing,
              resultBlackKing,
            ),
          ).length
    resultOffsidesCounts.set(move.san, count)
  }
  if (startingOffsides.length === 0) {
    const bishopMoves = legalMoves.filter((move) => move.piece === 'b')
    const hasWorseningMove = bishopMoves.some(
      (move) => (resultOffsidesCounts.get(move.san) ?? 0) > 0,
    )
    return hasWorseningMove
      ? legalMoves
          .filter(
            (move) =>
              move.piece !== 'b' ||
              resultOffsidesCounts.get(move.san) === 0,
          )
          .map(({ san }) => san)
      : []
  }

  const eligibleRepairs = legalMoves.filter(
    (move) =>
      move.piece === 'b' && startingOffsides.includes(move.from),
  )
  const minimumResultCount = Math.min(
    ...eligibleRepairs.map(
      (move) =>
        resultOffsidesCounts.get(move.san) ?? Number.POSITIVE_INFINITY,
    ),
  )
  if (minimumResultCount >= startingOffsides.length) return []
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const fileDirection = Math.sign(white.file - black.file)
  const rankDirection = Math.sign(white.rank - black.rank)
  const behindWhite = squareFromCoordinates(
    white.file + fileDirection,
    white.rank + rankDirection,
  )
  if (behindWhite === null) return []
  const behind = squareCoordinates(behindWhite)
  const repairMoves = eligibleRepairs
    .filter(
      (move) =>
        resultOffsidesCounts.get(move.san) === minimumResultCount,
    )
    .filter(
      (move) =>
        !bishopDestinationCanBeAttackedOnNextMove(
          fen,
          move.san,
          move.to,
        ),
    )
  if (repairMoves.length === 0) return []
  const targetDistance = (square: Square) => {
    const target = squareCoordinates(square)
    return (
      (target.file - behind.file) ** 2 +
      (target.rank - behind.rank) ** 2
    )
  }
  const closestDistance = Math.min(
    ...repairMoves.map((move) => targetDistance(move.to)),
  )
  return repairMoves
    .filter((move) => targetDistance(move.to) === closestDistance)
    .map(({ san }) => san)
}

function isTwoBishopsSquareOffsides(
  square: Square,
  whiteKing: Square,
  blackKing: Square,
): boolean {
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const target = squareCoordinates(square)
  const projections: number[] = []
  if (white.file !== black.file) {
    projections.push(
      Math.sign(white.file - black.file) *
        (target.file - black.file),
    )
  }
  if (white.rank !== black.rank) {
    projections.push(
      Math.sign(white.rank - black.rank) *
        (target.rank - black.rank),
    )
  }
  return (
    projections.length > 0 &&
    projections.every((projection) => projection <= 0) &&
    projections.some((projection) => projection < 0)
  )
}

export function isTwoBishopsSquareBehindBlack(
  square: Square,
  whiteKing: Square,
  blackKing: Square,
): boolean {
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const target = squareCoordinates(square)
  const fileDelta = Math.abs(white.file - black.file)
  const rankDelta = Math.abs(white.rank - black.rank)
  const behindFile =
    fileDelta > 0 &&
    Math.sign(white.file - black.file) *
      (target.file - black.file) <
      0
  const behindRank =
    rankDelta > 0 &&
    Math.sign(white.rank - black.rank) *
      (target.rank - black.rank) <
      0

  if (fileDelta === 0) return behindRank
  if (rankDelta === 0) return behindFile
  if (fileDelta < rankDelta) {
    return behindFile && target.rank === black.rank
  }
  if (rankDelta < fileDelta) {
    return behindRank && target.file === black.file
  }
  return false
}

function hasTwoBishopsBehindBlackRegion(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const square = squareFromCoordinates(file, rank)
      if (
        square !== null &&
        isTwoBishopsSquareBehindBlack(square, whiteKing, blackKing)
      ) {
        return true
      }
    }
  }
  return false
}

function hasTiedNonzeroKingDifferentials(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const fileDelta = Math.abs(white.file - black.file)
  const rankDelta = Math.abs(white.rank - black.rank)
  return fileDelta > 0 && fileDelta === rankDelta
}

function isSqueezeGeometryOnNearerKingSide(
  whiteKing: Square,
  blackKing: Square,
  geometry: SqueezeGeometry,
): boolean {
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)

  if (white.file === black.file) {
    const nearerFileDirection = white.file < 3.5 ? -1 : 1
    return geometry.normalFile === nearerFileDirection
  }
  if (white.rank === black.rank) {
    const nearerRankDirection = white.rank < 3.5 ? -1 : 1
    return geometry.normalRank === nearerRankDirection
  }
  return false
}

function getBootNScootBlockMoves(
  fen: string,
  whiteKing: Square,
  blackKing: Square,
  bishops: readonly Square[],
): readonly string[] {
  if (!isKnightMove(whiteKing, blackKing)) return []
  const legalMoves = getChess(fen).moves({ verbose: true })
  const oppositionBundles = legalMoves
    .filter(
      (move) =>
        move.piece === 'k' &&
        isInOpposition(move.to, blackKing, 1),
    )
    .map((move) => ({
      move,
      geometries: getSqueezeGeometries(move.to, blackKing),
    }))
  const blockAnchors = oppositionBundles.flatMap(
    ({ move, geometries }) => {
      const secondaryGeometry = geometries.find((geometry) =>
        isSqueezeGeometryOnNearerKingSide(
          move.to,
          blackKing,
          geometry,
        ),
      )
      if (secondaryGeometry === undefined) return []
      return bishops.filter(
        (anchor) =>
          squeezeProjection(anchor, secondaryGeometry) ===
            secondaryGeometry.secondaryIndex &&
          geometries.some((primaryGeometry) =>
            bishops.some(
              (primary) =>
                primary !== anchor &&
                squeezeProjection(primary, primaryGeometry) ===
                  primaryGeometry.primaryIndex,
            ),
          ),
      )
    },
  )
  const knightMoat = getRuleTGeometry(whiteKing, blackKing)
  if (blockAnchors.length === 0 || knightMoat === null) return []

  return legalMoves
    .filter((move) => {
      if (move.piece !== 'b') return false
      const result = getChess(fen)
      result.move(move.san)
      return (
        !result.isCheck() &&
        forcesMoatOpposition(
          whiteKing,
          result.moves({ verbose: true }).map(({ to }) => to),
          knightMoat,
        )
      )
    })
    .map((move) => move.san)
}

function getBootNScootScootMoves(
  fen: string,
  whiteKing: Square,
  blackKing: Square,
  bishops: readonly Square[],
): readonly string[] {
  if (!isKnightMove(whiteKing, blackKing)) return []
  const knightMoat = getRuleTGeometry(whiteKing, blackKing)
  if (knightMoat === null) return []
  const oppositionBundles = getChess(fen)
    .moves({ verbose: true })
    .filter(
      (move) =>
        move.piece === 'k' &&
        isInOpposition(move.to, blackKing, 1),
    )
    .map((move) => ({
      move,
      geometries: getSqueezeGeometries(move.to, blackKing),
    }))

  return oppositionBundles
    .filter(({ move, geometries }) => {
      const primaryGeometry = geometries.find((geometry) =>
        isSqueezeGeometryOnNearerKingSide(
          move.to,
          blackKing,
          geometry,
        ),
      )
      if (primaryGeometry === undefined) return false
      const primaryAnchors = bishops.filter(
        (anchor) =>
          squeezeProjection(anchor, primaryGeometry) ===
          primaryGeometry.primaryIndex,
      )
      const hasPreparedSqueeze =
        primaryAnchors.length > 0 &&
        Math.abs(
          squeezeProjection(move.to, primaryGeometry) -
            primaryGeometry.primaryIndex,
        ) <
          Math.abs(
            squeezeProjection(whiteKing, primaryGeometry) -
              primaryGeometry.primaryIndex,
          ) &&
        geometries.some((secondaryGeometry) =>
          primaryAnchors.some((anchor) =>
            bishops.some(
              (secondary) =>
                secondary !== anchor &&
                squeezeProjection(secondary, secondaryGeometry) ===
                  secondaryGeometry.secondaryIndex,
            ),
          ),
        )
      if (!hasPreparedSqueeze) return false

      const result = getChess(fen)
      result.move(move.san)
      const replies = result.moves({ verbose: true })
      return (
        replies.length > 0 &&
        replies.every((reply) => {
          const widensMoat =
            distanceFromKingMoat(reply.to, knightMoat) >
            knightMoat.startingBlackDistance
          if (widensMoat) return true
          const afterReply = getChess(result.fen())
          afterReply.move(reply.san)
          return (
            getBootNScootBlockMoves(
              afterReply.fen(),
              move.to,
              reply.to,
              getWhiteBishopSquares(afterReply.fen()),
            ).length > 0
          )
        })
      )
    })
    .map(({ move }) => move.san)
}

function getBootNScootPreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
  bishops: readonly Square[],
): readonly string[] {
  if (whiteKing === undefined || blackKing === undefined) return []
  const chess = getChess(fen)
  const legalMoves = chess.moves({ verbose: true })
  const preferred = new Set<string>()
  const oppositionMoat = getOppositionMoatGeometry(whiteKing, blackKing)

  if (oppositionMoat !== null) {
    const squeezeGeometries = getSqueezeGeometries(
      whiteKing,
      blackKing,
    )
    const preparedGeometries = squeezeGeometries
      .filter((geometry) =>
        isSqueezeGeometryOnNearerKingSide(
          whiteKing,
          blackKing,
          geometry,
        ),
      )
      .map((geometry) => ({
        geometry,
        secondaryControllers: bishops.filter(
          (bishop) =>
            squeezeProjection(bishop, geometry) ===
            geometry.secondaryIndex,
        ),
      }))
      .filter(
        ({ secondaryControllers }) => secondaryControllers.length > 0,
      )

    for (const move of legalMoves) {
      if (move.piece !== 'b') continue
      for (const { geometry, secondaryControllers } of preparedGeometries) {
        if (secondaryControllers.includes(move.from)) continue
        const controlsOtherPrimary = squeezeGeometries.some(
          (otherGeometry) =>
            otherGeometry !== geometry &&
            squeezeProjection(move.to, otherGeometry) ===
              otherGeometry.primaryIndex,
        )
        if (!controlsOtherPrimary) {
          continue
        }
        const result = getChess(fen)
        result.move(move.san)
        const resultBishops = getWhiteBishopSquares(result.fen())
        if (
          !secondaryControllers.some((controller) =>
            resultBishops.includes(controller),
          )
        ) {
          continue
        }
        const startingSecondaryDistance = Math.abs(
          squeezeProjection(blackKing, geometry) -
            geometry.secondaryIndex,
        )
        const replies = result.moves({ verbose: true })
        if (
          replies.length > 0 &&
          replies.every((reply) => {
            const widensMoat =
              distanceFromKingMoat(reply.to, oppositionMoat) >
              oppositionMoat.startingBlackDistance
            if (widensMoat) return true
            const movesTowardSecondary =
              Math.abs(
                squeezeProjection(reply.to, geometry) -
                  geometry.secondaryIndex,
              ) < startingSecondaryDistance
            if (!movesTowardSecondary) return false
            const afterReply = getChess(result.fen())
            afterReply.move(reply.san)
            return (
              getBootNScootScootMoves(
                afterReply.fen(),
                whiteKing,
                reply.to,
                getWhiteBishopSquares(afterReply.fen()),
              ).length > 0
            )
          })
        ) {
          preferred.add(move.san)
        }
      }
    }
  }

  if (isKnightMove(whiteKing, blackKing)) {
    const blockMoves = getBootNScootBlockMoves(
      fen,
      whiteKing,
      blackKing,
      bishops,
    )
    if (blockMoves.length > 0) {
      for (const san of blockMoves) preferred.add(san)
      return [...preferred]
    }

    const scootMoves = getBootNScootScootMoves(
      fen,
      whiteKing,
      blackKing,
      bishops,
    )
    if (scootMoves.length > 0) {
      for (const san of scootMoves) preferred.add(san)
      return [...preferred]
    }
  }

  return [...preferred]
}

function getRuleSKnightSqueezeGeometries(
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
  allowOffboardOppositeAnchor = false,
): readonly KnightSqueezeGeometry[] {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isKnightMove(whiteKing, blackKing)
  ) {
    return []
  }
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const fileDelta = white.file - black.file
  const rankDelta = white.rank - black.rank
  const longAxis = Math.abs(fileDelta) === 2 ? 'file' : 'rank'
  const longDirection = Math.sign(
    longAxis === 'file' ? fileDelta : rankDelta,
  ) as -1 | 1
  const oppositeFile =
    black.file - (longAxis === 'file' ? longDirection : 0)
  const oppositeRank =
    black.rank - (longAxis === 'rank' ? longDirection : 0)
  const oppositeSquare = squareFromCoordinates(oppositeFile, oppositeRank)
  if (!oppositeSquare && !allowOffboardOppositeAnchor) return []
  const opposite = oppositeSquare
    ? squareCoordinates(oppositeSquare)
    : { file: oppositeFile, rank: oppositeRank }
  return ([1, -1] as const).flatMap((direction) => {
    const parallelSquare = squareFromCoordinates(
      black.file + (longAxis === 'rank' ? direction : 0),
      black.rank + (longAxis === 'file' ? direction : 0),
    )
    if (!parallelSquare) return []
    const parallel = squareCoordinates(parallelSquare)
    const primaryDirectionFile = parallel.file - opposite.file
    const primaryDirectionRank = parallel.rank - opposite.rank
    const normalFile = primaryDirectionRank as -1 | 1
    const normalRank = -primaryDirectionFile as -1 | 1
    const primaryIndex =
      opposite.file * normalFile + opposite.rank * normalRank
    const tertiaryIndex =
      black.file * normalFile + black.rank * normalRank
    return [
      {
        normalFile,
        normalRank,
        primaryIndex,
        secondaryIndex: 2 * tertiaryIndex - primaryIndex,
        tertiaryIndex,
      },
    ]
  })
}

function getRuleSPreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
  bishops: readonly Square[],
): readonly string[] {
  const geometries = getRuleSKnightSqueezeGeometries(
    whiteKing,
    blackKing,
  )
  const moatGeometry = getRuleTGeometry(
    whiteKing,
    blackKing,
  )
  if (
    geometries.length === 0 ||
    !whiteKing ||
    !blackKing ||
    !moatGeometry
  ) {
    return []
  }
  const legalMoves = getChess(fen).moves({ verbose: true })
  const preparedGeometries = geometries
    .map((geometry) => ({
      geometry,
      primaryControllers: bishops.filter(
        (bishop) =>
          squeezeProjection(bishop, geometry) === geometry.primaryIndex,
      ),
    }))
    .filter(({ primaryControllers }) => primaryControllers.length > 0)
  if (preparedGeometries.length === 0) return []
  const tertiaryChecks = legalMoves
    .filter((move) => {
      if (move.piece !== 'b') return false
      const matchesPreparedGeometry = preparedGeometries.some(
        ({ geometry, primaryControllers }) =>
          !primaryControllers.includes(move.from) &&
          squeezeProjection(move.to, geometry) === geometry.tertiaryIndex,
      )
      if (!matchesPreparedGeometry) return false
      const result = getChess(fen)
      result.move(move.san)
      const replies = result.moves({ verbose: true })
      return (
        result.isCheck() &&
        !replies.some((reply) => reply.captured === 'b') &&
        forcesMoatOpposition(
          whiteKing,
          replies.map(({ to }) => to),
          moatGeometry,
        )
      )
    })
    .map(({ san }) => san)
  if (tertiaryChecks.length > 0) return tertiaryChecks
  return legalMoves
    .filter(
      (move) =>
        move.piece === 'k' &&
        isInOpposition(move.to, blackKing, 1) &&
        preparedGeometries.some(({ geometry }) => {
          const startingPrimaryDistance = Math.abs(
            squeezeProjection(whiteKing, geometry) -
              geometry.primaryIndex,
          )
          return (
            Math.abs(
              squeezeProjection(move.to, geometry) -
                geometry.primaryIndex,
            ) > startingPrimaryDistance
          )
        }),
    )
    .map(({ san }) => san)
}

function distanceToDirectedEdge(
  coordinate: number,
  direction: -1 | 1,
): number {
  return direction === -1 ? coordinate : 7 - coordinate
}

function isRuleRSideEdgeCloser(
  whiteKing: Square,
  blackKing: Square,
): boolean {
  if (!isKnightMove(whiteKing, blackKing)) return false
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const fileDelta = black.file - white.file
  const rankDelta = black.rank - white.rank
  const rearIsFile = Math.abs(fileDelta) === 2
  const rearCoordinate = rearIsFile ? black.file : black.rank
  const sideCoordinate = rearIsFile ? black.rank : black.file
  const rearDirection = Math.sign(
    rearIsFile ? fileDelta : rankDelta,
  ) as -1 | 1
  const sideDirection = Math.sign(
    rearIsFile ? rankDelta : fileDelta,
  ) as -1 | 1
  return (
    distanceToDirectedEdge(sideCoordinate, sideDirection) <
    distanceToDirectedEdge(rearCoordinate, rearDirection)
  )
}

function getRuleRPreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
  _bishops: readonly Square[],
): readonly string[] {
  if (whiteKing === undefined || blackKing === undefined) return []

  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      const result = getChess(fen)
      result.move(move.san)
      const resultFen = result.fen()
      const resultWhiteKing = findPiece(resultFen, 'w', 'k')?.square
      const resultBlackKing = findPiece(resultFen, 'b', 'k')?.square
      if (
        resultWhiteKing === undefined ||
        resultBlackKing === undefined ||
        !isRuleRSideEdgeCloser(resultWhiteKing, resultBlackKing)
      ) {
        return false
      }
      const resultBishops = getWhiteBishopSquares(result.fen())
      const preparedGeometries = getRuleSKnightSqueezeGeometries(
        resultWhiteKing,
        resultBlackKing,
      ).filter((geometry) =>
        resultBishops.some(
          (bishop) =>
            squeezeProjection(bishop, geometry) === geometry.primaryIndex,
        ),
      )
      const moat = getRuleTGeometry(resultWhiteKing, resultBlackKing)
      if (preparedGeometries.length === 0 || moat === null) return false
      return preparedGeometries.some((geometry) => {
        const secondaryIndex =
          2 * geometry.primaryIndex - geometry.tertiaryIndex
        return resultBishops.some(
          (primaryBishop, primaryBishopIndex) =>
            squeezeProjection(primaryBishop, geometry) ===
              geometry.primaryIndex &&
            resultBishops.some(
              (secondaryBishop, secondaryBishopIndex) =>
                secondaryBishopIndex !== primaryBishopIndex &&
                squeezeProjection(secondaryBishop, geometry) ===
                  secondaryIndex &&
                isSquareOnWhiteSideOfMoat(
                  secondaryBishop,
                  resultWhiteKing,
                  moat,
                ),
            ),
        )
      })
    })
    .map(({ san }) => san)
}

function squeezeDiagonalSquares(
  geometry: SqueezeGeometry,
  index: number,
): readonly Square[] {
  const squares: Square[] = []
  for (let file = 0; file < 8; file += 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const square = squareFromCoordinates(file, rank)
      if (square && squeezeProjection(square, geometry) === index) {
        squares.push(square)
      }
    }
  }
  return squares
}

function bishopCanMoveToControlSqueezeDiagonal(
  chess: ReturnType<typeof getChess>,
  bishop: Square,
  geometry: SqueezeGeometry,
  index: number,
  targetAllowed: (target: Square) => boolean = () => true,
  ignoredBlocker?: Square,
): boolean {
  return squeezeDiagonalSquares(geometry, index).some(
    (target) =>
      targetAllowed(target) &&
      !chess.get(target) &&
      bishopHasClearLineToSquareOnBoard(
        chess,
        bishop,
        target,
        ignoredBlocker,
      ),
  )
}

function getRuleUPreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): readonly string[] {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isKnightMove(whiteKing, blackKing)
  ) {
    return []
  }
  const moat = getRuleTGeometry(whiteKing, blackKing)
  if (moat === null) return []
  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (
        move.piece !== 'k' ||
        !isInOpposition(move.to, blackKing, 1)
      ) {
        return false
      }
      const result = getChess(fen)
      result.move(move.san)
      const bishops = getWhiteBishopSquares(result.fen())
      return getSqueezeGeometries(move.to, blackKing).some((geometry) => {
        const startingDistance = Math.abs(
          squeezeProjection(move.from, geometry) -
            geometry.secondaryIndex,
        )
        const resultDistance = Math.abs(
          squeezeProjection(move.to, geometry) -
            geometry.secondaryIndex,
        )
        if (resultDistance <= startingDistance) return false
        return bishops.some(
          (secondaryBishop, secondaryIndex) =>
            squeezeProjection(secondaryBishop, geometry) ===
              geometry.secondaryIndex &&
            isSquareOnWhiteSideOfMoat(
              secondaryBishop,
              whiteKing,
              moat,
            ) &&
            bishops.some(
              (primaryBishop, primaryIndex) =>
                primaryIndex !== secondaryIndex &&
                bishopCanMoveToControlSqueezeDiagonal(
                  result,
                  primaryBishop,
                  geometry,
                  geometry.primaryIndex,
                  (target) =>
                    isSquareOnWhiteSideOfMoat(
                      target,
                      whiteKing,
                      moat,
                    ),
                ),
            ),
        )
      })
    })
    .map(({ san }) => san)
}

function moatDistanceFromBlackSideEdge(
  blackKing: Square,
  geometry: RuleTGeometry,
): number {
  const black = squareCoordinates(blackKing)
  const coordinate =
    geometry.axis === 'file' ? black.file : black.rank
  const edge = coordinate < geometry.index ? 0 : 7
  return Math.abs(geometry.index - edge)
}

function getRuleUUPreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): readonly string[] {
  const startingGeometry = getRuleTGeometry(whiteKing, blackKing)
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    startingGeometry === null
  ) {
    return []
  }
  const startingEdgeDistance = moatDistanceFromBlackSideEdge(
    blackKing,
    startingGeometry,
  )

  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => {
      if (move.piece !== 'k') return false
      const resultGeometry = getRuleTGeometry(move.to, blackKing)
      return (
        resultGeometry !== null &&
        resultGeometry.axis !== startingGeometry.axis &&
        startingEdgeDistance -
          moatDistanceFromBlackSideEdge(blackKing, resultGeometry) >=
          2
      )
    })
    .map(({ san }) => san)
}

function getRuleVMatchingGeometriesBySan(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
  bishops: readonly Square[],
): ReadonlyMap<string, readonly SqueezeGeometry[]> {
  if (whiteKing === undefined || blackKing === undefined) {
    return new Map()
  }
  const legalMoves = getChess(fen).moves({ verbose: true })
  const squeezeGeometries = getSqueezeGeometries(whiteKing, blackKing)
  const primaryControlledGeometries = squeezeGeometries.filter((geometry) =>
    bishops.some(
      (bishop) =>
        squeezeProjection(bishop, geometry) === geometry.primaryIndex,
    ),
  )
  const secondaryControlledGeometries = squeezeGeometries.filter(
    (geometry) =>
      bishops.some(
        (bishop) =>
          squeezeProjection(bishop, geometry) ===
          geometry.secondaryIndex,
      ),
  )
  const matchingGeometriesBySan = new Map<
    string,
    readonly SqueezeGeometry[]
  >()
  for (const move of legalMoves) {
    const result = getChess(fen)
    result.move(move.san)
    const resultBishops = getWhiteBishopSquares(result.fen())
    const matchingGeometries =
      primaryControlledGeometries.length > 0
        ? primaryControlledGeometries.filter(
            (geometry) =>
              move.piece === 'b' &&
              result.isCheck() &&
              isSquareOnSqueezeSideOfBlackKing(
                move.to,
                whiteKing,
                blackKing,
                geometry,
              ) &&
              resultBishops.some(
                (primaryController) =>
                  primaryController !== move.to &&
                  squeezeProjection(primaryController, geometry) ===
                    geometry.primaryIndex,
              ),
          )
        : secondaryControlledGeometries.length > 0
          ? secondaryControlledGeometries.filter((geometry) =>
              bishopsControlMatchedSqueezeRoles(
                resultBishops,
                geometry,
                geometry.primaryIndex,
                geometry.secondaryIndex,
              ),
            )
          : squeezeGeometries.filter(
              (geometry) =>
                move.piece === 'b' &&
                squeezeProjection(move.to, geometry) ===
                  geometry.primaryIndex &&
                bishops.some(
                  (prospectiveSecondary) =>
                    prospectiveSecondary !== move.from &&
                    bishopCanMoveToControlSqueezeDiagonal(
                      result,
                      prospectiveSecondary,
                      geometry,
                      geometry.secondaryIndex,
                      () => true,
                      whiteKing,
                    ),
                ),
            )
    if (matchingGeometries.length > 0) {
      matchingGeometriesBySan.set(move.san, matchingGeometries)
    }
  }
  return matchingGeometriesBySan
}

function getSqueezePrimaryAnchor(
  whiteKing: Square,
  blackKing: Square,
  geometry: SqueezeGeometry,
): Square | null {
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const candidates =
    white.file === black.file
      ? [
          squareFromCoordinates(black.file - 1, black.rank),
          squareFromCoordinates(black.file + 1, black.rank),
        ]
      : [
          squareFromCoordinates(black.file, black.rank - 1),
          squareFromCoordinates(black.file, black.rank + 1),
        ]
  return (
    candidates.find(
      (square): square is Square =>
        square !== null &&
        squeezeProjection(square, geometry) === geometry.primaryIndex,
    ) ?? null
  )
}

function isSquareOnSqueezeSideOfBlackKing(
  square: Square,
  whiteKing: Square,
  blackKing: Square,
  geometry: SqueezeGeometry,
): boolean {
  const anchor = getSqueezePrimaryAnchor(
    whiteKing,
    blackKing,
    geometry,
  )
  if (anchor === null) return false
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const candidate = squareCoordinates(square)
  const squeeze = squareCoordinates(anchor)
  return white.file === black.file
    ? (candidate.file - black.file) * (squeeze.file - black.file) > 0
    : (candidate.rank - black.rank) * (squeeze.rank - black.rank) > 0
}

function squeezeGeometryEdgeDistance(
  whiteKing: Square,
  blackKing: Square,
  geometry: SqueezeGeometry,
): number {
  const anchor = getSqueezePrimaryAnchor(
    whiteKing,
    blackKing,
    geometry,
  )
  return anchor === null ? 0 : edgeDistance(anchor)
}

function flankDiagonalIndex(
  square: Square,
  axis: FlankDiagonalAxis,
): number {
  const { file, rank } = squareCoordinates(square)
  return axis === 'difference' ? file - rank : file + rank
}

function isFlankDiagonalOnBoard(diagonal: FlankDiagonal): boolean {
  return diagonal.axis === 'difference'
    ? diagonal.index >= -7 && diagonal.index <= 7
    : diagonal.index >= 0 && diagonal.index <= 14
}

function flankDiagonalIntersectsBlackFile(
  diagonal: FlankDiagonal,
  blackKing: Square,
): boolean {
  const black = squareCoordinates(blackKing)
  const rankAtBlackFile =
    diagonal.axis === 'difference'
      ? black.file - diagonal.index
      : diagonal.index - black.file
  return rankAtBlackFile >= 0 && rankAtBlackFile < 8
}

function flankDiagonalIntersectsBlackRank(
  diagonal: FlankDiagonal,
  blackKing: Square,
): boolean {
  const black = squareCoordinates(blackKing)
  const fileAtBlackRank =
    diagonal.axis === 'difference'
      ? black.rank + diagonal.index
      : diagonal.index - black.rank
  return fileAtBlackRank >= 0 && fileAtBlackRank < 8
}

function flankDiagonalIntersectsMoat(
  diagonal: FlankDiagonal,
  moat: RuleTGeometry,
): boolean {
  const otherCoordinate =
    moat.axis === 'file'
      ? diagonal.axis === 'difference'
        ? moat.index - diagonal.index
        : diagonal.index - moat.index
      : diagonal.axis === 'difference'
        ? moat.index + diagonal.index
        : diagonal.index - moat.index
  return otherCoordinate >= 0 && otherCoordinate < 8
}

function getRuleWFlankDiagonalPairs(
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): readonly FlankDiagonalPair[] {
  if (whiteKing === undefined || blackKing === undefined) {
    return []
  }
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const fileDelta = black.file - white.file
  const rankDelta = black.rank - white.rank
  const isTwoDiagonalSteps =
    Math.abs(fileDelta) === 2 && Math.abs(rankDelta) === 2
  const isKnightGeometry = isKnightMove(whiteKing, blackKing)
  if (!isKnightGeometry && !isTwoDiagonalSteps) {
    return []
  }
  const moat = isKnightGeometry
    ? getRuleTGeometry(whiteKing, blackKing)
    : null

  const axis: FlankDiagonalAxis =
    fileDelta * rankDelta > 0 ? 'difference' : 'sum'
  const whiteIndex = flankDiagonalIndex(whiteKing, axis)
  const blackIndex = flankDiagonalIndex(blackKing, axis)
  const makePair = (direction: -1 | 1): FlankDiagonalPair => [
    { axis, index: whiteIndex + direction },
    { axis, index: whiteIndex + 2 * direction },
  ]
  const pairs: readonly FlankDiagonalPair[] = isTwoDiagonalSteps
    ? [makePair(-1), makePair(1)]
    : [makePair(blackIndex > whiteIndex ? -1 : 1)]
  return pairs.filter((pair) =>
    pair.every(
      (diagonal) =>
        isFlankDiagonalOnBoard(diagonal) &&
        (isTwoDiagonalSteps
          ? flankDiagonalIntersectsBlackFile(diagonal, blackKing) &&
            flankDiagonalIntersectsBlackRank(diagonal, blackKing)
          : moat !== null && flankDiagonalIntersectsMoat(diagonal, moat)),
    ),
  )
}

const RULE_W_INCOMPLETE_PENALTY = 1

function getRuleWPenalty(
  bishops: readonly Square[],
  pairs: readonly FlankDiagonalPair[],
): number {
  if (pairs.length === 0) return 0
  return Math.min(
    ...pairs.map(
      (pair) =>
        2 -
        pair.filter((diagonal) =>
          bishops.some(
            (bishop) =>
              flankDiagonalIndex(bishop, diagonal.axis) === diagonal.index,
          ),
        ).length,
    ),
  )
}

function squeezeGeometryFlankAxis(
  geometry: SqueezeGeometry,
): FlankDiagonalAxis {
  return geometry.normalFile === geometry.normalRank ? 'sum' : 'difference'
}

function getRuleZ1PreferredMoves(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
  bishops: readonly Square[],
): readonly string[] {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isKnightMove(whiteKing, blackKing)
  ) {
    return []
  }
  const completedFlankAxes = new Set(
    getRuleWFlankDiagonalPairs(whiteKing, blackKing)
      .filter((pair) => getRuleWPenalty(bishops, [pair]) === 0)
      .map((pair) => pair[0].axis),
  )
  if (completedFlankAxes.size === 0) return []
  const matchingPrimaryGeometries = getRuleSKnightSqueezeGeometries(
    whiteKing,
    blackKing,
    true,
  ).filter((geometry) =>
    !completedFlankAxes.has(squeezeGeometryFlankAxis(geometry)),
  )
  return getChess(fen)
    .moves({ verbose: true })
    .filter(
      (move) =>
        move.piece === 'b' &&
        matchingPrimaryGeometries.some(
          (geometry) =>
            squeezeProjection(move.to, geometry) === geometry.primaryIndex,
        ),
    )
    .map(({ san }) => san)
}

function bishopOccupiesFlankDiagonal(
  bishops: readonly Square[],
  diagonal: FlankDiagonal,
): boolean {
  return bishops.some(
    (bishop) =>
      flankDiagonalIndex(bishop, diagonal.axis) === diagonal.index,
  )
}

function moveCanOccupyFlankDiagonal(
  fen: string,
  diagonal: FlankDiagonal,
): boolean {
  return getChess(fen).moves().some((san) => {
    const result = getChess(fen)
    result.move(san)
    return bishopOccupiesFlankDiagonal(
      getWhiteBishopSquares(result.fen()),
      diagonal,
    )
  })
}

function squaresShareDiagonal(first: Square, second: Square): boolean {
  const firstCoordinates = squareCoordinates(first)
  const secondCoordinates = squareCoordinates(second)
  return (
    Math.abs(firstCoordinates.file - secondCoordinates.file) ===
    Math.abs(firstCoordinates.rank - secondCoordinates.rank)
  )
}

function bishopMoveDiagonalSeparatesKings(
  from: Square,
  to: Square,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): boolean {
  if (whiteKing === undefined || blackKing === undefined) return false
  const start = squareCoordinates(from)
  const end = squareCoordinates(to)
  const fileDelta = end.file - start.file
  const rankDelta = end.rank - start.rank
  if (
    fileDelta === 0 ||
    Math.abs(fileDelta) !== Math.abs(rankDelta)
  ) {
    return false
  }
  const sideOfMoveDiagonal = (square: Square): number => {
    const point = squareCoordinates(square)
    return (
      fileDelta * (point.rank - start.rank) -
      rankDelta * (point.file - start.file)
    )
  }
  return (
    sideOfMoveDiagonal(whiteKing) * sideOfMoveDiagonal(blackKing) < 0
  )
}

function ruleWWWallPenalty(
  wallBishops: readonly [Square, Square],
): number {
  const [innerBishop, outerBishop] = wallBishops
  const outerEdgeDistance = edgeDistance(outerBishop)
  const onEdgePenalty = outerEdgeDistance === 0 ? 1 : 0
  const oneSquareFromEdgePenalty = outerEdgeDistance === 1 ? 0 : 1
  const adjacentBishopsPenalty =
    kingDistance(innerBishop, outerBishop) === 1 ? 0 : 1
  return (
    onEdgePenalty * 4 +
    oneSquareFromEdgePenalty * 2 +
    adjacentBishopsPenalty
  )
}

function getRuleYThreatenedBishops(
  fen: string,
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
  bishops: readonly Square[],
): readonly Square[] {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    bishops.length !== 2
  ) {
    return []
  }
  const blackMoves = getChess(withFenTurn(fen, 'b')).moves({
    verbose: true,
  })
  return bishops.filter(
    (bishop) =>
      kingDistance(whiteKing, bishop) > 1 &&
      blackMoves.some(
        (reply) => kingDistance(reply.to, bishop) <= 1,
      ),
  )
}

function createTwoBishopsWhitePositionContext(
  fen: string,
): TwoBishopsWhitePositionContext {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const startingWhiteKing = findPiece(fen, 'w', 'k')?.square
  const startingBishops = getWhiteBishopSquares(fen)
  const isPhaseTwo = isTwoBishopsPhaseTwoPosition(fen)
  const degenerateRepair = getDegenerateRepair(fen, isPhaseTwo)
  const matePatternTurnsBySan = getMatePatternTurnsBySan(
    fen,
    startingWhiteKing,
    blackKing,
  )
  const startingRuleWFlankDiagonalPairs = getRuleWFlankDiagonalPairs(
    startingWhiteKing,
    blackKing,
  )
  const ruleVMatchingGeometriesBySan = getRuleVMatchingGeometriesBySan(
    fen,
    startingWhiteKing,
    blackKing,
    startingBishops,
  )
  const ruleUPreferredMoves = getRuleUPreferredMoves(
    fen,
    startingWhiteKing,
    blackKing,
  )
  const ruleUUPreferredMoves = getRuleUUPreferredMoves(
    fen,
    startingWhiteKing,
    blackKing,
  )
  const prepareMatePreferredMoves = getTwoBishopsPhaseTwoPatternMoves(fen)
  const ruleAAEvaluation = evaluateRuleAADiagonalEscape(fen)
  const ruleAEvaluation = evaluateRuleACornerCage(fen)
  const ruleBEvaluation = evaluateRuleBScreenPosition(fen)
  const ruleNPreferredMoves = getRuleNPreferredMoves(fen)
  const ruleWYPreferredMoves = getRuleWYPreferredMoves(fen)
  const ruleWWApplies = getTwoBishopsWalls(fen).length > 0
  const ruleOWallAreasBySan = new Map<string, number>()
  const ruleWWPenaltiesBySan = new Map<string, number>()
  for (const move of getChess(fen).moves({ verbose: true })) {
    const result = getChess(fen)
    result.move(move.san)
    const resultWalls = getTwoBishopsWalls(result.fen()).filter(
      ({ areaSquares }) => areaSquares.length >= 4,
    )
    if (resultWalls.length === 0) continue
    const area = Math.min(...resultWalls.map(({ areaSquares }) => areaSquares.length))
    ruleOWallAreasBySan.set(move.san, area)
    const smallestWalls = resultWalls.filter(
      ({ areaSquares }) => areaSquares.length === area,
    )
    ruleWWPenaltiesBySan.set(
      move.san,
      Math.min(
        ...smallestWalls.map(({ wallBishops }) =>
          ruleWWWallPenalty(wallBishops),
        ),
      ),
    )
  }
  const ruleGPreferredMoves = getRuleGPreferredMoves(
    fen,
    startingWhiteKing,
    blackKing,
  )
  const onsidesPreferredMoves = getOnsidesPreferredMoves(
    fen,
    startingWhiteKing,
    blackKing,
  )
  const bootNScootPreferredMoves = getBootNScootPreferredMoves(
    fen,
    startingWhiteKing,
    blackKing,
    startingBishops,
  )
  const ruleRPreferredMoves = getRuleRPreferredMoves(
    fen,
    startingWhiteKing,
    blackKing,
    startingBishops,
  )
  const bootNScootReplyCounts = bootNScootPreferredMoves.map((san) => {
    const result = getChess(fen)
    const move = result.move(san)
    return move.piece === 'b' ? result.moves().length : 0
  })
  const bootNScootBestReplyCount = Math.min(...bootNScootReplyCounts)
  const bootNScootUniqueBest =
    bootNScootReplyCounts.filter(
      (replyCount) => replyCount === bootNScootBestReplyCount,
    ).length === 1
  const startingRuleWCompletedPairs =
    startingRuleWFlankDiagonalPairs.filter(
      (pair) => getRuleWPenalty(startingBishops, [pair]) === 0,
    )
  const whiteKingCoordinates =
    startingWhiteKing === undefined
      ? undefined
      : squareCoordinates(startingWhiteKing)
  const blackKingCoordinates =
    blackKing === undefined ? undefined : squareCoordinates(blackKing)
  const ruleZ2CompletedPairs =
    whiteKingCoordinates !== undefined &&
    blackKingCoordinates !== undefined &&
    Math.abs(whiteKingCoordinates.file - blackKingCoordinates.file) === 2 &&
    Math.abs(whiteKingCoordinates.rank - blackKingCoordinates.rank) === 2
      ? startingRuleWCompletedPairs
      : []
  const ruleWCompletedPair = startingRuleWCompletedPairs.length > 0
  const ruleWUrgentDiagonal =
    !ruleWCompletedPair &&
    ruleUPreferredMoves.length === 0 &&
    startingWhiteKing !== undefined &&
    blackKing !== undefined &&
    isKnightMove(startingWhiteKing, blackKing)
      ? startingRuleWFlankDiagonalPairs[0]?.[0]
      : undefined
  const ruleWUrgentSetup =
    ruleWUrgentDiagonal !== undefined &&
    moveCanOccupyFlankDiagonal(fen, ruleWUrgentDiagonal)
  const ruleWPenaltiesBySan = new Map(
    getChess(fen).moves({ verbose: true }).map((move) => {
      const result = getChess(fen)
      result.move(move.san)
      const resultWhiteKing =
        move.piece === 'k' ? move.to : startingWhiteKing
      const pairs = getRuleWFlankDiagonalPairs(
        resultWhiteKing,
        blackKing,
      )
      const preservesCompletedStartingPair =
        move.piece === 'k' &&
        startingRuleWCompletedPairs.some(
          (pair) =>
            getRuleWPenalty(getWhiteBishopSquares(result.fen()), [pair]) === 0,
        )
      return [
        move.san,
        preservesCompletedStartingPair ||
        (pairs.length > 0 &&
          getRuleWPenalty(getWhiteBishopSquares(result.fen()), pairs) === 0)
          ? 0
          : RULE_W_INCOMPLETE_PENALTY,
      ] as const
    }),
  )
  const ruleZ1PreferredMoves = getRuleZ1PreferredMoves(
    fen,
    startingWhiteKing,
    blackKing,
    startingBishops,
  )
  const ruleYThreatenedBishops = getRuleYThreatenedBishops(
    fen,
    startingWhiteKing,
    blackKing,
    startingBishops,
  )
  return {
    blackKing,
    startingWhiteKing,
    startingBishops,
    isPhaseTwo,
    degenerateRepair,
    mateInThreeApplies: matePatternTurnsBySan.size > 0,
    matePatternTurnsBySan,
    shepherdMoves:
      isPhaseTwo
        ? getShepherdMoves(
            fen,
            blackKing,
            startingWhiteKing,
            startingBishops,
          )
        : [],
    prepareMatePreferredMoves,
    ruleAAApplies: ruleAAEvaluation.applies,
    ruleAAPenaltiesBySan: ruleAAEvaluation.penaltiesBySan,
    ruleAApplies: ruleAEvaluation.applies,
    ruleAPenaltiesBySan: ruleAEvaluation.penaltiesBySan,
    ruleBApplies: ruleBEvaluation.applies,
    ruleBPenaltiesBySan: ruleBEvaluation.penaltiesBySan,
    ruleNPreferredMoves,
    ruleOApplies: ruleOWallAreasBySan.size > 0,
    ruleOWallAreasBySan,
    ruleWWApplies,
    ruleWWPenaltiesBySan,
    ruleGPreferredMoves,
    onsidesPreferredMoves,
    bootNScootPreferredMoves,
    bootNScootUniqueBest,
    ruleRPreferredMoves,
    ruleSPreferredMoves: getRuleSPreferredMoves(
      fen,
      startingWhiteKing,
      blackKing,
      startingBishops,
    ),
    ruleTGeometry: getRuleTGeometry(
      startingWhiteKing,
      blackKing,
    ),
    ruleUUPreferredMoves,
    ruleUPreferredMoves,
    ruleVMatchingGeometriesBySan,
    ruleWYPreferredMoves,
    ruleWApplies:
      startingRuleWFlankDiagonalPairs.length > 0 &&
      (ruleWUrgentSetup ||
        [...ruleWPenaltiesBySan.values()].some((penalty) => penalty === 0)),
    ruleWUrgentSetup,
    ruleWUrgentDiagonal,
    ruleWPenaltiesBySan,
    ruleYThreatenedBishops,
    deathBoxPreferredMoves: getDeathBoxPreferredMoves(fen),
    preserveExistingMegadethBox: isMegadethBoxPosition(fen),
    megadethBoxPreferredMoves: getMegadethBoxPreferredMoves(fen),
    ruleZ1PreferredMoves,
    ruleZ2CompletedPairs,
    kingStutterPreferredMoves: getKingStutterPreferredMoves(fen),
  }
}

export function scoreTwoBishopsWhiteMove(
  fen: string,
  san: string,
): TwoBishopsWhiteMoveScore {
  return scoreTwoBishopsWhiteMoveWithContext(
    fen,
    san,
    createTwoBishopsWhitePositionContext(fen),
  )
}

function scoreTwoBishopsWhiteMoveWithContext(
  fen: string,
  san: string,
  context: TwoBishopsWhitePositionContext,
): TwoBishopsWhiteMoveScore {
  const {
    blackKing,
    startingWhiteKing,
    isPhaseTwo,
    degenerateRepair,
    mateInThreeApplies,
    matePatternTurnsBySan,
    shepherdMoves,
    prepareMatePreferredMoves,
    ruleAAApplies,
    ruleAAPenaltiesBySan,
    ruleAApplies,
    ruleAPenaltiesBySan,
    ruleBApplies,
    ruleBPenaltiesBySan,
    ruleNPreferredMoves,
    ruleOApplies,
    ruleOWallAreasBySan,
    ruleWWApplies,
    ruleWWPenaltiesBySan,
    ruleGPreferredMoves,
    onsidesPreferredMoves,
    bootNScootPreferredMoves,
    bootNScootUniqueBest,
    ruleRPreferredMoves,
    ruleSPreferredMoves,
    ruleTGeometry,
    ruleUUPreferredMoves,
    ruleUPreferredMoves,
    ruleVMatchingGeometriesBySan,
    ruleWYPreferredMoves,
    ruleYThreatenedBishops,
    deathBoxPreferredMoves,
    preserveExistingMegadethBox,
    megadethBoxPreferredMoves,
    ruleZ1PreferredMoves,
    ruleZ2CompletedPairs,
    kingStutterPreferredMoves,
  } = context
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const resultBishops = getWhiteBishopSquares(resultFen)
  const resultWhiteKingSquare =
    move.piece === 'k' ? move.to : startingWhiteKing
  const sequesterTwoAwaySquares = getSequesterTwoAwaySquares(blackKing)
  const resultKingDistance =
    blackKing && resultWhiteKingSquare
      ? squaredEuclideanDistance(resultWhiteKingSquare, blackKing)
      : 99
  const mate = chess.isCheckmate()
  const blackMoves = chess.moves({ verbose: true })
  const bishopCanBeCaptured = blackMoves.some(
    (reply) => reply.captured === 'b',
  )
  const blackReplyKings = blackMoves
    .map((reply) => {
      const replyChess = getChess(resultFen)
      replyChess.move(reply.san)
      return findPiece(replyChess.fen(), 'b', 'k')?.square
    })
    .filter((square): square is Square => square !== undefined)
  const targetSelection = isPhaseTwo
      ? getResultTargetCornerSelection(
          fen,
          blackKing,
          resultWhiteKingSquare,
          resultBishops,
        )
    : { corners: [], score: 0, cornerDiagonalsTarget: false }
  const targetCorners = targetSelection.corners
  const phaseTwoWalls =
    isPhaseTwo && blackKing
      ? targetCorners.flatMap((corner) =>
          getPhaseTwoWalls(blackKing, corner),
        )
      : []
  const resultHasPhaseTwoWall =
    blackKing !== undefined &&
    resultWhiteKingSquare !== undefined &&
    bishopsHaveValidPhaseTwoWall(
      resultFen,
      resultBishops,
      phaseTwoWalls,
      resultWhiteKingSquare,
    )
  const currentCornerDistance =
    blackKing === undefined || targetCorners.length === 0
      ? 99
      : Math.min(
          ...targetCorners.map((corner) =>
            manhattanDistance(blackKing, corner),
          ),
        )
  const maximumCornerReplyDistance =
    blackReplyKings.length === 0 || targetCorners.length === 0
      ? 99
      : Math.min(
          ...targetCorners.map((corner) =>
            Math.max(
              ...blackReplyKings.map((square) =>
                manhattanDistance(square, corner),
              ),
            ),
          ),
        )
  const bishopsOnBlackEdgeCount =
    blackKing === undefined
      ? 0
      : resultBishops.filter((bishop) =>
          isOnBlackKingsEdge(bishop, blackKing),
        ).length
  const ruleTForces =
    ruleTGeometry !== null &&
    move.piece === 'b' &&
    resultWhiteKingSquare !== undefined &&
    blackKing !== undefined &&
    isSquareOnWhiteSideOfMoat(
      move.from,
      resultWhiteKingSquare,
      ruleTGeometry,
    ) &&
    forcesMoatOpposition(
      resultWhiteKingSquare,
      blackReplyKings,
      ruleTGeometry,
    )
  const moveFrom = squareCoordinates(move.from)
  const moveTo = squareCoordinates(move.to)
  const isDiagonalWhiteKingMove =
    move.piece === 'k' &&
    Math.abs(moveTo.file - moveFrom.file) === 1 &&
    Math.abs(moveTo.rank - moveFrom.rank) === 1
  const matchingRuleVGeometries =
    ruleVMatchingGeometriesBySan.get(move.san) ?? []
  const ruleYTargetBishop =
    move.piece === 'b'
      ? ruleYThreatenedBishops.find(
          (bishop) => bishop !== move.from,
        )
      : undefined
  const ruleYPreventsAttack =
    ruleYTargetBishop !== undefined &&
    blackMoves.every(
      (reply) => kingDistance(reply.to, ruleYTargetBishop) > 1,
    )
  const ruleYMovedBishopStaysSafe =
    move.piece === 'b' &&
    blackMoves.every((reply) => kingDistance(reply.to, move.to) > 1)
  const resultMoats =
    resultWhiteKingSquare === undefined || blackKing === undefined
      ? []
      : getBishopDistanceMoatGeometries(
          resultWhiteKingSquare,
          blackKing,
        )
  const ruleZCornerApplies =
    blackKing !== undefined && BOARD_CORNERS.includes(blackKing)
  const ruleZFollowupTarget =
    startingWhiteKing === undefined || blackKing === undefined
      ? null
      : getRuleZFollowupTarget(startingWhiteKing, blackKing)
  return {
    isPhaseTwoPosition: isPhaseTwo,
    matePenalty: mate ? 0 : 1,
    bishopSafetyPenalty: bishopCanBeCaptured ? 1 : 0,
    stalematePenalty: !mate && chess.isStalemate() ? 1 : 0,
    prepareMateApplies: prepareMatePreferredMoves.length > 0,
    prepareMatePenalty: prepareMatePreferredMoves.includes(move.san)
      ? 0
      : 1,
    ruleAAApplies,
    ruleAAPenalty: ruleAAPenaltiesBySan.get(move.san) ?? 999,
    ruleAApplies,
    ruleAPenalty: ruleAPenaltiesBySan.get(move.san) ?? 999,
    ruleBApplies,
    ruleBPenalty: ruleBPenaltiesBySan.get(move.san) ?? 999,
    ruleNApplies: ruleNPreferredMoves.length > 0,
    ruleNPenalty: ruleNPreferredMoves.includes(move.san) ? 0 : 1,
    ruleOApplies,
    ruleOPenalty: ruleOWallAreasBySan.get(move.san) ?? 65,
    ruleWWApplies,
    ruleWWPenalty: ruleWWPenaltiesBySan.get(move.san) ?? 1,
    ruleGApplies: ruleGPreferredMoves.length > 0,
    ruleGPenalty: ruleGPreferredMoves.includes(move.san) ? 0 : 1,
    centralPiecesPenalty: [resultWhiteKingSquare, ...resultBishops].filter(
      (square) =>
        square === undefined || !isTwoBishopsCentralPieceSquare(square),
    ).length,
    edgeFlankApplies:
      blackKing !== undefined &&
      startingWhiteKing !== undefined &&
      edgeDistance(blackKing) === 0 &&
      !BOARD_CORNERS.includes(blackKing) &&
      isKnightMove(startingWhiteKing, blackKing),
    edgeFlankPenalty:
      blackKing !== undefined &&
      resultWhiteKingSquare !== undefined &&
      isKnightMove(resultWhiteKingSquare, blackKing) &&
      isDiagonalWhiteKingMove &&
      getTwoBishopsEdgeFlankSquares(blackKing).includes(
        resultWhiteKingSquare,
      )
        ? 0
          : 1,
    onsidesApplies: onsidesPreferredMoves.length > 0,
    onsidesPenalty: onsidesPreferredMoves.includes(move.san) ? 0 : 1,
    bootNScootApplies: bootNScootPreferredMoves.length > 0,
    bootNScootPenalty: bootNScootPreferredMoves.includes(move.san) ? 0 : 1,
    bootNScootReplyCount:
      bootNScootPreferredMoves.includes(move.san) && move.piece === 'b'
        ? blackMoves.length
        : 0,
    bootNScootUniqueBest,
    degenerateApplies: degenerateRepair !== null,
    degeneratePenalty:
      degenerateRepair !== null &&
      (degenerateRepair.allowedSans?.includes(move.san) ??
        (move.from === degenerateRepair.from &&
          (degenerateRepair.allowedTargets?.includes(move.to) ??
            (degenerateRepair.to === undefined ||
              move.to === degenerateRepair.to))))
        ? 0
        : 1,
    degenerateTerminal: degenerateRepair?.stopAfterRepair === true,
    mateInThreeApplies,
    mateInThreeTurns:
      mateInThreeApplies &&
      !bishopCanBeCaptured &&
      !chess.isStalemate()
        ? (matePatternTurnsBySan.get(move.san) ?? 99)
        : 99,
    phaseTwoWallApplies: phaseTwoWalls.length > 0,
    phaseTwoWallPenalty: resultHasPhaseTwoWall ? 0 : 1,
    shepherdApplies: shepherdMoves.length > 0,
    shepherdPenalty: shepherdMoves.includes(move.san) ? 0 : 1,
    sequesterApplies: isPhaseTwo,
    sequesterHasTargetCorner: targetCorners.length > 0,
    sequesterCornerDiagonalsTarget:
      targetSelection.cornerDiagonalsTarget,
    sequesterTargetCornerScore:
      move.piece === 'k' &&
      blackKing !== undefined &&
      resultWhiteKingSquare !== undefined &&
      isInOpposition(resultWhiteKingSquare, blackKing, 1)
        ? 0
        : targetSelection.score,
    sequesterCurrentCornerDistance: currentCornerDistance,
    sequesterMaximumCornerReplyDistance: maximumCornerReplyDistance,
    sequesterTwoAwayControlPenalty:
      sequesterTwoAwaySquares.length === 0 ||
      sequesterTwoAwaySquares.some((twoAwaySquare) =>
        resultBishops.some(
          (bishop) =>
            bishop === twoAwaySquare ||
            bishopHasClearLineToSquare(resultFen, bishop, twoAwaySquare),
        ),
      )
        ? 0
        : 1,
    sequesterIsBishopMove: move.piece === 'b',
    bishopsOnBlackEdgeCount,
    forcePhaseTwoApplies: true,
    forcePhaseTwoPenalty:
      resultWhiteKingSquare !== undefined &&
      blackReplyKings.length > 0 &&
      blackReplyKings.every(
        (square) =>
          edgeDistance(square) === 0 &&
          areKingsAtPhaseTwoDistance(resultWhiteKingSquare, square),
      )
        ? 0
        : 1,
    ruleRApplies: ruleRPreferredMoves.length > 0,
    ruleRPenalty: ruleRPreferredMoves.includes(move.san) ? 0 : 1,
    ruleSApplies: ruleSPreferredMoves.length > 0,
    ruleSPenalty: ruleSPreferredMoves.includes(move.san) ? 0 : 1,
    ruleTApplies: ruleTGeometry !== null,
    ruleTPenalty: ruleTForces ? 0 : 1,
    ruleTReplyCount: ruleTForces ? blackMoves.length : 99,
    ruleUUApplies: ruleUUPreferredMoves.length > 0,
    ruleUUPenalty: ruleUUPreferredMoves.includes(move.san) ? 0 : 1,
    ruleUApplies: ruleUPreferredMoves.length > 0,
    ruleUPenalty: ruleUPreferredMoves.includes(move.san) ? 0 : 1,
    ruleVApplies: ruleVMatchingGeometriesBySan.size > 0,
    ruleVPenalty: matchingRuleVGeometries.length > 0 ? 0 : 1,
    ruleVSqueezeEdgeDistance:
      startingWhiteKing === undefined || blackKing === undefined
        ? 0
        : Math.max(
            0,
            ...matchingRuleVGeometries.map((geometry) =>
              squeezeGeometryEdgeDistance(
                startingWhiteKing,
                blackKing,
                geometry,
              ),
            ),
          ),
    ruleWYApplies: ruleWYPreferredMoves.length > 0,
    ruleWYPenalty: ruleWYPreferredMoves.includes(move.san) ? 0 : 1,
    ruleWApplies: blackKing !== undefined,
    ruleWUrgentPenalty: 0,
    ruleWPenalty: 2 - countDistantTwoBishops(resultFen),
    ruleYApplies: ruleYThreatenedBishops.length > 0,
    ruleYPenalty:
      ruleYPreventsAttack &&
      ruleYMovedBishopStaysSafe &&
      move.piece === 'b' &&
      bishopMoveDiagonalSeparatesKings(
        move.from,
        move.to,
        startingWhiteKing,
        blackKing,
      )
        ? 0
        : 1,
    ruleZApplies: ruleZCornerApplies || ruleZFollowupTarget !== null,
    ruleZPenalty:
      ruleZCornerApplies
        ? blackKing !== undefined &&
          resultWhiteKingSquare !== undefined &&
          isKnightMove(resultWhiteKingSquare, blackKing)
          ? 0
          : 1
        : ruleZFollowupTarget !== null &&
            move.piece === 'b' &&
            resultBishops.some((bishop) =>
              bishopHasClearLineToSquare(
                resultFen,
                bishop,
                ruleZFollowupTarget,
              ),
            )
          ? 0
          : 1,
    ruleZZPenalty:
      preserveExistingMegadethBox ||
      resultWhiteKingSquare === undefined ||
      blackKing === undefined
        ? 0
        : resultBishops.filter(
            (bishop) =>
              kingDistance(resultWhiteKingSquare, bishop) +
                kingDistance(bishop, blackKing) ===
              kingDistance(resultWhiteKingSquare, blackKing),
          ).length,
    deathBoxApplies: deathBoxPreferredMoves.length > 0,
    deathBoxPenalty: deathBoxPreferredMoves.includes(move.san) ? 0 : 1,
    megadethBoxApplies: megadethBoxPreferredMoves.length > 0,
    megadethBoxPenalty: megadethBoxPreferredMoves.includes(move.san)
      ? 0
      : 1,
    ruleZ1Applies: ruleZ1PreferredMoves.length > 0,
    ruleZ1Penalty: ruleZ1PreferredMoves.includes(move.san) ? 0 : 1,
    ruleZ2Applies: ruleZ2CompletedPairs.length > 0,
    ruleZ2Penalty:
      move.piece === 'b' &&
      ruleZ2CompletedPairs.some(
        (pair) => getRuleWPenalty(resultBishops, [pair]) === 0,
      )
        ? 0
        : 1,
    kingStutterApplies: kingStutterPreferredMoves.length > 0,
    kingStutterPenalty: kingStutterPreferredMoves.includes(move.san)
      ? 0
      : 1,
    kingCloserPhaseTwoLinePenalty:
      !isPhaseTwo ||
      blackKing === undefined ||
      edgeDistance(blackKing) !== 0
        ? 0
        : resultWhiteKingSquare !== undefined &&
            isOnPhaseTwoKingLine(resultWhiteKingSquare, blackKing)
          ? 0
          : 1,
    kingCloserDistance: resultKingDistance,
    kingCloserMiddleSixteenDistance:
      resultWhiteKingSquare
        ? distanceToMiddleSixteen(resultWhiteKingSquare)
        : 0,
    centralKingPenalty:
      resultWhiteKingSquare !== undefined &&
      isTwoBishopsCentralPieceSquare(resultWhiteKingSquare)
        ? 0
        : 1,
    unscreenBishopsCount:
      resultWhiteKingSquare === undefined
        ? 0
        : resultBishops.filter((bishop) =>
            squaresShareDiagonal(bishop, resultWhiteKingSquare),
          ).length,
    unclutteredBishopsApplies:
      blackKing !== undefined && BOARD_CORNERS.includes(blackKing),
    unclutteredBishopsPenalty:
      blackKing === undefined || !BOARD_CORNERS.includes(blackKing)
        ? 0
        : resultBishops.filter((bishop) => isKnightMove(bishop, blackKing))
            .length,
    bishopDistance:
      blackKing === undefined ||
      resultWhiteKingSquare === undefined
        ? 0
        : (resultMoats.length === 0 ||
            (!hasTwoBishopsBehindBlackRegion(
              resultWhiteKingSquare,
              blackKing,
            ) &&
              !hasTiedNonzeroKingDifferentials(
                resultWhiteKingSquare,
                blackKing,
              ))
            ? resultBishops
            : resultBishops.filter((bishop) =>
                resultMoats.some((moat) =>
                  isSquareOnWhiteSideOfMoat(
                    bishop,
                    resultWhiteKingSquare,
                    moat,
                  ),
                ),
              ))
            .reduce(
            (total, bishop) =>
              total + Math.sqrt(squaredEuclideanDistance(bishop, blackKing)),
            0,
          ),
    checkPenalty: chess.isCheck() ? 0 : 1,
    clutteredBishopsCount: resultBishops.filter(
      (bishop) =>
        Math.min(
          ...BOARD_CORNERS.map((corner) => kingDistance(bishop, corner)),
        ) <= 2,
    ).length,
  }
}

function distanceToMiddleSixteen(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  const fileDistance = file < 2 ? 2 - file : file > 5 ? file - 5 : 0
  const rankDistance = rank < 2 ? 2 - rank : rank > 5 ? rank - 5 : 0
  return fileDistance + rankDistance
}

export function isTwoBishopsCentralPieceSquare(square: Square): boolean {
  const { file, rank } = squareCoordinates(square)
  const insideMiddleSix =
    file >= 1 && file <= 6 && rank >= 1 && rank <= 6
  const isBoxCorner =
    (file === 1 || file === 6) && (rank === 1 || rank === 6)
  return insideMiddleSix && !isBoxCorner
}

export function getTwoBishopsEdgeFlankSquares(
  blackKing: Square,
): readonly Square[] {
  const { file, rank } = squareCoordinates(blackKing)
  const targets = new Set<Square>()
  const addTarget = (targetFile: number, targetRank: number) => {
    const square = squareFromCoordinates(targetFile, targetRank)
    if (square !== null) targets.add(square)
  }

  if (file === 0 || file === 7) {
    const inwardFile = file === 0 ? 2 : 5
    addTarget(inwardFile, rank - 1)
    addTarget(inwardFile, rank + 1)
  }
  if (rank === 0 || rank === 7) {
    const inwardRank = rank === 0 ? 2 : 5
    addTarget(file - 1, inwardRank)
    addTarget(file + 1, inwardRank)
  }

  return [...targets]
}

function isInOpposition(
  bishop: Square,
  blackKing: Square,
  squaresBetween: number,
): boolean {
  const bishopCoordinates = squareCoordinates(bishop)
  const blackKingCoordinates = squareCoordinates(blackKing)
  const fileDistance = Math.abs(
    bishopCoordinates.file - blackKingCoordinates.file,
  )
  const rankDistance = Math.abs(
    bishopCoordinates.rank - blackKingCoordinates.rank,
  )
  const distance = squaresBetween + 1
  return (
    (fileDistance === 0 && rankDistance === distance) ||
    (rankDistance === 0 && fileDistance === distance)
  )
}

const twoBishopsWhiteRuleCatalog: readonly OrderedRule<TwoBishopsWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    helpText: '',
    stopWhenBest: (score) => score.matePenalty === 0,
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'bishops safe',
    shortLabel: 'pieces safe',
    helpText: '',
    compare: (first, second) =>
      first.bishopSafetyPenalty - second.bishopSafetyPenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    helpText: '',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'mate in 8 ish',
    shortLabel: 'mate in 8 ish',
    helpText: 'In phase 2 (see diagram).',
    applies: (score) => score.prepareMateApplies,
    stopWhenBest: (score) => score.prepareMatePenalty === 0,
    compare: (first, second) =>
      first.prepareMatePenalty - second.prepareMatePenalty,
  },
  {
    id: 'rule aa',
    shortLabel: 'rule aa',
    helpText:
      "With the Black king one edge move from the corner, White king on edge a knight's move away, Bishop controls Black king's diagonal escape square, control the diagonal adjacent to Black's king directed away from White's king.",
    applies: (score) => score.ruleAAApplies,
    stopWhenBest: (score) => score.ruleAAPenalty === 0,
    compare: (first, second) => first.ruleAAPenalty - second.ruleAAPenalty,
  },
  {
    id: 'rule a',
    shortLabel: 'rule a',
    helpText:
      "With Black's king in the 2 corner edge squares, place the White king a knight's move from that corner. Then, place a bishop on the corner cage diagonal. Then, play an unattackable bishop waiting move if necessary, until mate in 2.",
    applies: (score) => score.ruleAApplies,
    stopWhenBest: (score) => score.ruleAPenalty === 0,
    compare: (first, second) => first.ruleAPenalty - second.ruleAPenalty,
  },
  {
    id: 'rule b',
    shortLabel: 'rule b',
    helpText:
      'In the screen position, move the king to 2 edge squares from the corner.',
    applies: (score) => score.ruleBApplies,
    stopWhenBest: (score) => score.ruleBPenalty === 0,
    compare: (first, second) => first.ruleBPenalty - second.ruleBPenalty,
  },
  {
    id: 'rule n',
    shortLabel: 'rule n',
    helpText:
      "With a bishop wall and White's king controlling the escape square, shrink and check along the bishop wall, from at least 3 squares from the corner.",
    applies: (score) => score.ruleNApplies,
    compare: (first, second) => first.ruleNPenalty - second.ruleNPenalty,
  },
  {
    id: 'rule o',
    shortLabel: 'rule o',
    helpText:
      "Prefer a bishop wall keeping Black's king in a smaller area of at least 4 squares.",
    applies: (score) => score.ruleOApplies,
    compare: (first, second) => first.ruleOPenalty - second.ruleOPenalty,
  },
  {
    id: 'rule g',
    shortLabel: 'rule g',
    helpText:
      "Of bishops on Black's side of all king moats, take the one furthest from White and move it furthest from the king moat on White's side and not closer to black in either axis.",
    applies: (score) => score.ruleGApplies,
    compare: (first, second) => first.ruleGPenalty - second.ruleGPenalty,
  },
  {
    id: 'edge flank',
    shortLabel: 'edge flank',
    helpText:
      'When the black king is on the edge, but not in the corner, flank diagonally.',
    applies: (score) => score.edgeFlankApplies,
    compare: (first, second) =>
      first.edgeFlankPenalty - second.edgeFlankPenalty,
  },
  {
    id: 'central king',
    shortLabel: 'central king',
    helpText: "Prefer the king in the middle 32 squares.",
    compare: (first, second) =>
      first.centralKingPenalty - second.centralKingPenalty,
  },
  {
    id: 'rule uu',
    shortLabel: 'rule uu',
    helpText:
      "If the kings are a knight's move apart, flank if the swap reduces the moat's distance from the edge on Black's side by at least 2.",
    applies: (score) => score.ruleUUApplies,
    compare: (first, second) =>
      first.ruleUUPenalty - second.ruleUUPenalty,
  },
  {
    id: 'onsides',
    shortLabel: 'onsides',
    helpText:
      "Move a bishop behind Black's king as close as possible to the square behind White's king from Black's king's perspective unless it can be attacked at that destination on the next move.",
    applies: (score) => score.onsidesApplies,
    compare: (first, second) =>
      first.onsidesPenalty - second.onsidesPenalty,
  },
  {
    id: 'boot scoot n block',
    shortLabel: 'boot scoot n block',
    helpText:
      "When the kings are in opposition and a bishop controls the secondary squeeze diagonal on the side closer to the kings, use a bishop boot to control the other primary squeeze diagonal. Then scoot to opposition on the next position. Finally, block the king's escape. (See gif)",
    applies: (score) => score.bootNScootApplies,
    compare: (first, second) =>
      first.bootNScootPenalty - second.bootNScootPenalty ||
      first.bootNScootReplyCount - second.bootNScootReplyCount,
    stopWhenBest: (score) =>
      score.bootNScootUniqueBest && score.bootNScootPenalty === 0,
  },
  {
    id: 'rule r',
    shortLabel: 'rule r',
    helpText:
      "Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. If the black king is closer to the side edge than the rear edge, control the secondary squeeze diagonal without placing a bishop offsides.",
    applies: (score) => score.ruleRApplies,
    compare: (first, second) =>
      first.ruleRPenalty - second.ruleRPenalty ||
      (first.ruleRPenalty === 0 && second.ruleRPenalty === 0
        ? first.kingCloserMiddleSixteenDistance -
            second.kingCloserMiddleSixteenDistance ||
          first.kingCloserDistance - second.kingCloserDistance ||
          second.bishopDistance - first.bishopDistance
        : 0),
    stopWhenBest: (score) => score.ruleRPenalty === 0,
  },
  {
    id: 'rule s',
    shortLabel: 'rule s',
    helpText:
      "Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal to force moat opposition or otherwise take opposition, stepping away from the primary squeeze diagonal.",
    applies: (score) => score.ruleSApplies,
    compare: (first, second) => first.ruleSPenalty - second.ruleSPenalty,
  },
  {
    id: 'rule t',
    shortLabel: 'rule t',
    helpText:
      "When the kings are a knight's move apart, use a bishop from behind the moat to force the Black king to take moat opposition.",
    applies: (score) => score.ruleTApplies,
    compare: (first, second) =>
      first.ruleTPenalty - second.ruleTPenalty ||
      first.ruleTReplyCount - second.ruleTReplyCount,
    stopWhenBest: (score) =>
      score.isPhaseTwoPosition && score.ruleTPenalty === 0,
  },
  {
    id: 'rule u',
    shortLabel: 'rule u',
    helpText:
      "When the kings are a knight's move apart, a bishop controls the secondary squeeze diagonal from the white side of the moat, and a bishop can move to control the primary squeeze diagonal from the white side of the moat, take opposition away from the squeeze diagonal.",
    applies: (score) => score.ruleUApplies,
    compare: (first, second) => first.ruleUPenalty - second.ruleUPenalty,
  },
  {
    id: 'rule v',
    shortLabel: 'rule v',
    helpText:
      'When the kings are in opposition and a bishop can control or x-ray the secondary squeeze diagonal in one move, control the primary squeeze diagonal. If a bishop already controls the primary squeeze diagonal, check from squeeze side.',
    applies: (score) => score.ruleVApplies,
    compare: (first, second) =>
      first.ruleVPenalty - second.ruleVPenalty ||
      second.ruleVSqueezeEdgeDistance - first.ruleVSqueezeEdgeDistance,
  },
  {
    id: 'rule ww',
    shortLabel: 'rule ww',
    helpText:
      'Prefer the bishop of the outer wall off the edge of the board, ideally one square away from the edge and adjacent to the other bishop.',
    applies: (score) => score.ruleWWApplies,
    compare: (first, second) => first.ruleWWPenalty - second.ruleWWPenalty,
  },
  {
    id: 'rule wy',
    shortLabel: 'rule wy',
    helpText:
      "With the Black king on edge opposition with a bishop that is a knight's move from the corner and also in a bishop wall, play a bishop waiting move to the other square in opposition with Black.",
    applies: (score) => score.ruleWYApplies,
    compare: (first, second) => first.ruleWYPenalty - second.ruleWYPenalty,
  },
  {
    id: 'rule w',
    shortLabel: 'rule w',
    helpText: "Prefer bishops 3 or more steps from Black's king.",
    applies: (score) => score.ruleWApplies,
    compare: (first, second) => first.ruleWPenalty - second.ruleWPenalty,
  },
  {
    id: 'rule y',
    shortLabel: 'rule y',
    helpText:
      'Use a bishop to prevent Black from attacking the other undefended bishop on their next move, moving along a diagonal that separates the kings, unless Black can attack it on the next move.',
    applies: () => false,
    compare: (first, second) =>
      first.ruleYPenalty - second.ruleYPenalty,
  },
  {
    id: 'rule z',
    shortLabel: 'rule z',
    helpText:
      "If Black's king is in a corner, put White's king a knight's move away. If Black is one edge-square from that corner, use a bishop to control the next edge-square away from the corner.",
    applies: (score) => score.ruleZApplies,
    compare: (first, second) => first.ruleZPenalty - second.ruleZPenalty,
  },
  {
    id: 'rule zz',
    shortLabel: 'rule zz',
    helpText: 'Keep bishops not on a shortest path between the kings.',
    compare: (first, second) => first.ruleZZPenalty - second.ruleZZPenalty,
  },
  {
    id: 'rule z1',
    shortLabel: 'rule z1',
    helpText:
      "When the kings are a knight's move apart and bishops control the flank diagonals, use a bishop to control the primary squeeze diagonal.",
    applies: (score) => score.ruleZ1Applies,
    compare: (first, second) =>
      first.ruleZ1Penalty - second.ruleZ1Penalty,
  },
  {
    id: 'death box',
    shortLabel: 'death box',
    helpText:
      "When possible, place a bishop in opposition with a king on the edge, next to a bishop that is a knight's move from the Black king, without either piece on the edge. Prefer keeping the death box.",
    applies: (score) => score.deathBoxApplies,
    compare: (first, second) =>
      first.deathBoxPenalty - second.deathBoxPenalty,
  },
  {
    id: 'megadeth box',
    shortLabel: 'megadeth box',
    helpText:
      'With the king on the edge and a bishop controlling the inward adjacent square, place the other bishop in middle-16-squares opposition to the king, adjacent to the first bishop. Prefer keeping the megadeth box.',
    applies: (score) => score.megadethBoxApplies,
    compare: (first, second) =>
      first.megadethBoxPenalty - second.megadethBoxPenalty,
  },
  {
    id: 'rule z2',
    shortLabel: 'rule z2',
    helpText:
      "When the kings are 2 diagonal squares apart and bishops control the 2 diagonals parallel and adjacent to the kings' diagonal, maintain those diagonals and don't move the king.",
    applies: (score) => score.ruleZ2Applies,
    compare: (first, second) =>
      first.ruleZ2Penalty - second.ruleZ2Penalty,
  },
  {
    id: 'king stutter',
    shortLabel: 'king stutter',
    helpText: 'Do a king stutter step.',
    applies: (score) => score.kingStutterApplies,
    compare: (first, second) =>
      first.kingStutterPenalty - second.kingStutterPenalty,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText:
      "Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.",
    compare: (first, second) =>
      first.kingCloserMiddleSixteenDistance -
        second.kingCloserMiddleSixteenDistance ||
      first.kingCloserDistance - second.kingCloserDistance,
  },
  {
    id: 'unscreen bishops',
    shortLabel: 'unscreen bishops',
    helpText: "Keep bishops off White's king's diagonal.",
    compare: (first, second) =>
      first.unscreenBishopsCount - second.unscreenBishopsCount,
  },
  {
    id: 'uncluttered bishops',
    shortLabel: 'uncluttered bishops',
    helpText:
      "If Black's king is in the corner, prefer bishops off of squares a knight's move from the corner.",
    applies: (score) => score.unclutteredBishopsApplies,
    compare: (first, second) =>
      first.unclutteredBishopsPenalty - second.unclutteredBishopsPenalty,
  },
  {
    id: 'central pieces',
    shortLabel: 'central pieces',
    helpText: "Prefer White's pieces in the middle 32 squares.",
    compare: (first, second) =>
      first.centralPiecesPenalty - second.centralPiecesPenalty,
  },
  {
    id: 'bishop distance',
    shortLabel: 'bishop distance',
    helpText: "Prefer bishops onsides farther from Black's king.",
    compare: (first, second) =>
      second.bishopDistance - first.bishopDistance,
  },
]

const ACTIVE_TWO_BISHOPS_WHITE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'mate in 8 ish',
  'rule aa',
  'rule a',
  'rule b',
  'rule n',
  'rule o',
  'king closer',
  'rule ww',
  'rule wy',
  'rule w',
] as const

export const twoBishopsWhiteRules = ACTIVE_TWO_BISHOPS_WHITE_RULE_IDS.map(
  (id) => {
    const rule = twoBishopsWhiteRuleCatalog.find((candidate) => candidate.id === id)
    if (rule === undefined) throw new Error(`Missing Two Bishops rule ${id}`)
    return rule
  },
)

export function compareTwoBishopsWhiteScores(
  first: TwoBishopsWhiteMoveScore,
  second: TwoBishopsWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, twoBishopsWhiteRules)
}

function scoreWhiteCandidates(
  fen: string,
  moves: readonly string[],
): readonly ScoredMove<TwoBishopsWhiteMoveScore>[] {
  const chess = getChess(fen)
  const mateMoves = moves.filter((san) => {
    chess.move(san)
    const isMate = chess.isCheckmate()
    chess.undo()
    return isMate
  })
  if (mateMoves.length === 1) {
    const mateSan = mateMoves[0]
    const neutralScore = (matePenalty: number): TwoBishopsWhiteMoveScore => ({
      isPhaseTwoPosition: false,
      matePenalty,
      bishopSafetyPenalty: 0,
      stalematePenalty: 0,
      prepareMateApplies: false,
      prepareMatePenalty: 0,
      ruleAAApplies: false,
      ruleAAPenalty: 0,
      ruleAApplies: false,
      ruleAPenalty: 0,
      ruleBApplies: false,
      ruleBPenalty: 0,
      ruleNApplies: false,
      ruleNPenalty: 0,
      ruleOApplies: false,
      ruleOPenalty: 0,
      ruleWWApplies: false,
      ruleWWPenalty: 0,
      ruleGApplies: false,
      ruleGPenalty: 0,
      centralPiecesPenalty: 0,
      edgeFlankApplies: false,
      edgeFlankPenalty: 0,
      onsidesApplies: false,
      onsidesPenalty: 0,
      bootNScootApplies: false,
      bootNScootPenalty: 0,
      bootNScootReplyCount: 0,
      bootNScootUniqueBest: false,
      degenerateApplies: false,
      degeneratePenalty: 0,
      degenerateTerminal: false,
      mateInThreeApplies: false,
      mateInThreeTurns: 0,
      phaseTwoWallApplies: false,
      phaseTwoWallPenalty: 0,
      shepherdApplies: false,
      shepherdPenalty: 0,
      sequesterApplies: false,
      sequesterHasTargetCorner: false,
      sequesterCornerDiagonalsTarget: false,
      sequesterTargetCornerScore: 0,
      sequesterCurrentCornerDistance: 0,
      sequesterMaximumCornerReplyDistance: 0,
      sequesterTwoAwayControlPenalty: 0,
      sequesterIsBishopMove: false,
      bishopsOnBlackEdgeCount: 0,
      forcePhaseTwoApplies: false,
      forcePhaseTwoPenalty: 0,
      ruleRApplies: false,
      ruleRPenalty: 0,
      ruleSApplies: false,
      ruleSPenalty: 0,
      ruleTApplies: false,
      ruleTPenalty: 0,
      ruleTReplyCount: 0,
      ruleUUApplies: false,
      ruleUUPenalty: 0,
      ruleUApplies: false,
      ruleUPenalty: 0,
      ruleVApplies: false,
      ruleVPenalty: 0,
      ruleVSqueezeEdgeDistance: 0,
      ruleWYApplies: false,
      ruleWYPenalty: 0,
      ruleWApplies: false,
      ruleWUrgentPenalty: 0,
      ruleWPenalty: 0,
      ruleYApplies: false,
      ruleYPenalty: 0,
      ruleZApplies: false,
      ruleZPenalty: 0,
      ruleZZPenalty: 0,
      deathBoxApplies: false,
      deathBoxPenalty: 0,
      megadethBoxApplies: false,
      megadethBoxPenalty: 0,
      ruleZ1Applies: false,
      ruleZ1Penalty: 0,
      ruleZ2Applies: false,
      ruleZ2Penalty: 0,
      kingStutterApplies: false,
      kingStutterPenalty: 0,
      kingCloserPhaseTwoLinePenalty: 0,
      kingCloserDistance: 0,
      kingCloserMiddleSixteenDistance: 0,
      centralKingPenalty: 0,
      unscreenBishopsCount: 0,
      unclutteredBishopsApplies: false,
      unclutteredBishopsPenalty: 0,
      bishopDistance: 0,
      checkPenalty: 0,
      clutteredBishopsCount: 0,
    })
    return moves.map((san) => ({
      san,
      score: neutralScore(san === mateSan ? 0 : 1),
    }))
  }
  const context = createTwoBishopsWhitePositionContext(fen)
  return moves.map((san) => ({
    san,
    score: scoreTwoBishopsWhiteMoveWithContext(fen, san, context),
  }))
}

export function getIdealTwoBishopsWhiteMoves(fen: string): string[] {
  const moves = whiteLegalMoves(fen)
  return [...selectIdealMoves(
    scoreWhiteCandidates(fen, moves),
    twoBishopsWhiteRules,
  )]
}

export function scoreTwoBishopsBlackMove(
  fen: string,
  san: string,
): TwoBishopsBlackMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const blackKing = findPiece(chess.fen(), 'b', 'k')
  return {
    bishopCapturePenalty: move.captured === 'b' ? 0 : 1,
    centerDistance: blackKing ? centerDistance(blackKing.square) : 99,
    unprotectedBishopDistance: distanceToNearestUnprotectedWhiteBishop(
      chess.fen(),
    ),
  }
}

export function compareTwoBishopsBlackScores(
  first: TwoBishopsBlackMoveScore,
  second: TwoBishopsBlackMoveScore,
): number {
  return (
    first.bishopCapturePenalty - second.bishopCapturePenalty ||
    first.centerDistance - second.centerDistance ||
    first.unprotectedBishopDistance - second.unprotectedBishopDistance
  )
}

export function getIdealTwoBishopsBlackMoves(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  const firstMove = moves[0]
  if (!firstMove) return []
  const scored = moves.map((san) => ({
    san,
    score: scoreTwoBishopsBlackMove(fen, san),
  }))
  let best = scored[0]
  for (const candidate of scored.slice(1)) {
    if (compareTwoBishopsBlackScores(candidate.score, best.score) < 0) {
      best = candidate
    }
  }
  return scored
    .filter(
      (candidate) =>
        compareTwoBishopsBlackScores(candidate.score, best.score) === 0,
    )
    .map(({ san }) => san)
}

function getBlackCandidates(
  fen: string,
  previousTurnFen?: string,
): OpponentCandidates {
  const moves = getChess(fen).moves()
  const priorityMoves = applyUniversalBlackPriorities(
    fen,
    previousTurnFen,
    moves,
  )
  return {
    moves,
    idealMoves: getIdealTwoBishopsBlackMoves(fen, priorityMoves),
  }
}

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

export function getTwoBishopsDegenerateReasonLabel(
  fen: string,
): TwoBishopsDegenerateReasonLabel | undefined {
  return getDegenerateRepair(
    fen,
    isTwoBishopsPhaseTwoPosition(fen),
  )?.reasonLabel
}

export const twoBishopsRuleSet: MateRuleSet<TwoBishopsWhiteMoveScore> = {
  id: 'two-bishops',
  phase: getTwoBishopsPhaseLabel,
  scoreWhite: scoreTwoBishopsWhiteMove,
  scoreWhiteCandidates,
  whiteRuleReasonLabel: (fen, rule) =>
    rule.id === 'degenerate'
      ? getTwoBishopsDegenerateReasonLabel(fen)
      : undefined,
  whiteRules: twoBishopsWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: getBlackCandidates,
  help: twoBishopsHelp,
}

export {
  getProximateBishopWall,
  getTwoBishopsPhaseLabel,
  isTwoBishopsPhaseTwoPosition,
} from './twoBishopsGeometry'
