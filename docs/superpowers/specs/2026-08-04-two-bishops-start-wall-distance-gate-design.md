# Two Bishops Start Wall Distance Gate Design

## Goal

Refine Phase 1 `start wall` eligibility so a bishop may start a wall only when the move does not increase that bishop's squared-Euclidean distance to Black's king.

## Semantics

A move starts a wall only when all existing gates pass and:

`distance²(move destination, Black king) <= distance²(move source, Black king)`

Squared-Euclidean distance is used directly; no square root or rounding is involved. Equality is allowed.

The ordered behavior remains:

1. Identify bishop moves that create two-square opposition without increasing squared-Euclidean distance to Black.
2. If at least one such move exists, discard non-qualifying moves.
3. Among qualifying wall starts, prefer the shortest bishop travel distance.
4. If none qualifies, `start wall` makes no comparison and later priorities decide.

## Presentation

The visible help text is exactly:

`Phase 1: Place a bishop in two-square opposition to Black's king, preferring shorter bishop moves, and not increasing distance to Black's king`

## Implementation

Extend the existing `startsWall` eligibility calculation with the squared-Euclidean non-increase condition. The existing nullable wall-move distance and conditional shorter-move subpriority remain unchanged.

## Verification

Tests must prove:

- A wall-starting move that increases distance² is rejected.
- Equal and decreasing distance² remain eligible.
- The shorter move wins among multiple eligible wall starts.
- When every apparent wall start increases distance², the start-wall rule is inert.
- Existing opposition and proximate-wall gates remain intact.
- The exact requested help copy is visible.
- Full rule and presentation suites, diagram consistency, TypeScript, and diff checks pass.
- A fresh seeded cycle stays entirely in Phase 1; entering Phase 2 terminates loop search.
