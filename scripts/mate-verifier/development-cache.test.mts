import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  DevelopmentVerificationCache,
  PersistentProductionTransitionCache,
} from './development-cache.mts'
import {
  createProductionMateAdapter,
  normalizeVerifierState,
} from './production.mts'

test('policy edits miss recommendations but reuse board transitions', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mate-dev-cache-'))
  const database = join(directory, 'cache.sqlite')
  const state = normalizeVerifierState(
    '8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1',
  )
  const positionFingerprint = 'two-bishops:symmetry:engine-test'

  try {
    const firstTransitions = new PersistentProductionTransitionCache(
      database,
      'engine-test',
    )
    const firstSource = createProductionMateAdapter('two-bishops', {
      stateKeyMode: 'symmetry',
      transitionCache: firstTransitions,
    })
    const firstPolicy = new DevelopmentVerificationCache(
      database,
      positionFingerprint,
      'policy-a',
      firstSource,
    )
    const firstExpansion = firstPolicy.adapter().expand(state)
    assert.ok(firstTransitions.stats().misses > 0)
    assert.equal(firstPolicy.stats().expansionMisses, 1)
    firstPolicy.close()
    firstTransitions.close()

    const changedTransitions = new PersistentProductionTransitionCache(
      database,
      'engine-test',
    )
    const changedSource = createProductionMateAdapter('two-bishops', {
      stateKeyMode: 'symmetry',
      transitionCache: changedTransitions,
    })
    const changedPolicy = new DevelopmentVerificationCache(
      database,
      positionFingerprint,
      'policy-b',
      changedSource,
    )
    const changedExpansion = changedPolicy.adapter().expand(state)

    assert.deepEqual(changedExpansion, firstExpansion)
    assert.equal(changedPolicy.stats().expansionHits, 0)
    assert.equal(changedPolicy.stats().expansionMisses, 1)
    assert.ok(changedTransitions.stats().diskHits > 0)
    changedPolicy.close()
    changedTransitions.close()
  } finally {
    rmSync(directory, { recursive: true })
  }
})

test('unchanged root results and expansions resume from disk', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mate-dev-cache-'))
  const database = join(directory, 'cache.sqlite')
  let expansionCalls = 0
  const source = {
    expand: () => {
      expansionCalls += 1
      return {
        blackReplies: 0,
        branches: [
          {
            kind: 'mate' as const,
            moves: ['#'],
            resetsHalfmoveClock: [false],
            states: ['mate'],
          },
        ],
        whiteChoices: 1,
      }
    },
    key: (state: string) => state.toUpperCase(),
    render: (state: string) => state,
  }
  const verified = {
    status: 'verified' as const,
    stats: {
      blackReplies: 0,
      maximumMatePlies: 1,
      provenRoots: 1,
      uniquePositions: 1,
      whiteChoices: 1,
    },
  }

  try {
    const first = new DevelopmentVerificationCache(
      database,
      'position-v1',
      'policy-a',
      source,
    )
    assert.equal(first.adapter().key('a'), 'A')
    first.adapter().expand('a')
    first.set('policy-a', 'A\u00000', verified)
    first.close()

    const repeated = new DevelopmentVerificationCache(
      database,
      'position-v1',
      'policy-a',
      source,
    )
    assert.equal(repeated.adapter().key('a'), 'A')
    repeated.adapter().expand('a')
    assert.deepEqual(repeated.get('policy-a', 'A\u00000'), verified)
    assert.equal(repeated.stats().positionKeyHits, 1)
    assert.equal(repeated.stats().expansionHits, 1)
    assert.equal(repeated.stats().rootResultHits, 1)
    assert.equal(expansionCalls, 1)
    repeated.close()
  } finally {
    rmSync(directory, { recursive: true })
  }
})
