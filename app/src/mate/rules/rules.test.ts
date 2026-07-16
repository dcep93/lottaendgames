import assert from 'node:assert/strict'
import test from 'node:test'
import {
  compareScoresByRules,
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
  RegisteredMateRuleSet,
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
  scoreWhite: (_fen, san) => {
    if (san === 'Kh1') {
      return { safe: 1, closer: 0 }
    }
    if (san === 'Kc2') {
      return { safe: 0, closer: 2 }
    }
    return { safe: 0, closer: 1 }
  },
  whiteRules: rules,
  whiteMoves: () => candidates.map(({ san }) => san),
  blackCandidates: () => ({
    moves: ['Kh7', 'Kg7'],
    idealMoves: ['Kh7'],
  }),
  help,
}

function permutations<Value>(values: readonly Value[]): readonly Value[][] {
  if (values.length <= 1) {
    return [[...values]]
  }

  return values.flatMap((value, index) => {
    const remaining = [...values.slice(0, index), ...values.slice(index + 1)]
    return permutations(remaining).map((permutation) => [
      value,
      ...permutation,
    ])
  })
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

test('full score comparison applies rules in lexicographic order', () => {
  assert.equal(
    compareScoresByRules(candidates[0]!.score, candidates[2]!.score, rules),
    -1,
  )
  assert.equal(
    compareScoresByRules(candidates[0]!.score, candidates[3]!.score, rules),
    -1,
  )
  assert.equal(
    compareScoresByRules(candidates[0]!.score, candidates[1]!.score, rules),
    0,
  )
  assert.equal(
    compareScoresByRules(candidates[2]!.score, candidates[0]!.score, []),
    0,
  )
})

test('candidate permutations preserve tie order and explanation rules', () => {
  for (const permutation of permutations(candidates)) {
    const expectedIdealMoves = permutation
      .filter(({ san }) => san === 'Ka2' || san === 'Kb2')
      .map(({ san }) => san)
    const context = permutation.map(({ san }) => san).join(', ')

    assert.deepEqual(
      selectIdealMoves(permutation, rules),
      expectedIdealMoves,
      context,
    )
    assert.equal(currentHint(permutation, rules), closerRule, context)
    for (const san of expectedIdealMoves) {
      assert.equal(explainMove(permutation, rules, san), closerRule, context)
    }
    assert.equal(explainMove(permutation, rules, 'Kh1'), safeRule, context)
    assert.equal(explainMove(permutation, rules, 'Kc2'), closerRule, context)
  }
})

test('an incorrect played move uses its first differing rule', () => {
  assert.equal(explainMove(candidates, rules, 'Kh1'), safeRule)
  assert.equal(
    firstDifferingRule(candidates[0]!.score, candidates[3]!.score, rules),
    safeRule,
  )
})

test('a correct played move explains the closest non-ideal candidate', () => {
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

test('registered rule operations capture concrete scores without exposing them', () => {
  const unregisterFirst = registerMateRuleSet(rookRuleSet)

  try {
    const unregisterReplacement = registerMateRuleSet(rookRuleSet)

    try {
      unregisterFirst()
      const registered = getMateRuleSet('rook')
      const exposesScoreWhite: 'scoreWhite' extends keyof RegisteredMateRuleSet
        ? true
        : false = false
      const exposesWhiteRules: 'whiteRules' extends keyof RegisteredMateRuleSet
        ? true
        : false = false
      const descriptionsExposeCompare: 'compare' extends keyof RegisteredMateRuleSet['whiteRuleDescriptions'][number]
        ? true
        : false = false

      assert.equal(exposesScoreWhite, false)
      assert.equal(exposesWhiteRules, false)
      assert.equal(descriptionsExposeCompare, false)
      assert.equal('scoreWhite' in registered, false)
      assert.equal('whiteRules' in registered, false)
      assert.deepEqual(registered.whiteRuleDescriptions, [
        {
          id: 'safe',
          shortLabel: 'Keep it safe',
          helpText: 'Keep the piece safe.',
        },
        {
          id: 'closer',
          shortLabel: 'King closer',
          helpText: 'Bring the king closer.',
        },
      ])
      assert.deepEqual(registered.idealWhiteMoves('test-fen'), ['Ka2', 'Kb2'])
      assert.deepEqual(registered.explainWhiteMove('test-fen', 'Kh1'), {
        id: 'safe',
        shortLabel: 'Keep it safe',
        helpText: 'Keep the piece safe.',
      })
      assert.deepEqual(registered.explainWhiteMove('test-fen', 'Kb2'), {
        id: 'closer',
        shortLabel: 'King closer',
        helpText: 'Bring the king closer.',
      })
      assert.deepEqual(registered.currentWhiteHint('test-fen'), {
        id: 'closer',
        shortLabel: 'King closer',
        helpText: 'Bring the king closer.',
      })
    } finally {
      unregisterReplacement()
    }
  } finally {
    unregisterFirst()
  }

  assert.throws(
    () => getMateRuleSet('rook'),
    new Error('Mate rules not registered: rook'),
  )
})

test('registered rule operations snapshot the source rule array', () => {
  const mutableSafeRule = { ...safeRule }
  const mutableRules: OrderedRule<TestScore>[] = [mutableSafeRule, closerRule]
  const mutableRuleSet: MateRuleSet<TestScore> = {
    ...rookRuleSet,
    id: 'bishop-knight',
    whiteRules: mutableRules,
  }
  const unregister = registerMateRuleSet(mutableRuleSet)

  try {
    const registered = getMateRuleSet('bishop-knight')
    mutableRules[0] = {
      id: 'prefer-unsafe',
      shortLabel: 'Prefer unsafe',
      helpText: 'Prefer an unsafe move.',
      compare: (left, right) => right.safe - left.safe,
    }
    mutableRules.push({
      id: 'prefer-farther',
      shortLabel: 'King farther',
      helpText: 'Move the king farther away.',
      compare: (left, right) => right.closer - left.closer,
    })
    mutableSafeRule.helpText = 'The source description changed.'
    mutableSafeRule.compare = (left, right) => right.safe - left.safe

    assert.deepEqual(registered.whiteRuleDescriptions, [
      {
        id: 'safe',
        shortLabel: 'Keep it safe',
        helpText: 'Keep the piece safe.',
      },
      {
        id: 'closer',
        shortLabel: 'King closer',
        helpText: 'Bring the king closer.',
      },
    ])
    assert.deepEqual(registered.idealWhiteMoves('test-fen'), ['Ka2', 'Kb2'])
    assert.deepEqual(registered.currentWhiteHint('test-fen'), {
      id: 'closer',
      shortLabel: 'King closer',
      helpText: 'Bring the king closer.',
    })
  } finally {
    unregister()
  }
})
