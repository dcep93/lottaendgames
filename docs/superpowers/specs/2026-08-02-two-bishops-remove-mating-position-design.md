# Remove Two Bishops Mating Position

## Goal

Fully undo the mating-position feature while retaining the independently approved sequester corner-knight behavior.

## Rollback

- Remove the `mating position` note board, its kingless pieces, and its `f8/f7` highlights.
- Remove the mating-position geometry helper and its public export.
- Restore `mate in 3` activation to White's king being a knight's move from the relevant corner, including the older mate-in-two continuation contained by that rule.
- Restore the rendered text: **mate in 3** — Phase 2: With Black's king in the corner and White's king a knight's move away, play mate in 3.
- Remove mating-position-only tests, including the edge-square mate-in-three regression and diagram assertions.

Do not change sequester's current nearest-corner knight-square metric or wording.

## Verification

Run focused Two Bishops rules, directly affected presentation tests, the diagram generator check, targeted TypeScript, and diff checks. Do not run the full mate suite. Finish with a refreshable localhost loop.
