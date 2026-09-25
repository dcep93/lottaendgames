import {readFileSync} from 'node:fs';
import {findPiece, getChess, squareCoordinates} from '../../app/src/mate/chess.ts';
import {encodeMateReplay, decodeMateReplay} from '../../app/src/mate/share.ts';
import {code, transform} from './encoding.mts';
import {verifyLoopExample} from './verify-loop-example.mts';

type Example = {fen: string; moves: string[]};
const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Usage: select-loop-examples.mts CANDIDATE_JSON [CANDIDATE_JSON ...]');
const candidates = paths.flatMap(path => {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return (Array.isArray(data) ? data : data.loops ?? []) as Example[];
}).filter(e => e.fen && e.moves?.length === 4).map(e => {
  const squares = (['k', 'b', 'n'] as const).map(p => squareCoordinates(findPiece(e.fen, 'w', p)!.square));
  const files = squares.map(s => s.file), ranks = squares.map(s => s.rank);
  return {...e, area: (Math.max(...files) - Math.min(...files) + 1) * (Math.max(...ranks) - Math.min(...ranks) + 1)};
}).sort((a, b) => b.area - a.area);
const seen = new Set<string>(), selected = [];
for (const candidate of candidates) {
  if (!verifyLoopExample(candidate.fen, candidate.moves)) continue;
  const board = getChess(candidate.fen), states: number[] = [];
  for (const san of candidate.moves) {
    if (board.turn() === 'w') states.push(code(board.fen()));
    board.move(san);
  }
  const identity = Array.from({length: 8}, (_, t) => states.map(k => transform(k, t)).sort((a, b) => a - b).join(',')).sort()[0]!;
  if (seen.has(identity)) continue;
  const hash = encodeMateReplay(candidate.fen, candidate.moves, 0);
  if (!decodeMateReplay(hash, 'bishop-knight').ok) throw new Error('Invalid replay');
  seen.add(identity);
  selected.push({...candidate, url: 'http://localhost:5173/mate/bishop-knight' + hash});
  if (selected.length === 4) break;
}
console.log(JSON.stringify(selected, null, 2));
// A short result means insufficient eligible candidates, not a complete census.
