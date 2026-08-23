# Rule A Stage-Exact Selection

## Problem

Rule A currently rewards king moves that merely reduce the distance to a square a knight's move from the mating corner. In `8/8/8/8/5K2/5B2/5B1k/8 w - - 0 1`, that makes `Ke3` a Rule A move even though the king does not land a knight's move from the corner.

## Design

Rule A will contribute a preference only when a legal move completes its current stated stage:

- a king move lands directly on a Rule A king target;
- a bishop vacates a safe, adjacent king target so the king can occupy it next;
- with the king already on target, a bishop establishes the corner-cage diagonal;
- with the cage complete, the move follows the existing waiting-move or forced-mate logic.

When Rule A has made no progress and none of the first two actions is legal, its evaluation is inactive. It will not score approach distance or label an approach move as Rule A.

## Verification

- Add a regression test proving Rule A is inactive for the supplied FEN.
- Preserve the existing direct king-placement and bishop-vacating tests.
- Run focused Two Bishops tests, diagram validation, build, and the fast loop verifier.
- Load a verifier-produced loop at `cursor=0` and replay it in the browser.
