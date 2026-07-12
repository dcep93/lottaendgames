import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { chapterPayloadPath } from '../src/app_x/chapterPayloadManifest'
import type { RawChapterSection } from '../src/app_x/chapterTypes'
import {
  buildChapterPlayback,
  isProseMoveReference,
  isProseMoveReferenceContinuation,
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
  reason: SanMissReason
  sectionIndex: number
  snippet: string
}

type SanMissReason =
  | 'branch-or-anchor'
  | 'numbering-or-spacing'
  | 'ocr-piece-glyph'
  | 'prose-reference'
  | 'unparsed-section'

type ChapterAudit = {
  chapter: string
  misses: SanMiss[]
  moveTokens: number
  positions: number
}

const args = process.argv.slice(2)
const options = new Set(args.filter((arg) => arg.startsWith('--')))
const chapterIds = args.filter((arg) => !arg.startsWith('--'))
const strictMode = options.has('--strict') && !options.has('--advisory')
const detailLimit = strictMode || options.has('--summary')
  ? 0
  : Number(options.has('--all') ? Number.MAX_SAFE_INTEGER : 120)
const chapterPayload = JSON.parse(
  readFileSync(new URL(`../public/${chapterPayloadPath}`, import.meta.url), 'utf8'),
) as ChapterPayload
const selectedChapterIds = chapterIds.length
  ? chapterIds
  : strictMode
    ? chapterPayload.chapters.map((chapter) => chapter.id)
    : ['10', '11', '12', '13']

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
  const moveTokens = Array.from(playback.tokensBySectionIndex.values())
    .flat()
    .filter((token) => token.type === 'move')

  assertMoveTokensAreEnginePlayable(chapterId, moveTokens)

  printChapterAudit({
    chapter: chapterId,
    misses: strictMode ? [] : scanMisses(chapterId, chapter.sections, playback),
    moveTokens: moveTokens.length,
    positions: chapter.sections.filter((section) => section.type === 'position')
      .length,
  })
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
      misses.push(
        ...findSanMisses(chapterId, sectionIndex, sectionText, []).map((miss) => ({
          ...miss,
          reason: 'unparsed-section' as const,
        })),
      )
      continue
    }

    for (const [tokenIndex, token] of tokens.entries()) {
      if (token.type === 'text') {
        misses.push(
          ...findSanMisses(
            chapterId,
            sectionIndex,
            token.text,
            getNeighborFens(tokens, tokenIndex),
          ),
        )
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
  localFens: string[],
): SanMiss[] {
  return Array.from(text.matchAll(sanScanPattern))
    .map((match) => ({
      display: match[0],
      index: match.index ?? 0,
    }))
    .filter(({ display, index }) =>
      shouldReportSanLeftover(display, text, index, localFens),
    )
    .map(({ display, index }) => ({
      chapter,
      display,
      reason: classifySanMiss(display, text, index),
      sectionIndex,
      snippet: getSnippet(text, index, display.length),
    }))
}

function shouldReportSanLeftover(
  display: string,
  text: string,
  index: number,
  localFens: string[],
) {
  if (shouldIgnoreSanDisplay(display, text, index)) {
    return false
  }

  if (classifySanMiss(display, text, index) !== 'branch-or-anchor') {
    return false
  }

  return (
    !isIntentionalNonMoveReference(display, text, index) &&
    isLegalFromAnyFen(display, localFens)
  )
}

function getNeighborFens(tokens: TextPlaybackToken[], tokenIndex: number) {
  const fens = new Set<string>()
  const previousMove = findNeighborMoveToken(tokens, tokenIndex, -1)

  if (previousMove) {
    fens.add(previousMove.fen)
  }

  return [...fens]
}

function findNeighborMoveToken(
  tokens: TextPlaybackToken[],
  tokenIndex: number,
  direction: -1 | 1,
) {
  for (
    let index = tokenIndex + direction;
    index >= 0 && index < tokens.length;
    index += direction
  ) {
    const token = tokens[index]

    if (token.type === 'move') {
      return token
    }

    if (token.text.trim()) {
      return null
    }
  }

  return null
}

function isLegalFromAnyFen(display: string, fens: string[]) {
  if (!fens.length) {
    return false
  }

  const san = normalizeDisplaySan(display)

  return fens.some((fen) => {
    try {
      const chess = new Chess(fen)
      return Boolean(chess.move(san, { strict: false }))
    } catch {
      return false
    }
  })
}

function normalizeDisplaySan(display: string) {
  const rawMove = display.replace(/^\d+\s*(?:\.\.\.|\.)\s*/, '')
  const stripped = rawMove
    .replace(/[!?]+$/g, '')
    .replace(/(?<![QRBN])=$/g, '')
    .replace(/^0-0-0/, 'O-O-O')
    .replace(/^0-0/, 'O-O')

  return stripped.replace(
    /^([a-h](?:x[a-h])?[18])([QRBN])([+#]?)$/,
    '$1=$2$3',
  )
}

function classifySanMiss(
  display: string,
  text: string,
  index: number,
): SanMissReason {
  const precedingText = text.slice(Math.max(0, index - 80), index)
  const followingText = text.slice(index + display.length, index + display.length + 80)
  const snippet = getSnippet(text, index, display.length)

  if (
    isProseMoveReference(precedingText) ||
    isProseMoveReferenceContinuation(followingText)
  ) {
    return 'prose-reference'
  }

  if (/[�<>{}\\]|(?:J[:;!?([]|l:|:a|:c|:d|:e|:g|:r|:x|\.t|\.U|\.M|\.C|JU|JK|tl|ii|i[?L]|<ifJ)/i.test(snippet)) {
    return 'ocr-piece-glyph'
  }

  if (/\d\s+\.\s|\d\s+\.\.\.|\.\s+[A-Z]|\d\/|[A-Za-z]\d(?=\.)/.test(snippet)) {
    return 'numbering-or-spacing'
  }

  return 'branch-or-anchor'
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

function isIntentionalNonMoveReference(
  display: string,
  text: string,
  index: number,
) {
  const precedingText = text.slice(Math.max(0, index - 110), index)
  const followingText = text.slice(index + display.length, index + display.length + 90)
  const snippet = getSnippet(text, index, display.length)
  const moveNumber = display.match(/^(\d+)/)?.[1]

  if (moveNumber && Number(moveNumber) > 50) {
    return true
  }

  if (
    /\b(?:answer|answers|as|because|by means of|cannot|could|due to|followed by|for example|if|in case of|instead|intending|manoeuvre|or|preventing|prevents|such as|threat(?:en(?:ed|ing|s)?)?|trying|would)\s*(?:\.\.\.)?\s*$/i.test(
      precedingText,
    )
  ) {
    return true
  }

  if (
    /\b(?:Ending|Position|Section)\s+\d|(?:winning|drawn|lost)\s+(?:position|endgame)|\b(?:is|was|would be|will be)\s+(?:a\s+)?(?:draw|lost|threat|idea|manoeuvre|resource|possibility)\b/i.test(
      followingText,
    )
  ) {
    return true
  }

  if (
    /\b(?:due to|followed by|intending|threat(?:en(?:ed|ing|s)?)?|trying to|would allow|would lead|would lose|would win)\b/i.test(
      snippet,
    )
  ) {
    return true
  }

  if (
    /\b(?:Exercise|Lucena|Philidor|Summary|Section|Ending|Position)\b|[�<>{}\\]|(?:\(\s*l\s|J[:;!?([]|l:|:a|:c|:d|:e|:g|:r|:x|\.t|\.U|\.M|\.C|JU|JK|tl|ii|i[?L]|<ifJ|n1any|S ary|umm)/i.test(
      snippet,
    )
  ) {
    return true
  }

  if (
    !/^\d+\s*(?:\.|\.\.\.)/.test(display) &&
    /(?:^|[.?!;:,(])\s*$/.test(precedingText)
  ) {
    return true
  }

  return false
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

function printChapterAudit(audit: ChapterAudit) {
  if (options.has('--json')) {
    console.log(JSON.stringify(audit, null, 2))
    return
  }

  console.log(
    [
      `CH${audit.chapter}`,
      `positions=${audit.positions}`,
      `moveTokens=${audit.moveTokens}`,
      strictMode ? 'strictSanFailures=0' : null,
      `misses=${audit.misses.length}`,
    ]
      .filter(Boolean)
      .join(' '),
  )

  for (const [reason, misses] of groupByReason(audit.misses)) {
    console.log(`  ${reason}=${misses.length}`)
  }

  for (const [sectionIndex, misses] of groupBySection(audit.misses).slice(0, 24)) {
    const reasons = groupByReason(misses)
      .map(([reason, reasonMisses]) => `${reason}:${reasonMisses.length}`)
      .join(', ')
    console.log(`  section ${sectionIndex}: ${misses.length} (${reasons})`)
  }

  for (const miss of audit.misses.slice(0, detailLimit)) {
    console.log(
      `${miss.chapter}:${miss.sectionIndex}:${miss.display}\t${miss.reason}\t${miss.snippet}`,
    )
  }
}

function groupByReason(misses: SanMiss[]) {
  return groupedEntries(misses, (miss) => miss.reason).sort((left, right) =>
    left[0].localeCompare(right[0]),
  )
}

function groupBySection(misses: SanMiss[]) {
  return groupedEntries(misses, (miss) => miss.sectionIndex).sort(
    (left, right) => left[0] - right[0],
  )
}

function groupedEntries<TKey extends string | number>(
  misses: SanMiss[],
  getKey: (miss: SanMiss) => TKey,
) {
  const groups = new Map<TKey, SanMiss[]>()

  for (const miss of misses) {
    const key = getKey(miss)
    groups.set(key, [...(groups.get(key) ?? []), miss])
  }

  return [...groups.entries()]
}
