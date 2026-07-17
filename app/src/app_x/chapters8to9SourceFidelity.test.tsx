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
  type NavigationNode,
} from './playbackNavigation'

type PartId = '8' | '9'

type BoardExpectation = {
  caption?: string
  displayLabel?: string
  fen: string
  hideVisualLabel?: true
  number: string
  orientation: 'white'
  partId: PartId
  sectionIndex: number
  subtitle?: string
}

type PageCopyExpectation = {
  includes: string[]
  partId: PartId
  pdfPage: number
  printPage: number
}

type SourceRoot = {
  fen: string
  paths: string[]
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const chapterEight = getPart('8')
const chapterNine = getPart('9')
const chapters = new Map<PartId, BookPartSource>([
  ['8', chapterEight],
  ['9', chapterNine],
])
const playbackByChapter = new Map(
  Array.from(chapters, ([partId, chapter]) => [
    partId,
    buildChapterPlayback(chapter.sections),
  ]),
)
const navigationByChapter = new Map(
  Array.from(playbackByChapter, ([partId, playback]) => [
    partId,
    buildPlaybackNavigation(playback),
  ]),
)

const pageCopyUnits: PageCopyExpectation[] = [
  {
    partId: '8',
    pdfPage: 97,
    printPage: 96,
    includes: [
      '8. Bishop vs. Knight: one pawn on the board',
      'Section 1. Knight + Pawn vs. Bishop',
      'Central pawn',
      'Cheron',
    ],
  },
  {
    partId: '8',
    pdfPage: 98,
    printPage: 97,
    includes: [
      '1.Bc5+!',
      '6.Bd6 Ne3 7.Bg3 Nf5-+',
      'Black dominates all 4 squares on the stopping diagonal.',
      '8.2',
    ],
  },
  {
    partId: '8',
    pdfPage: 99,
    printPage: 98,
    includes: [
      'interesting and useful Exercise.',
      '5...Ng4 6.Bd4 Ke2 7.Bg1! ½-½',
      'The rook\'s pawn',
      'Lloyd, 1860',
    ],
  },
  {
    partId: '8',
    pdfPage: 100,
    printPage: 99,
    includes: [
      '3...Kxh1',
      '7.Kf1 ½-½',
      'When the defending king is further away',
      'Stein - Dorfman',
    ],
  },
  {
    partId: '8',
    pdfPage: 101,
    printPage: 100,
    includes: [
      '5...Nc5! 6.Ke2',
      '6...Kb1',
      'Analysis diagram 8.6',
      '9.Kc3 Kxa1 10.Kc2 Nd3-+',
    ],
  },
  {
    partId: '8',
    pdfPage: 102,
    printPage: 101,
    includes: [
      'Section 2. Bishop + Pawn vs. Knight',
      'The pawn is on the 7th rank',
      'Zugzwang, stalemate or perpetual check',
      '8.7',
    ],
  },
  {
    partId: '8',
    pdfPage: 103,
    printPage: 102,
    includes: [
      '1.Kc7!',
      '1...Nd8 2.Bd5+-',
      'Recommended Exercise',
      'Knight blockades series',
      'White wins, no matter who moves',
    ],
  },
  {
    partId: '8',
    pdfPage: 104,
    printPage: 103,
    includes: [
      'Unstable position of the controlling knight',
      '8.8',
      'V. Bron, 1955',
      '8.Be4!+-',
    ],
  },
  {
    partId: '9',
    pdfPage: 105,
    printPage: 104,
    includes: [
      '9. Opposite-coloured bishops: Bishop + 2 pawns vs. Bishop',
      'Section 1. Connected pawns',
      'A) First, they allow a deep analysis',
      'D) Last, the study of theoretical positions',
    ],
  },
  {
    partId: '9',
    pdfPage: 106,
    printPage: 105,
    includes: [
      'Pawns on the 6th rank',
      '9.1',
      '1.Bb5+ Kd8',
      'The bishop in front of the pawns',
      '9.2',
    ],
  },
  {
    partId: '9',
    pdfPage: 107,
    printPage: 106,
    includes: [
      'Rook and knight\'s pawns',
      '9.3',
      'Two 6th-rank connected pawns always win',
      'Pawns on 5th rank or behind',
    ],
  },
  {
    partId: '9',
    pdfPage: 108,
    printPage: 107,
    includes: [
      'The winning procedure',
      '1.Bg5+!',
      'The defensive procedure',
      'the right position for the defending bishop',
    ],
  },
  {
    partId: '9',
    pdfPage: 109,
    printPage: 108,
    includes: [
      '9.5',
      'Pawns on the 4th rank',
      'Tarrasch, 1921',
      '1...Bc4!',
    ],
  },
  {
    partId: '9',
    pdfPage: 110,
    printPage: 109,
    includes: [
      'The less advanced the pawns are',
      'A very special pair of pawns. The cage',
      '9.7',
    ],
  },
  {
    partId: '9',
    pdfPage: 111,
    printPage: 110,
    includes: [
      '1.f4 Bf8 2.e4 Ke7',
      'Analysis diagram 9.8',
      'A vivid image. The bishop is lost.',
      'Section 2. Separated pawns. The three drawing scenarios',
    ],
  },
  {
    partId: '9',
    pdfPage: 112,
    printPage: 111,
    includes: [
      'Pawns separated by just one file',
      '9.9',
      '1.Bb3',
      'Second draw scenario',
    ],
  },
  {
    partId: '9',
    pdfPage: 113,
    printPage: 112,
    includes: [
      'Controlling both pawns along the same diagonal',
      '9.10',
      'Averbakh, 1972',
      '4.Kb6 Kd8 ½-½',
      'Third draw scenario',
    ],
  },
  {
    partId: '9',
    pdfPage: 114,
    printPage: 113,
    includes: [
      'Position 9.10',
      'The winning procedure',
      '9.11',
      '1.f4',
      'Two bishop\'s pawns',
    ],
  },
  {
    partId: '9',
    pdfPage: 115,
    printPage: 114,
    includes: [
      'Knight\'s and central pawn',
      'Berger - Kotlerman',
      'Arkhangelsk 1948',
      '1.Ke2!',
      '2...Kb4 3.Bh7',
    ],
  },
  {
    partId: '9',
    pdfPage: 116,
    printPage: 115,
    includes: [
      'Analysis diagram 9.13',
      '5.Bf7!',
      'Analysis diagram 9.14',
      '7...b2 8.Bb1! ½-½',
    ],
  },
  {
    partId: '9',
    pdfPage: 117,
    printPage: 116,
    includes: [
      'The attacking bishop has control over the promotion square',
      'Cheron, 1957',
      'if Bc7, ...Kd7',
      '20.b7+-',
    ],
  },
  {
    partId: '9',
    pdfPage: 118,
    printPage: 117,
    includes: [
      'Central and rook\'s pawns',
      '9.16',
      '1.Kf5 Ke7!',
      'With a- and d- pawns',
    ],
  },
  {
    partId: '9',
    pdfPage: 119,
    printPage: 118,
    includes: [
      'Bishop and knight\'s pawns',
      'Outflanking on the edge',
      'Speelman, 1981',
      '11.Kd7 Bf4 12.Kc8+-',
      '5.Kb6 Bb8! ½-½',
    ],
  },
  {
    partId: '9',
    pdfPage: 120,
    printPage: 119,
    includes: [
      'The attacking bishop controls the promotion square of the knight\'s pawn',
      '9.18',
      '9.Kc5 Ke6 ½-½',
      'The knight\'s pawn is further back',
      '9.19',
    ],
  },
  {
    partId: '9',
    pdfPage: 121,
    printPage: 120,
    includes: [
      '9.Kd4 1-0',
      'Central and rook\'s pawns',
      '9.20',
      'Cheron',
    ],
  },
  {
    partId: '9',
    pdfPage: 122,
    printPage: 121,
    includes: [
      'The only way is outflanking along the edge of the board.',
      '6.Bb7Z Kg5',
      '15.Bd5Z',
      '26.Kd5 1-0',
      'Final summary',
    ],
  },
  {
    partId: '9',
    pdfPage: 123,
    printPage: 122,
    includes: [
      'General rules',
      'The more advanced the flank pawn, the worse for the stronger side',
      'When pawns are separated by TWO files:',
      'When pawns are separated by FOUR files:',
    ],
  },
]

assert.equal(pageCopyUnits.length, 27)
assert.deepEqual(
  pageCopyUnits.map(({ pdfPage }) => pdfPage),
  Array.from({ length: 27 }, (_, index) => 97 + index),
)
assert.deepEqual(
  pageCopyUnits.map(({ printPage }) => printPage),
  Array.from({ length: 27 }, (_, index) => 96 + index),
)

const visibleSourceTextByChapter = new Map(
  Array.from(chapters, ([partId, chapter]) => [
    partId,
    chapter.sections.map(getVisibleSourceText).join('\n'),
  ]),
)
for (const unit of pageCopyUnits) {
  const visibleSourceText = visibleSourceTextByChapter.get(unit.partId)
  assert.ok(visibleSourceText)
  for (const expectedText of unit.includes) {
    assert.equal(
      visibleSourceText.includes(expectedText),
      true,
      'PDF ' + unit.pdfPage + ' must retain: ' + expectedText,
    )
  }
}

const chapterEightText = visibleSourceTextByChapter.get('8')!
const chapterNineText = visibleSourceTextByChapter.get('9')!
for (const staleText of [
  '6.Bg3 (6.Kd6 Ne3-+)',
  '6.Kd6 Ne3 7.Bg3 Nf5-+',
  'White dominates all 4 squares on the stopping diagonal.',
  'useful exercise.',
  '1/2-1/2',
  'right positional for the defending bishop',
  '11.Bd7 Bf4 12.Bc8+-',
]) {
  assert.equal(
    (staleText.startsWith('right') ? chapterNineText : chapterEightText + chapterNineText).includes(
      staleText,
    ),
    false,
    'Reader-facing stale copy must be absent: ' + staleText,
  )
}

for (const [partId, expectedHash] of [
  ['8', '2593c137249903f9bc830dd39dda4a269bbaadf00a32334031e7b2444e1c6718'],
  ['9', '839b4a060987182ca6015bd51ffacb86018714af8ec421c95eb7414f40ae0879'],
] as const) {
  assert.equal(
    createHash('sha256')
      .update(
        canonicalStringify(
          getPart(partId).sections.filter(
            (section) => section.type !== 'position',
          ),
        ),
      )
      .digest('hex'),
    expectedHash,
    'Chapter ' + partId + ' copy and hierarchy must remain source-authoritative',
  )
}

const expectedBoards: BoardExpectation[] = [
  {
    partId: '8',
    sectionIndex: 5,
    number: '8.1',
    orientation: 'white',
    caption: 'Cheron',
    fen: '1K6/4B3/8/8/8/2n2p2/5k2/8 w - - 0 1',
  },
  {
    partId: '8',
    sectionIndex: 8,
    number: '8.2',
    orientation: 'white',
    fen: '8/2K5/8/8/8/5p2/5n1B/5k2 w - - 8 5',
  },
  {
    partId: '8',
    sectionIndex: 12,
    number: '8.3',
    orientation: 'white',
    caption: 'Lloyd, 1860',
    fen: '8/8/8/8/B6n/7p/6k1/4K3 w - - 0 1',
  },
  {
    partId: '8',
    sectionIndex: 15,
    number: '8.4',
    orientation: 'white',
    fen: '8/8/8/8/7n/8/7p/4K1kB b - - 3 3',
  },
  {
    partId: '8',
    sectionIndex: 19,
    number: '8.5',
    orientation: 'white',
    subtitle: 'Stein - Dorfman',
    caption: 'USSR, 1970',
    fen: '8/8/5B2/8/1n6/8/p1k1K3/8 b - - 0 1',
  },
  {
    partId: '8',
    sectionIndex: 22,
    number: '8.6',
    orientation: 'white',
    displayLabel: 'Analysis diagram 8.6',
    fen: '8/8/8/8/8/8/pn1K4/Bk6 w - - 15 9',
  },
  {
    partId: '8',
    sectionIndex: 29,
    number: '8.7',
    orientation: 'white',
    fen: '2K5/3Pkn2/8/8/8/5B2/8/8 w - - 0 1',
  },
  {
    partId: '8',
    sectionIndex: 34,
    number: 'knight-blockades-series-1',
    orientation: 'white',
    hideVisualLabel: true,
    caption: 'White wins, no matter who moves',
    fen: '5nK1/4kP2/8/5B2/8/8/8/8 w - - 0 1',
  },
  {
    partId: '8',
    sectionIndex: 35,
    number: 'knight-blockades-series-2',
    orientation: 'white',
    hideVisualLabel: true,
    caption: 'Draw, no matter who moves.',
    fen: '4Kn2/5Pk1/8/5B2/8/8/8/8 w - - 0 1',
  },
  {
    partId: '8',
    sectionIndex: 36,
    number: 'knight-blockades-series-3',
    orientation: 'white',
    hideVisualLabel: true,
    caption: 'White wins, no matter who moves.',
    fen: '8/6nK/5kP1/8/6B1/8/8/8 w - - 0 1',
  },
  {
    partId: '8',
    sectionIndex: 40,
    number: '8.8',
    orientation: 'white',
    caption: 'V. Bron, 1955',
    fen: '8/4K3/3P1n2/3k4/8/8/2B5/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 5,
    number: '9.1',
    orientation: 'white',
    fen: '4k3/8/4PP2/4K3/1b6/3B4/8/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 9,
    number: '9.2',
    orientation: 'white',
    fen: '3bk3/8/4PP2/4K3/8/8/4B3/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 13,
    number: '9.3',
    orientation: 'white',
    fen: '6k1/8/6PP/5K2/2B5/2b5/8/8 b - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 19,
    number: '9.4',
    orientation: 'white',
    fen: '8/4k3/8/4PP2/4K3/1b6/3B4/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 23,
    number: '9.5',
    orientation: 'white',
    fen: '2b5/4k3/8/4PP2/4K3/8/3B4/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 27,
    number: '9.6',
    orientation: 'white',
    caption: 'Tarrasch, 1921',
    fen: '8/8/3k4/8/3PP3/4K3/8/4Bb2 b - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 32,
    number: '9.7',
    orientation: 'white',
    fen: '8/5kb1/8/8/6K1/3B4/4PP2/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 34,
    number: '9.8',
    orientation: 'white',
    displayLabel: 'Analysis diagram 9.8',
    fen: '5k2/6bK/8/4P3/2B2P2/8/8/8 b - - 10 9',
  },
  {
    partId: '9',
    sectionIndex: 39,
    number: '9.9',
    orientation: 'white',
    fen: '3k4/1K6/2PbP3/3B4/8/8/8/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 44,
    number: '9.10',
    orientation: 'white',
    caption: 'Averbakh, 1972',
    fen: '8/2bB4/2P5/6k1/4K3/5P2/8/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 51,
    number: '9.11',
    orientation: 'white',
    fen: '8/2kB4/2P5/6b1/4K3/5P2/8/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 56,
    number: '9.12',
    orientation: 'white',
    subtitle: 'Berger - Kotlerman',
    caption: 'Arkhangelsk 1948',
    fen: '8/8/8/5B2/1p3b2/2k1p3/8/5K2 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 58,
    number: '9.13',
    orientation: 'white',
    displayLabel: 'Analysis diagram 9.13',
    fen: '8/8/6B1/8/5b2/1p2p3/1k6/3K4 w - - 6 5',
  },
  {
    partId: '9',
    sectionIndex: 60,
    number: '9.14',
    orientation: 'white',
    displayLabel: 'Analysis diagram 9.14',
    fen: '8/8/4B3/8/5b2/kp2p3/8/3K4 w - - 10 7',
  },
  {
    partId: '9',
    sectionIndex: 65,
    number: '9.15',
    orientation: 'white',
    caption: 'Cheron, 1957',
    fen: '8/3k4/3B1K2/4P3/1Pb5/8/8/8 b - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 69,
    number: '9.16',
    orientation: 'white',
    fen: '8/bB6/P2k4/3P4/4K3/8/8/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 77,
    number: '9.17',
    orientation: 'white',
    caption: 'Speelman, 1981',
    fen: '1b6/1P6/4Bk2/5P2/4K3/8/8/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 81,
    number: '9.18',
    orientation: 'white',
    caption: 'Cheron',
    fen: '2b5/8/1P1B4/8/4kP2/8/5K2/8 b - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 85,
    number: '9.19',
    orientation: 'white',
    caption: 'Speelman, 1981',
    fen: '8/8/8/2Bk4/1P3Pb1/4K3/8/8 w - - 0 1',
  },
  {
    partId: '9',
    sectionIndex: 89,
    number: '9.20',
    orientation: 'white',
    caption: 'Cheron',
    fen: '8/b7/P7/3Bk3/2K1P3/8/8/8 w - - 0 1',
  },
]

assert.equal(expectedBoards.length, 31)
assert.equal(pageCopyUnits.length + expectedBoards.length, 58)

for (const partId of ['8', '9'] as const) {
  const actualBoards = getPart(partId).sections
    .map((section, sectionIndex) => ({ section, sectionIndex }))
    .filter(
      (
        entry,
      ): entry is { section: PositionSection; sectionIndex: number } =>
        entry.section.type === 'position',
    )
  const expectedForPart = expectedBoards.filter(
    (expectation) => expectation.partId === partId,
  )
  assert.deepEqual(
    actualBoards.map(({ section, sectionIndex }) => ({
      sectionIndex,
      number: section.content.number,
    })),
    expectedForPart.map(({ sectionIndex, number }) => ({
      sectionIndex,
      number,
    })),
  )
}

for (const expectation of expectedBoards) {
  const section = getPart(expectation.partId).sections[
    expectation.sectionIndex
  ] as PositionSection
  assert.equal(section.type, 'position')
  assert.deepEqual(
    {
      caption: section.content.caption,
      displayLabel: section.content.displayLabel,
      fen: section.content.fen,
      hideVisualLabel: section.content.hideVisualLabel,
      number: section.content.number,
      orientation: section.content.orientation,
      subtitle: section.content.subtitle,
    },
    {
      caption: expectation.caption,
      displayLabel: expectation.displayLabel,
      fen: expectation.fen,
      hideVisualLabel: expectation.hideVisualLabel,
      number: expectation.number,
      orientation: expectation.orientation,
      subtitle: expectation.subtitle,
    },
  )
  assert.equal(expectation.fen.split(' ').length, 6)
  assert.doesNotThrow(() => new Chess(expectation.fen))

  const markup = renderPosition(expectation.partId, expectation.sectionIndex)
  const anchorId = bookPositionAnchorId(expectation.number)
  assert.equal(markup.includes('id="' + anchorId + '"'), true)
  const route = resolveAppRoute(
    bookPathForChapterId(expectation.partId),
    '#' + anchorId,
  ).route
  assert.equal(route.module, 'book')
  assert.equal(route.module === 'book' ? route.anchorId : null, anchorId)

  if (expectation.hideVisualLabel) {
    assert.ok(expectation.caption)
    const sectionTag = markup.match(/^<section[^>]*>/)?.[0]
    assert.ok(sectionTag)
    assert.equal(
      sectionTag.includes(
        'aria-label="' + escapeAttribute(expectation.caption) + '"',
      ),
      true,
    )
    assert.equal(sectionTag.includes('aria-labelledby='), false)
    assert.equal(markup.includes('<figcaption>'), false)
    assert.equal(markup.includes('>' + expectation.number + '<'), false)
    assert.equal(
      markup.includes(
        'aria-label="Expand ' + escapeAttribute(expectation.caption) + '"',
      ),
      true,
    )
    assert.equal(
      markup.includes('aria-label="Expand position ' + expectation.number + '"'),
      false,
    )
    assert.equal(
      markup.includes(
        '<p class="leg-position-caption">' +
          escapeText(expectation.caption) +
          '</p>',
      ),
      true,
    )
  } else {
    assert.equal(markup.includes('<figcaption>'), true)
    assert.equal(
      markup.includes(
        '>' + escapeText(expectation.displayLabel ?? expectation.number) + '<',
      ),
      true,
    )
  }
}

assert.deepEqual(
  chapterEight.sections.slice(27, 30).map((section) => {
    if (section.type === 'ending') {
      return ['ending', (section.content as { number: string }).number]
    }
    if (section.type === 'position') {
      return ['position', (section.content as { number: string }).number]
    }
    return [section.type, section.content]
  }),
  [
    ['ending', '39'],
    ['heading', 'Zugzwang, stalemate or perpetual check'],
    ['position', '8.7'],
  ],
)
assert.equal(
  (chapterEight.sections[29] as PositionSection).content.subtitle,
  undefined,
)
for (const staleLabel of [
  'Position 8.7a',
  'Position 8.7b',
  'Position 9.1',
  'Position 9.2',
]) {
  if (staleLabel === 'Position 9.1' || staleLabel === 'Position 9.2') {
    continue
  }
  assert.equal(chapterEightText.includes(staleLabel), false)
}
for (const [number, forbiddenLabel] of [
  ['8.8', 'Position 8.7'],
  ['9.10', 'Position 9.1'],
  ['9.20', 'Position 9.2'],
] as const) {
  const board = getBoard(number)
  const markup = renderPosition(board.partId, board.sectionIndex)
  assert.equal(markup.includes('>' + number + '<'), true)
  assert.equal(markup.includes(forbiddenLabel), false)
}

for (const number of ['8.2', '8.4', '8.6', '9.8', '9.13', '9.14']) {
  const board = getBoard(number)
  const markup = renderPosition(board.partId, board.sectionIndex)
  const lichessHref = markup.match(/<a href="([^"]+)"/)?.[1]
  assert.ok(lichessHref)
  assert.equal(
    decodeURIComponent(lichessHref.replaceAll('&amp;', '&')).includes(
      '[FEN "' + board.fen + '"]',
    ),
    true,
    'Lichess export must preserve exact repaired FEN ' + board.fen,
  )
}

