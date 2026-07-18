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

type BoardSection = DiagramSection | PositionSection
type MoveToken = Extract<TextPlaybackToken, { type: 'move' }>
type SourcePath = {
  fen: string
  label: string
  position: string
  san: string[]
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const sourcePaths = JSON.parse(
  readFileSync(new URL('./chapter13SourcePaths.json', import.meta.url), 'utf8'),
) as SourcePath[]
const chapter = book.parts.find(({ id }) => id === '13')!
assert.ok(chapter, 'Expected Chapter 13')
const playback = buildChapterPlayback(chapter.sections)
const navigationByPosition = buildPlaybackNavigation(playback)

const pageCopyUnits = [
  {
    pdfPage: 205,
    printPage: 204,
    includes: [
      '13. Other material relations',
      'Checkmating with Bishop and Knight',
    ],
  },
  {
    pdfPage: 206,
    printPage: 205,
    includes: ["Deletang's Method", 'that is, cornering the enemy king'],
  },
  {
    pdfPage: 207,
    printPage: 206,
    includes: ['Transferring our king to the centre', '11.Kc6'],
  },
  {
    pdfPage: 208,
    printPage: 207,
    includes: ['Remember this procedure for the moment.', "Knight's route"],
  },
  {
    pdfPage: 209,
    printPage: 208,
    includes: ['34.Nf6\nmate', 'Rook + Bishop vs. Rook'],
  },
  {
    pdfPage: 210,
    printPage: 209,
    includes: ['Philidor Position', 'only 1...Rd7+ works'],
  },
  { pdfPage: 211, printPage: 210, includes: ['5.Bb3!!', '4...Rc1'] },
  {
    pdfPage: 212,
    printPage: 211,
    includes: ['summary of the main ideas necessary', '12.Bc4!+-'],
  },
  {
    pdfPage: 213,
    printPage: 212,
    includes: [
      'Same position shifted one file to the left (Lolli)',
      "Same position, knight's file (Lolli)",
    ],
  },
  {
    pdfPage: 214,
    printPage: 213,
    includes: [
      "Same position, rook's file",
      'The king is far from the edge. Cochrane Defence',
    ],
  },
  { pdfPage: 215, printPage: 214, includes: ['Budnikov - Novik', '9.Bd5!?'] },
  { pdfPage: 216, printPage: 215, includes: ['9...Ra1!', '15.Bf5'] },
  {
    pdfPage: 217,
    printPage: 216,
    includes: ['get his king off the edge', '50...Re7 1/2-1/2'],
  },
  {
    pdfPage: 218,
    printPage: 217,
    includes: ['Second-rank defence', 'García González - Balashov'],
  },
  { pdfPage: 219, printPage: 218, includes: ['4...Rc2?', '17.Kf3'] },
  {
    pdfPage: 220,
    printPage: 219,
    includes: ['17...Rf2+!', 'Pawn on the 6th rank'],
  },
  {
    pdfPage: 221,
    printPage: 220,
    includes: ['avoiding the g8- and f7-squares', '3.Kg5 Bd5!'],
  },
  {
    pdfPage: 222,
    printPage: 221,
    includes: ["Rook + rook's pawn vs. Bishop", '1.Rc7 Bd3!'],
  },
  {
    pdfPage: 223,
    printPage: 222,
    includes: ['Pawn on the 5th rank', '3.Rg7+'],
  },
  {
    pdfPage: 224,
    printPage: 223,
    includes: ['Pawn on the 4th rank', '1.Kh6 Kg8'],
  },
  {
    pdfPage: 225,
    printPage: 224,
    includes: ['Queen vs. Rook + Pawn', 'The winning manoeuvre'],
  },
  { pdfPage: 226, printPage: 225, includes: ['11.Qc7!', '13.Kg3 Kf5'] },
  {
    pdfPage: 227,
    printPage: 226,
    includes: ['The defensive set-up', '5.Qa8 Rd6'],
  },
  {
    pdfPage: 228,
    printPage: 227,
    includes: ["Queen vs. Rook + Rook's Pawn", '8...Rb5+ 9.Kc6 Rb8'],
  },
  { pdfPage: 229, printPage: 228, includes: ['10...Rb7!', '13.Kc7 Rb5='] },
] as const

const expectedBoardFens: Record<string, string> = {
  '13.1': '8/8/8/8/8/1B1N4/8/8 w - - 0 1',
  '13.2': '8/4N3/5k2/8/8/4B3/8/8 w - - 0 1',
  '13.3': '3k4/8/8/1B1N4/8/8/8/8 w - - 0 1',
  '13.4': '8/8/8/8/4k3/8/6K1/6BN w - - 0 1',
  '13.5': '2k5/B1N5/2K5/8/8/8/8/8 b - - 0 16',
  '13.6': '8/B3N3/3K1k2/8/8/8/8/8 w - - 0 20',
  '13.7': '3k4/4r3/3K4/3B4/8/8/8/5R2 w - - 0 1',
  '13.8': '3k4/1R6/3K4/3B4/8/8/8/2r5 w - - 5 5',
  '13.9': '2k5/3r4/2K5/2B5/8/8/4R3/8 w - - 0 1',
  '13.10': '1k6/2r5/1K6/1B6/8/8/8/3R4 w - - 0 1',
  '13.11': 'k7/1r6/K7/B7/8/8/2R5/8 w - - 0 1',
  '13.12': '8/8/5k2/r7/4BK2/8/7R/8 b - - 0 1',
  '13.13': '8/4k3/6R1/r2B4/3K4/8/8/8 b - - 9 9',
  '13.14': '4k3/6R1/8/4K3/4B3/8/4r3/8 w - - 13 13',
  '13.15': '8/8/8/r2BK2k/8/8/8/6R1 w - - 29 29',
  '13.16': '8/6R1/7B/3K4/7k/8/4r3/8 b - - 0 1',
  '13.17': '8/7R/8/8/4KBk1/8/6r1/8 b - - 4 4',
  '13.18': '8/8/8/8/8/R4KB1/6r1/5k2 b - - 17 17',
  '13.19': '5k2/1R6/8/4KP2/2b5/8/8/8 w - - 0 1',
  '13.20': '5k2/1R6/5P2/3b2K1/8/8/8/8 w - - 4 4',
  '13.21': '7k/R7/7P/6K1/8/8/2b5/8 w - - 0 1',
  '13.22': '7k/1R6/8/6KP/8/8/2b5/8 w - - 0 1',
  '13.23': '6k1/6R1/7K/7P/8/3b4/8/8 b - - 3 3',
  '13.24': '7k/R7/8/6K1/7P/8/2b5/8 w - - 0 1',
  '13.25': '8/4k3/4p3/3r4/4K3/7Q/8/8 w - - 0 1',
  '13.26': '6Q1/8/4pk2/3r4/6K1/8/8/8 b - - 4 4',
  '13.27': '8/2Q5/4p3/3k1r2/6K1/8/8/8 b - - 11 11',
  '13.28': '4k3/4p3/3r4/4K3/7Q/8/8/8 w - - 0 1',
  '13.29': '8/1k6/p5Q1/1r6/1K6/8/8/8 w - - 0 1',
  '13.30': 'kr6/8/p1KQ4/8/8/8/8/8 b - - 10 10',
}

const checkpointRoots: Record<string, string> = {
  '13.5': '13.4',
  '13.6': '13.4',
  '13.8': '13.7',
  '13.13': '13.12',
  '13.14': '13.12',
  '13.15': '13.12',
  '13.17': '13.16',
  '13.18': '13.16',
  '13.20': '13.19',
  '13.23': '13.22',
  '13.26': '13.25',
  '13.27': '13.25',
  '13.30': '13.29',
}

assert.equal(chapter.sections.length, 101)
assert.equal(pageCopyUnits.length, 25)
assert.deepEqual(
  pageCopyUnits.map(({ pdfPage }) => pdfPage),
  Array.from({ length: 25 }, (_, index) => 205 + index),
)
assert.deepEqual(
  pageCopyUnits.map(({ printPage }) => printPage),
  Array.from({ length: 25 }, (_, index) => 204 + index),
)
const visibleChapterText = chapter.sections.map(getVisibleSourceText).join('\n')
for (const unit of pageCopyUnits) {
  for (const expected of unit.includes) {
    assert.equal(
      visibleChapterText.includes(expected),
      true,
      `PDF ${unit.pdfPage} / print ${unit.printPage} must retain ${expected}`,
    )
  }
}

for (const [expected, stale] of [
  ['that is, cornering the enemy king', 'that, is, cornering the enemy king'],
  [
    'Remember this procedure for the moment.',
    'Remember this procedure by the moment.',
  ],
  ['get his king off the edge.', 'get his king out of the edge.'],
  ['4...Kc8 5.Bd6+-) 5.Bd6 Rh1', '4...Kc8 5.Kd6+-) 5.Kd6 Rh1'],
  [
    '25...Re1 26.Be4 Ra1 27.Ke5 Ra5+ 28.Bd5 Rb5',
    '25...Re1 26.Be4 Rd1 27.Ke5 Rd5+ 28.Bd5 Rb5',
  ],
  ['4...Re2+! 5.Be3 Rg2', '4...Re2+! 5.Ke3 Rg2'],
  ['1...Rf5+ 2.Kg4 Rd5', '1...Rf5+ 2.Kg4 Kd5'],
] as const) {
  assert.equal(visibleChapterText.includes(expected), true, expected)
  assert.equal(visibleChapterText.includes(stale), false, stale)
}

const boardSections = chapter.sections
  .map((section, sectionIndex) => ({ section, sectionIndex }))
  .filter(
    (entry): entry is { section: BoardSection; sectionIndex: number } =>
      entry.section.type === 'diagram' || entry.section.type === 'position',
  )
assert.equal(boardSections.length, 30)
assert.equal(pageCopyUnits.length + boardSections.length, 55)
assert.deepEqual(
  boardSections.map(({ section }) => section.content.number),
  Array.from({ length: 30 }, (_, index) => `13.${index + 1}`),
)
assert.deepEqual(
  boardSections.map(({ sectionIndex }) => sectionIndex),
  [
    4, 5, 6, 8, 10, 12, 20, 22, 27, 30, 34, 38, 40, 42, 44, 50, 52, 54, 58, 60,
    66, 71, 73, 76, 81, 83, 85, 89, 96, 98,
  ],
)
for (const { section } of boardSections) {
  const expectedFen = expectedBoardFens[section.content.number]
  assert.ok(expectedFen)
  assert.equal(section.content.orientation, 'white')
  assert.equal(
    section.type === 'diagram' ? section.content.fen : section.content.fen,
    section.type === 'diagram' ? expectedFen.split(' ')[0] : expectedFen,
    `${section.content.number} source FEN`,
  )
}
assert.equal(
  createHash('sha256')
    .update(
      JSON.stringify(
        chapter.sections.filter(
          (section) =>
            section.type !== 'diagram' && section.type !== 'position',
        ),
      ),
    )
    .digest('hex'),
  'e52d98c05e1ccb5d7048fa6bd1e3025456699908d0aeff6b02117f33d47f9cf4',
)
assert.equal(
  createHash('sha256')
    .update(JSON.stringify(boardSections.map(({ section }) => section.content)))
    .digest('hex'),
  'c78683b40d00cad838e7a5712703a7eb1250a23da027d8b7be737c97e8ba563b',
)
assert.deepEqual(
  getPosition('13.7').content.markers?.map(({ square }) => square),
  ['b7', 'c7', 'd7', 'f7'],
)
assert.deepEqual(getPosition('13.5').content.routes, [
  {
    meaning: "Knight's V/W route as printed",
    squares: ['c7', 'd5', 'e7', 'f5', 'g7'],
  },
])
assert.deepEqual(
  getPosition('13.20').content.markers?.map(({ square }) => square),
  ['a2', 'b3', 'c4', 'e6'],
)

assert.equal(Object.keys(checkpointRoots).length, 13)
for (const [checkpoint, root] of Object.entries(checkpointRoots)) {
  const targetFen = expectedBoardFens[checkpoint]
  const reached = sourcePaths
    .filter(({ position }) => position === root)
    .some(({ fen, san }) => {
      const chess = new Chess(fen)
      if (positionKey(chess.fen()) === positionKey(targetFen)) return true
      return san.some((move) => {
        chess.move(move, { strict: true })
        return positionKey(chess.fen()) === positionKey(targetFen)
      })
    })
  assert.equal(
    reached,
    true,
    `${checkpoint} must be an exact ${root} checkpoint`,
  )
}

assert.equal(sourcePaths.length, 100)
assert.equal(
  sourcePaths.reduce((total, source) => total + source.san.length, 0),
  2214,
)
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
  '8ac3f50300949f07a059b0ec3d30b0146daf4174fc79f484b783168f3e436214',
)

