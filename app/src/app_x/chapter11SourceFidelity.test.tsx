import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { Chess } from 'chess.js'
import {
  bookEndingAnchorId,
  bookPathForChapterId,
  bookPositionAnchorId,
  resolveAppRoute,
} from '../routing'
import BookFrontMatter from './BookFrontMatter'
import { PositionStudyGroup } from './ChapterViewer'
import type { RuntimeChapterDefinition } from './chapterRuntime'
import type {
  BookPartSource,
  BookSource,
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
  number: string
  sectionIndex: number
  subtitle?: string
}

type PageCopyExpectation = {
  includes: string[]
  pdfPage: number
  printPage: number
}

type SourceRoot = {
  fen: string
  paths: string[]
}

type MoveToken = Extract<TextPlaybackToken, { type: 'move' }>

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const chapter = getChapter()
const playback = buildChapterPlayback(chapter.sections)
const navigationByPosition = buildPlaybackNavigation(playback)

assert.equal(chapter.sections.length, 76)
assert.deepEqual(
  chapter.sections
    .filter((section) => section.type === 'ending')
    .map((section) => {
      const content = section.content as { number: string; text: string }
      return [content.number, content.text]
    }),
  [
    ['69', 'Central pawns'],
    ['70', "Knight's pawns"],
    ['71', 'Defending king cut off on the back rank'],
    ['72', "Bishop's pawn on 5th rank"],
    ['73', 'The defensive procedure'],
    ['74', 'Blocked connected pawns'],
    ['75', 'Attacking rook stuck in front of the 7th-rank pawn'],
    ['76', 'Vancura Defence against 2 pawns'],
  ],
)

const pageCopyUnits: PageCopyExpectation[] = [
  {
    pdfPage: 154,
    printPage: 153,
    includes: [
      '11. Rook + two Pawns vs. Rook',
      'First scenario',
      'Central pawns',
      'Positions with doubled pawns are generally drawn.',
    ],
  },
  {
    pdfPage: 155,
    printPage: 154,
    includes: [
      'The best defensive procedure consists in starting with the Philidor Position',
      '3...Rc8! holds',
      'Analysis diagram 11.2',
      '4...Rg1!',
    ],
  },
  {
    pdfPage: 156,
    printPage: 155,
    includes: [
      '3.Rh6 (intending Kd6)',
      "Knight's pawns",
      'Second-rank defence',
      'Kolesnikov - Bocharov',
    ],
  },
  {
    pdfPage: 157,
    printPage: 156,
    includes: [
      'right move is:\n1.Rb2!',
      'Second scenario',
      'Against central pawns, defence starts by the Philidor\nPosition',
    ],
  },
  {
    pdfPage: 158,
    printPage: 157,
    includes: [
      'Defending king cut off on the back rank',
      'White threatens 1.h7+',
      '10.f8Q+ Rxf8+',
    ],
  },
  {
    pdfPage: 159,
    printPage: 158,
    includes: [
      "Bishop's pawn on 5th rank",
      'Now Black can follow three possible paths',
      '7.f6 Rg2 8.Rg7 Rf2 9.Rg6+-',
    ],
  },
  {
    pdfPage: 160,
    printPage: 159,
    includes: [
      'Series about rook and bishop\'s pawns.',
      "Defending king cut off on the back rank; bishop's pawn on the 6th rank.",
      "The bishop's pawn must not reach the 6th rank before the rook's pawn has done so.",
    ],
  },
  {
    pdfPage: 161,
    printPage: 160,
    includes: [
      "When the defending king is cut off on the back rank, a bishop's pawn on the 5th rank is the best winning asset.",
      "Bishop's pawn on the 4th rank.",
      '1...Rg1+\n2.Kf6 Rh1',
      'The defensive procedure',
    ],
  },
  {
    pdfPage: 162,
    printPage: 161,
    includes: [
      'Gligoric - Smyslov',
      'Moscow, 1947',
      '1.Rg6+ (1.f5 Rb1!)',
      '2...Rb1!',
    ],
  },
  {
    pdfPage: 163,
    printPage: 162,
    includes: [
      '3.Rc5\nThe white rook again has plenty of space.',
      '17.h6+',
      'Analysis diagram 11.8',
    ],
  },
  {
    pdfPage: 164,
    printPage: 163,
    includes: [
      '17...Kh7!',
      "An important variation. Pushing the rook's pawn",
      'This position would arise after 3.h6',
      '3...Ra1!',
    ],
  },
  {
    pdfPage: 165,
    printPage: 164,
    includes: [
      '6...Rg1+? 7.Kf3 Rh1',
      'The king should avoid being trapped on the back rank',
      'No progress.',
    ],
  },
  {
    pdfPage: 166,
    printPage: 165,
    includes: [
      'Third scenario',
      'Blocked connected pawns',
      '1.Rd4 Rb6 2.Rd8!',
    ],
  },
  {
    pdfPage: 167,
    printPage: 166,
    includes: [
      'Central connected pawns',
      '1.Re4 Rb6 2.Re6+!',
      'Another example of central pawns',
      '1.Kf6 Re1 2.Rg3 Re2',
    ],
  },
  {
    pdfPage: 168,
    printPage: 167,
    includes: [
      'Fourth scenario',
      'Attacking rook stuck in front of the 7th-rank pawn',
      'Position 11.13',
      '1.Kf3 Ra2 2.Ke4',
    ],
  },
  {
    pdfPage: 169,
    printPage: 168,
    includes: [
      'Fifth scenario',
      'Vancura Defence against 2 pawns',
      '1...Re4!',
      '9.Kc5 Rf4 - Vancura',
    ],
  },
]

