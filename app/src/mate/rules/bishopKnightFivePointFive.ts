import type { Square } from 'chess.js';
import { centerDistance } from './bishopKnightGeometry';
import { findPiece, getChess, SQUARE_TRANSFORMS, transformSquare } from '../chess';

// Fixed board placements: D4 symmetries only, without translations.
const steps: readonly { king: Square; bishop: Square; target: Square }[] = [
  { king: 'c3', bishop: 'c4', target: 'd3' },
  { king: 'c7', bishop: 'c6', target: 'd7' },
];
const patterns = steps.flatMap(step => SQUARE_TRANSFORMS.map(transform => ({
  king: transformSquare(step.king, transform),
  bishop: transformSquare(step.bishop, transform),
  target: transformSquare(step.target, transform),
})));

export function knightAndBishopFivePointFiveMove(fen: string): string | undefined {
  if (fen.split(' ')[1] !== 'w') return undefined;
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b'), black = findPiece(fen, 'b', 'k');
  if (!black || centerDistance(black.square) !== 0) return undefined;
  const pattern = patterns.find(p => king?.square === p.king && bishop?.square === p.bishop);
  if (!pattern) return undefined;
  return getChess(fen).moves({ verbose: true }).some(move => move.from === pattern.king && move.to === pattern.target)
    ? pattern.king + pattern.target : undefined;
}
