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
import { buildBookReferenceIndex } from './bookReferences'
import { ProblemStudyGroup } from './ChapterViewer'
import {
  hydrateRuntimeChapter,
  type RuntimeChapterDefinition,
} from './chapterRuntime'
import { buildRuntimeChapter } from './chapterRuntimeBuild'
import type { BookSource, ProblemSection } from './chapterTypes'
import type { TextPlaybackToken } from './moveParser'
import {
  getNextNavigationNode,
  getPreferredNextUpdates,
  getPreviousNavigationFen,
  getPreviousNavigationNode,
  type NavigationNode,
  type PositionNavigation,
} from './playbackNavigation'

type ExpectedProblem = {
  fen: string
  number: string
  prompt: string
  solutionFen?: string
}

type SourcePathFixture = Record<
  string,
  {
    fen: string
    paths: string[][]
  }
>

type ExpectedTransition = {
  fen: string
  parentFen: string
  uci: string
}

type MoveToken = Extract<TextPlaybackToken, { type: 'move' }>

const initialCursorKey = '\u0000initial'

const pageCopyUnits = [
  { id: 'B10-P01', pdfPage: 230, printedPage: 229, scope: '14.01-14.06' },
  { id: 'B10-P02', pdfPage: 231, printedPage: 230, scope: '14.07-14.12' },
  { id: 'B10-P03', pdfPage: 232, printedPage: 231, scope: '14.13-14.18' },
  { id: 'B10-P04', pdfPage: 233, printedPage: 232, scope: '14.19-14.24' },
  { id: 'B10-P05', pdfPage: 234, printedPage: 233, scope: '14.25-14.30' },
  { id: 'B10-P06', pdfPage: 235, printedPage: 234, scope: '14.31-14.36' },
  {
    id: 'B10-P07',
    pdfPage: 236,
    printedPage: 235,
    scope: '14.01-14.11 solutions',
  },
  {
    id: 'B10-P08',
    pdfPage: 237,
    printedPage: 236,
    scope: '14.12-14.18 solutions',
  },
  {
    id: 'B10-P09',
    pdfPage: 238,
    printedPage: 237,
    scope: '14.19-14.26 solutions',
  },
  {
    id: 'B10-P10',
    pdfPage: 239,
    printedPage: 238,
    scope: '14.26-14.30 solutions',
  },
  {
    id: 'B10-P11',
    pdfPage: 240,
    printedPage: 239,
    scope: '14.30-14.36 solutions',
  },
] as const

// Frozen after source-first visual inspection of PDF 230-240. This covers the
// exact title, prompt, and governed solution strings in source order; the 36
// diagram units are asserted field-by-field below.
const expectedChapterCopySha256 =
  '04be6e5dde8972d7dabb5874714e27cf83145a34f20a4d907c0b7e6a105edec5'

