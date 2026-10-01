import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {selectCandidatesByRules} from './selection';

test('r6.1 is inactive when the king already defends the knight, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const position of [
    '8/1K6/N7/k7/8/8/8/7B w - - 2 2',
    '8/K7/N7/1k6/8/8/8/7B w - - 0 1',
  ]) {
    const fen = transformFen(position, t);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.ok(candidates.every(c => !c.score.kingStepsTowardKnight), t.name);
    const selected = selectCandidatesByRules(candidates, knightAndBishopWhiteRules.filter(r => r.id === 'r6.1'));
    assert.equal(selected.idealCandidates.length, candidates.length, t.name);
  }
});


test('r6.1 prefers a king step toward the knight and r7.1 breaks centrality ties, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('6B1/6K1/8/N1k5/8/8/8/8 w - - 0 1', t);
    const san = (from: 'g7' | 'a5', to: 'f6' | 'f7' | 'f8' | 'b7') => getChess(fen).move({
      from: transformSquare(from, t), to: transformSquare(to, t),
    }).san;
    for (const to of ['f6', 'f7'] as const) {
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san('g7', to)).kingStepsTowardKnight, true, t.name);
    }
    // Kf8 increases rank distance but reduces total king-step distance, so it qualifies.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('g7', 'f8')).kingStepsTowardKnight, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules.filter(r => r.id === "r6.1" || r.id === "r7.1"));
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [san('g7', 'f6')], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === san('a5', 'b7'))!)?.id, 'r6.1', t.name);
    assert.equal(selection.lastEliminatingRule?.id, 'r7.1', t.name);
  }
});

test('r6.1 rejects backward bishop-ray detours and screening moves across D4',()=>{
  for(const t of SQUARE_TRANSFORMS){
    const fen=transformFen('8/7B/8/2k1K3/8/8/8/1N6 w - - 0 1',t);
    const san=(to:'f4'|'e4')=>getChess(fen).move({from:transformSquare('e5',t),to:transformSquare(to,t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,san('f4')).kingStepsTowardKnight,false,t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen,san('e4')).kingStepsTowardKnight,false,t.name);

  }
});

test('r6.1 accepts a non-backward sidestep but rejects one moving away in a dimension without fewer steps, across D4',()=>{
  for(const t of SQUARE_TRANSFORMS) for(const [start,king,side] of [
    ['4K3/8/4k3/3N4/8/8/B7/8 w - - 0 1','e8','d8'],
    ['3K4/8/3k4/3N4/8/8/B7/8 w - - 0 1','d8','e8'],
  ] as const){
    const fen=transformFen(start,t);
    const sidestep=getChess(fen).move({from:transformSquare(king,t),to:transformSquare(side,t)}).san;
    const knight=getChess(fen).move({from:transformSquare('d5',t),to:transformSquare('e7',t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,sidestep).kingStepsTowardKnight,king==='e8',t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen,knight).knightDefensePenalty,0,t.name);
    const candidates=getChess(fen).moves().map(san=>({san,score:scoreKnightAndBishopWhiteMove(fen,san)}));
    const selection=selectCandidatesByRules(candidates,knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c=>c.san),[king==='e8'?sidestep:knight],t.name);
  }
});


test('r6.1 rejects loaded Kf4 because it moves away from Na8 in the file dimension across D4',()=>{
  for(const t of SQUARE_TRANSFORMS){
    const fen=transformFen('N7/8/8/2k5/8/4K3/8/7B w - - 0 1',t);
    const san=getChess(fen).move({from:transformSquare('e3',t),to:transformSquare('f4',t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,san).kingStepsTowardKnight,false,t.name);
  }
});


test('r6.1 allows fewer king steps OR no backward component, selecting loaded Ke2 across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/8/N2k4/5K2/8/3B4 w - - 2 2',t);
  const san=(to:'e2'|'f4'|'g2')=>getChess(fen).move({from:transformSquare('f3',t),to:transformSquare(to,t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san('e2')).kingStepsTowardKnight,true,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san('f4')).kingStepsTowardKnight,true,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san('g2')).kingStepsTowardKnight,false,t.name);
  const candidates=getChess(fen).moves().map(san=>({san,score:scoreKnightAndBishopWhiteMove(fen,san)}));
  assert.deepEqual(selectCandidatesByRules(candidates,knightAndBishopWhiteRules).idealCandidates.map(c=>c.san),[san('e2')],t.name);
 }
});
