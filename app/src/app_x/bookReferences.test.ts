import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildBookReferenceIndex,
  buildChapterReferences,
  parseBookReferences,
} from './bookReferences'
import { validateBookSource } from './bookSourceValidation'
import type { BookPartSource } from './chapterTypes'

const targetChapter: BookPartSource = {
  id: '1',
  label: 'Chapter 1',
  name: 'Targets',
  sections: [
    { type: 'ending', content: { number: '1', text: 'First' } },
    { type: 'ending', content: { number: '2', text: 'Second' } },
    { type: 'ending', content: { number: '3', text: 'Third' } },
    {
      type: 'position',
      content: {
        fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
        number: '1.1',
        orientation: 'white',
      },
    },
    {
      type: 'diagram',
      content: {
        fen: '8/8/8/8/8/8/8/K6k',
        label: 'Position 1.2',
        number: '1.2',
        orientation: 'white',
      },
    },
    {
      type: 'problem',
      content: {
        fen: '8/8/8/8/8/8/8/K6k w - - 0 1',
        number: '1.3',
        orientation: 'white',
        prompt: 'Solve it.',
        solution: 'See Ending 1.',
      },
    },
  ],
}
const sourceChapter: BookPartSource = {
  id: '2',
  label: 'Chapter 2',
  name: 'Sources',
  sections: [
    {
      type: 'text',
      content:
        'See Endings 1, 2 and 3; Position 1.1; diagrams 1.2 or 1.3. Move 1. e4.',
    },
    {
      type: 'panel',
      content: { text: 'Compare positions 1.1-1.3.' },
    },
  ],
}
const referenceIndex = buildBookReferenceIndex([targetChapter, sourceChapter])
const parsed = parseBookReferences(sourceChapter.sections[0].content as string, {
  field: 'content',
  index: referenceIndex,
  location: 'synthetic prose',
})

assert.deepEqual(parsed.unresolved, [])
assert.deepEqual(
  parsed.spans.map(({ href, kind, number }) => ({ href, kind, number })),
  [
    { href: '/book/chapter1#e1', kind: 'ending', number: '1' },
    { href: '/book/chapter1#e2', kind: 'ending', number: '2' },
    { href: '/book/chapter1#e3', kind: 'ending', number: '3' },
    { href: '/book/chapter1#p1.1', kind: 'board', number: '1.1' },
    { href: '/book/chapter1#p1.2', kind: 'board', number: '1.2' },
    { href: '/book/chapter1#p1.3', kind: 'board', number: '1.3' },
  ],
)
assert.deepEqual(
  parsed.spans.map(({ end, start }) =>
    (sourceChapter.sections[0].content as string).slice(start, end),
  ),
  ['1', '2', '3', '1.1', '1.2', '1.3'],
)

const chapterReferences = buildChapterReferences(sourceChapter, referenceIndex)
assert.equal(chapterReferences.length, 2)
assert.deepEqual(
  chapterReferences[1][1].map(({ number }) => number),
  ['1.1', '1.3'],
)

const selfReferenceChapter: BookPartSource = {
  id: '3',
  label: 'Chapter 3',
  name: 'Self references',
  sections: [
    targetChapter.sections[0],
    { type: 'text', content: 'Ending 1 leads to Ending 2.' },
    targetChapter.sections[3],
    { type: 'text', content: 'Position 1.1 resembles Position 1.2.' },
  ],
}
const selfReferences = buildChapterReferences(
  selfReferenceChapter,
  referenceIndex,
)
assert.deepEqual(
  selfReferences.flatMap(([, spans]) => spans.map(({ number }) => number)),
  ['2', '1.2'],
)

const brokenChapter: BookPartSource = {
  id: '4',
  label: 'Chapter 4',
  name: 'Broken references',
  sections: [
    { type: 'text', content: 'See Ending 99 and positions 1.1-1.4.' },
  ],
}
assert.throws(
  () => buildChapterReferences(brokenChapter, referenceIndex),
  /board 1\.4[\s\S]*ending 99/,
)

const book = validateBookSource(
  JSON.parse(readFileSync(new URL('./pdf/book.json', import.meta.url), 'utf8')),
)
const fullBookIndex = buildBookReferenceIndex(book.parts)
const fullBookReferences = book.parts.flatMap((chapter) =>
  buildChapterReferences(chapter, fullBookIndex),
)
const fullBookSpanCount = fullBookReferences.reduce(
  (count, [, spans]) => count + spans.length,
  0,
)

assert.equal(fullBookSpanCount, 95)

console.log('book reference tests passed')
