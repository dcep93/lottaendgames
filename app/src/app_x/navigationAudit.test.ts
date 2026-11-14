import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { chapterPayloadPath } from './chapterPayloadManifest'
import { hydrateRuntimeChapter, type RuntimeChapterPayload } from './chapterRuntime'
import { buildPlaybackNavigation, getNextLineNode, getNextNavigationNode, getPreferredNextUpdates } from './playbackNavigation'
import { createInitialBoardState, createMoveBoardState, stepBoardState } from './boardState'
import { buildLichessAnalysisUrl } from './lichess'
import type { PositionSection } from './chapterTypes'

const payload = JSON.parse(readFileSync(new URL(`../../public/${chapterPayloadPath}`, import.meta.url), 'utf8')) as RuntimeChapterPayload
const chapters = new Map(payload.chapters.map(chapter => [chapter.id, hydrateRuntimeChapter(chapter)]))
// Independently parsed segment boundaries recorded by the original audit.
const continuations = [
  ["10", "10.7", "10.7-41-59", "10.7-41-61"],
  ["10", "10.7", "10.7-41-69", "10.7-41-71"],
  ["10", "10.9", "10.9-49-9", "10.9-49-12"],
  ["10", "10.11", "10.11-55-73", "10.11-55-75"],
  ["10", "10.13", "10.13-67-113", "10.13-67-115"],
  ["10", "10.23", "10.23-111-29", "10.23-111-31"],
  ["10", "10.24", "10.24-113-59", "10.24-113-61"],
  ["10", "10.24", "10.24-113-75", "10.24-113-77"],
  ["10", "10.24", "10.24-113-77", "10.24-113-79"],
  ["10", "10.24", "10.24-113-91", "10.24-113-93"],
  ["10", "10.24", "10.24-113-143", "10.24-113-145"],
  ["10", "10.24", "10.24-113-145", "10.24-113-147"],
  ["10", "10.26", "10.26-121-52", "10.26-121-54"],
  ["10", "10.26", "10.26-121-132", "10.26-121-134"],
  ["10", "10.26", "10.26-121-142", "10.26-121-144"],
  ["13", "13.8", "13.8-23-24", "13.8-23-26"],
  ["13", "13.15", "13.15-45-5", "13.15-45-7"],
  ["13", "13.15", "13.15-45-11", "13.15-45-13"],
  ["13", "13.15", "13.15-45-13", "13.15-45-15"],
  ["13", "13.15", "13.15-45-15", "13.15-45-17"],
  ["13", "13.15", "13.15-45-19", "13.15-45-21"],
  ["13", "13.15", "13.15-45-35", "13.15-45-37"],
  ["13", "13.15", "13.15-45-55", "13.15-45-57"],
  ["13", "13.15", "13.15-45-63", "13.15-45-65"],
  ["13", "13.15", "13.15-45-79", "13.15-45-81"],
  ["13", "13.15", "13.15-45-83", "13.15-45-85"],
  ["13", "13.17", "13.17-53-40", "13.17-53-42"],
  ["13", "13.17", "13.17-53-66", "13.17-53-68"],
  ["13", "13.18", "13.18-55-0", "13.18-55-2"],
  ["13", "13.18", "13.18-55-34", "13.18-55-36"],
  ["13", "13.18", "13.18-55-54", "13.18-55-56"],
] as const
for (const [chapter, board, fromId, toId] of continuations) {
  const navigation = chapters.get(chapter)!.navigationByPosition.get(board)!
  assert.equal(getNextLineNode(navigation, fromId, {})?.id, toId, `${board}: ${fromId} -> ${toId}`)
  assert.equal(navigation.nodesById.get(toId)!.previousId, fromId)
}

