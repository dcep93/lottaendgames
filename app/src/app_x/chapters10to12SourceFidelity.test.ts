import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { BookSource, RawChapterSection } from './chapterTypes'
import { buildChapterPlayback, type TextPlaybackToken } from './moveParser'

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
  playbackSegments?: Array<{
    parentFen: string
    positionNumber: string
    sectionIndex: number
    start: string
  }>
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

const acceptedChapterTenToTwelveUnits = new Set([
  '10-p144-copy',
  '10-p150-copy',
  '10-p152-copy',
  '11-p155-copy',
  '12-p184-copy',
  '12-p186-copy',
  '12-board-12.6',
  '12-board-12.18',
])
for (const unit of release.units) {
  assert.equal(
    unit.status,
    acceptedChapterTenToTwelveUnits.has(unit.id)
      ? 'accepted-deviation'
      : 'matched',
  )
  if (unit.status === 'accepted-deviation') {
    assert.ok(unit.deviationId, `${unit.id} must name its accepted deviation`)
    assert.ok(unit.evidence, `${unit.id} must record page-level evidence`)
  }
  if (unit.kind !== 'board') {
    continue
  }
  const section = getPart(unit.partId).sections[unit.appSectionIndex!]
  assert.ok(section, `${unit.id} points to a missing source section`)
  assert.equal(boardContent(section.content).number, unit.boardNumber)
}

