import { knightAndBishopThreeKingPlacementPenalty, knightAndBishopFiveBishopPenalty, knightAndBishopFiveKingTargetDistance, knightAndBishopShouldCheckThreeDiagonal, evaluateKnightAndBishopSupportedDiagonal } from "./bishopKnightDiagonalSupport";
import type { Square } from "chess.js";
import {
  allSquares,
  edgeDistance,
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
import { bishopControlsOrOccupiesSquare, bishopLongDiagonalIntersection, centerDistance } from "./bishopKnightGeometry";
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopPhaseAfterWhiteMove,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
} from "./bishopKnightLookup";
import { knightAndBishopCenterProximityScore, knightAndBishopKingCenterProximityScore, knightAndBishopKnightTargetProximityScore, knightAndBishopTargetCorners } from "./bishopKnightStrategy";
import { knightAndBishopDeclaredCornerFlushMove } from "./bishopKnightCornerFlush";
import { declaredSupportedThreeMove, declaredSupportedFiveMove, declaredSupportedSevenMove } from "./bishopKnightSupportedPreferences";
import { knightAndBishopDeclaredPreparationMove } from "./bishopKnightPreparation";
import { knightAndBishopShouldCoordinateKing, knightAndBishopKingCoordinatesMinors } from "./bishopKnightCoordination";
import { blackKingMoatSides, knightDistanceFromBlackMoatSide, type KingMoatSide } from "./bishopKnightKingMoat";
import { knightAndBishopFivePointFiveMove } from "./bishopKnightFivePointFive";
import { knightAndBishopRelativeKnightMove } from "./bishopKnightRelativeKnight";
import { compareScoresByRules, selectIdealMoves } from "./selection";
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from "./types";

