import type { PieceSymbol, Square } from "chess.js";
import {
  edgeDistance,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squareColor,
  squareCoords,
  squareFromCoords,
} from "../chess";
import {
  applyUniversalBlackPriorities,
  BLACK_CAPTURE_PRIORITY,
  BLACK_RETURN_PRIORITY,
} from "./blackPriorities";
import { centerDistance, sameDiagonal } from "./bishopKnightGeometry";
import { getKnightAndBishopKeySquarePatternScore } from "./bishopKnightKeySquare";
import {
  getKnightAndBishopLookupWhiteMoves,
  getKnightAndBishopPhaseLabel,
  isKnightAndBishopWManeuverPosition,
  knightAndBishopPiecesPresent,
  knightAndBishopWhiteMoveReachesLookupPath,
} from "./bishopKnightLookup";
import {
  knightAndBishopBlackEdgeEscapeScore,
  knightAndBishopBishopWallScore,
  knightAndBishopBlackCenterAccessScore,
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
} from "./bishopKnightStrategy";
import {
  createKnightAndBishopZoneXScoreContext,
  getKnightAndBishopEstablishedZoneXKnightRouteScore,
  getKnightAndBishopZoneXEntryScore,
  getKnightAndBishopZoneXPrepareScore,
  getKnightAndBishopZoneXWaitingMoveScore,
  getKnightDistanceToAnySquare,
  type KnightAndBishopZoneXScoreContext,
} from "./bishopKnightZoneX";
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
  readonly buildWallApplicable: boolean;
  readonly bishopWallScore: number;
  readonly bishopWallMoveScore: number;
  readonly bishopWallPreservationScore: number;
  readonly bishopWallEdgeDistance: number;
  readonly bishopWallAlignmentScore: number;
  readonly safeCornerKingDistance: number;
  readonly matingCornerEntryScore: number;
  readonly matingKingSquareScore: number;
  readonly prematureCornerCheckScore: number;
  readonly matingBishopCornerLineScore: number;
  readonly matingBishopCentralDistance: number;
  readonly matingKnightMoveScore: number;
  readonly matingKnightRouteDistance: number;
  readonly keySquarePreservationScore: number;
  readonly knightBehindPreservationScore: number;
  readonly coordinatedKnightMoveScore: number;
  readonly coordinatedKnightAtWall: boolean;
  readonly wallCoordinationKnightDistance: number;
  readonly blackCenterAccessScore: number;
  readonly blackMatingCornerContainmentScore: number;
  readonly blackEdgeEscapeScore: number;
  readonly blackOnEdge: boolean;
  readonly keySquarePatternScore: number;
  readonly keySquareImprovementAvailable: boolean;
  readonly zoneXEstablishedKnightRouteScore: number;
  readonly zoneXEntryScore: number;
  readonly zoneXWaitingMoveScore: number;
  readonly zoneXPrepareScore: number;
  readonly zoneXPreparePieceProximity: number;
  readonly zoneXDriftScore: number;
  readonly kingCloserOppositeBishopScore: number;
  readonly kingCloserApplicable: boolean;
  readonly kingDistanceRegressionScore: number;
  readonly bishopOppositionLoopScore: number;
  readonly knightBehindWhiteKingScore: number;
  readonly bishopInFrontScore: number;
  readonly bishopFrontPreparationScore: number;
  readonly bishopBlackKingDistance: number;
  readonly bishopWhiteKingDistance: number;
  readonly movedPiece: PieceSymbol | undefined;
  readonly knightWhiteKingDistance: number;
  readonly knightCentralDistance: number;
  readonly knightBlackKingDistance: number;
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

function blackCanEnterBishopCorner(fen: string): boolean {
  const corners = new Set(cornersForBishop(fen));
  if (corners.size === 0) return false;
  const chess = getChess(fen);
  if (chess.turn() !== "b") return false;
  return chess.moves().some((san) => {
    const next = getChess(fen);
    next.move(san);
    const blackKing = findPiece(next.fen(), "b", "k");
    return Boolean(blackKing && corners.has(blackKing.square));
  });
}

