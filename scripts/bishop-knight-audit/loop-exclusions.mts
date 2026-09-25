import {findPiece, getChess, kingDistance, squareCoordinates} from '../../app/src/mate/chess.ts';

export type LoopExclusion = 'central-bishop-adjacent-knight' | 'degenerate-a' | 'degenerate-b' | 'degenerate-c';

/** Reporting terminals only: these do not alter the production move policy. */
export function loopExclusion(fen: string): LoopExclusion | null {
  const wk = findPiece(fen, 'w', 'k')?.square;
  const bk = findPiece(fen, 'b', 'k')?.square;
  const b = findPiece(fen, 'w', 'b')?.square;
  const n = findPiece(fen, 'w', 'n')?.square;
  if (!wk || !bk || !b || !n) return null;
  const bc = squareCoordinates(b), nc = squareCoordinates(n);
  const dx = Math.abs(bc.file - nc.file), dy = Math.abs(bc.rank - nc.rank);
  if ([3, 4].includes(bc.file) && [3, 4].includes(bc.rank) && dx === 1 && dy === 1) {
    return 'central-bishop-adjacent-knight';
  }
  if (kingDistance(bk, b) !== 1 || kingDistance(bk, n) !== 1) return null;

  // Include an existing defense as well as legal king moves that establish it.
  // Use White to move for the geometric rescue test on either half of a loop.
  const whiteFen = fen.replace(/ [wb] /, ' w ');
  const board = getChess(whiteFen);
  const kingSquares = [wk, ...board.moves({verbose: true}).filter(m => m.piece === 'k').map(m => m.to)];
  const defendsBishop = (s: typeof wk) => kingDistance(s, b) === 1;
  const defendsKnight = (s: typeof wk) => kingDistance(s, n) === 1;
  if (dx * dy === 2 && !defendsBishop(wk) && !kingSquares.some(defendsKnight)) return 'degenerate-a';

  const edgeBishop = [0, 7].includes(bc.file) || [0, 7].includes(bc.rank);
  // Both minors are adjacent to Black, so a diagonal bishop ray can have at
  // most one intervening square. Check actual bishop control, not x-ray control.
  const bishopControlsKnight = dx === dy && dx > 0 && ![wk, bk].some(s => {
    const p = squareCoordinates(s);
    const x = p.file - bc.file, y = p.rank - bc.rank;
    return Math.abs(x) === Math.abs(y) && Math.abs(x) > 0 && Math.abs(x) < dx
      && Math.sign(x) === Math.sign(nc.file - bc.file) && Math.sign(y) === Math.sign(nc.rank - bc.rank);
  });
  const knightRescues = board.moves({verbose: true}).filter(m => {
    if (m.piece !== 'n') return false;
    const p = squareCoordinates(m.to);
    return Math.abs(p.file - bc.file) * Math.abs(p.rank - bc.rank) === 2;
  });
  if (edgeBishop && bishopControlsKnight && !kingSquares.some(defendsBishop)
    && !knightRescues.some(m => kingSquares.some(k => kingDistance(k, m.to) === 1))) return 'degenerate-b';
  if (!kingSquares.some(k => defendsBishop(k) && defendsKnight(k))) return 'degenerate-c';
  return null;
}
