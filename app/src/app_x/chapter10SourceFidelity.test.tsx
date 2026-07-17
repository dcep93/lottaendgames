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
  BookSource,
  PositionSection,
  RawChapterSection,
} from './chapterTypes'
import { buildLichessAnalysisUrl } from './lichess'
import { buildChapterPlayback, type TextPlaybackToken } from './moveParser'
import {
  buildPlaybackNavigation,
  getNextNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationFen,
  getPreviousNavigationNode,
  type NavigationNode,
} from './playbackNavigation'

type BoardExpectation = {
  displayLabel?: string
  fen: string
  markers?: string[]
  number: string
  sectionIndex: number
  subtitle?: string
}

type PageCopyExpectation = {
  includes: string[]
  pdfPage: number
  printPage: number
}

type SourcePath = {
  id: string
  moves: string[]
  start: string
}

type MoveToken = Extract<TextPlaybackToken, { type: 'move' }>

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const chapter = getPart('10')
const playback = buildChapterPlayback(chapter.sections)
const navigationByPosition = buildPlaybackNavigation(playback)

assert.equal(chapter.sections.length, 127)
assert.deepEqual(
  chapter.sections
    .filter(
      (section) =>
        section.type === 'heading' &&
        typeof section.content === 'string' &&
        section.content.startsWith('Section '),
    )
    .map((section) => section.content),
  [
    'Section 1. Basic endings',
    'Section 2. Pawn on 5th rank or less',
    'Section 3. Cutting off the king along files',
    'Section 4. Cutting off the king along ranks',
    "Section 5. The rook's pawn",
  ],
)

const expectedEndings = [
  ['52', 'The Philidor Position'],
  ['53', 'Lucena Position. The bridge'],
  ['54', 'The long side'],
  ['55', "The knight's pawn. First-rank defence"],
  ['56', 'Central pawns. Kling and Horwitz (K&H) defensive technique'],
  ['57', 'Central 6th-rank pawn. Rook with distant effectiveness'],
  ['58', 'Central 6th-rank pawn. Rook without distant effectiveness'],
  ['59', 'Cutting off along one file'],
  ['60', "Defending king cut off by two files. Grigoriev's combined method"],
  ['61', 'King cut off along two files vs. long side. Mating themes'],
  ['62', 'Perfect cut along a rank'],
  ['63', 'Imperfect Cut along a rank'],
  ['64', 'Apparent Cut along a rank'],
  ['65', 'Pawn on the 7th rank. Attacking rook in front of the pawn'],
  ['66', 'Pawn on the 6th rank. The Vancura Defence'],
  ['67', 'The king is in front of the pawn and the pawn is on the 7th rank'],
  ['68', 'The rook and the king support the pawn'],
] as const
assert.deepEqual(
  chapter.sections
    .filter((section) => section.type === 'ending')
    .map((section) => {
      const content = section.content as { number: string; text: string }
      return [content.number, content.text]
    }),
  expectedEndings,
)

const pageCopyUnits: PageCopyExpectation[] = [
  {
    pdfPage: 124,
    printPage: 123,
    includes: [
      '10. Rook + Pawn vs. Rook',
      'Practical aspects',
      'Technical aspects',
      '(Section 5)',
    ],
  },
  {
    pdfPage: 125,
    printPage: 124,
    includes: [
      'Section 1. Basic endings',
      'The Philidor Position',
      'DT: Distant (rear) checks, cut-off king',
    ],
  },
  {
    pdfPage: 126,
    printPage: 125,
    includes: ['Lucena Position. The bridge'],
  },
  {
    pdfPage: 127,
    printPage: 126,
    includes: ['This position owes its name to Lucena', 'Analysis diagram 10.3'],
  },
  {
    pdfPage: 128,
    printPage: 127,
    includes: ['Second method: 3.Ra1', 'Section 2. Pawn on 5th rank or less'],
  },
  {
    pdfPage: 129,
    printPage: 128,
    includes: ['The long side'],
  },
  {
    pdfPage: 130,
    printPage: 129,
    includes: ['Central pawns. Kling and Horwitz (K&H) defensive technique'],
  },
  {
    pdfPage: 131,
    printPage: 130,
    includes: ['Analysis diagram 10.7'],
  },
  {
    pdfPage: 132,
    printPage: 131,
    includes: ['Analysis diagram 10.8'],
  },
  {
    pdfPage: 133,
    printPage: 132,
    includes: ['Central 6th-rank pawn. Rook with distant effectiveness'],
  },
  {
    pdfPage: 134,
    printPage: 133,
    includes: ['Analysis diagram 10.10'],
  },
  {
    pdfPage: 135,
    printPage: 134,
    includes: ['Central 6th-rank pawn. Rook without distant effectiveness'],
  },
  {
    pdfPage: 136,
    printPage: 135,
    includes: ['Analysis diagram 10.12', 'Summary of Section 2'],
  },
  {
    pdfPage: 137,
    printPage: 136,
    includes: ['Section 3. Cutting off the king along files'],
  },
  {
    pdfPage: 138,
    printPage: 137,
    includes: ['Cutting off along one file', 'Analysis diagram 10.14'],
  },
  {
    pdfPage: 139,
    printPage: 138,
    includes: ["Defending king cut off by two files. Grigoriev's combined method"],
  },
  {
    pdfPage: 140,
    printPage: 139,
    includes: ['1.Kb4 Rb8+ 2.Ka5 Rc8!?'],
  },
  {
    pdfPage: 141,
    printPage: 140,
    includes: ['King cut off along two files vs. long side. Mating themes'],
  },
  {
    pdfPage: 142,
    printPage: 141,
    includes: ['Section 4. Cutting off the king along ranks', "Knight's pawn"],
  },
  {
    pdfPage: 143,
    printPage: 142,
    includes: ["Bishop's pawn"],
  },
  {
    pdfPage: 144,
    printPage: 143,
    includes: ['Perfect Cut with a 3rd-rank central pawn'],
  },
  {
    pdfPage: 145,
    printPage: 144,
    includes: ['as in Position 10.20', 'Imperfect Cut along a rank'],
  },
  {
    pdfPage: 146,
    printPage: 145,
    includes: ["Section 5. The rook's pawn", 'Apparent Cut along a rank'],
  },
  {
    pdfPage: 147,
    printPage: 146,
    includes: ['Pawn on the 6th rank. The Vancura Defence'],
  },
  {
    pdfPage: 148,
    printPage: 147,
    includes: ['2...Rf1+'],
  },
  {
    pdfPage: 149,
    printPage: 148,
    includes: ['Vancura Defence (II)', '2...Rf1+! 3.Ke4 Rf6'],
  },
  {
    pdfPage: 150,
    printPage: 149,
    includes: ['Analysis diagram 10.25', '5.Kd4 Rb6! 6.Kc5 Rf6'],
  },
  {
    pdfPage: 151,
    printPage: 150,
    includes: ['The king is in front of the pawn and the pawn is on the 7th rank'],
  },
  {
    pdfPage: 152,
    printPage: 151,
    includes: ['Summary of the ideas in this ending for the strong side'],
  },
  {
    pdfPage: 153,
    printPage: 152,
    includes: ['The rook and the king support the pawn'],
  },
]

