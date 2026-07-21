import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
import MateLog, {
  MatePriorityGuideDialog,
} from './MateLog'
import MateSidebar from './MateSidebar'
import { MATE_SHARE_NOTIFICATION_MS } from './MateWorkspace'
import Mate from './index'
import {
  getMateRuleSet,
  knightAndBishopWhiteRules,
} from './rules'
import type { MateLogEntry, MateTerminalOutcome } from './session'
import { encodeMateFen } from './share'
import { MATE_TIMER_PREFERENCE_KEY } from './timerPreference'
import { liveMateHref } from './workspaceSupport'

const ROOK_START = '7k/8/8/8/8/8/R7/K7 w - - 0 1'
const ROOK_AFTER_WHITE = 'R6k/8/8/8/8/8/8/K7 b - - 1 1'
const ROOK_AFTER_REPLY = 'R7/6k1/8/8/8/8/8/K7 w - - 2 2'
const EXTERNAL_START = '6k1/8/8/8/8/3K4/8/R7 w - - 0 1'
const MULTI_WHITE_START = '7R/2K3k1/8/8/8/8/8/8 w - - 0 1'
const MULTI_BLACK_START = '8/8/8/8/2k5/8/2K5/2R5 w - - 0 1'
const ROOK_MATE_START = '7k/8/6K1/8/8/8/8/R7 w - - 0 1'
const QUEEN_START = '8/8/8/8/4k3/8/8/3QK3 w - - 0 1'

const MATE_TRAINING_INFO_PROPS = {
  mateMode: 'standard' as const,
}

const ROOK_LOGS: readonly MateLogEntry[] = [
  {
    fen: ROOK_START,
    san: 'Rg2',
    opponentSan: 'Kg7',
    phase: '1/2',
    isCorrect: true,
    correctChoices: 2,
    idealOpponentChoices: 2,
    legalOpponentChoices: 3,
    durationMs: 1_234,
    reasonId: 'king closer',
  },
  {
    fen: EXTERNAL_START,
    san: 'Ra2',
    opponentSan: 'Kf7',
    phase: '1/2',
    isCorrect: false,
    correctChoices: 1,
    idealOpponentChoices: 1,
    legalOpponentChoices: 4,
    durationMs: 61_007,
    reasonId: 'establish box',
  },
  {
    fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
    san: 'Ra8#',
    phase: '2/2',
    isCorrect: true,
    correctChoices: 1,
    durationMs: 500,
    reasonId: 'mate',
  },
]

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

test('Mate board replaces its terminal phase badge without changing phase data', () => {
  const markup = renderToStaticMarkup(
    <MateBoard
      complete
      disabled
      fen={ROOK_AFTER_WHITE}
      lastMove={['a2', 'a8']}
      onMove={() => undefined}
      phase="2/2"
    />,
  )

  assert.match(markup, /class="leg-mate-board-phase"[^>]*>Complete</)
  assert.doesNotMatch(markup, />Phase 2\/2</)
  assert.match(markup, /data-phase="2\/2"/)
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
      finishedAtMs={84_459}
      onPlayBest={() => undefined}
      onRedo={() => undefined}
      onShare={() => undefined}
      onStartOver={() => undefined}
      onToggleTimer={() => undefined}
      onUndo={() => undefined}
      outcome="checkmate"
      shareStatus="Copied"
      showTimer
      startedAtMs={1_000}
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
  assert.match(
    markup,
    /class="leg-mate-controls-actions"[\s\S]*class="leg-mate-controls-summary"/,
  )
  const summaryOrder = [
    markup.indexOf('>Checkmate</span>'),
    markup.indexOf('>Share</button>'),
    markup.indexOf('>Hide timer</button>'),
    markup.indexOf('aria-label="Elapsed time"'),
  ]
  assert.ok(summaryOrder.every((index) => index >= 0))
  assert.deepEqual(summaryOrder, [...summaryOrder].sort((left, right) => left - right))
  const summaryEnd = markup.indexOf(
    '</div>',
    markup.indexOf('class="leg-mate-controls-summary"'),
  )
  assert.ok(markup.indexOf('aria-label="Share status"') > summaryEnd)
})

test('active controls hide timer and withhold terminal-only sharing', () => {
  const markup = renderToStaticMarkup(
    <MateControls
      canPlayBest
      canRedo={false}
      canUndo
      onPlayBest={() => undefined}
      onRedo={() => undefined}
      onShare={() => undefined}
      onStartOver={() => undefined}
      onToggleTimer={() => undefined}
      onUndo={() => undefined}
      showTimer={false}
      startedAtMs={0}
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

test('Mate controls use concise terminal outcome labels', () => {
  const outcomes: ReadonlyArray<readonly [MateTerminalOutcome, string]> = [
    ['checkmate', 'Checkmate'],
    ['stalemate', 'Stalemate'],
    ['lost-material', 'Defeated'],
    ['lost-knight', 'Defeated'],
    ['pawn-promoted', 'Defeated'],
    ['fifty-move', 'Draw'],
    ['unsupported', 'Defeated'],
  ]

  for (const [outcome, label] of outcomes) {
    const markup = renderToStaticMarkup(
      <MateControls
        canPlayBest={false}
        canRedo={false}
        canUndo={false}
        onPlayBest={() => undefined}
        onRedo={() => undefined}
        onShare={() => undefined}
        onStartOver={() => undefined}
        onToggleTimer={() => undefined}
        onUndo={() => undefined}
        outcome={outcome}
        showTimer={false}
        startedAtMs={0}
      />,
    )

    assert.match(markup, new RegExp(`role="status"[^>]*>${label}<`))
  }
})

test('Mate log exposes every training field and semantic cycle controls', () => {
  const idealWhiteIndexes: number[] = []
  const idealBlackIndexes: number[] = []
  const legalBlackIndexes: number[] = []
  const markup = renderToStaticMarkup(
    <MateLog
      {...MATE_TRAINING_INFO_PROPS}
      fen={ROOK_START}
      logs={ROOK_LOGS}
      onCycleIdealBlack={(index) => idealBlackIndexes.push(index)}
      onCycleIdealWhite={(index) => idealWhiteIndexes.push(index)}
      onCycleLegalBlack={(index) => legalBlackIndexes.push(index)}
      ruleSet={getMateRuleSet('rook')}
    />,
  )

  let headerCursor = -1
  for (const header of [
    '#',
    'Phase',
    'White',
    'Black',
    'Correctness',
    'Black replies',
    'Duration',
    'Reason',
  ]) {
    const next = markup.indexOf(`>${header}`, headerCursor + 1)
    assert.ok(next > headerCursor, `Header out of order: ${header}`)
    headerCursor = next
  }
  assert.match(markup, />Rg2</)
  assert.match(markup, />Kg7</)
  assert.equal((markup.match(/<th scope="col"/g) ?? []).length, 8)
  assert.equal(
    (markup.match(/<col class="leg-mate-log-number-column"/g) ?? []).length,
    1,
  )
  assert.equal(
    (markup.match(/<col class="leg-mate-log-intrinsic-column"/g) ?? [])
      .length,
    6,
  )
  assert.equal(
    (markup.match(/<col class="leg-mate-log-flexible-column"/g) ?? [])
      .length,
    1,
  )
  assert.match(
    markup,
    /<col class="leg-mate-log-number-column"\/>(?:<col class="leg-mate-log-intrinsic-column"\/>){6}<col class="leg-mate-log-flexible-column"\/>/,
  )
  assert.doesNotMatch(
    markup,
    />White move<|>Black move<|>Ideal Black replies<|>Legal Black replies</,
  )
  assert.match(
    markup,
    /class="leg-mate-log-replies"[\s\S]*?>2<\/button><span aria-hidden="true">\/<\/span>[\s\S]*?>3<\/button><\/td>/,
  )
  assert.ok(
    markup.indexOf('class="leg-mate-log-correctness"') <
      markup.indexOf('class="leg-mate-log-replies"'),
    'Correctness cell should precede Black replies',
  )
  assert.match(
    markup,
    /aria-label="Correct"[^>]*role="img"[^>]*>👍<\/span><button[^>]*aria-label="Cycle ideal White move for move 1; 2 correct choices"[^>]*>\/2<\/button>/,
  )
  assert.match(
    markup,
    /aria-label="Incorrect"[^>]*role="img"[^>]*>👎<\/span><button[^>]*aria-label="Cycle ideal White move for move 2; 1 correct choice"[^>]*>\/1<\/button>/,
  )
  assert.doesNotMatch(markup, />Correct<|>Incorrect<|>\d+ correct choices?<\/button>/)
  assert.match(markup, />0:01\.234</)
  assert.match(markup, />1:01\.007</)
  assert.match(markup, />king closer</)
  assert.match(markup, />establish box</)
  assert.match(
    markup,
    /aria-label="Cycle ideal White move for move 1; 2 correct choices"/,
  )
  assert.match(
    markup,
    /aria-label="Cycle ideal Black reply for move 1; 2 ideal replies"/,
  )
  assert.match(
    markup,
    /aria-label="Cycle any legal Black reply for move 1; 3 legal replies"/,
  )
  assert.match(
    markup,
    /aria-label="Cycle ideal White move for move 2; 1 correct choice"(?![^>]*disabled)/,
  )
  assert.match(
    markup,
    /aria-label="Cycle ideal Black reply for move 2; 1 ideal reply"(?![^>]*disabled)/,
  )
  assert.match(
    markup,
    /aria-label="Cycle ideal White move for move 3; 1 correct choice"[^>]*disabled/,
  )
  assert.match(
    markup,
    /aria-label="Cycle ideal Black reply for move 3; 0 ideal replies"[^>]*disabled/,
  )
  assert.equal(idealWhiteIndexes.length, 0)
  assert.equal(idealBlackIndexes.length, 0)
  assert.equal(legalBlackIndexes.length, 0)
  assert.doesNotMatch(
    markup,
    /reset count|next position|result card|streak|accuracy/i,
  )
})

test('Mate log cycle controls report their historical log index', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const calls: string[] = []
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <MateLog
        {...MATE_TRAINING_INFO_PROPS}
        fen={ROOK_START}
        logs={ROOK_LOGS}
        onCycleIdealBlack={(index) => calls.push(`ideal-black-${index}`)}
        onCycleIdealWhite={(index) => calls.push(`ideal-white-${index}`)}
        onCycleLegalBlack={(index) => calls.push(`legal-black-${index}`)}
        ruleSet={getMateRuleSet('rook')}
      />,
    )
  })

  await act(async () => {
    renderer.root
      .findByProps({
        'aria-label': 'Cycle ideal White move for move 1; 2 correct choices',
      })
      .props.onClick()
    renderer.root
      .findByProps({
        'aria-label': 'Cycle ideal Black reply for move 1; 2 ideal replies',
      })
      .props.onClick()
    renderer.root
      .findByProps({
        'aria-label': 'Cycle any legal Black reply for move 2; 4 legal replies',
      })
      .props.onClick()
  })
  assert.deepEqual(calls, ['ideal-white-0', 'ideal-black-0', 'legal-black-1'])

  await act(async () => renderer.unmount())
})

