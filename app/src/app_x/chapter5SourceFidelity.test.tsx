import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { Chess } from 'chess.js'
import {
  bookEndingAnchorId,
  bookPositionAnchorId,
  resolveAppRoute,
} from '../routing'
import { PositionStudyGroup } from './ChapterViewer'
import type {
  BookSource,
  EndingSection,
  PositionSection,
  RawChapterSection,
} from './chapterTypes'
import { buildChapterPlayback, type TextPlaybackToken } from './moveParser'
import {
  buildPlaybackNavigation,
  getNextNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationNode,
} from './playbackNavigation'

type BoardExpectation = {
  caption?: string
  displayLabel?: string
  fen: string
  hideVisualLabel?: true
  markers?: string[]
  number: string
  sectionIndex: number
}

type PageCopyExpectation = {
  includes: string[]
  pdfPage: number
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const chapter = book.parts.find(({ id }) => id === '5')

assert.ok(chapter, 'Expected Chapter 5 in book.json')

const sections = chapter.sections
const playback = buildChapterPlayback(sections)
const navigationByPosition = buildPlaybackNavigation(playback)
const positions = sections
  .map((section, sectionIndex) => ({ section, sectionIndex }))
  .filter(
    (
      entry,
    ): entry is { section: PositionSection; sectionIndex: number } =>
      entry.section.type === 'position',
  )

assert.equal(sections.length, 99)
assert.equal(positions.length, 24)
assert.equal(playback.playablePositions.size, 15)

const pageCopyUnits: PageCopyExpectation[] = [
  {
    pdfPage: 69,
    includes: [
      '5. Rook vs. Pawn',
      'This is one of the most important chapters in this book',
      'Kings do not push. Just counting',
      'if White is to move, he wins; if Black is to move, he draws.',
    ],
  },
  {
    pdfPage: 70,
    includes: [
      '1.Rc8?',
      'Kings push... a bit',
      'Euwe, 1934',
      'Defending king on the 3rd rank cut off along a rank',
    ],
  },
  {
    pdfPage: 71,
    includes: [
      'The only alternative: pushing the pawn, is also useless.',
      'Cutting the king off series',
      'Cutting off is decisive. Only 1.Rg5 wins',
      'Cutting off is not decisive, but still only 1.Rg5 wins',
    ],
  },
  {
    pdfPage: 72,
    includes: [
      'Strong king behind the pawn',
      'Underpromotion to a knight',
      '6...b1N+!',
    ],
  },
  {
    pdfPage: 73,
    includes: [
      '7.Kd3 Na3',
      'Outflanking',
      '5.Rc5 5.Rh1 is also winning. 5...Kd3 6.Kb3',
    ],
  },
  {
    pdfPage: 74,
    includes: [
      'Summary of interesting ideas',
      "King's opposed at the rear",
      'With the rook on h1, White wins (just count).',
    ],
  },
  {
    pdfPage: 75,
    includes: [
      "Stronger side's king on one side",
      'Shoulder-charging',
      "The purpose of this manoeuvre is twofold: 1) To bring our king closer.",
    ],
  },
  {
    pdfPage: 76,
    includes: [
      'The time-gaining check',
      'Mind the enemy king! Do not deliver this check if he can improve his position!',
      'Shoulder-charging and time-gaining check',
      '1.Ra2+!',
    ],
  },
  {
    pdfPage: 77,
    includes: [
      'see side-push series after Ending 28',
      'The rook in front of the pawn',
      'Outflanking. The importance of zugzwang',
      'Réti, 1928',
    ],
  },
  {
    pdfPage: 78,
    includes: [
      'Analysis diagram 5.10',
      '1...e4 2.Re1!',
      "Special themes with a knight's pawn",
      'Kopaev',
    ],
  },
  {
    pdfPage: 79,
    includes: [
      'Kopaev, 1954',
      'losing, in the same manner as in the main line (see below).',
      '9.Rc2?? Ka1!=',
    ],
  },
  {
    pdfPage: 80,
    includes: [
      "The rook's pawn. Pushing from the rear",
      'Knight at the corner = lost',
      "The King's pressure from the rear is thus very effective",
      '6...a1Q 7.Rh1 mate',
    ],
  },
  {
    pdfPage: 81,
    includes: [
      "The rook's pawn. Lateral push",
      'Stalemate in the corner',
      '2.Kc2 is stalemate',
      'The extreme position',
    ],
  },
  {
    pdfPage: 82,
    includes: [
      '5...Ka1?? fails to 6.Rf8 and mate.',
      'Lateral push positions',
      'Draw, no matter who moves. Stalemate',
      'move both kings and the pawn one file rightwards',
    ],
  },
  {
    pdfPage: 83,
    includes: [
      'The pawn wins against the rook',
      'Barbier-Saavedra',
      'those two marked on the board, f5 and b5',
      '10.Kb7 1-0',
    ],
  },
]

assert.equal(pageCopyUnits.length, 15)

const visibleSourceText = sections.map(getVisibleSourceText).join('\n')

for (const unit of pageCopyUnits) {
  assert.ok(unit.includes.length > 0, `PDF ${unit.pdfPage} has no copy checks`)
  for (const expectedText of unit.includes) {
    assert.equal(
      visibleSourceText.includes(expectedText),
      true,
      `PDF ${unit.pdfPage} must retain: ${expectedText}`,
    )
  }
}

for (const rejectedText of [
  'The only alternative, pushing the pawn, is also useless.',
  'Cutting off is decisive. Only 1.Rg5 wins.',
  'Cutting off is not decisive, but still only 1.Rg5 wins.',
  'Kings opposed at the rear',
  'losing, in the same manner as in the main line. 4...b3',
  "The king's pressure from the rear is thus very effective",
  'Draw, no matter who moves. Stalemate.',
]) {
  assert.equal(
    visibleSourceText.includes(rejectedText),
    false,
    `Chapter 5 must not regress to: ${rejectedText}`,
  )
}

assert.equal(
  createHash('sha256')
    .update(
      canonicalStringify(
        sections.filter((section) => section.type !== 'position'),
      ),
    )
    .digest('hex'),
  '72ec06133bd05a90deaa7f0e97843b6dc783bfdad944983d8617ea6e2c2b3050',
  'Chapter 5 non-board copy and hierarchy must stay source-exact',
)

const expectedBoards: BoardExpectation[] = [
  {
    sectionIndex: 4,
    number: '5.1',
    fen: '4R3/8/7K/8/1kp5/8/8/8 w - - 0 1',
  },
  {
    sectionIndex: 8,
    number: '5.2',
    fen: '8/5K2/8/8/4pk2/8/8/R7 w - - 0 1',
    caption: 'Euwe, 1934',
    markers: [
      'a8:★',
      'b8:★',
      'c8:★',
      'd8:★',
      'e8:★',
      'f8:★',
      'g8:★',
      'h8:★',
      'g7:★',
      'h7:★',
      'g6:★',
      'h6:★',
    ],
  },
  {
    sectionIndex: 13,
    number: '5.3',
    fen: '7K/6R1/1k6/p7/8/8/8/8 w - - 0 1',
  },
  {
    sectionIndex: 18,
    number: 'cutting-off-series-1',
    fen: '7K/6R1/2k5/8/1p6/8/8/8 w - - 0 1',
    caption: 'Cutting off is decisive. Only 1.Rg5 wins',
    hideVisualLabel: true,
  },
  {
    sectionIndex: 19,
    number: 'cutting-off-series-2',
    fen: '7K/6R1/2k5/1p6/8/8/8/8 w - - 0 1',
    caption: 'Cutting off is not decisive, but still only 1.Rg5 wins',
    hideVisualLabel: true,
  },
  {
    sectionIndex: 20,
    number: 'cutting-off-series-3',
    fen: '7K/8/8/2k5/1p4R1/8/8/8 w - - 0 1',
    caption: 'Cutting off is useless. White cannot win even with the move.',
    hideVisualLabel: true,
  },
  {
    sectionIndex: 25,
    number: '5.4',
    fen: '7R/8/2K5/8/1pk5/8/8/8 w - - 0 1',
  },
  {
    sectionIndex: 31,
    number: '5.5',
    fen: '8/3K3R/8/2pk4/8/8/8/8 w - - 0 1',
    markers: ['h8:★', 'h1:★'],
  },
  {
    sectionIndex: 37,
    number: 'kings-opposed-at-rear-1',
    fen: '7R/8/3K4/8/2pk4/8/8/8 w - - 0 1',
    caption:
      'Draw, no matter who moves. Underpromotion to a knight. With the rook on h1, White wins (just count).',
    hideVisualLabel: true,
    markers: ['h1:★'],
  },
  {
    sectionIndex: 38,
    number: 'kings-opposed-at-rear-2',
    fen: '8/3K3R/8/2pk4/8/8/8/8 w - - 0 1',
    caption:
      "White to move, wins. Black to move, draw. Outflanking. The rook is best placed on the marked squares. Thus White wins even if it is Black's move.",
    hideVisualLabel: true,
    markers: ['h8:★', 'h1:★'],
  },
  {
    sectionIndex: 39,
    number: 'kings-opposed-at-rear-3',
    fen: '3K3R/8/2pk4/8/8/8/8/8 w - - 0 1',
    caption: 'White wins, no matter who moves. Outflanking.',
    hideVisualLabel: true,
  },
  {
    sectionIndex: 43,
    number: '5.6',
    fen: '8/8/8/7K/3pk3/8/8/3R4 w - - 0 1',
  },
  {
    sectionIndex: 48,
    number: '5.7',
    fen: 'R7/8/8/8/2K3p1/8/5k2/8 w - - 0 1',
  },
  {
    sectionIndex: 52,
    number: '5.8',
    fen: '8/8/8/8/4p3/7K/5k2/R7 w - - 0 1',
  },
  {
    sectionIndex: 59,
    number: '5.9',
    fen: '8/5K2/8/4pk2/4R3/8/8/8 w - - 0 1',
    caption: 'Réti, 1928',
  },
  {
    sectionIndex: 62,
    number: '5.10',
    fen: '8/5K2/8/5k2/4p3/8/8/4R3 w - - 0 1',
    displayLabel: 'Analysis diagram 5.10',
  },
  {
    sectionIndex: 67,
    number: '5.11',
    fen: '3K4/4R3/8/1p6/8/2k5/8/8 w - - 0 1',
    caption: 'Kopaev, 1954',
  },
  {
    sectionIndex: 73,
    number: '5.12',
    fen: '7R/8/1K6/8/pk6/8/8/8 w - - 0 1',
  },
  {
    sectionIndex: 79,
    number: '5.13',
    fen: '7R/8/8/8/8/8/pk1K4/8 w - - 0 1',
  },
  {
    sectionIndex: 84,
    number: '5.14',
    fen: '7R/8/8/8/8/pk1K4/8/8 b - - 0 1',
  },
  {
    sectionIndex: 89,
    number: 'lateral-push-1',
    fen: '7R/8/8/8/8/8/pk1K4/8 w - - 0 1',
    caption: 'Draw, no matter who moves. Stalemate',
    hideVisualLabel: true,
  },
  {
    sectionIndex: 90,
    number: 'lateral-push-2',
    fen: '7R/8/8/8/8/pk1K4/8/8 w - - 0 1',
    caption: 'White to move, wins. Black to move, draw.',
    hideVisualLabel: true,
  },
  {
    sectionIndex: 91,
    number: 'lateral-push-3',
    fen: '7R/8/8/8/pk1K4/8/8/8 w - - 0 1',
    caption: 'White wins, no matter who moves.',
    hideVisualLabel: true,
  },
  {
    sectionIndex: 95,
    number: '5.15',
    fen: '8/2P2k2/3K4/5r2/8/8/8/8 b - - 0 1',
    markers: ['b5:outlined square', 'f5:outlined square'],
  },
]

assert.equal(expectedBoards.length, 24)

for (const expected of expectedBoards) {
  const entry = positions.find(
    ({ sectionIndex }) => sectionIndex === expected.sectionIndex,
  )

  assert.ok(entry, `Missing Chapter 5 board at section ${expected.sectionIndex}`)
  assert.equal(entry.section.content.number, expected.number)
  assert.equal(entry.section.content.fen, expected.fen, `${expected.number} FEN`)
  assert.equal(entry.section.content.orientation, 'white')
  assert.equal(entry.section.content.caption, expected.caption)
  assert.equal(entry.section.content.displayLabel, expected.displayLabel)
  assert.equal(entry.section.content.hideVisualLabel, expected.hideVisualLabel)
  assert.deepEqual(
    (entry.section.content.markers ?? []).map(
      ({ square, symbol }) => `${square}:${symbol}`,
    ),
    expected.markers ?? [],
    `${expected.number} markers`,
  )
}

const expectedPositionAnchors = expectedBoards.map(({ number }) =>
  bookPositionAnchorId(number),
)
assert.equal(new Set(expectedPositionAnchors).size, 24)

for (const anchorId of expectedPositionAnchors) {
  const route = resolveAppRoute('/book/chapter5', `#${anchorId}`).route
  assert.equal(route.module, 'book')
  assert.equal(route.module === 'book' ? route.anchorId : null, anchorId)
}

const endings = sections.filter(
  (section): section is EndingSection => section.type === 'ending',
)
assert.deepEqual(
  endings.map(({ content }) => content.number),
  ['21', '22', '23', '24', '25', '26', '27', '28', '29'],
)

for (const { content } of endings) {
  const anchorId = bookEndingAnchorId(content.number)
  const route = resolveAppRoute('/book/chapter5', `#${anchorId}`).route
  assert.equal(route.module, 'book')
  assert.equal(route.module === 'book' ? route.anchorId : null, anchorId)
}

const smallBoardNumbers = [
  'cutting-off-series-1',
  'cutting-off-series-2',
  'cutting-off-series-3',
  'kings-opposed-at-rear-1',
  'kings-opposed-at-rear-2',
  'kings-opposed-at-rear-3',
  'lateral-push-1',
  'lateral-push-2',
  'lateral-push-3',
]

for (const number of smallBoardNumbers) {
  const expected = expectedBoards.find((board) => board.number === number)
  assert.ok(expected?.caption)
  const html = renderPosition(expected.sectionIndex)
  const sectionTag = html.match(/^<section[^>]*>/)?.[0]

  assert.ok(sectionTag, `${number} must render a containing section`)
  assert.equal(sectionTag.includes('aria-labelledby='), false)
  assert.equal(
    sectionTag.includes(`aria-label="${escapeAttribute(expected.caption)}"`),
    true,
    `${number} must use its source caption as its accessible name`,
  )
  assert.equal(html.includes('<figcaption>'), false)
  assert.equal(html.includes('<span>Position</span>'), false)
  assert.equal(html.includes(`>${number}</strong>`), false)
  assert.equal(
    html.includes(`aria-label="Expand ${escapeAttribute(expected.caption)}"`),
    true,
    `${number} expand control must use its source caption`,
  )
  assert.equal(
    html.includes(`aria-label="Expand position ${number}"`),
    false,
    `${number} expand control must not expose its internal slug`,
  )
  assert.equal(
    html.includes(`id="${bookPositionAnchorId(number)}"`),
    true,
    `${number} must retain its stable route anchor`,
  )
}

const starBoardHtml = ['5.2', '5.5', 'kings-opposed-at-rear-1', 'kings-opposed-at-rear-2']
  .map((number) => {
    const expected = expectedBoards.find((board) => board.number === number)
    assert.ok(expected)
    return renderPosition(expected.sectionIndex)
  })
  .join('')

assert.equal(
  (starBoardHtml.match(/leg-board-marker-glyph">★<\/span>/g) ?? []).length,
  17,
)
assert.equal(
  (starBoardHtml.match(/aria-label="star marker on /g) ?? []).length,
  17,
)
assert.equal(starBoardHtml.includes('aria-label="* marker on '), false)

const analysisMarkup = renderPosition(62)
assert.equal(analysisMarkup.includes('Analysis diagram 5.10'), true)
assert.equal(analysisMarkup.includes('<span>Position</span>'), false)

const labeledBoardMarkup = renderPosition(8)
assert.equal(
  labeledBoardMarkup.includes('aria-label="Expand position 5.2"'),
  true,
  'Ordinary labeled boards must retain their position-based expand label',
)

const extremePositionMarkup = renderPosition(84)
const lichessHref = extremePositionMarkup.match(/<a href="([^"]+)"/)?.[1]
assert.ok(lichessHref)
assert.equal(
  decodeURIComponent(lichessHref).includes(
    '[FEN "7R/8/8/8/8/pk1K4/8/8 b - - 0 1"]',
  ),
  true,
  'Position 5.14 must export/reset from the source Black-to-move state',
)

// The frozen source record declares 53 paths / 439 plies, but does not retain
// its original grouping fixture. Expanding every listed main line, embedded
// variation, short “also wins” branch, and analysis-diagram continuation into
// navigation leaves produces the explicit source obligations below. The test
// deliberately verifies every expanded route instead of padding or dropping
// routes merely to force the headline count.
const sourcePathsByPosition: Record<string, string[][]> = {
  '5.1': [
    ['c3', 'Kg5', 'c2', 'Rc8', 'Kb3', 'Kf4', 'Kb2'],
    ['Kg5', 'c3', 'Kf4', 'c2', 'Rc8', 'Kb3', 'Ke3', 'Kb2', 'Kd2'],
    ['Rc8', 'Kc3'],
  ],
  '5.2': [['Ke6', 'e3', 'Kd5', 'e2', 'Kd4', 'Kf3', 'Kd3', 'Kf2', 'Kd2']],
  '5.3': [
    ['Rg8', 'Kb5'],
    ['Rg8', 'a4', 'Rg5'],
    ['Rg8', 'Kc5', 'Kg7', 'a4', 'Kf6', 'a3', 'Ke5', 'Kc4', 'Ke4', 'a2', 'Ra8', 'Kb3', 'Kd3', 'Kb2'],
    ['Rg5', 'a4', 'Kg7', 'a3', 'Rg3', 'a2', 'Ra3'],
  ],
  '5.4': [
    ['Rh4+', 'Kc3', 'Kb5', 'b3', 'Ka4', 'b2'],
    ['Rh4+', 'Kc3', 'Kc5', 'b3', 'Rh3+', 'Kc2', 'Kc4', 'b2', 'Rh2+', 'Kb1', 'Kb3', 'Ka1', 'Rxb2'],
    ['Rh4+', 'Kc3', 'Kc5', 'b3', 'Rh3+', 'Kc2', 'Kc4', 'b2', 'Rh2+', 'Kc1', 'Kc3', 'b1=N+', 'Kd3', 'Na3', 'Kc3', 'Nb1+', 'Kb3', 'Nd2+', 'Kc3', 'Nb1+', 'Kd3', 'Na3', 'Ra2', 'Nb1', 'Rc2+', 'Kd1', 'Rg2', 'Kc1'],
  ],
  '5.5': [
    ['c4', 'Rh5+', 'Kd4', 'Kc6', 'c3', 'Kb5', 'c2', 'Rh1', 'Kc3', 'Ka4', 'Kb2'],
    ['c4', 'Rh5+', 'Kd4', 'Kc6', 'c3', 'Rh4+', 'Kd3', 'Kd5', 'c2'],
    ['Rh5+', 'Kd4', 'Kc6', 'c4', 'Kb5', 'c3', 'Kb4', 'c2', 'Rh1'],
    ['Rh5+', 'Kd4', 'Kc6', 'c4', 'Kb5', 'c3', 'Kb4', 'c2', 'Rc5', 'Kd3', 'Kb3'],
  ],
  '5.6': [
    ['Kh4', 'Ke3', 'Kg3'],
    ['Kg4', 'd3', 'Re1+', 'Kd4', 'Kf3', 'd2', 'Rd1', 'Kd3', 'Kf2'],
    ['Kg4', 'Ke3', 'Re1+', 'Kf2', 'Rd1', 'Ke3', 'Kg3'],
    ['Kg4', 'Ke3', 'Kg3', 'd3', 'Re1+', 'Kd2', 'Kf2'],
  ],
  '5.7': [
    ['Kd3', 'g3', 'Kd2', 'g2', 'Rf8+', 'Kg3'],
    ['Kd3', 'g3', 'Rf8+', 'Ke1'],
    ['Rf8+', 'Ke2', 'Rg8', 'Kf3', 'Kd3', 'g3', 'Rf8+', 'Kg2', 'Ke2'],
  ],
  '5.8': [
    ['Ra8', 'e3', 'Rf8+', 'Kg1', 'Re8', 'Kf2', 'Kh2', 'e2', 'Rf8+', 'Ke3'],
    ['Kg4', 'e3', 'Rh1', 'e2', 'Rh2+', 'Ke3'],
    ['Ra2+', 'Kf1', 'Kg3'],
    ['Ra2+', 'Kf3', 'Ra8', 'e3', 'Rf8+', 'Ke2', 'Kg2'],
  ],
  '5.9': [
    ['Re3'],
    ['Re1', 'e4'],
    ['Re2', 'e4', 'Re1', 'Ke5', 'Ke7', 'Kf4', 'Kd6', 'Kf3', 'Kd5', 'e3', 'Kd4'],
  ],
  '5.10': [
    ['Rf1+', 'Kg4', 'Ke6', 'e3', 'Ke5', 'e2', 'Ra1', 'Kf3', 'Kd4', 'Kf2'],
    ['Ke7', 'Kf4', 'Ke6', 'e3', 'Kd5', 'Kf3', 'Kd4', 'e2', 'Kd3'],
    ['Ke7', 'Ke5', 'Kd7', 'Kd5'],
  ],
  '5.11': [
    ['Rc7+', 'Kd3', 'Rb7', 'Kc4', 'Kc7', 'b4', 'Kb6', 'b3', 'Ka5', 'Kc3', 'Ka4', 'b2', 'Ka3'],
    ['Rc7+', 'Kb3', 'Rb7', 'b4', 'Kc7', 'Kc3'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kc6', 'Kc4', 'Kb6+', 'Kd3', 'Ka5', 'b3', 'Rb7', 'Kc2', 'Ka4', 'b2'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Kd5'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Ra7+', 'Kb2', 'Kc5', 'Kc3'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Ra7+', 'Kb2', 'Rc7', 'b3', 'Kd5', 'Ka1', 'Kc4', 'b2', 'Ra7+'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Kc5', 'b3', 'Ra7+'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Kc5', 'b3', 'Kc4'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Kc5', 'b3', 'Kb4', 'b2', 'Ra7+', 'Kb1', 'Kb3', 'Kc1', 'Rc7+', 'Kb1', 'Rc2', 'Ka1'],
    ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Kc5', 'b3', 'Kb4', 'b2', 'Ra7+', 'Kb1', 'Kb3', 'Kc1', 'Rc7+', 'Kb1', 'Rb7', 'Kc1', 'Ka2'],
  ],
  '5.12': [
    ['Rh4+', 'Kb3', 'Kb5', 'a3', 'Rh3+', 'Kb2', 'Kb4', 'a2', 'Rh2+', 'Kb1', 'Kb3', 'a1=Q', 'Rh1#'],
    ['Rh4+', 'Kb3', 'Kb5', 'a3', 'Rh3+', 'Kb2', 'Kb4', 'a2', 'Rh2+', 'Kb1', 'Kb3', 'a1=N+', 'Kc3'],
  ],
  '5.13': [
    ['Rb8+', 'Ka3', 'Kc2'],
    ['Rb8+', 'Ka1', 'Kc2'],
    ['Rb8+', 'Ka1', 'Ra8', 'Kb2', 'Rb8+', 'Ka1', 'Rc8', 'Kb2'],
  ],
  '5.14': [
    ['a2', 'Rb8+', 'Ka3', 'Kc2', 'a1=N+', 'Kc3'],
    ['Kb2', 'Kd2', 'a2', 'Rb8+', 'Ka1'],
    ['Kb2', 'Rh2+', 'Kb3'],
    ['Kb2', 'Rh2+', 'Kb1', 'Kc3'],
    ['Kb2', 'Rh2+', 'Kc1', 'Kc3'],
    ['Kb2', 'Rb8+', 'Kc1', 'Ra8', 'Kb2'],
    ['Kb2', 'Rb8+', 'Kc1', 'Kc3', 'a2', 'Ra8', 'Kb1', 'Rb8+', 'Kc1'],
    ['Kb2', 'Rb8+', 'Kc1', 'Kc3', 'a2', 'Ra8', 'Kb1', 'Rb8+', 'Ka1', 'Rf8'],
  ],
  '5.15': [
    ['Rf6+', 'Kd7', 'Rf1'],
    ['Rf6+', 'Kd5', 'Rf5+', 'Kc4', 'Rf1'],
    ['Rf6+', 'Kd5', 'Rf5+', 'Kd4', 'Rf4+', 'Kd3', 'Rf3+', 'Kc2', 'Rf2+', 'Kb3', 'Rf3+', 'Kb4', 'Rf4+', 'Kb5', 'Rf5+', 'Kb6', 'Rf6+', 'Kb7'],
  ],
}

const moveTokens = Array.from(playback.tokensBySectionIndex.values())
  .flat()
  .filter(
    (
      token,
    ): token is Extract<TextPlaybackToken, { type: 'move' }> =>
      token.type === 'move' && !token.hidden,
  )
const tokenByPath = new Map(
  moveTokens.map((token) => [playbackPathKey(token.positionNumber, token.path), token]),
)
const expectedLeafKeys = new Set<string>()

for (const [positionNumber, paths] of Object.entries(sourcePathsByPosition)) {
  for (const path of paths) {
    const chess = new Chess(getSourcePathInitialFen(positionNumber, path))

    path.forEach((san, moveIndex) => {
      const expectedParentFen = chess.fen()
      const applied = chess.move(san)
      assert.ok(
        applied,
        `${positionNumber} source path is illegal at ${path.slice(0, moveIndex + 1).join(' ')}`,
      )
      const prefix = path.slice(0, moveIndex + 1)
      const token = tokenByPath.get(playbackPathKey(positionNumber, prefix))
      assert.ok(
        token,
        `${positionNumber} is missing source path ${prefix.join(' ')}`,
      )
      assert.equal(
        token.parentFen,
        expectedParentFen,
        `${positionNumber} parent FEN at ${prefix.join(' ')}`,
      )
      assert.equal(
        token.fen,
        chess.fen(),
        `${positionNumber} result FEN at ${prefix.join(' ')}`,
      )
    })

    expectedLeafKeys.add(playbackPathKey(positionNumber, path))
  }
}

const actualLeafKeys = new Set(
  moveTokens
    .filter(
      (candidate) =>
        !moveTokens.some(
          (other) =>
            other.positionNumber === candidate.positionNumber &&
            other.path.length > candidate.path.length &&
            candidate.path.every((move, index) => other.path[index] === move),
        ),
    )
    .map((token) => playbackPathKey(token.positionNumber, token.path)),
)

assert.deepEqual(
  Array.from(actualLeafKeys).sort(),
  Array.from(expectedLeafKeys).sort(),
  'Chapter 5 navigation leaves must exactly match the expanded source inventory',
)

let forwardNavigationPlyCount = 0
let previousNavigationPlyCount = 0

for (const [positionNumber, paths] of Object.entries(sourcePathsByPosition)) {
  const navigation = navigationByPosition.get(positionNumber)
  assert.ok(navigation, `Missing navigation for Position ${positionNumber}`)

  for (const path of paths) {
    const leaf = tokenByPath.get(playbackPathKey(positionNumber, path))
    assert.ok(leaf, `${positionNumber} is missing leaf ${path.join(' ')}`)
    const preferredNextByCursor = getPreferredNextUpdates(navigation, leaf.id)
    let cursorId: string | null = null

    for (let moveIndex = 0; moveIndex < path.length; moveIndex += 1) {
      const next = getNextNavigationNode(
        navigation,
        cursorId,
        preferredNextByCursor,
      )
      assert.ok(
        next,
        `${positionNumber} cannot navigate forward to ${path.slice(0, moveIndex + 1).join(' ')}`,
      )
      assert.deepEqual(
        next.path,
        path.slice(0, moveIndex + 1),
        `${positionNumber} forward navigation diverges at ${path.slice(0, moveIndex + 1).join(' ')}`,
      )
      cursorId = next.id
      forwardNavigationPlyCount += 1
    }

    assert.equal(
      getNextNavigationNode(navigation, cursorId, preferredNextByCursor),
      undefined,
      `${positionNumber} source leaf must not navigate into an unrecorded branch`,
    )

    for (let pathLength = path.length; pathLength > 0; pathLength -= 1) {
      const previous = getPreviousNavigationNode(navigation, cursorId)

      if (pathLength === 1) {
        assert.equal(
          previous,
          null,
          `${positionNumber} Previous must return the first source move to Reset`,
        )
        cursorId = null
      } else {
        assert.ok(
          previous,
          `${positionNumber} Previous is missing before ${path.slice(0, pathLength).join(' ')}`,
        )
        assert.deepEqual(
          previous.path,
          path.slice(0, pathLength - 1),
          `${positionNumber} Previous diverges before ${path.slice(0, pathLength).join(' ')}`,
        )
        cursorId = previous.id
      }

      previousNavigationPlyCount += 1
    }
  }
}

assert.equal(expectedLeafKeys.size, 58)
assert.equal(forwardNavigationPlyCount, 480)
assert.equal(previousNavigationPlyCount, 480)

assertSourceParent('5.5', ['Rh5+', 'Kd4', 'Kc6', 'c4', 'Kb5', 'c3', 'Kb4', 'c2', 'Rc5', 'Kd3'])
assertSourceParent('5.8', ['Ra2+', 'Kf1'])
assertSourceParent('5.9', ['Re2', 'e4'])
assertSourceParent('5.13', ['Rb8+', 'Ka1', 'Kc2'])
assertSourceParent('5.14', ['Kb2', 'Rb8+'])
assertSourceParent('5.14', ['Kb2', 'Rb8+', 'Kc1', 'Ra8'])
assertSourceParent('5.14', ['Kb2', 'Rb8+', 'Kc1', 'Kc3', 'a2', 'Ra8', 'Kb1', 'Rb8+', 'Ka1'])
assertSourceParent('5.11', ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2'])
assertSourceParent('5.11', ['Rc7+', 'Kb3', 'Kd7', 'b4', 'Kd6', 'Ka2', 'Kc5', 'b3', 'Kb4', 'b2'])

console.log(
  `Chapter 5 source fidelity passed (${pageCopyUnits.length} page units, ${expectedBoards.length} boards, ${expectedLeafKeys.size} expanded replay leaves)`,
)

function assertSourceParent(positionNumber: string, path: string[]) {
  assert.ok(
    tokenByPath.has(playbackPathKey(positionNumber, path)),
    `${positionNumber} must expose source path ${path.join(' ')}`,
  )
}

function canonicalStringify(value: unknown): string {
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

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getSourcePathInitialFen(positionNumber: string, path: string[]) {
  const board = expectedBoards.find(({ number }) => number === positionNumber)
  assert.ok(board, `Missing source board for ${positionNumber}`)

  // The printed continuation from Analysis diagram 5.10 starts at move 2.
  // FEN clocks are replay scaffolding rather than printed board facts, so use
  // the independently reconstructed source parent without rewriting book data.
  if (positionNumber === '5.10') {
    return board.fen.replace(/ 0 1$/, ' 0 2')
  }

  if (
    (positionNumber === '5.1' && path[0] === 'c3') ||
    (positionNumber === '5.5' && path[0] === 'c4')
  ) {
    return board.fen.replace(/ w /, ' b ')
  }

  return board.fen
}

function getVisibleSourceText(section: RawChapterSection) {
  if (typeof section.content === 'string') {
    return section.content
  }

  if (!section.content || typeof section.content !== 'object') {
    return ''
  }

  return Object.entries(section.content)
    .filter(([key]) =>
      ['caption', 'displayLabel', 'number', 'text', 'title'].includes(key),
    )
    .map(([, value]) => (typeof value === 'string' ? value : ''))
    .join('\n')
}

function playbackPathKey(positionNumber: string, path: string[]) {
  return `${positionNumber}\u001e${path.join('\u001f')}`
}

function renderPosition(sectionIndex: number) {
  return renderToStaticMarkup(
    <PositionStudyGroup
      activeBoards={{}}
      activePositionNumber={null}
      group={{ contentIndexes: [], index: sectionIndex, type: 'positionGroup' }}
      navigationByPosition={navigationByPosition}
      onAnchorSelect={() => undefined}
      onBookNavigate={() => undefined}
      onMoveClick={() => undefined}
      onPositionReset={() => undefined}
      onPositionStep={() => undefined}
      playback={playback}
      referencesBySectionIndex={new Map()}
      sections={sections}
    />,
  )
}
