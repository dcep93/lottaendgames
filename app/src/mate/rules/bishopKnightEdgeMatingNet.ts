/** Historical declaration helpers for audit/replay. Runtime r1/r2 use bishopKnightStages. */
import {findPiece, getChess, squareCoords, squareFromCoords, SQUARE_TRANSFORMS, transformSquare} from '../chess';
import type {Square} from 'chess.js';
import {bishopKnightBlackReplies} from './bishopKnightReplies';
import {bishopControlsOrOccupiesSquare} from './bishopKnightGeometry';

// Edge-pattern preferences declared from the knight-behind-king instruction onward belong to r1.
const edgeFrames = SQUARE_TRANSFORMS.map(transform => ({
  transform,
  coordinates: new Map(Array.from({length: 64}, (_, index) => [
    transformSquare(squareFromCoords(index % 8, Math.floor(index / 8))!, transform),
    {file: index % 8, rank: Math.floor(index / 8)},
  ] as const)),
  diagonal: new Set(Array.from({length: 7}, (_, rank) => transformSquare(squareFromCoords(rank + 1, rank)!, transform))),
}));

// Loaded edge arrivals: Be2+, Kf6, Bc4, Bg8, and later Bg6/Bc4 patterns.
// translated along the edge, so a bishop can arrive from any legal source.
const edgeSequenceDestinations = new Map<string, number>();
for (const [stage, squares] of ([
  ['f5', 'e2', 'g6', 'h5'],
  ['f6', 'e2', 'g6', 'h6'],
  ['f6', 'c4', 'g6', 'h7'],
  ['f6', 'g8', 'g6', 'h6'],
  ['f3', 'g6', 'g4', 'h3'], // 7.Bg6, before Black replies Kh4.
  ['f5', 'c4', 'g6', 'g7'], // 7.Bc4, before Black replies Kh6.
] as Square[][]).entries()) {
  for (let shift = -7; shift <= 7; shift++) {
    const shifted = squares.map(square => {
      const c = squareCoords(square);
      return squareFromCoords(c.file, c.rank + shift);
    });
    if (shifted.some(square => !square)) continue;
    for (const transform of SQUARE_TRANSFORMS) {
      edgeSequenceDestinations.set(shifted.map(square => transformSquare(square!, transform)).join(''), stage + 1);
    }
  }
}

// Additional full-board arrivals from the declared line, before Black's reply.
// These retain their exact geometry under D4, regardless of the arriving piece.
// Early arrivals remain below their established continuations, including
// Bf7 ahead of the reflected Bc4 handoff and Bg8 ahead of reflected Bd5.
for (const [stage, squares] of ([
  ['f6', 'd3', 'g6', 'h7'], // 7.Kf6
  ['f6', 'c4', 'g6', 'g8'], // 8.Bc4+
  ['f6', 'f7', 'g6', 'h7'], // 9.Bf7; prefer continuing over returning to Bd3.
  ['f4', 'c2', 'g4', 'h4'], // 8.Kf4, before Black replies Kh3.
  ['f6', 'c4', 'g6', 'h6'], // 8.Kf6 in the Bc4 branch.
  ['f6', 'g8', 'g6', 'h6'], // 10.Bg8; prefer this exact arrival over shifted Bg4.
  ['c3', 'd5', 'c2', 'c1'], // 11.Bd5; below the reflected Bg8 continuation.
  ['c3', 'e4', 'c2', 'c1'], // 9.Kc3 in the Be4 handoff.
  ['c3', 'd3', 'c2', 'd1'], // 10.Bd3
  ['c3', 'e2', 'c2', 'c1'], // 11.Be2
  ['c3', 'c4', 'c2', 'b1'], // 12.Bc4
  ['d3', 'f3', 'c2', 'd1'], // 10.Bf3+ in the early Nc2 branch.
  ['c3', 'f3', 'c2', 'c1'], // 11.Kc3; before the established bishop continuations.
] as Square[][]).entries()) {
  for (const transform of SQUARE_TRANSFORMS) {
    edgeSequenceDestinations.set(squares.map(square => transformSquare(square, transform)).join(''), [0.5, 7, 6.75, 8, 9, 10, 9.5, 0.75, 1, 1.5, 6.5, 0.6, 0.65][stage]!);
  }
}

export function matingNetEdgeSequenceMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const arrivals = getChess(fen).moves({verbose: true}).map(move => {
    const pieces = [findPiece(move.after, 'w', 'k'), findPiece(move.after, 'w', 'b'),
      findPiece(move.after, 'w', 'n'), findPiece(move.after, 'b', 'k')];
    const rank = pieces.some(piece => !piece) ? 0
      : edgeSequenceDestinations.get(pieces.map(piece => piece!.square).join('')) ?? 0;
    return {move, rank};
  });
  const best = Math.max(0, ...arrivals.map(arrival => arrival.rank));
  return best ? arrivals.filter(arrival => arrival.rank === best).map(({move}) => move.from + move.to) : [];
}

