/** Audits must use the same packed policy as the browser, never an unloaded fallback. */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import data from '../../app/src/mate/rules/bishopKnightSetupData.json';
import {installBishopKnightSetup} from '../../app/src/mate/rules/bishopKnightSetup';
const root=process.env.AUDIT_REPO_ROOT ?? fileURLToPath(new URL('../../',import.meta.url));
const bytes=readFileSync(resolve(root,'app/public'+data.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'),data.sha256);
installBishopKnightSetup(Uint8Array.from(bytes).buffer);
