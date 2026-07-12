import assert from 'node:assert/strict'
import chapterData from './pdf/chapter_5.json'
import type { RawChapterSection } from './chapterTypes'
import {
  buildChapterPlayback,
  type TextPlaybackToken,
} from './moveParser'
import {
  buildPlaybackNavigation,
  getNextNavigationNode,
  getParentFenForNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationNode,
} from './playbackNavigation'
import { isOneMoveFenTransition } from './playbackPaths'

const chapterSections = chapterData as RawChapterSection[]
const playback = buildChapterPlayback(chapterSections)
const navigationByPosition = buildPlaybackNavigation(playback)
const positionFiveOneIndex = chapterSections.findIndex(
  (section) =>
    section.type === 'position' &&
    (section.content as { number?: string }).number === '5.1',
)
const moveSectionIndex = positionFiveOneIndex + 1
const proseSectionIndex = positionFiveOneIndex + 2
const moveTokens = getMoveTokens(moveSectionIndex)
const proseTokens = getMoveTokens(proseSectionIndex)
const positionFiveOneNavigation = navigationByPosition.get('5.1')
const positionFiveOneInitialFen = '4R3/8/7K/8/1kp5/8/8/8 w - - 0 1'

assert.equal(positionFiveOneIndex, 4)
assert.equal(playback.playablePositions.has('5.1'), true)
assert.ok(positionFiveOneNavigation, 'Expected navigation for position 5.1')

assert.deepEqual(findMove(moveTokens, '1.Kg5!').path, ['Kg5'])

assert.deepEqual(findMove(moveTokens, 'Kb3', 0).path, [
  'c3',
  'Kg5',
  'c2',
  'Rc8',
  'Kb3',
])

assert.deepEqual(findMove(moveTokens, '5.Kd2').path, [
  'Kg5',
  'c3',
  'Kf4',
  'c2',
  'Rc8',
  'Kb3',
  'Ke3',
  'Kb2',
  'Kd2',
])

assert.deepEqual(findMove(proseTokens, '1.Rc8?').path, ['Rc8'])
assert.deepEqual(findMove(proseTokens, '1...Kc3!').path, ['Rc8', 'Kc3'])
assert.equal(playback.tokensBySectionIndex.has(1), false)
assert.equal(
  isOneMoveFenTransition(
    positionFiveOneInitialFen,
    findMove(moveTokens, '1.Kg5!').fen,
  ),
  true,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '1.Kg5!').fen,
    findMove(moveTokens, '1...c3', 1).fen,
  ),
  true,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '1.Kg5!').fen,
    findMove(moveTokens, '1...c3', 0).fen,
  ),
  false,
)
assert.equal(
  isOneMoveFenTransition(
    positionFiveOneInitialFen,
    findMove(moveTokens, 'Kb3', 0).fen,
  ),
  false,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '5.Kd2').fen,
    findMove(proseTokens, '1...Kc3!').fen,
  ),
  false,
)
assert.equal(
  isOneMoveFenTransition(
    findMove(moveTokens, '5.Kd2').fen,
    positionFiveOneInitialFen,
  ),
  false,
)

const firstMove = getNextNavigationNode(positionFiveOneNavigation, null, {})
assert.ok(firstMove, 'Expected a main first move for position 5.1')
assert.equal(firstMove?.id, findMove(moveTokens, '1.Kg5!').id)
assert.equal(getPreviousNavigationNode(positionFiveOneNavigation, firstMove.id), null)

const branchPreference = getPreferredNextUpdates(
  positionFiveOneNavigation,
  findMove(moveTokens, '5.Kd2').id,
)
assert.equal(
  getNextNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '1.Kg5!').id,
    branchPreference,
  )?.id,
  findMove(moveTokens, '1...c3', 1).id,
)
assert.equal(
  getNextNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '1.Kg5!').id,
    {},
  )?.id,
  findMove(moveTokens, '1...c3', 1).id,
)
assert.equal(
  getNextNavigationNode(positionFiveOneNavigation, null, branchPreference)?.id,
  findMove(moveTokens, '1.Kg5!').id,
)
assert.equal(
  getParentFenForNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '1.Kg5!').id,
    positionFiveOneInitialFen,
  ),
  positionFiveOneInitialFen,
)
assert.equal(
  getParentFenForNavigationNode(
    positionFiveOneNavigation,
    findMove(moveTokens, '5.Kd2').id,
    positionFiveOneInitialFen,
  ),
  findMove(moveTokens, 'Kb2').fen,
)
assert.equal(
  getParentFenForNavigationNode(
    positionFiveOneNavigation,
    'missing-node',
    positionFiveOneInitialFen,
  ),
  undefined,
)

console.log('moveParser tests passed')

function getMoveTokens(sectionIndex: number) {
  const tokens = playback.tokensBySectionIndex.get(sectionIndex)

  if (!tokens) {
    assert.fail(`Expected playback tokens for section ${sectionIndex}`)
  }

  return tokens.filter(isMoveToken)
}

function findMove(
  tokens: Array<Extract<TextPlaybackToken, { type: 'move' }>>,
  display: string,
  occurrence = 0,
) {
  const matches = tokens.filter((token) => token.display === display)
  const token = matches[occurrence]

  assert.ok(token, `Expected move token ${display} occurrence ${occurrence}`)

  return token
}

function isMoveToken(
  token: TextPlaybackToken,
): token is Extract<TextPlaybackToken, { type: 'move' }> {
  return token.type === 'move'
}
