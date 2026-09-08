import type { Chess, Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  allSquares,
  edgeDistance,
  findPiece,
  getChess,
  kingDistance,
  squareCoordinates,
  squareFromCoordinates,
  squaredEuclideanDistance,
  transformSquare,
} from '../chess'
import { compareScoresByRules, selectCandidatesByRules } from './selection'
import {
  applyUniversalBlackPriorities,
  BLACK_CAPTURE_PRIORITY,
  BLACK_RETURN_PRIORITY,
} from './blackPriorities'
import {
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getWhiteBishopSquares,
} from './twoBishopsGeometry'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from './types'

export type TwoBishopsWhiteMoveScore = {
  readonly matePenalty: number
  readonly bishopSafetyPenalty: number
  readonly stalematePenalty: number
  readonly ruleR4Applies: boolean
  readonly ruleR4Penalty: number
  readonly ruleR5BishopPenalty: number
  readonly ruleR5OrientationPenalty: number
  readonly ruleR5CagePenalty: number
  readonly ruleR5KingDistance: number
  readonly ruleR6Applies: boolean
  readonly ruleR6DiagonalPenalty: number
  readonly ruleR6SquarePenalty: number
  readonly ruleR6KingAreaPenalty: number
  readonly ruleR6KingPathDistance: number
  readonly ruleR6KingDistance: number
  readonly ruleR3CornerPenalty: number
  readonly ruleR8KingSquarePenalty: number
  readonly ruleR10EdgePenalty: number
  readonly ruleR10TargetPenalty: number
  readonly ruleR10DiagonalCount: number
  readonly ruleR10TargetSquares: readonly Square[]
  readonly ruleR10KingDistance: number
  readonly ruleR11Applies: boolean
  readonly ruleR11Penalty: number
  readonly ruleR12KingDistance: number
  readonly ruleR18Applies: boolean
  readonly ruleR18Penalty: number
  readonly ruleR19Penalty: number
  readonly ruleR22Applies: boolean
  readonly ruleR22BishopPenalty: number
  readonly ruleR22KingDistance: number
  readonly ruleR25KingDistance: number
  readonly ruleR30NearerBishopDistance: number
  readonly ruleR30FartherBishopDistance: number
  readonly ruleR30FartherWhiteKingDistance: number
  readonly ruleR30NearerWhiteKingDistance: number
}

export type TwoBishopsBlackMoveScore = {
  readonly bishopCapturePenalty: number
  readonly centerDistance: number
  readonly unprotectedBishopDistance: number
}

type DiagonalAxis = 'difference' | 'sum'

type TwoBishopsPieces = {
  readonly bishops: readonly Square[]
  readonly blackKing: Square | undefined
  readonly whiteKing: Square | undefined
}

function twoBishopsPieces(chess: Chess): TwoBishopsPieces {
  const pieces = chess.board().flat().filter((piece) => piece !== null)
  return {
    bishops: pieces.filter((piece) => piece.color === 'w' && piece.type === 'b')
      .map((piece) => piece.square),
    blackKing: pieces.find((piece) => piece.color === 'b' && piece.type === 'k')?.square,
    whiteKing: pieces.find((piece) => piece.color === 'w' && piece.type === 'k')?.square,
  }
}

type AdjacentDiagonalWall = {
  readonly axis: DiagonalAxis
  readonly side: 'minimum' | 'maximum'
  readonly lower: number
  readonly upper: number
  readonly diagonalCount: number
  readonly targetCorner: Square
}

type DiagonalWall = {
  readonly axis: DiagonalAxis
  readonly side: 'minimum' | 'maximum'
  readonly lower: number
  readonly upper: number
  readonly diagonalCount: number
  readonly innerBishop: Square
  readonly outerBishop: Square
}

type PhaseTwoTemplate = {
  readonly targetCorner: Square
  readonly innerSquare: Square
  readonly outerSquare: Square
  readonly outerPhaseSquares: readonly Square[]
  readonly kingTargetSquare: Square
  readonly kingAreaExceptions: readonly Square[]
  readonly kingAreaAlwaysExceptions: readonly Square[]
  readonly innerDiagonal: readonly Square[]
  readonly outerDiagonal: readonly Square[]
  readonly blackStages: readonly {
    readonly blackSquare: Square
    readonly controlSquare: Square | null
  }[]
}

const WHITE_INTRO =
  'White follows the ordered priorities below. The first priority that separates legal moves decides the recommendation.'
const BLACK_INTRO =
  'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.'

const TARGET_SQUARE_NOTE_BOARD = {
  id: 'two-bishops-target-square',
  title: 'Target square',
  noteIndex: 0,
  caption:
    "The outer wall is c1–h6. The target f4 is its closest square to Black's king by king-step distance. If a bishop occupies f4, this wall has no target square.",
  pieces: [
    { square: 'e4', piece: 'K' },
    { square: 'g3', piece: 'k' },
    { square: 'd2', piece: 'B' },
    { square: 'd1', piece: 'B' },
  ],
  highlights: [
    { square: 'c1', kind: 'wall' },
    { square: 'd2', kind: 'wall' },
    { square: 'e3', kind: 'wall' },
    { square: 'f4', kind: 'key' },
    { square: 'g5', kind: 'wall' },
    { square: 'h6', kind: 'wall' },
  ],
  arrows: [
    { from: 'g3', to: 'f4' },
  ],
} as const

const RULE_R10_EDGE_NOTE_BOARD = {
  id: 'two-bishops-rule-r10-edge',
  title: 'rule r10',
  caption:
    'With h1 as the target corner, the bishop on d1 may remain on the edge because it lies on the outer Phase 2 diagonal d1–h5.',
  pieces: [
    { square: 'e4', piece: 'K' },
    { square: 'g3', piece: 'k' },
    { square: 'd2', piece: 'B' },
    { square: 'd1', piece: 'B' },
  ],
  highlights: [
    { square: 'h1', kind: 'pink' },
    { square: 'd1', kind: 'key' },
  ],
} as const

const RULE_R18_CHOKE_NOTE_BOARD = {
  id: 'two-bishops-rule-r18-choke',
  title: 'rule r18 — Play the choke move',
  caption:
    'The inner wall d8–h4 has five squares and touches neither edge of target corner a1. Play Bf6: the inner bishop moves from h4 to the long diagonal a1–h8.',
  pieces: [
    { square: 'g7', piece: 'K' },
    { square: 'e6', piece: 'k' },
    { square: 'e8', piece: 'B' },
    { square: 'h4', piece: 'B' },
  ],
  highlights: [
    { square: 'd8', kind: 'wall' },
    { square: 'e7', kind: 'wall' },
    { square: 'f6', kind: 'key' },
    { square: 'g5', kind: 'wall' },
    { square: 'h4', kind: 'wall' },
    { square: 'a1', kind: 'pink' },
    { square: 'b2', kind: 'zone' },
    { square: 'c3', kind: 'zone' },
    { square: 'd4', kind: 'zone' },
    { square: 'e5', kind: 'zone' },
    { square: 'g7', kind: 'zone' },
    { square: 'h8', kind: 'zone' },
  ],
  arrows: [{ from: 'h4', to: 'f6' }],
} as const

const PHASE_TWO_NOTE_BOARD = {
  id: 'two-bishops-phase-two',
  title: 'Phase 2',
  caption:
    'For the h1 orientation, the exact Phase 2 position has White Kf2, bishops on e2/e3, and Black on h1, h2, h3, or h4.',
  pieces: [
    { square: 'f2', piece: 'K' },
    { square: 'h4', piece: 'k' },
    { square: 'e3', piece: 'B' },
    { square: 'e2', piece: 'B' },
  ],
  highlights: [],
} as const

const PHASE_TWO_TEMPLATES: readonly PhaseTwoTemplate[] = SQUARE_TRANSFORMS.map(
  (transform) => ({
    targetCorner: transformSquare('a8', transform),
    innerSquare: transformSquare('d6', transform),
    outerSquare: transformSquare('d7', transform),
    outerPhaseSquares: (['d7', 'e8'] as const).map((square) =>
      transformSquare(square, transform),
    ),
    kingTargetSquare: transformSquare('c7', transform),
    kingAreaExceptions: (['c7', 'c8', 'd8', 'e8', 'e7'] as const).map((square) =>
      transformSquare(square, transform),
    ),
    kingAreaAlwaysExceptions: [transformSquare('d8', transform)],
    innerDiagonal: (['a3', 'b4', 'c5', 'd6', 'e7', 'f8'] as const).map(
      (square) => transformSquare(square, transform),
    ),
    outerDiagonal: (['a4', 'b5', 'c6', 'd7', 'e8'] as const).map((square) =>
      transformSquare(square, transform),
    ),
    blackStages: [
      { blackSquare: 'a5' as const, controlSquare: null },
      { blackSquare: 'a6' as const, controlSquare: 'a5' as const },
      { blackSquare: 'a7' as const, controlSquare: 'a6' as const },
      { blackSquare: 'a8' as const, controlSquare: 'a6' as const },
    ].map(({ blackSquare, controlSquare }) => ({
      blackSquare: transformSquare(blackSquare, transform),
      controlSquare:
        controlSquare === null ? null : transformSquare(controlSquare, transform),
    })),
  }),
)

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
    "Target squares are the outer-wall squares closest to Black's king by king-step distance. All equally closest squares are candidates. If any candidate is occupied by a bishop, that wall has no target. White's king must be outside the wall, or on the outer wall and strictly closer to the target than Black's king by king-step distance.",
    'Phase 2 is recognized when rule r4 matches an established mating-pattern geometry: either the exact Phase 2 template or a bishop move that forces Black from the edge into its associated corner, under rotation or reflection.',
  ],
  noteBoards: [TARGET_SQUARE_NOTE_BOARD, PHASE_TWO_NOTE_BOARD, RULE_R10_EDGE_NOTE_BOARD, RULE_R18_CHOKE_NOTE_BOARD],
}

