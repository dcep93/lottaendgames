import type { Chess, Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  allSquares,
  edgeDistance,
  findPiece,
  getChess,
  getEndgamePiecePlacements,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squareCoords,
  squareFromCoords,
  transformSquare,
} from '../chess'
import type {
  KnightAndBishopZone5,
  KnightAndBishopZoneXSetup,
} from './bishopKnightGeometry'

export function getKnightAndBishopZone5(fen: string): KnightAndBishopZone5 | undefined {
  const blackKing = findPiece(fen, "b", "k");
  return getKnightAndBishopZone5Candidates(fen)
    .filter(
      (zone5) => blackKing && zone5.zoneSquares.includes(blackKing.square)
    )
    .sort((a, b) => compareKnightAndBishopZone5Candidates(fen, a, b))[0];
}

export function getKnightAndBishopZoneXSetup(
  fen: string
): KnightAndBishopZoneXSetup | undefined {
  return getKnightAndBishopZoneXSetupCandidates(fen).sort((a, b) =>
    compareKnightAndBishopZoneXSetups(fen, a, b)
  )[0];
}

export function getKnightAndBishopZoneXSetupCandidates(
  fen: string
): KnightAndBishopZoneXSetup[] {
  const bishop = findPiece(fen, "w", "b");
  const blackKing = findPiece(fen, "b", "k");
  if (!bishop || !blackKing) {
    return [];
  }

  const canonical = {
    bishop: "e6" as Square,
    blackAnchorSquares: ["e7", "d8", "e8", "f8"] as Square[],
    stableKnightSquares: ["c6", "g6"] as Square[],
  };
  const candidates = new Map<string, KnightAndBishopZoneXSetup>();

  SQUARE_TRANSFORMS.forEach((transform) => {
    const transformedBishop = transformSquare(canonical.bishop, transform);
    const bishopCoords = squareCoords(bishop.square);
    const transformedBishopCoords = squareCoords(transformedBishop);
    const fileOffset = bishopCoords.file - transformedBishopCoords.file;
    const rankOffset = bishopCoords.rank - transformedBishopCoords.rank;
    const transformAndTranslate = (square: Square) =>
      translateSquare(
        transformSquare(square, transform),
        fileOffset,
        rankOffset
      );
    const blackAnchorSquares = canonical.blackAnchorSquares
      .map(transformAndTranslate)
      .filter((square): square is Square => square != null);
    const stableKnightSquares = canonical.stableKnightSquares
      .map(transformAndTranslate)
      .filter((square): square is Square => square != null);
    if (
      blackAnchorSquares.length !== canonical.blackAnchorSquares.length ||
      stableKnightSquares.length !== canonical.stableKnightSquares.length ||
      !blackAnchorSquares.includes(blackKing.square) ||
      !blackAnchorSquares.slice(1).every((square) => edgeDistance(square) === 0)
    ) {
      return;
    }
    const setup = {
      bishopSquare: bishop.square,
      blackAnchorSquares,
      stableKnightSquares,
    };
    const key = [
      setup.bishopSquare,
      [...setup.blackAnchorSquares].sort().join("/"),
      [...setup.stableKnightSquares].sort().join("/"),
    ].join("|");
    candidates.set(key, setup);
  });

  return [...candidates.values()];
}

export function getKnightAndBishopZoneXKnightDriftTarget(
  fen: string
): Square | undefined {
  const bishop = findPiece(fen, "w", "b");
  const blackKing = findPiece(fen, "b", "k");
  const whiteKing = findPiece(fen, "w", "k");
  if (!bishop || !blackKing || !whiteKing || edgeDistance(blackKing.square) !== 0) {
    return undefined;
  }

  const canonical = {
    bishop: "b3" as Square,
    blackKing: "b1" as Square,
    whiteKing: "c3" as Square,
    knightDriftTarget: "d3" as Square,
  };
  const targets = new Set<Square>();

  SQUARE_TRANSFORMS.forEach((transform) => {
    const transformedBishop = transformSquare(canonical.bishop, transform);
    const bishopCoords = squareCoords(bishop.square);
    const transformedBishopCoords = squareCoords(transformedBishop);
    const fileOffset = bishopCoords.file - transformedBishopCoords.file;
    const rankOffset = bishopCoords.rank - transformedBishopCoords.rank;
    const transformAndTranslate = (square: Square) =>
      translateSquare(
        transformSquare(square, transform),
        fileOffset,
        rankOffset
      );
    if (transformAndTranslate(canonical.blackKing) !== blackKing.square) {
      return;
    }
    if (transformAndTranslate(canonical.whiteKing) !== whiteKing.square) {
      return;
    }
    const target = transformAndTranslate(canonical.knightDriftTarget);
    if (target) {
      targets.add(target);
    }
  });

  return [...targets].sort()[0];
}

