import type { PieceSymbol, Square } from 'chess.js'
import {
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  manhattanDistance,
  squareColor,
} from '../chess'
import { getEndgameReturnToPositionMoves } from './majorPieces'
import { centerDistance } from './bishopKnightGeometry'
import {
  getImmediateMateMoves,
  getKnightAndBishopKeySquarePatternScore,
} from './bishopKnightKeySquare'
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
  knightAndBishopWhiteMoveReachesLookupPath,
} from './bishopKnightLookup'
import {
  knightAndBishopBishopFrontPreparationScore,
  knightAndBishopBishopInFrontScore,
  knightAndBishopBishopOppositionLoopScore,
  knightAndBishopKingApproachesMiddle16,
  knightAndBishopKingCloserOppositeBishopScore,
  knightAndBishopKingDistanceRegressionScore,
  knightAndBishopKnightBehindWhiteKingScore,
  knightAndBishopKnightBlackKingDistance,
  knightAndBishopKnightCentralDistance,
  knightAndBishopKnightWhiteKingDistance,
} from './bishopKnightStrategy'
import {
  getKnightAndBishopEstablishedZoneXKnightRouteScore,
  getKnightAndBishopZoneXEntryScore,
  getKnightAndBishopZoneXPrepareScore,
} from './bishopKnightZoneX'
import { compareScoresByRules, selectIdealMoves } from './selection'
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
  WhiteMoveOverride,
} from './types'

export type KnightAndBishopWhiteMoveScore = {
  readonly mateScore: number
  readonly stalemateScore: number
  readonly pieceSafetyScore: number
  readonly phaseTwoEntryScore: number
  readonly keySquarePatternScore: number
  readonly zoneXEstablishedKnightRouteScore: number
  readonly zoneXEntryScore: number
  readonly zoneXPrepareScore: number
  readonly zoneXPreparePieceProximity: number
  readonly zoneXDriftScore: number
  readonly kingCloserOppositeBishopScore: number
  readonly kingDistanceRegressionScore: number
  readonly bishopOppositionLoopScore: number
  readonly knightBehindWhiteKingScore: number
  readonly bishopInFrontScore: number
  readonly bishopFrontPreparationScore: number
  readonly bishopBlackKingDistance: number
  readonly movedPiece: PieceSymbol | undefined
  readonly knightWhiteKingDistance: number
  readonly knightCentralDistance: number
  readonly knightBlackKingDistance: number
}

export type KnightAndBishopBlackMoveScore = {
  readonly captureMinorPenalty: number
  readonly unprotectedMinorDistance: number
  readonly centerDistance: number
  readonly mobilityScore: number
  readonly whiteKingDistanceScore: number
  readonly matingCornerManhattanScore: number
}

const CORNERS: readonly Square[] = ['a1', 'a8', 'h1', 'h8']

function blackCanTakeKnightOrBishop(fen: string): boolean {
  if (!knightAndBishopPiecesPresent(fen)) return true
  return getChess(fen)
    .moves()
    .some((san) => {
      const next = getChess(fen)
      next.move(san)
      return !knightAndBishopPiecesPresent(next.fen())
    })
}

function cornersForBishop(fen: string): readonly Square[] {
  const bishop = findPiece(fen, 'w', 'b')
  return bishop
    ? CORNERS.filter((corner) => squareColor(corner) === squareColor(bishop.square))
    : []
}

function manhattanDistanceToNearestBishopCorner(fen: string): number {
  const blackKing = findPiece(fen, 'b', 'k')
  const corners = cornersForBishop(fen)
  return blackKing && corners.length > 0
    ? Math.min(
        ...corners.map((corner) =>
          manhattanDistance(blackKing.square, corner),
        ),
      )
    : 99
}

function getWhiteKnightAndBishopSquares(fen: string): Square[] {
  return getEndgamePiecePlacements(fen)
    .filter(
      (piece) =>
        piece.color === 'w' && (piece.type === 'b' || piece.type === 'n'),
    )
    .map(({ square }) => square)
}

