import assert from 'node:assert/strict'
import test from 'node:test'
import { MATE_CATALOG } from './catalog'
import { getChess, positionKey } from './chess'
import {
  getMateRuleSet,
  type RegisteredMateRuleSet,
  type RuleDescription,
} from './rules'
import {
  createMateSession,
  createMateReplaySession,
  getMateElapsedMs,
  getMateTerminalOutcome,
  playBestMateMove,
  playWhiteMove,
  redoMateMove,
  replaceHistoricalBlackMove,
  replaceHistoricalWhiteMove,
  startOverMateSession,
  undoMateMove,
  type MateSessionDeps,
} from './session'

const START_FEN = '7k/8/8/8/8/8/R7/K7 w - - 0 1'
const SECOND_START_FEN = '6k1/8/8/8/8/3K4/8/R7 w - - 0 1'
const ROOK_LOOP_START = '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1'
const ROOK_LOOP_MOVES = `
  Rb3 Kc5 Kc2 Kc6 Rh3 Kb7 Rh6 Kc7 Kc3 Kd7 Kd4 Ke7
  Ke5 Kd7 Ra6 Kc8 Rd6 Kc7 Rd1 Kc8 Ke6 Kc7 Rd2 Kb8
  Rc2 Kb7 Kd7 Kb6 Rc1 Kb5 Kd6 Kb4 Kd5 Ka3
  Rc4 Kb3 Rh4 Kc3 Rg4 Kd3 Rg3+ Ke2 Ke4 Kf1 Kf4 Ke2
  Ra3 Kd2 Ke4 Kc1 Rd3 Kc2 Rd8 Kc3 Rd7 Kb4 Rc7 Kb5
  Kd5 Ka6 Kd6 Kb6 Rc1 Kb5 Rc2 Kb4 Kd5 Kb3 Rc8 Kb4
  Rc1 Ka3
`.trim().split(/\s+/)

const finishRule: RuleDescription = {
  id: 'finish-net',
  shortLabel: 'finish the net',
  helpText: 'Finish the mating net when it is ready.',
}

const shrinkRule: RuleDescription = {
  id: 'shrink-box',
  shortLabel: 'shrink the box',
  helpText: 'Keep the defending king confined.',
}

function whiteMoves(fen: string): readonly string[] {
  const chess = getChess(fen)
  return chess.turn() === 'w' ? chess.moves() : []
}

function idealWhiteMoves(fen: string): readonly string[] {
  if (getChess(fen).fen() === getChess(START_FEN).fen()) {
    return ['Ra8+', 'Rh2+']
  }
  return whiteMoves(fen).slice(0, 1)
}

function createRuleSet(
  overrides: Partial<RegisteredMateRuleSet> = {},
): RegisteredMateRuleSet {
  return {
    id: 'rook',
    phase: () => '1/2',
    whiteMoves,
    blackCandidates: (fen) => {
      const moves = getChess(fen).moves()
      return { moves, idealMoves: moves.slice(0, 2) }
    },
    help: {
      title: 'Rules',
      whiteIntro: '',
      blackIntro: '',
      blackPriorities: [],
      notes: [],
      noteBoards: [],
    },
    whiteRuleDescriptions: [finishRule, shrinkRule],
    idealWhiteMoves,
    explainWhiteMove: (fen, san) =>
      san !== undefined && idealWhiteMoves(fen).includes(san)
        ? finishRule
        : shrinkRule,
    currentWhiteHint: () => finishRule,
    ...overrides,
  }
}

function sequence<T>(values: readonly T[]): () => T {
  let index = 0
  return () => {
    const value = values[index]
    if (value === undefined) {
      throw new Error(`sequence exhausted at ${index}`)
    }
    index += 1
    return value
  }
}

function createDeps(options?: {
  readonly fens?: readonly string[]
  readonly times?: readonly number[]
  readonly randoms?: readonly number[]
  readonly ruleSet?: RegisteredMateRuleSet
}): MateSessionDeps {
  const nextFen = sequence(options?.fens ?? [START_FEN])
  return {
    now: sequence(options?.times ?? [1_000]),
    random: sequence(options?.randoms ?? [0]),
    generatePosition: () => nextFen(),
    getRuleSet: () => options?.ruleSet ?? createRuleSet(),
  }
}

