# Two Bishops Rule W3 and Rule W1 Removal Design

## Goal

Add a Phase 1 preference that keeps the outer bishop of the tightest resulting wall off the board edge, and remove Rule W1 from the active policy.

## Rule W3 Behavior

- Render: **Phase 1: Prefer outer wall bishop off the edge.**
- Evaluate the position after White's candidate move.
- Apply only when the resulting position is Phase 1 and has at least one recognized bishop wall.
- Select the resulting wall that confines Black to the smallest area, using the existing tightest-wall ordering.
- Identify the outer bishop as the bishop controlling that wall's farther diagonal.
- Give zero penalty when that bishop is not on a board-edge square and one penalty when it is on an edge.
- If no resulting wall exists, Rule W3 is inactive.

## Rule W1 Removal

- Remove Rule W1 from the active rule order and Training Info.
- Keep Rule W1 implementation helpers and score fields when other code or tests still depend on them; this change removes the priority rather than performing unrelated cleanup.

## Ordering

Rule W3 is immediately after Rule WZ and immediately before Rule W. Removing Rule W1 leaves Rule W2 as the Phase 2 wall priority before King Closer.

## Verification

- Assert exact Rule W3 text and active order.
- Assert Rule W1 is absent from the active policy and rendered help.
- Assert Rule W3 distinguishes an edge outer bishop from an off-edge outer bishop in Phase 1.
- Assert the tightest wall determines the scored outer bishop when multiple walls exist.
- Assert Rule W3 is inactive in Phase 2 and without a resulting wall.
- Assert rotation/reflection invariance.
- Run focused tests, build, lint, the development verifier, and load a validated cycle at `cursor=0`.
