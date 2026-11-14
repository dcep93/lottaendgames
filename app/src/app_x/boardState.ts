import type { TextPlaybackToken } from './moveParser'
import {
  getNextNavigationNode,
  getPreviousNavigationNode,
  getPreviousNavigationFen,
  type PositionNavigation,
} from './playbackNavigation'
import { isOneMoveFenTransition } from './playbackPaths'

export type ActiveBoardState = {
  activeMoveId: string | null
  animateNextMove: boolean
  cursorId: string | null
  fen: string
  path: string[]
  preferredNextByCursor: Record<string, string>
}

export type PlaybackDirection = 'next' | 'previous'

export function stepBoardState(
  current: ActiveBoardState,
  navigation: PositionNavigation,
  initialFen: string,
  direction: PlaybackDirection,
): ActiveBoardState | undefined {
  if (direction === 'next') {
    const next = getNextNavigationNode(
      navigation, current.cursorId, current.preferredNextByCursor,
    )
    return next ? createMoveBoardState(current, next) : undefined
  }
  const previous = getPreviousNavigationNode(navigation, current.cursorId)
  if (previous === undefined) return undefined
  return previous === null
    ? createInitialBoardState(
        getPreviousNavigationFen(navigation, current.cursorId, initialFen),
        current.preferredNextByCursor,
      )
    : createMoveBoardState(current, previous)
}

export function createInitialBoardState(
  fen: string | undefined,
  preferredNextByCursor: Record<string, string> = {},
): ActiveBoardState {
  return {
    activeMoveId: null,
    animateNextMove: false,
    cursorId: null,
    fen: fen ?? '',
    path: [],
    preferredNextByCursor,
  }
}

export function createMoveBoardState(
  currentBoard: ActiveBoardState,
  token: Extract<TextPlaybackToken, { type: 'move' }>,
  preferredNextUpdates: Record<string, string> = {},
  currentFen = currentBoard.fen,
  forceAnimate = false,
): ActiveBoardState {
  return {
    activeMoveId: token.sourceId ?? token.id,
    animateNextMove:
      forceAnimate || isOneMoveFenTransition(currentFen, token.fen),
    cursorId: token.id,
    fen: token.fen,
    path: token.path,
    preferredNextByCursor: {
      ...currentBoard.preferredNextByCursor,
      ...preferredNextUpdates,
    },
  }
}

export function createParentStagingBoardState(
  currentBoard: ActiveBoardState,
  token: Extract<TextPlaybackToken, { type: 'move' }>,
  parentFen: string,
  preferredNextUpdates: Record<string, string>,
): ActiveBoardState {
  return {
    activeMoveId: null,
    animateNextMove: false,
    cursorId: null,
    fen: parentFen,
    path: token.path.slice(0, -1),
    preferredNextByCursor: {
      ...currentBoard.preferredNextByCursor,
      ...preferredNextUpdates,
    },
  }
}
