import returnData from './bishopKnightRareReturnData.json';
import {findPiece, getChess, isKnightMove, kingDistance, manhattanDistance, SQUARE_TRANSFORMS, squareCoordinates, squareFromCoords, transformFen, transformSquare} from '../chess';
import type {Square} from 'chess.js';

const exact = new Map(([
  {fen: '8/8/8/8/8/4k3/5N2/5K1B w - - 0 1', from: 'f1', to: 'e1'},
  {fen: '8/8/8/8/3k4/3BN3/4K3/8 w - - 0 1', from: 'd3', to: 'c4'},
] as const).flatMap(position => SQUARE_TRANSFORMS.map(transform => [
  transformFen(position.fen, transform).split(' ')[0],
  transformSquare(position.from, transform) + transformSquare(position.to, transform),
] as const)));

// Case (b) depends only on White's formation, including for return prevention.
const knightEscapes = new Map((['d4', 'e3'] as const).flatMap(knight =>
  SQUARE_TRANSFORMS.map(transform => [
    ['a1', 'b1', knight].map(square => transformSquare(square as Square, transform)).join(''),
    transformSquare(knight, transform) + transformSquare('f5', transform),
  ] as const)));

export function rareEscapeStartingFormation(king?: Square, bishop?: Square, knight?: Square): boolean {
  return !!king && !!bishop && !!knight && knightEscapes.has(king + bishop + knight);
}

/** Cheap conservative guard: can any White move recreate a forbidden formation? */
export function canEnterRareEscapeFormation(king?: Square, bishop?: Square, knight?: Square): boolean {
  if (!king || !bishop || !knight) return false;
  const pieces = [king, bishop, knight];
  for (const key of knightEscapes.keys()) {
    const targets = key.match(/../g)! as Square[];
    const changed = pieces.flatMap((square, i) => square === targets[i] ? [] : [i]);
    if (changed.length === 0) return true;
    if (changed.length !== 1) continue;
    const i = changed[0]!, from = pieces[i]!, to = targets[i]!;
    if (i === 0 && kingDistance(from, to) === 1) return true;
    if (i === 2 && isKnightMove(from, to)) return true;
    const a = squareCoordinates(from), b = squareCoordinates(to);
    if (i === 1 && Math.abs(a.file - b.file) === Math.abs(a.rank - b.rank)) return true;
  }
  return false;
}

const edge = (square: Square) => {
  const {file, rank} = squareCoordinates(square);
  return file === 0 || file === 7 || rank === 0 || rank === 7;
};

/** r4.1: geometric escape, White-only formation, and exact D4 declarations. */
export function rareDegenerateEscapeMove(fen: string): string | undefined {
  const [placement, turn] = fen.split(' ');
  if (turn !== 'w') return undefined;
  const king = findPiece(fen, 'w', 'k')?.square;
  const bishop = findPiece(fen, 'w', 'b')?.square;
  const knight = findPiece(fen, 'w', 'n')?.square;
  let move = king && bishop && knight ? knightEscapes.get(king + bishop + knight) : undefined;
  move ??= exact.get(placement!);
  if (!move) {
    const black = findPiece(fen, 'b', 'k')?.square;
    if (!king || !bishop || !knight || !black || !edge(king) || !edge(bishop) || edge(black)
      || manhattanDistance(king, bishop) !== 1
      || kingDistance(bishop, black) !== 2 || manhattanDistance(bishop, black) !== 2) return undefined;
    const k = squareCoordinates(king), b = squareCoordinates(bishop), n = squareCoordinates(knight);
    const dx = n.file - b.file, dy = n.rank - b.rank;
    if (Math.abs(dx) !== 3 || Math.abs(dy) !== 3
      || (k.file - b.file) * dx + (k.rank - b.rank) * dy >= 0) return undefined;
    const target = squareFromCoords(b.file + 2 * Math.sign(dx), b.rank + 2 * Math.sign(dy));
    if (target) move = bishop + target;
  }
  return move && getChess(fen).moves({verbose: true}).some(candidate => candidate.from + candidate.to === move)
    ? move : undefined;
}

// Derived by the rare-return audit until no new forced-return exclusions
// remain. Expand D4 once; clocks do not affect a positional repetition.
const returnExclusions = new Map<string, Set<string>>();
for (const {fen, moves} of returnData.exclusions) for (const transform of SQUARE_TRANSFORMS) {
  const placement = transformFen(fen, transform).split(' ')[0]!;
  const excluded = returnExclusions.get(placement) ?? new Set<string>();
  for (const move of moves) excluded.add(transformSquare(move.slice(0, 2) as Square, transform)
    + transformSquare(move.slice(2, 4) as Square, transform));
  returnExclusions.set(placement, excluded);
}
export function rareEscapeReturnExcluded(fen: string, move: string): boolean {
  const [placement, turn] = fen.split(' ');
  return turn === 'w' && (returnExclusions.get(placement!)?.has(move) ?? false);
}
