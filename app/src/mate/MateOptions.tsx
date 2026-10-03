import React from 'react'

export default function MateOptions({
  children,
  controls,
  modeSelector,
  result,
}: {
  readonly children: React.ReactNode
  readonly controls?: React.ReactNode
  readonly modeSelector?: React.ReactNode
  readonly result?: React.ReactNode
}) {
  return (
    <section aria-label="Training options" className="leg-mate-options">
      <div className="leg-mate-options-session">
        {modeSelector}
        {result}
      </div>
      {controls}
      <div className="leg-mate-options-tools">{children}</div>
    </section>
  )
}
