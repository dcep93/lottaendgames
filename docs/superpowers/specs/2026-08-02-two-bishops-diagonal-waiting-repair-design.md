# Two Bishops Diagonal Waiting Repair

## Correction

The prior King advance repair modeled the wrong Black reply. Replace it with the actual post-`Kg8` position from the supplied line.

## Canonical Geometry

- Black king: `g8`
- White king: `e6`
- White bishops: exactly `e8` and `f6`
- Repair: `Be8–h5`

Recognize only the eight board-wide D4 rotations and reflections. Do not permit translations or alternate bishop squares.

## Ordering and Presentation

Name the subtype `degenerate — diagonal waiting move` and evaluate it before the broader Diagonal king step, because the same board is otherwise reinterpreted as a reflected Diagonal king step and sent back with `Kf5`.

Remove the King advance matcher and replace its diagram with the corrected `Bh5` diagram. Keep the initial `h7` Diagonal king step, so `Ke6` remains correct before Black replies `Kg8`.

## Verification

- The initial `h7` position still uniquely recommends `Ke6`.
- The post-`Kg8` position uniquely recommends `Bh5` with the new subtype reason.
- All eight board-wide D4 transforms select the transformed bishop move.
- Translations and altered bishop squares do not match.
- Run focused Degenerate and diagram tests, TypeScript and diff checks, then the fail-fast loop gate.