test('cycling a log entry preserves its row, control instance, and focus', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  function Harness() {
    const [logs, setLogs] = React.useState(ROOK_LOGS)
    return (
      <MateLog
        {...MATE_TRAINING_INFO_PROPS}
        fen={ROOK_START}
        logs={logs}
        onCycleIdealBlack={() => undefined}
        onCycleIdealWhite={(logIndex) =>
          setLogs((current) =>
            current.map((log, index) =>
              index === logIndex
                ? { ...log, san: 'Rh2', opponentSan: 'Kh7' }
                : log,
            ),
          )
        }
        onCycleLegalBlack={() => undefined}
        ruleSet={getMateRuleSet('rook')}
      />
    )
  }

  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(<Harness />)
  })
  const label = 'Cycle ideal White move for move 1; 2 correct choices'
  const focusedButton = renderer.root.findByProps({ 'aria-label': label })
  const focusedRow = focusedButton.parent?.parent?.parent
  assert.equal(focusedRow?.type, 'tr')
  // A browser keeps focus when React reuses the same host button. Model that
  // active element here and prove both the button and keyed row are retained.
  const focusState = { activeElement: focusedButton }

  await act(async () => focusedButton.props.onClick())

  const updatedButton = renderer.root.findByProps({ 'aria-label': label })
  const updatedRow = updatedButton.parent?.parent?.parent
  assert.equal(updatedRow?.type, 'tr')
  assert.ok(
    updatedButton === focusedButton,
    'the focused cycle button remounted after its SAN changed',
  )
  assert.ok(
    updatedRow === focusedRow,
    'the historical row remounted after its SAN changed',
  )
  assert.ok(
    focusState.activeElement === updatedButton,
    'the retained button should remain the active focus target',
  )
  assert.equal(reactNodeText(updatedRow).includes('Rh2'), true)
  assert.equal(reactNodeText(updatedRow).includes('Kh7'), true)

  await act(async () => renderer.unmount())
})

test('reason hint is opt-in and reveals only the current rule label', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const ruleSet = getMateRuleSet('rook')
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <MateLog
        {...MATE_TRAINING_INFO_PROPS}
        fen={ROOK_START}
        logs={[]}
        onCycleIdealBlack={() => undefined}
        onCycleIdealWhite={() => undefined}
        onCycleLegalBlack={() => undefined}
        ruleSet={ruleSet}
      />,
    )
  })

  assert.equal(
    renderer.root.findAll(
      (node) => node.props['data-mate-current-hint'] === true,
    ).length,
    0,
  )
  const toggle = renderer.root.findByProps({
    'aria-label': 'Show reason hints',
  })
  assert.equal(toggle.props.checked, false)

  await act(async () => {
    toggle.props.onChange({ currentTarget: { checked: true } })
  })

  const hint = renderer.root.findByProps({
    'data-mate-current-hint': true,
  })
  const hintText = reactNodeText(hint)
  assert.equal(hintText, 'rook farther')
  assert.doesNotMatch(hintText, /Rg2|a2|g2|bring White's king/i)
  assert.equal(hint.props.type, 'button')

  await act(async () => renderer.unmount())
})

test('clicking a reason highlights its guide priority until a generic reopen', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <MateLog
        {...MATE_TRAINING_INFO_PROPS}
        fen={ROOK_START}
        logs={ROOK_LOGS}
        onCycleIdealBlack={() => undefined}
        onCycleIdealWhite={() => undefined}
        onCycleLegalBlack={() => undefined}
        ruleSet={getMateRuleSet('rook')}
      />,
    )
  })

  await act(async () => {
    renderer.root
      .findByProps({
        'aria-label': 'establish box. Open priority guide',
      })
      .props.onClick({ currentTarget: null })
  })
  const highlighted = renderer.root.findAllByProps({
    'aria-current': 'true',
  })
  assert.equal(highlighted.length, 1)
  assert.match(reactNodeText(highlighted[0]), /^establish box/)

  await act(async () => {
    renderer.root
      .findByProps({ 'aria-label': 'Close priority guide' })
      .props.onClick()
    renderer.root
      .findByProps({
        'aria-label': 'Open training info and priority guide',
      })
      .props.onClick({ currentTarget: null })
  })
  assert.equal(
    renderer.root.findAllByProps({ 'aria-current': 'true' }).length,
    0,
  )

  await act(async () => renderer.unmount())
})

test('pointer-opened guides release the opener while keyboard-opened guides restore it', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <MateLog
        {...MATE_TRAINING_INFO_PROPS}
        fen={ROOK_START}
        logs={[]}
        onCycleIdealBlack={() => undefined}
        onCycleIdealWhite={() => undefined}
        onCycleLegalBlack={() => undefined}
        ruleSet={getMateRuleSet('rook')}
      />,
    )
  })
  const opener = { focus: () => undefined }
  const openButton = renderer.root.findByProps({
    'aria-label': 'Open training info and priority guide',
  })

  await act(async () => {
    openButton.props.onClick({ currentTarget: opener, detail: 1 })
  })
  assert.equal(
    renderer.root.findByType(MatePriorityGuideDialog).props.returnFocusTo,
    null,
  )
  await act(async () => {
    renderer.root.findByType(MatePriorityGuideDialog).props.onClose()
  })

  await act(async () => {
    openButton.props.onClick({ currentTarget: opener, detail: 0 })
  })
  assert.equal(
    renderer.root.findByType(MatePriorityGuideDialog).props.returnFocusTo,
    opener,
  )

  await act(async () => renderer.unmount())
})

