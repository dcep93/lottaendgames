import type { Chess } from 'chess.js'
import {
  collectionIndex,
  getChess,
  materialMatchesMate,
} from './chess'
import {
  getTwoKnightsPawnTerminalOutcome,
  type RegisteredMateRuleSet,
} from './rules'
import type { MateId, MateMode } from './types'

export const NO_PREFERRED_RULE_ID = 'no-preferred-rule'

export type MateTerminalOutcome =
  | 'checkmate'
  | 'stalemate'
  | 'lost-material'
  | 'lost-knight'
  | 'pawn-promoted'
  | 'fifty-move'
  | 'unsupported'

export type MateLogEntry = {
  fen: string
  san: string
  opponentSan?: string
  phase: string
  isCorrect: boolean
  correctChoices: number
  idealOpponentChoices?: number
  legalOpponentChoices?: number
  durationMs: number
  reasonId: string
}

export type MateSnapshot = {
  fen: string
  logs: MateLogEntry[]
  finishedAtMs?: number
  outcome?: MateTerminalOutcome
}

export type MateSession = {
  mateId: MateId
  mode: MateMode
  startingFen: string
  fen: string
  logs: MateLogEntry[]
  history: MateSnapshot[]
  historyIndex: number
  startedAtMs: number
  finishedAtMs?: number
  outcome?: MateTerminalOutcome
}

export type MateSessionSelection = {
  mateId: MateId
  mode: MateMode
  startingFen?: string
}

export type MateReplaySessionSelection = MateSessionSelection & {
  readonly moves: readonly string[]
  readonly startingFen: string
}

export type MateSessionDeps = {
  now: () => number
  random: () => number
  generatePosition: (
    mateId: MateId,
    mode: MateMode,
    random: () => number,
  ) => string
  getRuleSet: (mateId: MateId) => RegisteredMateRuleSet
}

type CompletedTurn = {
  readonly fen: string
  readonly log: MateLogEntry
  readonly outcome: MateTerminalOutcome | undefined
}

function cloneLog(log: MateLogEntry): MateLogEntry {
  return { ...log }
}

function cloneLogs(logs: readonly MateLogEntry[]): MateLogEntry[] {
  return logs.map(cloneLog)
}

function makeSnapshot(
  fen: string,
  logs: readonly MateLogEntry[],
  finishedAtMs: number | undefined,
  outcome: MateTerminalOutcome | undefined,
): MateSnapshot {
  return {
    fen,
    logs: cloneLogs(logs),
    ...(finishedAtMs === undefined ? {} : { finishedAtMs }),
    ...(outcome === undefined ? {} : { outcome }),
  }
}

function applySnapshot(
  session: MateSession,
  historyIndex: number,
): MateSession {
  const snapshot = session.history[historyIndex]
  if (snapshot === undefined) return session
  return {
    ...session,
    fen: snapshot.fen,
    logs: cloneLogs(snapshot.logs),
    historyIndex,
    finishedAtMs: snapshot.finishedAtMs,
    outcome: snapshot.outcome,
  }
}

function commitSnapshot(
  session: MateSession,
  fen: string,
  logs: readonly MateLogEntry[],
  transitionAtMs: number,
  outcome: MateTerminalOutcome | undefined,
): MateSession {
  const finishedAtMs = outcome === undefined ? undefined : transitionAtMs
  const nextLogs = cloneLogs(logs)
  const history = session.history.slice(0, session.historyIndex + 1)
  history.push(makeSnapshot(fen, nextLogs, finishedAtMs, outcome))
  return {
    ...session,
    fen,
    logs: nextLogs,
    history,
    historyIndex: history.length - 1,
    finishedAtMs,
    outcome,
  }
}

function tryMove(chess: Chess, san: string) {
  try {
    return chess.move(san)
  } catch {
    return null
  }
}

function chooseMove(
  moves: readonly string[],
  random: () => number,
): string | undefined {
  if (moves.length === 0) return undefined
  return moves[collectionIndex(moves.length, random())]
}

function previousWhiteTurnFen(
  logs: readonly MateLogEntry[],
): string | undefined {
  return logs[logs.length - 1]?.fen
}

function lastWhiteMoveAtMs(session: MateSession): number {
  return session.logs.reduce(
    (time, log) => time + log.durationMs,
    session.startedAtMs,
  )
}

function moveDurationMs(session: MateSession, now: number): number {
  return Math.max(0, now - lastWhiteMoveAtMs(session))
}

function historicalWhiteMoveAtMs(
  session: MateSession,
  logIndex: number,
): number {
  return session.logs
    .slice(0, logIndex + 1)
    .reduce(
      (time, log) => time + log.durationMs,
      session.startedAtMs,
    )
}

function canonicalWhiteSan(fen: string, san: string): string | undefined {
  const chess = getChess(fen)
  if (chess.turn() !== 'w') return undefined
  return tryMove(chess, san)?.san
}

