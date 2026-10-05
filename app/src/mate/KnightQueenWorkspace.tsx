import React from 'react'
import { trackEvent } from '../analytics'
import type { MateBoardProps } from './MateBoard'
import MateControls, { MateTimerControls } from './MateControls'
import MateOptions from './MateOptions'
import KnightQueenGuide from './KnightQueenGuide'
import {
  createKnightQueenSession, knightQueenBestMoves, knightQueenBoardInteraction,
  knightQueenFen, knightQueenTarget, KNIGHT_QUEEN_ROUTE,
  playKnightQueenMove, seekKnightQueenSession, type KnightQueenSession,
} from './knightQueen'
import { readMateTimerPreference, writeMateTimerPreference } from './timerPreference'
import { releasePointerButtonFocus, shouldIgnoreMateShortcut } from './workspaceSupport'

export default function KnightQueenWorkspace({ BoardComponent }: {
  readonly BoardComponent: React.ComponentType<MateBoardProps>
}) {
  const [session, setSession] = React.useState(createKnightQueenSession)
  const sessionRef = React.useRef(session)
  const counted = React.useRef({ started: false, completed: false, assisted: false })
  const [showTimer, setShowTimer] = React.useState(readMateTimerPreference)
  const [guideOpen, setGuideOpen] = React.useState(false)
  const current = session.history[session.cursor]!
  const target = knightQueenTarget(current)
  const completed = target === null
  const commit = React.useCallback((next: KnightQueenSession) => {
    if (next === sessionRef.current) return false
    sessionRef.current = next
    setSession(next)
    return true
  }, [])
  const play = React.useCallback((san: string, assisted = false) => {
    const previous = sessionRef.current
    const next = playKnightQueenMove(previous, san, Date.now())
    if (!commit(next)) return false
    counted.current.assisted ||= assisted
    if (!counted.current.started) {
      counted.current.started = true
      trackEvent('exercise_started', { exercise: 'knight-queen' })
    }
    const snapshot = next.history[next.cursor]!
    if (knightQueenTarget(snapshot) === null && !counted.current.completed) {
      counted.current.completed = true
      trackEvent('exercise_completed', {
        exercise: 'knight-queen', moves: next.cursor,
        duration_seconds: Math.max(0, (snapshot.movedAtMs! - next.startedAtMs!) / 1000),
        used_play_best: counted.current.assisted,
      })
    }
    return true
  }, [commit])
  const best = React.useCallback(() => {
    const state = sessionRef.current
    const position = state.history[state.cursor]!
    const move = knightQueenBestMoves(position.knight, knightQueenTarget(position))[0]
    return move ? play(`N${move}`, true) : false
  }, [play])
  const undo = React.useCallback(() => commit(seekKnightQueenSession(sessionRef.current, -1)), [commit])
  const redo = React.useCallback(() => commit(seekKnightQueenSession(sessionRef.current, 1)), [commit])
  const restart = React.useCallback(() => {
    counted.current = { started: false, completed: false, assisted: false }
    return commit(createKnightQueenSession())
  }, [commit])
  const openGuide = React.useCallback(() => {
    trackEvent('training_info_opened', { mating_set: 'knight-queen' })
    setGuideOpen(true)
  }, [])
  const closeGuide = React.useCallback(() => setGuideOpen(false), [])
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || guideOpen) return
      if (event.key === 'Escape') { event.preventDefault(); openGuide(); return }
      if (shouldIgnoreMateShortcut(event.target)) return
      const actions: Record<string, () => boolean> = { ArrowUp: best, ArrowLeft: undo, ArrowRight: redo, Enter: restart }
      if (actions[event.key]?.()) event.preventDefault()
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [best, undo, redo, restart, guideOpen, openGuide])
  const toggleTimer = () => {
    setShowTimer(!showTimer)
    writeMateTimerPreference(!showTimer)
  }
  return (
    <section aria-label="B. F. Knight exercise" className="leg-mate-workspace"
      onClick={event => releasePointerButtonFocus(event.detail, event.target)}>
      <div className="leg-mate-board-column">
        <BoardComponent
          disabled={completed}
          fen={knightQueenFen(current.knight)}
          interaction={knightQueenBoardInteraction}
          lastMove={session.cursor ? [session.history[session.cursor - 1]!.knight, current.knight] : null}
          onMove={play}
          phase=""
          targetSquare={target}
        />
      </div>
      <div className="leg-mate-log-column">
        <MateOptions
          result={<div className="leg-knight-queen-progress" role="status" aria-live="polite">
            <strong>{completed ? 'Route complete' : `Next target: ${target}`}</strong>
            <span>{current.nextTargetIndex}/{KNIGHT_QUEEN_ROUTE.length} squares</span>
          </div>}
          controls={<MateControls
            canPlayBest={!completed} canRedo={session.cursor < session.history.length - 1} canUndo={session.cursor > 0}
            onPlayBest={best} onRedo={redo} onStartOver={restart} onUndo={undo}
            onShare={() => undefined} onToggleTimer={toggleTimer} showTimer={showTimer} result={null}
            secondaryActions={<button onClick={openGuide} aria-keyshortcuts="Escape" type="button">Training Info</button>}
          />}
        >
          <div className="leg-mate-timer-controls">
            <MateTimerControls showTimer={showTimer} startedAtMs={session.startedAtMs}
              finishedAtMs={completed ? current.movedAtMs : undefined} onToggleTimer={toggleTimer} />
          </div>
        </MateOptions>
        <section aria-label="Knight move log" className="leg-mate-log">
          <div className="leg-mate-log-scroll" role="region" aria-label="Knight move history" tabIndex={0}>
            <table className="leg-mate-log-table leg-knight-queen-table">
              <thead><tr><th scope="col">#</th><th scope="col">Move</th><th scope="col">Target</th>{showTimer && <th scope="col">Time</th>}</tr></thead>
              <tbody>
                {session.history.slice(1, session.cursor + 1).map((snapshot, index) => ({ snapshot, index })).reverse().map(({ snapshot, index }) => {
                  const before = session.history[index]!
                  const reached = snapshot.nextTargetIndex > before.nextTargetIndex
                  return <tr key={index}>
                    <th scope="row">{index + 1}.</th>
                    <td>N{snapshot.knight}</td>
                    <td>{knightQueenTarget(before)}{reached && <span aria-label="Target reached"> ✓</span>}</td>
                    {showTimer && <td>{(snapshot.durationMs / 1000).toFixed(2)}s</td>}
                  </tr>
                })}
                {session.cursor === 0 && <tr><td colSpan={showTimer ? 4 : 3}>Move the knight to begin.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {guideOpen && <KnightQueenGuide onClose={closeGuide} />}
    </section>
  )
}
