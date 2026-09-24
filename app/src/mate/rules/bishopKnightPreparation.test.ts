import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARES } from 'chess.js'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, getKnightAndBishopOpponentCandidates } from './bishopKnight'
import { getMateRuleSet } from './index'
import { knightAndBishopDeclaredPreparationMove } from './bishopKnightPreparation'
import example from './bishopKnightFlushExample.json'

test('r5 prescribes 3. Ne5 after Kf6 Kc7 Ke7 Kc8 in every D4 orientation', () => {
  const line = getChess('8/3k4/8/3BK3/2N5/8/8/8 w - - 0 1')
  for (const san of ['Kf6', 'Kc7', 'Ke7', 'Kc8']) line.move(san)
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['4 3', '42 23']) {
      const fen = transformFen(line.fen(), transform).split(' ').slice(0, 4).join(' ') + ' ' + counters
      const from = transformSquare('c4', transform), to = transformSquare('e5', transform)
      const expected = getChess(fen).move({from, to}).san
      assert.equal(knightAndBishopDeclaredPreparationMove(fen), from + to)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
      assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
    }
  }
})

test('r5 selects Ke7 and Kf7 after the central-bishop flushing declarations in all symmetries', () => {
  for (const [position, san] of [
    ['8/2k5/5K2/3B4/2N5/8/8/8 w - - 0 1', 'Ke7'],
    ['8/3k2K1/8/3B4/2N5/8/8/8 w - - 2 2', 'Kf7'],
  ] as const) {
    const move = getChess(position).move(san)
    for (const transform of SQUARE_TRANSFORMS) {
      for (const counters of ['0 1', '42 23']) {
        const fen = transformFen(position, transform).split(' ').slice(0, 4).join(' ') + ' ' + counters
        const from = transformSquare(move.from, transform), to = transformSquare(move.to, transform)
        const expected = getChess(fen).move({from, to}).san
        assert.equal(knightAndBishopDeclaredPreparationMove(fen), from + to)
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
        assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
      }
    }
  }
})

test('r5 selects the five audited-loop corrections in every symmetry', () => {
  const lines = [
    ['8/8/3k4/8/4BK2/3N4/8/8 w - - 0 1', [], 'Kf5'],
    ['8/8/5k2/8/4BK2/3N4/8/8 w - - 0 1', [], 'Bf5'],
    ['8/3k4/8/8/4B3/3NK3/8/8 w - - 0 1', ['Kf4', 'Kd6'], 'Kf5'],
    ['8/6k1/8/5K2/4B3/3N4/8/8 w - - 0 1', [], 'Kg5'],
    ['8/4k3/8/8/4B3/3NK3/8/8 w - - 0 1', ['Kf4', 'Kd6'], 'Kf5'],
  ] as const
  for (const [start, moves, san] of lines) {
    const line = getChess(start)
    for (const move of moves) line.move(move)
    const position = line.fen()
    const move = line.move(san)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(position, transform)
      const expected = getChess(fen).move({
        from: transformSquare(move.from, transform),
        to: transformSquare(move.to, transform),
      }).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
      assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
    }
  }
})

