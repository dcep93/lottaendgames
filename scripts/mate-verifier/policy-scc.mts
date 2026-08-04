import type {
  MateVerificationAdapter,
  MateVerificationExpansion,
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
  readonly includeCycleWitnesses?: boolean
  readonly onProgress?: (progress: MatePolicySccProgress) => void
  readonly progressEvery?: number
}

export type MatePolicySccCacheStats = {
  readonly expansionHits: number
  readonly expansionMisses: number
  readonly graphNodeHits: number
  readonly graphNodeMisses: number
  readonly newEdges: number
  readonly newRoots: number
  readonly newStates: number
  readonly requestedRoots: number
}

export type MatePolicySccResult = {
  readonly cycleWitnessesOmitted: boolean
  readonly cyclicComponents: readonly MatePolicyCyclicComponent[]
  readonly failureSamples: readonly MatePolicyGraphFailure[]
  readonly positionOutcomes: MatePolicyPositionOutcomes
  readonly stats: MatePolicySccStats
  readonly status: 'acyclic' | 'cyclic'
}

export type MatePolicyPositionOutcomes = {
  readonly loopLeadingPositions: number
  readonly mateTerminatingPositions: number
  readonly otherFailureLeadingPositions: number
  readonly totalPositions: number
}

export type MatePolicySccRungResult = {
  readonly cache: MatePolicySccCacheStats
  readonly result: MatePolicySccResult
}

export type MatePolicySccSessionSnapshot<State> = {
  readonly directFailureNodeIds: Uint32Array
  readonly edges: Uint32Array
  readonly failures: readonly MatePolicyGraphFailure[]
  readonly graphStats: MatePolicySccStats
  readonly nodeKeys: readonly string[]
  readonly nodeStates: readonly State[]
  readonly rootKeys: readonly string[]
  readonly version: 1
}

type CompactEdge = {
  readonly fromId: number
  readonly toId: number
}

type CompactAdjacency = {
  readonly offsets: Uint32Array
  readonly targets: Uint32Array
}

type StronglyConnectedComponents = {
  readonly count: number
  readonly cyclicNodeIds: readonly number[][]
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
const EDGE_CHUNK_CAPACITY = 1 << 18

class CompactEdgeStore {
  private chunks: Uint32Array[] = []
  private current = new Uint32Array(EDGE_CHUNK_CAPACITY * 2)
  private currentEdges = 0
  length = 0

  push(fromId: number, toId: number): void {
    if (this.currentEdges === EDGE_CHUNK_CAPACITY) {
      this.chunks.push(this.current)
      this.current = new Uint32Array(EDGE_CHUNK_CAPACITY * 2)
      this.currentEdges = 0
    }
    const offset = this.currentEdges * 2
    this.current[offset] = fromId
    this.current[offset + 1] = toId
    this.currentEdges += 1
    this.length += 1
  }

  forEach(visit: (fromId: number, toId: number) => void): void {
    for (const chunk of this.chunks) {
      for (let offset = 0; offset < chunk.length; offset += 2) {
        visit(chunk[offset]!, chunk[offset + 1]!)
      }
    }
    for (let edge = 0; edge < this.currentEdges; edge += 1) {
      const offset = edge * 2
      visit(this.current[offset]!, this.current[offset + 1]!)
    }
  }

  appendFlat(edges: Uint32Array): void {
    if (edges.length % 2 !== 0) {
      throw new Error('Compact edge snapshot must contain from/to pairs')
    }
    for (let offset = 0; offset < edges.length; offset += 2) {
      this.push(edges[offset]!, edges[offset + 1]!)
    }
  }

  toFlatArray(): Uint32Array {
    const flattened = new Uint32Array(this.length * 2)
    let offset = 0
    this.forEach((fromId, toId) => {
      flattened[offset] = fromId
      flattened[offset + 1] = toId
      offset += 2
    })
    return flattened
  }
}

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
  return new MatePolicySccSession(adapter, options).extend(roots).result
}