test('current hint scoring is lazy and memoized by its exact inputs', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const baseRuleSet = getMateRuleSet('rook')
  let hintCalls = 0
  let whiteMovePreflightCalls = 0
  const makeRuleSetSpy = () => ({
    ...baseRuleSet,
    whiteMoves: (fen: string) => {
      whiteMovePreflightCalls += 1
      return baseRuleSet.whiteMoves(fen)
    },
    currentWhiteHint: (fen: string) => {
      hintCalls += 1
      return baseRuleSet.currentWhiteHint(fen)
    },
  })
  const firstRuleSet = makeRuleSetSpy()
  const secondRuleSet = makeRuleSetSpy()
  let bumpUnrelated!: () => void
  let replaceFen!: (fen: string) => void
  let replaceRuleSet!: (ruleSet: typeof firstRuleSet) => void

  function Harness() {
    const [fen, setFen] = React.useState(ROOK_START)
    const [ruleSet, setRuleSet] = React.useState(firstRuleSet)
    const [unrelatedTick, setUnrelatedTick] = React.useState(0)
    bumpUnrelated = () => setUnrelatedTick((tick) => tick + 1)
    replaceFen = setFen
    replaceRuleSet = setRuleSet
    return (
      <>
        <MateLog
          {...MATE_TRAINING_INFO_PROPS}
          fen={fen}
          logs={[]}
          onCycleIdealBlack={() => undefined}
          onCycleIdealWhite={() => undefined}
          onCycleLegalBlack={() => undefined}
          ruleSet={ruleSet}
        />
        <output data-unrelated-tick={unrelatedTick}>{unrelatedTick}</output>
      </>
    )
  }

  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(<Harness />)
  })
  assert.equal(hintCalls, 0)
  assert.equal(whiteMovePreflightCalls, 0)

  await act(async () => bumpUnrelated())
  assert.equal(hintCalls, 0)

  await act(async () => {
    renderer.root
      .findByProps({ 'aria-label': 'Show reason hints' })
      .props.onChange({ currentTarget: { checked: true } })
  })
  assert.equal(hintCalls, 1)

  await act(async () => bumpUnrelated())
  assert.equal(hintCalls, 1)

  await act(async () => replaceFen(EXTERNAL_START))
  assert.equal(hintCalls, 2)

  await act(async () => replaceRuleSet(secondRuleSet))
  assert.equal(hintCalls, 3)

  await act(async () => {
    renderer.root
      .findByProps({ 'aria-label': 'Show reason hints' })
      .props.onChange({ currentTarget: { checked: false } })
  })
  assert.equal(hintCalls, 3)
  await act(async () => replaceFen(ROOK_START))
  assert.equal(hintCalls, 3)
  await act(async () => bumpUnrelated())
  assert.equal(hintCalls, 3)

  await act(async () => {
    renderer.root
      .findByProps({ 'aria-label': 'Show reason hints' })
      .props.onChange({ currentTarget: { checked: true } })
  })
  assert.equal(hintCalls, 4)
  assert.equal(whiteMovePreflightCalls, 0)

  await act(async () => renderer.unmount())
})

