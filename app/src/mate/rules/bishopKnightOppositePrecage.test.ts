import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {scoreKnightAndBishopWhiteMove as score, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules} from './bishopKnight'

const rule = knightAndBishopWhiteRules.find(r => r.id === 'r7.8')!
test('r7.8 targets c4 across the long diagonal from Black, across D4', () => {
  const start = '8/8/5k2/3B4/5K2/4N3/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start,t)
    const san = (to: 'c4' | 'g4') => getChess(fen).move({from:transformSquare('e3',t),to:transformSquare(to,t)}).san
    const onTarget = score(fen,san('c4')), away = score(fen,san('g4'))
    assert.equal(onTarget.oppositePrecageDistance,0)
    assert.ok(rule.compare!(onTarget,away)<0)
  }
})
test('r7.8 freezes eligibility and targets before White moves', () => {
  const start = '8/8/4Nk2/3B4/5K2/8/8/8 w - - 0 1'
  assert.equal(score(start,'Be4').oppositePrecageDistance,2)
  assert.equal(score(start,'Kg4').oppositePrecageDistance,2)
  for (const [fen,move] of [
    ['8/8/4Nk2/3B4/6K1/8/8/8 w - - 0 1','Nc5'],
    ['8/8/4Nk2/1B6/5K2/8/8/8 w - - 0 1','Nc5'],
    ['k7/8/2N5/3B4/5K2/8/8/8 w - - 0 1','Nd4+'],
  ]) assert.equal(score(fen!,move!).oppositePrecageDistance,0)
})
test('Nc5 reaches d3 in one knight move while Ng5 needs three to either target', () => {
  const fen = '8/8/4Nk2/3B4/5K2/8/8/8 w - - 0 1'
  assert.equal(score(fen,'Nc5').oppositePrecageDistance,1)
  assert.equal(score(fen,'Ng5').oppositePrecageDistance,3)
})


test('r7.8 ranks Nc5 over Ng5 while the earlier king rule can choose Ke4 across D4', () => {
  const start = '8/8/4Nk2/3B4/5K2/8/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start,t)
    const san = (to: 'c5' | 'g5') => getChess(fen).move({from:transformSquare('e6',t),to:transformSquare(to,t)}).san
    const closer = score(fen,san('c5')), farther = score(fen,san('g5'))
    assert.equal(closer.oppositePrecageEuclideanDistanceSquared,1)
    assert.equal(farther.oppositePrecageEuclideanDistanceSquared,13)
    assert.ok(rule.compare!(closer,farther)<0)
    const kingMove = getChess(fen).move({from:transformSquare('f4',t),to:transformSquare('e4',t)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[kingMove])
  }
})


test('r7.8 takes priority over r8 to prefer Nc5 instead of Be4 across D4', () => {
  const start = '8/8/4N1k1/3BK3/8/8/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start,t)
    const san = (to: 'c5' | 'd4') => getChess(fen).move({from:transformSquare('e6',t),to:transformSquare(to,t)}).san
    const closer = score(fen,san('c5')), farther = score(fen,san('d4'))
    assert.equal(closer.oppositePrecageDistance,1)
    assert.equal(farther.oppositePrecageDistance,3)
    assert.ok(rule.compare!(closer,farther)<0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('c5')])
  }
})

test('r7.8 prefers Nd3 in the loaded position across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/2NBK1k1/8/8/8/8 w - - 0 1', t)
    const move = getChess(fen).move({from:transformSquare('c5',t),to:transformSquare('d3',t)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
  }
})


test('r7.8 gives no frozen-target credit after the bishop leaves the center, across D4', () => {
  const start = '8/8/8/1k1BK3/N7/8/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const san = (from: 'd5' | 'a4', to: 'b3' | 'e4' | 'b6') =>
      getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san
    const offCenter = score(fen, san('d5', 'b3'))
    const central = score(fen, san('d5', 'e4'))
    const knightMove = score(fen, san('a4', 'b6'))
    assert.equal(offCenter.oppositePrecageDistance, 99)
    assert.equal(offCenter.oppositePrecageEuclideanDistanceSquared, 99)
    assert.ok(rule.compare!(central, offCenter) < 0)
    assert.ok(rule.compare!(knightMove, offCenter) < 0)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(san('d5', 'b3')))
  }
})


test('r7.8 prefers knight adjacency even without a central bishop, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('4B3/8/8/8/3k1K2/2N5/8/8 w - - 0 1', t)
    const san = (to: 'e4' | 'a4') => getChess(fen).move({from: transformSquare('c3', t), to: transformSquare(to, t)}).san
    const adjacent = score(fen, san('e4')), distant = score(fen, san('a4'))
    assert.equal(adjacent.oppositePrecageDistance, 0)
    assert.equal(distant.oppositePrecageDistance, 0)
    assert.equal(adjacent.middle16KnightKingAdjacencyPenalty, 0)
    assert.equal(distant.middle16KnightKingAdjacencyPenalty, 1)
    assert.ok(rule.compare!(adjacent, distant) < 0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('e4')])
  }
})

test('r7.8 adjacency stays neutral with a king starting outside the middle 16', () => {
  const fen = '4B3/8/8/8/3k4/2N5/5K2/8 w - - 0 1'
  const adjacent = score(fen, 'Ne2'), distant = score(fen, 'Na4')
  assert.equal(adjacent.middle16KnightKingAdjacencyPenalty, 0)
  assert.equal(distant.middle16KnightKingAdjacencyPenalty, 0)
  assert.equal(rule.compare!(adjacent, distant), 0)
})
