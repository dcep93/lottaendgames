import type { Square } from 'chess.js'
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
  withFenTurn,
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
  readonly ruleR6KingDistance: number
  readonly ruleR9Penalty: number
  readonly ruleR10Penalty: number
  readonly ruleR10DiagonalCount: number
  readonly ruleR12EdgePenalty: number
  readonly ruleR17KingDistance: number
  readonly ruleR19Penalty: number
  readonly ruleR25KingDistance: number
  readonly ruleR20Penalty: number
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

type AdjacentDiagonalWall = {
  readonly diagonalCount: number
  readonly targetCorner: Square
}

type RuleR9Wall = {
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

const RULE_R12_NOTE_BOARD = {
  id: 'two-bishops-rule-r12',
  title: 'rule r12',
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
    'Phase 2 is recognized when rule r4 matches: the bishops occupy their Phase 2 diagonals, White occupies its Phase 2 square, and Black occupies one of the four edge squares in the corner cage, under rotation or reflection.',
  ],
  noteBoards: [PHASE_TWO_NOTE_BOARD, RULE_R12_NOTE_BOARD],
}

function diagonalIndex(square: Square, axis: DiagonalAxis): number {
  const { file, rank } = squareCoordinates(square)
  return axis === 'difference' ? file - rank : file + rank
}

function diagonalIndexRange(axis: DiagonalAxis): readonly [number, number] {
  return axis === 'difference' ? [-7, 7] : [0, 14]
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

function isOnPhaseTwoOuterDiagonal(square: Square, corner: Square): boolean {
  return PHASE_TWO_TEMPLATES.some(
    (template) =>
      template.targetCorner === corner &&
      template.outerDiagonal.includes(square),
  )
}

function getAdjacentDiagonalWalls(
  bishops: readonly Square[],
  blackKing: Square | undefined,
  forcedReplySquares: readonly Square[] | undefined = undefined,
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
      (blackIndex < lower || forcedToMinimumSide) &&
      minimumSideDiagonalCount >= 4
    ) {
      walls.push({
        diagonalCount: minimumSideDiagonalCount,
        targetCorner: targetCorner(axis, 'minimum'),
      })
    } else if (
      (blackIndex > upper || forcedToMaximumSide) &&
      maximumSideDiagonalCount >= 4
    ) {
      walls.push({
        diagonalCount: maximumSideDiagonalCount,
        targetCorner: targetCorner(axis, 'maximum'),
      })
    }
  }
  return walls
}

function hasRuleR10FourDiagonalWall(
  bishops: readonly Square[],
  blackKing: Square | undefined,
  forcedReplySquares: readonly Square[] | undefined = undefined,
): boolean {
  return getAdjacentDiagonalWalls(
    bishops,
    blackKing,
    forcedReplySquares,
  ).some(({ diagonalCount }) => diagonalCount === 4)
}

