import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getChess, boardFenFromPlacements } from '../../app/src/mate/chess.ts'
import {
  canonicalMajorPieceMateProgressKey,
  decodeMajorPieceMateProgressState,
  squareFromIndex,
  squareIndex,
  type MajorPieceMateId,
  type MajorPieceMateProgressState,
} from '../../app/src/mate/rules/majorPieceMateProgressEncoding.ts'

type GraphNode = {
  readonly externalNonWinningEdge: boolean
  readonly isCheckmate: boolean
  readonly key: number
  readonly successors: readonly number[]
}

export type GeneratedMateProgressTable = {
  readonly data: string
  readonly entries: number
  readonly maxRank: number
  readonly mateId: MajorPieceMateId
  readonly sha256: string
  readonly winningEntries: number
}

const ARTIFACT_PATH = fileURLToPath(
  new URL(
    '../../app/src/mate/rules/majorPieceMateProgressData.ts',
    import.meta.url,
  ),
)

export async function generateMajorPieceMateProgressArtifact(): Promise<string> {
  const tables: GeneratedMateProgressTable[] = []
  for (const mateId of ['queen', 'rook'] as const) {
    const startedAt = Date.now()
    const table = generateMateProgressTable(mateId)
    tables.push(table)
    console.error(
      `${mateId}: ${table.entries} states, ${table.winningEntries} winning, ` +
        `max rank ${table.maxRank}, ${Date.now() - startedAt}ms`,
    )
  }
  return renderArtifact(tables)
}

export function generateMateProgressTable(
  mateId: MajorPieceMateId,
): GeneratedMateProgressTable {
  const whiteKeys = enumerateCanonicalWhiteStates(mateId)
  const whiteKeySet = new Set(whiteKeys)
  const whiteNodes = new Map<number, GraphNode>()
  const blackKeys = enumerateCanonicalBlackStates()
  const blackKeySet = new Set(blackKeys)

  for (const key of whiteKeys) {
    const state = decodeMajorPieceMateProgressState(key)
    const chess = getChess(fenFromState(mateId, state))
    const successors = new Set<number>()
    for (const move of chess.moves({ verbose: true })) {
      const nextState: MajorPieceMateProgressState = {
        ...state,
        ...(move.piece === 'k'
          ? { whiteKing: squareIndex(move.to) }
          : { majorPiece: squareIndex(move.to) }),
        turn: 'b',
      }
      const childKey = canonicalMajorPieceMateProgressKey(nextState)
      if (!blackKeySet.has(childKey)) {
        throw new Error(
          `${mateId} White move ${move.san} left the closed legal state set`,
        )
      }
      successors.add(childKey)
    }
    whiteNodes.set(key, {
      externalNonWinningEdge: false,
      isCheckmate: false,
      key,
      successors: [...successors].sort((left, right) => left - right),
    })
  }

  const blackNodes = new Map<number, GraphNode>()
  for (const key of blackKeys) {
    const state = decodeMajorPieceMateProgressState(key)
    const chess = getChess(fenFromState(mateId, state))
    const successors = new Set<number>()
    let externalNonWinningEdge = false
    for (const move of chess.moves({ verbose: true })) {
      if (move.captured === (mateId === 'queen' ? 'q' : 'r')) {
        externalNonWinningEdge = true
        continue
      }
      const childKey = canonicalMajorPieceMateProgressKey({
        ...state,
        blackKing: squareIndex(move.to),
        turn: 'w',
      })
      if (!whiteKeySet.has(childKey)) {
        throw new Error(
          `${mateId} Black move ${move.san} left the closed legal state set`,
        )
      }
      successors.add(childKey)
    }
    blackNodes.set(key, {
      externalNonWinningEdge,
      isCheckmate: chess.isCheckmate(),
      key,
      successors: [...successors].sort((left, right) => left - right),
    })
  }

  const nodes = [...whiteNodes.values(), ...blackNodes.values()].sort(
    (left, right) => left.key - right.key,
  )
  const ranks = solveMateProgressRanks(nodes)
  validateMateProgressRanks(nodes, ranks)
  const bytes = encodeTable(nodes, ranks)
  const data = Buffer.from(bytes).toString('base64')
  let maxRank = 0
  let winningEntries = 0
  for (const rank of ranks) {
    if (rank < 0) continue
    winningEntries += 1
    maxRank = Math.max(maxRank, rank)
  }
  return {
    data,
    entries: nodes.length,
    maxRank,
    mateId,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    winningEntries,
  }
}

function enumerateCanonicalWhiteStates(
  mateId: MajorPieceMateId,
): readonly number[] {
  const keys = new Set<number>()
  for (let blackKing = 0; blackKing < 64; blackKing += 1) {
    for (let whiteKing = 0; whiteKing < 64; whiteKing += 1) {
      if (
        blackKing === whiteKing ||
        indexKingDistance(blackKing, whiteKing) <= 1
      ) {
        continue
      }
      for (let majorPiece = 0; majorPiece < 64; majorPiece += 1) {
        if (majorPiece === blackKing || majorPiece === whiteKing) continue
        if (
          majorPieceAttacksSquare(
            mateId,
            majorPiece,
            blackKing,
            whiteKing,
          )
        ) {
          continue
        }
        keys.add(
          canonicalMajorPieceMateProgressKey({
            blackKing,
            majorPiece,
            turn: 'w',
            whiteKing,
          }),
        )
      }
    }
  }
  return [...keys].sort((left, right) => left - right)
}

