import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ChessboardOptions } from 'react-chessboard'
import TestRenderer, {
  act,
  type ReactTestRenderer,
} from 'react-test-renderer'
import MateBoard, { MateBoardSurface } from './MateBoard'
import {
  MATE_REPLY_ANIMATION_MS,
  getMateBoardSquareStyles,
  tryMateBoardMove,
} from './boardInteraction'
import MateControls from './MateControls'

const ROOK_START = '7k/8/8/8/8/8/R7/K7 w - - 0 1'
const ROOK_AFTER_WHITE = 'R6k/8/8/8/8/8/8/K7 b - - 1 1'
const ROOK_AFTER_REPLY = 'R7/6k1/8/8/8/8/8/K7 w - - 2 2'
const EXTERNAL_START = '6k1/8/8/8/8/3K4/8/R7 w - - 0 1'

type BoardFrame = {
  readonly animationDurationInMs: number | undefined
  readonly position: string
  readonly showAnimations: boolean | undefined
}

type BoardRendererProps = {
  readonly options?: ChessboardOptions
}

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
  assert.match(
    markup,
    /role="button"[^>]*tabindex="0"[^>]*><div id="leg-mate-board-piece-wR-a2"[\s\S]*?White rook on a2/,
  )
  assert.match(
    markup,
    /role="button"[^>]*tabindex="0"[^>]*><div id="leg-mate-board-piece-bK-h8"[\s\S]*?Black king on h8/,
  )
  assert.equal((markup.match(/<svg\b/g) ?? []).length, 4)
})

test('accessible piece names follow their controlled squares', () => {
  const markup = renderToStaticMarkup(
    <MateBoard
      disabled={false}
      fen={ROOK_AFTER_REPLY}
      lastMove={['h8', 'g7']}
      onMove={() => undefined}
      phase="2/2"
    />,
  )

  assert.match(markup, /White rook on a8/)
  assert.match(markup, /Black king on g7/)
  assert.doesNotMatch(markup, /White rook on a2|Black king on h8/)
  assert.equal((markup.match(/<svg\b/g) ?? []).length, 4)
})

test('click and drag render White optimistically, then animate only the reply', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true

  for (const interaction of ['click', 'drag'] as const) {
    const frames: BoardFrame[] = []
    const instanceFrames: { readonly id: number; readonly position: string }[] = []
    let nextInstanceId = 0
    let replaceFen: React.Dispatch<React.SetStateAction<string>> | undefined
    function BoardProbe({ options }: BoardRendererProps) {
      const instanceId = React.useRef(0)
      if (instanceId.current === 0) {
        nextInstanceId += 1
        instanceId.current = nextInstanceId
      }
      instanceFrames.push({
        id: instanceId.current,
        position: String(options?.position),
      })
      frames.push({
        animationDurationInMs: options?.animationDurationInMs,
        position: String(options?.position),
        showAnimations: options?.showAnimations,
      })
      return <div data-position={String(options?.position)} />
    }
    function Harness() {
      const [fen, setFen] = React.useState(ROOK_START)
      replaceFen = setFen
      return (
        <MateBoardSurface
          boardRenderer={BoardProbe}
          disabled={false}
          fen={fen}
          lastMove={null}
          onMove={(san) => {
            assert.equal(san, 'Ra8+')
            setFen(ROOK_AFTER_REPLY)
          }}
          phase="1/2"
        />
      )
    }

    let renderer!: ReactTestRenderer
    await act(async () => {
      renderer = TestRenderer.create(<Harness />)
    })

    if (interaction === 'click') {
      await act(async () => {
        currentOptions(renderer).onSquareClick?.({
          piece: { pieceType: 'wR' },
          square: 'a2',
        })
      })
      await act(async () => {
        currentOptions(renderer).onSquareClick?.({
          piece: null,
          square: 'a8',
        })
      })
    } else {
      await act(async () => {
        assert.equal(
          currentOptions(renderer).onPieceDrop?.({
            piece: {
              isSparePiece: false,
              pieceType: 'wR',
              position: 'a2',
            },
            sourceSquare: 'a2',
            targetSquare: 'a8',
          }),
          true,
        )
      })
    }

    const positionFrames = frames.filter(
      (frame, index) =>
        index === 0 ||
        frame.position !== frames[index - 1]?.position ||
        frame.showAnimations !== frames[index - 1]?.showAnimations,
    )
    assert.deepEqual(
      positionFrames.slice(-3),
      [
        {
          animationDurationInMs: MATE_REPLY_ANIMATION_MS,
          position: ROOK_START,
          showAnimations: true,
        },
        {
          animationDurationInMs: 0,
          position: ROOK_AFTER_WHITE,
          showAnimations: false,
        },
        {
          animationDurationInMs: MATE_REPLY_ANIMATION_MS,
          position: ROOK_AFTER_REPLY,
          showAnimations: true,
        },
      ],
      interaction,
    )
    const initialInstance = instanceFrames.find(
      (frame) => frame.position === ROOK_START,
    )?.id
    const optimisticInstance = instanceFrames.find(
      (frame) => frame.position === ROOK_AFTER_WHITE,
    )?.id
    const finalInstance = instanceFrames.find(
      (frame) => frame.position === ROOK_AFTER_REPLY,
    )?.id
    assert.notEqual(optimisticInstance, initialInstance, interaction)
    assert.equal(finalInstance, optimisticInstance, interaction)

    await act(async () => replaceFen?.(EXTERNAL_START))
    assert.deepEqual(frames.at(-1), {
      animationDurationInMs: MATE_REPLY_ANIMATION_MS,
      position: EXTERNAL_START,
      showAnimations: true,
    })

    await act(async () => renderer.unmount())
  }
})

