import React from 'react'

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
        <h2 id={titleId}>B. F. Knight</h2>
        <button onClick={onClose} type="button" autoFocus>Close</button>
      </header>
      <div className="leg-mate-guide-body">
        <section className="leg-mate-guide-section">
          <p>maneuver a knight across the board while avoiding squares attacked by a stationary enemy queen</p>
        </section>
      </div>
    </dialog>
  )
}
