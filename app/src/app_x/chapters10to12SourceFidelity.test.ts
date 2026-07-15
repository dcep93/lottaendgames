import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { BookSource, RawChapterSection } from './chapterTypes'

type BoardContent = {
  caption?: string
  displayLabel?: string
  fen: string
  label?: string
  markers?: Array<{
    meaning: string
    square: string
    symbol: string
    variant?: string
  }>
  number: string
  orientation?: string
  routes?: Array<{
    meaning: string
    squares: string[]
    style?: string
  }>
  subtitle?: string
}

type FidelityLedger = {
  releases: Array<{
    id: string
    partIds?: string[]
    status: string
    units: Array<{
      appSectionIndex?: number
      boardNumber?: string
      id: string
      kind: 'board' | 'page-copy'
      partId: string
      pdfPage: number
      status: string
    }>
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
  '10': numberedBoards('10', 27),
  '11': [
    '11.1',
    '11.2',
    '11.3',
    '11.4',
    '11.5',
    '11.series.6.1',
    '11.series.6.2',
    '11.series.6.3',
    '11.series.5.1',
    '11.series.5.2',
    '11.series.5.3',
    '11.series.4.1',
    '11.series.4.2',
    '11.series.4.3',
    '11.6',
    '11.7',
    '11.8',
    '11.9',
    '11.10',
    '11.11',
    '11.12',
    '11.13',
    '11.14',
  ],
  '12': [
    ...numberedBoards('12', 12),
    '12.12-route-counts',
    ...Array.from({ length: 30 }, (_, index) => `12.${index + 13}`),
  ],
}

const release = ledger.releases.find(({ id }) => id === 'chapters-10-12')
assert.ok(release, 'Expected Chapters 10–12 fidelity release')
assert.equal(release.status, 'matched')
assert.deepEqual(release.partIds, ['10', '11', '12'])
assert.equal(new Set(release.units.map(({ id }) => id)).size, release.units.length)
assert.equal(release.units.filter(({ kind }) => kind === 'page-copy').length, 81)
assert.equal(release.units.filter(({ kind }) => kind === 'board').length, 93)
assert.deepEqual(
  release.units
    .filter(({ kind }) => kind === 'page-copy')
    .map(({ pdfPage }) => pdfPage)
    .sort((a, b) => a - b),
  Array.from({ length: 81 }, (_, index) => 124 + index),
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
  assert.equal(boardContent(section.content).number, unit.boardNumber)
}

assert.equal(
  getBoard('10', '10.11').fen,
  '1r6/R3K1k1/4P3/8/8/8/8/8 w - - 0 1',
)
assert.equal(
  getBoard('11', '11.4').fen,
  '6k1/1R6/5P1P/6K1/8/8/8/r7 b - - 0 1',
)
assert.equal(
  getBoard('11', '11.12').fen,
  '8/4r3/8/5K2/2Pk4/3P3R/8/8 w - - 0 1',
)
assert.equal(getBoard('11', '11.13').displayLabel, 'Position 11.12')
assert.equal(
  getBoard('12', '12.35').fen,
  '8/8/8/1p2kPp1/6P1/4K3/8/8 b - - 0 1',
)

for (const [partId, number, displayLabel] of [
  ['10', '10.7', 'Analysis diagram 10.7'],
  ['10', '10.8', 'Analysis diagram 10.8'],
  ['10', '10.10', 'Analysis diagram 10.10'],
  ['10', '10.12', 'Analysis diagram 10.12'],
  ['10', '10.14', 'Analysis diagram 10.14'],
  ['10', '10.25', 'Analysis diagram 10.25'],
  ['11', '11.2', 'Analysis diagram 11.2'],
  ['11', '11.8', 'Analysis diagram 11.8'],
  ['12', '12.14', 'Analysis diagram 12.14'],
  ['12', '12.21', 'Analysis diagram 12.21'],
  ['12', '12.26', 'Analysis diagram 12.26'],
  ['12', '12.27', 'Analysis diagram 12.27'],
  ['12', '12.28', 'Analysis diagram 12.28'],
] as const) {
  const board = getBoard(partId, number)
  assert.equal(board.displayLabel, displayLabel)
  assert.equal(board.caption, undefined)
}

for (const [partId, number, subtitle, caption] of [
  ['11', '11.3', 'Kolesnikov - Bocharov', 'Sochi 2004'],
  ['11', '11.6', 'Gligoric - Smyslov', 'Moscow, 1947'],
  ['12', '12.11', undefined, 'Duras, 1905'],
  ['12', '12.12', "Réti's study", 'Réti'],
  ['12', '12.13', 'Ljubojevic - Browne', 'Amsterdam 1972'],
] as const) {
  const board = getBoard(partId, number)
  assert.equal(board.subtitle, subtitle)
  assert.equal(board.caption, caption)
}

assert.deepEqual(markerSquares(getBoard('10', '10.24')), [
  'e6',
  'f5',
  'g5',
  'h5',
  'f4',
  'g4',
  'h4',
  'e3',
  'g3',
  'h3',
  'd2',
  'e2',
  'f2',
  'g2',
  'h2',
])
assert.deepEqual(
  getBoard('12', '12.5').markers?.slice(-2),
  [
    { square: 'd7', symbol: '●', meaning: 'reserved square' },
    { square: 'f4', symbol: '●', meaning: 'reserved square' },
  ],
)
assert.deepEqual(getBoard('12', '12.8').routes, [
  {
    meaning: "White king's successful route as printed",
    squares: ['h4', 'e1', 'b4'],
    style: 'arrow',
  },
])
assert.deepEqual(getBoard('12', '12.18').routes, [
  {
    meaning: "Black king's route to the collision line",
    squares: ['b4', 'f8'],
    style: 'arrow',
  },
  {
    meaning: "White king's route to the collision line",
    squares: ['h5', 'g6'],
    style: 'arrow',
  },
])
assert.deepEqual(getBoard('12', '12.33').routes, [
  {
    meaning: 'floating square as printed',
    squares: ['a6', 'e6', 'e2', 'a2', 'a6'],
    style: 'outline',
  },
])

const routeCounts = getBoard('12', '12.12-route-counts')
assert.equal(routeCounts.label, "King's multiple routes")
assert.equal(routeCounts.markers?.length, 18)
assert.deepEqual(
  routeCounts.markers
    ?.filter(({ variant }) => variant === 'emphasis')
    .map(({ square, symbol }) => [square, symbol]),
  [
    ['g7', '1'],
    ['d6', '9'],
    ['f6', '1'],
    ['e5', '1'],
  ],
)

const chapterTenText = textualContent(getPart('10').sections)
assertIncludesAll(chapterTenText, [
  '1.Ra1? Rb7+!',
  '1...Rc8',
  '1...Rg8',
  '1...Ke7?',
  '1...Rc8+ 2.Kd5 Rd8+ 3.Kc6!',
  '2.Rf7 Ra3+',
  '11.Kd4 Rf6',
])
assertExcludesAll(chapterTenText, [
  '1...Ra1? Rb7+!',
  '2.Kf7 Ra3+',
  '11.Kd4 Rf5',
])

const chapterElevenText = textualContent(getPart('11').sections)
assertIncludesAll(chapterElevenText, [
  '3.Kc6 (intending Kd6)',
  '1...Rg1+ 2.Kf6',
  '2...Rh1\n2...Rf1',
  '6.Ke6 Kxh6',
  '11.Rd5 Rf1',
  '17...Kh7!',
  '18.Rd6 Ra2',
  '22.f5 Re2+',
  '25...Rb8',
  '4.Kf5 Ra5+=',
  '1.Re4 Rb6',
  '3.fxe6 Kxe6',
])
assertExcludesAll(chapterElevenText, [
  '3.Kh6 (intending Kd6)',
  '1...Kg1+ 2.Kf6',
  '11.Rd5 Kf1',
  '18.Rd6 Ka2',
  '4.Kf5 Ka5+=',
  '1.Re4 Kb6',
])

const chapterTwelveText = textualContent(getPart('12').sections)
assertIncludesAll(chapterTwelveText, [
  '9.b8=Q+ Kxb8',
  '6...Kxb7',
  '4.Kf3 Kxa5',
  '10.Kxb6',
  '3.Kxe6 1-0',
  '4...Kxg3',
  '2...Kxf4',
  '4...Kc6!',
  '4.Kg6 Kxd5 5.Kxh6',
  '1...Kxb4 2.Ke5 Kxb3',
  '5...Kc6 6.Kc4!',
  '2...Kd5 3.d4',
  '3.Kd3! Kxa4',
  '1...h6 is also a draw',
  '3.Kb4+- d4 4.Kxa4',
  '1...axb6 (1...cxb6',
])
assertExcludesAll(chapterTwelveText, [
  '9.b8=Q+ Kb8',
  '4.Kf3 Ka5',
  '3.Ke6 1-0',
  '4...Kg3',
  '2...Kf4 (2...Ke3',
  '5.Kc6 6.Kc4!',
  '2.Kd5 3.d4',
  '3.Kd3! Ka4',
  'Here 1.h6 is also a draw',
  '3.Kb4+- 3...d4 4.Ka4',
  '1.axb6 (1.cxb6',
])

replay(getBoard('10', '10.11').fen, [
  'Kd6+',
  'Kf6',
  'Kd7',
  'Kg7',
  'Ke7',
  'Kg6',
  'Ra1',
  'Rb7+',
  'Kd8',
  'Rb8+',
])
replay(getBoard('11', '11.4').fen, [
  'Rg1+',
  'Kf5',
  'Rf1+',
  'Ke6',
  'Re1+',
  'Kd6',
  'Rd1+',
  'Ke7',
  'Re1+',
  'Kd8',
  'Rd1+',
  'Ke8',
  'Re1+',
  'Re7',
  'Rf1',
  'f7+',
  'Kh8',
  'Re6',
])
replay(getBoard('12', '12.1').fen, [
  'Kc3',
  'Kc7',
  'Kd4',
  'Kb6',
  'Kc4',
  'Kc7',
  'Kc5',
  'Kb7',
  'b6',
  'Ka6',
  'b7',
  'Kxb7',
  'Kb5',
])
replay(getBoard('12', '12.35').fen, [
  'Kd5',
  'Kd3',
  'Ke5',
  'Kc3',
  'Kd5',
  'Kb4',
  'Kc6',
  'Ka5',
  'Kc5',
  'f6',
  'Kd6',
  'Kxb5',
  'Ke6',
  'Kc5',
  'Kxf6',
  'Kd5',
])

console.log('Chapters 10–12 source fidelity audit passed')

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

function markerSquares(content: BoardContent) {
  return (content.markers ?? []).map(({ square }) => square)
}

function textualContent(sections: RawChapterSection[]) {
  return sections
    .flatMap(({ content }) => {
      if (typeof content === 'string') {
        return [content]
      }
      if (content && typeof content === 'object' && !Array.isArray(content)) {
        return Object.values(content).filter(
          (value): value is string => typeof value === 'string',
        )
      }
      return []
    })
    .join('\n')
}

function assertIncludesAll(text: string, expected: string[]) {
  for (const fragment of expected) {
    assert.equal(text.includes(fragment), true, `Missing source fragment: ${fragment}`)
  }
}

function assertExcludesAll(text: string, forbidden: string[]) {
  for (const fragment of forbidden) {
    assert.equal(text.includes(fragment), false, `Stale source fragment: ${fragment}`)
  }
}

function replay(fen: string, sans: string[]) {
  const chess = new Chess(fen)
  for (const san of sans) {
    assert.ok(chess.move(san, { strict: false }), `Illegal source move: ${san}`)
  }
}
