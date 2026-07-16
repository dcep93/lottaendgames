import {
  findPiece,
  isKnightMove,
  kingDistance,
  manhattanDistance,
  squareCoords,
  squaredEuclideanDistance,
} from '../chess'
import {
  centerDistance,
  getSquaresInFrontOfWhiteKingBetweenKings,
  isMiddle16Square,
  middle16Distance,
  sameDiagonal,
  sameSquareColor,
} from './bishopKnightGeometry'

export function knightAndBishopKingCloserOppositeBishopScore(
  fen: string,
  resultFen: string,
  piece: string | undefined
): number {
  if (piece !== "k") {
    return 99;
  }
  const beforeWhiteKing = findPiece(fen, "w", "k");
  const beforeBlackKing = findPiece(fen, "b", "k");
  const afterWhiteKing = findPiece(resultFen, "w", "k");
  const afterBlackKing = findPiece(resultFen, "b", "k");
  const bishop = findPiece(resultFen, "w", "b");
  if (
    !beforeWhiteKing ||
    !beforeBlackKing ||
    !afterWhiteKing ||
    !afterBlackKing ||
    !bishop
  ) {
    return 99;
  }
  if (
    isMiddle16Square(beforeWhiteKing.square) &&
    !isMiddle16Square(afterWhiteKing.square)
  ) {
    return 99;
  }
  if (
    knightAndBishopKingApproachesMiddle16(fen, resultFen, piece)
  ) {
    return 50 + middle16Distance(afterWhiteKing.square);
  }

  const afterDistance = squaredEuclideanDistance(
    afterWhiteKing.square,
    afterBlackKing.square
  );
  if (
    afterDistance >=
    squaredEuclideanDistance(
      beforeWhiteKing.square,
      beforeBlackKing.square
    )
  ) {
    return 99;
  }
  return sameSquareColor(afterWhiteKing.square, bishop.square) &&
    !isKnightAndBishopDiagonalBishopApproachShape(fen)
    ? 99
    : afterDistance;
}

export function knightAndBishopKingApproachesMiddle16(
  fen: string,
  resultFen: string,
  piece: string | undefined
): boolean {
  if (piece !== "k") {
    return false;
  }
  const beforeWhiteKing = findPiece(fen, "w", "k");
  const afterWhiteKing = findPiece(resultFen, "w", "k");
  return Boolean(
    beforeWhiteKing &&
    afterWhiteKing &&
    !isMiddle16Square(beforeWhiteKing.square) &&
    middle16Distance(afterWhiteKing.square) <
    middle16Distance(beforeWhiteKing.square)
  );
}

export function knightAndBishopKingDistanceRegressionScore(
  fen: string,
  resultFen: string,
  piece: string | undefined
): number {
  if (piece !== "k") {
    return 0;
  }
  const beforeWhiteKing = findPiece(fen, "w", "k");
  const beforeBlackKing = findPiece(fen, "b", "k");
  const afterWhiteKing = findPiece(resultFen, "w", "k");
  const afterBlackKing = findPiece(resultFen, "b", "k");
  if (!beforeWhiteKing || !beforeBlackKing || !afterWhiteKing || !afterBlackKing) {
    return 0;
  }
  const beforeDistance = squaredEuclideanDistance(
    beforeWhiteKing.square,
    beforeBlackKing.square
  );
  const afterDistance = squaredEuclideanDistance(
    afterWhiteKing.square,
    afterBlackKing.square
  );
  return Math.max(0, afterDistance - beforeDistance);
}

export function knightAndBishopBishopFrontPreparationScore(
  fen: string,
  resultFen: string,
  piece: string | undefined
): number {
  if (
    piece !== "b" ||
    isKnightAndBishopBishopOppositionLoopShape(fen)
  ) {
    return 99;
  }
  const whiteKing = findPiece(resultFen, "w", "k");
  const blackKing = findPiece(resultFen, "b", "k");
  const bishop = findPiece(resultFen, "w", "b");
  if (!whiteKing || !blackKing || !bishop) {
    return 99;
  }
  const frontSquares = getSquaresInFrontOfWhiteKingBetweenKings(
    whiteKing.square,
    blackKing.square
  );
  const preparedFrontSquare = frontSquares.find((frontSquare) =>
    sameDiagonal(bishop.square, frontSquare)
  );
  if (!preparedFrontSquare) {
    return 99;
  }
  if (bishop.square === preparedFrontSquare) {
    return 99;
  }
  return 0;
}