function distanceToNearestUnprotectedKnightOrBishop(fen: string): number {
  const chess = getChess(fen)
  const blackKing = findPiece(fen, 'b', 'k')
  if (!blackKing) return 99
  const unprotected = getWhiteKnightAndBishopSquares(fen).filter(
    (square) => !chess.isAttacked(square, 'w'),
  )
  return unprotected.length > 0
    ? Math.min(
        ...unprotected.map((square) =>
          manhattanDistance(blackKing.square, square),
        ),
      )
    : 99
}

function scoreKnightAndBishopWhiteMoveCore(
  fen: string,
  san: string,
): KnightAndBishopWhiteMoveScore {
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultFen = chess.fen()
  const blackKing = findPiece(resultFen, 'b', 'k')
  const bishop = findPiece(resultFen, 'w', 'b')
  return {
    mateScore: chess.isCheckmate() ? 0 : 1,
    stalemateScore: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    pieceSafetyScore: blackCanTakeKnightOrBishop(resultFen) ? 1 : 0,
    phaseTwoEntryScore: knightAndBishopWhiteMoveReachesLookupPath(fen, san)
      ? 0
      : 1,
    keySquarePatternScore: knightAndBishopKingApproachesMiddle16(
      fen,
      resultFen,
      move?.piece,
    )
      ? 0
      : getKnightAndBishopKeySquarePatternScore(resultFen),
    zoneXEstablishedKnightRouteScore:
      getKnightAndBishopEstablishedZoneXKnightRouteScore(
        fen,
        resultFen,
        move,
      ),
    zoneXEntryScore: getKnightAndBishopZoneXEntryScore(fen, san),
    ...getKnightAndBishopZoneXPrepareScore(fen, san, resultFen, move),
    kingCloserOppositeBishopScore:
      knightAndBishopKingCloserOppositeBishopScore(
        fen,
        resultFen,
        move?.piece,
      ),
    kingDistanceRegressionScore: knightAndBishopKingDistanceRegressionScore(
      fen,
      resultFen,
      move?.piece,
    ),
    bishopOppositionLoopScore: knightAndBishopBishopOppositionLoopScore(
      fen,
      move?.piece,
    ),
    knightBehindWhiteKingScore:
      knightAndBishopKnightBehindWhiteKingScore(resultFen),
    bishopInFrontScore: knightAndBishopBishopInFrontScore(
      fen,
      resultFen,
      move?.piece,
    ),
    bishopFrontPreparationScore:
      knightAndBishopBishopFrontPreparationScore(
        fen,
        resultFen,
        move?.piece,
      ),
    bishopBlackKingDistance:
      bishop && blackKing
        ? manhattanDistance(bishop.square, blackKing.square)
        : 99,
    movedPiece: move?.piece,
    knightWhiteKingDistance:
      knightAndBishopKnightWhiteKingDistance(resultFen),
    knightCentralDistance: knightAndBishopKnightCentralDistance(resultFen),
    knightBlackKingDistance:
      knightAndBishopKnightBlackKingDistance(resultFen),
  }
}

export function scoreKnightAndBishopWhiteMove(
  fen: string,
  san: string,
): KnightAndBishopWhiteMoveScore {
  return scoreKnightAndBishopWhiteMoveCore(fen, san)
}

const ENTER_MATING_NET_HELP =
  '[mate] Follow the known knight-and-bishop mating net when it is available.'
const PREPARE_ZONE_X_HELP =
  "Prepare the knight's route into an established Zone X cage. Establish the bishop and knight geometry that prepares Zone X, preferring the setup with the closest pieces. Once the bishop and Zone X setup are established, move White's king toward Black's king; otherwise move the knight by the shortest path to its stable Zone X square."
const BRING_KING_CLOSER_HELP =
  "Keep White's king in the middle 16 squares while bringing it closer to Black's king and staying on the color opposite the bishop; when outside the middle 16, walk toward it first. The color rule can also yield when the two kings are two diagonal squares apart and the adjacent bishop is a knight move from Black's king. Do not increase the distance between the kings."
const KNIGHT_CLOSER_CENTER_HELP =
  "Avoid the bishop-opposition loop and keep the knight behind White's king relative to Black's king, then closer to White's king, then closer to the center, preferring squares farther from Black's king."

