import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess } from '../chess'
import {
  getMateRuleSet,
  twoBishopsRuleSet,
  twoBishopsWhiteRules,
} from './index'

const ACTIVE_RULE_IDS = [
  'mate',
  'bishops safe',
  'no stalemate',
  'mate in 8 ish',
  'rule aa',
  'rule a',
  'rule b',
  'rule n',
  'rule o',
  'king closer',
  'rule ww',
  'rule w',
]

test('Two Bishops activates the minimal wall policy in order', () => {
  assert.deepEqual(
    twoBishopsWhiteRules.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
  assert.deepEqual(
    getMateRuleSet('two-bishops').whiteRuleDescriptions.map(({ id }) => id),
    ACTIVE_RULE_IDS,
  )
})

test('king closer keeps the middle-sixteen tie-break first', () => {
  const kingCloser = twoBishopsWhiteRules.find(
    ({ id }) => id === 'king closer',
  )
  assert.ok(kingCloser?.compare)
  assert.equal(
    kingCloser.helpText,
    "Bring White's king closer to Black's king, preferring proximity to the the middle 16 squares.",
  )
})

test('rule a renders the unattackable waiting-move requirement', () => {
  const ruleA = twoBishopsWhiteRules.find(({ id }) => id === 'rule a')
  assert.equal(
    ruleA?.helpText,
    "With Black's king in the 2 corner edge squares, place the White king a knight's move from that corner. Then, place a bishop on the corner cage diagonal. Then, play an unattackable bishop waiting move if necessary, until mate in 2.",
  )
})

test('rule n renders the Manhattan corner-distance gate', () => {
  const ruleN = twoBishopsWhiteRules.find(({ id }) => id === 'rule n')
  assert.equal(
    ruleN?.helpText,
    "With a bishop wall and White's king controlling the escape square, shrink and check along the bishop wall, from at least 3 squares from the corner.",
  )
})

test('rule ww renders the outer-wall bishop preference', () => {
  const ruleWW = twoBishopsWhiteRules.find(({ id }) => id === 'rule ww')
  assert.equal(
    ruleWW?.helpText,
    'Prefer the bishop of the outer wall off the edge of the board.',
  )

  const ruleSet = getMateRuleSet('two-bishops')
  const fen = '8/8/7B/8/5K1k/8/4B3/8 w - - 0 1'
  assert.equal(ruleSet.explainWhiteMove(fen, 'Bg5+')?.id, 'rule ww')

  const reply = getChess(fen)
  reply.move('Bg5+')
  reply.move('Kh3')
  assert.ok(!ruleSet.idealWhiteMoves(reply.fen()).includes('Bh6'))
})

test('Two Bishops help renders the Phase 2 animation and active diagrams', () => {
  assert.deepEqual(twoBishopsRuleSet.help.notes, [
    "A bishop wall is two adjacent parallel diagonals, with the nearer diagonal adjacent to Black's king. White's king matters only when its screening lets Black escape.",
  ])
  assert.deepEqual(
    twoBishopsRuleSet.help.noteBoards.map(({ id }) => id),
    [
      'bishop-mate-in-eight-ish-a',
      'bishop-mate-in-eight-ish-b',
      'bishop-mate-in-eight-ish-c',
      'bishop-mate-in-eight-ish-d',
      'bishop-mate-in-eight-ish-e',
      'bishop-mate-in-eight-ish-f',
      'bishop-mate-in-eight-ish-g',
      'bishop-mate-in-eight-ish-h',
      'bishop-mate-in-eight-ish-i',
      'bishop-mate-in-eight-ish-j',
      'bishop-mate-in-eight-ish-k',
      'bishop-rule-aa',
      'bishop-rule-a',
      'bishop-rule-b',
      'bishop-rule-n',
    ],
  )
  assert.deepEqual(
    twoBishopsRuleSet.help.noteBoards
      .slice(0, 11)
      .map(({ title, animationFrames, animationSrc }) => ({
        title,
        frameCount: animationFrames?.length,
        firstFen: animationFrames?.[0]?.fen,
        animationSrc,
      })),
    [
      {
        title: 'mate in 8 ish A',
        frameCount: 16,
        firstFen: '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish B',
        frameCount: 16,
        firstFen: '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish C',
        frameCount: 12,
        firstFen: '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish D',
        frameCount: 16,
        firstFen: '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish E',
        frameCount: 16,
        firstFen: '8/8/8/8/8/5K2/7k/3BB3 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish F',
        frameCount: 18,
        firstFen: '8/8/8/8/8/5K1k/8/3BB3 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish G',
        frameCount: 8,
        firstFen: '8/8/8/8/8/8/3BBK1k/8 w - - 4 3',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish H',
        frameCount: 12,
        firstFen: '8/8/8/8/8/5K2/4B2k/4B3 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish I',
        frameCount: 10,
        firstFen: '8/8/8/8/8/5K2/8/3BB2k w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish J',
        frameCount: 12,
        firstFen: '8/8/8/8/7B/5K2/7k/3B4 w - - 0 1',
        animationSrc: undefined,
      },
      {
        title: 'mate in 8 ish K',
        frameCount: 8,
        firstFen: '8/8/8/8/7B/5K2/7k/3B4 w - - 0 1',
        animationSrc: undefined,
      },
    ],
  )

  const ruleA = twoBishopsRuleSet.help.noteBoards.find(
    ({ id }) => id === 'bishop-rule-a',
  )
  assert.ok(ruleA)
  assert.deepEqual(ruleA.pieces, [
    { square: 'f2', piece: 'K' },
    { square: 'e6', piece: 'B' },
  ])
  assert.deepEqual(
    ruleA.highlights.map(({ square, kind }) => [square, kind]),
    [
      ['c8', 'wall'],
      ['d7', 'wall'],
      ['e6', 'wall'],
      ['f5', 'wall'],
      ['g4', 'wall'],
      ['h3', 'wall'],
      ['h1', 'pink'],
      ['h2', 'pink'],
    ],
  )

  const ruleAA = twoBishopsRuleSet.help.noteBoards.find(
    ({ id }) => id === 'bishop-rule-aa',
  )
  assert.ok(ruleAA)
  assert.deepEqual(ruleAA.pieces, [
    { square: 'g1', piece: 'k' },
    { square: 'h3', piece: 'K' },
    { square: 'h4', piece: 'B' },
    { square: 'd1', piece: 'B' },
  ])
  assert.deepEqual(
    ruleAA.highlights.map(({ square, kind }) => [square, kind]),
    [
      ['a6', 'wall'],
      ['b5', 'wall'],
      ['c4', 'wall'],
      ['d3', 'wall'],
      ['e2', 'wall'],
      ['f1', 'wall'],
      ['f2', 'key'],
      ['h1', 'pink'],
    ],
  )
  assert.deepEqual(ruleAA.arrows, [{ from: 'd1', to: 'e2' }])

  const ruleB = twoBishopsRuleSet.help.noteBoards.find(
    ({ id }) => id === 'bishop-rule-b',
  )
  assert.ok(ruleB)
  assert.deepEqual(ruleB.pieces, [
    { square: 'f1', piece: 'k' },
    { square: 'g3', piece: 'K' },
    { square: 'h4', piece: 'B' },
    { square: 'd1', piece: 'B' },
  ])
  assert.deepEqual(
    ruleB.highlights.map(({ square, kind }) => [square, kind]),
    [
      ['d1', 'wall'],
      ['e2', 'wall'],
      ['f3', 'wall'],
      ['g4', 'wall'],
      ['h5', 'wall'],
      ['h1', 'pink'],
      ['h3', 'key'],
    ],
  )
  assert.deepEqual(ruleB.arrows, [{ from: 'g3', to: 'h3' }])
})
