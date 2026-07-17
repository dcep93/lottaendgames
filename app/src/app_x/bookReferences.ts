import {
  bookEndingAnchorId,
  bookPathForChapterId,
  bookPositionAnchorId,
} from '../routing'
import type {
  BookPartSource,
  DiagramSection,
  EndingSection,
  PanelSection,
  PositionSection,
  ProblemSection,
  TextSection,
} from './chapterTypes'

export type BookReferenceField = 'content' | 'solution' | 'text'
export type BookReferenceKind = 'board' | 'ending'

export type BookReferenceSpan = {
  end: number
  field: BookReferenceField
  href: string
  kind: BookReferenceKind
  number: string
  start: number
}

export type SerializedChapterReferences = Array<
  [sectionIndex: number, spans: BookReferenceSpan[]]
>

type BookReferenceTarget = {
  href: string
  kind: BookReferenceKind
  number: string
}

export type BookReferenceIndex = Map<string, BookReferenceTarget>

type ParseBookReferencesOptions = {
  currentBoardNumber?: string
  currentEndingNumber?: string
  field: BookReferenceField
  index: BookReferenceIndex
  location: string
}

type ParsedReferenceNumber = {
  end: number
  number: string
  start: number
}

type UnresolvedBookReference = {
  kind: BookReferenceKind
  location: string
  number: string
}

const boardNumberSource = '[A-Za-z0-9]+(?:\\.[A-Za-z0-9]+)+'
const endingNumberSource = '\\d+'
const listSeparatorSource =
  '(?:\\s*,\\s*(?:(?:and|or)\\s+)?|\\s+(?:and|or)\\s+|\\s*[-–]\\s*)'
const boardReferencePattern = new RegExp(
  `\\b(?:Position|Positions|Diagram|Diagrams)\\s+(${boardNumberSource}(?:${listSeparatorSource}${boardNumberSource})*)`,
  'gi',
)
const endingReferencePattern = new RegExp(
  `\\b(?:Ending|Endings)\\s+(${endingNumberSource}(?:${listSeparatorSource}${endingNumberSource})*)`,
  'gi',
)

export function buildBookReferenceIndex(
  chapters: BookPartSource[],
): BookReferenceIndex {
  const index: BookReferenceIndex = new Map()

  for (const chapter of chapters) {
    const chapterPath = bookPathForChapterId(chapter.id)

    for (const section of chapter.sections) {
      if (section.type === 'ending') {
        const number = (section as EndingSection).content.number
        addTarget(index, {
          href: `${chapterPath}#${bookEndingAnchorId(number)}`,
          kind: 'ending',
          number,
        })
      } else if (
        section.type === 'diagram' ||
        section.type === 'position' ||
        section.type === 'problem'
      ) {
        const number = (
          section as DiagramSection | PositionSection | ProblemSection
        ).content.number
        addTarget(index, {
          href: `${chapterPath}#${bookPositionAnchorId(number)}`,
          kind: 'board',
          number,
        })
      }
    }
  }

  return index
}

export function buildChapterReferences(
  chapter: BookPartSource,
  index: BookReferenceIndex,
): SerializedChapterReferences {
  const references: SerializedChapterReferences = []
  const unresolved: UnresolvedBookReference[] = []
  let currentBoardNumber: string | undefined
  let currentEndingNumber: string | undefined

  chapter.sections.forEach((section, sectionIndex) => {
    if (section.type === 'ending') {
      currentEndingNumber = (section as EndingSection).content.number
    } else if (
      section.type === 'diagram' ||
      section.type === 'position' ||
      section.type === 'problem'
    ) {
      currentBoardNumber = (
        section as DiagramSection | PositionSection | ProblemSection
      ).content.number
    }

    const referenceText = getReferenceText(section)

    if (!referenceText) {
      return
    }

    const location = `${chapter.label}, section ${sectionIndex + 1}`
    const result = parseBookReferences(referenceText.text, {
      currentBoardNumber,
      currentEndingNumber,
      field: referenceText.field,
      index,
      location,
    })

    unresolved.push(...result.unresolved)

    if (result.spans.length) {
      references.push([sectionIndex, result.spans])
    }
  })

  if (unresolved.length) {
    throw new Error(formatUnresolvedReferences(unresolved))
  }

  return references
}

export function parseBookReferences(
  text: string,
  options: ParseBookReferencesOptions,
) {
  const spans: BookReferenceSpan[] = []
  const unresolved: UnresolvedBookReference[] = []

  collectPatternReferences(
    text,
    boardReferencePattern,
    boardNumberSource,
    'board',
    options,
    spans,
    unresolved,
  )
  collectPatternReferences(
    text,
    endingReferencePattern,
    endingNumberSource,
    'ending',
    options,
    spans,
    unresolved,
  )

  spans.sort((left, right) => left.start - right.start)

  return { spans, unresolved }
}

