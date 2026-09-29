import {findPiece, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';

// Exact declarations take precedence when older destination diagrams compete.
const exactMoves = new Map(SQUARE_TRANSFORMS.map(transform => [
  transformFen('8/8/8/4k3/2KNB3/8/8/8 w - - 0 1', transform).split(' ')[0],
  transformSquare('e4', transform) + transformSquare('c6', transform),
] as const));

// Declared destination diagrams, independent of the incoming move's source.
// Only D4 symmetries are allowed; there are no translations.
const destinations = [
  {king: 'c4', bishop: 'd5', knight: 'd4', black: 'd6'},
  {king: 'd6', bishop: 'd5', knight: 'd4', black: 'f4'},
  {king: 'd3', bishop: 'f5', knight: 'd4', black: 'd5'},
  {king: 'c4', bishop: 'f5', knight: 'd4', black: 'e5'},
  {king: 'e5', bishop: 'f5', knight: 'd4', black: 'e3', movingPiece: 'k'},
  {king: 'c3', bishop: 'c2', knight: 'd4', black: 'd5'},
  {king: 'c4', bishop: 'c2', knight: 'd4', black: 'e5'},
  {king: 'e3', bishop: 'c6', knight: 'd4', black: 'c4', movingPiece: 'b'},
  {king: 'e3', bishop: 'c6', knight: 'd4', black: 'e5', movingPiece: 'b'},
  {king: 'e3', bishop: 'c6', knight: 'd4', black: 'c5', movingPiece: 'b'},
  {king: 'e4', bishop: 'b3', knight: 'd4', black: 'd6'},
] as const;
const diagrams = destinations.flatMap(position => SQUARE_TRANSFORMS.map(transform => ({
  white: [position.king, position.bishop, position.knight].map(square => transformSquare(square, transform)),
  black: transformSquare(position.black, transform),
  movingPiece: 'movingPiece' in position ? position.movingPiece : undefined,
})));

export function declaredCentralNavigationMoves(fen: string): readonly string[] {
  const exact = exactMoves.get(fen.split(' ')[0]);
  if (exact) return getChess(fen).moves({verbose: true})
    .filter(move => move.from + move.to === exact).map(move => move.from + move.to);
  const white = [findPiece(fen, 'w', 'k'), findPiece(fen, 'w', 'b'), findPiece(fen, 'w', 'n')];
  const black = findPiece(fen, 'b', 'k')?.square;
  const candidates = new Set<string>();
  for (const diagram of diagrams) {
    if (black !== diagram.black) continue;
    const changed = white.map((piece, i) => piece?.square === diagram.white[i] ? -1 : i).filter(i => i !== -1);
    if (changed.length !== 1) continue;
    const i = changed[0]!;
    if (diagram.movingPiece && white[i]?.type !== diagram.movingPiece) continue;
    if (white[i]) candidates.add(white[i]!.square + diagram.white[i]);
  }
  if (!candidates.size) return [];
  return getChess(fen).moves({verbose: true}).map(move => move.from + move.to).filter(move => candidates.has(move));
}
