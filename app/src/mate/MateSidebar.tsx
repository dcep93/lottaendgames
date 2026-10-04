import React from 'react'
import { defaultPieces } from 'react-chessboard'
import { MATE_CATALOG, MATE_NAVIGATION } from './catalog'
import type { MateId, MateMode, MateModuleId } from './types'

export type MateSidebarProps = {
  readonly mateId: MateModuleId | null
  readonly onNavigate: (href: string) => void
}

const MATE_MATERIAL_PIECES: Readonly<Record<MateModuleId, readonly string[]>> = {
  queen: ['wQ'],
  rook: ['wR'],
  'two-bishops': ['wB', 'wB'],
  'bishop-knight': ['wB', 'wN'],
  'two-knights-pawn': ['wN', 'wN', 'bP'],
  'knight-queen': ['wN', 'bQ'],
}

export default function MateSidebar({
  mateId,
  onNavigate,
}: MateSidebarProps) {
  return (
    <aside
      aria-label="Mate training"
      className="leg-mate-sidebar"
    >
      <nav aria-label="Mating sets" className="leg-mate-set-links">
        {MATE_NAVIGATION.map((entry) => {
          const isSelected = entry.id === mateId
          const href = isSelected ? '/mate' : entry.path
          return (
            <a
              aria-label={
                isSelected ? `${entry.label}, selected` : entry.label
              }
              className={
                isSelected
                  ? 'leg-mate-set-link is-active'
                  : 'leg-mate-set-link'
              }
              href={href}
              key={entry.id}
              onClick={(event) =>
                handleMateNavigation(event, href, onNavigate)
              }
              title={entry.label}
            >
              <MateMaterialIcon mateId={entry.id} />
            </a>
          )
        })}
      </nav>
    </aside>
  )
}

export function MateModeSelector({
  mateId,
  mateMode,
  onNavigate,
}: {
  readonly mateId: MateId
  readonly mateMode: MateMode
  readonly onNavigate: (href: string) => void
}) {
  const selectedSet = MATE_CATALOG.find(({ id }) => id === mateId)!
  return (
    <div className="leg-mate-mode-selector">
      <nav aria-label={`${selectedSet.label} mode`} className="leg-mate-mode-links">
        <MateModeLink
          active={mateMode === 'standard'}
          href={selectedSet.path}
          label="Standard"
          onNavigate={onNavigate}
        />
        <MateModeLink
          active={mateMode === 'train'}
          href={`${selectedSet.path}/train`}
          label="Training Wheels"
          onNavigate={onNavigate}
        />
      </nav>
    </div>
  )
}

function MateMaterialIcon({ mateId }: { readonly mateId: MateModuleId }) {
  const pieces = MATE_MATERIAL_PIECES[mateId]

  return (
    <span
      aria-hidden="true"
      className={`leg-mate-material-icon leg-mate-material-icon--${pieces.length}`}
    >
      {pieces.map((pieceType, index) => {
        const renderPiece = defaultPieces[pieceType]
        return renderPiece === undefined ? null : (
          <span
            className={`leg-mate-material-piece${pieceType.startsWith('b') ? ' leg-mate-material-piece--black' : ''}`}
            key={`${pieceType}-${index}`}
          >
            {renderPiece({
              svgStyle: {
                display: 'block',
                height: '100%',
                width: '100%',
              },
            })}
          </span>
        )
      })}
    </span>
  )
}

function MateModeLink({
  active,
  href,
  label,
  onNavigate,
}: {
  readonly active: boolean
  readonly href: string
  readonly label: string
  readonly onNavigate: (href: string) => void
}) {
  return (
    <a
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'leg-mate-mode-link is-active'
          : 'leg-mate-mode-link'
      }
      href={href}
      onClick={(event) => handleMateNavigation(event, href, onNavigate)}
    >
      {label}
    </a>
  )
}

function handleMateNavigation(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (href: string) => void,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  event.preventDefault()
  if (event.detail > 0) event.currentTarget.blur()
  onNavigate(href)
}
