import type {
  PositionSection,
  ProblemSection,
  RawChapterSection,
} from './chapterTypes'
import type {
  RuntimeChapterDefinition,
  RuntimeChapterRenderItem,
  SerializedChapterPlayback,
} from './chapterRuntime'
import {
  buildChapterPlayback,
  type ChapterPlayback,
} from './moveParser'

type SourceChapterDefinition = {
  id: string
  label: string
  sections: RawChapterSection[]
}

export function buildRuntimeChapter(
  chapter: SourceChapterDefinition,
): RuntimeChapterDefinition {
  const playback = buildRuntimePlayback(chapter.sections)
  const initialPositionFens = chapter.sections.reduce<Record<string, string>>(
    (positions, section) => {
      if (section.type === 'position') {
        const position = section as PositionSection
        positions[position.content.number] = position.content.fen
      } else if (section.type === 'problem') {
        const problem = section as ProblemSection
        positions[problem.content.number] =
          problem.content.solutionFen ?? problem.content.fen
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
    positionCount: chapter.sections.filter(
      (section) => section.type === 'position' || section.type === 'problem',
    ).length,
    renderItems: buildChapterRenderItems(chapter.sections),
  }
}

function buildRuntimePlayback(sections: RawChapterSection[]): ChapterPlayback {
  const playback = buildChapterPlayback(sections)

  sections.forEach((section, sectionIndex) => {
    if (section.type !== 'problem') {
      return
    }

    const problem = section as ProblemSection
    const problemPlayback = buildChapterPlayback([
      {
        type: 'position',
        content: {
          fen: problem.content.solutionFen ?? problem.content.fen,
          number: problem.content.number,
        },
      },
      { type: 'text', content: problem.content.solution },
    ])
    const tokens = problemPlayback.tokensBySectionIndex.get(1)

    if (!tokens) {
      return
    }

    playback.playablePositions.add(problem.content.number)
    playback.tokensBySectionIndex.set(sectionIndex, tokens)
  })

  return playback
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
