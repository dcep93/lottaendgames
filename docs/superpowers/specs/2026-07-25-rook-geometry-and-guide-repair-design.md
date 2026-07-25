# Rook Geometry and Guide Repair

## Goal

Teach the ordinary rook mate as one repeatable method: build a safe rook wall,
use the king and waiting moves to make Black yield opposition, shrink the box,
and mate Black on whichever edge it reaches. White does not try to force Black
into a corner.

## Board-only evaluator

White's visible priorities are:

1. `mate` — Checkmate immediately.
2. `pieces safe` — Do not lose the rook.
3. `no stalemate` — Keep Black a legal reply.
4. `cover escape squares` — Cover the squares beside Black's king so the rook
   can mate.
5. `shrink the box` — Move the rook wall closer to leave Black less room.
6. `king proximity` — Bring White's king towards Black's.
7. `rook box size` — Use the rook to make a box around Black's king.

The evaluator reads only the current board. It does not use move counters,
history, orientation-specific squares, a shortest-mate table, or corner
distance. Small geometric safety checks may exist inside these rules, but they
must not contradict the displayed strategy.

The shrink rule keeps the proven rook-wall test as its eligibility check. Among
safe wall-closing moves, the actual remaining box selects the smaller result.
This makes `Rg7` correct in
`8/5R2/8/4K3/8/7k/8/8 w - - 0 1` without letting an arbitrary rook shift
override the opposition method.

## Phase 2

Phase 2 remains a real concept:

> Phase 2 begins once the rook is between the kings and Black is boxed on one
> side.

The phase-2 diagram shows a full 8×8 board with the kings in opposition and the
rook holding the wall. It uses no shaded squares; the pieces themselves explain
the geometry.

## Verification

The implementation must include literal regressions for the rule order, copy,
phase-2 diagram, and supplied `Rg7` position. The production policy must then be
derived and exhaustively verified one heavy process at a time.

Acceptance requires:

- every legal rook-mate position is covered;
- every tied recommended White move survives every legal Black reply;
- no repetition cycle exists;
- no stalemate or rook loss is recommended; and
- the longest forced line finishes before the fifty-move draw.

The symmetry-reduced derivation covers 21,950 structural White positions and
5,476 structural Black positions. The repaired policy ranks every root and has
a maximum White rank of 65 plies, safely below 100 plies.
