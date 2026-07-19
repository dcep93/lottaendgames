import type {
  MateVerificationAdapter,
  MateVerificationBranch,
  MateVerificationFailure,
  MateVerificationOptions,
  MateVerificationResult,
  MateVerificationRoot,
  MateVerificationStats,
} from './types.mts'

type NodeProof = {
  readonly maximumMatePlies: number
  readonly safeIncomingHalfmoveClock: number
}

type SearchPath<State> = {
  readonly moves: string[]
  readonly states: State[]
}

type ProofFailure = {
  readonly cycleStartPly?: number
  readonly finalState: unknown
  readonly kind: MateVerificationFailure['kind']
  readonly message: string
  readonly moves: readonly string[]
  readonly witnessStartState?: unknown
}

class IncompleteVerification extends Error {}

export function verifyMateRoots<State>(
  roots: Iterable<MateVerificationRoot<State>>,
  adapter: MateVerificationAdapter<State>,
  options: MateVerificationOptions = {},
): MateVerificationResult {
  const stats: MateVerificationStats = {
    blackReplies: 0,
    maximumMatePlies: 0,
    provenRoots: 0,
    uniquePositions: 0,
    whiteChoices: 0,
  }
  const proofs = new Map<string, NodeProof>()
  const activeAtPly = new Map<string, number>()
  const progressEvery = Math.max(1, options.progressEvery ?? 10_000)
  let currentRoot: MateVerificationRoot<State> | undefined

  const maybeReportProgress = () => {
    if (stats.uniquePositions % progressEvery === 0) {
      options.onProgress?.({ ...stats })
    }
  }

  const prove = (
    state: State,
    path: SearchPath<State>,
  ): NodeProof | ProofFailure => {
    const key = adapter.key(state)
    const completed = proofs.get(key)
    if (completed !== undefined) return completed

    const repeatedAt = activeAtPly.get(key)
    if (repeatedAt !== undefined) {
      return {
        cycleStartPly: 0,
        finalState: state,
        kind: 'cycle',
        message: `Repeated proof-equivalent structural position ${key}`,
        moves: path.moves.slice(repeatedAt),
        witnessStartState: path.states[repeatedAt] ?? state,
      }
    }

    if (
      options.maxNodes !== undefined &&
      stats.uniquePositions >= options.maxNodes
    ) {
      throw new IncompleteVerification(
        `Stopped at the configured ${options.maxNodes}-position limit`,
      )
    }

    activeAtPly.set(key, path.moves.length)
    stats.uniquePositions += 1
    maybeReportProgress()

    const expansion = adapter.expand(state)
    stats.whiteChoices += expansion.whiteChoices
    stats.blackReplies += expansion.blackReplies
    if (expansion.branches.length === 0) {
      activeAtPly.delete(key)
      return {
        finalState: state,
        kind: 'rule-gap',
        message: 'Position expansion returned no White choices',
        moves: [...path.moves],
      }
    }

    let maximumMatePlies = 0
    let safeIncomingHalfmoveClock = 99
    for (const branch of expansion.branches) {
      const branchMoves = [...path.moves, ...branch.moves]
      const branchStates = [...path.states, ...branch.states]
      if (branch.kind === 'failure') {
        activeAtPly.delete(key)
        return {
          finalState: branchStates.at(-1) ?? state,
          kind: branch.failureKind,
          message: branch.message,
          moves: branchMoves,
        }
      }

      if (branch.kind === 'mate') {
        maximumMatePlies = Math.max(maximumMatePlies, branch.moves.length)
        safeIncomingHalfmoveClock = Math.min(
          safeIncomingHalfmoveClock,
          safeClockForBranch(branch, undefined),
        )
        continue
      }

      const child = prove(branch.next, {
        moves: branchMoves,
        states: branchStates,
      })
      if (isProofFailure(child)) {
        activeAtPly.delete(key)
        return child
      }
      maximumMatePlies = Math.max(
        maximumMatePlies,
        branch.moves.length + child.maximumMatePlies,
      )
      safeIncomingHalfmoveClock = Math.min(
        safeIncomingHalfmoveClock,
        safeClockForBranch(branch, child.safeIncomingHalfmoveClock),
      )
    }

    activeAtPly.delete(key)
    const proof = { maximumMatePlies, safeIncomingHalfmoveClock }
    proofs.set(key, proof)
    return proof
  }

  const findClockFailure = (
    state: State,
    incomingClock: number,
    path: SearchPath<State>,
  ): ProofFailure | undefined => {
    const expansion = adapter.expand(state)
    for (const branch of expansion.branches) {
      if (branch.kind === 'failure') continue
      let clock = incomingClock
      for (const [index, resets] of branch.resetsHalfmoveClock.entries()) {
        clock = resets ? 0 : clock + 1
        const isMatingMove =
          branch.kind === 'mate' && index === branch.moves.length - 1
        if (clock >= 100 && !isMatingMove) {
          return {
            finalState: branch.states[index] ?? state,
            kind: 'fifty-move',
            message: `Fifty-move draw reached after ${path.moves.length + index + 1} plies`,
            moves: [...path.moves, ...branch.moves.slice(0, index + 1)],
          }
        }
      }
      if (branch.kind !== 'continue') continue
      const childProof = proofs.get(adapter.key(branch.next))
      if (
        childProof !== undefined &&
        clock > childProof.safeIncomingHalfmoveClock
      ) {
        const failure = findClockFailure(branch.next, clock, {
          moves: [...path.moves, ...branch.moves],
          states: [...path.states, ...branch.states],
        })
        if (failure !== undefined) return failure
      }
    }
    return undefined
  }

  try {
    for (const root of roots) {
      if (
        options.maxRoots !== undefined &&
        stats.provenRoots >= options.maxRoots
      ) {
        return {
          message: `Stopped at the configured ${options.maxRoots}-root limit`,
          status: 'incomplete',
          stats,
        }
      }
      currentRoot = root
      const result = prove(root.state, { moves: [], states: [root.state] })
      if (isProofFailure(result)) {
        return failedResult(root, result, adapter, stats)
      }
      if (root.halfmoveClock > result.safeIncomingHalfmoveClock) {
        const clockFailure = findClockFailure(
          root.state,
          root.halfmoveClock,
          { moves: [], states: [root.state] },
        )
        return failedResult(
          root,
          clockFailure ?? {
            finalState: root.state,
            kind: 'fifty-move',
            message:
              `Starting halfmove clock ${root.halfmoveClock} exceeds the ` +
              `proven safe limit ${result.safeIncomingHalfmoveClock}`,
            moves: [],
          },
          adapter,
          stats,
        )
      }
      stats.maximumMatePlies = Math.max(
        stats.maximumMatePlies,
        result.maximumMatePlies,
      )
      stats.provenRoots += 1
    }
  } catch (error) {
    if (error instanceof IncompleteVerification) {
      return { message: error.message, status: 'incomplete', stats }
    }
    const context = currentRoot ? ` while checking ${currentRoot.fen}` : ''
    return {
      message: `${error instanceof Error ? error.message : String(error)}${context}`,
      status: 'incomplete',
      stats,
    }
  }

  options.onProgress?.({ ...stats })
  return { status: 'verified', stats }
}

