import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopKnightTargetSquares as targets } from './bishopKnightStrategy'
import { scoreKnightAndBishopWhiteMove as score } from './bishopKnight'

test('precage targets require a central bishop and the opposite long-diagonal side from Black across D4', () => {
  const cases = [
    ['8/8/8/4k3/4B3/4K3/4N3/8 w - - 0 1', ['c4', 'd3']],
    ['8/8/8/3BK3/8/2k5/1N6/8 w - - 0 1', ['e6', 'f5']],
    ['8/8/3k4/8/4B3/4K3/4N3/8 w - - 0 1', ['c4', 'd3']],
    ['k7/8/8/3BK3/8/8/1N6/8 w - - 0 1', []], // Black on the long diagonal.
    ['8/8/8/4K3/8/2k5/BN6/8 w - - 0 1', []], // Noncentral bishop.
  ] as const
  for (const t of SQUARE_TRANSFORMS) for (const [fen, expected] of cases) {
    assert.deepEqual(new Set(targets(transformFen(fen, t))), new Set(expected.map(s => transformSquare(s, t))))
  }
})

test('a same-side knight no longer activates r5.1, even beside a central bishop', () => {
  const fen = '8/8/8/3BK3/2N5/2k5/8/8 w - - 0 1'
  assert.deepEqual(new Set(targets(fen)), new Set(['e6', 'f5']))
  assert.equal(score(fen, 'Kf5').precageKingSteps, 0)
})

test('both same-color central bishop placements share targets without requiring bishop adjacency across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const fen of ['8/8/4N1k1/3BK3/8/8/8/8 w - - 0 1', '8/8/4N1k1/4K3/4B3/8/8/8 w - - 0 1']) {
      assert.deepEqual(new Set(targets(transformFen(fen, t))), new Set((['c4', 'd3'] as const).map(s => transformSquare(s, t))))
    }
  }
})