assert.deepEqual(getEndingNumbers(chapterEight), ['37', '38', '39', '40'])
assert.deepEqual(
  getEndingNumbers(chapterNine),
  Array.from({ length: 11 }, (_, index) => String(41 + index)),
)
for (const endingNumber of Array.from(
  { length: 15 },
  (_, index) => String(37 + index),
)) {
  const anchorId = bookEndingAnchorId(endingNumber)
  const partId: PartId = Number(endingNumber) <= 40 ? '8' : '9'
  assert.equal(anchorId, 'e' + endingNumber)
  const route = resolveAppRoute(
    bookPathForChapterId(partId),
    '#' + anchorId,
  ).route
  assert.equal(route.module, 'book')
  assert.equal(route.module === 'book' ? route.anchorId : null, anchorId)
}

const sourceRoots: Record<string, SourceRoot> = {
  "8.1": {
    "fen": "1K6/4B3/8/8/8/2n2p2/5k2/8 w - - 0 1",
    "paths": [
      "Bc5+ Ke2 Bg1 Nd1 Kc7 Nf2 Bh2 Kf1 Be5 Ng4 Bd4 Ke2 Bg1",
      "Bh4+ Kg2 Kc7 Ne4 Be1 Nc5 Kd6 Nd3 Bh4 Kh3",
      "Bc5+ Ke2 Kc7 Nd5+ Kd6 Ne3",
      "Bc5+ Ke2 Kc8 Nd1 Bg1 Nf2 Kd7 Kf1 Bh2 Ng4 Bg3 Kg2 Bh4 Kh3 Be1 Ne5+ Ke6 Nd3",
      "Bc5+ Ke2 Kc8 Nd1 Bg1 Nf2 Kd7 Kf1 Bh2 Ng4 Bd6 Ne3",
      "Bc5+ Ke2 Bg1 Nd1 Kc7 Nf2 Kd6 Kf1 Bh2 Nd3 Bg3 Kg2 Bh4 Kh3",
      "Bc5+ Ke2 Bg1 Nd1 Kc7 Nf2 Kd7 Kf1 Bh2 Ng4 Bg3 Kg2 Be1 Ne5+ Ke6 Nd3 Bh4 Kh3",
      "Bc5+ Ke2 Bg1 Nd1 Kc7 Nf2 Kd7 Kf1 Bh2 Ng4 Bd6 Ne3 Bg3 Nf5",
      "Bc5+ Ke2 Bg1 Nd1 Kc7 Nf2 Bh2 Ng4 Bg1",
      "Bc5+ Ke2 Bg1 Nd1 Kc7 Nf2 Bh2 Nh3 Bg3",
      "Bc5+ Ke2 Bg1 Nd1 Kc7 Nf2 Bh2 Kf1 Kc6 Ng4 Bd6 Ke2 Bg3 Ne3"
    ]
  },
  "8.3": {
    "fen": "8/8/8/8/B6n/7p/6k1/4K3 w - - 0 1",
    "paths": [
      "Bd7 h2 Bc6+ Kg1 Bh1 Kxh1 Kf2 Nf3 Kf1 Nd2+ Kf2 Ne4+ Kf1",
      "Bc6+ Kg1 Bd5 Ng2",
      "Bd7 h2 Bc6+ Kg1 Bh1 Ng2+ Ke2 Nf4+ Ke1",
      "Bd7 h2 Bc6+ Kg1 Bh1 Kxh1 Kf1 Nf5 Kf2 Ng3",
      "Bd7 h2 Bc6+ Nf3+ Ke2"
    ]
  },
  "8.5": {
    "fen": "8/8/5B2/8/1n6/8/p1k1K3/8 b - - 0 1",
    "paths": [
      "Nd3 Ba1 Nb2 Ke1 Na4 Ke2 Kc1 Ke1 Nc5 Ke2 Kb1 Kd1 Nd3 Kd2 Nb2 Kc3 Kxa1 Kc2 Nd3",
      "Nd3 Ba1 Nb2 Ke3 Na4 Kd4 Kb1 Kd3 Nc5+ Kc3 Kxa1 Kc2 Nb3",
      "Nd3 Ba1 Nb2 Ke3 Na4 Kd4 Kb1 Kd3 Nc5+ Kc3 Kxa1 Kc2",
      "Nd3 Ba1 Nb2 Ke3 Na4 Kd4 Kb1 Kd3 Nc5+ Kc3 Kxa1 Kc2",
      "Nd3 Ba1 Nb2 Ke1 Kb1 Kd2 Kxa1 Kc1 Nc4 Kc2",
      "Nd3 Ba1 Nb2 Ke1 Na4 Ke2 Kc1 Kd3 Kb1 Kd2 Nb2",
      "Nd3 Ba1 Nb2 Ke1 Na4 Ke2 Kc1 Ke3 Kb1 Kd3 Nc5+",
      "Nd3 Ba1 Nb2 Ke1 Na4 Ke2 Kc1 Ke1 Nc5 Bg7 Nd3+ Ke2 Nb2",
      "Nd3 Ba1 Nb2 Ke1 Na4 Ke2 Kc1 Ke1 Nc5 Ke2 Kb1 Bg7 Na4"
    ]
  },
  "8.7": {
    "fen": "2K5/3Pkn2/8/8/8/5B2/8/8 w - - 0 1",
    "paths": [
      "Kc7 Nd8 Bd5",
      "Bd5 Nd6+ Kc7 Ne8+ Kc8 Nd6+",
      "Bc6"
    ]
  },
  "8.8-print-8.7": {
    "fen": "8/4K3/3P1n2/3k4/8/8/2B5/8 w - - 0 1",
    "paths": [
      "Bb3+ Kc5 Ba2 Kc6 Ke6 Nh7 Bd5+ Kc5 Ke7 Nf6 Bf3 Ng8+ Ke6 Nf6 Be4",
      "Bb3+ Ke5 Be6",
      "Bb3+ Kc5 Ke6 Nh7 Ke7 Nf8 Bc2 Kc6 Bb1 Kd5 Bd3 Kc6",
      "Bb3+ Kc5 Ke6 Nh7 Ke7 Nf8 Bc2 Kc6 Ba4+ Kc5 Be8 Kd5 Bf7+ Kc6 Bh5 Kc5",
      "Bb3+ Kc5 Ke6 Nh7 Ke7 Nf8 Bc2 Kc6 Ba4+ Kc5 Be8 Kd5 Bf7+ Kc6 Bh5 Kd5 Bf3+ Ke5 Be4",
      "Bb3+ Kc5 Ba2 Ng4 Bb1 Nf6 Be4+ Ng8+ Kd7 Nf6+ Ke6",
      "Bb3+ Kc5 Ba2 Kc6 Ke6 Kc5 Bb1",
      "Bb3+ Kc5 Ba2 Kc6 Ke6 Kc5 Bd5 Nh7 Ke7",
      "Bb3+ Kc5 Ba2 Kc6 Ke6 Nh7 Bd5+ Kc5 Ke7 Nf8 Be4"
    ]
  },
  "9.1": {
    "fen": "4k3/8/4PP2/4K3/1b6/3B4/8/8 w - - 0 1",
    "paths": [
      "Bb5+ Kd8 Kf5 Bc5 Kg6 Bb4 Kf7 Bc5 e7+",
      "Bb5+ Kf8 Kd5 Ba3 Kc6 Bb4 Kd7 Bc5 e7+"
    ]
  },
  "9.2": {
    "fen": "3bk3/8/4PP2/4K3/8/8/4B3/8 w - - 0 1",
    "paths": [
      "Bb5+ Kf8 Kf5"
    ]
  },
  "9.3": {
    "fen": "6k1/8/6PP/5K2/2B5/2b5/8/8 b - - 0 1",
    "paths": [
      "Kf8 Ke6 Bb2",
      "Kh8 Ke6 Bb2 Kf7"
    ]
  },
  "9.4": {
    "fen": "8/4k3/8/4PP2/4K3/1b6/3B4/8 w - - 0 1",
    "paths": [
      "Bg5+ Kd7 Kf4 Ba2 Bh4 Bf7 Kg5 Ke7 Kh6+ Kd7 Kg7 Bd5 Kf6 Bb3 e6+ Ke8 Ke5",
      "Bb4+ Kf7 Kd4 Bc2 e6+ Kf6 e7 Kf7 Ke5 Ba4",
      "Bb4+ Kf7 Kd4 Bc2 f6 Ke6",
      "Bg5+ Kf7 Kd4 Ba2 Kc5 Bb3 Kd6 Ba2 e6+ Ke8 f6",
      "Bg5+ Kf7 Kd4 Bc2 e6+ Ke8 f6"
    ]
  },
  "9.5": {
    "fen": "2b5/4k3/8/4PP2/4K3/8/3B4/8 w - - 0 1",
    "paths": [
      "Bg5+ Kf7 Kf4 Bd7"
    ]
  },
  "9.6": {
    "fen": "8/8/3k4/8/3PP3/4K3/8/4Bb2 b - - 0 1",
    "paths": [
      "Bc4 Bg3+ Kc6 Kf4 Bf7 Ke5 Kd7 d5 Bg6 Kd4 Bh7 e5 Bg8",
      "Bb5 Bb4+ Kd7 d5",
      "Bc4 Bg3+ Kd7 d5",
      "Bc4 Bg3+ Ke6 Bf4 Bb3 Kd3 Ba2 Kc3",
      "Bc4 Bg3+ Ke6 Kd2 Bb5 d5+ Ke7 Ke3 Be8",
      "Bc4 Bg3+ Ke6 Bf4 Ba2 Kd2"
    ]
  },
  "9.7": {
    "fen": "8/5kb1/8/8/6K1/3B4/4PP2/8 w - - 0 1",
    "paths": [
      "f4 Bf8 e4 Ke7 Bc4 Bg7 e5 Bh6 Bb3 Bg7 Kg5 Bh8 Kg6 Kf8 Kh7 Bg7 Bc4",
      "f4 Bf8 e4 Bd6 e5",
      "f4 Bf8 e4 Ke7 Bc4 Bg7 e5 Bh6 f5 Bg7",
      "f4 Bf8 e4 Ke7 Bc4 Bg7 e5 Bh6 Bb3 Kf8 f5"
    ]
  },
  "9.9": {
    "fen": "3k4/1K6/2PbP3/3B4/8/8/8/8 w - - 0 1",
    "paths": [
      "Bb3 Bf4 Kb6 Bd6 Kb5 Bc7 Kc4 Bd6 Kd5 Bc7 Ke4 Bd6 Kf5 Bc7 Kf6 Bd6 Kf7 Bb4",
      "Bb3 Be5",
      "Bb3 Bg3",
      "Bb3 Bh2",
      "Bb3 Bf4 c7+ Bxc7 e7+ Kxe7 Kxc7"
    ]
  },
  "9.10-print-9.1": {
    "fen": "8/2bB4/2P5/6k1/4K3/5P2/8/8 w - - 0 1",
    "paths": [
      "Kd5 Kf6 Kc5 Ke7 Kb5 Bf4 Kb6 Kd8"
    ]
  },
  "9.11": {
    "fen": "8/2kB4/2P5/6b1/4K3/5P2/8/8 w - - 0 1",
    "paths": [
      "f4 Bh4 Kd5 Bd8 Ke6 Bh4 f5 Kd8 f6 Bg5 Kf5 Bh6 Kg6 Bf8 Kf7 Bh6 Kg8"
    ]
  },
  "9.12": {
    "fen": "8/8/8/5B2/1p3b2/2k1p3/8/5K2 w - - 0 1",
    "paths": [
      "Ke2 b3 Kd1 Kb4 Bh7 Ka3 Bg6 Kb2 Bf7 Ka2 Be6 Ka3 Bf5 b2 Bb1",
      "Ke2 b3 Bg6 Kb2 Bf7 Kc2 Bg6+ Kc1",
      "Ke2 b3 Bh7 Kb2 Kd1 Ka1",
      "Ke2 b3 Kd1 Kb4 Bh7 Ka3 Bg6 b2 Bb1 Kb3 Ke2",
      "Ke2 b3 Kd1 Kb4 Bh7 Ka3 Bg6 Ka2 Bf7",
      "Ke2 b3 Kd1 Kb4 Bh7 Ka3 Bg6 Kb2 Bh7 Ka1"
    ]
  },
  "9.15": {
    "fen": "8/3k4/3B1K2/4P3/1Pb5/8/8/8 b - - 0 1",
    "paths": [
      "Bf1 Bc5 Bc4 Be3 Bb5 e6+ Ke8 Ke5 Ke7 Bg5+ Ke8 Kd6 Bc4 e7 Bd3 Kc5 Kd7 b5 Be2 b6 Bf3 Kd4 Ke8 Ke5 Kd7 Kf6 Bh5 Kg7 Kc6 Be3 Kd7 Kf8 Bg6 Bd2 Kc6 Ba5 Kd7 b7",
      "Bf1 Bc5 Bc4 Be3 Bd5 b5 Bc4 b6 Bd5 Bd2 Kc6 Ba5 Kd7 e6+",
      "Bf1 Bc5 Bc4 Be3 Bb5 e6+ Ke8 Ke5 Ke7 Bg5+ Ke8 Kd6 Bc4 e7 Bd3 Kc5 Kd7 b5 Be2 b6 Bf3 Kd4 Ke8 Ke5 Kd7 Kf6 Ke8 Ke6"
    ]
  },
  "9.16": {
    "fen": "8/bB6/P2k4/3P4/4K3/8/8/8 w - - 0 1",
    "paths": [
      "Kf5 Ke7 Ke5 Bb8+ Kd4 Ba7+ Kc4 Kd6"
    ]
  },
  "9.17": {
    "fen": "1b6/1P6/4Bk2/5P2/4K3/8/8/8 w - - 0 1",
    "paths": [
      "Kf3 Kg5 Ke4 Kf6 Kd5 Bg3 Kc6 Ke7 Kb6 Bb8",
      "Kf3 Bc7 Kg4 Bb8 Kh5 Bf4 Bc8 Bb8 Kh6 Bf4+ Kh7 Bb8 Kg8 Bd6 Be6 Bb8 Kf8 Bd6+ Ke8 Be5 Kd7 Bf4 Kc8",
      "Kf3 Bc7 Kg4 Bb8 Kh5 Bf4 Bc8 Kg7 Kg4 Bb8 Kg5 Be5 f6+ Bxf6+ Kf5"
    ]
  },
  "9.18": {
    "fen": "2b5/8/1P1B4/8/4kP2/8/5K2/8 b - - 0 1",
    "paths": [
      "Bb7 Kg3 Kf5 Kh4 Kg6 Kg4 Bc8+ Kf3 Bb7+ Ke3 Kf5 Kd4 Ke6 Be5 Kf5 Kc5 Ke6",
      "Bb7 Kg3 Kf5 Kh4 Bf3 Bc7 Bb7 Kh5 Bc6 Kh6 Bb7 Kg7 Ke6 Kf8 Bc6 Be5 Bb7 Ke8",
      "Bb7 Kg3 Kf5 Kh4 Kg6 Kg4 Bc8+ f5+ Bxf5+ Kf4 Bc8"
    ]
  },
  "9.19": {
    "fen": "8/8/8/2Bk4/1P3Pb1/4K3/8/8 w - - 0 1",
    "paths": [
      "Be7 Bd7 Bd8 Kc4 Ba5 Kd5 Kf3 Bc8 Kg3 Ke4 Bc7 Kf5 Kf3 Bb7+ Ke3 Bc6 Kd4",
      "Be7 Ke6 Bd8 Kd5 b5 Bc8 Bc7 Ke6 Kd4",
      "Be7 Ke6 Bd8 Kd5 b5 Bd7 b6 Bc8 f5",
      "Be7 Bf5 b5 Bc8 Bd8 Ke6 Kd4 Kd6 Ke4",
      "Be7 Bd7 Bd8 Kc4 Ba5 Kd5 Kf3 Ke6 Kg4",
      "Be7 Bd7 Bd8 Kc4 Ba5 Kd5 Kf3 Bc8 Kg3 Ke4 Bc7 Bd7 Kh4 Kf5 Kh5",
      "Be7 Bd7 Bd8 Kc4 Ba5 Kd5 Kf3 Bc8 Kg3 Ke4 Bc7 Kf5 Kh4 Kg6"
    ]
  },
  "9.20-print-9.2": {
    "fen": "8/b7/P7/3Bk3/2K1P3/8/8/8 w - - 0 1",
    "paths": [
      "Kd3 Kf4 Ke2 Bb6 Kf1 Ba7 Kg2 Bb6 Kh3 Bf2 Bb7 Kg5 Bc6 Kf4 Bd5 Be3 Kh4 Ke5 Kh5 Kf6 Bb7 Ba7 Kh6 Bb6 Kh7 Bd4 Kg8 Bc5 Bd5 Ke5 Kf7 Kd6 Kf6 Bd4+ Kf5 Bb6 Ba8 Bd4 Bb7 Bb6 e5+ Ke7 e6 Bd4 Bc8 Kd8 Bd7 Ke7 Ke4 Bb6 Kd5",
      "Kd3 Bb6 Ke2 Ba7 Kf3 Bb6 Kg4",
      "Kd3 Kf4 Ke2 Bb6 Kf1 Ba7 Kg2 Kg4 e5",
      "Kd3 Kf4 Ke2 Bb6 Kf1 Ba7 Kg2 Bb6 Kh3 Bf2 Bb7 Bb6 Kh4",
      "Kd3 Kf4 Ke2 Bb6 Kf1 Ba7 Kg2 Bb6 Kh3 Bf2 Bb7 Kg5 Bc6 Kf4 Bd5 Kg5 e5",
      "Kd3 Kf4 Ke2 Bb6 Kf1 Ba7 Kg2 Bb6 Kh3 Bf2 Bb7 Kg5 Bc6 Kf4 Bd5 Be3 Kh4 Ke5 Kh5 Kf6 Bb7 Ba7 Kh6 Bb6 Kh7 Bd4 Kg8 Bc5 Bd5 Ke5 Kf7 Ba7 Ke7"
    ]
  }
}

