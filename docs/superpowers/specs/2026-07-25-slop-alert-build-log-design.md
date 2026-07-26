# Slop Alert Build Log

## Goal

Make the Mate landing page identify the exact Git revision being served so a
user can immediately tell whether a deployment contains the latest updates.

## Presentation

Keep the `Slop Alert` heading. Directly below it, render a compact monospaced
build log with exactly six lines:

1. `commit` and the full 40-character SHA
2. `Author` and the author identity
3. `AuthorDate` and the authored timestamp
4. `Commit` and the committer identity
5. `CommitDate` and the committed timestamp
6. `Message` and the commit subject

Use a semantic `<pre><code>` block so whitespace and line breaks remain exact.
The block may scroll horizontally on very narrow screens rather than wrapping
or truncating the SHA. It belongs before the existing explanation and
`Choose a mating set` heading.

## Data Flow

At Vite startup/build time, run one read-only `git log -1` command in the
repository checkout and format the six fields above. Inject the resulting
string through `import.meta.env` so the rendered app contains the metadata of
the artifact that was actually built.

If Git is unavailable or the checkout has no commit, inject
`Build metadata unavailable.` instead of failing startup or production build.
No runtime network request or server endpoint is needed.

## Verification

- Unit-test that the landing page renders the injected log between `Slop
  Alert` and the explanatory copy.
- Assert that the production build contains a full SHA, timestamps, and commit
  subject.
- Verify the block is readable without page-level horizontal overflow at a
  narrow viewport.
- Run lint and the production build.
