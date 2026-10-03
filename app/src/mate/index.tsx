import TwoKnightsPawnPolicyLoader from './TwoKnightsPawnPolicyLoader'
import React, { type ReactNode } from 'react'
import MateBoard, { type MateBoardProps } from './MateBoard'
import MateSidebar, { MateModeSelector } from './MateSidebar'
import MateWorkspace from './MateWorkspace'
import MatePolicyLoader from './MatePolicyLoader'
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
  readonly onReplaceHref?: (href: string) => void
  readonly route: MateRouteSelection & { readonly module: 'mate' }
}

export default function Mate({
  boardComponent: BoardComponent = MateBoard,
  moduleSelector,
  onNavigate,
  onReplaceHref,
  route,
}: MateProps) {
  const selectedSet = MATE_CATALOG.find(
    ({ id }) => id === route.mateId,
  )
  const selectedDrill =
    selectedSet !== undefined && route.mateMode !== null
      ? { set: selectedSet, mode: route.mateMode }
      : null

  const PolicyLoader = selectedDrill?.set.id === 'bishop-knight' ? MatePolicyLoader : selectedDrill?.set.id === 'two-knights-pawn' ? TwoKnightsPawnPolicyLoader : React.Fragment

  return (
    <main className="leg-page leg-mate-page">
      <div className="leg-reader-shell leg-mate-shell">
        {moduleSelector}
        <h1 className="leg-mate-visually-hidden">Mate</h1>
        <MateSidebar
          mateId={route.mateId}
          onNavigate={onNavigate}
        />

        <div className="leg-mate-layout">
          {route.sharedError && route.sharedFen === null ? (
            <section className="leg-mate-empty-state"><p role="alert">{route.sharedError}</p><button onClick={() => onNavigate('/mate/two-knights-pawn')} type="button">Start Over</button></section>
          ) : selectedDrill ? (
            <PolicyLoader>
              <MateWorkspace
                BoardComponent={BoardComponent}
                key={drillKey(
                  selectedDrill.set.id,
                  selectedDrill.mode,
                  route.sharedFen,
                  route.sharedMoves ?? null,
                  route.sharedReplayCursor ?? null,
                )}
                mateId={selectedDrill.set.id}
                mateMode={selectedDrill.mode}
                modeSelector={
                  <MateModeSelector
                    mateId={selectedDrill.set.id}
                    mateMode={selectedDrill.mode}
                    onNavigate={onNavigate}
                  />
                }
                onReplaceHref={onReplaceHref}
                sharedError={route.sharedError}
                sharedFen={route.sharedFen}
                sharedMoves={route.sharedMoves ?? null}
                sharedReplayCursor={route.sharedReplayCursor ?? null}
              />
            </PolicyLoader>
          ) : (
            <section className="leg-mate-empty-state">
              <h2>Why This?</h2>
              <ul>
                <li>Learn a checkmating plan instead of engine moves</li>
                <li>Time yourself, challenge your wife&apos;s boyfriend</li>
                <li>Training wheels, hints, diagrams</li>
              </ul>
              <h2>Slop Alert</h2>
              <ul>
                <li>Clankers are just faster at implementing.</li>
                <li>
                  But they&apos;re more prone to bugs in a project this size.
                  Point em out to me and I&apos;ll patch.
                </li>
              </ul>
              <h2>Choose a mating set</h2>
              <ul>
                <li>Pick a material set to practise its explicit mating rules.</li>
                <li>Click Training Info to reveal ordered priorities that lead to checkmate</li>
              </ul>
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
  sharedReplayCursor: 0 | null,
): string {
  return `${mateId}:${mateMode}:${sharedFen ?? ''}:${sharedMoves?.join(' ') ?? ''}:${sharedReplayCursor ?? ''}`
}
