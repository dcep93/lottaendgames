import { knightAndBishopShouldCheckThreeDiagonal, evaluateKnightAndBishopSupportedDiagonal } from "./bishopKnightDiagonalSupport";
import type { Square } from "chess.js";
import {
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  kingDistance,
  manhattanDistance,
  squareColor,
  squareCoordinates,
  squaredEuclideanDistance,
} from "../chess";
import {
  applyUniversalBlackPriorities,
  BLACK_CAPTURE_PRIORITY,
  BLACK_RETURN_PRIORITY,
} from "./blackPriorities";
import { bishopLongDiagonalIntersection, centerDistance } from "./bishopKnightGeometry";
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopPhaseAfterWhiteMove,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
} from "./bishopKnightLookup";
import { knightAndBishopCenterProximityScore, knightAndBishopKingCenterProximityScore, knightAndBishopKnightTargetProximityScore } from "./bishopKnightStrategy";
import { knightAndBishopDeclaredCornerFlushMove } from "./bishopKnightCornerFlush";
import { declaredSupportedSevenMove } from "./bishopKnightSupportedPreferences";
import { knightAndBishopDeclaredPreparationMove } from "./bishopKnightPreparation";
import { knightAndBishopShouldCoordinateKing, knightAndBishopKingCoordinatesMinors } from "./bishopKnightCoordination";
import { compareScoresByRules, selectIdealMoves } from "./selection";
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from "./types";

export type KnightAndBishopWhiteMoveScore = {
  readonly kingCoordinationPenalty: number;
  readonly attackedBishopEscapeScore: number;
  readonly nearbyPairBishopEscapeScore: number;
  readonly nearbyPairCentralDefensePenalty: number;
  readonly attackedKnightDefensePenalty: number;
  readonly bishopOppositionPenalty: number;
  readonly knightNextAttackPenalty: number;
  readonly knightCenterProximityScore: number;
  readonly declaredCornerFlushPenalty: number;
  readonly declaredPreparationPenalty: number;
  readonly supportedThreeCheckScore: number;
  readonly supportedDiagonalSizeScore: number;
  readonly supportedDiagonalKnightScore: number;
  readonly declaredSupportedSevenPenalty: number;
  readonly supportedSevenFlushColorPenalty: number;
  readonly supportedSevenFlushDistance: number;
  readonly supportedSevenBishopPenalty: number;
  readonly supportedSevenKingTargetDistance: number;
  readonly supportedSevenKingTieDistance: number;
  readonly mateScore: number;
  readonly stalemateScore: number;
  readonly pieceSafetyScore: number;
  readonly kingCenterProximityScore: number;
  readonly kingBishopColorPenalty: number;
  readonly bishopLongDiagonalPenalty: number;
  readonly bishopProtectedCenterPenalty: number;
  readonly knightTargetProximityScore: number;
  readonly knightProtectionPenalty: number;
  readonly nonCentralBishopDistanceScore: number;
  readonly knightBishopColorPenalty: number;
  readonly bishopLongDiagonalIntersectionScore: number;
};

export type KnightAndBishopBlackMoveScore = {
  readonly captureMinorPenalty: number;
  readonly unprotectedMinorDistance: number;
  readonly centerDistance: number;
  readonly mobilityScore: number;
  readonly whiteKingDistanceScore: number;
  readonly matingCornerManhattanScore: number;
};

const CORNERS: readonly Square[] = ["a1", "a8", "h1", "h8"];

function cornersForBishop(fen: string): readonly Square[] {
  const bishop = findPiece(fen, "w", "b");
  return bishop
    ? CORNERS.filter(
        (corner) => squareColor(corner) === squareColor(bishop.square),
      )
    : [];
}

function manhattanDistanceToNearestBishopCorner(fen: string): number {
  const blackKing = findPiece(fen, "b", "k");
  const corners = cornersForBishop(fen);
  return blackKing && corners.length > 0
    ? Math.min(
        ...corners.map((corner) => manhattanDistance(blackKing.square, corner)),
      )
    : 99;
}

