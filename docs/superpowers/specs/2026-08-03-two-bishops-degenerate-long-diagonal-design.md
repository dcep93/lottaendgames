# Two Bishops Degenerate Long Diagonal

## Goal

Repair the supplied Phase 2 loop position by moving the `f2` bishop onto the long side of its `a7–g1` diagonal. All five long-side destinations must remain equally correct.

## Canonical Geometry

- White king: `f3`.
- Repair bishop: `f2`.
- Black king: `h1` or `h2`.
- Other bishop: any square on `g4–c8` with a clear line to `h3` (`g4`, `f5`, `e6`, `d7`, or `c8`).
- Allowed repair destinations: `e3`, `d4`, `c5`, `b6`, and `a7`.
- Excluded short-side destination: `g1`.

Apply all D4 rotations and reflections to the complete geometry. Do not accept translations or nearby arrangements.

## Selection Behavior

Add the family to the existing visible `degenerate` priority with reason `degenerate — long diagonal`. Universal mate, bishop-safety, and stalemate priorities continue to run first.

For this family only, once the degenerate priority has retained the five allowed bishop moves, stop processing later strategic priorities. This prevents `sequester`, `bishops off edge`, and later rules from splitting the requested five-way tie. Other degenerate families retain their current downstream behavior.

Represent the repair as a source bishop plus an allowed destination set rather than a hidden override or five position-specific branches.

## Presentation

Add a `degenerate — long diagonal` diagram using the supplied position. Highlight `e3`, `d4`, `c5`, `b6`, and `a7`; the absence of a `g1` highlight communicates the excluded short side.

## Verification

- Assert the canonical position recommends exactly `Be3`, `Bd4`, `Bc5`, `Bb6`, and `Ba7`.
- Cover both Black king squares and all five clear `h3`-controlling bishop squares.
- Cover all distinct D4 transforms and transformed destination sets.
- Reject translations, blocked control of `h3`, wrong king squares, and `Bg1`.
- Verify the specific reason and diagram highlights.
- Preserve semantic alignment checks and all existing degenerate regressions.
- Run focused Two Bishops tests, affected presentation tests, diagram validation, TypeScript, and diff checks.
- Run the fail-first Two Bishops loop gate and validate one refreshable localhost loop.

## Non-goals

- No change to other rule meanings.
- No full mate suite, exhaustive search, commit, push, or deployment.
