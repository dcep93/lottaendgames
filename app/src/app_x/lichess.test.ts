import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { chapterPayloadPath } from './chapterPayloadManifest'
import {
  hydrateRuntimeChapter,
  type RuntimeChapterPayload,
} from './chapterRuntime'
import { buildLichessAnalysisUrl, buildLichessEditorUrl } from './lichess'
import {
  getPreferredNextUpdates,
  type NavigationNode,
  type PositionNavigation,
} from './playbackNavigation'

const initialFen = '6k1/8/8/8/8/8/P7/7K w - - 0 1'
const mainLine = ['a4', 'Kf7', 'a5']
const alternateLine = ['a4', 'Kh7', 'a5']
const navigation = createNavigation()

const mainUrl = buildLichessAnalysisUrl({
  currentCursorId: 'a4',
  initialFen,
  navigation,
  preferredNextByCursor: {},
})
assert.ok(mainUrl)
assert.equal(new URL(mainUrl).hash, '#1')
assert.equal(getLeafFen(mainUrl), getLineFen(mainLine))

const alternateUrl = buildLichessAnalysisUrl({
  currentCursorId: 'kh7',
  initialFen,
  navigation,
  preferredNextByCursor: { a4: 'kh7' },
})
assert.ok(alternateUrl)
assert.equal(new URL(alternateUrl).hash, '#2')
assert.equal(getLeafFen(alternateUrl), getLineFen(alternateLine))

const preferredFromRootUrl = buildLichessAnalysisUrl({
  currentCursorId: null,
  initialFen,
  navigation,
  preferredNextByCursor: { a4: 'kh7', initial: 'a4' },
})
assert.ok(preferredFromRootUrl)
assert.equal(new URL(preferredFromRootUrl).hash, '#0')
assert.equal(getLeafFen(preferredFromRootUrl), getLineFen(alternateLine))

const blackToMoveUrl = buildLichessAnalysisUrl({
  currentCursorId: null,
  initialFen: '8/8/8/8/8/3Kpk2/R7/8 b - - 5 5',
  preferredNextByCursor: {},
})
assert.ok(blackToMoveUrl)
assert.equal(new URL(blackToMoveUrl).hash, '#9')

const detachedRootFen = '5k2/8/5PK1/8/8/8/8/8 b - - 0 1'
const detachedChess = new Chess(detachedRootFen)
detachedChess.move('Kg8')
const detachedNode: NavigationNode = {
  display: '1...Kg8',
  fen: detachedChess.fen(),
  id: 'kg8',
  parentFen: detachedRootFen,
  path: ['Kg8'],
  positionNumber: 'test',
  previousId: null,
  san: 'Kg8',
  type: 'move',
}
const detachedUrl = buildLichessAnalysisUrl({
  currentCursorId: detachedNode.id,
  initialFen: '5k2/8/5PK1/8/8/8/8/8 w - - 0 1',
  navigation: {
    defaultNextByCursor: new Map(),
    nodesById: new Map([[detachedNode.id, detachedNode]]),
    positionNumber: 'test',
  },
  preferredNextByCursor: {},
})
assert.ok(detachedUrl)
assert.equal(new URL(detachedUrl).hash, '#2')
assert.equal(getLeafFen(detachedUrl), detachedNode.fen)

assert.equal(
  buildLichessAnalysisUrl({
    currentCursorId: 'missing',
    initialFen,
    navigation,
    preferredNextByCursor: {},
  }),
  null,
)

assert.equal(
  buildLichessEditorUrl('8/8/1k6/8/P2P4/8/8/K7 b - - 0 1'),
  'https://lichess.org/editor/8/8/1k6/8/P2P4/8/8/K7_b_-_-',
)
assert.equal(
  buildLichessEditorUrl('8/8/1k6/8/P2P4/8/8/8 b - - 0 1'),
  null,
)
assert.equal(
  buildLichessEditorUrl('8/8/8/8/P2P4/8/8/K7 b - - 0 1'),
  null,
)
assert.equal(buildLichessEditorUrl('8/8/8/8/8/8/8/8 w - - 0 1'), null)
assert.equal(buildLichessEditorUrl('not a fen'), null)
assert.equal(
  buildLichessAnalysisUrl(
    {
      currentCursorId: null,
      initialFen,
      navigation,
      preferredNextByCursor: {},
    },
    10,
  ),
  null,
)