function enumerateCanonicalBlackStates(): readonly number[] {
  const keys = new Set<number>()
  for (let blackKing = 0; blackKing < 64; blackKing += 1) {
    for (let whiteKing = 0; whiteKing < 64; whiteKing += 1) {
      if (
        blackKing === whiteKing ||
        indexKingDistance(blackKing, whiteKing) <= 1
      ) {
        continue
      }
      for (let majorPiece = 0; majorPiece < 64; majorPiece += 1) {
        if (majorPiece === blackKing || majorPiece === whiteKing) continue
        keys.add(
          canonicalMajorPieceMateProgressKey({
            blackKing,
            majorPiece,
            turn: 'b',
            whiteKing,
          }),
        )
      }
    }
  }
  return [...keys].sort((left, right) => left - right)
}

function solveMateProgressRanks(nodes: readonly GraphNode[]): Int16Array {
  const indexByKey = new Map(
    nodes.map((node, index) => [node.key, index] as const),
  )
  const predecessors = Array.from(
    { length: nodes.length },
    () => [] as number[],
  )
  const remaining = new Int16Array(nodes.length)
  const maximumChildRank = new Int16Array(nodes.length)
  const ranks = new Int16Array(nodes.length)
  ranks.fill(-1)
  const queue = new RankQueue()

  for (const [index, node] of nodes.entries()) {
    remaining[index] =
      node.successors.length + (node.externalNonWinningEdge ? 1 : 0)
    for (const successor of node.successors) {
      const childIndex = indexByKey.get(successor)
      if (childIndex === undefined) {
        throw new Error(`Missing graph child ${successor}`)
      }
      predecessors[childIndex]!.push(index)
    }
    if (node.isCheckmate) {
      ranks[index] = 0
      queue.push(index, 0)
    }
  }

  while (queue.length > 0) {
    const childIndex = queue.pop()!
    const childRank = ranks[childIndex]!
    for (const parentIndex of predecessors[childIndex]!) {
      if (ranks[parentIndex]! >= 0) continue
      const parent = nodes[parentIndex]!
      if (decodeMajorPieceMateProgressState(parent.key).turn === 'w') {
        ranks[parentIndex] = childRank + 1
        queue.push(parentIndex, childRank + 1)
        continue
      }
      remaining[parentIndex] -= 1
      maximumChildRank[parentIndex] = Math.max(
        maximumChildRank[parentIndex]!,
        childRank,
      )
      if (remaining[parentIndex] === 0) {
        const rank = maximumChildRank[parentIndex]! + 1
        ranks[parentIndex] = rank
        queue.push(parentIndex, rank)
      }
    }
  }
  return ranks
}

function validateMateProgressRanks(
  nodes: readonly GraphNode[],
  ranks: Int16Array,
): void {
  const rankByKey = new Map(
    nodes.map((node, index) => [node.key, ranks[index]!] as const),
  )
  for (const [index, node] of nodes.entries()) {
    const rank = ranks[index]!
    if (node.isCheckmate) {
      if (rank !== 0) throw new Error(`Checkmate state ${node.key} has rank ${rank}`)
      continue
    }
    const childRanks = node.successors.map((key) => {
      const childRank = rankByKey.get(key)
      if (childRank === undefined) throw new Error(`Missing child rank ${key}`)
      return childRank
    })
    const turn = decodeMajorPieceMateProgressState(node.key).turn
    if (turn === 'w') {
      const winningChildren = childRanks.filter((childRank) => childRank >= 0)
      const expected =
        winningChildren.length === 0
          ? -1
          : Math.min(...winningChildren) + 1
      if (rank !== expected) {
        throw new Error(
          `White state ${node.key} has rank ${rank}; expected ${expected}`,
        )
      }
      continue
    }

    const allChildrenWin =
      !node.externalNonWinningEdge &&
      childRanks.length > 0 &&
      childRanks.every((childRank) => childRank >= 0)
    const expected = allChildrenWin ? Math.max(...childRanks) + 1 : -1
    if (rank !== expected) {
      throw new Error(
        `Black state ${node.key} has rank ${rank}; expected ${expected}`,
      )
    }
  }
}

function encodeTable(
  nodes: readonly GraphNode[],
  ranks: Int16Array,
): Uint8Array {
  const bytes: number[] = []
  let previousKey = 0
  for (const [index, node] of nodes.entries()) {
    const delta = node.key - previousKey
    if (delta <= 0) throw new Error('Mate-progress keys must be increasing')
    encodeUnsignedVarint(delta, bytes)
    const rank = ranks[index]!
    if (rank >= 254) throw new Error(`Mate-progress rank ${rank} is too large`)
    bytes.push(rank < 0 ? 0 : rank + 1)
    previousKey = node.key
  }
  return Uint8Array.from(bytes)
}