const expectedProblems: ExpectedProblem[] = [
  {
    number: '14.01',
    prompt: 'White to move. What is the correct result?',
    fen: '8/K7/1P6/8/6n1/7k/8/8 w - - 0 1',
  },
  {
    number: '14.02',
    prompt: 'White to move. What is the correct result?',
    fen: '8/8/6R1/8/p7/4k3/6K1/r7 w - - 0 1',
  },
  {
    number: '14.03',
    prompt:
      'Find a square where a black knight can draw here, with White to move.',
    fen: '8/4kPK1/8/8/4B3/8/8/8 w - - 0 1',
    solutionFen: '4n3/4kPK1/8/8/4B3/8/8/8 w - - 0 1',
  },
  {
    number: '14.04',
    prompt: 'Black to move. Can he draw?',
    fen: '8/4k3/8/8/r5P1/5R1K/8/8 b - - 0 1',
  },
  {
    number: '14.05',
    prompt: 'Black to move. Can he draw?',
    fen: '8/8/P7/3k4/1P6/1K5R/8/r7 b - - 0 43',
  },
  {
    number: '14.06',
    prompt: 'White to move. What is the correct result?',
    fen: '8/7p/5k2/8/5K2/7P/6P1/8 w - - 0 1',
  },
  {
    number: '14.07',
    prompt: 'Black to move. Can he draw?',
    fen: '3b4/8/8/NK6/P7/1k6/8/8 b - - 0 1',
  },
  {
    number: '14.08',
    prompt: 'White to move. Is the ending won or drawn?',
    fen: '3kB3/1K1P4/1P6/8/3b4/8/8/8 w - - 0 1',
  },
  {
    number: '14.09',
    prompt: 'White to move. Can he draw?',
    fen: '7K/8/8/8/7N/7p/8/7k w - - 0 1',
  },
  {
    number: '14.10',
    prompt: 'White to move. Can he win?',
    fen: '8/8/8/6Kp/kPp5/2P5/8/8 w - - 0 53',
  },
  {
    number: '14.11',
    prompt: 'White to move. Can he win?',
    fen: 'r7/7R/8/8/8/8/1P2k3/1K6 w - - 0 1',
  },
  {
    number: '14.12',
    prompt: 'Black to move. Can he draw?',
    fen: '8/8/8/5p2/1P5k/3K4/8/8 b - - 0 1',
  },
  {
    number: '14.13',
    prompt:
      'Is there any square on the board for the white king such that Black (to move) can draw?',
    fen: '8/8/1k6/8/P2P4/8/8/8 b - - 0 1',
    solutionFen: '8/8/1k6/8/P2P4/8/8/K7 b - - 0 1',
  },
  {
    number: '14.14',
    prompt: 'Black to move. Larsen could not find a way to draw. Can you?',
    fen: '6r1/8/8/8/4k1PK/R7/8/8 b - - 0 63',
  },
  {
    number: '14.15',
    prompt: 'White to move. Can he win?',
    fen: 'K7/6k1/8/6p1/8/8/7R/8 w - - 0 1',
  },
  {
    number: '14.16',
    prompt: 'Is this ending drawn?',
    fen: '8/8/8/r5KP/8/4k3/8/8 w - - 0 1',
  },
  {
    number: '14.17',
    prompt:
      "Black to move. According to ChessBase Magazine notes, this position is a dead draw, but with Black being an exchange and a pawn up that is difficult to believe, isn't it?",
    fen: '8/8/3B4/5k2/6p1/1r3PK1/8/8 b - - 0 99',
  },
  {
    number: '14.18',
    prompt: 'Black to move. Can he draw?',
    fen: '6KR/8/pk6/8/8/8/8/8 b - - 0 1',
  },
  {
    number: '14.19',
    prompt: 'White to move. What is the result?',
    fen: '4k3/7R/8/3rP3/5K2/8/8/8 w - - 0 3',
  },
  {
    number: '14.20',
    prompt: 'White to move. Can he draw?',
    fen: '8/8/2p5/8/2P5/8/6K1/3k4 w - - 0 1',
  },
  {
    number: '14.21',
    prompt: 'What is the result after 1.Kc6, 1.Kc4 or 1.Ke6?',
    fen: '8/3r4/8/3K4/4P3/8/2k5/8 w - - 0 1',
  },
  {
    number: '14.22',
    prompt: 'Black to move. Can he win?',
    fen: '8/7p/8/3k2K1/6PP/8/2b5/8 b - - 0 54',
  },
  {
    number: '14.23',
    prompt: 'Black to move. Can he win?',
    fen: '8/6KP/4k3/8/5B2/7r/2p5/8 b - - 0 55',
  },
  {
    number: '14.24',
    prompt: 'Black to move. Can he draw?',
    fen: 'b7/P1k5/6N1/8/5PK1/8/8/8 b - - 0 1',
  },
  {
    number: '14.25',
    prompt: 'White to move. Can he win?',
    fen: '8/5K1k/8/5p2/3b1P2/3B2P1/8/8 w - - 0 1',
  },
  {
    number: '14.26',
    prompt:
      'Find mistakes in the following moves: 90...Kh7 91.Qe4+ Kh8 92.Qc4 Kh7 93.Qf7+ Kh8 94.Qd7 Rg5 95.Qb7 Rg8 96.Qb3 Kh7 97.Kf7 Rg5 98.Qe6 Rg7+ 99.Kf8 Rg5 100.Qf6 Rg8+ 101.Kf7 Rg5 102.Qd4 Rf5+ 103.Ke6 Rg5 104.Kf6 Rg8 105.Qd7++-.',
    fen: '6rk/8/5K1p/8/2Q5/8/8/8 b - - 0 90',
  },
  {
    number: '14.27',
    prompt:
      'Everybody knows that, in this game, Janovsky resigned in a drawn position, but it is not so well-known that Capablanca had a forced win. What would you play in this position in which Capablanca made a mistake?',
    fen: '3b4/6k1/6P1/8/1BK5/1P6/8/8 w - - 0 81',
  },
  {
    number: '14.28',
    prompt: 'Black is going to lose his rook. Can he draw after all?',
    fen: '8/7P/5R1K/3kp3/8/8/8/6r1 b - - 0 63',
  },
  {
    number: '14.29',
    prompt: 'White to move. Can he draw?',
    fen: '8/8/2pr4/R7/8/1k6/4K3/8 w - - 0 69',
  },
  {
    number: '14.30',
    prompt: 'Black to move. Can he draw?',
    fen: '8/8/2k5/2P5/5KB1/6P1/8/3b4 b - - 0 89',
  },
  {
    number: '14.31',
    prompt: 'White to move. What is the correct result?',
    fen: '8/1n2k3/3n4/P7/7K/8/8/8 w - - 0 1',
  },
  {
    number: '14.32',
    prompt: 'Black to move. What is the correct result?',
    fen: '8/5p2/3k2p1/1Kp2pP1/2P2P2/8/8/8 b - - 0 50',
  },
  {
    number: '14.33',
    prompt: 'Black to move. Can he win?',
    fen: '4R3/8/8/5p2/6P1/7k/r7/6K1 b - - 0 1',
  },
  {
    number: '14.34',
    prompt: 'White to move. Can he win?',
    fen: '1K6/1p6/pp6/B7/8/8/1P6/k7 w - - 0 1',
  },
  {
    number: '14.35',
    prompt: 'White to move. Choose: 1.gxf3+ or 1.g3?',
    fen: '8/8/8/p4p2/P5k1/5p2/5KP1/8 w - - 0 1',
  },
  {
    number: '14.36',
    prompt: 'White to move. Can he win?',
    fen: '8/8/p2R4/K2P1k2/2r5/P7/8/8 w - - 0 64',
  },
]

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
const sourcePaths = JSON.parse(
  readFileSync(new URL('./chapter14SourcePaths.json', import.meta.url), 'utf8'),
) as SourcePathFixture
const chapter = getPart('14')
const problems = chapter.sections.filter(
  (section): section is ProblemSection => section.type === 'problem',
)

