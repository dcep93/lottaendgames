import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  allSquares,
  edgeDistance,
  findPiece,
  getChess,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squaredEuclideanDistance,
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
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getTwoBishopsPhaseLabel,
  getWhiteBishopSquares,
  isTwoBishopsPhaseTwoPosition,
  squaredEuclideanDistanceToUnoccupiedCenter,
} from './twoBishopsGeometry'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from './types'

export type TwoBishopsWhiteMoveScore = {
  readonly isPhaseTwoPosition: boolean
  readonly matePenalty: number
  readonly bishopSafetyPenalty: number
  readonly stalematePenalty: number
  readonly ruleAPenalty: number
  readonly ruleC01Applies: boolean
  readonly ruleC01Penalty: number
  readonly ruleEApplies: boolean
  readonly ruleEPenalty: number
  readonly ruleB1Applies: boolean
  readonly ruleB1Penalty: number
  readonly ruleB2Applies: boolean
  readonly ruleB2Penalty: number
  readonly ruleB3Applies: boolean
  readonly ruleB3Penalty: number
  readonly ruleB5Applies: boolean
  readonly ruleB5Penalty: number
  readonly ruleB6Applies: boolean
  readonly ruleB6Penalty: number
  readonly ruleC03Applies: boolean
  readonly ruleC03Penalty: number
  readonly ruleC05Applies: boolean
  readonly ruleC05Penalty: number
  readonly ruleC07Applies: boolean
  readonly ruleC07Penalty: number
  readonly ruleC07DoubleRetreatPenalty: number
  readonly ruleC075Applies: boolean
  readonly ruleC075Penalty: number
  readonly ruleC08Applies: boolean
  readonly ruleC08Penalty: number
  readonly ruleC085Applies: boolean
  readonly ruleC085Penalty: number
  readonly ruleC09Applies: boolean
  readonly ruleC09Penalty: number
  readonly ruleC09RetreatPenalty: number
  readonly ruleC10Applies: boolean
  readonly ruleC10Penalty: number
  readonly ruleC12Applies: boolean
  readonly ruleC12Penalty: number
  readonly ruleC14Applies: boolean
  readonly ruleC14Penalty: number
  readonly ruleC15Applies: boolean
  readonly ruleC15Middle16Distance: number
  readonly ruleC15BlackKingDistance: number
  readonly ruleC20Applies: boolean
  readonly ruleC20Penalty: number
  readonly ruleF4Penalty: number
  readonly ruleF5Applies: boolean
  readonly ruleF5DiagonalLengthPenalty: number
  readonly ruleF5CenterPenalty: number
  readonly ruleG1Applies: boolean
  readonly ruleG1Penalty: number
  readonly ruleG5Applies: boolean
  readonly ruleG5NearerDistance: number
  readonly ruleG5FartherDistance: number
  readonly ruleG2CenterDistance: number
  readonly ruleG2BlackKingDistance: number
}

export type TwoBishopsBlackMoveScore = {
  readonly bishopCapturePenalty: number
  readonly centerDistance: number
  readonly unprotectedBishopDistance: number
}

const WHITE_INTRO =
  'White follows the ordered priorities below. The first priority that separates legal moves decides the recommendation.'
const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

const RULE_B1_NOTE_BOARD = {
  id: 'bishop-rule-b1', title: 'rule b1',
  caption: 'With the Phase 2 cage aimed at h1, White Kh6 and Black Kg4 or Kh4, play Bf6.',
  pieces: [{ square: 'h6', piece: 'K' }, { square: 'g4', piece: 'k' }, { square: 'e5', piece: 'B' }, { square: 'b1', piece: 'B' }],
  highlights: [{ square: 'h1', kind: 'pink' }, { square: 'f6', kind: 'key' }],
  arrows: [{ from: 'e5', to: 'f6' }],
} as const
const RULE_B2_NOTE_BOARD = {
  id: 'bishop-rule-b2', title: 'rule b2',
  caption: 'With the Phase 2 cage aimed at h1, White Kf5, Black Kh4, one bishop on e5, and the other anywhere from a2 through g8, play Kf4.',
  pieces: [{ square: 'f5', piece: 'K' }, { square: 'h4', piece: 'k' }, { square: 'd5', piece: 'B' }, { square: 'e5', piece: 'B' }],
  highlights: [{ square: 'h1', kind: 'pink' }, { square: 'f4', kind: 'key' }],
  arrows: [{ from: 'f5', to: 'f4' }],
} as const
const RULE_B3_NOTE_BOARD = {
  id: 'bishop-rule-b3', title: 'rule b3',
  caption: 'With White Kf4, Black Kd7, and bishops on e4 and e5, play Bd5.',
  pieces: [{ square: 'f4', piece: 'K' }, { square: 'd7', piece: 'k' }, { square: 'e4', piece: 'B' }, { square: 'e5', piece: 'B' }],
  highlights: [{ square: 'd5', kind: 'key' }],
  arrows: [{ from: 'e4', to: 'd5' }],
} as const
const RULE_B5_NOTE_BOARD = {
  id: 'bishop-rule-b5', title: 'rule b5',
  caption: 'With White Kd4, Black Kc2, and bishops on c3 and d5, play Ba2.',
  pieces: [{ square: 'd4', piece: 'K' }, { square: 'c2', piece: 'k' }, { square: 'c3', piece: 'B' }, { square: 'd5', piece: 'B' }],
  highlights: [{ square: 'a2', kind: 'key' }],
  arrows: [{ from: 'd5', to: 'a2' }],
} as const
const RULE_B6_NOTE_BOARD = {
  id: 'bishop-rule-b6', title: 'rule b6',
  caption: 'With White Kd5, Black Kf4, and bishops on d4 and e4, play Bc5.',
  pieces: [{ square: 'd5', piece: 'K' }, { square: 'f4', piece: 'k' }, { square: 'd4', piece: 'B' }, { square: 'e4', piece: 'B' }],
  highlights: [{ square: 'c5', kind: 'key' }],
  arrows: [{ from: 'd4', to: 'c5' }],
} as const
const RULE_C03_NOTE_BOARD = {
  id: 'bishop-rule-c03', title: 'rule c03',
  caption: 'The retreat square is adjacent to Black in the direction away from its caged corner. Here h3 is the retreat square; White controls it and the kings are in opposition, so White checks.',
  pieces: [{ square: 'f2', piece: 'K' }, { square: 'h2', piece: 'k' }, { square: 'e6', piece: 'B' }, { square: 'h8', piece: 'B' }],
  highlights: [{ square: 'h1', kind: 'pink' }, { square: 'h3', kind: 'key' }],
  arrows: [{ from: 'e6', to: 'h3' }],
} as const

const twoBishopsHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [BLACK_CAPTURE_PRIORITY, BLACK_RETURN_PRIORITY, 'Move toward the center.', 'Move toward an unprotected bishop.'],
  notes: [
    "Phase 2: Place one bishop on a long diagonal and the other on an adjacent diagonal. Both kings must be on the long diagonal's wider side. White's king must be no further by Euclidean distance to the middle square nearest the target corner: d4 for a1, d5 for a8, e4 for h1, or e5 for h8.",
    'Retreat square: the square adjacent to Black in the direction opposite its caged corner.',
  ],
  noteBoards: [RULE_B1_NOTE_BOARD, RULE_B2_NOTE_BOARD, RULE_B3_NOTE_BOARD, RULE_B5_NOTE_BOARD, RULE_B6_NOTE_BOARD, RULE_C03_NOTE_BOARD],
}

const BOARD_CORNERS: readonly Square[] = ['a1', 'a8', 'h1', 'h8']
type FlankDiagonalAxis = 'difference' | 'sum'

function middle16Distance(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  const axisDistance = (coordinate: number) => coordinate < 2 ? 2 - coordinate : coordinate > 5 ? coordinate - 5 : 0
  return axisDistance(file) + axisDistance(rank)
}

function longestDiagonalLength(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  return Math.max(8 - Math.abs(file - rank), 8 - Math.abs(file + rank - 7))
}

type CentralBishopLine = {
  readonly axis: 'file' | 'rank'
  readonly index: number
}

function centralBishopLine(
  bishops: readonly Square[],
): CentralBishopLine | undefined {
  if (
    bishops.length !== 2 ||
    bishops.some((bishop) => centerDistance(bishop) !== 0)
  ) {
    return undefined
  }
  const [first, second] = bishops.map(squareCoordinates)
  if (first.file === second.file) {
    return { axis: 'file', index: first.file }
  }
  if (first.rank === second.rank) {
    return { axis: 'rank', index: first.rank }
  }
  return undefined
}

function bishopsBelowLegalMoveThreshold(
  fen: string,
  bishops: readonly Square[],
  threshold: number,
): number {
  const whiteToMove = getChess(withFenTurn(fen, 'w'))
  return bishops.filter(
    (bishop) => whiteToMove.moves({ square: bishop }).length < threshold,
  ).length
}

function longDiagonalAxis(square: Square): FlankDiagonalAxis | undefined {
  const { file, rank } = squareCoordinates(square)
  if (file === rank) return 'difference'
  if (file + rank === 7) return 'sum'
  return undefined
}

function targetLongDiagonalAxis(corner: Square): FlankDiagonalAxis {
  return corner === 'a1' || corner === 'h8' ? 'difference' : 'sum'
}

