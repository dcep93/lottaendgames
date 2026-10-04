import {selectCandidatesByRules} from '../../app/src/mate/rules/selection.ts'
import type {OrderedRule, ScoredMove} from '../../app/src/mate/rules/types.ts'

/** A rule matters when omitting it lets a previously excluded move survive. */
export function measureRuleRelevance<Score>(candidates: readonly ScoredMove<Score>[], rules: readonly OrderedRule<Score>[]) {
  const full = selectCandidatesByRules(candidates, rules)
  const winners = new Set(full.idealCandidates.map(candidate => candidate.san))
  const filtering = new Set(full.eliminatedBy.values())
  const relevant = new Map<string, string[]>()
  for (const rule of filtering) {
    const without = selectCandidatesByRules(candidates, rules.filter(other => other !== rule))
    const restored = without.idealCandidates.filter(candidate => !winners.has(candidate.san)).map(candidate => candidate.san)
    if (restored.length) relevant.set(rule.id, restored)
  }
  return {winners: [...winners], filtering: [...filtering].map(rule => rule.id), relevant}
}
