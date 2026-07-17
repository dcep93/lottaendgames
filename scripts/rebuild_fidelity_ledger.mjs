#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('..', import.meta.url))
const evidencePath = resolve(
  root,
  'app/src/app_x/pdf/source_fidelity_evidence.json',
)
const ledgerPath = resolve(root, 'app/src/app_x/pdf/source_fidelity_ledger.json')
const bookPath = resolve(root, 'app/src/app_x/pdf/book.json')
const pdfPath = resolve(
  root,
  'app/src/app_x/pdf/100-endgames-you-must-know-2008.pdf',
)
const manifestPath = resolve(root, 'app/src/app_x/chapterPayloadManifest.ts')
const publicPath = resolve(root, 'app/public')

const auditStates = new Set(['blocked', 'complete', 'in-progress'])
const batchStates = new Set(['closed', 'open'])
const chessLegalityStatuses = new Set([
  'blocked',
  'illegal',
  'legal',
  'mixed',
  'not-applicable',
])
const classifications = [
  'matched',
  'app-defect',
  'book-error',
  'accepted-presentation-deviation',
  'blocked',
]
const classificationSet = new Set(classifications)
const classificationPriorities = new Map([
  ['matched', 0],
  ['accepted-presentation-deviation', 1],
  ['book-error', 2],
  ['app-defect', 3],
  ['blocked', 4],
])
const compatibleDispositionStatuses = new Map([
  ['matched', new Set(['no-change'])],
  ['accepted-presentation-deviation', new Set(['accepted'])],
  ['book-error', new Set(['preserved-print', 'repaired'])],
  ['app-defect', new Set(['repaired'])],
  ['blocked', new Set(['blocked'])],
])
const correctionCertainties = new Set([
  'blocked',
  'certain',
  'not-applicable',
  'uncertain',
])
const dispositionStatuses = new Set([
  'accepted',
  'blocked',
  'no-change',
  'preserved-print',
  'repaired',
])
const findingOrigins = new Set(['app', 'book', 'presentation', 'unknown'])
const kinds = ['blank', 'board', 'front-matter', 'page-copy']
const kindSet = new Set(kinds)
const locationKinds = new Set([
  'app-source',
  'book-section',
  'not-applicable',
])
const severities = new Set(['critical', 'high', 'low', 'medium', 'none'])
const transcriptionStatuses = new Set([
  'blocked',
  'different',
  'matched',
  'not-applicable',
])

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main()
}

function main() {
  const args = process.argv.slice(2)
  assert(
    args.every((argument) => argument === '--check'),
    `Unknown argument: ${args.find((argument) => argument !== '--check')}`,
  )
  assert(
    args.filter((argument) => argument === '--check').length <= 1,
    '--check may be specified only once',
  )

  const evidence = readJson(evidencePath)
  const book = readJson(bookPath)
  const candidate = inspectCandidate(evidence, book)
  const ledger = buildLedger(evidence, candidate, book)
  const serialized = `${JSON.stringify(ledger, null, 2)}\n`

  if (args.includes('--check')) {
    const current = existsSync(ledgerPath) ? readFileSync(ledgerPath, 'utf8') : ''
    if (current !== serialized) {
      console.error(
        'source_fidelity_ledger.json is stale; run node scripts/rebuild_fidelity_ledger.mjs',
      )
      process.exitCode = 1
      return
    }

    console.log('source fidelity ledger is fresh')
    return
  }

  writeFileSync(ledgerPath, serialized)
  console.log(
    `rebuilt source fidelity ledger: ${ledger.inventory.totalUnits} units, ${ledger.findings.length} findings`,
  )
}

