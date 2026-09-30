import {r2NetHandoffMoves} from './bishopKnightSevenCage';
import {edgeMatingNetMoves} from './bishopKnightEdgeMatingNet';
import {findPiece, getChess, SQUARE_TRANSFORMS, transformFen} from '../chess';
import {matingNetLine, matingNetStart, matingNetBranchLine, matingNetBranchStart, matingNetBishopBranchLine, matingNetBishopBranchStart, matingNetKh2BranchLine, matingNetKf2BranchLine, matingNetKf1PartialLine, matingNetKg1BranchLine, matingNetCorrectedBishopLine} from './bishopKnightMatingNetLine';

function destinationVariants(source: string, progress: number) {
  return SQUARE_TRANSFORMS.map(transform => {
    const fen = transformFen(source, transform);
    return {
      fenKey: fen.split(' ').slice(0, 4).join(' '), progress,
      white: [findPiece(fen, 'w', 'k')!, findPiece(fen, 'w', 'b')!, findPiece(fen, 'w', 'n')!],
      black: findPiece(fen, 'b', 'k')!.square,
    };
  });
}

// Full post-White destinations, never literal source/move exceptions.
function lineDestinations(start: string, line: readonly string[], offset: number) {
  const board = getChess(start);
  return line.flatMap((san, progress) => {
    const move = board.move(san);
    return move.color === 'w' ? destinationVariants(board.fen(), offset + progress) : [];
  });
}
const destinations = [
  ...lineDestinations(matingNetStart, matingNetLine, 0),
  // Corrected r2 handoff: Bc4 with Kc3/Nc2 and Black still on d1.
  // Before the original Nd4 stage, preserving Nd4 when Ba2 is already placed.
  ...destinationVariants('8/8/8/8/2B5/2K5/2N5/3k4 b - - 17 9', -0.5),
  // Align branches by remaining plies to mate, so a newer early step cannot
  // outrank a later step of the original line.
  ...lineDestinations(matingNetBranchStart, matingNetBranchLine, matingNetLine.length - matingNetBranchLine.length),
  ...lineDestinations(matingNetBishopBranchStart, matingNetBishopBranchLine, matingNetLine.length - matingNetBishopBranchLine.length),
];
// A shorter new branch must not promote shared earlier destinations and make
// established lines step backwards. Preserve their existing progress ranks.
// New destinations rank between existing stages: at equal remaining length,
// keep the earlier declaration preferred (Bd3 before the alternate Nf4 route).
const establishedFens = new Set(destinations.map(destination => destination.fenKey));
destinations.push(...lineDestinations(matingNetStart, matingNetKh2BranchLine, matingNetLine.length - matingNetKh2BranchLine.length - 0.5)
  .filter(destination => !establishedFens.has(destination.fenKey)));
// Declared 2.Kd3 after Nd4 ...Ke1, between the initial Nd4 and Ne2 steps.
destinations.push(...destinationVariants('8/8/8/8/3N4/3K4/B7/4k3 b - - 9 5', 1));
const priorKf2Fens = new Set(destinations.map(destination => destination.fenKey));
destinations.push(...lineDestinations(matingNetStart, matingNetKf2BranchLine, matingNetLine.length - matingNetKf2BranchLine.length - 0.5)
  .filter(destination => !priorKf2Fens.has(destination.fenKey)));
// The latest partial line declares only these destinations, not a new finish.
const priorKf1Fens = new Set(destinations.map(destination => destination.fenKey));
destinations.push(...lineDestinations(matingNetStart, matingNetKf1PartialLine, 0)
  .filter(destination => !priorKf1Fens.has(destination.fenKey)));
// Declared 4.Ke3 after ...Kf1; Black's subsequent ...Ke1 is not part of the destination.
destinations.push(...destinationVariants('8/8/8/8/8/4K3/B3N3/5k2 b - - 13 7', 7));
const priorKg1Fens = new Set(destinations.map(destination => destination.fenKey));
destinations.push(...lineDestinations(matingNetStart, matingNetKg1BranchLine, matingNetLine.length - matingNetKg1BranchLine.length - 0.5)
  .filter(destination => !priorKg1Fens.has(destination.fenKey)));
// Corrected branch: Be6 must precede Ke3 after Ne2 ...Kg2.
// Fit the corrected partial steps after the early setup, before later bishop
// placements in established mating lines; shared destination ranks stay fixed.
const priorCorrectedFens = new Set(destinations.map(destination => destination.fenKey));
destinations.push(...lineDestinations(matingNetStart, matingNetCorrectedBishopLine, 0)
  .map(destination => ({...destination, progress: 3.5 + destination.progress / 2}))
  .filter(destination => !priorCorrectedFens.has(destination.fenKey)));