function getWhiteKnightAndBishopSquares(fen: string): Square[] {
  return getEndgamePiecePlacements(fen)
    .filter(
      (piece) =>
        piece.color === "w" && (piece.type === "b" || piece.type === "n"),
    )
    .map(({ square }) => square);
}

function distanceToNearestUnprotectedKnightOrBishop(fen: string): number {
  const chess = getChess(fen);
  const blackKing = findPiece(fen, "b", "k");
  if (!blackKing) return 99;
  const unprotected = getWhiteKnightAndBishopSquares(fen).filter(
    (square) => !chess.isAttacked(square, "w"),
  );
  return unprotected.length > 0
    ? Math.min(
        ...unprotected.map((square) =>
          manhattanDistance(blackKing.square, square),
        ),
      )
    : 99;
}

type KnightAndBishopPositionScoreContext = {
  readonly bishopOppositionTarget: Square | undefined;
  readonly shouldCoordinateKing: boolean;
  readonly shouldEscapeBishop: boolean;
  readonly shouldEscapeNearbyPairBishop: boolean;
  readonly shouldDefendKnight: boolean;
  readonly declaredCornerFlushMove: string | undefined;
  readonly declaredPreparationMove: string | undefined;
  readonly declaredSupportedSevenMove: string | undefined;
  readonly shouldCheckThreeDiagonal: boolean;
};

function whiteScoringContext(fen: string): KnightAndBishopPositionScoreContext {
  let shouldCheckThreeDiagonal: boolean | undefined;
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const centralKing = !!whiteKing && centerDistance(whiteKing.square) === 0;
  const bishop = findPiece(fen, "w", "b");
  const knight = findPiece(fen, "w", "n");
  const bishopCentrallyDefended = !!bishop && centralKing && kingDistance(whiteKing.square, bishop.square) === 1;
  const knightCentrallyDefended = !!knight && centralKing && kingDistance(whiteKing.square, knight.square) === 1;
  let bishopOppositionTarget: Square | undefined;
  if (whiteKing && bishop && blackKing
    && squareColor(whiteKing.square) === squareColor(bishop.square)
    && manhattanDistance(bishop.square, blackKing.square) === 1) {
    const b = squareCoordinates(bishop.square), k = squareCoordinates(blackKing.square);
    const file = 2 * b.file - k.file, rank = 2 * b.rank - k.rank;
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8)
      bishopOppositionTarget = `${"abcdefgh"[file]}${rank + 1}` as Square;
  }
  return {
    bishopOppositionTarget,
    shouldEscapeNearbyPairBishop: !!bishop && !!knight && !!blackKing
      && kingDistance(bishop.square, knight.square) === 1
      && kingDistance(bishop.square, blackKing.square) <= 2
      && kingDistance(knight.square, blackKing.square) <= 2
      && !bishopCentrallyDefended && !knightCentrallyDefended,
    shouldEscapeBishop: !!bishop && !!blackKing && kingDistance(bishop.square, blackKing.square) === 1
      && !(whiteKing && kingDistance(bishop.square, whiteKing.square) === 1),
    shouldDefendKnight: !!knight && !!blackKing && kingDistance(knight.square, blackKing.square) === 1,
    shouldCoordinateKing: knightAndBishopShouldCoordinateKing(fen),
    declaredCornerFlushMove: knightAndBishopDeclaredCornerFlushMove(fen),
    declaredPreparationMove: knightAndBishopDeclaredPreparationMove(fen),
    declaredSupportedSevenMove: declaredSupportedSevenMove(fen),
    get shouldCheckThreeDiagonal() { return shouldCheckThreeDiagonal ??= knightAndBishopShouldCheckThreeDiagonal(fen); },
  };
}