function diagonalIndex(square: Square, axis: DiagonalAxis): number {
  const { file, rank } = squareCoordinates(square)
  return axis === 'difference' ? file - rank : file + rank
}

function diagonalIndexRange(axis: DiagonalAxis): readonly [number, number] {
  return axis === 'difference' ? [-7, 7] : [0, 14]
}

function diagonalLength(index: number, axis: DiagonalAxis): number {
  return axis === 'difference'
    ? 8 - Math.abs(index)
    : 8 - Math.abs(index - 7)
}

function targetCorner(axis: DiagonalAxis, end: 'minimum' | 'maximum'): Square {
  if (axis === 'difference') return end === 'minimum' ? 'a8' : 'h1'
  return end === 'minimum' ? 'a1' : 'h8'
}

function isOnTargetCornerEdge(square: Square, corner: Square): boolean {
  const squarePosition = squareCoordinates(square)
  const cornerPosition = squareCoordinates(corner)
  return (
    squarePosition.file === cornerPosition.file ||
    squarePosition.rank === cornerPosition.rank
  )
}

function isCornerSquare(square: Square): boolean {
  const { file, rank } = squareCoordinates(square)
  return (file === 0 || file === 7) && (rank === 0 || rank === 7)
}

function scoreRuleR8({ blackKing, whiteKing }: TwoBishopsPieces): number {
  if (
    blackKing === undefined ||
    whiteKing === undefined ||
    !isCornerSquare(blackKing)
  ) {
    return 0
  }
  return PHASE_TWO_TEMPLATES.some(
    (template) =>
      template.targetCorner === blackKing &&
      template.kingTargetSquare === whiteKing,
  )
    ? 0
    : 1
}

function isOnPhaseTwoDiagonal(square: Square, corner: Square): boolean {
  return PHASE_TWO_TEMPLATES.some(
    (template) =>
      template.targetCorner === corner &&
      (template.innerDiagonal.includes(square) ||
        template.outerDiagonal.includes(square)),
  )
}

function getAdjacentDiagonalWalls(
  bishops: readonly Square[],
  blackKing: Square | undefined,
  forcedReplySquares: readonly Square[] | undefined = undefined,
  allowBlackOnInnerWall = false,
): readonly AdjacentDiagonalWall[] {
  if (bishops.length !== 2 || blackKing === undefined) {
    return []
  }

  const walls: AdjacentDiagonalWall[] = []
  for (const axis of ['difference', 'sum'] as const) {
    const bishopIndices = bishops
      .map((bishop) => diagonalIndex(bishop, axis))
      .sort((first, second) => first - second)
    const lower = bishopIndices[0]!
    const upper = bishopIndices[1]!
    if (upper - lower !== 1) continue
    if (
      diagonalLength(lower, axis) < 4 ||
      diagonalLength(upper, axis) < 4
    ) {
      continue
    }

    const blackIndex = diagonalIndex(blackKing, axis)
    const [minimum, maximum] = diagonalIndexRange(axis)
    const minimumSideDiagonalCount = lower - minimum
    const maximumSideDiagonalCount = maximum - upper
    const forcedToMinimumSide =
      blackIndex === lower &&
      forcedReplySquares !== undefined &&
      forcedReplySquares.length > 0 &&
      forcedReplySquares.every((square) => diagonalIndex(square, axis) < lower)
    const forcedToMaximumSide =
      blackIndex === upper &&
      forcedReplySquares !== undefined &&
      forcedReplySquares.length > 0 &&
      forcedReplySquares.every((square) => diagonalIndex(square, axis) > upper)
    if (
      (blackIndex < lower ||
        forcedToMinimumSide ||
        (allowBlackOnInnerWall && blackIndex === lower)) &&
      minimumSideDiagonalCount >= 4
    ) {
      walls.push({
        axis,
        side: 'minimum',
        lower,
        upper,
        diagonalCount: minimumSideDiagonalCount,
        targetCorner: targetCorner(axis, 'minimum'),
      })
    } else if (
      (blackIndex > upper ||
        forcedToMaximumSide ||
        (allowBlackOnInnerWall && blackIndex === upper)) &&
      maximumSideDiagonalCount >= 4
    ) {
      walls.push({
        axis,
        side: 'maximum',
        lower,
        upper,
        diagonalCount: maximumSideDiagonalCount,
        targetCorner: targetCorner(axis, 'maximum'),
      })
    }
  }
  return walls
}

function wallSeparatesWhite(
  wall: AdjacentDiagonalWall,
  whiteKing: Square | undefined,
): boolean {
  if (whiteKing === undefined) return false
  const whiteIndex = diagonalIndex(whiteKing, wall.axis)
  return wall.side === 'minimum'
    ? whiteIndex > wall.upper
    : whiteIndex < wall.lower
}

function getDiagonalWalls(
  bishops: readonly Square[],
  blackKing: Square | undefined,
): readonly DiagonalWall[] {
  if (bishops.length !== 2 || blackKing === undefined) return []
  const walls: DiagonalWall[] = []
  for (const axis of ['difference', 'sum'] as const) {
    const indexedBishops = bishops
      .map((bishop) => ({ bishop, index: diagonalIndex(bishop, axis) }))
      .sort((first, second) => first.index - second.index)
    const lowerBishop = indexedBishops[0]!
    const upperBishop = indexedBishops[1]!
    if (upperBishop.index - lowerBishop.index !== 1) continue
    if (
      diagonalLength(lowerBishop.index, axis) < 4 ||
      diagonalLength(upperBishop.index, axis) < 4
    ) {
      continue
    }

    const blackIndex = diagonalIndex(blackKing, axis)
    const [minimum, maximum] = diagonalIndexRange(axis)
    if (blackIndex < lowerBishop.index) {
      walls.push({
        axis,
        side: 'minimum',
        lower: lowerBishop.index,
        upper: upperBishop.index,
        diagonalCount: lowerBishop.index - minimum,
        innerBishop: lowerBishop.bishop,
        outerBishop: upperBishop.bishop,
      })
    } else if (blackIndex > upperBishop.index) {
      walls.push({
        axis,
        side: 'maximum',
        lower: lowerBishop.index,
        upper: upperBishop.index,
        diagonalCount: maximum - upperBishop.index,
        innerBishop: upperBishop.bishop,
        outerBishop: lowerBishop.bishop,
      })
    }
  }
  return walls
}

function smallestDiagonalWalls(
  walls: readonly DiagonalWall[],
): readonly DiagonalWall[] {
  const smallestCount = Math.min(...walls.map((wall) => wall.diagonalCount))
  return walls.filter((wall) => wall.diagonalCount === smallestCount)
}

type RuleR6Score = {
  readonly diagonalPenalty: number
  readonly squarePenalty: number
  readonly kingAreaPenalty: number
  readonly kingPathDistance: number
  readonly kingDistance: number
}

function compareRuleR6Scores(first: RuleR6Score, second: RuleR6Score): number {
  return (
    first.diagonalPenalty - second.diagonalPenalty ||
    first.squarePenalty - second.squarePenalty ||
    first.kingAreaPenalty - second.kingAreaPenalty ||
    first.kingPathDistance - second.kingPathDistance ||
    first.kingDistance - second.kingDistance
  )
}

type RuleR5Score = {
  readonly bishopPenalty: number
  readonly orientationPenalty: number
  readonly cagePenalty: number
  readonly kingDistance: number
}

function bishopControlsSquareForEnclosure(
  fen: string,
  bishop: Square,
  target: Square,
): boolean {
  if (!bishopControlsSquare(bishop, target)) return false
  const chess = getChess(fen)
  const from = squareCoordinates(bishop)
  const to = squareCoordinates(target)
  const fileStep = Math.sign(to.file - from.file)
  const rankStep = Math.sign(to.rank - from.rank)
  let file = from.file + fileStep
  let rank = from.rank + rankStep
  while (file !== to.file || rank !== to.rank) {
    const square = squareFromCoordinates(file, rank)
    if (square === null) return false
    const piece = chess.get(square)
    if (piece?.color === 'w') return false
    file += fileStep
    rank += rankStep
  }
  return true
}

function bishopEnclosedArea(
  fen: string,
  bishops: readonly Square[],
  blackKing: Square,
): readonly Square[] {
  const bishopSet = new Set(bishops)
  const openSquares = new Set(
    allSquares().filter(
      (square) =>
        !bishopSet.has(square) &&
        !bishops.some((bishop) =>
          bishopControlsSquareForEnclosure(fen, bishop, square),
        ),
    ),
  )
  if (!openSquares.has(blackKing)) return []

  const area: Square[] = []
  const queue: Square[] = [blackKing]
  const visited = new Set<Square>(queue)
  for (let index = 0; index < queue.length; index += 1) {
    const square = queue[index]!
    area.push(square)
    const coordinates = squareCoordinates(square)
    for (let fileOffset = -1; fileOffset <= 1; fileOffset += 1) {
      for (let rankOffset = -1; rankOffset <= 1; rankOffset += 1) {
        if (fileOffset === 0 && rankOffset === 0) continue
        const adjacent = squareFromCoordinates(
          coordinates.file + fileOffset,
          coordinates.rank + rankOffset,
        )
        if (
          adjacent !== null &&
          openSquares.has(adjacent) &&
          !visited.has(adjacent)
        ) {
          visited.add(adjacent)
          queue.push(adjacent)
        }
      }
    }
  }
  return area
}

