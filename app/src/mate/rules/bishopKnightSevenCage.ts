/** Historical declaration helpers for audit/replay. Runtime r1/r2 use bishopKnightStages. */
import {findPiece, getChess, kingDistance, squareColor, squareCoords, squareFromCoords, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import type {Square} from 'chess.js';
import {knightMoveDistance} from './bishopKnightStrategy';
import {bishopKnightBlackReplies} from './bishopKnightReplies';
import {isBoardEdge} from './bishopKnightGeometry';
import {happyR2Moves} from './bishopKnightHappyR2';

// Established declarations made after the r2 reset. New loop repairs belong
// in fallbackDestinations; do not promote them above established continuations.
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
  // Preserve the established cage entry when a reflected continuation offers Nc6.
  {fen: '8/8/8/4N3/3KB3/8/8/4k3 w - - 0 1', from: 'e5', to: 'c4'},
  {fen: '8/8/8/4N3/3KB3/8/4k3/8 w - - 0 1', from: 'e5', to: 'c4'},
  {fen: '8/8/8/4N3/3KB3/8/3k4/8 w - - 0 1', from: 'e5', to: 'c4'},
  {fen: '8/8/8/4N3/3KB3/8/8/2k5 w - - 0 1', from: 'e5', to: 'c4'},
  {fen: '8/8/8/8/2N5/3B2K1/8/7k w - - 0 1', from: 'c4', to: 'e3'},
  {fen: '8/8/8/8/2N5/3B2K1/8/6k1 w - - 0 1', from: 'c4', to: 'e3'},
  {fen: '8/8/8/8/4BK2/4N3/8/6k1 w - - 0 1', from: 'f4', to: 'f3'},
  {fen: '8/8/8/8/4BK2/4N3/7k/8 w - - 0 1', from: 'f4', to: 'f3'},
  {fen: '8/8/8/3BN3/3K4/8/4k3/8 w - - 0 1', from: 'd5', to: 'e4'},
  {fen: '8/8/8/4N3/4B3/2K5/8/3k4 w - - 0 1', from: 'c3', to: 'd4'},
  {fen: '8/8/8/3BN3/8/2K5/8/3k4 w - - 0 1', from: 'd5', to: 'e4'},
].flatMap(({fen, from, to}) => SQUARE_TRANSFORMS.map(transform => [
  transformFen(fen, transform).split(' ')[0],
  transformSquare(from as Square, transform) + transformSquare(to as Square, transform),
] as const)));

