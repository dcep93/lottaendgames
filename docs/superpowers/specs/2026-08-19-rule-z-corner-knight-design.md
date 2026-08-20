# Rule Z: Corner Knight

## Design

Add `rule z` immediately before `king closer` in both phases. When Black starts White's turn in a corner, prefer moves whose resulting White king is exactly a knight's move from Black's current square. Qualifying moves continue through later tie-breakers.

Rendered text: "If Black's king is in the corner, put White's king a knight's move away."

## Verification

Cover the supplied position and all rotations and reflections, run the focused rule tests, and verify a local loop at `cursor=0`.