assert.equal(Object.keys(sourceRoots).length, 22)
const chapterEightSourcePaths = countSourcePaths('8')
const chapterNineSourcePaths = countSourcePaths('9')
const chapterEightSourcePlies = countSourcePlies('8')
const chapterNineSourcePlies = countSourcePlies('9')
assert.equal(chapterEightSourcePaths, 37)
assert.equal(chapterNineSourcePaths, 57)
assert.equal(chapterEightSourcePaths + chapterNineSourcePaths, 94)
assert.equal(chapterEightSourcePlies, 405)
assert.equal(chapterNineSourcePlies, 679)
assert.equal(chapterEightSourcePlies + chapterNineSourcePlies, 1084)

const moveTokensByChapter = new Map(
  Array.from(playbackByChapter, ([partId, playback]) => [
    partId,
    Array.from(playback.tokensBySectionIndex.values())
      .flat()
      .filter(
        (
          token,
        ): token is Extract<TextPlaybackToken, { type: 'move' }> =>
          token.type === 'move' && !token.hidden,
      ),
  ]),
)
for (const [partId, playback] of playbackByChapter) {
  const sections = getPart(partId).sections
  for (const [sectionIndex, tokens] of playback.tokensBySectionIndex) {
    assert.equal(
      tokens
        .filter((token) => token.type !== 'move' || !token.hidden)
        .map((token) => (token.type === 'text' ? token.text : token.display))
        .join(''),
      getPlayableSectionText(sections[sectionIndex]),
      'Playback tokenization must preserve Chapter ' +
        partId +
        ' section ' +
        sectionIndex,
    )
  }
}

