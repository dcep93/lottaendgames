# Rule U Secondary Occupancy and Rule W Urgent Flank

## Goal

Correct Rule U's secondary-diagonal prerequisite and let Rule W reward the urgent flank diagonal before the complete flank pair exists.

## Rule U

Keep Rule U's rendered text and priority position unchanged.

For each legal White king move that takes direct opposition after a knight-separated starting position:

1. derive the prospective primary squeeze diagonal;
2. define Rule U's secondary diagonal as the adjacent parallel diagonal on White's side of primary;
3. require one bishop to occupy that secondary diagonal; and
4. require the other bishop, currently off primary, to have a clear legal move onto primary.

Attacking an empty square on secondary does not satisfy Rule U. In `8/8/8/8/5K2/BB6/6k1/8 w - - 0 1`, neither bishop occupies the `a6–b5–c4–d3–e2–f1` secondary diagonal, so Rule U does not apply. The earlier `Kd7` fixture continues to apply because `Bd3` occupies its prospective secondary diagonal.

## Rule W

Keep Rule W's rendered text, priority position, and diagram unchanged.

Rule W has two modes:

1. **Completed pair:** when the starting bishops already occupy both flank diagonals, preserve the existing preference for retaining both.
2. **Urgent setup:** when the kings are a knight's move apart, Rule U is inactive, and a legal move can occupy the urgent flank diagonal, prefer positions occupying that urgent diagonal before considering the other flank diagonal.

The urgent flank diagonal is the first, nearer flank diagonal in the existing king-relative Rule W pair. In the supplied position it is `e6–f5–g4–h3`, so `Be6` is uniquely preferred over `Be7` and king moves.

The existing two-diagonal-step Rule W behavior remains completed-pair-only.

## Verification

- The supplied position makes Rule U inactive and uniquely prefers `Be6` under Rule W.
- The earlier Rule U fixture still uniquely prefers `Kd7`.
- Rotation and reflection equivalents preserve both results.
- Rule U and Rule W remain Phase 1-only.
- Existing completed-pair Rule W fixtures remain unchanged.
- Presentation confirms no rendered wording or diagram changes.
- Focused tests, diagram drift, lint, build, and `git diff --check` pass.
- A fresh strict Phase 1 loop is opened locally, with Phase 2 treated as termination.

## Scope

Do not change Rule S, Rule T, Rule V, king closer, Black's policy, phase detection, or diagram assets.
