import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  allSquares,
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
} from '../chess'
import { compareScoresByRules, selectIdealMoves } from './selection'
import {
  applyUniversalBlackPriorities,
  BLACK_CAPTURE_PRIORITY,
  BLACK_RETURN_PRIORITY,
} from './blackPriorities'
import {
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getTwoBishopsPhaseLabel,
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  areKingsAtPhaseTwoDistance,
} from './twoBishopsGeometry'
import { TWO_BISHOPS_DIAGRAM_POSITIONS } from './twoBishopsDiagramPositions'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  RuleNoteBoardPiece,
  ScoredMove,
} from './types'

const BOARD_SQUARE_COORDINATES = allSquares().map(squareCoordinates)

export type TwoBishopsWhiteMoveScore = {
  readonly isPhaseTwoPosition: boolean
  readonly matePenalty: number
  readonly bishopSafetyPenalty: number
  readonly stalematePenalty: number
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
  readonly idealCagePenalty: number
  readonly restrictAreaRawArea: number
  readonly restrictAreaEscapeApplies: boolean
  readonly restrictAreaEscapePenalty: number
  readonly restrictAreaEscapeTravelLength: number
  readonly restrictAreaDiagonalCenterDistance: number
  readonly kingPushableApplies: boolean
  readonly kingPushableDistance: number
  readonly kingPushableInsideAreaPenalty: number
  readonly bishopsFurtherDistance: number
  readonly kingCloserPhaseTwoLinePenalty: number
  readonly kingCloserDistance: number
  readonly kingCloserMiddleSixteenDistance: number
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

const MATE_PREP_LIGHT_DIAGONAL: readonly Square[] = [
  'd1',
  'e2',
  'f3',
  'g4',
  'h5',
]
const MATE_PREP_DARK_DIAGONAL: readonly Square[] = [
  'c1',
  'd2',
  'e3',
  'f4',
  'g5',
  'h6',
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
  matePrep: 'degenerate — mate prep',
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
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.phaseOneLoopEscape,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingFlank,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingSidestep,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.reformWall,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingLift,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.bishopRetreat,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.longDiagonal,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.matePrep,
] as const

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
    "Phase 2: Black's king forced to the edge, White's king two steps away from Black's king.",
    "Target corner: Calculate after White's move in Phase 2. If Black is in or one edge square from a corner, use that corner. Otherwise, in the corner-diagonals position, its cutoff points to the opposite corner and continues to do so when Black steps around that corner. Otherwise, when the kings are in opposition and more bishops stand on one physical side of White's king, choose the opposite corner. When deciding between bishop moves, prefer the stronger bishop majority. Otherwise, choose the corner where White wins the king race by the greatest Chebyshev-distance lead. If neither method decides, choose the corner closest to White's king. Retain tied corners.",
  ],
  noteBoards: [
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
      id: 'bishop-degenerate-mate-prep',
      title: 'degenerate — mate prep',
      caption: 'Take opposition with the king.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(
        TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMatePrep.fen,
      ),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.degenerateMatePrep.arrow],
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
  ],
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
): boolean {
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  if (
    Math.abs(source.file - destination.file) !==
    Math.abs(source.rank - destination.rank)
  ) {
    return false
  }
  const fileStep = Math.sign(destination.file - source.file)
  const rankStep = Math.sign(destination.rank - source.rank)
  let file = source.file + fileStep
  let rank = source.rank + rankStep
  while (file !== destination.file || rank !== destination.rank) {
    const square = squareFromCoordinates(file, rank)
    if (!square || chess.get(square)) return false
    file += fileStep
    rank += rankStep
  }
  return true
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

function getMatePrepDegenerateRepair(
  fen: string,
  blackKing: Square,
  whiteKing: Square,
  bishops: readonly Square[],
): DegenerateRepair | null {
  const legalMoves = getChess(fen).moves({ verbose: true })

  for (const transform of SQUARE_TRANSFORMS) {
    const expectedBlackKing = transformSquare('h2', transform)
    const expectedWhiteKing = transformSquare('f3', transform)
    const target = transformSquare('f2', transform)
    const lightDiagonal = MATE_PREP_LIGHT_DIAGONAL.map((square) =>
      transformSquare(square, transform),
    )
    const darkDiagonal = MATE_PREP_DARK_DIAGONAL.map((square) =>
      transformSquare(square, transform),
    )
    const lightBishop = bishops.find(
      (bishop) =>
        squareColor(bishop) ===
        squareColor(transformSquare('d1', transform)),
    )
    const darkBishop = bishops.find(
      (bishop) =>
        squareColor(bishop) ===
        squareColor(transformSquare('c1', transform)),
    )
    const bishopCanAccess = (
      bishop: Square | undefined,
      diagonal: readonly Square[],
    ): boolean =>
      bishop !== undefined &&
      legalMoves.some(
        (move) =>
          move.piece === 'b' &&
          move.from === bishop &&
          diagonal.includes(move.to),
      )
    const bishopControls = (
      bishop: Square | undefined,
      diagonal: readonly Square[],
    ): boolean => bishop !== undefined && diagonal.includes(bishop)
    const bishopGatePasses =
      bishopControls(darkBishop, darkDiagonal) ||
      (bishopControls(lightBishop, lightDiagonal) &&
        bishopCanAccess(darkBishop, darkDiagonal))
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !bishopGatePasses
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
        reasonLabel: TWO_BISHOPS_DEGENERATE_REASON_LABELS.matePrep,
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
    [TWO_BISHOPS_DEGENERATE_REASON_LABELS.matePrep]: () =>
      isPhaseTwo
        ? getMatePrepDegenerateRepair(
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

function hasBishopCheckmate(fen: string): boolean {
  return getChess(fen)
    .moves({ verbose: true })
    .filter((move) => move.piece === 'b')
    .some((move) => {
      const afterMate = getChess(fen)
      afterMate.move(move.san)
      return afterMate.isCheckmate()
    })
}

function checkForcesCornerThenBishopMate(
  fenAfterCheck: string,
  corner: Square,
): boolean {
  const afterCheck = getChess(fenAfterCheck)
  if (!afterCheck.isCheck()) return false
  const replies = afterCheck.moves({ verbose: true })
  if (
    replies.length !== 1 ||
    replies[0]?.piece !== 'k' ||
    replies[0].to !== corner
  ) {
    return false
  }
  afterCheck.move(replies[0].san)
  return hasBishopCheckmate(afterCheck.fen())
}

function quietMoveForcesMateInThree(
  fenAfterQuietMove: string,
  corner: Square,
): boolean {
  const afterQuietMove = getChess(fenAfterQuietMove)
  if (afterQuietMove.isCheck()) return false
  const replies = afterQuietMove.moves({ verbose: true })
  const forcedEdgeReply = replies[0]
  if (
    replies.length !== 1 ||
    forcedEdgeReply?.piece !== 'k' ||
    kingDistance(forcedEdgeReply.to, corner) !== 1 ||
    edgeDistance(forcedEdgeReply.to) !== 0 ||
    BOARD_CORNERS.includes(forcedEdgeReply.to)
  ) {
    return false
  }
  afterQuietMove.move(forcedEdgeReply.san)
  return afterQuietMove
    .moves({ verbose: true })
    .filter((move) => move.piece === 'b')
    .some((move) => {
      const afterCheck = getChess(afterQuietMove.fen())
      afterCheck.move(move.san)
      return checkForcesCornerThenBishopMate(afterCheck.fen(), corner)
    })
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
    for (const move of legalMoves) {
      const afterQuietMove = getChess(fen)
      afterQuietMove.move(move.san)
      if (quietMoveForcesMateInThree(afterQuietMove.fen(), blackKing)) {
        turnsBySan.set(move.san, 3)
      }
    }
  }

  const proximateCorners = BOARD_CORNERS.filter(
    (corner) =>
      kingDistance(blackKing, corner) === 1 &&
      edgeDistance(blackKing) === 0 &&
      isMatingPosition(whiteKing, corner),
  )
  for (const move of legalMoves) {
    if (move.piece !== 'b') continue
    const afterCheck = getChess(fen)
    afterCheck.move(move.san)
    if (
      proximateCorners.some((corner) =>
        checkForcesCornerThenBishopMate(afterCheck.fen(), corner),
      )
    ) {
      turnsBySan.set(move.san, 2)
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
  readonly restrictAreaEscapeBoundaries: readonly RestrictAreaEscapeBoundary[]
  readonly restrictAreaKingConfinements: readonly BishopConfinement[]
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
  const restrictAreaEscapeBoundaries =
    blackKing === undefined ||
    startingWhiteKing === undefined ||
    whiteKingScreensBishopFromBlackAdjacentSquare(
      getChess(fen),
      startingBishops,
      blackKing,
      startingWhiteKing,
    )
      ? []
      : getBishopConfinements(
          startingBishops,
          blackKing,
        ).flatMap(({ orientation }) =>
          startingBishops
            .filter((bishop) => kingDistance(bishop, blackKing) === 1)
            .map((bishop) => ({
              bishop,
              orientation,
              value: diagonalInvariant(bishop, orientation),
            })),
        )
  const restrictAreaKingConfinements =
    isPhaseTwo ||
    blackKing === undefined
      ? []
      : getRestrictedAreaKingConfinements(startingBishops, blackKing)
  return {
    blackKing,
    startingWhiteKing,
    startingBishops,
    isPhaseTwo,
    degenerateRepair,
    mateInThreeApplies: matePatternTurnsBySan.size > 0,
    matePatternTurnsBySan,
    restrictAreaEscapeBoundaries,
    restrictAreaKingConfinements,
    shepherdMoves:
      isPhaseTwo
        ? getShepherdMoves(
            fen,
            blackKing,
            startingWhiteKing,
            startingBishops,
          )
        : [],
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
    restrictAreaEscapeBoundaries,
    restrictAreaKingConfinements,
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
  const blackKingDiagonalSquares = getAdjacentSquares(blackKing).filter(
    (target) =>
      blackKing !== undefined &&
      squareCoordinates(target).file !== squareCoordinates(blackKing).file &&
      squareCoordinates(target).rank !== squareCoordinates(blackKing).rank,
  )
  const controlledDiagonalSquares = blackKingDiagonalSquares.filter(
    (target) =>
      resultBishops.some(
        (bishop) =>
          bishop !== target &&
          bishopHasClearLineToSquareOnBoard(chess, bishop, target),
      ),
  )
  const nonCheckingResult = !chess.isCheck()
  const confinementArea = getBishopConfinementArea(
    resultBishops,
    blackKing,
  )
  const whiteKingScreensRestrictedArea =
    blackKing !== undefined &&
    resultWhiteKingSquare !== undefined &&
    whiteKingScreensBishopFromBlackAdjacentSquare(
      chess,
      resultBishops,
      blackKing,
      resultWhiteKingSquare,
    )
  const restrictAreaRawArea =
    nonCheckingResult &&
    !whiteKingScreensRestrictedArea &&
    confinementArea !== null
      ? confinementArea
      : 99
  const idealCagePenalty =
    blackKing !== undefined &&
    IDEAL_CAGES.some(
      ({ bishops, blackArea }) =>
        blackArea.includes(blackKing) &&
        bishops.every((bishop) => resultBishops.includes(bishop)),
    )
      ? 0
      : 1
  const restrictAreaEscapesAttackedBishop =
    move.piece === 'b' &&
    restrictAreaRawArea !== 99 &&
    restrictAreaEscapeBoundaries.some(
      ({ bishop, orientation, value }) =>
        move.from === bishop &&
        diagonalInvariant(move.to, orientation) === value,
    )
  return {
    isPhaseTwoPosition: isPhaseTwo,
    matePenalty: mate ? 0 : 1,
    bishopSafetyPenalty: bishopCanBeCaptured ? 1 : 0,
    stalematePenalty: !mate && chess.isStalemate() ? 1 : 0,
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
            bishop !== twoAwaySquare &&
            bishopHasClearLineToSquare(
              resultFen,
              bishop,
              twoAwaySquare,
            ),
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
    idealCagePenalty,
    restrictAreaRawArea,
    restrictAreaEscapeApplies: restrictAreaEscapeBoundaries.length > 0,
    restrictAreaEscapePenalty: restrictAreaEscapesAttackedBishop ? 0 : 1,
    restrictAreaEscapeTravelLength: restrictAreaEscapesAttackedBishop
      ? kingDistance(move.from, move.to)
      : 0,
    restrictAreaDiagonalCenterDistance:
      nonCheckingResult && controlledDiagonalSquares.length > 0
        ? Math.min(...controlledDiagonalSquares.map(centerDistance))
        : 99,
    kingPushableApplies: restrictAreaKingConfinements.length > 0,
    kingPushableDistance:
      resultWhiteKingSquare === undefined ||
      restrictAreaKingConfinements.length === 0
        ? 99
        : distanceToRestrictedAreaKingBoundary(
            resultWhiteKingSquare,
            restrictAreaKingConfinements,
          ),
    kingPushableInsideAreaPenalty:
      resultWhiteKingSquare !== undefined &&
      kingIsInsideRestrictedArea(
        resultWhiteKingSquare,
        restrictAreaKingConfinements,
      )
        ? 1
        : 0,
    bishopsFurtherDistance:
      blackKing === undefined
        ? 0
        : resultBishops.reduce(
            (total, bishop) =>
              total + squaredEuclideanDistance(bishop, blackKing),
            0,
          ),
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

function getAdjacentSquares(square: Square | undefined): Square[] {
  if (square === undefined) return []
  const origin = squareCoordinates(square)
  const adjacent: Square[] = []
  for (let fileStep = -1; fileStep <= 1; fileStep += 1) {
    for (let rankStep = -1; rankStep <= 1; rankStep += 1) {
      if (fileStep === 0 && rankStep === 0) continue
      const target = squareFromCoordinates(
        origin.file + fileStep,
        origin.rank + rankStep,
      )
      if (target !== null) adjacent.push(target)
    }
  }
  return adjacent
}

type DiagonalOrientation = 'difference' | 'sum'

type BishopConfinement = {
  readonly area: number
  readonly blackSide: -1 | 1
  readonly boundaries: readonly [number, number]
  readonly orientation: DiagonalOrientation
}

type RestrictAreaEscapeBoundary = {
  readonly bishop: Square
  readonly orientation: DiagonalOrientation
  readonly value: number
}

type IdealCage = {
  readonly bishops: readonly Square[]
  readonly blackArea: readonly Square[]
}

const IDEAL_CAGES: readonly IdealCage[] = SQUARE_TRANSFORMS.map(
  (transform) => ({
    bishops: [
      transformSquare('a4', transform),
      transformSquare('b4', transform),
    ],
    blackArea: ['a1', 'b1', 'c1', 'a2', 'b2'].map((square) =>
      transformSquare(square as Square, transform),
    ),
  }),
)

const DIAGONAL_ORIENTATIONS: readonly DiagonalOrientation[] = [
  'difference',
  'sum',
]

function diagonalInvariant(
  square: Square,
  orientation: DiagonalOrientation,
): number {
  const { file, rank } = squareCoordinates(square)
  return orientation === 'difference' ? file - rank : file + rank
}

function getBishopConfinements(
  bishops: readonly Square[],
  blackKing: Square | undefined,
): readonly BishopConfinement[] {
  if (bishops.length !== 2 || blackKing === undefined) {
    return []
  }
  const blackCoordinates = squareCoordinates(blackKing)
  return DIAGONAL_ORIENTATIONS.flatMap<BishopConfinement>((orientation) => {
    const invariant = ({ file, rank }: { file: number; rank: number }) =>
      orientation === 'difference' ? file - rank : file + rank
    const first = diagonalInvariant(bishops[0]!, orientation)
    const second = diagonalInvariant(bishops[1]!, orientation)
    if (Math.abs(first - second) !== 1) return []
    const minimum = Math.min(first, second)
    const maximum = Math.max(first, second)
    const black = invariant(blackCoordinates)
    if (black < minimum) {
      return [
        {
          area: BOARD_SQUARE_COORDINATES.filter(
            (square) => invariant(square) < minimum,
          ).length,
          blackSide: -1,
          boundaries: [minimum, maximum],
          orientation,
        },
      ]
    }
    if (black > maximum) {
      return [
        {
          area: BOARD_SQUARE_COORDINATES.filter(
            (square) => invariant(square) > maximum,
          ).length,
          blackSide: 1,
          boundaries: [minimum, maximum],
          orientation,
        },
      ]
    }
    return []
  })
}

function getRestrictedAreaKingConfinements(
  bishops: readonly Square[],
  blackKing: Square,
): readonly BishopConfinement[] {
  const confinements = getBishopConfinements(bishops, blackKing)
  if (confinements.length === 0) return []
  const smallestArea = Math.min(...confinements.map(({ area }) => area))
  return confinements.filter(({ area }) => area === smallestArea)
}

function distanceToRestrictedAreaKingBoundary(
  king: Square,
  confinements: readonly BishopConfinement[],
): number {
  const kingCoordinates = squareCoordinates(king)
  return Math.min(
    ...confinements.flatMap(({ boundaries, orientation }) =>
      boundaries.flatMap((value) =>
        BOARD_SQUARE_COORDINATES.filter(
          (square) =>
            (orientation === 'difference'
              ? square.file - square.rank
              : square.file + square.rank) === value,
        ).map(
          (square) =>
            (square.file - kingCoordinates.file) ** 2 +
            (square.rank - kingCoordinates.rank) ** 2,
        ),
      ),
    ),
  )
}

function kingIsInsideRestrictedArea(
  king: Square,
  confinements: readonly BishopConfinement[],
): boolean {
  const coordinates = squareCoordinates(king)
  return confinements.some(({ blackSide, boundaries, orientation }) => {
    const value =
      orientation === 'difference'
        ? coordinates.file - coordinates.rank
        : coordinates.file + coordinates.rank
    return blackSide < 0
      ? value < boundaries[0]
      : value > boundaries[1]
  })
}

function getBishopConfinementArea(
  bishops: readonly Square[],
  blackKing: Square | undefined,
): number | null {
  const confinements = getBishopConfinements(bishops, blackKing)
  return confinements.length === 0
    ? null
    : Math.min(...confinements.map(({ area }) => area))
}

function whiteKingScreensBishopFromBlackAdjacentSquare(
  chess: ReturnType<typeof getChess>,
  bishops: readonly Square[],
  blackKing: Square,
  whiteKing: Square,
): boolean {
  return getAdjacentSquares(blackKing).some((target) =>
    bishops.some((bishop) =>
      whiteKingIsOnlyBishopRayBlocker(
        chess,
        bishop,
        target,
        whiteKing,
      ),
    ),
  )
}

function whiteKingIsOnlyBishopRayBlocker(
  chess: ReturnType<typeof getChess>,
  bishop: Square,
  target: Square,
  whiteKing: Square,
): boolean {
  const source = squareCoordinates(bishop)
  const destination = squareCoordinates(target)
  if (
    Math.abs(source.file - destination.file) !==
    Math.abs(source.rank - destination.rank)
  ) {
    return false
  }
  const fileStep = Math.sign(destination.file - source.file)
  const rankStep = Math.sign(destination.rank - source.rank)
  let whiteKingBlocks = false
  let file = source.file + fileStep
  let rank = source.rank + rankStep
  while (file !== destination.file || rank !== destination.rank) {
    const square = squareFromCoordinates(file, rank)
    if (square === null) return false
    if (square === whiteKing) {
      whiteKingBlocks = true
    } else if (chess.get(square)) {
      return false
    }
    file += fileStep
    rank += rankStep
  }
  return whiteKingBlocks
}

export const twoBishopsWhiteRules: readonly OrderedRule<TwoBishopsWhiteMoveScore>[] = [
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
    id: 'mate in 3',
    shortLabel: 'mate in 3',
    helpText:
      "With Black's king in the corner and White's king in a mating position, play mate in 3.",
    applies: (score) => score.mateInThreeApplies,
    compare: (first, second) =>
      first.mateInThreeTurns - second.mateInThreeTurns,
  },
  {
    id: 'degenerate',
    shortLabel: 'degenerate',
    helpText: 'repair degenerate positions',
    applies: (score) => score.degenerateApplies,
    stopWhenBest: (score) =>
      score.degenerateTerminal && score.degeneratePenalty === 0,
    compare: (first, second) =>
      first.degeneratePenalty - second.degeneratePenalty,
  },
  {
    id: 'force phase 2',
    shortLabel: 'force phase 2',
    helpText: '(see notes)',
    applies: (score) => score.forcePhaseTwoApplies,
    compare: (first, second) =>
      first.forcePhaseTwoPenalty - second.forcePhaseTwoPenalty,
  },
  {
    id: 'shepherd',
    shortLabel: 'shepherd',
    helpText:
      "Phase 2: When a bishop controls the edge square 2 away from Black's king and further from the target square, take opposition, moving towards the target corner.",
    applies: (score) => score.shepherdApplies,
    compare: (first, second) =>
      first.shepherdPenalty - second.shepherdPenalty,
  },
  {
    id: 'sequester',
    shortLabel: 'sequester',
    helpText:
      "Phase 2: Force Black's king towards the target corner, or otherwise use a bishop to control the square 2 away from Black's current square.",
    applies: (score) => score.sequesterApplies,
    subpriorities: [
      {
        when: (scores) =>
          scores.some(
            (score) =>
              score.sequesterMaximumCornerReplyDistance <
              score.sequesterCurrentCornerDistance,
          ),
        compare: (first, second) =>
          first.sequesterMaximumCornerReplyDistance -
          first.sequesterCurrentCornerDistance -
          (second.sequesterMaximumCornerReplyDistance -
            second.sequesterCurrentCornerDistance),
      },
      {
        compare: (first, second) =>
          second.sequesterTargetCornerScore -
          first.sequesterTargetCornerScore,
      },
      {
        when: (scores) =>
          scores.every(
            (score) => score.sequesterCornerDiagonalsTarget,
          ),
        compare: (first, second) =>
          first.sequesterMaximumCornerReplyDistance -
          second.sequesterMaximumCornerReplyDistance,
      },
      {
        when: (scores) =>
          scores.every(
            (score) =>
              score.sequesterMaximumCornerReplyDistance >=
              score.sequesterCurrentCornerDistance,
          ),
        compare: (first, second) =>
          first.sequesterTwoAwayControlPenalty -
          second.sequesterTwoAwayControlPenalty,
      },
    ],
  },
  {
    id: 'bishops off edge',
    shortLabel: 'bishops off edge',
    helpText: "Phase 2: Prefer fewer bishops on Black's edge.",
    applies: (score) => score.isPhaseTwoPosition,
    compare: (first, second) =>
      first.bishopsOnBlackEdgeCount - second.bishopsOnBlackEdgeCount,
  },
  {
    id: 'phase 2 wall',
    shortLabel: 'phase 2 wall',
    helpText:
      "Phase 2: Create or maintain a 2 square wall adjacent to Black's king and opposite the target corner.",
    applies: (score) => score.phaseTwoWallApplies,
    compare: (first, second) =>
      first.phaseTwoWallPenalty - second.phaseTwoWallPenalty,
  },
  {
    id: 'unclutter bishops',
    shortLabel: 'unclutter bishops',
    helpText: 'Prefer bishops more than two king steps from a corner.',
    compare: (first, second) =>
      first.clutteredBishopsCount - second.clutteredBishopsCount,
  },
  {
    id: 'ideal cage',
    shortLabel: 'ideal cage',
    helpText:
      "Phase 1: Have 2 adjacent bishops, exactly one on the edge, 3 squares from the corner, with Black's king inside the 5-square corner area",
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) =>
      first.idealCagePenalty - second.idealCagePenalty,
  },
  {
    id: 'restricted area',
    shortLabel: 'restricted area',
    helpText:
      "Phase 1: Use the bishops to control 2 diagonals adjacent to Black's king, but not checking the king, preferring a smaller area for Black. White's king should not screen a bishop from a Black king-adjacent square",
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) =>
      first.restrictAreaRawArea - second.restrictAreaRawArea,
  },
  {
    id: 'prep restricted area',
    shortLabel: 'prep restricted area',
    helpText:
      "Phase 1: Bishop control a square diagonally adjacent to Black's king, preferring squares closer to the center of the board. If a bishop is attacked while maintaining the restricted area, maintain the diagonal and move it as far as possible.",
    applies: (score) => !score.isPhaseTwoPosition,
    subpriorities: [
      {
        when: (scores) =>
          scores.some(
            ({ restrictAreaEscapeApplies, restrictAreaEscapePenalty }) =>
              restrictAreaEscapeApplies &&
              restrictAreaEscapePenalty === 0,
          ),
        compare: (first, second) =>
          first.restrictAreaEscapePenalty -
            second.restrictAreaEscapePenalty ||
          second.restrictAreaEscapeTravelLength -
            first.restrictAreaEscapeTravelLength,
      },
      {
        when: (scores) =>
          scores.every(
            ({ restrictAreaRawArea }) => restrictAreaRawArea === 99,
          ),
        compare: (first, second) =>
          first.restrictAreaDiagonalCenterDistance -
          second.restrictAreaDiagonalCenterDistance,
      },
    ],
  },
  {
    id: 'king pushable',
    shortLabel: 'king pushable',
    helpText:
      "Phase 1: Bring White's king toward the restricted-area diagonal while keeping it outside Black's restricted area.",
    applies: (score) =>
      !score.isPhaseTwoPosition && score.kingPushableApplies,
    compare: (first, second) =>
      first.kingPushableInsideAreaPenalty -
        second.kingPushableInsideAreaPenalty ||
      first.kingPushableDistance - second.kingPushableDistance,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText:
      "Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.",
    compare: (first, second) =>
      first.kingCloserPhaseTwoLinePenalty -
        second.kingCloserPhaseTwoLinePenalty ||
      first.kingCloserDistance - second.kingCloserDistance ||
      first.kingCloserMiddleSixteenDistance -
        second.kingCloserMiddleSixteenDistance,
  },
  {
    id: 'bishops further',
    shortLabel: 'bishops further',
    helpText:
      "Phase 1: Prefer bishops to be further from Black's king",
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) =>
      second.bishopsFurtherDistance - first.bishopsFurtherDistance,
  },
  {
    id: 'check',
    shortLabel: 'check',
    helpText: 'Play a check',
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) => first.checkPenalty - second.checkPenalty,
  },
]

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
