import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

type FidelityClassification =
  | 'accepted-presentation-deviation'
  | 'app-defect'
  | 'blocked'
  | 'book-error'
  | 'matched'

type FidelityDisposition = {
  status:
    | 'accepted'
    | 'blocked'
    | 'no-change'
    | 'preserved-print'
    | 'repaired'
  summary: string
}

type BatchWorkingEvidence = {
  regressionCoverage: string[]
  repairAdversarialReport: string
  sourceRecord: string
}

type FidelityEvidence = {
  auditRunId: string
  auditState: 'blocked' | 'complete' | 'in-progress'
  batches: Array<{
    id: string
    label: string
    status: 'closed' | 'open'
    unitIds: string[]
    workingEvidence?: BatchWorkingEvidence
  }>
  candidate: unknown
  findings: Array<{
    classification: Exclude<FidelityClassification, 'matched'>
    differences: Array<{
      appValue: unknown
      field: string
      printedValue: unknown
    }>
    disposition: FidelityDisposition
    evidence: string
    id: string
    postFixVerification: { pdf: string; runningApp: string }
    regressionCoverage: string[]
    repair: string
    severity: 'critical' | 'high' | 'low' | 'medium' | 'none'
    unitIds: string[]
  }>
  schemaVersion: number
  units: Array<{
    classification: FidelityClassification
    differences: Array<{
      appValue: unknown
      field: string
      printedValue: unknown
    }>
    disposition: FidelityDisposition
    findingIds: string[]
    id: string
    kind: 'blank' | 'board' | 'front-matter' | 'page-copy'
    pdfPage: number
    unitType: string
  }>
}

type FidelityLedger = {
  auditRunId: string
  auditState: FidelityEvidence['auditState']
  batches: Array<{
    classificationCounts: Record<FidelityClassification, number>
    id: string
    label: string
    pdfPageRanges: Array<{ first: number; last: number }>
    status: 'closed' | 'open'
    unitCount: number
    unitIds: string[]
    workingEvidence?: BatchWorkingEvidence
  }>
  candidate: unknown
  findings: FidelityEvidence['findings']
  generatedFrom: string
  inventory: {
    blankUnits: number
    boardProblemDiagramUnits: number
    classifications: Record<FidelityClassification, number>
    coveredPdfPages: number
    frontMatterUnits: number
    pageCopyUnits: number
    pdfPageRanges: Array<{ first: number; last: number }>
    totalUnits: number
  }
  schemaVersion: number
  units: FidelityEvidence['units']
}

type ContractFinding = Pick<
  FidelityEvidence['findings'][number],
  'classification' | 'differences' | 'id' | 'unitIds'
>

type ContractUnit = Pick<
  FidelityEvidence['units'][number],
  'classification' | 'differences' | 'findingIds' | 'id'
>

type GeneratorContract = {
  getPrimaryClassification: (
    findings: Array<Pick<ContractFinding, 'classification'>>,
  ) => FidelityClassification
  validateDispositionForClassification: (
    disposition: FidelityDisposition,
    classification: FidelityClassification,
    location: string,
  ) => void
  validatePrintPageReference: (
    unit: { printPage?: number; printPageLabel?: string },
    location: string,
  ) => void
  validateUnitFindingLinks: (
    units: ContractUnit[],
    findingById: Map<string, ContractFinding>,
  ) => void
}

const evidence = JSON.parse(
  readFileSync(
    new URL('./pdf/source_fidelity_evidence.json', import.meta.url),
    'utf8',
  ),
) as FidelityEvidence
const ledger = JSON.parse(
  readFileSync(
    new URL('./pdf/source_fidelity_ledger.json', import.meta.url),
    'utf8',
  ),
) as FidelityLedger
const generatorPath = fileURLToPath(
  new URL('../../../scripts/rebuild_fidelity_ledger.mjs', import.meta.url),
)
const generatorContract = (await import(
  pathToFileURL(generatorPath).href
)) as GeneratorContract
const contractOnly = process.argv.includes('--contract-only')
const generatedCheck = contractOnly
  ? undefined
  : spawnSync(process.execPath, [generatorPath, '--check'], {
      encoding: 'utf8',
    })

