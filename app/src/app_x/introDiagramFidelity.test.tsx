import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  bookPositionAnchorId,
  resolveAppRoute,
} from '../routing'
import { validateBookSource } from './bookSourceValidation'
import type {
  BookPartSource,
  BookSource,
  DiagramSection,
} from './chapterTypes'
import InstructionalDiagram from './InstructionalDiagram'

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource
validateBookSource(book)

const introduction = book.parts.find(({ id }) => id === 'introduction')
assert.ok(introduction, 'Expected the introduction source part')

const knightRoutes = getDiagram(introduction, 'intro-knight-routes')
const routeMarkers = knightRoutes.content.markers ?? []
const expectedRouteLabels = new Map<
  string,
  { origin: 'a1' | 'g2'; symbol: string }
>([
  ['a2', { origin: 'a1', symbol: '3' }],
  ['b1', { origin: 'a1', symbol: '3' }],
  ['b2', { origin: 'a1', symbol: '4' }],
  ['f8', { origin: 'a1', symbol: '4' }],
  ['g7', { origin: 'a1', symbol: '4' }],
  ['h6', { origin: 'a1', symbol: '4' }],
  ['h8', { origin: 'a1', symbol: '6' }],
  ['a8', { origin: 'g2', symbol: '4' }],
  ['f1', { origin: 'g2', symbol: '2' }],
  ['f2', { origin: 'g2', symbol: '3' }],
  ['f3', { origin: 'g2', symbol: '2' }],
  ['g1', { origin: 'g2', symbol: '3' }],
  ['g3', { origin: 'g2', symbol: '3' }],
  ['h1', { origin: 'g2', symbol: '4' }],
  ['h2', { origin: 'g2', symbol: '3' }],
  ['h3', { origin: 'g2', symbol: '2' }],
])

assert.equal(routeMarkers.length, expectedRouteLabels.size)
assert.equal(
  new Set(routeMarkers.map(({ square }) => square)).size,
  routeMarkers.length,
  'Knight-route labels must occupy distinct squares',
)
for (const marker of routeMarkers) {
  const expected = expectedRouteLabels.get(marker.square)
  assert.ok(expected, `Unexpected knight-route label on ${marker.square}`)
  assert.deepEqual(
    {
      meaning: marker.meaning,
      symbol: marker.symbol,
      variant: marker.variant,
    },
    {
      meaning: `Moves from ${expected.origin} as printed`,
      symbol: expected.symbol,
      variant: expected.origin === 'g2' ? 'label-italic' : 'label',
    },
    `Incorrect origin styling or association on ${marker.square}`,
  )
}

const knightRoutesMarkup = renderToStaticMarkup(
  <InstructionalDiagram section={knightRoutes} />,
)
assert.equal(
  (knightRoutesMarkup.match(/leg-board-marker--label-italic/g) ?? []).length,
  9,
)
assert.equal(
  (
    knightRoutesMarkup.match(
      /class="leg-board-marker leg-board-marker--label"/g,
    ) ?? []
  ).length,
  7,
)
assert.match(
  knightRoutesMarkup,
  /aria-label="4 marker on f8: Moves from a1 as printed" class="leg-board-marker leg-board-marker--label"/,
)
assert.match(
  knightRoutesMarkup,
  /aria-label="4 marker on a8: Moves from g2 as printed" class="leg-board-marker leg-board-marker--label-italic"/,
)
assert.doesNotMatch(knightRoutesMarkup, /leg-board-quadrant-divider/)

const knightDomination = getDiagram(
  introduction,
  'intro-knight-domination',
)
assert.equal(knightDomination.content.quadrantDividers, true)
const knightDominationMarkup = renderToStaticMarkup(
  <InstructionalDiagram section={knightDomination} />,
)
assert.match(
  knightDominationMarkup,
  /class="leg-board-quadrant-divider-layer"/,
)
assert.equal(
  (knightDominationMarkup.match(/class="leg-board-quadrant-divider"/g) ?? [])
    .length,
  2,
)
assert.match(
  knightDominationMarkup,
  /x1="50" x2="50" y1="0" y2="100"/,
)
assert.match(
  knightDominationMarkup,
  /x1="0" x2="100" y1="50" y2="50"/,
)

const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')
assert.match(
  styles,
  /\.leg-board-marker--label-italic\s*\{\s*font-style: italic;/,
)
assert.match(
  styles,
  /\.leg-board-quadrant-divider\s*\{[^}]*stroke-width: 0\.28rem;/s,
)

const deepLink = resolveAppRoute(
  '/book/intro',
  '#pintro-knight-routes',
)
assert.equal(deepLink.href, '/book/intro#pintro-knight-routes')
assert.equal(deepLink.route.module, 'book')
assert.equal(deepLink.route.anchorId, 'pintro-knight-routes')
assert.match(
  knightRoutesMarkup,
  /<figure class="leg-instructional-diagram" id="pintro-knight-routes">/,
)

const sourceDiagrams = book.parts.flatMap(({ sections }) =>
  sections.filter(
    (section): section is DiagramSection => section.type === 'diagram',
  ),
)
const renderedDiagramAnchorIds = sourceDiagrams.flatMap((section) => {
  const markup = renderToStaticMarkup(
    <InstructionalDiagram section={section} />,
  )
  return [...markup.matchAll(/<figure[^>]* id="([^"]+)"/g)].map(
    ([, anchorId]) => anchorId,
  )
})
assert.deepEqual(
  renderedDiagramAnchorIds,
  sourceDiagrams.map(({ content }) =>
    bookPositionAnchorId(content.number),
  ),
)
assert.equal(
  new Set(renderedDiagramAnchorIds).size,
  renderedDiagramAnchorIds.length,
  'Instructional diagrams must not render duplicate anchor ids',
)

const invalidBook = structuredClone(book) as any
const invalidIntroduction = invalidBook.parts.find(
  ({ id }: { id: string }) => id === 'introduction',
)
const invalidDomination = invalidIntroduction.sections.find(
  ({ content, type }: { content: { number?: string }; type: string }) =>
    type === 'diagram' && content.number === 'intro-knight-domination',
)
invalidDomination.content.quadrantDividers = 'true'
assert.throws(
  () => validateBookSource(invalidBook),
  /quadrantDividers must be a boolean/,
)

console.log('intro diagram fidelity passed')

function getDiagram(part: BookPartSource, number: string) {
  const section = part.sections.find(
    (candidate) =>
      candidate.type === 'diagram' &&
      (candidate.content as DiagramSection['content']).number === number,
  )
  assert.ok(section, `Expected instructional diagram ${number}`)
  return section as DiagramSection
}