function inspectCandidate(evidence, book) {
  assertRecord(evidence, 'Evidence record')
  assert(evidence.schemaVersion === 1, 'Evidence schemaVersion must be 1')
  assertNonEmptyString(evidence.auditRunId, 'Evidence auditRunId')
  assert(
    auditStates.has(evidence.auditState),
    `Evidence auditState must be one of: ${Array.from(auditStates).join(', ')}`,
  )
  assertRecord(evidence.candidate, 'Evidence candidate')
  assertRecord(evidence.candidate.pdf, 'Evidence candidate PDF')
  assertRecord(evidence.candidate.book, 'Evidence candidate book')
  assertRecord(evidence.candidate.runtime, 'Evidence candidate runtime')

  assertRecord(book, 'Book source')
  assert(book.schemaVersion === 1, 'Book schemaVersion must be 1')
  assert(Array.isArray(book.parts), 'Book parts must be an array')

  const manifest = parseManifest(readFileSync(manifestPath, 'utf8'))
  const runtimePath = resolve(publicPath, manifest.runtimePath)
  assert(
    runtimePath.startsWith(`${publicPath}/`),
    'Runtime payload path must stay under app/public',
  )
  const runtime = readJson(runtimePath)
  assertRecord(runtime, 'Runtime payload')
  assert(runtime.schemaVersion === 3, 'Runtime schemaVersion must be 3')
  assert(Array.isArray(runtime.chapters), 'Runtime chapters must be an array')

  const bookSourceContentHash = `sha256:${getContentHash(book.parts)}`
  const runtimeContentHash = `sha256:${getContentHash(runtime.chapters)}`
  const pdfSha256 = createHash('sha256')
    .update(readFileSync(pdfPath))
    .digest('hex')

  assert(
    runtime.sourceContentHash === bookSourceContentHash,
    'Runtime sourceContentHash does not match book.json',
  )
  assert(
    runtime.contentHash === runtimeContentHash,
    'Runtime contentHash does not match its chapters',
  )
  assert(
    manifest.contentHash === runtimeContentHash,
    'Chapter payload manifest content hash does not match runtime payload',
  )
  assertRuntimeSectionsMatchBook(runtime.chapters, book.parts)

  const actual = {
    pdf: {
      file: '100-endgames-you-must-know-2008.pdf',
      pageCount: evidence.candidate.pdf.pageCount,
      sha256: pdfSha256,
    },
    book: {
      file: 'book.json',
      sourceContentHash: bookSourceContentHash,
    },
    runtime: {
      path: manifest.runtimePath,
      schemaVersion: runtime.schemaVersion,
      sourceContentHash: runtime.sourceContentHash,
      contentHash: runtime.contentHash,
    },
  }

  assertPositiveInteger(actual.pdf.pageCount, 'Evidence candidate PDF pageCount')
  assertDeepEqual(
    evidence.candidate,
    actual,
    'Evidence candidate metadata is stale',
  )

  return actual
}

function buildLedger(evidence, candidate, book) {
  assert(Array.isArray(evidence.batches), 'Evidence batches must be an array')
  assert(Array.isArray(evidence.units), 'Evidence units must be an array')
  assert(Array.isArray(evidence.findings), 'Evidence findings must be an array')

  const partById = new Map(book.parts.map((part) => [part.id, part]))
  const unitById = validateUnits(evidence.units, candidate, partById)
  const findingById = validateFindings(evidence.findings, unitById)
  validateUnitFindingLinks(evidence.units, findingById)
  const batches = validateAndBuildBatches(evidence.batches, unitById)

  if (evidence.auditState === 'complete') {
    assert(
      batches.every(({ status }) => status === 'closed'),
      'A complete audit may not contain open batches',
    )
  }

  return {
    schemaVersion: 3,
    generatedFrom: 'source_fidelity_evidence.json',
    auditRunId: evidence.auditRunId,
    auditState: evidence.auditState,
    candidate,
    inventory: buildInventory(evidence.units),
    batches,
    units: evidence.units,
    findings: evidence.findings,
  }
}

