import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { declaredSupportedKnightAdvance } from './bishopKnightSupportedPreferences'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'

test('declared Nf6 with Kb6 Bd7 against Kb8 is supported and preferred across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const f = transformFen('1k6/3B4/1K6/3N4/8/8/8/8 w - - 42 23', t)
    const board = getChess(f)
    const move = board.move({from: transformSquare('d5', t), to: transformSquare('f6', t)}).san
    assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 5, t.name)
    assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(board.fen()), '2/2', t.name)
    const score = scoreKnightAndBishopWhiteMove(f, move)
    assert.equal(score.supportedDiagonalKnightScore, 1, t.name)
    assert.equal(score.declaredSupportedKnightAdvancePenalty, 0, t.name)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(f), [move], t.name)
    // Nearby positions do not acquire this exact declaration or its support exception.
    for (const nearby of [
      'k7/3B4/1K6/3N4/8/8/8/8 w - - 0 1',
      '1k6/3B4/2K5/3N4/8/8/8/8 w - - 0 1',
    ]) assert.equal(declaredSupportedKnightAdvance(transformFen(nearby, t)), undefined, t.name)
  }
})
