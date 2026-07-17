import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import type { BookSource, RawChapterSection } from './chapterTypes'
import {
  buildChapterPlayback,
  type ChapterPlayback,
  type TextPlaybackToken,
} from './moveParser'
import {
  buildPlaybackNavigation,
  getNextNavigationNode,
  getPreviousNavigationNode,
  type NavigationNode,
  type PositionNavigation,
} from './playbackNavigation'

type FidelityUnit = {
  boardNumber?: string
  classification:
    | 'accepted-presentation-deviation'
    | 'app-defect'
    | 'blocked'
    | 'book-error'
    | 'matched'
  curatedSourceLocations: Array<{
    kind: 'app-source' | 'book-section' | 'not-applicable'
    partId?: string
    sectionIndex?: number
  }>
  id: string
  kind: 'blank' | 'board' | 'front-matter' | 'page-copy'
  partId?: string
  pdfPage: number
}

type FidelityLedger = {
  batches: Array<{
    id: string
    status: 'closed' | 'open'
    unitIds: string[]
  }>
  schemaVersion: number
  units: FidelityUnit[]
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

assert.equal(ledger.schemaVersion, 3)
const batch = ledger.batches.find(
  ({ id }) => id === 'batch-01-pdf-001-027',
)
assert.ok(batch, 'Expected closed Batch 1 fidelity evidence')
assert.equal(batch.status, 'closed')
const unitById = new Map(ledger.units.map((unit) => [unit.id, unit]))
const batchUnits = batch.unitIds.map((unitId) => {
  const unit = unitById.get(unitId)
  assert.ok(unit, `Batch 1 points to missing unit ${unitId}`)
  return unit
})
const introductionUnits = batchUnits.filter(
  ({ partId }) => partId === 'introduction',
)
assert.equal(new Set(batchUnits.map(({ id }) => id)).size, batchUnits.length)
assert.equal(batchUnits.length, 40)
assert.equal(
  introductionUnits.filter(({ kind }) => kind === 'page-copy').length,
  17,
)
assert.equal(
  introductionUnits.filter(({ kind }) => kind === 'board').length,
  13,
)
assert.deepEqual(
  introductionUnits
    .filter(({ kind }) => kind === 'page-copy')
    .map(({ pdfPage }) => pdfPage)
    .sort((a, b) => a - b),
  Array.from({ length: 17 }, (_, index) => 10 + index),
)

for (const [partId, expectedNumbers] of Object.entries(expectedBoards)) {
  const part = getPart(partId)
  const sourceBoards = getBoards(part.sections)
  assert.deepEqual(
    sourceBoards.map((section) => boardContent(section).number),
    expectedNumbers,
    `Unexpected board sequence in ${partId}`,
  )
  if (partId === 'introduction') {
    assert.deepEqual(
      introductionUnits
        .filter((unit) => unit.kind === 'board')
        .map(({ boardNumber }) => boardNumber),
      expectedNumbers,
      'Unexpected Batch 1 Introduction board sequence',
    )
  }
}

for (const unit of introductionUnits) {
  assert.notEqual(unit.classification, 'blocked')
  const part = getPart('introduction')
  const sectionIndexes = unit.curatedSourceLocations
    .filter(
      (location) =>
        location.kind === 'book-section' &&
        location.partId === 'introduction' &&
        location.sectionIndex !== undefined,
    )
    .map(({ sectionIndex }) => sectionIndex!)
  for (const sectionIndex of sectionIndexes) {
    assert.ok(
      part.sections[sectionIndex],
      `${unit.id} points to missing section ${sectionIndex}`,
    )
  }
  if (unit.kind === 'board') {
    assert.equal(sectionIndexes.length, 1)
    assert.equal(
      boardContent(part.sections[sectionIndexes[0]]).number,
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

const batch02cBoardFens = {
  '3.2': '8/8/8/8/5N2/8/2p4K/2k5 w - - 0 1',
  '3.3': '8/8/8/8/4N3/1p6/7K/1k6 b - - 0 1',
  '4.5': '6KQ/4q3/6k1/8/8/8/8/8 w - - 0 1',
  '4.8': '8/4KP2/8/8/6k1/8/q7/8 b - - 0 1',
  '4.9': '8/4KP2/8/1k6/8/8/q7/8 b - - 0 1',
  '4.12': '8/8/8/4K3/8/1Q6/2pk4/8 w - - 0 1',
} as const
for (const [number, fen] of Object.entries(batch02cBoardFens)) {
  assert.equal(
    boardContent(getBoard(number.split('.')[0], number)).fen,
    fen,
    `Unexpected source-authoritative placement for ${number}`,
  )
}
assert.equal(
  boardContent(getBoard('3', '3.10')).fen,
  '3k4/1n6/8/P7/8/8/7K/8 w - - 0 1',
  'PDF 59 / print 58 places the black king on d8',
)

const introductionText = getPart('introduction').sections
  .map(textualContent)
  .join('\n')
assert.equal(introductionText.includes('Centurini, Chéron, Euwe'), true)
assert.equal(introductionText.includes('Centurini, Cheron, Euwe'), false)

const positionOneTwo = boardContent(getBoard('1', '1.2'))
assert.deepEqual(positionOneTwo.boundaryPaths, [
  {
    meaning: 'Square of the pawn boundary as printed',
    points: [
      { x: 0, y: 62.5 },
      { x: 0, y: 0 },
      { x: 62.5, y: 0 },
      { x: 62.5, y: 62.5 },
      { x: 0, y: 62.5 },
    ],
  },
])
assert.equal(positionOneTwo.routes, undefined)

const chapterOneText = getPart('1').sections.map(textualContent).join('\n')
assert.equal(
  chapterOneText.includes('King + Pawn vs. King endings occur in this position.'),
  true,
)
assert.equal(chapterOneText.includes('King + Pawn vs. Pawn endings'), false)
assert.equal(chapterOneText.includes('Now the pawn can be stopped.'), true)
assert.equal(chapterOneText.includes('Now the pawn cannot be stopped.'), false)
assert.equal(chapterOneText.includes('there is a stalemate.'), true)
assert.equal(chapterOneText.includes('there is a.stalemate.'), false)
assert.equal(chapterOneText.includes("the stronger side's king."), true)
assert.equal(chapterOneText.includes("the stronger side's king.."), false)
assert.equal(chapterOneText.includes('8th-rank check any more.'), true)
assert.equal(chapterOneText.includes('8th-rank check anymore.'), false)

const chapterOnePrintedStarMarkers = ['1.9', '1.11', '1.12', '1.16'].flatMap(
  (number) => boardContent(getBoard('1', number)).markers ?? [],
)
assert.equal(chapterOnePrintedStarMarkers.length, 11)
assert.deepEqual(
  chapterOnePrintedStarMarkers.map(({ symbol }) => symbol),
  Array.from({ length: 11 }, () => '★'),
)

const positionOneTwentyFour = boardContent(getBoard('1', '1.24'))
assert.equal(positionOneTwentyFour.subtitle, 'Kamsky - Bacrot')
assert.equal(positionOneTwentyFour.caption, 'Sofía 2006')
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

const problemTwoTwentySix = boardContent(getBoard('2', '2.26'))
assert.equal(
  problemTwoTwentySix.fen,
  '8/8/3Q1p2/1q1P4/3k4/3p4/8/2K5 b - - 0 1',
)
replay(problemTwoTwentySix.fen, [
  'Qc5+',
  'Qxc5+',
  'Kxc5',
  'Kd2',
  'Kd6',
  'Ke3',
  'Ke5',
  'Kd2',
  'Kd6',
  'Ke3',
  'Kxd5',
  'Kxd3',
])

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

for (const number of ['3.6', '3.8', '4.5', '4.11']) {
  const content = boardContent(getBoard(number.split('.')[0], number))
  assert.equal(content.displayLabel, `Analysis diagram ${number}`)
  assert.equal(content.caption, undefined)
}

const positionFourFour = boardContent(getBoard('4', '4.4'))
assert.deepEqual(positionFourFour.boundaryPaths, [
  {
    meaning: 'Printed stepped boundary between the winning and drawing zones',
    points: [
      { x: 37.5, y: 0 },
      { x: 37.5, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 62.5 },
      { x: 100, y: 62.5 },
    ],
  },
])
assert.deepEqual(markerSquares(positionFourFour), ['f7', 'g6'])

assert.equal(chapterThreeText.includes('from a more complex ending'), true)
assert.equal(chapterThreeText.includes('from more complex endings'), false)
assert.equal(chapterThreeText.includes('1...Kd2\nThis allows'), true)
assert.equal(chapterThreeText.includes('1...Kd2. This allows'), false)
assert.equal(chapterThreeText.includes('2... Kd4\nThe alternative way'), true)
assert.equal(chapterThreeText.includes('2... Kd4. The alternative way'), false)
assert.equal(chapterThreeText.includes('1...Kc2\nThe king anticipates'), true)
assert.equal(chapterThreeText.includes('1...Kc2. The king anticipates'), false)

const chapterFourText = getPart('4').sections.map(textualContent).join('\n')
assert.equal(chapterFourText.includes('3. Kg7 Qe7+\nSetting up'), true)
assert.equal(chapterFourText.includes('3. Kg7 Qe7+.\nSetting up'), false)
assert.equal(chapterFourText.includes('key squares: (here f7 or g6).'), true)
assert.equal(chapterFourText.includes('key squares (here f7 or g6).'), false)
assert.equal(
  chapterFourText.includes(
    'Black cannot win tempi to bring his king nearer anymore.',
  ),
  true,
)
assert.equal(
  chapterFourText.includes(
    'White cannot win tempi to bring his king nearer anymore.',
  ),
  false,
)
assert.equal(
  chapterFourText.includes('Only move, but enough to draw.'),
  true,
)
assert.equal(
  chapterFourText.includes('Only move, but not enough to draw.'),
  false,
)

const chapterOnePlayback = buildChapterPlayback(getPart('1').sections)
const chapterThreePlayback = buildChapterPlayback(getPart('3').sections)
const chapterFourPlayback = buildChapterPlayback(getPart('4').sections)
const chapterOneNavigation = buildPlaybackNavigation(chapterOnePlayback)
const chapterThreeNavigation = buildPlaybackNavigation(chapterThreePlayback)
const chapterFourNavigation = buildPlaybackNavigation(chapterFourPlayback)
assertLegalPlayback(chapterOnePlayback)
assertLegalPlayback(chapterThreePlayback)
assertLegalPlayback(chapterFourPlayback)

assert.equal(
  findMove(chapterOnePlayback, 35, '1. Kf6!').parentFen,
  '5k2/8/4K3/5P2/8/8/8/8 w - - 0 1',
)
assert.equal(
  findMove(chapterOnePlayback, 35, '1. Kf6').parentFen,
  '5k2/8/6K1/5P2/8/8/8/8 w - - 0 1',
)
assert.equal(
  findMove(chapterOnePlayback, 35, '1. Ke6').parentFen,
  '5k2/8/5K2/5P2/8/8/8/8 w - - 0 1',
)

const positionOneNineteenReturn = findMove(
  chapterOnePlayback,
  70,
  '4...Re2+',
)
assert.deepEqual(
  moveTokens(chapterOnePlayback, 70)
    .filter(({ positionNumber }) => positionNumber === '1.20')
    .map(({ display }) => display),
  [
    '4... Rc4',
    '5. Nb6',
    '5. Nf6',
    'Rd4',
    '6.Nh7',
    'Kf4',
    '7.Nf8',
    'Kf5',
    '5...Rb4',
    '6. Nc8',
    '6. Nd5',
    'Re4+',
    '7.Kf1',
    'Rd4',
    '8. Nc3',
    'Rd3',
    '6... Rb7!',
    '7. Kd2',
    '7.Nd6',
    'Re7+',
    '8.Kf1',
    'Rd7',
    '7... Kf4',
    '8. Ke2',
    'Ke5',
  ],
  'PDF 43 / print 42 losing Analysis 1.20 must remain fully playable before the return to Position 1.19',
)
assert.equal(positionOneNineteenReturn.positionNumber, '1.19')
assert.equal(
  positionOneNineteenReturn.parentFen,
  '8/8/8/8/8/5k2/2r5/3NK3 b - - 7 4',
)
assert.deepEqual(positionOneNineteenReturn.path, [
  'Nf2+',
  'Ke3',
  'Nd1+',
  'Kf3',
  'Nc3',
  'Rc2',
  'Nd1',
  'Re2+',
])
assert.deepEqual(
  nextMoveDisplays(
    chapterOneNavigation.get('1.19'),
    positionOneNineteenReturn,
    5,
  ),
  ['5. Kf1', 'Rh2', '6. Ke1', '6... Rc2', '7. Kf1='],
)
for (const display of [
  '4...Re2+',
  '5. Kf1',
  'Rh2',
  '6. Ke1',
  '6... Rc2',
  '7. Kf1=',
]) {
  assert.equal(findMove(chapterOnePlayback, 70, display).positionNumber, '1.19')
}

const positionOneTwentyFourTokens =
  chapterOnePlayback.tokensBySectionIndex.get(81) ?? []
assert.equal(findMove(chapterOnePlayback, 81, '6. Ke2').san, 'Ke2')
assert.equal(findMove(chapterOnePlayback, 81, '10. Ke2').san, 'Ke2')
assert.equal(
  moveTokens(chapterOnePlayback, 81).some(
    ({ display }) => display === '6. Ke2+' || display === '10. Ke2+',
  ),
  false,
)
assert.equal(
  positionOneTwentyFourTokens
    .filter(
      (token) => token.type === 'text' || !token.hidden,
    )
    .map((token) => (token.type === 'text' ? token.text : token.display))
    .join(''),
  getPart('1').sections[81].content,
)
const genuineCheckBeforeEvaluation = findMove(
  chapterOnePlayback,
  60,
  '5.Kf5+',
)
assert.equal(genuineCheckBeforeEvaluation.san, 'Kf5+')
assert.equal(
  (chapterOnePlayback.tokensBySectionIndex.get(60) ?? [])
    .filter((token) => token.type === 'text')
    .map(({ text }) => text)
    .join('')
    .includes('+-'),
  true,
)

const kd1 = findMove(chapterThreePlayback, 8, '1...Kd1')
assert.equal(
  kd1.parentFen,
  '8/8/8/8/8/8/2p1N2K/2k5 b - - 1 1',
)
assert.deepEqual(kd1.path, ['Ne2+', 'Kd1'])
assert.equal(
  previousMove(chapterThreeNavigation.get('3.2'), kd1)?.display,
  '1. Ne2+!',
)
assert.deepEqual(
  nextMoveDisplays(chapterThreeNavigation.get('3.2'), kd1, 3),
  ['2. Nc3+!', 'Kd2', '3. Na2='],
)

const qf6 = findMove(chapterFourPlayback, 14, '3... Qf6+')
assert.equal(
  qf6.parentFen,
  '8/6KP/4q3/4k3/8/8/8/8 b - - 4 3',
)
assert.deepEqual(qf6.path, ['Qd7+', 'Kg6', 'Qe6+', 'Kg7', 'Qf6+'])
assert.equal(
  previousMove(chapterFourNavigation.get('4.4'), qf6)?.display,
  '3. Kg7',
)
assert.deepEqual(
  nextMoveDisplays(chapterFourNavigation.get('4.4'), qf6, 2),
  ['4. Kg8', 'Ke6!'],
)
assert.equal(
  findMove(chapterFourPlayback, 14, '4. Kg8', 1).parentFen,
  '8/4q1KP/8/4k3/8/8/8/8 w - - 5 4',
)

const kg8Alternative = findMove(chapterFourPlayback, 27, '2. Kg8')
assert.deepEqual(
  nextMoveDisplays(
    chapterFourNavigation.get('4.7'),
    kg8Alternative,
    3,
  ),
  ['2... Kg6', '3.f8Q', '3... Qh7'],
)
const aliasedMate = nextMoves(
  chapterFourNavigation.get('4.7'),
  kg8Alternative,
  3,
).at(-1)
assert.ok(aliasedMate?.hidden)
assert.equal(new Chess(aliasedMate.fen).isCheckmate(), true)

for (const expectation of [
  {
    display: '4... Kc6?',
    next: '5. Kg7',
    path: ['Qa3+', 'Ke8', 'Qa8+', 'Ke7', 'Qe4+', 'Kf8', 'Kc6'],
    parentFen: '5K2/5P2/8/1k6/4q3/8/8/8 b - - 6 4',
    positionNumber: '4.9',
    previous: '4. Kf8',
    sectionIndex: 32,
  },
  {
    display: '4. Qa1+',
    next: 'Kd2=',
    path: ['Qb2', 'Kd1', 'Qb3', 'Kd2', 'Qa2', 'Kc3', 'Qa1+'],
    parentFen: '8/8/8/4K3/8/2k5/Q1p5/8 w - - 6 4',
    positionNumber: '4.12',
    previous: '3... Kc3!',
    sectionIndex: 41,
  },
  {
    display: '2. Qa7+?',
    next: 'Kb1=',
    path: ['Qc5+', 'Ka2', 'Qa7+'],
    parentFen: '8/8/8/2Q5/8/3K4/k7/q7 w - - 2 2',
    positionNumber: '4.13',
    previous: 'Ka2',
    sectionIndex: 44,
  },
] as const) {
  const move = findMove(
    chapterFourPlayback,
    expectation.sectionIndex,
    expectation.display,
  )
  assert.equal(move.parentFen, expectation.parentFen)
  assert.deepEqual(move.path, expectation.path)
  assert.equal(
    previousMove(
      chapterFourNavigation.get(expectation.positionNumber),
      move,
    )?.display,
    expectation.previous,
  )
  assert.deepEqual(
    nextMoveDisplays(
      chapterFourNavigation.get(expectation.positionNumber),
      move,
      1,
    ),
    [expectation.next],
  )
}

assert.equal(
  moveTokens(chapterFourPlayback, 41).some(
    ({ display }) => display === '5.Qc1',
  ),
  false,
)
assert.equal(chapterFourText.includes('to avoid 5.Qc1'), true)

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
    boundaryPaths?: Array<{
      meaning: string
      points: Array<{ x: number; y: number }>
    }>
    caption?: string
    displayLabel?: string
    fen: string
    markers?: Array<{ meaning: string; square: string; symbol: string }>
    number: string
    routes?: Array<{
      meaning: string
      squares: string[]
      style?: 'arrow' | 'line' | 'outline'
    }>
    subtitle?: string
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

function moveTokens(playback: ChapterPlayback, sectionIndex: number) {
  return (playback.tokensBySectionIndex.get(sectionIndex) ?? []).filter(
    (
      token,
    ): token is Extract<TextPlaybackToken, { type: 'move' }> =>
      token.type === 'move',
  )
}

function findMove(
  playback: ChapterPlayback,
  sectionIndex: number,
  display: string,
  occurrence = 0,
) {
  const move = moveTokens(playback, sectionIndex).filter(
    (token) => !token.hidden && token.display === display,
  )[occurrence]
  assert.ok(move, `Expected ${display} occurrence ${occurrence}`)
  return move
}

function nextMoves(
  navigation: PositionNavigation | undefined,
  start: Extract<TextPlaybackToken, { type: 'move' }>,
  count: number,
) {
  assert.ok(navigation, `Expected navigation for ${start.positionNumber}`)
  const moves: NavigationNode[] = []
  let current: NavigationNode | undefined = start as NavigationNode

  for (let index = 0; index < count; index += 1) {
    current = getNextNavigationNode(navigation, current.id, {})
    assert.ok(current, `Expected move ${index + 1} after ${start.display}`)
    moves.push(current)
  }

  return moves
}

function nextMoveDisplays(
  navigation: Parameters<typeof nextMoves>[0],
  start: Extract<TextPlaybackToken, { type: 'move' }>,
  count: number,
) {
  return nextMoves(navigation, start, count).map(({ display }) => display)
}

function previousMove(
  navigation: PositionNavigation | undefined,
  start: Extract<TextPlaybackToken, { type: 'move' }>,
) {
  assert.ok(navigation, `Expected navigation for ${start.positionNumber}`)
  const previous = getPreviousNavigationNode(navigation, start.id)
  assert.notEqual(previous, undefined, `Expected previous move for ${start.display}`)
  assert.notEqual(previous, null, `Expected source parent for ${start.display}`)
  return previous
}

function assertLegalPlayback(playback: ChapterPlayback) {
  for (const tokens of playback.tokensBySectionIndex.values()) {
    for (const token of tokens) {
      if (token.type !== 'move') {
        continue
      }

      const chess = new Chess(token.parentFen)
      assert.ok(chess.move(token.san, { strict: false }), token.display)
      assert.equal(chess.fen(), token.fen, token.display)
    }
  }
}
