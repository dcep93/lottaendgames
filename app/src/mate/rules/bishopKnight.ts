import type { Square } from "chess.js";
import {
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  kingDistance,
  manhattanDistance,
  squareColor,
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
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
  knightAndBishopWhiteMoveReachesLookupPath,
} from "./bishopKnightLookup";
import {
  knightAndBishopBishopWallScore,
  knightAndBishopKingCloserOppositeBishopScore,
  knightAndBishopKingDistanceRegressionScore,
  knightAndBishopKnightCentralDistance,
} from "./bishopKnightStrategy";
import { compareScoresByRules, selectIdealMoves } from "./selection";
import type {
  MateRuleSet,
  OpponentCandidates,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from "./types";

export type KnightAndBishopWhiteMoveScore = {
  readonly mateScore: number;
  readonly stalemateScore: number;
  readonly pieceSafetyScore: number;
  readonly hasLookupMove: boolean;
  readonly lookupMovePenalty: number;
  readonly phaseTwoEntryScore: number;
  readonly kingCloserApplicable: boolean;
  readonly kingCloserOppositeBishopScore: number;
  readonly kingDistanceRegressionScore: number;
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

function blackCanTakeKnightOrBishop(fen: string): boolean {
  if (!knightAndBishopPiecesPresent(fen)) return true;
  return getChess(fen)
    .moves({ verbose: true })
    .some(({ captured }) => captured === "b" || captured === "n");
}

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
  readonly lookupMoves: readonly string[];
  readonly kingCloserApplicable: boolean;
};

function whiteScoringContext(fen: string): KnightAndBishopPositionScoreContext {
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const kingDistanceToBlack = whiteKing && blackKing
    ? kingDistance(whiteKing.square, blackKing.square)
    : 99;
  return {
    lookupMoves: getKnightAndBishopLookupWhiteMoves(fen),
    kingCloserApplicable: knightAndBishopBishopWallScore(fen) !== 0 ||
      (kingDistanceToBlack > 4 && knightAndBishopKnightCentralDistance(fen) === 0),
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
  const checkmate = chess.isCheckmate();
  let kingCloser: number | undefined;
  let kingRegression: number | undefined;
  return {
    mateScore: checkmate ? 0 : 1,
    stalemateScore: !checkmate && chess.isStalemate() ? 1 : 0,
    pieceSafetyScore: blackCanTakeKnightOrBishop(resultFen) ? 1 : 0,
    hasLookupMove: context.lookupMoves.length > 0,
    lookupMovePenalty: context.lookupMoves.length === 0 || context.lookupMoves.includes(san) ? 0 : 1,
    phaseTwoEntryScore: knightAndBishopWhiteMoveReachesLookupPath(fen, san) ? 0 : 1,
    kingCloserApplicable: context.kingCloserApplicable,
    get kingCloserOppositeBishopScore() {
      return kingCloser ??= knightAndBishopKingCloserOppositeBishopScore(fen, resultFen, move?.piece);
    },
    get kingDistanceRegressionScore() {
      return kingRegression ??= knightAndBishopKingDistanceRegressionScore(fen, resultFen, move?.piece);
    },
  };
}

export function scoreKnightAndBishopWhiteMove(
  fen: string,
  san: string,
): KnightAndBishopWhiteMoveScore {
  return scoreKnightAndBishopWhiteMoveCore(fen, san, whiteScoringContext(fen));
}

const ENTER_MATING_NET_HELP =
  "Follow the recorded finishing move when available; otherwise enter the mating net.";
const BRING_KING_CLOSER_HELP =
  "Before the wall is set, or after a far-away knight is central, bring White's king closer on the color opposite the bishop without moving it farther away.";

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
      id: "mating net",
      shortLabel: "mating net",
      helpText: ENTER_MATING_NET_HELP,
      subpriorities: [
        {
          when: (scores) => scores.some(({ hasLookupMove }) => hasLookupMove),
          compare: (first, second) =>
            first.lookupMovePenalty - second.lookupMovePenalty,
        },
        {
          compare: (first, second) =>
            first.phaseTwoEntryScore - second.phaseTwoEntryScore,
        },
      ],
    },
    {
      id: "king closer",
      shortLabel: "king closer",
      helpText: BRING_KING_CLOSER_HELP,
      applies: (score) => score.kingCloserApplicable,
      subpriorities: [
        {
          compare: (first, second) =>
            first.kingCloserOppositeBishopScore -
            second.kingCloserOppositeBishopScore,
        },
        {
          compare: (first, second) =>
            first.kingDistanceRegressionScore -
            second.kingDistanceRegressionScore,
        },
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
    "White uses immediate mates and the finishing pattern first. Otherwise, these priorities choose among legal moves.",
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
  notes: ["The mating corners are the two corners controlled by the bishop."],
  noteBoards: [
    {
      id: "zone-x",
      title: "edge cage",
      caption:
        "The bishop and knight fence Black along the edge while White's king closes in.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: [
        { square: "f8", piece: "k" },
        { square: "e5", piece: "K" },
        { square: "e6", piece: "B" },
        { square: "c6", piece: "N" },
      ],
      highlights: [
        { square: "e8", kind: "zone" },
        { square: "f8", kind: "zone" },
        { square: "c6", kind: "key" },
        { square: "e6", kind: "key" },
        { square: "g7", kind: "escape" },
      ],
      arrows: [{ from: "e5", to: "f6" }],
    },
    {
      id: "key-square",
      title: "knight key square",
      caption:
        "The knight seals the edge square between the kings; the bishop covers the side escapes.",
      layout: { files: 8, ranks: 8, fileOffset: 0 },
      pieces: [
        { square: "d8", piece: "k" },
        { square: "d6", piece: "K" },
        { square: "d5", piece: "B" },
        { square: "d7", piece: "N" },
      ],
      highlights: [
        { square: "c8", kind: "zone" },
        { square: "d8", kind: "zone" },
        { square: "e8", kind: "zone" },
        { square: "d7", kind: "key" },
        { square: "b7", kind: "red" },
        { square: "f7", kind: "red" },
      ],
    },
  ],
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
