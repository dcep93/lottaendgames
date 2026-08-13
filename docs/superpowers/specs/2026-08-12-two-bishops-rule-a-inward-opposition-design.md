# Two Bishops Rule A: Inward Opposition Control

## Rule

Add immediately before `king closer`:

> **rule a** — Phase 1: Use a bishop to disallow Black from moving towards the center into opposition.

From the starting position, find every square that:

1. is adjacent to Black's king;
2. is closer to the board center than Black's current square; and
3. would put Black's king in direct opposition to White's king.

Rule A is active in Phase 1 only when at least one legal bishop move makes the resulting bishops control or occupy every such square. Prefer those bishop moves and reject all other candidates at this priority. If there is no inward-opposition square or no bishop move can cover all of them, leave every candidate tied.

In `8/1B4k1/3BK3/8/8/8/8/8 w - - 2 2`, the target is `g6`; `Be4` controls it and must survive Rule A before `king closer`.

## Verification

Add direct scoring, integration, Phase 2 inactivity, and D4-symmetry coverage. Update rendered guidance and ordered-rule expectations. Run the Two Bishops, presentation, TypeScript, lint, and diagram checks. Find an exact Phase 1 cycle while treating Phase 2 entry as successful termination, then open the local replay on port 5173.
