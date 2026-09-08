import type { ExhaustiveGraphAnalysis, ExhaustiveGraphNode } from './exhaustive-graph.mts'

/**
 * Select a stored child ID, so a replay can transport the same graph choice into
 * its physical board orientation instead of depending on SAN enumeration order.
 * Undefined means the selected outcome is an immediate terminal branch.
 *
 * Loop choices take priority over terminal failures. On a structurally mating
 * path, follow the maximum rank even below 100: the replay's accumulated clock,
 * rather than the remaining rank alone, determines when a draw occurs.
 */
export function selectExhaustiveFailureSuccessor(
  nodes: readonly ExhaustiveGraphNode[],
  analysis: ExhaustiveGraphAnalysis,
  id: number,
): number | undefined {
  const node = nodes[id]
  if (!Number.isInteger(id) || node === undefined) throw new RangeError(`Invalid witness node ${id}`)
  if (analysis.loopLeading[id]) {
    const child = node.children.find((candidate) => analysis.loopLeading[candidate] === 1)
    if (child === undefined) throw new Error(`Loop-leading node ${id} has no loop-leading successor`)
    return child
  }
  if (analysis.failureLeading[id]) {
    if (node.failure || (node.children.length === 0 && node.matePlies === 0)) return undefined
    const child = node.children.find((candidate) => analysis.failureLeading[candidate] === 1)
    if (child === undefined) throw new Error(`Failure-leading node ${id} has no failing successor`)
    return child
  }
  const rank = analysis.rank[id]!
  const child = node.children.find((candidate) =>
    analysis.rank[candidate]! > 0 && analysis.rank[candidate]! + 2 === rank,
  )
  if (child !== undefined) return child
  if (rank > 0 && node.matePlies === rank) return undefined
  throw new Error(`Node ${id} has no successor matching its analysis`)
}

/**
 * Return at most five eligible roots without repeatedly replaying their shared
 * continuations. The first loop-leading child defines a functional graph. Global
 * coloring visits each reachable node once and selects one root per encountered
 * functional cycle, preferring a root on that cycle over an ancestor root.
 *
 * These are playable examples, not an enumeration of cyclic SCCs: a node marked
 * loopLeading can lie arbitrarily far before the actual cycle. Remaining slots
 * hold one non-loop terminal-failure root and one longest-rank fifty-move root.
 * Time is O(V + E + number of supplied roots); storage is O(V).
 */
export function selectExhaustiveWitnessRoots(
  nodes: readonly ExhaustiveGraphNode[],
  analysis: ExhaustiveGraphAnalysis,
  roots: Iterable<number>,
  limit = 5,
): number[] {
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError('Invalid witness limit')
  const maximum = Math.min(limit, 5)
  if (maximum === 0) return []
  const size = nodes.length
  if (analysis.rank.length !== size || analysis.loopLeading.length !== size || analysis.failureLeading.length !== size) {
    throw new Error('Witness graph and analysis sizes differ')
  }
  const isRoot = new Uint8Array(size)
  const rootIds: number[] = []
  let failureRoot: number | undefined
  let failureRootIsTerminal = false
  let fiftyMoveRoot: number | undefined
  for (const id of roots) {
    if (!Number.isInteger(id) || id < 0 || id >= size) throw new RangeError(`Invalid witness root ${id}`)
    if (isRoot[id]) continue
    isRoot[id] = 1
    rootIds.push(id)
    if (analysis.loopLeading[id]) continue
    if (analysis.failureLeading[id]) {
      const node = nodes[id]!
      const terminal = node.failure || (node.children.length === 0 && node.matePlies === 0)
      if (failureRoot === undefined || (terminal && !failureRootIsTerminal)) {
        failureRoot = id
        failureRootIsTerminal = terminal
      }
    } else if (analysis.rank[id]! > 100 &&
      (fiftyMoveRoot === undefined || analysis.rank[id]! > analysis.rank[fiftyMoveRoot]!)) {
      fiftyMoveRoot = id
    }
  }

  const selected: number[] = []
  const color = new Uint8Array(size)
  const path: number[] = []
  for (const root of rootIds) {
    if (!analysis.loopLeading[root] || color[root]) continue
    path.length = 0
    let current = root
    while (color[current] === 0) {
      color[current] = 1
      path.push(current)
      current = selectExhaustiveFailureSuccessor(nodes, analysis, current)!
    }
    if (color[current] === 1) {
      const cycleStart = path.lastIndexOf(current)
      if (cycleStart < 0) throw new Error('Witness traversal encountered a foreign active path')
      let representative = root
      for (let index = cycleStart; index < path.length; index += 1) {
        const cycleNode = path[index]!
        if (isRoot[cycleNode]) { representative = cycleNode; break }
      }
      selected.push(representative)
      if (selected.length === maximum) return selected
    }
    for (const id of path) color[id] = 2
  }
  if (failureRoot !== undefined && selected.length < maximum) selected.push(failureRoot)
  if (fiftyMoveRoot !== undefined && selected.length < maximum) selected.push(fiftyMoveRoot)
  return selected
}