assert.equal(pageCopyUnits.length, 16)
assert.deepEqual(
  pageCopyUnits.map(({ pdfPage }) => pdfPage),
  Array.from({ length: 16 }, (_, index) => 154 + index),
)
assert.deepEqual(
  pageCopyUnits.map(({ printPage }) => printPage),
  Array.from({ length: 16 }, (_, index) => 153 + index),
)
const visibleChapterText = chapter.sections.map(getVisibleSourceText).join('\n')
for (const unit of pageCopyUnits) {
  for (const expectedText of unit.includes) {
    assert.equal(
      visibleChapterText.includes(expectedText),
      true,
      `PDF ${unit.pdfPage} must retain: ${expectedText}`,
    )
  }
}
for (const staleText of [
  '4...Rc8 5.Ra6 Rb8 6.Ke6 Rc8 7.d6 Rb8',
  '3...Kf8 4.Rg5 Rh1 5.Kg6+-',
  '4...Ra5+ 5.Kf4 Ra4+ 6.Kg5 Ra8 7.Kg6',
  '7.f6 Rg2 8.Rg7 Rf2 9.Kg6+-',
]) {
  assert.equal(visibleChapterText.includes(staleText), false)
}

assert.equal(
  createHash('sha256')
    .update(
      canonicalStringify(
        chapter.sections.filter((section) => section.type !== 'position'),
      ),
    )
    .digest('hex'),
  '41ddedc0e7e3db422b234c853818f681baa5531d361e53f3c5dd35081e0d6eb4',
  'Chapter 11 copy and hierarchy must remain source-authoritative',
)

const expectedBoards: BoardExpectation[] = [
  { sectionIndex: 4, number: '11.1', fen: '3k4/6R1/7r/2KP4/3P4/8/8/8 w - - 0 1' },
  { sectionIndex: 7, number: '11.2', displayLabel: 'Analysis diagram 11.2', fen: 'R7/2k3r1/8/2KP4/3P4/8/8/8 b - - 0 1' },
  { sectionIndex: 13, number: '11.3', subtitle: 'Kolesnikov - Bocharov', caption: 'Sochi 2004', fen: '8/6p1/8/8/1R4pk/r7/6K1/8 w - - 0 1' },
  { sectionIndex: 20, number: '11.4', fen: '6k1/1R6/5P1P/6K1/8/8/8/r7 b - - 0 1' },
  { sectionIndex: 23, number: '11.5', fen: '6k1/1R6/7P/5PK1/8/8/8/2r5 b - - 0 1' },
  { sectionIndex: 27, number: '11.series.6.1', displayLabel: 'White wins', fen: '6k1/1R6/5P1P/6K1/8/8/8/r7 b - - 0 1' },
  { sectionIndex: 28, number: '11.series.6.2', displayLabel: 'Draw', fen: '6k1/1R6/5P2/6KP/8/8/8/r7 b - - 0 1' },
  { sectionIndex: 29, number: '11.series.6.3', displayLabel: 'Draw', fen: '6k1/1R6/5P2/6K1/7P/8/8/r7 b - - 0 1' },
  { sectionIndex: 33, number: '11.series.5.1', displayLabel: 'White wins', caption: 'Analysed', fen: '6k1/1R6/7P/5PK1/8/8/8/r7 b - - 0 1' },
  { sectionIndex: 34, number: '11.series.5.2', displayLabel: 'White wins', caption: 'Same procedure', fen: '6k1/1R6/8/5PKP/8/8/8/r7 b - - 0 1' },
  { sectionIndex: 35, number: '11.series.5.3', displayLabel: 'White wins', caption: 'Same procedure', fen: '6k1/1R6/8/5PK1/7P/8/8/r7 b - - 0 1' },
  { sectionIndex: 39, number: '11.series.4.1', displayLabel: 'Draw', fen: '6k1/1R6/7P/6K1/5P2/8/8/r7 b - - 0 1' },
  { sectionIndex: 40, number: '11.series.4.2', displayLabel: 'White wins', fen: '6k1/1R6/8/6KP/5P2/8/8/r7 b - - 0 1' },
  { sectionIndex: 41, number: '11.series.4.3', displayLabel: 'Draw', fen: '6k1/1R6/8/6K1/5P1P/8/8/r7 b - - 0 1' },
  { sectionIndex: 45, number: '11.6', subtitle: 'Gligoric - Smyslov', caption: 'Moscow, 1947', fen: '8/6k1/R7/1r5P/5PK1/8/8/8 w - - 0 1' },
  { sectionIndex: 47, number: '11.7', fen: '8/5k2/8/6RP/5PK1/8/8/1r6 w - - 0 1' },
  { sectionIndex: 49, number: '11.8', displayLabel: 'Analysis diagram 11.8', fen: '8/6k1/4R2P/5K2/5P2/8/8/r7 b - - 0 1' },
  { sectionIndex: 51, number: '11.9', subtitle: "An important variation. Pushing the rook's pawn", fen: '8/5k2/7P/6R1/5PK1/8/8/1r6 b - - 0 1' },
  { sectionIndex: 57, number: '11.10', fen: '8/8/r5kP/6P1/1R3K2/8/8/8 w - - 0 1' },
  { sectionIndex: 59, number: '11.11', subtitle: 'Central connected pawns', fen: '8/8/r4kP1/5P2/1R3K2/8/8/8 w - - 0 1' },
  { sectionIndex: 63, number: '11.12', fen: '8/4r3/8/5K2/2Pk4/3P3R/8/8 w - - 0 1' },
  { sectionIndex: 68, number: '11.13', displayLabel: 'Position 11.13', fen: 'R7/P5k1/8/8/8/6P1/6K1/r7 w - - 0 1' },
  { sectionIndex: 74, number: '11.14', fen: 'R7/6k1/8/8/P6P/6K1/8/4r3 b - - 0 1' },
]

