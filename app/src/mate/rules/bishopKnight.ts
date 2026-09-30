import { sevenCageMoves } from "./bishopKnightSevenCage";
import { matingNetMoves } from "./bishopKnightMatingNet";
import { rareDegenerateEscapeMove, rareEscapeStartingFormation } from "./bishopKnightRareEscape";
import { bishopCentralPathDistances } from "./bishopKnightBishopPath";
import { declaredKnightDefenseMove } from "./bishopKnightDeclaredDefense";
import { protectedCentralManeuverTargets } from "./bishopKnightProtectedManeuver";
import { bishopKnightBlackReplies } from "./bishopKnightReplies";
import { kingApproachKnightTargets } from "./bishopKnightKingApproach";
import { declaredCentralNavigationMoves } from "./bishopKnightCentralNavigation";
import { knightAndBishopShuffleTargets } from "./bishopKnightShuffle";
import { knightAndBishopPrecageSideTarget, type PrecageSideTarget } from "./bishopKnightPrecageSide";
import { canBishopEstablishStableProtection, stableBishopProtectionDistance, stableBishopProtectedSquares } from "./bishopKnightStableProtection";
import { knightAndBishopThreeKingPlacementPenalty, knightAndBishopFiveBishopPenalty, knightAndBishopFiveKingTargetDistance, knightAndBishopShouldCheckThreeDiagonal, evaluateKnightAndBishopSupportedDiagonal } from "./bishopKnightDiagonalSupport";
import type { Square } from "chess.js";
import {
  allSquares,
  isKnightMove,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  kingDistance,
  manhattanDistance,
  squareColor,
  squareCoordinates,
  squareFromCoords,
  squaredEuclideanDistance,
} from "../chess";
import {
  applyUniversalBlackPriorities,
  BLACK_CAPTURE_PRIORITY,
  BLACK_RETURN_PRIORITY,
} from "./blackPriorities";
import { bishopControlsOrOccupiesSquare, bishopLongDiagonalIntersection, centerDistance, isMiddle16Square, isBoardEdge } from "./bishopKnightGeometry";
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopPhaseAfterWhiteMove,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
} from "./bishopKnightLookup";
import { knightMoveDistance, knightAndBishopKnightTargetSquares, knightAndBishopKnightProximityToSquare, knightKingProtectionDistance, knightAndBishopCenterProximityScore, knightAndBishopKingCenterProximityScore, knightAndBishopKingCenterEuclideanScore, knightAndBishopKnightTargetProximityScore, knightAndBishopTargetCorners } from "./bishopKnightStrategy";
import { knightAndBishopR5Move } from "./bishopKnightR5";
import { knightAndBishopR5OppositionMoves } from "./bishopKnightR5Opposition";
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
  readonly matingNetPenalty: number;
  readonly sevenCagePenalty: number;
  readonly kingEdgePenalty: number;
  readonly rareEscapePenalty: number;
  readonly declaredCentralNavigationPenalty: number | undefined;
  readonly protectedCentralManeuverPenalty: number | undefined;
  readonly bishopCentralPathDistance: number;
  readonly sixPointNinePenalty: number;
  readonly declaredStepPenalty: number;
  readonly relativeKnightPenalty: number;
  readonly startsWithMiddle16King: boolean;
  readonly startsWithCentralKingAndMiddle16Knight: boolean;
  readonly startsWithProtectedOppositeCentralKnight: boolean;
  readonly centralSetupBoundaryPenalty: number;
  readonly bishopCenterPenalty: number;
  readonly knightOppositeCentralDistance: number;
  readonly bishopCentralProximityScore: number;
  readonly startsWithBishopAdjacentToNoncentralKing: boolean;
  readonly bishopWhiteKingDistanceScore: number;
  readonly bishopMoveNearNoncentralKingPenalty: number;
  readonly immobileBishopPenalty: number;
  readonly bishopKingCentralCompletionPenalty: number;
  readonly bishopKingCentralNavigationScore: number;
  readonly bishopShuffleControlPenalty: number;
  readonly minorBlackDistanceScore: number;
  readonly unprotectedMinorCount: number;
  readonly minorCenterDistanceScore: number;
  readonly attackedMinorWithoutKingDefensePenalty: number;
  readonly knightKingProtectionDistance: number;
  readonly knightKingProximityScore: number;
  readonly knightStableBishopProtectionPenalty: number;
  readonly knightDefensePenalty: number;
  readonly knightCentralProximityScore: number;
  readonly kingKnightAdjacencyPenalty: number;
  readonly kingKnightDistanceScore: number;
  readonly knightDriftQualifies: boolean;
  readonly knightDriftRank: number;
  readonly knightDoubleOpposition: boolean;
  readonly knightFlanksBlackKing: boolean;
  readonly knightWhiteSideOfBlackDistance: number;
  readonly kingStepsTowardKnight: boolean;
  readonly kingBlackDistanceSquared: number;
  readonly bishopBlackDistanceSquared: number;
  readonly knightBlackDistanceSquared: number;
  readonly kingCoordinationPenalty: number;
  readonly attackedBishopDefensePenalty: number;
  readonly undefendedKnightOnlyBishopDefenderPenalty: number;
  readonly undefendedMinorForkPenalty: number;
  readonly attackedBishopEscapeScore: number;
  readonly attackedBishopDistanceScore: number;
  readonly nearbyPairBishopEscapeScore: number;
  readonly nearbyPairCentralDefensePenalty: number;
  readonly attackedKnightDefensePenalty: number;
  readonly bishopOppositionPenalty: number;
  readonly knightNextAttackPenalty: number;
  readonly knightMiddle16ProximityScore: number;
  readonly oppositePrecageDistance: number;
  readonly middle16KnightKingAdjacencyPenalty: number;
  readonly oppositePrecageEuclideanDistanceSquared: number;
  readonly precageKingSteps: number;
  readonly precageSideDistance: number;
  readonly precageSideCornerDistanceSquared: number;
  readonly declaredPreparationPenalty: number;
  readonly preparationBishopWaitDistance: number;
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

