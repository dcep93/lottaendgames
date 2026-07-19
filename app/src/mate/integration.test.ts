import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const mateRoot = dirname(fileURLToPath(import.meta.url))

test('App navigation pushes Mate routes and restores them from browser history', () => {
  const appSource = readFileSync(join(mateRoot, '..', 'App.tsx'), 'utf8')

  assert.match(appSource, /window\.history\.pushState\(null, '', href\)/)
  assert.match(
    appSource,
    /window\.addEventListener\('popstate', handleHistoryChange\)/,
  )
  assert.match(
    appSource,
    /window\.removeEventListener\('popstate', handleHistoryChange\)/,
  )
  assert.match(
    appSource,
    /window\.addEventListener\('hashchange', handleHistoryChange\)/,
  )
  assert.match(
    appSource,
    /window\.removeEventListener\('hashchange', handleHistoryChange\)/,
  )
  assert.match(
    appSource,
    /function handleHistoryChange\(\)[\s\S]*setResolution\(nextResolution\)/,
  )
})

test('Mate production code confines storage to the timer preference', () => {
  const productionFiles = collectProductionSources(mateRoot)
  const excludedRuntime =
    /\b(?:sessionStorage|indexedDB|bootstrap|novelty|speedrun|traps|traverse)\b|loop finder/i
  const localStorageRuntime = /\blocalStorage\b/
  const networkRuntime = /\b(?:fetch|WebSocket|EventSource)\s*\(/
  const timerPreferenceFile = join(mateRoot, 'timerPreference.ts')

  for (const file of productionFiles) {
    const source = readFileSync(file, 'utf8')
    assert.doesNotMatch(source, excludedRuntime, file)
    assert.doesNotMatch(source, networkRuntime, file)
    if (file !== timerPreferenceFile) {
      assert.doesNotMatch(source, localStorageRuntime, file)
    }
  }
})

function collectProductionSources(directory: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectProductionSources(path))
      continue
    }
    if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.includes('.test.')
    ) {
      files.push(path)
    }
  }
  return files
}
