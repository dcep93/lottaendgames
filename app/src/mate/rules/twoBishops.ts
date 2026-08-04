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
  getProximateBishopWall,
  getTwoBishopsPhaseLabel,
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  areKingsAtPhaseTwoDistance,
  type ProximateBishopWall,
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
  readonly sequesterApplies: boolean
  readonly sequesterHasTargetCorner: boolean
  readonly sequesterCurrentCornerDistance: number
  readonly sequesterMaximumCornerReplyDistance: number
  readonly sequesterTwoAwayControlPenalty: number
  readonly sequesterIsBishopMove: boolean
  readonly sequesterBishopTargetDistance: number
  readonly forcePhaseTwoApplies: boolean
  readonly forcePhaseTwoPenalty: number
  readonly conclaveStepPenalty: number
  readonly supportWallPenalty: number
  readonly finishWallPenalty: number
  readonly startWallPenalty: number
  readonly kingCloserPhaseTwoLinePenalty: number
  readonly kingCloserDistance: number
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
  knightStepControl: 'degenerate — knight-step control',
  wallWaitingMove: 'degenerate — wall waiting move',
  cornerDiagonals: 'degenerate — corner diagonals',
  kingLift: 'degenerate — king lift',
  bishopRetreat: 'degenerate — bishop retreat',
  longDiagonal: 'degenerate — long diagonal',
  edgeRepair: 'degenerate — edge repair',
  edgeUnmask: 'degenerate — unmask edge bishop',
  diagonalSetup: 'degenerate — diagonal setup',
  diagonalWaitingMove: 'degenerate — diagonal waiting move',
  freeBishop: 'degenerate — free bishop',
  waitingMove: 'degenerate — waiting move',
  kingSidestep: 'degenerate — king sidestep',
  reformWall: 'degenerate — reform wall',
} as const

type TwoBishopsDegenerateReasonLabel =
  (typeof TWO_BISHOPS_DEGENERATE_REASON_LABELS)[keyof typeof TWO_BISHOPS_DEGENERATE_REASON_LABELS]