function phaseTwoInlineKingTargets(
  bishops: readonly Square[],
): readonly { readonly target: Square; readonly template: PhaseTwoTemplate }[] {
  if (bishops.length !== 2 || kingDistance(bishops[0]!, bishops[1]!) !== 1) {
    return []
  }
  return PHASE_TWO_TEMPLATES.flatMap(
    (template): readonly {
      readonly target: Square
      readonly template: PhaseTwoTemplate
    }[] => {
    const inner = bishops.find((bishop) =>
      template.innerDiagonal.includes(bishop),
    )
    const outer = bishops.find((bishop) =>
      template.outerDiagonal.includes(bishop),
    )
    if (inner === undefined || outer === undefined || inner === outer) return []
    const innerCoordinates = squareCoordinates(inner)
    const outerCoordinates = squareCoordinates(outer)
    const target = squareFromCoordinates(
      outerCoordinates.file + (outerCoordinates.file - innerCoordinates.file),
      outerCoordinates.rank + (outerCoordinates.rank - innerCoordinates.rank),
    )
      return target === null ? [] : [{ target, template }]
    },
  )
}

function scoreRuleR5(
  startingBishops: readonly Square[],
  resultFen: string,
  { bishops, blackKing, whiteKing }: TwoBishopsPieces,
): RuleR5Score {
  if (bishops.length !== 2 || blackKing === undefined || whiteKing === undefined) {
    return {
      bishopPenalty: 1,
      orientationPenalty: 1,
      cagePenalty: 1,
      kingDistance: 0,
    }
  }
  const matches = phaseTwoInlineKingTargets(bishops)
  const bishopsAreAdjacent = kingDistance(bishops[0]!, bishops[1]!) === 1
  const enteringTemplates = bishopsAreAdjacent
    ? ruleR6Templates(resultFen).filter(
        (template) =>
          bishopsOccupyPhaseTwoDiagonals(bishops, template) &&
          !bishopsOccupyPhaseTwoDiagonals(startingBishops, template),
      )
    : []
  if (matches.length === 0 && enteringTemplates.length === 0) {
    return {
      bishopPenalty: 1,
      orientationPenalty: 1,
      cagePenalty: 1,
      kingDistance: 0,
    }
  }
  const enclosingMatches = matches.filter(({ template }) =>
    isInsidePhaseTwoBlackArea(blackKing, template),
  )
  const area = bishopEnclosedArea(resultFen, bishops, blackKing)
  const enclosesTwoEdgeSquares =
    area.length > 0 &&
    area.length <= 2 &&
    area.every((square) => edgeDistance(square) === 0)
  if (!enclosesTwoEdgeSquares) {
    return {
      bishopPenalty: 1,
      orientationPenalty: 1,
      cagePenalty: 1,
      kingDistance: 0,
    }
  }
  return {
    bishopPenalty: 0,
    orientationPenalty:
      enteringTemplates.length > 0 || enclosingMatches.length > 0 ? 0 : 1,
    cagePenalty: enclosesTwoEdgeSquares ? 0 : 1,
    kingDistance: enclosesTwoEdgeSquares
      ? Math.min(
          ...(enclosingMatches.length > 0 ? enclosingMatches : matches).map(
            ({ target }) =>
            squaredEuclideanDistance(whiteKing, target),
          ),
        )
      : 0,
  }
}

function ruleR6Templates(fen: string): readonly PhaseTwoTemplate[] {
  const bishops = getWhiteBishopSquares(fen)
  const blackKing = findPiece(fen, 'b', 'k')?.square
  if (blackKing === undefined) return []
  const wallCorners = smallestDiagonalWalls(
    getDiagonalWalls(bishops, blackKing),
  ).map((wall) => targetCorner(wall.axis, wall.side))
  if (wallCorners.length > 0) {
    return PHASE_TWO_TEMPLATES.filter((template) =>
      wallCorners.includes(template.targetCorner),
    )
  }
  const nearestCornerDistance = Math.min(
    ...PHASE_TWO_TEMPLATES.map((template) =>
      squaredEuclideanDistance(blackKing, template.targetCorner),
    ),
  )
  return PHASE_TWO_TEMPLATES.filter(
    (template) =>
      squaredEuclideanDistance(blackKing, template.targetCorner) ===
      nearestCornerDistance,
  )
}

function isInsidePhaseTwoBlackArea(
  square: Square,
  template: PhaseTwoTemplate,
): boolean {
  const axis: DiagonalAxis =
    diagonalIndex(template.innerDiagonal[0]!, 'difference') ===
    diagonalIndex(template.innerDiagonal[1]!, 'difference')
      ? 'difference'
      : 'sum'
  const innerIndex = diagonalIndex(template.innerSquare, axis)
  const outerIndex = diagonalIndex(template.outerSquare, axis)
  const targetIndex = diagonalIndex(template.targetCorner, axis)
  const squareIndex = diagonalIndex(square, axis)
  const lower = Math.min(innerIndex, outerIndex)
  const upper = Math.max(innerIndex, outerIndex)
  return targetIndex < lower ? squareIndex <= upper : squareIndex >= lower
}

function phaseTwoWallConfinesBlack(
  resultFen: string,
  template: PhaseTwoTemplate,
): boolean {
  const chess = getChess(resultFen)
  // The template's shorter "outer" diagonal is the wall facing Black.
  // A White king one square from the edge is exempt from screening the ray.
  const whiteKing = findPiece(resultFen, 'w', 'k')?.square
  const exemptKing = whiteKing !== undefined && edgeDistance(whiteKing) === 1
    ? whiteKing : undefined
  const diagonal = template.outerDiagonal
  const bishop = diagonal.find((square) => {
    const piece = chess.get(square)
    return piece?.color === 'w' && piece.type === 'b'
  })
  if (bishop === undefined ||
    ![diagonal[0]!, diagonal[diagonal.length - 1]!].every((square) =>
      square === bishop || bishopControlsSquareInPosition(resultFen, bishop, square, exemptKing),
    )) return false
  return chess.moves({ verbose: true }).every((reply) =>
    isInsidePhaseTwoBlackArea(reply.to, template) &&
    !template.innerDiagonal.includes(reply.to) &&
    !template.outerDiagonal.includes(reply.to),
  )
}

function ruleR6KingAreaPenalty(
  square: Square,
  bishops: readonly Square[],
  template: PhaseTwoTemplate,
): number {
  const phaseTwoSquaresOccupied =
    bishops.includes(template.innerSquare) &&
    bishops.some((bishop) => template.outerPhaseSquares.includes(bishop))
  return isInsidePhaseTwoBlackArea(square, template) &&
    square !== template.kingTargetSquare &&
    !template.kingAreaAlwaysExceptions.includes(square) &&
    !(
      phaseTwoSquaresOccupied &&
      template.kingAreaExceptions.includes(square)
    )
    ? 1
    : 0
}

function ruleR6KingPathDistance(
  fen: string,
  whiteKing: Square,
  bishops: readonly Square[],
  template: PhaseTwoTemplate,
): number {
  if (whiteKing === template.kingTargetSquare) return 0
  const chess = getChess(fen)
  const queue: Array<{ readonly square: Square; readonly distance: number }> = [
    { square: whiteKing, distance: 0 },
  ]
  const visited = new Set<Square>([whiteKing])
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!
    const coordinates = squareCoordinates(current.square)
    for (let fileOffset = -1; fileOffset <= 1; fileOffset += 1) {
      for (let rankOffset = -1; rankOffset <= 1; rankOffset += 1) {
        if (fileOffset === 0 && rankOffset === 0) continue
        const next = squareFromCoordinates(
          coordinates.file + fileOffset,
          coordinates.rank + rankOffset,
        )
        if (
          next === null ||
          visited.has(next) ||
          chess.get(next) !== undefined ||
          ruleR6KingAreaPenalty(next, bishops, template) > 0
        ) {
          continue
        }
        const distance = current.distance + 1
        if (next === template.kingTargetSquare) return distance
        visited.add(next)
        queue.push({ square: next, distance })
      }
    }
  }
  return 99
}

function scoreRuleR6(
  templates: readonly PhaseTwoTemplate[],
  resultFen: string,
  { bishops, blackKing, whiteKing }: TwoBishopsPieces,
): RuleR6Score {
  if (
    templates.length === 0 ||
    blackKing === undefined ||
    whiteKing === undefined
  ) {
    return {
      diagonalPenalty: 1,
      squarePenalty: 0,
      kingAreaPenalty: 0,
      kingPathDistance: 0,
      kingDistance: 0,
    }
  }
  const matchingTemplates = templates.filter(
    (template) =>
      bishopsOccupyPhaseTwoDiagonals(bishops, template) &&
      isInsidePhaseTwoBlackArea(blackKing, template) &&
      phaseTwoWallConfinesBlack(resultFen, template),
  )
  if (matchingTemplates.length === 0) {
    return {
      diagonalPenalty: 1,
      squarePenalty: 0,
      kingAreaPenalty: 0,
      kingPathDistance: 0,
      kingDistance: 0,
    }
  }
  const scores = matchingTemplates.map((template): RuleR6Score => {
    return {
      diagonalPenalty: 0,
      squarePenalty:
        2 -
        Number(bishops.includes(template.innerSquare)) -
        Number(
          bishops.some((bishop) =>
            template.outerPhaseSquares.includes(bishop),
          ),
        ),
      kingAreaPenalty: ruleR6KingAreaPenalty(whiteKing, bishops, template),
      kingPathDistance: ruleR6KingPathDistance(
        resultFen,
        whiteKing,
        bishops,
        template,
      ),
      kingDistance: Math.sqrt(
        squaredEuclideanDistance(whiteKing, template.kingTargetSquare),
      ),
    }
  })
  return scores.sort(compareRuleR6Scores)[0]!
}

