import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { chapterPayloadPath } from './chapterPayloadManifest'
import type { RawChapterSection } from './chapterTypes'
import {
  buildChapterPlayback,
  isProseSanReference,
  type TextPlaybackToken,
} from './moveParser'

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

for (const chapter of chapters) {
  auditChapter(chapter)
}

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
      }
    }

    for (const textRun of contiguousTextRuns(tokens)) {
      unplayableSanDisplays.push(
        ...findSanDisplays(textRun).map(
          (display) => `${number}:${sectionIndex}:${display}`,
        ),
      )
    }
  }

  assert.deepEqual(
    unplayableSanDisplays,
    [],
    `Chapter ${number} has SAN-looking text that was not converted to a playable move token.`,
  )
}

function contiguousTextRuns(tokens: TextPlaybackToken[]) {
  const runs: string[] = []
  let current = ''

  for (const token of tokens) {
    if (token.type === 'move') {
      if (current) {
        runs.push(current)
        current = ''
      }
      continue
    }

    current += token.text
  }

  if (current) {
    runs.push(current)
  }

  return runs
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

  if (isProseSanReference(text, index, display.length)) {
    return true
  }

  return (
    /^[a-h][1-8]$/.test(display) &&
    !/\d\s*(?:\.|\.\.\.)\s*$/.test(text.slice(Math.max(0, index - 12), index))
  )
}
