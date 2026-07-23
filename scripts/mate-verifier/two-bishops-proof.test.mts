import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyTwoBishopsProofCertificate } from './two-bishops-proof.mts'

test('Two Bishops exhaustive certificate proves no loop or fifty-move draw', () => {
  const result = verifyTwoBishopsProofCertificate()
  assert.equal(result.status, 'verified')
  assert.equal(result.stats.provenRoots, 386_792)
  assert.equal(result.stats.maximumMatePlies, 75)
  assert.ok(result.stats.maximumMatePlies < 100)
})
