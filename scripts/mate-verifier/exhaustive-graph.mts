/** A complete White-turn graph. Every child edge represents two reversible plies. */
export interface ExhaustiveGraphNode {
  children: readonly number[]
  /** Longest immediate mating branch, or zero when there is no mating branch. */
  matePlies: number
  /** At least one immediate non-mating terminal branch. */
  failure: boolean
}

export interface ExhaustiveGraphAnalysis {
  /** Maximum plies to mate under every choice; zero if a cycle or failure is reachable. */
  rank: Uint32Array
  /** A directed cycle is reachable, even if a different branch mates or fails. */
  loopLeading: Uint8Array
  /** A non-mating terminal branch is reachable, independently of cycle reachability. */
  failureLeading: Uint8Array
  counts: {
    totalPositions: number
    mateTerminatingPositions: number
    loopLeadingPositions: number
    directFailureLeadingPositions: number
    loopAndFailureLeadingPositions: number
    /** Universally mating in the structural graph, but some path needs over 100 plies. */
    fiftyMoveLeadingPositions: number
    maximumMatePlies: number
  }
}

const maximumUint32 = 0xffff_ffff

/**
 * Analyze every branch in O(V + E) time without recursive traversal or per-node Sets.
 *
 * Mating ranks require ALL successors to mate. Cycle reachability instead removes
 * sinks repeatedly: the remaining nodes are precisely those that can reach a cycle.
 * Failure reachability propagates independently, so its count may overlap the cycle
 * count. A branchless node without a mate is conservatively a terminal failure.
 *
 * The caller must supply the complete graph, with two-ply edges and no halfmove-clock
 * resets. Ranks then measure the worst-case halfmove-clock increase from zero; mate
 * on ply 100 still succeeds, while a rank above 100 permits a fifty-move draw.
 */
export function analyzeExhaustiveGraph(
  nodes: readonly ExhaustiveGraphNode[],
): ExhaustiveGraphAnalysis {
  const size = nodes.length
  if (size >= maximumUint32) throw new RangeError('Too many graph nodes for Uint32 indices')

  // Compressed sparse rows of predecessor IDs. Duplicate edges remain duplicate so
  // every outdegree decrement corresponds to exactly one original graph edge.
  const predecessorOffsets = new Uint32Array(size + 1)
  const remaining = new Uint32Array(size)
  const rank = new Uint32Array(size)
  let edgeCount = 0
  for (let id = 0; id < size; id += 1) {
    const node = nodes[id]!
    if (!Number.isInteger(node.matePlies) || node.matePlies < 0 || node.matePlies > maximumUint32) {
      throw new RangeError(`Invalid mating branch length at node ${id}`)
    }
    edgeCount += node.children.length
    if (edgeCount > maximumUint32) throw new RangeError('Too many graph edges for Uint32 offsets')
    remaining[id] = node.children.length
    rank[id] = node.matePlies
    for (const child of node.children) {
      if (!Number.isInteger(child) || child < 0 || child >= size) {
        throw new RangeError(`Invalid child ${child} at node ${id}`)
      }
      predecessorOffsets[child + 1]! += 1
    }
  }
  for (let id = 1; id <= size; id += 1) {
    predecessorOffsets[id]! += predecessorOffsets[id - 1]!
  }
  const predecessors = new Uint32Array(edgeCount)
  // Reuse the queue buffer while assembling reverse adjacency.
  const queue = new Uint32Array(size)
  queue.set(predecessorOffsets.subarray(0, size))
  for (let id = 0; id < size; id += 1) {
    for (const child of nodes[id]!.children) {
      predecessors[queue[child]!] = id
      queue[child]! += 1
    }
  }

  let head = 0
  let tail = 0
  for (let id = 0; id < size; id += 1) {
    if (remaining[id] === 0 && !nodes[id]!.failure && rank[id]! > 0) queue[tail++] = id
  }
  while (head < tail) {
    const child = queue[head++]!
    const candidate = rank[child]! + 2
    for (let edge = predecessorOffsets[child]!; edge < predecessorOffsets[child + 1]!; edge += 1) {
      const parent = predecessors[edge]!
      if (nodes[parent]!.failure) continue
      if (candidate > maximumUint32) throw new RangeError('Mating rank exceeds Uint32 capacity')
      rank[parent] = Math.max(rank[parent]!, candidate)
      remaining[parent]! -= 1
      if (remaining[parent] === 0) queue[tail++] = parent
    }
  }

  let mateTerminatingPositions = 0
  let fiftyMoveLeadingPositions = 0
  let maximumMatePlies = 0
  head = 0
  tail = 0
  for (let id = 0; id < size; id += 1) {
    if (remaining[id]! > 0 || nodes[id]!.failure) rank[id] = 0
    if (rank[id]! > 0) {
      mateTerminatingPositions += 1
      maximumMatePlies = Math.max(maximumMatePlies, rank[id]!)
      if (rank[id]! > 100) fiftyMoveLeadingPositions += 1
    }
    remaining[id] = nodes[id]!.children.length
    if (remaining[id] === 0) queue[tail++] = id
  }

  // Sink elimination retains predecessors of cycles, not merely the cyclic SCCs.
  while (head < tail) {
    const child = queue[head++]!
    for (let edge = predecessorOffsets[child]!; edge < predecessorOffsets[child + 1]!; edge += 1) {
      const parent = predecessors[edge]!
      remaining[parent]! -= 1
      if (remaining[parent] === 0) queue[tail++] = parent
    }
  }
  const loopLeading = new Uint8Array(size)
  const failureLeading = new Uint8Array(size)
  let loopLeadingPositions = 0
  head = 0
  tail = 0
  for (let id = 0; id < size; id += 1) {
    if (remaining[id]! > 0) {
      loopLeading[id] = 1
      loopLeadingPositions += 1
    }
    const node = nodes[id]!
    if (node.failure || (node.children.length === 0 && node.matePlies === 0)) {
      failureLeading[id] = 1
      queue[tail++] = id
    }
  }
  while (head < tail) {
    const child = queue[head++]!
    for (let edge = predecessorOffsets[child]!; edge < predecessorOffsets[child + 1]!; edge += 1) {
      const parent = predecessors[edge]!
      if (failureLeading[parent] === 1) continue
      failureLeading[parent] = 1
      queue[tail++] = parent
    }
  }
  let loopAndFailureLeadingPositions = 0
  for (let id = 0; id < size; id += 1) {
    if (loopLeading[id] === 1 && failureLeading[id] === 1) loopAndFailureLeadingPositions += 1
  }

  return {
    rank,
    loopLeading,
    failureLeading,
    counts: {
      totalPositions: size,
      mateTerminatingPositions,
      loopLeadingPositions,
      directFailureLeadingPositions: tail,
      loopAndFailureLeadingPositions,
      fiftyMoveLeadingPositions,
      maximumMatePlies,
    },
  }
}
