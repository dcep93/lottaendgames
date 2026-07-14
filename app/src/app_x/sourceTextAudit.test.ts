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
assertChapterIncludes('8', 'When the defending king is further away')
assertChapterIncludes('8', 'First scenario: The defending king manages')
assertChapterIncludes(
  '9',
  'We will divide our study material into positions with separated pawns and positions with connected pawns.',
)
assertChapterIncludes('9', '1) A bishop check to force the enemy king')
assertChapterIncludes('9', '3...Ba2 4.Kd2')
assertChapterIncludes('9', '5.Kc3 followed by Kb4, Kc5 and d5')
assertChapterIncludes('9', 'This pawn structure allows wins')
assertChapterIncludes('9', '13...Kd7 14.Kf6 Bh5')
assertChapterIncludes('9', 'Final summary')
assertChapterIncludes('9', 'When pawns are separated by TWO files')
assertChapterIncludes(
  '12',
  '12.Kg6 Kf4 13.Kxh6 Kf5 14.Kg7+- and the pawn promotes.',
)
assertChapterIncludes('1', '2...Ke7 3.f6+ Ke6 4.f7 1-0')
assertChapterIncludes('1', '1... Kg8 2. Kh6 Kh8 3.g6')
assertChapterIncludes('1', '3...Kg8 4.g7 Kf7 5. Kh7 1-0')
assertChapterIncludes('1', 'Preventing 1...Kb2 and threatening 2.Kb1.')
assertChapterIncludes('1', '2... Bb3 3. Kg6')
assertChapterIncludes('1', '3... Bc4')
assertChapterIncludes('1', 'Thus 3...Be6?? would be bad')
assertChapterIncludes('1', '3. Kf1 Re2 4.Nc3')
assertChapterIncludes('1', 'Kamsky - Bacrot, Sofia 2006')
assertChapterIncludes('2', '1...c2 2.Ne2+!')
assertChapterIncludes('2', '3.Bb5! Kd8')
assertChapterIncludes('3', 'in case of 1...Kd1')
assertChapterIncludes('3', 'The other barrier')
assertChapterIncludes('3', '1...Kd4?! 2.Nf2!')
assertChapterIncludes('4', '1... Qd7+ 2. Kg6 Qe6+ 3. Kg7 Qe7+')
assertChapterIncludes('4', '3... Qf6+ 4. Kg8 Ke6!')
assertChapterIncludes('4', '1... Qe5+')
assertChapterIncludes('4', '2. Kd7 Qf6 3. Ke8 Qe6+ 4. Kf8')
assertChapterIncludes('4', '3. Ke7 Qe5+ 4. Kd7 Qf6 5. Ke8 Qe6+')
assertChapterIncludes('4', '4. Kf6 Qd4+ 5. Ke7 Qg7')
assertChapterIncludes('5', 'We are going to see a tough fight')
assertChapterIncludes('5', 'The study of these last positions has provided us')
assertChapterIncludes('5', 'The king pushing from the rear is a very effective')
assertChapterIncludes('5', "The rook's pawn is not worse than the others")
assertChapterIncludes('6', 'Extreme position. Rook behind the pawns')
assertChapterIncludes('6', "Stronger side's king on one side of the pawns")
assertChapterIncludes('6', 'The series of checks')
assertChapterIncludes('6', 'Analysis diagram 6.7')
assertChapterIncludes('7', 'An apparent exception. 3-square diagonal')
assertChapterIncludes('7', '6.f6++-')
assertChapterIncludes('7', 'Revision of some assorted themes')

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