assert.equal(expectedBoards.length, 23)
assert.deepEqual(
  chapter.sections
    .map((section, sectionIndex) => ({ section, sectionIndex }))
    .filter(({ section }) => section.type === 'position')
    .map(({ section, sectionIndex }) => {
      const content = (section as PositionSection).content
      const board: BoardExpectation = {
        fen: content.fen,
        number: content.number,
        sectionIndex,
      }
      if (content.caption !== undefined) board.caption = content.caption
      if (content.displayLabel !== undefined) {
        board.displayLabel = content.displayLabel
      }
      if (content.subtitle !== undefined) board.subtitle = content.subtitle
      return board
    }),
  expectedBoards,
)

for (const board of expectedBoards) {
  const position = chapter.sections[board.sectionIndex] as PositionSection
  assert.equal(position.content.orientation, 'white')
  const markup = renderPosition(board.sectionIndex)
  const label = board.displayLabel ?? `Position ${board.number}`
  assert.equal(
    markup.includes(`id="${bookPositionAnchorId(board.number)}"`),
    true,
    `${board.number} must expose its deep-link anchor`,
  )
  assert.equal(
    markup.includes(`aria-labelledby="position-${board.number}-heading"`),
    true,
    `${board.number} must have an accessible board label`,
  )
  assert.equal(markupToText(markup).includes(label), true)
  if (board.subtitle) assert.equal(markupToText(markup).includes(board.subtitle), true)
  if (board.caption) assert.equal(markupToText(markup).includes(board.caption), true)

  assert.deepEqual(
    resolveAppRoute(
      bookPathForChapterId('11'),
      `#${bookPositionAnchorId(board.number)}`,
    ).route,
    {
      anchorId: bookPositionAnchorId(board.number),
      chapterId: '11',
      module: 'book',
    },
  )
}

for (const endingNumber of ['69', '70', '71', '72', '73', '74', '75', '76']) {
  assert.deepEqual(
    resolveAppRoute(
      bookPathForChapterId('11'),
      `#${bookEndingAnchorId(endingNumber)}`,
    ).route,
    {
      anchorId: bookEndingAnchorId(endingNumber),
      chapterId: '11',
      module: 'book',
    },
  )
}

