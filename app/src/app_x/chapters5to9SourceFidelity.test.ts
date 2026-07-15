import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { BookSource, RawChapterSection } from './chapterTypes'

type BoardContent = {
  caption?: string
  displayLabel?: string
  fen: string
  number: string
  orientation: string
  subtitle?: string
}

type FidelityUnit = {
  appSectionIndex?: number
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

const expectedBoards: Record<string, string[]> = {
  '5': [
    '5.1',
    '5.2',
    '5.3',
    'cutting-off-series-1',
    'cutting-off-series-2',
    'cutting-off-series-3',
    '5.4',
    '5.5',
    'kings-opposed-at-rear-1',
    'kings-opposed-at-rear-2',
    'kings-opposed-at-rear-3',
    '5.6',
    '5.7',
    '5.8',
    '5.9',
    '5.10',
    '5.11',
    '5.12',
    '5.13',
    '5.14',
    'lateral-push-1',
    'lateral-push-2',
    'lateral-push-3',
    '5.15',
  ],
  '6': [
    '6.1',
    '6.2',
    '6.3',
    'rook-vs-2-pawns-series-1',
    'rook-vs-2-pawns-series-2',
    'rook-vs-2-pawns-series-3',
    '6.4',
    '6.5',
    '6.6',
    '6.7',
  ],
  '7': numberedBoards('7', 6),
  '8': [
    '8.1',
    '8.2',
    '8.3',
    '8.4',
    '8.5',
    '8.6',
    '8.7a',
    'knight-blockades-series-1',
    'knight-blockades-series-2',
    'knight-blockades-series-3',
    '8.7b',
  ],
  '9': numberedBoards('9', 20),
}

const release = ledger.releases.find(({ id }) => id === 'chapters-5-9')
assert.ok(release, 'Expected Chapters 5–9 fidelity release')
assert.equal(release.status, 'matched')
assert.deepEqual(release.partIds, ['5', '6', '7', '8', '9'])
assert.equal(new Set(release.units.map(({ id }) => id)).size, release.units.length)
assert.equal(release.units.filter(({ kind }) => kind === 'page-copy').length, 55)
assert.equal(release.units.filter(({ kind }) => kind === 'board').length, 71)
assert.deepEqual(
  release.units
    .filter(({ kind }) => kind === 'page-copy')
    .map(({ pdfPage }) => pdfPage)
    .sort((a, b) => a - b),
  Array.from({ length: 55 }, (_, index) => 69 + index),
)

for (const [partId, expectedNumbers] of Object.entries(expectedBoards)) {
  const sourceBoards = getBoards(getPart(partId).sections)
  assert.deepEqual(
    sourceBoards.map(({ content }) => boardContent(content).number),
    expectedNumbers,
    `Unexpected board sequence in Chapter ${partId}`,
  )
  assert.deepEqual(
    release.units
      .filter((unit) => unit.kind === 'board' && unit.partId === partId)
      .map(({ boardNumber }) => boardNumber),
    expectedNumbers,
    `Unexpected ledger board sequence in Chapter ${partId}`,
  )
}

for (const unit of release.units) {
  assert.equal(unit.status, 'matched')
  if (unit.kind !== 'board') {
    continue
  }

  const section = getPart(unit.partId).sections[unit.appSectionIndex!]
  assert.ok(section, `${unit.id} points to a missing source section`)
  assert.equal(
    boardContent(section.content).number,
    unit.boardNumber,
    `${unit.id} points to the wrong board`,
  )
}

assert.equal(
  getBoard('8', 'knight-blockades-series-1').fen,
  '5nK1/4kP2/8/5B2/8/8/8/8 w - - 0 1',
)
assert.equal(
  getBoard('8', 'knight-blockades-series-2').fen,
  '4Kn2/5Pk1/8/5B2/8/8/8/8 w - - 0 1',
)
assert.equal(
  getBoard('9', '9.18').fen,
  '2b5/8/1P1B4/8/4kP2/8/5K2/8 b - - 0 1',
)
assert.equal(
  getBoard('9', '9.20').fen,
  '8/b7/P7/3Bk3/2K1P3/8/8/8 w - - 0 1',
)

for (const [partId, number, displayLabel] of [
  ['5', '5.10', 'Analysis diagram 5.10'],
  ['6', '6.7', 'Analysis diagram 6.7'],
  ['8', '8.6', 'Analysis diagram 8.6'],
  ['9', '9.8', 'Analysis diagram 9.8'],
  ['9', '9.13', 'Analysis diagram 9.13'],
  ['9', '9.14', 'Analysis diagram 9.14'],
] as const) {
  const board = getBoard(partId, number)
  assert.equal(board.displayLabel, displayLabel)
  assert.equal(board.caption, undefined)
}

assert.equal(getBoard('8', '8.7a').displayLabel, 'Position 8.7')
assert.equal(getBoard('8', '8.7b').displayLabel, 'Position 8.7')
assert.equal(getBoard('9', '9.10').displayLabel, 'Position 9.1')
assert.equal(getBoard('9', '9.20').displayLabel, 'Position 9.2')

for (const [partId, number, subtitle, caption] of [
  ['6', '6.6', 'Lariño - Picazo', 'La Roda, 2006'],
  ['7', '7.5', 'Kurajica - Markland', 'Hastings, 1971'],
  ['8', '8.5', 'Stein - Dorfman', 'USSR, 1970'],
  ['9', '9.12', 'Berger - Kotlerman', 'Arkhangelsk 1948'],
] as const) {
  const board = getBoard(partId, number)
  assert.equal(board.subtitle, subtitle)
  assert.equal(board.caption, caption)
}

const chapterSevenText = textualContent(getPart('7').sections)
assert.equal(chapterSevenText.includes('arise with reasonably frequency.'), true)
assert.equal(chapterSevenText.includes('arise with reasonable frequency.'), false)

const chapterNineText = textualContent(getPart('9').sections)
assert.equal(
  chapterNineText.includes(
    'the right positional for the defending bishop is given.',
  ),
  true,
)
assert.equal(
  chapterNineText.includes('the right position for the defending bishop is given.'),
  false,
)

replay(getBoard('9', '9.18').fen, [
  'Bb7',
  'Kg3',
  'Kf5',
  'Kh4',
  'Kg6',
  'Kg4',
  'Bc8+',
  'Kf3',
  'Bb7+',
  'Ke3',
  'Kf5',
  'Kd4',
  'Ke6',
  'Be5',
  'Kf5',
  'Kc5',
  'Ke6',
])
replay(getBoard('9', '9.20').fen, [
  'Kd3',
  'Kf4',
  'Ke2',
  'Bb6',
  'Kf1',
  'Ba7',
  'Kg2',
  'Bb6',
  'Kh3',
  'Bf2',
  'Bb7',
  'Kg5',
  'Bc6',
  'Kf4',
  'Bd5',
])

console.log('Chapters 5–9 source fidelity audit passed')

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
  const section = getBoards(getPart(partId).sections).find(
    ({ content }) => boardContent(content).number === number,
  )
  assert.ok(section, `Expected board ${number}`)
  return boardContent(section.content)
}

function boardContent(content: unknown) {
  assert.ok(content && typeof content === 'object' && !Array.isArray(content))
  return content as BoardContent
}

function textualContent(sections: RawChapterSection[]) {
  return sections
    .filter(({ content }) => typeof content === 'string')
    .map(({ content }) => content as string)
    .join('\n')
}

function replay(fen: string, sans: string[]) {
  const chess = new Chess(fen)
  for (const san of sans) {
    assert.ok(chess.move(san, { strict: false }), `Illegal source move: ${san}`)
  }
}
