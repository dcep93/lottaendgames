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
  kingStepsToCenter,
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
  readonly ruleAApplies: boolean
  readonly ruleAPenalty: number
  readonly ruleB1Applies: boolean
  readonly ruleB1Penalty: number
  readonly ruleB2Applies: boolean
  readonly ruleB2Penalty: number
  readonly ruleB3Applies: boolean
  readonly ruleB3Penalty: number
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
  readonly ruleC9Applies: boolean
  readonly ruleC9Penalty: number
  readonly ruleC10Applies: boolean
  readonly ruleC10Penalty: number
  readonly ruleC11Applies: boolean
  readonly ruleC11Penalty: number
  readonly ruleC12Applies: boolean
  readonly ruleC12Penalty: number
  readonly ruleC15Applies: boolean
  readonly ruleC15Middle16Distance: number
  readonly ruleC15BlackKingDistance: number
  readonly ruleD7Applies: boolean
  readonly ruleD7Penalty: number
  readonly ruleD9Applies: boolean
  readonly ruleD9ShapePenalty: number
  readonly ruleD9BlackKingDistance: number
  readonly ruleD10Applies: boolean
  readonly ruleD10Penalty: number
  readonly ruleD10BlackKingDistance: number
  readonly ruleD18Applies: boolean
  readonly ruleD18Penalty: number
  readonly ruleD20Applies: boolean
  readonly ruleD20Penalty: number
  readonly ruleD25Applies: boolean
  readonly ruleD25Penalty: number
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
  caption: 'With the Phase 2 cage aimed at h1, White Kf5 and Black Kh4, play Kf4.',
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
    "Phase 2: Place one bishop on a long diagonal and the other on an adjacent diagonal. Both kings must be on the long diagonal's wider side, and White's king must take fewer king steps to reach the center than Black's king.",
    'Retreat square: the square adjacent to Black in the direction opposite its caged corner.',
  ],
  noteBoards: [RULE_B1_NOTE_BOARD, RULE_B2_NOTE_BOARD, RULE_B3_NOTE_BOARD, RULE_C03_NOTE_BOARD],
}

const BOARD_CORNERS: readonly Square[] = ['a1', 'a8', 'h1', 'h8']
type FlankDiagonalAxis = 'difference' | 'sum'

function middle16Distance(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  const axisDistance = (coordinate: number) => coordinate < 2 ? 2 - coordinate : coordinate > 5 ? coordinate - 5 : 0
  return axisDistance(file) + axisDistance(rank)
}