const one = chapters.get('1')!
const game = one.navigationByPosition.get('1.25')!
const gameMoves = [...game.nodesById.values()]
const ke2 = gameMoves.find(move => move.display === '14. Ke2?')!
const ke3 = gameMoves.find(move => move.san === 'Ke3' && move.display.startsWith('14.'))!
const kg2 = gameMoves.find(move => move.display === '14... Kg2!')!
assert.ok(ke2 && ke3 && kg2)
assert.equal(getNextLineNode(game, ke2.id, {})?.id, kg2.id)
assert.equal(getNextLineNode(game, ke3.id, {}), undefined)
assert.equal(kg2.parentFen, ke2.fen)
assert.equal(new Chess(kg2.fen).get('e2')?.type, 'k')
assert.equal(getNextNavigationNode(game, ke3.id, getPreferredNextUpdates(game, ke3.id))?.id, kg2.id)

const nine = one.navigationByPosition.get('1.9')!
const hypothetical = [...nine.nodesById.values()].find(move => move.san === 'Ke6' && !move.previousId)!
assert.ok(hypothetical)
const start = createInitialBoardState(one.initialPositionFens['1.9'])
const selected = createMoveBoardState(start, hypothetical, getPreferredNextUpdates(nine, hypothetical.id))
const previous = stepBoardState(selected, nine, start.fen, 'previous')!
assert.equal(previous.fen, hypothetical.parentFen)
assert.equal(new Chess(previous.fen).get('f6')?.type, 'k')
assert.equal(stepBoardState(previous, nine, start.fen, 'next')?.fen, hypothetical.fen)

let relocatedGroups = 0
for (const raw of payload.chapters) {
  const chapter = chapters.get(raw.id)!
  const rawTokens = new Map(raw.playback.tokensBySectionIndex)
  const rawNavigation = buildPlaybackNavigation({ playablePositions: new Set(raw.playback.playablePositions), tokensBySectionIndex: rawTokens })
  for (const group of raw.renderItems) {
    if (group.type !== 'positionGroup') continue
    const owner = (raw.sections[group.index] as PositionSection).content.number
    let relocated = false
    for (const index of group.contentIndexes) {
      const tokens = chapter.playback.tokensBySectionIndex.get(index) ?? []
      for (const token of tokens) {
        if (token.type !== 'move' || token.hidden) continue
        assert.equal(token.positionNumber, owner, `${owner}: ${token.display} must control the nearby board`)
        const source = rawTokens.get(index)!.find(t => t.type === 'move' && t.id === token.id)!
        if (source.type !== 'move' || source.positionNumber === owner) continue
        relocated = true
        assert.equal(token.fen, source.fen)
        assert.equal(token.parentFen, source.parentFen)
        const navigation = chapter.navigationByPosition.get(owner)!
        const original = rawNavigation.get(source.positionNumber)!
        assert.equal(navigation.nodesById.get(token.id)!.previousId, original.nodesById.get(token.id)!.previousId)
        const input = { currentCursorId: token.id, initialFen: chapter.initialPositionFens[owner], navigation, preferredNextByCursor: getPreferredNextUpdates(navigation, token.id) }
        const localizedUrl = buildLichessAnalysisUrl(input)
        assert.ok(localizedUrl, `${owner}: ${token.display} must export a legal line`)
        assert.equal(localizedUrl, buildLichessAnalysisUrl({ ...input, navigation: original }))
      }
    }
    if (relocated) relocatedGroups++
  }
  for (const navigation of chapter.navigationByPosition.values()) {
    for (const start of navigation.nodesById.values()) {
      const visited = new Set<string>()
      let current: typeof start | undefined = start
      while (current) {
        assert.ok(!visited.has(current.id), `Navigation cycle at ${current.id}`)
        visited.add(current.id)
        current = getNextNavigationNode(navigation, current.id, {})
      }
    }
  }
}
assert.equal(relocatedGroups, 13)
console.log(`Navigation audit passed: ${continuations.length} continuation repairs, ${relocatedGroups} nearby-board groups, 1.25 and 1.9`)
