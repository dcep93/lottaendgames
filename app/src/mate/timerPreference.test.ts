import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MATE_TIMER_PREFERENCE_KEY,
  readMateTimerPreference,
  writeMateTimerPreference,
} from './timerPreference'

test('timer preference defaults to visible for missing and invalid values', () => {
  for (const value of [null, '', 'TRUE', '0', 'hidden']) {
    assert.equal(
      readMateTimerPreference({
        getItem: () => value,
        setItem: () => undefined,
      }),
      true,
    )
  }
})

test('timer preference restores exact stored boolean values', () => {
  const storage = (value: string) => ({
    getItem: (key: string) => {
      assert.equal(key, MATE_TIMER_PREFERENCE_KEY)
      return value
    },
    setItem: () => undefined,
  })

  assert.equal(readMateTimerPreference(storage('true')), true)
  assert.equal(readMateTimerPreference(storage('false')), false)
})

test('timer preference defaults to visible when storage cannot be read', () => {
  assert.equal(
    readMateTimerPreference({
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => undefined,
    }),
    true,
  )
})

test('timer preference writes exact values and ignores unavailable storage', () => {
  const writes: Array<readonly [string, string]> = []
  const storage = {
    getItem: () => null,
    setItem: (key: string, value: string) => writes.push([key, value]),
  }

  writeMateTimerPreference(false, storage)
  writeMateTimerPreference(true, storage)
  assert.deepEqual(writes, [
    [MATE_TIMER_PREFERENCE_KEY, 'false'],
    [MATE_TIMER_PREFERENCE_KEY, 'true'],
  ])
  assert.doesNotThrow(() =>
    writeMateTimerPreference(true, {
      getItem: () => null,
      setItem: () => {
        throw new Error('full')
      },
    }),
  )
})