function completeWhiteTurn(options: {
  readonly mateId: MateId
  readonly preMoveFen: string
  readonly san: string
  readonly prefixLogs: readonly MateLogEntry[]
  readonly durationMs: number
  readonly preferredOpponentSan?: string
  readonly deps: MateSessionDeps
}): CompletedTurn | undefined {
  const {
    mateId,
    preMoveFen,
    san,
    prefixLogs,
    durationMs,
    preferredOpponentSan,
    deps,
  } = options
  const chess = getChess(preMoveFen)
  if (chess.turn() !== 'w') return undefined
  const ruleSet = deps.getRuleSet(mateId)
  const idealWhiteMoves = ruleSet.idealWhiteMoves(preMoveFen)
  const whiteMove = tryMove(chess, san)
  if (whiteMove === null) return undefined

  const canonicalSan = whiteMove.san
  const isCorrect = idealWhiteMoves.includes(canonicalSan)
  const reason =
    idealWhiteMoves.length === 0
      ? undefined
      : ruleSet.explainWhiteMove(preMoveFen, canonicalSan) ??
        (isCorrect ? ruleSet.currentWhiteHint(preMoveFen) : undefined)
  let outcome = getMateTerminalOutcome(mateId, chess.fen())
  let opponentSan: string | undefined
  let idealOpponentChoices: number | undefined
  let legalOpponentChoices: number | undefined

  if (outcome === undefined) {
    const candidates = ruleSet.blackCandidates(
      chess.fen(),
      previousWhiteTurnFen(prefixLogs),
    )
    if (candidates.moves.length === 0) {
      throw new Error(
        `non-terminal ${mateId} position has no legal Black replies`,
      )
    }
    const legalMoves = new Set(candidates.moves)
    if (candidates.idealMoves.some((move) => !legalMoves.has(move))) {
      throw new Error(
        `non-terminal ${mateId} position has an illegal ideal Black reply`,
      )
    }
    idealOpponentChoices = candidates.idealMoves.length
    legalOpponentChoices = candidates.moves.length
    opponentSan =
      preferredOpponentSan !== undefined &&
      candidates.moves.includes(preferredOpponentSan)
        ? preferredOpponentSan
        : chooseMove(
            candidates.idealMoves.length > 0
              ? candidates.idealMoves
              : candidates.moves,
            deps.random,
          )

    if (opponentSan !== undefined) {
      const blackMove = tryMove(chess, opponentSan)
      if (blackMove === null) return undefined
      opponentSan = blackMove.san
      outcome = getMateTerminalOutcome(mateId, chess.fen())
    }
  }

  return {
    fen: chess.fen(),
    outcome,
    log: {
      fen: preMoveFen,
      san: canonicalSan,
      ...(opponentSan === undefined ? {} : { opponentSan }),
      phase: ruleSet.phase(preMoveFen),
      isCorrect,
      correctChoices: idealWhiteMoves.length,
      ...(idealOpponentChoices === undefined
        ? {}
        : { idealOpponentChoices }),
      ...(legalOpponentChoices === undefined
        ? {}
        : { legalOpponentChoices }),
      durationMs,
      // The facade can legitimately have no differentiating rule when every
      // legal move ties. Keep the required log field stable and empty-safe.
      reasonId: reason?.id ?? NO_PREFERRED_RULE_ID,
    },
  }
}

export function getMateTerminalOutcome(
  mateId: MateId,
  fen: string,
): MateTerminalOutcome | undefined {
  if (mateId === 'two-knights-pawn') {
    return getTwoKnightsPawnTerminalOutcome(fen) ?? undefined
  }
  if (!materialMatchesMate(mateId, fen)) return 'lost-material'
  const chess = getChess(fen)
  if (chess.isCheckmate()) return 'checkmate'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDrawByFiftyMoves()) return 'fifty-move'
  return undefined
}

export function createMateSession(
  selection: MateSessionSelection,
  deps: MateSessionDeps,
): MateSession {
  const generatedFen =
    selection.startingFen ??
    deps.generatePosition(selection.mateId, selection.mode, deps.random)
  const startingFen = getChess(generatedFen).fen()
  const startedAtMs = deps.now()
  const outcome = getMateTerminalOutcome(selection.mateId, startingFen)
  const finishedAtMs = outcome === undefined ? undefined : startedAtMs
  const history = [
    makeSnapshot(startingFen, [], finishedAtMs, outcome),
  ]
  return {
    mateId: selection.mateId,
    mode: selection.mode,
    startingFen,
    fen: startingFen,
    logs: [],
    history,
    historyIndex: 0,
    startedAtMs,
    finishedAtMs,
    outcome,
  }
}

