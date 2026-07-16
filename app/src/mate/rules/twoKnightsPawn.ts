import type { Move, Square } from 'chess.js'
import {
  allSquares,
  edgeDistance,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  kingDistance,
  manhattanDistance,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'
import {
  getTwoKnightsPawnConstructionEntry,
  isTwoKnightsPawnConstructionPosition,
} from '../twoKnightsPawnConstruction'
import { compareScoresByRules, selectIdealMoves } from './selection'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from './types'

export type TwoKnightsPawnTerminalOutcome =
  | 'checkmate'
  | 'stalemate'
  | 'lost-knight'
  | 'pawn-promoted'
  | 'fifty-move'
  | 'unsupported'

export type TwoKnightsPawnWhiteMoveScore = {
  readonly hasVerifiedConstruction: boolean
  readonly verifiedConstructionPenalty: number
  readonly matePenalty: number
  readonly stalematePenalty: number
  readonly knightSafetyPenalty: number
  readonly immediatePromotionCount: number
  readonly pawnPromotionDistance: number
  readonly blockadeUrgent: boolean
  readonly liveBlockadePenalty: number
  readonly blockadeRouteDistance: number
  readonly confinementReady: boolean
  readonly blackKingRegionSize: number
  readonly blackKingEdgeDistance: number
  readonly blackMobility: number
  readonly whiteKingDistance: number
}

export type TwoKnightsPawnBlackMoveScore = {
  readonly promotionPenalty: number
  readonly knightCapturePenalty: number
  readonly unprotectedKnightDistance: number
  readonly centerDistance: number
  readonly resistanceMobility: number
  readonly pawnAdvanceDistance: number
  readonly whiteCoordinationDistance: number
}

const WHITE_INTRO =
  "White's best moves are the moves that survive these priorities in order. If several moves remain tied after one priority, they all stay in consideration."

const BLACK_INTRO =
  'Black follows its displayed resistance priorities. It never chooses a route-only cooperative reply.'

const twoKnightsPawnHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    'Promote the pawn immediately when possible.',
    'Take a knight if White leaves one loose.',
    'Move toward an unprotected knight.',
    'Keep the king near the center and preserve actual legal king mobility.',
    'When the earlier resistance priorities tie, advance the pawn as far as legally possible.',
    "Stay away from White's king and coordinated knights.",
  ],
  notes: [
    'The bundled starts and every White edge in the committed construction were verified as unconditional wins before release. The optional Syzygy audit is an offline content check; the browser never queries a tablebase or network service.',
    "The blockade square is immediately in front of Black's pawn. Confinement begins only after a knight occupies that square and Black cannot capture it.",
    "For Black's downward-moving pawn, the file-specific Troitsky boundary is a4, b6, c5, d4, e4, f5, g6, h4. The blockade priority activates when the square immediately in front of the pawn reaches or crosses that boundary.",
    'The compact construction was found by a bounded deterministic offline search, is mirrored from move coordinates, and is replay-checked against every production-ideal Black reply.',
  ],
  noteBoards: [],
}

const KNIGHT_DELTAS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
] as const

const knightDistanceCache = new Map<string, number>()

function knightDistance(from: Square, to: Square): number {
  if (from === to) return 0
  const cacheKey = `${from}-${to}`
  const cached = knightDistanceCache.get(cacheKey)
  if (cached !== undefined) return cached
  const queue: Array<readonly [Square, number]> = [[from, 0]]
  const visited = new Set<Square>([from])
  while (queue.length > 0) {
    const [square, distance] = queue.shift()!
    const { file, rank } = squareCoordinates(square)
    for (const [fileDelta, rankDelta] of KNIGHT_DELTAS) {
      const next = squareFromCoordinates(file + fileDelta, rank + rankDelta)
      if (next === null || visited.has(next)) continue
      if (next === to) {
        const result = distance + 1
        knightDistanceCache.set(cacheKey, result)
        knightDistanceCache.set(`${to}-${from}`, result)
        return result
      }
      visited.add(next)
      queue.push([next, distance + 1])
    }
  }
  return 99
}

function whiteKnightSquares(fen: string): readonly Square[] {
  return getEndgamePiecePlacements(fen)
    .filter((piece) => piece.color === 'w' && piece.type === 'n')
    .map(({ square }) => square)
}

