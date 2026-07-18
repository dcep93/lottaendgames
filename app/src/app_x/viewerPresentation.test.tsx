import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import BookFrontMatter from './BookFrontMatter'
import {
  ChapterSelector,
  EndingBlock,
  PanelBlock,
  PositionStudyGroup,
  ProblemStudyGroup,
  ProseBlock,
  ReaderMeta,
} from './ChapterViewer'
import { shouldHandleBookReferenceClick } from './bookReferenceNavigation'
import ModuleSelector from '../ModuleSelector'
import { chapterPayloadPath } from './chapterPayloadManifest'
import ChessBoard from './ChessBoard'
import InstructionalDiagram from './InstructionalDiagram'
import TableBlock from './TableBlock'
import type {
  PanelSection,
  PositionSection,
  ProblemSection,
  RawChapterSection,
} from './chapterTypes'
import type { TextPlaybackToken } from './moveParser'
import type { BookReferenceSpan } from './bookReferences'
import type { RuntimeChapterPayload } from './chapterRuntime'

const activeBoards = {}
const onMoveClick = () => undefined
const onAnchorSelect = () => undefined
const onBookNavigate = () => undefined
const onPositionStep = () => undefined

assert.equal(
  shouldHandleBookReferenceClick({
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  }),
  true,
)
assert.equal(
  shouldHandleBookReferenceClick({
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: true,
    shiftKey: false,
  }),
  false,
)

const moduleSelectorMarkup = renderToStaticMarkup(
  <ModuleSelector activeModule="book" onNavigate={() => undefined} />,
)
assert.match(moduleSelectorMarkup, /aria-label="Modules"/)
assert.match(moduleSelectorMarkup, /href="\/book\/about"/)
assert.match(moduleSelectorMarkup, /href="\/mate"/)
assert.match(moduleSelectorMarkup, /aria-current="page"[^>]*>Book</)

const runtimePayload = JSON.parse(
  readFileSync(
    new URL(`../../public/${chapterPayloadPath}`, import.meta.url),
    'utf8',
  ),
) as RuntimeChapterPayload
assert.equal(runtimePayload.schemaVersion, 3)

let runtimeReferenceSpanCount = 0

for (const chapter of runtimePayload.chapters) {
  const playbackTokens = new Map(chapter.playback.tokensBySectionIndex)

  for (const [sectionIndex, spans] of chapter.referencesBySectionIndex) {
    const section = chapter.sections[sectionIndex]
    const content = section.content as
      | string
      | { solution?: string; text?: string }
    const source =
      spans[0].field === 'content'
        ? (content as string)
        : ((content as { solution?: string; text?: string })[spans[0].field] ??
          '')

    for (const span of spans) {
      assert.equal(source.slice(span.start, span.end), span.number)
      runtimeReferenceSpanCount += 1
    }

    const tokens = playbackTokens.get(sectionIndex)

    if (tokens) {
      assert.equal(
        tokens
          .filter((token) => token.type !== 'move' || !token.hidden)
          .map((token) => (token.type === 'text' ? token.text : token.display))
          .join(''),
        source,
      )
    }
  }
}

