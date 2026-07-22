# Two Bishops Corner Setup Progress

## Problem

From `8/8/8/8/B7/1K6/3B4/k7 w - - 2 2`, the current supported-corner waiting rule selects `Ba5`. That move returns the bishop to its previous square and recreates the starting structure after `...Kb1`. The choice is locally legal but makes no progress toward the corner mating setup.

## Design

Keep the existing `waiting move` priority and make its supported-corner branch position-based.

When Black is in a corner and White's king is on one of the two knight-move support squares:

1. Look at the two board edges that meet at Black's corner.
2. An edge bishop needs attention when it occupies the corner edge closest to White's king.
3. If such a bishop exists, prefer safe, non-checking moves that preserve phase 2 after every Black reply and either:
   - move that bishop off the edge, or
   - move White's king to the other corner-support square.
4. Once no edge bishop needs attention, use the existing supported-corner behavior: bring separated bishops together without checking while preserving phase 2 after every Black reply.

This is static geometry. It does not inspect move history, mate distance, or a tablebase.

## Modal Rule

The single `waiting move` explanation will describe every implemented waiting pattern:

> Keep phase 2 while making Black move. If White's pieces form a line and the kings are two diagonal squares apart, move the bishop on the same color square as White's king one square toward the king and center. If the kings are a knight's move apart and the bishops are together, move one bishop one square toward the center. At a supported corner, clear a bishop from the edge closest to White's king—or move the king to the other support square. Then bring the bishops together without checking.

## Expected Result

In `8/8/8/8/B7/1K6/3B4/k7 w - - 2 2`, the waiting candidates include `Bb5`, `Bc6`, `Bd7`, `Be8`, and `Kc2`. `Ba5` is rejected because it leaves the same edge bishop and king alignment. Later human-readable priorities may choose among the accepted progress moves.

## Verification

- Assert the exact progress candidates and rejection of `Ba5`.
- Assert the same behavior under all eight rotations and reflections.
- Preserve the previous supported-corner regression where `Bf3` is preferred over `Be5+`.
- Assert that the modal copy exactly matches the implemented geometries.
- Run lint, focused Two Bishops tests, production build, and the exhaustive Two Bishops verifier.