function wallLongDiagonalAxis(corner: Square): FlankDiagonalAxis {
  return targetLongDiagonalAxis(corner) === 'difference' ? 'sum' : 'difference'
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
    id: 'rule a',
    shortLabel: 'rule a',
    helpText: "Prefer White's king not on the edge.",
    compare: (first, second) => first.ruleAPenalty - second.ruleAPenalty,
  },
  {
    id: 'rule e',
    shortLabel: 'rule e',
    helpText:
      'Prefer moves after which every Black reply is Phase 2 with a consistent target corner.',
    compare: (first, second) => first.ruleEPenalty - second.ruleEPenalty,
  },
  {
    id: 'rule b1',
    shortLabel: 'rule b1',
    helpText: 'Play the b1 move.',
    applies: (score) => score.ruleB1Applies,
    compare: (first, second) => first.ruleB1Penalty - second.ruleB1Penalty,
  },
  {
    id: 'rule b2',
    shortLabel: 'rule b2',
    helpText: 'Play the b2 move.',
    applies: (score) => score.ruleB2Applies,
    compare: (first, second) => first.ruleB2Penalty - second.ruleB2Penalty,
  },
  {
    id: 'rule b3',
    shortLabel: 'rule b3',
    helpText: 'Play the b3 move.',
    applies: (score) => score.ruleB3Applies,
    compare: (first, second) => first.ruleB3Penalty - second.ruleB3Penalty,
  },
  {
    id: 'rule b5',
    shortLabel: 'rule b5',
    helpText: 'Play the b5 move.',
    applies: (score) => score.ruleB5Applies,
    compare: (first, second) => first.ruleB5Penalty - second.ruleB5Penalty,
  },
  {
    id: 'rule b6',
    shortLabel: 'rule b6',
    helpText: 'Play the b6 move.',
    applies: (score) => score.ruleB6Applies,
    compare: (first, second) => first.ruleB6Penalty - second.ruleB6Penalty,
  },
  {
    id: 'rule c01',
    shortLabel: 'rule c01',
    helpText:
      "Phase 2: Prefer the king off the long diagonal wall. The target square's long diagonal is not the wall.",
    applies: (score) => score.ruleC01Applies,
    compare: (first, second) => first.ruleC01Penalty - second.ruleC01Penalty,
  },
  {
    id: 'rule c03',
    shortLabel: 'rule c03',
    helpText:
      'Phase 2: When the retreat square is controlled and Black is on track or one behind track, check.',
    applies: (score) => score.ruleC03Applies,
    compare: (first, second) => first.ruleC03Penalty - second.ruleC03Penalty,
  },
  {
    id: 'rule c05',
    shortLabel: 'rule c05',
    helpText:
      'Phase 2: With the kings in opposition, prefer controlling the retreat square.',
    applies: (score) => score.ruleC05Applies,
    compare: (first, second) => first.ruleC05Penalty - second.ruleC05Penalty,
  },
  {
    id: 'rule c07',
    shortLabel: 'rule c07',
    helpText:
      "Phase 2: With the Black king in the corner, prefer the White king on a square a knight's move from that corner, then control of the double retreat square.",
    applies: (score) => score.ruleC07Applies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleC07Penalty - second.ruleC07Penalty,
      },
      {
        compare: (first, second) =>
          first.ruleC07DoubleRetreatPenalty -
          second.ruleC07DoubleRetreatPenalty,
      },
    ],
  },
  {
    id: 'rule c07.5',
    shortLabel: 'rule c07.5',
    helpText:
      'Phase 2: With Black one behind track and 4 squares from the target corner, check.',
    applies: (score) => score.ruleC075Applies,
    compare: (first, second) => first.ruleC075Penalty - second.ruleC075Penalty,
  },
  {
    id: 'rule c08',
    shortLabel: 'rule c08',
    helpText:
      'Phase 2: With Black even on track and the double retreat square controlled, prefer king opposition.',
    applies: (score) => score.ruleC08Applies,
    compare: (first, second) => first.ruleC08Penalty - second.ruleC08Penalty,
  },
  {
    id: 'rule c08.5',
    shortLabel: 'rule c08.5',
    helpText:
      'Phase 2: With Black one ahead of track and control of the double retreat square, take opposition.',
    applies: (score) => score.ruleC085Applies,
    compare: (first, second) => first.ruleC085Penalty - second.ruleC085Penalty,
  },
  {
    id: 'rule c09',
    shortLabel: 'rule c09',
    helpText:
      'Phase 2: With Black ahead 1 on track and no control of retreat or double retreat squares, prefer controlling the flank square, then the retreat square.',
    applies: (score) => score.ruleC09Applies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleC09Penalty - second.ruleC09Penalty,
      },
      {
        compare: (first, second) =>
          first.ruleC09RetreatPenalty - second.ruleC09RetreatPenalty,
      },
    ],
  },
  {
    id: 'rule c10',
    shortLabel: 'rule c10',
    helpText:
      'Phase 2: If the retreat square is uncontrolled, take king opposition.',
    applies: (score) => score.ruleC10Applies,
    compare: (first, second) => first.ruleC10Penalty - second.ruleC10Penalty,
  },
  {
    id: 'rule c12',
    shortLabel: 'rule c12',
    helpText:
      'Phase 2: If Black is 1 behind or even on track, prefer control of the retreat square.',
    subpriorities: [
      {
        rank: (scores) => {
          const hasControlledRetreat = scores.some(
            (score) => score.ruleC12Applies && score.ruleC12Penalty === 0,
          )
          return scores.map((score) =>
            hasControlledRetreat &&
            (!score.ruleC12Applies || score.ruleC12Penalty !== 0)
              ? 1
              : 0,
          )
        },
      },
    ],
  },
  {
    id: 'rule c14',
    shortLabel: 'rule c14',
    helpText:
      'Phase 2: If the retreat square is controlled, prefer opposition.',
    applies: (score) => score.ruleC14Applies,
    compare: (first, second) => first.ruleC14Penalty - second.ruleC14Penalty,
  },
  {
    id: 'rule c15',
    shortLabel: 'rule c15',
    helpText:
      "Phase 2: Prefer proximity to the middle 16 squares, then to Black's king.",
    applies: (score) => score.ruleC15Applies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleC15Middle16Distance - second.ruleC15Middle16Distance,
      },
      {
        compare: (first, second) =>
          first.ruleC15BlackKingDistance - second.ruleC15BlackKingDistance,
      },
    ],
  },
  {
    id: 'rule c20',
    shortLabel: 'rule c20',
    helpText:
      'Phase 2: Force Black to be 1 behind, even, or 1 ahead of track.',
    applies: (score) => score.ruleC20Applies,
    compare: (first, second) => first.ruleC20Penalty - second.ruleC20Penalty,
  },
  {
    id: 'rule f4',
    shortLabel: 'rule f4',
    helpText:
      'Prefer unscreening bishops so that each has at least 3 legal moves.',
    compare: (first, second) => first.ruleF4Penalty - second.ruleF4Penalty,
  },
  {
    id: 'rule f5',
    shortLabel: 'rule f5',
    helpText:
      'Phase 1: Prefer more bishops on longer diagonals, then in the center.',
    applies: (score) => score.ruleF5Applies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleF5DiagonalLengthPenalty -
          second.ruleF5DiagonalLengthPenalty,
      },
      {
        compare: (first, second) =>
          first.ruleF5CenterPenalty - second.ruleF5CenterPenalty,
      },
    ],
  },
  {
    id: 'rule g1',
    shortLabel: 'rule g1',
    helpText:
      'With two central bishops, prefer the king in line with them.',
    applies: (score) => score.ruleG1Applies,
    compare: (first, second) => first.ruleG1Penalty - second.ruleG1Penalty,
  },
  {
    id: 'rule g2',
    shortLabel: 'rule g2',
    helpText:
      "Prefer king proximity to a center square not occupied by a bishop, then to Black's king.",
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleG2CenterDistance - second.ruleG2CenterDistance,
      },
      {
        compare: (first, second) =>
          first.ruleG2BlackKingDistance - second.ruleG2BlackKingDistance,
      },
    ],
  },
  {
    id: 'rule g5',
    shortLabel: 'rule g5',
    helpText:
      "Maximize the bishops' minimum Euclidean distance from Black's king, then their maximum Euclidean distance.",
    applies: (score) => score.ruleG5Applies,
    subpriorities: [
      {
        compare: (first, second) =>
          second.ruleG5NearerDistance - first.ruleG5NearerDistance,
      },
      {
        compare: (first, second) =>
          second.ruleG5FartherDistance - first.ruleG5FartherDistance,
      },
    ],
  },
]

const ACTIVE_TWO_BISHOPS_WHITE_RULE_IDS = [
  'mate', 'bishops safe', 'no stalemate', 'rule a', 'rule e', 'rule b1', 'rule b2', 'rule b3', 'rule b5', 'rule b6',
  'rule c01', 'rule c03', 'rule c05', 'rule c07', 'rule c07.5', 'rule c08', 'rule c08.5',
  'rule c09', 'rule c10', 'rule c12', 'rule c14', 'rule c15', 'rule c20', 'rule f4', 'rule f5', 'rule g1', 'rule g2', 'rule g5',
] as const

export const twoBishopsWhiteRules = ACTIVE_TWO_BISHOPS_WHITE_RULE_IDS.map((id) => {
  const rule = twoBishopsWhiteRuleCatalog.find((candidate) => candidate.id === id)
  if (rule === undefined) throw new Error(`Missing Two Bishops rule ${id}`)
  return rule
})

export function compareTwoBishopsWhiteScores(first: TwoBishopsWhiteMoveScore, second: TwoBishopsWhiteMoveScore): number {
  return compareScoresByRules(first, second, twoBishopsWhiteRules)
}