function encodeUnsignedVarint(value: number, target: number[]): void {
  let remaining = value
  do {
    let byte = remaining % 128
    remaining = Math.floor(remaining / 128)
    if (remaining > 0) byte |= 0x80
    target.push(byte)
  } while (remaining > 0)
}

function fenFromState(
  mateId: MajorPieceMateId,
  state: MajorPieceMateProgressState,
): string {
  const board = boardFenFromPlacements([
    {
      color: 'b',
      isPawn: false,
      square: squareFromIndex(state.blackKing) as never,
      type: 'k',
    },
    {
      color: 'w',
      isPawn: false,
      square: squareFromIndex(state.whiteKing) as never,
      type: 'k',
    },
    {
      color: 'w',
      isPawn: false,
      square: squareFromIndex(state.majorPiece) as never,
      type: mateId === 'queen' ? 'q' : 'r',
    },
  ])
  return `${board} ${state.turn} - - 0 1`
}

function majorPieceAttacksSquare(
  mateId: MajorPieceMateId,
  from: number,
  target: number,
  blocker: number,
): boolean {
  const fromFile = from % 8
  const fromRank = Math.floor(from / 8)
  const targetFile = target % 8
  const targetRank = Math.floor(target / 8)
  const fileDelta = targetFile - fromFile
  const rankDelta = targetRank - fromRank
  const aligned =
    fileDelta === 0 ||
    rankDelta === 0 ||
    (mateId === 'queen' && Math.abs(fileDelta) === Math.abs(rankDelta))
  if (!aligned) return false

  const fileStep = Math.sign(fileDelta)
  const rankStep = Math.sign(rankDelta)
  let file = fromFile + fileStep
  let rank = fromRank + rankStep
  while (file !== targetFile || rank !== targetRank) {
    if (file + rank * 8 === blocker) return false
    file += fileStep
    rank += rankStep
  }
  return true
}

function indexKingDistance(first: number, second: number): number {
  return Math.max(
    Math.abs((first % 8) - (second % 8)),
    Math.abs(Math.floor(first / 8) - Math.floor(second / 8)),
  )
}

class RankQueue {
  private readonly entries: { index: number; rank: number }[] = []

  get length(): number {
    return this.entries.length
  }

  push(index: number, rank: number): void {
    const entry = { index, rank }
    this.entries.push(entry)
    let child = this.entries.length - 1
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2)
      if (this.entries[parent]!.rank <= rank) break
      this.entries[child] = this.entries[parent]!
      child = parent
    }
    this.entries[child] = entry
  }

  pop(): number | undefined {
    const first = this.entries[0]
    const last = this.entries.pop()
    if (!first || !last) return first?.index
    if (this.entries.length === 0) return first.index
    this.entries[0] = last
    let parent = 0
    while (true) {
      const left = parent * 2 + 1
      const right = left + 1
      if (left >= this.entries.length) break
      const child =
        right < this.entries.length &&
        this.entries[right]!.rank < this.entries[left]!.rank
          ? right
          : left
      if (this.entries[parent]!.rank <= this.entries[child]!.rank) break
      const swap = this.entries[parent]!
      this.entries[parent] = this.entries[child]!
      this.entries[child] = swap
      parent = child
    }
    return first.index
  }
}

function renderArtifact(tables: readonly GeneratedMateProgressTable[]): string {
  const rendered = tables
    .map((table) => {
      const chunks = table.data.match(/.{1,100}/g) ?? []
      return `  ${table.mateId}: Object.freeze({
    data: [
${chunks.map((chunk) => `      '${chunk}',`).join('\n')}
    ].join(''),
    entries: ${table.entries},
    maxRank: ${table.maxRank},
    sha256: '${table.sha256}',
    winningEntries: ${table.winningEntries},
  }),`
    })
    .join('\n')
  return `// Generated by scripts/mate-verifier/generate-major-piece-mate-progress.mts.
// Do not edit by hand.

export const MAJOR_PIECE_MATE_PROGRESS_DATA = Object.freeze({
${rendered}
})
`
}

async function main(args: readonly string[]): Promise<void> {
  const check = args.includes('--check')
  const unknown = args.find((arg) => arg !== '--check')
  if (unknown !== undefined) throw new Error(`Unknown argument ${unknown}`)

  const generated = await generateMajorPieceMateProgressArtifact()
  if (check) {
    const current = await readFile(ARTIFACT_PATH, 'utf8')
    if (current !== generated) {
      console.error(
        'Major-piece mate-progress data is stale. Run npm run generate:mate-progress.',
      )
      process.exitCode = 1
    } else {
      console.log('Major-piece mate-progress data is reproducible and current.')
    }
    return
  }

  await writeFile(ARTIFACT_PATH, generated)
  console.log(`Wrote ${ARTIFACT_PATH}`)
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main(process.argv.slice(2))
}
