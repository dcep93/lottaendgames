import assert from 'node:assert/strict'
import test from 'node:test'
import {
  currentHint,
  explainMove,
  findCandidateBySan,
  firstDifferingRule,
  getMateRuleSet,
  isMoveIdeal,
  registerMateRuleSet,
  selectIdealMoves,
} from './index'
import type {
  MateRuleSet,
  OrderedRule,
  RuleHelp,
  ScoredMove,
} from './types'

type TestScore = {
  readonly safe: number
  readonly closer: number
}

const safeRule: OrderedRule<TestScore> = {
  id: 'safe',
  shortLabel: 'Keep it safe',
  helpText: 'Keep the piece safe.',
  compare: (left, right) => left.safe - right.safe,
}

const closerRule: OrderedRule<TestScore> = {
  id: 'closer',
  shortLabel: 'King closer',
  helpText: 'Bring the king closer.',
  compare: (left, right) => left.closer - right.closer,
}

const rules = [safeRule, closerRule] as const

const candidates: readonly ScoredMove<TestScore>[] = [
  { san: 'Ka2', score: { safe: 0, closer: 1 } },
  { san: 'Kb2', score: { safe: 0, closer: 1 } },
  { san: 'Kc2', score: { safe: 0, closer: 2 } },
  { san: 'Kh1', score: { safe: 1, closer: 0 } },
]

const help: RuleHelp = {
  title: 'How best moves are chosen',
  whiteIntro: 'Apply each White priority in order.',
  blackIntro: 'Black chooses the most stubborn reply.',
  blackPriorities: ['Keep as many legal replies as possible.'],
  notes: ['Blue squares form Zone X.'],
  noteBoards: [
    {
      id: 'zone-x',
      title: 'Zone X',
      caption: 'The bishop and knight contain the king.',
      layout: { files: 14, ranks: 8, fileOffset: 3 },
      pieces: [
        { square: 'f8', piece: 'k' },
        { square: 'e5', piece: 'K' },
        { square: 'e6', piece: 'B' },
        { square: 'c6', piece: 'N' },
      ],
      highlights: [
        { square: 'e8', kind: 'zone' },
        { square: 'g7', kind: 'escape' },
      ],
      arrows: [{ from: 'e5', to: 'f6' }],
    },
  ],
}

const rookRuleSet: MateRuleSet<TestScore> = {
  id: 'rook',
  phase: () => 'box',
  scoreWhite: (_fen, san) =>
    san === 'Kh1' ? { safe: 1, closer: 0 } : { safe: 0, closer: 1 },
  whiteRules: rules,
  whiteMoves: () => ['Ka2', 'Kb2'],
  blackCandidates: () => ({
    moves: ['Kh7', 'Kg7'],
    idealMoves: ['Kh7'],
  }),
  help,
}

test('ordered rules filter candidates lexicographically', () => {
  assert.deepEqual(selectIdealMoves(candidates, rules), ['Ka2', 'Kb2'])
})

test('multiple ideal moves retain their input order', () => {
  const reversedTies = [
    candidates[1] as ScoredMove<TestScore>,
    candidates[0] as ScoredMove<TestScore>,
    candidates[3] as ScoredMove<TestScore>,
  ]

  assert.deepEqual(selectIdealMoves(reversedTies, rules), ['Kb2', 'Ka2'])
})

test('an incorrect played move uses its first differing rule', () => {
  assert.equal(explainMove(candidates, rules, 'Kh1'), safeRule)
  assert.equal(
    firstDifferingRule(candidates[0]!.score, candidates[3]!.score, rules),
    safeRule,
  )
})

test('a correct played move explains the first non-ideal candidate', () => {
  assert.equal(explainMove(candidates, rules, 'Kb2'), closerRule)
  assert.equal(currentHint(candidates, rules), closerRule)
})

test('all-tied candidates have no current hint or move reason', () => {
  const tiedCandidates = candidates.slice(0, 2)

  assert.equal(currentHint(tiedCandidates, rules), undefined)
  assert.equal(explainMove(tiedCandidates, rules), undefined)
  assert.equal(explainMove(tiedCandidates, rules, 'Ka2'), undefined)
})

test('empty candidates and empty rules have no preference to explain', () => {
  assert.deepEqual(selectIdealMoves([], rules), [])
  assert.equal(currentHint([], rules), undefined)
  assert.equal(explainMove([], rules, 'Ka2'), undefined)

  assert.deepEqual(selectIdealMoves(candidates, []), [
    'Ka2',
    'Kb2',
    'Kc2',
    'Kh1',
  ])
  assert.equal(currentHint(candidates, []), undefined)
  assert.equal(explainMove(candidates, [], 'Kh1'), undefined)
  assert.equal(
    firstDifferingRule(candidates[0]!.score, candidates[3]!.score, []),
    undefined,
  )
})

test('candidate lookup and correctness use exact SAN', () => {
  assert.equal(findCandidateBySan(candidates, 'Kb2'), candidates[1])
  assert.equal(findCandidateBySan(candidates, 'kb2'), undefined)
  assert.equal(isMoveIdeal(candidates, rules, 'Kb2'), true)
  assert.equal(isMoveIdeal(candidates, rules, 'Kh1'), false)
  assert.equal(isMoveIdeal(candidates, rules, 'Missing'), false)
  assert.equal(explainMove(candidates, rules, 'Missing'), undefined)
})

test('the registry reports an exact error for an unregistered mate set', () => {
  assert.throws(
    () => getMateRuleSet('queen'),
    new Error('Mate rules not registered: queen'),
  )
})

test('rule sets integrate ordered rules with presentation-only help', () => {
  assert.deepEqual(
    rookRuleSet.whiteRules.map((orderedRule) => orderedRule.helpText),
    ['Keep the piece safe.', 'Bring the king closer.'],
  )
  assert.deepEqual(rookRuleSet.help.noteBoards[0]?.pieces, [
    { square: 'f8', piece: 'k' },
    { square: 'e5', piece: 'K' },
    { square: 'e6', piece: 'B' },
    { square: 'c6', piece: 'N' },
  ])
})

test('registration cleanup removes only its own registry entry', () => {
  const unregisterFirst = registerMateRuleSet(rookRuleSet)
  const unregisterReplacement = registerMateRuleSet(rookRuleSet)

  try {
    unregisterFirst()
    assert.equal(getMateRuleSet('rook'), rookRuleSet)
  } finally {
    unregisterReplacement()
  }

  assert.throws(
    () => getMateRuleSet('rook'),
    new Error('Mate rules not registered: rook'),
  )
})

test('registry cleanup leaves subsequent tests isolated', () => {
  assert.throws(
    () => getMateRuleSet('rook'),
    new Error('Mate rules not registered: rook'),
  )
})
