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

type BoardExpectation = {
  caption?: string
  displayLabel?: string
  fen: string
  hideVisualLabel?: true
  number: string
  orientation: 'white'
  partId: '6' | '7'
  sectionIndex: number
  subtitle?: string
}

type PageCopyExpectation = {
  includes: string[]
  partId: '6' | '7'
  pdfPage: number
  printPage: number
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const chapterSix = getPart('6')
const chapterSeven = getPart('7')
const chapters = new Map([
  ['6', chapterSix],
  ['7', chapterSeven],
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
    partId: '6',
    pdfPage: 84,
    printPage: 83,
    includes: [
      '6. Rook vs. 2 Pawns',
      'Three interesting cases can be considered in the struggle between a rook and two connected pawns:',
      '1) Kings play no part.\n2) Both kings play a part.\n3) Only the defending king plays a part.',
      'Extreme position. Rook behind the pawns',
      'That is: 1...Ra1 2.Kg3 Ra5 and wins.',
    ],
  },
  {
    partId: '6',
    pdfPage: 85,
    printPage: 84,
    includes: [
      'Two connected pawns on the 6th rank win against a rook',
      'Rook in front of the pawns',
      'Both kings play a part',
      'The analysis of 6.2. is very simple.',
      '1.Ke5 Ra1 2.Kd5 Re1 3.d7+ Ke7',
      "Stronger side's king on one side of the pawns",
    ],
  },
  {
    partId: '6',
    pdfPage: 86,
    printPage: 85,
    includes: [
      '1.Ra1! Kc3 2.Ke3 Kc2 3.Rh1',
      '3...Kc3 4.Rc1+ Kb2 5.Kd2+-',
      'Rook vs. 2 Pawns series',
      'Stalemate. Exercise: check this statement.',
      'Only the defending king plays a part',
    ],
  },
  {
    partId: '6',
    pdfPage: 87,
    printPage: 86,
    includes: [
      'Kopaev, 1958',
      'this is not a simple race or a tempi count',
      '1...Rf3!',
      "Dvoretsky calls this method 'a change of the leader'.",
      '3...Rxg6?? 4.f7+- Ending 29',
      '4...Ke5=',
    ],
  },
  {
    partId: '6',
    pdfPage: 88,
    printPage: 87,
    includes: [
      "Dvoretsky calls this situation the 'tail-hook'",
      'The series of checks',
      'Lariño - Picazo',
      'La Roda, 2006',
      'A) 2.Rg7+',
      'B) 2.Ke7',
    ],
  },
  {
    partId: '6',
    pdfPage: 89,
    printPage: 88,
    includes: [
      '2.Rg7+ Kf4 3.Rf7+ Kg4 4.Rg7+ Kf3',
      'Analysis diagram 6.7',
      '4.Rg7+! Kf3',
      '7.Kf3! h3 8.Kf2 Kh1=.',
      '7...h3 8.Kf3 g1=Q 0-1',
    ],
  },
  {
    partId: '7',
    pdfPage: 90,
    printPage: 89,
    includes: [
      '7. Same-coloured bishops: Bishop + Pawn vs. Bishop',
      'Endings with same-coloured bishops arise with reasonable frequency.',
      'we can call this scenario the Zero Case',
      'Driving off the defending bishop',
      'Here we have what we could classify as the First Case',
    ],
  },
  {
    partId: '7',
    pdfPage: 91,
    printPage: 90,
    includes: [
      '1.Bf3',
      'And the pawn promotes. It has been easy.',
      'Without the support of the defending king',
      'In the rear of the pawn',
      'the defending king has reached rear opposition.',
    ],
  },
  {
    partId: '7',
    pdfPage: 92,
    printPage: 91,
    includes: [
      '1.Bd7',
      'It is an ironclad draw.',
      'The short diagonals',
      'Third Case. The defending king',
      '1.Bc8',
    ],
  },
  {
    partId: '7',
    pdfPage: 93,
    printPage: 92,
    includes: [
      'Now we can draw some important conclusions.',
      'I think it is better to remember why things happen.',
      'An apparent exception. 3-square diagonal. The attacking king controls just one square.',
      '1.Ke8?',
      '1.Kg8! Kg6 2.Bf8',
    ],
  },
  {
    partId: '7',
    pdfPage: 94,
    printPage: 93,
    includes: [
      '5...Kd6 6.Bd2 Ke6',
      '7.Bc3 Bh6',
      'Frontal defence',
      'Kurajica - Markland',
      'Hastings, 1971',
      '2.Kg6 Ke8!',
    ],
  },
  {
    partId: '7',
    pdfPage: 95,
    printPage: 94,
    includes: [
      '3...Kf8! 4.Bh6+ Kg8!',
      'victory comes easily, since White can offer the bishop exchange without obstructing his pawn',
      'Frontal opposition when the defending king is next to the promotion square',
      'Revision of some assorted themes',
      'Averbakh, 1972',
      '1.Bh5!?',
    ],
  },
  {
    partId: '7',
    pdfPage: 96,
    printPage: 95,
    includes: [
      '2.Bg6!? White tries to win by trading bishops on f5.',
      '3.Bf5 (White burns his bridges) 3...Ke8!=',
      '3...Bc6 is not losing either',
      '3...Kg7! (only move now)',
      '10.Bf3 Kc5=. Just in time!',
      '6.Kc7+-',
    ],
  },
]

assert.equal(pageCopyUnits.length, 13)
assert.deepEqual(
  pageCopyUnits.map(({ pdfPage }) => pdfPage),
  Array.from({ length: 13 }, (_, index) => 84 + index),
)
assert.deepEqual(
  pageCopyUnits.map(({ printPage }) => printPage),
  Array.from({ length: 13 }, (_, index) => 83 + index),
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

const chapterSixText = visibleSourceTextByChapter.get('6')!
const chapterSevenText = visibleSourceTextByChapter.get('7')!
assert.equal(chapterSixText.includes('The analysis of 6.2 is very simple.'), false)
assert.equal(chapterSevenText.includes('reasonably frequency'), false)
assert.equal(chapterSevenText.includes('Third Case.The'), false)
assert.equal(chapterSevenText.includes('It think it is better'), false)
assert.equal(
  chapterSevenText.includes(
    'White cannot offer the bishop exchange without obstructing his pawn',
  ),
  false,
)

for (const [partId, expectedHash] of [
  ['6', '931c80042c7dcf1f3dae4d20de440589bb14a3ced393270a19166acc8ccac676'],
  ['7', '96bb65f8ecdecaeffba087f074bbfaf33fa8f4ba124ac938d0e93586b3120f56'],
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
    partId: '6',
    sectionIndex: 5,
    number: '6.1',
    orientation: 'white',
    fen: '8/8/P7/1P5k/8/8/7K/5r2 w - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 14,
    number: '6.2',
    orientation: 'white',
    fen: 'r3k3/8/3PP3/8/3K4/8/8/8 w - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 19,
    number: '6.3',
    orientation: 'white',
    fen: '8/8/8/8/8/3p4/3kpK2/7R w - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 24,
    number: 'rook-vs-2-pawns-series-1',
    orientation: 'white',
    caption: 'White wins.',
    hideVisualLabel: true,
    fen: '8/8/8/8/8/2p5/2kpK3/7R w - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 25,
    number: 'rook-vs-2-pawns-series-2',
    orientation: 'white',
    caption: 'Stalemate. Exercise: check this statement.',
    hideVisualLabel: true,
    fen: '8/8/8/8/8/1p6/1kpK4/7R w - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 26,
    number: 'rook-vs-2-pawns-series-3',
    orientation: 'white',
    caption: 'Stalemate.',
    hideVisualLabel: true,
    fen: '8/8/8/8/8/p7/kpK5/7R w - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 30,
    number: '6.4',
    orientation: 'white',
    caption: 'Kopaev, 1958',
    fen: '8/8/5KP1/5P2/8/2k4r/8/8 b - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 33,
    number: '6.5',
    orientation: 'white',
    fen: '8/5KP1/5P2/4k3/8/6r1/8/8 w - - 0 5',
  },
  {
    partId: '6',
    sectionIndex: 36,
    number: '6.6',
    orientation: 'white',
    subtitle: 'Lariño - Picazo',
    caption: 'La Roda, 2006',
    fen: '5K2/7R/8/6kp/6p1/8/8/8 b - - 0 1',
  },
  {
    partId: '6',
    sectionIndex: 40,
    number: '6.7',
    orientation: 'white',
    displayLabel: 'Analysis diagram 6.7',
    fen: '8/7R/4K3/8/6kp/6p1/8/8 w - - 0 4',
  },
  {
    partId: '7',
    sectionIndex: 3,
    number: '7.1',
    orientation: 'white',
    fen: '5k2/2K5/3P4/1b5B/8/8/8/8 w - - 0 1',
  },
  {
    partId: '7',
    sectionIndex: 9,
    number: '7.2',
    orientation: 'white',
    fen: '4B3/2K5/3P4/2k5/8/7b/8/8 w - - 0 1',
  },
  {
    partId: '7',
    sectionIndex: 15,
    number: '7.3',
    orientation: 'white',
    fen: '8/K7/1P6/k4B2/8/5b2/8/8 w - - 0 1',
  },
  {
    partId: '7',
    sectionIndex: 21,
    number: '7.4',
    orientation: 'white',
    fen: '5K2/5P2/3b1k1B/8/8/8/8/8 w - - 0 1',
  },
  {
    partId: '7',
    sectionIndex: 26,
    number: '7.5',
    orientation: 'white',
    subtitle: 'Kurajica - Markland',
    caption: 'Hastings, 1971',
    fen: '8/8/2k5/5PK1/8/2b5/7B/8 b - - 0 1',
  },
  {
    partId: '7',
    sectionIndex: 30,
    number: '7.6',
    orientation: 'white',
    caption: 'Averbakh, 1972',
    fen: '5k2/3b4/3P1K2/8/8/8/8/3B4 w - - 0 1',
  },
]

assert.equal(expectedBoards.length, 16)
assert.equal(pageCopyUnits.length + expectedBoards.length, 29)

for (const partId of ['6', '7'] as const) {
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
  assert.equal(
    markup.includes('id="' + bookPositionAnchorId(expectation.number) + '"'),
    true,
  )
  const positionRoute = resolveAppRoute(
    bookPathForChapterId(expectation.partId),
    '#' + bookPositionAnchorId(expectation.number),
  ).route
  assert.equal(positionRoute.module, 'book')
  assert.equal(
    positionRoute.module === 'book' ? positionRoute.anchorId : null,
    bookPositionAnchorId(expectation.number),
  )
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
      expectation.number + ' expand control must use its source caption',
    )
    assert.equal(
      markup.includes('aria-label="Expand position ' + expectation.number + '"'),
      false,
      expectation.number + ' expand control must not expose its internal slug',
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

for (const [partId, sectionIndex, expectedFen] of [
  ['6', 14, 'r3k3/8/3PP3/8/3K4/8/8/8 w - - 0 1'],
  ['6', 33, '8/5KP1/5P2/4k3/8/6r1/8/8 w - - 0 5'],
  ['6', 40, '8/7R/4K3/8/6kp/6p1/8/8 w - - 0 4'],
] as const) {
  const markup = renderPosition(partId, sectionIndex)
  const lichessHref = markup.match(/<a href="([^"]+)"/)?.[1]
  assert.ok(lichessHref)
  assert.equal(
    decodeURIComponent(lichessHref).includes('[FEN "' + expectedFen + '"]'),
    true,
    'Lichess export must preserve the exact repaired FEN ' + expectedFen,
  )
}

assert.deepEqual(getEndingNumbers(chapterSix), ['30', '31', '32'])
assert.deepEqual(getEndingNumbers(chapterSeven), ['33', '34', '35', '36'])
for (const endingNumber of ['30', '31', '32', '33', '34', '35', '36']) {
  const anchorId = bookEndingAnchorId(endingNumber)
  const partId = Number(endingNumber) <= 32 ? '6' : '7'
  assert.equal(anchorId, 'e' + endingNumber)
  const route = resolveAppRoute(
    bookPathForChapterId(partId),
    '#' + anchorId,
  ).route
  assert.equal(route.module, 'book')
  assert.equal(route.module === 'book' ? route.anchorId : null, anchorId)
}

const sourcePathsByPosition: Record<string, string[][]> = {
  '6.1': [
    ['b6', 'Rb1', 'a7'],
    ['b6', 'Rf6', 'b7'],
    ['a7', 'Ra1', 'b6'],
    ['Ra1', 'Kg3', 'Ra5'],
  ],
  '6.2': [['Ke5', 'Ra1', 'Kd5', 'Re1', 'd7+', 'Ke7']],
  '6.3': [
    ['Ra1', 'Kc3', 'Ke3', 'Kc2', 'Rh1', 'Kc3', 'Rc1+', 'Kb2', 'Kd2'],
  ],
  '6.4': [
    ['Rf3', 'g7', 'Rg3', 'Kf7', 'Kd4', 'f6', 'Ke5'],
    ['Rf3', 'g7', 'Rg3', 'Kf7', 'Kd4', 'g8=Q', 'Rxg8', 'Kxg8', 'Ke5'],
    ['Rg3', 'Kg7', 'Kd4', 'f6', 'Ke5', 'f7', 'Rf3', 'f8=Q'],
    ['Rg3', 'g7', 'Kd4', 'Kf7', 'Ke5'],
    ['Kd4', 'Kg7', 'Ke5', 'f6', 'Rf3', 'f7'],
    ['Kd4', 'Kg7', 'Ke5', 'f6', 'Ke6', 'f7'],
    ['Rf3', 'Ke6', 'Rg3'],
    ['Rf3', 'Ke5', 'Rg3', 'f6', 'Rg5'],
    ['Rf3', 'Ke5', 'Rg3', 'f6', 'Rxg6', 'f7'],
  ],
  '6.6': [
    ['g3', 'Ke7', 'h4', 'Ke6', 'Kg4'],
    [
      'h4',
      'Rg7+',
      'Kf4',
      'Rf7+',
      'Kg3',
      'Kg7',
      'h3',
      'Kg6',
      'Kh2',
      'Kg5',
      'g3',
      'Kh4',
      'g2',
      'Rg7',
    ],
    [
      'h4',
      'Rg7+',
      'Kf4',
      'Rf7+',
      'Kg3',
      'Kg7',
      'h3',
      'Kg6',
      'h2',
      'Rh7',
      'Kg2',
      'Kg5',
      'g3',
      'Kg4',
    ],
    [
      'h4',
      'Ke7',
      'h3',
      'Ke6',
      'Kf4',
      'Kd5',
      'Kg3',
      'Ke4',
      'Kh2',
      'Rg7',
      'g3',
      'Kf3',
      'g2',
      'Kf2',
      'Kh1',
      'Rg6',
      'h2',
      'Rxg2',
    ],
    ['h4', 'Ke7', 'h3', 'Ke6', 'Kf4', 'Kd5', 'g3', 'Rh4+'],
    ['g3', 'Rg7+', 'Kf4', 'Rf7+', 'Kg4', 'Rg7+', 'Kf3', 'Rf7+', 'Kg2', 'Rh7'],
    [
      'g3',
      'Rg7+',
      'Kf4',
      'Rf7+',
      'Kg4',
      'Rg7+',
      'Kh3',
      'Kf7',
      'g2',
      'Rg5',
      'h4',
      'Kg6',
      'Kh2',
      'Kh5',
      'h3',
      'Kh4',
    ],
  ],
  '6.7': [
    ['Rg7+', 'Kf3', 'Rf7+', 'Kg2', 'Kf5', 'h3', 'Kg4', 'h2', 'Rh7', 'Kf2', 'Kf4'],
    ['Rg7+', 'Kf4', 'Rh7', 'g2', 'Rxh4+'],
    ['Rg7+', 'Kh3', 'Kf5', 'Kh2', 'Kg4'],
    ['Rg7+', 'Kf3', 'Rf7+', 'Ke3', 'Rg7', 'Kf2', 'Rf7+', 'Kg1', 'Rh7'],
    ['Ke5', 'h3', 'Ke4', 'h2', 'Rh8', 'g2', 'Rg8+', 'Kh5', 'Kf5', 'Kh6', 'Kf6', 'Kh7'],
    ['Ke5', 'h3', 'Rg7+', 'Kf3', 'Rf7+', 'Ke2'],
    ['Ke5', 'h3', 'Ke4', 'h2', 'Rg7+', 'Kh5', 'Kf4', 'g2'],
    ['Ke5', 'h3', 'Ke4', 'h2', 'Rh8', 'g2', 'Rg8+', 'Kh3', 'Kf3', 'g1=N+'],
    ['Ke5', 'g2', 'Ke4', 'Kh3', 'Rg7', 'Kh2', 'Kf4', 'h3', 'Kf3', 'g1=Q'],
    ['Ke5', 'g2', 'Ke4', 'Kh3', 'Rg7', 'Kh2', 'Kf3', 'h3', 'Kf2', 'Kh1'],
  ],
  '7.1': [['Bf3', 'Ba4', 'Bc6', 'Bxc6', 'Kxc6', 'Ke8', 'Kc7']],
  '7.2': [['Bd7', 'Bf1', 'Bg4', 'Bb5', 'Bd7', 'Be2', 'Bc6', 'Bg4']],
  '7.3': [
    ['Bc8', 'Be4', 'Bb7', 'Bd3', 'Bf3', 'Ba6', 'Bg4'],
    ['Bc8', 'Be4', 'Bb7', 'Bf5', 'Bf3', 'Bc8', 'Be2'],
  ],
  '7.4': [
    ['Ke8', 'Ke6', 'Bf8', 'Bf4', 'Bb4', 'Bh6', 'Bd2', 'Bg7', 'Be3', 'Kd6', 'Bd2', 'Ke6', 'Bc3', 'Bh6'],
    ['Kg8', 'Kg6', 'Bf8'],
    ['Ke8', 'Ke6', 'Bf8', 'Bf4', 'Bb4', 'Bh6', 'Bd2', 'Bg7', 'Be3', 'Kd6', 'Bd2', 'Kd5', 'Ke7', 'Kc6', 'Ke6'],
    ['Ke8', 'Ke6', 'Bf8', 'Bf4', 'Bb4', 'Bh6', 'Bd2', 'Bg7', 'Be3', 'Kd6', 'Bd2', 'Kd5', 'Ke7', 'Be5', 'Kf8'],
  ],
  '7.5': [
    ['Kd7', 'Kg6', 'Ke8', 'Bf4', 'Bd4', 'Bh6'],
    ['Kd5', 'Kg6', 'Ke4', 'Bc7', 'Kf3', 'Bd8', 'Kg4'],
    ['Kd7', 'Kg6', 'Ke8', 'Bd6', 'Bd4'],
    [
      'Kd7',
      'Kg6',
      'Ke8',
      'Bf4',
      'Kf8',
      'Bh6+',
      'Kg8',
      'Bg5',
      'Bd4',
      'Bf6',
      'Bf2',
      'Be5',
      'Bh4',
      'Bf4',
      'Bd8',
      'Bg5',
      'Bxg5',
      'Kxg5',
      'Kf7',
    ],
    ['Kd7', 'Kg6', 'Ke8', 'Bf4', 'Bd4', 'Bh6', 'Ke7', 'Bg7', 'Bc5', 'f6+'],
    ['Kd7', 'Kg6', 'Ke8', 'Bf4', 'Bd4', 'Bh6', 'Bc3', 'Bg7', 'Bb4', 'f6'],
  ],
  '7.6': [
    ['Bh5', 'Bh3', 'Bg6', 'Bd7', 'Bf5', 'Ke8'],
    ['Bh5', 'Bh3', 'Bg6', 'Bg4', 'Bf5', 'Bxf5', 'Kxf5', 'Kf7', 'Ke5', 'Kf8', 'Kf6'],
    ['Bh5', 'Bh3', 'Ke5', 'Bd7', 'Kd5', 'Ba4', 'Kc5', 'Bd7', 'Kb6', 'Ba4', 'Kc7'],
    [
      'Bh5',
      'Bh3',
      'Ke5',
      'Bd7',
      'Kd5',
      'Kg7',
      'Kc5',
      'Kf6',
      'Kb6',
      'Ke5',
      'Kc7',
      'Bh3',
      'Be8',
      'Kd4',
      'Bd7',
      'Bf1',
      'Bg4',
      'Bb5',
      'Bf3',
      'Kc5',
    ],
    [
      'Bh5',
      'Bh3',
      'Ke5',
      'Bd7',
      'Kd5',
      'Kg7',
      'Kc5',
      'Kf6',
      'Kb6',
      'Ke5',
      'Kc7',
      'Ba4',
      'Bf3',
      'Kd4',
      'Bc6',
    ],
  ],
}

const chapterSixPathCount = Object.entries(sourcePathsByPosition)
  .filter(([positionNumber]) => positionNumber.startsWith('6.'))
  .reduce((count, [, paths]) => count + paths.length, 0)
const chapterSevenPathCount = Object.entries(sourcePathsByPosition)
  .filter(([positionNumber]) => positionNumber.startsWith('7.'))
  .reduce((count, [, paths]) => count + paths.length, 0)
const chapterSixPlyCount = Object.entries(sourcePathsByPosition)
  .filter(([positionNumber]) => positionNumber.startsWith('6.'))
  .reduce(
    (count, [, paths]) =>
      count + paths.reduce((pathCount, path) => pathCount + path.length, 0),
    0,
  )
const chapterSevenPlyCount = Object.entries(sourcePathsByPosition)
  .filter(([positionNumber]) => positionNumber.startsWith('7.'))
  .reduce(
    (count, [, paths]) =>
      count + paths.reduce((pathCount, path) => pathCount + path.length, 0),
    0,
  )
assert.equal(chapterSixPathCount, 32)
assert.equal(chapterSevenPathCount, 19)
assert.equal(chapterSixPathCount + chapterSevenPathCount, 51)
assert.equal(chapterSixPlyCount, 253)
assert.equal(chapterSevenPlyCount, 196)
assert.equal(chapterSixPlyCount + chapterSevenPlyCount, 449)

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
const tokenByPath = new Map<string, Extract<TextPlaybackToken, { type: 'move' }>>()
for (const moveTokens of moveTokensByChapter.values()) {
  for (const token of moveTokens) {
    tokenByPath.set(playbackPathKey(token.positionNumber, token.path), token)
    const chess = new Chess(token.parentFen)
    const move = chess.move(token.san, { strict: false })
    assert.ok(move, 'Non-replayable emitted SAN: ' + token.display)
    assert.equal(chess.fen(), token.fen)
  }
}
assert.equal(moveTokensByChapter.get('6')?.length, 190)
assert.equal(moveTokensByChapter.get('7')?.length, 132)

for (const [positionNumber, paths] of Object.entries(sourcePathsByPosition)) {
  const partId = getPartIdForPosition(positionNumber)
  const navigation = navigationByChapter.get(partId)?.get(positionNumber)
  assert.ok(navigation, 'Missing navigation for Position ' + positionNumber)

  for (const sourcePath of paths) {
    const initialFen = getSourcePathInitialFen(positionNumber, sourcePath)
    const chess = new Chess(initialFen)
    const canonicalPath: string[] = []
    const expectedTokens: Array<Extract<TextPlaybackToken, { type: 'move' }>> = []

    for (const [moveIndex, sourceSan] of sourcePath.entries()) {
      const expectedParentFen = chess.fen()
      let applied
      try {
        applied = chess.move(sourceSan)
      } catch {
        assert.fail(
          positionNumber +
            ' source path is illegal at ' +
            sourcePath.slice(0, moveIndex + 1).join(' '),
        )
      }
      canonicalPath.push(applied.san)
      const token = tokenByPath.get(
        playbackPathKey(positionNumber, canonicalPath),
      )
      assert.ok(
        token,
        positionNumber + ' is missing source path ' + canonicalPath.join(' '),
      )
      assert.equal(token.parentFen, expectedParentFen)
      assert.equal(token.fen, chess.fen())
      assert.deepEqual(token.path, canonicalPath)
      expectedTokens.push(token)

      const node = navigation.nodesById.get(token.id)
      assert.ok(node)
      assert.equal(
        node.previousId,
        expectedTokens.at(-2)?.id ?? null,
        positionNumber + ' has a disconnected Previous path at ' + canonicalPath.join(' '),
      )
    }

    const leafToken = expectedTokens.at(-1)
    assert.ok(leafToken)
    const preferences = getPreferredNextUpdates(navigation, leafToken.id)
    let forwardCursorId: string | null = null
    for (const expectedToken of expectedTokens) {
      const next = getNextNavigationNode(
        navigation,
        forwardCursorId,
        preferences,
      )
      assert.equal(
        next?.id,
        expectedToken.id,
        positionNumber + ' cannot traverse source path forward',
      )
      forwardCursorId = next.id
    }

    const backwardSans: string[] = []
    let backwardNode: NavigationNode | null | undefined =
      navigation.nodesById.get(leafToken.id)
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
      positionNumber + ' cannot traverse source path backward',
    )
  }
}

assertExactPathParent(
  '7.6',
  ['Bh5', 'Bh3', 'Ke5', 'Kg7'],
  '5k2/8/3P4/4K2B/8/7b/8/8 b - - 3 2',
)
assertExactPathParent(
  '7.6',
  ['Bh5', 'Bh3', 'Bg6', 'Bd7', 'Bf5', 'Bc6'],
  '5k2/3b4/3P1K2/5B2/8/8/8/8 b - - 5 3',
)
assertExactPathParent(
  '7.4',
  ['Ke8', 'Kf5'],
  '4K3/5P2/3b1k1B/8/8/8/8/8 b - - 1 1',
)
assertExactPathParent(
  '6.1',
  ['Ra8'],
  '6r1/8/P7/1P5k/8/8/7K/8 b - - 0 1',
)

const rookErrorPromotionPath = canonicalizeSourcePath(
  getBoard('6.4').fen,
  ['Rg3', 'Kg7', 'Kd4', 'f6', 'Ke5', 'f7', 'Rf3', 'f8=Q'],
)
const rookErrorPromotionToken = tokenByPath.get(
  playbackPathKey('6.4', rookErrorPromotionPath),
)
assert.ok(rookErrorPromotionToken)
const positionSixFourNavigation = navigationByChapter.get('6')?.get('6.4')
assert.ok(positionSixFourNavigation)
assert.deepEqual(
  Array.from(positionSixFourNavigation.nodesById.values()).filter(
    ({ previousId }) => previousId === rookErrorPromotionToken.id,
  ),
  [],
  'The prose-only Rg3 after 5.f8=Q must not become a source continuation',
)
assert.equal(
  getNextNavigationNode(
    positionSixFourNavigation,
    rookErrorPromotionToken.id,
    getPreferredNextUpdates(
      positionSixFourNavigation,
      rookErrorPromotionToken.id,
    ),
  ),
  undefined,
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
  'Endings with same-coloured bishops arise with reasonably frequency.',
  'print page 89',
  'reasonable frequency',
  'Third Case.The defending king',
  'print page 91',
  'inserts the missing space',
  'It think it is better to remember why things happen.',
  'print page 92',
  'corrects the pronoun',
  'White cannot offer the bishop exchange without obstructing his pawn',
  'print page 94',
  'printed negation contradicts the stated win and both supplied winning lines',
  'White can offer the bishop exchange without obstructing his pawn.',
]) {
  assert.equal(
    frontMatterText.includes(expectedText),
    true,
    'About must disclose: ' + expectedText,
  )
}