function blackPawnSquare(fen: string): Square | undefined {
  return findPiece(fen, 'b', 'p')?.square
}

function blockadeSquare(fen: string): Square | undefined {
  const pawn = blackPawnSquare(fen)
  if (!pawn) return undefined
  const { file, rank } = squareCoordinates(pawn)
  return squareFromCoordinates(file, rank - 1) ?? undefined
}

function blackCanCaptureSquare(fen: string, square: Square): boolean {
  const chess = getChess(fen)
  if (chess.turn() !== 'b') return false
  return (chess.moves({ verbose: true }) as Move[]).some(
    (move) => move.to === square && move.captured === 'n',
  )
}

function secureBlockadeScore(fen: string): {
  readonly penalty: number
  readonly routeDistance: number
} {
  const target = blockadeSquare(fen)
  const knights = whiteKnightSquares(fen)
  if (!target || knights.length !== 2) {
    return { penalty: 1, routeDistance: 99 }
  }
  const occupied = knights.includes(target)
  const secure = occupied && !blackCanCaptureSquare(fen, target)
  return {
    penalty: secure ? 0 : 1,
    routeDistance: occupied
      ? 0
      : Math.min(...knights.map((square) => knightDistance(square, target))),
  }
}

function whiteAttackedSquares(fen: string): ReadonlySet<Square> {
  const attacked = new Set<Square>()
  const whiteKing = findPiece(fen, 'w', 'k')
  if (whiteKing) {
    for (const square of allSquares()) {
      if (kingDistance(whiteKing.square, square) === 1) attacked.add(square)
    }
  }
  for (const knight of whiteKnightSquares(fen)) {
    const { file, rank } = squareCoordinates(knight)
    for (const [fileDelta, rankDelta] of KNIGHT_DELTAS) {
      const square = squareFromCoordinates(file + fileDelta, rank + rankDelta)
      if (square) attacked.add(square)
    }
  }
  return attacked
}

export function getTwoKnightsPawnBlackKingRegion(
  fen: string,
): ReadonlySet<Square> {
  const blackKing = findPiece(fen, 'b', 'k')
  if (!blackKing) return new Set()
  const attacked = whiteAttackedSquares(fen)
  const occupied = new Set(
    getEndgamePiecePlacements(fen)
      .filter((piece) => !(piece.color === 'b' && piece.type === 'k'))
      .map(({ square }) => square),
  )
  const queue: Square[] = [blackKing.square]
  const visited = new Set<Square>(queue)
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const square of allSquares()) {
      if (
        visited.has(square) ||
        occupied.has(square) ||
        attacked.has(square) ||
        kingDistance(current, square) !== 1
      ) {
        continue
      }
      visited.add(square)
      queue.push(square)
    }
  }
  return visited
}

function immediateBlackPromotions(fen: string): number {
  const chess = getChess(fen)
  if (chess.turn() !== 'b') return 0
  return (chess.moves({ verbose: true }) as Move[]).filter(
    ({ promotion }) => promotion !== undefined,
  ).length
}

function pawnPromotionDistance(fen: string): number {
  const pawn = blackPawnSquare(fen)
  return pawn ? Number(pawn[1]) - 1 : 0
}

const TROITSKY_PAWN_BOUNDARY_RANK = [4, 6, 5, 4, 4, 5, 6, 4] as const

function blockadeIsUrgent(fen: string): boolean {
  const pawn = blackPawnSquare(fen)
  if (!pawn) return true
  const { file, rank } = squareCoordinates(pawn)
  const pawnRank = rank + 1
  const blockadeRank = pawnRank - 1
  return blockadeRank <= TROITSKY_PAWN_BOUNDARY_RANK[file]
}