function getRuleR9Walls(
  bishops: readonly Square[],
  blackKing: Square | undefined,
): readonly RuleR9Wall[] {
  if (bishops.length !== 2 || blackKing === undefined) return []
  const walls: RuleR9Wall[] = []
  for (const axis of ['difference', 'sum'] as const) {
    const indexedBishops = bishops
      .map((bishop) => ({ bishop, index: diagonalIndex(bishop, axis) }))
      .sort((first, second) => first.index - second.index)
    const lowerBishop = indexedBishops[0]!
    const upperBishop = indexedBishops[1]!
    if (upperBishop.index - lowerBishop.index !== 1) continue

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

function isInsideRuleR9Wall(square: Square, wall: RuleR9Wall): boolean {
  const index = diagonalIndex(square, wall.axis)
  return wall.side === 'minimum' ? index <= wall.upper : index >= wall.lower
}

function isOnBlackSideOfRuleR9InnerWall(
  square: Square,
  wall: RuleR9Wall,
): boolean {
  const index = diagonalIndex(square, wall.axis)
  return wall.side === 'minimum' ? index <= wall.lower : index >= wall.upper
}

function isOnRuleR9OuterWall(square: Square, wall: RuleR9Wall): boolean {
  const index = diagonalIndex(square, wall.axis)
  return index === (wall.side === 'minimum' ? wall.upper : wall.lower)
}

function whiteKingScreensRuleR9Wall(
  whiteKing: Square,
  blackKing: Square,
  wall: RuleR9Wall,
): boolean {
  return [wall.innerBishop, wall.outerBishop].some((bishop) => {
    if (
      !bishopControlsSquare(bishop, whiteKing) ||
      !bishopControlsSquare(bishop, blackKing)
    ) {
      return false
    }
    return (
      kingDistance(bishop, whiteKing) + kingDistance(whiteKing, blackKing) ===
      kingDistance(bishop, blackKing)
    )
  })
}

function ruleR9StagingSquares(
  fen: string,
  wall: RuleR9Wall,
  blackKing: Square,
  whiteKing: Square,
): readonly Square[] {
  const chess = getChess(fen)
  const { file, rank } = squareCoordinates(wall.innerBishop)
  const candidates = [
    squareFromCoordinates(file - 1, rank),
    squareFromCoordinates(file + 1, rank),
    squareFromCoordinates(file, rank - 1),
    squareFromCoordinates(file, rank + 1),
  ].filter(
    (square): square is Square =>
      square !== null &&
      isOnBlackSideOfRuleR9InnerWall(square, wall) &&
      (square === whiteKing || chess.get(square) === undefined),
  )
  const farthestDistance = Math.max(
    ...candidates.map((square) => squaredEuclideanDistance(square, blackKing)),
  )
  return candidates.filter(
    (square) =>
      squaredEuclideanDistance(square, blackKing) === farthestDistance,
  )
}

function ruleR9OuterTarget(
  stagingSquare: Square,
  innerBishop: Square,
): Square | null {
  const staging = squareCoordinates(stagingSquare)
  const inner = squareCoordinates(innerBishop)
  return squareFromCoordinates(
    inner.file + (inner.file - staging.file),
    inner.rank + (inner.rank - staging.rank),
  )
}

function smallestRuleR9Walls(
  walls: readonly RuleR9Wall[],
): readonly RuleR9Wall[] {
  const smallestCount = Math.min(...walls.map((wall) => wall.diagonalCount))
  return walls.filter((wall) => wall.diagonalCount === smallestCount)
}

type RuleR6Score = {
  readonly diagonalPenalty: number
  readonly squarePenalty: number
  readonly kingAreaPenalty: number
  readonly kingDistance: number
}

function compareRuleR6Scores(first: RuleR6Score, second: RuleR6Score): number {
  return (
    first.diagonalPenalty - second.diagonalPenalty ||
    first.squarePenalty - second.squarePenalty ||
    first.kingAreaPenalty - second.kingAreaPenalty ||
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

function scoreRuleR5(resultFen: string): RuleR5Score {
  const bishops = getWhiteBishopSquares(resultFen)
  const blackKing = findPiece(resultFen, 'b', 'k')?.square
  const whiteKing = findPiece(resultFen, 'w', 'k')?.square
  if (bishops.length !== 2 || blackKing === undefined || whiteKing === undefined) {
    return {
      bishopPenalty: 1,
      orientationPenalty: 1,
      cagePenalty: 1,
      kingDistance: 0,
    }
  }
  const matches = phaseTwoInlineKingTargets(bishops)
  if (matches.length === 0) {
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
    area.length === 2 && area.every((square) => edgeDistance(square) === 0)
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
    orientationPenalty: enclosingMatches.length > 0 ? 0 : 1,
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
  const wallCorners = smallestRuleR9Walls(
    getRuleR9Walls(bishops, blackKing),
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

function scoreRuleR6(fen: string, resultFen: string): RuleR6Score {
  const templates = ruleR6Templates(fen)
  const bishops = getWhiteBishopSquares(resultFen)
  const whiteKing = findPiece(resultFen, 'w', 'k')?.square
  if (templates.length === 0 || whiteKing === undefined) {
    return {
      diagonalPenalty: 0,
      squarePenalty: 0,
      kingAreaPenalty: 0,
      kingDistance: 0,
    }
  }
  const scores = templates.map((template): RuleR6Score => {
    const innerOccupied = bishops.some((bishop) =>
      template.innerDiagonal.includes(bishop),
    )
    const outerOccupied = bishops.some((bishop) =>
      template.outerDiagonal.includes(bishop),
    )
    const diagonalPenalty =
      2 - Number(innerOccupied) - Number(outerOccupied)
    return {
      diagonalPenalty,
      squarePenalty:
        2 -
        Number(bishops.includes(template.innerSquare)) -
        Number(
          bishops.some((bishop) => template.outerPhaseSquares.includes(bishop)),
        ),
      kingAreaPenalty:
        diagonalPenalty === 0
          ? ruleR6KingAreaPenalty(whiteKing, bishops, template)
          : 0,
      kingDistance:
        diagonalPenalty === 0
          ? Math.sqrt(
              squaredEuclideanDistance(whiteKing, template.kingTargetSquare),
            )
          : 0,
    }
  })
  return scores.sort(compareRuleR6Scores)[0]!
}

function scoreRuleR9(fen: string, resultFen: string): number {
  const startingBishops = getWhiteBishopSquares(fen)
  const startingBlackKing = findPiece(fen, 'b', 'k')?.square
  if (
    startingBlackKing !== undefined &&
    PHASE_TWO_TEMPLATES.some((template) =>
      bishopsOccupyPhaseTwoDiagonals(startingBishops, template) &&
      isInsidePhaseTwoBlackArea(startingBlackKing, template),
    )
  ) {
    return 0
  }
  const startingWhiteKing = findPiece(fen, 'w', 'k')?.square
  const resultWhiteKing = findPiece(resultFen, 'w', 'k')?.square
  if (
    startingBlackKing === undefined ||
    startingWhiteKing === undefined ||
    resultWhiteKing === undefined
  ) {
    return 0
  }

  const walls = smallestRuleR9Walls(
    getRuleR9Walls(startingBishops, startingBlackKing).filter(
      (wall) =>
        !whiteKingScreensRuleR9Wall(startingWhiteKing, startingBlackKing, wall),
    ),
  )
  if (walls.some((wall) => !isInsideRuleR9Wall(startingWhiteKing, wall))) {
    return 0
  }
  const alignedWalls = walls.filter((wall) => {
    const inner = squareCoordinates(wall.innerBishop)
    const outer = squareCoordinates(wall.outerBishop)
    if (
      Math.abs(inner.file - outer.file) + Math.abs(inner.rank - outer.rank) !==
      1
    ) {
      return false
    }
    const stagingSquare = ruleR9OuterTarget(wall.outerBishop, wall.innerBishop)
    if (
      stagingSquare === null ||
      (startingWhiteKing !== stagingSquare &&
        !(
          walls.length === 1 && isOnRuleR9OuterWall(startingWhiteKing, wall)
        )) ||
      !isOnBlackSideOfRuleR9InnerWall(stagingSquare, wall)
    ) {
      return false
    }
    return isInsideRuleR9Wall(startingWhiteKing, wall)
  })
  if (alignedWalls.length > 0) {
    return Math.min(
      ...alignedWalls.map((wall) => {
        const resultIndex = diagonalIndex(resultWhiteKing, wall.axis)
        return wall.side === 'minimum'
          ? Math.max(0, wall.upper + 1 - resultIndex)
          : Math.max(0, resultIndex - (wall.lower - 1))
      }),
    )
  }

  const setupWalls = walls.filter((wall) =>
    isInsideRuleR9Wall(startingWhiteKing, wall),
  )
  if (setupWalls.length === 0) return 0
  const stagingOptions = setupWalls.flatMap((wall) =>
    ruleR9StagingSquares(fen, wall, startingBlackKing, startingWhiteKing).map(
      (stagingSquare) => ({ wall, stagingSquare }),
    ),
  )
  const reachedStaging = stagingOptions.filter(
    ({ stagingSquare }) => stagingSquare === startingWhiteKing,
  )
  if (reachedStaging.length === 0) {
    return Math.min(
      ...stagingOptions.map(({ stagingSquare }) =>
        kingDistance(resultWhiteKing, stagingSquare),
      ),
    )
  }

  const resultBishops = getWhiteBishopSquares(resultFen)
  return reachedStaging.some(({ wall, stagingSquare }) => {
    const outerTarget = ruleR9OuterTarget(stagingSquare, wall.innerBishop)
    return (
      outerTarget !== null &&
      resultBishops.includes(wall.innerBishop) &&
      resultBishops.includes(outerTarget)
    )
  })
    ? 0
    : 1
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
    if (square === null || chess.get(square) !== undefined) return false
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

function getRuleR4Matches(fen: string): readonly RuleR4Match[] {
  const bishops = getWhiteBishopSquares(fen)
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  if (blackKing === undefined || whiteKing === undefined) return []
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
  const exactPatternMatches = SQUARE_TRANSFORMS.flatMap(
    (transform): readonly RuleR4Match[] => {
      const patterns = [
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
  return exactPatternMatches.length > 0
    ? exactPatternMatches
    : [...phaseTwoMatches, ...diagonalWaitingMatches]
}

function scoreRuleR4(fen: string, resultFen: string): number {
  const matches = getRuleR4Matches(fen)
  if (matches.length === 0) return 0
  const startingBishops = getWhiteBishopSquares(fen)
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const resultChess = getChess(resultFen)
  const resultBishops = getWhiteBishopSquares(resultFen)
  const resultWhiteKing = findPiece(resultFen, 'w', 'k')?.square
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

function scoreRuleR17(fen: string): number {
  const bishops = getWhiteBishopSquares(fen)
  const blackKing = findPiece(fen, 'b', 'k')?.square
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  if (blackKing === undefined || whiteKing === undefined) return 0
  const walls = smallestRuleR9Walls(getRuleR9Walls(bishops, blackKing))
  const targetDiagonals = walls.map((wall) => ({
    axis: wall.axis,
    index: wall.side === 'minimum' ? wall.upper + 1 : wall.lower - 1,
  }))
  const targetSquares = allSquares().filter((square) =>
    targetDiagonals.some(
      (target) => diagonalIndex(square, target.axis) === target.index,
    ),
  )
  return targetSquares.length === 0
    ? 0
    : Math.min(...targetSquares.map((square) => kingDistance(whiteKing, square)))
}

function wallHasSafeCheckingShrink(
  fen: string,
  wall: RuleR9Wall,
  whiteKing: Square,
  blackKing: Square,
): boolean {
  if (
    wall.diagonalCount <= 4 ||
    isInsideRuleR9Wall(whiteKing, wall) ||
    whiteKingScreensRuleR9Wall(whiteKing, blackKing, wall)
  ) {
    return false
  }
  const inwardIndex =
    wall.side === 'minimum' ? wall.lower - 1 : wall.upper + 1
  const chess = getChess(withFenTurn(fen, 'w'))
  return allSquares().some((target) => {
    if (
      diagonalIndex(target, wall.axis) !== inwardIndex ||
      chess.get(target) !== undefined ||
      !bishopControlsSquareInPosition(fen, wall.outerBishop, target)
    ) {
      return false
    }
    const move = chess
      .moves({ verbose: true })
      .find(
        (candidate) =>
          candidate.from === wall.outerBishop && candidate.to === target,
    )
    if (move === undefined) return false
    chess.move(move)
    const replies = chess.moves({ verbose: true })
    const forcedReplySquares = replies.some((reply) => reply.captured === 'b')
      ? undefined
      : replies.map((reply) => reply.to)
    const protectedFromCapture =
      kingDistance(whiteKing, target) === 1 ||
      bishopControlsSquareInPosition(fen, wall.innerBishop, target)
    const shrinksWall =
      (kingDistance(blackKing, target) !== 1 || protectedFromCapture) &&
      chess.isCheck() &&
      getAdjacentDiagonalWalls(
        getWhiteBishopSquares(chess.fen()),
        blackKing,
        forcedReplySquares,
      ).some(
        ({ diagonalCount }) =>
          diagonalCount >= 4 && diagonalCount < wall.diagonalCount,
      )
    chess.undo()
    return shrinksWall
  })
}

function isRuleR19WaitingPreparation(fen: string): boolean {
  const bishops = getWhiteBishopSquares(fen)
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const blackKing = findPiece(fen, 'b', 'k')?.square
  if (whiteKing === undefined || blackKing === undefined) return false
  return SQUARE_TRANSFORMS.some((transform) => {
    const firstPatternBishops = [
      transformSquare('c2', transform),
      transformSquare('g5', transform),
    ]
    const matchesFirstPattern =
      whiteKing === transformSquare('d4', transform) &&
      blackKing === transformSquare('e2', transform) &&
      firstPatternBishops.every((bishop) => bishops.includes(bishop))
    const canonicalWhiteKing = squareCoordinates(
      transformSquare('c4', transform),
    )
    const resultWhiteKing = squareCoordinates(whiteKing)
    const fileOffset = resultWhiteKing.file - canonicalWhiteKing.file
    const rankOffset = resultWhiteKing.rank - canonicalWhiteKing.rank
    const translatedPatternSquare = (square: Square): Square | null => {
      const transformed = squareCoordinates(transformSquare(square, transform))
      return squareFromCoordinates(
        transformed.file + fileOffset,
        transformed.rank + rankOffset,
      )
    }
    const secondPatternBlackKing = translatedPatternSquare('d2')
    const secondPatternFixedBishop = translatedPatternSquare('b2')
    const secondPatternInnerBishop = translatedPatternSquare('g6')
    const matchesSecondPattern =
      blackKing === secondPatternBlackKing &&
      secondPatternFixedBishop !== null &&
      secondPatternInnerBishop !== null &&
      bishops.includes(secondPatternFixedBishop) &&
      bishops.includes(secondPatternInnerBishop)
    return matchesFirstPattern || matchesSecondPattern
  })
}

function scoreRuleR19(fen: string): number {
  const bishops = getWhiteBishopSquares(fen)
  const whiteKing = findPiece(fen, 'w', 'k')?.square
  const blackKing = findPiece(fen, 'b', 'k')?.square
  if (whiteKing === undefined || blackKing === undefined) return 1
  if (isRuleR19WaitingPreparation(fen)) return 0
  return getRuleR9Walls(bishops, blackKing).some((wall) =>
    wallHasSafeCheckingShrink(fen, wall, whiteKing, blackKing),
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
        "With bishops on their Phase 2 diagonals, then prefer Bishops on their Phase 2 squares, then prefer king proximity to its Phase 2 square, without entering Black's area.",
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
            first.ruleR6KingDistance - second.ruleR6KingDistance,
        },
      ],
    },
    {
      id: 'rule r9',
      shortLabel: 'rule r9',
      helpText:
        "If White's king is inside the smallest adjacent diagonals that enclose Black, unless they are phase 2 diagonals, walk the king toward the inside square edge-adjacent to the inner bishop and farther from Black's king. Then place the outer bishop in line with the other two pieces, then walk the king through the wall to the side opposite Black's king.",
      compare: (first, second) => first.ruleR9Penalty - second.ruleR9Penalty,
    },
    {
      id: 'rule r10',
      shortLabel: 'rule r10',
      helpText:
        'Prefer controlling adjacent diagonals leaving Black as few diagonals as possible within its corner, but at least 4.',
      subpriorities: [
        {
          compare: (first, second) =>
            first.ruleR10Penalty - second.ruleR10Penalty,
        },
        {
          compare: (first, second) =>
            first.ruleR10DiagonalCount - second.ruleR10DiagonalCount,
        },
      ],
    },
    {
      id: 'rule r12',
      shortLabel: 'rule r12',
      helpText:
        "Prefer bishops off the target corner's edge, except the Phase 2 diagonal.",
      compare: (first, second) =>
        first.ruleR12EdgePenalty - second.ruleR12EdgePenalty,
    },
    {
      id: 'rule r17',
      shortLabel: 'rule r17',
      helpText: 'Prefer king proximity to the diagonal one beyond the outer wall.',
      compare: (first, second) =>
        first.ruleR17KingDistance - second.ruleR17KingDistance,
    },
    {
      id: 'rule r19',
      shortLabel: 'rule r19',
      helpText: 'Prefer a shrinkable wall.',
      compare: (first, second) => first.ruleR19Penalty - second.ruleR19Penalty,
    },
    {
      id: 'rule r20',
      shortLabel: 'rule r20',
      helpText: 'Prefer adjacent bishops.',
      compare: (first, second) => first.ruleR20Penalty - second.ruleR20Penalty,
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

export function scoreTwoBishopsWhiteMove(
  fen: string,
  san: string,
): TwoBishopsWhiteMoveScore {
  const startingBishops = getWhiteBishopSquares(fen)
  const startingBlackKing = findPiece(fen, 'b', 'k')?.square
  const chess = getChess(fen)
  chess.move(san)
  const resultFen = chess.fen()
  const mate = chess.isCheckmate()
  const blackReplies = chess.moves({ verbose: true })
  const bishops = getWhiteBishopSquares(resultFen)
  const blackKing = findPiece(resultFen, 'b', 'k')?.square
  const whiteKing = findPiece(resultFen, 'w', 'k')?.square
  const forcedReplySquares = blackReplies.some(
    (reply) => reply.captured === 'b',
  )
    ? undefined
    : blackReplies.map((reply) => reply.to)
  const walls = getAdjacentDiagonalWalls(bishops, blackKing, forcedReplySquares)
  const startsAtRuleR10Floor = hasRuleR10FourDiagonalWall(
    startingBishops,
    startingBlackKing,
  )
  const preservesRuleR10Floor = hasRuleR10FourDiagonalWall(
    bishops,
    blackKing,
    forcedReplySquares,
  )
  const diagonalCount = Math.min(...walls.map((wall) => wall.diagonalCount))
  const targetCorners = walls
    .filter((wall) => wall.diagonalCount === diagonalCount)
    .map((wall) => wall.targetCorner)
  const ruleR6Applies = ruleR6Templates(fen).some((template) =>
    bishopsOccupyPhaseTwoDiagonals(startingBishops, template),
  )
  const ruleR6 = scoreRuleR6(fen, resultFen)
  const ruleR5 = scoreRuleR5(resultFen)
  const ruleR4Matches = getRuleR4Matches(fen)
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
    ruleR4Penalty: scoreRuleR4(fen, resultFen),
    ruleR5BishopPenalty: ruleR5.bishopPenalty,
    ruleR5OrientationPenalty: ruleR5.orientationPenalty,
    ruleR5CagePenalty: ruleR5.cagePenalty,
    ruleR5KingDistance: ruleR5.kingDistance,
    ruleR6Applies,
    ruleR6DiagonalPenalty: ruleR6.diagonalPenalty,
    ruleR6SquarePenalty: ruleR6.squarePenalty,
    ruleR6KingAreaPenalty: ruleR6.kingAreaPenalty,
    ruleR6KingDistance: ruleR6.kingDistance,
    ruleR9Penalty: scoreRuleR9(fen, resultFen),
    ruleR10Penalty: startsAtRuleR10Floor
      ? preservesRuleR10Floor
        ? 0
        : 1
      : walls.length === 0
        ? 1
        : 0,
    ruleR10DiagonalCount: startsAtRuleR10Floor
      ? preservesRuleR10Floor
        ? 4
        : 99
      : walls.length === 0
        ? 99
        : diagonalCount,
    ruleR12EdgePenalty: bishops.filter(
      (bishop) =>
        targetCorners.length > 0 &&
        targetCorners.every(
          (corner) =>
            isOnTargetCornerEdge(bishop, corner) &&
            !isOnPhaseTwoOuterDiagonal(bishop, corner),
        ),
    ).length,
    ruleR17KingDistance: scoreRuleR17(resultFen),
    ruleR19Penalty: scoreRuleR19(resultFen),
    ruleR25KingDistance:
      whiteKing === undefined || blackKing === undefined
        ? 99
        : squaredEuclideanDistance(whiteKing, blackKing),
    ruleR20Penalty:
      bishops.length === 2 && kingDistance(bishops[0]!, bishops[1]!) !== 1
        ? 1
        : 0,
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
  return moves.map((san) => ({
    san,
    score: scoreTwoBishopsWhiteMove(fen, san),
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