test('pending board state rolls back or unmounts safely when the parent declines', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true

  for (const parentAction of ['no-op', 'disable', 'unmount'] as const) {
    const frames: BoardFrame[] = []
    let moveCalls = 0
    let latestOptions: ChessboardOptions = {}
    function BoardProbe({ options }: BoardRendererProps) {
      latestOptions = options ?? {}
      frames.push({
        animationDurationInMs: options?.animationDurationInMs,
        position: String(options?.position),
        showAnimations: options?.showAnimations,
      })
      return <div data-position={String(options?.position)} />
    }
    function Harness() {
      const [disabled, setDisabled] = React.useState(false)
      const [mounted, setMounted] = React.useState(true)
      if (!mounted) return null
      return (
        <MateBoardSurface
          boardRenderer={BoardProbe}
          disabled={disabled}
          fen={ROOK_START}
          lastMove={null}
          onMove={() => {
            moveCalls += 1
            if (parentAction === 'disable') setDisabled(true)
            if (parentAction === 'unmount') setMounted(false)
          }}
          phase="1/2"
        />
      )
    }

    let renderer!: ReactTestRenderer
    await act(async () => {
      renderer = TestRenderer.create(<Harness />)
    })
    await act(async () => {
      assert.equal(
        currentOptions(renderer).onPieceDrop?.({
          piece: {
            isSparePiece: false,
            pieceType: 'wR',
            position: 'a2',
          },
          sourceSquare: 'a2',
          targetSquare: 'a8',
        }),
        true,
      )
    })

    assert.equal(moveCalls, 1, parentAction)
    assert.ok(
      frames.some(
        (frame) =>
          frame.position === ROOK_AFTER_WHITE &&
          frame.showAnimations === false,
      ),
      `${parentAction} never rendered the optimistic move`,
    )
    if (parentAction === 'unmount') {
      assert.equal(
        renderer.root.findAll(
          (node) => node.props['data-position'] !== undefined,
        ).length,
        0,
      )
    } else {
      assert.equal(frames.at(-1)?.position, ROOK_START)
      assert.equal(frames.at(-1)?.showAnimations, true)
      if (parentAction === 'disable') {
        assert.equal(latestOptions.allowDragging, false)
      }
    }

    await act(async () => renderer.unmount())
  }
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
  const timerToggle = buttonMarkup(markup, 'Show timer')
  assert.doesNotMatch(timerToggle, /disabled/)
  const timerTarget = timerToggle.match(/aria-controls="([^"]+)"/)?.[1]
  assert.ok(timerTarget)
  assert.ok(markup.includes(`id="${timerTarget}"`))
  assert.match(markup, /aria-label="Elapsed time"[^>]*hidden/)
  assert.doesNotMatch(markup, />Share</)
  assert.match(
    markup,
    /aria-label="Share status"[^>]*role="status"[^>]*><\/span>/,
  )
  assert.doesNotMatch(
    markup,
    /reset count|next position|result card|streak|accuracy/i,
  )
})

function currentOptions(renderer: ReactTestRenderer): ChessboardOptions {
  const probe = renderer.root.find(
    (node) =>
      typeof node.type === 'function' &&
      (node.props as BoardRendererProps).options?.id === 'leg-mate-board',
  )
  return (probe.props as BoardRendererProps).options ?? {}
}
