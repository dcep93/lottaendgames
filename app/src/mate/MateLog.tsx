import React from 'react'
import MatePriorityGuideDialog from './MatePriorityGuide'
import type { RegisteredMateRuleSet } from './rules'
import type { MateLogEntry } from './session'

export { default as MatePriorityGuideDialog } from './MatePriorityGuide'

export type MateLogProps = {
  readonly fen: string
  readonly logs: readonly MateLogEntry[]
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

function currentRuleHint(
  ruleSet: RegisteredMateRuleSet,
  fen: string,
) {
  try {
    if (ruleSet.whiteMoves(fen).length === 0) return undefined
    return ruleSet.currentWhiteHint(fen)
  } catch {
    return undefined
  }
}

export default function MateLog({
  fen,
  logs,
  ruleSet,
  onCycleIdealWhite,
  onCycleIdealBlack,
  onCycleLegalBlack,
}: MateLogProps) {
  const [showReasonHints, setShowReasonHints] = React.useState(false)
  const [guideOpen, setGuideOpen] = React.useState(false)
  const [guideOpener, setGuideOpener] = React.useState<GuideOpener>(null)
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
  const hint = showReasonHints ? currentRuleHint(ruleSet, fen) : undefined
  const displayedLogs = logs
    .map((log, index) => ({ index, log }))
    .reverse()
  const openGuide = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setGuideOpener(event.currentTarget)
      setGuideOpen(true)
    },
    [],
  )
  const closeGuide = React.useCallback(() => setGuideOpen(false), [])

  return (
    <section aria-label="Mate move log" className="leg-mate-log">
      <div className="leg-mate-log-tools">
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
        {hint === undefined ? null : (
          <button
            aria-label={`Current rule hint: ${hint.shortLabel}. Open priority guide`}
            className="leg-mate-current-hint"
            data-mate-current-hint={true}
            onClick={openGuide}
            type="button"
          >
            {hint.shortLabel}
          </button>
        )}
      </div>

      <div className="leg-mate-log-scroll">
        <table className="leg-mate-log-table">
          <caption className="leg-visually-hidden">Mate move log</caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Phase</th>
              <th scope="col">White move</th>
              <th scope="col">Black move</th>
              <th scope="col">Ideal Black replies</th>
              <th scope="col">Legal Black replies</th>
              <th scope="col">Correctness</th>
              <th scope="col">Duration</th>
              <th scope="col">
                <button
                  aria-label="Open Mate priority guide"
                  className="leg-mate-log-guide-button"
                  onClick={openGuide}
                  type="button"
                >
                  Reason
                </button>
              </th>
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

              return (
                <tr key={`${index}-${log.fen}-${log.san}-${log.opponentSan ?? ''}`}>
                  <th scope="row">{moveNumber}.</th>
                  <td>{log.phase}</td>
                  <td>{log.san}</td>
                  <td>{log.opponentSan ?? ''}</td>
                  <td>
                    <button
                      aria-label={`Cycle ideal Black reply for move ${moveNumber}; ${idealBlackChoiceText}`}
                      className="leg-mate-log-choice-button"
                      disabled={idealBlackChoices === 0}
                      onClick={() => onCycleIdealBlack(index)}
                      type="button"
                    >
                      {idealBlackChoices}
                    </button>
                  </td>
                  <td>
                    <button
                      aria-label={`Cycle any legal Black reply for move ${moveNumber}; ${legalBlackChoiceText}`}
                      className="leg-mate-log-choice-button"
                      disabled={legalBlackChoices <= 1}
                      onClick={() => onCycleLegalBlack(index)}
                      type="button"
                    >
                      {legalBlackChoices}
                    </button>
                  </td>
                  <td>
                    <span className="leg-mate-log-correctness">
                      <span aria-hidden="true">
                        {log.isCorrect ? '✓' : '✗'}
                      </span>{' '}
                      <span>{log.isCorrect ? 'Correct' : 'Incorrect'}</span>
                    </span>{' '}
                    <button
                      aria-label={`Cycle ideal White move for move ${moveNumber}; ${correctChoiceText}`}
                      className="leg-mate-log-choice-button"
                      disabled={
                        correctChoices === 0 ||
                        (log.isCorrect && correctChoices === 1)
                      }
                      onClick={() => onCycleIdealWhite(index)}
                      type="button"
                    >
                      {correctChoiceText}
                    </button>
                  </td>
                  <td>{formatMateMoveDuration(log.durationMs)}</td>
                  <td>
                    <button
                      aria-label={`${reasonLabel}. Open priority guide`}
                      className="leg-mate-log-reason-button"
                      onClick={openGuide}
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
          onClose={closeGuide}
          returnFocusTo={guideOpener}
          ruleSet={ruleSet}
        />
      ) : null}
    </section>
  )
}