assert.equal(pageCopyUnits.length, 30)
assert.deepEqual(
  pageCopyUnits.map(({ pdfPage }) => pdfPage),
  Array.from({ length: 30 }, (_, index) => 124 + index),
)
assert.deepEqual(
  pageCopyUnits.map(({ printPage }) => printPage),
  Array.from({ length: 30 }, (_, index) => 123 + index),
)

const visibleSourceText = chapter.sections.map(getVisibleSourceText).join('\n')
for (const unit of pageCopyUnits) {
  for (const expectedText of unit.includes) {
    assert.equal(
      visibleSourceText.includes(expectedText),
      true,
      'PDF ' + unit.pdfPage + ' must retain: ' + expectedText,
    )
  }
}
for (const removedSourceError of [
  '(Section 6)',
  '(as in Position 10.19)',
  '2...Rf1+! 3.Ke4 Kf6',
  '5.Kd4 Rb6! 6.Kc5 Kf6',
]) {
  assert.equal(
    visibleSourceText.includes(removedSourceError),
    false,
    'Corrected Chapter 10 copy must exclude: ' + removedSourceError,
  )
}

assert.equal(
  createHash('sha256')
    .update(
      canonicalStringify(
        chapter.sections.filter((section) => section.type !== 'position'),
      ),
    )
    .digest('hex'),
  'f95be3ed2b48ea4e595b28703d3018bbd54f19b8ad3b59e6484ddb02419fea09',
  'Chapter 10 copy and hierarchy must remain source-authoritative',
)

const expectedBoards: BoardExpectation[] = [
  {
    sectionIndex: 11,
    number: '10.1',
    fen: '5k2/R7/8/3KP3/8/6r1/8/8 b - - 0 1',
  },
  {
    sectionIndex: 20,
    number: '10.2',
    fen: '3K4/3P1k2/8/8/8/8/7r/4R3 b - - 0 1',
  },
  {
    sectionIndex: 22,
    number: '10.3',
    fen: '3K4/3P2k1/8/8/5R2/8/2r5/8 b - - 0 1',
    displayLabel: 'Analysis diagram 10.3',
  },
  {
    sectionIndex: 29,
    number: '10.4',
    fen: '4K3/4P1k1/8/8/8/8/r7/5R2 b - - 0 1',
  },
  {
    sectionIndex: 32,
    number: '10.5',
    fen: '1k6/7R/8/KP6/8/8/8/2r5 w - - 0 1',
  },
  {
    sectionIndex: 38,
    number: '10.6',
    fen: '4k3/7R/8/3KPr2/8/8/8/8 b - - 0 1',
  },
  {
    sectionIndex: 40,
    number: '10.7',
    fen: '5k2/7R/4K3/4P3/8/8/8/3r4 w - - 0 1',
    displayLabel: 'Analysis diagram 10.7',
  },
  {
    sectionIndex: 42,
    number: '10.8',
    fen: '4R3/2k5/4K3/4P3/8/8/4r3/8 w - - 0 1',
    displayLabel: 'Analysis diagram 10.8',
  },
  {
    sectionIndex: 48,
    number: '10.9',
    fen: 'r7/3RK1k1/4P3/8/8/8/8/8 w - - 0 1',
  },
  {
    sectionIndex: 50,
    number: '10.10',
    fen: 'r7/4K1k1/3RP3/8/8/8/8/8 b - - 0 1',
    displayLabel: 'Analysis diagram 10.10',
  },
  {
    sectionIndex: 54,
    number: '10.11',
    fen: '1r6/R3K1k1/4P3/8/8/8/8/8 w - - 0 1',
  },
  {
    sectionIndex: 56,
    number: '10.12',
    fen: '3K4/1r6/4Pk2/8/8/8/8/R7 w - - 0 1',
    displayLabel: 'Analysis diagram 10.12',
  },
  {
    sectionIndex: 64,
    number: '10.13',
    fen: '7r/8/4k3/8/2P5/2K5/8/3R4 b - - 0 1',
  },
  {
    sectionIndex: 66,
    number: '10.14',
    fen: '2r5/4k3/K7/8/2PR4/8/8/8 b - - 0 1',
    displayLabel: 'Analysis diagram 10.14',
  },
  {
    sectionIndex: 71,
    number: '10.15',
    fen: '2r5/8/5k2/8/2P5/2K5/8/4R3 w - - 0 1',
  },
  {
    sectionIndex: 75,
    number: '10.16',
    fen: '3r4/8/k7/8/3P4/3K4/8/1R6 w - - 0 1',
  },
  {
    sectionIndex: 84,
    number: '10.17',
    fen: '1r6/8/8/2R5/1P1k4/1K6/8/8 b - - 0 1',
    subtitle: "Knight's pawn",
  },
  {
    sectionIndex: 86,
    number: '10.18',
    fen: '2r5/8/8/3R4/2P1k3/2K5/8/8 b - - 0 1',
    subtitle: "Bishop's pawn",
  },
  {
    sectionIndex: 89,
    number: '10.19',
    fen: '3r4/8/8/8/7R/3P1k2/3K4/8 b - - 0 1',
    subtitle: 'Perfect Cut with a 3rd-rank central pawn',
  },
  {
    sectionIndex: 92,
    number: '10.20',
    fen: '2r5/8/7R/4k3/2P5/2K5/8/8 b - - 0 1',
  },
  {
    sectionIndex: 96,
    number: '10.21',
    fen: '4r3/8/8/5R2/4P1k1/4K3/8/8 b - - 0 1',
  },
  {
    sectionIndex: 105,
    number: '10.22',
    fen: 'R7/P4k2/8/8/8/8/6K1/r7 b - - 0 1',
    markers: [
      'b7:*:defensive zone',
      'c7:*:defensive zone',
      'g7:*:defensive zone',
      'h7:*:defensive zone',
      'b6:*:defensive zone',
      'c6:*:defensive zone',
    ],
  },
  {
    sectionIndex: 110,
    number: '10.23',
    fen: 'R7/5k2/P7/8/8/8/6K1/r7 b - - 0 1',
    markers: [
      'e8:*:mined file',
      'e7:*:mined file',
      'e6:*:mined file',
      'e5:*:mined file',
      'e4:*:mined file',
      'e3:*:mined file',
      'e2:*:mined file',
      'e1:*:mined file',
    ],
  },
  {
    sectionIndex: 112,
    number: '10.24',
    fen: 'R7/6k1/P7/8/8/5K2/8/r7 b - - 0 1',
    markers: [
      'e6:*:drawing zone',
      'f5:*:drawing zone',
      'g5:*:drawing zone',
      'h5:*:drawing zone',
      'f4:*:drawing zone',
      'g4:*:drawing zone',
      'h4:*:drawing zone',
      'e3:*:drawing zone',
      'g3:*:drawing zone',
      'h3:*:drawing zone',
      'd2:*:drawing zone',
      'e2:*:drawing zone',
      'f2:*:drawing zone',
      'g2:*:drawing zone',
      'h2:*:drawing zone',
    ],
  },
  {
    sectionIndex: 114,
    number: '10.25',
    fen: '8/P6R/5k2/r7/4K3/8/8/8 b - - 0 1',
    displayLabel: 'Analysis diagram 10.25',
  },
  {
    sectionIndex: 120,
    number: '10.26',
    fen: 'K7/P4k2/8/8/8/8/4R3/1r6 w - - 0 1',
    markers: [
      'e8:*:cut-off file',
      'e7:*:cut-off file',
      'e6:*:cut-off file',
      'e5:*:cut-off file',
      'e4:*:cut-off file',
      'e3:*:cut-off file',
      'e2:*:cut-off file',
      'e1:*:cut-off file',
    ],
  },
  {
    sectionIndex: 125,
    number: '10.27',
    fen: '8/1K1k4/2R5/P7/8/8/8/7r b - - 0 1',
  },
]