const runtimePayload = JSON.parse(
  readFileSync(
    new URL(`../../public/${chapterPayloadPath}`, import.meta.url),
    'utf8',
  ),
) as RuntimeChapterPayload
let auditedLinkCount = 0

for (const runtimeChapter of runtimePayload.chapters) {
  const moveTokenIds = runtimeChapter.playback.tokensBySectionIndex.flatMap(
    ([, tokens]) =>
      tokens.flatMap((token) => (token.type === 'move' ? [token.id] : [])),
  )
  assert.equal(
    new Set(moveTokenIds).size,
    moveTokenIds.length,
    `Expected unique move token IDs in chapter ${runtimeChapter.id}`,
  )
  const chapter = hydrateRuntimeChapter(runtimeChapter)

  for (const [positionNumber, positionFen] of Object.entries(
    chapter.initialPositionFens,
  )) {
    const positionNavigation = chapter.navigationByPosition.get(positionNumber)
    assertLichessUrl(
      buildLichessAnalysisUrl({
        currentCursorId: null,
        initialFen: positionFen,
        navigation: positionNavigation,
        preferredNextByCursor: {},
      }),
      `${runtimeChapter.id}:${positionNumber}:initial`,
    )

    if (!positionNavigation) {
      continue
    }

    for (const node of positionNavigation.nodesById.values()) {
      assertLichessUrl(
        buildLichessAnalysisUrl({
          currentCursorId: node.id,
          initialFen: positionFen,
          navigation: positionNavigation,
          preferredNextByCursor: getPreferredNextUpdates(
            positionNavigation,
            node.id,
          ),
        }),
        `${runtimeChapter.id}:${positionNumber}:${node.id}`,
      )
    }
  }
}

assert.ok(auditedLinkCount > 100, 'Expected to audit promoted board links')
console.log(`Lichess link tests passed (${auditedLinkCount} links audited)`)

function createNavigation(): PositionNavigation {
  const nodes = [
    createNode('a4', 'a4', ['a4'], null),
    createNode('kf7', 'Kf7', ['a4', 'Kf7'], 'a4'),
    createNode('a5-main', 'a5', mainLine, 'kf7'),
    createNode('kh7', 'Kh7', ['a4', 'Kh7'], 'a4'),
    createNode('a5-alternate', 'a5', alternateLine, 'kh7'),
  ]

  return {
    defaultNextByCursor: new Map([
      ['initial', 'a4'],
      ['a4', 'kf7'],
      ['kf7', 'a5-main'],
      ['kh7', 'a5-alternate'],
    ]),
    nodesById: new Map(nodes.map((node) => [node.id, node])),
    positionNumber: 'test',
  }
}

function createNode(
  id: string,
  san: string,
  path: string[],
  previousId: string | null,
): NavigationNode {
  return {
    display: san,
    fen: getLineFen(path),
    id,
    parentFen: getLineFen(path.slice(0, -1)),
    path,
    positionNumber: 'test',
    previousId,
    san,
    type: 'move',
  }
}

function getLineFen(line: string[]) {
  const chess = new Chess(initialFen)

  for (const san of line) {
    chess.move(san)
  }

  return chess.fen()
}

function getLeafFen(url: string) {
  const parsedUrl = new URL(url)
  const encodedPgn = parsedUrl.pathname.slice('/analysis/pgn/'.length)
  const pgn = decodeURIComponent(encodedPgn)
    .replaceAll('_', ' ')
    .replaceAll('+', ' ')
  const chess = new Chess()
  chess.loadPgn(pgn)
  return chess.fen()
}

function assertLichessUrl(url: string | null, context: string) {
  assert.ok(url, `Expected a valid Lichess URL for ${context}`)
  assert.ok(
    new URL(url).pathname.slice('/analysis/pgn/'.length).length <= 5000,
    `Expected an in-limit Lichess URL for ${context}`,
  )
  auditedLinkCount += 1
}