// With an edge-adjacent blocker between knight and king, either perpendicular flank
// gets around it; closeness to White's king should not choose the flank.
function knightFlankSquares(knight: Square, blackKing: Square, whiteKing: Square) {
  const n = squareCoordinates(knight), b = squareCoordinates(blackKing), w = squareCoordinates(whiteKing);
  const dx = b.file - n.file, dy = b.rank - n.rank;
  if (Math.abs(dx) + Math.abs(dy) !== 1
    || b.file < Math.min(n.file, w.file) || b.file > Math.max(n.file, w.file)
    || b.rank < Math.min(n.rank, w.rank) || b.rank > Math.max(n.rank, w.rank)) return [];
  return dx ? [squareFromCoords(b.file, b.rank - 2), squareFromCoords(b.file, b.rank + 2)]
    : [squareFromCoords(b.file - 2, b.rank), squareFromCoords(b.file + 2, b.rank)];
}

function knightDoubleOppositionSquares(knight: Square, blackKing: Square, whiteKing: Square) {
  const n = squareCoordinates(knight), b = squareCoordinates(blackKing);
  const w = squareCoordinates(whiteKing), dx = b.file - n.file, dy = b.rank - n.rank;
  if (Math.abs(dx) !== 1 || Math.abs(dy) !== 1
    || dx * (w.file - b.file) < 0 || dy * (w.rank - b.rank) < 0) return undefined;
  return [squareFromCoords(b.file, n.rank - 2 * dy), squareFromCoords(n.file - 2 * dx, b.rank)];
}

function bishopInsideClutterRectangle(bishop: Square, whiteKing: Square, knight: Square) {
  const b = squareCoordinates(bishop), k = squareCoordinates(whiteKing), n = squareCoordinates(knight);
  return b.file >= Math.min(k.file, n.file, 3) && b.file <= Math.max(k.file, n.file, 4)
    && b.rank >= Math.min(k.rank, n.rank, 3) && b.rank <= Math.max(k.rank, n.rank, 4);
}

type KnightAndBishopPositionScoreContext = {
  readonly matingNetMoves: readonly string[];
  readonly sevenCageMoves: readonly string[];
  readonly rareEscapeMove: string | undefined;
  readonly declaredKnightDefenseMove: string | undefined;
  readonly bishopCentralPathDistances: ReadonlyMap<Square, number>;
  readonly centralNavigationMoves: readonly string[];
  readonly protectedCentralManeuverTargets: readonly Square[];
  readonly startsWithBishopInClutterRectangle: boolean;
  readonly kingApproachTargets: readonly Square[];
  readonly knightOppositeCentralTargets: readonly Square[];
  readonly bishopShuffleTargets: readonly Square[];
  readonly startsWithAttackableBishop: boolean;
  readonly startsWithAttackableKnight: boolean;
  readonly startsWithUnprotectedBishop: boolean;
  readonly startsWithBishopAdjacentToNoncentralKing: boolean;
  readonly startsWithUnprotectedKnight: boolean;
  readonly sixPointNineMove: string | undefined;
  readonly fivePointFiveMove: string | undefined;
  readonly relativeKnightMove: string | undefined;
  readonly startsWithMiddle16King: boolean;
  readonly startsWithCentralKingAndMiddle16Knight: boolean;
  readonly startsWithProtectedOppositeCentralKnight: boolean;
  readonly shouldCoordinateKing: boolean;
  readonly shouldEscapeBishop: boolean;
  readonly shouldEscapeNearbyPairBishop: boolean;
  readonly shouldDefendKnight: boolean;
  readonly startsWithPrecageKnight: boolean;
  readonly precageSideTarget: PrecageSideTarget | undefined;
  readonly oppositePrecageTargets: readonly Square[];
  readonly declaredPreparationMoves: readonly string[] | undefined;
  readonly declaredSupportedKnightAdvance: string | undefined;
  readonly declaredSupportedThreeMove: string | undefined;
  readonly declaredSupportedFiveMove: string | undefined;
  readonly declaredSupportedSevenMove: string | undefined;
  readonly shouldCheckThreeDiagonal: boolean;
};