const bishopKnightWhiteMoveOverride: WhiteMoveOverride = {
  description: {
    id: 'enter mating net',
    shortLabel: 'enter mating net',
    helpText: ENTER_MATING_NET_HELP,
  },
  guideOrder: 3,
  select: (fen, legalMoves) => {
    if (getImmediateMateMoves(fen, [...legalMoves]).length > 0) {
      return { active: false }
    }
    const lookupMoves = getKnightAndBishopLookupWhiteMoves(fen)
    return lookupMoves.length > 0
      ? { active: true, moves: lookupMoves }
      : { active: false }
  },
}

export const knightAndBishopWhiteRules: readonly OrderedRule<KnightAndBishopWhiteMoveScore>[] = [
  {
    id: 'mate',
    shortLabel: 'mate',
    guideOrder: 0,
    helpText: 'Checkmate immediately when mate is available.',
    stopWhenBest: (score) => score.mateScore === 0,
    compare: (first, second) => first.mateScore - second.mateScore,
  },
  {
    id: 'no stalemate',
    shortLabel: 'no stalemate',
    guideOrder: 1,
    helpText: 'Avoid stalemate.',
    compare: (first, second) => first.stalemateScore - second.stalemateScore,
  },
  {
    id: 'minors safe',
    shortLabel: 'minors safe',
    guideOrder: 2,
    helpText: 'Keep pieces safe from capture.',
    compare: (first, second) => first.pieceSafetyScore - second.pieceSafetyScore,
  },
  {
    id: 'enter mating net',
    shortLabel: 'enter mating net',
    guideOrder: 3,
    helpText: ENTER_MATING_NET_HELP,
    compare: (first, second) =>
      first.phaseTwoEntryScore - second.phaseTwoEntryScore,
  },
  {
    id: 'key square pattern',
    shortLabel: 'key square pattern',
    guideOrder: 4,
    helpText:
      "[prepare] Reach the knight's key-square pattern when available.",
    compare: (first, second) =>
      first.keySquarePatternScore - second.keySquarePatternScore,
  },
  {
    id: 'prepare zone x',
    shortLabel: 'prepare zone x',
    guideOrder: 5,
    helpText: PREPARE_ZONE_X_HELP,
    compare: (first, second) =>
      first.zoneXEstablishedKnightRouteScore -
      second.zoneXEstablishedKnightRouteScore,
  },
  {
    id: 'force zone x',
    shortLabel: 'force zone x',
    guideOrder: 6,
    helpText: '[prepare] Force Black into Zone X when it is available.',
    compare: (first, second) =>
      first.zoneXEntryScore - second.zoneXEntryScore,
  },
  {
    id: 'prepare zone x',
    shortLabel: 'prepare zone x',
    helpText: PREPARE_ZONE_X_HELP,
    compare: (first, second) =>
      first.zoneXPrepareScore - second.zoneXPrepareScore ||
      first.zoneXPreparePieceProximity - second.zoneXPreparePieceProximity,
    stopWhenBest: (score) => score.zoneXDriftScore === 0,
  },
  {
    id: 'bring king closer',
    shortLabel: 'bring king closer',
    guideOrder: 7,
    helpText: BRING_KING_CLOSER_HELP,
    compare: (first, second) =>
      first.kingCloserOppositeBishopScore -
      second.kingCloserOppositeBishopScore,
  },
  {
    id: 'bring king closer',
    shortLabel: 'bring king closer',
    helpText: BRING_KING_CLOSER_HELP,
    compare: (first, second) =>
      first.kingDistanceRegressionScore -
      second.kingDistanceRegressionScore,
  },
  {
    id: 'knight closer center',
    shortLabel: 'knight closer center',
    guideOrder: 9,
    helpText: KNIGHT_CLOSER_CENTER_HELP,
    compare: (first, second) =>
      first.bishopOppositionLoopScore - second.bishopOppositionLoopScore ||
      first.knightBehindWhiteKingScore - second.knightBehindWhiteKingScore,
  },
  {
    id: 'bishop front',
    shortLabel: 'bishop front',
    guideOrder: 8,
    helpText: "Establish, maintain, or prepare the bishop on the square in front of White's king, between the kings.",
    compare: (first, second) =>
      first.bishopInFrontScore - second.bishopInFrontScore ||
      first.bishopFrontPreparationScore -
        second.bishopFrontPreparationScore ||
      first.bishopBlackKingDistance - second.bishopBlackKingDistance,
  },
  {
    id: 'knight closer center',
    shortLabel: 'knight closer center',
    guideOrder: 9,
    helpText: KNIGHT_CLOSER_CENTER_HELP,
    subpriorities: [
      {
        when: (scores) =>
          scores.every(({ movedPiece }) => movedPiece === 'n'),
        compare: (first, second) =>
          first.knightWhiteKingDistance - second.knightWhiteKingDistance,
      },
      {
        compare: (first, second) =>
          first.knightCentralDistance - second.knightCentralDistance ||
          second.knightBlackKingDistance - first.knightBlackKingDistance,
      },
    ],
  },
]