export type KnightAndBishopWhiteMoveScore = {
  readonly bishopKingPathPenalty: number;
  readonly bothMinorsNextAttackPenalty: number;
  readonly declaredStepPenalty: number;
  readonly relativeKnightPenalty: number;
  readonly startsWithCentralKing: boolean;
  readonly bishopCenterPenalty: number;
  readonly minorBlackDistanceScore: number;
  readonly minorSeparationScore: number;
  readonly nearbyBishopEscapeScore: number;
  readonly knightBlackMoatDistanceScore: number;
  readonly kingCoordinationPenalty: number;
  readonly attackedBishopDefensePenalty: number;
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
  readonly declaredSupportedThreePenalty: number;
  readonly declaredSupportedFivePenalty: number | undefined;
  readonly declaredSupportedSevenPenalty: number;
  readonly supportedSevenFlushColorPenalty: number;
  readonly supportedSevenFlushDistance: number;
  readonly supportedSevenBishopPenalty: number;
  readonly supportedThreeKingPlacementPenalty: number;
  readonly supportedFiveBishopPenalty: number;
  readonly supportedFiveKingTargetDistance: number;
  readonly supportedSevenKingTargetDistance: number;
  readonly supportedSevenKingTieDistance: number;
  readonly mateScore: number;
  readonly stalemateScore: number;
  readonly pieceSafetyScore: number;
  readonly kingCenterProximityScore: number;
  readonly bishopLongDiagonalPenalty: number;
  readonly bishopProtectedCenterPenalty: number;
  readonly bishopTargetCornerDistanceScore: number;
  readonly knightTargetProximityScore: number;
  readonly knightProtectionPenalty: number;
  readonly nonCentralBishopDistanceScore: number;
  readonly knightBishopProtectionPenalty: number;
  readonly knightBishopColorPenalty: number;
  readonly knightEdgePenalty: number;
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
  readonly fivePointFiveMove: string | undefined;
  readonly relativeKnightMove: string | undefined;
  readonly startsWithCentralKing: boolean;
  readonly bishopOppositionTarget: Square | undefined;
  readonly shouldCoordinateKing: boolean;
  readonly shouldEscapeBishop: boolean;
  readonly shouldDistanceNearbyBishop: boolean;
  readonly knightMoatSides: readonly KingMoatSide[];
  readonly shouldEscapeNearbyPairBishop: boolean;
  readonly shouldDefendKnight: boolean;
  readonly declaredCornerFlushMove: string | undefined;
  readonly declaredPreparationMove: string | undefined;
  readonly declaredSupportedThreeMove: string | undefined;
  readonly declaredSupportedFiveMove: string | undefined;
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
    && manhattanDistance(bishop.square, blackKing.square) === 1) {
    const b = squareCoordinates(bishop.square), k = squareCoordinates(blackKing.square);
    const file = 2 * b.file - k.file, rank = 2 * b.rank - k.rank;
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8)
      bishopOppositionTarget = `${"abcdefgh"[file]}${rank + 1}` as Square;
  }
  return {
    fivePointFiveMove: knightAndBishopFivePointFiveMove(fen),
    relativeKnightMove: knightAndBishopRelativeKnightMove(fen),
    startsWithCentralKing: centralKing,
    bishopOppositionTarget,
    knightMoatSides: whiteKing && blackKing && knight && kingDistance(knight.square, blackKing.square) <= 2
      ? blackKingMoatSides(whiteKing.square, blackKing.square) : [],
    shouldDistanceNearbyBishop: !!bishop && !!blackKing
      && kingDistance(bishop.square, blackKing.square) <= 2,
    shouldEscapeNearbyPairBishop: !!bishop && !!knight && !!blackKing
      && kingDistance(bishop.square, knight.square) === 1
      && kingDistance(bishop.square, blackKing.square) <= 2
      && kingDistance(knight.square, blackKing.square) <= 2
      && !bishopCentrallyDefended && !knightCentrallyDefended,
    shouldEscapeBishop: !!bishop && !!blackKing && kingDistance(bishop.square, blackKing.square) === 1,
    shouldDefendKnight: !!knight && !!blackKing && kingDistance(knight.square, blackKing.square) === 1,
    shouldCoordinateKing: knightAndBishopShouldCoordinateKing(fen),
    declaredCornerFlushMove: knightAndBishopDeclaredCornerFlushMove(fen),
    declaredPreparationMove: knightAndBishopDeclaredPreparationMove(fen),
    declaredSupportedThreeMove: declaredSupportedThreeMove(fen),
    declaredSupportedFiveMove: declaredSupportedFiveMove(fen),
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
  const bishopKingDefended = !!bishop && !!whiteKing && kingDistance(bishop.square, whiteKing.square) === 1;
  const bishopDefendedByKingMove = move.piece === "k" && bishopKingDefended;
  const knightKingDefended = !!knight && !!whiteKing && kingDistance(knight.square, whiteKing.square) === 1;
  let supportedDiagonal: ReturnType<typeof evaluateKnightAndBishopSupportedDiagonal> | undefined;
  return {
    get kingCoordinationPenalty() {
      return context.shouldCoordinateKing
        && !(move.piece === "k" && knightAndBishopKingCoordinatesMinors(resultFen)) ? 1 : 0;
    },
    get knightBlackMoatDistanceScore() {
      const distance = knight ? knightDistanceFromBlackMoatSide(knight.square, context.knightMoatSides) : 0;
      return distance ? -distance : 0;
    },
    get bishopKingPathPenalty() {
      if (!bishop || !whiteKing || !blackKing) return 2;
      const distance = manhattanDistance(whiteKing.square, blackKing.square);
      const onPath = (square: Square) => square !== whiteKing.square && square !== blackKing.square
        && manhattanDistance(whiteKing.square, square) + manhattanDistance(square, blackKing.square) === distance;
      if (onPath(bishop.square)) return 0;
      return allSquares().some(square => onPath(square)
        && bishopControlsOrOccupiesSquare(resultFen, bishop.square, square, knight?.square)) ? 1 : 2;
    },
    get bothMinorsNextAttackPenalty() {
      const bishopDefendsKnight = bishop && knight && edgeDistance(bishop.square) > 0
        && bishopControlsOrOccupiesSquare(resultFen, bishop.square, knight.square);
      return bishop && knight && !bishopKingDefended && !knightKingDefended && !bishopDefendsKnight && blackReplies.some(reply => reply.piece === "k"
        && kingDistance(reply.to, bishop.square) === 1
        && kingDistance(reply.to, knight.square) === 1) ? 1 : 0;
    },
    declaredStepPenalty: context.fivePointFiveMove && context.fivePointFiveMove !== move.from + move.to ? 1 : 0,
    relativeKnightPenalty: context.relativeKnightMove && context.relativeKnightMove !== move.from + move.to ? 1 : 0,
    startsWithCentralKing: context.startsWithCentralKing,
    bishopCenterPenalty: bishop && centerDistance(bishop.square) === 0 ? 0 : 1,
    get minorSeparationScore() {
      return bishop && knight
        ? -Math.sqrt(squaredEuclideanDistance(bishop.square, knight.square)) : 0;
    },
    get minorBlackDistanceScore() {
      return blackKing ? -[bishop, knight].reduce((sum, piece) => sum + (piece
        ? Math.sqrt(squaredEuclideanDistance(piece.square, blackKing.square)) : 0), 0) : 0;
    },
    get nearbyBishopEscapeScore() {
      if (!context.shouldDistanceNearbyBishop || !bishop || !blackKing) return 0;
      return kingDistance(bishop.square, blackKing.square) >= 3 ? -3
        : -Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square));
    },
    attackedBishopDefensePenalty: context.shouldEscapeBishop && !bishopDefendedByKingMove ? 1 : 0,
    get attackedBishopEscapeScore() {
      return context.shouldEscapeBishop && !bishopDefendedByKingMove && bishop && blackKing
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
    get supportedThreeKingPlacementPenalty() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 3 ? knightAndBishopThreeKingPlacementPenalty(resultFen) : 0;
    },
    get supportedFiveBishopPenalty() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 5 ? knightAndBishopFiveBishopPenalty(resultFen) : 0;
    },
    get supportedFiveKingTargetDistance() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 5 ? knightAndBishopFiveKingTargetDistance(resultFen) : 0;
    },
    get supportedSevenKingTargetDistance() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 7 && support.sevenBishopPenalty === 0 ? support.sevenKingTargetDistance ?? 0 : 0;
    },
    get supportedSevenKingTieDistance() {
      const support = supportedDiagonal ??= evaluateKnightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return support.size === 7 ? support.sevenKingTieDistance ?? 0 : 0;
    },
    declaredSupportedThreePenalty: context.declaredSupportedThreeMove && context.declaredSupportedThreeMove !== move.from + move.to ? 1 : 0,
    declaredSupportedFivePenalty: context.declaredSupportedFiveMove === undefined ? undefined
      : context.declaredSupportedFiveMove === move.from + move.to ? 0 : 1,
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
    get bishopTargetCornerDistanceScore() {
      const targets = knightAndBishopTargetCorners(resultFen);
      return bishop && targets.length
        ? -Math.sqrt(Math.min(...targets.map(target => squaredEuclideanDistance(bishop.square, target)))) : 0;
    },
    knightProtectionPenalty: knightKingDefended ? 0 : 1,
    get knightBishopProtectionPenalty() {
      if (!bishop || !knight
        || !bishopControlsOrOccupiesSquare(resultFen, bishop.square, knight.square, blackKing?.square)) return 1;
      // Keep room to slide on the protecting diagonal, toward the knight or away from it.
      if (kingDistance(bishop.square, knight.square) >= 2) return 0;
      const b = squareCoordinates(bishop.square), n = squareCoordinates(knight.square);
      const file = b.file + Math.sign(b.file - n.file);
      const rank = b.rank + Math.sign(b.rank - n.rank);
      if (file < 0 || file > 7 || rank < 0 || rank > 7) return 1;
      const retreat = `${"abcdefgh"[file]}${rank + 1}` as Square;
      return retreat === whiteKing?.square ? 1 : 0;
    },
    knightBishopColorPenalty: knight && bishop && squareColor(knight.square) === squareColor(bishop.square) ? 1 : 0,
    knightEdgePenalty: knight && /^[ah]|[18]$/.test(knight.square) ? 1 : 0,
    get nonCentralBishopDistanceScore() {
      return bishop && blackKing && centerDistance(bishop.square) !== 0
        ? -Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square)) : 0;
    },
    get knightTargetProximityScore() {
      return knightTargetProximity ??= knightAndBishopKnightTargetProximityScore(resultFen);
    },
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
      helpText: "With a supported diagonal, prefer forcing Black’s king towards the target corner.",
      applies: score => score.supportedDiagonalSizeScore === 7 ||
        score.supportedDiagonalSizeScore === 5 || score.supportedDiagonalSizeScore === 3,
      subpriorities: [
        { compare: (first, second) => (first.supportedDiagonalSizeScore === 3 ? first.declaredSupportedThreePenalty : 0) - (second.supportedDiagonalSizeScore === 3 ? second.declaredSupportedThreePenalty : 0) },
        { compare: (first, second) => (first.declaredSupportedFivePenalty ?? 0) - (second.declaredSupportedFivePenalty ?? 0) },
        { compare: (first, second) => (first.supportedDiagonalSizeScore === 7 ? first.declaredSupportedSevenPenalty : 0) - (second.supportedDiagonalSizeScore === 7 ? second.declaredSupportedSevenPenalty : 0) },
        { compare: (first, second) => first.supportedThreeKingPlacementPenalty - second.supportedThreeKingPlacementPenalty },
        { compare: (first, second) => first.supportedFiveBishopPenalty - second.supportedFiveBishopPenalty },
        { compare: (first, second) => first.supportedFiveKingTargetDistance - second.supportedFiveKingTargetDistance },
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
      id: "r5.5",
      shortLabel: "rule r5.5",
      helpText: "Play the 5.5 step.",
      compare: (first, second) => first.declaredStepPenalty - second.declaredStepPenalty,
    },
    {
      id: "r8",
      shortLabel: "rule r8",
      helpText: "With a central king, prefer bishop on the long diagonal, then a central bishop, then knight move proximity to a precage square, then knight off the bishop's color.",
      applies: score => score.startsWithCentralKing,
      subpriorities: [
        { compare: (first, second) => first.bishopLongDiagonalPenalty - second.bishopLongDiagonalPenalty },
        { compare: (first, second) => first.bishopCenterPenalty - second.bishopCenterPenalty },
        { compare: (first, second) => first.knightTargetProximityScore - second.knightTargetProximityScore },
        { compare: (first, second) => first.knightBishopColorPenalty - second.knightBishopColorPenalty },
      ],
    },
    {
      id: "r9.1",
      shortLabel: "rule r9.1",
      helpText: "Play the 9.1 move.",
      compare: (first, second) => first.relativeKnightPenalty - second.relativeKnightPenalty,
    },
    {
      id: "r9.8",
      shortLabel: "rule r9.8",
      helpText: "Prefer Black to be unable to attack both minor pieces next move.",
      compare: (first, second) => first.bothMinorsNextAttackPenalty - second.bothMinorsNextAttackPenalty,
    },
    {
      id: "r9.9",
      shortLabel: "rule r9.9",
      helpText: "Minimize king distance to the center.",
      compare: (first, second) => first.kingCenterProximityScore - second.kingCenterProximityScore,
    },
    {
      id: "r9.95",
      shortLabel: "rule r9.95",
      helpText: "Prefer bishop occupation else control of a square on a shortest Manhattan path between the kings.",
      compare: (first, second) => first.bishopKingPathPenalty - second.bishopKingPathPenalty,
    },
    {
      id: "r9.96",
      shortLabel: "rule r9.96",
      helpText: "Prefer the bishop occupying the long diagonal.",
      compare: (first, second) => first.bishopLongDiagonalPenalty - second.bishopLongDiagonalPenalty,
    },
    {
      id: "r10",
      shortLabel: "rule r10",
      helpText: "If the bishop is within 2 steps of Black's king, maximize its distance from Black's king to at least 3 steps away.",
      compare: (first, second) => first.nearbyBishopEscapeScore - second.nearbyBishopEscapeScore,
    },
    {
      id: "r15",
      shortLabel: "rule r15",
      helpText: "If the knight is within 2 steps of Black's king, maximize its distance from Black's side of the king moat.",
      compare: (first, second) => first.knightBlackMoatDistanceScore - second.knightBlackMoatDistanceScore,
    },
    {
      id: "r17",
      shortLabel: "rule r17",
      helpText: "Protect the knight using a stable bishop.",
      compare: (first, second) => first.knightBishopProtectionPenalty - second.knightBishopProtectionPenalty,
    },
    {
      id: "r17.5",
      shortLabel: "rule r17.5",
      helpText: "Prefer the knight adjacent to White's king.",
      compare: (first, second) => first.knightProtectionPenalty - second.knightProtectionPenalty,
    },
    {
      id: "r18",
      shortLabel: "rule r18",
      helpText: "Prefer the knight off the edge of the board.",
      compare: (first, second) => first.knightEdgePenalty - second.knightEdgePenalty,
    },
    {
      id: "r20",
      shortLabel: "rule r20",
      helpText: "Maximize piece distance from Black's king, then maximize their distance from each other.",
      compare: (first, second) => first.minorBlackDistanceScore - second.minorBlackDistanceScore
        || first.minorSeparationScore - second.minorSeparationScore,
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
    "For r9.95, evaluate bishop occupation and control after White moves at any king separation. r9.96 independently prefers the bishop on its long diagonal.",
    "For r9.95, evaluate after White moves. A qualifying square is strictly between the kings on at least one shortest Manhattan path (horizontal and vertical steps only): its Manhattan distances to the two kings sum to the Manhattan distance between the kings. Prefer the bishop occupying such a square, then controlling one (including x-ray control through White’s knight), then neither.",
    "For r9.8, evaluate after White moves: penalize a position if any single legal Black king move would attack both the bishop and knight at once. A bishop or knight defended by White’s king, or a knight defended by a bishop off the board edge, is not considered attackable for this rule.",
    "For r8, White’s king must be on d4, e4, d5 or e5 before moving. Evaluate the bishop and knight preferences after White moves. A precage square is diagonally adjacent to a central bishop, off the long diagonals, and behind the bishop from Black’s king’s perspective.",
    "For r9.9, minimize White’s king Euclidean distance to the board’s midpoint. For r20, maximize the sum of the bishop’s and knight’s Euclidean distances from Black’s king, then maximize the Euclidean distance between the bishop and knight. Evaluate after White moves.",
    "For r17, count bishop protection through Black’s king, which must leave the checking diagonal. Other intervening pieces still block protection. Evaluate after White moves.",
    "For r15, check the knight’s two-king-step range before White moves. Fix the moat one file or rank from White’s starting king toward Black along their greater separation; use both axes when tied. Black’s side is the region beyond that line. Maximize the knight’s Euclidean distance from the nearest Black-side region after White moves; squares inside either region score zero. The moat also exists when the kings are farther than two steps apart.",
    "For r10, check before White moves: the bishop must be within two king steps of Black’s king. Prefer an escape to at least three king steps after White moves; all such escapes tie under r10. Below that threshold, maximize Euclidean distance.",
    "r2.5 general preferences, after exact declarations: With a supported 3 diagonal, equally prefer the king on b6 or c7. With a supported 5 diagonal and Nd5, prefer the bishop on b5 or d7. With Bb5 and Nd5, prefer king step proximity to the square two files to the right of Black’s king. Otherwise, with a supported 5 diagonal, Nd5 and Black on or adjacent to a5, prefer king step proximity to b4. With a supported 5 diagonal and Nd3, prefer king step proximity to the square two files to the right of Black’s king. With a supported 7 diagonal and Black on or adjacent to a3, prefer the king off the bishop’s color, then king step proximity to b2. Then prefer the bishop on b3, king step proximity to the square two files to the right of Black’s king, and king step proximity to e8. Include reflections.",
    "The target corner is the bishop-colored corner closest to Black's king.",
    "Support squares, with reflections: Bb7+ with Kb6 against Ka8 is supported when the knight is within one move of an available c6/d7 support square, including an edge knight. Ba6 with Kb6 is supported regardless of the knight, provided Black is inside the a6–c8 diagonal; this declaration overrides the other placement restrictions below and retains the c6/d7 knight targets. when White’s king shares the bishop’s color and is not on the board edge, the knight must occupy an actual support square for that diagonal; one-move proximity and previous-stage support do not qualify. Explicitly declared supported placements are exempt from this requirement. a bishop on c6 is always unsupported, regardless of the kings or knight; this supersedes all earlier Bc6 support exceptions. With a five-diagonal bishop and its five-diagonal knight (Nd5 for a4–e8), White’s king on the bishop’s color disqualifies support unless the king is on the board edge, except the declared Kd7/Bb5/Nd5 versus Kb7 placement after 2. Kd7. A knight on the board edge disqualifies support, except that Kb5/Ba6 is explicitly supported regardless of the knight’s location whenever Black is inside the a6–c8 diagonal, including rotations and reflections. This supersedes the older Ka7-only and Nf6/Nd5 placement exceptions, also permits a knight on the middle diagonal square, and bypasses the same-color/off-support restriction. It does not create a three-diagonal knight target. A seven-diagonal bishop is supported only when the knight occupies its seven-diagonal support square: d3 for a2–g8, including reflections. Being one knight move away does not qualify. All supported diagonals require the kings to be at most three king steps apart after White moves, including declared placement exceptions. With a seven-diagonal bishop, if Black is strictly closer to the bishop by Euclidean distance than White, White’s king must be strictly to the right of Black’s king in the qualifying support orientation. Distance ties remain eligible. With Nd3, five-diagonal support requires White’s king at least two files to the right of Black’s king, including declared placement exceptions and all rotations and reflections. The bishop must also be on a4 or adjacent to White’s king by edge or diagonal, except that Bd7 or Be8 with Nd3 is eligible when Black is on the a-file. This waives bishop adjacency; other support requirements still apply. Evaluate after White moves. For a2–g8, d3; for a4–e8, d5, with d3 as the previous-stage support square. Except for declared placement exceptions, with Nd3 a five-diagonal is supported only with the bishop on a4 or d7 and White’s king on c5, c6 or c7 after White moves; Ba4 and Bd7 also permit Kd6. Bd7 with Nd3 is additionally eligible whenever the kings are within two king steps after White moves. Be8 with Nd3 and Black on the a-file also waives the listed White-king placements and bishop adjacency requirement. All other support checks still apply. For a6–c8, only Kc7 selects b5/c6 and Kb6 selects c6/d7. There is no three-diagonal knight support square with White’s king elsewhere; then the knight must occupy d5, the previous-stage support square. This supersedes older Kd7, Kb5 and exact Kc6 target declarations. Three-diagonal support also requires White’s king adjacent to a6 or c8, or on c6 with Ba6 (including reflections).",
    "An n-diagonal is supported when the knight occupies its previous-stage support square or is within one knight move of its own support square, and Black has no legal move onto the (n+1)-diagonal. Evaluate after White moves. White’s king must be on or inside the (n+2)-diagonal. A diagonal is unsupported if Black can legally step onto it.",
    "For every immediate Black move attacking an undefended bishop, White must have a legal response that leaves Black unable to step onto the (n+1)-diagonal.",
    "r5 exact preference: White Kd5, Bd7 and Nd3 against Black Kb6 prefers Kd6. Include reflections; r1.5 remains higher priority.",
    "r2.5 exact preferences: White Ka5, Ba6 and Nd5 against Black Ka7 prefers Kb5. White Kb5, Ba6 and Nb6 against Black Kb8 prefers Nd5. White Ke7, Bb5 and Nd5 against Black Kb7 prefers Kd8. White Kc6, Ba4 and Nd5 against Black Ka6 prefers Kc5. White Kc6, Ba6 and Nd5 against Black Ka7 prefers Kb5. White Kd6, Bd7 and Nd3 against Black Ka5 prefers Kc5. With Bb3 and Nd3, White Kc7 against Black Ka5 prefers Kc6, and White Kc6 against Black Ka6 prefers Kc5. White Kd6, Bb3 and Nd3 against Black Kb5 prefers Kd5. White Kf7 or Kf8, Bb3 and Nd3 against Black Kd6 prefers Ke8, before its general bishop and king-target preferences. Include reflections; move counters do not matter. r1.5 remains higher priority.",
    "Exact unsupported placement: White Kg4, Bf1 and Ne2 against Black Kh2 is not a supported three-diagonal. Include reflections; move counters do not matter.",
    "Exact unsupported placement: White Kb5, Bc8 and Nc6 against Black Ka7 is not a supported three-diagonal. Include reflections; move counters do not matter.",
    "Exact supported five-diagonal placement: White Kd5, Ba4 and Nd3 against Black Kb6; White Kd5, Bd7 and Nd3 against Black Ka5. Include reflections; move counters do not matter.",
    "Exact supported placement: White Kb6, Bc8 and Nd6 against Black Kb8 is a supported three-diagonal despite the knight-only bishop defense. Include reflections; move counters do not matter.",
    "With a five-diagonal and Nd3, White must be no farther from e7 by king steps. Add one to White’s distance if Black is closer to the bishop and an unattacked bishop-adjacent square lies on a shortest king-step route from Black to e7. Apply reflections.",
    "For any knight not already on the five-diagonal support square, a tied e7 race loses support if Black can attack the bishop along a shortest route before White’s king can defend it, counting White’s response. Skip this race if the knight controls e7. Apply reflections.",
    "The d6 king race also loses a tie if Black can attack the bishop along a shortest route to d6 before White’s king can defend it, even counting White’s response to the attack. A five-knight or a knight controlling the race square still exempts that race. Apply reflections.",
    "With Ba6 on a three-diagonal, White must match Black’s king-step distance to b6. A tie loses support if Black can attack the bishop along a shortest route before White’s king can defend it, counting White’s response. Skip this race if the knight already controls b6. Apply reflections (Bc8 races to c7).",
    "For an undefended five-bishop on a4 or b5, Black’s immediate approach to b6 with c5 uncontrolled rejects support unless White has a legal king response that both defends the bishop and controls or occupies c5. Apply reflections.",
  ],
  noteBoards: [{
    id: "bishop-knight-rule-r5-5",
    title: "rule r5.5 — Play the 5.5 step",
    caption: "1. Kd3. Example: White Kc3 and Bc4 against Black Ke5. Anchor this relative arrangement to any central Black king: White starts two files and two ranks away, the bishop is one orthogonal step toward Black, and White steps toward Black on the other axis. Include rotations and reflections; the knight’s location is irrelevant. The move must be legal and earlier rules retain priority.",
    pieces: [{square: "c3", piece: "K"}, {square: "c4", piece: "B"}, {square: "e5", piece: "k"}],
    highlights: [{square: "d3", kind: "key"}],
    arrows: [{from: "c3", to: "d3"}],
  }, {
    id: "bishop-knight-rule-r5-5-kd7",
    title: "rule r5.5 — Play the 5.5 step",
    caption: "1. Kd7. Example: White Kc7 and Bc6 against Black Ke5. Preserve the relative king/bishop arrangement when Black occupies another central square. White starts two squares diagonally from Black and steps inward beside the bishop. Include rotations and reflections; the knight’s location is irrelevant. The move must be legal and earlier rules retain priority.",
    pieces: [{square: "c7", piece: "K"}, {square: "c6", piece: "B"}, {square: "e5", piece: "k"}],
    highlights: [{square: "d7", kind: "key"}],
    arrows: [{from: "c7", to: "d7"}],
  }, {
    id: "bishop-knight-rule-r9-1",
    title: "rule r9.1 — Play the 9.1 move",
    caption: "1. Nd2. Match the relative positions of White’s king, Black’s king and the knight, regardless of the bishop’s location. Include translations, rotations and reflections; the move must be legal and earlier rules retain priority.",
    pieces: [{square: "e2", piece: "K"}, {square: "f4", piece: "k"}, {square: "f3", piece: "N"}, {square: "a8", piece: "B"}],
    highlights: [{square: "d2", kind: "key"}],
    arrows: [{from: "f3", to: "d2"}],
  }, {
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