function validateUnits(units, candidate, partById) {
  const unitById = new Map()
  const sourceItemIds = new Set()

  for (const [unitIndex, unit] of units.entries()) {
    const location = `Evidence unit ${unitIndex + 1}`
    assertRecord(unit, location)
    assertNonEmptyString(unit.id, `${location} id`)
    assert(!unitById.has(unit.id), `Duplicate evidence unit id: ${unit.id}`)
    unitById.set(unit.id, unit)

    assert(kindSet.has(unit.kind), `${location} has invalid kind: ${unit.kind}`)
    assertNonEmptyString(unit.unitType, `${location} unitType`)
    assertPositiveInteger(unit.pdfPage, `${location} pdfPage`)
    assert(
      unit.pdfPage <= candidate.pdf.pageCount,
      `${location} pdfPage exceeds the candidate PDF page count`,
    )
    validatePrintPageReference(unit, location)
    assertNonEmptyString(unit.chapter, `${location} chapter`)
    assertNonEmptyString(unit.sourceIdentifier, `${location} sourceIdentifier`)
    assertNonEmptyString(unit.appRoute, `${location} appRoute`)
    assert(
      unit.appRoute.startsWith('/book/'),
      `${location} appRoute must start with /book/`,
    )
    assert(
      Object.hasOwn(unit, 'appAnchor'),
      `${location} must record appAnchor, using null when not applicable`,
    )
    assert(
      unit.appAnchor === null || isNonEmptyString(unit.appAnchor),
      `${location} appAnchor must be null or a non-empty string`,
    )
    assertStringArray(unit.fieldsChecked, `${location} fieldsChecked`, false)
    assertNonEmptyString(
      unit.renderedPageEvidence,
      `${location} renderedPageEvidence`,
    )
    assert(
      classificationSet.has(unit.classification),
      `${location} has invalid classification: ${unit.classification}`,
    )
    assert(
      severities.has(unit.severity),
      `${location} has invalid severity: ${unit.severity}`,
    )
    assertStringArray(
      unit.regressionCoverage,
      `${location} regressionCoverage`,
      false,
    )

    validateComparisonResult(
      unit.transcriptionFidelity,
      transcriptionStatuses,
      `${location} transcriptionFidelity`,
    )
    validateComparisonResult(
      unit.chessLegality,
      chessLegalityStatuses,
      `${location} chessLegality`,
    )
    validatePostFixVerification(unit.postFixVerification, location)
    validateDispositionForClassification(
      unit.disposition,
      unit.classification,
      `${location} disposition`,
    )

    assert(
      Array.isArray(unit.curatedSourceLocations) &&
        unit.curatedSourceLocations.length > 0,
      `${location} curatedSourceLocations must not be empty`,
    )
    unit.curatedSourceLocations.forEach((sourceLocation, sourceLocationIndex) =>
      validateCuratedSourceLocation(
        sourceLocation,
        `${location} curatedSourceLocations[${sourceLocationIndex}]`,
        partById,
      ),
    )

    assert(
      Array.isArray(unit.sourceItems) && unit.sourceItems.length > 0,
      `${location} sourceItems must not be empty`,
    )
    for (const [sourceItemIndex, sourceItem] of unit.sourceItems.entries()) {
      const itemLocation = `${location} sourceItems[${sourceItemIndex}]`
      assertRecord(sourceItem, itemLocation)
      assertNonEmptyString(sourceItem.id, `${itemLocation} id`)
      assert(
        !sourceItemIds.has(sourceItem.id),
        `Duplicate source item id: ${sourceItem.id}`,
      )
      sourceItemIds.add(sourceItem.id)
      assertNonEmptyString(sourceItem.type, `${itemLocation} type`)
      assertStringArray(
        sourceItem.fieldsChecked,
        `${itemLocation} fieldsChecked`,
        false,
      )
      assertNonEmptyString(
        sourceItem.renderedPageEvidence,
        `${itemLocation} renderedPageEvidence`,
      )
      validateCuratedSourceLocation(
        sourceItem.curatedSourceLocation,
        `${itemLocation} curatedSourceLocation`,
        partById,
      )
    }

    validateDifferences(unit, location)
    validateUnitBookMapping(unit, location, partById)
    validateDiagramEvidence(unit, location, partById)

    assert(
      unit.findingId === undefined,
      `${location} must use findingIds instead of findingId`,
    )
    assertStringArray(unit.findingIds, `${location} findingIds`, true)
    assert(
      new Set(unit.findingIds).size === unit.findingIds.length,
      `${location} contains duplicate findingIds`,
    )

    if (unit.classification === 'matched') {
      assert(
        unit.findingIds.length === 0,
        `${location} matched units must not link findings`,
      )
      assert(
        unit.severity === 'none',
        `${location} matched units must use severity none`,
      )
      assert(
        unit.disposition.status === 'no-change',
        `${location} matched units must use a no-change disposition`,
      )
    } else {
      assert(
        unit.findingIds.length > 0,
        `${location} non-matched units must link at least one finding`,
      )
    }
  }

  return unitById
}