const tokenByPath = new Map<
  string,
  Extract<TextPlaybackToken, { type: 'move' }>
>()
for (const moveTokens of moveTokensByChapter.values()) {
  for (const token of moveTokens) {
    const chess = new Chess(token.parentFen)
    const move = chess.move(token.san, { strict: false })
    assert.ok(move, 'Non-replayable emitted SAN: ' + token.display)
    assert.equal(chess.fen(), token.fen)
    assert.equal(
      token.path.some((pathPart) => pathPart.startsWith('@')),
      false,
      'Visible playback paths must not use synthetic sentinel roots',
    )
    tokenByPath.set(playbackPathKey(token.positionNumber, token.path), token)
  }
}
assert.equal(moveTokensByChapter.get('8')?.length, 235)
assert.equal(moveTokensByChapter.get('9')?.length, 466)

const chapterEightFalseTokens =
  playbackByChapter.get('8')?.tokensBySectionIndex.get(7) ?? []
assert.equal(
  chapterEightFalseTokens.some(
    (token) => token.type === 'move' && token.display === 'Nd5',
  ),
  false,
)
assert.equal(
  chapterEightFalseTokens
    .filter((token) => token.type !== 'move' || !token.hidden)
    .map((token) => (token.type === 'text' ? token.text : token.display))
    .join('')
    .includes('which was tactically prevented (...Nd5, ...Ne3)'),
  true,
)
const chapterNineFalseTokens =
  playbackByChapter.get('9')?.tokensBySectionIndex.get(66) ?? []
