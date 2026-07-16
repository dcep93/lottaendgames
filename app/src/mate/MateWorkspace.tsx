import React from 'react'
import type { MateBoardProps } from './MateBoard'
import MateControls from './MateControls'
import MateLog from './MateLog'
import { MATE_CATALOG } from './catalog'
import { generateMatePosition } from './positions'
import {
  getMateRuleSet,
  type RegisteredMateRuleSet,
} from './rules'
import {
  createMateSession,
  getMateElapsedMs,
  playBestMateMove,
  playWhiteMove,
  redoMateMove,
  replaceHistoricalBlackMove,
  replaceHistoricalWhiteMove,
  startOverMateSession,
  undoMateMove,
  type MateSession,
  type MateSessionDeps,
} from './session'
import { formatMateShareText } from './share'
import type { MateId, MateMode } from './types'
import {
  canAcceptWhiteMove,
  copyMateShareText,
  exactMateHref,
  getBlackReplyChoices,
  getCurrentPhase,
  getLastMateMove,
  hasPreferredWhiteMove,
  nextCycledMove,
  shouldIgnoreMateShortcut,
} from './workspaceSupport'

export type MateWorkspaceProps = {
  readonly BoardComponent: React.ComponentType<MateBoardProps>
  readonly mateId: MateId
  readonly mateMode: MateMode
  readonly sharedFen: string | null
}

const PRODUCTION_MATE_DEPS: MateSessionDeps = Object.freeze({
  now: () => Date.now(),
  random: () => Math.random(),
  generatePosition: generateMatePosition,
  getRuleSet: getMateRuleSet,
})

