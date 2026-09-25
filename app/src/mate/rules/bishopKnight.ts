import { knightAndBishopPrecageSideTarget, type PrecageSideTarget } from "./bishopKnightPrecageSide";
import { stableBishopProtectionDistance } from "./bishopKnightStableProtection";
import { knightAndBishopThreeKingPlacementPenalty, knightAndBishopFiveBishopPenalty, knightAndBishopFiveKingTargetDistance, knightAndBishopShouldCheckThreeDiagonal, evaluateKnightAndBishopSupportedDiagonal } from "./bishopKnightDiagonalSupport";
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
import { bishopLongDiagonalIntersection, centerDistance, isMiddle16Square } from "./bishopKnightGeometry";
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopPhaseAfterWhiteMove,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
} from "./bishopKnightLookup";
import { knightAndBishopKnightTargetSquares, knightAndBishopKnightProximityToSquare, knightKingProtectionDistance, knightAndBishopCenterProximityScore, knightAndBishopKingCenterProximityScore, knightAndBishopKingCenterEuclideanScore, knightAndBishopKnightTargetProximityScore, knightAndBishopTargetCorners } from "./bishopKnightStrategy";
import { knightAndBishopDeclaredPreparationMove } from "./bishopKnightPreparation";
import { knightAndBishopShouldCoordinateKing, knightAndBishopKingCoordinatesMinors } from "./bishopKnightCoordination";
import { knightAndBishopSixPointNineMove } from "./bishopKnightSixPointNine";
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
  readonly sixPointNinePenalty: number;
  readonly declaredStepPenalty: number;
  readonly relativeKnightPenalty: number;
  readonly startsWithMiddle16King: boolean;
  readonly bishopCenterPenalty: number;
  readonly minorBlackDistanceScore: number;
  readonly minorCenterDistanceScore: number;
  readonly knightKingProtectionDistance: number;
  readonly kingCoordinationPenalty: number;
  readonly attackedBishopDefensePenalty: number;
  readonly undefendedKnightOnlyBishopDefenderPenalty: number;
  readonly undefendedMinorForkPenalty: number;
  readonly attackedBishopEscapeScore: number;
  readonly nearbyPairBishopEscapeScore: number;
  readonly nearbyPairCentralDefensePenalty: number;
  readonly attackedKnightDefensePenalty: number;
  readonly bishopOppositionPenalty: number;
  readonly knightNextAttackPenalty: number;
  readonly knightCenterProximityScore: number;
  readonly oppositePrecageDistance: number;
  readonly middle16KnightKingAdjacencyPenalty: number;
  readonly oppositePrecageEuclideanDistanceSquared: number;
  readonly precageKingSteps: number;
  readonly precageSideDistance: number;
  readonly precageSideCornerDistanceSquared: number;
  readonly declaredPreparationPenalty: number;
  readonly supportedThreeCheckScore: number;
  readonly supportedDiagonalSizeScore: number;
  readonly supportedDiagonalKnightScore: number;
  readonly declaredSupportedKnightAdvancePenalty: number;
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
  readonly kingCenterEuclideanScore: number;
  readonly bishopLongDiagonalPenalty: number;
  readonly bishopProtectedCenterPenalty: number;
  readonly bishopTargetCornerDistanceScore: number;
  readonly knightTargetProximityScore: number;
  readonly nonCentralBishopDistanceScore: number;
  readonly knightBishopProtectionPenalty: number;
  readonly knightBishopColorPenalty: number;
  readonly kingBishopColorPenalty: number;
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
  readonly sixPointNineMove: string | undefined;
  readonly fivePointFiveMove: string | undefined;
  readonly relativeKnightMove: string | undefined;
  readonly startsWithMiddle16King: boolean;
  readonly shouldCoordinateKing: boolean;
  readonly shouldEscapeBishop: boolean;
  readonly shouldEscapeNearbyPairBishop: boolean;
  readonly shouldDefendKnight: boolean;
  readonly startsWithPrecageKnight: boolean;
  readonly precageSideTarget: PrecageSideTarget | undefined;
  readonly oppositePrecageTargets: readonly Square[];
  readonly declaredPreparationMove: string | undefined;
  readonly declaredSupportedKnightAdvance: string | undefined;
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
  return {
    precageSideTarget: knightAndBishopPrecageSideTarget(fen),
    sixPointNineMove: knightAndBishopSixPointNineMove(fen),
    fivePointFiveMove: knightAndBishopFivePointFiveMove(fen),
    relativeKnightMove: knightAndBishopRelativeKnightMove(fen),
    startsWithMiddle16King: !!whiteKing && isMiddle16Square(whiteKing.square),
    shouldEscapeNearbyPairBishop: !!bishop && !!knight && !!blackKing
      && kingDistance(bishop.square, knight.square) === 1
      && kingDistance(bishop.square, blackKing.square) <= 2
      && kingDistance(knight.square, blackKing.square) <= 2
      && !bishopCentrallyDefended && !knightCentrallyDefended,
    shouldEscapeBishop: !!bishop && !!blackKing && kingDistance(bishop.square, blackKing.square) === 1,
    shouldDefendKnight: !!knight && !!blackKing && kingDistance(knight.square, blackKing.square) === 1,
    shouldCoordinateKing: knightAndBishopShouldCoordinateKing(fen),
    startsWithPrecageKnight: !!knight && knightAndBishopKnightTargetSquares(fen).includes(knight.square),
    oppositePrecageTargets: whiteKing && isMiddle16Square(whiteKing.square)
      ? knightAndBishopKnightTargetSquares(fen) : [],
    declaredPreparationMove: knightAndBishopDeclaredPreparationMove(fen),
    declaredSupportedKnightAdvance: undefined,
    declaredSupportedThreeMove: undefined,
    declaredSupportedFiveMove: undefined,
    declaredSupportedSevenMove: undefined,
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
  let kingCenterEuclidean: number | undefined;
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
    sixPointNinePenalty: context.sixPointNineMove && context.sixPointNineMove !== move.from + move.to ? 1 : 0,
    declaredStepPenalty: context.fivePointFiveMove && context.fivePointFiveMove !== move.from + move.to ? 1 : 0,
    relativeKnightPenalty: context.relativeKnightMove && context.relativeKnightMove !== move.from + move.to ? 1 : 0,
    startsWithMiddle16King: context.startsWithMiddle16King,
    bishopCenterPenalty: bishop && centerDistance(bishop.square) === 0 ? 0 : 1,
    get knightKingProtectionDistance() { return knightKingProtectionDistance(resultFen); },
    get minorCenterDistanceScore() {
      return [bishop, knight].reduce((sum, piece) => sum + (piece
        ? Math.sqrt(knightAndBishopCenterProximityScore(piece.square)) / 2 : 0), 0);
    },
    get minorBlackDistanceScore() {
      return blackKing ? -[bishop, knight].reduce((sum, piece) => sum + (piece
        ? Math.sqrt(squaredEuclideanDistance(piece.square, blackKing.square)) : 0), 0) : 0;
    },
    undefendedKnightOnlyBishopDefenderPenalty: bishop && knight && blackKing
      && kingDistance(bishop.square, blackKing.square) === 1
      && squaredEuclideanDistance(bishop.square, knight.square) === 5
      && !bishopKingDefended && !knightKingDefended ? 1 : 0,
    get undefendedMinorForkPenalty() {
      if (!bishop || !knight || bishopKingDefended || knightKingDefended) return 0;
      return blackReplies.some(reply => {
        if (reply.captured || kingDistance(reply.to, bishop.square) !== 1
          || kingDistance(reply.to, knight.square) !== 1) return false;
        chess.move(reply);
        try {
          return !chess.isAttacked(bishop.square, "w") && !chess.isAttacked(knight.square, "w");
        } finally {
          chess.undo();
        }
      }) ? 1 : 0;
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
    bishopOppositionPenalty: whiteKing && bishop && blackKing
      && manhattanDistance(whiteKing.square, blackKing.square) === 2
      && manhattanDistance(whiteKing.square, bishop.square) === 1
      && manhattanDistance(blackKing.square, bishop.square) === 1
      && (squareCoordinates(whiteKing.square).file === squareCoordinates(blackKing.square).file
        || squareCoordinates(whiteKing.square).rank === squareCoordinates(blackKing.square).rank) ? 0 : 1,
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
    declaredSupportedKnightAdvancePenalty: context.declaredSupportedKnightAdvance && context.declaredSupportedKnightAdvance !== move.from + move.to ? 1 : 0,
    declaredSupportedThreePenalty: context.declaredSupportedThreeMove && context.declaredSupportedThreeMove !== move.from + move.to ? 1 : 0,
    declaredSupportedFivePenalty: context.declaredSupportedFiveMove === undefined ? undefined
      : context.declaredSupportedFiveMove === move.from + move.to ? 0 : 1,
    declaredSupportedSevenPenalty: context.declaredSupportedSevenMove && context.declaredSupportedSevenMove !== move.from + move.to ? 1 : 0,
    get oppositePrecageEuclideanDistanceSquared() {
      if (context.oppositePrecageTargets.length && (!bishop || centerDistance(bishop.square) !== 0)) return 99;
      return knight && context.oppositePrecageTargets.length
        ? Math.min(...context.oppositePrecageTargets.map(target => squaredEuclideanDistance(knight.square, target))) : 0;
    },
    middle16KnightKingAdjacencyPenalty: context.startsWithMiddle16King && !knightKingDefended ? 1 : 0,
    get oppositePrecageDistance() {
      if (context.oppositePrecageTargets.length && (!bishop || centerDistance(bishop.square) !== 0)) return 99;
      return context.oppositePrecageTargets.length
        ? Math.min(...context.oppositePrecageTargets.map(target => knightAndBishopKnightProximityToSquare(resultFen, target))) : 0;
    },
    precageSideDistance: context.precageSideTarget && whiteKing
      ? Math.max(0, Math.abs(squareCoordinates(whiteKing.square)[context.precageSideTarget.axis] - context.precageSideTarget.edge) - 1) : 0,
    precageSideCornerDistanceSquared: context.precageSideTarget && whiteKing
      ? squaredEuclideanDistance(whiteKing.square, context.precageSideTarget.corner) : 0,
    precageKingSteps: context.startsWithPrecageKnight && whiteKing && blackKing
      ? kingDistance(whiteKing.square, blackKing.square) : 0,
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
    get knightBishopProtectionPenalty() { return stableBishopProtectionDistance(resultFen); },
    kingBishopColorPenalty: whiteKing && bishop && squareColor(whiteKing.square) === squareColor(bishop.square) ? 1 : 0,
    knightBishopColorPenalty: knight && bishop && squareColor(knight.square) === squareColor(bishop.square) ? 1 : 0,
    get nonCentralBishopDistanceScore() {
      return bishop && blackKing && centerDistance(bishop.square) !== 0
        ? -Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square)) : 0;
    },
    get knightTargetProximityScore() {
      return knightTargetProximity ??= knightAndBishopKnightTargetProximityScore(resultFen);
    },
    get kingCenterEuclideanScore() {
      return kingCenterEuclidean ??= knightAndBishopKingCenterEuclideanScore(resultFen);
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
        { compare: (first, second) => first.declaredSupportedKnightAdvancePenalty - second.declaredSupportedKnightAdvancePenalty },
        { compare: (first, second) => first.supportedDiagonalKnightScore - second.supportedDiagonalKnightScore },
      ],
    },
    {
      id: "r5",
      shortLabel: "rule r5",
      helpText: "Prepare the 7 diagonal.",
      compare: (first, second) => first.declaredPreparationPenalty - second.declaredPreparationPenalty,
    },
    {
      id: "r5.1",
      shortLabel: "rule r5.1",
      helpText: "With a central bishop and knight on the precage square, prefer king step proximity.",
      compare: (first, second) => first.precageKingSteps - second.precageKingSteps,
    },
    {
      id: "r5.5",
      shortLabel: "rule r5.5",
      helpText: "Play the 5.5 step.",
      compare: (first, second) => first.declaredStepPenalty - second.declaredStepPenalty,
    },
    {
      id: "r6",
      shortLabel: "rule r6",
      helpText: "With a precage knight and Black's king closer by king steps to the target corner than White's king, prefer king proximity to within 1 of the bishop's side, then king proximity to the non-target corner.",
      subpriorities: [
        { compare: (first, second) => first.precageSideDistance - second.precageSideDistance },
        { compare: (first, second) => first.precageSideCornerDistanceSquared - second.precageSideCornerDistanceSquared },
      ],
    },
    {
      id: "r6.5",
      shortLabel: "rule r6.5",
      helpText: "An undefended knight should not be the only defender of an attacked bishop.",
      compare: (first, second) => first.undefendedKnightOnlyBishopDefenderPenalty - second.undefendedKnightOnlyBishopDefenderPenalty,
    },
    {
      id: "r6.8",
      shortLabel: "rule r6.8",
      helpText: "Do not allow Black to attack both undefended pieces next move.",
      compare: (first, second) => first.undefendedMinorForkPenalty - second.undefendedMinorForkPenalty,
    },
    {
      id: "r6.9",
      shortLabel: "rule r6.9",
      helpText: "Play the 6.9 move.",
      compare: (first, second) => first.sixPointNinePenalty - second.sixPointNinePenalty,
    },
    {
      id: "r7",
      shortLabel: "rule r7",
      helpText: "Prefer king step-then-Euclidean proximity to a central square, then prefer king on the color opposite the bishop.",
      compare: (first, second) => first.kingCenterProximityScore - second.kingCenterProximityScore
        || first.kingCenterEuclideanScore - second.kingCenterEuclideanScore
        || first.kingBishopColorPenalty - second.kingBishopColorPenalty,
    },
    {
      id: "r7.8",
      shortLabel: "rule r7.8",
      helpText: "With a middle-16 square king, prefer knight move proximity to a precage square, then prefer the knight adjacent to the king.",
      compare: (first, second) => first.oppositePrecageDistance - second.oppositePrecageDistance
        || first.oppositePrecageEuclideanDistanceSquared - second.oppositePrecageEuclideanDistanceSquared
        || first.middle16KnightKingAdjacencyPenalty - second.middle16KnightKingAdjacencyPenalty,
    },
    {
      id: "r8",
      shortLabel: "rule r8",
      helpText: "With a king on a middle-16 square, prefer bishop on the long diagonal, then a central bishop, then knight move proximity to a precage square, then knight off the bishop's color.",
      applies: score => score.startsWithMiddle16King,
      subpriorities: [
        { compare: (first, second) => first.bishopLongDiagonalPenalty - second.bishopLongDiagonalPenalty },
        { compare: (first, second) => first.bishopCenterPenalty - second.bishopCenterPenalty },
        { compare: (first, second) => first.knightTargetProximityScore - second.knightTargetProximityScore },
        { compare: (first, second) => first.knightBishopColorPenalty - second.knightBishopColorPenalty },
      ],
    },
    {
      id: "r8.5",
      shortLabel: "rule r8.5",
      helpText: "Prefer king opposition with the bishop between the kings.",
      compare: (first, second) => first.bishopOppositionPenalty - second.bishopOppositionPenalty,
    },
    {
      id: "r9.1",
      shortLabel: "rule r9.1",
      helpText: "Play the 9.1 move.",
      compare: (first, second) => first.relativeKnightPenalty - second.relativeKnightPenalty,
    },
    {
      id: "r9.98",
      shortLabel: "rule r9.98",
      helpText: "Prefer knight on or else one move from a stable bishop protected square.",
      compare: (first, second) => Math.min(2, first.knightBishopProtectionPenalty) - Math.min(2, second.knightBishopProtectionPenalty),
    },
    {
      id: "r10",
      shortLabel: "rule r10",
      helpText: "Prefer a precage knight, else drift the knight towards White king protection.",
      compare: (first, second) => {
        const firstPrecage = first.knightTargetProximityScore === 0;
        const secondPrecage = second.knightTargetProximityScore === 0;
        if (firstPrecage || secondPrecage) return Number(secondPrecage) - Number(firstPrecage);
        return first.knightKingProtectionDistance - second.knightKingProtectionDistance;
      },
    },
    {
      id: "r20",
      shortLabel: "rule r20",
      helpText: "Maximize piece distance from Black's king, then prefer piece Euclidean distance to the center.",
      compare: (first, second) => first.minorBlackDistanceScore - second.minorBlackDistanceScore
        || first.minorCenterDistanceScore - second.minorCenterDistanceScore,
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
    "For r6, use the rank or file halves separating the central bishop from the precage knight. Require an eligible precage knight before White moves. Prefer king distance to within one step of that half’s outer edge (the edge and its adjacent rank or file tie), then Euclidean proximity to its non-target corner. For Bd5/Nc4 with Black on ranks 5–8, target rank 8, then h8; include all board symmetries.",
    "For r7.8, freeze the shared precage targets before White moves. Require a middle-16 king. After White moves, require the bishop to remain central; otherwise there is no precage target and no proximity credit. Measure knight moves, then break ties by Euclidean proximity to the target, then prefer knight adjacency to White’s king. With no precage targets, proximity is neutral but adjacency still applies when the king starts in the middle 16.",
    "For r5.1, require a central bishop and knight on a precage square before White moves, then minimize the resulting king-step distance between the kings.",
    "For r8, White’s king must be on files c–f and ranks 3–6 before moving. Evaluate the bishop and knight preferences after White moves. Precage squares require a central bishop and must lie strictly opposite Black across the bishop’s long diagonal. For a light-squared bishop, select the opposite-side pair from c4, d3, e6 and f5; include board symmetries. No targets exist when Black is on the long diagonal. Bishop adjacency is not required. Rules r5.1, r6, r7.8 and r8 share these targets.",
    "For r7, minimize White’s king steps to the nearest of d4, e4, d5 or e5, then Euclidean distance to the nearest of those squares, then prefer the king on the color opposite the bishop. For r20, maximize the sum of the bishop’s and knight’s Euclidean distances from Black’s king, then minimize the sum of their Euclidean distances to the board’s midpoint, measured after White moves.",
    "For r9.98, count bishop protection through Black’s king, which must leave the checking diagonal. Other intervening pieces still block protection. Evaluate after White moves.",
    "The target corner is the bishop-colored corner closest to Black's king.",
    "Support has been reset. No position is supported until explicitly declared under the new rules; all earlier support declarations and r2.5 preferences have been discarded.",
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
    id: "bishop-knight-rule-r6-9",
    title: "rule r6.9 — Play the 6.9 move",
    caption: "Kd6 takes opposition with the bishop between the kings. The bishop is on the long diagonal, two squares from the corner; Black is adjacent, and White’s king is central and adjacent to the bishop. Include rotations and reflections, without translations. The knight’s location is irrelevant; the move must be legal and earlier rules retain priority.",
    pieces: [{square: "d5", piece: "K"}, {square: "c6", piece: "B"}, {square: "b6", piece: "k"}],
    highlights: [{square: "d6", kind: "key"}],
    arrows: [{from: "d5", to: "d6"}],
  }, {
    id: "bishop-knight-rule-r9-1",
    title: "rule r9.1 — Play the 9.1 move",
    caption: "1. Nd2. Match the relative positions of White’s king, Black’s king and the knight, regardless of the bishop’s location. Include translations, rotations and reflections; the move must be legal and earlier rules retain priority.",
    pieces: [{square: "e2", piece: "K"}, {square: "f4", piece: "k"}, {square: "f3", piece: "N"}, {square: "a8", piece: "B"}],
    highlights: [{square: "d2", kind: "key"}],
    arrows: [{from: "f3", to: "d2"}],
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
