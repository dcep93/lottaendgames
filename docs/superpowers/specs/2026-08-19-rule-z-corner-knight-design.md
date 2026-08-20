# Rule Z: Corner Knight

## Design

Add `rule z` immediately before `king closer` in both phases. When Black starts White's turn in a corner, prefer moves whose resulting White king is exactly a knight's move from Black's current square. When Black is instead one edge-square from that corner and White's king remains a knight's move from the corner, require a bishop move that controls the next edge-square away from the corner. Qualifying moves continue through later tie-breakers.

Rendered text: "If Black's king is in a corner, put White's king a knight's move away. If Black is one edge-square from that corner, use a bishop to control the next edge-square away from the corner."

## Verification

Cover `Kg3` and the `Be6` follow-up in all rotations and reflections, run the focused rule tests, and verify a local loop at `cursor=0`.
