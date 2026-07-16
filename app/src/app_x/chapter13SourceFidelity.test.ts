import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { BookSource, RawChapterSection } from './chapterTypes'

type ExtractionRow = {
  chapter: number
  fen?: string
  number: string
  status: string
}

type FidelityLedger = {
  releases: Array<{
    chapterId: string
    status: string
    units: Array<{
      appSectionIndex?: number
      appSectionIndexes?: number[]
      boardNumber?: string
      id: string
      kind: 'board' | 'page-copy'
      pdfPage: number
      status: string
    }>
  }>
  schemaVersion: number
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const extractionRows = JSON.parse(
  readFileSync(
    new URL('./pdf/diagram_extraction_report.json', import.meta.url),
    'utf8',
  ),
) as ExtractionRow[]
const fidelityLedger = JSON.parse(
  readFileSync(
    new URL('./pdf/source_fidelity_ledger.json', import.meta.url),
    'utf8',
  ),
) as FidelityLedger
const chapter = book.parts.find(({ id }) => id === '13')

assert.ok(chapter, 'Expected Chapter 13 source')
assert.equal(fidelityLedger.schemaVersion, 1)

const fidelityRelease = fidelityLedger.releases.find(
  ({ chapterId }) => chapterId === '13',
)
assert.ok(fidelityRelease, 'Expected Chapter 13 fidelity ledger release')
assert.equal(fidelityRelease.status, 'matched')
assert.equal(
  new Set(fidelityRelease.units.map(({ id }) => id)).size,
  fidelityRelease.units.length,
  'Fidelity ledger unit ids must be unique',
)
assert.deepEqual(
  fidelityRelease.units
    .filter(({ kind }) => kind === 'page-copy')
    .map(({ pdfPage }) => pdfPage),
  Array.from({ length: 25 }, (_, index) => 205 + index),
)

const boards = chapter.sections.filter(
  (section) => section.type === 'diagram' || section.type === 'position',
)
assert.deepEqual(
  boards.map((section) => boardContent(section).number),
  Array.from({ length: 30 }, (_, index) => `13.${index + 1}`),
)
assert.deepEqual(
  fidelityRelease.units
    .filter(({ kind }) => kind === 'board')
    .map(({ boardNumber }) => boardNumber),
  Array.from({ length: 30 }, (_, index) => `13.${index + 1}`),
)
for (const unit of fidelityRelease.units) {
  assert.equal(unit.status, 'matched')
  for (const sectionIndex of [
    ...(unit.appSectionIndexes ?? []),
    ...(unit.appSectionIndex === undefined ? [] : [unit.appSectionIndex]),
  ]) {
    assert.ok(
      chapter.sections[sectionIndex],
      `Fidelity unit ${unit.id} points to missing section ${sectionIndex}`,
    )
  }
}

const chapterExtractionRows = extractionRows.filter(({ chapter }) => chapter === 13)
assert.equal(chapterExtractionRows.length, 30)
for (const board of boards) {
  const content = boardContent(board)
  const extraction = chapterExtractionRows.find(
    ({ number }) => number === content.number,
  )
  assert.ok(extraction, `Expected extraction provenance for ${content.number}`)
  assert.equal(extraction.status, 'promoted')
  assert.equal(extraction.fen, content.fen)
}

const sourceText = chapter.sections
  .map((section) => textualContent(section))
  .filter(Boolean)
  .join('\n')

assert.equal(sourceText.includes('See Position 13.22. 13.3.'), false)
assert.equal(sourceText.includes('See Position 13.3.'), true)
assert.equal(sourceText.includes('avoiding the g5- and f7-squares'), false)
assert.equal(sourceText.includes('avoiding the g8- and f7-squares'), true)
assert.equal(sourceText.includes('Muller & Lamprecht'), false)
assert.equal(sourceText.includes('Müller & Lamprecht'), true)
assert.equal(sourceText.includes('4.Qe3 Kb5'), false)
assert.equal(sourceText.includes('9.Qd4 Kb5'), false)
assert.equal(sourceText.includes('4.Qe3 Kb8'), true)
assert.equal(sourceText.includes('9.Qd4 Kb8'), true)
assert.equal(sourceText.includes('Here we are very likely to waste moves'), true)
assert.equal(sourceText.includes("Here we're very likely to waste moves"), false)
assert.equal(sourceText.includes('8.Kd5 Kc7 9.Bc5'), true)
assert.equal(sourceText.includes('8.Kd5 Kc7 9.Kc5'), false)
assert.equal(sourceText.includes('answer ...Kd7 with Bd6'), true)
assert.equal(sourceText.includes('answer...Kd7 with Bd6'), false)
assert.equal(
  sourceText.includes('10...Rf1!\nBlack has to be ready'),
  true,
  'PDF 214 / printed 213 includes the standalone 10...Rf1! main-line move.',
)
assert.equal(
  sourceText.includes('13.Kb6 Rc1! 14.Be6\nRb1+'),
  true,
  'PDF 214 / printed 213 prints a bishop move, 14.Be6.',
)
assert.equal(sourceText.includes('13.Kb6 Rc1! 14.Ke6\nRb1+'), false)
assert.equal(
  sourceText.includes('6.Be6 (posing a mating threat) 6...Rd3+ 7.Bd5'),
  true,
  'PDF 212 / printed 211 prints bishop moves 6.Be6 and 7.Bd5.',
)
assert.equal(
  sourceText.includes('(11...Rd3 12.Ra4+-) 12.Bc4!+-'),
  true,
  'PDF 212 / printed 211 prints 12.Bc4!, not a king move.',
)
assert.equal(sourceText.includes('6.Ke6 (posing a mating threat)'), false)
assert.equal(sourceText.includes('6...Rd3+ 7.Kd5'), false)
assert.equal(sourceText.includes('12.Kc4!+-'), false)
assert.equal(sourceText.includes('6.Rb4 (threatening Be6)'), true)
assert.equal(sourceText.includes('8.Ba4! (another great move'), true)
assert.equal(sourceText.includes('Black is defenceless against Bd7'), true)
assert.equal(sourceText.includes('11.Rb4 (threatening Be6'), true)
assert.equal(
  sourceText.includes('32...Kh6 33.Be4 Rg5'),
  true,
  'PDF 217 / printed 216 prints 33.Be4.',
)
assert.equal(
  sourceText.includes('39.Rd6+ Ke7\n40.Re6+ Kf7'),
  true,
  'PDF 217 / printed 216 prints 40.Re6+.',
)
assert.equal(sourceText.includes('32...Kh6 33.Ke4 Rg5'), false)
assert.equal(sourceText.includes('40.Be6+ Kf7'), false)
assert.equal(
  sourceText.includes('37.Rd1 Rg2 38.Rd7+ Kf6'),
  true,
  'PDF 217 / printed 216 visibly prints the Ending 95 regression move 38.Rd7+.',
)
assert.equal(
  sourceText.includes('14.Kf3?! Rxg3+=.\n14...Kd1\nThe king may move'),
  true,
  'PDF 219 / printed 218 includes the standalone 14...Kd1 main-line move.',
)
assert.equal(
  sourceText.includes('21.Rf4 Ra2 22.Re4 Rc2'),
  true,
  'PDF 220 / printed 219 prints 22.Re4 without a capture.',
)
assert.equal(sourceText.includes('22.Rxe4 Rc2'), false)

assert.deepEqual(
  chapter.sections
    .filter(({ type }) => type === 'heading')
    .map(({ content }) => content),
  [
    'Rook + Bishop vs. Rook',
    'Philidor Position',
    'Same position shifted one file to the left (Lolli)',
    "Same position, knight's file (Lolli)",
    "Same position, rook's file",
    'Pawn on the 6th rank',
    'Pawn on the 5th rank',
    'Pawn on the 4th rank',
    'The winning manoeuvre',
    'The defensive set-up',
    'Summary: Queen vs. Rook + Pawn (from b- to g-file)',
  ],
)

const positionThirteenTwenty = boardContent(getBoard('13.20'))
assert.deepEqual(
  markerSquares(positionThirteenTwenty),
  ['a2', 'b3', 'c4', 'e6'],
)
assert.deepEqual(boardContent(getBoard('13.5')).routes, [
  {
    squares: ['c7', 'd5', 'e7', 'f5', 'g7'],
    meaning: "Knight's V/W route as printed",
  },
])
assert.equal(
  boardContent(getBoard('13.4')).fen,
  '8/8/8/8/4k3/8/6K1/6BN w - - 0 1',
)
replay(boardContent(getBoard('13.4')).fen, [
  'Kg3',
  'Ke5',
  'Kf3',
  'Kd5',
  'Kf4',
  'Kd6',
  'Ke4',
  'Kc6',
  'Ng3',
  'Kd6',
  'Nf5+',
  'Kc6',
  'Ke5',
  'Kd7',
  'Kd5',
  'Kc7',
  'Bc5',
  'Kb7',
  'Kd6',
  'Kb8',
  'Kc6',
  'Ka8',
  'Nd6',
  'Kb8',
  'Nb5',
  'Ka8',
  'Nc7+',
  'Kb8',
  'Bd4',
])
assert.deepEqual(
  [
    boardContent(getBoard('13.12')).subtitle,
    boardContent(getBoard('13.12')).caption,
    boardContent(getBoard('13.16')).subtitle,
    boardContent(getBoard('13.16')).caption,
  ],
  [
    'Budnikov - Novik',
    'Moscow 1991',
    'García González - Balashov',
    'Leningrad 1977',
  ],
)

const endingHundredMainLine = [
  'Kc4',
  'Ka7',
  'Qf7+',
  'Rb7',
  'Qf2+',
  'Ka8',
  'Qe3',
  'Kb8',
  'Kc5',
  'Ka7',
  'Kc6+',
  'Ka8',
  'Qe8+',
  'Ka7',
  'Qe3+',
  'Ka8',
  'Qd4',
  'Kb8',
  'Qh8+',
  'Ka7',
  'Qd8',
  'Rb5',
  'Qc8',
  'Rb6+',
  'Kc7',
  'Rb5',
]
const endingHundredChess = new Chess(boardContent(getBoard('13.29')).fen)
for (const san of endingHundredMainLine) {
  assert.ok(
    endingHundredChess.move(san, { strict: false }),
    `Ending 100 contains an illegal main-line move: ${san}`,
  )
}

console.log('Chapter 13 source fidelity audit passed')

function getBoard(number: string) {
  const board = boards.find((section) => boardContent(section).number === number)
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
    caption?: string
    fen: string
    markers?: Array<{ square: string }>
    number: string
    routes?: Array<{ meaning: string; squares: string[] }>
    subtitle?: string
  }
}

function markerSquares(content: ReturnType<typeof boardContent>) {
  return (content.markers ?? []).map(({ square }) => square)
}

function replay(fen: string, sans: string[]) {
  const chess = new Chess(fen)
  for (const san of sans) {
    assert.ok(chess.move(san, { strict: false }), `Illegal source move: ${san}`)
  }
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