const sourceRoots: Record<string, SourceRoot> = {
  "11.1": {
    "fen": "3k4/6R1/7r/2KP4/3P4/8/8/8 w - - 0 1",
    "paths": [
      "Rb7 Rg6 Rb6 Rg4 d6 Rg1 Kc6 Rc1+ Kd5 Rh1 Rb8+ Kd7 Rb7+ Kd8 d7 Rh5+ Kc6 Rh6+ Kc5 Rh5+ d5 Rh6 d6 Rxd6",
      "Rb7 Rg6 Rb6 Rg1 Kc6 Rc1+ Kd6 Kc8 Ra6 Kb8 Ke6 Kc8 d6 Kb8 Ra1 Rc8 Rh1",
      "Rb7 Rg6 Rb6 Rg7 Rb8+ Kc7 Ra8",
      "Rb7 Rg6 Rb6 Rg4 Kc6 Rxd4 Rb8+ Ke7",
      "Rb7 Rg6 Rb6 Rg4 Kc6 Rxd4 Kd6 Kc8 Rc6+ Kd8 Ra6 Kc8 Ra8+ Kb7 Rd8 Rh4",
      "Rb7 Rg6 Rb6 Rg4 Rh6 Kd7 Rh7+ Kd8",
      "Rb7 Rg6 Rb6 Rg4 d6 Rg1 Kc6 Rc1+ Kd5 Rh1 Rb8+ Kd7 Rb7+ Kd8 d7 Ke7"
    ]
  },
  "11.2": {
    "fen": "R7/2k3r1/8/2KP4/3P4/8/8/8 b - - 0 1",
    "paths": [
      "Rg1 Ra7+ Kc8 Kc6 Rc1+ Kd6 Rc4 Ke5 Rb4 Ra6 Kd7",
      "Rg6 d6+ Kd7 Ra7+ Kd8 Kc6",
      "Rg1 Ra7+ Kc8 Kc6 Rc1+ Kd6 Rc4 Ke5 Kd8 Ra6 Rb4 Kd6 Kc8 Ra8+ Kb7 Kc5 Rb1 Rh8 Kc7 Rh7+ Kc8 Kc6 Rc1+ Kd6"
    ]
  },
  "11.3": {
    "fen": "8/6p1/8/8/1R4pk/r7/6K1/8 w - - 0 1",
    "paths": [
      "Rb2 Ra4 Rc2 g5 Rb2 g3 Rb8",
      "Rb2 Ra4 Rb3 Ra2+ Kg1 g3 Rb8",
      "Rb7 Ra2+ Kg1 Kh3 Rxg7 Kg3 Kf1 Ra1+ Ke2 Rg1",
      "Rb8 Ra2+ Kg1 Kh3 Rb3+ g3 Rb1 Ra3 Rc1 g5 Rb1 g4 Rc1 g2 Rb1 Rf3 Ra1 Rf1+ Rxf1 gxf1=Q+ Kxf1 Kh2"
    ]
  },
  "11.4": {
    "fen": "6k1/1R6/5P1P/6K1/8/8/8/r7 b - - 0 1",
    "paths": [
      "Rg1+ Kf5 Rf1+ Ke6 Re1+ Kd6 Rd1+ Ke7 Re1+ Kd8 Rd1+ Ke8 Re1+ Re7 Rf1 f7+ Kh8 Re6",
      "Rg1+ Kf5 Rf1+ Ke5 Re1+ Kd4 Rd1+ Kc3 Rf1 h7+ Kh8 f7 Rxf7",
      "Rg1+ Kf5 Rf1+ Ke5 Re1+ Kd4 Rd1+ Kc3 Rf1 Rg7+ Kh8 f7 Rc1+ Kd4 Rc4+",
      "Rg1+ Kf5 Rf1+ Ke6 Re1+ Kd7 Kf7",
      "Rg1+ Kf5 Rf1+ Ke6 Re1+ Kd6 Rd1+ Ke7 Re1+ Kd8 Rf1 h7+ Kh8 Rb8 Kxh7 Ke7 Re1+ Kf8",
      "Rg1+ Kf5 Rf1+ Ke6 Re1+ Kd6 Rd1+ Ke7 Re1+ Kd8 Rd1+ Ke8 Re1+ Re7 Rf1 f7+ Kh8 f8=Q+ Rxf8+ Kxf8"
    ]
  },
  "11.5": {
    "fen": "6k1/1R6/7P/5PK1/8/8/8/2r5 b - - 0 1",
    "paths": [
      "Rg1+ Kf6 Rh1 Rg7+ Kf8 Kg6 Rg1+ Kh7 Rf1 Ra7 Rg1 f6 Rg2 Rg7 Rf2 Rg6",
      "Rg1+ Kf6 Rf1 Rg7+ Kh8 Re7 Kg8 Re8+ Kh7 Ke6 Kxh6 f6",
      "Rg1+ Kf6 Rf1 Rg7+ Kh8 Re7 Kg8 Re8+ Kh7 Ke6 Kxh6 f6 Re1+",
      "Rg1+ Kf6 Rf1 Rg7+ Kf8 Kg5 Rh1 Kg6",
      "Rg1+ Kf6 Rf1 Rg7+ Kh8 Re7 Kg8 Re8+ Kh7 Ke6 Ra1 f6 Ra6+ Kf5 Ra5+ Re5 Ra8 f7",
      "Rg1+ Kf6 Ra1 Re7 Ra2 Ke5 Re2+ Kd6 Rf2 Ke6 Re2+ Kd7 Rf2 Re8+ Kh7 Ke6 Re2+ Kf7 Ra2 f6 Ra7+ Ke6 Ra6+ Kf5 Ra5+ Re5",
      "Rg1+ Kf6 Ra1 Re7 Ra2 Ke6 Ra6+",
      "Rg1+ Kf6 Ra1 Re7 Ra2 Ke5 Ra5+ Kf4 Ra4+ Kg5 Ra5 Kg6",
      "Rg1+ Kf6 Ra1 Re7 Ra2 Ke5 Re2+ Kd6 Rf2 Ke6 Re2+ Kd7 Rf2 Re8+ Kf7 h7",
      "Rg1+ Kf6 Ra1 Re7 Ra2 Ke5 Re2+ Kd6 Rf2 Ke6 Re2+ Kd7 Rd2+ Ke8 Rf2 Re5 Kh7 Kf7 Kxh6 Re6+ Kh7 f6 Ra2 Kf8",
      "Rg1+ Kf6 Rh1 Rg7+ Kh8 Re7 Rxh6+ Kf7 Ra6 f6 Kh7 Kf8+ Kg6 f7 Kf6 Kg8",
      "Rg1+ Kf6 Rh1 Rg7+ Kf8 Kg6 Rg1+ Kh7 Rf1 Ra7 Rxf5 Kg6 Rf1 Ra8+ Ke7 h7"
    ]
  },
  "11.series.4.1": {
    "fen": "6k1/1R6/7P/6K1/5P2/8/8/r7 b - - 0 1",
    "paths": [
      "Rg1+ Kf6 Rh1"
    ]
  },
  "11.series.4.2": {
    "fen": "6k1/1R6/8/6KP/5P2/8/8/r7 b - - 0 1",
    "paths": [
      "Rh1 f5"
    ]
  },
  "11.6": {
    "fen": "8/6k1/R7/1r5P/5PK1/8/8/8 w - - 0 1",
    "paths": [
      "Rg6+ Kf7 Rg5 Rb1",
      "f5 Rb1",
      "Rg6+ Kh7",
      "Rg6+ Kf7 f5 Rb1 Kg5 Rg1+ Kh6 Rf1 Rg7+ Kf6 Rg8 Kf7"
    ]
  },
  "11.7": {
    "fen": "8/5k2/8/6RP/5PK1/8/8/1r6 w - - 0 1",
    "paths": [
      "Rc5 Kf6 Rc6+ Kg7 Kg5 Rg1+ Kf5 Ra1 Rc7+ Kh6 Re7 Rb1 Re8 Kg7 Re5 Ra1 Rd5 Rf1 Rd4 Ra1 Rd6 Ra5+ Kg4 Ra1 Re6 Rg1+ Kf5 Ra1 h6+",
      "h6",
      "Rc5 Kf6 Rc6+ Kf7 Kg5 Rg1+ Kf5 Kg7 Rg6+",
      "Rc5 Kf6 Rc6+ Kg7 Kg5 Rg1+ Kf5 Ra1 Rg6+ Kf7",
      "Rc5 Kf6 Rc6+ Kg7 Kg5 Rg1+ Kf5 Ra1 Rc7+ Kh6 Kf6 Kxh5",
      "Rc5 Kf6 Rc6+ Kg7 Kg5 Rg1+ Kf5 Ra1 Rc7+ Kh6 Re7 Rb1 Kf6 Kxh5",
      "Rc5 Kf6 Rc6+ Kg7 Kg5 Rg1+ Kf5 Ra1 Rc7+ Kh6 Re7 Rb1 Re8 Ra1",
      "Rc5 Kf6 Rc6+ Kg7 Kg5 Rg1+ Kf5 Ra1 Rc7+ Kh6 Re7 Rb1 Re8 Kg7 Re5 Ra1 Rd5 Rb1",
      "Rc5 Kf6 Rc6+ Kg7 Kg5 Rg1+ Kf5 Ra1 Rc7+ Kh6 Re7 Rb1 Re8 Kg7 Re5 Ra1 Rd5 Rf1 Rd4 Ra1 Rd6 Ra5+ Kg4 Rb5"
    ]
  },
  "11.8": {
    "fen": "8/6k1/4R2P/5K2/5P2/8/8/r7 b - - 0 1",
    "paths": [
      "Kh7 Rd6 Ra2 Kg5 Rg2+ Kf6 Kxh6 Ke7+ Kh7 f5 Re2+ Re6 Ra2 f6 Ra8 Kf7 Kh6 Re1 Ra7+ Re7 Ra8 Rd7 Kh7 Rd1 Ra7+ Ke6 Ra6+ Rd6 Ra8 Rd4 Kg8 Rg4+ Kf8",
      "Kf7 Rb6 Ra5+ Kg4 Ra1 Kg5 Rg1+ Kf5 Ra1 Rb7+ Kg8 Kg6 Rg1+ Kf6 Rh1",
      "Kh7 Rd6 Ra2 Kg5 Rg2+ Kh5 Rh2+",
      "Kh7 Rd6 Ra2 Kg5 Rg2+ Kf5 Ra2",
      "Kh7 Rd6 Ra2 Kg5 Rg2+ Kf6 Kxh6 Ke7+ Kg7 f5 Re2+ Re6 Rf2 f6+ Kg6 Re1 Ra2",
      "Kh7 Rd6 Ra2 Kg5 Rg2+ Kf6 Kxh6 Ke7+ Kg7 f5 Re2+ Re6 Ra2 f6+ Kh7 f7",
      "Kh7 Rd6 Ra2 Kg5 Rg2+ Kf6 Kxh6 Ke7+ Kh7 f5 Re2+ Re6 Ra2 f6 Ra8 Kf7 Rb8"
    ]
  },
  "11.9": {
    "fen": "8/5k2/7P/6R1/5PK1/8/8/1r6 b - - 0 1",
    "paths": [
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rh1 Kf3 Kf5 Rf7+ Kg6 Rb7 Kf5 Kg3 Kf6 Kg4 Kg6",
      "Rg1+ Kf5 Rh1 Rg7+ Kf8 Kg6 Rg1+ Kh7 Rf1 Ra7 Rxf4 Kg6 Rg4+ Kf6 Rf4+ Kg5 Rf1 Ra8+ Kf7 h7",
      "Rg1+ Kf5 Rh1 Rg7+ Kf8 Kg6 Rg1+ Kh7 Rf1 Rg4 Kf7",
      "Rg1+ Kf5 Rh1 Rg7+ Kf8 Kg6 Rg1+ Kh7 Rf1 Ra7 Rxf4 Kg6 Rg4+ Kf6 Kg8 Rg7+",
      "Ra1 Kf5 Ra5+",
      "Ra1 h7 Rg1+ Kf5 Rh1",
      "Ra1 Rh5 Kg8 f5 Kh7 Rh3 Rg1+ Kh5 Rf1 Kg5 Rg1+ Kf6 Ra1 Re3 Ra2 Re6 Kxh6",
      "Ra1 Rg7+ Kf6 Rc7 Rg1+ Kf3 Rh1",
      "Ra1 Rg7+ Kf6 Rc7 Rh1 Rc6+ Kf7 Kg5",
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rh1 f5+ Kf6",
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rh1 Rc5 Rg1+",
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rg1+ Kf3 Rh1 Ke4 Rh5 Ra7 Rh1 Rd7 Rh5 Rc7 Rh1 Kd5 Rd1+ Kc6 Rc1+ Kd7 Rd1+ Ke8 Ra1 Rd7 Re1+ Re7 Ra1 Kf8 Rh1 Kg8",
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rg1+ Kf3 Rh1 Ke4 Rh5 Ra7 Rh1 Kd5 Rd1+ Ke6 Re1+ Kd6 Rd1+ Ke7 Kxh7",
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rh1 Rb7 Rh2 Rb5 Kg7 Rg5+ Kh8 Rb5 Rh1",
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rh1 Rb7 Rh2 Rb5 Kg7 Kg3 Rxh7",
      "Ra1 Rg7+ Kf6 Rc7 Kg6 h7 Rh1 Rb7 Rh2 Rb5 Kg7 f5 Rxh7"
    ]
  },
  "11.10": {
    "fen": "8/8/r5kP/6P1/1R3K2/8/8/8 w - - 0 1",
    "paths": [
      "Rd4 Rb6 Rd8 Rb4+ Ke5 Rb7 Rg8+ Kh7 Re8 Kg6 Kf4 Rb4+ Ke5 Rb7",
      "Rd4 Rb6 Rd8 Rb4+ Ke5 Kxg5 h7",
      "Rd4 Rb6 Rd8 Rb4+ Ke5 Rg4 Rg8+ Kh7 Kf5",
      "Rd4 Rb6 Rd8 Rb4+ Ke5 Rb5+ Rd5 Rb7 Ke6 Rb6+ Ke7 Rb7+ Rd7 Rb5 h7 Rb8",
      "Rd4 Rb6 Rd8 Rb4+ Ke5 Rb7 Kf4",
      "Rd4 Rb6 Rd8 Rb4+ Ke5 Rb7 Rg8+ Kh7 Re8 Rb5+ Kf6 Rxg5"
    ]
  },
  "11.11": {
    "fen": "8/8/r4kP1/5P2/1R3K2/8/8/8 w - - 0 1",
    "paths": [
      "Re4 Rb6 Re6+ Rxe6 fxe6 Kxe6 Kg5"
    ]
  },
  "11.12": {
    "fen": "8/4r3/8/5K2/2Pk4/3P3R/8/8 w - - 0 1",
    "paths": [
      "Kf6 Re1 Rg3 Re2"
    ]
  },
  "11.13": {
    "fen": "R7/P5k1/8/8/8/6P1/6K1/r7 w - - 0 1",
    "paths": [
      "Kf3 Ra2 Ke4 Ra1 Kd5 Ra2 Kc6 Ra1 Kb6 Rb1+ Kc6 Ra1 g4 Ra2 g5 Ra1 g6 Ra2 Kb7 Rb2+"
    ]
  },
  "11.14": {
    "fen": "R7/6k1/8/8/P6P/6K1/8/4r3 b - - 0 1",
    "paths": [
      "Re4 a5 Re5 Kf3 Rh5 Kg3 Rc5 a6 Rc6 Kf4 Kh7 Ke5 Rb6 Kd5 Rg6 Kc5 Rf6 Kb5 Rf5+ Kb6 Rf6+",
      "Ra1 Kf4 Kh7 Ke5 Kg7 a5 Kh7 a6",
      "Re4 h5 Kh7 Kf3 Rh4 Ke3 Rxh5 Kd4 Rg5 Kc4 Rg4+ Kb5 Rg5+ Kb4 Rg4+ Kc5 Rf4"
    ]
  }
}

