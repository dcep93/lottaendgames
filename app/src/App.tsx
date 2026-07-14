import { useEffect, useState } from 'react'
import AppX from './app_x'
import Mate from './mate'
import ModuleSelector from './ModuleSelector'
import {
  bookPathForChapterId,
  resolveAppRoute,
  type RouteResolution,
} from './routing'

export default function App() {
  const [resolution, setResolution] = useState(readCurrentRoute)
  const { route } = resolution

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration

    window.history.scrollRestoration = 'manual'
    canonicalizeCurrentUrl()

    function handleHistoryChange() {
      const nextResolution = readCurrentRoute()

      if (currentHref() !== nextResolution.href) {
        window.history.replaceState(null, '', nextResolution.href)
      }

      setResolution(nextResolution)
    }

    window.addEventListener('hashchange', handleHistoryChange)
    window.addEventListener('popstate', handleHistoryChange)

    return () => {
      window.history.scrollRestoration = previousScrollRestoration
      window.removeEventListener('hashchange', handleHistoryChange)
      window.removeEventListener('popstate', handleHistoryChange)
    }
  }, [])

  function navigate(href: string) {
    if (href === currentHref()) {
      return
    }

    window.history.pushState(null, '', href)
    setResolution(readCurrentRoute())
  }

  const moduleSelector = (
    <ModuleSelector activeModule={route.module} onNavigate={navigate} />
  )

  if (route.module === 'mate') {
    return <Mate moduleSelector={moduleSelector} />
  }

  return (
    <AppX
      anchorId={route.anchorId}
      chapterId={route.chapterId}
      moduleSelector={moduleSelector}
      onAnchorSelect={(anchorId) =>
        navigate(`${bookPathForChapterId(route.chapterId)}#${anchorId}`)
      }
      onChapterSelect={(chapterId) => navigate(bookPathForChapterId(chapterId))}
    />
  )
}

function readCurrentRoute(): RouteResolution {
  return resolveAppRoute(window.location.pathname, window.location.hash)
}

function canonicalizeCurrentUrl() {
  const resolution = readCurrentRoute()

  if (currentHref() !== resolution.href) {
    window.history.replaceState(null, '', resolution.href)
  }
}

function currentHref() {
  return `${window.location.pathname}${window.location.hash}`
}
