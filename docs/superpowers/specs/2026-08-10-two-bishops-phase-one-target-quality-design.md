# Two Bishops Phase 1 Target Quality Design

## Goal

Replace the static Phase 1 target square with possible target-square and target-corner pairs. Target quality belongs to the pair in the starting position, so every White move selecting the same pair receives the same quality. In `8/8/6B1/8/1K1k4/6B1/8/8 w - - 0 1`, `Bf4` must uniquely win by selecting `e3` as its target square and `a8` as the opposite target corner.

## Rendered English

The Phase 1 target note becomes:

> Phase 1 Target Square: A square diagonally adjacent to Black's king is possible when a bishop controls or x rays it without checking and a bishop controls or occupies both squares adjacent to the target and Black's king. Its target corner is the corner opposite it through Black's king. Prefer the possible target whose target corner is closest to Black's king before White moves. Retain tied targets.

Update the affected rules to read:

> **rule zz** — Phase 1: Keep bishops more than 2 steps away from the target corner.

> **rule z** — Phase 1: Control or x ray the best target square with a bishop without checking, unless following rule v.

> **rule w** — Phase 1: Move the king towards the target square, preferring further distance from the target corner.

Rule Y and Rule V retain their existing rendered English. Phase 2 text and behavior remain unchanged.

## Target Pairs

Generate every on-board square diagonally adjacent to Black's king. Pair each target square with the board corner reached in the opposite file and rank directions through Black's king. For example, with Black on `d4`, `e3` pairs with `a8`.

Score each target pair once from the starting position by the Chebyshev distance from Black's king to that pair's target corner. Lower quality scores are better. Preserve every pair tied for the best score. The same target pair always has the same quality across White candidates.

After each candidate White move, a normal target pair is possible only when a bishop controls or x rays its target without checking and one bishop controls or occupies both squares adjacent to both the target and Black's king. A Rule V target is possible under Rule V's existing checking exception when its king-control, Rule Y, and checking geometry are satisfied.

## Candidate Selection

For each White candidate, compute target-pair facts together so later rules cannot select incompatible targets:

1. When the Rule V path is active, prefer the best-quality possible pairs satisfying Rule V's king-control, Rule Y, and checking geometry.
2. Otherwise, prefer the best-quality possible pairs satisfying both Rule Z target control and full Rule Y common-adjacent control.
3. A candidate with no possible pair loses Rule Z to any candidate with a possible pair. If no surviving candidate has a possible pair, target quality does not distinguish them and later priorities decide.
4. Keep the best-quality controlled pair, or the best-quality global pair when none is controlled, as fallback geometry for later priorities.

Exact quality ties remain active throughout scoring.

## Rule Integration

- Rule ZZ counts bishops within two king steps of the selected target corner.
- Rule Z first prefers a possible target, then minimizes intrinsic target quality. Target quality is skipped when no surviving candidate has a possible target.
- Rule Y measures only the two squares adjacent to both Black's king and a selected target square.
- Rule W minimizes White's squared Euclidean distance to the selected target square, then maximizes White's Chebyshev distance from its paired target corner.
- Rule V requires White-king control, Rule-Y satisfaction, and the checking bishop's destination to agree with the same selected target pair.

Expose the selected target squares, selected target corners, target quality, and target-control penalty in the public diagnostic score.

## Verification

- Assert that `Bf4` uniquely wins the supplied position with Rule Z as the visible reason.
- Assert that `Bf4` selects possible target `e3` and `a8` with intrinsic quality `4`; the lower-quality `e5` pair is ineligible because Rule Y cannot be satisfied for it after `Bf4`.
- Assert that moves selecting the same target pair receive the same quality even when they allow different Black replies.
- Cover exact target-quality ties and target-control fallback behavior.
- Cover consistent Rule ZZ, Rule Y, Rule W, and Rule V use of the selected pair.
- Run every fixture through all D4 rotations and reflections.
- Verify that Phase 2 scoring is unchanged.
- Run TypeScript, Two Bishops tests, presentation tests, lint, and diagram validation.
- Find and open a local Phase 1 loop on port 5173 after the change, treating entry into Phase 2 as termination.
