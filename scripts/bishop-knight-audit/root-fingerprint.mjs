import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { build } = require('esbuild');

// Strip only the audit IPC entry point, then let esbuild retain the root
// function's transitive dependencies. White-policy-only code is discarded.
// A cache miss is harmless; equality requires identical executable root code.
export async function rootFingerprint(workerSource) {
  const marker = 'process.on("message",';
  const offset = workerSource.lastIndexOf(marker);
  if (offset < 0 || workerSource.indexOf(marker) !== offset) {
    throw new Error('Cannot identify the unique audit-worker IPC entry point');
  }
  const result = await build({
    stdin: { contents: workerSource.slice(0, offset) + '\nexport { root };', loader: 'js' },
    bundle: true, treeShaking: true, minify: true, platform: 'node',
    format: 'esm', write: false,
  });
  return createHash('sha256').update(result.outputFiles[0].contents).digest('hex');
}
