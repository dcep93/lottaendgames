import type { Square } from 'chess.js'
import {
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  isKnightMove,
  kingDistance,
  squareCoordinates,
  squareFromCoordinates,
} from '../chess'
import { compareScoresByRules, selectIdealMoves } from './selection'
import {
  centerDistance,
  distanceToNearestUnprotectedWhiteBishop,
  getTwoBishopsPhaseLabel,
  getWhiteBishopSquares,
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
  readonly matePenalty: number
  readonly bishopSafetyPenalty: number
  readonly stalematePenalty: number
  readonly conclaveStepPenalty: number
  readonly kingCloserPenalty: number
  readonly finishWallPenalty: number
  readonly startWallPenalty: number
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

const twoBishopsHelp: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: WHITE_INTRO,
  blackIntro: BLACK_INTRO,
  blackPriorities: [
    "Take a piece if White isn't looking.",
    'Move toward the center.',
    'Move toward an unprotected bishop.',
  ],
  notes: [
    "Phase 2 begins when Black cannot leave its current edge, or when White's king can seal that edge on this move.",
  ],
  noteBoards: [
    {
      id: 'bishop-conclave-step',
      title: 'conclave step',
      caption: 'When the pieces have this arrangement, play the arrowed bishop move.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.conclaveStep.fen),
      highlights: [],
      arrows: [TWO_BISHOPS_DIAGRAM_POSITIONS.conclaveStep.arrow],
    },
    {
      id: 'bishop-corner-finish',
      title: 'corner finish',
      caption: 'Keep Black on the edge while White’s king reaches the finish.',
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: noteBoardPieces(TWO_BISHOPS_DIAGRAM_POSITIONS.cornerFinish.fen),
      highlights: [],
    },
  ],
}

function noteBoardPieces(fen: string): readonly RuleNoteBoardPiece[] {
  return getEndgamePiecePlacements(fen).map(({ color, square, type }) => ({
    square,
    piece: (color === 'w' ? type.toUpperCase() : type) as RuleNoteBoardPiece['piece'],
  }))
}

