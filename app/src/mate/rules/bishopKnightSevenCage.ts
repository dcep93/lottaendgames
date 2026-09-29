import {findPiece, getChess, kingDistance, squareColor, squareCoords, squareFromCoords, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import type {Square} from 'chess.js';
import {knightMoveDistance} from './bishopKnightStrategy';

// Only declarations made after the r2 reset. Later destination targets take priority.
const destinations = new Map<string, number>();
const templates = [
  {king: [3, 3], knight: [5, 2], black: [2, 1], translated: false}, // Nf3; bishop on a2–g8.
  {king: [2, 2], knight: [5, 2], black: [3, 0], translated: true}, // Bc4; bishop on a6–f1.
  {king: [2, 2], knight: [3, 3], black: [2, 0], translated: true}, // Nd4; same bishop diagonal.
];
for (const [stage, template] of templates.entries()) {
  for (let dx = -7; dx <= 7; dx++) for (let dy = -7; dy <= 7; dy++) {
    if (!template.translated && (dx || dy)) continue;
    const anchors = [template.king, template.knight, template.black].map(([x, y]) => [x! + dx, y! + dy]);
    if (anchors.some(([x, y]) => x! < 0 || x! > 7 || y! < 0 || y! > 7)) continue;
    const [bx, by] = anchors[2]!;
    if (template.translated && bx !== 0 && bx !== 7 && by !== 0 && by !== 7) continue;
    for (let file = 0; file < 8; file++) for (let rank = 0; rank < 8; rank++) {
      if (stage === 0 ? rank - file !== 1 : file + rank !== 5 + dx + dy) continue;
      if (anchors.some(([x, y]) => x === file && y === rank)) continue;
      const squares = [anchors[0]!, [file, rank], anchors[1]!, anchors[2]!]
        .map(([x, y]) => squareFromCoords(x!, y!) as Square);
      for (const transform of SQUARE_TRANSFORMS) {
        const key = squares.map(square => transformSquare(square, transform)).join('');
        destinations.set(key, Math.max(stage + 1, destinations.get(key) ?? 0));
      }
    }
  }
}

// Five-diagonal preparation: match the K/B/N arrival, with Black in d1–h5–h1.
for (let file = 3; file < 8; file++) for (let rank = 0; rank <= file - 3; rank++) {
  const black = squareFromCoords(file, rank)!;
  for (const transform of SQUARE_TRANSFORMS) {
    const key = (['d4', 'e4', 'e5', black] as Square[])
      .map(square => transformSquare(square, transform)).join('');
    destinations.set(key, 4);
  }
}

function destinationRank(fen: string): number {
  const pieces = [findPiece(fen, 'w', 'k'), findPiece(fen, 'w', 'b'), findPiece(fen, 'w', 'n'), findPiece(fen, 'b', 'k')];
  return pieces.some(piece => !piece) ? 0 : destinations.get(pieces.map(piece => piece!.square).join('')) ?? 0;
}

/** Match the complete arrival, independent of the moving piece or source square. */
export function sevenCageDestinationMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const arrivals = getChess(fen).moves({verbose: true}).map(move => ({move, rank: destinationRank(move.after)}));
  const best = Math.max(0, ...arrivals.map(arrival => arrival.rank));
  return best ? arrivals.filter(arrival => arrival.rank === best).map(({move}) => move.from + move.to) : [];
}

const exactMoves = new Map([
  {fen: '8/8/8/3BN3/3K4/8/4k3/8 w - - 0 1', from: 'd5', to: 'e4'},
  {fen: '8/8/8/4N3/4B3/2K5/8/3k4 w - - 0 1', from: 'c3', to: 'd4'},
  {fen: '8/8/8/3BN3/8/2K5/8/3k4 w - - 0 1', from: 'd5', to: 'e4'},
].flatMap(({fen, from, to}) => SQUARE_TRANSFORMS.map(transform => [
  transformFen(fen, transform).split(' ')[0],
  transformSquare(from as Square, transform) + transformSquare(to as Square, transform),
] as const)));

const cageBlackSquares: Square[] = [];
for (let file = 2; file < 8; file++) for (let rank = 0; rank < 8; rank++) {
  // An established cage uses the entire closed triangle c1–h6–h1.
  if (rank > file - 2) continue;
  const black = squareFromCoords(file, rank) as Square;
  cageBlackSquares.push(black);
}

