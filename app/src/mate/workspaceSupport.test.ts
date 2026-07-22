import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCurrentPhase,
  liveMateHref,
  releaseFocusWithin,
  releasePointerButtonFocus,
} from './workspaceSupport'
import type { RegisteredMateRuleSet } from './rules'
import type { MateLogEntry, MateSession } from './session'

function phaseSession(
  fen: string,
  logs: readonly MateLogEntry[] = [],
): MateSession {
  return {
    mateId: 'rook',
    mode: 'standard',
    startingFen: fen,
    fen,
    logs: [...logs],
    history: [],
    historyIndex: 0,
    startedAtMs: 0,
  }
}

function phaseLog(phase: string): MateLogEntry {
  return {
    fen: '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1',
    san: 'Rb4',
    phase,
    isCorrect: true,
    correctChoices: 1,
    durationMs: 0,
    reasonId: 'establish box',
  }
}

function phaseRuleSet(
  phase: (fen: string) => string,
): RegisteredMateRuleSet {
  return { phase } as RegisteredMateRuleSet
}

test('Mate phase recalculates only when White is to move', () => {
  let calls = 0
  const ruleSet = phaseRuleSet(() => {
    calls += 1
    return '2/2'
  })

  assert.equal(
    getCurrentPhase(
      ruleSet,
      phaseSession(
        '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1',
        [phaseLog('1/2')],
      ),
    ),
    '2/2',
  )
  assert.equal(calls, 1)

  assert.equal(
    getCurrentPhase(
      ruleSet,
      phaseSession(
        '8/8/8/8/3k4/8/1R6/3K4 b - - 1 1',
        [phaseLog('2/2')],
      ),
    ),
    '2/2',
  )
  assert.equal(calls, 1)
})

test('Black-to-move Mate phase is unknown without a preceding White turn', () => {
  let calls = 0
  const ruleSet = phaseRuleSet(() => {
    calls += 1
    return '1/2'
  })

  assert.equal(
    getCurrentPhase(
      ruleSet,
      phaseSession('8/8/8/8/3k4/8/1R6/3K4 b - - 1 1'),
    ),
    '—',
  )
  assert.equal(calls, 0)
})

test('live Mate href stores only the current FEN', () => {
  assert.equal(
    liveMateHref(
      'rook',
      'standard',
      '8/8/8/8/3k4/8/1R6/3K4 w - - 0 1',
    ),
    '/mate/rook#live=8/8/8/8/3k4/8/1R6/3K4_w_-_-_0_1',
  )
  assert.equal(
    liveMateHref(
      'queen',
      'train',
      '8/8/8/8/4k3/8/8/3QK3 w - - 4 3',
    ),
    '/mate/queen/train#live=8/8/8/8/4k3/8/8/3QK3_w_-_-_4_3',
  )
})

test('pointer-clicked Mate buttons release focus without affecting keyboard activation', () => {
  let directBlurs = 0
  const directButton = {
    blur: () => {
      directBlurs += 1
    },
    tagName: 'BUTTON',
  }
  releasePointerButtonFocus(1, directButton as unknown as EventTarget)
  assert.equal(directBlurs, 1)

  releasePointerButtonFocus(0, directButton as unknown as EventTarget)
  assert.equal(directBlurs, 1)

  let nestedBlurs = 0
  const nestedButton = {
    blur: () => {
      nestedBlurs += 1
    },
  }
  const nestedTarget = {
    closest: (selector: string) => {
      assert.equal(selector, 'button')
      return nestedButton
    },
    tagName: 'SPAN',
  }
  releasePointerButtonFocus(1, nestedTarget as unknown as EventTarget)
  assert.equal(nestedBlurs, 1)

  assert.doesNotThrow(() =>
    releasePointerButtonFocus(1, {
      closest: () => {
        throw new Error('detached')
      },
      tagName: 'SVG',
    } as unknown as EventTarget),
  )
  releasePointerButtonFocus(1, { tagName: 'DIV' } as unknown as EventTarget)
  releasePointerButtonFocus(1, null)
})

test('Mate board focus release is scoped to focused descendants', () => {
  let blurs = 0
  const focusedBoardChild = {
    blur: () => {
      blurs += 1
    },
  } as unknown as Element
  const outsideElement = {
    blur: () => {
      blurs += 10
    },
  } as unknown as Element
  const board = {
    contains: (candidate: Node | null) => candidate === focusedBoardChild,
  } as Pick<HTMLElement, 'contains'>

  releaseFocusWithin(board, focusedBoardChild)
  assert.equal(blurs, 1)

  releaseFocusWithin(board, outsideElement)
  releaseFocusWithin(null, focusedBoardChild)
  releaseFocusWithin(board, null)
  assert.equal(blurs, 1)

  assert.doesNotThrow(() =>
    releaseFocusWithin(
      {
        contains: () => {
          throw new Error('detached')
        },
      } as unknown as Pick<HTMLElement, 'contains'>,
      focusedBoardChild,
    ),
  )
  assert.doesNotThrow(() =>
    releaseFocusWithin(
      { contains: () => true } as unknown as Pick<HTMLElement, 'contains'>,
      {} as Element,
    ),
  )
})