test('priority guide follows registered facade order and renders typed diagrams', () => {
  const ruleSet = getMateRuleSet('bishop-knight')
  const evaluatorWhiteIds = knightAndBishopWhiteRules
    .map(({ id }) => id)
    .filter((id, index, ids) => ids.indexOf(id) === index)
  const expectedWhiteIds = [
    evaluatorWhiteIds[0],
    evaluatorWhiteIds[2],
    evaluatorWhiteIds[1],
    ...evaluatorWhiteIds.slice(3),
  ]
  assert.deepEqual(
    ruleSet.whiteRuleDescriptions.map(({ id }) => id),
    expectedWhiteIds,
  )
  const markup = renderToStaticMarkup(
    <MatePriorityGuideDialog
      {...MATE_TRAINING_INFO_PROPS}
      onClose={() => undefined}
      ruleSet={ruleSet}
    />,
  )
  const decodedMarkup = markup
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')

  assert.match(markup, /role="dialog"/)
  assert.match(markup, /aria-modal="true"/)
  assert.match(markup, />Bishop and Knight: checkmate</)
  assert.doesNotMatch(markup, />How best moves are chosen</)
  assert.match(markup, /class="leg-mate-guide-priorities"/)
  assert.doesNotMatch(markup, />Universal priorities</)
  assert.doesNotMatch(markup, /first three priorities stay consistent/)
  assert.doesNotMatch(markup, />Technique priorities</)
  assert.doesNotMatch(markup, />How training works</)
  assert.doesNotMatch(markup, /Current mode:/)
  assert.doesNotMatch(markup, /new legal starting position/)
  assert.doesNotMatch(markup, /curated position/)
  assert.doesNotMatch(markup, /Move White; Black replies automatically/)
  assert.doesNotMatch(markup, /Play Best makes one recommended White move/)
  assert.doesNotMatch(markup, /Reason hints and this priority guide explain/)
  assert.match(markup, />Keyboard shortcuts</)
  assert.match(markup, /<kbd>Enter<\/kbd>[\s\S]*Start over/)
  assert.match(markup, /<kbd>←<\/kbd>[\s\S]*Undo/)
  assert.match(markup, /<kbd>↑<\/kbd>[\s\S]*Play best move/)
  assert.match(markup, /<kbd>→<\/kbd>[\s\S]*Redo/)
  let shortcutCursor = -1
  for (const key of ['Enter', '←', '↑', '→']) {
    const next = markup.indexOf(`<kbd>${key}</kbd>`, shortcutCursor + 1)
    assert.ok(next > shortcutCursor, `Shortcut out of order: ${key}`)
    shortcutCursor = next
  }
  assert.doesNotMatch(markup, />Starting position</)
  assert.doesNotMatch(markup, />Copy game URL</)
  assert.doesNotMatch(markup, /aria-label="Game URL copy status"/)
  assert.match(markup, />White best moves</)
  assert.match(markup, />Black resistance</)
  assert.match(markup, />Notes</)
  const correctnessNote =
    'Correctness: 👍 means White chose a best move; 👎 means White did not. /N is the number of best White moves.'
  const blackRepliesNote =
    'Black replies: X / Y means X best-resistance replies out of Y legal replies.'
  const correctnessNoteAt = decodedMarkup.indexOf(correctnessNote)
  const blackRepliesNoteAt = decodedMarkup.indexOf(blackRepliesNote)
  assert.ok(correctnessNoteAt >= 0)
  assert.ok(blackRepliesNoteAt > correctnessNoteAt)
  assert.doesNotMatch(markup, /class="leg-mate-guide-supporting"/)
  const sectionOrder = [
    '>White best moves<',
    '>Black resistance<',
    '>Keyboard shortcuts<',
    '>Notes<',
  ]
  let sectionCursor = -1
  for (const heading of sectionOrder) {
    const next = markup.indexOf(heading, sectionCursor + 1)
    assert.ok(next > sectionCursor, `Guide section out of order: ${heading}`)
    sectionCursor = next
  }
  const prioritiesAt = markup.indexOf('leg-mate-guide-priorities')
  assert.ok(prioritiesAt < markup.indexOf('>Keyboard shortcuts<'))
  assert.ok(prioritiesAt < markup.indexOf('>Notes<'))

  let cursor = -1
  for (const id of expectedWhiteIds) {
    const rule = ruleSet.whiteRuleDescriptions.find(
      (description) => description.id === id,
    )
    assert.ok(rule)
    const next = decodedMarkup.indexOf(`>${rule.shortLabel}<`, cursor + 1)
    assert.ok(next > cursor, `White priority out of order: ${rule.shortLabel}`)
    cursor = next
  }
  cursor = -1
  for (const priority of ruleSet.help.blackPriorities) {
    const next = decodedMarkup.indexOf(priority, cursor + 1)
    assert.ok(next > cursor, `Black priority out of order: ${priority}`)
    cursor = next
  }
  for (const note of ruleSet.help.notes) {
    assert.ok(decodedMarkup.includes(note))
    assert.ok(decodedMarkup.indexOf(note) > blackRepliesNoteAt)
  }
  assert.match(markup, />Zone X</)
  assert.match(markup, />Key Square</)
  assert.match(markup, /aria-label="Zone X\. Black king on f8/)
  assert.match(markup, /aria-label="Key Square\. Black king on d8/)
  assert.match(markup, /data-highlight-kind="zone"/)
  assert.match(markup, /data-highlight-kind="key"/)
  assert.match(markup, /data-arrow="e5-f6"/)
  assert.doesNotMatch(markup, /<img\b|https?:\/\//)
})

test('every Mate rule set exposes the same concise universal priorities', () => {
  for (const mateId of [
    'queen',
    'rook',
    'two-bishops',
    'bishop-knight',
    'two-knights-pawn',
  ] as const) {
    assert.deepEqual(
      getMateRuleSet(mateId).whiteRuleDescriptions
        .slice(0, 3)
        .map(({ shortLabel, helpText }) => ({ shortLabel, helpText })),
      [
        { shortLabel: 'mate', helpText: '' },
        { shortLabel: 'pieces safe', helpText: '' },
        { shortLabel: 'no stalemate', helpText: '' },
      ],
      mateId,
    )
    for (const { shortLabel } of getMateRuleSet(mateId)
      .whiteRuleDescriptions) {
      assert.equal(shortLabel, shortLabel.toLowerCase(), mateId)
    }
  }
})

test('priority guide traps Tab, closes with Escape, and restores focus', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  type FakeNode = {
    readonly label: string
    readonly disabled: boolean
    readonly hidden: boolean
    readonly tabIndex: number
    focusCalls: number
    focus: () => void
    getAttribute: (name: string) => string | null
    hasAttribute: (name: string) => boolean
  }
  let keydown: ((event: KeyboardEvent) => void) | undefined
  const originalDocument = globalThis.document
  let fakeDocument!: {
    activeElement: FakeNode | null
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => void
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => void
  }
  const makeNode = (
    label: string,
    options: {
      readonly disabled?: boolean
      readonly hidden?: boolean
      readonly tabIndex?: number
    } = {},
  ): FakeNode => {
    const node: FakeNode = {
      label,
      disabled: options.disabled ?? false,
      hidden: options.hidden ?? false,
      tabIndex: options.tabIndex ?? 0,
      focusCalls: 0,
      focus() {
        node.focusCalls += 1
        fakeDocument.activeElement = node
      },
      getAttribute(name) {
        return name === 'aria-hidden' && node.hidden ? 'true' : null
      },
      hasAttribute(name) {
        return name === 'disabled' && node.disabled
      },
    }
    return node
  }
  const disabledNode = makeNode('Disabled action', { disabled: true })
  const hiddenNode = makeNode('Hidden action', { hidden: true })
  const closeNode = makeNode('Close priority guide')
  const lastNode = makeNode('Last guide action')
  const outsideNode = makeNode('Outside dialog')
  let queriedNodes: FakeNode[] = [
    disabledNode,
    hiddenNode,
    closeNode,
    lastNode,
  ]
  const dialogNode = {
    contains: (node: FakeNode | null) =>
      node !== null && queriedNodes.includes(node),
    querySelectorAll: () => queriedNodes,
  }
  fakeDocument = {
    activeElement: null,
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (type === 'keydown') {
        keydown = listener as (event: KeyboardEvent) => void
      }
    },
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (type === 'keydown' && keydown === listener) keydown = undefined
    },
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: fakeDocument,
  })

  const keyEvent = (key: string, shiftKey = false) => {
    const calls = { preventDefault: 0, stopPropagation: 0 }
    return {
      calls,
      event: {
        key,
        shiftKey,
        preventDefault: () => {
          calls.preventDefault += 1
        },
        stopPropagation: () => {
          calls.stopPropagation += 1
        },
      } as KeyboardEvent,
    }
  }

  let renderer: ReactTestRenderer | undefined
  try {
    await act(async () => {
      renderer = TestRenderer.create(
        <MateLog
          {...MATE_TRAINING_INFO_PROPS}
          fen={ROOK_START}
          logs={ROOK_LOGS}
          onCycleIdealBlack={() => undefined}
          onCycleIdealWhite={() => undefined}
          onCycleLegalBlack={() => undefined}
          ruleSet={getMateRuleSet('rook')}
        />,
        {
          createNodeMock: (element) => {
            const props = element.props as Record<string, unknown>
            if (props.role === 'dialog') return dialogNode
            if (props['aria-label'] === 'Close priority guide') {
              return closeNode
            }
            return makeNode(String(props['aria-label'] ?? 'Host node'))
          },
        },
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer

    const openButton = mountedRenderer.root.findByProps({
      'aria-label': 'Open training info and priority guide',
    })
    const openerNode = makeNode('Open training info and priority guide')
    await act(async () => {
      openButton.props.onClick({ currentTarget: openerNode })
    })
    assert.equal(
      mountedRenderer.root.findAllByProps({ role: 'dialog' }).length,
      1,
    )
    assert.equal(closeNode.focusCalls, 1)
    assert.equal(fakeDocument.activeElement, closeNode)
    assert.ok(keydown)

    fakeDocument.activeElement = lastNode
    const forwardWrap = keyEvent('Tab')
    await act(async () => keydown?.(forwardWrap.event))
    assert.equal(forwardWrap.calls.preventDefault, 1)
    assert.equal(fakeDocument.activeElement, closeNode)
    assert.equal(disabledNode.focusCalls, 0)
    assert.equal(hiddenNode.focusCalls, 0)

    fakeDocument.activeElement = closeNode
    const backwardWrap = keyEvent('Tab', true)
    await act(async () => keydown?.(backwardWrap.event))
    assert.equal(backwardWrap.calls.preventDefault, 1)
    assert.equal(fakeDocument.activeElement, lastNode)

    fakeDocument.activeElement = outsideNode
    const focusFromOutside = keyEvent('Tab')
    await act(async () => keydown?.(focusFromOutside.event))
    assert.equal(focusFromOutside.calls.preventDefault, 1)
    assert.equal(fakeDocument.activeElement, closeNode)

    queriedNodes = [disabledNode, hiddenNode]
    fakeDocument.activeElement = outsideNode
    const noFocusableNodes = keyEvent('Tab')
    await act(async () => keydown?.(noFocusableNodes.event))
    assert.equal(noFocusableNodes.calls.preventDefault, 1)
    assert.equal(fakeDocument.activeElement, closeNode)

    queriedNodes = [disabledNode, hiddenNode, closeNode, lastNode]
    const escape = keyEvent('Escape')
    await act(async () => {
      keydown?.(escape.event)
    })
    assert.equal(escape.calls.preventDefault, 1)
    assert.equal(escape.calls.stopPropagation, 1)
    assert.equal(
      mountedRenderer.root.findAllByProps({ role: 'dialog' }).length,
      0,
    )
    assert.equal(openerNode.focusCalls, 1)
    assert.equal(keydown, undefined)

    await act(async () => {
      mountedRenderer.root
        .findByProps({
          'aria-label': 'Open training info and priority guide',
        })
        .props.onClick({ currentTarget: openerNode })
    })
    assert.equal(
      mountedRenderer.root.findAllByProps({ role: 'dialog' }).length,
      1,
    )
    assert.ok(keydown)
    await act(async () => mountedRenderer.unmount())
    renderer = undefined
    assert.equal(openerNode.focusCalls, 2)
    assert.equal(keydown, undefined)
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document
    } else {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: originalDocument,
      })
    }
  }
})

function reactNodeText(node: TestRenderer.ReactTestInstance): string {
  return node.children
    .map((child) =>
      typeof child === 'string' ? child : reactNodeText(child),
    )
    .join('')
}

function currentOptions(renderer: ReactTestRenderer): ChessboardOptions {
  const probe = renderer.root.find(
    (node) =>
      typeof node.type === 'function' &&
      (node.props as BoardRendererProps).options?.id === 'leg-mate-board',
  )
  return (probe.props as BoardRendererProps).options ?? {}
}

test('Mate selector exposes material icons and horizontal mode links', () => {
  const markup = renderToStaticMarkup(
    <MateSidebar
      mateId="rook"
      mateMode="train"
      onNavigate={() => undefined}
    />,
  )

  for (const [label, href] of [
    ['Queen', '/mate/queen'],
    ['Rook', '/mate/rook'],
    ['Two Bishops', '/mate/two-bishops'],
    ['Bishop and Knight', '/mate/bishop-knight'],
    ['Two Knights vs Pawn', '/mate/two-knights-pawn'],
  ]) {
    assert.match(
      markup,
      new RegExp(
        `<a[^>]*aria-label="${label}"[^>]*href="${href}"[^>]*title="${label}"`,
      ),
      label,
    )
    assert.doesNotMatch(markup, new RegExp(`>${label}</a>`))
  }
  for (const [label, href] of [
    ['Standard', '/mate/rook'],
    ['Training Wheels', '/mate/rook/train'],
  ]) {
    assert.match(markup, new RegExp(`href="${href}"[^>]*>${label}</a>`))
  }
  assert.equal((markup.match(/<svg\b/g) ?? []).length, 9)
  assert.doesNotMatch(markup, /leg-mate-sidebar-label|<select\b/)
  assert.match(
    markup,
    /aria-current="location"[^>]*href="\/mate\/rook"/,
  )
  assert.match(
    markup,
    /aria-current="page"[^>]*href="\/mate\/rook\/train"/,
  )
  assert.doesNotMatch(markup, /\/standard/)
})