assert.equal(
  chapterNineFalseTokens.some(
    (token) => token.type === 'move' && token.display === 'Bc7',
  ),
  false,
)
assert.equal(
  chapterNineFalseTokens
    .filter((token) => token.type !== 'move' || !token.hidden)
    .map((token) => (token.type === 'text' ? token.text : token.display))
    .join('')
    .includes('Black would play ...Kc6 and, if Bc7, ...Kd7'),
  true,
)

const continuationBoards = new Map(
  ['8.2', '8.4', '8.6', '9.8', '9.13', '9.14'].map((number) => {
    const board = getBoard(number)
    return [normalizeFen(board.fen), board] as const
  }),
)

let verifiedPaths = 0
let verifiedPlies = 0
for (const [sourceLabel, sourceRoot] of Object.entries(sourceRoots)) {
  const partId = sourceLabel.startsWith('8.') ? '8' : '9'
  const appRootPosition = getAppPositionForSourceRoot(sourceLabel)
  assert.equal(sourceRoot.fen, getBoard(appRootPosition).fen)

  for (const [pathIndex, sourcePathText] of sourceRoot.paths.entries()) {
    const sourcePath = sourcePathText.split(/\s+/)
    const chess = new Chess(sourceRoot.fen)
    let segmentPosition = appRootPosition
    let canonicalSegmentPath: string[] = []
    let segmentTokens: Array<
      Extract<TextPlaybackToken, { type: 'move' }>
    > = []

    for (const [moveIndex, sourceSan] of sourcePath.entries()) {
      const continuation = continuationBoards.get(normalizeFen(chess.fen()))
      if (
        moveIndex > 0 &&
        continuation &&
        continuation.number !== segmentPosition
      ) {
        assert.equal(
          chess.fen(),
          continuation.fen,
          sourceLabel + ' must reach exact continuation FEN ' + continuation.number,
        )
        assertSegmentTraversal(
          partId,
          segmentPosition,
          canonicalSegmentPath,
          segmentTokens,
          sourceLabel + ' path ' + (pathIndex + 1),
        )
        segmentPosition = continuation.number
        canonicalSegmentPath = []
        segmentTokens = []
      }

      const expectedParentFen = chess.fen()
      let applied
      try {
        applied = chess.move(sourceSan, { strict: true })
      } catch {
        assert.fail(
          sourceLabel +
            ' path ' +
            (pathIndex + 1) +
            ' is illegal at ' +
            sourcePath.slice(0, moveIndex + 1).join(' '),
        )
      }
      canonicalSegmentPath.push(applied.san)
      const token = tokenByPath.get(
        playbackPathKey(segmentPosition, canonicalSegmentPath),
      )
      assert.ok(
        token,
        sourceLabel +
          ' path ' +
          (pathIndex + 1) +
          ' is missing ' +
          segmentPosition +
          ' ' +
          canonicalSegmentPath.join(' '),
      )
      assert.equal(token.san, applied.san)
      assert.equal(token.parentFen, expectedParentFen)
      assert.equal(token.fen, chess.fen())
      assert.deepEqual(token.path, canonicalSegmentPath)
      assert.equal(
        token.path.some((pathPart) => pathPart.startsWith('@')),
        false,
      )

      const navigation = navigationByChapter
        .get(partId)
        ?.get(segmentPosition)
      assert.ok(navigation)
      const node = navigation.nodesById.get(token.id)
      assert.ok(node)
      assert.equal(
        node.previousId,
        segmentTokens.at(-1)?.id ?? null,
        sourceLabel +
          ' path ' +
          (pathIndex + 1) +
          ' has a disconnected Previous at ' +
          canonicalSegmentPath.join(' '),
      )
      segmentTokens.push(token)
      verifiedPlies += 1
    }

    assertSegmentTraversal(
      partId,
      segmentPosition,
      canonicalSegmentPath,
      segmentTokens,
      sourceLabel + ' path ' + (pathIndex + 1),
    )
    verifiedPaths += 1
  }
}
assert.equal(verifiedPaths, 94)
assert.equal(verifiedPlies, 1084)

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
  'White dominates all 4 squares on the stopping diagonal.',
  'print page 97; PDF page 98',
  'Black dominates all 4 squares on the stopping diagonal.',
  'black king and knight controlling the bishop\'s stopping diagonal',
  'a second “Position 8.7”',
  'print page 103; PDF page 104',
  'numbers it Position 8.8',
  'the right positional for the defending bishop',
  'print page 107; PDF page 108',
  'requires the noun “position,”',
  'is printed as “Position 9.1”',
  'print page 112; PDF page 113',
  'following diagram is Position 9.11',
  'is printed as “Position 9.2”',
  'print page 120; PDF page 121',
  'follows Position 9.19',
]) {
  assert.equal(
    frontMatterText.includes(expectedText),
    true,
    'About must disclose: ' + expectedText,
  )
}
for (const href of [
  bookPathForChapterId('8') + '#' + bookPositionAnchorId('8.1'),
  bookPathForChapterId('8') + '#' + bookPositionAnchorId('8.8'),
  bookPathForChapterId('9') + '#' + bookPositionAnchorId('9.5'),
  bookPathForChapterId('9') + '#' + bookPositionAnchorId('9.10'),
  bookPathForChapterId('9') + '#' + bookPositionAnchorId('9.20'),
]) {
  assert.equal(
    frontMatterMarkup.includes('href="' + escapeAttribute(href) + '"'),
    true,
    'About correction must link to ' + href,
  )
}