// Full arrivals in the loaded Ke3–Na3–Nc2–Be4 continuation, before Black replies.
const continuationDestinations = new Map<string, number>();
for (const [stage, squares] of ([
  ['e3', 'd3', 'c4', 'c1'],
  ['e3', 'd3', 'a3', 'd1'],
  ['e3', 'd3', 'c2', 'c1'],
  ['e3', 'e4', 'c2', 'd1'],
  ['e3', 'd3', 'c2', 'e1'], // 7.Nc2+ after Na3 Ke1.
  ['g3', 'e2', 'c4', 'g1'], // 10.Be2, before Black replies Kh1.
  ['e3', 'e4', 'c4', 'c1'], // 5.Ke3 in the Be4 branch.
  ['e3', 'e4', 'a3', 'd1'], // 6.Na3
  ['e3', 'e4', 'c2', 'c1'], // 7.Nc2
  ['d3', 'e4', 'c2', 'd1'], // 8.Kd3
  ['e3', 'e4', 'c2', 'e1'], // 7.Nc2+ in the Kf1 branch.
  ['f3', 'e4', 'c2', 'f1'], // 8.Kf3
  ['g3', 'e4', 'c2', 'g1'], // 9.Kg3
  ['g3', 'd3', 'c2', 'f1'], // 10.Bd3+
  ['g3', 'd3', 'e3', 'g1'], // 11.Ne3
  ['f4', 'e4', 'c4', 'f2'], // 8.Kf4, before Black replies Ke2.
  ['f3', 'f5', 'c4', 'e1'], // 10.Bf5 in the Bg4 branch.
  ['f5', 'd3', 'c4', 'f3'], // Revised 6.Kf5, before Black replies Kg3.
  ['f5', 'e4', 'c4', 'g3'], // Revised 7.Be4, before Black replies Kf2.
  ['f4', 'e4', 'c4', 'h4'], // 4.Kf4 in the Be4 edge approach.
  ['f4', 'e4', 'e5', 'h5'], // 5.Ne5; below the existing reflected Kd3 handoff.
  ['f5', 'e4', 'g6', 'g7'], // 7.Ng6
  ['f5', 'c6', 'g6', 'f7'], // 8.Bc6
  ['f5', 'd5', 'g6', 'g7'], // 9.Bd5
  ['d2', 'd3', 'c2', 'b2'], // 8.Kd2 in the b-file continuation.
  ['d2', 'b5', 'c2', 'b3'], // 9.Bb5
  ['d2', 'c4', 'c2', 'b2'], // 10.Bc4
  ['f6', 'e4', 'f7', 'h8'], // 8.Nf7+ before Black replies Kg8.
  ['c3', 'c4', 'c2', 'a2'], // 10.Bc4+ before Black replies Kb1.
  ['g2', 'f5', 'c4', 'e1'], // 6.Kg2 in the f1-start line, before Ke2.
  ['g2', 'd3', 'c4', 'e1'], // 6.Bd3 in the f1-start line, before Kd1.
  ['f2', 'e4', 'c4', 'd1'], // 7.Be4 in the f1-start line, before Kc1.
  ['f5', 'd3', 'c4', 'h5'], // 5.Kf5 in the g3-start line, before Kh4.
  ['f6', 'e4', 'c4', 'h6'], // 3.Kf6; later Ne5 arrivals retain priority.
  ['f5', 'e4', 'c4', 'h5'], // 4.Kf5; an available Ne5 arrival takes priority.
  ['f5', 'e4', 'e5', 'h4'], // Revised 5.Ne5, before Kg3.
  ['f6', 'd3', 'c4', 'h6'], // 4.Kf6 with Bd3; later Ne5 arrivals retain priority.
  ['f6', 'f5', 'c4', 'f4'], // 5.Bf5, before Black replies Kf3.
  ['f6', 'd3', 'c4', 'h5'], // Revised 4.Kf6 after Kh5, before Kg4.
  ['g5', 'e4', 'c4', 'g3'], // 6.Be4 replaces the old exact Bg4 preference.
  ['f5', 'd3', 'g6', 'g7'], // 7.Ng6 in the Bd3 branch, before Kf7.
  ['f5', 'b5', 'g6', 'f7'], // 8.Bb5, before Kg7.
  ['e3', 'e4', 'e5', 'h5'], // 1.Ke3 from the h5 start.
  ['f4', 'e4', 'e5', 'h4'], // 2.Kf4 before Black replies Kh5.
  ['d4', 'e4', 'f7', 'h5'], // Revised 1.Nf7 from the h5 start.
  ['e3', 'e4', 'f7', 'g4'], // 2.Ke3 before Kh5.
  ['f4', 'e4', 'f7', 'h5'], // 3.Kf4 before Kh4.
  ['e3', 'e4', 'f7', 'h4'], // 2.Ke3 after Nf7 Kh4.
  ['e3', 'd3', 'f7', 'g4'], // 3.Bd3 before Kh5.
  ['f4', 'e4', 'f7', 'h3'], // 3.Kf4 after Ke3 Kh3, before Kh4.
  ['e3', 'e4', 'e5', 'g3'], // 3.Ne5 after Ke3 Kg3, before Kh4.
  ['e3', 'd3', 'c4', 'g3'], // Revised 3.Bd3 after Nc4 Kg3, before Kg4.
  ['f4', 'd3', 'f7', 'h4'], // 4.Kf4 after Bd3 Kh4, before Kh5.
  ['e3', 'd3', 'e5', 'g3'], // 4.Ne5 after Bd3 Kg3.
  ['e4', 'd3', 'c4', 'g3'], // 4.Ke4 with Nc4 after Bd3 Kg3, before Kg4.
  ['f3', 'e4', 'e5', 'h3'], // Revised 2.Kf3 after Ke3 Kh3, before Kh4.
  ['f4', 'e4', 'e5', 'h2'], // Revised 2.Kf4 after Ke3 Kh2.
  ['f3', 'e4', 'e5', 'g1'], // 3.Kf3 after Kf4 Kg1, before Kf1.
  ['f3', 'e4', 'g4', 'h2'], // 3.Ng4+ after Kf3 Kh2, before Kh3.
  ['f5', 'd3', 'c4', 'g3'], // 8.Kf5 after Ke5 Kg3, before Kf3.
  ['f3', 'e4', 'g4', 'h1'], // 5.Ng4 after Ne5 Kh1, before Kg1.
  ['f3', 'e4', 'e3', 'g1'], // Revised 4.Ne3 after Kf3 Kg1, before Kh2.
  ['f3', 'd3', 'e5', 'h2'], // 5.Ne5 after Kf3 Kh2, before Kh3.
  ['f3', 'd3', 'f7', 'h3'], // 4.Kf3 in the same branch, before Kh2.
  ['f4', 'd3', 'e5', 'h3'], // 5.Ne5 after Kf4 Kh3, before Kh2.
  ['f4', 'e4', 'e5', 'h3'], // 4.Ne5 in the Be4 branch, before Kh2.
  ['f4', 'e4', 'f7', 'h4'], // 3.Kf4 in the same line, before Kh3.
  ['f4', 'e4', 'g4', 'h2'], // 5.Ng4+ before Kg1.
  ['f4', 'd3', 'g4', 'g1'], // 6.Bd3 before Kh1.
  ['e5', 'd3', 'e3', 'g5'], // 8.Ne3 before Kh4.
  ['f4', 'd3', 'e3', 'h4'], // 9.Kf4 in that continuation.
  ['d5', 'e4', 'f7', 'h5'], // 2.Nf7 from the h6 start, before Kg4.
  ['d5', 'e4', 'e5', 'h6'], // Earlier Kd5 arrival; the revised Nc6 takes priority.
  ['d4', 'e4', 'c6', 'h6'], // Revised 1.Nc6 from the h6 start, before Kg5.
  ['e5', 'e4', 'c6', 'h5'], // 2.Ke5 after Nc6 Kh5, before Kg4.
  ['d4', 'e4', 'c4', 'd1'], // Preserve established Nc4 entry over the reflected Ke5 destination.
  ['f4', 'e4', 'c4', 'd1'], // Continue forward with Kf4 rather than return to the Nc4 entry formation.
  ['f5', 'e4', 'c6', 'h6'], // 3.Kf5 after Nc6 Kg7 Ke5 Kh6.
  ['f5', 'e4', 'e5', 'g7'], // 4.Ne5 before Kf8.
  ['e5', 'e4', 'c6', 'g7'], // Explicit r2 credit for 2.Ke5 in the same line.
  ['d4', 'e4', 'c6', 'g5'], // 1.Nc6 from the g5 start, before Kf4.
  ['d5', 'e4', 'c6', 'f4'], // 2.Kd5 before Ke3.
  ['e5', 'e4', 'c6', 'h4'], // 2.Ke5 after Nc6 Kh4, before Kg4.
  ['e5', 'e4', 'c6', 'g4'], // 2.Ke5 after Nc6 Kg4, before Kg5.
  ['e5', 'e4', 'd4', 'g5'], // 3.Nd4 before Kh6.
  ['d5', 'e4', 'c6', 'f6'], // 2.Kd5 after Nc6 Kf6, before Kg5.
  ['e5', 'e4', 'c6', 'g5'], // 3.Ke5 before Kg4, rather than retreating to Kd4.
  ['f5', 'e4', 'c6', 'f7'], // 3.Kf5 after Ke5 Kf7.
  ['e5', 'e4', 'c6', 'h6'], // 2.Ke5 after Nc6 Kh6.
  ['e6', 'e4', 'c6', 'g7'], // 3.Ke6 before Kg8.
  ['e6', 'e4', 'e5', 'g8'], // 4.Ne5 in that continuation.
  ['f6', 'e4', 'c6', 'h7'], // 4.Kf6+ in the Ne7–Nf5–Nd6 line.
  ['f5', 'e4', 'e7', 'h5'], // 6.Kf5.
  ['f4', 'e4', 'e7', 'h4'], // 7.Kf4.
  ['f4', 'e4', 'f5', 'h3'], // 8.Nf5.
  ['f4', 'e4', 'd6', 'h2'], // 9.Nd6.
  ['f4', 'e4', 'e3', 'h2'], // Revised 4.Ne3 after Nc4 Kf2 Ke5 Kg1 Kf4 Kh2.
  ['f6', 'e4', 'c6', 'g8'], // 4.Kf6 after Nc6 Kg7 Ke5 Kf7 Kf5 Kg8.
  ['e6', 'e4', 'c4', 'g5'], // 3.Nc4 after Kd5 Kh6 Ke6 Kg5.
  ['e5', 'c4', 'd3', 'e7'], // 6.Ke5 in the b8-start Bc4 line.
  ['d4', 'e4', 'c6', 'f8'], // 1.Nc6 from the satisfied-r4 f8 start.
  ['f6', 'e4', 'c6', 'f8'], // 3.Kf6 after Nc6 Kg8 Ke5 Kf8.
  ['e5', 'e4', 'c6', 'g8'], // 2.Ke5 in that line.
  ['f6', 'e4', 'e5', 'g8'], // 4.Ne5 after Nc6 Kg8 Ke5 Kh8 Kf6 Kg8.
  ['f6', 'e4', 'c6', 'h8'], // 3.Kf6 in that line.
  ['f6', 'f5', 'e5', 'f8'], // 5.Ne5 after Bf5 Kf8 in the f8-start line.
  ['d5', 'e4', 'e5', 'c7'], // 4.Ne5 after Nc6 Ke8 Ke5 Kd7 Kd5 Kc7.
  ['e5', 'e4', 'c6', 'e8'], // 2.Ke5 in that line.
  ['d5', 'e4', 'c6', 'd7'], // 3.Kd5 in that line.
  ['f6', 'f5', 'c6', 'e8'], // Preserve the previously requested Bf5 over returning to Ke5.
  ['c4', 'e4', 'c6', 'a4'], // 3.Kc4 after Nc6 Kb5 Kd5 Ka4.
  ['d5', 'e4', 'd3', 'b6'], // 2.Nd3 after Kd5 Kb6 from the c7 start.
  ['d4', 'e4', 'd3', 'b5'], // 3.Kd4 in that line.
  ['e5', 'e4', 'c4', 'e2'], // Preserve the established Ke5 after Nc4 Ke2.
  ['c4', 'e4', 'e5', 'b6'], // Revised 2.Kc4 after Kd5 Kb6.
  ['c5', 'e4', 'e5', 'c7'], // 3.Kc5 in that line.
  ['c5', 'e4', 'd3', 'a4'], // 3.Nd3 after Kc4 Ka5 Kc5 Ka4.
  ['d4', 'e4', 'd3', 'b3'], // 4.Kd4 in that line.
  ['c5', 'e4', 'e5', 'a5'], // Explicit r2 credit for 2.Kc5 in that line.
  ['c5', 'e4', 'c4', 'a6'], // 2.Nc4 after Kc5 Ka6 from the a5 start.
  ['c5', 'e4', 'd6', 'a7'], // 3.Nd6 in that line.
  ['c5', 'e4', 'c1', 'a5'], // 3.Nc1 after Kc5 Ka4 Nd3 Ka5.
  ['c5', 'e4', 'b3', 'a6'], // 4.Nb3 in that line.
  ['c6', 'e4', 'b3', 'a7'], // 5.Kc6 in that line.
  ['c5', 'e4', 'e5', 'b7'], // 4.Ne5+ after Nc6 Kb5 Kd5 Ka6 Kc5 Kb7.
  ['c5', 'e4', 'c6', 'a6'], // Explicit r2 credit for 3.Kc5 in that line.
  ['d6', 'd5', 'd4', 'b6'], // 5.Bd5 after Kd6+ Kb6 from the a4 start.
  ['d4', 'e4', 'e5', 'c2'], // 4.Ne5+ after Kc5 Ka4 Nd3 Kb3 Kd4 Kc2.
  ['c7', 'd5', 'd3', 'b5'], // 5.Kc7 after Bd5 Ka7 Nd3 Kb6 Ke5 Ka5 Kd6 Kb5.
  ['f4', 'e4', 'd4', 'h4'], // 3.Be4 after Kf5 Kh3 Kf4 Kh4.
  ['f4', 'd5', 'd4', 'h3'], // 2.Kf4 in that line.
  ['d4', 'd5', 'e5', 'a6'], // Preserve established 1.Bd5 over a reflected Kc5 arrival.
  ['e3', 'e4', 'c4', 'f1'], // Preserve Ke3 after Nc4 Kf1 against the reflected Ne5 arrival.
  ['f3', 'e4', 'c4', 'e1'], // Established Kf3 continuation after Ke3 Ke1.
  ['e3', 'e4', 'e5', 'g1'], // 3.Be4 after Kd3 Kf1 Ke3 Kg1.
  ['d4', 'e4', 'c4', 'g1'], // Preserve established Nc4 cage entry before the new Be4 destination.
  ['f4', 'e4', 'c4', 'g1'], // Kf4 remains available when the closer Kf3 destination cannot be reached.
  ['f3', 'e4', 'c4', 'g1'], // Restore normal cage progress after Ke3 Kg1 instead of returning to Kf4.
  ['g3', 'e4', 'c4', 'f1'], // Restore Kg3 after Kf3/Kf4 Kf1 instead of returning to Ke3.
  ['g3', 'd3', 'c4', 'g1'], // Preserve the declared Bd3–Ne3 handoff instead of retreating to Kf3.
  ['g3', 'd3', 'c4', 'h1'], // The same handoff with Black in the corner.
  ['f3', 'e4', 'g4', 'g5'], // 4.Be4 after Ke3 Kh3 Kf3 Kh4 Ng4 Kg5.
  ['d4', 'e4', 'c4', 'f4'], // 2.Be4 after Nc4 Kf4.
  ['f3', 'd5', 'g4', 'h2'], // 3.Ng4+ after Ke3 Kh3 Kf3 Kh2.
  ['d3', 'e4', 'e5', 'f2'], // 2.Be4 after Kd3 Kf2 from the Bd5 e1 start.
  ['d4', 'e4', 'c4', 'f2'], // 2.Nc4 after Be4 Kf2, before Ke2.
  ['e3', 'e4', 'e5', 'd1'], // Restore 2.Be4 after Ke3 Kd1 over reflected Nc4.
  ['e3', 'e4', 'c4', 'e1'], // Restore 3.Nc4 after Be4 Ke1 over reflected Bd5.
  ['f3', 'd5', 'e5', 'h3'], // Explicit r2 credit for 2.Kf3 after Ke3 Kh3.
  ['f4', 'd5', 'e5', 'h4'], // Revised 3.Kf4 after Kf3 Kh4.
  ['d4', 'e4', 'c4', 'f1'], // 4.Kd4 after Kc3 Be4 Nc4, before Ke2.
  ['c3', 'd5', 'e5', 'c1'], // 1.Kc3 in the same line.
  ['c3', 'e4', 'e5', 'd1'], // 2.Be4 before Ke1.
  ['c3', 'e4', 'c4', 'e1'], // 3.Nc4 before Kf1.
  ['c3', 'e4', 'c4', 'c1'], // 3.Nc4 after Be4 Kc1, before Kd1.
  ['c3', 'd5', 'c4', 'b1'], // 2.Nc4 after Kc3 Kb1.
  ['c3', 'd5', 'e3', 'c1'], // 3.Ne3 after Nc4 Kc1.
  ['c3', 'd5', 'e3', 'a1'], // 3.Ne3 after Nc4 Ka1.
  ['f4', 'e4', 'c4', 'f1'], // 4.Kf4 after Be4 Kg1 Nc4 Kf2 Ke5 Kf1.
  ['g3', 'd3', 'c4', 'f1'], // 6.Bd3+ after Kf4 Ke2 Kg3 Kf1.
] as Square[][]).entries()) {
  for (const transform of SQUARE_TRANSFORMS) {
    continuationDestinations.set(squares.map(square => transformSquare(square, transform)).join(''),
      [1, 2, 3, 4, 5, 6, 0.5, 1.5, 2.5, 4.5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 4.25, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 1.25, 2.75, 17, 4, 32, 17, 33, 3.25, 14.5, 35, 36, 0.25, 0.3, 37, 38, 39, 0.1, 0.2, 0.15, 0.2, 0.3, 0.15, 0.25, 0.35, 0.4, 0.4, 0.4, 0.45, 0.4, 0.45, 0.5, 0.44, 0.15, 0.2, 0.3, 0.14, 0.5, 0.55, 0.6, 0.65, 0.7, 0.1, 0.2, 0.25, 0.3, 0.4, 0.35, 0.45, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.35, 0.4, 0.3, 0.15, 0.3, 0.35, 0.2, 0.3, 0.35, 0.4, 0.45, 0.5, 0.32, 0.4, 0.41, 0.2, 0.3, 0.25, 0.4, 0.3, 0.4, 0.4, 0.01, 0.3, 0.41, 0.4, 0.4, 0.45, 0.46, 0.5, 0.55, 0.1, 0.15, 0.1, 0.2, 0.25, 0.2, 0.25, 0.3, 0.4, 0.1, 0.41, 0.2, 0.47, 0.01, 0.01, 0.02, 0.03, 0.102, 0.001, 0.002, 0.003, 0.005, 0.05, 0.006, 0.006, 0.0001, 0.0002, 0.301, 0.0004, 0.0005, 0.101, 0.101, 0.0006, 0.0006, 0.0007, 0.0007, 0.0007, 0.0007, 0.0008, 0.321, 0.0009, 0.001, 0.0011, 0.0012][stage]!);
  }
}

