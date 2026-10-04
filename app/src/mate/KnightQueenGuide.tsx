import React from 'react'
import { KNIGHT_QUEEN_ROUTE } from './knightQueen'

export default function KnightQueenGuide({ onClose }: { readonly onClose: () => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null)
  const titleId = React.useId()
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const element = dialog.current
    const opener = document.activeElement as HTMLElement | null
    element?.showModal()
    return () => { element?.close(); opener?.focus() }
  }, [])
  return (
    <dialog
      aria-labelledby={titleId}
      className="leg-mate-guide leg-knight-queen-guide"
      onCancel={event => { event.preventDefault(); onClose() }}
      ref={dialog}
    >
      <header className="leg-mate-guide-header">
        <h2 id={titleId}>Knight vs Queen</h2>
        <button onClick={onClose} type="button" autoFocus>Close</button>
      </header>
      <div className="leg-mate-guide-body">
        <section className="leg-mate-guide-section">
          <p>This is a weird one: a knight navigation exercise in the Mate section. There are no kings and no checkmate.</p>
          <ul>
            <li>Your white knight starts on h8. The black queen stays on d5. Black never moves.</li>
            <li>Move the knight normally, but never land on the queen or a square she attacks. Jumping over attacked squares is fine.</li>
            <li>Visit the safe squares in a snaking order: across rank 8 from h to a, rank 7 from a to h, and so on down to rank 1. Skip every square the queen controls.</li>
            <li>The orange highlight marks your next target. You can revisit squares or cross future targets while getting there, but only the current target counts toward progress.</li>
            <li>h8 already counts. Reach the remaining 35 targets to finish on g1; h1 is attacked.</li>
            <li>Play Best takes one step along a shortest safe route to the highlighted target.</li>
          </ul>
          <p className="leg-knight-queen-route"><strong>Target order:</strong> {KNIGHT_QUEEN_ROUTE.join(' → ')}</p>
          <p>↑ Play Best · ←/→ Undo/Redo · Enter Start Over · Escape Training Info</p>
        </section>
      </div>
    </dialog>
  )
}
