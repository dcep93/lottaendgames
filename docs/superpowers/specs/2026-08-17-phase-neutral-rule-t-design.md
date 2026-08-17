# Phase-neutral Two Bishops Rule T

## Goal

Apply the existing Rule T moat-opposition mechanic in Phase 2 as well as Phase 1. The rendered English remains unchanged:

> **rule t** — When the kings are a knight's move apart, use a bishop to force the Black king to take moat opposition.

## Behavior

Remove Rule T's Phase 2 exclusion from its geometry constructor. Keep every other condition unchanged:

- the kings must be a knight's move apart;
- White must move a bishop;
- every legal Black reply must either take king opposition or widen the existing King moat;
- when several moves force the condition, prefer the move with fewer Black replies.

Because Rule T precedes Rule W, a qualifying Phase 2 move is selected before Rule W can accept a completed flank pair.

When every surviving Phase 2 candidate has zero Rule T penalty, stop at Rule T. This preserves Rule T as the displayed explanation instead of allowing Rule W's completed-pair stop to overwrite it.

For `5k2/8/5BK1/5B2/8/8/8/8 w - - 6 4`, only `Bd7` satisfies the existing Rule T predicate. It leaves Black only `Kg8`, which takes moat opposition. Other bishop moves either allow `Ke8` or fail to force the required response, so `Bd7` is uniquely correct.

## Tests

- Assert the supplied position is Phase 2.
- Assert `Bd7` has zero Rule T penalty and every alternative has a positive Rule T penalty.
- Assert `Bd7` is the unique ideal move and is explained by Rule T.
- Assert the result under all eight D4 rotations and reflections.
- Retain the existing Phase 1 Rule T tests and exact rendered copy.
- Run focused rule tests, presentation tests, diagram drift verification, lint, build, and `git diff --check`.
