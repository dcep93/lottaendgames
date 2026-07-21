# Rook adjacency-agnostic establish box

## Goal

Allow a Rook move that ends adjacent to White's King to qualify for
`establish box`. Human-facing copy and evaluator behavior must match without a
FEN, square, orientation, or box-size exception.

## Visible rule

Display:

> **establish box** — Use the Rook to make the smallest phase 2 box.

## Evaluator

A move passes `establish box` exactly when its result is phase 2. Among all
passing moves, prefer the smallest resulting Rook box. Whether the Rook or
White's King moved, and whether they finish adjacent, does not affect this
rule.

The earlier universal `rook safe` priority remains responsible for rejecting a
Rook placement that Black can immediately capture. Therefore allowing
adjacency does not bypass material safety.

This supersedes the previous mover-aware adjacency rule. In
`8/7k/1R6/5K2/8/8/8/8 w - - 4 3`, safe `Rg6` creates the smallest phase-2 box
and must no longer fail establish-box eligibility.

## Verification

- Assert the exact visible rule copy.
- Replace adjacency-ineligibility assertions with assertions that safe adjacent
  Rook moves pass and retain their actual box size.
- Update focused best-move fixtures only where removing the guard changes the
  ordered rule result.
- Verify affected positions across all D4 rotations and reflections.
- Run focused Rook rules, the exact identity-keyed Rook verifier, session and
  presentation tests, lint, and the production build.
- If exhaustive verification still finds a cycle or 50-move draw, report one
  shortest replay from its minimal cycle or draw boundary.
