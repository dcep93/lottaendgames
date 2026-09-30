import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../../app/src/mate/chess';
import {bishopKnightPiecePreservationMoves as lookup} from '../../app/src/mate/rules/bishopKnightPiecePreservation';
import {bishopKnightRuleSet as policy} from '../../app/src/mate/rules/bishopKnight';
import {selectCandidatesByRules} from '../../app/src/mate/rules/selection';
import {canonical, fen, square} from './encoding.mts';
import data from '../../app/src/mate/rules/bishopKnightPiecePreservationData.json';

let orientations = 0;
const blocked = [];
for (const [source, encoded] of data.moves) {
  assert.equal(canonical(source!), source);
  const f = fen(source!), from = square(encoded! >> 6), to = square(encoded! & 63);
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = transformFen(f, transform);
    const expected = transformSquare(from, transform) + transformSquare(to, transform);
    assert.deepEqual(lookup(reflected), [expected], reflected);
    const board = getChess(reflected);
    assert.ok(board.moves({verbose:true}).some(move => move.from + move.to === expected));
    orientations++;
  }
  const selection = selectCandidatesByRules(policy.scoreWhiteCandidates!(f, policy.whiteMoves(f)), policy.whiteRules);
  const actual = selection.idealCandidates.map(({san}) => {const m=getChess(f).move(san);return m.from+m.to;});
  if (actual.length !== 1 || actual[0] !== from+to)
    blocked.push({source, fen: f, actual, expected: from+to, rule: selection.lastEliminatingRule?.id});
}
// Supply a frozen baseline to check that every repaired recommendation really changed.
if (process.argv[2]) {
  const baseline = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  assert.equal(data.moves.length, baseline.length);
}
console.log(JSON.stringify({entries:data.moves.length, orientations, blocked}, null, 2));
assert.equal(blocked.length, 0, 'Earlier priorities still prevent some lookup choices');
