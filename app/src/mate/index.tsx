import React, { type ReactNode } from 'react'
import MateBoard, { type MateBoardProps } from './MateBoard'
import MateSidebar from './MateSidebar'
import MateWorkspace from './MateWorkspace'
import { MATE_CATALOG } from './catalog'
import type {
  MateId,
  MateMode,
  MateRouteSelection,
} from './types'

type MateProps = {
  readonly boardComponent?: React.ComponentType<MateBoardProps>
  readonly moduleSelector: ReactNode
  readonly onNavigate: (href: string) => void
  readonly route: MateRouteSelection & { readonly module: 'mate' }
}

export default function Mate({
  boardComponent: BoardComponent = MateBoard,
  moduleSelector,
  onNavigate,
  route,
}: MateProps) {
  const selectedSet = MATE_CATALOG.find(
    ({ id }) => id === route.mateId,
  )
  const selectedDrill =
    selectedSet !== undefined && route.mateMode !== null
      ? { set: selectedSet, mode: route.mateMode }
      : null

  return (
    <main className="leg-page leg-mate-page">
      <div className="leg-reader-shell leg-mate-shell">
        {moduleSelector}
        <h1 className="leg-mate-visually-hidden">Mate</h1>
        <MateSidebar
          mateId={route.mateId}
          mateMode={route.mateMode}
          onNavigate={onNavigate}
        />

        <div className="leg-mate-layout">
          {selectedDrill ? (
            <MateWorkspace
              BoardComponent={BoardComponent}
              key={drillKey(
                selectedDrill.set.id,
                selectedDrill.mode,
                route.sharedFen,
                route.sharedMoves ?? null,
              )}
              mateId={selectedDrill.set.id}
              mateMode={selectedDrill.mode}
              sharedFen={route.sharedFen}
              sharedMoves={route.sharedMoves ?? null}
            />
          ) : (
            <section className="leg-mate-empty-state">
              <h2>Choose a mating set</h2>
              <p>
                Pick a material set to practise its explicit mating rules.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function drillKey(
  mateId: MateId,
  mateMode: MateMode,
  sharedFen: string | null,
  sharedMoves: readonly string[] | null,
): string {
  return `${mateId}:${mateMode}:${sharedFen ?? ''}:${sharedMoves?.join(' ') ?? ''}`
}