assert.equal(Object.keys(sourceRoots).length, 16)
const legalPathCount = Object.values(sourceRoots).reduce(
  (count, root) => count + root.paths.length,
  0,
)
const legalPlyCount = Object.values(sourceRoots).reduce(
  (count, root) =>
    count +
    root.paths.reduce(
      (pathCount, path) => pathCount + path.split(/\s+/).length,
      0,
    ),
  0,
)
assert.equal(legalPathCount, 82)
assert.equal(legalPlyCount, 1084)

for (const [sectionIndex, tokens] of playback.tokensBySectionIndex) {
  assert.equal(
    tokens
      .filter((token) => token.type !== 'move' || !token.hidden)
      .map((token) => (token.type === 'text' ? token.text : token.display))
      .join(''),
    getPlayableSectionText(chapter.sections[sectionIndex]),
    `Playback tokenization must preserve Chapter 11 section ${sectionIndex}`,
  )
}

const moveTokens = [...playback.tokensBySectionIndex.values()]
  .flat()
  .filter((token): token is MoveToken => token.type === 'move')
const visibleMoveTokens = moveTokens.filter((token) => !token.hidden)
const hiddenMoveTokens = moveTokens.filter((token) => token.hidden)
assert.equal(visibleMoveTokens.length, 651)
assert.equal(hiddenMoveTokens.length, 1)
assert.equal(moveTokens.length, 652)
assert.deepEqual(
  hiddenMoveTokens.map(({ path, positionNumber, san }) => ({
    path,
    positionNumber,
    san,
  })),
  [{ path: ['Rh1'], positionNumber: '11.series.4.2', san: 'Rh1' }],
)
const sharedRh1Source = moveTokens.find(
  ({ id }) => id === hiddenMoveTokens[0].sourceId,
)
assert.ok(sharedRh1Source)
assert.equal(sharedRh1Source.hidden, undefined)
assert.equal(sharedRh1Source.positionNumber, '11.series.4.1')
assert.equal(sharedRh1Source.san, 'Rh1')