function scoreKnightAndBishopWhiteMoveCore(
  fen: string,
  san: string,
  context: KnightAndBishopPositionScoreContext,
): KnightAndBishopWhiteMoveScore {
  const chess = getChess(fen);
  const move = chess.move(san);
  const resultFen = chess.fen();
  const blackReplies = chess.moves({ verbose: true });
  const givesCheck = chess.isCheck();
  const checkmate = givesCheck && blackReplies.length === 0;
  const whiteKing = findPiece(resultFen, "w", "k");
  const bishop = findPiece(resultFen, "w", "b");
  const protectedCentralBishop = !!bishop && !!whiteKing && centerDistance(bishop.square) === 0
    && kingDistance(bishop.square, whiteKing.square) === 1;
  let kingCenterProximity: number | undefined;
  let knightTargetProximity: number | undefined;
  const knight = findPiece(resultFen, "w", "n");
  const blackKing = findPiece(resultFen, "b", "k");
  const nearbyPairCentrallyDefended = !!whiteKing && centerDistance(whiteKing.square) === 0
    && ((!!bishop && kingDistance(bishop.square, whiteKing.square) === 1)
      || (!!knight && kingDistance(knight.square, whiteKing.square) === 1));
  const knightKingDefended = !!knight && !!whiteKing && kingDistance(knight.square, whiteKing.square) === 1;
  let supportedDiagonal: ReturnType<typeof evaluateKnightAndBishopSupportedDiagonal> | undefined;
  return {
    get kingCoordinationPenalty() {
      return context.shouldCoordinateKing
        && !(move.piece === "k" && knightAndBishopKingCoordinatesMinors(resultFen)) ? 1 : 0;
    },
    get attackedBishopEscapeScore() {
      return context.shouldEscapeBishop && bishop && blackKing
        ? -Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square)) : 0;
    },
    nearbyPairCentralDefensePenalty: context.shouldEscapeNearbyPairBishop && !nearbyPairCentrallyDefended ? 1 : 0,
    get nearbyPairBishopEscapeScore() {
      return context.shouldEscapeNearbyPairBishop && !nearbyPairCentrallyDefended && bishop && blackKing
        ? -Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square)) : 0;
    },
    attackedKnightDefensePenalty: context.shouldDefendKnight && !knightKingDefended ? 1 : 0,
    bishopOppositionPenalty: context.bishopOppositionTarget
      && !(move.piece === "k" && move.to === context.bishopOppositionTarget) ? 1 : 0,
    get knightCenterProximityScore() {
      return knight ? knightAndBishopCenterProximityScore(knight.square) : 0;
    },
    get knightNextAttackPenalty() {
      return knight
        && blackReplies.some(reply => reply.piece === "k" && kingDistance(reply.to, knight.square) <= 1) ? 1 : 0;
    },
    get supportedThreeCheckScore() {
      if (!context.shouldCheckThreeDiagonal) return 0;
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return givesCheck && support.size === 3 && support.knight <= 1 ? 0 : 1;
    },
    get supportedDiagonalSizeScore() { return (supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to))).size; },
    get supportedDiagonalKnightScore() { return (supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to))).knight; },
    get supportedSevenFlushColorPenalty() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 7 ? support.sevenFlushColorPenalty ?? 0 : 0;
    },
    get supportedSevenFlushDistance() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 7 ? support.sevenFlushDistance ?? 0 : 0;
    },
    get supportedSevenBishopPenalty() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 7 ? support.sevenBishopPenalty ?? 1 : 0;
    },
    get supportedSevenKingTargetDistance() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 7 && support.sevenBishopPenalty === 0 ? support.sevenKingTargetDistance ?? 0 : 0;
    },
    get supportedSevenKingTieDistance() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 7 ? support.sevenKingTieDistance ?? 0 : 0;
    },
    declaredSupportedSevenPenalty: context.declaredSupportedSevenMove && context.declaredSupportedSevenMove !== move.from + move.to ? 1 : 0,
    declaredCornerFlushPenalty: context.declaredCornerFlushMove && context.declaredCornerFlushMove !== move.from + move.to ? 1 : 0,
    declaredPreparationPenalty: context.declaredPreparationMove && context.declaredPreparationMove !== move.from + move.to ? 1 : 0,
    mateScore: checkmate ? 0 : 1,
    stalemateScore: !checkmate && blackReplies.length === 0 ? 1 : 0,
    pieceSafetyScore: !knightAndBishopPiecesPresent(resultFen) || blackReplies.some(({ captured }) => captured === "b" || captured === "n") ? 1 : 0,
    get bishopLongDiagonalPenalty() {
      if (!bishop) return 1;
      const { file, rank } = squareCoordinates(bishop.square);
      return file === rank || file + rank === 7 ? 0 : 1;
    },
    get bishopLongDiagonalIntersectionScore() {
      if (!bishop || !blackKing) return 0;
      const intersection = bishopLongDiagonalIntersection(bishop.square);
      return intersection === bishop.square ? 0
        : -Math.sqrt(squaredEuclideanDistance(intersection, blackKing.square));
    },
    bishopProtectedCenterPenalty: protectedCentralBishop ? 0 : 1,
    knightProtectionPenalty: knightKingDefended ? 0 : 1,
    knightBishopColorPenalty: knight && bishop && squareColor(knight.square) === squareColor(bishop.square) ? 1 : 0,
    get nonCentralBishopDistanceScore() {
      return bishop && blackKing && centerDistance(bishop.square) !== 0
        ? -Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square)) : 0;
    },
    get knightTargetProximityScore() {
      return knightTargetProximity ??= knightAndBishopKnightTargetProximityScore(resultFen);
    },
    kingBishopColorPenalty: whiteKing && bishop && squareColor(whiteKing.square) === squareColor(bishop.square) ? 1 : 0,
    get kingCenterProximityScore() {
      return kingCenterProximity ??= knightAndBishopKingCenterProximityScore(resultFen);
    },
  };
}

