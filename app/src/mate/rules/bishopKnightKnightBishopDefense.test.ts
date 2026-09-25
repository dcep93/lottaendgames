import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove, getIdealKnightAndBishopWhiteMoves} from './bishopKnight'

test('r6.5 rejects only an attacked bishop defended solely by an undefended knight, across D4', () => {
  const cases = [
    ['8/8/8/3NK3/8/8/Bk6/8 w - - 1 2', 1], // Nb4 alone defends the attacked Ba2.
    ['8/8/8/2KN4/8/8/Bk6/8 w - - 1 2', 0], // Kc5 defends Nb4.
    ['8/8/8/3N4/8/k7/B7/1K6 w - - 1 2', 0], // Kb1 also defends Ba2.
    ['8/8/1k6/3NK3/8/8/B7/8 w - - 1 2', 0], // Ba2 is not attacked.
  ] as const
  for (const t of SQUARE_TRANSFORMS) {
    for (const [fen, expected] of cases) {
      const before = transformFen(fen, t)
      const move = getChess(before).move({from: transformSquare('d5', t), to: transformSquare('b4', t)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).undefendedKnightOnlyBishopDefenderPenalty, expected, fen + ' ' + t.name)
    }
    const before = transformFen(cases[0][0], t)
    const move = getChess(before).move({from: transformSquare('d5', t), to: transformSquare('f4', t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).undefendedKnightOnlyBishopDefenderPenalty, 0)
  }
  const ids = knightAndBishopWhiteRules.map(rule => rule.id)
  assert.ok(!ids.includes('r7.5'))
  assert.equal(ids.indexOf('r6.5'), ids.indexOf('r6') + 1)
  assert.equal(ids.indexOf('r6.8'), ids.indexOf('r6.5') + 1)
  assert.equal(ids.indexOf('r7'), ids.indexOf('r6.8') + 1)
  assert.ok(!ids.includes('r6.9'))
  assert.equal(ids.indexOf('r8.5'), ids.indexOf('r8') + 1)
  assert.equal(ids.indexOf('r9.1'), ids.indexOf('r8.5') + 1)
})


test('r6.5 outranks centralization in the loaded bishop-defense loop across D4', () => {
  const start = '2Bk4/8/1N6/2K5/8/8/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const bishopMove = getChess(fen).move({from: transformSquare('c8', t), to: transformSquare('b7', t)}).san
    const kingMove = getChess(fen).move({from: transformSquare('c5', t), to: transformSquare('d4', t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, kingMove).undefendedKnightOnlyBishopDefenderPenalty, 1)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishopMove).undefendedKnightOnlyBishopDefenderPenalty, 0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [bishopMove])
  }
})