const tokenByPath = new Map<string, MoveToken>()
for (const token of moveTokens) {
  const chess = new Chess(token.parentFen)
  const move = chess.move(token.san, { strict: true })
  assert.ok(move, `Non-replayable emitted SAN: ${token.display}`)
  assert.equal(chess.fen(), token.fen)
  assert.equal(token.path.some((part) => part.startsWith('@')), false)
  const key = playbackPathKey(token.positionNumber, token.path)
  assert.equal(tokenByPath.has(key), false, `Duplicate playback path: ${key}`)
  tokenByPath.set(key, token)
}

const sourceNodes = new Map<
  string,
  { fen: string; parentFen: string; path: string[]; san: string }
>()
const sourceLeafKeys = new Set<string>()
let verifiedPaths = 0
let verifiedPlies = 0
for (const [positionNumber, root] of Object.entries(sourceRoots)) {
  for (const [pathIndex, sourcePathText] of root.paths.entries()) {
    const sourcePath = sourcePathText.split(/\s+/)
    const chess = new Chess(root.fen)
    const path: string[] = []
    const pathTokens: MoveToken[] = []

    for (const [moveIndex, sourceSan] of sourcePath.entries()) {
      const parentFen = chess.fen()
      const move = chess.move(sourceSan, { strict: true })
      assert.ok(move)
      path.push(move.san)
      const key = playbackPathKey(positionNumber, path)
      sourceNodes.set(key, {
        fen: chess.fen(),
        parentFen,
        path: [...path],
        san: move.san,
      })
      const token = tokenByPath.get(key)
      assert.ok(
        token,
        `${positionNumber} path ${pathIndex + 1} is missing ${path.join(' ')}`,
      )
      assert.equal(token.san, move.san)
      assert.equal(token.parentFen, parentFen)
      assert.equal(token.fen, chess.fen())
      assert.deepEqual(token.path, path)
      pathTokens.push(token)
      verifiedPlies += 1

      const navigation = navigationByPosition.get(positionNumber)
      assert.ok(navigation)
      const node = navigation.nodesById.get(token.id)
      assert.ok(node)
      assert.equal(
        node.previousId,
        pathTokens.at(-2)?.id ?? null,
        `${positionNumber} path ${pathIndex + 1} has disconnected Previous at ply ${moveIndex + 1}`,
      )
    }

    const leaf = pathTokens.at(-1)
    assert.ok(leaf)
    const navigation = navigationByPosition.get(positionNumber)
    assert.ok(navigation)
    const preferred = getPreferredNextUpdates(navigation, leaf.id)
    let cursorId: string | null = null
    for (const expectedToken of pathTokens) {
      const next = getNextNavigationNode(navigation, cursorId, preferred)
      assert.equal(
        next?.id,
        expectedToken.id,
        `${positionNumber} path ${pathIndex + 1} cannot traverse with Next`,
      )
      cursorId = next.id
    }
    for (let index = pathTokens.length - 1; index >= 0; index -= 1) {
      const previous = getPreviousNavigationNode(navigation, cursorId)
      if (index === 0) {
        assert.equal(previous, null)
        cursorId = null
      } else {
        assert.equal(previous?.id, pathTokens[index - 1].id)
        cursorId = previous!.id
      }
    }

    sourceLeafKeys.add(playbackPathKey(positionNumber, path))
    verifiedPaths += 1
  }
}
assert.equal(verifiedPaths, 82)
assert.equal(verifiedPlies, 1084)
assert.equal(sourceNodes.size, 652)
assert.equal(tokenByPath.size, sourceNodes.size)
assert.deepEqual(new Set(tokenByPath.keys()), new Set(sourceNodes.keys()))