if (generatedCheck) {
  assert.equal(
    generatedCheck.status,
    0,
    generatedCheck.stderr || generatedCheck.stdout,
  )
}
assert.equal(evidence.schemaVersion, 1)
assert.equal(ledger.schemaVersion, 3)
assert.equal(ledger.generatedFrom, 'source_fidelity_evidence.json')
assert.equal(ledger.auditRunId, evidence.auditRunId)
assert.equal(ledger.auditState, evidence.auditState)
assert.deepEqual(ledger.candidate, evidence.candidate)
assert.deepEqual(ledger.units, evidence.units)
assert.deepEqual(ledger.findings, evidence.findings)
assert.deepEqual(
  ledger.batches.map(
    ({ id, label, status, unitIds, workingEvidence }) => ({
      id,
      label,
      status,
      unitIds,
      ...(workingEvidence ? { workingEvidence } : {}),
    }),
  ),
  evidence.batches,
)

const classifications: FidelityClassification[] = [
  'matched',
  'app-defect',
  'book-error',
  'accepted-presentation-deviation',
  'blocked',
]
const count = (classification: FidelityClassification) =>
  evidence.units.filter((unit) => unit.classification === classification).length

assert.equal(ledger.inventory.totalUnits, evidence.units.length)
assert.equal(
  ledger.inventory.pageCopyUnits,
  evidence.units.filter(({ kind }) => kind === 'page-copy').length,
)
assert.equal(
  ledger.inventory.boardProblemDiagramUnits,
  evidence.units.filter(({ kind }) => kind === 'board').length,
)
assert.equal(
  ledger.inventory.frontMatterUnits,
  evidence.units.filter(({ kind }) => kind === 'front-matter').length,
)
assert.equal(
  ledger.inventory.blankUnits,
  evidence.units.filter(({ kind }) => kind === 'blank').length,
)
assert.equal(
  ledger.inventory.coveredPdfPages,
  new Set(evidence.units.map(({ pdfPage }) => pdfPage)).size,
)
for (const classification of classifications) {
  assert.equal(
    ledger.inventory.classifications[classification],
    count(classification),
  )
}

assert.equal(
  new Set(evidence.units.map(({ id }) => id)).size,
  evidence.units.length,
)
assert.equal(
  new Set(evidence.findings.map(({ id }) => id)).size,
  evidence.findings.length,
)
for (const unit of evidence.units) {
  assert.equal(Object.hasOwn(unit, 'findingId'), false)
  assert.equal(new Set(unit.findingIds).size, unit.findingIds.length)
  assert.equal(unit.findingIds.length === 0, unit.classification === 'matched')

  const linkedFindings = unit.findingIds.map((findingId) => {
    const finding = evidence.findings.find(({ id }) => id === findingId)
    assert(finding, `${unit.id} points to missing finding ${findingId}`)
    assert(
      finding.unitIds.includes(unit.id),
      `${findingId} does not link back to ${unit.id}`,
    )
    return finding
  })
  assert.equal(
    unit.classification,
    generatorContract.getPrimaryClassification(linkedFindings),
  )
  assert.deepEqual(
    unit.differences
      .map((difference) => JSON.stringify(difference))
      .sort(),
    Array.from(
      new Map(
        linkedFindings
          .flatMap(({ differences }) => differences)
          .map((difference) => [JSON.stringify(difference), difference]),
      ).values(),
    )
      .map((difference) => JSON.stringify(difference))
      .sort(),
  )
  assert.doesNotThrow(() =>
    generatorContract.validateDispositionForClassification(
      unit.disposition,
      unit.classification,
      `${unit.id} disposition`,
    ),
  )
}
for (const finding of evidence.findings) {
  assert(finding.evidence.length > 0)
  assert(finding.differences.length > 0)
  assert(finding.repair.length > 0)
  assert(finding.regressionCoverage.length > 0)
  assert(finding.postFixVerification.pdf.length > 0)
  assert(finding.postFixVerification.runningApp.length > 0)
  assert.doesNotThrow(() =>
    generatorContract.validateDispositionForClassification(
      finding.disposition,
      finding.classification,
      `${finding.id} disposition`,
    ),
  )
  for (const unitId of finding.unitIds) {
    const unit = evidence.units.find(({ id }) => id === unitId)
    assert(unit, `${finding.id} points to missing unit ${unitId}`)
    assert(
      unit.findingIds.includes(finding.id),
      `${unitId} does not link back to ${finding.id}`,
    )
  }
}
const priorityFixtures: Array<{
  classifications: Array<
    Exclude<FidelityClassification, 'matched'>
  >
  expected: FidelityClassification
}> = [
  { classifications: [], expected: 'matched' },
  {
    classifications: ['accepted-presentation-deviation'],
    expected: 'accepted-presentation-deviation',
  },
  {
    classifications: ['book-error', 'accepted-presentation-deviation'],
    expected: 'book-error',
  },
  { classifications: ['app-defect', 'book-error'], expected: 'app-defect' },
  { classifications: ['blocked', 'app-defect'], expected: 'blocked' },
]
for (const fixture of priorityFixtures) {
  assert.equal(
    generatorContract.getPrimaryClassification(
      fixture.classifications.map((classification) => ({ classification })),
    ),
    fixture.expected,
  )
}

