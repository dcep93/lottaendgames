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
      {modeSelector}
      {controls}
      <div className="leg-mate-options-tools">{children}</div>
    </section>
  )
}
