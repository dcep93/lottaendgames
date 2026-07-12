import { Chessboard } from 'react-chessboard'
import type { PositionMarker } from './chapterTypes'
import { getSquareIndex } from './fen'

type ChessBoardProps = {
  animateNextMove?: boolean
  fen: string
  markers?: PositionMarker[]
  number: string
}

export default function ChessBoard({
  animateNextMove = false,
  fen,
  markers = [],
  number,
}: ChessBoardProps) {
  const boardId = `position-${number.replace(/[^a-z0-9_-]/gi, '-')}`

  return (
    <div className="leg-board-wrap">
      <div
        aria-label={`Chess position ${number}`}
        className="leg-board-stage"
        data-animate-next-move={animateNextMove ? 'true' : 'false'}
        role="img"
      >
        <Chessboard
          options={{
            id: boardId,
            allowDragging: false,
            animationDurationInMs: animateNextMove ? 220 : 0,
            boardOrientation: 'white',
            boardStyle: {
              border: '0.14rem solid rgba(255, 255, 255, 0.14)',
              borderRadius: '0.35rem',
              boxShadow: '0 0.8rem 1.8rem rgba(0, 0, 0, 0.28)',
              overflow: 'hidden',
              width: '100%',
            },
            darkSquareStyle: { backgroundColor: 'var(--leg-board-dark)' },
            lightSquareStyle: { backgroundColor: 'var(--leg-board-light)' },
            position: fen,
            showAnimations: animateNextMove,
            showNotation: false,
          }}
        />
        <div className="leg-board-marker-layer">
          {markers.map((marker, markerIndex) => (
            <BoardMarker
              key={`${marker.square}-${marker.symbol}-${markerIndex}`}
              marker={marker}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BoardMarker({ marker }: { marker: PositionMarker }) {
  const squareIndex = getSquareIndex(marker.square)

  if (!squareIndex) {
    return null
  }

  const markerClass =
    marker.symbol === 'outlined square'
      ? 'leg-board-marker leg-board-marker--outline'
      : 'leg-board-marker leg-board-marker--badge'

  return (
    <span
      aria-label={`${marker.symbol} marker on ${marker.square}: ${marker.meaning}`}
      className={markerClass}
      style={{
        gridColumn: squareIndex.column,
        gridRow: squareIndex.row,
      }}
      title={`${marker.square}: ${marker.meaning}`}
    >
      {marker.symbol === 'outlined square' ? null : (
        <span className="leg-board-marker-glyph">{marker.symbol}</span>
      )}
    </span>
  )
}
