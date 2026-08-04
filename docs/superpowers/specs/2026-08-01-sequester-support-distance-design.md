# Sequester Support-Distance Design

## Goal

Make Sequester's displayed priority order real: after keeping Black on the edge, prefer the move that brings White's king closest to a corner's knight-move support square. Only then compare whether Black is forced toward White's proximate corner.

## Design

Replace the binary `sequesterSupportRetentionPenalty` (better-or-equal versus worse) with the resulting numeric support distance already calculated by the policy. Compare that distance before `sequesterNonCornerApproachReplyCount`. Keep the phase trigger, edge-confinement comparison, corner-direction comparison, and rendered rule text unchanged.

This remains board-position-only and symmetric. It adds no selector, lookup, history, or search.

## Verification

Add a semantic regression for `8/8/8/8/4KB2/5B1k/8/8 w - - 2 2` proving that the closer support-square move survives ahead of `Kf5`. Run focused Two Bishops rule tests, TypeScript, and the existing fail-fast development gate to obtain one local loop witness.