function assertCurrentSnapshot(session: {
  readonly fen: string
  readonly logs: readonly unknown[]
  readonly history: readonly {
    readonly fen: string
    readonly logs: readonly unknown[]
    readonly finishedAtMs?: number
    readonly outcome?: string
  }[]
  readonly historyIndex: number
  readonly finishedAtMs?: number
  readonly outcome?: string
}): void {
  const current = session.history[session.historyIndex]
  assert.ok(current)
  assert.equal(current.fen, session.fen)
  assert.deepEqual(current.logs, session.logs)
  assert.equal(current.finishedAtMs, session.finishedAtMs)
  assert.equal(current.outcome, session.outcome)
}

test('initializes a fresh dependency-injected session', () => {
  const session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    createDeps(),
  )

  assert.equal(session.startingFen, getChess(START_FEN).fen())
  assert.equal(session.fen, session.startingFen)
  assert.deepEqual(session.logs, [])
  assert.equal(session.historyIndex, 0)
  assert.equal(session.history.length, 1)
  assert.equal(session.startedAtMs, 1_000)
  assert.equal(session.finishedAtMs, undefined)
  assert.equal(session.outcome, undefined)
  assertCurrentSnapshot(session)
})

test('reconstructs the former exact Rook loop as undoable ordinary history', () => {
  const deps: MateSessionDeps = {
    now: () => 1_000,
    random: () => 0,
    generatePosition: () => ROOK_LOOP_START,
    getRuleSet: getMateRuleSet,
  }
  const replay = createMateReplaySession(
    {
      mateId: 'rook',
      mode: 'standard',
      moves: ROOK_LOOP_MOVES,
      startingFen: ROOK_LOOP_START,
    },
    deps,
  )

  assert.equal(replay.logs.length, 36)
  assert.equal(replay.history.length, 37)
  assert.equal(replay.historyIndex, 36)
  assert.equal(
    replay.fen,
    '8/8/8/3K4/8/k7/8/2R5 w - - 72 37',
  )
  assert.deepEqual(
    replay.logs.flatMap((log, index) =>
      log.isCorrect
        ? []
        : [{ move: index + 1, reasonId: log.reasonId, san: log.san }],
    ),
    [
      { move: 9, reasonId: 'establish box', san: 'Rd6' },
      { move: 10, reasonId: 'maximize black distance', san: 'Rd1' },
      { move: 13, reasonId: 'establish box', san: 'Rc2' },
      { move: 18, reasonId: 'establish box', san: 'Rc4' },
      { move: 19, reasonId: 'maximize black distance', san: 'Rh4' },
      { move: 26, reasonId: 'establish box', san: 'Rd3' },
      { move: 27, reasonId: 'maximize black distance', san: 'Rd8' },
    ],
  )

  let priorLoopPosition = replay
  for (let turn = 0; turn < 19; turn += 1) {
    priorLoopPosition = undoMateMove(priorLoopPosition)
  }
  assert.equal(priorLoopPosition.historyIndex, 17)
  assert.equal(positionKey(priorLoopPosition.fen), positionKey(replay.fen))

  let beginning = priorLoopPosition
  while (beginning.historyIndex > 0) beginning = undoMateMove(beginning)
  assert.equal(beginning.fen, ROOK_LOOP_START)

  let restored = beginning
  while (restored.historyIndex < restored.history.length - 1) {
    restored = redoMateMove(restored)
  }
  assert.equal(restored.fen, replay.fen)
})

test('records a correct White move and one tied automatic Black reply as one history step', () => {
  const deps = createDeps({
    times: [1_000, 1_600],
    randoms: [0.75],
  })
  const initial = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  const session = playWhiteMove(initial, 'Ra8+', deps)

  assert.equal(session.logs.length, 1)
  assert.deepEqual(session.logs[0], {
    fen: getChess(START_FEN).fen(),
    san: 'Ra8+',
    opponentSan: 'Kg7',
    phase: '1/2',
    isCorrect: true,
    correctChoices: 2,
    idealOpponentChoices: 2,
    legalOpponentChoices: 2,
    durationMs: 600,
    reasonId: 'finish-net',
  })
  assert.equal(session.fen, 'R7/6k1/8/8/8/8/8/K7 w - - 2 2')
  assert.equal(session.historyIndex, 1)
  assert.equal(session.history.length, 2)
  assert.equal(session.history[0]?.fen, initial.fen)
  assert.equal(session.history[1]?.fen, session.fen)
  assert.equal(initial.logs.length, 0)
  assert.equal(getMateElapsedMs(session, 2_100), 1_100)
  assertCurrentSnapshot(session)
})