function whiteScoringContext(fen: string): KnightAndBishopPositionScoreContext {
  let shouldCheckThreeDiagonal: boolean | undefined;
  let kingApproachTargets: readonly Square[] | undefined;
  let bishopPathDistances: ReadonlyMap<Square, number> | undefined;
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const centralKing = !!whiteKing && centerDistance(whiteKing.square) === 0;
  const bishop = findPiece(fen, "w", "b");
  const knight = findPiece(fen, "w", "n");
  const bishopCentrallyDefended = !!bishop && centralKing && kingDistance(whiteKing.square, bishop.square) === 1;
  const knightCentrallyDefended = !!knight && centralKing && kingDistance(whiteKing.square, knight.square) === 1;
  let unprotectedKnight: boolean | undefined;
  let blackApproaches: readonly Square[] | undefined;
  const attackable = (square: Square | undefined) => {
    if (!square || !blackKing || (whiteKing && kingDistance(square, whiteKing.square) === 1)) return false;
    const distance = kingDistance(square, blackKing.square);
    if (distance === 1) return true;
    if (distance > 2) return false;
    blackApproaches ??= bishopKnightBlackReplies(getChess(fen.replace(/ [wb] /, " b ")), blackKing.square).map(move => move.to);
    return blackApproaches.some(target => kingDistance(square, target) === 1);
  };
  return {
    matingNetMoves: matingNetMoves(fen),
    sevenCageMoves: sevenCageMoves(fen),
    rareEscapeMove: rareDegenerateEscapeMove(fen),
    declaredKnightDefenseMove: declaredKnightDefenseMove(fen),
    get bishopCentralPathDistances() { return bishopPathDistances ??= bishopCentralPathDistances(fen); },
    centralNavigationMoves: declaredCentralNavigationMoves(fen),
    protectedCentralManeuverTargets: protectedCentralManeuverTargets(fen),
    startsWithBishopInClutterRectangle: !!bishop && !!whiteKing && !!knight
      && bishopInsideClutterRectangle(bishop.square, whiteKing.square, knight.square),
    get kingApproachTargets() { return kingApproachTargets ??= kingApproachKnightTargets(fen); },
    knightOppositeCentralTargets: (["d4", "e4", "d5", "e5"] as const).filter(target =>
      bishop && target !== whiteKing?.square && squareColor(target) !== squareColor(bishop.square)),
    bishopShuffleTargets: knightAndBishopShuffleTargets(fen),
    startsWithBishopAdjacentToNoncentralKing: !!whiteKing && !!bishop && !centralKing
      && kingDistance(whiteKing.square, bishop.square) === 1,
    get startsWithAttackableBishop() { return attackable(bishop?.square); },
    get startsWithAttackableKnight() { return attackable(knight?.square); },
    startsWithUnprotectedBishop: !!bishop
      && (!whiteKing || kingDistance(whiteKing.square,bishop.square)!==1)
      && (!knight || squaredEuclideanDistance(bishop.square,knight.square)!==5),
    get startsWithUnprotectedKnight() {
      return unprotectedKnight ??= !!knight
        && (!whiteKing || kingDistance(whiteKing.square,knight.square)!==1)
        && !stableBishopProtectedSquares(fen).includes(knight.square);
    },
    precageSideTarget: knightAndBishopPrecageSideTarget(fen),
    sixPointNineMove: knightAndBishopSixPointNineMove(fen),
    fivePointFiveMove: knightAndBishopFivePointFiveMove(fen),
    relativeKnightMove: knightAndBishopRelativeKnightMove(fen),
    startsWithMiddle16King: !!whiteKing && isMiddle16Square(whiteKing.square),
    startsWithCentralKingAndMiddle16Knight: centralKing && !!knight && isMiddle16Square(knight.square),
    // Continue the navigation stage after a protected maneuver reaches its target,
    // including when the protecting king is in the surrounding central 16.
    startsWithProtectedOppositeCentralKnight: !!whiteKing && !!knight && !!bishop
      && isMiddle16Square(whiteKing.square) && kingDistance(whiteKing.square, knight.square) === 1
      && centerDistance(knight.square) === 0 && squareColor(knight.square) !== squareColor(bishop.square),
    shouldEscapeNearbyPairBishop: !!bishop && !!knight && !!blackKing
      && kingDistance(bishop.square, knight.square) === 1
      && kingDistance(bishop.square, blackKing.square) <= 2
      && kingDistance(knight.square, blackKing.square) <= 2
      && !bishopCentrallyDefended && !knightCentrallyDefended,
    shouldEscapeBishop: !!bishop && !!blackKing && kingDistance(bishop.square, blackKing.square) === 1
      && (!whiteKing || kingDistance(bishop.square, whiteKing.square) !== 1),
    shouldDefendKnight: !!knight && !!blackKing && kingDistance(knight.square, blackKing.square) === 1,
    shouldCoordinateKing: knightAndBishopShouldCoordinateKing(fen),
    startsWithPrecageKnight: !!knight && knightAndBishopKnightTargetSquares(fen).includes(knight.square),
    oppositePrecageTargets: whiteKing && isMiddle16Square(whiteKing.square)
      ? knightAndBishopKnightTargetSquares(fen) : [],
    declaredPreparationMoves: (() => {
      const move=knightAndBishopR5Move(fen);
      return knightAndBishopR5OppositionMoves(fen) ?? (move ? [move] : undefined);
    })(),
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
  const blackKing = findPiece(resultFen, "b", "k");
  const blackReplies = bishopKnightBlackReplies(chess, blackKing?.square);
  const givesCheck = chess.isCheck();
  const checkmate = givesCheck && blackReplies.length === 0;
  const whiteKing = findPiece(resultFen, "w", "k");
  const bishop = findPiece(resultFen, "w", "b");
  const protectedCentralBishop = !!bishop && !!whiteKing && centerDistance(bishop.square) === 0
    && kingDistance(bishop.square, whiteKing.square) === 1;
  let kingCenterProximity: number | undefined;
  let kingCenterEuclidean: number | undefined;
  let knightTargetProximity: number | undefined;
  let immobileBishopPenalty: number | undefined;
  const knight = findPiece(resultFen, "w", "n");
  const bishopInClutterRectangle = !!bishop && !!whiteKing && !!knight
    && bishopInsideClutterRectangle(bishop.square, whiteKing.square, knight.square);
  const doubleOppositionTargets = move.piece === "n" && whiteKing && blackKing
    ? knightDoubleOppositionSquares(move.from, blackKing.square, whiteKing.square) : undefined;
  const blockedDoubleOpposition = doubleOppositionTargets?.every(square => !square
    || [bishop?.square, whiteKing?.square, blackKing?.square].includes(square)) ?? false;
  const nearbyPairCentrallyDefended = !!whiteKing && centerDistance(whiteKing.square) === 0
    && ((!!bishop && kingDistance(bishop.square, whiteKing.square) === 1)
      || (!!knight && kingDistance(knight.square, whiteKing.square) === 1));
  const bishopKingDefended = !!bishop && !!whiteKing && kingDistance(bishop.square, whiteKing.square) === 1;
  const bishopDefendedByKingMove = move.piece === "k" && bishopKingDefended;
  const knightKingDefended = !!knight && !!whiteKing && kingDistance(knight.square, whiteKing.square) === 1;
  let knightBishopStableDefense: boolean | undefined;
  const knightBishopStablyDefended = () => knightBishopStableDefense ??= !!knight
    && stableBishopProtectedSquares(resultFen).includes(knight.square);
  let supportedDiagonal: ReturnType<typeof evaluateKnightAndBishopSupportedDiagonal> | undefined;
  return {
    matingNetPenalty: context.matingNetMoves.length && !context.matingNetMoves.includes(move.from + move.to) ? 1 : 0,
    sevenCagePenalty: context.sevenCageMoves.length && !context.sevenCageMoves.includes(move.from + move.to) ? 1 : 0,
    kingEdgePenalty: Number(move.piece === "k" && isBoardEdge(move.to)),
    get bishopShuffleControlPenalty() {
      return context.bishopShuffleTargets.length && !context.bishopShuffleTargets.some(target =>
        bishop && bishop.square !== target && bishopControlsOrOccupiesSquare(resultFen, bishop.square, target)) ? 1 : 0;
    },
    get kingCoordinationPenalty() {
      return context.shouldCoordinateKing
        && !(move.piece === "k" && knightAndBishopKingCoordinatesMinors(resultFen)) ? 1 : 0;
    },
    get rareEscapePenalty() {
      return rareEscapeStartingFormation(whiteKing?.square, bishop?.square, knight?.square)
        || (context.rareEscapeMove && context.rareEscapeMove !== move.from + move.to) ? 1 : 0;
    },
    sixPointNinePenalty: context.sixPointNineMove && context.sixPointNineMove !== move.from + move.to ? 1 : 0,
    get bishopCentralPathDistance() {
      // An explicit r4 route already supplies the way forward.
      if (context.centralNavigationMoves.length) return 0;
      const distances = context.bishopCentralPathDistances;
      return !distances.size ? 0 : move.piece === "b" ? distances.get(move.to) ?? 99 : 99;
    },
    declaredStepPenalty: context.fivePointFiveMove && context.fivePointFiveMove !== move.from + move.to ? 1 : 0,
    relativeKnightPenalty: context.relativeKnightMove && context.relativeKnightMove !== move.from + move.to ? 1 : 0,
    declaredCentralNavigationPenalty: !context.centralNavigationMoves.length ? undefined
      : Number(!context.centralNavigationMoves.includes(move.from + move.to)),
    protectedCentralManeuverPenalty: context.protectedCentralManeuverTargets.length
      ? Number(move.piece !== "n" || !context.protectedCentralManeuverTargets.includes(move.to)) : undefined,
    startsWithMiddle16King: context.startsWithMiddle16King,
    startsWithCentralKingAndMiddle16Knight: context.startsWithCentralKingAndMiddle16Knight,
    startsWithProtectedOppositeCentralKnight: context.startsWithProtectedOppositeCentralKnight,
    centralSetupBoundaryPenalty: whiteKing && knight && centerDistance(whiteKing.square) === 0
      && isMiddle16Square(knight.square) ? 0 : 1,
    get knightOppositeCentralDistance() {
      if (!knight || !bishop) return 99;
      const targets = context.knightOppositeCentralTargets.filter(target => target !== whiteKing?.square);
      return targets.length ? Math.min(...targets.map(target => knightMoveDistance(knight.square, target))) : 99;
    },
    get bishopKingCentralCompletionPenalty() {
      if (!context.startsWithProtectedOppositeCentralKnight) return 0;
      if (!bishop || !whiteKing) return 2;
      // Complete the king's goal first, then the bishop's, before partial distance gains.
      return Number(centerDistance(bishop.square) !== 0)
        + 2 * Number(centerDistance(whiteKing.square) !== 0
          || squareColor(whiteKing.square) === squareColor(bishop.square));
    },
    get bishopKingCentralNavigationScore() {
      // Start bishop/king navigation only after completing the protected knight maneuver.
      if (!context.startsWithProtectedOppositeCentralKnight) return 0;
      if (!bishop || !whiteKing) return 99;
      const central = ["d4", "e4", "d5", "e5"] as const;
      const bishopTargets = central.filter(square => squareColor(square) === squareColor(bishop.square));
      const kingTargets = central.filter(square => squareColor(square) !== squareColor(bishop.square) && square !== knight?.square);
      return Math.min(...bishopTargets.map(square => squaredEuclideanDistance(bishop.square, square)))
        + Math.min(...kingTargets.map(square => squaredEuclideanDistance(whiteKing.square, square)));
    },
    startsWithBishopAdjacentToNoncentralKing: context.startsWithBishopAdjacentToNoncentralKing,
    get immobileBishopPenalty() {
      return immobileBishopPenalty ??= bishopInClutterRectangle && bishop
        && getChess(resultFen.replace(" b ", " w ")).moves({ square: bishop.square }).length === 0 ? 1 : 0;
    },
    bishopMoveNearNoncentralKingPenalty: bishopInClutterRectangle && move.piece === "b" && bishop && whiteKing && centerDistance(whiteKing.square) !== 0
      && kingDistance(bishop.square, whiteKing.square) <= 2 ? 1 : 0,
    // Outside is neutral (0); inside separation costs remain positive, decreasing with distance.
    bishopWhiteKingDistanceScore: context.startsWithBishopInClutterRectangle
      && bishopInClutterRectangle && context.startsWithBishopAdjacentToNoncentralKing && bishop && whiteKing
      ? 98 - squaredEuclideanDistance(bishop.square, whiteKing.square) : 0,
    bishopCentralProximityScore: bishop ? knightAndBishopCenterProximityScore(bishop.square) : 99,
    bishopCenterPenalty: bishop && centerDistance(bishop.square) === 0 ? 0 : 1,
    attackedMinorWithoutKingDefensePenalty: [bishop, knight].filter(piece => piece && blackKing
      && kingDistance(piece.square, blackKing.square) === 1
      && (!whiteKing || kingDistance(piece.square, whiteKing.square) !== 1)).length,
    get kingStepsTowardKnight() {
      return move.piece === "k" && context.kingApproachTargets.includes(move.to);
    },
    kingKnightAdjacencyPenalty: knightKingDefended ? 0 : 1,
    kingKnightDistanceScore: whiteKing && knight ? kingDistance(whiteKing.square, knight.square) : 99,
    knightDoubleOpposition: !!knight && !!doubleOppositionTargets?.includes(knight.square),
    knightFlanksBlackKing: move.piece === "n" && !!knight && !!whiteKing && !!blackKing
      && knightFlankSquares(move.from, blackKing.square, whiteKing.square).includes(knight.square),
    get knightWhiteSideOfBlackDistance() {
      if (!knight || !whiteKing || !blackKing) return 0;
      const n = squareCoordinates(knight.square), b = squareCoordinates(blackKing.square);
      const w = squareCoordinates(whiteKing.square);
      // Signed gap to the half-plane on White's side of Black; stop rewarding it once reached.
      return Math.max(0, -(n.file - b.file) * (w.file - b.file)
        - (n.rank - b.rank) * (w.rank - b.rank));
    },
    get knightDriftRank() {
      return this.knightDriftQualifies ? 0 : move.piece !== "n" ? 1 : this.knightFlanksBlackKing ? 3 : 2;
    },
    get knightDriftQualifies() {
      if (knightKingDefended) return true;
      if (move.piece !== "n" || !whiteKing || !knight || !bishop || !blackKing) return false;
      if (this.knightDoubleOpposition) return true;
      // If both opposition destinations are unavailable, take the other flank,
      // closer to White's king.
      if (blockedDoubleOpposition
        && squaredEuclideanDistance(knight.square, whiteKing.square)
          < squaredEuclideanDistance(move.from, whiteKing.square)) return true;
      const startingDistance = kingDistance(move.from, whiteKing.square);
      const resultingDistance = kingDistance(knight.square, whiteKing.square);
      // Flanks may first move away from White, but must still escape a king attack.
      const retreat = !this.knightFlanksBlackKing && resultingDistance >= startingDistance;
      const squares = allSquares();
      // Retreats need onward progress beyond the starting distance against every Black step.
      // Do not rely on bishop control to prevent a king chase.
      const attackingSteps = squares.filter(square => kingDistance(square, blackKing.square) === 1
        && kingDistance(square, whiteKing.square) > 1
        && (retreat || kingDistance(square, knight.square) === 1));
      return attackingSteps.every(black => {
        const kingCanDefend = squares.some(square => square !== bishop.square && square !== knight.square
          && kingDistance(square, whiteKing.square) === 1
          && kingDistance(square, knight.square) === 1 && kingDistance(square, black) > 1);
        const onwardOpposition = knightDoubleOppositionSquares(knight.square, black, whiteKing.square)
          ?.filter((square): square is Square => !!square
            && square !== bishop.square && square !== whiteKing.square) ?? [];
        const blocker = squareCoordinates(black), king = squareCoordinates(whiteKing.square);
        // Getting around the blocker means leaving it outside the knight–king rectangle.
        const clearsBlocker = (square: Square) => {
          const target = squareCoordinates(square);
          return blocker.file < Math.min(target.file, king.file) || blocker.file > Math.max(target.file, king.file)
            || blocker.rank < Math.min(target.rank, king.rank) || blocker.rank > Math.max(target.rank, king.rank);
        };
        const knightCanContinue = squares.some(square => square !== whiteKing.square && square !== bishop.square
          && isKnightMove(knight.square, square)
          && (this.knightFlanksBlackKing ? clearsBlocker(square)
            : kingDistance(square, whiteKing.square) < Math.min(startingDistance, resultingDistance))
          // Do not count a double-opposition escape in this legacy drift check.
          && (this.knightFlanksBlackKing || !onwardOpposition.length || onwardOpposition.includes(square)
            || kingDistance(square, whiteKing.square) === 1)
          && (kingDistance(square, black) > 1 || kingDistance(square, whiteKing.square) === 1));
        return kingCanDefend || knightCanContinue;
      });
    },
    kingBlackDistanceSquared: whiteKing && blackKing ? squaredEuclideanDistance(whiteKing.square, blackKing.square) : 99,
    bishopBlackDistanceSquared: bishop && blackKing ? squaredEuclideanDistance(bishop.square, blackKing.square) : 99,
    knightBlackDistanceSquared: knight && blackKing ? squaredEuclideanDistance(knight.square, blackKing.square) : 99,
    get knightDefensePenalty() {
      if (context.declaredKnightDefenseMove === move.from + move.to) return -1;
      if (knightKingDefended) return 0;
      const knightAttackable = context.startsWithAttackableKnight;
      const pieceAttackable = knightAttackable || context.startsWithAttackableBishop;
      if (pieceAttackable && knightBishopStablyDefended()) return 1;
      if (pieceAttackable && move.piece === "b" && knight
        && stableBishopProtectedSquares(resultFen).some(target => isKnightMove(knight.square, target))) return 1;
      if (pieceAttackable && move.piece === "n" && canBishopEstablishStableProtection(resultFen)) return 1;
      return knightAttackable ? 4 : 3;
    },
    knightCentralProximityScore: knight ? knightAndBishopCenterProximityScore(knight.square) : 999,
    get knightStableBishopProtectionPenalty() { return knightBishopStablyDefended() ? 0 : 1; },
    get knightKingProtectionDistance() { return knightKingProtectionDistance(resultFen); },
    get knightKingProximityScore() {
      return !knight || !whiteKing ? 99 : kingDistance(knight.square, whiteKing.square);
    },
    get minorCenterDistanceScore() {
      return [bishop, knight].reduce((sum, piece) => sum + (piece
        ? Math.sqrt(knightAndBishopCenterProximityScore(piece.square)) / 2 : 0), 0);
    },
    get unprotectedMinorCount() {
      return Number(context.startsWithUnprotectedBishop) + Number(context.startsWithUnprotectedKnight);
    },
    get minorBlackDistanceScore() {
      if (!blackKing) return 0;
      return -(bishop && context.startsWithUnprotectedBishop ? Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square)) : 0)
        - (knight && context.startsWithUnprotectedKnight ? Math.sqrt(squaredEuclideanDistance(knight.square, blackKing.square)) : 0);
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
    attackedBishopDistanceScore: context.shouldEscapeBishop && bishop && blackKing
      ? -squaredEuclideanDistance(bishop.square, blackKing.square) : 0,
    attackedBishopDefensePenalty: context.shouldEscapeBishop
      && !(move.piece === "b" && bishopKingDefended && whiteKing && centerDistance(whiteKing.square) === 0) ? 1 : 0,
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
    get knightMiddle16ProximityScore() {
      if (!knight) return 0;
      const { file, rank } = squareCoordinates(knight.square);
      return Math.max(2 - file, 0, file - 5) ** 2
        + Math.max(2 - rank, 0, rank - 5) ** 2;
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
    declaredPreparationPenalty: context.declaredPreparationMoves && !context.declaredPreparationMoves.includes(move.from + move.to) && !context.declaredPreparationMoves.includes(move.piece) ? 1 : 0,
    preparationBishopWaitDistance: context.declaredPreparationMoves?.includes("b") && move.piece === "b" && bishop && blackKing
      ? -squaredEuclideanDistance(bishop.square, blackKing.square) : 0,
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
      helpText: "Execute the mating net.",
      compare: (first, second) => first.matingNetPenalty - second.matingNetPenalty,
    },
    {
      id: "r2",
      shortLabel: "rule r2",
      helpText: "Lock the Black king into a 7-diagonal cage, then force Black into the mating net.",
      compare: (first, second) => first.sevenCagePenalty - second.sevenCagePenalty
        || first.kingEdgePenalty - second.kingEdgePenalty,
    },
    {
      id: "r3",
      shortLabel: "rule r3",
      helpText: "(temporary) Prefer king proximity, then bishop proximity, then knight proximity.",
      compare: (first, second) => first.kingBlackDistanceSquared - second.kingBlackDistanceSquared
        || first.bishopBlackDistanceSquared - second.bishopBlackDistanceSquared
        || first.knightBlackDistanceSquared - second.knightBlackDistanceSquared,
    },
    {
      id: "r4",
      shortLabel: "rule r4",
      helpText: "With a central king and central 16 knight, prefer king protection of the knight, maneuver the knight to a central square opposite the bishop's color, then navigate to a central bishop and the king to a central square opposite the bishop's color.",
      applies: score => score.startsWithCentralKingAndMiddle16Knight || score.declaredCentralNavigationPenalty !== undefined
        || score.protectedCentralManeuverPenalty !== undefined
        || score.startsWithProtectedOppositeCentralKnight,
      compare: (first, second) => (first.declaredCentralNavigationPenalty ?? 0) - (second.declaredCentralNavigationPenalty ?? 0)
        || (first.protectedCentralManeuverPenalty ?? 0) - (second.protectedCentralManeuverPenalty ?? 0)
        || first.centralSetupBoundaryPenalty - second.centralSetupBoundaryPenalty
        || first.kingKnightAdjacencyPenalty - second.kingKnightAdjacencyPenalty
        || first.knightOppositeCentralDistance - second.knightOppositeCentralDistance
        || first.bishopKingCentralCompletionPenalty - second.bishopKingCentralCompletionPenalty
        || first.bishopKingCentralNavigationScore - second.bishopKingCentralNavigationScore,
    },
    {
      id: "r4.1",
      shortLabel: "rule r4.1",
      helpText: "Escape rare degenerate positions.",
      compare: (first, second) => first.rareEscapePenalty - second.rareEscapePenalty,
    },
    {
      id: "r4.5",
      shortLabel: "rule r4.5",
      helpText: "Step the king towards the knight without screening the bishop.",
      compare: (first, second) => Number(second.kingStepsTowardKnight) - Number(first.kingStepsTowardKnight),
    },
    {
      id: "r4.6",
      shortLabel: "rule r4.6",
      helpText: "Prefer the king to defend the knight. Otherwise, drift a protective stable bishop when a piece is attackable.",
      compare: (first, second) => first.knightDefensePenalty - second.knightDefensePenalty,
    },
    {
      id: "r4.7",
      shortLabel: "rule r4.7",
      helpText: "Prefer knight proximity to the White king, then proximity to the center.",
      compare: (first, second) => first.knightKingProximityScore - second.knightKingProximityScore
        || first.knightCentralProximityScore - second.knightCentralProximityScore,
    },
    {
      id: "r6",
      shortLabel: "rule r6",
      helpText: "When Black’s king prevents approach of the center, navigate the bishop to open a path.",
      compare: (first, second) => first.bishopCentralPathDistance - second.bishopCentralPathDistance,
    },
    {
      id: "r7",
      shortLabel: "rule r7",
      helpText: "Prefer king central proximity.",
      compare: (first, second) => first.kingCenterEuclideanScore - second.kingCenterEuclideanScore,
    },
    {
      id: "r20",
      shortLabel: "rule r20",
      helpText: "Maximize unprotected piece distance from Black's king, then prefer central proximity.",
      compare: (first, second) => first.unprotectedMinorCount - second.unprotectedMinorCount
        || first.minorBlackDistanceScore - second.minorBlackDistanceScore
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
  noteBoards: [{
    id: "bishop-knight-rule-r1-net",
    title: "rule r1 — Execute the mating net",
    caption: "The declared line from Kc3, Ba2, Nc2 and Black Kd1 through Bf3#. Prefer the full destination positions, with later destinations taking priority. D4 rotations and reflections apply; move counters are ignored.",
    animationSrc: "/mate/bishop-knight/r1-mating-net.gif",
    animationAlt: "All 29 plies of the declared bishop-and-knight mating net, ending in Bf3 checkmate.",
    pieces: [{square: "c3", piece: "K"}, {square: "a2", piece: "B"}, {square: "c2", piece: "N"}, {square: "d1", piece: "k"}],
    highlights: [],
  }, {
    id: "bishop-knight-rule-r41-a",
    title: "rule r4.1(a) — Bring the bishop beside the knight",
    caption: "White’s edge king is edge-adjacent to its edge bishop. Black opposes the bishop inward from the edge. The knight is three diagonal steps away, on the side away from White’s king. Play Bc4, adjacent to Nd3. Rotations and reflections apply.",
    pieces: [{square: "a7", piece: "K"}, {square: "a6", piece: "B"}, {square: "c6", piece: "k"}, {square: "d3", piece: "N"}],
    highlights: [{square: "c4", kind: "key"}],
    arrows: [{from: "a6", to: "c4"}],
  }, {
    id: "bishop-knight-rule-r41-b",
    title: "rule r4.1(b) — Nf5",
    caption: "With Ka1, Bb1 and Nd4, play Nf5 regardless of Black’s king position. Avoid recreating this White formation. Apply D4 rotations and reflections only; ignore move counters.",
    pieces: [{square: "a1", piece: "K"}, {square: "b1", piece: "B"}, {square: "d4", piece: "N"}, {square: "c4", piece: "k"}],
    highlights: [{square: "f5", kind: "key"}],
    arrows: [{from: "d4", to: "f5"}],
  }, {
    id: "bishop-knight-rule-r41-c",
    title: "rule r4.1(c) — Ke1",
    caption: "Exact arrangement: Kf1, Bh1, Nf2 and Black Ke3. Play Ke1. Apply D4 rotations and reflections only; ignore move counters.",
    pieces: [{square: "f1", piece: "K"}, {square: "h1", piece: "B"}, {square: "f2", piece: "N"}, {square: "e3", piece: "k"}],
    highlights: [{square: "e1", kind: "key"}],
    arrows: [{from: "f1", to: "e1"}],
  }, {
    id: "bishop-knight-rule-r41-d",
    title: "rule r4.1(d) — Bc4",
    caption: "Exact arrangement: Ke2, Bd3, Ne3 and Black Kd4. Play Bc4. Apply D4 rotations and reflections only; ignore move counters.",
    pieces: [{square: "e2", piece: "K"}, {square: "d3", piece: "B"}, {square: "e3", piece: "N"}, {square: "d4", piece: "k"}],
    highlights: [{square: "c4", kind: "key"}],
    arrows: [{from: "d3", to: "c4"}],
  }, {
    id: "bishop-knight-rule-r6-step",
    title: "rule r6 — Open a path",
    caption: "Black blocks Kc4 while White keeps Nc3 protected. Be4+ puts the bishop on a diagonal controlling Black’s blocking square d3. Apply rotations and reflections; earlier priorities still apply.",
    pieces: [{square: "b4", piece: "K"}, {square: "c3", piece: "N"}, {square: "d3", piece: "k"}, {square: "h1", piece: "B"}],
    highlights: [{square: "c4", kind: "key"}],
    arrows: [{from: "h1", to: "e4"}],
  }],
  notes: [
    "For r4.6, the exact placement White Kb5, Ba6, Nb4 and Black Kb8 or Ka7 prefers Kc5, including rotations and reflections. This is a starting-position exception, not a general preference for advancing the defending king.",
    "For r6, check whether Black blocks every more-central king step, retaining existing king protection of the knight. Route the bishop toward control of a same-color blocking or shuffling square. Use static bishop routes with occupied squares and safe landings; do not claim a forced advance against every reply. Once a central king step is available, r6 is inactive.",
    "For r4.6, prefer king protection of the knight. Attackability is checked before White moves: a piece must not be king-defended, and Black must already attack it or have a legal move that attacks it. When either piece is attackable, existing or newly established stable bishop protection counts regardless of which piece moves. Either a bishop move preparing a knight jump or a knight move preparing a bishop move can set up stable protection next turn; setup and established protection are equally preferred. An initially attackable knight left without protection or a protection setup ranks below ordinary moves. Stable bishop protection includes squares adjacent to edge bishops and respects White king blockers. For r4.7, prefer knight king-step proximity to White’s king, then Euclidean proximity to the center, regardless of square color.",
    "For r7, minimize White’s king Euclidean distance to the nearest of d4, e4, d5 or e5. For r20, identify unprotected minor pieces before White moves, then maximize their resulting Euclidean distance from Black’s king. Finally minimize the sum of both minor pieces’ resulting Euclidean distances to the board’s midpoint.",
    "Support has been reset. No position is supported until explicitly declared under the new rules; all earlier support declarations and r2.5 preferences have been discarded.",
  ],
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
