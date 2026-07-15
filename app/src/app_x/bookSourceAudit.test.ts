import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

type BookSource = {
  parts: Array<{
    id: string
    sections: Array<{ content: unknown; type: string }>
  }>
  schemaVersion: number
}

const expectedSectionHashes: Record<string, string> = {
  introduction: '4ed05a9fa8cc3d0701e5b1a9028c85722e2a1426eb00a957742cb685e38123e7',
  '1': 'd62d94d36eefbd0c0c9e87bc2b22c319b66dc3748c5dfa1f817cc0f8716c2b62',
  '2': '45c2fac58e41a7e1b2f97bf59f59a49a0a1483db19acbd9073e6e29a5d9d9729',
  '3': '56b1685e3a78bad895f175731843abcdfb464a9e9c11f6f5d5be58bd20d38730',
  '4': 'bb807ea9c44db5435a270f2b60c6b871e35500c573c3ff20a764a49c079c8739',
  '5': '465695147eef8dafa691c7ab6a2668c973eaad146f9072446063263af9aab84e',
  '6': 'f872e6c5974a73138f46901fd1afbc44084c5524f45e5f46543e44cf3b325ad4',
  '7': 'cfa82b94307c20a7bdcb423acb3c1b9d879a8eec1d12608e8ee8792dc23cd61f',
  '8': '10f190592ef3d72af4305b56f9a142cb61f4b9b3a87fca6f6b959f384a52bb90',
  '9': 'aa7e76921cea011a00030286a581ea4f1408a353aab8a7dd22e1af2d5bbd90e7',
  '10': '132b7aa83729ca0b18625383c57a2f52714a3f01d53a27de27a74cab990e094e',
  '11': '52bf99f07550e2d77ec52ad3fb937811dbd40a4e64f1803267a5d7704eb83b43',
  '12': 'bbc1feeaba68b4ef573a21679067ae903f2c4c387c79116c9b087bec5f43d93f',
  '13': '6573fa6ac13b5ea8bb593a39f4a365508fa37c51e87131661852257f1834fd14',
  '14': '64bd00bca37f97d9a5b78d61f6c362397adab646a51b7da6ea889b753e2e0ed3',
  '15': 'b160b207f06c70025a0f35340c7279e2aa3e5206d1862c7e7e77f87ab7fe125f',
  bibliography: '3cc5d5cdbb85829c0a7c97a8a4d92efffe7921696f86d8f0ca6c61ad24965372',
}

const book = JSON.parse(
  readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8'),
) as BookSource

assert.equal(book.schemaVersion, 1)
assert.equal(book.parts[0]?.id, 'introduction')

for (const [partId, expectedHash] of Object.entries(expectedSectionHashes)) {
  const part = book.parts.find(({ id }) => id === partId)
  assert.ok(part, `Expected book part ${partId}`)
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify(part.sections))
      .digest('hex'),
    expectedHash,
    `Part ${partId} changed during source consolidation`,
  )
}

assert.equal(
  existsSync(new URL('./chapterManifest.json', import.meta.url)),
  false,
  'The retired chapter manifest must not return',
)
for (let chapter = 1; chapter <= 14; chapter += 1) {
  assert.equal(
    existsSync(new URL(`./pdf/chapter_${chapter}.json`, import.meta.url)),
    false,
    `The retired chapter_${chapter}.json source must not return`,
  )
}

