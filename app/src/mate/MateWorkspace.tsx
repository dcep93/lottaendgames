import React from 'react'
import type { MateBoardProps } from './MateBoard'
import MateControls from './MateControls'
import MateLog from './MateLog'
import { MATE_MOVE_ANIMATION_MS } from './boardInteraction'
import { MATE_CATALOG } from './catalog'
import { getChess } from './chess'
import { generateMatePosition } from './positions'
import {
  getMateRuleSet,
  type RegisteredMateRuleSet,
} from './rules'
import {
  createMateSession,
  createMateReplaySession,
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
import {
  readMateTimerPreference,
  writeMateTimerPreference,
} from './timerPreference'
import type { MateId, MateMode } from './types'
import {
  canAcceptWhiteMove,
  copyMateShareText,
  exactMateHref,
  getBlackReplyChoices,
  getCurrentPhase,
  getLastMateMove,
  hasPreferredWhiteMove,
  liveMateHref,
  nextCycledMove,
  releasePointerButtonFocus,
  shouldIgnoreMateShortcut,
} from './workspaceSupport'

export type MateWorkspaceProps = {
  readonly BoardComponent: React.ComponentType<MateBoardProps>
  readonly mateId: MateId
  readonly mateMode: MateMode
  readonly sharedFen: string | null
  readonly sharedMoves: readonly string[] | null
  readonly onReplaceHref?: (href: string) => void
}

type PlayBestAnimation = {
  readonly nextSession: MateSession
  readonly sourceSession: MateSession
  readonly whiteFen: string
}

const PRODUCTION_MATE_DEPS: MateSessionDeps = Object.freeze({
  now: () => Date.now(),
  random: () => Math.random(),
  generatePosition: generateMatePosition,
  getRuleSet: getMateRuleSet,
})

export const MATE_SHARE_NOTIFICATION_MS = 2_000

export default function MateWorkspace({
  BoardComponent,
  mateId,
  mateMode,
  onReplaceHref,
  sharedFen,
  sharedMoves,
}: MateWorkspaceProps) {
  const deps = PRODUCTION_MATE_DEPS
  const ruleSet = React.useMemo(() => deps.getRuleSet(mateId), [deps, mateId])
  const [session, setSession] = React.useState(() => {
    if (sharedFen !== null && sharedMoves !== null) {
      try {
        return createMateReplaySession(
          {
            mateId,
            mode: mateMode,
            moves: sharedMoves,
            startingFen: sharedFen,
          },
          deps,
        )
      } catch {
        // A route-level replay was already validated. Preserve the exact start
        // if production evaluator invariants nevertheless reject reconstruction.
      }
    }
    return createMateSession(
      {
        mateId,
        mode: mateMode,
        ...(sharedFen === null ? {} : { startingFen: sharedFen }),
      },
      deps,
    )
  })
  const sessionRef = React.useRef(session)
  const playBestAnimationRef = React.useRef<PlayBestAnimation | null>(null)
  const playBestTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const mountedRef = React.useRef(false)
  const shareRequestRef = React.useRef(0)
  const [showTimer, setShowTimer] = React.useState(readMateTimerPreference)
  const [shareStatus, setShareStatus] = React.useState('')
  const [playBestAnimation, setPlayBestAnimation] =
    React.useState<PlayBestAnimation | null>(null)

  React.useLayoutEffect(() => {
    sessionRef.current = session
  }, [session])

  React.useEffect(() => {
    onReplaceHref?.(
      liveMateHref(session.mateId, session.mode, session.fen),
    )
  }, [onReplaceHref, session])

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      shareRequestRef.current += 1
      playBestAnimationRef.current = null
      if (playBestTimerRef.current !== null) {
        clearTimeout(playBestTimerRef.current)
        playBestTimerRef.current = null
      }
    }
  }, [])

  React.useEffect(() => {
    if (shareStatus === '') return
    const timer = setTimeout(
      () => setShareStatus(''),
      MATE_SHARE_NOTIFICATION_MS,
    )
    return () => clearTimeout(timer)
  }, [shareStatus])

  const commitSession = React.useCallback(
    (current: MateSession, next: MateSession) => {
      if (next === current) return false

      shareRequestRef.current += 1
      sessionRef.current = next
      setSession(next)
      setShareStatus('')
      return true
    },
    [],
  )

  const commit = React.useCallback(
    (transition: (current: MateSession) => MateSession) => {
      if (playBestAnimationRef.current !== null) return false
      const current = sessionRef.current
      let next: MateSession
      try {
        next = transition(current)
      } catch {
        return false
      }
      return commitSession(current, next)
    },
    [commitSession],
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
    () => {
      if (playBestAnimationRef.current !== null) return false
      const current = sessionRef.current
      let next: MateSession
      try {
        next = playBestMateMove(current, deps)
      } catch {
        return false
      }
      if (next === current) return false

      const whiteFen = playBestWhiteFen(current, next)
      if (whiteFen === null) return commitSession(current, next)

      const animation = {
        nextSession: next,
        sourceSession: current,
        whiteFen,
      }
      playBestAnimationRef.current = animation
      setPlayBestAnimation(animation)
      playBestTimerRef.current = setTimeout(() => {
        playBestTimerRef.current = null
        if (
          !mountedRef.current ||
          playBestAnimationRef.current !== animation ||
          sessionRef.current !== animation.sourceSession
        ) {
          return
        }
        playBestAnimationRef.current = null
        setPlayBestAnimation(null)
        commitSession(animation.sourceSession, animation.nextSession)
      }, MATE_MOVE_ANIMATION_MS)
      return true
    },
    [commitSession, deps],
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
    () => playBestAnimation !== null || !canAcceptWhiteMove(session),
    [playBestAnimation, session],
  )
  const canPlayBest = React.useMemo(
    () =>
      !boardDisabled && hasPreferredWhiteMove(ruleSet, session.fen),
    [boardDisabled, ruleSet, session.fen],
  )
  const catalogEntry = MATE_CATALOG.find(({ id }) => id === mateId)
  const modeLabel = mateMode === 'train' ? 'Training Wheels' : 'Standard'

  const share = React.useCallback(async () => {
    const current = sessionRef.current
    if (current.outcome === undefined) return
    const request = shareRequestRef.current + 1
    shareRequestRef.current = request
    setShareStatus('')

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
    if (
      mountedRef.current &&
      shareRequestRef.current === request &&
      sessionRef.current === current
    ) {
      setShareStatus(copied ? 'Copied' : 'Copy unavailable')
    }
  }, [deps])

  const toggleTimer = React.useCallback(() => {
    const nextShowTimer = !showTimer
    setShowTimer(nextShowTimer)
    writeMateTimerPreference(nextShowTimer)
  }, [showTimer])

  return (
    <section
      aria-label={`${catalogEntry?.label ?? mateId} ${modeLabel} training`}
      className="leg-mate-workspace"
      onClick={(event) =>
        releasePointerButtonFocus(event.detail, event.target)
      }
    >
      <div className="leg-mate-board-column">
        <BoardComponent
          complete={session.outcome !== undefined}
          disabled={boardDisabled}
          fen={playBestAnimation?.whiteFen ?? session.fen}
          lastMove={lastMove}
          onMove={playMove}
          phase={phase}
        />
      </div>

      <div className="leg-mate-log-column">
        <MateControls
          busy={playBestAnimation !== null}
          canPlayBest={canPlayBest}
          canRedo={session.historyIndex < session.history.length - 1}
          canUndo={session.historyIndex > 0}
          finishedAtMs={session.finishedAtMs}
          onPlayBest={playBest}
          onRedo={redo}
          onShare={() => void share()}
          onStartOver={startOver}
          onToggleTimer={toggleTimer}
          onUndo={undo}
          outcome={session.outcome}
          shareStatus={shareStatus}
          showTimer={showTimer}
          startedAtMs={session.startedAtMs}
          timerNow={deps.now}
        />
        <MateLog
          busy={playBestAnimation !== null}
          fen={session.fen}
          logs={session.logs}
          mateMode={mateMode}
          onCycleIdealBlack={cycleIdealBlack}
          onCycleIdealWhite={cycleIdealWhite}
          onCycleLegalBlack={cycleLegalBlack}
          ruleSet={ruleSet}
        />
      </div>
    </section>
  )
}

function playBestWhiteFen(
  current: MateSession,
  next: MateSession,
): string | null {
  const log = next.logs[current.logs.length]
  if (log === undefined || log.fen !== current.fen) return null

  try {
    const chess = getChess(current.fen)
    return chess.move(log.san) === null ? null : chess.fen()
  } catch {
    return null
  }
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
