# Two Bishops Phase 2 Wall No Corners Design

## Goal

Exclude corner walls from the visible Phase 2 wall strategy.

## Rendered Rule

> **phase 2 wall** — Phase 2: Create or maintain a 2 square wall not on the same side as the white king or in the corner, without placing a bishop on black's edge.

## Mechanics

- Keep deriving the candidate wall on the side of Black's king away from White's king.
- Reject a candidate when its edge square is one of the four board corners.
- Retain the requirements that both bishops control the two wall squares and neither bishop occupies Black's edge.
- If every candidate is a corner wall, `phase 2 wall` is inactive and later visible rules decide the move. Do not retain the corner wall as a fallback.
- Preserve current-position-only behavior and D4 symmetry.

For `8/6B1/8/3B4/5K2/8/7k/8 w - - 4 3`, `Bd4` controls `h1/g1`; because `h1` is a corner, this no longer qualifies as a Phase 2 wall.

## Verification

- Assert the supplied position has no applicable non-corner Phase 2 wall and `Bd4` receives no special wall preference.
- Assert existing approved non-corner walls still qualify under every D4 transform.
- Update exact rendered-copy assertions.
- Run focused Two Bishops rules, directly affected presentation checks, TypeScript, diagram consistency, diff hygiene, and the root-local fail-fast loop finder.

## Non-goals

Do not change Phase 2 classification, Degenerate patterns, `sequester`, `king closer`, Black policy, or the diagram's approved non-corner example. Do not run the full mate suite, browser validation, SCC census, commit, push, or deploy.
