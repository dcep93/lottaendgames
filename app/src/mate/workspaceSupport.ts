import type { Square } from 'chess.js'
import { getChess } from './chess'
import type { RegisteredMateRuleSet } from './rules'
import type {
  MateLogEntry,
  MateSession,
} from './session'
import { encodeMateFen } from './share'
import type { MateId, MateMode } from './types'

const SHORTCUT_EXCLUSION_SELECTOR = [
  'input',
  'select',
  'textarea',
  'button',
  'a',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="application"]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="dialog"]',
  '[role="grid"]',
  '[role="gridcell"]',
  '[role="link"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="menubar"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="radiogroup"]',
  '[role="scrollbar"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="tablist"]',
  '[role="textbox"]',
  '[role="toolbar"]',
  '[role="tree"]',
  '[role="treegrid"]',
  '[role="treeitem"]',
  '.leg-mate-board-shell',
].join(', ')

export function getBlackReplyChoices(
  session: MateSession,
  logIndex: number,
  ruleSet: RegisteredMateRuleSet,
  idealOnly: boolean,
): readonly string[] | undefined {
  const log = session.logs[logIndex]
  if (log === undefined) return undefined

  try {
    const chess = getChess(log.fen)
    if (chess.move(log.san) === null) return undefined
    const candidates = ruleSet.blackCandidates(
      chess.fen(),
      session.logs[logIndex - 1]?.fen,
    )
    return idealOnly ? candidates.idealMoves : candidates.moves
  } catch {
    return undefined
  }
}

export function nextCycledMove(
  choices: readonly string[],
  current: string | undefined,
): string | undefined {
  if (choices.length === 0) return undefined
  const currentIndex = current === undefined ? -1 : choices.indexOf(current)
  return choices[(currentIndex + 1) % choices.length]
}

export function getLastMateMove(
  logs: readonly MateLogEntry[],
): readonly [Square, Square] | null {
  const log = logs.at(-1)
  if (log === undefined) return null

  try {
    const chess = getChess(log.fen)
    const whiteMove = chess.move(log.san)
    if (whiteMove === null) return null
    let lastMove: readonly [Square, Square] = [
      whiteMove.from,
      whiteMove.to,
    ]
    if (log.opponentSan !== undefined) {
      const blackMove = chess.move(log.opponentSan)
      if (blackMove === null) return lastMove
      lastMove = [blackMove.from, blackMove.to]
    }
    return lastMove
  } catch {
    return null
  }
}

export function getCurrentPhase(
  ruleSet: RegisteredMateRuleSet,
  session: MateSession,
): string {
  try {
    return ruleSet.phase(session.fen)
  } catch {
    return session.logs.at(-1)?.phase ?? '—'
  }
}

export function canAcceptWhiteMove(session: MateSession): boolean {
  if (session.outcome !== undefined) return false
  try {
    return getChess(session.fen).turn() === 'w'
  } catch {
    return false
  }
}

export function hasPreferredWhiteMove(
  ruleSet: RegisteredMateRuleSet,
  fen: string,
): boolean {
  try {
    return ruleSet.idealWhiteMoves(fen).length > 0
  } catch {
    return false
  }
}

export function shouldIgnoreMateShortcut(target: EventTarget | null): boolean {
  if (target === null || typeof target !== 'object') return false
  const candidate = target as {
    readonly isContentEditable?: boolean
    readonly tagName?: string
    closest?: (selector: string) => unknown
  }
  if (candidate.isContentEditable === true) return true
  const tagName = candidate.tagName?.toLowerCase()
  if (
    tagName === 'input' ||
    tagName === 'select' ||
    tagName === 'textarea' ||
    tagName === 'button' ||
    tagName === 'a'
  ) {
    return true
  }
  try {
    return candidate.closest?.(SHORTCUT_EXCLUSION_SELECTOR) != null
  } catch {
    return false
  }
}

export function releasePointerButtonFocus(
  detail: number,
  target: EventTarget | null,
): void {
  if (detail <= 0 || target === null || typeof target !== 'object') return
  const candidate = target as {
    blur?: () => void
    closest?: (selector: string) => unknown
    readonly tagName?: string
  }
  try {
    const button =
      candidate.tagName?.toLowerCase() === 'button'
        ? candidate
        : candidate.closest?.('button')
    if (
      button !== null &&
      typeof button === 'object' &&
      typeof (button as { blur?: unknown }).blur === 'function'
    ) {
      const blurrableButton = button as { blur: () => void }
      blurrableButton.blur()
    }
  } catch {
    // A non-DOM or detached event target cannot retain actionable focus here.
  }
}

export function exactMateHref(
  mateId: MateId,
  mode: MateMode,
  startingFen: string,
): string {
  const path = `/mate/${mateId}${mode === 'train' ? '/train' : ''}`
  const relativeHref = `${path}${encodeMateFen(startingFen)}`
  if (typeof document === 'undefined' || !document.baseURI) {
    return relativeHref
  }
  try {
    return new URL(relativeHref, document.baseURI).href
  } catch {
    return relativeHref
  }
}

export async function copyMateShareText(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to the synchronous browser fallback.
    }
  }

  if (
    typeof document === 'undefined' ||
    !document.body ||
    typeof document.createElement !== 'function'
  ) {
    return false
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.opacity = '0'
  textarea.style.position = 'fixed'
  textarea.style.pointerEvents = 'none'
  const previousFocus = document.activeElement

  try {
    document.body.append(textarea)
    textarea.focus()
    textarea.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
    if (
      typeof HTMLElement !== 'undefined' &&
      previousFocus instanceof HTMLElement
    ) {
      previousFocus.focus()
    }
  }
}
