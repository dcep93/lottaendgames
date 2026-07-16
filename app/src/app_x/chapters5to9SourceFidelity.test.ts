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

for (const boardNumber of [
  'cutting-off-series-1',
  'cutting-off-series-2',
  'cutting-off-series-3',
]) {
  const unit: FidelityUnit | undefined = release.units.find((candidate) =>
    candidate.boardNumber === boardNumber
  )
  assert.equal(unit?.pdfPage, 71)
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
  getBoard('8', '8.4').fen,
  '8/8/8/8/7n/7p/8/4K1kB b - - 0 3',
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
assertIncludesAll(chapterSevenText, [
  "concept of the 'bad bishop'",
  '3...Ke8!= Now the king reaches a black square',
  'has reached rear opposition.\n\nFrom his position',
  'an essential manoeuvre: Now the stronger side',
  'without obstructing the pawn!',
  'the other diagonal (a4-e8)',
  'Third Case. The defending king',
  'Now we can draw some important conclusions.',
  'It think it is better to remember why things happen.',
  'make sure that is impossible to win that way',
])
assertExcludesAll(chapterSevenText, [
  'concept of the bad bishop',
  '3...Ke8! Now the king reaches a black square',
  'the other diagonal, a4-e8',
  'Third Case.The defending king',
  'I think it is better to remember why things happen.',
  'make sure that it is impossible to win that way',
])

const chapterEightText = textualContent(getPart('8').sections)
assertIncludesAll(chapterEightText, [
  'Bishop vs. Knight (see statistics).',
  'easily solved (most positions) or',
  'Bishop + Pawn vs. Bishop: 47% wins; here just 25%',
  'shorter diagonal (4 squares long)',
  'which was tactically prevented (...Nd5, ...Ne3)',
  '4.Kd7 (the king is too late) 4...Kf1',
  'White dominates all 4 squares on the stopping diagonal',
  'The first point! If the knight retreats',
  'The second point! The knight is ill-placed',
  '2.Ba1□ Nb2',
  'they are very similar... but different',
  '5.Kd3□ Nc5+',
  '4.Kd2Z and, as shown',
  'the white king would prefer Kd1',
  '6...Nb2Z - see main line',
  '(unless there is a chance of a knight fork)',
  'ousted by - sometimes complicated - tactics',
  '5.Ba4+ 5...Kc5',
  '10.Be4Z+-',
  '6.Be4Z+- another zugzwang',
  'Zugzwang!',
  'only with White to move!',
  'Recommended Exercise: look carefully',
  'drawing resources:\n1) Perpetual check with the knight\n2) Stalemate',
  'square in front of the pawn (the opposite colour to the bishop)',
])
assertExcludesAll(chapterEightText, [
  'easily solved, in most positions, or',
  'shorter diagonal, was losing',
  'which was tactically prevented by ...Nd5 and ...Ne3',
  '3...Kb1? 4.Kd2 and, as shown',
  'blockading position, unless there is a chance',
  'ousted by sometimes complicated tactics',
  '6.Be4+- another zugzwang',
  'only with White to move.',
  'Recommended Exercise: Look carefully',
  'resources: 1) perpetual check with the knight, and 2) stalemate',
  'square in front of the pawn, the opposite colour to the bishop',
])

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
assertIncludesAll(chapterNineText, [
  'There is one exception:',
  '5.Kc3Z followed by Kb4',
  'enemy bishop (avoiding blockade)',
  'This pawn structure always wins',
  '5.Bb3Z (5.f5??',
  '9.Bc4Z',
  'André Cheron',
  'as we will see in the next examples',
  '3.Be3Z',
  '8.e6+!+-',
  '18.Bd2! (similar to the previous note) 18...Kc6',
  'With a- and d- pawns (or h- and e-)',
  '4.Bc8Z The first zugzwang',
  '8.Be6Z The second zugzwang',
  '9.Be5Z Bb7',
  '6.Bb7Z Kg5',
  '11.Bb7Z',
  '15.Bd5Z',
  'From c8 (or d7) the bishop attacks',
  'defensive set-up against the pawns on 4th rank',
  'not 3.Kd2? Bb5!',
  '5.Ke3 Be8!',
  'Here the defensive procedure is simple too:',
  "Two bishop's pawns (c- and f-files) win",
  'left hand side of the pawn',
  '2.Bh7? Kb2 3.Kd1',
  "with a rook's pawn (not a wrong rook's pawn)",
])
assertExcludesAll(chapterNineText, [
  'There is one exception.',
  'This pawn structure allows wins',
  'Andre Cheron',
  'but here there are some exceptions.',
  '2...Bc4 3.Be3\n',
  'With a- and d-pawns, or h- and e-pawns',
  'From c8 or d7 the bishop attacks',
  'defensive set-up against the pawns on the 4th rank',
  'not 3.Bd2? Bb5!',
  '5.Be3 Be8!',
  'Here the defensive procedure is simple too.',
  "Two bishop's pawns, c- and f-files, win",
  'left-hand side of the pawn',
  '2.Bh7? Kb2 3.Bd1',
  "with a rook's pawn, not a wrong rook's pawn",
])

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
replay(getBoard('8', '8.4').fen, [
  'Kxh1',
  'Kf2',
  'Nf3',
  'Kf1',
  'Nd2+',
  'Kf2',
  'Ne4+',
  'Kf1',
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
