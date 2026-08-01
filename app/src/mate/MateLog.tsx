import React from 'react'
import { getChess } from './chess'
import MatePriorityGuideDialog from './MatePriorityGuide'
import type { RegisteredMateRuleSet } from './rules'
import type { MateLogEntry } from './session'
import type { MateMode } from './types'

export { default as MatePriorityGuideDialog } from './MatePriorityGuide'

export type MateLogProps = {
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
      .blackCandidates(chess.fen(), logs[logIndex - 1]?.fen)
      .idealMoves.includes(log.opponentSan)
  } catch {
    return false
  }
}

export default function MateLog({
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

  return (
    <section aria-label="Mate move log" className="leg-mate-log">
      <div className="leg-mate-log-tools">
        <div className="leg-mate-log-primary-tools">
          <label className="leg-mate-hint-toggle">
            <input
              aria-label="Show reason hints"
              checked={showReasonHints}
              onChange={(event) =>
                setShowReasonHints(event.currentTarget.checked)
              }
              type="checkbox"
            />
            <span>Show reason hints</span>
          </label>
          <button
            aria-label="Open training info and priority guide"
            className="leg-mate-training-info-button"
            onClick={openGuide}
            type="button"
          >
            Training info
          </button>
        </div>
        <div className="leg-mate-starting-fen">
          <span className="leg-mate-starting-fen-label">Starting FEN</span>
          <span aria-label="Starting position FEN">{startingFen}</span>
        </div>
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
      </div>

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
            <col className="leg-mate-log-intrinsic-column" />
            <col className="leg-mate-log-flexible-column" />
          </colgroup>
          <thead className="leg-mate-visually-hidden">
            <tr>
              <th scope="col">#</th>
              <th scope="col">Phase</th>
              <th scope="col">White</th>
              <th scope="col">Black</th>
              <th scope="col">Correctness</th>
              <th scope="col">Black replies</th>
              <th scope="col">Duration</th>
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
                reason?.shortLabel ?? NO_PREFERRED_RULE_LABEL
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
              const correctnessStatus = !log.isCorrect
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
                        aria-label={log.isCorrect ? 'Correct' : 'Incorrect'}
                        className="leg-mate-log-correctness-mark"
                        role="img"
                      >
                        {log.isCorrect ? '✓' : '×'}
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
                  <td className="leg-mate-log-plain-text">
                    {formatMateMoveDuration(log.durationMs)}
                  </td>
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

      {guideOpen ? (
        <MatePriorityGuideDialog
          highlightedReasonId={highlightedReasonId}
          mateMode={mateMode}
          onClose={closeGuide}
          returnFocusTo={guideOpener}
          ruleSet={ruleSet}
        />
      ) : null}
    </section>
  )
}
