# Two Bishops Phase 1 Knight-Step Control

## Goal

Add a new visible rule immediately before `conclave step`:

> Phase 1: when the kings are a knight's move apart, use a bishop to control the square diagonal to Black's king and in 2 square opposition to White's king.

In the supplied position, this rule must make `Bf4` the unique recommendation.

## Activation and target geometry

The rule applies only when the starting position is Phase 1 and the starting kings are a legal knight's move apart: one file by two ranks or two files by one rank.

Enumerate the on-board squares diagonally adjacent to Black's starting square. A square is a target when it is orthogonally aligned with White's starting king at distance three, leaving exactly two squares between the target and White's king.

The rule is inactive when the kings do not have the required relation or when the derived target is off the board. If no legal surviving move satisfies the action, the rule leaves the survivor set unchanged.

## Candidate action

Only bishop moves qualify. After applying the candidate, the moved bishop on its resulting square must reach at least one target along a clear diagonal ray. A king move or a move by the other bishop that merely leaves an existing target control does not qualify.

The rule is binary and has no internal tie-breaker: every qualifying bishop move survives. Later priorities resolve any remaining tie.

## Priority and scoring

Insert `knight-step control` after `phase 2 wall` and before `conclave step`. Earlier mandatory, mate-pattern, degenerate, and Phase 2 priorities continue to outrank it.

Add an applicability flag and a move penalty to `TwoBishopsWhiteMoveScore`. Precompute the target squares once in the prepared position context so batch scoring and public single-move scoring remain identical.

## Supplied diagram

Use the exact supplied starting FEN:

`8/6k1/4K3/8/8/8/7B/7B w - - 0 1`

The generated Phase 1 note board must highlight `h6`, draw the arrow `h2 -> f4`, and explain that the arrowed bishop controls the highlighted target.

## Symmetry and scope

The rule is calculated from relative square geometry and clear bishop rays. Translation, rotation, and reflection must preserve it. Phase 2 behavior is unchanged.

## Verification

Tests must prove:

- the supplied position uniquely recommends `Bf4` with reason `knight-step control`;
- `h6` is the unique target in the supplied geometry;
- `Bf4` qualifies because the moved bishop controls `h6` after the move;
- king moves, unrelated bishop moves, blocked rays, non-knight king geometry, and off-board targets do not qualify;
- no qualifying candidate makes the rule a no-op;
- translation and every D4 transform preserve the recommendation;
- the rule is ordered immediately before `conclave step` and is inactive in Phase 2;
- the generated diagram uses the supplied FEN, Phase 1 label, `h6` highlight, and `h2 -> f4` arrow; and
- focused tests, diagram consistency, lint, TypeScript, and diff checks pass.

After implementation, find a fresh strict Phase 1 exact-repetition loop under the current policy. Reaching Phase 2 terminates the search. Open and verify the replay on the isolated port 5174 server in the Codex browser.