assert.equal(expectedBoards.length, 27)
assert.equal(pageCopyUnits.length + expectedBoards.length, 57)
assert.deepEqual(
  chapter.sections
    .map((section, sectionIndex) => ({ section, sectionIndex }))
    .filter(
      (
        entry,
      ): entry is { section: PositionSection; sectionIndex: number } =>
        entry.section.type === 'position',
    )
    .map(({ section, sectionIndex }) => ({
      number: section.content.number,
      sectionIndex,
    })),
  expectedBoards.map(({ number, sectionIndex }) => ({ number, sectionIndex })),
)
assert.equal(playback.playablePositions.size, 27)

for (const expectation of expectedBoards) {
  const section = chapter.sections[expectation.sectionIndex] as PositionSection
  assert.equal(section.type, 'position')
  assert.deepEqual(
    {
      caption: section.content.caption,
      displayLabel: section.content.displayLabel,
      fen: section.content.fen,
      markers: section.content.markers?.map(
        ({ meaning, square, symbol }) =>
          square + ':' + symbol + ':' + meaning,
      ),
      number: section.content.number,
      orientation: section.content.orientation,
      subtitle: section.content.subtitle,
    },
    {
      caption: undefined,
      displayLabel: expectation.displayLabel,
      fen: expectation.fen,
      markers: expectation.markers,
      number: expectation.number,
      orientation: 'white',
      subtitle: expectation.subtitle,
    },
  )
  assert.equal(expectation.fen.split(' ').length, 6)
  assert.doesNotThrow(() => new Chess(expectation.fen))

  const markup = renderPosition(expectation.sectionIndex)
  const label = expectation.displayLabel ?? expectation.number
  assert.equal(
    markup.includes('id="' + bookPositionAnchorId(expectation.number) + '"'),
    true,
  )
  assert.equal(markup.includes('data-playable="true"'), true)
  assert.equal(markup.includes('<figcaption>'), true)
  assert.equal(markup.includes('>' + escapeText(label) + '<'), true)
  assert.equal(
    markup.includes('aria-label="Chess position ' + expectation.number + '"'),
    true,
  )
  assert.equal(markup.includes('aria-label="Position controls"'), true)
  assert.equal(markup.includes('aria-label="Previous move"'), true)
  assert.equal(markup.includes('aria-label="Next move"'), true)
  assert.equal(markup.includes('>Reset<'), true)
  assert.equal(markup.includes('>Lichess ↗<'), true)

  const positionRoute = resolveAppRoute(
    bookPathForChapterId('10'),
    '#' + bookPositionAnchorId(expectation.number),
  ).route
  assert.equal(positionRoute.module, 'book')
  assert.equal(
    positionRoute.module === 'book' ? positionRoute.anchorId : null,
    bookPositionAnchorId(expectation.number),
  )

  const navigation = navigationByPosition.get(expectation.number)
  assert.ok(navigation)
  const lichessUrl = buildLichessAnalysisUrl({
    currentCursorId: null,
    initialFen: expectation.fen,
    navigation,
    preferredNextByCursor: {},
  })
  assert.ok(lichessUrl)
  assert.equal(
    decodeURIComponent(lichessUrl).includes(
      '[FEN "' + expectation.fen + '"]',
    ),
    true,
    'Lichess export must preserve the exact FEN for ' + expectation.number,
  )
}

const chapterRoute = resolveAppRoute(bookPathForChapterId('10'), '').route
assert.equal(chapterRoute.module, 'book')
assert.equal(
  chapterRoute.module === 'book' ? chapterRoute.chapterId : null,
  '10',
)
for (const [endingNumber] of expectedEndings) {
  const anchorId = bookEndingAnchorId(endingNumber)
  assert.equal(anchorId, 'e' + endingNumber)
  const route = resolveAppRoute(
    bookPathForChapterId('10'),
    '#' + anchorId,
  ).route
  assert.equal(route.module, 'book')
  assert.equal(route.module === 'book' ? route.anchorId : null, anchorId)
}

