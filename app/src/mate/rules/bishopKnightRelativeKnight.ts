import { findPiece, getChess, squareCoordinates, squareFromCoordinates, SQUARE_TRANSFORMS, transformSquare } from '../chess';

// Relative to White Ke2: Black Kf4, Nf3, and destination d2.
const patterns = SQUARE_TRANSFORMS.map(transform => {
  const king = squareCoordinates(transformSquare('e2', transform));
  const offset = (square: 'f4' | 'f3' | 'd2') => {
    const point = squareCoordinates(transformSquare(square, transform));
    return { file: point.file - king.file, rank: point.rank - king.rank };
  };
  return { black: offset('f4'), knight: offset('f3'), target: offset('d2') };
});

export function knightAndBishopRelativeKnightMove(fen: string): string | undefined {
  const king = findPiece(fen, 'w', 'k'), black = findPiece(fen, 'b', 'k'), knight = findPiece(fen, 'w', 'n');
  if (!king || !black || !knight || fen.split(' ')[1] !== 'w') return undefined;
  const k = squareCoordinates(king.square), b = squareCoordinates(black.square), n = squareCoordinates(knight.square);
  const pattern = patterns.find(p => b.file - k.file === p.black.file && b.rank - k.rank === p.black.rank
    && n.file - k.file === p.knight.file && n.rank - k.rank === p.knight.rank);
  if (!pattern) return undefined;
  const to = squareFromCoordinates(k.file + pattern.target.file, k.rank + pattern.target.rank);
  return to && getChess(fen).moves({verbose: true}).some(move => move.from === knight.square && move.to === to)
    ? knight.square + to : undefined;
}
