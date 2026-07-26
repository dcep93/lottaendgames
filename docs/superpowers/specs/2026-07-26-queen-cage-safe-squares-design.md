# Queen cage safe-square minimum

## Goal

Replace the Queen cage's raw-area minimum with the displayed and mechanical
rule:

> **corner cage** — Confine Black in the narrowest queen-to-corner box: shorter
> side first, then longer side. The box must have at least 2 safe squares.

## Safe-square geometry

Enumerate the squares inside the existing queen-to-corner rectangle. A square
is safe when Black's king could occupy it in the resulting position: it is not
occupied by a White piece and is not attacked by White after relocating the
Black king there.

Count safe squares positionally. Do not use move history, the halfmove clock,
the number of legal Black replies, or a tablebase.

Within `corner cage`, first prefer positions with at least two safe squares.
Among those positions, retain the existing comparison: shorter side first,
then longer side.

The universal `mate`, `pieces safe`, and `no stalemate` priorities remain
higher. A sole checkmate still defeats every non-mating move.

## Verification

In `8/k7/8/1QK5/8/8/8/8 w - - 0 1`, prove that `Qb6+` creates a two-square
geometric box but leaves only `a8` safe and is therefore rejected by `corner
cage`. Test the safe-square enumeration across board symmetries, assert the
exact modal wording, and run the focused and complete Mate suites.