function validatePrintPageReference(unit, location) {
  const hasPrintPage = Object.hasOwn(unit, 'printPage')
  const hasPrintPageLabel = Object.hasOwn(unit, 'printPageLabel')

  assert(
    hasPrintPage !== hasPrintPageLabel,
    `${location} must record exactly one of printPage or printPageLabel`,
  )

  if (hasPrintPage) {
    assertPositiveInteger(unit.printPage, `${location} printPage`)
    return
  }

  assert(
    unit.printPageLabel === 'unnumbered',
    `${location} printPageLabel must be unnumbered`,
  )
}

function validateComparisonResult(value, allowedStatuses, location) {
  assertRecord(value, location)
  assert(
    allowedStatuses.has(value.status),
    `${location} has invalid status: ${value.status}`,
  )
  assertNonEmptyString(value.evidence, `${location} evidence`)
}

function validatePostFixVerification(value, location) {
  assertRecord(value, `${location} postFixVerification`)
  assertNonEmptyString(value.pdf, `${location} postFixVerification pdf`)
  assertNonEmptyString(
    value.runningApp,
    `${location} postFixVerification runningApp`,
  )
}

function validateDisposition(value, location) {
  assertRecord(value, location)
  assert(
    dispositionStatuses.has(value.status),
    `${location} has invalid status: ${value.status}`,
  )
  assertNonEmptyString(value.summary, `${location} summary`)
}

function validateDispositionForClassification(value, classification, location) {
  validateDisposition(value, location)
  const compatibleStatuses = compatibleDispositionStatuses.get(classification)
  assert(
    compatibleStatuses?.has(value.status),
    `${location} status ${value.status} is incompatible with classification ${classification}`,
  )
}

function validateDifferences(unit, location) {
  validateDifferenceRecords(unit.differences, `${location} differences`, true)

  if (unit.classification === 'matched') {
    assert(
      unit.differences.length === 0,
      `${location} matched units must not record differences`,
    )
  }
}

function validateDifferenceRecords(differences, location, allowEmpty) {
  assert(Array.isArray(differences), `${location} must be an array`)
  assert(allowEmpty || differences.length > 0, `${location} must not be empty`)
  const serializedDifferences = new Set()

  for (const [differenceIndex, difference] of differences.entries()) {
    const differenceLocation = `${location}[${differenceIndex}]`
    assertRecord(difference, differenceLocation)
    assertNonEmptyString(difference.field, `${differenceLocation} field`)
    assert(
      Object.hasOwn(difference, 'printedValue'),
      `${differenceLocation} must record printedValue`,
    )
    assert(
      Object.hasOwn(difference, 'appValue'),
      `${differenceLocation} must record appValue`,
    )
    const serialized = canonicalStringify(difference)
    assert(
      !serializedDifferences.has(serialized),
      `${location} contains duplicate difference records`,
    )
    serializedDifferences.add(serialized)
  }
}

function validateCuratedSourceLocation(value, location, partById) {
  assertRecord(value, location)
  assert(
    locationKinds.has(value.kind),
    `${location} has invalid kind: ${value.kind}`,
  )

  if (value.kind === 'book-section') {
    assertNonEmptyString(value.partId, `${location} partId`)
    assertNonNegativeInteger(value.sectionIndex, `${location} sectionIndex`)
    assertNonEmptyString(value.field, `${location} field`)
    const part = partById.get(value.partId)
    assert(part, `${location} points to missing book part ${value.partId}`)
    assert(
      part.sections[value.sectionIndex],
      `${location} points to missing section ${value.sectionIndex}`,
    )
    return
  }

  if (value.kind === 'app-source') {
    assertNonEmptyString(value.file, `${location} file`)
    assertNonEmptyString(value.symbol, `${location} symbol`)
    return
  }

  assertNonEmptyString(value.reason, `${location} reason`)
}

