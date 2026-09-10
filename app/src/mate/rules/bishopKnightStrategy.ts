import {
  edgeDistance,
  findPiece,
  isKnightMove,
  kingDistance,
  squareCoords,
  squaredEuclideanDistance,
} from '../chess'
import {
  centerDistance,
  isMiddle16Square,
  middle16Distance,
  sameSquareColor,
} from './bishopKnightGeometry'

export function knightAndBishopBishopWallScore(fen: string): number {
  const whiteKing = findPiece(fen, 'w', 'k')
  const blackKing = findPiece(fen, 'b', 'k')
  const bishop = findPiece(fen, 'w', 'b')
  if (!whiteKing || !blackKing || !bishop) return 2

  const whiteKingCoords = squareCoords(whiteKing.square)
  const blackKingCoords = squareCoords(blackKing.square)
  const bishopCoords = squareCoords(bishop.square)
  const edgeAdjacent =
    Math.abs(bishopCoords.file - whiteKingCoords.file) +
      Math.abs(bishopCoords.rank - whiteKingCoords.rank) ===
    1
  if (!edgeAdjacent) return 2

  const blackFile = blackKingCoords.file - whiteKingCoords.file
  const blackRank = blackKingCoords.rank - whiteKingCoords.rank
  const bishopFile = bishopCoords.file - whiteKingCoords.file
  const bishopRank = bishopCoords.rank - whiteKingCoords.rank
  return blackFile * bishopFile + blackRank * bishopRank > 0 ? 0 : 1
}

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
    edgeDistance(beforeBlackKing.square) > 0 &&
    knightAndBishopKingApproachesMiddle16(fen, resultFen, piece)
  ) {
    return 50 + middle16Distance(afterWhiteKing.square);
  }

  const afterDistance = squaredEuclideanDistance(
    afterWhiteKing.square,
    afterBlackKing.square
  );
  if (
    kingDistance(afterWhiteKing.square, afterBlackKing.square) >=
      kingDistance(beforeWhiteKing.square, beforeBlackKing.square) ||
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

function knightAndBishopKingApproachesMiddle16(
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

function isKnightAndBishopDiagonalBishopApproachShape(fen: string): boolean {
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

export function knightAndBishopKnightCentralDistance(fen: string): number {
  const knight = findPiece(fen, "w", "n");
  return knight ? centerDistance(knight.square) : 99;
}
