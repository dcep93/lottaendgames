import assert from 'node:assert/strict';
import test from 'node:test';
import {knightAndBishopWhiteRules} from './bishopKnight';

test('attacked-bishop retreat and old central-setup rules are removed',()=>{
 assert.ok(!knightAndBishopWhiteRules.some(rule=>rule.id==='r6.5'||rule.id==='r8'));
});