function blackMatingCornerContainmentScore(fen: string): number {
  const corners = cornersForBishop(fen);
  const chess = getChess(fen);
  if (corners.length === 0 || chess.turn() !== "b") return 99;
  const replies = chess.moves();
  if (replies.length === 0) {
    return manhattanDistanceToNearestBishopCorner(fen);
  }
  return Math.max(
    ...replies.map((san) => {
      const next = getChess(fen);
      next.move(san);
      const blackKing = findPiece(next.fen(), "b", "k");
      return blackKing
        ? Math.min(
            ...corners.map((corner) =>
              manhattanDistance(blackKing.square, corner),
            ),
          )
        : 99;
    }),
  );
}

function bishopWallAlignmentScore(fen: string): number {
  if (knightAndBishopBishopWallScore(fen) !== 0) return 99;
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const bishop = findPiece(fen, "w", "b");
  if (!whiteKing || !blackKing || !bishop) return 99;
  const white = squareCoords(whiteKing.square);
  const black = squareCoords(blackKing.square);
  const wall = squareCoords(bishop.square);
  const blackFile = black.file - white.file;
  const blackRank = black.rank - white.rank;
  const wallFile = wall.file - white.file;
  const wallRank = wall.rank - white.rank;
  return Math.abs(wallFile * blackRank - wallRank * blackFile);
}

function bishopWallNeedsReaiming(fen: string): boolean {
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  if (!whiteKing || !blackKing) return false;
  const white = squareCoords(whiteKing.square);
  const black = squareCoords(blackKing.square);
  return (
    bishopWallAlignmentScore(fen) >
    Math.min(
      Math.abs(black.file - white.file),
      Math.abs(black.rank - white.rank),
    )
  );
}

function matingKnightTarget(
  corner: Square | undefined,
  whiteKing: Square | undefined,
): Square | undefined {
  if (!corner || !whiteKing || !isKnightMove(corner, whiteKing)) {
    return undefined;
  }
  const cornerCoords = squareCoords(corner);
  const kingCoords = squareCoords(whiteKing);
  if (Math.abs(kingCoords.file - cornerCoords.file) === 1) {
    return squareFromCoords(
      kingCoords.file + 2 * Math.sign(kingCoords.file - cornerCoords.file),
      kingCoords.rank,
    ) ?? undefined;
  }
  return squareFromCoords(
    kingCoords.file,
    kingCoords.rank + 2 * Math.sign(kingCoords.rank - cornerCoords.rank),
  ) ?? undefined;
}

function matingKingTargets(corner: Square): readonly Square[] {
  const cornerCoords = squareCoords(corner);
  const offsets = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ] as const;
  return offsets.flatMap(([fileOffset, rankOffset]) => {
    const square = squareFromCoords(
      cornerCoords.file + fileOffset,
      cornerCoords.rank + rankOffset,
    );
    return square ? [square] : [];
  });
}

function safeCornerKingTarget(fen: string): Square | undefined {
  const blackKing = findPiece(fen, "b", "k");
  const bishop = findPiece(fen, "w", "b");
  if (!blackKing || !bishop) return undefined;
  const corner = CORNERS.find(
    (candidate) =>
      squareColor(candidate) !== squareColor(bishop.square) &&
      manhattanDistance(blackKing.square, candidate) <= 1,
  );
  if (!corner) return undefined;
  const coords = squareCoords(corner);
  return (
    squareFromCoords(
      coords.file === 0 ? 2 : 5,
      coords.rank === 0 ? 2 : 5,
    ) ?? undefined
  );
}

function getWhiteKnightAndBishopSquares(fen: string): Square[] {
  return getEndgamePiecePlacements(fen)
    .filter(
      (piece) =>
        piece.color === "w" && (piece.type === "b" || piece.type === "n"),
    )
    .map(({ square }) => square);
}

function knightAndBishopKeySquareImprovementAvailable(fen: string): boolean {
  const currentScore = getKnightAndBishopKeySquarePatternScore(fen);
  if (currentScore === 0) return false;
  return getChess(fen)
    .moves()
    .some((san) => {
      const next = getChess(fen);
      next.move(san);
      return getKnightAndBishopKeySquarePatternScore(next.fen()) === 0;
    });
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
  keySquareImprovementAvailable: boolean;
  zoneX?: KnightAndBishopZoneXScoreContext;
};

