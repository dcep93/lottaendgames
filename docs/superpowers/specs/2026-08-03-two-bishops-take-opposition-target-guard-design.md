# Two Bishops: take opposition target guard

## Change

Render:

> **take opposition** — Phase 2: Often a waiting move, take opposition with the king, but not moving away from the target corner.

The rule uses the same board-derived target corner as `sequester`. A White king move that increases squared Euclidean distance from that target is rejected by this priority even if it creates direct opposition. Among moves that do not move away, direct opposition remains preferred. Bishop waiting moves preserve the White king's distance.

Add the note:

> Target corner: The corner along Black's edge away from both bishops.

The mechanic remains current-position-only and D4 symmetric. Verification is limited to focused Two Bishops and presentation tests, diagram consistency, TypeScript, diff checking, and the fail-fast loop runner. No browser validation.