export function compareKnightAndBishopZoneXSetups(
  fen: string,
  a: KnightAndBishopZoneXSetup,
  b: KnightAndBishopZoneXSetup
): number {
  const knight = findPiece(fen, "w", "n");
  const aKnightDistance = knight
    ? getKnightDistanceToAnySquare(knight.square, a.stableKnightSquares)
    : 99;
  const bKnightDistance = knight
    ? getKnightDistanceToAnySquare(knight.square, b.stableKnightSquares)
    : 99;
  return (
    aKnightDistance - bKnightDistance ||
    [...a.stableKnightSquares].sort().join("/").localeCompare(
      [...b.stableKnightSquares].sort().join("/")
    )
  );
}

export function getKnightAndBishopZone5PathInstance(
  fen: string
): KnightAndBishopZone5 | undefined {
  return getKnightAndBishopZone5Candidates(fen).sort((a, b) =>
    compareKnightAndBishopZone5Candidates(fen, a, b)
  )[0];
}

export function getKnightAndBishopZone5Candidates(
  fen: string
): KnightAndBishopZone5[] {
  const bishop = findPiece(fen, "w", "b");
  const knight = findPiece(fen, "w", "n");
  if (!bishop || !knight) {
    return [];
  }
  const canonical = {
    bishop: "e6" as Square,
    stableKnightSquares: ["c6", "g6"] as Square[],
    zoneSquares: ["e8", "f8"] as [Square, Square],
    escapeSquare: "g7" as Square,
    targetKingSquare: "f6" as Square,
  };
  const candidates = new Map<string, KnightAndBishopZone5>();

  SQUARE_TRANSFORMS.forEach((transform) => {
    const transformedBishop = transformSquare(canonical.bishop, transform);
    const bishopCoords = squareCoords(bishop.square);
    const transformedBishopCoords = squareCoords(transformedBishop);
    const fileOffset = bishopCoords.file - transformedBishopCoords.file;
    const rankOffset = bishopCoords.rank - transformedBishopCoords.rank;
    const transformAndTranslate = (square: Square) =>
      translateSquare(
        transformSquare(square, transform),
        fileOffset,
        rankOffset
      );
    const zoneSquares = canonical.zoneSquares
      .map(transformAndTranslate)
      .filter((square): square is Square => square != null);
    const escapeSquare: Square | "offboard" =
      transformAndTranslate(canonical.escapeSquare) ?? "offboard";
    const targetKingSquare = transformAndTranslate(canonical.targetKingSquare);
    if (
      zoneSquares.length !== 2 ||
      !targetKingSquare ||
      !zoneSquares.every((square) => edgeDistance(square) === 0)
    ) {
      return;
    }
    canonical.stableKnightSquares.forEach((canonicalStableKnightSquare) => {
      const stableKnightSquare = transformAndTranslate(canonicalStableKnightSquare);
      if (!stableKnightSquare || stableKnightSquare !== knight.square) {
        return;
      }
      const zone5: KnightAndBishopZone5 = {
        zoneSquares: [zoneSquares[0], zoneSquares[1]] as [Square, Square],
        escapeSquare,
        targetKingSquare,
        stableKnightSquare,
      };
      if (!whiteKingCanBlockKnightAndBishopZone5Escape(fen, zone5)) {
        return;
      }
      const key = getKnightAndBishopZone5Key(zone5);
      candidates.set(key, zone5);
    });
  });

  return [...candidates.values()];
}

