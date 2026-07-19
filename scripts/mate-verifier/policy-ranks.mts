import type {
  MateVerificationAdapter,
  MateVerificationBranch,
  MateVerificationFailureKind,
  MateVerificationRoot,
} from './types.mts'

export type MatePolicyRankFailure = {
  readonly kind: MateVerificationFailureKind | 'inconsistent-rank'
  readonly message: string
  readonly moves: readonly string[]
}

export type MatePolicyRankResult =
  | {
      readonly blackRanks: ReadonlyMap<string, number>
      readonly maximumBlackRank: number
      readonly maximumWhiteRank: number
      readonly provenRoots: number
      readonly status: 'ranked'
      readonly whiteRanks: ReadonlyMap<string, number>
    }
  | {
      readonly failure: MatePolicyRankFailure
      readonly status: 'failed'
    }

export type MatePolicyRankProgress = {
  readonly enteredWhiteStates: number
  readonly rankedBlackStates: number
  readonly rankedWhiteStates: number
  readonly provenRoots: number
}

export type MatePolicyRankOptions = {
  readonly onProgress?: (progress: MatePolicyRankProgress) => void
  readonly progressEvery?: number
}

type BlackGroup<State> = {
  readonly branches: MateVerificationBranch<State>[]
  readonly key: string
  readonly state: State
}

class PolicyRankFailureError extends Error {
  readonly failure: MatePolicyRankFailure

  constructor(failure: MatePolicyRankFailure) {
    super(failure.message)
    this.failure = failure
  }
}

/**
 * Ranks an already-selected White policy, including every tied White choice and
 * every legal Black response. It is intentionally independent of DTM: a rank
 * exists only when the supplied policy graph itself is a finite mating DAG.
 */
export function deriveMatePolicyRanks<State>(
  roots: Iterable<MateVerificationRoot<State>>,
  adapter: MateVerificationAdapter<State>,
  options: MatePolicyRankOptions = {},
): MatePolicyRankResult {
  const whiteRanks = new Map<string, number>()
  const blackRanks = new Map<string, number>()
  const activeAtMove = new Map<string, number>()
  let maximumBlackRank = 0
  let maximumWhiteRank = 0
  let provenRoots = 0
  let enteredWhiteStates = 0
  const progressEvery = Math.max(1, options.progressEvery ?? 10_000)

  const reportProgress = () => {
    options.onProgress?.({
      enteredWhiteStates,
      provenRoots,
      rankedBlackStates: blackRanks.size,
      rankedWhiteStates: whiteRanks.size,
    })
  }

  const rankWhite = (state: State, path: readonly string[]): number => {
    const key = adapter.key(state)
    const completed = whiteRanks.get(key)
    if (completed !== undefined) return completed
    const repeatedAt = activeAtMove.get(key)
    if (repeatedAt !== undefined) {
      throw new PolicyRankFailureError({
        kind: 'cycle',
        message: `Policy revisits structural White state ${key}`,
        moves: path.slice(repeatedAt),
      })
    }
    activeAtMove.set(key, path.length)
    enteredWhiteStates += 1
    if (enteredWhiteStates % progressEvery === 0) reportProgress()

    const expansion = adapter.expand(state)
    if (expansion.whiteChoices === 0 || expansion.branches.length === 0) {
      throw new PolicyRankFailureError({
        kind: 'rule-gap',
        message: `Policy has no selected White move at ${key}`,
        moves: path,
      })
    }

    const blackGroups = new Map<string, BlackGroup<State>>()
    for (const branch of expansion.branches) {
      if (branch.kind === 'failure') {
        throw new PolicyRankFailureError({
          kind: branch.failureKind,
          message: branch.message,
          moves: [...path, ...branch.moves],
        })
      }
      const afterWhite = branch.states[0]
      if (afterWhite === undefined) {
        throw new PolicyRankFailureError({
          kind: 'inconsistent-rank',
          message: `Policy branch at ${key} omits its after-White state`,
          moves: [...path, ...branch.moves],
        })
      }
      const blackKey = adapter.key(afterWhite)
      const group = blackGroups.get(blackKey) ?? {
        branches: [],
        key: blackKey,
        state: afterWhite,
      }
      group.branches.push(branch)
      blackGroups.set(blackKey, group)
    }

    let whiteRank = 0
    for (const group of blackGroups.values()) {
      const mateBranches = group.branches.filter(
        (branch) => branch.kind === 'mate',
      )
      const continueBranches = group.branches.filter(
        (branch): branch is Extract<typeof branch, { kind: 'continue' }> =>
          branch.kind === 'continue',
      )
      if (mateBranches.length > 0 && continueBranches.length > 0) {
        throw new PolicyRankFailureError({
          kind: 'inconsistent-rank',
          message: `Black state ${group.key} is both mate and nonterminal`,
          moves: path,
        })
      }

      let blackRank: number
      if (mateBranches.length > 0) {
        blackRank = 0
      } else {
        if (continueBranches.length === 0) {
          throw new PolicyRankFailureError({
            kind: 'inconsistent-rank',
            message: `Black state ${group.key} has no ranked continuation`,
            moves: path,
          })
        }
        blackRank = Math.max(
          ...continueBranches.map(
            (branch) =>
              1 + rankWhite(branch.next, [...path, ...branch.moves]),
          ),
        )
      }

      const priorBlackRank = blackRanks.get(group.key)
      if (priorBlackRank !== undefined && priorBlackRank !== blackRank) {
        throw new PolicyRankFailureError({
          kind: 'inconsistent-rank',
          message:
            `Black state ${group.key} has ranks ${priorBlackRank} and ${blackRank}`,
          moves: path,
        })
      }
      blackRanks.set(group.key, blackRank)
      maximumBlackRank = Math.max(maximumBlackRank, blackRank)
      whiteRank = Math.max(whiteRank, 1 + blackRank)
    }

    activeAtMove.delete(key)
    whiteRanks.set(key, whiteRank)
    maximumWhiteRank = Math.max(maximumWhiteRank, whiteRank)
    return whiteRank
  }

  try {
    for (const root of roots) {
      rankWhite(root.state, [])
      provenRoots += 1
    }
  } catch (error) {
    if (error instanceof PolicyRankFailureError) {
      return { failure: error.failure, status: 'failed' }
    }
    throw error
  }

  reportProgress()
  return {
    blackRanks,
    maximumBlackRank,
    maximumWhiteRank,
    provenRoots,
    status: 'ranked',
    whiteRanks,
  }
}