// Ne5 arrival with Kf6 and Black h6: the bishop may occupy any b1–h7 square.
for (const bishop of ['b1', 'c2', 'd3', 'e4', 'f5', 'g6', 'h7'] as Square[]) {
  for (const transform of SQUARE_TRANSFORMS) {
    const key = (['f6', bishop, 'e5', 'h6'] as Square[])
      .map(square => transformSquare(square, transform)).join('');
    continuationDestinations.set(key, Math.max(30, continuationDestinations.get(key) ?? 0));
  }
}

// Kf5–Ne5 against Kh6 is a destination regardless of the bishop's square.
for (let index = 0; index < 64; index++) {
  const bishop = squareFromCoords(index % 8, Math.floor(index / 8))!;
  if (bishop === 'f5' || bishop === 'e5' || bishop === 'h6') continue;
  for (const transform of SQUARE_TRANSFORMS) {
    const key = (['f5', bishop, 'e5', 'h6'] as Square[])
      .map(square => transformSquare(square, transform)).join('');
    continuationDestinations.set(key, Math.max(18, continuationDestinations.get(key) ?? 0));
  }
}

// Loop repairs are fallback destinations: they never replace established entries
// or compete with their progress ranks. Match the full arrival under every D4
// transform, regardless of the incoming piece, just like established paths.
const fallbackDestinations = new Map<string, number>();
for (const [king, bishop, knight, black, rank] of [
  ['f3', 'd3', 'c4', 'f1', 0.051], // 5.Bd3+ after Ke3 Kg1 Kf3 Kf1.
  ['c4', 'd5', 'e5', 'c2', 0.201], // c2-start: Kc4, Be4, Kd5, Nc4.
  ['c4', 'e4', 'e5', 'd2', 0.052],
  ['d5', 'e4', 'e5', 'e3', 0.052],
  ['d5', 'e4', 'c4', 'f4', 0.351],
  ['d4', 'd5', 'c6', 'f5', 0.0013], // f5-start: Nc6, then Be4 after Kf4.
  ['d4', 'e4', 'c6', 'f4', 0.0013],
  ['b4', 'd5', 'e5', 'b2', 0.0014], // c2-start Kc4 Kb2 Kb4, then Be4+ and Nc4+.
  ['b4', 'e4', 'e5', 'c2', 0.202],
  ['b4', 'e4', 'c4', 'd2', 0.053],
  ['b4', 'e4', 'c4', 'b2', 0.0015], // 4.Nc4+ after Be4+ Kb2.
  ['d4', 'e4', 'e5', 'g3', 0.0016], // Revised f5-start: 3.Ne5, then 4.Nc4 after Kf4.
  ['d4', 'e4', 'c4', 'f4', 0.0018],
  ['e5', 'e4', 'c4', 'g3', 0.0019], // f5-start continuation: Ke5, Kf6, Bd3.
  ['f6', 'e4', 'c4', 'g4', 0.0019],
  ['f6', 'd3', 'c4', 'f4', 33.01],
  ['e5', 'd5', 'd4', 'g6', 1], // Seven-diagonal repair: 4.Nd4 after Ke5 Kg6.
  ['f5', 'd5', 'e5', 'h4', 1], // Seven-diagonal repair: 4.Ne5 after Kf5 Kh4.
  ['f3', 'd5', 'e5', 'h2', 1], // Seven-diagonal repair: 4.Ne5 after Kf3 Kh2.
  ['d4', 'e4', 'e5', 'f6', 1], // Revised main-diagonal entry: 1.Be4 replaces Nd3.
  ['e3', 'd5', 'd3', 'f5', 1], // 2.Ke3 after Nd3 Kf5, before Black's reply.
  ['f4', 'd5', 'd3', 'f6', 1], // 3.Kf4 after Ke3 Kf6.
  ['d5', 'e4', 'f3', 'f6', 1], // 3.Kd5 after Be4 Ke6 Nf3 Kf6.
] as [Square, Square, Square, Square, number][]) {
  for (const transform of SQUARE_TRANSFORMS) {
    const key = [king, bishop, knight, black].map(square => transformSquare(square, transform)).join('');
    // A fallback cannot overwrite an established destination, even under reflection.
    if (!continuationDestinations.has(key)) fallbackDestinations.set(key, rank);
  }
}

