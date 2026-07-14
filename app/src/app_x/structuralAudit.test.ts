import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chapterPayloadPath } from './chapterPayloadManifest'
import type { RuntimeChapterPayload } from './chapterRuntime'
import type { RawChapterSection } from './chapterTypes'

type StructureAudit = {
  chapterSpilloversRemoved: string[]
  countsByChapter: Record<
    string,
    {
      headings: number
      panels: number
      positions: number
      subtitles: number
    }
  >
  endingBoundaries: Array<{
    chapter: string
    ending: string
    page: number
    targetStartsWith: string
    targetType: string
  }>
  recoveredVectorBoxPanels: Array<{
    chapter: string
    textStartsWith: string
  }>
  schemaVersion: number
  standaloneHeadings: Array<{ chapter: string; text: string }>
  subtitles: Array<{ chapter: string; position: string; text: string }>
}

const payload = JSON.parse(
  readFileSync(
    new URL(`../../public/${chapterPayloadPath}`, import.meta.url),
    'utf8',
  ),
) as RuntimeChapterPayload
const structureAudit = JSON.parse(
  readFileSync(new URL('./pdf/pdf_structure_audit.json', import.meta.url), 'utf8'),
) as StructureAudit
const allSections = payload.chapters.flatMap((chapter) => chapter.sections)

assert.equal(structureAudit.schemaVersion, 2)
assert.equal(
  allSections.filter((section) => section.type === 'ending').length,
  100,
)
assert.deepEqual(
  allSections
    .filter((section) => section.type === 'ending' && isRecord(section.content))
    .map((section) => Number((section.content as Record<string, unknown>).number))
    .sort((left, right) => left - right),
  Array.from({ length: 100 }, (_, index) => index + 1),
)
assert.equal(structureAudit.endingBoundaries.length, 100)
assert.equal(allSections.some((section) => section.type === 'moves'), false)

for (const chapter of payload.chapters) {
  const sourceSections = JSON.parse(
    readFileSync(
      new URL(`./pdf/chapter_${chapter.id}.json`, import.meta.url),
      'utf8',
    ),
  ) as RawChapterSection[]
  assert.equal(
    sourceSections.some((section) => section.type === 'moves'),
    false,
    `Chapter ${chapter.id} source still contains a moves section`,
  )

  const expectedCounts = structureAudit.countsByChapter[chapter.id]
  if (expectedCounts) {
    assert.deepEqual(
      {
        headings: sourceSections.filter(({ type }) => type === 'heading').length,
        panels: sourceSections.filter(({ type }) => type === 'panel').length,
        positions: sourceSections.filter(({ type }) => type === 'position').length,
        subtitles: sourceSections.filter(
          (section) =>
            section.type === 'position' &&
            isRecord(section.content) &&
            typeof section.content.subtitle === 'string',
        ).length,
      },
      expectedCounts,
      `Chapter ${chapter.id} structure count drifted from the PDF audit`,
    )
  }

  for (const section of chapter.sections) {
    validateSection(chapter.id, section)
  }
}

assertProblemChapter('2', 26)
assertProblemChapter('14', 36)

for (const boundary of structureAudit.endingBoundaries) {
  const chapter = getChapter(boundary.chapter)
  const endingIndex = chapter.sections.findIndex(
    (section) =>
      section.type === 'ending' &&
      isRecord(section.content) &&
      section.content.number === boundary.ending,
  )
  assert.notEqual(endingIndex, -1, `Missing ending ${boundary.ending}`)
  const target = chapter.sections[endingIndex + 1]
  assert.ok(target, `Ending ${boundary.ending} has no following source section`)
  assert.equal(target.type, boundary.targetType)
  assert.equal(
    normalize(sectionSearchText(target)).startsWith(
      normalize(boundary.targetStartsWith).split(' ').slice(0, 6).join(' '),
    ),
    true,
    `Ending ${boundary.ending} is not followed by its PDF-aligned content`,
  )
}

for (const expected of structureAudit.subtitles) {
  const position = getPosition(expected.chapter, expected.position)
  assert.equal(position.content.subtitle, expected.text)
}

