import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { PanelBlock, ProseBlock } from './ChapterViewer'
import type { PanelSection } from './chapterTypes'
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

console.log('viewer presentation tests passed')
