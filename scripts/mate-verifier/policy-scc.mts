import type {
  MateVerificationAdapter,
  MateVerificationFailureKind,
  MateVerificationRoot,
} from './types.mts'

export type MatePolicyCycleCategory =
  | 'multi-state-cycle'
  | 'self-loop'
  | 'two-state-cycle'

export type MatePolicyCycleTransition = {
  readonly fromKey: string
  readonly fromState: string
  readonly moves: readonly string[]
  readonly states: readonly string[]
  readonly toKey: string
  readonly toState: string
}

export type MatePolicyCycleWitness = {
  /**
   * Moves around the symmetry-reduced graph cycle. For an immediately playable
   * line, run the same diagnostic with identity keys.
   */
  readonly moves: readonly string[]
  readonly category: MatePolicyCycleCategory
  readonly transitions: readonly MatePolicyCycleTransition[]
}

export type MatePolicyCyclicComponent = {
  readonly edgeCount: number
  readonly nodeKeys: readonly string[]
  readonly witness: MatePolicyCycleWitness
}

export type MatePolicyGraphFailure = {
  readonly fromKey: string
  readonly fromState: string
  readonly kind: MateVerificationFailureKind | 'rule-gap'
  readonly message: string
  readonly moves: readonly string[]
}

export type MatePolicySccStats = {
  readonly blackReplies: number
  readonly continueEdges: number
  readonly cyclicComponents: number
  readonly cyclicStates: number
  readonly failureBranches: number
  readonly mateBranches: number
  readonly maximumCyclicComponentSize: number
  readonly multiStateCycles: number
  readonly roots: number
  readonly ruleGaps: number
  readonly selfLoops: number
  readonly stronglyConnectedComponents: number
  readonly twoStateCycles: number
  readonly whiteChoices: number
  readonly whiteStates: number
}

export type MatePolicySccProgress = {
  readonly continueEdges: number
  readonly queuedWhiteStates: number
  readonly roots: number
  readonly whiteStates: number
}

export type MatePolicySccOptions = {
  readonly onProgress?: (progress: MatePolicySccProgress) => void
  readonly progressEvery?: number
}

export type MatePolicySccResult = {
  readonly cyclicComponents: readonly MatePolicyCyclicComponent[]
  readonly failureSamples: readonly MatePolicyGraphFailure[]
  readonly stats: MatePolicySccStats
  readonly status: 'acyclic' | 'cyclic'
}

type GraphEdge = {
  readonly fromKey: string
  readonly fromState: string
  readonly moves: readonly string[]
  readonly states: readonly string[]
  readonly toKey: string
  readonly toState: string
}

type GraphNode<State> = {
  readonly edges: GraphEdge[]
  readonly key: string
  readonly renderedState: string
  readonly state: State
}

type MutableGraphStats = {
  blackReplies: number
  continueEdges: number
  failureBranches: number
  mateBranches: number
  roots: number
  ruleGaps: number
  whiteChoices: number
  whiteStates: number
}

const FAILURE_SAMPLE_LIMIT = 20

/**
 * Builds the complete reachable selected-policy graph before looking for
 * cycles. Unlike the proof search, this diagnostic never stops at the first
 * cycle or terminal failure.
 */
