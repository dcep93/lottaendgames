import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { BookSource, RawChapterSection } from './chapterTypes'

type BoardContent = {
  caption?: string
  fen: string
  label?: string
  markers?: Array<{ meaning: string; square: string; symbol: string }>
  number: string
  orientation?: string
  prompt?: string
  solution?: string
}

type FidelityLedger = {
  releases: Array<{
    id: string
    partIds?: string[]
    status: string
    units: Array<{
      appSectionIndex?: number
      boardNumber?: string
      deviationId?: string
      evidence?: string
      id: string
      kind: 'board' | 'page-copy'
      partId: string
      pdfPage: number
      status: string
    }>
  }>
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

const release = ledger.releases.find(
  ({ id }) => id === 'chapters-14-15-bibliography',
)
assert.ok(release, 'Expected the final source-fidelity release')
assert.equal(release.status, 'matched')
assert.deepEqual(release.partIds, ['14', '15', 'bibliography'])
assert.equal(new Set(release.units.map(({ id }) => id)).size, release.units.length)
assert.equal(release.units.filter(({ kind }) => kind === 'page-copy').length, 20)
assert.equal(release.units.filter(({ kind }) => kind === 'board').length, 56)
const acceptedDeviation = release.units.find(
  ({ id }) => id === '14-board-14.29',
)
assert.ok(acceptedDeviation, 'Expected the Final Test 14.29 deviation record')
assert.equal(acceptedDeviation.status, 'accepted-deviation')
assert.equal(
  acceptedDeviation.deviationId,
  'final-test-14.29-side-to-move',
)
assert.match(acceptedDeviation.evidence ?? '', /published solution.*White's move 69/)
assert.equal(
  release.units.filter(
    ({ id, status }) => id !== '14-board-14.29' && status !== 'matched',
  ).length,
  0,
)
assert.deepEqual(
  release.units
    .filter(({ kind }) => kind === 'page-copy')
    .map(({ pdfPage }) => pdfPage)
    .sort((left, right) => left - right),
  Array.from({ length: 20 }, (_, index) => 230 + index),
)

const finalTest = getPart('14')
const appendix = getPart('15')
const bibliography = getPart('bibliography')
const finalTestBoards = getBoards(finalTest.sections)
const appendixBoards = getBoards(appendix.sections)
const expectedFinalTestNumbers = Array.from(
  { length: 36 },
  (_, index) => `14.${String(index + 1).padStart(2, '0')}`,
)
const expectedAppendixNumbers = [
  ...Array.from({ length: 19 }, (_, index) => `F${index + 1}`),
  'troitsky-line',
]

assert.deepEqual(
  finalTestBoards.map((section) => boardContent(section).number),
  expectedFinalTestNumbers,
)
assert.deepEqual(
  appendixBoards.map((section) => boardContent(section).number),
  expectedAppendixNumbers,
)
assert.equal(finalTest.sections[0]?.content, '14. Final Test')
assert.equal(appendix.sections[0]?.content, '15. Appendix')
assert.equal(
  appendix.sections.find(({ type }) => type === 'heading')?.content,
  '1. Fortresses',
)
assert.deepEqual(
  release.units
    .filter(({ kind, partId }) => kind === 'board' && partId === '14')
    .map(({ boardNumber }) => boardNumber),
  expectedFinalTestNumbers,
)
assert.deepEqual(
  release.units
    .filter(({ kind, partId }) => kind === 'board' && partId === '15')
    .map(({ boardNumber }) => boardNumber),
  expectedAppendixNumbers,
)

for (const unit of release.units.filter(({ kind }) => kind === 'board')) {
  const section = getPart(unit.partId).sections[unit.appSectionIndex!]
  assert.ok(section, `${unit.id} points to a missing source section`)
  assert.equal(boardContent(section).number, unit.boardNumber)
}

assert.deepEqual(
  extractionRows.filter(({ chapter }) => chapter === 14).map(({ number }) => number),
  expectedFinalTestNumbers,
)
assert.deepEqual(
  extractionRows.filter(({ chapter }) => chapter === 15).map(({ number }) => number),
  expectedAppendixNumbers,
)
for (const section of [...finalTestBoards, ...appendixBoards]) {
  const board = boardContent(section)
  const chapter = section.type === 'problem' ? 14 : 15
  const extraction = extractionRows.find(
    ({ chapter: rowChapter, number }) =>
      rowChapter === chapter && number === board.number,
  )
  assert.ok(extraction, `Missing extraction provenance for ${board.number}`)
  assert.equal(extraction.fen, board.fen)
  assert.equal(extraction.status, 'promoted')
}

const correctedFens: Record<string, string> = {
  '14.05': '8/8/P7/3k4/1P6/1K5R/8/r7 b - - 0 43',
  '14.17': '8/8/3B4/5k2/6p1/1r3PK1/8/8 b - - 0 99',
  '14.19': '4k3/7R/8/3rP3/5K2/8/8/8 w - - 0 3',
  '14.20': '8/8/2p5/8/2P5/8/6K1/3k4 w - - 0 1',
  '14.23': '8/6KP/4k3/8/5B2/7r/2p5/8 b - - 0 55',
  '14.25': '8/5K1k/8/5p2/3b1P2/3B2P1/8/8 w - - 0 1',
  '14.30': '8/8/2k5/2P5/5KB1/6P1/8/3b4 b - - 0 89',
}
for (const [number, fen] of Object.entries(correctedFens)) {
  assert.equal(getBoard('14', number).fen, fen)
}
assert.equal(
  getBoard('14', '14.29').fen,
  '8/8/2pr4/R7/8/1k6/4K3/8 w - - 0 69',
)
assert.equal(
  getBoard('14', '14.29').prompt,
  'White to move. Can he draw?',
)
assert.equal(
  getBoard('14', '14.13').prompt,
  'Is there any square on the board for the white king such that Black (to move) can draw?',
)

const finalTestText = textualContent(finalTest.sections)
assertIncludesAll(finalTestText, [
  '71. Ra2? Intending to cut the king off',
  '72. Ra5!+-',
  'reaching the important position 10 on White\'s turn!',
  '57.Bc1',
  'Moreno-Viñal',
  'Domínguez-Bruzón',
  'Andrés-De la Villa',
  '77.Bxf5+?',
  '78...Bf6!= 79.Bc2 Bd8',
  '89...Bb3?',
  '90.Bf3+ Kxc5',
])
assertExcludesAll(finalTestText, [
  '71. Ka2?',
  '72. Ka5!+-',
  '57.Rc1',
  '77.Kxf5+?',
  '78...Kf6!=',
  '79.Bc2 Kd8',
  '89...Kb3?',
  '90.Bf3+ Kxe5',
])

replay(correctedFens['14.05'], [
  'Kc6',
  'Rh5',
  'Kb6',
  'b5',
  'Rb1+',
  'Kc2',
])
replay(correctedFens['14.17'], [
  'gxf3',
  'Bc5',
  'Ke4',
  'Kf2',
])
replay(correctedFens['14.19'], [
  'Kf5',
  'Rd1',
  'Ke6',
  'Kf8',
  'Rf7+',
])
replay(correctedFens['14.20'], ['Kf2', 'Kd2', 'c5', 'Kd3', 'Ke1'])
replay(correctedFens['14.23'], ['Rg3+', 'Kh6', 'Kf7', 'Bc1', 'Rh3+'])
replay(correctedFens['14.25'], [
  'g4',
  'Kh8',
  'g5',
  'Be3',
  'g6',
  'Bd4',
  'Bxf5',
  'Be5',
])
replay(correctedFens['14.30'], ['Bb3', 'Bf3+', 'Kxc5', 'Ke5', 'Bf7'])
replay(getBoard('14', '14.29').fen, [
  'Ke3',
  'Kb4',
  'Ra1',
  'c5',
  'Rb1+',
  'Ka3',
  'Rc1',
  'Rd5',
  'Ke4',
])

assert.deepEqual(
  getBoard('15', 'troitsky-line').markers?.map(({ square }) => square),
  ['a4', 'b6', 'c5', 'd4', 'e4', 'f5', 'g6', 'h4'],
)
assert.equal(getBoard('15', 'F1').caption, 'Karstedt, 1903')
assert.equal(getBoard('15', 'F2').caption, 'Lolli, 1763')
assert.equal(getBoard('15', 'F5').caption, 'Salvioli, 1896')
assert.equal(getBoard('15', 'F7').caption, 'Grigoriev, 1917')
assert.equal(getBoard('15', 'F17').caption, 'Averbakh, 1962')
assertIncludesAll(textualContent(appendix.sections), [
  'Draw. Only in the corner.',
  'A false fortress. Black can force one of the pawns\' advance to h3 and then win.',
  'Fundamental Chess Endings, by Muller & Lamprecht.',
  'Queen vs. Bishop + Knight. Won, except in position F1.',
  '2 Bishops vs. Knight. Won. The evaluation of this ending changed in 1983 thanks to computer analysis.',
])

assert.deepEqual(
  bibliography.sections
    .filter(({ type }) => type === 'heading')
    .map(({ content }) => content),
  [
    'Rey Ardid',
    'Averbakh',
    'John Nunn',
    'Paul Keres: Practical Chess Endings (Batsford)',
    'Levenfish & Smyslov: Rook Endings (Batsford)',
    'Ilya Maizelis: Pawn Endings (Batsford)',
    'Muller & Lamprecht: Secrets of Pawn Endings (Everyman)',
    'Muller & Lamprecht: Fundamental Chess Endings (Gambit)',
    "Mark Dvoretsky: Dvoretsky's Endgame Manual (Russell Enterprises)",
  ],
)
assertIncludesAll(textualContent(bibliography.sections), [
  "Spanish Dr. Ramon Rey Ardid's extensive endgame work occupies 5 volumes.",
  'present-day Nalimov Tablebases',
  'Currently the best book to improve our technique in pawn endings.',
  'Many consider Dvoretsky\'s Endgame Manual the best endgame book ever published to date.',
])

console.log('Chapters 14–15 and bibliography source fidelity passed')

function getPart(partId: string) {
  const part = book.parts.find(({ id }) => id === partId)
  assert.ok(part, `Expected source part ${partId}`)
  return part
}

function getBoards(sections: RawChapterSection[]) {
  return sections.filter(
    ({ type }) => type === 'diagram' || type === 'position' || type === 'problem',
  )
}

function getBoard(partId: string, number: string) {
  const section = getBoards(getPart(partId).sections).find(
    (candidate) => boardContent(candidate).number === number,
  )
  assert.ok(section, `Expected board ${number}`)
  return boardContent(section)
}

function boardContent(section: RawChapterSection) {
  return section.content as BoardContent
}

function textualContent(sections: RawChapterSection[]) {
  return sections
    .map(({ content }) =>
      typeof content === 'string' ? content : JSON.stringify(content),
    )
    .join('\n')
}

function assertIncludesAll(text: string, values: string[]) {
  for (const value of values) {
    assert.equal(text.includes(value), true, `Expected source text: ${value}`)
  }
}

function assertExcludesAll(text: string, values: string[]) {
  for (const value of values) {
    assert.equal(text.includes(value), false, `Unexpected source text: ${value}`)
  }
}

function replay(fen: string, moves: string[]) {
  const chess = new Chess(fen)
  for (const san of moves) {
    assert.ok(chess.move(san, { strict: false }), `Illegal source move: ${san}`)
  }
}
