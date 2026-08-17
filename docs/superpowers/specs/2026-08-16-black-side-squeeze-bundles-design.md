# Black-Side Squeeze Bundles

## Goal

Make every Two Bishops rule that references multiple diagonals use adjacent diagonals formed on one side of Black's king. A rule match may not combine diagonals from opposite Black flanks.

## Shared geometry

Represent a squeeze construction as a side-specific bundle containing its adjacent primary, secondary, and, when needed, tertiary diagonals. Each bundle is anchored by the relevant squares on one flank of Black's king and retains that side identity throughout scoring.

For `8/3k4/B7/3K4/8/8/5B2/8 w - - 0 1`, the relevant left-side anchor squares are `b7` and `c8`. They establish the secondary diagonal `a6–b7–c8`; its adjacent primary is `a5–b6–c7–d8`. The bishop on `a6` and a bishop moved to `b6` therefore belong to one left-side bundle. A bishop moved to `h4` belongs to a different construction and cannot be combined with `Ba6` to satisfy the same rule.

Both Black flanks remain eligible where the rule allows two geometric possibilities. Rotation and reflection must preserve side identity.

## Rule behavior

- **Rule S:** its primary, secondary, and tertiary tests use one bundle. A check cannot borrow preparation from the opposite Black flank.
- **Rule U:** secondary occupancy and one-move primary reachability must belong to one bundle.
- **Rule V:** secondary reachability or occupancy and resulting primary control must belong to one bundle. In the supplied position, `Bb6` receives Rule V credit and `Bh4` does not.
- **Rule W:** its two flank diagonals already form a pair; treat each pair as a side-specific bundle and never combine counts across pairs. Urgent setup remains the first diagonal of its selected bundle.

Rule order, Phase 1 restrictions, safety priorities, Black policy, and phase detection remain unchanged.

## Presentation

Do not change rendered rule text or note-board diagrams. The diagrams continue to show the same named diagonals; the implementation now preserves which lines belong together.

## Verification

- `Bb6` is preferred in the supplied Rule V position and `Bh4` is rejected by Rule V.
- Equivalent positions on the other Black flank work.
- All D4 rotations and reflections preserve results.
- Existing Rule S, Rule U, and Rule W canonical fixtures remain correct.
- No rule combines diagonals from opposite bundles.
- Rules remain inactive in Phase 2 where currently specified.
- Focused tests, presentation tests, diagram drift, lint, build, and `git diff --check` pass.
- A fresh strict Phase 1 loop is opened locally, terminating search branches on entry to Phase 2.

## Scope

Do not add new visible rules, descriptions, diagrams, or phase behavior.
