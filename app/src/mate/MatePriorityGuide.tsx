import React from 'react'
import { MATE_CATALOG } from './catalog'
import type { RegisteredMateRuleSet } from './rules'
import MateRuleNoteBoard from './MateRuleNoteBoard'
import type { MateMode } from './types'

export type MatePriorityGuideDialogProps = {
  readonly copyStartingUrlStatus: string
  readonly highlightedReasonId?: string | null
  readonly mateMode: MateMode
  readonly onCopyStartingUrl: () => void
  readonly ruleSet: RegisteredMateRuleSet
  readonly startingFen: string
  readonly onClose: () => void
  readonly returnFocusTo?: HTMLElement | null
}

function isFocusable(element: HTMLElement): boolean {
  return (
    !element.hasAttribute('disabled') &&
    element.getAttribute('aria-hidden') !== 'true' &&
    element.tabIndex >= 0
  )
}

export default function MatePriorityGuideDialog({
  copyStartingUrlStatus,
  highlightedReasonId = null,
  onCopyStartingUrl,
  ruleSet,
  startingFen,
  onClose,
  returnFocusTo,
}: MatePriorityGuideDialogProps) {
  const titleId = React.useId()
  const dialogRef = React.useRef<HTMLElement>(null)
  const closeButtonRef = React.useRef<HTMLButtonElement>(null)
  const endgameLabel =
    MATE_CATALOG.find(({ id }) => id === ruleSet.id)?.label ?? ruleSet.id
  const universalWhitePriorities = ruleSet.whiteRuleDescriptions.slice(0, 3)
  const techniqueWhitePriorities = ruleSet.whiteRuleDescriptions.slice(3)

  React.useEffect(() => {
    closeButtonRef.current?.focus()
    const restoreFocus = () => returnFocusTo?.focus()
    if (typeof document === 'undefined') return restoreFocus

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog || typeof dialog.querySelectorAll !== 'function') return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]',
        ),
      ).filter(isFocusable)
      if (focusable.length === 0) {
        event.preventDefault()
        closeButtonRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onDocumentKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown, true)
      restoreFocus()
    }
  }, [onClose, returnFocusTo])

  return (
    <div
      className="leg-mate-guide-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="leg-mate-guide"
        ref={dialogRef}
        role="dialog"
      >
        <header className="leg-mate-guide-header">
          <h2 id={titleId}>{endgameLabel}: checkmate</h2>
          <button
            aria-label="Close priority guide"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="leg-mate-guide-body">
          <div className="leg-mate-guide-priorities">
            <section className="leg-mate-guide-section">
              <h3>White best moves</h3>
              <div className="leg-mate-guide-universal-priorities">
                <PriorityList
                  highlightedReasonId={highlightedReasonId}
                  priorities={universalWhitePriorities}
                />
              </div>
              {techniqueWhitePriorities.length === 0 ? null : (
                <div className="leg-mate-guide-technique-priorities">
                  <PriorityList
                    highlightedReasonId={highlightedReasonId}
                    priorities={techniqueWhitePriorities}
                    start={4}
                  />
                </div>
              )}
            </section>

            <section className="leg-mate-guide-section">
              <h3>Black resistance</h3>
              <p>{ruleSet.help.blackIntro}</p>
              <ol>
                {ruleSet.help.blackPriorities.map((priority, index) => (
                  <li key={`${index}-${priority}`}>{priority}</li>
                ))}
              </ol>
            </section>
          </div>

          <div className="leg-mate-guide-supporting">
            <section className="leg-mate-guide-section">
              <h3>Keyboard shortcuts</h3>
              <dl className="leg-mate-guide-shortcuts">
                <div>
                  <dt><kbd>Enter</kbd></dt>
                  <dd>Start over</dd>
                </div>
                <div>
                  <dt><kbd>←</kbd></dt>
                  <dd>Undo</dd>
                </div>
                <div>
                  <dt><kbd>↑</kbd></dt>
                  <dd>Play best move</dd>
                </div>
                <div>
                  <dt><kbd>→</kbd></dt>
                  <dd>Redo</dd>
                </div>
              </dl>
            </section>

            <section className="leg-mate-guide-section">
              <h3>Starting position</h3>
              <code className="leg-mate-guide-fen">{startingFen}</code>
              <div className="leg-mate-guide-copy-row">
                <button
                  aria-label="Copy game URL"
                  onClick={onCopyStartingUrl}
                  type="button"
                >
                  Copy game URL
                </button>
              </div>
              <span
                aria-atomic="true"
                aria-label="Game URL copy status"
                aria-live="polite"
                className="leg-mate-guide-copy-status"
                role="status"
              >
                {copyStartingUrlStatus}
              </span>
            </section>
          </div>

          {ruleSet.help.notes.length === 0 &&
          ruleSet.help.noteBoards.length === 0 ? null : (
            <section className="leg-mate-guide-section">
              <h3>Notes</h3>
              {ruleSet.help.notes.length === 0 ? null : (
                <ul>
                  {ruleSet.help.notes.map((note, index) => (
                    <li key={`${index}-${note}`}>{note}</li>
                  ))}
                </ul>
              )}
              {ruleSet.help.noteBoards.length === 0 ? null : (
                <div className="leg-mate-guide-note-boards">
                  {ruleSet.help.noteBoards.map((board) => (
                    <MateRuleNoteBoard board={board} key={board.id} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

function PriorityList({
  highlightedReasonId,
  priorities,
  start,
}: {
  readonly highlightedReasonId: string | null
  readonly priorities: RegisteredMateRuleSet['whiteRuleDescriptions']
  readonly start?: number
}) {
  return (
    <ol {...(start === undefined ? {} : { start })}>
      {priorities.map((rule) => {
        const highlighted = rule.id === highlightedReasonId
        return (
          <li
            aria-current={highlighted ? 'true' : undefined}
            className={
              highlighted
                ? 'leg-mate-guide-priority-highlighted'
                : undefined
            }
            key={rule.id}
          >
            <strong>{rule.shortLabel}</strong>
            {rule.helpText === '' ? null : <> — {rule.helpText}</>}
          </li>
        )
      })}
    </ol>
  )
}
