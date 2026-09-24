import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen, transformSquare, getChess } from '../chess'
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight'
import { getMateRuleSet } from './index'
import { knightAndBishopDeclaredPreparationMove } from './bishopKnightPreparation'

test('r5 keeps undeclared old exact and wildcard prescriptions cleared across D4', () => {
  for (const fen of [
    '1k6/8/8/8/2NKB3/8/8/8 w - - 0 1',
    '8/k7/8/3B4/2NK4/8/8/8 w - - 2 2',
    '8/2k5/8/3B4/2NK4/8/8/8 w - - 0 1',
    '2k5/8/8/3BK3/2N5/8/8/8 w - - 2 2',
    '8/3k4/5K2/3B4/2N5/8/8/8 w - - 4 3',
    '8/2k2K2/8/3B4/2N5/8/8/8 w - - 6 4',
    '1k6/8/8/3BK3/2N5/8/8/8 w - - 0 1',
    '2k5/8/3K4/3B4/2N5/8/8/8 w - - 2 2',
    '8/2k1K3/8/3B4/2N5/8/8/8 w - - 4 3',
    '2k1K3/8/8/3B4/2N5/8/8/8 w - - 6 4',
    '8/3k2K1/8/3B4/2N5/8/8/8 w - - 2 2',
    '8/3B4/1k6/3K4/8/3N4/8/8 w - - 0 1',
    '8/8/8/8/6K1/7B/4N2k/8 w - - 0 1',
    '8/8/3k4/8/4BK2/3N4/8/8 w - - 0 1',
    '8/8/5k2/8/4BK2/3N4/8/8 w - - 0 1',
    '8/6k1/8/5K2/4B3/3N4/8/8 w - - 0 1',
    '8/8/8/4K3/8/3k3B/8/5N2 w - - 0 1',
    '8/8/8/8/3NK3/2kB4/8/8 w - - 2 2',
    '8/8/8/4K3/8/7B/4k3/5N2 w - - 0 1',
    '8/8/8/8/8/k3N3/2BK4/8 w - - 2 2',
    '8/5k2/8/4K3/4B3/3N4/8/8 w - - 2 2',
    '8/8/8/3N4/3K4/5B2/5k2/8 w - - 2 2',
    '8/8/4k2K/8/4B3/3N4/8/8 w - - 2 2',
    '6k1/8/7K/8/4B3/3N4/8/8 w - - 0 1',
    '8/8/8/8/1K6/N7/1k6/7B w - - 0 1',
    '8/8/8/8/8/2K5/1N6/1k5B w - - 0 1',
    '8/8/8/4k3/3NB3/3K4/8/8 w - - 0 1',
    '8/5k2/8/8/4B3/3NK3/8/8 w - - 0 1',
    '8/8/4k3/8/4B3/3NK3/8/8 w - - 0 1',
    '8/4k3/8/8/4B3/3NK3/8/8 w - - 0 1',
    '8/3k4/8/8/4B3/3NK3/8/8 w - - 0 1',
    '8/8/5k2/8/4B3/3NK3/8/8 w - - 0 1',
    '8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1',
    '8/8/7k/4K3/4B3/3N4/8/8 w - - 0 1',
    '8/8/8/4K1k1/4B3/3N4/8/8 w - - 0 1',
    '8/6k1/8/2N5/3KB3/8/8/8 w - - 0 1',
    '8/4k3/8/2N5/3KB3/8/8/8 w - - 2 2',
    '8/8/3N4/2KBk3/8/8/8/8 w - - 0 1',
    '8/8/4k3/8/3KB3/3N4/8/8 w - - 2 2',
    '8/8/3k4/8/4B3/3NK3/8/8 w - - 4 3',
    '8/8/4k3/8/4BK2/3N4/8/8 w - - 6 4',
    '8/8/3k4/6K1/4B3/3N4/8/8 w - - 8 5',
    '8/5k2/8/6K1/4B3/3N4/8/8 w - - 2 2',
    '8/5k2/3K4/8/4B3/3N4/8/8 w - - 0 1',
    '8/2k5/8/3K4/4B3/3N4/8/8 w - - 0 1',
    '8/4k3/2K5/8/4B3/3N4/8/8 w - - 0 1',
    '4k3/2K5/8/8/4B3/3N4/8/8 w - - 0 1',
    '8/5k2/8/5K2/4B3/3N4/8/8 w - - 2 2',
    '8/8/3K1k2/8/4B3/3N4/8/8 w - - 2 2',
    '8/8/3k4/8/4BKN1/8/8/8 w - - 0 1',
    '8/8/6kN/8/6B1/7K/8/8 w - - 0 1',
    '8/8/8/8/4N3/5K2/6Bk/8 w - - 0 1',
    '8/8/8/2KB4/3N1k2/8/8/8 w - - 0 1',
  ]) for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(knightAndBishopDeclaredPreparationMove(transformFen(fen, transform)), undefined)
  }
})


test('r5 clears every recent declaration across D4 and move counters', () => {
  for (const fen of [
    '8/2k5/5K2/3B4/2N5/8/8/8 w - - 0 1',
    '2k5/4K3/8/3B4/2N5/8/8/8 w - - 2 2',
    '8/8/8/3B4/2Nk1K2/8/8/8 w - - 0 1',
    '7k/8/4NK2/3B4/8/8/8/8 w - - 2 2',
    '3N4/7k/5K2/3B4/8/8/8/8 w - - 4 3',
    '6k1/5N2/5K2/3B4/8/8/8/8 w - - 6 4',
    '5k2/5N2/5K2/8/4B3/8/8/8 w - - 8 5',
    '4k3/5N1B/5K2/8/8/8/8/8 w - - 10 6',
    '3k4/7B/5K2/4N3/8/8/8/8 w - - 12 7',
    '4k3/8/4N3/3BK3/8/8/8/8 w - - 2 2',
    '5k2/8/8/3BK3/5N2/8/8/8 w - - 4 3',
    '4k3/8/4N3/3B1K2/8/8/8/8 w - - 2 2',
    '1k6/8/8/3B4/2NK4/8/8/8 w - - 0 1',
  ]) for (const transform of SQUARE_TRANSFORMS) {
    const transformed = transformFen(fen, transform)
    assert.equal(knightAndBishopDeclaredPreparationMove(transformed), undefined)
    assert.equal(knightAndBishopDeclaredPreparationMove(transformed.split(' ').slice(0, 4).join(' ') + ' 0 1'), undefined)
  }
})

test('clearing r5 restores the general Kc5 preference in the loaded position across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/8/3B4/2NK4/8/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('d4', transform), to: transformSquare('c5', transform)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r5.1')
  }
})
