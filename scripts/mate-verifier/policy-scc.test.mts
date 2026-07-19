import assert from 'node:assert/strict'
import test from 'node:test'
import { diagnoseMatePolicySccs } from './policy-scc.mts'
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
})
