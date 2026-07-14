import type { RawChapterSection } from './chapterTypes'
import type { TextPlaybackToken } from './moveParser'
import {
  buildPlaybackNavigation,
  type PositionNavigation,
} from './playbackNavigation'

export type RuntimeChapterRenderItem =
  | {
      index: number
      type: 'section'
    }
  | {
      contentIndexes: number[]
      index: number
      type: 'positionGroup'
    }

export type SerializedChapterPlayback = {
  playablePositions: string[]
  tokensBySectionIndex: Array<[number, TextPlaybackToken[]]>
}

export type RuntimeChapterDefinition = {
  endingCount: number
  id: string
  initialPositionFens: Record<string, string>
  label: string
  name: string
  playback: SerializedChapterPlayback
  positionCount: number
  renderItems: RuntimeChapterRenderItem[]
  sections: RawChapterSection[]
}

export type RuntimeChapterPayload = {
  chapters: RuntimeChapterDefinition[]
  contentHash: string
  schemaVersion: number
  sourceContentHash: string
}

export type HydratedChapter = Omit<
  RuntimeChapterDefinition,
  'navigationByPosition' | 'playback'
> & {
  navigationByPosition: Map<string, PositionNavigation>
  playback: {
    playablePositions: Set<string>
    tokensBySectionIndex: Map<number, TextPlaybackToken[]>
  }
}

export function hydrateRuntimeChapter(
  chapter: RuntimeChapterDefinition,
): HydratedChapter {
  const playback = {
    playablePositions: new Set(chapter.playback.playablePositions),
    tokensBySectionIndex: new Map(chapter.playback.tokensBySectionIndex),
  }

  return {
    ...chapter,
    navigationByPosition: buildPlaybackNavigation(playback),
    playback,
  }
}
