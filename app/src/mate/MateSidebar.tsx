import React, { type MouseEvent } from 'react'
import { defaultPieces } from 'react-chessboard'
import { MATE_CATALOG } from './catalog'
import type { MateId, MateMode } from './types'

export type MateSidebarProps = {
  readonly mateId: MateId | null
  readonly mateMode: MateMode | null
  readonly onNavigate: (href: string) => void
}

const MATE_MATERIAL_PIECES: Readonly<Record<MateId, readonly string[]>> = {
  queen: ['wQ'],
  rook: ['wR'],
  'two-bishops': ['wB', 'wB'],
  'bishop-knight': ['wB', 'wN'],
  'two-knights-pawn': ['wN', 'wN', 'bP'],
}

export default function MateSidebar({
  mateId,
  mateMode,
  onNavigate,
}: MateSidebarProps) {
  const selectedSet = MATE_CATALOG.find(({ id }) => id === mateId)
  return (
    <React.Fragment>
      <aside
        aria-label="Mate training"
        className="leg-mate-sidebar"
      >
        <nav aria-label="Mating sets" className="leg-mate-set-links">
          {MATE_CATALOG.map((entry) => {
            const isSelected = entry.id === mateId
            return (
              <a
                aria-current={isSelected ? 'location' : undefined}
                aria-label={entry.label}
                className={
                  isSelected
                    ? 'leg-mate-set-link is-active'
                    : 'leg-mate-set-link'
                }
                href={entry.path}
                key={entry.id}
                onClick={(event) =>
                  handleMateNavigation(event, entry.path, onNavigate)
                }
                title={entry.label}
              >
                <MateMaterialIcon mateId={entry.id} />
              </a>
            )
          })}
        </nav>

        <nav
          aria-label={`${selectedSet?.label ?? 'Mate'} mode`}
          className="leg-mate-mode-links"
        >
          {selectedSet === undefined ? (
            <React.Fragment>
              <MateDisabledModeLabel label="Standard" />
              <MateDisabledModeLabel label="Training Wheels" />
            </React.Fragment>
          ) : (
            <React.Fragment>
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
            </React.Fragment>
          )}
        </nav>
      </aside>
    </React.Fragment>
  )
}

function MateDisabledModeLabel({ label }: { readonly label: string }) {
  return (
    <span
      aria-disabled="true"
      className="leg-mate-mode-link is-disabled"
    >
      {label}
    </span>
  )
}

function MateMaterialIcon({ mateId }: { readonly mateId: MateId }) {
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
            className="leg-mate-material-piece"
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
  event: MouseEvent<HTMLAnchorElement>,
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
