import { Chess } from 'chess.js'
import {
  getNavigationNode,
  getNextNavigationNode,
  type NavigationNode,
  type PositionNavigation,
} from './playbackNavigation'

const lichessInlinePgnLimit = 5000

type LichessAnalysisInput = {
  currentCursorId: string | null
  initialFen: string
  navigation?: PositionNavigation
  preferredNextByCursor: Record<string, string>
}

export function buildLichessAnalysisUrl(
  input: LichessAnalysisInput,
  encodedPgnLimit = lichessInlinePgnLimit,
) {
  const line = selectCompleteLine(input)

  if (!line) {
    return null
  }

  try {
    const chess = new Chess(line.initialFen)

    for (const node of line.nodes) {
      if (!isSamePosition(chess.fen(), node.parentFen)) {
        return null
      }

      chess.move(node.san, { strict: false })

      if (!isSamePosition(chess.fen(), node.fen)) {
        return null
      }
    }

    const encodedPgn = encodeURIComponent(chess.pgn())

    if (encodedPgn.length > encodedPgnLimit) {
      return null
    }

    const currentPly = getInitialPly(line.initialFen) + line.currentMoveCount
    return `https://lichess.org/analysis/pgn/${encodedPgn}#${currentPly}`
  } catch {
    return null
  }
}

export function buildLichessEditorUrl(fen: string) {
  const fields = fen.trim().split(/\s+/)

  if (fields.length < 4 || !fields[0].includes('/')) {
    return null
  }

  return `https://lichess.org/editor/${fields.slice(0, 4).join('_')}`
}

function selectCompleteLine(input: LichessAnalysisInput) {
  const nodes: NavigationNode[] = []
  const visitedNodeIds = new Set<string>()
  const navigation = input.navigation
  let currentNode = navigation
    ? getNavigationNode(navigation, input.currentCursorId)
    : undefined

  if (input.currentCursorId && !currentNode) {
    return null
  }

  while (currentNode) {
    if (visitedNodeIds.has(currentNode.id)) {
      return null
    }

    visitedNodeIds.add(currentNode.id)
    nodes.unshift(currentNode)
    currentNode = currentNode.previousId && navigation
      ? getNavigationNode(navigation, currentNode.previousId)
      : undefined
  }

  const initialFen = nodes[0]?.parentFen ?? input.initialFen
  const currentMoveCount = nodes.length
  let cursorId = input.currentCursorId
  let currentFen = nodes.at(-1)?.fen ?? initialFen

  while (navigation) {
    let nextNode = getNextNavigationNode(
      navigation,
      cursorId,
      input.preferredNextByCursor,
    )

    if (nextNode && !isSamePosition(nextNode.parentFen, currentFen)) {
      const defaultNextId = navigation.defaultNextByCursor.get(
        cursorId ?? 'initial',
      )
      nextNode = getNavigationNode(navigation, defaultNextId)
    }

    if (!nextNode || !isSamePosition(nextNode.parentFen, currentFen)) {
      break
    }

    if (visitedNodeIds.has(nextNode.id)) {
      return null
    }

    visitedNodeIds.add(nextNode.id)
    nodes.push(nextNode)
    cursorId = nextNode.id
    currentFen = nextNode.fen
  }

  return { currentMoveCount, initialFen, nodes }
}

function getInitialPly(fen: string) {
  const [, turn, , , , fullmoveText] = fen.split(/\s+/)
  const fullmove = Number.parseInt(fullmoveText, 10)

  if ((turn !== 'b' && turn !== 'w') || !Number.isInteger(fullmove)) {
    throw new Error('Invalid FEN move counters')
  }

  return (fullmove - 1) * 2 + (turn === 'b' ? 1 : 0)
}

function isSamePosition(leftFen: string, rightFen: string) {
  return getPositionFields(leftFen) === getPositionFields(rightFen)
}

function getPositionFields(fen: string) {
  return fen.split(/\s+/).slice(0, 4).join(' ')
}