/** Best matching fallback; used only after established declarations have no move. */
export function sevenCageFallbackMoves(fen: string): readonly string[] {
  return fen.split(' ')[1] === 'w' ? rankedDestinationMoves(fen, fallbackDestinations) : [];
}

/** Offline route comparison: retain all declared arrivals, ignoring ordinal priorities. */
export function sevenCageDeclaredDestinationMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const exact = declaredSevenCageMove(fen), handoff = r2NetHandoffMoves(fen);
  return getChess(fen).moves({verbose: true}).filter(move => {
    const key = ([['w', 'k'], ['w', 'b'], ['w', 'n'], ['b', 'k']] as const)
      .map(([color, piece]) => findPiece(move.after, color, piece)?.square ?? '').join('');
    return move.from + move.to === exact || handoff.includes(move.from + move.to)
      || continuationDestinations.has(key) || fallbackDestinations.has(key) || destinations.has(key);
  }).map(move => move.from + move.to);
}

function rankedDestinationMoves(fen: string, ranks: ReadonlyMap<string, number>): readonly string[] {
  const arrivals = getChess(fen).moves({verbose: true}).map(move => {
    const pieces = [findPiece(move.after, 'w', 'k'), findPiece(move.after, 'w', 'b'),
      findPiece(move.after, 'w', 'n'), findPiece(move.after, 'b', 'k')];
    const rank = pieces.some(piece => !piece) ? 0
      : ranks.get(pieces.map(piece => piece!.square).join('')) ?? 0;
    return {move, rank};
  });
  const best = Math.max(0, ...arrivals.map(arrival => arrival.rank));
  return best ? arrivals.filter(arrival => arrival.rank === best).map(({move}) => move.from + move.to) : [];
}

