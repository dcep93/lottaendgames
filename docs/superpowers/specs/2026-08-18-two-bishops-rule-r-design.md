# Two Bishops Rule R Design

## Goal

Add Rule R immediately before Rule S in the shared Two Bishops White priorities:

> **rule r** — Applies when the kings are a knight's move apart and a bishop controls the primary squeeze diagonal. If the black king is closer to the side edge than the rear edge, control the secondary squeeze diagonal.

For `8/8/8/1B6/3B4/4K3/2k5/8 w - - 12 7`, `Bc4` must be preferred by Rule R.

## Geometry

For a knight relationship, the axis on which the kings differ by two squares is the rear axis. The board edge beyond Black's king on that axis is the rear edge. The axis on which they differ by one square is the side axis, and the board edge beyond Black's king on that axis is the side edge.

Rule R applies only when Black's king is strictly closer to the side edge than the rear edge. It reuses Rule S's primary squeeze geometry. Rule R's secondary is the adjacent diagonal reflected away from Black across that primary diagonal; this is the line occupied by `Bc4` in the supplied position.

## Scoring

Rule R applies when:

- the kings are a knight's move apart;
- the side-edge distance is smaller than the rear-edge distance; and
- a bishop controls a primary squeeze diagonal while the matching reflected secondary is not already controlled.

Among legal White moves, Rule R prefers moves whose resulting position controls that matching reflected secondary squeeze diagonal with one bishop while a distinct bishop retains control of the primary diagonal. Rule R is evaluated before Rule S.

## Verification

- Assert `Bc4` is preferred in the supplied position and Rule R explains it.
- Assert transformed positions behave identically under every board symmetry.
- Assert Rule R does not apply when the side edge is not strictly closer.
- Run the focused Two Bishops and presentation tests, build, lint, generated-asset checks, and locate/open a fresh strict Phase 1 loop.
