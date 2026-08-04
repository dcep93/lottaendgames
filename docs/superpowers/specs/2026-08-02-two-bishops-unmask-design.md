# Two Bishops Unmask Rule Design

## Goal

Add a visible, stateless Phase 2 rule immediately after `force opposition`:

> **unmask** — Phase 2: Ensure White's king doesn't mask a bishop, preferring adjacent bishops.

## Geometry

A bishop is masked when White's king lies on one of that bishop's diagonal rays with no intervening piece. The definition uses only the resulting board position and is invariant under every rotation and reflection of the board.

## Selection

The rule applies only to Phase 2 candidates and has two ordered subpriorities:

1. Prefer moves whose resulting position has no bishop masked by White's king.
2. Among the survivors, prefer moves whose resulting bishops are adjacent by king distance.

The rule is placed after `force opposition` and before `force phase 2`. It cannot restore moves eliminated by earlier rules. In `8/8/8/8/8/7k/2B2K2/4B3 w - - 2 2`, `sequester` already eliminates `Bd2`, so the new rule does not make `Bd2` correct there.

The existing bishop-distance preference is removed from `sequester` and consolidated into `unmask` as the adjacency subpriority. This keeps the rendered preferences mechanically meaningful: `sequester` owns edge and corner confinement, while `unmask` owns bishop usability and cohesion.

## Verification

- Assert the visible rule order and exact rendered copy.
- Add a focused Phase 2 fixture where candidates survive through `force opposition`, then prove the first subpriority removes a masked result.
- Add a focused tie fixture proving adjacency is preferred only after masking ties.
- Check transformed versions of the core fixture to protect D4 symmetry.
- Run focused Two Bishops tests, the directly affected presentation test, targeted TypeScript, and diff hygiene.
- Run the small fail-fast Two Bishops gate and return one verified localhost loop.

## Non-goals

- Do not reorder `sequester` or change its edge and corner priorities.
- Do not change phase classification, Black priorities, diagrams, or other mating rules.
- Do not run the full mate suite, commit, push, or deploy.
