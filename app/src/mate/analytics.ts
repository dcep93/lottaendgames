import { trackEvent, type AnalyticsEvent, type AnalyticsParameters } from '../analytics'
import type { MateSession } from './session'

export type TrainingAction = 'play' | 'play_best' | 'review' | 'restart'

export function createTrainingAnalytics(
  replay = false,
  send: (name: AnalyticsEvent, parameters: AnalyticsParameters) => void = trackEvent,
) {
  let started = false
  let completed = false
  let usedPlayBest = false
  return (previous: MateSession, next: MateSession, action: TrainingAction) => {
    if (previous === next) return
    if (action === 'restart') {
      replay = false
      started = completed = usedPlayBest = false
      return
    }
    if (replay || action === 'review') return
    usedPlayBest ||= action === 'play_best'
    const properties = { mating_set: next.mateId, training_style: next.mode === 'train' ? 'training_wheels' : 'standard' }
    if (!started) {
      started = true
      send('training_started', properties)
    }
    if (!completed && next.outcome === 'checkmate') {
      completed = true
      send('training_completed', {
        ...properties,
        duration_seconds: Math.max(0, ((next.finishedAtMs ?? 0) - (next.startedAtMs ?? next.finishedAtMs ?? 0)) / 1000),
        white_moves: next.logs.length,
        used_play_best: usedPlayBest,
      })
    }
  }
}