export function compareKnightAndBishopZone5Candidates(
  fen: string,
  a: KnightAndBishopZone5,
  b: KnightAndBishopZone5
): number {
  const blackKing = findPiece(fen, "b", "k");
  const knight = findPiece(fen, "w", "n");
  const aBlackInZone =
    blackKing && a.zoneSquares.includes(blackKing.square) ? 0 : 1;
  const bBlackInZone =
    blackKing && b.zoneSquares.includes(blackKing.square) ? 0 : 1;
  const aStableKnight = knight?.square === a.stableKnightSquare ? 0 : 1;
  const bStableKnight = knight?.square === b.stableKnightSquare ? 0 : 1;
  const aTargetOppositeKnight = knight
    ? -kingDistance(knight.square, a.targetKingSquare)
    : 0;
  const bTargetOppositeKnight = knight
    ? -kingDistance(knight.square, b.targetKingSquare)
    : 0;
  return (
    aBlackInZone - bBlackInZone ||
    aStableKnight - bStableKnight ||
    aTargetOppositeKnight - bTargetOppositeKnight ||
    getKnightAndBishopZone5Key(a).localeCompare(
      getKnightAndBishopZone5Key(b)
    )
  );
}

export function getKnightAndBishopZone5Key(zone5: KnightAndBishopZone5): string {
  return [
    [...zone5.zoneSquares].sort().join("/"),
    zone5.escapeSquare,
    zone5.targetKingSquare,
    zone5.stableKnightSquare,
  ].join("|");
}

export function translateSquare(
  square: Square,
  fileOffset: number,
  rankOffset: number
): Square | null {
  const coords = squareCoords(square);
  return squareFromCoords(
    coords.file + fileOffset,
    coords.rank + rankOffset
  );
}

export function whiteKingCanBlockKnightAndBishopZone5Escape(
  fen: string,
  zone5 = getKnightAndBishopZone5PathInstance(fen)
): boolean {
  if (!zone5) {
    return false;
  }
  const whiteKing = findPiece(fen, "w", "k");
  if (!whiteKing) {
    return false;
  }
  const blocker = getEndgamePiecePlacements(fen).find(
    (piece) =>
      piece.square === zone5.targetKingSquare &&
      !(piece.color === "w" && piece.type === "k")
  );
  return (
    !blocker &&
    kingDistance(whiteKing.square, zone5.targetKingSquare) <= 1 &&
    (zone5.escapeSquare === "offboard" ||
      kingDistance(zone5.targetKingSquare, zone5.escapeSquare) === 1)
  );
}

export function knightAndBishopAllBlackRepliesStayInZone5(
  fen: string,
  zone5 = getKnightAndBishopZone5PathInstance(fen)
): boolean {
  const chess = getChess(fen);
  if (chess.turn() !== "b" || !zone5) {
    return false;
  }
  const replies = chess.moves();
  return (
    replies.length > 0 &&
    replies.every((san) => {
      const next = getChess(fen);
      next.move(san);
      const replyZone5 = getKnightAndBishopZone5(next.fen());
      return Boolean(replyZone5);
    })
  );
}

export function knightAndBishopWhiteMoveForcesZone5(
  fen: string,
  san: string
): boolean {
  const chess = getChess(fen);
  if (chess.turn() !== "w") {
    return false;
  }
  const move = chess.move(san);
  if (!move || chess.isCheckmate() || chess.isStalemate()) {
    return false;
  }
  const zone5 = getKnightAndBishopZone5PathInstance(chess.fen());
  return knightAndBishopAllBlackRepliesStayInZone5(chess.fen(), zone5);
}