function scoreKnightAndBishopWhiteMoveCore(
  fen: string,
  san: string,
  lookupMoves: readonly string[] = getKnightAndBishopLookupWhiteMoves(fen),
  positionContext: KnightAndBishopPositionScoreContext = {
    keySquareImprovementAvailable:
      knightAndBishopKeySquareImprovementAvailable(fen),
  },
): KnightAndBishopWhiteMoveScore {
  const chess = getChess(fen);
  const move = chess.move(san);
  const resultFen = chess.fen();
  const blackKing = findPiece(resultFen, "b", "k");
  const currentBlackKing = findPiece(fen, "b", "k");
  const bishop = findPiece(resultFen, "w", "b");
  const currentBishop = findPiece(fen, "w", "b");
  const whiteKing = findPiece(resultFen, "w", "k");
  const currentWhiteKing = findPiece(fen, "w", "k");
  let kingCloserOppositeBishopScore: number | undefined;
  let kingDistanceRegressionScore: number | undefined;
  let bishopOppositionLoopScore: number | undefined;
  let knightBehindWhiteKingScore: number | undefined;
  let bishopInFrontScore: number | undefined;
  let bishopFrontPreparationScore: number | undefined;
  let knightWhiteKingDistance: number | undefined;
  let knightCentralDistance: number | undefined;
  let knightBlackKingDistance: number | undefined;
  let zoneXEstablishedKnightRouteScore: number | undefined;
  let zoneXEntryScore: number | undefined;
  let zoneXWaitingMoveScore: number | undefined;
  let zoneXPrepare:
    ReturnType<typeof getKnightAndBishopZoneXPrepareScore> | undefined;
  const getZoneXContext = () => {
    positionContext.zoneX ??= createKnightAndBishopZoneXScoreContext(fen);
    return positionContext.zoneX;
  };
  const getZoneXPrepare = () => {
    zoneXPrepare ??= getKnightAndBishopZoneXPrepareScore(
      fen,
      san,
      resultFen,
      move,
      getZoneXContext(),
    );
    return zoneXPrepare;
  };
  const bishopWallScore = knightAndBishopBishopWallScore(resultFen);
  const bishopWallAlreadyBuilt =
    knightAndBishopBishopWallScore(fen) === 0;
  const currentKnightWhiteKingDistance =
    knightAndBishopKnightWhiteKingDistance(fen);
  const currentKingBlackDistance =
    currentWhiteKing && currentBlackKing
      ? kingDistance(currentWhiteKing.square, currentBlackKing.square)
      : 99;
  const cageFormationNearBlack = currentKingBlackDistance <= 4;
  const resultKnightWhiteKingDistance =
    knightAndBishopKnightWhiteKingDistance(resultFen);
  const currentKnightCentralDistance =
    knightAndBishopKnightCentralDistance(fen);
  const resultKingBlackDistance =
    whiteKing && blackKing
      ? kingDistance(whiteKing.square, blackKing.square)
      : 99;
  const farKingAdvance =
    bishopWallAlreadyBuilt &&
    !cageFormationNearBlack &&
    currentKnightCentralDistance === 0 &&
    move?.piece === "k" &&
    resultKingBlackDistance < currentKingBlackDistance;
  const farWallNeedsReaiming =
    bishopWallAlreadyBuilt &&
    !cageFormationNearBlack &&
    currentKnightCentralDistance === 0 &&
    bishopWallNeedsReaiming(fen);
  const keySquareAlreadyEstablished =
    getKnightAndBishopKeySquarePatternScore(fen) === 0;
  const knightAlreadyBehindWhiteKing =
    knightAndBishopKnightBehindWhiteKingScore(fen) === 0;
  const blackOnEdge = Boolean(
    currentBlackKing && edgeDistance(currentBlackKing.square) === 0,
  );
  const currentBishopCorners = new Set(cornersForBishop(fen));
  const nearMatingCorner = [...currentBishopCorners].find(
    (corner) =>
      currentBlackKing &&
      manhattanDistance(currentBlackKing.square, corner) <= 2,
  );
  const matingCornerForPlacedKing = [...currentBishopCorners].find(
    (corner) =>
      currentBlackKing &&
      currentWhiteKing &&
      manhattanDistance(currentBlackKing.square, corner) <= 2 &&
      isKnightMove(currentWhiteKing.square, corner),
  );
  const currentOccupiedMatingCorner = [...currentBishopCorners].find(
    (corner) => currentBlackKing?.square === corner,
  );
  const matingCornerKingTarget =
    nearMatingCorner ??
    matingCornerForPlacedKing ??
    currentOccupiedMatingCorner;
  const matingBishopReady = Boolean(
    matingCornerForPlacedKing &&
      currentBishop &&
      !sameDiagonal(currentBishop.square, matingCornerForPlacedKing) &&
      centerDistance(currentBishop.square) <= 1,
  );
  const knightSetupTarget = matingKnightTarget(
    matingCornerKingTarget,
    currentWhiteKing?.square,
  );
  const currentMatingKingDistance =
    matingCornerKingTarget && currentWhiteKing
      ? Math.min(
          ...matingKingTargets(matingCornerKingTarget).map((target) =>
            kingDistance(currentWhiteKing.square, target),
          ),
        )
      : 99;
  const pivotalKingTarget = safeCornerKingTarget(fen);
  const kingApproachesMiddle16 =
    knightAndBishopKingApproachesMiddle16(fen, resultFen, move?.piece);
  return {
    mateScore: chess.isCheckmate() ? 0 : 1,
    stalemateScore: !chess.isCheckmate() && chess.isStalemate() ? 1 : 0,
    pieceSafetyScore: blackCanTakeKnightOrBishop(resultFen) ? 1 : 0,
    hasLookupMove: lookupMoves.length > 0,
    lookupMovePenalty:
      lookupMoves.length === 0 || lookupMoves.includes(san) ? 0 : 1,
    phaseTwoEntryScore: knightAndBishopWhiteMoveReachesLookupPath(fen, san)
      ? 0
      : 1,
    buildWallApplicable: Boolean(
      currentBlackKing &&
        (edgeDistance(currentBlackKing.square) > 0 ||
          currentKingBlackDistance >= 4) &&
        knightAndBishopBishopWallScore(fen) !== 0,
    ),
    bishopWallScore,
    bishopWallMoveScore: move?.piece === "b" ? bishopWallScore : 3,
    bishopWallPreservationScore: bishopWallAlreadyBuilt
      ? bishopWallScore === 0 || farKingAdvance
        ? 0
        : 1
      : 0,
    bishopWallEdgeDistance:
      bishopWallAlreadyBuilt && bishopWallScore === 0 && bishop
        ? edgeDistance(bishop.square)
        : bishopWallAlreadyBuilt
          ? 99
          : 0,
    bishopWallAlignmentScore:
      bishopWallAlreadyBuilt &&
      cageFormationNearBlack &&
      currentKnightWhiteKingDistance <= 1
        ? bishopWallAlignmentScore(resultFen)
        : farWallNeedsReaiming
          ? farKingAdvance || move?.piece === "b"
            ? 0
            : 99
      : 0,
    safeCornerKingDistance:
      pivotalKingTarget && whiteKing
        ? kingDistance(whiteKing.square, pivotalKingTarget)
        : 0,
    matingCornerEntryScore:
      manhattanDistanceToNearestBishopCorner(fen) === 1
        ? blackCanEnterBishopCorner(resultFen)
          ? 0
          : 1
        : 0,
    matingKingSquareScore:
      matingCornerKingTarget &&
      whiteKing &&
      (matingCornerForPlacedKing ||
        (currentKnightCentralDistance <= 1 &&
          currentMatingKingDistance <= 3))
        ? Math.min(
            ...matingKingTargets(matingCornerKingTarget).map((target) =>
              kingDistance(whiteKing.square, target),
            ),
          )
        : 0,
    prematureCornerCheckScore:
      currentBlackKing &&
      currentBishopCorners.has(currentBlackKing.square) &&
      chess.isCheck()
        ? 1
        : 0,
    matingBishopCornerLineScore:
      matingCornerForPlacedKing &&
      bishop &&
      sameDiagonal(bishop.square, matingCornerForPlacedKing)
        ? 1
        : 0,
    matingBishopCentralDistance:
      matingCornerForPlacedKing && bishop ? centerDistance(bishop.square) : 0,
    matingKnightMoveScore: matingBishopReady
      ? move?.piece === "n"
        ? 0
        : 1
      : 0,
    matingKnightRouteDistance:
      matingBishopReady && knightSetupTarget
        ? findPiece(resultFen, "w", "n")
          ? getKnightDistanceToAnySquare(
              findPiece(resultFen, "w", "n")!.square,
              [knightSetupTarget],
            )
          : 99
        : 0,
    keySquarePreservationScore: keySquareAlreadyEstablished
      ? getKnightAndBishopKeySquarePatternScore(resultFen)
      : 0,
    knightBehindPreservationScore:
      cageFormationNearBlack &&
      knightAlreadyBehindWhiteKing &&
      move?.piece === "n"
      ? knightAndBishopKnightBehindWhiteKingScore(resultFen)
      : 0,
    coordinatedKnightMoveScore:
      bishopWallAlreadyBuilt &&
      cageFormationNearBlack &&
      currentKnightWhiteKingDistance <= 1 &&
      move?.piece === "n"
        ? 1
        : 0,
    coordinatedKnightAtWall:
      bishopWallAlreadyBuilt &&
      cageFormationNearBlack &&
      currentKnightWhiteKingDistance <= 1,
    wallCoordinationKnightDistance:
      bishopWallAlreadyBuilt &&
      cageFormationNearBlack &&
      currentKnightWhiteKingDistance > 1
      ? resultKnightWhiteKingDistance
      : 0,
    blackCenterAccessScore:
      knightAndBishopBlackCenterAccessScore(resultFen),
    blackMatingCornerContainmentScore:
      blackOnEdge &&
      cageFormationNearBlack &&
      currentKnightCentralDistance <= 1 &&
      !nearMatingCorner
        ? blackMatingCornerContainmentScore(resultFen)
        : 0,
    blackEdgeEscapeScore: cageFormationNearBlack
      ? knightAndBishopBlackEdgeEscapeScore(resultFen)
      : 0,
    blackOnEdge,
    keySquarePatternScore:
      kingApproachesMiddle16 && !blackOnEdge
      ? 0
      : getKnightAndBishopKeySquarePatternScore(resultFen),
    get keySquareImprovementAvailable() {
      return positionContext.keySquareImprovementAvailable;
    },
    get zoneXEstablishedKnightRouteScore() {
      zoneXEstablishedKnightRouteScore ??=
        getKnightAndBishopEstablishedZoneXKnightRouteScore(
          fen,
          resultFen,
          move,
          getZoneXContext(),
        );
      return zoneXEstablishedKnightRouteScore;
    },
    get zoneXEntryScore() {
      zoneXEntryScore ??= getKnightAndBishopZoneXEntryScore(
        fen,
        san,
        resultFen,
        getZoneXContext(),
      );
      return zoneXEntryScore;
    },
    get zoneXWaitingMoveScore() {
      zoneXWaitingMoveScore ??= getKnightAndBishopZoneXWaitingMoveScore(
        fen,
        resultFen,
        move,
        getZoneXContext(),
      );
      return zoneXWaitingMoveScore;
    },
    get zoneXPrepareScore() {
      return getZoneXPrepare().zoneXPrepareScore;
    },
    get zoneXPreparePieceProximity() {
      return getZoneXPrepare().zoneXPreparePieceProximity;
    },
    get zoneXDriftScore() {
      return getZoneXPrepare().zoneXDriftScore;
    },
    get kingCloserOppositeBishopScore() {
      kingCloserOppositeBishopScore ??=
        knightAndBishopKingCloserOppositeBishopScore(
          fen,
          resultFen,
          move?.piece,
        );
      return kingCloserOppositeBishopScore;
    },
    kingCloserApplicable:
      !bishopWallAlreadyBuilt ||
      (!cageFormationNearBlack && currentKnightCentralDistance === 0),
    get kingDistanceRegressionScore() {
      kingDistanceRegressionScore ??=
        knightAndBishopKingDistanceRegressionScore(fen, resultFen, move?.piece);
      return kingDistanceRegressionScore;
    },
    get bishopOppositionLoopScore() {
      bishopOppositionLoopScore ??= knightAndBishopBishopOppositionLoopScore(
        fen,
        move?.piece,
      );
      return bishopOppositionLoopScore;
    },
    get knightBehindWhiteKingScore() {
      knightBehindWhiteKingScore ??= cageFormationNearBlack
        ? knightAndBishopKnightBehindWhiteKingScore(resultFen)
        : 0;
      return knightBehindWhiteKingScore;
    },
    get bishopInFrontScore() {
      bishopInFrontScore ??= knightAndBishopBishopInFrontScore(
        fen,
        resultFen,
        move?.piece,
      );
      return bishopInFrontScore;
    },
    get bishopFrontPreparationScore() {
      bishopFrontPreparationScore ??=
        knightAndBishopBishopFrontPreparationScore(fen, resultFen, move?.piece);
      return bishopFrontPreparationScore;
    },
    bishopBlackKingDistance:
      bishop && blackKing
        ? manhattanDistance(bishop.square, blackKing.square)
        : 99,
    bishopWhiteKingDistance:
      bishop && whiteKing
        ? manhattanDistance(bishop.square, whiteKing.square)
        : 99,
    movedPiece: move?.piece,
    get knightWhiteKingDistance() {
      knightWhiteKingDistance ??= cageFormationNearBlack
        ? resultKnightWhiteKingDistance
        : 0;
      return knightWhiteKingDistance;
    },
    get knightCentralDistance() {
      knightCentralDistance ??= knightAndBishopKnightCentralDistance(resultFen);
      return knightCentralDistance;
    },
    get knightBlackKingDistance() {
      knightBlackKingDistance ??=
        knightAndBishopKnightBlackKingDistance(resultFen);
      return knightBlackKingDistance;
    },
  };
}

