import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopThreeDiagonalKingProximity } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { getMateRuleSet } from './index'

test('three-diagonal pressure prefers king proximity to the bishop in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/k7/B7/K2N4/8/8/8/8 w - - 2 2', transform)
    const king = getChess(fen).move({from: transformSquare('a5', transform), to: transformSquare('b5', transform)}).san
    const bishop = getChess(fen).move({from: transformSquare('a6', transform), to: transformSquare('c8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, king).threeDiagonalKingProximityScore, 2)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, king).forceCornerKingProximityScore, 10)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishop).threeDiagonalKingProximityScore, 13)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [king])
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, bishop)?.id, 'r2.5')
    const near = transformFen('1kB5/3K4/8/3N4/8/8/8/8 w - - 2 2', transform)
    const approach = getChess(near).move({from: transformSquare('d7', transform), to: transformSquare('d8', transform)}).san
    const retreat = getChess(near).move({from: transformSquare('c8', transform), to: transformSquare('a6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(near, approach).threeDiagonalKingProximityScore, 1)
    assert.equal(scoreKnightAndBishopWhiteMove(near, retreat).threeDiagonalKingProximityScore, 10)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(near), [approach])
    assert.equal(knightAndBishopThreeDiagonalKingProximity(transformFen('8/8/B7/K2N4/8/8/k7/8 w - - 0 1', transform)), 0)
    assert.equal(knightAndBishopThreeDiagonalKingProximity(transformFen('8/k7/B7/K7/8/3N4/8/8 w - - 0 1', transform)), 0)
  }
})
