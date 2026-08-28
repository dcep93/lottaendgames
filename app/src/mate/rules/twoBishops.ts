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
import {
  compareScoresByRules,
  selectCandidatesByRules,
} from './selection'
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
  readonly ruleHApplies: boolean
  readonly ruleHPenalty: number
  readonly ruleBApplies: boolean
  readonly ruleBPenalty: number
  readonly ruleCApplies: boolean
  readonly ruleCPenalty: number
  readonly ruleDApplies: boolean
  readonly ruleDPenalty: number
  readonly ruleEApplies: boolean
  readonly ruleEPenalty: number
  readonly ruleFApplies: boolean
  readonly ruleFPenalty: number
  readonly ruleGApplies: boolean
  readonly ruleGPenalty: number
  readonly ruleIApplies: boolean
  readonly ruleIPenalty: number
  readonly ruleJApplies: boolean
  readonly ruleJPenalty: number
  readonly ruleKApplies: boolean
  readonly ruleKPenalty: number
  readonly ruleKDoubleRetreatPenalty: number
  readonly ruleLApplies: boolean
  readonly ruleLPenalty: number
  readonly ruleMApplies: boolean
  readonly ruleMPenalty: number
  readonly ruleNApplies: boolean
  readonly ruleNPenalty: number
  readonly ruleNRetreatPenalty: number
  readonly ruleOApplies: boolean
  readonly ruleOPenalty: number
  readonly rulePApplies: boolean
  readonly rulePPenalty: number
  readonly ruleQApplies: boolean
  readonly ruleQPenalty: number
  readonly ruleRApplies: boolean
  readonly ruleRMiddle16Distance: number
  readonly ruleRBlackKingDistance: number
  readonly ruleSApplies: boolean
  readonly ruleSPenalty: number
  readonly ruleTPenalty: number
  readonly ruleUApplies: boolean
  readonly ruleUDiagonalLengthPenalty: number
  readonly ruleUCenterPenalty: number
  readonly ruleVApplies: boolean
  readonly ruleVPenalty: number
  readonly ruleXPenalty: number
  readonly ruleYApplies: boolean
  readonly ruleYNearerDistance: number
  readonly ruleYFartherDistance: number
  readonly ruleWCenterDistance: number
  readonly ruleWBlackKingDistance: number
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