function validateUnitBookMapping(unit, location, partById) {
  if (unit.kind !== 'board' && unit.kind !== 'page-copy') {
    return
  }

  assertNonEmptyString(unit.partId, `${location} partId`)
  const part = partById.get(unit.partId)
  assert(part, `${location} points to missing book part ${unit.partId}`)
  assert(
    unit.appRoute === routeForPart(unit.partId),
    `${location} appRoute does not match part ${unit.partId}`,
  )

  if (unit.kind !== 'board') {
    return
  }

  assertNonEmptyString(unit.boardNumber, `${location} boardNumber`)
  assert(
    unit.appAnchor === `p${unit.boardNumber}`,
    `${location} appAnchor does not match boardNumber`,
  )
  const boardLocations = unit.curatedSourceLocations.filter(
    (sourceLocation) => sourceLocation.kind === 'book-section',
  )
  assert(
    boardLocations.length === 1,
    `${location} board units must point to exactly one book section`,
  )
  const boardSection = part.sections[boardLocations[0].sectionIndex]
  assert(
    ['diagram', 'position', 'problem'].includes(boardSection.type),
    `${location} points to a non-board section`,
  )
  assert(
    boardSection.content?.number === unit.boardNumber,
    `${location} points to the wrong board section`,
  )
  assert(
    unit.unitType === boardSection.type,
    `${location} unitType does not match book section type`,
  )
}

function validateDiagramEvidence(unit, location, partById) {
  if (unit.kind !== 'board') {
    assert(
      unit.diagramEvidence === undefined,
      `${location} non-board units must not record diagramEvidence`,
    )
    return
  }

  assertRecord(unit.diagramEvidence, `${location} diagramEvidence`)
  for (const field of [
    'appFen',
    'associationEvidence',
    'orientationEvidence',
    'overlayEvidence',
    'sideToMoveEvidence',
    'sourceFen',
    'squareMapEvidence',
  ]) {
    assertNonEmptyString(
      unit.diagramEvidence[field],
      `${location} diagramEvidence ${field}`,
    )
  }

  const bookLocation = unit.curatedSourceLocations.find(
    (sourceLocation) => sourceLocation.kind === 'book-section',
  )
  const board = partById.get(bookLocation.partId).sections[bookLocation.sectionIndex]
  assert(
    board.content.fen === unit.diagramEvidence.appFen,
    `${location} diagramEvidence appFen is stale relative to book.json`,
  )
}

function validateFindings(findings, unitById) {
  const findingById = new Map()

  for (const [findingIndex, finding] of findings.entries()) {
    const location = `Evidence finding ${findingIndex + 1}`
    assertRecord(finding, location)
    assertNonEmptyString(finding.id, `${location} id`)
    assert(!findingById.has(finding.id), `Duplicate finding id: ${finding.id}`)
    findingById.set(finding.id, finding)
    assert(
      classificationSet.has(finding.classification) &&
        finding.classification !== 'matched',
      `${location} must use a non-matched classification`,
    )
    assert(
      findingOrigins.has(finding.origin),
      `${location} has invalid origin: ${finding.origin}`,
    )
    assert(
      correctionCertainties.has(finding.correctionCertainty),
      `${location} has invalid correctionCertainty: ${finding.correctionCertainty}`,
    )
    assert(
      severities.has(finding.severity),
      `${location} has invalid severity: ${finding.severity}`,
    )
    assertNonEmptyString(finding.evidence, `${location} evidence`)
    validateDifferenceRecords(
      finding.differences,
      `${location} differences`,
      false,
    )
    assertNonEmptyString(finding.repair, `${location} repair`)
    assertStringArray(
      finding.regressionCoverage,
      `${location} regressionCoverage`,
      false,
    )
    validatePostFixVerification(finding.postFixVerification, location)
    assertStringArray(finding.unitIds, `${location} unitIds`, false)
    assert(
      new Set(finding.unitIds).size === finding.unitIds.length,
      `${location} contains duplicate unitIds`,
    )
    for (const unitId of finding.unitIds) {
      const unit = unitById.get(unitId)
      assert(unit, `${location} points to missing unit ${unitId}`)
    }
    validateDispositionForClassification(
      finding.disposition,
      finding.classification,
      `${location} disposition`,
    )
    validateFindingOrigin(finding, location)
  }

  return findingById
}