const sourcePathFixture = `52-main	10.1	Rg6 e6 Rg1 Kd6 Rd1 Ke5 Re1 Kf6 Rf1
52-deviation	10.1	Rg1 Kd6 Rd1 Ke6 Rd8 Rh7
53-main-bridge	10.2	Rc2 Rf1 Kg7 Rf4 Rc1 Ke7 Re1 Kd6 Rd1 Ke6 Re1 Kd5 Rd1 Rd4
53-2...Ke6	10.2	Rc2 Rf1 Ke6 Ke8
53-second-method	10.2	Rc2 Rf1 Kg7 Ra1 Kf7 Ra8 Rc1 Rc8 Rd1 Kc7 Rc1 Kb6 Rb1 Ka5
53-third-method-main	10.2	Rc2 Rf1 Kg7 Rf5 Kg6 Ke7 Kxf5 d8=Q
53-third-4.Rf8	10.2	Rc2 Rf1 Kg7 Rf5 Kg6 Rf8 Kg7
53-third-4.Rf4	10.2	Rc2 Rf1 Kg7 Rf5 Kg6 Rf4
53-third-4...Re2	10.2	Rc2 Rf1 Kg7 Rf5 Kg6 Ke7 Re2 Kf8 Rd2 Rf7
54-main	10.4	Ra8 Kd7 Ra7 Kd8 Ra8 Kc7 Ra7 Kd6 Ra6 Kc5 Re6
55-main	10.5	Ka6 Rc8 b6 Rf8 Rb7 Ka8 Ra7 Kb8 Rh7 Rg8
55-3...Kc8	10.5	Ka6 Rc8 b6 Rf8 Rb7 Kc8 Ka7
56-1...Rf2	10.6	Rf2
56-2.Ke6-main	10.6	Rf1 Ke6 Kf8 Ra7 Re1
56-2.Ke6-bad	10.6	Rf1 Ke6 Kd8 Rh8 Kc7 Ke7
56-2...Rd1-main	10.6	Rf1 Kd6 Rd1 Ke6 Kf8 Rf7 Ke8 Ra7 Kf8 Ra8 Kg7 Ke7
56-2...Rd1-4...Kg8	10.6	Rf1 Kd6 Rd1 Ke6 Kf8 Rf7 Kg8 Rd7 Re1 Kf6
56-correct-3...Kf8	10.6	Rf1 Kd6 Re1 Ke6 Kf8
56-wait-4.Ra7	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Ra7 Re2
56-wait-4.Kf6	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Kf6 Ke8
56-5.Rh7	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Rh7 Kd8
56-5.Ra8	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Ra8 Re2
56-5.Re8	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Re8
56-7...Kf8	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kf8
56-main-draw	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kd8 Rh8 Kc7 Re8 Rh1 Rf8 Re1
56-9...Re2-main	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kd8 Rh8 Kc7 Re8 Re2 Kf7 Rh2 Rg8 Rh7 Rg7 Rh8 Ke7 Kc6 e6 Kc7 Kf6 Kd8 Kf7 Kc7 Rg1 Rh7 Kg6 Rh8 Rd1
56-10...Rf2	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kd8 Rh8 Kc7 Re8 Re2 Kf7 Rf2 Ke7 Rh2 Rf8
56-11.e6	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kd8 Rh8 Kc7 Re8 Re2 Kf7 Rh2 e6 Rh7 Kg6 Rh1 e7 Kd7
56-13.e6	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kd8 Rh8 Kc7 Re8 Re2 Kf7 Rh2 Rg8 Rh7 Rg7 Rh8 e6 Kd6 e7 Kd7
56-15...Kc6	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kd8 Rh8 Kc7 Re8 Re2 Kf7 Rh2 Rg8 Rh7 Rg7 Rh8 Ke7 Kc6 e6 Kc7 Kf6 Kc6 Rd7
56-15...Kd6	10.6	Rf1 Kd6 Re1 Ke6 Kd8 Rh8 Kc7 Kf6 Kd7 Rh7 Ke8 Ke6 Kd8 Rh8 Kc7 Re8 Re2 Kf7 Rh2 Rg8 Rh7 Rg7 Rh8 Ke7 Kc6 e6 Kc7 Kf6 Kd6 Rd7 Kc6 Rd1 Rh6 Kf7 Rh7 Kg6 Rh2 e7 Re2 Kf7 Rf2 Ke8
57-1.Kd6	10.9	Kd6 Kf8
57-main	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Kg6 Rd7 Kg7 Rc7 Kg6
57-1...Ra1	10.9	Rd8 Ra1 Ke8 Kf6 e7
57-1...Ra6	10.9	Rd8 Ra6
57-2.Ke8	10.9	Rd8 Ra7 Ke8 Kf6
57-2.Kd6	10.9	Rd8 Ra7 Kd6 Ra6 Ke5 Ra5 Rd5 Ra8 Kd6 Kf8
57-2...Ra1	10.9	Rd8 Ra7 Rd7 Ra1 Ke8 Kf6 e7 Ke6
57-3.Rb7	10.9	Rd8 Ra7 Rd7 Ra8 Rb7 Kg6 Kd7 Kf6 e7 Kf7
57-3...Ra1	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Ra1 Ke8 Ra8 Rd8 Ra6 e7 Kf6 Kf8
57-3...Ra7	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Ra7 Ke8
57-3...Kg8	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Kg8 Rd8
57-3...Rb8	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Rb8 Rd8
57-4.Rd7-error	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Rb8 Rd7 Ra8
57-4.Kd7	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Kg6 Kd7 Kf6 e7 Kf7
57-5...Ra1	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Kg6 Rd7 Kg7 Rc7 Ra1 Rd7 Ra2 Ke8 Kf6 e7 Ke6
57-6...Ra8	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Kg6 Rd7 Kg7 Rc7 Ra1 Rd7 Ra8
57-5...Rb8	10.9	Rd8 Ra7 Rd7 Ra8 Rd6 Kg6 Rd7 Kg7 Rc7 Rb8 Ra7
58-main	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Kg6 Ra1 Rb7 Kd8 Rb8 Kc7 Rb2 Re1 Rc2 Kd7 Rd2 Ke8 Ra2 e7
58-1.Ra1	10.11	Ra1 Rb7 Kd8 Rb8 Kc7 Rb2 Rf1 Ra2 e7 Ra7 Kd6 Ra6 Kc5 Re6
58-1.Kd7	10.11	Kd7 Kf6 e7 Kf7
58-1...Kf8	10.11	Kd6 Kf8 Kd7 Kg7 Ke7
58-2...Rb1	10.11	Kd6 Kf6 Kd7 Rb1 e7 Rd1 Ke8
58-2...Kg6	10.11	Kd6 Kf6 Kd7 Kg6 Ra1 Rb7 Kc6 Rb2 Re1
58-3...Rb1-main	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Rb1 Ra8 Rb7 Kd6 Rb6 Kd7 Rb7 Kc6 Re7 Kd6 Rb7 e7
58-3...Rb1-4...Rb2	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Rb1 Ra8 Rb2 Ke8 Rh2 Ra7 Kf6 e7 Rh8 Kd7
58-3...Rb1-5...Kf6	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Rb1 Ra8 Rb7 Kd6 Kf6 Rf8 Kg7 e7
58-alt-5.Kd6	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Kg6 Ra1 Rb7 Kd6 Rb6 Kd7 Rb7 Kc6 Rb8 Kc7
58-analysis-10.12	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Kg6 Ra1 Rb7 Kd8 Kf6 e7 Rb8 Kc7 Re8 Kd6 Rb8 Rf1 Kg7 Kc7 Ra8 Ra1 Re8 Kd7
58-analysis-6...Rxe7	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Kg6 Ra1 Rb7 Kd8 Kf6 e7 Rxe7 Rf1
58-9...Kg7	10.11	Kd6 Kf6 Kd7 Kg7 Ke7 Kg6 Ra1 Rb7 Kd8 Rb8 Kc7 Rb2 Re1 Rc2 Kd7 Rd2 Ke8 Kg7 e7
59-main	10.13	Rc8 Kb4 Rb8 Kc5 Rc8 Kb5 Rb8 Ka6 Rc8 Rd4 Ke5 Rd5 Ke6 Kb5 Rb8 Ka4 Rc8 Kb4 Rb8 Rb5 Rh8 Rb7 Kd6 Kb5 Rh5 Kb6 Rc5 Rd7 Kxd7 Kxc5 Kc7
59-12.Rd5	10.13	Rc8 Kb4 Rb8 Kc5 Rc8 Kb5 Rb8 Ka6 Rc8 Rd4 Ke5 Rd5 Ke6 Kb5 Rb8 Ka4 Rc8 Kb4 Rb8 Rb5 Rh8 Rd5 Rb8
59-1...Rg8	10.13	Rg8 c5 Ke7 Kc4 Rd8
59-1...Rg8-2...Rg4	10.13	Rg8 c5 Rg4 c6 Ke7 c7 Rg8
59-1...Ke7-main	10.13	Ke7 Kb4 Rb8 Kc5 Rc8 Kb5 Rb8 Ka6 Rc8 Rd4 Ke6 Kb7 Rc5 Kb6 Rc8 c5
59-1...Ke7-2.c5	10.13	Ke7 c5 Rd8
59-1...Ke7-2.Rd2	10.13	Ke7 Rd2 Rd8 Rxd8 Kxd8 Kb4 Kc8
59-1...Rb8	10.13	Rb8 c5 Ke7 Kc4 Rd8
59-1...Ke5-main	10.13	Ke5 c5 Rh4 Rd8 Rg4 Kb3 Rh4 c6 Rh6 c7
59-1...Ke5-5...Rh7	10.13	Ke5 c5 Rh4 Rd8 Rg4 Kb3 Rh4 c6 Rh7 Kc4
59-5.Ka5	10.13	Rc8 Kb4 Rb8 Kc5 Rc8 Kb5 Rb8 Ka5 Ra8 Kb6 Rb8 Kc7
59-5.Ka5-correct	10.13	Rc8 Kb4 Rb8 Kc5 Rc8 Kb5 Rb8 Ka5 Rc8
59-5...Ra8	10.13	Rc8 Kb4 Rb8 Kc5 Rc8 Kb5 Rb8 Ka6 Ra8 Kb7 Ra2 c5
59-7.Rh4	10.13	Rc8 Kb4 Rb8 Kc5 Rc8 Kb5 Rb8 Ka6 Rc8 Rd4 Ke5 Rh4 Rb8
60-main	10.15	Kb4 Rb8 Ka5 Rc8 Kb5 Rb8 Ka6 Rc8 Rc1 Ke7 Kb7 Rc5 Kb6 Rh5 c5 Kd8 Rd1 Kc8 Rg1 Rh8 c6 Rf8 Ra1 Kb8 c7 Kc8 Ra8
60-2...Ra8	10.15	Kb4 Rb8 Ka5 Ra8 Kb6 Rb8 Kc7
60-4...Ra8	10.15	Kb4 Rb8 Ka5 Rc8 Kb5 Rb8 Ka6 Ra8 Kb7
60-5.Re4	10.15	Kb4 Rb8 Ka5 Rc8 Kb5 Rb8 Ka6 Rc8 Re4 Kf5 Rh4 Ke6 Kb7 Rc5 Kb6 Rc8 c5
60-7...Rc8	10.15	Kb4 Rb8 Ka5 Rc8 Kb5 Rb8 Ka6 Rc8 Rc1 Ke7 Kb7 Rc5 Kb6 Rc8 c5
60-10...Rh6	10.15	Kb4 Rb8 Ka5 Rc8 Kb5 Rb8 Ka6 Rc8 Rc1 Ke7 Kb7 Rc5 Kb6 Rh5 c5 Kd8 Rd1 Kc8 Rg1 Rh6 c6
61-main	10.16	Kc4 Rc8 Kd5 Rd8 Kc6 Rc8 Kd7 Rc2 d5
61-1...Ka5	10.16-black-to-move	Ka5 Rb2 Ka4 Rb7 Ka5 Rb1 Ka4 d5
61-1...Ka7	10.16-black-to-move	Ka7 Kc4 Rc8 Kd5 Rd8 Kc5 Rc8 Kd6 Rd8 Kc7
61-3.Ke5	10.16	Kc4 Rc8 Kd5 Rd8 Ke5 Re8 Kf6 Rd8 Rd1 Kb6 Ke7 Rh8 d5 Rh7
61-5.Ke5-return	10.16	Kc4 Rc8 Kd5 Rd8 Ke5 Re8 Kf6 Rd8 Ke5
62-10.17-main	10.17	Ra8 Rc6 Rb8 Ra6 Kd5 Ka4 Kc4 Rc6 Kd5 b5 Ra8 Kb4 Rb8 Rc7 Kd6 Ra7 Kd5 Ka5 Kc5 Rc7 Kd6 b6 Ra8 Kb5 Ra1
62-10.17-alt	10.17	Ra8 Rh5 Rb8 b5 Rb7 Kb4 Rb8 Rh6 Kd5 b6
62-10.18	10.18	Rb8 Rh5 Kf4 c5 Rc8 Kc4 Ke4 Rh6 Ke5 c6
62-10.19-main	10.19	Ra8 d4 Kg3 Rh5 Kg4 Re5 Ra3 d5 Kf4 Re8 Ra5
62-10.19-2.Kc3	10.19	Ra8 Kc3 Ra3 Kc2 Ra8
62-10.19-3.Rh7	10.19	Ra8 d4 Kg3 Rh7 Kf4 Re7 Kf5 Kd3 Kf6
62-10.19-3.Rh6-main	10.19	Ra8 d4 Kg3 Rh6 Ra3 Re6 Kf4
62-10.19-3...Kf4	10.19	Ra8 d4 Kg3 Rh6 Kf4 Kd3 Kf5 Kc4 Ra4 Kc5 Ra5 Kb4
63-main	10.20	Rb8 Rg6 Rb7 c5 Kd5
63-white-to-move	10.20-white-to-move	Rb6 Rc7 Kb4 Rc8 c5 Kd5 Rd6 Ke5 Kb5 Rb8 Rb6
63-white-2...Kd4	10.20-white-to-move	Rb6 Rc7 Kb4 Kd4 Rd6 Ke5 c5
64-main	10.21	Ra8 Rc5 Rd8 Rd5 Ra8 Kd4 Kf4 Rf5 Kg4
64-2.Kd4	10.21	Ra8 Kd4 Ra4 Ke5 Ra5 Kf6 Ra6 Kf7 Ra4
64-2.Rf7	10.21	Ra8 Rf7 Ra3 Kd4 Ra4 Kd5 Ra5 Kd6 Ra6 Kc5 Ra5
65-main	10.22	Kg7 Kf3 Kh7 Ke4 Kg7 Kd5 Kh7 Kc6 Kg7 Kb6 Rb1 Ka6 Ra1 Kb5 Kh7
65-1...Ra3	10.22	Ra3 Rh8
65-1...Ke6	10.22	Ke6 Re8
65-1...Ke7	10.22	Ke7 Rh8
66-10.23-main	10.23	Kg7 Kf3 Rf1 Ke4 Rf6 Kd5 Rb6 Kc5 Rf6 Kb5 Rf5 Kb6 Rf6 Ka7 Rf7 Kb6 Rf6 Kc5 Rf5 Kd4 Rf6
66-10.23-1...Ke7	10.23	Ke7 a7 Kf7 Rh8
66-10.23-wait	10.23	Kg7 Kf3 Kh7 Ke4 Kg7 Kd5 Kh7 Kc6 Kg7 Kb6 Rb1 Ka7 Kh7 Rb8 Ra1 Rb6
66-10.23-4.Ke5	10.23	Kg7 Kf3 Rf1 Ke4 Rf6 Ke5 Rb6 Kd5 Rf6
66-10.23-4.a7	10.23	Kg7 Kf3 Rf1 Ke4 Rf6 a7 Ra6
66-10.24-safe	10.24	Rf1 Ke4 Rf6
66-10.24-main	10.24	Ra5 Ke4 Rb5 Ra7 Kg6 Rb7 Ra5 a7 Kf6 Rh7 Kg6 Rc7 Kf6 Kd4 Ke6 Kc4 Kd6
66-10.24-3.Ra7	10.24	Ra5 Ra7 Kg6 Ke4 Rb5
66-10.24-4...Kf6	10.24	Ra5 Ke4 Rb5 Ra7 Kf6 Kd4 Rb6 Rh7
66-10.24-5.Kd4	10.24	Ra5 Ke4 Rb5 Ra7 Kg6 Kd4 Rb6 Kc5 Rf6
66-10.24-7.Kd4	10.24	Ra5 Ke4 Rb5 Ra7 Kg6 Rb7 Ra5 a7 Kf6 Kd4 Ke6 Kc4 Kd6 Kb4 Kc6
66-10.24-7...Ke6	10.24	Ra5 Ke4 Rb5 Ra7 Kg6 Rb7 Ra5 a7 Kf6 Rh7 Ke6 Rh6 Kd7 Rh8
66-10.24-Ra4	10.24	Ra4 Ke3 Rb4 Ra7 Kg6 Rb7 Ra4 a7 Kf5
66-10.24-Ra2-main	10.24	Ra2 Ke4 Ra5 Kd4 Rb5 Ra7 Kf6 Rh7 Ra5 a7 Ke6 Kc4 Kd6 Kb4 Ra1 Kb5
66-10.24-Ra2-3...Re2	10.24	Ra2 Ke4 Re2 Kd5
66-10.24-Ra2-5...Kf8	10.24	Ra2 Ke4 Ra5 Kd4 Rb5 Ra7 Kf8 Rb7 Ra5 a7
66-10.24-Ra2-5...Kg6	10.24	Ra2 Ke4 Ra5 Kd4 Rb5 Ra7 Kg6 Rb7 Ra5 a7 Kf6 Kc4 Ke6 Kb4 Ra1 Kc5
66-10.24-Ra2-6.Rb7	10.24	Ra2 Ke4 Ra5 Kd4 Rb5 Ra7 Kf6 Rb7 Ra5 a7 Ke6 Kc4 Kd6 Kb4 Kc6
67-main	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Rb6 Kc5 Rc6 Kb5 Rc8 Rh8 Kc7 Rh7 Kb8
67-2...Kd7	10.26	Rh2 Ke7 Rh8 Kd7 Rb8 Ra1 Kb7 Rb1 Ka6 Ra1 Kb6 Rb1 Kc5
67-4.Rb7	10.26	Rh2 Ke7 Rh8 Kd7 Rb8 Ra1 Rb7 Kc8 Rb2 Kc7 Rc2 Kd7 Kb7 Rb1 Ka6 Ra1 Kb6 Rb1 Kc5 Ra1
67-5.Ka6	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Ka6 Ra1 Kb6 Rb1 Ka5 Ra1
67-6...Rg1	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rg1 Ke8 Rg8 Kf7
67-7.Ke8	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Ke8 Rh8 Kf7 Rh7
67-7.Kc8	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Kc8 Rc1
67-8.Ra6	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Rb6 Kc5 Ra6 Rh8 Kc7 Rh7 Kd8 Rh8 Ke7 Rh7 Kf8 Rh8 Kf7 Ra8 Ke7 Kb5 Ra1 Kb6
67-8.Rb8	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Rb6 Kc5 Rb8 Rh8 Kc7 Rh7
67-8.Rb1	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Rb6 Kc5 Rb1 Rxb1 a8=Q
67-8...Kd5	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Rb6 Kc5 Rc6 Kd5 Ra6 Rh8 Kc7 Rh7 Kb6
67-8...Kd5-9.Rc8	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Rb6 Kc5 Rc6 Kd5 Rc8 Kd6
67-8...Kd5-10.Ke7	10.26	Rh2 Ke7 Rh8 Kd6 Rb8 Ra1 Kb7 Rb1 Kc8 Rc1 Kd8 Rh1 Rb6 Kc5 Rc6 Kd5 Ra6 Rh8 Ke7 Rh7 Kf8 Rh8 Kg7 Ra8
68-white-to-move	10.27-white-to-move	a6 Rb1 Rb6 Rc1 a7 Rc7 Ka6 Rc8 Rb8
68-main	10.27	Rb1 Rb6 Rc1 a6 Rc7 Ka8 Rc8 Ka7 Rc7 Rb7 Kc8 Kb6 Rc1 Rh7 Rb1 Ka7 Ra1
68-3.Rb2	10.27	Rb1 Rb6 Rc1 Rb2 Rc7 Kb6 Kc8
68-5.Rb8	10.27	Rb1 Rb6 Rc1 a6 Rc7 Ka8 Rc8 Rb8 Rc1 a7 Kc7
68-5...Kc7	10.27	Rb1 Rb6 Rc1 a6 Rc7 Ka8 Rc8 Rb8 Kc7 a7`

