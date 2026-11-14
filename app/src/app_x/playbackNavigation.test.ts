import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { chapterPayloadPath } from './chapterPayloadManifest'
import { hydrateRuntimeChapter, type RuntimeChapterPayload } from './chapterRuntime'
import { buildLichessAnalysisUrl } from './lichess'
import {
  buildPlaybackNavigation,
  getNextLineNode,
  getNextNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationNode,
  type MoveToken,
} from './playbackNavigation'

const payload = JSON.parse(readFileSync(
  new URL(`../../public/${chapterPayloadPath}`, import.meta.url), 'utf8',
)) as RuntimeChapterPayload
const chapter = hydrateRuntimeChapter(payload.chapters.find(part => part.id === '1')!)
const navigation = chapter.navigationByPosition.get('1.19')!
const moves = [...navigation.nodesById.values()]
const find = (display: string) => {
  const move = moves.find(node => node.display === display)
  assert.ok(move, `Missing printed move ${display}`)
  return move
}
const nc3 = find('4.Nc3')
const rc2 = find('3...Rc2')
const nd5 = find('4.Nd5??')
const preferences = getPreferredNextUpdates(navigation, nc3.id)
assert.equal(getNextNavigationNode(navigation, nc3.id, preferences)?.id, rc2.id)
assert.equal(getNextLineNode(navigation, nc3.id, preferences), undefined)
assert.equal(getPreviousNavigationNode(navigation, rc2.id)?.id, find('3. Nc3').id)
assert.equal(getNextNavigationNode(navigation, rc2.id, preferences)?.id, find('4. Nd1').id)
assert.equal(getNextNavigationNode(navigation, find('4. Nd1').id, {})?.id, find('4...Re2+').id)
assert.equal(getNextNavigationNode(navigation, nd5.id, {}), undefined)
assert.equal(getNextNavigationNode(navigation, nd5.id, getPreferredNextUpdates(navigation, nd5.id)), undefined)
assert.equal(getNextNavigationNode(navigation, find('7. Kf1=').id, {}), undefined)

// Export remains the selected legal variation, without its reading-order return.
const url = buildLichessAnalysisUrl({
  currentCursorId: nc3.id,
  initialFen: chapter.initialPositionFens['1.19'],
  navigation,
  preferredNextByCursor: preferences,
})
assert.ok(url)
const exported = new Chess()
exported.loadPgn(decodeURIComponent(new URL(url).pathname.slice('/analysis/pgn/'.length)))
assert.equal(exported.fen(), nc3.fen)

// Nested and consecutive alternatives: resume the enclosing line, not the next
// sibling variation, and never append that return to the chess ancestry.
function token(id: string, path: string[], positionNumber = 'example'): MoveToken {
  const chess = new Chess()
  let parentFen = chess.fen()
  for (const san of path) {
    parentFen = chess.fen()
    chess.move(san)
  }
  return { id, path, positionNumber, parentFen, fen: chess.fen(),
    display: id, san: path.at(-1)!, type: 'move' }
}
const e4 = ['e4']
const e5 = [...e4, 'e5']
const main = [...e5, 'Nf3']
const alternative = [...e5, 'Nc3']
const fixture = [
  token('e4', e4), token('e5', e5), token('Nf3', main),
  token('Nc3', alternative), token('alternative-Nc6', [...alternative, 'Nc6']),
  token('Nf6', [...alternative, 'Nf6']), token('d4', [...alternative, 'Nf6', 'd4']),
  token('f4', [...alternative, 'Nc6', 'f4']), token('d3', [...e5, 'd3']),
  token('main-Nc6', [...main, 'Nc6']), token('Bb5', [...main, 'Nc6', 'Bb5']),
  token('Bc4', [...main, 'Nc6', 'Bc4']), token('Bc5', [...main, 'Nc6', 'Bc4', 'Bc5']),
  token('a6', [...main, 'Nc6', 'Bb5', 'a6']),
]
const example = buildPlaybackNavigation({
  playablePositions: new Set(['example']),
  tokensBySectionIndex: new Map([[1, fixture.slice(0, 7)], [2, fixture.slice(7)]]),
}).get('example')!
for (const [from, to] of [
  ['d4', 'f4'], ['f4', 'main-Nc6'], ['d3', 'main-Nc6'], ['Bc5', 'a6'],
]) {
  assert.equal(getNextNavigationNode(example, from, getPreferredNextUpdates(example, from))?.id, to)
}
assert.equal(getNextNavigationNode(example, 'a6', {}), undefined)
assert.equal(getNextNavigationNode(example, 'Nf3', {})?.id, 'main-Nc6')
assert.equal(getPreviousNavigationNode(example, 'f4')?.id, 'alternative-Nc6')
assert.equal(getNextLineNode(example, 'Bc5', {}), undefined)

// An intervening board blocks a fallback even if the original board resumes later.
const interrupted = buildPlaybackNavigation({
  playablePositions: new Set(['example', 'other']),
  tokensBySectionIndex: new Map([[1, [
    ...fixture.slice(0, 8), token('other-e4', e4, 'other'), ...fixture.slice(8),
  ]]]),
}).get('example')!
assert.equal(getNextNavigationNode(interrupted, 'f4', {}), undefined)

console.log('playbackNavigation tests passed')