function neutralTwoBishopsWhiteMoveScore(overrides: Partial<TwoBishopsWhiteMoveScore>): TwoBishopsWhiteMoveScore {
  return {
    isPhaseTwoPosition: false, matePenalty: 1, bishopSafetyPenalty: 0, stalematePenalty: 0,
    ruleAPenalty: 0,
    ruleC01Applies: false, ruleC01Penalty: 0,
    ruleEApplies: false, ruleEPenalty: 0,
    ruleB1Applies: false, ruleB1Penalty: 0, ruleB2Applies: false, ruleB2Penalty: 0, ruleB3Applies: false, ruleB3Penalty: 0, ruleB5Applies: false, ruleB5Penalty: 0, ruleB6Applies: false, ruleB6Penalty: 0,
    ruleC03Applies: false, ruleC03Penalty: 0, ruleC05Applies: false, ruleC05Penalty: 0,
    ruleC07Applies: false, ruleC07Penalty: 0, ruleC07DoubleRetreatPenalty: 0,
    ruleC075Applies: false, ruleC075Penalty: 0, ruleC08Applies: false, ruleC08Penalty: 0,
    ruleC085Applies: false, ruleC085Penalty: 0, ruleC09Applies: false, ruleC09Penalty: 0, ruleC09RetreatPenalty: 0,
    ruleC10Applies: false, ruleC10Penalty: 0,
    ruleC12Applies: false, ruleC12Penalty: 0, ruleC14Applies: false, ruleC14Penalty: 0, ruleC15Applies: false, ruleC15Middle16Distance: 0, ruleC15BlackKingDistance: 0,
    ruleC20Applies: false, ruleC20Penalty: 0,
    ruleF4Penalty: 0,
    ruleF5Applies: false, ruleF5DiagonalLengthPenalty: 0, ruleF5CenterPenalty: 0,
    ruleG1Applies: false, ruleG1Penalty: 0,
    ruleG5Applies: false, ruleG5NearerDistance: 0, ruleG5FartherDistance: 0,
    ruleG2CenterDistance: 0, ruleG2BlackKingDistance: 0,
    ...overrides,
  }
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
    return moves.map((san) => ({
      san,
      score: neutralTwoBishopsWhiteMoveScore({
        matePenalty: san === mateSan ? 0 : 1,
      }),
    }))
  }

  const context = createActiveTwoBishopsWhitePositionContext(fen)
  return moves.map((san) => ({
    san,
    score: scoreActiveTwoBishopsWhiteMoveWithContext(fen, san, context),
  }))
}

interface ActiveTwoBishopsWhitePositionContext {
  readonly blackKing: Square | undefined
  readonly startingWhiteKing: Square | undefined
  readonly startingBishops: readonly Square[]
  readonly phaseTwoTargetCorners: readonly Square[]
  readonly ruleB1Target: Square | undefined
  readonly ruleB2Target: Square | undefined
  readonly ruleB3Target: Square | undefined
  readonly ruleB5Target: Square | undefined
  readonly ruleB6Target: Square | undefined
  readonly ruleC03Applies: boolean
  readonly ruleC03RetreatSquare: Square | undefined
  readonly ruleC05Target: Square | undefined
  readonly ruleC07Applies: boolean
  readonly ruleC08Applies: boolean
  readonly ruleC085Applies: boolean
  readonly ruleC09Targets: readonly Square[]
  readonly ruleC075Applies: boolean
  readonly ruleC10Applies: boolean
  readonly ruleC14Applies: boolean
  readonly ruleC15Applies: boolean
  readonly ruleC20Applies: boolean
  readonly ruleG1Line: CentralBishopLine | undefined
}

function retreatSquare(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
  trackWhiteKing?: Square,
): Square | undefined {
  return retreatTrackSquare(fen, bishops, blackKing, 1, trackWhiteKing)
}

function doubleRetreatSquaresFromCage(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
): readonly Square[] {
  const square = retreatTrackSquare(fen, bishops, blackKing, 2)
  return square === undefined ? [] : [square]
}

type TrackAxis = 'file' | 'rank'

function trackedKingsFromCagedCorner(
  bishops: readonly Square[],
  whiteKing: Square,
  blackKing: Square,
): { readonly corner: Square; readonly axis: TrackAxis } | undefined {
  const isKnightTracked = isKnightMove(whiteKing, blackKing)
  const isOppositionTracked = isInOpposition(whiteKing, blackKing, 1)
  if (!isKnightTracked && !isOppositionTracked) return undefined

  const corner = ruleQ5CagedCorners(bishops, blackKing).reduce<
    Square | undefined
  >((closest, candidate) => {
    if (closest === undefined) return candidate
    return kingDistance(candidate, blackKing) < kingDistance(closest, blackKing)
      ? candidate
      : closest
  }, undefined)
  if (corner === undefined) return undefined

  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const target = squareCoordinates(corner)
  const fileDelta = Math.abs(white.file - black.file)
  const rankDelta = Math.abs(white.rank - black.rank)
  const moatAxis: TrackAxis | undefined =
    fileDelta === 2 ? 'file' : rankDelta === 2 ? 'rank' : undefined
  if (moatAxis === undefined) return undefined
  const moatIndex = (white[moatAxis] + black[moatAxis]) / 2
  const blackMoatSide = Math.sign(black[moatAxis] - moatIndex)
  const targetMoatSide = Math.sign(target[moatAxis] - moatIndex)
  if (blackMoatSide === 0 || blackMoatSide !== targetMoatSide) return undefined

  const axis: TrackAxis = moatAxis === 'file' ? 'rank' : 'file'
  return { corner, axis }
}

function retreatTrackSquare(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
  distance: 1 | 2,
  trackWhiteKing?: Square,
): Square | undefined {
  if (blackKing === undefined || !isTwoBishopsPhaseTwoPosition(fen)) {
    return undefined
  }
  const whiteKing = trackWhiteKing ?? findPiece(fen, 'w', 'k')?.square
  if (whiteKing === undefined) return undefined
  const track = trackedKingsFromCagedCorner(bishops, whiteKing, blackKing)
  if (track === undefined) return undefined

  const black = squareCoordinates(blackKing)
  const target = squareCoordinates(track.corner)
  const trackAxis = track.axis
  const blackCoordinate = trackAxis === 'file' ? black.file : black.rank
  const cornerCoordinate = trackAxis === 'file' ? target.file : target.rank
  const direction =
    Math.sign(blackCoordinate - cornerCoordinate) ||
    (cornerCoordinate === 0 ? 1 : -1)
  return (
    squareFromCoordinates(
      trackAxis === 'file'
        ? black.file + distance * direction
        : black.file,
      trackAxis === 'rank'
        ? black.rank + distance * direction
        : black.rank,
    ) ?? undefined
  )
}