export function diagnoseMatePolicySccs<State>(
  roots: Iterable<MateVerificationRoot<State>>,
  adapter: MateVerificationAdapter<State>,
  options: MatePolicySccOptions = {},
): MatePolicySccResult {
  const nodes = new Map<string, GraphNode<State>>()
  const queue: GraphNode<State>[] = []
  const failures: MatePolicyGraphFailure[] = []
  const graphStats: MutableGraphStats = {
    blackReplies: 0,
    continueEdges: 0,
    failureBranches: 0,
    mateBranches: 0,
    roots: 0,
    ruleGaps: 0,
    whiteChoices: 0,
    whiteStates: 0,
  }
  const progressEvery = Math.max(1, options.progressEvery ?? 10_000)

  const addNode = (state: State): GraphNode<State> => {
    const key = adapter.key(state)
    const prior = nodes.get(key)
    if (prior !== undefined) return prior
    const node = {
      edges: [],
      key,
      renderedState: adapter.render(state),
      state,
    }
    nodes.set(key, node)
    queue.push(node)
    return node
  }

  for (const root of roots) {
    graphStats.roots += 1
    addNode(root.state)
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const node = queue[cursor]
    if (node === undefined) continue
    const expansion = adapter.expand(node.state)
    graphStats.whiteStates += 1
    graphStats.whiteChoices += expansion.whiteChoices
    graphStats.blackReplies += expansion.blackReplies

    if (expansion.whiteChoices === 0 || expansion.branches.length === 0) {
      graphStats.ruleGaps += 1
      if (failures.length < FAILURE_SAMPLE_LIMIT) {
        failures.push({
          fromKey: node.key,
          fromState: node.renderedState,
          kind: 'rule-gap',
          message: 'Position expansion returned no White choices',
          moves: [],
        })
      }
    }

    for (const branch of expansion.branches) {
      if (branch.kind === 'mate') {
        graphStats.mateBranches += 1
        continue
      }
      if (branch.kind === 'failure') {
        graphStats.failureBranches += 1
        if (failures.length < FAILURE_SAMPLE_LIMIT) {
          failures.push({
            fromKey: node.key,
            fromState: node.renderedState,
            kind: branch.failureKind,
            message: branch.message,
            moves: branch.moves,
          })
        }
        continue
      }

      const child = addNode(branch.next)
      node.edges.push({
        fromKey: node.key,
        fromState: node.renderedState,
        moves: branch.moves,
        states: branch.states.map((state) => adapter.render(state)),
        toKey: child.key,
        toState: adapter.render(branch.next),
      })
      graphStats.continueEdges += 1
    }

    if (graphStats.whiteStates % progressEvery === 0) {
      options.onProgress?.({
        continueEdges: graphStats.continueEdges,
        queuedWhiteStates: queue.length,
        roots: graphStats.roots,
        whiteStates: graphStats.whiteStates,
      })
    }
  }

  options.onProgress?.({
    continueEdges: graphStats.continueEdges,
    queuedWhiteStates: queue.length,
    roots: graphStats.roots,
    whiteStates: graphStats.whiteStates,
  })

  const components = findStronglyConnectedComponents(nodes)
  const cyclicComponents = components
    .filter((keys) => isCyclicComponent(keys, nodes))
    .map((keys) => describeCyclicComponent(keys, nodes))
    .sort(compareComponents)
  const categoryCounts = countCategories(cyclicComponents)
  const cyclicStates = cyclicComponents.reduce(
    (sum, component) => sum + component.nodeKeys.length,
    0,
  )
  const maximumCyclicComponentSize = cyclicComponents.reduce(
    (maximum, component) => Math.max(maximum, component.nodeKeys.length),
    0,
  )

  return {
    cyclicComponents,
    failureSamples: failures,
    stats: {
      ...graphStats,
      cyclicComponents: cyclicComponents.length,
      cyclicStates,
      maximumCyclicComponentSize,
      multiStateCycles: categoryCounts['multi-state-cycle'],
      selfLoops: categoryCounts['self-loop'],
      stronglyConnectedComponents: components.length,
      twoStateCycles: categoryCounts['two-state-cycle'],
    },
    status: cyclicComponents.length === 0 ? 'acyclic' : 'cyclic',
  }
}

/** Iterative Kosaraju avoids overflowing the JS stack on full policy graphs. */
function findStronglyConnectedComponents<State>(
  nodes: ReadonlyMap<string, GraphNode<State>>,
): string[][] {
  const visited = new Set<string>()
  const finishOrder: string[] = []
  const sortedKeys = [...nodes.keys()].sort()

  for (const start of sortedKeys) {
    if (visited.has(start)) continue
    visited.add(start)
    const stack: Array<{ edgeIndex: number; key: string }> = [
      { edgeIndex: 0, key: start },
    ]
    while (stack.length > 0) {
      const frame = stack.at(-1)
      if (frame === undefined) break
      const edges = nodes.get(frame.key)?.edges ?? []
      const edge = edges[frame.edgeIndex]
      if (edge === undefined) {
        finishOrder.push(frame.key)
        stack.pop()
        continue
      }
      frame.edgeIndex += 1
      if (visited.has(edge.toKey)) continue
      visited.add(edge.toKey)
      stack.push({ edgeIndex: 0, key: edge.toKey })
    }
  }

  const reverse = new Map<string, string[]>()
  for (const key of nodes.keys()) reverse.set(key, [])
  for (const node of nodes.values()) {
    for (const edge of node.edges) reverse.get(edge.toKey)?.push(node.key)
  }

  const assigned = new Set<string>()
  const components: string[][] = []
  for (let index = finishOrder.length - 1; index >= 0; index -= 1) {
    const start = finishOrder[index]
    if (start === undefined || assigned.has(start)) continue
    assigned.add(start)
    const component: string[] = []
    const stack = [start]
    while (stack.length > 0) {
      const key = stack.pop()
      if (key === undefined) continue
      component.push(key)
      for (const predecessor of reverse.get(key) ?? []) {
        if (assigned.has(predecessor)) continue
        assigned.add(predecessor)
        stack.push(predecessor)
      }
    }
    component.sort()
    components.push(component)
  }
  return components
}

