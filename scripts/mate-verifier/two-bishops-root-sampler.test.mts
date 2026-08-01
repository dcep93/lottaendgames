import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalVerifierPositionKey,
} from './production.mts'
import {
  mergeAdversarialTwoBishopsRoots,
  readAdversarialTwoBishopsRoots,
  sampleTwoBishopsRoots,
} from './two-bishops-root-sampler.mts'

test('Two Bishops root sampling is fixed-seed deterministic and D4 unique', () => {
  const corpus = ['8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1']
  const first = sampleTwoBishopsRoots(16, 12345, corpus)
  const second = sampleTwoBishopsRoots(16, 12345, corpus)
  const differentSeed = sampleTwoBishopsRoots(16, 54321, corpus)

  assert.deepEqual(
    first.roots.map(({ state }) => state),
    second.roots.map(({ state }) => state),
  )
  assert.notDeepEqual(
    first.roots.map(({ state }) => state),
    differentSeed.roots.map(({ state }) => state),
  )
  assert.equal(first.corpusRoots, 1)
  assert.equal(first.sampledRoots, 16)
  assert.equal(first.roots.length, 17)
  assert.equal(
    new Set(
      first.roots.map(({ state }) =>
        canonicalVerifierPositionKey('two-bishops', state),
      ),
    ).size,
    17,
  )
  assert.ok(Object.keys(first.strata).length >= 8)
})

test('every sampled gate contains the full corpus plus sampled roots', () => {
  const corpus = readAdversarialTwoBishopsRoots().slice(0, 8)
  const sample = sampleTwoBishopsRoots(4, 7, corpus)
  assert.equal(sample.corpusRoots, corpus.length)
  assert.equal(sample.sampledRoots, 4)
  assert.equal(sample.roots.length, corpus.length + 4)
  assert.equal(
    sample.roots
      .slice(0, sample.corpusRoots)
      .every(({ source }) => source === 'adversarial corpus'),
    true,
  )
})

test('larger samples extend the same policy-independent seeded prefix', () => {
  const corpus = ['8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1']
  const ten = sampleTwoBishopsRoots(10, 12345, corpus)
  const hundred = sampleTwoBishopsRoots(100, 12345, corpus)
  assert.deepEqual(
    hundred.roots.slice(0, ten.roots.length).map(({ state }) => state),
    ten.roots.map(({ state }) => state),
  )
})

test('corpus merge promotes new witnesses and D4-deduplicates repeats', () => {
  const existing = ['8/8/8/8/8/8/4K3/3BB1k1 w - - 0 1']
  const newWitness = '8/2K5/k2BB3/8/8/8/8/8 w - - 0 1'
  const merged = mergeAdversarialTwoBishopsRoots(
    [
      '8/8/8/8/8/8/4K3/3BB1k1 w - - 77 39',
      newWitness,
      newWitness,
    ],
    existing,
  )
  assert.equal(merged.added, 1)
  assert.equal(merged.roots.length, 2)
  assert.equal(merged.roots[0], existing[0])
  assert.equal(merged.roots[1], newWitness)
})
