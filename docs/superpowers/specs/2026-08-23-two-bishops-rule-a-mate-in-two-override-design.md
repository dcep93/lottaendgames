# Rule A Mate-in-Two Override Design

## Goal

Prevent Rule A from rebuilding a corner cage when White already has a forced mate in two.

## Behavior

Whenever Rule A applies, calculate White moves that force mate on White's following turn against every legal Black reply. If any exist, those moves take precedence over every Rule A construction stage. If none exist, retain the existing king-target, cage-diagonal, and waiting-move behavior.

In `2B5/8/8/8/8/6K1/8/4B1k1 w - - 2 2`, `Bf2+` must beat `Ba6`: the former starts forced mate in two, while the latter rebuilds the cage and forces `Kh1`, recreating the prior position.

## Verification

- Assert `Bf2+` is uniquely ideal in the reported intermediate position.
- Assert the result under every rotation and reflection.
- Preserve all existing Rule A stage tests.
- Run focused Two Bishops tests, diagram drift, build, and the uncached fast loop verifier.
