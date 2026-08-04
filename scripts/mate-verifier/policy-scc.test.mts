import assert from 'node:assert/strict'
import test from 'node:test'
import {
  diagnoseMatePolicySccs,
  MatePolicySccSession,
} from './policy-scc.mts'
import type {
  MateVerificationAdapter,
  MateVerificationBranch,
  MateVerificationExpansion,
  MateVerificationRoot,
} from './types.mts'

function root(state: string): MateVerificationRoot<string> {
  return { fen: state, halfmoveClock: 0, source: 'test', state }
}

function adapter(
  expansions: Readonly<Record<string, MateVerificationExpansion<string>>>,
  key: (state: string) => string = (state) => state,
): MateVerificationAdapter<string> {
  return {
    expand: (state) => {
      const expansion = expansions[state]
      if (expansion === undefined) throw new Error(`Missing state ${state}`)
      return expansion
    },
    key,
    render: (state) => state,
  }
}

function expansion(
  branches: readonly MateVerificationBranch<string>[],
  whiteChoices = branches.length,
): MateVerificationExpansion<string> {
  return {
    blackReplies: branches.filter((branch) => branch.moves.length === 2).length,
    branches,
    whiteChoices,
  }
}

function move(from: string, to: string): MateVerificationBranch<string> {
  return {
    kind: 'continue',
    moves: [`${from}W`, `${to}B`],
    next: to,
    resetsHalfmoveClock: [false, false],
    states: [`${from}-after-white`, to],
  }
}

const mate: MateVerificationBranch<string> = {
  kind: 'mate',
  moves: ['#'],
  resetsHalfmoveClock: [false],
  states: ['mate'],
}

test('reports every disjoint cyclic SCC and its shortest category', () => {
  const result = diagnoseMatePolicySccs(
    [root('A'), root('B'), root('D'), root('G')],
    adapter({
      A: expansion([move('A', 'A'), mate]),
      B: expansion([move('B', 'C')]),
      C: expansion([move('C', 'B')]),
      D: expansion([move('D', 'E')]),
      E: expansion([move('E', 'F')]),
      F: expansion([move('F', 'D')]),
      G: expansion([mate]),
    }),
  )

  assert.equal(result.status, 'cyclic')
  assert.equal(result.stats.cyclicComponents, 3)
  assert.equal(result.stats.cyclicStates, 6)
  assert.equal(result.stats.selfLoops, 1)
  assert.equal(result.stats.twoStateCycles, 1)
  assert.equal(result.stats.multiStateCycles, 1)
  assert.equal(result.stats.whiteStates, 7)
  assert.equal(result.stats.continueEdges, 6)
  assert.deepEqual(result.positionOutcomes, {
    loopLeadingPositions: 6,
    mateTerminatingPositions: 1,
    otherFailureLeadingPositions: 0,
    totalPositions: 7,
  })
  assert.deepEqual(
    result.cyclicComponents.map((component) => component.witness.category),
    ['self-loop', 'two-state-cycle', 'multi-state-cycle'],
  )
  assert.deepEqual(result.cyclicComponents[0]?.witness.moves, ['AW', 'AB'])
})

test('explores all tied White choices and Black replies without early exit', () => {
  const result = diagnoseMatePolicySccs(
    [root('A')],
    adapter({
      A: expansion([move('A', 'A'), move('A', 'B'), move('A', 'C')], 2),
      B: expansion([mate]),
      C: expansion([
        {
          failureKind: 'stalemate',
          kind: 'failure',
          message: 'draw branch',
          moves: ['CW'],
          resetsHalfmoveClock: [false],
          states: ['draw'],
        },
      ]),
    }),
  )

  assert.equal(result.stats.whiteChoices, 4)
  assert.equal(result.stats.blackReplies, 3)
  assert.equal(result.stats.continueEdges, 3)
  assert.equal(result.stats.failureBranches, 1)
  assert.equal(result.stats.whiteStates, 3)
  assert.equal(result.cyclicComponents.length, 1)
  assert.equal(result.failureSamples[0]?.kind, 'stalemate')
  assert.deepEqual(result.positionOutcomes, {
    loopLeadingPositions: 1,
    mateTerminatingPositions: 1,
    otherFailureLeadingPositions: 1,
    totalPositions: 3,
  })
})

test('classifies a symmetry-collapsed transition as a structural self-loop', () => {
  const result = diagnoseMatePolicySccs(
    [root('A')],
    adapter(
      {
        A: expansion([move('A', 'a')]),
      },
      (state) => state.toUpperCase(),
    ),
  )

  assert.equal(result.status, 'cyclic')
  assert.equal(result.stats.whiteStates, 1)
  assert.equal(result.cyclicComponents[0]?.witness.category, 'self-loop')
  assert.equal(result.cyclicComponents[0]?.witness.transitions[0]?.toState, 'a')
})

