import {
  default as React,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import {
  MATE_REPLY_ANIMATION_MS,
  canSelectWhitePiece,
  getLegalTargets,
  getMateBoardSquareStyles,
  tryMateBoardMove,
} from './boardInteraction'

export type MateBoardProps = {
  readonly fen: string
  readonly phase: string
  readonly lastMove: readonly [Square, Square] | null
  readonly disabled: boolean
  readonly onMove: (san: string) => void
}

export default function MateBoard({
  fen,
  phase,
  lastMove,
  disabled,
  onMove,
}: MateBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const phaseId = React.useId()

  useEffect(() => {
    setSelectedSquare(null)
  }, [disabled, fen])

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

  const canSelect = (square: string | null) =>
    square !== null && canSelectWhitePiece(fen, square, disabled)
  const selectSquare = (square: string | null) => {
    setSelectedSquare(canSelect(square) ? square as Square : null)
  }
  const moveFromTo = (sourceSquare: string, targetSquare: string | null) => {
    const didMove = tryMateBoardMove({
      disabled,
      fen,
      onMove,
      sourceSquare,
      targetSquare,
    })
    if (didMove) setSelectedSquare(null)
    return didMove
  }

  return (
    <div className="leg-mate-board-card">
      <p className="leg-mate-board-phase" id={phaseId}>
        Phase {phase}
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
        data-reply-animation-ms={MATE_REPLY_ANIMATION_MS}
        role="group"
      >
        <Chessboard
          options={{
            id: 'leg-mate-board',
            allowDragOffBoard: false,
            allowDragging: !disabled,
            allowDrawingArrows: false,
            animationDurationInMs: MATE_REPLY_ANIMATION_MS,
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
            position: fen,
            showAnimations: true,
            showNotation: true,
            squareStyles,
          }}
        />
      </div>
    </div>
  )
}
