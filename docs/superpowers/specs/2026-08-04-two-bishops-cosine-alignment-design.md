# Two Bishops Cosine Alignment Design

## Goal

Replace `bishops away` squared distance with an independent cosine alignment for each bishop. In the supplied Phase 2 position, the rule must select `Be7` instead of the cycling `Ba2`.

## Definition

For each resulting bishop, calculate `cosine(edge, target corner, bishop)`:

- The vertex is the candidate's resulting target corner.
- The first ray runs from the target corner along Black's current edge toward its other corner.
- The second ray runs from the target corner to the bishop.
- Calculate each bishop independently, add the two cosine values, and prefer the larger total.
- A bishop on the target corner has a zero-length second ray and contributes `0`.
- If the target-corner definition retains both corners, calculate the total for each and use the larger valid total without choosing an arbitrary orientation.
- If Black is already in a corner, use the better of its two incident edge rays for each bishop.

The metric is based only on the candidate resulting board and is D4-symmetric.

## Presentation

Render:

> **bishops away** — Phase 2: Maximize cosine(edge, target corner, bishop) for each bishop.

## Verification

- `2k5/5B2/2KB4/8/8/8/8/8 w - - 0 1` must uniquely recommend `Be7` under `bishops away`.
- Verify the numeric ordering `Be7 > Be6+ > Bd5 > Ba2` among the relevant `sequester` survivors.
- Apply the `Be7` fixture through every D4 transform.
- Preserve target-corner, universal safety, statelessness, and symmetry tests.
- Run focused Two Bishops rules, directly affected presentation, TypeScript, diagrams, diff checks, and the small Phase-2-only loop scan.

## Non-goals

- No bishop-to-bishop angle.
- No rule reordering, search, history, or witness-specific selector.
