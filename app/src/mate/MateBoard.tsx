import type { MateId } from './types'
import {
  default as React,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Square } from 'chess.js'
import {
  Chessboard,
  defaultPieces,
  type ChessboardOptions,
  type PieceRenderObject,
} from 'react-chessboard'
import {
  MATE_MOVE_ANIMATION_MS,
  canSelectSideToMovePiece,
  getLegalTargets,
  getMateBoardSquareStyles,
  resolveMateBoardMove,
  type MateBoardInteraction,
} from './boardInteraction'
import { releaseFocusWithin } from './workspaceSupport'
import { BOARD_SQUARE_HIGHLIGHT_STYLE, useBoardHighlights } from '../useBoardHighlights'

export type MateBoardProps = {
  readonly fen: string
  readonly mateId?: MateId
  readonly phase: string
  readonly lastMove: readonly [Square, Square] | null
  readonly disabled: boolean
  readonly onMove: (san: string) => void
  readonly interaction?: MateBoardInteraction
  readonly targetSquare?: Square | null
}

type BoardRenderer = React.ComponentType<{ readonly options?: ChessboardOptions }>

type MateBoardSurfaceProps = MateBoardProps & {
  readonly boardRenderer?: BoardRenderer
}

type OptimisticMove = {
  readonly id: number
  readonly san: string
  readonly sourceFen: string
  readonly stage: 'pending' | 'notified' | 'settled'
  readonly moveFen: string
}

const PIECE_NAMES: Readonly<Record<string, string>> = {
  P: 'pawn',
  R: 'rook',
  N: 'knight',
  B: 'bishop',
  Q: 'queen',
  K: 'king',
}

const VISUALLY_HIDDEN_STYLE = Object.freeze({
  border: 0,
  clipPath: 'inset(50%)',
  height: '0.0625rem',
  margin: '-0.0625rem',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '0.0625rem',
} satisfies React.CSSProperties)

const ACCESSIBLE_PIECES = Object.fromEntries(
  Object.entries(defaultPieces).map(([pieceType, renderPiece]) => [
    pieceType,
    (props) => (
      <>
        <span aria-hidden="true" style={{ display: 'contents' }}>
          {renderPiece(props)}
        </span>
        <span style={VISUALLY_HIDDEN_STYLE}>
          {pieceLabel(pieceType, props?.square)}
        </span>
      </>
    ),
  ]),
) as PieceRenderObject

export default function MateBoard(props: MateBoardProps) {
  return <MateBoardSurface {...props} />
}

