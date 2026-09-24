import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { precageKingEdges, kingEdgeDistance } from './bishopKnightPrecageEdges'
import { scoreKnightAndBishopWhiteMove, knightAndBishopWhiteRules } from './bishopKnight'

const position = '8/2k5/8/3BK3/2N5/8/8/8 w - - 0 1'
test('r5.1 targets top then left for Bd5/Nc4 and preserves distances under every D4 transform', () => {
  assert.deepEqual(precageKingEdges(position), ['top', 'left'])
  assert.deepEqual(precageKingEdges('8/8/k7/2KB4/2N5/8/8/8 w - - 0 1'), ['top', 'left'])
  for (const transform of SQUARE_TRANSFORMS) {
    const edges = precageKingEdges(transformFen(position, transform))
    assert.equal(edges.length, 2)
    for (const square of ['e5', 'f6', 'e6', 'e4', 'c8'] as const) {
      assert.deepEqual(edges.map(edge => kingEdgeDistance(transformSquare(square, transform), edge)),
        precageKingEdges(position).map(edge => kingEdgeDistance(square, edge)))
    }
  }
})
test('r5.1 requires a central bishop and an occupied eligible precage square', () => {
  for (const fen of [
    '8/2k5/8/3BK3/8/2N5/8/8 w - - 0 1',
    '8/2k5/3B4/4K3/2N5/8/8/8 w - - 0 1',
  ]) assert.deepEqual(precageKingEdges(fen), [])
})
test('r5.1 prioritizes edge distance lexicographically, fixed before White moves', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r5.1')!
  const e6 = scoreKnightAndBishopWhiteMove(position, 'Ke6')
  const f6 = scoreKnightAndBishopWhiteMove(position, 'Kf6')
  const e4 = scoreKnightAndBishopWhiteMove(position, 'Ke4')
  const bishop = scoreKnightAndBishopWhiteMove(position, 'Be4')
  assert.ok(rule.compare!(e6, f6) < 0)
  assert.ok(rule.compare!(f6, e4) < 0)
  assert.deepEqual([bishop.precagePrimaryEdgeDistance, bishop.precageSecondaryEdgeDistance], [3, 4])
  assert.equal(knightAndBishopWhiteRules.some(rule => rule.id === 'r4'), false)
})