test('an incorrect move is explained and play continues', () => {
  const deps = createDeps({
    times: [1_000, 1_400, 2_050],
    randoms: [0, 0],
  })
  let session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  session = playWhiteMove(session, 'Ra3', deps)

  assert.equal(session.logs[0]?.isCorrect, false)
  assert.equal(session.logs[0]?.reasonId, 'shrink-box')
  assert.equal(session.logs[0]?.durationMs, 400)
  assert.equal(session.logs[0]?.opponentSan, 'Kh7')
  assert.equal(session.outcome, undefined)

  const nextSan = whiteMoves(session.fen)[0]!
  session = playWhiteMove(session, nextSan, deps)
  assert.equal(session.logs.length, 2)
  assert.equal(session.logs[1]?.durationMs, 650)
  assert.equal(session.history.length, 3)
})

test('undo and redo operate on complete turns and new play truncates redo', () => {
  const deps = createDeps({
    times: [1_000, 1_100, 1_300],
    randoms: [0, 0],
  })
  const initial = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  const played = playWhiteMove(initial, 'Ra8+', deps)
  const undone = undoMateMove(played)

  assert.equal(undone.fen, initial.fen)
  assert.deepEqual(undone.logs, [])
  assert.equal(undone.historyIndex, 0)
  assert.equal(undoMateMove(undone), undone)

  const redone = redoMateMove(undone)
  assert.equal(redone.fen, played.fen)
  assert.deepEqual(redone.logs, played.logs)
  assert.equal(redoMateMove(redone), redone)

  const replacementLine = playWhiteMove(undone, 'Rh2+', deps)
  assert.equal(replacementLine.logs[0]?.san, 'Rh2+')
  assert.equal(replacementLine.historyIndex, 1)
  assert.equal(replacementLine.history.length, 2)
  assert.notEqual(replacementLine.fen, played.fen)
})

test('current logs and stored snapshots do not share mutable log objects', () => {
  const deps = createDeps({
    times: [1_000, 1_100],
    randoms: [0],
  })
  const played = playWhiteMove(
    createMateSession(
      { mateId: 'rook', mode: 'standard' },
      deps,
    ),
    'Ra8+',
    deps,
  )
  const currentSnapshot = played.history[played.historyIndex]!

  played.logs[0]!.reasonId = 'session-only mutation'
  assert.equal(currentSnapshot.logs[0]?.reasonId, 'finish-net')

  currentSnapshot.logs[0]!.reasonId = 'snapshot-only mutation'
  assert.equal(played.logs[0]?.reasonId, 'session-only mutation')
})

test('Start Over ignores an exact-start override, generates anew, and has no reset counter', () => {
  const deps = createDeps({
    fens: [SECOND_START_FEN],
    times: [1_000, 1_500, 3_000],
    randoms: [0],
  })
  let session = createMateSession(
    {
      mateId: 'rook',
      mode: 'train',
      startingFen: START_FEN,
    },
    deps,
  )
  session = playWhiteMove(session, 'Ra8+', deps)
  const restarted = startOverMateSession(session, deps)

  assert.equal(restarted.mode, 'train')
  assert.equal(restarted.startingFen, getChess(SECOND_START_FEN).fen())
  assert.deepEqual(restarted.logs, [])
  assert.equal(restarted.historyIndex, 0)
  assert.equal(restarted.history.length, 1)
  assert.equal(restarted.startedAtMs, 3_000)
  assert.equal('resetCount' in restarted, false)
  assertCurrentSnapshot(restarted)
})

test('Play Best uniformly chooses among the current ideal White moves', () => {
  const deps = createDeps({
    times: [1_000, 1_250],
    randoms: [0.75, 0],
  })
  const initial = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  const session = playBestMateMove(initial, deps)

  assert.equal(session.logs[0]?.san, 'Rh2+')
  assert.equal(session.logs[0]?.isCorrect, true)
})

