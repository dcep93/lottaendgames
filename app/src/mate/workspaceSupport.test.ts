import assert from 'node:assert/strict'
import test from 'node:test'
import {
  liveMateHref,
  releasePointerButtonFocus,
} from './workspaceSupport'

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
