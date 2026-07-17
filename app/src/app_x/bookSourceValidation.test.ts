import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { BookSource } from './chapterTypes'
import { validateBookSource } from './bookSourceValidation'

const validBook = {
  schemaVersion: 1,
  parts: [
    {
      id: 'introduction',
      label: 'Introduction',
      name: 'Introduction',
      sections: [
        { type: 'title', content: 'Introduction' },
        {
          type: 'position',
          content: {
            boundaryPaths: [
              {
                meaning: 'Printed boundary',
                points: [
                  { x: 37.5, y: 0 },
                  { x: 37.5, y: 50 },
                ],
              },
            ],
            caption: 'Hidden source caption',
            number: 'I.1',
            orientation: 'white',
            fen: '8/8/8/8/8/2k5/8/2K5 w - - 0 1',
            alternateFens: ['8/8/8/8/8/2k5/8/2K5 b - - 0 1'],
            hideVisualLabel: true,
            playbackAnchors: [
              {
                parentFen: '8/8/8/8/8/2k5/8/2K5 w - - 0 1',
                pathPrefix: ['Kc2'],
                sectionIndex: 2,
                token: '1.Kc2',
              },
            ],
            playbackCanonicalPaths: ['Kb1 Kd3', 'Kd3'],
            playbackCanonicalSourcePositionNumbers: ['I.2'],
            playbackContinuationAliases: [
              {
                alternateToken: '2.Kg8',
                continuationToken: '2...Kg6',
                sectionIndex: 2,
              },
            ],
            playbackSegments: [
              {
                parentFen: '8/8/8/8/8/2k5/8/2K5 w - - 0 1',
                pathPrefix: ['Kc2'],
                positionNumber: 'I.1',
                sectionIndex: 2,
                start: '1.Kc2',
              },
            ],
          },
        },
        {
          type: 'diagram',
          content: {
            number: 'intro-rook',
            label: 'The rook',
            subtitle: 'Route',
            orientation: 'white',
            fen: '8/8/8/3R4/8/8/8/8',
            routes: [
              {
                meaning: 'Printed route',
                squares: ['d5', 'd8'],
              },
            ],
          },
        },
        {
          type: 'table',
          content: {
            caption: 'Statistics',
            columns: ['Ending', 'Games'],
            rows: [['Rooks', '320,548']],
          },
        },
      ],
    },
  ],
} satisfies BookSource

assert.deepEqual(validateBookSource(validBook), validBook)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        delete book.parts[0].sections[1].content.orientation
      }),
    ),
  /orientation must be white or black/,
)
assert.throws(
  () =>
    validateBookSource(withMutation((book) => book.parts.push(book.parts[0]))),
  /Duplicate part id/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[2].content.number = 'I.1'
      }),
    ),
  /Duplicate board id/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.markers = [
          { meaning: 'Invalid', square: 'i9', symbol: '*' },
        ]
      }),
    ),
  /invalid square/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[3].content.rows[0].pop()
      }),
    ),
  /cells; expected/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.fen = '8/8/8/8/8/8/8/8 w - - 0 1'
      }),
    ),
  /not a legal FEN/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[2].content.fen = '8/8/8/8/8/8/8/9'
      }),
    ),
  /invalid piece|expands to/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[2].content.routes[0].squares = ['d5', 'i9']
      }),
    ),
  /invalid square/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections.push({ type: 'mystery', content: 'Nope' })
      }),
    ),
  /unknown type/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.playbackCanonicalSourcePositionNumbers =
          []
      }),
    ),
  /playbackCanonicalSourcePositionNumbers must not be empty/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.playbackCanonicalPaths[0] = 'Kb1 Kb1'
      }),
    ),
  /illegal move Kb1/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.fen = '7k/8/8/8/8/8/8/K7 w - - 0 1'
        book.parts[0].sections[1].content.alternateFens = [
          '6k1/8/8/8/8/8/8/K7 b - - 0 1',
        ]
        book.parts[0].sections[1].content.playbackCanonicalPaths = ['Kb1 Kf8']
      }),
    ),
  /playback canonical path 1 has illegal move/,
  'Validation must not allow a canonical line to switch roots between plies.',
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.alternateFens = [
          '8/8/8/8/8/8/8/8 w - - 0 1',
        ]
      }),
    ),
  /alternateFens\[0\].*not a legal FEN/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.playbackSegments[0].pathPrefix = 'Kc2'
      }),
    ),
  /pathPrefix must be an array/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.playbackSegments[0].pathPrefix = ['']
      }),
    ),
  /pathPrefix\[0\] must be a non-empty string/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.playbackAnchors[0].pathPrefix = 'Kc2'
      }),
    ),
  /playback anchor 1 pathPrefix must be an array/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        delete book.parts[0].sections[1].content.caption
      }),
    ),
  /caption required when hideVisualLabel is true/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.boundaryPaths[0].points[0].x = 101
      }),
    ),
  /x must be between 0 and 100/,
)
assert.throws(
  () =>
    validateBookSource(
      withMutation((book) => {
        book.parts[0].sections[1].content.playbackContinuationAliases[0].alternateOccurrence =
          -1
      }),
    ),
  /alternateOccurrence must be a non-negative integer/,
)

const source = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
)
validateBookSource(source)

console.log('book source validation passed')

function withMutation(mutate: (book: any) => void) {
  const book = structuredClone(validBook) as any
  mutate(book)
  return book
}