function ruleC10Applies(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
): boolean {
  if (!isTwoBishopsPhaseTwoPosition(fen)) return false
  const oppositeCornerSquare = retreatSquare(
    fen,
    bishops,
    blackKing,
  )
  return (
    oppositeCornerSquare !== undefined &&
    !getChess(fen).isAttacked(oppositeCornerSquare, 'w')
  )
}

function blackIsOneAheadOfTrack(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): boolean {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isTwoBishopsPhaseTwoPosition(fen) ||
    !isKnightMove(whiteKing, blackKing)
  ) {
    return false
  }
  const distances = trackDistancesFromCagedCorner(
    bishops,
    whiteKing,
    blackKing,
  )
  return (
    distances !== undefined && distances.black + 1 === distances.white
  )
}

function blackIsOneBehindTrack(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): boolean {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isTwoBishopsPhaseTwoPosition(fen) ||
    !isKnightMove(whiteKing, blackKing)
  ) {
    return false
  }
  const distances = trackDistancesFromCagedCorner(
    bishops,
    whiteKing,
    blackKing,
  )
  return (
    distances !== undefined && distances.black === distances.white + 1
  )
}

function blackIsEvenOnTrack(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): boolean {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isTwoBishopsPhaseTwoPosition(fen) ||
    !isInOpposition(whiteKing, blackKing, 1)
  ) {
    return false
  }
  const distances = trackDistancesFromCagedCorner(
    bishops,
    whiteKing,
    blackKing,
  )
  return distances !== undefined && distances.black === distances.white
}

function trackDistancesFromCagedCorner(
  bishops: readonly Square[],
  whiteKing: Square,
  blackKing: Square,
): { readonly white: number; readonly black: number } | undefined {
  const track = trackedKingsFromCagedCorner(bishops, whiteKing, blackKing)
  if (track === undefined) return undefined

  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const target = squareCoordinates(track.corner)
  const trackAxis = track.axis
  return {
    white: Math.abs(white[trackAxis] - target[trackAxis]),
    black: Math.abs(black[trackAxis] - target[trackAxis]),
  }
}

function ruleC09FlankSquares(
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): readonly Square[] {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isKnightMove(whiteKing, blackKing)
  ) {
    return []
  }
  return allSquares().filter(
    (square) =>
      square !== whiteKing &&
      square !== blackKing &&
      kingDistance(square, blackKing) === 1 &&
      isKnightMove(square, whiteKing),
  )
}

function ruleC075Applies(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): boolean {
  if (
    blackKing === undefined ||
    !blackIsOneBehindTrack(fen, bishops, whiteKing, blackKing)
  ) {
    return false
  }
  const black = squareCoordinates(blackKing)
  return ruleQ5CagedCorners(bishops, blackKing).some((corner) => {
    const target = squareCoordinates(corner)
    const sharesEdge = black.file === target.file || black.rank === target.rank
    return sharesEdge && kingDistance(blackKing, corner) === 4
  })
}

function ruleC03TrackApplies(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): boolean {
  if (whiteKing === undefined || blackKing === undefined) return false
  if (blackIsEvenOnTrack(fen, bishops, whiteKing, blackKing)) return true
  return blackIsOneBehindTrack(fen, bishops, whiteKing, blackKing)
}

function ruleB1TargetSquare(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): Square | undefined {
  if (
    whiteKing === undefined ||
    blackKing === undefined
  ) {
    return undefined
  }
  const legalBishopDestinations = new Set(
    getChess(fen)
      .moves({ verbose: true })
      .filter((move) => move.piece === 'b')
      .map((move) => move.to),
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const transformedBlackKings = [
      transformSquare('g4', transform),
      transformSquare('h4', transform),
    ]
    const target = transformSquare('f6', transform)
    const requiredBishops = [
      transformSquare('e5', transform),
      transformSquare('b1', transform),
    ]
    if (
      whiteKing === transformSquare('h6', transform) &&
      transformedBlackKings.includes(blackKing) &&
      bishops.length === requiredBishops.length &&
      requiredBishops.every((bishop) => bishops.includes(bishop)) &&
      legalBishopDestinations.has(target)
    ) {
      return target
    }
  }
  return undefined
}

function ruleB2TargetSquare(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): Square | undefined {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isTwoBishopsPhaseTwoPosition(fen)
  ) {
    return undefined
  }
  const cagedCorners = ruleQ5CagedCorners(bishops, blackKing)
  const legalKingDestinations = new Set(
    getChess(fen)
      .moves({ verbose: true })
      .filter((move) => move.piece === 'k')
      .map((move) => move.to),
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const corner = transformSquare('h1', transform)
    const target = transformSquare('f4', transform)
    const fixedBishop = transformSquare('e5', transform)
    const partnerDiagonal = ['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8']
      .map((square) => transformSquare(square as Square, transform))
    if (
      whiteKing === transformSquare('f5', transform) &&
      blackKing === transformSquare('h4', transform) &&
      bishops.length === 2 &&
      bishops.includes(fixedBishop) &&
      bishops.some((bishop) => partnerDiagonal.includes(bishop)) &&
      cagedCorners.includes(corner) &&
      legalKingDestinations.has(target)
    ) {
      return target
    }
  }
  return undefined
}

function ruleB3TargetSquare(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): Square | undefined {
  if (whiteKing === undefined || blackKing === undefined) return undefined
  const legalBishopDestinations = new Set(
    getChess(fen)
      .moves({ verbose: true })
      .filter((move) => move.piece === 'b')
      .map((move) => move.to),
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const target = transformSquare('d5', transform)
    const requiredBishops = [
      transformSquare('e4', transform),
      transformSquare('e5', transform),
    ]
    if (
      whiteKing === transformSquare('f4', transform) &&
      blackKing === transformSquare('d7', transform) &&
      bishops.length === requiredBishops.length &&
      requiredBishops.every((bishop) => bishops.includes(bishop)) &&
      legalBishopDestinations.has(target)
    ) {
      return target
    }
  }
  return undefined
}

