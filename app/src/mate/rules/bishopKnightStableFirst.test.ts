import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';

const r6=knightAndBishopWhiteRules.find(r=>r.id==='r6')!;

test('r6 preserves stable protection in the loaded Ba4 Nd1 position, then r7 chooses Kg7 across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('7K/8/8/2k5/B7/8/8/3N4 w - - 0 1',t);
  const san=(from:'h8'|'a4'|'d1',to:'g7'|'c2'|'e3')=>getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const king=san('h8','g7'), bishop=san('a4','c2'), knight=san('d1','e3');
  const keep=scoreKnightAndBishopWhiteMove(fen,king), alsoKeep=scoreKnightAndBishopWhiteMove(fen,bishop), leave=scoreKnightAndBishopWhiteMove(fen,knight);
  assert.equal(keep.knightStableBishopProtectionPenalty,0,t.name);
  assert.equal(alsoKeep.knightStableBishopProtectionPenalty,0,t.name);
  assert.equal(leave.knightStableBishopProtectionPenalty,1,t.name);
  assert.ok(leave.knightKingProtectionDistance<keep.knightKingProtectionDistance,t.name);
  assert.ok(r6.compare!(keep,leave)<0,t.name);
  assert.equal(r6.compare!(keep,alsoKeep),0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[king],t.name);
 }
});

test('r6 recognizes resulting stable bishop defense, including interior adjacency but excluding edge adjacency across D4',()=>{
 const cases=[
  {fen:'8/8/2B5/1N6/8/8/5k2/7K w - - 0 1',penalty:0},
  {fen:'2B5/1N6/8/8/8/8/5k2/7K w - - 0 1',penalty:1},
 ] as const;
 for(const c of cases)for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen(c.fen,t);
  const san=getChess(fen).move({from:transformSquare('h1',t),to:transformSquare('h2',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san).knightStableBishopProtectionPenalty,c.penalty,t.name);
 }
});


test('r6 keeps king protection, then adds stable bishop protection with Nd5 across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B4k2/8/8/4K3/5N2/8/8/8 w - - 2 2',t);
  const san=(to:'d5'|'e6')=>getChess(fen).move({from:transformSquare('f4',t),to:transformSquare(to,t)}).san;
  const both=scoreKnightAndBishopWhiteMove(fen,san('d5'));
  const kingOnly=scoreKnightAndBishopWhiteMove(fen,san('e6'));
  assert.equal(both.kingKnightAdjacencyPenalty,0,t.name);
  assert.equal(kingOnly.kingKnightAdjacencyPenalty,0,t.name);
  assert.equal(both.knightStableBishopProtectionPenalty,0,t.name);
  assert.equal(kingOnly.knightStableBishopProtectionPenalty,1,t.name);
  assert.ok(r6.compare!(both,kingOnly)<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('d5')],t.name);
 }
});