for (const expected of structureAudit.standaloneHeadings) {
  assert.equal(
    getChapter(expected.chapter).sections.some(
      (section) =>
        section.type === 'heading' && section.content === expected.text,
    ),
    true,
    `Expected heading in chapter ${expected.chapter}: ${expected.text}`,
  )
}

for (const expected of structureAudit.recoveredVectorBoxPanels) {
  const expectedTitle = 'title' in expected ? expected.title ?? '' : ''
  const normalizedTitlePrefix = normalize(`${expectedTitle}:`)
  const normalizedExpectedText = normalize(expected.textStartsWith)
  const start = (
    normalizedExpectedText.startsWith(normalizedTitlePrefix)
      ? normalizedExpectedText.slice(normalizedTitlePrefix.length).trim()
      : normalizedExpectedText
  ).split(' ').slice(0, 5).join(' ')
  assert.equal(
    getChapter(expected.chapter).sections.some((section) => {
      if (section.type !== 'panel' || !isRecord(section.content)) {
        return false
      }

      const title = typeof section.content.title === 'string'
        ? section.content.title
        : ''
      const text = typeof section.content.text === 'string'
        ? section.content.text
        : ''
      return title === expectedTitle && normalize(text).startsWith(start)
    }),
    true,
    `Expected recovered panel in chapter ${expected.chapter}: ${expected.textStartsWith}`,
  )
}

const positionOneNine = getPosition('1', '1.9')
assert.equal(positionOneNine.content.subtitle, undefined)
assert.deepEqual(
  (positionOneNine.content.markers as Array<{ square: string }>).map(
    ({ square }) => square,
  ),
  ['e6', 'f6', 'g6'],
)
assert.equal(getPosition('1', '1.10').content.subtitle, "Knight's pawn")

const chapterElevenComparisonPositions = getChapter('11').sections.filter(
  (section) =>
    section.type === 'position' &&
    isRecord(section.content) &&
    String(section.content.number).startsWith('11.series.'),
)
assert.equal(chapterElevenComparisonPositions.length, 9)
assert.deepEqual(
  chapterElevenComparisonPositions.map(
    (section) => (section.content as Record<string, unknown>).displayLabel,
  ),
  [
    'Draw',
    'White wins',
    'Draw',
    'White wins',
    'White wins',
    'White wins',
    'Draw',
    'White wins',
    'Draw',
  ],
)

const positionThirteenTwenty = getPosition('13', '13.20')
assert.equal(
  positionThirteenTwenty.content.fen,
  '5k2/1R6/5P2/3b2K1/8/8/8/8 w - - 0 4',
)
assert.deepEqual(
  (positionThirteenTwenty.content.markers as Array<{ square: string }>).map(
    ({ square }) => square,
  ),
  ['b1', 'b2', 'c3', 'e4'],
)

assert.equal(
  getProblem('14', '14.22').content.fen,
  '8/7p/8/6K1/3k2PP/8/2b5/8 b - - 0 54',
)
assert.equal(
  getProblem('14', '14.29').content.fen,
  '8/8/2pr4/R7/8/1k6/4K3/8 w - - 0 69',
)

const chapterOne = getChapter('1')
const endingTwoIndex = chapterOne.sections.findIndex(
  (section) =>
    section.type === 'ending' &&
    isRecord(section.content) &&
    section.content.number === '2',
)
assert.equal(chapterOne.sections[endingTwoIndex + 1].type, 'heading')
assert.equal(chapterOne.sections[endingTwoIndex + 1].content, 'Opposition')
assert.equal(chapterOne.sections[endingTwoIndex + 2].type, 'text')
assert.equal(
  (chapterOne.sections[endingTwoIndex + 2].content as string).startsWith(
    'We have just seen what happens',
  ),
  true,
)
for (const index of [endingTwoIndex, endingTwoIndex + 1, endingTwoIndex + 2]) {
  assert.deepEqual(
    chapterOne.renderItems.find((item) => item.index === index),
    { index, type: 'section' },
  )
}
const positionOneFourIndex = chapterOne.sections.findIndex(
  (section) =>
    section.type === 'position' &&
    isRecord(section.content) &&
    section.content.number === '1.4',
)
const positionOneFourItem = chapterOne.renderItems.find(
  (item) => item.index === positionOneFourIndex,
)
assert.ok(positionOneFourItem)
assert.equal(positionOneFourItem.type, 'positionGroup')
assert.equal(
  positionOneFourItem.type === 'positionGroup' &&
    positionOneFourItem.contentIndexes.includes(endingTwoIndex + 2),
  false,
)