export function createMateReplaySession(
  selection: MateReplaySessionSelection,
  deps: MateSessionDeps,
): MateSession {
  if (selection.moves.length === 0 || selection.moves.length % 2 !== 0) {
    throw new Error('Mate replay requires complete White/Black turns')
  }

  let session = createMateSession(selection, deps)
  for (let index = 0; index < selection.moves.length; index += 2) {
    if (session.outcome !== undefined) {
      throw new Error('Mate replay continues after a terminal position')
    }
    const whiteSan = selection.moves[index]
    const blackSan = selection.moves[index + 1]
    if (whiteSan === undefined || blackSan === undefined) {
      throw new Error('Mate replay has an incomplete turn')
    }
    const completed = completeWhiteTurn({
      mateId: session.mateId,
      preMoveFen: session.fen,
      san: whiteSan,
      prefixLogs: session.logs,
      durationMs: 0,
      preferredOpponentSan: blackSan,
      deps,
    })
    if (
      completed === undefined ||
      completed.log.opponentSan !== blackSan
    ) {
      throw new Error(`Mate replay rejected turn ${index / 2 + 1}`)
    }
    session = commitSnapshot(
      session,
      completed.fen,
      [...session.logs, completed.log],
      session.startedAtMs,
      completed.outcome,
    )
  }
  return session
}

export function playWhiteMove(
  session: MateSession,
  san: string,
  deps: MateSessionDeps,
): MateSession {
  if (session.outcome !== undefined) return session
  const canonicalSan = canonicalWhiteSan(session.fen, san)
  if (canonicalSan === undefined) return session
  const transitionAtMs = deps.now()
  const completed = completeWhiteTurn({
    mateId: session.mateId,
    preMoveFen: session.fen,
    san: canonicalSan,
    prefixLogs: session.logs,
    durationMs: moveDurationMs(session, transitionAtMs),
    deps,
  })
  if (completed === undefined) return session
  return commitSnapshot(
    session,
    completed.fen,
    [...session.logs, completed.log],
    transitionAtMs,
    completed.outcome,
  )
}

export function playBestMateMove(
  session: MateSession,
  deps: MateSessionDeps,
): MateSession {
  if (session.outcome !== undefined) return session
  const idealMoves = deps.getRuleSet(session.mateId).idealWhiteMoves(session.fen)
  const san = chooseMove(idealMoves, deps.random)
  return san === undefined ? session : playWhiteMove(session, san, deps)
}

export function getMateElapsedMs(
  session: MateSession,
  now: number,
): number {
  return Math.max(0, (session.finishedAtMs ?? now) - session.startedAtMs)
}

export function undoMateMove(session: MateSession): MateSession {
  if (session.historyIndex === 0) return session
  return applySnapshot(session, session.historyIndex - 1)
}

export function redoMateMove(session: MateSession): MateSession {
  if (session.historyIndex >= session.history.length - 1) return session
  return applySnapshot(session, session.historyIndex + 1)
}

export function startOverMateSession(
  session: MateSession,
  deps: MateSessionDeps,
): MateSession {
  return createMateSession(
    { mateId: session.mateId, mode: session.mode },
    deps,
  )
}

export function replaceHistoricalWhiteMove(
  session: MateSession,
  logIndex: number,
  san: string,
  deps: MateSessionDeps,
): MateSession {
  const originalLog = session.logs[logIndex]
  if (originalLog === undefined) return session
  const canonicalSan = canonicalWhiteSan(originalLog.fen, san)
  if (canonicalSan === undefined || originalLog.san === canonicalSan) {
    return session
  }
  const idealMoves = deps
    .getRuleSet(session.mateId)
    .idealWhiteMoves(originalLog.fen)
  if (!idealMoves.includes(canonicalSan)) return session
  const prefixLogs = session.logs.slice(0, logIndex)
  const completed = completeWhiteTurn({
    mateId: session.mateId,
    preMoveFen: originalLog.fen,
    san: canonicalSan,
    prefixLogs,
    durationMs: originalLog.durationMs,
    preferredOpponentSan: originalLog.opponentSan,
    deps,
  })
  if (completed === undefined) return session
  return commitSnapshot(
    session,
    completed.fen,
    [...prefixLogs, completed.log],
    historicalWhiteMoveAtMs(session, logIndex),
    completed.outcome,
  )
}

export function replaceHistoricalBlackMove(
  session: MateSession,
  logIndex: number,
  san: string,
  deps: MateSessionDeps,
): MateSession {
  const originalLog = session.logs[logIndex]
  if (originalLog === undefined || originalLog.opponentSan === san) {
    return session
  }
  const chess = getChess(originalLog.fen)
  if (tryMove(chess, originalLog.san) === null) return session
  if (getMateTerminalOutcome(session.mateId, chess.fen()) !== undefined) {
    return session
  }

  const prefixLogs = session.logs.slice(0, logIndex)
  const ruleSet = deps.getRuleSet(session.mateId)
  const candidates = ruleSet.blackCandidates(
    chess.fen(),
    previousWhiteTurnFen(prefixLogs),
  )
  if (!candidates.moves.includes(san)) return session
  const blackMove = tryMove(chess, san)
  if (blackMove === null) return session
  const outcome = getMateTerminalOutcome(session.mateId, chess.fen())
  const replacementLog: MateLogEntry = {
    ...originalLog,
    opponentSan: blackMove.san,
    idealOpponentChoices: candidates.idealMoves.length,
    legalOpponentChoices: candidates.moves.length,
  }
  return commitSnapshot(
    session,
    chess.fen(),
    [...prefixLogs, replacementLog],
    historicalWhiteMoveAtMs(session, logIndex),
    outcome,
  )
}
