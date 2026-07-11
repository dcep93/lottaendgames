import shaXRaw from './sha_x.json?raw'

export type ShaX = {
  git_log: string
  time: string
}

export function getShaX(): ShaX {
  try {
    return JSON.parse(shaXRaw) as ShaX
  } catch {
    return { git_log: '', time: '' }
  }
}
