import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { BookSource, RawChapterSection } from './chapterTypes'

type FidelityUnit = {
  appSectionIndex?: number
  appSectionIndexes?: number[]
  boardNumber?: string
  id: string
  kind: 'board' | 'page-copy'
  partId: string
  pdfPage: number
  status: string
}

type FidelityLedger = {
  releases: Array<{
    id: string
    partIds?: string[]
    status: string
    units: FidelityUnit[]
  }>
  schemaVersion: number
}

type ExtractionRow = {
  chapter: number
  fen?: string
  number: string
  status: string
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const ledger = JSON.parse(
  readFileSync(
    new URL('./pdf/source_fidelity_ledger.json', import.meta.url),
    'utf8',
  ),
) as FidelityLedger
const extractionRows = JSON.parse(
  readFileSync(
    new URL('./pdf/diagram_extraction_report.json', import.meta.url),
    'utf8',
  ),
) as ExtractionRow[]

const expectedBoards: Record<string, string[]> = {
  introduction: [
    'intro-rook-mobility',
    'intro-bishop-mobility',
    'intro-queen-mobility',
    'intro-knight-mobility',
    'intro-knight-routes',
    'intro-king-routes',
    'intro-knight-domination',
    'I.1',
    'I.2',
    'I.3',
    'I.4',
    'I.5',
    'I.6',
  ],
  '1': numberedBoards('1', 25),
  '2': Array.from(
    { length: 26 },
    (_, index) => `2.${String(index + 1).padStart(2, '0')}`,
  ),
  '3': numberedBoards('3', 10),
  '4': numberedBoards('4', 13),
}

const release = ledger.releases.find(
  ({ id }) => id === 'introduction-chapters-1-4',
)
assert.ok(release, 'Expected Introduction–Chapter 4 fidelity release')
assert.equal(release.status, 'matched')
assert.deepEqual(release.partIds, ['introduction', '1', '2', '3', '4'])
assert.equal(new Set(release.units.map(({ id }) => id)).size, release.units.length)
assert.equal(release.units.filter(({ kind }) => kind === 'page-copy').length, 58)
assert.equal(release.units.filter(({ kind }) => kind === 'board').length, 87)
assert.deepEqual(
  release.units
    .filter(({ kind }) => kind === 'page-copy')
    .map(({ pdfPage }) => pdfPage)
    .sort((a, b) => a - b),
  [
    ...Array.from({ length: 17 }, (_, index) => 10 + index),
    ...Array.from({ length: 41 }, (_, index) => 28 + index),
  ],
)

for (const [partId, expectedNumbers] of Object.entries(expectedBoards)) {
  const part = getPart(partId)
  const sourceBoards = getBoards(part.sections)
  assert.deepEqual(
    sourceBoards.map((section) => boardContent(section).number),
    expectedNumbers,
    `Unexpected board sequence in ${partId}`,
  )
  assert.deepEqual(
    release.units
      .filter((unit) => unit.kind === 'board' && unit.partId === partId)
      .map(({ boardNumber }) => boardNumber),
    expectedNumbers,
    `Unexpected ledger board sequence in ${partId}`,
  )
}

for (const unit of release.units) {
  assert.equal(unit.status, 'matched')
  const part = getPart(unit.partId)
  const sectionIndexes = [
    ...(unit.appSectionIndexes ?? []),
    ...(unit.appSectionIndex === undefined ? [] : [unit.appSectionIndex]),
  ]
  for (const sectionIndex of sectionIndexes) {
    assert.ok(
      part.sections[sectionIndex],
      `${unit.id} points to missing section ${sectionIndex}`,
    )
  }
  if (unit.kind === 'board') {
    assert.equal(
      boardContent(part.sections[unit.appSectionIndex!]).number,
      unit.boardNumber,
      `${unit.id} points to the wrong board section`,
    )
  }
}

const kingRoutes = boardContent(getBoard('introduction', 'intro-king-routes'))
assert.deepEqual(kingRoutes.routes, [
  {
    meaning: 'Direct route from a4 to h4 as printed',
    squares: ['a4', 'h4'],
  },
  {
    meaning: 'Upper extreme route from a4 to h4 as printed',
    squares: ['a4', 'd7', 'e7', 'h4'],
  },
  {
    meaning: 'Lower extreme route from a4 to h4 as printed',
    squares: ['a4', 'd1', 'e1', 'h4'],
  },
])

const positionOneSixteen = boardContent(getBoard('1', '1.16'))
assert.equal(positionOneSixteen.fen, '8/8/8/p7/8/1k6/3K4/8 w - - 0 1')
assert.deepEqual(markerSquares(positionOneSixteen), ['c2', 'c1'])
replay(positionOneSixteen.fen, [
  'Kc1',
  'Ka2',
  'Kc2',
  'a4',
  'Kc1',
  'a3',
  'Kc2',
  'Ka1',
  'Kc1',
])

const problemTwoTwenty = boardContent(getBoard('2', '2.20'))
assert.equal(
  problemTwoTwenty.fen,
  '1r6/8/8/8/1P1k4/K7/8/7R w - - 0 1',
)
replay(problemTwoTwenty.fen, ['Rh5'])

const chapterThreeText = getPart('3').sections
  .map(textualContent)
  .join('\n')
assert.equal(
  chapterThreeText.includes(
    'the essential (and solid) part of the barrier are the d2-e2-e3-e4-squares',
  ),
  true,
)
assert.equal(
  chapterThreeText.includes(
    'the essential (and solid) part of the barrier is the d2-e2-e3-e4-squares',
  ),
  false,
)

for (const partId of ['1', '3', '4']) {
  for (const board of getBoards(getPart(partId).sections)) {
    const content = boardContent(board)
    const extraction = extractionRows.find(
      ({ chapter, number }) => String(chapter) === partId && number === content.number,
    )
    assert.ok(extraction, `Expected extraction provenance for ${content.number}`)
    assert.equal(extraction.status, 'promoted')
    assert.equal(extraction.fen, content.fen)
  }
}

console.log('Introduction and Chapters 1–4 source fidelity audit passed')

function numberedBoards(chapter: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${chapter}.${index + 1}`)
}

function getPart(id: string) {
  const part = book.parts.find((candidate) => candidate.id === id)
  assert.ok(part, `Expected source part ${id}`)
  return part
}

function getBoards(sections: RawChapterSection[]) {
  return sections.filter((section) =>
    ['diagram', 'position', 'problem'].includes(section.type),
  )
}

function getBoard(partId: string, number: string) {
  const board = getBoards(getPart(partId).sections).find(
    (section) => boardContent(section).number === number,
  )
  assert.ok(board, `Expected board ${number}`)
  return board
}

function boardContent(section: RawChapterSection) {
  assert.ok(
    section.content &&
      typeof section.content === 'object' &&
      !Array.isArray(section.content),
  )
  return section.content as {
    fen: string
    markers?: Array<{ square: string }>
    number: string
    routes?: Array<{ meaning: string; squares: string[] }>
  }
}

function markerSquares(content: ReturnType<typeof boardContent>) {
  return (content.markers ?? []).map(({ square }) => square)
}

function textualContent(section: RawChapterSection) {
  if (typeof section.content === 'string') {
    return section.content
  }
  if (
    section.content &&
    typeof section.content === 'object' &&
    !Array.isArray(section.content)
  ) {
    return Object.values(section.content)
      .filter((value): value is string => typeof value === 'string')
      .join('\n')
  }
  return ''
}

function replay(fen: string, sans: string[]) {
  const chess = new Chess(fen)
  for (const san of sans) {
    assert.ok(chess.move(san, { strict: false }), `Illegal source move: ${san}`)
  }
}
