import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {getChess} from '../../app/src/mate/chess';
import {bishopKnightRuleSet as policy} from '../../app/src/mate/rules/bishopKnight';
import {selectCandidatesByRules} from '../../app/src/mate/rules/selection';
import {canonical, code} from './encoding.mts';

// Input: audited winning sources with all legal, tablebase-winning SAN moves.
// Keep the baseline candidates: rebuilding them after the repair would omit fixed sources.
const input = process.argv[2];
assert.ok(input, 'Usage: tsx generate-piece-preservation.mts candidates.json [output.json]');
type Candidate = {source: number; fen: string; winning: string[]};
const candidates: Candidate[] = JSON.parse(readFileSync(input, 'utf8'));
const rules = policy.whiteRules.filter(rule => rule.id !== 'r4.2');
const prefix = rules.slice(0, rules.findIndex(rule => rule.id === 'r4.1') + 1);
const blocked: {source: number; fen: string; san: string}[] = [];
const moves = candidates.map(row => {
  assert.equal(code(row.fen), row.source);
  assert.equal(canonical(row.source), row.source);
  assert.ok(row.winning.length, row.fen);
  const scored = policy.scoreWhiteCandidates!(row.fen, policy.whiteMoves(row.fen));
  const eligible = selectCandidatesByRules(scored, prefix).idealCandidates
    .filter(candidate => row.winning.includes(candidate.san));
  const winners = eligible.length ? eligible : scored.filter(candidate => row.winning.includes(candidate.san));
  const san = selectCandidatesByRules(winners, rules).idealCandidates.map(candidate => candidate.san).sort()[0]!;
  if (!eligible.length) blocked.push({source: row.source, fen: row.fen, san});
  const move = getChess(row.fen).move(san);
  const square = (s: string) => s.charCodeAt(0) - 97 + (Number(s[1]) - 1) * 8;
  return [row.source, (square(move.from) << 6) | square(move.to)];
}).sort((a, b) => a[0]! - b[0]!);
assert.equal(new Set(moves.map(row => row[0])).size, moves.length);
const output = process.argv[3] ?? 'app/src/mate/rules/bishopKnightPiecePreservationData.json';
writeFileSync(output, '{\n  "moves": [\n' + moves.map(row => '    ' + JSON.stringify(row)).join(',\n') + '\n  ]\n}\n');
console.log(JSON.stringify({entries: moves.length, blockedByEarlierRule: blocked, output}, null, 2));
