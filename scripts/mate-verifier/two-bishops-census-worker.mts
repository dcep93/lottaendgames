import { createProductionMateAdapter } from './production.mts'

export type CensusExpansion = {
  id: number
  children: string[]
  failure: boolean
  matePlies: number
  whiteChoices: number
  blackReplies: number
  counts: Readonly<Record<string, number>>
}

const adapter = createProductionMateAdapter('two-bishops')
process.on('message', (batch: { id: number; key: string }[]) => {
  const results: CensusExpansion[] = batch.map(({ id, key }) => {
    const expansion = adapter.expand(`${key} 0 1`)
    const children = new Set<string>()
    let failure = expansion.whiteChoices === 0 || expansion.branches.length === 0
    let matePlies = 0
    for (const branch of expansion.branches) {
      if (branch.kind === 'failure') {
        failure = true
      } else {
        if (branch.resetsHalfmoveClock.some(Boolean)) {
          throw new Error('KBBK census does not support a non-failing clock reset')
        }
        if (branch.kind === 'mate') {
          if (branch.moves.length !== 1) throw new Error('Expected White mate in one ply')
          matePlies = 1
        } else {
          if (branch.moves.length !== 2) throw new Error('Expected two-ply continuation')
          children.add(adapter.key(branch.next))
        }
      }
    }
    return { id, children: [...children], failure, matePlies,
      whiteChoices: expansion.whiteChoices, blackReplies: expansion.blackReplies,
      counts: expansion.ruleFilterCounts ?? {} }
  })
  process.send!(results)
})
