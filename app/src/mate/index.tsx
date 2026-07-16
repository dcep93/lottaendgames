import type { ReactNode } from 'react'
import type { MateRouteSelection } from './types'

type MateProps = {
  moduleSelector: ReactNode
  onNavigate: (href: string) => void
  route: MateRouteSelection & { module: 'mate' }
}

export default function Mate({ moduleSelector }: MateProps) {
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
