import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, getChess, transformFen, transformSquare } from '../chess'
import { analyzeTwoBishopsWhiteSelection, scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'
import { compareScoresByRules } from './selection'

const starting = '1BB1k3/2K5/8/8/8/8/8/8 w - - 0 1'
const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
const walls = [ ['b8', 'c7', 'd6', 'e5', 'f4', 'g3', 'h2'], ['c8', 'd7', 'e6', 'f5', 'g4', 'h3'] ] as const

// Use full chess.js legality as an independent oracle for the two-ray shortcut.
test('r10 wall mobility matches legal move generation through king blockers and board edges', () => {
  for (const counters of ['0 1', '32 17', '98 50']) for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting.replace('0 1', counters), transform)
    const legal = getChess(fen).moves({ verbose: true })
    for (const [from, to] of [['c8', 'h3'], ['c8', 'd7'], ['c7', 'c6'], ['c7', 'b6']] as const) {
      const move = legal.find(m => m.from === transformSquare(from, transform) && m.to === transformSquare(to, transform))!
      const score = scoreTwoBishopsWhiteMove(fen, move.san)
      assert.equal(score.ruleR10DiagonalCount, 5)
      const result = getChess(fen); result.move(move.san)
      const fields = result.fen().split(' '); fields[1] = 'w'
      const nextWhite = getChess(fields.join(' '))
      const bishops = nextWhite.board().flat().filter(p => p?.type === 'b' && p.color === 'w').map(p => p!.square)
      const moves = nextWhite.moves({ verbose: true })
      const immobile = bishops.filter(bishop => {
        const wall = walls.map(squares => squares.map(s => transformSquare(s, transform))).find(squares => squares.includes(bishop))!
        return !moves.some(m => m.from === bishop && wall.includes(m.to))
      }).length
      assert.equal(score.ruleR10ImmobileBishops, immobile, `${transform.name}: ${move.san}`)
      assert.equal(immobile, from === 'c7' ? 0 : 1)
    }
  }
})

test('mobility breaks the Bh3 tie with either adjacent king move', () => {
  const bishop = scoreTwoBishopsWhiteMove(starting, 'Bh3')
  const clear = scoreTwoBishopsWhiteMove(starting, 'Kc6')
  const farther = scoreTwoBishopsWhiteMove(starting, 'Kb6')
  const firstThree = (s: typeof bishop) => [s.ruleR10DiagonalCount, s.ruleR10OuterBishopPenalty, s.ruleR10KingDistance]
  assert.deepEqual(firstThree(bishop), firstThree(clear))
  assert.equal(bishop.ruleR10ImmobileBishops, 1)
  assert.equal(clear.ruleR10ImmobileBishops, 0)
  assert.ok(compareScoresByRules(clear, bishop, [r10]) < 0)
  assert.equal(farther.ruleR10ImmobileBishops, 0)
  assert.deepEqual(firstThree(farther), firstThree(bishop))
  assert.ok(compareScoresByRules(farther, bishop, [r10]) < 0)
})

test('the old Bh3 loop move is replaced by Kc6 in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const kc6 = getChess(fen).moves({ verbose: true }).find(m =>
      m.from === transformSquare('c7', transform) && m.to === transformSquare('c6', transform))!
    assert.deepEqual(analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves, [kc6.san])
  }
})
