import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

type FidelityStatus =
  | 'accepted-deviation'
  | 'blocked'
  | 'matched'
  | 'unresolved'

type FidelityUnit = {
  appAnchor?: string
  appRoute: string
  chapter: string
  evidence: string
  fieldsChecked: string[]
  id: string
  kind: 'blank' | 'board' | 'front-matter' | 'page-copy'
  pdfPage: number
  printPage?: number
  sourceIdentifier: string
  status: FidelityStatus
}

type FidelityLedger = {
  deviations: Array<{
    id: string
    unitIds: string[]
  }>
  inventory: {
    blankUnits: number
    boardProblemDiagramUnits: number
    frontMatterUnits: number
    pageCopyUnits: number
    totalUnits: number
  }
  releases: Array<{
    id: string
    units: FidelityUnit[]
  }>
  schemaVersion: number
  source: {
    file: string
    pageCount: number
    sha256: string
  }
}

const ledger = JSON.parse(
  readFileSync(
    new URL('./pdf/source_fidelity_ledger.json', import.meta.url),
    'utf8',
  ),
) as FidelityLedger
const pdf = readFileSync(
  new URL('./pdf/100-endgames-you-must-know-2008.pdf', import.meta.url),
)
const units = ledger.releases.flatMap(({ units: releaseUnits }) => releaseUnits)

assert.equal(ledger.schemaVersion, 2)
assert.equal(ledger.source.pageCount, 249)
assert.equal(
  ledger.source.sha256,
  createHash('sha256').update(pdf).digest('hex'),
)
assert.equal(ledger.inventory.pageCopyUnits, 239)
assert.equal(ledger.inventory.boardProblemDiagramUnits, 337)
assert.equal(ledger.inventory.frontMatterUnits, 9)
assert.equal(ledger.inventory.blankUnits, 1)
assert.equal(ledger.inventory.totalUnits, 586)
assert.equal(units.length, 586)
assert.equal(new Set(units.map(({ id }) => id)).size, units.length)
assert.equal(units.filter(({ kind }) => kind === 'page-copy').length, 239)
assert.equal(units.filter(({ kind }) => kind === 'board').length, 337)
assert.equal(units.filter(({ kind }) => kind === 'front-matter').length, 9)
assert.equal(units.filter(({ kind }) => kind === 'blank').length, 1)
assert.equal(units.filter(({ status }) => status === 'matched').length, 566)
assert.equal(
  units.filter(({ status }) => status === 'accepted-deviation').length,
  20,
)
assert.equal(ledger.deviations.length, 13)
assert.equal(
  ledger.deviations.some(
    ({ id }) => id === 'position-12.29-illegal-published-line',
  ),
  false,
)
assert.deepEqual(
  Array.from(new Set(units.map(({ pdfPage }) => pdfPage))).sort(
    (left, right) => left - right,
  ),
  Array.from({ length: 249 }, (_, index) => index + 1),
)

for (const unit of units) {
  assert.ok(unit.chapter, `${unit.id} must identify its chapter/source group`)
  assert.ok(unit.sourceIdentifier, `${unit.id} must identify its source unit`)
  assert.match(unit.appRoute, /^\/book\//, `${unit.id} must identify its app route`)
  assert.ok(unit.fieldsChecked.length > 0, `${unit.id} must list checked fields`)
  assert.ok(unit.evidence.length > 20, `${unit.id} must contain concise evidence`)
  assert.ok(
    ['accepted-deviation', 'blocked', 'matched', 'unresolved'].includes(
      unit.status,
    ),
    `${unit.id} has an invalid status`,
  )
  if (unit.kind === 'board') {
    assert.match(unit.appAnchor ?? '', /^p/, `${unit.id} must deep-link its board`)
    assert.ok(
      unit.fieldsChecked.includes('fen-square-map'),
      `${unit.id} must record square-by-square FEN checking`,
    )
  }
}

assert.equal(
  units.filter(({ status }) => status === 'unresolved' || status === 'blocked')
    .length,
  0,
)

const positionTwelveTwentyNine = units.find(
  ({ id }) => id === '12-board-12.29',
)
assert.equal(positionTwelveTwentyNine?.status, 'matched')
assert.match(positionTwelveTwentyNine?.evidence ?? '', /1\.h3 main line/)

console.log('source fidelity ledger audit passed')