const sourcePaths: SourcePath[] = sourcePathFixture
  .trim()
  .split('\n')
  .map((line) => {
    const [id, start, moveText] = line.split('\t')
    assert.ok(id)
    assert.ok(start)
    assert.ok(moveText)
    return { id, start, moves: moveText.split(' ') }
  })
assert.equal(sourcePaths.length, 140)
assert.equal(
  sourcePaths.reduce((count, path) => count + path.moves.length, 0),
  1678,
)

const starts = new Map(
  expectedBoards.map(({ fen, number }) => [number, fen]),
)
starts.set(
  '10.20-white-to-move',
  getBoard('10.20').fen.replace(' b ', ' w '),
)
starts.set(
  '10.27-white-to-move',
  getBoard('10.27').fen.replace(' b ', ' w '),
)
starts.set(
  '10.16-black-to-move',
  getBoard('10.16').fen.replace(' w ', ' b '),
)

const sourceEdges = new Map<string, string[]>()
for (const sourcePath of sourcePaths) {
  const initialFen = starts.get(sourcePath.start)
  assert.ok(initialFen, 'Unknown source start ' + sourcePath.start)
  const chess = new Chess(initialFen)

  for (const [moveIndex, sourceMove] of sourcePath.moves.entries()) {
    const parentFen = chess.fen()
    let applied
    try {
      applied = chess.move(sourceMove, { strict: false })
    } catch {
      assert.fail(
        sourcePath.id +
          ' is illegal at ' +
          sourcePath.moves.slice(0, moveIndex + 1).join(' '),
      )
    }
    assert.ok(applied)
    const key = edgeKey(parentFen, applied.san, chess.fen())
    const occurrences = sourceEdges.get(key) ?? []
    occurrences.push(sourcePath.id)
    sourceEdges.set(key, occurrences)
  }
}
assert.equal(sourceEdges.size, 924)

