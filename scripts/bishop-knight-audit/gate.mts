import { readFileSync, writeFileSync } from 'node:fs';
import { auditGate } from './population.mts';
const dir = process.env.AUDIT_DIR!;
const result = JSON.parse(readFileSync(dir + '/result.json', 'utf8'));
const gate = process.env.AUDIT_GATE!;
const passed = auditGate(result.counts, gate);
writeFileSync(dir + '/gate.json', JSON.stringify({ gate, passed, diagonal: result.diagonal,
    policyFingerprint: result.policyFingerprint, counts: result.counts }, null, 2));
console.log(`${gate} gate: ${passed ? 'PASS' : 'FAIL'}; ${result.counts.canLoop} starts can loop, ${result.counts.canFail} can lose a piece or stalemate.`);
if (!passed) process.exitCode = 2;
