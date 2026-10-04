import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer'
import type { ChessboardOptions } from 'react-chessboard'
import Mate from './index'
import { MateBoardSurface, type MateBoardProps } from './MateBoard'
import MateControls from './MateControls'
import KnightQueenGuide from './KnightQueenGuide'
import { BOARD_SQUARE_HIGHLIGHT_STYLE } from '../useBoardHighlights'
import { knightQueenFen } from './knightQueen'

function BoardOptionsProbe(_props: { options?: ChessboardOptions }) { return <div /> }
function BoardProbe(props: MateBoardProps) {
  return <MateBoardSurface {...props} boardRenderer={BoardOptionsProbe} />
}
const page = () => <React.StrictMode><Mate boardComponent={BoardProbe} moduleSelector={<nav />} onNavigate={() => undefined}
  route={{ module: 'mate', mateId: 'knight-queen', mateMode: null, sharedFen: null }} /></React.StrictMode>

test('Knight vs Queen renders its material entry, compact exercise controls, and highlighted target without modes', () => {
  const markup = renderToStaticMarkup(page())
  assert.match(markup, /aria-label="Knight vs Queen, selected"/)
  assert.match(markup, /title="Knight vs Queen"/)
  assert.match(markup, /data-target-square="f8"/)
  assert.match(markup, /Next target: f8/)
  assert.match(markup, /1\/36 squares/)
  assert.doesNotMatch(markup, /Training Wheels|Standard|Copy PGN|Show reason hints/)
  for (const label of ['Play Best', 'Undo', 'Redo', 'Start Over', 'Training Info']) assert.ok(markup.includes(label))
  const guide = renderToStaticMarkup(<KnightQueenGuide onClose={() => undefined} />)
  for (const text of ['weird one', 'no kings', 'Black never moves', 'snaking order', 'shortest safe route']) assert.ok(guide.includes(text))
})

test('real board callbacks, Best Move, undo/redo, and timer controls preserve exercise progress', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  let renderer: ReactTestRenderer | undefined
  try {
    await act(async () => { renderer = TestRenderer.create(page()) })
    const root = () => renderer!.root
    const board = () => root().findByType(BoardOptionsProbe).props.options as ChessboardOptions
    const controls = () => root().findByType(MateControls).props
    assert.equal(board().position, knightQueenFen('h8'))
    assert.deepEqual(board().squareStyles?.f8, BOARD_SQUARE_HIGHLIGHT_STYLE)
    assert.equal(board().canDragPiece?.({ piece: { pieceType: 'bQ' }, square: 'd5', isSparePiece: false }), false)
    let accepted: boolean | undefined
    await act(async () => {
      accepted = board().onPieceDrop?.({ piece: { pieceType: 'wN', position: 'h8', isSparePiece: false }, sourceSquare: 'h8', targetSquare: 'f7' })
    })
    assert.equal(accepted, false)
    assert.equal(root().findByType(BoardProbe).props.fen, knightQueenFen('h8'))
    await act(async () => {
      accepted = board().onPieceDrop?.({ piece: { pieceType: 'wN', position: 'h8', isSparePiece: false }, sourceSquare: 'h8', targetSquare: 'g6' })
    })
    assert.equal(accepted, true)
    assert.equal(root().findByType(BoardProbe).props.fen, knightQueenFen('g6'))
    await act(async () => { controls().onPlayBest() })
    assert.equal(root().findByType(BoardProbe).props.fen, knightQueenFen('f8'))
    assert.equal(root().findByType(BoardProbe).props.targetSquare, 'e8')
    await act(async () => { controls().onUndo() })
    assert.equal(root().findByType(BoardProbe).props.targetSquare, 'f8')
    await act(async () => { controls().onRedo() })
    assert.equal(root().findByType(BoardProbe).props.targetSquare, 'e8')
    await act(async () => { controls().onToggleTimer() })
    assert.ok(!root().findAllByType('th').some(node => node.children.includes('Time')))
    await act(async () => { controls().onToggleTimer() })
    assert.ok(root().findAllByType('th').some(node => node.children.includes('Time')))
    await act(async () => { controls().onStartOver() })
    assert.equal(root().findByType(BoardProbe).props.fen, knightQueenFen('h8'))
    assert.equal(root().findByType(BoardProbe).props.targetSquare, 'f8')
    assert.equal(controls().canUndo, false)
    assert.equal(controls().canRedo, false)
  } finally {
    if (renderer) await act(async () => renderer!.unmount())
  }
})

test('keyboard play and the native Training Info dialog work together and restore focus', async () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const listeners = new Set<(event: KeyboardEvent) => void>()
  let opened = false
  let focused = false
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    activeElement: { focus: () => { focused = true } },
    addEventListener: (name: string, callback: (event: KeyboardEvent) => void) => { if (name === 'keydown') listeners.add(callback) },
    removeEventListener: (name: string, callback: (event: KeyboardEvent) => void) => { if (name === 'keydown') listeners.delete(callback) },
  } })
  let renderer: ReactTestRenderer | undefined
  const press = async (key: string) => {
    const event = { key, target: null, preventDefault() {} } as unknown as KeyboardEvent
    await act(async () => { for (const listener of listeners) listener(event) })
  }
  try {
    await act(async () => {
      renderer = TestRenderer.create(page(), { createNodeMock: element => element.type === 'dialog'
        ? { showModal: () => { opened = true }, close: () => { opened = false } } : null })
    })
    await press('ArrowUp')
    assert.equal(renderer!.root.findByType(BoardProbe).props.fen, knightQueenFen('g6'))
    await press('Escape')
    assert.equal(opened, true)
    await press('ArrowUp')
    assert.equal(renderer!.root.findByType(BoardProbe).props.fen, knightQueenFen('g6'))
    await act(async () => { renderer!.root.findByType('dialog').props.onCancel({ preventDefault() {} }) })
    assert.equal(opened, false)
    assert.equal(focused, true)
    await press('ArrowLeft')
    assert.equal(renderer!.root.findByType(BoardProbe).props.fen, knightQueenFen('h8'))
    await press('ArrowRight')
    assert.equal(renderer!.root.findByType(BoardProbe).props.fen, knightQueenFen('g6'))
    await press('Enter')
    assert.equal(renderer!.root.findByType(BoardProbe).props.fen, knightQueenFen('h8'))
  } finally {
    if (renderer) await act(async () => renderer!.unmount())
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument)
    else Reflect.deleteProperty(globalThis, 'document')
  }
  assert.equal(listeners.size, 0)
})
