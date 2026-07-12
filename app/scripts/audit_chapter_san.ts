import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { chapterPayloadPath } from '../src/app_x/chapterPayloadManifest'
import type { RawChapterSection } from '../src/app_x/chapterTypes'
import {
  buildChapterPlayback,
  type TextPlaybackToken,
} from '../src/app_x/moveParser'

type ChapterPayload = {
  chapters: Array<{
    id: string
    sections: RawChapterSection[]
  }>
}

type SanMiss = {
  chapter: string
  display: string
  sectionIndex: number
  snippet: string
}

const chapterIds = process.argv.slice(2)
const selectedChapterIds = chapterIds.length ? chapterIds : ['10', '11', '12', '13']
const chapterPayload = JSON.parse(
  readFileSync(new URL(`../public/${chapterPayloadPath}`, import.meta.url), 'utf8'),
) as ChapterPayload

const sanScanPattern =
  /(?<![A-Za-z0-9])((\d+)\s*(\.\.\.|\.)\s*)?((?:O-O-O|O-O|0-0-0|0-0|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=?[QRBN])?|[a-h]x[a-h][1-8](?:=?[QRBN])?|[a-h][1-8](?:=?[QRBN])?)(?:[+#])?(?:[!?]+|=)?)/g

for (const chapterId of selectedChapterIds) {
  const chapter = chapterPayload.chapters.find(
    (chapterData) => chapterData.id === chapterId,
  )

  if (!chapter) {
    throw new Error(`Chapter ${chapterId} is not in the chapter payload.`)
  }

  const playback = buildChapterPlayback(chapter.sections)
  const misses = scanMisses(chapterId, chapter.sections, playback)
  const moveTokens = Array.from(playback.tokensBySectionIndex.values())
    .flat()
    .filter((token) => token.type === 'move')

  assertMoveTokensAreEnginePlayable(chapterId, moveTokens)

  console.log(
    [
      `CH${chapterId}`,
      `positions=${chapter.sections.filter((section) => section.type === 'position').length}`,
      `moveTokens=${moveTokens.length}`,
      `misses=${misses.length}`,
    ].join(' '),
  )

  for (const miss of misses.slice(0, 120)) {
    console.log(
      `${miss.chapter}:${miss.sectionIndex}:${miss.display}\t${miss.snippet}`,
    )
  }
}

function scanMisses(
  chapterId: string,
  sections: RawChapterSection[],
  playback: ReturnType<typeof buildChapterPlayback>,
) {
  const misses: SanMiss[] = []

  for (const [sectionIndex, section] of sections.entries()) {
    const sectionText = getSectionText(section)

    if (!sectionText) {
      continue
    }

    const tokens = playback.tokensBySectionIndex.get(sectionIndex)

    if (!tokens) {
      misses.push(...findSanMisses(chapterId, sectionIndex, sectionText))
      continue
    }

    for (const token of tokens) {
      if (token.type === 'text') {
        misses.push(...findSanMisses(chapterId, sectionIndex, token.text))
      }
    }
  }

  return misses
}

function assertMoveTokensAreEnginePlayable(
  chapterId: string,
  tokens: Array<Extract<TextPlaybackToken, { type: 'move' }>>,
) {
  for (const token of tokens) {
    const chess = new Chess(token.parentFen)
    const move = chess.move(token.san, { strict: false })

    if (!move || chess.fen() !== token.fen) {
      throw new Error(
        `Chapter ${chapterId} has a non-replayable move token ${token.display}.`,
      )
    }
  }
}

function findSanMisses(
  chapter: string,
  sectionIndex: number,
  text: string,
): SanMiss[] {
  return Array.from(text.matchAll(sanScanPattern))
    .map((match) => ({
      display: match[0],
      index: match.index ?? 0,
    }))
    .filter(({ display, index }) => !shouldIgnoreSanDisplay(display, text, index))
    .map(({ display, index }) => ({
      chapter,
      display,
      sectionIndex,
      snippet: getSnippet(text, index, display.length),
    }))
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

function getSnippet(text: string, index: number, length: number) {
  return text
    .slice(Math.max(0, index - 48), index + length + 48)
    .replace(/\s+/g, ' ')
    .trim()
}