function bishopControlsSquare(bishop: Square, square: Square): boolean {
  const first = squareCoordinates(bishop)
  const second = squareCoordinates(square)
  return (
    bishop !== square &&
    Math.abs(first.file - second.file) === Math.abs(first.rank - second.rank)
  )
}

function bishopControlsSquareInPosition(
  fen: string,
  bishop: Square,
  target: Square,
  ignoredBlocker?: Square,
): boolean {
  if (!bishopControlsSquare(bishop, target)) return false
  const chess = getChess(fen)
  const from = squareCoordinates(bishop)
  const to = squareCoordinates(target)
  const fileStep = Math.sign(to.file - from.file)
  const rankStep = Math.sign(to.rank - from.rank)
  let file = from.file + fileStep
  let rank = from.rank + rankStep
  while (file !== to.file || rank !== to.rank) {
    const square = squareFromCoordinates(file, rank)
    if (square === null ||
      (square !== ignoredBlocker && chess.get(square) !== undefined)) return false
    file += fileStep
    rank += rankStep
  }
  return true
}

function bishopsOccupyPhaseTwoDiagonals(
  bishops: readonly Square[],
  template: PhaseTwoTemplate,
): boolean {
  return (
    bishops.length === 2 &&
    bishops.some((bishop) => template.innerDiagonal.includes(bishop)) &&
    bishops.some((bishop) => template.outerDiagonal.includes(bishop))
  )
}

type RuleR4Match =
  | {
      readonly kind: 'phase-two'
      readonly template: PhaseTwoTemplate
      readonly controlSquare: Square | null
    }
  | {
      readonly kind: 'diagonal-wait'
      readonly whiteKing: Square
      readonly movingBishop: Square
      readonly fixedBishop: Square
      readonly waitingDiagonal: readonly Square[]
    }
  | {
      readonly kind: 'king-step'
      readonly target: Square
      readonly fixedBishop: Square
      readonly waitingDiagonal: readonly Square[]
    }
  | {
      readonly kind: 'pattern-check'
      readonly whiteKing: Square
      readonly fixedBishop: Square
      readonly movingBishop: Square
      readonly checkingDiagonal: readonly Square[]
    }
  | {
      readonly kind: 'pattern-mate'
      readonly whiteKing: Square
    }
  | {
      readonly kind: 'exact-pattern-move'
      readonly whiteKing: Square
      readonly movingBishop: Square
      readonly fixedBishop: Square
      readonly target: Square
    }
  | {
      readonly kind: 'pattern-bishop-target'
      readonly whiteKing: Square
      readonly fixedBishop: Square
      readonly target: Square
    }
  | {
      readonly kind: 'pattern-king-target'
      readonly bishops: readonly [Square, Square]
      readonly target: Square
    }
  | {
      readonly kind: 'force-corner'
      readonly whiteKing: Square
      readonly targetCorner: Square
    }
  | {
      readonly kind: 'corner-sequence-target'
      readonly whiteKing: Square
      readonly target: Square
      readonly requireCheck: boolean
    }

function blackRepliesOnlyToCorner(resultFen: string, corner: Square): boolean {
  const chess = getChess(resultFen)
  if (chess.turn() !== 'b') return false
  const replies = chess.moves({ verbose: true })
  return replies.length > 0 && replies.every((reply) => reply.to === corner)
}

const ruleR4ForcedMateNextCache = new Map<string, boolean>()

function blackRepliesAllAllowMateNext(resultFen: string): boolean {
  const chess = getChess(resultFen)
  if (chess.turn() !== 'b') return false
  const replies = chess.moves({ verbose: true })
  return (
    replies.length > 0 &&
    replies.every((reply) => {
      const afterReply = getChess(resultFen)
      afterReply.move(reply.san)
      return afterReply.moves().some((whiteMove) => {
        const afterWhiteMove = getChess(afterReply.fen())
        afterWhiteMove.move(whiteMove)
        return afterWhiteMove.isCheckmate()
      })
    })
  )
}

function ruleR4HasForcedMateNext(fen: string): boolean {
  const cached = ruleR4ForcedMateNextCache.get(fen)
  if (cached !== undefined) return cached
  const result = getChess(fen)
    .moves({ verbose: true })
    .some((move) => {
      const result = getChess(fen)
      result.move(move.san)
      return blackRepliesAllAllowMateNext(result.fen())
    })
  ruleR4ForcedMateNextCache.set(fen, result)
  return result
}

function canForceBlackToCornerWithBishop(
  fen: string,
  corner: Square,
): boolean {
  return getChess(fen)
    .moves({ verbose: true })
    .some((move) => {
      if (move.piece !== 'b') return false
      const result = getChess(fen)
      result.move(move.san)
      return blackRepliesOnlyToCorner(result.fen(), corner)
    })
}

function hasLegalBishopMoveTo(
  fen: string,
  target: Square,
  requireCheck: boolean,
): boolean {
  return getChess(fen)
    .moves({ verbose: true })
    .some((move) => {
      if (move.piece !== 'b' || move.to !== target) return false
      if (!requireCheck) return true
      const result = getChess(fen)
      result.move(move.san)
      return result.isCheck()
    })
}

const cornerPreparationCache = new Map<string, readonly RuleR4Match[]>()

function cornerPreparationMatches(fen: string): readonly RuleR4Match[] {
  const cached = cornerPreparationCache.get(fen)
  if (cached !== undefined) return cached
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const bishops = getWhiteBishopSquares(fen)
  const matches = SQUARE_TRANSFORMS.flatMap((transform): readonly RuleR4Match[] => {
    const kingSquare = transformSquare('f7', transform)
    const corner = transformSquare('h8', transform)
    const adjacent = transformSquare('h7', transform)
    const control = transformSquare('h6', transform)
    if (whiteKing !== kingSquare || blackKing !== corner || !bishops.some(
      (bishop) => bishopControlsSquareInPosition(fen, bishop, control),
    )) return []
    return getChess(fen).moves({ verbose: true }).flatMap((move): readonly RuleR4Match[] => {
      if (move.piece !== 'b') return []
      const result = getChess(fen)
      result.move(move)
      if (!getWhiteBishopSquares(result.fen()).some(
        (bishop) => bishopControlsSquareInPosition(result.fen(), bishop, control),
      )) return []
      const replies = result.moves({ verbose: true })
      if (replies.length === 0 || !replies.every((reply) => reply.to === adjacent)) return []
      const afterReply = getChess(result.fen())
      afterReply.move(replies[0]!)
      if (!ruleR4HasForcedMateNext(afterReply.fen())) return []
      return [{
        kind: 'exact-pattern-move',
        whiteKing: kingSquare,
        movingBishop: move.from,
        fixedBishop: bishops.find((bishop) => bishop !== move.from)!,
        target: move.to,
      }]
    })
  })
  cornerPreparationCache.set(fen, matches)
  return matches
}

// Exact stages of the a-file mating drive and the Be7–Kb6 king approach.
// Alternative Black replies share a stage when White uses the same move.
const EXACT_SEQUENCE_STAGES = [
  { blackKings: ['b8', 'c8'], whiteKing: 'b5', bishops: ['c6', 'e7'], from: 'b5', to: 'b6' },
  { blackKings: ['a5'], whiteKing: 'd4', bishops: ['c5', 'c4'], from: 'd4', to: 'c3' },
  { blackKings: ['a4'], whiteKing: 'c3', bishops: ['c5', 'c4'], from: 'c5', to: 'b6' },
  { blackKings: ['a3'], whiteKing: 'c3', bishops: ['b6', 'c4'], from: 'c4', to: 'b5' },
  { blackKings: ['a2'], whiteKing: 'c3', bishops: ['b6', 'b5'], from: 'c3', to: 'c2' },
  { blackKings: ['a3', 'a1'], whiteKing: 'c2', bishops: ['b6', 'b5'], from: 'b6', to: 'c5' },
  { blackKings: ['a2'], whiteKing: 'c2', bishops: ['c5', 'b5'], from: 'b5', to: 'c4' },
  { blackKings: ['a1'], whiteKing: 'c2', bishops: ['c5', 'c4'], from: 'c5', to: 'd4' },
] as const

