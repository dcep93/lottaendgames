# Two Bishops Lazy King Design

## Goal

Replace the mixed global `king closer` behavior with one simple king rule per phase.

## Rendered Rules

> **king closer** — Phase 1: Bring White's king closer to Black's king.

> **lazy king** — Phase 2: Don't move the king, except into the mating position.

Render `lazy king` immediately after `king closer`.

## Behavior

- `king closer` activates only in Phase 1 and minimizes Manhattan distance after a king move.
- `lazy king` activates only in Phase 2 and ranks surviving moves in this order:
  1. a king move into either mating-position square for the existing result-board target corner;
  2. a bishop move;
  3. any other king move.
- The mating-position exception uses the existing target-corner and mating-position geometry; it adds no search or lookahead.
- Earlier priorities remain authoritative; `lazy king` does not revive unsafe, stalemating, wall-breaking, or otherwise eliminated bishop moves.
- If no mating-position king move reaches `lazy king`, the original lazy behavior remains: bishop moves outrank king moves.

## Cleanup

- Remove the `kingCloserModePenalty` score and the Phase 2 established-wall waiting branch.
- Remove starting-wall state used only by that branch.
- Retain shared valid-wall detection used by `phase 2 wall` itself.
- Preserve statelessness and D4 symmetry.

## Verification

- Assert the two visible rules and exact rendered copy.
- Assert Phase 1 still selects the Manhattan-closest king move.
- Assert the supplied Phase 2 loop position uniquely recommends `Kf2`, entering the mating position instead of repeating bishop waits.
- Run focused Two Bishops rules, relevant presentation tests, TypeScript, diagram/diff checks, and the fail-fast loop search.

## Non-goals

- Do not require a Phase 2 bishop move to preserve a wall inside `lazy king`; earlier priorities own that decision.
- Do not change other rules, run the full mate suite, commit, push, or deploy.