assert.equal(chapter.sections.length, 37)
assert.deepEqual(chapter.sections[0], {
  type: 'title',
  content: '14. Final Test',
})
assert.equal(problems.length, 36)
assert.equal(expectedProblems.length, 36)
assert.deepEqual(
  pageCopyUnits.map(({ id, pdfPage, printedPage }) => ({
    id,
    pdfPage,
    printedPage,
  })),
  Array.from({ length: 11 }, (_, index) => ({
    id: `B10-P${String(index + 1).padStart(2, '0')}`,
    pdfPage: 230 + index,
    printedPage: 229 + index,
  })),
)
assert.equal(
  createHash('sha256')
    .update(
      JSON.stringify([
        { type: 'title', content: chapter.sections[0]?.content },
        ...problems.map(({ content: { number, prompt, solution } }) => ({
          number,
          prompt,
          solution,
        })),
      ]),
    )
    .digest('hex'),
  expectedChapterCopySha256,
  '11 source page-copy units must retain their exact governed Chapter 14 text',
)
assert.deepEqual(
  chapter.sections.slice(1).map(({ type }) => type),
  Array.from({ length: 36 }, () => 'problem'),
)
assert.deepEqual(
  problems.map(({ content }) => content.number),
  Array.from(
    { length: 36 },
    (_, index) => `14.${String(index + 1).padStart(2, '0')}`,
  ),
)

