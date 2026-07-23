# Two Bishops Static Completion Policy

## Goal

Teach KBB-v-K with rules a human can recognize from the current board while
guaranteeing that every recommended White move survives every legal Black
reply. From every supported generated start, the policy must mate without a
repetition or 50-move draw.

White's decision must not read move history. Rotating or reflecting a position
must preserve the decision.

## Policy

White compares legal moves in this order:

1. `mate` — Checkmate immediately when it is available.
2. `pieces safe` — Do not leave a bishop available for Black to take.
3. `no stalemate` — Do not stalemate Black.
4. `no backtracking` — Every Black reply must shorten the remaining forced
   mate. One corner waiting move may hold the distance while changing the
   bishops from close together to separated.
5. `waiting move` — When White's king holds Black back, move a bishop without
   loosening the net so Black must give ground. Near the corner, use the
   corner-color bishop while the bishops are close; then continue with the king
   or other bishop.
6. `corner support` — Move White's king toward a mating-support square a
   knight's move from the target corner without letting Black leave the edge.
7. `keep phase two` — Enter or remain in phase 2.
8. `take direct opposition` — Put White's king two squares in front of Black's
   king.
9. `avoid bishop screening` — Keep White's king from blocking a bishop ray to
   Black's king.
10. `bishops together` — Keep the bishops beside each other so their diagonals
    form a wall.
11. `coordinate bishops` — Use that wall to shrink Black's reachable region.
12. `king closer` — Move White's king closer to Black's king.

The modal presents these exact priorities with short lowercase titles. The
evaluator may contain geometric edge-case handling inside a named rule, but it
must never contradict the displayed action.

## Position-Only Completion Guard

`no backtracking` is a filter, not a shortest-mate tie-break. Human rules choose
among every move that passes it.

The repository contains a compact White-to-move KBB-v-K distance-to-mate table.
It is generated offline from the Gaviota four-piece tablebase, reduced by all
eight board symmetries, and bundled with the app. Runtime lookup:

- reads only the current board;
- makes no engine or network request;
- ignores halfmove and fullmove counters;
- returns the same value under every rotation and reflection.

For an ordinary White move, the largest distance after any legal Black reply
must be smaller than the current distance.

The single allowed equal-distance case is the supported-corner waiting pattern:

- the move is selected by the visible `waiting move` geometry;
- the bishops start at most three king moves apart;
- the move leaves the bishops more than three king moves apart.

Black cannot change the bishop distance. Therefore the equal-distance exception
cannot be selected on the following White turn. A strictly decreasing move must
occur before another corner wait can become eligible.

## Proof

The generated table contains 386,792 winning canonical entries. Every nonzero
White-turn distance is odd, and the maximum is 37 plies.

An ordinary policy turn lowers the distance by at least two plies. A corner
wait can happen at most once between two ordinary decreasing turns. The worst
case is therefore:

- 19 decreasing White turns;
- at most 19 waiting White turns;
- 75 total plies.

That is below the 100-ply 50-move threshold from every generated Standard root.
The verifier separately checks the stored halfmove clock and proof distance of
each curated Training Wheels seed.

Because distance strictly falls at least every other White turn, returning to a
previous board position is impossible.

## Winning Root Boundary

Standard generation uses opposite-colored bishops and rejects a legal root when
White has no first move that mates or leaves both bishops present after every
legal Black reply. This excludes unavoidable capture-or-stalemate draws, which
KBB-v-K cannot force-mate from.

Training Wheels positions are symmetry transforms of curated legal seeds.

## Verification

`npm run verify:mate -- --mate two-bishops` audits the complete decoded proof
table, its metadata, the ordered proof-rule prefix, the progress predicate, the
global 75-ply bound, and each curated seed's halfmove clock. It does not expand
a large in-memory game graph.

Focused regressions cover:

- the requested first move `Bh6`;
- the required follow-up `Kg5` instead of reversing with `Bf8`;
- both previously found four-ply supported-corner oscillations;
- all eight board symmetries;
- independence from FEN move counters;
- the proof-table size, maximum distance, and one-way wait predicate.
