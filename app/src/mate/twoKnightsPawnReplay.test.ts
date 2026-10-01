import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAppRoute } from '../routing'
import { decodeMateReplay, encodeMateReplay } from './share'
import { createMateReplaySession } from './session'
import { getMateRuleSet } from './rules'
import { getTwoKnightsPawnTerminalOutcome } from './rules/twoKnightsPawn'
import { twoKnightsPawnTableReady } from './rules/twoKnightsPawnTable'

const fen = 'k7/7p/8/5N2/8/4K3/8/6N1 w - - 0 1'
const moves = `
Kd4 Kb8 Nh6 Kc7 Ne2 Kd7 Nc3 Kc6 Ne4 Kb5 Kc3 Kc6 Kc4 Kd7 Ng5 Kc6 Ngf7 Kb6 Ne5 Ka5 Nd7 
Ka6 Kc5 Kb7 Nf6 Kc7 Nf5 h6 Nh5 Kd7 Nfg7 Kc7 Ne6+ Kd7 Kd5 Ke7 Nc5 Kf7 Ne4 Ke7 Nef6 Kf7 
Kd6 Kg6 Ke5 Kf7 Nf4 Ke7 N4d5+ Kd8 Kd6 Kc8 Kc6 Kd8 Ne4 Ke8 Kd6 Kd8 Nf4 Kc8 Nc5 h5 Nh3 
Kd8 Ne6+ Ke8 Nhg5 h4 Nh3 Kf7 Nd4 Kf6 Kd5 Kf7 Nf5 Kf6 Nd6 Ke7 Ne4 Kd7 Nf6+ Kc7 Kc5 Kb7 
Nd5 Ka6 Kb4 Ka7 Ka5 Kb8 Kb6 Kc8 Kc6 Kd8 Kd6 Kc8 Ne3 Kb7 Nc4 Kc8 Na5 Kb8 Kd7 Ka7 Kc6 
Kb8 Nc4 Kc8 Ne3 Kd8 Nd5 Ke8 Kd6 Kd8 Ne7 Ke8 Nc6 Kf8 Kd5 Kf7 Ke5 Kf8 Kf6 Ke8 Ke6 Kf8 
Na5 Kg8 Kf6 Kh8 Nc4 Kh7 Ne5 Kh6 Ke6 Kh7 Kf7 Kh6 Kf6 Kh5 Kf5 Kh6 Nd7 Kg7 Ke6 Kg8 Ke7 
Kh8 Kf7 Kh7 Nc5 Kh6 Kf6 Kh5 Kf5 Kh6 Ne6 Kh7 Kg5 Kg8 Kf6 Kh8 Nhg5 Kg8 Kg6 h3 Ne4 h2 
Nf6+ Kh8 Ng5 h1=R Nf7#
`.trim().split(/\s+/)

test('a cold two-knights replay survives routing and loads all 87 moves', async () => {
  assert.equal(twoKnightsPawnTableReady(), false)
  const hash = encodeMateReplay(fen, moves, 0)
  const cold = resolveAppRoute('/mate/two-knights-pawn', hash)
  assert.equal(cold.href, '/mate/two-knights-pawn' + hash)
  assert.deepEqual(cold.route, {
    module: 'mate', mateId: 'two-knights-pawn', mateMode: 'standard',
    sharedFen: fen, sharedMoves: moves, sharedReplayCursor: 0,
  })
  // Downloading recommendations must not change the meaning of a shared URL.
  await import('./rules/twoKnightsPawnTestSetup')
  assert.deepEqual(resolveAppRoute('/mate/two-knights-pawn', hash), cold)
  const session = createMateReplaySession({
    mateId: 'two-knights-pawn', mode: 'standard', startingFen: fen,
    moves, startAtBeginning: true,
  }, {now: () => 0, random: () => 0, generatePosition: () => fen, getRuleSet: getMateRuleSet})
  assert.equal(session.fen, fen)
  assert.equal(session.historyIndex, 0)
  assert.equal(session.history.length, 174)
  assert.equal(session.history.at(-1)?.outcome, 'checkmate')
  assert.equal(session.history.at(-1)?.logs.at(-1)?.san, 'Nf7#')
  assert.equal(session.history.at(-1)?.logs.length, 87)
  assert.equal(getTwoKnightsPawnTerminalOutcome('k7/7p/8/8/8/8/8/1NK3N1 w - - 0 1'), 'unsupported')
})

test('replay parsing still rejects illegal moves and play beyond terminal outcomes', () => {
  assert.equal(decodeMateReplay(encodeMateReplay(fen, ['Kd8', 'Kb8']), 'two-knights-pawn').ok, false)
  assert.equal(decodeMateReplay(encodeMateReplay(fen, [...moves, 'Kg8']), 'two-knights-pawn').ok, false)
  const clockFen = fen.replace('0 1', '99 1')
  assert.equal(decodeMateReplay(encodeMateReplay(clockFen, ['Kd4', 'Kb8']), 'two-knights-pawn').ok, false)
  const captureFen = '8/8/8/8/8/4K2p/4N1kN/8 b - - 0 1'
  assert.equal(decodeMateReplay(encodeMateReplay(captureFen, ['Kxh2', 'Kf3']), 'two-knights-pawn').ok, false)
})
