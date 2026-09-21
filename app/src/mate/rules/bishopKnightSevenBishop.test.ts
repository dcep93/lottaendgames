import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { selectIdealMoves } from './selection'

const fen = '8/8/8/1k1B4/3K4/3N4/8/8 w - - 0 1'
test('supported seven prefers b3 in the knight support orientation, including every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = transformFen(fen, transform)
    const san = (to: 'b3' | 'f7') => getChess(reflected).move({from: transformSquare('d5',transform),to:transformSquare(to,transform)}).san
    const preferred = scoreKnightAndBishopWhiteMove(reflected,san('b3'))
    const otherEnd = scoreKnightAndBishopWhiteMove(reflected,san('f7'))
    assert.equal(preferred.supportedDiagonalSizeScore,7)
    assert.equal(otherEnd.supportedDiagonalSizeScore,7)
    assert.equal(preferred.supportedDiagonalKnightScore,0)
    assert.equal(otherEnd.supportedDiagonalKnightScore,0)
    assert.equal(preferred.supportedSevenBishopPenalty,0)
    assert.equal(otherEnd.supportedSevenBishopPenalty,1)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[san('b3')])
  }
})

test('the seven bishop preference cannot override r1.5 support size or knight distance', () => {
  const supportRules = knightAndBishopWhiteRules.slice(0,knightAndBishopWhiteRules.findIndex(r=>r.id==='r2.5'))
  for (const start of [fen,'8/k7/2BK4/3N4/8/8/8/8 w - - 0 1','k7/8/BK6/3N4/8/8/8/8 w - - 0 1']) {
    const candidates = bishopKnightRuleSet.scoreWhiteCandidates!(start,bishopKnightRuleSet.whiteMoves(start))
    const allowed = selectIdealMoves(candidates,supportRules)
    for (const move of getIdealKnightAndBishopWhiteMoves(start)) assert.ok(allowed.includes(move))
  }
})

test('with b3 seven bishop, king approaches two files right of Black in all reflections', () => {
  const start = '8/8/1k6/4K3/8/1B1N4/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const reflected = transformFen(start,transform)
    const san = (to: 'd6' | 'd5' | 'd4') => getChess(reflected).move({from:transformSquare('e5',transform),to:transformSquare(to,transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(reflected),[san('d6')])
    for (const [to,distance] of [['d6',0],['d5',1],['d4',2]] as const) {
      const score = scoreKnightAndBishopWhiteMove(reflected,san(to))
      assert.equal(score.supportedDiagonalSizeScore,7)
      assert.equal(score.supportedSevenBishopPenalty,0)
      assert.equal(score.supportedSevenKingTargetDistance,distance)
    }
    const otherBishop = scoreKnightAndBishopWhiteMove(transformFen(fen,transform),
      getChess(transformFen(fen,transform)).move({from:transformSquare('d5',transform),to:transformSquare('f7',transform)}).san)
    assert.equal(otherBishop.supportedSevenKingTargetDistance,0)
  }
})
