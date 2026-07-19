import type { MajorPieceMateId } from '../../app/src/mate/rules/majorPieceMateProgressEncoding.ts'
import {
  createProductionMateAdapter,
  enumerateProductionMateRoots,
  type ProductionMateStateKeyMode,
} from './production.mts'
import { diagnoseMatePolicySccs } from './policy-scc.mts'

type Options = {
  readonly mateId: MajorPieceMateId
  readonly progressEvery: number
  readonly stateKeyMode: ProductionMateStateKeyMode
}

const options = parseOptions(process.argv.slice(2))
const startedAt = Date.now()
const result = diagnoseMatePolicySccs(
  enumerateProductionMateRoots(options.mateId),
  createProductionMateAdapter(options.mateId, {
    stateKeyMode: options.stateKeyMode,
  }),
  {
    onProgress: (progress) => console.error(JSON.stringify(progress)),
    progressEvery: options.progressEvery,
  },
)

console.log(
  JSON.stringify({
    cyclicComponents: result.cyclicComponents.map((component) => ({
      componentSize: component.nodeKeys.length,
      edgeCount: component.edgeCount,
      witness: component.witness,
    })),
    elapsedMs: Date.now() - startedAt,
    failureSamples: result.failureSamples,
    mateId: options.mateId,
    stateKeyMode: options.stateKeyMode,
    stats: result.stats,
    status: result.status,
  }),
)

process.exitCode = result.status === 'cyclic' ? 1 : 0

function parseOptions(args: readonly string[]): Options {
  let mateId: MajorPieceMateId = 'rook'
  let progressEvery = 10_000
  let stateKeyMode: ProductionMateStateKeyMode = 'symmetry'
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    const value = args[index + 1]
    if (arg === '--mate') {
      if (value !== 'queen' && value !== 'rook') {
        throw new Error('--mate requires queen or rook')
      }
      mateId = value
      index += 1
      continue
    }
    if (arg === '--progress-every') {
      const parsed = Number(value)
      if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error('--progress-every requires a positive integer')
      }
      progressEvery = parsed
      index += 1
      continue
    }
    if (arg === '--identity') {
      stateKeyMode = 'identity'
      continue
    }
    if (arg === '--symmetry') {
      stateKeyMode = 'symmetry'
      continue
    }
    throw new Error(`Unknown argument ${String(arg)}`)
  }
  return { mateId, progressEvery, stateKeyMode }
}