function scoreWhiteMoveUncached(
  fen: string,
  san: string,
): TwoKnightsPawnWhiteMoveScore {
  const construction = getTwoKnightsPawnConstructionEntry(fen)
  const chess = getChess(fen)
  chess.move(san)
  const resultFen = chess.fen()
  const blackKing = findPiece(resultFen, 'b', 'k')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const blockade = secureBlockadeScore(resultFen)
  return Object.freeze({
    hasVerifiedConstruction: construction !== undefined,
    verifiedConstructionPenalty:
      construction === undefined || construction.san === san ? 0 : 1,
    matePenalty:
      chess.isCheckmate() && chess.turn() === 'b' ? 0 : 1,
    stalematePenalty: chess.isStalemate() ? 1 : 0,
    knightSafetyPenalty: (chess.moves({ verbose: true }) as Move[]).some(
      ({ captured }) => captured === 'n',
    )
      ? 1
      : 0,
    immediatePromotionCount: immediateBlackPromotions(resultFen),
    pawnPromotionDistance: pawnPromotionDistance(resultFen),
    blockadeUrgent: blockadeIsUrgent(resultFen),
    liveBlockadePenalty: blockade.penalty,
    blockadeRouteDistance: blockade.routeDistance,
    confinementReady: blockade.penalty === 0,
    blackKingRegionSize: getTwoKnightsPawnBlackKingRegion(resultFen).size,
    blackKingEdgeDistance: blackKing ? edgeDistance(blackKing.square) : 0,
    blackMobility: chess.moves().length,
    whiteKingDistance:
      whiteKing && blackKing
        ? manhattanDistance(whiteKing.square, blackKing.square)
        : 99,
  })
}

const whiteScoreCache = new Map<
  string,
  ReadonlyMap<string, TwoKnightsPawnWhiteMoveScore>
>()
const WHITE_SCORE_CACHE_LIMIT = 512

export function scoreTwoKnightsPawnWhiteCandidates(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): readonly ScoredMove<TwoKnightsPawnWhiteMoveScore>[] {
  let scores = whiteScoreCache.get(fen)
  if (!scores) {
    const legalMoves = getChess(fen).moves()
    scores = new Map(
      legalMoves.map(
        (san) => [san, scoreWhiteMoveUncached(fen, san)] as const,
      ),
    )
    if (whiteScoreCache.size >= WHITE_SCORE_CACHE_LIMIT) {
      const oldest = whiteScoreCache.keys().next().value
      if (oldest !== undefined) whiteScoreCache.delete(oldest)
    }
    whiteScoreCache.set(fen, scores)
  }
  return Object.freeze(
    moves.map((san) => {
      const score = scores.get(san)
      if (!score) {
        throw new Error(`cannot score illegal or uncached KNN move: ${san}`)
      }
      return Object.freeze({ san, score })
    }),
  )
}

export function scoreTwoKnightsPawnWhiteMove(
  fen: string,
  san: string,
): TwoKnightsPawnWhiteMoveScore {
  const score = scoreTwoKnightsPawnWhiteCandidates(fen).find(
    (candidate) => candidate.san === san,
  )?.score
  if (!score) throw new Error(`illegal KNN move: ${san}`)
  return score
}

