import { centerDistance } from './bishopKnightGeometry';
import { findPiece, getChess, squareCoords, squareFromCoordinates } from '../chess';

/** Anchor the king/bishop step to Black's central king, including every D4 orientation. */
export function knightAndBishopFivePointFiveMove(fen: string): string | undefined {
  if (fen.split(' ')[1] !== 'w') return undefined;
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b'), black = findPiece(fen, 'b', 'k');
  if (!king || !bishop || !black || centerDistance(black.square) !== 0) return undefined;
  const white = squareCoords(king.square), dark = squareCoords(black.square), minor = squareCoords(bishop.square);
  const dx = dark.file - white.file, dy = dark.rank - white.rank;
  if (Math.abs(dx) !== 2 || Math.abs(dy) !== 2) return undefined;
  const x = Math.sign(dx), y = Math.sign(dy);
  // The bishop occupies one inward orthogonal neighbor; the king takes the other.
  const target = minor.file === white.file && minor.rank === white.rank + y
    ? squareFromCoordinates(white.file + x, white.rank)
    : minor.file === white.file + x && minor.rank === white.rank
      ? squareFromCoordinates(white.file, white.rank + y) : null;
  if (!target) return undefined;
  return getChess(fen).moves({ verbose: true }).some(move => move.from === king.square && move.to === target)
    ? king.square + target : undefined;
}
