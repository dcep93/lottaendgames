import assert from 'node:assert/strict'
import test from 'node:test'
import { trackBookReadingPosition } from './bookReadingPosition'
import { resolveAppRoute } from '../routing'

test('scroll bookmarks advance only after all ending content is above the viewport', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const listeners = new Set<() => void>()
  const viewport = {
    scrollY: 0,
    innerHeight: 600,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: viewport })
  const block = (top: number, bottom: number) => ({
    getBoundingClientRect: () => ({ top: top - viewport.scrollY, bottom: bottom - viewport.scrollY }),
  })
  const headings = [
    { ...block(800, 850), id: 'e1', previousElementSibling: null },
    { ...block(2000, 2050), id: 'e2', previousElementSibling: block(1500, 1980) },
    { ...block(3000, 3050), id: 'e3', previousElementSibling: block(2500, 2980) },
  ]
  const chapter = {
    querySelectorAll: () => headings,
    lastElementChild: block(3500, 3980),
  } as unknown as HTMLElement
  const recorded: Array<string | null> = []
  const scroll = (y: number) => {
    viewport.scrollY = y
    listeners.forEach(listener => listener())
  }
  let stop: (() => void) | undefined
  try {
    // Start after navigation has restored an explicit position link.
    viewport.scrollY = 1200
    stop = trackBookReadingPosition(chapter, anchor => recorded.push(anchor))
    scroll(1200)
    assert.deepEqual(recorded, [], 'restoration must preserve a position deep link')
    scroll(1250)
    assert.deepEqual(recorded, ['e1'], 'heading is gone but ending content remains')
    scroll(1979)
    assert.deepEqual(recorded, ['e1'], 'next ending is visible but current content remains')
    scroll(1980)
    assert.deepEqual(recorded, ['e1', 'e2'], 'advance when the last content leaves')
    assert.deepEqual(resolveAppRoute('/book/chapter1', `#${recorded.at(-1)}`).route, {
      module: 'book', chapterId: '1', anchorId: 'e2',
    })
    scroll(4100)
    assert.equal(recorded.at(-1), 'e3', 'retain the final ending at chapter bottom')
    scroll(1500)
    assert.equal(recorded.at(-1), 'e1', 'scrolling upward restores earlier endings')
    scroll(0)
    assert.equal(recorded.at(-1), null, 'chapter introduction clears the ending bookmark')
    stop()
    assert.equal(listeners.size, 0)
    const count = recorded.length
    scroll(3000)
    assert.equal(recorded.length, count, 'old chapter cannot overwrite the new route')
    const stopEmpty = trackBookReadingPosition({
      querySelectorAll: () => [],
    } as unknown as HTMLElement, () => assert.fail('no endings to bookmark'))
    assert.equal(listeners.size, 0)
    stopEmpty()
  } finally {
    stop?.()
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
