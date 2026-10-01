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
  const [error, setError] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)
  React.useEffect(() => {
    let active = true
    void loadTwoKnightsPawnTable().then(
      () => {
        if (active) setReady(true)
      },
      () => {
        if (active) setError(true)
      },
    )
    return () => {
      active = false
    }
  }, [attempt])
  if (ready) return children
  return (
    <section className="leg-mate-empty-state" aria-busy={!error}>
      <p role={error ? 'alert' : 'status'}>
        {error
          ? 'Could not load two-knights recommendations.'
          : 'Loading two-knights recommendations…'}
      </p>
      {error && (
        <button
          type="button"
          onClick={() => {
            setError(false)
            setAttempt((n) => n + 1)
          }}
        >
          Retry
        </button>
      )}
    </section>
  )
}
