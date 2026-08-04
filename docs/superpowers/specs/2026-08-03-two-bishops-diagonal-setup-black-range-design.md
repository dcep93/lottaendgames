# Two Bishops diagonal-setup Black range

## Goal

Broaden the existing `degenerate — diagonal setup` family without adding a new visible rule or reason. In canonical orientation, Black's king may occupy `h5` or `h6`; the existing White-piece geometry, repair move, phase restriction, translations, and D4 symmetry remain unchanged.

## Design

`getRelativeDiagonalSetupDegenerateRepair` will compare Black's king with two canonical relative offsets from White's king: `(2, -1)` and `(2, 0)`. The stationary bishop, moving bishop, and repair target retain their current relative offsets. A match still requires the prescribed bishop move to be legal.

The rendered label and caption remain:

- `degenerate — diagonal setup`
- `Place the bishop on the highlighted diagonal.`

No other degenerate family, rule ordering, diagram, or scoring mechanism changes.

## Verification

- Extend the focused diagonal-setup test across canonical `h5` and `h6` Black-king positions.
- Verify every case under all D4 transforms.
- Retain the existing near-miss and blocked-path checks.
- Run the focused Two Bishops rule tests, TypeScript, and `git diff --check`.
- Run the fail-first Two Bishops development search and provide one refreshable localhost cycle.