export function scoreKnightAndBishopWhiteMove(
  fen: string,
  san: string,
): KnightAndBishopWhiteMoveScore {
  return scoreKnightAndBishopWhiteMoveCore(fen, san, whiteScoringContext(fen));
}

export const knightAndBishopWhiteRules: readonly OrderedRule<KnightAndBishopWhiteMoveScore>[] =
  [
    {
      id: "mate",
      shortLabel: "mate",
      helpText: "",
      compare: (first, second) => first.mateScore - second.mateScore,
    },
    {
      id: "minors safe",
      shortLabel: "pieces safe",
      helpText: "",
      compare: (first, second) =>
        first.pieceSafetyScore - second.pieceSafetyScore,
    },
    {
      id: "no stalemate",
      shortLabel: "no stalemate",
      helpText: "",
      compare: (first, second) => first.stalemateScore - second.stalemateScore,
    },
    {
      id: "r1",
      shortLabel: "rule r1",
      helpText: "With a king supported 3 diagonal and the knight within 1 move of the support square, check.",
      compare: (first, second) => first.supportedThreeCheckScore - second.supportedThreeCheckScore,
    },
    {
      id: "r1.5",
      shortLabel: "rule r1.5",
      helpText: "Prefer a supported smaller odd diagonal, then knight move proximity to its support square.",
      subpriorities: [
        { compare: (first, second) => first.supportedDiagonalSizeScore - second.supportedDiagonalSizeScore },
        { compare: (first, second) => first.supportedDiagonalKnightScore - second.supportedDiagonalKnightScore },
      ],
    },
    {
      id: "r2.5",
      shortLabel: "rule r2.5",
      helpText: "With a supported 7 diagonal and Black on or adjacent to a3, prefer the king off the bishop’s color, then king step proximity to b2. Then prefer the bishop on b3, king step proximity to the square two files to the right of Black’s king, and king step proximity to e8. Include reflections.",
      applies: score => score.supportedDiagonalSizeScore === 7,
      subpriorities: [
        { compare: (first, second) => first.declaredSupportedSevenPenalty - second.declaredSupportedSevenPenalty },
        { compare: (first, second) => first.supportedSevenFlushColorPenalty - second.supportedSevenFlushColorPenalty },
        { compare: (first, second) => first.supportedSevenFlushDistance - second.supportedSevenFlushDistance },
        { compare: (first, second) => first.supportedSevenBishopPenalty - second.supportedSevenBishopPenalty },
        { compare: (first, second) => first.supportedSevenKingTargetDistance - second.supportedSevenKingTargetDistance },
        { compare: (first, second) => first.supportedSevenKingTieDistance - second.supportedSevenKingTieDistance },
      ],
    },
    {
      id: "r4",
      shortLabel: "rule r4",
      helpText: "Flush the king from the non target corner.",
      compare: (first, second) => first.declaredCornerFlushPenalty - second.declaredCornerFlushPenalty,
    },
    {
      id: "r5",
      shortLabel: "rule r5",
      helpText: "Prepare the 7 diagonal.",
      compare: (first, second) => first.declaredPreparationPenalty - second.declaredPreparationPenalty,
    },
    {
      id: "r8",
      shortLabel: "rule r8",
      helpText: "Before White moves, if a central bishop is edge-adjacent to Black's king and diagonally adjacent to White's king, and the knight is edge-adjacent to White's king but not adjacent to the bishop, prefer a king move that becomes edge-adjacent to the bishop while remaining adjacent to the knight.",
      compare: (first, second) => first.kingCoordinationPenalty - second.kingCoordinationPenalty,
    },
    {
      id: "r9.1",
      shortLabel: "rule r9.1",
      helpText: "If a bishop is attacked but not adjacent to White's king, maximize its distance from Black's king.",
      compare: (first, second) => first.attackedBishopEscapeScore - second.attackedBishopEscapeScore,
    },
    {
      id: "r9.2",
      shortLabel: "rule r9.2",
      helpText: "If a knight is attacked, prefer king defense.",
      compare: (first, second) => first.attackedKnightDefensePenalty - second.attackedKnightDefensePenalty,
    },
    {
      id: "r9.3",
      shortLabel: "rule r9.3",
      helpText: "If an adjacent bishop and knight are both within 2 steps of Black's king, unless they're defended by a central king, maximize the Bishop's distance from Black's king.",
      subpriorities: [
        { compare: (first, second) => first.nearbyPairCentralDefensePenalty - second.nearbyPairCentralDefensePenalty },
        { compare: (first, second) => first.nearbyPairBishopEscapeScore - second.nearbyPairBishopEscapeScore },
      ],
    },
    {
      id: "r9.5",
      shortLabel: "rule r9.5",
      helpText: "With White's king on the same color as the bishop, which is edge-adjacent to Black's king, take king opposition from behind the bishop.",
      compare: (first, second) => first.bishopOppositionPenalty - second.bishopOppositionPenalty,
    },
    {
      id: "r10",
      shortLabel: "rule r10",
      helpText: "Prefer king Euclidean proximity to the center, then king off bishop's color, then bishop on the long diagonal, then a king protected central bishop, then knight move proximity to a precage square, then king knight protection, then maximize non central bishop distance from Black's king, then prefer knight off bishop's color.",
      subpriorities: [
        { compare: (first, second) => first.kingCenterProximityScore - second.kingCenterProximityScore },
        { compare: (first, second) => first.kingBishopColorPenalty - second.kingBishopColorPenalty },
        { compare: (first, second) => first.bishopLongDiagonalPenalty - second.bishopLongDiagonalPenalty },
        { compare: (first, second) => first.bishopProtectedCenterPenalty - second.bishopProtectedCenterPenalty },
        { rank: scores => {
          const distances = scores.map(score => score.knightTargetProximityScore);
          const best = Math.min(99, ...distances);
          // An absent precage target is neutral.
          return distances.map(distance => distance === 99 ? best : distance);
        } },
        { compare: (first, second) => first.knightProtectionPenalty - second.knightProtectionPenalty },
        { compare: (first, second) => first.nonCentralBishopDistanceScore - second.nonCentralBishopDistanceScore },
        { compare: (first, second) => first.knightBishopColorPenalty - second.knightBishopColorPenalty },
      ],
    },
    {
      id: "r15",
      shortLabel: "rule r15",
      helpText: "For a bishop off the long diagonal, maximize the distance of its long diagonal intersection from Black's king.",
      compare: (first, second) => first.bishopLongDiagonalIntersectionScore - second.bishopLongDiagonalIntersectionScore,
    },
    {
      id: "r20",
      shortLabel: "rule r20",
      helpText: "Prefer a knight that cannot be attacked on Black’s next move.",
      compare: (first, second) => first.knightNextAttackPenalty - second.knightNextAttackPenalty,
    },
    {
      id: "r25",
      shortLabel: "rule r25",
      helpText: "Prefer the knight’s Euclidean proximity to the center.",
      compare: (first, second) => first.knightCenterProximityScore - second.knightCenterProximityScore,
    },
  ];

