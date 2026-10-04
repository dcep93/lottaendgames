import { getTwoKnightsPawnBoardOutcome, getTwoKnightsPawnPermittedMoves } from './rules/twoKnightsPawnMoves'
import React from 'react'
import { trackEvent } from '../analytics'
import MateOptions from './MateOptions'
import { getChess } from './chess'
import MatePriorityGuideDialog from './MatePriorityGuide'
import type { RegisteredMateRuleSet } from './rules'
import type { MateLogEntry } from './session'
import type { MateMode } from './types'
import { copyMateShareText } from './workspaceSupport'

export { default as MatePriorityGuideDialog } from './MatePriorityGuide'

export type MateLogProps = {
  readonly controls?: (secondaryActions: React.ReactNode) => React.ReactNode
  readonly timerControls?: React.ReactNode
  readonly showTimer?: boolean
  readonly modeSelector?: React.ReactNode
  readonly result?: React.ReactNode
  readonly fen: string
  readonly logs: readonly MateLogEntry[]
  readonly mateMode: MateMode
  readonly startingFen: string
  readonly ruleSet: RegisteredMateRuleSet
  readonly onCycleIdealWhite: (logIndex: number) => void
  readonly onCycleIdealBlack: (logIndex: number) => void
  readonly onCycleLegalBlack: (logIndex: number) => void
}

type GuideOpener = HTMLElement | null

const NO_PREFERRED_RULE_LABEL = 'No preferred rule identified'

function choiceLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function formatMateMoveDuration(durationMs: number): string {
  const safeMs = Number.isFinite(durationMs)
    ? Math.max(0, Math.floor(durationMs))
    : 0
  const minutes = Math.floor(safeMs / 60_000)
  const seconds = Math.floor((safeMs % 60_000) / 1_000)
  const milliseconds = safeMs % 1_000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}

function statusCellClass(status: 'multiple' | 'neutral' | 'wrong'): string {
  return [
    'leg-mate-log-status-cell',
    status === 'neutral' ? '' : `leg-mate-log-status-cell--${status}`,
  ]
    .filter(Boolean)
    .join(' ')
}

function currentRuleHint(
  ruleSet: RegisteredMateRuleSet,
  fen: string,
) {
  try {
    return ruleSet.currentWhiteHint(fen)
  } catch {
    return undefined
  }
}

function isSelectedBlackReplyIdeal(
  ruleSet: RegisteredMateRuleSet,
  logs: readonly MateLogEntry[],
  logIndex: number,
): boolean {
  const log = logs[logIndex]
  if (log?.opponentSan === undefined) return false

  try {
    const chess = getChess(log.fen)
    if (chess.move(log.san) === null) return false

    return ruleSet
      .blackCandidates(chess.fen(), logs[logIndex - 1]?.fen, log.fen)
      .idealMoves.includes(log.opponentSan)
  } catch {
    return false
  }
}