test('Mate selector keeps disabled mode labels on the landing path', () => {
  const markup = renderToStaticMarkup(
    <MateSidebar
      mateId={null}
      mateMode={null}
      onNavigate={() => undefined}
    />,
  )

  assert.match(markup, /aria-label="Mate mode"/)
  assert.match(
    markup,
    /<span aria-disabled="true" class="leg-mate-mode-link is-disabled">Standard<\/span>/,
  )
  assert.match(
    markup,
    /<span aria-disabled="true" class="leg-mate-mode-link is-disabled">Training Wheels<\/span>/,
  )
  assert.doesNotMatch(markup, /leg-mate-sidebar--sets-only/)
  assert.doesNotMatch(markup, /aria-current=/)
})

test('Mate sidebar intercepts only unmodified primary link clicks', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const navigations: string[] = []
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <MateSidebar
        mateId="rook"
        mateMode="standard"
        onNavigate={(href) => navigations.push(href)}
      />,
    )
  })
  const queenLink = renderer.root.findByProps({ href: '/mate/queen' })

  for (const overrides of [
    { button: 1 },
    { button: 2 },
    { button: 0, metaKey: true },
    { button: 0, ctrlKey: true },
    { button: 0, shiftKey: true },
    { button: 0, altKey: true },
    { button: 0, defaultPrevented: true },
  ]) {
    let prevented = 0
    const clickEvent = {
      altKey: false,
      button: 0,
      ctrlKey: false,
      defaultPrevented: false,
      metaKey: false,
      preventDefault: () => {
        prevented += 1
      },
      shiftKey: false,
    }
    Object.assign(clickEvent, overrides)
    await act(async () => {
      queenLink.props.onClick(clickEvent)
    })
    assert.equal(prevented, 0, JSON.stringify(overrides))
  }
  assert.deepEqual(navigations, [])

  let prevented = 0
  let pointerBlurs = 0
  await act(async () => {
    queenLink.props.onClick({
      altKey: false,
      button: 0,
      ctrlKey: false,
      currentTarget: {
        blur: () => {
          pointerBlurs += 1
        },
      },
      defaultPrevented: false,
      detail: 1,
      metaKey: false,
      preventDefault: () => {
        prevented += 1
      },
      shiftKey: false,
    })
  })
  assert.equal(prevented, 1)
  assert.equal(pointerBlurs, 1)
  assert.deepEqual(navigations, ['/mate/queen'])

  let keyboardBlurs = 0
  await act(async () => {
    queenLink.props.onClick({
      altKey: false,
      button: 0,
      ctrlKey: false,
      currentTarget: {
        blur: () => {
          keyboardBlurs += 1
        },
      },
      defaultPrevented: false,
      detail: 0,
      metaKey: false,
      preventDefault: () => undefined,
      shiftKey: false,
    })
  })
  assert.equal(keyboardBlurs, 0)
  assert.deepEqual(navigations, ['/mate/queen', '/mate/queen'])

  await act(async () => renderer.unmount())
})

test('Mate landing keeps the catalog visible without mounting a drill', () => {
  const markup = renderToStaticMarkup(
    <Mate
      moduleSelector={<nav aria-label="Modules" />}
      onNavigate={() => undefined}
      route={{
        module: 'mate',
        mateId: null,
        mateMode: null,
        sharedFen: null,
      }}
    />,
  )

  assert.match(markup, /Choose a mating set/)
  assert.match(markup, /href="\/mate\/queen"/)
  assert.match(markup, />Standard<\/span>/)
  assert.match(markup, />Training Wheels<\/span>/)
  assert.doesNotMatch(markup, /leg-mate-workspace/)
  assert.doesNotMatch(markup, /aria-label="Mate board, White orientation"/)
  assert.doesNotMatch(markup, /aria-current=/)
  assert.doesNotMatch(markup, /Coming soon/)
})

test('Mate composes a selected reducer-backed training workspace', () => {
  const markup = renderToStaticMarkup(
    <Mate
      moduleSelector={<nav aria-label="Modules" />}
      onNavigate={() => undefined}
      route={{
        module: 'mate',
        mateId: 'rook',
        mateMode: 'standard',
        sharedFen: ROOK_START,
      }}
    />,
  )

  assert.match(markup, /class="leg-mate-workspace"/)
  assert.match(markup, /aria-label="Mate board, White orientation"/)
  assert.match(markup, /aria-label="Mate controls"/)
  assert.match(markup, /aria-label="Mate move log"/)
  assert.match(
    markup,
    /aria-label="Open training info and priority guide"[^>]*>Training info<\/button>/,
  )
  assert.match(markup, /Show reason hints[\s\S]*Training info/)
  assert.doesNotMatch(markup, /How training works|Position details|Copy FEN/)
  assert.doesNotMatch(markup, /<details\b/)
  assert.doesNotMatch(markup, /Coming soon/)
})

test('Mate guide omits mode explanations and the evaluator subtitle', () => {
  const markup = renderToStaticMarkup(
    <MatePriorityGuideDialog
      {...MATE_TRAINING_INFO_PROPS}
      mateMode="train"
      onClose={() => undefined}
      ruleSet={getMateRuleSet('rook')}
    />,
  )

  assert.match(markup, />Rook: checkmate</)
  assert.doesNotMatch(markup, /How best moves are chosen/)
  assert.doesNotMatch(
    markup,
    /White's best moves are the moves that survive these priorities in order/,
  )
  assert.doesNotMatch(markup, /How training works/)
  assert.doesNotMatch(markup, /Current mode:/)
  assert.doesNotMatch(markup, /new legal starting position|curated position/)
})

