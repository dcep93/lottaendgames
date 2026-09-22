import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { knightAndBishopThreeKingPlacementPenalty } from './bishopKnightDiagonalSupport'
import { selectIdealMoves } from './selection'

test('supported three prefers 2. Kb6, with support filtering intact in all reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/B7/1K6/3N4/8/8/8 w - - 2 2', transform)
    const san = (to: 'b6' | 'c6') => getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare(to, transform)}).san
    for (const to of ['b6', 'c6'] as const) {
      const score = scoreKnightAndBishopWhiteMove(fen, san(to))
      assert.equal(score.supportedDiagonalSizeScore, to === 'b6' ? 3 : 99)
      assert.equal(score.supportedDiagonalKnightScore, to === 'b6' ? 1 : 99)
      assert.equal(score.supportedThreeKingPlacementPenalty, 0)
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

test('r2.5 Kb5 declaration does not establish support with a same-color king and previous-stage knight', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '73 42']) {
      const fen = transformFen('8/k7/B1K5/3N4/8/8/8/8 w - - ' + counters, transform)
      const san = (from: 'c6' | 'a6', to: 'b5' | 'c8' | 'b7') => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
      const kb5 = san('c6', 'b5'), bc8 = san('a6', 'c8')
      for (const move of [kb5, bc8]) {
        const score = scoreKnightAndBishopWhiteMove(fen, move)
        assert.equal(score.supportedDiagonalSizeScore, 99)
        assert.equal(score.supportedDiagonalKnightScore, 99)
        assert.equal(score.declaredSupportedThreePenalty, move === kb5 ? 0 : 1)
      }
      const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}))
      const earlier = knightAndBishopWhiteRules.slice(0, knightAndBishopWhiteRules.findIndex(rule => rule.id === 'r2.5'))
      assert.ok(selectIdealMoves(candidates, earlier).includes(kb5))
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('a6', 'b7')])
    }
    const nearby = transformFen('k7/8/B1K5/3N4/8/8/8/8 w - - 0 1', transform)
    for (const san of getChess(nearby).moves()) assert.equal(scoreKnightAndBishopWhiteMove(nearby, san).declaredSupportedThreePenalty, 0)
  }
})