export class MatePolicySccSession<State> {
  private readonly adapter: MateVerificationAdapter<State>
  private readonly options: MatePolicySccOptions
  private readonly nodeIds = new Map<string, number>()
  private readonly nodeKeys: string[] = []
  private readonly nodeStates: State[] = []
  private readonly rootKeys = new Set<string>()
  private readonly edges = new CompactEdgeStore()
  private readonly directFailureNodeIds = new Set<number>()
  private readonly failures: MatePolicyGraphFailure[] = []
  private readonly expansions = new Map<
    string,
    MateVerificationExpansion<State>
  >()
  private readonly graphStats: MutableGraphStats = {
    blackReplies: 0,
    continueEdges: 0,
    failureBranches: 0,
    mateBranches: 0,
    roots: 0,
    ruleGaps: 0,
    whiteChoices: 0,
    whiteStates: 0,
  }
  private cursor = 0
  private expansionHits = 0
  private expansionMisses = 0
  private graphNodeHits = 0
  private graphNodeMisses = 0

  constructor(
    adapter: MateVerificationAdapter<State>,
    options: MatePolicySccOptions = {},
    snapshot?: MatePolicySccSessionSnapshot<State>,
  ) {
    this.adapter = adapter
    this.options = options
    if (snapshot !== undefined) this.restore(snapshot)
  }

  extend(
    roots: Iterable<MateVerificationRoot<State>>,
  ): MatePolicySccRungResult {
    const before = {
      edges: this.edges.length,
      expansionHits: this.expansionHits,
      expansionMisses: this.expansionMisses,
      graphNodeHits: this.graphNodeHits,
      graphNodeMisses: this.graphNodeMisses,
      roots: this.rootKeys.size,
      states: this.nodeStates.length,
    }
    let requestedRoots = 0
    for (const root of roots) {
      requestedRoots += 1
      const key = this.adapter.key(root.state)
      if (this.rootKeys.has(key)) {
        this.graphNodeHits += 1
        continue
      }
      this.rootKeys.add(key)
      this.addNode(root.state)
    }
    this.graphStats.roots = this.rootKeys.size

    const progressEvery = Math.max(
      1,
      this.options.progressEvery ?? 10_000,
    )
    for (; this.cursor < this.nodeStates.length; this.cursor += 1) {
      const state = this.nodeStates[this.cursor]!
      const key = this.nodeKeys[this.cursor]!
      const expansion = this.getExpansion(state, key)
      this.graphStats.whiteStates += 1
      this.graphStats.whiteChoices += expansion.whiteChoices
      this.graphStats.blackReplies += expansion.blackReplies

      if (expansion.whiteChoices === 0 || expansion.branches.length === 0) {
        this.graphStats.ruleGaps += 1
        this.directFailureNodeIds.add(this.cursor)
        if (this.failures.length < FAILURE_SAMPLE_LIMIT) {
          this.failures.push({
            fromKey: key,
            fromState: this.adapter.render(state),
            kind: 'rule-gap',
            message: 'Position expansion returned no White choices',
            moves: [],
          })
        }
      }

      for (const branch of expansion.branches) {
        if (branch.kind === 'mate') {
          this.graphStats.mateBranches += 1
          continue
        }
        if (branch.kind === 'failure') {
          this.graphStats.failureBranches += 1
          this.directFailureNodeIds.add(this.cursor)
          if (this.failures.length < FAILURE_SAMPLE_LIMIT) {
            this.failures.push({
              fromKey: key,
              fromState: this.adapter.render(state),
              kind: branch.failureKind,
              message: branch.message,
              moves: branch.moves,
            })
          }
          continue
        }

        const childId = this.addNode(branch.next)
        this.edges.push(this.cursor, childId)
        this.graphStats.continueEdges += 1
      }

      if (this.graphStats.whiteStates % progressEvery === 0) {
        this.options.onProgress?.({
          continueEdges: this.graphStats.continueEdges,
          queuedWhiteStates: this.nodeStates.length,
          roots: this.graphStats.roots,
          whiteStates: this.graphStats.whiteStates,
        })
      }
    }

    this.options.onProgress?.({
      continueEdges: this.graphStats.continueEdges,
      queuedWhiteStates: this.nodeStates.length,
      roots: this.graphStats.roots,
      whiteStates: this.graphStats.whiteStates,
    })

    const result = this.buildResult()
    return {
      cache: {
        expansionHits: this.expansionHits - before.expansionHits,
        expansionMisses: this.expansionMisses - before.expansionMisses,
        graphNodeHits: this.graphNodeHits - before.graphNodeHits,
        graphNodeMisses: this.graphNodeMisses - before.graphNodeMisses,
        newEdges: this.edges.length - before.edges,
        newRoots: this.rootKeys.size - before.roots,
        newStates: this.nodeStates.length - before.states,
        requestedRoots,
      },
      result,
    }
  }

