import type { BoardOrientation } from './chapterTypes'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export function getSquareIndex(
  square: string,
  orientation: BoardOrientation = 'white',
) {
  const file = square[0]?.toLowerCase()
  const rank = Number(square[1])
  const fileIndex = files.indexOf(file)

  if (fileIndex < 0 || !Number.isInteger(rank) || rank < 1 || rank > 8) {
    return null
  }

  return {
    column: orientation === 'white' ? fileIndex + 1 : 8 - fileIndex,
    row: orientation === 'white' ? 9 - rank : rank,
  }
}