const visibleMoveTokens = Array.from(playback.tokensBySectionIndex.values())
  .flat()
  .filter(
    (token): token is MoveToken => token.type === 'move' && !token.hidden,
  )
assert.equal(visibleMoveTokens.length, 945)

const appEdges = new Map<string, MoveToken[]>()
for (const token of visibleMoveTokens) {
  const chess = new Chess(token.parentFen)
  const applied = chess.move(token.san, { strict: false })
  assert.ok(applied, 'Non-replayable app SAN: ' + token.display)
  assert.equal(chess.fen(), token.fen)

  const key = edgeKey(token.parentFen, token.san, token.fen)
  const occurrences = appEdges.get(key) ?? []
  occurrences.push(token)
  appEdges.set(key, occurrences)
}
assert.equal(appEdges.size, 926)

for (const [key, pathIds] of sourceEdges) {
  assert.equal(
    appEdges.has(key),
    true,
    'App is missing a frozen source transition used by ' + pathIds.join(', '),
  )
}

const actualExtraEdges = Array.from(appEdges.keys())
  .filter((key) => !sourceEdges.has(key))
  .sort()
const sourceSupportedNestedBranch = replayEdgeKeys(
  getBoard('10.13').fen,
  ['Rc8', 'Kb4', 'Rb8', 'Kc5', 'Rc8', 'Kb5', 'Rb8', 'Ka5', 'Ra8', 'Kb6', 'Rc8', 'c5'],
)
assert.deepEqual(
  actualExtraEdges,
  sourceSupportedNestedBranch.slice(-2).sort(),
  'The only helper delta must be the printed 6...Rc8 7.c5 branch that the frozen helper omitted',
)