console.log(
  'Chapters 8-9 source fidelity passed (27 page units, 31 boards, 58 total units, 94 replay paths / 1084 plies, 5 disclosed corrections)',
)

function assertSegmentTraversal(
  partId: PartId,
  positionNumber: string,
  canonicalPath: string[],
  tokens: Array<Extract<TextPlaybackToken, { type: 'move' }>>,
  label: string,
) {
  if (!tokens.length) {
    return
  }
  assert.equal(tokens.length, canonicalPath.length)
  const navigation = navigationByChapter.get(partId)?.get(positionNumber)
  assert.ok(navigation, 'Missing navigation for ' + positionNumber)
  const leaf = tokens.at(-1)
  assert.ok(leaf)
  const preferences = getPreferredNextUpdates(navigation, leaf.id)
  let forwardCursorId: string | null = null
  for (const expectedToken of tokens) {
    const next = getNextNavigationNode(
      navigation,
      forwardCursorId,
      preferences,
    )
    assert.equal(next?.id, expectedToken.id, label + ' cannot traverse forward')
    forwardCursorId = next.id
  }

  const backwardSans: string[] = []
  let backwardNode: NavigationNode | null | undefined =
    navigation.nodesById.get(leaf.id)
  while (backwardNode) {
    backwardSans.unshift(backwardNode.path.at(-1)!)
    backwardNode = getPreviousNavigationNode(
      navigation,
      backwardNode.id,
    )
  }
  assert.deepEqual(
    backwardSans,
    canonicalPath,
    label + ' cannot traverse backward',
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

function countSourcePaths(partId: PartId) {
  return Object.entries(sourceRoots)
    .filter(([label]) => label.startsWith(partId + '.'))
    .reduce((count, [, root]) => count + root.paths.length, 0)
}

function countSourcePlies(partId: PartId) {
  return Object.entries(sourceRoots)
    .filter(([label]) => label.startsWith(partId + '.'))
    .reduce(
      (count, [, root]) =>
        count +
        root.paths.reduce(
          (rootCount, path) => rootCount + path.split(/\s+/).length,
          0,
        ),
      0,
    )
}

function escapeAttribute(value: string) {
  return escapeText(value).replaceAll('"', '&quot;').replaceAll("'", '&#x27;')
}

function escapeText(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function getAppPositionForSourceRoot(sourceLabel: string) {
  if (sourceLabel === '8.8-print-8.7') {
    return '8.8'
  }
  if (sourceLabel === '9.10-print-9.1') {
    return '9.10'
  }
  if (sourceLabel === '9.20-print-9.2') {
    return '9.20'
  }
  return sourceLabel
}

function getBoard(number: string) {
  const board = expectedBoards.find((candidate) => candidate.number === number)
  assert.ok(board, 'Missing source board ' + number)
  return board
}

function getEndingNumbers(chapter: BookPartSource) {
  return chapter.sections
    .filter((section) => section.type === 'ending')
    .map(
      (section) =>
        (section.content as { number: string; text: string }).number,
    )
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

function normalizeFen(fen: string) {
  return fen.split(' ').slice(0, 4).join(' ')
}

function playbackPathKey(positionNumber: string, path: string[]) {
  return positionNumber + '\u001e' + path.join('\u001f')
}

function renderPosition(partId: PartId, sectionIndex: number) {
  const chapter = chapters.get(partId)
  const playback = playbackByChapter.get(partId)
  const navigation = navigationByChapter.get(partId)
  assert.ok(chapter)
  assert.ok(playback)
  assert.ok(navigation)
  return renderToStaticMarkup(
    <PositionStudyGroup
      activeBoards={{}}
      activePositionNumber={null}
      group={{ contentIndexes: [], index: sectionIndex, type: 'positionGroup' }}
      navigationByPosition={navigation}
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
