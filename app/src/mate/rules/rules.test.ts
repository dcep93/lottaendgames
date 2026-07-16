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

type OptionalDistanceScore = {
  readonly safe: number
  readonly distance: number | null
}

const optionalSafeRule: OrderedRule<OptionalDistanceScore> = {
  id: 'optional-safe',
  shortLabel: 'Keep it safe',
  helpText: 'Keep the piece safe.',
  compare: (left, right) => left.safe - right.safe,
}

const optionalDistanceRule: OrderedRule<OptionalDistanceScore> = {
  id: 'optional-distance',
  shortLabel: 'Prefer shorter moves',
  helpText: 'Prefer the shorter applicable move.',
  applies: (score) => score.distance !== null,
  compare: (left, right) => {
    if (left.distance === null || right.distance === null) {
      throw new Error('distance comparison escaped its applicable domain')
    }
    return left.distance - right.distance
  },
}

const optionalRules = [optionalSafeRule, optionalDistanceRule] as const

const optionalCandidates: readonly ScoredMove<OptionalDistanceScore>[] = [
  { san: 'Ka1', score: { safe: 0, distance: null } },
  { san: 'Qb1', score: { safe: 0, distance: 5 } },
  { san: 'Qc1', score: { safe: 0, distance: 2 } },
  { san: 'Qd1', score: { safe: 1, distance: 1 } },
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

test('ordered rules leave non-applicable candidates untouched', () => {
  assert.deepEqual(selectIdealMoves(optionalCandidates, optionalRules), [
    'Ka1',
    'Qc1',
  ])
})

test('applicability preserves survivor order and explanation semantics', () => {
  for (const permutation of permutations(optionalCandidates)) {
    const expectedIdealMoves = permutation
      .filter(({ san }) => san === 'Ka1' || san === 'Qc1')
      .map(({ san }) => san)
    const context = permutation.map(({ san }) => san).join(', ')

    assert.deepEqual(
      selectIdealMoves(permutation, optionalRules),
      expectedIdealMoves,
      context,
    )
    assert.equal(
      currentHint(permutation, optionalRules),
      optionalDistanceRule,
      context,
    )
    for (const san of expectedIdealMoves) {
      assert.equal(
        explainMove(permutation, optionalRules, san),
        optionalDistanceRule,
        context,
      )
    }
    assert.equal(
      explainMove(permutation, optionalRules, 'Qb1'),
      optionalDistanceRule,
      context,
    )
    assert.equal(
      explainMove(permutation, optionalRules, 'Qd1'),
      optionalSafeRule,
      context,
    )
  }
})

test('pair comparisons skip priorities outside either score domain', () => {
  const nonApplicable = optionalCandidates[0]!.score
  const longer = optionalCandidates[1]!.score
  const shorter = optionalCandidates[2]!.score

  assert.equal(
    compareScoresByRules(nonApplicable, longer, optionalRules),
    0,
  )
  assert.equal(compareScoresByRules(longer, shorter, optionalRules), 3)
  assert.equal(
    firstDifferingRule(nonApplicable, longer, optionalRules),
    undefined,
  )
  assert.equal(
    firstDifferingRule(longer, shorter, optionalRules),
    optionalDistanceRule,
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
    () => getMateRuleSet('two-knights-pawn'),
    new Error('Mate rules not registered: two-knights-pawn'),
  )
})

test('built-in registration is not exposed as a mutable public API', async () => {
  const ruleExports = await import('./index')

  assert.equal('registerBuiltInMateRuleSet' in ruleExports, false)
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

  const restoredBuiltIn = getMateRuleSet('rook')
  assert.equal(restoredBuiltIn.id, 'rook')
  assert.equal(restoredBuiltIn.whiteRuleDescriptions[0]?.id, 'mate')
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

test('registered rule operations snapshot rule applicability functions', () => {
  const mutableRule = {
    ...safeRule,
    applies: () => false,
  }
  const mutableRuleSet: MateRuleSet<TestScore> = {
    ...rookRuleSet,
    id: 'two-knights-pawn',
    whiteRules: [mutableRule, closerRule],
  }
  const unregister = registerMateRuleSet(mutableRuleSet)

  try {
    mutableRule.applies = () => true

    const registered = getMateRuleSet('two-knights-pawn')
    assert.deepEqual(registered.idealWhiteMoves('test-fen'), ['Kh1'])
    assert.deepEqual(registered.currentWhiteHint('test-fen'), {
      id: 'closer',
      shortLabel: 'King closer',
      helpText: 'Bring the king closer.',
    })
  } finally {
    unregister()
  }
})

test('registered rule operations deeply snapshot and freeze help', () => {
  const mutableHelp: {
    title: string
    whiteIntro: string
    blackIntro: string
    blackPriorities: string[]
    notes: string[]
    noteBoards: Array<{
      id: string
      title: string
      caption: string
      layout: { files: number; ranks: number; fileOffset: number }
      pieces: Array<{ square: string; piece: 'K' | 'k' }>
      highlights: Array<{ square: string; kind: 'zone' | 'escape' }>
      arrows: Array<{ from: string; to: string }>
    }>
  } = {
    title: 'Original title',
    whiteIntro: 'Original White introduction.',
    blackIntro: 'Original Black introduction.',
    blackPriorities: ['Original Black priority.'],
    notes: ['Original note.'],
    noteBoards: [
      {
        id: 'original-board',
        title: 'Original board title',
        caption: 'Original board caption.',
        layout: { files: 8, ranks: 8, fileOffset: 0 },
        pieces: [{ square: 'a1', piece: 'K' }],
        highlights: [{ square: 'b2', kind: 'zone' }],
        arrows: [{ from: 'a1', to: 'b2' }],
      },
    ],
  }
  const mutableRuleSet: MateRuleSet<TestScore> = {
    ...rookRuleSet,
    id: 'two-bishops',
    help: mutableHelp,
  }
  const unregister = registerMateRuleSet(mutableRuleSet)

  try {
    const registered = getMateRuleSet('two-bishops')

    mutableHelp.title = 'Mutated title'
    mutableHelp.whiteIntro = 'Mutated White introduction.'
    mutableHelp.blackIntro = 'Mutated Black introduction.'
    mutableHelp.blackPriorities[0] = 'Mutated Black priority.'
    mutableHelp.blackPriorities.push('Another Black priority.')
    mutableHelp.notes[0] = 'Mutated note.'
    mutableHelp.notes.push('Another note.')
    const sourceBoard = mutableHelp.noteBoards[0]!
    sourceBoard.id = 'mutated-board'
    sourceBoard.title = 'Mutated board title'
    sourceBoard.caption = 'Mutated board caption.'
    sourceBoard.layout.files = 4
    sourceBoard.pieces[0]!.square = 'h8'
    sourceBoard.pieces.push({ square: 'h7', piece: 'k' })
    sourceBoard.highlights[0]!.kind = 'escape'
    sourceBoard.highlights.push({ square: 'g7', kind: 'escape' })
    sourceBoard.arrows[0]!.to = 'h8'
    sourceBoard.arrows.push({ from: 'h7', to: 'h8' })
    mutableHelp.noteBoards.push({
      id: 'extra-board',
      title: 'Extra board',
      caption: 'Extra board caption.',
      layout: { files: 1, ranks: 1, fileOffset: 7 },
      pieces: [],
      highlights: [],
      arrows: [],
    })

    assert.deepEqual(registered.help, {
      title: 'Original title',
      whiteIntro: 'Original White introduction.',
      blackIntro: 'Original Black introduction.',
      blackPriorities: ['Original Black priority.'],
      notes: ['Original note.'],
      noteBoards: [
        {
          id: 'original-board',
          title: 'Original board title',
          caption: 'Original board caption.',
          layout: { files: 8, ranks: 8, fileOffset: 0 },
          pieces: [{ square: 'a1', piece: 'K' }],
          highlights: [{ square: 'b2', kind: 'zone' }],
          arrows: [{ from: 'a1', to: 'b2' }],
        },
      ],
    })
    assert.equal(registered.phase, mutableRuleSet.phase)
    assert.equal(registered.whiteMoves, mutableRuleSet.whiteMoves)
    assert.equal(registered.blackCandidates, mutableRuleSet.blackCandidates)
    assert.equal(Object.isFrozen(registered), true)
    assert.equal(Object.isFrozen(registered.help), true)
    assert.equal(Object.isFrozen(registered.help.blackPriorities), true)
    assert.equal(Object.isFrozen(registered.help.notes), true)
    assert.equal(Object.isFrozen(registered.help.noteBoards), true)
    const registeredBoard = registered.help.noteBoards[0]!
    assert.equal(Object.isFrozen(registeredBoard), true)
    assert.equal(Object.isFrozen(registeredBoard.layout), true)
    assert.equal(Object.isFrozen(registeredBoard.pieces), true)
    assert.equal(Object.isFrozen(registeredBoard.pieces[0]), true)
    assert.equal(Object.isFrozen(registeredBoard.highlights), true)
    assert.equal(Object.isFrozen(registeredBoard.highlights[0]), true)
    assert.equal(Object.isFrozen(registeredBoard.arrows), true)
    assert.equal(Object.isFrozen(registeredBoard.arrows?.[0]), true)
  } finally {
    unregister()
  }
})