const actualLeafKeys = new Set(
  moveTokens
    .filter(
      (candidate) =>
        !moveTokens.some(
          (other) =>
            other.positionNumber === candidate.positionNumber &&
            other.path.length > candidate.path.length &&
            candidate.path.every((san, index) => other.path[index] === san),
        ),
    )
    .map((token) => playbackPathKey(token.positionNumber, token.path)),
)
const maximalSourceLeafKeys = new Set(
  [...sourceLeafKeys].filter((candidateKey) => {
    const candidate = tokenByPath.get(candidateKey)
    assert.ok(candidate)
    return ![...sourceLeafKeys].some((otherKey) => {
      const other = tokenByPath.get(otherKey)
      assert.ok(other)
      return (
        other.positionNumber === candidate.positionNumber &&
        other.path.length > candidate.path.length &&
        candidate.path.every((san, index) => other.path[index] === san)
      )
    })
  }),
)
assert.equal(maximalSourceLeafKeys.size, 81)
assert.deepEqual(actualLeafKeys, maximalSourceLeafKeys)

const printedAmbiguousPrefix = ['Rb7', 'Rg6', 'Rb6', 'Rg1', 'Kc6']
assert.ok(
  tokenByPath.has(playbackPathKey('11.1', printedAmbiguousPrefix)),
  'The legal prefix before the printed anomaly must remain playable',
)
assert.equal(
  tokenByPath.has(
    playbackPathKey('11.1', [...printedAmbiguousPrefix, 'Kc8']),
  ),
  false,
  'The sealed replay fixture must not fabricate a playable Kc8 correction',
)
const ambiguousSectionTokens = playback.tokensBySectionIndex.get(6) ?? []
assert.equal(
  ambiguousSectionTokens
    .filter((token) => token.type !== 'move' || !token.hidden)
    .map((token) => (token.type === 'text' ? token.text : token.display))
    .join('')
    .includes('3...Rc8! holds'),
  true,
)
assert.equal(
  ambiguousSectionTokens.some(
    (token) =>
      token.type === 'move' &&
      token.display.replace(/\s+/g, '') === '3...Rc8!',
  ),
  false,
  'The demonstrably impossible source token must remain prose-only',
)
assert.equal(legalPathCount + 1, 83)
assert.equal(legalPlyCount + 6, 1090)
assert.equal(sourceNodes.size + 1, 653)

