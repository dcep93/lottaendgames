import assert from 'node:assert/strict'
import test from 'node:test'
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
  'rule n',
  'rule o',
  'king closer',
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

test('Two Bishops help renders the Phase 2 animation and Rule N diagram', () => {
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
})
