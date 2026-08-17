# Rule S Force Opposition Design

## Goal

Simplify Rule S so a prepared primary squeeze diagonal leads either to a tertiary-diagonal check or directly to king opposition, without requiring a secondary squeeze diagonal move.

## Behavior

Rule S remains Phase 1-only and applies when:

- the kings are a knight's move apart; and
- a bishop occupies the primary squeeze diagonal.

For the canonical Rule S diagram, the parallel squeeze diagonals are:

- primary: `a6–b5–c4–d3–e2–f1`;
- secondary: `a8–b7–c6–d5–e4–f3–g2–h1`; and
- tertiary: `a7–b6–c5–d4–e3–f2–g1`.

For knight-separated kings, construct the squeeze diagonals from the king moat:

1. The moat lies between the kings on their two-square separation axis.
2. From Black's king, identify the edge-adjacent square opposite the moat.
3. Of the two edge-adjacent squares parallel to the moat, use the one closer to the board center.
4. Primary is the diagonal through those two selected squares.
5. Tertiary is the parallel diagonal through Black's king.
6. Secondary is the next parallel diagonal beyond Black's king.

In `8/8/8/8/1K6/8/2k5/4BB2 w - - 2 2`, primary contains `d2–e3`; neither bishop occupies it, so Rule S does not apply. In `8/4B3/4B3/8/4K3/2k5/8/8 w - - 8 5`, primary contains `b3–c4–d5–e6`, so `Be6` occupies it. The rotated pattern gives `a2–b3–c4–d5` in `8/8/3B4/3B4/8/3K4/1k6/8 w - - 2 2`.

Its preferred moves are:

1. Bishop checks from the tertiary squeeze diagonal, when available without exposing a bishop to capture.
2. Otherwise, White king moves that take opposition.

The existing requirement that a bishop be able to reach the secondary squeeze diagonal before the opposition fallback is removed. “To force opposition” describes the purpose of the tertiary check; it does not require every immediate Black reply to be an opposition square.

Safety is evaluated when Rule S chooses its branch. An unsafe tertiary check does not suppress the opposition fallback merely because it is geometrically available; this mirrors the higher-priority bishop-safety rule.

The rendered English becomes:

> Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal to force opposition or otherwise take opposition.

The Rule S diagram updates its tan primary highlight to `a6–f1`. Secondary and tertiary highlights remain unchanged.

## Regression coverage

- The existing `Bc5+` tertiary-check position and all rotations/reflections remain uniquely correct because `Bd3` occupies primary and the other bishop checks from tertiary.
- A corrected fallback fixture verifies direct opposition when a bishop occupies primary and no safe tertiary check exists.
- A corrected unsafe-check fixture verifies that a capturable tertiary check does not suppress opposition.
- In `8/8/8/8/1K6/8/2k5/4BB2 w - - 2 2`, Rule S does not apply.
- In `8/4B3/4B3/8/4K3/2k5/8/8 w - - 8 5`, `Be6` occupies primary and `Bf6+` checks from tertiary.
- In `8/8/3B4/3B4/8/3K4/1k6/8 w - - 2 2`, `Bd5` occupies primary.
- Rule S remains disabled in Phase 2.
