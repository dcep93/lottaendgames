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
import MateLog, {
  MatePriorityGuideDialog,
} from './MateLog'
import { getMateRuleSet } from './rules'
import type { MateLogEntry } from './session'

const ROOK_START = '7k/8/8/8/8/8/R7/K7 w - - 0 1'
const ROOK_AFTER_WHITE = 'R6k/8/8/8/8/8/8/K7 b - - 1 1'
const ROOK_AFTER_REPLY = 'R7/6k1/8/8/8/8/8/K7 w - - 2 2'
const EXTERNAL_START = '6k1/8/8/8/8/3K4/8/R7 w - - 0 1'

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

test('Mate log exposes every training field and semantic cycle controls', () => {
  const idealWhiteIndexes: number[] = []
  const idealBlackIndexes: number[] = []
  const legalBlackIndexes: number[] = []
  const markup = renderToStaticMarkup(
    <MateLog
      fen={ROOK_START}
      logs={ROOK_LOGS}
      onCycleIdealBlack={(index) => idealBlackIndexes.push(index)}
      onCycleIdealWhite={(index) => idealWhiteIndexes.push(index)}
      onCycleLegalBlack={(index) => legalBlackIndexes.push(index)}
      ruleSet={getMateRuleSet('rook')}
    />,
  )

  for (const header of [
    '#',
    'Phase',
    'White move',
    'Black move',
    'Ideal Black replies',
    'Legal Black replies',
    'Correctness',
    'Duration',
    'Reason',
  ]) {
    assert.ok(markup.includes(`>${header}<`) || markup.includes(`>${header}`), header)
  }
  assert.match(markup, />Rg2</)
  assert.match(markup, />Kg7</)
  assert.match(markup, />Correct</)
  assert.match(markup, />Incorrect</)
  assert.match(markup, /2 correct choices/)
  assert.match(markup, /1 correct choice/)
  assert.match(markup, />0:01\.234</)
  assert.match(markup, />1:01\.007</)
  assert.match(markup, />White king closer</)
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

test('reason hint is opt-in and reveals only the current rule label', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  const ruleSet = getMateRuleSet('rook')
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <MateLog
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
  assert.equal(hintText, 'White king closer')
  assert.doesNotMatch(hintText, /Rg2|a2|g2|bring White's king/i)
  assert.equal(hint.props.type, 'button')

  await act(async () => renderer.unmount())
})

test('priority guide follows registered facade order and renders typed diagrams', () => {
  const ruleSet = getMateRuleSet('bishop-knight')
  const markup = renderToStaticMarkup(
    <MatePriorityGuideDialog
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
  assert.match(markup, />White best moves</)
  assert.match(markup, />Black resistance</)

  let cursor = -1
  for (const rule of ruleSet.whiteRuleDescriptions) {
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

test('priority guide focuses on open, closes with Escape, and restores focus', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  type FakeNode = {
    readonly label: string
    focusCalls: number
    focus: () => void
  }
  const fakeNodes: FakeNode[] = []
  let keydown: ((event: KeyboardEvent) => void) | undefined
  const originalDocument = globalThis.document
  const fakeDocument: {
    activeElement: FakeNode | null
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => void
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => void
  } = {
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

  let renderer: ReactTestRenderer | undefined
  try {
    await act(async () => {
      renderer = TestRenderer.create(
        <MateLog
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
            const label = String(
              props['aria-label'] ?? props.children ?? '',
            )
            const node: FakeNode = {
              label,
              focusCalls: 0,
              focus() {
                node.focusCalls += 1
                fakeDocument.activeElement = node
              },
            }
            fakeNodes.push(node)
            return node
          },
        },
      )
    })
    const mountedRenderer = renderer as ReactTestRenderer

    const openButton = mountedRenderer.root.findByProps({
      'aria-label': 'Open Mate priority guide',
    })
    const openerNode: FakeNode = {
      label: 'Open Mate priority guide',
      focusCalls: 0,
      focus() {
        openerNode.focusCalls += 1
        fakeDocument.activeElement = openerNode
      },
    }
    await act(async () => {
      openButton.props.onClick({ currentTarget: openerNode })
    })
    assert.equal(
      mountedRenderer.root.findAllByProps({ role: 'dialog' }).length,
      1,
    )
    const closeNode = fakeNodes.find(
      (node) => node.label === 'Close priority guide',
    )
    assert.ok(closeNode)
    assert.equal(closeNode.focusCalls, 1)
    assert.ok(keydown)

    await act(async () => {
      keydown?.({
        key: 'Escape',
        preventDefault: () => undefined,
        stopPropagation: () => undefined,
      } as KeyboardEvent)
    })
    assert.equal(
      mountedRenderer.root.findAllByProps({ role: 'dialog' }).length,
      0,
    )
    assert.equal(openerNode.focusCalls, 1)
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
