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
  '1': 'e9937142968f01369ae9e25397849c8cbbaa6db275573e95724af9063bbfdab2',
  '2': '6e11ef1f22592c83726ea49cd7077237aceb9064c759d01a178b2d76726b87df',
  '3': 'eb5c27d8a600692640e4aa9ce7a7a0c507ce8ddb2114a8019ffc08566fa40133',
  '4': 'a85c5647d426a9af50c8d70b510342c2cbb693200efb5f3ee4a1dceea43077c1',
  '5': '2d69ae40c921ebaaf2909d5f89f6d8f1967c42e6cd78f32d28075aef7264352b',
  '6': '047c9cf44ae417fd18284d01ec53b8ff1617a21f0fe810f7941795316964a17d',
  '7': '0e9f5266db5044b7f32e14d29da88a127eb3c5c43f71bd1c5d5c40783d80fb8e',
  '8': '2787ab4b39c981919e3e423aa5fda866baaf6903ac5dd2011b56808a2cd27bb2',
  '9': '8776f5e9d612fc5b7a17535b8c1643526229bb84d1b7ab5844b7cf091532118b',
  '10': 'c2310087b2e96a8e6714f0da31c2156966d4512b1ac25ee9261542ccd17cbd19',
  '11': 'fb8215558ef43c4a1cb97d327b932acc1722a5548df0d3b68d536aff91870d89',
  '12': 'b1d8b319bbd15c42d9d49d71d08a6272d8561ff1416ff9f7896cfcdca35942ee',
  '13': '314bc3a34a4e7c48b56f091c691429ffc8a6788b92229684a2980cdae0cd02f4',
  '14': 'c1d891a295b33c9513a85c5f83a16bdef08fa1adec2ad8a8d97ecdb73370911c',
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

console.log('book source audit passed')
