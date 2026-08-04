# Two Bishops Corner-Diagonals Degenerate Repair

## Goal

Repair the shown Phase 2 geometry before general strategy can repeat it. With White's king on f6 and Black's king on h7 relative to the h8 corner, if one bishop controls f8, move the other bishop to control h5.

## Pattern

The pattern is anchored to a board corner and follows all eight D4 rotations and reflections. It does not translate freely.

For the h8 orientation:

- White's king is on f6.
- Black's king is on h7.
- One White bishop occupies any square from which it controls f8.
- The other White bishop has a legal move to any square from which it controls h5.

Every legal move by the other bishop that results in control of h5 is recommended. In the supplied position, the b4 bishop controls f8 and the repair is uniquely b7-f3 (`Bf3`).

## Rule ownership and presentation

The repair is the first degenerate subpattern and reports `degenerate — corner diagonals`. Its diagram uses the supplied position, highlights f8 and h5, and draws b7-f3. Diagram order and degenerate priority order remain mechanically identical.

## Verification

Focused tests will cover the supplied `Bf3` move, any valid controlling-bishop square, rejection when the first bishop does not control f8, legal target handling, all D4 transforms, absence of free translation, reason/diagram alignment, presentation, TypeScript, and diff validity. A fail-first loop search will then supply a different refreshable localhost witness, validated by Redo and reload.

The full mate suite, exhaustive validation, commits, pushes, deployment, and unrelated cleanup are out of scope.
