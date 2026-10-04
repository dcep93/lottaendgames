import assert from 'node:assert/strict'
import test from 'node:test'
import {measureRuleRelevance} from './rule-relevance.mts'
import type {OrderedRule} from '../../app/src/mate/rules/types.ts'
const candidates = [{san: 'A', score: 0}, {san: 'B', score: 1}, {san: 'C', score: 2}]
const low: OrderedRule<number> = {id: 'first', shortLabel: 'first', compare: (a,b) => a-b}

test('a later rule that excludes the same moves makes the earlier filter redundant', () => {
 const result = measureRuleRelevance(candidates,[low,{...low,id:'later'}])
 assert.deepEqual(result.winners,['A'])
 assert.deepEqual(result.filtering,['first'])
 assert.equal(result.relevant.size,0)
})
test('a rule is relevant when later rules would prefer its discarded move', () => {
 const result = measureRuleRelevance(candidates,[low,{...low,id:'later',compare:(a,b)=>b-a}])
 assert.deepEqual([...result.relevant],[['first',['C']]])
})
test('retains earlier filters, conditional applicability, and multi-part rule behavior', () => {
 const rules: OrderedRule<number>[] = [
  {id:'guard',shortLabel:'guard',compare:(a,b)=>Number(a===2)-Number(b===2)},
  {id:'conditional',shortLabel:'conditional',applies:n=>n<2,subpriorities:[{compare:()=>0},{compare:(a,b)=>a-b}]},
 ]
 const result=measureRuleRelevance(candidates,rules)
 assert.deepEqual(result.winners,['A'])
 assert.deepEqual([...result.relevant],[['guard',['C']],['conditional',['B']]])
})