for (const [sectionIndex, tokens] of playback.tokensBySectionIndex) {
  assert.equal(
    tokens
      .filter((token) => token.type !== 'move' || !token.hidden)
      .map((token) => (token.type === 'text' ? token.text : token.display))
      .join(''),
    getPlayableSectionText(chapter.sections[sectionIndex]),
    `Visible playback tokens must preserve section ${sectionIndex}`,
  )
}

const moveTokens = [...playback.tokensBySectionIndex.values()]
  .flat()
  .filter((token): token is MoveToken => token.type === 'move')
const visibleMoveTokens = moveTokens.filter((token) => !token.hidden)
const hiddenMoveTokens = moveTokens.filter((token) => token.hidden)
assert.equal(visibleMoveTokens.length, 888)
assert.equal(hiddenMoveTokens.length, 388)
for (const token of moveTokens) {
  const chess = new Chess(token.parentFen)
  chess.move(token.san, { strict: true })
  assert.equal(chess.fen(), token.fen, token.id)
  if (token.hidden) {
    assert.ok(token.sourceId)
    assert.equal(
      visibleMoveTokens.some(({ id }) => id === token.sourceId),
      true,
      `Hidden token ${token.id} must name a visible source`,
    )
  }
}

const tokensByPath = new Map<string, MoveToken[]>()
for (const token of moveTokens) {
  const key = pathKey(token.positionNumber, token.path)
  tokensByPath.set(key, [...(tokensByPath.get(key) ?? []), token])
}
const sourcePrefixes = new Set<string>()
const sourceTransitions = new Set<string>()
let verifiedPaths = 0
let verifiedPlies = 0