assert.equal(
  JSON.stringify(getChapter('10').sections).includes(
    'In rook endings, there are many positions where two pawns are not enough to win.',
  ),
  false,
)
assert.equal(
  JSON.stringify(getChapter('11').sections).includes(
    'After many chapters, we come back to pawn endings.',
  ),
  false,
)
assert.equal(
  JSON.stringify(getChapter('12').sections).includes(
    'This is the last chapter on endgame theory',
  ),
  false,
)
assert.equal(JSON.stringify(getChapter('13').sections).includes('14.01'), false)

console.log('structural audit passed')

function validateSection(chapterId: string, section: RawChapterSection) {
  if (section.type === 'heading') {
    assert.equal(typeof section.content, 'string')
    assert.notEqual((section.content as string).trim(), '')
  }

  if (section.type === 'panel') {
    assert.equal(isRecord(section.content), true)
    if (!isRecord(section.content)) {
      return
    }
    assert.equal(typeof section.content.text, 'string')
    assert.notEqual((section.content.text as string).trim(), '')
    if (section.content.title !== undefined) {
      assert.equal(typeof section.content.title, 'string')
    }
  }

  if (section.type === 'position' && isRecord(section.content)) {
    const number = String(section.content.number)
    const caption = section.content.caption
    assert.notEqual(
      typeof caption === 'string' ? normalize(caption) : '',
      normalize(`Position ${number}`),
      `Chapter ${chapterId} position ${number} repeats its number as a caption`,
    )
  }


  if (section.type === 'problem') {
    assert.equal(isRecord(section.content), true)
    if (!isRecord(section.content)) {
      return
    }
    for (const field of ['number', 'prompt', 'fen', 'solution']) {
      assert.equal(
        typeof section.content[field],
        'string',
        `Chapter ${chapterId} problem is missing ${field}`,
      )
      assert.notEqual(String(section.content[field]).trim(), '')
    }
  }
}

function assertProblemChapter(chapterId: string, expectedCount: number) {
  const problems = getChapter(chapterId).sections.filter(
    (section) => section.type === 'problem' && isRecord(section.content),
  )
  assert.equal(problems.length, expectedCount)
  assert.deepEqual(
    problems.map((section) => (section.content as Record<string, unknown>).number),
    Array.from(
      { length: expectedCount },
      (_, index) => `${chapterId}.${String(index + 1).padStart(2, '0')}`,
    ),
  )
}

function getChapter(chapterId: string) {
  const chapter = payload.chapters.find(({ id }) => id === chapterId)
  assert.ok(chapter, `Expected chapter ${chapterId}`)
  return chapter
}

function getPosition(chapterId: string, positionNumber: string) {
  const section = getChapter(chapterId).sections.find(
    (candidate) =>
      candidate.type === 'position' &&
      isRecord(candidate.content) &&
      candidate.content.number === positionNumber,
  )
  assert.ok(section, `Expected position ${positionNumber}`)
  assert.equal(isRecord(section.content), true)
  return section as RawChapterSection & {
    content: Record<string, unknown>
  }
}

function getProblem(chapterId: string, problemNumber: string) {
  const section = getChapter(chapterId).sections.find(
    (candidate) =>
      candidate.type === 'problem' &&
      isRecord(candidate.content) &&
      candidate.content.number === problemNumber,
  )
  assert.ok(section, `Expected problem ${problemNumber}`)
  assert.equal(isRecord(section.content), true)
  return section as RawChapterSection & {
    content: Record<string, unknown>
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function sectionSearchText(section: RawChapterSection) {
  if (section.type === 'position' && isRecord(section.content)) {
    return `Position ${section.content.number}`
  }
  if (typeof section.content === 'string') {
    return section.content
  }
  if (isRecord(section.content)) {
    return [section.content.title, section.content.text]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
  }
  return ''
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