function isCyclicComponent<State>(
  keys: readonly string[],
  nodes: ReadonlyMap<string, GraphNode<State>>,
): boolean {
  if (keys.length > 1) return true
  const key = keys[0]
  return (
    key !== undefined &&
    (nodes.get(key)?.edges.some((edge) => edge.toKey === key) ?? false)
  )
}

function describeCyclicComponent<State>(
  keys: readonly string[],
  nodes: ReadonlyMap<string, GraphNode<State>>,
): MatePolicyCyclicComponent {
  const memberKeys = new Set(keys)
  const edgeCount = keys.reduce(
    (count, key) =>
      count +
      (nodes.get(key)?.edges.filter((edge) => memberKeys.has(edge.toKey))
        .length ?? 0),
    0,
  )
  const cycle = shortestCycle(keys, nodes)
  return {
    edgeCount,
    nodeKeys: [...keys],
    witness: {
      category: cycleCategory(cycle),
      moves: cycle.flatMap((edge) => edge.moves),
      transitions: cycle,
    },
  }
}

function shortestCycle<State>(
  keys: readonly string[],
  nodes: ReadonlyMap<string, GraphNode<State>>,
): GraphEdge[] {
  const members = new Set(keys)
  let best: GraphEdge[] | undefined

  for (const start of keys) {
    const distance = new Map<string, number>([[start, 0]])
    const incoming = new Map<string, GraphEdge>()
    const queue = [start]
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const key = queue[cursor]
      if (key === undefined) continue
      const depth = distance.get(key) ?? 0
      if (best !== undefined && depth + 1 > best.length) continue

      for (const edge of nodes.get(key)?.edges ?? []) {
        if (!members.has(edge.toKey)) continue
        if (edge.toKey === start) {
          const candidate = [...pathTo(key, start, incoming), edge]
          if (isBetterCycle(candidate, best)) best = candidate
          continue
        }
        if (distance.has(edge.toKey)) continue
        distance.set(edge.toKey, depth + 1)
        incoming.set(edge.toKey, edge)
        queue.push(edge.toKey)
      }
    }
    if (best?.length === 1) break
  }

  if (best === undefined) {
    throw new Error('Cyclic strongly connected component has no cycle witness')
  }
  return best
}

function pathTo(
  key: string,
  start: string,
  incoming: ReadonlyMap<string, GraphEdge>,
): GraphEdge[] {
  const reversed: GraphEdge[] = []
  let cursor = key
  while (cursor !== start) {
    const edge = incoming.get(cursor)
    if (edge === undefined) {
      throw new Error(`Missing shortest-path edge to ${cursor}`)
    }
    reversed.push(edge)
    cursor = edge.fromKey
  }
  return reversed.reverse()
}

function isBetterCycle(
  candidate: readonly GraphEdge[],
  best: readonly GraphEdge[] | undefined,
): boolean {
  if (best === undefined || candidate.length < best.length) return true
  if (candidate.length > best.length) return false
  return cycleSignature(candidate) < cycleSignature(best)
}

function cycleSignature(edges: readonly GraphEdge[]): string {
  return edges
    .map((edge) => `${edge.fromKey}\u0000${edge.moves.join(' ')}\u0000${edge.toKey}`)
    .join('\u0001')
}

function cycleCategory(
  edges: readonly GraphEdge[],
): MatePolicyCycleCategory {
  if (edges.length === 1) return 'self-loop'
  const keys = new Set(edges.flatMap((edge) => [edge.fromKey, edge.toKey]))
  return keys.size === 2 ? 'two-state-cycle' : 'multi-state-cycle'
}

function countCategories(
  components: readonly MatePolicyCyclicComponent[],
): Record<MatePolicyCycleCategory, number> {
  const counts: Record<MatePolicyCycleCategory, number> = {
    'multi-state-cycle': 0,
    'self-loop': 0,
    'two-state-cycle': 0,
  }
  for (const component of components) counts[component.witness.category] += 1
  return counts
}

function compareComponents(
  left: MatePolicyCyclicComponent,
  right: MatePolicyCyclicComponent,
): number {
  const byCycleLength =
    left.witness.transitions.length - right.witness.transitions.length
  if (byCycleLength !== 0) return byCycleLength
  const leftKey = left.nodeKeys[0] ?? ''
  const rightKey = right.nodeKeys[0] ?? ''
  return leftKey.localeCompare(rightKey)
}
