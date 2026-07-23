import type { MateId } from '../app/src/mate/types.ts'
import {
  createProductionMateAdapter,
  enumerateProductionMateRoots,
  type ProductionMateStateKeyMode,
} from './mate-verifier/production.mts'
import { verifyMateRoots } from './mate-verifier/search.mts'
import { verifyTwoBishopsProofCertificate } from './mate-verifier/two-bishops-proof.mts'

const MATE_IDS: readonly MateId[] = [
  'two-knights-pawn',
  'rook',
  'queen',
  'two-bishops',
  'bishop-knight',
]

type CliOptions = {
  readonly mateIds: readonly MateId[]
  readonly maxNodes?: number
  readonly maxRoots?: number
  readonly progressEvery: number
  readonly stateKeyMode: ProductionMateStateKeyMode
}

const options = parseOptions(process.argv.slice(2))
let exitCode = 0

for (const mateId of options.mateIds) {
  const startedAt = Date.now()
  console.error(`Verifying ${mateId} exhaustively...`)
  const result =
    mateId === 'two-bishops'
      ? verifyTwoBishopsProofCertificate()
      : verifyMateRoots(
          enumerateProductionMateRoots(mateId),
          createProductionMateAdapter(mateId, {
            stateKeyMode: options.stateKeyMode,
          }),
          {
            ...(options.maxNodes === undefined
              ? {}
              : { maxNodes: options.maxNodes }),
            ...(options.maxRoots === undefined
              ? {}
              : { maxRoots: options.maxRoots }),
            onProgress: (stats) => {
              console.error(
                `${mateId}: ${stats.provenRoots} roots, ` +
                  `${stats.uniquePositions} positions`,
              )
            },
            progressEvery: options.progressEvery,
          },
        )
  const summary = {
    elapsedMs: Date.now() - startedAt,
    mateId,
    stateKeyMode: options.stateKeyMode,
    ...result,
  }
  console.log(JSON.stringify(summary))

  if (result.status === 'failed') {
    console.error(formatFailure(result.failure))
    exitCode = 1
    break
  }
  if (result.status === 'incomplete') {
    console.error(`${mateId}: INCOMPLETE — ${result.message}`)
    exitCode = 2
    break
  }
}

process.exitCode = exitCode

function parseOptions(args: readonly string[]): CliOptions {
  let mateIds: readonly MateId[] = MATE_IDS
  let maxNodes: number | undefined
  let maxRoots: number | undefined
  let progressEvery = 10_000
  let stateKeyMode: ProductionMateStateKeyMode = 'symmetry'

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    const value = args[index + 1]
    if (arg === '--mate') {
      if (value === undefined) throw new Error('--mate requires a value')
      mateIds = value === 'all' ? MATE_IDS : [parseMateId(value)]
      index += 1
      continue
    }
    if (arg === '--max-nodes') {
      maxNodes = positiveInteger(value, '--max-nodes')
      index += 1
      continue
    }
    if (arg === '--max-roots') {
      maxRoots = positiveInteger(value, '--max-roots')
      index += 1
      continue
    }
    if (arg === '--progress-every') {
      progressEvery = positiveInteger(value, '--progress-every')
      index += 1
      continue
    }
    if (arg === '--identity') {
      stateKeyMode = 'identity'
      continue
    }
    throw new Error(`Unknown argument ${String(arg)}`)
  }

  return {
    mateIds,
    ...(maxNodes === undefined ? {} : { maxNodes }),
    ...(maxRoots === undefined ? {} : { maxRoots }),
    progressEvery,
    stateKeyMode,
  }
}

function parseMateId(value: string): MateId {
  if ((MATE_IDS as readonly string[]).includes(value)) return value as MateId
  throw new Error(`Unknown mate set ${value}`)
}

function positiveInteger(
  value: string | undefined,
  option: string,
): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${option} requires a positive integer`)
  }
  return parsed
}

function formatFailure(failure: {
  readonly cycleStartPly?: number
  readonly finalFen: string
  readonly kind: string
  readonly message: string
  readonly moves: readonly string[]
  readonly source: string
  readonly startingFen: string
}): string {
  return [
    `FAILED: ${failure.kind}`,
    failure.message,
    `Source: ${failure.source}`,
    `Starting FEN: ${failure.startingFen}`,
    `Moves: ${failure.moves.join(' ') || '(none)'}`,
    ...(failure.cycleStartPly === undefined
      ? []
      : [`Cycle starts at ply: ${failure.cycleStartPly}`]),
    `Final FEN: ${failure.finalFen}`,
  ].join('\n')
}
