import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove as score, knightAndBishopWhiteRules } from './bishopKnight'
import { knightAndBishopPrecageSideTarget as target } from './bishopKnightPrecageSide'

const start = '8/3k4/8/3BK3/2N5/8/8/8 w - - 0 1'
test('r6 chooses Kf6 toward rank 8 then h8 across all D4 symmetries', () => {
  assert.deepEqual(target(start), { axis: 'rank', edge: 7, corner: 'h8' })
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const move = getChess(fen).move({from:transformSquare('e5',t),to:transformSquare('f6',t)}).san
    assert.equal(target(fen)?.corner, transformSquare('h8',t))
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(score(fen, move).precageSideDistance, 1)
    assert.equal(score(fen, move).precageSideCornerDistanceSquared, 8)
  }
})
test('r6 prioritizes the bishop edge before the non-target corner', () => {
  const fen = '8/3k4/8/3B4/2N2K2/8/8/8 w - - 0 1'
  const priorities = knightAndBishopWhiteRules.find(r => r.id === 'r6')!.subpriorities!
  assert.ok(priorities[0]!.compare!(score(fen,'Ke5'), score(fen,'Kg4')) < 0)
  assert.equal(priorities[0]!.compare!(score(fen,'Ke5'), score(fen,'Kg5')), 0)
  assert.ok(priorities[1]!.compare!(score(fen,'Kg5'), score(fen,'Ke5')) < 0)
})
test('r6 uses pre-move eligibility and accepts nonadjacent precage knights', () => {
  assert.equal(score(start,'Be4').precageSideDistance, 2)
  assert.equal(score(start,'Nd6').precageSideCornerDistanceSquared, 18)
  assert.deepEqual(target('8/3k4/8/3BK3/8/3N4/8/8 w - - 0 1'),target(start))
  for (const fen of [
    '8/8/8/3BK3/2N5/3k4/8/8 w - - 0 1', // Black in knight half.
    '8/3k4/8/3BK3/8/4N3/8/8 w - - 0 1', // Knight off precage.
    '8/3k4/8/4K3/2N5/1B6/8/8 w - - 0 1', // Noncentral bishop.
  ]) assert.equal(target(fen), undefined)
})

test('r6 is inactive when White is closer to the target corner, including the loaded position', () => {
  for (const start of [
    '8/2K1k3/8/3B4/2N5/8/8/8 w - - 0 1', // a8: White 2 steps, Black 4.
    '8/8/8/3BK3/2N4k/8/8/8 w - - 0 1', // a8: White 4, Black 7.
    '8/4k3/8/3BK3/2N5/8/8/8 w - - 0 1', // a8: both 4 steps.
  ]) for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    assert.equal(target(fen), undefined)
    for (const move of getChess(fen).moves()) {
      assert.equal(score(fen, move).precageSideDistance, 0)
      assert.equal(score(fen, move).precageSideCornerDistanceSquared, 0)
    }
  }
})


test('r6 treats the edge and one step from it equally, then prefers the non-target corner across D4', () => {
  const start = '8/6K1/4k3/8/2N1B3/8/8/8 w - - 2 2'
  const priorities = knightAndBishopWhiteRules.find(r => r.id === 'r6')!.subpriorities!
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start,t)
    const move = (to: 'h7' | 'g8' | 'h6' | 'f8') => getChess(fen).move({from:transformSquare('g7',t),to:transformSquare(to,t)}).san
    const onEdge = score(fen,move('h7')), besideEdge = score(fen,move('g8'))
    assert.equal(onEdge.precageSideDistance,0)
    assert.equal(besideEdge.precageSideDistance,0)
    assert.equal(priorities[0]!.compare!(onEdge,besideEdge),0)
    assert.equal(priorities[1]!.compare!(onEdge,besideEdge),0)
    assert.ok(priorities[1]!.compare!(besideEdge,score(fen,move('h6')))<0)
    assert.equal(score(fen,move('f8')).precageSideDistance,1)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move('g8')])
  }
})