/** Reward the front-knight formation after any move, not just a knight jump. */
export function matingNetFrontKnightMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n'), black = findPiece(fen, 'b', 'k');
  if (!king || !bishop || !knight || !black) return [];
  const frames = edgeFrames.filter(frame => frame.coordinates.get(black.square)!.file === 7);
  if (!frames.length) return [];
  return getChess(fen).moves({verbose: true}).filter(move => {
    const kingSquare = move.piece === 'k' ? move.to : king.square;
    const bishopSquare = move.piece === 'b' ? move.to : bishop.square;
    const knightSquare = move.piece === 'n' ? move.to : knight.square;
    const matches = frames.some(frame => {
      const k = frame.coordinates.get(kingSquare)!, bk = frame.coordinates.get(black.square)!;
      const b = frame.coordinates.get(bishopSquare)!, n = frame.coordinates.get(knightSquare)!;
      if (k.file !== 5 || Math.abs(k.rank - bk.rank) !== 1 || n.file !== 6) return false;
      const oppositeColor = (bk.file + bk.rank) % 2 !== (b.file + b.rank) % 2;
      if (n.rank !== (oppositeColor ? bk.rank : k.rank)) return false;
      if (oppositeColor) return true;
      const escape = squareFromCoords(6, bk.rank + Math.sign(bk.rank - k.rank));
      if (!escape) return false;
      const escapeSquare = transformSquare(escape, frame.transform);
      return bishopSquare !== escapeSquare
        && bishopControlsOrOccupiesSquare(move.after, bishopSquare, escapeSquare);
    });
    if (!matches) return false;
    const after = getChess(move.after), replies = bishopKnightBlackReplies(after, black.square);
    return !replies.some(reply => reply.captured === 'b' || reply.captured === 'n')
      && (replies.length > 0 || after.isCheckmate());
  }).map(move => move.from + move.to);
}

/** In same-color edge opposition, put N between the kings toward the mating corner. */
export function matingNetCornerwardKnightMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n'), black = findPiece(fen, 'b', 'k');
  if (!king || !bishop || !knight || !black) return [];
  // Opposition and bishop color are prerequisites before White moves.
  const frames = edgeFrames.filter(frame => {
    const k = frame.coordinates.get(king.square)!, bk = frame.coordinates.get(black.square)!;
    const b = frame.coordinates.get(bishop.square)!;
    return bk.file === 7 && k.file === 5 && k.rank > 0 && k.rank < 7
      && k.rank === bk.rank && (k.file + k.rank) % 2 === (b.file + b.rank) % 2;
  });
  const matches = (kingSquare: Square, bishopSquare: Square, knightSquare: Square) => frames.some(frame => {
    const k = frame.coordinates.get(kingSquare)!, b = frame.coordinates.get(bishopSquare)!;
    const n = frame.coordinates.get(knightSquare)!, bk = frame.coordinates.get(black.square)!;
    if (k.file !== 5 || k.rank === 0 || k.rank === 7 || k.rank !== bk.rank) return false;
    const color = (b.file + b.rank) % 2;
    if ((k.file + k.rank) % 2 !== color) return false;
    const cornerRank = color === 1 ? 0 : 7;
    return n.file === 6 && n.rank === bk.rank + Math.sign(cornerRank - bk.rank);
  });
  // Once placed, let the existing mating-net continuation advance.
  if (matches(king.square,bishop.square,knight.square)) return [];
  return getChess(fen).moves({verbose: true}).filter(move => {
    if (!matches(move.piece === 'k' ? move.to : king.square,
      move.piece === 'b' ? move.to : bishop.square,
      move.piece === 'n' ? move.to : knight.square)) return false;
    const after = getChess(move.after), replies = bishopKnightBlackReplies(after, black.square);
    return !replies.some(reply => reply.captured === 'b' || reply.captured === 'n')
      && (replies.length > 0 || after.isCheckmate());
  }).map(move => move.from + move.to);
}

/** On the far edge, put N behind the opposing king, then follow Black in opposition. */
export function matingNetEdgeOppositionMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n'), black = findPiece(fen, 'b', 'k');
  if (!king || !bishop || !knight || !black) return [];
  const legal = getChess(fen).moves({verbose: true});
  for (const frame of edgeFrames) {
    if (!frame.diagonal.has(bishop.square)) continue;
    const k = frame.coordinates.get(king.square)!, n = frame.coordinates.get(knight.square)!;
    const b = frame.coordinates.get(bishop.square)!, bk = frame.coordinates.get(black.square)!;
    if (bk.file !== 7 || k.file !== 5) continue;
    const sameColor = (bk.file + bk.rank) % 2 === (b.file + b.rank) % 2;
    // Both declared entries start in opposition: same-color Black puts N
    // on the same rank; opposite-color Black puts N one rank above.
    const placing = k.rank === bk.rank;
    const knightRank = bk.rank + (sameColor ? 0 : 1);
    // Once N is on its post, the king can follow an adjacent edge shuffle.
    const placed = n.file === 4 && (n.file + n.rank) % 2 !== (b.file + b.rank) % 2
      && Math.abs(n.rank - k.rank) <= 1 && Math.abs(n.rank - bk.rank) <= 1;
    const choices = legal.filter(move => {
      const to = frame.coordinates.get(move.to)!;
      if (placing && !placed) return move.piece === 'n' && to.file === 4 && to.rank === knightRank;
      return placed && move.piece === 'k' && to.file === 5 && to.rank === bk.rank;
    }).filter(move => {
      const after = getChess(move.after), replies = bishopKnightBlackReplies(after, black.square);
      return !replies.some(reply => reply.captured === 'b' || reply.captured === 'n')
        && (replies.length > 0 || after.isCheckmate());
    });
    if (choices.length) return choices.map(move => move.from + move.to);
  }
  return [];
}

export function edgeMatingNetMoves(fen: string): readonly string[] {
  if (getChess(fen).board().flat().filter(Boolean).length !== 4) return [];
  const sequence = matingNetEdgeSequenceMoves(fen);
  if (sequence.length) return sequence;
  const cornerward = matingNetCornerwardKnightMoves(fen);
  if (cornerward.length) return cornerward;
  const front = matingNetFrontKnightMoves(fen);
  return front.length ? front : matingNetEdgeOppositionMoves(fen);
}