for (const [sectionIndex, tokens] of playback.tokensBySectionIndex) {
  assert.equal(
    tokens
      .filter((token) => token.type !== 'move' || !token.hidden)
      .map((token) => (token.type === 'text' ? token.text : token.display))
      .join(''),
    getPlayableSectionText(chapter.sections[sectionIndex]),
    'Playback tokenization must preserve Chapter 10 section ' + sectionIndex,
  )
}

for (const token of visibleMoveTokens) {
  const navigation = navigationByPosition.get(token.positionNumber)
  assert.ok(navigation, 'Missing navigation for ' + token.positionNumber)
  const node = navigation.nodesById.get(token.id)
  assert.ok(node, 'Missing navigation node for ' + token.display)
  const previousNode = getPreviousNavigationNode(navigation, token.id)
  if (previousNode) {
    assert.equal(
      positionKey(previousNode.fen),
      positionKey(token.parentFen),
      token.positionNumber + ' Previous must stay on the source branch',
    )
  }
  assert.equal(
    positionKey(
      getPreviousNavigationFen(
        navigation,
        token.id,
        getBoard(token.positionNumber).fen,
      )!,
    ),
    positionKey(previousNode?.fen ?? token.parentFen),
    token.positionNumber + ' Previous must restore the exact source parent',
  )

  const chain = []
  let chainNode: NavigationNode | undefined = node
  while (chainNode) {
    chain.unshift(chainNode)
    chainNode = chainNode.previousId
      ? navigation.nodesById.get(chainNode.previousId)
      : undefined
  }
  const preferences = getPreferredNextUpdates(navigation, node.id)
  let cursorId: string | null = null
  for (const expectedNode of chain) {
    const nextNode = getNextNavigationNode(navigation, cursorId, preferences)
    assert.equal(
      nextNode?.id,
      expectedNode.id,
      token.positionNumber + ' Next must follow the selected source branch',
    )
    cursorId = nextNode.id
  }
}