for (const href of [
  bookPathForChapterId('7'),
  bookPathForChapterId('7') + '#' + bookPositionAnchorId('7.3'),
  bookPathForChapterId('7') + '#' + bookPositionAnchorId('7.4'),
  bookPathForChapterId('7') + '#' + bookPositionAnchorId('7.5'),
]) {
  assert.equal(
    frontMatterMarkup.includes('href="' + escapeAttribute(href) + '"'),
    true,
    'About correction must link to ' + href,
  )
}

console.log(
  'Chapters 6-7 source fidelity passed (13 page units, 16 boards, 51 replay paths / 449 plies, 4 disclosed corrections)',
)

function assertExactPathParent(
  positionNumber: string,
  sourcePath: string[],
  expectedParentFen: string,
) {
  const initialFen =
    positionNumber === '6.1' && sourcePath[0] === 'Ra8'
      ? expectedParentFen
      : getSourcePathInitialFen(positionNumber, sourcePath)
  const canonicalPath = canonicalizeSourcePath(initialFen, sourcePath)
  const token = tokenByPath.get(playbackPathKey(positionNumber, canonicalPath))
  assert.ok(
    token,
    positionNumber + ' must expose source assertion ' + sourcePath.join(' '),
  )
  assert.equal(token.parentFen, expectedParentFen)
  const navigation = navigationByChapter
    .get(getPartIdForPosition(positionNumber))
    ?.get(positionNumber)
  assert.ok(navigation)
  const node = navigation.nodesById.get(token.id)
  assert.ok(node)
  if (canonicalPath.length > 1) {
    const previousToken = tokenByPath.get(
      playbackPathKey(positionNumber, canonicalPath.slice(0, -1)),
    )
    assert.ok(previousToken)
    assert.equal(node.previousId, previousToken.id)
  }
}

function canonicalizeSourcePath(initialFen: string, sourcePath: string[]) {
  const chess = new Chess(initialFen)
  return sourcePath.map((sourceSan) => chess.move(sourceSan).san)
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

function escapeAttribute(value: string) {
  return escapeText(value).replaceAll('"', '&quot;').replaceAll("'", '&#x27;')
}

function escapeText(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
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

function getPartIdForPosition(positionNumber: string): '6' | '7' {
  if (positionNumber.startsWith('6.')) {
    return '6'
  }
  if (positionNumber.startsWith('7.')) {
    return '7'
  }
  assert.fail('Unexpected Batch 4 position ' + positionNumber)
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

function getSourcePathInitialFen(
  positionNumber: string,
  sourcePath: string[],
) {
  const board = getBoard(positionNumber)
  if (
    positionNumber === '6.1' &&
    sourcePath.length > 0 &&
    sourcePath[0] === 'Ra1'
  ) {
    return board.fen.replace(' w ', ' b ')
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

function playbackPathKey(positionNumber: string, path: string[]) {
  return positionNumber + '\u001e' + path.join('\u001f')
}

function renderPosition(partId: '6' | '7', sectionIndex: number) {
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