test('Mate exposes stable desktop and narrow-layout structure', () => {
  const markup = renderToStaticMarkup(
    <Mate
      moduleSelector={<nav aria-label="Modules" />}
      onNavigate={() => undefined}
      route={{
        module: 'mate',
        mateId: 'rook',
        mateMode: 'standard',
        sharedFen: ROOK_START,
      }}
    />,
  )

  for (const className of [
    'leg-mate-page',
    'leg-mate-layout',
    'leg-mate-sidebar',
    'leg-mate-workspace',
    'leg-mate-board-card',
    'leg-mate-controls',
    'leg-mate-log-column',
    'leg-mate-log-scroll',
  ]) {
    assert.match(markup, new RegExp(`class="[^"]*${className}`), className)
  }
  assert.match(
    markup,
    /<nav aria-label="Modules"><\/nav><h1 class="leg-mate-visually-hidden">Mate<\/h1><aside aria-label="Mate training"/,
  )
  assert.match(
    markup,
    /<\/aside><div class="leg-mate-layout"><section[^>]*class="leg-mate-workspace"/,
  )
  assert.doesNotMatch(
    markup,
    /leg-reader-header|leg-mate-header|leg-mate-workspace-header/,
  )
  assert.match(
    markup,
    /class="leg-mate-board-column"><div class="leg-mate-board-card"/,
  )
  assert.doesNotMatch(
    markup,
    /leg-mate-information|leg-mate-training-guide|leg-mate-position-details/,
  )
  assert.match(
    markup,
    /class="leg-mate-log-column"><div aria-busy="false" aria-label="Mate controls"[\s\S]*?<section aria-label="Mate move log"/,
  )
  assert.doesNotMatch(markup, /leg-mate-sidebar-label|<select\b/)
  assert.match(
    markup,
    /aria-label="Mate move log table"[^>]*class="leg-mate-log-scroll"[^>]*role="region"[^>]*tabindex="0"/,
  )
  assert.match(markup, /<table[^>]*aria-label="Mate move log"/)

  const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /\.leg-mate-masthead|\.leg-mate-workspace-header/)
  assert.match(
    css,
    /\.leg-mate-workspace\s*\{[^}]*grid-template-columns:\s*minmax\(16rem, 25\.6rem\) minmax\(0, 1fr\)/s,
  )
  assert.match(
    css,
    /\.leg-mate-board-shell\s*\{[^}]*max-width:\s*25\.6rem/s,
  )
  assert.match(
    css,
    /\.leg-mate-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s,
  )
  assert.doesNotMatch(css, /\.leg-mate-sidebar\s*\{[^}]*position:\s*sticky/s)
  assert.match(
    css,
    /\.leg-mate-mode-links\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
  )
  assert.match(
    css,
    /\.leg-mate-controls\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap/s,
  )
  assert.match(
    css,
    /\.leg-mate-controls-summary\s*\{[^}]*margin-left:\s*auto;[^}]*justify-content:\s*flex-end/s,
  )
  assert.doesNotMatch(
    css,
    /\.leg-mate-controls-summary\s*\{[^}]*(?:border-top|padding-top)/s,
  )
  assert.match(
    css,
    /\.leg-mate-share-status\s*\{[^}]*position:\s*fixed;[^}]*right:\s*1rem;[^}]*bottom:\s*1rem/s,
  )
  assert.match(
    css,
    /\.leg-mate-share-status:empty\s*\{[^}]*display:\s*none/s,
  )
  assert.doesNotMatch(
    css,
    /\.leg-mate-guide-(?:supporting|fen|copy-row|copy-status)/,
  )
  assert.doesNotMatch(
    css,
    /\.leg-mate-information|\.leg-mate-training-guide|\.leg-mate-position-details/,
  )
  assert.match(css, /\.leg-mate-log-scroll\s*\{[^}]*overflow-x:\s*auto/s)
  assert.match(
    css,
    /\.leg-mate-log-table\s*\{[^}]*min-width:\s*44rem/s,
  )
  assert.match(
    css,
    /\.leg-mate-log-number-column\s*\{[^}]*width:\s*3rem/s,
  )
  assert.match(
    css,
    /\.leg-mate-log-intrinsic-column\s*\{[^}]*width:\s*1%/s,
  )
  assert.match(
    css,
    /\.leg-mate-log-flexible-column\s*\{[^}]*width:\s*auto/s,
  )
  assert.doesNotMatch(css, /\.leg-mate-log-table\s*\{[^}]*min-width:\s*(?:58|62)rem/s)
  assert.match(css, /@media\s*\(max-width:\s*48rem\)/)
  assert.match(
    css,
    /@media\s*\(max-width:\s*68rem\)[\s\S]*\.leg-mate-board-column\s*\{[^}]*width:\s*min\(25\.6rem, 80%\)[^}]*margin-inline:\s*auto/s,
  )
  assert.match(
    css,
    /@media\s*\(max-width:\s*48rem\)[\s\S]*\.leg-mate-sidebar\s*\{[^}]*grid-template-areas:[^}]*'sets'[^}]*'modes'/,
  )
  assert.match(
    css,
    /\.leg-mate-guide-priorities\s*\{[^}]*align-items:\s*start[^}]*grid-template-columns:\s*minmax\(0, 3fr\) minmax\(0, 2fr\)/s,
  )
  assert.match(
    css,
    /\.leg-mate-guide\s*\{[^}]*width:\s*min\(69\.6rem, 100%\)/s,
  )
  assert.match(
    css,
    /@media\s*\(max-width:\s*48rem\)[\s\S]*\.leg-mate-guide-priorities\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/,
  )
  assert.match(
    css,
    /\.leg-mate-guide-shortcuts\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*max-content max-content;[^}]*gap:\s*0\.45rem 1rem/s,
  )
  assert.match(
    css,
    /\.leg-mate-guide-shortcuts div\s*\{[^}]*display:\s*inline-flex;[^}]*gap:\s*0\.4rem/s,
  )
  assert.match(
    css,
    /@media\s*\(max-width:\s*32rem\)[\s\S]*\.leg-mate-controls-actions\s*\{[^}]*flex:\s*1 1 100%/,
  )
  assert.match(
    css,
    /@media\s*\(max-width:\s*32rem\)[\s\S]*\.leg-mate-controls-actions button\s*\{[^}]*flex:\s*1 1 calc\(50% - 0\.4em\)/,
  )
  assert.match(
    css,
    /@media\s*\(max-width:\s*32rem\)[\s\S]*\.leg-mate-controls-summary\s*\{[^}]*justify-content:\s*flex-end/,
  )
})

test('Mate recreates its drill synchronously for exact route changes', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const originalRandom = Math.random
  Math.random = () => 0
  let renderer: ReactTestRenderer | undefined

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', MULTI_WHITE_START),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    await act(async () => {
      mountedRenderer.root.findByType(MateBoardProbe).props.onMove('Rh5')
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 1)

    await act(async () => {
      mountedRenderer.update(
        matePage('rook', 'standard', MULTI_BLACK_START),
      )
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
    assert.equal(
      mountedRenderer.root.findByType(MateBoardProbe).props.fen,
      MULTI_BLACK_START,
    )

    await act(async () => {
      mountedRenderer.update(matePage('queen', 'standard', QUEEN_START))
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
    assert.equal(
      mountedRenderer.root.findByType(MateBoardProbe).props.fen,
      QUEEN_START,
    )
    assert.equal(
      mountedRenderer.root
        .findAllByProps({ href: '/mate/queen' })
        .find((link) => link.props['aria-current'] === 'location')
        ?.props['aria-current'],
      'location',
    )
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    Math.random = originalRandom
  }
})

test('Mate loads replay history at its final position for Undo and Redo', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  let renderer: ReactTestRenderer | undefined

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', ROOK_START, ['Ra8+', 'Kg7']),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    assert.equal(
      mountedRenderer.root.findByType(MateBoardProbe).props.fen,
      ROOK_AFTER_REPLY,
    )
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 1)
    assert.equal(mountedRenderer.root.findByType(MateControls).props.canUndo, true)

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onUndo()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateBoardProbe).props.fen,
      ROOK_AFTER_WHITE,
    )
    assert.equal(
      mountedRenderer.root.findByType(MateLog).props.logs[0]?.opponentSan,
      undefined,
    )
    assert.equal(mountedRenderer.root.findByType(MateControls).props.canRedo, true)

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onRedo()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateBoardProbe).props.fen,
      ROOK_AFTER_REPLY,
    )
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
  }
})

test('Mate syncs the current live FEN after session transitions', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const originalRandom = Math.random
  Math.random = () => 0
  const hrefs: string[] = []
  let renderer: ReactTestRenderer | undefined

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage(
          'rook',
          'standard',
          MULTI_BLACK_START,
          null,
          (href) => hrefs.push(href),
        ),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    const currentFen = () =>
      mountedRenderer.root.findByType(MateBoardProbe).props.fen as string
    const assertLatestHref = (fen = currentFen()) =>
      assert.equal(
        hrefs.at(-1),
        liveMateHref('rook', 'standard', fen),
      )

    assertLatestHref()
    await act(async () => {
      mountedRenderer.root.findByType(MateBoardProbe).props.onMove('Rd1')
    })
    const playedFen = currentFen()
    assertLatestHref()

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onUndo()
    })
    assert.notEqual(currentFen(), MULTI_BLACK_START)
    assert.notEqual(currentFen(), playedFen)
    assertLatestHref(MULTI_BLACK_START)

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onRedo()
    })
    assert.equal(currentFen(), playedFen)
    assertLatestHref()

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onUndo()
      mountedRenderer.root.findByType(MateControls).props.onUndo()
    })
    assert.equal(currentFen(), MULTI_BLACK_START)
    assertLatestHref()

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onStartOver()
    })
    assert.notEqual(currentFen(), playedFen)
    assertLatestHref()
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    Math.random = originalRandom
  }
})

