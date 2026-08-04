# Two Bishops: Bishops Off Edge

## Goal

Give the Phase 2 edge preference its own visible priority and let the Phase 2 wall rule judge wall geometry independently.

## Priority order

Insert `bishops off edge` immediately before `bishops away`. The surrounding Phase 2 order becomes:

1. `sequester`
2. `bishops off edge`
3. `bishops away`
4. `phase 2 wall`

## Bishops off edge

Rendered text:

> **bishops off edge** — Phase 2: Prefer fewer bishops on Black's edge.

For every candidate White move in Phase 2, count the bishops on the edge occupied by Black's king in the resulting position. A lower count is better, so zero bishops beats one and one beats two. The rule is inactive outside Phase 2.

## Phase 2 wall

Rendered text:

> **phase 2 wall** — Phase 2: Create or maintain a 2 square wall adjacent to Black's king and opposite the target corner.

Remove the wall matcher's blanket rejection of positions containing a bishop on Black's edge. Its remaining geometry stays unchanged: the two-square wall must be adjacent to Black's king, opposite the target corner, controlled by the two bishops, and must not touch White's king.

## Verification

Focused tests will prove the displayed order and text, the complete 0 < 1 < 2 bishop-edge ordering under D4 symmetry, Phase 1 inactivity, and acceptance of an otherwise-valid Phase 2 wall even when a bishop is on Black's edge. Existing directly affected Two Bishops tests, TypeScript, diagram generation, and diff checks remain the proportional gate. Afterward, find and return one refreshable all-Phase-2 loop.

