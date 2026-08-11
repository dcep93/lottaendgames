# Two Bishops Phase 1 Target Quality Design

## Goal

Replace the static Phase 1 target square with a candidate-specific target-square and target-corner pair. In `8/8/6B1/8/1K1k4/6B1/8/8 w - - 0 1`, `Bf4` must uniquely win by selecting `e3` as its target square and `a8` as the opposite target corner.

## Rendered English

The Phase 1 target note becomes:

> Phase 1 Target Square: Each square diagonally adjacent to Black's king is a possible target. Its target corner is the corner opposite it through Black's king. After each White move, prefer the target with the lowest maximum king-step distance between Black's legal replies and its target corner. Retain tied targets.

Update the affected rules to read:

> **rule zz** — Phase 1: Keep bishops more than 2 steps away from the target corner.

> **rule z** — Phase 1: Control or x ray the best target square with a bishop without checking, unless following rule v.

> **rule w** — Phase 1: Move the king towards the target square, preferring further distance from the target corner.

Rule Y and Rule V retain their existing rendered English. Phase 2 text and behavior remain unchanged.

## Target Pairs

Generate every on-board square diagonally adjacent to Black's king. Pair each target square with the board corner reached in the opposite file and rank directions through Black's king. For example, with Black on `d4`, `e3` pairs with `a8`.

After each candidate White move, enumerate every legal Black reply. Score each target pair by the maximum Chebyshev distance from Black's resulting king square to that pair's target corner. Lower quality scores are better. Preserve every pair tied for the best score.

Checkmate and stalemate continue to be handled by their earlier terminal priorities. Target quality is evaluated only for nonterminal positions.

## Candidate Selection

For each White candidate, compute target-pair facts together so later rules cannot select incompatible targets:

1. When the Rule V path is active, prefer the best-quality pairs satisfying Rule V's king-control, Rule Y, and checking geometry.
2. Otherwise, prefer the best-quality pairs whose target square is controlled or x-rayed by a bishop without checking.
3. If no pair satisfies the applicable construction condition, retain the globally best-quality pairs.

Exact quality ties remain active throughout scoring.

## Rule Integration

- Rule ZZ counts bishops within two king steps of the selected target corner.
- Rule Z first prefers a controlled or x-rayed target, then minimizes target quality.
- Rule Y measures only the two squares adjacent to both Black's king and a selected target square.
- Rule W minimizes White's squared Euclidean distance to the selected target square, then maximizes White's Chebyshev distance from its paired target corner.
- Rule V requires White-king control, Rule-Y satisfaction, and the checking bishop's destination to agree with the same selected target pair.

Expose the selected target squares, selected target corners, target quality, and target-control penalty in the public diagnostic score.

## Verification

- Assert that `Bf4` uniquely wins the supplied position with Rule Z as the visible reason.
- Assert that `Bf4` selects `e3` and `a8` with quality `3`.
- Cover exact target-quality ties and target-control fallback behavior.
- Cover consistent Rule ZZ, Rule Y, Rule W, and Rule V use of the selected pair.
- Run every fixture through all D4 rotations and reflections.
- Verify that Phase 2 scoring is unchanged.
- Run TypeScript, Two Bishops tests, presentation tests, lint, and diagram validation.
- Find and open a local Phase 1 loop on port 5173 after the change, treating entry into Phase 2 as termination.