export function compareKnightAndBishopWhiteScores(
  first: KnightAndBishopWhiteMoveScore,
  second: KnightAndBishopWhiteMoveScore,
): number {
  return compareScoresByRules(first, second, knightAndBishopWhiteRules);
}

function scoreWhiteCandidates(
  fen: string,
  moves: readonly string[],
): readonly ScoredMove<KnightAndBishopWhiteMoveScore>[] {
  if (moves.length === 0) return [];
  const context = whiteScoringContext(fen);
  return moves.map((san) => ({ san, score: scoreKnightAndBishopWhiteMoveCore(fen, san, context) }));
}

export function getIdealKnightAndBishopWhiteMoves(fen: string): string[] {
  const chess = getChess(fen);
  const moves = chess.turn() === "w" ? chess.moves() : [];
  return [
    ...selectIdealMoves(
      scoreWhiteCandidates(fen, moves),
      knightAndBishopWhiteRules,
    ),
  ];
}

export function scoreKnightAndBishopOpponentPosition(
  fen: string,
): KnightAndBishopBlackMoveScore {
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  return {
    captureMinorPenalty: knightAndBishopPiecesPresent(fen) ? 1 : 0,
    unprotectedMinorDistance: distanceToNearestUnprotectedKnightOrBishop(fen),
    centerDistance: blackKing ? centerDistance(blackKing.square) : 99,
    mobilityScore: -getChess(fen).moves().length,
    whiteKingDistanceScore:
      whiteKing && blackKing
        ? -manhattanDistance(whiteKing.square, blackKing.square)
        : 0,
    matingCornerManhattanScore: -manhattanDistanceToNearestBishopCorner(fen),
  };
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
  );
}