assert.equal(
  getBoard('10', '10.3').fen,
  '3K4/3P2k1/8/8/5R2/8/2r5/8 b - - 0 1',
)
assert.equal(
  getBoard('10', '10.10').fen,
  'r7/4K1k1/3RP3/8/8/8/8/8 b - - 0 1',
)
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
assert.equal(
  getBoard('11', '11.9').fen,
  '8/5k2/7P/6R1/5PK1/8/8/1r6 b - - 0 1',
)
assert.equal(getBoard('11', '11.13').displayLabel, 'Position 11.12')
assert.equal(
  getBoard('12', '12.8').fen,
  '8/1p6/1P6/8/7K/8/8/1k6 w - - 0 1',
  'PDF 176 / printed 175 has a key-square star, not a white pawn, on b4.',
)
assert.equal(
  getBoard('12', '12.24').fen,
  '2k5/8/p1P5/P2K4/8/8/8/8 w - - 0 1',
)
assert.equal(
  getBoard('12', '12.25').fen,
  '8/7p/5k2/8/5K2/8/6PP/8 b - - 0 1',
  'PDF 191 / printed 190 places the black pawn on h7 and black king on f6.',
)
assert.equal(
  getBoard('12', '12.29').fen,
  '8/7p/5k2/8/5K2/8/6PP/8 w - - 0 1',
)
assert.equal(
  getBoard('12', '12.32').fen,
  '8/6k1/6P1/p2p3P/8/8/2K5/8 b - - 0 1',
)
assert.equal(
  getBoard('12', '12.33').fen,
  '8/7k/p3p1pP/6P1/8/2K5/8/8 w - - 0 1',
)
assert.equal(
  getBoard('12', '12.35').fen,
  '8/8/8/1p2kPp1/6P1/4K3/8/8 b - - 0 1',
)
assert.equal(
  getBoard('12', '12.36').fen,
  '8/8/8/p3kPp1/6P1/4K3/8/8 w - - 0 1',
)
assert.equal(
  getBoard('12', '12.37').fen,
  '8/8/2p1kPp1/6P1/4K3/8/8/8 w - - 0 1',
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
  ['11', '11.1', undefined, undefined],
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

// PDF 154 / printed 153: "First scenario" is a standalone heading above
// Ending 69, not a subtitle attached to Position 11.1.
const chapterElevenFirstScenarioHeading = getPart('11').sections[2]
assert.equal(chapterElevenFirstScenarioHeading.type, 'heading')
assert.equal(chapterElevenFirstScenarioHeading.content, 'First scenario')
assert.equal(
  getPart('11').sections.filter(
    ({ type, content }) => type === 'heading' && content === 'First scenario',
  ).length,
  1,
)

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
assert.deepEqual(
  getBoard('12', '12.24').markers?.map(({ square, symbol, variant }) => [
    square,
    symbol,
    variant,
  ]),
  [
    ['d8', '2', 'label'],
    ['c7', '1', 'label'],
    ['d6', '2', 'label'],
    ['c5', '1', 'label'],
  ],
)
for (const [number, squares] of [
  ['12.32', ['a5', 'd5', 'd2', 'a2', 'a5']],
  ['12.33', ['a6', 'e6', 'e2', 'a2', 'a6']],
  ['12.34', ['a3', 'c3', 'c1', 'a1', 'a3']],
  ['12.35', ['c8', 'f8', 'f5', 'c5', 'c8']],
  ['12.36', ['c8', 'f8', 'f5', 'c5', 'c8']],
  ['12.37', ['d8', 'f8', 'f6', 'd6', 'd8']],
] as const) {
  assert.deepEqual(
    getBoard('12', number).routes?.map(({ squares, style }) => ({
      squares,
      style,
    })),
    [
      {
        squares,
        style: 'outline',
      },
    ],
  )
}
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
assert.match(
  chapterTenText,
  /8\.Rd4\+−\nEnd of the manoeuvre/,
  'PDF 128 / printed 127 preserves the printed +− evaluation',
)
assertIncludesAll(chapterTenText, [
  'Second method: 3.Ra1. White transfers the rook to c8.',
  '5...Ra1 6.Rd7 Ra2',
  '8.e7 Ke6!=.',
  'Summary of Section 2',
  '2...Ke7! intending ...Rd8',
  '3.Kc4 Rd8=.',
  '2.c5? Rd8!=;',
  '4.Kb4 Kc8!=',
  'safety zone g7-h7',
  '4.a7 Ra6!=',
  '1.Ra1? Rb7+!',
  '1...Rc8',
  '1...Rg8',
  '1...Ke7?',
  '1...Rc8+ 2.Kd5 Rd8+ 3.Kc6!',
  '2.Rf7 Ra3+',
  '11.Kd4 Rf6',
  'Insisting on the defensive strategy. White cannot',
  'chance: The defending rook',
  '4.e7 Ke6!=',
  '4.Rd8++-',
  '4.Rd7? Ra8!=',
  'we are in an extreme position',
  '1...Kf6Z 2.e7',
  'such as ...Rf2',
  '2.Kd7Z Kg7',
  '3.Ke7Z',
  "Black's disposal..",
  '5.d5 Kf4! 6.Re8',
  // PDF 125 / printed 124 through PDF 150 / printed 149: preserve the
  // rendered chess-piece glyphs and the move-line punctuation exactly.
  '3...Rd8? (a king move is better',
  '4.Rf7+! Ke8',
  '4.Kf6 Ke8.',
  '7...Kd8 (7...Kf8! =)',
  '6.e7! Rb8+ (6...Rxe7?! 7.Rf1+)',
  '5.Ka6 Rc8 6.Rd4!',
  '3.Kc5 Rc8+ 4.Kb5 Rb8+! 5.Ka6\n',
  '10.Kb4 Rb8+ 11.Rb5\nRh8',
  '1.Kb4 Rb8+ 2.Ka5 Rc8!?',
  '1...Ra8\nPreventing Ka4.',
  '3...Kg4 4.Re5 Ra3!',
  '2...Kg3 3.Rh5\nAttempting Kd3 or Kc3',
  '1...Rc7 2.Kb4!',
  '3.c5 Kd5 4.Rd6+ Ke5',
  '2...Rd8 3.Rd5 Ra8 4.Kd4 Kf4\nThe easiest way',
  '6...Rb1+ 7.Ka7.',
  '5...Kf8?! 6.Rb7 Ra5',
  '5...Kg6 6.Rb7 Ra5',
  '6.Rb7?',
  'manoeuvre Rb7 and a6-a7',
  '7...Ke6 8.Kc4 Kd6',
  '8...Rxb1 9.a8Q+-.',
  // PDF 152 / printed 151: both black moves are king moves.
  '14.Ke7 Kb5 15.Ra1\nKb6=',
  'Therefore,\nwe will classify',
])
assertExcludesAll(chapterTenText, [
  'Second method: 3.Ra8.',
  'significance. 5.Ra1 6.Rd7',
  '8.e7 Ke6! =.',
  'Summary of section',
  'intending...Kd8',
  '3.Kc4 Kd8=.',
  '2.c5? Rd8! =;',
  '4.Kb4 Kc8! =',
  'safety zone g7 -h7',
  '4.a7 Ra6! =',
  '1...Ra1? Rb7+!',
  '2.Kf7 Ra3+',
  'such as 1...Rf2',
  '11.Kd4 Rf5',
  '3...Kd8? (a king move is better',
  '4.Rh7+! Ke8',
  '4.Kf6 Re8',
  '7...Kd5 (7...Kf8! =)',
  'chance: The. defending rook',
  '6...Re7?! 7.Rf1+',
  '2...Ke7! intending...Rd8',
  '5.Ka6 Rc5 6.Rd4!',
  '3.Kc5 Rc8+ 4.Kb5 Rb8+! 5.Ka6.',
  '10.Kb4 Rb8+ 11.Kb5\nRh8',
  '1.Kb4 Rb8+ 2.Ka5 Kc8!?',
  '1...Ra8. Preventing Ka4.',
  '3...Kg4 4.Ke5 Ra3!',
  '1...Kc7 2.Kb4!',
  '3.c5 Kd5 4.Kd6+ Ke5',
  '2...Rd8 3.Rd5 Ra8 4.Kd4 Kf4.',
  '6...Rb7+ 7.Ka7.',
  '8...Rxb1 9.a8=Q+-.',
  '14.Ke7 Rb5 15.Ra1\nRb6=',
  'Insisting on the defensive strategy White cannot',
  "we're in an extreme position",
  "Black's disposal.\n1...Ra8",
  'cut-offking',
  'Therefore,\nWe will classify',
])

const chapterTenSection113 = textualContent([getPart('10').sections[113]])
assert.equal((chapterTenSection113.match(/Rb7/g) ?? []).length, 6)
assert.equal(chapterTenSection113.includes('Kb7'), false)

const chapterTenPlayback = buildChapterPlayback(getPart('10').sections)
for (const [sectionIndex, display, positionNumber, parentFen] of [
  [12, '3...Rd8?', '10.1', '4k3/R7/4K3/4P3/8/8/8/3r4 b - - 4 3'],
  [13, '2...Rg1!', '10.1', '4k3/R7/4P1r1/3K4/8/8/8/8 b - - 0 2'],
  [23, '3.Ra1', '10.3', '3K4/3P2k1/8/8/8/8/2r5/5R2 w - - 3 3'],
  [30, '7.Rf8', '10.4', '8/4P3/4r3/2K5/8/8/8/5Rk1 w - - 11 7'],
  [39, 'Rf2', '10.6', '4k3/7R/8/3KPr2/8/8/8/8 b - - 0 1'],
  [41, '4.Rf7+!', '10.7', '5k2/7R/4K3/4P3/8/8/8/3r4 w - - 0 4'],
  [41, '4.Rh8+', '10.7', '3k4/7R/4K3/4P3/8/8/8/4r3 w - - 5 4'],
  [41, '4.Kf6', '10.7', '3k4/7R/4K3/4P3/8/8/8/4r3 w - - 5 4'],
  [41, '7...Kd8', '10.7', '4k3/7R/4K3/4P3/8/8/8/4r3 b - - 12 7'],
  [49, '1...Ra1?', '10.9', 'r2R4/4K1k1/4P3/8/8/8/8/8 b - - 1 1'],
  [49, '2.Ke8', '10.9', '3R4/4K1k1/4P3/8/8/8/8/r7 w - - 2 2'],
  [49, '2.Rd7', '10.9', '3R4/r3K1k1/4P3/8/8/8/8/8 w - - 2 2'],
  [49, '2...Ra8', '10.9', '8/r2RK1k1/4P3/8/8/8/8/8 b - - 3 2'],
  [49, '3.Rd6!', '10.9', 'r7/3RK1k1/4P3/8/8/8/8/8 w - - 4 3'],
  [51, '3.Rb7', '10.10', 'r7/3RK1k1/4P3/8/8/8/8/8 w - - 4 3'],
  [52, '4.Rd7', '10.10', 'r7/4K3/3RP1k1/8/8/8/8/8 w - - 1 4'],
  [55, '1.Ra1?', '10.11', '1r6/R3K1k1/4P3/8/8/8/8/8 w - - 0 1'],
  [57, '6...Rxe7?!', '10.12', '3K4/1r2P3/5k2/8/8/8/8/R7 b - - 0 6'],
  [57, '6.Kc7', '10.12', '1r1K4/8/4P1k1/8/8/8/8/R7 w - - 10 6'],
  [65, '6.Rd4!', '10.13', '2r5/4k3/K7/8/2P5/8/8/3R4 w - - 9 6'],
  [67, '11.Rb5', '10.13', '1r6/8/4k3/3R4/1KP5/8/8/8 w - - 19 11'],
  [67, '12.Rb7!?', '10.13', '7r/8/4k3/1R6/1KP5/8/8/8 w - - 21 12'],
  [72, 'Rc8!?', '10.15', '1r6/8/5k2/K7/2P5/8/8/4R3 b - - 3 2'],
  [85, '1...Ra8', '10.17', '1r6/8/8/2R5/1P1k4/1K6/8/8 b - - 0 1'],
  [90, '4.Re5', '10.19', 'r7/8/8/7R/3P2k1/8/3K4/8 w - - 3 4'],
  [93, '1...Rc7', '10.20', '2r5/8/1R6/4k3/2P5/2K5/8/8 b - - 1 1'],
  [93, '4.Rd6+', '10.20', '2r5/8/1R6/2Pk4/1K6/8/8/8 w - - 1 4'],
  [111, '6...Rb1+', '10.23', 'R7/6k1/PK6/8/8/8/8/r7 b - - 10 6'],
  [113, '2.Kf2', '10.23', 'R7/6k1/P7/8/8/8/6K1/r7 w - - 1 2'],
  [113, '6.Rh7!', '10.24', '8/R7/P4k2/1r6/3K4/8/8/8 w - - 7 6'],
  [113, '6.Rb7?', '10.24', '8/R7/P4k2/1r6/3K4/8/8/8 w - - 7 6'],
  [113, '5...Ra5', '10.24', '8/1R6/P5k1/1r6/4K3/8/8/8 b - - 6 5'],
  [113, 'Kf6!', '10.24', '8/PR6/6k1/r7/4K3/8/8/8 b - - 0 6'],
  [113, '7.Rh7!?', '10.24', '8/PR6/5k2/r7/4K3/8/8/8 w - - 1 7'],
  [113, '7.Kd4', '10.24', '8/PR6/5k2/r7/4K3/8/8/8 w - - 1 7'],
  [121, '7.Kc5+', '10.26', '1R6/P2k4/1K6/8/8/8/8/1r6 w - - 12 7'],
  [121, '14.Ke7', '10.26', 'r7/P4K2/R7/2k5/8/8/8/8 w - - 26 14'],
  [121, 'Kb5', '10.26', 'r7/P3K3/R7/2k5/8/8/8/8 b - - 27 14'],
  [121, 'Kb6=', '10.26', 'r7/P3K3/8/1k6/8/8/8/R7 b - - 29 15'],
  [121, '9.a8Q+', '10.26', '3K4/P7/8/2k5/8/8/8/1r6 w - - 0 9'],
  [126, '3.Rb2', '10.27', '8/1K1k4/1R6/P7/8/8/8/2r5 w - - 3 3'],
] as const) {
  assert.equal(
    chapterTenMoves(sectionIndex).some(
      (token) =>
        token.display === display &&
        token.positionNumber === positionNumber &&
        token.parentFen === parentFen,
    ),
    true,
    `Missing Chapter 10 playback token ${display} in section ${sectionIndex}`,
  )
}

assert.equal(chapterTenMoves(39).length, 15)
assert.equal(chapterTenMoves(49).length, 27)
assert.equal(
  chapterTenMoves(23).find(({ display }) => display === '8.Rd4+')?.san,
  'Rd4',
  'PDF 128 / printed 127 uses +− as an evaluation, not a check marker',
)
for (const [sectionIndex, display, parentFen] of [
  [41, 'Ke7', '7R/2k5/4K3/4P3/8/8/8/4r3 w - - 7 5'],
  [55, 'Kf6', '1r6/2K3k1/4P3/8/8/8/8/R7 b - - 5 3'],
  [90, 'Kc3', 'r7/8/8/7R/3P4/6k1/3K4/8 w - - 1 3'],
  [93, 'Rb6', '1r6/8/7R/4k3/2P5/2K5/8/8 w - - 1 2'],
  [113, 'Kg6', '8/R5k1/P7/r7/8/5K2/8/8 b - - 2 3'],
] as const) {
  assert.equal(
    chapterTenMoves(sectionIndex).some(
      (token) => token.display === display && token.parentFen === parentFen,
    ),
    false,
    `Chapter 10 prose reference ${display} must not become playback`,
  )
}

// PDF 144 / printed 143 genuinely repeats the rook's occupied h5 square as
// 3.Rh5. PDF 150 / printed 149 genuinely jumps the king from e4 to c4.
// Preserve both source inconsistencies as prose instead of inventing legal moves.
assert.equal(chapterTenMoves(90).some(({ display }) => display === '3.Rh5'), false)
assert.equal(
  chapterTenMoves(113).some(
    ({ display, parentFen }) =>
      display === '8.Kc4' &&
      parentFen === '8/P6R/4k3/r7/4K3/8/8/8 w - - 1 8',
  ),
  false,
)
// PDF 152 / printed 151 also prints 8.Rb5? Rh8+ even though Rb5 checks
// the black king. Keep the impossible continuation visible but non-playable.
assert.equal(
  chapterTenMoves(121).some(
    ({ display, parentFen }) =>
      display === 'Rh8+' &&
      parentFen === '3K4/P7/8/1Rk5/8/8/8/7r b - - 15 8',
  ),
  false,
)
assert.equal(
  chapterTenMoves(121).some(
    ({ display, parentFen }) =>
      display === '9.Kc7' &&
      parentFen === '3K4/P7/1R6/2k5/8/8/8/7r w - - 14 9',
  ),
  false,
)

const chapterElevenText = textualContent(getPart('11').sections)
assertIncludesAll(chapterElevenText, [
  '3...Rc8! holds',
  '4.Kd6 Kc8 5.Rc6+ Kd8',
  '3.Rh6 (intending Kd6)',
  "Series about rook and bishop's pawns.",
  "bishop's pawn on the 6th rank.",
  "Bishop's pawn on the 5th rank.",
  "Bishop's pawn on the 4th rank.",
  '3...Kxg5?? loses on the spot',
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
  '...g2-Rf3-Rf1',
  'name the Second-rank defence',
  'right move is:\n1.Rb2!',
  'followed by 2.Rb8+',
  '1.Rg6+ (1.f5 Rb1!)',
  '2.Rg5\nDriving the black rook off the 5th rank',
  "on the h-file.' However",
  'not 23...Ra2??',
  '2.Re6+!',
  'one of the white pieces is passive',
  // PDF 157 / printed 156 and PDF 158 / printed 157 print promotions
  // without an equals sign.
  '10.Rxf1 gxf1Q+',
  '10.f8Q+ Rxf8+',
  // PDF 162 / printed 161 prints 3.Rc5 on its own line without a period.
  '3.Rc5\nThe white rook again has plenty of space.',
  // PDF 164 / printed 163 includes a dash before "this time".
  '4.h7 Rg1+! –\nthis time the h-pawn is lost',
  // PDF 162 / printed 161: both glyphs are rooks, not kings.
  '5.Rg7+ Kf6 6.Rg8 Kf7=',
  // PDF 164 / printed 163: both continuations interpose the rook on e6.
  'Re2+ 23.Re6 Rf2!',
  '22.f5 Re2+ 23.Re6 Ra2',
  // PDF 169 / printed 168: ...Rf4 completes Vancura and ...Kh7 starts the main continuation.
  '9.Kc5 Rf4 - Vancura',
  '6...Kh7 7.Ke5 Rb6',
  // High-resolution glyph regressions, PDF 156–159 and 163 / printed 155–158 and 162.
  '4.Rh7+ Kd8=',
  '1.Rb7? White captures the pawn',
  '3.Rxg7 Kg3',
  '6.Rg7+ Kh8 7.f7',
  '8.Rb8! Kxh7 9.Ke7',
  '6...Ra1 7.f6 Ra6+ 8.Kf5 Ra5+ 9.Re5 Ra8 10.f7+-',
  '3.Rg7+ Kf8',
  '7.f6 Rg2 8.Rg7 Rf2',
  '(7.Rg6+ Kf7=)',
  // PDF 163 / printed 162: both king moves capture the h5-pawn.
  '8.Re7 (8.Kf6 Kxh5=)',
  '9.Re8 (9.Kf6 Kxh5=)',
])
assertExcludesAll(chapterElevenText, [
  '3...Kc8! holds',
  '4.Kd6 Kc8 5.Kc6',
  '4.Kd6 4...Kc8',
  '3.Kc6 (intending Kd6)',
  '3...Kg5?? loses on the spot',
  '3.Kh6 (intending Kd6)',
  '1...Kg1+ 2.Kf6',
  '11.Rd5 Kf1',
  '18.Rd6 Ka2',
  '4.Kf5 Ka5+=',
  '1.Re4 Kb6',
  '...g2-Kf3-Rf1',
  'right move is:\n1.Kb2!',
  'followed by 2.Kb8+',
  '1.Kg6+ (1.f5 Rb1!)',
  '2.Kg5\nDriving the black rook off the 5th rank',
  'on the h-file? However',
  'not 23...Rh2??',
  '2.Ke6+!',
  'one oft he white pieces is passive',
  '10.Rxf1 gxf1=Q+',
  '10.f8=Q+ Rxf8+',
  '3.Rc5. The white rook again has plenty of space.',
  '4.h7 Rg1+!\nthis time the h-pawn is lost',
  '5.Kg7+ Kf6 6.Kg8 Kf7=',
  'Re2+ 23.Ke6 Rf2!',
  '22.f5 Re2+ 23.Ke6 Ra2',
  '9.Kc5 Rg4 - Vancura',
  '6...Rh7 7.Ke5 Rb6',
  '4.Rb7+ Kd8=',
  '1...Rb7? White captures the pawn',
  '3.Rg7 Kg3',
  '6.Kg7+ Kh8 7.f7',
  '8.Rb8! Rxh7 9.Ke7',
  '6...Ra1 7.f6 Ra6+ 8.Kf5 Ra8+ 9.Re5 Ra8 10.f7+-',
  '3.Kg7+ Kf8',
  '7.f6 Rg2 8.Kg7 Rf2',
  '(7.Kg6+ Kf7=)',
  '8.Re7 (8.Kf6 Kh5=)',
  '9.Re8 (9.Kf6 Kh5=)',
])

const chapterElevenPlayback = buildChapterPlayback(getPart('11').sections)
assert.equal(chapterElevenMoves(8).length, 48)
for (const [sectionIndex, display, positionNumber, parentFen] of [
  [8, '4...Rg1!', '11.2', 'R7/2k3r1/8/2KP4/3P4/8/8/8 b - - 0 4'],
  [8, '5.Rc6+', '11.1', '2k5/8/1R1K4/3P4/3r4/8/8/8 w - - 2 5'],
  [9, '4.Rh7+', '11.1', '8/3k4/7R/2KP4/3P2r1/8/8/8 w - - 6 4'],
  [14, '1.Rb7?', '11.3', '8/6p1/8/8/1R4pk/r7/6K1/8 w - - 0 1'],
  [14, '3.Rxg7', '11.3', '8/1R4p1/8/8/6p1/7k/r7/6K1 w - - 4 3'],
  [21, '6.Rg7+', '11.4', '6k1/1R6/5P1P/8/8/2K5/8/5r2 w - - 9 6'],
  [21, '8.Rb8!', '11.4', '3K3k/1R5P/5P2/8/8/8/8/5r2 w - - 1 8'],
  [21, 'Kxh7', '11.4', '1R1K3k/7P/5P2/8/8/8/8/5r2 b - - 2 8'],
  [24, '3.Rg7+', '11.5', '6k1/1R6/5K1P/5P2/8/8/8/7r w - - 3 3'],
  [24, 'Ra5+', '11.5', '4R3/7k/r4P1P/5K2/8/8/8/8 b - - 2 8'],
  [24, '8.Rg7', '11.5', '5k2/R6K/5P1P/8/8/8/6r1/8 w - - 1 8'],
  [48, '7.Rg6+', '11.7', '8/6k1/2R5/5K1P/5P2/8/8/6r1 w - - 8 7'],
  [48, '12.Rd4', '11.7', '8/6k1/8/3R1K1P/5P2/8/8/5r2 w - - 18 12'],
  [58, '4.Kf4', '11.10', '3R4/1r6/6kP/4K1P1/8/8/8/8 w - - 6 4'],
  [58, '6.Kf4', '11.10', '4R3/1r6/6kP/4K1P1/8/8/8/8 w - - 10 6'],
  [42, '1...Rg1+', '11.series.4.1', '6k1/1R6/7P/6K1/5P2/8/8/r7 b - - 0 1'],
] as const) {
  assert.equal(
    chapterElevenMoves(sectionIndex).some(
      (token) =>
        token.display === display &&
        token.positionNumber === positionNumber &&
        token.parentFen === parentFen,
    ),
    true,
    `Missing Chapter 11 playback token ${display} in section ${sectionIndex}`,
  )
}

const chapterTwelveText = textualContent(getPart('12').sections)
assertIncludesAll(chapterTwelveText, [
  "A) We are dealing with knight's pawns",
  'The king who manages to occupy one of them, will capture',
  "When the pawns are not so advanced, or we are dealing with rook's pawns",
  "unless we are dealing with rook's pawns",
  'The first theoretician to enunciate this rule was W. Bahr.',
  '8.Kc6 trapping the black king',
  'as in all the examples included in this section',
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
  '4.Kxe5 Kxh6 5.Kd5+- Kg6',
  '1...axb6 (1...cxb6',
])
assertExcludesAll(chapterTwelveText, [
  "A) we're dealing with knight's pawns",
  'one of them will capture the enemy pawn',
  "or we're dealing with rook's pawns",
  "unless we're dealing with rook's pawns",
  'The first theoretician to enunciate this rule was Bahr.',
  '8.Kc6...trapping the black king',
  'as in the examples included in this section',
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
  '4.Ke5 Kh6 5.Kd5+- Kg6',
  '1.axb6 (1.cxb6',
])

const chapterTwelvePlayback = buildChapterPlayback(getPart('12').sections)
for (const [sectionIndex, display, parentFen, san] of [
  [35, '6.Kb4', '8/1p6/1k6/8/8/2K5/8/8 w - - 0 6', 'Kb4'],
  [62, '2.Ke5', '8/8/8/7p/1k1K3P/1P6/8/8 w - - 2 2', 'Ke5'],
  [62, '6.Kg6!', '8/8/4k3/7K/7P/8/8/8 w - - 1 6', 'Kg6'],
  [98, '4...Kh6', '8/7p/8/5K1k/8/6P1/7P/8 b - - 0 4', 'Kh6'],
  [98, '6.Kg7', '8/7p/5K2/7k/8/6P1/7P/8 w - - 3 6', 'Kg7'],
  [104, '1...Kg6', '8/7p/5k2/8/5K2/7P/6P1/8 b - - 0 1', 'Kg6'],
  [104, '2.Kg4', '8/7p/6k1/8/5K2/7P/6P1/8 w - - 1 2', 'Kg4'],
  [104, '2.Kg4+', '8/7p/6k1/8/5K1P/8/6P1/8 w - - 1 2', 'Kg4'],
  [120, '3.Kb4+', '8/8/6Pk/3p3P/p7/2K5/8/8 w - - 2 3', 'Kb4'],
  [120, '4.Kxa4', '8/8/6Pk/7P/pK1p4/8/8/8 w - - 0 4', 'Kxa4'],
  [140, '4.Kxe5', '8/8/6kP/1p2p3/1P2K3/8/8/8 w - - 1 4', 'Kxe5'],
  [140, 'Kxh6', '8/8/6kP/1p2K3/1P6/8/8/8 b - - 0 4', 'Kxh6'],
  [140, '6.Kc5', '8/8/6k1/1p1K4/1P6/8/8/8 w - - 2 6', 'Kc5'],
] as const) {
  assert.equal(
    chapterTwelveMoves(sectionIndex).some(
      (token) =>
        token.display === display &&
        token.parentFen === parentFen &&
        token.san === san,
    ),
    true,
    `Missing Chapter 12 playback token ${display} in section ${sectionIndex}`,
  )
}

replay(getBoard('10', '10.1').fen, [
  'Rg1',
  'Kd6',
  'Rd1+',
  'Ke6',
  'Rd8',
  'Rh7',
])
replay(getBoard('10', '10.7').fen, [
  'Rf7+',
  'Ke8',
  'Ra7',
  'Kf8',
  'Ra8+',
  'Kg7',
  'Ke7',
])
replay('3k4/7R/4K3/4P3/8/8/8/4r3 w - - 5 4', ['Kf6', 'Ke8'])
replay('4k3/7R/3K4/4P3/8/8/8/4r3 w - - 3 3', [
  'Ke6',
  'Kd8',
  'Rh8+',
  'Kc7',
  'Kf6',
  'Kd7',
  'Rh7+',
  'Ke8',
  'Ke6',
  'Kd8',
])
replay(getBoard('10', '10.12').fen, ['e7', 'Rxe7', 'Rf1+'])
replay(getBoard('10', '10.13').fen, [
  'Ke7',
  'Kb4',
  'Rb8+',
  'Kc5',
  'Rc8+',
  'Kb5',
  'Rb8+',
  'Ka6',
  'Rc8',
  'Rd4',
])
replay(getBoard('10', '10.13').fen, [
  'Rc8',
  'Kb4',
  'Rb8+',
  'Kc5',
  'Rc8+',
  'Kb5',
  'Rb8+',
  'Ka6',
  'Rc8',
  'Rd4',
  'Ke5',
  'Rd5+',
  'Ke6',
  'Kb5',
  'Rb8+',
  'Ka4',
  'Rc8',
  'Kb4',
  'Rb8+',
  'Rb5',
  'Rh8',
  'Rb7',
])
replay(getBoard('10', '10.15').fen, ['Kb4', 'Rb8+', 'Ka5', 'Rc8', 'Kb5'])
replay('r7/8/8/7R/3P4/6k1/3K4/8 b - - 2 3', [
  'Kg4',
  'Re5',
  'Ra3',
  'd5',
  'Kf4',
  'Re8',
  'Ra5',
])
replay('2r5/8/7R/4k3/2P5/2K5/8/8 w - - 0 1', [
  'Rb6',
  'Rc7',
  'Kb4',
  'Rc8',
  'c5',
  'Kd5',
  'Rd6+',
  'Ke5',
  'Kb5',
  'Rb8+',
  'Rb6',
])
replay(getBoard('10', '10.23').fen, [
  'Kg7',
  'Kf3',
  'Kh7',
  'Ke4',
  'Kg7',
  'Kd5',
  'Kh7',
  'Kc6',
  'Kg7',
  'Kb6',
  'Rb1+',
  'Ka7',
])
replay(getBoard('10', '10.24').fen, [
  'Ra4',
  'Ke3',
  'Rb4',
  'Ra7+',
  'Kg6',
  'Rb7',
  'Ra4',
  'a7',
  'Kf5',
])
replay('3K4/P7/8/2k5/8/8/8/1r6 w - - 0 9', ['a8=Q+'])

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
replay(getBoard('10', '10.3').fen, [
  'Rc1',
  'Ke7',
  'Re1+',
  'Kd6',
  'Rd1+',
  'Ke6',
  'Re1+',
  'Kd5',
  'Rd1+',
  'Rd4+',
])
replay(getBoard('10', '10.10').fen, ['Kg6', 'Rd7', 'Kg7', 'Rc7', 'Kg6'])
replay(getBoard('11', '11.3').fen, [
  'Rb2',
  'Ra4',
  'Rc2',
  'g5',
  'Rb2',
  'g3',
  'Rb8',
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
replay(getBoard('11', '11.6').fen, ['Rg6+', 'Kf7', 'Rg5', 'Rb1'])
// PDF 162 / printed 161.
replay(getBoard('11', '11.6').fen, [
  'Rg6+',
  'Kf7',
  'f5',
  'Rb1',
  'Kg5',
  'Rg1+',
  'Kh6',
  'Rf1',
  'Rg7+',
  'Kf6',
  'Rg8',
  'Kf7',
])
// PDF 164 / printed 163, the 21...Kg7 variation.
replay(getBoard('11', '11.8').fen, [
  'Kh7',
  'Rd6',
  'Ra2',
  'Kg5',
  'Rg2+',
  'Kf6',
  'Kxh6',
  'Ke7+',
  'Kg7',
  'f5',
  'Re2+',
  'Re6',
  'Rf2',
  'f6+',
  'Kg6',
  'Re1',
  'Ra2',
])
replay(getBoard('11', '11.9').fen, [
  'Ra1',
  'Rg7+',
  'Kf6',
  'Rc7',
  'Kg6',
  'h7',
  'Rh1',
])
replay(getBoard('11', '11.11').fen, [
  'Re4',
  'Rb6',
  'Re6+',
  'Rxe6',
  'fxe6',
  'Kxe6',
  'Kg5',
])
// PDF 169 / printed 168, the Vancura side line and main continuation.
replay(getBoard('11', '11.14').fen, [
  'Re4',
  'h5',
  'Kh7',
  'Kf3',
  'Rh4',
  'Ke3',
  'Rxh5',
  'Kd4',
  'Rg5',
  'Kc4',
  'Rg4+',
  'Kb5',
  'Rg5+',
  'Kb4',
  'Rg4+',
  'Kc5',
  'Rf4',
])
replay(getBoard('11', '11.14').fen, [
  'Re4',
  'a5',
  'Re5',
  'Kf3',
  'Rh5',
  'Kg3',
  'Rc5',
  'a6',
  'Rc6',
  'Kf4',
  'Kh7',
  'Ke5',
  'Rb6',
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
replay(getBoard('12', '12.8').fen, [
  'Kg3',
  'Kc2',
  'Kf2',
  'Kd3',
  'Ke1',
  'Kc4',
  'Kd2',
  'Kb5',
  'Kc3',
  'Kxb6',
  'Kb4',
])
replay(getBoard('12', '12.24').fen, [
  'Kd4',
  'Kd8',
  'Kc4',
  'Kc8',
  'Kd5',
  'Kc7',
  'Kc5',
])
replay(getBoard('12', '12.29').fen, [
  'h3',
  'Kg6',
  'Kg4',
  'Kh6',
  'Kf5',
  'Kh5',
  'g3',
  'Kh6',
  'Kf6',
  'Kh5',
  'Kg7',
  'h6',
  'h4',
])
replay(getBoard('12', '12.29').fen, ['h4', 'Kg6', 'Kg4'])
replay(getBoard('12', '12.29').fen, ['g3'])
replay(getBoard('12', '12.29').fen, ['g4'])
assert.equal(
  chapterTwelveMoves(104).some(
    ({ display, parentFen, path }) =>
      display === '2.Kg4' &&
      parentFen === '8/7p/6k1/8/5K1P/8/6P1/8 w - - 1 2' &&
      path.join(' ') === 'h4 Kg6 Kg4',
  ),
  false,
  'Position 12.29 must not attach the later 2.Kg4 to the short 1.h4 variation.',
)
assert.equal(
  chapterTwelveMoves(104).some(
    ({ display, parentFen }) =>
      display === '1...Kg6' &&
      parentFen === '8/7p/5k2/8/5KP1/8/7P/8 b - - 0 1',
  ),
  false,
  'Position 12.29 must not attach the later 1...Kg6 to the 1.g4? alternative.',
)
assert.deepEqual(
  chapterTwelveMoves(104).find(
    ({ display, parentFen }) =>
      display === '2.Kg4' &&
      parentFen === '8/7p/6k1/8/5K2/7P/6P1/8 w - - 1 2',
  )?.path,
  ['h3', 'Kg6', 'Kg4'],
  'Position 12.29 later 1...Kg6 2.Kg4 must retain the 1.h3 main-line ancestry.',
)
replay(getBoard('12', '12.32').fen, [
  'a4',
  'Kc3',
  'Kh6',
  'Kb4',
  'd4',
  'Kxa4',
])
replay(getBoard('12', '12.33').fen, [
  'Kc4',
  'Kh8',
  'Kc5',
  'Kh7',
  'Kc4',
  'Kh8',
])
replay(getBoard('12', '12.33').fen, [
  'Kd4',
  'a5',
  'Kc4',
  'e5',
  'Kb5',
  'e4',
  'Kc4',
  'a4',
])
replay(getBoard('12', '12.34').fen, ['Kh8', 'Kc2', 'a2'])
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
replay(getBoard('12', '12.36').fen, [
  'Kd3',
  'Kd5',
  'Kc3',
  'Kc5',
  'Kb3',
  'Kd5',
  'Ka4',
])
replay(getBoard('12', '12.37').fen, [
  'Kd4',
  'Kd6',
  'Kc4',
  'Ke6',
  'Kc5',
  'Kd7',
  'f7',
])
replay(getBoard('12', '12.38').fen, [
  'h4',
  'Ke6',
  'h5',
  'Kf6',
  'h6',
  'Kg6',
  'Kxe5',
  'Kxh6',
  'Kd5',
  'Kg6',
  'Kc5',
  'Kf6',
  'Kxb5',
  'Ke7',
  'Kc6',
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

function chapterTenMoves(sectionIndex: number) {
  return (chapterTenPlayback.tokensBySectionIndex.get(sectionIndex) ?? []).filter(
    (token): token is Extract<TextPlaybackToken, { type: 'move' }> =>
      token.type === 'move',
  )
}

function chapterElevenMoves(sectionIndex: number) {
  return (
    chapterElevenPlayback.tokensBySectionIndex.get(sectionIndex) ?? []
  ).filter(
    (token): token is Extract<TextPlaybackToken, { type: 'move' }> =>
      token.type === 'move',
  )
}

function chapterTwelveMoves(sectionIndex: number) {
  return (
    chapterTwelvePlayback.tokensBySectionIndex.get(sectionIndex) ?? []
  ).filter(
    (token): token is Extract<TextPlaybackToken, { type: 'move' }> =>
      token.type === 'move',
  )
}

function replay(fen: string, sans: string[]) {
  const chess = new Chess(fen)
  for (const san of sans) {
    assert.ok(chess.move(san, { strict: false }), `Illegal source move: ${san}`)
  }
}
