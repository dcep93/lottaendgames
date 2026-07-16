import React from 'react'
import type { RegisteredMateRuleSet } from './rules'
import MateRuleNoteBoard from './MateRuleNoteBoard'

export type MatePriorityGuideDialogProps = {
  readonly ruleSet: RegisteredMateRuleSet
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
  ruleSet,
  onClose,
  returnFocusTo,
}: MatePriorityGuideDialogProps) {
  const titleId = React.useId()
  const dialogRef = React.useRef<HTMLElement>(null)
  const closeButtonRef = React.useRef<HTMLButtonElement>(null)

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
          <h2 id={titleId}>{ruleSet.help.title}</h2>
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
          <section>
            <h3>White best moves</h3>
            <p>{ruleSet.help.whiteIntro}</p>
            <ol>
              {ruleSet.whiteRuleDescriptions.map((rule) => (
                <li key={rule.id}>
                  <strong>{rule.shortLabel}</strong>
                  {rule.helpText === '' ? null : <> — {rule.helpText}</>}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3>Black resistance</h3>
            <p>{ruleSet.help.blackIntro}</p>
            <ol>
              {ruleSet.help.blackPriorities.map((priority, index) => (
                <li key={`${index}-${priority}`}>{priority}</li>
              ))}
            </ol>
          </section>

          {ruleSet.help.notes.length === 0 &&
          ruleSet.help.noteBoards.length === 0 ? null : (
            <section>
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
