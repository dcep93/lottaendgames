import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildGitLog = readBuildGitLog()

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_GIT_LOG': JSON.stringify(buildGitLog),
  },
  plugins: [react()],
})

function readBuildGitLog(): string {
  try {
    return execFileSync(
      'git',
      [
        'log',
        '-1',
        '--format=commit %H%nAuthor: %an <%ae>%nAuthorDate: %aI%nCommit: %cn <%ce>%nCommitDate: %cI%nMessage: %s',
      ],
      {
        cwd: new URL('..', import.meta.url),
        encoding: 'utf8',
      },
    ).trim()
  } catch {
    return 'Build metadata unavailable.'
  }
}
