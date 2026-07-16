import { Chess } from 'chess.js'
import type {
  BookPartSource,
  BookSource,
  RawChapterSection,
} from './chapterTypes'

const sectionTypes = new Set([
  'caption',
  'diagram',
  'ending',
  'heading',
  'panel',
  'position',
  'problem',
  'table',
  'text',
  'title',
])

export function validateBookSource(value: unknown): BookSource {
  assertRecord(value, 'Book source')
  assert(value.schemaVersion === 1, 'Book schemaVersion must be 1')
  assert(Array.isArray(value.parts), 'Book parts must be an array')

  const partIds = new Set<string>()
  const boardIds = new Set<string>()

  value.parts.forEach((part, partIndex) => {
    validatePart(part, partIndex, partIds, boardIds)
  })

  return value as BookSource
}

function validatePart(
  value: unknown,
  partIndex: number,
  partIds: Set<string>,
  boardIds: Set<string>,
): asserts value is BookPartSource {
  const location = `Part ${partIndex + 1}`
  assertRecord(value, location)
  assertNonEmptyString(value.id, `${location} id`)
  assertNonEmptyString(value.label, `${location} label`)
  assertNonEmptyString(value.name, `${location} name`)
  assert(!partIds.has(value.id), `Duplicate part id: ${value.id}`)
  partIds.add(value.id)
  assert(Array.isArray(value.sections), `${location} sections must be an array`)

  value.sections.forEach((section, sectionIndex) => {
    validateSection(section, `${location}, section ${sectionIndex + 1}`, boardIds)
  })
}

function validateSection(
  value: unknown,
  location: string,
  boardIds: Set<string>,
): asserts value is RawChapterSection {
  assertRecord(value, location)
  assertNonEmptyString(value.type, `${location} type`)
  assert(sectionTypes.has(value.type), `${location} has unknown type: ${value.type}`)

  if (value.playbackPositionNumbers !== undefined) {
    assert(
      value.type === 'text' || value.type === 'panel',
      `${location} playbackPositionNumbers is only valid on text and panel sections`,
    )
    assertStringArray(
      value.playbackPositionNumbers,
      `${location} playbackPositionNumbers`,
    )
    assert(
      value.playbackPositionNumbers.length > 0,
      `${location} playbackPositionNumbers must not be empty`,
    )
  }

  if (['caption', 'heading', 'text', 'title'].includes(value.type)) {
    assertNonEmptyString(value.content, `${location} content`)
    return
  }

  assertRecord(value.content, `${location} content`)
  const content = value.content

  switch (value.type) {
    case 'diagram':
      validateBoardId(content.number, location, boardIds)
      validateOrientation(content.orientation, location)
      assertNonEmptyString(content.label, `${location} label`)
      assertNonEmptyString(content.fen, `${location} fen`)
      validatePlacement(content.fen, `${location} fen`)
      validateOptionalStrings(content, location, ['subtitle'])
      validateMarkers(content.markers, location)
      validateRoutes(content.routes, location)
      return
    case 'ending':
      assertNonEmptyString(content.number, `${location} number`)
      assertNonEmptyString(content.text, `${location} text`)
      return
    case 'panel':
      assertNonEmptyString(content.text, `${location} text`)
      if (content.title !== undefined) {
        assertNonEmptyString(content.title, `${location} title`)
      }
      return
    case 'position':
      validateBoardId(content.number, location, boardIds)
      validateOrientation(content.orientation, location)
      assertNonEmptyString(content.fen, `${location} fen`)
      validateLegalFen(content.fen, `${location} fen`)
      validateOptionalStrings(content, location, [
        'caption',
        'displayLabel',
        'subtitle',
      ])
      validateMarkers(content.markers, location)
      validateRoutes(content.routes, location)
      validatePlaybackAnchors(content.playbackAnchors, location)
      validatePlaybackSegments(content.playbackSegments, location)
      if (content.relatedPositionNumbers !== undefined) {
        assertStringArray(
          content.relatedPositionNumbers,
          `${location} relatedPositionNumbers`,
        )
        assert(
          content.relatedPositionNumbers.length > 0,
          `${location} relatedPositionNumbers must not be empty`,
        )
      }
      if (content.alternateFens !== undefined) {
        assert(
          Array.isArray(content.alternateFens),
          `${location} alternateFens must be an array`,
        )
        content.alternateFens.forEach((fen, index) => {
          assertNonEmptyString(fen, `${location} alternateFens[${index}]`)
          validateLegalFen(fen, `${location} alternateFens[${index}]`)
        })
      }
      return
    case 'problem':
      validateBoardId(content.number, location, boardIds)
      validateOrientation(content.orientation, location)
      assertNonEmptyString(content.fen, `${location} fen`)
      assertNonEmptyString(content.prompt, `${location} prompt`)
      assertNonEmptyString(content.solution, `${location} solution`)
      if (content.solutionFen !== undefined) {
        assertNonEmptyString(content.solutionFen, `${location} solutionFen`)
        validateLegalFen(content.solutionFen, `${location} solutionFen`)
      }
      validateProblemFen(content.fen, content.solutionFen, `${location} fen`)
      validateMarkers(content.markers, location)
      validatePlaybackAnchors(content.playbackAnchors, location)
      validatePlaybackSegments(content.playbackSegments, location)
      return
    case 'table':
      if (content.caption !== undefined) {
        assertNonEmptyString(content.caption, `${location} caption`)
      }
      assertStringArray(content.columns, `${location} columns`)
      const columns = content.columns
      assert(columns.length > 0, `${location} columns must not be empty`)
      assert(Array.isArray(content.rows), `${location} rows must be an array`)
      content.rows.forEach((row, rowIndex) => {
        assertStringArray(row, `${location} row ${rowIndex + 1}`)
        assert(
          row.length === columns.length,
          `${location} row ${rowIndex + 1} has ${row.length} cells; expected ${columns.length}`,
        )
      })
      return
  }
}