  snapshot(): MatePolicySccSessionSnapshot<State> {
    return {
      directFailureNodeIds: Uint32Array.from(this.directFailureNodeIds),
      edges: this.edges.toFlatArray(),
      failures: [...this.failures],
      graphStats: {
        ...this.graphStats,
        cyclicComponents: 0,
        cyclicStates: 0,
        maximumCyclicComponentSize: 0,
        multiStateCycles: 0,
        selfLoops: 0,
        stronglyConnectedComponents: 0,
        twoStateCycles: 0,
      },
      nodeKeys: [...this.nodeKeys],
      nodeStates: [...this.nodeStates],
      rootKeys: [...this.rootKeys],
      version: 1,
    }
  }

  private restore(snapshot: MatePolicySccSessionSnapshot<State>): void {
    if (snapshot.version !== 1) {
      throw new Error(`Unsupported SCC session snapshot ${snapshot.version}`)
    }
    if (snapshot.nodeKeys.length !== snapshot.nodeStates.length) {
      throw new Error('SCC snapshot keys and states must have equal length')
    }
    for (let nodeId = 0; nodeId < snapshot.nodeKeys.length; nodeId += 1) {
      const key = snapshot.nodeKeys[nodeId]!
      this.nodeIds.set(key, nodeId)
      this.nodeKeys.push(key)
      this.nodeStates.push(snapshot.nodeStates[nodeId]!)
    }
    for (const key of snapshot.rootKeys) this.rootKeys.add(key)
    for (const nodeId of snapshot.directFailureNodeIds) {
      this.directFailureNodeIds.add(nodeId)
    }
    this.edges.appendFlat(snapshot.edges)
    this.failures.push(...snapshot.failures.slice(0, FAILURE_SAMPLE_LIMIT))
    Object.assign(this.graphStats, {
      blackReplies: snapshot.graphStats.blackReplies,
      continueEdges: snapshot.graphStats.continueEdges,
      failureBranches: snapshot.graphStats.failureBranches,
      mateBranches: snapshot.graphStats.mateBranches,
      roots: snapshot.graphStats.roots,
      ruleGaps: snapshot.graphStats.ruleGaps,
      whiteChoices: snapshot.graphStats.whiteChoices,
      whiteStates: snapshot.graphStats.whiteStates,
    })
    this.cursor = this.nodeStates.length
  }

  private addNode(state: State): number {
    const key = this.adapter.key(state)
    const prior = this.nodeIds.get(key)
    if (prior !== undefined) {
      this.graphNodeHits += 1
      return prior
    }
    const nodeId = this.nodeStates.length
    this.nodeIds.set(key, nodeId)
    this.nodeKeys.push(key)
    this.nodeStates.push(state)
    this.graphNodeMisses += 1
    return nodeId
  }

  private getExpansion(
    state: State,
    key = this.adapter.key(state),
  ): MateVerificationExpansion<State> {
    const cached = this.expansions.get(key)
    if (cached !== undefined) {
      this.expansionHits += 1
      return cached
    }
    const expansion = this.adapter.expand(state)
    this.expansions.set(key, expansion)
    this.expansionMisses += 1
    return expansion
  }

