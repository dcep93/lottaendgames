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
  const selectedHref = selectedSet === undefined || mateMode === null
    ? ''
    : `${selectedSet.path}${mateMode === 'train' ? '/train' : ''}`

  return (
    <React.Fragment>
      <aside aria-label="Mate training" className="leg-mate-sidebar">
        <p className="leg-mate-sidebar-label">Mate training</p>
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

      <label className="leg-mate-collapsed-selector">
        <span>Mate training</span>
        <select
          aria-label="Mate training: choose mating set and mode"
          onChange={(event) => {
            if (event.currentTarget.value !== '') {
              onNavigate(event.currentTarget.value)
            }
          }}
          value={selectedHref}
        >
          <option value="">Choose a mating set</option>
          {MATE_CATALOG.map((entry) => (
            <optgroup key={entry.id} label={entry.label}>
              <option value={entry.path}>{entry.label} — Standard</option>
              <option value={`${entry.path}/train`}>
                {entry.label} — Train
              </option>
            </optgroup>
          ))}
        </select>
      </label>
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
