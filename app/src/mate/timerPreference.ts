export const MATE_TIMER_PREFERENCE_KEY =
  'lottaendgames.mate.showTimer'

type MateTimerPreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readMateTimerPreference(
  storage: MateTimerPreferenceStorage | undefined = getTimerStorage(),
): boolean {
  if (storage === undefined) return true

  try {
    const value = storage.getItem(MATE_TIMER_PREFERENCE_KEY)
    if (value === 'false') return false
    return true
  } catch {
    return true
  }
}

export function writeMateTimerPreference(
  showTimer: boolean,
  storage: MateTimerPreferenceStorage | undefined = getTimerStorage(),
): void {
  if (storage === undefined) return

  try {
    storage.setItem(MATE_TIMER_PREFERENCE_KEY, String(showTimer))
  } catch {
    // The in-memory preference still applies when browser storage is unavailable.
  }
}

function getTimerStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