export function scoreKnightAndBishopWhiteMove(
  fen: string,
  san: string,
): KnightAndBishopWhiteMoveScore {
  return scoreKnightAndBishopWhiteMoveCore(fen, san);
}

const ENTER_MATING_NET_HELP =
  "Follow the recorded finishing move when available; otherwise enter the mating net.";
const BUILD_WALL_HELP =
  "Move the bishop beside White's king on Black's side. Of those wall moves, choose the one that keeps Black farthest from the center.";
const EDGE_CAGE_HELP =
  "When the key square cannot be completed and White's king is within four king moves, hold Black on the edge, keep an established knight seal, and leave a knight that has reached White's king in place. Drive Black along the edge toward a bishop-colored corner by covering its farthest retreat. At a corner the bishop cannot mate on, put White's king two diagonal squares inward. Keep the bishop wall aimed toward Black's edge. If every wall move lets Black step inward, re-aim with the bishop instead of shuffling the king. Within two edge squares of a bishop-colored corner, once White's king is within three moves of a mating square, walk it to a knight's move from the corner and keep it there; then centralize the bishop off the corner diagonal and route the knight two squares inward from White's king. Otherwise advance the king or wait with the bishop.";
const KNIGHT_KEY_SQUARE_HELP =
  "Before Black reaches the edge, move White's king inward. Then place the knight between the kings to seal the edge.";