const RULE_C_NOTE_BOARD = {
  id: 'bishop-rule-c', title: 'rule c',
  caption: 'With the Phase 2 cage aimed at h1, White Kf5, Black Kh4, one bishop on e5, and the other anywhere from a2 through g8, play Kf4.',
  pieces: [{ square: 'f5', piece: 'K' }, { square: 'h4', piece: 'k' }, { square: 'd5', piece: 'B' }, { square: 'e5', piece: 'B' }],
  highlights: [{ square: 'h1', kind: 'pink' }, { square: 'f4', kind: 'key' }],
  arrows: [{ from: 'f5', to: 'f4' }],
} as const
const RULE_D_NOTE_BOARD = {
  id: 'bishop-rule-d', title: 'rule d',
  caption: 'With White Kf4, Black Kd7, and bishops on e4 and e5, play Bd5.',
  pieces: [{ square: 'f4', piece: 'K' }, { square: 'd7', piece: 'k' }, { square: 'e4', piece: 'B' }, { square: 'e5', piece: 'B' }],
  highlights: [{ square: 'd5', kind: 'key' }],
  arrows: [{ from: 'e4', to: 'd5' }],
} as const
const RULE_E_NOTE_BOARD = {
  id: 'bishop-rule-e', title: 'rule e',
  caption: 'With White Kd4, Black Kc2, and bishops on c3 and d5, play Ba2.',
  pieces: [{ square: 'd4', piece: 'K' }, { square: 'c2', piece: 'k' }, { square: 'c3', piece: 'B' }, { square: 'd5', piece: 'B' }],
  highlights: [{ square: 'a2', kind: 'key' }],
  arrows: [{ from: 'd5', to: 'a2' }],
} as const
const RULE_F_NOTE_BOARD = {
  id: 'bishop-rule-f', title: 'rule f',
  caption: 'With White Kd5, Black Kf4, and bishops on d4 and e4, play Bc5.',
  pieces: [{ square: 'd5', piece: 'K' }, { square: 'f4', piece: 'k' }, { square: 'd4', piece: 'B' }, { square: 'e4', piece: 'B' }],
  highlights: [{ square: 'c5', kind: 'key' }],
  arrows: [{ from: 'd4', to: 'c5' }],
} as const
const RULE_G_NOTE_BOARD = {
  id: 'bishop-rule-g', title: 'rule g',
  caption: 'With White Kh5, Black Kf5, and bishops on d4 and d5, play Bc3.',
  pieces: [{ square: 'h5', piece: 'K' }, { square: 'f5', piece: 'k' }, { square: 'd4', piece: 'B' }, { square: 'd5', piece: 'B' }],
  highlights: [{ square: 'c3', kind: 'key' }],
  arrows: [{ from: 'd4', to: 'c3' }],
} as const
const RULE_I_NOTE_BOARD = {
  id: 'bishop-rule-i', title: 'rule i',
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
  noteBoards: [RULE_C_NOTE_BOARD, RULE_D_NOTE_BOARD, RULE_E_NOTE_BOARD, RULE_F_NOTE_BOARD, RULE_G_NOTE_BOARD, RULE_I_NOTE_BOARD],
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

function hasAdjacentKingBishopKingLine(
  blackKing: Square,
  bishop: Square,
  whiteKing: Square,
): boolean {
  const black = squareCoordinates(blackKing)
  const middle = squareCoordinates(bishop)
  const white = squareCoordinates(whiteKing)
  const fileStep = middle.file - black.file
  const rankStep = middle.rank - black.rank
  return (
    Math.max(Math.abs(fileStep), Math.abs(rankStep)) === 1 &&
    white.file - middle.file === fileStep &&
    white.rank - middle.rank === rankStep
  )
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
    id: 'rule b',
    shortLabel: 'rule b',
    helpText:
      'Prefer moves after which every Black reply is Phase 2 with a consistent target corner.',
    compare: (first, second) => first.ruleBPenalty - second.ruleBPenalty,
  },
  {
    id: 'rule c',
    shortLabel: 'rule c',
    helpText: 'Play the b2 move.',
    applies: (score) => score.ruleCApplies,
    compare: (first, second) => first.ruleCPenalty - second.ruleCPenalty,
  },
  {
    id: 'rule d',
    shortLabel: 'rule d',
    helpText: 'Play the b3 move.',
    applies: (score) => score.ruleDApplies,
    compare: (first, second) => first.ruleDPenalty - second.ruleDPenalty,
  },
  {
    id: 'rule e',
    shortLabel: 'rule e',
    helpText: 'Play the b5 move.',
    applies: (score) => score.ruleEApplies,
    compare: (first, second) => first.ruleEPenalty - second.ruleEPenalty,
  },
  {
    id: 'rule f',
    shortLabel: 'rule f',
    helpText: 'Play the b6 move.',
    applies: (score) => score.ruleFApplies,
    compare: (first, second) => first.ruleFPenalty - second.ruleFPenalty,
  },
  {
    id: 'rule g',
    shortLabel: 'rule g',
    helpText: 'Play the b7 move.',
    applies: (score) => score.ruleGApplies,
    compare: (first, second) => first.ruleGPenalty - second.ruleGPenalty,
  },
  {
    id: 'rule h',
    shortLabel: 'rule h',
    helpText:
      "Phase 2: Prefer the king off the long diagonal wall. The target square's long diagonal is not the wall.",
    applies: (score) => score.ruleHApplies,
    compare: (first, second) => first.ruleHPenalty - second.ruleHPenalty,
  },
  {
    id: 'rule i',
    shortLabel: 'rule i',
    helpText:
      'Phase 2: When the retreat square is controlled and Black is on track or one behind track, check.',
    applies: (score) => score.ruleIApplies,
    compare: (first, second) => first.ruleIPenalty - second.ruleIPenalty,
  },
  {
    id: 'rule j',
    shortLabel: 'rule j',
    helpText:
      'Phase 2: With the kings in opposition, prefer controlling the retreat square.',
    applies: (score) => score.ruleJApplies,
    compare: (first, second) => first.ruleJPenalty - second.ruleJPenalty,
  },
  {
    id: 'rule k',
    shortLabel: 'rule k',
    helpText:
      "Phase 2: With the Black king in the corner, prefer the White king on a square a knight's move from that corner, then control of the double retreat square.",
    applies: (score) => score.ruleKApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleKPenalty - second.ruleKPenalty,
      },
      {
        compare: (first, second) =>
          first.ruleKDoubleRetreatPenalty -
          second.ruleKDoubleRetreatPenalty,
      },
    ],
  },
  {
    id: 'rule l',
    shortLabel: 'rule l',
    helpText:
      'Phase 2: With Black one behind track and 4 squares from the target corner, check.',
    applies: (score) => score.ruleLApplies,
    compare: (first, second) => first.ruleLPenalty - second.ruleLPenalty,
  },
  {
    id: 'rule m',
    shortLabel: 'rule m',
    helpText:
      'Phase 2: With Black one ahead of track and control of the double retreat square, take opposition.',
    applies: (score) => score.ruleMApplies,
    compare: (first, second) => first.ruleMPenalty - second.ruleMPenalty,
  },
  {
    id: 'rule n',
    shortLabel: 'rule n',
    helpText:
      'Phase 2: With Black ahead 1 on track and no control of retreat or double retreat squares, prefer controlling the flank square, then the retreat square.',
    applies: (score) => score.ruleNApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleNPenalty - second.ruleNPenalty,
      },
      {
        compare: (first, second) =>
          first.ruleNRetreatPenalty - second.ruleNRetreatPenalty,
      },
    ],
  },
  {
    id: 'rule o',
    shortLabel: 'rule o',
    helpText:
      'Phase 2: If the retreat square is uncontrolled, take king opposition.',
    applies: (score) => score.ruleOApplies,
    compare: (first, second) => first.ruleOPenalty - second.ruleOPenalty,
  },
  {
    id: 'rule p',
    shortLabel: 'rule p',
    helpText:
      'Phase 2: If Black is 1 behind or even on track, prefer control of the retreat square.',
    subpriorities: [
      {
        rank: (scores) => {
          const hasControlledRetreat = scores.some(
            (score) => score.rulePApplies && score.rulePPenalty === 0,
          )
          return scores.map((score) =>
            hasControlledRetreat &&
            (!score.rulePApplies || score.rulePPenalty !== 0)
              ? 1
              : 0,
          )
        },
      },
    ],
  },
  {
    id: 'rule q',
    shortLabel: 'rule q',
    helpText:
      'Phase 2: If the retreat square is controlled, prefer opposition.',
    applies: (score) => score.ruleQApplies,
    compare: (first, second) => first.ruleQPenalty - second.ruleQPenalty,
  },
  {
    id: 'rule r',
    shortLabel: 'rule r',
    helpText:
      "Phase 2: Prefer proximity to the middle 16 squares, then to Black's king.",
    applies: (score) => score.ruleRApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleRMiddle16Distance - second.ruleRMiddle16Distance,
      },
      {
        compare: (first, second) =>
          first.ruleRBlackKingDistance - second.ruleRBlackKingDistance,
      },
    ],
  },
  {
    id: 'rule s',
    shortLabel: 'rule s',
    helpText:
      'Phase 2: Force Black to be 1 behind, even, or 1 ahead of track.',
    applies: (score) => score.ruleSApplies,
    compare: (first, second) => first.ruleSPenalty - second.ruleSPenalty,
  },
  {
    id: 'rule t',
    shortLabel: 'rule t',
    helpText: 'Prefer bishops to have at least 4 legal moves.',
    compare: (first, second) => first.ruleTPenalty - second.ruleTPenalty,
  },
  {
    id: 'rule u',
    shortLabel: 'rule u',
    helpText:
      'Phase 1: Prefer more bishops on longer diagonals, then in the center.',
    applies: (score) => score.ruleUApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleUDiagonalLengthPenalty -
          second.ruleUDiagonalLengthPenalty,
      },
      {
        compare: (first, second) =>
          first.ruleUCenterPenalty - second.ruleUCenterPenalty,
      },
    ],
  },
  {
    id: 'rule v',
    shortLabel: 'rule v',
    helpText:
      'With two central bishops, prefer the king in line with them.',
    applies: (score) => score.ruleVApplies,
    compare: (first, second) => first.ruleVPenalty - second.ruleVPenalty,
  },
  {
    id: 'rule w',
    shortLabel: 'rule w',
    helpText:
      "Prefer king proximity to a center square not occupied by a bishop, then to Black's king.",
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleWCenterDistance - second.ruleWCenterDistance,
      },
      {
        compare: (first, second) =>
          first.ruleWBlackKingDistance - second.ruleWBlackKingDistance,
      },
    ],
  },
  {
    id: 'rule x',
    shortLabel: 'rule x',
    helpText:
      "Prefer Black's king, a bishop, and White's king all adjacent in line.",
    compare: (first, second) => first.ruleXPenalty - second.ruleXPenalty,
  },
  {
    id: 'rule y',
    shortLabel: 'rule y',
    helpText:
      "Maximize the bishops' minimum Euclidean distance from Black's king, then their maximum Euclidean distance.",
    applies: (score) => score.ruleYApplies,
    subpriorities: [
      {
        compare: (first, second) =>
          second.ruleYNearerDistance - first.ruleYNearerDistance,
      },
      {
        compare: (first, second) =>
          second.ruleYFartherDistance - first.ruleYFartherDistance,
      },
    ],
  },
]

