import { fork, type ChildProcess } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { getChess } from '../../app/src/mate/chess.ts'
import { encodeMateReplay, decodeMateReplay } from '../../app/src/mate/share.ts'
import { getMateRuleSet } from '../../app/src/mate/rules/index.ts'
import { createTwoBishopsDevelopmentFingerprints } from './development-cache.mts'
import { createProductionMateAdapter, enumerateProductionMateRoots } from './production.mts'
import { analyzeExhaustiveGraph, type ExhaustiveGraphNode } from './exhaustive-graph.mts'
import type { CensusExpansion } from './two-bishops-census-worker.mts'

type StoredNode = ExhaustiveGraphNode & Omit<CensusExpansion, 'id' | 'children'>
type DbRow = { id: number; key: string; is_root: number; payload: string | null }

const startedAt = Date.now()
const fingerprints = createTwoBishopsDevelopmentFingerprints()
function implementationFingerprint(): string {
  const hash = createHash('sha256')
  for (const path of ['./two-bishops-census.mts', './two-bishops-census-worker.mts', './exhaustive-graph.mts',
    '../../app/src/mate/positions.ts', '../../app/src/mate/catalog.ts', '../../app/src/mate/share.ts']) {
    hash.update(path).update(readFileSync(new URL(path, import.meta.url)))
  }
  return hash.digest('hex')
}
const implementation = implementationFingerprint()
const args = process.argv.slice(2)
const option = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=')
const workerCount = Number(option('workers') ?? 6)
const rootLimit = option('root-limit') === undefined ? undefined : Number(option('root-limit'))
if (!Number.isInteger(workerCount) || workerCount < 1 || workerCount > 16) throw new Error('Invalid worker count')
if (rootLimit !== undefined && (!Number.isInteger(rootLimit) || rootLimit < 1)) throw new Error('Invalid root limit')
const outputDir = resolve(option('output') ?? fileURLToPath(new URL(`../../tmp/mate-verifier-census/${fingerprints.policy.slice(0, 12)}${rootLimit === undefined ? '' : `-prefix-${rootLimit}`}`, import.meta.url)))
mkdirSync(outputDir, { recursive: true })
const database = new DatabaseSync(resolve(outputDir, 'graph.sqlite'))
database.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;
  CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS nodes (id INTEGER PRIMARY KEY, key TEXT UNIQUE NOT NULL, is_root INTEGER NOT NULL, payload TEXT);`)
const readMeta = database.prepare('SELECT value FROM metadata WHERE key = ?')
const putMeta = database.prepare('INSERT OR REPLACE INTO metadata VALUES (?, ?)')
const provenance = JSON.stringify({ version: 1, fingerprints, implementation, rootLimit: rootLimit ?? null })
const existing = readMeta.get('provenance') as { value: string } | undefined
if (existing && existing.value !== provenance) throw new Error('Checkpoint fingerprint or scope mismatch')
putMeta.run('provenance', provenance)
const insert = database.prepare('INSERT INTO nodes (id, key, is_root) VALUES (?, ?, ?)')
const setRoot = database.prepare('UPDATE nodes SET is_root = 1 WHERE id = ?')
const save = database.prepare('UPDATE nodes SET payload = ? WHERE id = ?')
const keys: string[] = []
const ids = new Map<string, number>()
const roots = new Set<number>()
const nodes: (StoredNode | undefined)[] = []
for (const raw of database.prepare('SELECT * FROM nodes ORDER BY id').iterate()) {
  const row = raw as DbRow
  if (row.id !== keys.length) throw new Error('Non-contiguous checkpoint IDs')
  keys.push(row.key); ids.set(row.key, row.id)
  nodes.push(row.payload === null ? undefined : JSON.parse(row.payload) as StoredNode)
  if (row.is_root) roots.add(row.id)
}
const adapter = createProductionMateAdapter('two-bishops')
function addNode(key: string, isRoot = false): number {
  let id = ids.get(key)
  if (id === undefined) {
    id = keys.length; keys.push(key); nodes.push(undefined); ids.set(key, id)
    insert.run(id, key, Number(isRoot))
  } else if (isRoot && !roots.has(id)) setRoot.run(id)
  if (isRoot) roots.add(id)
  return id
}
function progress(phase: string): void {
  const completed = nodes.reduce((sum, node) => sum + Number(node !== undefined), 0)
  const message = { phase, elapsedSeconds: Math.round((Date.now() - startedAt) / 1000),
    roots: roots.size, positions: nodes.length, completed, workers: workerCount }
  console.error(JSON.stringify(message))
  writeFileSync(resolve(outputDir, 'progress.json'), JSON.stringify(message, null, 2))
}

if (!readMeta.get('rootsComplete')) {
  let count = 0
  database.exec('BEGIN')
  for (const root of enumerateProductionMateRoots('two-bishops')) {
    addNode(adapter.key(root.state), true)
    count += 1
    if (count % 10_000 === 0) {
      database.exec('COMMIT'); progress('enumerating'); database.exec('BEGIN')
    }
    if (rootLimit !== undefined && count >= rootLimit) break
  }
  putMeta.run('rootsComplete', 'true')
  database.exec('COMMIT')
}
progress('expanding')
let cursor = 0
let completedSinceProgress = 0
const active = new Map<ChildProcess, number>()
const workers: ChildProcess[] = []
const heartbeat = setInterval(() => progress('expanding'), 30_000)
try {
  await new Promise<void>((resolveRun, rejectRun) => {
    let settled = false
    function dispatch(worker: ChildProcess): void {
      const batch: { id: number; key: string }[] = []
      while (cursor < keys.length && batch.length < 64) {
        const id = cursor++
        if (nodes[id] === undefined) batch.push({ id, key: keys[id]! })
      }
      if (batch.length) { active.set(worker, batch.length); worker.send(batch) }
      if (cursor === keys.length && active.size === 0 && !settled) {
        settled = true; resolveRun()
      }
    }
    for (let i = 0; i < workerCount; i += 1) {
      const worker = fork(fileURLToPath(new URL('./two-bishops-census-worker.mts', import.meta.url)), [],
        { execArgv: process.execArgv, serialization: 'advanced', stdio: ['ignore', 'ignore', 'inherit', 'ipc'] })
      workers.push(worker)
      worker.on('error', rejectRun)
      worker.on('exit', (code) => { if (!settled) rejectRun(new Error(`Worker exited: ${code}`)) })
      worker.on('message', (batch: CensusExpansion[]) => {
        try {
          if (batch.length !== active.get(worker)) throw new Error('Worker batch length mismatch')
          database.exec('BEGIN')
          for (const result of batch) {
            const { id, children, ...metrics } = result
            if (nodes[id] !== undefined) throw new Error('Duplicate expansion')
            const node: StoredNode = { ...metrics, children: children.map((key) => addNode(key)) }
            nodes[id] = node; save.run(JSON.stringify(node), id)
          }
          database.exec('COMMIT')
          active.delete(worker)
          completedSinceProgress += batch.length
          if (completedSinceProgress >= 10_000) { completedSinceProgress = 0; progress('expanding') }
          for (const idle of workers) if (!active.has(idle)) dispatch(idle)
        } catch (error) { rejectRun(error) }
      })
      dispatch(worker)
    }
  })
} finally {
  clearInterval(heartbeat)
  for (const worker of workers) worker.kill()
}
progress('analyzing')
if (nodes.some((node) => node === undefined)) throw new Error('Incomplete graph')
if (JSON.stringify(createTwoBishopsDevelopmentFingerprints()) !== JSON.stringify(fingerprints) ||
    implementationFingerprint() !== implementation) {
  throw new Error('Source changed during census; refusing certificate')
}
const graph = nodes as StoredNode[]
const analysis = analyzeExhaustiveGraph(graph)
const census: Record<string, { eliminatedMoves: number; positionsAffected: number }> = {}
let whiteChoices = 0, blackReplies = 0
for (const node of graph) {
  whiteChoices += node.whiteChoices; blackReplies += node.blackReplies
  for (const [rule, count] of Object.entries(node.counts)) {
    const total = census[rule] ??= { eliminatedMoves: 0, positionsAffected: 0 }
    total.eliminatedMoves += count; total.positionsAffected += Number(count > 0)
  }
}
const rootOutcomes = { total: roots.size, mateBeforeDraw: 0, loopLeading: 0, otherFailureLeading: 0, fiftyMoveOnly: 0 }
for (const id of roots) {
  if (analysis.loopLeading[id]) rootOutcomes.loopLeading += 1
  else if (analysis.failureLeading[id]) rootOutcomes.otherFailureLeading += 1
  else if (analysis.rank[id]! > 100) rootOutcomes.fiftyMoveOnly += 1
  else if (analysis.rank[id]! > 0) rootOutcomes.mateBeforeDraw += 1
  else throw new Error('Unclassified root')
}

// Re-expand only witness paths, transporting graph choices into one physical
// orientation. Never concatenate SAN from different symmetry representatives.
function witness(startId: number) {
  const startingFen = `${keys[startId]} 0 1`
  const chess = getChess(startingFen)
  const seen = new Map<string, number>()
  const moves: string[] = []
  const reasons: string[] = []
  let kind = 'fifty-move', cycleStartPly: number | undefined
  for (let ply = 0; ply < 100; ply += 2) {
    const identity = chess.fen().split(' ').slice(0, 4).join(' ')
    const prior = seen.get(identity)
    if (prior !== undefined) { kind = 'cycle'; cycleStartPly = prior; break }
    seen.set(identity, moves.length)
    const id = ids.get(adapter.key(chess.fen()))!
    const expansion = adapter.expand(chess.fen())
    const branch = expansion.branches.find((candidate) => {
      if (candidate.kind === 'failure') return !analysis.loopLeading[id]
      if (candidate.kind !== 'continue') return false
      const child = ids.get(adapter.key(candidate.next))!
      if (analysis.loopLeading[id]) return Boolean(analysis.loopLeading[child])
      if (analysis.failureLeading[id]) return Boolean(analysis.failureLeading[child])
      return analysis.rank[child]! + 2 === analysis.rank[id]
    })
    if (!branch) throw new Error('Could not transport failing graph path')
    reasons.push(getMateRuleSet('two-bishops').currentWhiteHint(chess.fen())?.id ?? 'rule gap')
    for (const san of branch.moves) {
      chess.move(san); moves.push(san)
      if (chess.isCheckmate()) throw new Error('Failure witness reached mate')
    }
    if (branch.kind === 'failure') { kind = branch.failureKind; break }
  }
  const hash = encodeMateReplay(startingFen, moves, 0)
  if (!decodeMateReplay(hash, 'two-bishops').ok) throw new Error('Failure replay rejected')
  return { startingFen, moves, kind, cycleStartPly, finalFen: chess.fen(), reasons,
    url: `http://localhost:5173/mate/two-bishops${hash}` }
}
const witnesses: ReturnType<typeof witness>[] = []
const witnessErrors: { key: string; message: string }[] = []
const result = {
  certificate: { completeStandardUniverse: rootLimit === undefined,
    allPositionsTerminate: rootLimit === undefined && rootOutcomes.mateBeforeDraw === rootOutcomes.total,
    allExaminedRootsTerminate: rootOutcomes.mateBeforeDraw === rootOutcomes.total,
    stateKeyMode: 'symmetry', initialHalfmoveClock: 0,
    traversesAllTiedBestWhiteMoves: true, traversesAllLegalBlackReplies: true,
    rootScope: 'All app-eligible opposite-colored KBBK White-to-move starts, plus train seeds; all reachable White states',
    checksFiftyMoveLimit: true, historyRepetition: 'Structural loops; no supplied prehistory',
  }, fingerprints, implementation, elapsedMs: Date.now() - startedAt, workerCount,
  rootOutcomes, graphOutcomes: analysis.counts, whiteChoices, blackReplies,
  ruleFilterCensus: { unit: 'unique symmetry-canonical expanded White positions', positions: graph.length, rules: census },
  witnesses, witnessErrors,
}
// Persist the complete census before constructing optional human replay examples.
// A malformed witness must never erase the expensive graph result.
writeFileSync(resolve(outputDir, 'result.json'), JSON.stringify(result, null, 2))
const witnessSignatures = new Set<string>()
for (const id of roots) {
  if (analysis.rank[id]! > 0 && analysis.rank[id]! <= 100) continue
  try {
    const example = witness(id)
    const signature = `${example.kind}:${adapter.key(example.finalFen)}`
    if (witnessSignatures.has(signature)) continue
    witnessSignatures.add(signature); witnesses.push(example)
    if (witnesses.length === 5) break
  } catch (error) {
    if (witnessErrors.length < 5) witnessErrors.push({ key: keys[id]!, message: String(error) })
  }
}
writeFileSync(resolve(outputDir, 'result.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
database.close()
console.error(`Result: ${resolve(outputDir, 'result.json')}`)
