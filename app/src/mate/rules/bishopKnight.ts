import { fiveDiagonalPressureScore } from './bishopKnightFivePressure';
import { sevenDiagonalPressureContext, sevenDiagonalPressureScore } from './bishopKnightSevenPressure';
import { knightAndBishopShouldCheckThreeDiagonal, knightAndBishopSupportedDiagonal, knightAndBishopThreeDiagonalKingProximity } from "./bishopKnightDiagonalSupport";
import { getKnightAndBishopPreparationMoves } from "./bishopKnightSolidify";
import type { Square } from "chess.js";
import {
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  manhattanDistance,
  squareColor,
  squaredEuclideanDistance,
} from "../chess";
import {
  applyUniversalBlackPriorities,
  BLACK_CAPTURE_PRIORITY,
  BLACK_RETURN_PRIORITY,
} from "./blackPriorities";
import { centerDistance } from "./bishopKnightGeometry";
import { knightAndBishopTargetCorners, knightAndBishopTargetCornerDiagonals, knightAndBishopCentralKingTargets, knightAndBishopCornerKnightTarget, knightAndBishopKingCornerProximity, knightAndBishopKnightProximityToSquare } from "./bishopKnightStrategy";
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
} from "./bishopKnightLookup";
import { knightAndBishopKingCenterProximityScore, knightAndBishopBishopCenterProximityScore, knightAndBishopKnightTargetProximityScore } from "./bishopKnightStrategy";
import { compareScoresByRules, selectIdealMoves } from "./selection";
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from "./types";

export type KnightAndBishopWhiteMoveScore = {
  readonly preparationScore: number;
  readonly supportedThreeCheckScore: number;
  readonly supportedDiagonalSizeScore: number;
  readonly supportedDiagonalKnightScore: number;
  readonly threeDiagonalKingProximityScore: number;
  readonly fiveDiagonalKingScore: number;
  readonly fiveDiagonalSevenSupportKingScore: number;
  readonly fiveDiagonalBishopScore: number;
  readonly fiveDiagonalApproachScore: number | null;
  readonly forceCornerKingProximityScore: number;
  readonly cornerPressureScore: number;
  readonly cornerPressureBishopScore: number;
  readonly mateScore: number;
  readonly stalemateScore: number;
  readonly pieceSafetyScore: number;
  readonly kingCenterProximityScore: number;
  readonly bishopCenterProximityScore: number;
  readonly bishopBlackKingProximityScore: number;
  readonly knightTargetProximityScore: number;
  readonly knightBlackKingDistanceScore: number;
  readonly whitePiecesKingProximityScore: number;
  readonly centralKingTargetScore: number;
  readonly cornerKnightProximityScore: number;
  readonly cornerKingProximityScore: number;
  readonly bishopCornerDiagonalScore: number;
  readonly kingBishopSeparationScore: number;
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
  readonly shouldCheckThreeDiagonal: boolean;
  readonly sevenPressure: ReturnType<typeof sevenDiagonalPressureContext>;
  readonly preparationMoves: readonly string[];
  readonly centralKingTargets: readonly Square[];
  readonly cornerKnightTarget: Square | undefined;
  readonly cornerBishopSquares: ReadonlySet<Square>;
};

function whiteScoringContext(fen: string): KnightAndBishopPositionScoreContext {
  const cornerKnightTarget = knightAndBishopCornerKnightTarget(fen);
  let shouldCheckThreeDiagonal: boolean | undefined;
  return {
    get shouldCheckThreeDiagonal() { return shouldCheckThreeDiagonal ??= knightAndBishopShouldCheckThreeDiagonal(fen); },
    sevenPressure: sevenDiagonalPressureContext(fen),
    preparationMoves: getKnightAndBishopPreparationMoves(fen),
    centralKingTargets: knightAndBishopCentralKingTargets(fen),
    cornerKnightTarget,
    cornerBishopSquares: new Set(cornerKnightTarget ? knightAndBishopTargetCornerDiagonals(fen).flat() : []),
  };
}