export const twoKnightsPawnWhiteRules: readonly OrderedRule<TwoKnightsPawnWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    helpText: 'Checkmate immediately when mate is available.',
    stopWhenBest: (score) => score.matePenalty === 0,
    compare: (first, second) => first.matePenalty - second.matePenalty,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    helpText: 'Avoid stalemate.',
    compare: (first, second) =>
      first.stalematePenalty - second.stalematePenalty,
  },
  {
    id: 'knights safe',
    shortLabel: 'knights safe',
    helpText: 'Keep both knights safe from immediate capture.',
    compare: (first, second) =>
      first.knightSafetyPenalty - second.knightSafetyPenalty,
  },
  {
    id: 'stop pawn promotion',
    shortLabel: 'stop pawn promotion',
    helpText:
      'Prevent an immediate promotion and keep as many pawn moves as possible between Black and promotion.',
    subpriorities: [
      {
        compare: (first, second) =>
          first.immediatePromotionCount - second.immediatePromotionCount,
      },
      {
        compare: (first, second) =>
          second.pawnPromotionDistance - first.pawnPromotionDistance,
      },
    ],
  },
  {
    id: 'blockade pawn',
    shortLabel: 'blockade pawn',
    helpText:
      "When the square immediately in front of Black's downward-moving pawn reaches or crosses its file-specific Troitsky boundary (a4, b6, c5, d4, e4, f5, g6, h4), occupy it with a knight Black cannot capture; until then, take the shortest knight route there.",
    applies: (score) => score.blockadeUrgent,
    subpriorities: [
      {
        compare: (first, second) =>
          first.liveBlockadePenalty - second.liveBlockadePenalty,
      },
      {
        compare: (first, second) =>
          first.blockadeRouteDistance - second.blockadeRouteDistance,
      },
    ],
  },
  {
    id: 'follow verified construction',
    shortLabel: 'follow verified construction',
    helpText:
      'On an exact audited route position, stay on the legal 27-ply Standard identity or file-mirror construction (or the one-ply Train finish) that preserves the unconditional win, establishes and maintains the pawn blockade, and completes the mating cage. This priority is inactive off the committed route, where the human geometric priorities apply instead.',
    applies: (score) => score.hasVerifiedConstruction,
    compare: (first, second) =>
      first.verifiedConstructionPenalty - second.verifiedConstructionPenalty,
  },
  {
    id: 'confine black king',
    shortLabel: 'confine Black king',
    helpText:
      "After the pawn is securely blockaded, follow the verified construction: coordinate White's king and free knight to shrink Black's reachable region and drive the king into the mating cage.",
    applies: (score) => score.confinementReady,
    subpriorities: [
      {
        compare: (first, second) =>
          first.blackKingRegionSize - second.blackKingRegionSize,
      },
      {
        compare: (first, second) =>
          first.blackKingEdgeDistance - second.blackKingEdgeDistance,
      },
    ],
  },
  {
    id: 'reduce black mobility',
    shortLabel: 'reduce Black mobility',
    helpText: 'Reduce the number of legal replies available to Black.',
    applies: (score) => score.confinementReady,
    compare: (first, second) =>
      first.blackMobility - second.blackMobility,
  },
  {
    id: 'bring white king closer',
    shortLabel: 'bring White king closer',
    helpText: "Bring White's king closer to Black's king.",
    compare: (first, second) =>
      first.whiteKingDistance - second.whiteKingDistance,
  },
]

export function compareTwoKnightsPawnWhiteScores(
  first: TwoKnightsPawnWhiteMoveScore,
  second: TwoKnightsPawnWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, twoKnightsPawnWhiteRules)
}

export function getIdealTwoKnightsPawnWhiteMoves(fen: string): string[] {
  const chess = getChess(fen)
  const moves = chess.turn() === 'w' ? chess.moves() : []
  return [
    ...selectIdealMoves(
      scoreTwoKnightsPawnWhiteCandidates(fen, moves),
      twoKnightsPawnWhiteRules,
    ),
  ]
}

function centerDistance(square: Square): number {
  const { file, rank } = squareCoordinates(square)
  const fileDistance = file < 3 ? 3 - file : file > 4 ? file - 4 : 0
  const rankDistance = rank < 3 ? 3 - rank : rank > 4 ? rank - 4 : 0
  return fileDistance + rankDistance
}

function whiteUnprotectedKnightSquares(fen: string): readonly Square[] {
  const knights = whiteKnightSquares(fen)
  const whiteKing = findPiece(fen, 'w', 'k')
  return knights.filter(
    (knight) =>
      !(
        (whiteKing && kingDistance(whiteKing.square, knight) === 1) ||
        knights.some(
          (other) =>
            other !== knight && knightDistance(other, knight) === 1,
        )
      ),
  )
}

function distanceToNearestUnprotectedKnight(
  fen: string,
  square: Square,
): number {
  const knights = whiteUnprotectedKnightSquares(fen)
  return knights.length === 0
    ? 99
    : Math.min(...knights.map((knight) => kingDistance(square, knight)))
}

function actualBlackKingMobility(fen: string): number {
  const fields = fen.split(' ')
  fields[1] = 'b'
  fields[3] = '-'
  try {
    return (getChess(fields.join(' ')).moves({ verbose: true }) as Move[])
      .filter(({ piece }) => piece === 'k').length
  } catch {
    return 0
  }
}