assert.equal(
  visibleMoveTokens.some(
    ({ display, path, positionNumber }) =>
      display === '7...Re1+' &&
      positionNumber === '11.5' &&
      path.join(' ').endsWith('Kxh6 f6 Re1+'),
  ),
  true,
)
assert.equal(
  visibleMoveTokens.some(
    ({ display, path, positionNumber }) =>
      display === '2.f5' &&
      positionNumber === '11.series.4.2' &&
      path.join(' ') === 'Rh1 f5',
  ),
  true,
)
assert.equal(
  visibleMoveTokens.some(
    ({ display, path, positionNumber }) =>
      display === '3.h6' &&
      positionNumber === '11.7' &&
      path.join(' ') === 'h6',
  ),
  true,
)

const frontMatterMarkup = renderToStaticMarkup(
  <BookFrontMatter
    chapters={
      book.parts.filter(({ id }) => /^\d+$/.test(id)) as unknown as RuntimeChapterDefinition[]
    }
    onNavigate={() => undefined}
  />,
)
const frontMatterText = markupToText(frontMatterMarkup)
for (const expectedText of [
  'sixth-rank series, first diagram',
  'is captioned “Draw”',
  'print page 159; PDF page 160',
  'this digital edition captions it “White wins.”',
  'sixth-rank series, second diagram',
  'is captioned “White wins”',
  'this digital edition captions it “Draw.”',
  'is printed as a second “Position 11.12”',
  'print page 167; PDF page 168',
  'numbers it Position 11.13',
  'prints “3...Rc8!” after “2...Rg1?! 3.Kc6”',
  'print page 154; PDF page 155',
  'preserves the source text without making that move playable',
]) {
  assert.equal(
    frontMatterText.includes(expectedText),
    true,
    `About must disclose: ${expectedText}`,
  )
}
for (const number of [
  '11.series.6.1',
  '11.series.6.2',
  '11.13',
  '11.1',
]) {
  const href = `${bookPathForChapterId('11')}#${bookPositionAnchorId(number)}`
  assert.equal(
    frontMatterMarkup.includes(`href="${escapeAttribute(href)}"`),
    true,
    `About correction must link to ${href}`,
  )
}

console.log(
  'Chapter 11 source fidelity passed (16 page units, 23 boards, 39 total units; 82 legal playable paths / 1084 plies / 652 canonical transitions; 1 separately inventoried six-ply impossible source obligation; 3 governed corrections)',
)

function canonicalStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalStringify).join(',') + ']'
  }
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(
          ([key, entryValue]) =>
            JSON.stringify(key) + ':' + canonicalStringify(entryValue),
        )
        .join(',') +
      '}'
    )
  }
  return JSON.stringify(value)
}

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
}

function getChapter(): BookPartSource {
  const part = book.parts.find(({ id }) => id === '11')
  assert.ok(part)
  return part
}

function getPlayableSectionText(section: RawChapterSection) {
  if (section.type === 'text' && typeof section.content === 'string') {
    return section.content
  }
  if (
    section.type === 'panel' &&
    section.content &&
    typeof section.content === 'object' &&
    'text' in section.content &&
    typeof section.content.text === 'string'
  ) {
    return section.content.text
  }
  return ''
}

function getVisibleSourceText(section: RawChapterSection) {
  if (typeof section.content === 'string') return section.content
  if (!section.content || typeof section.content !== 'object') return ''
  return Object.entries(section.content)
    .filter(([key]) =>
      ['caption', 'displayLabel', 'number', 'subtitle', 'text', 'title'].includes(
        key,
      ),
    )
    .map(([, value]) => (typeof value === 'string' ? value : ''))
    .join('\n')
}

function markupToText(markup: string) {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/\s+/g, ' ')
    .trim()
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
      sections={chapter.sections}
    />,
  )
}