function isLongDiagonalSquare(square: Square): boolean {
  const { file, rank } = squareCoordinates(square)
  return file === rank || file + rank === 7
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

function centralOppositionSideSquares(
  whiteKing: Square | undefined,
  blackKing: Square | undefined,
): { readonly targets: readonly Square[]; readonly between: Square } | undefined {
  if (
    whiteKing === undefined ||
    blackKing === undefined ||
    !isInOpposition(whiteKing, blackKing, 1)
  ) {
    return undefined
  }
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  const between = squareFromCoordinates(
    (white.file + black.file) / 2,
    (white.rank + black.rank) / 2,
  )
  if (between === null) return undefined
  const sideSquares =
    white.file === black.file
      ? [
          squareFromCoordinates(black.file - 1, black.rank),
          squareFromCoordinates(black.file + 1, black.rank),
        ]
      : [
          squareFromCoordinates(black.file, black.rank - 1),
          squareFromCoordinates(black.file, black.rank + 1),
        ]
  const validSquares = sideSquares.filter(
    (square): square is Square => square !== null,
  )
  if (validSquares.length === 0) return undefined
  const bestDistance = Math.min(...validSquares.map(centerDistance))
  return {
    targets: validSquares.filter(
      (square) => centerDistance(square) === bestDistance,
    ),
    between,
  }
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
    id: 'rule a',
    shortLabel: 'rule a',
    helpText: 'Prefer phase 2 with a consistent target corner.',
    compare: (first, second) => first.ruleAPenalty - second.ruleAPenalty,
  },
  {
    id: 'rule b1',
    shortLabel: 'rule b1',
    helpText: 'Play the b1 move.',
    applies: (score) => score.ruleB1Applies,
    stopWhenBest: (score) => score.ruleB1Penalty === 0,
    compare: (first, second) => first.ruleB1Penalty - second.ruleB1Penalty,
  },
  {
    id: 'rule b2',
    shortLabel: 'rule b2',
    helpText: 'Play the b2 move.',
    applies: (score) => score.ruleB2Applies,
    stopWhenBest: (score) => score.ruleB2Penalty === 0,
    compare: (first, second) => first.ruleB2Penalty - second.ruleB2Penalty,
  },
  {
    id: 'rule b3',
    shortLabel: 'rule b3',
    helpText: 'Play the b3 move.',
    applies: (score) => score.ruleB3Applies,
    stopWhenBest: (score) => score.ruleB3Penalty === 0,
    compare: (first, second) => first.ruleB3Penalty - second.ruleB3Penalty,
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
    stopWhenBest: (score) => score.ruleC05Penalty === 0,
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
    id: 'rule c7.5',
    shortLabel: 'rule c7.5',
    helpText:
      'Phase 2: With Black one behind track and 4 squares from the target corner, check.',
    applies: (score) => score.ruleC075Applies,
    compare: (first, second) => first.ruleC075Penalty - second.ruleC075Penalty,
  },
  {
    id: 'rule c08',
    shortLabel: 'rule c08',
    helpText:
      'Phase 2: With the double retreat square controlled, prefer king opposition.',
    applies: (score) => score.ruleC08Applies,
    stopWhenBest: (score) => score.ruleC08Penalty === 0,
    compare: (first, second) => first.ruleC08Penalty - second.ruleC08Penalty,
  },
  {
    id: 'rule c08.5',
    shortLabel: 'rule c08.5',
    helpText:
      'Phase 2: With Black one ahead of track and control of the double retreat square, take opposition.',
    applies: (score) => score.ruleC085Applies,
    stopWhenBest: (score) => score.ruleC085Penalty === 0,
    compare: (first, second) => first.ruleC085Penalty - second.ruleC085Penalty,
  },
  {
    id: 'rule c9',
    shortLabel: 'rule c9',
    helpText:
      'With Black ahead 1 on track and no control of retreat or double retreat squares, control the flank square.',
    applies: (score) => score.ruleC9Applies,
    compare: (first, second) => first.ruleC9Penalty - second.ruleC9Penalty,
  },
  {
    id: 'rule c10',
    shortLabel: 'rule c10',
    helpText:
      'Phase 2: If the retreat square is uncontrolled, take king opposition.',
    applies: (score) => score.ruleC10Applies,
    stopWhenBest: (score) => score.ruleC10Penalty === 0,
    compare: (first, second) => first.ruleC10Penalty - second.ruleC10Penalty,
  },
  {
    id: 'rule c11',
    shortLabel: 'rule c11',
    helpText: 'Phase 2: Prefer Black on the edge of the board.',
    applies: (score) => score.ruleC11Applies,
    compare: (first, second) => first.ruleC11Penalty - second.ruleC11Penalty,
  },
  {
    id: 'rule c12',
    shortLabel: 'rule c12',
    helpText:
      'Phase 2: If black is on track, prefer control of the retreat square.',
    applies: (score) => score.ruleC12Applies,
    stopWhenBest: (score) => score.ruleC12Penalty === 0,
    compare: (first, second) => first.ruleC12Penalty - second.ruleC12Penalty,
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
    id: 'rule d7',
    shortLabel: 'rule d7',
    helpText: 'Prefer a bishop on a long diagonal.',
    applies: (score) => score.ruleD7Applies,
    compare: (first, second) => first.ruleD7Penalty - second.ruleD7Penalty,
  },
  {
    id: 'rule d9',
    shortLabel: 'rule d9',
    helpText:
      "If no long diagonals are controlled, prefer a bishop on an edge square 2 from the corner, further from Black's king.",
    applies: (score) => score.ruleD9Applies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleD9ShapePenalty - second.ruleD9ShapePenalty,
      },
      {
        compare: (first, second) =>
          second.ruleD9BlackKingDistance - first.ruleD9BlackKingDistance,
      },
    ],
  },
  {
    id: 'rule d12',
    shortLabel: 'rule d12',
    helpText:
      'Prefer the king not occupying the only controlled long diagonal.',
    applies: (score) => score.ruleD18Applies,
    compare: (first, second) => first.ruleD18Penalty - second.ruleD18Penalty,
  },
  {
    id: 'rule d16',
    shortLabel: 'rule d16',
    helpText: "Prefer proximity to the center, then to Black's king.",
    applies: (score) => score.ruleD10Applies,
    subpriorities: [
      {
        compare: (first, second) =>
          first.ruleD10Penalty - second.ruleD10Penalty,
      },
      {
        compare: (first, second) =>
          first.ruleD10BlackKingDistance - second.ruleD10BlackKingDistance,
      },
    ],
  },
  {
    id: 'rule d20',
    shortLabel: 'rule d20',
    helpText:
      'With the kings in opposition, bishop control the more central Black king side square, without controlling the square between the kings.',
    applies: (score) => score.ruleD20Applies,
    compare: (first, second) => first.ruleD20Penalty - second.ruleD20Penalty,
  },
  {
    id: 'rule d25',
    shortLabel: 'rule d25',
    helpText:
      'With the White king in the center, prefer the long diagonal bishop adjacent to it, without checking.',
    applies: (score) => score.ruleD25Applies,
    compare: (first, second) => first.ruleD25Penalty - second.ruleD25Penalty,
  },
]

