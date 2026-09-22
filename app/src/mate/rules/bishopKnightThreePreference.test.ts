import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { knightAndBishopThreeKingPlacementPenalty } from './bishopKnightDiagonalSupport'
import { selectIdealMoves } from './selection'

test('supported three prefers 2. Kb6, with support filtering intact in all reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/B7/NK6/8/8/8/8 w - - 2 2', transform)
    const san = (to: 'b6' | 'c6') => getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare(to, transform)}).san
    for (const to of ['b6', 'c6'] as const) {
      const score = scoreKnightAndBishopWhiteMove(fen, san(to))
      assert.equal(score.supportedDiagonalSizeScore, 3)
      assert.equal(score.supportedDiagonalKnightScore, 1)
      assert.equal(score.supportedThreeKingPlacementPenalty, to === 'b6' ? 0 : 1)
    }
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}))
    const earlier = knightAndBishopWhiteRules.slice(0, knightAndBishopWhiteRules.findIndex(rule => rule.id === 'r2.5'))
    assert.ok(selectIdealMoves(candidates, earlier).includes(san('b6')))
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('b6')])
  }
})

test('b6 and c7 are equal placements, without a proximity preference for other king squares', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, expected] of [
      ['k7/8/BK6/8/8/8/8/4N3 b - - 1 1', 0],
      ['k7/2K5/B7/8/8/8/8/4N3 b - - 1 1', 0],
      ['k7/8/B1K5/8/8/8/8/4N3 b - - 1 1', 1],
      ['k7/8/B7/1K6/8/8/8/4N3 b - - 1 1', 1],
    ] as const) assert.equal(knightAndBishopThreeKingPlacementPenalty(transformFen(fen, transform)), expected)
  }
})
