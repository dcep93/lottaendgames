import assert from 'node:assert/strict'
import test from 'node:test'
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer'
import ChessBoard from './ChessBoard'
import PositionControls from './PositionControls'

test('board touch taps, mouse clicks, and keyboard activation toggle once', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const classes = new Set<string>()
  const listeners = new Map<string, (event: { key: string }) => void>()
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      getElementById: () => ({
        getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100 }),
      }),
      body: { classList: {
        add: (name: string) => classes.add(name),
        remove: (name: string) => classes.delete(name),
      } },
      addEventListener: (name: string, listener: (event: { key: string }) => void) => listeners.set(name, listener),
      removeEventListener: (name: string) => listeners.delete(name),
    },
  })
  let renderer: ReactTestRenderer | undefined
  let nextMoves = 0
  let resets = 0
  try {
    await act(async () => {
      renderer = TestRenderer.create(<ChessBoard
        fen="7k/8/8/8/8/8/8/K7 w - - 0 1" number="touch-test" orientation="white"
        expandedControls={<PositionControls
          hasPlayback canGoNext canGoPrevious={false} lichessUrl={null}
          onNext={() => nextMoves++} onReset={() => resets++}
        />}
      />)
    })
    const toggle = () => renderer!.root.findByProps({ className: 'leg-board-expand-toggle' })
    const square = (name: string) => renderer!.root.findByProps({ 'data-square': name })
    const expanded = (expected: boolean) => {
      assert.equal(toggle().props['aria-pressed'], expected)
      assert.equal(classes.has('leg-board-expanded-scroll-lock'), expected)
    }
    const tap = async (name: string, clientX = 50) => {
      await act(async () => square(name).props.onTouchStart())
      let prevented = false
      await act(async () => square(name).props.onTouchEnd({
        changedTouches: [{ clientX, clientY: 50 }],
        preventDefault: () => { prevented = true },
      }))
      // Exercise the library's real touch path: it suppresses the native click.
      assert.equal(prevented, true)
    }
    expanded(false)
    assert.equal(renderer!.root.findAllByProps({ 'aria-label': 'Next move' }).length, 0)
    for (let repetition = 0; repetition < 3; repetition++) {
      await tap('a1') // occupied square
      expanded(true)
      await tap('e4') // empty square
      expanded(false)
    }
    await tap('e4', 150) // finger ends outside the starting square
    expanded(false)

    // React Test Renderer does not bubble events, so dispatch both handlers.
    await act(async () => {
      square('a1').props.onClick({ button: 0 })
      toggle().props.onClick({ target: {}, currentTarget: {} })
    })
    expanded(true)
    const nextButton = renderer!.root.findByProps({ 'aria-label': 'Next move' })
    assert.equal(nextButton.props.disabled, false)
    assert.equal(renderer!.root.findByProps({ 'aria-label': 'Previous move' }).props.disabled, true)
    await act(async () => nextButton.props.onClick())
    assert.equal(nextMoves, 1)
    expanded(true)
    const resetButton = renderer!.root.findAllByType('button').find(button => button.children.includes('Reset'))!
    await act(async () => resetButton.props.onClick())
    assert.equal(resets, 1)
    expanded(true)
    await act(async () => listeners.get('keydown')!({ key: 'Escape' }))
    expanded(false)
    for (const key of ['Enter', ' ']) {
      await act(async () => toggle().props.onKeyDown({ key, preventDefault() {} }))
      expanded(key === 'Enter')
    }
    const accessibleTarget = {}
    await act(async () => toggle().props.onClick({ target: accessibleTarget, currentTarget: accessibleTarget }))
    expanded(true)
  } finally {
    if (renderer) await act(async () => renderer!.unmount())
    assert.equal(classes.size, 0)
    assert.equal(listeners.size, 0)
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
    else Reflect.deleteProperty(globalThis, 'document')
  }
})