  private buildResult(): MatePolicySccResult {
    const { forward, reverse } = buildCompactAdjacency(
      this.nodeStates.length,
      this.edges,
    )
    const components = findStronglyConnectedComponents(forward, reverse)
    const cachedAdapter: MateVerificationAdapter<State> = {
      ...this.adapter,
      expand: (state) => this.getExpansion(state),
    }
    const includeCycleWitnesses =
      this.options.includeCycleWitnesses ?? true
    const cyclicComponents = includeCycleWitnesses
      ? components.cyclicNodeIds
          .map((nodeIds) =>
            describeCyclicComponent(
              nodeIds,
              this.nodeKeys,
              this.nodeStates,
              forward,
              cachedAdapter,
            ),
          )
          .sort(compareComponents)
      : []
    const categoryCounts = includeCycleWitnesses
      ? countCategories(cyclicComponents)
      : {
          'multi-state-cycle': 0,
          'self-loop': 0,
          'two-state-cycle': 0,
        }
    const cyclicStates = components.cyclicNodeIds.reduce(
      (sum, nodeIds) => sum + nodeIds.length,
      0,
    )
    const maximumCyclicComponentSize = components.cyclicNodeIds.reduce(
      (maximum, nodeIds) => Math.max(maximum, nodeIds.length),
      0,
    )
    const loopLeadingNodeIds = reverseReachableNodeIds(
      components.cyclicNodeIds.flat(),
      reverse,
    )
    const failureLeadingNodeIds = reverseReachableNodeIds(
      this.directFailureNodeIds,
      reverse,
    )
    let otherFailureLeadingPositions = 0
    for (const nodeId of failureLeadingNodeIds) {
      if (!loopLeadingNodeIds.has(nodeId)) {
        otherFailureLeadingPositions += 1
      }
    }
    const positionOutcomes: MatePolicyPositionOutcomes = {
      loopLeadingPositions: loopLeadingNodeIds.size,
      mateTerminatingPositions:
        this.nodeStates.length -
        loopLeadingNodeIds.size -
        otherFailureLeadingPositions,
      otherFailureLeadingPositions,
      totalPositions: this.nodeStates.length,
    }

    return {
      cycleWitnessesOmitted: !includeCycleWitnesses,
      cyclicComponents,
      failureSamples: this.failures,
      positionOutcomes,
      stats: {
        ...this.graphStats,
        cyclicComponents: components.cyclicNodeIds.length,
        cyclicStates,
        maximumCyclicComponentSize,
        multiStateCycles: categoryCounts['multi-state-cycle'],
        selfLoops: categoryCounts['self-loop'],
        stronglyConnectedComponents: components.count,
        twoStateCycles: categoryCounts['two-state-cycle'],
      },
      status:
        components.cyclicNodeIds.length === 0 ? 'acyclic' : 'cyclic',
    }
  }
}

function reverseReachableNodeIds(
  starts: Iterable<number>,
  reverse: CompactAdjacency,
): ReadonlySet<number> {
  const reachable = new Set<number>()
  const stack: number[] = []
  for (const nodeId of starts) {
    if (reachable.has(nodeId)) continue
    reachable.add(nodeId)
    stack.push(nodeId)
  }
  while (stack.length > 0) {
    const nodeId = stack.pop()!
    for (
      let edgeIndex = reverse.offsets[nodeId]!;
      edgeIndex < reverse.offsets[nodeId + 1]!;
      edgeIndex += 1
    ) {
      const predecessorId = reverse.targets[edgeIndex]!
      if (reachable.has(predecessorId)) continue
      reachable.add(predecessorId)
      stack.push(predecessorId)
    }
  }
  return reachable
}

function buildCompactAdjacency(
  nodeCount: number,
  edges: CompactEdgeStore,
): { forward: CompactAdjacency; reverse: CompactAdjacency } {
  const forwardDegrees = new Uint32Array(nodeCount)
  const reverseDegrees = new Uint32Array(nodeCount)
  edges.forEach((fromId, toId) => {
    forwardDegrees[fromId] += 1
    reverseDegrees[toId] += 1
  })
  const forwardOffsets = prefixOffsets(forwardDegrees)
  const reverseOffsets = prefixOffsets(reverseDegrees)
  const forwardTargets = new Uint32Array(edges.length)
  const reverseTargets = new Uint32Array(edges.length)
  const forwardCursors = forwardOffsets.slice(0, nodeCount)
  const reverseCursors = reverseOffsets.slice(0, nodeCount)
  edges.forEach((fromId, toId) => {
    forwardTargets[forwardCursors[fromId]!] = toId
    forwardCursors[fromId] += 1
    reverseTargets[reverseCursors[toId]!] = fromId
    reverseCursors[toId] += 1
  })
  return {
    forward: { offsets: forwardOffsets, targets: forwardTargets },
    reverse: { offsets: reverseOffsets, targets: reverseTargets },
  }
}