test('historical White replacement truncates the line, preserves timing, and keeps a legal Black reply', () => {
  const deps = createDeps({
    times: [1_000, 1_400, 2_000, 3_000],
    randoms: [0, 0],
  })
  let session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  session = playWhiteMove(session, 'Ra3', deps)
  session = playWhiteMove(session, whiteMoves(session.fen)[0]!, deps)
  const originalDuration = session.logs[0]!.durationMs

  const replaced = replaceHistoricalWhiteMove(
    session,
    0,
    'Ra8+',
    deps,
  )

  assert.equal(replaced.logs.length, 1)
  assert.equal(replaced.logs[0]?.san, 'Ra8+')
  assert.equal(replaced.logs[0]?.opponentSan, 'Kh7')
  assert.equal(replaced.logs[0]?.durationMs, originalDuration)
  assert.equal(replaced.logs[0]?.isCorrect, true)
  assert.equal(replaced.historyIndex, 3)
  assert.equal(replaced.history.length, 4)
  const restored = undoMateMove(replaced)
  assert.deepEqual(restored.logs, session.logs)
  assert.equal(restored.fen, session.fen)
  assertCurrentSnapshot(replaced)
})

test('historical White replacement chooses an ideal reply when the old reply is illegal', () => {
  const deps = createDeps({
    times: [1_000, 1_400, 2_000],
    randoms: [0, 0.75],
  })
  let session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  session = playWhiteMove(session, 'Ra3', deps)

  const replaced = replaceHistoricalWhiteMove(
    session,
    0,
    'Rh2+',
    deps,
  )

  assert.equal(replaced.logs[0]?.opponentSan, 'Kg8')
  assert.equal(replaced.logs[0]?.idealOpponentChoices, 2)
  assert.equal(replaced.logs[0]?.legalOpponentChoices, 2)
})

test('historical Black replacement accepts any legal reply and truncates later turns', () => {
  const deps = createDeps({
    times: [1_000, 1_400, 2_000, 3_000],
    randoms: [0, 0],
  })
  let session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  session = playWhiteMove(session, 'Ra3', deps)
  session = playWhiteMove(session, whiteMoves(session.fen)[0]!, deps)
  const originalDuration = session.logs[0]!.durationMs

  const replaced = replaceHistoricalBlackMove(
    session,
    0,
    'Kg8',
    deps,
  )

  assert.equal(replaced.logs.length, 1)
  assert.equal(replaced.logs[0]?.opponentSan, 'Kg8')
  assert.equal(replaced.logs[0]?.durationMs, originalDuration)
  assert.equal(replaced.logs[0]?.idealOpponentChoices, 2)
  assert.equal(replaced.logs[0]?.legalOpponentChoices, 3)
  assert.equal(replaced.historyIndex, 3)
  assert.equal(replaced.history.length, 4)
  assert.deepEqual(undoMateMove(replaced).logs, session.logs)
  assertCurrentSnapshot(replaced)
})

test('passes the prior White-turn FEN to Black reply selection', () => {
  const seenPreviousFens: Array<string | undefined> = []
  const ruleSet = createRuleSet({
    blackCandidates: (fen, previousTurnFen) => {
      seenPreviousFens.push(previousTurnFen)
      const moves = getChess(fen).moves()
      return { moves, idealMoves: moves.slice(0, 1) }
    },
  })
  const deps = createDeps({
    times: [1_000, 1_100, 1_200],
    randoms: [0, 0],
    ruleSet,
  })
  let session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  session = playWhiteMove(session, 'Ra3', deps)
  session = playWhiteMove(session, whiteMoves(session.fen)[0]!, deps)

  assert.deepEqual(seenPreviousFens, [undefined, getChess(START_FEN).fen()])
})

test('recognizes terminal outcomes and freezes the finish timestamp', () => {
  const mateFen = '7k/5K2/8/8/8/8/R7/8 w - - 0 1'
  const mateRules = createRuleSet({
    whiteMoves,
    idealWhiteMoves: () => ['Rh2#'],
    explainWhiteMove: () => finishRule,
  })
  const deps = createDeps({
    fens: [mateFen],
    times: [1_000, 1_700],
    randoms: [],
    ruleSet: mateRules,
  })
  const initial = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  const finished = playWhiteMove(initial, 'Rh2#', deps)

  assert.equal(finished.outcome, 'checkmate')
  assert.equal(finished.finishedAtMs, 1_700)
  assert.equal(finished.logs[0]?.opponentSan, undefined)
  assert.equal(playWhiteMove(finished, 'Kh6', deps), finished)
  assert.equal(getMateElapsedMs(finished, 99_000), 700)
  assertCurrentSnapshot(finished)

  const undone = undoMateMove(finished)
  assert.equal(undone.finishedAtMs, undefined)
  assert.equal(redoMateMove(undone).finishedAtMs, 1_700)
})