const introduction = book.parts.find(({ id }) => id === 'introduction')
assert.ok(introduction, 'Expected the complete Introduction')
assert.deepEqual(
  introduction.sections
    .filter(({ type }) => type === 'heading')
    .map(({ content }) => content),
  [
    'The relative importance of the endgame',
    'The study of the endgame',
    'The content of this book',
    'How to study this book',
    'The attitude to study',
    'Memorising rules',
    'Extreme positions',
    'Step by step',
    'Second Test',
    "'Standing on the shoulders of giants'",
    'Introduction to the study of the endgame',
    'Statistics',
    "Pieces' mobility",
    'The routes of the pieces',
    "The knight's strange routes",
    "The king's multiple routes",
    "The knight's domination",
    'The concept of a fortress. Some elementary examples',
  ],
)
assert.equal(
  introduction.sections.filter(({ type }) => type === 'table').length,
  1,
)
assert.equal(
  introduction.sections.filter(({ type }) => type === 'diagram').length,
  7,
)
assert.deepEqual(
  introduction.sections
    .filter(({ type }) => type === 'position')
    .map(({ content }) => (content as { number: string }).number),
  ['I.1', 'I.2', 'I.3', 'I.4', 'I.5', 'I.6'],
)

assert.deepEqual(
  book.parts.map(({ id }) => id),
  [
    'introduction',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    'bibliography',
  ],
)
assert.deepEqual(
  book.parts
    .filter(({ id }) => /^\d+$/.test(id))
    .map(({ sections }) => sections[0]?.content),
  [
    '1. Basic endings',
    '2. Basic Test',
    '3. Knight vs. Pawn',
    '4. Queen vs. Pawn',
    '5. Rook vs. Pawn',
    '6. Rook vs. 2 Pawns',
    '7. Same-coloured bishops: Bishop + Pawn vs. Bishop',
    '8. Bishop vs. Knight: one pawn on the board',
    '9. Opposite-coloured bishops: Bishop + 2 pawns vs. Bishop',
    '10. Rook + Pawn vs. Rook',
    '11. Rook + two Pawns vs. Rook',
    '12. Pawn endings',
    '13. Other material relations',
    '14. Final Test',
    '15. Appendix',
  ],
)

const appendix = book.parts.find(({ id }) => id === '15')
assert.ok(appendix, 'Expected Chapter 15 - Appendix')
assert.deepEqual(
  appendix.sections
    .filter(({ type }) => type === 'heading')
    .map(({ content }) => content),
  [
    '1. Fortresses',
    'Queen vs. 2 Minor Pieces',
    'Queen vs. Rook (and pawns)',
    'Rook vs. Bishop',
    'Different material relations: correct results',
    "Troitsky's Line",
  ],
)
assert.deepEqual(
  appendix.sections
    .filter(({ type }) => type === 'position')
    .map(({ content }) => (content as { number: string }).number),
  Array.from({ length: 19 }, (_, index) => `F${index + 1}`),
)
assert.equal(
  appendix.sections.some(
    ({ content, type }) =>
      type === 'diagram' &&
      (content as { number?: string }).number === 'troitsky-line',
  ),
  true,
)

const bibliography = book.parts.find(({ id }) => id === 'bibliography')
assert.ok(bibliography, 'Expected Bibliography')
assert.deepEqual(
  bibliography.sections
    .filter(({ type }) => type === 'heading')
    .map(({ content }) => content),
  [
    'Rey Ardid',
    'Averbakh',
    'John Nunn',
    'Paul Keres: Practical Chess Endings (Batsford)',
    'Levenfish & Smyslov: Rook Endings (Batsford)',
    'Ilya Maizelis: Pawn Endings (Batsford)',
    'Muller & Lamprecht: Secrets of Pawn Endings (Everyman)',
    'Muller & Lamprecht: Fundamental Chess Endings (Gambit)',
    "Mark Dvoretsky: Dvoretsky's Endgame Manual (Russell Enterprises)",
  ],
)

assert.equal(
  book.parts.flatMap(({ sections }) => sections).filter(
    ({ type }) =>
      type === 'diagram' || type === 'position' || type === 'problem',
  ).length,
  337,
)
assert.equal(
  book.parts
    .flatMap(({ sections }) => sections)
    .filter(
      ({ type }) =>
        type === 'diagram' || type === 'position' || type === 'problem',
    )
    .every(
      ({ content }) =>
        (content as { orientation?: string }).orientation === 'white',
    ),
  true,
  'Every PDF board must preserve the verified white-side orientation',
)

console.log('book source audit passed')
