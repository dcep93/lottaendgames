# Two Bishops Global King Closer

## Goal

Make king proximity the governing comparison in both phases without allowing
the Phase 2 opposition rule to reject a king move merely because it moves away
from the target corner.

## Design

- Keep the visible label `king closer` and render: “Bring White's king as close
  as possible to Black's king.”
- Keep the Phase 1 wall-building rules ahead of `king closer` so wall formation
  remains the Phase 1 strategy.
- Make `king closer` apply in both phases.
- Keep the visible label `take opposition` and the useful text stem: “Phase 2:
  Often a waiting move, take opposition with the king.”
- Place `take opposition` after `king closer`.
- Define opposition solely from the resulting White-king square against Black's
  current king square. Remove its target-corner distance condition.

In `8/8/5K2/8/8/5B1k/5B2/8 w - - 0 1`, the earlier Phase 2 rules retain the
eligible moves and global `king closer` uniquely selects `Kf5`.

## Verification

- Add a focused regression for unique `Kf5` and reason `king closer`.
- Update rule-order and rendered-copy assertions.
- Preserve the existing D4, statelessness, legality, safety, mate, and stalemate
  checks.
- Run only the focused Two Bishops and directly affected presentation checks,
  TypeScript, diagram validation, diff validation, and the fail-fast loop gate.