function ruleB5TargetSquare(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): Square | undefined {
  if (whiteKing === undefined || blackKing === undefined) return undefined
  const legalBishopDestinations = new Set(
    getChess(fen)
      .moves({ verbose: true })
      .filter((move) => move.piece === 'b')
      .map((move) => move.to),
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const target = transformSquare('a2', transform)
    const requiredBishops = [
      transformSquare('c3', transform),
      transformSquare('d5', transform),
    ]
    if (
      whiteKing === transformSquare('d4', transform) &&
      blackKing === transformSquare('c2', transform) &&
      bishops.length === requiredBishops.length &&
      requiredBishops.every((bishop) => bishops.includes(bishop)) &&
      legalBishopDestinations.has(target)
    ) {
      return target
    }
  }
  return undefined
}

function ruleB6TargetSquare(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): Square | undefined {
  if (whiteKing === undefined || blackKing === undefined) return undefined
  const legalBishopDestinations = new Set(
    getChess(fen)
      .moves({ verbose: true })
      .filter((move) => move.piece === 'b')
      .map((move) => move.to),
  )
  for (const transform of SQUARE_TRANSFORMS) {
    const target = transformSquare('c5', transform)
    const requiredBishops = [
      transformSquare('d4', transform),
      transformSquare('e4', transform),
    ]
    if (
      whiteKing === transformSquare('d5', transform) &&
      blackKing === transformSquare('f4', transform) &&
      bishops.length === requiredBishops.length &&
      requiredBishops.every((bishop) => bishops.includes(bishop)) &&
      legalBishopDestinations.has(target)
    ) {
      return target
    }
  }
  return undefined
}

