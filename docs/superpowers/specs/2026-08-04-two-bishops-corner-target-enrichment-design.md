# Two Bishops Corner-Target Enrichment Design

## Problem

In `8/k7/2K5/5BB1/8/8/8/8 w - - 2 2`, both `Bd2` and `Bd8` survive `degenerate — corner diagonals`. The target is correctly fixed at `a8`, but the corner-diagonals selector hard-codes target strength `1` for both moves.

That discards meaningful result geometry. Along Black's `a`-file, the relevant axis is rank:

- After `Bd2`, both bishops are below White's king, on the `a1` side. The opposite target `a8` therefore has strength `2`.
- After `Bd8`, one bishop is above and one below White's king. The bishops split, so the fixed `a8` target retains only its baseline strength `1`.

## Design

Keep the existing corner-diagonals target corner unchanged, including its around-the-corner continuation. Replace its constant score with a target-aligned bishop-side score calculated from the resulting bishop squares:

1. Determine the edge axis from Black's current edge.
2. Count the bishops physically beyond White's king toward the corner opposite the fixed target.
3. If that count supports the fixed target, use the count as the target strength.
4. Otherwise retain baseline strength `1`, so a split placement does not erase the established corner-diagonals target.

This makes `Bd2` score `2` and `Bd8` score `1`, allowing the existing first `sequester` subpriority to select `Bd2` uniquely. It adds no visible rule and no witness-specific move selector.

## Rejected Alternatives

- Falling through to ordinary target selection can discard the fixed corner when the bishops split.
- A `Bd2` exception is not a general chess concept.
- Weighting bishop distance is unnecessary; only each bishop's physical side of White's king matters.

## Verification

- `Bd2` is uniquely recommended and scores target strength `2`.
- `Bd8` remains a legal corner-diagonals repair but scores target strength `1`.
- The comparison follows every D4 transform.
- Existing corner-diagonals continuation moves `Bf4` and `Bd6` remain unique.
- Focused Two Bishops, presentation, TypeScript, diagrams, and diff checks pass.
- The next fail-fast cycle contains only Phase 2 positions and is loaded in the sidebar browser.
