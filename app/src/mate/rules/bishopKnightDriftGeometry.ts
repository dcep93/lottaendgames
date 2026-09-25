import type {Square} from 'chess.js';
import {allSquares, isKnightMove, kingDistance, squareCoordinates, squaredEuclideanDistance} from '../chess';

const squares = allSquares();
const neighbours = new Map(squares.map(s => [s, squares.filter(t => kingDistance(s, t) === 1)]));
const jumps = new Map(squares.map(s => [s, squares.filter(t => isKnightMove(s, t))]));

function bishopControls(bishop: Square, target: Square, blockers: readonly Square[]): boolean {
  const b = squareCoordinates(bishop), t = squareCoordinates(target);
  const dx = t.file - b.file, dy = t.rank - b.rank;
  if (!dx || Math.abs(dx) !== Math.abs(dy)) return false;
  return !blockers.some(s => {
    const p = squareCoordinates(s), x = p.file - b.file, y = p.rank - b.rank;
    return Math.abs(x) > 0 && Math.abs(x) < Math.abs(dx) && Math.abs(x) === Math.abs(y)
      && Math.sign(x) === Math.sign(dx) && Math.sign(y) === Math.sign(dy);
  });
}

/** Local geometry only: no chess move generation or response search. */
export function knightDriftThreatPenalty(white: Square, bishop: Square, knight: Square, black: Square, knightMoved: boolean): number {
  let penalty = 0;
  for (const threat of neighbours.get(black)!) {
    if (threat === knight || threat === bishop || kingDistance(threat, white) <= 1
      || isKnightMove(knight, threat) || bishopControls(bishop, threat, [white, knight])) continue;
    if (kingDistance(threat, knight) !== 1) continue;
    // A chase cannot force retreat when the knight can jump into king protection.
    if (knightMoved && jumps.get(knight)!.some(s => s !== white && s !== bishop && s !== threat
      && kingDistance(s, white) === 1)) continue;
    // A protected forward stepping stone also lets the knight escape a chase.
    if (knightMoved && jumps.get(knight)!.some(s => s !== white && s !== bishop && s !== threat
      && squaredEuclideanDistance(s, white) < squaredEuclideanDistance(knight, white)
      && kingDistance(s, bishop) > 1 && bishopControls(bishop, s, [white, threat]))) continue;
    if (kingDistance(threat, white) < kingDistance(knight, white)) penalty = 1;
    if (!knightMoved) continue;
    // An existing defense or a single safe king step makes the knight reachable.
    if (kingDistance(white, knight) === 1 || bishopControls(bishop, knight, [white, threat])
      || neighbours.get(white)!.some(s => s !== bishop && s !== knight
        && kingDistance(s, knight) === 1 && kingDistance(s, threat) > 1)) continue;
    const safeForwardJump = jumps.get(knight)!.some(s => s !== white && s !== bishop && s !== threat
      && squaredEuclideanDistance(s, white) < squaredEuclideanDistance(knight, white)
      && (kingDistance(s, threat) > 1 || kingDistance(s, white) === 1 || bishopControls(bishop, s, [white, threat])));
    if (!safeForwardJump) return 2;
  }
  return penalty;
}
