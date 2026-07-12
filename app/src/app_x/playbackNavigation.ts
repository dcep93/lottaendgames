import type { ChapterPlayback, TextPlaybackToken } from './moveParser'

export type MoveToken = Extract<TextPlaybackToken, { type: 'move' }>

export type NavigationNode = MoveToken & {
  previousId: string | null
}

export type PositionNavigation = {
  defaultNextByCursor: Map<string, string>
  nodesById: Map<string, NavigationNode>
  positionNumber: string
}

const initialCursorKey = 'initial'

export function buildPlaybackNavigation(playback: ChapterPlayback) {
  const navigationByPosition = new Map<string, PositionNavigation>()
  const lastNodeIdByPath = new Map<string, string>()

  for (const tokens of playback.tokensBySectionIndex.values()) {
    for (const token of tokens) {
      if (token.type !== 'move') {
        continue
      }

      const navigation = getOrCreateNavigation(
        navigationByPosition,
        token.positionNumber,
      )
      const parentKey = getPathKey(
        token.positionNumber,
        token.path.slice(0, -1),
      )
      const previousId = token.path.length
        ? lastNodeIdByPath.get(parentKey) ?? null
        : null
      const node: NavigationNode = {
        ...token,
        previousId,
      }

      navigation.nodesById.set(node.id, node)

      const cursorKey = getCursorKey(previousId)
      if (!navigation.defaultNextByCursor.has(cursorKey)) {
        navigation.defaultNextByCursor.set(cursorKey, node.id)
      }

      lastNodeIdByPath.set(getPathKey(token.positionNumber, token.path), node.id)
    }
  }

  return navigationByPosition
}

export function getNavigationNode(
  navigation: PositionNavigation,
  nodeId: string | null | undefined,
) {
  return nodeId ? navigation.nodesById.get(nodeId) : undefined
}

export function getNextNavigationNode(
  navigation: PositionNavigation,
  cursorId: string | null,
  preferredNextByCursor: Record<string, string>,
) {
  const cursorKey = getCursorKey(cursorId)
  const nextId =
    preferredNextByCursor[cursorKey] ??
    navigation.defaultNextByCursor.get(cursorKey)

  return getNavigationNode(navigation, nextId)
}

export function getPreviousNavigationNode(
  navigation: PositionNavigation,
  cursorId: string | null,
) {
  const currentNode = getNavigationNode(navigation, cursorId)

  if (!currentNode) {
    return undefined
  }

  return currentNode.previousId
    ? getNavigationNode(navigation, currentNode.previousId) ?? undefined
    : null
}

export function getParentFenForNavigationNode(
  navigation: PositionNavigation,
  nodeId: string,
  initialFen: string | undefined,
) {
  const node = getNavigationNode(navigation, nodeId)

  if (!node || !initialFen) {
    return undefined
  }

  if (!node.previousId) {
    return initialFen
  }

  return getNavigationNode(navigation, node.previousId)?.fen
}

export function getPreferredNextUpdates(
  navigation: PositionNavigation,
  nodeId: string,
) {
  const chain: NavigationNode[] = []
  let node = getNavigationNode(navigation, nodeId)

  while (node) {
    chain.unshift(node)
    node = getNavigationNode(navigation, node.previousId)
  }

  const updates: Record<string, string> = {}
  let cursorId: string | null = null

  for (const chainNode of chain) {
    updates[getCursorKey(cursorId)] = chainNode.id
    cursorId = chainNode.id
  }

  return updates
}

function getOrCreateNavigation(
  navigationByPosition: Map<string, PositionNavigation>,
  positionNumber: string,
) {
  const existingNavigation = navigationByPosition.get(positionNumber)

  if (existingNavigation) {
    return existingNavigation
  }

  const navigation: PositionNavigation = {
    defaultNextByCursor: new Map(),
    nodesById: new Map(),
    positionNumber,
  }

  navigationByPosition.set(positionNumber, navigation)

  return navigation
}

function getCursorKey(cursorId: string | null) {
  return cursorId ?? initialCursorKey
}

function getPathKey(positionNumber: string, path: string[]) {
  return `${positionNumber}\u001e${path.join('\u001f')}`
}
