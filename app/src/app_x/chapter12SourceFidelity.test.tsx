import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { Chess } from 'chess.js'
import {
  bookPathForChapterId,
  bookPositionAnchorId,
  resolveAppRoute,
} from '../routing'
import BookFrontMatter from './BookFrontMatter'
import { PositionStudyGroup } from './ChapterViewer'
import type { RuntimeChapterDefinition } from './chapterRuntime'
import type {
  BookPartSource,
  BookSource,
  DiagramSection,
  PositionSection,
  RawChapterSection,
} from './chapterTypes'
import InstructionalDiagram from './InstructionalDiagram'
import { buildChapterPlayback, type TextPlaybackToken } from './moveParser'
import {
  buildPlaybackNavigation,
  getNextNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationNode,
} from './playbackNavigation'

type MoveToken = Extract<TextPlaybackToken, { type: 'move' }>
type BoardSection = DiagramSection | PositionSection

type PageCopyExpectation = {
  includes: string[]
  pdfPage: number
  printPage: number
}

type SourcePath = {
  fen: string
  label: string
  position: string
  san: string[]
}

type ExpectedTransition = {
  fen: string
  parentFen: string
  path: string[]
  san: string
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const sourcePaths = JSON.parse(
  readFileSync(new URL('./chapter12SourcePaths.json', import.meta.url), 'utf8'),
) as SourcePath[]
const chapter = getChapter()
const playback = buildChapterPlayback(chapter.sections)
const navigationByPosition = buildPlaybackNavigation(playback)

assert.equal(chapter.sections.length, 156)
assert.deepEqual(
  chapter.sections
    .filter((section) => section.type === 'ending')
    .map((section) => section.content),
  [
    { number: '77', text: 'Doubled pawns' },
    { number: '78', text: 'Isolated pawns' },
    { number: '79', text: 'Blocked pawns. Key squares' },
    { number: '80', text: "Less advanced (or rook's) blocked pawns" },
    { number: '81', text: 'Pawns on adjacent files' },
    { number: '82', text: 'Passed pawns. Dual-purpose king manoeuvres' },
    { number: '83', text: "Rook's pawns and one distant passed pawn" },
    { number: '84', text: 'The passed pawn is central and near' },
    { number: '85', text: "A passed Bishop's pawn on the same wing" },
    {
      number: '86',
      text: 'The defending side has moved his pawn. Triangulation',
    },
    { number: '87', text: "Knight's and rook's pawn against rook's pawn" },
    { number: '88', text: 'A king against 2 passed pawns' },
    { number: '89', text: 'Protected passed pawns' },
    { number: '90', text: 'Distant passed pawns' },
    { number: '91', text: 'Doubled pawns' },
    { number: '92', text: 'Breakthroughs when the king is far' },
  ],
)

const pageCopyUnits: PageCopyExpectation[] = [
  {
    pdfPage: 170,
    printPage: 169,
    includes: [
      '12. Pawn endings',
      'Section 1. King + 2 pawns vs. King',
      'Doubled pawns',
    ],
  },
  {
    pdfPage: 171,
    printPage: 170,
    includes: [
      'Two doubled pawns always win',
      'The less advanced pawn is on the 5th rank',
    ],
  },
  {
    pdfPage: 172,
    printPage: 171,
    includes: ['Mutual defence', 'fails to support his pawns in time'],
  },
  {
    pdfPage: 173,
    printPage: 172,
    includes: [
      'Section 2. King + Pawn vs. King + Pawn',
      'Blocked pawns. Key squares',
    ],
  },
  {
    pdfPage: 174,
    printPage: 173,
    includes: ['Reserving squares to attack', 'With more pawns on the board'],
  },
  {
    pdfPage: 175,
    printPage: 174,
    includes: [
      "Less advanced (or rook's) blocked pawns",
      'Occupying a key square',
    ],
  },
  {
    pdfPage: 176,
    printPage: 175,
    includes: [
      "Manoeuvres previous to the capture of the pawn. The king's multiple routes",
      '141 possible routes',
    ],
  },
  {
    pdfPage: 177,
    printPage: 176,
    includes: ['reach c7 at that moment', 'Conclusion: (Endings 79 and 80)'],
  },
  {
    pdfPage: 178,
    printPage: 177,
    includes: [
      'Pawns on adjacent files',
      'Giving up the pawn to change key squares',
    ],
  },
  {
    pdfPage: 179,
    printPage: 178,
    includes: ['Dual-purpose king manoeuvres', 'Duras, 1905'],
  },
  {
    pdfPage: 180,
    printPage: 179,
    includes: ["Réti's study", "King's multiple routes"],
  },
  {
    pdfPage: 181,
    printPage: 180,
    includes: ['Ljubojevic - Browne', 'Analysis diagram 12.14'],
  },
  {
    pdfPage: 182,
    printPage: 181,
    includes: [
      'Section 3. Two pawns vs. one',
      "Rook's pawns and one distant passed pawn",
    ],
  },
  {
    pdfPage: 183,
    printPage: 182,
    includes: [
      "If the stronger side has his rook's pawn already on the 5th (or 6th) rank",
      'Blocked pawns not on the 5th rank yet',
    ],
  },
  {
    pdfPage: 184,
    printPage: 183,
    includes: [
      'This position deserves another diagram',
      'The passed pawn is best placed as far from promotion as possible',
    ],
  },
  {
    pdfPage: 185,
    printPage: 184,
    includes: ['Drawing lines', 'The passed pawn is central and near'],
  },
  {
    pdfPage: 186,
    printPage: 185,
    includes: [
      'Blocked pawn on the 6th rank',
      'Immediate counterattack by 4...Kc5',
    ],
  },
  {
    pdfPage: 187,
    printPage: 186,
    includes: ['Analysis diagram 12.21', 'Blocked pawn on the 4th rank'],
  },
  {
    pdfPage: 188,
    printPage: 187,
    includes: [
      'Summary of Ending 84',
      "A passed Bishop's pawn on the same wing",
    ],
  },
  {
    pdfPage: 189,
    printPage: 188,
    includes: [
      'The defending side has moved his pawn. Triangulation',
      'corresponding squares',
    ],
  },
  {
    pdfPage: 190,
    printPage: 189,
    includes: [
      '1.Kd4!',
      'the idea of triangulation is more important than the final result',
    ],
  },
  {
    pdfPage: 191,
    printPage: 190,
    includes: [
      "Knight's and rook's pawn against rook's pawn",
      'All pawns are on the 2nd rank',
    ],
  },
  {
    pdfPage: 192,
    printPage: 191,
    includes: ['Steinitz Rule', 'Analysis diagram 12.27'],
  },
  {
    pdfPage: 193,
    printPage: 192,
    includes: [
      'Back to the main line',
      'his black counterpart',
      'Analysis diagram 12.28',
    ],
  },
  {
    pdfPage: 194,
    printPage: 193,
    includes: ["Bird's colour rule", 'Same position, White to move'],
  },
  {
    pdfPage: 195,
    printPage: 194,
    includes: ['A pawn is already advanced', 'An important defensive position'],
  },
  {
    pdfPage: 196,
    printPage: 195,
    includes: ['Conclusions', 'saving move'],
  },
  {
    pdfPage: 197,
    printPage: 196,
    includes: [
      'Section 4. Multi-pawn endgames. Some themes in pawn endings',
      'The floating square',
    ],
  },
  {
    pdfPage: 198,
    printPage: 197,
    includes: ['Pawns separated by three files', 'Pawns separated by one file'],
  },
  {
    pdfPage: 199,
    printPage: 198,
    includes: [
      'Protected passed pawns',
      'the black king manages to stay inside the square of the enemy pawn and defend his pawn',
    ],
  },
  {
    pdfPage: 200,
    printPage: 199,
    includes: [
      'The defending pawn is two files out of the square',
      'Protected passed pawn on the 6th rank',
    ],
  },
  {
    pdfPage: 201,
    printPage: 200,
    includes: [
      'Distant passed pawns',
      'In this ideal example White wins using the standard plan',
    ],
  },
  {
    pdfPage: 202,
    printPage: 201,
    includes: ['Crippled majority', 'When the right moment comes'],
  },
  {
    pdfPage: 203,
    printPage: 202,
    includes: [
      'Pawn majority on one wing, doubled pawn on the other',
      'Breakthroughs when the king is far',
    ],
  },
  {
    pdfPage: 204,
    printPage: 203,
    includes: [
      'Preparing a breakthrough. An innocent couple of pawns',
      'Capablanca',
    ],
  },
]

assert.equal(pageCopyUnits.length, 35)
assert.deepEqual(
  pageCopyUnits.map(({ pdfPage }) => pdfPage),
  Array.from({ length: 35 }, (_, index) => 170 + index),
)
assert.deepEqual(
  pageCopyUnits.map(({ printPage }) => printPage),
  Array.from({ length: 35 }, (_, index) => 169 + index),
)

const visibleChapterText = chapter.sections.map(getVisibleSourceText).join('\n')
for (const unit of pageCopyUnits) {
  for (const expectedText of unit.includes) {
    assert.equal(
      visibleChapterText.includes(expectedText),
      true,
      `PDF ${unit.pdfPage} must retain: ${expectedText}`,
    )
  }
}
for (const staleText of [
  'reach c7 on that moment',
  'Immediate counterattack by 4...Kb5',
  'When it comes the right moment',
]) {
  assert.equal(visibleChapterText.includes(staleText), false)
}
assert.equal(
  createHash('sha256')
    .update(
      JSON.stringify(
        chapter.sections.filter(
          (section) => !['diagram', 'position'].includes(section.type),
        ),
      ),
    )
    .digest('hex'),
  'b0257e7dec2870f5bfce9246ecedd5607234b98b0d9f73b42100a451b5e06ebc',
  'Chapter 12 copy and hierarchy must remain source-authoritative',
)

const expectedBoardNumbers = [
  ...Array.from({ length: 12 }, (_, index) => `12.${index + 1}`),
  '12.12-route-counts',
  ...Array.from({ length: 30 }, (_, index) => `12.${index + 13}`),
]
const boardSections = chapter.sections
  .map((section, sectionIndex) => ({ section, sectionIndex }))
  .filter((entry): entry is { section: BoardSection; sectionIndex: number } =>
    isBoardSection(entry.section),
  )
assert.equal(boardSections.length, 43)
assert.deepEqual(
  boardSections.map(({ section }) => boardContent(section).number),
  expectedBoardNumbers,
)

const expectedInitialFen = new Map<string, string>()
for (const source of sourcePaths) {
  if (!expectedInitialFen.has(source.position)) {
    expectedInitialFen.set(source.position, source.fen)
  }
}
for (const { section } of boardSections) {
  const content = boardContent(section)
  assert.equal(content.orientation, 'white', `${content.number} orientation`)
  if (content.number === '12.12-route-counts') {
    assert.equal(content.fen, '7K/8/2P5/8/8/8/8/8')
  } else {
    assert.equal(
      content.fen,
      expectedInitialFen.get(content.number),
      `${content.number} source FEN`,
    )
  }
}
assert.equal(
  createHash('sha256')
    .update(JSON.stringify(boardSections.map(({ section }) => section.content)))
    .digest('hex'),
  'c52c6edc55d76694dc9969350671eeed33ac793ad2e21a05eb6df05d04a1339c',
  'Chapter 12 board semantics must remain source-authoritative',
)

assert.deepEqual(markerTriples(getPosition('12.4')), [
  ['a6', '★', undefined],
  ['c6', '★', undefined],
  ['d6', '★', undefined],
  ['e6', '★', undefined],
  ['a5', '★', undefined],
  ['c5', '★', undefined],
  ['d5', '★', undefined],
  ['e5', '★', undefined],
])
assert.deepEqual(markerTriples(getPosition('12.5')).slice(-2), [
  ['d7', '●', undefined],
  ['f4', '●', undefined],
])
assert.deepEqual(markerTriples(getPosition('12.9')), [
  ['c7', '★', undefined],
  ['h2', '♚', undefined],
])
assert.deepEqual(markerTriples(getPosition('12.24')), [
  ['d8', '2', 'label'],
  ['c7', '1', 'label'],
  ['d6', '2', 'label'],
  ['c8', '3', 'label'],
  ['d5', '3', 'label'],
  ['c5', '1', 'label'],
])
assert.deepEqual(markerTriples(getPosition('12.33')), [
  ['c6', '★', undefined],
  ['c5', '★', undefined],
  ['c4', '★', undefined],
])

const starBoardMarkup = ['12.4', '12.5', '12.8', '12.9', '12.33']
  .map((number) => {
    const board = boardSections.find(
      ({ section }) => boardContent(section).number === number,
    )
    assert.ok(board)
    return renderPosition(board.sectionIndex)
  })
  .join('')
assert.equal(
  (starBoardMarkup.match(/leg-board-marker-glyph">★<\/span>/g) ?? []).length,
  25,
)
assert.equal(
  (starBoardMarkup.match(/aria-label="star marker on /g) ?? []).length,
  25,
)
assert.equal(starBoardMarkup.includes('aria-label="* marker on '), false)
assert.deepEqual(getPosition('12.8').content.routes, [
  {
    meaning: "White king's successful first route leg as printed",
    squares: ['h4', 'e1'],
    style: 'arrow',
  },
  {
    meaning: "White king's successful second route leg as printed",
    squares: ['e1', 'b4'],
    style: 'arrow',
  },
])
const positionTwelveEight = boardSections.find(
  ({ section }) => boardContent(section).number === '12.8',
)
assert.ok(positionTwelveEight)
assert.equal(
  (renderPosition(positionTwelveEight.sectionIndex).match(/marker-end=/g) ?? [])
    .length,
  2,
  'Position 12.8 must render an arrowhead at the end of each printed route leg',
)
assert.deepEqual(getPosition('12.18').content.routes, [
  {
    meaning: "Black king's route to the collision line",
    squares: ['b4', 'f8'],
    style: 'arrow',
  },
  {
    meaning: "White king's route to the collision line",
    squares: ['h5', 'g6'],
    style: 'arrow',
  },
])
for (const [number, squares] of [
  ['12.32', ['a5', 'd5', 'd2', 'a2', 'a5']],
  ['12.33', ['a6', 'e6', 'e2', 'a2', 'a6']],
  ['12.34', ['a3', 'c3', 'c1', 'a1', 'a3']],
  ['12.35', ['c8', 'f8', 'f5', 'c5', 'c8']],
  ['12.36', ['c8', 'f8', 'f5', 'c5', 'c8']],
  ['12.37', ['d8', 'f8', 'f6', 'd6', 'd8']],
] as const) {
  assert.deepEqual(
    getPosition(number).content.routes?.map(({ squares, style }) => ({
      squares,
      style,
    })),
    [{ squares, style: 'outline' }],
  )
}

const routeCounts = getDiagram('12.12-route-counts')
assert.equal(routeCounts.content.label, "King's multiple routes")
assert.equal(routeCounts.content.markers?.length, 18)
assert.deepEqual(
  routeCounts.content.markers
    ?.filter(({ variant }) => variant === 'emphasis')
    .map(({ square, symbol }) => [square, symbol]),
  [
    ['g7', '1'],
    ['d6', '9'],
    ['f6', '1'],
    ['e5', '1'],
  ],
)
const routeMarkup = renderToStaticMarkup(
  <InstructionalDiagram section={routeCounts} />,
)
assert.equal(
  routeMarkup.includes(`id="${bookPositionAnchorId('12.12-route-counts')}"`),
  true,
)
assert.equal(
  routeMarkup.includes(
    'aria-label="King&#x27;s multiple routes instructional chess diagram"',
  ),
  true,
)

for (const { section, sectionIndex } of boardSections) {
  const content = boardContent(section)
  const anchorId = bookPositionAnchorId(content.number)
  assert.deepEqual(
    resolveAppRoute(bookPathForChapterId('12'), `#${anchorId}`).route,
    {
      anchorId,
      chapterId: '12',
      module: 'book',
    },
  )
  if (section.type !== 'position') continue
  const markup = renderPosition(sectionIndex)
  assert.equal(markup.includes(`id="${anchorId}"`), true)
  assert.equal(
    markup.includes(`aria-labelledby="position-${content.number}-heading"`),
    true,
  )
}

assert.equal(sourcePaths.length, 119)
assert.equal(
  createHash('sha256')
    .update(
      sourcePaths
        .map(
          ({ position, label, fen, san }) =>
            `${position}|${label}|${fen}|${san.join(' ')}`,
        )
        .join('\n'),
    )
    .digest('hex'),
  '93fb989d026bda64ab0f8a6f736bc3d0f27f566616ce4b2fbb37b8c781a8e6e1',
  'Chapter 12 source fixture digest',
)

for (const [sectionIndex, tokens] of playback.tokensBySectionIndex) {
  assert.equal(
    tokens
      .filter((token) => token.type !== 'move' || !token.hidden)
      .map((token) => (token.type === 'text' ? token.text : token.display))
      .join(''),
    getPlayableSectionText(chapter.sections[sectionIndex]),
    `Playback tokenization must preserve Chapter 12 section ${sectionIndex}`,
  )
}

const moveTokens = [...playback.tokensBySectionIndex.values()]
  .flat()
  .filter((token): token is MoveToken => token.type === 'move')
const visibleMoveTokens = moveTokens.filter((token) => !token.hidden)
const hiddenMoveTokens = moveTokens.filter((token) => token.hidden)
assert.equal(visibleMoveTokens.length, 800)
assert.equal(hiddenMoveTokens.length, 65)
assert.equal(moveTokens.length, 865)
for (const token of moveTokens) {
  const chess = new Chess(token.parentFen)
  const move = chess.move(token.san, { strict: true })
  assert.ok(move, `Non-replayable emitted SAN: ${token.display}`)
  assert.equal(chess.fen(), token.fen)
  assert.equal(
    token.path.some((part) => part.startsWith('@')),
    false,
  )
  if (token.hidden) {
    assert.ok(token.sourceId)
    assert.equal(
      moveTokens.some(
        (candidate) => candidate.id === token.sourceId && !candidate.hidden,
      ),
      true,
      `Hidden token ${token.id} must alias a visible source token`,
    )
  }
}

const tokensByPath = new Map<string, MoveToken[]>()
for (const token of moveTokens) {
  const key = playbackPathKey(token.positionNumber, token.path)
  tokensByPath.set(key, [...(tokensByPath.get(key) ?? []), token])
}
assert.equal(tokensByPath.size, 861)
const duplicatePathGroups = [...tokensByPath.entries()]
  .filter(([, tokens]) => tokens.length > 1)
  .map(([, tokens]) => ({
    count: tokens.length,
    path: tokens[0].path.join(' '),
    position: tokens[0].positionNumber,
    transitionCount: new Set(
      tokens.map((token) =>
        transitionKey(token.parentFen, token.san, token.fen),
      ),
    ).size,
  }))
assert.deepEqual(duplicatePathGroups, [
  { count: 2, path: 'Kc5', position: '12.11', transitionCount: 1 },
  { count: 2, path: 'Kf6', position: '12.23', transitionCount: 1 },
  {
    count: 2,
    path: 'Kd5 Kd3 Ke5 Kc3 Kd5 Kb4 Kc6 Ka5 Kc5 f6',
    position: '12.35',
    transitionCount: 1,
  },
  { count: 2, path: 'b6', position: '12.41', transitionCount: 2 },
])

const sourceGlobalTransitions = new Set<string>()
const sourcePositionTransitions = new Set<string>()
const sourcePrefixKeys = new Set<string>()
const sourceLeafKeys = new Set<string>()
let verifiedPaths = 0
let verifiedPlies = 0

for (const source of sourcePaths) {
  const chess = new Chess(source.fen)
  const expectedTransitions: ExpectedTransition[] = []
  const canonicalPath: string[] = []
  for (const sourceSan of source.san) {
    const parentFen = chess.fen()
    const move = chess.move(sourceSan, { strict: true })
    assert.ok(move, `${source.position} ${source.label}: ${sourceSan}`)
    canonicalPath.push(move.san)
    const transition = {
      fen: chess.fen(),
      parentFen,
      path: [...canonicalPath],
      san: move.san,
    }
    expectedTransitions.push(transition)
    sourceGlobalTransitions.add(
      transitionKey(transition.parentFen, transition.san, transition.fen),
    )
    sourcePositionTransitions.add(
      positionTransitionKey(
        source.position,
        transition.parentFen,
        transition.san,
        transition.fen,
      ),
    )
    sourcePrefixKeys.add(playbackPathKey(source.position, canonicalPath))
    const candidates =
      tokensByPath.get(playbackPathKey(source.position, canonicalPath)) ?? []
    assert.equal(
      candidates.some(
        (candidate) =>
          candidate.parentFen === transition.parentFen &&
          candidate.fen === transition.fen &&
          candidate.san === transition.san,
      ),
      true,
      `${source.position} ${source.label} is missing ${canonicalPath.join(' ')}`,
    )
    verifiedPlies += 1
  }

  sourceLeafKeys.add(playbackPathKey(source.position, canonicalPath))
  const navigation = navigationByPosition.get(source.position)
  assert.ok(navigation, `Missing navigation for ${source.position}`)
  const finalTransition = expectedTransitions.at(-1)
  assert.ok(finalTransition)
  const leafCandidates = (
    tokensByPath.get(playbackPathKey(source.position, canonicalPath)) ?? []
  ).filter(
    (token) =>
      token.parentFen === finalTransition.parentFen &&
      token.fen === finalTransition.fen &&
      token.san === finalTransition.san,
  )
  assert.ok(leafCandidates.length > 0)

  let traversedIds: string[] | null = null
  for (const leaf of leafCandidates) {
    const preferred = getPreferredNextUpdates(navigation, leaf.id)
    const ids: string[] = []
    let cursorId: string | null = null
    let complete = true
    for (const expected of expectedTransitions) {
      const next = getNextNavigationNode(navigation, cursorId, preferred)
      if (
        !next ||
        positionKey(next.parentFen) !== positionKey(expected.parentFen) ||
        positionKey(next.fen) !== positionKey(expected.fen) ||
        next.san !== expected.san
      ) {
        complete = false
        break
      }
      ids.push(next.id)
      cursorId = next.id
    }
    if (complete) {
      traversedIds = ids
      break
    }
  }
  assert.ok(
    traversedIds,
    `${source.position} ${source.label} cannot traverse with Next`,
  )
  let cursorId: string | null = traversedIds.at(-1) ?? null
  for (let index = traversedIds.length - 1; index >= 0; index -= 1) {
    const previous = getPreviousNavigationNode(navigation, cursorId)
    if (index === 0) {
      assert.equal(previous, null)
      cursorId = null
    } else {
      assert.equal(
        previous?.id,
        traversedIds[index - 1],
        `${source.position} ${source.label} Previous at ply ${index + 1}`,
      )
      cursorId = previous!.id
    }
  }
  verifiedPaths += 1
}

assert.equal(verifiedPaths, 119)
assert.equal(verifiedPlies, 1104)
assert.equal(sourceGlobalTransitions.size, 774)
assert.equal(sourcePositionTransitions.size, 858)
assert.equal(sourcePrefixKeys.size, 861)

const appGlobalTransitions = new Set(
  moveTokens.map((token) =>
    transitionKey(token.parentFen, token.san, token.fen),
  ),
)
const appPositionTransitions = new Set(
  moveTokens.map((token) =>
    positionTransitionKey(
      token.positionNumber,
      token.parentFen,
      token.san,
      token.fen,
    ),
  ),
)
assert.deepEqual(appGlobalTransitions, sourceGlobalTransitions)
assert.deepEqual(appPositionTransitions, sourcePositionTransitions)
assert.deepEqual(new Set(tokensByPath.keys()), sourcePrefixKeys)

const actualLeafKeys = new Set(
  moveTokens
    .filter(
      (candidate) =>
        !moveTokens.some(
          (other) =>
            other.positionNumber === candidate.positionNumber &&
            other.path.length > candidate.path.length &&
            candidate.path.every((san, index) => other.path[index] === san),
        ),
    )
    .map((token) => playbackPathKey(token.positionNumber, token.path)),
)
const maximalSourceLeafKeys = new Set(
  [...sourceLeafKeys].filter((candidateKey) => {
    const [position, encodedPath] = splitPlaybackPathKey(candidateKey)
    const path = encodedPath
    return ![...sourceLeafKeys].some((otherKey) => {
      const [otherPosition, otherPath] = splitPlaybackPathKey(otherKey)
      return (
        otherPosition === position &&
        otherPath.length > path.length &&
        path.every((san, index) => otherPath[index] === san)
      )
    })
  }),
)
assert.equal(sourceLeafKeys.size, 119)
assert.equal(maximalSourceLeafKeys.size, 117)
assert.deepEqual(actualLeafKeys, maximalSourceLeafKeys)
assert.equal(
  sourceLeafKeys.has(
    playbackPathKey('12.1', [
      'Kc3',
      'Kc7',
      'Kd4',
      'Kb6',
      'Kc4',
      'Kc7',
      'Kc5',
      'Kb7',
      'b6',
      'Kb8',
      'Kc6',
      'Kc8',
      'b7+',
      'Kb8',
      'b5',
      'Ka7',
    ]),
  ),
  true,
)
assert.equal(
  sourcePaths.some(
    ({ position, fen, san }) =>
      position === '12.41' &&
      fen.endsWith(' b - - 0 1') &&
      san.join(' ') === 'b6',
  ),
  true,
  'The alternate-turn 1...b6 record must not be lost to path-only deduplication',
)

const frontMatterMarkup = renderToStaticMarkup(
  <BookFrontMatter
    chapters={
      book.parts.filter(({ id }) =>
        /^\d+$/.test(id),
      ) as unknown as RuntimeChapterDefinition[]
    }
    onNavigate={() => undefined}
  />,
)
const frontMatterText = markupToText(frontMatterMarkup)
for (const expectedText of [
  'Position 12.19',
  'prints “4...Kb5” as an immediate counterattack',
  'print page 185; PDF page 186',
  'legal immediate counterattack after 4.Kd2 is 4...Kc5',
  'Position 12.9',
  'reach c7 “on that moment”',
  'print page 176; PDF page 177',
  'corrects the phrase to “at that moment.”',
  'Position 12.39',
  'says “When it comes the right moment”',
  'print page 201; PDF page 202',
  'corrects the phrase to “When the right moment comes.”',
]) {
  assert.equal(
    frontMatterText.includes(expectedText),
    true,
    `About must disclose: ${expectedText}`,
  )
}
for (const number of ['12.9', '12.19', '12.39']) {
  const href = `${bookPathForChapterId('12')}#${bookPositionAnchorId(number)}`
  assert.equal(
    frontMatterMarkup.includes(`href="${href}"`),
    true,
    `About correction must deep-link to ${href}`,
  )
}

console.log(
  'Chapter 12 source fidelity passed (35 page units, 43 diagrams, 78 total units; 119 replay paths / 1,104 plies / 774 global and 858 position-scoped transitions; 3 governed corrections)',
)

function boardContent(section: BoardSection) {
  return section.content
}

function getChapter(): BookPartSource {
  const part = book.parts.find(({ id }) => id === '12')
  assert.ok(part)
  return part
}

function getDiagram(number: string): DiagramSection {
  const section = chapter.sections.find((candidate) => {
    if (candidate.type !== 'diagram') return false
    return (candidate as DiagramSection).content.number === number
  }) as DiagramSection | undefined
  assert.ok(section)
  return section
}

function getPlayableSectionText(section: RawChapterSection) {
  if (section.type === 'text' && typeof section.content === 'string') {
    return section.content
  }
  if (
    section.type === 'panel' &&
    section.content &&
    typeof section.content === 'object' &&
    'text' in section.content &&
    typeof section.content.text === 'string'
  ) {
    return section.content.text
  }
  return ''
}

function getPosition(number: string): PositionSection {
  const section = chapter.sections.find((candidate) => {
    if (candidate.type !== 'position') return false
    return (candidate as PositionSection).content.number === number
  }) as PositionSection | undefined
  assert.ok(section)
  return section
}

function isBoardSection(section: RawChapterSection): section is BoardSection {
  return section.type === 'position' || section.type === 'diagram'
}

function getVisibleSourceText(section: RawChapterSection) {
  if (typeof section.content === 'string') return section.content
  if (!section.content || typeof section.content !== 'object') return ''
  return Object.entries(section.content)
    .filter(([key]) =>
      [
        'caption',
        'displayLabel',
        'label',
        'number',
        'subtitle',
        'text',
        'title',
      ].includes(key),
    )
    .map(([, value]) => (typeof value === 'string' ? value : ''))
    .join('\n')
}

function markerTriples(section: PositionSection) {
  return (
    section.content.markers?.map(({ square, symbol, variant }) => [
      square,
      symbol,
      variant,
    ]) ?? []
  )
}

function markupToText(markup: string) {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function playbackPathKey(positionNumber: string, path: string[]) {
  return `${positionNumber}\u001e${path.join('\u001f')}`
}

function positionKey(fen: string) {
  return fen.split(/\s+/).slice(0, 4).join(' ')
}

function positionTransitionKey(
  position: string,
  parentFen: string,
  san: string,
  fen: string,
) {
  return `${position}\u001e${transitionKey(parentFen, san, fen)}`
}

function renderPosition(sectionIndex: number) {
  return renderToStaticMarkup(
    <PositionStudyGroup
      activeBoards={{}}
      activePositionNumber={null}
      group={{ contentIndexes: [], index: sectionIndex, type: 'positionGroup' }}
      navigationByPosition={navigationByPosition}
      onAnchorSelect={() => undefined}
      onBookNavigate={() => undefined}
      onMoveClick={() => undefined}
      onPositionReset={() => undefined}
      onPositionStep={() => undefined}
      playback={playback}
      referencesBySectionIndex={new Map()}
      sections={chapter.sections}
    />,
  )
}

function splitPlaybackPathKey(key: string): [string, string[]] {
  const [position, encodedPath = ''] = key.split('\u001e')
  return [position, encodedPath ? encodedPath.split('\u001f') : []]
}

function transitionKey(parentFen: string, san: string, fen: string) {
  return `${positionKey(parentFen)}\u001e${san}\u001e${positionKey(fen)}`
}
