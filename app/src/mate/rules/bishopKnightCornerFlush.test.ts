import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules } from './bishopKnight'
import { knightAndBishopDeclaredCornerFlushMove } from './bishopKnightCornerFlush'
import example from './bishopKnightCornerFlushExample.json'

test('r4 prefers every White move in the loaded flushing line and all reflections', () => {
  const line = getChess(example.fen)
  for (const step of example.moves) {
    const originalFen = line.fen()
    const move = line.move(step.san)
    assert.equal(move.from, step.from)
    assert.equal(move.to, step.to)
    if (move.color !== 'w') continue
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(originalFen, transform)
      const from = transformSquare(move.from, transform)
      const to = transformSquare(move.to, transform)
      const expected = getChess(fen).move({from, to}).san
      assert.equal(knightAndBishopDeclaredCornerFlushMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], `${step.san}: ${fen}`)
    }
  }
})

test('r4 is inactive outside its declared placements and precedes r5 and r8', () => {
  assert.equal(knightAndBishopDeclaredCornerFlushMove('8/4k3/2K5/8/4B3/3N4/8/8 w - - 0 1'), undefined)
  const ids = knightAndBishopWhiteRules.map(rule => rule.id)
  assert.equal(ids.includes('r3.5'), false)
  assert.ok(ids.indexOf('r4') < ids.indexOf('r5'))
  assert.ok(ids.indexOf('r5') < ids.indexOf('r8'))
})

test('r4 prescribes Ne5 and Kg6 from the newly loaded line in every reflection', () => {
  const line = getChess('8/6k1/8/6K1/4B3/3N4/8/8 w - - 0 1')
  for (const san of ['Ne5', 'Kf8', 'Kg6']) {
    const originalFen = line.fen()
    const move = line.move(san)
    if (move.color !== 'w') continue
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(originalFen, transform)
      const from = transformSquare(move.from, transform)
      const to = transformSquare(move.to, transform)
      const expected = getChess(fen).move({ from, to }).san
      assert.equal(knightAndBishopDeclaredCornerFlushMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    }
  }
})

test('r4 prescribes loaded moves 1–3: Ne5, Nf7, Bh7 in every reflection', () => {
  const line = getChess('7k/8/5K2/8/4B3/3N4/8/8 w - - 0 1')
  for (const san of ['Ne5', 'Kg8', 'Nf7', 'Kf8', 'Bh7']) {
    const originalFen = line.fen()
    const move = line.move(san)
    if (move.color !== 'w') continue
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(originalFen, transform)
      const from = transformSquare(move.from, transform)
      const to = transformSquare(move.to, transform)
      const expected = getChess(fen).move({ from, to }).san
      assert.equal(knightAndBishopDeclaredCornerFlushMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    }
  }
})