export function scoreTwoBishopsWhiteMove(
  fen: string,
  san: string,
): TwoBishopsWhiteMoveScore {
  const blackKing = findPiece(fen, 'b', 'k')
  const startingWhiteKing = findPiece(fen, 'w', 'k')
  const startingBishops = getWhiteBishopSquares(fen)
  const conclaveSteps = getConclaveSteps(fen)
  const wallIsTwoSquaresAway =
    blackKing &&
    startingBishops.length === 2 &&
    kingDistance(startingBishops[0], startingBishops[1]) === 1 &&
    startingBishops.some(
      (bishop) => kingDistance(bishop, blackKing.square) === 2,
    )
  const startingMoatDistance =
    blackKing && startingWhiteKing
      ? getWallOppositionMoatDistance(
          startingWhiteKing.square,
          startingBishops,
          blackKing.square,
        )
      : null
  const chess = getChess(fen)
  const move = chess.move(san)
  const resultWhiteKingSquare =
    move.piece === 'k' ? move.to : startingWhiteKing?.square
  const mate = chess.isCheckmate()
  const bishopCanBeCaptured = chess
    .moves({ verbose: true })
    .some((reply) => reply.captured === 'b')
  return {
    matePenalty: mate ? 0 : 1,
    bishopSafetyPenalty: bishopCanBeCaptured ? 1 : 0,
    stalematePenalty: !mate && chess.isStalemate() ? 1 : 0,
    conclaveStepPenalty:
      move.piece === 'b' &&
      conclaveSteps.some(
        (step) => step.from === move.from && step.to === move.to,
      )
        ? 0
        : 1,
    kingCloserPenalty:
      wallIsTwoSquaresAway &&
      blackKing &&
      startingWhiteKing &&
      resultWhiteKingSquare &&
      move.piece === 'k' &&
      (kingDistance(resultWhiteKingSquare, blackKing.square) <
        kingDistance(startingWhiteKing.square, blackKing.square) ||
        (startingMoatDistance !== null &&
          getWallOppositionMoatDistance(
            resultWhiteKingSquare,
            startingBishops,
            blackKing.square,
          )! < startingMoatDistance))
        ? 0
        : 1,
    finishWallPenalty:
      blackKing &&
      move.piece === 'b' &&
      startingBishops.some(
        (anchor) =>
          anchor !== move.from &&
          isKnightMove(anchor, blackKing.square) &&
          kingDistance(move.to, anchor) === 1 &&
          isInOpposition(move.to, blackKing.square, 1),
      )
        ? 0
        : 1,
    startWallPenalty:
      blackKing &&
      move.piece === 'b' &&
      isInOpposition(move.to, blackKing.square, 2)
        ? 0
        : 1,
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

function getWallOppositionMoatDistance(
  whiteKing: Square,
  bishops: readonly Square[],
  blackKing: Square,
): number | null {
  const whiteKingCoordinates = squareCoordinates(whiteKing)
  const blackKingCoordinates = squareCoordinates(blackKing)
  const distances: number[] = []
  for (const bishop of bishops) {
    const bishopCoordinates = squareCoordinates(bishop)
    if (
      bishopCoordinates.file === blackKingCoordinates.file &&
      Math.abs(bishopCoordinates.rank - blackKingCoordinates.rank) === 2
    ) {
      const moatRank =
        (bishopCoordinates.rank + blackKingCoordinates.rank) / 2
      distances.push(Math.abs(whiteKingCoordinates.rank - moatRank))
    }
    if (
      bishopCoordinates.rank === blackKingCoordinates.rank &&
      Math.abs(bishopCoordinates.file - blackKingCoordinates.file) === 2
    ) {
      const moatFile =
        (bishopCoordinates.file + blackKingCoordinates.file) / 2
      distances.push(Math.abs(whiteKingCoordinates.file - moatFile))
    }
  }
  return distances.length > 0 ? Math.min(...distances) : null
}

type ConclaveStep = {
  readonly from: Square
  readonly to: Square
}

const CONCLAVE_TRANSFORMS = [
  (file: number, rank: number) => ({ file, rank }),
  (file: number, rank: number) => ({ file: -file, rank }),
  (file: number, rank: number) => ({ file, rank: -rank }),
  (file: number, rank: number) => ({ file: -file, rank: -rank }),
  (file: number, rank: number) => ({ file: rank, rank: file }),
  (file: number, rank: number) => ({ file: -rank, rank: file }),
  (file: number, rank: number) => ({ file: rank, rank: -file }),
  (file: number, rank: number) => ({ file: -rank, rank: -file }),
] as const

function getConclaveSteps(fen: string): readonly ConclaveStep[] {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  const bishops = getWhiteBishopSquares(fen)
  if (!whiteKing || !blackKing || bishops.length !== 2) return []
  const origin = squareCoordinates(whiteKing.square)
  const bishopSet = new Set(bishops)
  const steps: ConclaveStep[] = []
  const relativeSquare = (
    transform: (file: number, rank: number) => {
      readonly file: number
      readonly rank: number
    },
    file: number,
    rank: number,
  ): Square | null => {
    const transformed = transform(file, rank)
    return squareFromCoordinates(
      origin.file + transformed.file,
      origin.rank + transformed.rank,
    )
  }

  for (const transform of CONCLAVE_TRANSFORMS) {
    const expectedBlackKing = relativeSquare(transform, 2, -1)
    const stationaryBishop = relativeSquare(transform, 1, 2)
    const movingBishop = relativeSquare(transform, 2, 2)
    const target = relativeSquare(transform, 1, 1)
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
    id: 'conclave step',
    shortLabel: 'conclave step',
    helpText:
      'When the pieces are in the position shown, make the conclave step.',
    compare: (first, second) =>
      first.conclaveStepPenalty - second.conclaveStepPenalty,
  },
  {
    id: 'king closer',
    shortLabel: 'king closer',
    helpText:
      "When the bishop wall is two squares from Black's king, bring White's king closer to Black's king, or the wall opposition moat rank/file.",
    compare: (first, second) =>
      first.kingCloserPenalty - second.kingCloserPenalty,
  },
  {
    id: 'finish wall',
    shortLabel: 'finish wall',
    helpText:
      "When one bishop is a knight's move from Black's king, place the other bishop beside it in one-square opposition to Black's king.",
    compare: (first, second) =>
      first.finishWallPenalty - second.finishWallPenalty,
  },
  {
    id: 'start wall',
    shortLabel: 'start wall',
    helpText: "Place a bishop in two-square opposition to Black's king.",
    compare: (first, second) =>
      first.startWallPenalty - second.startWallPenalty,
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
  return moves.map((san) => ({
    san,
    score: scoreTwoBishopsWhiteMove(fen, san),
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

function getBlackCandidates(fen: string): OpponentCandidates {
  const moves = getChess(fen).moves()
  return {
    moves,
    idealMoves: getIdealTwoBishopsBlackMoves(fen, moves),
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

export {
  getTwoBishopsPhaseLabel,
  isTwoBishopsPhaseTwoPosition,
} from './twoBishopsGeometry'
