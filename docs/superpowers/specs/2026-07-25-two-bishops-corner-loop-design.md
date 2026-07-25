# Two Bishops corner-loop repair

## Failure

Without the internal proof filter, the position

`8/8/8/1B6/8/B7/2K5/k7 b - - 11 6`

can repeat after:

`Ka2 Bc1 Ka1 Bh6 Ka2 Bf8 Ka1 Ba3`

The existing `waiting move` priority selects `Bh6` even though White already
has the standard supported corner check.

## Rule

Add this position-only priority before `waiting move`:

> **corner check** — When Black is in a corner and White's king controls the
> nearby escape squares, check with a bishop beside White's king.

A move satisfies the rule when Black begins in a corner, the bishop move gives
check, the moved bishop finishes beside White's king, and phase 2 remains
intact. If no move satisfies those conditions, the rule leaves all candidates
tied.

## Safety

Keep the internal proof filter as a fallback while validating the human rule.
The new rule must independently choose `Bb2+` with the internal filter removed,
break the eight-ply cycle, preserve the established corner-wait regressions,
and keep the exhaustive proof certificate valid.