function createActiveTwoBishopsWhitePositionContext(
  fen: string,
): ActiveTwoBishopsWhitePositionContext {
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const startingBishops = getWhiteBishopSquares(fen)
  const startingWhiteKing = findPiece(fen, 'w', 'k')?.square
  const isPhaseTwo = isTwoBishopsPhaseTwoPosition(fen)
  const kingsInOpposition =
    startingWhiteKing !== undefined &&
    blackKing !== undefined &&
    isInOpposition(startingWhiteKing, blackKing, 1)
  const currentRetreatSquare = retreatSquare(
    fen,
    startingBishops,
    blackKing,
  )
  const doubleRetreatControlled =
    isPhaseTwo &&
    doubleRetreatSquaresFromCage(fen, startingBishops, blackKing).some(
      (square) => getChess(fen).isAttacked(square, 'w'),
    )
  const retreatOrDoubleRetreatControlled = [
    ...(currentRetreatSquare === undefined ? [] : [currentRetreatSquare]),
    ...doubleRetreatSquaresFromCage(fen, startingBishops, blackKing),
  ].some((square) => getChess(fen).isAttacked(square, 'w'))
  return {
    blackKing,
    startingWhiteKing,
    startingBishops,
    phaseTwoTargetCorners: isPhaseTwo
      ? phaseTwoTargetCorners(
          startingBishops,
          startingWhiteKing,
          blackKing,
        )
      : [],
    ruleB1Target: ruleB1TargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleB2Target: ruleB2TargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleB3Target: ruleB3TargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleB5Target: ruleB5TargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleB6Target: ruleB6TargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleC03Applies:
      isPhaseTwo &&
      ruleC03TrackApplies(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      ) &&
      currentRetreatSquare !== undefined,
    ruleC03RetreatSquare: currentRetreatSquare,
    ruleC05Target:
      isPhaseTwo && kingsInOpposition
        ? currentRetreatSquare
        : undefined,
    ruleC07Applies:
      isPhaseTwo &&
      blackKing !== undefined &&
      BOARD_CORNERS.includes(blackKing),
    ruleC08Applies:
      doubleRetreatControlled &&
      blackIsEvenOnTrack(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      ),
    ruleC085Applies:
      doubleRetreatControlled &&
      blackIsOneAheadOfTrack(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      ),
    ruleC09Targets:
      isPhaseTwo &&
      !retreatOrDoubleRetreatControlled &&
      blackIsOneAheadOfTrack(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      )
        ? ruleC09FlankSquares(startingWhiteKing, blackKing)
        : [],
    ruleC075Applies: ruleC075Applies(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleC10Applies: ruleC10Applies(fen, startingBishops, blackKing),
    ruleC14Applies:
      isPhaseTwo &&
      currentRetreatSquare !== undefined &&
      getChess(fen).isAttacked(currentRetreatSquare, 'w'),
    ruleC15Applies: isPhaseTwo,
    ruleC20Applies: isPhaseTwo,
    ruleG1Line: centralBishopLine(startingBishops),
  }
}

function ruleQ5CagedCorners(
  bishops: readonly Square[],
  blackKing: Square | undefined,
): readonly Square[] {
  if (blackKing === undefined) return []
  const black = squareCoordinates(blackKing)
  const corners = new Set<Square>()

  bishops.forEach((cornerBishop, cornerIndex) => {
    const corner = squareCoordinates(cornerBishop)
    const cornerAxes: readonly FlankDiagonalAxis[] = [
      ...(corner.file === corner.rank ? ['difference' as const] : []),
      ...(corner.file + corner.rank === 7 ? ['sum' as const] : []),
    ]

    cornerAxes.forEach((axis) => {
      const blackSide =
        axis === 'difference'
          ? black.file - black.rank
          : black.file + black.rank - 7
      if (Math.abs(blackSide) <= 1) return
      const direction = Math.sign(blackSide)
      const hasInnerBishop = bishops.some((innerBishop, innerIndex) => {
        if (innerIndex === cornerIndex) return false
        const inner = squareCoordinates(innerBishop)
        const innerIndexOnAxis =
          axis === 'difference'
            ? inner.file - inner.rank
            : inner.file + inner.rank - 7
        return innerIndexOnAxis === -direction
      })
      if (!hasInnerBishop) return

      corners.add(
        axis === 'sum'
          ? direction > 0
            ? 'h8'
            : 'a1'
          : direction > 0
            ? 'h1'
            : 'a8',
      )
    })
  })

  return [...corners]
}

function phaseTwoTargetCorners(
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): readonly Square[] {
  if (whiteKing === undefined || blackKing === undefined) return []
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const corners = new Set<Square>()

  bishops.forEach((longBishop, longIndex) => {
    const long = squareCoordinates(longBishop)
    const longAxes: readonly FlankDiagonalAxis[] = [
      ...(long.file === long.rank ? ['difference' as const] : []),
      ...(long.file + long.rank === 7 ? ['sum' as const] : []),
    ]

    longAxes.forEach((axis) => {
      const blackSide =
        axis === 'difference'
          ? black.file - black.rank
          : black.file + black.rank - 7
      const whiteSide =
        axis === 'difference'
          ? white.file - white.rank
          : white.file + white.rank - 7
      if (
        blackSide === 0 ||
        Math.sign(whiteSide) !== Math.sign(blackSide)
      ) {
        return
      }
      const direction = Math.sign(blackSide)
      const hasInnerBishop = bishops.some((innerBishop, innerIndex) => {
        if (innerIndex === longIndex) return false
        const inner = squareCoordinates(innerBishop)
        const innerDiagonal =
          axis === 'difference'
            ? inner.file - inner.rank
            : inner.file + inner.rank - 7
        return innerDiagonal === -direction
      })
      if (!hasInnerBishop) return

      corners.add(
        axis === 'sum'
          ? direction > 0
            ? 'h8'
            : 'a1'
          : direction > 0
            ? 'h1'
            : 'a8',
      )
    })
  })

  return [...corners]
}

function bishopControlsSquareFrom(
  chess: ReturnType<typeof getChess>,
  bishop: Square,
  target: Square,
): boolean {
  if (bishop === target) return false
  if (!squaresShareDiagonal(bishop, target)) return false
  const from = squareCoordinates(bishop)
  const to = squareCoordinates(target)
  const fileStep = Math.sign(to.file - from.file)
  const rankStep = Math.sign(to.rank - from.rank)
  let file = from.file + fileStep
  let rank = from.rank + rankStep

  while (file !== to.file && rank !== to.rank) {
    const square = squareFromCoordinates(file, rank)
    if (square === null || chess.get(square)) return false
    file += fileStep
    rank += rankStep
  }

  return true
}

function squaresShareDiagonal(first: Square, second: Square): boolean {
  const firstCoordinates = squareCoordinates(first)
  const secondCoordinates = squareCoordinates(second)
  return (
    Math.abs(firstCoordinates.file - secondCoordinates.file) ===
    Math.abs(firstCoordinates.rank - secondCoordinates.rank)
  )
}

function scoreActiveTwoBishopsWhiteMoveWithContext(
  fen: string,
  san: string,
  context: ActiveTwoBishopsWhitePositionContext,
): TwoBishopsWhiteMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const resultWhiteKing =
    move.piece === 'k' ? move.to : context.startingWhiteKing
  const resultBishops = getWhiteBishopSquares(resultFen)
  const mate = chess.isCheckmate()
  const blackMoves = chess.moves({ verbose: true })
  const givesCheck = chess.inCheck()
  const resultIsPhaseTwo = isTwoBishopsPhaseTwoPosition(resultFen)
  const resultRuleC12Applies =
    resultIsPhaseTwo &&
    context.startingWhiteKing !== undefined &&
    context.blackKing !== undefined &&
    (blackIsEvenOnTrack(
      resultFen,
      resultBishops,
      context.startingWhiteKing,
      context.blackKing,
    ) ||
      blackIsOneBehindTrack(
        resultFen,
        resultBishops,
        context.startingWhiteKing,
        context.blackKing,
      ))
  const resultRetreatSquare = retreatSquare(
    resultFen,
    resultBishops,
    context.blackKing,
    context.startingWhiteKing,
  )
  const everyBlackReplyPreservesRuleE = blackMoves.every((reply) => {
    chess.move(reply.san)
    const replyFen = chess.fen()
    const replyBlackKing = findPiece(replyFen, 'b', 'k')?.square
    const replyPreservesRuleE =
      isTwoBishopsPhaseTwoPosition(replyFen) &&
      (context.phaseTwoTargetCorners.length === 0 ||
        phaseTwoTargetCorners(
          getWhiteBishopSquares(replyFen),
          resultWhiteKing,
          replyBlackKing,
        ).some((corner) => context.phaseTwoTargetCorners.includes(corner)))
    chess.undo()
    return replyPreservesRuleE
  })
  const everyBlackReplyStaysWithinOneTrack = blackMoves.every((reply) => {
    chess.move(reply.san)
    const replyFen = chess.fen()
    const replyBlackKing = findPiece(replyFen, 'b', 'k')?.square
    const replyBishops = getWhiteBishopSquares(replyFen)
    const replyIsTracked =
      resultWhiteKing !== undefined &&
      replyBlackKing !== undefined &&
      isTwoBishopsPhaseTwoPosition(replyFen) &&
      (blackIsEvenOnTrack(
        replyFen,
        replyBishops,
        resultWhiteKing,
        replyBlackKing,
      ) ||
        blackIsOneBehindTrack(
          replyFen,
          replyBishops,
          resultWhiteKing,
          replyBlackKing,
        ) ||
        blackIsOneAheadOfTrack(
          replyFen,
          replyBishops,
          resultWhiteKing,
          replyBlackKing,
        ))
    chess.undo()
    return replyIsTracked
  })
  return neutralTwoBishopsWhiteMoveScore({
    isPhaseTwoPosition: resultIsPhaseTwo,
    matePenalty: mate ? 0 : 1,
    bishopSafetyPenalty: blackMoves.some((reply) => reply.captured === 'b')
      ? 1
      : 0,
    stalematePenalty: !mate && chess.isStalemate() ? 1 : 0,
    ruleAPenalty:
      resultWhiteKing !== undefined && edgeDistance(resultWhiteKing) === 0
        ? 1
        : 0,
    ruleC01Applies: context.phaseTwoTargetCorners.length > 0,
    ruleC01Penalty:
      resultWhiteKing !== undefined &&
      context.phaseTwoTargetCorners.some(
        (corner) =>
          longDiagonalAxis(resultWhiteKing) === wallLongDiagonalAxis(corner),
      )
        ? 1
        : 0,
    ruleEApplies: true,
    ruleEPenalty: everyBlackReplyPreservesRuleE ? 0 : 1,
    ruleB1Applies: context.ruleB1Target !== undefined,
    ruleB1Penalty:
      move.piece === 'b' && move.to === context.ruleB1Target ? 0 : 1,
    ruleB2Applies: context.ruleB2Target !== undefined,
    ruleB2Penalty:
      move.piece === 'k' && move.to === context.ruleB2Target ? 0 : 1,
    ruleB3Applies: context.ruleB3Target !== undefined,
    ruleB3Penalty:
      move.piece === 'b' && move.to === context.ruleB3Target ? 0 : 1,
    ruleB5Applies: context.ruleB5Target !== undefined,
    ruleB5Penalty:
      move.piece === 'b' && move.to === context.ruleB5Target ? 0 : 1,
    ruleB6Applies: context.ruleB6Target !== undefined,
    ruleB6Penalty:
      move.piece === 'b' && move.to === context.ruleB6Target ? 0 : 1,
    ruleC03Applies: context.ruleC03Applies,
    ruleC03Penalty:
      givesCheck &&
      context.ruleC03RetreatSquare !== undefined &&
      chess.isAttacked(context.ruleC03RetreatSquare, 'w')
        ? 0
        : 1,
    ruleC05Applies: context.ruleC05Target !== undefined,
    ruleC05Penalty:
      context.ruleC05Target !== undefined &&
      chess.isAttacked(context.ruleC05Target, 'w')
        ? 0
        : 1,
    ruleC07Applies: context.ruleC07Applies,
    ruleC07Penalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isKnightMove(resultWhiteKing, context.blackKing)
        ? 0
        : 1,
    ruleC07DoubleRetreatPenalty:
      context.ruleC07Applies &&
      doubleRetreatSquaresFromCage(
        chess.fen(),
        resultBishops,
        context.blackKing,
      ).some((square) => chess.isAttacked(square, 'w'))
        ? 0
        : 1,
    ruleC08Applies: context.ruleC08Applies,
    ruleC08Penalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isInOpposition(resultWhiteKing, context.blackKing, 1)
        ? 0
        : 1,
    ruleC085Applies: context.ruleC085Applies,
    ruleC085Penalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isInOpposition(resultWhiteKing, context.blackKing, 1)
        ? 0
        : 1,
    ruleC09Applies: context.ruleC09Targets.length > 0,
    ruleC09Penalty: context.ruleC09Targets.some((target) =>
      resultBishops.some((bishop) =>
        bishopControlsSquareFrom(chess, bishop, target),
      ),
    )
      ? 0
      : 1,
    ruleC09RetreatPenalty:
      resultRetreatSquare !== undefined &&
      chess.isAttacked(resultRetreatSquare, 'w')
        ? 0
        : 1,
    ruleC075Applies: context.ruleC075Applies,
    ruleC075Penalty: givesCheck ? 0 : 1,
    ruleC10Applies: context.ruleC10Applies,
    ruleC10Penalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isInOpposition(resultWhiteKing, context.blackKing, 1)
        ? 0
        : 1,
    ruleC12Applies: resultRuleC12Applies,
    ruleC12Penalty:
      resultRuleC12Applies &&
      resultRetreatSquare !== undefined &&
      chess.isAttacked(resultRetreatSquare, 'w')
        ? 0
        : 1,
    ruleC14Applies: context.ruleC14Applies,
    ruleC14Penalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isInOpposition(resultWhiteKing, context.blackKing, 1)
        ? 0
        : 1,
    ruleC15Applies: context.ruleC15Applies,
    ruleC15Middle16Distance:
      resultWhiteKing === undefined ? 99 : middle16Distance(resultWhiteKing),
    ruleC15BlackKingDistance:
      resultWhiteKing === undefined || context.blackKing === undefined
        ? 99
        : manhattanDistance(resultWhiteKing, context.blackKing),
    ruleC20Applies: context.ruleC20Applies,
    ruleC20Penalty: everyBlackReplyStaysWithinOneTrack ? 0 : 1,
    ruleF4Penalty: bishopsBelowLegalMoveThreshold(resultFen, resultBishops, 3),
    ruleF5Applies: !context.ruleC15Applies && resultBishops.length > 0,
    ruleF5DiagonalLengthPenalty:
      -resultBishops.reduce(
        (total, bishop) => total + longestDiagonalLength(bishop),
        0,
      ),
    ruleF5CenterPenalty:
      2 - resultBishops.filter((bishop) => centerDistance(bishop) === 0).length,
    ruleG1Applies: context.ruleG1Line !== undefined,
    ruleG1Penalty:
      context.ruleG1Line !== undefined && resultWhiteKing !== undefined
        ? squareCoordinates(resultWhiteKing)[context.ruleG1Line.axis] ===
          context.ruleG1Line.index
          ? 0
          : 1
        : 0,
    ruleG5Applies:
      context.blackKing !== undefined && resultBishops.length > 0,
    ruleG5NearerDistance:
      context.blackKing === undefined || resultBishops.length === 0
        ? 0
        : Math.min(
            ...resultBishops.map((bishop) =>
              squaredEuclideanDistance(bishop, context.blackKing!),
            ),
          ),
    ruleG5FartherDistance:
      context.blackKing === undefined || resultBishops.length === 0
        ? 0
        : Math.max(
            ...resultBishops.map((bishop) =>
              squaredEuclideanDistance(bishop, context.blackKing!),
            ),
          ),
    ruleG2CenterDistance:
      resultWhiteKing === undefined
        ? 99
        : squaredEuclideanDistanceToUnoccupiedCenter(
            resultWhiteKing,
            resultBishops,
          ),
    ruleG2BlackKingDistance:
      resultWhiteKing === undefined || context.blackKing === undefined
        ? 99
        : squaredEuclideanDistance(resultWhiteKing, context.blackKing),
  })
}

export function scoreTwoBishopsWhiteMove(fen: string, san: string): TwoBishopsWhiteMoveScore {
  return scoreActiveTwoBishopsWhiteMoveWithContext(fen, san, createActiveTwoBishopsWhitePositionContext(fen))
}

export function getIdealTwoBishopsWhiteMoves(fen: string): string[] {
  const moves = whiteLegalMoves(fen)
  return [...selectIdealMoves(scoreWhiteCandidates(fen, moves), twoBishopsWhiteRules)]
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

export const twoBishopsRuleSet: MateRuleSet<TwoBishopsWhiteMoveScore> = {
  id: 'two-bishops',
  phase: getTwoBishopsPhaseLabel,
  scoreWhite: scoreTwoBishopsWhiteMove,
  scoreWhiteCandidates,
  whiteRules: twoBishopsWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: getBlackCandidates,
  help: twoBishopsHelp,
}

export { getProximateBishopWall, getTwoBishopsPhaseLabel, isTwoBishopsPhaseTwoPosition } from './twoBishopsGeometry'
