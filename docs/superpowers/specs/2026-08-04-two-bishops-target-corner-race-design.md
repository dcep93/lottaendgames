# Two Bishops Target-Corner Race Design

## Goal

Improve the target-corner fallback so it chooses the corner where White has the better king race, rather than merely the corner closest to White.

For `8/8/8/8/2K5/2B5/k1B5/8 w - - 10 6`, the target must be `a8`.

## Definition

Keep the existing first case: after a candidate White move, if a completed two-square bishop wall forces every legal Black reply along the edge in one direction, that direction determines the target corner.

Otherwise:

1. For each corner on Black's edge, calculate `White king distance − Black king distance` using Chebyshev distance.
2. Prefer the smaller value. This selects the corner where White has the greater relative king-distance advantage.
3. On an exact tie, enumerate completed two-square walls controlled by distinct bishops. Use the nearest wall to Black and select the corner on Black's side of that wall—the corner into which the wall already cages Black.
4. If no wall resolves the tie, or equally near walls cage Black toward both corners, retain both corners as valid targets.

## Architecture

- Change only candidate-result target-corner fallback scoring and wall enumeration.
- Reuse the same wall definition for forced-direction detection and the fallback tie-break.
- Preserve candidate-specific targets, immediate legal-reply analysis, statelessness, D4 symmetry, and all visible rule ordering.
- Update the rendered target-corner note to state the relative king race and wall tie-break.

## Verification

- The supplied `a2/c4` position and all D4 equivalents use `a8`.
- The earlier `h3/f2` position continues to prefer `h1` when the reply-direction case does not decide it.
- Add exact race-tie fixtures for a nearest wall on either side and an unresolved no-wall tie.
- Preserve forced-reply target fixtures and cosine-alignment behavior.
- Run focused Two Bishops rules, directly affected presentation, TypeScript, diagrams, diff checks, and a Phase-2-only loop scan.

## Non-goals

- No deeper move search, proof distance, history, or change to Phase 2.