const mixedFixtureFindings: ContractFinding[] = [
  {
    classification: 'app-defect',
    differences: [
      {
        appValue: 'missing',
        field: 'anchor',
        printedValue: 'present',
      },
    ],
    id: 'fixture-app-defect',
    unitIds: ['fixture-unit'],
  },
  {
    classification: 'accepted-presentation-deviation',
    differences: [
      {
        appValue: 'plain polyline',
        field: 'route styling',
        printedValue: 'arrow',
      },
    ],
    id: 'fixture-presentation',
    unitIds: ['fixture-unit'],
  },
]
const mixedFixtureUnit: ContractUnit = {
  classification: 'app-defect',
  differences: [
    {
      appValue: 'missing',
      field: 'anchor',
      printedValue: 'present',
    },
    {
      appValue: 'plain polyline',
      field: 'route styling',
      printedValue: 'arrow',
    },
  ],
  findingIds: ['fixture-app-defect', 'fixture-presentation'],
  id: 'fixture-unit',
}
const mixedFindingById = new Map(
  mixedFixtureFindings.map((finding) => [finding.id, finding]),
)
assert.doesNotThrow(() =>
  generatorContract.validateUnitFindingLinks(
    [mixedFixtureUnit],
    mixedFindingById,
  ),
)
assert.throws(
  () =>
    generatorContract.validateUnitFindingLinks(
      [
        {
          ...mixedFixtureUnit,
          classification: 'accepted-presentation-deviation',
        },
      ],
      mixedFindingById,
    ),
  /does not match primary linked classification app-defect/,
)
assert.throws(
  () =>
    generatorContract.validateUnitFindingLinks(
      [mixedFixtureUnit],
      new Map([
        [
          'fixture-app-defect',
          { ...mixedFixtureFindings[0], unitIds: ['different-unit'] },
        ],
        ['fixture-presentation', mixedFixtureFindings[1]],
      ]),
    ),
  /is not linked back from finding fixture-app-defect/,
)
assert.doesNotThrow(() =>
  generatorContract.validateDispositionForClassification(
    { status: 'accepted', summary: 'Intentional presentation decision.' },
    'accepted-presentation-deviation',
    'fixture disposition',
  ),
)
assert.throws(
  () =>
    generatorContract.validateDispositionForClassification(
      { status: 'accepted', summary: 'Wrong disposition.' },
      'app-defect',
      'fixture disposition',
    ),
  /incompatible with classification app-defect/,
)
assert.doesNotThrow(() =>
  generatorContract.validatePrintPageReference(
    { printPage: 1 },
    'numeric print-page fixture',
  ),
)
assert.doesNotThrow(() =>
  generatorContract.validatePrintPageReference(
    { printPageLabel: 'unnumbered' },
    'unnumbered print-page fixture',
  ),
)
assert.throws(
  () =>
    generatorContract.validatePrintPageReference(
      { printPage: 1, printPageLabel: 'unnumbered' },
      'duplicate print-page fixture',
    ),
  /must record exactly one of printPage or printPageLabel/,
)
assert.throws(
  () =>
    generatorContract.validatePrintPageReference(
      {},
      'missing print-page fixture',
    ),
  /must record exactly one of printPage or printPageLabel/,
)
assert.throws(
  () =>
    generatorContract.validatePrintPageReference(
      { printPageLabel: 'front matter' },
      'invalid print-page label fixture',
    ),
  /printPageLabel must be unnumbered/,
)
assert.equal(
  ledger.batches.reduce((sum, { unitCount }) => sum + unitCount, 0),
  evidence.units.length,
)

console.log(
  contractOnly
    ? 'source fidelity ledger schema and multi-finding contract passed'
    : 'source fidelity ledger schema and generated freshness passed',
)