function validatePlaybackAnchors(value: unknown, location: string) {
  if (value === undefined) {
    return
  }

  assert(Array.isArray(value), `${location} playbackAnchors must be an array`)
  value.forEach((anchor, index) => {
    const anchorLocation = `${location} playback anchor ${index + 1}`
    assertRecord(anchor, anchorLocation)
    assertNonEmptyString(anchor.token, `${anchorLocation} token`)
    assertNonEmptyString(anchor.parentFen, `${anchorLocation} parentFen`)
    validateLegalFen(anchor.parentFen, `${anchorLocation} parentFen`)
    assert(
      typeof anchor.sectionIndex === 'number' &&
        Number.isInteger(anchor.sectionIndex) &&
        anchor.sectionIndex >= 0,
      `${anchorLocation} sectionIndex must be a non-negative integer`,
    )
    assert(
      anchor.occurrence === undefined ||
        (typeof anchor.occurrence === 'number' &&
          Number.isInteger(anchor.occurrence) &&
          anchor.occurrence >= 0),
      `${anchorLocation} occurrence must be a non-negative integer`,
    )
  })
}

function validatePlaybackSegments(value: unknown, location: string) {
  if (value === undefined) {
    return
  }

  assert(Array.isArray(value), `${location} playbackSegments must be an array`)
  value.forEach((segment, index) => {
    const segmentLocation = `${location} playback segment ${index + 1}`
    assertRecord(segment, segmentLocation)
    assertNonEmptyString(segment.start, `${segmentLocation} start`)
    assertNonEmptyString(
      segment.positionNumber,
      `${segmentLocation} positionNumber`,
    )
    assertNonEmptyString(segment.parentFen, `${segmentLocation} parentFen`)
    validateLegalFen(segment.parentFen, `${segmentLocation} parentFen`)
    assert(
      typeof segment.sectionIndex === 'number' &&
        Number.isInteger(segment.sectionIndex) &&
        segment.sectionIndex >= 0,
      `${segmentLocation} sectionIndex must be a non-negative integer`,
    )
  })
}

function validateOrientation(value: unknown, location: string) {
  assert(
    value === 'white' || value === 'black',
    `${location} orientation must be white or black`,
  )
}

function validateBoardId(
  value: unknown,
  location: string,
  boardIds: Set<string>,
) {
  assertNonEmptyString(value, `${location} number`)
  assert(!boardIds.has(value), `Duplicate board id: ${value}`)
  boardIds.add(value)
}