function addTarget(index: BookReferenceIndex, target: BookReferenceTarget) {
  const key = referenceKey(target.kind, target.number)

  if (index.has(key)) {
    throw new Error(`Duplicate book reference target: ${target.kind} ${target.number}`)
  }

  index.set(key, target)
}

function getReferenceText(section: BookPartSource['sections'][number]) {
  if (section.type === 'text') {
    return {
      field: 'content' as const,
      text: (section as TextSection).content,
    }
  }

  if (section.type === 'panel') {
    return {
      field: 'text' as const,
      text: (section as PanelSection).content.text,
    }
  }

  if (section.type === 'problem') {
    return {
      field: 'solution' as const,
      text: (section as ProblemSection).content.solution,
    }
  }

  return null
}

function collectPatternReferences(
  text: string,
  pattern: RegExp,
  numberSource: string,
  kind: BookReferenceKind,
  options: ParseBookReferencesOptions,
  spans: BookReferenceSpan[],
  unresolved: UnresolvedBookReference[],
) {
  pattern.lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const list = match[1]
    const listOffset = (match.index ?? 0) + match[0].lastIndexOf(list)
    const numbers = collectPrintedNumbers(list, listOffset, numberSource)

    validateRangeMembers(list, numbers, kind, options, unresolved)

    for (const printed of numbers) {
      const target = options.index.get(referenceKey(kind, printed.number))

      if (!target) {
        unresolved.push({
          kind,
          location: options.location,
          number: printed.number,
        })
        continue
      }

      const currentNumber =
        kind === 'board'
          ? options.currentBoardNumber
          : options.currentEndingNumber

      if (printed.number === currentNumber) {
        continue
      }

      spans.push({
        end: printed.end,
        field: options.field,
        href: target.href,
        kind,
        number: printed.number,
        start: printed.start,
      })
    }
  }
}

function collectPrintedNumbers(
  list: string,
  listOffset: number,
  numberSource: string,
) {
  const numberPattern = new RegExp(numberSource, 'g')
  const numbers: ParsedReferenceNumber[] = []

  for (const match of list.matchAll(numberPattern)) {
    const start = listOffset + (match.index ?? 0)
    numbers.push({
      end: start + match[0].length,
      number: match[0],
      start,
    })
  }

  return numbers
}

function validateRangeMembers(
  list: string,
  numbers: ParsedReferenceNumber[],
  kind: BookReferenceKind,
  options: ParseBookReferencesOptions,
  unresolved: UnresolvedBookReference[],
) {
  for (let index = 1; index < numbers.length; index += 1) {
    const previous = numbers[index - 1]
    const current = numbers[index]
    const listStart = numbers[0].start
    const separator = list.slice(
      previous.end - listStart,
      current.start - listStart,
    )

    if (!/^\s*[-–]\s*$/.test(separator)) {
      continue
    }

    for (const number of expandRange(previous.number, current.number, kind)) {
      if (!options.index.has(referenceKey(kind, number))) {
        unresolved.push({ kind, location: options.location, number })
      }
    }
  }
}

function expandRange(
  first: string,
  last: string,
  kind: BookReferenceKind,
) {
  if (kind === 'ending') {
    return integerRange(first, last)
  }

  const firstParts = first.split('.')
  const lastParts = last.split('.')
  const firstSuffix = firstParts.pop()
  const lastSuffix = lastParts.pop()

  if (
    firstParts.join('.') !== lastParts.join('.') ||
    !firstSuffix ||
    !lastSuffix
  ) {
    return []
  }

  return integerRange(firstSuffix, lastSuffix).map(
    (suffix) => `${firstParts.join('.')}.${suffix}`,
  )
}

function integerRange(first: string, last: string) {
  const start = Number(first)
  const end = Number(last)

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    end <= start ||
    end - start > 100
  ) {
    return []
  }

  return Array.from({ length: end - start + 1 }, (_, index) =>
    String(start + index),
  )
}

function referenceKey(kind: BookReferenceKind, number: string) {
  return `${kind}:${number}`
}

function formatUnresolvedReferences(unresolved: UnresolvedBookReference[]) {
  const unique = new Map<string, UnresolvedBookReference>()

  for (const reference of unresolved) {
    unique.set(
      `${reference.location}:${reference.kind}:${reference.number}`,
      reference,
    )
  }

  return [
    'Unresolved book references:',
    ...Array.from(unique.values()).map(
      ({ kind, location, number }) => `- ${location}: ${kind} ${number}`,
    ),
  ].join('\n')
}