function getRuleR4Matches(fen: string): readonly RuleR4Match[] {
  const bishops = getWhiteBishopSquares(fen)
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  if (blackKing === undefined || whiteKing === undefined) return []
  const cornerRetreatMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => {
      const movingBishop = transformSquare('b2', transform)
      const fixedBishop = (['c2', 'd3', 'e4', 'f5', 'g6', 'h7'] as const)
        .map((square) => transformSquare(square, transform))
        .find((square) => bishops.includes(square))
      if (
        blackKing !== transformSquare('a2', transform) ||
        whiteKing !== transformSquare('c3', transform) ||
        !bishops.includes(movingBishop) ||
        fixedBishop === undefined
      ) return []
      // Retreat b2–c1 while the other bishop retains the c2–h7 diagonal.
      return [{ kind: 'exact-pattern-move', whiteKing, movingBishop,
        fixedBishop, target: transformSquare('c1', transform) }]
    },
  )
  const phaseTwoMatches = PHASE_TWO_TEMPLATES.flatMap(
    (template): readonly RuleR4Match[] => {
      if (
        whiteKing !== template.kingTargetSquare ||
        !bishopsOccupyPhaseTwoDiagonals(bishops, template)
      ) {
        return []
      }
      const stage = template.blackStages.find(
        ({ blackSquare }) => blackSquare === blackKing,
      )
      if (stage === undefined) return []
      return [
        {
          kind: 'phase-two',
          template,
          controlSquare: stage.controlSquare,
        },
      ]
    },
  )
  const forceCornerMatches = PHASE_TWO_TEMPLATES.flatMap(
    (template): readonly RuleR4Match[] => {
      if (
        whiteKing !== template.kingTargetSquare ||
        kingDistance(blackKing, template.targetCorner) !== 1 ||
        !canForceBlackToCornerWithBishop(fen, template.targetCorner)
      ) {
        return []
      }
      return [
        {
          kind: 'force-corner',
          whiteKing,
          targetCorner: template.targetCorner,
        },
      ]
    },
  )
  const cornerSequenceMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => {
      const targetCorner = transformSquare('h8', transform)
      const adjacentEdgeSquare = transformSquare('h7', transform)
      const kingSquare = transformSquare('f7', transform)
      const guardSquare = transformSquare('c1', transform)
      const preparationSquare = transformSquare('b5', transform)
      const checkingSquare = transformSquare('d3', transform)
      if (whiteKing !== kingSquare) return []

      let target: Square | undefined
      let requireCheck = false
      if (blackKing === adjacentEdgeSquare) {
        if (bishops.includes(guardSquare)) {
          target = checkingSquare
          requireCheck = true
        } else {
          target = guardSquare
        }
      } else if (
        blackKing === targetCorner &&
        bishops.includes(guardSquare) &&
        !bishops.includes(checkingSquare)
      ) {
        target = preparationSquare
      }
      if (
        target === undefined ||
        bishops.includes(target) ||
        !hasLegalBishopMoveTo(fen, target, requireCheck)
      ) {
        return []
      }
      return [
        {
          kind: 'corner-sequence-target',
          whiteKing,
          target,
          requireCheck,
        },
      ]
    },
  )
  const maintainedControlSequenceMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => {
      const targetCorner = transformSquare('h1', transform)
      const adjacentEdgeSquare = transformSquare('h2', transform)
      const kingSquare = transformSquare('f2', transform)
      const maintainedControlSquare = transformSquare('h3', transform)
      const waitingSquare = transformSquare('d7', transform)
      const checkingSquare = transformSquare('b8', transform)
      const matingSquare = transformSquare('c6', transform)
      if (whiteKing !== kingSquare) return []

      let target: Square | undefined
      let requireCheck = false
      if (
        blackKing === targetCorner &&
        bishops.includes(checkingSquare)
      ) {
        target = matingSquare
        requireCheck = true
      } else if (
        blackKing === targetCorner &&
        bishops.some((bishop) =>
          bishopControlsSquareInPosition(
            fen,
            bishop,
            maintainedControlSquare,
          ),
        )
      ) {
        target = waitingSquare
      } else if (
        blackKing === adjacentEdgeSquare &&
        bishops.includes(waitingSquare)
      ) {
        target = checkingSquare
        requireCheck = true
      }
      if (
        target === undefined ||
        bishops.includes(target) ||
        !hasLegalBishopMoveTo(fen, target, requireCheck)
      ) {
        return []
      }
      return [
        {
          kind: 'corner-sequence-target',
          whiteKing,
          target,
          requireCheck,
        },
      ]
    },
  )
  const diagonalWaitingMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => {
      const firstKingSquare = transformSquare('f6', transform)
      const secondKingSquare = transformSquare('g6', transform)
      const corner = transformSquare('h8', transform)
      const trackingSquare = transformSquare('g8', transform)
      const fixedBishop = transformSquare('h6', transform)
      const waitingDiagonal = (
        ['b1', 'c2', 'd3', 'e4', 'f5', 'g6', 'h7'] as const
      ).map((square) => transformSquare(square, transform))
      const checkingDiagonal = (
        ['a2', 'b3', 'c4', 'd5', 'e6', 'f7', 'g8'] as const
      ).map((square) => transformSquare(square, transform))
      const movingBishop = bishops.find((bishop) =>
        waitingDiagonal.includes(bishop),
      )
      if (!bishops.includes(fixedBishop)) {
        return []
      }
      if (
        movingBishop !== undefined &&
        blackKing === corner &&
        (whiteKing === firstKingSquare || whiteKing === secondKingSquare)
      ) {
        return [
          {
            kind: 'diagonal-wait',
            whiteKing,
            movingBishop,
            fixedBishop,
            waitingDiagonal,
          },
        ]
      }
      if (
        movingBishop !== undefined &&
        blackKing === trackingSquare &&
        whiteKing === firstKingSquare
      ) {
        return [
          {
            kind: 'king-step',
            target: secondKingSquare,
            fixedBishop,
            waitingDiagonal,
          },
        ]
      }
      if (
        movingBishop !== undefined &&
        blackKing === trackingSquare &&
        whiteKing === secondKingSquare
      ) {
        return [
          {
            kind: 'pattern-check',
            whiteKing: secondKingSquare,
            fixedBishop,
            movingBishop,
            checkingDiagonal,
          },
        ]
      }
      if (
        blackKing === corner &&
        whiteKing === secondKingSquare &&
        bishops.some((bishop) => checkingDiagonal.includes(bishop))
      ) {
        return [{ kind: 'pattern-mate', whiteKing: secondKingSquare }]
      }
      return []
    },
  )
  const exactSequenceMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => EXACT_SEQUENCE_STAGES.flatMap(
      (stage): readonly RuleR4Match[] => {
        const expectedKing = transformSquare(stage.whiteKing, transform)
        const firstBishop = transformSquare(stage.bishops[0], transform)
        const secondBishop = transformSquare(stage.bishops[1], transform)
        if (
          whiteKing !== expectedKing ||
          !stage.blackKings.some((square) => transformSquare(square, transform) === blackKing) ||
          !bishops.includes(firstBishop) || !bishops.includes(secondBishop)
        ) return []
        const target = transformSquare(stage.to, transform)
        if (stage.from === stage.whiteKing) {
          return [{ kind: 'pattern-king-target', bishops: [firstBishop, secondBishop], target }]
        }
        const movingBishop = transformSquare(stage.from, transform)
        return [{
          kind: 'exact-pattern-move',
          whiteKing: expectedKing,
          movingBishop,
          fixedBishop: movingBishop === firstBishop ? secondBishop : firstBishop,
          target,
        }]
      },
    ),
  )
  const exactPatternMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => {
      const patterns = [
        {
          blackKing: 'c7' as const,
          whiteKing: 'b5' as const,
          movingBishop: 'c5' as const,
          fixedBishop: 'c6' as const,
          target: 'e7' as const,
        },
        {
          blackKing: 'h7' as const,
          whiteKing: 'f6' as const,
          movingBishop: 'f7' as const,
          fixedBishop: 'f8' as const,
          target: 'd5' as const,
        },
        {
          blackKing: 'h8' as const,
          whiteKing: 'f6' as const,
          movingBishop: 'd5' as const,
          fixedBishop: 'f8' as const,
          target: 'e6' as const,
        },
      ]
      return patterns.flatMap((pattern): readonly RuleR4Match[] => {
        const expectedWhiteKing = transformSquare(pattern.whiteKing, transform)
        const movingBishop = transformSquare(pattern.movingBishop, transform)
        const fixedBishop = transformSquare(pattern.fixedBishop, transform)
        if (
          blackKing !== transformSquare(pattern.blackKing, transform) ||
          whiteKing !== expectedWhiteKing ||
          !bishops.includes(movingBishop) ||
          !bishops.includes(fixedBishop)
        ) {
          return []
        }
        return [
          {
            kind: 'exact-pattern-move',
            whiteKing: expectedWhiteKing,
            movingBishop,
            fixedBishop,
            target: transformSquare(pattern.target, transform),
          },
        ]
      })
    },
  )
  const alignmentPatternMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => {
      const firstBlackSquare = transformSquare('h7', transform)
      const secondBlackSquare = transformSquare('h6', transform)
      const whiteKingSquare = transformSquare('f5', transform)
      const fixedBishop = transformSquare('e5', transform)
      const alignedBishop = transformSquare('d5', transform)
      if (
        blackKing === firstBlackSquare &&
        whiteKing === whiteKingSquare &&
        bishops.includes(fixedBishop)
      ) {
        return [
          {
            kind: 'pattern-bishop-target',
            whiteKing: whiteKingSquare,
            fixedBishop,
            target: alignedBishop,
          },
        ]
      }
      if (
        blackKing === secondBlackSquare &&
        whiteKing === whiteKingSquare &&
        bishops.includes(fixedBishop) &&
        bishops.includes(alignedBishop)
      ) {
        return [
          {
            kind: 'pattern-king-target',
            bishops: [fixedBishop, alignedBishop],
            target: transformSquare('e4', transform),
          },
        ]
      }
      return []
    },
  )
  if (exactSequenceMatches.length > 0) return exactSequenceMatches
  if (cornerRetreatMatches.length > 0) return cornerRetreatMatches
  return phaseTwoMatches.length > 0
    ? phaseTwoMatches
    : maintainedControlSequenceMatches.length + cornerSequenceMatches.length > 0
      ? [...maintainedControlSequenceMatches, ...cornerSequenceMatches]
      : exactPatternMatches.length > 0
        ? exactPatternMatches
        : alignmentPatternMatches.length > 0
          ? alignmentPatternMatches
          : [...forceCornerMatches, ...diagonalWaitingMatches, ...cornerPreparationMatches(fen)]
}

