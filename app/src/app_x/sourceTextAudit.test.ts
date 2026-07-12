import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import chapterManifest from './chapterManifest.json'
import type { RawChapterSection } from './chapterTypes'

const bannedFragments = [
  'Same procedure5ame',
  'Kffectiveness',
  'a5afe',
  'a5panish',
  'ad vanced',
  'appli cation',
  'behindered',
  'bat tlefield',
  'com ments',
  'con sisting',
  'cor rectly',
  'en emy',
  'ex tremely',
  'fmd out',
  'ifit advances',
  'j ourney',
  "l'la1",
  'maj or ity',
  'mul tiple',
  'n1any',
  'oppo sition',
  'orig inal',
  'po sition',
  'pre vent',
  're markable',
  're sistance',
  'remem ber',
  'resis tance',
  'se quence',
  'stron ger',
  'suc cessfully',
  'the5teinitz',
  'to wards',
  'trans ferred',
  'varia tions',
]
const isolatedArtifact = /^(?:\.{1,3}|\.\.•|[OoW+]|\+-|•• •••|=,)$/m

for (const chapter of chapterManifest) {
  const sections = JSON.parse(
    readFileSync(
      new URL(`./pdf/chapter_${chapter.id}.json`, import.meta.url),
      'utf8',
    ),
  ) as RawChapterSection[]

  assert.equal(
    sections.some((section) => section.type === 'moves'),
    false,
    `Chapter ${chapter.id} contains the retired moves type`,
  )

  sections.forEach((section, sectionIndex) => {
    for (const text of textualValues(section)) {
      const location = `Chapter ${chapter.id}, section ${sectionIndex}`
      assert.doesNotMatch(text, /[\u00ad\ufffd]/, `${location} has a broken glyph`)
      assert.doesNotMatch(
        text,
        /[A-Za-z]-\n\s*[a-z]/,
        `${location} has a line-break split word`,
      )
      assert.doesNotMatch(
        text,
        /[a-z][.!?][A-Z][a-z]/,
        `${location} has joined sentences`,
      )
      assert.doesNotMatch(
        text,
        isolatedArtifact,
        `${location} has an isolated extraction artifact`,
      )
      for (const fragment of bannedFragments) {
        assert.equal(
          text.includes(fragment),
          false,
          `${location} contains extraction fragment: ${fragment}`,
        )
      }
    }
  })
}

console.log('source text audit passed')

function textualValues(section: RawChapterSection) {
  if (typeof section.content === 'string') {
    return [section.content]
  }
  if (!section.content || typeof section.content !== 'object') {
    return []
  }
  return Object.entries(section.content)
    .filter(
      ([key, value]) =>
        key !== 'fen' && key !== 'number' && typeof value === 'string',
    )
    .map(([, value]) => value as string)
}
