# Rule S Force Opposition Design

## Goal

Simplify Rule S so a prepared primary squeeze diagonal leads either to a tertiary-diagonal check or directly to king opposition, without requiring a secondary squeeze diagonal move.

## Behavior

Rule S remains Phase 1-only and applies when:

- the kings are a knight's move apart; and
- a bishop controls the primary squeeze diagonal.

Its preferred moves are:

1. Bishop checks from the tertiary squeeze diagonal, when available.
2. Otherwise, White king moves that take opposition.

The existing requirement that a bishop be able to reach the secondary squeeze diagonal before the opposition fallback is removed. “To force opposition” describes the purpose of the tertiary check; it does not require every immediate Black reply to be an opposition square.

The rendered English becomes:

> Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. Check from the tertiary squeeze diagonal to force opposition or otherwise take opposition.

The squeeze geometry and Rule S diagram remain unchanged.

## Regression coverage

- The existing `Bc5+` tertiary-check position and all rotations/reflections remain uniquely correct.
- In `8/8/8/1K6/8/k7/8/4BB2 w - - 0 1`, `Ka5` becomes uniquely correct even though no bishop can newly reach the secondary squeeze diagonal.
- Rule S remains disabled in Phase 2.
