import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight'

test('r8.5 prefers opposition but no longer overrides r7 centralization across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/1kB5/4K3/8/8/8/6N1 w - - 0 1', t)
    const san = getChess(fen).move({from: transformSquare('e5', t), to: transformSquare('d6', t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).bishopOppositionPenalty, 0)
    const central = getChess(fen).move({from: transformSquare('e5', t), to: transformSquare('d4', t)}).san
    const compare = knightAndBishopWhiteRules.find(r => r.id === 'r8.5')!.compare!
    assert.ok(compare(scoreKnightAndBishopWhiteMove(fen, san), scoreKnightAndBishopWhiteMove(fen, central)) < 0)
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(san))
  }
})

test('r8.5 can interpose the bishop or maintain existing opposition with a knight move', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const establish = transformFen('B7/8/1k1K4/8/8/8/8/6N1 w - - 0 1', t)
    const bishopMove = getChess(establish).move({from: transformSquare('a8', t), to: transformSquare('c6', t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(establish, bishopMove).bishopOppositionPenalty, 0)
    const hold = transformFen('8/8/1kBK4/8/8/8/8/6N1 w - - 0 1', t)
    const knightMove = getChess(hold).move({from: transformSquare('g1', t), to: transformSquare('f3', t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(hold, knightMove).bishopOppositionPenalty, 0)
    // The opposition score remains valid even when earlier rules prefer moving the king.
  }
})

test('r8.5 requires the bishop in the middle of direct rank or file opposition', () => {
  assert.equal(scoreKnightAndBishopWhiteMove('8/8/1k6/4B3/3K4/8/8/6N1 w - - 0 1', 'Kd5').bishopOppositionPenalty, 1)
  assert.equal(scoreKnightAndBishopWhiteMove('8/8/1k6/8/3K4/B7/8/6N1 w - - 0 1', 'Bc5+').bishopOppositionPenalty, 1)
  assert.equal(scoreKnightAndBishopWhiteMove('8/8/1k2K3/8/8/8/8/5BN1 w - - 0 1', 'Bc4').bishopOppositionPenalty, 1)
})