export function getKnightAndBishopZoneXEntryScore(fen: string, san: string): number {
  const moveForcesZone5 = knightAndBishopWhiteMoveForcesZone5(fen, san);
  const prepareMove = getKnightAndBishopZoneXPrepareMove(fen);
  if (prepareMove) {
    const prepareMoveForcesZone5 =
      prepareMove === san
        ? moveForcesZone5
        : knightAndBishopWhiteMoveForcesZone5(fen, prepareMove);
    if (prepareMoveForcesZone5) {
      return prepareMove === san ? 0 : moveForcesZone5 ? 1 : 2;
    }
  }
  return moveForcesZone5 ? 0 : 1;
}

export function getKnightAndBishopZoneXPrepareMove(
  fen: string
): string | undefined {
  const chess = getChess(fen);
  if (chess.turn() !== "w") {
    return undefined;
  }
  const zoneX = getKnightAndBishopZone5(fen);
  const bishop = findPiece(fen, "w", "b");
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  if (!zoneX || !bishop || !whiteKing || !blackKing) {
    return undefined;
  }

  const target = squareCoords(zoneX.targetKingSquare);
  const bishopCoords = squareCoords(bishop.square);
  const sideSquare = squareFromCoords(
    target.file + (target.file - bishopCoords.file),
    target.rank + (target.rank - bishopCoords.rank)
  );
  const edgeDirection = getZoneXEdgeDirection(zoneX);
  const backSquare = edgeDirection
    ? squareFromCoords(
      target.file - edgeDirection.file,
      target.rank - edgeDirection.rank
    )
    : null;

  const [firstZoneSquare, secondZoneSquare] = zoneX.zoneSquares;
  if (
    backSquare &&
    sideSquare &&
    whiteKing.square === backSquare &&
    blackKing.square === secondZoneSquare
  ) {
    return getLegalMoveSan(fen, whiteKing.square, sideSquare);
  }

  const targetMove = getLegalMoveSan(
    fen,
    whiteKing.square,
    zoneX.targetKingSquare
  );
  if (whiteKing.square !== zoneX.targetKingSquare && targetMove) {
    return targetMove;
  }

  if (
    whiteKing.square === zoneX.targetKingSquare &&
    blackKing.square === firstZoneSquare &&
    backSquare
  ) {
    return getLegalMoveSan(fen, whiteKing.square, backSquare);
  }
  if (
    sideSquare &&
    whiteKing.square === sideSquare &&
    blackKing.square === firstZoneSquare
  ) {
    return getLegalMoveSan(
      fen,
      whiteKing.square,
      zoneX.targetKingSquare
    );
  }

  return undefined;
}

export function getKnightAndBishopEstablishedZoneXKnightRouteTarget(
  fen: string
): Square | undefined {
  const bishop = findPiece(fen, "w", "b");
  const blackKing = findPiece(fen, "b", "k");
  const whiteKing = findPiece(fen, "w", "k");
  if (!bishop || !blackKing || !whiteKing) {
    return undefined;
  }

  const canonical = {
    blackKingSquares: ["a2", "a1"] as Square[],
    whiteKing: "c3" as Square,
    bishop: "c2" as Square,
    knightRouteTarget: "b3" as Square,
  };
  const targets = new Set<Square>();

  SQUARE_TRANSFORMS.forEach((transform) => {
    if (transformSquare(canonical.bishop, transform) !== bishop.square) {
      return;
    }
    if (
      !canonical.blackKingSquares
        .map((square) => transformSquare(square, transform))
        .includes(blackKing.square)
    ) {
      return;
    }
    if (transformSquare(canonical.whiteKing, transform) !== whiteKing.square) {
      return;
    }
    const target = transformSquare(canonical.knightRouteTarget, transform);
    if (edgeDistance(target) > 0) {
      targets.add(target);
    }
  });

  return [...targets].sort()[0];
}

export function getKnightAndBishopEstablishedZoneXKnightRouteScore(
  fen: string,
  resultFen: string,
  move: ReturnType<Chess["move"]>
): number {
  const target = getKnightAndBishopEstablishedZoneXKnightRouteTarget(fen);
  const beforeKnight = findPiece(fen, "w", "n");
  const afterKnight = findPiece(resultFen, "w", "n");
  if (
    !target ||
    !beforeKnight ||
    !afterKnight ||
    move?.piece !== "n" ||
    edgeDistance(afterKnight.square) === 0
  ) {
    return 99;
  }
  const beforeDistance = getKnightDistanceToAnySquare(
    beforeKnight.square,
    [target]
  );
  const afterDistance = getKnightDistanceToAnySquare(
    afterKnight.square,
    [target]
  );
  return afterDistance < beforeDistance ? afterDistance : 99;
}

