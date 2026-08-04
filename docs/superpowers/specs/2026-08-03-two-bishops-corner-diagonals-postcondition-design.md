# Two Bishops Corner-Diagonals Postcondition

## Goal

Correct `degenerate — corner diagonals` so it describes the position White must preserve or create, rather than requiring a particular bishop to move.

## Rule

In the existing corner-anchored king geometry, retain moves whose resulting position satisfies both conditions:

- One bishop controls f8.
- The other bishop controls h5.

The square names rotate and reflect with the existing D4 transform. The pattern remains corner-anchored and does not translate.

If h5 is not controlled initially, the original supplied position still requires `Bf3`. If both controls already exist, any legal move that preserves both survives this priority, including `Kf7` in `8/7k/5K2/8/1B6/8/4B3/8 w - - 0 1`.

## Selection flow

This degenerate is a non-terminal filter. Its surviving moves continue through every later visible priority, including `mate in 3`, `bishops off edge`, `force phase 2`, `king distance`, and `sequester`.

No history, lookup, proof distance, special king-move allowance, or hidden tie-break is introduced.

## Presentation

Keep the title `degenerate — corner diagonals`. Update its caption to:

> Preserve one bishop's control of f8. Ensure the other bishop controls h5.

The existing diagram and highlights remain mechanically accurate.

## Verification

Focused tests cover the original `Bf3` setup, the already-satisfied position with `Kf7` surviving this priority, continued cascading into later priorities, all D4 transforms, rejection of translations and missing f8 control, diagram and rendered-copy alignment, targeted TypeScript, and diff validity. Then run the fail-fast loop gate and provide one validated refreshable localhost loop.

The full mate suite, exhaustive census, commits, pushes, deployment, and unrelated cleanup remain out of scope.
