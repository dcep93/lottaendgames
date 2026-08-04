# Two Bishops Unmask Uncornered Bishops Design

## Goal

Extend the visible Phase 2 rule to read:

> **unmask** — Phase 2: Ensure White's king doesn't mask a bishop, preferring adjacent bishops and uncornered bishops.

## Geometry

A bishop is cornered when it occupies one of the four board corners: `a1`, `a8`, `h1`, or `h8`. The definition depends only on the resulting board position and is invariant under all rotations and reflections of the board.

## Selection

Unmask keeps its existing ordered subpriorities and adds one final comparison:

1. Prefer resulting positions in which White's king masks no bishop.
2. Among those survivors, prefer orthogonally or diagonally adjacent bishops by king distance.
3. Among remaining ties, minimize the number of bishops occupying board corners.

The final comparison does not restore moves eliminated by earlier rules or earlier Unmask subpriorities. It applies only in Phase 2, like the existing Unmask mechanics.

## Verification

- Assert the exact rendered copy and the new score field's ownership by Unmask.
- Add a focused fixture proving an uncornered result beats an otherwise tied cornered result.
- Preserve the existing masking and adjacency regressions.
- Check D4-transformed versions of the focused fixture.
- Run focused Two Bishops tests, the directly affected presentation check, targeted TypeScript, diagram consistency if reached by the focused command, and diff hygiene.
- Run the small fail-fast Two Bishops loop gate and return one validated localhost loop.

## Non-goals

- Do not penalize non-corner edge squares.
- Do not change Unmask's masking or adjacency definitions.
- Do not change rule order, phase classification, Black priorities, diagrams, or other mating rules.
- Do not run the full mate suite, commit, push, or deploy.