test('Mate Play Best stages White before committing Black and cancels on route change', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const originalRandom = Math.random
  Math.random = () => 0
  let renderer: ReactTestRenderer | undefined

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', MULTI_BLACK_START),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    await act(async () => {
      assert.equal(
        mountedRenderer.root.findByType(MateControls).props.onPlayBest(),
        true,
      )
    })

    const whiteFen = mountedRenderer.root.findByType(MateBoardProbe).props.fen
    assert.notEqual(whiteFen, MULTI_BLACK_START)
    assert.equal(mountedRenderer.root.findByType(MateBoardProbe).props.disabled, true)
    assert.equal(mountedRenderer.root.findByType(MateControls).props.busy, true)
    assert.equal(mountedRenderer.root.findByType(MateLog).props.busy, true)
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.onStartOver(),
      false,
    )

    await act(async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, MATE_REPLY_ANIMATION_MS + 20),
      )
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 1)
    assert.notEqual(
      mountedRenderer.root.findByType(MateBoardProbe).props.fen,
      whiteFen,
    )
    assert.equal(mountedRenderer.root.findByType(MateControls).props.busy, false)

    await act(async () => {
      mountedRenderer.update(matePage('queen', 'standard', QUEEN_START))
    })
    await act(async () => {
      mountedRenderer.update(
        matePage('rook', 'standard', MULTI_BLACK_START),
      )
    })
    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onPlayBest()
    })
    await act(async () => {
      mountedRenderer.update(matePage('queen', 'standard', QUEEN_START))
      await new Promise((resolve) =>
        setTimeout(resolve, MATE_REPLY_ANIMATION_MS + 20),
      )
    })
    assert.equal(mountedRenderer.root.findByType(MateBoardProbe).props.fen, QUEEN_START)
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    Math.random = originalRandom
  }
})

test('Mate restores and writes the timer visibility preference', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'window',
  )
  const storedValues = new Map([[MATE_TIMER_PREFERENCE_KEY, 'false']])
  let renderer: ReactTestRenderer | undefined

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storedValues.set(key, value)
        },
      },
    },
  })

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', MULTI_BLACK_START),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer

    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.showTimer,
      false,
    )
    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onToggleTimer()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.showTimer,
      true,
    )
    assert.equal(storedValues.get(MATE_TIMER_PREFERENCE_KEY), 'true')
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    if (originalWindowDescriptor === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', originalWindowDescriptor)
    }
  }
})

test('Mate wires board, history, timer, and every log replacement action', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const originalRandom = Math.random
  Math.random = () => 0
  let renderer: ReactTestRenderer | undefined

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', MULTI_BLACK_START),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer

    assert.equal(mountedRenderer.root.findByType(MateControls).props.showTimer, true)
    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onToggleTimer()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.showTimer,
      false,
    )

    await act(async () => {
      mountedRenderer.root.findByType(MateBoardProbe).props.onMove('Rd1')
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 1)
    assert.equal(
      mountedRenderer.root.findByType(MateLog).props.logs[0].opponentSan,
      'Kc5',
    )
    assert.deepEqual(
      mountedRenderer.root.findByType(MateBoardProbe).props.lastMove,
      ['c4', 'c5'],
    )

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onUndo()
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
    assert.equal(
      mountedRenderer.root.findByType(MateBoardProbe).props.lastMove,
      null,
    )
    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onRedo()
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 1)

    await act(async () => {
      mountedRenderer.root.findByType(MateLog).props.onCycleIdealBlack(0)
    })
    assert.equal(
      mountedRenderer.root.findByType(MateLog).props.logs[0].opponentSan,
      'Kb4',
    )
    await act(async () => {
      mountedRenderer.root.findByType(MateLog).props.onCycleLegalBlack(0)
    })
    assert.equal(
      mountedRenderer.root.findByType(MateLog).props.logs[0].opponentSan,
      'Kb5',
    )

    await act(async () => {
      mountedRenderer.update(
        matePage('rook', 'standard', MULTI_WHITE_START),
      )
    })
    await act(async () => {
      mountedRenderer.root.findByType(MateBoardProbe).props.onMove('Rh5')
    })
    assert.equal(
      mountedRenderer.root.findByType(MateLog).props.logs[0].san,
      'Rh5',
    )
    await act(async () => {
      mountedRenderer.root.findByType(MateLog).props.onCycleIdealWhite(0)
    })
    assert.equal(
      mountedRenderer.root.findByType(MateLog).props.logs[0].san,
      'Re8',
    )

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onStartOver()
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
    assert.notEqual(
      mountedRenderer.root.findByType(MateBoardProbe).props.fen,
      MULTI_WHITE_START,
    )
    assert.doesNotMatch(reactNodeText(mountedRenderer.root), /reset count/i)
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    Math.random = originalRandom
  }
})

test('Mate keyboard shortcuts execute only from the training surface', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const originalDocument = globalThis.document
  const originalRandom = Math.random
  const keydownListeners = new Set<(event: KeyboardEvent) => void>()
  const fakeDocument = {
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (type === 'keydown') {
        keydownListeners.add(listener as (event: KeyboardEvent) => void)
      }
    },
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (type === 'keydown') {
        keydownListeners.delete(listener as (event: KeyboardEvent) => void)
      }
    },
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: fakeDocument,
  })
  Math.random = () => 0
  let renderer: ReactTestRenderer | undefined

  const dispatch = (
    key: string,
    target: object | null = {
      closest: () => null,
      tagName: 'DIV',
    },
    modifiers: Partial<
      Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>
    > = {},
  ) => {
    let prevented = 0
    const event = {
      altKey: false,
      ctrlKey: false,
      defaultPrevented: false,
      key,
      metaKey: false,
      preventDefault: () => {
        prevented += 1
      },
      shiftKey: false,
      target,
      ...modifiers,
    } as unknown as KeyboardEvent
    for (const listener of [...keydownListeners]) listener(event)
    return prevented
  }

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', MULTI_WHITE_START),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    assert.equal(keydownListeners.size, 1)
    const workspace = mountedRenderer.root.find(
      (node) => node.props.className === 'leg-mate-workspace',
    )
    let pointerButtonBlurs = 0
    workspace.props.onClick({
      detail: 1,
      target: {
        blur: () => {
          pointerButtonBlurs += 1
        },
        tagName: 'BUTTON',
      },
    })
    assert.equal(pointerButtonBlurs, 1)

    assert.equal(dispatch('ArrowLeft'), 0)
    assert.equal(dispatch('ArrowRight'), 0)
    assert.equal(dispatch('ArrowDown'), 0)
    assert.equal(dispatch('Escape'), 0)
    assert.equal(dispatch('w'), 0)
    assert.equal(dispatch('a'), 0)
    assert.equal(dispatch('h'), 0)
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)

    for (const tagName of [
      'INPUT',
      'SELECT',
      'TEXTAREA',
      'BUTTON',
      'A',
    ]) {
      assert.equal(
        dispatch('ArrowUp', { closest: () => null, tagName }),
        0,
        tagName,
      )
    }
    assert.equal(
      dispatch('ArrowUp', {
        closest: () => null,
        isContentEditable: true,
        tagName: 'DIV',
      }),
      0,
    )
    assert.equal(
      dispatch('ArrowUp', {
        closest: () => ({ role: 'dialog' }),
        tagName: 'SPAN',
      }),
      0,
    )
    assert.equal(
      dispatch('ArrowUp', {
        closest: (selector: string) =>
          selector.includes('[role="button"]')
            ? { role: 'button' }
            : null,
        tagName: 'DIV',
      }),
      0,
      'react-chessboard role=button target',
    )
    assert.equal(
      dispatch('ArrowUp', {
        closest: (selector: string) =>
          selector.includes('.leg-mate-board-shell')
            ? { className: 'leg-mate-board-shell' }
            : null,
        tagName: 'SVG',
      }),
      0,
      'Mate board descendant',
    )
    assert.equal(dispatch('ArrowUp', null, { ctrlKey: true }), 0)
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)

    await act(async () => assert.equal(dispatch('ArrowUp'), 1))
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
    assert.equal(dispatch('ArrowLeft'), 0)
    await act(async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, MATE_REPLY_ANIMATION_MS + 20),
      )
    })
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 1)
    await act(async () => assert.equal(dispatch('ArrowLeft'), 1))
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)
    assert.equal(dispatch('ArrowLeft'), 0)
    await act(async () => assert.equal(dispatch('ArrowRight'), 1))
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 1)
    assert.equal(dispatch('ArrowRight'), 0)
    await act(async () => assert.equal(dispatch('Enter'), 1))
    assert.equal(mountedRenderer.root.findByType(MateLog).props.logs.length, 0)

    await act(async () => mountedRenderer.unmount())
    renderer = undefined
    assert.equal(keydownListeners.size, 0)
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    Math.random = originalRandom
    if (originalDocument === undefined) {
      delete (globalThis as { document?: Document }).document
    } else {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: originalDocument,
      })
    }
  }
})