const ACTIVE_TWO_BISHOPS_WHITE_RULE_IDS = [
  'mate', 'bishops safe', 'no stalemate', 'rule a', 'rule b1', 'rule b2', 'rule b3',
  'rule c03', 'rule c05', 'rule c07', 'rule c7.5', 'rule c08', 'rule c08.5',
  'rule c9', 'rule c10', 'rule c11', 'rule c12', 'rule c15', 'rule d7', 'rule d9',
  'rule d12', 'rule d16', 'rule d20', 'rule d25',
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
    ruleAApplies: false, ruleAPenalty: 0,
    ruleB1Applies: false, ruleB1Penalty: 0, ruleB2Applies: false, ruleB2Penalty: 0, ruleB3Applies: false, ruleB3Penalty: 0,
    ruleC03Applies: false, ruleC03Penalty: 0, ruleC05Applies: false, ruleC05Penalty: 0,
    ruleC07Applies: false, ruleC07Penalty: 0, ruleC07DoubleRetreatPenalty: 0,
    ruleC075Applies: false, ruleC075Penalty: 0, ruleC08Applies: false, ruleC08Penalty: 0,
    ruleC085Applies: false, ruleC085Penalty: 0, ruleC9Applies: false, ruleC9Penalty: 0,
    ruleC10Applies: false, ruleC10Penalty: 0, ruleC11Applies: false, ruleC11Penalty: 0,
    ruleC12Applies: false, ruleC12Penalty: 0, ruleC15Applies: false, ruleC15Middle16Distance: 0, ruleC15BlackKingDistance: 0,
    ruleD7Applies: false, ruleD7Penalty: 0, ruleD9Applies: false, ruleD9ShapePenalty: 0, ruleD9BlackKingDistance: 0,
    ruleD10Applies: false, ruleD10Penalty: 0, ruleD10BlackKingDistance: 0,
    ruleD18Applies: false, ruleD18Penalty: 0, ruleD20Applies: false, ruleD20Penalty: 0,
    ruleD25Applies: false, ruleD25Penalty: 0,
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
  readonly ruleATargetCorners: readonly Square[]
  readonly ruleB1Target: Square | undefined
  readonly ruleB2Target: Square | undefined
  readonly ruleB3Target: Square | undefined
  readonly ruleC03Applies: boolean
  readonly ruleC03RetreatSquare: Square | undefined
  readonly ruleC05Target: Square | undefined
  readonly ruleC07Applies: boolean
  readonly ruleC08Applies: boolean
  readonly ruleC085Applies: boolean
  readonly ruleC9Targets: readonly Square[]
  readonly ruleC075Applies: boolean
  readonly ruleC10Applies: boolean
  readonly ruleC11Applies: boolean
  readonly ruleC12Target: Square | undefined
  readonly ruleC15Applies: boolean
  readonly ruleD20Targets: readonly Square[]
  readonly ruleD20Between: Square | undefined
}

