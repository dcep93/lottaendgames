# Two Bishops Black Resistance Design

## Goal

Make the Two Bishops training guide and Black move evaluator express the same
four resistance priorities in the same order.

## Training copy

The Black resistance introduction remains:

> Black uses its own priorities to put up the strongest resistance. Black is
> not trying to help the mate; it looks for the most stubborn legal reply.

The guide lists these priorities:

1. Return to the previous board position when a legal reply can recreate it.
2. Take a piece if White isn't looking.
3. Move towards the center.
4. Move towards an unprotected bishop.

## Evaluator behavior

Black replies are compared lexicographically. A later priority breaks ties
left by every earlier priority; it never outweighs an earlier priority.

1. If one or more legal replies recreate the previous board position, only
   those replies are eligible.
2. Otherwise, a legal capture of a White bishop beats every non-capture.
3. Tied replies minimize the Black king's distance from the four center
   squares.
4. Remaining ties minimize the Black king's distance from the nearest White
   bishop that is not protected by White's king.

If no unprotected bishop exists, the fourth score is neutral for every move.
Existing legal-move handling and return-to-position detection remain the
source of truth.

## Code boundaries

- `twoBishops.ts` owns Black reply scoring, comparison order, and help copy.
- `twoBishopsGeometry.ts` continues to own center and unprotected-bishop
  distance calculations.
- No unrelated White two-bishop mating priorities or phase logic change.

## Verification

Focused tests must prove:

- the guide renders the four exact priorities in order;
- a return move supersedes ordinary scoring;
- an off-center bishop capture beats a more central non-capture;
- center distance breaks ties after capture status;
- distance to an unprotected bishop breaks remaining ties;
- existing two-bishop fixtures and project checks still pass.