export function knightAndBishopBlackHasLookupReply(
  fen: string,
  moves: readonly string[] = getChess(fen).moves(),
): boolean {
  return moves.some((san) => {
    const chess = getChess(fen);
    chess.move(san);
    return getKnightAndBishopLookupWhiteMoves(chess.fen()).length > 0;
  });
}

function selectIdealBlackMoves(
  fen: string,
  moves: readonly string[],
): string[] {
  const scored = moves.map((san) => {
    const next = getChess(fen);
    next.move(san);
    return { san, score: scoreKnightAndBishopOpponentPosition(next.fen()) };
  });
  const first = scored[0];
  if (!first) return [];
  let best = first;
  for (const candidate of scored.slice(1)) {
    if (compareKnightAndBishopBlackScores(candidate.score, best.score) < 0) {
      best = candidate;
    }
  }
  return scored
    .filter(
      ({ score }) => compareKnightAndBishopBlackScores(score, best.score) === 0,
    )
    .map(({ san }) => san);
}

export function getKnightAndBishopOpponentCandidates(
  fen: string,
  previousTurnFen?: string,
): OpponentCandidates {
  const moves = getChess(fen).moves();
  if (moves.length === 0) return { moves, idealMoves: [] };
  const priorityMoves = applyUniversalBlackPriorities(
    fen,
    previousTurnFen,
    moves,
  );
  if (
    isKnightAndBishopWManeuverPosition(fen) ||
    knightAndBishopBlackHasLookupReply(fen, priorityMoves)
  ) {
    return { moves, idealMoves: priorityMoves };
  }
  return { moves, idealMoves: selectIdealBlackMoves(fen, priorityMoves) };
}