test('r5 selects Bf5+ from Ke5 Bh3 Nf1 against Kd3 in every symmetry', () => {
  const position = '8/8/8/4K3/8/3k3B/8/5N2 w - - 0 1'
  assert.equal(getChess(position).move({ from: 'h3', to: 'f5' }).san, 'Bf5+')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position, transform)
    const expected = getChess(fen).move({
      from: transformSquare('h3', transform),
      to: transformSquare('f5', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 selects loaded 2. Nf5 after Ke4 Kc3 in every symmetry', () => {
  const line = getChess('8/8/8/8/3N4/3BK3/1k6/8 w - - 0 1')
  line.move('Ke4')
  line.move('Kc3')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const expected = getChess(fen).move({
      from: transformSquare('d4', transform),
      to: transformSquare('f5', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 selects Ng3+ from Ke5 Bh3 Nf1 against Ke2 in every symmetry', () => {
  const position = '8/8/8/4K3/8/7B/4k3/5N2 w - - 0 1'
  assert.equal(getChess(position).move({ from: 'f1', to: 'g3' }).san, 'Ng3+')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(position, transform)
    const expected = getChess(fen).move({
      from: transformSquare('f1', transform),
      to: transformSquare('g3', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 selects loaded 2. Kc3 after Kd2 Ka3 in every symmetry', () => {
  const line = getChess('8/8/8/8/8/3KN3/1kB5/8 w - - 0 1')
  line.move('Kd2')
  line.move('Ka3')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const expected = getChess(fen).move({
      from: transformSquare('d2', transform),
      to: transformSquare('c3', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 selects loaded 2. Kf5 after Ke5 Kf7 in every symmetry', () => {
  const line = getChess('8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1')
  line.move('Ke5')
  line.move('Kf7')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const expected = getChess(fen).move({
      from: transformSquare('e5', transform),
      to: transformSquare('f5', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 selects loaded 2. Be4 after Bf3 Kf2 in every symmetry', () => {
  const line = getChess('8/8/8/3N3B/3K4/8/8/4k3 w - - 0 1')
  line.move('Bf3')
  line.move('Kf2')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const expected = getChess(fen).move({
      from: transformSquare('f3', transform),
      to: transformSquare('e4', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 selects loaded 2. Kg7 after Kh6 Ke6 in every symmetry', () => {
  const line = getChess('8/5k2/8/6K1/4B3/3N4/8/8 w - - 0 1')
  line.move('Kh6')
  line.move('Ke6')
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), transform)
    const expected = getChess(fen).move({
      from: transformSquare('h6', transform),
      to: transformSquare('g7', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
  }
})

test('r5 selects the first five surviving-loop prescriptions in every symmetry', () => {
  const cases = [
    ['6k1/8/7K/8/4B3/3N4/8/8 w - - 0 1', 'Kg6'],
    ['8/8/8/8/1K6/N7/1k6/7B w - - 0 1', 'Nb5'],
    ['8/5k2/8/6K1/4B3/3N4/8/8 w - - 0 1', 'Kh6'],
    ['8/8/8/8/8/2K5/1N6/1k5B w - - 0 1', 'Nc4'],
    ['8/8/8/4k3/3NB3/3K4/8/8 w - - 0 1', 'Ke3'],
  ] as const
  for (const [position, san] of cases) {
    const move = getChess(position).move(san)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(position, transform)
      const expected = getChess(fen).move({
        from: transformSquare(move.from, transform),
        to: transformSquare(move.to, transform),
      }).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
      assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
    }
  }
})

test('aligned precage-loop prescriptions survive with the Kf6 declaration now attributed to r4', () => {
  const cases = [
    ['8/5k2/8/8/4B3/3NK3/8/8 w - - 0 1', 'Kf4'],
    ['8/8/4k3/8/4B3/3NK3/8/8 w - - 0 1', 'Kf4'],
    ['8/4k3/8/8/4B3/3NK3/8/8 w - - 0 1', 'Kf4'],
    ['8/3k4/8/8/4B3/3NK3/8/8 w - - 0 1', 'Kf4'],
    ['8/8/5k2/8/4B3/3NK3/8/8 w - - 0 1', 'Kf4'],
    ['8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1', 'Ke5'],
    ['8/8/7k/4K3/4B3/3N4/8/8 w - - 0 1', 'Kf6'],
    ['8/6k1/8/2N5/3KB3/8/8/8 w - - 0 1', 'Ke5'],
  ] as const
  for (const [position, san] of cases) {
    const move = getChess(position).move(san)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(position, transform)
      const expected = getChess(fen).move({
        from: transformSquare(move.from, transform),
        to: transformSquare(move.to, transform),
      }).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
      assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, san === 'Kf6' ? 'r4' : 'r5', fen)
    }
  }
})

test('the #8 Ke6 declaration applies when an approaching knight no longer establishes support', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/4K1k1/4B3/3N4/8/8 w - - 0 1', transform)
    assert.equal(knightAndBishopDeclaredPreparationMove(fen),
      transformSquare('e5', transform) + transformSquare('e6', transform))
    const prescribed = getChess(fen).move({
      from: transformSquare('e5', transform), to: transformSquare('e6', transform),
    }).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [prescribed])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})

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


test('r5 prescribes Kd6 with Kc5/Bd5/Nd4 regardless of Black king, including reflections', () => {
  for (const square of SQUARES) {
    if (['c5', 'd5', 'd4'].includes(square)) continue
    const board = getChess('8/8/8/2KB4/3N1k2/8/8/8 w - - 2 2')
    board.remove('f4')
    board.put({type: 'k', color: 'b'}, square)
    if (board.isAttacked('c5', 'b') || board.isAttacked(square, 'w')) continue
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(board.fen(), transform)
      assert.equal(knightAndBishopDeclaredPreparationMove(fen),
        transformSquare('c5', transform) + transformSquare('d6', transform), fen)
    }
  }
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/2KB4/3N1k2/8/8/8 w - - 2 2', transform)
    const san = getChess(fen).move({from: transformSquare('c5', transform), to: transformSquare('d6', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
  for (const fen of [
    '8/8/8/2KB4/4Nk2/8/8/8 w - - 2 2',
    'B7/8/8/2K5/3N1k2/8/8/8 w - - 2 2',
    '8/8/8/3B4/2KN1k2/8/8/8 w - - 2 2',
    '8/8/8/2KB4/3N1k2/8/8/8 b - - 2 2',
  ]) assert.equal(knightAndBishopDeclaredPreparationMove(fen), undefined, fen)
})

test('r5 prescribes Nc4+ from Kc5/Bd5/Nd6 against Ke5 in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3N4/2KBk3/8/8/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('d6', transform), to: transformSquare('c4', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})


test('r5 prescribes Ke5 from Kd4/Be4/Nc5 against Ke7 in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/4k3/8/2N5/3KB3/8/8/8 w - - 2 2', transform)
    const move = getChess(fen).move({from: transformSquare('d4', transform), to: transformSquare('e5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})


test('Nd4 retains selection while the Kb5 support declaration makes r1.5 reject Bf1', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/8/6K1/7B/4N2k/8 w - - 0 1', transform)
    const expected = getChess(fen).move({from: transformSquare('e2', transform), to: transformSquare('d4', transform)}).san
    const rejected = getChess(fen).move({from: transformSquare('h3', transform), to: transformSquare('f1', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
    assert.equal(getMateRuleSet('bishop-knight').explainWhiteMove(fen, rejected)?.id, 'r1.5')
  }
})


test('r5 selects loaded 1. Bf1 from Kf3 Bg2 Ne3 against Kh2 in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/8/8/4NK2/6Bk/8 w - - 0 1', transform)
    const expected = getChess(fen).move({from: transformSquare('g2', transform), to: transformSquare('f1', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5')
  }
})


test('the declared Bf1 line reaches mate using best moves', () => {
  const board = getChess('8/8/8/8/8/4NK2/6Bk/8 w - - 0 1')
  const history: string[] = []
  for (const san of ['Bf1', 'Kg1', 'Kg3', 'Kh1', 'Kf2', 'Kh2', 'Ng4+', 'Kh1', 'Bg2#']) {
    const before = board.fen()
    if (board.turn() === 'w') {
      assert.ok(getIdealKnightAndBishopWhiteMoves(before).includes(san), san + ': ' + getIdealKnightAndBishopWhiteMoves(before).join(','))
      history.push(before)
    } else {
      assert.ok(getKnightAndBishopOpponentCandidates(before, history.at(-2)).idealMoves.includes(san))
    }
    board.move(san)
  }
  assert.ok(board.isCheckmate())
})


test('r5 prescribes Bf1 with Kf3 Bg2 against Kh2 independently of the knight, including reflections', () => {
  for (const square of SQUARES) {
    if (['f3', 'g2', 'h2'].includes(square)) continue
    const board = getChess('8/8/8/8/8/5K2/6Bk/8 w - - 0 1')
    board.put({type: 'n', color: 'w'}, square)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(board.fen(), transform)
      assert.equal(knightAndBishopDeclaredPreparationMove(fen),
        transformSquare('g2', transform) + transformSquare('f1', transform), fen)
    }
  }
  // These different knight placements previously produced distinct shuttle loops.
  for (const position of [
    '8/8/8/8/4N3/5K2/6Bk/8 w - - 0 1',
    '8/8/8/3N4/8/5K2/6Bk/8 w - - 0 1',
  ]) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(position, transform)
      const expected = getChess(fen).move({from: transformSquare('g2', transform), to: transformSquare('f1', transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected])
    }
  }
  assert.equal(knightAndBishopDeclaredPreparationMove('8/8/8/8/4N3/5K2/6Bk/8 b - - 1 1'), undefined)
  assert.equal(knightAndBishopDeclaredPreparationMove('8/8/8/8/4N3/5K2/6B1/7k w - - 0 1'), undefined)
})


test('r5 prescribes the loaded Kd6 Ke7 Ke8 Ne5 sequence across D4', () => {
  const line = getChess('1k6/8/8/3BK3/2N5/8/8/8 w - - 0 1')
  for (const [white, black] of [['Kd6', 'Kc8'], ['Ke7', 'Kc7'], ['Ke8', 'Kc8'], ['Ne5', 'Kc7']]) {
    const position = line.fen()
    const move = line.move(white!)
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(position, transform)
      const from = transformSquare(move.from, transform), to = transformSquare(move.to, transform)
      const expected = getChess(fen).move({from, to}).san
      assert.equal(knightAndBishopDeclaredPreparationMove(fen), from + to, fen)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
      assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
    }
    line.move(black!)
  }
})


test('r5 prescribes both loaded return-history loop exits across D4', () => {
  for (const [start, moves] of [
    ['1k6/8/8/8/2NKB3/8/8/8 w - - 0 1', ['Bd5', 'Ka7', 'Ne5', 'Kb6']],
    ['8/2k5/8/3B4/2NK4/8/8/8 w - - 0 1', ['Ke5', 'Kc8', 'Kf6', 'Kd7', 'Kf7', 'Kc7', 'Ke7', 'Kc8']],
  ] as const) {
    const line = getChess(start)
    for (const san of moves) {
      const position = line.fen(), isWhite = line.turn() === 'w'
      const move = line.move(san)
      if (!isWhite) continue
      for (const transform of SQUARE_TRANSFORMS) {
        const fen = transformFen(position, transform)
        const from = transformSquare(move.from, transform), to = transformSquare(move.to, transform)
        const expected = getChess(fen).move({from, to}).san
        assert.equal(knightAndBishopDeclaredPreparationMove(fen), from + to, fen)
        assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [expected], fen)
        assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5', fen)
      }
    }
  }
})
