import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { PanelBlock, ProblemStudyGroup, ProseBlock } from './ChapterViewer'
import type { PanelSection, ProblemSection } from './chapterTypes'
import type { TextPlaybackToken } from './moveParser'

const activeBoards = {}
const onMoveClick = () => undefined

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
