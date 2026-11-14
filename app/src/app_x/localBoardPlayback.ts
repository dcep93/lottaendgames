import type { PositionSection, RawChapterSection } from './chapterTypes'
import type { RuntimeChapterRenderItem } from './chapterRuntime'
import type { ChapterPlayback } from './moveParser'
import type { PositionNavigation } from './playbackNavigation'

/** Keep printed source ancestry, but play a group's moves on its nearby board. */
export function localizeBoardPlayback(
  sections: RawChapterSection[],
  renderItems: RuntimeChapterRenderItem[],
  playback: ChapterPlayback,
  sourceNavigation: Map<string, PositionNavigation>,
) {
  const tokensBySectionIndex = new Map(playback.tokensBySectionIndex)
  const playablePositions = new Set(playback.playablePositions)
  const navigationByPosition = new Map(sourceNavigation)

  for (const group of renderItems) {
    if (group.type !== 'positionGroup') continue
    const position = (sections[group.index] as PositionSection).content
    const sources = new Set<string>()
    for (const index of group.contentIndexes) {
      const tokens = tokensBySectionIndex.get(index)
      if (!tokens) continue
      tokensBySectionIndex.set(index, tokens.map(token => {
        if (token.type !== 'move' || token.hidden || token.positionNumber === position.number) return token
        sources.add(token.positionNumber)
        return { ...token, positionNumber: position.number }
      }))
    }
    if (!sources.size) continue

    const original = sourceNavigation.get(position.number)
    const navigation: PositionNavigation = {
      positionNumber: position.number,
      nodesById: new Map(original?.nodesById),
      defaultNextByCursor: new Map(original?.defaultNextByCursor),
    }
    for (const source of sources) {
      const sourceNodes = sourceNavigation.get(source)
      if (!sourceNodes) continue
      // Copy the complete graph so Previous, Next and Lichess retain the
      // actual ancestry; never replay foreign SAN against the local diagram.
      for (const [id, node] of sourceNodes.nodesById) {
        navigation.nodesById.set(id, { ...node, positionNumber: position.number })
      }
      for (const [cursor, next] of sourceNodes.defaultNextByCursor) {
        if (cursor !== 'initial') navigation.defaultNextByCursor.set(cursor, next)
      }
    }
    if (!navigation.defaultNextByCursor.has('initial')) {
      const first = group.contentIndexes.flatMap(index => tokensBySectionIndex.get(index) ?? [])
        .find(token => token.type === 'move' && !token.hidden)
      if (first?.type === 'move') navigation.defaultNextByCursor.set('initial', first.id)
    }
    playablePositions.add(position.number)
    navigationByPosition.set(position.number, navigation)
  }

  return { navigationByPosition, playback: { playablePositions, tokensBySectionIndex } }
}