const ACTIVE_TWO_BISHOPS_WHITE_RULE_IDS = [
  'mate', 'bishops safe', 'no stalemate', 'rule a', 'rule b', 'rule c', 'rule d', 'rule e', 'rule f', 'rule g',
  'rule h', 'rule i', 'rule j', 'rule k', 'rule l', 'rule m',
  'rule n', 'rule o', 'rule p', 'rule q', 'rule r', 'rule s', 'rule t', 'rule u', 'rule v', 'rule w', 'rule x', 'rule y',
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
    ruleHApplies: false, ruleHPenalty: 0,
    ruleBApplies: false, ruleBPenalty: 0,
    ruleCApplies: false, ruleCPenalty: 0, ruleDApplies: false, ruleDPenalty: 0, ruleEApplies: false, ruleEPenalty: 0, ruleFApplies: false, ruleFPenalty: 0, ruleGApplies: false, ruleGPenalty: 0,
    ruleIApplies: false, ruleIPenalty: 0, ruleJApplies: false, ruleJPenalty: 0,
    ruleKApplies: false, ruleKPenalty: 0, ruleKDoubleRetreatPenalty: 0,
    ruleLApplies: false, ruleLPenalty: 0,
    ruleMApplies: false, ruleMPenalty: 0, ruleNApplies: false, ruleNPenalty: 0, ruleNRetreatPenalty: 0,
    ruleOApplies: false, ruleOPenalty: 0,
    rulePApplies: false, rulePPenalty: 0, ruleQApplies: false, ruleQPenalty: 0, ruleRApplies: false, ruleRMiddle16Distance: 0, ruleRBlackKingDistance: 0,
    ruleSApplies: false, ruleSPenalty: 0,
    ruleTPenalty: 0,
    ruleUApplies: false, ruleUDiagonalLengthPenalty: 0, ruleUCenterPenalty: 0,
    ruleVApplies: false, ruleVPenalty: 0,
    ruleXPenalty: 0,
    ruleYApplies: false, ruleYNearerDistance: 0, ruleYFartherDistance: 0,
    ruleWCenterDistance: 0, ruleWBlackKingDistance: 0,
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
  readonly ruleCTarget: Square | undefined
  readonly ruleDTarget: Square | undefined
  readonly ruleETarget: Square | undefined
  readonly ruleFTarget: Square | undefined
  readonly ruleGTarget: Square | undefined
  readonly ruleIApplies: boolean
  readonly ruleIRetreatSquare: Square | undefined
  readonly ruleJTarget: Square | undefined
  readonly ruleKApplies: boolean
  readonly ruleMApplies: boolean
  readonly ruleNTargets: readonly Square[]
  readonly ruleLApplies: boolean
  readonly ruleOApplies: boolean
  readonly ruleQApplies: boolean
  readonly ruleRApplies: boolean
  readonly ruleSApplies: boolean
  readonly ruleVLine: CentralBishopLine | undefined
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

  const corner = phaseTwoCagedCorners(bishops, blackKing).reduce<
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

function ruleOApplies(
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

function ruleNFlankSquares(
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

function ruleLApplies(
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
  return phaseTwoCagedCorners(bishops, blackKing).some((corner) => {
    const target = squareCoordinates(corner)
    const sharesEdge = black.file === target.file || black.rank === target.rank
    return sharesEdge && kingDistance(blackKing, corner) === 4
  })
}

function ruleITrackApplies(
  fen: string,
  bishops: readonly Square[],
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): boolean {
  if (whiteKing === undefined || blackKing === undefined) return false
  if (blackIsEvenOnTrack(fen, bishops, whiteKing, blackKing)) return true
  return blackIsOneBehindTrack(fen, bishops, whiteKing, blackKing)
}

function ruleCTargetSquare(
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
  const cagedCorners = phaseTwoCagedCorners(bishops, blackKing)
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

function ruleDTargetSquare(
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

function ruleETargetSquare(
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

function ruleFTargetSquare(
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

function ruleGTargetSquare(
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
    const target = transformSquare('c3', transform)
    const requiredBishops = [
      transformSquare('d4', transform),
      transformSquare('d5', transform),
    ]
    if (
      whiteKing === transformSquare('h5', transform) &&
      blackKing === transformSquare('f5', transform) &&
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
    ruleCTarget: ruleCTargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleDTarget: ruleDTargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleETarget: ruleETargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleFTarget: ruleFTargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleGTarget: ruleGTargetSquare(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleIApplies:
      isPhaseTwo &&
      ruleITrackApplies(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      ) &&
      currentRetreatSquare !== undefined,
    ruleIRetreatSquare: currentRetreatSquare,
    ruleJTarget:
      isPhaseTwo && kingsInOpposition
        ? currentRetreatSquare
        : undefined,
    ruleKApplies:
      isPhaseTwo &&
      blackKing !== undefined &&
      BOARD_CORNERS.includes(blackKing),
    ruleMApplies:
      doubleRetreatControlled &&
      blackIsOneAheadOfTrack(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      ),
    ruleNTargets:
      isPhaseTwo &&
      !retreatOrDoubleRetreatControlled &&
      blackIsOneAheadOfTrack(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      )
        ? ruleNFlankSquares(startingWhiteKing, blackKing)
        : [],
    ruleLApplies: ruleLApplies(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleOApplies: ruleOApplies(fen, startingBishops, blackKing),
    ruleQApplies:
      isPhaseTwo &&
      currentRetreatSquare !== undefined &&
      getChess(fen).isAttacked(currentRetreatSquare, 'w'),
    ruleRApplies: isPhaseTwo,
    ruleSApplies: isPhaseTwo,
    ruleVLine: centralBishopLine(startingBishops),
  }
}

function phaseTwoCagedCorners(
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
  const resultRulePApplies =
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
  const everyBlackReplyPreservesRuleB = blackMoves.every((reply) => {
    chess.move(reply.san)
    const replyFen = chess.fen()
    const replyBlackKing = findPiece(replyFen, 'b', 'k')?.square
    const replyPreservesRuleB =
      isTwoBishopsPhaseTwoPosition(replyFen) &&
      (context.phaseTwoTargetCorners.length === 0 ||
        phaseTwoTargetCorners(
          getWhiteBishopSquares(replyFen),
          resultWhiteKing,
          replyBlackKing,
        ).some((corner) => context.phaseTwoTargetCorners.includes(corner)))
    chess.undo()
    return replyPreservesRuleB
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
    ruleHApplies: context.phaseTwoTargetCorners.length > 0,
    ruleHPenalty:
      resultWhiteKing !== undefined &&
      context.phaseTwoTargetCorners.some(
        (corner) =>
          longDiagonalAxis(resultWhiteKing) === wallLongDiagonalAxis(corner),
      )
        ? 1
        : 0,
    ruleBApplies: true,
    ruleBPenalty: everyBlackReplyPreservesRuleB ? 0 : 1,
    ruleCApplies: context.ruleCTarget !== undefined,
    ruleCPenalty:
      move.piece === 'k' && move.to === context.ruleCTarget ? 0 : 1,
    ruleDApplies: context.ruleDTarget !== undefined,
    ruleDPenalty:
      move.piece === 'b' && move.to === context.ruleDTarget ? 0 : 1,
    ruleEApplies: context.ruleETarget !== undefined,
    ruleEPenalty:
      move.piece === 'b' && move.to === context.ruleETarget ? 0 : 1,
    ruleFApplies: context.ruleFTarget !== undefined,
    ruleFPenalty:
      move.piece === 'b' && move.to === context.ruleFTarget ? 0 : 1,
    ruleGApplies: context.ruleGTarget !== undefined,
    ruleGPenalty:
      move.piece === 'b' && move.to === context.ruleGTarget ? 0 : 1,
    ruleIApplies: context.ruleIApplies,
    ruleIPenalty:
      givesCheck &&
      context.ruleIRetreatSquare !== undefined &&
      chess.isAttacked(context.ruleIRetreatSquare, 'w')
        ? 0
        : 1,
    ruleJApplies: context.ruleJTarget !== undefined,
    ruleJPenalty:
      context.ruleJTarget !== undefined &&
      chess.isAttacked(context.ruleJTarget, 'w')
        ? 0
        : 1,
    ruleKApplies: context.ruleKApplies,
    ruleKPenalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isKnightMove(resultWhiteKing, context.blackKing)
        ? 0
        : 1,
    ruleKDoubleRetreatPenalty:
      context.ruleKApplies &&
      doubleRetreatSquaresFromCage(
        chess.fen(),
        resultBishops,
        context.blackKing,
      ).some((square) => chess.isAttacked(square, 'w'))
        ? 0
        : 1,
    ruleMApplies: context.ruleMApplies,
    ruleMPenalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isInOpposition(resultWhiteKing, context.blackKing, 1)
        ? 0
        : 1,
    ruleNApplies: context.ruleNTargets.length > 0,
    ruleNPenalty: context.ruleNTargets.some((target) =>
      resultBishops.some((bishop) =>
        bishopControlsSquareFrom(chess, bishop, target),
      ),
    )
      ? 0
      : 1,
    ruleNRetreatPenalty:
      resultRetreatSquare !== undefined &&
      chess.isAttacked(resultRetreatSquare, 'w')
        ? 0
        : 1,
    ruleLApplies: context.ruleLApplies,
    ruleLPenalty: givesCheck ? 0 : 1,
    ruleOApplies: context.ruleOApplies,
    ruleOPenalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isInOpposition(resultWhiteKing, context.blackKing, 1)
        ? 0
        : 1,
    rulePApplies: resultRulePApplies,
    rulePPenalty:
      resultRulePApplies &&
      resultRetreatSquare !== undefined &&
      chess.isAttacked(resultRetreatSquare, 'w')
        ? 0
        : 1,
    ruleQApplies: context.ruleQApplies,
    ruleQPenalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      isInOpposition(resultWhiteKing, context.blackKing, 1)
        ? 0
        : 1,
    ruleRApplies: context.ruleRApplies,
    ruleRMiddle16Distance:
      resultWhiteKing === undefined ? 99 : middle16Distance(resultWhiteKing),
    ruleRBlackKingDistance:
      resultWhiteKing === undefined || context.blackKing === undefined
        ? 99
        : manhattanDistance(resultWhiteKing, context.blackKing),
    ruleSApplies: context.ruleSApplies,
    ruleSPenalty: everyBlackReplyStaysWithinOneTrack ? 0 : 1,
    ruleTPenalty: bishopsBelowLegalMoveThreshold(resultFen, resultBishops, 4),
    ruleUApplies: !context.ruleRApplies && resultBishops.length > 0,
    ruleUDiagonalLengthPenalty:
      -resultBishops.reduce(
        (total, bishop) => total + longestDiagonalLength(bishop),
        0,
      ),
    ruleUCenterPenalty:
      2 - resultBishops.filter((bishop) => centerDistance(bishop) === 0).length,
    ruleVApplies: context.ruleVLine !== undefined,
    ruleVPenalty:
      context.ruleVLine !== undefined && resultWhiteKing !== undefined
        ? squareCoordinates(resultWhiteKing)[context.ruleVLine.axis] ===
          context.ruleVLine.index
          ? 0
          : 1
        : 0,
    ruleXPenalty:
      resultWhiteKing !== undefined &&
      context.blackKing !== undefined &&
      resultBishops.some((bishop) =>
        hasAdjacentKingBishopKingLine(
          context.blackKing!,
          bishop,
          resultWhiteKing,
        ),
      )
        ? 0
        : 1,
    ruleYApplies:
      context.blackKing !== undefined && resultBishops.length > 0,
    ruleYNearerDistance:
      context.blackKing === undefined || resultBishops.length === 0
        ? 0
        : Math.min(
            ...resultBishops.map((bishop) =>
              squaredEuclideanDistance(bishop, context.blackKing!),
            ),
          ),
    ruleYFartherDistance:
      context.blackKing === undefined || resultBishops.length === 0
        ? 0
        : Math.max(
            ...resultBishops.map((bishop) =>
              squaredEuclideanDistance(bishop, context.blackKing!),
            ),
          ),
    ruleWCenterDistance:
      resultWhiteKing === undefined
        ? 99
        : squaredEuclideanDistanceToUnoccupiedCenter(
            resultWhiteKing,
            resultBishops,
          ),
    ruleWBlackKingDistance:
      resultWhiteKing === undefined || context.blackKing === undefined
        ? 99
        : squaredEuclideanDistance(resultWhiteKing, context.blackKing),
  })
}

export function scoreTwoBishopsWhiteMove(fen: string, san: string): TwoBishopsWhiteMoveScore {
  return scoreActiveTwoBishopsWhiteMoveWithContext(fen, san, createActiveTwoBishopsWhitePositionContext(fen))
}

export function getIdealTwoBishopsWhiteMoves(fen: string): string[] {
  return [...analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves]
}

export type TwoBishopsWhiteSelectionAnalysis = {
  readonly idealWhiteMoves: readonly string[]
  readonly ruleFilterCounts: Readonly<Record<string, number>>
}

export function analyzeTwoBishopsWhiteSelection(
  fen: string,
): TwoBishopsWhiteSelectionAnalysis {
  const moves = whiteLegalMoves(fen)
  const selection = selectCandidatesByRules(
    scoreWhiteCandidates(fen, moves),
    twoBishopsWhiteRules,
  )
  const ruleFilterCounts = Object.fromEntries(
    twoBishopsWhiteRules.map((rule) => [rule.id, 0]),
  ) as Record<string, number>
  for (const rule of selection.eliminatedBy.values()) {
    ruleFilterCounts[rule.id] = (ruleFilterCounts[rule.id] ?? 0) + 1
  }
  return Object.freeze({
    idealWhiteMoves: Object.freeze(
      selection.idealCandidates.map(({ san }) => san),
    ),
    ruleFilterCounts: Object.freeze(ruleFilterCounts),
  })
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
