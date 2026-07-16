import React, { type MouseEvent } from 'react'
import { MATE_CATALOG } from './catalog'
import type { MateId, MateMode } from './types'

export type MateSidebarProps = {
  readonly mateId: MateId | null
  readonly mateMode: MateMode | null
  readonly onNavigate: (href: string) => void
}

export default function MateSidebar({
  mateId,
  mateMode,
  onNavigate,
}: MateSidebarProps) {
  const selectedSet = MATE_CATALOG.find(({ id }) => id === mateId)

  return (
    <React.Fragment>
      <aside aria-label="Mate training" className="leg-mate-sidebar">
        <nav aria-label="Mating sets" className="leg-mate-set-links">
          {MATE_CATALOG.map((entry) => {
            const isSelected = entry.id === mateId
            return (
              <a
                aria-current={isSelected ? 'location' : undefined}
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
              >
                {entry.label}
              </a>
            )
          })}
        </nav>

        {selectedSet === undefined || mateMode === null ? null : (
          <nav
            aria-label={`${selectedSet.label} mode`}
            className="leg-mate-mode-links"
          >
            <MateModeLink
              active={mateMode === 'standard'}
              href={selectedSet.path}
              label="Standard"
              onNavigate={onNavigate}
            />
            <MateModeLink
              active={mateMode === 'train'}
              href={`${selectedSet.path}/train`}
              label="Train"
              onNavigate={onNavigate}
            />
          </nav>
        )}
      </aside>
    </React.Fragment>
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
  onNavigate(href)
}
