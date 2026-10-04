import assert from 'node:assert/strict'
import test from 'node:test'
import { createTrainingAnalytics } from './analytics'
import { createMateSession, playWhiteMove, redoMateMove, startOverMateSession, undoMateMove } from './session'
import { getMateRuleSet } from './rules'
import type { AnalyticsEvent, AnalyticsParameters } from '../analytics'

const fen = '7k/8/6K1/8/8/8/8/R7 w - - 0 1'
const deps = { now: () => 1000, random: () => 0, generatePosition: () => fen, getRuleSet: getMateRuleSet }
const start = () => createMateSession({ mateId: 'rook', mode: 'train', startingFen: fen }, deps)

test('a real mate records one start and completion, with no duplicate from undo, redo, or re-mating', () => {
  const events: [AnalyticsEvent, AnalyticsParameters][] = []
  const track = createTrainingAnalytics(false, (name, properties) => { events.push([name, properties]) })
  const initial = start()
  track(initial, initial, 'play')
  assert.equal(events.length, 0)
  const finished = playWhiteMove(initial, 'Ra8#', deps)
  assert.equal(finished.outcome, 'checkmate')
  track(initial, finished, 'play')
  assert.deepEqual(events, [
    ['training_started', { mating_set: 'rook', training_style: 'training_wheels' }],
    ['training_completed', { mating_set: 'rook', training_style: 'training_wheels', duration_seconds: 0, white_moves: 1, used_play_best: false }],
  ])
  const undone = undoMateMove(finished)
  track(finished, undone, 'review')
  track(undone, redoMateMove(undone), 'review')
  track(undone, playWhiteMove(undone, 'Ra8#', deps), 'play')
  assert.equal(events.length, 2)
  const restarted = startOverMateSession(finished, deps)
  track(finished, restarted, 'restart')
  track(restarted, playWhiteMove(restarted, 'Ra8#', deps), 'play_best')
  assert.equal(events.length, 4)
  assert.equal(events[3]![1].used_play_best, true)
  assert.ok(!JSON.stringify(events).includes(fen))
})

test('imported replays are excluded until a fresh game starts', () => {
  const events: AnalyticsEvent[] = []
  const track = createTrainingAnalytics(true, name => { events.push(name) })
  const initial = start()
  const finished = playWhiteMove(initial, 'Ra8#', deps)
  track(initial, finished, 'review')
  track(initial, finished, 'play')
  assert.deepEqual(events, [])
  track(finished, initial, 'restart')
  track(initial, finished, 'play')
  assert.deepEqual(events, ['training_started', 'training_completed'])
})

test('completion preserves elapsed time even when the display is hidden', () => {
  const events: AnalyticsParameters[] = []
  const track = createTrainingAnalytics(false, (_, properties) => { events.push(properties) })
  const initial = start()
  const finished = playWhiteMove(initial, 'Ra8#', deps)
  track(initial, { ...finished, startedAtMs: 1000, finishedAtMs: 13500 }, 'play')
  assert.equal(events[1]!.duration_seconds, 12.5)
})