const bishopKnightHelp: RuleHelp = {
  title: "How best moves are chosen",
  whiteIntro:
    "These priorities choose among White's legal moves.",
  blackIntro:
    "Black uses its own priorities to put up the strongest resistance. Black is not trying to help the mate; it looks for the most stubborn legal reply.",
  blackPriorities: [
    BLACK_CAPTURE_PRIORITY,
    BLACK_RETURN_PRIORITY,
    "In the W maneuver, or when any reply enters the finishing route, treat every legal reply as equally strong.",
    "Move toward an unprotected bishop or knight.",
    "Run toward the center.",
    "Keep as many legal king moves as possible.",
    "Stay away from White's king.",
    "Stay away from a bishop-colored corner.",
  ],
  notes: [
    "For r9.5, check the king's color and bishop–Black king edge adjacency before White moves. Prefer moving White's king to the square immediately behind the bishop, directly opposite Black's king, so the bishop sits between the kings. For Bf3 and Black Kg3, the target is Ke3. If no surviving legal king move reaches that square, this rule does not distinguish moves. Rotations and reflections use the same geometry.",
    "For r9.3, check before White moves: the bishop and knight must be adjacent (by edge or diagonal), both must be within two king steps of Black, and neither may be defended by White's king on d4, e4, d5 or e5. When this rule activates, first prefer a resulting central king defending either piece. Those defended outcomes tie; otherwise maximize only the bishop's Euclidean distance after the move, including moves beyond the two-step range.",
    "For r20, prefer a knight that no legal Black reply can attack or capture, including replies outside Black’s preferred moves. This preference applies whether or not the knight is defended, after all earlier rules.",
    "For r9.1, check before White moves: Black's king must attack the bishop and White's king must not be adjacent to it. Knight defense does not exempt the bishop. Maximize the bishop's Euclidean distance from Black after White moves. For r9.2, the knight must be attacked before White moves, whether or not it is already defended. Prefer king defense after the move; bishop defense alone does not satisfy this preference.",
    "A precage square is diagonally adjacent to a central bishop, off the long diagonal, and strictly behind the bishop from Black's king's perspective.",
    "For r10, candidates without a precage square remain neutral, tied with the best available distance. Among candidates with precage squares, fewer knight moves wins.",
    "The target corner is the bishop-colored corner closest to Black's king.",
    "Support squares, with reflections: for a2–g8, d3; for a4–e8, d5, with d3 as the previous-stage support square. Except for declared placement exceptions, with Nd3 a five-diagonal is supported only with the bishop on a4, c6 or d7 and White’s king on c5, c6 or c7 after White moves; Ba4 and Bd7 also permit Kd6. Bd7 with Nd3 is additionally eligible whenever the kings are within two king steps after White moves. All other support checks still apply. For a6–c8, Kc7 or Kd7 selects b5/c6, and Kb6 or Kb5 selects c6/d7; d5 is the previous-stage support square. Three-diagonal support also requires White’s king adjacent to a6 or c8, or on c6 with Ba6 (including reflections).",
    "An n-diagonal is supported when the knight occupies its previous-stage support square or is within one knight move of its own support square, and Black has no legal move onto the (n+1)-diagonal. Evaluate after White moves. White’s king must be on or inside the (n+2)-diagonal. A diagonal is unsupported if Black can legally step onto it.",
    "For every immediate Black move attacking an undefended bishop, White must have a legal response that leaves Black unable to step onto the (n+1)-diagonal.",
    "Exact placement exception: White Ke7, Bc6 and Nb4 against Black Kc7 is a supported five-diagonal, overriding the attacked-bishop restriction. Include reflections; move counters do not matter.",
    "Exact placement exception: White Kd4, Bc6 and Nb4 against Black Kb6 is a supported five-diagonal, overriding the knight-only bishop defense and king boundary restrictions. Include reflections; move counters do not matter.",
    "r5 exact preference: White Kd5, Bd7 and Nd3 against Black Kb6 prefers Kd6. Include reflections; r1.5 remains higher priority.",
    "r2.5 exact preferences: With Bb3 and Nd3, White Kc7 against Black Ka5 prefers Kc6, and White Kc6 against Black Ka6 prefers Kc5. White Kd6, Bb3 and Nd3 against Black Kb5 prefers Kd5. White Kf7 or Kf8, Bb3 and Nd3 against Black Kd6 prefers Ke8, before its general bishop and king-target preferences. Include reflections; move counters do not matter. r1.5 remains higher priority.",
    "Exact unsupported placement: White Kg4, Bf1 and Ne2 against Black Kh2 is not a supported three-diagonal. Include reflections; move counters do not matter.",
    "Exact unsupported placement: White Kb5, Bc8 and Nc6 against Black Ka7 is not a supported three-diagonal. Include reflections; move counters do not matter.",
    "Exact supported five-diagonal placement: White Kd5, Ba4 and Nd3 against Black Kb6; White Kd5, Bd7 and Nd3 against Black Ka5. Include reflections; move counters do not matter.",
    "Exact supported placement: White Kb6, Bc8 and Nd6 against Black Kb8 is a supported three-diagonal despite the knight-only bishop defense. Include reflections; move counters do not matter.",
    "Exact placement exception: White Kd4, Bc6 and Nd5 against Black Ka5 is a supported five-diagonal despite the king boundary restriction. Include reflections; move counters do not matter.",
    "Narrow king-defense exception: Kd5/Bc6 versus Black Kc7 is a supported five-diagonal when the knight is one move from d5, despite the occupied knight target. Include reflections; move counters do not matter.",
    "With a five-diagonal and Nd3, White must be no farther from e7 by king steps. Add one to White’s distance if Black is closer to the bishop and an unattacked bishop-adjacent square lies on a shortest king-step route from Black to e7. Apply reflections.",
    "For any knight not already on the five-diagonal support square, a tied e7 race loses support if Black can attack the bishop along a shortest route before White’s king can defend it, counting White’s response. Skip this race if the knight controls e7. Apply reflections.",
    "The d6 king race also loses a tie if Black can attack the bishop along a shortest route to d6 before White’s king can defend it, even counting White’s response to the attack. A five-knight or a knight controlling the race square still exempts that race. Apply reflections.",
    "With Ba6 on a three-diagonal, White must match Black’s king-step distance to b6. A tie loses support if Black can attack the bishop along a shortest route before White’s king can defend it, counting White’s response. Skip this race if the knight already controls b6. Apply reflections (Bc8 races to c7).",
    "For an undefended five-bishop on a4, b5 or c6, Black’s immediate approach to b6 with c5 uncontrolled rejects support unless White has a legal king response that both defends the bishop and controls or occupies c5. Apply reflections.",
  ],
  noteBoards: [{
    id: "bishop-knight-rule-r4-flush",
    title: "rule r4 — Flush the king from the non target corner",
    caption: "1. Ne5 Kg8 2. Nf7 Kf8 3. Kf6 Kg8 4. Bf5 Kf8 5. Bh7 Ke8 6. Ne5 Kf8 7. Nd3 Ke8 8. Bg8 Kf8 9. Bb3 Ke8",
    animationSrc: "/mate/bishop-knight/rule-r4-flush.gif",
    animationAlt: "The loaded nine-move flushing sequence, starting with Ne5 and ending with Bb3 Ke8, with a2–g8 highlighted.",
    pieces: [],
    highlights: [],

  }],
};