for (const source of sourcePaths) {
  const chess = new Chess(source.fen)
  const canonicalPath: string[] = []
  const expectedTransitions: Array<{
    fen: string
    parentFen: string
    san: string
  }> = []
  for (const rawSan of source.san) {
    const parentFen = chess.fen()
    const move = chess.move(rawSan, { strict: true })
    canonicalPath.push(move.san)
    const expected = { fen: chess.fen(), parentFen, san: move.san }
    expectedTransitions.push(expected)
    sourcePrefixes.add(pathKey(source.position, canonicalPath))
    sourceTransitions.add(transitionKey(parentFen, move.san, chess.fen()))
    const candidates =
      tokensByPath.get(pathKey(source.position, canonicalPath)) ?? []
    assert.equal(
      candidates.some(
        (candidate) =>
          positionKey(candidate.parentFen) === positionKey(parentFen) &&
          positionKey(candidate.fen) === positionKey(chess.fen()) &&
          candidate.san === move.san,
      ),
      true,
      `${source.position} ${source.label}: ${canonicalPath.join(' ')}`,
    )
    verifiedPlies += 1
  }

  const navigation = navigationByPosition.get(source.position)
  assert.ok(navigation)
  const last = expectedTransitions.at(-1)
  assert.ok(last)
  const leafCandidates = (
    tokensByPath.get(pathKey(source.position, canonicalPath)) ?? []
  ).filter(
    (token) =>
      positionKey(token.parentFen) === positionKey(last.parentFen) &&
      positionKey(token.fen) === positionKey(last.fen) &&
      token.san === last.san,
  )
  let traversedIds: string[] | undefined
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
  assert.ok(traversedIds, `${source.position} ${source.label} Next traversal`)
  let cursorId: string | null = traversedIds.at(-1) ?? null
  for (let index = traversedIds.length - 1; index >= 0; index -= 1) {
    const previous = getPreviousNavigationNode(navigation, cursorId)
    if (index === 0) {
      assert.equal(previous, null)
    } else {
      assert.equal(previous?.id, traversedIds[index - 1])
    }
    cursorId = previous?.id ?? null
  }
  verifiedPaths += 1
}

