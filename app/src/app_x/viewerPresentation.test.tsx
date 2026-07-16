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
import ModuleSelector from '../ModuleSelector'
import { chapterPayloadPath } from './chapterPayloadManifest'
import InstructionalDiagram from './InstructionalDiagram'
import TableBlock from './TableBlock'
import type {
  PanelSection,
  PositionSection,
  ProblemSection,
  RawChapterSection,
} from './chapterTypes'
import type { TextPlaybackToken } from './moveParser'
import type { RuntimeChapterPayload } from './chapterRuntime'

const activeBoards = {}
const onMoveClick = () => undefined
const onAnchorSelect = () => undefined
const onPositionStep = () => undefined

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
assert.match(frontMatterMarkup, /Black to move\. Can he draw\?/)
assert.match(frontMatterMarkup, /print page 233; PDF page 234/)
assert.match(frontMatterMarkup, /print page 238; PDF page 239/)
assert.match(frontMatterMarkup, /href="\/book\/chapter14#p14\.29"/)
const deviationListMatch = frontMatterMarkup.match(
  /<ul class="leg-deviation-list">([\s\S]*?)<\/ul>/,
)
assert.ok(deviationListMatch)
const deviationListMarkup = deviationListMatch[1]
assert.equal((deviationListMarkup.match(/<a /g) ?? []).length, 1)
assert.doesNotMatch(deviationListMarkup, /href="\/book\/chapter12#/)
assert.match(
  deviationListMarkup,
  /This digital edition presents the prompt as “White to move\. Can he draw\?” so that it agrees with the solution\./,
)
assert.doesNotMatch(deviationListMarkup, /author error|mistake|incorrect/i)
assert.doesNotMatch(frontMatterMarkup, /href="\/book\/chapter12#p12\.18"/)
assert.doesNotMatch(frontMatterMarkup, /href="\/book\/chapter12#p12\.6"/)
assert.doesNotMatch(frontMatterMarkup, /href="\/book\/chapter12#p12\.29"/)
assert.match(frontMatterMarkup, /href="\/book\/intro"/)
assert.match(frontMatterMarkup, /href="\/book\/chapter1#e1"/)
assert.match(frontMatterMarkup, /href="\/book\/bibliography"/)
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
assert.match(diagramMarkup, /href="https:\/\/lichess\.org\/editor\//)
assert.match(diagramMarkup, /The rook instructional chess diagram/)
assert.match(diagramMarkup, /aria-label="Position controls"/)
assert.match(diagramMarkup, /Expand position intro-rook-mobility/)
assert.match(diagramMarkup, /data-expanded="false"/)
assert.doesNotMatch(diagramMarkup, /fullscreen/i)
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
    onMoveClick={onMoveClick}
    onPositionReset={() => undefined}
    onPositionStep={onPositionStep}
    playback={{ playablePositions: new Set(), tokensBySectionIndex: new Map() }}
    sections={[
      positionSection,
      { content: 'Associated prose.', type: 'text' },
    ] as RawChapterSection[]}
  />,
)
assert.match(positionStudyMarkup, /leg-position-study-header/)
assert.match(positionStudyMarkup, /leg-position-study-content/)
assert.match(positionStudyMarkup, /id="p1\.1"/)
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
    onMoveClick={onMoveClick}
    onPositionReset={() => undefined}
    onPositionStep={onPositionStep}
    playback={{ playablePositions: new Set(), tokensBySectionIndex: new Map() }}
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
    onMoveClick={onMoveClick}
  />,
)
assert.equal(
  proseMarkup,
  '<div class="leg-prose"><p>First paragraph.</p><p>Second paragraph.</p></div>',
)

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
]
const playableProseMarkup = renderToStaticMarkup(
  <ProseBlock
    activeBoards={activeBoards}
    activePositionNumber={null}
    content="Play 1.a4!"
    onMoveClick={onMoveClick}
    tokens={moveTokens}
  />,
)
assert.match(playableProseMarkup, /^<div class="leg-prose"><p>/)
assert.match(playableProseMarkup, /<button[^>]*class="leg-move-token"/)
assert.match(playableProseMarkup, />1\.a4!<\/button>/)

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
    onMoveClick={onMoveClick}
    section={{ content: { text: 'An untitled callout.' }, type: 'panel' }}
  />,
)
assert.equal(
  untitledPanelMarkup,
  '<aside class="leg-panel-callout"><p>An untitled callout.</p></aside>',
)

const problemSection: ProblemSection = {
  content: {
    fen: '6k1/8/8/8/8/8/P7/7K w - - 0 1',
    number: '2.01',
    orientation: 'white',
    prompt: 'White to move. Is it a draw?',
    solution: 'Play 1.a4!',
  },
  type: 'problem',
}
const problemProps = {
  activeBoards,
  activePositionNumber: null,
  index: 1,
  navigationByPosition: new Map(),
  onMoveClick,
  onPositionReset: () => undefined,
  onPositionStep,
  onToggleSolution: () => undefined,
  playback: {
    playablePositions: new Set(['2.01']),
    tokensBySectionIndex: new Map([[1, moveTokens]]),
  },
  section: problemSection,
}
const hiddenProblemMarkup = renderToStaticMarkup(
  <ProblemStudyGroup {...problemProps} revealed={false} />,
)
assert.match(hiddenProblemMarkup, /leg-position-study-header/)
assert.match(hiddenProblemMarkup, /leg-position-study-content/)
assert.match(hiddenProblemMarkup, /id="p2\.01"/)
assert.match(hiddenProblemMarkup, /aria-expanded="false"/)
assert.match(hiddenProblemMarkup, />Show solution<\/button>/)
assert.match(hiddenProblemMarkup, /data-playable="false"/)
assert.match(hiddenProblemMarkup, />Lichess ↗<\/a>/)
assert.doesNotMatch(hiddenProblemMarkup, /aria-label="Previous move"/)
assert.doesNotMatch(hiddenProblemMarkup, /leg-move-token/)
assert.doesNotMatch(hiddenProblemMarkup, /Play 1\.a4/)

const revealedProblemMarkup = renderToStaticMarkup(
  <ProblemStudyGroup {...problemProps} revealed />,
)
assert.match(revealedProblemMarkup, /aria-expanded="true"/)
assert.match(revealedProblemMarkup, />Hide solution<\/button>/)
assert.match(revealedProblemMarkup, /data-playable="true"/)
assert.match(
  revealedProblemMarkup,
  /<button[^>]*aria-label="Previous move"[^>]*>←<\/button>/,
)
assert.match(revealedProblemMarkup, />Reset<\/button>/)
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

console.log('viewer presentation tests passed')