export function getKnightAndBishopZoneXPrepareScore(
  fen: string,
  _san: string,
  resultFen: string,
  move: ReturnType<Chess["move"]>
): {
  zoneXPrepareScore: number;
  zoneXPreparePieceProximity: number;
  zoneXDriftScore: number;
} {
  const setup = getKnightAndBishopZoneXSetup(fen);
  if (!setup) {
    const resultSetup = getKnightAndBishopZoneXSetup(resultFen);
    if (
      resultSetup &&
      knightAndBishopAllBlackRepliesPreserveZoneXSetup(
        resultFen,
        resultSetup
      )
    ) {
      return {
        zoneXPrepareScore: 0,
        zoneXPreparePieceProximity:
          getKnightAndBishopZoneXSetupPieceProximity(resultFen),
        zoneXDriftScore: 99,
      };
    }
    const driftTarget = getKnightAndBishopZoneXKnightDriftTarget(fen);
    const beforeKnight = findPiece(fen, "w", "n");
    const afterKnight = findPiece(resultFen, "w", "n");
    if (driftTarget && beforeKnight && afterKnight && move?.piece === "n") {
      const beforeDistance = getKnightDistanceToAnySquare(
        beforeKnight.square,
        [driftTarget]
      );
      const afterDistance = getKnightDistanceToAnySquare(
        afterKnight.square,
        [driftTarget]
      );
      if (afterDistance < beforeDistance) {
        return {
          zoneXPrepareScore: afterDistance,
          zoneXPreparePieceProximity: 0,
          zoneXDriftScore: 0,
        };
      }
    }
    return {
      zoneXPrepareScore: 99,
      zoneXPreparePieceProximity: 99,
      zoneXDriftScore: 99,
    };
  }

  if (knightAndBishopHasZoneXKingProgressMove(fen)) {
    const beforeWhiteKing = findPiece(fen, "w", "k");
    const beforeBlackKing = findPiece(fen, "b", "k");
    const afterWhiteKing = findPiece(resultFen, "w", "k");
    const afterBlackKing = findPiece(resultFen, "b", "k");
    const movedKingCloser =
      move?.piece === "k" &&
      beforeWhiteKing &&
      beforeBlackKing &&
      afterWhiteKing &&
      afterBlackKing &&
      manhattanDistance(afterWhiteKing.square, afterBlackKing.square) <
        manhattanDistance(beforeWhiteKing.square, beforeBlackKing.square);
    return {
      zoneXPrepareScore: movedKingCloser
        ? manhattanDistance(afterWhiteKing!.square, afterBlackKing!.square)
        : 99,
      zoneXPreparePieceProximity: movedKingCloser
        ? kingDistance(afterWhiteKing!.square, afterBlackKing!.square)
        : 99,
      zoneXDriftScore: 99,
    };
  }

  const knight = findPiece(resultFen, "w", "n");
  if (!knight) {
    return {
      zoneXPrepareScore: 0,
      zoneXPreparePieceProximity: 0,
      zoneXDriftScore: 99,
    };
  }
  const knightDistance = getKnightDistanceToAnySquare(
    knight.square,
    setup.stableKnightSquares
  );
  const knightAlreadyPlaced = setup.stableKnightSquares.includes(knight.square);
  const knightMovePenalty = move?.piece === "n" || knightAlreadyPlaced ? 0 : 99;
  return {
    zoneXPrepareScore: knightMovePenalty + knightDistance,
    zoneXPreparePieceProximity:
      getKnightAndBishopZoneXSetupPieceProximity(resultFen),
    zoneXDriftScore: 99,
  };
}