test('can omit playable witnesses without changing position outcomes', () => {
  const result = diagnoseMatePolicySccs(
    [root('A')],
    adapter({
      A: expansion([move('A', 'A'), move('A', 'B')]),
      B: expansion([mate]),
    }),
    { includeCycleWitnesses: false },
  )

  assert.equal(result.status, 'cyclic')
  assert.equal(result.cycleWitnessesOmitted, true)
  assert.equal(result.cyclicComponents.length, 0)
  assert.equal(result.stats.cyclicComponents, 1)
  assert.equal(result.stats.cyclicStates, 1)
  assert.deepEqual(result.positionOutcomes, {
    loopLeadingPositions: 1,
    mateTerminatingPositions: 1,
    otherFailureLeadingPositions: 0,
    totalPositions: 2,
  })
})

test('chooses the shortest cycle even inside a larger cyclic component', () => {
  const result = diagnoseMatePolicySccs(
    [root('A')],
    adapter({
      A: expansion([move('A', 'B'), move('A', 'D')]),
      B: expansion([move('B', 'C')]),
      C: expansion([move('C', 'A')]),
      D: expansion([move('D', 'A')]),
    }),
  )

  const component = result.cyclicComponents[0]
  assert.equal(component?.nodeKeys.length, 4)
  assert.equal(component?.witness.category, 'two-state-cycle')
  assert.deepEqual(component?.witness.moves, ['AW', 'DB', 'DW', 'AB'])
})

test('reports an acyclic graph and a rule gap without treating either as a cycle', () => {
  const result = diagnoseMatePolicySccs(
    [root('A'), root('gap')],
    adapter({
      A: expansion([move('A', 'B')]),
      B: expansion([mate]),
      gap: expansion([], 0),
    }),
  )

  assert.equal(result.status, 'acyclic')
  assert.equal(result.stats.cyclicComponents, 0)
  assert.equal(result.stats.ruleGaps, 1)
  assert.equal(result.failureSamples[0]?.kind, 'rule-gap')
  assert.deepEqual(result.positionOutcomes, {
    loopLeadingPositions: 0,
    mateTerminatingPositions: 2,
    otherFailureLeadingPositions: 1,
    totalPositions: 3,
  })
})

test('classifies every seen position by reverse reachability', () => {
  const result = diagnoseMatePolicySccs(
    [root('A'), root('D'), root('F')],
    adapter({
      A: expansion([move('A', 'B')]),
      B: expansion([move('B', 'C')]),
      C: expansion([move('C', 'C'), mate]),
      D: expansion([move('D', 'E')]),
      E: expansion([mate]),
      F: expansion([move('F', 'G')]),
      G: expansion([
        {
          failureKind: 'stalemate',
          kind: 'failure',
          message: 'draw branch',
          moves: ['GW'],
          resetsHalfmoveClock: [false],
          states: ['draw'],
        },
      ]),
    }),
  )

  assert.deepEqual(result.positionOutcomes, {
    loopLeadingPositions: 3,
    mateTerminatingPositions: 2,
    otherFailureLeadingPositions: 2,
    totalPositions: 7,
  })
})

test('incremental rungs extend the prior closure without re-expanding it', () => {
  let expansionCalls = 0
  const countedAdapter = adapter({
    A: expansion([move('A', 'B')]),
    B: expansion([mate]),
    C: expansion([move('C', 'D')]),
    D: expansion([mate]),
  })
  const session = new MatePolicySccSession({
    ...countedAdapter,
    expand: (state) => {
      expansionCalls += 1
      return countedAdapter.expand(state)
    },
  })

  const first = session.extend([root('A')])
  const second = session.extend([root('A'), root('C')])
  const repeated = session.extend([root('A'), root('C')])
  const cold = diagnoseMatePolicySccs(
    [root('A'), root('C')],
    countedAdapter,
  )

  assert.equal(first.cache.newStates, 2)
  assert.equal(second.cache.newStates, 2)
  assert.equal(second.cache.newRoots, 1)
  assert.equal(repeated.cache.newStates, 0)
  assert.equal(repeated.cache.newEdges, 0)
  assert.equal(repeated.cache.expansionMisses, 0)
  assert.equal(expansionCalls, 4)
  assert.deepEqual(second.result.stats, cold.stats)
})

test('a persisted session snapshot resumes with no old graph work', () => {
  const graphAdapter = adapter({
    A: expansion([move('A', 'B')]),
    B: expansion([mate]),
    C: expansion([move('C', 'A')]),
  })
  const firstSession = new MatePolicySccSession(graphAdapter)
  firstSession.extend([root('A')])
  const resumed = new MatePolicySccSession(
    graphAdapter,
    {},
    firstSession.snapshot(),
  )

  const rung = resumed.extend([root('A'), root('C')])

  assert.equal(rung.cache.newRoots, 1)
  assert.equal(rung.cache.newStates, 1)
  assert.equal(rung.cache.newEdges, 1)
  assert.equal(rung.result.stats.whiteStates, 3)
  assert.equal(rung.result.stats.continueEdges, 2)
})
