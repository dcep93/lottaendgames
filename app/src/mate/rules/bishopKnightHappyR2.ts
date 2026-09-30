/** Historical declaration helpers for audit/replay. Runtime r1/r2 use bishopKnightStages. */
import type {Square} from 'chess.js';
import {findPiece, getChess, SQUARE_TRANSFORMS, transformSquare} from '../chess';
import {happyR2DestinationBounds} from './bishopKnightHappyR2Data';

// Prefer a shorter verified continuation, independent of declaration order.
// Matching the full arrival also lets a different piece reach the same goal.
const remainingByDestination = new Map<string, number>();
for (const [key, remaining] of happyR2DestinationBounds) {
  const squares = key.match(/../g)! as Square[];
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = squares.map(square => transformSquare(square, transform)).join('');
    remainingByDestination.set(reflected, Math.min(remaining,
      remainingByDestination.get(reflected) ?? Infinity));
  }
}

export function happyR2Moves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const candidates = getChess(fen).moves({verbose: true}).map(move => {
    const key = ([['w', 'k'], ['w', 'b'], ['w', 'n'], ['b', 'k']] as const)
      .map(([color, piece]) => findPiece(move.after, color, piece)?.square ?? '').join('');
    return {uci: move.from + move.to, remaining: remainingByDestination.get(key) ?? Infinity};
  });
  const best = Math.min(...candidates.map(candidate => candidate.remaining));
  return Number.isFinite(best)
    ? candidates.filter(candidate => candidate.remaining === best).map(candidate => candidate.uci)
    : [];
}