function retreatSquare(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
): Square | undefined {
  return retreatTrackSquare(fen, bishops, blackKing, 1)
}

function doubleRetreatSquaresFromCage(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
): readonly Square[] {
  const square = retreatTrackSquare(fen, bishops, blackKing, 2)
  return square === undefined ? [] : [square]
}

function retreatTrackSquare(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
  distance: 1 | 2,
): Square | undefined {
  if (!phaseTwoKingsAreTracked(fen, blackKing) || blackKing === undefined) {
    return undefined
  }
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  if (whiteKing === undefined) return undefined
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
  const trackAxis = fileDelta < rankDelta ? 'file' : 'rank'
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

function phaseTwoKingsAreTracked(
  fen: string,
  blackKing: Square | undefined,
): boolean {
  if (blackKing === undefined || !isTwoBishopsPhaseTwoPosition(fen)) {
    return false
  }
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  return (
    whiteKing !== undefined &&
    (isKnightMove(whiteKing, blackKing) ||
      isInOpposition(whiteKing, blackKing, 1))
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
  const blackEdge = ruleWBlackEdge(fen, bishops, blackKing)
  const nonBlackEdge = perpendicularCageEdge(bishops, blackKing, blackEdge)
  return (
    nonBlackEdge !== undefined &&
    distanceToBoardEdge(blackKing, nonBlackEdge) <
      distanceToBoardEdge(whiteKing, nonBlackEdge)
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
  const blackEdge = ruleWBlackEdge(fen, bishops, blackKing)
  const relevantEdge = perpendicularCageEdge(
    bishops,
    blackKing,
    blackEdge,
  )
  return (
    relevantEdge !== undefined &&
    distanceToBoardEdge(blackKing, relevantEdge) >
      distanceToBoardEdge(whiteKing, relevantEdge)
  )
}

function ruleC9FlankSquares(
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

function isEdgeSquareTwoFromCorner(square: Square): boolean {
  const { file, rank } = squareCoordinates(square)
  return (
    ((file === 0 || file === 7) && (rank === 2 || rank === 5)) ||
    ((rank === 0 || rank === 7) && (file === 2 || file === 5))
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
  if (isInOpposition(whiteKing, blackKing, 1)) return true
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
    const requiredBishops = [
      transformSquare('d5', transform),
      transformSquare('e5', transform),
    ]
    if (
      whiteKing === transformSquare('f5', transform) &&
      blackKing === transformSquare('h4', transform) &&
      bishops.length === requiredBishops.length &&
      requiredBishops.every((bishop) => bishops.includes(bishop)) &&
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
  const ruleD20Squares = centralOppositionSideSquares(
    startingWhiteKing,
    blackKing,
  )
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
    ruleATargetCorners: isPhaseTwo
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
    ruleC08Applies: doubleRetreatControlled,
    ruleC085Applies:
      doubleRetreatControlled &&
      blackIsOneAheadOfTrack(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      ),
    ruleC9Targets:
      !retreatOrDoubleRetreatControlled &&
      blackIsOneAheadOfTrack(
        fen,
        startingBishops,
        startingWhiteKing,
        blackKing,
      )
        ? ruleC9FlankSquares(startingWhiteKing, blackKing)
        : [],
    ruleC075Applies: ruleC075Applies(
      fen,
      startingBishops,
      startingWhiteKing,
      blackKing,
    ),
    ruleC10Applies: ruleC10Applies(fen, startingBishops, blackKing),
    ruleC11Applies: isPhaseTwo,
    ruleC12Target:
      isPhaseTwo && phaseTwoKingsAreTracked(fen, blackKing)
        ? currentRetreatSquare
        : undefined,
    ruleC15Applies: isPhaseTwo,
    ruleD20Targets: ruleD20Squares?.targets ?? [],
    ruleD20Between: ruleD20Squares?.between,
  }
}

type BoardEdge =
  | { readonly axis: 'file'; readonly index: 0 | 7 }
  | { readonly axis: 'rank'; readonly index: 0 | 7 }

function boardEdgesContaining(square: Square): readonly BoardEdge[] {
  const { file, rank } = squareCoordinates(square)
  return [
    ...(file === 0 || file === 7
      ? [{ axis: 'file' as const, index: file as 0 | 7 }]
      : []),
    ...(rank === 0 || rank === 7
      ? [{ axis: 'rank' as const, index: rank as 0 | 7 }]
      : []),
  ]
}

function squareIsOnBoardEdge(square: Square, edge: BoardEdge): boolean {
  return squareCoordinates(square)[edge.axis] === edge.index
}

function distanceToBoardEdge(square: Square, edge: BoardEdge): number {
  return Math.abs(squareCoordinates(square)[edge.axis] - edge.index)
}

function perpendicularCageEdge(
  bishops: readonly Square[],
  blackKing: Square | undefined,
  blackEdge: BoardEdge | undefined,
): BoardEdge | undefined {
  if (blackKing === undefined || blackEdge === undefined) return undefined
  const corner = ruleQ5CagedCorners(bishops, blackKing)[0]
  return corner === undefined
    ? undefined
    : boardEdgesContaining(corner).find((edge) => edge.axis !== blackEdge.axis)
}

function ruleWBlackEdge(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square | undefined,
): BoardEdge | undefined {
  if (blackKing === undefined) return undefined
  const corner = ruleQ5CagedCorners(bishops, blackKing)[0]
  if (corner === undefined) return undefined
  const cornerEdges = boardEdgesContaining(corner)
  const currentEdges = boardEdgesContaining(blackKing).filter((edge) =>
    cornerEdges.some(
      (cornerEdge) =>
        cornerEdge.axis === edge.axis && cornerEdge.index === edge.index,
    ),
  )
  if (currentEdges.length === 1) return currentEdges[0]

  const blackTurn = getChess(withFenTurn(fen, 'b'))
  const legalKingMoves = blackTurn
    .moves({ verbose: true })
    .filter((move) => move.piece === 'k' && move.from === blackKing)
  const availableEdges = cornerEdges.filter((edge) =>
    legalKingMoves.some(
      (move) => move.to !== corner && squareIsOnBoardEdge(move.to, edge),
    ),
  )
  return availableEdges.length === 1 ? availableEdges[0] : undefined
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
  return neutralTwoBishopsWhiteMoveScore({
    isPhaseTwoPosition: resultIsPhaseTwo,
    matePenalty: mate ? 0 : 1,
    bishopSafetyPenalty: blackMoves.some((reply) => reply.captured === 'b')
      ? 1
      : 0,
    stalematePenalty: !mate && chess.isStalemate() ? 1 : 0,
    ruleAApplies: true,
    ruleAPenalty:
      resultIsPhaseTwo &&
      (context.ruleATargetCorners.length === 0 ||
        phaseTwoTargetCorners(
          resultBishops,
          resultWhiteKing,
          context.blackKing,
        ).some((corner) => context.ruleATargetCorners.includes(corner)))
        ? 0
        : 1,
    ruleB1Applies: context.ruleB1Target !== undefined,
    ruleB1Penalty:
      move.piece === 'b' && move.to === context.ruleB1Target ? 0 : 1,
    ruleB2Applies: context.ruleB2Target !== undefined,
    ruleB2Penalty:
      move.piece === 'k' && move.to === context.ruleB2Target ? 0 : 1,
    ruleB3Applies: context.ruleB3Target !== undefined,
    ruleB3Penalty:
      move.piece === 'b' && move.to === context.ruleB3Target ? 0 : 1,
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
    ruleC9Applies: context.ruleC9Targets.length > 0,
    ruleC9Penalty: context.ruleC9Targets.some((target) =>
      resultBishops.some((bishop) =>
        bishopControlsSquareFrom(chess, bishop, target),
      ),
    )
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
    ruleC11Applies: context.ruleC11Applies,
    ruleC11Penalty:
      blackMoves.length === 0
        ? 0
        : Math.max(...blackMoves.map((reply) => edgeDistance(reply.to))),
    ruleC12Applies: context.ruleC12Target !== undefined,
    ruleC12Penalty:
      context.ruleC12Target !== undefined &&
      chess.isAttacked(context.ruleC12Target, 'w')
        ? 0
        : 1,
    ruleC15Applies: context.ruleC15Applies,
    ruleC15Middle16Distance:
      resultWhiteKing === undefined ? 99 : middle16Distance(resultWhiteKing),
    ruleC15BlackKingDistance:
      resultWhiteKing === undefined || context.blackKing === undefined
        ? 99
        : manhattanDistance(resultWhiteKing, context.blackKing),
    ruleD7Applies: resultBishops.length > 0,
    ruleD7Penalty: resultBishops.some(isLongDiagonalSquare) ? 0 : 1,
    ruleD9Applies: !context.startingBishops.some(isLongDiagonalSquare),
    ruleD9ShapePenalty: resultBishops.some(isEdgeSquareTwoFromCorner) ? 0 : 1,
    ruleD9BlackKingDistance:
      context.blackKing === undefined
        ? 0
        : Math.max(
            0,
            ...resultBishops
              .filter(isEdgeSquareTwoFromCorner)
              .map((bishop) =>
                squaredEuclideanDistance(bishop, context.blackKing!),
              ),
          ),
    ruleD10Applies: resultWhiteKing !== undefined,
    ruleD10Penalty:
      resultWhiteKing === undefined ? 99 : kingStepsToCenter(resultWhiteKing),
    ruleD10BlackKingDistance:
      resultWhiteKing === undefined || context.blackKing === undefined
        ? 99
        : manhattanDistance(resultWhiteKing, context.blackKing),
    ruleD18Applies:
      resultWhiteKing !== undefined &&
      context.startingBishops.filter(isLongDiagonalSquare).length === 1,
    ruleD18Penalty:
      resultWhiteKing !== undefined &&
      resultBishops.some(
        (bishop) =>
          isLongDiagonalSquare(bishop) &&
          bishopControlsSquareFrom(chess, bishop, resultWhiteKing),
      )
        ? 1
        : 0,
    ruleD20Applies:
      context.ruleD20Targets.length > 0 &&
      context.ruleD20Between !== undefined,
    ruleD20Penalty:
      context.ruleD20Between !== undefined &&
      context.ruleD20Targets.some((target) =>
        resultBishops.some((bishop) =>
          bishopControlsSquareFrom(chess, bishop, target),
        ),
      ) &&
      !resultBishops.some((bishop) =>
        bishopControlsSquareFrom(chess, bishop, context.ruleD20Between!),
      )
        ? 0
        : 1,
    ruleD25Applies:
      context.startingWhiteKing !== undefined &&
      centerDistance(context.startingWhiteKing) === 0,
    ruleD25Penalty:
      !givesCheck &&
      resultWhiteKing !== undefined &&
      resultBishops.some(
        (bishop) =>
          isLongDiagonalSquare(bishop) &&
          kingDistance(bishop, resultWhiteKing) === 1,
      )
        ? 0
        : 1,
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
