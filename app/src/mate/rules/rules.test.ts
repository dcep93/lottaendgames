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
  rankUndefeatedScores,
  registerMateRuleSet,
  selectIdealMoves,
} from './index'
import type {
  MateRuleSet,
  OrderedRule,
  RegisteredMateRuleSet,
  RuleHelp,
  RuleSubpriority,
  ScoredMove,
  WhiteMoveOverride,
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

type DecisiveScore = {
  readonly matePenalty: number
  readonly laterPreference: number
}

const decisiveRule: OrderedRule<DecisiveScore> = {
  id: 'decisive-mate',
  shortLabel: 'Mate now',
  helpText: 'Checkmate immediately when mate is available.',
  stopWhenBest: (score) => score.matePenalty === 0,
  compare: (left, right) => left.matePenalty - right.matePenalty,
}

const laterRule: OrderedRule<DecisiveScore> = {
  id: 'later-detail',
  shortLabel: 'Later detail',
  helpText: 'Break an otherwise non-decisive tie.',
  compare: (left, right) => left.laterPreference - right.laterPreference,
}

const decisiveCandidates: readonly ScoredMove<DecisiveScore>[] = [
  { san: 'Ba1#', score: { matePenalty: 0, laterPreference: 2 } },
  { san: 'Bb2#', score: { matePenalty: 0, laterPreference: 1 } },
  { san: 'Kc2', score: { matePenalty: 1, laterPreference: 0 } },
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

test('a decisive best priority preserves every tied terminal move', () => {
  const decisiveRules = [decisiveRule, laterRule] as const

  for (const permutation of permutations(decisiveCandidates)) {
    const expectedMates = permutation
      .filter(({ score }) => score.matePenalty === 0)
      .map(({ san }) => san)
    assert.deepEqual(
      selectIdealMoves(permutation, decisiveRules),
      expectedMates,
    )
    assert.equal(currentHint(permutation, decisiveRules), decisiveRule)
    assert.equal(explainMove(permutation, decisiveRules, 'Kc2'), decisiveRule)
  }
  assert.equal(
    compareScoresByRules(
      decisiveCandidates[0]!.score,
      decisiveCandidates[1]!.score,
      decisiveRules,
    ),
    0,
  )
  assert.equal(
    firstDifferingRule(
      decisiveCandidates[0]!.score,
      decisiveCandidates[1]!.score,
      decisiveRules,
    ),
    undefined,
  )
})

test('registered rule operations snapshot decisive stop predicates', () => {
  const mutableDecisiveRule = { ...decisiveRule }
  const decisiveRuleSet: MateRuleSet<DecisiveScore> = {
    id: 'two-knights-pawn',
    phase: () => 'phase',
    scoreWhite: (_fen, san) =>
      decisiveCandidates.find((candidate) => candidate.san === san)!.score,
    whiteRules: [mutableDecisiveRule, laterRule],
    whiteMoves: () => decisiveCandidates.map(({ san }) => san),
    blackCandidates: () => ({ moves: [], idealMoves: [] }),
    help,
  }
  const unregister = registerMateRuleSet(decisiveRuleSet)

  try {
    mutableDecisiveRule.stopWhenBest = () => false
    assert.deepEqual(
      getMateRuleSet('two-knights-pawn').idealWhiteMoves('fen'),
      ['Ba1#', 'Bb2#'],
    )
  } finally {
    unregister()
  }
})

test('registered rule sets may prepare a pure candidate score batch', () => {
  let batchCalls = 0
  let individualCalls = 0
  const batchRuleSet: MateRuleSet<TestScore> = {
    ...rookRuleSet,
    id: 'bishop-knight',
    scoreWhite: (_fen, san) => {
      individualCalls += 1
      return candidates.find((candidate) => candidate.san === san)!.score
    },
    scoreWhiteCandidates: (_fen, moves) => {
      batchCalls += 1
      return moves.map((san) => candidates.find((move) => move.san === san)!)
    },
  }
  const unregister = registerMateRuleSet(batchRuleSet)

  try {
    assert.deepEqual(getMateRuleSet('bishop-knight').idealWhiteMoves('fen'), [
      'Ka2',
      'Kb2',
    ])
    assert.equal(batchCalls, 1)
    assert.equal(individualCalls, 0)
  } finally {
    unregister()
  }
})

test('a decisive move override preserves its ordered legal subset and explains every rejected move', () => {
  let batchCalls = 0
  const lookupDescription = {
    id: 'enter mating net',
    shortLabel: 'enter mating net',
    helpText: 'Follow the known mating net.',
  }
  const lookupOverride: WhiteMoveOverride = {
    description: lookupDescription,
    guideOrder: 1,
    select: (_fen, legalMoves) => {
      assert.equal(Object.isFrozen(legalMoves), true)
      return {
        active: true,
        moves: [legalMoves[1]!, legalMoves[0]!],
      }
    },
  }
  const overrideRuleSet: MateRuleSet<TestScore> = {
    ...rookRuleSet,
    id: 'bishop-knight',
    whiteMoveOverride: lookupOverride,
    scoreWhiteCandidates: () => {
      batchCalls += 1
      return candidates
    },
  }
  const unregister = registerMateRuleSet(overrideRuleSet)

  try {
    const registered = getMateRuleSet('bishop-knight')
    assert.deepEqual(registered.idealWhiteMoves('fen'), ['Kb2', 'Ka2'])
    assert.equal(batchCalls, 0)
    assert.deepEqual(registered.currentWhiteHint('fen'), lookupDescription)
    assert.deepEqual(
      registered.explainWhiteMove('fen', 'Kb2'),
      lookupDescription,
    )
    assert.deepEqual(
      registered.explainWhiteMove('fen', 'Kh1'),
      lookupDescription,
    )
    assert.equal(registered.explainWhiteMove('fen', 'illegal'), undefined)
    assert.deepEqual(registered.whiteRuleDescriptions, [
      {
        id: 'safe',
        shortLabel: 'Keep it safe',
        helpText: 'Keep the piece safe.',
      },
      lookupDescription,
      {
        id: 'closer',
        shortLabel: 'King closer',
        helpText: 'Bring the king closer.',
      },
    ])
  } finally {
    unregister()
  }
})

test('registered move overrides snapshot descriptions and selector functions', () => {
  const mutableDescription = {
    id: 'enter mating net',
    shortLabel: 'enter mating net',
    helpText: 'Original mating-net help.',
  }
  const mutableOverride = {
    description: mutableDescription,
    select: () => ({ active: true, moves: ['Kb2'] }),
  } satisfies WhiteMoveOverride
  const overrideRuleSet: MateRuleSet<TestScore> = {
    ...rookRuleSet,
    id: 'bishop-knight',
    whiteMoveOverride: mutableOverride,
  }
  const unregister = registerMateRuleSet(overrideRuleSet)

  try {
    mutableDescription.helpText = 'Mutated mating-net help.'
    mutableOverride.select = () => ({ active: true, moves: ['Kh1'] })

    const registered = getMateRuleSet('bishop-knight')
    assert.deepEqual(registered.idealWhiteMoves('fen'), ['Kb2'])
    assert.deepEqual(registered.currentWhiteHint('fen'), {
      id: 'enter mating net',
      shortLabel: 'enter mating net',
      helpText: 'Original mating-net help.',
    })
  } finally {
    unregister()
  }
})

test('decisive move overrides explicitly distinguish inactive and invalid active selections', () => {
  const description = {
    id: 'override',
    shortLabel: 'Override',
    helpText: 'Choose the decisive batch.',
  }
  const scenarios: Array<{
    readonly name: string
    readonly result: ReturnType<WhiteMoveOverride['select']>
    readonly expected: readonly string[] | RegExp
  }> = [
    {
      name: 'inactive',
      result: { active: false },
      expected: ['Ka2', 'Kb2'],
    },
    {
      name: 'empty',
      result: { active: true, moves: [] },
      expected: /active move override must select at least one legal move/,
    },
    {
      name: 'duplicate',
      result: { active: true, moves: ['Ka2', 'Ka2'] },
      expected: /move override selected duplicate SAN: Ka2/,
    },
    {
      name: 'illegal',
      result: { active: true, moves: ['missing'] },
      expected: /move override selected illegal SAN: missing/,
    },
  ]

  for (const scenario of scenarios) {
    const ruleSet: MateRuleSet<TestScore> = {
      ...rookRuleSet,
      id: 'bishop-knight',
      whiteMoveOverride: {
        description,
        select: () => scenario.result,
      },
    }
    const unregister = registerMateRuleSet(ruleSet)
    try {
      const evaluate = () => getMateRuleSet('bishop-knight').idealWhiteMoves('fen')
      if (scenario.expected instanceof RegExp) {
        assert.throws(evaluate, scenario.expected, scenario.name)
      } else {
        assert.deepEqual(evaluate(), scenario.expected, scenario.name)
      }
    } finally {
      unregister()
    }
  }
})

test('grouped subpriorities evaluate immutable survivor groups once and remain permutation invariant', () => {
  type GroupScore = {
    readonly movedPiece: 'n' | 'other'
    readonly knightDistance: number
    readonly centerDistance: number
  }
  let groupPredicateCalls = 0
  const groupedRule: OrderedRule<GroupScore> = {
    id: 'grouped',
    shortLabel: 'Grouped priority',
    helpText: 'Use conditional and general comparisons as one priority.',
    subpriorities: [
      {
        when: (scores) => {
          groupPredicateCalls += 1
          assert.equal(Object.isFrozen(scores), true)
          return scores.every(({ movedPiece }) => movedPiece === 'n')
        },
        compare: (left, right) =>
          left.knightDistance - right.knightDistance,
      },
      {
        compare: (left, right) =>
          left.centerDistance - right.centerDistance,
      },
    ],
  }
  const groupedCandidates: readonly ScoredMove<GroupScore>[] = [
    {
      san: 'Na1',
      score: { movedPiece: 'n', knightDistance: 0, centerDistance: 2 },
    },
    {
      san: 'Nc3',
      score: { movedPiece: 'n', knightDistance: 1, centerDistance: 0 },
    },
    {
      san: 'Ba2',
      score: { movedPiece: 'other', knightDistance: 99, centerDistance: 1 },
    },
  ]

  for (const permutation of permutations(groupedCandidates)) {
    groupPredicateCalls = 0
    assert.deepEqual(selectIdealMoves(permutation, [groupedRule]), ['Nc3'])
    assert.equal(groupPredicateCalls, 1)
    assert.equal(currentHint(permutation, [groupedRule]), groupedRule)
    assert.equal(explainMove(permutation, [groupedRule], 'Na1'), groupedRule)
    assert.equal(explainMove(permutation, [groupedRule], 'Ba2'), groupedRule)
  }

  assert.deepEqual(
    selectIdealMoves(groupedCandidates.slice(0, 2), [groupedRule]),
    ['Na1'],
  )
  assert.equal(
    explainMove(groupedCandidates.slice(0, 2), [groupedRule], 'Nc3'),
    groupedRule,
  )
})

test('undefeated group ranks handle winners, ties, and cycles without order sensitivity', () => {
  type TournamentScore = {
    readonly id: 'a' | 'b' | 'c'
    readonly tier: number
    readonly fallback: number
  }
  const tournamentCandidates: readonly ScoredMove<TournamentScore>[] = [
    { san: 'A', score: { id: 'a', tier: 0, fallback: 2 } },
    { san: 'B', score: { id: 'b', tier: 0, fallback: 0 } },
    { san: 'C', score: { id: 'c', tier: 1, fallback: 1 } },
  ]
  let groupRankCalls = 0
  const rankedRule = (
    compare: (left: TournamentScore, right: TournamentScore) => number,
    withFallback = false,
  ): OrderedRule<TournamentScore> => ({
    id: 'ranked',
    shortLabel: 'Ranked group',
    helpText: 'Prefer undefeated candidates, then use a stable fallback.',
    subpriorities: [
      {
        rank: (scores) => {
          groupRankCalls += 1
          assert.equal(Object.isFrozen(scores), true)
          return rankUndefeatedScores(scores, compare)
        },
      },
      ...(withFallback
        ? [
            {
              compare: (
                left: TournamentScore,
                right: TournamentScore,
              ) => left.fallback - right.fallback,
            },
          ]
        : []),
    ],
  })

  const oneWinner = rankedRule(
    (left, right) => left.fallback - right.fallback,
  )
  const multipleWinners = rankedRule(
    (left, right) => left.tier - right.tier,
  )
  const allTied = rankedRule(() => 0)
  const cycle = rankedRule((left, right) => {
    if (left.id === right.id) return 0
    const defeatedBy = { a: 'c', b: 'a', c: 'b' } as const
    return defeatedBy[right.id] === left.id ? -1 : 1
  }, true)

  const candidatePermutations = permutations(tournamentCandidates)
  for (const permutation of candidatePermutations) {
    assert.deepEqual(selectIdealMoves(permutation, [oneWinner]), ['B'])
    assert.deepEqual(
      selectIdealMoves(permutation, [multipleWinners]),
      permutation
        .filter(({ score }) => score.tier === 0)
        .map(({ san }) => san),
    )
    assert.deepEqual(
      selectIdealMoves(permutation, [allTied]),
      permutation.map(({ san }) => san),
    )
    assert.deepEqual(selectIdealMoves(permutation, [cycle]), ['B'])
  }
  assert.equal(groupRankCalls, candidatePermutations.length * 4)
})

test('group rank callbacks must return exactly one finite rank per survivor', () => {
  const invalidRanks = [
    {
      name: 'non-array',
      rank: () => null as unknown as readonly number[],
      expected: /rule invalid rank must return an array/,
    },
    {
      name: 'too few',
      rank: (scores: readonly TestScore[]) => scores.slice(1).map(() => 0),
      expected: /rule invalid rank returned 3 values for 4 scores/,
    },
    {
      name: 'too many',
      rank: (scores: readonly TestScore[]) => [...scores.map(() => 0), 0],
      expected: /rule invalid rank returned 5 values for 4 scores/,
    },
    {
      name: 'NaN',
      rank: (scores: readonly TestScore[]) =>
        scores.map((_, index) => (index === 1 ? Number.NaN : 0)),
      expected: /rule invalid rank returned non-finite result at index 1/,
    },
    {
      name: 'infinity',
      rank: (scores: readonly TestScore[]) =>
        scores.map((_, index) =>
          index === 2 ? Number.POSITIVE_INFINITY : 0,
        ),
      expected: /rule invalid rank returned non-finite result at index 2/,
    },
  ] as const

  for (const scenario of invalidRanks) {
    const invalidRule: OrderedRule<TestScore> = {
      id: 'invalid',
      shortLabel: 'Invalid',
      helpText: 'Invalid group rank.',
      subpriorities: [{ rank: scenario.rank }],
    }
    assert.throws(
      () => selectIdealMoves(candidates, [invalidRule]),
      scenario.expected,
      scenario.name,
    )
  }
})

test('registered rule operations snapshot grouped rank callbacks', () => {
  const mutableRank = {
    rank: (scores: readonly TestScore[]) => scores.map(({ safe }) => safe),
  }
  const mutableSubpriorities: RuleSubpriority<TestScore>[] = [
    mutableRank,
    { compare: (left, right) => left.closer - right.closer },
  ]
  const mutableRule: OrderedRule<TestScore> = {
    id: 'ranked-safe',
    shortLabel: 'Ranked safe',
    helpText: 'Prefer safe moves through a grouped rank.',
    subpriorities: mutableSubpriorities,
  }
  const unregister = registerMateRuleSet({
    ...rookRuleSet,
    id: 'two-knights-pawn',
    whiteRules: [mutableRule],
  })

  try {
    mutableRank.rank = (scores) => scores.map(({ safe }) => -safe)
    mutableSubpriorities.splice(0, mutableSubpriorities.length, {
      compare: (left, right) => right.closer - left.closer,
    })

    assert.deepEqual(
      getMateRuleSet('two-knights-pawn').idealWhiteMoves('test-fen'),
      ['Ka2', 'Kb2'],
    )
  } finally {
    unregister()
  }
})

test('grouped comparator results must remain finite', () => {
  const invalidRule: OrderedRule<TestScore> = {
    id: 'invalid',
    shortLabel: 'Invalid',
    helpText: 'Invalid comparator.',
    subpriorities: [{ compare: () => Number.NaN }],
  }
  assert.throws(
    () => selectIdealMoves(candidates, [invalidRule]),
    /rule invalid comparator returned non-finite result/,
  )
})

test('duplicate visible rule IDs require one canonical description', () => {
  const canonicalDuplicate: OrderedRule<TestScore> = {
    ...safeRule,
    compare: (left, right) => left.closer - right.closer,
  }
  const accepted = registerMateRuleSet({
    ...rookRuleSet,
    id: 'bishop-knight',
    whiteRules: [safeRule, canonicalDuplicate],
  })
  try {
    assert.deepEqual(getMateRuleSet('bishop-knight').whiteRuleDescriptions, [
      {
        id: 'safe',
        shortLabel: 'Keep it safe',
        helpText: 'Keep the piece safe.',
      },
    ])
  } finally {
    accepted()
  }

  assert.throws(
    () =>
      registerMateRuleSet({
        ...rookRuleSet,
        id: 'bishop-knight',
        whiteRules: [
          safeRule,
          { ...canonicalDuplicate, helpText: 'Conflicting help.' },
        ],
      }),
    /conflicting rule description for id safe/,
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
