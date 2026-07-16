import React from 'react'
import type { MateTerminalOutcome } from './session'

export type MateControlsProps = {
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly canPlayBest: boolean
  readonly startedAtMs: number
  readonly finishedAtMs?: number
  readonly showTimer: boolean
  readonly outcome?: MateTerminalOutcome
  readonly shareStatus?: string
  readonly timerNow?: () => number
  readonly onStartOver: () => void
  readonly onUndo: () => void
  readonly onRedo: () => void
  readonly onPlayBest: () => void
  readonly onToggleTimer: () => void
  readonly onShare: () => void
}

const OUTCOME_LABELS: Readonly<Record<MateTerminalOutcome, string>> = {
  checkmate: 'Checkmate',
  stalemate: 'Stalemate',
  'lost-material': 'Required mating material was lost',
  'lost-knight': 'A required knight was lost',
  'pawn-promoted': 'The pawn promoted',
  'fifty-move': 'Draw by the fifty-move rule',
  unsupported: 'The position left the supported winning construction',
}

const readCurrentTime = () => Date.now()

function formatMateElapsed(elapsedMs: number): string {
  const safeMs = Number.isFinite(elapsedMs)
    ? Math.max(0, Math.floor(elapsedMs))
    : 0
  const totalCentiseconds = Math.floor(safeMs / 10)
  const minutes = Math.floor(totalCentiseconds / 6_000)
  const seconds = Math.floor((totalCentiseconds % 6_000) / 100)
  const centiseconds = totalCentiseconds % 100
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

export default function MateControls({
  canUndo,
  canRedo,
  canPlayBest,
  startedAtMs,
  finishedAtMs,
  showTimer,
  outcome,
  shareStatus,
  timerNow = readCurrentTime,
  onStartOver,
  onUndo,
  onRedo,
  onPlayBest,
  onToggleTimer,
  onShare,
}: MateControlsProps) {
  const timerId = React.useId()
  const terminalLabel = outcome === undefined
    ? undefined
    : OUTCOME_LABELS[outcome]

  return (
    <div aria-label="Mate controls" className="leg-mate-controls" role="group">
      <div className="leg-mate-controls-actions">
        <button
          aria-keyshortcuts="Enter"
          onClick={onStartOver}
          type="button"
        >
          Start Over
        </button>
        <button
          aria-keyshortcuts="ArrowLeft"
          disabled={!canUndo}
          onClick={onUndo}
          type="button"
        >
          Undo
        </button>
        <button
          aria-keyshortcuts="ArrowRight"
          disabled={!canRedo}
          onClick={onRedo}
          type="button"
        >
          Redo
        </button>
        <button
          aria-keyshortcuts="ArrowUp"
          disabled={!canPlayBest || outcome !== undefined}
          onClick={onPlayBest}
          type="button"
        >
          Play Best
        </button>
      </div>

      <div className="leg-mate-controls-summary">
        <button
          aria-controls={timerId}
          aria-pressed={showTimer}
          onClick={onToggleTimer}
          type="button"
        >
          {showTimer ? 'Hide timer' : 'Show timer'}
        </button>
        <output
          aria-label="Elapsed time"
          className="leg-mate-timer"
          hidden={!showTimer}
          id={timerId}
        >
          <MateElapsedTimer
            finishedAtMs={finishedAtMs}
            now={timerNow}
            showTimer={showTimer}
            startedAtMs={startedAtMs}
          />
        </output>
        {terminalLabel === undefined ? null : (
          <>
            <span
              aria-atomic="true"
              aria-live="polite"
              className="leg-mate-terminal-status"
              role="status"
            >
              {terminalLabel}
            </span>
            <button onClick={onShare} type="button">
              Share
            </button>
          </>
        )}
        <span
          aria-label="Share status"
          aria-live="polite"
          className="leg-mate-share-status"
          role="status"
        >
          {shareStatus ?? ''}
        </span>
      </div>
    </div>
  )
}

const MateElapsedTimer = React.memo(function MateElapsedTimer({
  finishedAtMs,
  now,
  showTimer,
  startedAtMs,
}: {
  readonly finishedAtMs?: number
  readonly now: () => number
  readonly showTimer: boolean
  readonly startedAtMs: number
}) {
  const [clockNow, setClockNow] = React.useState(
    finishedAtMs ?? startedAtMs,
  )

  React.useEffect(() => {
    if (!showTimer) return

    if (finishedAtMs !== undefined) {
      setClockNow(finishedAtMs)
      return
    }

    setClockNow(now())
    const timer = setInterval(() => setClockNow(now()), 100)
    return () => clearInterval(timer)
  }, [finishedAtMs, now, showTimer, startedAtMs])

  const elapsedMs = Math.max(
    0,
    (finishedAtMs ?? clockNow) - startedAtMs,
  )
  return formatMateElapsed(elapsedMs)
})