export function scoreTwoKnightsPawnBlackMove(
  fen: string,
  san: string,
): TwoKnightsPawnBlackMoveScore {
  const beforeKnightCount = whiteKnightSquares(fen).length
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const blackKing = findPiece(resultFen, 'b', 'k')
  const whiteKing = findPiece(resultFen, 'w', 'k')
  const afterKnightCount = whiteKnightSquares(resultFen).length
  const kingSquare = blackKing?.square
  return Object.freeze({
    promotionPenalty: move.promotion === undefined ? 1 : 0,
    knightCapturePenalty: afterKnightCount < beforeKnightCount ? 0 : 1,
    unprotectedKnightDistance: kingSquare
      ? distanceToNearestUnprotectedKnight(resultFen, kingSquare)
      : 99,
    centerDistance: kingSquare ? centerDistance(kingSquare) : 99,
    resistanceMobility: -actualBlackKingMobility(resultFen),
    pawnAdvanceDistance: move.piece === 'p' ? Number(move.to[1]) - 1 : 8,
    whiteCoordinationDistance:
      kingSquare && whiteKing
        ? -manhattanDistance(kingSquare, whiteKing.square) -
          Math.min(
            ...whiteKnightSquares(resultFen).map((knight) =>
              kingDistance(knight, kingSquare),
            ),
          )
        : 0,
  })
}

export function compareTwoKnightsPawnBlackScores(
  first: TwoKnightsPawnBlackMoveScore,
  second: TwoKnightsPawnBlackMoveScore,
): number {
  return (
    first.promotionPenalty - second.promotionPenalty ||
    first.knightCapturePenalty - second.knightCapturePenalty ||
    first.unprotectedKnightDistance - second.unprotectedKnightDistance ||
    first.centerDistance - second.centerDistance ||
    first.resistanceMobility - second.resistanceMobility ||
    first.pawnAdvanceDistance - second.pawnAdvanceDistance ||
    first.whiteCoordinationDistance - second.whiteCoordinationDistance
  )
}

export function getIdealTwoKnightsPawnBlackMoves(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): string[] {
  if (moves.length === 0) return []
  const scored = moves.map((san) => ({
    san,
    score: scoreTwoKnightsPawnBlackMove(fen, san),
  }))
  let best = scored[0]!
  for (const candidate of scored.slice(1)) {
    if (compareTwoKnightsPawnBlackScores(candidate.score, best.score) < 0) {
      best = candidate
    }
  }
  return scored
    .filter(
      ({ score }) =>
        compareTwoKnightsPawnBlackScores(score, best.score) === 0,
    )
    .map(({ san }) => san)
}

function getBlackCandidates(fen: string): OpponentCandidates {
  const chess = getChess(fen)
  const moves = chess.turn() === 'b' ? chess.moves() : []
  return {
    moves,
    idealMoves: getIdealTwoKnightsPawnBlackMoves(fen, moves),
  }
}

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

function phaseLabel(fen: string): string {
  if (whiteKnightSquares(fen).length !== 2) return '0/2'
  return secureBlockadeScore(fen).penalty === 0 ? '2/2' : '1/2'
}

export function getTwoKnightsPawnTerminalOutcome(
  fen: string,
): TwoKnightsPawnTerminalOutcome | null {
  const chess = getChess(fen)
  if (whiteKnightSquares(fen).length !== 2) return 'lost-knight'
  const blackNonKingPieces = getEndgamePiecePlacements(fen).filter(
    (piece) => piece.color === 'b' && piece.type !== 'k',
  )
  if (blackNonKingPieces.some(({ type }) => type !== 'p')) {
    return 'pawn-promoted'
  }
  if (!blackNonKingPieces.some(({ type }) => type === 'p')) {
    return 'unsupported'
  }
  if (chess.isCheckmate()) {
    return chess.turn() === 'b' ? 'checkmate' : 'unsupported'
  }
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDrawByFiftyMoves()) return 'fifty-move'
  if (!isTwoKnightsPawnConstructionPosition(fen)) return 'unsupported'
  return null
}

export const twoKnightsPawnRuleSet: MateRuleSet<TwoKnightsPawnWhiteMoveScore> = {
  id: 'two-knights-pawn',
  phase: phaseLabel,
  scoreWhite: scoreTwoKnightsPawnWhiteMove,
  scoreWhiteCandidates: scoreTwoKnightsPawnWhiteCandidates,
  whiteRules: twoKnightsPawnWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: getBlackCandidates,
  help: twoKnightsPawnHelp,
}
