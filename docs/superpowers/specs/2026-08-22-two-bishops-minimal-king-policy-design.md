# Two Bishops Minimal King Policy

## Goal

Reset White's active Two Bishops heuristics while preserving the current app and scoring implementation for later reconstruction.

## Active White policy

White moves survive these priorities, in order:

1. Checkmate when available.
2. Keep both bishops safe.
3. Avoid stalemate.
4. Prefer White's king closer to the middle 16 squares, then closer to Black's king.

Only **king closer** is rendered as a training heuristic. Black's move policy is unchanged.

## Implementation

Reduce `twoBishopsWhiteRules` to the three hidden correctness constraints and `king closer`. Leave the dormant score fields and helper implementations in place so selected heuristics can be rebuilt without losing current quality-of-life work.

## Verification

Run the focused Two Bishops tests, verify the displayed training rules, discover a repeated-position line under the new policy, and load it with `cursor=0`.