function validateMarkers(value: unknown, location: string) {
  if (value === undefined) {
    return
  }

  assert(Array.isArray(value), `${location} markers must be an array`)
  value.forEach((marker, index) => {
    const markerLocation = `${location} marker ${index + 1}`
    assertRecord(marker, markerLocation)
    assertNonEmptyString(marker.square, `${markerLocation} square`)
    assert(/^[a-h][1-8]$/.test(marker.square), `${markerLocation} has invalid square`)
    assertNonEmptyString(marker.symbol, `${markerLocation} symbol`)
    assertNonEmptyString(marker.meaning, `${markerLocation} meaning`)
    assert(
      marker.variant === undefined ||
        marker.variant === 'badge' ||
        marker.variant === 'emphasis' ||
        marker.variant === 'label',
      `${markerLocation} has invalid variant`,
    )
  })
}

function validateRoutes(value: unknown, location: string) {
  if (value === undefined) {
    return
  }

  assert(Array.isArray(value), `${location} routes must be an array`)
  value.forEach((route, index) => {
    const routeLocation = `${location} route ${index + 1}`
    assertRecord(route, routeLocation)
    assertNonEmptyString(route.meaning, `${routeLocation} meaning`)
    assert(
      route.style === undefined ||
        route.style === 'arrow' ||
        route.style === 'line' ||
        route.style === 'outline',
      `${routeLocation} has invalid style`,
    )
    assert(
      Array.isArray(route.squares) && route.squares.length >= 2,
      `${routeLocation} squares must contain at least two squares`,
    )
    route.squares.forEach((square, squareIndex) => {
      assertNonEmptyString(square, `${routeLocation} square ${squareIndex + 1}`)
      assert(
        /^[a-h][1-8]$/.test(square),
        `${routeLocation} has invalid square: ${square}`,
      )
    })
  })
}

function validateProblemFen(
  fen: string,
  solutionFen: unknown,
  location: string,
) {
  try {
    new Chess(fen)
  } catch {
    validateFenShape(fen, location)
    assert(
      typeof solutionFen === 'string',
      `${location} is not legal and requires a legal solutionFen`,
    )
  }
}

function validateLegalFen(fen: string, location: string) {
  try {
    new Chess(fen)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${location} is not a legal FEN: ${message}`)
  }
}

function validateFenShape(fen: string, location: string) {
  const fields = fen.trim().split(/\s+/)
  assert(fields.length === 6, `${location} must contain six FEN fields`)
  validatePlacement(fields[0], location)
  assert(fields[1] === 'w' || fields[1] === 'b', `${location} has invalid turn`)
}

function validatePlacement(placement: string, location: string) {
  assert(!/\s/.test(placement), `${location} must be placement-only`)
  const ranks = placement.split('/')
  assert(ranks.length === 8, `${location} must have eight ranks`)
  ranks.forEach((rank, rankIndex) => {
    let files = 0
    for (const character of rank) {
      if (/^[1-8]$/.test(character)) {
        files += Number(character)
      } else {
        assert(
          /^[prnbqkPRNBQK]$/.test(character),
          `${location} rank ${rankIndex + 1} has invalid piece: ${character}`,
        )
        files += 1
      }
    }
    assert(files === 8, `${location} rank ${rankIndex + 1} expands to ${files}`)
  })
}

function validateOptionalStrings(
  content: Record<string, unknown>,
  location: string,
  keys: string[],
) {
  keys.forEach((key) => {
    if (content[key] !== undefined) {
      assertNonEmptyString(content[key], `${location} ${key}`)
    }
  })
}

function assertStringArray(
  value: unknown,
  location: string,
): asserts value is string[] {
  assert(Array.isArray(value), `${location} must be an array`)
  value.forEach((entry, index) => {
    assertNonEmptyString(entry, `${location}[${index}]`)
  })
}

function assertRecord(
  value: unknown,
  location: string,
): asserts value is Record<string, unknown> {
  assert(
    Boolean(value) && typeof value === 'object' && !Array.isArray(value),
    `${location} must be an object`,
  )
}

function assertNonEmptyString(
  value: unknown,
  location: string,
): asserts value is string {
  assert(typeof value === 'string' && value.trim() !== '', `${location} must be a non-empty string`)
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
