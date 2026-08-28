# Two Bishops Two-Rule Experiment

## Goal

Replace the current Two Bishops technique catalog with a deliberately small policy so its failures are easy to study. Preserve only the three universal priorities: mate, bishop safety, and avoiding stalemate.

## Technique priorities

1. **rule r10** — Prefer controlling adjacent diagonals, minimizing Black's confined area to the corner.
2. **rule r15** — Prefer king proximity.

For `r10`, the two bishops form a wall when their occupied diagonals are parallel and adjacent. For every available wall orientation, count the board squares on the outer side containing Black's king; this is the corner-side confined area. A move that forms such a wall beats one that does not, and the smallest confined area wins. This is a geometric wall measurement rather than a flood-fill or a count of Black's immediate legal replies.

For `r15`, compare White-to-Black king distance in king steps (Chebyshev distance). The smaller distance wins.

## Cleanup

Remove the old Two Bishops technique rules, Phase 2 teaching notes and rule diagrams, obsolete score/context fields, and tests that specify the deleted policy. Keep shared chess helpers only when the new policy or another exported Two Bishops behavior still uses them.

## Verification and loop delivery

Add focused tests for the exact five-rule ordering and both new metrics. Run TypeScript and the focused Two Bishops suite. Then use the exhaustive cycle search with White restricted to all tied best moves and Black allowed any legal reply. Stop at the first valid loop, prefer a four-ply cycle when available, and load its URL at cursor 0 in a single in-app browser tab.

