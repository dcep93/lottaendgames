# Generalized Two Bishops Martian Conclave Step

## Goal

Replace the exact relative-piece `martian conclave step` pattern with a Phase 1 resulting-position rule. Remove the `support wall` priority so martian survivors can reach `king closer` without an intervening king-move preference.

## Resulting-position qualification

Evaluate every legal White move after it is played. A move qualifies when all of the following are true in the resulting position:

- White's king and Black's king are exactly two Chebyshev king steps apart.
- The two White bishops jointly control at least three distinct squares adjacent to Black's king. Adjacent includes orthogonal and diagonal adjacency.
- Every counted square is more than one Chebyshev king step from White's king.

Bishop control uses clear diagonal rays in the resulting board position. Count the union of qualifying squares, so a square controlled by both bishops counts once. A bishop may protect an occupied target square, but intervening pieces block control.

The first martian subpriority prefers qualifying moves over nonqualifying moves. If no surviving move qualifies, it leaves the survivor set unchanged.

## Bishop proximity

Once every surviving move qualifies, prefer the resulting position with the smallest squared Euclidean distance between the two bishops. This is a tie-break inside the same visible `martian conclave step` rule. If no move qualifies, bishop proximity does not filter moves.

All White moves are eligible. A king move may qualify because the target squares and king-distance condition are recalculated after White's turn.

## Priority order

Keep `martian conclave step` in its existing position after `reverse conclave step` and before `finish wall`.

Remove `support wall` completely from the score type, scoring code, ordered rule list, visible guide, explicit cascade tests, and dedicated tests. The order around the removed rule becomes:

1. `finish wall`
2. `start wall`
3. `king closer`

In the supplied position, martian retains `Kc5`, `Kc7`, and `Bd3`. All three keep the bishops one squared-Euclidean unit apart. With `support wall` removed, `king closer` selects `Bd3`: the resulting squared king distance is 4, versus 5 for the king moves.

## Diagram

Replace the existing generated martian diagram with the exact supplied starting FEN:

`8/8/2K1k3/8/3BB3/8/8/8 w - - 4 3`

The diagram must:

- remain labeled Phase 1;
- highlight `e5`, `f5`, and `f6`, the three qualifying squares controlled after `Bd3`;
- draw an arrow from `e4` to `d3`; and
- explain that the resulting bishops control the highlighted squares while the kings remain two steps apart.

The generated diagram source remains authoritative; regenerate the checked-in diagram data rather than editing it by hand.

## Symmetry and scope

The geometric rule has no hard-coded orientation. Translation, rotation, and reflection work automatically because it is calculated from square distances and bishop rays. It applies only when the starting position is Phase 1; Phase 2 selection remains unchanged.

## Verification

Tests must prove:

- the supplied position retains `Kc5`, `Kc7`, and `Bd3` through martian, then selects `Bd3` under `king closer`;
- qualification is based on every candidate's resulting position, including king moves;
- at least three distinct qualifying controlled squares are required;
- blocked bishop rays do not count;
- squared Euclidean bishop proximity breaks qualifying ties;
- translation and all D4 transformations preserve recommendations;
- the old exact-pattern behavior is gone;
- martian remains inactive in Phase 2;
- `support wall` is absent from scoring, selection, guide text, and tests;
- the generated diagram uses the supplied FEN, three highlights, and `e4 -> d3` arrow; and
- focused tests, diagram generation check, lint, TypeScript, and diff checks pass.

After implementation, generate a fresh strict Phase 1 loop using the current policy. Treat entry into Phase 2 as termination, require current ideal White moves throughout and exact board repetition, and open the verified replay on the isolated port 5174 server in the Codex browser.
