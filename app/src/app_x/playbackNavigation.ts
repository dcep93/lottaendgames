import type { ChapterPlayback, TextPlaybackToken } from './moveParser'

export type MoveToken = Extract<TextPlaybackToken, { type: 'move' }>

export type NavigationNode = MoveToken & {
  previousId: string | null
  resumeId?: string
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
  const printedRuns: MoveToken[][] = []

  for (const tokens of playback.tokensBySectionIndex.values()) {
    for (const token of tokens) {
      if (token.type !== 'move') {
        continue
      }

      // A different printed board ends the current reading context. In
      // particular, do not skip an analysis diagram to find a later return.
      if (!token.hidden) {
        let run = printedRuns.at(-1)
        if (run?.[0].positionNumber !== token.positionNumber) {
          run = []
          printedRuns.push(run)
        }
        run!.push(token)
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

  for (const navigation of navigationByPosition.values()) {
    for (const node of navigation.nodesById.values()) {
      if (node.previousId || node.path.length <= 1) {
        continue
      }

      node.previousId =
        lastNodeIdByPath.get(
          getPathKey(node.positionNumber, node.path.slice(0, -1)),
        ) ?? null
    }

    navigation.defaultNextByCursor.clear()
    for (const node of navigation.nodesById.values()) {
      const cursorKey = getCursorKey(node.previousId)
      if (!navigation.defaultNextByCursor.has(cursorKey)) {
        navigation.defaultNextByCursor.set(cursorKey, node.id)
      }
    }
  }

  for (const run of printedRuns) {
    const navigation = navigationByPosition.get(run[0].positionNumber)!
    // Source segments can restart their path even though the printed line
    // continues. Only join adjacent moves with identical full FENs (including
    // move counters), never a repeated position elsewhere in the chapter.
    for (let index = 1; index < run.length; index++) {
      const previous = navigation.nodesById.get(run[index - 1].id)!
      const next = navigation.nodesById.get(run[index].id)!
      if (!next.previousId && previous.fen === next.parentFen &&
          !navigation.defaultNextByCursor.has(previous.id)) {
        next.previousId = previous.id
        navigation.defaultNextByCursor.set(previous.id, next.id)
      }
    }
    addVariationReturns(navigation, run)
  }

  return navigationByPosition
}

function addVariationReturns(navigation: PositionNavigation, run: MoveToken[]) {
  const printedIndex = new Map(run.map((token, index) => [token.id, index]))

  for (const [index, token] of run.entries()) {
    if (navigation.defaultNextByCursor.has(token.id)) {
      continue
    }

    const leaf = navigation.nodesById.get(token.id)!
    let branch: NavigationNode | undefined = leaf
    while (branch && !leaf.resumeId) {
      let main = getNavigationNode(
        navigation,
        navigation.defaultNextByCursor.get(getCursorKey(branch.previousId)),
      )
      if (main?.id !== branch.id) {
        // Return to the nearest enclosing line, skipping other alternatives
        // and moves already printed before this variation.
        const visited = new Set<string>()
        while (main && !visited.has(main.id)) {
          visited.add(main.id)
          if ((printedIndex.get(main.id) ?? -1) > index) {
            leaf.resumeId = main.id
            break
          }
          main = getNavigationNode(
            navigation,
            navigation.defaultNextByCursor.get(main.id),
          )
        }
      }
      branch = getNavigationNode(navigation, branch.previousId)
    }
  }
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
  return (
    getNextLineNode(navigation, cursorId, preferredNextByCursor) ??
    getNavigationNode(navigation, getNavigationNode(navigation, cursorId)?.resumeId)
  )
}

// Chess-line consumers (such as PGN export) must not follow reading-order jumps.
export function getNextLineNode(
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

export function getPreviousNavigationFen(
  navigation: PositionNavigation,
  cursorId: string | null,
  initialFen: string,
) {
  const currentNode = getNavigationNode(navigation, cursorId)
  const previousNode = getPreviousNavigationNode(navigation, cursorId)

  if (previousNode === undefined) {
    return undefined
  }

  return previousNode?.fen ?? currentNode?.parentFen ?? initialFen
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

  if (node.parentFen) {
    return node.parentFen
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
