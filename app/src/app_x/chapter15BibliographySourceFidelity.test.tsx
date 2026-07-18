import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { Chess } from 'chess.js'
import {
  bookPathForChapterId,
  bookPositionAnchorId,
  resolveAppRoute,
} from '../routing'
import { PositionStudyGroup } from './ChapterViewer'
import InstructionalDiagram from './InstructionalDiagram'
import type {
  BookPartSource,
  BookSource,
  DiagramSection,
  PositionSection,
  RawChapterSection,
} from './chapterTypes'
import { validateBookSource } from './bookSourceValidation'
import { buildChapterPlayback } from './moveParser'
import { buildPlaybackNavigation } from './playbackNavigation'

type BoardExpectation = {
  caption?: string
  fen: string
  number: string
  sectionIndex: number
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
validateBookSource(book)

const appendix = getPart('15')
const bibliography = getPart('bibliography')
const playback = buildChapterPlayback(appendix.sections)
const navigationByPosition = buildPlaybackNavigation(playback)

const expectedAppendixStrings = new Map<
  number,
  { content: string; type: string }
>([
  [0, { content: '15. Appendix', type: 'title' }],
  [1, { content: '1. Fortresses', type: 'heading' }],
  [
    2,
    {
      content:
        'In the introduction I explained the concept of the fortress and in some chapters we have analysed positions which could be considered fortresses. But there are some more that are interesting for the theory.\nIn the following diagrams I will show you positions that do not require much analysis, but that you should be familiar with. In some cases, a fortress is the only way to draw when certain material relations appear on the board; other situations are relatively normal, and you can head for them as a last resort.\nObserving the fortresses and understanding their logic is enough. Of course, if you are not convinced, you should check their soundness. If you reach an ending like these, with a material disadvantage, you can confidently head for these positions and you will find the right defensive procedure over the board.',
      type: 'text',
    },
  ],
  [3, { content: 'Queen vs. 2 Minor Pieces', type: 'heading' }],
  [5, { content: 'Draw. Only in the corner.', type: 'text' }],
  [7, { content: 'Draw. Only in the corner.', type: 'text' }],
  [
    9,
    {
      content:
        'Draw. The same black set-up is enough to draw anywhere on the board. The ending is usually drawn even if both knights are close to the edge of the board.',
      type: 'text',
    },
  ],
  [10, { content: 'Queen vs. Rook (and pawns)', type: 'heading' }],
  [
    11,
    {
      content:
        'A rook close to the corner can set up fortresses against a queen, even if it has a pawn.\nThe next diagrams show the most famous examples with one pawn for each player, but there can also be fortresses with more pawns on the board.',
      type: 'text',
    },
  ],
  [13, { content: 'Draw. Not with the white king on e2.', type: 'text' }],
  [15, { content: 'Draw. Not with the black king on b7.', type: 'text' }],
  [
    17,
    {
      content:
        'Draw. One of the most surprising fortresses. It requires a more accurate defence than most of the others.',
      type: 'text',
    },
  ],
  [
    19,
    {
      content: "Draw. Only with the white king on the rook's file.",
      type: 'text',
    },
  ],
  [20, { content: 'Rook vs. Bishop', type: 'heading' }],
  [
    21,
    {
      content:
        'A bishop close to the corner can successfully hold against a rook. It is worth noting another detail: usually the bishop and its pawns must occupy different-coloured squares. If the bishop is defending the pawns, the enemy king will penetrate on the opposite-coloured squares.',
      type: 'text',
    },
  ],
  [
    23,
    {
      content:
        'Draw. The bishop must control the f3-square, but not occupy g2, nor h1.',
      type: 'text',
    },
  ],
  [
    25,
    {
      content: 'Draw. The bishop must control the f3-square; the king, f2.',
      type: 'text',
    },
  ],
  [27, { content: 'Draw. Stalemate themes.', type: 'text' }],
  [
    29,
    {
      content: 'Draw. The bishop must control the g4-square.',
      type: 'text',
    },
  ],
  [
    31,
    {
      content:
        'Draw. The bishop controls g3 and the king waits, even against ...f4-f3.',
      type: 'text',
    },
  ],
  [
    33,
    {
      content:
        'A false fortress. Black can force one of the pawns’ advance to h3 and then win.',
      type: 'text',
    },
  ],
  [
    35,
    {
      content:
        'Draw. The bishop keeps controlling the f3-square. This fails with the white pawn on h2.',
      type: 'text',
    },
  ],
  [
    37,
    {
      content:
        'Draw. The bishop keeps controlling the f3-square. But this fails with the black pawn on g5.',
      type: 'text',
    },
  ],
  [
    39,
    {
      content: 'Draw. The bishop must prevent h3-h4 as well as Kf6.',
      type: 'text',
    },
  ],
  [
    41,
    {
      content:
        "Draw. But not when the defending king is on the back rank. A rook's pawn on the second rank works wonders.",
      type: 'text',
    },
  ],
  [
    43,
    {
      content:
        "Draw. In the introduction we saw many fortresses based on the defensive strength of a rook's pawn on the second rank. There could be more pawns on the h-file.",
      type: 'text',
    },
  ],
  [
    45,
    {
      content:
        'Draw, despite the overwhelming superiority of a bishop and a 7th-rank pawn. There could be more black pawns along the h7-b1 diagonal and more white pawns along h6-c1.',
      type: 'text',
    },
  ],
  [
    46,
    {
      content: '2. Different material relations: correct results',
      type: 'heading',
    },
  ],
  [
    47,
    {
      content:
        'The following list contains certain infrequent, but possible, material relations, and the correct result of those endings. I consider it unnecessary to study these endings deeply, but it is convenient to know what happens if they occur in one of our games.\nA much more complete list appears in Fundamental Chess Endings, by Müller & Lamprecht. This book can be considered a modern endgame encyclopedia and I have taken some evaluations from that list:\n2 Knights vs. a Lone King. Draw.\n2 Knights vs. King + Pawn. For this ending only I will show you a diagram.',
      type: 'text',
    },
  ],
  [49, { content: "Troitsky's Line", type: 'heading' }],
  [
    50,
    {
      content:
        'The knights can win thanks to the enemy pawn, which eliminates stalemate themes. So, if White has two knights, the pawn must be blocked at least on the line marked in the diagram (or before). I do not think this line is easy to remember, but observing it and having an idea is useful.\nQueen vs. Rook. Won, but not easy in practical play.\nQueen vs. Bishop + Knight. Won, except in position F1.\nQueen vs. 2 Bishops. Won, except in position F2.\nQueen vs. 2 Knights. This pair of minor pieces allows a greater number of drawing positions than other pairs. See F3.\nQueen + Bishop vs. Queen. Usually draw.\nQueen + Knight vs. Queen. Usually draw.\nRook + Bishop vs. Rook. Usually draw.\nRook + Knight vs. Rook. Usually draw.\n2 Bishops vs. Knight. Won. The evaluation of this ending changed in 1983 thanks to computer analysis.',
      type: 'text',
    },
  ],
])

const boardExpectations: BoardExpectation[] = [
  { caption: 'Karstedt, 1903', fen: '8/8/8/4k3/3qN3/8/6B1/7K w - - 0 1', number: 'F1', sectionIndex: 4 },
  { caption: 'Lolli, 1763', fen: '8/8/5k2/8/8/4qBB1/6K1/8 w - - 0 1', number: 'F2', sectionIndex: 6 },
  { fen: '8/8/4nn2/4k3/8/Q4K2/8/8 w - - 0 1', number: 'F3', sectionIndex: 8 },
  { fen: '8/8/8/6k1/2q3p1/4R3/5PK1/8 w - - 0 1', number: 'F4', sectionIndex: 12 },
  { caption: 'Salvioli, 1896', fen: '8/2pk4/1r6/3P4/2K1Q3/8/8/8 w - - 0 1', number: 'F5', sectionIndex: 14 },
  { fen: '8/8/8/6k1/3q3p/4R3/5PK1/8 w - - 0 1', number: 'F6', sectionIndex: 16 },
  { caption: 'Grigoriev, 1917', fen: '8/k7/p7/Pr6/K1Q5/8/8/8 w - - 0 1', number: 'F7', sectionIndex: 18 },
  { fen: '8/8/2B5/8/5kp1/8/r4P2/6K1 w - - 0 1', number: 'F8', sectionIndex: 22 },
  { fen: '8/8/8/8/3k2p1/6P1/r5B1/6K1 w - - 0 1', number: 'F9', sectionIndex: 24 },
  { fen: 'k7/p4R2/P7/1K6/8/6b1/8/8 w - - 0 1', number: 'F10', sectionIndex: 26 },
  { fen: '8/5k2/8/4r3/5p2/5B2/5PK1/8 w - - 0 1', number: 'F11', sectionIndex: 28 },
  { fen: '8/8/8/8/5pk1/8/r4BP1/5K2 w - - 0 1', number: 'F12', sectionIndex: 30 },
  { fen: '8/8/8/8/5k1p/8/r5BP/6K1 w - - 0 1', number: 'F13', sectionIndex: 32 },
  { fen: '8/6pp/8/8/7P/4k1P1/r5B1/6K1 w - - 0 1', number: 'F14', sectionIndex: 34 },
  { fen: '8/8/2B5/7p/6p1/4k1P1/3r3P/6K1 w - - 0 1', number: 'F15', sectionIndex: 36 },
  { fen: '6k1/R7/4K1pp/6b1/6P1/7P/8/8 w - - 0 1', number: 'F16', sectionIndex: 38 },
  { caption: 'Averbakh, 1962', fen: '8/2B4p/6p1/8/4k1P1/1r5P/6K1/8 w - - 0 1', number: 'F17', sectionIndex: 40 },
  { fen: '6k1/7p/5K1P/8/8/7P/6P1/8 w - - 0 1', number: 'F18', sectionIndex: 42 },
  { fen: '6k1/6Pp/7P/8/3BK3/8/8/8 w - - 0 1', number: 'F19', sectionIndex: 44 },
]

assert.equal(appendix.sections.length, 51)
assert.equal(expectedAppendixStrings.size, 31)
for (const [sectionIndex, expected] of expectedAppendixStrings) {
  assert.deepEqual(appendix.sections[sectionIndex], expected)
}
assert.equal(
  JSON.stringify(appendix.sections).includes(
    'Black can force one of the pawns to advance to h3 and then win.',
  ),
  false,
  'The unapproved F13 editorial rewrite must not survive in reader data',
)

const positions = appendix.sections.filter(
  (section): section is PositionSection => section.type === 'position',
)
assert.equal(positions.length, 19)
assert.equal(boardExpectations.length, 19)
assert.deepEqual(
  positions.map(({ content }) => content.number),
  Array.from({ length: 19 }, (_, index) => `F${index + 1}`),
)

for (const expected of boardExpectations) {
  const section = appendix.sections[expected.sectionIndex]
  assert.equal(section.type, 'position')
  const content = (section as PositionSection).content
  assert.deepEqual(
    {
      caption: content.caption,
      fen: content.fen,
      number: content.number,
      orientation: content.orientation,
    },
    {
      caption: expected.caption,
      fen: expected.fen,
      number: expected.number,
      orientation: 'white',
    },
  )
  assert.equal(new Chess(content.fen).fen(), content.fen)

  const markup = renderPosition(expected.sectionIndex)
  assert.match(markup, new RegExp(`id="${escapeRegex(bookPositionAnchorId(expected.number))}"`))
  assert.match(markup, new RegExp(`data-position-number="${expected.number}"`))
  assert.match(markup, new RegExp(`aria-labelledby="position-${expected.number}-heading"`))
  assert.match(markup, new RegExp(`aria-label="Chess position ${expected.number}"`))
  if (expected.caption) {
    assert.equal(markup.includes(expected.caption), true)
  }
}

assert.equal(playback.playablePositions.size, 0)
assert.equal(
  [...playback.tokensBySectionIndex.values()]
    .flat()
    .filter((token) => token.type === 'move').length,
  0,
  'Static Appendix copy must not manufacture clickable moves',
)

const troitsky = appendix.sections[48]
assert.equal(troitsky.type, 'diagram')
const troitskyDiagram = troitsky as DiagramSection
assert.deepEqual(troitskyDiagram.content, {
  fen: '8/8/8/8/8/8/8/8',
  hideVisualLabel: true,
  label: "Troitsky's Line",
  markers: ['a4', 'b6', 'c5', 'd4', 'e4', 'f5', 'g6', 'h4'].map(
    (square) => ({
      meaning: 'Troitsky line boundary as printed',
      square,
      symbol: '★',
    }),
  ),
  number: 'troitsky-line',
  orientation: 'white',
})
assert.deepEqual(appendix.sections[49], {
  content: "Troitsky's Line",
  type: 'heading',
})

const troitskyMarkup = renderToStaticMarkup(
  <InstructionalDiagram section={troitskyDiagram} />,
)
assert.match(
  troitskyMarkup,
  /<figure aria-label="Troitsky&#x27;s Line" class="leg-instructional-diagram" id="ptroitsky-line">/,
)
assert.doesNotMatch(troitskyMarkup, /<figcaption>/)
assert.equal(markupToText(troitskyMarkup).includes("Troitsky's Line"), false)
assert.equal(
  (troitskyMarkup.match(/leg-board-marker-glyph">★<\/span>/g) ?? []).length,
  8,
)
assert.equal(
  (troitskyMarkup.match(/aria-label="star marker on /g) ?? []).length,
  8,
)
assert.doesNotMatch(troitskyMarkup, /aria-label="\* marker on /)
for (const square of ['a4', 'b6', 'c5', 'd4', 'e4', 'f5', 'g6', 'h4']) {
  assert.equal(
    troitskyMarkup.includes(
      `aria-label="star marker on ${square}: Troitsky line boundary as printed"`,
    ),
    true,
  )
}

const invalidBook = structuredClone(book) as any
const invalidTroitsky = invalidBook.parts
  .find(({ id }: { id: string }) => id === '15')
  .sections.find(
    ({ content, type }: { content: { number?: string }; type: string }) =>
      type === 'diagram' && content.number === 'troitsky-line',
  )
invalidTroitsky.content.hideVisualLabel = 'true'
assert.throws(
  () => validateBookSource(invalidBook),
  /hideVisualLabel must be a boolean/,
)

const expectedBibliographySections: RawChapterSection[] = [
  { content: 'Bibliography', type: 'title' },
  {
    content:
      "Many a good endgame book has been written, and this bibliography does not intend to recollect all of them, but just to give the reader some advice on which works may help him complete his knowledge of theoretical endgames. Books dealing exclusively with multi-piece or multi-pawn endings or with endgame strategy are quite interesting when it comes to improve the reader's technique, but I have not taken them into account for this selection. The same goes for exercise books on endings. These are equally useful for training and checking our knowledge, but omitted in this list.",
    type: 'text',
  },
  { content: 'Rey Ardid', type: 'heading' },
  {
    content:
      "Spanish Dr. Ramón Rey Ardid's extensive endgame work occupies 5 volumes. Volumes 1 and 2 cover pawn endings under the general title Finales de Ajedrez (Chess Endings). The others are Finales de Piezas Menores (Minor-Piece Endings), Finales de Torres (Rook Endings) and Finales de Damas (Queen Endings).\nThis work constitutes one of the most complete collections of theoretical and practical endings, but some of these books are difficult to obtain. Only the volumes devoted to rook and minor-piece endings, published by Club de Ajedrez Editions, are relatively well available (in Spanish).",
    type: 'text',
  },
  { content: 'Averbakh', type: 'heading' },
  {
    content:
      'Yuri Averbakh has also published several works on theoretical endgames, covering all types of endings. His series Comprehensive Chess Endings, available in English and Russian, constitutes another extensive collection of theoretical as well as practical endings.',
    type: 'text',
  },
  { content: 'John Nunn', type: 'heading' },
  {
    content:
      'The English grandmaster John Nunn has undertaken the task of writing a series of books covering all possible positions with scarce material on the board, for which he relied on computer analysis. The first volume to appear was Secrets of Rook Endings, where Nunn studied Rook + Pawn vs. Rook endings in full detail. Later came Secrets of Pawnless Endings and Secrets of Minor-Piece Endings. The whole collection constitutes an excellent reference work that helps the reader solve all his problems in the endgame, though the present-day Nalimov Tablebases are able to serve the same purpose.',
    type: 'text',
  },
  { content: 'Paul Keres: Practical Chess Endings (Batsford)', type: 'heading' },
  {
    content:
      'A classical work which includes the most important theoretical endings together with some practical positions.',
    type: 'text',
  },
  { content: 'Levenfish & Smyslov: Rook Endings (Batsford)', type: 'heading' },
  {
    content:
      'This was the reference book for rook endings for many years, and it is still one of the most useful tools to improve our technique in these positions.',
    type: 'text',
  },
  { content: 'Ilya Maizelis: Pawn Endings (Batsford)', type: 'heading' },
  {
    content:
      "Much more heavily criticised than the previous one, Maizelis's book is also more difficult to follow.",
    type: 'text',
  },
  { content: 'Müller & Lamprecht: Secrets of Pawn Endings (Everyman)', type: 'heading' },
  {
    content:
      'In the year 2000, Everyman Chess published the first book by these two German authors, whose depth and clarity surprised the whole chess community. Currently the best book to improve our technique in pawn endings.',
    type: 'text',
  },
  { content: 'Müller & Lamprecht: Fundamental Chess Endings (Gambit)', type: 'heading' },
  {
    content:
      'After Secrets of Pawn Endings, Müller & Lamprecht published a much more ambitious project with Gambit. This work can be considered a modern encyclopedia of the endgame, as it covers all the important themes and is based on computer analysis. Therefore, this is an essential reference book and equally useful as a study book.',
    type: 'text',
  },
  {
    content: "Mark Dvoretsky: Dvoretsky's Endgame Manual (Russell Enterprises)",
    type: 'heading',
  },
  {
    content:
      "Mark Dvoretsky is the most famous chess coach in our time, who has also worked seriously on the endgame. In this great work he has collected more than one thousand examples, presenting almost all the modern theory on this phase of the game. Dvoretsky's explanations are long and didactic, and so this book can be easily used for study or simply as a reference work.\nThe book was published by Russell Enterprises, but it is not easy to find in bookshops. However, it is widely available on the Internet. Many consider Dvoretsky's Endgame Manual the best endgame book ever published to date.",
    type: 'text',
  },
]
assert.equal(expectedBibliographySections.length, 20)
assert.deepEqual(bibliography.sections, expectedBibliographySections)

const pageCopyUnits = [
  { pdfPage: 241, printPage: 240, sectionIndexes: [0, 1, 2, 3, 5, 7] },
  { pdfPage: 242, printPage: 241, sectionIndexes: [9, 10, 11, 13, 15] },
  { pdfPage: 243, printPage: 242, sectionIndexes: [17, 19, 20, 21, 23] },
  { pdfPage: 244, printPage: 243, sectionIndexes: [25, 27, 29, 31] },
  { pdfPage: 245, printPage: 244, sectionIndexes: [33, 35, 37, 39] },
  { pdfPage: 246, printPage: 245, sectionIndexes: [41, 43, 45, 46, 47] },
  { pdfPage: 247, printPage: 246, sectionIndexes: [49, 50] },
  { pdfPage: 248, printPage: 247, bibliographyIndexes: Array.from({ length: 12 }, (_, index) => index) },
  { pdfPage: 249, printPage: 248, bibliographyIndexes: Array.from({ length: 8 }, (_, index) => index + 12) },
] as const
assert.equal(pageCopyUnits.length, 9)
assert.deepEqual(
  pageCopyUnits.map(({ pdfPage }) => pdfPage),
  Array.from({ length: 9 }, (_, index) => index + 241),
)
assert.deepEqual(
  pageCopyUnits.map(({ printPage }) => printPage),
  Array.from({ length: 9 }, (_, index) => index + 240),
)

for (const number of [
  ...boardExpectations.map(({ number }) => number),
  'troitsky-line',
]) {
  const path = bookPathForChapterId('15')
  const anchorId = bookPositionAnchorId(number)
  const route = resolveAppRoute(path, `#${anchorId}`)
  assert.equal(route.href, `${path}#${anchorId}`)
  assert.equal(route.route.module, 'book')
  assert.equal(route.route.anchorId, anchorId)
}
const bibliographyRoute = resolveAppRoute(bookPathForChapterId('bibliography'))
assert.equal(bibliographyRoute.href, '/book/bibliography')
assert.equal(bibliographyRoute.route.module, 'book')

console.log(
  'Chapter 15 and bibliography source fidelity passed (9 page-copy units, 20 diagrams, 0 replay paths, exact source wording)',
)

function getPart(partId: string): BookPartSource {
  const part = book.parts.find(({ id }) => id === partId)
  assert.ok(part, `Expected source part ${partId}`)
  return part
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
      sections={appendix.sections}
    />,
  )
}

function markupToText(markup: string) {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