function whiteLegalMoves(fen: string): readonly string[] {
  const chess = getChess(fen);
  return chess.turn() === "w" ? chess.moves() : [];
}

export const bishopKnightRuleSet: MateRuleSet<KnightAndBishopWhiteMoveScore> = {
  id: "bishop-knight",
  phase: getKnightAndBishopPhaseLabel,
  phaseAfterWhiteMove: getKnightAndBishopPhaseAfterWhiteMove,
  scoreWhite: scoreKnightAndBishopWhiteMove,
  scoreWhiteCandidates,
  whiteRules: knightAndBishopWhiteRules,
  whiteMoves: whiteLegalMoves,
  blackCandidates: getKnightAndBishopOpponentCandidates,
  help: bishopKnightHelp,
};

export {
  getKnightAndBishopEstablishedZoneXKnightRouteTarget,
  getKnightAndBishopZone5,
  getKnightAndBishopZoneXKnightDriftTarget,
  getKnightAndBishopZoneXSetup,
  knightAndBishopWhiteMoveForcesZone5,
} from "./bishopKnightZoneX";
export { getKnightAndBishopKeySquarePatternScore } from "./bishopKnightKeySquare";
export {
  getKnightAndBishopLookupEntryResultFen,
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  isKnightAndBishopLookupPhasePosition,
  isKnightAndBishopMatingNetWhiteTurnPosition,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopWhiteMoveReachesLookupPath,
  wManeuverSetupDistance,
} from "./bishopKnightLookup";
export type {
  KnightAndBishopZone5,
  KnightAndBishopZoneXSetup,
} from "./bishopKnightGeometry";