export function compareKnightAndBishopWhiteScores(
  first: KnightAndBishopWhiteMoveScore,
  second: KnightAndBishopWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, knightAndBishopWhiteRules)
}

function scoreWhiteCandidates(
  fen: string,
  moves: readonly string[],
): readonly ScoredMove<KnightAndBishopWhiteMoveScore>[] {
  return moves.map((san) => ({
    san,
    score: scoreKnightAndBishopWhiteMoveCore(fen, san),
  }))
}

export function getIdealKnightAndBishopWhiteMoves(fen: string): string[] {
  const chess = getChess(fen)
  const moves = chess.turn() === 'w' ? chess.moves() : []
  const mateMoves = getImmediateMateMoves(fen, moves)
  if (mateMoves.length > 0) return mateMoves
  const lookupMoves = getKnightAndBishopLookupWhiteMoves(fen)
  if (lookupMoves.length > 0) return lookupMoves
  return [...selectIdealMoves(
    scoreWhiteCandidates(fen, moves),
    knightAndBishopWhiteRules,
  )]
}

export function scoreKnightAndBishopOpponentPosition(
  fen: string,
): KnightAndBishopBlackMoveScore {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  return {
    captureMinorPenalty: knightAndBishopPiecesPresent(fen) ? 1 : 0,
    unprotectedMinorDistance:
      distanceToNearestUnprotectedKnightOrBishop(fen),
    centerDistance: blackKing ? centerDistance(blackKing.square) : 99,
    mobilityScore: -getChess(fen).moves().length,
    whiteKingDistanceScore:
      whiteKing && blackKing
        ? -manhattanDistance(whiteKing.square, blackKing.square)
        : 0,
    matingCornerManhattanScore:
      -manhattanDistanceToNearestBishopCorner(fen),
  }
}

export function compareKnightAndBishopBlackScores(
  first: KnightAndBishopBlackMoveScore,
  second: KnightAndBishopBlackMoveScore,
): number {
  return (
    first.captureMinorPenalty - second.captureMinorPenalty ||
    first.unprotectedMinorDistance - second.unprotectedMinorDistance ||
    first.centerDistance - second.centerDistance ||
    first.mobilityScore - second.mobilityScore ||
    first.whiteKingDistanceScore - second.whiteKingDistanceScore ||
    first.matingCornerManhattanScore - second.matingCornerManhattanScore
  )
}

export function knightAndBishopBlackHasLookupReply(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): boolean {
  return moves.some((san) => {
    const chess = getChess(fen)
    chess.move(san)
    return getKnightAndBishopLookupWhiteMoves(chess.fen()).length > 0
  })
}

function selectIdealBlackMoves(
  fen: string,
  moves: readonly string[],
): string[] {
  const scored = moves.map((san) => {
    const next = getChess(fen)
    next.move(san)
    return { san, score: scoreKnightAndBishopOpponentPosition(next.fen()) }
  })
  const first = scored[0]
  if (!first) return []
  let best = first
  for (const candidate of scored.slice(1)) {
    if (compareKnightAndBishopBlackScores(candidate.score, best.score) < 0) {
      best = candidate
    }
  }
  return scored
    .filter(
      ({ score }) => compareKnightAndBishopBlackScores(score, best.score) === 0,
    )
    .map(({ san }) => san)
}

