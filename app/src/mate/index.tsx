import type { ReactNode } from 'react'

export default function Mate({ moduleSelector }: { moduleSelector: ReactNode }) {
  return (
    <main className="leg-page">
      <div className="leg-reader-shell">
        {moduleSelector}
        <header className="leg-reader-header leg-mate-header">
          <p className="leg-kicker">Lotta Endgames</p>
          <h1>Mate</h1>
        </header>
        <p className="leg-mate-placeholder">Coming soon.</p>
      </div>
    </main>
  )
}