function scoreRuleR4(
  fen: string,
  resultFen: string,
  context: WhiteScoringContext,
  { bishops: resultBishops, whiteKing: resultWhiteKing }: TwoBishopsPieces,
): number {
  const matches = context.ruleR4Matches
  if (matches.length === 0) return 0
  const { blackKing, bishops: startingBishops } = context.pieces
  if (context.ruleR4ForcedMateNext) {
    return blackRepliesAllAllowMateNext(resultFen) ? 0 : 1
  }
  const resultChess = getChess(resultFen)
  return matches.some((match) => {
    if (match.kind === 'diagonal-wait') {
      return (
        resultWhiteKing === match.whiteKing &&
        resultBishops.includes(match.fixedBishop) &&
        !resultBishops.includes(match.movingBishop) &&
        resultBishops.some((bishop) =>
          match.waitingDiagonal.includes(bishop),
        )
      )
    }
    if (match.kind === 'king-step') {
      return (
        resultWhiteKing === match.target &&
        resultBishops.includes(match.fixedBishop) &&
        resultBishops.some((bishop) => match.waitingDiagonal.includes(bishop))
      )
    }
    if (match.kind === 'pattern-check') {
      return (
        resultWhiteKing === match.whiteKing &&
        resultBishops.includes(match.fixedBishop) &&
        !resultBishops.includes(match.movingBishop) &&
        resultBishops.some((bishop) => match.checkingDiagonal.includes(bishop)) &&
        resultChess.isCheck()
      )
    }
    if (match.kind === 'pattern-mate') {
      return resultWhiteKing === match.whiteKing && resultChess.isCheckmate()
    }
    if (match.kind === 'exact-pattern-move') {
      return (
        resultWhiteKing === match.whiteKing &&
        resultBishops.includes(match.fixedBishop) &&
        !resultBishops.includes(match.movingBishop) &&
        resultBishops.includes(match.target)
      )
    }
    if (match.kind === 'pattern-bishop-target') {
      return (
        resultWhiteKing === match.whiteKing &&
        resultBishops.includes(match.fixedBishop) &&
        resultBishops.includes(match.target)
      )
    }
    if (match.kind === 'pattern-king-target') {
      return (
        resultWhiteKing === match.target &&
        match.bishops.every((bishop) => resultBishops.includes(bishop))
      )
    }
    if (match.kind === 'force-corner') {
      return (
        resultWhiteKing === match.whiteKing &&
        blackRepliesOnlyToCorner(resultFen, match.targetCorner)
      )
    }
    if (match.kind === 'corner-sequence-target') {
      return (
        resultWhiteKing === match.whiteKing &&
        resultBishops.includes(match.target) &&
        (!match.requireCheck || resultChess.isCheck())
      )
    }
    const { template, controlSquare } = match
    if (resultWhiteKing !== template.kingTargetSquare) return false
    if (controlSquare === null) {
      return (
        !resultChess.isCheck() &&
        getRuleR4Matches(resultFen).some(
          (resultMatch) =>
            resultMatch.kind === 'phase-two' &&
            resultMatch.template.targetCorner === template.targetCorner &&
            resultMatch.controlSquare === null,
        )
      )
    }
    if (resultChess.isCheckmate()) return true
    const preservesControl = resultBishops.some((bishop) =>
      bishopControlsSquareInPosition(resultFen, bishop, controlSquare),
    )
    const alreadyControlled = startingBishops.some((bishop) =>
      bishopControlsSquareInPosition(fen, bishop, controlSquare),
    )
    const shouldCheck =
      blackKing !== undefined &&
      kingDistance(blackKing, template.targetCorner) === 1 &&
      alreadyControlled
    return preservesControl && (!shouldCheck || resultChess.isCheck())
  })
    ? 0
    : 1
}

export function isTwoBishopsPhaseTwoPosition(fen: string): boolean {
  return getRuleR4Matches(fen).length > 0
}

type RuleR10Score = {
  readonly targetPenalty: number
  readonly diagonalCount: number
  readonly targetSquares: readonly Square[]
  readonly kingDistance: number
  readonly beyondDistance: number
}

function compareRuleR10Scores(first: RuleR10Score, second: RuleR10Score): number {
  return (
    first.diagonalCount - second.diagonalCount ||
    first.kingDistance - second.kingDistance
  )
}

function wallReplyDiagonalCount(
  wall: AdjacentDiagonalWall,
  replySquares: readonly Square[],
  screenedInner: boolean,
): number {
  const [minimum, maximum] = diagonalIndexRange(wall.axis)
  const replyIndices = replySquares.map((square) => diagonalIndex(square, wall.axis))
  const innerIndex = wall.side === 'minimum' ? wall.lower : wall.upper
  // An inner wall reachable on the next move cannot establish an enclosure.
  if (replyIndices.includes(innerIndex)) return 99
  const countedWallIndices = new Set(
    replyIndices.filter((index) => index >= wall.lower && index <= wall.upper),
  )
  if (screenedInner) countedWallIndices.add(innerIndex)
  // Count sides separately, plus reachable walls and a king-screened inner wall.
  // A screened bishop does not exclude its diagonal from Black's territory.
  const sideCount = Math.max(
    wall.diagonalCount,
    ...replyIndices.map((index) =>
      index < wall.lower
        ? wall.lower - minimum
        : index > wall.upper
          ? maximum - wall.upper
          : 0,
    ),
  )
  return sideCount + countedWallIndices.size
}

function scoreRuleR10(
  walls: readonly AdjacentDiagonalWall[],
  bishops: readonly Square[],
  blackKing: Square | undefined,
  whiteKing: Square | undefined,
  replySquares: readonly Square[],
): RuleR10Score {
  let best: RuleR10Score = {
    targetPenalty: 1,
    diagonalCount: 99,
    targetSquares: [],
    kingDistance: 99,
    beyondDistance: 99,
  }
  if (blackKing === undefined || whiteKing === undefined) return best

  for (const wall of walls) {
    const innerIndex = wall.side === 'minimum' ? wall.lower : wall.upper
    // Kings on the edge or one square from it do not count as screens.
    const screenedInner = diagonalIndex(whiteKing, wall.axis) === innerIndex &&
      edgeDistance(whiteKing) > 1
    const outerIndex = wall.side === 'minimum' ? wall.upper : wall.lower
    const outerSquares = allSquares().filter(
      (square) => diagonalIndex(square, wall.axis) === outerIndex,
    )
    const closestDistance = Math.min(
      ...outerSquares.map((square) => kingDistance(blackKing, square)),
    )
    const candidates = outerSquares.filter(
      (square) => kingDistance(blackKing, square) === closestDistance,
    )
    // A bishop on any closest candidate invalidates the wall target set.
    const targetSquares = candidates.some((square) => bishops.includes(square))
      ? []
      : candidates.filter(
          (square) => wallSeparatesWhite(wall, whiteKing) ||
            (diagonalIndex(whiteKing, wall.axis) === outerIndex &&
              kingDistance(whiteKing, square) < kingDistance(blackKing, square)),
        )
    const beyondIndex = outerIndex + (wall.side === 'minimum' ? 1 : -1)
    const beyondSquares = allSquares().filter(
      (square) => diagonalIndex(square, wall.axis) === beyondIndex,
    )
    const score: RuleR10Score = {
      targetPenalty: targetSquares.length === 0 ? 1 : 0,
      diagonalCount: wallReplyDiagonalCount(wall, replySquares, screenedInner),
      targetSquares,
      beyondDistance: beyondSquares.length === 0
        ? 99
        : Math.min(...beyondSquares.map((square) => kingDistance(whiteKing, square))),
      kingDistance:
        targetSquares.length === 0
          ? 99
          : Math.min(...targetSquares.map((square) => kingDistance(whiteKing, square))),
    }
    const comparison = compareRuleR10Scores(score, best)
    if (comparison < 0) {
      best = score
    } else if (comparison === 0) {
      best = {
        ...best,
        beyondDistance: Math.min(best.beyondDistance, score.beyondDistance),
        targetSquares: [...new Set([...best.targetSquares, ...score.targetSquares])],
      }
    }
  }
  return best
}

function flankStepTarget(fen: string): Square | undefined {
  const bishops = getWhiteBishopSquares(fen)
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const blackKing = findPiece(fen, 'b', 'k')?.square
  if (bishops.length !== 2 || whiteKing === undefined || blackKing === undefined ||
    kingDistance(bishops[0]!, bishops[1]!) !== 1 ||
    bishops.some((bishop) => kingDistance(whiteKing, bishop) !== 1) ||
    kingDistance(whiteKing, blackKing) !== 3) return undefined

  const first = squareCoordinates(bishops[0]!)
  const second = squareCoordinates(bishops[1]!)
  const white = squareCoordinates(whiteKing)
  const black = squareCoordinates(blackKing)
  for (const lineAxis of ['file', 'rank'] as const) {
    const stepAxis = lineAxis === 'file' ? 'rank' : 'file'
    if (first[lineAxis] !== second[lineAxis] ||
      Math.min(first[stepAxis], second[stepAxis]) !== 3 ||
      Math.max(first[stepAxis], second[stepAxis]) !== 4 ||
      white[stepAxis] !== black[stepAxis] ||
      (white[lineAxis] - first[lineAxis]) *
        (black[lineAxis] - first[lineAxis]) >= 0) continue

    // Extend the bishop line past the bishop level with White's king.
    const other = first[stepAxis] === white[stepAxis] ? second : first
    const step = white[stepAxis] + white[stepAxis] - other[stepAxis]
    return (lineAxis === 'file'
      ? squareFromCoordinates(first.file, step)
      : squareFromCoordinates(step, first.rank)) ?? undefined
  }
  return undefined
}

type RuleR22Plan = {
  readonly behindSquares: readonly Square[]
  readonly bishopSquare: Square
  readonly axis: DiagonalAxis
  readonly outerIndex: number
}

