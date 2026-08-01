import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { verifyTwoBishopsProofCertificate } from './two-bishops-proof.mts'

test('Two Bishops offline exact-distance table validates independently', () => {
  const result = verifyTwoBishopsProofCertificate()
  assert.equal(result.status, 'verified')
  assert.equal(result.stats.provenRoots, 386_792)
  assert.equal(result.stats.maximumMatePlies, 75)
  assert.ok(result.stats.maximumMatePlies < 100)
})

test('the production verifier does not substitute the proof-table certificate', () => {
  const source = readFileSync(
    new URL('../verify_mate_patterns.mts', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(source, /verifyTwoBishopsProofCertificate/)
  assert.match(source, /verifyMateRoots\(/)
})
