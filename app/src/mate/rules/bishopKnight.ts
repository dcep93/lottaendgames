import { knightAndBishopShouldCheckThreeDiagonal, knightAndBishopSupportedDiagonal } from "./bishopKnightDiagonalSupport";
import type { Square } from "chess.js";
import {
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
import { centerDistance } from "./bishopKnightGeometry";
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  getKnightAndBishopPhaseAfterWhiteMove,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
} from "./bishopKnightLookup";
import { knightAndBishopKingCenterProximityScore, knightAndBishopKnightTargetSquares, knightAndBishopKnightTargetProximityScore, knightAndBishopKnightBehindKingProximityScore } from "./bishopKnightStrategy";
import { knightAndBishopDeclaredCornerFlushMove } from "./bishopKnightCornerFlush";
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
  readonly precageKnightPlacementPenalty: number;
  readonly precageKingEdgePenalty: number;
  readonly precageKingProximityScore: number;
  readonly precageKingNonTargetCornerScore: number;
  readonly declaredCornerFlushPenalty: number;
  readonly declaredPreparationPenalty: number;
  readonly attackedBishopDefendedKnightPenalty: number;
  readonly bishopEscapeProtectedCenterPenalty: number;
  readonly bishopEscapeDistanceScore: number;
  readonly supportedThreeCheckScore: number;
  readonly supportedDiagonalSizeScore: number;
  readonly supportedDiagonalKnightScore: number;
  readonly mateScore: number;
  readonly stalemateScore: number;
  readonly pieceSafetyScore: number;
  readonly kingCenterProximityScore: number;
  readonly kingBishopColorPenalty: number;
  readonly kingBlackProximityScore: number;
  readonly bishopLongDiagonalPenalty: number;
  readonly bishopProtectedCenterPenalty: number;
  readonly knightTargetProximityScore: number;
  readonly knightBehindKingProximityScore: number;
  readonly minorPiecesBlackKingDistanceScore: number;
  readonly minorPiecesCenterProximityScore: number;
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
  readonly shouldCoordinateKing: boolean;
  readonly declaredCornerFlushMove: string | undefined;
  readonly declaredPreparationMove: string | undefined;
  readonly shouldCheckThreeDiagonal: boolean;
  readonly shouldEscapeBishop: boolean;
};

