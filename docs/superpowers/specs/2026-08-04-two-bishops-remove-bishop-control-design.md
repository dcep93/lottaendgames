# Remove Two Bishops Bishop Control Design

## Goal

Remove the visible Phase 1 `bishop control` priority from the Two Bishops policy:

> Phase 1: Prefer a bishop to control a square adjacent to Black's king but not adjacent to White's king.

After removal, `king closer` follows `start wall` directly.

## Scope

Remove the priority as a complete policy concept rather than merely hiding or disabling it:

- delete `bishopControlPenalty` from `TwoBishopsWhiteMoveScore`;
- delete its result-position geometry calculation;
- delete the ordered `bishop control` rule;
- delete its visible guide and presentation expectations;
- remove its stage from the explicit pipeline-order test; and
- remove tests dedicated only to bishop-control behavior.

Keep the earlier bishop-control design and implementation commits and design document as historical records. Do not remove unrelated uses of bishop control in degenerate repairs, diagrams, book material, or other mating sets.

## Resulting Policy

All priorities before `start wall` remain unchanged. Once `start wall` finishes filtering, the surviving moves proceed immediately to `king closer`, which uses the newly approved global squared Euclidean distance from the resulting White-king square and then middle-sixteen proximity.

The current `king closer` wording remains unchanged.

## Verification

Tests will establish:

- the visible rule list has `king closer` immediately after `start wall`;
- no Two Bishops move score contains `bishopControlPenalty`;
- the guide no longer renders the removed label or help text;
- the explicit selection-pipeline test matches the shorter order;
- the supplied squared-Euclidean `Bc5 = 5`, `Ke7 = 9` behavior remains intact; and
- recommendations remain D4 symmetric.

Run the focused Two Bishops and presentation tests, lint, TypeScript, and the strict Phase 1 loop finder. Accept a loop only when the start is drill-valid, every White move is ideal, every White position remains Phase 1, the final board repeats exactly, and both the share decoder and local browser accept the URL.
