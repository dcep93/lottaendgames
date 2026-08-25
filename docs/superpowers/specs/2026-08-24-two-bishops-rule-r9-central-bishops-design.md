# Two Bishops Rule r9: Central Bishops

## Goal

Add Rule r9 immediately after Rule rr5 and before Rule r so central bishop placement outranks king proximity.

## Behavior

- Evaluate both bishop squares after White's candidate move.
- Count bishops occupying `d4`, `e4`, `d5`, or `e5`.
- Prefer the greater count.
- Apply Rule r9 in both phases without a wall-state gate.
- Keep Rule rr5 as the preceding priority and Rule r as the following tie-break.
- In `8/8/4B3/8/5k2/8/1B2K3/8 w - - 2 2`, Rule r9 retains `Bd4` and `Bd5`; the later Rule x selects `Bd5`.

## UI

The priority guide displays:

> Rule r9 — Prefer central bishops.

## Verification

- Add a focused regression for `Bd5` in the supplied position.
- Verify priority order, focused tests, production build, and the development cycle finder.
- Find a new exact all-ideal loop, replay it in the sidebar, and return it to `cursor=0`.