for (const [index, expected] of expectedProblems.entries()) {
  const actual = problems[index].content
  assert.equal(actual.number, expected.number)
  assert.equal(actual.orientation, 'white', `${expected.number} orientation`)
  assert.equal(actual.prompt, expected.prompt, `${expected.number} prompt`)
  assert.equal(actual.fen, expected.fen, `${expected.number} FEN`)
  assert.equal(
    actual.solutionFen,
    expected.solutionFen,
    `${expected.number} solution FEN`,
  )
  if (actual.solutionFen) {
    assert.doesNotThrow(
      () => new Chess(actual.solutionFen),
      `${expected.number} legal solution FEN`,
    )
  } else {
    assert.doesNotThrow(
      () => new Chess(actual.fen),
      `${expected.number} legal FEN`,
    )
  }
}

const problemByNumber = new Map(
  problems.map((problem) => [problem.content.number, problem.content]),
)
const problem1403 = getProblem('14.03')
const problem1413 = getProblem('14.13')
assert.equal(
  problem1403.solutionFen,
  sourcePaths['14.03'].fen,
  '14.03 playback must add the constructed black knight without changing its display diagram',
)
assert.notEqual(problem1403.fen, problem1403.solutionFen)
assert.equal(
  problem1413.solutionFen,
  sourcePaths['14.13'].fen,
  '14.13 playback must add the constructed white king without changing its display diagram',
)
assert.notEqual(problem1413.fen, problem1413.solutionFen)

assert.equal(getProblem('14.29').prompt, 'White to move. Can he draw?')
assert.match(getProblem('14.29').fen, / w - - 0 69$/)
assert.doesNotMatch(getProblem('14.29').prompt, /^Black to move/)
assert.match(
  getProblem('14.17').solution,
  /the white king is driven off his blockade position/,
)
assert.doesNotMatch(
  getProblem('14.17').solution,
  /the black king is driven off his blockade position/,
)
assert.match(getProblem('14.19').solution, /7\.Ra8\+−|7\.Ra8\+-/)
assert.doesNotMatch(getProblem('14.19').solution, /7\.Rh8/)

assert.deepEqual(
  Object.keys(sourcePaths),
  expectedProblems.map(({ number }) => number),
)
for (const expected of expectedProblems) {
  const playbackFen = expected.solutionFen ?? expected.fen
  assert.equal(
    positionKey(sourcePaths[expected.number].fen),
    positionKey(playbackFen),
    `${expected.number} frozen replay start`,
  )
}

const runtime = hydrateRuntimeChapter(
  buildRuntimeChapter(chapter, buildBookReferenceIndex(book.parts)),
)
assert.equal(runtime.playback.playablePositions.size, 36)

const sourceExactTransitions = new Set<string>()
let verifiedPathCount = 0
let verifiedPlyCount = 0

