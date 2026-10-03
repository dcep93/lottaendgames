import React from 'react'

export default function MateOptions({
  children,
  controls,
  modeSelector,
}: {
  readonly children: React.ReactNode
  readonly controls?: React.ReactNode
  readonly modeSelector?: React.ReactNode
}) {
  return (
    <section aria-label="Training options" className="leg-mate-options">
      <header className="leg-mate-options-header">
        <h2>Training</h2>
        {modeSelector}
      </header>
      {controls}
      <div className="leg-mate-options-tools">{children}</div>
    </section>
  )
}