const cageBlackSquares: Square[] = [];
for (let file = 2; file < 8; file++) for (let rank = 0; rank < 8; rank++) {
  // An established cage uses the entire closed triangle c1–h6–h1.
  if (rank > file - 2) continue;
  const black = squareFromCoords(file, rank) as Square;
  cageBlackSquares.push(black);
}

const cageFrames = SQUARE_TRANSFORMS.map(transform => ({
  transform,
  post: transformSquare('c4', transform),
  kingPost: transformSquare('d4', transform),
  bishopPost: transformSquare('d3', transform),
  kingDestination: transformSquare('f4', transform),
  excludedKingSquareOnSecondRank: transformSquare('e3', transform),
  blackH1: transformSquare('h1', transform),
  kingG3: transformSquare('g3', transform),
  blackE2: transformSquare('e2', transform),
  kingG2: transformSquare('g2', transform),
  blackC1D1: new Set([transformSquare('c1', transform), transformSquare('d1', transform)]),
  kingF2: transformSquare('f2', transform),
  dangerSquare: transformSquare('h6', transform),
  coordinates: new Map(Array.from({length: 64}, (_, index) => [
    transformSquare(squareFromCoords(index % 8, Math.floor(index / 8))!, transform),
    {file: index % 8, rank: Math.floor(index / 8)},
  ] as const)),
  edgeDistances: new Map(Array.from({length: 64}, (_, index) => [
    transformSquare(squareFromCoords(index % 8, Math.floor(index / 8))!, transform),
    7 - index % 8,
  ] as const)),
  diagonal: new Set(Array.from({length: 7}, (_, rank) => transformSquare(squareFromCoords(rank + 1, rank)!, transform))),
  blackSquares: new Set(cageBlackSquares.map(square => transformSquare(square, transform))),
}));