assert.equal(verifiedPaths, 100)
assert.equal(verifiedPlies, 2214)
assert.equal(sourcePrefixes.size, 889)
assert.equal(sourceTransitions.size, 875)
const appTransitions = new Set(
  moveTokens.map((token) =>
    transitionKey(token.parentFen, token.san, token.fen),
  ),
)
assert.deepEqual(appTransitions, sourceTransitions)

const blackRoot = sourcePaths.find(
  ({ label }) => label === '13.7-black-to-move',
)
assert.ok(blackRoot)
const blackRootToken = (tokensByPath.get(pathKey('13.7', ['Rd7+'])) ?? []).find(
  ({ parentFen }) => parentFen === '3k4/4r3/3K4/3B4/8/8/8/5R2 b - - 0 1',
)
assert.ok(blackRootToken)
assert.equal(blackRootToken.fen, '3k4/3r4/3K4/3B4/8/8/8/5R2 w - - 1 2')

for (const { section, sectionIndex } of boardSections) {
  const anchorId = bookPositionAnchorId(section.content.number)
  assert.deepEqual(
    resolveAppRoute(bookPathForChapterId('13'), `#${anchorId}`).route,
    { anchorId, chapterId: '13', module: 'book' },
  )
  const markup =
    section.type === 'diagram'
      ? renderToStaticMarkup(<InstructionalDiagram section={section} />)
      : renderPosition(sectionIndex)
  assert.equal(markup.includes(`id="${anchorId}"`), true)
}

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
for (const expected of [
  'Position 13.1–13.3 discussion',
  'prints “that, is”',
  'print page 205',
  'reads “that is.”',
  'Position 13.4',
  'Remember this procedure by the moment.',
  'print page 207',
  'Remember this procedure for the moment.',
  'Position 13.14',
  'get his king out of the edge.',
  'print page 216',
  'get his king off the edge.',
]) {
  assert.equal(frontMatterText.includes(expected), true, expected)
}
for (const number of ['13.1', '13.4', '13.14']) {
  const href = `${bookPathForChapterId('13')}#${bookPositionAnchorId(number)}`
  assert.equal(frontMatterMarkup.includes(`href="${href}"`), true, href)
}

console.log(
  'Chapter 13 source fidelity passed (25 page units, 30 diagrams, 55 total units; 100 replay paths / 2,214 plies / 889 prefixes / 875 transitions; 13 checkpoints; 3 governed corrections)',
)

function getPosition(number: string) {
  const section = chapter.sections.find((candidate) => {
    if (candidate.type !== 'position') return false
    return (candidate as PositionSection).content.number === number
  }) as PositionSection | undefined
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

function pathKey(position: string, path: string[]) {
  return `${position}\u001e${path.join('\u001f')}`
}

function positionKey(fen: string) {
  return fen.split(/\s+/).slice(0, 4).join(' ')
}

function transitionKey(parentFen: string, san: string, fen: string) {
  return `${positionKey(parentFen)}\u001e${san}\u001e${positionKey(fen)}`
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
