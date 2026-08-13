# Two Bishops Rule AA Design

## Rule

Add Rule AA immediately before Rule A:

> **rule aa** — When the kings are in opposition, and a bishop controls a square edge adjacent to Black's king, and not a square adjacent to White's king, check the king.

Rule AA is a Phase 1 rule. The kings are in opposition when they are aligned by file or rank with one square between them.

## Scoring

Rule AA applies when, before White moves, at least one bishop controls an orthogonally adjacent square of Black's king that is not king-adjacent to White's king.

A candidate satisfies Rule AA when the resulting position is check and contains this geometry:

- one bishop checks Black's king;
- the other bishop controls a qualifying Black-king-adjacent square; and
- those two bishops are adjacent.

All satisfying moves tie under Rule AA. Later rules break any remaining tie.

## Acceptance

For `8/8/4k3/8/B3K3/B7/8/8 w - - 16 9`, `Bb3+` is the only ideal White move. The behavior is invariant under board rotations and reflections. Rule AA is inactive in Phase 2 and when the kings are not in opposition.
