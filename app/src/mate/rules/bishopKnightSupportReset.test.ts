import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { getMateRuleSet } from './index'

test('r1 checks from king-supported three-diagonals one knight move from the target', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('k1B5/2K5/8/8/8/2N5/8/8 w - - 0 1', transform)
    const board = getChess(fen)
    const checking = board.move({from: transformSquare('c8', transform), to: transformSquare('b7', transform)}).san
    const waiting = getChess(fen).move({from: transformSquare('c8', transform), to: transformSquare('a6', transform)}).san
    const checkScore = scoreKnightAndBishopWhiteMove(fen, checking)
    assert.equal(checkScore.supportedThreeCheckScore, 0)
    assert.equal(checkScore.supportedDiagonalSizeScore, 3) // r1 still evaluates its trigger before the checking move.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, waiting).supportedThreeCheckScore, 1)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [checking])
    assert.deepEqual(board.moves(), [getChess(board.fen()).move({from: transformSquare('a8', transform), to: transformSquare('a7', transform)}).san])
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, waiting)?.id, 'r1')
    for (const exempt of [
      'k1B5/2K5/8/3N4/8/8/8/8 w - - 0 1', // Two knight moves away.
      'k1B5/8/3K4/3N4/8/8/8/8 w - - 0 1', // No king-based knight target selected.
    ]) {
      const position = transformFen(exempt, transform)
      for (const san of getChess(position).moves()) assert.equal(scoreKnightAndBishopWhiteMove(position, san).supportedThreeCheckScore, 0)
    }
    const d7Target = transformFen('k1B5/3K4/8/3N4/8/8/8/8 w - - 0 1', transform)
    const d7Waiting = getChess(d7Target).move({from: transformSquare('c8', transform), to: transformSquare('a6', transform)}).san
    // Kd7 has no three-diagonal target, so r1 does not trigger.
    assert.equal(scoreKnightAndBishopWhiteMove(d7Target, d7Waiting).supportedThreeCheckScore, 0)
    const onTarget = transformFen('k1B5/2K5/8/1N6/8/8/8/8 w - - 0 1', transform)
    for (const san of getChess(onTarget).moves()) {
      const after = getChess(onTarget)
      after.move(san)
      assert.equal(scoreKnightAndBishopWhiteMove(onTarget, san).supportedThreeCheckScore, after.isCheck() ? 0 : 1)
    }
  }
})

test('removed king-proximity rules and discarded support explanations remain absent', () => {
  assert.ok(!knightAndBishopWhiteRules.some(rule => rule.id === 'r3'))
  assert.ok(bishopKnightRuleSet.help.notes.some(note => note.includes('previous-stage support square')))
  assert.equal(bishopKnightRuleSet.help.noteBoards.some(board => /diagonal-support/.test(board.id)), false)
  assert.ok(knightAndBishopWhiteRules.some(rule => rule.id === 'r5'))
})
