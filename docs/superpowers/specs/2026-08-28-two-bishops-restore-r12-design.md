# Restore Two Bishops r12

## Goal

Restore rule r12 and its diagram without changing the current ordinal rule r10.

## Behavior

Rule r12 returns between r10 and r15 with the text: "Prefer bishops off the edge, except 4 squares from the target corner."

An edge bishop receives no r12 penalty when it is exactly four king steps from a target corner belonging to a best-scoring r10 wall. If multiple r10 wall orientations tie for best ordinal distance, either target corner may provide the exception. If the result has no qualifying r10 wall, every edge bishop is penalized.

Restore the diagram from FEN `8/8/8/8/4K3/6k1/3B4/3B4 w - - 12 7`, showing `h1` as the target and `d1` as the exempt edge square.

## Implementation

Have the r10 geometry helper return internal wall profiles containing ordinal distance and target corner. Keep the exported distance helper as a wrapper. Score r10 from the minimum distance and r12 from the target corners tied at that minimum.

## Verification

Focused tests cover rule order and text, the restored diagram, the four-square exception, an ordinary edge penalty, and unchanged ordinal r10 behavior. Then run the exact early-exit search from UI-valid roots and load the first valid four-ply loop at cursor 0.
