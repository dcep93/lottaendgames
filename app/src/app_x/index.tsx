import { getShaX } from './config/sha_x'
import './styles.css'

const shaX = getShaX()

function getBuildLabel() {
  if (shaX.time.trim()) {
    return shaX.time.trim()
  }

  return 'local position'
}

export default function AppX() {
  return (
    <main className="leg-page">
      <section className="leg-shell" aria-labelledby="leg-title">
        <p className="leg-kicker">Endgame table</p>
        <h1 id="leg-title">Lotta Endgames</h1>
        <p className="leg-copy">
          A quiet board for improbable finales, suspiciously strong pawns, and
          positions that refuse to be simple.
        </p>
        <div className="leg-status" aria-label="Build metadata">
          <span>Build</span>
          <strong>{getBuildLabel()}</strong>
        </div>
      </section>
    </main>
  )
}
