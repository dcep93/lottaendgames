import { knightAndBishopShuffleTargets } from "./bishopKnightShuffle";
import { knightAndBishopPrecageSideTarget, type PrecageSideTarget } from "./bishopKnightPrecageSide";
import { stableBishopProtectionDistance, stableBishopProtectedSquares } from "./bishopKnightStableProtection";
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
import { bishopControlsOrOccupiesSquare, bishopLongDiagonalIntersection, centerDistance, isMiddle16Square } from "./bishopKnightGeometry";
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
  readonly sixPointNinePenalty: number;
  readonly declaredStepPenalty: number;
  readonly relativeKnightPenalty: number;
  readonly startsWithMiddle16King: boolean;
  readonly startsWithCentralKingAndMiddle16Knight: boolean;
  readonly centralSetupBoundaryPenalty: number;
  readonly bishopCenterPenalty: number;
  readonly knightOppositeCentralDistance: number;
  readonly bishopCentralProximityScore: number;
  readonly startsWithBishopAdjacentToNoncentralKing: boolean;
  readonly bishopWhiteKingDistanceScore: number;
  readonly bishopMoveNearNoncentralKingPenalty: number;
  readonly immobileBishopPenalty: number;
  readonly bishopKingCentralNavigationScore: number;
  readonly bishopShuffleControlPenalty: number;
  readonly minorBlackDistanceScore: number;
  readonly unprotectedMinorCount: number;
  readonly minorCenterDistanceScore: number;
  readonly attackedMinorWithoutKingDefensePenalty: number;
  readonly knightKingProtectionDistance: number;
  readonly knightKingProximityScore: number;
  readonly knightStableBishopProtectionPenalty: number;
  readonly kingKnightAdjacencyPenalty: number;
  readonly kingKnightDistanceScore: number;
  readonly knightDriftQualifies: boolean;
  readonly knightDriftRank: number;
  readonly knightDoubleOpposition: boolean;
  readonly knightFlanksBlackKing: boolean;
  readonly knightWhiteSideOfBlackDistance: number;
  readonly kingApproachesKnightWithoutLeavingCenter: boolean;
  readonly kingBlackDistanceSquared: number;
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