// Declared 5.Ke3 after Be6 ...Kh1, before the Kf3 continuation.
destinations.push(...destinationVariants('8/8/4B3/8/8/4K3/4N3/7k b - - 15 8', 11));
// Declared 5.Ke3 after Be6 ...Kf1; the later ...Ke1 is not the destination.
destinations.push(...destinationVariants('8/8/4B3/8/8/4K3/4N3/5k2 b - - 15 8', 7.5));
// Declared Kg3 after Nf4 ...Kh1, before the bishop's final placement.
destinations.push(...destinationVariants('8/8/4B3/8/5N2/6K1/8/7k b - - 3 2', 19.5));
// Declared Be6/Ng2/Bc4+/Kg3 route, matched by full destinations.
destinations.push(...destinationVariants('8/8/4B3/8/8/5K2/6N1/6k1 b - - 3 2', 17.5));
destinations.push(...destinationVariants('8/8/8/8/2B5/5K2/6N1/5k2 b - - 5 3', 21.5));
destinations.push(...destinationVariants('8/8/8/8/2B5/6K1/6N1/6k1 b - - 7 4', 21));
// Declared Kf3 with Bc2/Nf4 after ...Kg1.
destinations.push(...destinationVariants('8/8/8/8/5N2/5K2/2B5/6k1 b - - 3 2', 15));
// Corrected early order: Ne2 before Ke3 after Kd3 ...Kf1.
destinations.push(...destinationVariants('8/8/8/8/8/3K4/B3N3/5k2 b - - 11 6', 4.5));
// Loaded Bd5/Ke3 setup and Bd3 waiting move with Black on h1.
destinations.push(...destinationVariants('8/8/8/3B4/8/3K4/4Nk2/8 b - - 13 7', 12));
destinations.push(...destinationVariants('8/8/8/3B4/8/4K3/4N3/4k3 b - - 15 8', 9));
destinations.push(...destinationVariants('8/8/8/8/8/3B2K1/6N1/7k b - - 29 15', 20.5));
// Declared Ke3 after Be4 ...Kf1, before later bishop placements.
destinations.push(...destinationVariants('8/8/8/8/4B3/4K3/4N3/5k2 b - - 19 10', 7.75));
// Declared Bd3 after Kf3 ...Kh2 with the knight on f4.
destinations.push(...destinationVariants('8/8/8/8/5N2/3B1K2/7k/8 b - - 23 12', 18.5));
// Loaded Kg3/Bd3 continuation after Kf3 ...Kh1 with Bc2.
destinations.push(...destinationVariants('8/8/8/8/5N2/6K1/2B5/7k b - - 23 12', 19));
destinations.push(...destinationVariants('8/8/8/8/5N2/3B2K1/8/6k1 b - - 25 13', 21.5));
// Loaded Bf5 ...Kh2 Kf3 ...Kh1 Nf4 ...Kh2 Bd3 continuation.
destinations.push(...destinationVariants('8/8/8/5B2/8/5K2/4N2k/8 b - - 3 2', 16));
destinations.push(...destinationVariants('8/8/8/5B2/5N2/5K2/8/7k b - - 5 3', 18));
destinations.push(...destinationVariants('8/8/8/8/5N2/3B1K2/7k/8 b - - 7 4', 20));
// Loaded 7.Kf4: match the full arrival before Black replies ...Kh4.
destinations.push(...destinationVariants('8/8/8/7k/4BKN1/8/8/8 b - - 13 7', 0));
// Loaded 7.Bd5, before Black's ...Kh6, independent of the arriving piece.
destinations.push(...destinationVariants('8/6k1/6N1/3B1K2/8/8/8/8 b - - 13 7', 0));
const progressByFen = new Map<string, number>();
for (const {fenKey, progress} of destinations) progressByFen.set(fenKey, Math.max(progress, progressByFen.get(fenKey) ?? -1));

// The newly declared Ng2 route supersedes the earlier direct Bc4 arrival.
for (const {fenKey} of destinationVariants('8/8/8/8/2B2N2/5K2/8/6k1 b - - 0 1', 17)) progressByFen.set(fenKey, 17);

/** Prefer the furthest legal destination in the declared net, under D4. */
function declaredMatingNetMoves(fen: string): readonly string[] {
  if (fen.split(' ')[1] !== 'w') return [];
  const white = [findPiece(fen, 'w', 'k'), findPiece(fen, 'w', 'b'), findPiece(fen, 'w', 'n')];
  const black = findPiece(fen, 'b', 'k')?.square;
  if (!black || white.some(piece => !piece)) return [];
  const candidates = new Set<string>();
  for (const destination of destinations) {
    if (black !== destination.black) continue;
    const changed = white.map((piece, i) => piece!.square === destination.white[i]!.square ? -1 : i).filter(i => i !== -1);
    if (changed.length !== 1) continue;
    const i = changed[0]!;
    candidates.add(white[i]!.square + destination.white[i]!.square);
  }
  if (!candidates.size) return [];
  const arrivals = getChess(fen).moves({verbose: true})
    .filter(move => candidates.has(move.from + move.to))
    .map(move => ({uci: move.from + move.to, progress: progressByFen.get(move.after.split(' ').slice(0, 4).join(' ')) ?? -1}))
    .filter(move => move.progress > -1);
  const best = Math.max(-1, ...arrivals.map(move => move.progress));
  return arrivals.filter(move => move.progress === best).map(move => move.uci);
}


/** Keep established net destinations first, then the newer edge-pattern preferences. */
export function matingNetMoves(fen: string): readonly string[] {
  const declared = declaredMatingNetMoves(fen);
  if (declared.length) return declared;
  return r2NetHandoffMoves(fen).length ? [] : edgeMatingNetMoves(fen);
}