const BRING_KING_CLOSER_HELP =
  "Before the wall is set, or after a far-away knight is central, bring White's king closer on the color opposite the bishop without moving it farther away.";
const COORDINATE_PIECES_HELP =
  "More than four king moves from Black, center the knight, advance the king, and re-aim a wall that points across Black. Nearer Black, keep the knight behind White's king. With the wall set, bring the knight to the king and leave it there before lining up the bishop in front. When the bishop must move, keep it close to White's king and, among those squares, away from Black.";

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
      id: "build the wall",
      shortLabel: "build the wall",
      helpText: BUILD_WALL_HELP,
      applies: (score) => score.buildWallApplicable,
      subpriorities: [
        {
          when: (scores) =>
            scores.some(({ bishopWallMoveScore }) => bishopWallMoveScore === 0),
          compare: (first, second) =>
            first.bishopWallMoveScore - second.bishopWallMoveScore,
        },
        {
          when: (scores) =>
            scores.some(({ bishopWallMoveScore }) => bishopWallMoveScore === 0),
          compare: (first, second) =>
            first.blackCenterAccessScore - second.blackCenterAccessScore,
        },
      ],
    },
    {
      id: "edge cage",
      shortLabel: "edge cage",
      helpText: EDGE_CAGE_HELP,
      applies: (score) => !score.keySquareImprovementAvailable,
      subpriorities: [
        {
          compare: (first, second) =>
            first.keySquarePreservationScore -
            second.keySquarePreservationScore,
        },
        {
          compare: (first, second) =>
            first.safeCornerKingDistance - second.safeCornerKingDistance,
        },
        {
          compare: (first, second) =>
            first.matingKingSquareScore - second.matingKingSquareScore,
        },
        {
          compare: (first, second) =>
            first.coordinatedKnightMoveScore -
            second.coordinatedKnightMoveScore,
        },
        {
          compare: (first, second) =>
            first.bishopWallPreservationScore -
            second.bishopWallPreservationScore,
        },
        {
          compare: (first, second) =>
            first.blackMatingCornerContainmentScore -
            second.blackMatingCornerContainmentScore,
        },
        {
          compare: (first, second) =>
            first.matingCornerEntryScore - second.matingCornerEntryScore,
        },
        {
          compare: (first, second) =>
            first.prematureCornerCheckScore -
            second.prematureCornerCheckScore,
        },
        {
          compare: (first, second) =>
            first.matingBishopCornerLineScore -
            second.matingBishopCornerLineScore,
        },
        {
          compare: (first, second) =>
            first.matingBishopCentralDistance -
            second.matingBishopCentralDistance,
        },
        {
          compare: (first, second) =>
            first.matingKnightMoveScore - second.matingKnightMoveScore,
        },
        {
          compare: (first, second) =>
            first.matingKnightRouteDistance -
            second.matingKnightRouteDistance,
        },
        {
          compare: (first, second) =>
            first.knightBehindPreservationScore -
            second.knightBehindPreservationScore,
        },
        {
          compare: (first, second) =>
            first.blackEdgeEscapeScore - second.blackEdgeEscapeScore,
        },
        {
          when: (scores) =>
            scores.every(
              ({
                blackOnEdge,
                blackEdgeEscapeScore,
                coordinatedKnightAtWall,
              }) =>
                blackOnEdge &&
                blackEdgeEscapeScore > 0 &&
                coordinatedKnightAtWall,
            ),
          compare: (first, second) =>
            Number(first.movedPiece !== "b") -
            Number(second.movedPiece !== "b"),
        },
        {
          compare: (first, second) =>
            first.bishopWallAlignmentScore -
            second.bishopWallAlignmentScore,
        },
        {
          compare: (first, second) =>
            first.zoneXEstablishedKnightRouteScore -
            second.zoneXEstablishedKnightRouteScore,
        },
        {
          compare: (first, second) =>
            first.zoneXWaitingMoveScore - second.zoneXWaitingMoveScore,
        },
        {
          compare: (first, second) =>
            first.zoneXEntryScore - second.zoneXEntryScore,
        },
        {
          when: (scores) =>
            scores.every(({ blackOnEdge }) => !blackOnEdge) ||
            scores.some(({ zoneXPrepareScore }) => zoneXPrepareScore === 0),
          compare: (first, second) =>
            first.zoneXPrepareScore - second.zoneXPrepareScore ||
            first.zoneXPreparePieceProximity -
              second.zoneXPreparePieceProximity,
        },
      ],
    },
    {
      id: "knight key square",
      shortLabel: "knight key square",
      helpText: KNIGHT_KEY_SQUARE_HELP,
      compare: (first, second) =>
        first.keySquarePatternScore - second.keySquarePatternScore,
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
    {
      id: "coordinate pieces",
      shortLabel: "coordinate pieces",
      helpText: COORDINATE_PIECES_HELP,
      subpriorities: [
        {
          compare: (first, second) =>
            first.bishopOppositionLoopScore -
              second.bishopOppositionLoopScore ||
            first.knightBehindWhiteKingScore -
              second.knightBehindWhiteKingScore,
        },
        {
          compare: (first, second) =>
            first.wallCoordinationKnightDistance -
            second.wallCoordinationKnightDistance,
        },
        {
          compare: (first, second) =>
            first.bishopInFrontScore - second.bishopInFrontScore,
        },
        {
          compare: (first, second) =>
            first.knightWhiteKingDistance - second.knightWhiteKingDistance,
        },
        {
          compare: (first, second) =>
            first.knightCentralDistance - second.knightCentralDistance ||
            second.knightBlackKingDistance - first.knightBlackKingDistance,
        },
        {
          compare: (first, second) =>
            first.bishopFrontPreparationScore -
            second.bishopFrontPreparationScore,
        },
        {
          when: (scores) =>
            scores.every(({ movedPiece }) => movedPiece === "b"),
          compare: (first, second) =>
            first.bishopWhiteKingDistance - second.bishopWhiteKingDistance ||
            second.bishopBlackKingDistance - first.bishopBlackKingDistance,
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
  const lookupMoves = getKnightAndBishopLookupWhiteMoves(fen);
  const positionContext: KnightAndBishopPositionScoreContext = {
    keySquareImprovementAvailable: false,
  };
  const candidates = moves.map((san) => ({
    san,
    score: scoreKnightAndBishopWhiteMoveCore(
      fen,
      san,
      lookupMoves,
      positionContext,
    ),
  }));
  const currentKeySquareScore = getKnightAndBishopKeySquarePatternScore(fen);
  positionContext.keySquareImprovementAvailable =
    currentKeySquareScore !== 0 &&
    candidates.some(({ score }) => score.keySquarePatternScore === 0);
  return candidates;
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
