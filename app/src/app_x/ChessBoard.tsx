import { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import type {
  BoardOrientation,
  PositionMarker,
  PositionRoute,
} from './chapterTypes'
import { getSquareIndex } from './fen'

type ChessBoardProps = {
  animateNextMove?: boolean
  ariaLabel?: string
  fen: string
  markers?: PositionMarker[]
  number: string
  orientation: BoardOrientation
  routes?: PositionRoute[]
}

export default function ChessBoard({
  animateNextMove = false,
  ariaLabel,
  fen,
  markers = [],
  number,
  orientation,
  routes = [],
}: ChessBoardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const boardId = `position-${number.replace(/[^a-z0-9_-]/gi, '-')}`
  const arrowMarkerId = `${boardId}-route-arrowhead`

  useEffect(() => {
    if (!isExpanded || typeof document === 'undefined') {
      return
    }

    const restoreOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    document.body.classList.add('leg-board-expanded-scroll-lock')
    document.addEventListener('keydown', restoreOnEscape)

    return () => {
      document.body.classList.remove('leg-board-expanded-scroll-lock')
      document.removeEventListener('keydown', restoreOnEscape)
    }
  }, [isExpanded])

  const expansionAction = isExpanded ? 'Restore' : 'Expand'
  const toggleExpanded = () => setIsExpanded((expanded) => !expanded)
  const board = (
    <div
      aria-label={ariaLabel ?? `Chess position ${number}`}
      className="leg-board-stage"
      data-animate-next-move={animateNextMove ? 'true' : 'false'}
      role="img"
    >
      <Chessboard
        options={{
          id: boardId,
          allowDragging: false,
          animationDurationInMs: animateNextMove ? 220 : 0,
          boardOrientation: orientation,
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
          showNotation: true,
        }}
      />
      <div className="leg-board-marker-layer">
        {routes.length > 0 ? (
          <svg
            aria-hidden="true"
            className="leg-board-route-layer"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <marker
                id={arrowMarkerId}
                markerHeight="5"
                markerUnits="strokeWidth"
                markerWidth="5"
                orient="auto"
                refX="4.5"
                refY="2.5"
                viewBox="0 0 5 5"
              >
                <path className="leg-board-route-arrowhead" d="M 0 0 L 5 2.5 L 0 5 z" />
              </marker>
            </defs>
            {routes.map((route, routeIndex) => (
              <polyline
                className={`leg-board-route leg-board-route--${route.style ?? 'line'}`}
                key={`${route.squares.join('-')}-${routeIndex}`}
                markerEnd={
                  route.style === 'arrow'
                    ? `url(#${arrowMarkerId})`
                    : undefined
                }
                points={getRoutePoints(route, orientation)}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        ) : null}
        {markers.map((marker, markerIndex) => (
          <BoardMarker
            key={`${marker.square}-${marker.symbol}-${markerIndex}`}
            marker={marker}
            orientation={orientation}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div
      className={
        isExpanded ? 'leg-board-wrap is-expanded' : 'leg-board-wrap'
      }
      data-expanded={isExpanded ? 'true' : 'false'}
    >
      <div
        aria-label={`${expansionAction} position ${number}`}
        aria-pressed={isExpanded}
        className="leg-board-expand-toggle"
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return
          }

          event.preventDefault()
          toggleExpanded()
        }}
        role="button"
        tabIndex={0}
        title={`${expansionAction} board`}
      >
        {board}
      </div>
    </div>
  )
}

function getRoutePoints(
  route: PositionRoute,
  orientation: BoardOrientation,
) {
  return route.squares
    .map((square) => getSquareIndex(square, orientation))
    .filter((squareIndex) => squareIndex !== null)
    .map(
      (squareIndex) =>
        `${(squareIndex.column - 0.5) * 12.5},${(squareIndex.row - 0.5) * 12.5}`,
    )
    .join(' ')
}

function BoardMarker({
  marker,
  orientation,
}: {
  marker: PositionMarker
  orientation: BoardOrientation
}) {
  const squareIndex = getSquareIndex(marker.square, orientation)

  if (!squareIndex) {
    return null
  }

  const markerClass = marker.symbol === 'outlined square'
    ? 'leg-board-marker leg-board-marker--outline'
    : marker.variant === 'emphasis'
      ? 'leg-board-marker leg-board-marker--emphasis'
    : marker.variant === 'label'
      ? 'leg-board-marker leg-board-marker--label'
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