assertRootPrevious(
  '10.16',
  '1...Ka5!',
  getBoard('10.16').fen.replace(' w ', ' b '),
)
assertRootPrevious(
  '10.20',
  '1.Rb6!',
  getBoard('10.20').fen.replace(' b ', ' w '),
)
assertRootPrevious(
  '10.27',
  '1.a6',
  getBoard('10.27').fen.replace(' b ', ' w '),
)

for (const [sectionIndex, display] of [
  [30, '7.Rf8'],
  [76, '2...Ka6'],
  [113, '2.Kf2'],
] as const) {
  assert.equal(
    (playback.tokensBySectionIndex.get(sectionIndex) ?? []).some(
      (token) =>
        token.type === 'move' && !token.hidden && token.display === display,
    ),
    false,
    'Prose-only move must not become playback: ' + display,
  )
}

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
  'Chapter 10, Section 5',
  'print page 123; PDF page 124',
  'Section 6',
  'corrects the forward reference to “Section 5.”',
  'Position 10.20',
  'print page 144; PDF page 145',
  'as in Position 10.19',
  'corrects the cross-reference to “Position 10.20.”',
]) {
  assert.equal(
    frontMatterText.includes(expectedText),
    true,
    'About must disclose: ' + expectedText,
  )
}
for (const href of [
  bookPathForChapterId('10') + '#' + bookEndingAnchorId('65'),
  bookPathForChapterId('10') + '#' + bookPositionAnchorId('10.20'),
]) {
  assert.equal(
    frontMatterMarkup.includes('href="' + escapeAttribute(href) + '"'),
    true,
    'About correction must link to ' + href,
  )
}

console.log(
  'Chapter 10 source fidelity passed (30 page units, 27 boards, 140 replay paths / 1,678 plies / 924 frozen transitions, 2 disclosed source corrections)',
)

function assertRootPrevious(
  positionNumber: string,
  display: string,
  expectedParentFen: string,
) {
  const token = visibleMoveTokens.find(
    (candidate) =>
      candidate.positionNumber === positionNumber &&
      candidate.display === display &&
      positionKey(candidate.parentFen) === positionKey(expectedParentFen),
  )
  assert.ok(token, 'Missing alternate-root token ' + display)
  const navigation = navigationByPosition.get(positionNumber)
  assert.ok(navigation)
  assert.equal(getPreviousNavigationNode(navigation, token.id), null)
  assert.equal(
    positionKey(
      getPreviousNavigationFen(
        navigation,
        token.id,
        getBoard(positionNumber).fen,
      )!,
    ),
    positionKey(expectedParentFen),
  )
}

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

function edgeKey(parentFen: string, san: string, fen: string) {
  return (
    positionKey(parentFen) +
    '\u001e' +
    normalizeSan(san) +
    '\u001e' +
    positionKey(fen)
  )
}

function escapeAttribute(value: string) {
  return escapeText(value).replaceAll('"', '&quot;').replaceAll("'", '&#x27;')
}

function escapeText(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getBoard(number: string) {
  const board = expectedBoards.find((candidate) => candidate.number === number)
  assert.ok(board, 'Missing source board ' + number)
  return board
}

function getPart(partId: string) {
  const part = book.parts.find(({ id }) => id === partId)
  assert.ok(part, 'Expected Chapter ' + partId)
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
  if (typeof section.content === 'string') {
    return section.content
  }
  if (!section.content || typeof section.content !== 'object') {
    return ''
  }
  return Object.entries(section.content)
    .filter(([key]) =>
      [
        'caption',
        'displayLabel',
        'number',
        'subtitle',
        'text',
        'title',
      ].includes(key),
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

function normalizeSan(san: string) {
  return san
    .replace(/[!?Z]+/g, '')
    .replace(/[+#]+$/g, '')
    .replace(/^0-0-0$/, 'O-O-O')
    .replace(/^0-0$/, 'O-O')
}

function positionKey(fen: string) {
  return fen.split(/\s+/).slice(0, 4).join(' ')
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

function replayEdgeKeys(initialFen: string, moves: string[]) {
  const chess = new Chess(initialFen)
  return moves.map((sourceMove) => {
    const parentFen = chess.fen()
    const applied = chess.move(sourceMove, { strict: false })
    assert.ok(applied)
    return edgeKey(parentFen, applied.san, chess.fen())
  })
}
