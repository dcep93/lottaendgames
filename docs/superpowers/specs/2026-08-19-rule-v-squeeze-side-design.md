# Rule V Squeeze-Side Check Design

## Goal

Update Rule V so its follow-up clause accepts a check from the same squeeze side as an already controlled primary squeeze diagonal, rather than requiring the checking bishop to occupy the secondary squeeze diagonal.

## Behavior

- Keep Rule V's existing opposition prerequisite and first clause unchanged.
- Evaluate each primary/secondary squeeze bundle independently.
- When a bishop already controls a bundle's primary diagonal, prefer legal bishop checks whose checking line approaches Black's king from that bundle's side.
- Preserve the non-checking bishop's control of that same primary diagonal.
- Do not accept checks associated with the opposite squeeze bundle.

For `8/3B4/8/8/1B6/4K1k1/8/8 w - - 2 2`, `Bd6+` qualifies and should beat the bishop-distance move `Bb5`.

## Presentation and Verification

Render the supplied Rule V wording unchanged. Add a focused regression test for the supplied position, retain the existing symmetry and matched-bundle tests, run the Two Bishops and presentation suites, then find and audit a Phase 1 loop that never enters Phase 2.
