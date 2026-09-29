import {findPiece, getChess, kingDistance, squareCoordinates, squareColor} from '../../app/src/mate/chess.ts';

export type LoopExclusion = 'degenerate-a' | 'degenerate-b' | 'degenerate-c';

/** Reporting terminals only: these do not alter the production move policy. */
export function loopExclusion(fen: string): LoopExclusion | null {
  const wk = findPiece(fen, 'w', 'k')?.square;
  const bk = findPiece(fen, 'b', 'k')?.square;
  const b = findPiece(fen, 'w', 'b')?.square;
  const n = findPiece(fen, 'w', 'n')?.square;
  if (!wk || !bk || !b || !n) return null;
  const bc = squareCoordinates(b), nc = squareCoordinates(n);
  const dx = Math.abs(bc.file - nc.file), dy = Math.abs(bc.rank - nc.rank);
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

/** Whether this individual position achieves all r4 objectives. */
export function fullySatisfiesR4(fen: string): boolean {
  const pieces = ['k', 'b', 'n'].map(type => findPiece(fen, 'w', type as 'k' | 'b' | 'n')?.square);
  const [king, bishop, knight] = pieces;
  return !!king && !!bishop && !!knight
    && pieces.every(square => square && ['d4', 'e4', 'd5', 'e5'].includes(square))
    && squareColor(king) !== squareColor(bishop)
    && squareColor(knight) !== squareColor(bishop);
}

export function loopSearchExclusion(fen: string): LoopExclusion | null {
  // Keep complete-r4 positions traversable: a cycle may leave the formation.
  return loopExclusion(fen);
}

/** Defer only cycles whose every ply satisfies r4; full audits include them. */
export function deferredCompleteR4Loop(positions: readonly string[]): boolean {
  return positions.length > 0 && positions.every(fullySatisfiesR4);
}

/** Defer the four-ply knight-check cycle alternating opposition to N and K. */
export function deferredKnightOppositionCycle(whitePositions: readonly string[], whiteMoves: readonly string[]): boolean {
  if (whitePositions.length !== 2 || whiteMoves.length !== 2
    || !whiteMoves.every(move => move.startsWith('N') && move.endsWith('+'))) return false;
  const opposition = (a: Parameters<typeof squareCoordinates>[0], b: Parameters<typeof squareCoordinates>[0]) => {
    const x = squareCoordinates(a);
    const y = squareCoordinates(b);
    return (x.file === y.file && Math.abs(x.rank - y.rank) === 2)
      || (x.rank === y.rank && Math.abs(x.file - y.file) === 2);
  };
  const phases = whitePositions.map(fen => {
    const king = findPiece(fen, 'w', 'k')?.square, knight = findPiece(fen, 'w', 'n')?.square;
    const black = findPiece(fen, 'b', 'k')?.square;
    return {king: !!king && !!black && opposition(king, black), knight: !!knight && !!black && opposition(knight, black)};
  });
  return (phases[0]!.king && phases[1]!.knight) || (phases[1]!.king && phases[0]!.knight);
}
