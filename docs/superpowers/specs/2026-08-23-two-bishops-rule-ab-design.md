# Two Bishops Rule AB Design

## Goal

Add Rule AB immediately after Rule AA:

> **rule ab** — Phase 1: Prefer White king proximity to the outer bishop wall.

The rule should guide White's king toward the outer diagonal of an actual bishop wall without affecting Phase 2 play.

## Geometry

Rule AB reuses the existing `TwoBishopsWall` geometry. For each legal White move, it evaluates the resulting position and finds its valid bishop walls. A wall's outer diagonal is its `fartherDiagonal`—the diagonal farther from the corner containing Black.

When multiple walls exist, Rule AB first keeps only walls with the smallest Black corner area. It then measures the White king's minimum king-move distance to any board square on each tied wall's outer diagonal and uses the smallest distance.

## Scoring

- Rule AB applies only when the starting position is Phase 1 and at least one legal White move produces a valid bishop wall.
- A move that produces a qualifying wall receives its measured king-to-outer-wall distance.
- A move that produces no qualifying wall receives a sentinel worst penalty.
- Lower distance is preferred.
- The geometry is evaluated after White's move, so king and bishop moves are both scored against the wall they actually leave behind.

## Priority and UI

Rule AB is rendered and evaluated immediately after Rule AA. Its Training Info text is exactly:

> Phase 1: Prefer White king proximity to the outer bishop wall.

No new diagram is required.

## Verification

Tests will cover:

- the active priority and Training Info placement after Rule AA;
- after-move king distance to the outer diagonal;
- selection of the tightest Black corner area when multiple walls exist;
- exclusion in Phase 2;
- rotations and reflections;
- a verified loop loaded in the in-app browser at `cursor=0` after implementation.
