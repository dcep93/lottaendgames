import { findPiece, getChess, SQUARE_TRANSFORMS, transformSquare } from '../chess';

// Absolute corner-relative pattern: rotations/reflections, never translations.
const patterns = SQUARE_TRANSFORMS.map(transform => ({
  king: transformSquare('d5', transform),
  bishop: transformSquare('c6', transform),
  black: transformSquare('b6', transform),
  target: transformSquare('d6', transform),
}));

export function knightAndBishopSixPointNineMove(fen: string): string | undefined {
  if (fen.split(' ')[1] !== 'w') return undefined;
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b'), black = findPiece(fen, 'b', 'k');
  const pattern = patterns.find(p => p.king === king?.square && p.bishop === bishop?.square && p.black === black?.square);
  if (!pattern) return undefined;
  return getChess(fen).moves({ verbose: true }).some(move => move.from === pattern.king && move.to === pattern.target)
    ? pattern.king + pattern.target : undefined;
}
