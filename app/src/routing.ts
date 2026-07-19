import { MATE_CATALOG } from './mate/catalog'
import {
  decodeMateReplay,
  encodeMateFen,
  encodeMateReplay,
} from './mate/share'
import type { MateId, MateMode, MateRouteSelection } from './mate/types'

export type AppModule = 'book' | 'mate'

export type AppRoute =
  | {
      anchorId: string | null
      chapterId: string
      module: 'book'
    }
  | {
      module: 'mate'
    } & MateRouteSelection

export type RouteResolution = {
  href: string
  route: AppRoute
}

const aboutPath = '/book/about'
const introductionPath = '/book/intro'

export function resolveAppRoute(
  pathname: string,
  hash = '',
): RouteResolution {
  if (pathname === '/mate' || pathname.startsWith('/mate/')) {
    return resolveMateRoute(pathname, hash)
  }

  const chapterId = getBookChapterId(pathname)
  const resolvedChapterId = chapterId ?? 'about'
  const path = chapterId ? bookPathForChapterId(chapterId) : aboutPath
  const anchorId = chapterId && chapterId !== 'about' ? parseBookAnchor(hash) : null

  return {
    href: `${path}${anchorId ? `#${anchorId}` : ''}`,
    route: {
      anchorId,
      chapterId: resolvedChapterId,
      module: 'book',
    },
  }
}

export function matePath(id: MateId, mode: MateMode) {
  return `/mate/${id}${mode === 'train' ? '/train' : ''}`
}

export function bookPathForChapterId(chapterId: string) {
  if (chapterId === 'about') {
    return aboutPath
  }

  if (chapterId === 'introduction') {
    return introductionPath
  }

  if (chapterId === 'bibliography') {
    return '/book/bibliography'
  }

  if (/^(?:[1-9]|1[0-5])$/.test(chapterId)) {
    return `/book/chapter${chapterId}`
  }

  return aboutPath
}

export function bookEndingAnchorId(number: string) {
  return `e${number}`
}

export function bookPositionAnchorId(number: string) {
  return `p${number}`
}

export function bookProblemSolutionAnchorId(number: string) {
  return `${bookPositionAnchorId(number)}-solution`
}

function getBookChapterId(pathname: string) {
  if (pathname === aboutPath) {
    return 'about'
  }

  if (pathname === introductionPath) {
    return 'introduction'
  }

  if (pathname === '/book/bibliography') {
    return 'bibliography'
  }

  const chapterMatch = pathname.match(
    /^\/book\/chapter([1-9]|1[0-5])$/,
  )

  return chapterMatch?.[1] ?? null
}

function parseBookAnchor(hash: string) {
  const decodedHash = safeDecodeHash(hash)

  if (/^e[1-9]\d*$/.test(decodedHash)) {
    return decodedHash
  }

  if (/^p[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*$/.test(decodedHash)) {
    return decodedHash
  }

  return null
}

function resolveMateRoute(pathname: string, hash: string): RouteResolution {
  if (pathname === '/mate') {
    return emptyMateResolution()
  }

  const match = pathname.match(/^\/mate\/([^/]+)(\/train)?$/)
  const catalogRecord = MATE_CATALOG.find(({ id }) => id === match?.[1])

  if (!catalogRecord) {
    return emptyMateResolution()
  }

  const mateMode = match?.[2] ? 'train' : 'standard'
  const href = matePath(catalogRecord.id, mateMode)

  if (hash) {
    const decoded = decodeMateReplay(hash, catalogRecord.id, mateMode)
    if (!decoded.ok) return emptyMateResolution()
    const canonicalHash =
      decoded.moves === null
        ? encodeMateFen(decoded.fen)
        : encodeMateReplay(decoded.fen, decoded.moves)
    return {
      href: `${href}${canonicalHash}`,
      route: {
        module: 'mate',
        mateId: catalogRecord.id,
        mateMode,
        sharedFen: decoded.fen,
        ...(decoded.moves === null ? {} : { sharedMoves: decoded.moves }),
      },
    }
  }

  return {
    href,
    route: {
      module: 'mate',
      mateId: catalogRecord.id,
      mateMode,
      sharedFen: null,
    },
  }
}

function emptyMateResolution(): RouteResolution {
  return {
    href: '/mate',
    route: {
      module: 'mate',
      mateId: null,
      mateMode: null,
      sharedFen: null,
    },
  }
}

function safeDecodeHash(hash: string) {
  const value = hash.startsWith('#') ? hash.slice(1) : hash

  try {
    return decodeURIComponent(value)
  } catch {
    return ''
  }
}
