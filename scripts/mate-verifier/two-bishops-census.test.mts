import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('parallel census resumes exactly and refuses a mismatched checkpoint', () => {
  const output = mkdtempSync(join(tmpdir(), 'two-bishops-census-'))
  const runner = fileURLToPath(new URL('./two-bishops-census.mts', import.meta.url))
  const loader = fileURLToPath(new URL('../../app/node_modules/tsx/dist/loader.mjs', import.meta.url))
  const run = () => spawnSync(process.execPath, ['--import', loader, runner,
    '--root-limit=10', '--workers=2', `--output=${output}`], { encoding: 'utf8', timeout: 120_000 })
  try {
    const first = run()
    assert.equal(first.status, 0, first.stderr)
    const initial = JSON.parse(readFileSync(join(output, 'result.json'), 'utf8'))
    assert.equal(initial.certificate.completeStandardUniverse, false)
    assert.equal(initial.certificate.allPositionsTerminate, false)
    assert.equal(initial.certificate.allExaminedRootsTerminate, true)
    assert.equal(initial.rootOutcomes.total, 10)
    assert.ok(initial.graphOutcomes.totalPositions >= 10)

    const second = run()
    assert.equal(second.status, 0, second.stderr)
    const resumed = JSON.parse(readFileSync(join(output, 'result.json'), 'utf8'))
    for (const field of ['certificate', 'fingerprints', 'implementation', 'rootOutcomes',
      'graphOutcomes', 'whiteChoices', 'blackReplies', 'ruleFilterCensus', 'witnesses']) {
      assert.deepEqual(resumed[field], initial[field], field)
    }
    const database = new DatabaseSync(join(output, 'graph.sqlite'))
    database.prepare('UPDATE metadata SET value = ? WHERE key = ?').run('mismatch', 'provenance')
    database.close()
    const invalid = run()
    assert.equal(invalid.status, 1)
    assert.match(invalid.stderr, /Checkpoint fingerprint or scope mismatch/)
  } finally {
    rmSync(output, { recursive: true, force: true })
  }
})