/** Hold the cage; when above Black, prefer the one-up/two-right post before the distance targets. */
export function sevenCageFormationMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const king = findPiece(fen, 'w', 'k'), bishop = findPiece(fen, 'w', 'b');
  const knight = findPiece(fen, 'w', 'n'), black = findPiece(fen, 'b', 'k');
  if (!king || !bishop || !knight || !black) return [];
  const frame = cageFrames.find(frame => knight.square === frame.post
    // The bishop may have left the diagonal under an explicit exception.
    // Recognize the knight post and Black region so r2 can restore it.
    && squareColor(bishop.square) === squareColor(frame.bishopPost)
    && frame.blackSquares.has(black.square));
  if (!frame) return [];
  const blackCoords = frame.coordinates.get(black.square)!;
  const legal = getChess(fen).moves({verbose: true})
    .filter(move => move.piece !== 'k'
      || !(blackCoords.rank === 1 && move.to === frame.excludedKingSquareOnSecondRank));
  // Match the safety/stalemate priorities ahead of r2. An unsafe top choice
  // must not leave every safe cage-preserving move tied with abandoning it.
  const safe = legal.filter(move => {
    const after = getChess(move.after);
    const replies = bishopKnightBlackReplies(after, black.square);
    return !replies.some(reply => reply.captured === 'b' || reply.captured === 'n')
      && (replies.length > 0 || after.isCheckmate());
  });
  const kingRank = frame.coordinates.get(king.square)!.rank;
  const blackOnHFile = blackCoords.file === 7;
  const followBlack = !blackOnHFile && kingRank >= blackCoords.rank + 2;
  const preferOffsetPost = kingRank > blackCoords.rank;
  const target = followBlack
    ? {file: blackCoords.file + 1, rank: blackCoords.rank + 1}
    : {file: 6, rank: 4};
  const candidates = (safe.length ? safe : legal).map(move => {
    const n = move.piece === 'n' ? move.to : knight.square;
    const b = move.piece === 'b' ? move.to : bishop.square;
    const k = move.piece === 'k' ? move.to : king.square;
    const whiteCoords = frame.coordinates.get(k)!;
    const dx = whiteCoords.file - target.file;
    const dy = whiteCoords.rank - target.rank;
    // The weights implement the declared lexicographic priorities.
    const specificPost = black.square === frame.blackH1 ? frame.kingG3
      : black.square === frame.blackE2 ? frame.kingG2
      : frame.blackC1D1.has(black.square) ? frame.kingF2 : undefined;
    const onOffsetPost = specificPost ? k === specificPost
      : whiteCoords.file === blackCoords.file + (blackOnHFile ? -2 : 2)
        && whiteCoords.rank === blackCoords.rank + 1;
    // Only a general cage preference: r1 and explicit r2 declarations override it.
    const score = (move.piece === 'k' && isBoardEdge(move.to) ? 200000000 : 0)
      + (n === frame.post ? 0 : 100000000) + (frame.diagonal.has(b) ? 0 : 10000000)
      + ((specificPost || blackOnHFile || preferOffsetPost) && !onOffsetPost ? 1000000 : 0)
      + (followBlack || k === frame.kingDestination ? 0 : 100000)
      + (dx * dx + dy * dy) * 64
      + frame.edgeDistances.get(k)!;
    return {move, score};
  });
  const best = Math.min(...candidates.map(candidate => candidate.score));
  const tied = candidates.filter(candidate => candidate.score === best);
  const bishopPostAvailable = tied.some(({move}) => move.piece === 'b' && move.to === frame.bishopPost);
  return tied.filter(({move}) => !bishopPostAvailable || move.piece !== 'b' || move.to === frame.bishopPost)
    .map(({move}) => move.from + move.to);
}