function validateFindingOrigin(finding, location) {
  const expectedOrigins = {
    'accepted-presentation-deviation': 'presentation',
    'app-defect': 'app',
    'book-error': 'book',
  }
  const expectedOrigin = expectedOrigins[finding.classification]
  if (expectedOrigin) {
    assert(
      finding.origin === expectedOrigin,
      `${location} classification ${finding.classification} requires origin ${expectedOrigin}`,
    )
  }

  if (finding.classification === 'book-error') {
    assert(
      finding.correctionCertainty === 'certain' ||
        finding.correctionCertainty === 'uncertain',
      `${location} book errors require certain or uncertain correction certainty`,
    )
  }
}

function validateUnitFindingLinks(units, findingById) {
  const unitById = new Map(units.map((unit) => [unit.id, unit]))

  for (const unit of units) {
    const linkedFindings = unit.findingIds.map((findingId) => {
      const finding = findingById.get(findingId)
      assert(finding, `${unit.id} points to missing finding ${findingId}`)
      assert(
        finding.unitIds.includes(unit.id),
        `${unit.id} is not linked back from finding ${findingId}`,
      )
      return finding
    })
    const primaryClassification = getPrimaryClassification(linkedFindings)
    assert(
      unit.classification === primaryClassification,
      `${unit.id} classification ${unit.classification} does not match primary linked classification ${primaryClassification}`,
    )
    const linkedDifferenceRecords = Array.from(
      new Map(
        linkedFindings
          .flatMap(({ differences }) => differences)
          .map((difference) => [canonicalStringify(difference), difference]),
      ).values(),
    )
    assertDeepEqual(
      unit.differences
        .map((difference) => canonicalStringify(difference))
        .sort(),
      linkedDifferenceRecords
        .map((difference) => canonicalStringify(difference))
        .sort(),
      `${unit.id} differences must equal its linked findings' exact differences`,
    )
  }

  for (const finding of findingById.values()) {
    for (const unitId of finding.unitIds) {
      const unit = unitById.get(unitId)
      assert(
        unit.findingIds.includes(finding.id),
        `${finding.id} is not linked back from unit ${unitId}`,
      )
    }
  }
}

function getPrimaryClassification(findings) {
  return findings.reduce(
    (primary, finding) =>
      classificationPriorities.get(finding.classification) >
      classificationPriorities.get(primary)
        ? finding.classification
        : primary,
    'matched',
  )
}

function validateAndBuildBatches(batches, unitById) {
  const batchIds = new Set()
  const assignedUnitIds = new Set()

  const normalized = batches.map((batch, batchIndex) => {
    const location = `Evidence batch ${batchIndex + 1}`
    assertRecord(batch, location)
    assertNonEmptyString(batch.id, `${location} id`)
    assert(!batchIds.has(batch.id), `Duplicate batch id: ${batch.id}`)
    batchIds.add(batch.id)
    assertNonEmptyString(batch.label, `${location} label`)
    assert(
      batchStates.has(batch.status),
      `${location} has invalid status: ${batch.status}`,
    )
    assertStringArray(batch.unitIds, `${location} unitIds`, true)
    assert(
      new Set(batch.unitIds).size === batch.unitIds.length,
      `${location} contains duplicate unitIds`,
    )

    const units = batch.unitIds.map((unitId) => {
      const unit = unitById.get(unitId)
      assert(unit, `${location} points to missing unit ${unitId}`)
      assert(
        !assignedUnitIds.has(unitId),
        `Evidence unit ${unitId} belongs to more than one batch`,
      )
      assignedUnitIds.add(unitId)
      return unit
    })

    return {
      ...batch,
      pdfPageRanges: toRanges(units.map(({ pdfPage }) => pdfPage)),
      unitCount: units.length,
      classificationCounts: countByValues(
        units.map(({ classification }) => classification),
        classifications,
      ),
    }
  })

  for (const unitId of unitById.keys()) {
    assert(assignedUnitIds.has(unitId), `Evidence unit ${unitId} has no batch`)
  }

  return normalized
}

