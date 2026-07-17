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
  introduction: '2fbf959b948a1ac20a42f504d98b3beff09a8eb918757b01072734ec43a39fe4',
  '1': '7f902e9303fcdb8911562216f3d6b65b0dc97b3602b6c7f44f148de356cc1cb0',
  '2': '16fbd9017e859e11ce0a7d24b2560756fe1bfa1202503e68656df55bdaa17322',
  '3': '7ea53ec2fba56fbba9e2099f31c0e76624a83d11263e3ba77d2d49688a5605ac',
  '4': '58660269c8f7f9ec746d9175f8c45b92cd3d4b0e2ba6e914a9e18f300734fcbb',
  '5': '01863ba60f81c54fc9d346e90af6adc59a98aebf9787faca8fd391ab67420efd',
  '6': '164d31ccfe26ae1055b0503c98cbc24c6a5cb2fc3cb59f5ca8631ccb6e0f9682',
  '7': 'f94f9f714165cda9c448a4888fefcd635b12692778cbed881af8c5a700d9e9a5',
  '8': '9365f085d150318904b6141392ebe5d2a71e9d479330ad2ee8c9167fc14e007c',
  '9': '4e3f7811ca91ce4058edbff13613baffc0ecc81c1a0526b0b9e4b057ae191598',
  '10': '295d121bee1f846cf710caf83365de23d2c78c24aa070660f3506c4f3426e5eb',
  '11': '3a9ce294f687e9838070681822f34e7406b49f9d354c4a5d2211bd8539a91b5f',
  '12': '21d55a8187686347c5faff513d3df5265a08398c0582f5c41e826dc96bc6498c',
  '13': 'aec899ecf80c4da15d28f8d42687550d437b2e1e973ba76d6d2c91a5369a41d1',
  '14': 'b31d17791a6831fc777f25549effc3da0477e07d54dda21eb425eda14c718e51',
  '15': '08e4c29968b0b6c32974252e16b5e14aea05b850fca7a92b6450c2b8bac0c4a5',
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
