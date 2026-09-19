import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARES } from 'chess.js'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight'
import { getMateRuleSet } from './index'
import { knightAndBishopDeclaredPreparationMove } from './bishopKnightPreparation'
import example from './bishopKnightFlushExample.json'

test('r5 reset removes the GIF and manual move preferences in every reflection', () => {
  const positions = [
    '8/8/5k2/8/4BN2/5K2/8/8 w - - 0 1',
    '8/4k3/8/5K2/4B3/4N3/8/8 w - - 2 2',
    '8/5k2/8/6K1/4BN2/8/8/8 w - - 2 2',
    '8/5k2/8/2N3K1/4B3/8/8/8 w - - 2 2',
    '8/4k3/8/2N2K2/4B3/8/8/8 w - - 2 2',
    '8/8/3k4/5K2/4B3/3N4/8/8 w - - 4 3',
  ]
  const line = getChess(example.fen)
  for (const step of example.moves) {
    if (line.turn() === 'w') positions.push(line.fen())
    line.move({from: step.from, to: step.to})
  }
  for (const position of positions) for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position, transform)
    assert.equal(knightAndBishopDeclaredPreparationMove(fen), undefined, fen)
    assert.notEqual(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 retains its rule without a GIF illustration', () => {
  const rules = getMateRuleSet('bishop-knight')
  assert.ok(rules.whiteRuleDescriptions.some(rule => rule.id === 'r5'))
  const animations = rules.help.noteBoards.filter(board => board.animationSrc)
  assert.equal(animations.length, 1)
  assert.equal(animations.some(board => board.title.startsWith('rule r5')), false)
})

test('r5 prefers loaded 2. Kh6 after Kg5 Kf7 in every reflection', () => {
  const line = getChess('8/6k1/8/5K2/4B3/3N4/8/8 w - - 0 1')
  line.move('Kg5')
  line.move('Kf7')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const move = getChess(fen).move({from: transformSquare('g5', transform), to: transformSquare('h6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 1. Ke5 from Kd6 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/5k2/3K4/8/4B3/3N4/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare('e5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 1. Ke6 from Kd5 against Kc7 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2k5/8/3K4/4B3/3N4/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('e6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 1. Kd5 from Kc6 against Ke7 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/4k3/2K5/8/4B3/3N4/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('c6', transform), to: transformSquare('d5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 1. Kd6 from Kc7 against Ke8 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('4k3/2K5/8/8/4B3/3N4/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('d6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 2. Kg5 after Kf5 Kf7 in every reflection', () => {
  const line = getChess('8/6k1/8/4K3/4B3/3N4/8/8 w - - 0 1')
  line.move('Kf5')
  line.move('Kf7')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const move = getChess(fen).move({from: transformSquare('f5', transform), to: transformSquare('g5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 2. Kd5 after Kd6 Kf6 in every reflection', () => {
  const line = getChess('8/3K1k2/8/8/4B3/3N4/8/8 w - - 0 1')
  line.move('Kd6')
  line.move('Kf6')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const move = getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare('d5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 1. Kf5 from Kf4 against Kd6 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3k4/8/4BKN1/8/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('f4', transform), to: transformSquare('f5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prefers loaded 2. Nf5 after Nh6+ Kg6 in every reflection', () => {
  const line = getChess('6N1/5k2/8/8/6B1/7K/8/8 w - - 0 1')
  line.move('Nh6+')
  line.move('Kg6')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const move = getChess(fen).move({from: transformSquare('h6', transform), to: transformSquare('f5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

test('r5 prescribes Nf5 with Bg4/Nh6/Black Kg6 regardless of White king, including reflections', () => {
  for (const square of SQUARES) {
    if (['g4', 'h6', 'g6'].includes(square)) continue
    const board = getChess('8/8/6kN/8/6B1/7K/8/8 w - - 2 2')
    board.remove('h3')
    board.put({ type: 'k', color: 'w' }, square)
    if (board.isAttacked(square, 'b')) continue
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(board.fen(), transform)
      assert.equal(knightAndBishopDeclaredPreparationMove(fen),
        transformSquare('h6', transform) + transformSquare('f5', transform), fen)
    }
  }
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/6kN/8/6BK/8/8/8 w - - 2 2', transform)
    const san = getChess(fen).move({from: transformSquare('h6', transform), to: transformSquare('f5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
  assert.equal(knightAndBishopDeclaredPreparationMove('8/8/5k1N/8/6BK/8/8/8 w - - 2 2'), undefined)
})


test('r5 prescribes loaded moves 2–5 in every rotation and reflection', () => {
  const line = getChess('8/8/5k2/8/3KB3/8/5N2/8 w - - 0 1')
  line.move('Nd3')
  line.move('Ke6')
  for (const [white, black] of [['Ke3', 'Kd6'], ['Kf4', 'Ke6'], ['Kg5', 'Kd6'], ['Kf6', 'Kd7']]) {
    const before = line.fen()
    const played = line.move(white!)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(before, transform)
      const from = transformSquare(played.from, transform)
      const to = transformSquare(played.to, transform)
      const san = getChess(fen).move({from, to}).san
      assert.equal(knightAndBishopDeclaredPreparationMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], fen)
      assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
    }
    line.move(black!)
  }
})