function safeClockForBranch<State>(
  branch: Exclude<MateVerificationBranch<State>, { kind: 'failure' }>,
  childLimit: number | undefined,
): number {
  let safeLimit = -1
  for (let incoming = 0; incoming <= 99; incoming += 1) {
    let clock = incoming
    let safe = true
    for (const [index, resets] of branch.resetsHalfmoveClock.entries()) {
      clock = resets ? 0 : clock + 1
      const isMatingMove =
        branch.kind === 'mate' && index === branch.moves.length - 1
      if (clock >= 100 && !isMatingMove) {
        safe = false
        break
      }
    }
    if (
      safe &&
      branch.kind === 'continue' &&
      (childLimit === undefined || clock > childLimit)
    ) {
      safe = false
    }
    if (safe) safeLimit = incoming
  }
  return safeLimit
}

function isProofFailure(value: NodeProof | ProofFailure): value is ProofFailure {
  return 'kind' in value
}

function failedResult<State>(
  root: MateVerificationRoot<State>,
  failure: ProofFailure,
  adapter: MateVerificationAdapter<State>,
  stats: MateVerificationStats,
): MateVerificationResult {
  return {
    failure: {
      ...(failure.cycleStartPly === undefined
        ? {}
        : { cycleStartPly: failure.cycleStartPly }),
      finalFen: adapter.render(failure.finalState as State),
      kind: failure.kind,
      message: failure.message,
      moves: failure.moves,
      source: root.source,
      startingFen:
        failure.witnessStartState === undefined
          ? root.fen
          : adapter.render(failure.witnessStartState as State),
    },
    status: 'failed',
    stats,
  }
}
