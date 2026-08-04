# Contiguous Two Bishops Martian Conclave Control

## Goal

Tighten the generalized Phase 1 `martian conclave step` so its three controlled squares must be contiguous around Black's king. Three eligible squares scattered around the king no longer qualify.

## Ring model

Model the eight locations surrounding Black's king as a fixed cyclic compass ring:

`N -> NE -> E -> SE -> S -> SW -> W -> NW -> N`

For every legal White move, calculate the ring after White's turn. A ring slot is controlled when all of the following are true:

- the slot is on the board;
- it is not adjacent, orthogonally or diagonally, to White's resulting king; and
- at least one resulting White bishop reaches it along a clear diagonal ray.

An off-board, White-king-adjacent, or uncontrolled slot breaks a run. The ring is cyclic, so a run such as `NW, N, NE` is contiguous. The maximum run length is eight even when every slot is controlled.

## Martian qualification

A move receives the qualifying martian control score only when:

- the resulting kings remain exactly two Chebyshev king steps apart; and
- the longest contiguous run of controlled eligible ring slots is at least three.

The threshold remains binary: a run of four does not beat a run of three. If no surviving move qualifies, the martian control subpriority remains a no-op.

The existing second martian subpriority is unchanged: once all survivors qualify, prefer the smallest squared Euclidean distance between the resulting bishops.

## Presentation and scope

Keep the rule name, description, priority order, and generated diagram unchanged. The existing diagram's highlighted `e5`, `f5`, and `f6` squares already form a contiguous three-square run after `Bd3`.

The rule remains Phase 1-only, orientation-independent, and based entirely on the resulting position. Translation, rotation, reflection, and wraparound at the compass-ring boundary must preserve the recommendation.

## Verification

Tests must prove:

- the supplied martian position still retains its intended qualifying moves before `king closer` selects `Bd3`;
- the reported martian metric is the longest contiguous controlled run, not the total controlled-square count;
- three controlled but noncontiguous eligible squares do not qualify;
- a run crossing `NW -> N -> NE` qualifies;
- board edges and White-king adjacency break rather than bridge a run;
- existing clear-ray, threshold, D4-symmetry, and Phase 2 tests continue to pass; and
- focused tests, diagram checks, lint, TypeScript, and diff checks pass.

After implementation, generate a fresh strict Phase 1 loop using the current policy. Entering Phase 2 terminates the search. Open the verified replay on the isolated port 5174 server in the Codex browser.
