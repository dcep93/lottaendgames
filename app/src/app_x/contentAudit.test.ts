import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { chapterPayloadPath } from './chapterPayloadManifest'
import type { RawChapterSection } from './chapterTypes'
import { buildChapterPlayback, type TextPlaybackToken } from './moveParser'

type ChapterFixture = {
  number: string
  sections: RawChapterSection[]
}

type ChapterPayload = {
  chapters: Array<{
    id: string
    sections: RawChapterSection[]
  }>
  contentHash: string
  schemaVersion: number
}

const chapterPayload = JSON.parse(
  readFileSync(
    new URL(`../../public/${chapterPayloadPath}`, import.meta.url),
    'utf8',
  ),
) as ChapterPayload
const chapters: ChapterFixture[] = [
  { number: '5', sections: getChapterSections('5') },
  { number: '6', sections: getChapterSections('6') },
  { number: '7', sections: getChapterSections('7') },
  { number: '8', sections: getChapterSections('8') },
  { number: '9', sections: getChapterSections('9') },
]

// Strict SAN playback stays scoped to chapters whose diagram anchors and OCR
// notation are fully verified. Newly extracted chapters first enter the payload
// as structured text/captions, then join this audit after their diagrams promote
// to verified position FENs.

const sanScanPattern =
  /(?<![A-Za-z0-9])((\d+)\s*(\.\.\.|\.)\s*)?((?:O-O-O|O-O|0-0-0|0-0|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=?[QRBN])?|[a-h]x[a-h][1-8](?:=?[QRBN])?|[a-h][1-8](?:=?[QRBN])?)(?:[+#])?(?:[!?]+|=)?)/g

const ignoredSanMisses: Record<string, string> = {
  '5:44:Re1+': 'Threat text: "The threat is Re1+".',
  '6:31:Rh7': 'Prose reference: "in case Rh7 is needed".',
  '7:11:Bf3': 'Prose manoeuvre reference: "Bf3-c6".',
  '7:22:Kg6': 'Prose alternative: "we could play first ...Kg6".',
  '7:31:Ke8': 'Prose reference: "If White allows Ke8".',
  '8:5:3...Ng3': 'Threat text: "threatening 3...Ng3".',
  '8:5:Ne3': 'Prose reference to a tactical prevention.',
  '8:7:Nf5': 'Prose reference: "followed by ...Nf5".',
  '8:12:Ng2': 'Threat text: "the threat was ...Ng2".',
  '8:18:Nb2': 'Threat text: "the threat is ...Nb2".',
  '9:37:Kf5': 'Prose plan reference: "by means of f3-f4 and Kf5".',
  '9:42:Kf5': 'Prose example: "Other moves, such as Kf5".',
  '9:47:Ka2': 'Threat text: "threatening ...Ka2".',
  '9:49:Bf5': 'Threat/forcing prose, not a played move.',
  '9:49:Ka2': 'Conditional prose, not a played move.',
}

const seenIgnoredSanMisses = new Set<string>()

for (const chapter of chapters) {
  auditChapter(chapter)
}

assert.deepEqual(
  [...Object.keys(ignoredSanMisses)].filter(
    (key) => !seenIgnoredSanMisses.has(key),
  ),
  [],
  'Every content-audit SAN ignore should still correspond to a found prose/threat token.',
)

console.log('content audit passed')

function getChapterSections(chapterId: string) {
  const chapter = chapterPayload.chapters.find(
    (chapterData) => chapterData.id === chapterId,
  )

  assert.ok(chapter, `Expected chapter ${chapterId} in chapter payload.`)

  return chapter.sections
}

function auditChapter({ number, sections }: ChapterFixture) {
  const playback = buildChapterPlayback(sections)
  const unplayableSanDisplays: string[] = []

  for (const [sectionIndex, section] of sections.entries()) {
    const sectionText = getSectionText(section)

    if (!sectionText) {
      continue
    }

    const tokens = playback.tokensBySectionIndex.get(sectionIndex)

    if (!tokens) {
      unplayableSanDisplays.push(
        ...findSanDisplays(sectionText).map(
          (display) => `${number}:${sectionIndex}:${display}`,
        ),
      )
      continue
    }

    for (const token of tokens) {
      if (token.type === 'move') {
        assertMoveTokenIsEnginePlayable(number, sectionIndex, token)
      } else {
        unplayableSanDisplays.push(
          ...findSanDisplays(token.text).map(
            (display) => `${number}:${sectionIndex}:${display}`,
          ),
        )
      }
    }
  }

  const unexpectedMisses = unplayableSanDisplays.filter((miss) => {
    if (miss in ignoredSanMisses) {
      seenIgnoredSanMisses.add(miss)
      return false
    }

    return true
  })

  assert.deepEqual(
    unexpectedMisses,
    [],
    `Chapter ${number} has SAN-looking text that was not converted to a playable move token.`,
  )
}

function assertMoveTokenIsEnginePlayable(
  chapterNumber: string,
  sectionIndex: number,
  token: Extract<TextPlaybackToken, { type: 'move' }>,
) {
  const chess = new Chess(token.parentFen)
  const move = chess.move(token.san, { strict: false })
  const label = `${chapterNumber}:${sectionIndex}:${token.display}`

  assert.equal(move.san, token.path.at(-1), `${label} path should end with SAN.`)
  assert.equal(chess.fen(), token.fen, `${label} should replay to token FEN.`)
}

function getSectionText(section: RawChapterSection) {
  if (typeof section.content === 'string') {
    return section.content
  }

  if (
    section.type === 'panel' &&
    section.content &&
    typeof section.content === 'object' &&
    'text' in section.content &&
    typeof section.content.text === 'string'
  ) {
    return section.content.text
  }

  return ''
}

function findSanDisplays(text: string) {
  return Array.from(text.matchAll(sanScanPattern))
    .map((match) => ({
      display: match[0],
      index: match.index ?? 0,
    }))
    .filter(({ display, index }) => !shouldIgnoreSanDisplay(display, text, index))
    .map(({ display }) => display)
}

function shouldIgnoreSanDisplay(display: string, text: string, index: number) {
  if (/^\d+$/.test(display)) {
    return true
  }

  return (
    /^[a-h][1-8]$/.test(display) &&
    !/\d\s*(?:\.|\.\.\.)\s*$/.test(text.slice(Math.max(0, index - 12), index))
  )
}
