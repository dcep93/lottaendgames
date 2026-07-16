export type AppModule = 'book' | 'mate'

export type AppRoute =
  | {
      anchorId: string | null
      chapterId: string
      module: 'book'
    }
  | {
      module: 'mate'
    }

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
  if (pathname === '/mate') {
    return { href: '/mate', route: { module: 'mate' } }
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

function safeDecodeHash(hash: string) {
  const value = hash.startsWith('#') ? hash.slice(1) : hash

  try {
    return decodeURIComponent(value)
  } catch {
    return ''
  }
}
