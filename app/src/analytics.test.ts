import assert from 'node:assert/strict'
import test from 'node:test'
import { analyticsUrl, createAnalytics } from './analytics'

function fixture(overrides: Partial<Parameters<typeof createAnalytics>[0]> = {}) {
  const calls: unknown[][] = []
  let loads = 0
  const analytics = createAnalytics({
    measurementId: 'G-TEST123',
    enabled: true,
    initialUrl: 'https://lottaendgames.com/mate/queen?utm_source=club&email=private#live=private',
    referrer: 'https://example.com/post?private=value#private',
    send: (...args) => { calls.push(args) },
    load: () => { loads++ },
    ...overrides,
  })
  return { analytics, calls, loads: () => loads }
}

test('page views deduplicate React effects and board hashes while recording navigation and campaigns', () => {
  const { analytics, calls, loads } = fixture()
  analytics.page('/mate/queen#live=first', 'Queen')
  analytics.page('/mate/queen#live=second', 'Queen')
  analytics.page('/mate/rook', 'Rook')
  analytics.page('/mate/queen', 'Queen')
  assert.equal(loads(), 1)
  const views = calls.filter(call => call[0] === 'event')
  assert.equal(views.length, 3)
  assert.deepEqual(views[0], ['event', 'page_view', {
    page_location: 'https://lottaendgames.com/mate/queen?utm_source=club',
    page_referrer: 'https://example.com/post', page_title: 'Queen',
  }])
  assert.deepEqual(views[1], ['event', 'page_view', {
    page_location: 'https://lottaendgames.com/mate/rook',
    page_referrer: 'https://lottaendgames.com/mate/queen', page_title: 'Rook',
  }])
  assert.ok(!JSON.stringify(calls).includes('private'))
  const config = calls.find(call => call[0] === 'config')![2] as Record<string, unknown>
  assert.equal(config.send_page_view, false)
  assert.equal(config.allow_google_signals, false)
})

test('development, missing IDs, and localhost never load a tag or send events', () => {
  for (const overrides of [
    { enabled: false }, { measurementId: '' }, { measurementId: 'invalid' },
    ...['localhost', '127.0.0.1', '[::1]', 'preview.localhost'].map(host => ({ initialUrl: `http://${host}:5173/mate` })),
  ]) {
    const { analytics, calls, loads } = fixture(overrides)
    analytics.page('/mate', 'Mate')
    analytics.event('training_started', { mating_set: 'queen' })
    assert.equal(loads(), 0)
    assert.deepEqual(calls, [])
  }
})

test('custom events use the current sanitized page and blocked analytics cannot throw', () => {
  const { analytics, calls } = fixture()
  analytics.page('/mate/rook#fen=secret', 'Rook')
  analytics.event('training_started', { mating_set: 'rook' })
  assert.equal((calls.at(-1)![2] as Record<string, unknown>).page_location, 'https://lottaendgames.com/mate/rook?utm_source=club')
  const blocked = fixture({ send: () => { throw new Error('blocked') }, load: () => { throw new Error('blocked') } }).analytics
  assert.doesNotThrow(() => {
    blocked.page('/mate', 'Mate')
    blocked.event('training_started', {})
  })
  assert.equal(analyticsUrl(''), '')
})
