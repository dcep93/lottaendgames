# Two Bishops Rule T: King Moat

## Rule

Replace Rule T with:

> **rule t** — When the kings are a knight's move apart, force the Black king to either take opposition or widen the King moat.

Rule T remains Phase 1 only and stays immediately before Rule V.

## Geometry

When the kings are a knight's move apart, exactly one coordinate differs by two squares. The king moat is the rank or file halfway between the kings on that two-square axis. In the supplied position, White's king is on e2 and Black's king is on g3, so the king moat is the f-file.

The moat is derived from the starting position and remains fixed while candidate White moves and their immediate Black replies are evaluated.

## Comparison

Evaluate every legal Black reply after each candidate White move. A Black reply qualifies when either:

1. the resulting kings are in direct opposition, on the same rank or file with one square between them; or
2. Black's king has strictly greater orthogonal distance from the starting king moat than it had before White moved.

A White move satisfies Rule T only when there is at least one legal Black reply and every legal reply qualifies. Use a binary penalty. If no White move forces the condition, all candidates tie and Rule V evaluates the survivors.

For `8/7B/8/8/8/6k1/3BK3/8 w - - 10 6`, `Bf5` is the unique satisfying move. Its legal Black replies are `Kg2`, which takes opposition, and `Kh2` or `Kh4`, which widen the f-file moat.

## Diagram

Use the supplied position. Highlight the complete f-file as the king moat and draw the move arrow from h7 to f5. The caption identifies the marked line as the king moat.

## Verification

Pin the exact rendered wording and T–V–W priority order. Test the supplied position, all D4 rotations and reflections, Phase 2 inactivity, the all-replies requirement, diagram rendering and generation, prepared-batch equivalence, lint, build, and diff validity. Then find and open a strict Phase 1 loop, treating Phase 2 as termination.

## Scope

Do not change Rule V, Rule W, king closer, Black's reply policy, phase detection, or unrelated diagrams.
