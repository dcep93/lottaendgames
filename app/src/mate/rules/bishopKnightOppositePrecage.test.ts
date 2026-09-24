import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {scoreKnightAndBishopWhiteMove as score, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules} from './bishopKnight'

const rule = knightAndBishopWhiteRules.find(r => r.id === 'r9.99')!
test('r9.99 targets c4 across the long diagonal from Black, across D4', () => {
  const start = '8/8/5k2/3B4/5K2/4N3/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start,t)
    const san = (to: 'c4' | 'g4') => getChess(fen).move({from:transformSquare('e3',t),to:transformSquare(to,t)}).san
    const onTarget = score(fen,san('c4')), away = score(fen,san('g4'))
    assert.equal(onTarget.oppositePrecageDistance,0)
    assert.ok(rule.compare!(onTarget,away)<0)
  }
})
test('r9.99 freezes eligibility and targets before White moves', () => {
  const start = '8/8/4Nk2/3B4/5K2/8/8/8 w - - 0 1'
  assert.equal(score(start,'Be4').oppositePrecageDistance,4)
  assert.equal(score(start,'Kg4').oppositePrecageDistance,4)
  for (const [fen,move] of [
    ['8/8/4Nk2/3B4/6K1/8/8/8 w - - 0 1','Nc5'],
    ['8/8/4Nk2/1B6/5K2/8/8/8 w - - 0 1','Nc5'],
    ['k7/8/2N5/3B4/5K2/8/8/8 w - - 0 1','Nd4+'],
  ]) assert.equal(score(fen!,move!).oppositePrecageDistance,0)
})
test('Nc5 and Ng5 each need three knight moves to the opposite precage c4', () => {
  const fen = '8/8/4Nk2/3B4/5K2/8/8/8 w - - 0 1'
  assert.equal(score(fen,'Nc5').oppositePrecageDistance,3)
  assert.equal(score(fen,'Ng5').oppositePrecageDistance,3)
})


test('r9.99 prefers Nc5 over Ng5 through geometric proximity, across D4', () => {
  const start = '8/8/4Nk2/3B4/5K2/8/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start,t)
    const san = (to: 'c5' | 'g5') => getChess(fen).move({from:transformSquare('e6',t),to:transformSquare(to,t)}).san
    const closer = score(fen,san('c5')), farther = score(fen,san('g5'))
    assert.equal(closer.oppositePrecageEuclideanDistanceSquared,1)
    assert.equal(farther.oppositePrecageEuclideanDistanceSquared,17)
    assert.ok(rule.compare!(closer,farther)<0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('c5')])
  }
})
