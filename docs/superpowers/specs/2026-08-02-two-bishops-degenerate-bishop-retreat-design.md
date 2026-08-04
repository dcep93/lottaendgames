# Two Bishops Degenerate Bishop Retreat

## Goal

Teach the supplied Phase 2 position as a specific degenerate repair: move the bishop from f7 to e8. Recognize only the exact board position and its D4 rotations and reflections.

## Behavior

- Canonical position: `5K2/5B2/5B1k/8/8/8/8/8 w - - 2 2`.
- Canonical repair: `Be8` (`f7` to `e8`).
- The matcher applies only in Phase 2 and only to the eight D4 transforms of the canonical piece placement.
- Translated or otherwise similar positions do not match.
- The repair is selected by the existing visible `degenerate` priority before `mate in 3`, `sequester`, and `bishops off edge`.
- The move-log reason is `degenerate — bishop retreat`.

## Presentation

Add a degenerate diagram titled `degenerate — bishop retreat` using the canonical position and an arrow from f7 to e8. The general visible priority remains `degenerate — repair degenerate positions`.

## Implementation

Add one board-template matcher to the existing degenerate-repair dispatcher. Transform the canonical king, bishop, and target squares with the shared D4 transforms, require exact piece-square equality, and confirm the transformed bishop move is legal before returning it.

## Verification

- Assert `Be8` is the only ideal move in the canonical position.
- Assert the reason is `degenerate — bishop retreat`.
- Assert every distinct D4 transform selects the correspondingly transformed bishop move.
- Assert a translated near-match does not activate this family.
- Verify the diagram and rendered presentation.
- Run the focused Two Bishops tests, affected presentation tests, diagram check, TypeScript, and `git diff --check`.
- Run the fast fail-first Two Bishops loop search and validate one refreshable localhost loop URL.

## Non-goals

- No broader relative or translated pattern.
- No change to `bishops off edge` or other rule mechanics.
- No full mate suite, exhaustive search, commit, push, or deployment.