function ruleR22Plans({ bishops, whiteKing, blackKing }: TwoBishopsPieces): readonly RuleR22Plan[] {
  if (whiteKing === undefined || blackKing === undefined) return []
  return smallestDiagonalWalls(getDiagonalWalls(bishops, blackKing)).flatMap((wall) => {
    const innerIndex = diagonalIndex(wall.innerBishop, wall.axis)
    const whiteIndex = diagonalIndex(whiteKing, wall.axis)
    const inside = wall.side === 'minimum' ? whiteIndex <= innerIndex : whiteIndex >= innerIndex
    if (!inside) return []
    const candidates = allSquares().filter((square) =>
      diagonalIndex(square, wall.axis) === innerIndex &&
      square !== whiteKing &&
      edgeDistance(square) > 0 &&
      squaredEuclideanDistance(whiteKing, square) <= squaredEuclideanDistance(blackKing, square),
    )
    const closest = Math.min(...candidates.map((square) => squaredEuclideanDistance(whiteKing, square)))
    return candidates.filter((square) => squaredEuclideanDistance(whiteKing, square) === closest)
      .flatMap((bishopSquare) => {
        const bishopDistance = squaredEuclideanDistance(blackKing, bishopSquare)
        const behindSquares = allSquares().filter((square) => {
          const index = diagonalIndex(square, wall.axis)
          const inside = wall.side === 'minimum' ? index < innerIndex : index > innerIndex
          return inside && kingDistance(square, bishopSquare) === 1 &&
            squaredEuclideanDistance(blackKing, square) > bishopDistance
        })
        return [{ behindSquares, bishopSquare, axis: wall.axis,
          outerIndex: diagonalIndex(wall.outerBishop, wall.axis) }]
      })
  })
}

function scoreRuleR22(
  plans: readonly RuleR22Plan[],
  { bishops: resultBishops, whiteKing: resultKing }: TwoBishopsPieces,
): {
  readonly applies: boolean
  readonly bishopPenalty: number
  readonly kingDistance: number
} {
  if (plans.length === 0 || resultKing === undefined) {
    return { applies: false, bishopPenalty: 0, kingDistance: 0 }
  }
  const scores = plans.map(({ behindSquares, bishopSquare, axis, outerIndex }) => {
    // Keep the inner bishop placed, but let the outer bishop make room along
    // its wall instead of forcing the king to give up its behind-bishop square.
    const placed = resultBishops.includes(bishopSquare) && resultBishops.some(
      (bishop) => bishop !== bishopSquare && diagonalIndex(bishop, axis) === outerIndex,
    )
    return {
      applies: true,
      bishopPenalty: placed ? 0 : 1,
      kingDistance: placed
        ? Math.min(99, ...behindSquares.map((square) => kingDistance(resultKing, square)))
        : 0,
    }
  })
  return scores.sort((first, second) =>
    first.bishopPenalty - second.bishopPenalty || first.kingDistance - second.kingDistance,
  )[0]!
}

function ruleR18Targets(fen: string): readonly Square[] {
  const bishops = getWhiteBishopSquares(fen)
  const blackKing = findPiece(fen, 'b', 'k')?.square
  return smallestDiagonalWalls(getDiagonalWalls(bishops, blackKing)).flatMap((wall) => {
    const innerIndex = diagonalIndex(wall.innerBishop, wall.axis)
    if (diagonalLength(innerIndex, wall.axis) !== 5) return []
    const corner = targetCorner(wall.axis, wall.side)
    const innerSquares = allSquares().filter((square) =>
      diagonalIndex(square, wall.axis) === innerIndex,
    )
    if (innerSquares.some((square) => isOnTargetCornerEdge(square, corner))) return []
    return innerSquares.filter((square) => {
      const { file, rank } = squareCoordinates(square)
      return file === rank || file + rank === 7
    })
  })
}

function scoreRuleR19({ bishops, blackKing }: TwoBishopsPieces): number {
  if (blackKing === undefined) return 1
  return getDiagonalWalls(bishops, blackKing).some(
    (wall) => kingDistance(wall.outerBishop, blackKing) >= 3,
  )
    ? 0
    : 1
}

export function getTwoBishopsPhaseLabel(fen: string): string {
  return isTwoBishopsPhaseTwoPosition(fen) ? '2/2' : '1/2'
}

export function getAdjacentDiagonalWallTargetCorners(
  bishops: readonly Square[],
  blackKing: Square | undefined,
): readonly Square[] {
  const walls = getAdjacentDiagonalWalls(bishops, blackKing)
  const bestCount = Math.min(...walls.map(({ diagonalCount }) => diagonalCount))
  return walls
    .filter(({ diagonalCount }) => diagonalCount === bestCount)
    .map(({ targetCorner: corner }) => corner)
}

export const twoBishopsWhiteRules: readonly OrderedRule<TwoBishopsWhiteMoveScore>[] =
  [
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
      id: 'rule r3',
      shortLabel: 'rule r3',
      helpText: "Prefer White's king out of the corner.",
      compare: (first, second) =>
        first.ruleR3CornerPenalty - second.ruleR3CornerPenalty,
    },
    {
      id: 'rule r4',
      shortLabel: 'rule r4',
      applies: (score) => score.ruleR4Applies,
      helpText: 'Phase 2: Execute the mating pattern.',
      compare: (first, second) =>
        first.ruleR4Penalty - second.ruleR4Penalty,
    },
    {
      id: 'rule r5',
      shortLabel: 'rule r5',
      helpText:
        'Prefer bishops on adjacent squares on their Phase 2 diagonals, enclosing Black on 2 edge squares, then prefer the White king on the Phase 2 square in line with those bishops.',
      subpriorities: [
        {
          compare: (first, second) =>
            first.ruleR5BishopPenalty - second.ruleR5BishopPenalty,
        },
        {
          compare: (first, second) =>
            first.ruleR5OrientationPenalty - second.ruleR5OrientationPenalty,
        },
        {
          compare: (first, second) =>
            first.ruleR5CagePenalty - second.ruleR5CagePenalty,
        },
        {
          compare: (first, second) =>
            first.ruleR5KingDistance - second.ruleR5KingDistance,
        },
      ],
    },
    {
      id: 'rule r6',
      shortLabel: 'rule r6',
      applies: (score) => score.ruleR6Applies,
      helpText:
        "Prefer bishops on their Phase 2 diagonals, then prefer Bishops on their Phase 2 squares, then prefer the shortest king path to its Phase 2 square without entering Black's area, then Euclidean proximity.",
      subpriorities: [
        {
          compare: (first, second) =>
            first.ruleR6DiagonalPenalty - second.ruleR6DiagonalPenalty,
        },
        {
          compare: (first, second) =>
            first.ruleR6SquarePenalty - second.ruleR6SquarePenalty,
        },
        {
          compare: (first, second) =>
            first.ruleR6KingAreaPenalty - second.ruleR6KingAreaPenalty,
        },
        {
          compare: (first, second) =>
            first.ruleR6KingPathDistance - second.ruleR6KingPathDistance,
        },
        {
          compare: (first, second) =>
            first.ruleR6KingDistance - second.ruleR6KingDistance,
        },
      ],
    },
    {
      id: 'rule r8',
      shortLabel: 'rule r8',
      helpText:
        "With Black's king in the corner, prefer White's king on a Phase 2 square associated with that corner.",
      compare: (first, second) =>
        first.ruleR8KingSquarePenalty - second.ruleR8KingSquarePenalty,
    },
    {
      id: 'rule r10',
      shortLabel: 'rule r10',
      helpText:
        "Prefer fewer diagonals for Black's king, then bishops off the target corner's edge, except the Phase 2 diagonals, then White king's step proximity to the target square.",
      subpriorities: [
        {
          compare: (first, second) =>
            first.ruleR10DiagonalCount - second.ruleR10DiagonalCount,
        },
        {
          compare: (first, second) =>
            first.ruleR10EdgePenalty - second.ruleR10EdgePenalty,
        },
        {
          compare: (first, second) =>
            first.ruleR10KingDistance - second.ruleR10KingDistance,
        },
      ],
    },
    {
      id: 'rule r11',
      shortLabel: 'rule r11',
      helpText:
        "Play the flank step. With adjacent bishops on different halves of the board, White's king adjacent to both, and the kings in line three steps apart on opposite sides of the bishops, move White's king into line with the bishops.",
      applies: (score) => score.ruleR11Applies,
      compare: (first, second) => first.ruleR11Penalty - second.ruleR11Penalty,
    },
    {
      id: 'rule r12',
      shortLabel: 'rule r12',
      helpText:
        "Without a target square, prefer White’s king closer to the diagonal one beyond the outer wall.",
      applies: (score) => score.ruleR10TargetPenalty === 1 && score.ruleR12KingDistance < 99,
      compare: (first, second) => first.ruleR12KingDistance - second.ruleR12KingDistance,
    },
    {
      id: 'rule r18',
      shortLabel: 'rule r18',
      helpText:
        "Play the choke move. When the inner wall has five squares and touches neither of the target corner's edges, prefer the inner-wall bishop on the long diagonal.",
      applies: (score) => score.ruleR18Applies,
      compare: (first, second) => first.ruleR18Penalty - second.ruleR18Penalty,
    },
    {
      id: 'rule r19',
      shortLabel: 'rule r19',
      helpText: "Prefer the outer bishop at least 3 steps away from Black's king.",
      compare: (first, second) => first.ruleR19Penalty - second.ruleR19Penalty,
    },
    {
      id: 'rule r22',
      shortLabel: 'rule r22',
      helpText:
        "If the White king is inside Black's diagonals, place the inner bishop on the non-edge wall diagonal square closest to White's king but not closer to Black's king. Then, walk the king behind that bishop, allowing the outer bishop to move along its wall to make room.",
      applies: (score) => score.ruleR22Applies,
      subpriorities: [
        { compare: (first, second) => first.ruleR22BishopPenalty - second.ruleR22BishopPenalty },
        { compare: (first, second) => first.ruleR22KingDistance - second.ruleR22KingDistance },
      ],
    },
    {
      id: 'rule r25',
      shortLabel: 'rule r25',
      helpText: 'Prefer king proximity.',
      compare: (first, second) =>
        first.ruleR25KingDistance - second.ruleR25KingDistance,
    },
    {
      id: 'rule r30',
      shortLabel: 'rule r30',
      helpText:
        "Prefer bishops further from Black's king, then prefer bishops closer to White's king.",
      subpriorities: [
        {
          compare: (first, second) =>
            second.ruleR30NearerBishopDistance -
            first.ruleR30NearerBishopDistance,
        },
        {
          compare: (first, second) =>
            second.ruleR30FartherBishopDistance -
            first.ruleR30FartherBishopDistance,
        },
        {
          compare: (first, second) =>
            first.ruleR30FartherWhiteKingDistance -
            second.ruleR30FartherWhiteKingDistance,
        },
        {
          compare: (first, second) =>
            first.ruleR30NearerWhiteKingDistance -
            second.ruleR30NearerWhiteKingDistance,
        },
      ],
    },
  ]

