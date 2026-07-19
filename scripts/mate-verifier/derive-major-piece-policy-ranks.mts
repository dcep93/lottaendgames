import {
  createProductionMateAdapter,
  enumerateProductionMateRoots,
  type ProductionMateStateKeyMode,
} from './production.mts'
import { deriveMatePolicyRanks } from './policy-ranks.mts'
import type { MajorPieceMateId } from '../../app/src/mate/rules/majorPieceMateProgressEncoding.ts'

type Options = {
  readonly mateId: MajorPieceMateId
  readonly progressEvery: number
  readonly stateKeyMode: ProductionMateStateKeyMode
}

const options = parseOptions(process.argv.slice(2))
const startedAt = Date.now()
const result = deriveMatePolicyRanks(
  enumerateProductionMateRoots(options.mateId),
  createProductionMateAdapter(options.mateId, {
    stateKeyMode: options.stateKeyMode,
  }),
  {
    onProgress: (progress) => console.error(JSON.stringify(progress)),
    progressEvery: options.progressEvery,
  },
)

if (result.status === 'failed') {
  console.log(
    JSON.stringify({
      elapsedMs: Date.now() - startedAt,
      failure: result.failure,
      mateId: options.mateId,
      stateKeyMode: options.stateKeyMode,
      status: result.status,
    }),
  )
  process.exitCode = 1
} else {
  console.log(
    JSON.stringify({
      blackStates: result.blackRanks.size,
      elapsedMs: Date.now() - startedAt,
      mateId: options.mateId,
      maximumBlackRank: result.maximumBlackRank,
      maximumWhiteRank: result.maximumWhiteRank,
      provenRoots: result.provenRoots,
      stateKeyMode: options.stateKeyMode,
      status: result.status,
      whiteStates: result.whiteRanks.size,
    }),
  )
}

function parseOptions(args: readonly string[]): Options {
  let mateId: MajorPieceMateId = 'queen'
  let progressEvery = 10_000
  let stateKeyMode: ProductionMateStateKeyMode = 'identity'
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
    if (arg === '--symmetry') {
      stateKeyMode = 'symmetry'
      continue
    }
    if (arg === '--identity') {
      stateKeyMode = 'identity'
      continue
    }
    throw new Error(`Unknown argument ${String(arg)}`)
  }
  return { mateId, progressEvery, stateKeyMode }
}
