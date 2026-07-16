import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import MateBoard from './MateBoard'
import {
  MATE_REPLY_ANIMATION_MS,
  getMateBoardSquareStyles,
  tryMateBoardMove,
} from './boardInteraction'
import MateControls from './MateControls'

const ROOK_START = '7k/8/8/8/8/8/R7/K7 w - - 0 1'

function buttonMarkup(markup: string, label: string): string {
  const match = markup.match(
    new RegExp(`<button[^>]*>${label}</button>`),
  )
  assert.ok(match, `missing button named ${label}`)
  return match[0]
}

test('Mate board is a controlled, White-oriented phase surface', () => {
  const markup = renderToStaticMarkup(
    <React.Fragment>
      <MateBoard
        disabled={false}
        fen={ROOK_START}
        lastMove={['h7', 'h8']}
        onMove={() => undefined}
        phase="2/2"
      />
    </React.Fragment>,
  )

  assert.match(markup, /aria-label="Mate board, White orientation"/)
  assert.match(markup, /data-orientation="white"/)
  assert.match(markup, /data-phase="2\/2"/)
  assert.match(markup, /leg-mate-board-shell--phase-two/)
  assert.match(
    markup,
    new RegExp(`data-reply-animation-ms="${MATE_REPLY_ANIMATION_MS}"`),
  )
  assert.match(markup, /data-last-move="h7-h8"/)
})

test('Mate board last-move treatment marks both controlled squares', () => {
  const lastMove: readonly [Square, Square] = ['a2', 'a8']
  const styles = getMateBoardSquareStyles(lastMove, null, new Map())

  assert.match(String(styles.a2?.background), /last-move/)
  assert.match(String(styles.a8?.background), /last-move/)
})

test('a legal drop dispatches canonical SAN exactly once', () => {
  const moves: string[] = []

  assert.equal(
    tryMateBoardMove({
      disabled: false,
      fen: ROOK_START,
      onMove: (san) => moves.push(san),
      sourceSquare: 'a2',
      targetSquare: 'a8',
    }),
    true,
  )
  assert.deepEqual(moves, ['Ra8+'])
})

test('illegal, disabled, malformed, and non-White drops are inert', () => {
  const moves: string[] = []
  const onMove = (san: string) => moves.push(san)

  assert.equal(
    tryMateBoardMove({
      disabled: false,
      fen: ROOK_START,
      onMove,
      sourceSquare: 'a2',
      targetSquare: 'b3',
    }),
    false,
  )
  assert.equal(
    tryMateBoardMove({
      disabled: true,
      fen: ROOK_START,
      onMove,
      sourceSquare: 'a2',
      targetSquare: 'a8',
    }),
    false,
  )
  assert.equal(
    tryMateBoardMove({
      disabled: false,
      fen: 'not a fen',
      onMove,
      sourceSquare: 'a2',
      targetSquare: 'a8',
    }),
    false,
  )
  assert.equal(
    tryMateBoardMove({
      disabled: false,
      fen: ROOK_START.replace(' w ', ' b '),
      onMove,
      sourceSquare: 'h8',
      targetSquare: 'h7',
    }),
    false,
  )
  assert.deepEqual(moves, [])
})

test('Mate controls expose preserved actions and their disabled states', () => {
  const markup = renderToStaticMarkup(
    <MateControls
      canPlayBest
      canRedo={true}
      canUndo={false}
      elapsedMs={83_459}
      onPlayBest={() => undefined}
      onRedo={() => undefined}
      onShare={() => undefined}
      onStartOver={() => undefined}
      onToggleTimer={() => undefined}
      onUndo={() => undefined}
      outcome="checkmate"
      shareStatus="Copied"
      showTimer
    />,
  )

  assert.doesNotMatch(buttonMarkup(markup, 'Start Over'), /disabled/)
  assert.match(buttonMarkup(markup, 'Undo'), /disabled/)
  assert.doesNotMatch(buttonMarkup(markup, 'Redo'), /disabled/)
  assert.match(buttonMarkup(markup, 'Play Best'), /disabled/)
  assert.match(buttonMarkup(markup, 'Hide timer'), /aria-pressed="true"/)
  assert.doesNotMatch(buttonMarkup(markup, 'Share'), /disabled/)
  assert.match(markup, /aria-label="Elapsed time"[^>]*>01:23\.45</)
  assert.match(markup, /role="status"[^>]*>Checkmate</)
  assert.match(markup, /aria-live="polite"[^>]*>Copied</)
})

test('active controls hide timer and withhold terminal-only sharing', () => {
  const markup = renderToStaticMarkup(
    <MateControls
      canPlayBest
      canRedo={false}
      canUndo
      elapsedMs={0}
      onPlayBest={() => undefined}
      onRedo={() => undefined}
      onShare={() => undefined}
      onStartOver={() => undefined}
      onToggleTimer={() => undefined}
      onUndo={() => undefined}
      showTimer={false}
    />,
  )

  assert.doesNotMatch(buttonMarkup(markup, 'Play Best'), /disabled/)
  assert.match(buttonMarkup(markup, 'Redo'), /disabled/)
  assert.doesNotMatch(buttonMarkup(markup, 'Show timer'), /disabled/)
  assert.doesNotMatch(markup, /aria-label="Elapsed time"/)
  assert.doesNotMatch(markup, />Share</)
  assert.doesNotMatch(
    markup,
    /reset count|next position|result card|streak|accuracy/i,
  )
})
