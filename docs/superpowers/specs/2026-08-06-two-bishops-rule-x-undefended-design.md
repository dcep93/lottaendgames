# Rule X Undefended-Bishop Design

## Goal

Update Rule X to read and behave as:

> **rule x** — Phase 1: Prefer moving an undefended attacked bishop as far as possible.

In `8/8/3K4/3BBk2/8/8/8/8 w - - 18 10`, the bishop attacked by Black's king is defended by White's king. Rule X must therefore remain neutral instead of rejecting `Bb7`.

## Behavior

Evaluate attack and defense in the starting position. A bishop qualifies for Rule X only when:

1. the move is a bishop move;
2. Black's king is adjacent to the bishop's starting square; and
3. the bishop's starting square is not defended by White's king or by a clear diagonal from the other White bishop.

When a qualifying bishop moves, retain the existing Rule X ranking: prefer the qualifying move with the greatest diagonal travel length. If no candidate moves an undefended attacked bishop, Rule X is neutral and lower priorities decide.

## Scope and verification

Do not change Rule X's phase, priority, target-building gate, or travel-length formula. Update the rendered help text and direct rule-description expectations. Add regression coverage for both a defended attacked bishop and the supplied position, while preserving the existing undefended-bishop tests. Run the Two Bishops and presentation tests, TypeScript, lint, and diagram validation. Finally, find a Phase 1-only cycle on the local `main` server at port 5173; reaching Phase 2 terminates a candidate rather than completing a loop.
