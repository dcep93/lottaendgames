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

assertChapterIncludes(
  '7',
  'The winning sequence is easy to analyse and I suggest doing it as an Exercise.',
)
assertChapterIncludes('7', '6...Ba4? would lose a tempo and the game')
assertChapterIncludes('8', 'Let us have a look at the following example')
assertChapterIncludes(
  '8',
  'Recommended Exercise: Look carefully at the following series about knight blockade',
)
assertChapterIncludes(
  '9',
  'We will divide our study material into positions with separated pawns and positions with connected pawns.',
)
assertChapterIncludes('9', 'Final summary')
assertChapterIncludes('9', 'When pawns are separated by TWO files')
assertChapterIncludes(
  '12',
  '12.Kg6 Kf4 13.Kxh6 Kf5 14.Kg7+- and the pawn promotes.',
)

console.log('source text audit passed')

function assertChapterIncludes(chapterId: string, expected: string) {
  const sections = JSON.parse(
    readFileSync(
      new URL(`./pdf/chapter_${chapterId}.json`, import.meta.url),
      'utf8',
    ),
  ) as RawChapterSection[]
  const chapterText = sections.flatMap(textualValues).join('\n')

  assert.equal(
    normalizeText(chapterText).includes(normalizeText(expected)),
    true,
    `Chapter ${chapterId} is missing source passage: ${expected}`,
  )
}

function normalizeText(value: string) {
  return value.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim()
}

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
