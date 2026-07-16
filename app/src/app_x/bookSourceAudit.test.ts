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
  introduction: 'e3a05b9433b4520cf0ed496391533dbb5675879221ae9a6ec51b888d7a839a19',
  '1': '893614c125143c463b1b8297627acaaa760c5f4918028365569cde7a6f584f4e',
  '2': '26e286b0cf8588d557998c23a46a7556a24e4163e3b005cb7768a6742d58199c',
  '3': 'ee0e9a79b0978b33b1a5c137d6d429845d12d35ecb2351dc9ea49119801c7a17',
  '4': '14578ececcbd008f1cf7314f8d07f40e272d9f1b52b81384f5d4e0b812caaafc',
  '5': '182f476e7b1cc36f924f3a2c3be6ab09fdcb311f997b2fe45e968408cab6b97b',
  '6': 'f872e6c5974a73138f46901fd1afbc44084c5524f45e5f46543e44cf3b325ad4',
  '7': '358f7433f81a56079d128fd020fb1c874f046576f084a6d22de1e5ab0386bd97',
  '8': 'e5a9de3566b60304a4b7f2afbba471fbfe2a1ce3f9e5351efdfd9488170f069b',
  '9': '6e4ceac2c6661c0f4e0b39ee87c84016ca189804d21aaa25ef8935d132e07113',
  '10': '452e07283c4cde9ee91769d24fb898c423bcf58a20ae42c3231f5b7bf43b2cf3',
  '11': '9fb68899960a324f145eebf0e2446226bce5fefca77b9fdb83b3f8a2069ea6c7',
  '12': 'b881e83cf4ee7c37d94e1f78e5135e8dddc4123360f502aa44cc6b6fc9460c9e',
  '13': '6c5de163ea28e48d0a2981889ac300c9a4a8c38faa73ef2bf58657c8c1a419be',
  '14': '74969c1f7c7006048cad34a1fbab9cfe1eb65ab40d893978d7918948e51f07c5',
  '15': '91f006a7f307c7e2280d6312101a2ec515d99f9abc7f0bb8ea853b6366cc7a5a',
  bibliography: '9bea9ca8861558c859cf3ac0d48e298982900f3ee0aae24bc37313e78cd1a79d',
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
    '2. Different material relations: correct results',
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
    'Müller & Lamprecht: Secrets of Pawn Endings (Everyman)',
    'Müller & Lamprecht: Fundamental Chess Endings (Gambit)',
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