const cageFrames = SQUARE_TRANSFORMS.map(transform => ({
  post: transformSquare('c4', transform),
  kingPost: transformSquare('d4', transform),
  dangerSquare: transformSquare('h6', transform),
  edgeDistances: new Map(Array.from({length: 64}, (_, index) => [
    transformSquare(squareFromCoords(index % 8, Math.floor(index / 8))!, transform),
    7 - index % 8,
  ] as const)),
  diagonal: new Set(Array.from({length: 7}, (_, rank) => transformSquare(squareFromCoords(rank + 1, rank)!, transform))),
  blackSquares: new Set(cageBlackSquares.map(square => transformSquare(square, transform))),
}));

/** Hold the cage, then prefer opposite-color king squares nearer the edge opposite N. */
export function sevenCageFormationMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n'), black = findPiece(fen, 'b', 'k');
  if (!king || !bishop || !knight || !black) return [];
  const frame = cageFrames.find(frame => knight.square === frame.post
    && frame.diagonal.has(bishop.square) && frame.blackSquares.has(black.square));
  if (!frame) return [];
  const candidates = getChess(fen).moves({verbose: true}).map(move => {
    const n = move.piece === 'n' ? move.to : knight.square;
    const b = move.piece === 'b' ? move.to : bishop.square;
    const k = move.piece === 'k' ? move.to : king.square;
    // The weights implement the declared lexicographic priorities.
    const score = (n === frame.post ? 0 : 10000) + (frame.diagonal.has(b) ? 0 : 1000)
      + (squareColor(k) === squareColor(b) ? 100 : 0)
      + frame.edgeDistances.get(k)!;
    return {move: move.from + move.to, score};
  });
  const best = Math.min(...candidates.map(candidate => candidate.score));
  return candidates.filter(candidate => candidate.score === best).map(candidate => candidate.move);
}

export function sevenCageMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const board = getChess(fen), legal = board.moves({verbose: true});
  const exact = declaredSevenCageMove(fen);
  if (exact && legal.some(move => move.from + move.to === exact)) return [exact];
  const cage = sevenCageFormationMoves(fen);
  if (cage.length) return cage;
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b'), black = findPiece(fen, 'b', 'k');
  const entries = king && bishop && black ? cageFrames.filter(frame => frame.diagonal.has(bishop.square)
    && frame.blackSquares.has(black.square)
    // Distance to h6's closed king-neighborhood must exceed White's trip to d4.
    && Math.max(0, kingDistance(black.square, frame.dangerSquare) - 1)
      > kingDistance(king.square, frame.kingPost)) : [];
  const jumps = legal.filter(move => move.piece === 'n' && entries.some(frame => move.to === frame.post));
  if (jumps.length) return jumps.map(move => move.from + move.to);
  const arrivals = sevenCageDestinationMoves(fen);
  return arrivals.length ? arrivals : nonTargetCornerKnightMoves(fen);
}

/** K two diagonally from a wrong-color corner; route N three diagonally from it. */
export function nonTargetCornerKnightMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n'), black = findPiece(fen, 'b', 'k');
  if (!king || !bishop || !knight || !black) return [];
  const b = squareCoords(bishop.square), k = squareCoords(black.square);
  for (const x of [0, 7]) for (const y of [0, 7]) {
    if ((x + y) % 2 === (b.file + b.rank) % 2) continue;
    if (Math.max(Math.abs(k.file - x), Math.abs(k.rank - y)) > 2) continue;
    const dx = x === 0 ? 1 : -1, dy = y === 0 ? 1 : -1;
    if (king.square !== squareFromCoords(x + 2 * dx, y + 2 * dy)) continue;
    const target = squareFromCoords(x + 3 * dx, y + 3 * dy)!;
    const distance = knightMoveDistance(knight.square, target);
    if (!distance) return [];
    return getChess(fen).moves({verbose: true})
      .filter(move => move.piece === 'n' && knightMoveDistance(move.to, target) < distance)
      .map(move => move.from + move.to);
  }
  return [];
}

// Post-reset exact declarations; all pre-reset entries remain discarded.
export function declaredSevenCageMove(fen: string): string | undefined {
  return fen.split(' ')[1] === 'w' ? exactMoves.get(fen.split(' ')[0]!) : undefined;
}
export function isSevenCageTemporaryTerminal(_fen: string): boolean { return false; }