type KnightAndBishopPositionScoreContext = {
  readonly kingKnightDistance: number;
  readonly kingCenterEuclidean: number;
  readonly knightOppositeCentralTargets: readonly Square[];
  readonly bishopShuffleTargets: readonly Square[];
  readonly startsWithUnprotectedBishop: boolean;
  readonly startsWithBishopAdjacentToNoncentralKing: boolean;
  readonly startsWithUnprotectedKnight: boolean;
  readonly sixPointNineMove: string | undefined;
  readonly fivePointFiveMove: string | undefined;
  readonly relativeKnightMove: string | undefined;
  readonly startsWithMiddle16King: boolean;
  readonly startsWithCentralKingAndMiddle16Knight: boolean;
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
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const centralKing = !!whiteKing && centerDistance(whiteKing.square) === 0;
  const bishop = findPiece(fen, "w", "b");
  const knight = findPiece(fen, "w", "n");
  const bishopCentrallyDefended = !!bishop && centralKing && kingDistance(whiteKing.square, bishop.square) === 1;
  const knightCentrallyDefended = !!knight && centralKing && kingDistance(whiteKing.square, knight.square) === 1;
  let unprotectedKnight: boolean | undefined;
  return {
    kingKnightDistance: whiteKing && knight ? kingDistance(whiteKing.square, knight.square) : 99,
    kingCenterEuclidean: knightAndBishopKingCenterEuclideanScore(fen),
    knightOppositeCentralTargets: (["d4", "e4", "d5", "e5"] as const).filter(target =>
      bishop && target !== whiteKing?.square && squareColor(target) !== squareColor(bishop.square)),
    bishopShuffleTargets: knightAndBishopShuffleTargets(fen),
    startsWithBishopAdjacentToNoncentralKing: !!whiteKing && !!bishop && !centralKing
      && kingDistance(whiteKing.square, bishop.square) === 1,
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
  let immobileBishopPenalty: number | undefined;
  const knight = findPiece(resultFen, "w", "n");
  const blackKing = findPiece(resultFen, "b", "k");
  const bishopInClutterRectangle = (() => {
    if (!bishop || !whiteKing || !knight) return false;
    const b = squareCoordinates(bishop.square), k = squareCoordinates(whiteKing.square);
    const n = squareCoordinates(knight.square);
    return b.file >= Math.min(k.file, n.file, 3) && b.file <= Math.max(k.file, n.file, 4)
      && b.rank >= Math.min(k.rank, n.rank, 3) && b.rank <= Math.max(k.rank, n.rank, 4);
  })();
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
    get bishopShuffleControlPenalty() {
      return context.bishopShuffleTargets.length && !context.bishopShuffleTargets.some(target =>
        bishop && bishop.square !== target && bishopControlsOrOccupiesSquare(resultFen, bishop.square, target)) ? 1 : 0;
    },
    get kingCoordinationPenalty() {
      return context.shouldCoordinateKing
        && !(move.piece === "k" && knightAndBishopKingCoordinatesMinors(resultFen)) ? 1 : 0;
    },
    sixPointNinePenalty: context.sixPointNineMove && context.sixPointNineMove !== move.from + move.to ? 1 : 0,
    declaredStepPenalty: context.fivePointFiveMove && context.fivePointFiveMove !== move.from + move.to ? 1 : 0,
    relativeKnightPenalty: context.relativeKnightMove && context.relativeKnightMove !== move.from + move.to ? 1 : 0,
    startsWithMiddle16King: context.startsWithMiddle16King,
    startsWithCentralKingAndMiddle16Knight: context.startsWithCentralKingAndMiddle16Knight,
    centralSetupBoundaryPenalty: whiteKing && knight && centerDistance(whiteKing.square) === 0
      && isMiddle16Square(knight.square) ? 0 : 1,
    get knightOppositeCentralDistance() {
      if (!knight || !bishop) return 99;
      const targets = context.knightOppositeCentralTargets.filter(target => target !== whiteKing?.square);
      return targets.length ? Math.min(...targets.map(target => knightMoveDistance(knight.square, target))) : 99;
    },
    get bishopKingCentralNavigationScore() {
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
    bishopWhiteKingDistanceScore: bishopInClutterRectangle && context.startsWithBishopAdjacentToNoncentralKing && bishop && whiteKing
      ? 98 - squaredEuclideanDistance(bishop.square, whiteKing.square) : 0,
    bishopCentralProximityScore: bishop ? knightAndBishopCenterProximityScore(bishop.square) : 99,
    bishopCenterPenalty: bishop && centerDistance(bishop.square) === 0 ? 0 : 1,
    attackedMinorWithoutKingDefensePenalty: [bishop, knight].filter(piece => piece && blackKing
      && kingDistance(piece.square, blackKing.square) === 1
      && (!whiteKing || kingDistance(piece.square, whiteKing.square) !== 1)).length,
    get kingApproachesKnightWithoutLeavingCenter() {
      return move.piece === "k" && !!whiteKing && !!knight
        && kingDistance(whiteKing.square, knight.square) < context.kingKnightDistance
        && this.kingCenterEuclideanScore <= context.kingCenterEuclidean;
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
      const n = squareCoordinates(move.from), b = squareCoordinates(blackKing.square);
      const w = squareCoordinates(whiteKing.square);
      const blackBetween = b.file > Math.min(n.file, w.file) && b.file < Math.max(n.file, w.file)
        && b.rank > Math.min(n.rank, w.rank) && b.rank < Math.max(n.rank, w.rank);
      if (blackBetween && kingDistance(knight.square, blackKing.square) < 3
        && kingDistance(knight.square, blackKing.square) < kingDistance(move.from, blackKing.square)) return false;
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
        const knightCanContinue = squares.some(square => square !== whiteKing.square && square !== bishop.square
          && isKnightMove(knight.square, square)
          && kingDistance(square, whiteKing.square) < (this.knightFlanksBlackKing
            ? resultingDistance : Math.min(startingDistance, resultingDistance))
          // Do not count an escape that r6 would outrank with double opposition.
          && (this.knightFlanksBlackKing || !onwardOpposition.length || onwardOpposition.includes(square)
            || kingDistance(square, whiteKing.square) === 1)
          && (kingDistance(square, black) > 1 || kingDistance(square, whiteKing.square) === 1));
        return kingCanDefend || knightCanContinue;
      });
    },
    kingBlackDistanceSquared: whiteKing && blackKing ? squaredEuclideanDistance(whiteKing.square, blackKing.square) : 99,
    get knightStableBishopProtectionPenalty() { return knightBishopStablyDefended() ? 0 : 1; },
    get knightKingProtectionDistance() { return knightKingProtectionDistance(resultFen); },
    get knightKingProximityScore() {
      return !knight || !whiteKing ? 99 : knightKingDefended ? 0
        : squaredEuclideanDistance(knight.square, whiteKing.square);
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
      id: "r4",
      shortLabel: "rule r4",
      helpText: "With a central king and central 16 knight, then prefer king protection of the knight, maneuver the knight to a central square opposite the bishop's color, then navigate to a central bishop and the king to a central square opposite the bishop's color.",
      applies: score => score.startsWithCentralKingAndMiddle16Knight,
      compare: (first, second) => first.centralSetupBoundaryPenalty - second.centralSetupBoundaryPenalty
        || first.kingKnightAdjacencyPenalty - second.kingKnightAdjacencyPenalty
        || first.knightOppositeCentralDistance - second.knightOppositeCentralDistance
        || first.bishopKingCentralNavigationScore - second.bishopKingCentralNavigationScore,
    },
    {
      id: "r4.5",
      shortLabel: "rule r4.5",
      helpText: "Prefer an uncluttered bishop.",
      compare: (first, second) => first.immobileBishopPenalty - second.immobileBishopPenalty
        || first.bishopMoveNearNoncentralKingPenalty - second.bishopMoveNearNoncentralKingPenalty
        || first.bishopWhiteKingDistanceScore - second.bishopWhiteKingDistanceScore,
    },
    {
      id: "r5",
      shortLabel: "rule r5",
      helpText: "Play the r5 move.",
      compare: (first, second) => first.declaredPreparationPenalty - second.declaredPreparationPenalty
        || first.preparationBishopWaitDistance - second.preparationBishopWaitDistance,
    },
    {
      id: "r5.5",
      shortLabel: "rule r5.5",
      helpText: "Prefer an attacked piece to be defended by the king.",
      compare: (first, second) => first.attackedMinorWithoutKingDefensePenalty - second.attackedMinorWithoutKingDefensePenalty,
    },
    {
      id: "r6",
      shortLabel: "rule r6",
      helpText: "Drift the knight towards king protection, then prefer knight central 16 proximity.",
      subpriorities: [{
        compare: (first, second) => Number(second.kingApproachesKnightWithoutLeavingCenter)
          - Number(first.kingApproachesKnightWithoutLeavingCenter),
      }, {
        when: scores => !scores.some(score => score.kingApproachesKnightWithoutLeavingCenter),
        compare: (first, second) => first.knightDriftRank - second.knightDriftRank
        || (first.knightDriftQualifies && second.knightDriftQualifies
          ? first.kingKnightAdjacencyPenalty - second.kingKnightAdjacencyPenalty
            || Number(second.knightFlanksBlackKing) - Number(first.knightFlanksBlackKing)
            || Number(second.knightDoubleOpposition) - Number(first.knightDoubleOpposition)
            || (first.knightFlanksBlackKing && second.knightFlanksBlackKing ? 0
              : first.knightWhiteSideOfBlackDistance - second.knightWhiteSideOfBlackDistance
                || first.knightKingProximityScore - second.knightKingProximityScore)
            || first.knightMiddle16ProximityScore - second.knightMiddle16ProximityScore : 0),
      }],
    },
    {
      id: "r7",
      shortLabel: "rule r7",
      helpText: "Prefer king step proximity to the knight, then king central proximity.",
      subpriorities: [{
        // Let r6 route around a diagonal Black king before demanding proximity.
        when: scores => !scores.some(score => score.knightDoubleOpposition),
        compare: (first, second) => first.kingKnightDistanceScore - second.kingKnightDistanceScore
          || first.kingCenterEuclideanScore - second.kingCenterEuclideanScore,
      }],
    },
    {
      id: "r8",
      shortLabel: "rule r8",
      helpText: "With the kings in opposition or a knight's move apart, and the black king more central than the white king, and the knight between the kings, use the bishop to control black's more central shuffling square.",
      compare: (first, second) => first.bishopShuffleControlPenalty - second.bishopShuffleControlPenalty,
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
  notes: [
    "For r8, White’s king must be on files c–f and ranks 3–6 before moving. Evaluate the bishop and knight preferences after White moves. Precage squares require a central bishop and must lie strictly opposite Black across the bishop’s long diagonal. For a light-squared bishop, select the opposite-side pair from c4, d3, e6 and f5; include board symmetries. No targets exist when Black is on the long diagonal. Bishop adjacency is not required.",
    "For r7, minimize White’s king step distance to the knight, then its Euclidean distance to the nearest of d4, e4, d5 or e5. For r20, identify unprotected minor pieces before White moves, then maximize their resulting Euclidean distance from Black’s king. Finally minimize the sum of both minor pieces’ resulting Euclidean distances to the board’s midpoint.",
    "The target corner is the bishop-colored corner closest to Black's king.",
    "Support has been reset. No position is supported until explicitly declared under the new rules; all earlier support declarations and r2.5 preferences have been discarded.",
  ],
  noteBoards: [{
    id: "bishop-knight-rule-r5-hop",
    title: "rule r5 — Play the r5 move",
    caption: "Ne1 clears the way for Kd2. The bishop may be elsewhere.",
    pieces: [{square: "d1", piece: "K"}, {square: "c2", piece: "N"}, {square: "c3", piece: "k"}, {square: "a8", piece: "B"}],
    highlights: [{square: "d2", kind: "key"}],
    arrows: [{from: "c2", to: "e1"}, {from: "d1", to: "d2"}],
  }, {
    id: "bishop-knight-rule-r5-opposition",
    title: "rule r5 — Check, then advance",
    caption: "Nd1+ prepares Kd2. If Black blocks d2, wait with the bishop as far from Black as possible.",
    pieces: [{square: "c1", piece: "K"}, {square: "b2", piece: "N"}, {square: "c3", piece: "k"}, {square: "e8", piece: "B"}],
    highlights: [{square: "d2", kind: "key"}],
    arrows: [{from: "b2", to: "d1"}, {from: "c1", to: "d2"}],
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