export function knightAndBishopAllBlackRepliesPreserveZoneXSetup(
  fen: string,
  setup = getKnightAndBishopZoneXSetup(fen)
): boolean {
  const chess = getChess(fen);
  if (chess.turn() !== "b" || !setup) {
    return false;
  }
  const replies = chess.moves();
  return (
    replies.length > 0 &&
    replies.every((san) => {
      const next = getChess(fen);
      next.move(san);
      const replyFen = next.fen();
      const replySetup = getKnightAndBishopZoneXSetup(replyFen);
      return (
        Boolean(
          replySetup &&
            sameKnightAndBishopZoneXSetup(replySetup, setup)
        ) || Boolean(getKnightAndBishopZone5(replyFen))
      );
    })
  );
}

export function sameKnightAndBishopZoneXSetup(
  a: KnightAndBishopZoneXSetup,
  b: KnightAndBishopZoneXSetup
): boolean {
  return (
    a.bishopSquare === b.bishopSquare &&
    [...a.blackAnchorSquares].sort().join("/") ===
      [...b.blackAnchorSquares].sort().join("/") &&
    [...a.stableKnightSquares].sort().join("/") ===
      [...b.stableKnightSquares].sort().join("/")
  );
}

export function knightAndBishopHasZoneXKingProgressMove(fen: string): boolean {
  const beforeWhiteKing = findPiece(fen, "w", "k");
  const beforeBlackKing = findPiece(fen, "b", "k");
  if (!beforeWhiteKing || !beforeBlackKing) {
    return false;
  }
  const beforeDistance = manhattanDistance(
    beforeWhiteKing.square,
    beforeBlackKing.square
  );
  return getChess(fen).moves().some((san) => {
    const chess = getChess(fen);
    const move = chess.move(san);
    if (move?.captured === "k") {
      return false;
    }
    const whiteKing = findPiece(chess.fen(), "w", "k");
    const blackKing = findPiece(chess.fen(), "b", "k");
    return Boolean(
      move?.piece === "k" &&
      whiteKing &&
      blackKing &&
      manhattanDistance(whiteKing.square, blackKing.square) < beforeDistance
    );
  });
}

export function getKnightAndBishopZoneXSetupPieceProximity(fen: string): number {
  const knight = findPiece(fen, "w", "n");
  const whiteKing = findPiece(fen, "w", "k");
  const bishop = findPiece(fen, "w", "b");
  if (!knight || !whiteKing || !bishop) {
    return 99;
  }
  return (
    kingDistance(knight.square, whiteKing.square) +
    kingDistance(knight.square, bishop.square)
  );
}

export function getKnightDistanceToAnySquare(
  from: Square,
  targets: readonly Square[]
): number {
  const targetSet = new Set(targets);
  if (targetSet.has(from)) {
    return 0;
  }
  const queue = [from];
  const distance = new Map<Square, number>([[from, 0]]);
  for (let head = 0; head < queue.length; head += 1) {
    const square = queue[head];
    const nextDistance = distance.get(square)! + 1;
    for (const next of allSquares()) {
      if (!isKnightMove(square, next) || distance.has(next)) {
        continue;
      }
      if (targetSet.has(next)) {
        return nextDistance;
      }
      distance.set(next, nextDistance);
      queue.push(next);
    }
  }
  return 99;
}

export function getZoneXEdgeDirection(
  zoneX: KnightAndBishopZone5
): { file: number; rank: number } | undefined {
  const edgeSquare = squareCoords(zoneX.zoneSquares[0]);
  if (edgeSquare.rank === 7) {
    return { file: 0, rank: 1 };
  }
  if (edgeSquare.rank === 0) {
    return { file: 0, rank: -1 };
  }
  if (edgeSquare.file === 7) {
    return { file: 1, rank: 0 };
  }
  if (edgeSquare.file === 0) {
    return { file: -1, rank: 0 };
  }
  return undefined;
}

export function getLegalMoveSan(
  fen: string,
  from: Square,
  to: Square
): string | undefined {
  if (from === to) {
    return undefined;
  }
  try {
    const result = getChess(fen).move({ from, to });
    return result?.san;
  } catch {
    return undefined;
  }
}
