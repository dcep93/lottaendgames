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
    assert.equal(score(fen, move).precageSideDistance, 2)
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
  assert.equal(score(start,'Be4').precageSideDistance, 3)
  assert.equal(score(start,'Nd6').precageSideCornerDistanceSquared, 18)
  assert.deepEqual(target('8/3k4/8/3BK3/8/3N4/8/8 w - - 0 1'),target(start))
  for (const fen of [
    '8/8/8/3BK3/2N5/3k4/8/8 w - - 0 1', // Black in knight half.
    '8/3k4/8/3BK3/8/4N3/8/8 w - - 0 1', // Knight off precage.
    '8/3k4/8/4K3/2N5/1B6/8/8 w - - 0 1', // Noncentral bishop.
  ]) assert.equal(target(fen), undefined)
})
