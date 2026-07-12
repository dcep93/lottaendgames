import type { PositionSection, RawChapterSection } from './chapterTypes'
import type {
  RuntimeChapterDefinition,
  RuntimeChapterRenderItem,
  SerializedChapterPlayback,
} from './chapterRuntime'
import { buildChapterPlayback } from './moveParser'

type SourceChapterDefinition = {
  id: string
  label: string
  sections: RawChapterSection[]
}

export function buildRuntimeChapter(
  chapter: SourceChapterDefinition,
): RuntimeChapterDefinition {
  const playback = buildChapterPlayback(chapter.sections)
  const initialPositionFens = chapter.sections.reduce<Record<string, string>>(
    (positions, section) => {
      if (section.type === 'position') {
        const position = section as PositionSection
        positions[position.content.number] = position.content.fen
      }

      return positions
    },
    {},
  )

  return {
    ...chapter,
    endingCount: chapter.sections.filter((section) => section.type === 'ending')
      .length,
    initialPositionFens,
    playback: {
      playablePositions: Array.from(playback.playablePositions),
      tokensBySectionIndex: Array.from(playback.tokensBySectionIndex),
    } satisfies SerializedChapterPlayback,
    positionCount: chapter.sections.filter((section) => section.type === 'position')
      .length,
    renderItems: buildChapterRenderItems(chapter.sections),
  }
}

function buildChapterRenderItems(
  sections: RawChapterSection[],
): RuntimeChapterRenderItem[] {
  const items: RuntimeChapterRenderItem[] = []
  let index = 0

  while (index < sections.length) {
    const section = sections[index]

    if (section.type !== 'position') {
      items.push({ index, type: 'section' })
      index += 1
      continue
    }

    const contentIndexes: number[] = []
    let nextIndex = index + 1

    while (
      nextIndex < sections.length &&
      !isPositionGroupBoundary(sections[nextIndex])
    ) {
      contentIndexes.push(nextIndex)
      nextIndex += 1
    }

    items.push({
      contentIndexes,
      index,
      type: 'positionGroup',
    })
    index = nextIndex
  }

  return items
}

function isPositionGroupBoundary(section: RawChapterSection) {
  return (
    section.type === 'position' ||
    section.type === 'ending' ||
    section.type === 'title'
  )
}
