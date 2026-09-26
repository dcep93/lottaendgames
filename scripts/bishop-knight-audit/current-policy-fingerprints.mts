import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from '../../app/node_modules/esbuild/lib/main.js';

// esbuild embeds paths relative to its working directory. The documented audit
// starts in app/, while the postprocessors start in the repository root. Accept
// an exact current-source bundle from either entry point, never a stale policy.
export async function currentPolicyFingerprints(): Promise<string[]> {
  const entry = fileURLToPath(new URL('./worker.mts', import.meta.url));
  const directories = ['../../', '../../app/'].map(path =>
    fileURLToPath(new URL(path, import.meta.url)));
  return Promise.all(directories.map(async absWorkingDir => {
    const bundle = await build({ absWorkingDir, entryPoints: [entry], bundle: true,
      platform: 'node', format: 'esm', write: false });
    return createHash('sha256').update(bundle.outputFiles[0]!.contents).digest('hex');
  }));
}