// This explicitly assigned r2 arrival supersedes the general r1 Ng4 edge pattern.
// Match the whole destination, regardless of the piece that establishes it.
const r2NetHandoffDestinations = new Set(SQUARE_TRANSFORMS.map(transform =>
  transformFen('8/8/8/3BN3/5K1k/8/8/8 b - - 0 1', transform).split(' ')[0]));
export function r2NetHandoffMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  return getChess(fen).moves({verbose:true})
    .filter(move => r2NetHandoffDestinations.has(move.after.split(' ')[0]!))
    .map(move => move.from + move.to);
}

export function sevenCageMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const happy = happyR2Moves(fen);
  return happy.length ? happy : sevenCageHeuristicMoves(fen);
}

/** Historical preferences remain available when no verified continuation matches. */
export function sevenCageHeuristicMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const handoff = r2NetHandoffMoves(fen);
  if (handoff.length) return handoff;
  const board = getChess(fen), legal = board.moves({verbose: true});
  const exact = declaredSevenCageMove(fen);
  if (exact && legal.some(move => move.from + move.to === exact)) return [exact];
  const continuation = rankedDestinationMoves(fen, continuationDestinations);
  if (continuation.length) return continuation;
  const fallback = sevenCageFallbackMoves(fen);
  if (fallback.length) return fallback;
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