for (const { number } of expectedProblems) {
  const source = sourcePaths[number]
  assert.ok(source, `${number} frozen source paths`)
  const navigation = runtime.navigationByPosition.get(number)
  assert.ok(navigation, `${number} playback navigation`)
  const childrenByPreviousId = navigationChildren(navigation)
  const transitionByNodeId = new Map<string, ExpectedTransition>()

  for (const [pathIndex, path] of source.paths.entries()) {
    const chess = new Chess(source.fen)
    const expectedTransitions: ExpectedTransition[] = []

    for (const [moveIndex, sourceMove] of path.entries()) {
      const parentFen = chess.fen()
      let applied
      try {
        applied = chess.move(sourceMove, { strict: false })
      } catch {
        assert.fail(
          `${number} source path ${pathIndex + 1} is illegal at ${path
            .slice(0, moveIndex + 1)
            .join(' ')}`,
        )
      }
      assert.ok(applied)
      const expected = {
        parentFen,
        fen: chess.fen(),
        uci: moveUci(applied),
      }
      expectedTransitions.push(expected)
      sourceExactTransitions.add(transitionKey(expected))
      verifiedPlyCount += 1
    }

    const chain = findNavigationChain(
      navigation,
      childrenByPreviousId,
      transitionByNodeId,
      expectedTransitions,
    )
    assert.ok(
      chain,
      `${number} path ${pathIndex + 1} is missing exact board + UCI playback: ${path.join(' ')}`,
    )
    assert.equal(chain.length, path.length)

    const leaf = chain.at(-1)
    assert.ok(leaf)
    const preferences = getPreferredNextUpdates(navigation, leaf.id)
    let cursorId: string | null = null

    for (const [moveIndex, expectedNode] of chain.entries()) {
      const next = getNextNavigationNode(navigation, cursorId, preferences)
      assert.equal(
        next?.id,
        expectedNode.id,
        `${number} path ${pathIndex + 1} Next at ply ${moveIndex + 1}`,
      )
      cursorId = next.id
    }

    for (let moveIndex = chain.length - 1; moveIndex >= 0; moveIndex -= 1) {
      assert.equal(
        positionKey(
          getPreviousNavigationFen(navigation, cursorId, source.fen) ?? '',
        ),
        positionKey(expectedTransitions[moveIndex].parentFen),
        `${number} path ${pathIndex + 1} Previous FEN at ply ${moveIndex + 1}`,
      )
      const previous = getPreviousNavigationNode(navigation, cursorId)
      if (moveIndex === 0) {
        assert.equal(previous, null)
        cursorId = null
      } else {
        assert.equal(previous?.id, chain[moveIndex - 1].id)
        cursorId = previous!.id
      }
    }

    verifiedPathCount += 1
  }
}

assert.equal(verifiedPathCount, 143)
assert.equal(verifiedPlyCount, 1500)
assert.equal(sourceExactTransitions.size, 1077)

const hiddenMarkup = renderProblems(false)
const revealedMarkup = renderProblems(true)
for (const { number } of expectedProblems) {
  const anchorId = bookPositionAnchorId(number)
  const solutionAnchorId = `${anchorId}-solution`
  for (const markup of [hiddenMarkup, revealedMarkup]) {
    assert.equal(
      countMatches(markup, new RegExp(`id="${escapeRegExp(anchorId)}"`, 'g')),
      1,
      `${number} problem anchor`,
    )
    assert.equal(
      countMatches(
        markup,
        new RegExp(`id="${escapeRegExp(solutionAnchorId)}"`, 'g'),
      ),
      1,
      `${number} solution anchor`,
    )
    assert.equal(
      markup.includes(`aria-labelledby="problem-${number}-heading"`),
      true,
      `${number} accessible problem heading`,
    )
    assert.equal(
      markup.includes(`aria-label="Solution for problem ${number}"`),
      true,
      `${number} accessible solution region`,
    )
    assert.equal(
      markup.includes(`aria-label="Chess position ${number}"`),
      true,
      `${number} accessible board image`,
    )
    assert.equal(
      markup.includes(`aria-label="Expand position ${number}"`),
      true,
      `${number} keyboard-focusable board expansion`,
    )
  }

  const resolution = resolveAppRoute(bookPathForChapterId('14'), `#${anchorId}`)
  assert.deepEqual(resolution.route, {
    anchorId,
    chapterId: '14',
    module: 'book',
  })
  assert.equal(resolution.href, `${bookPathForChapterId('14')}#${anchorId}`)
}
assert.equal(countMatches(hiddenMarkup, />Show solution<\/button>/g), 36)
assert.equal(countMatches(hiddenMarkup, />Hide solution<\/button>/g), 0)
assert.equal(countMatches(revealedMarkup, />Show solution<\/button>/g), 0)
assert.equal(countMatches(revealedMarkup, />Hide solution<\/button>/g), 36)
assert.equal(
  countMatches(revealedMarkup, /id="problem-14\.\d{2}-solution"/g),
  36,
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
  'Final Test 14.17',
  'prints “the black king is driven off his blockade position”',
  'print page 236',
  'corrects “black king” to “white king.”',
  'Final Test 14.29',
  'has the prompt “Black to move. Can he draw?”',
  'print page 233',
  "solution begins with White's 69th move",
  'print page 238',
  'presents the prompt as “White to move. Can he draw?”',
]) {
  assert.equal(
    frontMatterText.includes(expectedText),
    true,
    `About must disclose: ${expectedText}`,
  )
}
for (const number of ['14.17', '14.29']) {
  const href = `${bookPathForChapterId('14')}#${bookPositionAnchorId(number)}`
  assert.equal(
    frontMatterMarkup.includes(`href="${href}"`),
    true,
    `About correction must deep-link to ${href}`,
  )
}

