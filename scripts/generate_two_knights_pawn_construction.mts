#!/usr/bin/env -S npx tsx
/** Generate the compact KNN-vs-KP construction from its audited identity witnesses.
 *
 * The witnesses were found by a deterministic offline beam search bounded by the
 * metadata below. Generation itself performs a bounded adversarial replay: every
 * production-ideal Black reply must be unique and equal to the witness reply.
 * File mirrors are derived from move coordinates, never copied by hand.
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Move, Square } from 'chess.js'
import manifestJson from '../app/src/mate/data/two-knights-pawn-positions.json' with { type: 'json' }
import {
  getChess,
  getSquareTransform,
  positionKey,
  transformFen,
  transformSquare,
} from '../app/src/mate/chess.ts'
import { getIdealTwoKnightsPawnBlackMoves } from '../app/src/mate/rules/twoKnightsPawn.ts'

const OUTPUT_PATH = fileURLToPath(
  new URL(
    '../app/src/mate/data/two-knights-pawn-construction.json',
    import.meta.url,
  ),
)

type WitnessPly = Readonly<{ san: string }>

const STANDARD_IDENTITY: readonly WitnessPly[] = [
  { san: 'Nc3' },
  { san: 'Kd7' },
  { san: 'Nge2' },
  { san: 'Kd6' },
  { san: 'Kd2' },
  { san: 'Ke5' },
  { san: 'Ke3' },
  { san: 'a5' },
  { san: 'Na4' },
  { san: 'Kd5' },
  { san: 'Kd3' },
  { san: 'Kc6' },
  { san: 'Kc4' },
  { san: 'Kd6' },
  { san: 'Nd4' },
  { san: 'Kd7' },
  { san: 'Kd5' },
  { san: 'Kc7' },
  { san: 'Ke6' },
  { san: 'Kb7' },
  { san: 'Kd5' },
  { san: 'Ka6' },
  { san: 'Kc6' },
  { san: 'Ka7' },
  { san: 'Nb5+' },
  { san: 'Ka6' },
  { san: 'Nc5#' },
]

const TRAIN_IDENTITY: readonly WitnessPly[] = [
  { san: 'Nf7#' },
]

const METADATA = {
  generator: 'scripts/generate_two_knights_pawn_construction.mts',
  algorithm: 'bounded-adversarial-witness-replay-v1',
  discovery: 'deterministic-offline-beam-search',
  whiteEdgeAuditProvider: 'Lichess tablebase API',
  whiteEdgeAuditVerifiedOn: '2026-07-16',
  whiteEdgeRequiredWdl: 2,
  beamWidth: 10000,
  maximumWhiteMoves: 95,
  maximumPlies: 200,
} as const

function mirrorWitness(
  startingFen: string,
  plies: readonly WitnessPly[],
): readonly WitnessPly[] {
  const transform = getSquareTransform('mirrorFile')
  const identity = getChess(startingFen)
  const mirror = getChess(transformFen(startingFen, transform))
  return plies.map((ply, index) => {
    const move = identity.move(ply.san) as Move | null
    if (!move) throw new Error(`identity ply ${index} is illegal: ${ply.san}`)
    const from = transformSquare(move.from as Square, transform)
    const to = transformSquare(move.to as Square, transform)
    const mirroredMove = (mirror.moves({ verbose: true }) as Move[]).find(
      (candidate) =>
        candidate.from === from &&
        candidate.to === to &&
        candidate.promotion === move.promotion,
    )
    if (!mirroredMove) {
      throw new Error(`identity ply ${index} has no legal file mirror`)
    }
    mirror.move(mirroredMove.san)
    return Object.freeze({ san: mirroredMove.san })
  })
}

function assertAdversarialRoute(
  startingFen: string,
  plies: readonly WitnessPly[],
  label: string,
): void {
  if (plies.length === 0 || plies.length > METADATA.maximumPlies) {
    throw new Error(`${label}: route is empty or exceeds the ply bound`)
  }
  if (Math.ceil(plies.length / 2) > METADATA.maximumWhiteMoves) {
    throw new Error(`${label}: route exceeds the White-move search bound`)
  }
  const chess = getChess(startingFen)
  const seen = new Set([positionKey(chess.fen())])
  for (const [index, ply] of plies.entries()) {
    if (chess.turn() === 'b') {
      const idealReplies = getIdealTwoKnightsPawnBlackMoves(chess.fen())
      if (idealReplies.length !== 1 || idealReplies[0] !== ply.san) {
        throw new Error(
          `${label} ply ${index}: witness ${ply.san} does not exhaust production-ideal replies (${idealReplies.join(', ')})`,
        )
      }
    }
    if (!chess.moves().includes(ply.san)) {
      throw new Error(`${label} ply ${index}: illegal SAN ${ply.san}`)
    }
    chess.move(ply.san)
    if (index < plies.length - 1 && chess.isGameOver()) {
      throw new Error(`${label} ply ${index}: route terminates early`)
    }
    const key = positionKey(chess.fen())
    if (seen.has(key)) throw new Error(`${label} ply ${index}: cycle at ${key}`)
    seen.add(key)
  }
  if (!chess.isCheckmate() || chess.turn() !== 'b') {
    throw new Error(`${label}: route does not end with Black checkmated`)
  }
}

function generateData() {
  const routes = []
  for (const [mode, identityPlies] of [
    ['standard', STANDARD_IDENTITY],
    ['train', TRAIN_IDENTITY],
  ] as const) {
    const source = manifestJson[mode][0]
    if (!source || source.transformNames.join(',') !== 'identity,mirrorFile') {
      throw new Error(`${mode}: generator expects one identity/mirrorFile source`)
    }
    const mirroredPlies = mirrorWitness(source.fen, identityPlies)
    for (const [transformName, plies] of [
      ['identity', identityPlies],
      ['mirrorFile', mirroredPlies],
    ] as const) {
      const startingFen = transformFen(
        source.fen,
        getSquareTransform(transformName),
      )
      assertAdversarialRoute(
        startingFen,
        plies,
        `${mode}[0] via ${transformName}`,
      )
      routes.push({ mode, sourceIndex: 0, transformName, plies })
    }
  }
  const policySha256 = createHash('sha256')
    .update(JSON.stringify(routes))
    .digest('hex')
  return {
    metadata: { ...METADATA, policySha256 },
    routes,
  }
}

const output = `${JSON.stringify(generateData(), null, 2)}\n`
if (process.argv.includes('--check')) {
  const committed = readFileSync(OUTPUT_PATH, 'utf8')
  if (committed !== output) {
    throw new Error('committed KNN construction is stale; regenerate with --write')
  }
} else if (process.argv.includes('--write')) {
  writeFileSync(OUTPUT_PATH, output, 'utf8')
} else {
  process.stdout.write(output)
}
