# Two Bishops Mate-in-8-ish Pre-entry and Animation Design

## Goal

In `8/8/8/1B6/8/1K2B3/8/4k3 w - - 0 1`, recognize `Kc3` as an
exact mate-in-8-ish pre-entry move. Restore one visible, piece-rendered animated
training board for the resulting continuation.

## Behavior

- Match the current `Wb3/Be1` king geometry when the bishops remain on the
  `a7-g1` and `a6-f1` wall diagonals, including rotations and reflections.
- Prefer exactly `Kc3`.
- After Black's ideal `Kd1`, rejoin the existing matcher at `Bf2`.
- Animate the exact continuation:

  `Kc3 Kd1, Bf2 Kc1, Be2 Kb1, Kb3 Kc1, Be3+ Kb1, Bd3+ Ka1, Bd4#`.

## Presentation

Use the existing `animationFrames` board renderer so the animation uses the
same chess pieces and board styling as the live board. Show the initial frame
for three seconds and subsequent moves with the existing mate-in-8-ish timing.
Do not restore the obsolete A-L diagram collection.

## Verification

- Assert `Kc3` is uniquely ideal with reason `mate in 8 ish`.
- Validate every White move and history-aware Black reply through mate.
- Verify the pre-entry under all rotations and reflections.
- Assert that exactly one new visible animated training board is present.
- Run focused tests, build, lint, and diff checks.
- Revalidate and load an h1-oriented loop at `cursor=0`.