function prefixOffsets(degrees: Uint32Array): Uint32Array {
  const offsets = new Uint32Array(degrees.length + 1)
  for (let nodeId = 0; nodeId < degrees.length; nodeId += 1) {
    offsets[nodeId + 1] = offsets[nodeId]! + degrees[nodeId]!
  }
  return offsets
}

/** Numeric iterative Kosaraju keeps the full census within a bounded heap. */
function findStronglyConnectedComponents(
  forward: CompactAdjacency,
  reverse: CompactAdjacency,
): StronglyConnectedComponents {
  const nodeCount = forward.offsets.length - 1
  const visited = new Uint8Array(nodeCount)
  const finishOrder = new Uint32Array(nodeCount)
  let finishCount = 0

  for (let start = 0; start < nodeCount; start += 1) {
    if (visited[start]) continue
    visited[start] = 1
    const nodeStack = [start]
    const edgeStack = [forward.offsets[start]!]
    while (nodeStack.length > 0) {
      const stackIndex = nodeStack.length - 1
      const nodeId = nodeStack[stackIndex]!
      const edgeIndex = edgeStack[stackIndex]!
      const edgeEnd = forward.offsets[nodeId + 1]!
      if (edgeIndex >= edgeEnd) {
        finishOrder[finishCount] = nodeId
        finishCount += 1
        nodeStack.pop()
        edgeStack.pop()
        continue
      }
      edgeStack[stackIndex] = edgeIndex + 1
      const targetId = forward.targets[edgeIndex]!
      if (visited[targetId]) continue
      visited[targetId] = 1
      nodeStack.push(targetId)
      edgeStack.push(forward.offsets[targetId]!)
    }
  }

  const assigned = new Uint8Array(nodeCount)
  const cyclicNodeIds: number[][] = []
  let count = 0
  for (let index = finishCount - 1; index >= 0; index -= 1) {
    const start = finishOrder[index]!
    if (assigned[start]) continue
    count += 1
    assigned[start] = 1
    const component: number[] = []
    const stack = [start]
    while (stack.length > 0) {
      const nodeId = stack.pop()!
      component.push(nodeId)
      for (
        let edgeIndex = reverse.offsets[nodeId]!;
        edgeIndex < reverse.offsets[nodeId + 1]!;
        edgeIndex += 1
      ) {
        const predecessorId = reverse.targets[edgeIndex]!
        if (assigned[predecessorId]) continue
        assigned[predecessorId] = 1
        stack.push(predecessorId)
      }
    }
    if (
      component.length > 1 ||
      hasCompactEdge(forward, start, start)
    ) {
      cyclicNodeIds.push(component)
    }
  }
  return { count, cyclicNodeIds }
}

function hasCompactEdge(
  adjacency: CompactAdjacency,
  fromId: number,
  toId: number,
): boolean {
  for (
    let edgeIndex = adjacency.offsets[fromId]!;
    edgeIndex < adjacency.offsets[fromId + 1]!;
    edgeIndex += 1
  ) {
    if (adjacency.targets[edgeIndex] === toId) return true
  }
  return false
}

function describeCyclicComponent<State>(
  nodeIds: readonly number[],
  nodeKeys: readonly string[],
  nodeStates: readonly State[],
  forward: CompactAdjacency,
  adapter: MateVerificationAdapter<State>,
): MatePolicyCyclicComponent {
  const members = new Set(nodeIds)
  let edgeCount = 0
  for (const nodeId of nodeIds) {
    for (
      let edgeIndex = forward.offsets[nodeId]!;
      edgeIndex < forward.offsets[nodeId + 1]!;
      edgeIndex += 1
    ) {
      if (members.has(forward.targets[edgeIndex]!)) edgeCount += 1
    }
  }
  const cycle = shortestCycle(
    nodeIds,
    nodeKeys,
    nodeStates,
    forward,
    adapter,
  )
  return {
    edgeCount,
    nodeKeys: nodeIds.map((nodeId) => nodeKeys[nodeId]!).sort(),
    witness: {
      category: cycleCategory(cycle),
      moves: cycle.flatMap((edge) => edge.moves),
      transitions: cycle,
    },
  }
}

