import React from 'react'
import {
  loadTwoKnightsPawnTable,
  twoKnightsPawnTableReady,
} from './rules/twoKnightsPawnTable'

export default function TwoKnightsPawnPolicyLoader({
  children,
}: {
  children: React.ReactNode
}) {
  const [ready, setReady] = React.useState(twoKnightsPawnTableReady)
  const [error, setError] = React.useState<string | null>(null)
  const [attempt, setAttempt] = React.useState(0)
  React.useEffect(() => {
    let active = true
    void loadTwoKnightsPawnTable().then(
      () => {
        if (active) setReady(true)
      },
      (reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load two-knights tablebase')
      },
    )
    return () => {
      active = false
    }
  }, [attempt])
  if (ready) return children
  if (!error) return null
  return (
    <section className="leg-mate-empty-state">
      <p role="alert">{error}</p>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setAttempt((n) => n + 1)
        }}
      >
        Retry
      </button>
    </section>
  )
}
