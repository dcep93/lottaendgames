import { MAJOR_PIECE_MATE_PROGRESS_DATA } from './majorPieceMateProgressData'
import {
  canonicalMajorPieceMateProgressKey,
  majorPieceMateProgressStateFromFen,
  type MajorPieceMateId,
} from './majorPieceMateProgressEncoding'

export type MajorPieceMateProgressLookup =
  | { readonly kind: 'not-winning' }
  | { readonly kind: 'unsupported' }
  | { readonly kind: 'winning'; readonly rank: number }

type DecodedMateProgressTable = {
  readonly keys: Uint32Array
  readonly rankCodes: Uint8Array
}

const TABLES: Readonly<Record<MajorPieceMateId, DecodedMateProgressTable>> =
  Object.freeze({
    queen: decodeMajorPieceMateProgressData(
      MAJOR_PIECE_MATE_PROGRESS_DATA.queen.data,
      MAJOR_PIECE_MATE_PROGRESS_DATA.queen.entries,
      MAJOR_PIECE_MATE_PROGRESS_DATA.queen.maxRank,
    ),
    rook: decodeMajorPieceMateProgressData(
      MAJOR_PIECE_MATE_PROGRESS_DATA.rook.data,
      MAJOR_PIECE_MATE_PROGRESS_DATA.rook.entries,
      MAJOR_PIECE_MATE_PROGRESS_DATA.rook.maxRank,
    ),
  })

export function lookupMajorPieceMateProgress(
  mateId: MajorPieceMateId,
  fen: string,
): MajorPieceMateProgressLookup {
  const state = majorPieceMateProgressStateFromFen(mateId, fen)
  if (state === null) return { kind: 'unsupported' }

  const key = canonicalMajorPieceMateProgressKey(state)
  const table = TABLES[mateId]
  const index = findKey(table.keys, key)
  if (index < 0) {
    throw new Error(
      `Missing supported ${mateId} mate-progress state ${key} for ${fen}`,
    )
  }
  const rankCode = table.rankCodes[index]!
  return rankCode === 0
    ? { kind: 'not-winning' }
    : { kind: 'winning', rank: rankCode - 1 }
}

export function decodeMajorPieceMateProgressData(
  data: string,
  expectedEntries: number,
  expectedMaxRank: number,
): DecodedMateProgressTable {
  if (!Number.isSafeInteger(expectedEntries) || expectedEntries <= 0) {
    throw new Error('Mate-progress entry count must be a positive integer')
  }
  if (
    !Number.isSafeInteger(expectedMaxRank) ||
    expectedMaxRank < 0 ||
    expectedMaxRank >= 254
  ) {
    throw new Error('Mate-progress maximum rank is invalid')
  }

  let binary: string
  try {
    binary = globalThis.atob(data)
  } catch {
    throw new Error('Mate-progress data is not valid base64')
  }
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  )
  const keys = new Uint32Array(expectedEntries)
  const rankCodes = new Uint8Array(expectedEntries)
  let offset = 0
  let previousKey = 0
  let observedMaxRank = 0

  for (let index = 0; index < expectedEntries; index += 1) {
    let delta = 0
    let multiplier = 1
    while (true) {
      const byte = bytes[offset]
      if (byte === undefined) {
        throw new Error('Mate-progress data ended inside a key')
      }
      offset += 1
      delta += (byte & 0x7f) * multiplier
      if ((byte & 0x80) === 0) break
      multiplier *= 128
      if (multiplier > 128 ** 4) {
        throw new Error('Mate-progress key varint is too large')
      }
    }
    if (!Number.isSafeInteger(delta) || delta <= 0) {
      throw new Error('Mate-progress keys must be strictly increasing')
    }
    const key = previousKey + delta
    if (key >= 64 ** 3 * 2) {
      throw new Error(`Mate-progress key ${key} exceeds the state encoding`)
    }
    const rankCode = bytes[offset]
    if (rankCode === undefined) {
      throw new Error('Mate-progress data ended before a rank')
    }
    offset += 1
    if (rankCode > expectedMaxRank + 1) {
      throw new Error(`Mate-progress rank code ${rankCode} is out of range`)
    }
    keys[index] = key
    rankCodes[index] = rankCode
    if (rankCode > 0) observedMaxRank = Math.max(observedMaxRank, rankCode - 1)
    previousKey = key
  }

  if (offset !== bytes.length) {
    throw new Error('Mate-progress data contains trailing bytes')
  }
  if (observedMaxRank !== expectedMaxRank) {
    throw new Error(
      `Mate-progress maximum rank ${observedMaxRank} does not match ${expectedMaxRank}`,
    )
  }
  return { keys, rankCodes }
}

function findKey(keys: Uint32Array, target: number): number {
  let low = 0
  let high = keys.length - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const key = keys[middle]!
    if (key === target) return middle
    if (key < target) low = middle + 1
    else high = middle - 1
  }
  return -1
}