function scoreKnightAndBishopWhiteMoveCore(
  fen: string,
  san: string,
  context: KnightAndBishopPositionScoreContext,
): KnightAndBishopWhiteMoveScore {
  const chess = getChess(fen);
  chess.move(san);
  const resultFen = chess.fen();
  const blackReplies = chess.moves({ verbose: true });
  const givesCheck = chess.isCheck();
  const checkmate = givesCheck && blackReplies.length === 0;
  const whiteKing = findPiece(resultFen, "w", "k");
  const bishop = findPiece(resultFen, "w", "b");
  let bishopCenterProximity: number | undefined;
  let bishopBlackKingProximity: number | undefined;
  let kingCenterProximity: number | undefined;
  let knightTargetProximity: number | undefined;
  let knightBlackKingDistance: number | undefined;
  let whitePiecesKingProximity: number | undefined;
  let centralKingTarget: number | undefined;
  let cornerKnightProximity: number | undefined;
  let cornerKingProximity: number | undefined;
  let kingBishopSeparation: number | undefined;
  let fivePressure: ReturnType<typeof fiveDiagonalPressureScore> | undefined;
  let supportedDiagonal: ReturnType<typeof knightAndBishopSupportedDiagonal> | undefined;
  let threeDiagonalKingProximity: number | undefined;
  return {
    get supportedThreeCheckScore() { return context.shouldCheckThreeDiagonal && !givesCheck ? 1 : 0; },
    get supportedDiagonalSizeScore() { return (supportedDiagonal ??= knightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to))).size; },
    get supportedDiagonalKnightScore() { return (supportedDiagonal ??= knightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to))).knight; },
    get threeDiagonalKingProximityScore() { return threeDiagonalKingProximity ??= knightAndBishopThreeDiagonalKingProximity(resultFen); },
    get fiveDiagonalKingScore() { return (fivePressure ??= fiveDiagonalPressureScore(resultFen)).king; },
    get fiveDiagonalSevenSupportKingScore() { return (fivePressure ??= fiveDiagonalPressureScore(resultFen)).sevenSupportKingProximity; },
    get fiveDiagonalBishopScore() { return (fivePressure ??= fiveDiagonalPressureScore(resultFen)).bishop; },
    get forceCornerKingProximityScore() {
      if (!whiteKing || (supportedDiagonal ??= knightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to))).size === 99) return 0;
      const corners = knightAndBishopTargetCorners(resultFen);
      return corners.length ? Math.min(...corners.map(corner => squaredEuclideanDistance(whiteKing.square, corner))) : 0;
    },
    get fiveDiagonalApproachScore() { return (fivePressure ??= fiveDiagonalPressureScore(resultFen)).approach; },
    get cornerPressureScore() { return sevenDiagonalPressureScore(resultFen, context.sevenPressure); },
    cornerPressureBishopScore: context.sevenPressure.length === 0 ||
      context.sevenPressure.some(pattern => bishop?.square === pattern.bishopTarget) ? 0 :
      context.sevenPressure.some(pattern => bishop?.square === pattern.secondBishopTarget) ? 1 : 2,
    preparationScore: context.preparationMoves.length === 0 || context.preparationMoves.includes(san) ? 0 : 1,
    mateScore: checkmate ? 0 : 1,
    stalemateScore: !checkmate && blackReplies.length === 0 ? 1 : 0,
    pieceSafetyScore: !knightAndBishopPiecesPresent(resultFen) || blackReplies.some(({ captured }) => captured === "b" || captured === "n") ? 1 : 0,
    get bishopCornerDiagonalScore() {
      return !context.cornerKnightTarget || (bishop && context.cornerBishopSquares.has(bishop.square)) ? 0 : 1;
    },
    get cornerKingProximityScore() {
      return cornerKingProximity ??= context.cornerKnightTarget
        ? knightAndBishopKingCornerProximity(resultFen, context.cornerKnightTarget) : 0;
    },
    get cornerKnightProximityScore() {
      return cornerKnightProximity ??= context.cornerKnightTarget
        ? knightAndBishopKnightProximityToSquare(resultFen, context.cornerKnightTarget) : 0;
    },
    get centralKingTargetScore() {
      return centralKingTarget ??= context.centralKingTargets.length === 0 ? 0 : whiteKing
        ? Math.min(...context.centralKingTargets.map(target => squaredEuclideanDistance(whiteKing.square, target))) : 99;
    },
    get kingBishopSeparationScore() {
      return kingBishopSeparation ??= context.centralKingTargets.length > 0 && whiteKing && bishop
        ? -squaredEuclideanDistance(whiteKing.square, bishop.square) : 0;
    },
    get bishopCenterProximityScore() {
      return bishopCenterProximity ??= knightAndBishopBishopCenterProximityScore(resultFen);
    },
    get bishopBlackKingProximityScore() {
      if (bishop && centerDistance(bishop.square) === 0) return 0;
      const blackKing = findPiece(resultFen, "b", "k");
      return bishopBlackKingProximity ??= bishop && blackKing
        ? squaredEuclideanDistance(bishop.square, blackKing.square) : 99;
    },
    get knightTargetProximityScore() {
      return knightTargetProximity ??= knightAndBishopKnightTargetProximityScore(resultFen);
    },
    get knightBlackKingDistanceScore() {
      if (knightBlackKingDistance !== undefined) return knightBlackKingDistance;
      const knight = findPiece(resultFen, "w", "n");
      const blackKing = findPiece(resultFen, "b", "k");
      return knightBlackKingDistance = knight && blackKing
        ? -squaredEuclideanDistance(knight.square, blackKing.square) : 0;
    },
    get kingCenterProximityScore() {
      return kingCenterProximity ??= knightAndBishopKingCenterProximityScore(resultFen);
    },
    get whitePiecesKingProximityScore() {
      if (whitePiecesKingProximity !== undefined) return whitePiecesKingProximity;
      const knight = findPiece(resultFen, "w", "n");
      return whitePiecesKingProximity = whiteKing && bishop && knight
        ? Math.sqrt(squaredEuclideanDistance(bishop.square, whiteKing.square)) +
          Math.sqrt(squaredEuclideanDistance(knight.square, whiteKing.square)) : 99;
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
      helpText: "With the knight on its support square, prefer forcing the Black king towards the target corner.",
      subpriorities: [
        { compare: (first, second) => first.threeDiagonalKingProximityScore - second.threeDiagonalKingProximityScore },
        { compare: (first, second) => first.fiveDiagonalSevenSupportKingScore - second.fiveDiagonalSevenSupportKingScore },
        { compare: (first, second) => first.fiveDiagonalBishopScore - second.fiveDiagonalBishopScore },
        { compare: (first, second) => {
          const a = first.fiveDiagonalApproachScore;
          const b = second.fiveDiagonalApproachScore;
          return a === null ? (b === null ? 0 : 1) : b === null ? -1 : a - b;
        } },
        { compare: (first, second) => first.fiveDiagonalKingScore - second.fiveDiagonalKingScore },
        { compare: (first, second) => first.cornerPressureScore - second.cornerPressureScore },
        { compare: (first, second) => first.cornerPressureBishopScore - second.cornerPressureBishopScore },
        { compare: (first, second) => first.forceCornerKingProximityScore - second.forceCornerKingProximityScore },
      ],
    },
    {
      id: "r3.8",
      shortLabel: "rule r3.8",
      helpText: "Prepare the 7-diagonal. With the Black king one edge square from an opposite-colored corner, the knight diagonally adjacent and off the edge, and the bishop x-raying Black's king through the knight: place White's king in non-edge opposition.",
      compare: (first, second) => first.preparationScore - second.preparationScore,
    },
    {
      id: "r4",
      shortLabel: "rule r4",
      helpText: "With the Black king within 1 edge move from the non-target corner, prefer White king proximity to 2 squares diagonally away from that corner, then prefer knight move proximity to Black's corner, then prefer the bishop along the length 7 diagonal closer to the target corner.",
      subpriorities: [
        { compare: (first, second) => first.cornerKingProximityScore - second.cornerKingProximityScore },
        { compare: (first, second) => first.cornerKnightProximityScore - second.cornerKnightProximityScore },
        { compare: (first, second) => first.bishopCornerDiagonalScore - second.bishopCornerDiagonalScore },
      ],
    },
    {
      id: "r8",
      shortLabel: "rule r8",
      helpText: "With a central bishop and central knight on the bishop's color, prefer king proximity to the square a knight's move from each piece and closer to Black's king, then prefer king distance from the bishop.",
      subpriorities: [
        { compare: (first, second) => first.centralKingTargetScore - second.centralKingTargetScore },
        { compare: (first, second) => first.kingBishopSeparationScore - second.kingBishopSeparationScore },
      ],
    },
    {
      id: "r10",
      shortLabel: "rule r10",
      helpText: "Prefer king Euclidean proximity to the center, then bishop proximity to the center, then non-central bishop proximity to Black's king, then knight move proximity to the central square diagonally adjacent to the central bishop, then knight distance from Black, then white piece proximity to White's king.",
      subpriorities: [
        { compare: (first, second) => first.kingCenterProximityScore - second.kingCenterProximityScore },
        { compare: (first, second) => first.bishopCenterProximityScore - second.bishopCenterProximityScore },
        { compare: (first, second) => first.bishopBlackKingProximityScore - second.bishopBlackKingProximityScore },
        { compare: (first, second) => first.knightTargetProximityScore - second.knightTargetProximityScore },
        { compare: (first, second) => first.knightBlackKingDistanceScore - second.knightBlackKingDistanceScore },
        { compare: (first, second) => first.whitePiecesKingProximityScore - second.whitePiecesKingProximityScore },
      ],
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
    "The target corner is the bishop-colored corner closest to Black's king.",
    "With the bishop on a6 or c8, the three-diagonal is supported by Nd5 with White’s king adjacent to a square on a6–c8, or by White’s king a knight’s move from a8. With Kc7, the knight targets b5/c6 to attack a7; with Kb6, it targets c6/d7 to attack b8. Evaluate after White moves; reflections apply.",
    "The a4–e8 five-diagonal is supported with Ba4 and either Nd3 with White’s king on d6/d7/e6/e7, or a knight within one move of d5 when Black has no legal reply to e7/c7/b6/a5. With Nd5, the bishop may be anywhere on a4–e8 provided Black has no legal reply onto a3–f8. Evaluate after White moves; reflections apply.",
    "The a2–g8 seven-diagonal is supported with White’s king within one king step of f7 and the knight on d3, or one move away if Black cannot move to a3, b4, c5 or d6. Evaluate after White moves; reflections apply.",
  ],
  noteBoards: [{
    id: "bishop-knight-solidify-seven-diagonal",
    title: "rule r3.8 — Prepare the 7-diagonal",
    caption: "1. Kg6 Kf8",
    animationSrc: "/mate/bishop-knight/solidify-seven-diagonal.gif",
    animationAlt: "Kg6 takes opposition with a2–g8 highlighted.",
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
