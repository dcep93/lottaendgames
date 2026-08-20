# Two Bishops Rule Z1 Design

## Goal

Add `rule z1` immediately before `death box`:

> **rule z1** — When the kings are a knight's move apart and bishops control the flank diagonals, use a bishop to control the primary squeeze diagonal.

## Geometry

Evaluate the starting position. Rule Z1 applies only when the kings are a knight's move apart and the two bishops occupy both matching Rule W flank diagonals. Prefer legal bishop moves whose destination lies on the primary squeeze diagonal on the corresponding squeeze side. The primary squeeze diagonal uses the opposite diagonal axis from the parallel flank diagonals, allowing a bishop to reach it in one move.

When Black is on an edge, the primary squeeze diagonal may be defined by a conceptual anchor one square beyond the board. Only the on-board portion is controlled; for example, with Black on `h5`, `Bg3` controls the edge-clipped primary diagonal `e1–h4`.

## Verification

Cover the canonical `Bf7` example and all rotations and reflections. Confirm Rule Z1 appears immediately before `death box`, then load a verified local loop at `cursor=0`.

## Assumption

“Bishops control the flank diagonals” describes the position before White moves; “use a bishop to control” requires a bishop move whose resulting square controls the primary squeeze diagonal.
