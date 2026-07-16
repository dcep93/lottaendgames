import type { Square } from 'chess.js'
import {
  edgeDistance,
  findPiece,
  getChess,
  hasDirectKingOpposition,
  kingDistance,
  squareCoords,
  squareFromCoords,
} from '../chess'
import {
  bishopControlsOrOccupiesSquare,
  sameSquareColor,
} from './bishopKnightGeometry'

export function isKnightAndBishopKeySquarePattern(fen: string): boolean {
  return getKnightAndBishopKeySquarePatternScore(fen) < 2;
}

export function getKnightAndBishopKeySquarePatternScore(fen: string): number {
  const bishop = findPiece(fen, "w", "b");
  const whiteKing = findPiece(fen, "w", "k");
  const blackKing = findPiece(fen, "b", "k");
  const knight = findPiece(fen, "w", "n");
  if (!bishop || !whiteKing || !blackKing || !knight) {
    return 2;
  }

  if (edgeDistance(blackKing.square) !== 0) {
    return 2;
  }

  const whiteKingCoords = squareCoords(whiteKing.square);
  const keySquares = getEdgeDirectionsForSquare(blackKing.square)
    .map((direction) => {
      const blackKingCoords = squareCoords(blackKing.square);
      const axis = direction.file !== 0 ? "file" : "rank";
      if (
        whiteKingCoords[axis] ===
        blackKingCoords[axis] - direction[axis] * 2
      ) {
        return squareFromCoords(
          whiteKingCoords.file + direction.file,
          whiteKingCoords.rank + direction.rank
        );
      }
      return null;
    })
    .filter(
      (square): square is Square =>
        square != null &&
        edgeDistance(square) > 0 &&
        kingDistance(square, blackKing.square) === 1 &&
        sameSquareColor(square, bishop.square)
    );
  if (keySquares.length === 0) {
    return 2;
  }

  const kingsInOpposition = hasDirectKingOpposition(
    whiteKing.square,
    blackKing.square
  );

  return keySquares.reduce((bestScore, keySquare) => {
    if (kingsInOpposition) {
      if (knight.square === keySquare) {
        return Math.min(bestScore, 0);
      }
      if (
        edgeDistance(knight.square) > 0 &&
        knightControlsSquare(knight.square, keySquare)
      ) {
        return Math.min(bestScore, 1);
      }
      return bestScore;
    }

    const escapeSquare = getKnightAndBishopPrePrepareEscapeSquare(
      blackKing.square,
      whiteKing.square,
      keySquare
    );
    if (
      knight.square === keySquare &&
      escapeSquare != null &&
      bishopControlsOrOccupiesSquare(
        fen,
        bishop.square,
        escapeSquare
      )
    ) {
      return Math.min(bestScore, 0);
    }
    return bestScore;
  }, 2);
}

export function getEdgeDirectionsForSquare(
  square: Square
): Array<{ file: -1 | 0 | 1; rank: -1 | 0 | 1 }> {
  const coords = squareCoords(square);
  const directions: Array<{ file: -1 | 0 | 1; rank: -1 | 0 | 1 }> = [];
  if (coords.rank === 7) {
    directions.push({ file: 0, rank: 1 });
  }
  if (coords.rank === 0) {
    directions.push({ file: 0, rank: -1 });
  }
  if (coords.file === 7) {
    directions.push({ file: 1, rank: 0 });
  }
  if (coords.file === 0) {
    directions.push({ file: -1, rank: 0 });
  }
  return directions;
}

export function getAdjacentSquares(square: Square): Square[] {
  const coords = squareCoords(square);
  const squares: Square[] = [];
  for (let fileOffset = -1; fileOffset <= 1; fileOffset += 1) {
    for (let rankOffset = -1; rankOffset <= 1; rankOffset += 1) {
      if (fileOffset === 0 && rankOffset === 0) {
        continue;
      }
      const adjacent = squareFromCoords(
        coords.file + fileOffset,
        coords.rank + rankOffset
      );
      if (adjacent) {
        squares.push(adjacent);
      }
    }
  }
  return squares;
}

export function getKnightAndBishopPrePrepareEscapeSquare(
  blackKing: Square,
  whiteKing: Square,
  keySquare: Square
): Square | undefined {
  const blackKingCoords = squareCoords(blackKing);
  const whiteKingCoords = squareCoords(whiteKing);
  const keyCoords = squareCoords(keySquare);
  const diagonalSquares = getAdjacentSquares(blackKing).filter(
    (square) => {
      const coords = squareCoords(square);
      return (
        Math.abs(coords.file - blackKingCoords.file) === 1 &&
        Math.abs(coords.rank - blackKingCoords.rank) === 1
      );
    }
  );
  return diagonalSquares
    .filter((square) => square !== keySquare)
    .sort((a, b) => {
      const aDistance = kingDistance(a, whiteKing);
      const bDistance = kingDistance(b, whiteKing);
      if (aDistance !== bDistance) {
        return bDistance - aDistance;
      }
      const aAwayScore =
        Math.sign(squareCoords(a).file - blackKingCoords.file) *
        Math.sign(blackKingCoords.file - whiteKingCoords.file) +
        Math.sign(squareCoords(a).rank - blackKingCoords.rank) *
        Math.sign(blackKingCoords.rank - whiteKingCoords.rank);
      const bAwayScore =
        Math.sign(squareCoords(b).file - blackKingCoords.file) *
        Math.sign(blackKingCoords.file - whiteKingCoords.file) +
        Math.sign(squareCoords(b).rank - blackKingCoords.rank) *
        Math.sign(blackKingCoords.rank - whiteKingCoords.rank);
      if (aAwayScore !== bAwayScore) {
        return bAwayScore - aAwayScore;
      }
      return a.localeCompare(b);
    })
    .find((square) => {
      const coords = squareCoords(square);
      return (
        Math.abs(coords.file - keyCoords.file) +
        Math.abs(coords.rank - keyCoords.rank) >
        0
      );
    });
}

export function knightControlsSquare(knight: Square, target: Square): boolean {
  const knightCoords = squareCoords(knight);
  const targetCoords = squareCoords(target);
  const fileDistance = Math.abs(knightCoords.file - targetCoords.file);
  const rankDistance = Math.abs(knightCoords.rank - targetCoords.rank);
  return (
    (fileDistance === 1 && rankDistance === 2) ||
    (fileDistance === 2 && rankDistance === 1)
  );
}

export function getImmediateMateMoves(fen: string, moves: string[]): string[] {
  return moves.filter((san) => {
    const chess = getChess(fen);
    chess.move(san);
    return chess.isCheckmate();
  });
}