function shortestCycle<State>(
  nodeIds: readonly number[],
  nodeKeys: readonly string[],
  nodeStates: readonly State[],
  forward: CompactAdjacency,
  adapter: MateVerificationAdapter<State>,
): MatePolicyCycleTransition[] {
  const members = new Set(nodeIds)
  const orderedStarts = [...nodeIds].sort((left, right) =>
    nodeKeys[left]!.localeCompare(nodeKeys[right]!),
  )
  let best: MatePolicyCycleTransition[] | undefined

  for (const start of orderedStarts) {
    const distance = new Map<number, number>([[start, 0]])
    const incoming = new Map<number, CompactEdge>()
    const queue = [start]
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const nodeId = queue[cursor]!
      const depth = distance.get(nodeId) ?? 0
      if (best !== undefined && depth + 1 > best.length) continue

      for (
        let edgeIndex = forward.offsets[nodeId]!;
        edgeIndex < forward.offsets[nodeId + 1]!;
        edgeIndex += 1
      ) {
        const targetId = forward.targets[edgeIndex]!
        if (!members.has(targetId)) continue
        const edge = { fromId: nodeId, toId: targetId }
        if (targetId === start) {
          const compactCycle = [
            ...pathTo(nodeId, start, incoming),
            edge,
          ]
          const candidate = compactCycle.map((compactEdge) =>
            hydrateTransition(
              compactEdge,
              nodeKeys,
              nodeStates,
              adapter,
            ),
          )
          if (isBetterCycle(candidate, best)) best = candidate
          continue
        }
        if (distance.has(targetId)) continue
        distance.set(targetId, depth + 1)
        incoming.set(targetId, edge)
        queue.push(targetId)
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
  nodeId: number,
  start: number,
  incoming: ReadonlyMap<number, CompactEdge>,
): CompactEdge[] {
  const reversed: CompactEdge[] = []
  let cursor = nodeId
  while (cursor !== start) {
    const edge = incoming.get(cursor)
    if (edge === undefined) {
      throw new Error(`Missing shortest-path edge to ${cursor}`)
    }
    reversed.push(edge)
    cursor = edge.fromId
  }
  return reversed.reverse()
}

function hydrateTransition<State>(
  edge: CompactEdge,
  nodeKeys: readonly string[],
  nodeStates: readonly State[],
  adapter: MateVerificationAdapter<State>,
): MatePolicyCycleTransition {
  const fromKey = nodeKeys[edge.fromId]!
  const fromState = nodeStates[edge.fromId]!
  const toKey = nodeKeys[edge.toId]!
  const candidates = adapter
    .expand(fromState)
    .branches.flatMap((branch): MatePolicyCycleTransition[] => {
      if (branch.kind !== 'continue' || adapter.key(branch.next) !== toKey) {
        return []
      }
      return [{
        fromKey,
        fromState: adapter.render(fromState),
        moves: branch.moves,
        states: branch.states.map((state) => adapter.render(state)),
        toKey,
        toState: adapter.render(branch.next),
      }]
    })
    .sort((left, right) =>
      transitionSignature(left).localeCompare(transitionSignature(right)),
    )
  const transition = candidates[0]
  if (transition === undefined) {
    throw new Error(`Missing transition ${fromKey} -> ${toKey}`)
  }
  return transition
}

function isBetterCycle(
  candidate: readonly MatePolicyCycleTransition[],
  best: readonly MatePolicyCycleTransition[] | undefined,
): boolean {
  if (best === undefined || candidate.length < best.length) return true
  if (candidate.length > best.length) return false
  return cycleSignature(candidate) < cycleSignature(best)
}

function transitionSignature(edge: MatePolicyCycleTransition): string {
  return `${edge.moves.join(' ')}\u0000${edge.states.join('\u0000')}`
}

function cycleSignature(
  edges: readonly MatePolicyCycleTransition[],
): string {
  return edges
    .map((edge) => `${edge.fromKey}\u0000${edge.moves.join(' ')}\u0000${edge.toKey}`)
    .join('\u0001')
}

function cycleCategory(
  edges: readonly MatePolicyCycleTransition[],
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
