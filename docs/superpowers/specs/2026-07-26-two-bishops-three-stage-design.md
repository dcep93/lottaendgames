# Two Bishops Three-Stage Policy

## Goal

Replace blended Phase 1 move scoring with a stateless, D4-symmetric teaching
sequence that matches the visible method:

1. Form a side-by-side bishop wall.
2. Keep that wall fixed while White's king forces Black farther from it.
3. Advance the side-by-side wall so Black's reachable region moves toward an
   edge.

The complete policy must remain at or below eight visible White priorities,
depend only on the current board, preserve `Bc2` followed by `Bd2` in the
required line, and eventually verify below ten raw D4-reduced cyclic SCCs.

## Phase 1 Mechanics

### Form the wall

If the bishops are not side by side, prefer safe quiet bishop moves that make
them side by side. Among those moves, keep bishops off the board edge and then
minimize Black's bishop-defined reachable region.

### Push with the king

Once the bishops are side by side, do not move either bishop while a safe
non-screening king move forces progress. A king move forces progress when,
after every legal Black reply, Black's minimum Chebyshev distance from either
bishop is strictly greater than it is now. Among forcing king moves, maximize
that guaranteed distance, then minimize White-to-Black king distance after
Black's farthest reply.

This is a bounded one-move/all-replies geometric test, not history, a
tablebase, mate distance, or an arbitrary lookahead score.

### Advance the wall

When no king move forces Black farther from an already adjacent wall, make a
safe quiet bishop move that keeps the bishops side by side. Prefer fewer
edge-bound bishops, then minimize Black's reachable region. Bishop-square
color may break a remaining exact tie but must never outrank wall shape or
cage progress.

### Wait

Use a waiting move only when no wall-forming, forcing-king, or wall-advancing
move exists. It must preserve safety and the current wall/cage as far as
possible. Waiting is a fallback, not a competing strategic phase.

## Phase 2

Retain one visible `edge finish` rule during this iteration. It owns edge
holding, corner drive, king support, opposition, forcing checks, and its
fallback. Phase 2 changes are deferred until Phase 1 no longer dominates the
bounded loop census.

## Verification Workflow

1. Exact fixtures: `Bc2`, then `Bd2`; `Bb2` must lose to `Bc2` in the reported
   Phase 1 witness.
2. Replay each current representative Phase 1 SCC witness.
3. Run a tiny deterministic prefix or focused corpus gate and stop as soon as
   a few dozen SCCs reveal a structural problem.
4. Promote every new witness.
5. Use the larger fixed-seed adversarial corpus only for candidates that pass
   focused gates.
6. Run the complete Standard universe only after the visible rules are frozen.

## Acceptance

- No more than eight visible White priorities.
- Every move-eliminating comparison is described by its owning visible rule.
- Current-position-only recommendations and reasons, ignoring FEN counters.
- D4 symmetry.
- No proof distance, tablebase, history, hidden selector, or unrendered
  exception.
- Fewer than ten raw D4-reduced cyclic SCCs on final verification.