test('classifies stalemate, lost material, fifty-move, and KNN promotion outcomes', () => {
  assert.equal(
    getMateTerminalOutcome(
      'rook',
      '8/8/8/8/8/K7/1R6/k7 b - - 1 1',
    ),
    'stalemate',
  )
  assert.equal(
    getMateTerminalOutcome(
      'rook',
      '8/8/8/8/K7/8/k7/8 w - - 0 2',
    ),
    'lost-material',
  )
  assert.equal(
    getMateTerminalOutcome(
      'rook',
      '7k/8/8/8/8/R7/8/K7 b - - 100 1',
    ),
    'fifty-move',
  )
  assert.equal(
    getMateTerminalOutcome(
      'two-knights-pawn',
      '7k/8/8/8/8/1q6/8/K5NN w - - 0 2',
    ),
    'pawn-promoted',
  )
  assert.equal(
    getMateTerminalOutcome(
      'two-knights-pawn',
      '7k/8/8/8/8/8/p7/K6N w - - 0 2',
    ),
    'lost-knight',
  )
  assert.equal(
    getMateTerminalOutcome(
      'two-knights-pawn',
      '7k/8/8/8/8/8/8/K5NN w - - 0 2',
    ),
    'unsupported',
  )
})

test('terminal transitions can happen after White or the automatic Black reply', () => {
  const stalemateStart = '8/8/8/8/8/K7/R7/k7 w - - 0 1'
  const stalemateRules = createRuleSet({
    idealWhiteMoves: () => ['Rb2'],
    explainWhiteMove: () => finishRule,
  })
  const stalemateDeps = createDeps({
    fens: [stalemateStart],
    times: [100, 200],
    randoms: [],
    ruleSet: stalemateRules,
  })
  const stalemate = playWhiteMove(
    createMateSession(
      { mateId: 'rook', mode: 'standard' },
      stalemateDeps,
    ),
    'Rb2',
    stalemateDeps,
  )
  assert.equal(stalemate.outcome, 'stalemate')
  assert.equal(stalemate.finishedAtMs, 200)

  const captureRules = createRuleSet({
    idealWhiteMoves: () => ['Ka4+'],
    explainWhiteMove: () => finishRule,
    blackCandidates: () => ({
      moves: ['Kxa2'],
      idealMoves: ['Kxa2'],
    }),
  })
  const captureDeps = createDeps({
    fens: [stalemateStart],
    times: [300, 500],
    randoms: [0],
    ruleSet: captureRules,
  })
  const captured = playWhiteMove(
    createMateSession(
      { mateId: 'rook', mode: 'standard' },
      captureDeps,
    ),
    'Ka4+',
    captureDeps,
  )
  assert.equal(captured.logs[0]?.opponentSan, 'Kxa2')
  assert.equal(captured.outcome, 'lost-material')
  assert.equal(captured.finishedAtMs, 500)

  const fiftyFen = '7k/8/8/8/8/8/R7/K7 w - - 99 1'
  const fiftyRules = createRuleSet({
    idealWhiteMoves: () => ['Ra3'],
    explainWhiteMove: () => finishRule,
  })
  const fiftyDeps = createDeps({
    fens: [fiftyFen],
    times: [700, 900],
    randoms: [],
    ruleSet: fiftyRules,
  })
  const fifty = playWhiteMove(
    createMateSession(
      { mateId: 'rook', mode: 'standard' },
      fiftyDeps,
    ),
    'Ra3',
    fiftyDeps,
  )
  assert.equal(fifty.outcome, 'fifty-move')
  assert.equal(fifty.logs[0]?.opponentSan, undefined)
})