function whiteScoringContext(fen: string): KnightAndBishopPositionScoreContext {
  let shouldCheckThreeDiagonal: boolean | undefined;
  const bishop = findPiece(fen, "w", "b");
  const blackKing = findPiece(fen, "b", "k");
  return {
    shouldCoordinateKing: knightAndBishopShouldCoordinateKing(fen),
    declaredCornerFlushMove: knightAndBishopDeclaredCornerFlushMove(fen),
    declaredPreparationMove: knightAndBishopDeclaredPreparationMove(fen),
    get shouldCheckThreeDiagonal() { return shouldCheckThreeDiagonal ??= knightAndBishopShouldCheckThreeDiagonal(fen); },
    shouldEscapeBishop: !!bishop && !!blackKing && centerDistance(bishop.square) !== 0 && kingDistance(bishop.square, blackKing.square) === 1,
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
  const protectedCentralBishop = !!bishop && centerDistance(bishop.square) === 0 && chess.isAttacked(bishop.square, "w");
  let kingCenterProximity: number | undefined;
  let knightTargetProximity: number | undefined;
  let minorPiecesBlackKingDistance: number | undefined;
  let minorPiecesCenterProximity: number | undefined;
  let knightOnPrecageSquare: boolean | undefined;
  const hasPrecageKnight = () => {
    if (knightOnPrecageSquare === undefined) {
      const knight = findPiece(resultFen, "w", "n");
      knightOnPrecageSquare = !!knight && knightAndBishopKnightTargetSquares(resultFen).includes(knight.square);
    }
    return knightOnPrecageSquare;
  };
  let supportedDiagonal: ReturnType<typeof knightAndBishopSupportedDiagonal> | undefined;
  return {
    get kingCoordinationPenalty() {
      return context.shouldCoordinateKing
        && !(move.piece === "k" && knightAndBishopKingCoordinatesMinors(resultFen)) ? 1 : 0;
    },
    get attackedBishopDefendedKnightPenalty() {
      const knight = findPiece(resultFen, "w", "n");
      return knight && bishop && chess.isAttacked(knight.square, "b")
        && chess.attackers(knight.square, "w").includes(bishop.square) ? 1 : 0;
    },
    get precageKnightPlacementPenalty() {
      return hasPrecageKnight() ? 0 : 1;
    },
    get precageKingEdgePenalty() {
      return hasPrecageKnight() && whiteKing && edgeDistance(whiteKing.square) === 0 ? 1 : 0;
    },
    get precageKingProximityScore() {
      if (!hasPrecageKnight()) return 0;
      const blackKing = findPiece(resultFen, "b", "k");
      return whiteKing && blackKing ? squaredEuclideanDistance(whiteKing.square, blackKing.square) : 99;
    },
    get precageKingNonTargetCornerScore() {
      if (!hasPrecageKnight()) return 0;
      if (!whiteKing || !bishop) return 99;
      return Math.min(...CORNERS
        .filter(corner => squareColor(corner) !== squareColor(bishop.square))
        .map(corner => squaredEuclideanDistance(whiteKing.square, corner)));
    },
    get supportedThreeCheckScore() {
      if (!context.shouldCheckThreeDiagonal) return 0;
      const support = supportedDiagonal ??= knightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to));
      return givesCheck && support.size === 3 && support.knight <= 1 ? 0 : 1;
    },
    get supportedDiagonalSizeScore() { return (supportedDiagonal ??= knightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to))).size; },
    get supportedDiagonalKnightScore() { return (supportedDiagonal ??= knightAndBishopSupportedDiagonal(resultFen, blackReplies.map(move => move.to))).knight; },
    declaredCornerFlushPenalty: context.declaredCornerFlushMove && context.declaredCornerFlushMove !== move.from + move.to ? 1 : 0,
    declaredPreparationPenalty: context.declaredPreparationMove && context.declaredPreparationMove !== move.from + move.to ? 1 : 0,
    mateScore: checkmate ? 0 : 1,
    stalemateScore: !checkmate && blackReplies.length === 0 ? 1 : 0,
    pieceSafetyScore: !knightAndBishopPiecesPresent(resultFen) || blackReplies.some(({ captured }) => captured === "b" || captured === "n") ? 1 : 0,
    bishopEscapeProtectedCenterPenalty: context.shouldEscapeBishop && !protectedCentralBishop ? 1 : 0,
    get bishopEscapeDistanceScore() {
      if (!context.shouldEscapeBishop || protectedCentralBishop) return 0;
      const blackKing = findPiece(resultFen, "b", "k");
      return bishop && blackKing ? -squaredEuclideanDistance(bishop.square, blackKing.square) : 0;
    },
    get kingBlackProximityScore() {
      const blackKing = findPiece(resultFen, "b", "k");
      return whiteKing && blackKing ? squaredEuclideanDistance(whiteKing.square, blackKing.square) : 99;
    },
    get bishopLongDiagonalPenalty() {
      if (!bishop) return 1;
      const { file, rank } = squareCoordinates(bishop.square);
      return file === rank || file + rank === 7 ? 0 : 1;
    },
    bishopProtectedCenterPenalty: protectedCentralBishop ? 0 : 1,
    get knightTargetProximityScore() {
      return knightTargetProximity ??= knightAndBishopKnightTargetProximityScore(resultFen);
    },
    kingBishopColorPenalty: whiteKing && bishop && squareColor(whiteKing.square) === squareColor(bishop.square) ? 1 : 0,
    get kingCenterProximityScore() {
      return kingCenterProximity ??= knightAndBishopKingCenterProximityScore(resultFen);
    },
    get knightBehindKingProximityScore() {
      return knightAndBishopKnightBehindKingProximityScore(resultFen);
    },
    get minorPiecesCenterProximityScore() {
      if (minorPiecesCenterProximity !== undefined) return minorPiecesCenterProximity;
      const knight = findPiece(resultFen, "w", "n");
      return minorPiecesCenterProximity = bishop && knight
        ? [bishop.square, knight.square].reduce((sum, square) => {
          const { file, rank } = squareCoordinates(square);
          return sum + Math.sqrt((file - 3.5) ** 2 + (rank - 3.5) ** 2);
        }, 0) : 99;
    },
    get minorPiecesBlackKingDistanceScore() {
      if (minorPiecesBlackKingDistance !== undefined) return minorPiecesBlackKingDistance;
      const knight = findPiece(resultFen, "w", "n");
      const blackKing = findPiece(resultFen, "b", "k");
      return minorPiecesBlackKingDistance = blackKing && bishop && knight
        ? -(Math.sqrt(squaredEuclideanDistance(bishop.square, blackKing.square))
          + Math.sqrt(squaredEuclideanDistance(knight.square, blackKing.square))) : 0;
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
      helpText: "With a supported diagonal, prefer forcing the Black king towards the target corner.",
      applies: score => score.supportedDiagonalSizeScore < 99,
      compare: () => 0,
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
      id: "r6",
      shortLabel: "rule r6",
      helpText: "With Black's king adjacent to a non-central bishop before White moves, place it on a protected central square, or otherwise maximize the bishop's Euclidean distance from Black's king.",
      subpriorities: [
        { compare: (first, second) => first.bishopEscapeProtectedCenterPenalty - second.bishopEscapeProtectedCenterPenalty },
        { compare: (first, second) => first.bishopEscapeDistanceScore - second.bishopEscapeDistanceScore },
      ],
    },
    {
      id: "r8",
      shortLabel: "rule r8",
      helpText: "Before White moves, if a central bishop is edge-adjacent to Black's king and diagonally adjacent to White's king, and the knight is edge-adjacent to White's king but not adjacent to the bishop, prefer a king move that becomes edge-adjacent to the bishop while remaining adjacent to the knight.",
      compare: (first, second) => first.kingCoordinationPenalty - second.kingCoordinationPenalty,
    },
    {
      id: "r9",
      shortLabel: "rule r9",
      helpText: "Prefer the knight on a precage square, then if satisfied, prefer White king off the edge, then king proximity to Black's king, then king proximity to the closest non target corner.",
      subpriorities: [
        { compare: (first, second) => first.precageKnightPlacementPenalty - second.precageKnightPlacementPenalty },
        { compare: (first, second) => first.precageKingEdgePenalty - second.precageKingEdgePenalty },
        { compare: (first, second) => first.precageKingProximityScore - second.precageKingProximityScore },
        { compare: (first, second) => first.precageKingNonTargetCornerScore - second.precageKingNonTargetCornerScore },
      ],
    },
    {
      id: "r9.5",
      shortLabel: "rule r9.5",
      helpText: "Prefer to not have an attacked knight defended by a bishop.",
      compare: (first, second) => first.attackedBishopDefendedKnightPenalty - second.attackedBishopDefendedKnightPenalty,
    },
    {
      id: "r10",
      shortLabel: "rule r10",
      helpText: "Prefer king Euclidean proximity to the center, then king off bishop's color, then bishop on the long diagonal, then a protected central bishop, then knight move proximity to a precage square.",
      subpriorities: [
        { compare: (first, second) => first.kingCenterProximityScore - second.kingCenterProximityScore },
        { compare: (first, second) => first.kingBishopColorPenalty - second.kingBishopColorPenalty },
        { compare: (first, second) => first.bishopLongDiagonalPenalty - second.bishopLongDiagonalPenalty },
        { compare: (first, second) => first.bishopProtectedCenterPenalty - second.bishopProtectedCenterPenalty },
        { rank: scores => {
          const distances = scores.map(score => score.knightTargetProximityScore);
          const best = Math.min(99, ...distances);
          // No target is neutral: retain it alongside the nearest applicable candidates.
          return distances.map(distance => distance === 99 ? best : distance);
        } },
      ],
    },
    {
      id: "r15",
      shortLabel: "rule r15",
      helpText: "Prefer knight Euclidean proximity to behind White's king from Black's king's perspective, then maximize piece Euclidean distance from Black's king, then minimize piece Euclidean distances from the center, then minimize the king's Euclidean distance to Black's king.",
      subpriorities: [
        { compare: (first, second) => first.knightBehindKingProximityScore - second.knightBehindKingProximityScore },
        { compare: (first, second) => first.minorPiecesBlackKingDistanceScore - second.minorPiecesBlackKingDistanceScore },
        { compare: (first, second) => first.minorPiecesCenterProximityScore - second.minorPiecesCenterProximityScore },
        { compare: (first, second) => first.kingBlackProximityScore - second.kingBlackProximityScore },
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
    "A precage square is diagonally adjacent to a central bishop, off the long diagonal, and strictly behind the bishop from Black's king's perspective.",
    "For r15, measure the knight's Euclidean distance to the nearest board square strictly behind White's king from Black's king's perspective. These squares need not be adjacent to White's king. With White Kd4 and Black Kg4, the region is files a–c; a knight already in that region has distance zero. Evaluate after White moves.",
    "For r10, precage proximity does not prefer creating or removing a precage square. Candidates without one stay tied with the best available precage distance; among candidates with one, fewer knight moves wins.",
    "For r9, evaluate after White moves: prefer the knight on a precage square. Only when that is satisfied, prefer White's king off the edge, then its Euclidean proximity to Black's king, then to whichever corner of the opposite color to the bishop is closest to White's king.",
    "The target corner is the bishop-colored corner closest to Black's king.",
    "Support squares, with reflections: for a2–g8, d3; for a4–e8, d5, with d3 as the previous-stage support square. With Nd3, a five-diagonal additionally requires Ba4, Bb5 or Bd7, or White’s king within the c5–d8 rectangle (files c–d, ranks 5–8). For a6–c8, Kc7 selects b5/c6 and Kb6 selects c6/d7; d5 is the previous-stage support square. Three-diagonal support also requires White’s king adjacent to a6 or c8, or on c6 with Ba6 (including reflections).",
    "An n-diagonal is supported when the knight occupies its previous-stage support square or is within one knight move of its own support square, and Black has no legal move onto the (n+1)-diagonal. Evaluate after White moves. White’s king must be on or inside the (n+2)-diagonal. A diagonal is unsupported if Black can legally step onto it.",
    "For every immediate Black move attacking an undefended bishop, White must have a legal response that leaves Black unable to step onto the (n+1)-diagonal.",
    "Exact placement exception: White Ke7, Bc6 and Nb4 against Black Kc7 is a supported five-diagonal, overriding the attacked-bishop restriction. Include reflections; move counters do not matter.",
    "Exact placement exception: White Kd4, Bc6 and Nb4 against Black Kb6 is a supported five-diagonal, overriding the knight-only bishop defense and king boundary restrictions. Include reflections; move counters do not matter.",
    "Exact unsupported placement: White Kb5, Bc8 and Nc6 against Black Ka7 is not a supported three-diagonal. Include reflections; move counters do not matter.",
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