export default function MateWorkspace({
  BoardComponent,
  mateId,
  mateMode,
  sharedFen,
}: MateWorkspaceProps) {
  const deps = PRODUCTION_MATE_DEPS
  const ruleSet = React.useMemo(() => deps.getRuleSet(mateId), [deps, mateId])
  const [session, setSession] = React.useState(() =>
    createMateSession(
      {
        mateId,
        mode: mateMode,
        ...(sharedFen === null ? {} : { startingFen: sharedFen }),
      },
      deps,
    ),
  )
  const sessionRef = React.useRef(session)
  const mountedRef = React.useRef(false)
  const [clockNow, setClockNow] = React.useState(session.startedAtMs)
  const [showTimer, setShowTimer] = React.useState(true)
  const [shareStatus, setShareStatus] = React.useState('')
  sessionRef.current = session

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    if (session.finishedAtMs !== undefined) return
    const timer = setInterval(() => setClockNow(deps.now()), 100)
    return () => clearInterval(timer)
  }, [deps, session.finishedAtMs, session.startedAtMs])

  const commit = React.useCallback(
    (transition: (current: MateSession) => MateSession) => {
      const current = sessionRef.current
      let next: MateSession
      try {
        next = transition(current)
      } catch {
        return false
      }
      if (next === current) return false

      sessionRef.current = next
      setSession(next)
      setClockNow(deps.now())
      setShareStatus('')
      return true
    },
    [deps],
  )

  const startOver = React.useCallback(
    () => commit((current) => startOverMateSession(current, deps)),
    [commit, deps],
  )
  const undo = React.useCallback(
    () => commit(undoMateMove),
    [commit],
  )
  const redo = React.useCallback(
    () => commit(redoMateMove),
    [commit],
  )
  const playBest = React.useCallback(
    () => commit((current) => playBestMateMove(current, deps)),
    [commit, deps],
  )
  const playMove = React.useCallback(
    (san: string) =>
      commit((current) => playWhiteMove(current, san, deps)),
    [commit, deps],
  )
  const cycleIdealWhite = React.useCallback(
    (logIndex: number) =>
      commit((current) => {
        const log = current.logs[logIndex]
        if (log === undefined) return current
        const san = nextCycledMove(
          ruleSet.idealWhiteMoves(log.fen),
          log.san,
        )
        return san === undefined
          ? current
          : replaceHistoricalWhiteMove(
              current,
              logIndex,
              san,
              deps,
            )
      }),
    [commit, deps, ruleSet],
  )
  const cycleIdealBlack = React.useCallback(
    (logIndex: number) =>
      cycleBlackReply(
        logIndex,
        ruleSet,
        deps,
        commit,
        true,
      ),
    [commit, deps, ruleSet],
  )
  const cycleLegalBlack = React.useCallback(
    (logIndex: number) =>
      cycleBlackReply(
        logIndex,
        ruleSet,
        deps,
        commit,
        false,
      ),
    [commit, deps, ruleSet],
  )

  React.useEffect(() => {
    if (typeof document === 'undefined') return

    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        shouldIgnoreMateShortcut(event.target)
      ) {
        return
      }

      let executed = false
      if (event.key === 'ArrowUp') executed = playBest()
      if (event.key === 'ArrowLeft') executed = undo()
      if (event.key === 'ArrowRight') executed = redo()
      if (event.key === 'Enter') executed = startOver()

      if (executed) event.preventDefault()
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [playBest, redo, startOver, undo])

  const lastMove = React.useMemo(
    () => getLastMateMove(session.logs),
    [session.logs],
  )
  const phase = React.useMemo(
    () => getCurrentPhase(ruleSet, session),
    [ruleSet, session],
  )
  const boardDisabled = React.useMemo(
    () => !canAcceptWhiteMove(session),
    [session],
  )
  const canPlayBest = React.useMemo(
    () =>
      !boardDisabled && hasPreferredWhiteMove(ruleSet, session.fen),
    [boardDisabled, ruleSet, session.fen],
  )
  const catalogEntry = MATE_CATALOG.find(({ id }) => id === mateId)
  const modeLabel = mateMode === 'train' ? 'Train' : 'Standard'

  const share = React.useCallback(async () => {
    const current = sessionRef.current
    if (current.outcome === undefined) return

    const text = formatMateShareText({
      outcome: current.outcome,
      elapsedMs: getMateElapsedMs(current, deps.now()),
      href: exactMateHref(
        current.mateId,
        current.mode,
        current.startingFen,
      ),
    })
    const copied = await copyMateShareText(text)
    if (mountedRef.current) {
      setShareStatus(copied ? 'Copied' : 'Copy unavailable')
    }
  }, [deps])

  return (
    <section
      aria-label={`${catalogEntry?.label ?? mateId} ${modeLabel} training`}
      className="leg-mate-workspace"
    >
      <header className="leg-mate-workspace-header">
        <h2>{catalogEntry?.label ?? mateId}</h2>
        <p>{modeLabel}</p>
      </header>

      <div className="leg-mate-board-column">
        <BoardComponent
          disabled={boardDisabled}
          fen={session.fen}
          lastMove={lastMove}
          onMove={playMove}
          phase={phase}
        />
        <MateControls
          canPlayBest={canPlayBest}
          canRedo={session.historyIndex < session.history.length - 1}
          canUndo={session.historyIndex > 0}
          elapsedMs={getMateElapsedMs(session, clockNow)}
          onPlayBest={playBest}
          onRedo={redo}
          onShare={() => void share()}
          onStartOver={startOver}
          onToggleTimer={() => setShowTimer((visible) => !visible)}
          onUndo={undo}
          outcome={session.outcome}
          shareStatus={shareStatus}
          showTimer={showTimer}
        />
        <aside className="leg-mate-starting-position">
          <h3>Starting FEN</h3>
          <code>{session.startingFen}</code>
        </aside>
      </div>

      <MateLog
        fen={session.fen}
        logs={session.logs}
        onCycleIdealBlack={cycleIdealBlack}
        onCycleIdealWhite={cycleIdealWhite}
        onCycleLegalBlack={cycleLegalBlack}
        ruleSet={ruleSet}
      />
    </section>
  )
}

function cycleBlackReply(
  logIndex: number,
  ruleSet: RegisteredMateRuleSet,
  deps: MateSessionDeps,
  commit: (transition: (current: MateSession) => MateSession) => boolean,
  idealOnly: boolean,
): boolean {
  return commit((current) => {
    const log = current.logs[logIndex]
    const choices = getBlackReplyChoices(
      current,
      logIndex,
      ruleSet,
      idealOnly,
    )
    if (log === undefined || choices === undefined) return current
    const san = nextCycledMove(choices, log.opponentSan)
    return san === undefined
      ? current
      : replaceHistoricalBlackMove(current, logIndex, san, deps)
  })
}
