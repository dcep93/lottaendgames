import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules } from './bishopKnight'
import { knightAndBishopDeclaredCornerFlushMove } from './bishopKnightCornerFlush'
import example from './bishopKnightCornerFlushExample.json'
import { getMateRuleSet } from './index'

test('r4 prescribes Kf6 from all three central-bishop shuffles and then Kg7, across D4', () => {
  for (const declaration of [
    {fen: '5k2/8/8/3BK3/2N5/8/8/8 w - - 41 23', moves: ['Kf6', 'Ke8', 'Kg7']},
    {fen: '5k2/8/8/3B1K2/2N5/8/8/8 w - - 0 1', moves: ['Kf6']},
    {fen: '8/3k4/8/3BK3/2N5/8/8/8 w - - 0 1', moves: ['Kf6']},
  ]) {
    const line = getChess(declaration.fen)
    for (const san of declaration.moves) {
      const before = line.fen(), move = line.move(san)
      if (move.color !== 'w') continue
      for (const transform of SQUARE_TRANSFORMS) {
        const fen = transformFen(before, transform)
        const from = transformSquare(move.from, transform), to = transformSquare(move.to, transform)
        const expected = getChess(fen).move({from, to}).san
        assert.equal(knightAndBishopDeclaredCornerFlushMove(fen), from + to)
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
        assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r4')
      }
    }
  }
})

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


test('r4 prescribes Kf6 in the loaded king-shuffle position, including reflections and move counters', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '28 15']) {
      const fen = transformFen(`8/3k4/8/3B1K2/2N5/8/8/8 w - - ${counters}`, transform)
      const from = transformSquare('f5', transform), to = transformSquare('f6', transform)
      const san = getChess(fen).move({from, to}).san
      assert.equal(knightAndBishopDeclaredCornerFlushMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
      assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r4')
    }
    // The declaration is exact; changing Black's square does not extend it.
    assert.equal(knightAndBishopDeclaredCornerFlushMove(transformFen('8/2k5/8/3B1K2/2N5/8/8/8 w - - 0 1', transform)), undefined)
  }
  const ids = knightAndBishopWhiteRules.map(rule => rule.id)
  assert.ok(ids.indexOf('r1.5') < ids.indexOf('r4'))
})
