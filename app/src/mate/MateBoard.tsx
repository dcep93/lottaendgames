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
} from './boardInteraction'

export type MateBoardProps = {
  readonly fen: string
  readonly phase: string
  readonly complete?: boolean
  readonly lastMove: readonly [Square, Square] | null
  readonly disabled: boolean
  readonly onMove: (san: string) => void
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
  phase,
  complete = false,
  lastMove,
  disabled,
  onMove,
  boardRenderer: BoardRenderer = Chessboard,
}: MateBoardSurfaceProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [optimisticMove, setOptimisticMove] = useState<OptimisticMove | null>(
    null,
  )
  const moveId = React.useRef(0)
  const phaseId = React.useId()

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
    () => getLegalTargets(fen, selectedSquare, disabled),
    [disabled, fen, selectedSquare],
  )
  const squareStyles = useMemo(
    () => getMateBoardSquareStyles(lastMove, selectedSquare, legalTargets),
    [lastMove, legalTargets, selectedSquare],
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
    canSelectSideToMovePiece(fen, square, disabled)
  const selectSquare = (square: string | null) => {
    setSelectedSquare(canSelect(square) ? square as Square : null)
  }
  const moveFromTo = (sourceSquare: string, targetSquare: string | null) => {
    const move = resolveMateBoardMove({
      disabled: disabled || isOptimistic,
      fen,
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

  return (
    <div className="leg-mate-board-card">
      <p className="leg-mate-board-phase" id={phaseId}>
        {complete ? 'Complete' : `Phase ${phase}`}
      </p>
      <div
        aria-describedby={phaseId}
        aria-disabled={disabled}
        aria-label="Mate board, White orientation"
        className={[
          'leg-mate-board-shell',
          isPhaseTwo ? 'leg-mate-board-shell--phase-two' : '',
        ].filter(Boolean).join(' ')}
        data-last-move={lastMoveLabel}
        data-orientation="white"
        data-phase={phase}
        data-position-state={isOptimistic ? 'optimistic' : 'controlled'}
        data-reply-animation-ms={MATE_MOVE_ANIMATION_MS}
        role="group"
      >
        <BoardRenderer
          key={`mate-board-move-${optimisticMove?.id ?? 0}`}
          options={{
            id: 'leg-mate-board',
            allowDragOffBoard: false,
            allowDragging: !disabled && !isOptimistic,
            allowDrawingArrows: false,
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
              return moveFromTo(sourceSquare, targetSquare)
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
            squareStyles,
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