export default function MateLog({
  controls,
  timerControls,
  showTimer = true,
  modeSelector,
  result,
  fen,
  logs,
  mateMode,
  startingFen,
  ruleSet,
  onCycleIdealWhite,
  onCycleIdealBlack,
  onCycleLegalBlack,
}: MateLogProps) {
  const [showReasonHints, setShowReasonHints] = React.useState(false)
  const [guideOpen, setGuideOpen] = React.useState(false)
  const previousGuideOpen = React.useRef(false)
  React.useEffect(() => {
    if (guideOpen && !previousGuideOpen.current) trackEvent('training_info_opened', { mating_set: ruleSet.id })
    previousGuideOpen.current = guideOpen
  }, [guideOpen, ruleSet.id])
  const [copyStatus, setCopyStatus] = React.useState<{ message: string } | null>(null)
  React.useEffect(() => setCopyStatus(null), [startingFen, logs])
  React.useEffect(() => {
    if (copyStatus === null) return
    const timer = setTimeout(() => setCopyStatus(null), 2_000)
    return () => clearTimeout(timer)
  }, [copyStatus])
  const [guideOpener, setGuideOpener] = React.useState<GuideOpener>(null)
  const [highlightedReasonId, setHighlightedReasonId] = React.useState<
    string | null
  >(null)
  const descriptionsById = React.useMemo(
    () =>
      new Map(
        ruleSet.whiteRuleDescriptions.map((description) => [
          description.id,
          description,
        ]),
      ),
    [ruleSet],
  )
  const hint = React.useMemo(
    () =>
      showReasonHints ? currentRuleHint(ruleSet, fen) : undefined,
    [fen, ruleSet, showReasonHints],
  )
  const displayedLogs = logs
    .map((log, index) => ({ index, log }))
    .reverse()
  const openGuide = React.useCallback(
    (
      event: React.MouseEvent<HTMLElement>,
      reasonId: string | null = null,
    ) => {
      setGuideOpener(event.detail > 0 ? null : event.currentTarget)
      setHighlightedReasonId(reasonId)
      setGuideOpen(true)
    },
    [],
  )
  const closeGuide = React.useCallback(() => setGuideOpen(false), [])
  React.useEffect(() => {
    if (guideOpen || typeof document === 'undefined') return

    const openOnEscape = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' || event.repeat || event.defaultPrevented ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
      ) return
      const target = event.target as HTMLElement | null
      if (target?.closest?.('[role="dialog"]')) return

      event.preventDefault()
      const activeElement = document.activeElement as HTMLElement | null
      setGuideOpener(typeof activeElement?.focus === 'function' ? activeElement : null)
      setHighlightedReasonId(null)
      setGuideOpen(true)
    }

    document.addEventListener('keydown', openOnEscape)
    return () => document.removeEventListener('keydown', openOnEscape)
  }, [guideOpen])
  const copyPgn = async () => {
    setCopyStatus(null)
    try {
      const chess = getChess(startingFen)
      if (ruleSet.id === 'two-knights-pawn' && chess.turn() === 'b') {
        const afterInitialReply = logs[0]?.fen ?? fen
        const initialReply = getTwoKnightsPawnPermittedMoves(startingFen).find(move => move.after === afterInitialReply)
        if (initialReply) chess.move(initialReply.san)
      }
      for (const log of logs) {
        chess.move(log.san)
        if (log.opponentSan !== undefined) chess.move(log.opponentSan)
      }
      const customOutcome = ruleSet.id === 'two-knights-pawn' ? getTwoKnightsPawnBoardOutcome(chess.fen()) : undefined
      chess.setHeader('Result', customOutcome !== undefined
        ? customOutcome === 'checkmate' ? '1-0' : customOutcome === 'white-checkmate' ? '0-1' : customOutcome === 'stalemate' ? '1/2-1/2' : '*'
        : chess.isCheckmate()
        ? (chess.turn() === 'b' ? '1-0' : '0-1')
        : chess.isDraw() ? '1/2-1/2' : '*')
      const pgn = chess.pgn().split('\n')
        .filter((line) => !line.startsWith('[') || line.startsWith('[FEN '))
        .join('\n').trim()
      setCopyStatus({ message: await copyMateShareText(pgn) ? 'PGN copied' : 'Could not copy PGN' })
    } catch {
      setCopyStatus({ message: 'Could not copy PGN' })
    }
  }

  const secondaryActions = (
    <>
      <button
        aria-label="Copy PGN to clipboard"
        className="leg-mate-training-info-button"
        onClick={() => void copyPgn()}
        type="button"
      >
        {copyStatus?.message ?? 'Copy PGN'}
      </button>
      <button
        aria-keyshortcuts="Escape"
        aria-label="Open training info and priority guide"
        className="leg-mate-training-info-button"
        onClick={openGuide}
        type="button"
      >
        Training Info
      </button>
      <span className="leg-mate-visually-hidden" role="status">{copyStatus?.message}</span>
    </>
  )

  return (
    <>
      <MateOptions
        controls={controls ? controls(secondaryActions) : secondaryActions}
        modeSelector={modeSelector}
        result={result}
      >
        <div className="leg-mate-timer-controls">{timerControls}</div>
        <div className="leg-mate-log-primary-tools">
          {hint === undefined ? null : (
            <button
              aria-label={`Current rule hint: ${hint.shortLabel}. Open priority guide`}
              className="leg-mate-current-hint"
              data-mate-current-hint={true}
              onClick={(event) => openGuide(event, hint.id)}
              type="button"
            >
              {hint.shortLabel}
            </button>
          )}
          <label className="leg-mate-hint-toggle">
            <input
              aria-label="Show reason hints"
              checked={showReasonHints}
              onChange={(event) => {
                setShowReasonHints(event.currentTarget.checked)
                if (event.currentTarget.checked) trackEvent('reason_hints_enabled', { mating_set: ruleSet.id })
              }}
              type="checkbox"
            />
            <span>Show reason hints</span>
          </label>
        </div>
      </MateOptions>

      <section aria-label="Mate move log" className="leg-mate-log">
        <div
          aria-label="Mate move log table"
          className="leg-mate-log-scroll"
          role="region"
          tabIndex={0}
        >
          <table aria-label="Mate move log" className="leg-mate-log-table">
            <caption className="leg-mate-visually-hidden">Mate move log</caption>
            <colgroup>
              <col className="leg-mate-log-number-column" />
              <col className="leg-mate-log-intrinsic-column" />
              <col className="leg-mate-log-intrinsic-column" />
              <col className="leg-mate-log-intrinsic-column" />
              <col className="leg-mate-log-intrinsic-column" />
              <col className="leg-mate-log-intrinsic-column" />
              {showTimer ? <col className="leg-mate-log-intrinsic-column" /> : null}
              <col className="leg-mate-log-flexible-column" />
            </colgroup>
            <thead className="leg-mate-visually-hidden">
              <tr>
                <th scope="col">#</th>
                <th scope="col">{ruleSet.id === 'two-knights-pawn' ? 'Tablebase' : 'Phase'}</th>
                <th scope="col">White</th>
                <th scope="col">Black</th>
                <th scope="col">Correctness</th>
                <th scope="col">Black replies</th>
                {showTimer ? <th scope="col">Duration</th> : null}
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {displayedLogs.map(({ index, log }) => {
                const moveNumber = index + 1
                const correctChoices = Math.max(0, log.correctChoices)
                const idealBlackChoices = Math.max(
                  0,
                  log.idealOpponentChoices ?? 0,
                )
                const legalBlackChoices = Math.max(
                  0,
                  log.legalOpponentChoices ?? 0,
                )
                const reason = descriptionsById.get(log.reasonId)
                const reasonLabel =
                  log.reasonLabel ??
                  reason?.shortLabel ??
                  NO_PREFERRED_RULE_LABEL
                const correctChoiceText = choiceLabel(
                  correctChoices,
                  'correct choice',
                  'correct choices',
                )
                const idealBlackChoiceText = choiceLabel(
                  idealBlackChoices,
                  'ideal reply',
                  'ideal replies',
                )
                const legalBlackChoiceText = choiceLabel(
                  legalBlackChoices,
                  'legal reply',
                  'legal replies',
                )
                const unscoredCustomMove = ruleSet.id === 'two-knights-pawn' && correctChoices === 0
                const correctnessStatus = unscoredCustomMove ? 'neutral' : !log.isCorrect
                  ? 'wrong'
                  : correctChoices > 1
                    ? 'multiple'
                    : 'neutral'
                const replyStatus =
                  idealBlackChoices > 1 ? 'multiple' : 'neutral'
                const hasBlackReply = log.opponentSan !== undefined
                const selectedBlackReplyIsIdeal =
                  idealBlackChoices === 1 &&
                  isSelectedBlackReplyIdeal(ruleSet, logs, index)

                return (
                  <tr key={`${index}-${log.fen}`}>
                    <th scope="row">{moveNumber}.</th>
                    <td className="leg-mate-log-plain-text">{log.phase}</td>
                    <td className="leg-mate-log-plain-text">{log.san}</td>
                    <td className="leg-mate-log-plain-text">
                      {log.opponentSan ?? ''}
                    </td>
                    <td className={statusCellClass(correctnessStatus)}>
                      <span className="leg-mate-log-correctness">
                        <span
                          aria-label={unscoredCustomMove ? 'No forced mate recommendation' : log.isCorrect ? 'Correct' : 'Incorrect'}
                          className="leg-mate-log-correctness-mark"
                          role="img"
                        >
                          {unscoredCustomMove ? '—' : log.isCorrect ? '✓' : '×'}
                        </span>
                        {correctChoices === 0 ? null : (
                          <button
                            aria-label={`Cycle ideal White move for move ${moveNumber}; ${correctChoiceText}`}
                            className="leg-mate-log-choice-button"
                            disabled={
                              log.isCorrect && correctChoices === 1
                            }
                            onClick={() => onCycleIdealWhite(index)}
                            type="button"
                          >
                            {correctChoices}
                          </button>
                        )}
                      </span>
                    </td>
                    <td
                      className={`leg-mate-log-replies ${statusCellClass(replyStatus)}`}
                    >
                      {hasBlackReply ? (
                        <>
                          <button
                            aria-label={`Cycle ideal Black reply for move ${moveNumber}; ${idealBlackChoiceText}`}
                            className="leg-mate-log-choice-button"
                            disabled={
                              idealBlackChoices === 0 ||
                              selectedBlackReplyIsIdeal
                            }
                            onClick={() => onCycleIdealBlack(index)}
                            type="button"
                          >
                            {idealBlackChoices}
                          </button>
                          <span aria-hidden="true">/</span>
                          <button
                            aria-label={`Cycle any legal Black reply for move ${moveNumber}; ${legalBlackChoiceText}`}
                            className="leg-mate-log-choice-button"
                            disabled={legalBlackChoices <= 1}
                            onClick={() => onCycleLegalBlack(index)}
                            type="button"
                          >
                            {legalBlackChoices}
                          </button>
                        </>
                      ) : null}
                    </td>
                    {showTimer ? (
                      <td className="leg-mate-log-plain-text">
                        {formatMateMoveDuration(log.durationMs)}
                      </td>
                    ) : null}
                    <td>
                      <button
                        aria-label={`${reasonLabel}. Open priority guide`}
                        className="leg-mate-log-reason-button"
                        onClick={(event) => openGuide(event, reason?.id ?? null)}
                        type="button"
                      >
                        {reasonLabel}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {guideOpen ? (
        <MatePriorityGuideDialog
          highlightedReasonId={highlightedReasonId}
          mateMode={mateMode}
          onClose={closeGuide}
          returnFocusTo={guideOpener}
          ruleSet={ruleSet}
        />
      ) : null}
    </>
  )
}