test('a terminal historical replacement uses its original move time and remains undoable', () => {
  const mateFen = '7k/5K2/8/8/8/8/R7/8 w - - 0 1'
  const rules = createRuleSet({
    idealWhiteMoves: () => ['Ra3', 'Rh2#'],
    explainWhiteMove: () => finishRule,
  })
  const deps = createDeps({
    fens: [mateFen],
    times: [1_000, 1_400],
    randoms: [0],
    ruleSet: rules,
  })
  let session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  session = playWhiteMove(session, 'Ra3', deps)
  const replaced = replaceHistoricalWhiteMove(
    session,
    0,
    'Rh2#',
    deps,
  )

  assert.equal(replaced.outcome, 'checkmate')
  assert.equal(replaced.finishedAtMs, 1_400)
  assert.equal(getMateElapsedMs(replaced, 50_000), 400)
  assert.deepEqual(undoMateMove(replaced).logs, session.logs)
  assert.equal(redoMateMove(undoMateMove(replaced)).finishedAtMs, 1_400)
})

test('historical White replacement rejects a legal nonideal move without consuming dependencies', () => {
  const deps = createDeps({
    times: [1_000, 1_100],
    randoms: [0],
  })
  let session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )
  session = playWhiteMove(session, 'Ra3', deps)

  assert.equal(
    replaceHistoricalWhiteMove(session, 0, 'Ra4', deps),
    session,
  )
})

test('a rule gap leaves explicit play available while Play Best remains a no-op', () => {
  const rules = createRuleSet({ idealWhiteMoves: () => [] })
  const deps = createDeps({
    times: [1_000, 1_100],
    randoms: [0],
    ruleSet: rules,
  })
  const session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )

  assert.equal(playBestMateMove(session, deps), session)
  const played = playWhiteMove(session, 'Ra3', deps)
  assert.equal(played.logs[0]?.san, 'Ra3')
  assert.equal(played.logs[0]?.isCorrect, false)
  assert.equal(played.logs[0]?.correctChoices, 0)
  assert.equal(played.logs[0]?.reasonId, 'no-preferred-rule')
})

test('a Black rule gap falls back uniformly to a legal reply without inventing an ideal count', () => {
  const rules = createRuleSet({
    blackCandidates: (fen) => ({
      moves: getChess(fen).moves(),
      idealMoves: [],
    }),
  })
  const deps = createDeps({
    times: [1_000, 1_100],
    randoms: [0.75],
    ruleSet: rules,
  })
  const session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )

  const played = playWhiteMove(session, 'Ra3', deps)
  assert.equal(played.logs[0]?.opponentSan, 'Kg8')
  assert.equal(played.logs[0]?.idealOpponentChoices, 0)
  assert.equal(played.logs[0]?.legalOpponentChoices, 3)
  assert.equal(getChess(played.fen).turn(), 'w')
})

test('uses a stable empty-safe reason when no evaluator priority differs', () => {
  const rules = createRuleSet({
    idealWhiteMoves: () => ['Ra8+'],
    explainWhiteMove: () => undefined,
    currentWhiteHint: () => undefined,
  })
  const deps = createDeps({
    times: [1_000, 1_100],
    randoms: [0],
    ruleSet: rules,
  })
  const session = playWhiteMove(
    createMateSession(
      { mateId: 'rook', mode: 'standard' },
      deps,
    ),
    'Ra8+',
    deps,
  )

  assert.equal(session.logs[0]?.reasonId, 'no-preferred-rule')
})

test('the injected reducer composes with all five production rule sets', () => {
  for (const entry of MATE_CATALOG) {
    let now = 0
    const deps: MateSessionDeps = {
      now: () => {
        now += 100
        return now
      },
      random: () => 0,
      generatePosition: () => entry.standardFallbackFen,
      getRuleSet: getMateRuleSet,
    }
    const initial = createMateSession(
      { mateId: entry.id, mode: 'standard' },
      deps,
    )
    const played = playBestMateMove(initial, deps)

    assert.equal(played.logs.length, 1, entry.id)
    assert.equal(played.logs[0]?.isCorrect, true, entry.id)
    assert.equal(getChess(played.fen).turn(), 'w', entry.id)
    assertCurrentSnapshot(played)
  }
})

test('invalid moves and out-of-range history replacements are no-ops', () => {
  const deps = createDeps({ times: [1_000] })
  const session = createMateSession(
    { mateId: 'rook', mode: 'standard' },
    deps,
  )

  assert.equal(playWhiteMove(session, 'not-a-move', deps), session)
  assert.equal(
    replaceHistoricalWhiteMove(session, 0, 'Ra8+', deps),
    session,
  )
  assert.equal(
    replaceHistoricalBlackMove(session, 0, 'Kh7', deps),
    session,
  )
})
