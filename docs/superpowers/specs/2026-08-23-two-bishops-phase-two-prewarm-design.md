# Two Bishops Phase-Two Prewarm Design

## Goal

No board interaction on the Two Bishops trainer may pay the roughly two-second cost of constructing the fixed Phase-2 A–K pattern graph. That work belongs to page initialization.

## Design

Expose an idempotent Phase-2 graph initializer beside the existing lookup functions. When `MateWorkspace` initializes a Two Bishops drill, call that initializer synchronously before creating the session or rendering an interactive board. The module-level graph cache remains the single source of truth, so initialization and later move analysis share the same graph instance.

This keeps the cost scoped to the Two Bishops page. Other mate trainers do not build the graph, and no loading race is possible: the board cannot accept a move until the synchronous initialization call has returned.

## Behavior

- Chess priorities and selected moves remain unchanged.
- The first Two Bishops page initialization performs the graph construction once.
- Every later hint, validation, and Play Best calculation uses the already-built graph.
- Remounting the trainer is cheap because initialization is idempotent for the lifetime of the page.

## Verification

- Unit-test that explicit initialization preserves the known Phase-2 move lookup.
- Render the Two Bishops workspace and confirm initialization occurs before interactive session work.
- Benchmark the exact FEN `8/8/8/8/6K1/8/4B3/4B1k1 w - - 6 4` after initialization; it must still choose `Kg3` without rebuilding the graph.
- Run the focused Two Bishops tests and production build.