console.log(
  'Chapter 14 source fidelity passed (47 units: 11 page-copy + 36 problems; 143 replay paths / 1,500 plies / 1,077 unique transitions; 2 governed corrections)',
)

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findNavigationChain(
  navigation: PositionNavigation,
  childrenByPreviousId: Map<string, NavigationNode[]>,
  transitionByNodeId: Map<string, ExpectedTransition>,
  expected: ExpectedTransition[],
) {
  function visit(
    moveIndex: number,
    previousId: string | null,
  ): NavigationNode[] | null {
    if (moveIndex === expected.length) {
      return []
    }

    const children =
      childrenByPreviousId.get(previousId ?? initialCursorKey) ?? []
    for (const child of children) {
      let actual = transitionByNodeId.get(child.id)
      if (!actual) {
        actual = tokenTransition(child)
        transitionByNodeId.set(child.id, actual)
      }
      if (!sameBoardUciTransition(actual, expected[moveIndex])) {
        continue
      }
      const suffix = visit(moveIndex + 1, child.id)
      if (suffix) {
        return [navigation.nodesById.get(child.id) ?? child, ...suffix]
      }
    }

    return null
  }

  return visit(0, null)
}

function getPart(partId: string) {
  const part = book.parts.find(({ id }) => id === partId)
  assert.ok(part, `Expected Chapter ${partId}`)
  return part
}

function getProblem(number: string) {
  const problem = problemByNumber.get(number)
  assert.ok(problem, `Expected Problem ${number}`)
  return problem
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

function moveUci(move: { from: string; promotion?: string; to: string }) {
  return `${move.from}${move.to}${move.promotion ?? ''}`
}

function navigationChildren(navigation: PositionNavigation) {
  const children = new Map<string, NavigationNode[]>()
  for (const node of navigation.nodesById.values()) {
    const key = node.previousId ?? initialCursorKey
    children.set(key, [...(children.get(key) ?? []), node])
  }
  return children
}

function positionKey(fen: string) {
  return fen.split(/\s+/).slice(0, 4).join(' ')
}

function renderProblems(revealed: boolean) {
  return renderToStaticMarkup(
    <>
      {problems.map((section, zeroBasedIndex) => {
        const index = zeroBasedIndex + 1
        return (
          <ProblemStudyGroup
            activeBoards={{}}
            activePositionNumber={null}
            index={index}
            key={section.content.number}
            navigationByPosition={runtime.navigationByPosition}
            onBookNavigate={() => undefined}
            onMoveClick={() => undefined}
            onPositionReset={() => undefined}
            onPositionStep={() => undefined}
            onToggleSolution={() => undefined}
            playback={runtime.playback}
            referenceSpans={runtime.referencesBySectionIndex.get(index)}
            revealed={revealed}
            section={section}
          />
        )
      })}
    </>,
  )
}

function sameBoardUciTransition(
  actual: ExpectedTransition,
  expected: ExpectedTransition,
) {
  return (
    positionKey(actual.parentFen) === positionKey(expected.parentFen) &&
    actual.uci === expected.uci &&
    positionKey(actual.fen) === positionKey(expected.fen)
  )
}

function tokenTransition(token: MoveToken): ExpectedTransition {
  const chess = new Chess(token.parentFen)
  const move = chess.move(token.san, { strict: false })
  assert.ok(
    move,
    `${token.positionNumber} illegal playback token ${token.display}`,
  )
  assert.equal(chess.fen(), token.fen)
  return {
    parentFen: token.parentFen,
    fen: token.fen,
    uci: moveUci(move),
  }
}

function transitionKey(transition: ExpectedTransition) {
  return `${transition.parentFen}\u001e${transition.uci}\u001e${transition.fen}`
}
