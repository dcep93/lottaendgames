import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {rareDegenerateEscapeMove} from './bishopKnightRareEscape';
import {bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {explainMove} from './selection';

const examples = [
  ['8/K7/B1k5/8/8/3N4/8/8 w - - 0 1', 'a6', 'c4'],
  ['8/8/8/8/4N3/1k6/8/KB6 w - - 0 1', 'b1', 'd3'],
  ['8/8/8/8/2kN4/8/8/KB6 w - - 14 8', 'd4', 'f5'],
  ['8/8/8/8/8/k3N3/8/KB6 w - - 0 1', 'e3', 'f5'],
  ['8/8/8/8/8/4k3/5N2/5K1B w - - 20 11', 'f1', 'e1'],
  ['8/8/K7/B1k5/8/8/3N4/8 w - - 0 1', 'a5', 'c3'],
  ['8/8/8/8/3k4/3BN3/4K3/8 w - - 12 7', 'd3', 'c4'],
] as const;

test('r4.1 chooses the declared escapes and general edge pattern across D4', () => {
  for (const [source, from, to] of examples) for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(source, transform);
    const move = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)});
    assert.equal(rareDegenerateEscapeMove(fen), move.from + move.to);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
  }
});

test('r4.1 does not broaden exact arrangements or relax the geometric conditions', () => {
  for (const fen of [
    '8/K7/B2k4/8/8/3N4/8/8 w - - 0 1',
    '8/K7/B1k5/8/8/8/4N3/8 w - - 0 1',
    '8/8/B1k5/K7/8/3N4/8/8 w - - 0 1',
    '8/8/8/8/3N4/2k5/8/K1B5 w - - 0 1',
    '8/8/8/8/8/3k4/4N3/4K1B1 w - - 0 1',
    '8/8/8/8/2kN4/8/8/KB6 b - - 0 1',
    '8/8/8/3k4/8/3BN3/4K3/8 w - - 0 1',
  ]) assert.equal(rareDegenerateEscapeMove(fen), undefined, fen);
});

test('r4.1 has one diagram per case and sits immediately after r4', () => {
  const ids = knightAndBishopWhiteRules.map(rule => rule.id);
  assert.equal(ids[ids.indexOf('r4') + 1], 'r4.1');
  assert.equal(ids[ids.indexOf('r4.1') + 1], 'r4.2');
  const diagrams = bishopKnightRuleSet.help.noteBoards.filter(board => board.id.startsWith('bishop-knight-rule-r41-'));
  assert.equal(diagrams.length, 4);
  assert.deepEqual(diagrams.map(board => board.arrows?.[0]), [
    {from: 'a6', to: 'c4'}, {from: 'd4', to: 'f5'}, {from: 'f1', to: 'e1'},
    {from: 'd3', to: 'c4'},
  ]);
});

test('r4.1 rejects a Black reply that activates formation avoidance, across D4', () => {
  const source = '8/8/8/N7/8/8/B7/K1k5 w - - 0 1';
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(source, transform);
    const chess = getChess(fen);
    const rejected = chess.move({from: transformSquare('a5', transform), to: transformSquare('b3', transform)});
    chess.move({from: transformSquare('c1', transform), to: transformSquare('c2', transform)});
    // This source has no declared escape, but r4.1 filters Nc5 and Nd4+.
    assert.equal(rareDegenerateEscapeMove(chess.fen()), undefined);
    const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(fen, bishopKnightRuleSet.whiteMoves(fen));
    assert.equal(explainMove(candidates, knightAndBishopWhiteRules, rejected.san)?.id, 'r4.1');
    assert.equal(scoreKnightAndBishopWhiteMove(fen, rejected.san).rareEscapePenalty, 1);
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(rejected.san));
    const alternative = getChess(fen).move({from: transformSquare('a5', transform), to: transformSquare('c4', transform)});
    assert.equal(scoreKnightAndBishopWhiteMove(fen, alternative.san).rareEscapePenalty, 0);
  }
});


test('r4.1(b) ignores Black location across D4', () => {
  for (const knight of ['d4', 'e3'] as const)
  for (const black of ['c3', 'a3', 'e7', 'a4', 'd7'] as const) {
    const board = getChess('8/8/8/8/3N4/2k5/8/KB6 w - - 0 1');
    board.remove('d4');
    board.put({type: 'n', color: 'w'}, knight);
    board.remove('c3');
    board.put({type: 'k', color: 'b'}, black);
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(board.fen(), transform);
      const target = transformSquare(knight, transform) + transformSquare('f5', transform);
      const legal = getChess(fen).moves({verbose: true}).find(move => move.from + move.to === target);
      assert.equal(rareDegenerateEscapeMove(fen), legal ? target : undefined);
      if (legal) assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [legal.san]);
    }
  }
});

test('r4.1(b) disfavors recreating the formation with any White piece, across D4', () => {
  for (const [source, from, to] of [
    ['8/8/8/2k5/8/8/2N5/KB6 w - - 0 1', 'c2', 'd4'],
    ['8/8/8/2k5/3N4/8/1K6/1B6 w - - 0 1', 'b2', 'a1'],
    ['8/8/8/2k5/3N4/8/2B5/K7 w - - 0 1', 'c2', 'b1'],
    ['8/8/8/8/8/1k6/2N5/KB6 w - - 0 1', 'c2', 'e3'],
  ] as const) for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(source, transform);
    const move = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)});
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move.san).rareEscapePenalty, 1);
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move.san));
    assert.ok(getChess(fen).moves().some(san => scoreKnightAndBishopWhiteMove(fen, san).rareEscapePenalty === 0));
  }
});
