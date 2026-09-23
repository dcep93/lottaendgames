import { findPiece, getChess, SQUARE_TRANSFORMS, transformSquare } from '../chess';

// Fixed board placements: D4 symmetries only, without translations.
const patterns = SQUARE_TRANSFORMS.map(transform => ({
  king: transformSquare('c3', transform),
  bishop: transformSquare('c4', transform),
  black: transformSquare('e5', transform),
  target: transformSquare('d3', transform),
}));

export function knightAndBishopFivePointFiveMove(fen: string): string | undefined {
  if (fen.split(' ')[1] !== 'w') return undefined;
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b'), black = findPiece(fen, 'b', 'k');
  const pattern = patterns.find(p => king?.square === p.king && bishop?.square === p.bishop && black?.square === p.black);
  if (!pattern) return undefined;
  return getChess(fen).moves({ verbose: true }).some(move => move.from === pattern.king && move.to === pattern.target)
    ? pattern.king + pattern.target : undefined;
}
