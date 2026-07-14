import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ChapterSelector,
  PanelBlock,
  PositionStudyGroup,
  ProblemStudyGroup,
  ProseBlock,
} from './ChapterViewer'
import InstructionalDiagram from './InstructionalDiagram'
import TableBlock from './TableBlock'
import type {
  PanelSection,
  PositionSection,
  ProblemSection,
  RawChapterSection,
} from './chapterTypes'
import type { TextPlaybackToken } from './moveParser'

const activeBoards = {}
const onMoveClick = () => undefined

const diagramMarkup = renderToStaticMarkup(
  <InstructionalDiagram
    section={{
      type: 'diagram',
      content: {
        number: 'intro-rook-mobility',
        label: 'The rook',
        fen: '8/8/8/3R4/8/8/8/8',
      },
    }}
  />,
)
assert.match(diagramMarkup, />The rook</)
assert.doesNotMatch(diagramMarkup, /href=/)
assert.match(diagramMarkup, /The rook instructional chess diagram/)

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

const chapterChoices = [
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
  /<select[^>]*aria-label="Top chapter selector"[^>]*>/,
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
    onMoveClick={onMoveClick}
    onPositionReset={() => undefined}
    playback={{ playablePositions: new Set(), tokensBySectionIndex: new Map() }}
    sections={[
      positionSection,
      { content: 'Associated prose.', type: 'text' },
    ] as RawChapterSection[]}
  />,
)
assert.match(positionStudyMarkup, /leg-position-study-header/)
assert.match(positionStudyMarkup, /leg-position-study-content/)
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
    onMoveClick={onMoveClick}
    onPositionReset={() => undefined}
    playback={{ playablePositions: new Set(), tokensBySectionIndex: new Map() }}
    sections={[
      {
        content: {
          displayLabel: 'Draw',
          fen: '6k1/8/8/8/8/8/P7/7K w - - 0 1',
          number: 'comparison.1',
        },
        type: 'position',
      },
    ] as RawChapterSection[]}
  />,
)
assert.match(comparisonPositionMarkup, /<strong[^>]*>Draw<\/strong>/)
assert.doesNotMatch(comparisonPositionMarkup, />Position</)
assert.doesNotMatch(comparisonPositionMarkup, />comparison\.1</)

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
assert.match(hiddenProblemMarkup, /aria-expanded="false"/)
assert.match(hiddenProblemMarkup, />Show solution<\/button>/)
assert.match(hiddenProblemMarkup, /data-playable="false"/)
assert.doesNotMatch(hiddenProblemMarkup, /leg-move-token/)
assert.doesNotMatch(hiddenProblemMarkup, /Play 1\.a4/)

const revealedProblemMarkup = renderToStaticMarkup(
  <ProblemStudyGroup {...problemProps} revealed />,
)
assert.match(revealedProblemMarkup, /aria-expanded="true"/)
assert.match(revealedProblemMarkup, />Hide solution<\/button>/)
assert.match(revealedProblemMarkup, /data-playable="true"/)
assert.match(revealedProblemMarkup, /leg-move-token/)
assert.match(revealedProblemMarkup, /Play /)

console.log('viewer presentation tests passed')