function buildInventory(units) {
  return {
    totalUnits: units.length,
    pageCopyUnits: units.filter(({ kind }) => kind === 'page-copy').length,
    boardProblemDiagramUnits: units.filter(({ kind }) => kind === 'board').length,
    frontMatterUnits: units.filter(({ kind }) => kind === 'front-matter').length,
    blankUnits: units.filter(({ kind }) => kind === 'blank').length,
    coveredPdfPages: new Set(units.map(({ pdfPage }) => pdfPage)).size,
    pdfPageRanges: toRanges(units.map(({ pdfPage }) => pdfPage)),
    byKind: countByValues(
      units.map(({ kind }) => kind),
      kinds,
    ),
    byUnitType: countBy(units.map(({ unitType }) => unitType)),
    classifications: countByValues(
      units.map(({ classification }) => classification),
      classifications,
    ),
  }
}

function countBy(values) {
  return Object.fromEntries(
    Array.from(new Set(values))
      .sort((left, right) => left.localeCompare(right))
      .map((value) => [value, values.filter((candidate) => candidate === value).length]),
  )
}

function countByValues(values, allowedValues) {
  return Object.fromEntries(
    allowedValues.map((value) => [
      value,
      values.filter((candidate) => candidate === value).length,
    ]),
  )
}

function toRanges(values) {
  const pages = Array.from(new Set(values)).sort((left, right) => left - right)
  const ranges = []

  for (const page of pages) {
    const last = ranges.at(-1)
    if (last && page === last.last + 1) {
      last.last = page
    } else {
      ranges.push({ first: page, last: page })
    }
  }

  return ranges
}

function routeForPart(partId) {
  if (partId === 'introduction') return '/book/intro'
  if (partId === 'bibliography') return '/book/bibliography'
  if (/^(?:[1-9]|1[0-5])$/.test(partId)) return `/book/chapter${partId}`
  return '/book/about'
}

function assertRuntimeSectionsMatchBook(runtimeChapters, bookParts) {
  assert(
    runtimeChapters.length === bookParts.length,
    'Runtime chapter count does not match book parts',
  )

  for (const [partIndex, part] of bookParts.entries()) {
    const runtimeChapter = runtimeChapters[partIndex]
    assert(
      runtimeChapter?.id === part.id,
      `Runtime chapter ${partIndex + 1} does not match book part ${part.id}`,
    )
    assertDeepEqual(
      runtimeChapter.sections,
      part.sections,
      `Runtime sections are stale for book part ${part.id}`,
    )
  }
}

function parseManifest(value) {
  const contentHash = value.match(
    /chapterPayloadContentHash = '(sha256:[a-f0-9]{64})'/,
  )?.[1]
  const runtimePath = value.match(
    /chapterPayloadPath = '(app_x\/chapter-runtime\.[a-f0-9]{16}\.json)'/,
  )?.[1]
  assert(contentHash, 'Chapter payload manifest has no valid content hash')
  assert(runtimePath, 'Chapter payload manifest has no valid runtime path')
  return { contentHash, runtimePath }
}

function getContentHash(value) {
  return createHash('sha256').update(canonicalStringify(value)).digest('hex')
}

function canonicalStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${canonicalStringify(entryValue)}`,
      )
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`Could not read ${path}: ${error.message}`)
  }
}

function assertRecord(value, location) {
  assert(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    `${location} must be an object`,
  )
}

function assertStringArray(value, location, allowEmpty) {
  assert(Array.isArray(value), `${location} must be an array`)
  assert(allowEmpty || value.length > 0, `${location} must not be empty`)
  value.forEach((entry, index) =>
    assertNonEmptyString(entry, `${location}[${index}]`),
  )
}

function assertNonEmptyString(value, location) {
  assert(isNonEmptyString(value), `${location} must be a non-empty string`)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function assertPositiveInteger(value, location) {
  assert(
    typeof value === 'number' && Number.isInteger(value) && value > 0,
    `${location} must be a positive integer`,
  )
}

function assertNonNegativeInteger(value, location) {
  assert(
    typeof value === 'number' && Number.isInteger(value) && value >= 0,
    `${location} must be a non-negative integer`,
  )
}

function assertDeepEqual(actual, expected, message) {
  assert(canonicalStringify(actual) === canonicalStringify(expected), message)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export {
  getPrimaryClassification,
  validateDispositionForClassification,
  validatePrintPageReference,
  validateUnitFindingLinks,
}
