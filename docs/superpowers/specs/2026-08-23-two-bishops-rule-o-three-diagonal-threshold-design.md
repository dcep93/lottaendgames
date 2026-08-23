# Rule O Three-Diagonal Threshold

## Rule

**rule o** — Prefer a bishop wall keeping Black's king in a smaller area from at least 3 diagonals from the corner.

Rule WWW is removed completely.

## Geometry

Each bishop wall already identifies the wall diagonal nearer its associated corner. Rule O qualifies a resulting wall when that nearer diagonal is at least three parallel diagonal bands from the corner. Among qualifying walls, it continues to prefer the smallest Black corner area.

Three diagonal bands is equivalent to the previous minimum four-square corner-area gate for the existing wall geometry, so this change clarifies the unit without intentionally changing move decisions.

Wall screening and escape validation remain unchanged.

## Verification

- Confirm Rule WWW no longer appears or affects scoring.
- Confirm Rule O renders the new wording.
- Prove the three-diagonal gate accepts the former qualifying walls and rejects closer walls.
- Run focused tests, build, lint, and the loop verifier.
- Close extra browser tabs and load one verified loop at `cursor=0`.
