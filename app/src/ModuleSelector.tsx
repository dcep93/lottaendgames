import type { MouseEvent } from 'react'
import type { AppModule } from './routing'

const modules: Array<{ href: string; id: AppModule; label: string }> = [
  { href: '/book/intro', id: 'book', label: 'Book' },
  { href: '/mate', id: 'mate', label: 'Mate' },
]

export default function ModuleSelector({
  activeModule,
  onNavigate,
}: {
  activeModule: AppModule
  onNavigate: (href: string) => void
}) {
  return (
    <nav aria-label="Modules" className="leg-module-selector">
      {modules.map((module) => (
        <a
          aria-current={module.id === activeModule ? 'page' : undefined}
          className={
            module.id === activeModule
              ? 'leg-module-tab is-active'
              : 'leg-module-tab'
          }
          href={module.href}
          key={module.id}
          onClick={(event) => handleNavigation(event, module.href, onNavigate)}
        >
          {module.label}
        </a>
      ))}
    </nav>
  )
}

function handleNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (href: string) => void,
) {
  if (
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