test('Mate terminal sharing copies the exact starting position with status', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  )
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  let nextNotificationTimerId = 0
  const notificationTimers = new Map<number, () => void>()
  globalThis.setTimeout = ((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    if (
      timeout === MATE_SHARE_NOTIFICATION_MS &&
      typeof handler === 'function'
    ) {
      nextNotificationTimerId += 1
      const timerId = nextNotificationTimerId
      notificationTimers.set(timerId, () => {
        notificationTimers.delete(timerId)
        handler(...args)
      })
      return timerId
    }
    return originalSetTimeout(handler, timeout, ...args)
  }) as typeof setTimeout
  globalThis.clearTimeout = ((timerId: number | undefined) => {
    if (
      timerId !== undefined &&
      notificationTimers.delete(Number(timerId))
    ) {
      return
    }
    originalClearTimeout(timerId)
  }) as typeof clearTimeout
  const copied: string[] = []
  let shouldReject = false
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text: string) => {
          if (shouldReject) throw new Error('clipboard unavailable')
          copied.push(text)
        },
      },
    },
  })
  let renderer: ReactTestRenderer | undefined

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', ROOK_MATE_START),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    await act(async () => {
      mountedRenderer.root.findByType(MateBoardProbe).props.onMove('Ra8#')
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.outcome,
      'checkmate',
    )
    assert.equal(
      mountedRenderer.root.findByType(MateBoardProbe).props.complete,
      true,
    )

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onShare()
      await Promise.resolve()
      await Promise.resolve()
    })
    assert.equal(copied.length, 1)
    assert.match(copied[0] ?? '', /^checkmate in \d{2}:\d{2}\.\d{2}\n/)
    assert.ok(
      copied[0]?.includes(
        `/mate/rook${encodeMateFen(ROOK_MATE_START)}`,
      ),
    )
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      'Copied',
    )
    assert.equal(notificationTimers.size, 1)

    const notificationTimer = [...notificationTimers.values()][0]
    assert.equal(typeof notificationTimer, 'function')
    await act(async () => notificationTimer?.())
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      '',
    )
    assert.equal(notificationTimers.size, 0)

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onShare()
      await Promise.resolve()
      await Promise.resolve()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      'Copied',
    )
    assert.equal(notificationTimers.size, 1)

    shouldReject = true
    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onShare()
      await Promise.resolve()
      await Promise.resolve()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      'Copy unavailable',
    )
    assert.equal(notificationTimers.size, 1)

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onUndo()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      '',
    )
    assert.equal(notificationTimers.size, 0)
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    globalThis.setTimeout = originalSetTimeout
    globalThis.clearTimeout = originalClearTimeout
    if (navigatorDescriptor === undefined) {
      delete (globalThis as { navigator?: Navigator }).navigator
    } else {
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor)
    }
  }
})

test('Mate sharing ignores stale clipboard requests and session results', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  )
  const pendingCopies: Array<{
    readonly reject: (reason?: unknown) => void
    readonly resolve: () => void
  }> = []
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: () => new Promise<void>((resolve, reject) => {
          pendingCopies.push({ resolve, reject })
        }),
      },
    },
  })
  let renderer: ReactTestRenderer | undefined

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        matePage('rook', 'standard', ROOK_MATE_START),
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    await act(async () => {
      mountedRenderer.root.findByType(MateBoardProbe).props.onMove('Ra8#')
    })

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onShare()
      mountedRenderer.root.findByType(MateControls).props.onShare()
      await Promise.resolve()
    })
    assert.equal(pendingCopies.length, 2)

    await act(async () => {
      pendingCopies[1]?.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      'Copied',
    )

    await act(async () => {
      pendingCopies[0]?.reject(new Error('older copy failed'))
      await Promise.resolve()
      await Promise.resolve()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      'Copied',
      'an older request must not overwrite the latest result',
    )

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onShare()
      await Promise.resolve()
    })
    assert.equal(pendingCopies.length, 3)
    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onUndo()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      '',
    )

    await act(async () => {
      pendingCopies[2]?.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    assert.equal(
      mountedRenderer.root.findByType(MateControls).props.shareStatus,
      '',
      'a result from the previous session state must stay invalidated',
    )
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    if (navigatorDescriptor === undefined) {
      delete (globalThis as { navigator?: Navigator }).navigator
    } else {
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor)
    }
  }
})

test('Mate timers clean up across exact-route replacement and landing', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const originalSetInterval = globalThis.setInterval
  const originalClearInterval = globalThis.clearInterval
  let nextTimerId = 0
  const activeTimers = new Map<number, TimerHandler>()
  globalThis.setInterval = ((
    handler: TimerHandler,
    _timeout?: number,
    ..._arguments: unknown[]
  ) => {
    nextTimerId += 1
    activeTimers.set(nextTimerId, handler)
    return nextTimerId
  }) as typeof setInterval
  globalThis.clearInterval = ((timerId: number | undefined) => {
    if (timerId !== undefined) activeTimers.delete(Number(timerId))
  }) as typeof clearInterval
  let renderer: ReactTestRenderer | undefined
  let boardRenders = 0

  function CountingBoardProbe(
    props: React.ComponentProps<typeof MateBoard>,
  ) {
    boardRenders += 1
    return <MateBoardProbe {...props} />
  }

  try {
    await act(async () => {
      renderer = TestRenderer.create(
        <Mate
          boardComponent={CountingBoardProbe}
          moduleSelector={<nav aria-label="Modules" />}
          onNavigate={() => undefined}
          route={{
            module: 'mate',
            mateId: 'rook',
            mateMode: 'standard',
            sharedFen: MULTI_WHITE_START,
          }}
        />,
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer
    assert.equal(activeTimers.size, 1)

    const rendersBeforeTick = boardRenders
    const activeHandler = [...activeTimers.values()][0]
    assert.equal(typeof activeHandler, 'function')
    await act(async () => {
      if (typeof activeHandler === 'function') activeHandler()
    })
    assert.equal(
      boardRenders,
      rendersBeforeTick,
      'elapsed ticks must not rerender the workspace board',
    )

    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onToggleTimer()
    })
    assert.equal(activeTimers.size, 0, 'a hidden timer must stop ticking')
    await act(async () => {
      mountedRenderer.root.findByType(MateControls).props.onToggleTimer()
    })
    assert.equal(activeTimers.size, 1)

    await act(async () => {
      mountedRenderer.update(
        <Mate
          boardComponent={CountingBoardProbe}
          moduleSelector={<nav aria-label="Modules" />}
          onNavigate={() => undefined}
          route={{
            module: 'mate',
            mateId: 'rook',
            mateMode: 'standard',
            sharedFen: MULTI_BLACK_START,
          }}
        />,
      )
    })
    assert.equal(activeTimers.size, 1)
    assert.equal(nextTimerId, 3)

    await act(async () => {
      mountedRenderer.update(mateLandingPage())
    })
    assert.equal(activeTimers.size, 0)

    await act(async () => mountedRenderer.unmount())
    renderer = undefined
    assert.equal(activeTimers.size, 0)
  } finally {
    if (renderer) await act(async () => renderer?.unmount())
    globalThis.setInterval = originalSetInterval
    globalThis.clearInterval = originalClearInterval
  }
})

function matePage(
  mateId: 'queen' | 'rook',
  mateMode: 'standard' | 'train',
  sharedFen: string | null,
  sharedMoves: readonly string[] | null = null,
  onReplaceHref: (href: string) => void = () => undefined,
) {
  return (
    <Mate
      boardComponent={MateBoardProbe}
      moduleSelector={<nav aria-label="Modules" />}
      onNavigate={() => undefined}
      onReplaceHref={onReplaceHref}
      route={{
        module: 'mate',
        mateId,
        mateMode,
        sharedFen,
        ...(sharedMoves === null ? {} : { sharedMoves }),
      }}
    />
  )
}

function mateLandingPage() {
  return (
    <Mate
      boardComponent={MateBoardProbe}
      moduleSelector={<nav aria-label="Modules" />}
      onNavigate={() => undefined}
      route={{
        module: 'mate',
        mateId: null,
        mateMode: null,
        sharedFen: null,
      }}
    />
  )
}

function MateBoardProbe(props: React.ComponentProps<typeof MateBoard>) {
  return (
    <div
      aria-disabled={props.disabled}
      aria-label="Mate board probe"
      data-fen={props.fen}
      data-phase={props.phase}
    />
  )
}