export function knightAndBishopBishopInFrontScore(
  fen: string,
  resultFen: string,
  piece: string | undefined
): number {
  if (
    piece === "b" &&
    isKnightAndBishopBishopOppositionLoopShape(fen)
  ) {
    return 1;
  }
  const whiteKing = findPiece(resultFen, "w", "k");
  const blackKing = findPiece(resultFen, "b", "k");
  const bishop = findPiece(resultFen, "w", "b");
  if (!whiteKing || !blackKing || !bishop) {
    return 0;
  }

  const frontSquares = getSquaresInFrontOfWhiteKingBetweenKings(
    whiteKing.square,
    blackKing.square
  );
  if (frontSquares.length === 0) {
    return 0;
  }
  return frontSquares.includes(bishop.square) ? 0 : 1;
}

export function isKnightAndBishopBishopOppositionLoopShape(fen: string): boolean {
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const bishop = findPiece(fen, "w", "b");
  if (!whiteKing || !blackKing || !bishop) {
    return false;
  }
  const whiteKingCoords = squareCoords(whiteKing.square);
  const blackKingCoords = squareCoords(blackKing.square);
  const bishopCoords = squareCoords(bishop.square);
  const kingFileDistance = Math.abs(
    whiteKingCoords.file - blackKingCoords.file
  );
  const kingRankDistance = Math.abs(
    whiteKingCoords.rank - blackKingCoords.rank
  );
  const bishopFileDistance = Math.abs(
    bishopCoords.file - whiteKingCoords.file
  );
  const bishopRankDistance = Math.abs(
    bishopCoords.rank - whiteKingCoords.rank
  );
  const kingsAreKnightMoveApart =
    (kingFileDistance === 1 && kingRankDistance === 2) ||
    (kingFileDistance === 2 && kingRankDistance === 1);
  const bishopIsOrthogonallyAdjacent =
    bishopFileDistance + bishopRankDistance === 1;
  const bishopOpposesBlackKing =
    bishopCoords.file === blackKingCoords.file ||
    bishopCoords.rank === blackKingCoords.rank;
  return (
    kingsAreKnightMoveApart &&
    bishopIsOrthogonallyAdjacent &&
    bishopOpposesBlackKing
  );
}

export function isKnightAndBishopDiagonalBishopApproachShape(fen: string): boolean {
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const bishop = findPiece(fen, "w", "b");
  if (!whiteKing || !blackKing || !bishop) {
    return false;
  }
  const whiteKingCoords = squareCoords(whiteKing.square);
  const blackKingCoords = squareCoords(blackKing.square);
  const bishopCoords = squareCoords(bishop.square);
  const kingFileDistance = Math.abs(
    whiteKingCoords.file - blackKingCoords.file
  );
  const kingRankDistance = Math.abs(
    whiteKingCoords.rank - blackKingCoords.rank
  );
  const bishopFileDistance = Math.abs(
    bishopCoords.file - whiteKingCoords.file
  );
  const bishopRankDistance = Math.abs(
    bishopCoords.rank - whiteKingCoords.rank
  );
  return (
    kingFileDistance === 2 &&
    kingRankDistance === 2 &&
    bishopFileDistance + bishopRankDistance === 1 &&
    isKnightMove(bishop.square, blackKing.square)
  );
}

export function knightAndBishopBishopOppositionLoopScore(
  fen: string,
  piece: string | undefined
): number {
  return piece === "b" &&
    isKnightAndBishopBishopOppositionLoopShape(fen)
    ? 1
    : 0;
}

export function knightAndBishopKnightBehindWhiteKingScore(fen: string): number {
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const knight = findPiece(fen, "w", "n");
  if (!whiteKing || !blackKing || !knight) {
    return 0;
  }
  const whiteKingCoords = squareCoords(whiteKing.square);
  const blackKingCoords = squareCoords(blackKing.square);
  const knightCoords = squareCoords(knight.square);
  const kingVector = {
    file: whiteKingCoords.file - blackKingCoords.file,
    rank: whiteKingCoords.rank - blackKingCoords.rank,
  };
  const knightVector = {
    file: knightCoords.file - whiteKingCoords.file,
    rank: knightCoords.rank - whiteKingCoords.rank,
  };
  return kingVector.file * knightVector.file +
    kingVector.rank * knightVector.rank >
    0
    ? 0
    : 1;
}

export function knightAndBishopKnightCentralDistance(fen: string): number {
  const knight = findPiece(fen, "w", "n");
  return knight ? centerDistance(knight.square) : 99;
}

export function knightAndBishopKnightWhiteKingDistance(fen: string): number {
  const knight = findPiece(fen, "w", "n");
  const whiteKing = findPiece(fen, "w", "k");
  return knight && whiteKing
    ? kingDistance(knight.square, whiteKing.square)
    : 99;
}

export function knightAndBishopKnightBlackKingDistance(fen: string): number {
  const knight = findPiece(fen, "w", "n");
  const blackKing = findPiece(fen, "b", "k");
  return knight && blackKing
    ? manhattanDistance(knight.square, blackKing.square)
    : 0;
}