export function getKnightAndBishopOpponentCandidates(
  fen: string,
  previousTurnFen?: string,
): OpponentCandidates {
  const moves = getChess(fen).moves()
  if (moves.length === 0) return { moves, idealMoves: [] }
  const returnMoves = getEndgameReturnToPositionMoves(
    fen,
    previousTurnFen,
    moves,
  )
  if (returnMoves.length > 0) return { moves, idealMoves: returnMoves }
  if (
    isKnightAndBishopWManeuverPosition(fen) ||
    knightAndBishopBlackHasLookupReply(fen, moves)
  ) {
    return { moves, idealMoves: moves }
  }
  return { moves, idealMoves: selectIdealBlackMoves(fen, moves) }
}

const bishopKnightHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro:
    'White first uses immediate mates and known mating-net moves when they apply. Otherwise, best moves are the moves that survive these priorities in order; tied moves all remain best moves.',
  blackIntro:
    'Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.',
  blackPriorities: [
    'Return to the previous full position when a legal reply can recreate it.',
    "Take a piece if White isn't looking.",
    'Move toward unprotected minor pieces.',
    'Run toward the center when possible.',
    'Keep as many legal replies as possible.',
    "Stay away from White's king.",
    "Resist being driven toward the bishop's mating corner.",
  ],
  notes: [
    "Zone X is the blue pair defined by the stable knight/bishop/edge geometry. It exists only when the minor pieces are in yellow position and White's king can block the red escape square.",
    'During the exact W-maneuver setup, or when at least one reply stays in the known mating net, every legal Black reply remains available.',
  ],
  noteBoards: [
    {
      id: 'zone-x',
      title: 'Zone X',
      caption: '',
      layout: { files: 14, ranks: 8, fileOffset: 3 },
      pieces: [
        { square: 'f8', piece: 'k' },
        { square: 'e5', piece: 'K' },
        { square: 'e6', piece: 'B' },
        { square: 'c6', piece: 'N' },
      ],
      highlights: [
        { square: 'e8', kind: 'zone' },
        { square: 'f8', kind: 'zone' },
        { square: 'c6', kind: 'key' },
        { square: 'e6', kind: 'key' },
        { square: 'g7', kind: 'escape' },
      ],
      arrows: [{ from: 'e5', to: 'f6' }],
    },
    {
      id: 'key-square',
      title: 'Key Square',
      caption:
        'Move the knight to the key square between the kings, while the black king is on the edge. The bishop cuts off the red escape squares.',
      layout: { files: 14, ranks: 8, fileOffset: 3 },
      pieces: [
        { square: 'd8', piece: 'k' },
        { square: 'd6', piece: 'K' },
        { square: 'd5', piece: 'B' },
        { square: 'd7', piece: 'N' },
      ],
      highlights: [
        { square: 'c8', kind: 'zone' },
        { square: 'd8', kind: 'zone' },
        { square: 'e8', kind: 'zone' },
        { square: 'd7', kind: 'key' },
        { square: 'b7', kind: 'red' },
        { square: 'f7', kind: 'red' },
      ],
    },
  ],
}

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

export const bishopKnightRuleSet: MateRuleSet<KnightAndBishopWhiteMoveScore> = {
  id: 'bishop-knight',
  phase: getKnightAndBishopPhaseLabel,
  scoreWhite: scoreKnightAndBishopWhiteMove,
  scoreWhiteCandidates,
  whiteMoveOverride: bishopKnightWhiteMoveOverride,
  whiteRules: knightAndBishopWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: getKnightAndBishopOpponentCandidates,
  help: bishopKnightHelp,
}

export {
  getKnightAndBishopEstablishedZoneXKnightRouteTarget,
  getKnightAndBishopZone5,
  getKnightAndBishopZoneXKnightDriftTarget,
  getKnightAndBishopZoneXSetup,
  knightAndBishopWhiteMoveForcesZone5,
} from './bishopKnightZoneX'
export {
  getKnightAndBishopKeySquarePatternScore,
} from './bishopKnightKeySquare'
export {
  getKnightAndBishopLookupEntryResultFen,
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  isKnightAndBishopLookupPhasePosition,
  isKnightAndBishopMatingNetWhiteTurnPosition,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopWhiteMoveReachesLookupPath,
  wManeuverSetupDistance,
} from './bishopKnightLookup'
export type {
  KnightAndBishopZone5,
  KnightAndBishopZoneXSetup,
} from './bishopKnightGeometry'