export function compareTwoBishopsWhiteScores(
  first: TwoBishopsWhiteMoveScore,
  second: TwoBishopsWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, twoBishopsWhiteRules)
}

type WhiteScoringContext = {
  readonly pieces: TwoBishopsPieces
  readonly ruleR4Matches: readonly RuleR4Match[]
  readonly ruleR4ForcedMateNext: boolean
  readonly ruleR6Templates: readonly PhaseTwoTemplate[]
  readonly ruleR11Target: Square | undefined
  readonly ruleR18Targets: readonly Square[]
  readonly ruleR22Plans: readonly RuleR22Plan[]
}

function whiteScoringContext(fen: string): WhiteScoringContext {
  const pieces = twoBishopsPieces(getChess(fen))
  const matches = getRuleR4Matches(fen)
  const { blackKing } = pieces
  return {
    pieces,
    ruleR4Matches: matches,
    ruleR4ForcedMateNext: matches.length > 0 && blackKing !== undefined &&
      (['a1', 'a8', 'h1', 'h8'] as const).some(
        (corner) => kingDistance(blackKing, corner) === 1,
      ) && ruleR4HasForcedMateNext(fen),
    ruleR6Templates: ruleR6Templates(fen),
    ruleR11Target: flankStepTarget(fen),
    ruleR18Targets: ruleR18Targets(fen),
    ruleR22Plans: ruleR22Plans(pieces),
  }
}

export function scoreTwoBishopsWhiteMove(
  fen: string,
  san: string,
): TwoBishopsWhiteMoveScore {
  return scoreWhiteMove(fen, san)
}

function scoreWhiteMove(
  fen: string,
  san: string,
  startingContext?: WhiteScoringContext,
): TwoBishopsWhiteMoveScore {
  const chess = getChess(fen)
  chess.move(san)
  const resultFen = chess.fen()
  const context = startingContext ?? whiteScoringContext(fen)
  const mate = chess.isCheckmate()
  const blackReplies = chess.moves({ verbose: true })
  const resultPieces = twoBishopsPieces(chess)
  const { bishops, blackKing, whiteKing } = resultPieces
  const forcedReplySquares = blackReplies.some(
    (reply) => reply.captured === 'b',
  )
    ? undefined
    : blackReplies.map((reply) => reply.to)
  const allWalls = getAdjacentDiagonalWalls(
    bishops,
    blackKing,
    forcedReplySquares,
  )
  const separatingWalls = allWalls.filter((wall) =>
    wallSeparatesWhite(wall, whiteKing),
  )
  const preferredWalls =
    separatingWalls.length > 0 ? separatingWalls : allWalls
  const diagonalCount = Math.min(
    ...preferredWalls.map((wall) => wall.diagonalCount),
  )
  const targetCorners = preferredWalls
    .filter((wall) => wall.diagonalCount === diagonalCount)
    .map((wall) => wall.targetCorner)
  const targetWalls = getAdjacentDiagonalWalls(bishops, blackKing, undefined, true)
  const ruleR10 = scoreRuleR10(
    targetWalls,
    bishops,
    blackKing,
    whiteKing,
    blackReplies.map(({ to }) => to),
  )
  const ruleR11Target = context.ruleR11Target
  const ruleR22 = scoreRuleR22(context.ruleR22Plans, resultPieces)
  const chokeTargets = context.ruleR18Targets
  const ruleR6Applies = context.ruleR6Templates.length > 0
  const ruleR6 = scoreRuleR6(context.ruleR6Templates, resultFen, resultPieces)
  const ruleR5 = scoreRuleR5(context.pieces.bishops, resultFen, resultPieces)
  const ruleR4Matches = context.ruleR4Matches
  const bishopDistances =
    blackKing === undefined
      ? [0, 0]
      : bishops
          .map((bishop) => squaredEuclideanDistance(bishop, blackKing))
          .sort((first, second) => first - second)
  const whiteKingBishopDistances =
    whiteKing === undefined
      ? [0, 0]
      : bishops
          .map((bishop) => squaredEuclideanDistance(bishop, whiteKing))
          .sort((first, second) => first - second)

  return {
    matePenalty: mate ? 0 : 1,
    bishopSafetyPenalty: blackReplies.some((reply) => reply.captured === 'b')
      ? 1
      : 0,
    stalematePenalty: !mate && chess.isStalemate() ? 1 : 0,
    ruleR4Applies: ruleR4Matches.length > 0,
    ruleR4Penalty: scoreRuleR4(fen, resultFen, context, resultPieces),
    ruleR5BishopPenalty: ruleR5.bishopPenalty,
    ruleR5OrientationPenalty: ruleR5.orientationPenalty,
    ruleR5CagePenalty: ruleR5.cagePenalty,
    ruleR5KingDistance: ruleR5.kingDistance,
    ruleR6Applies,
    ruleR6DiagonalPenalty: ruleR6.diagonalPenalty,
    ruleR6SquarePenalty: ruleR6.squarePenalty,
    ruleR6KingAreaPenalty: ruleR6.kingAreaPenalty,
    ruleR6KingPathDistance: ruleR6.kingPathDistance,
    ruleR6KingDistance: ruleR6.kingDistance,
    ruleR3CornerPenalty:
      whiteKing === undefined || isCornerSquare(whiteKing) ? 1 : 0,
    ruleR8KingSquarePenalty: scoreRuleR8(resultPieces),
    ruleR10EdgePenalty: bishops.filter(
      (bishop) =>
        targetCorners.length > 0 &&
        targetCorners.every(
          (corner) =>
            isOnTargetCornerEdge(bishop, corner) &&
            !isOnPhaseTwoDiagonal(bishop, corner),
        ),
    ).length,
    ruleR10TargetPenalty: ruleR10.targetPenalty,
    ruleR10DiagonalCount: ruleR10.diagonalCount,
    ruleR10TargetSquares: ruleR10.targetSquares,
    ruleR10KingDistance: ruleR10.kingDistance,
    ruleR11Applies: ruleR11Target !== undefined,
    ruleR11Penalty: ruleR11Target === undefined || whiteKing === ruleR11Target ? 0 : 1,
    ruleR12KingDistance: ruleR10.beyondDistance,
    ruleR18Applies: chokeTargets.length > 0,
    ruleR18Penalty: chokeTargets.length === 0 || chokeTargets.some((square) => bishops.includes(square)) ? 0 : 1,
    ruleR19Penalty: scoreRuleR19(resultPieces),
    ruleR22Applies: ruleR22.applies,
    ruleR22BishopPenalty: ruleR22.bishopPenalty,
    ruleR22KingDistance: ruleR22.kingDistance,
    ruleR25KingDistance:
      whiteKing === undefined || blackKing === undefined
        ? 99
        : squaredEuclideanDistance(whiteKing, blackKing),
    ruleR30NearerBishopDistance: bishopDistances[0] ?? 0,
    ruleR30FartherBishopDistance: bishopDistances[1] ?? 0,
    ruleR30FartherWhiteKingDistance: whiteKingBishopDistances[1] ?? 0,
    ruleR30NearerWhiteKingDistance: whiteKingBishopDistances[0] ?? 0,
  }
}

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

function scoreWhiteCandidates(
  fen: string,
  moves: readonly string[],
): readonly ScoredMove<TwoBishopsWhiteMoveScore>[] {
  if (moves.length === 0) return []
  // Starting geometry is shared by every candidate; result pieces are read once
  // from each moved board. Keep this context local so no state survives a call.
  const context = whiteScoringContext(fen)
  return moves.map((san) => ({
    san,
    score: scoreWhiteMove(fen, san, context),
  }))
}

export type TwoBishopsWhiteSelectionAnalysis = {
  readonly idealWhiteMoves: readonly string[]
  readonly ruleFilterCounts: Readonly<Record<string, number>>
}

export function analyzeTwoBishopsWhiteSelection(
  fen: string,
): TwoBishopsWhiteSelectionAnalysis {
  const selection = selectCandidatesByRules(
    scoreWhiteCandidates(fen, whiteLegalMoves(fen)),
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

export function getIdealTwoBishopsWhiteMoves(fen: string): string[] {
  return [...analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves]
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
  const scored = moves.map((san) => ({
    san,
    score: scoreTwoBishopsBlackMove(fen, san),
  }))
  const first = scored[0]
  if (!first) return []
  let best = first
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
  return {
    moves,
    idealMoves: getIdealTwoBishopsBlackMoves(
      fen,
      applyUniversalBlackPriorities(fen, previousTurnFen, moves),
    ),
  }
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

export { getProximateBishopWall } from './twoBishopsGeometry'
