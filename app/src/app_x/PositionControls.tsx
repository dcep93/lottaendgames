export default function PositionControls({
  canGoNext = false,
  canGoPrevious = false,
  hasPlayback,
  lichessUrl,
  onNext,
  onPrevious,
  onReset,
}: {
  canGoNext?: boolean
  canGoPrevious?: boolean
  hasPlayback: boolean
  lichessUrl: string | null
  onNext?: () => void
  onPrevious?: () => void
  onReset?: () => void
}) {
  if (!hasPlayback && !lichessUrl) {
    return null
  }

  return (
    <div className="leg-position-controls" aria-label="Position controls">
      {lichessUrl ? (
        <a href={lichessUrl} rel="noreferrer" target="_blank">
          Lichess ↗
        </a>
      ) : null}
      {hasPlayback ? (
        <>
          <button
            aria-label="Previous move"
            className="leg-position-step"
            disabled={!canGoPrevious}
            onClick={onPrevious}
            title="Previous move"
            type="button"
          >
            ←
          </button>
          <button onClick={onReset} type="button">
            Reset
          </button>
          <button
            aria-label="Next move"
            className="leg-position-step"
            disabled={!canGoNext}
            onClick={onNext}
            title="Next move"
            type="button"
          >
            →
          </button>
        </>
      ) : null}
    </div>
  )
}
