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

The primary projection is four steps from White's king. The existing secondary and tertiary projections remain two and three steps away. In `8/8/8/8/1K6/8/2k5/4BB2 w - - 2 2`, the primary diagonal contains `d2–e3`; neither bishop occupies it, so Rule S does not apply.

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
- Rule S remains disabled in Phase 2.