export const TWO_BISHOPS_DEGENERATE_PRIORITY_ORDER = [
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.knightStepControl,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.wallWaitingMove,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.cornerDiagonals,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeRepair,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.edgeUnmask,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalSetup,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.diagonalWaitingMove,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.freeBishop,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.waitingMove,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingSidestep,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.reformWall,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.kingLift,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.bishopRetreat,
  TWO_BISHOPS_DEGENERATE_REASON_LABELS.longDiagonal,
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
    "Target corner: The corner farthest along Black's edge from the bishops' controlled edge squares; on a tie, the corner closest to White's king.",
  ],
  noteBoards: [
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
        "Preserve one bishop's control of f8. Ensure the other bishop controls h5.",
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
      id: 'bishop-conclave-step',
      title: 'conclave step',
      caption: 'When the pieces have this arrangement, play the arrowed bishop move.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.conclaveStep.fen),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.conclaveStep.arrow],
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

function getPhaseTwoWalls(
  blackKing: Square,
  whiteKing: Square,
): readonly PhaseTwoWall[] {
  const black = squareCoordinates(blackKing)
  const white = squareCoordinates(whiteKing)
  const walls: PhaseTwoWall[] = []
  const addWalls = (
    along: 'file' | 'rank',
    inwardFile: number,
    inwardRank: number,
  ): void => {
    const blackAlong = along === 'file' ? black.file : black.rank
    const whiteAlong = along === 'file' ? white.file : white.rank
    const directions =
      whiteAlong > blackAlong
        ? [-1]
        : whiteAlong < blackAlong
          ? [1]
          : [-1, 1]
    for (const direction of directions) {
      const edgeSquare = squareFromCoordinates(
        black.file + (along === 'file' ? direction : 0),
        black.rank + (along === 'rank' ? direction : 0),
      )
      if (!edgeSquare) continue
      const edge = squareCoordinates(edgeSquare)
      const inwardSquare = squareFromCoordinates(
        edge.file + inwardFile,
        edge.rank + inwardRank,
      )
      if (!inwardSquare) continue
      walls.push({ edgeSquare, inwardSquare })
    }
  }

  if (black.rank === 7) addWalls('file', 0, -1)
  if (black.rank === 0) addWalls('file', 0, 1)
  if (black.file === 0) addWalls('rank', 1, 0)
  if (black.file === 7) addWalls('rank', -1, 0)
  return walls
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
  blackKing: Square,
  targetCorner: Square | null,
): boolean {
  return getControlledPhaseTwoWalls(
    fen,
    bishops,
    walls,
    blackKing,
  ).some((wall) => wall.edgeSquare !== targetCorner)
}

function getControlledPhaseTwoWalls(
  fen: string,
  bishops: readonly Square[],
  walls: readonly PhaseTwoWall[],
  blackKing: Square,
): readonly PhaseTwoWall[] {
  if (bishops.some((bishop) => isOnBlackKingsEdge(bishop, blackKing))) {
    return []
  }
  return walls.filter((wall) =>
    bishopsControlPhaseTwoWall(fen, bishops, wall),
  )
}

function getTargetCorner(
  blackKing: Square | undefined,
  whiteKing: Square | undefined,
  fen: string,
  bishops: readonly Square[],
): Square | null {
  if (!blackKing || !whiteKing) return null
  if (BOARD_CORNERS.includes(blackKing)) return blackKing

  const black = squareCoordinates(blackKing)
  const edgeAxis =
    black.rank === 0 || black.rank === 7
      ? 'file'
      : black.file === 0 || black.file === 7
        ? 'rank'
        : null
  if (edgeAxis === null) return null

  const blackAxis = black[edgeAxis]
  const controlledAxes: number[] = []
  for (let axis = 0; axis < 8; axis += 1) {
    if (axis === blackAxis) continue
    const edgeSquare = squareFromCoordinates(
      edgeAxis === 'file' ? axis : black.file,
      edgeAxis === 'rank' ? axis : black.rank,
    )
    if (
      edgeSquare &&
      bishops.some(
        (bishop) =>
          bishop !== edgeSquare &&
          bishopHasClearLineToSquare(fen, bishop, edgeSquare),
      )
    ) {
      controlledAxes.push(axis)
    }
  }
  if (controlledAxes.length > 0) {
    const lowCornerDistance = controlledAxes.reduce(
      (sum, axis) => sum + axis,
      0,
    )
    const highCornerDistance = controlledAxes.reduce(
      (sum, axis) => sum + (7 - axis),
      0,
    )
    const targetAxis =
      lowCornerDistance > highCornerDistance
        ? 0
        : highCornerDistance > lowCornerDistance
          ? 7
          : null
    if (targetAxis !== null) {
      return squareFromCoordinates(
        edgeAxis === 'file' ? targetAxis : black.file,
        edgeAxis === 'rank' ? targetAxis : black.rank,
      )
    }
  }

  {
    const whiteAxis = squareCoordinates(whiteKing)[edgeAxis]
    const targetAxis = whiteAxis < 3.5 ? 0 : 7
    return squareFromCoordinates(
      edgeAxis === 'file' ? targetAxis : black.file,
      edgeAxis === 'rank' ? targetAxis : black.rank,
    )
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

function bishopHasClearLineToSquare(
  fen: string,
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
  const chess = getChess(fen)
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
        return resultBishops.some(
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
                targetBishop !== targetSquare &&
                bishopHasClearLineToSquare(
                  resultFen,
                  targetBishop,
                  targetSquare,
                ),
            ),
        )
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
    const expectedBlackKing = transformSquare('h3', transform)
    const expectedWhiteKing = transformSquare('f4', transform)
    const expectedBishops = [
      transformSquare('g8', transform),
      transformSquare('g7', transform),
    ]
    const uncontrolledSquare = transformSquare('h5', transform)
    if (
      blackKing !== expectedBlackKing ||
      whiteKing !== expectedWhiteKing ||
      !isKnightMove(whiteKing, blackKing) ||
      !expectedBishops.every((bishop) => bishopSet.has(bishop)) ||
      bishops.some((bishop) =>
        bishopHasClearLineToSquare(fen, bishop, uncontrolledSquare),
      )
    ) {
      continue
    }

    const targetSquare = transformSquare('g2', transform)
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
  readonly conclaveSteps: ReturnType<typeof getConclaveSteps>
  readonly isPhaseTwo: boolean
  readonly degenerateRepair: DegenerateRepair | null
  readonly mateInThreeApplies: boolean
  readonly matePatternTurnsBySan: ReadonlyMap<string, 2 | 3>
  readonly phaseTwoWalls: readonly PhaseTwoWall[]
  readonly targetCorner: Square | null
  readonly hasStartingWallPosition: boolean
  readonly hasStartingBishopWall: boolean
  readonly proximateWall: ProximateBishopWall | null
}

function bishopsFormWall(bishops: readonly Square[]): boolean {
  const firstSquare = bishops[0]
  const secondSquare = bishops[1]
  if (bishops.length !== 2 || !firstSquare || !secondSquare) return false
  const first = squareCoordinates(firstSquare)
  const second = squareCoordinates(secondSquare)
  return (
    Math.abs(first.file - second.file) +
      Math.abs(first.rank - second.rank) ===
    1
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
  const phaseTwoWalls =
    isPhaseTwo && blackKing && startingWhiteKing
      ? getPhaseTwoWalls(blackKing, startingWhiteKing)
      : []
  return {
    blackKing,
    startingWhiteKing,
    startingBishops,
    conclaveSteps: getConclaveSteps(fen),
    isPhaseTwo,
    degenerateRepair,
    mateInThreeApplies: matePatternTurnsBySan.size > 0,
    matePatternTurnsBySan,
    phaseTwoWalls,
    targetCorner: getTargetCorner(
      blackKing,
      startingWhiteKing,
      fen,
      startingBishops,
    ),
    hasStartingWallPosition:
      blackKing !== undefined &&
      startingBishops.some((bishop) =>
        isInOpposition(bishop, blackKing, 2),
      ),
    hasStartingBishopWall: bishopsFormWall(startingBishops),
    proximateWall:
      blackKing === undefined
        ? null
        : getProximateBishopWall(startingBishops, blackKing),
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
    conclaveSteps,
    isPhaseTwo,
    degenerateRepair,
    mateInThreeApplies,
    matePatternTurnsBySan,
    phaseTwoWalls,
    targetCorner,
    hasStartingWallPosition,
    hasStartingBishopWall,
    proximateWall,
  } = context
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const resultBishops = getWhiteBishopSquares(resultFen)
  const resultProximateWall =
    blackKing === undefined
      ? null
      : getProximateBishopWall(resultBishops, blackKing)
  const resultWhiteKingSquare =
    move.piece === 'k' ? move.to : startingWhiteKing
  const resultHasPhaseTwoWall =
    blackKing !== undefined &&
    bishopsHaveValidPhaseTwoWall(
      resultFen,
      resultBishops,
      phaseTwoWalls,
      blackKing,
      targetCorner,
    )
  const sequesterTwoAwaySquares = getSequesterTwoAwaySquares(blackKing)
  const resultKingDistance =
    blackKing && resultWhiteKingSquare && move.piece === 'k'
      ? manhattanDistance(resultWhiteKingSquare, blackKing)
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
    sequesterApplies: isPhaseTwo,
    sequesterHasTargetCorner: targetCorner !== null,
    sequesterCurrentCornerDistance:
      targetCorner === null || blackKing === undefined
        ? 99
        : manhattanDistance(blackKing, targetCorner),
    sequesterMaximumCornerReplyDistance:
      targetCorner === null || blackReplyKings.length === 0
        ? 99
        : Math.max(
            ...blackReplyKings.map((square) =>
              manhattanDistance(square, targetCorner),
            ),
          ),
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
    sequesterBishopTargetDistance:
      targetCorner === null
        ? 0
        : resultBishops.reduce(
            (sum, bishop) =>
              sum + squaredEuclideanDistance(bishop, targetCorner),
            0,
          ),
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
    conclaveStepPenalty:
      move.piece === 'b' &&
      conclaveSteps.some(
        (step) => step.from === move.from && step.to === move.to,
      )
        ? 0
        : 1,
    supportWallPenalty:
      proximateWall &&
      blackKing &&
      startingWhiteKing &&
      resultWhiteKingSquare &&
      move.piece === 'k' &&
      (kingDistance(resultWhiteKingSquare, blackKing) <
        kingDistance(startingWhiteKing, blackKing) ||
        distanceToWallMoat(resultWhiteKingSquare, proximateWall) <
          distanceToWallMoat(startingWhiteKing, proximateWall))
        ? 0
        : 1,
    finishWallPenalty:
      blackKing &&
      move.piece === 'b' &&
      resultProximateWall !== null
        ? Math.min(
            ...resultBishops.map((bishop) => kingDistance(bishop, blackKing)),
          ) - 2
        : 99,
    startWallPenalty:
      blackKing &&
      !hasStartingWallPosition &&
      !hasStartingBishopWall &&
      move.piece === 'b' &&
      isInOpposition(move.to, blackKing, 2)
        ? 0
        : 1,
    kingCloserPhaseTwoLinePenalty:
      !isPhaseTwo ||
      blackKing === undefined ||
      edgeDistance(blackKing) !== 0
        ? 0
        : move.piece === 'k' &&
            isOnPhaseTwoKingLine(move.to, blackKing)
          ? 0
          : 1,
    kingCloserDistance: resultKingDistance,
  }
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

function distanceToWallMoat(
  square: Square,
  wall: ProximateBishopWall,
): number {
  const coordinates = squareCoordinates(square)
  return Math.abs(coordinates[wall.moatAxis] - wall.moatIndex)
}

type ConclaveStep = {
  readonly from: Square
  readonly to: Square
}

function getConclaveSteps(fen: string): readonly ConclaveStep[] {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  const bishops = getWhiteBishopSquares(fen)
  if (!whiteKing || !blackKing || bishops.length !== 2) return []
  const bishopSet = new Set(bishops)
  const steps: ConclaveStep[] = []

  for (const transform of D4_RELATIVE_TRANSFORMS) {
    const expectedBlackKing = relativeSquare(
      whiteKing.square,
      transform,
      2,
      -1,
    )
    const stationaryBishop = relativeSquare(
      whiteKing.square,
      transform,
      1,
      2,
    )
    const movingBishop = relativeSquare(
      whiteKing.square,
      transform,
      2,
      2,
    )
    const target = relativeSquare(whiteKing.square, transform, 1, 1)
    if (
      expectedBlackKing === null ||
      stationaryBishop === null ||
      movingBishop === null ||
      target === null ||
      expectedBlackKing !== blackKing.square ||
      !bishopSet.has(stationaryBishop) ||
      !bishopSet.has(movingBishop)
    ) {
      continue
    }
    if (!steps.some((step) => step.from === movingBishop && step.to === target)) {
      steps.push({ from: movingBishop, to: target })
    }
  }
  return steps
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
    id: 'phase 2 wall',
    shortLabel: 'phase 2 wall',
    helpText:
      "Phase 2: Create or maintain a 2 square wall not on the same side as the white king nor in the target corner, without placing a bishop on black's edge.",
    applies: (score) => score.phaseTwoWallApplies,
    compare: (first, second) =>
      first.phaseTwoWallPenalty - second.phaseTwoWallPenalty,
  },
  {
    id: 'sequester',
    shortLabel: 'sequester',
    helpText:
      "Phase 2: Force Black's king towards the target corner, or otherwise use a bishop to control the square 2 away from Black's current square.",
    applies: (score) => score.sequesterApplies,
    subpriorities: [
      {
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
    id: 'bishops away',
    shortLabel: 'bishops away',
    helpText:
      'Phase 2: When deciding between bishop moves, prefer larger distance from the target corner.',
    applies: (score) => score.sequesterApplies,
    subpriorities: [
      {
        when: (scores) =>
          scores.every((score) => score.sequesterIsBishopMove),
        compare: (first, second) =>
          second.sequesterBishopTargetDistance -
          first.sequesterBishopTargetDistance,
      },
    ],
  },
  {
    id: 'conclave step',
    shortLabel: 'conclave step',
    helpText:
      'Phase 1: When the pieces are in the position shown, make the conclave step.',
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) =>
      first.conclaveStepPenalty - second.conclaveStepPenalty,
  },
  {
    id: 'finish wall',
    shortLabel: 'finish wall',
    helpText: 'Phase 1: When possible, create the closest proximate bishop wall.',
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) =>
      first.finishWallPenalty - second.finishWallPenalty,
  },
  {
    id: 'support wall',
    shortLabel: 'support wall',
    helpText:
      "Phase 1: When the bishop wall is proximate, bring White's king closer to Black's king, or towards the wall's moat.",
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) =>
      first.supportWallPenalty - second.supportWallPenalty,
  },
  {
    id: 'start wall',
    shortLabel: 'start wall',
    helpText: "Phase 1: Place a bishop in two-square opposition to Black's king.",
    applies: (score) => !score.isPhaseTwoPosition,
    compare: (first, second) =>
      first.startWallPenalty - second.startWallPenalty,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText:
      "Bring White's king closer to Black's king. If in phase 2, prefer the rank/file 2 away from Black's edge.",
    compare: (first, second) =>
      first.kingCloserPhaseTwoLinePenalty -
        second.kingCloserPhaseTwoLinePenalty ||
      first.kingCloserDistance - second.kingCloserDistance,
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