export function MateBoardSurface({
  fen,
  mateId,
  phase,
  lastMove,
  disabled,
  onMove,
  interaction,
  targetSquare,
  boardRenderer: BoardRenderer = Chessboard,
}: MateBoardSurfaceProps) {
  const highlights = useBoardHighlights(fen)
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [optimisticMove, setOptimisticMove] = useState<OptimisticMove | null>(
    null,
  )
  const moveId = React.useRef(0)
  const boardShellRef = React.useRef<HTMLDivElement>(null)
  const pointerInteractionRef = React.useRef(false)

  useEffect(() => {
    setSelectedSquare(null)
  }, [disabled, fen])
  useEffect(() => {
    if (optimisticMove === null || optimisticMove.stage === 'settled') return
    if (disabled || fen !== optimisticMove.sourceFen) {
      setOptimisticMove({ ...optimisticMove, stage: 'settled' })
      return
    }
    if (optimisticMove.stage === 'pending') {
      setOptimisticMove({ ...optimisticMove, stage: 'notified' })
      onMove(optimisticMove.san)
      return
    }
    setOptimisticMove({ ...optimisticMove, stage: 'settled' })
  }, [disabled, fen, onMove, optimisticMove])

  const legalTargets = useMemo(
    () => interaction
      ? interaction.legalTargets(fen, selectedSquare, disabled)
      : getLegalTargets(fen, selectedSquare, disabled, mateId),
    [disabled, fen, selectedSquare, mateId, interaction],
  )
  const squareStyles = useMemo(
    () => {
      const styles = getMateBoardSquareStyles(lastMove, selectedSquare, legalTargets)
      if (targetSquare) styles[targetSquare] = { ...styles[targetSquare], ...BOARD_SQUARE_HIGHLIGHT_STYLE }
      return styles
    },
    [lastMove, legalTargets, selectedSquare, targetSquare],
  )
  const isPhaseTwo = phase === '2/2'
  const lastMoveLabel = lastMove === null
    ? 'none'
    : `${lastMove[0]}-${lastMove[1]}`
  const isOptimistic =
    !disabled &&
    optimisticMove?.stage !== 'settled' &&
    optimisticMove?.sourceFen === fen
  const displayedFen = isOptimistic ? optimisticMove.moveFen : fen

  const canSelect = (square: string | null) =>
    !isOptimistic &&
    square !== null &&
    (interaction ? interaction.canSelect(fen, square, disabled) : canSelectSideToMovePiece(fen, square, disabled, mateId))
  const selectSquare = (square: string | null) => {
    setSelectedSquare(canSelect(square) ? square as Square : null)
  }
  const moveFromTo = (sourceSquare: string, targetSquare: string | null) => {
    const move = (interaction?.resolveMove ?? resolveMateBoardMove)({
      disabled: disabled || isOptimistic,
      fen,
      mateId,
      sourceSquare,
      targetSquare,
    })
    if (move === null) return false

    moveId.current += 1
    setSelectedSquare(null)
    setOptimisticMove({
      id: moveId.current,
      san: move.san,
      sourceFen: fen,
      stage: 'pending',
      moveFen: move.fen,
    })
    return true
  }
  const beginPointerInteraction = () => {
    pointerInteractionRef.current = true
  }
  const releasePointerFocus = () => {
    if (!pointerInteractionRef.current) return
    releaseFocusWithin(boardShellRef.current)
    pointerInteractionRef.current = false
  }

  return (
    <div className="leg-mate-board-card">
      <div
        ref={boardShellRef}
        aria-disabled={disabled}
        aria-label={targetSquare ? `Mate board, White orientation. Next target: ${targetSquare}` : 'Mate board, White orientation'}
        className={[
          'leg-mate-board-shell',
          isPhaseTwo ? 'leg-mate-board-shell--phase-two' : '',
        ].filter(Boolean).join(' ')}
        data-last-move={lastMoveLabel}
        data-target-square={targetSquare ?? undefined}
        data-orientation="white"
        data-phase={phase}
        data-position-state={isOptimistic ? 'optimistic' : 'controlled'}
        data-reply-animation-ms={MATE_MOVE_ANIMATION_MS}
        onPointerCancelCapture={releasePointerFocus}
        onPointerDownCapture={beginPointerInteraction}
        onPointerUpCapture={releasePointerFocus}
        role="group"
      >
        <BoardRenderer
          key={`mate-board-move-${optimisticMove?.id ?? 0}`}
          options={{
            id: 'leg-mate-board',
            allowDragOffBoard: false,
            allowDragging: !disabled && !isOptimistic,
            allowDrawingArrows: true,
            onSquareRightClick: highlights.onSquareRightClick,
            onSquareMouseDown: highlights.onSquareMouseDown,
            animationDurationInMs: isOptimistic
              ? 0
              : MATE_MOVE_ANIMATION_MS,
            boardOrientation: 'white',
            boardStyle: {
              borderRadius: '0.35rem',
              overflow: 'hidden',
              width: '100%',
            },
            canDragPiece: ({ square }) => canSelect(square),
            onPieceClick: ({ square }) => selectSquare(square),
            onPieceDrag: ({ square }) => selectSquare(square),
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              setSelectedSquare(null)
              const moved = moveFromTo(sourceSquare, targetSquare)
              releasePointerFocus()
              return moved
            },
            onSquareClick: ({ square }) => {
              if (selectedSquare === null) {
                selectSquare(square)
                return
              }
              if (selectedSquare === square) {
                setSelectedSquare(null)
                return
              }
              if (!moveFromTo(selectedSquare, square)) {
                selectSquare(square)
              }
            },
            pieces: ACCESSIBLE_PIECES,
            position: displayedFen,
            showAnimations: !isOptimistic,
            showNotation: true,
            squareStyles: highlights.withHighlights(squareStyles),
          }}
        />
      </div>
    </div>
  )
}

function pieceLabel(pieceType: string, square: string | undefined): string {
  const color = pieceType[0] === 'w' ? 'White' : 'Black'
  const piece = PIECE_NAMES[pieceType[1] ?? ''] ?? 'piece'
  return square === undefined
    ? `${color} ${piece}`
    : `${color} ${piece} on ${square}`
}