assert.equal(runtimeReferenceSpanCount, 94)
const frontMatterMarkup = renderToStaticMarkup(
  <BookFrontMatter
    chapters={runtimePayload.chapters}
    onNavigate={() => undefined}
  />,
)
const frontMatterSectionOrder = [
  'With thanks',
  'About this project',
  'About this edition',
  'Reader features',
  'Note on this digital edition',
  'Publisher&#x27;s description',
  'Table of contents',
]
const frontMatterSectionIndexes = frontMatterSectionOrder.map((heading) => {
  const index = frontMatterMarkup.indexOf(heading)
  assert.notEqual(index, -1, `missing About-page heading: ${heading}`)
  return index
})
assert.deepEqual(
  [...frontMatterSectionIndexes].sort((left, right) => left - right),
  frontMatterSectionIndexes,
  'About-page sections must remain in the requested DOM order',
)
assert.match(frontMatterMarkup, /Jesús de la Villa/)
assert.match(frontMatterMarkup, /Vital Lessons for Every Chess Player/)
assert.match(frontMatterMarkup, /New In Chess, 2008/)
assert.match(frontMatterMarkup, /© 2008 New In Chess/)
assert.match(frontMatterMarkup, /New In Chess, Alkmaar, The Netherlands/)
assert.match(frontMatterMarkup, /href="https:\/\/www\.newinchess\.com\/"/)
assert.match(frontMatterMarkup, /All photos: New In Chess Archives\./)
assert.match(frontMatterMarkup, /Steven Boland/)
assert.match(frontMatterMarkup, /Patricia Llaneza Vega/)
assert.match(frontMatterMarkup, /Steve Giddins/)
assert.match(frontMatterMarkup, /Peter Boel/)
assert.match(frontMatterMarkup, /René Olthof/)
assert.match(frontMatterMarkup, /Anton Schermer/)
assert.match(frontMatterMarkup, /Publisher&#x27;s description/)
assert.match(frontMatterMarkup, /The good news about chess endgames is:/)
assert.match(frontMatterMarkup, /Printed cover price: Games \/ Chess \$24\.95/)
assert.doesNotMatch(frontMatterMarkup, /All rights reserved/)
assert.match(frontMatterMarkup, /href="mailto:dcep93@gmail.com"/)
assert.doesNotMatch(frontMatterMarkup, /38\.Kd7\+/)
assert.match(frontMatterMarkup, /Note on this digital edition/)
const deviationListMatch = frontMatterMarkup.match(
  /<ul class="leg-deviation-list">([\s\S]*?)<\/ul>/,
)
assert.ok(deviationListMatch)
const deviationListMarkup = deviationListMatch[1]
const deviationListItems = Array.from(
  deviationListMarkup.matchAll(/<li>([\s\S]*?)<\/li>/g),
  (match) => match[1],
)
assert.match(
  deviationListItems[0],
  /The author of this digital app consulted only the 2008 edition\. The issues listed below were likely corrected in later editions\./,
)
assert.doesNotMatch(deviationListItems[0], /<a /)
assert.equal((deviationListMarkup.match(/<a /g) ?? []).length, 28)
assert.doesNotMatch(deviationListMarkup, /PDF page/)
assert.doesNotMatch(deviationListMarkup, /Position 1\.14/)
assert.doesNotMatch(deviationListMarkup, /href="\/book\/chapter1#p1\.14"/)
assert.doesNotMatch(deviationListMarkup, /Appendix F13/)
assert.doesNotMatch(deviationListMarkup, /href="\/book\/chapter15#pF13"/)
const correctionPrintPages = deviationListItems.slice(1).map((item, index) => {
  const printPageMatch = item.match(/print page (\d+)/)
  assert.ok(
    printPageMatch,
    `Note correction entry ${index + 1} must include a print page`,
  )
  return Number(printPageMatch[1])
})
assert.deepEqual(
  correctionPrintPages,
  [...correctionPrintPages].sort((left, right) => left - right),
  'Note correction entries must be ordered by their earliest print page',
)
assert.match(deviationListMarkup, /Black to move\. Can he draw\?/)
assert.match(deviationListMarkup, /print page 233/)
assert.match(deviationListMarkup, /print page 238/)
assert.match(deviationListMarkup, /href="\/book\/chapter14#p14\.29"/)
assert.match(deviationListMarkup, /href="\/book\/chapter12#p12\.19"/)
assert.match(deviationListMarkup, /Position 12\.19/)
assert.match(deviationListMarkup, /print page 185/)
assert.match(
  deviationListMarkup,
  /Immediately after 3\.d3\+, 3\.\.\.Kb5 is legal and draws, so this digital edition corrects the move number from 4\.\.\.Kb5 to 3\.\.\.Kb5\./,
)
assert.match(deviationListMarkup, /href="\/book\/chapter11#p11\.1"/)
assert.match(deviationListMarkup, /Position 11\.1/)
assert.match(deviationListMarkup, /print page 154/)
assert.match(deviationListMarkup, /black rook on g1 cannot move to c8/)
assert.match(deviationListMarkup, /intended move is uncertain/)
assert.match(deviationListMarkup, /href="\/book\/chapter1#p1\.7"/)
assert.match(deviationListMarkup, /href="\/book\/chapter1#p1\.10"/)
assert.match(deviationListMarkup, /href="\/book\/chapter1#p1\.16"/)
assert.match(
  deviationListMarkup,
  /Most mistakes made in King \+ Pawn vs\. Pawn endings occur in this position\./,
)
assert.match(deviationListMarkup, /print page 32/)
assert.match(deviationListMarkup, /King \+ Pawn vs\. King endings/)
assert.match(deviationListMarkup, /Now the pawn cannot be stopped\./)
assert.match(deviationListMarkup, /print page 34/)
assert.match(deviationListMarkup, /Now the pawn can be stopped\./)
assert.match(deviationListMarkup, /the stronger side’s king\.\./)
assert.match(deviationListMarkup, /print page 38/)
assert.match(deviationListMarkup, /the stronger side’s king\./)
assert.match(deviationListMarkup, /href="\/book\/chapter4#p4\.6"/)
assert.match(deviationListMarkup, /href="\/book\/chapter4#p4\.11"/)
assert.match(
  deviationListMarkup,
  /White cannot win tempi to bring his king nearer anymore\./,
)
assert.match(deviationListMarkup, /print page 63/)
assert.match(
  deviationListMarkup,
  /Black cannot win tempi to bring his king nearer anymore\./,
)
assert.match(
  deviationListMarkup,
  /Only move, but not enough to draw\./,
)
assert.match(deviationListMarkup, /print page 66/)
assert.match(deviationListMarkup, /Only move, but enough to draw\./)
assert.match(
  deviationListMarkup,
  /This digital edition presents the prompt as “White to move\. Can he draw\?” so that it agrees with the solution\./,
)
assert.doesNotMatch(
  deviationListMarkup,
  /author (?:error|mistake)|book (?:error|mistake)|publisher (?:error|mistake)|incorrect/i,
)
assert.doesNotMatch(frontMatterMarkup, /href="\/book\/chapter12#p12\.18"/)
assert.doesNotMatch(frontMatterMarkup, /href="\/book\/chapter12#p12\.6"/)
assert.doesNotMatch(frontMatterMarkup, /href="\/book\/chapter12#p12\.29"/)
assert.match(frontMatterMarkup, /href="\/book\/intro"/)
assert.match(frontMatterMarkup, /href="\/book\/chapter1#e1"/)
assert.match(frontMatterMarkup, /href="\/book\/bibliography"/)
const contentsMarkupMatch = frontMatterMarkup.match(
  /<nav aria-labelledby="book-contents-heading"[\s\S]*?<\/nav>/,
)
assert.ok(contentsMarkupMatch)
const bookContentsMarkup = contentsMarkupMatch[0]
assert.equal(
  (bookContentsMarkup.match(/class="leg-contents-supplement"/g) ?? []).length,
  2,
)
assert.equal(
  (
    bookContentsMarkup.match(
      /class="leg-contents-row leg-contents-supplement-row"/g,
    ) ?? []
  ).length,
  2,
)
assert.match(bookContentsMarkup, /href="\/book\/chapter2#p2\.01-solution">/)
assert.match(bookContentsMarkup, /href="\/book\/chapter14#p14\.01-solution">/)
assert.equal((bookContentsMarkup.match(/>Solutions<\/span>/g) ?? []).length, 2)
for (const [chapterHref, solutionHref, nextChapterHref] of [
  [
    'href="/book/chapter2"',
    'href="/book/chapter2#p2.01-solution"',
    'href="/book/chapter3"',
  ],
  [
    'href="/book/chapter14"',
    'href="/book/chapter14#p14.01-solution"',
    'href="/book/chapter15"',
  ],
] as const) {
  const chapterIndex = bookContentsMarkup.indexOf(chapterHref)
  const solutionIndex = bookContentsMarkup.indexOf(solutionHref)
  const nextChapterIndex = bookContentsMarkup.indexOf(nextChapterHref)
  assert.ok(chapterIndex < solutionIndex)
  assert.ok(solutionIndex < nextChapterIndex)
}
assert.equal((frontMatterMarkup.match(/>Ending \d+</g) ?? []).length, 100)
assert.match(frontMatterMarkup, /<ol class="leg-contents-list">/)
assert.equal(
  (frontMatterMarkup.match(/class="leg-contents-chapter"/g) ?? []).length,
  17,
)
assert.equal(
  (
    frontMatterMarkup.match(
      /class="leg-contents-row leg-contents-chapter-row"/g,
    ) ?? []
  ).length,
  17,
)
assert.equal(
  (frontMatterMarkup.match(/class="leg-contents-ending"/g) ?? []).length,
  100,
)
assert.equal(
  (
    frontMatterMarkup.match(
      /class="leg-contents-row leg-contents-ending-row"/g,
    ) ?? []
  ).length,
  100,
)
assert.doesNotMatch(frontMatterMarkup, /<(?:details|summary)\b/)

const diagramMarkup = renderToStaticMarkup(
  <InstructionalDiagram
    section={{
      type: 'diagram',
      content: {
        number: 'intro-rook-mobility',
        label: 'The rook',
        subtitle: 'Printed route',
        fen: '8/8/8/3R4/8/8/8/8',
        orientation: 'white',
        routes: [
          {
            meaning: 'Printed route',
            squares: ['d5', 'e7'],
          },
        ],
      },
    }}
  />,
)
assert.match(diagramMarkup, />The rook</)
assert.match(diagramMarkup, />Printed route</)
assert.match(diagramMarkup, /class="leg-board-route-layer"/)
assert.match(diagramMarkup, /points="43.75,43.75 56.25,18.75"/)
assert.doesNotMatch(diagramMarkup, /href="https:\/\/lichess\.org\//)
assert.match(diagramMarkup, /The rook instructional chess diagram/)
assert.doesNotMatch(diagramMarkup, /aria-label="Position controls"/)
assert.match(diagramMarkup, /Expand The rook instructional chess diagram/)
assert.doesNotMatch(diagramMarkup, /Expand position intro-rook-mobility/)
assert.match(diagramMarkup, /data-expanded="false"/)
assert.doesNotMatch(diagramMarkup, /fullscreen/i)
const legalDiagramMarkup = renderToStaticMarkup(
  <InstructionalDiagram
    section={{
      type: 'diagram',
      content: {
        number: 'intro-king-routes',
        label: "The king's routes",
        fen: '7k/8/8/8/8/8/8/K7',
        orientation: 'white',
      },
    }}
  />,
)
assert.doesNotMatch(legalDiagramMarkup, /href="https:\/\/lichess\.org\//)
assert.doesNotMatch(legalDiagramMarkup, /aria-label="Position controls"/)
const chapterOneDiagramMarkup = renderToStaticMarkup(
  <ChessBoard
    boundaryPaths={[
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
    ]}
    fen="6k1/8/8/8/P7/8/8/7K b - - 0 1"
    markers={[
      { meaning: 'key square', square: 'e6', symbol: '★' },
      { meaning: 'key square', square: 'f6', symbol: '★' },
      { meaning: 'key square', square: 'g6', symbol: '★' },
    ]}
    number="1.2"
    orientation="white"
  />,
)
assert.match(chapterOneDiagramMarkup, /class="leg-board-boundary-layer"/)
assert.match(
  chapterOneDiagramMarkup,
  /points="0,62\.5 0,0 62\.5,0 62\.5,62\.5 0,62\.5"/,
)
assert.doesNotMatch(chapterOneDiagramMarkup, /class="leg-board-route-layer"/)
assert.equal(
  (chapterOneDiagramMarkup.match(
    /class="leg-board-marker-glyph">★<\/span>/g,
  ) ?? []).length,
  3,
)
assert.match(
  chapterOneDiagramMarkup,
  /aria-label="star marker on e6: key square"/,
)
assert.doesNotMatch(chapterOneDiagramMarkup, /aria-label="★ marker/)
const chessBoardSource = readFileSync(
  new URL('./ChessBoard.tsx', import.meta.url),
  'utf8',
)
assert.doesNotMatch(
  chessBoardSource,
  /requestFullscreen|exitFullscreen|fullscreenElement/,
)

const tableMarkup = renderToStaticMarkup(
  <TableBlock
    section={{
      type: 'table',
      content: {
        caption: 'Endgame statistics',
        columns: ['Type of ending', 'Games'],
        rows: [['Rooks', '320,548']],
      },
    }}
  />,
)
assert.match(tableMarkup, /<caption>Endgame statistics<\/caption>/)
assert.match(tableMarkup, /<th scope="col">Type of ending<\/th>/)
assert.match(tableMarkup, /<th scope="row">Rooks<\/th>/)
const uncaptionedTableMarkup = renderToStaticMarkup(
  <TableBlock
    section={{
      type: 'table',
      content: {
        columns: ['Type of ending', 'Games', '%'],
        rows: [['Rooks', '320,548', '8.01']],
      },
    }}
  />,
)
assert.doesNotMatch(uncaptionedTableMarkup, /<caption>/)

const originalConsoleError = console.error
const duplicateHeaderErrors: unknown[][] = []
console.error = (...args: unknown[]) => duplicateHeaderErrors.push(args)
try {
  renderToStaticMarkup(
    <TableBlock
      section={{
        type: 'table',
        content: {
          columns: ['Type of ending', 'Games', '%', 'Drawn games', '%'],
          rows: [['Rooks', '320,548', '8.01', '120,610', '37.63']],
        },
      }}
    />,
  )
} finally {
  console.error = originalConsoleError
}
assert.deepEqual(duplicateHeaderErrors, [])

const bibliographyMetaMarkup = renderToStaticMarkup(
  <ReaderMeta endingRange={null} positionCount={0} />,
)
assert.equal(bibliographyMetaMarkup, '')
const chapterMetaMarkup = renderToStaticMarkup(
  <ReaderMeta endingRange="1-9" positionCount={25} />,
)
assert.match(chapterMetaMarkup, />Endings 1-9</)
assert.match(chapterMetaMarkup, />25 boards</)
assert.doesNotMatch(chapterMetaMarkup, /sections/)

const chapterChoices = [
  { id: 'about', label: 'About', name: 'About this edition' },
  { id: 'introduction', label: 'Introduction', name: 'Introduction' },
  { id: '1', label: 'Chapter 1', name: 'Basic endings' },
  { id: '2', label: 'Chapter 2', name: 'Basic Test' },
]
const contentsMarkup = renderToStaticMarkup(
  <ChapterSelector
    activeChapterId="2"
    chapters={chapterChoices}
    label="Top chapter selector"
    onSelect={() => undefined}
    variant="select"
  />,
)
assert.match(contentsMarkup, /leg-chapter-picker/)
assert.match(
  contentsMarkup,
  /<option value="about">About - About this edition<\/option>/,
)
assert.match(
  contentsMarkup,
  /<select[^>]*aria-label="Top chapter selector"[^>]*>/,
)
assert.match(
  contentsMarkup,
  /<option value="introduction">Introduction<\/option>/,
)
assert.match(
  contentsMarkup,
  /<option value="1">Chapter 1 - Basic endings<\/option>/,
)
assert.match(
  contentsMarkup,
  /<option value="2" selected="">Chapter 2 - Basic Test<\/option>/,
)
assert.doesNotMatch(contentsMarkup, /leg-chapter-row/)

const compactSelectorMarkup = renderToStaticMarkup(
  <ChapterSelector
    activeChapterId="1"
    chapters={chapterChoices}
    label="Chapters"
    onSelect={() => undefined}
    variant="compact"
  />,
)
assert.match(compactSelectorMarkup, /leg-chapter-selector is-compact/)
assert.doesNotMatch(compactSelectorMarkup, /Basic endings/)

const positionSection: PositionSection = {
  content: {
    boundaryPaths: [
      {
        meaning: 'Printed stepped boundary',
        points: [
          { x: 37.5, y: 0 },
          { x: 37.5, y: 50 },
          { x: 50, y: 50 },
          { x: 50, y: 62.5 },
          { x: 100, y: 62.5 },
        ],
      },
    ],
    fen: '6k1/8/8/8/8/8/P7/7K w - - 0 1',
    number: '1.1',
    orientation: 'white',
    subtitle: 'A sample position',
  },
  type: 'position',
}
const positionStudyMarkup = renderToStaticMarkup(
  <PositionStudyGroup
    activeBoards={activeBoards}
    activePositionNumber={null}
    group={{ contentIndexes: [1], index: 0, type: 'positionGroup' }}
    navigationByPosition={new Map()}
    onAnchorSelect={onAnchorSelect}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    onPositionReset={() => undefined}
    onPositionStep={onPositionStep}
    playback={{ playablePositions: new Set(), tokensBySectionIndex: new Map() }}
    referencesBySectionIndex={new Map()}
    sections={[
      positionSection,
      { content: 'Associated prose.', type: 'text' },
    ] as RawChapterSection[]}
  />,
)
assert.match(positionStudyMarkup, /leg-position-study-header/)
assert.match(positionStudyMarkup, /leg-position-study-content/)
assert.match(positionStudyMarkup, /id="p1\.1"/)
assert.match(positionStudyMarkup, /class="leg-board-boundary-layer"/)
assert.match(
  positionStudyMarkup,
  /points="37\.5,0 37\.5,50 50,50 50,62\.5 100,62\.5"/,
)
assert.ok(
  positionStudyMarkup.indexOf('leg-position-study-header') <
    positionStudyMarkup.indexOf('leg-position-study-content'),
)

const comparisonPositionMarkup = renderToStaticMarkup(
  <PositionStudyGroup
    activeBoards={activeBoards}
    activePositionNumber={null}
    group={{ contentIndexes: [], index: 0, type: 'positionGroup' }}
    navigationByPosition={new Map()}
    onAnchorSelect={onAnchorSelect}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    onPositionReset={() => undefined}
    onPositionStep={onPositionStep}
    playback={{ playablePositions: new Set(), tokensBySectionIndex: new Map() }}
    referencesBySectionIndex={new Map()}
    sections={[
      {
        content: {
          displayLabel: 'Draw',
          fen: '6k1/8/8/8/8/8/P7/7K w - - 0 1',
          number: 'comparison.1',
          orientation: 'white',
        },
        type: 'position',
      },
    ] as RawChapterSection[]}
  />,
)
assert.match(comparisonPositionMarkup, /<strong[^>]*>Draw<\/strong>/)
assert.doesNotMatch(comparisonPositionMarkup, />Position</)
assert.doesNotMatch(comparisonPositionMarkup, />comparison\.1</)

const endingMarkup = renderToStaticMarkup(
  <EndingBlock
    onAnchorSelect={onAnchorSelect}
    section={{
      content: { number: '1', text: 'The rule of the square' },
      type: 'ending',
    }}
  />,
)
assert.match(endingMarkup, /id="e1"/)
assert.match(endingMarkup, /href="#e1"/)

const proseMarkup = renderToStaticMarkup(
  <ProseBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    content={'First paragraph.\nSecond paragraph.'}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
  />,
)
assert.equal(
  proseMarkup,
  '<div class="leg-prose"><p>First paragraph.</p><p>Second paragraph.</p></div>',
)

const referencedProse = 'See Ending 56 and Position 10.2.'
const referencedProseSpans: BookReferenceSpan[] = [
  {
    end: referencedProse.indexOf('56') + 2,
    field: 'content',
    href: '/book/chapter10#e56',
    kind: 'ending',
    number: '56',
    start: referencedProse.indexOf('56'),
  },
  {
    end: referencedProse.indexOf('10.2') + 4,
    field: 'content',
    href: '/book/chapter10#p10.2',
    kind: 'board',
    number: '10.2',
    start: referencedProse.indexOf('10.2'),
  },
]
const referencedProseMarkup = renderToStaticMarkup(
  <ProseBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    content={referencedProse}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    referenceSpans={referencedProseSpans}
  />,
)
assert.match(
  referencedProseMarkup,
  /class="leg-book-reference" href="\/book\/chapter10#e56"/,
)
assert.match(
  referencedProseMarkup,
  /class="leg-book-reference" href="\/book\/chapter10#p10\.2"/,
)
assert.match(referencedProseMarkup, />56<\/a>/)
assert.match(referencedProseMarkup, />10\.2<\/a>/)

const misalignedReferenceMarkup = renderToStaticMarkup(
  <ProseBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    content="Ending 56 remains readable."
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    referenceSpans={[
      {
        end: 8,
        field: 'content',
        href: '/book/chapter10#e56',
        kind: 'ending',
        number: '56',
        start: 6,
      },
    ]}
  />,
)
assert.doesNotMatch(misalignedReferenceMarkup, /leg-book-reference/)
assert.match(misalignedReferenceMarkup, /Ending 56 remains readable\./)

const moveTokens: TextPlaybackToken[] = [
  { text: 'Play ', type: 'text' },
  {
    display: '1.a4!',
    fen: '6k1/8/8/8/P7/8/8/7K b - - 0 1',
    id: 'test-a4',
    parentFen: '6k1/8/8/8/8/8/P7/7K w - - 0 1',
    path: ['a4'],
    positionNumber: '1.1',
    san: 'a4',
    type: 'move',
  },
  {
    display: '2...Kg6',
    fen: '6k1/8/6K1/8/P7/8/8/8 w - - 1 2',
    hidden: true,
    id: 'test-navigation-alias',
    parentFen: '6k1/8/8/8/P7/8/6K1/8 b - - 0 1',
    path: ['a4', 'Kg6'],
    positionNumber: '1.1',
    san: 'Kg6',
    type: 'move',
  },
]
const playableProseMarkup = renderToStaticMarkup(
  <ProseBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    content="Play 1.a4!"
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    tokens={moveTokens}
  />,
)
assert.match(playableProseMarkup, /^<div class="leg-prose"><p>/)
assert.match(playableProseMarkup, /<button[^>]*class="leg-move-token"/)
assert.match(playableProseMarkup, />1\.a4!<\/button>/)
assert.doesNotMatch(playableProseMarkup, /2\.\.\.Kg6/)

const referencedPlayableContent = 'See Ending 1. Play 1.a4!'
const referencedMoveTokens: TextPlaybackToken[] = [
  { text: 'See Ending 1. Play ', type: 'text' },
  moveTokens[1],
]
const referencedPlayableMarkup = renderToStaticMarkup(
  <ProseBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    content={referencedPlayableContent}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    referenceSpans={[
      {
        end: 12,
        field: 'content',
        href: '/book/chapter1#e1',
        kind: 'ending',
        number: '1',
        start: 11,
      },
    ]}
    tokens={referencedMoveTokens}
  />,
)
assert.match(referencedPlayableMarkup, /href="\/book\/chapter1#e1"/)
assert.match(referencedPlayableMarkup, /<button[^>]*class="leg-move-token"/)

const titledPanel: PanelSection = {
  content: {
    text: 'If the king can reach the square, then he can capture the pawn.',
    title: 'Rule of the square',
  },
  type: 'panel',
}
const titledPanelMarkup = renderToStaticMarkup(
  <PanelBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    section={titledPanel}
  />,
)
assert.equal(
  titledPanelMarkup,
  '<aside class="leg-panel-callout"><p>Rule of the square: If the king can reach the square, then he can capture the pawn.</p></aside>',
)
assert.doesNotMatch(titledPanelMarkup, /<h[1-6]/)

const untitledPanelMarkup = renderToStaticMarkup(
  <PanelBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    section={{ content: { text: 'An untitled callout.' }, type: 'panel' }}
  />,
)
assert.equal(
  untitledPanelMarkup,
  '<aside class="leg-panel-callout"><p>An untitled callout.</p></aside>',
)

const referencedPanelText = 'Review Ending 84.'
const referencedPanelMarkup = renderToStaticMarkup(
  <PanelBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    onBookNavigate={onBookNavigate}
    onMoveClick={onMoveClick}
    referenceSpans={[
      {
        end: referencedPanelText.indexOf('84') + 2,
        field: 'text',
        href: '/book/chapter12#e84',
        kind: 'ending',
        number: '84',
        start: referencedPanelText.indexOf('84'),
      },
    ]}
    section={{ content: { text: referencedPanelText }, type: 'panel' }}
  />,
)
assert.match(referencedPanelMarkup, /href="\/book\/chapter12#e84"/)

const problemSection: ProblemSection = {
  content: {
    fen: '6k1/8/8/8/8/8/P7/7K w - - 0 1',
    number: '2.01',
    orientation: 'white',
    prompt: 'White to move. Is it a draw?',
    solution: 'See Ending 1. Play 1.a4!',
  },
  type: 'problem',
}
const problemProps = {
  activeBoards,
  activePositionNumber: null,
  index: 1,
  navigationByPosition: new Map(),
  onBookNavigate,
  onMoveClick,
  onPositionReset: () => undefined,
  onPositionStep,
  onToggleSolution: () => undefined,
  playback: {
    playablePositions: new Set(['2.01']),
    tokensBySectionIndex: new Map([[1, referencedMoveTokens]]),
  },
  referenceSpans: [
    {
      end: 12,
      field: 'solution',
      href: '/book/chapter1#e1',
      kind: 'ending',
      number: '1',
      start: 11,
    },
  ] as BookReferenceSpan[],
  section: problemSection,
}
const hiddenProblemMarkup = renderToStaticMarkup(
  <ProblemStudyGroup {...problemProps} revealed={false} />,
)
assert.match(hiddenProblemMarkup, /leg-position-study-header/)
assert.match(hiddenProblemMarkup, /leg-position-study-content/)
assert.match(hiddenProblemMarkup, /id="p2\.01"/)
assert.match(hiddenProblemMarkup, /id="p2\.01-solution"/)
assert.match(hiddenProblemMarkup, /aria-expanded="false"/)
assert.match(hiddenProblemMarkup, />Show solution<\/button>/)
assert.match(hiddenProblemMarkup, /data-playable="false"/)
assert.match(hiddenProblemMarkup, />Lichess ↗<\/a>/)
assert.doesNotMatch(hiddenProblemMarkup, /aria-label="Previous move"/)
assert.doesNotMatch(hiddenProblemMarkup, /leg-move-token/)
assert.doesNotMatch(hiddenProblemMarkup, /Play 1\.a4/)
assert.doesNotMatch(hiddenProblemMarkup, /id="problem-2\.01-solution"/)

const revealedProblemMarkup = renderToStaticMarkup(
  <ProblemStudyGroup {...problemProps} revealed />,
)
assert.match(revealedProblemMarkup, /aria-expanded="true"/)
assert.match(revealedProblemMarkup, /id="p2\.01-solution"/)
assert.match(revealedProblemMarkup, /id="problem-2\.01-solution"/)
assert.match(revealedProblemMarkup, />Hide solution<\/button>/)
assert.match(revealedProblemMarkup, /data-playable="true"/)
assert.match(
  revealedProblemMarkup,
  /<button[^>]*aria-label="Previous move"[^>]*>←<\/button>/,
)
assert.match(revealedProblemMarkup, />Reset<\/button>/)
assert.match(revealedProblemMarkup, /href="\/book\/chapter1#e1"/)
assert.match(
  revealedProblemMarkup,
  /<button[^>]*aria-label="Next move"[^>]*>→<\/button>/,
)
assert.doesNotMatch(revealedProblemMarkup, /Start position/)
assert.doesNotMatch(revealedProblemMarkup, /Keys: ← →/)
assert.doesNotMatch(revealedProblemMarkup, /leg-position-status/)
assert.doesNotMatch(revealedProblemMarkup, /leg-position-key-hint/)
assert.match(revealedProblemMarkup, />Lichess ↗<\/a>/)
const lichessControlIndex = revealedProblemMarkup.indexOf('>Lichess ↗</a>')
const previousControlIndex = revealedProblemMarkup.indexOf(
  'aria-label="Previous move"',
)
const resetControlIndex = revealedProblemMarkup.indexOf('>Reset</button>')
const nextControlIndex = revealedProblemMarkup.indexOf('aria-label="Next move"')
assert.ok(lichessControlIndex < previousControlIndex)
assert.ok(previousControlIndex < resetControlIndex)
assert.ok(resetControlIndex < nextControlIndex)
assert.ok(
  revealedProblemMarkup.indexOf('leg-position-controls') <
    revealedProblemMarkup.indexOf('<figcaption>'),
)
assert.match(revealedProblemMarkup, /leg-move-token/)
assert.match(revealedProblemMarkup, /Play /)

const problem1413Section: ProblemSection = {
  content: {
    fen: '8/8/1k6/8/P2P4/8/8/8 b - - 0 1',
    number: '14.13',
    orientation: 'white',
    prompt:
      'Is there any square on the board for the white king such that Black can draw?',
    solution: 'The white king must be on a1.',
    solutionFen: '8/8/1k6/8/P2P4/8/8/K7 b - - 0 1',
  },
  type: 'problem',
}
const problem1413Props = {
  ...problemProps,
  playback: {
    playablePositions: new Set(['14.13']),
    tokensBySectionIndex: new Map(),
  },
  section: problem1413Section,
}
const hiddenProblem1413Markup = renderToStaticMarkup(
  <ProblemStudyGroup {...problem1413Props} revealed={false} />,
)
assert.doesNotMatch(hiddenProblem1413Markup, />Lichess ↗<\/a>/)
assert.doesNotMatch(
  hiddenProblem1413Markup,
  /aria-label="Position controls"/,
)

const revealedProblem1413Markup = renderToStaticMarkup(
  <ProblemStudyGroup {...problem1413Props} revealed />,
)
assert.match(revealedProblem1413Markup, />Lichess ↗<\/a>/)
assert.match(revealedProblem1413Markup, /aria-label="Position controls"/)
assert.match(revealedProblem1413Markup, /aria-label="Previous move"/)

console.log('viewer presentation tests passed')
